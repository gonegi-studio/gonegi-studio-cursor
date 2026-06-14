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
  SEED_RELATIONSHIP_DNA_IDS,
  type SeedRelationshipDnaId,
} from './relationshipDnaDefinitions.js';

export const NARRATIVE_BEAT_VERSION = 'NARRATIVE-BEAT-PHASE-82-v1' as const;
export const NARRATIVE_BEAT_SEED_COUNT = 16 as const;

export const SEED_BEAT_TYPES = [
  'waiting',
  'memory',
  'discovery',
  'distance',
  'longing',
  'hope',
  'journey',
  'conflict',
  'sacrifice',
  'healing',
  'forgiveness',
  'reunion',
  'departure',
  'growth',
  'redemption',
  'new_beginning',
] as const;

export type SeedBeatType = (typeof SEED_BEAT_TYPES)[number];

export const DAILY_LIFE_ANCHORS = [
  'window_gazing',
  'rain_watching',
  'tea_drinking',
  'book_reading',
  'walking_alone',
  'bus_waiting',
  'train_riding',
  'letter_writing',
  'photo_viewing',
  'flower_watering',
  'pet_care',
  'market_visit',
  'school_walk',
  'bridge_crossing',
  'sunset_watching',
  'star_gazing',
  'room_cleaning',
  'cooking',
  'laundry',
  'bicycle_riding',
  'bench_sitting',
  'forest_path',
  'shore_walking',
  'snow_watching',
  'music_listening',
  'earphone_walk',
  'station_waiting',
  'doorway_pause',
  'rooftop_visit',
  'street_crossing',
  'morning_routine',
  'evening_return',
] as const;

export type DailyLifeAnchor = (typeof DAILY_LIFE_ANCHORS)[number];

export const REQUIRED_NARRATIVE_BEAT_FIELDS = [
  'beat_id',
  'beat_type',
  'emotion_id',
  'grammar_id',
  'relationship_id',
  'daily_life_anchor',
  'scene_purpose',
  'narrative_function',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
  'keywords',
] as const;

export type RequiredNarrativeBeatField = (typeof REQUIRED_NARRATIVE_BEAT_FIELDS)[number];

export interface NarrativeBeatEntry {
  beat_id: string;
  beat_type: SeedBeatType;
  emotion_id: SeedEmotionDnaId;
  grammar_id: SeedGrammarId;
  relationship_id: SeedRelationshipDnaId;
  daily_life_anchor: DailyLifeAnchor[];
  scene_purpose: string;
  narrative_function: string;
  camera_affinity: string[];
  music_affinity: string[];
  transition_affinity: string[];
  keywords: string[];
}

export interface NarrativeBeatPreview {
  beat_version: typeof NARRATIVE_BEAT_VERSION;
  seed_count: typeof NARRATIVE_BEAT_SEED_COUNT;
  seed_beat_types: SeedBeatType[];
  daily_life_anchors: DailyLifeAnchor[];
  required_fields: RequiredNarrativeBeatField[];
  linked_layers: {
    emotion_dna_ids: typeof SEED_EMOTION_DNA_IDS;
    gonagi_grammar_ids: typeof SEED_GRAMMAR_IDS;
    relationship_dna_ids: typeof SEED_RELATIONSHIP_DNA_IDS;
  };
  seed_narrative_beats: NarrativeBeatEntry[];
}

interface BeatSeedConfig {
  beat_type: SeedBeatType;
  grammar_id: SeedGrammarId;
  daily_life_anchor: DailyLifeAnchor[];
  scene_purpose: string;
  narrative_function: string;
  keywords: string[];
}

function buildBeatFromGrammar(config: BeatSeedConfig): NarrativeBeatEntry {
  const grammar = getGonagiGrammarUnit(config.grammar_id);
  if (!grammar) {
    throw new Error(`Unknown grammar: ${config.grammar_id}`);
  }

  return {
    beat_id: `NBT-${config.beat_type}`,
    beat_type: config.beat_type,
    emotion_id: grammar.emotion_id,
    grammar_id: grammar.grammar_id,
    relationship_id: grammar.relationship_id,
    daily_life_anchor: [...config.daily_life_anchor],
    scene_purpose: config.scene_purpose,
    narrative_function: config.narrative_function,
    camera_affinity: [...grammar.camera_affinity],
    music_affinity: [...grammar.music_affinity],
    transition_affinity: [...grammar.transition_affinity],
    keywords: [...config.keywords],
  };
}

const NARRATIVE_BEAT_SEED_LIBRARY: NarrativeBeatEntry[] = [
  buildBeatFromGrammar({
    beat_type: 'waiting',
    grammar_id: 'GRA-waiting-guardian',
    daily_life_anchor: ['station_waiting', 'window_gazing'],
    scene_purpose: 'Daily waiting ritual anchors quiet anticipation before change',
    narrative_function: 'establish_emotional_patience',
    keywords: ['waiting', 'anticipation', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'memory',
    grammar_id: 'GRA-loneliness-distance',
    daily_life_anchor: ['photo_viewing', 'letter_writing'],
    scene_purpose: 'Memory objects trigger isolation felt across distance',
    narrative_function: 'surface_past_emotional_echo',
    keywords: ['memory', 'isolation', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'discovery',
    grammar_id: 'GRA-hesitation-friendship',
    daily_life_anchor: ['bench_sitting', 'book_reading'],
    scene_purpose: 'Small shared routine reveals unspoken friendship',
    narrative_function: 'introduce_relational_discovery',
    keywords: ['discovery', 'friendship', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'distance',
    grammar_id: 'GRA-parting-separation',
    daily_life_anchor: ['doorway_pause', 'train_riding'],
    scene_purpose: 'Departure threshold widens physical and emotional distance',
    narrative_function: 'mark_relational_separation',
    keywords: ['distance', 'parting', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'longing',
    grammar_id: 'GRA-waiting-lost-love',
    daily_life_anchor: ['rain_watching', 'evening_return'],
    scene_purpose: 'Familiar return path holds longing for absent bond',
    narrative_function: 'sustain_absence_tension',
    keywords: ['longing', 'anticipation', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'hope',
    grammar_id: 'GRA-hope-reunion',
    daily_life_anchor: ['sunset_watching', 'bridge_crossing'],
    scene_purpose: 'Horizon movement converts grief residue into hopeful return',
    narrative_function: 'lift_emotional_trajectory',
    keywords: ['hope', 'optimism', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'journey',
    grammar_id: 'GRA-optimism-new-journey',
    daily_life_anchor: ['morning_routine', 'bicycle_riding'],
    scene_purpose: 'Morning departure marks optimistic path forward',
    narrative_function: 'advance_plot_momentum',
    keywords: ['journey', 'optimism', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'conflict',
    grammar_id: 'GRA-determination-return',
    daily_life_anchor: ['street_crossing', 'school_walk'],
    scene_purpose: 'Converging paths force rival alignment under pressure',
    narrative_function: 'escalate_relational_tension',
    keywords: ['conflict', 'resolve', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'sacrifice',
    grammar_id: 'GRA-resolve-sacrifice',
    daily_life_anchor: ['doorway_pause', 'laundry'],
    scene_purpose: 'Ordinary chore interrupted by resolve to leave for duty',
    narrative_function: 'commit_to_costly_choice',
    keywords: ['sacrifice', 'resolve', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'healing',
    grammar_id: 'GRA-care-healing',
    daily_life_anchor: ['tea_drinking', 'pet_care'],
    scene_purpose: 'Small care gesture in rain begins emotional healing',
    narrative_function: 'restore_vulnerability_balance',
    keywords: ['healing', 'care', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'forgiveness',
    grammar_id: 'GRA-connection-recovery',
    daily_life_anchor: ['market_visit', 'music_listening'],
    scene_purpose: 'Shared public moment reopens trust after withdrawal',
    narrative_function: 'repair_relational_fracture',
    keywords: ['forgiveness', 'connection', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'reunion',
    grammar_id: 'GRA-reunion-after-loss',
    daily_life_anchor: ['station_waiting', 'shore_walking'],
    scene_purpose: 'Arrival point transforms waiting into reunion contact',
    narrative_function: 'resolve_absence_arc',
    keywords: ['reunion', 'connection', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'departure',
    grammar_id: 'GRA-farewell-lost-love',
    daily_life_anchor: ['bus_waiting', 'rooftop_visit'],
    scene_purpose: 'Elevated farewell view frames bittersweet departure',
    narrative_function: 'close_chapter_with_parting',
    keywords: ['departure', 'parting', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'growth',
    grammar_id: 'GRA-protection-student',
    daily_life_anchor: ['school_walk', 'cooking'],
    scene_purpose: 'Mentor guidance during daily practice enables growth',
    narrative_function: 'develop_character_capacity',
    keywords: ['growth', 'care', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'redemption',
    grammar_id: 'GRA-reunion-redemption',
    daily_life_anchor: ['flower_watering', 'star_gazing'],
    scene_purpose: 'Quiet nightly ritual precedes redemptive reunion',
    narrative_function: 'restore_moral_emotional_balance',
    keywords: ['redemption', 'connection', 'daily-life', 'anchor'],
  }),
  buildBeatFromGrammar({
    beat_type: 'new_beginning',
    grammar_id: 'GRA-protection-child',
    daily_life_anchor: ['morning_routine', 'flower_watering'],
    scene_purpose: 'Guardian morning routine opens protective new chapter',
    narrative_function: 'reset_narrative_cycle',
    keywords: ['new-beginning', 'care', 'daily-life', 'anchor'],
  }),
];

export function getGonagiGrammarUnit(grammarId: SeedGrammarId) {
  return getGonagiGrammarSeedLibrary().find((unit) => unit.grammar_id === grammarId);
}

export function getNarrativeBeatSeedLibrary(): NarrativeBeatEntry[] {
  return NARRATIVE_BEAT_SEED_LIBRARY.map((entry) => ({
    ...entry,
    daily_life_anchor: [...entry.daily_life_anchor],
    camera_affinity: [...entry.camera_affinity],
    music_affinity: [...entry.music_affinity],
    transition_affinity: [...entry.transition_affinity],
    keywords: [...entry.keywords],
  }));
}

export function buildNarrativeBeatPreview(): NarrativeBeatPreview {
  return {
    beat_version: NARRATIVE_BEAT_VERSION,
    seed_count: NARRATIVE_BEAT_SEED_COUNT,
    seed_beat_types: [...SEED_BEAT_TYPES],
    daily_life_anchors: [...DAILY_LIFE_ANCHORS],
    required_fields: [...REQUIRED_NARRATIVE_BEAT_FIELDS],
    linked_layers: {
      emotion_dna_ids: [...SEED_EMOTION_DNA_IDS],
      gonagi_grammar_ids: [...SEED_GRAMMAR_IDS],
      relationship_dna_ids: [...SEED_RELATIONSHIP_DNA_IDS],
    },
    seed_narrative_beats: getNarrativeBeatSeedLibrary(),
  };
}

export function findDuplicateBeatIds(beatIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of beatIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function findDuplicateBeatTypes(beatTypes: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const type of beatTypes) {
    if (seen.has(type)) duplicates.add(type);
    seen.add(type);
  }

  return [...duplicates].sort();
}

export function isValidBeatType(value: string): value is SeedBeatType {
  return (SEED_BEAT_TYPES as readonly string[]).includes(value);
}

export function isValidDailyLifeAnchor(value: string): value is DailyLifeAnchor {
  return (DAILY_LIFE_ANCHORS as readonly string[]).includes(value);
}

export function isValidEmotionReference(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

export function isValidGrammarReference(value: string): value is SeedGrammarId {
  return (SEED_GRAMMAR_IDS as readonly string[]).includes(value);
}

export function isValidRelationshipReference(value: string): value is SeedRelationshipDnaId {
  return (SEED_RELATIONSHIP_DNA_IDS as readonly string[]).includes(value);
}
