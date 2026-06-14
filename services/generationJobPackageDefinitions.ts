import {
  getCharacterContinuitySeedLibrary,
} from './characterContinuityDefinitions.js';
import {
  getImagePromptPackSeedLibrary,
} from './imagePromptPackDefinitions.js';
import {
  getLocationContinuitySeedLibrary,
  SEED_LOCATION_IDS,
} from './locationContinuityDefinitions.js';
import {
  getPromptPackPairSeedLibrary,
  type PromptPackPairEntry,
} from './promptPackPairingDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';
import {
  getVideoPromptPackSeedLibrary,
} from './videoPromptPackDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';

export const GENERATION_JOB_PACKAGE_VERSION = 'GENERATION-JOB-PACKAGE-PHASE-90-v1' as const;
export const GENERATION_JOB_PACKAGE_SEED_COUNT = 1 as const;
export const GENERATION_JOB_PACKAGE_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const GENERATION_JOB_PACKAGE_ID = 'JOB-song_master_01' as const;

export const READINESS_SCORE_MIN = 1 as const;
export const READINESS_SCORE_MAX = 100 as const;

export const REQUIRED_GENERATION_JOB_PACKAGE_FIELDS = [
  'job_package_id',
  'song_master_id',
  'world_id',
  'character_continuity_ids',
  'location_continuity_ids',
  'storyboard_ids',
  'image_prompt_pack_ids',
  'video_prompt_pack_ids',
  'prompt_pair_ids',
  'generation_sequence',
  'readiness_score',
] as const;

export type RequiredGenerationJobPackageField =
  (typeof REQUIRED_GENERATION_JOB_PACKAGE_FIELDS)[number];

export interface GenerationJobPackageEntry {
  job_package_id: typeof GENERATION_JOB_PACKAGE_ID;
  song_master_id: typeof GENERATION_JOB_PACKAGE_SONG_MASTER_ID;
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  character_continuity_ids: string[];
  location_continuity_ids: string[];
  storyboard_ids: string[];
  image_prompt_pack_ids: string[];
  video_prompt_pack_ids: string[];
  prompt_pair_ids: string[];
  generation_sequence: string[];
  readiness_score: number;
}

export interface GenerationJobPackagePreview {
  layer_version: typeof GENERATION_JOB_PACKAGE_VERSION;
  seed_count: typeof GENERATION_JOB_PACKAGE_SEED_COUNT;
  song_master_id: typeof GENERATION_JOB_PACKAGE_SONG_MASTER_ID;
  required_fields: RequiredGenerationJobPackageField[];
  pipeline_chain: [
    'song_master',
    'emotion_timeline',
    'narrative_beat',
    'storyboard_scene',
    'image_prompt_pack',
    'video_prompt_pack',
    'prompt_pack_pair',
    'character_continuity',
    'location_continuity',
    'world_continuity',
    'generation_job_package',
  ];
  consumption_note: 'Package is consumable by Image App and Video App; no generation performed in this phase';
  seed_generation_job_packages: GenerationJobPackageEntry[];
}

function buildGenerationSequence(pairs: PromptPackPairEntry[]): string[] {
  const sequence: string[] = [
    `step:00:world-bind:${WORLD_CONTINUITY_WORLD_ID}`,
    'step:00:pipeline:no-ai-studio-no-gpu',
  ];

  for (const pair of [...pairs].sort((a, b) => a.scene_order - b.scene_order)) {
    const order = String(pair.scene_order).padStart(2, '0');
    sequence.push(`step:${order}:storyboard:${pair.storyboard_id}`);
    sequence.push(`step:${order}:pair:${pair.pair_id}`);
    sequence.push(`step:${order}:image-first:${pair.image_prompt_pack_id}`);
    sequence.push(`step:${order}:video-second:${pair.video_prompt_pack_id}`);
  }

  return sequence;
}

function calculateReadinessScore(
  worldContinuityScore: number,
  storyboardCount: number,
  pairCount: number,
  sequenceLength: number
): number {
  const expectedSequenceLength = 2 + pairCount * 4;
  const sequenceCoverage =
    expectedSequenceLength > 0
      ? Math.round((sequenceLength / expectedSequenceLength) * READINESS_SCORE_MAX)
      : READINESS_SCORE_MIN;

  const referenceCoverage =
    storyboardCount === STORYBOARD_SEED_COUNT && pairCount === STORYBOARD_SEED_COUNT
      ? READINESS_SCORE_MAX
      : Math.round((Math.min(storyboardCount, pairCount) / STORYBOARD_SEED_COUNT) * READINESS_SCORE_MAX);

  const rawScore = Math.round(
    (worldContinuityScore + sequenceCoverage + referenceCoverage) / 3
  );

  return Math.min(READINESS_SCORE_MAX, Math.max(READINESS_SCORE_MIN, rawScore));
}

function buildGenerationJobPackageEntry(): GenerationJobPackageEntry {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  if (!world) {
    throw new Error(`Missing world continuity for ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  const pairs = getPromptPackPairSeedLibrary();
  const storyboards = getStoryboardSceneSeedLibrary();
  const imagePacks = getImagePromptPackSeedLibrary();
  const videoPacks = getVideoPromptPackSeedLibrary();
  const generationSequence = buildGenerationSequence(pairs);

  return {
    job_package_id: GENERATION_JOB_PACKAGE_ID,
    song_master_id: GENERATION_JOB_PACKAGE_SONG_MASTER_ID,
    world_id: world.world_id,
    character_continuity_ids: [...world.character_continuity_ids],
    location_continuity_ids: [...world.location_continuity_ids],
    storyboard_ids: storyboards.map((scene) => scene.storyboard_id),
    image_prompt_pack_ids: imagePacks.map((pack) => pack.prompt_pack_id),
    video_prompt_pack_ids: videoPacks.map((pack) => pack.video_prompt_pack_id),
    prompt_pair_ids: pairs.map((pair) => pair.pair_id),
    generation_sequence: generationSequence,
    readiness_score: calculateReadinessScore(
      world.continuity_score,
      storyboards.length,
      pairs.length,
      generationSequence.length
    ),
  };
}

export function getGenerationJobPackageSeedLibrary(): GenerationJobPackageEntry[] {
  const entry = buildGenerationJobPackageEntry();
  return [
    {
      ...entry,
      character_continuity_ids: [...entry.character_continuity_ids],
      location_continuity_ids: [...entry.location_continuity_ids],
      storyboard_ids: [...entry.storyboard_ids],
      image_prompt_pack_ids: [...entry.image_prompt_pack_ids],
      video_prompt_pack_ids: [...entry.video_prompt_pack_ids],
      prompt_pair_ids: [...entry.prompt_pair_ids],
      generation_sequence: [...entry.generation_sequence],
    },
  ];
}

export function buildGenerationJobPackagePreview(): GenerationJobPackagePreview {
  return {
    layer_version: GENERATION_JOB_PACKAGE_VERSION,
    seed_count: GENERATION_JOB_PACKAGE_SEED_COUNT,
    song_master_id: GENERATION_JOB_PACKAGE_SONG_MASTER_ID,
    required_fields: [...REQUIRED_GENERATION_JOB_PACKAGE_FIELDS],
    pipeline_chain: [
      'song_master',
      'emotion_timeline',
      'narrative_beat',
      'storyboard_scene',
      'image_prompt_pack',
      'video_prompt_pack',
      'prompt_pack_pair',
      'character_continuity',
      'location_continuity',
      'world_continuity',
      'generation_job_package',
    ],
    consumption_note:
      'Package is consumable by Image App and Video App; no generation performed in this phase',
    seed_generation_job_packages: getGenerationJobPackageSeedLibrary(),
  };
}

export function findDuplicateJobPackageIds(jobPackageIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of jobPackageIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getGenerationJobPackageById(
  jobPackageId: string
): GenerationJobPackageEntry | undefined {
  return getGenerationJobPackageSeedLibrary().find(
    (entry) => entry.job_package_id === jobPackageId
  );
}

export function getExpectedReadinessScore(): number {
  return buildGenerationJobPackageEntry().readiness_score;
}

export function getExpectedGenerationSequenceLength(): number {
  return buildGenerationJobPackageEntry().generation_sequence.length;
}

export function getCharacterContinuityIdsFromJob(): string[] {
  return getCharacterContinuitySeedLibrary().map((entry) => entry.continuity_id);
}

export function getLocationContinuityIdsFromJob(): string[] {
  return getLocationContinuitySeedLibrary().map((entry) => entry.location_id);
}

export function getRequiredLocationContinuityIds(): readonly string[] {
  return SEED_LOCATION_IDS;
}
