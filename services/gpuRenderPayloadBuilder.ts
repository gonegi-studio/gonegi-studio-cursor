import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { loadKeyframePlan, type KeyframePlan } from './keyframePlanBuilder.js';
import { loadMotionPlan, type MotionPlan } from './motionPlanBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { loadVideoShotState, type VideoShotState } from './videoShotStateBuilder.js';

export const GPU_PAYLOAD_PHASE = 'PHASE-22-GPU-RENDER-PAYLOAD-PREPARATION-001' as const;
export const GPU_PAYLOAD_REGISTRY_PATH = 'datasets/gpu_payload/gpu-render-payload-registry.json' as const;

export const SEED_GPU_PAYLOAD_SPECS = Object.freeze([
  {
    gpu_payload_id: 'gpu_payload_gonegi_bedroom_reading_6s_v1',
    source_video_shot_state_id: 'video_gonegi_bedroom_reading_6s_v1',
    source_keyframe_plan_id: 'keyframe_plan_gonegi_bedroom_reading_6s_v1',
    source_motion_plan_id: 'motion_plan_gonegi_bedroom_reading_6s_v1',
  },
  {
    gpu_payload_id: 'gpu_payload_gonegi_dana_harbor_reunion_8s_v1',
    source_video_shot_state_id: 'video_gonegi_dana_harbor_reunion_8s_v1',
    source_keyframe_plan_id: 'keyframe_plan_gonegi_dana_harbor_reunion_8s_v1',
    source_motion_plan_id: 'motion_plan_gonegi_dana_harbor_reunion_8s_v1',
  },
  {
    gpu_payload_id: 'gpu_payload_olive_hill_wonder_6s_v1',
    source_video_shot_state_id: 'video_olive_hill_wonder_6s_v1',
    source_keyframe_plan_id: 'keyframe_plan_olive_hill_wonder_6s_v1',
    source_motion_plan_id: 'motion_plan_olive_hill_wonder_6s_v1',
  },
] as const);

export type GpuRenderPayload = {
  gpu_payload_id: string;
  phase: typeof GPU_PAYLOAD_PHASE;
  source_video_shot_state_id: string;
  source_keyframe_plan_id: string;
  source_motion_plan_id: string;
  source_scene_state_id: string;
  render_mode: string;
  duration_seconds: number;
  fps_target: 12 | 24 | 25 | 30;
  resolution: string;
  aspect_ratio: string;
  identity_locks: string[];
  location_locks: string[];
  composition_locks: string[];
  prop_locks: string[];
  keyframes: Array<{
    keyframe_index: number;
    timestamp: number;
    keyframe_role: string;
    scene_state_ref: string;
    shot_type: string;
    emotion_id: string;
    emotion_intensity: number;
  }>;
  motion_segments: Array<{
    segment_id: string;
    from_keyframe: number;
    to_keyframe: number;
    duration_seconds: number;
    camera_motion_category: string;
    emotion_motion_category: string;
    environment_motion_category: string;
  }>;
  render_constraints: string[];
  negative_constraints: string[];
  execution_flags: {
    gpu_execution: false;
    preparation_only: true;
    external_call_allowed: false;
  };
  built_at: string;
};

function extractPropLocks(compositionLocks: string[]): string[] {
  return compositionLocks.filter((lock) => lock.startsWith('prop_anchor:'));
}

function buildRenderConstraints(video: VideoShotState): string[] {
  return [
    'character_identity_has_highest_priority',
    'preserve_identity_lock_tokens_across_all_frames',
    'preserve_location_and_layout_locks',
    'preserve_composition_and_prop_anchors',
    `target_duration_seconds:${video.duration_seconds}`,
    `target_fps:${video.fps_target}`,
    'no_landmark_relocation',
    'no_identity_drift',
  ];
}

function buildNegativeConstraints(): string[] {
  return [
    'no_gpu_execution_in_phase_22',
    'no_external_api_calls',
    'no_video_file_output',
    'no_identity_override_tokens',
    'no_hard_enforcement_must_show',
    'no_fail_if_ignored_enforcement',
    'no_prop_removal',
    'no_location_swap',
  ];
}

export function buildGpuRenderPayload(
  video: VideoShotState,
  keyframePlan: KeyframePlan,
  motionPlan: MotionPlan,
  gpuPayloadId: string
): GpuRenderPayload {
  const baselineLocks = keyframePlan.keyframes[0]?.continuity_locks ?? {
    identity_locks: video.continuity_locks.identity_locks,
    location_locks: video.continuity_locks.location_locks,
    composition_locks: video.continuity_locks.composition_locks,
  };

  return {
    gpu_payload_id: gpuPayloadId,
    phase: GPU_PAYLOAD_PHASE,
    source_video_shot_state_id: video.video_shot_state_id,
    source_keyframe_plan_id: keyframePlan.keyframe_plan_id,
    source_motion_plan_id: motionPlan.motion_plan_id,
    source_scene_state_id: keyframePlan.source_scene_state_id,
    render_mode: 'preparation_stub_v1',
    duration_seconds: video.duration_seconds,
    fps_target: video.fps_target,
    resolution: '1280x720',
    aspect_ratio: '16:9',
    identity_locks: [...baselineLocks.identity_locks],
    location_locks: [...baselineLocks.location_locks],
    composition_locks: [...baselineLocks.composition_locks],
    prop_locks: extractPropLocks(baselineLocks.composition_locks),
    keyframes: keyframePlan.keyframes.map((kf) => ({
      keyframe_index: kf.keyframe_index,
      timestamp: kf.timestamp,
      keyframe_role: kf.keyframe_role,
      scene_state_ref: kf.scene_state_ref,
      shot_type: kf.camera_state.shot_type,
      emotion_id: kf.emotion_state.emotion_id,
      emotion_intensity: kf.emotion_state.intensity,
    })),
    motion_segments: motionPlan.motion_segments.map((seg) => ({
      segment_id: seg.segment_id,
      from_keyframe: seg.from_keyframe,
      to_keyframe: seg.to_keyframe,
      duration_seconds: seg.duration_seconds,
      camera_motion_category: seg.camera_motion.motion_category,
      emotion_motion_category: seg.emotion_motion.motion_category,
      environment_motion_category: seg.environment_motion.motion_category,
    })),
    render_constraints: buildRenderConstraints(video),
    negative_constraints: buildNegativeConstraints(),
    execution_flags: {
      gpu_execution: false,
      preparation_only: true,
      external_call_allowed: false,
    },
    built_at: new Date().toISOString(),
  };
}

export function loadSourcesForVideoShot(
  projectRoot: string,
  videoShotStateId: string
): {
  video: VideoShotState;
  keyframePlan: KeyframePlan;
  motionPlan: MotionPlan;
} | null {
  const video = loadVideoShotState(projectRoot, videoShotStateId);
  if (!video) return null;

  const keyframePlanId = `keyframe_plan_${videoShotStateId.replace(/^video_/, '')}`;
  const motionPlanId = `motion_plan_${videoShotStateId.replace(/^video_/, '')}`;

  const keyframePlan = loadKeyframePlan(projectRoot, keyframePlanId);
  const motionPlan = loadMotionPlan(projectRoot, motionPlanId);
  if (!keyframePlan || !motionPlan) return null;

  return { video, keyframePlan, motionPlan };
}

export function buildSeedGpuRenderPayloads(projectRoot?: string): GpuRenderPayload[] {
  const root = resolveProjectRoot(projectRoot);
  const payloads: GpuRenderPayload[] = [];

  for (const spec of SEED_GPU_PAYLOAD_SPECS) {
    const sources = loadSourcesForVideoShot(root, spec.source_video_shot_state_id);
    if (!sources) {
      throw new Error(`Missing source chain for ${spec.source_video_shot_state_id}`);
    }

    if (sources.keyframePlan.keyframe_plan_id !== spec.source_keyframe_plan_id) {
      throw new Error(`Keyframe plan mismatch for ${spec.gpu_payload_id}`);
    }
    if (sources.motionPlan.motion_plan_id !== spec.source_motion_plan_id) {
      throw new Error(`Motion plan mismatch for ${spec.gpu_payload_id}`);
    }

    payloads.push(
      buildGpuRenderPayload(
        sources.video,
        sources.keyframePlan,
        sources.motionPlan,
        spec.gpu_payload_id
      )
    );
  }

  return payloads;
}

export function writeGpuRenderPayloads(
  projectRoot: string,
  payloads: GpuRenderPayload[],
  storageDir = 'datasets/gpu_payload/payloads'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const payload of payloads) {
    const rel = `${storageDir}/${payload.gpu_payload_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}

export function loadGpuPayloadRegistry(projectRoot: string) {
  return readJsonRecord(projectRoot, GPU_PAYLOAD_REGISTRY_PATH);
}

export function loadGpuRenderPayload(
  projectRoot: string,
  gpuPayloadId: string
): GpuRenderPayload | null {
  const registry = readJsonRecord(projectRoot, GPU_PAYLOAD_REGISTRY_PATH) as {
    gpu_render_payloads?: Array<{ gpu_payload_id: string; payload_path: string }>;
  } | null;

  const entry = registry?.gpu_render_payloads?.find((p) => p.gpu_payload_id === gpuPayloadId);
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.payload_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GpuRenderPayload;
}
