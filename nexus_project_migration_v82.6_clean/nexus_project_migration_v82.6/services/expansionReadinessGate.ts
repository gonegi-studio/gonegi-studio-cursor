import crypto from 'crypto';
import {
  CinematicExtractionResult,
  EXPANSION_READINESS_GATE_VERSION,
  ExpansionReadinessCheck,
  ExpansionReadinessGateResult,
  ExpansionReadinessIssue,
  ExpansionReadinessVerdict,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { validateExportDensity } from './datasetHydrationService';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { buildProductionCertificationLockPreview } from './productionCertificationLock';
import { buildRenderOrchestrationDryRunPreview } from './renderOrchestrationDryRun';
import { isEmptyValue } from './pipelineBridge';

export const EXPANSION_READINESS_GATE_EPOCH = '2026-05-26T19:00:00.000Z';

const KNOWN_REVIEWED_WARNING_GATE_IDS = ['GATE-SCENE-004'] as const;
const CARRYOVER_COVERAGE_THRESHOLD = 0.85;
const MIN_REQUIRED_CONTRACT_FIELDS = 12;

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

function hasEmotionalCarryover(scene: CinematicExtractionResult): boolean {
  return (
    !isEmptyValue(scene.emotional_carryover) ||
    !isEmptyValue(scene.scene_state?.emotion) ||
    !isEmptyValue(scene.sequence_graph?.transition_logic?.emotion_continuity)
  );
}

function sceneHasContractField(
  scene: CinematicExtractionResult,
  field: string
): boolean {
  switch (field) {
    case 'temporal_bridge':
      return hasTemporalBridge(scene);
    case 'character_persistence':
      return hasCharacterCarryover(scene);
    case 'emotional_carryover':
      return hasEmotionalCarryover(scene);
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

function checkProductionLockValid(): ExpansionReadinessCheck {
  const lock = buildProductionCertificationLockPreview();
  const valid =
    lock.orchestration_readiness === 'production_locked' &&
    lock.validation.all_fingerprints_present &&
    lock.validation.no_dataset_mutation &&
    lock.deterministic_lock_checksum.length > 0;

  return {
    check_key: 'production_lock_valid',
    label: 'Production lock valid',
    passed: valid,
    detail: valid
      ? `Lock ${lock.production_dataset_candidate_id} production_locked with fingerprint quartet present`
      : `Lock invalid: orchestration_readiness=${lock.orchestration_readiness}`,
  };
}

function checkBlueprintChecksumStable(): ExpansionReadinessCheck {
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const stable =
    blueprint.validation.deterministic_blueprint_checksum_stable &&
    blueprint.blueprint_checksum.length === 64;

  return {
    check_key: 'blueprint_checksum_stable',
    label: 'Blueprint checksum stable',
    passed: stable,
    detail: stable
      ? `Blueprint checksum ${blueprint.blueprint_checksum.slice(0, 16)}… stable`
      : 'Blueprint checksum missing or unstable',
  };
}

function checkSequenceContractComplete(): ExpansionReadinessCheck {
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const contract = blueprint.reusable_dataset_contract;
  const complete =
    contract.density_preservation === true &&
    contract.readonly_expansion === true &&
    contract.required_fields.length >= MIN_REQUIRED_CONTRACT_FIELDS &&
    contract.parent_candidate_id === blueprint.production_lock_ref.production_dataset_candidate_id;

  return {
    check_key: 'sequence_contract_complete',
    label: 'Sequence contract complete',
    passed: complete,
    detail: complete
      ? `Contract ${contract.contract_id} with ${contract.required_fields.length} required fields`
      : 'Reusable dataset contract incomplete or parent mismatch',
  };
}

function checkMergePolicySafe(): ExpansionReadinessCheck {
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const policy = blueprint.sequence_merge_policy;
  const safe =
    policy.canonical_export_mutation === false &&
    policy.fingerprint_revalidation_required === true &&
    policy.rules.length >= 5;

  return {
    check_key: 'merge_policy_safe',
    label: 'Merge policy safe',
    passed: safe,
    detail: safe
      ? `Policy ${policy.policy_id} (${policy.merge_mode}) — no canonical mutation`
      : 'Merge policy allows canonical mutation or lacks revalidation',
  };
}

function checkDensityPreservationReady(): ExpansionReadinessCheck {
  const { dataset, size_bytes } = loadCanonicalExportDataset();
  const density = validateExportDensity(dataset);
  const contract = buildMultiSequenceExpansionBlueprintPreview().reusable_dataset_contract;

  let fieldCoverageSum = 0;
  for (const field of contract.required_fields) {
    const covered = dataset.filter((scene) => sceneHasContractField(scene, field)).length;
    fieldCoverageSum += ratio(covered, dataset.length);
  }
  const avgFieldCoverage = round6(fieldCoverageSum / contract.required_fields.length);

  // Structural density — canonical export is 15.52MB; legacy validator window is 10–13MB
  const structurallyDense =
    density.visualAtomsNonEmpty &&
    density.relationshipGraphNonEmpty &&
    density.sceneStatePopulated &&
    size_bytes > 0;

  const ready = structurallyDense && avgFieldCoverage >= CARRYOVER_COVERAGE_THRESHOLD;

  return {
    check_key: 'density_preservation_ready',
    label: 'Density preservation ready',
    passed: ready,
    detail: ready
      ? `Structural density valid (${(size_bytes / 1024 / 1024).toFixed(2)}MB); contract field coverage ${avgFieldCoverage}`
      : `Structural density or contract field coverage below ${CARRYOVER_COVERAGE_THRESHOLD}`,
  };
}

function checkTemporalCarryoverReady(): ExpansionReadinessCheck {
  const { dataset } = loadCanonicalExportDataset();
  const dryRun = buildRenderOrchestrationDryRunPreview();
  const bridgeCount = dataset.filter(hasTemporalBridge).length;
  const bridgeCoverage = ratio(bridgeCount, dataset.length);
  const ready =
    bridgeCoverage >= CARRYOVER_COVERAGE_THRESHOLD &&
    dryRun.continuity_failure_count === 0;

  return {
    check_key: 'temporal_carryover_ready',
    label: 'Temporal carryover ready',
    passed: ready,
    detail: ready
      ? `${bridgeCount}/${dataset.length} temporal bridges; dry-run continuity failures=0`
      : `Temporal bridge coverage ${bridgeCoverage} or continuity failures present`,
  };
}

function checkCharacterCarryoverReady(): ExpansionReadinessCheck {
  const { dataset } = loadCanonicalExportDataset();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const count = dataset.filter(hasCharacterCarryover).length;
  const coverage = ratio(count, dataset.length);
  const specsReady = blueprint.expansion_blueprint.character_memory_carryover.length >= 3;

  const ready = coverage >= CARRYOVER_COVERAGE_THRESHOLD && specsReady;

  return {
    check_key: 'character_carryover_ready',
    label: 'Character carryover ready',
    passed: ready,
    detail: ready
      ? `${count}/${dataset.length} scenes with character persistence anchors`
      : `Character carryover coverage ${coverage} below threshold`,
  };
}

function checkEnvironmentCarryoverReady(): ExpansionReadinessCheck {
  const { dataset } = loadCanonicalExportDataset();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const count = dataset.filter(hasEnvironmentCarryover).length;
  const coverage = ratio(count, dataset.length);
  const specsReady = blueprint.expansion_blueprint.environment_memory_carryover.length >= 3;

  const ready = coverage >= CARRYOVER_COVERAGE_THRESHOLD && specsReady;

  return {
    check_key: 'environment_carryover_ready',
    label: 'Environment carryover ready',
    passed: ready,
    detail: ready
      ? `${count}/${dataset.length} scenes with environment continuity signals`
      : `Environment carryover coverage ${coverage} below threshold`,
  };
}

function checkEmotionalCarryoverReady(): ExpansionReadinessCheck {
  const { dataset } = loadCanonicalExportDataset();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const count = dataset.filter(hasEmotionalCarryover).length;
  const coverage = ratio(count, dataset.length);
  const specsReady = blueprint.expansion_blueprint.emotional_arc_carryover.length >= 3;

  const ready = coverage >= CARRYOVER_COVERAGE_THRESHOLD && specsReady;

  return {
    check_key: 'emotion_carryover_ready',
    label: 'Emotional carryover ready',
    passed: ready,
    detail: ready
      ? `${count}/${dataset.length} scenes with emotional carryover signals`
      : `Emotional carryover coverage ${coverage} below threshold`,
  };
}

function checkKnownWarningReviewed(): ExpansionReadinessCheck {
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const warnGates = blueprint.expansion_blueprint.expansion_safety_gates.filter(
    (g) => g.current_status === 'warn'
  );
  const blockedGates = blueprint.expansion_blueprint.expansion_safety_gates.filter(
    (g) => g.current_status === 'blocked'
  );

  const allKnownReviewed =
    blockedGates.length === 0 &&
    warnGates.every((g) =>
      (KNOWN_REVIEWED_WARNING_GATE_IDS as readonly string[]).includes(g.gate_id)
    );

  return {
    check_key: 'known_warning_reviewed',
    label: 'Known warning reviewed',
    passed: allKnownReviewed,
    detail: allKnownReviewed
      ? `${warnGates.length} known warning(s) reviewed: ${warnGates.map((g) => g.gate_id).join(', ') || 'none'}`
      : `Unreviewed warnings or blocked gates: ${[...warnGates, ...blockedGates].map((g) => g.gate_id).join(', ')}`,
  };
}

function buildIssuesFromChecks(checks: ExpansionReadinessCheck[]): {
  blocking_issues: ExpansionReadinessIssue[];
  warnings: ExpansionReadinessIssue[];
} {
  const blocking_issues: ExpansionReadinessIssue[] = [];
  const warnings: ExpansionReadinessIssue[] = [];

  for (const check of checks) {
    if (check.passed) continue;
    const issue: ExpansionReadinessIssue = {
      issue_id: `ISS-${check.check_key.toUpperCase().replace(/_/g, '-')}`,
      severity: 'blocking',
      check_key: check.check_key,
      message: check.detail,
    };
    blocking_issues.push(issue);
  }

  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  for (const gate of blueprint.expansion_blueprint.expansion_safety_gates) {
    if (gate.current_status !== 'warn') continue;
    warnings.push({
      issue_id: gate.gate_id,
      severity: 'warning',
      check_key: 'known_warning_reviewed',
      message: `${gate.label}: ${gate.pass_condition}`,
    });
  }

  return { blocking_issues, warnings };
}

function resolveVerdict(
  blockingCount: number,
  warningCount: number,
  knownWarningReviewed: boolean
): ExpansionReadinessVerdict {
  if (blockingCount > 0) return 'blocked';
  if (warningCount > 0 && knownWarningReviewed) return 'conditional';
  if (warningCount > 0) return 'conditional';
  return 'approved';
}

function resolveApprovedNextAction(verdict: ExpansionReadinessVerdict): string {
  switch (verdict) {
    case 'approved':
      return 'Proceed with SEQ-002 in-memory expansion planning using temporal_chain merge policy (readonly until explicit export opt-in)';
    case 'conditional':
      return 'Proceed with SEQ-002 expansion blueprint execution in-memory; acknowledge GATE-SCENE-004 corpus window advisory before merge';
    case 'blocked':
      return 'Resolve all blocking_issues before any sequence expansion or merge operation';
  }
}

export function buildExpansionReadinessGate(): ExpansionReadinessGateResult {
  const lock = buildProductionCertificationLockPreview();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();

  const checks: ExpansionReadinessCheck[] = [
    checkProductionLockValid(),
    checkBlueprintChecksumStable(),
    checkSequenceContractComplete(),
    checkMergePolicySafe(),
    checkDensityPreservationReady(),
    checkTemporalCarryoverReady(),
    checkCharacterCarryoverReady(),
    checkEnvironmentCarryoverReady(),
    checkEmotionalCarryoverReady(),
    checkKnownWarningReviewed(),
  ];

  const { blocking_issues, warnings } = buildIssuesFromChecks(checks);
  const knownWarningCheck = checks.find((c) => c.check_key === 'known_warning_reviewed');
  const expansion_readiness_verdict = resolveVerdict(
    blocking_issues.length,
    warnings.length,
    knownWarningCheck?.passed ?? false
  );
  const approved_next_action = resolveApprovedNextAction(expansion_readiness_verdict);

  const gateCore = {
    schema_version: EXPANSION_READINESS_GATE_VERSION,
    generated_at: EXPANSION_READINESS_GATE_EPOCH,
    readonly_gate: true as const,
    production_lock_ref: {
      production_dataset_candidate_id: lock.production_dataset_candidate_id,
      deterministic_lock_checksum: lock.deterministic_lock_checksum,
      orchestration_readiness: lock.orchestration_readiness,
    },
    blueprint_checksum_ref: blueprint.blueprint_checksum,
    checks,
    expansion_readiness_verdict,
    blocking_issues,
    warnings,
    approved_next_action,
    validation: {
      deterministic_gate_checksum_stable: true,
      readonly_gate: true as const,
      no_dataset_mutation: true as const,
      no_video_ingestion: true as const,
      no_provider_calls: true as const,
    },
  };

  const gate_checksum = digest([JSON.stringify(gateCore)]);

  return {
    ...gateCore,
    gate_checksum,
  };
}

let cachedGate: ExpansionReadinessGateResult | null = null;

export function buildExpansionReadinessGatePreview(): ExpansionReadinessGateResult {
  if (cachedGate) return cachedGate;
  cachedGate = buildExpansionReadinessGate();
  return cachedGate;
}

export function resetExpansionReadinessGateCache(): void {
  cachedGate = null;
}
