import { SEED_BEHAVIOR_DNA_IDS, type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import { SEED_EMOTION_DNA_IDS, type SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import {
  SEED_GRAMMAR_IDS,
  getGonagiGrammarSeedLibrary,
  type SeedGrammarId,
} from './gonagiGrammarDefinitions.js';
import {
  SEED_RELATIONSHIP_DNA_IDS,
  type SeedRelationshipDnaId,
} from './relationshipDnaDefinitions.js';

export const MUSIC_VIDEO_GRAMMAR_VERSION = 'MUSIC-VIDEO-GRAMMAR-PHASE-80-v1' as const;
export const MUSIC_VIDEO_GRAMMAR_SEED_COUNT = 16 as const;

export const REQUIRED_MUSIC_VIDEO_GRAMMAR_FIELDS = [
  'music_grammar_id',
  'grammar_id',
  'song_section',
  'lyric_emotion',
  'visual_purpose',
  'scene_energy',
  'camera_rhythm',
  'cut_density',
  'behavior_focus',
  'emotion_focus',
  'relationship_focus',
  'shot_affinity',
  'transition_affinity',
  'video_dataset_usage',
  'keywords',
] as const;

export type RequiredMusicVideoGrammarField =
  (typeof REQUIRED_MUSIC_VIDEO_GRAMMAR_FIELDS)[number];

export const SEED_MUSIC_GRAMMAR_IDS = [
  'MVG-intro-waiting',
  'MVG-verse-loneliness',
  'MVG-verse-hesitation',
  'MVG-prechorus-hope',
  'MVG-chorus-reunion',
  'MVG-chorus-protection',
  'MVG-bridge-farewell',
  'MVG-bridge-determination',
  'MVG-final-connection',
  'MVG-outro-parting',
  'MVG-memory-isolation',
  'MVG-rain-care',
  'MVG-sunset-resolution',
  'MVG-night-longing',
  'MVG-morning-new-journey',
  'MVG-ending-redemption',
] as const;

export type SeedMusicGrammarId = (typeof SEED_MUSIC_GRAMMAR_IDS)[number];

export interface MusicVideoGrammarUnit {
  music_grammar_id: SeedMusicGrammarId;
  grammar_id: SeedGrammarId;
  song_section: string;
  lyric_emotion: string;
  visual_purpose: string;
  scene_energy: string;
  camera_rhythm: string;
  cut_density: string;
  behavior_focus: SeedBehaviorDnaId[];
  emotion_focus: SeedEmotionDnaId[];
  relationship_focus: SeedRelationshipDnaId[];
  shot_affinity: string[];
  transition_affinity: string[];
  video_dataset_usage: string[];
  keywords: string[];
}

export interface MusicVideoGrammarPreview {
  grammar_version: typeof MUSIC_VIDEO_GRAMMAR_VERSION;
  seed_count: typeof MUSIC_VIDEO_GRAMMAR_SEED_COUNT;
  required_fields: RequiredMusicVideoGrammarField[];
  linked_layers: {
    gonagi_grammar_ids: typeof SEED_GRAMMAR_IDS;
    behavior_dna_ids: typeof SEED_BEHAVIOR_DNA_IDS;
    emotion_dna_ids: typeof SEED_EMOTION_DNA_IDS;
    relationship_dna_ids: typeof SEED_RELATIONSHIP_DNA_IDS;
  };
  seed_music_video_grammar_units: MusicVideoGrammarUnit[];
}

const MUSIC_VIDEO_GRAMMAR_SEED_LIBRARY: MusicVideoGrammarUnit[] = [
  {
    music_grammar_id: 'MVG-intro-waiting',
    grammar_id: 'GRA-waiting-guardian',
    song_section: 'intro',
    lyric_emotion: 'quiet anticipation before the story begins',
    visual_purpose: 'Establish guardian vigil and patient waiting tone',
    scene_energy: 'low',
    camera_rhythm: 'slow_hold',
    cut_density: 'sparse',
    behavior_focus: ['waiting'],
    emotion_focus: ['anticipation'],
    relationship_focus: ['guardian_child'],
    shot_affinity: ['wide_establishing', 'medium_emotional'],
    transition_affinity: ['silence_to_confession', 'sunset_to_night'],
    video_dataset_usage: ['VDS-wide-establishing-sunset', 'VDS-medium-emotional-hope-sadness'],
    keywords: ['intro', 'waiting', 'anticipation', 'guardian'],
  },
  {
    music_grammar_id: 'MVG-verse-loneliness',
    grammar_id: 'GRA-loneliness-distance',
    song_section: 'verse',
    lyric_emotion: 'isolated ache after separation',
    visual_purpose: 'Show solitary distance and emotional withdrawal',
    scene_energy: 'low_medium',
    camera_rhythm: 'drift',
    cut_density: 'moderate',
    behavior_focus: ['loneliness'],
    emotion_focus: ['isolation'],
    relationship_focus: ['family_separation'],
    shot_affinity: ['overhead_isolation', 'silhouette_distance'],
    transition_affinity: ['sunset_to_night', 'rain_to_clear'],
    video_dataset_usage: ['VDS-overhead-isolation-hope-sadness', 'VDS-overhead-isolation-sunset'],
    keywords: ['verse', 'loneliness', 'isolation', 'distance'],
  },
  {
    music_grammar_id: 'MVG-verse-hesitation',
    grammar_id: 'GRA-hesitation-friendship',
    song_section: 'verse',
    lyric_emotion: 'uncertainty before honest confession',
    visual_purpose: 'Hold hesitation between silent friends',
    scene_energy: 'low_medium',
    camera_rhythm: 'pause_beat',
    cut_density: 'moderate',
    behavior_focus: ['hesitation'],
    emotion_focus: ['uncertainty'],
    relationship_focus: ['silent_friends'],
    shot_affinity: ['medium_emotional', 'window_reflection'],
    transition_affinity: ['silence_to_confession', 'hope_to_sadness'],
    video_dataset_usage: ['VDS-medium-emotional-confession', 'VDS-window-reflection-confession'],
    keywords: ['verse', 'hesitation', 'uncertainty', 'friendship'],
  },
  {
    music_grammar_id: 'MVG-prechorus-hope',
    grammar_id: 'GRA-hope-reunion',
    song_section: 'prechorus',
    lyric_emotion: 'optimism rising before emotional lift',
    visual_purpose: 'Build hopeful momentum toward reunion',
    scene_energy: 'medium',
    camera_rhythm: 'accelerating_push',
    cut_density: 'moderate',
    behavior_focus: ['hope'],
    emotion_focus: ['optimism'],
    relationship_focus: ['reunion_after_loss'],
    shot_affinity: ['medium_emotional', 'side_tracking'],
    transition_affinity: ['sadness_to_hope', 'separation_to_reunion'],
    video_dataset_usage: ['VDS-window-reflection-hope', 'VDS-side-tracking-reunion'],
    keywords: ['prechorus', 'hope', 'optimism', 'lift'],
  },
  {
    music_grammar_id: 'MVG-chorus-reunion',
    grammar_id: 'GRA-reunion-after-loss',
    song_section: 'chorus',
    lyric_emotion: 'connection restored through embrace',
    visual_purpose: 'Peak reunion beat with converging movement',
    scene_energy: 'high',
    camera_rhythm: 'convergence_tracking',
    cut_density: 'dense',
    behavior_focus: ['reunion'],
    emotion_focus: ['connection'],
    relationship_focus: ['reunion_after_loss'],
    shot_affinity: ['side_tracking', 'rear_follow'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    video_dataset_usage: ['VDS-side-tracking-reunion', 'VDS-rear-follow-reunion'],
    keywords: ['chorus', 'reunion', 'connection', 'embrace'],
  },
  {
    music_grammar_id: 'MVG-chorus-protection',
    grammar_id: 'GRA-protection-child',
    song_section: 'chorus',
    lyric_emotion: 'care expressed through protective action',
    visual_purpose: 'Chorus visual anchor of guardian protection',
    scene_energy: 'high',
    camera_rhythm: 'hero_hold',
    cut_density: 'dense',
    behavior_focus: ['protection'],
    emotion_focus: ['care'],
    relationship_focus: ['guardian_child'],
    shot_affinity: ['medium_emotional', 'wide_establishing'],
    transition_affinity: ['separation_to_reunion', 'silence_to_confession'],
    video_dataset_usage: ['VDS-medium-emotional-hope-sadness', 'VDS-wide-establishing-sunset'],
    keywords: ['chorus', 'protection', 'care', 'guardian'],
  },
  {
    music_grammar_id: 'MVG-bridge-farewell',
    grammar_id: 'GRA-farewell-lost-love',
    song_section: 'bridge',
    lyric_emotion: 'parting sorrow with enduring bond memory',
    visual_purpose: 'Bridge farewell between lost lovers',
    scene_energy: 'medium_high',
    camera_rhythm: 'pull_back',
    cut_density: 'moderate',
    behavior_focus: ['farewell'],
    emotion_focus: ['parting'],
    relationship_focus: ['lost_lovers'],
    shot_affinity: ['silhouette_distance', 'medium_emotional'],
    transition_affinity: ['separation_to_reunion', 'sunset_to_night'],
    video_dataset_usage: ['VDS-silhouette-sunset', 'VDS-medium-emotional-hope-sadness'],
    keywords: ['bridge', 'farewell', 'parting', 'lost-love'],
  },
  {
    music_grammar_id: 'MVG-bridge-determination',
    grammar_id: 'GRA-determination-return',
    song_section: 'bridge',
    lyric_emotion: 'resolve to return and transform rivalry',
    visual_purpose: 'Bridge resolve beat turning rival into ally',
    scene_energy: 'high',
    camera_rhythm: 'locked_drive',
    cut_density: 'dense',
    behavior_focus: ['determination'],
    emotion_focus: ['resolve'],
    relationship_focus: ['rival_to_ally'],
    shot_affinity: ['side_tracking', 'rear_follow'],
    transition_affinity: ['walking_to_running', 'hope_to_sadness'],
    video_dataset_usage: ['VDS-side-tracking-walking', 'VDS-rear-follow-walking'],
    keywords: ['bridge', 'determination', 'resolve', 'return'],
  },
  {
    music_grammar_id: 'MVG-final-connection',
    grammar_id: 'GRA-connection-recovery',
    song_section: 'final',
    lyric_emotion: 'connection recovered through unexpected kindness',
    visual_purpose: 'Final movement restores trust via brief connection',
    scene_energy: 'medium_high',
    camera_rhythm: 'gentle_convergence',
    cut_density: 'moderate',
    behavior_focus: ['reunion'],
    emotion_focus: ['connection'],
    relationship_focus: ['stranger_kindness'],
    shot_affinity: ['medium_emotional', 'close_hand_detail'],
    transition_affinity: ['rain_to_clear', 'separation_to_reunion'],
    video_dataset_usage: ['VDS-close-hand-sadness-hope', 'VDS-medium-emotional-confession'],
    keywords: ['final', 'connection', 'recovery', 'kindness'],
  },
  {
    music_grammar_id: 'MVG-outro-parting',
    grammar_id: 'GRA-parting-separation',
    song_section: 'outro',
    lyric_emotion: 'gentle parting after family separation',
    visual_purpose: 'Outro threshold farewell and widening distance',
    scene_energy: 'low',
    camera_rhythm: 'slow_retreat',
    cut_density: 'sparse',
    behavior_focus: ['farewell'],
    emotion_focus: ['parting'],
    relationship_focus: ['family_separation'],
    shot_affinity: ['silhouette_distance', 'wide_establishing'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    video_dataset_usage: ['VDS-silhouette-sunset', 'VDS-wide-establishing-sunset'],
    keywords: ['outro', 'parting', 'separation', 'farewell'],
  },
  {
    music_grammar_id: 'MVG-memory-isolation',
    grammar_id: 'GRA-loneliness-distance',
    song_section: 'memory',
    lyric_emotion: 'isolated memory fragment after loss of closeness',
    visual_purpose: 'Memory insert of loneliness and distance',
    scene_energy: 'low',
    camera_rhythm: 'fragment_hold',
    cut_density: 'sparse',
    behavior_focus: ['loneliness'],
    emotion_focus: ['isolation'],
    relationship_focus: ['family_separation'],
    shot_affinity: ['overhead_isolation', 'window_reflection'],
    transition_affinity: ['sunset_to_night', 'hope_to_sadness'],
    video_dataset_usage: ['VDS-overhead-isolation-sunset', 'VDS-window-reflection-hope'],
    keywords: ['memory', 'isolation', 'loneliness', 'flashback'],
  },
  {
    music_grammar_id: 'MVG-rain-care',
    grammar_id: 'GRA-care-healing',
    song_section: 'verse',
    lyric_emotion: 'care offered amid rain and vulnerability',
    visual_purpose: 'Rain scene stranger kindness healing beat',
    scene_energy: 'medium',
    camera_rhythm: 'soft_tracking',
    cut_density: 'moderate',
    behavior_focus: ['protection'],
    emotion_focus: ['care'],
    relationship_focus: ['stranger_kindness'],
    shot_affinity: ['wide_establishing', 'close_hand_detail'],
    transition_affinity: ['rain_to_clear', 'separation_to_reunion'],
    video_dataset_usage: ['VDS-wide-establishing-rain', 'VDS-close-hand-hope-sadness'],
    keywords: ['rain', 'care', 'healing', 'kindness'],
  },
  {
    music_grammar_id: 'MVG-sunset-resolution',
    grammar_id: 'GRA-resolve-sacrifice',
    song_section: 'bridge',
    lyric_emotion: 'resolve at sunset before necessary sacrifice',
    visual_purpose: 'Sunset resolve beat before departure sacrifice',
    scene_energy: 'medium_high',
    camera_rhythm: 'golden_hold',
    cut_density: 'moderate',
    behavior_focus: ['determination'],
    emotion_focus: ['resolve'],
    relationship_focus: ['family_separation'],
    shot_affinity: ['silhouette_distance', 'wide_establishing'],
    transition_affinity: ['sunset_to_night', 'hope_to_sadness'],
    video_dataset_usage: ['VDS-silhouette-sunset', 'VDS-wide-establishing-sunset'],
    keywords: ['sunset', 'resolve', 'sacrifice', 'departure'],
  },
  {
    music_grammar_id: 'MVG-night-longing',
    grammar_id: 'GRA-waiting-lost-love',
    song_section: 'verse',
    lyric_emotion: 'nighttime longing while waiting for return',
    visual_purpose: 'Night verse of waiting lost love',
    scene_energy: 'low_medium',
    camera_rhythm: 'still_night_hold',
    cut_density: 'moderate',
    behavior_focus: ['waiting'],
    emotion_focus: ['anticipation'],
    relationship_focus: ['lost_lovers'],
    shot_affinity: ['window_reflection', 'medium_emotional'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    video_dataset_usage: ['VDS-window-reflection-hope', 'VDS-medium-emotional-hope-sadness'],
    keywords: ['night', 'longing', 'waiting', 'lost-love'],
  },
  {
    music_grammar_id: 'MVG-morning-new-journey',
    grammar_id: 'GRA-optimism-new-journey',
    song_section: 'final',
    lyric_emotion: 'optimistic morning start of new journey',
    visual_purpose: 'Morning lift with mentor-student forward path',
    scene_energy: 'medium_high',
    camera_rhythm: 'forward_momentum',
    cut_density: 'moderate',
    behavior_focus: ['hope'],
    emotion_focus: ['optimism'],
    relationship_focus: ['mentor_student'],
    shot_affinity: ['side_tracking', 'rear_follow'],
    transition_affinity: ['sadness_to_hope', 'walking_to_running'],
    video_dataset_usage: ['VDS-side-tracking-walking', 'VDS-rear-follow-walking'],
    keywords: ['morning', 'journey', 'optimism', 'mentor'],
  },
  {
    music_grammar_id: 'MVG-ending-redemption',
    grammar_id: 'GRA-reunion-redemption',
    song_section: 'ending',
    lyric_emotion: 'redemptive reunion closing the emotional arc',
    visual_purpose: 'Ending redemption reunion for lost lovers',
    scene_energy: 'high',
    camera_rhythm: 'convergence_hold',
    cut_density: 'dense',
    behavior_focus: ['reunion'],
    emotion_focus: ['connection'],
    relationship_focus: ['lost_lovers'],
    shot_affinity: ['silhouette_distance', 'side_tracking'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    video_dataset_usage: ['VDS-silhouette-reunion', 'VDS-side-tracking-reunion'],
    keywords: ['ending', 'redemption', 'reunion', 'forgiveness'],
  },
];

export function getMusicVideoGrammarSeedLibrary(): MusicVideoGrammarUnit[] {
  return MUSIC_VIDEO_GRAMMAR_SEED_LIBRARY.map((unit) => ({
    ...unit,
    behavior_focus: [...unit.behavior_focus],
    emotion_focus: [...unit.emotion_focus],
    relationship_focus: [...unit.relationship_focus],
    shot_affinity: [...unit.shot_affinity],
    transition_affinity: [...unit.transition_affinity],
    video_dataset_usage: [...unit.video_dataset_usage],
    keywords: [...unit.keywords],
  }));
}

export function buildMusicVideoGrammarPreview(): MusicVideoGrammarPreview {
  return {
    grammar_version: MUSIC_VIDEO_GRAMMAR_VERSION,
    seed_count: MUSIC_VIDEO_GRAMMAR_SEED_COUNT,
    required_fields: [...REQUIRED_MUSIC_VIDEO_GRAMMAR_FIELDS],
    linked_layers: {
      gonagi_grammar_ids: [...SEED_GRAMMAR_IDS],
      behavior_dna_ids: [...SEED_BEHAVIOR_DNA_IDS],
      emotion_dna_ids: [...SEED_EMOTION_DNA_IDS],
      relationship_dna_ids: [...SEED_RELATIONSHIP_DNA_IDS],
    },
    seed_music_video_grammar_units: getMusicVideoGrammarSeedLibrary(),
  };
}

export function findDuplicateMusicGrammarIds(musicGrammarIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of musicGrammarIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidMusicGrammarId(value: string): value is SeedMusicGrammarId {
  return (SEED_MUSIC_GRAMMAR_IDS as readonly string[]).includes(value);
}

export function isValidMusicVideoKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidGrammarReference(value: string): value is SeedGrammarId {
  return (SEED_GRAMMAR_IDS as readonly string[]).includes(value);
}

export function getGonagiGrammarUnit(grammarId: SeedGrammarId) {
  return getGonagiGrammarSeedLibrary().find((unit) => unit.grammar_id === grammarId) ?? null;
}

export function isValidBehaviorFocusId(value: string): value is SeedBehaviorDnaId {
  return (SEED_BEHAVIOR_DNA_IDS as readonly string[]).includes(value);
}

export function isValidEmotionFocusId(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

export function isValidRelationshipFocusId(value: string): value is SeedRelationshipDnaId {
  return (SEED_RELATIONSHIP_DNA_IDS as readonly string[]).includes(value);
}
