import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_PRESERVATION_GAP_REPORT_PATH } from './conditioningPreservationGapAnalysis.js';

export const ENVIRONMENT_IDENTITY_STRATEGY_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005C' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_SYSTEM_ID =
  'ENVIRONMENT_IDENTITY_STRATEGY_V1' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT =
  'PASS_ENVIRONMENT_IDENTITY_STRATEGY_V1' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_FAIL_VERDICT =
  'FAIL_ENVIRONMENT_IDENTITY_STRATEGY_V1' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_STATUS =
  'ENVIRONMENT_IDENTITY_STRATEGY_DEFINED' as const;

export const ENVIRONMENT_IDENTITY_STRATEGY_DATASET_DIR =
  'datasets/movie_reconstruction_environment_identity' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_REGISTRY_PATH =
  `${ENVIRONMENT_IDENTITY_STRATEGY_DATASET_DIR}/environment-identity-strategy-registry.json` as const;

export const ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_REFERENCE_BANK_SPECIFICATION.json' as const;
export const ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_STRATEGY_REPORT.json' as const;

const EXECUTION_FLAGS = {
  strategy_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface EnvironmentReferenceBankEntry {
  environment_id: string;
  source_movie: string;
  source_scene: string;
  source_shot: string;
  reference_bank_id: string;
  source_video_id: string;
  anchor_images: string[];
  anchor_descriptors: Array<{
    anchor_id: string;
    anchor_kind: string;
    normalized_position: [number, number, number];
    importance: number;
  }>;
  layout_signature: string;
  memory_signature: string;
  traceability_signature: string;
}

export interface EnvironmentReferenceBankSpecification {
  specification_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_STRATEGY_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_STRATEGY_SYSTEM_ID;
  generated_at: string;
  environment_reference_bank_structure: Record<string, string>;
  environment_anchor_format: Record<string, string>;
  environment_memory_format: Record<string, string>;
  environment_reconstruction_traceability_format: Record<string, string>;
  environment_retrieval_strategy: {
    strategy_id: string;
    primary_key: string[];
    fallback_keys: string[];
    matching_order: string[];
    description: string;
  };
  analysis: {
    environment_identity: string;
    environment_reference_bank: string;
    location_anchor_reuse: string;
    scene_environment_memory: string;
    environment_reconstruction_traceability: string;
  };
  reference_bank_entries: EnvironmentReferenceBankEntry[];
  reference_bank_defined: true;
}

export interface EnvironmentIdentityStrategyReport {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_STRATEGY_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_STRATEGY_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ENVIRONMENT_IDENTITY_STRATEGY_STATUS
    | 'ENVIRONMENT_IDENTITY_STRATEGY_NOT_DEFINED';
  validation_passed: boolean;
  environment_identity_strategy_defined: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  reference_bank_defined: boolean;
  anchor_format_defined: boolean;
  memory_format_defined: boolean;
  traceability_format_defined: boolean;
  retrieval_strategy_defined: boolean;
  reference_bank_entry_count: number;
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

const ENVIRONMENT_REFERENCE_BANK_STRUCTURE = {
  bank_id: 'Unique reference bank identifier (env_ref_NNN).',
  entries: 'Array of environment reference records keyed by environment_id.',
  entry_fields:
    'environment_id, source_movie, source_scene, source_shot, reference_bank_id, anchor_images, anchor_descriptors, layout_signature, memory_signature, traceability_signature.',
  indexing:
    'Primary index by environment_id; secondary indexes by source_video_id and layout_signature.',
  storage_path: 'datasets/movie_reconstruction_environment_identity/reference_bank/',
} as const;

const ENVIRONMENT_ANCHOR_FORMAT = {
  anchor_id: 'Canonical environment anchor label (e.g. staircase_railing_01).',
  anchor_kind:
    'Anchor classification enum: staircase | table | window | door | railing | architectural_space | environment_anchor.',
  normalized_position: 'Vec3 [x,y,z] in screen-normalized space from spatial graph environment_nodes.',
  importance: 'Anchor persistence weight in [0,1] derived from EnvironmentAnchorConditioning.',
  environment_type: 'Environment type label from RuntimeSpatialGraph environment_nodes.',
  scene_category: 'Scene category enum binding anchor to movie scene class.',
} as const;

const ENVIRONMENT_MEMORY_FORMAT = {
  memory_id: 'Scene-scoped environment memory record identifier.',
  movie_id: 'Parent movie identifier for SpatialConsistencyMemoryStore.',
  scene_id: 'Scene identifier binding memory entry to spatial graph scene.',
  environment_anchors: 'Map of anchor_id to Vec3 position persisted across scenes.',
  location_anchor_reuse: 'Boolean flag indicating anchor reused from reference bank entry.',
  reference_bank_id: 'Optional link to environment reference bank record when reused.',
  persistence_score: 'Cross-scene anchor position stability score in [0,1].',
} as const;

const ENVIRONMENT_RECONSTRUCTION_TRACEABILITY_FORMAT = {
  traceability_id: 'Unique traceability record for environment reconstruction lineage.',
  environment_id: 'Target environment_id in reference bank.',
  source_video_id: 'Canonical numerical DNA source identifier (e.g. TITANIC_02).',
  source_scene_id: 'Full source scene identifier from scene_remap engine.',
  source_shot_id: 'Full source shot identifier from scene_remap engine.',
  numerical_dna_ref: 'Path to source_video_numerical_dna_full source record.',
  scene_remap_ref: 'gonegi_scene_id from scene_remap subsystem.',
  conditioning_map_ref: 'Path to conditioning-map-export-bundle source entry.',
  traceability_signature: 'Deterministic hash binding all lineage fields.',
} as const;

const ENVIRONMENT_RETRIEVAL_STRATEGY = {
  strategy_id: 'environment_retrieval_v1',
  primary_key: ['environment_id'],
  fallback_keys: ['layout_signature', 'source_video_id', 'source_scene'],
  matching_order: [
    'exact environment_id match',
    'layout_signature hash match',
    'source_video_id + source_scene composite match',
    'anchor_descriptors kind+importance similarity rank',
  ],
  description:
    'Retrieve environment reference bank entry by environment_id first; fall back to layout_signature match against conditioning map export; reuse location anchors via SpatialConsistencyMemory environment_anchors when reference_bank_id is bound.',
} as const;

const ANALYSIS = {
  environment_identity:
    'Current environment_identity_map is reserved_v1 with preservation_score=0.12; strategy replaces reserved slot with reference bank binding via anchor_images and anchor_descriptors without GPU raster generation.',
  environment_reference_bank:
    'Central bank stores per-environment layout, memory, and traceability signatures derived from numerical DNA, scene_remap, and spatial graph anchors; enables IP-Adapter and regional prompting identity recovery.',
  location_anchor_reuse:
    'EnvironmentAnchorConstraint anchors from spatial graph map to bank entries; SpatialConsistencyMemory environment_anchors enable cross-scene location_anchor_reuse when reference_bank_id is stable.',
  scene_environment_memory:
    'SpatialConsistencyMemoryStore records environment_anchors per scene_id; memory_signature hashes anchor positions for continuity validation across reconstruction shots.',
  environment_reconstruction_traceability:
    'traceability_signature binds source_video_id, scene_remap gonegi_scene_id, and conditioning map export path for full lineage audit without backend execution.',
} as const;

const SEED_ENTRIES: Array<Omit<EnvironmentReferenceBankEntry, 'layout_signature' | 'memory_signature' | 'traceability_signature'>> = [
  {
    environment_id: 'titanic_staircase_001',
    source_movie: 'Titanic',
    source_scene: 'scene_014',
    source_shot: 'shot_003',
    reference_bank_id: 'env_ref_001',
    source_video_id: 'TITANIC_02',
    anchor_images: [
      'datasets/movie_reconstruction_environment_identity/reference_bank/titanic_staircase_001/anchor_staircase_wide.png',
      'datasets/movie_reconstruction_environment_identity/reference_bank/titanic_staircase_001/anchor_railing_detail.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'staircase_grand_01',
        anchor_kind: 'staircase',
        normalized_position: [0.5, 0.62, 0.85],
        importance: 0.95,
      },
      {
        anchor_id: 'railing_promenade_01',
        anchor_kind: 'railing',
        normalized_position: [0.72, 0.55, 0.78],
        importance: 0.88,
      },
    ],
  },
  {
    environment_id: 'ghibli_kitchen_001',
    source_movie: 'Spirited Away',
    source_scene: 'scene_001',
    source_shot: 'shot_001',
    reference_bank_id: 'env_ref_002',
    source_video_id: 'GHIBLI_01',
    anchor_images: [
      'datasets/movie_reconstruction_environment_identity/reference_bank/ghibli_kitchen_001/anchor_kitchen_table.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'kitchen_table_01',
        anchor_kind: 'table',
        normalized_position: [0.48, 0.58, 0.72],
        importance: 0.82,
      },
      {
        anchor_id: 'kitchen_window_01',
        anchor_kind: 'window',
        normalized_position: [0.22, 0.4, 0.65],
        importance: 0.8,
      },
    ],
  },
  {
    environment_id: 'gonegi_harbor_dock_001',
    source_movie: 'Gonegi',
    source_scene: 'scene_harbor_001',
    source_shot: 'shot_wide_001',
    reference_bank_id: 'env_ref_003',
    source_video_id: 'GHIBLI_01',
    anchor_images: [
      'datasets/movie_reconstruction_environment_identity/reference_bank/gonegi_harbor_dock_001/anchor_dock_wide.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'harbor_dock_01',
        anchor_kind: 'architectural_space',
        normalized_position: [0.5, 0.7, 0.9],
        importance: 0.92,
      },
    ],
  },
  {
    environment_id: 'mori_forest_clearing_001',
    source_movie: 'Mori',
    source_scene: 'scene_forest_001',
    source_shot: 'shot_establishing_001',
    reference_bank_id: 'env_ref_004',
    source_video_id: 'MORI_01',
    anchor_images: [
      'datasets/movie_reconstruction_environment_identity/reference_bank/mori_forest_clearing_001/anchor_clearing.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'forest_clearing_01',
        anchor_kind: 'architectural_space',
        normalized_position: [0.5, 0.65, 0.88],
        importance: 0.9,
      },
    ],
  },
];

function buildReferenceBankEntries(): EnvironmentReferenceBankEntry[] {
  return SEED_ENTRIES.map((entry) => {
    const layoutPayload = {
      environment_id: entry.environment_id,
      anchors: entry.anchor_descriptors,
    };
    const memoryPayload = {
      environment_id: entry.environment_id,
      source_video_id: entry.source_video_id,
      anchors: entry.anchor_descriptors.map((anchor) => anchor.anchor_id),
    };
    const tracePayload = {
      environment_id: entry.environment_id,
      source_movie: entry.source_movie,
      source_scene: entry.source_scene,
      source_shot: entry.source_shot,
      source_video_id: entry.source_video_id,
      reference_bank_id: entry.reference_bank_id,
    };

    return {
      ...entry,
      layout_signature: signature('layout', layoutPayload),
      memory_signature: signature('memory', memoryPayload),
      traceability_signature: signature('trace', tracePayload),
    };
  });
}

export function buildEnvironmentReferenceBankSpecification(): EnvironmentReferenceBankSpecification {
  return {
    specification_id: 'environment-reference-bank-specification-v1',
    phase: ENVIRONMENT_IDENTITY_STRATEGY_PHASE,
    system_id: ENVIRONMENT_IDENTITY_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    environment_reference_bank_structure: { ...ENVIRONMENT_REFERENCE_BANK_STRUCTURE },
    environment_anchor_format: { ...ENVIRONMENT_ANCHOR_FORMAT },
    environment_memory_format: { ...ENVIRONMENT_MEMORY_FORMAT },
    environment_reconstruction_traceability_format: {
      ...ENVIRONMENT_RECONSTRUCTION_TRACEABILITY_FORMAT,
    },
    environment_retrieval_strategy: { ...ENVIRONMENT_RETRIEVAL_STRATEGY },
    analysis: { ...ANALYSIS },
    reference_bank_entries: buildReferenceBankEntries(),
    reference_bank_defined: true,
  };
}

export function runEnvironmentIdentityStrategyValidation(
  projectRoot?: string
): EnvironmentIdentityStrategyReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: EnvironmentIdentityStrategyReport['issues'] = [];

  if (!fs.existsSync(path.join(root, ENVIRONMENT_IDENTITY_STRATEGY_REGISTRY_PATH))) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${ENVIRONMENT_IDENTITY_STRATEGY_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CONDITIONING_PRESERVATION_GAP_REPORT_PATH))) {
    issues.push({
      code: 'PRESERVATION_GAP_PREREQUISITE',
      message: 'Preservation gap analysis required before environment identity strategy',
      severity: 'error',
    });
  }

  const specification = buildEnvironmentReferenceBankSpecification();

  const reference_bank_defined =
    specification.reference_bank_defined === true &&
    specification.reference_bank_entries.length > 0;
  const anchor_format_defined =
    Object.keys(specification.environment_anchor_format).length > 0;
  const memory_format_defined =
    Object.keys(specification.environment_memory_format).length > 0;
  const traceability_format_defined =
    Object.keys(specification.environment_reconstruction_traceability_format).length > 0;
  const retrieval_strategy_defined =
    specification.environment_retrieval_strategy.strategy_id.length > 0 &&
    specification.environment_retrieval_strategy.matching_order.length > 0;

  const titanicEntry = specification.reference_bank_entries.find(
    (entry) => entry.environment_id === 'titanic_staircase_001'
  );

  if (!titanicEntry) {
    issues.push({
      code: 'TITANIC_ENTRY',
      message: 'titanic_staircase_001 reference bank entry required',
      severity: 'error',
    });
  }
  if (!reference_bank_defined) {
    issues.push({ code: 'REFERENCE_BANK', message: 'reference_bank must be defined', severity: 'error' });
  }
  if (!anchor_format_defined) {
    issues.push({ code: 'ANCHOR_FORMAT', message: 'anchor_format must be defined', severity: 'error' });
  }
  if (!memory_format_defined) {
    issues.push({ code: 'MEMORY_FORMAT', message: 'memory_format must be defined', severity: 'error' });
  }
  if (!traceability_format_defined) {
    issues.push({
      code: 'TRACEABILITY_FORMAT',
      message: 'traceability_format must be defined',
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
    reference_bank_defined &&
    anchor_format_defined &&
    memory_format_defined &&
    traceability_format_defined &&
    retrieval_strategy_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: EnvironmentIdentityStrategyReport = {
    report_id: `environment_identity_strategy_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_STRATEGY_PHASE,
    system_id: ENVIRONMENT_IDENTITY_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT
      : ENVIRONMENT_IDENTITY_STRATEGY_FAIL_VERDICT,
    status: validation_passed
      ? ENVIRONMENT_IDENTITY_STRATEGY_STATUS
      : 'ENVIRONMENT_IDENTITY_STRATEGY_NOT_DEFINED',
    validation_passed,
    environment_identity_strategy_defined: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    reference_bank_defined,
    anchor_format_defined,
    memory_format_defined,
    traceability_format_defined,
    retrieval_strategy_defined,
    reference_bank_entry_count: specification.reference_bank_entries.length,
    checks: {
      reference_bank_defined,
      anchor_format_defined,
      memory_format_defined,
      traceability_format_defined,
      retrieval_strategy_defined,
      titanic_entry_present: Boolean(titanicEntry),
      analysis_complete: Object.keys(specification.analysis).length === 5,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH, specification);
  writeJson(root, ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH, report);

  return report;
}

export function writeEnvironmentIdentityStrategyReport(
  projectRoot?: string
): EnvironmentIdentityStrategyReport {
  return runEnvironmentIdentityStrategyValidation(projectRoot);
}
