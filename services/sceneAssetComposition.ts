import fs from 'node:fs';
import path from 'node:path';
import { isIndoorAnchorTargetLocation } from './indoorLocationAnchor.js';
import { LOCATION_PROP_BINDINGS } from './propAnchor.js';
import { enrichLocationContinuityAnchorsWithOutdoorLayoutLock } from './outdoorLayoutLock.js';
import { enrichLocationContinuityAnchorsWithRoomLayoutLock } from './roomLayoutLock.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_COMPOSITION_LIBRARY_PATH =
  'datasets/scene/scene-asset-composition-library-v1.json' as const;
export const SCENE_COMPOSITION_INDEX_PATH =
  'datasets/scene/scene-asset-composition-index-v1.json' as const;
export const SCENE_COMPOSITION_ADAPTER_PATH =
  'exports/image_app/adapters/scene-asset-composition-adapter.json' as const;

export const SCENE_COMPOSITION_TARGET_IDS = [
  'gonegi_bedroom_reading',
  'gonegi_window_reflection',
  'dana_window_reading',
  'bakery_breakfast',
  'bakery_evening_cleanup',
  'olive_hill_rest',
  'harbor_watch_point',
  'harbor_sunset_bench',
] as const;

export type SceneCompositionTargetId = (typeof SCENE_COMPOSITION_TARGET_IDS)[number];

export const REQUIRED_SCENE_COMPOSITION_FIELDS = [
  'composition_id',
  'location_id',
  'layout_id',
  'prop_anchor_ids',
  'character_positions',
  'camera_position',
  'camera_height',
  'camera_direction',
  'visibility_requirements',
  'composition_priority',
  'forbidden_composition_changes',
] as const;

export const CORE_COMPOSITION_FORBIDDEN_RULES = [
  'do not swap character positions',
  'do not reverse composition',
  'do not remove required assets',
  'do not hide required anchors',
] as const;

export const COMPOSITION_IMAGE_APP_TOKEN_PREFIXES = [
  'composition-id:',
  'character-position:',
  'camera-direction:',
  'camera-height:',
  'composition-visibility:',
] as const;

export type SceneCompositionRecord = {
  composition_id: string;
  location_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  character_positions: Record<string, string>;
  camera_position: string;
  camera_height: string;
  camera_direction: string;
  visibility_requirements: readonly string[];
  composition_priority: string;
  forbidden_composition_changes: readonly string[];
};

export type SceneCompositionLibrary = {
  compositions: readonly SceneCompositionRecord[];
  composition_count?: number;
};

export type SceneCompositionIndexEntry = {
  composition_id: string;
  location_id: string;
  layout_id: string;
};

export type SceneCompositionIndex = {
  entries: readonly SceneCompositionIndexEntry[];
  composition_count?: number;
};

export type SceneCompositionRenderPayload = {
  composition_tokens: readonly string[];
  composition_id: string;
  layout_id: string;
  location_id: string;
  prop_anchor_ids: readonly string[];
  character_positions: Record<string, string>;
  camera_position: string;
  camera_height: string;
  camera_direction: string;
  visibility_requirements: readonly string[];
  forbidden_composition_changes: readonly string[];
};

export type CompositionMapEntry = {
  composition_id: string;
  location_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  composition_tokens: readonly string[];
  render_payload: SceneCompositionRenderPayload;
};

export type SceneCompositionAdapter = {
  composition_to_scene_map: readonly CompositionMapEntry[];
  location_to_composition_id: Record<string, string>;
};

export type SceneCompositionResolution = {
  composition_id: string;
  location_id: string;
  layout_id: string;
  composition_tokens: readonly string[];
  render_payload: SceneCompositionRenderPayload;
};

export const DEFAULT_COMPOSITION_BY_LOCATION: Record<string, SceneCompositionTargetId> = {
  gonegi_bedroom_01: 'gonegi_bedroom_reading',
  gonegi_window_corner_01: 'gonegi_window_reflection',
  dana_window_corner_01: 'dana_window_reading',
  family_bakery_dining_01: 'bakery_breakfast',
  family_bakery_kitchen_01: 'bakery_evening_cleanup',
  gonegi_olive_hill_01: 'olive_hill_rest',
  harbor_watch_point_01: 'harbor_watch_point',
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(resolveProjectRoot(projectRoot), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing scene composition asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadSceneCompositionLibrary(projectRoot?: string): SceneCompositionLibrary {
  return readJson(resolveProjectRoot(projectRoot), SCENE_COMPOSITION_LIBRARY_PATH);
}

export function loadSceneCompositionIndex(projectRoot?: string): SceneCompositionIndex {
  return readJson(resolveProjectRoot(projectRoot), SCENE_COMPOSITION_INDEX_PATH);
}

export function loadSceneCompositionAdapter(projectRoot?: string): SceneCompositionAdapter {
  return readJson(resolveProjectRoot(projectRoot), SCENE_COMPOSITION_ADAPTER_PATH);
}

export function getSceneCompositionById(
  compositionId: string,
  projectRoot?: string
): SceneCompositionRecord | null {
  const library = loadSceneCompositionLibrary(projectRoot);
  return library.compositions.find((row) => row.composition_id === compositionId) ?? null;
}

export function buildSceneCompositionTokens(composition: SceneCompositionRecord): string[] {
  const characterPositionTokens = Object.entries(composition.character_positions).map(
    ([characterId, position]) => `character-position:${characterId}@${position}`
  );
  const visibilityTokens = composition.visibility_requirements.map(
    (rule) => `composition-visibility:${rule}`
  );

  return [
    `composition-id:${composition.composition_id}`,
    `composition-location:${composition.location_id}`,
    `composition-layout:${composition.layout_id}`,
    ...characterPositionTokens,
    `camera-direction:${composition.camera_direction}`,
    `camera-height:${composition.camera_height}`,
    `camera-position:${composition.camera_position}`,
    `composition-priority:${composition.composition_priority}`,
    ...visibilityTokens,
    ...composition.prop_anchor_ids.map((id) => `composition-prop:${id}`),
  ];
}

export function buildSceneCompositionRenderPayload(
  composition: SceneCompositionRecord
): SceneCompositionRenderPayload {
  return {
    composition_tokens: buildSceneCompositionTokens(composition),
    composition_id: composition.composition_id,
    layout_id: composition.layout_id,
    location_id: composition.location_id,
    prop_anchor_ids: [...composition.prop_anchor_ids],
    character_positions: { ...composition.character_positions },
    camera_position: composition.camera_position,
    camera_height: composition.camera_height,
    camera_direction: composition.camera_direction,
    visibility_requirements: [...composition.visibility_requirements],
    forbidden_composition_changes: [...composition.forbidden_composition_changes],
  };
}

export function resolveSceneComposition(
  compositionId: string,
  projectRoot?: string
): SceneCompositionResolution | null {
  const composition = getSceneCompositionById(compositionId, projectRoot);
  if (!composition) return null;

  const renderPayload = buildSceneCompositionRenderPayload(composition);
  const tokens = [
    ...renderPayload.composition_tokens,
    ...renderPayload.forbidden_composition_changes.map(
      (rule) => `composition-forbidden:${rule}`
    ),
  ];

  return {
    composition_id: composition.composition_id,
    location_id: composition.location_id,
    layout_id: composition.layout_id,
    composition_tokens: [...new Set(tokens)].sort(),
    render_payload: renderPayload,
  };
}

export function resolveSceneCompositionByLocationId(
  locationId: string,
  projectRoot?: string
): SceneCompositionResolution | null {
  const compositionId = DEFAULT_COMPOSITION_BY_LOCATION[locationId];
  if (!compositionId) return null;
  return resolveSceneComposition(compositionId, projectRoot);
}

export function enrichLocationContinuityAnchorsWithSceneComposition(
  anchors: readonly string[],
  compositionId: string,
  projectRoot?: string
): string[] {
  const resolution = resolveSceneComposition(compositionId, projectRoot);
  if (!resolution) return [...anchors];
  return [...new Set([...anchors, ...resolution.composition_tokens])].sort();
}

export function enrichLocationContinuityAnchorsWithSceneCompositionForLocations(
  anchors: readonly string[],
  locationIds: readonly string[],
  projectRoot?: string
): string[] {
  let merged = [...anchors];
  const applied = new Set<string>();

  for (const locationId of locationIds) {
    const compositionId = DEFAULT_COMPOSITION_BY_LOCATION[locationId];
    if (!compositionId || applied.has(compositionId)) continue;
    applied.add(compositionId);
    merged = enrichLocationContinuityAnchorsWithSceneComposition(
      merged,
      compositionId,
      projectRoot
    );
  }

  return merged;
}

export function enrichLocationContinuityForLocationWithFullStack(
  anchors: readonly string[],
  locationId: string,
  shotTypeOrDistance: string,
  projectRoot?: string
): string[] {
  let merged = [...anchors];
  const compositionId = DEFAULT_COMPOSITION_BY_LOCATION[locationId];

  if (isIndoorAnchorTargetLocation(locationId)) {
    merged = enrichLocationContinuityAnchorsWithRoomLayoutLock(
      merged,
      [locationId],
      shotTypeOrDistance,
      projectRoot
    );
  } else {
    merged = enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
      merged,
      [locationId],
      shotTypeOrDistance,
      projectRoot,
      compositionId,
      'v2'
    );
  }

  if (compositionId) {
    merged = enrichLocationContinuityAnchorsWithSceneComposition(
      merged,
      compositionId,
      projectRoot
    );
  }

  return merged;
}

export function buildCompositionMapEntry(
  composition: SceneCompositionRecord
): CompositionMapEntry {
  const renderPayload = buildSceneCompositionRenderPayload(composition);
  const propIds =
    composition.prop_anchor_ids.length > 0
      ? composition.prop_anchor_ids
      : LOCATION_PROP_BINDINGS[composition.location_id] ?? [];

  return {
    composition_id: composition.composition_id,
    location_id: composition.location_id,
    layout_id: composition.layout_id,
    prop_anchor_ids: [...propIds],
    composition_tokens: renderPayload.composition_tokens,
    render_payload: renderPayload,
  };
}

export function buildSceneCompositionAdapterFromLibrary(
  library: SceneCompositionLibrary,
  parentAdapterReference = 'exports/image_app/adapters/room-layout-lock-adapter.json'
): Record<string, unknown> {
  const compositionToSceneMap = library.compositions.map(buildCompositionMapEntry);
  const locationToCompositionId = Object.fromEntries(
    library.compositions.map((row) => [row.location_id, row.composition_id])
  );

  return {
    adapter_type: 'scene_asset_composition_image_adapter',
    adapter_metadata: {
      adapter_name: 'scene-asset-composition-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-SAC-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      composition_count: library.compositions.length,
      library_reference: SCENE_COMPOSITION_LIBRARY_PATH,
      index_reference: SCENE_COMPOSITION_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
    },
    adapter_responsibility_chain: [
      'location_id',
      'layout_id',
      'prop_anchor_ids',
      'composition_id',
      'render_payload',
    ],
    composition_to_scene_map: compositionToSceneMap,
    location_to_composition_id: locationToCompositionId,
    image_app_token_contract: {
      required_prefixes: [...COMPOSITION_IMAGE_APP_TOKEN_PREFIXES],
      injection_layer: 'location_continuity_anchors',
    },
    runtime_verification_fields: {
      composition_id: { exported: true, required_for_scene: true },
      composition_tokens: { exported: true, required_for_scene: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Image App must read composition-id, character-position, camera-direction, camera-height, composition-visibility tokens; FAIL if ignored.',
    },
    image_app_contract: {
      supported_composition_ids: [...SCENE_COMPOSITION_TARGET_IDS],
      resolution_flow: {
        step_1: 'resolve location_id and locked layout_id',
        step_2: 'attach prop_anchor_ids from composition',
        step_3: 'apply composition_id with character_positions and camera framing',
        step_4: 'merge render_payload composition tokens into continuity layer',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_012_validation_target: {
      test_id: 'RKB-012',
      test_name: 'SCENE_COMPOSITION_CONTINUITY_VALIDATION',
      success_condition:
        'Whole-scene composition remains stable across generations; required assets and character positions hold.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'room_layout_lock_adapter',
          reference_path: parentAdapterReference,
        },
        {
          asset_id: 'scene_asset_composition_library_v1',
          reference_path: SCENE_COMPOSITION_LIBRARY_PATH,
        },
      ],
    },
  };
}

export function verifyCompositionTokensInjected(tokens: readonly string[]): boolean {
  return COMPOSITION_IMAGE_APP_TOKEN_PREFIXES.every((prefix) =>
    tokens.some((token) => token.startsWith(prefix))
  );
}
