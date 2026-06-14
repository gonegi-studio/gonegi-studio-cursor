import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_BLUEPRINT_PATH,
  SHORT_FILM_BLUEPRINT_READY_STATUS,
} from './shortFilmBlueprintAssembly.js';

export const SHORT_FILM_SCENE_ASSEMBLY_PHASE = 'PHASE-L3-003' as const;
export const SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT = 'PASS_SHORT_FILM_SCENE_ASSEMBLY_V1' as const;
export const SHORT_FILM_SCENE_ASSEMBLY_FAIL_VERDICT = 'FAIL_SHORT_FILM_SCENE_ASSEMBLY_V1' as const;
export const SHORT_FILM_SCENE_READY_STATUS = 'SHORT_FILM_SCENE_READY' as const;

export const SHORT_FILM_SCENE_ASSEMBLY_EXPORT_DIR = 'exports/short_film_scene_assembly' as const;
export const SHORT_FILM_SCENE_SEQUENCE_PATH =
  'exports/short_film_scene_assembly/short-film-scene-sequence.json' as const;
export const SHORT_FILM_SCENE_REGISTRY_PATH =
  'exports/short_film_scene_assembly/short-film-scene-registry.json' as const;
export const SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH =
  'exports/short_film_scene_assembly/short-film-scene-dependency-graph.json' as const;
export const SHORT_FILM_SCENE_CONTINUITY_MAP_PATH =
  'exports/short_film_scene_assembly/short-film-scene-continuity-map.json' as const;

export const SHORT_FILM_SCENE_ASSEMBLY_DIR = 'reports/short_film_scene_assembly' as const;
export const SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH =
  'reports/short_film_scene_assembly/SHORT_FILM_SCENE_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_epic_departure',
  'mediterranean_season_arc',
  'letter_across_years',
] as const;

const CONTINUITY_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
  'relationship_arc',
  'timeline_arc',
  'memory_callback_arc',
] as const;

const DEPENDENCY_DIMENSIONS = [
  'scene_predecessor',
  'scene_successor',
  'callback_dependency',
  'arc_dependency',
  'timeline_dependency',
] as const;

const REQUIRED_REGISTRY_FIELDS = [
  'scene_id',
  'act_id',
  'timeline_position',
  'callback_refs',
  'continuity_refs',
  'scene_goal',
  'character_id',
  'location_id',
  'lighting_anchor_id',
  'emotion_id',
] as const;

const SCENE_COUNT_MIN = 50;
const SCENE_COUNT_MAX = 300;
const LONG_RANGE_DEPENDENCY_MIN_GAP = 20;

type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface BlueprintRecord {
  short_film_archetype_id: string;
  theme: string;
  scene_count_target: number;
  scene_count_range: string;
  act_structure: {
    acts: { act_index: number; act_name: string; scene_count: number; scene_range: string }[];
    act_distribution: { act1_percent: number; act2_percent: number; act3_percent: number };
  };
  story_arc: Record<string, unknown>;
  character_arc: Record<string, unknown>;
  location_arc: { location_flow: string[]; reentry_locations?: string[] };
  lighting_arc: {
    lighting_flow: string[];
    act_lighting_palette: Record<string, string[]>;
  };
  emotional_arc: { emotion_flow: string[] };
  relationship_arc: { primary_character_id: string; stages: string[] };
  timeline_arc: Record<string, unknown>;
  memory_callback_arc: {
    anchor_id: string;
    callback_seed: number;
    callback_reference: number | null;
    callback_resolution: number | null;
    callback_completion_state: string;
  }[];
  callback_system: {
    setup_events: { anchor_id: string; scene_index: number }[];
    payoff_events: { anchor_id: string; scene_index: number }[];
  };
  scene_blueprints: Record<string, unknown>[];
}

interface SceneRecord {
  scene_id: string;
  scene_index: number;
  act_id: number;
  timeline_position: number;
  callback_refs: string[];
  continuity_refs: Record<string, string>;
  scene_goal: string;
  character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  emotion_id: string;
  extension_slot: {
    medium_film_tier: 'short_film_v1';
    sequence_block_id: string;
    expandable: boolean;
  };
}

interface DependencyNode {
  scene_id: string;
  scene_index: number;
  scene_predecessor: string | null;
  scene_successor: string | null;
  callback_dependency: { anchor_id: string; dependency_type: string; target_scene_index: number }[];
  arc_dependency: { arc_type: string; source_scene_index: number; dependency_type: string }[];
  timeline_dependency: { marker: string; source_scene_index: number | null; dependency_type: string }[];
}

export interface ShortFilmSceneAssemblyReport {
  report_id: string;
  phase: typeof SHORT_FILM_SCENE_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    short_film_blueprint_ready: boolean;
    pass_short_film_blueprint_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    production_ready_state_modified: boolean;
    blueprint_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    total_scene_count: number;
    dependency_dimensions: number;
    continuity_dimensions: number;
    registry_ready: boolean;
    medium_film_extension_ready: boolean;
    target_archetypes: string[];
  };
  outputs: {
    scene_sequence_path: string;
    scene_registry_path: string;
    scene_dependency_graph_path: string;
    scene_continuity_map_path: string;
  };
  issues: AssemblyIssue[];
  short_film_scene_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function pickCyclic<T>(items: T[], index: number): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array');
  return items[(index - 1) % items.length];
}

function parseSceneRangeEnd(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new Error(`Invalid scene range: ${range}`);
  return Number(match[2]);
}

function getActId(sceneIndex: number, acts: BlueprintRecord['act_structure']['acts']): number {
  for (const act of acts) {
    const end = parseSceneRangeEnd(act.scene_range);
    const start = end - act.scene_count + 1;
    if (sceneIndex >= start && sceneIndex <= end) return act.act_index;
  }
  return acts[acts.length - 1]?.act_index ?? 3;
}

function lightingAnchorFromDna(dnaId: string): string {
  if (dnaId.includes('anchor')) return dnaId;
  const mapping: Record<string, string> = {
    morning_harbor_dock: 'midday_harbor_clear_01',
    sunrise_bakery_window: 'sunrise_window_soft_01',
    evening_harbor_dock: 'golden_hour_harbor_01',
    autumn_harbor_return: 'golden_hour_harbor_01',
    winter_bakery_interior: 'morning_bakery_glow_01',
    summer_festival_lane: 'midday_harbor_clear_01',
  };
  return mapping[dnaId] ?? `${dnaId}_anchor_01`;
}

function buildSceneId(archetypeId: string, sceneIndex: number): string {
  return `${archetypeId}_scene_${String(sceneIndex).padStart(3, '0')}`;
}

function buildCallbackRefs(
  sceneIndex: number,
  memoryCallbackArc: BlueprintRecord['memory_callback_arc']
): string[] {
  const refs: string[] = [];
  for (const entry of memoryCallbackArc) {
    if (entry.callback_seed === sceneIndex) refs.push(`seed:${entry.anchor_id}`);
    if (entry.callback_reference === sceneIndex) refs.push(`reference:${entry.anchor_id}`);
    if (entry.callback_resolution === sceneIndex) refs.push(`resolution:${entry.anchor_id}`);
  }
  return refs;
}

function buildContinuityRefs(
  blueprint: BlueprintRecord,
  sceneIndex: number,
  actId: number
): Record<string, string> {
  const stages = (blueprint.relationship_arc.stages as string[]) ?? [];
  const stageIndex = Math.min(
    stages.length - 1,
    Math.floor(((sceneIndex - 1) / blueprint.scene_count_target) * stages.length)
  );
  const locationFlow = blueprint.location_arc.location_flow ?? [];
  const emotionFlow = blueprint.emotional_arc.emotion_flow ?? [];
  const lightingPalette = blueprint.lighting_arc.act_lighting_palette[String(actId)] ?? [];
  const memoryEntry = blueprint.memory_callback_arc.find(
    (entry) =>
      entry.callback_seed === sceneIndex ||
      entry.callback_reference === sceneIndex ||
      entry.callback_resolution === sceneIndex
  );

  return {
    character_arc: String(blueprint.character_arc.primary_character_id ?? 'gonegi'),
    location_arc: pickCyclic(locationFlow, sceneIndex),
    lighting_arc: pickCyclic(
      lightingPalette.length > 0 ? lightingPalette : blueprint.lighting_arc.lighting_flow,
      sceneIndex
    ),
    relationship_arc: stages[stageIndex] ?? 'neutral',
    timeline_arc: `position_${sceneIndex}_of_${blueprint.scene_count_target}`,
    memory_callback_arc: memoryEntry?.anchor_id ?? 'none',
  };
}

function generateScene(
  blueprint: BlueprintRecord,
  sceneIndex: number,
  anchorByIndex: Map<number, Record<string, unknown>>
): SceneRecord {
  const actId = getActId(sceneIndex, blueprint.act_structure.acts);
  const sceneId = buildSceneId(blueprint.short_film_archetype_id, sceneIndex);
  const anchor = anchorByIndex.get(sceneIndex);
  const continuityRefs = buildContinuityRefs(blueprint, sceneIndex, actId);
  const callbackRefs = buildCallbackRefs(sceneIndex, blueprint.memory_callback_arc);

  const characterId = String(
    anchor?.character_id ?? blueprint.relationship_arc.primary_character_id ?? 'gonegi'
  );
  const locationId = String(anchor?.location_id ?? continuityRefs.location_arc);
  const lightingDna = String(anchor?.lighting_dna_id ?? continuityRefs.lighting_arc);
  const lightingAnchorId = String(
    anchor?.lighting_anchor_id ?? lightingAnchorFromDna(lightingDna)
  );
  const emotionId = String(
    anchor?.emotion_id ?? pickCyclic(blueprint.emotional_arc.emotion_flow, sceneIndex)
  );
  const act = blueprint.act_structure.acts.find((entry) => entry.act_index === actId);
  const sceneGoal = String(
    anchor?.scene_goal ??
      `${act?.act_name ?? 'act'} progression scene ${sceneIndex} — ${continuityRefs.relationship_arc}`
  );

  return {
    scene_id: sceneId,
    scene_index: sceneIndex,
    act_id: actId,
    timeline_position: Number((sceneIndex / blueprint.scene_count_target).toFixed(4)),
    callback_refs: callbackRefs,
    continuity_refs: continuityRefs,
    scene_goal: sceneGoal,
    character_id: characterId,
    location_id: locationId,
    lighting_anchor_id: lightingAnchorId,
    emotion_id: emotionId,
    extension_slot: {
      medium_film_tier: 'short_film_v1',
      sequence_block_id: `${blueprint.short_film_archetype_id}_act${actId}_block`,
      expandable: true,
    },
  };
}

function buildDependencyNode(
  blueprint: BlueprintRecord,
  scene: SceneRecord,
  totalScenes: number
): DependencyNode {
  const callbackDeps: DependencyNode['callback_dependency'] = [];
  for (const entry of blueprint.memory_callback_arc) {
    if (entry.callback_seed === scene.scene_index && entry.callback_resolution) {
      callbackDeps.push({
        anchor_id: entry.anchor_id,
        dependency_type: 'memory_callback_seed_to_resolution',
        target_scene_index: entry.callback_resolution,
      });
    }
    if (entry.callback_resolution === scene.scene_index && entry.callback_seed > 0) {
      callbackDeps.push({
        anchor_id: entry.anchor_id,
        dependency_type: 'memory_callback_resolution_from_seed',
        target_scene_index: entry.callback_seed,
      });
    }
  }

  const arcDeps: DependencyNode['arc_dependency'] = [];
  const storyArc = blueprint.story_arc;
  const beatScenes: { key: string; scene: number }[] = [
    { key: 'inciting_incident', scene: Number(storyArc.inciting_incident_scene ?? 0) },
    { key: 'midpoint', scene: Number(storyArc.midpoint_scene ?? 0) },
    { key: 'climax', scene: Number(storyArc.climax_scene ?? 0) },
    { key: 'resolution', scene: Number(storyArc.resolution_scene ?? 0) },
  ];
  for (const beat of beatScenes) {
    if (beat.scene > 0 && beat.scene !== scene.scene_index) {
      const gap = Math.abs(scene.scene_index - beat.scene);
      if (gap > 0 && gap <= LONG_RANGE_DEPENDENCY_MIN_GAP + 80) {
        arcDeps.push({
          arc_type: beat.key,
          source_scene_index: beat.scene,
          dependency_type:
            gap >= LONG_RANGE_DEPENDENCY_MIN_GAP
              ? 'character_arc_dependency'
              : 'story_beat_proximity',
        });
      }
    }
  }

  const timelineDeps: DependencyNode['timeline_dependency'] = [];
  const markers = (blueprint.timeline_arc.timeline_markers as { scene_index: number; timeline_marker: string }[]) ?? [];
  const priorMarker = markers
    .filter((marker) => marker.scene_index < scene.scene_index)
    .sort((a, b) => b.scene_index - a.scene_index)[0];
  if (priorMarker) {
    timelineDeps.push({
      marker: priorMarker.timeline_marker,
      source_scene_index: priorMarker.scene_index,
      dependency_type:
        scene.scene_index - priorMarker.scene_index >= LONG_RANGE_DEPENDENCY_MIN_GAP
          ? 'timeline_dependency'
          : 'timeline_marker_chain',
    });
  } else {
    timelineDeps.push({
      marker: 'sequence_start',
      source_scene_index: null,
      dependency_type: 'timeline_origin',
    });
  }

  return {
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    scene_predecessor:
      scene.scene_index > 1
        ? buildSceneId(blueprint.short_film_archetype_id, scene.scene_index - 1)
        : null,
    scene_successor:
      scene.scene_index < totalScenes
        ? buildSceneId(blueprint.short_film_archetype_id, scene.scene_index + 1)
        : null,
    callback_dependency: callbackDeps,
    arc_dependency: arcDeps,
    timeline_dependency: timelineDeps,
  };
}

function buildLongRangeDependencies(
  blueprint: BlueprintRecord,
  nodes: DependencyNode[]
): { from_scene_index: number; to_scene_index: number; dependency_types: string[] }[] {
  const longRange: { from_scene_index: number; to_scene_index: number; dependency_types: string[] }[] =
    [];

  for (const node of nodes) {
    for (const callbackDep of node.callback_dependency) {
      const gap = Math.abs(node.scene_index - callbackDep.target_scene_index);
      if (gap >= LONG_RANGE_DEPENDENCY_MIN_GAP) {
        longRange.push({
          from_scene_index: node.scene_index,
          to_scene_index: callbackDep.target_scene_index,
          dependency_types: ['memory_callback_dependency', 'callback_dependency'],
        });
      }
    }
    for (const arcDep of node.arc_dependency) {
      const gap = Math.abs(node.scene_index - arcDep.source_scene_index);
      if (gap >= LONG_RANGE_DEPENDENCY_MIN_GAP) {
        longRange.push({
          from_scene_index: node.scene_index,
          to_scene_index: arcDep.source_scene_index,
          dependency_types: ['character_arc_dependency', 'arc_dependency'],
        });
      }
    }
    for (const timelineDep of node.timeline_dependency) {
      if (timelineDep.source_scene_index === null) continue;
      const gap = Math.abs(node.scene_index - timelineDep.source_scene_index);
      if (gap >= LONG_RANGE_DEPENDENCY_MIN_GAP) {
        longRange.push({
          from_scene_index: node.scene_index,
          to_scene_index: timelineDep.source_scene_index,
          dependency_types: ['timeline_dependency'],
        });
      }
    }
  }

  return longRange;
}

function assembleArchetypeScenes(blueprint: BlueprintRecord): {
  scenes: SceneRecord[];
  dependencyNodes: DependencyNode[];
  continuityEntries: Record<string, unknown>[];
} {
  const totalScenes = blueprint.scene_count_target;
  const anchorByIndex = new Map<number, Record<string, unknown>>();
  for (const anchor of blueprint.scene_blueprints) {
    const index = Number(anchor.scene_index);
    if (index > 0 && index <= totalScenes) anchorByIndex.set(index, anchor);
  }

  const scenes: SceneRecord[] = [];
  for (let sceneIndex = 1; sceneIndex <= totalScenes; sceneIndex += 1) {
    scenes.push(generateScene(blueprint, sceneIndex, anchorByIndex));
  }

  const dependencyNodes = scenes.map((scene) => buildDependencyNode(blueprint, scene, totalScenes));
  const continuityEntries = scenes.map((scene) => ({
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    act_id: scene.act_id,
    continuity_linkage: scene.continuity_refs,
    dimensions: CONTINUITY_DIMENSIONS.map((dimension) => ({
      dimension,
      ref: scene.continuity_refs[dimension],
    })),
  }));

  return { scenes, dependencyNodes, continuityEntries };
}

function runPrecheck(root: string): {
  short_film_blueprint_ready: boolean;
  pass_short_film_blueprint_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'BLUEPRINT_REPORT_MISSING',
      message: `Missing blueprint report at ${SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      short_film_blueprint_ready: false,
      pass_short_film_blueprint_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const blueprintReport = readJson<Record<string, unknown>>(root, SHORT_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);
  const status = String(blueprintReport.status ?? '');
  const verdict = String(blueprintReport.final_verdict ?? '');

  const short_film_blueprint_ready = status === SHORT_FILM_BLUEPRINT_READY_STATUS;
  const pass_short_film_blueprint_assembly_v1 =
    verdict === SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT;

  if (!short_film_blueprint_ready) {
    issues.push({
      code: 'BLUEPRINT_NOT_READY',
      message: `Expected status=${SHORT_FILM_BLUEPRINT_READY_STATUS}, got ${status}`,
      severity: 'error',
    });
  }
  if (!pass_short_film_blueprint_assembly_v1) {
    issues.push({
      code: 'BLUEPRINT_VERDICT_FAIL',
      message: `Expected final_verdict=${SHORT_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}, got ${verdict}`,
      severity: 'error',
    });
  }

  return {
    short_film_blueprint_ready,
    pass_short_film_blueprint_assembly_v1,
    precheck_passed: short_film_blueprint_ready && pass_short_film_blueprint_assembly_v1,
    issues,
  };
}

function validateOutputs(
  archetypeResults: {
    archetypeId: string;
    scenes: SceneRecord[];
    dependencyNodes: DependencyNode[];
    continuityEntries: Record<string, unknown>[];
    actDistribution: BlueprintRecord['act_structure']['act_distribution'];
  }[]
): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  if (archetypeResults.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'ARCHETYPE_COUNT_MISMATCH',
      message: `Expected ${TARGET_ARCHETYPE_IDS.length} archetypes`,
      severity: 'error',
    });
  }

  for (const result of archetypeResults) {
    const { archetypeId, scenes, actDistribution } = result;
    const total = scenes.length;

    if (total < SCENE_COUNT_MIN || total > SCENE_COUNT_MAX) {
      issues.push({
        code: 'SCENE_COUNT_OUT_OF_RANGE',
        message: `${archetypeId}: scene count ${total} must be ${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        severity: 'error',
      });
    }

    const actCounts = [0, 0, 0];
    for (const scene of scenes) {
      actCounts[scene.act_id - 1] += 1;
    }
    const act1Pct = Math.round((actCounts[0] / total) * 100);
    const act2Pct = Math.round((actCounts[1] / total) * 100);
    const act3Pct = Math.round((actCounts[2] / total) * 100);

    if (act1Pct < 20 || act1Pct > 25) {
      issues.push({
        code: 'ACT1_PERCENT_OUT_OF_RANGE',
        message: `${archetypeId}: act1 ${act1Pct}% outside 20-25%`,
        severity: 'error',
      });
    }
    if (act2Pct < 50 || act2Pct > 60) {
      issues.push({
        code: 'ACT2_PERCENT_OUT_OF_RANGE',
        message: `${archetypeId}: act2 ${act2Pct}% outside 50-60%`,
        severity: 'error',
      });
    }
    if (act3Pct < 20 || act3Pct > 25) {
      issues.push({
        code: 'ACT3_PERCENT_OUT_OF_RANGE',
        message: `${archetypeId}: act3 ${act3Pct}% outside 20-25%`,
        severity: 'error',
      });
    }

    if (
      actDistribution.act1_percent !== act1Pct &&
      Math.abs(actDistribution.act1_percent - act1Pct) > 1
    ) {
      issues.push({
        code: 'ACT_DISTRIBUTION_DRIFT',
        message: `${archetypeId}: act distribution drift from blueprint`,
        severity: 'warning',
      });
    }

    for (const scene of scenes) {
      for (const field of REQUIRED_REGISTRY_FIELDS) {
        if (!(field in scene)) {
          issues.push({
            code: 'MISSING_REGISTRY_FIELD',
            message: `${scene.scene_id}: missing ${field}`,
            severity: 'error',
          });
        }
      }
      for (const dimension of CONTINUITY_DIMENSIONS) {
        if (!scene.continuity_refs[dimension]) {
          issues.push({
            code: 'MISSING_CONTINUITY_LINKAGE',
            message: `${scene.scene_id}: missing continuity_refs.${dimension}`,
            severity: 'error',
          });
        }
      }
      if (!scene.extension_slot?.expandable) {
        issues.push({
          code: 'MEDIUM_FILM_EXTENSION_NOT_READY',
          message: `${scene.scene_id}: extension_slot.expandable must be true`,
          severity: 'error',
        });
      }
    }

    for (const node of result.dependencyNodes) {
      for (const dimension of DEPENDENCY_DIMENSIONS) {
        if (!(dimension in node)) {
          issues.push({
            code: 'MISSING_DEPENDENCY_DIMENSION',
            message: `${node.scene_id}: missing ${dimension}`,
            severity: 'error',
          });
        }
      }
    }
  }

  return issues;
}

export function writeShortFilmSceneAssembly(projectRoot?: string): ShortFilmSceneAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const blueprintArtifact = readJson<{ blueprints: BlueprintRecord[] }>(root, SHORT_FILM_BLUEPRINT_PATH);
  const blueprints = blueprintArtifact.blueprints.filter((blueprint) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(blueprint.short_film_archetype_id)
  );

  if (blueprints.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({
      code: 'BLUEPRINT_TARGET_MISSING',
      message: 'Not all target archetypes found in blueprint artifact',
      severity: 'error',
    });
  }

  const archetypeResults = blueprints.map((blueprint) => {
    const assembled = assembleArchetypeScenes(blueprint);
    return {
      archetypeId: blueprint.short_film_archetype_id,
      theme: blueprint.theme,
      scene_count: assembled.scenes.length,
      act_distribution: blueprint.act_structure.act_distribution,
      actDistribution: blueprint.act_structure.act_distribution,
      ...assembled,
    };
  });

  issues.push(...validateOutputs(archetypeResults));

  const totalSceneCount = archetypeResults.reduce((sum, result) => sum + result.scenes.length, 0);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const assemblyReady = precheck.precheck_passed && errors.length === 0;

  const sceneSequence = {
    artifact_id: 'short-film-scene-sequence-v1',
    phase: SHORT_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    blueprint_ref: SHORT_FILM_BLUEPRINT_PATH,
    archetype_count: archetypeResults.length,
    scene_count_range: `${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
    sequences: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
      theme: result.theme,
      scene_count: result.scene_count,
      act_distribution: result.act_distribution,
      scenes: result.scenes.map((scene) => ({
        scene_id: scene.scene_id,
        scene_index: scene.scene_index,
        act_id: scene.act_id,
        timeline_position: scene.timeline_position,
        scene_goal: scene.scene_goal,
        character_id: scene.character_id,
        location_id: scene.location_id,
        lighting_anchor_id: scene.lighting_anchor_id,
        emotion_id: scene.emotion_id,
      })),
    })),
  };

  const sceneRegistry = {
    registry_id: 'short-film-scene-registry-v1',
    phase: SHORT_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    registry_ready: assemblyReady,
    medium_film_extension_ready: true,
    required_fields: [...REQUIRED_REGISTRY_FIELDS],
    entries: archetypeResults.flatMap((result) => result.scenes),
  };

  const sceneDependencyGraph = {
    graph_id: 'short-film-scene-dependency-graph-v1',
    phase: SHORT_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
    dimension_list: [...DEPENDENCY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => {
      const blueprint = blueprints.find((b) => b.short_film_archetype_id === result.archetypeId)!;
      return {
        short_film_archetype_id: result.archetypeId,
        scene_count: result.scenes.length,
        nodes: result.dependencyNodes,
        long_range_dependencies: buildLongRangeDependencies(blueprint, result.dependencyNodes),
      };
    }),
  };

  const sceneContinuityMap = {
    map_id: 'short-film-scene-continuity-map-v1',
    phase: SHORT_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimensions: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
      scene_count: result.scenes.length,
      entries: result.continuityEntries,
    })),
  };

  const report: ShortFilmSceneAssemblyReport = {
    report_id: 'short-film-scene-assembly-report-v1',
    phase: SHORT_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT
      : SHORT_FILM_SCENE_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? SHORT_FILM_SCENE_READY_STATUS : 'SHORT_FILM_SCENE_INCOMPLETE',
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      production_ready_state_modified: false,
      blueprint_artifacts_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: archetypeResults.length,
      total_scene_count: totalSceneCount,
      dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
      continuity_dimensions: CONTINUITY_DIMENSIONS.length,
      registry_ready: assemblyReady,
      medium_film_extension_ready: true,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      scene_sequence_path: SHORT_FILM_SCENE_SEQUENCE_PATH,
      scene_registry_path: SHORT_FILM_SCENE_REGISTRY_PATH,
      scene_dependency_graph_path: SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
      scene_continuity_map_path: SHORT_FILM_SCENE_CONTINUITY_MAP_PATH,
    },
    issues,
    short_film_scene_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, SHORT_FILM_SCENE_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, SHORT_FILM_SCENE_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, SHORT_FILM_SCENE_SEQUENCE_PATH),
    `${JSON.stringify(sceneSequence, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SCENE_REGISTRY_PATH),
    `${JSON.stringify(sceneRegistry, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SCENE_DEPENDENCY_GRAPH_PATH),
    `${JSON.stringify(sceneDependencyGraph, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SCENE_CONTINUITY_MAP_PATH),
    `${JSON.stringify(sceneContinuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
