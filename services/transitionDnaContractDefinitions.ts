export const TRANSITION_DNA_SCHEMA_VERSION = 'TRANSITION-DNA-INDEX-v1' as const;
export const TRANSITION_DNA_CONTRACT_SCHEMA_VERSION =
  'TRANSITION-DNA-CONTRACT-FINGERPRINT-v1' as const;

export const REQUIRED_TRANSITION_DNA_FIELDS = [
  'transition_id',
  'from_state',
  'to_state',
  'emotional_bridge',
  'motion_bridge',
  'camera_shift',
  'lighting_shift',
  'pacing_shift',
  'continuity_keywords',
] as const;

export type RequiredTransitionDnaField = (typeof REQUIRED_TRANSITION_DNA_FIELDS)[number];

export interface TransitionDnaEntry {
  transition_id: string;
  category: string;
  path: string;
  fields: Record<RequiredTransitionDnaField, string | string[]>;
}

export interface TransitionDnaIndexEntry {
  transition_id: string;
  path: string;
}

export interface TransitionDnaContractFingerprint {
  schemaVersion: typeof TRANSITION_DNA_CONTRACT_SCHEMA_VERSION;
  librarySchemaVersion: typeof TRANSITION_DNA_SCHEMA_VERSION;
  transitionIds: string[];
  categories: Record<string, string>;
  requiredFields: RequiredTransitionDnaField[];
  indexStructure: TransitionDnaIndexEntry[];
  frozenAt: string;
}

const TRANSITION_DNA_LIBRARY: TransitionDnaEntry[] = [
  {
    transition_id: 'sunset_to_night',
    category: 'nostalgia deepens into quiet resolve',
    path: 'transition_dna/sunset_to_night.json',
    fields: {
      transition_id: 'sunset_to_night',
      from_state: 'warm sunset harbor',
      to_state: 'cool night harbor',
      emotional_bridge: 'nostalgia deepens into quiet resolve',
      motion_bridge: 'pace slows with shorter steps',
      camera_shift: 'wider hold then gentle settle',
      lighting_shift: 'golden ochre to indigo violet rim',
      pacing_shift: 'decelerate one beat',
      continuity_keywords: ['lighting continuity', 'horizon lock', 'palette drift'],
    },
  },
  {
    transition_id: 'rain_to_clear',
    category: 'tension releases into cautious hope',
    path: 'transition_dna/rain_to_clear.json',
    fields: {
      transition_id: 'rain_to_clear',
      from_state: 'rain sheen street',
      to_state: 'clear reflective stone',
      emotional_bridge: 'tension releases into cautious hope',
      motion_bridge: 'umbrella lowers, stride opens',
      camera_shift: 'same axis tracking maintained',
      lighting_shift: 'diffuse gray to warm bounce return',
      pacing_shift: 'hold then lighten',
      continuity_keywords: ['weather continuity', 'ground reflection match'],
    },
  },
  {
    transition_id: 'hope_to_sadness',
    category: 'hope folds into tender sadness',
    path: 'transition_dna/hope_to_sadness.json',
    fields: {
      transition_id: 'hope_to_sadness',
      from_state: 'open forward cadence',
      to_state: 'inward restrained cadence',
      emotional_bridge: 'hope folds into tender sadness',
      motion_bridge: 'shoulders lower, stride shortens',
      camera_shift: 'medium hold tightens slightly',
      lighting_shift: 'warm key softens, shadow depth increases',
      pacing_shift: 'decelerate half beat',
      continuity_keywords: ['eyeline continuity', 'spacing continuity'],
    },
  },
  {
    transition_id: 'sadness_to_hope',
    category: 'sadness lifts into gentle hope',
    path: 'transition_dna/sadness_to_hope.json',
    fields: {
      transition_id: 'sadness_to_hope',
      from_state: 'inward restrained cadence',
      to_state: 'open forward cadence',
      emotional_bridge: 'sadness lifts into gentle hope',
      motion_bridge: 'chin lifts, stride lengthens',
      camera_shift: 'subtle push-in then stable tracking',
      lighting_shift: 'shadow depth eases, warm rim returns',
      pacing_shift: 'accelerate half beat',
      continuity_keywords: ['eyeline continuity', 'friendship spacing'],
    },
  },
  {
    transition_id: 'walking_to_running',
    category: 'companionship sustains through motion continuity',
    path: 'transition_dna/walking_to_running.json',
    fields: {
      transition_id: 'walking_to_running',
      from_state: 'synchronized walking',
      to_state: 'shared travel momentum',
      emotional_bridge: 'companionship sustains through motion continuity',
      motion_bridge: 'maintain matched pace without abrupt speed jump',
      camera_shift: 'lateral tracking axis locked',
      lighting_shift: 'stable golden hour continuity',
      pacing_shift: 'hold gentle cadence',
      continuity_keywords: ['axis continuity', 'pace match', 'horizon lock'],
    },
  },
  {
    transition_id: 'separation_to_reunion',
    category: 'separation resolves into reunion warmth',
    path: 'transition_dna/separation_to_reunion.json',
    fields: {
      transition_id: 'separation_to_reunion',
      from_state: 'parting distance',
      to_state: 'closing distance',
      emotional_bridge: 'separation resolves into reunion warmth',
      motion_bridge: 'paths converge with recognition pause',
      camera_shift: 'rear follow to medium reunion frame',
      lighting_shift: 'consistent warm key on faces',
      pacing_shift: 'decelerate into hold on reunion',
      continuity_keywords: ['distance continuity', 'eyeline match'],
    },
  },
  {
    transition_id: 'silence_to_confession',
    category: 'silence breaks into vulnerable confession',
    path: 'transition_dna/silence_to_confession.json',
    fields: {
      transition_id: 'silence_to_confession',
      from_state: 'held silence',
      to_state: 'spoken emotional release',
      emotional_bridge: 'silence breaks into vulnerable confession',
      motion_bridge: 'minimal gesture expands into expressive hands',
      camera_shift: 'static medium to soft push-in',
      lighting_shift: 'stable intimate key',
      pacing_shift: 'pause then single forward beat',
      continuity_keywords: ['framing continuity', 'spatial intimacy'],
    },
  },
];

export function getTransitionDnaLibrary(): TransitionDnaEntry[] {
  return TRANSITION_DNA_LIBRARY.map((entry) => ({
    ...entry,
    fields: {
      ...entry.fields,
      continuity_keywords: [...entry.fields.continuity_keywords],
    },
  }));
}

export function buildTransitionDnaContractFingerprint(
  frozenAt: string
): TransitionDnaContractFingerprint {
  const library = getTransitionDnaLibrary();
  const categories: Record<string, string> = {};

  for (const entry of library) {
    categories[entry.transition_id] = entry.category;
  }

  return {
    schemaVersion: TRANSITION_DNA_CONTRACT_SCHEMA_VERSION,
    librarySchemaVersion: TRANSITION_DNA_SCHEMA_VERSION,
    transitionIds: library.map((entry) => entry.transition_id),
    categories,
    requiredFields: [...REQUIRED_TRANSITION_DNA_FIELDS],
    indexStructure: library.map((entry) => ({
      transition_id: entry.transition_id,
      path: entry.path,
    })),
    frozenAt,
  };
}

export function findDuplicateTransitionIds(transitionIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of transitionIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}
