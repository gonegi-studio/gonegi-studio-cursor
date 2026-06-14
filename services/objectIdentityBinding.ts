import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_MAP_EXPORT_BUNDLE_PATH } from './conditioningMapExport.js';
import {
  OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
  buildObjectReferenceBankSpecification,
  type ObjectIdentityLevel,
  type ObjectReferenceBankEntry,
} from './objectIdentityStrategy.js';

export const OBJECT_IDENTITY_BINDING_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-009' as const;
export const OBJECT_IDENTITY_BINDING_SYSTEM_ID = 'OBJECT_IDENTITY_BINDING_V1' as const;
export const OBJECT_IDENTITY_BINDING_PASS_VERDICT = 'PASS_OBJECT_IDENTITY_BINDING_V1' as const;
export const OBJECT_IDENTITY_BINDING_FAIL_VERDICT = 'FAIL_OBJECT_IDENTITY_BINDING_V1' as const;
export const OBJECT_IDENTITY_BINDING_STATUS = 'OBJECT_IDENTITY_BINDINGS_DEFINED' as const;

export const OBJECT_IDENTITY_BINDING_DATASET_DIR =
  'datasets/movie_reconstruction_object_identity_binding' as const;
export const OBJECT_IDENTITY_BINDING_REGISTRY_PATH =
  `${OBJECT_IDENTITY_BINDING_DATASET_DIR}/object-identity-binding-registry.json` as const;

export const OBJECT_IDENTITY_BINDING_EXPORT_DIR =
  'exports/movie_reconstruction_object_identity' as const;
export const OBJECT_IDENTITY_BINDING_PACKAGE_PATH =
  `${OBJECT_IDENTITY_BINDING_EXPORT_DIR}/object-identity-binding-package.json` as const;

export const OBJECT_IDENTITY_BINDING_REPORT_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_BINDING_REPORT.json' as const;
export const OBJECT_IDENTITY_GAP_REPORT_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_GAP_REPORT.json' as const;

const NEXT_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-010_VIDEO_CONDITIONING_BACKEND_V1' as const;

const BINDING_TYPES = [
  'object_reference_bank_binding',
  'object_anchor_binding',
  'object_memory_binding',
  'object_traceability_binding',
  'object_retrieval_binding',
  'object_variation_tolerance_binding',
  'object_similarity_binding',
  'object_role_binding',
] as const;

type BindingType = (typeof BINDING_TYPES)[number];

type ObjectRole = 'hero_prop' | 'background_furniture' | 'scene_prop' | 'environment_prop';

const SIMILARITY_MATCHING_STRATEGY = {
  strategy_id: 'object_similarity_v1',
  primary_match: 'exact object_id',
  secondary_match: 'identity_signature hash equality',
  tertiary_match: 'anchor_descriptors kind+importance cosine rank',
  similarity_threshold: 0.82,
  same_object_threshold: 0.97,
  note: 'Similar Object != Same Object — scores below same_object_threshold must not be treated as identity lock.',
} as const;

const VARIATION_TOLERANCE_STRATEGY = {
  strategy_id: 'object_variation_tolerance_v1',
  strict_band: '[0, 0.10]',
  medium_band: '[0.10, 0.30]',
  loose_band: '[0.30, 1.0]',
  lock_strength_formula: '1.0 - variation_tolerance',
  note: 'Variation Tolerance must be evaluated separately from identity — lock_strength derives from tolerance band, not similarity score.',
} as const;

const ROLE_BINDING_STRATEGY = {
  strategy_id: 'object_role_v1',
  roles: ['hero_prop', 'background_furniture', 'scene_prop', 'environment_prop'],
  role_priority: 'hero_prop > scene_prop > environment_prop > background_furniture',
  note: 'Object Role must be evaluated separately from similarity — role governs narrative lock weight, not visual match score.',
} as const;

const EXECUTION_FLAGS = {
  binding_only: true as const,
  runtime_implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ObjectReferenceBankBindingRecord {
  binding_id: string;
  object_id: string;
  reference_bank_id: string;
  source_video_id: string;
  identity_signature: string;
}

export interface ObjectAnchorBindingRecord {
  binding_id: string;
  object_id: string;
  anchor_id: string;
  anchor_kind: string;
  normalized_position: [number, number, number];
  importance: number;
}

export interface ObjectMemoryBindingRecord {
  binding_id: string;
  object_id: string;
  scene_id: string;
  memory_signature: string;
  object_anchor_reuse: boolean;
  identity_level: ObjectIdentityLevel;
  persistence_score: number;
}

export interface ObjectTraceabilityBindingRecord {
  binding_id: string;
  object_id: string;
  source_video_id: string;
  conditioning_map_ref: string;
  object_spec_ref: string;
  identity_embedding_ref: string;
  traceability_signature: string;
}

export interface ObjectRetrievalBindingRecord {
  binding_id: string;
  object_id: string;
  strategy_id: string;
  primary_key: string;
  fallback_keys: string[];
}

export interface ObjectVariationToleranceBindingRecord {
  binding_id: string;
  object_id: string;
  identity_level: ObjectIdentityLevel;
  variation_tolerance: number;
  lock_strength: number;
}

export interface ObjectSimilarityBindingRecord {
  binding_id: string;
  object_id: string;
  identity_signature: string;
  similarity_threshold: number;
  same_object_threshold: number;
  matching_features: string[];
}

export interface ObjectRoleBindingRecord {
  binding_id: string;
  object_id: string;
  object_role: ObjectRole;
  role_weight: number;
  narrative_lock: boolean;
}

export interface ObjectBindingEntry {
  object_id: string;
  source_video_id: string;
  source_group: string;
  object_reference_bank_binding: ObjectReferenceBankBindingRecord;
  object_anchor_binding: ObjectAnchorBindingRecord;
  object_memory_binding: ObjectMemoryBindingRecord;
  object_traceability_binding: ObjectTraceabilityBindingRecord;
  object_retrieval_binding: ObjectRetrievalBindingRecord;
  object_variation_tolerance_binding: ObjectVariationToleranceBindingRecord;
  object_similarity_binding: ObjectSimilarityBindingRecord;
  object_role_binding: ObjectRoleBindingRecord;
}

export interface ObjectIdentityBindingPackage {
  package_id: string;
  phase: typeof OBJECT_IDENTITY_BINDING_PHASE;
  system_id: typeof OBJECT_IDENTITY_BINDING_SYSTEM_ID;
  generated_at: string;
  object_reference_bank_binding: Record<string, string>;
  object_anchor_binding: Record<string, string>;
  object_memory_binding: Record<string, string>;
  object_traceability_binding: Record<string, string>;
  object_retrieval_binding: Record<string, string>;
  object_variation_tolerance_binding: Record<string, string>;
  object_similarity_binding: Record<string, string>;
  object_role_binding: Record<string, string>;
  object_binding_defined: true;
  similarity_matching_strategy: typeof SIMILARITY_MATCHING_STRATEGY;
  variation_tolerance_strategy: typeof VARIATION_TOLERANCE_STRATEGY;
  role_binding_strategy: typeof ROLE_BINDING_STRATEGY;
  entries: ObjectBindingEntry[];
  source_bindings: ObjectBindingEntry[];
  traceability_coverage: number;
}

export interface ObjectIdentityBindingReport {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_BINDING_PHASE;
  system_id: typeof OBJECT_IDENTITY_BINDING_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof OBJECT_IDENTITY_BINDING_STATUS | 'OBJECT_IDENTITY_BINDINGS_NOT_DEFINED';
  validation_passed: boolean;
  object_bindings_defined: boolean;
  object_binding_defined: boolean;
  object_reference_bank_binding: boolean;
  object_anchor_binding: boolean;
  object_memory_binding: boolean;
  object_traceability_binding: boolean;
  object_retrieval_binding: boolean;
  object_variation_tolerance_binding: boolean;
  object_similarity_binding: boolean;
  object_role_binding: boolean;
  object_identity_solved: false;
  runtime_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  implemented_bindings: BindingType[];
  traceability_coverage: number;
  similarity_matching_strategy: typeof SIMILARITY_MATCHING_STRATEGY;
  variation_tolerance_strategy: typeof VARIATION_TOLERANCE_STRATEGY;
  role_binding_strategy: typeof ROLE_BINDING_STRATEGY;
  remaining_gaps: string[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ObjectIdentityGapReport {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_BINDING_PHASE;
  system_id: typeof OBJECT_IDENTITY_BINDING_SYSTEM_ID;
  generated_at: string;
  defined: string[];
  missing: string[];
  remaining_blockers: string[];
  next_phase: typeof NEXT_PHASE;
}

interface ConditioningMapSource {
  source_video_id: string;
  source_group: string;
}

interface ConditioningMapBundle {
  sources: ConditioningMapSource[];
}

const OBJECT_ROLE_MAP: Record<string, ObjectRole> = {
  suitcase_001: 'hero_prop',
  chair_014: 'background_furniture',
  lantern_001: 'scene_prop',
  wooden_crate_001: 'environment_prop',
};

const ROLE_WEIGHT: Record<ObjectRole, number> = {
  hero_prop: 0.95,
  scene_prop: 0.82,
  environment_prop: 0.75,
  background_furniture: 0.55,
};

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

const OBJECT_REFERENCE_BANK_BINDING_FORMAT = {
  binding_id: 'Unique object reference bank binding record identifier.',
  object_id: 'Canonical object identifier from reference bank.',
  reference_bank_id: 'Reference bank slot identifier (obj_ref_NNN).',
  source_video_id: 'Canonical numerical DNA source identifier.',
  identity_signature: 'Hash of object identity anchors and identity_level from reference bank entry.',
} as const;

const OBJECT_ANCHOR_BINDING_FORMAT = {
  binding_id: 'Unique object anchor binding record identifier.',
  object_id: 'Parent object identifier.',
  anchor_id: 'Canonical object anchor label.',
  anchor_kind: 'Anchor classification enum from object_anchor_format.',
  normalized_position: 'Vec3 [x,y,z] in screen-normalized space.',
  importance: 'Anchor persistence weight in [0,1].',
} as const;

const OBJECT_MEMORY_BINDING_FORMAT = {
  binding_id: 'Unique object memory binding record identifier.',
  object_id: 'Parent object identifier.',
  scene_id: 'Scene identifier binding memory entry to spatial graph scene.',
  memory_signature: 'Hash of object_anchors persisted across shots.',
  object_anchor_reuse: 'Boolean flag indicating anchor reused from reference bank entry.',
  identity_level: 'Identity lock enum: strict | medium | loose.',
  persistence_score: 'Cross-shot object anchor stability score in [0,1].',
} as const;

const OBJECT_TRACEABILITY_BINDING_FORMAT = {
  binding_id: 'Unique object traceability binding record identifier.',
  object_id: 'Target object_id in reference bank.',
  source_video_id: 'Canonical numerical DNA source identifier.',
  conditioning_map_ref: 'Path to conditioning-map-export-bundle source entry.',
  object_spec_ref: 'Path to OBJECT_REFERENCE_BANK_SPECIFICATION.json.',
  identity_embedding_ref: 'Reserved IP-Adapter identity embedding path (metadata placeholder).',
  traceability_signature: 'Deterministic hash binding all lineage fields.',
} as const;

const OBJECT_RETRIEVAL_BINDING_FORMAT = {
  binding_id: 'Unique object retrieval binding record identifier.',
  object_id: 'Target object identifier for retrieval.',
  strategy_id: 'Retrieval strategy identifier (object_retrieval_v1).',
  primary_key: 'Primary retrieval key field name.',
  fallback_keys: 'Ordered fallback key fields for retrieval.',
} as const;

const OBJECT_VARIATION_TOLERANCE_BINDING_FORMAT = {
  binding_id: 'Unique object variation tolerance binding record identifier.',
  object_id: 'Target object identifier.',
  identity_level: 'Identity lock enum: strict | medium | loose.',
  variation_tolerance: 'Allowed identity drift score in [0,1].',
  lock_strength: 'Derived IP-Adapter lock_strength = 1.0 - variation_tolerance.',
} as const;

const OBJECT_SIMILARITY_BINDING_FORMAT = {
  binding_id: 'Unique object similarity binding record identifier.',
  object_id: 'Target object identifier for similarity matching.',
  identity_signature: 'Identity signature hash used for similarity comparison.',
  similarity_threshold: 'Minimum score to treat objects as similar (not identical).',
  same_object_threshold: 'Minimum score required for same-object identity lock.',
  matching_features: 'Feature list used in similarity rank (anchor_kind, importance, identity_signature).',
} as const;

const OBJECT_ROLE_BINDING_FORMAT = {
  binding_id: 'Unique object role binding record identifier.',
  object_id: 'Target object identifier.',
  object_role: 'Narrative role enum: hero_prop | background_furniture | scene_prop | environment_prop.',
  role_weight: 'Narrative lock weight derived from object role priority.',
  narrative_lock: 'Boolean flag indicating role requires narrative-preserving identity lock.',
} as const;

function loadConditioningSources(root: string): ConditioningMapSource[] {
  const bundle = JSON.parse(
    fs.readFileSync(path.join(root, CONDITIONING_MAP_EXPORT_BUNDLE_PATH), 'utf8')
  ) as ConditioningMapBundle;
  return bundle.sources.map((source) => ({
    source_video_id: source.source_video_id,
    source_group: source.source_group,
  }));
}

function resolveBankEntryForSource(
  source: ConditioningMapSource,
  bankEntries: ObjectReferenceBankEntry[]
): ObjectReferenceBankEntry {
  const exact = bankEntries.find((entry) => entry.source_video_id === source.source_video_id);
  if (exact) {
    return exact;
  }
  const groupMatch = bankEntries.find((entry) => {
    const prefix = entry.source_video_id.split('_')[0]?.toLowerCase();
    return prefix === source.source_group;
  });
  if (groupMatch) {
    return groupMatch;
  }
  return bankEntries[0];
}

function resolveObjectRole(objectId: string): ObjectRole {
  return OBJECT_ROLE_MAP[objectId] ?? 'scene_prop';
}

function buildBindingEntry(
  bankEntry: ObjectReferenceBankEntry,
  sourceVideoId: string,
  sourceGroup: string
): ObjectBindingEntry {
  const primaryAnchor = bankEntry.anchor_descriptors[0];
  const scene_id = `scene_${bankEntry.object_id.replace(/_/g, '-')}`;
  const objectRole = resolveObjectRole(bankEntry.object_id);
  const memoryPayload = {
    object_id: bankEntry.object_id,
    source_video_id: sourceVideoId,
    identity_level: bankEntry.identity_level,
    anchors: bankEntry.anchor_descriptors.map((anchor) => anchor.anchor_id),
  };
  const tracePayload = {
    object_id: bankEntry.object_id,
    source_video_id: sourceVideoId,
    reference_bank_id: bankEntry.reference_bank_id,
    conditioning_map_ref: `${CONDITIONING_MAP_EXPORT_BUNDLE_PATH}#${sourceVideoId}`,
  };
  const lockStrength = Number((1.0 - bankEntry.variation_tolerance).toFixed(2));

  return {
    object_id: bankEntry.object_id,
    source_video_id: sourceVideoId,
    source_group: sourceGroup,
    object_reference_bank_binding: {
      binding_id: `orb_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      reference_bank_id: bankEntry.reference_bank_id,
      source_video_id: sourceVideoId,
      identity_signature: bankEntry.identity_signature,
    },
    object_anchor_binding: {
      binding_id: `oab_${bankEntry.object_id}_${primaryAnchor.anchor_id}`,
      object_id: bankEntry.object_id,
      anchor_id: primaryAnchor.anchor_id,
      anchor_kind: primaryAnchor.anchor_kind,
      normalized_position: [...primaryAnchor.normalized_position],
      importance: primaryAnchor.importance,
    },
    object_memory_binding: {
      binding_id: `omb_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      scene_id,
      memory_signature: signature('memory', memoryPayload),
      object_anchor_reuse: sourceVideoId === bankEntry.source_video_id,
      identity_level: bankEntry.identity_level,
      persistence_score: Number((0.65 + primaryAnchor.importance * 0.3).toFixed(2)),
    },
    object_traceability_binding: {
      binding_id: `otb_${bankEntry.object_id}_${sourceVideoId.toLowerCase()}`,
      object_id: bankEntry.object_id,
      source_video_id: sourceVideoId,
      conditioning_map_ref: tracePayload.conditioning_map_ref,
      object_spec_ref: OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
      identity_embedding_ref: `exports/movie_reconstruction_object_identity/embeddings/${bankEntry.object_id}/identity_embedding.placeholder`,
      traceability_signature: signature('trace', tracePayload),
    },
    object_retrieval_binding: {
      binding_id: `orv_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      strategy_id: 'object_retrieval_v1',
      primary_key: 'object_id',
      fallback_keys: ['identity_signature', 'source_video_id', 'identity_level'],
    },
    object_variation_tolerance_binding: {
      binding_id: `ovt_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      identity_level: bankEntry.identity_level,
      variation_tolerance: bankEntry.variation_tolerance,
      lock_strength: lockStrength,
    },
    object_similarity_binding: {
      binding_id: `osb_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      identity_signature: bankEntry.identity_signature,
      similarity_threshold: SIMILARITY_MATCHING_STRATEGY.similarity_threshold,
      same_object_threshold: SIMILARITY_MATCHING_STRATEGY.same_object_threshold,
      matching_features: ['anchor_kind', 'importance', 'identity_signature'],
    },
    object_role_binding: {
      binding_id: `orl_${bankEntry.object_id}`,
      object_id: bankEntry.object_id,
      object_role: objectRole,
      role_weight: ROLE_WEIGHT[objectRole],
      narrative_lock: objectRole === 'hero_prop' || objectRole === 'scene_prop',
    },
  };
}

export function buildObjectIdentityBindingPackage(
  projectRoot?: string
): ObjectIdentityBindingPackage {
  const root = resolveProjectRoot(projectRoot);
  const spec = buildObjectReferenceBankSpecification();
  const bankEntries = spec.reference_bank_entries;
  const sources = loadConditioningSources(root);

  const entries = bankEntries.map((bankEntry) =>
    buildBindingEntry(bankEntry, bankEntry.source_video_id, bankEntry.source_movie)
  );

  const source_bindings = sources.map((source) => {
    const bankEntry = resolveBankEntryForSource(source, bankEntries);
    return buildBindingEntry(bankEntry, source.source_video_id, source.source_group);
  });

  const traceable = source_bindings.filter(
    (entry) => entry.object_traceability_binding.traceability_signature.length > 0
  ).length;
  const traceability_coverage =
    source_bindings.length === 0 ? 0 : Number((traceable / source_bindings.length).toFixed(2));

  return {
    package_id: 'object-identity-binding-package-v1',
    phase: OBJECT_IDENTITY_BINDING_PHASE,
    system_id: OBJECT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    object_reference_bank_binding: { ...OBJECT_REFERENCE_BANK_BINDING_FORMAT },
    object_anchor_binding: { ...OBJECT_ANCHOR_BINDING_FORMAT },
    object_memory_binding: { ...OBJECT_MEMORY_BINDING_FORMAT },
    object_traceability_binding: { ...OBJECT_TRACEABILITY_BINDING_FORMAT },
    object_retrieval_binding: { ...OBJECT_RETRIEVAL_BINDING_FORMAT },
    object_variation_tolerance_binding: { ...OBJECT_VARIATION_TOLERANCE_BINDING_FORMAT },
    object_similarity_binding: { ...OBJECT_SIMILARITY_BINDING_FORMAT },
    object_role_binding: { ...OBJECT_ROLE_BINDING_FORMAT },
    object_binding_defined: true,
    similarity_matching_strategy: { ...SIMILARITY_MATCHING_STRATEGY },
    variation_tolerance_strategy: { ...VARIATION_TOLERANCE_STRATEGY },
    role_binding_strategy: { ...ROLE_BINDING_STRATEGY },
    entries,
    source_bindings,
    traceability_coverage,
  };
}

function buildGapReport(): ObjectIdentityGapReport {
  return {
    report_id: `object_identity_gap_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_BINDING_PHASE,
    system_id: OBJECT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    defined: [...BINDING_TYPES],
    missing: [
      'object_identity identity_embedding_ref generation',
      'IP-Adapter object reference raster execution',
      'anchor_images GPU raster generation',
      'variation_tolerance GPU validation',
      'object_identity_solved certification',
    ],
    remaining_blockers: [
      'gpu_execution disabled in this phase',
      'object_identity map not exported',
      'identity_embedding_ref is metadata placeholder only',
      'Similar Object != Same Object',
      'Variation Tolerance evaluated separately from identity',
      'Object Role evaluated separately from similarity',
      'Binding Defined != Object Identity Solved',
    ],
    next_phase: NEXT_PHASE,
  };
}

function entryHasAllBindings(entry: ObjectBindingEntry): boolean {
  return (
    entry.object_reference_bank_binding.binding_id.length > 0 &&
    entry.object_anchor_binding.binding_id.length > 0 &&
    entry.object_memory_binding.binding_id.length > 0 &&
    entry.object_traceability_binding.traceability_signature.length > 0 &&
    entry.object_retrieval_binding.binding_id.length > 0 &&
    entry.object_variation_tolerance_binding.binding_id.length > 0 &&
    entry.object_similarity_binding.binding_id.length > 0 &&
    entry.object_role_binding.binding_id.length > 0
  );
}

export function runObjectIdentityBindingValidation(
  projectRoot?: string
): ObjectIdentityBindingReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ObjectIdentityBindingReport['issues'] = [];

  const prerequisitePaths = [
    OBJECT_IDENTITY_BINDING_REGISTRY_PATH,
    OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
    CONDITIONING_MAP_EXPORT_BUNDLE_PATH,
  ];

  for (const rel of prerequisitePaths) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({
        code: 'PREREQUISITE_MISSING',
        message: `Missing prerequisite ${rel}`,
        severity: 'error',
      });
    }
  }

  const bindingPackage = buildObjectIdentityBindingPackage(root);
  const allEntries = [...bindingPackage.entries, ...bindingPackage.source_bindings];

  const object_reference_bank_binding =
    Object.keys(bindingPackage.object_reference_bank_binding).length > 0 &&
    allEntries.every((entry) => entry.object_reference_bank_binding.binding_id.length > 0);
  const object_anchor_binding =
    Object.keys(bindingPackage.object_anchor_binding).length > 0 &&
    allEntries.every((entry) => entry.object_anchor_binding.binding_id.length > 0);
  const object_memory_binding =
    Object.keys(bindingPackage.object_memory_binding).length > 0 &&
    allEntries.every((entry) => entry.object_memory_binding.binding_id.length > 0);
  const object_traceability_binding =
    Object.keys(bindingPackage.object_traceability_binding).length > 0 &&
    allEntries.every(
      (entry) => entry.object_traceability_binding.traceability_signature.length > 0
    );
  const object_retrieval_binding =
    Object.keys(bindingPackage.object_retrieval_binding).length > 0 &&
    allEntries.every((entry) => entry.object_retrieval_binding.binding_id.length > 0);
  const object_variation_tolerance_binding =
    Object.keys(bindingPackage.object_variation_tolerance_binding).length > 0 &&
    allEntries.every((entry) => entry.object_variation_tolerance_binding.binding_id.length > 0);
  const object_similarity_binding =
    Object.keys(bindingPackage.object_similarity_binding).length > 0 &&
    allEntries.every((entry) => entry.object_similarity_binding.binding_id.length > 0);
  const object_role_binding =
    Object.keys(bindingPackage.object_role_binding).length > 0 &&
    allEntries.every((entry) => entry.object_role_binding.binding_id.length > 0);

  const object_binding_defined =
    bindingPackage.object_binding_defined === true &&
    object_reference_bank_binding &&
    object_anchor_binding &&
    object_memory_binding &&
    object_traceability_binding &&
    object_retrieval_binding &&
    object_variation_tolerance_binding &&
    object_similarity_binding &&
    object_role_binding &&
    bindingPackage.entries.every(entryHasAllBindings);

  const suitcaseEntry = bindingPackage.entries.find((entry) => entry.object_id === 'suitcase_001');
  const chairEntry = bindingPackage.entries.find((entry) => entry.object_id === 'chair_014');

  if (!suitcaseEntry) {
    issues.push({
      code: 'SUITCASE_BINDING',
      message: 'suitcase_001 object binding entry required',
      severity: 'error',
    });
  } else if (
    suitcaseEntry.object_variation_tolerance_binding.identity_level !== 'strict' ||
    suitcaseEntry.object_variation_tolerance_binding.variation_tolerance !== 0.05
  ) {
    issues.push({
      code: 'SUITCASE_TOLERANCE',
      message: 'suitcase_001 must have strict identity_level and variation_tolerance=0.05',
      severity: 'error',
    });
  }

  if (!chairEntry) {
    issues.push({
      code: 'CHAIR_BINDING',
      message: 'chair_014 object binding entry required',
      severity: 'error',
    });
  } else if (
    chairEntry.object_variation_tolerance_binding.identity_level !== 'loose' ||
    chairEntry.object_variation_tolerance_binding.variation_tolerance !== 0.4
  ) {
    issues.push({
      code: 'CHAIR_TOLERANCE',
      message: 'chair_014 must have loose identity_level and variation_tolerance=0.40',
      severity: 'error',
    });
  }

  if (!object_binding_defined) {
    issues.push({
      code: 'OBJECT_BINDING',
      message: 'object_binding must be fully defined',
      severity: 'error',
    });
  }

  const validation_passed =
    object_binding_defined &&
    object_reference_bank_binding &&
    object_anchor_binding &&
    object_memory_binding &&
    object_traceability_binding &&
    object_retrieval_binding &&
    object_variation_tolerance_binding &&
    object_similarity_binding &&
    object_role_binding &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ObjectIdentityBindingReport = {
    report_id: `object_identity_binding_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_BINDING_PHASE,
    system_id: OBJECT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? OBJECT_IDENTITY_BINDING_PASS_VERDICT
      : OBJECT_IDENTITY_BINDING_FAIL_VERDICT,
    status: validation_passed
      ? OBJECT_IDENTITY_BINDING_STATUS
      : 'OBJECT_IDENTITY_BINDINGS_NOT_DEFINED',
    validation_passed,
    object_bindings_defined: validation_passed,
    object_binding_defined,
    object_reference_bank_binding,
    object_anchor_binding,
    object_memory_binding,
    object_traceability_binding,
    object_retrieval_binding,
    object_variation_tolerance_binding,
    object_similarity_binding,
    object_role_binding,
    object_identity_solved: false,
    runtime_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    implemented_bindings: [...BINDING_TYPES],
    traceability_coverage: bindingPackage.traceability_coverage,
    similarity_matching_strategy: { ...SIMILARITY_MATCHING_STRATEGY },
    variation_tolerance_strategy: { ...VARIATION_TOLERANCE_STRATEGY },
    role_binding_strategy: { ...ROLE_BINDING_STRATEGY },
    remaining_gaps: [
      'object_identity map not exported',
      'identity_embedding_ref is metadata placeholder only',
      'IP-Adapter object reference execution deferred',
      'object_identity preservation_score=0.55 unresolved',
      'Similar Object != Same Object',
      'Variation Tolerance evaluated separately from identity',
      'Object Role evaluated separately from similarity',
      'Binding Defined != Object Identity Solved',
    ],
    checks: {
      object_binding_defined,
      object_reference_bank_binding,
      object_anchor_binding,
      object_memory_binding,
      object_traceability_binding,
      object_retrieval_binding,
      object_variation_tolerance_binding,
      object_similarity_binding,
      object_role_binding,
      suitcase_binding_present: Boolean(suitcaseEntry),
      chair_binding_present: Boolean(chairEntry),
      object_identity_solved_false: true,
      runtime_implemented_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, OBJECT_IDENTITY_BINDING_PACKAGE_PATH, bindingPackage);
  writeJson(root, OBJECT_IDENTITY_BINDING_REPORT_PATH, report);
  writeJson(root, OBJECT_IDENTITY_GAP_REPORT_PATH, buildGapReport());

  return report;
}

export function writeObjectIdentityBindingReport(
  projectRoot?: string
): ObjectIdentityBindingReport {
  return runObjectIdentityBindingValidation(projectRoot);
}
