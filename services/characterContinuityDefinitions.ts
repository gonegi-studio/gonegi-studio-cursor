import { getBehaviorDnaSeedLibrary, type SeedBehaviorDnaId } from './behaviorDnaDefinitions.js';
import { BEHAVIOR_EMOTION_LINKAGE, type SeedEmotionDnaId } from './emotionDnaDefinitions.js';
import {
  getPromptPackPairSeedLibrary,
  type PromptPackPairEntry,
} from './promptPackPairingDefinitions.js';
import {
  getRelationshipDnaSeedLibrary,
  type SeedRelationshipDnaId,
} from './relationshipDnaDefinitions.js';
import { STORYBOARD_SONG_MASTER_ID } from './storyboardLayerDefinitions.js';

export const CHARACTER_CONTINUITY_VERSION = 'CHARACTER-CONTINUITY-PHASE-87-v1' as const;
export const CHARACTER_CONTINUITY_SEED_COUNT = 2 as const;
export const CHARACTER_CONTINUITY_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const SEED_CHARACTER_IDS = ['CHAR-gonagi', 'CHAR-dana'] as const;
export type SeedCharacterId = (typeof SEED_CHARACTER_IDS)[number];

export const CONTINUITY_SCORE_MIN = 1 as const;
export const CONTINUITY_SCORE_MAX = 100 as const;

export const REQUIRED_CHARACTER_CONTINUITY_FIELDS = [
  'continuity_id',
  'character_id',
  'identity_anchor',
  'facial_anchor',
  'body_anchor',
  'hair_anchor',
  'clothing_anchor',
  'behavior_anchor',
  'relationship_anchor',
  'scene_references',
  'continuity_score',
] as const;

export type RequiredCharacterContinuityField =
  (typeof REQUIRED_CHARACTER_CONTINUITY_FIELDS)[number];

export interface CharacterDnaProfile {
  character_id: SeedCharacterId;
  character_name: string;
  display_name_ko: string;
  primary_behavior_id: SeedBehaviorDnaId;
  primary_emotion_id: SeedEmotionDnaId;
  relationship_roles: SeedRelationshipDnaId[];
}

export interface CharacterContinuityEntry {
  continuity_id: string;
  character_id: SeedCharacterId;
  identity_anchor: string[];
  facial_anchor: string[];
  body_anchor: string[];
  hair_anchor: string[];
  clothing_anchor: string[];
  behavior_anchor: string[];
  relationship_anchor: string[];
  scene_references: string[];
  continuity_score: number;
}

export interface CharacterContinuityPreview {
  layer_version: typeof CHARACTER_CONTINUITY_VERSION;
  seed_count: typeof CHARACTER_CONTINUITY_SEED_COUNT;
  song_master_id: typeof CHARACTER_CONTINUITY_SONG_MASTER_ID;
  required_fields: RequiredCharacterContinuityField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'video_prompt_pack',
    'prompt_pack_pair',
    'character_continuity',
  ];
  character_dna_profiles: CharacterDnaProfile[];
  seed_character_continuity: CharacterContinuityEntry[];
}

const CHARACTER_DNA_PROFILES: CharacterDnaProfile[] = [
  {
    character_id: 'CHAR-gonagi',
    character_name: 'Gonagi',
    display_name_ko: '고네기',
    primary_behavior_id: 'protection',
    primary_emotion_id: 'care',
    relationship_roles: [
      'guardian_child',
      'mentor_student',
      'lost_lovers',
      'reunion_after_loss',
      'rival_to_ally',
      'stranger_kindness',
    ],
  },
  {
    character_id: 'CHAR-dana',
    character_name: 'Dana',
    display_name_ko: '다나',
    primary_behavior_id: 'hope',
    primary_emotion_id: 'optimism',
    relationship_roles: [
      'guardian_child',
      'mentor_student',
      'lost_lovers',
      'reunion_after_loss',
      'silent_friends',
      'family_separation',
    ],
  },
];

const GONAGI_IDENTITY_ANCHOR = [
  'CHAR-gonagi',
  '고네기',
  'gonagi-protagonist',
  'guardian-mentor-lead',
  'song_master_01-lead-male',
] as const;

const GONAGI_FACIAL_ANCHOR = [
  'warm steady eyes',
  'soft protective gaze',
  'calm jaw line',
  'subtle worry brow when caring',
] as const;

const GONAGI_BODY_ANCHOR = [
  'upright guardian posture',
  'broad protective shoulder line',
  'measured deliberate movement',
  'hand-ready protective stance',
] as const;

const GONAGI_HAIR_ANCHOR = [
  'dark warm brown hair',
  'consistent left side part',
  'medium length neat cut',
  'no style drift between scenes',
] as const;

const GONAGI_CLOTHING_ANCHOR = [
  'muted earth-tone long coat',
  'layered practical casual wear',
  'soft scarf or collar detail',
  'consistent footwear silhouette',
] as const;

const DANA_IDENTITY_ANCHOR = [
  'CHAR-dana',
  '다나',
  'gonagi-companion-lead',
  'song_master_01-lead-female',
] as const;

const DANA_FACIAL_ANCHOR = [
  'expressive gentle eyes',
  'open hopeful expression baseline',
  'soft rounded face shape',
  'emotion-readable micro expressions',
] as const;

const DANA_BODY_ANCHOR = [
  'slightly smaller frame than Gonagi',
  'open forward-leaning posture',
  'light agile movement cadence',
  'companion-proximity spacing habit',
] as const;

const DANA_HAIR_ANCHOR = [
  'dark chestnut shoulder-length hair',
  'consistent side-swept bangs',
  'natural loose wave texture',
  'no length drift between scenes',
] as const;

const DANA_CLOTHING_ANCHOR = [
  'soft pastel layered outfit',
  'practical daily-life skirt or pants',
  'light jacket matching season tone',
  'consistent bag or accessory prop',
] as const;

function getCharacterDnaProfile(characterId: SeedCharacterId): CharacterDnaProfile {
  const profile = CHARACTER_DNA_PROFILES.find((entry) => entry.character_id === characterId);
  if (!profile) {
    throw new Error(`Missing character DNA profile for ${characterId}`);
  }
  return profile;
}

function getBehaviorById(behaviorId: SeedBehaviorDnaId) {
  return getBehaviorDnaSeedLibrary().find((entry) => entry.behavior_id === behaviorId);
}

function getRelationshipById(relationshipId: SeedRelationshipDnaId) {
  return getRelationshipDnaSeedLibrary().find((entry) => entry.relationship_id === relationshipId);
}

function buildBehaviorAnchor(profile: CharacterDnaProfile): string[] {
  const behavior = getBehaviorById(profile.primary_behavior_id);
  if (!behavior) {
    throw new Error(`Missing behavior DNA for ${profile.character_id}`);
  }

  return [
    `behavior-dna:${profile.primary_behavior_id}`,
    `emotion-dna:${profile.primary_emotion_id}`,
    behavior.facial_expression[0] ?? '',
    behavior.body_behavior[0] ?? '',
    behavior.walking_behavior[0] ?? '',
    behavior.interaction_behavior[0] ?? '',
    ...behavior.keywords.slice(0, 2),
  ].filter((item) => item.length > 0);
}

function buildRelationshipAnchor(profile: CharacterDnaProfile): string[] {
  const anchors = profile.relationship_roles.flatMap((relationshipId) => {
    const relationship = getRelationshipById(relationshipId);
    if (!relationship) return [`relationship-dna:${relationshipId}`];

    return [
      `relationship-dna:${relationshipId}`,
      relationship.emotional_core,
      relationship.gaze_pattern[0] ?? '',
      relationship.distance_pattern[0] ?? '',
    ];
  });

  return [...new Set(anchors.filter((item) => item.length > 0))];
}

function resolveSceneReferencesForCharacter(
  _characterId: SeedCharacterId,
  pairs: PromptPackPairEntry[]
): string[] {
  return pairs.map((pair) => pair.pair_id).sort();
}

function calculateContinuityScore(sceneReferences: string[], totalPairs: number): number {
  if (totalPairs === 0) return CONTINUITY_SCORE_MIN;

  const coverageRatio = sceneReferences.length / totalPairs;
  const rawScore = Math.round(coverageRatio * CONTINUITY_SCORE_MAX);
  return Math.min(CONTINUITY_SCORE_MAX, Math.max(CONTINUITY_SCORE_MIN, rawScore));
}

function buildCharacterContinuity(
  characterId: SeedCharacterId,
  pairs: PromptPackPairEntry[]
): CharacterContinuityEntry {
  const profile = getCharacterDnaProfile(characterId);
  const sceneReferences = resolveSceneReferencesForCharacter(characterId, pairs);

  const identityAnchor =
    characterId === 'CHAR-gonagi' ? [...GONAGI_IDENTITY_ANCHOR] : [...DANA_IDENTITY_ANCHOR];
  const facialAnchor =
    characterId === 'CHAR-gonagi' ? [...GONAGI_FACIAL_ANCHOR] : [...DANA_FACIAL_ANCHOR];
  const bodyAnchor =
    characterId === 'CHAR-gonagi' ? [...GONAGI_BODY_ANCHOR] : [...DANA_BODY_ANCHOR];
  const hairAnchor =
    characterId === 'CHAR-gonagi' ? [...GONAGI_HAIR_ANCHOR] : [...DANA_HAIR_ANCHOR];
  const clothingAnchor =
    characterId === 'CHAR-gonagi' ? [...GONAGI_CLOTHING_ANCHOR] : [...DANA_CLOTHING_ANCHOR];

  return {
    continuity_id: `CCN-${characterId}`,
    character_id: characterId,
    identity_anchor: identityAnchor,
    facial_anchor: facialAnchor,
    body_anchor: bodyAnchor,
    hair_anchor: hairAnchor,
    clothing_anchor: clothingAnchor,
    behavior_anchor: buildBehaviorAnchor(profile),
    relationship_anchor: buildRelationshipAnchor(profile),
    scene_references: sceneReferences,
    continuity_score: calculateContinuityScore(sceneReferences, pairs.length),
  };
}

export function getCharacterDnaSeedLibrary(): CharacterDnaProfile[] {
  return CHARACTER_DNA_PROFILES.map((profile) => ({
    ...profile,
    relationship_roles: [...profile.relationship_roles],
  }));
}

export function getCharacterContinuitySeedLibrary(): CharacterContinuityEntry[] {
  const pairs = getPromptPackPairSeedLibrary();

  return SEED_CHARACTER_IDS.map((characterId) => {
    const entry = buildCharacterContinuity(characterId, pairs);
    return {
      ...entry,
      identity_anchor: [...entry.identity_anchor],
      facial_anchor: [...entry.facial_anchor],
      body_anchor: [...entry.body_anchor],
      hair_anchor: [...entry.hair_anchor],
      clothing_anchor: [...entry.clothing_anchor],
      behavior_anchor: [...entry.behavior_anchor],
      relationship_anchor: [...entry.relationship_anchor],
      scene_references: [...entry.scene_references],
    };
  });
}

export function buildCharacterContinuityPreview(): CharacterContinuityPreview {
  return {
    layer_version: CHARACTER_CONTINUITY_VERSION,
    seed_count: CHARACTER_CONTINUITY_SEED_COUNT,
    song_master_id: CHARACTER_CONTINUITY_SONG_MASTER_ID,
    required_fields: [...REQUIRED_CHARACTER_CONTINUITY_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'video_prompt_pack',
      'prompt_pack_pair',
      'character_continuity',
    ],
    character_dna_profiles: getCharacterDnaSeedLibrary(),
    seed_character_continuity: getCharacterContinuitySeedLibrary(),
  };
}

export function findDuplicateContinuityIds(continuityIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of continuityIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getCharacterContinuityById(
  continuityId: string
): CharacterContinuityEntry | undefined {
  return getCharacterContinuitySeedLibrary().find((entry) => entry.continuity_id === continuityId);
}

export function getCharacterContinuityByCharacterId(
  characterId: SeedCharacterId
): CharacterContinuityEntry | undefined {
  return getCharacterContinuitySeedLibrary().find((entry) => entry.character_id === characterId);
}

export function getCharacterDnaProfileById(
  characterId: string
): CharacterDnaProfile | undefined {
  return getCharacterDnaSeedLibrary().find((profile) => profile.character_id === characterId);
}

export function isValidCharacterId(value: string): value is SeedCharacterId {
  return SEED_CHARACTER_IDS.includes(value as SeedCharacterId);
}

export function getPromptPackPairById(pairId: string): PromptPackPairEntry | undefined {
  return getPromptPackPairSeedLibrary().find((pair) => pair.pair_id === pairId);
}

export function validateCharacterDnaLinkage(profile: CharacterDnaProfile): boolean {
  return BEHAVIOR_EMOTION_LINKAGE[profile.primary_behavior_id] === profile.primary_emotion_id;
}
