import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LIGHTING_ANCHOR_LIBRARY_PATH =
  'datasets/lighting/lighting-anchor-library-v1.json' as const;
export const LIGHTING_ANCHOR_INDEX_PATH =
  'datasets/lighting/lighting-anchor-index-v1.json' as const;
export const LIGHTING_ANCHOR_ADAPTER_PATH =
  'exports/image_app/adapters/lighting-anchor-adapter.json' as const;

export const INITIAL_LIGHTING_ANCHOR_IDS = [
  'sunrise_window_soft_01',
  'morning_bakery_glow_01',
  'midday_harbor_clear_01',
  'afternoon_olive_hill_01',
  'golden_hour_harbor_01',
  'sunset_window_warm_01',
  'blue_hour_street_01',
  'night_lamp_interior_01',
] as const;

export type InitialLightingAnchorId = (typeof INITIAL_LIGHTING_ANCHOR_IDS)[number];

export const REQUIRED_LIGHTING_ANCHOR_FIELDS = [
  'lighting_anchor_id',
  'lighting_dna_id',
  'key_light_direction',
  'shadow_direction',
  'color_temperature',
  'brightness_range',
  'window_glow_strength',
  'ambient_strength',
  'visual_memory_tokens',
  'forbidden_mutation_rules',
] as const;

export type LightingAnchorRecord = {
  lighting_anchor_id: string;
  lighting_dna_id: string;
  light_source_positions: readonly string[];
  key_light_direction: string;
  fill_light_direction: string;
  shadow_direction: string;
  color_temperature: string;
  brightness_range: string;
  window_glow_strength: string;
  ambient_strength: string;
  highlight_behavior: string;
  visual_memory_tokens: readonly string[];
  forbidden_mutation_rules: readonly string[];
};

export type LightingAnchorLibrary = {
  anchors: readonly LightingAnchorRecord[];
  initial_lighting_anchors?: readonly string[];
  anchor_count?: number;
};

export type LightingAnchorIndexEntry = {
  lighting_anchor_id: string;
  lighting_dna_id: string;
};

export type LightingAnchorIndex = {
  entries: readonly LightingAnchorIndexEntry[];
  anchor_count?: number;
};

export type LightingAnchorRenderPayload = {
  lighting_tokens: readonly string[];
  key_light_direction: string;
  shadow_direction: string;
  color_temperature: string;
  brightness_range: string;
  window_glow_strength: string;
  ambient_strength: string;
  highlight_behavior: string;
  forbidden_mutation_rules: readonly string[];
  light_source_positions: readonly string[];
};

export type LightingDnaToAnchorMapEntry = {
  lighting_dna_id: string;
  lighting_anchor_id: string;
  lighting_tokens: readonly string[];
  render_payload: LightingAnchorRenderPayload;
};

export type LightingAnchorAdapter = {
  dna_to_anchor_map: readonly LightingDnaToAnchorMapEntry[];
};

export type LightingAnchorResolution = {
  lighting_dna_id: string;
  lighting_anchor_id: string;
  lighting_tokens: readonly string[];
  render_payload: LightingAnchorRenderPayload;
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing lighting anchor asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadLightingAnchorLibrary(projectRoot?: string): LightingAnchorLibrary {
  return readJson(resolveProjectRoot(projectRoot), LIGHTING_ANCHOR_LIBRARY_PATH);
}

export function loadLightingAnchorIndex(projectRoot?: string): LightingAnchorIndex {
  return readJson(resolveProjectRoot(projectRoot), LIGHTING_ANCHOR_INDEX_PATH);
}

export function loadLightingAnchorAdapter(projectRoot?: string): LightingAnchorAdapter {
  return readJson(resolveProjectRoot(projectRoot), LIGHTING_ANCHOR_ADAPTER_PATH);
}

export function buildLightingTokens(anchor: LightingAnchorRecord): string[] {
  return [
    `lighting-anchor:${anchor.lighting_anchor_id}`,
    `lighting-dna:${anchor.lighting_dna_id}`,
    `key-light:${anchor.key_light_direction}`,
    `shadow:${anchor.shadow_direction}`,
    `color-temp:${anchor.color_temperature}`,
    `brightness:${anchor.brightness_range}`,
    `window-glow:${anchor.window_glow_strength}`,
    `ambient:${anchor.ambient_strength}`,
    `highlight:${anchor.highlight_behavior}`,
    ...anchor.visual_memory_tokens.map((token) => `lighting-spatial:${token}`),
  ];
}

export function buildLightingAnchorRenderPayload(
  anchor: LightingAnchorRecord
): LightingAnchorRenderPayload {
  return {
    lighting_tokens: buildLightingTokens(anchor),
    key_light_direction: anchor.key_light_direction,
    shadow_direction: anchor.shadow_direction,
    color_temperature: anchor.color_temperature,
    brightness_range: anchor.brightness_range,
    window_glow_strength: anchor.window_glow_strength,
    ambient_strength: anchor.ambient_strength,
    highlight_behavior: anchor.highlight_behavior,
    forbidden_mutation_rules: [...anchor.forbidden_mutation_rules],
    light_source_positions: [...anchor.light_source_positions],
  };
}

export function buildLightingDnaToAnchorMapEntry(
  anchor: LightingAnchorRecord
): LightingDnaToAnchorMapEntry {
  return {
    lighting_dna_id: anchor.lighting_dna_id,
    lighting_anchor_id: anchor.lighting_anchor_id,
    lighting_tokens: buildLightingTokens(anchor),
    render_payload: buildLightingAnchorRenderPayload(anchor),
  };
}

export function resolveLightingAnchorByDnaId(
  lightingDnaId: string,
  projectRoot?: string
): LightingAnchorResolution | null {
  const adapter = loadLightingAnchorAdapter(projectRoot);
  const entry = adapter.dna_to_anchor_map.find((row) => row.lighting_dna_id === lightingDnaId);
  if (!entry) return null;
  return {
    lighting_dna_id: entry.lighting_dna_id,
    lighting_anchor_id: entry.lighting_anchor_id,
    lighting_tokens: entry.lighting_tokens,
    render_payload: entry.render_payload,
  };
}

export function resolveLightingAnchorByAnchorId(
  lightingAnchorId: string,
  projectRoot?: string
): LightingAnchorResolution | null {
  const library = loadLightingAnchorLibrary(projectRoot);
  const anchor = library.anchors.find((row) => row.lighting_anchor_id === lightingAnchorId);
  if (!anchor) return null;
  return {
    lighting_dna_id: anchor.lighting_dna_id,
    lighting_anchor_id: anchor.lighting_anchor_id,
    lighting_tokens: buildLightingTokens(anchor),
    render_payload: buildLightingAnchorRenderPayload(anchor),
  };
}

export function buildLightingContinuityTokens(resolution: LightingAnchorResolution): string[] {
  return [...new Set(resolution.lighting_tokens)];
}

export function enrichAnchorsWithLightingAnchor(
  anchors: readonly string[],
  lightingDnaId: string,
  projectRoot?: string
): string[] {
  const resolution = resolveLightingAnchorByDnaId(lightingDnaId, projectRoot);
  if (!resolution) return [...anchors];
  return [...new Set([...anchors, ...buildLightingContinuityTokens(resolution)])].sort();
}

export function buildLightingAnchorAdapterFromLibrary(
  library: LightingAnchorLibrary,
  parentAdapterReference = 'exports/image_app/adapters/location-lighting-image-adapter.json'
): Record<string, unknown> {
  const dnaToAnchorMap = library.anchors.map(buildLightingDnaToAnchorMapEntry);

  return {
    adapter_type: 'lighting_anchor_image_adapter',
    adapter_metadata: {
      adapter_name: 'lighting-anchor-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-LTD-005',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      lighting_anchor_count: library.anchors.length,
      library_reference: LIGHTING_ANCHOR_LIBRARY_PATH,
      index_reference: LIGHTING_ANCHOR_INDEX_PATH,
      parent_adapter_reference: parentAdapterReference,
      indoor_anchor_reference: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
    },
    adapter_responsibility_chain: [
      'lighting_dna_id',
      'lighting_anchor_id',
      'lighting_tokens',
      'render_payload',
    ],
    dna_to_anchor_map: dnaToAnchorMap,
    runtime_verification_fields: {
      lighting_anchor_id: { exported: true, required_for_lighting: true },
      lighting_tokens: { exported: true, required_for_lighting: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Image App must read lighting-anchor and lighting-spatial tokens; FAIL if fields ignored even when dataset exists.',
    },
    image_app_contract: {
      supported_lighting_anchor_ids: [...INITIAL_LIGHTING_ANCHOR_IDS],
      resolution_flow: {
        step_1: 'resolve lighting_dna_id from location-lighting pair or shot time',
        step_2: 'lookup lighting_anchor_id via dna_to_anchor_map',
        step_3: 'attach lighting_tokens to continuity layer',
        step_4: 'merge render_payload into lighting field only',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_005_validation_target: {
      test_id: 'RKB-005',
      test_name: 'LIGHTING_VALIDATION',
      generation_count_per_anchor: 10,
      comparison_baselines: ['RKB-003', 'RKB-004'],
      review_criteria: [
        'lighting_identity',
        'shadow_direction',
        'color_consistency',
        'brightness_consistency',
        'atmosphere_consistency',
      ],
      success_condition:
        'Lighting stability visibly stronger than RKB-003 and RKB-004; lighting identity remains recognizable across 10 generations per anchor.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'lighting_dna_library_v1',
          reference_path: 'datasets/lighting/lighting-dna-library-v1.json',
        },
        {
          asset_id: 'location_lighting_image_adapter',
          reference_path: parentAdapterReference,
        },
        {
          asset_id: 'indoor_location_anchor_adapter',
          reference_path: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
        },
      ],
    },
  };
}
