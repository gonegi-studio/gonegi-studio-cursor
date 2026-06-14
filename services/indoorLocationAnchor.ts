import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const INDOOR_LOCATION_ANCHOR_LIBRARY_PATH =
  'datasets/location/indoor-location-anchor-library-v1.json' as const;
export const INDOOR_LOCATION_ANCHOR_INDEX_PATH =
  'datasets/location/indoor-location-anchor-index-v1.json' as const;
export const INDOOR_LOCATION_ANCHOR_ADAPTER_PATH =
  'exports/image_app/adapters/indoor-location-anchor-adapter.json' as const;

export const INDOOR_ANCHOR_TARGET_LOCATION_IDS = [
  'gonegi_bedroom_01',
  'gonegi_window_corner_01',
  'family_bakery_kitchen_01',
  'family_bakery_dining_01',
  'dana_bedroom_01',
  'dana_window_corner_01',
] as const;

export type IndoorAnchorTargetLocationId = (typeof INDOOR_ANCHOR_TARGET_LOCATION_IDS)[number];

export const REQUIRED_ANCHOR_RECORD_FIELDS = [
  'anchor_id',
  'location_id',
  'room_layout',
  'window_positions',
  'door_positions',
  'major_furniture_positions',
  'fixed_anchor_objects',
  'secondary_anchor_objects',
  'wall_material',
  'floor_material',
  'ceiling_type',
  'visual_memory_tokens',
  'forbidden_mutation_rules',
  'camera_view_rules',
] as const;

export type IndoorLocationAnchorRecord = {
  anchor_id: string;
  location_id: string;
  room_layout: Record<string, unknown>;
  window_positions: readonly string[];
  door_positions: readonly string[];
  major_furniture_positions: readonly string[];
  fixed_anchor_objects: readonly string[];
  secondary_anchor_objects: readonly string[];
  wall_material: string;
  floor_material: string;
  ceiling_type: string;
  visual_memory_tokens: readonly string[];
  forbidden_mutation_rules: readonly string[];
  camera_view_rules: {
    wide: string;
    medium: string;
    close: string;
  };
};

export type IndoorLocationAnchorLibrary = {
  anchors: readonly IndoorLocationAnchorRecord[];
  target_indoor_locations?: readonly string[];
  anchor_count?: number;
};

export type IndoorLocationAnchorIndexEntry = {
  anchor_id: string;
  location_id: string;
};

export type IndoorLocationAnchorIndex = {
  entries: readonly IndoorLocationAnchorIndexEntry[];
  anchor_count?: number;
};

export type IndoorAnchorRenderPayload = {
  spatial_tokens: readonly string[];
  materials: { wall: string; floor: string; ceiling: string };
  layout_orientation: string;
  forbidden_mutation_rules: readonly string[];
  window_positions: readonly string[];
  door_positions: readonly string[];
  major_furniture_positions: readonly string[];
};

export type IndoorLocationAnchorMapEntry = {
  location_id: string;
  anchor_id: string;
  indoor_anchor_id: string;
  fixed_anchor_objects: readonly string[];
  anchor_objects: readonly string[];
  secondary_anchor_objects: readonly string[];
  camera_view_rules: IndoorLocationAnchorRecord['camera_view_rules'];
  camera_rules: IndoorLocationAnchorRecord['camera_view_rules'];
  render_payload: IndoorAnchorRenderPayload;
};

export type IndoorLocationAnchorAdapter = {
  location_to_anchor_map: readonly IndoorLocationAnchorMapEntry[];
  image_app_contract?: { supported_location_ids?: readonly string[] };
};

export type IndoorAnchorResolution = {
  location_id: string;
  anchor_id: string;
  fixed_anchor_objects: readonly string[];
  camera_view_rules: IndoorLocationAnchorRecord['camera_view_rules'];
  active_camera_rule: string;
  render_payload: IndoorAnchorRenderPayload;
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(resolveProjectRoot(projectRoot), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing indoor location anchor asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadIndoorLocationAnchorLibrary(projectRoot?: string): IndoorLocationAnchorLibrary {
  return readJson(resolveProjectRoot(projectRoot), INDOOR_LOCATION_ANCHOR_LIBRARY_PATH);
}

export function loadIndoorLocationAnchorIndex(projectRoot?: string): IndoorLocationAnchorIndex {
  return readJson(resolveProjectRoot(projectRoot), INDOOR_LOCATION_ANCHOR_INDEX_PATH);
}

export function loadIndoorLocationAnchorAdapter(
  projectRoot?: string
): IndoorLocationAnchorAdapter {
  return readJson(resolveProjectRoot(projectRoot), INDOOR_LOCATION_ANCHOR_ADAPTER_PATH);
}

export function isIndoorAnchorTargetLocation(
  locationId: string
): locationId is IndoorAnchorTargetLocationId {
  return (INDOOR_ANCHOR_TARGET_LOCATION_IDS as readonly string[]).includes(locationId);
}

export function mapCameraDistanceToViewScale(
  cameraDistance: string
): keyof IndoorLocationAnchorRecord['camera_view_rules'] {
  const normalized = cameraDistance.toLowerCase();
  if (normalized.includes('close') || normalized.includes('mid-close')) {
    return 'close';
  }
  if (normalized.includes('wide') || normalized.includes('extreme-wide')) {
    return 'wide';
  }
  return 'medium';
}

export function resolveIndoorLocationAnchor(
  locationId: string,
  cameraDistance: string,
  projectRoot?: string
): IndoorAnchorResolution | null {
  if (!isIndoorAnchorTargetLocation(locationId)) {
    return null;
  }

  const adapter = loadIndoorLocationAnchorAdapter(projectRoot);
  const entry = adapter.location_to_anchor_map.find((row) => row.location_id === locationId);
  if (!entry) {
    return null;
  }

  const viewScale = mapCameraDistanceToViewScale(cameraDistance);
  const cameraViewRules = entry.camera_view_rules ?? entry.camera_rules;

  return {
    location_id: entry.location_id,
    anchor_id: entry.anchor_id ?? entry.indoor_anchor_id,
    fixed_anchor_objects: entry.fixed_anchor_objects ?? entry.anchor_objects,
    camera_view_rules: cameraViewRules,
    active_camera_rule: cameraViewRules[viewScale],
    render_payload: entry.render_payload,
  };
}

export function buildIndoorAnchorContinuityTokens(resolution: IndoorAnchorResolution): string[] {
  const tokens = [
    `indoor-anchor:${resolution.anchor_id}`,
    `layout:${resolution.render_payload.layout_orientation}`,
    `camera-rule:${resolution.active_camera_rule}`,
    ...resolution.fixed_anchor_objects.map((object) => `anchor-object:${object}`),
    ...resolution.render_payload.spatial_tokens.map((token) => `spatial:${token}`),
    `material-wall:${resolution.render_payload.materials.wall}`,
    `material-floor:${resolution.render_payload.materials.floor}`,
    `material-ceiling:${resolution.render_payload.materials.ceiling}`,
  ];

  return [...new Set(tokens)];
}

export function enrichLocationContinuityAnchorsWithIndoorAnchor(
  anchors: readonly string[],
  locationIds: readonly string[],
  cameraDistance: string,
  projectRoot?: string
): string[] {
  const merged = [...anchors];

  for (const locationId of locationIds) {
    const resolution = resolveIndoorLocationAnchor(locationId, cameraDistance, projectRoot);
    if (!resolution) continue;
    merged.push(...buildIndoorAnchorContinuityTokens(resolution));
  }

  return [...new Set(merged)].sort();
}

export function buildIndoorLocationAnchorMapEntry(
  anchor: IndoorLocationAnchorRecord
): IndoorLocationAnchorMapEntry {
  const roomLayout = anchor.room_layout as { orientation?: string };
  return {
    location_id: anchor.location_id,
    anchor_id: anchor.anchor_id,
    indoor_anchor_id: anchor.anchor_id,
    fixed_anchor_objects: [...anchor.fixed_anchor_objects],
    anchor_objects: [...anchor.fixed_anchor_objects],
    secondary_anchor_objects: [...anchor.secondary_anchor_objects],
    camera_view_rules: { ...anchor.camera_view_rules },
    camera_rules: { ...anchor.camera_view_rules },
    render_payload: {
      spatial_tokens: [...anchor.visual_memory_tokens],
      materials: {
        wall: anchor.wall_material,
        floor: anchor.floor_material,
        ceiling: anchor.ceiling_type,
      },
      layout_orientation: roomLayout.orientation ?? 'unspecified',
      forbidden_mutation_rules: [...anchor.forbidden_mutation_rules],
      window_positions: [...anchor.window_positions],
      door_positions: [...anchor.door_positions],
      major_furniture_positions: [...anchor.major_furniture_positions],
    },
  };
}

export function buildIndoorLocationAnchorAdapterFromLibrary(
  library: IndoorLocationAnchorLibrary,
  parentAdapterReference = 'exports/image_app/adapters/location-lighting-image-adapter.json'
): Record<string, unknown> {
  const locationToAnchorMap = library.anchors.map(buildIndoorLocationAnchorMapEntry);

  return {
    adapter_type: 'indoor_location_anchor_image_adapter',
    adapter_metadata: {
      adapter_name: 'indoor-location-anchor-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-LTD-004',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      indoor_anchor_count: library.anchors.length,
      library_reference: INDOOR_LOCATION_ANCHOR_LIBRARY_PATH,
      index_reference: INDOOR_LOCATION_ANCHOR_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
    },
    adapter_responsibility_chain: [
      'location_id',
      'indoor_anchor_id',
      'anchor_objects',
      'camera_rules',
      'render_payload',
    ],
    location_to_anchor_map: locationToAnchorMap,
    runtime_verification_fields: {
      anchor_id: { exported: true, required_for_indoor: true },
      fixed_anchor_objects: { exported: true, required_for_indoor: true },
      camera_view_rules: { exported: true, required_for_indoor: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Image App must read runtime_verification_fields; FAIL if fields ignored even when dataset exists.',
    },
    image_app_contract: {
      supported_location_ids: [...INDOOR_ANCHOR_TARGET_LOCATION_IDS],
      resolution_flow: {
        step_1: 'resolve location_id from shot',
        step_2: 'lookup indoor_anchor_id via location_to_anchor_map',
        step_3: 'attach anchor_objects and camera_rules by shot scale',
        step_4: 'merge render_payload spatial tokens into scenario location field only',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_004_validation_target: {
      test_id: 'RKB-004',
      test_name: 'INDOOR_LOCATION_VALIDATION',
      generation_count_per_location: 10,
      comparison_baseline: 'RKB-003',
      review_criteria: [
        'same_room_identity',
        'same_major_anchor_objects',
        'similar_architectural_structure',
        'similar_layout_direction',
      ],
      success_condition:
        'Indoor recognition visibly stronger than RKB-003; anchor objects and layout direction remain consistent across 10 generations.',
      secondary_validation:
        'Verify adapter exports anchor_id, fixed_anchor_objects, camera_view_rules and Image App consumes them.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'location_dna_library_v1',
          reference_path: 'datasets/location/location-dna-library-v1.json',
        },
        {
          asset_id: 'location_lighting_image_adapter',
          reference_path: parentAdapterReference,
        },
      ],
    },
  };
}
