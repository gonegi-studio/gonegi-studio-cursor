import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  MEDIUM_FILM_ARC_NETWORK_PATH,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_BLUEPRINT_PATH,
  MEDIUM_FILM_BLUEPRINT_READY_STATUS,
} from './mediumFilmBlueprintAssembly.js';

export const MEDIUM_FILM_SCENE_ASSEMBLY_PHASE = 'PHASE-L3-MEDIUM-003' as const;
export const MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT = 'PASS_MEDIUM_FILM_SCENE_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_SCENE_ASSEMBLY_FAIL_VERDICT = 'FAIL_MEDIUM_FILM_SCENE_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_SCENE_READY_STATUS = 'MEDIUM_FILM_SCENE_READY' as const;

export const MEDIUM_FILM_SCENE_ASSEMBLY_EXPORT_DIR = 'exports/medium_film_scene_assembly' as const;
export const MEDIUM_FILM_SCENE_SEQUENCE_PATH =
  'exports/medium_film_scene_assembly/medium-film-scene-sequence.json' as const;
export const MEDIUM_FILM_SCENE_REGISTRY_PATH =
  'exports/medium_film_scene_assembly/medium-film-scene-registry.json' as const;
export const MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH =
  'exports/medium_film_scene_assembly/medium-film-scene-dependency-graph.json' as const;
export const MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH =
  'exports/medium_film_scene_assembly/medium-film-scene-continuity-map.json' as const;
export const MEDIUM_FILM_SCENE_ARC_NETWORK_PATH =
  'exports/medium_film_scene_assembly/medium-film-arc-network.json' as const;

export const MEDIUM_FILM_SCENE_ASSEMBLY_DIR = 'reports/medium_film_scene_assembly' as const;
export const MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH =
  'reports/medium_film_scene_assembly/MEDIUM_FILM_SCENE_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_medium',
  'mediterranean_chronicle_medium',
  'correspondence_saga_medium',
] as const;

const CONTINUITY_DIMENSIONS = [
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

const DEPENDENCY_DIMENSIONS = [
  'scene_predecessor',
  'scene_successor',
  'callback_dependency',
  'arc_dependency',
  'timeline_dependency',
  'world_dependency',
  'relationship_dependency',
] as const;

const SCENE_TYPES = ['setup', 'progression', 'conflict', 'callback', 'resolution'] as const;
const ARC_ROLES = ['main', 'subplot', 'parallel', 'world'] as const;

const REQUIRED_REGISTRY_FIELDS = [
  'scene_id',
  'act_id',
  'scene_type',
  'arc_role',
  'timeline_position',
  'callback_refs',
  'continuity_refs',
  'arc_refs',
  'world_refs',
] as const;

const SCENE_COUNT_MIN = 300;
const SCENE_COUNT_MAX = 1000;
const LONG_RANGE_MIN_GAP = 40;

type SceneType = (typeof SCENE_TYPES)[number];
type ArcRole = (typeof ARC_ROLES)[number];
type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface BlueprintRecord {
  medium_film_archetype_id: string;
  theme: string;
  scene_count_target: number;
  act_structure: {
    acts: { act_index: number; act_name: string; scene_count: number; scene_range: string }[];
    act_distribution: { act1_percent: number; act2_percent: number; act3_percent: number };
  };
  character_arc: { primary_character_id: string; stages: string[] };
  location_arc: { location_flow: string[] };
  lighting_arc: { lighting_flow: string[]; seasonal_palettes?: string[] };
  relationship_arc: { stages: string[]; network?: { nodes: string[]; edges: { from: string; to: string }[] } };
  timeline_arc: {
    long_range_dependencies: { from_scene: number; to_scene: number; dependency_type: string }[];
    timeline_markers: string[];
  };
  memory_callback_arc: { anchor_id: string; callback_seed: number; callback_resolution: number | null }[];
  subplot_arc: { subplots: { subplot_id: string; scene_range: string }[] };
  parallel_arc: { parallel_tracks: { track_id: string; arc_ref: string }[] };
  multi_callback_arc: { callback_layers: { layer_id: string; anchors: string[] }[] };
  relationship_network: { nodes: string[]; evolution_stages: string[] };
  world_arc: {
    world_state_stages: string[];
    location_transformations: { location_id: string; transformation_stage: number }[];
  };
  callback_layer: {
    entries: {
      anchor_id: string;
      layer_id: string;
      callback_seed: number;
      callback_resolution: number | null;
    }[];
  };
  arc_assembly: {
    main_arc: { arc_id: string };
    subplot_arc: { subplots: { subplot_id: string; scene_range: string }[] };
    parallel_arc: { parallel_tracks: { track_id: string }[] };
    world_arc: { arc_type: string };
  };
}

interface SceneRecord {
  scene_id: string;
  scene_index: number;
  act_id: number;
  scene_type: SceneType;
  arc_role: ArcRole;
  timeline_position: number;
  callback_refs: string[];
  continuity_refs: Record<string, string>;
  arc_refs: string[];
  world_refs: string[];
  scene_goal: string;
  character_id: string;
  location_id: string;
  lighting_anchor_id: string;
}

interface DependencyNode {
  scene_id: string;
  scene_index: number;
  scene_predecessor: string | null;
  scene_successor: string | null;
  callback_dependency: { anchor_id: string; target_scene_index: number; dependency_type: string }[];
  arc_dependency: { arc_ref: string; dependency_type: string }[];
  timeline_dependency: { dependency_type: string; source_scene_index: number | null }[];
  world_dependency: { world_stage: string; location_id: string }[];
  relationship_dependency: { from: string; to: string; relationship_type: string }[];
}

export interface MediumFilmSceneAssemblyReport {
  report_id: string;
  phase: typeof MEDIUM_FILM_SCENE_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    medium_film_blueprint_ready: boolean;
    pass_medium_film_blueprint_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    blueprint_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    total_scene_count: number;
    continuity_dimensions: number;
    dependency_dimensions: number;
    target_archetypes: string[];
  };
  outputs: {
    scene_sequence_path: string;
    scene_registry_path: string;
    scene_dependency_graph_path: string;
    scene_continuity_map_path: string;
    scene_arc_network_path: string;
  };
  issues: AssemblyIssue[];
  medium_film_scene_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function parseSceneRangeEnd(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new Error(`Invalid range: ${range}`);
  return Number(match[2]);
}

function parseSceneRangeStart(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) throw new Error(`Invalid range: ${range}`);
  return Number(match[1]);
}

function sceneInRange(sceneIndex: number, range: string, maxScene: number): boolean {
  const start = parseSceneRangeStart(range);
  const end = Math.min(parseSceneRangeEnd(range), maxScene);
  return sceneIndex >= start && sceneIndex <= end;
}

function getActId(sceneIndex: number, acts: BlueprintRecord['act_structure']['acts']): number {
  for (const act of acts) {
    const end = parseSceneRangeEnd(act.scene_range);
    const start = end - act.scene_count + 1;
    if (sceneIndex >= start && sceneIndex <= end) return act.act_index;
  }
  return acts[acts.length - 1]?.act_index ?? 3;
}

function pickCyclic<T>(items: T[], index: number): T {
  return items[(index - 1) % items.length];
}

function buildSceneId(archetypeId: string, sceneIndex: number): string {
  return `${archetypeId}_scene_${String(sceneIndex).padStart(4, '0')}`;
}

function resolveSceneType(sceneIndex: number, actId: number, actSceneCount: number, callbackRefs: string[]): SceneType {
  if (callbackRefs.some((ref) => ref.startsWith('seed:') || ref.startsWith('resolution:'))) {
    return 'callback';
  }
  if (actId === 1) {
    const positionInAct = sceneIndex % actSceneCount;
    return positionInAct < actSceneCount * 0.25 ? 'setup' : 'progression';
  }
  if (actId === 2) {
    const positionInAct = sceneIndex % actSceneCount;
    return positionInAct > actSceneCount * 0.7 ? 'conflict' : 'progression';
  }
  const positionInAct = sceneIndex % actSceneCount;
  return positionInAct > actSceneCount * 0.85 ? 'resolution' : 'progression';
}

function resolveArcRole(blueprint: BlueprintRecord, sceneIndex: number): ArcRole {
  const total = blueprint.scene_count_target;
  for (const subplot of blueprint.subplot_arc.subplots) {
    if (sceneInRange(sceneIndex, subplot.scene_range, total) && sceneIndex % 7 === 0) {
      return 'subplot';
    }
  }
  if (sceneIndex % 12 === 0 && blueprint.parallel_arc.parallel_tracks.length > 0) {
    return 'parallel';
  }
  if (sceneIndex % 25 === 0) {
    return 'world';
  }
  return 'main';
}

function buildCallbackRefs(
  sceneIndex: number,
  callbackLayer: BlueprintRecord['callback_layer']
): string[] {
  const refs: string[] = [];
  for (const entry of callbackLayer.entries) {
    if (entry.callback_seed === sceneIndex) refs.push(`seed:${entry.anchor_id}`);
    if (entry.callback_resolution === sceneIndex) refs.push(`resolution:${entry.anchor_id}`);
    if (entry.callback_seed === sceneIndex) refs.push(`reference:${entry.anchor_id}`);
  }
  for (const entry of callbackLayer.entries) {
    if (
      entry.callback_seed < sceneIndex &&
      entry.callback_resolution &&
      sceneIndex < entry.callback_resolution
    ) {
      refs.push(`pending:${entry.anchor_id}`);
    }
  }
  return [...new Set(refs)];
}

function buildContinuityRefs(
  blueprint: BlueprintRecord,
  sceneIndex: number,
  actId: number,
  arcRole: ArcRole
): Record<string, string> {
  const stages = blueprint.character_arc.stages ?? [];
  const relStages = blueprint.relationship_arc.stages ?? [];
  const stageIdx = Math.min(stages.length - 1, Math.floor((sceneIndex / blueprint.scene_count_target) * stages.length));
  const relIdx = Math.min(relStages.length - 1, Math.floor((sceneIndex / blueprint.scene_count_target) * relStages.length));
  const locationFlow = blueprint.location_arc.location_flow ?? [];
  const lightingFlow = blueprint.lighting_arc.lighting_flow ?? [];
  const memoryEntry = blueprint.memory_callback_arc.find(
    (e) => e.callback_seed === sceneIndex || e.callback_resolution === sceneIndex
  );
  const subplot = blueprint.subplot_arc.subplots.find((s) =>
    sceneInRange(sceneIndex, s.scene_range, blueprint.scene_count_target)
  );
  const parallelTrack = blueprint.parallel_arc.parallel_tracks[sceneIndex % blueprint.parallel_arc.parallel_tracks.length];
  const callbackLayer = blueprint.multi_callback_arc.callback_layers[sceneIndex % blueprint.multi_callback_arc.callback_layers.length];
  const networkStage = pickCyclic(
    blueprint.relationship_network.evolution_stages,
    Math.ceil(sceneIndex / 50)
  );
  const worldStage = pickCyclic(
    blueprint.world_arc.world_state_stages,
    Math.ceil(sceneIndex / 80)
  );

  return {
    character_arc: String(blueprint.character_arc.primary_character_id ?? 'gonegi'),
    location_arc: pickCyclic(locationFlow, sceneIndex),
    lighting_arc: pickCyclic(lightingFlow, sceneIndex),
    relationship_arc: relStages[relIdx] ?? 'neutral',
    timeline_arc: `position_${sceneIndex}_of_${blueprint.scene_count_target}`,
    memory_callback_arc: memoryEntry?.anchor_id ?? 'none',
    subplot_arc: subplot?.subplot_id ?? 'none',
    parallel_arc: parallelTrack?.track_id ?? 'none',
    multi_callback_arc: callbackLayer?.layer_id ?? 'none',
    relationship_network: networkStage,
    world_arc: worldStage,
  };
}

function buildArcRefs(blueprint: BlueprintRecord, sceneIndex: number, arcRole: ArcRole): string[] {
  const refs = [blueprint.arc_assembly.main_arc.arc_id];
  if (arcRole === 'subplot') {
    const subplot = blueprint.subplot_arc.subplots.find((s) =>
      sceneInRange(sceneIndex, s.scene_range, blueprint.scene_count_target)
    );
    if (subplot) refs.push(subplot.subplot_id);
  }
  if (arcRole === 'parallel') {
    const track = blueprint.parallel_arc.parallel_tracks[sceneIndex % blueprint.parallel_arc.parallel_tracks.length];
    if (track) refs.push(track.track_id);
  }
  if (arcRole === 'world') {
    refs.push(blueprint.arc_assembly.world_arc.arc_type ?? 'world_change_story');
  }
  return [...new Set(refs)];
}

function buildWorldRefs(blueprint: BlueprintRecord, sceneIndex: number): string[] {
  const locationFlow = blueprint.location_arc.location_flow ?? [];
  const locationId = pickCyclic(locationFlow, sceneIndex);
  const transformation = blueprint.world_arc.location_transformations.find(
    (t) => t.location_id === locationId
  );
  const stage = pickCyclic(blueprint.world_arc.world_state_stages, Math.ceil(sceneIndex / 80));
  return [stage, transformation ? `transform_${locationId}` : `location_${locationId}`];
}

function lightingAnchorFromDna(dnaId: string): string {
  const mapping: Record<string, string> = {
    morning_harbor_dock: 'midday_harbor_clear_01',
    evening_harbor_dock: 'golden_hour_harbor_01',
    autumn_harbor_return: 'golden_hour_harbor_01',
    sunrise_bakery_window: 'sunrise_window_soft_01',
    winter_bakery_interior: 'morning_bakery_glow_01',
    summer_festival_lane: 'midday_harbor_clear_01',
    autumn_olive_hill: 'golden_hour_harbor_01',
  };
  return mapping[dnaId] ?? `${dnaId}_anchor_01`;
}

function generateScene(blueprint: BlueprintRecord, sceneIndex: number): SceneRecord {
  const actId = getActId(sceneIndex, blueprint.act_structure.acts);
  const act = blueprint.act_structure.acts.find((a) => a.act_index === actId);
  const callbackRefs = buildCallbackRefs(sceneIndex, blueprint.callback_layer);
  const arcRole = resolveArcRole(blueprint, sceneIndex);
  const sceneType = resolveSceneType(sceneIndex, actId, act?.scene_count ?? 1, callbackRefs);
  const continuityRefs = buildContinuityRefs(blueprint, sceneIndex, actId, arcRole);
  const locationId = continuityRefs.location_arc;
  const lightingDna = continuityRefs.lighting_arc;

  return {
    scene_id: buildSceneId(blueprint.medium_film_archetype_id, sceneIndex),
    scene_index: sceneIndex,
    act_id: actId,
    scene_type: sceneType,
    arc_role: arcRole,
    timeline_position: Number((sceneIndex / blueprint.scene_count_target).toFixed(4)),
    callback_refs: callbackRefs,
    continuity_refs: continuityRefs,
    arc_refs: buildArcRefs(blueprint, sceneIndex, arcRole),
    world_refs: buildWorldRefs(blueprint, sceneIndex),
    scene_goal: `${act?.act_name ?? 'act'} ${sceneType} scene ${sceneIndex} — ${arcRole} arc`,
    character_id: String(blueprint.character_arc.primary_character_id ?? 'gonegi'),
    location_id: locationId,
    lighting_anchor_id: lightingAnchorFromDna(lightingDna),
  };
}

function buildDependencyNode(
  blueprint: BlueprintRecord,
  scene: SceneRecord,
  scenes: SceneRecord[],
  sceneIndex: number
): DependencyNode {
  const callbackDeps = blueprint.callback_layer.entries
    .filter(
      (entry) =>
        entry.callback_seed === scene.scene_index ||
        entry.callback_resolution === scene.scene_index
    )
    .map((entry) => ({
      anchor_id: entry.anchor_id,
      target_scene_index:
        entry.callback_seed === scene.scene_index
          ? (entry.callback_resolution ?? scene.scene_index)
          : entry.callback_seed,
      dependency_type: 'callback_dependency',
    }));

  const arcDeps = scene.arc_refs.map((arcRef) => ({
    arc_ref: arcRef,
    dependency_type: `${scene.arc_role}_arc_dependency`,
  }));

  const timelineDeps = blueprint.timeline_arc.long_range_dependencies
    .filter(
      (dep) =>
        dep.from_scene === scene.scene_index ||
        dep.to_scene === scene.scene_index ||
        Math.abs(dep.from_scene - scene.scene_index) <= LONG_RANGE_MIN_GAP
    )
    .map((dep) => ({
      dependency_type: dep.dependency_type,
      source_scene_index: dep.from_scene === scene.scene_index ? dep.to_scene : dep.from_scene,
    }));

  const worldDeps = scene.world_refs.map((ref) => ({
    world_stage: ref,
    location_id: scene.location_id,
  }));

  const networkEdges = blueprint.relationship_arc.network?.edges ?? [];
  const relationshipDeps = networkEdges.slice(0, 2).map((edge) => ({
    from: edge.from,
    to: edge.to,
    relationship_type: 'network_edge',
  }));

  return {
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    scene_predecessor: sceneIndex > 1 ? scenes[sceneIndex - 2].scene_id : null,
    scene_successor:
      sceneIndex < scenes.length ? scenes[sceneIndex]?.scene_id ?? null : null,
    callback_dependency: callbackDeps,
    arc_dependency: arcDeps,
    timeline_dependency: timelineDeps.length > 0 ? timelineDeps : [{ dependency_type: 'timeline_origin', source_scene_index: null }],
    world_dependency: worldDeps,
    relationship_dependency: relationshipDeps,
  };
}

function assembleArchetypeScenes(blueprint: BlueprintRecord): {
  scenes: SceneRecord[];
  dependencyNodes: DependencyNode[];
  continuityEntries: Record<string, unknown>[];
  arcNetworkScenes: Record<string, unknown>[];
} {
  const scenes: SceneRecord[] = [];
  for (let i = 1; i <= blueprint.scene_count_target; i += 1) {
    scenes.push(generateScene(blueprint, i));
  }

  const dependencyNodes = scenes.map((scene, idx) => {
    const node = buildDependencyNode(blueprint, scene, scenes, idx + 1);
    return {
      ...node,
      scene_predecessor: idx > 0 ? scenes[idx - 1].scene_id : null,
      scene_successor: idx < scenes.length - 1 ? scenes[idx + 1].scene_id : null,
    };
  });

  const continuityEntries = scenes.map((scene) => ({
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    act_id: scene.act_id,
    continuity_linkage: scene.continuity_refs,
    dimensions: CONTINUITY_DIMENSIONS.map((d) => ({ dimension: d, ref: scene.continuity_refs[d] })),
  }));

  const arcNetworkScenes = scenes
    .filter((s) => s.arc_role !== 'main' || s.scene_index % 50 === 0)
    .map((scene) => ({
      scene_id: scene.scene_id,
      scene_index: scene.scene_index,
      arc_role: scene.arc_role,
      arc_refs: scene.arc_refs,
      network_links: scene.arc_refs.map((ref) => ({ node_id: ref, role: scene.arc_role })),
    }));

  return { scenes, dependencyNodes, continuityEntries, arcNetworkScenes };
}

function runPrecheck(root: string): {
  medium_film_blueprint_ready: boolean;
  pass_medium_film_blueprint_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({ code: 'BLUEPRINT_REPORT_MISSING', message: 'Blueprint report missing', severity: 'error' });
    return { medium_film_blueprint_ready: false, pass_medium_film_blueprint_assembly_v1: false, precheck_passed: false, issues };
  }

  const report = readJson<Record<string, unknown>>(root, MEDIUM_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);
  const status = String(report.status ?? '');
  const verdict = String(report.final_verdict ?? '');

  const medium_film_blueprint_ready = status === MEDIUM_FILM_BLUEPRINT_READY_STATUS;
  const pass_medium_film_blueprint_assembly_v1 = verdict === MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT;

  if (!medium_film_blueprint_ready) {
    issues.push({ code: 'BLUEPRINT_NOT_READY', message: `Expected ${MEDIUM_FILM_BLUEPRINT_READY_STATUS}`, severity: 'error' });
  }
  if (!pass_medium_film_blueprint_assembly_v1) {
    issues.push({ code: 'BLUEPRINT_VERDICT_FAIL', message: `Expected ${MEDIUM_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}`, severity: 'error' });
  }

  return {
    medium_film_blueprint_ready,
    pass_medium_film_blueprint_assembly_v1,
    precheck_passed: medium_film_blueprint_ready && pass_medium_film_blueprint_assembly_v1,
    issues,
  };
}

function validateOutputs(
  results: { archetypeId: string; scenes: SceneRecord[]; dependencyNodes: DependencyNode[] }[]
): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  for (const result of results) {
    const { archetypeId, scenes } = result;
    if (scenes.length < SCENE_COUNT_MIN || scenes.length > SCENE_COUNT_MAX) {
      issues.push({
        code: 'SCENE_COUNT_OUT_OF_RANGE',
        message: `${archetypeId}: ${scenes.length} scenes outside ${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        severity: 'error',
      });
    }

    const actCounts = [0, 0, 0];
    for (const scene of scenes) actCounts[scene.act_id - 1] += 1;
    const total = scenes.length;
    const act1Pct = Math.round((actCounts[0] / total) * 100);
    const act2Pct = Math.round((actCounts[1] / total) * 100);
    const act3Pct = Math.round((actCounts[2] / total) * 100);
    if (act1Pct < 20 || act1Pct > 25 || act2Pct < 50 || act2Pct > 60 || act3Pct < 20 || act3Pct > 25) {
      issues.push({ code: 'ACT_DISTRIBUTION_INVALID', message: `${archetypeId}: act distribution invalid`, severity: 'error' });
    }

    for (const scene of scenes) {
      for (const field of REQUIRED_REGISTRY_FIELDS) {
        if (!(field in scene)) {
          issues.push({ code: 'MISSING_REGISTRY_FIELD', message: `${scene.scene_id}: missing ${field}`, severity: 'error' });
        }
      }
      if (!SCENE_TYPES.includes(scene.scene_type)) {
        issues.push({ code: 'INVALID_SCENE_TYPE', message: `${scene.scene_id}: invalid scene_type`, severity: 'error' });
      }
      if (!ARC_ROLES.includes(scene.arc_role)) {
        issues.push({ code: 'INVALID_ARC_ROLE', message: `${scene.scene_id}: invalid arc_role`, severity: 'error' });
      }
      for (const dim of CONTINUITY_DIMENSIONS) {
        if (!scene.continuity_refs[dim]) {
          issues.push({ code: 'MISSING_CONTINUITY', message: `${scene.scene_id}: missing ${dim}`, severity: 'error' });
        }
      }
    }

    for (const node of result.dependencyNodes) {
      for (const dim of DEPENDENCY_DIMENSIONS) {
        if (!(dim in node)) {
          issues.push({ code: 'MISSING_DEPENDENCY', message: `${node.scene_id}: missing ${dim}`, severity: 'error' });
        }
      }
    }
  }

  return issues;
}

export function writeMediumFilmSceneAssembly(projectRoot?: string): MediumFilmSceneAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const blueprintArtifact = readJson<{ blueprints: BlueprintRecord[] }>(root, MEDIUM_FILM_BLUEPRINT_PATH);
  const blueprints = blueprintArtifact.blueprints.filter((b) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(b.medium_film_archetype_id)
  );

  if (blueprints.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({ code: 'BLUEPRINT_TARGET_MISSING', message: 'Missing target archetypes', severity: 'error' });
  }

  const archetypeResults = blueprints.map((blueprint) => {
    const assembled = assembleArchetypeScenes(blueprint);
    return { archetypeId: blueprint.medium_film_archetype_id, theme: blueprint.theme, ...assembled };
  });

  issues.push(...validateOutputs(archetypeResults));

  const totalSceneCount = archetypeResults.reduce((sum, r) => sum + r.scenes.length, 0);
  const errors = issues.filter((i) => i.severity === 'error');
  const assemblyReady = precheck.precheck_passed && errors.length === 0;

  const sceneSequence = {
    artifact_id: 'medium-film-scene-sequence-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    blueprint_ref: MEDIUM_FILM_BLUEPRINT_PATH,
    total_scene_count: totalSceneCount,
    sequences: archetypeResults.map((r) => ({
      medium_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      scene_ids: r.scenes.map((s) => s.scene_id),
    })),
  };

  const sceneRegistry = {
    registry_id: 'medium-film-scene-registry-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    scene_types: [...SCENE_TYPES],
    arc_roles: [...ARC_ROLES],
    required_fields: [...REQUIRED_REGISTRY_FIELDS],
    entries: archetypeResults.flatMap((r) => r.scenes),
  };

  const sceneDependencyGraph = {
    graph_id: 'medium-film-scene-dependency-graph-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
    dimension_list: [...DEPENDENCY_DIMENSIONS],
    archetypes: archetypeResults.map((r) => ({
      medium_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      nodes: r.dependencyNodes,
    })),
  };

  const sceneContinuityMap = {
    map_id: 'medium-film-scene-continuity-map-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimensions: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((r) => ({
      medium_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      entries: r.continuityEntries,
    })),
  };

  const sceneArcNetwork = {
    map_id: 'medium-film-scene-arc-network-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    blueprint_arc_network_ref: MEDIUM_FILM_ARC_NETWORK_PATH,
    purpose: 'arc_relationship_tracking',
    archetypes: archetypeResults.map((r) => ({
      medium_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      scene_arc_nodes: r.arcNetworkScenes,
    })),
  };

  const report: MediumFilmSceneAssemblyReport = {
    report_id: 'medium-film-scene-assembly-report-v1',
    phase: MEDIUM_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady ? MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT : MEDIUM_FILM_SCENE_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? MEDIUM_FILM_SCENE_READY_STATUS : 'MEDIUM_FILM_SCENE_INCOMPLETE',
    precheck,
    policy: { blueprint_artifacts_read_only: true, write_policy: SAFE_CREATE_POLICY },
    assembly_summary: {
      archetype_count: archetypeResults.length,
      total_scene_count: totalSceneCount,
      continuity_dimensions: CONTINUITY_DIMENSIONS.length,
      dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      scene_sequence_path: MEDIUM_FILM_SCENE_SEQUENCE_PATH,
      scene_registry_path: MEDIUM_FILM_SCENE_REGISTRY_PATH,
      scene_dependency_graph_path: MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
      scene_continuity_map_path: MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH,
      scene_arc_network_path: MEDIUM_FILM_SCENE_ARC_NETWORK_PATH,
    },
    issues,
    medium_film_scene_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, MEDIUM_FILM_SCENE_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, MEDIUM_FILM_SCENE_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_SEQUENCE_PATH), `${JSON.stringify(sceneSequence, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_REGISTRY_PATH), `${JSON.stringify(sceneRegistry, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH), `${JSON.stringify(sceneDependencyGraph, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH), `${JSON.stringify(sceneContinuityMap, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_ARC_NETWORK_PATH), `${JSON.stringify(sceneArcNetwork, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  return report;
}
