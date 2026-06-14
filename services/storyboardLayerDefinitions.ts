import { type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import { type SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import { getGonagiGrammarSeedLibrary } from './gonagiGrammarDefinitions.js';
import { getMusicVideoGrammarSeedLibrary } from './musicVideoGrammarDefinitions.js';
import {
  getNarrativeBeatSeedLibrary,
  SEED_BEAT_TYPES,
  type DailyLifeAnchor,
  type NarrativeBeatEntry,
} from './narrativeBeatDefinitions.js';
import { type SeedRelationshipDnaId } from './relationshipDnaDefinitions.js';
import {
  getSongMasterSeedLibrary,
  type SeedSongMasterId,
} from './songMasterLibraryDefinitions.js';

export const STORYBOARD_LAYER_VERSION = 'STORYBOARD-LAYER-PHASE-83-v1' as const;
export const STORYBOARD_SEED_COUNT = 16 as const;
export const STORYBOARD_SONG_MASTER_ID = 'song_master_01' as const satisfies SeedSongMasterId;

export const REQUIRED_STORYBOARD_SCENE_FIELDS = [
  'storyboard_id',
  'song_master_id',
  'beat_id',
  'scene_order',
  'scene_duration_seconds',
  'visual_summary',
  'daily_life_anchor',
  'behavior_id',
  'emotion_id',
  'relationship_id',
  'shot_affinity',
  'transition_affinity',
  'image_dataset_usage',
  'video_dataset_usage',
  'keywords',
] as const;

export type RequiredStoryboardSceneField = (typeof REQUIRED_STORYBOARD_SCENE_FIELDS)[number];

export interface StoryboardSceneEntry {
  storyboard_id: string;
  song_master_id: typeof STORYBOARD_SONG_MASTER_ID;
  beat_id: string;
  scene_order: number;
  scene_duration_seconds: number;
  visual_summary: string;
  daily_life_anchor: DailyLifeAnchor[];
  behavior_id: SeedBehaviorDnaId;
  emotion_id: SeedEmotionDnaId;
  relationship_id: SeedRelationshipDnaId;
  shot_affinity: string[];
  transition_affinity: string[];
  image_dataset_usage: string[];
  video_dataset_usage: string[];
  keywords: string[];
}

export interface StoryboardLayerPreview {
  layer_version: typeof STORYBOARD_LAYER_VERSION;
  seed_count: typeof STORYBOARD_SEED_COUNT;
  song_master_id: typeof STORYBOARD_SONG_MASTER_ID;
  required_fields: RequiredStoryboardSceneField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
  ];
  seed_storyboard_scenes: StoryboardSceneEntry[];
}

interface DatasetUsagePair {
  image: string;
  video: string;
}

const BEAT_DATASET_USAGE: Record<(typeof SEED_BEAT_TYPES)[number], DatasetUsagePair> = {
  waiting: {
    image: 'IDS-wide-establishing-sunset',
    video: 'VDS-wide-establishing-sunset',
  },
  memory: {
    image: 'IDS-overhead-isolation-sunset',
    video: 'VDS-overhead-isolation-sunset',
  },
  discovery: {
    image: 'IDS-medium-emotional-confession',
    video: 'VDS-medium-emotional-confession',
  },
  distance: {
    image: 'IDS-silhouette-sunset',
    video: 'VDS-silhouette-sunset',
  },
  longing: {
    image: 'IDS-window-reflection-hope',
    video: 'VDS-window-reflection-hope',
  },
  hope: {
    image: 'IDS-window-reflection-hope',
    video: 'VDS-window-reflection-hope',
  },
  journey: {
    image: 'IDS-rear-follow-walking',
    video: 'VDS-rear-follow-walking',
  },
  conflict: {
    image: 'IDS-side-tracking-walking',
    video: 'VDS-side-tracking-walking',
  },
  sacrifice: {
    image: 'IDS-medium-emotional-hope-sadness',
    video: 'VDS-medium-emotional-hope-sadness',
  },
  healing: {
    image: 'IDS-wide-establishing-rain',
    video: 'VDS-wide-establishing-rain',
  },
  forgiveness: {
    image: 'IDS-close-hand-sadness-hope',
    video: 'VDS-close-hand-sadness-hope',
  },
  reunion: {
    image: 'IDS-side-tracking-reunion',
    video: 'VDS-side-tracking-reunion',
  },
  departure: {
    image: 'IDS-silhouette-sunset',
    video: 'VDS-silhouette-sunset',
  },
  growth: {
    image: 'IDS-rear-follow-walking',
    video: 'VDS-rear-follow-walking',
  },
  redemption: {
    image: 'IDS-silhouette-reunion',
    video: 'VDS-silhouette-reunion',
  },
  new_beginning: {
    image: 'IDS-wide-establishing-sunset',
    video: 'VDS-wide-establishing-sunset',
  },
};

function getShotAffinityForGrammar(grammarId: NarrativeBeatEntry['grammar_id']): string[] {
  const mvgLibrary = getMusicVideoGrammarSeedLibrary();
  const directMatch = mvgLibrary.find((item) => item.grammar_id === grammarId);
  if (directMatch) return [...directMatch.shot_affinity];

  const grammar = getGonagiGrammarSeedLibrary().find((item) => item.grammar_id === grammarId);
  if (!grammar) return [];

  const behaviorRelationshipMatch = mvgLibrary.find(
    (item) =>
      item.behavior_focus.includes(grammar.behavior_id) &&
      item.relationship_focus.includes(grammar.relationship_id)
  );
  if (behaviorRelationshipMatch) return [...behaviorRelationshipMatch.shot_affinity];

  const behaviorMatch = mvgLibrary.find((item) =>
    item.behavior_focus.includes(grammar.behavior_id)
  );
  return behaviorMatch ? [...behaviorMatch.shot_affinity] : [];
}

function buildStoryboardScene(
  beat: NarrativeBeatEntry,
  sceneOrder: number,
  sceneDurationSeconds: number
): StoryboardSceneEntry {
  const grammar = getGonagiGrammarSeedLibrary().find((item) => item.grammar_id === beat.grammar_id);
  if (!grammar) {
    throw new Error(`Missing grammar for beat ${beat.beat_id}`);
  }

  const datasets = BEAT_DATASET_USAGE[beat.beat_type];

  return {
    storyboard_id: `SBD-${STORYBOARD_SONG_MASTER_ID}-${String(sceneOrder).padStart(2, '0')}`,
    song_master_id: STORYBOARD_SONG_MASTER_ID,
    beat_id: beat.beat_id,
    scene_order: sceneOrder,
    scene_duration_seconds: sceneDurationSeconds,
    visual_summary: `${beat.scene_purpose} rendered through ${beat.daily_life_anchor.join(' and ')}`,
    daily_life_anchor: [...beat.daily_life_anchor],
    behavior_id: grammar.behavior_id,
    emotion_id: beat.emotion_id,
    relationship_id: beat.relationship_id,
    shot_affinity: getShotAffinityForGrammar(beat.grammar_id),
    transition_affinity: [...beat.transition_affinity],
    image_dataset_usage: [datasets.image],
    video_dataset_usage: [datasets.video],
    keywords: [...beat.keywords, 'storyboard', STORYBOARD_SONG_MASTER_ID],
  };
}

function buildStoryboardScenesForSongMaster01(): StoryboardSceneEntry[] {
  const beats = getNarrativeBeatSeedLibrary();
  const songMaster = getSongMasterSeedLibrary().find(
    (entry) => entry.song_master_id === STORYBOARD_SONG_MASTER_ID
  );
  const targetDuration = songMaster?.target_duration_seconds ?? 210;
  const baseDuration = Math.floor(targetDuration / STORYBOARD_SEED_COUNT);
  const remainder = targetDuration - baseDuration * STORYBOARD_SEED_COUNT;

  return beats.map((beat, index) => {
    const sceneOrder = index + 1;
    const extraSecond = index < remainder ? 1 : 0;
    return buildStoryboardScene(beat, sceneOrder, baseDuration + extraSecond);
  });
}

export function getStoryboardSceneSeedLibrary(): StoryboardSceneEntry[] {
  return buildStoryboardScenesForSongMaster01().map((scene) => ({
    ...scene,
    daily_life_anchor: [...scene.daily_life_anchor],
    shot_affinity: [...scene.shot_affinity],
    transition_affinity: [...scene.transition_affinity],
    image_dataset_usage: [...scene.image_dataset_usage],
    video_dataset_usage: [...scene.video_dataset_usage],
    keywords: [...scene.keywords],
  }));
}

export function buildStoryboardLayerPreview(): StoryboardLayerPreview {
  return {
    layer_version: STORYBOARD_LAYER_VERSION,
    seed_count: STORYBOARD_SEED_COUNT,
    song_master_id: STORYBOARD_SONG_MASTER_ID,
    required_fields: [...REQUIRED_STORYBOARD_SCENE_FIELDS],
    pipeline_chain: ['song_master', 'emotion_timeline', 'narrative_beat', 'storyboard_scene'],
    seed_storyboard_scenes: getStoryboardSceneSeedLibrary(),
  };
}

export function findDuplicateStoryboardIds(storyboardIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of storyboardIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getNarrativeBeatById(beatId: string): NarrativeBeatEntry | undefined {
  return getNarrativeBeatSeedLibrary().find((beat) => beat.beat_id === beatId);
}

export function getSongMasterById(songMasterId: string) {
  return getSongMasterSeedLibrary().find((entry) => entry.song_master_id === songMasterId);
}
