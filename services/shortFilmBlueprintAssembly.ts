import fs from 'node:fs';
import path from 'node:path';
import { MV_PRODUCTION_READY_CURRENT_STATE_PATH } from './mvProductionReadyBaselineSnapshot.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  LONG_FORM_CONTINUITY_SPEC_PATH,
  SHORT_FILM_FOUNDATION_READY_STATUS,
  SHORT_FILM_LIBRARY_PATH,
  SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT,
  SHORT_FILM_PRODUCTION_FOUNDATION_PHASE,
  SHORT_FILM_FOUNDATION_REPORT_PATH,
} from './shortFilmProductionFoundation.js';

export const SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE = 'PHASE-L3-002' as const;
export const SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT =
  'PASS_SHORT_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const SHORT_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT =
  'FAIL_SHORT_FILM_BLUEPRINT_ASSEMBLY_V1' as const;
export const SHORT_FILM_BLUEPRINT_READY_STATUS = 'SHORT_FILM_BLUEPRINT_READY' as const;

export const SHORT_FILM_BLUEPRINT_EXPORT_DIR = 'exports/short_film_blueprint' as const;
export const SHORT_FILM_BLUEPRINT_PATH =
  'exports/short_film_blueprint/short-film-blueprint.json' as const;
export const SHORT_FILM_ACT_MAP_PATH =
  'exports/short_film_blueprint/short-film-act-map.json' as const;
export const SHORT_FILM_CONTINUITY_MAP_PATH =
  'exports/short_film_blueprint/short-film-continuity-map.json' as const;

export const SHORT_FILM_BLUEPRINT_ASSEMBLY_DIR = 'reports/short_film_blueprint' as const;
export const SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH =
  'reports/short_film_blueprint/SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_epic_departure',
  'mediterranean_season_arc',
  'letter_across_years',
] as const;

const ACT_DISTRIBUTION = {
  act1_percent: 22,
  act2_percent: 56,
  act3_percent: 22,
} as const;

const CONTINUITY_DIMENSIONS = [
  'character',
  'location',
  'lighting',
  'relationship',
  'timeline',
  'memory_callback',
] as const;

type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface ArchetypeRecord {
  short_film_archetype_id: string;
  theme: string;
  scene_count_range: string;
  act_structure: {
    act_count: number;
    acts: { act_index: number; act_name: string; scene_range: string; turning_point?: string }[];
  };
  story_arc: Record<string, unknown>;
  character_arc: Record<string, unknown>;
  location_arc: Record<string, unknown>;
  emotional_arc: Record<string, unknown>;
  callback_system: {
    memory_anchors: string[];
    callback_rules: string[];
    foreshadow_payoff_pairs: {
      foreshadow_scene: number;
      payoff_scene: number;
      anchor_id: string;
    }[];
  };
  continuity_requirements: Record<string, string[]>;
  scene_blueprints: Record<string, unknown>[];
}

interface ActDistributionEntry {
  act_index: number;
  act_name: string;
  percent: number;
  scene_count: number;
  scene_range: string;
}

interface MemoryCallbackEntry {
  anchor_id: string;
  callback_seed: number;
  callback_reference: number | null;
  callback_resolution: number | null;
  callback_completion_state: 'seeded' | 'referenced' | 'resolved' | 'pending';
}

export interface ShortFilmBlueprintAssemblyReport {
  report_id: string;
  phase: typeof SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    short_film_foundation_ready: boolean;
    pass_short_film_foundation_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    production_ready_state_modified: boolean;
    foundation_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    act_structure: number;
    continuity_dimensions: number;
    callback_system: string;
    target_archetypes: string[];
  };
  outputs: {
    blueprint_path: string;
    act_map_path: string;
    continuity_map_path: string;
  };
  issues: AssemblyIssue[];
  short_film_blueprint_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function parseSceneRange(range: string): { min: number; max: number } {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new Error(`Invalid scene range: ${range}`);
  return { min: Number(match[1]), max: Number(match[2]) };
}

function midpointSceneCount(range: string): number {
  const { min, max } = parseSceneRange(range);
  return Math.round((min + max) / 2);
}

function distributeActs(totalScenes: number): ActDistributionEntry[] {
  const act1 = Math.round(totalScenes * (ACT_DISTRIBUTION.act1_percent / 100));
  const act3 = Math.round(totalScenes * (ACT_DISTRIBUTION.act3_percent / 100));
  const act2 = totalScenes - act1 - act3;
  const act1End = act1;
  const act2End = act1 + act2;

  return [
    {
      act_index: 1,
      act_name: 'setup',
      percent: ACT_DISTRIBUTION.act1_percent,
      scene_count: act1,
      scene_range: `1-${act1End}`,
    },
    {
      act_index: 2,
      act_name: 'confrontation',
      percent: ACT_DISTRIBUTION.act2_percent,
      scene_count: act2,
      scene_range: `${act1End + 1}-${act2End}`,
    },
    {
      act_index: 3,
      act_name: 'resolution',
      percent: ACT_DISTRIBUTION.act3_percent,
      scene_count: act3,
      scene_range: `${act2End + 1}-${totalScenes}`,
    },
  ];
}

function buildActTransitionPoints(
  acts: ActDistributionEntry[],
  storyArc: Record<string, unknown>
): { act_boundary: string; scene_index: number; transition_type: string }[] {
  const inciting = Number(storyArc.inciting_incident_scene ?? acts[0].scene_count);
  const midpoint = Number(storyArc.midpoint_scene ?? acts[0].scene_count + Math.floor(acts[1].scene_count / 2));
  const climax = Number(storyArc.climax_scene ?? acts[1].scene_count + acts[0].scene_count);
  const resolution = Number(storyArc.resolution_scene ?? acts[2].scene_count + acts[0].scene_count + acts[1].scene_count);

  const act1End = parseSceneRange(acts[0].scene_range).max;
  const act2End = parseSceneRange(acts[1].scene_range).max;

  return [
    { act_boundary: 'act1_to_act2', scene_index: act1End, transition_type: 'act_break' },
    { act_boundary: 'act2_to_act3', scene_index: act2End, transition_type: 'act_break' },
    { act_boundary: 'inciting_incident', scene_index: inciting, transition_type: 'story_beat' },
    { act_boundary: 'midpoint', scene_index: midpoint, transition_type: 'story_beat' },
    { act_boundary: 'climax', scene_index: climax, transition_type: 'story_beat' },
    { act_boundary: 'resolution', scene_index: resolution, transition_type: 'story_beat' },
  ];
}

function buildLightingArc(
  emotionalArc: Record<string, unknown>,
  sceneBlueprints: Record<string, unknown>[]
): { lighting_flow: string[]; act_lighting_palette: Record<string, string[]> } {
  const lightingFlow = sceneBlueprints
    .map((scene) => String(scene.lighting_dna_id ?? scene.lighting_anchor_id ?? ''))
    .filter(Boolean);

  const actPalettes: Record<string, string[]> = {};
  for (const scene of sceneBlueprints) {
    const actIndex = String(scene.act_index ?? 1);
    const lightingId = String(scene.lighting_dna_id ?? scene.lighting_anchor_id ?? '');
    if (!lightingId) continue;
    actPalettes[actIndex] ??= [];
    if (!actPalettes[actIndex].includes(lightingId)) {
      actPalettes[actIndex].push(lightingId);
    }
  }

  return {
    lighting_flow: lightingFlow.length > 0 ? lightingFlow : ['default_palette'],
    act_lighting_palette: actPalettes,
    emotional_turning_points: emotionalArc.emotional_turning_points ?? [],
  };
}

function buildTimelineArc(
  storyArc: Record<string, unknown>,
  sceneBlueprints: Record<string, unknown>[]
): Record<string, unknown> {
  const markers = sceneBlueprints
    .map((scene) => ({
      scene_index: scene.scene_index,
      timeline_marker: scene.timeline_marker,
    }))
    .filter((entry) => entry.timeline_marker);

  return {
    arc_type: storyArc.arc_type ?? 'linear',
    beats: storyArc.beats ?? [],
    inciting_incident_scene: storyArc.inciting_incident_scene,
    midpoint_scene: storyArc.midpoint_scene,
    climax_scene: storyArc.climax_scene,
    resolution_scene: storyArc.resolution_scene,
    timeline_markers: markers,
  };
}

function buildRelationshipArc(characterArc: Record<string, unknown>): Record<string, unknown> {
  return {
    primary_character_id: characterArc.primary_character_id,
    secondary_character_ids: characterArc.secondary_character_ids ?? [],
    stages: characterArc.stages ?? [],
    stage_count: ((characterArc.stages as unknown[]) ?? []).length,
  };
}

function buildMemoryCallbackArc(
  callbackSystem: ArchetypeRecord['callback_system'],
  totalScenes: number
): MemoryCallbackEntry[] {
  const pairs = callbackSystem.foreshadow_payoff_pairs ?? [];
  const entries: MemoryCallbackEntry[] = [];

  for (const pair of pairs) {
    entries.push({
      anchor_id: pair.anchor_id,
      callback_seed: pair.foreshadow_scene,
      callback_reference: pair.foreshadow_scene,
      callback_resolution: pair.payoff_scene,
      callback_completion_state: pair.payoff_scene <= totalScenes ? 'resolved' : 'pending',
    });
  }

  for (const anchor of callbackSystem.memory_anchors ?? []) {
    const alreadyTracked = entries.some((entry) => entry.anchor_id === anchor);
    if (!alreadyTracked) {
      entries.push({
        anchor_id: anchor,
        callback_seed: 0,
        callback_reference: null,
        callback_resolution: null,
        callback_completion_state: 'pending',
      });
    }
  }

  return entries;
}

function buildCallbackSystemAssembly(
  callbackSystem: ArchetypeRecord['callback_system'],
  memoryCallbackArc: MemoryCallbackEntry[]
): Record<string, unknown> {
  const pairs = callbackSystem.foreshadow_payoff_pairs ?? [];

  const setupEvents = pairs.map((pair) => ({
    event_id: `setup_${pair.anchor_id}`,
    anchor_id: pair.anchor_id,
    scene_index: pair.foreshadow_scene,
    event_type: 'foreshadow',
  }));

  const payoffEvents = pairs.map((pair) => ({
    event_id: `payoff_${pair.anchor_id}`,
    anchor_id: pair.anchor_id,
    scene_index: pair.payoff_scene,
    event_type: 'payoff',
  }));

  const callbackDependencies = pairs.map((pair) => ({
    anchor_id: pair.anchor_id,
    depends_on: `setup_${pair.anchor_id}`,
    resolves_at: `payoff_${pair.anchor_id}`,
    scene_gap: pair.payoff_scene - pair.foreshadow_scene,
  }));

  const resolvedCount = memoryCallbackArc.filter(
    (entry) => entry.callback_completion_state === 'resolved'
  ).length;
  const totalCount = memoryCallbackArc.length;
  const callbackCompletionRatio = totalCount > 0 ? resolvedCount / totalCount : 1;

  return {
    enabled: true,
    memory_anchors: callbackSystem.memory_anchors,
    callback_rules: callbackSystem.callback_rules,
    setup_events: setupEvents,
    payoff_events: payoffEvents,
    callback_dependencies: callbackDependencies,
    callback_completion_ratio: Number(callbackCompletionRatio.toFixed(4)),
    callback_completion_percent: Math.round(callbackCompletionRatio * 100),
    foreshadow_payoff_pairs: pairs,
  };
}

function buildContinuityMapEntry(
  archetype: ArchetypeRecord,
  memoryCallbackArc: MemoryCallbackEntry[],
  lightingArc: Record<string, unknown>
): Record<string, unknown> {
  const requirements = archetype.continuity_requirements;

  return {
    short_film_archetype_id: archetype.short_film_archetype_id,
    dimensions: {
      character: {
        dimension: 'character',
        rules: requirements.character_continuity ?? [],
        arc_ref: archetype.character_arc,
        checkpoint_interval_scenes: 25,
      },
      location: {
        dimension: 'location',
        rules: requirements.location_continuity ?? [],
        arc_ref: archetype.location_arc,
        reentry_locations: (archetype.location_arc.reentry_locations as string[]) ?? [],
      },
      lighting: {
        dimension: 'lighting',
        rules: requirements.lighting_continuity ?? [],
        arc_ref: lightingArc,
      },
      relationship: {
        dimension: 'relationship',
        rules: requirements.relationship_continuity ?? [],
        arc_ref: buildRelationshipArc(archetype.character_arc),
      },
      timeline: {
        dimension: 'timeline',
        rules: requirements.timeline_continuity ?? [],
        arc_ref: buildTimelineArc(archetype.story_arc, archetype.scene_blueprints),
      },
      memory_callback: {
        dimension: 'memory_callback',
        rules: archetype.callback_system.callback_rules,
        arc_ref: memoryCallbackArc,
        completion_states: memoryCallbackArc.map((entry) => entry.callback_completion_state),
      },
    },
  };
}

function assembleBlueprint(archetype: ArchetypeRecord): Record<string, unknown> {
  const totalScenes = midpointSceneCount(archetype.scene_count_range);
  const actDistribution = distributeActs(totalScenes);
  const actTransitionPoints = buildActTransitionPoints(actDistribution, archetype.story_arc);
  const lightingArc = buildLightingArc(archetype.emotional_arc, archetype.scene_blueprints);
  const memoryCallbackArc = buildMemoryCallbackArc(archetype.callback_system, totalScenes);
  const callbackSystemAssembly = buildCallbackSystemAssembly(
    archetype.callback_system,
    memoryCallbackArc
  );

  return {
    short_film_archetype_id: archetype.short_film_archetype_id,
    theme: archetype.theme,
    scene_count_target: totalScenes,
    scene_count_range: archetype.scene_count_range,
    act_structure: {
      act_count: 3,
      act_distribution: ACT_DISTRIBUTION,
      act_scene_count: actDistribution.map((act) => ({
        act_index: act.act_index,
        scene_count: act.scene_count,
        percent: act.percent,
      })),
      act_transition_points: actTransitionPoints,
      acts: actDistribution,
    },
    story_arc: archetype.story_arc,
    character_arc: archetype.character_arc,
    location_arc: archetype.location_arc,
    lighting_arc: lightingArc,
    emotional_arc: archetype.emotional_arc,
    relationship_arc: buildRelationshipArc(archetype.character_arc),
    timeline_arc: buildTimelineArc(archetype.story_arc, archetype.scene_blueprints),
    memory_callback_arc: memoryCallbackArc,
    callback_system: callbackSystemAssembly,
    continuity_requirements: archetype.continuity_requirements,
    scene_blueprints: archetype.scene_blueprints,
    assembly_metadata: {
      phase: SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE,
      foundation_phase: SHORT_FILM_PRODUCTION_FOUNDATION_PHASE,
      foundation_library_ref: SHORT_FILM_LIBRARY_PATH,
      continuity_spec_ref: LONG_FORM_CONTINUITY_SPEC_PATH,
    },
  };
}

function runPrecheck(root: string): {
  short_film_foundation_ready: boolean;
  pass_short_film_foundation_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, SHORT_FILM_FOUNDATION_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'FOUNDATION_REPORT_MISSING',
      message: `Missing foundation report at ${SHORT_FILM_FOUNDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      short_film_foundation_ready: false,
      pass_short_film_foundation_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const foundationReport = readJson<Record<string, unknown>>(root, SHORT_FILM_FOUNDATION_REPORT_PATH);
  const foundationStatus = String(foundationReport.foundation_status ?? '');
  const foundationVerdict = String(foundationReport.final_verdict ?? '');

  const short_film_foundation_ready = foundationStatus === SHORT_FILM_FOUNDATION_READY_STATUS;
  const pass_short_film_foundation_v1 =
    foundationVerdict === SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT;

  if (!short_film_foundation_ready) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: `Expected foundation_status=${SHORT_FILM_FOUNDATION_READY_STATUS}, got ${foundationStatus}`,
      severity: 'error',
    });
  }
  if (!pass_short_film_foundation_v1) {
    issues.push({
      code: 'FOUNDATION_VERDICT_FAIL',
      message: `Expected final_verdict=${SHORT_FILM_PRODUCTION_FOUNDATION_PASS_VERDICT}, got ${foundationVerdict}`,
      severity: 'error',
    });
  }

  return {
    short_film_foundation_ready,
    pass_short_film_foundation_v1,
    precheck_passed: short_film_foundation_ready && pass_short_film_foundation_v1,
    issues,
  };
}

function validateAssemblyOutputs(
  blueprints: Record<string, unknown>[],
  actMap: Record<string, unknown>,
  continuityMap: Record<string, unknown>
): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  if (blueprints.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'BLUEPRINT_COUNT_MISMATCH',
      message: `Expected ${TARGET_ARCHETYPE_IDS.length} blueprints, got ${blueprints.length}`,
      severity: 'error',
    });
  }

  for (const blueprint of blueprints) {
    const id = String(blueprint.short_film_archetype_id ?? 'unknown');
    const actStructure = blueprint.act_structure as Record<string, unknown> | undefined;

    if (!actStructure || actStructure.act_count !== 3) {
      issues.push({
        code: 'ACT_STRUCTURE_INVALID',
        message: `${id}: act_structure.act_count must be 3`,
        severity: 'error',
      });
    }

    for (const field of ['act_distribution', 'act_scene_count', 'act_transition_points']) {
      if (!actStructure?.[field]) {
        issues.push({
          code: 'MISSING_ACT_FIELD',
          message: `${id}: act_structure.${field} is required`,
          severity: 'error',
        });
      }
    }

    const distribution = actStructure?.act_distribution as Record<string, number> | undefined;
    if (distribution) {
      const { act1_percent, act2_percent, act3_percent } = distribution;
      if (act1_percent < 20 || act1_percent > 25) {
        issues.push({
          code: 'ACT1_PERCENT_OUT_OF_RANGE',
          message: `${id}: act1_percent must be 20-25, got ${act1_percent}`,
          severity: 'error',
        });
      }
      if (act2_percent < 50 || act2_percent > 60) {
        issues.push({
          code: 'ACT2_PERCENT_OUT_OF_RANGE',
          message: `${id}: act2_percent must be 50-60, got ${act2_percent}`,
          severity: 'error',
        });
      }
      if (act3_percent < 20 || act3_percent > 25) {
        issues.push({
          code: 'ACT3_PERCENT_OUT_OF_RANGE',
          message: `${id}: act3_percent must be 20-25, got ${act3_percent}`,
          severity: 'error',
        });
      }
    }

    const memoryArc = blueprint.memory_callback_arc as MemoryCallbackEntry[] | undefined;
    if (!memoryArc || memoryArc.length === 0) {
      issues.push({
        code: 'MISSING_MEMORY_CALLBACK_ARC',
        message: `${id}: memory_callback_arc is required`,
        severity: 'error',
      });
    } else {
      for (const entry of memoryArc) {
        for (const field of [
          'callback_seed',
          'callback_reference',
          'callback_resolution',
          'callback_completion_state',
        ] as const) {
          if (!(field in entry)) {
            issues.push({
              code: 'MISSING_CALLBACK_FIELD',
              message: `${id}: memory_callback_arc entry missing ${field}`,
              severity: 'error',
            });
          }
        }
      }
    }

    const callbackSystem = blueprint.callback_system as Record<string, unknown> | undefined;
    if (!callbackSystem?.enabled) {
      issues.push({
        code: 'CALLBACK_SYSTEM_DISABLED',
        message: `${id}: callback_system must be enabled`,
        severity: 'error',
      });
    }
    for (const field of [
      'setup_events',
      'payoff_events',
      'callback_dependencies',
      'callback_completion_ratio',
    ]) {
      const value = callbackSystem?.[field];
      const missing =
        value === undefined ||
        value === null ||
        (field !== 'callback_completion_ratio' && Array.isArray(value) && value.length === 0);
      if (missing) {
        issues.push({
          code: 'MISSING_CALLBACK_SYSTEM_FIELD',
          message: `${id}: callback_system.${field} is required`,
          severity: 'error',
        });
      }
    }
  }

  const actEntries = (actMap.archetypes as unknown[]) ?? [];
  if (actEntries.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'ACT_MAP_COUNT_MISMATCH',
      message: `act-map expected ${TARGET_ARCHETYPE_IDS.length} archetypes`,
      severity: 'error',
    });
  }

  const continuityEntries = (continuityMap.archetypes as unknown[]) ?? [];
  if (continuityEntries.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'CONTINUITY_MAP_COUNT_MISMATCH',
      message: `continuity-map expected ${TARGET_ARCHETYPE_IDS.length} archetypes`,
      severity: 'error',
    });
  }

  for (const entry of continuityEntries) {
    const dimensions = (entry as Record<string, unknown>).dimensions as Record<string, unknown>;
    if (!dimensions || Object.keys(dimensions).length !== CONTINUITY_DIMENSIONS.length) {
      issues.push({
        code: 'CONTINUITY_DIMENSION_COUNT_INVALID',
        message: `Expected ${CONTINUITY_DIMENSIONS.length} continuity dimensions per archetype`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function writeShortFilmBlueprintAssembly(
  projectRoot?: string
): ShortFilmBlueprintAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const library = readJson<{ archetypes: ArchetypeRecord[] }>(root, SHORT_FILM_LIBRARY_PATH);
  const archetypes = library.archetypes.filter((archetype) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(archetype.short_film_archetype_id)
  );

  if (archetypes.length !== TARGET_ARCHETYPE_IDS.length) {
    const found = archetypes.map((a) => a.short_film_archetype_id);
    const missing = TARGET_ARCHETYPE_IDS.filter((id) => !found.includes(id));
    issues.push({
      code: 'TARGET_ARCHETYPE_MISSING',
      message: `Missing target archetypes: ${missing.join(', ')}`,
      severity: 'error',
    });
  }

  const assembledBlueprints = archetypes.map(assembleBlueprint);

  const actMap = {
    map_id: 'short-film-act-map-v1',
    phase: SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    act_structure: 3,
    act_distribution: ACT_DISTRIBUTION,
    archetypes: assembledBlueprints.map((blueprint) => {
      const actStructure = blueprint.act_structure as Record<string, unknown>;
      return {
        short_film_archetype_id: blueprint.short_film_archetype_id,
        scene_count_target: blueprint.scene_count_target,
        act_distribution: actStructure.act_distribution,
        act_scene_count: actStructure.act_scene_count,
        act_transition_points: actStructure.act_transition_points,
        acts: actStructure.acts,
      };
    }),
  };

  const continuityMap = {
    map_id: 'short-film-continuity-map-v1',
    phase: SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    continuity_dimensions: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: assembledBlueprints.map((blueprint) => {
      const archetype = archetypes.find(
        (a) => a.short_film_archetype_id === blueprint.short_film_archetype_id
      )!;
      const memoryCallbackArc = blueprint.memory_callback_arc as MemoryCallbackEntry[];
      const lightingArc = blueprint.lighting_arc as Record<string, unknown>;
      return buildContinuityMapEntry(archetype, memoryCallbackArc, lightingArc);
    }),
  };

  const blueprintArtifact = {
    artifact_id: 'short-film-blueprint-v1',
    phase: SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    foundation_ref: SHORT_FILM_FOUNDATION_REPORT_PATH,
    foundation_library_ref: SHORT_FILM_LIBRARY_PATH,
    archetype_count: assembledBlueprints.length,
    act_structure: 3,
    continuity_dimensions: CONTINUITY_DIMENSIONS.length,
    callback_system: 'ENABLED',
    blueprints: assembledBlueprints,
  };

  issues.push(...validateAssemblyOutputs(assembledBlueprints, actMap, continuityMap));

  const errors = issues.filter((issue) => issue.severity === 'error');
  const assemblyReady = precheck.precheck_passed && errors.length === 0;

  const report: ShortFilmBlueprintAssemblyReport = {
    report_id: 'short-film-blueprint-assembly-report-v1',
    phase: SHORT_FILM_BLUEPRINT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT
      : SHORT_FILM_BLUEPRINT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? SHORT_FILM_BLUEPRINT_READY_STATUS : 'SHORT_FILM_BLUEPRINT_INCOMPLETE',
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      production_ready_state_modified: false,
      foundation_artifacts_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: assembledBlueprints.length,
      act_structure: 3,
      continuity_dimensions: CONTINUITY_DIMENSIONS.length,
      callback_system: 'ENABLED',
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      blueprint_path: SHORT_FILM_BLUEPRINT_PATH,
      act_map_path: SHORT_FILM_ACT_MAP_PATH,
      continuity_map_path: SHORT_FILM_CONTINUITY_MAP_PATH,
    },
    issues,
    short_film_blueprint_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, SHORT_FILM_BLUEPRINT_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, SHORT_FILM_BLUEPRINT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, SHORT_FILM_BLUEPRINT_PATH),
    `${JSON.stringify(blueprintArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_ACT_MAP_PATH),
    `${JSON.stringify(actMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_CONTINUITY_MAP_PATH),
    `${JSON.stringify(continuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
