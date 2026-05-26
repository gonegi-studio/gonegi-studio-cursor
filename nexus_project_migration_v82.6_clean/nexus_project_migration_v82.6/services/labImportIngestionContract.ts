import crypto from 'crypto';
import {
  ApprovedImportPath,
  IngestionCarryoverRequirement,
  IngestionContract,
  IngestionRejectionRule,
  LAB_IMPORT_INGESTION_CONTRACT_VERSION,
  LabImportIngestionContractResult,
  RequiredTimestampRules,
  ValidationOrderStep,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { buildExpansionReadinessGatePreview } from './expansionReadinessGate';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { buildProductionCertificationLockPreview } from './productionCertificationLock';
import { buildSeq002ExpansionSimulationPreview } from './seq002ExpansionSimulation';
import { KIKI_25S_BENCHMARK } from './videoGroundedQualityAudit';

export const LAB_IMPORT_INGESTION_CONTRACT_EPOCH = '2026-05-26T21:00:00.000Z';

const LAB_IMPORT_CANDIDATE_FILES = [
  'data/pipeline_b_lab_records.json',
  'data/lab_import_records.json',
  'storage/pipeline_b_import.json',
] as const;

const CARRYOVER_COVERAGE = 0.85;
const MIN_SCENES = 1;
const MAX_SCENES = KIKI_25S_BENCHMARK.target_scene_window_max;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function buildCharacterCarryoverRequirements(): IngestionCarryoverRequirement[] {
  return [
    {
      requirement_key: 'character_persistence',
      layer: 'character_persistence + visual_atoms.subject',
      minimum_coverage: CARRYOVER_COVERAGE,
      mandatory: true,
    },
    {
      requirement_key: 'identity_anchor',
      layer: 'sequence_graph.previous_node links anchor terminal on opening scene',
      minimum_coverage: 1.0,
      mandatory: true,
    },
    {
      requirement_key: 'relationship_graph',
      layer: 'relationship_graph with weighted edges (≥3 edges, ≥2 weighted >0.4)',
      minimum_coverage: CARRYOVER_COVERAGE,
      mandatory: true,
    },
  ];
}

function buildEnvironmentCarryoverRequirements(): IngestionCarryoverRequirement[] {
  return [
    {
      requirement_key: 'scene_state_physics',
      layer: 'scene_state.physics',
      minimum_coverage: CARRYOVER_COVERAGE,
      mandatory: true,
    },
    {
      requirement_key: 'atmosphere_dna',
      layer: 'canonical_dna.domains.atmosphere',
      minimum_coverage: CARRYOVER_COVERAGE,
      mandatory: true,
    },
    {
      requirement_key: 'lighting_behavior',
      layer: 'director_dna.lighting_behavior',
      minimum_coverage: CARRYOVER_COVERAGE,
      mandatory: false,
    },
  ];
}

function buildRequiredTimestampRules(anchorTerminalSceneId: string): RequiredTimestampRules {
  return {
    opening_scene_must_chain_from_anchor: true,
    v_timestamp_start_gte_anchor_terminal_end: true,
    monotonic_within_import: true,
    v_timestamp_end_gt_start: true,
    anchor_terminal_scene_id_ref: anchorTerminalSceneId,
  };
}

function buildIngestionContract(
  parentCandidateId: string,
  targetSequenceId: string,
  requiredSceneFields: string[],
  anchorTerminalSceneId: string
): IngestionContract {
  return {
    contract_id: `LIC-${parentCandidateId.replace('PDC-', '')}`,
    schema_version: LAB_IMPORT_INGESTION_CONTRACT_VERSION,
    parent_dataset_candidate_id: parentCandidateId,
    target_sequence_id: targetSequenceId,
    accepted_input_shape: {
      format: 'json_array',
      record_type: 'CinematicExtractionResult',
      target_sequence_id: targetSequenceId,
      candidate_file_paths: [...LAB_IMPORT_CANDIDATE_FILES],
      min_scenes_per_import: MIN_SCENES,
      max_scenes_per_import: MAX_SCENES,
      encoding: 'utf8',
    },
    required_scene_fields: requiredSceneFields,
    required_timestamps: buildRequiredTimestampRules(anchorTerminalSceneId),
    character_carryover_requirements: buildCharacterCarryoverRequirements(),
    environment_carryover_requirements: buildEnvironmentCarryoverRequirements(),
    bridge_mode_requirement: {
      pipeline_bridge_mode: 'B_TO_A',
      certification_bridge_enabled: true,
      merge_policy: 'temporal_chain',
      export_bridge_mode: 'OFF',
      in_memory_only_until_audit_pass: true,
    },
    density_preservation: true,
    canonical_export_mutation: false,
  };
}

function buildRequiredValidationOrder(): ValidationOrderStep[] {
  return [
    {
      step_index: 1,
      phase_ref: 'PHASE-8',
      service_or_route: 'production-certification-lock-preview',
      pass_condition: 'orchestration_readiness === production_locked',
    },
    {
      step_index: 2,
      phase_ref: 'PHASE-10',
      service_or_route: 'expansion-readiness-gate-preview',
      pass_condition: 'expansion_readiness_verdict !== blocked',
    },
    {
      step_index: 3,
      phase_ref: 'PHASE-11',
      service_or_route: 'seq002-expansion-simulation-preview',
      pass_condition: 'predicted_merge_score >= 0.85 && continuity_risk_score <= 0.15',
    },
    {
      step_index: 4,
      phase_ref: 'PHASE-12',
      service_or_route: 'lab-import-ingestion-contract-preview',
      pass_condition: 'ingestion_contract present && contract_checksum stable',
    },
    {
      step_index: 5,
      phase_ref: 'PHASE-6',
      service_or_route: 'pipeline-b-certification-bridge-preview?enabled=true',
      pass_condition: 'certification_readiness_score >= 0.85 after B_TO_A merge',
    },
    {
      step_index: 6,
      phase_ref: 'PHASE-7',
      service_or_route: 'video-grounded-quality-audit-preview',
      pass_condition: 'quality_score >= 0.92 && production_readiness_verdict !== insufficient',
    },
    {
      step_index: 7,
      phase_ref: 'PHASE-8',
      service_or_route: 'render-orchestration-dry-run-preview',
      pass_condition: 'continuity_failure_count === 0',
    },
    {
      step_index: 8,
      phase_ref: 'PHASE-8',
      service_or_route: 'production-certification-lock-preview (re-freeze)',
      pass_condition: 'new deterministic_lock_checksum after merge validation',
    },
  ];
}

function buildRejectionRules(): IngestionRejectionRule[] {
  return [
    {
      rule_id: 'REJ-001',
      trigger: 'expansion_readiness_verdict === blocked',
      severity: 'hard_reject',
      message: 'PHASE-10 gate blocked — resolve blocking issues before import',
    },
    {
      rule_id: 'REJ-002',
      trigger: 'missing required_scene_fields on any imported record',
      severity: 'hard_reject',
      message: 'Imported scene missing required contract field — reject entire batch',
    },
    {
      rule_id: 'REJ-003',
      trigger: 'opening scene v_timestamp_start < anchor terminal v_timestamp_end',
      severity: 'hard_reject',
      message: 'Timestamp chain broken at SEQ-001 → SEQ-002 boundary',
    },
    {
      rule_id: 'REJ-004',
      trigger: 'opening scene sequence_graph.previous_node !== anchor terminal scene id',
      severity: 'hard_reject',
      message: 'Sequence graph continuity link missing on SEQ-002 opening scene',
    },
    {
      rule_id: 'REJ-005',
      trigger: 'character_carryover coverage < 0.85 on imported batch',
      severity: 'hard_reject',
      message: 'Character persistence carryover insufficient across imported scenes',
    },
    {
      rule_id: 'REJ-006',
      trigger: 'environment_carryover coverage < 0.85 on imported batch',
      severity: 'hard_reject',
      message: 'Environment continuity carryover insufficient across imported scenes',
    },
    {
      rule_id: 'REJ-007',
      trigger: 'import scene count > max_scenes_per_import',
      severity: 'hard_reject',
      message: `Import exceeds Kiki 25s window max (${MAX_SCENES} scenes per batch)`,
    },
    {
      rule_id: 'REJ-008',
      trigger: 'bridge_mode !== B_TO_A or certification_bridge_enabled !== true',
      severity: 'hard_reject',
      message: 'Import must use Pipeline B lab import bridge with certification enabled',
    },
    {
      rule_id: 'REJ-009',
      trigger: 'canonical export write attempted before audit pass',
      severity: 'hard_reject',
      message: 'Canonical cinematic-dna-export.json mutation forbidden until post-import audit sequence passes',
    },
    {
      rule_id: 'REJ-010',
      trigger: 'predicted_merge_score < 0.85 from PHASE-11 simulation',
      severity: 'soft_reject',
      message: 'Re-run SEQ-002 simulation after resolving carryover gaps before import',
    },
    {
      rule_id: 'REJ-011',
      trigger: 'provider call or GPU execution during import',
      severity: 'hard_reject',
      message: 'Import contract forbids provider calls and GPU execution at ingestion stage',
    },
    {
      rule_id: 'REJ-012',
      trigger: 'GATE-SCENE-004 unacknowledged',
      severity: 'soft_reject',
      message: 'Acknowledge 27-scene corpus window advisory before SEQ-002 merge execution',
    },
  ];
}

function buildApprovedImportPath(): ApprovedImportPath {
  return {
    path_id: 'AIP-LAB-B-TO-A-SEQ002-v1',
    label: 'Pipeline B Lab Import → B_TO_A Merge → Post-Import Audit',
    steps: [
      'Confirm PHASE-8 production lock and PHASE-10 expansion gate pass',
      'Place SEQ-002 CinematicExtractionResult[] in data/pipeline_b_lab_records.json (or approved candidate path)',
      'Validate each record against ingestion_contract.required_scene_fields and required_timestamps',
      'Run in-memory B_TO_A bridge merge with pipeline-b-certification-bridge (?enabled=true)',
      'Execute required_validation_order steps 5–8 (certification, quality audit, dry-run, lock re-freeze)',
      'Only after all audits pass: opt-in FULL_DENSITY export if canonical write required',
    ],
    endpoint_refs: [
      '/api/cinematic/lab-import-ingestion-contract-preview',
      '/api/cinematic/pipeline-b-certification-bridge-preview?enabled=true',
      '/api/cinematic/video-grounded-quality-audit-preview',
      '/api/cinematic/render-orchestration-dry-run-preview',
      '/api/cinematic/production-certification-lock-preview',
    ],
  };
}

export function buildLabImportIngestionContract(): LabImportIngestionContractResult {
  const lock = buildProductionCertificationLockPreview();
  const gate = buildExpansionReadinessGatePreview();
  const simulation = buildSeq002ExpansionSimulationPreview();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();

  const { dataset } = loadCanonicalExportDataset();
  const anchorTerminalSceneId = dataset[dataset.length - 1]?.id ?? 'UNKNOWN';
  const targetSequenceId =
    blueprint.expansion_blueprint.planned_sequences.find((s) => s.role === 'expansion')
      ?.sequence_id ?? 'SEQ-002';

  const ingestion_contract = buildIngestionContract(
    lock.production_dataset_candidate_id,
    targetSequenceId,
    blueprint.reusable_dataset_contract.required_fields,
    anchorTerminalSceneId
  );

  const contractCore = {
    schema_version: LAB_IMPORT_INGESTION_CONTRACT_VERSION,
    generated_at: LAB_IMPORT_INGESTION_CONTRACT_EPOCH,
    readonly_contract: true as const,
    production_lock_ref: {
      production_dataset_candidate_id: lock.production_dataset_candidate_id,
      deterministic_lock_checksum: lock.deterministic_lock_checksum,
    },
    seq002_simulation_ref: {
      simulation_checksum: simulation.simulation_checksum,
      predicted_merge_score: simulation.predicted_merge_score,
      recommended_ingestion_policy: simulation.recommended_ingestion_policy,
    },
    expansion_gate_ref: {
      gate_checksum: gate.gate_checksum,
      expansion_readiness_verdict: gate.expansion_readiness_verdict,
    },
    ingestion_contract,
    required_validation_order: buildRequiredValidationOrder(),
    rejection_rules: buildRejectionRules(),
    approved_import_path: buildApprovedImportPath(),
    validation: {
      deterministic_contract_checksum_stable: true,
      readonly_contract: true as const,
      no_ingestion_executed: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
    },
  };

  const contract_checksum = digest([JSON.stringify(contractCore)]);

  return {
    ...contractCore,
    contract_checksum,
  };
}

let cachedContract: LabImportIngestionContractResult | null = null;

export function buildLabImportIngestionContractPreview(): LabImportIngestionContractResult {
  if (cachedContract) return cachedContract;
  cachedContract = buildLabImportIngestionContract();
  return cachedContract;
}

export function resetLabImportIngestionContractCache(): void {
  cachedContract = null;
}
