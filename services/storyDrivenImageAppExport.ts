import {
  getCharacterDecisionSeedLibrary,
  type CharacterDecisionEntry,
} from './characterDecisionDefinitions.js';
import {
  getImageActingCameraById,
  getImageActingCameraGrammarSeedLibrary,
} from './imageActingCameraGrammarDefinitions.js';
import {
  buildImageAppInputExport,
  buildImageAppPayloads,
  IMAGE_APP_INPUT_EXPORT_ID,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';
import {
  getBundleShotRole,
  getFiveShotBundleSeedLibrary,
  type FiveShotBundleEntry,
} from './fiveShotBundleDefinitions.js';
import {
  DEFAULT_WORLD_SETTING,
  getSrtEmotionIngestionSeedLibrary,
  WORLD_DNA_PRIORITY_LAW,
} from './srtEmotionIngestionDefinitions.js';
import {
  getStoryboardSceneSeedLibrary,
  STORYBOARD_SONG_MASTER_ID,
  type StoryboardSceneEntry,
} from './storyboardLayerDefinitions.js';
import {
  ANTI_REPETITION_RULES_BASE,
  getStoryOrchestrationById,
  parseOutputStoryBeatToken,
  STORY_ORCHESTRATION_ID,
} from './storyOrchestrationDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
} from './worldContinuityDefinitions.js';

export const STORY_DRIVEN_IMAGE_APP_EXPORT_VERSION =
  'STORY-DRIVEN-IMAGE-APP-EXPORT-PHASE-97D-v1' as const;
export const STORY_DRIVEN_IMAGE_APP_EXPORT_ID = 'SDIE-song_master_01' as const;
export const STORY_DRIVEN_IMAGE_APP_EXPORT_JSON_PATH =
  'exports/story-driven-image-app-export.json' as const;
export const STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;
export const STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT = 15 as const;

export const REQUIRED_STORY_DRIVEN_EXPORT_FIELDS = [
  'export_id',
  'song_master_id',
  'world_id',
  'orchestration_id',
  'five_shot_bundle_ids',
  'image_generation_payloads',
  'story_engine_ready',
] as const;

export type RequiredStoryDrivenExportField =
  (typeof REQUIRED_STORY_DRIVEN_EXPORT_FIELDS)[number];

export const REQUIRED_IMAGE_GENERATION_PAYLOAD_FIELDS = [
  'payload_id',
  'bundle_id',
  'storyboard_id',
  'image_prompt_pack_id',
  'acting_camera_id',
  'character_decision_refs',
  'story_beat',
  'narrative_turn',
  'daily_life_anchor',
  'anti_repetition_guard',
  'world_constraints',
  'character_continuity_anchors',
  'location_continuity_anchors',
  'world_continuity_anchors',
  'image_prompt',
  'negative_prompt',
] as const;

export type RequiredImageGenerationPayloadField =
  (typeof REQUIRED_IMAGE_GENERATION_PAYLOAD_FIELDS)[number];

export interface StoryDrivenImageGenerationPayload {
  payload_id: string;
  bundle_id: string;
  storyboard_id: string;
  image_prompt_pack_id: string;
  acting_camera_id: string;
  character_decision_refs: string[];
  story_beat: string;
  narrative_turn: string;
  daily_life_anchor: string[];
  anti_repetition_guard: string[];
  world_constraints: string[];
  character_continuity_anchors: string[];
  location_continuity_anchors: string[];
  world_continuity_anchors: string[];
  image_prompt: string;
  negative_prompt: string;
}

export interface StoryDrivenImageAppExport {
  export_id: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_ID;
  song_master_id: typeof STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID;
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  orchestration_id: typeof STORY_ORCHESTRATION_ID;
  five_shot_bundle_ids: string[];
  image_generation_payloads: StoryDrivenImageGenerationPayload[];
  story_engine_ready: boolean;
}

function getSceneByStoryboardId(storyboardId: string): StoryboardSceneEntry {
  const scene = getStoryboardSceneSeedLibrary().find(
    (entry) => entry.storyboard_id === storyboardId
  );
  if (!scene) {
    throw new Error(`Missing storyboard scene ${storyboardId}`);
  }
  return scene;
}

function getNarrativeTurnForScene(sceneOrder: number): string {
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  if (!orchestration) {
    throw new Error(`Missing orchestration ${STORY_ORCHESTRATION_ID}`);
  }
  const order = String(sceneOrder).padStart(2, '0');
  const turn = orchestration.narrative_turns.find((token) => token.startsWith(`turn:${order}:`));
  if (!turn) {
    throw new Error(`Missing narrative turn for scene order ${sceneOrder}`);
  }
  return turn;
}

function getStoryBeatForScene(storyboardId: string): string {
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  if (!orchestration) {
    throw new Error(`Missing orchestration ${STORY_ORCHESTRATION_ID}`);
  }
  const beat = orchestration.output_story_beats.find((token) => {
    const parsed = parseOutputStoryBeatToken(token);
    return parsed?.storyboardId === storyboardId;
  });
  if (!beat) {
    throw new Error(`Missing story beat for ${storyboardId}`);
  }
  return beat;
}

function getCharacterDecisionRefsFromLibrary(
  storyboardId: string,
  sceneOrder: number,
  library: CharacterDecisionEntry[]
): string[] {
  const order = String(sceneOrder).padStart(2, '0');
  return library
    .filter(
      (decision) =>
        decision.scene_bindings.some((token) => token === `segment:${order}`) &&
        decision.scene_bindings.some((token) => token === `storyboard:${storyboardId}`)
    )
    .map((decision) => decision.decision_id)
    .sort();
}

function buildWorldConstraints(bundle: FiveShotBundleEntry): string[] {
  const ingestion = getSrtEmotionIngestionSeedLibrary()[0];
  const constraints = new Set<string>([
    `law:${WORLD_DNA_PRIORITY_LAW}`,
    `world:${WORLD_CONTINUITY_WORLD_ID}`,
    `default-world:${DEFAULT_WORLD_SETTING.replace(/\s+/g, '-')}`,
    `bundle:${bundle.bundle_id}`,
    `bundle-location:${bundle.location_id}`,
    'principle:no-lyric-based-world-generation',
    'principle:no-lyric-based-location-generation',
    'world-preservation:no-modern-transport',
  ]);

  if (ingestion) {
    for (const token of ingestion.world_constraints) {
      if (
        token.startsWith('law:') ||
        token.startsWith('world:') ||
        token.startsWith('locked-dimension:') ||
        token.startsWith('forbidden-from-lyrics:') ||
        token.startsWith('principle:') ||
        token.startsWith('allowed-waiting:')
      ) {
        constraints.add(token);
      }
    }
  }

  for (const keyword of bundle.keywords) {
    if (
      keyword.startsWith('forbidden:') ||
      keyword.startsWith('default-world:') ||
      keyword.startsWith('harbor-place:')
    ) {
      constraints.add(keyword);
    }
  }

  return [...constraints].sort();
}

function buildAntiRepetitionGuard(
  bundle: FiveShotBundleEntry,
  sceneIndexInBundle: number,
  storyboardId: string
): string[] {
  const role = getBundleShotRole(sceneIndexInBundle);
  const acting = getImageActingCameraById(`IAC-${storyboardId}`);
  const guards = new Set<string>([
    ...ANTI_REPETITION_RULES_BASE,
    `bundle-role:${role}`,
    `bundle:${bundle.bundle_id}`,
    'no-identical-pose-within-bundle',
    'no-identical-gaze-within-bundle',
    'no-identical-camera-distance-within-bundle',
    'no-identical-acting-intent-within-bundle',
    'no-identical-daily-life-anchor-within-bundle',
  ]);

  if (acting) {
    for (const rule of acting.anti_static_pose_rules) {
      guards.add(rule);
    }
  }

  return [...guards].sort();
}

function buildStoryDrivenPayload(
  bundle: FiveShotBundleEntry,
  storyboardId: string,
  sceneIndexInBundle: number,
  imagePayload: ImageAppScenePayload,
  decisionLibrary: CharacterDecisionEntry[]
): StoryDrivenImageGenerationPayload {
  const scene = getSceneByStoryboardId(storyboardId);
  const decisionRefs = getCharacterDecisionRefsFromLibrary(
    storyboardId,
    scene.scene_order,
    decisionLibrary
  );

  if (decisionRefs.length !== 2) {
    throw new Error(`Expected two character decisions for ${storyboardId} in ${bundle.bundle_id}`);
  }

  return {
    payload_id: `SDGP-${storyboardId}`,
    bundle_id: bundle.bundle_id,
    storyboard_id: storyboardId,
    image_prompt_pack_id: imagePayload.image_prompt_pack_id,
    acting_camera_id: imagePayload.acting_camera_id,
    character_decision_refs: [...decisionRefs],
    story_beat: getStoryBeatForScene(storyboardId),
    narrative_turn: getNarrativeTurnForScene(scene.scene_order),
    daily_life_anchor: [...scene.daily_life_anchor],
    anti_repetition_guard: buildAntiRepetitionGuard(bundle, sceneIndexInBundle, storyboardId),
    world_constraints: buildWorldConstraints(bundle),
    character_continuity_anchors: [...imagePayload.character_continuity_anchors],
    location_continuity_anchors: [...imagePayload.location_continuity_anchors],
    world_continuity_anchors: [...imagePayload.world_continuity_anchors],
    image_prompt: imagePayload.image_prompt,
    negative_prompt: imagePayload.negative_prompt,
  };
}

export function buildStoryDrivenImageGenerationPayloads(): StoryDrivenImageGenerationPayload[] {
  const bundles = getFiveShotBundleSeedLibrary();
  const decisionLibrary = getCharacterDecisionSeedLibrary();
  const imagePayloadByStoryboard = new Map(
    buildImageAppPayloads().map((payload) => [payload.storyboard_id, payload] as const)
  );
  const payloads: StoryDrivenImageGenerationPayload[] = [];

  for (const bundle of bundles) {
    bundle.scene_ids.forEach((storyboardId, index) => {
      const imagePayload = imagePayloadByStoryboard.get(storyboardId);
      if (!imagePayload) {
        throw new Error(`Missing image app input payload for ${storyboardId}`);
      }
      payloads.push(
        buildStoryDrivenPayload(bundle, storyboardId, index, imagePayload, decisionLibrary)
      );
    });
  }

  return payloads.sort((left, right) => left.storyboard_id.localeCompare(right.storyboard_id));
}

export function buildStoryDrivenImageAppExport(): StoryDrivenImageAppExport {
  const orchestration = getStoryOrchestrationById(STORY_ORCHESTRATION_ID);
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  const imageExport = buildImageAppInputExport();
  const bundles = getFiveShotBundleSeedLibrary();
  const payloads = buildStoryDrivenImageGenerationPayloads();

  if (!orchestration) {
    throw new Error(`Missing story orchestration ${STORY_ORCHESTRATION_ID}`);
  }
  if (!world) {
    throw new Error(`Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  const ready =
    imageExport.image_app_ready &&
    bundles.length === 3 &&
    payloads.length === STORY_DRIVEN_IMAGE_APP_PAYLOAD_COUNT;

  return {
    export_id: STORY_DRIVEN_IMAGE_APP_EXPORT_ID,
    song_master_id: STORY_DRIVEN_IMAGE_APP_EXPORT_SONG_MASTER_ID,
    world_id: WORLD_CONTINUITY_WORLD_ID,
    orchestration_id: STORY_ORCHESTRATION_ID,
    five_shot_bundle_ids: bundles.map((bundle) => bundle.bundle_id),
    image_generation_payloads: payloads.map((payload) => ({
      ...payload,
      character_decision_refs: [...payload.character_decision_refs],
      daily_life_anchor: [...payload.daily_life_anchor],
      anti_repetition_guard: [...payload.anti_repetition_guard],
      world_constraints: [...payload.world_constraints],
      character_continuity_anchors: [...payload.character_continuity_anchors],
      location_continuity_anchors: [...payload.location_continuity_anchors],
      world_continuity_anchors: [...payload.world_continuity_anchors],
    })),
    story_engine_ready: ready,
  };
}

export function findDuplicateStoryDrivenPayloadIds(payloadIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of payloadIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getStoryDrivenPayloadByStoryboardId(
  storyboardId: string
): StoryDrivenImageGenerationPayload | undefined {
  return buildStoryDrivenImageGenerationPayloads().find(
    (payload) => payload.storyboard_id === storyboardId
  );
}

export function getAllBundledStoryboardIds(): string[] {
  return getFiveShotBundleSeedLibrary().flatMap((bundle) => bundle.scene_ids);
}

export function getImageActingCameraIds(): string[] {
  return getImageActingCameraGrammarSeedLibrary().map((entry) => entry.acting_camera_id);
}

export function validateImageExportReference(exportId: string): boolean {
  return exportId === IMAGE_APP_INPUT_EXPORT_ID;
}

export function getCharacterDecisionIds(): string[] {
  return getCharacterDecisionSeedLibrary().map((entry) => entry.decision_id);
}

export function getFiveShotBundleIds(): string[] {
  return getFiveShotBundleSeedLibrary().map((bundle) => bundle.bundle_id);
}
