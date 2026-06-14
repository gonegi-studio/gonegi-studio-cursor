import { getBehaviorDnaSeedLibrary, type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import { getEmotionDnaSeedLibrary, type SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import {
  DAILY_LIFE_ANCHORS,
  type DailyLifeAnchor,
  isValidDailyLifeAnchor,
} from './narrativeBeatDefinitions.js';
import { getRelationshipDnaSeedLibrary, type SeedRelationshipDnaId } from './relationshipDnaDefinitions.js';
import { getShotFingerprintLibrary } from './shotFingerprintContractDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import { getTransitionDnaLibrary } from './transitionDnaContractDefinitions.js';

export const VIDEO_PROMPT_PACK_VERSION = 'VIDEO-PROMPT-PACK-PHASE-85-v1' as const;
export const VIDEO_PROMPT_PACK_SEED_COUNT = STORYBOARD_SEED_COUNT;
export const VIDEO_PROMPT_PACK_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const VIDEO_PROMPT_NEGATIVE_BASE =
  'low quality, blurry, watermark, text overlay, distorted anatomy, extra limbs, temporal flicker, frame inconsistency, morphing faces, jittery camera, oversaturated, AI artifacts, duplicate subjects, jump cuts';

export const REQUIRED_VIDEO_PROMPT_PACK_FIELDS = [
  'video_prompt_pack_id',
  'storyboard_id',
  'scene_order',
  'video_prompt',
  'negative_prompt',
  'motion_prompt',
  'camera_motion',
  'character_motion',
  'environment_motion',
  'transition_dna',
  'continuity_glue',
  'behavior_id',
  'emotion_id',
  'relationship_id',
  'daily_life_anchor',
  'shot_affinity',
  'video_dataset_usage',
  'keywords',
] as const;

export type RequiredVideoPromptPackField = (typeof REQUIRED_VIDEO_PROMPT_PACK_FIELDS)[number];

export interface VideoPromptPackEntry {
  video_prompt_pack_id: string;
  storyboard_id: string;
  scene_order: number;
  video_prompt: string;
  negative_prompt: string;
  motion_prompt: string;
  camera_motion: string[];
  character_motion: string[];
  environment_motion: string[];
  transition_dna: string[];
  continuity_glue: string[];
  behavior_id: SeedBehaviorDnaId;
  emotion_id: SeedEmotionDnaId;
  relationship_id: SeedRelationshipDnaId;
  daily_life_anchor: DailyLifeAnchor[];
  shot_affinity: string[];
  video_dataset_usage: string[];
  keywords: string[];
}

export interface VideoPromptPackPreview {
  layer_version: typeof VIDEO_PROMPT_PACK_VERSION;
  seed_count: typeof VIDEO_PROMPT_PACK_SEED_COUNT;
  song_master_id: typeof VIDEO_PROMPT_PACK_SONG_MASTER_ID;
  required_fields: RequiredVideoPromptPackField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'video_prompt_pack',
  ];
  negative_prompt_base: typeof VIDEO_PROMPT_NEGATIVE_BASE;
  seed_video_prompt_packs: VideoPromptPackEntry[];
}

const ANCHOR_ENVIRONMENT_MOTION: Record<DailyLifeAnchor, string[]> = {
  window_gazing: ['curtain micro sway', 'exterior light drift through glass'],
  rain_watching: ['rain streak descent', 'condensation bead crawl'],
  tea_drinking: ['steam curl rise', 'liquid surface ripple'],
  book_reading: ['page corner flutter', 'dust motes in light beam'],
  walking_alone: ['pedestrian background drift', 'leaf or litter pass-by'],
  bus_waiting: ['arrival board flicker', 'distant vehicle approach blur'],
  train_riding: ['landscape parallax scroll', 'carriage interior sway'],
  letter_writing: ['pen stroke rhythm', 'paper edge lift'],
  photo_viewing: ['album page turn drift', 'memory object tilt'],
  flower_watering: ['water stream arc', 'petal tremble after pour'],
  pet_care: ['pet tail sway', 'soft fur ripple on touch'],
  market_visit: ['stall banner flutter', 'crowd lateral drift'],
  school_walk: ['student background flow', 'flag or banner ripple'],
  bridge_crossing: ['water current below', 'cable or railing vibration'],
  sunset_watching: ['sky gradient shift', 'cloud slow drift'],
  star_gazing: ['star field subtle twinkle', 'night air haze drift'],
  room_cleaning: ['fabric fold motion', 'dust lift in sunbeam'],
  cooking: ['steam pulse', 'ingredient stir rhythm'],
  laundry: ['fabric tumble rhythm', 'hanger sway'],
  bicycle_riding: ['wheel rotation blur', 'road texture scroll'],
  bench_sitting: ['leaf fall drift', 'distant pedestrian pass'],
  forest_path: ['canopy light dapple shift', 'branch sway'],
  shore_walking: ['wave advance retreat', 'foam edge crawl'],
  snow_watching: ['snowflake descent field', 'breath vapor curl'],
  music_listening: ['headphone cable micro sway', 'ambient room drift'],
  earphone_walk: ['street parallax flow', 'stride-synced bounce'],
  station_waiting: ['platform wind ripple', 'train approach vibration'],
  doorway_pause: ['threshold light shift', 'door micro movement'],
  rooftop_visit: ['skyline haze drift', 'wind on clothing ripple'],
  street_crossing: ['crosswalk signal pulse', 'traffic flow blur'],
  morning_routine: ['morning light sweep', 'routine object motion'],
  evening_return: ['entry light bloom', 'doorway shadow shift'],
};

function getBehaviorById(behaviorId: SeedBehaviorDnaId) {
  return getBehaviorDnaSeedLibrary().find((entry) => entry.behavior_id === behaviorId);
}

function getEmotionById(emotionId: SeedEmotionDnaId) {
  return getEmotionDnaSeedLibrary().find((entry) => entry.emotion_id === emotionId);
}

function getRelationshipById(relationshipId: SeedRelationshipDnaId) {
  return getRelationshipDnaSeedLibrary().find((entry) => entry.relationship_id === relationshipId);
}

function buildCameraMotion(shotAffinity: string[]): string[] {
  const library = getShotFingerprintLibrary();
  const motion = shotAffinity.flatMap((shotId) => {
    const shot = library.find((entry) => entry.fingerprint_id === shotId);
    if (!shot) return [`shot:${shotId}`];

    const cameraMotion = shot.fields.camera_motion;
    return [
      `shot:${shotId}`,
      typeof cameraMotion === 'string' ? cameraMotion : String(cameraMotion),
    ];
  });

  return [...new Set(motion.filter((item) => item.length > 0))];
}

function buildCharacterMotion(
  behaviorId: SeedBehaviorDnaId,
  emotionId: SeedEmotionDnaId,
  relationshipId: SeedRelationshipDnaId
): string[] {
  const behavior = getBehaviorById(behaviorId);
  const emotion = getEmotionById(emotionId);
  const relationship = getRelationshipById(relationshipId);

  if (!behavior || !emotion || !relationship) {
    throw new Error(`Missing DNA for video motion on behavior ${behaviorId}`);
  }

  return [
    `behavior:${behavior.behavior_id}`,
    `emotion:${emotion.emotion_id}`,
    behavior.walking_behavior[0] ?? '',
    behavior.body_behavior[0] ?? '',
    behavior.interaction_behavior[0] ?? '',
    emotion.external_expression[0] ?? '',
    relationship.distance_pattern[0] ?? '',
    relationship.gaze_pattern[0] ?? '',
  ].filter((item) => item.length > 0);
}

function buildEnvironmentMotion(anchors: DailyLifeAnchor[]): string[] {
  const motion = anchors.flatMap((anchor) => [
    `anchor:${anchor}`,
    ...(ANCHOR_ENVIRONMENT_MOTION[anchor] ?? []),
  ]);

  return [...new Set(motion)];
}

function buildTransitionDna(transitionAffinity: string[]): string[] {
  const library = getTransitionDnaLibrary();
  const transitionIds = new Set(library.map((entry) => entry.transition_id));

  return transitionAffinity.filter((transitionId) => transitionIds.has(transitionId));
}

function buildContinuityGlue(scene: StoryboardSceneEntry, transitionDna: string[]): string[] {
  const transitionLibrary = getTransitionDnaLibrary();
  const shotLibrary = getShotFingerprintLibrary();

  const glue: string[] = [
    `storyboard:${scene.storyboard_id}`,
    `scene-order:${scene.scene_order}`,
    `duration-seconds:${scene.scene_duration_seconds}`,
    `song-master:${scene.song_master_id}`,
  ];

  for (const transitionId of transitionDna) {
    const transition = transitionLibrary.find((entry) => entry.transition_id === transitionId);
    if (!transition) continue;

    glue.push(`transition:${transitionId}`);
    const continuityKeywords = transition.fields.continuity_keywords;
    if (Array.isArray(continuityKeywords)) {
      glue.push(...continuityKeywords.map(String));
    }
  }

  for (const shotId of scene.shot_affinity) {
    const shot = shotLibrary.find((entry) => entry.fingerprint_id === shotId);
    if (!shot) continue;

    glue.push(`shot-continuity:${shotId}`);
    const continuityBias = shot.fields.continuity_bias;
    if (Array.isArray(continuityBias)) {
      glue.push(...continuityBias.map(String));
    }
  }

  return [...new Set(glue.filter((item) => item.length > 0))];
}

function buildMotionPrompt(
  scene: StoryboardSceneEntry,
  cameraMotion: string[],
  characterMotion: string[],
  environmentMotion: string[],
  transitionDna: string[],
  continuityGlue: string[]
): string {
  return [
    scene.visual_summary,
    `Camera motion: ${cameraMotion.join(', ')}.`,
    `Character motion: ${characterMotion.join(', ')}.`,
    `Environment motion: ${environmentMotion.join(', ')}.`,
    `Transition DNA: ${transitionDna.join(', ')}.`,
    `Continuity glue: ${continuityGlue.join(', ')}.`,
  ].join(' ');
}

function buildVideoPrompt(
  scene: StoryboardSceneEntry,
  motionPrompt: string,
  videoDatasetUsage: string[]
): string {
  return [
    motionPrompt,
    `Duration target: ${scene.scene_duration_seconds} seconds.`,
    `Dataset reference: ${videoDatasetUsage.join(', ')}.`,
    `Storyboard ${scene.storyboard_id}, scene ${scene.scene_order}.`,
    'Cinematic music video motion, gonagi visual continuity, no GPU generation in pipeline.',
  ].join(' ');
}

function buildVideoPromptPack(scene: StoryboardSceneEntry): VideoPromptPackEntry {
  const transitionDna = buildTransitionDna(scene.transition_affinity);
  const cameraMotion = buildCameraMotion(scene.shot_affinity);
  const characterMotion = buildCharacterMotion(
    scene.behavior_id,
    scene.emotion_id,
    scene.relationship_id
  );
  const environmentMotion = buildEnvironmentMotion(scene.daily_life_anchor);
  const continuityGlue = buildContinuityGlue(scene, transitionDna);
  const motionPrompt = buildMotionPrompt(
    scene,
    cameraMotion,
    characterMotion,
    environmentMotion,
    transitionDna,
    continuityGlue
  );

  return {
    video_prompt_pack_id: `VPP-${scene.storyboard_id}`,
    storyboard_id: scene.storyboard_id,
    scene_order: scene.scene_order,
    video_prompt: buildVideoPrompt(scene, motionPrompt, scene.video_dataset_usage),
    negative_prompt: VIDEO_PROMPT_NEGATIVE_BASE,
    motion_prompt: motionPrompt,
    camera_motion: cameraMotion,
    character_motion: characterMotion,
    environment_motion: environmentMotion,
    transition_dna: transitionDna,
    continuity_glue: continuityGlue,
    behavior_id: scene.behavior_id,
    emotion_id: scene.emotion_id,
    relationship_id: scene.relationship_id,
    daily_life_anchor: [...scene.daily_life_anchor],
    shot_affinity: [...scene.shot_affinity],
    video_dataset_usage: [...scene.video_dataset_usage],
    keywords: [...scene.keywords, 'video-prompt-pack', VIDEO_PROMPT_PACK_SONG_MASTER_ID],
  };
}

export function getVideoPromptPackSeedLibrary(): VideoPromptPackEntry[] {
  return getStoryboardSceneSeedLibrary().map((scene) => {
    const pack = buildVideoPromptPack(scene);
    return {
      ...pack,
      camera_motion: [...pack.camera_motion],
      character_motion: [...pack.character_motion],
      environment_motion: [...pack.environment_motion],
      transition_dna: [...pack.transition_dna],
      continuity_glue: [...pack.continuity_glue],
      daily_life_anchor: [...pack.daily_life_anchor],
      shot_affinity: [...pack.shot_affinity],
      video_dataset_usage: [...pack.video_dataset_usage],
      keywords: [...pack.keywords],
    };
  });
}

export function buildVideoPromptPackPreview(): VideoPromptPackPreview {
  return {
    layer_version: VIDEO_PROMPT_PACK_VERSION,
    seed_count: VIDEO_PROMPT_PACK_SEED_COUNT,
    song_master_id: VIDEO_PROMPT_PACK_SONG_MASTER_ID,
    required_fields: [...REQUIRED_VIDEO_PROMPT_PACK_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'video_prompt_pack',
    ],
    negative_prompt_base: VIDEO_PROMPT_NEGATIVE_BASE,
    seed_video_prompt_packs: getVideoPromptPackSeedLibrary(),
  };
}

export function findDuplicateVideoPromptPackIds(
  videoPromptPackIds: readonly string[]
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of videoPromptPackIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function getVideoPromptPackByStoryboardId(
  storyboardId: string
): VideoPromptPackEntry | undefined {
  return getVideoPromptPackSeedLibrary().find((pack) => pack.storyboard_id === storyboardId);
}

export function getAnchorEnvironmentMotionTokens(anchor: DailyLifeAnchor): string[] {
  return ANCHOR_ENVIRONMENT_MOTION[anchor] ?? [];
}

export function isValidVideoPromptAnchor(value: string): value is DailyLifeAnchor {
  return isValidDailyLifeAnchor(value);
}

export function listDailyLifeAnchorsWithMotion(): DailyLifeAnchor[] {
  return [...DAILY_LIFE_ANCHORS];
}

export function getTransitionDnaTokens(transitionId: string): string[] {
  const transition = getTransitionDnaLibrary().find((entry) => entry.transition_id === transitionId);
  if (!transition) return [];

  const continuityKeywords = transition.fields.continuity_keywords;
  return Array.isArray(continuityKeywords) ? continuityKeywords.map(String) : [];
}
