import {
  getCharacterContinuitySeedLibrary,
  type CharacterContinuityEntry,
} from './characterContinuityDefinitions.js';
import {
  getImageActingCameraByImagePromptPackId,
  getImageActingCameraGrammarSeedLibrary,
  type ImageActingCameraGrammarEntry,
} from './imageActingCameraGrammarDefinitions.js';
import {
  getImagePromptPackSeedLibrary,
  IMAGE_PROMPT_PACK_SONG_MASTER_ID,
  type ImagePromptPackEntry,
} from './imagePromptPackDefinitions.js';
import {
  getLocationContinuityById,
  getLocationContinuitySeedLibrary,
  getLocationsForStoryboardScene,
  type LocationContinuityEntry,
  type SeedLocationId,
} from './locationContinuityDefinitions.js';
import {
  STORYBOARD_SEED_COUNT,
  STORYBOARD_SONG_MASTER_ID,
  getStoryboardSceneSeedLibrary,
} from './storyboardLayerDefinitions.js';
import {
  getWorldContinuityById,
  WORLD_CONTINUITY_WORLD_ID,
  type WorldContinuityEntry,
} from './worldContinuityDefinitions.js';
import { enrichLocationContinuityAnchorsWithIndoorAnchor } from './indoorLocationAnchor.js';
import { enrichLocationContinuityAnchorsWithPropAnchor } from './propAnchor.js';
import { enrichLocationContinuityAnchorsWithRoomLayoutLock } from './roomLayoutLock.js';
import { enrichLocationContinuityAnchorsWithSceneCompositionForLocations } from './sceneAssetComposition.js';
import {
  enrichAnchorsWithEmotionActing,
  inferEmotionIdFromActingIntent,
  inferShotTypeFromCameraDistance,
} from './emotionActing.js';
import {
  enrichAnchorsWithShotCoverage,
  inferActionTypeFromBodyAction,
  inferLightingAnchorIdFromLocationAnchors,
  inferSceneArchetype,
} from './shotGrammar.js';

export const IMAGE_APP_INPUT_EXPORT_VERSION = 'IMAGE-APP-INPUT-EXPORT-PHASE-93-v1' as const;
export const IMAGE_APP_INPUT_EXPORT_ID = 'IAE-song_master_01' as const;
export const IMAGE_APP_INPUT_EXPORT_JSON_PATH = 'exports/image-app-input-export.json' as const;
export const IMAGE_APP_INPUT_EXPORT_SCENE_COUNT = STORYBOARD_SEED_COUNT;
export const IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID = STORYBOARD_SONG_MASTER_ID;

export const REQUIRED_IMAGE_APP_PAYLOAD_FIELDS = [
  'payload_id',
  'storyboard_id',
  'scene_order',
  'image_prompt_pack_id',
  'acting_camera_id',
  'image_prompt',
  'negative_prompt',
  'acting_intent',
  'body_action',
  'gaze_direction',
  'hand_action',
  'posture_variation',
  'camera_angle',
  'camera_distance',
  'subject_blocking',
  'environment_interaction',
  'location_variation',
  'character_continuity_anchors',
  'location_continuity_anchors',
  'world_continuity_anchors',
] as const;

export type RequiredImageAppPayloadField = (typeof REQUIRED_IMAGE_APP_PAYLOAD_FIELDS)[number];

export const REQUIRED_IMAGE_APP_INPUT_EXPORT_FIELDS = [
  'export_id',
  'song_master_id',
  'scene_count',
  'image_prompt_pack_ids',
  'acting_camera_ids',
  'character_continuity_ids',
  'location_continuity_ids',
  'world_id',
  'image_app_payloads',
  'image_app_ready',
] as const;

export type RequiredImageAppInputExportField =
  (typeof REQUIRED_IMAGE_APP_INPUT_EXPORT_FIELDS)[number];

export interface ImageAppScenePayload {
  payload_id: string;
  storyboard_id: string;
  scene_order: number;
  image_prompt_pack_id: string;
  acting_camera_id: string;
  image_prompt: string;
  negative_prompt: string;
  acting_intent: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  posture_variation: string;
  camera_angle: string;
  camera_distance: string;
  subject_blocking: string;
  environment_interaction: string;
  location_variation: string;
  character_continuity_anchors: string[];
  location_continuity_anchors: string[];
  world_continuity_anchors: string[];
}

export interface ImageAppInputExport {
  export_id: typeof IMAGE_APP_INPUT_EXPORT_ID;
  song_master_id: typeof IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID;
  scene_count: typeof IMAGE_APP_INPUT_EXPORT_SCENE_COUNT;
  image_prompt_pack_ids: string[];
  acting_camera_ids: string[];
  character_continuity_ids: string[];
  location_continuity_ids: SeedLocationId[];
  world_id: typeof WORLD_CONTINUITY_WORLD_ID;
  image_app_payloads: ImageAppScenePayload[];
  image_app_ready: boolean;
}

function buildCharacterContinuityAnchorsForScene(storyboardId: string): string[] {
  const pairId = `PAIR-${storyboardId}`;
  const anchors: string[] = [];

  for (const entry of getCharacterContinuitySeedLibrary()) {
    if (!entry.scene_references.includes(pairId)) continue;
    anchors.push(...flattenCharacterContinuityAnchors(entry));
  }

  return [...new Set(anchors)].sort();
}

function flattenCharacterContinuityAnchors(entry: CharacterContinuityEntry): string[] {
  return [
    `continuity:${entry.continuity_id}`,
    `character:${entry.character_id}`,
    ...entry.identity_anchor.map((token) => `identity:${token}`),
    ...entry.facial_anchor.map((token) => `facial:${token}`),
    ...entry.body_anchor.map((token) => `body:${token}`),
    ...entry.hair_anchor.map((token) => `hair:${token}`),
    ...entry.clothing_anchor.map((token) => `clothing:${token}`),
    ...entry.behavior_anchor.map((token) => `behavior:${token}`),
    ...entry.relationship_anchor.map((token) => `relationship:${token}`),
  ];
}

function flattenLocationContinuityAnchors(entry: LocationContinuityEntry): string[] {
  return [
    `location:${entry.location_id}`,
    `location-name:${entry.location_name}`,
    ...entry.environment_anchor.map((token) => `environment:${token}`),
    ...entry.architecture_anchor.map((token) => `architecture:${token}`),
    ...entry.lighting_anchor.map((token) => `lighting:${token}`),
    ...entry.weather_anchor.map((token) => `weather:${token}`),
    ...entry.color_anchor.map((token) => `color:${token}`),
  ];
}

function buildLocationContinuityAnchorsForScene(storyboardId: string): string[] {
  return buildLocationContinuityAnchorsForSceneWithShotCoverage(
    storyboardId,
    undefined,
    undefined
  );
}

function buildLocationContinuityAnchorsForSceneWithShotCoverage(
  storyboardId: string,
  bodyAction?: string,
  actingIntent?: string
): string[] {
  const locationIds = getLocationsForStoryboardScene(storyboardId);
  const anchors: string[] = [];

  for (const locationId of locationIds) {
    const entry = getLocationContinuityById(locationId);
    if (!entry) continue;
    anchors.push(...flattenLocationContinuityAnchors(entry));
  }

  const uniqueAnchors = [...new Set(anchors)].sort();
  const primaryLocationId = locationIds[0] ?? 'gonegi_bedroom_01';

  if (!bodyAction || !actingIntent) {
    return uniqueAnchors;
  }

  return enrichAnchorsWithShotCoverage(uniqueAnchors, {
    scene_archetype: inferSceneArchetype(bodyAction, actingIntent, locationIds),
    location_id: primaryLocationId,
    lighting_anchor_id: inferLightingAnchorIdFromLocationAnchors(uniqueAnchors),
    action_type: inferActionTypeFromBodyAction(bodyAction),
  });
}

function flattenWorldContinuityAnchors(world: WorldContinuityEntry): string[] {
  return [
    `world:${world.world_id}`,
    `song-master:${world.song_master_id}`,
    ...world.world_tone.map((token) => `tone:${token}`),
    ...world.recurring_motifs.map((token) => `motif:${token}`),
    ...world.time_of_day_pattern.map((token) => `time:${token}`),
    ...world.weather_pattern.map((token) => `weather-pattern:${token}`),
    ...world.emotional_world_arc.map((token) => `arc:${token}`),
  ];
}

function buildWorldContinuityAnchors(): string[] {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  if (!world) return [];
  return flattenWorldContinuityAnchors(world);
}

function buildImageAppScenePayload(
  pack: ImagePromptPackEntry,
  acting: ImageActingCameraGrammarEntry,
  worldAnchors: string[]
): ImageAppScenePayload {
  return {
    payload_id: `PAYLOAD-${pack.storyboard_id}`,
    storyboard_id: pack.storyboard_id,
    scene_order: pack.scene_order,
    image_prompt_pack_id: pack.prompt_pack_id,
    acting_camera_id: acting.acting_camera_id,
    image_prompt: pack.image_prompt,
    negative_prompt: pack.negative_prompt,
    acting_intent: acting.acting_intent,
    body_action: acting.body_action,
    gaze_direction: acting.gaze_direction,
    hand_action: acting.hand_action,
    posture_variation: acting.posture_variation,
    camera_angle: acting.camera_angle,
    camera_distance: acting.camera_distance,
    subject_blocking: acting.subject_blocking,
    environment_interaction: acting.environment_interaction,
    location_variation: acting.location_variation,
    character_continuity_anchors: enrichAnchorsWithEmotionActing(
      buildCharacterContinuityAnchorsForScene(pack.storyboard_id),
      inferEmotionIdFromActingIntent(acting.acting_intent, acting.body_action),
      inferShotTypeFromCameraDistance(acting.camera_distance)
    ),
    location_continuity_anchors: enrichLocationContinuityAnchorsWithSceneCompositionForLocations(
      enrichLocationContinuityAnchorsWithRoomLayoutLock(
        enrichLocationContinuityAnchorsWithPropAnchor(
          enrichLocationContinuityAnchorsWithIndoorAnchor(
            buildLocationContinuityAnchorsForSceneWithShotCoverage(
              pack.storyboard_id,
              acting.body_action,
              acting.acting_intent
            ),
            getLocationsForStoryboardScene(pack.storyboard_id),
            acting.camera_distance
          ),
          getLocationsForStoryboardScene(pack.storyboard_id),
          acting.camera_distance
        ),
        getLocationsForStoryboardScene(pack.storyboard_id),
        acting.camera_distance
      ),
      getLocationsForStoryboardScene(pack.storyboard_id)
    ),
    world_continuity_anchors: [...worldAnchors],
  };
}

export function buildImageAppPayloads(): ImageAppScenePayload[] {
  const worldAnchors = buildWorldContinuityAnchors();
  const packs = getImagePromptPackSeedLibrary();

  return packs
    .map((pack) => {
      const acting = getImageActingCameraByImagePromptPackId(pack.prompt_pack_id);
      if (!acting) {
        throw new Error(`Missing acting camera grammar for ${pack.prompt_pack_id}`);
      }
      const payload = buildImageAppScenePayload(pack, acting, worldAnchors);
      return {
        ...payload,
        character_continuity_anchors: [...payload.character_continuity_anchors],
        location_continuity_anchors: [...payload.location_continuity_anchors],
        world_continuity_anchors: [...payload.world_continuity_anchors],
      };
    })
    .sort((left, right) => left.scene_order - right.scene_order);
}

export function buildImageAppInputExport(): ImageAppInputExport {
  const world = getWorldContinuityById(WORLD_CONTINUITY_WORLD_ID);
  if (!world) {
    throw new Error(`Missing world continuity ${WORLD_CONTINUITY_WORLD_ID}`);
  }

  const payloads = buildImageAppPayloads();
  const storyboardIds = getStoryboardSceneSeedLibrary().map((scene) => scene.storyboard_id);

  const imagePromptPackIds = payloads.map((payload) => payload.image_prompt_pack_id);
  const actingCameraIds = payloads.map((payload) => payload.acting_camera_id);

  const sceneCountMatches =
    payloads.length === IMAGE_APP_INPUT_EXPORT_SCENE_COUNT &&
    storyboardIds.length === IMAGE_APP_INPUT_EXPORT_SCENE_COUNT;

  return {
    export_id: IMAGE_APP_INPUT_EXPORT_ID,
    song_master_id: IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID,
    scene_count: IMAGE_APP_INPUT_EXPORT_SCENE_COUNT,
    image_prompt_pack_ids: [...imagePromptPackIds],
    acting_camera_ids: [...actingCameraIds],
    character_continuity_ids: [...world.character_continuity_ids],
    location_continuity_ids: [...world.location_continuity_ids],
    world_id: WORLD_CONTINUITY_WORLD_ID,
    image_app_payloads: payloads.map((payload) => ({
      ...payload,
      character_continuity_anchors: [...payload.character_continuity_anchors],
      location_continuity_anchors: [...payload.location_continuity_anchors],
      world_continuity_anchors: [...payload.world_continuity_anchors],
    })),
    image_app_ready: sceneCountMatches && payloads.length > 0,
  };
}

export function findDuplicatePayloadIds(payloadIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of payloadIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getImageAppPayloadByStoryboardId(
  storyboardId: string
): ImageAppScenePayload | undefined {
  return buildImageAppPayloads().find((payload) => payload.storyboard_id === storyboardId);
}

export function getImageAppPayloadById(payloadId: string): ImageAppScenePayload | undefined {
  return buildImageAppPayloads().find((payload) => payload.payload_id === payloadId);
}

export function getAllActingCameraIds(): string[] {
  return getImageActingCameraGrammarSeedLibrary().map((entry) => entry.acting_camera_id);
}

export function getAllImagePromptPackIds(): string[] {
  return getImagePromptPackSeedLibrary().map((pack) => pack.prompt_pack_id);
}

export function getAllCharacterContinuityIds(): string[] {
  return getCharacterContinuitySeedLibrary().map((entry) => entry.continuity_id);
}

export function getAllLocationContinuityIds(): SeedLocationId[] {
  return getLocationContinuitySeedLibrary().map((entry) => entry.location_id);
}

export function validateExportSongMasterId(songMasterId: string): boolean {
  return songMasterId === IMAGE_PROMPT_PACK_SONG_MASTER_ID;
}
