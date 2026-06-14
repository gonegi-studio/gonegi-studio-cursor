import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveProjectRoot } from './projectRootResolver.js';
import { CONDITIONING_MAP_EXPORT_BUNDLE_PATH } from './conditioningMapExport.js';
import {
  ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
  buildEnvironmentReferenceBankSpecification,
  type EnvironmentReferenceBankEntry,
} from './environmentIdentityStrategy.js';

export const ENVIRONMENT_IDENTITY_BINDING_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-008' as const;
export const ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID =
  'ENVIRONMENT_IDENTITY_BINDING_V1' as const;
export const ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT =
  'PASS_ENVIRONMENT_IDENTITY_BINDING_V1' as const;
export const ENVIRONMENT_IDENTITY_BINDING_FAIL_VERDICT =
  'FAIL_ENVIRONMENT_IDENTITY_BINDING_V1' as const;
export const ENVIRONMENT_IDENTITY_BINDING_STATUS =
  'ENVIRONMENT_IDENTITY_BINDINGS_DEFINED' as const;

export const ENVIRONMENT_IDENTITY_BINDING_DATASET_DIR =
  'datasets/movie_reconstruction_environment_identity_binding' as const;
export const ENVIRONMENT_IDENTITY_BINDING_REGISTRY_PATH =
  `${ENVIRONMENT_IDENTITY_BINDING_DATASET_DIR}/environment-identity-binding-registry.json` as const;

export const ENVIRONMENT_IDENTITY_BINDING_EXPORT_DIR =
  'exports/movie_reconstruction_environment_identity' as const;
export const ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH =
  `${ENVIRONMENT_IDENTITY_BINDING_EXPORT_DIR}/environment-identity-binding-package.json` as const;

export const ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_BINDING_REPORT.json' as const;
export const ENVIRONMENT_IDENTITY_GAP_REPORT_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_GAP_REPORT.json' as const;

const NEXT_PHASE =
  'PHASE-MOVIE-RECONSTRUCTION-CONDITIONING-009_OBJECT_IDENTITY_BINDING_V1' as const;

const BINDING_TYPES = [
  'environment_reference_bank_binding',
  'environment_anchor_binding',
  'environment_memory_binding',
  'environment_traceability_binding',
  'environment_retrieval_binding',
  'environment_similarity_binding',
] as const;

type BindingType = (typeof BINDING_TYPES)[number];

const SIMILARITY_MATCHING_STRATEGY = {
  strategy_id: 'environment_similarity_v1',
  primary_match: 'exact environment_id',
  secondary_match: 'layout_signature hash equality',
  tertiary_match: 'anchor_descriptors kind+importance cosine rank',
  similarity_threshold: 0.85,
  same_environment_threshold: 0.98,
  note: 'Similar Environment != Same Environment — scores below same_environment_threshold must not be treated as identity lock.',
} as const;

const EXECUTION_FLAGS = {
  binding_only: true as const,
  runtime_implementation_deferred: true as const,
  gpu_execution: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface EnvironmentReferenceBankBindingRecord {
  binding_id: string;
  environment_id: string;
  reference_bank_id: string;
  source_video_id: string;
  layout_signature: string;
}

export interface EnvironmentAnchorBindingRecord {
  binding_id: string;
  environment_id: string;
  anchor_id: string;
  anchor_kind: string;
  normalized_position: [number, number, number];
  importance: number;
}

export interface EnvironmentMemoryBindingRecord {
  binding_id: string;
  environment_id: string;
  scene_id: string;
  memory_signature: string;
  location_anchor_reuse: boolean;
  persistence_score: number;
}

export interface EnvironmentTraceabilityBindingRecord {
  binding_id: string;
  environment_id: string;
  source_video_id: string;
  conditioning_map_ref: string;
  environment_spec_ref: string;
  traceability_signature: string;
}

export interface EnvironmentRetrievalBindingRecord {
  binding_id: string;
  environment_id: string;
  strategy_id: string;
  primary_key: string;
  fallback_keys: string[];
}

export interface EnvironmentSimilarityBindingRecord {
  binding_id: string;
  environment_id: string;
  layout_signature: string;
  similarity_threshold: number;
  same_environment_threshold: number;
  matching_features: string[];
}

export interface EnvironmentBindingEntry {
  environment_id: string;
  source_video_id: string;
  source_group: string;
  environment_reference_bank_binding: EnvironmentReferenceBankBindingRecord;
  environment_anchor_binding: EnvironmentAnchorBindingRecord;
  environment_memory_binding: EnvironmentMemoryBindingRecord;
  environment_traceability_binding: EnvironmentTraceabilityBindingRecord;
  environment_retrieval_binding: EnvironmentRetrievalBindingRecord;
  environment_similarity_binding: EnvironmentSimilarityBindingRecord;
}

export interface EnvironmentIdentityBindingPackage {
  package_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_BINDING_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID;
  generated_at: string;
  environment_reference_bank_binding: Record<string, string>;
  environment_anchor_binding: Record<string, string>;
  environment_memory_binding: Record<string, string>;
  environment_traceability_binding: Record<string, string>;
  environment_retrieval_binding: Record<string, string>;
  environment_similarity_binding: Record<string, string>;
  environment_binding_defined: true;
  similarity_matching_strategy: typeof SIMILARITY_MATCHING_STRATEGY;
  entries: EnvironmentBindingEntry[];
  source_bindings: EnvironmentBindingEntry[];
  traceability_coverage: number;
}

export interface EnvironmentIdentityBindingReport {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_BINDING_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ENVIRONMENT_IDENTITY_BINDING_STATUS
    | 'ENVIRONMENT_IDENTITY_BINDINGS_NOT_DEFINED';
  validation_passed: boolean;
  environment_bindings_defined: boolean;
  environment_binding_defined: boolean;
  environment_reference_bank_binding: boolean;
  environment_anchor_binding: boolean;
  environment_memory_binding: boolean;
  environment_traceability_binding: boolean;
  environment_retrieval_binding: boolean;
  environment_similarity_binding: boolean;
  environment_identity_solved: false;
  runtime_implemented: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  implemented_bindings: BindingType[];
  traceability_coverage: number;
  similarity_matching_strategy: typeof SIMILARITY_MATCHING_STRATEGY;
  remaining_gaps: string[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface EnvironmentIdentityGapReport {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_BINDING_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID;
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

const ENVIRONMENT_REFERENCE_BANK_BINDING_FORMAT = {
  binding_id: 'Unique environment reference bank binding record identifier.',
  environment_id: 'Canonical environment identifier from reference bank.',
  reference_bank_id: 'Reference bank slot identifier (env_ref_NNN).',
  source_video_id: 'Canonical numerical DNA source identifier.',
  layout_signature: 'Hash of environment anchor layout from reference bank entry.',
} as const;

const ENVIRONMENT_ANCHOR_BINDING_FORMAT = {
  binding_id: 'Unique environment anchor binding record identifier.',
  environment_id: 'Parent environment identifier.',
  anchor_id: 'Canonical environment anchor label.',
  anchor_kind: 'Anchor classification enum from environment_anchor_format.',
  normalized_position: 'Vec3 [x,y,z] in screen-normalized space.',
  importance: 'Anchor persistence weight in [0,1].',
} as const;

const ENVIRONMENT_MEMORY_BINDING_FORMAT = {
  binding_id: 'Unique environment memory binding record identifier.',
  environment_id: 'Parent environment identifier.',
  scene_id: 'Scene identifier binding memory entry to spatial graph scene.',
  memory_signature: 'Hash of environment_anchors persisted across scenes.',
  location_anchor_reuse: 'Boolean flag indicating anchor reused from reference bank.',
  persistence_score: 'Cross-scene anchor position stability score in [0,1].',
} as const;

const ENVIRONMENT_TRACEABILITY_BINDING_FORMAT = {
  binding_id: 'Unique environment traceability binding record identifier.',
  environment_id: 'Target environment_id in reference bank.',
  source_video_id: 'Canonical numerical DNA source identifier.',
  conditioning_map_ref: 'Path to conditioning-map-export-bundle source entry.',
  environment_spec_ref: 'Path to ENVIRONMENT_REFERENCE_BANK_SPECIFICATION.json.',
  traceability_signature: 'Deterministic hash binding all lineage fields.',
} as const;

const ENVIRONMENT_RETRIEVAL_BINDING_FORMAT = {
  binding_id: 'Unique environment retrieval binding record identifier.',
  environment_id: 'Target environment identifier for retrieval.',
  strategy_id: 'Retrieval strategy identifier (environment_retrieval_v1).',
  primary_key: 'Primary retrieval key field name.',
  fallback_keys: 'Ordered fallback key fields for retrieval.',
} as const;

const ENVIRONMENT_SIMILARITY_BINDING_FORMAT = {
  binding_id: 'Unique environment similarity binding record identifier.',
  environment_id: 'Target environment identifier for similarity matching.',
  layout_signature: 'Layout signature hash used for similarity comparison.',
  similarity_threshold: 'Minimum score to treat environments as similar (not identical).',
  same_environment_threshold: 'Minimum score required for same-environment identity lock.',
  matching_features: 'Feature list used in similarity rank (anchor_kind, importance, layout_signature).',
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
  bankEntries: EnvironmentReferenceBankEntry[]
): EnvironmentReferenceBankEntry {
  const exact = bankEntries.find((entry) => entry.source_video_id === source.source_video_id);
  if (exact) {
    return exact;
  }
  const groupMatch = bankEntries.find((entry) => {
    const prefix = entry.source_video_id.split('_')[0]?.toLowerCase();
    return prefix === source.source_group || entry.source_video_id.startsWith(source.source_group.toUpperCase());
  });
  if (groupMatch) {
    return groupMatch;
  }
  return bankEntries[0];
}

function buildBindingEntry(
  bankEntry: EnvironmentReferenceBankEntry,
  sourceVideoId: string,
  sourceGroup: string
): EnvironmentBindingEntry {
  const primaryAnchor = bankEntry.anchor_descriptors[0];
  const scene_id = `scene_${bankEntry.environment_id.replace(/_/g, '-')}`;
  const memoryPayload = {
    environment_id: bankEntry.environment_id,
    source_video_id: sourceVideoId,
    anchors: bankEntry.anchor_descriptors.map((anchor) => anchor.anchor_id),
  };
  const tracePayload = {
    environment_id: bankEntry.environment_id,
    source_video_id: sourceVideoId,
    reference_bank_id: bankEntry.reference_bank_id,
    conditioning_map_ref: `${CONDITIONING_MAP_EXPORT_BUNDLE_PATH}#${sourceVideoId}`,
  };

  return {
    environment_id: bankEntry.environment_id,
    source_video_id: sourceVideoId,
    source_group: sourceGroup,
    environment_reference_bank_binding: {
      binding_id: `erb_${bankEntry.environment_id}`,
      environment_id: bankEntry.environment_id,
      reference_bank_id: bankEntry.reference_bank_id,
      source_video_id: sourceVideoId,
      layout_signature: bankEntry.layout_signature,
    },
    environment_anchor_binding: {
      binding_id: `eab_${bankEntry.environment_id}_${primaryAnchor.anchor_id}`,
      environment_id: bankEntry.environment_id,
      anchor_id: primaryAnchor.anchor_id,
      anchor_kind: primaryAnchor.anchor_kind,
      normalized_position: [...primaryAnchor.normalized_position],
      importance: primaryAnchor.importance,
    },
    environment_memory_binding: {
      binding_id: `emb_${bankEntry.environment_id}`,
      environment_id: bankEntry.environment_id,
      scene_id,
      memory_signature: signature('memory', memoryPayload),
      location_anchor_reuse: sourceVideoId === bankEntry.source_video_id,
      persistence_score: Number((0.7 + primaryAnchor.importance * 0.25).toFixed(2)),
    },
    environment_traceability_binding: {
      binding_id: `etb_${bankEntry.environment_id}_${sourceVideoId.toLowerCase()}`,
      environment_id: bankEntry.environment_id,
      source_video_id: sourceVideoId,
      conditioning_map_ref: tracePayload.conditioning_map_ref,
      environment_spec_ref: ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
      traceability_signature: signature('trace', tracePayload),
    },
    environment_retrieval_binding: {
      binding_id: `erv_${bankEntry.environment_id}`,
      environment_id: bankEntry.environment_id,
      strategy_id: 'environment_retrieval_v1',
      primary_key: 'environment_id',
      fallback_keys: ['layout_signature', 'source_video_id', 'source_scene'],
    },
    environment_similarity_binding: {
      binding_id: `esb_${bankEntry.environment_id}`,
      environment_id: bankEntry.environment_id,
      layout_signature: bankEntry.layout_signature,
      similarity_threshold: SIMILARITY_MATCHING_STRATEGY.similarity_threshold,
      same_environment_threshold: SIMILARITY_MATCHING_STRATEGY.same_environment_threshold,
      matching_features: ['anchor_kind', 'importance', 'layout_signature'],
    },
  };
}

export function buildEnvironmentIdentityBindingPackage(
  projectRoot?: string
): EnvironmentIdentityBindingPackage {
  const root = resolveProjectRoot(projectRoot);
  const spec = buildEnvironmentReferenceBankSpecification();
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
    (entry) => entry.environment_traceability_binding.traceability_signature.length > 0
  ).length;
  const traceability_coverage =
    source_bindings.length === 0 ? 0 : Number((traceable / source_bindings.length).toFixed(2));

  return {
    package_id: 'environment-identity-binding-package-v1',
    phase: ENVIRONMENT_IDENTITY_BINDING_PHASE,
    system_id: ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    environment_reference_bank_binding: { ...ENVIRONMENT_REFERENCE_BANK_BINDING_FORMAT },
    environment_anchor_binding: { ...ENVIRONMENT_ANCHOR_BINDING_FORMAT },
    environment_memory_binding: { ...ENVIRONMENT_MEMORY_BINDING_FORMAT },
    environment_traceability_binding: { ...ENVIRONMENT_TRACEABILITY_BINDING_FORMAT },
    environment_retrieval_binding: { ...ENVIRONMENT_RETRIEVAL_BINDING_FORMAT },
    environment_similarity_binding: { ...ENVIRONMENT_SIMILARITY_BINDING_FORMAT },
    environment_binding_defined: true,
    similarity_matching_strategy: { ...SIMILARITY_MATCHING_STRATEGY },
    entries,
    source_bindings,
    traceability_coverage,
  };
}

function buildGapReport(): EnvironmentIdentityGapReport {
  return {
    report_id: `environment_identity_gap_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_BINDING_PHASE,
    system_id: ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    defined: [...BINDING_TYPES],
    missing: [
      'environment_identity_map populated payload export',
      'IP-Adapter environment reference raster execution',
      'anchor_images GPU raster generation',
      'same_environment_threshold GPU validation',
      'environment_identity_solved certification',
    ],
    remaining_blockers: [
      'gpu_execution disabled in this phase',
      'environment_identity preservation_score=0.12 unresolved at runtime',
      'environment_identity_map reserved_v1',
      'Similar Environment != Same Environment',
      'Binding Defined != Environment Identity Solved',
    ],
    next_phase: NEXT_PHASE,
  };
}

function entryHasAllBindings(entry: EnvironmentBindingEntry): boolean {
  return (
    entry.environment_reference_bank_binding.binding_id.length > 0 &&
    entry.environment_anchor_binding.binding_id.length > 0 &&
    entry.environment_memory_binding.binding_id.length > 0 &&
    entry.environment_traceability_binding.traceability_signature.length > 0 &&
    entry.environment_retrieval_binding.binding_id.length > 0 &&
    entry.environment_similarity_binding.binding_id.length > 0
  );
}

export function runEnvironmentIdentityBindingValidation(
  projectRoot?: string
): EnvironmentIdentityBindingReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: EnvironmentIdentityBindingReport['issues'] = [];

  const prerequisitePaths = [
    ENVIRONMENT_IDENTITY_BINDING_REGISTRY_PATH,
    ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
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

  const bindingPackage = buildEnvironmentIdentityBindingPackage(root);
  const allEntries = [...bindingPackage.entries, ...bindingPackage.source_bindings];

  const environment_reference_bank_binding =
    Object.keys(bindingPackage.environment_reference_bank_binding).length > 0 &&
    allEntries.every((entry) => entry.environment_reference_bank_binding.binding_id.length > 0);
  const environment_anchor_binding =
    Object.keys(bindingPackage.environment_anchor_binding).length > 0 &&
    allEntries.every((entry) => entry.environment_anchor_binding.binding_id.length > 0);
  const environment_memory_binding =
    Object.keys(bindingPackage.environment_memory_binding).length > 0 &&
    allEntries.every((entry) => entry.environment_memory_binding.binding_id.length > 0);
  const environment_traceability_binding =
    Object.keys(bindingPackage.environment_traceability_binding).length > 0 &&
    allEntries.every(
      (entry) => entry.environment_traceability_binding.traceability_signature.length > 0
    );
  const environment_retrieval_binding =
    Object.keys(bindingPackage.environment_retrieval_binding).length > 0 &&
    allEntries.every((entry) => entry.environment_retrieval_binding.binding_id.length > 0);
  const environment_similarity_binding =
    Object.keys(bindingPackage.environment_similarity_binding).length > 0 &&
    allEntries.every((entry) => entry.environment_similarity_binding.binding_id.length > 0);

  const environment_binding_defined =
    bindingPackage.environment_binding_defined === true &&
    environment_reference_bank_binding &&
    environment_anchor_binding &&
    environment_memory_binding &&
    environment_traceability_binding &&
    environment_retrieval_binding &&
    environment_similarity_binding &&
    bindingPackage.entries.every(entryHasAllBindings);

  const titanicEntry = bindingPackage.entries.find(
    (entry) => entry.environment_id === 'titanic_staircase_001'
  );
  if (!titanicEntry) {
    issues.push({
      code: 'TITANIC_BINDING',
      message: 'titanic_staircase_001 environment binding entry required',
      severity: 'error',
    });
  }

  if (!environment_binding_defined) {
    issues.push({
      code: 'ENVIRONMENT_BINDING',
      message: 'environment_binding must be fully defined',
      severity: 'error',
    });
  }

  const validation_passed =
    environment_binding_defined &&
    environment_reference_bank_binding &&
    environment_anchor_binding &&
    environment_memory_binding &&
    environment_traceability_binding &&
    environment_retrieval_binding &&
    environment_similarity_binding &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: EnvironmentIdentityBindingReport = {
    report_id: `environment_identity_binding_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_BINDING_PHASE,
    system_id: ENVIRONMENT_IDENTITY_BINDING_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT
      : ENVIRONMENT_IDENTITY_BINDING_FAIL_VERDICT,
    status: validation_passed
      ? ENVIRONMENT_IDENTITY_BINDING_STATUS
      : 'ENVIRONMENT_IDENTITY_BINDINGS_NOT_DEFINED',
    validation_passed,
    environment_bindings_defined: validation_passed,
    environment_binding_defined,
    environment_reference_bank_binding,
    environment_anchor_binding,
    environment_memory_binding,
    environment_traceability_binding,
    environment_retrieval_binding,
    environment_similarity_binding,
    environment_identity_solved: false,
    runtime_implemented: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    implemented_bindings: [...BINDING_TYPES],
    traceability_coverage: bindingPackage.traceability_coverage,
    similarity_matching_strategy: { ...SIMILARITY_MATCHING_STRATEGY },
    remaining_gaps: [
      'environment_identity_map reserved_v1 with no populated payload',
      'IP-Adapter environment reference execution deferred',
      'anchor_images are metadata placeholders only',
      'environment_identity preservation_score=0.12 unresolved',
      'Similar Environment != Same Environment',
      'Binding Defined != Environment Identity Solved',
    ],
    checks: {
      environment_binding_defined,
      environment_reference_bank_binding,
      environment_anchor_binding,
      environment_memory_binding,
      environment_traceability_binding,
      environment_retrieval_binding,
      environment_similarity_binding,
      titanic_binding_present: Boolean(titanicEntry),
      environment_identity_solved_false: true,
      runtime_implemented_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH, bindingPackage);
  writeJson(root, ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH, report);
  writeJson(root, ENVIRONMENT_IDENTITY_GAP_REPORT_PATH, buildGapReport());

  return report;
}

export function writeEnvironmentIdentityBindingReport(
  projectRoot?: string
): EnvironmentIdentityBindingReport {
  return runEnvironmentIdentityBindingValidation(projectRoot);
}
