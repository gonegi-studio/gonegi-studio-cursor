import {
  SEED_EMOTION_DNA_IDS,
  type SeedEmotionDnaId,
} from './emotionDnaDefinitions.js';
import {
  SEED_GRAMMAR_IDS,
  getGonagiGrammarSeedLibrary,
  type SeedGrammarId,
} from './gonagiGrammarDefinitions.js';
import {
  SEED_MUSIC_GRAMMAR_IDS,
  getMusicVideoGrammarSeedLibrary,
  type SeedMusicGrammarId,
} from './musicVideoGrammarDefinitions.js';
import {
  SEED_RELATIONSHIP_DNA_IDS,
  type SeedRelationshipDnaId,
} from './relationshipDnaDefinitions.js';

export const SONG_MASTER_LIBRARY_VERSION = 'SONG-MASTER-LIBRARY-PHASE-81-v1' as const;
export const SONG_MASTER_SEED_COUNT = 12 as const;
export const SONG_MASTER_LANGUAGE = 'en' as const;

export const SUPPORTED_LANGUAGE_CODES = [
  'en',
  'ja',
  'ko',
  'es',
  'pt',
  'it',
  'vi',
  'fr',
  'hi',
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const SEED_SONG_MASTER_IDS = [
  'song_master_01',
  'song_master_02',
  'song_master_03',
  'song_master_04',
  'song_master_05',
  'song_master_06',
  'song_master_07',
  'song_master_08',
  'song_master_09',
  'song_master_10',
  'song_master_11',
  'song_master_12',
] as const;

export type SeedSongMasterId = (typeof SEED_SONG_MASTER_IDS)[number];

export const REQUIRED_SONG_MASTER_FIELDS = [
  'song_master_id',
  'song_title',
  'master_language',
  'current_duration_seconds',
  'target_duration_seconds',
  'primary_emotion',
  'primary_relationship',
  'emotion_timeline',
  'grammar_sequence',
  'language_variants',
  'video_profile',
  'keywords',
] as const;

export type RequiredSongMasterField = (typeof REQUIRED_SONG_MASTER_FIELDS)[number];

export interface EmotionTimelineSegment {
  start_time: number;
  end_time: number;
  emotion_id: SeedEmotionDnaId;
  grammar_id: SeedGrammarId;
  music_grammar_id: SeedMusicGrammarId;
}

export interface LanguageVariant {
  language_code: SupportedLanguageCode;
  duration_match_required: boolean;
  master_song_reference: SeedSongMasterId;
}

export interface SongMasterEntry {
  song_master_id: SeedSongMasterId;
  song_title: string;
  master_language: typeof SONG_MASTER_LANGUAGE;
  current_duration_seconds: number;
  target_duration_seconds: number;
  primary_emotion: SeedEmotionDnaId;
  primary_relationship: SeedRelationshipDnaId;
  emotion_timeline: EmotionTimelineSegment[];
  grammar_sequence: SeedMusicGrammarId[];
  language_variants: LanguageVariant[];
  video_profile: string;
  keywords: string[];
}

export interface SongMasterLibraryPreview {
  library_version: typeof SONG_MASTER_LIBRARY_VERSION;
  seed_count: typeof SONG_MASTER_SEED_COUNT;
  master_language: typeof SONG_MASTER_LANGUAGE;
  supported_language_codes: SupportedLanguageCode[];
  required_fields: RequiredSongMasterField[];
  linked_layers: {
    music_grammar_ids: typeof SEED_MUSIC_GRAMMAR_IDS;
    gonagi_grammar_ids: typeof SEED_GRAMMAR_IDS;
  };
  seed_song_masters: SongMasterEntry[];
}

function buildLanguageVariants(songMasterId: SeedSongMasterId): LanguageVariant[] {
  return SUPPORTED_LANGUAGE_CODES.map((language_code) => ({
    language_code,
    duration_match_required: language_code === 'en',
    master_song_reference: songMasterId,
  }));
}

function timeline(
  segments: Array<{
    start: number;
    end: number;
    music_grammar_id: SeedMusicGrammarId;
  }>
): EmotionTimelineSegment[] {
  return segments.map((segment) => {
    const unit = getMusicVideoGrammarUnit(segment.music_grammar_id);
    if (!unit) {
      throw new Error(`Unknown music grammar: ${segment.music_grammar_id}`);
    }
    return {
      start_time: segment.start,
      end_time: segment.end,
      emotion_id: unit.emotion_focus[0],
      grammar_id: unit.grammar_id,
      music_grammar_id: segment.music_grammar_id,
    };
  });
}

function grammarSequenceFromTimeline(emotionTimeline: EmotionTimelineSegment[]): SeedMusicGrammarId[] {
  return emotionTimeline.map((segment) => segment.music_grammar_id);
}

function buildSongMaster(
  songMasterId: SeedSongMasterId,
  index: number,
  config: {
    primary_emotion: SeedEmotionDnaId;
    primary_relationship: SeedRelationshipDnaId;
    target_duration_seconds: number;
    segments: Array<{ start: number; end: number; music_grammar_id: SeedMusicGrammarId }>;
    video_profile: string;
    keywords: string[];
  }
): SongMasterEntry {
  const emotion_timeline = timeline(config.segments);
  return {
    song_master_id: songMasterId,
    song_title: `gonagi_master_track_${String(index).padStart(2, '0')}`,
    master_language: SONG_MASTER_LANGUAGE,
    current_duration_seconds: 0,
    target_duration_seconds: config.target_duration_seconds,
    primary_emotion: config.primary_emotion,
    primary_relationship: config.primary_relationship,
    emotion_timeline,
    grammar_sequence: grammarSequenceFromTimeline(emotion_timeline),
    language_variants: buildLanguageVariants(songMasterId),
    video_profile: config.video_profile,
    keywords: config.keywords,
  };
}

const SONG_MASTER_SEED_LIBRARY: SongMasterEntry[] = [
  buildSongMaster('song_master_01', 1, {
    primary_emotion: 'anticipation',
    primary_relationship: 'guardian_child',
    target_duration_seconds: 210,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 30, music_grammar_id: 'MVG-intro-waiting' },
      { start: 30, end: 75, music_grammar_id: 'MVG-verse-loneliness' },
      { start: 75, end: 105, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 105, end: 150, music_grammar_id: 'MVG-chorus-protection' },
      { start: 150, end: 180, music_grammar_id: 'MVG-bridge-farewell' },
      { start: 180, end: 210, music_grammar_id: 'MVG-outro-parting' },
    ],
    keywords: ['song-master-01', 'guardian', 'anticipation', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_02', 2, {
    primary_emotion: 'parting',
    primary_relationship: 'lost_lovers',
    target_duration_seconds: 225,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 35, music_grammar_id: 'MVG-night-longing' },
      { start: 35, end: 80, music_grammar_id: 'MVG-verse-hesitation' },
      { start: 80, end: 110, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 110, end: 155, music_grammar_id: 'MVG-chorus-reunion' },
      { start: 155, end: 190, music_grammar_id: 'MVG-bridge-farewell' },
      { start: 190, end: 225, music_grammar_id: 'MVG-ending-redemption' },
    ],
    keywords: ['song-master-02', 'lost-lovers', 'parting', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_03', 3, {
    primary_emotion: 'uncertainty',
    primary_relationship: 'silent_friends',
    target_duration_seconds: 200,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 28, music_grammar_id: 'MVG-intro-waiting' },
      { start: 28, end: 72, music_grammar_id: 'MVG-verse-hesitation' },
      { start: 72, end: 100, music_grammar_id: 'MVG-memory-isolation' },
      { start: 100, end: 140, music_grammar_id: 'MVG-final-connection' },
      { start: 140, end: 200, music_grammar_id: 'MVG-outro-parting' },
    ],
    keywords: ['song-master-03', 'friendship', 'uncertainty', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_04', 4, {
    primary_emotion: 'connection',
    primary_relationship: 'reunion_after_loss',
    target_duration_seconds: 240,
    video_profile: 'emotion_timeline_extended_v1',
    segments: [
      { start: 0, end: 40, music_grammar_id: 'MVG-memory-isolation' },
      { start: 40, end: 85, music_grammar_id: 'MVG-verse-loneliness' },
      { start: 85, end: 120, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 120, end: 165, music_grammar_id: 'MVG-chorus-reunion' },
      { start: 165, end: 200, music_grammar_id: 'MVG-final-connection' },
      { start: 200, end: 240, music_grammar_id: 'MVG-morning-new-journey' },
    ],
    keywords: ['song-master-04', 'reunion', 'connection', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_05', 5, {
    primary_emotion: 'care',
    primary_relationship: 'mentor_student',
    target_duration_seconds: 215,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 32, music_grammar_id: 'MVG-rain-care' },
      { start: 32, end: 78, music_grammar_id: 'MVG-verse-hesitation' },
      { start: 78, end: 108, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 108, end: 150, music_grammar_id: 'MVG-chorus-protection' },
      { start: 150, end: 215, music_grammar_id: 'MVG-morning-new-journey' },
    ],
    keywords: ['song-master-05', 'mentor', 'care', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_06', 6, {
    primary_emotion: 'resolve',
    primary_relationship: 'rival_to_ally',
    target_duration_seconds: 205,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 30, music_grammar_id: 'MVG-intro-waiting' },
      { start: 30, end: 70, music_grammar_id: 'MVG-verse-hesitation' },
      { start: 70, end: 100, music_grammar_id: 'MVG-sunset-resolution' },
      { start: 100, end: 145, music_grammar_id: 'MVG-bridge-determination' },
      { start: 145, end: 205, music_grammar_id: 'MVG-ending-redemption' },
    ],
    keywords: ['song-master-06', 'resolve', 'rival', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_07', 7, {
    primary_emotion: 'isolation',
    primary_relationship: 'family_separation',
    target_duration_seconds: 220,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 45, music_grammar_id: 'MVG-verse-loneliness' },
      { start: 45, end: 80, music_grammar_id: 'MVG-memory-isolation' },
      { start: 80, end: 115, music_grammar_id: 'MVG-night-longing' },
      { start: 115, end: 155, music_grammar_id: 'MVG-sunset-resolution' },
      { start: 155, end: 220, music_grammar_id: 'MVG-outro-parting' },
    ],
    keywords: ['song-master-07', 'isolation', 'family', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_08', 8, {
    primary_emotion: 'optimism',
    primary_relationship: 'stranger_kindness',
    target_duration_seconds: 195,
    video_profile: 'emotion_timeline_compact_v1',
    segments: [
      { start: 0, end: 35, music_grammar_id: 'MVG-rain-care' },
      { start: 35, end: 80, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 80, end: 125, music_grammar_id: 'MVG-final-connection' },
      { start: 125, end: 195, music_grammar_id: 'MVG-morning-new-journey' },
    ],
    keywords: ['song-master-08', 'optimism', 'kindness', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_09', 9, {
    primary_emotion: 'anticipation',
    primary_relationship: 'lost_lovers',
    target_duration_seconds: 230,
    video_profile: 'emotion_timeline_extended_v1',
    segments: [
      { start: 0, end: 35, music_grammar_id: 'MVG-intro-waiting' },
      { start: 35, end: 75, music_grammar_id: 'MVG-night-longing' },
      { start: 75, end: 110, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 110, end: 155, music_grammar_id: 'MVG-chorus-reunion' },
      { start: 155, end: 190, music_grammar_id: 'MVG-bridge-farewell' },
      { start: 190, end: 230, music_grammar_id: 'MVG-ending-redemption' },
    ],
    keywords: ['song-master-09', 'longing', 'anticipation', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_10', 10, {
    primary_emotion: 'parting',
    primary_relationship: 'family_separation',
    target_duration_seconds: 210,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 40, music_grammar_id: 'MVG-memory-isolation' },
      { start: 40, end: 85, music_grammar_id: 'MVG-verse-loneliness' },
      { start: 85, end: 120, music_grammar_id: 'MVG-sunset-resolution' },
      { start: 120, end: 160, music_grammar_id: 'MVG-bridge-farewell' },
      { start: 160, end: 210, music_grammar_id: 'MVG-outro-parting' },
    ],
    keywords: ['song-master-10', 'parting', 'separation', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_11', 11, {
    primary_emotion: 'connection',
    primary_relationship: 'lost_lovers',
    target_duration_seconds: 225,
    video_profile: 'emotion_timeline_standard_v1',
    segments: [
      { start: 0, end: 30, music_grammar_id: 'MVG-night-longing' },
      { start: 30, end: 75, music_grammar_id: 'MVG-verse-hesitation' },
      { start: 75, end: 110, music_grammar_id: 'MVG-prechorus-hope' },
      { start: 110, end: 155, music_grammar_id: 'MVG-chorus-reunion' },
      { start: 155, end: 225, music_grammar_id: 'MVG-ending-redemption' },
    ],
    keywords: ['song-master-11', 'connection', 'redemption', 'emotion-timeline'],
  }),
  buildSongMaster('song_master_12', 12, {
    primary_emotion: 'resolve',
    primary_relationship: 'guardian_child',
    target_duration_seconds: 240,
    video_profile: 'emotion_timeline_extended_v1',
    segments: [
      { start: 0, end: 35, music_grammar_id: 'MVG-intro-waiting' },
      { start: 35, end: 80, music_grammar_id: 'MVG-chorus-protection' },
      { start: 80, end: 120, music_grammar_id: 'MVG-bridge-determination' },
      { start: 120, end: 165, music_grammar_id: 'MVG-sunset-resolution' },
      { start: 165, end: 200, music_grammar_id: 'MVG-final-connection' },
      { start: 200, end: 240, music_grammar_id: 'MVG-morning-new-journey' },
    ],
    keywords: ['song-master-12', 'resolve', 'guardian', 'emotion-timeline'],
  }),
];

export function getMusicVideoGrammarUnit(musicGrammarId: SeedMusicGrammarId) {
  return getMusicVideoGrammarSeedLibrary().find(
    (unit) => unit.music_grammar_id === musicGrammarId
  );
}

export function getGonagiGrammarUnitById(grammarId: SeedGrammarId) {
  return getGonagiGrammarSeedLibrary().find((unit) => unit.grammar_id === grammarId);
}

export function getSongMasterSeedLibrary(): SongMasterEntry[] {
  return SONG_MASTER_SEED_LIBRARY.map((entry) => ({
    ...entry,
    emotion_timeline: entry.emotion_timeline.map((segment) => ({ ...segment })),
    grammar_sequence: [...entry.grammar_sequence],
    language_variants: entry.language_variants.map((variant) => ({ ...variant })),
    keywords: [...entry.keywords],
  }));
}

export function buildSongMasterLibraryPreview(): SongMasterLibraryPreview {
  return {
    library_version: SONG_MASTER_LIBRARY_VERSION,
    seed_count: SONG_MASTER_SEED_COUNT,
    master_language: SONG_MASTER_LANGUAGE,
    supported_language_codes: [...SUPPORTED_LANGUAGE_CODES],
    required_fields: [...REQUIRED_SONG_MASTER_FIELDS],
    linked_layers: {
      music_grammar_ids: [...SEED_MUSIC_GRAMMAR_IDS],
      gonagi_grammar_ids: [...SEED_GRAMMAR_IDS],
    },
    seed_song_masters: getSongMasterSeedLibrary(),
  };
}

export function findDuplicateSongMasterIds(songMasterIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of songMasterIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidSongMasterId(value: string): value is SeedSongMasterId {
  return (SEED_SONG_MASTER_IDS as readonly string[]).includes(value);
}

export function isValidSongMasterKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidLanguageCode(value: string): value is SupportedLanguageCode {
  return (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(value);
}

export {
  SEED_EMOTION_DNA_IDS,
  SEED_RELATIONSHIP_DNA_IDS,
  type SeedEmotionDnaId,
  type SeedRelationshipDnaId,
};
