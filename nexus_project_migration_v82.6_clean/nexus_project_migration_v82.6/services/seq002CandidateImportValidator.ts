import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CandidateValidationCheck,
  CandidateValidationReport,
  CinematicExtractionResult,
  RepairSuggestion,
  SEQ002_CANDIDATE_IMPORT_VALIDATOR_VERSION,
  Seq002CandidateImportValidatorResult,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { buildExpansionReadinessGatePreview } from './expansionReadinessGate';
import { buildLabImportIngestionContractPreview } from './labImportIngestionContract';
import { buildSeq002ExpansionSimulationPreview } from './seq002ExpansionSimulation';
import { isEmptyValue } from './pipelineBridge';

export const SEQ002_CANDIDATE_IMPORT_VALIDATOR_EPOCH = '2026-05-26T22:00:00.000Z';

const PRIMARY_CANDIDATE_FILE = 'data/pipeline_b_lab_records.json';
const FALLBACK_CANDIDATE_FILES = [
  'data/lab_import_records.json',
  'storage/pipeline_b_import.json',
] as const;

const CARRYOVER_THRESHOLD = 0.85;

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function ratio(count: number, total: number): number {
  if (total <= 0) return 0;
  return round6(count / total);
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

export interface CandidateLoadResult {
  sourceFile: string | null;
  records: CinematicExtractionResult[];
}

/** Readonly scan — never mutates candidate files. */
export function loadSeq002CandidateRecords(): CandidateLoadResult {
  const searchPaths = [PRIMARY_CANDIDATE_FILE, ...FALLBACK_CANDIDATE_FILES];

  for (const relativePath of searchPaths) {
    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) continue;
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
      if (Array.isArray(parsed)) {
        return { sourceFile: relativePath, records: parsed as CinematicExtractionResult[] };
      }
      if (parsed && typeof parsed === 'object') {
        return { sourceFile: relativePath, records: [parsed as CinematicExtractionResult] };
      }
    } catch {
      continue;
    }
  }

  return { sourceFile: null, records: [] };
}

function hasTemporalBridge(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.production_v72?.temporal_bridge) ||
    !isEmptyValue(scene.production_v82?.temporal_bridge) ||
    !isEmptyValue(scene.temporal_bridge)
  );
}

function hasCharacterCarryover(scene: CinematicExtractionResult): boolean {
  const hasCharacterAtoms = (scene.visual_atoms ?? []).some(
    (atom) =>
      atom.label?.includes('subject') ||
      atom.label?.includes('character') ||
      atom.label?.includes('witness')
  );
  return !isEmptyValue(scene.character_persistence) || hasCharacterAtoms;
}

function hasEnvironmentCarryover(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.scene_state?.physics) ||
    !isEmptyValue(scene.canonical_dna?.domains?.atmosphere) ||
    !isEmptyValue(scene.director_dna?.lighting_behavior)
  );
}

function hasUsefulRelationshipGraph(scene: CinematicExtractionResult): boolean {
  const edges = scene.relationship_graph ?? [];
  const weighted = edges.filter((e) => (e.weight ?? 0) > 0.4).length;
  return edges.length >= 3 && weighted >= 2;
}

function sceneHasContractField(scene: CinematicExtractionResult, field: string): boolean {
  switch (field) {
    case 'temporal_bridge':
      return hasTemporalBridge(scene);
    case 'character_persistence':
      return hasCharacterCarryover(scene);
    case 'emotional_carryover':
      return (
        !isEmptyValue(scene.emotional_carryover) ||
        !isEmptyValue(scene.scene_state?.emotion)
      );
    case 'camera_rhythm_memory':
      return (
        !isEmptyValue(scene.camera_rhythm_memory) ||
        !isEmptyValue(scene.director_dna?.camera_motion)
      );
    default: {
      const record = scene as Record<string, unknown>;
      return !isEmptyValue(record[field]);
    }
  }
}

function validateSceneCount(
  records: CinematicExtractionResult[],
  minScenes: number,
  maxScenes: number,
  fileFound: boolean
): CandidateValidationCheck {
  const count = records.length;
  const passed = fileFound && count >= minScenes && count <= maxScenes;
  return {
    check_key: 'scene_count_1_to_20',
    label: 'Scene count 1–20',
    passed,
    detail: !fileFound
      ? `Candidate file not found at ${PRIMARY_CANDIDATE_FILE}`
      : `${count} scene(s) (required ${minScenes}–${maxScenes})`,
  };
}

function validateRequiredFields(
  records: CinematicExtractionResult[],
  requiredFields: string[],
  fileFound: boolean
): { check: CandidateValidationCheck; fieldCoverage: Record<string, number> } {
  const fieldCoverage: Record<string, number> = {};

  if (!fileFound || records.length === 0) {
    for (const field of requiredFields) {
      fieldCoverage[field] = 0;
    }
    return {
      check: {
        check_key: 'required_fields_16',
        label: 'Required fields (16)',
        passed: false,
        detail: 'No candidate records to validate',
      },
      fieldCoverage,
    };
  }

  let allPass = true;
  const failures: string[] = [];

  for (const field of requiredFields) {
    const covered = records.filter((s) => sceneHasContractField(s, field)).length;
    const coverage = ratio(covered, records.length);
    fieldCoverage[field] = coverage;
    if (coverage < 1) {
      allPass = false;
      failures.push(`${field}:${coverage}`);
    }
  }

  return {
    check: {
      check_key: 'required_fields_16',
      label: 'Required fields (16)',
      passed: allPass,
      detail: allPass
        ? `All ${requiredFields.length} required fields present on every scene`
        : `Missing fields on some scenes: ${failures.slice(0, 4).join(', ')}${failures.length > 4 ? '…' : ''}`,
    },
    fieldCoverage,
  };
}

function validateTimestampsMonotonic(records: CinematicExtractionResult[]): CandidateValidationCheck {
  if (records.length === 0) {
    return {
      check_key: 'timestamps_monotonic',
      label: 'Timestamps monotonic',
      passed: false,
      detail: 'No candidate records',
    };
  }

  let valid = true;
  for (const scene of records) {
    const start = scene.scene_indexing?.v_timestamp_start;
    const end = scene.scene_indexing?.v_timestamp_end;
    if (typeof start !== 'number' || typeof end !== 'number' || end <= start) {
      valid = false;
      break;
    }
  }

  for (let i = 1; i < records.length && valid; i++) {
    const prevEnd = records[i - 1].scene_indexing?.v_timestamp_end;
    const curStart = records[i].scene_indexing?.v_timestamp_start;
    if (typeof prevEnd !== 'number' || typeof curStart !== 'number' || curStart < prevEnd) {
      valid = false;
    }
  }

  return {
    check_key: 'timestamps_monotonic',
    label: 'Timestamps monotonic',
    passed: valid,
    detail: valid
      ? 'v_timestamp_end > start on all scenes; monotonic chain within import'
      : 'Timestamp monotonicity or end > start violated',
  };
}

function validateAnchorTerminalContinuity(
  records: CinematicExtractionResult[],
  anchorTerminalSceneId: string,
  anchorTerminalEnd: number
): CandidateValidationCheck {
  if (records.length === 0) {
    return {
      check_key: 'anchor_terminal_continuity',
      label: 'Anchor terminal continuity',
      passed: false,
      detail: 'No candidate opening scene',
    };
  }

  const opening = records[0];
  const timestampOk =
    (opening.scene_indexing?.v_timestamp_start ?? 0) >= anchorTerminalEnd;
  const graphOk = opening.sequence_graph?.previous_node === anchorTerminalSceneId;
  const passed = timestampOk && graphOk;

  return {
    check_key: 'anchor_terminal_continuity',
    label: 'Anchor terminal continuity',
    passed,
    detail: passed
      ? `Opening scene links ${anchorTerminalSceneId} with timestamp continuity`
      : `Broken anchor bridge: previous_node=${opening.sequence_graph?.previous_node ?? 'missing'}, start=${opening.scene_indexing?.v_timestamp_start}`,
  };
}

function validateCharacterCoverage(records: CinematicExtractionResult[]): CandidateValidationCheck {
  if (records.length === 0) {
    return {
      check_key: 'character_coverage_85',
      label: 'Character coverage ≥85%',
      passed: false,
      detail: 'No candidate records',
    };
  }

  const count = records.filter(hasCharacterCarryover).length;
  const coverage = ratio(count, records.length);
  const passed = coverage >= CARRYOVER_THRESHOLD;

  return {
    check_key: 'character_coverage_85',
    label: 'Character coverage ≥85%',
    passed,
    detail: `${count}/${records.length} scenes (${coverage}) with character persistence anchors`,
  };
}

function validateRelationshipGraphCoverage(
  records: CinematicExtractionResult[]
): CandidateValidationCheck {
  if (records.length === 0) {
    return {
      check_key: 'relationship_graph_coverage',
      label: 'Relationship graph coverage',
      passed: false,
      detail: 'No candidate records',
    };
  }

  const count = records.filter(hasUsefulRelationshipGraph).length;
  const coverage = ratio(count, records.length);
  const passed = coverage >= CARRYOVER_THRESHOLD;

  return {
    check_key: 'relationship_graph_coverage',
    label: 'Relationship graph coverage',
    passed,
    detail: `${count}/${records.length} scenes (${coverage}) with ≥3 edges and weighted relations`,
  };
}

function validateEnvironmentCarryover(records: CinematicExtractionResult[]): CandidateValidationCheck {
  if (records.length === 0) {
    return {
      check_key: 'environment_carryover',
      label: 'Environment carryover',
      passed: false,
      detail: 'No candidate records',
    };
  }

  const count = records.filter(hasEnvironmentCarryover).length;
  const coverage = ratio(count, records.length);
  const passed = coverage >= CARRYOVER_THRESHOLD;

  return {
    check_key: 'environment_carryover',
    label: 'Environment carryover',
    passed,
    detail: `${count}/${records.length} scenes (${coverage}) with environment continuity signals`,
  };
}

function validateBridgeEligibility(): CandidateValidationCheck {
  const contract = buildLabImportIngestionContractPreview();
  const gate = buildExpansionReadinessGatePreview();
  const bridgeReq = contract.ingestion_contract.bridge_mode_requirement;

  const eligible =
    bridgeReq.pipeline_bridge_mode === 'B_TO_A' &&
    bridgeReq.certification_bridge_enabled === true &&
    gate.expansion_readiness_verdict !== 'blocked';

  return {
    check_key: 'bridge_eligibility',
    label: 'Bridge eligibility',
    passed: eligible,
    detail: eligible
      ? `B_TO_A bridge eligible; gate verdict=${gate.expansion_readiness_verdict}`
      : `Bridge ineligible: gate=${gate.expansion_readiness_verdict}`,
  };
}

function validateRejectionRuleCompliance(): CandidateValidationCheck {
  const contract = buildLabImportIngestionContractPreview();
  const gate = buildExpansionReadinessGatePreview();
  const simulation = buildSeq002ExpansionSimulationPreview();

  const violations: string[] = [];

  if (gate.expansion_readiness_verdict === 'blocked') {
    violations.push('REJ-001');
  }
  if (simulation.predicted_merge_score < 0.85) {
    violations.push('REJ-010');
  }
  if (gate.warnings.some((w) => w.issue_id === 'GATE-SCENE-004')) {
    violations.push('REJ-012');
  }

  const hardBlock = violations.includes('REJ-001');
  const passed = !hardBlock;

  return {
    check_key: 'rejection_rule_compliance',
    label: 'Rejection rule compliance',
    passed,
    detail:
      violations.length === 0
        ? 'No upstream rejection rule violations'
        : `Active rule refs: ${violations.join(', ')} (${hardBlock ? 'hard block' : 'soft advisory'})`,
  };
}

function buildRepairSuggestions(
  checks: CandidateValidationCheck[],
  fileFound: boolean
): RepairSuggestion[] {
  const suggestions: RepairSuggestion[] = [];
  let idx = 1;

  if (!fileFound) {
    suggestions.push({
      suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
      check_key: 'scene_count_1_to_20',
      message: `Create ${PRIMARY_CANDIDATE_FILE} with CinematicExtractionResult[] matching PHASE-12 ingestion contract`,
    });
  }

  for (const check of checks) {
    if (check.passed) continue;

    switch (check.check_key) {
      case 'required_fields_16':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Populate all 16 required_scene_fields on every candidate scene per lab-import-ingestion-contract',
        });
        break;
      case 'timestamps_monotonic':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Ensure v_timestamp_end > v_timestamp_start per scene and monotonic chain within import batch',
        });
        break;
      case 'anchor_terminal_continuity':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Set opening scene sequence_graph.previous_node to anchor terminal scene id and v_timestamp_start ≥ anchor v_timestamp_end',
        });
        break;
      case 'character_coverage_85':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Add character_persistence and visual_atoms subject anchors to ≥85% of candidate scenes',
        });
        break;
      case 'relationship_graph_coverage':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Enrich relationship_graph with ≥3 edges and ≥2 weighted relations (>0.4) per scene',
        });
        break;
      case 'environment_carryover':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Add scene_state.physics and canonical_dna.domains.atmosphere to ≥85% of candidate scenes',
        });
        break;
      case 'bridge_eligibility':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message: 'Resolve PHASE-10 expansion gate blocking issues before import',
        });
        break;
      case 'rejection_rule_compliance':
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message:
            'Address upstream rejection rules (REJ-001/010/012) before proceeding with ingestion',
        });
        break;
      default:
        suggestions.push({
          suggestion_id: `REP-${String(idx++).padStart(3, '0')}`,
          check_key: check.check_key,
          message: check.detail,
        });
    }
  }

  return suggestions;
}

function buildRejectionReasons(checks: CandidateValidationCheck[]): string[] {
  return checks.filter((c) => !c.passed).map((c) => `[${c.check_key}] ${c.detail}`);
}

export function buildSeq002CandidateImportValidator(): Seq002CandidateImportValidatorResult {
  const contractPreview = buildLabImportIngestionContractPreview();
  const contract = contractPreview.ingestion_contract;
  const { sourceFile, records } = loadSeq002CandidateRecords();
  const fileFound = sourceFile !== null;

  const { dataset } = loadCanonicalExportDataset();
  const anchorTerminal = dataset[dataset.length - 1];
  const anchorTerminalSceneId = contract.required_timestamps.anchor_terminal_scene_id_ref;
  const anchorTerminalEnd = anchorTerminal?.scene_indexing?.v_timestamp_end ?? 0;

  const { check: requiredFieldsCheck, fieldCoverage } = validateRequiredFields(
    records,
    contract.required_scene_fields,
    fileFound
  );

  const checks: CandidateValidationCheck[] = [
    validateSceneCount(
      records,
      contract.accepted_input_shape.min_scenes_per_import,
      contract.accepted_input_shape.max_scenes_per_import,
      fileFound
    ),
    requiredFieldsCheck,
    validateTimestampsMonotonic(records),
    validateAnchorTerminalContinuity(records, anchorTerminalSceneId, anchorTerminalEnd),
    validateCharacterCoverage(records),
    validateRelationshipGraphCoverage(records),
    validateEnvironmentCarryover(records),
    validateBridgeEligibility(),
    validateRejectionRuleCompliance(),
  ];

  const candidateChecksPass = checks
    .filter((c) => c.check_key !== 'rejection_rule_compliance')
    .every((c) => c.passed);
  const rejectionCompliance = checks.find((c) => c.check_key === 'rejection_rule_compliance');
  const hardBlock = contractPreview.expansion_gate_ref.expansion_readiness_verdict === 'blocked';

  const validation_verdict: 'pass' | 'fail' =
    candidateChecksPass && (rejectionCompliance?.passed ?? false) && fileFound ? 'pass' : 'fail';

  const rejection_reasons = buildRejectionReasons(checks);
  const repair_suggestions = buildRepairSuggestions(checks, fileFound);

  const approved_for_ingestion =
    validation_verdict === 'pass' && !hardBlock && fileFound && records.length > 0;

  const candidate_validation_report: CandidateValidationReport = {
    candidate_source_file: sourceFile,
    candidate_file_found: fileFound,
    candidate_scene_count: records.length,
    contract_id: contract.contract_id,
    contract_checksum_ref: contractPreview.contract_checksum,
    checks,
    field_coverage: fieldCoverage,
  };

  const validatorCore = {
    schema_version: SEQ002_CANDIDATE_IMPORT_VALIDATOR_VERSION,
    generated_at: SEQ002_CANDIDATE_IMPORT_VALIDATOR_EPOCH,
    readonly_validation: true as const,
    candidate_validation_report,
    validation_verdict,
    rejection_reasons,
    repair_suggestions,
    approved_for_ingestion,
    validation: {
      deterministic_validator_checksum_stable: true,
      readonly_validation: true as const,
      no_ingestion_executed: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
    },
  };

  const validator_checksum = digest([JSON.stringify(validatorCore)]);

  return {
    ...validatorCore,
    validator_checksum,
  };
}

let cachedValidator: Seq002CandidateImportValidatorResult | null = null;

export function buildSeq002CandidateImportValidatorPreview(): Seq002CandidateImportValidatorResult {
  if (cachedValidator) return cachedValidator;
  cachedValidator = buildSeq002CandidateImportValidator();
  return cachedValidator;
}

export function resetSeq002CandidateImportValidatorCache(): void {
  cachedValidator = null;
}
