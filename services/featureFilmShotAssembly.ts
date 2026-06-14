import fs from 'node:fs';
import path from 'node:path';
import { FEATURE_FILM_BLUEPRINT_PATH } from './featureFilmBlueprintAssembly.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  FEATURE_FILM_SCENE_ASSEMBLY_PASS_VERDICT,
  FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SCENE_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SCENE_REGISTRY_PATH,
  FEATURE_FILM_SCENE_READY_STATUS,
  FEATURE_FILM_SCENE_SEQUENCE_PATH,
} from './featureFilmSceneAssembly.js';

export const FEATURE_FILM_SHOT_ASSEMBLY_PHASE = 'PHASE-L3-FEATURE-004' as const;
export const FEATURE_FILM_SHOT_ASSEMBLY_PASS_VERDICT = 'PASS_FEATURE_FILM_SHOT_ASSEMBLY_V1' as const;
export const FEATURE_FILM_SHOT_ASSEMBLY_FAIL_VERDICT = 'FAIL_FEATURE_FILM_SHOT_ASSEMBLY_V1' as const;
export const FEATURE_FILM_SHOT_READY_STATUS = 'FEATURE_FILM_SHOT_READY' as const;

export const FEATURE_FILM_SHOT_ASSEMBLY_EXPORT_DIR = 'exports/feature_film_shot_assembly' as const;
export const FEATURE_FILM_SHOT_SEQUENCE_PATH =
  'exports/feature_film_shot_assembly/feature-film-shot-sequence.json' as const;
export const FEATURE_FILM_SHOT_REGISTRY_PATH =
  'exports/feature_film_shot_assembly/feature-film-shot-registry.json' as const;
export const FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH =
  'exports/feature_film_shot_assembly/feature-film-shot-dependency-graph.json' as const;
export const FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH =
  'exports/feature_film_shot_assembly/feature-film-shot-continuity-map.json' as const;
export const FEATURE_FILM_SHOT_COVERAGE_MAP_PATH =
  'exports/feature_film_shot_assembly/feature-film-shot-coverage-map.json' as const;
export const FEATURE_SHOT_SCALE_RULES_PATH =
  'exports/feature_film_shot_assembly/feature-shot-scale-rules.json' as const;
export const FEATURE_SHOT_PER_SCENE_RULES_PATH =
  'exports/feature_film_shot_assembly/feature-shot-per-scene-rules.json' as const;
export const FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH =
  'exports/feature_film_shot_assembly/feature-shot-density-by-scene-type.json' as const;

export const FEATURE_FILM_SHOT_ASSEMBLY_DIR = 'reports/feature_film_shot_assembly' as const;
export const FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH =
  'reports/feature_film_shot_assembly/FEATURE_FILM_SHOT_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_feature',
  'mediterranean_epoch_feature',
  'correspondence_ledger_feature',
] as const;

const SCENE_COUNT_MIN = 1000;
const SCENE_COUNT_MAX = 3000;
const SHOT_COUNT_MIN = 4000;
const SHOT_COUNT_MAX = 24000;
const MIN_SHOTS_PER_SCENE = 3;
const MAX_SHOTS_PER_SCENE = 6;
const TARGET_AVG_SHOTS_PER_SCENE = 4;
const MAX_CONSECUTIVE_COVERAGE_ROLE = 3 as const;
const CALLBACK_DEPTH_MIN = 3;
const CALLBACK_DEPTH_MAX = 5;

const COVERAGE_ROLES = [
  'establishing',
  'dialogue',
  'reaction',
  'action',
  'transition',
  'callback',
  'climax',
  'resolution',
] as const;

const DENSITY_CATEGORIES = ['dialogue', 'action', 'montage', 'callback', 'climax'] as const;

const CAMERA_MOTIONS = [
  'static',
  'pan_left',
  'pan_right',
  'tilt_up',
  'tilt_down',
  'push_in',
  'pull_out',
  'tracking',
  'orbit',
  'handheld',
  'crane_up',
  'crane_down',
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
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const DEPENDENCY_DIMENSIONS = [
  'shot_predecessor',
  'shot_successor',
  'callback_dependency',
  'arc_dependency',
  'timeline_dependency',
  'world_dependency',
  'theme_dependency',
  'relationship_dependency',
] as const;

const DENSITY_BY_SCENE_TYPE: Record<
  (typeof DENSITY_CATEGORIES)[number],
  { min_shots: number; max_shots: number; target_density: number }
> = {
  dialogue: { min_shots: 3, max_shots: 5, target_density: 4 },
  action: { min_shots: 4, max_shots: 6, target_density: 5 },
  montage: { min_shots: 2, max_shots: 4, target_density: 3 },
  callback: { min_shots: 4, max_shots: 6, target_density: 5 },
  climax: { min_shots: 5, max_shots: 7, target_density: 6 },
};

const REQUIRED_REGISTRY_FIELDS = [
  'shot_id',
  'scene_id',
  'archetype',
  'shot_order',
  'coverage_role',
  'camera_motion',
  'continuity_refs',
  'dependency_refs',
] as const;

type CoverageRole = (typeof COVERAGE_ROLES)[number];
type CameraMotion = (typeof CAMERA_MOTIONS)[number];
type DensityCategory = (typeof DENSITY_CATEGORIES)[number];
type IssueSeverity = 'error' | 'warning';

interface AssemblyIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SceneRecord {
  scene_id: string;
  scene_index: number;
  act_id: number;
  scene_type: string;
  arc_role: string;
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

interface SceneDependencyNode {
  scene_id: string;
  scene_index: number;
  scene_predecessor: string | null;
  scene_successor: string | null;
  callback_dependency: {
    anchor_id: string;
    target_scene_index: number;
    dependency_type: string;
    legacy_chain?: boolean;
  }[];
  arc_dependency: { arc_ref: string; dependency_type: string }[];
  timeline_dependency: { dependency_type: string; source_scene_index: number | null }[];
  world_dependency: { world_stage: string; location_id: string }[];
  theme_dependency: { theme_beat: string; motif: string }[];
  relationship_dependency: { from: string; to: string; relationship_type: string }[];
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
  scene_count_target: number;
  scene_count_range: string;
  medium_film_source_ref: string;
  act_structure: { act_count: number };
  theme_arc: { primary_theme: string; theme_beats: string[]; symbolic_motifs: string[] };
  legacy_callback_arc: {
    legacy_anchors: { anchor_id: string; seed_scene: number; payoff_scene: number }[];
    callback_depth: number;
  };
  callback_layer: {
    callback_depth: number;
    multi_callback_chain: boolean;
    entries: CallbackLayerEntry[];
    multi_callback_chains: { chain_id: string; layer_ids: string[]; anchor_ids: string[] }[];
  };
}

interface CallbackResolution {
  callback_source: string;
  callback_target: string;
  resolution_state: 'complete' | 'pending' | 'seed_only';
  callback_depth: number;
  callback_chain_id: string;
  callback_depth_level: number;
  anchor_id: string;
  legacy_chain: boolean;
}

interface ShotRecord {
  shot_id: string;
  scene_id: string;
  archetype: string;
  shot_order: number;
  shot_order_in_scene: number;
  coverage_role: CoverageRole;
  camera_motion: CameraMotion;
  density_category: DensityCategory;
  continuity_refs: Record<string, string>;
  dependency_refs: {
    scene_predecessor: string | null;
    scene_successor: string | null;
    arc_refs: string[];
    callback_refs: string[];
  };
  callback_resolution?: CallbackResolution;
}

interface ShotDependencyNode {
  shot_id: string;
  shot_order: number;
  shot_predecessor: string | null;
  shot_successor: string | null;
  callback_dependency: CallbackResolution[];
  arc_dependency: { arc_ref: string; dependency_type: string }[];
  timeline_dependency: { dependency_type: string; source_shot_order: number | null }[];
  world_dependency: { world_stage: string; location_id: string }[];
  theme_dependency: { theme_beat: string; motif: string }[];
  relationship_dependency: { from: string; to: string; relationship_type: string }[];
}

interface ShotContinuityEntry {
  shot_id: string;
  scene_id: string;
  archetype: string;
  inherited_from_scene: Record<string, string>;
  coverage_role_continuity: string;
  camera_motion_continuity: string;
}

export interface FeatureFilmShotAssemblyReport {
  report_id: string;
  phase: typeof FEATURE_FILM_SHOT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    feature_film_scene_ready: boolean;
    pass_feature_film_scene_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    scene_artifacts_read_only: boolean;
    blueprint_artifacts_read_only: boolean;
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    total_scene_count: number;
    total_shot_count: number;
    adaptive_shot_generation: boolean;
    scene_driven_scaling: boolean;
    target_scene_range: string;
    target_shot_range: string;
    coverage_roles: string[];
    camera_motions: string[];
    coverage_validation_passed: boolean;
    coverage_collapse_count: number;
    continuity_dimension_count: number;
    callback_resolution_integrity: string;
    legacy_callback_integrity: string;
    dependency_integrity: string;
    shot_scale_valid: boolean;
    shot_per_scene_valid: boolean;
    shot_density_valid: boolean;
    traceability_integrity: string;
    orphan_scene_count: number;
    orphan_shot_count: number;
    scene_artifact_mutation: number;
    callback_depth_range: string;
    multi_callback_chain: boolean;
    legacy_callback_support: boolean;
    target_archetypes: string[];
  };
  outputs: {
    shot_sequence_path: string;
    shot_registry_path: string;
    shot_dependency_graph_path: string;
    shot_continuity_map_path: string;
    shot_coverage_map_path: string;
    shot_scale_rules_path: string;
    shot_per_scene_rules_path: string;
    shot_density_by_scene_type_path: string;
  };
  issues: AssemblyIssue[];
  feature_film_shot_ready: boolean;
}

const COVERAGE_ROLE_PROFILE: Record<CoverageRole, { camera_motion: CameraMotion }> = {
  establishing: { camera_motion: 'static' },
  dialogue: { camera_motion: 'static' },
  reaction: { camera_motion: 'push_in' },
  action: { camera_motion: 'tracking' },
  transition: { camera_motion: 'pull_out' },
  callback: { camera_motion: 'push_in' },
  climax: { camera_motion: 'push_in' },
  resolution: { camera_motion: 'pull_out' },
};

const ACT_COVERAGE_ROTATION: Record<number, CoverageRole[]> = {
  1: ['establishing', 'dialogue', 'reaction', 'action', 'transition'],
  2: ['dialogue', 'reaction', 'action', 'transition', 'climax'],
  3: ['action', 'dialogue', 'reaction', 'transition', 'climax'],
  4: ['transition', 'reaction', 'callback', 'climax', 'resolution'],
  5: ['transition', 'reaction', 'callback', 'resolution', 'dialogue'],
};

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function extractArchetypeId(sceneId: string): string {
  const match = /^(.*)_scene_\d+$/.exec(sceneId);
  return match?.[1] ?? sceneId;
}

function buildShotId(sceneId: string, shotIndexInScene: number): string {
  return `${sceneId}_shot_${String(shotIndexInScene).padStart(2, '0')}`;
}

function parseSceneRangeMax(sceneCountRange: string): number {
  const match = /(\d+)\s*-\s*(\d+)/.exec(sceneCountRange);
  if (match) return Number(match[2]);
  const single = Number(sceneCountRange);
  return Number.isFinite(single) && single > 0 ? single : SCENE_COUNT_MAX;
}

function scaleCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string
): number {
  if (index <= 0) return 0;
  const rangeMax = parseSceneRangeMax(sceneCountRange);
  return Math.max(1, Math.min(sceneCountTarget, Math.round((index / rangeMax) * sceneCountTarget)));
}

function resolveCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string,
  scenes: SceneRecord[]
): number {
  if (index > 0 && index <= sceneCountTarget && scenes.some((scene) => scene.scene_index === index)) {
    return index;
  }
  return scaleCallbackSceneIndex(index, sceneCountTarget, sceneCountRange);
}

function resolveDensityCategory(scene: SceneRecord, actCount: number): DensityCategory {
  if (scene.scene_type === 'callback') return 'callback';
  if (scene.scene_type === 'conflict') return 'action';
  if (scene.scene_type === 'resolution' && scene.act_id >= actCount - 1) return 'climax';
  if (
    scene.arc_role === 'parallel' ||
    scene.arc_role === 'world' ||
    scene.arc_role === 'world_state' ||
    scene.arc_role === 'theme'
  ) {
    return 'montage';
  }
  return 'dialogue';
}

function shotsPerScene(scene: SceneRecord, actCount: number): number {
  const category = resolveDensityCategory(scene, actCount);
  const rule = DENSITY_BY_SCENE_TYPE[category];
  let count = rule.target_density;
  if (scene.arc_role === 'main' && scene.scene_type === 'conflict') {
    count = Math.min(rule.max_shots, count + 1);
  }
  if (scene.scene_index === 1) {
    count = Math.max(rule.min_shots, count);
  }
  return Math.max(rule.min_shots, Math.min(rule.max_shots, count));
}

function hasConsecutiveViolation(roles: CoverageRole[], limit: number): boolean {
  if (roles.length < limit) return false;
  const tail = roles.slice(-limit);
  return tail.every((role) => role === tail[0]);
}

function pickAlternateRole(
  role: CoverageRole,
  recentRoles: CoverageRole[],
  shotIndexInScene: number
): CoverageRole {
  const pool = COVERAGE_ROLES.filter((candidate) => candidate !== role);
  for (const candidate of pool) {
    const trial = [...recentRoles, candidate];
    if (!hasConsecutiveViolation(trial, MAX_CONSECUTIVE_COVERAGE_ROLE + 1)) {
      return candidate;
    }
  }
  return COVERAGE_ROLES[shotIndexInScene % COVERAGE_ROLES.length];
}

function isCallbackScene(scene: SceneRecord): boolean {
  return scene.scene_type === 'callback' || scene.callback_refs.some((ref) => ref.startsWith('seed:'));
}

function isResolutionScene(scene: SceneRecord): boolean {
  return (
    scene.scene_type === 'resolution' ||
    scene.callback_refs.some((ref) => ref.startsWith('resolution:'))
  );
}

function suggestCoverageRole(
  scene: SceneRecord,
  shotIndexInScene: number,
  totalShotsInScene: number,
  actCount: number
): CoverageRole {
  if (scene.scene_index === 1 && shotIndexInScene === 0) return 'establishing';
  if (isCallbackScene(scene) && shotIndexInScene === totalShotsInScene - 1) return 'callback';
  if (isResolutionScene(scene) && shotIndexInScene === totalShotsInScene - 1) return 'resolution';
  if (
    scene.act_id >= actCount - 1 &&
    scene.timeline_position >= 0.85 &&
    shotIndexInScene === Math.floor(totalShotsInScene / 2)
  ) {
    return 'climax';
  }
  const rotation = ACT_COVERAGE_ROTATION[scene.act_id] ?? ACT_COVERAGE_ROTATION[3];
  return rotation[shotIndexInScene % rotation.length] ?? 'dialogue';
}

function resolveCoverageRole(
  scene: SceneRecord,
  shotIndexInScene: number,
  totalShotsInScene: number,
  recentRoles: CoverageRole[],
  actCount: number
): CoverageRole {
  let role = suggestCoverageRole(scene, shotIndexInScene, totalShotsInScene, actCount);
  const trial = [...recentRoles, role];
  if (hasConsecutiveViolation(trial, MAX_CONSECUTIVE_COVERAGE_ROLE + 1)) {
    role = pickAlternateRole(role, recentRoles, shotIndexInScene);
  }
  return role;
}

function buildExtendedShotDependencies(
  shot: ShotRecord,
  scene: SceneRecord,
  sceneDep: SceneDependencyNode | undefined
): Pick<
  ShotDependencyNode,
  | 'arc_dependency'
  | 'timeline_dependency'
  | 'world_dependency'
  | 'theme_dependency'
  | 'relationship_dependency'
> {
  const arcDeps =
    sceneDep?.arc_dependency ??
    scene.arc_refs.map((arcRef) => ({ arc_ref: arcRef, dependency_type: 'arc_dependency' }));

  const timelineDeps =
    sceneDep?.timeline_dependency.map((dep) => ({
      dependency_type: dep.dependency_type,
      source_shot_order: dep.source_scene_index ? shot.shot_order - 1 : null,
    })) ?? [{ dependency_type: 'timeline_origin', source_shot_order: null }];

  const worldDeps =
    sceneDep?.world_dependency ??
    scene.world_refs.map((ref) => ({ world_stage: ref, location_id: scene.location_id }));

  const themeDeps = sceneDep?.theme_dependency ?? [
    {
      theme_beat: scene.continuity_refs.theme_arc,
      motif: scene.continuity_refs.theme_arc,
    },
  ];

  const relationshipDeps = sceneDep?.relationship_dependency ?? [];

  return {
    arc_dependency: arcDeps,
    timeline_dependency: timelineDeps,
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
  scenes: SceneRecord[],
  shotsBySceneId: Map<string, ShotRecord[]>
): { complete: boolean; seedShot: ShotRecord | null; payoffShot: ShotRecord | null; resolution: CallbackResolution | null } {
  const actCount = blueprint.act_structure.act_count;
  const seedSceneIndex = resolveCallbackSceneIndex(
    entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );
  const payoffSceneIndex = resolveCallbackSceneIndex(
    entry.callback_resolution ?? entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );

  const seedScene = scenes.find((scene) => scene.scene_index === seedSceneIndex);
  const payoffScene = scenes.find((scene) => scene.scene_index === payoffSceneIndex);
  if (!seedScene || !payoffScene) {
    return { complete: false, seedShot: null, payoffShot: null, resolution: null };
  }

  const seedShots = shotsBySceneId.get(seedScene.scene_id) ?? [];
  const payoffShots = shotsBySceneId.get(payoffScene.scene_id) ?? [];
  const seedShot = seedShots.find((s) => s.coverage_role === 'callback') ?? seedShots[seedShots.length - 1] ?? null;
  const payoffShot =
    payoffShots.find((s) => s.coverage_role === 'callback' || s.coverage_role === 'resolution') ??
    payoffShots[payoffShots.length - 1] ??
    null;

  const seedLinked = hasAnchorLinkage(seedScene, entry.anchor_id);
  const payoffLinked =
    hasAnchorLinkage(payoffScene, entry.anchor_id) ||
    payoffScene.act_id >= actCount - 1 ||
    payoffScene.callback_refs.some((ref) => ref.startsWith('resolution:'));

  const complete = seedLinked && payoffLinked && seedShot !== null && payoffShot !== null;
  const chainId = entry.multi_callback_chain[0] ?? `chain_${entry.layer_id}_${entry.anchor_id}`;

  const resolution: CallbackResolution | null =
    seedShot && payoffShot
      ? {
          callback_source: seedShot.shot_id,
          callback_target: payoffShot.shot_id,
          resolution_state: complete ? 'complete' : seedLinked ? 'pending' : 'seed_only',
          callback_depth: entry.multi_callback_chain.length,
          callback_chain_id: chainId,
          callback_depth_level: entry.callback_depth,
          anchor_id: entry.anchor_id,
          legacy_chain: entry.legacy_chain,
        }
      : null;

  return { complete, seedShot, payoffShot, resolution };
}

function computeLegacyCompletionRatio(
  blueprint: BlueprintRecord,
  scenes: SceneRecord[],
  shotsBySceneId: Map<string, ShotRecord[]>
): number {
  const legacyEntries = blueprint.callback_layer.entries.filter((e) => e.legacy_chain);
  if (legacyEntries.length === 0) {
    let complete = 0;
    for (const anchor of blueprint.legacy_callback_arc.legacy_anchors) {
      const seedIndex = resolveCallbackSceneIndex(
        anchor.seed_scene,
        blueprint.scene_count_target,
        blueprint.scene_count_range,
        scenes
      );
      const payoffIndex = resolveCallbackSceneIndex(
        anchor.payoff_scene,
        blueprint.scene_count_target,
        blueprint.scene_count_range,
        scenes
      );
      const seedScene = scenes.find((s) => s.scene_index === seedIndex);
      const payoffScene = scenes.find((s) => s.scene_index === payoffIndex);
      if (seedScene && payoffScene) {
        const seedShots = shotsBySceneId.get(seedScene.scene_id) ?? [];
        const payoffShots = shotsBySceneId.get(payoffScene.scene_id) ?? [];
        if (seedShots.length > 0 && payoffShots.length > 0) complete += 1;
      }
    }
    const total = blueprint.legacy_callback_arc.legacy_anchors.length;
    return total > 0 ? complete / total : 1;
  }

  let complete = 0;
  const unique = new Map<string, CallbackLayerEntry>();
  for (const entry of legacyEntries) {
    unique.set(`${entry.anchor_id}:${entry.callback_seed}`, entry);
  }
  for (const entry of unique.values()) {
    const result = isCallbackPairComplete(entry, blueprint, scenes, shotsBySceneId);
    if (result.complete) complete += 1;
  }
  return unique.size > 0 ? complete / unique.size : 1;
}

function assembleArchetypeShots(
  archetypeId: string,
  scenes: SceneRecord[],
  sceneDepNodes: SceneDependencyNode[],
  blueprint: BlueprintRecord
): {
  shots: ShotRecord[];
  dependencyNodes: ShotDependencyNode[];
  continuityEntries: ShotContinuityEntry[];
  coverageRoles: CoverageRole[];
  densityCategories: DensityCategory[];
  violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
  callbackResolutions: CallbackResolution[];
  callbackCompletionRatio: number;
  legacyCompletionRatio: number;
  shotsPerSceneValid: boolean;
  densityCategoriesUsed: Set<DensityCategory>;
} {
  const actCount = blueprint.act_structure.act_count;
  const depBySceneId = new Map(sceneDepNodes.map((node) => [node.scene_id, node]));
  const shots: ShotRecord[] = [];
  const dependencyNodes: ShotDependencyNode[] = [];
  const continuityEntries: ShotContinuityEntry[] = [];
  const coverageRoles: CoverageRole[] = [];
  const densityCategories: DensityCategory[] = [];
  const shotsBySceneId = new Map<string, ShotRecord[]>();
  const densityCategoriesUsed = new Set<DensityCategory>();
  let globalShotOrder = 0;
  let previousMotion: CameraMotion | null = null;
  let shotsPerSceneValid = true;

  for (const scene of scenes) {
    const totalShotsInScene = shotsPerScene(scene, actCount);
    if (totalShotsInScene < MIN_SHOTS_PER_SCENE || totalShotsInScene > MAX_SHOTS_PER_SCENE) {
      shotsPerSceneValid = false;
    }
    const densityCategory = resolveDensityCategory(scene, actCount);
    densityCategoriesUsed.add(densityCategory);
    const sceneShots: ShotRecord[] = [];
    const depNode = depBySceneId.get(scene.scene_id);

    for (let shotIndex = 0; shotIndex < totalShotsInScene; shotIndex += 1) {
      globalShotOrder += 1;
      const coverageRole = resolveCoverageRole(
        scene,
        shotIndex,
        totalShotsInScene,
        coverageRoles,
        actCount
      );
      let cameraMotion = COVERAGE_ROLE_PROFILE[coverageRole].camera_motion;
      if (previousMotion === cameraMotion && cameraMotion === 'static') {
        cameraMotion = shotIndex % 2 === 0 ? 'pan_left' : 'pan_right';
      }

      const shot: ShotRecord = {
        shot_id: buildShotId(scene.scene_id, shotIndex + 1),
        scene_id: scene.scene_id,
        archetype: archetypeId,
        shot_order: globalShotOrder,
        shot_order_in_scene: shotIndex + 1,
        coverage_role: coverageRole,
        camera_motion: cameraMotion,
        density_category: densityCategory,
        continuity_refs: { ...scene.continuity_refs },
        dependency_refs: {
          scene_predecessor: depNode?.scene_predecessor ?? null,
          scene_successor: depNode?.scene_successor ?? null,
          arc_refs: [...scene.arc_refs],
          callback_refs: [...scene.callback_refs],
        },
      };

      sceneShots.push(shot);
      shots.push(shot);
      coverageRoles.push(coverageRole);
      densityCategories.push(densityCategory);
      previousMotion = cameraMotion;
    }

    shotsBySceneId.set(scene.scene_id, sceneShots);

    for (const shot of sceneShots) {
      const shotIndex = shots.findIndex((entry) => entry.shot_id === shot.shot_id);
      const extendedDeps = buildExtendedShotDependencies(shot, scene, depNode);
      dependencyNodes.push({
        shot_id: shot.shot_id,
        shot_order: shot.shot_order,
        shot_predecessor: shotIndex > 0 ? shots[shotIndex - 1].shot_id : null,
        shot_successor: shotIndex < shots.length - 1 ? shots[shotIndex + 1].shot_id : null,
        callback_dependency: [],
        ...extendedDeps,
      });

      const priorShot = shotIndex > 0 ? shots[shotIndex - 1] : null;
      continuityEntries.push({
        shot_id: shot.shot_id,
        scene_id: shot.scene_id,
        archetype: archetypeId,
        inherited_from_scene: { ...scene.continuity_refs },
        coverage_role_continuity: priorShot?.coverage_role ?? shot.coverage_role,
        camera_motion_continuity: priorShot?.camera_motion ?? shot.camera_motion,
      });
    }
  }

  const callbackResolutions: CallbackResolution[] = [];
  let completedPairs = 0;
  const uniqueEntries = new Map<string, CallbackLayerEntry>();
  for (const entry of blueprint.callback_layer.entries) {
    const key = `${entry.anchor_id}:${entry.callback_seed}:${entry.callback_resolution}`;
    if (!uniqueEntries.has(key)) uniqueEntries.set(key, entry);
  }
  const callbackEntries = [...uniqueEntries.values()];

  for (const entry of callbackEntries) {
    const result = isCallbackPairComplete(entry, blueprint, scenes, shotsBySceneId);
    if (result.resolution) {
      callbackResolutions.push(result.resolution);
      if (result.seedShot) result.seedShot.callback_resolution = result.resolution;
      if (result.payoffShot && result.payoffShot.shot_id !== result.seedShot?.shot_id) {
        result.payoffShot.callback_resolution = result.resolution;
      }
      const depNode = dependencyNodes.find((node) => node.shot_id === result.payoffShot?.shot_id);
      if (depNode) depNode.callback_dependency.push(result.resolution);
    }
    if (result.complete) completedPairs += 1;
  }

  const violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[] = [];
  for (let index = MAX_CONSECUTIVE_COVERAGE_ROLE; index < coverageRoles.length; index += 1) {
    const window = coverageRoles.slice(index - MAX_CONSECUTIVE_COVERAGE_ROLE, index + 1);
    if (window.every((role) => role === window[0])) {
      violations.push({
        shot_id: shots[index].shot_id,
        consecutive_role: window[0],
        count: MAX_CONSECUTIVE_COVERAGE_ROLE + 1,
      });
    }
  }

  const callbackCompletionRatio = callbackEntries.length > 0 ? completedPairs / callbackEntries.length : 1;
  const legacyCompletionRatio = computeLegacyCompletionRatio(blueprint, scenes, shotsBySceneId);

  return {
    shots,
    dependencyNodes,
    continuityEntries,
    coverageRoles,
    densityCategories,
    violations,
    callbackResolutions,
    callbackCompletionRatio,
    legacyCompletionRatio,
    shotsPerSceneValid,
    densityCategoriesUsed,
  };
}

function runPrecheck(root: string): {
  feature_film_scene_ready: boolean;
  pass_feature_film_scene_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SCENE_REPORT_MISSING',
      message: `Missing scene assembly report at ${FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      feature_film_scene_ready: false,
      pass_feature_film_scene_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const sceneReport = readJson<Record<string, unknown>>(root, FEATURE_FILM_SCENE_ASSEMBLY_REPORT_PATH);
  const status = String(sceneReport.status ?? '');
  const verdict = String(sceneReport.final_verdict ?? '');

  const feature_film_scene_ready = status === FEATURE_FILM_SCENE_READY_STATUS;
  const pass_feature_film_scene_assembly_v1 = verdict === FEATURE_FILM_SCENE_ASSEMBLY_PASS_VERDICT;

  if (!feature_film_scene_ready) {
    issues.push({
      code: 'SCENE_NOT_READY',
      message: `Expected status=${FEATURE_FILM_SCENE_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_feature_film_scene_assembly_v1) {
    issues.push({
      code: 'SCENE_VERDICT_FAIL',
      message: `Expected final_verdict=${FEATURE_FILM_SCENE_ASSEMBLY_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    feature_film_scene_ready,
    pass_feature_film_scene_assembly_v1,
    precheck_passed: feature_film_scene_ready && pass_feature_film_scene_assembly_v1,
    issues,
  };
}

function validateAssembly(
  archetypeResults: {
    archetypeId: string;
    shots: ShotRecord[];
    violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
    callbackCompletionRatio: number;
    legacyCompletionRatio: number;
    sceneCount: number;
    shotsPerSceneValid: boolean;
    densityCategoriesUsed: Set<DensityCategory>;
    blueprint: BlueprintRecord;
  }[],
  allSceneIds: Set<string>
): {
  issues: AssemblyIssue[];
  orphanSceneCount: number;
  orphanShotCount: number;
  coverageCollapseCount: number;
  shotScaleValid: boolean;
  shotPerSceneValid: boolean;
  shotDensityValid: boolean;
  traceabilityIntegrity: string;
} {
  const issues: AssemblyIssue[] = [];
  let orphanSceneCount = 0;
  let orphanShotCount = 0;
  let coverageCollapseCount = 0;
  let shotScaleValid = true;
  let shotPerSceneValid = true;
  let shotDensityValid = true;
  let allTraceable = true;

  const coveredSceneIds = new Set<string>();
  const shotIds = new Set<string>();

  for (const result of archetypeResults) {
    if (!result.blueprint.medium_film_source_ref) allTraceable = false;

    const archetypeShotCount = result.shots.length;
    const archetypeMin = result.sceneCount * MIN_SHOTS_PER_SCENE;
    const archetypeMax = result.sceneCount * MAX_SHOTS_PER_SCENE;
    if (archetypeShotCount < archetypeMin || archetypeShotCount > archetypeMax) {
      shotScaleValid = false;
      issues.push({
        code: 'ARCHETYPE_SHOT_SCALE_INVALID',
        message: `${result.archetypeId}: shot_count=${archetypeShotCount} outside ${archetypeMin}-${archetypeMax}`,
        severity: 'error',
      });
    }

    if (!result.shotsPerSceneValid) {
      shotPerSceneValid = false;
      issues.push({
        code: 'SHOT_PER_SCENE_INVALID',
        message: `${result.archetypeId}: shots per scene outside ${MIN_SHOTS_PER_SCENE}-${MAX_SHOTS_PER_SCENE}`,
        severity: 'error',
      });
    }

    for (const category of DENSITY_CATEGORIES) {
      if (!result.densityCategoriesUsed.has(category)) {
        shotDensityValid = false;
        issues.push({
          code: 'DENSITY_CATEGORY_MISSING',
          message: `${result.archetypeId}: missing density category ${category}`,
          severity: 'error',
        });
      }
    }

    for (const shot of result.shots) {
      coveredSceneIds.add(shot.scene_id);
      if (shotIds.has(shot.shot_id)) {
        orphanShotCount += 1;
        issues.push({
          code: 'DUPLICATE_SHOT_ID',
          message: `Duplicate shot_id ${shot.shot_id}`,
          severity: 'error',
        });
      }
      shotIds.add(shot.shot_id);

      for (const field of REQUIRED_REGISTRY_FIELDS) {
        if (!(field in shot)) {
          issues.push({
            code: 'MISSING_SHOT_FIELD',
            message: `${shot.shot_id}: missing ${field}`,
            severity: 'error',
          });
        }
      }

      if (Object.keys(shot.continuity_refs).length < CONTINUITY_DIMENSIONS.length) {
        issues.push({
          code: 'CONTINUITY_DIMENSION_SHORTFALL',
          message: `${shot.shot_id}: continuity_refs incomplete`,
          severity: 'error',
        });
      }

      if (!COVERAGE_ROLES.includes(shot.coverage_role)) {
        issues.push({
          code: 'INVALID_COVERAGE_ROLE',
          message: `${shot.shot_id}: invalid coverage_role`,
          severity: 'error',
        });
      }
      if (!CAMERA_MOTIONS.includes(shot.camera_motion)) {
        issues.push({
          code: 'INVALID_CAMERA_MOTION',
          message: `${shot.shot_id}: invalid camera_motion`,
          severity: 'error',
        });
      }
    }

    for (const violation of result.violations) {
      coverageCollapseCount += 1;
      issues.push({
        code: 'COVERAGE_CONSECUTIVE_VIOLATION',
        message: `${violation.shot_id}: ${violation.count} consecutive ${violation.consecutive_role}`,
        severity: 'error',
      });
    }

    if (result.callbackCompletionRatio < 1) {
      issues.push({
        code: 'CALLBACK_RESOLUTION_INCOMPLETE',
        message: `${result.archetypeId}: callback_ratio=${result.callbackCompletionRatio.toFixed(2)}`,
        severity: 'error',
      });
    }
    if (result.legacyCompletionRatio < 1) {
      issues.push({
        code: 'LEGACY_CALLBACK_INCOMPLETE',
        message: `${result.archetypeId}: legacy_ratio=${result.legacyCompletionRatio.toFixed(2)}`,
        severity: 'error',
      });
    }

    if (result.sceneCount < SCENE_COUNT_MIN || result.sceneCount > SCENE_COUNT_MAX) {
      issues.push({
        code: 'SCENE_COUNT_OUT_OF_RANGE',
        message: `${result.archetypeId}: scene_count=${result.sceneCount}`,
        severity: 'error',
      });
    }
  }

  for (const sceneId of allSceneIds) {
    if (!coveredSceneIds.has(sceneId)) {
      orphanSceneCount += 1;
      issues.push({
        code: 'ORPHAN_SCENE',
        message: `Scene ${sceneId} has no shots`,
        severity: 'error',
      });
    }
  }

  const traceabilityIntegrity = allTraceable ? 'PASS' : 'FAIL';

  return {
    issues,
    orphanSceneCount,
    orphanShotCount,
    coverageCollapseCount,
    shotScaleValid,
    shotPerSceneValid,
    shotDensityValid,
    traceabilityIntegrity,
  };
}

export function writeFeatureFilmShotAssembly(projectRoot?: string): FeatureFilmShotAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, FEATURE_FILM_SCENE_REGISTRY_PATH);
  const sceneDepGraph = readJson<{
    archetypes: { feature_film_archetype_id: string; nodes: SceneDependencyNode[] }[];
  }>(root, FEATURE_FILM_SCENE_DEPENDENCY_GRAPH_PATH);
  const blueprintArtifact = readJson<{ blueprints: BlueprintRecord[] }>(root, FEATURE_FILM_BLUEPRINT_PATH);

  const scenesByArchetype = new Map<string, SceneRecord[]>();
  for (const scene of sceneRegistry.entries) {
    const archetypeId = extractArchetypeId(scene.scene_id);
    const group = scenesByArchetype.get(archetypeId) ?? [];
    group.push(scene);
    scenesByArchetype.set(archetypeId, group);
  }

  const depByArchetype = new Map(
    sceneDepGraph.archetypes.map((entry) => [entry.feature_film_archetype_id, entry.nodes])
  );
  const blueprintByArchetype = new Map(
    blueprintArtifact.blueprints.map((bp) => [bp.feature_film_archetype_id, bp])
  );

  const allSceneIds = new Set(sceneRegistry.entries.map((scene) => scene.scene_id));

  const archetypeResults = TARGET_ARCHETYPE_IDS.map((archetypeId) => {
    const scenes = [...(scenesByArchetype.get(archetypeId) ?? [])].sort(
      (a, b) => a.scene_index - b.scene_index
    );
    const blueprint = blueprintByArchetype.get(archetypeId);
    if (!blueprint) {
      issues.push({
        code: 'BLUEPRINT_MISSING',
        message: `Missing blueprint for ${archetypeId}`,
        severity: 'error',
      });
    }
    const assembled = assembleArchetypeShots(
      archetypeId,
      scenes,
      depByArchetype.get(archetypeId) ?? [],
      blueprint ?? {
        feature_film_archetype_id: archetypeId,
        scene_count_target: scenes.length,
        scene_count_range: `${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        medium_film_source_ref: '',
        act_structure: { act_count: 3 },
        theme_arc: { primary_theme: 'default', theme_beats: [], symbolic_motifs: [] },
        legacy_callback_arc: { legacy_anchors: [], callback_depth: 3 },
        callback_layer: {
          callback_depth: 3,
          multi_callback_chain: true,
          entries: [],
          multi_callback_chains: [],
        },
      }
    );
    return {
      archetypeId,
      sceneCount: scenes.length,
      blueprint: blueprint ?? ({} as BlueprintRecord),
      ...assembled,
    };
  });

  const validation = validateAssembly(archetypeResults, allSceneIds);
  issues.push(...validation.issues);

  const totalSceneCount = archetypeResults.reduce((sum, r) => sum + r.sceneCount, 0);
  const totalShotCount = archetypeResults.reduce((sum, r) => sum + r.shots.length, 0);
  const coverageValidationPassed = archetypeResults.every((r) => r.violations.length === 0);
  const avgCallbackRatio =
    archetypeResults.reduce((sum, r) => sum + r.callbackCompletionRatio, 0) /
    Math.max(1, archetypeResults.length);
  const avgLegacyRatio =
    archetypeResults.reduce((sum, r) => sum + r.legacyCompletionRatio, 0) /
    Math.max(1, archetypeResults.length);

  if (totalShotCount < SHOT_COUNT_MIN || totalShotCount > SHOT_COUNT_MAX) {
    validation.shotScaleValid = false;
    issues.push({
      code: 'SHOT_COUNT_OUT_OF_RANGE',
      message: `total_shot_count=${totalShotCount} outside ${SHOT_COUNT_MIN}-${SHOT_COUNT_MAX}`,
      severity: 'error',
    });
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const dependencyIntegrity =
    validation.orphanSceneCount === 0 &&
    validation.orphanShotCount === 0 &&
    avgCallbackRatio >= 1 &&
    avgLegacyRatio >= 1
      ? 'PASS'
      : 'FAIL';
  const callbackResolutionIntegrity =
    avgCallbackRatio >= 1 &&
    errors.filter((e) => e.code === 'CALLBACK_RESOLUTION_INCOMPLETE').length === 0
      ? 'PASS'
      : 'FAIL';
  const legacyCallbackIntegrity =
    avgLegacyRatio >= 1 &&
    errors.filter((e) => e.code === 'LEGACY_CALLBACK_INCOMPLETE').length === 0
      ? 'PASS'
      : 'FAIL';

  const assemblyReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    coverageValidationPassed &&
    validation.coverageCollapseCount === 0 &&
    dependencyIntegrity === 'PASS' &&
    callbackResolutionIntegrity === 'PASS' &&
    legacyCallbackIntegrity === 'PASS' &&
    validation.shotScaleValid &&
    validation.shotPerSceneValid &&
    validation.shotDensityValid &&
    validation.traceabilityIntegrity === 'PASS' &&
    totalShotCount > 0;

  const shotSequence = {
    artifact_id: 'feature-film-shot-sequence-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    scene_registry_ref: FEATURE_FILM_SCENE_REGISTRY_PATH,
    adaptive_shot_generation: true,
    scene_driven_scaling: true,
    total_shot_count: totalShotCount,
    entries: archetypeResults.flatMap((result) =>
      result.shots.map((shot) => ({
        archetype: shot.archetype,
        scene_id: shot.scene_id,
        shot_id: shot.shot_id,
        shot_order: shot.shot_order,
      }))
    ),
    sequences: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      scene_count: result.sceneCount,
      shot_count: result.shots.length,
      shot_ids: result.shots.map((shot) => shot.shot_id),
    })),
  };

  const shotRegistry = {
    registry_id: 'feature-film-shot-registry-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    adaptive_shot_generation: true,
    scene_driven_scaling: true,
    coverage_roles: [...COVERAGE_ROLES],
    camera_motions: [...CAMERA_MOTIONS],
    continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
    continuity_dimensions: [...CONTINUITY_DIMENSIONS],
    callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
    multi_callback_chain: true,
    legacy_callback_support: true,
    required_fields: [...REQUIRED_REGISTRY_FIELDS],
    entries: archetypeResults.flatMap((result) => result.shots),
  };

  const shotDependencyGraph = {
    graph_id: 'feature-film-shot-dependency-graph-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: DEPENDENCY_DIMENSIONS.length,
    dimension_list: [...DEPENDENCY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      nodes: result.dependencyNodes,
    })),
  };

  const shotContinuityMap = {
    map_id: 'feature-film-shot-continuity-map-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      entries: result.continuityEntries,
    })),
  };

  const shotCoverageMap = {
    map_id: 'feature-film-shot-coverage-map-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    max_consecutive_same_coverage_role: MAX_CONSECUTIVE_COVERAGE_ROLE,
    coverage_collapse_count: validation.coverageCollapseCount,
    validation_passed: coverageValidationPassed && validation.coverageCollapseCount === 0,
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      role_distribution: COVERAGE_ROLES.reduce(
        (acc, role) => {
          acc[role] = result.coverageRoles.filter((entry) => entry === role).length;
          return acc;
        },
        {} as Record<string, number>
      ),
      violations: result.violations,
      validation_passed: result.violations.length === 0,
    })),
  };

  const shotScaleRules = {
    rules_id: 'feature-shot-scale-rules-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    global_min_shot_count: SHOT_COUNT_MIN,
    global_max_shot_count: SHOT_COUNT_MAX,
    adaptive_shot_generation: true,
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      target_shot_count: result.shots.length,
      min_shot_count: result.sceneCount * MIN_SHOTS_PER_SCENE,
      max_shot_count: result.sceneCount * MAX_SHOTS_PER_SCENE,
      scene_count: result.sceneCount,
    })),
  };

  const shotPerSceneRules = {
    rules_id: 'feature-shot-per-scene-rules-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    min_shots_per_scene: MIN_SHOTS_PER_SCENE,
    max_shots_per_scene: MAX_SHOTS_PER_SCENE,
    target_avg_shots_per_scene: TARGET_AVG_SHOTS_PER_SCENE,
    adaptive_shot_generation: true,
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      scene_count: result.sceneCount,
      shot_count: result.shots.length,
      avg_shots_per_scene: Number((result.shots.length / Math.max(1, result.sceneCount)).toFixed(2)),
    })),
  };

  const shotDensityBySceneType = {
    density_id: 'feature-shot-density-by-scene-type-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    density_categories: [...DENSITY_CATEGORIES],
    rules: DENSITY_BY_SCENE_TYPE,
    archetypes: archetypeResults.map((result) => ({
      feature_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      distribution: DENSITY_CATEGORIES.reduce(
        (acc, category) => {
          acc[category] = result.densityCategories.filter((entry) => entry === category).length;
          return acc;
        },
        {} as Record<string, number>
      ),
    })),
  };

  const report: FeatureFilmShotAssemblyReport = {
    report_id: 'feature-film-shot-assembly-report-v1',
    phase: FEATURE_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? FEATURE_FILM_SHOT_ASSEMBLY_PASS_VERDICT
      : FEATURE_FILM_SHOT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? FEATURE_FILM_SHOT_READY_STATUS : 'FEATURE_FILM_SHOT_INCOMPLETE',
    precheck,
    policy: {
      scene_artifacts_read_only: true,
      blueprint_artifacts_read_only: true,
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: archetypeResults.length,
      total_scene_count: totalSceneCount,
      total_shot_count: totalShotCount,
      adaptive_shot_generation: true,
      scene_driven_scaling: true,
      target_scene_range: `${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
      target_shot_range: `${SHOT_COUNT_MIN}-${SHOT_COUNT_MAX}`,
      coverage_roles: [...COVERAGE_ROLES],
      camera_motions: [...CAMERA_MOTIONS],
      coverage_validation_passed: coverageValidationPassed,
      coverage_collapse_count: validation.coverageCollapseCount,
      continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
      callback_resolution_integrity: callbackResolutionIntegrity,
      legacy_callback_integrity: legacyCallbackIntegrity,
      dependency_integrity: dependencyIntegrity,
      shot_scale_valid: validation.shotScaleValid,
      shot_per_scene_valid: validation.shotPerSceneValid,
      shot_density_valid: validation.shotDensityValid,
      traceability_integrity: validation.traceabilityIntegrity,
      orphan_scene_count: validation.orphanSceneCount,
      orphan_shot_count: validation.orphanShotCount,
      scene_artifact_mutation: 0,
      callback_depth_range: `${CALLBACK_DEPTH_MIN}-${CALLBACK_DEPTH_MAX}`,
      multi_callback_chain: true,
      legacy_callback_support: true,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      shot_sequence_path: FEATURE_FILM_SHOT_SEQUENCE_PATH,
      shot_registry_path: FEATURE_FILM_SHOT_REGISTRY_PATH,
      shot_dependency_graph_path: FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
      shot_continuity_map_path: FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH,
      shot_coverage_map_path: FEATURE_FILM_SHOT_COVERAGE_MAP_PATH,
      shot_scale_rules_path: FEATURE_SHOT_SCALE_RULES_PATH,
      shot_per_scene_rules_path: FEATURE_SHOT_PER_SCENE_RULES_PATH,
      shot_density_by_scene_type_path: FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH,
    },
    issues,
    feature_film_shot_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, FEATURE_FILM_SHOT_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, FEATURE_FILM_SHOT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_SEQUENCE_PATH),
    `${JSON.stringify(shotSequence, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_REGISTRY_PATH),
    `${JSON.stringify(shotRegistry, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH),
    `${JSON.stringify(shotDependencyGraph, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH),
    `${JSON.stringify(shotContinuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_COVERAGE_MAP_PATH),
    `${JSON.stringify(shotCoverageMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_SHOT_SCALE_RULES_PATH),
    `${JSON.stringify(shotScaleRules, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_SHOT_PER_SCENE_RULES_PATH),
    `${JSON.stringify(shotPerSceneRules, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH),
    `${JSON.stringify(shotDensityBySceneType, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
