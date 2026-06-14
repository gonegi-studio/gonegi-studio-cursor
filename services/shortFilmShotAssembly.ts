import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SCENE_REGISTRY_PATH,
  SHORT_FILM_SCENE_READY_STATUS,
} from './shortFilmSceneAssembly.js';

export const SHORT_FILM_SHOT_ASSEMBLY_PHASE = 'PHASE-L3-004' as const;
export const SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT = 'PASS_SHORT_FILM_SHOT_ASSEMBLY_V1' as const;
export const SHORT_FILM_SHOT_ASSEMBLY_FAIL_VERDICT = 'FAIL_SHORT_FILM_SHOT_ASSEMBLY_V1' as const;
export const SHORT_FILM_SHOT_READY_STATUS = 'SHORT_FILM_SHOT_READY' as const;

export const SHORT_FILM_SHOT_ASSEMBLY_EXPORT_DIR = 'exports/short_film_shot_assembly' as const;
export const SHORT_FILM_SHOT_SEQUENCE_PATH =
  'exports/short_film_shot_assembly/short-film-shot-sequence.json' as const;
export const SHORT_FILM_SHOT_REGISTRY_PATH =
  'exports/short_film_shot_assembly/short-film-shot-registry.json' as const;
export const SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH =
  'exports/short_film_shot_assembly/short-film-shot-dependency-graph.json' as const;
export const SHORT_FILM_SHOT_CONTINUITY_MAP_PATH =
  'exports/short_film_shot_assembly/short-film-shot-continuity-map.json' as const;
export const SHORT_FILM_SHOT_COVERAGE_MAP_PATH =
  'exports/short_film_shot_assembly/short-film-shot-coverage-map.json' as const;

export const SHORT_FILM_SHOT_ASSEMBLY_DIR = 'reports/short_film_shot_assembly' as const;
export const SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH =
  'reports/short_film_shot_assembly/SHORT_FILM_SHOT_ASSEMBLY_REPORT.json' as const;

export const SHOTS_PER_SCENE = 4 as const;
export const MAX_CONSECUTIVE_COVERAGE_ROLE = 3 as const;

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
  'character',
  'location',
  'lighting',
  'relationship',
  'timeline',
  'memory_callback',
  'coverage_role_continuity',
  'camera_motion_continuity',
] as const;

const REQUIRED_SHOT_FIELDS = [
  'shot_id',
  'scene_id',
  'shot_order',
  'shot_type',
  'camera_angle',
  'camera_distance',
  'duration_estimate',
  'coverage_role',
  'camera_motion',
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
  timeline_position: number;
  callback_refs: string[];
  continuity_refs: Record<string, string>;
  scene_goal: string;
  character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  emotion_id: string;
}

interface ShotRecord {
  shot_id: string;
  scene_id: string;
  shot_order: number;
  shot_type: string;
  camera_angle: string;
  camera_distance: string;
  duration_estimate: number;
  coverage_role: CoverageRole;
  camera_motion: CameraMotion;
}

interface ShotDependencyNode {
  shot_id: string;
  shot_order: number;
  shot_predecessor: string | null;
  shot_successor: string | null;
  coverage_dependency: { role: CoverageRole; depends_on_role: CoverageRole | null; dependency_type: string }[];
}

interface ShotContinuityEntry {
  shot_id: string;
  scene_id: string;
  inherited_from_scene: Record<string, string>;
  coverage_role_continuity: string;
  camera_motion_continuity: string;
}

export interface ShortFilmShotAssemblyReport {
  report_id: string;
  phase: typeof SHORT_FILM_SHOT_ASSEMBLY_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    short_film_scene_ready: boolean;
    pass_short_film_scene_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    production_ready_state_modified: boolean;
    scene_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  assembly_summary: {
    archetype_count: number;
    total_scene_count: number;
    total_shot_count: number;
    shots_per_scene: number;
    coverage_roles: string[];
    camera_motions: string[];
    coverage_validation_passed: boolean;
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
  short_film_shot_ready: boolean;
}

const COVERAGE_ROLE_PROFILE: Record<
  CoverageRole,
  { shot_type: string; camera_angle: string; camera_distance: string; camera_motion: CameraMotion }
> = {
  establishing: {
    shot_type: 'establishing',
    camera_angle: 'eye-level',
    camera_distance: 'wide',
    camera_motion: 'static',
  },
  dialogue: {
    shot_type: 'medium',
    camera_angle: 'eye-level',
    camera_distance: 'medium',
    camera_motion: 'static',
  },
  reaction: {
    shot_type: 'close',
    camera_angle: 'eye-level',
    camera_distance: 'close',
    camera_motion: 'push_in',
  },
  action: {
    shot_type: 'medium',
    camera_angle: 'low',
    camera_distance: 'medium',
    camera_motion: 'tracking',
  },
  transition: {
    shot_type: 'establishing',
    camera_angle: 'high',
    camera_distance: 'wide',
    camera_motion: 'pull_out',
  },
  callback: {
    shot_type: 'close',
    camera_angle: 'eye-level',
    camera_distance: 'close',
    camera_motion: 'push_in',
  },
  climax: {
    shot_type: 'close',
    camera_angle: 'low',
    camera_distance: 'close',
    camera_motion: 'push_in',
  },
  resolution: {
    shot_type: 'establishing',
    camera_angle: 'eye-level',
    camera_distance: 'wide',
    camera_motion: 'pull_out',
  },
};

const ACT_COVERAGE_ROTATION: Record<number, CoverageRole[]> = {
  1: ['establishing', 'dialogue', 'reaction', 'action'],
  2: ['action', 'dialogue', 'reaction', 'transition'],
  3: ['transition', 'reaction', 'callback', 'resolution'],
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

function sceneContinuityToShot(scene: SceneRecord): Record<string, string> {
  return {
    character: scene.continuity_refs.character_arc,
    location: scene.continuity_refs.location_arc,
    lighting: scene.continuity_refs.lighting_arc,
    relationship: scene.continuity_refs.relationship_arc,
    timeline: scene.continuity_refs.timeline_arc,
    memory_callback: scene.continuity_refs.memory_callback_arc,
  };
}

function isClimaxScene(scene: SceneRecord): boolean {
  return (
    scene.emotion_id === 'gratitude' ||
    scene.emotion_id === 'determination' ||
    scene.callback_refs.some((ref) => ref.startsWith('resolution:'))
  );
}

function isCallbackScene(scene: SceneRecord): boolean {
  return scene.callback_refs.length > 0;
}

function suggestCoverageRole(
  scene: SceneRecord,
  shotIndexInScene: number,
  totalShotsInScene: number
): CoverageRole {
  if (scene.scene_index === 1 && shotIndexInScene === 0) return 'establishing';
  if (isCallbackScene(scene) && shotIndexInScene === totalShotsInScene - 1) return 'callback';
  if (scene.act_id === 3 && scene.timeline_position >= 0.9 && shotIndexInScene === totalShotsInScene - 1) {
    return 'resolution';
  }
  if (isClimaxScene(scene) && shotIndexInScene === Math.floor(totalShotsInScene / 2)) {
    return 'climax';
  }

  const rotation = ACT_COVERAGE_ROTATION[scene.act_id] ?? ACT_COVERAGE_ROTATION[2];
  return rotation[shotIndexInScene % rotation.length] ?? 'dialogue';
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

function hasConsecutiveViolation(roles: CoverageRole[], limit: number): boolean {
  if (roles.length < limit) return false;
  const tail = roles.slice(-limit);
  return tail.every((role) => role === tail[0]);
}

function resolveCoverageRole(
  scene: SceneRecord,
  shotIndexInScene: number,
  recentRoles: CoverageRole[]
): CoverageRole {
  let role = suggestCoverageRole(scene, shotIndexInScene, SHOTS_PER_SCENE);
  const trial = [...recentRoles, role];
  if (hasConsecutiveViolation(trial, MAX_CONSECUTIVE_COVERAGE_ROLE + 1)) {
    role = pickAlternateRole(role, recentRoles, shotIndexInScene);
  }
  return role;
}

function durationForRole(role: CoverageRole): number {
  const durations: Record<CoverageRole, number> = {
    establishing: 6,
    dialogue: 5,
    reaction: 4,
    action: 5,
    transition: 4,
    callback: 6,
    climax: 7,
    resolution: 8,
  };
  return durations[role];
}

function buildShot(
  scene: SceneRecord,
  shotIndexInScene: number,
  globalShotOrder: number,
  coverageRole: CoverageRole,
  previousMotion: CameraMotion | null
): ShotRecord {
  const profile = COVERAGE_ROLE_PROFILE[coverageRole];
  const shotId = buildShotId(scene.scene_id, shotIndexInScene + 1);

  let cameraMotion = profile.camera_motion;
  if (previousMotion === cameraMotion && cameraMotion === 'static') {
    cameraMotion = shotIndexInScene % 2 === 0 ? 'pan_left' : 'pan_right';
  }

  return {
    shot_id: shotId,
    scene_id: scene.scene_id,
    shot_order: globalShotOrder,
    shot_type: profile.shot_type,
    camera_angle: profile.camera_angle,
    camera_distance: profile.camera_distance,
    duration_estimate: durationForRole(coverageRole),
    coverage_role: coverageRole,
    camera_motion: cameraMotion,
  };
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

function assembleArchetypeShots(scenes: SceneRecord[]): {
  shots: ShotRecord[];
  dependencyNodes: ShotDependencyNode[];
  continuityEntries: ShotContinuityEntry[];
  coverageRoles: CoverageRole[];
  violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
} {
  const shots: ShotRecord[] = [];
  const dependencyNodes: ShotDependencyNode[] = [];
  const continuityEntries: ShotContinuityEntry[] = [];
  const coverageRoles: CoverageRole[] = [];
  let globalShotOrder = 0;
  let previousMotion: CameraMotion | null = null;

  for (const scene of scenes) {
    const sceneShots: ShotRecord[] = [];

    for (let shotIndex = 0; shotIndex < SHOTS_PER_SCENE; shotIndex += 1) {
      globalShotOrder += 1;
      const coverageRole = resolveCoverageRole(scene, shotIndex, coverageRoles);
      const shot = buildShot(scene, shotIndex, globalShotOrder, coverageRole, previousMotion);
      sceneShots.push(shot);
      shots.push(shot);
      coverageRoles.push(coverageRole);
      previousMotion = shot.camera_motion;
    }

    for (const shot of sceneShots) {
      const shotIndex = shots.findIndex((entry) => entry.shot_id === shot.shot_id);
      dependencyNodes.push({
        shot_id: shot.shot_id,
        shot_order: shot.shot_order,
        shot_predecessor: shotIndex > 0 ? shots[shotIndex - 1].shot_id : null,
        shot_successor: shotIndex < shots.length - 1 ? shots[shotIndex + 1].shot_id : null,
        coverage_dependency: buildCoverageDependency(shot, sceneShots),
      });

      const priorShot = shotIndex > 0 ? shots[shotIndex - 1] : null;
      continuityEntries.push({
        shot_id: shot.shot_id,
        scene_id: shot.scene_id,
        inherited_from_scene: sceneContinuityToShot(scene),
        coverage_role_continuity: priorShot?.coverage_role ?? shot.coverage_role,
        camera_motion_continuity: priorShot?.camera_motion ?? shot.camera_motion,
      });
    }
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

  return { shots, dependencyNodes, continuityEntries, coverageRoles, violations };
}

function runPrecheck(root: string): {
  short_film_scene_ready: boolean;
  pass_short_film_scene_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: AssemblyIssue[];
} {
  const issues: AssemblyIssue[] = [];
  const reportPath = path.join(root, SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SCENE_REPORT_MISSING',
      message: `Missing scene assembly report at ${SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      short_film_scene_ready: false,
      pass_short_film_scene_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const sceneReport = readJson<Record<string, unknown>>(root, SHORT_FILM_SCENE_ASSEMBLY_REPORT_PATH);
  const status = String(sceneReport.status ?? '');
  const verdict = String(sceneReport.final_verdict ?? '');

  const short_film_scene_ready = status === SHORT_FILM_SCENE_READY_STATUS;
  const pass_short_film_scene_assembly_v1 = verdict === SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT;

  if (!short_film_scene_ready) {
    issues.push({
      code: 'SCENE_NOT_READY',
      message: `Expected status=${SHORT_FILM_SCENE_READY_STATUS}, got ${status}`,
      severity: 'error',
    });
  }
  if (!pass_short_film_scene_assembly_v1) {
    issues.push({
      code: 'SCENE_VERDICT_FAIL',
      message: `Expected final_verdict=${SHORT_FILM_SCENE_ASSEMBLY_PASS_VERDICT}, got ${verdict}`,
      severity: 'error',
    });
  }

  return {
    short_film_scene_ready,
    pass_short_film_scene_assembly_v1,
    precheck_passed: short_film_scene_ready && pass_short_film_scene_assembly_v1,
    issues,
  };
}

function validateShots(
  archetypeResults: {
    archetypeId: string;
    shots: ShotRecord[];
    violations: { shot_id: string; consecutive_role: CoverageRole; count: number }[];
  }[]
): AssemblyIssue[] {
  const issues: AssemblyIssue[] = [];

  for (const result of archetypeResults) {
    for (const shot of result.shots) {
      for (const field of REQUIRED_SHOT_FIELDS) {
        if (!(field in shot)) {
          issues.push({
            code: 'MISSING_SHOT_FIELD',
            message: `${shot.shot_id}: missing ${field}`,
            severity: 'error',
          });
        }
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
      issues.push({
        code: 'COVERAGE_CONSECUTIVE_VIOLATION',
        message: `${violation.shot_id}: ${violation.count} consecutive ${violation.consecutive_role} shots`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function writeShortFilmShotAssembly(projectRoot?: string): ShortFilmShotAssemblyReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: AssemblyIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, SHORT_FILM_SCENE_REGISTRY_PATH);
  const scenesByArchetype = new Map<string, SceneRecord[]>();

  for (const scene of sceneRegistry.entries) {
    const archetypeId = extractArchetypeId(scene.scene_id);
    const group = scenesByArchetype.get(archetypeId) ?? [];
    group.push(scene);
    scenesByArchetype.set(archetypeId, group);
  }

  const archetypeResults = [...scenesByArchetype.entries()].map(([archetypeId, scenes]) => {
    const sortedScenes = [...scenes].sort((a, b) => a.scene_index - b.scene_index);
    const assembled = assembleArchetypeShots(sortedScenes);
    return { archetypeId, sceneCount: sortedScenes.length, ...assembled };
  });

  issues.push(...validateShots(archetypeResults));

  const totalSceneCount = archetypeResults.reduce((sum, result) => sum + result.sceneCount, 0);
  const totalShotCount = archetypeResults.reduce((sum, result) => sum + result.shots.length, 0);
  const coverageValidationPassed = archetypeResults.every((result) => result.violations.length === 0);
  const errors = issues.filter((issue) => issue.severity === 'error');
  const assemblyReady = precheck.precheck_passed && errors.length === 0 && coverageValidationPassed;

  const shotSequence = {
    artifact_id: 'short-film-shot-sequence-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    scene_registry_ref: SHORT_FILM_SCENE_REGISTRY_PATH,
    shots_per_scene: SHOTS_PER_SCENE,
    total_shot_count: totalShotCount,
    sequences: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
      scene_count: result.sceneCount,
      shot_count: result.shots.length,
      shot_ids: result.shots.map((shot) => shot.shot_id),
    })),
  };

  const shotRegistry = {
    registry_id: 'short-film-shot-registry-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    shots_per_scene: SHOTS_PER_SCENE,
    coverage_roles: [...COVERAGE_ROLES],
    camera_motions: [...CAMERA_MOTIONS],
    required_fields: [...REQUIRED_SHOT_FIELDS],
    entries: archetypeResults.flatMap((result) => result.shots),
  };

  const shotDependencyGraph = {
    graph_id: 'short-film-shot-dependency-graph-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    dependency_dimensions: ['shot_predecessor', 'shot_successor', 'coverage_dependency'],
    archetypes: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      nodes: result.dependencyNodes,
    })),
  };

  const shotContinuityMap = {
    map_id: 'short-film-shot-continuity-map-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimensions: CONTINUITY_DIMENSIONS.length,
    dimension_list: [...CONTINUITY_DIMENSIONS],
    archetypes: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
      shot_count: result.shots.length,
      entries: result.continuityEntries,
    })),
  };

  const shotCoverageMap = {
    map_id: 'short-film-shot-coverage-map-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    max_consecutive_coverage_role: MAX_CONSECUTIVE_COVERAGE_ROLE,
    validation_passed: coverageValidationPassed,
    archetypes: archetypeResults.map((result) => ({
      short_film_archetype_id: result.archetypeId,
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

  const report: ShortFilmShotAssemblyReport = {
    report_id: 'short-film-shot-assembly-report-v1',
    phase: SHORT_FILM_SHOT_ASSEMBLY_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: assemblyReady
      ? SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT
      : SHORT_FILM_SHOT_ASSEMBLY_FAIL_VERDICT,
    status: assemblyReady ? SHORT_FILM_SHOT_READY_STATUS : 'SHORT_FILM_SHOT_INCOMPLETE',
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      production_ready_state_modified: false,
      scene_artifacts_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    assembly_summary: {
      archetype_count: archetypeResults.length,
      total_scene_count: totalSceneCount,
      total_shot_count: totalShotCount,
      shots_per_scene: SHOTS_PER_SCENE,
      coverage_roles: [...COVERAGE_ROLES],
      camera_motions: [...CAMERA_MOTIONS],
      coverage_validation_passed: coverageValidationPassed,
      target_archetypes: archetypeResults.map((result) => result.archetypeId),
    },
    outputs: {
      shot_sequence_path: SHORT_FILM_SHOT_SEQUENCE_PATH,
      shot_registry_path: SHORT_FILM_SHOT_REGISTRY_PATH,
      shot_dependency_graph_path: SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
      shot_continuity_map_path: SHORT_FILM_SHOT_CONTINUITY_MAP_PATH,
      shot_coverage_map_path: SHORT_FILM_SHOT_COVERAGE_MAP_PATH,
    },
    issues,
    short_film_shot_ready: assemblyReady,
  };

  fs.mkdirSync(path.join(root, SHORT_FILM_SHOT_ASSEMBLY_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, SHORT_FILM_SHOT_ASSEMBLY_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_SEQUENCE_PATH),
    `${JSON.stringify(shotSequence, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_REGISTRY_PATH),
    `${JSON.stringify(shotRegistry, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_DEPENDENCY_GRAPH_PATH),
    `${JSON.stringify(shotDependencyGraph, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_CONTINUITY_MAP_PATH),
    `${JSON.stringify(shotContinuityMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_COVERAGE_MAP_PATH),
    `${JSON.stringify(shotCoverageMap, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
