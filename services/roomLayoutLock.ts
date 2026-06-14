import fs from 'node:fs';
import path from 'node:path';
import {
  INDOOR_ANCHOR_TARGET_LOCATION_IDS,
  isIndoorAnchorTargetLocation,
  loadIndoorLocationAnchorAdapter,
  resolveIndoorLocationAnchor,
} from './indoorLocationAnchor.js';
import { mapShotTypeToPropCameraRule } from './propAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ROOM_LAYOUT_LOCK_LIBRARY_PATH =
  'datasets/location/room-layout-lock-library-v1.json' as const;
export const ROOM_LAYOUT_LOCK_INDEX_PATH =
  'datasets/location/room-layout-lock-index-v1.json' as const;
export const ROOM_LAYOUT_LOCK_ADAPTER_PATH =
  'exports/image_app/adapters/room-layout-lock-adapter.json' as const;

export const ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS = [...INDOOR_ANCHOR_TARGET_LOCATION_IDS] as const;

export type RoomLayoutLockLocationId = (typeof ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS)[number];

export const REQUIRED_ROOM_LAYOUT_LOCK_FIELDS = [
  'layout_id',
  'location_id',
  'room_shape',
  'window_wall',
  'door_wall',
  'room_orientation',
  'anchor_object_positions',
  'secondary_object_positions',
  'camera_visibility_rules',
  'walkable_zones',
  'forbidden_layout_changes',
] as const;

export const CORE_LAYOUT_FORBIDDEN_RULES = [
  'do not move anchor furniture',
  'do not rotate room',
  'do not swap window wall',
  'do not relocate anchor props',
] as const;

export const LAYOUT_IMAGE_APP_TOKEN_PREFIXES = [
  'layout-lock:',
  'room-orientation:',
  'window-wall:',
  'anchor-position:',
  'camera-visibility:',
] as const;

export const LAYOUT_CAMERA_RULE_KEYS = [
  'wide',
  'medium',
  'close',
  'insert',
  'reaction',
  'pov',
] as const;

export type LayoutCameraRuleKey = (typeof LAYOUT_CAMERA_RULE_KEYS)[number];

export type RoomLayoutLockRecord = {
  layout_id: string;
  location_id: string;
  indoor_anchor_id?: string;
  room_shape: string;
  window_wall: string;
  door_wall: string;
  room_orientation: string;
  anchor_object_positions: Record<string, string>;
  secondary_object_positions: Record<string, string>;
  camera_visibility_rules: Record<LayoutCameraRuleKey, string>;
  walkable_zones: readonly string[];
  forbidden_layout_changes: readonly string[];
};

export type RoomLayoutLockLibrary = {
  layouts: readonly RoomLayoutLockRecord[];
  layout_count?: number;
};

export type RoomLayoutLockIndexEntry = {
  layout_id: string;
  location_id: string;
  window_wall: string;
  room_orientation: string;
};

export type RoomLayoutLockIndex = {
  entries: readonly RoomLayoutLockIndexEntry[];
  layout_count?: number;
};

export type RoomLayoutLockRenderPayload = {
  layout_tokens: readonly string[];
  layout_id: string;
  room_orientation: string;
  window_wall: string;
  anchor_positions: readonly string[];
  walkable_zones: readonly string[];
  forbidden_layout_changes: readonly string[];
  active_camera_visibility: string;
};

export type LocationLayoutMapEntry = {
  location_id: string;
  indoor_anchor_id: string;
  layout_id: string;
  layout_tokens: readonly string[];
  render_payload: RoomLayoutLockRenderPayload;
};

export type RoomLayoutLockAdapter = {
  location_to_layout_map: readonly LocationLayoutMapEntry[];
};

export type RoomLayoutLockResolution = {
  location_id: string;
  indoor_anchor_id: string;
  layout_id: string;
  layout_tokens: readonly string[];
  render_payload: RoomLayoutLockRenderPayload;
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(resolveProjectRoot(projectRoot), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing room layout lock asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadRoomLayoutLockLibrary(projectRoot?: string): RoomLayoutLockLibrary {
  return readJson(resolveProjectRoot(projectRoot), ROOM_LAYOUT_LOCK_LIBRARY_PATH);
}

export function loadRoomLayoutLockIndex(projectRoot?: string): RoomLayoutLockIndex {
  return readJson(resolveProjectRoot(projectRoot), ROOM_LAYOUT_LOCK_INDEX_PATH);
}

export function loadRoomLayoutLockAdapter(projectRoot?: string): RoomLayoutLockAdapter {
  return readJson(resolveProjectRoot(projectRoot), ROOM_LAYOUT_LOCK_ADAPTER_PATH);
}

export function mapShotTypeToLayoutCameraRule(shotTypeOrDistance: string): LayoutCameraRuleKey {
  return mapShotTypeToPropCameraRule(shotTypeOrDistance) as LayoutCameraRuleKey;
}

export function buildRoomLayoutLockTokens(
  layout: RoomLayoutLockRecord,
  shotTypeOrDistance = 'medium'
): string[] {
  const cameraKey = mapShotTypeToLayoutCameraRule(shotTypeOrDistance);
  const anchorPositionTokens = Object.entries(layout.anchor_object_positions).map(
    ([objectId, position]) => `anchor-position:${objectId}@${position}`
  );

  return [
    `layout-lock:${layout.layout_id}`,
    `room-orientation:${layout.room_orientation}`,
    `window-wall:${layout.window_wall}`,
    `door-wall:${layout.door_wall}`,
    `room-shape:${layout.room_shape}`,
    ...anchorPositionTokens,
    `camera-visibility:${layout.camera_visibility_rules[cameraKey]}`,
    ...layout.walkable_zones.map((zone) => `walkable-zone:${zone}`),
  ];
}

export function buildRoomLayoutLockRenderPayload(
  layout: RoomLayoutLockRecord,
  shotTypeOrDistance = 'medium'
): RoomLayoutLockRenderPayload {
  const cameraKey = mapShotTypeToLayoutCameraRule(shotTypeOrDistance);
  const anchorPositions = Object.entries(layout.anchor_object_positions).map(
    ([objectId, position]) => `${objectId}@${position}`
  );

  return {
    layout_tokens: buildRoomLayoutLockTokens(layout, shotTypeOrDistance),
    layout_id: layout.layout_id,
    room_orientation: layout.room_orientation,
    window_wall: layout.window_wall,
    anchor_positions: anchorPositions,
    walkable_zones: [...layout.walkable_zones],
    forbidden_layout_changes: [...layout.forbidden_layout_changes],
    active_camera_visibility: layout.camera_visibility_rules[cameraKey],
  };
}

export function getRoomLayoutByLocationId(
  locationId: string,
  projectRoot?: string
): RoomLayoutLockRecord | null {
  const library = loadRoomLayoutLockLibrary(projectRoot);
  return library.layouts.find((row) => row.location_id === locationId) ?? null;
}

export function resolveRoomLayoutLock(
  locationId: string,
  shotTypeOrDistance = 'medium',
  projectRoot?: string
): RoomLayoutLockResolution | null {
  if (!isIndoorAnchorTargetLocation(locationId)) {
    return null;
  }

  const layout = getRoomLayoutByLocationId(locationId, projectRoot);
  if (!layout) return null;

  const indoor = resolveIndoorLocationAnchor(locationId, shotTypeOrDistance, projectRoot);
  if (!indoor) return null;

  const renderPayload = buildRoomLayoutLockRenderPayload(layout, shotTypeOrDistance);
  const layoutTokens = [
    ...renderPayload.layout_tokens,
    `layout-indoor-anchor:${indoor.anchor_id}`,
    ...renderPayload.forbidden_layout_changes.map((rule) => `layout-forbidden:${rule}`),
  ];

  return {
    location_id: locationId,
    indoor_anchor_id: indoor.anchor_id,
    layout_id: layout.layout_id,
    layout_tokens: [...new Set(layoutTokens)].sort(),
    render_payload: renderPayload,
  };
}

export function buildLayoutContinuityTokens(resolution: RoomLayoutLockResolution): string[] {
  return resolution.layout_tokens;
}

export function enrichLocationContinuityAnchorsWithRoomLayoutLock(
  anchors: readonly string[],
  locationIds: readonly string[],
  shotTypeOrDistance: string,
  projectRoot?: string
): string[] {
  const merged = [...anchors];

  for (const locationId of locationIds) {
    const resolution = resolveRoomLayoutLock(locationId, shotTypeOrDistance, projectRoot);
    if (!resolution) continue;
    merged.push(...buildLayoutContinuityTokens(resolution));
  }

  return [...new Set(merged)].sort();
}

export function buildLocationLayoutMapEntry(
  layout: RoomLayoutLockRecord,
  shotTypeOrDistance = 'medium',
  projectRoot?: string
): LocationLayoutMapEntry | null {
  const indoorAdapter = loadIndoorLocationAnchorAdapter(projectRoot);
  const indoorEntry = indoorAdapter.location_to_anchor_map.find(
    (row) => row.location_id === layout.location_id
  );
  if (!indoorEntry) return null;

  const renderPayload = buildRoomLayoutLockRenderPayload(layout, shotTypeOrDistance);

  return {
    location_id: layout.location_id,
    indoor_anchor_id: indoorEntry.anchor_id ?? indoorEntry.indoor_anchor_id,
    layout_id: layout.layout_id,
    layout_tokens: renderPayload.layout_tokens,
    render_payload: renderPayload,
  };
}

export function buildRoomLayoutLockAdapterFromLibrary(
  library: RoomLayoutLockLibrary,
  parentAdapterReference = 'exports/image_app/adapters/prop-anchor-adapter.json'
): Record<string, unknown> {
  const locationToLayoutMap = library.layouts
    .map((layout) => buildLocationLayoutMapEntry(layout))
    .filter((row): row is LocationLayoutMapEntry => row !== null);

  return {
    adapter_type: 'room_layout_lock_image_adapter',
    adapter_metadata: {
      adapter_name: 'room-layout-lock-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-RLL-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      layout_count: library.layouts.length,
      library_reference: ROOM_LAYOUT_LOCK_LIBRARY_PATH,
      index_reference: ROOM_LAYOUT_LOCK_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
    },
    adapter_responsibility_chain: [
      'location_id',
      'indoor_anchor_id',
      'prop_anchor_ids',
      'layout_id',
      'render_payload',
    ],
    location_to_layout_map: locationToLayoutMap,
    image_app_token_contract: {
      required_prefixes: [...LAYOUT_IMAGE_APP_TOKEN_PREFIXES],
      injection_layer: 'location_continuity_anchors',
    },
    runtime_verification_fields: {
      layout_id: { exported: true, required_for_indoor: true },
      layout_tokens: { exported: true, required_for_indoor: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Image App must read layout-lock, room-orientation, window-wall, anchor-position, camera-visibility tokens; FAIL if ignored.',
    },
    image_app_contract: {
      supported_location_ids: [...ROOM_LAYOUT_LOCK_TARGET_LOCATION_IDS],
      resolution_flow: {
        step_1: 'resolve location_id from shot',
        step_2: 'lookup indoor_anchor_id and prop_anchor_ids from upstream adapters',
        step_3: 'attach layout_id and locked anchor_object_positions',
        step_4: 'merge render_payload layout tokens into location continuity only',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_011_validation_target: {
      test_id: 'RKB-011',
      test_name: 'ROOM_LAYOUT_CONTINUITY_VALIDATION',
      review_criteria: [
        'anchor_furniture_position',
        'object_position_stability',
        'room_orientation_stability',
        'window_wall_consistency',
      ],
      success_condition:
        'Locked layouts remain recognizable across generations; no orientation or anchor furniture drift.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'indoor_location_anchor_adapter',
          reference_path: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
        },
        {
          asset_id: 'prop_anchor_adapter',
          reference_path: parentAdapterReference,
        },
        {
          asset_id: 'room_layout_lock_library_v1',
          reference_path: ROOM_LAYOUT_LOCK_LIBRARY_PATH,
        },
      ],
    },
  };
}

export function verifyLayoutTokensInjected(tokens: readonly string[]): boolean {
  return LAYOUT_IMAGE_APP_TOKEN_PREFIXES.every((prefix) =>
    tokens.some((token) => token.startsWith(prefix))
  );
}
