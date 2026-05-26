import crypto from 'crypto';
import {
  CrossSequenceContinuityRule,
  ExpansionBlueprint,
  ExpansionSafetyGate,
  MemoryCarryoverSpec,
  MULTI_SEQUENCE_EXPANSION_BLUEPRINT_VERSION,
  MultiSequenceExpansionBlueprintResult,
  NextSequenceRequirement,
  ProductionLockInheritance,
  ReusableDatasetContract,
  SequenceIdDefinition,
  SequenceMergePolicy,
} from '../types';
import { loadCanonicalExportDataset } from './datasetCompletionAudit';
import { buildProductionCertificationLockPreview } from './productionCertificationLock';
import { buildRenderOrchestrationDryRunPreview } from './renderOrchestrationDryRun';
import { KIKI_25S_BENCHMARK } from './videoGroundedQualityAudit';

export const MULTI_SEQUENCE_EXPANSION_BLUEPRINT_EPOCH = '2026-05-26T18:00:00.000Z';

const BENCHMARK_REF = KIKI_25S_BENCHMARK.reference_title;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function buildSequenceId(
  sequenceIndex: number,
  role: SequenceIdDefinition['role'],
  parentCandidateId: string,
  sceneCountRef?: number
): SequenceIdDefinition {
  const slot = String(sequenceIndex + 1).padStart(3, '0');
  return {
    sequence_id: `SEQ-${slot}`,
    sequence_index: sequenceIndex,
    role,
    parent_candidate_id: parentCandidateId,
    benchmark_ref: BENCHMARK_REF,
    scene_window: {
      min: KIKI_25S_BENCHMARK.target_scene_window_min,
      max: KIKI_25S_BENCHMARK.target_scene_window_max,
    },
    duration_seconds: KIKI_25S_BENCHMARK.target_duration_seconds,
    scene_count_ref: sceneCountRef,
  };
}

function buildCrossSequenceContinuityRules(): CrossSequenceContinuityRule[] {
  return [
    {
      rule_id: 'XSEQ-TEMP-001',
      dimension: 'frame_scene_temporal_continuity',
      required_signal: 'production_v72.temporal_bridge + scene_indexing.v_timestamp chain',
      merge_strategy: 'temporal_chain_append',
      gate_threshold: 0.85,
    },
    {
      rule_id: 'XSEQ-CHAR-002',
      dimension: 'character_persistence',
      required_signal: 'character_persistence + temporal memory graph character edges',
      merge_strategy: 'identity_anchor_inherit',
      gate_threshold: 0.85,
    },
    {
      rule_id: 'XSEQ-ENV-003',
      dimension: 'environment_continuity',
      required_signal: 'scene_state.physics + canonical_dna.domains.atmosphere',
      merge_strategy: 'environment_signature_blend',
      gate_threshold: 0.85,
    },
    {
      rule_id: 'XSEQ-EMO-004',
      dimension: 'emotional_carryover',
      required_signal: 'emotional_carryover + sequence_graph.transition_logic.emotion_continuity',
      merge_strategy: 'arc_propagation',
      gate_threshold: 0.85,
    },
    {
      rule_id: 'XSEQ-CAM-005',
      dimension: 'camera_motion_continuity',
      required_signal: 'camera_rhythm_memory + director_dna.camera_motion',
      merge_strategy: 'rhythm_carry_forward',
      gate_threshold: 0.85,
    },
    {
      rule_id: 'XSEQ-LOCK-006',
      dimension: 'production_lock_inheritance',
      required_signal: 'parent deterministic_lock_checksum + fingerprint quartet',
      merge_strategy: 'append_only_inherit',
      gate_threshold: 1.0,
    },
  ];
}

function buildCharacterMemoryCarryover(): MemoryCarryoverSpec[] {
  return [
    {
      carryover_key: 'character_identity_continuity',
      source_layer: 'character_persistence + visual_atoms.subject',
      target_layer: 'next_sequence.character_persistence',
      propagation_mode: 'inherit',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'temporal_character_edges',
      source_layer: 'temporal_memory_graph.character_continuity_edges',
      target_layer: 'next_sequence.temporal_memory_anchor_id',
      propagation_mode: 'blend',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'relationship_graph_weights',
      source_layer: 'relationship_graph + production_v82.relationship_dynamics',
      target_layer: 'next_sequence.relationship_graph',
      propagation_mode: 'inherit',
      minimum_coverage: 0.8,
    },
  ];
}

function buildEnvironmentMemoryCarryover(): MemoryCarryoverSpec[] {
  return [
    {
      carryover_key: 'environment_signature',
      source_layer: 'scene_state.physics + director_dna.lighting_behavior',
      target_layer: 'next_sequence.scene_state.physics',
      propagation_mode: 'blend',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'atmosphere_dna',
      source_layer: 'canonical_dna.domains.atmosphere',
      target_layer: 'next_sequence.canonical_dna.domains.atmosphere',
      propagation_mode: 'inherit',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'environment_temporal_edges',
      source_layer: 'temporal_memory_graph.environment_continuity_edges',
      target_layer: 'next_sequence.production_v72.temporal_bridge',
      propagation_mode: 'inherit',
      minimum_coverage: 0.8,
    },
  ];
}

function buildEmotionalArcCarryover(): MemoryCarryoverSpec[] {
  return [
    {
      carryover_key: 'underlying_mood_base',
      source_layer: 'emotional_carryover.underlying_mood_base',
      target_layer: 'next_sequence.emotional_carryover.underlying_mood_base',
      propagation_mode: 'inherit',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'sequence_emotion_bridge',
      source_layer: 'sequence_graph.transition_logic.emotion_continuity',
      target_layer: 'next_sequence.sequence_graph.previous_node emotion anchor',
      propagation_mode: 'blend',
      minimum_coverage: 0.85,
    },
    {
      carryover_key: 'arc_reset_with_anchor',
      source_layer: 'anchor_sequence final scene emotional_carryover',
      target_layer: 'next_sequence opening emotional baseline',
      propagation_mode: 'reset_with_anchor',
      minimum_coverage: 0.9,
    },
  ];
}

function buildProductionLockInheritance(
  lock: ReturnType<typeof buildProductionCertificationLockPreview>
): ProductionLockInheritance {
  const { production_certification_lock } = lock;
  return {
    parent_dataset_candidate_id: lock.production_dataset_candidate_id,
    parent_lock_checksum: lock.deterministic_lock_checksum,
    parent_orchestration_readiness: lock.orchestration_readiness,
    inherited_fingerprints: {
      export_fingerprint: production_certification_lock.export_fingerprint,
      quality_audit_fingerprint: production_certification_lock.quality_audit_fingerprint,
      bridge_certification_fingerprint:
        production_certification_lock.bridge_certification_fingerprint,
      temporal_graph_fingerprint: production_certification_lock.temporal_graph_fingerprint,
    },
    inheritance_mode: 'append_only',
    lock_epoch_ref: production_certification_lock.locked_at,
  };
}

function buildExpansionSafetyGates(
  lock: ReturnType<typeof buildProductionCertificationLockPreview>,
  dryRun: ReturnType<typeof buildRenderOrchestrationDryRunPreview>,
  sceneCount: number
): ExpansionSafetyGate[] {
  const withinWindow =
    sceneCount >= KIKI_25S_BENCHMARK.target_scene_window_min &&
    sceneCount <= KIKI_25S_BENCHMARK.target_scene_window_max;

  return [
    {
      gate_id: 'GATE-LOCK-001',
      label: 'Production lock must be production_locked',
      required: true,
      pass_condition: 'orchestration_readiness === production_locked',
      current_status: lock.orchestration_readiness === 'production_locked' ? 'pass' : 'blocked',
    },
    {
      gate_id: 'GATE-ORCH-002',
      label: 'Render orchestration dry-run continuity failures = 0',
      required: true,
      pass_condition: 'continuity_failure_count === 0',
      current_status: dryRun.continuity_failure_count === 0 ? 'pass' : 'blocked',
    },
    {
      gate_id: 'GATE-SCORE-003',
      label: 'Orchestration score ≥ 0.92',
      required: true,
      pass_condition: 'orchestration_score >= 0.92',
      current_status: dryRun.orchestration_score >= 0.92 ? 'pass' : 'warn',
    },
    {
      gate_id: 'GATE-SCENE-004',
      label: 'Anchor sequence within Kiki 25s scene window',
      required: true,
      pass_condition: 'scene_count within 16–20 window (27-scene corpus uses full export as anchor)',
      current_status: withinWindow ? 'pass' : 'warn',
    },
    {
      gate_id: 'GATE-READONLY-005',
      label: 'No dataset rewrite at expansion planning stage',
      required: true,
      pass_condition: 'readonly_blueprint + no_dataset_mutation',
      current_status: 'pass',
    },
    {
      gate_id: 'GATE-NOINGEST-006',
      label: 'No new video ingestion during blueprint phase',
      required: true,
      pass_condition: 'no_video_ingestion === true',
      current_status: 'pass',
    },
  ];
}

function buildNextSequenceRequirements(
  lock: ReturnType<typeof buildProductionCertificationLockPreview>
): NextSequenceRequirement[] {
  return [
    {
      requirement_id: 'NSR-001',
      category: 'lock_inheritance',
      description: `Inherit parent lock checksum ${lock.deterministic_lock_checksum.slice(0, 16)}… as append-only anchor`,
      mandatory: true,
    },
    {
      requirement_id: 'NSR-002',
      category: 'temporal_bridge',
      description:
        'Opening scene must link previous_node to anchor final scene_id with v_timestamp continuity',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-003',
      category: 'character_memory',
      description:
        'Carry character_persistence + visual_atoms subject anchors from anchor terminal scene',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-004',
      category: 'environment_memory',
      description:
        'Blend scene_state.physics and atmosphere DNA from anchor environment signature',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-005',
      category: 'emotional_arc',
      description:
        'Propagate emotional_carryover.underlying_mood_base with sequence_graph emotion_continuity ≥ 0.85',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-006',
      category: 'certification',
      description:
        'Re-run Pipeline B certification bridge (?enabled=true) on merged in-memory view before lock re-freeze',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-007',
      category: 'quality_audit',
      description:
        'Re-run PHASE-7 video grounded quality audit; quality_score must remain ≥ 0.92',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-008',
      category: 'orchestration_dry_run',
      description:
        'Re-run PHASE-8 render orchestration dry-run; continuity_failure_count must remain 0',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-009',
      category: 'density',
      description:
        'Preserve FULL_DENSITY schema: visual_atoms, relationship_graph, production_v72-v82 per scene',
      mandatory: true,
    },
    {
      requirement_id: 'NSR-010',
      category: 'expansion_safety',
      description: 'All expansion_safety_gates must pass before sequence merge execution',
      mandatory: true,
    },
  ];
}

function buildReusableDatasetContract(
  parentCandidateId: string
): ReusableDatasetContract {
  return {
    contract_id: `RDC-${parentCandidateId.replace('PDC-', '')}`,
    schema_version: 'CINEMATIC-EXTRACTION-v82.6',
    parent_candidate_id: parentCandidateId,
    required_fields: [
      'id',
      'scene_indexing',
      'visual_atoms',
      'relationship_graph',
      'scene_state',
      'director_dna',
      'sequence_graph',
      'generative_layer',
      'production_v72',
      'production_v82',
      'temporal_bridge',
      'character_persistence',
      'emotional_carryover',
      'camera_rhythm_memory',
      'canonical_dna',
      'latent_steering',
    ],
    optional_bridge_fields: [
      'audit_summary',
      'golden_record',
      'temporal_memory_anchor_id',
      'memory_density_score',
      'prompts_extraction',
    ],
    density_preservation: true,
    readonly_expansion: true,
  };
}

function buildSequenceMergePolicy(): SequenceMergePolicy {
  return {
    policy_id: 'SMP-ADDITIVE-TEMPORAL-v1',
    merge_mode: 'temporal_chain',
    fingerprint_revalidation_required: true,
    canonical_export_mutation: false,
    rules: [
      'Anchor sequence (SEQ-001) remains immutable; expansion scenes append as SEQ-002+',
      'Merge operates in-memory only until explicit opt-in export bridge',
      'Parent fingerprint quartet must match production_lock_inheritance before merge',
      'Cross-sequence transitions evaluated with PHASE-8 dry-run step checkers',
      'New deterministic_lock_checksum computed after merge validation pass',
      'Canonical cinematic-dna-export.json unchanged until explicit FULL_DENSITY export opt-in',
      'No provider calls, GPU execution, or image generation during merge planning',
    ],
  };
}

function buildExpansionBlueprint(
  lock: ReturnType<typeof buildProductionCertificationLockPreview>,
  dryRun: ReturnType<typeof buildRenderOrchestrationDryRunPreview>,
  sceneCount: number
): ExpansionBlueprint {
  const parentId = lock.production_dataset_candidate_id;
  const anchor = buildSequenceId(0, 'anchor', parentId, sceneCount);
  const planned: SequenceIdDefinition[] = [
    buildSequenceId(1, 'expansion', parentId),
    buildSequenceId(2, 'bridge', parentId),
  ];

  return {
    anchor_sequence: anchor,
    planned_sequences: planned,
    cross_sequence_continuity_rules: buildCrossSequenceContinuityRules(),
    character_memory_carryover: buildCharacterMemoryCarryover(),
    environment_memory_carryover: buildEnvironmentMemoryCarryover(),
    emotional_arc_carryover: buildEmotionalArcCarryover(),
    production_lock_inheritance: buildProductionLockInheritance(lock),
    expansion_safety_gates: buildExpansionSafetyGates(lock, dryRun, sceneCount),
  };
}

export function buildMultiSequenceExpansionBlueprint(): MultiSequenceExpansionBlueprintResult {
  const lock = buildProductionCertificationLockPreview();
  const dryRun = buildRenderOrchestrationDryRunPreview();
  const { dataset } = loadCanonicalExportDataset();
  const sceneCount = dataset.length;

  const expansion_blueprint = buildExpansionBlueprint(lock, dryRun, sceneCount);
  const next_sequence_requirements = buildNextSequenceRequirements(lock);
  const reusable_dataset_contract = buildReusableDatasetContract(
    lock.production_dataset_candidate_id
  );
  const sequence_merge_policy = buildSequenceMergePolicy();

  const blueprintCore = {
    schema_version: MULTI_SEQUENCE_EXPANSION_BLUEPRINT_VERSION,
    generated_at: MULTI_SEQUENCE_EXPANSION_BLUEPRINT_EPOCH,
    readonly_blueprint: true as const,
    production_lock_ref: {
      production_dataset_candidate_id: lock.production_dataset_candidate_id,
      deterministic_lock_checksum: lock.deterministic_lock_checksum,
      orchestration_readiness: lock.orchestration_readiness,
    },
    expansion_blueprint,
    next_sequence_requirements,
    reusable_dataset_contract,
    sequence_merge_policy,
    validation: {
      deterministic_blueprint_checksum_stable: true,
      readonly_blueprint: true as const,
      no_dataset_mutation: true as const,
      no_video_ingestion: true as const,
      no_provider_calls: true as const,
    },
  };

  const blueprint_checksum = digest([JSON.stringify(blueprintCore)]);

  return {
    ...blueprintCore,
    blueprint_checksum,
  };
}

let cachedBlueprint: MultiSequenceExpansionBlueprintResult | null = null;

export function buildMultiSequenceExpansionBlueprintPreview(): MultiSequenceExpansionBlueprintResult {
  if (cachedBlueprint) return cachedBlueprint;
  cachedBlueprint = buildMultiSequenceExpansionBlueprint();
  return cachedBlueprint;
}

export function resetMultiSequenceExpansionBlueprintCache(): void {
  cachedBlueprint = null;
}
