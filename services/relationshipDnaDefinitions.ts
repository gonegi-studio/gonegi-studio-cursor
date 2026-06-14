import {
  SEED_BEHAVIOR_DNA_IDS,
  type SeedBehaviorDnaId,
} from './behaviorDnaDefinitions.js';
import {
  BEHAVIOR_EMOTION_LINKAGE,
  SEED_EMOTION_DNA_IDS,
  type SeedEmotionDnaId,
} from './emotionDnaDefinitions.js';

export const RELATIONSHIP_DNA_SCHEMA_VERSION =
  'RELATIONSHIP-DNA-SCHEMA-PHASE-78C-v1' as const;
export const RELATIONSHIP_DNA_SCHEMA_PATH = 'schemas/relationshipDna.schema.json' as const;
export const RELATIONSHIP_DNA_SEED_COUNT = 8 as const;

export const RELATIONSHIP_DNA_TENSION_MIN = 1 as const;
export const RELATIONSHIP_DNA_TENSION_MAX = 5 as const;
export const RELATIONSHIP_DNA_TRUST_MIN = 1 as const;
export const RELATIONSHIP_DNA_TRUST_MAX = 5 as const;

export const REQUIRED_RELATIONSHIP_DNA_FIELDS = [
  'relationship_id',
  'relationship_name',
  'relationship_type',
  'emotional_core',
  'tension_level',
  'trust_level',
  'primary_emotions',
  'primary_behaviors',
  'distance_pattern',
  'gaze_pattern',
  'touch_pattern',
  'dialogue_pattern',
  'conflict_pattern',
  'resolution_pattern',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
  'keywords',
] as const;

export type RequiredRelationshipDnaField = (typeof REQUIRED_RELATIONSHIP_DNA_FIELDS)[number];

export const RELATIONSHIP_DNA_PATTERN_FIELDS = [
  'distance_pattern',
  'gaze_pattern',
  'touch_pattern',
  'dialogue_pattern',
  'conflict_pattern',
  'resolution_pattern',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
] as const;

export type RelationshipDnaPatternField = (typeof RELATIONSHIP_DNA_PATTERN_FIELDS)[number];

export const SEED_RELATIONSHIP_DNA_IDS = [
  'guardian_child',
  'lost_lovers',
  'silent_friends',
  'rival_to_ally',
  'family_separation',
  'mentor_student',
  'stranger_kindness',
  'reunion_after_loss',
] as const;

export type SeedRelationshipDnaId = (typeof SEED_RELATIONSHIP_DNA_IDS)[number];

export interface RelationshipDnaEntry {
  relationship_id: SeedRelationshipDnaId;
  relationship_name: string;
  relationship_type: string;
  emotional_core: string;
  tension_level: number;
  trust_level: number;
  primary_emotions: SeedEmotionDnaId[];
  primary_behaviors: SeedBehaviorDnaId[];
  distance_pattern: string[];
  gaze_pattern: string[];
  touch_pattern: string[];
  dialogue_pattern: string[];
  conflict_pattern: string[];
  resolution_pattern: string[];
  camera_affinity: string[];
  music_affinity: string[];
  transition_affinity: string[];
  keywords: string[];
}

export interface RelationshipDnaSchemaPreview {
  schema_version: typeof RELATIONSHIP_DNA_SCHEMA_VERSION;
  schema_path: typeof RELATIONSHIP_DNA_SCHEMA_PATH;
  seed_count: typeof RELATIONSHIP_DNA_SEED_COUNT;
  required_fields: RequiredRelationshipDnaField[];
  tension_range: {
    min: typeof RELATIONSHIP_DNA_TENSION_MIN;
    max: typeof RELATIONSHIP_DNA_TENSION_MAX;
  };
  trust_range: {
    min: typeof RELATIONSHIP_DNA_TRUST_MIN;
    max: typeof RELATIONSHIP_DNA_TRUST_MAX;
  };
  seed_relationships: RelationshipDnaEntry[];
}

const RELATIONSHIP_DNA_SEED_LIBRARY: RelationshipDnaEntry[] = [
  {
    relationship_id: 'guardian_child',
    relationship_name: 'Guardian and Child',
    relationship_type: 'familial',
    emotional_core: 'protective care anchored in hopeful waiting',
    tension_level: 2,
    trust_level: 5,
    primary_emotions: ['care', 'anticipation'],
    primary_behaviors: ['protection', 'waiting'],
    distance_pattern: ['close protective proximity', 'guiding half-step behind', 'shelter positioning'],
    gaze_pattern: ['guardian scan to child check', 'soft downward reassurance look', 'shared horizon glance'],
    touch_pattern: ['hand on shoulder guide', 'hair comfort touch', 'shielding arm'],
    dialogue_pattern: ['gentle reassurance lines', 'instruction wrapped in warmth', 'quiet safety affirmations'],
    conflict_pattern: ['external threat escalation', 'child fear spike', 'guardian overprotective tension'],
    resolution_pattern: ['safety restored hold', 'promise of presence', 'shared breath calm'],
    camera_affinity: ['over-shoulder guardian frame', 'two-shot shelter composition', 'low protective angle'],
    music_affinity: ['warm low strings', 'protective motif', 'gentle pulse under 80 bpm'],
    transition_affinity: ['separation_to_reunion', 'silence_to_confession'],
    keywords: ['guardian', 'child', 'familial', 'protection'],
  },
  {
    relationship_id: 'lost_lovers',
    relationship_name: 'Lost Lovers',
    relationship_type: 'romantic',
    emotional_core: 'parting ache sustained by enduring connection memory',
    tension_level: 4,
    trust_level: 3,
    primary_emotions: ['parting', 'connection'],
    primary_behaviors: ['farewell', 'reunion'],
    distance_pattern: ['widening departure gap', 'magnetic closing distance', 'held separation threshold'],
    gaze_pattern: ['lingering backward look', 'recognition lock', 'tear-edge shared gaze'],
    touch_pattern: ['reluctant hand release', 'embrace reconnection', 'hand on heart gesture'],
    dialogue_pattern: ['unfinished farewell words', 'promise of return', 'whispered reunion relief'],
    conflict_pattern: ['separation trigger', 'misread distance as rejection', 'timing missed encounter'],
    resolution_pattern: ['reunion embrace hold', 'forgiven absence', 'renewed vow exchange'],
    camera_affinity: ['pull-back widening frame', 'two-shot reunion frame', 'silhouette departure hold'],
    music_affinity: ['fading motif reprise', 'swelling strings', 'minor to major lift'],
    transition_affinity: ['separation_to_reunion', 'sunset_to_night'],
    keywords: ['lovers', 'romantic', 'parting', 'reunion'],
  },
  {
    relationship_id: 'silent_friends',
    relationship_name: 'Silent Friends',
    relationship_type: 'platonic',
    emotional_core: 'quiet isolation bridged by unspoken connection',
    tension_level: 2,
    trust_level: 4,
    primary_emotions: ['isolation', 'connection', 'uncertainty'],
    primary_behaviors: ['loneliness', 'hesitation'],
    distance_pattern: ['parallel walk spacing', 'gradual side-by-side close', 'comfortable quiet gap'],
    gaze_pattern: ['averted companion glance', 'brief shared look', 'side-eye understanding'],
    touch_pattern: ['minimal contact', 'offered sleeve touch', 'shared object pass'],
    dialogue_pattern: ['sparse meaningful lines', 'comfortable silence beats', 'indirect emotional admission'],
    conflict_pattern: ['unspoken misunderstanding', 'withdrawal after slight', 'avoidance loop'],
    resolution_pattern: ['silent reconciliation walk', 'shared activity resume', 'small gesture repair'],
    camera_affinity: ['negative space framing', 'two-shot quiet hold', 'side-by-side tracking'],
    music_affinity: ['solo piano sparse', 'ambient room tone', 'gentle motif return'],
    transition_affinity: ['silence_to_confession', 'rain_to_clear'],
    keywords: ['friends', 'platonic', 'silence', 'connection'],
  },
  {
    relationship_id: 'rival_to_ally',
    relationship_name: 'Rival to Ally',
    relationship_type: 'adversarial',
    emotional_core: 'uncertainty transforms into shared resolve',
    tension_level: 4,
    trust_level: 2,
    primary_emotions: ['uncertainty', 'resolve'],
    primary_behaviors: ['hesitation', 'determination'],
    distance_pattern: ['confrontational spacing', 'circling opposition', 'shoulder-to-shoulder alignment'],
    gaze_pattern: ['challenge stare down', 'evaluative side glance', 'mutual respect lock'],
    touch_pattern: ['no contact rivalry', 'reluctant handshake', 'back slap alliance'],
    dialogue_pattern: ['sharp competitive exchange', 'grudging admission', 'shared goal declaration'],
    conflict_pattern: ['skill rivalry escalation', 'pride clash', 'external threat forcing unity'],
    resolution_pattern: ['combined action sync', 'acknowledged equal footing', 'trust earned through crisis'],
    camera_affinity: ['face-off symmetrical frame', 'hero dual medium-low', 'locked axis tracking'],
    music_affinity: ['driving percussion duel', 'ostinato merge', 'unified tempo lock'],
    transition_affinity: ['hope_to_sadness', 'walking_to_running'],
    keywords: ['rival', 'ally', 'adversarial', 'resolve'],
  },
  {
    relationship_id: 'family_separation',
    relationship_name: 'Family Separation',
    relationship_type: 'familial',
    emotional_core: 'parting grief deepened by familial isolation',
    tension_level: 5,
    trust_level: 4,
    primary_emotions: ['parting', 'isolation'],
    primary_behaviors: ['farewell', 'loneliness'],
    distance_pattern: ['threshold departure gap', 'empty seat distance', 'return path longing'],
    gaze_pattern: ['doorway backward look', 'empty middle distance', 'family photo gaze'],
    touch_pattern: ['final embrace', 'hand slip release', 'self-wrap solitude'],
    dialogue_pattern: ['departure instructions', 'unspoken regret lines', 'voice message playback'],
    conflict_pattern: ['duty versus bond tension', 'geographic separation trigger', 'missed farewell moment'],
    resolution_pattern: ['letter or call reconnection', 'return visit planning', 'memory ritual comfort'],
    camera_affinity: ['doorway frame separation', 'wide isolation hold', 'pull-back family tableau'],
    music_affinity: ['solo cello line', 'fading motif reprise', 'minor key drift'],
    transition_affinity: ['sunset_to_night', 'separation_to_reunion'],
    keywords: ['family', 'separation', 'parting', 'isolation'],
  },
  {
    relationship_id: 'mentor_student',
    relationship_name: 'Mentor and Student',
    relationship_type: 'instructional',
    emotional_core: 'careful guidance nurturing optimistic growth',
    tension_level: 2,
    trust_level: 4,
    primary_emotions: ['care', 'optimism'],
    primary_behaviors: ['protection', 'hope'],
    distance_pattern: ['slightly forward mentor lead', 'student follow half-step', 'shared practice proximity'],
    gaze_pattern: ['evaluative mentor look', 'student upward attentive gaze', 'shared focus on task'],
    touch_pattern: ['corrective hand guide', 'encouraging shoulder tap', 'demonstration hand-over-hand'],
    dialogue_pattern: ['instructional cadence', 'question and insight exchange', 'encouragement after failure'],
    conflict_pattern: ['student self-doubt spike', 'mentor impatience flash', 'skill plateau frustration'],
    resolution_pattern: ['breakthrough acknowledgment', 'renewed practice vow', 'shared success moment'],
    camera_affinity: ['over-shoulder instruction frame', 'low angle student lift', 'two-shot practice hold'],
    music_affinity: ['rising arpeggio', 'warm low strings', 'motif return on breakthrough'],
    transition_affinity: ['sadness_to_hope', 'silence_to_confession'],
    keywords: ['mentor', 'student', 'instructional', 'growth'],
  },
  {
    relationship_id: 'stranger_kindness',
    relationship_name: 'Stranger Kindness',
    relationship_type: 'transient',
    emotional_core: 'unexpected care opening brief connection',
    tension_level: 1,
    trust_level: 2,
    primary_emotions: ['care', 'connection'],
    primary_behaviors: ['protection', 'reunion'],
    distance_pattern: ['initial stranger gap', 'closing help distance', 'parting with warmth'],
    gaze_pattern: ['cautious first look', 'grateful recognition', 'brief farewell nod'],
    touch_pattern: ['offered hand help', 'shared umbrella proximity', 'small gift pass'],
    dialogue_pattern: ['minimal kind exchange', 'gratitude statement', 'no-name parting blessing'],
    conflict_pattern: ['suspicion initial barrier', 'social hesitation', 'misread intent moment'],
    resolution_pattern: ['trust earned quickly', 'kind act completion', 'warm anonymous departure'],
    camera_affinity: ['street-level encounter frame', 'medium two-shot kindness', 'soft background bokeh'],
    music_affinity: ['gentle piano motif', 'warm string pad', 'brief major lift'],
    transition_affinity: ['rain_to_clear', 'separation_to_reunion'],
    keywords: ['stranger', 'kindness', 'transient', 'connection'],
  },
  {
    relationship_id: 'reunion_after_loss',
    relationship_name: 'Reunion After Loss',
    relationship_type: 'bond_recovery',
    emotional_core: 'connection restored through hopeful return',
    tension_level: 3,
    trust_level: 4,
    primary_emotions: ['connection', 'optimism'],
    primary_behaviors: ['reunion', 'hope'],
    distance_pattern: ['recognition distance collapse', 'careful re-approach', 'sustained close proximity'],
    gaze_pattern: ['disbelief recognition look', 'tearful direct gaze', 'shared future horizon look'],
    touch_pattern: ['tentative reach', 'full embrace hold', 'hand clasp anchor'],
    dialogue_pattern: ['name call disbelief', 'apology and forgiveness exchange', 'renewed promise lines'],
    conflict_pattern: ['grief residue tension', 'fear of repeat loss', 'unspoken absence hurt'],
    resolution_pattern: ['forgiveness embrace', 'shared ritual renewal', 'forward-looking vow'],
    camera_affinity: ['tracking convergence', 'two-shot reunion frame', 'golden hour key lift'],
    music_affinity: ['swelling strings', 'major resolution chord', 'motif return'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    keywords: ['reunion', 'loss', 'recovery', 'hope'],
  },
];

export function getRelationshipDnaSeedLibrary(): RelationshipDnaEntry[] {
  return RELATIONSHIP_DNA_SEED_LIBRARY.map((entry) => ({
    ...entry,
    primary_emotions: [...entry.primary_emotions],
    primary_behaviors: [...entry.primary_behaviors],
    distance_pattern: [...entry.distance_pattern],
    gaze_pattern: [...entry.gaze_pattern],
    touch_pattern: [...entry.touch_pattern],
    dialogue_pattern: [...entry.dialogue_pattern],
    conflict_pattern: [...entry.conflict_pattern],
    resolution_pattern: [...entry.resolution_pattern],
    camera_affinity: [...entry.camera_affinity],
    music_affinity: [...entry.music_affinity],
    transition_affinity: [...entry.transition_affinity],
    keywords: [...entry.keywords],
  }));
}

export function buildRelationshipDnaSchemaPreview(): RelationshipDnaSchemaPreview {
  return {
    schema_version: RELATIONSHIP_DNA_SCHEMA_VERSION,
    schema_path: RELATIONSHIP_DNA_SCHEMA_PATH,
    seed_count: RELATIONSHIP_DNA_SEED_COUNT,
    required_fields: [...REQUIRED_RELATIONSHIP_DNA_FIELDS],
    tension_range: {
      min: RELATIONSHIP_DNA_TENSION_MIN,
      max: RELATIONSHIP_DNA_TENSION_MAX,
    },
    trust_range: {
      min: RELATIONSHIP_DNA_TRUST_MIN,
      max: RELATIONSHIP_DNA_TRUST_MAX,
    },
    seed_relationships: getRelationshipDnaSeedLibrary(),
  };
}

export function findDuplicateRelationshipIds(relationshipIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of relationshipIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidRelationshipId(value: string): value is SeedRelationshipDnaId {
  return (SEED_RELATIONSHIP_DNA_IDS as readonly string[]).includes(value);
}

export function isValidRelationshipKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidRelationshipTaxonomyToken(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value);
}

export function isValidPrimaryEmotionId(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

export function isValidPrimaryBehaviorId(value: string): value is SeedBehaviorDnaId {
  return (SEED_BEHAVIOR_DNA_IDS as readonly string[]).includes(value);
}

export function getLinkedEmotionForBehavior(behaviorId: SeedBehaviorDnaId): SeedEmotionDnaId {
  return BEHAVIOR_EMOTION_LINKAGE[behaviorId];
}

export { BEHAVIOR_EMOTION_LINKAGE, SEED_BEHAVIOR_DNA_IDS, SEED_EMOTION_DNA_IDS };
