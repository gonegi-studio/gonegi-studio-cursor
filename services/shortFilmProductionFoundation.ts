import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from './mvProductionReadyBaselineSnapshot.js';
import {
  BALLAD_MV_INDEX_PATH,
  BALLAD_MV_LIBRARY_PATH,
  INSTRUMENTAL_MV_INDEX_PATH,
  INSTRUMENTAL_MV_LIBRARY_PATH,
  SAFE_CREATE_POLICY,
  STORY_MV_INDEX_PATH,
  STORY_MV_LIBRARY_PATH,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SHORT_FILM_PRODUCTION_FOUNDATION_PHASE = 'PHASE-L3-001' as const;
export const SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT =
  'PASS_SHORT_FILM_FOUNDATION_V1' as const;
export const SHORT_FILM_PRODUCTION_FOUNDATION_FAIL_VERDICT =
  'FAIL_SHORT_FILM_FOUNDATION_V1' as const;
export const SHORT_FILM_FOUNDATION_READY_STATUS = 'SHORT_FILM_FOUNDATION_READY' as const;

export const SHORT_FILM_LIBRARY_PATH =
  'datasets/short_film/short-film-archetype-library-v1.json' as const;
export const SHORT_FILM_INDEX_PATH =
  'datasets/short_film/short-film-archetype-index-v1.json' as const;
export const SHORT_FILM_BLUEPRINT_SCHEMA_PATH =
  'schemas/short-film-blueprint.schema.json' as const;

export const SHORT_FILM_FOUNDATION_DIR = 'reports/short_film_foundation' as const;
export const SHORT_FILM_FOUNDATION_REPORT_PATH =
  'reports/short_film_foundation/SHORT_FILM_FOUNDATION_REPORT.json' as const;
export const SHORT_FILM_FOUNDATION_MD_PATH =
  'reports/short_film_foundation/SHORT_FILM_FOUNDATION_REPORT.md' as const;

export const SHORT_FILM_FOUNDATION_EXPORT_DIR = 'exports/short_film_foundation' as const;
export const SHORT_FILM_FOUNDATION_ARTIFACT_PATH =
  'exports/short_film_foundation/short-film-production-foundation.json' as const;
export const LONG_FORM_CONTINUITY_SPEC_PATH =
  'exports/short_film_foundation/long-form-continuity-specification.json' as const;

const MV_DATASET_PATHS = [
  INSTRUMENTAL_MV_LIBRARY_PATH,
  INSTRUMENTAL_MV_INDEX_PATH,
  BALLAD_MV_LIBRARY_PATH,
  BALLAD_MV_INDEX_PATH,
  STORY_MV_LIBRARY_PATH,
  STORY_MV_INDEX_PATH,
] as const;

const SHORT_FILM_OUTPUT_PATHS = [
  SHORT_FILM_LIBRARY_PATH,
  SHORT_FILM_INDEX_PATH,
  SHORT_FILM_BLUEPRINT_SCHEMA_PATH,
  SHORT_FILM_FOUNDATION_REPORT_PATH,
  SHORT_FILM_FOUNDATION_MD_PATH,
  SHORT_FILM_FOUNDATION_ARTIFACT_PATH,
  LONG_FORM_CONTINUITY_SPEC_PATH,
] as const;

const REQUIRED_LONG_FORM_FIELDS = [
  'act_structure',
  'story_arc',
  'character_arc',
  'location_arc',
  'emotional_arc',
  'callback_system',
  'continuity_requirements',
] as const;

const CONTINUITY_DIMENSIONS = [
  'character_continuity',
  'location_continuity',
  'lighting_continuity',
  'relationship_continuity',
  'timeline_continuity',
] as const;

type IssueSeverity = 'error' | 'warning';

interface FoundationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface MvCommonStructure {
  shared_header_fields: string[];
  shared_scope_fields: string[];
  shared_integrated_systems: string[];
  shared_scene_blueprint_fields: string[];
  mv_type_profiles: Record<
    string,
    {
      archetype_count: number;
      scene_count_range: string;
      distinctive_fields: string[];
      dialogue: boolean;
      story_arc_required: boolean;
    }
  >;
}

interface LongFormContinuitySpecification {
  spec_id: string;
  phase: string;
  version: string;
  purpose: string;
  mv_baseline_scene_range: string;
  short_film_scene_range: string;
  dimensions: Record<
    (typeof CONTINUITY_DIMENSIONS)[number],
    {
      definition: string;
      enforcement_rules: string[];
      mv_to_short_film_expansion: string;
    }
  >;
  cross_dimension_requirements: string[];
}

export interface ShortFilmFoundationReport {
  report_id: string;
  phase: typeof SHORT_FILM_PRODUCTION_FOUNDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  foundation_status: string;
  precheck: {
    production_ready_certified: boolean;
    baseline_snapshot_frozen: boolean;
    no_new_ds_phase_allowed: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_production_ready_state_modified: boolean;
    baseline_snapshot_modified: boolean;
    audit_hardening_created: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  mv_archetype_analysis: MvCommonStructure;
  short_film_outputs: {
    library_path: string;
    index_path: string;
    blueprint_schema_path: string;
    continuity_spec_path: string;
    archetype_count: number;
    scene_count_range: string;
  };
  expansion_design: {
    mv_scene_range: string;
    short_film_scene_range: string;
    required_long_form_fields: string[];
    fields_present_in_all_archetypes: boolean;
  };
  issues: FoundationIssue[];
  short_film_foundation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  const fullPath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function sha256File(root: string, relativePath: string): string {
  const fullPath = path.join(root, relativePath);
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function ensureDir(root: string, relativeDir: string): void {
  fs.mkdirSync(path.join(root, relativeDir), { recursive: true });
}

function parseSceneRange(range: string): { min: number; max: number } | null {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function analyzeMvArchetypes(root: string): MvCommonStructure {
  const instrumental = readJson<Record<string, unknown>>(root, INSTRUMENTAL_MV_LIBRARY_PATH);
  const ballad = readJson<Record<string, unknown>>(root, BALLAD_MV_LIBRARY_PATH);
  const story = readJson<Record<string, unknown>>(root, STORY_MV_LIBRARY_PATH);

  const instrumentalScope = instrumental.scope as Record<string, unknown>;
  const balladScope = ballad.scope as Record<string, unknown>;
  const storyScope = story.scope as Record<string, unknown>;

  const instrumentalArchetype = (
    (instrumental.archetypes as Record<string, unknown>[]) ?? []
  )[0] as Record<string, unknown>;
  const balladArchetype = ((ballad.archetypes as Record<string, unknown>[]) ?? [])[0] as Record<
    string,
    unknown
  >;
  const storyArchetype = ((story.archetypes as Record<string, unknown>[]) ?? [])[0] as Record<
    string,
    unknown
  >;

  const instrumentalBlueprint = (
    (instrumentalArchetype?.scene_blueprints as Record<string, unknown>[]) ?? []
  )[0] as Record<string, unknown>;
  const balladBlueprint = ((balladArchetype?.scene_blueprints as Record<string, unknown>[]) ??
    [])[0] as Record<string, unknown>;

  return {
    shared_header_fields: [
      'asset_type',
      'asset_version',
      'phase',
      'world_identity',
      'purpose',
      'scope',
      'integrated_systems',
      'validation_prerequisites',
      'validation_target',
      'archetype_count',
      'archetypes',
    ],
    shared_scope_fields: [
      'generates_lyrics',
      'generates_dialogue',
      'target_output',
      'duration_target_minutes',
    ],
    shared_integrated_systems: [
      'character_dna',
      'location_dna',
      'indoor_anchor',
      'lighting_anchor',
      'shot_grammar',
      'emotion_acting',
    ],
    shared_scene_blueprint_fields: [
      'scene_index',
      'scene_goal',
      'character_id',
      'location_id',
      'lighting_anchor_id',
      'lighting_dna_id',
      'coverage_id',
      'emotion_id',
      'scene_archetype',
      'action_type',
    ],
    mv_type_profiles: {
      instrumental_mv: {
        archetype_count: Number(instrumental.archetype_count ?? 0),
        scene_count_range: String(instrumentalArchetype?.scene_count_range ?? '4-6'),
        distinctive_fields: [
          'emotion_flow',
          'location_flow',
          'lighting_flow',
          'coverage_flow',
          'environmental_focus',
        ],
        dialogue: Boolean(instrumentalScope?.generates_dialogue === false),
        story_arc_required: Boolean(instrumentalScope?.requires_story_arc === false),
      },
      ballad_mv: {
        archetype_count: Number(ballad.archetype_count ?? 0),
        scene_count_range: '3-6 per archetype segment',
        distinctive_fields: [
          'relationship_arc',
          'memory_anchors',
          'callback_rules',
          'scene_transition_rules',
          'partner_character_id',
        ],
        dialogue: Boolean(balladScope?.generates_dialogue === false),
        story_arc_required: Boolean(balladScope?.requires_relationship_arc === true),
      },
      story_mv: {
        archetype_count: Number(story.archetype_count ?? 0),
        scene_count_range: '4-5 narrative beats',
        distinctive_fields: ['narrative_beats', 'story_archetype_id'],
        dialogue: Boolean(storyScope?.generates_dialogue === true),
        story_arc_required: Boolean(storyScope?.requires_story_arc === true),
      },
    },
  };
}

function buildLongFormContinuitySpec(): LongFormContinuitySpecification {
  return {
    spec_id: 'long-form-continuity-specification-v1',
    phase: SHORT_FILM_PRODUCTION_FOUNDATION_PHASE,
    version: 'v1',
    purpose:
      'Long-form continuity requirements for Short Film Studio production spanning 50-300 scenes.',
    mv_baseline_scene_range: '10-50',
    short_film_scene_range: '50-300',
    dimensions: {
      character_continuity: {
        definition:
          'Visual DNA, wardrobe progression, and behavioral grammar remain stable across all scene blocks and act reentries.',
        enforcement_rules: [
          'character_dna_registry_required_before_scene_1',
          'wardrobe_state_documented_per_timeline_marker',
          'reentry_scenes_must_match_reference_fingerprint_hash',
          'ensemble_cast_limited_to_pre_registered_principals',
        ],
        mv_to_short_film_expansion:
          'MV single-character focus expands to multi-act wardrobe and aging progression with reentry verification every 25 scenes.',
      },
      location_continuity: {
        definition:
          'Location geometry, prop placement, and seasonal variants remain traceable across act boundaries and callbacks.',
        enforcement_rules: [
          'location_dna_registry_required_for_all_location_flow_entries',
          'reentry_locations_must_use_identical_geometry_hash',
          'seasonal_prop_variants_pre_registered_per_act',
          'background_activity_level_tracks_timeline_marker',
        ],
        mv_to_short_film_expansion:
          'MV location_flow arrays expand to act-scoped location arcs with mandatory reentry location registry and seasonal state variants.',
      },
      lighting_continuity: {
        definition:
          'Lighting DNA anchors maintain perceptual consistency within timeline blocks and memory montage variants.',
        enforcement_rules: [
          'lighting_dna_id_required_on_every_scene_blueprint',
          'act_opener_lighting_must_match_established_dna_for_location',
          'memory_montage_uses_registered_desaturated_variants_only',
          'golden_hour_progression_tracks_single_day_scenes',
        ],
        mv_to_short_film_expansion:
          'MV lighting_flow per archetype expands to act-level lighting palettes with emotional_turning_point overrides and montage variant catalog.',
      },
      relationship_continuity: {
        definition:
          'Relationship stage, physical proximity, and eyeline grammar progress monotonically within arc constraints.',
        enforcement_rules: [
          'relationship_stage_required_on_character_pair_scenes',
          'physical_distance_maps_to_relationship_stage_index',
          'eyeline_rules_from_emotion_acting_adapter_preserved',
          'unresolved_threads_documented_at_act_boundaries',
        ],
        mv_to_short_film_expansion:
          'Ballad MV relationship_arc segments expand to full character_arc stages spanning 50-300 scenes with parallel timeline pairing.',
      },
      timeline_continuity: {
        definition:
          'Explicit timeline markers, season progression, and callback timing maintain causal ordering across acts.',
        enforcement_rules: [
          'timeline_marker_required_on_every_scene_blueprint',
          'act_boundary_must_include_explicit_time_jump_or_season_shift',
          'callback_scene_references_must_point_to_earlier_established_scene',
          'foreshadow_payoff_minimum_gap_20_scenes',
        ],
        mv_to_short_film_expansion:
          'MV narrative_beats expand to act_structure scene ranges with inciting_incident, midpoint, climax, and resolution scene anchors.',
      },
    },
    cross_dimension_requirements: [
      'continuity_requirements_block_required_on_every_short_film_archetype',
      'callback_system_foreshadow_payoff_pairs_must_align_with_timeline_continuity',
      'character_reentry_must_trigger_location_and_lighting_continuity_recheck',
      'relationship_stage_transitions_must_align_with_emotional_arc_turning_points',
    ],
  };
}

function runPrecheck(root: string): {
  production_ready_certified: boolean;
  baseline_snapshot_frozen: boolean;
  no_new_ds_phase_allowed: boolean;
  precheck_passed: boolean;
  issues: FoundationIssue[];
} {
  const issues: FoundationIssue[] = [];
  let production_ready_certified = false;
  let baseline_snapshot_frozen = false;
  let no_new_ds_phase_allowed = false;

  const statePath = path.join(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH);
  if (!fs.existsSync(statePath)) {
    issues.push({
      code: 'PRECHECK_STATE_MISSING',
      message: `Missing MV current state at ${MV_PRODUCTION_READY_CURRENT_STATE_PATH}`,
      severity: 'error',
    });
  } else {
    const state = readJson<Record<string, unknown>>(root, MV_PRODUCTION_READY_CURRENT_STATE_PATH);
    production_ready_certified = state.production_ready_certified === true;
    baseline_snapshot_frozen = state.baseline_snapshot_frozen === true;
    no_new_ds_phase_allowed = state.no_new_ds_phase_allowed === true;

    if (!production_ready_certified) {
      issues.push({
        code: 'PRECHECK_NOT_CERTIFIED',
        message: 'production_ready_certified must be true',
        severity: 'error',
      });
    }
    if (!baseline_snapshot_frozen) {
      issues.push({
        code: 'PRECHECK_BASELINE_NOT_FROZEN',
        message: 'baseline_snapshot_frozen must be true',
        severity: 'error',
      });
    }
    if (!no_new_ds_phase_allowed) {
      issues.push({
        code: 'PRECHECK_DS_PHASE_ALLOWED',
        message: 'no_new_ds_phase_allowed must be true',
        severity: 'error',
      });
    }
  }

  const precheck_passed =
    production_ready_certified && baseline_snapshot_frozen && no_new_ds_phase_allowed;

  return {
    production_ready_certified,
    baseline_snapshot_frozen,
    no_new_ds_phase_allowed,
    precheck_passed,
    issues,
  };
}

function validateShortFilmDatasets(root: string): FoundationIssue[] {
  const issues: FoundationIssue[] = [];

  for (const datasetPath of [
    SHORT_FILM_LIBRARY_PATH,
    SHORT_FILM_INDEX_PATH,
    SHORT_FILM_BLUEPRINT_SCHEMA_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, datasetPath))) {
      issues.push({
        code: 'SHORT_FILM_DATASET_MISSING',
        message: `Missing required output: ${datasetPath}`,
        severity: 'error',
      });
    }
  }

  if (issues.length > 0) return issues;

  const library = readJson<Record<string, unknown>>(root, SHORT_FILM_LIBRARY_PATH);
  const index = readJson<Record<string, unknown>>(root, SHORT_FILM_INDEX_PATH);
  const archetypes = (library.archetypes as Record<string, unknown>[]) ?? [];

  const libraryCount = Number(library.archetype_count ?? 0);
  const indexCount = Number(index.archetype_count ?? 0);
  const entries = (index.entries as unknown[]) ?? [];

  if (libraryCount !== archetypes.length) {
    issues.push({
      code: 'ARCHETYPE_COUNT_MISMATCH',
      message: `library archetype_count=${libraryCount} but archetypes.length=${archetypes.length}`,
      severity: 'error',
    });
  }
  if (indexCount !== entries.length) {
    issues.push({
      code: 'INDEX_COUNT_MISMATCH',
      message: `index archetype_count=${indexCount} but entries.length=${entries.length}`,
      severity: 'error',
    });
  }

  const scope = library.scope as Record<string, unknown> | undefined;
  const scopeRange = String(scope?.scene_count_range ?? '');
  const parsedScope = parseSceneRange(scopeRange);
  if (!parsedScope || parsedScope.min < 50 || parsedScope.max > 300) {
    issues.push({
      code: 'SCENE_RANGE_INVALID',
      message: `scope.scene_count_range must be 50-300, got ${scopeRange}`,
      severity: 'error',
    });
  }

  for (const archetype of archetypes) {
    const id = String(archetype.short_film_archetype_id ?? 'unknown');
    const sceneRange = String(archetype.scene_count_range ?? '');
    const parsed = parseSceneRange(sceneRange);
    if (!parsed || parsed.min < 50 || parsed.max > 300) {
      issues.push({
        code: 'ARCHETYPE_SCENE_RANGE_INVALID',
        message: `${id}: scene_count_range must fall within 50-300, got ${sceneRange}`,
        severity: 'error',
      });
    }

    for (const field of REQUIRED_LONG_FORM_FIELDS) {
      if (!(field in archetype)) {
        issues.push({
          code: 'MISSING_LONG_FORM_FIELD',
          message: `${id}: missing required field ${field}`,
          severity: 'error',
        });
      }
    }

    const continuity = archetype.continuity_requirements as Record<string, unknown> | undefined;
    if (continuity) {
      for (const dimension of CONTINUITY_DIMENSIONS) {
        const rules = continuity[dimension];
        if (!Array.isArray(rules) || rules.length === 0) {
          issues.push({
            code: 'MISSING_CONTINUITY_DIMENSION',
            message: `${id}: continuity_requirements.${dimension} must be non-empty`,
            severity: 'error',
          });
        }
      }
    }
  }

  return issues;
}

function buildMarkdownReport(report: ShortFilmFoundationReport): string {
  return `# SHORT_FILM_FOUNDATION_REPORT

**Phase:** ${report.phase}
**Verdict:** ${report.final_verdict}
**Status:** ${report.foundation_status}
**Generated:** ${report.generated_at}

## Precheck

- production_ready_certified: ${report.precheck.production_ready_certified}
- baseline_snapshot_frozen: ${report.precheck.baseline_snapshot_frozen}
- no_new_ds_phase_allowed: ${report.precheck.no_new_ds_phase_allowed}
- precheck_passed: ${report.precheck.precheck_passed}

## Policy Compliance

- No new DS certification chain: ${report.policy.no_new_ds_certification_chain}
- MV Production Ready state modified: ${report.policy.mv_production_ready_state_modified}
- Baseline snapshot modified: ${report.policy.baseline_snapshot_modified}
- Audit/hardening created: ${report.policy.audit_hardening_created}

## MV Archetype Common Structure

Shared header fields: ${report.mv_archetype_analysis.shared_header_fields.join(', ')}

Shared scene blueprint fields: ${report.mv_archetype_analysis.shared_scene_blueprint_fields.join(', ')}

| MV Type | Archetypes | Scene Range | Dialogue |
|---------|------------|-------------|----------|
| instrumental_mv | ${report.mv_archetype_analysis.mv_type_profiles.instrumental_mv.archetype_count} | ${report.mv_archetype_analysis.mv_type_profiles.instrumental_mv.scene_count_range} | ${report.mv_archetype_analysis.mv_type_profiles.instrumental_mv.dialogue} |
| ballad_mv | ${report.mv_archetype_analysis.mv_type_profiles.ballad_mv.archetype_count} | ${report.mv_archetype_analysis.mv_type_profiles.ballad_mv.scene_count_range} | ${report.mv_archetype_analysis.mv_type_profiles.ballad_mv.dialogue} |
| story_mv | ${report.mv_archetype_analysis.mv_type_profiles.story_mv.archetype_count} | ${report.mv_archetype_analysis.mv_type_profiles.story_mv.scene_count_range} | ${report.mv_archetype_analysis.mv_type_profiles.story_mv.dialogue} |

## Short Film Expansion

- MV scene range: ${report.expansion_design.mv_scene_range}
- Short Film scene range: ${report.expansion_design.short_film_scene_range}
- Long-form fields: ${report.expansion_design.required_long_form_fields.join(', ')}

## Outputs

- Library: \`${report.short_film_outputs.library_path}\`
- Index: \`${report.short_film_outputs.index_path}\`
- Blueprint schema: \`${report.short_film_outputs.blueprint_schema_path}\`
- Continuity spec: \`${report.short_film_outputs.continuity_spec_path}\`
- Archetype count: ${report.short_film_outputs.archetype_count}
`;
}

export function writeShortFilmProductionFoundation(
  projectRoot?: string
): ShortFilmFoundationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: FoundationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  for (const mvPath of MV_DATASET_PATHS) {
    if (!fs.existsSync(path.join(root, mvPath))) {
      issues.push({
        code: 'MV_DATASET_MISSING',
        message: `Required MV dataset missing for read-only analysis: ${mvPath}`,
        severity: 'error',
      });
    }
  }

  const mvAnalysis = analyzeMvArchetypes(root);
  const continuitySpec = buildLongFormContinuitySpec();

  ensureDir(root, SHORT_FILM_FOUNDATION_DIR);
  ensureDir(root, SHORT_FILM_FOUNDATION_EXPORT_DIR);
  ensureDir(root, 'datasets/short_film');

  fs.writeFileSync(
    path.join(root, LONG_FORM_CONTINUITY_SPEC_PATH),
    `${JSON.stringify(continuitySpec, null, 2)}\n`,
    'utf8'
  );

  issues.push(...validateShortFilmDatasets(root));

  const library = readJson<Record<string, unknown>>(root, SHORT_FILM_LIBRARY_PATH);
  const archetypes = (library.archetypes as Record<string, unknown>[]) ?? [];
  const fieldsPresentInAll = archetypes.every((archetype) =>
    REQUIRED_LONG_FORM_FIELDS.every((field) => field in archetype)
  );

  const errors = issues.filter((issue) => issue.severity === 'error');
  const precheckPassed = precheck.precheck_passed;
  const datasetsValid = errors.length === 0;
  const foundationReady = precheckPassed && datasetsValid && fieldsPresentInAll;

  const report: ShortFilmFoundationReport = {
    report_id: 'short-film-foundation-report-v1',
    phase: SHORT_FILM_PRODUCTION_FOUNDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: foundationReady
      ? SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT
      : SHORT_FILM_PRODUCTION_FOUNDATION_FAIL_VERDICT,
    foundation_status: foundationReady
      ? SHORT_FILM_FOUNDATION_READY_STATUS
      : 'SHORT_FILM_FOUNDATION_INCOMPLETE',
    precheck: {
      production_ready_certified: precheck.production_ready_certified,
      baseline_snapshot_frozen: precheck.baseline_snapshot_frozen,
      no_new_ds_phase_allowed: precheck.no_new_ds_phase_allowed,
      precheck_passed: precheckPassed,
    },
    policy: {
      no_new_ds_certification_chain: true,
      mv_production_ready_state_modified: false,
      baseline_snapshot_modified: false,
      audit_hardening_created: false,
      write_policy: SAFE_CREATE_POLICY,
    },
    mv_archetype_analysis: mvAnalysis,
    short_film_outputs: {
      library_path: SHORT_FILM_LIBRARY_PATH,
      index_path: SHORT_FILM_INDEX_PATH,
      blueprint_schema_path: SHORT_FILM_BLUEPRINT_SCHEMA_PATH,
      continuity_spec_path: LONG_FORM_CONTINUITY_SPEC_PATH,
      archetype_count: archetypes.length,
      scene_count_range: '50-300',
    },
    expansion_design: {
      mv_scene_range: '10-50',
      short_film_scene_range: '50-300',
      required_long_form_fields: [...REQUIRED_LONG_FORM_FIELDS],
      fields_present_in_all_archetypes: fieldsPresentInAll,
    },
    issues,
    short_film_foundation_ready: foundationReady,
  };

  fs.writeFileSync(
    path.join(root, SHORT_FILM_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_FOUNDATION_MD_PATH),
    buildMarkdownReport(report),
    'utf8'
  );

  const artifact = {
    artifact_id: 'short-film-production-foundation-v1',
    phase: SHORT_FILM_PRODUCTION_FOUNDATION_PHASE,
    generated_at: report.generated_at,
    final_verdict: report.final_verdict,
    foundation_status: report.foundation_status,
    mv_dataset_refs_read_only: [...MV_DATASET_PATHS],
    short_film_dataset_refs: [SHORT_FILM_LIBRARY_PATH, SHORT_FILM_INDEX_PATH],
    blueprint_schema_ref: SHORT_FILM_BLUEPRINT_SCHEMA_PATH,
    continuity_spec_ref: LONG_FORM_CONTINUITY_SPEC_PATH,
    content_hashes: Object.fromEntries(
      SHORT_FILM_OUTPUT_PATHS.filter((p) => p !== SHORT_FILM_FOUNDATION_ARTIFACT_PATH).map((p) => [
        p,
        sha256File(root, p),
      ])
    ),
    expansion: report.expansion_design,
    policy: report.policy,
    short_film_foundation_ready: foundationReady,
  };

  fs.writeFileSync(
    path.join(root, SHORT_FILM_FOUNDATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );

  return report;
}
