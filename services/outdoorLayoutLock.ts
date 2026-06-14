import fs from 'node:fs';
import path from 'node:path';
import { mapShotTypeToPropCameraRule } from './propAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH =
  'datasets/location/outdoor-layout-lock-library-v1.json' as const;
export const OUTDOOR_LAYOUT_LOCK_INDEX_PATH =
  'datasets/location/outdoor-layout-lock-index-v1.json' as const;
export const OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH =
  'exports/image_app/adapters/outdoor-layout-lock-adapter.json' as const;
export const OUTDOOR_LAYOUT_LOCK_LITE_ADAPTER_PATH =
  'exports/image_app/adapters/outdoor-layout-lock-adapter-lite.json' as const;
export const OUTDOOR_LAYOUT_LOCK_V2_ADAPTER_PATH =
  'exports/image_app/adapters/outdoor-layout-lock-adapter-v2.json' as const;
export const CHARACTER_FIRST_CONTRACT_PATH =
  'exports/image_app/contracts/character-first-contract.json' as const;
export const OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/outdoor-layout-lock-adapter.json' as const;
export const OUTDOOR_LAYOUT_LOCK_FULL_REFERENCE_PATH =
  'exports/image_app/adapters/full_reference/outdoor-layout-lock-adapter-full.json' as const;
export const CHARACTER_FIRST_CONTRACT_LATEST_PATH =
  'exports/image_app/latest/character-first-contract.json' as const;

export const LATEST_OUTDOOR_FORBIDDEN_SUBSTRINGS = [
  'camera-visibility:',
  'landmark-visibility:',
  'walkable-zone:',
] as const;

export const LATEST_OUTDOOR_FORBIDDEN_ENFORCEMENT_MARKERS = [
  'fail if ignored',
  'camera-visibility tokens; fail if ignored',
] as const;

export type OutdoorLayoutTokenMode = 'lite' | 'full' | 'v2';

export const OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES = [
  'outdoor-layout-lock:',
  'outdoor-orientation:',
  'landmark-position:',
] as const;

export const OUTDOOR_LAYOUT_V2_TOKEN_PREFIXES = [
  ...OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES,
  'camera-preference:',
  'landmark-preference:',
  'environment-supporting-elements:',
  'character-priority:',
] as const;

export const OUTDOOR_LAYOUT_V2_FORBIDDEN_IN_OUTPUT = [
  'camera-visibility:',
  'landmark-visibility:must_show_',
  'walkable-zone:',
] as const;

/** Full-strength outdoor tokens (superseded in latest upload by lite mode). */
export const OUTDOOR_LAYOUT_FULL_EXTRA_TOKEN_PREFIXES = [
  'landmark-visibility:',
  'camera-visibility:',
  'walkable-zone:',
] as const;

export const OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS = [
  'olive_hill_overlook_01',
  'harbor_watch_point_01',
  'harbor_sunset_bench_01',
  'harbor_cliff_path_01',
  'dockside_walkway_01',
  'lighthouse_overlook_01',
] as const;

export type OutdoorLayoutLockLocationId = (typeof OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS)[number];

/** Maps legacy MV/composition location IDs to outdoor layout lock locations. */
export const OUTDOOR_LAYOUT_LOCATION_ALIASES: Record<string, OutdoorLayoutLockLocationId> = {
  gonegi_olive_hill_01: 'olive_hill_overlook_01',
  harbor_watch_point_01: 'harbor_watch_point_01',
};

export const COMPOSITION_TO_OUTDOOR_LAYOUT_LOCATION: Record<string, OutdoorLayoutLockLocationId> = {
  harbor_sunset_bench: 'harbor_sunset_bench_01',
};

export const REQUIRED_OUTDOOR_LAYOUT_LOCK_FIELDS = [
  'outdoor_layout_id',
  'location_id',
  'outdoor_orientation',
  'landmark_positions',
  'required_landmarks',
  'outdoor_prop_anchor_ids',
  'landmark_visibility_rules',
  'walkable_zones',
  'forbidden_outdoor_changes',
] as const;

export const CORE_OUTDOOR_FORBIDDEN_RULES = [
  'do not move landmark positions',
  'do not swap landmark locations',
  'do not rotate outdoor orientation',
  'do not remove required landmarks',
] as const;

export const OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES = [
  ...OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES,
  ...OUTDOOR_LAYOUT_FULL_EXTRA_TOKEN_PREFIXES,
] as const;

export const OUTDOOR_CAMERA_RULE_KEYS = [
  'wide',
  'medium',
  'close',
  'insert',
  'reaction',
  'pov',
] as const;

export type OutdoorCameraRuleKey = (typeof OUTDOOR_CAMERA_RULE_KEYS)[number];

export type OutdoorLayoutLockRecord = {
  outdoor_layout_id: string;
  location_id: string;
  outdoor_orientation: string;
  landmark_positions: Record<string, string>;
  required_landmarks: readonly string[];
  outdoor_prop_anchor_ids: readonly string[];
  landmark_visibility_rules: Record<OutdoorCameraRuleKey, string>;
  walkable_zones: readonly string[];
  forbidden_outdoor_changes: readonly string[];
};

export type OutdoorLayoutLockLibrary = {
  layouts: readonly OutdoorLayoutLockRecord[];
  layout_count?: number;
};

export type OutdoorLayoutLockIndexEntry = {
  outdoor_layout_id: string;
  location_id: string;
  outdoor_orientation: string;
};

export type OutdoorLayoutLockIndex = {
  entries: readonly OutdoorLayoutLockIndexEntry[];
  layout_count?: number;
};

export type OutdoorLayoutLockRenderPayload = {
  layout_tokens: readonly string[];
  outdoor_layout_id: string;
  outdoor_orientation: string;
  landmark_positions: readonly string[];
  required_landmarks: readonly string[];
  outdoor_prop_anchor_ids: readonly string[];
  forbidden_outdoor_changes: readonly string[];
  active_camera_visibility: string;
};

export type LocationOutdoorLayoutMapEntry = {
  location_id: string;
  outdoor_layout_id: string;
  outdoor_prop_anchor_ids: readonly string[];
  layout_tokens: readonly string[];
  render_payload: OutdoorLayoutLockRenderPayload;
};

export type OutdoorLayoutLockAdapter = {
  location_to_outdoor_layout_map: readonly LocationOutdoorLayoutMapEntry[];
};

export type OutdoorLayoutLockResolution = {
  location_id: string;
  outdoor_layout_id: string;
  outdoor_prop_anchor_ids: readonly string[];
  layout_tokens: readonly string[];
  render_payload: OutdoorLayoutLockRenderPayload;
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(resolveProjectRoot(projectRoot), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing outdoor layout lock asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function isOutdoorLayoutTargetLocation(
  locationId: string
): locationId is OutdoorLayoutLockLocationId {
  return (OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS as readonly string[]).includes(locationId);
}

export function resolveOutdoorLayoutLocationId(
  locationId: string,
  compositionId?: string
): OutdoorLayoutLockLocationId | null {
  if (isOutdoorLayoutTargetLocation(locationId)) return locationId;
  if (compositionId && COMPOSITION_TO_OUTDOOR_LAYOUT_LOCATION[compositionId]) {
    return COMPOSITION_TO_OUTDOOR_LAYOUT_LOCATION[compositionId];
  }
  const alias = OUTDOOR_LAYOUT_LOCATION_ALIASES[locationId];
  return alias ?? null;
}

export function loadOutdoorLayoutLockLibrary(projectRoot?: string): OutdoorLayoutLockLibrary {
  return readJson(resolveProjectRoot(projectRoot), OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH);
}

export function loadOutdoorLayoutLockIndex(projectRoot?: string): OutdoorLayoutLockIndex {
  return readJson(resolveProjectRoot(projectRoot), OUTDOOR_LAYOUT_LOCK_INDEX_PATH);
}

export function loadOutdoorLayoutLockAdapter(projectRoot?: string): OutdoorLayoutLockAdapter {
  return readJson(resolveProjectRoot(projectRoot), OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH);
}

export type CharacterFirstContract = {
  priority_order: readonly string[];
  priority_tokens: readonly string[];
  rules: {
    environment_may_never_override: readonly string[];
  };
  soft_guidance_prefixes: readonly string[];
};

export function loadCharacterFirstContract(projectRoot?: string): CharacterFirstContract {
  return readJson(resolveProjectRoot(projectRoot), CHARACTER_FIRST_CONTRACT_PATH);
}

function softenCameraPreference(rule: string): string {
  return `prefer_${rule
    .replace(/silhouette/g, 'context')
    .replace(/visible/g, 'context')
    .replace(/macro/g, 'detail')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}_character_foreground_priority`;
}

export function buildCharacterPriorityTokens(projectRoot?: string): string[] {
  const contract = loadCharacterFirstContract(projectRoot);
  return [...contract.priority_tokens];
}

export function assertNoHarmfulOutdoorTokens(tokens: readonly string[]): boolean {
  return !tokens.some((token) =>
    OUTDOOR_LAYOUT_V2_FORBIDDEN_IN_OUTPUT.some(
      (forbidden) => token.startsWith(forbidden) || token.includes('FAIL if ignored')
    )
  );
}

export function mapShotTypeToOutdoorCameraRule(shotTypeOrDistance: string): OutdoorCameraRuleKey {
  return mapShotTypeToPropCameraRule(shotTypeOrDistance) as OutdoorCameraRuleKey;
}

export function buildOutdoorLayoutLockTokens(
  layout: OutdoorLayoutLockRecord,
  shotTypeOrDistance = 'medium',
  mode: OutdoorLayoutTokenMode = 'v2'
): string[] {
  const cameraKey = mapShotTypeToOutdoorCameraRule(shotTypeOrDistance);
  const landmarkPositionTokens = Object.entries(layout.landmark_positions).map(
    ([landmarkId, position]) => `landmark-position:${landmarkId}@${position}`
  );

  const liteTokens = [
    `outdoor-layout-lock:${layout.outdoor_layout_id}`,
    `outdoor-orientation:${layout.outdoor_orientation}`,
    ...landmarkPositionTokens,
  ];

  if (mode === 'v2') {
    const landmarkPreferences = layout.required_landmarks.map(
      (landmarkId) => `landmark-preference:${landmarkId}`
    );
    return [
      ...liteTokens,
      `camera-preference:${softenCameraPreference(layout.landmark_visibility_rules[cameraKey])}`,
      ...landmarkPreferences,
      `environment-supporting-elements:${layout.required_landmarks.join('_')}`,
      ...layout.outdoor_prop_anchor_ids.map((id) => `outdoor-prop:${id}`),
    ];
  }

  if (mode === 'lite') {
    return [
      ...liteTokens,
      ...layout.outdoor_prop_anchor_ids.map((id) => `outdoor-prop:${id}`),
    ];
  }

  const landmarkVisibilityTokens = layout.required_landmarks.map(
    (landmarkId) => `landmark-visibility:must_show_${landmarkId}`
  );

  return [
    ...liteTokens,
    ...landmarkVisibilityTokens,
    `camera-visibility:${layout.landmark_visibility_rules[cameraKey]}`,
    ...layout.walkable_zones.map((zone) => `walkable-zone:${zone}`),
    ...layout.outdoor_prop_anchor_ids.map((id) => `outdoor-prop:${id}`),
  ];
}

export function buildOutdoorLayoutLockRenderPayload(
  layout: OutdoorLayoutLockRecord,
  shotTypeOrDistance = 'medium',
  mode: OutdoorLayoutTokenMode = 'v2'
): OutdoorLayoutLockRenderPayload {
  const cameraKey = mapShotTypeToOutdoorCameraRule(shotTypeOrDistance);
  const landmarkPositions = Object.entries(layout.landmark_positions).map(
    ([landmarkId, position]) => `${landmarkId}@${position}`
  );

  return {
    layout_tokens: buildOutdoorLayoutLockTokens(layout, shotTypeOrDistance, mode),
    outdoor_layout_id: layout.outdoor_layout_id,
    outdoor_orientation: layout.outdoor_orientation,
    landmark_positions: landmarkPositions,
    required_landmarks: [...layout.required_landmarks],
    outdoor_prop_anchor_ids: [...layout.outdoor_prop_anchor_ids],
    forbidden_outdoor_changes: [...layout.forbidden_outdoor_changes],
    active_camera_visibility:
      mode === 'v2'
        ? softenCameraPreference(layout.landmark_visibility_rules[cameraKey])
        : layout.landmark_visibility_rules[cameraKey],
  };
}

export function getOutdoorLayoutByLocationId(
  locationId: string,
  projectRoot?: string
): OutdoorLayoutLockRecord | null {
  const resolved = resolveOutdoorLayoutLocationId(locationId);
  if (!resolved) return null;
  const library = loadOutdoorLayoutLockLibrary(projectRoot);
  return library.layouts.find((row) => row.location_id === resolved) ?? null;
}

export function resolveOutdoorLayoutLock(
  locationId: string,
  shotTypeOrDistance = 'medium',
  projectRoot?: string,
  compositionId?: string,
  mode: OutdoorLayoutTokenMode = 'v2'
): OutdoorLayoutLockResolution | null {
  const resolvedLocationId = resolveOutdoorLayoutLocationId(locationId, compositionId);
  if (!resolvedLocationId) return null;

  const layout = getOutdoorLayoutByLocationId(resolvedLocationId, projectRoot);
  if (!layout) return null;

  const renderPayload = buildOutdoorLayoutLockRenderPayload(layout, shotTypeOrDistance, mode);
  const layoutTokens = [
    ...renderPayload.layout_tokens,
    ...renderPayload.forbidden_outdoor_changes.map((rule) => `outdoor-forbidden:${rule}`),
    ...(mode === 'v2' ? buildCharacterPriorityTokens(projectRoot) : []),
    ...(mode === 'v2'
      ? [
          'character-first-rule:environment_never_overrides_character_face',
          'character-first-rule:environment_never_overrides_character_silhouette',
          'character-first-rule:environment_never_overrides_character_clothing',
          'character-first-rule:environment_never_overrides_character_species',
          'character-first-rule:environment_never_overrides_character_pose_intent',
        ]
      : []),
  ];

  return {
    location_id: resolvedLocationId,
    outdoor_layout_id: layout.outdoor_layout_id,
    outdoor_prop_anchor_ids: [...layout.outdoor_prop_anchor_ids],
    layout_tokens: [...new Set(layoutTokens)].sort(),
    render_payload: renderPayload,
  };
}

export function buildOutdoorLayoutContinuityTokens(resolution: OutdoorLayoutLockResolution): string[] {
  return resolution.layout_tokens;
}

export function enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
  anchors: readonly string[],
  locationIds: readonly string[],
  shotTypeOrDistance: string,
  projectRoot?: string,
  compositionId?: string,
  mode: OutdoorLayoutTokenMode = 'v2'
): string[] {
  const merged = [...anchors];
  const applied = new Set<string>();

  for (const locationId of locationIds) {
    const resolved = resolveOutdoorLayoutLocationId(locationId, compositionId);
    if (!resolved || applied.has(resolved)) continue;
    applied.add(resolved);

    const resolution = resolveOutdoorLayoutLock(
      locationId,
      shotTypeOrDistance,
      projectRoot,
      compositionId,
      mode
    );
    if (!resolution) continue;
    merged.push(...buildOutdoorLayoutContinuityTokens(resolution));
  }

  return [...new Set(merged)].sort();
}

export function buildLocationOutdoorLayoutMapEntry(
  layout: OutdoorLayoutLockRecord,
  shotTypeOrDistance = 'medium',
  mode: OutdoorLayoutTokenMode = 'lite'
): LocationOutdoorLayoutMapEntry {
  const renderPayload = buildOutdoorLayoutLockRenderPayload(layout, shotTypeOrDistance, mode);

  return {
    location_id: layout.location_id,
    outdoor_layout_id: layout.outdoor_layout_id,
    outdoor_prop_anchor_ids: [...layout.outdoor_prop_anchor_ids],
    layout_tokens: renderPayload.layout_tokens,
    render_payload: renderPayload,
  };
}

export function buildOutdoorLayoutLockAdapterFromLibrary(
  library: OutdoorLayoutLockLibrary,
  parentAdapterReference = 'exports/image_app/adapters/scene-asset-composition-adapter.json',
  mode: OutdoorLayoutTokenMode = 'v2'
): Record<string, unknown> {
  const locationToOutdoorLayoutMap = library.layouts.map((layout) =>
    buildLocationOutdoorLayoutMapEntry(layout, 'medium', mode)
  );

  const isLite = mode === 'lite';
  const isV2 = mode === 'v2';
  const requiredPrefixes = isV2
    ? [...OUTDOOR_LAYOUT_V2_TOKEN_PREFIXES]
    : isLite
      ? [...OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES]
      : [...OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES];

  const adapterName = isV2
    ? 'outdoor-layout-lock-adapter-v2'
    : isLite
      ? 'outdoor-layout-lock-adapter-lite'
      : 'outdoor-layout-lock-adapter';

  return {
    adapter_type: 'outdoor_layout_lock_image_adapter',
    adapter_metadata: {
      adapter_name: adapterName,
      adapter_version: isV2 ? 'v2' : isLite ? 'lite-v1' : 'v1',
      phase: isV2
        ? 'PHASE-16-IDENTITY-SAFE-REBUILD-001'
        : isLite
          ? 'PHASE-OUTDOOR-LAYOUT-LOCK-LITE-001'
          : 'PHASE-OUTDOOR-LAYOUT-LOCK-001',
      token_mode: mode,
      character_first_contract_reference: isV2 ? CHARACTER_FIRST_CONTRACT_PATH : undefined,
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      layout_count: library.layouts.length,
      library_reference: OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH,
      index_reference: OUTDOOR_LAYOUT_LOCK_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
    },
    adapter_responsibility_chain: [
      'location_id',
      'outdoor_layout_id',
      'outdoor_prop_anchor_ids',
      'render_payload',
    ],
    location_to_outdoor_layout_map: locationToOutdoorLayoutMap,
    image_app_token_contract: {
      required_prefixes: requiredPrefixes,
      removed_in_lite_mode: isLite ? [...OUTDOOR_LAYOUT_FULL_EXTRA_TOKEN_PREFIXES] : [],
      removed_in_v2_rebuild: isV2 ? [...OUTDOOR_LAYOUT_V2_FORBIDDEN_IN_OUTPUT] : [],
      priority_order: isV2
        ? [
            'character_identity',
            'character_reference',
            'character_continuity',
            'location_continuity',
            'environment_details',
          ]
        : undefined,
      injection_layer: 'location_continuity_anchors',
    },
    runtime_verification_fields: {
      outdoor_layout_id: { exported: true, required_for_outdoor: true },
      layout_tokens: { exported: true, required_for_outdoor: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation: isV2
        ? 'Soft outdoor guidance only; character identity has higher priority than environment details. No FAIL-if-ignored enforcement.'
        : isLite
          ? 'Image App must read outdoor-layout-lock, outdoor-orientation, landmark-position tokens; reduced strength protects character identity.'
          : 'Image App must read outdoor-layout-lock, landmark-position, landmark-visibility, outdoor-orientation, camera-visibility tokens; FAIL if ignored.',
    },
    character_first_contract: isV2 ? CHARACTER_FIRST_CONTRACT_PATH : undefined,
    image_app_contract: {
      supported_location_ids: [...OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS],
      resolution_flow: {
        step_1: 'resolve location_id from shot',
        step_2: 'lookup outdoor_layout_id and outdoor_prop_anchor_ids',
        step_3: 'attach locked landmark_positions and outdoor_orientation',
        step_4: 'merge render_payload layout tokens into location continuity only',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_013_validation_target: {
      test_id: 'RKB-013',
      test_name: 'OUTDOOR_LAYOUT_CONTINUITY_VALIDATION',
      review_criteria: [
        'landmark_position_stability',
        'outdoor_orientation_stability',
        'landmark_recognition',
        'required_landmark_visibility',
      ],
      success_condition:
        'Locked outdoor landmarks remain recognizable across generations; no orientation or landmark position drift.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'scene_asset_composition_adapter',
          reference_path: parentAdapterReference,
        },
        {
          asset_id: 'outdoor_layout_lock_library_v1',
          reference_path: OUTDOOR_LAYOUT_LOCK_LIBRARY_PATH,
        },
      ],
    },
  };
}

export function verifyOutdoorLayoutTokensInjected(
  tokens: readonly string[],
  mode: OutdoorLayoutTokenMode = 'v2'
): boolean {
  const prefixes =
    mode === 'v2'
      ? OUTDOOR_LAYOUT_V2_TOKEN_PREFIXES
      : mode === 'lite'
        ? OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES
        : OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES;
  return (
    prefixes.every((prefix) => tokens.some((token) => token.startsWith(prefix))) &&
    (mode !== 'v2' || assertNoHarmfulOutdoorTokens(tokens))
  );
}

export function countOutdoorLayoutTokens(
  tokens: readonly string[],
  mode: OutdoorLayoutTokenMode = 'v2'
): number {
  const prefixes =
    mode === 'v2'
      ? OUTDOOR_LAYOUT_V2_TOKEN_PREFIXES
      : mode === 'lite'
        ? OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES
        : OUTDOOR_LAYOUT_IMAGE_APP_TOKEN_PREFIXES;
  return tokens.filter((token) => prefixes.some((prefix) => token.startsWith(prefix))).length;
}

export function assertLatestOutdoorLayoutAdapterIsV2Safe(content: string): {
  pass: boolean;
  violations: readonly string[];
} {
  const violations: string[] = [];

  let doc: Record<string, unknown>;
  try {
    doc = JSON.parse(content) as Record<string, unknown>;
  } catch {
    return {
      pass: false,
      violations: Object.freeze(['Latest outdoor adapter is not valid JSON']),
    };
  }

  const metadata = doc.adapter_metadata as Record<string, unknown> | undefined;
  if (metadata?.token_mode !== 'v2') {
    violations.push('Latest outdoor adapter must declare adapter_metadata.token_mode v2');
  }

  const injectedTokens: string[] = [];
  const map = doc.location_to_outdoor_layout_map as
    | Array<{
        layout_tokens?: string[];
        render_payload?: { layout_tokens?: string[]; active_camera_visibility?: string };
      }>
    | undefined;

  for (const entry of map ?? []) {
    injectedTokens.push(...(entry.layout_tokens ?? []));
    injectedTokens.push(...(entry.render_payload?.layout_tokens ?? []));
    if (entry.render_payload?.active_camera_visibility) {
      injectedTokens.push(entry.render_payload.active_camera_visibility);
    }
  }

  for (const token of injectedTokens) {
    for (const pattern of LATEST_OUTDOOR_FORBIDDEN_SUBSTRINGS) {
      if (token.includes(pattern)) {
        violations.push(`Forbidden injected outdoor token: ${token}`);
      }
    }
  }

  const secondary = (
    doc.runtime_verification_fields as { secondary_validation?: string } | undefined
  )?.secondary_validation;
  if (typeof secondary === 'string') {
    const lower = secondary.toLowerCase();
    for (const marker of LATEST_OUTDOOR_FORBIDDEN_ENFORCEMENT_MARKERS) {
      if (lower.includes(marker)) {
        violations.push(`Forbidden secondary_validation enforcement: ${marker}`);
      }
    }
    if (
      lower.includes('landmark-visibility, outdoor-orientation, camera-visibility') ||
      lower.includes('landmark-position, landmark-visibility')
    ) {
      violations.push('Forbidden full-strength secondary_validation text in latest outdoor adapter');
    }
  }

  return { pass: violations.length === 0, violations: Object.freeze(violations) };
}

function buildProductionOutdoorUploadAdapter(
  v2Adapter: Record<string, unknown>
): Record<string, unknown> {
  const metadata = v2Adapter.adapter_metadata as Record<string, unknown>;
  return {
    ...v2Adapter,
    adapter_metadata: {
      ...metadata,
      adapter_name: 'outdoor-layout-lock-adapter',
      upload_slot: 16,
      production_upload_variant: 'v2',
      phase: 'PHASE-16-PUBLISH-V2-LOCK-001',
    },
  };
}

export function publishOutdoorLayoutLockProductionArtifacts(projectRoot?: string): {
  full_reference_path: string;
  v2_adapter_path: string;
  production_adapter_path: string;
  latest_adapter_path: string;
  latest_contract_path: string;
} {
  const root = resolveProjectRoot(projectRoot);
  const parentRef = 'exports/image_app/adapters/scene-asset-composition-adapter.json';
  const library = loadOutdoorLayoutLockLibrary(root);

  const fullAdapter = buildOutdoorLayoutLockAdapterFromLibrary(library, parentRef, 'full');
  const v2Adapter = buildOutdoorLayoutLockAdapterFromLibrary(library, parentRef, 'v2');
  const productionAdapter = buildProductionOutdoorUploadAdapter(v2Adapter);

  const fullReferencePath = path.join(root, OUTDOOR_LAYOUT_LOCK_FULL_REFERENCE_PATH);
  const v2Path = path.join(root, OUTDOOR_LAYOUT_LOCK_V2_ADAPTER_PATH);
  const productionPath = path.join(root, OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH);
  const latestAdapterPath = path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH);
  const latestContractPath = path.join(root, CHARACTER_FIRST_CONTRACT_LATEST_PATH);
  const contractSourcePath = path.join(root, CHARACTER_FIRST_CONTRACT_PATH);

  fs.mkdirSync(path.dirname(fullReferencePath), { recursive: true });
  fs.writeFileSync(fullReferencePath, `${JSON.stringify(fullAdapter, null, 2)}\n`, 'utf8');
  fs.writeFileSync(v2Path, `${JSON.stringify(v2Adapter, null, 2)}\n`, 'utf8');
  fs.writeFileSync(productionPath, `${JSON.stringify(productionAdapter, null, 2)}\n`, 'utf8');
  fs.mkdirSync(path.dirname(latestAdapterPath), { recursive: true });
  fs.writeFileSync(latestAdapterPath, `${JSON.stringify(productionAdapter, null, 2)}\n`, 'utf8');

  if (fs.existsSync(contractSourcePath)) {
    fs.mkdirSync(path.dirname(latestContractPath), { recursive: true });
    fs.copyFileSync(contractSourcePath, latestContractPath);
  }

  return {
    full_reference_path: OUTDOOR_LAYOUT_LOCK_FULL_REFERENCE_PATH,
    v2_adapter_path: OUTDOOR_LAYOUT_LOCK_V2_ADAPTER_PATH,
    production_adapter_path: OUTDOOR_LAYOUT_LOCK_ADAPTER_PATH,
    latest_adapter_path: OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
    latest_contract_path: CHARACTER_FIRST_CONTRACT_LATEST_PATH,
  };
}

export function publishOutdoorLayoutLockV2Adapter(projectRoot?: string): string {
  const artifacts = publishOutdoorLayoutLockProductionArtifacts(projectRoot);
  return path.join(resolveProjectRoot(projectRoot), artifacts.v2_adapter_path);
}
