import fs from 'node:fs';
import path from 'node:path';
import { BLEND_PROFILE_PATH } from './directorGrammarBlendBuilder.js';
import type { ExtractableFamily } from './directorGrammarExtractor.js';
import {
  GONEGI_STATE_REGISTRY_PATH,
  type GonegiSceneState,
  loadGonegiSceneState,
} from './sourceStateToGonegiStateCompiler.js';
import {
  VIDEO_STATE_DEFAULTS_ID,
  VIDEO_STATE_DEFAULTS_PATH,
  type VideoStateDefaults,
  loadVideoStateDefaults,
} from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TRANSLATOR_PHASE =
  'PHASE-SOURCE-VIDEO-014-GONEGI_STATE_TO_VIDEO_STATE_TRANSLATOR_V1' as const;
export const GONEGI_VIDEO_STATE_SCHEMA_PATH =
  'datasets/gonegi_video_state/gonegi-video-state.schema.json' as const;
export const GONEGI_VIDEO_STATE_REGISTRY_PATH =
  'datasets/gonegi_video_state/gonegi-video-state-registry.json' as const;
export const GONEGI_VIDEO_STATES_DIR = 'datasets/gonegi_video_state/states' as const;

export const SEED_GONEGI_VIDEO_STATE_SPECS = Object.freeze([
  {
    gonegi_video_state_id: 'gonegi_video_state_ghibli_kitchen_v1',
    gonegi_state_id: 'gonegi_state_ghibli_kitchen_v1',
    duration_seconds: 24,
  },
  {
    gonegi_video_state_id: 'gonegi_video_state_shinkai_sky_light_v1',
    gonegi_state_id: 'gonegi_state_shinkai_sky_light_v1',
    duration_seconds: 26,
  },
  {
    gonegi_video_state_id: 'gonegi_video_state_live_action_dialogue_v1',
    gonegi_state_id: 'gonegi_state_live_action_dialogue_v1',
    duration_seconds: 33,
  },
  {
    gonegi_video_state_id: 'gonegi_video_state_mori_emotion_flow_v1',
    gonegi_state_id: 'gonegi_state_mori_emotion_flow_v1',
    duration_seconds: 25,
  },
] as const);

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

const BLEND_ID = 'gonegi-master-director-blend-v1' as const;

export type GonegiVideoState = {
  gonegi_video_state_id: string;
  phase: typeof TRANSLATOR_PHASE;
  gonegi_state_id: string;
  source_video_id: string;
  director_family: ExtractableFamily;
  director_blend_ref: typeof BLEND_ID;
  video_defaults_ref: typeof VIDEO_STATE_DEFAULTS_ID;
  identity_state: GonegiSceneState['identity_state'];
  character_state: GonegiSceneState['character_state'];
  emotion_state: GonegiSceneState['emotion_state'];
  relationship_state: GonegiSceneState['relationship_state'];
  camera_state: GonegiSceneState['camera_state'];
  composition_state: GonegiSceneState['composition_state'];
  location_state: GonegiSceneState['location_state'];
  lighting_state: GonegiSceneState['lighting_state'];
  environment_state: GonegiSceneState['environment_state'];
  video_parameters: {
    duration_seconds: number;
    fps_target: 24;
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
      identity_lock_preserved: true;
      start_position: string;
      end_position: string;
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
      location_lock_preserved: true;
      elements: string[];
    };
    visual_style_tokens: string[];
    lighting_mood: string;
    blocking_geometry: string;
    family_provenance: VideoStateDefaults['family_provenance'];
    render_intent: {
      preparation_only: true;
      gpu_execution: false;
      target_pipeline: 'gonegi_state_to_video_state_translator_v1';
      next_phase: 'PHASE-SOURCE-VIDEO-015-VIDEO_STATE_TO_KEYFRAME_COMPILER_V2';
    };
  };
  translation_trace: GonegiSceneState['translation_trace'] & {
    video_state_translation: {
      translator_phase: typeof TRANSLATOR_PHASE;
      defaults_id: typeof VIDEO_STATE_DEFAULTS_ID;
      blend_id: typeof BLEND_ID;
      director_family: ExtractableFamily;
    };
  };
  continuity_locks: GonegiSceneState['continuity_locks'];
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_video_state';
    production_registry: false;
    draft_status: 'gonegi_video_state_translated_v1';
  };
  execution_flags: typeof EXECUTION_FLAGS;
  translated_at: string;
};

function deriveKeyframeCount(durationSeconds: number): number {
  return Math.min(Math.max(2, Math.round(durationSeconds * 2)), 7200);
}

function buildCharacterMotion(
  gonegiState: GonegiSceneState,
  defaults: VideoStateDefaults
): GonegiVideoState['video_parameters']['character_motion'] {
  const motionCategory = defaults.motion_defaults.character_motion_category_default;
  return gonegiState.character_state.active_character_ids.map((characterId) => {
    const position =
      gonegiState.composition_state.character_positions[characterId] ?? 'scene_anchor';
    const isCompanion = gonegiState.character_state.companion_injected?.includes(characterId);
    return {
      character_id: characterId,
      motion_type: isCompanion ? 'companion_reaction' : motionCategory,
      path_description: isCompanion
        ? 'Minor supportive motion without crossing primary character foreground'
        : `Character motion preserving identity locks for ${characterId}`,
      identity_lock_preserved: true as const,
      start_position: position,
      end_position: position,
    };
  });
}

export function translateGonegiVideoState(
  gonegiState: GonegiSceneState,
  spec: (typeof SEED_GONEGI_VIDEO_STATE_SPECS)[number],
  defaults: VideoStateDefaults
): GonegiVideoState {
  const durationSeconds = spec.duration_seconds;
  const fpsTarget = defaults.downstream_defaults.video_shot_state.fps_target;
  const keyframeCount = deriveKeyframeCount(durationSeconds);

  const cameraMotionVectors = gonegiState.camera_state.motion_vectors ?? [];
  const cameraPath =
    cameraMotionVectors.length > 0
      ? cameraMotionVectors.join('; ')
      : `${gonegiState.camera_state.shot_type} hold with identity-safe framing`;

  return {
    gonegi_video_state_id: spec.gonegi_video_state_id,
    phase: TRANSLATOR_PHASE,
    gonegi_state_id: gonegiState.gonegi_state_id,
    source_video_id: gonegiState.source_video_id,
    director_family: gonegiState.director_family,
    director_blend_ref: BLEND_ID,
    video_defaults_ref: VIDEO_STATE_DEFAULTS_ID,
    identity_state: { ...gonegiState.identity_state },
    character_state: { ...gonegiState.character_state },
    emotion_state: { ...gonegiState.emotion_state },
    relationship_state: { ...gonegiState.relationship_state },
    camera_state: { ...gonegiState.camera_state },
    composition_state: { ...gonegiState.composition_state },
    location_state: { ...gonegiState.location_state },
    lighting_state: { ...gonegiState.lighting_state },
    environment_state: { ...gonegiState.environment_state },
    video_parameters: {
      duration_seconds: durationSeconds,
      fps_target: fpsTarget,
      keyframe_count: keyframeCount,
      camera_motion: {
        motion_type: defaults.camera_defaults.motion_type_default,
        path_description: cameraPath,
        speed: defaults.camera_defaults.speed_default,
        identity_safe: defaults.camera_defaults.identity_safe_default,
        shot_type_source: gonegiState.camera_state.shot_type,
      },
      character_motion: buildCharacterMotion(gonegiState, defaults),
      emotion_motion: {
        emotion_id: gonegiState.emotion_state.emotion_id,
        arc_type: defaults.emotion_defaults.arc_type_default,
        intensity_start: Math.min(
          gonegiState.emotion_state.intensity,
          defaults.emotion_defaults.intensity_start_default
        ),
        intensity_end: Math.max(
          gonegiState.emotion_state.intensity,
          defaults.emotion_defaults.intensity_end_default
        ),
      },
      environment_motion: {
        motion_type: defaults.motion_defaults.environment_motion_category_default,
        path_description: 'Background atmosphere only; no landmark relocation or layout mutation',
        location_lock_preserved: true,
        elements: [
          gonegiState.location_state.location_id,
          ...defaults.environment_defaults.ambient_elements_default.slice(0, 2),
        ],
      },
      visual_style_tokens: [...defaults.visual_style_defaults.render_style_tokens],
      lighting_mood: defaults.lighting_defaults.lighting_mood_default,
      blocking_geometry: defaults.blocking_defaults.ensemble_geometry_default,
      family_provenance: { ...defaults.family_provenance },
      render_intent: {
        preparation_only: true,
        gpu_execution: false,
        target_pipeline: 'gonegi_state_to_video_state_translator_v1',
        next_phase: 'PHASE-SOURCE-VIDEO-015-VIDEO_STATE_TO_KEYFRAME_COMPILER_V2',
      },
    },
    translation_trace: {
      ...gonegiState.translation_trace,
      video_state_translation: {
        translator_phase: TRANSLATOR_PHASE,
        defaults_id: VIDEO_STATE_DEFAULTS_ID,
        blend_id: BLEND_ID,
        director_family: gonegiState.director_family,
      },
    },
    continuity_locks: {
      identity_locks: [...gonegiState.continuity_locks.identity_locks],
      location_locks: [...gonegiState.continuity_locks.location_locks],
      composition_locks: [...(gonegiState.continuity_locks.composition_locks ?? [])],
    },
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_video_state',
      production_registry: false,
      draft_status: 'gonegi_video_state_translated_v1',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    translated_at: new Date().toISOString(),
  };
}

export function translateAllGonegiVideoStates(projectRoot?: string): GonegiVideoState[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, GONEGI_STATE_REGISTRY_PATH))) {
    throw new Error(`Missing gonegi scene state registry: ${GONEGI_STATE_REGISTRY_PATH}`);
  }

  const defaults = loadVideoStateDefaults(root);
  if (!defaults) {
    throw new Error(`Missing video state defaults: ${VIDEO_STATE_DEFAULTS_PATH}`);
  }

  if (!fs.existsSync(path.join(root, BLEND_PROFILE_PATH))) {
    throw new Error(`Missing director blend profile: ${BLEND_PROFILE_PATH}`);
  }

  const states: GonegiVideoState[] = [];
  for (const spec of SEED_GONEGI_VIDEO_STATE_SPECS) {
    const gonegiState = loadGonegiSceneState(root, spec.gonegi_state_id);
    if (!gonegiState) {
      throw new Error(`Missing gonegi scene state: ${spec.gonegi_state_id}`);
    }
    states.push(translateGonegiVideoState(gonegiState, spec, defaults));
  }

  return states;
}

export function writeGonegiVideoStates(projectRoot?: string): {
  states: GonegiVideoState[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const states = translateAllGonegiVideoStates(root);
  const outDir = path.join(root, GONEGI_VIDEO_STATES_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const state of states) {
    const rel = `${GONEGI_VIDEO_STATES_DIR}/${state.gonegi_video_state_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { states, written };
}

export function loadGonegiVideoState(
  projectRoot: string,
  gonegiVideoStateId: string
): GonegiVideoState | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_VIDEO_STATES_DIR, `${gonegiVideoStateId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiVideoState;
}
