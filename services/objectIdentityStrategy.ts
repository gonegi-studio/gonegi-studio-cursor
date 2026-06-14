import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_PRESERVATION_GAP_REPORT_PATH } from './conditioningPreservationGapAnalysis.js';

export const OBJECT_IDENTITY_STRATEGY_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-005E' as const;
export const OBJECT_IDENTITY_STRATEGY_SYSTEM_ID = 'OBJECT_IDENTITY_STRATEGY_V1' as const;
export const OBJECT_IDENTITY_STRATEGY_PASS_VERDICT = 'PASS_OBJECT_IDENTITY_STRATEGY_V1' as const;
export const OBJECT_IDENTITY_STRATEGY_FAIL_VERDICT = 'FAIL_OBJECT_IDENTITY_STRATEGY_V1' as const;
export const OBJECT_IDENTITY_STRATEGY_STATUS = 'OBJECT_IDENTITY_STRATEGY_DEFINED' as const;

export const OBJECT_IDENTITY_STRATEGY_DATASET_DIR =
  'datasets/movie_reconstruction_object_identity' as const;
export const OBJECT_IDENTITY_STRATEGY_REGISTRY_PATH =
  `${OBJECT_IDENTITY_STRATEGY_DATASET_DIR}/object-identity-strategy-registry.json` as const;

export const OBJECT_REFERENCE_BANK_SPECIFICATION_PATH =
  'reports/movie_reconstruction/OBJECT_REFERENCE_BANK_SPECIFICATION.json' as const;
export const OBJECT_IDENTITY_STRATEGY_REPORT_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_STRATEGY_REPORT.json' as const;

export type ObjectIdentityLevel = 'strict' | 'medium' | 'loose';

const EXECUTION_FLAGS = {
  strategy_only: true as const,
  implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ObjectAnchorDescriptor {
  anchor_id: string;
  anchor_kind: string;
  normalized_position: [number, number, number];
  importance: number;
}

export interface ObjectReferenceBankEntry {
  object_id: string;
  source_movie: string;
  source_scene: string;
  source_shot: string;
  reference_bank_id: string;
  source_video_id: string;
  identity_level: ObjectIdentityLevel;
  variation_tolerance: number;
  anchor_images: string[];
  anchor_descriptors: ObjectAnchorDescriptor[];
  identity_signature: string;
  memory_signature: string;
  traceability_signature: string;
}

export interface ObjectReferenceBankSpecification {
  specification_id: string;
  phase: typeof OBJECT_IDENTITY_STRATEGY_PHASE;
  system_id: typeof OBJECT_IDENTITY_STRATEGY_SYSTEM_ID;
  generated_at: string;
  identity_levels: Record<string, string>;
  object_reference_bank_structure: Record<string, string>;
  object_anchor_format: Record<string, string>;
  object_memory_format: Record<string, string>;
  object_reconstruction_traceability_format: Record<string, string>;
  object_variation_tolerance_format: Record<string, string>;
  object_retrieval_strategy: {
    strategy_id: string;
    primary_key: string[];
    fallback_keys: string[];
    matching_order: string[];
    description: string;
  };
  analysis: {
    object_identity: string;
    object_reference_bank: string;
    object_anchor_reuse: string;
    scene_object_memory: string;
    object_reconstruction_traceability: string;
    object_variation_tolerance: string;
  };
  reference_bank_entries: ObjectReferenceBankEntry[];
  reference_bank_defined: true;
}

export interface ObjectIdentityStrategyReport {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_STRATEGY_PHASE;
  system_id: typeof OBJECT_IDENTITY_STRATEGY_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof OBJECT_IDENTITY_STRATEGY_STATUS | 'OBJECT_IDENTITY_STRATEGY_NOT_DEFINED';
  validation_passed: boolean;
  object_identity_strategy_defined: boolean;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  reference_bank_defined: boolean;
  anchor_format_defined: boolean;
  memory_format_defined: boolean;
  traceability_format_defined: boolean;
  variation_tolerance_defined: boolean;
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

const IDENTITY_LEVELS = {
  STRICT: 'Maximum identity lock; variation_tolerance typically <= 0.10; IP-Adapter weight high.',
  MEDIUM: 'Balanced identity lock; variation_tolerance typically 0.10–0.30; allows lighting/pose drift.',
  LOOSE: 'Soft identity lock; variation_tolerance typically >= 0.30; preserves object class over instance detail.',
} as const;

const OBJECT_REFERENCE_BANK_STRUCTURE = {
  bank_id: 'Unique reference bank identifier (obj_ref_NNN).',
  entries: 'Array of object reference records keyed by object_id.',
  entry_fields:
    'object_id, source_movie, source_scene, source_shot, reference_bank_id, identity_level, variation_tolerance, anchor_images, anchor_descriptors, identity_signature, memory_signature, traceability_signature.',
  indexing:
    'Primary index by object_id; secondary indexes by identity_signature and source_video_id + source_scene.',
  storage_path: 'datasets/movie_reconstruction_object_identity/reference_bank/',
} as const;

const OBJECT_ANCHOR_FORMAT = {
  anchor_id: 'Canonical object anchor label (e.g. suitcase_handle_01).',
  anchor_kind:
    'Anchor classification enum: prop | furniture | vehicle | container | handheld | architectural_detail | object_anchor.',
  normalized_position: 'Vec3 [x,y,z] in screen-normalized space from spatial graph object_nodes.',
  importance: 'Anchor persistence weight in [0,1] derived from object blocking layout.',
  object_class: 'Object class label for variation_tolerance fallback matching.',
  identity_level: 'Identity lock enum: strict | medium | loose.',
} as const;

const OBJECT_MEMORY_FORMAT = {
  memory_id: 'Scene-scoped object memory record identifier.',
  movie_id: 'Parent movie identifier for scene object memory store.',
  scene_id: 'Scene identifier binding memory entry to spatial graph scene.',
  object_anchors: 'Map of object_id to anchor positions persisted across shots.',
  object_anchor_reuse: 'Boolean flag indicating object anchor reused from reference bank entry.',
  reference_bank_id: 'Optional link to object reference bank record when reused.',
  identity_level: 'Identity lock enum bound at memory capture time.',
  persistence_score: 'Cross-shot object anchor stability score in [0,1].',
} as const;

const OBJECT_RECONSTRUCTION_TRACEABILITY_FORMAT = {
  traceability_id: 'Unique traceability record for object reconstruction lineage.',
  object_id: 'Target object_id in reference bank.',
  source_video_id: 'Canonical numerical DNA source identifier (e.g. TITANIC_02).',
  source_scene_id: 'Full source scene identifier from scene_remap engine.',
  source_shot_id: 'Full source shot identifier from scene_remap engine.',
  numerical_dna_ref: 'Path to source_video_numerical_dna_full source record.',
  scene_remap_ref: 'gonegi_scene_id from scene_remap subsystem.',
  conditioning_map_ref: 'Path to conditioning-map-export-bundle source entry.',
  identity_embedding_ref: 'Reserved IP-Adapter identity embedding path (metadata placeholder).',
  traceability_signature: 'Deterministic hash binding all lineage fields.',
} as const;

const OBJECT_VARIATION_TOLERANCE_FORMAT = {
  identity_level: 'Identity lock enum: strict | medium | loose.',
  variation_tolerance: 'Allowed identity drift score in [0,1]; lower = stricter lock.',
  strict_default: 'Default variation_tolerance for strict level: 0.05.',
  medium_default: 'Default variation_tolerance for medium level: 0.20.',
  loose_default: 'Default variation_tolerance for loose level: 0.40.',
  lock_strength: 'Derived IP-Adapter lock_strength = 1.0 - variation_tolerance.',
  tolerance_bounds: 'strict: [0,0.10]; medium: [0.10,0.30]; loose: [0.30,1.0].',
} as const;

const OBJECT_RETRIEVAL_STRATEGY = {
  strategy_id: 'object_retrieval_v1',
  primary_key: ['object_id'],
  fallback_keys: ['identity_signature', 'source_video_id', 'source_scene', 'identity_level'],
  matching_order: [
    'exact object_id match',
    'identity_signature hash match',
    'source_video_id + source_scene + object_class composite match',
    'identity_level + variation_tolerance band match',
    'anchor_descriptors kind+importance similarity rank',
  ],
  description:
    'Retrieve object reference bank entry by object_id first; fall back to identity_signature match; apply variation_tolerance band from identity_level for IP-Adapter weight selection without GPU execution.',
} as const;

const ANALYSIS = {
  object_identity:
    'object_identity preservation_score=0.55 with HIGH loss; object_identity map not exported and IP-Adapter embeddings unavailable in current adapter stack.',
  object_reference_bank:
    'Central bank stores per-object identity, memory, and traceability signatures derived from numerical DNA and spatial graph object_nodes; enables ip_adapter_identity_reference_bank recovery path.',
  object_anchor_reuse:
    'Object anchor descriptors from blocking layout map to bank entries; scene_object_memory enables cross-shot object_anchor_reuse when reference_bank_id is stable.',
  scene_object_memory:
    'Scene object memory records object_anchors per scene_id; memory_signature hashes anchor positions and identity_level for continuity validation across reconstruction shots.',
  object_reconstruction_traceability:
    'traceability_signature binds source_video_id, scene_remap gonegi_scene_id, conditioning map export path, and reserved identity_embedding_ref for full lineage audit.',
  object_variation_tolerance:
    'identity_level (strict | medium | loose) governs variation_tolerance band and lock_strength; strict props (suitcase_001) require low drift; loose furniture (chair_014) permits higher variation.',
} as const;

const SEED_ENTRIES: Array<
  Omit<ObjectReferenceBankEntry, 'identity_signature' | 'memory_signature' | 'traceability_signature'>
> = [
  {
    object_id: 'suitcase_001',
    source_movie: 'Titanic',
    source_scene: 'scene_014',
    source_shot: 'shot_003',
    reference_bank_id: 'obj_ref_001',
    source_video_id: 'TITANIC_02',
    identity_level: 'strict',
    variation_tolerance: 0.05,
    anchor_images: [
      'datasets/movie_reconstruction_object_identity/reference_bank/suitcase_001/anchor_suitcase_wide.png',
      'datasets/movie_reconstruction_object_identity/reference_bank/suitcase_001/anchor_suitcase_handle.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'suitcase_body_01',
        anchor_kind: 'container',
        normalized_position: [0.38, 0.72, 0.68],
        importance: 0.96,
      },
      {
        anchor_id: 'suitcase_handle_01',
        anchor_kind: 'handheld',
        normalized_position: [0.4, 0.65, 0.62],
        importance: 0.92,
      },
    ],
  },
  {
    object_id: 'chair_014',
    source_movie: 'Titanic',
    source_scene: 'scene_014',
    source_shot: 'shot_003',
    reference_bank_id: 'obj_ref_002',
    source_video_id: 'TITANIC_02',
    identity_level: 'loose',
    variation_tolerance: 0.4,
    anchor_images: [
      'datasets/movie_reconstruction_object_identity/reference_bank/chair_014/anchor_chair_deck.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'deck_chair_01',
        anchor_kind: 'furniture',
        normalized_position: [0.62, 0.78, 0.55],
        importance: 0.7,
      },
    ],
  },
  {
    object_id: 'lantern_001',
    source_movie: 'Spirited Away',
    source_scene: 'scene_001',
    source_shot: 'shot_001',
    reference_bank_id: 'obj_ref_003',
    source_video_id: 'GHIBLI_01',
    identity_level: 'medium',
    variation_tolerance: 0.2,
    anchor_images: [
      'datasets/movie_reconstruction_object_identity/reference_bank/lantern_001/anchor_lantern.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'lantern_hanging_01',
        anchor_kind: 'prop',
        normalized_position: [0.28, 0.35, 0.58],
        importance: 0.85,
      },
    ],
  },
  {
    object_id: 'wooden_crate_001',
    source_movie: 'Mori',
    source_scene: 'scene_forest_001',
    source_shot: 'shot_establishing_001',
    reference_bank_id: 'obj_ref_004',
    source_video_id: 'MORI_01',
    identity_level: 'medium',
    variation_tolerance: 0.25,
    anchor_images: [
      'datasets/movie_reconstruction_object_identity/reference_bank/wooden_crate_001/anchor_crate.png',
    ],
    anchor_descriptors: [
      {
        anchor_id: 'forest_crate_01',
        anchor_kind: 'container',
        normalized_position: [0.55, 0.82, 0.48],
        importance: 0.78,
      },
    ],
  },
];

function buildReferenceBankEntries(): ObjectReferenceBankEntry[] {
  return SEED_ENTRIES.map((entry) => {
    const identityPayload = {
      object_id: entry.object_id,
      identity_level: entry.identity_level,
      variation_tolerance: entry.variation_tolerance,
      anchors: entry.anchor_descriptors,
    };
    const memoryPayload = {
      object_id: entry.object_id,
      source_video_id: entry.source_video_id,
      identity_level: entry.identity_level,
      anchors: entry.anchor_descriptors.map((anchor) => anchor.anchor_id),
    };
    const tracePayload = {
      object_id: entry.object_id,
      source_movie: entry.source_movie,
      source_scene: entry.source_scene,
      source_shot: entry.source_shot,
      source_video_id: entry.source_video_id,
      reference_bank_id: entry.reference_bank_id,
    };

    return {
      ...entry,
      identity_signature: signature('identity', identityPayload),
      memory_signature: signature('memory', memoryPayload),
      traceability_signature: signature('trace', tracePayload),
    };
  });
}

export function buildObjectReferenceBankSpecification(): ObjectReferenceBankSpecification {
  return {
    specification_id: 'object-reference-bank-specification-v1',
    phase: OBJECT_IDENTITY_STRATEGY_PHASE,
    system_id: OBJECT_IDENTITY_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    identity_levels: { ...IDENTITY_LEVELS },
    object_reference_bank_structure: { ...OBJECT_REFERENCE_BANK_STRUCTURE },
    object_anchor_format: { ...OBJECT_ANCHOR_FORMAT },
    object_memory_format: { ...OBJECT_MEMORY_FORMAT },
    object_reconstruction_traceability_format: {
      ...OBJECT_RECONSTRUCTION_TRACEABILITY_FORMAT,
    },
    object_variation_tolerance_format: { ...OBJECT_VARIATION_TOLERANCE_FORMAT },
    object_retrieval_strategy: { ...OBJECT_RETRIEVAL_STRATEGY },
    analysis: { ...ANALYSIS },
    reference_bank_entries: buildReferenceBankEntries(),
    reference_bank_defined: true,
  };
}

export function runObjectIdentityStrategyValidation(
  projectRoot?: string
): ObjectIdentityStrategyReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ObjectIdentityStrategyReport['issues'] = [];

  if (!fs.existsSync(path.join(root, OBJECT_IDENTITY_STRATEGY_REGISTRY_PATH))) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${OBJECT_IDENTITY_STRATEGY_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, CONDITIONING_PRESERVATION_GAP_REPORT_PATH))) {
    issues.push({
      code: 'PRESERVATION_GAP_PREREQUISITE',
      message: 'Preservation gap analysis required before object identity strategy',
      severity: 'error',
    });
  }

  const specification = buildObjectReferenceBankSpecification();

  const reference_bank_defined =
    specification.reference_bank_defined === true &&
    specification.reference_bank_entries.length > 0;
  const anchor_format_defined = Object.keys(specification.object_anchor_format).length > 0;
  const memory_format_defined = Object.keys(specification.object_memory_format).length > 0;
  const traceability_format_defined =
    Object.keys(specification.object_reconstruction_traceability_format).length > 0;
  const variation_tolerance_defined =
    Object.keys(specification.object_variation_tolerance_format).length > 0;
  const retrieval_strategy_defined =
    specification.object_retrieval_strategy.strategy_id.length > 0 &&
    specification.object_retrieval_strategy.matching_order.length > 0;

  const suitcaseEntry = specification.reference_bank_entries.find(
    (entry) => entry.object_id === 'suitcase_001'
  );
  const chairEntry = specification.reference_bank_entries.find(
    (entry) => entry.object_id === 'chair_014'
  );

  if (!suitcaseEntry) {
    issues.push({
      code: 'SUITCASE_ENTRY',
      message: 'suitcase_001 reference bank entry required',
      severity: 'error',
    });
  } else if (suitcaseEntry.identity_level !== 'strict' || suitcaseEntry.variation_tolerance !== 0.05) {
    issues.push({
      code: 'SUITCASE_EXAMPLE',
      message: 'suitcase_001 must have identity_level=strict and variation_tolerance=0.05',
      severity: 'error',
    });
  }

  if (!chairEntry) {
    issues.push({
      code: 'CHAIR_ENTRY',
      message: 'chair_014 reference bank entry required',
      severity: 'error',
    });
  } else if (chairEntry.identity_level !== 'loose' || chairEntry.variation_tolerance !== 0.4) {
    issues.push({
      code: 'CHAIR_EXAMPLE',
      message: 'chair_014 must have identity_level=loose and variation_tolerance=0.40',
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
  if (!variation_tolerance_defined) {
    issues.push({
      code: 'VARIATION_TOLERANCE',
      message: 'variation_tolerance_format must be defined',
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
    variation_tolerance_defined &&
    retrieval_strategy_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ObjectIdentityStrategyReport = {
    report_id: `object_identity_strategy_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_STRATEGY_PHASE,
    system_id: OBJECT_IDENTITY_STRATEGY_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? OBJECT_IDENTITY_STRATEGY_PASS_VERDICT
      : OBJECT_IDENTITY_STRATEGY_FAIL_VERDICT,
    status: validation_passed
      ? OBJECT_IDENTITY_STRATEGY_STATUS
      : 'OBJECT_IDENTITY_STRATEGY_NOT_DEFINED',
    validation_passed,
    object_identity_strategy_defined: validation_passed,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    reference_bank_defined,
    anchor_format_defined,
    memory_format_defined,
    traceability_format_defined,
    variation_tolerance_defined,
    retrieval_strategy_defined,
    reference_bank_entry_count: specification.reference_bank_entries.length,
    checks: {
      reference_bank_defined,
      anchor_format_defined,
      memory_format_defined,
      traceability_format_defined,
      variation_tolerance_defined,
      retrieval_strategy_defined,
      suitcase_example_present: Boolean(suitcaseEntry),
      chair_example_present: Boolean(chairEntry),
      analysis_complete: Object.keys(specification.analysis).length === 6,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, OBJECT_REFERENCE_BANK_SPECIFICATION_PATH, specification);
  writeJson(root, OBJECT_IDENTITY_STRATEGY_REPORT_PATH, report);

  return report;
}

export function writeObjectIdentityStrategyReport(
  projectRoot?: string
): ObjectIdentityStrategyReport {
  return runObjectIdentityStrategyValidation(projectRoot);
}
