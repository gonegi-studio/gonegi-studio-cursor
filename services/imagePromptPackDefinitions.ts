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

export const IMAGE_PROMPT_PACK_VERSION = 'IMAGE-PROMPT-PACK-PHASE-84-v1' as const;
export const IMAGE_PROMPT_PACK_SEED_COUNT = STORYBOARD_SEED_COUNT;
export const IMAGE_PROMPT_PACK_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const IMAGE_PROMPT_STYLE_CORE_BASE = [
  'cinematic music video still',
  'gonagi visual continuity',
  'photorealistic anime-realism blend',
  '16:9 composition safe',
] as const;

export const IMAGE_PROMPT_NEGATIVE_BASE =
  'low quality, blurry, watermark, text overlay, distorted anatomy, extra limbs, cropped face, inconsistent character, harsh flash, oversaturated, AI artifacts, duplicate subjects';

export const REQUIRED_IMAGE_PROMPT_PACK_FIELDS = [
  'prompt_pack_id',
  'storyboard_id',
  'scene_order',
  'image_prompt',
  'negative_prompt',
  'character_identity',
  'style_core',
  'environment_dna',
  'composition',
  'lighting',
  'behavior_id',
  'emotion_id',
  'relationship_id',
  'daily_life_anchor',
  'shot_affinity',
  'keywords',
] as const;

export type RequiredImagePromptPackField = (typeof REQUIRED_IMAGE_PROMPT_PACK_FIELDS)[number];

export interface ImagePromptPackEntry {
  prompt_pack_id: string;
  storyboard_id: string;
  scene_order: number;
  image_prompt: string;
  negative_prompt: string;
  character_identity: string[];
  style_core: string[];
  environment_dna: string[];
  composition: string[];
  lighting: string[];
  behavior_id: SeedBehaviorDnaId;
  emotion_id: SeedEmotionDnaId;
  relationship_id: SeedRelationshipDnaId;
  daily_life_anchor: DailyLifeAnchor[];
  shot_affinity: string[];
  keywords: string[];
}

export interface ImagePromptPackPreview {
  layer_version: typeof IMAGE_PROMPT_PACK_VERSION;
  seed_count: typeof IMAGE_PROMPT_PACK_SEED_COUNT;
  song_master_id: typeof IMAGE_PROMPT_PACK_SONG_MASTER_ID;
  required_fields: RequiredImagePromptPackField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
  ];
  style_core_base: readonly string[];
  negative_prompt_base: typeof IMAGE_PROMPT_NEGATIVE_BASE;
  seed_image_prompt_packs: ImagePromptPackEntry[];
}

const ANCHOR_ENVIRONMENT_DNA: Record<DailyLifeAnchor, string[]> = {
  window_gazing: ['interior window light', 'domestic room depth', 'reflection-ready glass pane'],
  rain_watching: ['rain-streaked window glass', 'muted grey ambient exterior', 'cozy interior shelter'],
  tea_drinking: ['warm kitchen table setting', 'steam curl atmosphere', 'intimate domestic scale'],
  book_reading: ['soft reading nook', 'paper texture detail', 'quiet interior study light'],
  walking_alone: ['empty sidewalk path', 'open street perspective', 'solitary pedestrian space'],
  bus_waiting: ['transit shelter canopy', 'route signage context', 'public waiting bench zone'],
  train_riding: ['carriage interior rhythm', 'passing landscape blur', 'commuter window seat frame'],
  letter_writing: ['desk writing surface', 'paper and pen detail', 'personal archive mood'],
  photo_viewing: ['memory object close focus', 'album or frame prop', 'nostalgic interior tone'],
  flower_watering: ['sunlit planter corner', 'water droplet sparkle', 'domestic garden nook'],
  pet_care: ['home pet interaction zone', 'soft floor texture', 'caring domestic warmth'],
  market_visit: ['open market aisle depth', 'colorful stall backdrop', 'community bustle context'],
  school_walk: ['campus corridor or gate', 'youth pathway rhythm', 'institutional exterior tone'],
  bridge_crossing: ['bridge span perspective', 'river or city below', 'transitional crossing space'],
  sunset_watching: ['golden hour horizon', 'warm sky gradient', 'silhouette-friendly backlight'],
  star_gazing: ['night sky openness', 'low ambient ground light', 'celestial contemplation mood'],
  room_cleaning: ['ordered domestic interior', 'tidy surface geometry', 'soft maintenance calm'],
  cooking: ['kitchen counter workspace', 'steam and ingredient detail', 'warm practical lighting'],
  laundry: ['laundry room texture', 'fabric fold rhythm', 'routine domestic stillness'],
  bicycle_riding: ['bike lane or path motion', 'open forward perspective', 'travel kinetic energy'],
  bench_sitting: ['public bench rest point', 'park or plaza context', 'pause-friendly framing'],
  forest_path: ['tree-lined path depth', 'filtered green canopy light', 'natural trail texture'],
  shore_walking: ['coastal shoreline stretch', 'wave edge rhythm', 'open horizon breeze'],
  snow_watching: ['snowfall ambient field', 'cool white ground cover', 'quiet winter hush'],
  music_listening: ['headphone solitude corner', 'audio-focused stillness', 'personal bubble framing'],
  earphone_walk: ['urban walk with earphones', 'street-level motion path', 'private soundtrack mood'],
  station_waiting: ['train station platform depth', 'arrival board glow', 'transit anticipation space'],
  doorway_pause: ['threshold doorway frame', 'inside-outside light contrast', 'decision pause geometry'],
  rooftop_visit: ['elevated rooftop vista', 'city skyline backdrop', 'open-air contemplation height'],
  street_crossing: ['crosswalk intersection geometry', 'traffic pause rhythm', 'urban transition beat'],
  morning_routine: ['early morning domestic light', 'fresh day startup tone', 'routine preparation space'],
  evening_return: ['return-home doorway light', 'end-of-day warm interior', 'welcoming entry mood'],
};

const EMOTION_LIGHTING: Record<SeedEmotionDnaId, string[]> = {
  anticipation: ['soft ambient fill', 'late afternoon rim light', 'patient warm key'],
  uncertainty: ['cool side light contrast', 'subtle shadow pockets', 'hesitant fill ratio'],
  isolation: ['desaturated cool key', 'expanded negative space light', 'distant soft backlight'],
  connection: ['warm two-subject key', 'gentle fill wrap', 'recognition sparkle catchlight'],
  optimism: ['golden hour lift', 'forward-facing warm key', 'bright horizon glow'],
  resolve: ['directional motivated key', 'firm contrast edge', 'determined warm-cool balance'],
  care: ['soft protective wrap light', 'nurturing warm fill', 'gentle highlight roll-off'],
  parting: ['fading sunset key', 'long shadow stretch', 'bittersweet amber-magenta wash'],
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

function buildCharacterIdentity(
  behaviorId: SeedBehaviorDnaId,
  relationshipId: SeedRelationshipDnaId
): string[] {
  const behavior = getBehaviorById(behaviorId);
  const relationship = getRelationshipById(relationshipId);

  if (!behavior || !relationship) {
    throw new Error(`Missing DNA for behavior ${behaviorId} or relationship ${relationshipId}`);
  }

  return [
    `behavior:${behavior.behavior_id}`,
    `relationship:${relationship.relationship_id}`,
    behavior.facial_expression[0] ?? '',
    behavior.eye_behavior[0] ?? '',
    behavior.body_behavior[0] ?? '',
    relationship.gaze_pattern[0] ?? '',
    relationship.distance_pattern[0] ?? '',
    relationship.emotional_core,
  ].filter((item) => item.length > 0);
}

function buildStyleCore(behaviorId: SeedBehaviorDnaId, emotionId: SeedEmotionDnaId): string[] {
  const behavior = getBehaviorById(behaviorId);
  const emotion = getEmotionById(emotionId);

  return [
    ...IMAGE_PROMPT_STYLE_CORE_BASE,
    `behavior-mood:${behaviorId}`,
    `emotion-tone:${emotionId}`,
    behavior?.camera_affinity[0] ?? 'medium emotional hold',
    emotion?.camera_affinity[0] ?? 'motivated cinematic framing',
  ];
}

function buildEnvironmentDna(anchors: DailyLifeAnchor[]): string[] {
  const environment = anchors.flatMap((anchor) => [
    `anchor:${anchor}`,
    ...(ANCHOR_ENVIRONMENT_DNA[anchor] ?? []),
  ]);

  return [...new Set(environment)];
}

function buildComposition(shotAffinity: string[]): string[] {
  const library = getShotFingerprintLibrary();
  const composition = shotAffinity.flatMap((shotId) => {
    const shot = library.find((entry) => entry.fingerprint_id === shotId);
    if (!shot) return [`shot:${shotId}`];

    const framing = shot.fields.framing;
    const lensBehavior = shot.fields.lens_behavior;
    const cinematicRole = shot.fields.cinematic_role;

    return [
      `shot:${shotId}`,
      typeof framing === 'string' ? framing : String(framing),
      typeof lensBehavior === 'string' ? lensBehavior : String(lensBehavior),
      typeof cinematicRole === 'string' ? cinematicRole : String(cinematicRole),
    ];
  });

  return [...new Set(composition.filter((item) => item.length > 0))];
}

function buildLighting(emotionId: SeedEmotionDnaId, behaviorId: SeedBehaviorDnaId): string[] {
  const behavior = getBehaviorById(behaviorId);
  const emotionLighting = EMOTION_LIGHTING[emotionId] ?? ['motivated cinematic key light'];

  return [
    ...emotionLighting,
    `intensity-level:${behavior?.intensity_level ?? 3}`,
    behavior?.camera_affinity[1] ?? 'natural fill balance',
  ];
}

function buildImagePrompt(
  scene: StoryboardSceneEntry,
  characterIdentity: string[],
  styleCore: string[],
  environmentDna: string[],
  composition: string[],
  lighting: string[]
): string {
  return [
    scene.visual_summary,
    `Character identity: ${characterIdentity.join(', ')}.`,
    `Environment: ${environmentDna.join(', ')}.`,
    `Composition: ${composition.join(', ')}.`,
    `Lighting: ${lighting.join(', ')}.`,
    `Style: ${styleCore.join(', ')}.`,
    `Storyboard ${scene.storyboard_id}, scene ${scene.scene_order}.`,
  ].join(' ');
}

function buildImagePromptPack(scene: StoryboardSceneEntry): ImagePromptPackEntry {
  const characterIdentity = buildCharacterIdentity(scene.behavior_id, scene.relationship_id);
  const styleCore = buildStyleCore(scene.behavior_id, scene.emotion_id);
  const environmentDna = buildEnvironmentDna(scene.daily_life_anchor);
  const composition = buildComposition(scene.shot_affinity);
  const lighting = buildLighting(scene.emotion_id, scene.behavior_id);

  return {
    prompt_pack_id: `IPP-${scene.storyboard_id}`,
    storyboard_id: scene.storyboard_id,
    scene_order: scene.scene_order,
    image_prompt: buildImagePrompt(
      scene,
      characterIdentity,
      styleCore,
      environmentDna,
      composition,
      lighting
    ),
    negative_prompt: IMAGE_PROMPT_NEGATIVE_BASE,
    character_identity: characterIdentity,
    style_core: styleCore,
    environment_dna: environmentDna,
    composition,
    lighting,
    behavior_id: scene.behavior_id,
    emotion_id: scene.emotion_id,
    relationship_id: scene.relationship_id,
    daily_life_anchor: [...scene.daily_life_anchor],
    shot_affinity: [...scene.shot_affinity],
    keywords: [...scene.keywords, 'image-prompt-pack', IMAGE_PROMPT_PACK_SONG_MASTER_ID],
  };
}

export function getImagePromptPackSeedLibrary(): ImagePromptPackEntry[] {
  return getStoryboardSceneSeedLibrary().map((scene) => {
    const pack = buildImagePromptPack(scene);
    return {
      ...pack,
      character_identity: [...pack.character_identity],
      style_core: [...pack.style_core],
      environment_dna: [...pack.environment_dna],
      composition: [...pack.composition],
      lighting: [...pack.lighting],
      daily_life_anchor: [...pack.daily_life_anchor],
      shot_affinity: [...pack.shot_affinity],
      keywords: [...pack.keywords],
    };
  });
}

export function buildImagePromptPackPreview(): ImagePromptPackPreview {
  return {
    layer_version: IMAGE_PROMPT_PACK_VERSION,
    seed_count: IMAGE_PROMPT_PACK_SEED_COUNT,
    song_master_id: IMAGE_PROMPT_PACK_SONG_MASTER_ID,
    required_fields: [...REQUIRED_IMAGE_PROMPT_PACK_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
    ],
    style_core_base: [...IMAGE_PROMPT_STYLE_CORE_BASE],
    negative_prompt_base: IMAGE_PROMPT_NEGATIVE_BASE,
    seed_image_prompt_packs: getImagePromptPackSeedLibrary(),
  };
}

export function findDuplicatePromptPackIds(promptPackIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of promptPackIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function getImagePromptPackByStoryboardId(
  storyboardId: string
): ImagePromptPackEntry | undefined {
  return getImagePromptPackSeedLibrary().find((pack) => pack.storyboard_id === storyboardId);
}

export function isValidImagePromptAnchor(value: string): value is DailyLifeAnchor {
  return isValidDailyLifeAnchor(value);
}

export function getAnchorEnvironmentTokens(anchor: DailyLifeAnchor): string[] {
  return ANCHOR_ENVIRONMENT_DNA[anchor] ?? [];
}

export function listDailyLifeAnchorsWithEnvironment(): DailyLifeAnchor[] {
  return [...DAILY_LIFE_ANCHORS];
}
