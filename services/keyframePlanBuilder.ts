import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { SceneState } from './sceneStateBuilder.js';
import {
  loadSceneState,
  loadVideoShotState,
  type VideoShotState,
} from './videoShotStateBuilder.js';

export const KEYFRAME_PLAN_PHASE = 'PHASE-20-KEYFRAME-PLAN-BUILDER-001' as const;
export const KEYFRAME_PLAN_REGISTRY_PATH = 'datasets/keyframe_plan/keyframe-plan-registry.json' as const;

export const SEED_KEYFRAME_PLAN_SPECS = Object.freeze([
  {
    keyframe_plan_id: 'keyframe_plan_gonegi_bedroom_reading_6s_v1',
    source_video_shot_state_id: 'video_gonegi_bedroom_reading_6s_v1',
  },
  {
    keyframe_plan_id: 'keyframe_plan_gonegi_dana_harbor_reunion_8s_v1',
    source_video_shot_state_id: 'video_gonegi_dana_harbor_reunion_8s_v1',
  },
  {
    keyframe_plan_id: 'keyframe_plan_olive_hill_wonder_6s_v1',
    source_video_shot_state_id: 'video_olive_hill_wonder_6s_v1',
  },
] as const);

export type KeyframeRole = 'start' | 'transition' | 'midpoint' | 'end';

export type KeyframeEntry = {
  keyframe_index: number;
  timestamp: number;
  keyframe_role: KeyframeRole;
  scene_state_ref: string;
  camera_state: {
    shot_type: string;
    motion_progress: number;
    motion_type: string;
    camera_position?: string;
    camera_height?: string;
    identity_safe: boolean;
  };
  character_state: {
    active_character_ids: string[];
    positions: Record<string, string>;
    beat_phase: string;
  };
  emotion_state: {
    emotion_id: string;
    intensity: number;
    arc_type: string;
  };
  composition_state: {
    composition_id?: string;
    prop_anchor_ids: string[];
    character_positions: Record<string, string>;
  };
  location_state: {
    location_id: string;
    layout_lock_id?: string;
    outdoor_layout_id?: string;
    location_lock_preserved: boolean;
  };
  identity_state: {
    protected_character_ids: string[];
    identity_lock_tokens: string[];
  };
  continuity_locks: {
    identity_locks: string[];
    location_locks: string[];
    composition_locks: string[];
  };
};

export type KeyframePlan = {
  keyframe_plan_id: string;
  phase: typeof KEYFRAME_PLAN_PHASE;
  source_video_shot_state_id: string;
  source_scene_state_id: string;
  duration_seconds: number;
  fps_target: number;
  keyframes: KeyframeEntry[];
  built_at: string;
};

type KeyframeSchedule = {
  timestamp: number;
  role: KeyframeRole;
  motion_progress: number;
};

function roundTimestamp(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function deriveKeyframeSchedule(durationSeconds: number): KeyframeSchedule[] {
  if (durationSeconds <= 6) {
    return [
      { timestamp: 0, role: 'start', motion_progress: 0 },
      { timestamp: roundTimestamp(durationSeconds / 2), role: 'transition', motion_progress: 0.5 },
      { timestamp: durationSeconds, role: 'end', motion_progress: 1 },
    ];
  }

  return [
    { timestamp: 0, role: 'start', motion_progress: 0 },
    { timestamp: roundTimestamp(durationSeconds * 0.33), role: 'transition', motion_progress: 0.33 },
    { timestamp: roundTimestamp(durationSeconds / 2), role: 'midpoint', motion_progress: 0.5 },
    { timestamp: durationSeconds, role: 'end', motion_progress: 1 },
  ];
}

function interpolateEmotion(
  progress: number,
  start: number,
  end: number
): number {
  return Math.round((start + (end - start) * progress) * 1000) / 1000;
}

function beatPhaseForRole(role: KeyframeRole): string {
  switch (role) {
    case 'start':
      return 'establish';
    case 'transition':
      return 'develop';
    case 'midpoint':
      return 'peak_hold';
    case 'end':
      return 'resolve';
    default:
      return 'hold';
  }
}

function shotTypeForProgress(scene: SceneState, progress: number): string {
  const base = scene.camera_state.shot_type;
  if (progress >= 0.85 && (base === 'medium' || base === 'wide')) {
    return base === 'wide' ? 'medium' : 'close';
  }
  return base;
}

function buildKeyframeEntry(
  index: number,
  schedule: KeyframeSchedule,
  video: VideoShotState,
  scene: SceneState
): KeyframeEntry {
  const positions: Record<string, string> = {};
  for (const motion of video.character_motion) {
    positions[motion.character_id] = motion.start_position ?? 'scene_anchor';
  }

  return {
    keyframe_index: index,
    timestamp: schedule.timestamp,
    keyframe_role: schedule.role,
    scene_state_ref: scene.scene_state_id,
    camera_state: {
      shot_type: shotTypeForProgress(scene, schedule.motion_progress),
      motion_progress: schedule.motion_progress,
      motion_type: video.camera_motion.motion_type,
      camera_position: scene.camera_state.camera_position,
      camera_height: scene.camera_state.camera_height,
      identity_safe: video.camera_motion.identity_safe,
    },
    character_state: {
      active_character_ids: [...scene.character_state.active_character_ids],
      positions,
      beat_phase: beatPhaseForRole(schedule.role),
    },
    emotion_state: {
      emotion_id: video.emotion_motion.emotion_id,
      intensity: interpolateEmotion(
        schedule.motion_progress,
        video.emotion_motion.intensity_start,
        video.emotion_motion.intensity_end
      ),
      arc_type: video.emotion_motion.arc_type,
    },
    composition_state: {
      ...(scene.composition_state.composition_id
        ? { composition_id: scene.composition_state.composition_id }
        : {}),
      prop_anchor_ids: [...scene.composition_state.prop_anchor_ids],
      character_positions: { ...scene.composition_state.character_positions },
    },
    location_state: {
      location_id: scene.location_state.location_id,
      ...(scene.location_state.layout_lock_id
        ? { layout_lock_id: scene.location_state.layout_lock_id }
        : {}),
      ...(scene.location_state.outdoor_layout_id
        ? { outdoor_layout_id: scene.location_state.outdoor_layout_id }
        : {}),
      location_lock_preserved: video.environment_motion.location_lock_preserved,
    },
    identity_state: {
      protected_character_ids: [...scene.identity_state.protected_character_ids],
      identity_lock_tokens: [...scene.identity_state.identity_lock_tokens],
    },
    continuity_locks: {
      identity_locks: [...video.continuity_locks.identity_locks],
      location_locks: [...video.continuity_locks.location_locks],
      composition_locks: [...video.continuity_locks.composition_locks],
    },
  };
}

export function loadKeyframePlan(
  projectRoot: string,
  keyframePlanId: string
): KeyframePlan | null {
  const registry = readJsonRecord(projectRoot, KEYFRAME_PLAN_REGISTRY_PATH) as {
    keyframe_plans?: Array<{ keyframe_plan_id: string; plan_path: string }>;
  } | null;

  const entry = registry?.keyframe_plans?.find((p) => p.keyframe_plan_id === keyframePlanId);
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.plan_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as KeyframePlan;
}

export function buildKeyframePlan(
  projectRoot: string,
  video: VideoShotState,
  keyframePlanId: string
): KeyframePlan {
  const root = resolveProjectRoot(projectRoot);
  const scene = loadSceneState(root, video.source_scene_state_id);
  if (!scene) {
    throw new Error(`Missing source scene state: ${video.source_scene_state_id}`);
  }

  const schedule = deriveKeyframeSchedule(video.duration_seconds);
  const keyframes = schedule.map((entry, index) =>
    buildKeyframeEntry(index, entry, video, scene)
  );

  return {
    keyframe_plan_id: keyframePlanId,
    phase: KEYFRAME_PLAN_PHASE,
    source_video_shot_state_id: video.video_shot_state_id,
    source_scene_state_id: video.source_scene_state_id,
    duration_seconds: video.duration_seconds,
    fps_target: video.fps_target,
    keyframes,
    built_at: new Date().toISOString(),
  };
}

export function buildSeedKeyframePlans(projectRoot?: string): KeyframePlan[] {
  const root = resolveProjectRoot(projectRoot);
  const plans: KeyframePlan[] = [];

  for (const spec of SEED_KEYFRAME_PLAN_SPECS) {
    const video = loadVideoShotState(root, spec.source_video_shot_state_id);
    if (!video) {
      throw new Error(`Missing video shot state: ${spec.source_video_shot_state_id}`);
    }
    plans.push(buildKeyframePlan(root, video, spec.keyframe_plan_id));
  }

  return plans;
}

export function writeKeyframePlans(
  projectRoot: string,
  plans: KeyframePlan[],
  storageDir = 'datasets/keyframe_plan/plans'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${storageDir}/${plan.keyframe_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
