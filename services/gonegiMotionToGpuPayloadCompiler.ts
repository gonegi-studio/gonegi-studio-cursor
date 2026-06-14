import fs from 'node:fs';
import path from 'node:path';
import { GPU_PAYLOAD_SCHEMA_PATH } from './gpuRenderPayloadValidator.js';
import {
  GONEGI_MOTION_PLAN_REGISTRY_PATH,
  type GonegiMotionPlan,
  loadGonegiMotionPlan,
} from './gonegiKeyframeToMotionCompiler.js';
import {
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  type GonegiKeyframePlan,
  loadGonegiKeyframePlan,
} from './gonegiVideoStateToKeyframeCompiler.js';
import {
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  type GonegiVideoState,
  loadGonegiVideoState,
} from './gonegiStateToVideoStateTranslator.js';
import {
  VIDEO_STATE_DEFAULTS_PATH,
  type VideoStateDefaults,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GPU_PAYLOAD_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-017-GONEGI_MOTION_TO_GPU_PAYLOAD_COMPILER_V2' as const;
export const GONEGI_GPU_PAYLOAD_SCHEMA_PATH =
  'datasets/gonegi_gpu_payload/gonegi-gpu-payload.schema.json' as const;
export const GONEGI_GPU_PAYLOAD_REGISTRY_PATH =
  'datasets/gonegi_gpu_payload/gonegi-gpu-payload-registry.json' as const;
export const GONEGI_GPU_PAYLOADS_DIR = 'datasets/gonegi_gpu_payload/payloads' as const;

export const SEED_GONEGI_GPU_PAYLOAD_SPECS = Object.freeze([
  {
    gonegi_gpu_payload_id: 'gonegi_gpu_payload_ghibli_kitchen_v1',
    source_motion_plan_id: 'gonegi_motion_ghibli_kitchen_v1',
  },
  {
    gonegi_gpu_payload_id: 'gonegi_gpu_payload_shinkai_sky_light_v1',
    source_motion_plan_id: 'gonegi_motion_shinkai_sky_light_v1',
  },
  {
    gonegi_gpu_payload_id: 'gonegi_gpu_payload_live_action_dialogue_v1',
    source_motion_plan_id: 'gonegi_motion_live_action_dialogue_v1',
  },
  {
    gonegi_gpu_payload_id: 'gonegi_gpu_payload_mori_emotion_flow_v1',
    source_motion_plan_id: 'gonegi_motion_mori_emotion_flow_v1',
  },
] as const);

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  preparation_only: true as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

export type GonegiGpuPayload = {
  gonegi_gpu_payload_id: string;
  phase: typeof GPU_PAYLOAD_COMPILER_PHASE;
  source_motion_plan_id: string;
  source_keyframe_plan_id: string;
  source_video_state_id: string;
  duration_seconds: number;
  fps_target: 12 | 24 | 25 | 30;
  resolution: string;
  aspect_ratio: string;
  identity_locks: string[];
  continuity_locks: GonegiMotionPlan['continuity_locks'];
  translation_trace: GonegiMotionPlan['translation_trace'] & {
    gpu_payload_translation: {
      compiler_phase: typeof GPU_PAYLOAD_COMPILER_PHASE;
      reference_schema: typeof GPU_PAYLOAD_SCHEMA_PATH;
      render_mode: string;
    };
  };
  replacement_trace: GonegiMotionPlan['replacement_trace'];
  keyframes: Array<{
    keyframe_index: number;
    timestamp: number;
    keyframe_role: string;
    gonegi_state_ref: string;
    shot_type: string;
    emotion_id: string;
    emotion_intensity: number;
  }>;
  motion_segments: Array<{
    segment_id: string;
    from_keyframe: number;
    to_keyframe: number;
    from_timestamp: number;
    to_timestamp: number;
    duration_seconds: number;
    camera_motion_category: string;
    emotion_motion_category: string;
    environment_motion_category: string;
  }>;
  render_mode: string;
  provider_hint: {
    recommended_provider_id: string;
    provider_activation: false;
    runtime_target: 'deferred' | 'local_stub' | 'remote_stub';
    selection_basis: string;
  };
  execution_flags: typeof EXECUTION_FLAGS;
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_gpu_payload';
    production_registry: false;
    draft_status: 'gonegi_gpu_payload_compiled_v1';
  };
  compiled_at: string;
};

function deriveProviderHint(
  motionPlan: GonegiMotionPlan,
  keyframePlan: GonegiKeyframePlan
): GonegiGpuPayload['provider_hint'] {
  const complexityScore = motionPlan.segment_count + keyframePlan.keyframe_count;
  const recommended =
    complexityScore <= 9 ? 'deferred_local_stub_v1' : 'deferred_remote_stub_v1';

  return {
    recommended_provider_id: recommended,
    provider_activation: false,
    runtime_target: 'deferred',
    selection_basis: 'preparation_only_design_phase_no_provider_activation',
  };
}

export function compileGonegiGpuPayload(
  motionPlan: GonegiMotionPlan,
  keyframePlan: GonegiKeyframePlan,
  videoState: GonegiVideoState,
  spec: (typeof SEED_GONEGI_GPU_PAYLOAD_SPECS)[number],
  defaults: VideoStateDefaults
): GonegiGpuPayload {
  const gpuDefaults = defaults.downstream_defaults.gpu_payload;
  const durationSeconds = videoState.video_parameters.duration_seconds;
  const fpsTarget = videoState.video_parameters.fps_target;

  return {
    gonegi_gpu_payload_id: spec.gonegi_gpu_payload_id,
    phase: GPU_PAYLOAD_COMPILER_PHASE,
    source_motion_plan_id: motionPlan.gonegi_motion_plan_id,
    source_keyframe_plan_id: keyframePlan.gonegi_keyframe_plan_id,
    source_video_state_id: keyframePlan.source_gonegi_video_state_id,
    duration_seconds: durationSeconds,
    fps_target: fpsTarget,
    resolution: gpuDefaults.resolution,
    aspect_ratio: gpuDefaults.aspect_ratio,
    identity_locks: [...motionPlan.identity_locks],
    continuity_locks: {
      identity_locks: [...motionPlan.continuity_locks.identity_locks],
      location_locks: [...motionPlan.continuity_locks.location_locks],
      composition_locks: [...(motionPlan.continuity_locks.composition_locks ?? [])],
    },
    translation_trace: {
      ...motionPlan.translation_trace,
      gpu_payload_translation: {
        compiler_phase: GPU_PAYLOAD_COMPILER_PHASE,
        reference_schema: GPU_PAYLOAD_SCHEMA_PATH,
        render_mode: gpuDefaults.render_mode,
      },
    },
    replacement_trace: {
      contract_id: motionPlan.replacement_trace.contract_id,
      replacements_applied: motionPlan.replacement_trace.replacements_applied.map((entry) => ({
        ...entry,
      })),
      companions_injected: [...motionPlan.replacement_trace.companions_injected],
    },
    keyframes: keyframePlan.keyframes.map((kf) => ({
      keyframe_index: kf.keyframe_index,
      timestamp: kf.timestamp,
      keyframe_role: kf.keyframe_role,
      gonegi_state_ref: kf.gonegi_state_ref,
      shot_type: kf.camera_state.shot_type,
      emotion_id: kf.emotion_state.emotion_id,
      emotion_intensity: kf.emotion_state.intensity,
    })),
    motion_segments: motionPlan.motion_segments.map((seg) => ({
      segment_id: seg.segment_id,
      from_keyframe: seg.from_keyframe,
      to_keyframe: seg.to_keyframe,
      from_timestamp: seg.from_timestamp,
      to_timestamp: seg.to_timestamp,
      duration_seconds: seg.duration_seconds,
      camera_motion_category: seg.camera_motion.motion_category,
      emotion_motion_category: seg.emotion_motion.motion_category,
      environment_motion_category: seg.environment_motion.motion_category,
    })),
    render_mode: gpuDefaults.render_mode,
    provider_hint: deriveProviderHint(motionPlan, keyframePlan),
    execution_flags: { ...EXECUTION_FLAGS },
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_gpu_payload',
      production_registry: false,
      draft_status: 'gonegi_gpu_payload_compiled_v1',
    },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllGonegiGpuPayloads(projectRoot?: string): GonegiGpuPayload[] {
  const root = resolveProjectRoot(projectRoot);

  for (const registryPath of [
    GONEGI_MOTION_PLAN_REGISTRY_PATH,
    GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
    GONEGI_VIDEO_STATE_REGISTRY_PATH,
  ]) {
    if (!fs.existsSync(path.join(root, registryPath))) {
      throw new Error(`Missing registry: ${registryPath}`);
    }
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  if (!fs.existsSync(path.join(root, GPU_PAYLOAD_SCHEMA_PATH))) {
    throw new Error(`Missing reference GPU payload schema: ${GPU_PAYLOAD_SCHEMA_PATH}`);
  }

  const payloads: GonegiGpuPayload[] = [];
  for (const spec of SEED_GONEGI_GPU_PAYLOAD_SPECS) {
    const motionPlan = loadGonegiMotionPlan(root, spec.source_motion_plan_id);
    if (!motionPlan) {
      throw new Error(`Missing gonegi motion plan: ${spec.source_motion_plan_id}`);
    }

    const keyframePlan = loadGonegiKeyframePlan(root, motionPlan.source_keyframe_plan_id);
    if (!keyframePlan) {
      throw new Error(`Missing gonegi keyframe plan: ${motionPlan.source_keyframe_plan_id}`);
    }

    const videoState = loadGonegiVideoState(root, keyframePlan.source_gonegi_video_state_id);
    if (!videoState) {
      throw new Error(`Missing gonegi video state: ${keyframePlan.source_gonegi_video_state_id}`);
    }

    payloads.push(compileGonegiGpuPayload(motionPlan, keyframePlan, videoState, spec, defaults));
  }

  return payloads;
}

export function writeGonegiGpuPayloads(projectRoot?: string): {
  payloads: GonegiGpuPayload[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const payloads = compileAllGonegiGpuPayloads(root);
  const outDir = path.join(root, GONEGI_GPU_PAYLOADS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const payload of payloads) {
    const rel = `${GONEGI_GPU_PAYLOADS_DIR}/${payload.gonegi_gpu_payload_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { payloads, written };
}

export function loadGonegiGpuPayload(
  projectRoot: string,
  gonegiGpuPayloadId: string
): GonegiGpuPayload | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_GPU_PAYLOADS_DIR, `${gonegiGpuPayloadId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiGpuPayload;
}
