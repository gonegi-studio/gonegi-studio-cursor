import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const EMOTION_ACTING_LIBRARY_PATH =
  'datasets/emotion_acting/emotion-acting-dna-library-v1.json' as const;
export const EMOTION_ACTING_INDEX_PATH =
  'datasets/emotion_acting/emotion-acting-dna-index-v1.json' as const;
export const EMOTION_ACTING_ADAPTER_PATH =
  'exports/image_app/adapters/emotion-acting-adapter.json' as const;

export const INITIAL_EMOTION_IDS = [
  'hope',
  'wonder',
  'gratitude',
  'nostalgia',
  'determination',
  'loneliness',
  'reunion',
  'farewell',
] as const;

export type InitialEmotionId = (typeof INITIAL_EMOTION_IDS)[number];

export const REQUIRED_EMOTION_FIELDS = [
  'emotion_id',
  'emotion_name',
  'eye_behavior',
  'gaze_pattern',
  'head_angle',
  'mouth_behavior',
  'body_tension',
  'shoulder_posture',
  'hand_behavior',
  'breathing_pattern',
  'movement_energy',
  'compatible_shot_types',
  'compatible_locations',
  'compatible_lighting_anchors',
  'forbidden_behaviors',
] as const;

export const REQUIRED_EMOTION_TOKENS = [
  'emotion-id:',
  'eye-behavior:',
  'gaze-pattern:',
  'mouth-behavior:',
  'body-tension:',
  'hand-behavior:',
  'movement-energy:',
] as const;

export const SHOT_VISIBILITY_WEIGHTING = {
  close: 'highest',
  reaction: 'high',
  medium: 'medium',
  wide: 'low',
  pov: 'medium_high',
} as const;

export type EmotionBehaviorField = Record<string, string>;

export type EmotionActingRecord = {
  emotion_id: string;
  emotion_name: string;
  eye_behavior: EmotionBehaviorField;
  gaze_pattern: EmotionBehaviorField;
  head_angle: EmotionBehaviorField;
  mouth_behavior: EmotionBehaviorField;
  body_tension: EmotionBehaviorField;
  shoulder_posture: EmotionBehaviorField;
  hand_behavior: EmotionBehaviorField;
  breathing_pattern: EmotionBehaviorField;
  movement_energy: EmotionBehaviorField;
  compatible_shot_types: readonly string[];
  compatible_locations: readonly string[];
  compatible_lighting_anchors: readonly string[];
  forbidden_behaviors: readonly string[];
};

export type EmotionActingLibrary = {
  emotions: readonly EmotionActingRecord[];
  initial_emotion_ids?: readonly string[];
  emotion_count?: number;
  shot_visibility_weighting?: Record<string, string>;
};

export type EmotionActingIndexEntry = {
  emotion_id: string;
  emotion_name: string;
  primary_shot_types: readonly string[];
};

export type EmotionActingIndex = {
  entries: readonly EmotionActingIndexEntry[];
  emotion_count?: number;
};

export type EmotionActingRenderPayload = {
  emotion_id: string;
  emotion_name: string;
  acting_tokens: readonly string[];
  eye_behavior: EmotionBehaviorField;
  gaze_pattern: EmotionBehaviorField;
  head_angle: EmotionBehaviorField;
  mouth_behavior: EmotionBehaviorField;
  body_tension: EmotionBehaviorField;
  shoulder_posture: EmotionBehaviorField;
  hand_behavior: EmotionBehaviorField;
  breathing_pattern: EmotionBehaviorField;
  movement_energy: EmotionBehaviorField;
  forbidden_behaviors: readonly string[];
  compatible_shot_types: readonly string[];
  shot_visibility_weight: string | null;
};

export type EmotionToProfileMapEntry = {
  emotion_id: string;
  emotion_acting_profile: EmotionActingRecord;
  acting_tokens: readonly string[];
  render_payload: EmotionActingRenderPayload;
};

export type EmotionActingAdapter = {
  emotion_to_profile_map: readonly EmotionToProfileMapEntry[];
};

export type EmotionActingResolution = {
  emotion_id: string;
  acting_tokens: readonly string[];
  render_payload: EmotionActingRenderPayload;
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing emotion acting asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function flattenBehaviorToken(prefix: string, field: EmotionBehaviorField): string[] {
  return Object.entries(field).map(([key, value]) => `${prefix}:${key}_${value}`);
}

export function loadEmotionActingLibrary(projectRoot?: string): EmotionActingLibrary {
  return readJson(resolveProjectRoot(projectRoot), EMOTION_ACTING_LIBRARY_PATH);
}

export function loadEmotionActingIndex(projectRoot?: string): EmotionActingIndex {
  return readJson(resolveProjectRoot(projectRoot), EMOTION_ACTING_INDEX_PATH);
}

export function loadEmotionActingAdapter(projectRoot?: string): EmotionActingAdapter {
  return readJson(resolveProjectRoot(projectRoot), EMOTION_ACTING_ADAPTER_PATH);
}

export function getEmotionById(
  emotionId: string,
  projectRoot?: string
): EmotionActingRecord | null {
  const library = loadEmotionActingLibrary(projectRoot);
  return library.emotions.find((row) => row.emotion_id === emotionId) ?? null;
}

export function inferShotTypeFromCameraDistance(cameraDistance: string): string {
  const normalized = cameraDistance.toLowerCase();
  if (normalized.includes('close') || normalized.includes('medium-close')) return 'close';
  if (normalized.includes('wide') || normalized.includes('establish')) return 'wide';
  if (normalized.includes('pov') || normalized.includes('subjective')) return 'pov';
  if (normalized.includes('reaction')) return 'reaction';
  if (normalized.includes('insert') || normalized.includes('detail')) return 'insert';
  if (normalized.includes('track')) return 'tracking';
  return 'medium';
}

export function resolveShotVisibilityWeight(shotType: string): string | null {
  const key = shotType as keyof typeof SHOT_VISIBILITY_WEIGHTING;
  return SHOT_VISIBILITY_WEIGHTING[key] ?? null;
}

export function buildEmotionActingTokens(
  emotion: EmotionActingRecord,
  shotType?: string
): string[] {
  const visibility = shotType ? resolveShotVisibilityWeight(shotType) : null;
  const tokens = [
    `emotion-id:${emotion.emotion_id}`,
    `emotion-name:${emotion.emotion_name.toLowerCase()}`,
    `eye-behavior:${emotion.eye_behavior.mode ?? Object.values(emotion.eye_behavior)[0]}`,
    `gaze-pattern:${emotion.gaze_pattern.direction ?? Object.values(emotion.gaze_pattern)[0]}`,
    `mouth-behavior:${emotion.mouth_behavior.shape ?? Object.values(emotion.mouth_behavior)[0]}`,
    `body-tension:${emotion.body_tension.level ?? Object.values(emotion.body_tension)[0]}`,
    `hand-behavior:${emotion.hand_behavior.gesture ?? Object.values(emotion.hand_behavior)[0]}`,
    `movement-energy:${emotion.movement_energy.pace ?? Object.values(emotion.movement_energy)[0]}`,
    `head-angle:${emotion.head_angle.pitch ?? Object.values(emotion.head_angle)[0]}`,
    `shoulder-posture:${emotion.shoulder_posture.position ?? Object.values(emotion.shoulder_posture)[0]}`,
    `breathing-pattern:${emotion.breathing_pattern.rhythm ?? Object.values(emotion.breathing_pattern)[0]}`,
    ...emotion.forbidden_behaviors.map((rule) => `forbidden-emotion:${rule}`),
  ];

  if (visibility) {
    tokens.push(`emotion-visibility:${visibility}`);
    tokens.push(`shot-type-weight:${shotType}:${visibility}`);
  }

  return tokens;
}

export function buildEmotionActingRenderPayload(
  emotion: EmotionActingRecord,
  shotType?: string
): EmotionActingRenderPayload {
  return {
    emotion_id: emotion.emotion_id,
    emotion_name: emotion.emotion_name,
    acting_tokens: buildEmotionActingTokens(emotion, shotType),
    eye_behavior: { ...emotion.eye_behavior },
    gaze_pattern: { ...emotion.gaze_pattern },
    head_angle: { ...emotion.head_angle },
    mouth_behavior: { ...emotion.mouth_behavior },
    body_tension: { ...emotion.body_tension },
    shoulder_posture: { ...emotion.shoulder_posture },
    hand_behavior: { ...emotion.hand_behavior },
    breathing_pattern: { ...emotion.breathing_pattern },
    movement_energy: { ...emotion.movement_energy },
    forbidden_behaviors: [...emotion.forbidden_behaviors],
    compatible_shot_types: [...emotion.compatible_shot_types],
    shot_visibility_weight: shotType ? resolveShotVisibilityWeight(shotType) : null,
  };
}

export function buildEmotionToProfileMapEntry(
  emotion: EmotionActingRecord,
  shotType?: string
): EmotionToProfileMapEntry {
  return {
    emotion_id: emotion.emotion_id,
    emotion_acting_profile: emotion,
    acting_tokens: buildEmotionActingTokens(emotion, shotType),
    render_payload: buildEmotionActingRenderPayload(emotion, shotType),
  };
}

export function resolveEmotionActingById(
  emotionId: string,
  shotType?: string,
  projectRoot?: string
): EmotionActingResolution | null {
  const adapter = loadEmotionActingAdapter(projectRoot);
  const entry = adapter.emotion_to_profile_map.find((row) => row.emotion_id === emotionId);
  if (!entry) {
    const emotion = getEmotionById(emotionId, projectRoot);
    if (!emotion) return null;
    const render_payload = buildEmotionActingRenderPayload(emotion, shotType);
    return {
      emotion_id: emotion.emotion_id,
      acting_tokens: render_payload.acting_tokens,
      render_payload,
    };
  }

  if (!shotType) {
    return {
      emotion_id: entry.emotion_id,
      acting_tokens: entry.acting_tokens,
      render_payload: entry.render_payload,
    };
  }

  const render_payload = buildEmotionActingRenderPayload(entry.emotion_acting_profile, shotType);
  return {
    emotion_id: entry.emotion_id,
    acting_tokens: render_payload.acting_tokens,
    render_payload,
  };
}

export function inferEmotionIdFromActingIntent(
  actingIntent: string,
  bodyAction?: string
): InitialEmotionId {
  const text = `${actingIntent} ${bodyAction ?? ''}`.toLowerCase();

  if (text.includes('reunion') || text.includes('embrace') || text.includes('meet again')) {
    return 'reunion';
  }
  if (text.includes('farewell') || text.includes('goodbye') || text.includes('part')) {
    return 'farewell';
  }
  if (text.includes('lonely') || text.includes('alone') || text.includes('isolation')) {
    return 'loneliness';
  }
  if (text.includes('determin') || text.includes('resolve') || text.includes('focus task')) {
    return 'determination';
  }
  if (text.includes('nostalg') || text.includes('memory') || text.includes('remember')) {
    return 'nostalgia';
  }
  if (text.includes('grateful') || text.includes('thanks') || text.includes('gratitude')) {
    return 'gratitude';
  }
  if (text.includes('wonder') || text.includes('awe') || text.includes('discover')) {
    return 'wonder';
  }
  if (text.includes('hope') || text.includes('anticipat') || text.includes('looking forward')) {
    return 'hope';
  }

  if (text.includes('quiet') || text.includes('gaze') || text.includes('window')) {
    return 'nostalgia';
  }
  if (text.includes('work') || text.includes('knead') || text.includes('harbor')) {
    return 'determination';
  }
  if (text.includes('awaken') || text.includes('morning') || text.includes('open')) {
    return 'hope';
  }

  return 'gratitude';
}

export function enrichAnchorsWithEmotionActing(
  anchors: readonly string[],
  emotionId: string,
  shotType?: string,
  projectRoot?: string
): string[] {
  const resolution = resolveEmotionActingById(emotionId, shotType, projectRoot);
  if (!resolution) return [...anchors];
  return [...new Set([...anchors, ...resolution.acting_tokens])].sort();
}

export function buildEmotionActingAdapterFromLibrary(
  library: EmotionActingLibrary,
  index: EmotionActingIndex
): Record<string, unknown> {
  const emotionToProfileMap = library.emotions.map((emotion) =>
    buildEmotionToProfileMapEntry(emotion)
  );

  return {
    adapter_type: 'emotion_acting_image_adapter',
    adapter_metadata: {
      adapter_name: 'emotion-acting-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-EDA-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      emotion_count: library.emotions.length,
      library_reference: EMOTION_ACTING_LIBRARY_PATH,
      index_reference: EMOTION_ACTING_INDEX_PATH,
      shot_grammar_reference: 'exports/image_app/adapters/shot-grammar-adapter.json',
    },
    adapter_responsibility_chain: [
      'emotion_id',
      'emotion_acting_profile',
      'acting_tokens',
      'render_payload',
    ],
    shot_visibility_weighting: library.shot_visibility_weighting ?? SHOT_VISIBILITY_WEIGHTING,
    emotion_to_profile_map: emotionToProfileMap,
    runtime_verification_fields: {
      emotion_id: { exported: true, required_for_acting: true },
      acting_tokens: { exported: true, required_for_acting: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      required_token_prefixes: [...REQUIRED_EMOTION_TOKENS],
      secondary_validation:
        'Image App must read emotion-id, eye-behavior, gaze-pattern, mouth-behavior, body-tension, hand-behavior, and movement-energy tokens.',
    },
    image_app_contract: {
      supported_emotion_ids: [...INITIAL_EMOTION_IDS],
      shot_integration: {
        integrated_shot_types: ['wide', 'medium', 'close', 'reaction', 'pov'],
        visibility_weighting: SHOT_VISIBILITY_WEIGHTING,
      },
      resolution_flow: {
        step_1: 'infer or select emotion_id from scene intent',
        step_2: 'lookup emotion_acting_profile via emotion_to_profile_map',
        step_3: 'attach acting_tokens weighted by shot type',
        step_4: 'merge render_payload into character acting layer',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_007_validation_target: {
      test_id: 'RKB-007',
      test_name: 'EMOTION_ACTING_VALIDATION',
      comparison_baselines: ['RKB-004', 'RKB-005', 'RKB-006'],
      review_criteria: [
        'emotion_recognition',
        'eye_gaze_consistency',
        'body_performance_consistency',
        'forbidden_behavior_absence',
      ],
      success_condition:
        'Emotion acting tokens visible in Image App payloads; performance recognizable across generations.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'emotion_acting_dna_library_v1',
          reference_path: EMOTION_ACTING_LIBRARY_PATH,
        },
        {
          asset_id: 'emotion_acting_dna_index_v1',
          reference_path: EMOTION_ACTING_INDEX_PATH,
        },
        {
          asset_id: 'shot_grammar_adapter',
          reference_path: 'exports/image_app/adapters/shot-grammar-adapter.json',
        },
      ],
    },
    index_summary: index.entries,
  };
}
