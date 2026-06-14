import fs from 'node:fs';
import path from 'node:path';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from './mvProductionReadyBaselineSnapshot.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SHORT_FILM_LIBRARY_PATH,
  LONG_FORM_CONTINUITY_SPEC_PATH as SHORT_FILM_CONTINUITY_SPEC_PATH,
} from './shortFilmProductionFoundation.js';
import {
  SHORT_FILM_PRODUCTION_READINESS_PATH,
  SHORT_FILM_PRODUCTION_READY_STATUS,
  SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT,
  SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH,
} from './shortFilmProductionValidation.js';

export const MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE = 'PHASE-L3-MEDIUM-001' as const;
export const MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT =
  'PASS_MEDIUM_FILM_FOUNDATION_V1' as const;
export const MEDIUM_FILM_PRODUCTION_FOUNDATION_FAIL_VERDICT =
  'FAIL_MEDIUM_FILM_FOUNDATION_V1' as const;
export const MEDIUM_FILM_FOUNDATION_READY_STATUS = 'MEDIUM_FILM_FOUNDATION_READY' as const;

export const MEDIUM_FILM_LIBRARY_PATH =
  'datasets/medium_film/medium-film-archetype-library-v1.json' as const;
export const MEDIUM_FILM_INDEX_PATH =
  'datasets/medium_film/medium-film-archetype-index-v1.json' as const;
export const MEDIUM_FILM_BLUEPRINT_SCHEMA_PATH =
  'schemas/medium-film-blueprint.schema.json' as const;

export const MEDIUM_FILM_FOUNDATION_EXPORT_DIR = 'exports/medium_film_foundation' as const;
export const MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH =
  'exports/medium_film_foundation/long-form-continuity-specification-v2.json' as const;
export const MEDIUM_FILM_FOUNDATION_REPORT_PATH =
  'exports/medium_film_foundation/MEDIUM_FILM_FOUNDATION_REPORT.json' as const;

const SCENE_COUNT_MIN = 300;
const SCENE_COUNT_MAX = 1000;

const PRESERVED_ARC_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
  'relationship_arc',
  'timeline_arc',
  'memory_callback_arc',
] as const;

const V2_ARC_DIMENSIONS = [
  'subplot_arc',
  'parallel_arc',
  'multi_callback_arc',
  'relationship_network',
] as const;

const REQUIRED_MEDIUM_FIELDS = [...PRESERVED_ARC_DIMENSIONS, ...V2_ARC_DIMENSIONS] as const;

type IssueSeverity = 'error' | 'warning';

interface FoundationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface MediumArchetypeRecord {
  medium_film_archetype_id: string;
  theme: string;
  scene_count_range: string;
  short_film_source_ref: string;
  story_arcs: unknown[];
  parallel_narrative_flows: unknown[];
  character_groups: unknown[];
  character_arc: Record<string, unknown>;
  location_arc: Record<string, unknown>;
  lighting_arc: Record<string, unknown>;
  relationship_arc: Record<string, unknown>;
  timeline_arc: Record<string, unknown>;
  memory_callback_arc: unknown[];
  subplot_arc: { subplots: unknown[] };
  parallel_arc: { parallel_tracks: unknown[] };
  multi_callback_arc: { callback_layers: unknown[] };
  relationship_network: {
    nodes: string[];
    edges: unknown[];
    evolution_stages: string[];
  };
  continuity_requirements: Record<string, string[]>;
}

export interface MediumFilmFoundationReport {
  report_id: string;
  phase: typeof MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  foundation_status: string;
  precheck: {
    short_film_production_ready: boolean;
    pass_short_film_production_validation_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_ds_audit_phases: boolean;
    no_rehardening_phases: boolean;
    mv_production_ready_unmodified: boolean;
    mv_baseline_unmodified: boolean;
    short_film_outputs_read_only: boolean;
    level_4_phases_blocked: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  roadmap: {
    mv: string;
    short_film: string;
    medium_film: string;
    feature_film: string;
  };
  expansion_design: {
    short_film_scene_range: string;
    medium_film_scene_range: string;
    min_scene_count: number;
    max_scene_count: number;
    preserved_arc_dimensions: string[];
    v2_arc_dimensions: string[];
  };
  foundation_validation: {
    continuity_v2_ready: boolean;
    subplot_support_ready: boolean;
    parallel_arc_support_ready: boolean;
    multi_callback_support_ready: boolean;
    relationship_network_ready: boolean;
    medium_film_extension_ready: boolean;
  };
  medium_film_outputs: {
    library_path: string;
    index_path: string;
    blueprint_schema_path: string;
    continuity_spec_v2_path: string;
    archetype_count: number;
  };
  issues: FoundationIssue[];
  medium_film_foundation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function parseSceneRange(range: string): { min: number; max: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function buildContinuitySpecV2(root: string): Record<string, unknown> {
  let preservedDimensions: Record<string, unknown> = {};
  const specPath = path.join(root, SHORT_FILM_CONTINUITY_SPEC_PATH);
  if (fs.existsSync(specPath)) {
    const spec = readJson<{ dimensions: Record<string, unknown> }>(root, SHORT_FILM_CONTINUITY_SPEC_PATH);
    preservedDimensions = Object.fromEntries(
      Object.entries(spec.dimensions).map(([key, value]) => [
        key.replace('_continuity', '_arc'),
        {
          ...value,
          preserved_from: 'short_film_v1',
        },
      ])
    );
  }

  return {
    spec_id: 'long-form-continuity-specification-v2',
    phase: MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE,
    version: 'v2',
    purpose:
      'Medium film continuity specification extending Short Film v1 to 300-1000 scenes with parallel arcs, subplots, multi-layer callbacks, and relationship networks.',
    short_film_spec_ref: SHORT_FILM_CONTINUITY_SPEC_PATH,
    mv_baseline_scene_range: '10-50',
    short_film_scene_range: '50-300',
    medium_film_scene_range: '300-1000',
    min_scene_count: SCENE_COUNT_MIN,
    max_scene_count: SCENE_COUNT_MAX,
    preserved_dimensions: [...PRESERVED_ARC_DIMENSIONS],
    v2_dimensions: [...V2_ARC_DIMENSIONS],
    dimensions: {
      ...preservedDimensions,
      character_arc: {
        definition:
          'Visual DNA, wardrobe, and behavioral grammar remain stable across 300-1000 scenes with multi-group ensemble support.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Character groups expand to parallel narrative flows with independent arc stages per group.',
      },
      location_arc: {
        definition:
          'Location geometry and seasonal variants remain traceable across decade-scale timeline blocks.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Location reentry registry scales to multi-subplot location rotation with parallel flow interleaving.',
      },
      lighting_arc: {
        definition:
          'Lighting DNA palettes maintain consistency across seasonal and decade timeline markers.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Parallel tracks may use desynchronized palette blocks within registered variant catalog.',
      },
      relationship_arc: {
        definition:
          'Primary pair relationship stages progress within network evolution constraints.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Relationship arc integrates with relationship_network edge evolution stages.',
      },
      timeline_arc: {
        definition:
          'Timeline markers and long-range dependencies maintain causal ordering across 300-1000 scenes.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Long-range timeline dependencies minimum gap 80 scenes with parallel flow phase locking.',
      },
      memory_callback_arc: {
        definition:
          'Memory callback seeds and resolutions traceable across extended scene ranges.',
        preserved_from: 'short_film_v1',
        medium_film_expansion:
          'Memory callbacks delegate to multi_callback_arc layers for object and relationship tiers.',
      },
      subplot_arc: {
        definition:
          'Independent subplot beats interleave with primary arcs without breaking timeline continuity.',
        enforcement_rules: [
          'subplot_id_required_per_subplot_block',
          'subplot_scene_range_must_not_overlap_primary_climax_block',
          'subplot_beats_must_resolve_before_primary_resolution',
        ],
        medium_film_requirement: 'Multiple Story Arcs',
      },
      parallel_arc: {
        definition:
          'Parallel narrative tracks maintain interleave intervals and independent arc references.',
        enforcement_rules: [
          'parallel_track_minimum_2_per_archetype',
          'interleave_interval_documented_per_flow',
          'parallel_tracks_must_converge_at_resolution_block',
        ],
        medium_film_requirement: 'Parallel Narrative Flows',
      },
      multi_callback_arc: {
        definition:
          'Multi-layer callback structure with independent object, relationship, and ritual tiers.',
        enforcement_rules: [
          'callback_layer_minimum_2_per_archetype',
          'foreshadow_payoff_gap_minimum_80_scenes',
          'layer_independence_maintained_across_parallel_flows',
        ],
        medium_film_requirement: 'Multi-Layer Callback Structure',
      },
      relationship_network: {
        definition:
          'Relationship network nodes and edges evolve through documented stages across character groups.',
        enforcement_rules: [
          'network_nodes_registered_per_character_group',
          'edge_evolution_monotonic_within_stage_index',
          'network_convergence_required_at_finale_block',
        ],
        medium_film_requirement: 'Relationship Network Evolution',
      },
    },
    medium_film_requirements: [
      'Multiple Story Arcs',
      'Parallel Narrative Flows',
      'Multiple Character Groups',
      'Multi-Layer Callback Structure',
      'Long-Range Timeline Dependencies',
      'Relationship Network Evolution',
    ],
    cross_dimension_requirements: [
      'all_preserved_short_film_arc_dimensions_required_per_archetype',
      'all_v2_arc_dimensions_required_per_archetype',
      'parallel_arc_must_align_with_parallel_narrative_flows',
      'multi_callback_arc_must_align_with_memory_callback_arc',
      'relationship_network_must_align_with_character_groups',
      'subplot_arc_must_not_break_timeline_long_range_dependencies',
    ],
  };
}

function runPrecheck(root: string): {
  short_film_production_ready: boolean;
  pass_short_film_production_validation_v1: boolean;
  precheck_passed: boolean;
  issues: FoundationIssue[];
} {
  const issues: FoundationIssue[] = [];

  const validationReportPath = path.join(root, SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH);
  const readinessPath = path.join(root, SHORT_FILM_PRODUCTION_READINESS_PATH);

  if (!fs.existsSync(validationReportPath) || !fs.existsSync(readinessPath)) {
    issues.push({
      code: 'SHORT_FILM_VALIDATION_MISSING',
      message: 'Short Film production validation artifacts missing',
      severity: 'error',
    });
    return {
      short_film_production_ready: false,
      pass_short_film_production_validation_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const validationReport = readJson<Record<string, unknown>>(root, SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH);
  const readiness = readJson<Record<string, unknown>>(root, SHORT_FILM_PRODUCTION_READINESS_PATH);

  const validationStatus = String(validationReport.status ?? '');
  const validationVerdict = String(validationReport.final_verdict ?? '');
  const readinessStatus = String(readiness.production_readiness_status ?? '');

  const short_film_production_ready =
    validationStatus === SHORT_FILM_PRODUCTION_READY_STATUS &&
    readinessStatus === SHORT_FILM_PRODUCTION_READY_STATUS;
  const pass_short_film_production_validation_v1 =
    validationVerdict === SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT;

  if (!short_film_production_ready) {
    issues.push({
      code: 'SHORT_FILM_NOT_PRODUCTION_READY',
      message: `Expected ${SHORT_FILM_PRODUCTION_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_short_film_production_validation_v1) {
    issues.push({
      code: 'SHORT_FILM_VALIDATION_FAIL',
      message: `Expected ${SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    short_film_production_ready,
    pass_short_film_production_validation_v1,
    precheck_passed: short_film_production_ready && pass_short_film_production_validation_v1,
    issues,
  };
}

function validateMediumFilmDatasets(root: string): FoundationIssue[] {
  const issues: FoundationIssue[] = [];

  for (const datasetPath of [
    MEDIUM_FILM_LIBRARY_PATH,
    MEDIUM_FILM_INDEX_PATH,
    MEDIUM_FILM_BLUEPRINT_SCHEMA_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, datasetPath))) {
      issues.push({
        code: 'MEDIUM_FILM_DATASET_MISSING',
        message: `Missing ${datasetPath}`,
        severity: 'error',
      });
    }
  }

  if (issues.length > 0) return issues;

  const library = readJson<{
    archetype_count: number;
    archetypes: MediumArchetypeRecord[];
    scope: { min_scene_count: number; max_scene_count: number };
  }>(root, MEDIUM_FILM_LIBRARY_PATH);
  const index = readJson<{ archetype_count: number; entries: unknown[] }>(root, MEDIUM_FILM_INDEX_PATH);

  if (library.scope.min_scene_count !== SCENE_COUNT_MIN) {
    issues.push({
      code: 'MIN_SCENE_COUNT_INVALID',
      message: `Expected min_scene_count=${SCENE_COUNT_MIN}`,
      severity: 'error',
    });
  }
  if (library.scope.max_scene_count !== SCENE_COUNT_MAX) {
    issues.push({
      code: 'MAX_SCENE_COUNT_INVALID',
      message: `Expected max_scene_count=${SCENE_COUNT_MAX}`,
      severity: 'error',
    });
  }

  for (const archetype of library.archetypes) {
    const id = archetype.medium_film_archetype_id;
    const parsed = parseSceneRange(archetype.scene_count_range);
    if (!parsed || parsed.min < SCENE_COUNT_MIN || parsed.max > SCENE_COUNT_MAX) {
      issues.push({
        code: 'ARCHETYPE_SCENE_RANGE_INVALID',
        message: `${id}: scene_count_range must be within ${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        severity: 'error',
      });
    }

    for (const field of REQUIRED_MEDIUM_FIELDS) {
      if (!(field in archetype)) {
        issues.push({
          code: 'MISSING_MEDIUM_FIELD',
          message: `${id}: missing ${field}`,
          severity: 'error',
        });
      }
    }

    if ((archetype.story_arcs?.length ?? 0) < 2) {
      issues.push({
        code: 'INSUFFICIENT_STORY_ARCS',
        message: `${id}: requires multiple story arcs`,
        severity: 'error',
      });
    }
    if ((archetype.parallel_narrative_flows?.length ?? 0) < 2) {
      issues.push({
        code: 'INSUFFICIENT_PARALLEL_FLOWS',
        message: `${id}: requires parallel narrative flows`,
        severity: 'error',
      });
    }
    if ((archetype.character_groups?.length ?? 0) < 2) {
      issues.push({
        code: 'INSUFFICIENT_CHARACTER_GROUPS',
        message: `${id}: requires multiple character groups`,
        severity: 'error',
      });
    }
    if ((archetype.subplot_arc?.subplots?.length ?? 0) < 1) {
      issues.push({
        code: 'SUBPLOT_NOT_READY',
        message: `${id}: subplot_arc.subplots required`,
        severity: 'error',
      });
    }
    if ((archetype.parallel_arc?.parallel_tracks?.length ?? 0) < 2) {
      issues.push({
        code: 'PARALLEL_ARC_NOT_READY',
        message: `${id}: parallel_arc.parallel_tracks minimum 2`,
        severity: 'error',
      });
    }
    if ((archetype.multi_callback_arc?.callback_layers?.length ?? 0) < 2) {
      issues.push({
        code: 'MULTI_CALLBACK_NOT_READY',
        message: `${id}: multi_callback_arc.callback_layers minimum 2`,
        severity: 'error',
      });
    }
    if (
      (archetype.relationship_network?.nodes?.length ?? 0) < 2 ||
      (archetype.relationship_network?.edges?.length ?? 0) < 1 ||
      (archetype.relationship_network?.evolution_stages?.length ?? 0) < 1
    ) {
      issues.push({
        code: 'RELATIONSHIP_NETWORK_NOT_READY',
        message: `${id}: relationship_network incomplete`,
        severity: 'error',
      });
    }
    if ((archetype.timeline_arc?.long_range_dependencies as unknown[])?.length === 0) {
      issues.push({
        code: 'LONG_RANGE_TIMELINE_MISSING',
        message: `${id}: long-range timeline dependencies required`,
        severity: 'error',
      });
    }
  }

  if (library.archetype_count !== library.archetypes.length) {
    issues.push({
      code: 'LIBRARY_COUNT_MISMATCH',
      message: 'archetype_count mismatch in library',
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

  return issues;
}

function evaluateFoundationValidation(
  archetypes: MediumArchetypeRecord[],
  datasetIssues: FoundationIssue[]
): MediumFilmFoundationReport['foundation_validation'] {
  const errors = datasetIssues.filter((issue) => issue.severity === 'error');
  const archetypeReady = errors.length === 0 && archetypes.length >= 3;

  const subplotReady = archetypes.every((a) => (a.subplot_arc?.subplots?.length ?? 0) >= 1);
  const parallelReady = archetypes.every(
    (a) => (a.parallel_arc?.parallel_tracks?.length ?? 0) >= 2
  );
  const multiCallbackReady = archetypes.every(
    (a) => (a.multi_callback_arc?.callback_layers?.length ?? 0) >= 2
  );
  const networkReady = archetypes.every(
    (a) =>
      (a.relationship_network?.nodes?.length ?? 0) >= 2 &&
      (a.relationship_network?.edges?.length ?? 0) >= 1
  );

  return {
    continuity_v2_ready: archetypeReady,
    subplot_support_ready: subplotReady,
    parallel_arc_support_ready: parallelReady,
    multi_callback_support_ready: multiCallbackReady,
    relationship_network_ready: networkReady,
    medium_film_extension_ready: archetypeReady,
  };
}

export function writeMediumFilmProductionFoundation(
  projectRoot?: string
): MediumFilmFoundationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: FoundationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!fs.existsSync(path.join(root, SHORT_FILM_LIBRARY_PATH))) {
    issues.push({
      code: 'SHORT_FILM_LIBRARY_MISSING',
      message: `Short Film library missing at ${SHORT_FILM_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  issues.push(...validateMediumFilmDatasets(root));

  const library = fs.existsSync(path.join(root, MEDIUM_FILM_LIBRARY_PATH))
    ? readJson<{ archetypes: MediumArchetypeRecord[] }>(root, MEDIUM_FILM_LIBRARY_PATH)
    : { archetypes: [] };

  const foundationValidation = evaluateFoundationValidation(library.archetypes, issues);
  const continuitySpecV2 = buildContinuitySpecV2(root);

  const validationFlagsReady = Object.values(foundationValidation).every((flag) => flag === true);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const foundationReady = precheck.precheck_passed && errors.length === 0 && validationFlagsReady;

  const report: MediumFilmFoundationReport = {
    report_id: 'medium-film-foundation-report-v1',
    phase: MEDIUM_FILM_PRODUCTION_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: foundationReady
      ? MEDIUM_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT
      : MEDIUM_FILM_PRODUCTION_FOUNDATION_FAIL_VERDICT,
    foundation_status: foundationReady
      ? MEDIUM_FILM_FOUNDATION_READY_STATUS
      : 'MEDIUM_FILM_FOUNDATION_INCOMPLETE',
    precheck,
    policy: {
      no_ds_audit_phases: true,
      no_rehardening_phases: true,
      mv_production_ready_unmodified: true,
      mv_baseline_unmodified: true,
      short_film_outputs_read_only: true,
      level_4_phases_blocked: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    roadmap: {
      mv: 'PRODUCTION_READY',
      short_film: 'SHORT_FILM_PRODUCTION_READY',
      medium_film: foundationReady ? MEDIUM_FILM_FOUNDATION_READY_STATUS : 'IN_PROGRESS',
      feature_film: 'PLANNED',
    },
    expansion_design: {
      short_film_scene_range: '50-300',
      medium_film_scene_range: '300-1000',
      min_scene_count: SCENE_COUNT_MIN,
      max_scene_count: SCENE_COUNT_MAX,
      preserved_arc_dimensions: [...PRESERVED_ARC_DIMENSIONS],
      v2_arc_dimensions: [...V2_ARC_DIMENSIONS],
    },
    foundation_validation: foundationValidation,
    medium_film_outputs: {
      library_path: MEDIUM_FILM_LIBRARY_PATH,
      index_path: MEDIUM_FILM_INDEX_PATH,
      blueprint_schema_path: MEDIUM_FILM_BLUEPRINT_SCHEMA_PATH,
      continuity_spec_v2_path: MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH,
      archetype_count: library.archetypes.length,
    },
    issues,
    medium_film_foundation_ready: foundationReady,
  };

  fs.mkdirSync(path.join(root, MEDIUM_FILM_FOUNDATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, 'datasets/medium_film'), { recursive: true });

  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_CONTINUITY_SPEC_V2_PATH),
    `${JSON.stringify(continuitySpecV2, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
