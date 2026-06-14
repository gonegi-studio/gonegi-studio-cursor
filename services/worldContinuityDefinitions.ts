import {
  getCharacterContinuitySeedLibrary,
  type CharacterContinuityEntry,
} from './characterContinuityDefinitions.js';
import {
  getLocationContinuitySeedLibrary,
  SEED_LOCATION_IDS,
  type LocationContinuityEntry,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import {
  getSongMasterSeedLibrary,
} from './songMasterLibraryDefinitions.js';
import { getPromptPackPairSeedLibrary } from './promptPackPairingDefinitions.js';
import {
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';

export const WORLD_CONTINUITY_VERSION = 'WORLD-CONTINUITY-PHASE-89-v1' as const;
export const WORLD_CONTINUITY_SEED_COUNT = 1 as const;
export const WORLD_CONTINUITY_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const WORLD_CONTINUITY_WORLD_ID = 'WORLD-song_master_01' as const;

export const CONTINUITY_SCORE_MIN = 1 as const;
export const CONTINUITY_SCORE_MAX = 100 as const;

export const REQUIRED_WORLD_CONTINUITY_FIELDS = [
  'world_id',
  'song_master_id',
  'character_continuity_ids',
  'location_continuity_ids',
  'world_tone',
  'recurring_motifs',
  'time_of_day_pattern',
  'weather_pattern',
  'emotional_world_arc',
  'scene_references',
  'continuity_score',
] as const;

export type RequiredWorldContinuityField = (typeof REQUIRED_WORLD_CONTINUITY_FIELDS)[number];

export interface WorldContinuityEntry {
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  song_master_id: typeof WORLD_CONTINUITY_SONG_MASTER_ID;
  character_continuity_ids: string[];
  location_continuity_ids: SeedLocationId[];
  world_tone: string[];
  recurring_motifs: string[];
  time_of_day_pattern: string[];
  weather_pattern: string[];
  emotional_world_arc: string[];
  scene_references: string[];
  continuity_score: number;
}

export interface WorldContinuityPreview {
  layer_version: typeof WORLD_CONTINUITY_VERSION;
  seed_count: typeof WORLD_CONTINUITY_SEED_COUNT;
  song_master_id: typeof WORLD_CONTINUITY_SONG_MASTER_ID;
  required_fields: RequiredWorldContinuityField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'video_prompt_pack',
    'prompt_pack_pair',
    'character_continuity',
    'location_continuity',
    'world_continuity',
  ];
  seed_world_continuity: WorldContinuityEntry[];
}

const WORLD_TONE = [
  'cinematic music video realism',
  'gonagi visual continuity',
  'intimate daily-life emotional scale',
  'photorealistic anime-realism blend',
  'guardian-companion bond atmosphere',
] as const;

const RECURRING_MOTIFS = [
  'motif:waiting-to-reunion',
  'motif:window-reflection-memory',
  'motif:transit-departure-return',
  'motif:rain-to-clear-healing',
  'motif:sunset-bridge-hope',
  'motif:protective-presence',
  'motif:daily-life-anchor-ritual',
  'motif:gonagi-dana-bond-thread',
] as const;

const TIME_OF_DAY_PATTERN = [
  'dawn: morning_routine and journey departure',
  'day: school street and market activity',
  'golden-hour: bridge sunset and shore reunion',
  'dusk: station waiting and rooftop farewell',
  'night: forest star-gazing redemption',
] as const;

const WEATHER_PATTERN = [
  'clear-anticipation open sky',
  'rain-longing interior shelter',
  'post-rain reflective pavement',
  'sunset-warm horizon gradient',
  'night-still forest air',
] as const;

function getSongMasterEmotionalArc(): string[] {
  const songMaster = getSongMasterSeedLibrary().find(
    (entry) => entry.song_master_id === WORLD_CONTINUITY_SONG_MASTER_ID
  );
  if (!songMaster) {
    return [
      'arc:anticipation-opening',
      'arc:isolation-memory',
      'arc:hope-reunion',
      'arc:parting-closure',
    ];
  }

  return [
    `arc:primary-emotion:${songMaster.primary_emotion}`,
    `arc:primary-relationship:${songMaster.primary_relationship}`,
    ...songMaster.emotion_timeline.map(
      (segment) =>
        `arc:${segment.start_time}-${segment.end_time}s:${segment.music_grammar_id}:${segment.emotion_id}`
    ),
  ];
}

function buildSceneReferences(): string[] {
  const pairs = getPromptPackPairSeedLibrary();
  const scenes = getStoryboardSceneSeedLibrary();
  const references: string[] = [];

  for (const scene of scenes) {
    const pair = pairs.find((entry) => entry.storyboard_id === scene.storyboard_id);
    references.push(`storyboard:${scene.storyboard_id}`);
    references.push(`pair:${pair?.pair_id ?? `PAIR-${scene.storyboard_id}`}`);
    references.push(`scene-order:${scene.scene_order}`);
  }

  return [...new Set(references)].sort();
}

function calculateWorldContinuityScore(
  characterEntries: CharacterContinuityEntry[],
  locationEntries: LocationContinuityEntry[],
  sceneReferences: string[]
): number {
  const storyboardCount = getStoryboardSceneSeedLibrary().length;
  const referencedStoryboards = sceneReferences.filter((reference) =>
    reference.startsWith('storyboard:')
  ).length;

  const characterCoverage =
    characterEntries.length > 0
      ? characterEntries.reduce((sum, entry) => sum + entry.continuity_score, 0) /
        characterEntries.length
      : 0;

  const locationCoverage =
    locationEntries.length > 0
      ? locationEntries.reduce((sum, entry) => sum + entry.continuity_score, 0) /
        locationEntries.length
      : 0;

  const sceneCoverage =
    storyboardCount > 0 ? (referencedStoryboards / storyboardCount) * 100 : 0;

  const rawScore = Math.round((characterCoverage + locationCoverage + sceneCoverage) / 3);
  return Math.min(CONTINUITY_SCORE_MAX, Math.max(CONTINUITY_SCORE_MIN, rawScore));
}

function buildWorldContinuityEntry(): WorldContinuityEntry {
  const characterEntries = getCharacterContinuitySeedLibrary();
  const locationEntries = getLocationContinuitySeedLibrary();
  const sceneReferences = buildSceneReferences();

  return {
    world_id: WORLD_CONTINUITY_WORLD_ID,
    song_master_id: WORLD_CONTINUITY_SONG_MASTER_ID,
    character_continuity_ids: characterEntries.map((entry) => entry.continuity_id),
    location_continuity_ids: [...SEED_LOCATION_IDS],
    world_tone: [...WORLD_TONE],
    recurring_motifs: [...RECURRING_MOTIFS],
    time_of_day_pattern: [...TIME_OF_DAY_PATTERN],
    weather_pattern: [...WEATHER_PATTERN],
    emotional_world_arc: getSongMasterEmotionalArc(),
    scene_references: sceneReferences,
    continuity_score: calculateWorldContinuityScore(
      characterEntries,
      locationEntries,
      sceneReferences
    ),
  };
}

export function getWorldContinuitySeedLibrary(): WorldContinuityEntry[] {
  const entry = buildWorldContinuityEntry();
  return [
    {
      ...entry,
      character_continuity_ids: [...entry.character_continuity_ids],
      location_continuity_ids: [...entry.location_continuity_ids],
      world_tone: [...entry.world_tone],
      recurring_motifs: [...entry.recurring_motifs],
      time_of_day_pattern: [...entry.time_of_day_pattern],
      weather_pattern: [...entry.weather_pattern],
      emotional_world_arc: [...entry.emotional_world_arc],
      scene_references: [...entry.scene_references],
    },
  ];
}

export function buildWorldContinuityPreview(): WorldContinuityPreview {
  return {
    layer_version: WORLD_CONTINUITY_VERSION,
    seed_count: WORLD_CONTINUITY_SEED_COUNT,
    song_master_id: WORLD_CONTINUITY_SONG_MASTER_ID,
    required_fields: [...REQUIRED_WORLD_CONTINUITY_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'video_prompt_pack',
      'prompt_pack_pair',
      'character_continuity',
      'location_continuity',
      'world_continuity',
    ],
    seed_world_continuity: getWorldContinuitySeedLibrary(),
  };
}

export function getWorldContinuityById(
  worldId: string
): WorldContinuityEntry | undefined {
  return getWorldContinuitySeedLibrary().find((entry) => entry.world_id === worldId);
}

export function getCharacterContinuityEntryById(continuityId: string) {
  return getCharacterContinuitySeedLibrary().find((entry) => entry.continuity_id === continuityId);
}

export function getLocationContinuityEntryById(locationId: string) {
  return getLocationContinuitySeedLibrary().find((entry) => entry.location_id === locationId);
}

export function getExpectedWorldContinuityScore(): number {
  const entry = buildWorldContinuityEntry();
  return entry.continuity_score;
}

export function getRequiredRecurringMotifs(): readonly string[] {
  return RECURRING_MOTIFS;
}

export function getRequiredEmotionalArcTokens(): string[] {
  return getSongMasterEmotionalArc();
}
