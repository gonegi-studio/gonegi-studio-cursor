import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COVERAGE_GRAMMAR_LIBRARY_PATH =
  'datasets/shot/coverage-grammar-library-v1.json' as const;
export const COVERAGE_GRAMMAR_INDEX_PATH =
  'datasets/shot/coverage-grammar-index-v1.json' as const;
export const SHOT_GRAMMAR_ADAPTER_PATH =
  'exports/image_app/adapters/shot-grammar-adapter.json' as const;

export const COVERAGE_PATTERN_IDS = [
  'coverage_pattern_01_establishing_insert_reaction',
  'coverage_pattern_02_environmental_close',
  'coverage_pattern_03_pov_insert_chain',
  'coverage_pattern_04_tracking_detail_close',
] as const;

export const SHOT_TYPES = [
  'establishing',
  'wide',
  'medium',
  'close',
  'extreme_close',
  'insert',
  'reaction',
  'over_shoulder',
  'pov',
  'environmental',
  'tracking',
  'profile',
  'silhouette',
] as const;

export type ShotType = (typeof SHOT_TYPES)[number];

export const REQUIRED_COVERAGE_FIELDS = [
  'coverage_id',
  'coverage_name',
  'coverage_sequence',
  'shot_priority',
  'allowed_followups',
  'forbidden_followups',
  'coverage_purpose',
  'compatible_scene_archetypes',
  'compatible_location_types',
  'compatible_lighting_anchors',
  'camera_continuity_rules',
  'anchor_visibility_rules',
] as const;

export const REQUIRED_COVERAGE_TOKENS = [
  'coverage-id:',
  'shot-type:',
  'coverage-step:',
  'coverage-purpose:',
  'forbidden-repeat:',
  'anchor-visibility:',
] as const;

export type CoverageRecord = {
  coverage_id: string;
  coverage_name: string;
  coverage_sequence: readonly string[];
  shot_priority: readonly string[];
  allowed_followups: Record<string, readonly string[]>;
  forbidden_followups: Record<string, readonly string[]>;
  coverage_purpose: string;
  compatible_scene_archetypes: readonly string[];
  compatible_location_types: readonly string[];
  compatible_lighting_anchors: readonly string[];
  camera_continuity_rules: readonly string[];
  anchor_visibility_rules: readonly string[];
};

export type CoverageGrammarLibrary = {
  coverages: readonly CoverageRecord[];
  shot_types?: readonly string[];
  global_forbidden_patterns?: readonly string[];
  global_forbidden_transitions?: readonly {
    from: string;
    to: string;
    max_consecutive: number;
  }[];
  max_same_shot_type_repeat?: number;
};

export type CoverageGrammarIndexEntry = {
  coverage_id: string;
  coverage_name: string;
  sequence_length: number;
  primary_scene_archetype: string;
};

export type CoverageGrammarIndex = {
  entries: readonly CoverageGrammarIndexEntry[];
  coverage_count?: number;
};

export type ShotCoverageStepPayload = {
  step_index: number;
  shot_type: string;
  coverage_tokens: readonly string[];
};

export type ShotCoverageRenderPayload = {
  coverage_id: string;
  coverage_purpose: string;
  shot_sequence: readonly string[];
  coverage_tokens: readonly string[];
  shot_steps: readonly ShotCoverageStepPayload[];
  forbidden_repeat_rules: readonly string[];
  anchor_visibility_rules: readonly string[];
  camera_continuity_rules: readonly string[];
};

export type SceneToCoverageMapEntry = {
  scene_archetype: string;
  location_id: string;
  lighting_anchor_id: string;
  action_type: string;
  coverage_id: string;
  shot_sequence: readonly string[];
  render_payload: ShotCoverageRenderPayload;
};

export type ShotGrammarAdapter = {
  scene_to_coverage_map: readonly SceneToCoverageMapEntry[];
};

export type ShotCoverageResolutionInput = {
  scene_archetype: string;
  location_id: string;
  lighting_anchor_id: string;
  action_type: string;
};

export type ShotCoverageResolution = {
  coverage_id: string;
  shot_sequence: readonly string[];
  coverage_tokens: readonly string[];
  render_payload: ShotCoverageRenderPayload;
};

const LOCATION_ID_TO_TYPE: Record<string, string> = {
  gonegi_bedroom_01: 'domestic_interior',
  gonegi_window_corner_01: 'domestic_corner',
  family_bakery_kitchen_01: 'bakery_interior',
  family_bakery_dining_01: 'bakery_interior',
  dana_bedroom_01: 'domestic_interior',
  dana_window_corner_01: 'domestic_corner',
  gonegi_harbor_dock_01: 'exterior_harbor',
  gonegi_olive_hill_01: 'exterior_hill',
  gonegi_street_lane_01: 'exterior_street',
  gonegi_coastal_path_01: 'exterior_path',
};

const ACTION_TO_COVERAGE_BIAS: Record<string, string> = {
  observe: 'coverage_pattern_01_establishing_insert_reaction',
  awaken: 'coverage_pattern_01_establishing_insert_reaction',
  work: 'coverage_pattern_02_environmental_close',
  walk: 'coverage_pattern_04_tracking_detail_close',
  arrive: 'coverage_pattern_04_tracking_detail_close',
  discover: 'coverage_pattern_03_pov_insert_chain',
  gaze: 'coverage_pattern_03_pov_insert_chain',
  react: 'coverage_pattern_02_environmental_close',
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing shot grammar asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadCoverageGrammarLibrary(projectRoot?: string): CoverageGrammarLibrary {
  return readJson(resolveProjectRoot(projectRoot), COVERAGE_GRAMMAR_LIBRARY_PATH);
}

export function loadCoverageGrammarIndex(projectRoot?: string): CoverageGrammarIndex {
  return readJson(resolveProjectRoot(projectRoot), COVERAGE_GRAMMAR_INDEX_PATH);
}

export function loadShotGrammarAdapter(projectRoot?: string): ShotGrammarAdapter {
  return readJson(resolveProjectRoot(projectRoot), SHOT_GRAMMAR_ADAPTER_PATH);
}

export function getCoverageById(
  coverageId: string,
  projectRoot?: string
): CoverageRecord | null {
  const library = loadCoverageGrammarLibrary(projectRoot);
  return library.coverages.find((row) => row.coverage_id === coverageId) ?? null;
}

export function inferLocationType(locationId: string): string {
  return LOCATION_ID_TO_TYPE[locationId] ?? 'domestic_interior';
}

export function scoreCoverageMatch(
  coverage: CoverageRecord,
  input: ShotCoverageResolutionInput
): number {
  let score = 0;
  const locationType = inferLocationType(input.location_id);

  if (coverage.compatible_scene_archetypes.includes(input.scene_archetype)) {
    score += 4;
  }
  if (coverage.compatible_location_types.includes(locationType)) {
    score += 3;
  }
  if (coverage.compatible_lighting_anchors.includes(input.lighting_anchor_id)) {
    score += 2;
  }
  if (ACTION_TO_COVERAGE_BIAS[input.action_type] === coverage.coverage_id) {
    score += 5;
  }

  return score;
}

export function validateCoverageSequence(sequence: readonly string[]): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (sequence.length < 2) {
    return { valid: true, violations };
  }

  const tripleMedium = (a: string, b: string, c: string) =>
    a === 'medium' && b === 'medium' && c === 'medium';
  const tripleClose = (a: string, b: string, c: string) =>
    a === 'close' && b === 'close' && c === 'close';

  for (let i = 0; i < sequence.length - 2; i += 1) {
    if (tripleMedium(sequence[i], sequence[i + 1], sequence[i + 2])) {
      violations.push('medium_then_medium_then_medium');
    }
    if (tripleClose(sequence[i], sequence[i + 1], sequence[i + 2])) {
      violations.push('close_then_close_then_close');
    }
  }

  for (let i = 0; i < sequence.length - 1; i += 1) {
    const from = sequence[i];
    const to = sequence[i + 1];
    if (from === 'insert' && to === 'insert') {
      violations.push('insert_then_insert');
    }
    if (from === 'reaction' && to === 'reaction') {
      violations.push('reaction_then_reaction');
    }
  }

  const counts = new Map<string, number>();
  for (const shot of sequence) {
    counts.set(shot, (counts.get(shot) ?? 0) + 1);
    if ((counts.get(shot) ?? 0) > 2) {
      violations.push(`same_shot_type_repeated_more_than_2:${shot}`);
    }
  }

  return { valid: violations.length === 0, violations: [...new Set(violations)] };
}

export function buildForbiddenRepeatTokens(): string[] {
  return [
    'forbidden-repeat:medium_then_medium_then_medium',
    'forbidden-repeat:close_then_close_then_close',
    'forbidden-repeat:insert_then_insert',
    'forbidden-repeat:reaction_then_reaction',
    'forbidden-repeat:same_shot_type_max_2',
  ];
}

export function buildCoverageStepTokens(
  coverage: CoverageRecord,
  stepIndex: number,
  shotType: string
): string[] {
  const stepNumber = stepIndex + 1;
  const visibility =
    coverage.anchor_visibility_rules[stepIndex] ??
    coverage.anchor_visibility_rules[coverage.anchor_visibility_rules.length - 1] ??
    'preserve_anchor_visibility';

  return [
    `coverage-id:${coverage.coverage_id}`,
    `shot-type:${shotType}`,
    `coverage-step:${stepNumber}`,
    `coverage-purpose:${coverage.coverage_purpose}`,
    ...buildForbiddenRepeatTokens(),
    `anchor-visibility:${visibility}`,
  ];
}

export function buildShotCoverageRenderPayload(coverage: CoverageRecord): ShotCoverageRenderPayload {
  const shot_steps = coverage.coverage_sequence.map((shotType, stepIndex) => ({
    step_index: stepIndex,
    shot_type: shotType,
    coverage_tokens: buildCoverageStepTokens(coverage, stepIndex, shotType),
  }));

  const coverage_tokens = [
    `coverage-id:${coverage.coverage_id}`,
    `coverage-purpose:${coverage.coverage_purpose}`,
    ...coverage.coverage_sequence.map(
      (shotType, index) => `shot-type:${shotType}@step-${index + 1}`
    ),
    ...buildForbiddenRepeatTokens(),
    ...coverage.anchor_visibility_rules.map((rule) => `anchor-visibility:${rule}`),
  ];

  return {
    coverage_id: coverage.coverage_id,
    coverage_purpose: coverage.coverage_purpose,
    shot_sequence: [...coverage.coverage_sequence],
    coverage_tokens,
    shot_steps,
    forbidden_repeat_rules: [
      'medium_then_medium_then_medium',
      'close_then_close_then_close',
      'insert_then_insert',
      'reaction_then_reaction',
      'same_shot_type_repeated_more_than_2',
    ],
    anchor_visibility_rules: [...coverage.anchor_visibility_rules],
    camera_continuity_rules: [...coverage.camera_continuity_rules],
  };
}

export function resolveCoverageFromInputs(
  input: ShotCoverageResolutionInput,
  projectRoot?: string
): ShotCoverageResolution | null {
  const library = loadCoverageGrammarLibrary(projectRoot);
  let best: CoverageRecord | null = null;
  let bestScore = -1;

  for (const coverage of library.coverages) {
    const score = scoreCoverageMatch(coverage, input);
    if (score > bestScore) {
      bestScore = score;
      best = coverage;
    }
  }

  if (!best || bestScore <= 0) {
    best = library.coverages[0] ?? null;
  }
  if (!best) return null;

  const render_payload = buildShotCoverageRenderPayload(best);
  return {
    coverage_id: best.coverage_id,
    shot_sequence: render_payload.shot_sequence,
    coverage_tokens: render_payload.coverage_tokens,
    render_payload,
  };
}

export function buildShotCoverageContinuityTokens(
  resolution: ShotCoverageResolution
): string[] {
  const stepTokens = resolution.render_payload.shot_steps.flatMap((step) => step.coverage_tokens);
  return [...new Set([...resolution.coverage_tokens, ...stepTokens])].sort();
}

export function enrichAnchorsWithShotCoverage(
  anchors: readonly string[],
  input: ShotCoverageResolutionInput,
  projectRoot?: string
): string[] {
  const resolution = resolveCoverageFromInputs(input, projectRoot);
  if (!resolution) return [...anchors];
  return [...new Set([...anchors, ...buildShotCoverageContinuityTokens(resolution)])].sort();
}

export function inferActionTypeFromBodyAction(bodyAction: string): string {
  const normalized = bodyAction.toLowerCase();
  if (normalized.includes('walk') || normalized.includes('step')) return 'walk';
  if (normalized.includes('arriv')) return 'arrive';
  if (normalized.includes('discover') || normalized.includes('find')) return 'discover';
  if (normalized.includes('gaze') || normalized.includes('look')) return 'gaze';
  if (normalized.includes('work') || normalized.includes('knead') || normalized.includes('mix')) {
    return 'work';
  }
  if (normalized.includes('react') || normalized.includes('turn')) return 'react';
  if (normalized.includes('awaken') || normalized.includes('wake')) return 'awaken';
  return 'observe';
}

export function inferSceneArchetype(
  bodyAction: string,
  actingIntent: string,
  locationIds: readonly string[]
): string {
  const locationId = locationIds[0] ?? '';
  const text = `${bodyAction} ${actingIntent}`.toLowerCase();

  if (locationId.includes('harbor') || locationId.includes('dock')) return 'harbor_work';
  if (locationId.includes('hill') || locationId.includes('olive')) return 'hill_afternoon';
  if (locationId.includes('street') || locationId.includes('lane')) return 'street_evening';
  if (locationId.includes('window')) return 'window_gaze';
  if (locationId.includes('bakery')) {
    if (text.includes('walk') || text.includes('arriv')) return 'movement_arrival';
    return 'bakery_opening';
  }
  if (text.includes('discover')) return 'discovery_moment';
  if (text.includes('walk') || text.includes('arriv')) return 'movement_arrival';
  if (text.includes('awaken') || text.includes('wake')) return 'domestic_morning';
  return 'interior_awakening';
}

export function inferLightingAnchorIdFromLocationAnchors(
  locationAnchors: readonly string[]
): string {
  for (const anchor of locationAnchors) {
    if (anchor.startsWith('lighting-anchor:')) {
      return anchor.slice('lighting-anchor:'.length);
    }
    if (anchor.startsWith('lighting:')) {
      const value = anchor.slice('lighting:'.length);
      if (value.includes('sunrise')) return 'sunrise_window_soft_01';
      if (value.includes('morning')) return 'morning_bakery_glow_01';
      if (value.includes('harbor')) return 'midday_harbor_clear_01';
      if (value.includes('golden')) return 'golden_hour_harbor_01';
      if (value.includes('night') || value.includes('lamp')) return 'night_lamp_interior_01';
    }
  }
  return 'sunrise_window_soft_01';
}

function buildSceneToCoverageMapEntry(
  coverage: CoverageRecord,
  scene_archetype: string,
  location_id: string,
  lighting_anchor_id: string,
  action_type: string
): SceneToCoverageMapEntry {
  const render_payload = buildShotCoverageRenderPayload(coverage);
  return {
    scene_archetype,
    location_id,
    lighting_anchor_id,
    action_type,
    coverage_id: coverage.coverage_id,
    shot_sequence: render_payload.shot_sequence,
    render_payload,
  };
}

export function buildSceneToCoverageMap(
  library: CoverageGrammarLibrary
): SceneToCoverageMapEntry[] {
  const entries: SceneToCoverageMapEntry[] = [];

  const mappingSpecs: Array<{
    coverage_id: string;
    scene_archetype: string;
    location_id: string;
    lighting_anchor_id: string;
    action_type: string;
  }> = [
    {
      coverage_id: COVERAGE_PATTERN_IDS[0],
      scene_archetype: 'domestic_morning',
      location_id: 'gonegi_bedroom_01',
      lighting_anchor_id: 'sunrise_window_soft_01',
      action_type: 'observe',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[0],
      scene_archetype: 'bakery_opening',
      location_id: 'family_bakery_kitchen_01',
      lighting_anchor_id: 'morning_bakery_glow_01',
      action_type: 'awaken',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[1],
      scene_archetype: 'harbor_work',
      location_id: 'gonegi_harbor_dock_01',
      lighting_anchor_id: 'midday_harbor_clear_01',
      action_type: 'work',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[1],
      scene_archetype: 'hill_afternoon',
      location_id: 'gonegi_olive_hill_01',
      lighting_anchor_id: 'afternoon_olive_hill_01',
      action_type: 'react',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[2],
      scene_archetype: 'discovery_moment',
      location_id: 'gonegi_window_corner_01',
      lighting_anchor_id: 'sunrise_window_soft_01',
      action_type: 'discover',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[2],
      scene_archetype: 'window_gaze',
      location_id: 'dana_window_corner_01',
      lighting_anchor_id: 'sunset_window_warm_01',
      action_type: 'gaze',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[3],
      scene_archetype: 'movement_arrival',
      location_id: 'family_bakery_kitchen_01',
      lighting_anchor_id: 'morning_bakery_glow_01',
      action_type: 'walk',
    },
    {
      coverage_id: COVERAGE_PATTERN_IDS[3],
      scene_archetype: 'movement_arrival',
      location_id: 'gonegi_harbor_dock_01',
      lighting_anchor_id: 'golden_hour_harbor_01',
      action_type: 'arrive',
    },
  ];

  for (const spec of mappingSpecs) {
    const coverage = library.coverages.find((row) => row.coverage_id === spec.coverage_id);
    if (!coverage) continue;
    entries.push(
      buildSceneToCoverageMapEntry(
        coverage,
        spec.scene_archetype,
        spec.location_id,
        spec.lighting_anchor_id,
        spec.action_type
      )
    );
  }

  return entries;
}

export function resolveCoverageFromAdapterMap(
  input: ShotCoverageResolutionInput,
  projectRoot?: string
): ShotCoverageResolution | null {
  const adapter = loadShotGrammarAdapter(projectRoot);
  const exact = adapter.scene_to_coverage_map.find(
    (row) =>
      row.scene_archetype === input.scene_archetype &&
      row.location_id === input.location_id &&
      row.lighting_anchor_id === input.lighting_anchor_id &&
      row.action_type === input.action_type
  );
  if (exact) {
    return {
      coverage_id: exact.coverage_id,
      shot_sequence: exact.shot_sequence,
      coverage_tokens: exact.render_payload.coverage_tokens,
      render_payload: exact.render_payload,
    };
  }
  return resolveCoverageFromInputs(input, projectRoot);
}

export function buildShotGrammarAdapterFromLibrary(
  library: CoverageGrammarLibrary,
  index: CoverageGrammarIndex
): Record<string, unknown> {
  const sceneToCoverageMap = buildSceneToCoverageMap(library);

  return {
    adapter_type: 'shot_grammar_image_adapter',
    adapter_metadata: {
      adapter_name: 'shot-grammar-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-SHOT-GRAMMAR-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      coverage_count: library.coverages.length,
      library_reference: COVERAGE_GRAMMAR_LIBRARY_PATH,
      index_reference: COVERAGE_GRAMMAR_INDEX_PATH,
      indoor_anchor_reference: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
      lighting_anchor_reference: 'exports/image_app/adapters/lighting-anchor-adapter.json',
    },
    adapter_responsibility_chain: [
      'scene_archetype',
      'location_id',
      'lighting_anchor_id',
      'action_type',
      'coverage_id',
      'shot_sequence',
      'render_payload',
    ],
    scene_to_coverage_map: sceneToCoverageMap,
    runtime_verification_fields: {
      coverage_id: { exported: true, required_for_coverage: true },
      shot_sequence: { exported: true, required_for_coverage: true },
      coverage_tokens: { exported: true, required_for_coverage: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      required_token_prefixes: [...REQUIRED_COVERAGE_TOKENS],
      secondary_validation:
        'Image App must read coverage-id, shot-type, coverage-step, coverage-purpose, forbidden-repeat, and anchor-visibility tokens; FAIL if medium-medium-medium chains appear.',
    },
    global_forbidden_patterns: library.global_forbidden_patterns ?? [],
    image_app_contract: {
      supported_shot_types: [...SHOT_TYPES],
      supported_coverage_ids: [...COVERAGE_PATTERN_IDS],
      resolution_flow: {
        step_1: 'resolve scene_archetype from story + location',
        step_2: 'resolve location_id and lighting_anchor_id',
        step_3: 'resolve action_type from body_action',
        step_4: 'lookup coverage_id via scene_to_coverage_map or scorer',
        step_5: 'attach shot_sequence and render_payload tokens',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_006_validation_target: {
      test_id: 'RKB-006',
      test_name: 'COVERAGE_VALIDATION',
      comparison_baselines: ['RKB-004', 'RKB-005'],
      review_criteria: [
        'shot_diversity',
        'coverage_sequence_validity',
        'no_medium_repetition_chains',
        'anchor_visibility_preservation',
      ],
      success_condition:
        'Coverage grammar tokens visible in Image App payloads; no forbidden medium-medium-medium sequences in exported shot steps.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: [
        {
          asset_id: 'coverage_grammar_library_v1',
          reference_path: COVERAGE_GRAMMAR_LIBRARY_PATH,
        },
        {
          asset_id: 'coverage_grammar_index_v1',
          reference_path: COVERAGE_GRAMMAR_INDEX_PATH,
        },
        {
          asset_id: 'indoor_location_anchor_adapter',
          reference_path: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
        },
        {
          asset_id: 'lighting_anchor_adapter',
          reference_path: 'exports/image_app/adapters/lighting-anchor-adapter.json',
        },
      ],
    },
    index_summary: index.entries,
  };
}
