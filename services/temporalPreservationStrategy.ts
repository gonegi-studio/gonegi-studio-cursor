import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_PRESERVATION_GAP_REPORT_PATH } from './conditioningPreservationGapAnalysis.js';

export const TEMPORAL_PRESERVATION_STRATEGY_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005D' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_SYSTEM_ID =
  'TEMPORAL_PRESERVATION_STRATEGY_V1' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT =
  'PASS_TEMPORAL_PRESERVATION_STRATEGY_V1' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_FAIL_VERDICT =
  'FAIL_TEMPORAL_PRESERVATION_STRATEGY_V1' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_STATUS =
  'TEMPORAL_PRESERVATION_STRATEGY_DEFINED' as const;

export const TEMPORAL_PRESERVATION_STRATEGY_DATASET_DIR =
  'datasets/movie_reconstruction_temporal_preservation' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_REGISTRY_PATH =
  `${TEMPORAL_PRESERVATION_STRATEGY_DATASET_DIR}/temporal-preservation-strategy-registry.json` as const;

export const TEMPORAL_MEMORY_SPECIFICATION_PATH =
  'reports/movie_reconstruction/TEMPORAL_MEMORY_SPECIFICATION.json' as const;
export const TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_STRATEGY_REPORT.json' as const;

const EXECUTION_FLAGS = {
  strategy_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface CausalTransitionRecord {
  transition_id: string;
  source_scene: string;
  target_scene: string;
  transition_type: 'cut' | 'dissolve' | 'fade';
  causal_reason: string;
  continuity_anchor: string;
  traceability_signature: string;
}

export interface TemporalMemoryRecord {
  timeline_id: string;
  source_video_id: string;
  source_scene: string;
  source_shot: string;
  edit_rhythm_signature: string;
  continuity_signature: string;
  memory_signature: string;
  traceability_signature: string;
  causal_transition_chain: string[];
}

export interface TemporalMemorySpecification {
  specification_id: string;
  phase: typeof TEMPORAL_PRESERVATION_STRATEGY_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_STRATEGY_SYSTEM_ID;
  generated_at: string;
  temporal_memory_format: Record<string, string>;
  edit_rhythm_binding_format: Record<string, string>;
  shot_continuity_format: Record<string, string>;
  temporal_traceability_format: Record<string, string>;
  causal_transition_format: Record<string, string>;
  temporal_retrieval_strategy: {
    strategy_id: string;
    primary_key: string[];
    fallback_keys: string[];
    matching_order: string[];
    description: string;
  };
  analysis: {
    temporal_preservation: string;
    edit_rhythm_binding: string;
    shot_boundary_continuity: string;
    scene_transition_memory: string;
    temporal_reconstruction_traceability: string;
    causal_transition_chain: string;
  };
  temporal_memory_records: TemporalMemoryRecord[];
  causal_transitions: CausalTransitionRecord[];
  temporal_memory_defined: true;
}

export interface TemporalPreservationStrategyReport {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_STRATEGY_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_STRATEGY_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof TEMPORAL_PRESERVATION_STRATEGY_STATUS
    | 'TEMPORAL_PRESERVATION_STRATEGY_NOT_DEFINED';
  validation_passed: boolean;
  temporal_preservation_strategy_defined: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  temporal_memory_defined: boolean;
  continuity_format_defined: boolean;
  traceability_format_defined: boolean;
  causal_transition_format_defined: boolean;
  retrieval_strategy_defined: boolean;
  temporal_memory_record_count: number;
  causal_transition_count: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function signature(prefix: string, payload: unknown): string {
  const hash = createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 16);
  return `${prefix}_${hash}`;
}

const TEMPORAL_MEMORY_FORMAT = {
  timeline_id: 'Unique timeline slot identifier binding shot to temporal memory record.',
  source_video_id: 'Canonical numerical DNA source identifier.',
  source_scene: 'Source scene identifier (e.g. scene_014).',
  source_shot: 'Source shot identifier (e.g. shot_003).',
  edit_rhythm_signature: 'Hash of edit_rhythm edit_points bound to this timeline slot.',
  continuity_signature: 'Hash of shot_boundary_continuity anchors across adjacent shots.',
  memory_signature: 'Hash of scene_transition_memory state at this timeline position.',
  traceability_signature: 'Deterministic lineage hash across numerical DNA and conditioning exports.',
  causal_transition_chain: 'Ordered list of transition_id references forming causal transition chain.',
} as const;

const EDIT_RHYTHM_BINDING_FORMAT = {
  binding_id: 'Unique edit rhythm binding record identifier.',
  source_video_id: 'Numerical DNA source video identifier.',
  edit_point_index: 'Zero-based index into edit_rhythm edit_points array.',
  timestamp_ms: 'Edit point timestamp in milliseconds.',
  shot_duration_ms: 'Bound shot duration in milliseconds.',
  cut_type: 'Edit cut enum: hard_cut | dissolve | fade.',
  rhythm_bucket: 'Tempo bucket enum: slow | medium | fast.',
  motion_vector_ref: 'Optional motion_vectors frame_pair ref for temporal smoothing weight.',
} as const;

const SHOT_CONTINUITY_FORMAT = {
  continuity_id: 'Unique shot boundary continuity record identifier.',
  timeline_id: 'Parent timeline_id for continuity slot.',
  source_shot: 'Current shot identifier.',
  next_shot: 'Following shot identifier in sequence.',
  continuity_anchor: 'Primary anchor preserved across boundary (e.g. gonegi_position).',
  boundary_type: 'Boundary classification: hard_cut | dissolve | fade.',
  continuity_score: 'Cross-shot anchor stability score in [0,1].',
  preserved_subsystems: 'List of preserved DNA subsystems at boundary (blocking_layout, camera_inertia, etc.).',
} as const;

const TEMPORAL_TRACEABILITY_FORMAT = {
  traceability_id: 'Unique temporal traceability record identifier.',
  timeline_id: 'Bound timeline slot identifier.',
  source_video_id: 'Numerical DNA source identifier.',
  numerical_dna_edit_rhythm_ref: 'Path to edit_rhythm subsystem in source_video_numerical_dna_full.',
  numerical_dna_motion_vectors_ref: 'Path to motion_vectors subsystem in source_video_numerical_dna_full.',
  conditioning_map_ref: 'Path to conditioning-map-export-bundle source entry.',
  scene_remap_ref: 'Scene remap gonegi_scene_id for environment continuity binding.',
  traceability_signature: 'Deterministic hash binding all lineage fields.',
} as const;

const CAUSAL_TRANSITION_FORMAT = {
  transition_id: 'Unique transition identifier (e.g. transition_014_015).',
  source_scene: 'Origin scene identifier.',
  target_scene: 'Destination scene identifier.',
  transition_type: 'Transition enum: cut | dissolve | fade.',
  causal_reason: 'Causal classification for transition (e.g. character_exit, emotional_beat, location_change).',
  continuity_anchor: 'Anchor preserved across transition (e.g. gonegi_position, blocking_layout).',
  traceability_signature: 'Deterministic hash binding transition lineage fields.',
} as const;

const TEMPORAL_RETRIEVAL_STRATEGY = {
  strategy_id: 'temporal_retrieval_v1',
  primary_key: ['timeline_id'],
  fallback_keys: ['source_video_id', 'source_scene', 'edit_rhythm_signature'],
  matching_order: [
    'exact timeline_id match',
    'source_video_id + source_scene + source_shot composite match',
    'edit_rhythm_signature hash match',
    'continuity_signature match for shot boundary lookup',
    'causal_transition_chain traversal from transition_id',
  ],
  description:
    'Retrieve temporal memory by timeline_id; resolve shot_boundary_continuity via continuity_signature; traverse causal_transition_chain for scene transitions; bind edit_rhythm from numerical DNA full export.',
} as const;

const ANALYSIS = {
  temporal_preservation:
    'temporal_preservation preservation_score=0.28 with CRITICAL loss; strategy defines temporal memory and causal chains without GPU video backend execution.',
  edit_rhythm_binding:
    'edit_rhythm edit_points from source_video_numerical_dna_full bind to timeline slots via edit_rhythm_signature for shot duration and cut_type preservation.',
  shot_boundary_continuity:
    'shot_continuity_format links adjacent shots with continuity_anchor and preserved_subsystems; addresses critical_loss_fields temporal.shot_boundary_continuity.',
  scene_transition_memory:
    'memory_signature captures scene_transition_memory state; integrates SpatialConsistencyMemory and spirited-away/titanic timeline registries as design references.',
  temporal_reconstruction_traceability:
    'traceability_signature binds numerical DNA edit_rhythm and motion_vectors refs to conditioning map export paths for audit without backend execution.',
  causal_transition_chain:
    'Ordered causal_transition records explain scene transitions with causal_reason and continuity_anchor; enables narrative-causal reconstruction planning.',
} as const;

const SEED_TRANSITIONS: Array<Omit<CausalTransitionRecord, 'traceability_signature'>> = [
  {
    transition_id: 'transition_014_015',
    source_scene: 'scene_014',
    target_scene: 'scene_015',
    transition_type: 'cut',
    causal_reason: 'character_exit',
    continuity_anchor: 'gonegi_position',
  },
  {
    transition_id: 'transition_015_016',
    source_scene: 'scene_015',
    target_scene: 'scene_016',
    transition_type: 'dissolve',
    causal_reason: 'emotional_beat',
    continuity_anchor: 'blocking_layout',
  },
  {
    transition_id: 'transition_ghibli_001_002',
    source_scene: 'scene_001',
    target_scene: 'scene_002',
    transition_type: 'cut',
    causal_reason: 'location_change',
    continuity_anchor: 'environment_anchor',
  },
];

const SEED_TIMELINE: Array<
  Omit<
    TemporalMemoryRecord,
    'edit_rhythm_signature' | 'continuity_signature' | 'memory_signature' | 'traceability_signature' | 'causal_transition_chain'
  > & { edit_rhythm_payload: unknown; continuity_payload: unknown; memory_payload: unknown; trace_payload: unknown; causal_transition_chain: string[] }
> = [
  {
    timeline_id: 'timeline_titanic_014_003',
    source_video_id: 'TITANIC_02',
    source_scene: 'scene_014',
    source_shot: 'shot_003',
    edit_rhythm_payload: { cut_type: 'hard_cut', rhythm_bucket: 'medium', timestamp_ms: 0 },
    continuity_payload: { source_shot: 'shot_003', next_shot: 'shot_004', anchor: 'gonegi_position' },
    memory_payload: { scene_id: 'scene_titanic_02_deck_014', shot_id: 'shot_titanic_02_wide_003' },
    trace_payload: { source_video_id: 'TITANIC_02', source_scene: 'scene_014', source_shot: 'shot_003' },
    causal_transition_chain: ['transition_014_015'],
  },
  {
    timeline_id: 'timeline_titanic_015_001',
    source_video_id: 'TITANIC_02',
    source_scene: 'scene_015',
    source_shot: 'shot_001',
    edit_rhythm_payload: { cut_type: 'hard_cut', rhythm_bucket: 'medium', timestamp_ms: 3807 },
    continuity_payload: { source_shot: 'shot_001', next_shot: 'shot_002', anchor: 'gonegi_position' },
    memory_payload: { scene_id: 'scene_015', transition_from: 'transition_014_015' },
    trace_payload: { source_video_id: 'TITANIC_02', source_scene: 'scene_015', source_shot: 'shot_001' },
    causal_transition_chain: ['transition_014_015', 'transition_015_016'],
  },
  {
    timeline_id: 'timeline_ghibli_001_001',
    source_video_id: 'GHIBLI_01',
    source_scene: 'scene_001',
    source_shot: 'shot_001',
    edit_rhythm_payload: { cut_type: 'hard_cut', rhythm_bucket: 'medium', timestamp_ms: 0 },
    continuity_payload: { source_shot: 'shot_001', next_shot: 'shot_002', anchor: 'blocking_layout' },
    memory_payload: { scene_id: 'scene_ghibli_01_001', sequence: 'spirited_seq_0001' },
    trace_payload: { source_video_id: 'GHIBLI_01', source_scene: 'scene_001', source_shot: 'shot_001' },
    causal_transition_chain: ['transition_ghibli_001_002'],
  },
  {
    timeline_id: 'timeline_mori_001_001',
    source_video_id: 'MORI_01',
    source_scene: 'scene_forest_001',
    source_shot: 'shot_establishing_001',
    edit_rhythm_payload: { cut_type: 'hard_cut', rhythm_bucket: 'slow', timestamp_ms: 0 },
    continuity_payload: { source_shot: 'shot_establishing_001', next_shot: 'shot_establishing_002', anchor: 'camera_inertia' },
    memory_payload: { scene_id: 'scene_mori_forest_001' },
    trace_payload: { source_video_id: 'MORI_01', source_scene: 'scene_forest_001', source_shot: 'shot_establishing_001' },
    causal_transition_chain: [],
  },
];

function buildCausalTransitions(): CausalTransitionRecord[] {
  return SEED_TRANSITIONS.map((entry) => ({
    ...entry,
    traceability_signature: signature('trace', {
      transition_id: entry.transition_id,
      source_scene: entry.source_scene,
      target_scene: entry.target_scene,
      causal_reason: entry.causal_reason,
    }),
  }));
}

function buildTemporalMemoryRecords(): TemporalMemoryRecord[] {
  return SEED_TIMELINE.map((entry) => ({
    timeline_id: entry.timeline_id,
    source_video_id: entry.source_video_id,
    source_scene: entry.source_scene,
    source_shot: entry.source_shot,
    edit_rhythm_signature: signature('edit', entry.edit_rhythm_payload),
    continuity_signature: signature('continuity', entry.continuity_payload),
    memory_signature: signature('memory', entry.memory_payload),
    traceability_signature: signature('trace', entry.trace_payload),
    causal_transition_chain: [...entry.causal_transition_chain],
  }));
}

export function buildTemporalMemorySpecification(): TemporalMemorySpecification {
  return {
    specification_id: 'temporal-memory-specification-v1',
    phase: TEMPORAL_PRESERVATION_STRATEGY_PHASE,
    system_id: TEMPORAL_PRESERVATION_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    temporal_memory_format: { ...TEMPORAL_MEMORY_FORMAT },
    edit_rhythm_binding_format: { ...EDIT_RHYTHM_BINDING_FORMAT },
    shot_continuity_format: { ...SHOT_CONTINUITY_FORMAT },
    temporal_traceability_format: { ...TEMPORAL_TRACEABILITY_FORMAT },
    causal_transition_format: { ...CAUSAL_TRANSITION_FORMAT },
    temporal_retrieval_strategy: { ...TEMPORAL_RETRIEVAL_STRATEGY },
    analysis: { ...ANALYSIS },
    temporal_memory_records: buildTemporalMemoryRecords(),
    causal_transitions: buildCausalTransitions(),
    temporal_memory_defined: true,
  };
}

export function runTemporalPreservationStrategyValidation(
  projectRoot?: string
): TemporalPreservationStrategyReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: TemporalPreservationStrategyReport['issues'] = [];

  if (!fs.existsSync(path.join(root, TEMPORAL_PRESERVATION_STRATEGY_REGISTRY_PATH))) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${TEMPORAL_PRESERVATION_STRATEGY_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CONDITIONING_PRESERVATION_GAP_REPORT_PATH))) {
    issues.push({
      code: 'PRESERVATION_GAP_PREREQUISITE',
      message: 'Preservation gap analysis required before temporal strategy',
      severity: 'error',
    });
  }

  const specification = buildTemporalMemorySpecification();

  const temporal_memory_defined =
    specification.temporal_memory_defined === true &&
    specification.temporal_memory_records.length > 0;
  const continuity_format_defined =
    Object.keys(specification.shot_continuity_format).length > 0;
  const traceability_format_defined =
    Object.keys(specification.temporal_traceability_format).length > 0;
  const causal_transition_format_defined =
    Object.keys(specification.causal_transition_format).length > 0 &&
    specification.causal_transitions.length > 0;
  const retrieval_strategy_defined =
    specification.temporal_retrieval_strategy.strategy_id.length > 0 &&
    specification.temporal_retrieval_strategy.matching_order.length > 0;

  const exampleTransition = specification.causal_transitions.find(
    (entry) => entry.transition_id === 'transition_014_015'
  );

  if (!exampleTransition) {
    issues.push({
      code: 'EXAMPLE_TRANSITION',
      message: 'transition_014_015 causal transition example required',
      severity: 'error',
    });
  }
  if (!temporal_memory_defined) {
    issues.push({ code: 'TEMPORAL_MEMORY', message: 'temporal_memory must be defined', severity: 'error' });
  }
  if (!continuity_format_defined) {
    issues.push({ code: 'CONTINUITY_FORMAT', message: 'continuity_format must be defined', severity: 'error' });
  }
  if (!traceability_format_defined) {
    issues.push({
      code: 'TRACEABILITY_FORMAT',
      message: 'traceability_format must be defined',
      severity: 'error',
    });
  }
  if (!causal_transition_format_defined) {
    issues.push({
      code: 'CAUSAL_TRANSITION_FORMAT',
      message: 'causal_transition_format must be defined',
      severity: 'error',
    });
  }
  if (!retrieval_strategy_defined) {
    issues.push({
      code: 'RETRIEVAL_STRATEGY',
      message: 'retrieval_strategy must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    temporal_memory_defined &&
    continuity_format_defined &&
    traceability_format_defined &&
    causal_transition_format_defined &&
    retrieval_strategy_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: TemporalPreservationStrategyReport = {
    report_id: `temporal_preservation_strategy_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_STRATEGY_PHASE,
    system_id: TEMPORAL_PRESERVATION_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT
      : TEMPORAL_PRESERVATION_STRATEGY_FAIL_VERDICT,
    status: validation_passed
      ? TEMPORAL_PRESERVATION_STRATEGY_STATUS
      : 'TEMPORAL_PRESERVATION_STRATEGY_NOT_DEFINED',
    validation_passed,
    temporal_preservation_strategy_defined: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    temporal_memory_defined,
    continuity_format_defined,
    traceability_format_defined,
    causal_transition_format_defined,
    retrieval_strategy_defined,
    temporal_memory_record_count: specification.temporal_memory_records.length,
    causal_transition_count: specification.causal_transitions.length,
    checks: {
      temporal_memory_defined,
      continuity_format_defined,
      traceability_format_defined,
      causal_transition_format_defined,
      retrieval_strategy_defined,
      example_transition_present: Boolean(exampleTransition),
      edit_rhythm_binding_format_defined:
        Object.keys(specification.edit_rhythm_binding_format).length > 0,
      analysis_complete: Object.keys(specification.analysis).length === 6,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, TEMPORAL_MEMORY_SPECIFICATION_PATH, specification);
  writeJson(root, TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH, report);

  return report;
}

export function writeTemporalPreservationStrategyReport(
  projectRoot?: string
): TemporalPreservationStrategyReport {
  return runTemporalPreservationStrategyValidation(projectRoot);
}
