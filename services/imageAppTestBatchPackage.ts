import {
  IMAGE_APP_INPUT_EXPORT_ID,
  IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID,
  type ImageAppInputExport,
  type ImageAppScenePayload,
} from './imageAppInputExport.js';
import { loadImageAppInputExport } from './imageAppInputQualityGate.js';

export const IMAGE_APP_TEST_BATCH_VERSION = 'IMAGE-APP-TEST-BATCH-PHASE-95-v1' as const;
export const IMAGE_APP_TEST_BATCH_ID = 'BATCH-IAE-song_master_01-test-v1' as const;
export const IMAGE_APP_TEST_BATCH_JSON_PATH = 'exports/image-app-test-batch-package.json' as const;
export const IMAGE_APP_TEST_BATCH_SCENE_COUNT = 3 as const;

export const IMAGE_APP_TEST_BATCH_PURPOSE =
  'Minimal AI Studio smoke batch for song_master_01 covering intro waiting, emotional acting depth, and location-camera variation without generation.' as const;

export type TestBatchSelectionCategory =
  | 'intro_waiting'
  | 'emotion_acting'
  | 'location_camera';

export interface TestBatchSelectionRule {
  category: TestBatchSelectionCategory;
  storyboard_id: string;
  scene_order: number;
  selection_reason: string;
}

export const TEST_BATCH_SELECTION_RULES: readonly TestBatchSelectionRule[] = [
  {
    category: 'intro_waiting',
    storyboard_id: 'SBD-song_master_01-01',
    scene_order: 1,
    selection_reason:
      'Opening intro waiting scene with station_waiting anchor, anticipation behavior, and wide establishing platform grammar',
  },
  {
    category: 'emotion_acting',
    storyboard_id: 'SBD-song_master_01-02',
    scene_order: 2,
    selection_reason:
      'Isolation memory scene with collapsed inward body action, downward gaze, and close hand-detail emotional acting',
  },
  {
    category: 'location_camera',
    storyboard_id: 'SBD-song_master_01-13',
    scene_order: 13,
    selection_reason:
      'Rooftop farewell with silhouette_distance camera, skyline scan gaze, and elevated location variation',
  },
] as const;

export const REQUIRED_TEST_BATCH_FIELDS = [
  'batch_id',
  'source_export_id',
  'scene_count',
  'selected_payloads',
  'test_purpose',
  'ai_studio_ready',
] as const;

export type RequiredTestBatchField = (typeof REQUIRED_TEST_BATCH_FIELDS)[number];

export interface TestBatchSelectedPayload extends ImageAppScenePayload {
  selection_category: TestBatchSelectionCategory;
  selection_reason: string;
}

export interface ImageAppTestBatchPackage {
  batch_id: typeof IMAGE_APP_TEST_BATCH_ID;
  source_export_id: typeof IMAGE_APP_INPUT_EXPORT_ID;
  scene_count: typeof IMAGE_APP_TEST_BATCH_SCENE_COUNT;
  selected_payloads: TestBatchSelectedPayload[];
  test_purpose: typeof IMAGE_APP_TEST_BATCH_PURPOSE;
  ai_studio_ready: boolean;
}

export const REQUIRED_ACTING_CAMERA_BATCH_FIELDS = [
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
] as const;

export const REQUIRED_CONTINUITY_ANCHOR_FIELDS = [
  'character_continuity_anchors',
  'location_continuity_anchors',
  'world_continuity_anchors',
] as const;

function findPayloadInExport(
  exportDoc: ImageAppInputExport,
  storyboardId: string
): ImageAppScenePayload | undefined {
  return exportDoc.image_app_payloads.find((payload) => payload.storyboard_id === storyboardId);
}

function cloneSelectedPayload(
  payload: ImageAppScenePayload,
  rule: TestBatchSelectionRule
): TestBatchSelectedPayload {
  return {
    ...payload,
    selection_category: rule.category,
    selection_reason: rule.selection_reason,
    character_continuity_anchors: [...payload.character_continuity_anchors],
    location_continuity_anchors: [...payload.location_continuity_anchors],
    world_continuity_anchors: [...payload.world_continuity_anchors],
  };
}

export function selectTestBatchPayloads(
  exportDoc: ImageAppInputExport
): TestBatchSelectedPayload[] {
  const selected: TestBatchSelectedPayload[] = [];

  for (const rule of TEST_BATCH_SELECTION_RULES) {
    const payload = findPayloadInExport(exportDoc, rule.storyboard_id);
    if (!payload) {
      throw new Error(`Missing export payload for test batch scene ${rule.storyboard_id}`);
    }
    if (payload.scene_order !== rule.scene_order) {
      throw new Error(
        `Scene order mismatch for ${rule.storyboard_id}: expected ${rule.scene_order}, got ${payload.scene_order}`
      );
    }
    selected.push(cloneSelectedPayload(payload, rule));
  }

  return selected.sort((left, right) => left.scene_order - right.scene_order);
}

export function buildImageAppTestBatchPackage(
  exportDoc: ImageAppInputExport
): ImageAppTestBatchPackage {
  if (exportDoc.export_id !== IMAGE_APP_INPUT_EXPORT_ID) {
    throw new Error(`Expected source export ${IMAGE_APP_INPUT_EXPORT_ID}`);
  }

  if (exportDoc.song_master_id !== IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID) {
    throw new Error(`Expected song master ${IMAGE_APP_INPUT_EXPORT_SONG_MASTER_ID}`);
  }

  const selectedPayloads = selectTestBatchPayloads(exportDoc);
  const categories = new Set(selectedPayloads.map((payload) => payload.selection_category));
  const ready =
    selectedPayloads.length === IMAGE_APP_TEST_BATCH_SCENE_COUNT &&
    categories.size === IMAGE_APP_TEST_BATCH_SCENE_COUNT &&
    exportDoc.image_app_ready;

  return {
    batch_id: IMAGE_APP_TEST_BATCH_ID,
    source_export_id: exportDoc.export_id,
    scene_count: IMAGE_APP_TEST_BATCH_SCENE_COUNT,
    selected_payloads: selectedPayloads.map((payload) => ({
      ...payload,
      character_continuity_anchors: [...payload.character_continuity_anchors],
      location_continuity_anchors: [...payload.location_continuity_anchors],
      world_continuity_anchors: [...payload.world_continuity_anchors],
    })),
    test_purpose: IMAGE_APP_TEST_BATCH_PURPOSE,
    ai_studio_ready: ready,
  };
}

export function buildImageAppTestBatchPackageFromProject(
  projectRoot: string
): ImageAppTestBatchPackage {
  const exportDoc = loadImageAppInputExport(projectRoot);
  if (!exportDoc) {
    throw new Error(`${IMAGE_APP_INPUT_EXPORT_ID} export not found for test batch`);
  }
  return buildImageAppTestBatchPackage(exportDoc);
}

export function findDuplicateBatchPayloadIds(payloadIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const id of payloadIds) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }

  return [...duplicates].sort();
}

export function getTestBatchSelectionStoryboardIds(): string[] {
  return TEST_BATCH_SELECTION_RULES.map((rule) => rule.storyboard_id);
}

export function getTestBatchSelectionCategories(): TestBatchSelectionCategory[] {
  return TEST_BATCH_SELECTION_RULES.map((rule) => rule.category);
}

export function getPayloadFromExportByStoryboardId(
  exportDoc: ImageAppInputExport,
  storyboardId: string
): ImageAppScenePayload | undefined {
  return findPayloadInExport(exportDoc, storyboardId);
}
