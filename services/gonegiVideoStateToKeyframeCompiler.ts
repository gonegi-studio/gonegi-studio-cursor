import fs from 'node:fs';
import path from 'node:path';
import {
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  type GonegiVideoState,
  loadGonegiVideoState,
} from './gonegiStateToVideoStateTranslator.js';
import { loadGonegiSceneState, type GonegiSceneState } from './sourceStateToGonegiStateCompiler.js';
import {
  KEYFRAME_PLAN_SCHEMA_PATH,
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
  type VideoStateDefaults,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const KEYFRAME_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-015-VIDEO_STATE_TO_KEYFRAME_COMPILER_V2' as const;
export const GONEGI_KEYFRAME_PLAN_SCHEMA_PATH =
  'datasets/gonegi_keyframe_plan/gonegi-keyframe-plan.schema.json' as const;
export const GONEGI_KEYFRAME_PLAN_REGISTRY_PATH =
  'datasets/gonegi_keyframe_plan/gonegi-keyframe-plan-registry.json' as const;
export const GONEGI_KEYFRAME_PLANS_DIR = 'datasets/gonegi_keyframe_plan/plans' as const;

export const SEED_GONEGI_KEYFRAME_PLAN_SPECS = Object.freeze([
  {
    gonegi_keyframe_plan_id: 'gonegi_keyframe_ghibli_kitchen_v1',
    source_gonegi_video_state_id: 'gonegi_video_state_ghibli_kitchen_v1',
  },
  {
    gonegi_keyframe_plan_id: 'gonegi_keyframe_shinkai_sky_light_v1',
    source_gonegi_video_state_id: 'gonegi_video_state_shinkai_sky_light_v1',
  },
  {
    gonegi_keyframe_plan_id: 'gonegi_keyframe_live_action_dialogue_v1',
    source_gonegi_video_state_id: 'gonegi_video_state_live_action_dialogue_v1',
  },
  {
    gonegi_keyframe_plan_id: 'gonegi_keyframe_mori_emotion_flow_v1',
    source_gonegi_video_state_id: 'gonegi_video_state_mori_emotion_flow_v1',
  },
] as const);

const BLEND_ID = 'gonegi-master-director-blend-v1' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

export type GonegiKeyframeRole =
  | 'start'
  | 'early_transition'
  | 'midpoint'
  | 'late_transition'
  | 'end';

type KeyframeSchedule = {
  timestamp: number;
  role: GonegiKeyframeRole;
  motion_progress: number;
};

export type GonegiKeyframeEntry = {
  keyframe_index: number;
  timestamp: number;
  keyframe_role: GonegiKeyframeRole;
  gonegi_state_ref: string;
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
    composition_id: string;
    prop_anchor_ids: string[];
    character_positions: Record<string, string>;
  };
  location_state: {
    location_id: string;
    layout_lock_id?: string;
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

export type GonegiKeyframePlan = {
  gonegi_keyframe_plan_id: string;
  phase: typeof KEYFRAME_COMPILER_PHASE;
  source_gonegi_video_state_id: string;
  gonegi_state_id: string;
  duration_seconds: number;
  fps_target: number;
  keyframe_count: number;
  keyframes: GonegiKeyframeEntry[];
  identity_locks: string[];
  continuity_locks: GonegiVideoState['continuity_locks'];
  translation_trace: GonegiVideoState['translation_trace'] & {
    keyframe_plan_translation: {
      compiler_phase: typeof KEYFRAME_COMPILER_PHASE;
      defaults_id: typeof VIDEO_STATE_DEFAULTS_ID;
      reference_schema: typeof KEYFRAME_PLAN_SCHEMA_PATH;
    };
  };
  replacement_trace: GonegiSceneState['replacement_trace'];
  director_blend_ref: typeof BLEND_ID;
  video_defaults_ref: typeof VIDEO_STATE_DEFAULTS_ID;
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_keyframe_plan';
    production_registry: false;
    draft_status: 'gonegi_keyframe_plan_compiled_v1';
  };
  execution_flags: typeof EXECUTION_FLAGS;
  compiled_at: string;
};

function roundTimestamp(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function deriveKeyframePlanCount(durationSeconds: number): number {
  if (durationSeconds === 24) return 5;
  if (durationSeconds >= 25 && durationSeconds <= 26) return 6;
  if (durationSeconds === 33) return 7;
  throw new Error(`Unsupported duration for keyframe plan count: ${durationSeconds}s`);
}

function rolesForCount(count: number): GonegiKeyframeRole[] {
  if (count === 5) {
    return ['start', 'early_transition', 'midpoint', 'late_transition', 'end'];
  }
  if (count === 6) {
    return ['start', 'early_transition', 'early_transition', 'midpoint', 'late_transition', 'end'];
  }
  if (count === 7) {
    return [
      'start',
      'early_transition',
      'early_transition',
      'midpoint',
      'late_transition',
      'late_transition',
      'end',
    ];
  }
  throw new Error(`Unsupported keyframe count: ${count}`);
}

export function deriveGonegiKeyframeSchedule(
  durationSeconds: number,
  keyframeCount: number
): KeyframeSchedule[] {
  const roles = rolesForCount(keyframeCount);
  if (roles.length !== keyframeCount) {
    throw new Error('Role count mismatch');
  }

  return roles.map((role, index) => {
    const progress = keyframeCount === 1 ? 0 : index / (keyframeCount - 1);
    return {
      timestamp: roundTimestamp(durationSeconds * progress),
      role,
      motion_progress: roundTimestamp(progress),
    };
  });
}

function beatPhaseForRole(role: GonegiKeyframeRole): string {
  switch (role) {
    case 'start':
      return 'establish';
    case 'early_transition':
      return 'develop';
    case 'midpoint':
      return 'peak_hold';
    case 'late_transition':
      return 'release';
    case 'end':
      return 'resolve';
    default:
      return 'hold';
  }
}

function interpolateEmotion(progress: number, start: number, end: number): number {
  return Math.round((start + (end - start) * progress) * 1000) / 1000;
}

function shotTypeForProgress(videoState: GonegiVideoState, progress: number): string {
  const base = videoState.camera_state.shot_type;
  if (progress >= 0.85 && (base.includes('medium') || base.includes('wide'))) {
    return base.includes('wide') ? 'medium' : 'close';
  }
  return base;
}

function buildKeyframeEntry(
  index: number,
  schedule: KeyframeSchedule,
  videoState: GonegiVideoState
): GonegiKeyframeEntry {
  const params = videoState.video_parameters;
  const positions: Record<string, string> = {};
  for (const motion of params.character_motion) {
    positions[motion.character_id] = motion.start_position ?? 'scene_anchor';
  }

  const compositionLocks = [
    ...(videoState.continuity_locks.composition_locks ?? []),
    ...Object.entries(videoState.composition_state.character_positions).map(
      ([charId, pos]) => `character_position:${charId}@${pos}`
    ),
  ];

  return {
    keyframe_index: index,
    timestamp: schedule.timestamp,
    keyframe_role: schedule.role,
    gonegi_state_ref: videoState.gonegi_state_id,
    camera_state: {
      shot_type: shotTypeForProgress(videoState, schedule.motion_progress),
      motion_progress: schedule.motion_progress,
      motion_type: params.camera_motion.motion_type,
      camera_position: videoState.camera_state.camera_position,
      camera_height: videoState.camera_state.camera_height,
      identity_safe: params.camera_motion.identity_safe,
    },
    character_state: {
      active_character_ids: [...videoState.character_state.active_character_ids],
      positions,
      beat_phase: beatPhaseForRole(schedule.role),
    },
    emotion_state: {
      emotion_id: params.emotion_motion.emotion_id,
      intensity: interpolateEmotion(
        schedule.motion_progress,
        params.emotion_motion.intensity_start,
        params.emotion_motion.intensity_end
      ),
      arc_type: params.emotion_motion.arc_type,
    },
    composition_state: {
      composition_id: videoState.composition_state.composition_id,
      prop_anchor_ids: [...videoState.composition_state.prop_anchor_ids],
      character_positions: { ...videoState.composition_state.character_positions },
    },
    location_state: {
      location_id: videoState.location_state.location_id,
      layout_lock_id: videoState.location_state.layout_lock_id,
      location_lock_preserved: params.environment_motion.location_lock_preserved,
    },
    identity_state: {
      protected_character_ids: [...videoState.identity_state.protected_character_ids],
      identity_lock_tokens: [...videoState.identity_state.identity_lock_tokens],
    },
    continuity_locks: {
      identity_locks: [...videoState.continuity_locks.identity_locks],
      location_locks: [...videoState.continuity_locks.location_locks],
      composition_locks: compositionLocks,
    },
  };
}

export function compileGonegiKeyframePlan(
  videoState: GonegiVideoState,
  spec: (typeof SEED_GONEGI_KEYFRAME_PLAN_SPECS)[number],
  replacementTrace: GonegiSceneState['replacement_trace']
): GonegiKeyframePlan {
  const durationSeconds = videoState.video_parameters.duration_seconds;
  const fpsTarget = videoState.video_parameters.fps_target;
  const keyframeCount = deriveKeyframePlanCount(durationSeconds);
  const schedule = deriveGonegiKeyframeSchedule(durationSeconds, keyframeCount);

  const keyframes = schedule.map((entry, index) =>
    buildKeyframeEntry(index, entry, videoState)
  );

  return {
    gonegi_keyframe_plan_id: spec.gonegi_keyframe_plan_id,
    phase: KEYFRAME_COMPILER_PHASE,
    source_gonegi_video_state_id: spec.source_gonegi_video_state_id,
    gonegi_state_id: videoState.gonegi_state_id,
    duration_seconds: durationSeconds,
    fps_target: fpsTarget,
    keyframe_count: keyframeCount,
    keyframes,
    identity_locks: [...videoState.continuity_locks.identity_locks],
    continuity_locks: {
      identity_locks: [...videoState.continuity_locks.identity_locks],
      location_locks: [...videoState.continuity_locks.location_locks],
      composition_locks: [...(videoState.continuity_locks.composition_locks ?? [])],
    },
    translation_trace: {
      ...videoState.translation_trace,
      keyframe_plan_translation: {
        compiler_phase: KEYFRAME_COMPILER_PHASE,
        defaults_id: VIDEO_STATE_DEFAULTS_ID,
        reference_schema: KEYFRAME_PLAN_SCHEMA_PATH,
      },
    },
    replacement_trace: {
      contract_id: replacementTrace.contract_id,
      replacements_applied: replacementTrace.replacements_applied.map((entry) => ({ ...entry })),
      companions_injected: [...replacementTrace.companions_injected],
    },
    director_blend_ref: BLEND_ID,
    video_defaults_ref: VIDEO_STATE_DEFAULTS_ID,
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_keyframe_plan',
      production_registry: false,
      draft_status: 'gonegi_keyframe_plan_compiled_v1',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllGonegiKeyframePlans(projectRoot?: string): GonegiKeyframePlan[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, GONEGI_VIDEO_STATE_REGISTRY_PATH))) {
    throw new Error(`Missing gonegi video state registry: ${GONEGI_VIDEO_STATE_REGISTRY_PATH}`);
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  if (!fs.existsSync(path.join(root, KEYFRAME_PLAN_SCHEMA_PATH))) {
    throw new Error(`Missing reference keyframe schema: ${KEYFRAME_PLAN_SCHEMA_PATH}`);
  }

  const plans: GonegiKeyframePlan[] = [];
  for (const spec of SEED_GONEGI_KEYFRAME_PLAN_SPECS) {
    const videoState = loadGonegiVideoState(root, spec.source_gonegi_video_state_id);
    if (!videoState) {
      throw new Error(`Missing gonegi video state: ${spec.source_gonegi_video_state_id}`);
    }

    const gonegiSceneState = loadGonegiSceneState(root, videoState.gonegi_state_id);
    if (!gonegiSceneState) {
      throw new Error(`Missing gonegi scene state: ${videoState.gonegi_state_id}`);
    }

    plans.push(compileGonegiKeyframePlan(videoState, spec, gonegiSceneState.replacement_trace));
  }

  return plans;
}

export function writeGonegiKeyframePlans(projectRoot?: string): {
  plans: GonegiKeyframePlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = compileAllGonegiKeyframePlans(root);
  const outDir = path.join(root, GONEGI_KEYFRAME_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${GONEGI_KEYFRAME_PLANS_DIR}/${plan.gonegi_keyframe_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { plans, written };
}

export function loadGonegiKeyframePlan(
  projectRoot: string,
  gonegiKeyframePlanId: string
): GonegiKeyframePlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_KEYFRAME_PLANS_DIR, `${gonegiKeyframePlanId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiKeyframePlan;
}
