import fs from 'node:fs';
import path from 'node:path';
import {
  MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
  MEDIUM_FILM_LIBRARY_PATH,
} from './mediumFilmProductionFoundation.js';
import {
  MEDIUM_FILM_PRODUCTION_READINESS_PATH,
  MEDIUM_FILM_PRODUCTION_READY_STATUS,
  MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from './mediumFilmProductionValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FEATURE_FILM_FOUNDATION_PHASE = 'PHASE-L3-FEATURE-001' as const;
export const FEATURE_FILM_FOUNDATION_PASS_VERDICT = 'PASS_FEATURE_FILM_FOUNDATION_V1' as const;
export const FEATURE_FILM_FOUNDATION_FAIL_VERDICT = 'FAIL_FEATURE_FILM_FOUNDATION_V1' as const;
export const FEATURE_FILM_FOUNDATION_READY_STATUS = 'FEATURE_FILM_FOUNDATION_READY' as const;

export const FEATURE_FILM_LIBRARY_PATH =
  'datasets/feature_film/feature-film-archetype-library.json' as const;
export const FEATURE_FILM_INDEX_PATH =
  'datasets/feature_film/feature-film-archetype-index.json' as const;
export const FEATURE_SCALE_RULES_DATASET_PATH =
  'datasets/feature_film/feature-scale-rules.json' as const;
export const FEATURE_CONTINUITY_SPEC_DATASET_PATH =
  'datasets/feature_film/feature-continuity-specification-v1.json' as const;
export const FEATURE_DEPENDENCY_SPEC_DATASET_PATH =
  'datasets/feature_film/feature-dependency-specification-v1.json' as const;

export const FEATURE_FILM_FOUNDATION_EXPORT_DIR = 'exports/feature_film_foundation' as const;
export const FEATURE_FILM_FOUNDATION_PATH =
  'exports/feature_film_foundation/feature-film-foundation.json' as const;
export const FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH =
  'exports/feature_film_foundation/feature-film-continuity-specification.json' as const;
export const FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH =
  'exports/feature_film_foundation/feature-film-dependency-specification.json' as const;
export const FEATURE_FILM_SCALE_RULES_EXPORT_PATH =
  'exports/feature_film_foundation/feature-scale-rules.json' as const;

export const FEATURE_FILM_FOUNDATION_DIR = 'reports/feature_film_foundation' as const;
export const FEATURE_FILM_FOUNDATION_REPORT_PATH =
  'reports/feature_film_foundation/FEATURE_FILM_FOUNDATION_REPORT.json' as const;

const SCENE_COUNT_MIN = 1000;
const SCENE_COUNT_MAX = 3000;

const INHERITED_ARC_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
  'relationship_arc',
  'timeline_arc',
  'memory_callback_arc',
  'subplot_arc',
  'parallel_arc',
  'multi_callback_arc',
  'relationship_network',
  'world_arc',
] as const;

const FEATURE_ARC_DIMENSIONS = ['world_state_arc', 'theme_arc', 'legacy_callback_arc'] as const;

const REQUIRED_FEATURE_FIELDS = [...INHERITED_ARC_DIMENSIONS, ...FEATURE_ARC_DIMENSIONS] as const;

type IssueSeverity = 'error' | 'warning';

interface FoundationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface FeatureArchetypeRecord {
  feature_film_archetype_id: string;
  theme: string;
  scene_count_range: string;
  medium_film_source_ref: string;
  story_arcs: unknown[];
  parallel_narrative_flows: unknown[];
  character_groups: unknown[];
  character_arc: Record<string, unknown>;
  location_arc: Record<string, unknown>;
  lighting_arc: Record<string, unknown>;
  relationship_arc: Record<string, unknown>;
  timeline_arc: Record<string, unknown> & { long_range_dependencies?: unknown[] };
  memory_callback_arc: unknown[];
  subplot_arc: { subplots: unknown[] };
  parallel_arc: { parallel_tracks: unknown[] };
  multi_callback_arc: { callback_layers: unknown[] };
  relationship_network: {
    nodes: string[];
    edges: unknown[];
    evolution_stages: string[];
  };
  world_arc: Record<string, unknown>;
  world_state_arc: Record<string, unknown>;
  theme_arc: Record<string, unknown>;
  legacy_callback_arc: { legacy_anchors: unknown[]; callback_depth: number };
  continuity_requirements: Record<string, string[]>;
}

export interface FeatureFilmFoundationReport {
  report_id: string;
  phase: typeof FEATURE_FILM_FOUNDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  foundation_status: string;
  precheck: {
    medium_film_production_ready: boolean;
    pass_medium_film_production_validation_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_ds_audit_phases: boolean;
    no_rehardening_phases: boolean;
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  roadmap: {
    mv: string;
    short_film: string;
    medium_film: string;
    feature_film: string;
  };
  expansion_design: {
    medium_film_scene_range: string;
    feature_film_scene_range: string;
    scene_range: string;
    shot_range: string;
    act_range: string;
    callback_depth: string;
    continuity_depth: number;
    inherited_arc_dimensions: string[];
    feature_arc_dimensions: string[];
  };
  foundation_validation: {
    continuity_spec_exists: boolean;
    dependency_spec_exists: boolean;
    feature_scale_rules_exists: boolean;
    foundation_integrity: string;
    foundation_traceability: string;
    world_state_arc_ready: boolean;
    theme_arc_ready: boolean;
    legacy_callback_arc_ready: boolean;
    feature_film_extension_ready: boolean;
  };
  feature_film_outputs: {
    library_path: string;
    index_path: string;
    continuity_spec_path: string;
    dependency_spec_path: string;
    scale_rules_path: string;
    foundation_path: string;
    archetype_count: number;
  };
  issues: FoundationIssue[];
  feature_film_foundation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function parseSceneRange(range: string): { min: number; max: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function runPrecheck(root: string): {
  medium_film_production_ready: boolean;
  pass_medium_film_production_validation_v1: boolean;
  precheck_passed: boolean;
  issues: FoundationIssue[];
} {
  const issues: FoundationIssue[] = [];
  const reportPath = path.join(root, MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH);
  const readinessPath = path.join(root, MEDIUM_FILM_PRODUCTION_READINESS_PATH);

  if (!fs.existsSync(reportPath) || !fs.existsSync(readinessPath)) {
    issues.push({
      code: 'MEDIUM_FILM_VALIDATION_MISSING',
      message: 'Medium Film production validation artifacts missing',
      severity: 'error',
    });
    return {
      medium_film_production_ready: false,
      pass_medium_film_production_validation_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const validationReport = readJson<Record<string, unknown>>(root, MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH);
  const readiness = readJson<Record<string, unknown>>(root, MEDIUM_FILM_PRODUCTION_READINESS_PATH);

  const validationStatus = String(validationReport.status ?? '');
  const validationVerdict = String(validationReport.final_verdict ?? '');
  const readinessStatus = String(readiness.production_readiness_status ?? '');

  const medium_film_production_ready =
    validationStatus === MEDIUM_FILM_PRODUCTION_READY_STATUS &&
    readinessStatus === MEDIUM_FILM_PRODUCTION_READY_STATUS;
  const pass_medium_film_production_validation_v1 =
    validationVerdict === MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT;

  if (!medium_film_production_ready) {
    issues.push({
      code: 'MEDIUM_FILM_NOT_PRODUCTION_READY',
      message: `Expected ${MEDIUM_FILM_PRODUCTION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_medium_film_production_validation_v1) {
    issues.push({
      code: 'MEDIUM_FILM_VALIDATION_FAIL',
      message: `Expected ${MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    medium_film_production_ready,
    pass_medium_film_production_validation_v1,
    precheck_passed: medium_film_production_ready && pass_medium_film_production_validation_v1,
    issues,
  };
}

function validateFeatureFilmDatasets(root: string): FoundationIssue[] {
  const issues: FoundationIssue[] = [];

  for (const datasetPath of [
    FEATURE_FILM_LIBRARY_PATH,
    FEATURE_FILM_INDEX_PATH,
    FEATURE_SCALE_RULES_DATASET_PATH,
    FEATURE_CONTINUITY_SPEC_DATASET_PATH,
    FEATURE_DEPENDENCY_SPEC_DATASET_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, datasetPath))) {
      issues.push({
        code: 'FEATURE_FILM_DATASET_MISSING',
        message: `Missing ${datasetPath}`,
        severity: 'error',
      });
    }
  }

  if (issues.length > 0) return issues;

  const library = readJson<{
    archetype_count: number;
    archetypes: FeatureArchetypeRecord[];
    scope: { min_scene_count: number; max_scene_count: number };
  }>(root, FEATURE_FILM_LIBRARY_PATH);
  const index = readJson<{ archetype_count: number; entries: unknown[] }>(root, FEATURE_FILM_INDEX_PATH);
  const scaleRules = readJson<{
    scene_range: string;
    shot_range: string;
    act_range: string;
    callback_depth: string;
    continuity_depth: number;
  }>(root, FEATURE_SCALE_RULES_DATASET_PATH);

  if (library.scope.min_scene_count < SCENE_COUNT_MIN) {
    issues.push({
      code: 'MIN_SCENE_COUNT_INVALID',
      message: `Expected min_scene_count>=${SCENE_COUNT_MIN}`,
      severity: 'error',
    });
  }

  const mediumLibrary = fs.existsSync(path.join(root, MEDIUM_FILM_LIBRARY_PATH))
    ? readJson<{ archetypes: { medium_film_archetype_id: string }[] }>(root, MEDIUM_FILM_LIBRARY_PATH)
    : { archetypes: [] };
  const mediumIds = new Set(mediumLibrary.archetypes.map((a) => a.medium_film_archetype_id));

  for (const archetype of library.archetypes) {
    const id = archetype.feature_film_archetype_id;
    const parsed = parseSceneRange(archetype.scene_count_range);
    if (!parsed || parsed.min < SCENE_COUNT_MIN || parsed.max > SCENE_COUNT_MAX) {
      issues.push({
        code: 'ARCHETYPE_SCENE_RANGE_INVALID',
        message: `${id}: scene_count_range must be within ${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        severity: 'error',
      });
    }

    if (!mediumIds.has(archetype.medium_film_source_ref)) {
      issues.push({
        code: 'MEDIUM_SOURCE_REF_INVALID',
        message: `${id}: medium_film_source_ref ${archetype.medium_film_source_ref} not found`,
        severity: 'error',
      });
    }

    for (const field of REQUIRED_FEATURE_FIELDS) {
      if (!(field in archetype)) {
        issues.push({
          code: 'MISSING_FEATURE_FIELD',
          message: `${id}: missing ${field}`,
          severity: 'error',
        });
      }
    }

    if ((archetype.story_arcs?.length ?? 0) < 3) {
      issues.push({
        code: 'INSUFFICIENT_STORY_ARCS',
        message: `${id}: requires at least 3 story arcs`,
        severity: 'error',
      });
    }
    if ((archetype.parallel_narrative_flows?.length ?? 0) < 3) {
      issues.push({
        code: 'INSUFFICIENT_PARALLEL_FLOWS',
        message: `${id}: requires at least 3 parallel narrative flows`,
        severity: 'error',
      });
    }
    if ((archetype.parallel_arc?.parallel_tracks?.length ?? 0) < 3) {
      issues.push({
        code: 'PARALLEL_ARC_NOT_READY',
        message: `${id}: parallel_arc.parallel_tracks minimum 3`,
        severity: 'error',
      });
    }
    if ((archetype.multi_callback_arc?.callback_layers?.length ?? 0) < 3) {
      issues.push({
        code: 'MULTI_CALLBACK_NOT_READY',
        message: `${id}: multi_callback_arc.callback_layers minimum 3`,
        severity: 'error',
      });
    }
    if ((archetype.legacy_callback_arc?.legacy_anchors?.length ?? 0) < 2) {
      issues.push({
        code: 'LEGACY_CALLBACK_NOT_READY',
        message: `${id}: legacy_callback_arc.legacy_anchors minimum 2`,
        severity: 'error',
      });
    }
    if ((archetype.legacy_callback_arc?.callback_depth ?? 0) < 3) {
      issues.push({
        code: 'CALLBACK_DEPTH_INVALID',
        message: `${id}: legacy_callback_arc.callback_depth minimum 3`,
        severity: 'error',
      });
    }
    if (!archetype.world_state_arc?.stages) {
      issues.push({
        code: 'WORLD_STATE_ARC_NOT_READY',
        message: `${id}: world_state_arc.stages required`,
        severity: 'error',
      });
    }
    if (!archetype.theme_arc?.primary_theme) {
      issues.push({
        code: 'THEME_ARC_NOT_READY',
        message: `${id}: theme_arc.primary_theme required`,
        severity: 'error',
      });
    }
    if ((archetype.timeline_arc?.long_range_dependencies?.length ?? 0) < 2) {
      issues.push({
        code: 'LONG_RANGE_TIMELINE_MISSING',
        message: `${id}: long-range timeline dependencies required`,
        severity: 'error',
      });
    }
  }

  if (library.archetype_count !== library.archetypes.length || library.archetypes.length === 0) {
    issues.push({
      code: 'LIBRARY_COUNT_INVALID',
      message: 'archetype_count must match archetypes length and be > 0',
      severity: 'error',
    });
  }
  if (index.archetype_count !== index.entries.length) {
    issues.push({
      code: 'INDEX_COUNT_MISMATCH',
      message: 'archetype_count mismatch in index',
      severity: 'error',
    });
  }

  for (const field of ['scene_range', 'shot_range', 'act_range', 'callback_depth', 'continuity_depth'] as const) {
    if (scaleRules[field] === undefined) {
      issues.push({
        code: 'SCALE_RULES_FIELD_MISSING',
        message: `feature-scale-rules.json missing ${field}`,
        severity: 'error',
      });
    }
  }

  if (scaleRules.continuity_depth < 14) {
    issues.push({
      code: 'CONTINUITY_DEPTH_INVALID',
      message: 'continuity_depth must be >= 14',
      severity: 'error',
    });
  }

  return issues;
}

function buildContinuitySpecExport(root: string): Record<string, unknown> {
  const datasetSpec = readJson<Record<string, unknown>>(root, FEATURE_CONTINUITY_SPEC_DATASET_PATH);
  return {
    ...datasetSpec,
    export_id: 'feature-film-continuity-specification-export-v1',
    phase: FEATURE_FILM_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
    medium_film_spec_ref: MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
    continuity_depth: 14,
    total_dimensions: [...INHERITED_ARC_DIMENSIONS, ...FEATURE_ARC_DIMENSIONS],
  };
}

function buildDependencySpecExport(root: string): Record<string, unknown> {
  const datasetSpec = readJson<Record<string, unknown>>(root, FEATURE_DEPENDENCY_SPEC_DATASET_PATH);
  return {
    ...datasetSpec,
    export_id: 'feature-film-dependency-specification-export-v1',
    phase: FEATURE_FILM_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
  };
}

function buildFoundationManifest(
  library: { archetype_count: number; archetypes: FeatureArchetypeRecord[] },
  scaleRules: Record<string, unknown>
): Record<string, unknown> {
  return {
    foundation_id: 'feature-film-foundation-v1',
    phase: FEATURE_FILM_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
    foundation_status: FEATURE_FILM_FOUNDATION_READY_STATUS,
    medium_film_expansion_baseline: 'MEDIUM_FILM_PRODUCTION_READY',
    archetype_count: library.archetype_count,
    archetypes: library.archetypes.map((a) => ({
      feature_film_archetype_id: a.feature_film_archetype_id,
      medium_film_source_ref: a.medium_film_source_ref,
      scene_count_range: a.scene_count_range,
      theme: a.theme,
    })),
    scale_rules: {
      scene_range: scaleRules.scene_range,
      shot_range: scaleRules.shot_range,
      act_range: scaleRules.act_range,
      callback_depth: scaleRules.callback_depth,
      continuity_depth: scaleRules.continuity_depth,
    },
    continuity_dimensions: [...INHERITED_ARC_DIMENSIONS, ...FEATURE_ARC_DIMENSIONS],
    dependency_dimensions: 11,
    traceability: {
      medium_film_library: MEDIUM_FILM_LIBRARY_PATH,
      medium_film_production_readiness: MEDIUM_FILM_PRODUCTION_READINESS_PATH,
      medium_film_continuity_spec: MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
      feature_library: FEATURE_FILM_LIBRARY_PATH,
      feature_index: FEATURE_FILM_INDEX_PATH,
    },
  };
}

function evaluateFoundationValidation(
  archetypes: FeatureArchetypeRecord[],
  datasetIssues: FoundationIssue[],
  root: string
): FeatureFilmFoundationReport['foundation_validation'] {
  const errors = datasetIssues.filter((issue) => issue.severity === 'error');
  const specsExist =
    fs.existsSync(path.join(root, FEATURE_CONTINUITY_SPEC_DATASET_PATH)) &&
    fs.existsSync(path.join(root, FEATURE_DEPENDENCY_SPEC_DATASET_PATH)) &&
    fs.existsSync(path.join(root, FEATURE_SCALE_RULES_DATASET_PATH));

  const worldStateReady = archetypes.every((a) => Boolean(a.world_state_arc?.stages));
  const themeReady = archetypes.every((a) => Boolean(a.theme_arc?.primary_theme));
  const legacyReady = archetypes.every(
    (a) => (a.legacy_callback_arc?.legacy_anchors?.length ?? 0) >= 2
  );
  const traceabilityReady = archetypes.every((a) => Boolean(a.medium_film_source_ref));
  const integrityReady = errors.length === 0 && archetypes.length > 0;

  return {
    continuity_spec_exists: fs.existsSync(path.join(root, FEATURE_CONTINUITY_SPEC_DATASET_PATH)),
    dependency_spec_exists: fs.existsSync(path.join(root, FEATURE_DEPENDENCY_SPEC_DATASET_PATH)),
    feature_scale_rules_exists: fs.existsSync(path.join(root, FEATURE_SCALE_RULES_DATASET_PATH)),
    foundation_integrity: integrityReady && specsExist ? 'PASS' : 'FAIL',
    foundation_traceability: traceabilityReady && integrityReady ? 'PASS' : 'FAIL',
    world_state_arc_ready: worldStateReady,
    theme_arc_ready: themeReady,
    legacy_callback_arc_ready: legacyReady,
    feature_film_extension_ready: integrityReady && worldStateReady && themeReady && legacyReady,
  };
}

export function writeFeatureFilmFoundation(projectRoot?: string): FeatureFilmFoundationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: FoundationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  issues.push(...validateFeatureFilmDatasets(root));

  const library = fs.existsSync(path.join(root, FEATURE_FILM_LIBRARY_PATH))
    ? readJson<{ archetype_count: number; archetypes: FeatureArchetypeRecord[] }>(
        root,
        FEATURE_FILM_LIBRARY_PATH
      )
    : { archetype_count: 0, archetypes: [] };

  const scaleRules = fs.existsSync(path.join(root, FEATURE_SCALE_RULES_DATASET_PATH))
    ? readJson<Record<string, unknown>>(root, FEATURE_SCALE_RULES_DATASET_PATH)
    : {};

  const foundationValidation = evaluateFoundationValidation(library.archetypes, issues, root);
  const continuitySpecExport = buildContinuitySpecExport(root);
  const dependencySpecExport = buildDependencySpecExport(root);
  const foundationManifest = buildFoundationManifest(library, scaleRules);

  const validationFlagsReady =
    foundationValidation.foundation_integrity === 'PASS' &&
    foundationValidation.foundation_traceability === 'PASS' &&
    foundationValidation.continuity_spec_exists &&
    foundationValidation.dependency_spec_exists &&
    foundationValidation.feature_scale_rules_exists &&
    foundationValidation.feature_film_extension_ready;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const foundationReady = precheck.precheck_passed && errors.length === 0 && validationFlagsReady;

  const report: FeatureFilmFoundationReport = {
    report_id: 'feature-film-foundation-report-v1',
    phase: FEATURE_FILM_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: foundationReady
      ? FEATURE_FILM_FOUNDATION_PASS_VERDICT
      : FEATURE_FILM_FOUNDATION_FAIL_VERDICT,
    foundation_status: foundationReady
      ? FEATURE_FILM_FOUNDATION_READY_STATUS
      : 'FEATURE_FILM_FOUNDATION_INCOMPLETE',
    precheck,
    policy: {
      no_ds_audit_phases: true,
      no_rehardening_phases: true,
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    roadmap: {
      mv: 'PRODUCTION_READY',
      short_film: 'SHORT_FILM_PRODUCTION_READY',
      medium_film: 'MEDIUM_FILM_PRODUCTION_READY',
      feature_film: foundationReady ? FEATURE_FILM_FOUNDATION_READY_STATUS : 'IN_PROGRESS',
    },
    expansion_design: {
      medium_film_scene_range: '300-1000',
      feature_film_scene_range: '1000-3000',
      scene_range: String(scaleRules.scene_range ?? '1000-3000'),
      shot_range: String(scaleRules.shot_range ?? '4000-24000'),
      act_range: String(scaleRules.act_range ?? '3-5'),
      callback_depth: String(scaleRules.callback_depth ?? '3-5'),
      continuity_depth: Number(scaleRules.continuity_depth ?? 14),
      inherited_arc_dimensions: [...INHERITED_ARC_DIMENSIONS],
      feature_arc_dimensions: [...FEATURE_ARC_DIMENSIONS],
    },
    foundation_validation: foundationValidation,
    feature_film_outputs: {
      library_path: FEATURE_FILM_LIBRARY_PATH,
      index_path: FEATURE_FILM_INDEX_PATH,
      continuity_spec_path: FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH,
      dependency_spec_path: FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH,
      scale_rules_path: FEATURE_FILM_SCALE_RULES_EXPORT_PATH,
      foundation_path: FEATURE_FILM_FOUNDATION_PATH,
      archetype_count: library.archetypes.length,
    },
    issues,
    feature_film_foundation_ready: foundationReady,
  };

  fs.mkdirSync(path.join(root, FEATURE_FILM_FOUNDATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, FEATURE_FILM_FOUNDATION_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, 'datasets/feature_film'), { recursive: true });

  fs.writeFileSync(
    path.join(root, FEATURE_FILM_FOUNDATION_PATH),
    `${JSON.stringify(foundationManifest, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_CONTINUITY_SPEC_EXPORT_PATH),
    `${JSON.stringify(continuitySpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_DEPENDENCY_SPEC_EXPORT_PATH),
    `${JSON.stringify(dependencySpecExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCALE_RULES_EXPORT_PATH),
    `${JSON.stringify(scaleRules, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
