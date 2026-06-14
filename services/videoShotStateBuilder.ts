import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import type { SceneState } from './sceneStateBuilder.js';

export const VIDEO_SHOT_STATE_PHASE = 'PHASE-19-SCENE-STATE-TO-VIDEO-PREPARATION-001' as const;
export const VIDEO_SHOT_REGISTRY_PATH = 'datasets/video_state/video-shot-state-registry.json' as const;
export const SCENE_STATE_REGISTRY_PATH = 'datasets/state/scene-state-registry.json' as const;

export const SEED_VIDEO_SHOT_SPECS = Object.freeze([
  {
    video_shot_state_id: 'video_gonegi_bedroom_reading_6s_v1',
    source_scene_state_id: 'scene_gonegi_bedroom_reading_v1',
    duration_seconds: 6,
    fps_target: 24,
  },
  {
    video_shot_state_id: 'video_gonegi_dana_harbor_reunion_8s_v1',
    source_scene_state_id: 'scene_gonegi_dana_harbor_reunion_v1',
    duration_seconds: 8,
    fps_target: 24,
  },
  {
    video_shot_state_id: 'video_olive_hill_wonder_6s_v1',
    source_scene_state_id: 'scene_olive_hill_overlook_wonder_v1',
    duration_seconds: 6,
    fps_target: 24,
  },
] as const);

export type VideoShotBuildInput = {
  video_shot_state_id: string;
  source_scene_state_id: string;
  duration_seconds: number;
  fps_target?: 12 | 24 | 25 | 30;
};

export type VideoShotState = {
  video_shot_state_id: string;
  source_scene_state_id: string;
  phase: typeof VIDEO_SHOT_STATE_PHASE;
  duration_seconds: number;
  fps_target: 12 | 24 | 25 | 30;
  keyframe_count: number;
  camera_motion: {
    motion_type: string;
    path_description: string;
    speed: 'static' | 'slow' | 'moderate' | 'fast';
    identity_safe: boolean;
    shot_type_source: string;
  };
  character_motion: Array<{
    character_id: string;
    motion_type: string;
    path_description: string;
    identity_lock_preserved: boolean;
    start_position?: string;
    end_position?: string;
  }>;
  emotion_motion: {
    emotion_id: string;
    arc_type: string;
    intensity_start: number;
    intensity_end: number;
  };
  environment_motion: {
    motion_type: string;
    path_description: string;
    location_lock_preserved: boolean;
    elements: string[];
  };
  continuity_locks: {
    identity_locks: string[];
    location_locks: string[];
    composition_locks: string[];
  };
  render_intent: {
    preparation_only: true;
    gpu_execution: false;
    target_pipeline: string;
    next_phase: string;
  };
  built_at: string;
};

function deriveKeyframeCount(durationSeconds: number, fps: number): number {
  const totalFrames = Math.round(durationSeconds * fps);
  return Math.max(4, Math.min(totalFrames, Math.round(durationSeconds * 2)));
}

function cameraMotionForScene(scene: SceneState): VideoShotState['camera_motion'] {
  const shot = scene.camera_state.shot_type;
  if (shot === 'close' || shot === 'reaction') {
    return {
      motion_type: 'subtle_push_in',
      path_description: 'Slow dolly toward character face without reframing identity anchors',
      speed: 'slow',
      identity_safe: true,
      shot_type_source: shot,
    };
  }
  if (shot === 'wide') {
    return {
      motion_type: 'static_hold',
      path_description: 'Locked wide framing with minimal drift',
      speed: 'static',
      identity_safe: true,
      shot_type_source: shot,
    };
  }
  return {
    motion_type: 'gentle_arc',
    path_description: 'Character-first arc maintaining foreground priority',
    speed: 'slow',
    identity_safe: true,
    shot_type_source: shot,
  };
}

function characterMotionForScene(scene: SceneState): VideoShotState['character_motion'] {
  const positions = scene.composition_state.character_positions;
  return scene.character_state.active_character_ids.map((characterId) => {
    const start = positions[characterId] ?? 'scene_anchor';
    const isPrimary = characterId === scene.character_state.primary_character_id;
    return {
      character_id: characterId,
      motion_type: isPrimary ? 'performance_beat' : 'companion_reaction',
      path_description: isPrimary
        ? 'Subtle acting beat preserving face and costume identity locks'
        : 'Minor supportive motion without crossing primary character foreground',
      identity_lock_preserved: true,
      start_position: start,
      end_position: start,
    };
  });
}

function emotionMotionForScene(scene: SceneState): VideoShotState['emotion_motion'] {
  const start = scene.emotion_state.intensity;
  const end = Math.min(1, start + 0.1);
  const arc =
    scene.emotion_state.emotion_id === 'reunion'
      ? 'rise_to_peak'
      : scene.emotion_state.emotion_id === 'wonder'
        ? 'discovery_bloom'
        : 'steady_hope';

  return {
    emotion_id: scene.emotion_state.emotion_id,
    arc_type: arc,
    intensity_start: start,
    intensity_end: end,
  };
}

function environmentMotionForScene(scene: SceneState): VideoShotState['environment_motion'] {
  const elements = [
    scene.location_state.location_id,
    ...(scene.environment_state.supporting_elements ?? []),
  ];

  return {
    motion_type: 'ambient_drift',
    path_description: 'Background atmosphere only; no landmark relocation or layout mutation',
    location_lock_preserved: true,
    elements: [...new Set(elements)],
  };
}

function continuityLocksForScene(scene: SceneState): VideoShotState['continuity_locks'] {
  const identity_locks = [
    ...scene.identity_state.identity_lock_tokens,
    `protected_characters:${scene.identity_state.protected_character_ids.join(',')}`,
  ];

  const location_locks = [
    `location_id:${scene.location_state.location_id}`,
    ...(scene.location_state.layout_lock_id
      ? [`layout_lock_id:${scene.location_state.layout_lock_id}`]
      : []),
    ...(scene.location_state.outdoor_layout_id
      ? [`outdoor_layout_id:${scene.location_state.outdoor_layout_id}`]
      : []),
  ];

  const composition_locks = [
    ...(scene.composition_state.composition_id
      ? [`composition_id:${scene.composition_state.composition_id}`]
      : []),
    ...scene.composition_state.prop_anchor_ids.map((id) => `prop_anchor:${id}`),
    ...Object.entries(scene.composition_state.character_positions).map(
      ([id, pos]) => `character_position:${id}@${pos}`
    ),
  ];

  return {
    identity_locks,
    location_locks,
    composition_locks,
  };
}

export function buildVideoShotState(
  scene: SceneState,
  input: VideoShotBuildInput
): VideoShotState {
  const fps = input.fps_target ?? 24;

  return {
    video_shot_state_id: input.video_shot_state_id,
    source_scene_state_id: input.source_scene_state_id,
    phase: VIDEO_SHOT_STATE_PHASE,
    duration_seconds: input.duration_seconds,
    fps_target: fps,
    keyframe_count: deriveKeyframeCount(input.duration_seconds, fps),
    camera_motion: cameraMotionForScene(scene),
    character_motion: characterMotionForScene(scene),
    emotion_motion: emotionMotionForScene(scene),
    environment_motion: environmentMotionForScene(scene),
    continuity_locks: continuityLocksForScene(scene),
    render_intent: {
      preparation_only: true,
      gpu_execution: false,
      target_pipeline: 'scene_state_to_video_preparation_v1',
      next_phase: 'PHASE-20 KEYFRAME_PLAN_BUILDER_V1',
    },
    built_at: new Date().toISOString(),
  };
}

export function loadVideoShotState(
  projectRoot: string,
  videoShotStateId: string
): VideoShotState | null {
  const registry = readJsonRecord(projectRoot, VIDEO_SHOT_REGISTRY_PATH) as {
    video_shot_states?: Array<{ video_shot_state_id: string; state_path: string }>;
  } | null;

  const entry = registry?.video_shot_states?.find(
    (s) => s.video_shot_state_id === videoShotStateId
  );
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.state_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as VideoShotState;
}

export function loadSceneState(projectRoot: string, sceneStateId: string): SceneState | null {
  const registry = readJsonRecord(projectRoot, SCENE_STATE_REGISTRY_PATH) as {
    scene_states?: Array<{ scene_state_id: string; state_path: string }>;
  } | null;

  const entry = registry?.scene_states?.find((s) => s.scene_state_id === sceneStateId);
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.state_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SceneState;
}

export function buildSeedVideoShotStates(projectRoot?: string): VideoShotState[] {
  const root = resolveProjectRoot(projectRoot);
  const built: VideoShotState[] = [];

  for (const spec of SEED_VIDEO_SHOT_SPECS) {
    const scene = loadSceneState(root, spec.source_scene_state_id);
    if (!scene) {
      throw new Error(`Missing source scene state: ${spec.source_scene_state_id}`);
    }
    built.push(
      buildVideoShotState(scene, {
        video_shot_state_id: spec.video_shot_state_id,
        source_scene_state_id: spec.source_scene_state_id,
        duration_seconds: spec.duration_seconds,
        fps_target: spec.fps_target,
      })
    );
  }

  return built;
}

export function writeVideoShotStates(
  projectRoot: string,
  states: VideoShotState[],
  storageDir = 'datasets/video_state/video-shot-states'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const state of states) {
    const rel = `${storageDir}/${state.video_shot_state_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
