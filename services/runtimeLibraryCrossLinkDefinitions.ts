import {
  SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION,
  SHOT_FINGERPRINT_SCHEMA_VERSION,
} from './shotFingerprintContractDefinitions.js';
import {
  TRANSITION_DNA_CONTRACT_SCHEMA_VERSION,
  TRANSITION_DNA_SCHEMA_VERSION,
} from './transitionDnaContractDefinitions.js';

export const RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION =
  'RUNTIME-LIBRARY-CROSS-LINK-FINGERPRINT-v1' as const;

export interface RuntimeLibraryCrossLink {
  shot_id: string;
  transition_id: string;
}

export interface RuntimeLibraryCrossLinkFingerprint {
  schemaVersion: typeof RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION;
  shotIds: string[];
  transitionIds: string[];
  crossLinks: RuntimeLibraryCrossLink[];
  categoryMappings: Record<string, string[]>;
  schemaVersions: {
    shotFingerprint: typeof SHOT_FINGERPRINT_SCHEMA_VERSION;
    transitionDna: typeof TRANSITION_DNA_SCHEMA_VERSION;
    shotFingerprintContract: typeof SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION;
    transitionDnaContract: typeof TRANSITION_DNA_CONTRACT_SCHEMA_VERSION;
  };
  frozenAt: string;
}

const CROSS_LINKS: RuntimeLibraryCrossLink[] = [
  { shot_id: 'wide_establishing', transition_id: 'sunset_to_night' },
  { shot_id: 'wide_establishing', transition_id: 'rain_to_clear' },
  { shot_id: 'medium_emotional', transition_id: 'silence_to_confession' },
  { shot_id: 'medium_emotional', transition_id: 'hope_to_sadness' },
  { shot_id: 'side_tracking', transition_id: 'walking_to_running' },
  { shot_id: 'side_tracking', transition_id: 'separation_to_reunion' },
  { shot_id: 'rear_follow', transition_id: 'separation_to_reunion' },
  { shot_id: 'rear_follow', transition_id: 'walking_to_running' },
  { shot_id: 'overhead_isolation', transition_id: 'hope_to_sadness' },
  { shot_id: 'overhead_isolation', transition_id: 'sunset_to_night' },
  { shot_id: 'window_reflection', transition_id: 'silence_to_confession' },
  { shot_id: 'window_reflection', transition_id: 'sadness_to_hope' },
  { shot_id: 'close_hand_detail', transition_id: 'hope_to_sadness' },
  { shot_id: 'close_hand_detail', transition_id: 'sadness_to_hope' },
  { shot_id: 'silhouette_distance', transition_id: 'separation_to_reunion' },
  { shot_id: 'silhouette_distance', transition_id: 'sunset_to_night' },
];

const CATEGORY_MAPPINGS: Record<string, string[]> = {
  'establish geography': [
    'nostalgia deepens into quiet resolve',
    'tension releases into cautious hope',
  ],
  'emotional dialogue hold': [
    'hope folds into tender sadness',
    'silence breaks into vulnerable confession',
    'sadness lifts into gentle hope',
  ],
  'travel companionship': [
    'companionship sustains through motion continuity',
    'separation resolves into reunion warmth',
  ],
  'departure or pursuit': [
    'separation resolves into reunion warmth',
    'companionship sustains through motion continuity',
  ],
  'isolation emphasis': [
    'hope folds into tender sadness',
    'nostalgia deepens into quiet resolve',
  ],
  'inner emotion mirror': [
    'silence breaks into vulnerable confession',
    'sadness lifts into gentle hope',
  ],
  'gesture beat': ['hope folds into tender sadness', 'sadness lifts into gentle hope'],
  'emotional distance': [
    'separation resolves into reunion warmth',
    'nostalgia deepens into quiet resolve',
  ],
};

export function getRuntimeLibraryCrossLinks(): RuntimeLibraryCrossLink[] {
  return CROSS_LINKS.map((link) => ({ ...link }));
}

export function getRuntimeLibraryCategoryMappings(): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(CATEGORY_MAPPINGS).map(([key, values]) => [key, [...values]])
  );
}

export function buildRuntimeLibraryCrossLinkFingerprint(
  shotIds: string[],
  transitionIds: string[],
  frozenAt: string
): RuntimeLibraryCrossLinkFingerprint {
  return {
    schemaVersion: RUNTIME_LIBRARY_CROSS_LINK_SCHEMA_VERSION,
    shotIds: [...shotIds].sort(),
    transitionIds: [...transitionIds].sort(),
    crossLinks: getRuntimeLibraryCrossLinks().sort((a, b) => {
      const shotCompare = a.shot_id.localeCompare(b.shot_id);
      return shotCompare !== 0 ? shotCompare : a.transition_id.localeCompare(b.transition_id);
    }),
    categoryMappings: getRuntimeLibraryCategoryMappings(),
    schemaVersions: {
      shotFingerprint: SHOT_FINGERPRINT_SCHEMA_VERSION,
      transitionDna: TRANSITION_DNA_SCHEMA_VERSION,
      shotFingerprintContract: SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION,
      transitionDnaContract: TRANSITION_DNA_CONTRACT_SCHEMA_VERSION,
    },
    frozenAt,
  };
}
