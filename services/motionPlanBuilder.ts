import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  loadKeyframePlan,
  type KeyframeEntry,
  type KeyframePlan,
} from './keyframePlanBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOTION_PLAN_PHASE = 'PHASE-21-MOTION-PLAN-BUILDER-001' as const;
export const MOTION_PLAN_REGISTRY_PATH = 'datasets/motion_plan/motion-plan-registry.json' as const;

export const CAMERA_MOTION_CATEGORIES = Object.freeze([
  'static',
  'pan',
  'tilt',
  'push_in',
  'pull_out',
  'dolly',
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
  'hope',
  'wonder',
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

export const SEED_MOTION_PLAN_SPECS = Object.freeze([
  {
    motion_plan_id: 'motion_plan_gonegi_bedroom_reading_6s_v1',
    source_keyframe_plan_id: 'keyframe_plan_gonegi_bedroom_reading_6s_v1',
  },
  {
    motion_plan_id: 'motion_plan_gonegi_dana_harbor_reunion_8s_v1',
    source_keyframe_plan_id: 'keyframe_plan_gonegi_dana_harbor_reunion_8s_v1',
  },
  {
    motion_plan_id: 'motion_plan_olive_hill_wonder_6s_v1',
    source_keyframe_plan_id: 'keyframe_plan_olive_hill_wonder_6s_v1',
  },
] as const);

export type MotionSegment = {
  segment_id: string;
  from_keyframe: number;
  to_keyframe: number;
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

export type MotionPlan = {
  motion_plan_id: string;
  phase: typeof MOTION_PLAN_PHASE;
  source_keyframe_plan_id: string;
  source_video_shot_state_id: string;
  motion_segments: MotionSegment[];
  built_at: string;
};

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
  if (locationId.includes('olive') || locationId.includes('hill') || locationId.includes('grass')) {
    return 'foliage';
  }
  if (locationId.includes('rooftop') || locationId.includes('overlook')) {
    return 'wind';
  }
  return 'ambient';
}

function deriveCameraMotion(
  from: KeyframeEntry,
  to: KeyframeEntry
): MotionSegment['camera_motion'] {
  const delta = to.camera_state.motion_progress - from.camera_state.motion_progress;
  const fromShot = from.camera_state.shot_type;
  const toShot = to.camera_state.shot_type;

  let category: CameraMotionCategory = 'static';
  if (delta === 0 && fromShot === toShot) {
    category = 'static';
  } else if (fromShot !== toShot && toShot === 'close') {
    category = 'push_in';
  } else if (from.camera_state.motion_type.includes('arc')) {
    category = 'dolly';
  } else if (toShot === 'wide' && fromShot !== 'wide') {
    category = 'pull_out';
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
  from: KeyframeEntry,
  to: KeyframeEntry
): MotionSegment['character_motion'] {
  return from.character_state.active_character_ids.map((characterId) => {
    const fromPos =
      from.character_state.positions[characterId] ??
      from.composition_state.character_positions[characterId] ??
      'scene_anchor';
    const toPos =
      to.character_state.positions[characterId] ??
      to.composition_state.character_positions[characterId] ??
      fromPos;

    const isPrimary =
      characterId === from.character_state.active_character_ids[0] ||
      from.character_state.beat_phase === 'develop';

    let category: CharacterMotionCategory = 'idle';
    if (fromPos === toPos) {
      if (fromPos.includes('chair') || fromPos.includes('seat')) category = 'sit';
      else if (to.keyframe_role === 'end' && isPrimary) category = 'look';
      else if (from.character_state.beat_phase === 'develop') category = 'gesture';
      else category = 'idle';
    } else if (fromPos !== toPos) {
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
  from: KeyframeEntry,
  to: KeyframeEntry
): MotionSegment {
  const locationId = from.location_state.location_id;
  const propCount = from.composition_state.prop_anchor_ids.length;

  return {
    segment_id: `${planId}_seg_${from.keyframe_index}_to_${to.keyframe_index}`,
    from_keyframe: from.keyframe_index,
    to_keyframe: to.keyframe_index,
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
      elements: [locationId, ...(from.composition_state.prop_anchor_ids ?? [])],
    },
    continuity_locks: {
      identity_locks: [...from.continuity_locks.identity_locks],
      location_locks: [...from.continuity_locks.location_locks],
      composition_locks: [...from.continuity_locks.composition_locks],
    },
  };
}

export function loadMotionPlan(
  projectRoot: string,
  motionPlanId: string
): MotionPlan | null {
  const registry = readJsonRecord(projectRoot, MOTION_PLAN_REGISTRY_PATH) as {
    motion_plans?: Array<{ motion_plan_id: string; plan_path: string }>;
  } | null;

  const entry = registry?.motion_plans?.find((p) => p.motion_plan_id === motionPlanId);
  if (!entry) return null;

  const abs = path.join(resolveProjectRoot(projectRoot), entry.plan_path);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MotionPlan;
}

export function buildMotionPlan(
  keyframePlan: KeyframePlan,
  motionPlanId: string
): MotionPlan {
  const segments: MotionSegment[] = [];

  for (let i = 0; i < keyframePlan.keyframes.length - 1; i += 1) {
    const from = keyframePlan.keyframes[i];
    const to = keyframePlan.keyframes[i + 1];
    segments.push(buildMotionSegment(motionPlanId, from, to));
  }

  return {
    motion_plan_id: motionPlanId,
    phase: MOTION_PLAN_PHASE,
    source_keyframe_plan_id: keyframePlan.keyframe_plan_id,
    source_video_shot_state_id: keyframePlan.source_video_shot_state_id,
    motion_segments: segments,
    built_at: new Date().toISOString(),
  };
}

export function buildSeedMotionPlans(projectRoot?: string): MotionPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const plans: MotionPlan[] = [];

  for (const spec of SEED_MOTION_PLAN_SPECS) {
    const keyframePlan = loadKeyframePlan(root, spec.source_keyframe_plan_id);
    if (!keyframePlan) {
      throw new Error(`Missing keyframe plan: ${spec.source_keyframe_plan_id}`);
    }
    plans.push(buildMotionPlan(keyframePlan, spec.motion_plan_id));
  }

  return plans;
}

export function writeMotionPlans(
  projectRoot: string,
  plans: MotionPlan[],
  storageDir = 'datasets/motion_plan/plans'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${storageDir}/${plan.motion_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
