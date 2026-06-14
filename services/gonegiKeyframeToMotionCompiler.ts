import fs from 'node:fs';
import path from 'node:path';
import { BLEND_PROFILE_PATH } from './directorGrammarBlendBuilder.js';
import {
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  type GonegiKeyframeEntry,
  type GonegiKeyframePlan,
  loadGonegiKeyframePlan,
} from './gonegiVideoStateToKeyframeCompiler.js';
import {
  MOTION_PLAN_SCHEMA_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  type VideoStateDefaults,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-016-GONEGI_KEYFRAME_TO_MOTION_COMPILER_V2' as const;
export const GONEGI_MOTION_PLAN_SCHEMA_PATH =
  'datasets/gonegi_motion_plan/gonegi-motion-plan.schema.json' as const;
export const GONEGI_MOTION_PLAN_REGISTRY_PATH =
  'datasets/gonegi_motion_plan/gonegi-motion-plan-registry.json' as const;
export const GONEGI_MOTION_PLANS_DIR = 'datasets/gonegi_motion_plan/plans' as const;

export const CAMERA_MOTION_CATEGORIES = Object.freeze([
  'static',
  'pan',
  'tilt',
  'push_in',
  'pull_out',
  'orbit',
] as const);

export const CHARACTER_MOTION_CATEGORIES = Object.freeze([
  'idle',
  'walk',
  'turn',
  'look',
  'gesture',
  'sit',
  'stand',
] as const);

export const EMOTION_MOTION_CATEGORIES = Object.freeze([
  'calm',
  'wonder',
  'hope',
  'reunion',
  'farewell',
] as const);

export const ENVIRONMENT_MOTION_CATEGORIES = Object.freeze([
  'wind',
  'water',
  'cloud',
  'foliage',
  'ambient',
] as const);

export type CameraMotionCategory = (typeof CAMERA_MOTION_CATEGORIES)[number];
export type CharacterMotionCategory = (typeof CHARACTER_MOTION_CATEGORIES)[number];
export type EmotionMotionCategory = (typeof EMOTION_MOTION_CATEGORIES)[number];
export type EnvironmentMotionCategory = (typeof ENVIRONMENT_MOTION_CATEGORIES)[number];

export const SEED_GONEGI_MOTION_PLAN_SPECS = Object.freeze([
  {
    gonegi_motion_plan_id: 'gonegi_motion_ghibli_kitchen_v1',
    source_keyframe_plan_id: 'gonegi_keyframe_ghibli_kitchen_v1',
  },
  {
    gonegi_motion_plan_id: 'gonegi_motion_shinkai_sky_light_v1',
    source_keyframe_plan_id: 'gonegi_keyframe_shinkai_sky_light_v1',
  },
  {
    gonegi_motion_plan_id: 'gonegi_motion_live_action_dialogue_v1',
    source_keyframe_plan_id: 'gonegi_keyframe_live_action_dialogue_v1',
  },
  {
    gonegi_motion_plan_id: 'gonegi_motion_mori_emotion_flow_v1',
    source_keyframe_plan_id: 'gonegi_keyframe_mori_emotion_flow_v1',
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

export type GonegiMotionSegment = {
  segment_id: string;
  from_keyframe: number;
  to_keyframe: number;
  from_timestamp: number;
  to_timestamp: number;
  duration_seconds: number;
  camera_motion: {
    motion_category: CameraMotionCategory;
    from_shot_type: string;
    to_shot_type: string;
    motion_progress_delta: number;
    identity_safe: boolean;
    speed: 'static' | 'slow' | 'moderate';
  };
  character_motion: Array<{
    character_id: string;
    motion_category: CharacterMotionCategory;
    from_position: string;
    to_position: string;
    identity_lock_preserved: boolean;
  }>;
  emotion_motion: {
    motion_category: EmotionMotionCategory;
    emotion_id: string;
    intensity_start: number;
    intensity_end: number;
  };
  environment_motion: {
    motion_category: EnvironmentMotionCategory;
    location_lock_preserved: boolean;
    prop_lock_preserved: boolean;
    elements: string[];
  };
  continuity_locks: {
    identity_locks: string[];
    location_locks: string[];
    composition_locks: string[];
  };
};

export type GonegiMotionPlan = {
  gonegi_motion_plan_id: string;
  phase: typeof MOTION_COMPILER_PHASE;
  source_keyframe_plan_id: string;
  segment_count: number;
  motion_segments: GonegiMotionSegment[];
  identity_locks: string[];
  continuity_locks: GonegiKeyframePlan['continuity_locks'];
  translation_trace: GonegiKeyframePlan['translation_trace'] & {
    motion_plan_translation: {
      compiler_phase: typeof MOTION_COMPILER_PHASE;
      reference_schema: typeof MOTION_PLAN_SCHEMA_PATH;
      blend_id: typeof BLEND_ID;
    };
  };
  replacement_trace: GonegiKeyframePlan['replacement_trace'];
  director_blend_ref: typeof BLEND_ID;
  motion_defaults: {
    source_family: string;
    camera_motion_category_default: string;
    character_motion_category_default: string;
    environment_motion_category_default: string;
    emotion_motion_category_default: string;
    speed_default: string;
  };
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_motion_plan';
    production_registry: false;
    draft_status: 'gonegi_motion_plan_compiled_v1';
  };
  execution_flags: typeof EXECUTION_FLAGS;
  compiled_at: string;
};

export function deriveSegmentCount(keyframeCount: number): number {
  return keyframeCount - 1;
}

function mapEmotionCategory(emotionId: string): EmotionMotionCategory {
  if (emotionId === 'hope') return 'hope';
  if (emotionId === 'wonder') return 'wonder';
  if (emotionId === 'reunion') return 'reunion';
  if (emotionId === 'farewell') return 'farewell';
  return 'calm';
}

function mapEnvironmentCategory(locationId: string): EnvironmentMotionCategory {
  if (locationId.includes('harbor') || locationId.includes('dock') || locationId.includes('pier')) {
    return 'water';
  }
  if (locationId.includes('sky') || locationId.includes('rooftop') || locationId.includes('overlook')) {
    return 'cloud';
  }
  if (locationId.includes('olive') || locationId.includes('hill') || locationId.includes('forest')) {
    return 'foliage';
  }
  if (locationId.includes('kitchen') || locationId.includes('bakery')) {
    return 'ambient';
  }
  return 'ambient';
}

function deriveCameraMotion(
  from: GonegiKeyframeEntry,
  to: GonegiKeyframeEntry
): GonegiMotionSegment['camera_motion'] {
  const delta = to.camera_state.motion_progress - from.camera_state.motion_progress;
  const fromShot = from.camera_state.shot_type;
  const toShot = to.camera_state.shot_type;

  let category: CameraMotionCategory = 'static';
  if (delta === 0 && fromShot === toShot) {
    category = 'static';
  } else if (from.camera_state.motion_type.includes('push') || (fromShot !== toShot && toShot === 'close')) {
    category = 'push_in';
  } else if (toShot === 'wide' && fromShot !== 'wide') {
    category = 'pull_out';
  } else if (from.camera_state.motion_type.includes('orbit')) {
    category = 'orbit';
  } else if (from.camera_state.motion_type.includes('tilt')) {
    category = 'tilt';
  } else if (delta > 0) {
    category = 'pan';
  }

  return {
    motion_category: category,
    from_shot_type: fromShot,
    to_shot_type: toShot,
    motion_progress_delta: Math.round(delta * 1000) / 1000,
    identity_safe: from.camera_state.identity_safe && to.camera_state.identity_safe,
    speed: delta >= 0.4 ? 'moderate' : delta > 0 ? 'slow' : 'static',
  };
}

function deriveCharacterMotion(
  from: GonegiKeyframeEntry,
  to: GonegiKeyframeEntry
): GonegiMotionSegment['character_motion'] {
  return from.character_state.active_character_ids.map((characterId) => {
    const fromPos =
      from.character_state.positions[characterId] ??
      from.composition_state.character_positions[characterId] ??
      'scene_anchor';
    const toPos =
      to.character_state.positions[characterId] ??
      to.composition_state.character_positions[characterId] ??
      fromPos;

    const isCompanion = characterId === 'gamja' || characterId === 'aengdu';
    const isPrimary = characterId === from.character_state.active_character_ids[0];

    let category: CharacterMotionCategory = 'idle';
    if (fromPos === toPos) {
      if (fromPos.includes('chair') || fromPos.includes('seat')) {
        category = 'sit';
      } else if (to.keyframe_role === 'end' && isPrimary) {
        category = 'look';
      } else if (from.character_state.beat_phase === 'develop' && isPrimary) {
        category = 'gesture';
      } else if (from.character_state.beat_phase === 'release') {
        category = 'turn';
      } else if (isCompanion) {
        category = 'idle';
      } else if (from.character_state.beat_phase === 'establish') {
        category = 'stand';
      } else {
        category = 'idle';
      }
    } else {
      category = 'walk';
    }

    return {
      character_id: characterId,
      motion_category: category,
      from_position: fromPos,
      to_position: toPos,
      identity_lock_preserved: true,
    };
  });
}

function buildMotionSegment(
  planId: string,
  from: GonegiKeyframeEntry,
  to: GonegiKeyframeEntry
): GonegiMotionSegment {
  const locationId = from.location_state.location_id;
  const propCount = from.composition_state.prop_anchor_ids.length;

  return {
    segment_id: `${planId}_seg_${from.keyframe_index}_to_${to.keyframe_index}`,
    from_keyframe: from.keyframe_index,
    to_keyframe: to.keyframe_index,
    from_timestamp: from.timestamp,
    to_timestamp: to.timestamp,
    duration_seconds: Math.round((to.timestamp - from.timestamp) * 1000) / 1000,
    camera_motion: deriveCameraMotion(from, to),
    character_motion: deriveCharacterMotion(from, to),
    emotion_motion: {
      motion_category: mapEmotionCategory(from.emotion_state.emotion_id),
      emotion_id: from.emotion_state.emotion_id,
      intensity_start: from.emotion_state.intensity,
      intensity_end: to.emotion_state.intensity,
    },
    environment_motion: {
      motion_category: mapEnvironmentCategory(locationId),
      location_lock_preserved:
        from.location_state.location_lock_preserved && to.location_state.location_lock_preserved,
      prop_lock_preserved: propCount === 0 || from.continuity_locks.composition_locks.length > 0,
      elements: [locationId, ...from.composition_state.prop_anchor_ids],
    },
    continuity_locks: {
      identity_locks: [...from.continuity_locks.identity_locks],
      location_locks: [...from.continuity_locks.location_locks],
      composition_locks: [...from.continuity_locks.composition_locks],
    },
  };
}

function buildMotionDefaults(defaults: VideoStateDefaults): GonegiMotionPlan['motion_defaults'] {
  const motion = defaults.motion_defaults;
  return {
    source_family: motion.source_family,
    camera_motion_category_default: motion.camera_motion_category_default,
    character_motion_category_default: motion.character_motion_category_default,
    environment_motion_category_default: motion.environment_motion_category_default,
    emotion_motion_category_default: motion.emotion_motion_category_default,
    speed_default: defaults.downstream_defaults.motion_plan.speed_default,
  };
}

export function compileGonegiMotionPlan(
  keyframePlan: GonegiKeyframePlan,
  spec: (typeof SEED_GONEGI_MOTION_PLAN_SPECS)[number],
  defaults: VideoStateDefaults
): GonegiMotionPlan {
  const segments: GonegiMotionSegment[] = [];

  for (let i = 0; i < keyframePlan.keyframes.length - 1; i += 1) {
    const from = keyframePlan.keyframes[i];
    const to = keyframePlan.keyframes[i + 1];
    segments.push(buildMotionSegment(spec.gonegi_motion_plan_id, from, to));
  }

  const segmentCount = deriveSegmentCount(keyframePlan.keyframe_count);

  return {
    gonegi_motion_plan_id: spec.gonegi_motion_plan_id,
    phase: MOTION_COMPILER_PHASE,
    source_keyframe_plan_id: spec.source_keyframe_plan_id,
    segment_count: segmentCount,
    motion_segments: segments,
    identity_locks: [...keyframePlan.identity_locks],
    continuity_locks: {
      identity_locks: [...keyframePlan.continuity_locks.identity_locks],
      location_locks: [...keyframePlan.continuity_locks.location_locks],
      composition_locks: [...(keyframePlan.continuity_locks.composition_locks ?? [])],
    },
    translation_trace: {
      ...keyframePlan.translation_trace,
      motion_plan_translation: {
        compiler_phase: MOTION_COMPILER_PHASE,
        reference_schema: MOTION_PLAN_SCHEMA_PATH,
        blend_id: BLEND_ID,
      },
    },
    replacement_trace: {
      contract_id: keyframePlan.replacement_trace.contract_id,
      replacements_applied: keyframePlan.replacement_trace.replacements_applied.map((entry) => ({
        ...entry,
      })),
      companions_injected: [...keyframePlan.replacement_trace.companions_injected],
    },
    director_blend_ref: BLEND_ID,
    motion_defaults: buildMotionDefaults(defaults),
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_motion_plan',
      production_registry: false,
      draft_status: 'gonegi_motion_plan_compiled_v1',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllGonegiMotionPlans(projectRoot?: string): GonegiMotionPlan[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, GONEGI_KEYFRAME_PLAN_REGISTRY_PATH))) {
    throw new Error(`Missing gonegi keyframe plan registry: ${GONEGI_KEYFRAME_PLAN_REGISTRY_PATH}`);
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  if (!fs.existsSync(path.join(root, MOTION_PLAN_SCHEMA_PATH))) {
    throw new Error(`Missing reference motion schema: ${MOTION_PLAN_SCHEMA_PATH}`);
  }

  if (!fs.existsSync(path.join(root, BLEND_PROFILE_PATH))) {
    throw new Error(`Missing director blend profile: ${BLEND_PROFILE_PATH}`);
  }

  const plans: GonegiMotionPlan[] = [];
  for (const spec of SEED_GONEGI_MOTION_PLAN_SPECS) {
    const keyframePlan = loadGonegiKeyframePlan(root, spec.source_keyframe_plan_id);
    if (!keyframePlan) {
      throw new Error(`Missing gonegi keyframe plan: ${spec.source_keyframe_plan_id}`);
    }
    plans.push(compileGonegiMotionPlan(keyframePlan, spec, defaults));
  }

  return plans;
}

export function writeGonegiMotionPlans(projectRoot?: string): {
  plans: GonegiMotionPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = compileAllGonegiMotionPlans(root);
  const outDir = path.join(root, GONEGI_MOTION_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${GONEGI_MOTION_PLANS_DIR}/${plan.gonegi_motion_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { plans, written };
}

export function loadGonegiMotionPlan(
  projectRoot: string,
  gonegiMotionPlanId: string
): GonegiMotionPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_MOTION_PLANS_DIR, `${gonegiMotionPlanId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiMotionPlan;
}
