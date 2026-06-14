import {
  BEHAVIOR_DNA_EMOTION_ROOTS,
  BEHAVIOR_DNA_INTENSITY_MAX,
  BEHAVIOR_DNA_INTENSITY_MIN,
  SEED_BEHAVIOR_DNA_IDS,
  type BehaviorDnaEmotionRoot,
  type SeedBehaviorDnaId,
} from './behaviorDnaDefinitions.js';

export const EMOTION_DNA_SCHEMA_VERSION = 'EMOTION-DNA-SCHEMA-PHASE-78B-v1' as const;
export const EMOTION_DNA_SCHEMA_PATH = 'schemas/emotionDna.schema.json' as const;
export const EMOTION_DNA_SEED_COUNT = 8 as const;

export const REQUIRED_EMOTION_DNA_FIELDS = [
  'emotion_id',
  'emotion_name',
  'emotion_family',
  'emotional_temperature',
  'emotional_direction',
  'internal_state',
  'external_expression',
  'behavior_affinity',
  'relationship_affinity',
  'music_affinity',
  'camera_affinity',
  'transition_affinity',
  'intensity_range',
  'keywords',
] as const;

export type RequiredEmotionDnaField = (typeof REQUIRED_EMOTION_DNA_FIELDS)[number];

export const EMOTION_DNA_STRING_ARRAY_FIELDS = [
  'internal_state',
  'external_expression',
  'behavior_affinity',
  'relationship_affinity',
  'music_affinity',
  'camera_affinity',
  'transition_affinity',
] as const;

export type EmotionDnaStringArrayField = (typeof EMOTION_DNA_STRING_ARRAY_FIELDS)[number];

export const SEED_EMOTION_DNA_IDS = [...BEHAVIOR_DNA_EMOTION_ROOTS] as const;

export type SeedEmotionDnaId = (typeof SEED_EMOTION_DNA_IDS)[number];

export const BEHAVIOR_EMOTION_LINKAGE: Record<SeedBehaviorDnaId, SeedEmotionDnaId> = {
  waiting: 'anticipation',
  hesitation: 'uncertainty',
  loneliness: 'isolation',
  reunion: 'connection',
  hope: 'optimism',
  determination: 'resolve',
  protection: 'care',
  farewell: 'parting',
};

export interface EmotionDnaIntensityRange {
  min: number;
  max: number;
}

export interface EmotionDnaEntry {
  emotion_id: SeedEmotionDnaId;
  emotion_name: string;
  emotion_family: string;
  emotional_temperature: string;
  emotional_direction: string;
  internal_state: string[];
  external_expression: string[];
  behavior_affinity: SeedBehaviorDnaId[];
  relationship_affinity: string[];
  music_affinity: string[];
  camera_affinity: string[];
  transition_affinity: string[];
  intensity_range: EmotionDnaIntensityRange;
  keywords: string[];
}

export interface EmotionDnaSchemaPreview {
  schema_version: typeof EMOTION_DNA_SCHEMA_VERSION;
  schema_path: typeof EMOTION_DNA_SCHEMA_PATH;
  seed_count: typeof EMOTION_DNA_SEED_COUNT;
  required_fields: RequiredEmotionDnaField[];
  behavior_emotion_linkage: typeof BEHAVIOR_EMOTION_LINKAGE;
  intensity_range: {
    min: typeof BEHAVIOR_DNA_INTENSITY_MIN;
    max: typeof BEHAVIOR_DNA_INTENSITY_MAX;
  };
  seed_emotions: EmotionDnaEntry[];
}

const EMOTION_DNA_SEED_LIBRARY: EmotionDnaEntry[] = [
  {
    emotion_id: 'anticipation',
    emotion_name: 'Anticipation',
    emotion_family: 'prospective',
    emotional_temperature: 'neutral',
    emotional_direction: 'forward',
    internal_state: ['expectant focus', 'suspended readiness', 'future-oriented attention'],
    external_expression: ['held stillness', 'subtle lean', 'quiet alertness'],
    behavior_affinity: ['waiting'],
    relationship_affinity: ['pre-bond arrival', 'awaiting companion', 'solo expectancy'],
    music_affinity: ['suspended harmony', 'sparse piano motif', 'gentle pulse under 80 bpm'],
    camera_affinity: ['medium-wide hold', 'static frame patience', 'slow push-in optional'],
    transition_affinity: ['silence_to_confession', 'sunset_to_night'],
    intensity_range: { min: 1, max: 3 },
    keywords: ['anticipation', 'expectancy', 'waiting', 'prospective'],
  },
  {
    emotion_id: 'uncertainty',
    emotion_name: 'Uncertainty',
    emotion_family: 'volatile',
    emotional_temperature: 'cool',
    emotional_direction: 'inward',
    internal_state: ['cognitive pause', 'risk evaluation', 'unresolved choice'],
    external_expression: ['micro hesitation', 'averted focus', 'unfinished gesture'],
    behavior_affinity: ['hesitation'],
    relationship_affinity: ['trust threshold', 'confession pause', 'emotional risk'],
    music_affinity: ['syncopated pause', 'minor second tension', 'held string note'],
    camera_affinity: ['over-shoulder doubt frame', 'slight dutch unease', 'close-medium tension'],
    transition_affinity: ['hope_to_sadness', 'silence_to_confession'],
    intensity_range: { min: 2, max: 4 },
    keywords: ['uncertainty', 'doubt', 'hesitation', 'volatile'],
  },
  {
    emotion_id: 'isolation',
    emotion_name: 'Isolation',
    emotion_family: 'inward',
    emotional_temperature: 'cold',
    emotional_direction: 'inward',
    internal_state: ['emotional distance', 'self-contained ache', 'peripheral disconnection'],
    external_expression: ['reduced presence', 'downcast stillness', 'minimal engagement'],
    behavior_affinity: ['loneliness'],
    relationship_affinity: ['absence of companion', 'post-separation', 'crowd isolation'],
    music_affinity: ['solo cello line', 'reverb tail loneliness', 'minor key drift'],
    camera_affinity: ['negative space framing', 'wide isolation hold', 'back-follow solitude'],
    transition_affinity: ['sunset_to_night', 'rain_to_clear'],
    intensity_range: { min: 3, max: 5 },
    keywords: ['isolation', 'loneliness', 'solitude', 'inward'],
  },
  {
    emotion_id: 'connection',
    emotion_name: 'Connection',
    emotion_family: 'social',
    emotional_temperature: 'warm',
    emotional_direction: 'outward',
    internal_state: ['bond recognition', 'shared relief', 'relational warmth'],
    external_expression: ['open recognition', 'closing distance', 'shared gaze bloom'],
    behavior_affinity: ['reunion'],
    relationship_affinity: ['long separation resolve', 'companion return', 'bond reaffirmation'],
    music_affinity: ['swelling strings', 'major resolution chord', 'motif return'],
    camera_affinity: ['two-shot reunion frame', 'tracking convergence', 'medium hold on contact'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    intensity_range: { min: 3, max: 5 },
    keywords: ['connection', 'reunion', 'bond', 'social'],
  },
  {
    emotion_id: 'optimism',
    emotion_name: 'Optimism',
    emotion_family: 'aspirational',
    emotional_temperature: 'warm',
    emotional_direction: 'rising',
    internal_state: ['forward belief', 'renewed possibility', 'lightened resolve'],
    external_expression: ['brightened composure', 'open posture', 'gentle uplift'],
    behavior_affinity: ['hope'],
    relationship_affinity: ['shared future gaze', 'mentor support', 'renewed trust'],
    music_affinity: ['rising arpeggio', 'major lift motif', 'tempo brighten'],
    camera_affinity: ['low angle lift', 'golden hour key', 'forward tracking optimism'],
    transition_affinity: ['sadness_to_hope', 'rain_to_clear'],
    intensity_range: { min: 2, max: 4 },
    keywords: ['optimism', 'hope', 'renewal', 'aspirational'],
  },
  {
    emotion_id: 'resolve',
    emotion_name: 'Resolve',
    emotion_family: 'volitional',
    emotional_temperature: 'neutral',
    emotional_direction: 'forward',
    internal_state: ['committed intent', 'focused determination', 'decision lock'],
    external_expression: ['set composure', 'decisive bearing', 'unwavering focus'],
    behavior_affinity: ['determination'],
    relationship_affinity: ['protective vow', 'mission commit', 'self-promise'],
    music_affinity: ['driving percussion', 'ostinato build', 'tempo lock 100-120 bpm'],
    camera_affinity: ['hero medium-low angle', 'locked axis tracking', 'push-in resolve'],
    transition_affinity: ['walking_to_running', 'hope_to_sadness'],
    intensity_range: { min: 4, max: 5 },
    keywords: ['resolve', 'determination', 'commitment', 'volitional'],
  },
  {
    emotion_id: 'care',
    emotion_name: 'Care',
    emotion_family: 'protective',
    emotional_temperature: 'warm',
    emotional_direction: 'outward',
    internal_state: ['protective concern', 'guardian attentiveness', 'safety priority'],
    external_expression: ['shielding presence', 'reassuring steadiness', 'companion focus'],
    behavior_affinity: ['protection'],
    relationship_affinity: ['guardian role', 'vulnerable companion', 'safety priority'],
    music_affinity: ['warm low strings', 'protective motif', 'steady heartbeat pulse'],
    camera_affinity: ['over-shoulder guardian', 'two-shot shelter frame', 'slight foreground depth'],
    transition_affinity: ['separation_to_reunion', 'silence_to_confession'],
    intensity_range: { min: 3, max: 5 },
    keywords: ['care', 'protection', 'guardian', 'protective'],
  },
  {
    emotion_id: 'parting',
    emotion_name: 'Parting',
    emotion_family: 'closure',
    emotional_temperature: 'cool',
    emotional_direction: 'falling',
    internal_state: ['bittersweet release', 'departure ache', 'promise of return'],
    external_expression: ['lingering look', 'reluctant withdrawal', 'soft farewell gesture'],
    behavior_affinity: ['farewell'],
    relationship_affinity: ['departure bond', 'promise of return', 'bittersweet closure'],
    music_affinity: ['fading motif reprise', 'minor resolution', 'tempo deceleration'],
    camera_affinity: ['pull-back widening frame', 'silhouette departure', 'long hold on distance'],
    transition_affinity: ['separation_to_reunion', 'sunset_to_night'],
    intensity_range: { min: 3, max: 5 },
    keywords: ['parting', 'farewell', 'departure', 'closure'],
  },
];

export function getEmotionDnaSeedLibrary(): EmotionDnaEntry[] {
  return EMOTION_DNA_SEED_LIBRARY.map((entry) => ({
    ...entry,
    internal_state: [...entry.internal_state],
    external_expression: [...entry.external_expression],
    behavior_affinity: [...entry.behavior_affinity],
    relationship_affinity: [...entry.relationship_affinity],
    music_affinity: [...entry.music_affinity],
    camera_affinity: [...entry.camera_affinity],
    transition_affinity: [...entry.transition_affinity],
    keywords: [...entry.keywords],
    intensity_range: { ...entry.intensity_range },
  }));
}

export function buildEmotionDnaSchemaPreview(): EmotionDnaSchemaPreview {
  return {
    schema_version: EMOTION_DNA_SCHEMA_VERSION,
    schema_path: EMOTION_DNA_SCHEMA_PATH,
    seed_count: EMOTION_DNA_SEED_COUNT,
    required_fields: [...REQUIRED_EMOTION_DNA_FIELDS],
    behavior_emotion_linkage: { ...BEHAVIOR_EMOTION_LINKAGE },
    intensity_range: {
      min: BEHAVIOR_DNA_INTENSITY_MIN,
      max: BEHAVIOR_DNA_INTENSITY_MAX,
    },
    seed_emotions: getEmotionDnaSeedLibrary(),
  };
}

export function findDuplicateEmotionIds(emotionIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of emotionIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidEmotionId(value: string): value is SeedEmotionDnaId {
  return (SEED_EMOTION_DNA_IDS as readonly string[]).includes(value);
}

export function isValidEmotionKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidEmotionTaxonomyToken(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value);
}

export function isValidBehaviorAffinityId(value: string): value is SeedBehaviorDnaId {
  return (SEED_BEHAVIOR_DNA_IDS as readonly string[]).includes(value);
}

export function getExpectedBehaviorForEmotion(emotionId: SeedEmotionDnaId): SeedBehaviorDnaId {
  for (const [behaviorId, linkedEmotionId] of Object.entries(BEHAVIOR_EMOTION_LINKAGE) as Array<
    [SeedBehaviorDnaId, SeedEmotionDnaId]
  >) {
    if (linkedEmotionId === emotionId) return behaviorId;
  }
  throw new Error(`No behavior linkage for emotion: ${emotionId}`);
}

export function emotionRootsMatchBehaviorLayer(
  emotionId: string
): emotionId is BehaviorDnaEmotionRoot {
  return (BEHAVIOR_DNA_EMOTION_ROOTS as readonly string[]).includes(emotionId);
}
