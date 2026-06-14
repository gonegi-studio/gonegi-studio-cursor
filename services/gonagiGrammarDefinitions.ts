import { SEED_BEHAVIOR_DNA_IDS, type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import {
  BEHAVIOR_EMOTION_LINKAGE,
  SEED_EMOTION_DNA_IDS,
  type SeedEmotionDnaId,
} from './emotionDnaDefinitions.js';
import {
  SEED_RELATIONSHIP_DNA_IDS,
  type SeedRelationshipDnaId,
} from './relationshipDnaDefinitions.js';

export const GONAGI_GRAMMAR_VERSION = 'GONAGI-GRAMMAR-PHASE-79-v1' as const;
export const GONAGI_GRAMMAR_SEED_COUNT = 16 as const;

export const REQUIRED_GRAMMAR_UNIT_FIELDS = [
  'grammar_id',
  'behavior_id',
  'emotion_id',
  'relationship_id',
  'scene_purpose',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
  'keywords',
] as const;

export type RequiredGrammarUnitField = (typeof REQUIRED_GRAMMAR_UNIT_FIELDS)[number];

export const SEED_GRAMMAR_IDS = [
  'GRA-waiting-guardian',
  'GRA-waiting-lost-love',
  'GRA-hesitation-friendship',
  'GRA-farewell-lost-love',
  'GRA-reunion-after-loss',
  'GRA-protection-child',
  'GRA-protection-student',
  'GRA-hope-reunion',
  'GRA-loneliness-distance',
  'GRA-determination-return',
  'GRA-care-healing',
  'GRA-connection-recovery',
  'GRA-parting-separation',
  'GRA-optimism-new-journey',
  'GRA-resolve-sacrifice',
  'GRA-reunion-redemption',
] as const;

export type SeedGrammarId = (typeof SEED_GRAMMAR_IDS)[number];

export interface GonagiGrammarUnit {
  grammar_id: SeedGrammarId;
  behavior_id: SeedBehaviorDnaId;
  emotion_id: SeedEmotionDnaId;
  relationship_id: SeedRelationshipDnaId;
  scene_purpose: string;
  camera_affinity: string[];
  music_affinity: string[];
  transition_affinity: string[];
  keywords: string[];
}

export interface GonagiGrammarPreview {
  grammar_version: typeof GONAGI_GRAMMAR_VERSION;
  seed_count: typeof GONAGI_GRAMMAR_SEED_COUNT;
  required_fields: RequiredGrammarUnitField[];
  linked_layers: {
    behavior_dna_ids: typeof SEED_BEHAVIOR_DNA_IDS;
    emotion_dna_ids: typeof SEED_EMOTION_DNA_IDS;
    relationship_dna_ids: typeof SEED_RELATIONSHIP_DNA_IDS;
  };
  seed_grammar_units: GonagiGrammarUnit[];
}

const GONAGI_GRAMMAR_SEED_LIBRARY: GonagiGrammarUnit[] = [
  {
    grammar_id: 'GRA-waiting-guardian',
    behavior_id: 'waiting',
    emotion_id: 'anticipation',
    relationship_id: 'guardian_child',
    scene_purpose: 'Guardian holds protective watch while child waits for safe return',
    camera_affinity: ['over-shoulder guardian frame', 'medium-wide hold', 'slow push-in optional'],
    music_affinity: ['sparse piano motif', 'warm low strings', 'gentle pulse under 80 bpm'],
    transition_affinity: ['silence_to_confession', 'sunset_to_night'],
    keywords: ['waiting', 'guardian', 'anticipation', 'safety'],
  },
  {
    grammar_id: 'GRA-waiting-lost-love',
    behavior_id: 'waiting',
    emotion_id: 'anticipation',
    relationship_id: 'lost_lovers',
    scene_purpose: 'Lover waits at a familiar place hoping for reunion',
    camera_affinity: ['static frame patience', 'negative space framing', 'slow push-in optional'],
    music_affinity: ['suspended harmony', 'sparse piano motif', 'fading motif reprise'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    keywords: ['waiting', 'lost-love', 'anticipation', 'reunion-hope'],
  },
  {
    grammar_id: 'GRA-hesitation-friendship',
    behavior_id: 'hesitation',
    emotion_id: 'uncertainty',
    relationship_id: 'silent_friends',
    scene_purpose: 'Friends pause before voicing an unspoken feeling',
    camera_affinity: ['over-shoulder doubt frame', 'two-shot quiet hold', 'side-by-side tracking'],
    music_affinity: ['syncopated pause', 'solo piano sparse', 'held string note'],
    transition_affinity: ['silence_to_confession', 'hope_to_sadness'],
    keywords: ['hesitation', 'friendship', 'uncertainty', 'silence'],
  },
  {
    grammar_id: 'GRA-farewell-lost-love',
    behavior_id: 'farewell',
    emotion_id: 'parting',
    relationship_id: 'lost_lovers',
    scene_purpose: 'Lovers part with promise that connection will endure',
    camera_affinity: ['pull-back widening frame', 'silhouette departure', 'two-shot reunion frame'],
    music_affinity: ['fading motif reprise', 'minor resolution', 'swelling strings'],
    transition_affinity: ['separation_to_reunion', 'sunset_to_night'],
    keywords: ['farewell', 'lost-love', 'parting', 'departure'],
  },
  {
    grammar_id: 'GRA-reunion-after-loss',
    behavior_id: 'reunion',
    emotion_id: 'connection',
    relationship_id: 'reunion_after_loss',
    scene_purpose: 'Bond is restored after grief through recognition and embrace',
    camera_affinity: ['tracking convergence', 'two-shot reunion frame', 'golden hour key lift'],
    music_affinity: ['swelling strings', 'major resolution chord', 'motif return'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    keywords: ['reunion', 'loss', 'connection', 'recovery'],
  },
  {
    grammar_id: 'GRA-protection-child',
    behavior_id: 'protection',
    emotion_id: 'care',
    relationship_id: 'guardian_child',
    scene_purpose: 'Guardian shields child from immediate threat',
    camera_affinity: ['over-shoulder guardian frame', 'two-shot shelter composition', 'low protective angle'],
    music_affinity: ['warm low strings', 'protective motif', 'steady heartbeat pulse'],
    transition_affinity: ['separation_to_reunion', 'silence_to_confession'],
    keywords: ['protection', 'child', 'care', 'guardian'],
  },
  {
    grammar_id: 'GRA-protection-student',
    behavior_id: 'protection',
    emotion_id: 'care',
    relationship_id: 'mentor_student',
    scene_purpose: 'Mentor intervenes to protect student during failure or danger',
    camera_affinity: ['over-shoulder instruction frame', 'two-shot practice hold', 'low protective angle'],
    music_affinity: ['warm low strings', 'rising arpeggio', 'protective motif'],
    transition_affinity: ['sadness_to_hope', 'silence_to_confession'],
    keywords: ['protection', 'student', 'care', 'mentor'],
  },
  {
    grammar_id: 'GRA-hope-reunion',
    behavior_id: 'hope',
    emotion_id: 'optimism',
    relationship_id: 'reunion_after_loss',
    scene_purpose: 'Hopeful reunion beat after shared loss opens forward path',
    camera_affinity: ['golden hour key lift', 'forward tracking optimism', 'two-shot reunion frame'],
    music_affinity: ['major lift motif', 'rising arpeggio', 'motif return'],
    transition_affinity: ['sadness_to_hope', 'separation_to_reunion'],
    keywords: ['hope', 'reunion', 'optimism', 'renewal'],
  },
  {
    grammar_id: 'GRA-loneliness-distance',
    behavior_id: 'loneliness',
    emotion_id: 'isolation',
    relationship_id: 'family_separation',
    scene_purpose: 'Family member feels isolation after geographic separation',
    camera_affinity: ['wide isolation hold', 'negative space framing', 'doorway frame separation'],
    music_affinity: ['solo cello line', 'minor key drift', 'reverb tail loneliness'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    keywords: ['loneliness', 'distance', 'isolation', 'separation'],
  },
  {
    grammar_id: 'GRA-determination-return',
    behavior_id: 'determination',
    emotion_id: 'resolve',
    relationship_id: 'rival_to_ally',
    scene_purpose: 'Rival commits to return as ally through shared resolve',
    camera_affinity: ['hero medium-low angle', 'face-off symmetrical frame', 'locked axis tracking'],
    music_affinity: ['driving percussion', 'ostinato build', 'unified tempo lock'],
    transition_affinity: ['walking_to_running', 'hope_to_sadness'],
    keywords: ['determination', 'return', 'resolve', 'ally'],
  },
  {
    grammar_id: 'GRA-care-healing',
    behavior_id: 'protection',
    emotion_id: 'care',
    relationship_id: 'stranger_kindness',
    scene_purpose: 'Stranger offers protective care that begins emotional healing',
    camera_affinity: ['street-level encounter frame', 'medium two-shot kindness', 'soft background bokeh'],
    music_affinity: ['gentle piano motif', 'warm string pad', 'brief major lift'],
    transition_affinity: ['rain_to_clear', 'separation_to_reunion'],
    keywords: ['care', 'healing', 'kindness', 'protection'],
  },
  {
    grammar_id: 'GRA-connection-recovery',
    behavior_id: 'reunion',
    emotion_id: 'connection',
    relationship_id: 'stranger_kindness',
    scene_purpose: 'Brief connection with a stranger restores capacity for trust',
    camera_affinity: ['medium two-shot kindness', 'tracking convergence', 'soft background bokeh'],
    music_affinity: ['brief major lift', 'gentle piano motif', 'warm string pad'],
    transition_affinity: ['rain_to_clear', 'separation_to_reunion'],
    keywords: ['connection', 'recovery', 'kindness', 'trust'],
  },
  {
    grammar_id: 'GRA-parting-separation',
    behavior_id: 'farewell',
    emotion_id: 'parting',
    relationship_id: 'family_separation',
    scene_purpose: 'Family farewell at threshold marks painful separation',
    camera_affinity: ['doorway frame separation', 'pull-back family tableau', 'silhouette departure'],
    music_affinity: ['fading motif reprise', 'solo cello line', 'minor key drift'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    keywords: ['parting', 'separation', 'family', 'farewell'],
  },
  {
    grammar_id: 'GRA-optimism-new-journey',
    behavior_id: 'hope',
    emotion_id: 'optimism',
    relationship_id: 'mentor_student',
    scene_purpose: 'Mentor and student step toward new journey with shared optimism',
    camera_affinity: ['low angle student lift', 'forward tracking optimism', 'golden hour key'],
    music_affinity: ['rising arpeggio', 'major lift motif', 'motif return on breakthrough'],
    transition_affinity: ['sadness_to_hope', 'walking_to_running'],
    keywords: ['optimism', 'journey', 'hope', 'mentor'],
  },
  {
    grammar_id: 'GRA-resolve-sacrifice',
    behavior_id: 'determination',
    emotion_id: 'resolve',
    relationship_id: 'family_separation',
    scene_purpose: 'Character resolves to leave family for necessary sacrifice',
    camera_affinity: ['hero medium-low angle', 'doorway frame separation', 'push-in resolve'],
    music_affinity: ['driving percussion', 'ostinato build', 'minor resolution'],
    transition_affinity: ['hope_to_sadness', 'sunset_to_night'],
    keywords: ['resolve', 'sacrifice', 'determination', 'departure'],
  },
  {
    grammar_id: 'GRA-reunion-redemption',
    behavior_id: 'reunion',
    emotion_id: 'connection',
    relationship_id: 'lost_lovers',
    scene_purpose: 'Lost lovers reunite with redemptive forgiveness',
    camera_affinity: ['two-shot reunion frame', 'tracking convergence', 'medium hold on contact'],
    music_affinity: ['swelling strings', 'major resolution chord', 'minor to major lift'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    keywords: ['reunion', 'redemption', 'connection', 'forgiveness'],
  },
];

export function getGonagiGrammarSeedLibrary(): GonagiGrammarUnit[] {
  return GONAGI_GRAMMAR_SEED_LIBRARY.map((unit) => ({
    ...unit,
    camera_affinity: [...unit.camera_affinity],
    music_affinity: [...unit.music_affinity],
    transition_affinity: [...unit.transition_affinity],
    keywords: [...unit.keywords],
  }));
}

export function buildGonagiGrammarPreview(): GonagiGrammarPreview {
  return {
    grammar_version: GONAGI_GRAMMAR_VERSION,
    seed_count: GONAGI_GRAMMAR_SEED_COUNT,
    required_fields: [...REQUIRED_GRAMMAR_UNIT_FIELDS],
    linked_layers: {
      behavior_dna_ids: [...SEED_BEHAVIOR_DNA_IDS],
      emotion_dna_ids: [...SEED_EMOTION_DNA_IDS],
      relationship_dna_ids: [...SEED_RELATIONSHIP_DNA_IDS],
    },
    seed_grammar_units: getGonagiGrammarSeedLibrary(),
  };
}

export function findDuplicateGrammarIds(grammarIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of grammarIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidGrammarId(value: string): value is SeedGrammarId {
  return (SEED_GRAMMAR_IDS as readonly string[]).includes(value);
}

export function isValidGrammarKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidBehaviorReference(value: string): value is SeedBehaviorDnaId {
  return (SEED_BEHAVIOR_DNA_IDS as readonly string[]).includes(value);
}

export function isValidEmotionReference(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

export function isValidRelationshipReference(value: string): value is SeedRelationshipDnaId {
  return (SEED_RELATIONSHIP_DNA_IDS as readonly string[]).includes(value);
}

export function behaviorEmotionLinkageMatches(
  behaviorId: SeedBehaviorDnaId,
  emotionId: SeedEmotionDnaId
): boolean {
  return BEHAVIOR_EMOTION_LINKAGE[behaviorId] === emotionId;
}
