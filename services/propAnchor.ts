import fs from 'node:fs';
import path from 'node:path';
import {
  isIndoorAnchorTargetLocation,
  loadIndoorLocationAnchorAdapter,
  resolveIndoorLocationAnchor,
} from './indoorLocationAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROP_ANCHOR_LIBRARY_PATH = 'datasets/props/prop-anchor-library-v1.json' as const;
export const PROP_ANCHOR_INDEX_PATH = 'datasets/props/prop-anchor-index-v1.json' as const;
export const PROP_ANCHOR_ADAPTER_PATH = 'exports/image_app/adapters/prop-anchor-adapter.json' as const;

export const PROP_ANCHOR_TARGET_IDS = [
  'wildflower_vase_01',
  'ship_model_01',
  'aged_wood_chair_01',
  'blue_flower_vase_01',
  'reading_chair_01',
  'sketchbook_01',
  'bread_basket_01',
  'pine_table_01',
  'brick_oven_01',
  'copper_kettle_01',
  'rolling_pin_01',
  'geranium_pot_01',
  'clay_jug_01',
  'teacup_01',
] as const;

export type PropAnchorTargetId = (typeof PROP_ANCHOR_TARGET_IDS)[number];

export const REQUIRED_PROP_ANCHOR_FIELDS = [
  'prop_anchor_id',
  'prop_name',
  'prop_category',
  'visual_description',
  'material',
  'primary_color',
  'secondary_color',
  'shape_profile',
  'size_profile',
  'wear_pattern',
  'room_affinity',
  'location_affinity',
  'visibility_priority',
  'camera_rules',
  'forbidden_mutation_rules',
] as const;

export const PROP_CAMERA_RULE_KEYS = [
  'wide',
  'medium',
  'close',
  'insert',
  'reaction',
  'pov',
] as const;

export type PropCameraRuleKey = (typeof PROP_CAMERA_RULE_KEYS)[number];

export const CORE_PROP_FORBIDDEN_RULES = [
  'do not change shape',
  'do not change material',
  'do not change primary color',
  'do not replace with similar object',
] as const;

export const PROP_IMAGE_APP_TOKEN_PREFIXES = [
  'prop-anchor:',
  'prop-shape:',
  'prop-material:',
  'prop-color:',
  'prop-priority:',
] as const;

export type PropCameraRules = Record<PropCameraRuleKey, string>;

export type PropAnchorRecord = {
  prop_anchor_id: string;
  prop_name: string;
  prop_category: string;
  visual_description: string;
  material: string;
  primary_color: string;
  secondary_color: string;
  shape_profile: string;
  size_profile: string;
  wear_pattern: string;
  room_affinity: readonly string[];
  location_affinity: readonly string[];
  visibility_priority: string;
  camera_rules: PropCameraRules;
  forbidden_mutation_rules: readonly string[];
};

export type PropAnchorLibrary = {
  props: readonly PropAnchorRecord[];
  prop_anchor_count?: number;
};

export type PropAnchorIndexEntry = {
  prop_anchor_id: string;
  prop_category: string;
  primary_location: string;
};

export type PropAnchorIndex = {
  entries: readonly PropAnchorIndexEntry[];
  anchor_count?: number;
};

export type PropAnchorRenderPayload = {
  prop_tokens: readonly string[];
  prop_anchor_id: string;
  shape_profile: string;
  material: string;
  primary_color: string;
  visibility_priority: string;
  active_camera_rule: string;
  forbidden_mutation_rules: readonly string[];
  visual_description: string;
};

export type LocationPropMapEntry = {
  location_id: string;
  indoor_anchor_id: string;
  prop_anchor_ids: readonly string[];
  prop_tokens: readonly string[];
  render_payload: {
    prop_anchors: readonly PropAnchorRenderPayload[];
    combined_prop_tokens: readonly string[];
    forbidden_mutation_rules: readonly string[];
  };
};

export type PropAnchorAdapter = {
  location_to_prop_map: readonly LocationPropMapEntry[];
  prop_by_id_map: Record<string, PropAnchorRenderPayload>;
};

export type PropAnchorResolution = {
  location_id: string;
  indoor_anchor_id: string;
  prop_anchor_ids: readonly string[];
  prop_tokens: readonly string[];
  render_payload: LocationPropMapEntry['render_payload'];
};

export const LOCATION_PROP_BINDINGS: Record<string, readonly PropAnchorTargetId[]> = {
  gonegi_bedroom_01: ['wildflower_vase_01', 'ship_model_01', 'aged_wood_chair_01', 'sketchbook_01'],
  gonegi_window_corner_01: [
    'wildflower_vase_01',
    'ship_model_01',
    'aged_wood_chair_01',
    'sketchbook_01',
    'teacup_01',
  ],
  family_bakery_kitchen_01: [
    'bread_basket_01',
    'pine_table_01',
    'brick_oven_01',
    'copper_kettle_01',
    'rolling_pin_01',
  ],
  family_bakery_dining_01: [
    'bread_basket_01',
    'pine_table_01',
    'blue_flower_vase_01',
    'teacup_01',
    'clay_jug_01',
  ],
  dana_bedroom_01: ['aged_wood_chair_01', 'blue_flower_vase_01', 'clay_jug_01', 'geranium_pot_01'],
  dana_window_corner_01: [
    'reading_chair_01',
    'blue_flower_vase_01',
    'teacup_01',
    'geranium_pot_01',
    'sketchbook_01',
  ],
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(resolveProjectRoot(projectRoot), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing prop anchor asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadPropAnchorLibrary(projectRoot?: string): PropAnchorLibrary {
  return readJson(resolveProjectRoot(projectRoot), PROP_ANCHOR_LIBRARY_PATH);
}

export function loadPropAnchorIndex(projectRoot?: string): PropAnchorIndex {
  return readJson(resolveProjectRoot(projectRoot), PROP_ANCHOR_INDEX_PATH);
}

export function loadPropAnchorAdapter(projectRoot?: string): PropAnchorAdapter {
  return readJson(resolveProjectRoot(projectRoot), PROP_ANCHOR_ADAPTER_PATH);
}

export function mapShotTypeToPropCameraRule(shotTypeOrDistance: string): PropCameraRuleKey {
  const normalized = shotTypeOrDistance.toLowerCase();
  if (normalized.includes('insert')) return 'insert';
  if (normalized.includes('reaction')) return 'reaction';
  if (normalized.includes('pov')) return 'pov';
  if (normalized.includes('close')) return 'close';
  if (normalized.includes('wide') || normalized.includes('establish') || normalized.includes('environmental')) {
    return 'wide';
  }
  if (normalized.includes('medium') || normalized.includes('tracking')) return 'medium';
  return 'medium';
}

export function buildPropImageAppTokens(
  prop: PropAnchorRecord,
  shotTypeOrDistance = 'medium'
): string[] {
  const cameraKey = mapShotTypeToPropCameraRule(shotTypeOrDistance);
  return [
    `prop-anchor:${prop.prop_anchor_id}`,
    `prop-shape:${prop.shape_profile}`,
    `prop-material:${prop.material}`,
    `prop-color:${prop.primary_color}`,
    `prop-priority:${prop.visibility_priority}`,
    `prop-camera-rule:${prop.camera_rules[cameraKey]}`,
    `prop-secondary-color:${prop.secondary_color}`,
    `prop-category:${prop.prop_category}`,
  ];
}

export function buildPropAnchorRenderPayload(
  prop: PropAnchorRecord,
  shotTypeOrDistance = 'medium'
): PropAnchorRenderPayload {
  const cameraKey = mapShotTypeToPropCameraRule(shotTypeOrDistance);
  return {
    prop_tokens: buildPropImageAppTokens(prop, shotTypeOrDistance),
    prop_anchor_id: prop.prop_anchor_id,
    shape_profile: prop.shape_profile,
    material: prop.material,
    primary_color: prop.primary_color,
    visibility_priority: prop.visibility_priority,
    active_camera_rule: prop.camera_rules[cameraKey],
    forbidden_mutation_rules: [...prop.forbidden_mutation_rules],
    visual_description: prop.visual_description,
  };
}

export function getPropAnchorById(
  propAnchorId: string,
  projectRoot?: string
): PropAnchorRecord | null {
  const library = loadPropAnchorLibrary(projectRoot);
  return library.props.find((row) => row.prop_anchor_id === propAnchorId) ?? null;
}

export function resolvePropAnchorsForLocation(
  locationId: string,
  shotTypeOrDistance = 'medium',
  projectRoot?: string
): PropAnchorResolution | null {
  if (!isIndoorAnchorTargetLocation(locationId)) {
    return null;
  }

  const propIds = LOCATION_PROP_BINDINGS[locationId];
  if (!propIds || propIds.length === 0) {
    return null;
  }

  const indoor = resolveIndoorLocationAnchor(locationId, shotTypeOrDistance, projectRoot);
  if (!indoor) {
    return null;
  }

  const propPayloads: PropAnchorRenderPayload[] = [];
  const combinedTokens: string[] = [];
  const forbiddenRules = new Set<string>();

  for (const propId of propIds) {
    const prop = getPropAnchorById(propId, projectRoot);
    if (!prop) continue;
    const payload = buildPropAnchorRenderPayload(prop, shotTypeOrDistance);
    propPayloads.push(payload);
    combinedTokens.push(...payload.prop_tokens);
    for (const rule of payload.forbidden_mutation_rules) {
      forbiddenRules.add(rule);
    }
  }

  if (propPayloads.length === 0) {
    return null;
  }

  const renderPayload = {
    prop_anchors: propPayloads,
    combined_prop_tokens: [...new Set(combinedTokens)].sort(),
    forbidden_mutation_rules: [...forbiddenRules].sort(),
  };

  return {
    location_id: locationId,
    indoor_anchor_id: indoor.anchor_id,
    prop_anchor_ids: propIds,
    prop_tokens: renderPayload.combined_prop_tokens,
    render_payload: renderPayload,
  };
}

export function buildPropContinuityTokens(resolution: PropAnchorResolution): string[] {
  return [
    ...resolution.prop_tokens,
    `prop-anchor-count:${resolution.prop_anchor_ids.length}`,
    `prop-indoor-anchor:${resolution.indoor_anchor_id}`,
    ...resolution.render_payload.forbidden_mutation_rules.map((rule) => `prop-forbidden:${rule}`),
  ];
}

export function enrichLocationContinuityAnchorsWithPropAnchor(
  anchors: readonly string[],
  locationIds: readonly string[],
  shotTypeOrDistance: string,
  projectRoot?: string
): string[] {
  const merged = [...anchors];

  for (const locationId of locationIds) {
    const resolution = resolvePropAnchorsForLocation(locationId, shotTypeOrDistance, projectRoot);
    if (!resolution) continue;
    merged.push(...buildPropContinuityTokens(resolution));
  }

  return [...new Set(merged)].sort();
}

export function buildLocationPropMapEntry(
  locationId: string,
  library: PropAnchorLibrary,
  shotTypeOrDistance = 'medium',
  projectRoot?: string
): LocationPropMapEntry | null {
  const propIds = LOCATION_PROP_BINDINGS[locationId];
  if (!propIds) return null;

  const indoorAdapter = loadIndoorLocationAnchorAdapter(projectRoot);
  const indoorEntry = indoorAdapter.location_to_anchor_map.find((row) => row.location_id === locationId);
  if (!indoorEntry) return null;

  const propPayloads = propIds
    .map((id) => {
      const prop = library.props.find((row) => row.prop_anchor_id === id);
      return prop ? buildPropAnchorRenderPayload(prop, shotTypeOrDistance) : null;
    })
    .filter((row): row is PropAnchorRenderPayload => row !== null);

  const combinedTokens = [...new Set(propPayloads.flatMap((p) => p.prop_tokens))].sort();
  const forbiddenRules = [
    ...new Set(propPayloads.flatMap((p) => p.forbidden_mutation_rules)),
  ].sort();

  return {
    location_id: locationId,
    indoor_anchor_id: indoorEntry.anchor_id ?? indoorEntry.indoor_anchor_id,
    prop_anchor_ids: propIds,
    prop_tokens: combinedTokens,
    render_payload: {
      prop_anchors: propPayloads,
      combined_prop_tokens: combinedTokens,
      forbidden_mutation_rules: forbiddenRules,
    },
  };
}

export function buildPropAnchorAdapterFromLibrary(
  library: PropAnchorLibrary,
  parentAdapterReference = 'exports/image_app/adapters/indoor-location-anchor-adapter.json'
): Record<string, unknown> {
  const locationToPropMap = Object.keys(LOCATION_PROP_BINDINGS)
    .map((locationId) => buildLocationPropMapEntry(locationId, library))
    .filter((row): row is LocationPropMapEntry => row !== null);

  const propByIdMap: Record<string, PropAnchorRenderPayload> = {};
  for (const prop of library.props) {
    propByIdMap[prop.prop_anchor_id] = buildPropAnchorRenderPayload(prop);
  }

  return {
    adapter_type: 'prop_anchor_image_adapter',
    adapter_metadata: {
      adapter_name: 'prop-anchor-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-PROP-ANCHOR-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      prop_anchor_count: library.props.length,
      library_reference: PROP_ANCHOR_LIBRARY_PATH,
      index_reference: PROP_ANCHOR_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
    },
    adapter_responsibility_chain: [
      'location_id',
      'indoor_anchor_id',
      'prop_anchor_ids',
      'render_payload',
    ],
    location_to_prop_map: locationToPropMap,
    prop_by_id_map: propByIdMap,
    image_app_token_contract: {
      required_prefixes: [...PROP_IMAGE_APP_TOKEN_PREFIXES],
      injection_layer: 'location_continuity_anchors',
    },
    runtime_verification_fields: {
      prop_anchor_ids: { exported: true, required_for_indoor: true },
      prop_tokens: { exported: true, required_for_indoor: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Image App must read prop-anchor, prop-shape, prop-material, prop-color, prop-priority tokens; FAIL if ignored.',
    },
    image_app_contract: {
      supported_location_ids: Object.keys(LOCATION_PROP_BINDINGS),
      resolution_flow: {
        step_1: 'resolve location_id from shot',
        step_2: 'lookup indoor_anchor_id via indoor-location-anchor-adapter',
        step_3: 'attach prop_anchor_ids bound to location',
        step_4: 'merge render_payload prop tokens into location continuity only',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_010_validation_target: {
      test_id: 'RKB-010',
      test_name: 'PROP_CONTINUITY_VALIDATION',
      review_criteria: [
        'chair_identity',
        'book_identity',
        'teacup_identity',
        'vase_identity',
        'basket_identity',
        'window_accessory_identity',
      ],
      success_condition:
        'Prop anchors remain recognizable across generations; forbidden mutations not violated.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'indoor_location_anchor_adapter',
          reference_path: parentAdapterReference,
        },
        {
          asset_id: 'prop_anchor_library_v1',
          reference_path: PROP_ANCHOR_LIBRARY_PATH,
        },
      ],
    },
  };
}

export function verifyPropTokensInjected(tokens: readonly string[]): boolean {
  return PROP_IMAGE_APP_TOKEN_PREFIXES.every((prefix) =>
    tokens.some((token) => token.startsWith(prefix))
  );
}
