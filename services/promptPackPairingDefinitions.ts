import { type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import { type SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import {
  getImagePromptPackSeedLibrary,
  type ImagePromptPackEntry,
} from './imagePromptPackDefinitions.js';
import { type DailyLifeAnchor } from './narrativeBeatDefinitions.js';
import { type SeedRelationshipDnaId } from './relationshipDnaDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import {
  getVideoPromptPackSeedLibrary,
  type VideoPromptPackEntry,
} from './videoPromptPackDefinitions.js';

export const PROMPT_PACK_PAIRING_VERSION = 'PROMPT-PACK-PAIRING-PHASE-86-v1' as const;
export const PROMPT_PACK_PAIRING_SEED_COUNT = STORYBOARD_SEED_COUNT;
export const PROMPT_PACK_PAIRING_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const REQUIRED_PROMPT_PACK_PAIR_FIELDS = [
  'pair_id',
  'storyboard_id',
  'scene_order',
  'image_prompt_pack_id',
  'video_prompt_pack_id',
  'shared_behavior_id',
  'shared_emotion_id',
  'shared_relationship_id',
  'shared_daily_life_anchor',
  'shared_shot_affinity',
  'image_to_video_alignment',
  'continuity_notes',
  'keywords',
] as const;

export type RequiredPromptPackPairField = (typeof REQUIRED_PROMPT_PACK_PAIR_FIELDS)[number];

export interface PromptPackPairEntry {
  pair_id: string;
  storyboard_id: string;
  scene_order: number;
  image_prompt_pack_id: string;
  video_prompt_pack_id: string;
  shared_behavior_id: SeedBehaviorDnaId;
  shared_emotion_id: SeedEmotionDnaId;
  shared_relationship_id: SeedRelationshipDnaId;
  shared_daily_life_anchor: DailyLifeAnchor[];
  shared_shot_affinity: string[];
  image_to_video_alignment: string[];
  continuity_notes: string[];
  keywords: string[];
}

export interface PromptPackPairingPreview {
  layer_version: typeof PROMPT_PACK_PAIRING_VERSION;
  seed_count: typeof PROMPT_PACK_PAIRING_SEED_COUNT;
  song_master_id: typeof PROMPT_PACK_PAIRING_SONG_MASTER_ID;
  required_fields: RequiredPromptPackPairField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'video_prompt_pack',
    'prompt_pack_pair',
  ];
  seed_prompt_pack_pairs: PromptPackPairEntry[];
}

function buildImageToVideoAlignment(
  imagePack: ImagePromptPackEntry,
  videoPack: VideoPromptPackEntry
): string[] {
  const alignment: string[] = [
    `storyboard:${imagePack.storyboard_id}`,
    `scene-order:${imagePack.scene_order}`,
    `image-pack:${imagePack.prompt_pack_id}`,
    `video-pack:${videoPack.video_prompt_pack_id}`,
  ];

  for (const shotId of imagePack.shot_affinity) {
    alignment.push(`shared-shot:${shotId}`);

    const hasCompositionShot = imagePack.composition.includes(`shot:${shotId}`);
    const hasCameraShot = videoPack.camera_motion.includes(`shot:${shotId}`);
    if (hasCompositionShot && hasCameraShot) {
      alignment.push(`shot-bridge:${shotId}`);
    }
  }

  for (const anchor of imagePack.daily_life_anchor) {
    alignment.push(`shared-anchor:${anchor}`);

    const hasImageAnchor = imagePack.environment_dna.includes(`anchor:${anchor}`);
    const hasVideoAnchor = videoPack.environment_motion.includes(`anchor:${anchor}`);
    if (hasImageAnchor && hasVideoAnchor) {
      alignment.push(`environment-bridge:${anchor}`);
    }
  }

  const behaviorToken = `behavior:${imagePack.behavior_id}`;
  if (
    imagePack.character_identity.includes(behaviorToken) &&
    videoPack.character_motion.includes(behaviorToken)
  ) {
    alignment.push(`character-bridge:${imagePack.behavior_id}`);
  }

  const relationshipToken = `relationship:${imagePack.relationship_id}`;
  if (imagePack.character_identity.includes(relationshipToken)) {
    alignment.push(`relationship-anchor:${imagePack.relationship_id}`);
  }

  for (const transitionId of videoPack.transition_dna) {
    alignment.push(`video-transition:${transitionId}`);
  }

  return [...new Set(alignment.filter((item) => item.length > 0))];
}

function buildContinuityNotes(
  imagePack: ImagePromptPackEntry,
  videoPack: VideoPromptPackEntry
): string[] {
  const notes = [
    'pairing:image-first-then-video-motion',
    `image-pack:${imagePack.prompt_pack_id}`,
    `video-pack:${videoPack.video_prompt_pack_id}`,
    `storyboard:${imagePack.storyboard_id}`,
    `scene-order:${imagePack.scene_order}`,
    'pipeline:no-ai-studio-no-gpu',
    ...videoPack.continuity_glue.slice(0, 5),
    ...imagePack.style_core.slice(0, 2).map((token) => `image-style:${token}`),
  ];

  return [...new Set(notes.filter((item) => item.length > 0))];
}

function buildPromptPackPair(
  imagePack: ImagePromptPackEntry,
  videoPack: VideoPromptPackEntry
): PromptPackPairEntry {
  if (imagePack.storyboard_id !== videoPack.storyboard_id) {
    throw new Error(
      `Cannot pair mismatched storyboard ids: ${imagePack.storyboard_id} vs ${videoPack.storyboard_id}`
    );
  }

  return {
    pair_id: `PAIR-${imagePack.storyboard_id}`,
    storyboard_id: imagePack.storyboard_id,
    scene_order: imagePack.scene_order,
    image_prompt_pack_id: imagePack.prompt_pack_id,
    video_prompt_pack_id: videoPack.video_prompt_pack_id,
    shared_behavior_id: imagePack.behavior_id,
    shared_emotion_id: imagePack.emotion_id,
    shared_relationship_id: imagePack.relationship_id,
    shared_daily_life_anchor: [...imagePack.daily_life_anchor],
    shared_shot_affinity: [...imagePack.shot_affinity],
    image_to_video_alignment: buildImageToVideoAlignment(imagePack, videoPack),
    continuity_notes: buildContinuityNotes(imagePack, videoPack),
    keywords: [
      ...new Set([
        ...imagePack.keywords.filter((keyword) => !keyword.startsWith('video-prompt-pack')),
        ...videoPack.keywords.filter((keyword) => !keyword.startsWith('image-prompt-pack')),
        'prompt-pack-pair',
        PROMPT_PACK_PAIRING_SONG_MASTER_ID,
      ]),
    ],
  };
}

export function getPromptPackPairSeedLibrary(): PromptPackPairEntry[] {
  const imagePacks = getImagePromptPackSeedLibrary();
  const videoPacks = getVideoPromptPackSeedLibrary();
  const videoByStoryboard = new Map(
    videoPacks.map((pack) => [pack.storyboard_id, pack] as const)
  );

  return imagePacks.map((imagePack) => {
    const videoPack = videoByStoryboard.get(imagePack.storyboard_id);
    if (!videoPack) {
      throw new Error(`Missing video prompt pack for storyboard ${imagePack.storyboard_id}`);
    }

    const pair = buildPromptPackPair(imagePack, videoPack);
    return {
      ...pair,
      shared_daily_life_anchor: [...pair.shared_daily_life_anchor],
      shared_shot_affinity: [...pair.shared_shot_affinity],
      image_to_video_alignment: [...pair.image_to_video_alignment],
      continuity_notes: [...pair.continuity_notes],
      keywords: [...pair.keywords],
    };
  });
}

export function buildPromptPackPairingPreview(): PromptPackPairingPreview {
  return {
    layer_version: PROMPT_PACK_PAIRING_VERSION,
    seed_count: PROMPT_PACK_PAIRING_SEED_COUNT,
    song_master_id: PROMPT_PACK_PAIRING_SONG_MASTER_ID,
    required_fields: [...REQUIRED_PROMPT_PACK_PAIR_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'video_prompt_pack',
      'prompt_pack_pair',
    ],
    seed_prompt_pack_pairs: getPromptPackPairSeedLibrary(),
  };
}

export function findDuplicatePairIds(pairIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of pairIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getImagePromptPackById(
  promptPackId: string
): ImagePromptPackEntry | undefined {
  return getImagePromptPackSeedLibrary().find((pack) => pack.prompt_pack_id === promptPackId);
}

export function getVideoPromptPackById(
  videoPromptPackId: string
): VideoPromptPackEntry | undefined {
  return getVideoPromptPackSeedLibrary().find(
    (pack) => pack.video_prompt_pack_id === videoPromptPackId
  );
}

export function getPromptPackPairByStoryboardId(
  storyboardId: string
): PromptPackPairEntry | undefined {
  return getPromptPackPairSeedLibrary().find((pair) => pair.storyboard_id === storyboardId);
}

export function getStoryboardSceneById(storyboardId: string): StoryboardSceneEntry | undefined {
  return getStoryboardSceneSeedLibrary().find((scene) => scene.storyboard_id === storyboardId);
}

export function getStoryboardSceneIdsForPairing(): string[] {
  return getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id);
}
