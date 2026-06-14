import fs from 'node:fs';
import path from 'node:path';
import {
  BLEND_PROFILE_PATH,
  type BlendedGrammarBlock,
  type DirectorGrammarBlendProfile,
} from './directorGrammarBlendBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-007-SOURCE_VIDEO_GRAMMAR_TO_VIDEO_STATE_COMPILER_V1' as const;
export const VIDEO_STATE_DEFAULTS_ID = 'video-state-defaults-v1' as const;
export const VIDEO_STATE_DEFAULTS_SCHEMA_PATH =
  'datasets/video_state/video-state-defaults.schema.json' as const;
export const VIDEO_STATE_DEFAULTS_PATH = 'datasets/video_state/video-state-defaults-v1.json' as const;
export const VIDEO_SHOT_STATE_SCHEMA_PATH = 'datasets/video_state/video-shot-state.schema.json' as const;
export const KEYFRAME_PLAN_SCHEMA_PATH = 'datasets/keyframe_plan/keyframe-plan.schema.json' as const;
export const MOTION_PLAN_SCHEMA_PATH = 'datasets/motion_plan/motion-plan.schema.json' as const;

export type VideoStateDefaults = {
  defaults_id: typeof VIDEO_STATE_DEFAULTS_ID;
  phase: typeof COMPILER_PHASE;
  source_blend_id: string;
  visual_style_defaults: GrammarDefaultsBlock & { render_style_tokens: string[] };
  camera_defaults: CameraDefaultsBlock;
  lighting_defaults: LightingDefaultsBlock;
  blocking_defaults: BlockingDefaultsBlock;
  emotion_defaults: EmotionDefaultsBlock;
  motion_defaults: MotionDefaultsBlock;
  environment_defaults: EnvironmentDefaultsBlock;
  identity_safety_defaults: IdentitySafetyDefaults;
  downstream_defaults: DownstreamDefaults;
  family_provenance: FamilyProvenance;
  schema_refs: {
    video_shot_state_schema: string;
    keyframe_plan_schema: string;
    motion_plan_schema: string;
  };
  execution_flags: ExecutionFlags;
  compiled_at: string;
};

type GrammarDefaultsBlock = {
  summary: string;
  patterns: string[];
  constraints: string[];
  source_family: string;
  source_grammar_id: string;
};

type CameraDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'SHINKAI';
  motion_type_default: string;
  speed_default: 'static' | 'slow' | 'moderate' | 'fast';
  identity_safe_default: true;
  shot_type_sequence: string[];
  camera_height_default: string;
};

type LightingDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'SHINKAI';
  lighting_mood_default: string;
  time_of_day_bias: string[];
};

type BlockingDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'LIVE_ACTION';
  ensemble_geometry_default: string;
  relationship_implied: true;
};

type EmotionDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'GHIBLI';
  emotion_id_default: string;
  arc_type_default: string;
  intensity_start_default: number;
  intensity_end_default: number;
};

type MotionDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'MORI';
  camera_motion_category_default: string;
  character_motion_category_default: string;
  environment_motion_category_default: string;
  emotion_motion_category_default: string;
};

type EnvironmentDefaultsBlock = GrammarDefaultsBlock & {
  source_family: 'GHIBLI';
  location_lock_preserved_default: true;
  ambient_elements_default: string[];
};

type IdentitySafetyDefaults = {
  identity_priority_first: true;
  character_first_blocking: true;
  identity_lock_required: true;
  identity_safe_camera_default: true;
  protected_world_identity: 'GONEGI_MEDITERRANEAN';
  priority_rules: string[];
};

type DownstreamDefaults = {
  video_shot_state: {
    fps_target: 24;
    keyframe_count_basis: string;
    render_intent: {
      preparation_only: true;
      gpu_execution: false;
      target_pipeline: string;
      next_phase: string;
    };
  };
  keyframe_plan: {
    min_keyframes: number;
    keyframe_roles: string[];
    identity_safe_default: true;
    beat_phase_default: string;
  };
  motion_plan: {
    min_segments: number;
    identity_lock_preserved_default: true;
    location_lock_preserved_default: true;
    speed_default: string;
  };
  gpu_payload: {
    render_mode: string;
    resolution: string;
    aspect_ratio: string;
    render_constraints: string[];
    negative_constraints: string[];
    execution_flags: {
      gpu_execution: false;
      preparation_only: true;
      external_call_allowed: false;
    };
  };
};

type FamilyProvenance = {
  visual_style: 'GHIBLI';
  camera: 'SHINKAI';
  lighting: 'SHINKAI';
  blocking: 'LIVE_ACTION';
  emotion: 'GHIBLI';
  motion: 'MORI';
  environment: 'GHIBLI';
};

type ExecutionFlags = {
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

function loadBlendProfile(projectRoot: string): DirectorGrammarBlendProfile | null {
  const abs = path.join(projectRoot, BLEND_PROFILE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarBlendProfile;
}

function toGrammarBlock(block: BlendedGrammarBlock): GrammarDefaultsBlock {
  return {
    summary: block.summary,
    patterns: [...block.patterns],
    constraints: [...block.constraints],
    source_family: block.source_family,
    source_grammar_id: block.source_grammar_id,
  };
}

function deriveCameraDefaults(block: BlendedGrammarBlock): CameraDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'SHINKAI',
    motion_type_default: 'slow_push_on_revelation',
    speed_default: 'slow',
    identity_safe_default: true,
    shot_type_sequence: ['establishing_wide', 'medium', 'profile_close', 'reaction'],
    camera_height_default: 'eye_level',
  };
}

function deriveLightingDefaults(block: BlendedGrammarBlock): LightingDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'SHINKAI',
    lighting_mood_default: 'twilight_color_separation',
    time_of_day_bias: ['golden_hour', 'blue_hour', 'cloud_break'],
  };
}

function deriveBlockingDefaults(block: BlendedGrammarBlock): BlockingDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'LIVE_ACTION',
    ensemble_geometry_default: block.patterns[0] ?? 'hearth-circle',
    relationship_implied: true,
  };
}

function deriveEmotionDefaults(block: BlendedGrammarBlock): EmotionDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'GHIBLI',
    emotion_id_default: 'hope',
    arc_type_default: 'steady_hope',
    intensity_start_default: 0.6,
    intensity_end_default: 0.75,
  };
}

function deriveMotionDefaults(block: BlendedGrammarBlock): MotionDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'MORI',
    camera_motion_category_default: 'dolly',
    character_motion_category_default: 'walk',
    environment_motion_category_default: 'ambient',
    emotion_motion_category_default: 'hope',
  };
}

function deriveEnvironmentDefaults(block: BlendedGrammarBlock): EnvironmentDefaultsBlock {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'GHIBLI',
    location_lock_preserved_default: true,
    ambient_elements_default: block.patterns.slice(0, 3),
  };
}

function deriveVisualStyleDefaults(block: BlendedGrammarBlock) {
  const base = toGrammarBlock(block);
  return {
    ...base,
    source_family: 'GHIBLI' as const,
    render_style_tokens: [
      'hand-painted-warmth',
      'mediterranean-pastoral',
      'domestic-intimacy',
      'readable-environmental-storytelling',
    ],
  };
}

function deriveIdentitySafety(blend: DirectorGrammarBlendProfile): IdentitySafetyDefaults {
  return {
    identity_priority_first: true,
    character_first_blocking: true,
    identity_lock_required: true,
    identity_safe_camera_default: true,
    protected_world_identity: 'GONEGI_MEDITERRANEAN',
    priority_rules: [...blend.priority_order],
  };
}

function deriveDownstreamDefaults(blend: DirectorGrammarBlendProfile): DownstreamDefaults {
  const allConstraints = [
    ...blend.blended_grammar.visual_style.constraints,
    ...blend.blended_grammar.camera_grammar.constraints,
    ...blend.blended_grammar.lighting_grammar.constraints,
    ...blend.blended_grammar.blocking_grammar.constraints,
    ...blend.blended_grammar.emotion_grammar.constraints,
    ...blend.blended_grammar.motion_grammar.constraints,
    ...blend.blended_grammar.environment_grammar.constraints,
  ];

  return {
    video_shot_state: {
      fps_target: 24,
      keyframe_count_basis: 'duration_seconds_times_two_capped',
      render_intent: {
        preparation_only: true,
        gpu_execution: false,
        target_pipeline: 'source_video_grammar_blend_defaults_v1',
        next_phase: 'PHASE-SOURCE-VIDEO-008-SOURCE_VIDEO_SCENE_SEGMENT_SCHEMA_V1',
      },
    },
    keyframe_plan: {
      min_keyframes: 3,
      keyframe_roles: ['start', 'transition', 'midpoint', 'end'],
      identity_safe_default: true,
      beat_phase_default: 'establish',
    },
    motion_plan: {
      min_segments: 1,
      identity_lock_preserved_default: true,
      location_lock_preserved_default: true,
      speed_default: 'slow',
    },
    gpu_payload: {
      render_mode: 'preparation_stub_v1',
      resolution: '1280x720',
      aspect_ratio: '16:9',
      render_constraints: allConstraints.slice(0, 8),
      negative_constraints: [
        'no-neon-city-tokens',
        'no-hard-cgi-shine',
        'no-chase-sequence-default',
        'no-future-tech-props',
        'no-identity-breaking-landmark-swap',
      ],
      execution_flags: {
        gpu_execution: false,
        preparation_only: true,
        external_call_allowed: false,
      },
    },
  };
}

export function compileVideoStateDefaults(projectRoot?: string): VideoStateDefaults {
  const root = resolveProjectRoot(projectRoot);
  const blend = loadBlendProfile(root);
  if (!blend) {
    throw new Error(`Missing blend profile: ${BLEND_PROFILE_PATH}`);
  }

  const grammar = blend.blended_grammar;

  return {
    defaults_id: VIDEO_STATE_DEFAULTS_ID,
    phase: COMPILER_PHASE,
    source_blend_id: blend.blend_id,
    visual_style_defaults: deriveVisualStyleDefaults(grammar.visual_style),
    camera_defaults: deriveCameraDefaults(grammar.camera_grammar),
    lighting_defaults: deriveLightingDefaults(grammar.lighting_grammar),
    blocking_defaults: deriveBlockingDefaults(grammar.blocking_grammar),
    emotion_defaults: deriveEmotionDefaults(grammar.emotion_grammar),
    motion_defaults: deriveMotionDefaults(grammar.motion_grammar),
    environment_defaults: deriveEnvironmentDefaults(grammar.environment_grammar),
    identity_safety_defaults: deriveIdentitySafety(blend),
    downstream_defaults: deriveDownstreamDefaults(blend),
    family_provenance: {
      visual_style: 'GHIBLI',
      camera: 'SHINKAI',
      lighting: 'SHINKAI',
      blocking: 'LIVE_ACTION',
      emotion: 'GHIBLI',
      motion: 'MORI',
      environment: 'GHIBLI',
    },
    schema_refs: {
      video_shot_state_schema: VIDEO_SHOT_STATE_SCHEMA_PATH,
      keyframe_plan_schema: KEYFRAME_PLAN_SCHEMA_PATH,
      motion_plan_schema: MOTION_PLAN_SCHEMA_PATH,
    },
    execution_flags: {
      design_only: true,
      gpu_execution: false,
      external_call_allowed: false,
      frame_extraction: false,
      ocr: false,
      generation: false,
    },
    compiled_at: new Date().toISOString(),
  };
}

export function writeVideoStateDefaults(projectRoot?: string): VideoStateDefaults {
  const root = resolveProjectRoot(projectRoot);
  const defaults = compileVideoStateDefaults(root);
  fs.writeFileSync(
    path.join(root, VIDEO_STATE_DEFAULTS_PATH),
    `${JSON.stringify(defaults, null, 2)}\n`,
    'utf8'
  );
  return defaults;
}

export function loadVideoStateDefaults(projectRoot?: string): VideoStateDefaults | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_STATE_DEFAULTS_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as VideoStateDefaults;
}
