import fs from 'node:fs';
import path from 'node:path';
import {
  FEATURE_FILM_ACT_MAP_PATH,
  FEATURE_FILM_ARC_NETWORK_PATH,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT,
  FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_BLUEPRINT_PATH,
  FEATURE_FILM_BLUEPRINT_READY_STATUS,
  FEATURE_FILM_CALLBACK_LAYER_PATH,
} from './featureFilmBlueprintAssembly.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FEATURE_FILM_SCENE_ASSEMBLY_PHASE = 'PHASE-L3-FEATURE-003' as const;
export const FEATURE_FILM_SCENE_ASSEMBLY_PASS_VERDICT = 'PASS_FEATURE_FILM_SCENE_ASSEMBLY_V1' as const;
export const FEATURE_FILM_SCENE_ASSEMBLY_FAIL_VERDICT = 'FAIL_FEATURE_FILM_SCENE_ASSEMBLY_V1' as const;
export const FEATURE_FILM_SCENE_READY_STATUS = 'FEATURE_FILM_SCENE_READY' as const;

export const FEATURE_FILM_SCENE_ASSEMBLY_EXPORT_DIR = 'exports/feature_film_scene_assembly' as const;
export const FEATURE_FILM_SCENE_SEQUENCE_PATH =
  'exports/feature_film_scene_assembly/feature-film-scene-sequence.json' as const;
export const FEATURE_FILM_SCENE_REGISTRY_PATH =
  'exports/feature_film_scene_assembly/feature-film-scene-registry.json' as const;
export const FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH =
  'exports/feature_film_scene_assembly/feature-film-scene-dependency-graph.json' as const;
export const FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH =
  'exports/feature_film_scene_assembly/feature-film-scene-continuity-map.json' as const;
export const FEATURE_SCENE_SCALE_RULES_PATH =
  'exports/feature_film_scene_assembly/feature-scene-scale-rules.json' as const;
export const FEATURE_ACT_DISTRIBUTION_PATH =
  'exports/feature_film_scene_assembly/feature-act-distribution.json' as const;

export const FEATURE_FILM_SCENE_ASSEMBLY_DIR = 'reports/feature_film_scene_assembly' as const;
export const FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH =
  'reports/feature_film_scene_assembly/FEATURE_FILM_SCENE_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_feature',
  'mediterranean_epoch_feature',
  'correspondence_ledger_feature',
] as const;

const SCENE_COUNT_MIN = 1000;
const SCENE_COUNT_MAX = 3000;
const CALLBACK_DEPTH_MIN = 3;
const CALLBACK_DEPTH_MAX = 5;
const LONG_RANGE_MIN_GAP = 80;

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
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const DEPENDENCY_DIMENSIONS = [
  'scene_predecessor',
  'scene_successor',
  'callback_dependency',
  'arc_dependency',
  'timeline_dependency',
  'world_dependency',
  'theme_dependency',
  'relationship_dependency',
] as const;

const ARC_ASSEMBLY_FIELDS = [
  'main_arc',
  'subplot_arc',
  'parallel_arc',
  'relationship_arc',
  'world_arc',
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const SCENE_TYPES = ['setup', 'progression', 'conflict', 'callback', 'resolution'] as const;
const ARC_ROLES = [
  'main',
  'subplot',
  'parallel',
  'relationship',
  'world',
  'world_state',
  'theme',
  'legacy_callback',
] as const;

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

type SceneType = (typeof SCENE_TYPES)[number];
type ArcRole = (typeof ARC_ROLES)[number];
type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface CallbackLayerEntry {
  anchor_id: string;
  layer_id: string;
  callback_seed: number;
  callback_reference: number | null;
  callback_resolution: number | null;
  callback_completion_state: string;
  callback_depth: number;
  multi_callback_chain: string[];
  legacy_chain: boolean;
}

interface BlueprintRecord {
  feature_film_archetype_id: string;
  theme: string;
  scene_count_target: number;
  scene_count_range: string;
  medium_film_source_ref: string;
  act_structure: {
    act_count: number;
    act_distribution: Record<string, number>;
    acts: { act_index: number; act_name: string; scene_count: number; scene_range: string; percent: number }[];
  };
  arc_assembly: Record<string, unknown>;
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
  world_state_arc: { stages: string[]; act_alignment: Record<string, string> };
  theme_arc: { primary_theme: string; theme_beats: string[]; symbolic_motifs: string[] };
  legacy_callback_arc: {
    legacy_anchors: { anchor_id: string; seed_scene: number; payoff_scene: number; generation_span: number }[];
    callback_depth: number;
  };
  callback_layer: {
    callback_depth: number;
    multi_callback_chain: boolean;
    entries: CallbackLayerEntry[];
    multi_callback_chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[];
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
  callback_dependency: { anchor_id: string; target_scene_index: number; dependency_type: string; legacy_chain: boolean }[];
  arc_dependency: { arc_ref: string; dependency_type: string }[];
  timeline_dependency: { dependency_type: string; source_scene_index: number | null }[];
  world_dependency: { world_stage: string; location_id: string }[];
  theme_dependency: { theme_beat: string; motif: string }[];
  relationship_dependency: { from: string; to: string; relationship_type: string }[];
}

export interface FeatureFilmSceneAssemblyReport {
  report_id: string;
  phase: typeof FEATURE_FILM_SCENE_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    feature_film_blueprint_ready: boolean;
    pass_feature_film_blueprint_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    blueprint_artifacts_read_only: boolean;
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    total_scene_count: number;
    continuity_dimension_count: number;
    dependency_integrity: string;
    callback_resolution_integrity: string;
    legacy_callback_integrity: string;
    act_distribution_valid: boolean;
    scene_scale_valid: boolean;
    traceability_integrity: string;
    callback_depth_range: string;
    multi_callback_chain: boolean;
    legacy_callback_support: boolean;
    target_archetypes: string[];
  };
  outputs: {
    scene_sequence_path: string;
    scene_registry_path: string;
    scene_dependency_graph_path: string;
    scene_continuity_map_path: string;
    scene_scale_rules_path: string;
    act_distribution_path: string;
  };
  issues: AssemblyIssue[];
  feature_film_scene_ready: boolean;
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

function parseSceneRangeMinMax(range: string): { min: number; max: number } {
  return { min: parseSceneRangeStart(range), max: parseSceneRangeEnd(range) };
}

function sceneInRange(sceneIndex: number, range: string, maxScene: number): boolean {
  const start = parseSceneRangeStart(range);
  const end = Math.min(parseSceneRangeEnd(range), maxScene);
  return sceneIndex >= start && sceneIndex <= end;
}

function scaleCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string
): number {
  if (index <= 0) return 0;
  const rangeMax = parseSceneRangeEnd(sceneCountRange);
  return Math.max(1, Math.min(sceneCountTarget, Math.round((index / rangeMax) * sceneCountTarget)));
}

function resolveCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string
): number {
  if (index > 0 && index <= sceneCountTarget) return index;
  return scaleCallbackSceneIndex(index, sceneCountTarget, sceneCountRange);
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

function resolveSceneType(
  sceneIndex: number,
  actId: number,
  actCount: number,
  actSceneCount: number,
  callbackRefs: string[]
): SceneType {
  if (callbackRefs.some((ref) => ref.startsWith('seed:') || ref.startsWith('resolution:'))) {
    return 'callback';
  }
  if (actId === 1) {
    const positionInAct = sceneIndex % actSceneCount;
    return positionInAct < actSceneCount * 0.25 ? 'setup' : 'progression';
  }
  if (actId === actCount || actId === actCount - 1) {
    const positionInAct = sceneIndex % actSceneCount;
    if (actId === actCount && positionInAct > actSceneCount * 0.85) return 'resolution';
    if (positionInAct > actSceneCount * 0.7) return 'conflict';
    return 'progression';
  }
  const positionInAct = sceneIndex % actSceneCount;
  return positionInAct > actSceneCount * 0.65 ? 'conflict' : 'progression';
}

function resolveArcRole(blueprint: BlueprintRecord, sceneIndex: number): ArcRole {
  const total = blueprint.scene_count_target;
  for (const legacy of blueprint.legacy_callback_arc.legacy_anchors) {
    const seed = resolveCallbackSceneIndex(legacy.seed_scene, total, blueprint.scene_count_range);
    const payoff = resolveCallbackSceneIndex(legacy.payoff_scene, total, blueprint.scene_count_range);
    if (sceneIndex === seed || sceneIndex === payoff) return 'legacy_callback';
  }
  if (sceneIndex % 35 === 0 && blueprint.theme_arc.theme_beats.length > 0) return 'theme';
  if (sceneIndex % 28 === 0) return 'world_state';
  if (sceneIndex % 18 === 0) return 'relationship';
  for (const subplot of blueprint.subplot_arc.subplots) {
    if (sceneInRange(sceneIndex, subplot.scene_range, total) && sceneIndex % 9 === 0) {
      return 'subplot';
    }
  }
  if (sceneIndex % 14 === 0 && blueprint.parallel_arc.parallel_tracks.length > 0) {
    return 'parallel';
  }
  if (sceneIndex % 30 === 0) return 'world';
  return 'main';
}

function buildCallbackRefs(
  sceneIndex: number,
  blueprint: BlueprintRecord
): string[] {
  const refs: string[] = [];
  const seen = new Set<string>();

  for (const entry of blueprint.callback_layer.entries) {
    const seed = resolveCallbackSceneIndex(
      entry.callback_seed,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );
    const resolution = resolveCallbackSceneIndex(
      entry.callback_resolution ?? entry.callback_seed,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );

    if (seed === sceneIndex) {
      refs.push(`seed:${entry.anchor_id}`);
      refs.push(`reference:${entry.anchor_id}`);
      if (entry.legacy_chain) refs.push(`legacy_seed:${entry.anchor_id}`);
    }
    if (resolution === sceneIndex) {
      refs.push(`resolution:${entry.anchor_id}`);
      if (entry.legacy_chain) refs.push(`legacy_payoff:${entry.anchor_id}`);
    }
    if (seed < sceneIndex && resolution > sceneIndex) {
      refs.push(`pending:${entry.anchor_id}`);
    }
    if (entry.multi_callback_chain.length > 0 && (seed === sceneIndex || resolution === sceneIndex)) {
      refs.push(`chain:${entry.multi_callback_chain[0]}`);
    }
  }

  for (const ref of refs) {
    if (!seen.has(ref)) seen.add(ref);
  }
  return [...seen];
}

function buildContinuityRefs(
  blueprint: BlueprintRecord,
  sceneIndex: number,
  actId: number,
  arcRole: ArcRole
): Record<string, string> {
  const stages = blueprint.character_arc.stages ?? [];
  const relStages = blueprint.relationship_arc.stages ?? [];
  const stageIdx = Math.min(
    stages.length - 1,
    Math.floor((sceneIndex / blueprint.scene_count_target) * stages.length)
  );
  const relIdx = Math.min(
    relStages.length - 1,
    Math.floor((sceneIndex / blueprint.scene_count_target) * relStages.length)
  );
  const locationFlow = blueprint.location_arc.location_flow ?? [];
  const lightingFlow = blueprint.lighting_arc.lighting_flow ?? [];
  const memoryEntry = blueprint.memory_callback_arc.find(
    (e) =>
      resolveCallbackSceneIndex(e.callback_seed, blueprint.scene_count_target, blueprint.scene_count_range) ===
        sceneIndex ||
      resolveCallbackSceneIndex(
        e.callback_resolution ?? e.callback_seed,
        blueprint.scene_count_target,
        blueprint.scene_count_range
      ) === sceneIndex
  );
  const subplot = blueprint.subplot_arc.subplots.find((s) =>
    sceneInRange(sceneIndex, s.scene_range, blueprint.scene_count_target)
  );
  const parallelTrack =
    blueprint.parallel_arc.parallel_tracks[sceneIndex % blueprint.parallel_arc.parallel_tracks.length];
  const callbackLayer =
    blueprint.multi_callback_arc.callback_layers[
      sceneIndex % blueprint.multi_callback_arc.callback_layers.length
    ];
  const networkStage = pickCyclic(
    blueprint.relationship_network.evolution_stages,
    Math.ceil(sceneIndex / 80)
  );
  const worldStage = pickCyclic(blueprint.world_arc.world_state_stages, Math.ceil(sceneIndex / 120));
  const worldStateStage = pickCyclic(
    blueprint.world_state_arc.stages,
    Math.ceil(sceneIndex / 100)
  );
  const themeBeat = pickCyclic(blueprint.theme_arc.theme_beats, Math.ceil(sceneIndex / 150));
  const legacyAnchor = blueprint.legacy_callback_arc.legacy_anchors.find((anchor) => {
    const seed = resolveCallbackSceneIndex(
      anchor.seed_scene,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );
    const payoff = resolveCallbackSceneIndex(
      anchor.payoff_scene,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );
    return sceneIndex === seed || sceneIndex === payoff;
  });

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
    world_state_arc: worldStateStage,
    theme_arc: themeBeat,
    legacy_callback_arc: legacyAnchor?.anchor_id ?? (arcRole === 'legacy_callback' ? 'legacy_active' : 'none'),
  };
}

function buildArcRefs(blueprint: BlueprintRecord, sceneIndex: number, arcRole: ArcRole): string[] {
  const mainArc = blueprint.arc_assembly.main_arc as { arc_id: string };
  const refs = [mainArc?.arc_id ?? 'main_arc'];

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
  if (arcRole === 'relationship') {
    refs.push('relationship_arc');
  }
  if (arcRole === 'world' || arcRole === 'world_state') {
    const worldArc = blueprint.arc_assembly.world_arc as { arc_type?: string };
    refs.push(worldArc?.arc_type ?? 'world_change_story');
    if (arcRole === 'world_state') refs.push('world_state_arc');
  }
  if (arcRole === 'theme') {
    refs.push(blueprint.theme_arc.primary_theme);
  }
  if (arcRole === 'legacy_callback') {
    refs.push('legacy_callback_arc');
  }

  return [...new Set(refs)];
}

function buildWorldRefs(blueprint: BlueprintRecord, sceneIndex: number): string[] {
  const locationFlow = blueprint.location_arc.location_flow ?? [];
  const locationId = pickCyclic(locationFlow, sceneIndex);
  const transformation = blueprint.world_arc.location_transformations.find(
    (t) => t.location_id === locationId
  );
  const stage = pickCyclic(blueprint.world_arc.world_state_stages, Math.ceil(sceneIndex / 120));
  const worldState = pickCyclic(blueprint.world_state_arc.stages, Math.ceil(sceneIndex / 100));
  return [
    stage,
    worldState,
    transformation ? `transform_${locationId}` : `location_${locationId}`,
  ];
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
    dawn_mediterranean_coast: 'sunrise_coast_glow_01',
    twilight_olive_grove: 'golden_hour_grove_01',
    correspondence_archive: 'archive_soft_light_01',
  };
  return mapping[dnaId] ?? `${dnaId}_anchor_01`;
}

function generateScene(blueprint: BlueprintRecord, sceneIndex: number): SceneRecord {
  const actId = getActId(sceneIndex, blueprint.act_structure.acts);
  const act = blueprint.act_structure.acts.find((a) => a.act_index === actId);
  const callbackRefs = buildCallbackRefs(sceneIndex, blueprint);
  const arcRole = resolveArcRole(blueprint, sceneIndex);
  const sceneType = resolveSceneType(
    sceneIndex,
    actId,
    blueprint.act_structure.act_count,
    act?.scene_count ?? 1,
    callbackRefs
  );
  const continuityRefs = buildContinuityRefs(blueprint, sceneIndex, actId, arcRole);
  const locationId = continuityRefs.location_arc;
  const lightingDna = continuityRefs.lighting_arc;

  return {
    scene_id: buildSceneId(blueprint.feature_film_archetype_id, sceneIndex),
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
  scenes: SceneRecord[]
): DependencyNode {
  const callbackDeps = blueprint.callback_layer.entries
    .filter((entry) => {
      const seed = resolveCallbackSceneIndex(
        entry.callback_seed,
        blueprint.scene_count_target,
        blueprint.scene_count_range
      );
      const resolution = resolveCallbackSceneIndex(
        entry.callback_resolution ?? entry.callback_seed,
        blueprint.scene_count_target,
        blueprint.scene_count_range
      );
      return seed === scene.scene_index || resolution === scene.scene_index;
    })
    .map((entry) => ({
      anchor_id: entry.anchor_id,
      target_scene_index:
        resolveCallbackSceneIndex(
          entry.callback_seed,
          blueprint.scene_count_target,
          blueprint.scene_count_range
        ) === scene.scene_index
          ? resolveCallbackSceneIndex(
              entry.callback_resolution ?? entry.callback_seed,
              blueprint.scene_count_target,
              blueprint.scene_count_range
            )
          : resolveCallbackSceneIndex(
              entry.callback_seed,
              blueprint.scene_count_target,
              blueprint.scene_count_range
            ),
      dependency_type: 'callback_dependency',
      legacy_chain: entry.legacy_chain,
    }));

  const arcDeps = scene.arc_refs.map((arcRef) => ({
    arc_ref: arcRef,
    dependency_type: `${scene.arc_role}_arc_dependency`,
  }));

  const timelineDeps = blueprint.timeline_arc.long_range_dependencies
    .filter((dep) => {
      const from = resolveCallbackSceneIndex(
        dep.from_scene,
        blueprint.scene_count_target,
        blueprint.scene_count_range
      );
      const to = resolveCallbackSceneIndex(
        dep.to_scene,
        blueprint.scene_count_target,
        blueprint.scene_count_range
      );
      return (
        from === scene.scene_index ||
        to === scene.scene_index ||
        Math.abs(from - scene.scene_index) <= LONG_RANGE_MIN_GAP
      );
    })
    .map((dep) => ({
      dependency_type: dep.dependency_type,
      source_scene_index:
        resolveCallbackSceneIndex(
          dep.from_scene,
          blueprint.scene_count_target,
          blueprint.scene_count_range
        ) === scene.scene_index
          ? resolveCallbackSceneIndex(
              dep.to_scene,
              blueprint.scene_count_target,
              blueprint.scene_count_range
            )
          : resolveCallbackSceneIndex(
              dep.from_scene,
              blueprint.scene_count_target,
              blueprint.scene_count_range
            ),
    }));

  const worldDeps = scene.world_refs.map((ref) => ({
    world_stage: ref,
    location_id: scene.location_id,
  }));

  const themeBeat = scene.continuity_refs.theme_arc;
  const motif = pickCyclic(
    blueprint.theme_arc.symbolic_motifs,
    Math.ceil(scene.scene_index / 150)
  );
  const themeDeps = [{ theme_beat: themeBeat, motif }];

  const networkEdges = blueprint.relationship_arc.network?.edges ?? [];
  const relationshipDeps = networkEdges.slice(0, 2).map((edge) => ({
    from: edge.from,
    to: edge.to,
    relationship_type: 'network_edge',
  }));

  const sceneIdx = scenes.findIndex((s) => s.scene_id === scene.scene_id);

  return {
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    scene_predecessor: sceneIdx > 0 ? scenes[sceneIdx - 1].scene_id : null,
    scene_successor: sceneIdx < scenes.length - 1 ? scenes[sceneIdx + 1].scene_id : null,
    callback_dependency: callbackDeps,
    arc_dependency: arcDeps,
    timeline_dependency:
      timelineDeps.length > 0
        ? timelineDeps
        : [{ dependency_type: 'timeline_origin', source_scene_index: null }],
    world_dependency: worldDeps,
    theme_dependency: themeDeps,
    relationship_dependency: relationshipDeps,
  };
}

function hasAnchorLinkage(scene: SceneRecord, anchorId: string): boolean {
  return (
    scene.callback_refs.some((ref) => ref.endsWith(`:${anchorId}`)) ||
    scene.continuity_refs.memory_callback_arc === anchorId ||
    scene.continuity_refs.legacy_callback_arc === anchorId
  );
}

function isCallbackPairComplete(
  entry: CallbackLayerEntry,
  blueprint: BlueprintRecord,
  scenes: SceneRecord[]
): boolean {
  const seedIndex = resolveCallbackSceneIndex(
    entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range
  );
  const payoffIndex = resolveCallbackSceneIndex(
    entry.callback_resolution ?? entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range
  );
  const seedScene = scenes.find((s) => s.scene_index === seedIndex);
  const payoffScene = scenes.find((s) => s.scene_index === payoffIndex);
  if (!seedScene || !payoffScene) return false;

  const seedLinked = hasAnchorLinkage(seedScene, entry.anchor_id);
  const payoffLinked =
    hasAnchorLinkage(payoffScene, entry.anchor_id) ||
    payoffScene.callback_refs.some((ref) => ref.startsWith('resolution:'));

  return seedLinked && payoffLinked;
}

function isLegacyCallbackComplete(
  blueprint: BlueprintRecord,
  scenes: SceneRecord[]
): { complete: number; total: number } {
  let complete = 0;
  const legacyEntries = blueprint.callback_layer.entries.filter((e) => e.legacy_chain);
  const total = legacyEntries.length > 0 ? legacyEntries.length : blueprint.legacy_callback_arc.legacy_anchors.length;

  if (legacyEntries.length > 0) {
    for (const entry of legacyEntries) {
      if (isCallbackPairComplete(entry, blueprint, scenes)) complete += 1;
    }
    return { complete, total };
  }

  for (const anchor of blueprint.legacy_callback_arc.legacy_anchors) {
    const seedIndex = resolveCallbackSceneIndex(
      anchor.seed_scene,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );
    const payoffIndex = resolveCallbackSceneIndex(
      anchor.payoff_scene,
      blueprint.scene_count_target,
      blueprint.scene_count_range
    );
    const seedScene = scenes.find((s) => s.scene_index === seedIndex);
    const payoffScene = scenes.find((s) => s.scene_index === payoffIndex);
    if (
      seedScene &&
      payoffScene &&
      (seedScene.callback_refs.some((r) => r.includes(anchor.anchor_id)) ||
        seedScene.continuity_refs.legacy_callback_arc === anchor.anchor_id) &&
      payoffScene.callback_refs.some((r) => r.startsWith('resolution:'))
    ) {
      complete += 1;
    }
  }
  return { complete, total };
}

function validateActDistribution(
  blueprint: BlueprintRecord,
  scenes: SceneRecord[]
): boolean {
  for (const act of blueprint.act_structure.acts) {
    const start = parseSceneRangeStart(act.scene_range);
    const end = parseSceneRangeEnd(act.scene_range);
    const count = scenes.filter((s) => s.scene_index >= start && s.scene_index <= end).length;
    if (count !== act.scene_count) return false;
  }
  return scenes.length === blueprint.scene_count_target;
}

function assembleArchetypeScenes(blueprint: BlueprintRecord): {
  scenes: SceneRecord[];
  dependencyNodes: DependencyNode[];
  continuityEntries: Record<string, unknown>[];
  callbackCompletionRatio: number;
  legacyCompletionRatio: number;
  actDistributionValid: boolean;
  sceneScaleValid: boolean;
} {
  const scenes: SceneRecord[] = [];
  for (let i = 1; i <= blueprint.scene_count_target; i += 1) {
    scenes.push(generateScene(blueprint, i));
  }

  const dependencyNodes = scenes.map((scene) => buildDependencyNode(blueprint, scene, scenes));

  const continuityEntries = scenes.map((scene) => ({
    scene_id: scene.scene_id,
    scene_index: scene.scene_index,
    act_id: scene.act_id,
    continuity_linkage: scene.continuity_refs,
    dimensions: CONTINUITY_DIMENSIONS.map((d) => ({ dimension: d, ref: scene.continuity_refs[d] })),
  }));

  const uniqueEntries = new Map<string, CallbackLayerEntry>();
  for (const entry of blueprint.callback_layer.entries) {
    const key = `${entry.anchor_id}:${entry.callback_seed}:${entry.callback_resolution}`;
    if (!uniqueEntries.has(key)) uniqueEntries.set(key, entry);
  }
  const callbackEntries = [...uniqueEntries.values()];
  let completedCallbacks = 0;
  for (const entry of callbackEntries) {
    if (isCallbackPairComplete(entry, blueprint, scenes)) completedCallbacks += 1;
  }
  const callbackCompletionRatio =
    callbackEntries.length > 0 ? completedCallbacks / callbackEntries.length : 1;

  const legacyResult = isLegacyCallbackComplete(blueprint, scenes);
  const legacyCompletionRatio = legacyResult.total > 0 ? legacyResult.complete / legacyResult.total : 1;

  const actDistributionValid = validateActDistribution(blueprint, scenes);
  const range = parseSceneRangeMinMax(blueprint.scene_count_range);
  const sceneScaleValid =
    scenes.length >= SCENE_COUNT_MIN &&
    scenes.length <= SCENE_COUNT_MAX &&
    scenes.length >= range.min &&
    scenes.length <= range.max;

  return {
    scenes,
    dependencyNodes,
    continuityEntries,
    callbackCompletionRatio,
    legacyCompletionRatio,
    actDistributionValid,
    sceneScaleValid,
  };
}

function runPrecheck(root: string): {
  feature_film_blueprint_ready: boolean;
  pass_feature_film_blueprint_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'BLUEPRINT_REPORT_MISSING',
      message: `Missing blueprint report at ${FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      feature_film_blueprint_ready: false,
      pass_feature_film_blueprint_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const report = readJson<Record<string, unknown>>(root, FEATURE_FILM_BLUEPRINT_ASSEMBLY_REPORT_PATH);
  const status = String(report.status ?? '');
  const verdict = String(report.final_verdict ?? '');

  const feature_film_blueprint_ready = status === FEATURE_FILM_BLUEPRINT_READY_STATUS;
  const pass_feature_film_blueprint_assembly_v1 = verdict === FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT;

  if (!feature_film_blueprint_ready) {
    issues.push({
      code: 'BLUEPRINT_NOT_READY',
      message: `Expected status=${FEATURE_FILM_BLUEPRINT_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_feature_film_blueprint_assembly_v1) {
    issues.push({
      code: 'BLUEPRINT_VERDICT_FAIL',
      message: `Expected verdict=${FEATURE_FILM_BLUEPRINT_ASSEMBLY_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    feature_film_blueprint_ready,
    pass_feature_film_blueprint_assembly_v1,
    precheck_passed: feature_film_blueprint_ready && pass_feature_film_blueprint_assembly_v1,
    issues,
  };
}

function validateOutputs(
  results: {
    archetypeId: string;
    scenes: SceneRecord[];
    dependencyNodes: DependencyNode[];
    callbackCompletionRatio: number;
    legacyCompletionRatio: number;
    actDistributionValid: boolean;
    sceneScaleValid: boolean;
    blueprint: BlueprintRecord;
  }[]
): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  for (const result of results) {
    const { archetypeId, scenes, blueprint } = result;

    if (scenes.length <= 0) {
      issues.push({ code: 'SCENE_COUNT_ZERO', message: `${archetypeId}: scene_count must be > 0`, severity: 'error' });
    }
    if (!result.sceneScaleValid) {
      issues.push({
        code: 'SCENE_SCALE_INVALID',
        message: `${archetypeId}: scene count ${scenes.length} outside valid scale`,
        severity: 'error',
      });
    }
    if (!result.actDistributionValid) {
      issues.push({
        code: 'ACT_DISTRIBUTION_INVALID',
        message: `${archetypeId}: act distribution does not match blueprint`,
        severity: 'error',
      });
    }
    if (result.callbackCompletionRatio < 1) {
      issues.push({
        code: 'CALLBACK_RESOLUTION_INCOMPLETE',
        message: `${archetypeId}: callback_resolution_ratio=${result.callbackCompletionRatio.toFixed(2)}`,
        severity: 'error',
      });
    }
    if (result.legacyCompletionRatio < 1) {
      issues.push({
        code: 'LEGACY_CALLBACK_INCOMPLETE',
        message: `${archetypeId}: legacy_callback_ratio=${result.legacyCompletionRatio.toFixed(2)}`,
        severity: 'error',
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
      for (const field of ARC_ASSEMBLY_FIELDS) {
        if (!blueprint.arc_assembly[field]) {
          issues.push({
            code: 'MISSING_ARC_ASSEMBLY',
            message: `${archetypeId}: arc_assembly.${field} missing in blueprint`,
            severity: 'error',
          });
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

    if (!blueprint.medium_film_source_ref) {
      issues.push({
        code: 'TRACEABILITY_MISSING',
        message: `${archetypeId}: medium_film_source_ref required`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function writeFeatureFilmSceneAssembly(projectRoot?: string): FeatureFilmSceneAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const blueprintArtifact = readJson<{ blueprints: BlueprintRecord[] }>(root, FEATURE_FILM_BLUEPRINT_PATH);
  const blueprints = blueprintArtifact.blueprints.filter((b) =>
    (TARGET_ARCHETYPE_IDS as readonly string[]).includes(b.feature_film_archetype_id)
  );

  if (blueprints.length !== TARGET_ARCHETYPE_IDS.length) {
    issues.push({ code: 'BLUEPRINT_TARGET_MISSING', message: 'Missing target archetypes', severity: 'error' });
  }

  const archetypeResults = blueprints.map((blueprint) => {
    const assembled = assembleArchetypeScenes(blueprint);
    return {
      archetypeId: blueprint.feature_film_archetype_id,
      theme: blueprint.theme,
      blueprint,
      ...assembled,
    };
  });

  issues.push(...validateOutputs(archetypeResults));

  const totalSceneCount = archetypeResults.reduce((sum, r) => sum + r.scenes.length, 0);
  const errors = issues.filter((i) => i.severity === 'error');

  const avgCallbackRatio =
    archetypeResults.length > 0
      ? archetypeResults.reduce((sum, r) => sum + r.callbackCompletionRatio, 0) / archetypeResults.length
      : 0;
  const avgLegacyRatio =
    archetypeResults.length > 0
      ? archetypeResults.reduce((sum, r) => sum + r.legacyCompletionRatio, 0) / archetypeResults.length
      : 0;
  const allActValid = archetypeResults.every((r) => r.actDistributionValid);
  const allScaleValid = archetypeResults.every((r) => r.sceneScaleValid);
  const allTraceable = archetypeResults.every((r) => Boolean(r.blueprint.medium_film_source_ref));

  const dependencyIntegrity =
    archetypeResults.every((r) =>
      r.dependencyNodes.every((node) =>
        DEPENDENCY_DIMENSIONS.every((dim) => dim in node)
      )
    ) && errors.length === 0
      ? 'PASS'
      : 'FAIL';
  const callbackResolutionIntegrity =
    avgCallbackRatio >= 1 && errors.filter((e) => e.code === 'CALLBACK_RESOLUTION_INCOMPLETE').length === 0
      ? 'PASS'
      : 'FAIL';
  const legacyCallbackIntegrity =
    avgLegacyRatio >= 1 && errors.filter((e) => e.code === 'LEGACY_CALLBACK_INCOMPLETE').length === 0
      ? 'PASS'
      : 'FAIL';
  const traceabilityIntegrity = allTraceable && errors.length === 0 ? 'PASS' : 'FAIL';

  const assemblyReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    totalSceneCount > 0 &&
    dependencyIntegrity === 'PASS' &&
    callbackResolutionIntegrity === 'PASS' &&
    legacyCallbackIntegrity === 'PASS' &&
    allActValid &&
    allScaleValid &&
    traceabilityIntegrity === 'PASS';

  const sceneSequence = {
    artifact_id: 'feature-film-scene-sequence-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    blueprint_ref: FEATURE_FILM_BLUEPRINT_PATH,
    total_scene_count: totalSceneCount,
    sequences: archetypeResults.map((r) => ({
      feature_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      scene_ids: r.scenes.map((s) => s.scene_id),
    })),
  };

  const sceneRegistry = {
    registry_id: 'feature-film-scene-registry-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    scene_types: [...SCENE_TYPES],
    arc_roles: [...ARC_ROLES],
    arc_assembly_fields: [...ARC_ASSEMBLY_FIELDS],
    required_fields: [...REQUIRED_REGISTRY_FIELDS],
    entries: archetypeResults.flatMap((r) => r.scenes),
  };

  const sceneDependencyGraph = {
    graph_id: 'feature-film-scene-dependency-graph-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
    dimension_list: [...DEPENDENCY_DIMENSIONS],
    archetypes: archetypeResults.map((r) => ({
      feature_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      nodes: r.dependencyNodes,
    })),
  };

  const sceneContinuityMap = {
    map_id: 'feature-film-scene-continuity-map-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((r) => ({
      feature_film_archetype_id: r.archetypeId,
      scene_count: r.scenes.length,
      entries: r.continuityEntries,
    })),
  };

  const sceneScaleRules = {
    rules_id: 'feature-scene-scale-rules-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    global_min_scene_count: SCENE_COUNT_MIN,
    global_max_scene_count: SCENE_COUNT_MAX,
    callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
    multi_callback_chain: true,
    legacy_callback_support: true,
    archetypes: archetypeResults.map((r) => {
      const range = parseSceneRangeMinMax(r.blueprint.scene_count_range);
      return {
        feature_film_archetype_id: r.archetypeId,
        target_scene_count: r.scenes.length,
        min_scene_count: range.min,
        max_scene_count: range.max,
        scene_count_range: r.blueprint.scene_count_range,
      };
    }),
  };

  const actDistribution = {
    distribution_id: 'feature-act-distribution-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    act_support: ['Act1', 'Act2', 'Act3', 'Act4', 'Act5'],
    archetypes: archetypeResults.map((r) => {
      const actCounts: Record<string, number> = {};
      for (const act of r.blueprint.act_structure.acts) {
        actCounts[`Act${act.act_index}`] = act.scene_count;
      }
      return {
        feature_film_archetype_id: r.archetypeId,
        act_count: r.blueprint.act_structure.act_count,
        act_distribution: r.blueprint.act_structure.act_distribution,
        act_scene_counts: actCounts,
        acts: r.blueprint.act_structure.acts.map((act) => ({
          act_label: `Act${act.act_index}`,
          act_index: act.act_index,
          act_name: act.act_name,
          percent: act.percent,
          scene_count: act.scene_count,
          scene_range: act.scene_range,
        })),
      };
    }),
  };

  const report: FeatureFilmSceneAssemblyReport = {
    report_id: 'feature-film-scene-assembly-report-v1',
    phase: FEATURE_FILM_SCENE_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? FEATURE_FILM_SCENE_ASSEMBLY_PASS_VERDICT
      : FEATURE_FILM_SCENE_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? FEATURE_FILM_SCENE_READY_STATUS : 'FEATURE_FILM_SCENE_INCOMPLETE',
    precheck,
    policy: {
      blueprint_artifacts_read_only: true,
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: archetypeResults.length,
      total_scene_count: totalSceneCount,
      continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
      dependency_integrity: dependencyIntegrity,
      callback_resolution_integrity: callbackResolutionIntegrity,
      legacy_callback_integrity: legacyCallbackIntegrity,
      act_distribution_valid: allActValid,
      scene_scale_valid: allScaleValid,
      traceability_integrity: traceabilityIntegrity,
      callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
      multi_callback_chain: true,
      legacy_callback_support: true,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      scene_sequence_path: FEATURE_FILM_SCENE_SEQUENCE_PATH,
      scene_registry_path: FEATURE_FILM_SCENE_REGISTRY_PATH,
      scene_dependency_graph_path: FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
      scene_continuity_map_path: FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH,
      scene_scale_rules_path: FEATURE_SCENE_SCALE_RULES_PATH,
      act_distribution_path: FEATURE_ACT_DISTRIBUTION_PATH,
    },
    issues,
    feature_film_scene_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, FEATURE_FILM_SCENE_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, FEATURE_FILM_SCENE_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCENE_SEQUENCE_PATH),
    `${JSON.stringify(sceneSequence, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCENE_REGISTRY_PATH),
    `${JSON.stringify(sceneRegistry, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH),
    `${JSON.stringify(sceneDependencyGraph, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH),
    `${JSON.stringify(sceneContinuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_SCENE_SCALE_RULES_PATH),
    `${JSON.stringify(sceneScaleRules, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_ACT_DISTRIBUTION_PATH),
    `${JSON.stringify(actDistribution, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
