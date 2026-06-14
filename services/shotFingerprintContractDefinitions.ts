export const SHOT_FINGERPRINT_SCHEMA_VERSION = 'SHOT-FINGERPRINT-INDEX-v1' as const;
export const SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION =
  'SHOT-FINGERPRINT-CONTRACT-FINGERPRINT-v1' as const;

export const REQUIRED_SHOT_FINGERPRINT_FIELDS = [
  'shot_id',
  'framing',
  'lens_behavior',
  'camera_motion',
  'subject_distance',
  'cinematic_role',
  'continuity_bias',
] as const;

export type RequiredShotFingerprintField = (typeof REQUIRED_SHOT_FINGERPRINT_FIELDS)[number];

export interface ShotFingerprintEntry {
  fingerprint_id: string;
  category: string;
  path: string;
  fields: Record<RequiredShotFingerprintField, string | string[]>;
}

export interface ShotFingerprintIndexEntry {
  fingerprint_id: string;
  path: string;
}

export interface ShotFingerprintContractFingerprint {
  schemaVersion: typeof SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION;
  librarySchemaVersion: typeof SHOT_FINGERPRINT_SCHEMA_VERSION;
  fingerprintIds: string[];
  categories: Record<string, string>;
  requiredFields: RequiredShotFingerprintField[];
  indexStructure: ShotFingerprintIndexEntry[];
  frozenAt: string;
}

const SHOT_FINGERPRINT_LIBRARY: ShotFingerprintEntry[] = [
  {
    fingerprint_id: 'wide_establishing',
    category: 'establish geography',
    path: 'shot_fingerprint/wide_establishing.json',
    fields: {
      shot_id: 'wide_establishing',
      framing: 'wide establishing',
      lens_behavior: 'deep focus harbor planes',
      camera_motion: 'slow panoramic settle',
      subject_distance: 'far to mid',
      cinematic_role: 'establish geography',
      continuity_bias: ['horizon lock', 'depth planes stable'],
    },
  },
  {
    fingerprint_id: 'medium_emotional',
    category: 'emotional dialogue hold',
    path: 'shot_fingerprint/medium_emotional.json',
    fields: {
      shot_id: 'medium_emotional',
      framing: 'medium two-shot',
      lens_behavior: 'gentle focus falloff',
      camera_motion: 'micro push-in on beat',
      subject_distance: 'mid',
      cinematic_role: 'emotional dialogue hold',
      continuity_bias: ['eyeline match', 'shoulder line stable'],
    },
  },
  {
    fingerprint_id: 'side_tracking',
    category: 'travel companionship',
    path: 'shot_fingerprint/side_tracking.json',
    fields: {
      shot_id: 'side_tracking',
      framing: 'medium lateral two-shot',
      lens_behavior: 'parallel tracking plane',
      camera_motion: 'side tracking with stable horizon',
      subject_distance: 'mid',
      cinematic_role: 'travel companionship',
      continuity_bias: ['axis lock', 'pace match', 'no jump cut'],
    },
  },
  {
    fingerprint_id: 'rear_follow',
    category: 'departure or pursuit',
    path: 'shot_fingerprint/rear_follow.json',
    fields: {
      shot_id: 'rear_follow',
      framing: 'rear follow medium',
      lens_behavior: 'shallow depth on subject',
      camera_motion: 'rear tracking dolly cadence',
      subject_distance: 'mid-close',
      cinematic_role: 'departure or pursuit',
      continuity_bias: ['path continuity', 'back silhouette stable'],
    },
  },
  {
    fingerprint_id: 'overhead_isolation',
    category: 'isolation emphasis',
    path: 'shot_fingerprint/overhead_isolation.json',
    fields: {
      shot_id: 'overhead_isolation',
      framing: 'high overhead',
      lens_behavior: 'graphic composition read',
      camera_motion: 'slow vertical settle',
      subject_distance: 'far',
      cinematic_role: 'isolation emphasis',
      continuity_bias: ['geometry continuity'],
    },
  },
  {
    fingerprint_id: 'window_reflection',
    category: 'inner emotion mirror',
    path: 'shot_fingerprint/window_reflection.json',
    fields: {
      shot_id: 'window_reflection',
      framing: 'interior window medium',
      lens_behavior: 'reflection layer readable',
      camera_motion: 'static with breath drift',
      subject_distance: 'mid-close',
      cinematic_role: 'inner emotion mirror',
      continuity_bias: ['reflection continuity'],
    },
  },
  {
    fingerprint_id: 'close_hand_detail',
    category: 'gesture beat',
    path: 'shot_fingerprint/close_hand_detail.json',
    fields: {
      shot_id: 'close_hand_detail',
      framing: 'close hand detail',
      lens_behavior: 'macro emotional gesture',
      camera_motion: 'minimal hold',
      subject_distance: 'close',
      cinematic_role: 'gesture beat',
      continuity_bias: ['hand anatomy stable'],
    },
  },
  {
    fingerprint_id: 'silhouette_distance',
    category: 'emotional distance',
    path: 'shot_fingerprint/silhouette_distance.json',
    fields: {
      shot_id: 'silhouette_distance',
      framing: 'silhouette long shot',
      lens_behavior: 'rim light separation',
      camera_motion: 'slow pullback',
      subject_distance: 'far',
      cinematic_role: 'emotional distance',
      continuity_bias: ['rim continuity', 'horizon lock'],
    },
  },
];

export function getShotFingerprintLibrary(): ShotFingerprintEntry[] {
  return SHOT_FINGERPRINT_LIBRARY.map((entry) => ({
    ...entry,
    fields: {
      ...entry.fields,
      continuity_bias: [...entry.fields.continuity_bias],
    },
  }));
}

export function buildShotFingerprintContractFingerprint(
  frozenAt: string
): ShotFingerprintContractFingerprint {
  const library = getShotFingerprintLibrary();
  const categories: Record<string, string> = {};

  for (const entry of library) {
    categories[entry.fingerprint_id] = entry.category;
  }

  return {
    schemaVersion: SHOT_FINGERPRINT_CONTRACT_SCHEMA_VERSION,
    librarySchemaVersion: SHOT_FINGERPRINT_SCHEMA_VERSION,
    fingerprintIds: library.map((entry) => entry.fingerprint_id),
    categories,
    requiredFields: [...REQUIRED_SHOT_FINGERPRINT_FIELDS],
    indexStructure: library.map((entry) => ({
      fingerprint_id: entry.fingerprint_id,
      path: entry.path,
    })),
    frozenAt,
  };
}

export function findDuplicateFingerprintIds(fingerprintIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of fingerprintIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}
