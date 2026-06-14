export const BEHAVIOR_DNA_SCHEMA_VERSION = 'BEHAVIOR-DNA-SCHEMA-PHASE-78A-v1' as const;
export const BEHAVIOR_DNA_SCHEMA_PATH = 'schemas/behaviorDna.schema.json' as const;
export const BEHAVIOR_DNA_SEED_COUNT = 8 as const;

export const REQUIRED_BEHAVIOR_DNA_FIELDS = [
  'behavior_id',
  'behavior_name',
  'emotion_root',
  'facial_expression',
  'eye_behavior',
  'hand_behavior',
  'body_behavior',
  'walking_behavior',
  'interaction_behavior',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
  'relationship_context',
  'intensity_level',
  'keywords',
] as const;

export type RequiredBehaviorDnaField = (typeof REQUIRED_BEHAVIOR_DNA_FIELDS)[number];

export const BEHAVIOR_DNA_STRING_ARRAY_FIELDS = [
  'facial_expression',
  'eye_behavior',
  'hand_behavior',
  'body_behavior',
  'walking_behavior',
  'interaction_behavior',
  'camera_affinity',
  'music_affinity',
  'transition_affinity',
  'relationship_context',
] as const;

export type BehaviorDnaStringArrayField = (typeof BEHAVIOR_DNA_STRING_ARRAY_FIELDS)[number];

export const BEHAVIOR_DNA_EMOTION_ROOTS = [
  'anticipation',
  'uncertainty',
  'isolation',
  'connection',
  'optimism',
  'resolve',
  'care',
  'parting',
] as const;

export type BehaviorDnaEmotionRoot = (typeof BEHAVIOR_DNA_EMOTION_ROOTS)[number];

export const BEHAVIOR_DNA_INTENSITY_MIN = 1 as const;
export const BEHAVIOR_DNA_INTENSITY_MAX = 5 as const;

export const SEED_BEHAVIOR_DNA_IDS = [
  'waiting',
  'hesitation',
  'loneliness',
  'reunion',
  'hope',
  'determination',
  'protection',
  'farewell',
] as const;

export type SeedBehaviorDnaId = (typeof SEED_BEHAVIOR_DNA_IDS)[number];

export interface BehaviorDnaEntry {
  behavior_id: SeedBehaviorDnaId;
  behavior_name: string;
  emotion_root: BehaviorDnaEmotionRoot;
  facial_expression: string[];
  eye_behavior: string[];
  hand_behavior: string[];
  body_behavior: string[];
  walking_behavior: string[];
  interaction_behavior: string[];
  camera_affinity: string[];
  music_affinity: string[];
  transition_affinity: string[];
  relationship_context: string[];
  intensity_level: number;
  keywords: string[];
}

export interface BehaviorDnaSchemaPreview {
  schema_version: typeof BEHAVIOR_DNA_SCHEMA_VERSION;
  schema_path: typeof BEHAVIOR_DNA_SCHEMA_PATH;
  seed_count: typeof BEHAVIOR_DNA_SEED_COUNT;
  required_fields: RequiredBehaviorDnaField[];
  emotion_roots: BehaviorDnaEmotionRoot[];
  intensity_range: {
    min: typeof BEHAVIOR_DNA_INTENSITY_MIN;
    max: typeof BEHAVIOR_DNA_INTENSITY_MAX;
  };
  seed_behaviors: BehaviorDnaEntry[];
}

const BEHAVIOR_DNA_SEED_LIBRARY: BehaviorDnaEntry[] = [
  {
    behavior_id: 'waiting',
    behavior_name: 'Waiting',
    emotion_root: 'anticipation',
    facial_expression: ['soft neutral mouth', 'slight brow lift', 'held breath pause'],
    eye_behavior: ['distant gaze', 'periodic horizon scan', 'slow blink cadence'],
    hand_behavior: ['hands clasped loosely', 'idle finger flex', 'object fidget'],
    body_behavior: ['weight shift idle', 'subtle lean forward', 'shoulders relaxed'],
    walking_behavior: ['stationary hold', 'short pacing loop', 'stop-start hesitation steps'],
    interaction_behavior: ['watching arrival point', 'checking time cue', 'environment listening'],
    camera_affinity: ['medium-wide hold', 'static frame patience', 'slow push-in optional'],
    music_affinity: ['sparse piano motif', 'suspended harmony', 'gentle pulse under 80 bpm'],
    transition_affinity: ['silence_to_confession', 'sunset_to_night'],
    relationship_context: ['awaiting companion', 'pre-reunion tension', 'solo anticipation'],
    intensity_level: 2,
    keywords: ['waiting', 'anticipation', 'patience', 'stillness'],
  },
  {
    behavior_id: 'hesitation',
    behavior_name: 'Hesitation',
    emotion_root: 'uncertainty',
    facial_expression: ['parted lips pause', 'micro wince', 'unresolved smile fade'],
    eye_behavior: ['averted glance', 'downward look', 'rapid side glance'],
    hand_behavior: ['half-raised hand', 'withdrawn gesture', 'self-touch collar'],
    body_behavior: ['recoiled posture', 'frozen mid-step', 'shoulder tension'],
    walking_behavior: ['aborted step', 'slow retreat half-step', 'rooted stance'],
    interaction_behavior: ['distance maintenance', 'unfinished approach', 'withdrawn response delay'],
    camera_affinity: ['over-shoulder doubt frame', 'slight dutch unease', 'close-medium tension'],
    music_affinity: ['syncopated pause', 'minor second tension', 'held string note'],
    transition_affinity: ['hope_to_sadness', 'silence_to_confession'],
    relationship_context: ['confession pause', 'trust threshold', 'emotional risk'],
    intensity_level: 3,
    keywords: ['hesitation', 'uncertainty', 'pause', 'doubt'],
  },
  {
    behavior_id: 'loneliness',
    behavior_name: 'Loneliness',
    emotion_root: 'isolation',
    facial_expression: ['downcast mouth', 'hollow stillness', 'unfocused soft focus'],
    eye_behavior: ['empty middle distance', 'slow downward drift', 'avoidance of crowds'],
    hand_behavior: ['arms wrapped self', 'pocket retreat', 'minimal gesture'],
    body_behavior: ['collapsed inward', 'small silhouette', 'reduced presence'],
    walking_behavior: ['slow solitary stride', 'wide spacing from others', 'drift without destination'],
    interaction_behavior: ['non-engagement', 'missed social cue', 'peripheral solitude'],
    camera_affinity: ['negative space framing', 'wide isolation hold', 'back-follow solitude'],
    music_affinity: ['solo cello line', 'reverb tail loneliness', 'minor key drift'],
    transition_affinity: ['sunset_to_night', 'rain_to_clear'],
    relationship_context: ['absence of companion', 'post-separation', 'crowd isolation'],
    intensity_level: 4,
    keywords: ['loneliness', 'isolation', 'solitude', 'distance'],
  },
  {
    behavior_id: 'reunion',
    behavior_name: 'Reunion',
    emotion_root: 'connection',
    facial_expression: ['brightening eyes', 'open smile bloom', 'tear-edge joy'],
    eye_behavior: ['direct recognition lock', 'wide attentive gaze', 'shared look hold'],
    hand_behavior: ['reach outward', 'embrace initiation', 'hand clasp'],
    body_behavior: ['forward lean open', 'closing distance', 'lifted posture'],
    walking_behavior: ['accelerated approach', 'matched pace convergence', 'run-to-walk settle'],
    interaction_behavior: ['name call response', 'mutual approach', 'shared relief exhale'],
    camera_affinity: ['two-shot reunion frame', 'tracking convergence', 'medium hold on contact'],
    music_affinity: ['swelling strings', 'major resolution chord', 'motif return'],
    transition_affinity: ['separation_to_reunion', 'sadness_to_hope'],
    relationship_context: ['long separation resolve', 'companion return', 'bond reaffirmation'],
    intensity_level: 4,
    keywords: ['reunion', 'connection', 'return', 'recognition'],
  },
  {
    behavior_id: 'hope',
    behavior_name: 'Hope',
    emotion_root: 'optimism',
    facial_expression: ['gentle upward smile', 'brightened eyes', 'soft determined set'],
    eye_behavior: ['horizon lift gaze', 'light catch sparkle', 'forward focus'],
    hand_behavior: ['open palm gesture', 'small fist pump restraint', 'offering hand'],
    body_behavior: ['upright posture', 'chest open', 'light bounce readiness'],
    walking_behavior: ['lightened stride', 'forward momentum', 'spring in step'],
    interaction_behavior: ['encouraging nod', 'supportive proximity', 'shared vision point'],
    camera_affinity: ['low angle lift', 'golden hour key', 'forward tracking optimism'],
    music_affinity: ['rising arpeggio', 'major lift motif', 'tempo brighten'],
    transition_affinity: ['sadness_to_hope', 'rain_to_clear'],
    relationship_context: ['shared future gaze', 'mentor support', 'renewed trust'],
    intensity_level: 3,
    keywords: ['hope', 'optimism', 'renewal', 'forward'],
  },
  {
    behavior_id: 'determination',
    behavior_name: 'Determination',
    emotion_root: 'resolve',
    facial_expression: ['set jaw', 'focused brow', 'compressed lip resolve'],
    eye_behavior: ['unwavering forward stare', 'narrowed focus', 'blink suppression'],
    hand_behavior: ['firm grip', 'decisive point', 'self-affirming fist'],
    body_behavior: ['squared shoulders', 'stable grounded stance', 'forward lean commit'],
    walking_behavior: ['purposeful stride', 'unbroken cadence', 'acceleration into action'],
    interaction_behavior: ['directive gesture', 'leadership step forward', 'commitment declaration'],
    camera_affinity: ['hero medium-low angle', 'locked axis tracking', 'push-in resolve'],
    music_affinity: ['driving percussion', 'ostinato build', 'tempo lock 100-120 bpm'],
    transition_affinity: ['walking_to_running', 'hope_to_sadness'],
    relationship_context: ['protective vow', 'mission commit', 'self-promise'],
    intensity_level: 5,
    keywords: ['determination', 'resolve', 'commitment', 'focus'],
  },
  {
    behavior_id: 'protection',
    behavior_name: 'Protection',
    emotion_root: 'care',
    facial_expression: ['soft protective concern', 'steady reassuring set', 'gentle furrow'],
    eye_behavior: ['guardian scan', 'companion check glance', 'threat assessment sweep'],
    hand_behavior: ['shielding arm', 'guiding hand on shoulder', 'interposition gesture'],
    body_behavior: ['body block stance', 'lean-in shelter', 'between threat and companion'],
    walking_behavior: ['flanking escort pace', 'slowing for companion', 'positioning step'],
    interaction_behavior: ['covering companion', 'verbal reassurance', 'physical barrier offer'],
    camera_affinity: ['over-shoulder guardian', 'two-shot shelter frame', 'slight foreground depth'],
    music_affinity: ['warm low strings', 'protective motif', 'steady heartbeat pulse'],
    transition_affinity: ['separation_to_reunion', 'silence_to_confession'],
    relationship_context: ['guardian role', 'vulnerable companion', 'safety priority'],
    intensity_level: 4,
    keywords: ['protection', 'care', 'guardian', 'shelter'],
  },
  {
    behavior_id: 'farewell',
    behavior_name: 'Farewell',
    emotion_root: 'parting',
    facial_expression: ['bittersweet smile', 'held-back tear', 'soft lip tremble'],
    eye_behavior: ['lingering look', 'slow backward gaze', 'averted final glance'],
    hand_behavior: ['extended wave', 'hand on heart', 'reluctant release'],
    body_behavior: ['turned away pause', 'small bow', 'shoulders drop on departure'],
    walking_behavior: ['slow retreat steps', 'stop-and-look-back', 'widening distance stride'],
    interaction_behavior: ['final words exchange', 'promise gesture', 'reluctant separation'],
    camera_affinity: ['pull-back widening frame', 'silhouette departure', 'long hold on distance'],
    music_affinity: ['fading motif reprise', 'minor resolution', 'tempo deceleration'],
    transition_affinity: ['separation_to_reunion', 'sunset_to_night'],
    relationship_context: ['departure bond', 'promise of return', 'bittersweet closure'],
    intensity_level: 4,
    keywords: ['farewell', 'parting', 'departure', 'goodbye'],
  },
];

export function getBehaviorDnaSeedLibrary(): BehaviorDnaEntry[] {
  return BEHAVIOR_DNA_SEED_LIBRARY.map((entry) => ({
    ...entry,
    facial_expression: [...entry.facial_expression],
    eye_behavior: [...entry.eye_behavior],
    hand_behavior: [...entry.hand_behavior],
    body_behavior: [...entry.body_behavior],
    walking_behavior: [...entry.walking_behavior],
    interaction_behavior: [...entry.interaction_behavior],
    camera_affinity: [...entry.camera_affinity],
    music_affinity: [...entry.music_affinity],
    transition_affinity: [...entry.transition_affinity],
    relationship_context: [...entry.relationship_context],
    keywords: [...entry.keywords],
  }));
}

export function buildBehaviorDnaSchemaPreview(): BehaviorDnaSchemaPreview {
  return {
    schema_version: BEHAVIOR_DNA_SCHEMA_VERSION,
    schema_path: BEHAVIOR_DNA_SCHEMA_PATH,
    seed_count: BEHAVIOR_DNA_SEED_COUNT,
    required_fields: [...REQUIRED_BEHAVIOR_DNA_FIELDS],
    emotion_roots: [...BEHAVIOR_DNA_EMOTION_ROOTS],
    intensity_range: {
      min: BEHAVIOR_DNA_INTENSITY_MIN,
      max: BEHAVIOR_DNA_INTENSITY_MAX,
    },
    seed_behaviors: getBehaviorDnaSeedLibrary(),
  };
}

export function findDuplicateBehaviorIds(behaviorIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of behaviorIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function isValidBehaviorDnaEmotionRoot(value: string): value is BehaviorDnaEmotionRoot {
  return (BEHAVIOR_DNA_EMOTION_ROOTS as readonly string[]).includes(value);
}

export function isValidBehaviorKeyword(value: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(value);
}

export function isValidBehaviorId(value: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(value);
}
