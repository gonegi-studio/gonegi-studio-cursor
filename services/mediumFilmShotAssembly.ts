import fs from 'node:fs';
import path from 'node:path';
import { MEDIUM_FILM_BLUEPRINT_PATH } from './mediumFilmBlueprintAssembly.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SCENE_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH,
  MEDIUM_FILM_SCENE_REGISTRY_PATH,
  MEDIUM_FILM_SCENE_READY_STATUS,
  MEDIUM_FILM_SCENE_SEQUENCE_PATH,
} from './mediumFilmSceneAssembly.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MEDIUM_FILM_SHOT_ASSEMBLY_PHASE = 'PHASE-L3-MEDIUM-004' as const;
export const MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT = 'PASS_MEDIUM_FILM_SHOT_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_SHOT_ASSEMBLY_FAIL_VERDICT = 'FAIL_MEDIUM_FILM_SHOT_ASSEMBLY_V1' as const;
export const MEDIUM_FILM_SHOT_READY_STATUS = 'MEDIUM_FILM_SHOT_READY' as const;

export const MEDIUM_FILM_SHOT_ASSEMBLY_EXPORT_DIR = 'exports/medium_film_shot_assembly' as const;
export const MEDIUM_FILM_SHOT_SEQUENCE_PATH =
  'exports/medium_film_shot_assembly/medium-film-shot-sequence.json' as const;
export const MEDIUM_FILM_SHOT_REGISTRY_PATH =
  'exports/medium_film_shot_assembly/medium-film-shot-registry.json' as const;
export const MEDIUM_FILM_SHOT_DEPENDENCY_GRAPH_PATH =
  'exports/medium_film_shot_assembly/medium-film-shot-dependency-graph.json' as const;
export const MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH =
  'exports/medium_film_shot_assembly/medium-film-shot-continuity-map.json' as const;
export const MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH =
  'exports/medium_film_shot_assembly/medium-film-shot-coverage-map.json' as const;

export const MEDIUM_FILM_SHOT_ASSEMBLY_DIR = 'reports/medium_film_shot_assembly' as const;
export const MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH =
  'reports/medium_film_shot_assembly/MEDIUM_FILM_SHOT_ASSEMBLY_REPORT.json' as const;

const TARGET_ARCHETYPE_IDS = [
  'harbor_saga_medium',
  'mediterranean_chronicle_medium',
  'correspondence_saga_medium',
] as const;

const SCENE_COUNT_MIN = 300;
const SCENE_COUNT_MAX = 1000;
const SHOT_COUNT_MIN = 1200;
const SHOT_COUNT_MAX = 8000;
const MAX_CONSECUTIVE_COVERAGE_ROLE = 3 as const;
const CALLBACK_RESOLUTION_RATIO_MIN = 0.9;

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
] as const;

const SHOT_SCALE_BY_SCENE_TYPE: Record<string, number> = {
  setup: 3,
  progression: 4,
  conflict: 5,
  callback: 5,
  resolution: 4,
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
  }[];
  arc_dependency: { arc_ref: string; dependency_type: string }[];
  timeline_dependency: { dependency_type: string; source_scene_index: number }[];
  world_dependency: { world_stage: string; location_id: string }[];
  relationship_dependency: { from: string; to: string; relationship_type: string }[];
}

interface CallbackLayerEntry {
  anchor_id: string;
  layer_id: string;
  callback_seed: number;
  callback_reference: number | null;
  callback_resolution: number | null;
  callback_completion_state: string;
  multi_callback_chain: string[];
}

interface BlueprintRecord {
  medium_film_archetype_id: string;
  scene_count_target: number;
  scene_count_range: string;
  callback_layer: {
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
  anchor_id: string;
}

interface ShotRecord {
  shot_id: string;
  scene_id: string;
  archetype: string;
  shot_order: number;
  shot_order_in_scene: number;
  coverage_role: CoverageRole;
  camera_motion: CameraMotion;
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
  coverage_dependency: { role: CoverageRole; depends_on_role: CoverageRole | null; dependency_type: string }[];
  callback_dependency: CallbackResolution[];
}

interface ShotContinuityEntry {
  shot_id: string;
  scene_id: string;
  archetype: string;
  inherited_from_scene: Record<string, string>;
  coverage_role_continuity: string;
  camera_motion_continuity: string;
}

export interface MediumFilmShotAssemblyReport {
  report_id: string;
  phase: typeof MEDIUM_FILM_SHOT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    medium_film_scene_ready: boolean;
    pass_medium_film_scene_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    production_ready_state_modified: boolean;
    scene_artifacts_read_only: boolean;
    blueprint_artifacts_read_only: boolean;
    foundation_artifacts_read_only: boolean;
    short_film_artifacts_read_only: boolean;
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
    callback_resolution_ratio: number;
    callback_resolution_percent: number;
    dependency_integrity: string;
    orphan_scene_count: number;
    orphan_shot_count: number;
    scene_artifact_mutation: number;
    target_archetypes: string[];
  };
  outputs: {
    shot_sequence_path: string;
    shot_registry_path: string;
    shot_dependency_graph_path: string;
    shot_continuity_map_path: string;
    shot_coverage_map_path: string;
  };
  issues: AssemblyIssue[];
  medium_film_shot_ready: boolean;
}

const COVERAGE_ROLE_PROFILE: Record<
  CoverageRole,
  { camera_motion: CameraMotion }
> = {
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
  2: ['action', 'dialogue', 'reaction', 'transition', 'climax'],
  3: ['transition', 'reaction', 'callback', 'climax', 'resolution'],
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

function shotsPerScene(scene: SceneRecord): number {
  const base = SHOT_SCALE_BY_SCENE_TYPE[scene.scene_type] ?? 4;
  if (scene.act_id === 3 && (scene.scene_type === 'resolution' || scene.scene_type === 'callback')) {
    return Math.min(5, base);
  }
  if (scene.scene_type === 'conflict' && scene.arc_role === 'main') {
    return 5;
  }
  return base;
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
  totalShotsInScene: number
): CoverageRole {
  if (scene.scene_index === 1 && shotIndexInScene === 0) return 'establishing';
  if (isCallbackScene(scene) && shotIndexInScene === totalShotsInScene - 1) return 'callback';
  if (isResolutionScene(scene) && shotIndexInScene === totalShotsInScene - 1) return 'resolution';
  if (scene.act_id === 3 && scene.timeline_position >= 0.85 && shotIndexInScene === Math.floor(totalShotsInScene / 2)) {
    return 'climax';
  }
  const rotation = ACT_COVERAGE_ROTATION[scene.act_id] ?? ACT_COVERAGE_ROTATION[2];
  return rotation[shotIndexInScene % rotation.length] ?? 'dialogue';
}

function resolveCoverageRole(
  scene: SceneRecord,
  shotIndexInScene: number,
  totalShotsInScene: number,
  recentRoles: CoverageRole[]
): CoverageRole {
  let role = suggestCoverageRole(scene, shotIndexInScene, totalShotsInScene);
  const trial = [...recentRoles, role];
  if (hasConsecutiveViolation(trial, MAX_CONSECUTIVE_COVERAGE_ROLE + 1)) {
    role = pickAlternateRole(role, recentRoles, shotIndexInScene);
  }
  return role;
}

function buildCoverageDependency(
  shot: ShotRecord,
  shotsInScene: ShotRecord[]
): ShotDependencyNode['coverage_dependency'] {
  const deps: ShotDependencyNode['coverage_dependency'] = [];
  const indexInScene = shotsInScene.findIndex((entry) => entry.shot_id === shot.shot_id);

  if (shot.coverage_role === 'dialogue' || shot.coverage_role === 'reaction') {
    const establishing = shotsInScene.find((entry) => entry.coverage_role === 'establishing');
    if (establishing) {
      deps.push({
        role: shot.coverage_role,
        depends_on_role: 'establishing',
        dependency_type: 'coverage_establish_before_dialogue',
      });
    }
  }

  if (shot.coverage_role === 'callback' || shot.coverage_role === 'climax') {
    deps.push({
      role: shot.coverage_role,
      depends_on_role: indexInScene > 0 ? shotsInScene[indexInScene - 1].coverage_role : null,
      dependency_type: 'coverage_narrative_payoff',
    });
  }

  if (shot.coverage_role === 'resolution') {
    deps.push({
      role: 'resolution',
      depends_on_role: 'climax',
      dependency_type: 'coverage_resolution_after_climax',
    });
  }

  return deps;
}

function hasAnchorLinkage(scene: SceneRecord, anchorId: string): boolean {
  return (
    scene.callback_refs.some((ref) => ref.endsWith(`:${anchorId}`)) ||
    scene.continuity_refs.memory_callback_arc === anchorId
  );
}

function isCallbackPairComplete(
  entry: CallbackLayerEntry,
  blueprint: BlueprintRecord,
  scenes: SceneRecord[],
  shotsBySceneId: Map<string, ShotRecord[]>
): { complete: boolean; seedShot: ShotRecord | null; payoffShot: ShotRecord | null; resolution: CallbackResolution | null } {
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
    payoffScene.act_id === 3 ||
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
          anchor_id: entry.anchor_id,
        }
      : null;

  return { complete, seedShot, payoffShot, resolution };
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
  violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
  callbackResolutions: CallbackResolution[];
  callbackCompletionRatio: number;
} {
  const depBySceneId = new Map(sceneDepNodes.map((node) => [node.scene_id, node]));
  const shots: ShotRecord[] = [];
  const dependencyNodes: ShotDependencyNode[] = [];
  const continuityEntries: ShotContinuityEntry[] = [];
  const coverageRoles: CoverageRole[] = [];
  const shotsBySceneId = new Map<string, ShotRecord[]>();
  let globalShotOrder = 0;
  let previousMotion: CameraMotion | null = null;

  for (const scene of scenes) {
    const totalShotsInScene = shotsPerScene(scene);
    const sceneShots: ShotRecord[] = [];
    const depNode = depBySceneId.get(scene.scene_id);

    for (let shotIndex = 0; shotIndex < totalShotsInScene; shotIndex += 1) {
      globalShotOrder += 1;
      const coverageRole = resolveCoverageRole(scene, shotIndex, totalShotsInScene, coverageRoles);
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
      previousMotion = cameraMotion;
    }

    shotsBySceneId.set(scene.scene_id, sceneShots);

    for (const shot of sceneShots) {
      const shotIndex = shots.findIndex((entry) => entry.shot_id === shot.shot_id);
      dependencyNodes.push({
        shot_id: shot.shot_id,
        shot_order: shot.shot_order,
        shot_predecessor: shotIndex > 0 ? shots[shotIndex - 1].shot_id : null,
        shot_successor: shotIndex < shots.length - 1 ? shots[shotIndex + 1].shot_id : null,
        coverage_dependency: buildCoverageDependency(shot, sceneShots),
        callback_dependency: [],
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
  const totalPairs = blueprint.callback_layer.entries.length;

  for (const entry of blueprint.callback_layer.entries) {
    const result = isCallbackPairComplete(entry, blueprint, scenes, shotsBySceneId);
    if (result.resolution) {
      callbackResolutions.push(result.resolution);
      if (result.seedShot) {
        result.seedShot.callback_resolution = result.resolution;
      }
      if (result.payoffShot && result.payoffShot.shot_id !== result.seedShot?.shot_id) {
        result.payoffShot.callback_resolution = result.resolution;
      }
      const depNode = dependencyNodes.find((node) => node.shot_id === result.payoffShot?.shot_id);
      if (depNode) {
        depNode.callback_dependency.push(result.resolution);
      }
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

  const callbackCompletionRatio = totalPairs > 0 ? completedPairs / totalPairs : 1;

  return {
    shots,
    dependencyNodes,
    continuityEntries,
    coverageRoles,
    violations,
    callbackResolutions,
    callbackCompletionRatio,
  };
}

function runPrecheck(root: string): {
  medium_film_scene_ready: boolean;
  pass_medium_film_scene_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SCENE_REPORT_MISSING',
      message: `Missing scene assembly report at ${MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      medium_film_scene_ready: false,
      pass_medium_film_scene_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const sceneReport = readJson<Record<string, unknown>>(root, MEDIUM_FILM_SCENE_ASSEMBLY_REPORT_PATH);
  const status = String(sceneReport.status ?? '');
  const verdict = String(sceneReport.final_verdict ?? '');

  const medium_film_scene_ready = status === MEDIUM_FILM_SCENE_READY_STATUS;
  const pass_medium_film_scene_assembly_v1 = verdict === MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT;

  if (!medium_film_scene_ready) {
    issues.push({
      code: 'SCENE_NOT_READY',
      message: `Expected status=${MEDIUM_FILM_SCENE_READY_STATUS}, got ${status}`,
      severity: 'error',
    });
  }
  if (!pass_medium_film_scene_assembly_v1) {
    issues.push({
      code: 'SCENE_VERDICT_FAIL',
      message: `Expected final_verdict=${MEDIUM_FILM_SCENE_ASSEMBLY_PASS_VERDICT}, got ${verdict}`,
      severity: 'error',
    });
  }

  return {
    medium_film_scene_ready,
    pass_medium_film_scene_assembly_v1,
    precheck_passed: medium_film_scene_ready && pass_medium_film_scene_assembly_v1,
    issues,
  };
}

function validateAssembly(
  archetypeResults: {
    archetypeId: string;
    shots: ShotRecord[];
    violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
    callbackCompletionRatio: number;
    sceneCount: number;
  }[],
  allSceneIds: Set<string>
): {
  issues: AssemblyIssue[];
  orphanSceneCount: number;
  orphanShotCount: number;
  coverageCollapseCount: number;
} {
  const issues: AssemblyIssue[] = [];
  let orphanSceneCount = 0;
  let orphanShotCount = 0;
  let coverageCollapseCount = 0;

  const coveredSceneIds = new Set<string>();
  const shotIds = new Set<string>();

  for (const result of archetypeResults) {
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

      const continuityCount = Object.keys(shot.continuity_refs).length;
      if (continuityCount < CONTINUITY_DIMENSIONS.length) {
        issues.push({
          code: 'CONTINUITY_DIMENSION_SHORTFALL',
          message: `${shot.shot_id}: continuity_refs has ${continuityCount} dimensions`,
          severity: 'error',
        });
      }

      if (!COVERAGE_ROLES.includes(shot.coverage_role)) {
        issues.push({
          code: 'INVALID_COVERAGE_ROLE',
          message: `${shot.shot_id}: invalid coverage_role ${shot.coverage_role}`,
          severity: 'error',
        });
      }
      if (!CAMERA_MOTIONS.includes(shot.camera_motion)) {
        issues.push({
          code: 'INVALID_CAMERA_MOTION',
          message: `${shot.shot_id}: invalid camera_motion ${shot.camera_motion}`,
          severity: 'error',
        });
      }
    }

    for (const violation of result.violations) {
      coverageCollapseCount += 1;
      issues.push({
        code: 'COVERAGE_CONSECUTIVE_VIOLATION',
        message: `${violation.shot_id}: ${violation.count} consecutive ${violation.consecutive_role} shots`,
        severity: 'error',
      });
    }

    if (result.callbackCompletionRatio < CALLBACK_RESOLUTION_RATIO_MIN) {
      issues.push({
        code: 'CALLBACK_RESOLUTION_RATIO_LOW',
        message: `${result.archetypeId}: callback_resolution_ratio=${result.callbackCompletionRatio.toFixed(2)}`,
        severity: 'error',
      });
    }

    if (result.sceneCount < SCENE_COUNT_MIN || result.sceneCount > SCENE_COUNT_MAX) {
      issues.push({
        code: 'SCENE_COUNT_OUT_OF_RANGE',
        message: `${result.archetypeId}: scene_count=${result.sceneCount} outside ${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
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

  return { issues, orphanSceneCount, orphanShotCount, coverageCollapseCount };
}

export function writeMediumFilmShotAssembly(projectRoot?: string): MediumFilmShotAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, MEDIUM_FILM_SCENE_REGISTRY_PATH);
  const sceneDepGraph = readJson<{
    archetypes: { medium_film_archetype_id: string; nodes: SceneDependencyNode[] }[];
  }>(root, MEDIUM_FILM_SCENE_DEPENDENCY_GRAPH_PATH);
  const blueprintArtifact = readJson<{ blueprints: BlueprintRecord[] }>(root, MEDIUM_FILM_BLUEPRINT_PATH);

  const scenesByArchetype = new Map<string, SceneRecord[]>();
  for (const scene of sceneRegistry.entries) {
    const archetypeId = extractArchetypeId(scene.scene_id);
    const group = scenesByArchetype.get(archetypeId) ?? [];
    group.push(scene);
    scenesByArchetype.set(archetypeId, group);
  }

  const depByArchetype = new Map(
    sceneDepGraph.archetypes.map((entry) => [entry.medium_film_archetype_id, entry.nodes])
  );
  const blueprintByArchetype = new Map(
    blueprintArtifact.blueprints.map((bp) => [bp.medium_film_archetype_id, bp])
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
        medium_film_archetype_id: archetypeId,
        scene_count_target: scenes.length,
        scene_count_range: `${SCENE_COUNT_MIN}-${SCENE_COUNT_MAX}`,
        callback_layer: { entries: [], multi_callback_chains: [] },
      }
    );
    return { archetypeId, sceneCount: scenes.length, ...assembled };
  });

  const validation = validateAssembly(archetypeResults, allSceneIds);
  issues.push(...validation.issues);

  const totalSceneCount = archetypeResults.reduce((sum, result) => sum + result.sceneCount, 0);
  const totalShotCount = archetypeResults.reduce((sum, result) => sum + result.shots.length, 0);
  const coverageValidationPassed = archetypeResults.every((result) => result.violations.length === 0);
  const avgCallbackRatio =
    archetypeResults.reduce((sum, result) => sum + result.callbackCompletionRatio, 0) /
    Math.max(1, archetypeResults.length);

  if (totalShotCount < SHOT_COUNT_MIN || totalShotCount > SHOT_COUNT_MAX) {
    issues.push({
      code: 'SHOT_COUNT_OUT_OF_RANGE',
      message: `total_shot_count=${totalShotCount} outside ${SHOT_COUNT_MIN}-${SHOT_COUNT_MAX}`,
      severity: 'error',
    });
  }

  const presentArchetypes = new Set(archetypeResults.map((r) => r.archetypeId));
  for (const archetypeId of TARGET_ARCHETYPE_IDS) {
    if (!presentArchetypes.has(archetypeId)) {
      issues.push({
        code: 'ARCHETYPE_MISSING',
        message: `Missing archetype ${archetypeId}`,
        severity: 'error',
      });
    }
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const dependencyIntegrity =
    validation.orphanSceneCount === 0 &&
    validation.orphanShotCount === 0 &&
    avgCallbackRatio >= CALLBACK_RESOLUTION_RATIO_MIN
      ? 'PASS'
      : 'FAIL';

  const assemblyReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    coverageValidationPassed &&
    validation.coverageCollapseCount === 0 &&
    dependencyIntegrity === 'PASS' &&
    totalShotCount >= SHOT_COUNT_MIN &&
    totalShotCount <= SHOT_COUNT_MAX;

  const shotSequence = {
    artifact_id: 'medium-film-shot-sequence-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    scene_registry_ref: MEDIUM_FILM_SCENE_REGISTRY_PATH,
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
      medium_film_archetype_id: result.archetypeId,
      scene_count: result.sceneCount,
      shot_count: result.shots.length,
      shot_ids: result.shots.map((shot) => shot.shot_id),
    })),
  };

  const shotRegistry = {
    registry_id: 'medium-film-shot-registry-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    adaptive_shot_generation: true,
    scene_driven_scaling: true,
    coverage_roles: [...COVERAGE_ROLES],
    camera_motions: [...CAMERA_MOTIONS],
    continuity_dimensions: [...CONTINUITY_DIMENSIONS],
    required_fields: [...REQUIRED_REGISTRY_FIELDS],
    entries: archetypeResults.flatMap((result) => result.shots),
  };

  const shotDependencyGraph = {
    graph_id: 'medium-film-shot-dependency-graph-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: ['shot_predecessor', 'shot_successor', 'coverage_dependency', 'callback_dependency'],
    archetypes: archetypeResults.map((result) => ({
      medium_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      nodes: result.dependencyNodes,
    })),
  };

  const shotContinuityMap = {
    map_id: 'medium-film-shot-continuity-map-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimension_count: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => ({
      medium_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      entries: result.continuityEntries,
    })),
  };

  const shotCoverageMap = {
    map_id: 'medium-film-shot-coverage-map-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    max_consecutive_same_coverage_role: MAX_CONSECUTIVE_COVERAGE_ROLE,
    coverage_collapse_count: validation.coverageCollapseCount,
    validation_passed: coverageValidationPassed && validation.coverageCollapseCount === 0,
    archetypes: archetypeResults.map((result) => ({
      medium_film_archetype_id: result.archetypeId,
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

  const report: MediumFilmShotAssemblyReport = {
    report_id: 'medium-film-shot-assembly-report-v1',
    phase: MEDIUM_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT
      : MEDIUM_FILM_SHOT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? MEDIUM_FILM_SHOT_READY_STATUS : 'MEDIUM_FILM_SHOT_INCOMPLETE',
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      production_ready_state_modified: false,
      scene_artifacts_read_only: true,
      blueprint_artifacts_read_only: true,
      foundation_artifacts_read_only: true,
      short_film_artifacts_read_only: true,
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
      callback_resolution_ratio: Number(avgCallbackRatio.toFixed(4)),
      callback_resolution_percent: Number((avgCallbackRatio * 100).toFixed(2)),
      dependency_integrity: dependencyIntegrity,
      orphan_scene_count: validation.orphanSceneCount,
      orphan_shot_count: validation.orphanShotCount,
      scene_artifact_mutation: 0,
      target_archetypes: [...TARGET_ARCHETYPE_IDS],
    },
    outputs: {
      shot_sequence_path: MEDIUM_FILM_SHOT_SEQUENCE_PATH,
      shot_registry_path: MEDIUM_FILM_SHOT_REGISTRY_PATH,
      shot_dependency_graph_path: MEDIUM_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
      shot_continuity_map_path: MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH,
      shot_coverage_map_path: MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH,
    },
    issues,
    medium_film_shot_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, MEDIUM_FILM_SHOT_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, MEDIUM_FILM_SHOT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_SEQUENCE_PATH),
    `${JSON.stringify(shotSequence, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_REGISTRY_PATH),
    `${JSON.stringify(shotRegistry, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_DEPENDENCY_GRAPH_PATH),
    `${JSON.stringify(shotDependencyGraph, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH),
    `${JSON.stringify(shotContinuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH),
    `${JSON.stringify(shotCoverageMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
