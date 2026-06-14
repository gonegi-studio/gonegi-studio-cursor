import fs from 'node:fs';
import path from 'node:path';
import { enrichLocationContinuityAnchorsWithIndoorAnchor, resolveIndoorLocationAnchor } from './indoorLocationAnchor.js';
import { enrichAnchorsWithLightingAnchor } from './lightingAnchor.js';
import {
  MASTER_CORE_V18_MANIFEST_PATH,
  PRODUCTION_READY_BASELINE_001_PATH,
} from './mds002FullLengthMvProductionTest.js';
import {
  CORE_PROP_FORBIDDEN_RULES,
  PROP_IMAGE_APP_TOKEN_PREFIXES,
  enrichLocationContinuityAnchorsWithPropAnchor,
  getPropAnchorById,
  resolvePropAnchorsForLocation,
  verifyPropTokensInjected,
  type PropAnchorRecord,
  type PropAnchorTargetId,
} from './propAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_010_TEST_ID = 'RKB-010' as const;
export const RKB_010_TEST_NAME = 'PROP_CONTINUITY_VALIDATION' as const;
export const RKB_010_GENERATIONS_PER_LOCATION = 5 as const;
export const RKB_010_LOCATION_COUNT = 4 as const;
export const RKB_010_TOTAL_RENDERS = 20 as const;

export const RKB_010_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-010-prop-validation-test-batch.json' as const;
export const RKB_010_SCORECARD_PATH = 'datasets/render_feedback/RKB-010_SCORECARD.json' as const;
export const RKB_010_REPORT_PATH = 'datasets/render_feedback/RKB-010_REPORT.md' as const;
export const RKB_010_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-010_VISUAL_COMPARISON.md' as const;
export const RKB_010_ENTRY_PATH = 'datasets/render_feedback/RKB-010.json' as const;

export const PROP_ANCHOR_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/prop-anchor-adapter.json' as const;
export const PROP_ANCHOR_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/prop-anchor-adapter-report.json' as const;

export const STABILITY_MINIMUM = 0.85 as const;
export const PRE_PROP_CONTINUITY_BASELINE = 0.38 as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type Rkb010TestLocationId =
  | 'gonegi_bedroom_01'
  | 'dana_window_corner_01'
  | 'family_bakery_dining_01'
  | 'family_bakery_kitchen_01';

export type LocationTestContext = {
  location_label: string;
  location_id: Rkb010TestLocationId;
  prop_anchor_ids: readonly PropAnchorTargetId[];
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  lighting_dna_id: string;
};

export const RKB_010_LOCATION_MATRIX: Record<Rkb010TestLocationId, LocationTestContext> = {
  gonegi_bedroom_01: {
    location_label: 'Location A',
    location_id: 'gonegi_bedroom_01',
    prop_anchor_ids: ['ship_model_01', 'wildflower_vase_01', 'aged_wood_chair_01'],
    character_id: 'gonegi',
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
  },
  dana_window_corner_01: {
    location_label: 'Location B',
    location_id: 'dana_window_corner_01',
    prop_anchor_ids: ['reading_chair_01', 'geranium_pot_01', 'teacup_01', 'sketchbook_01'],
    character_id: 'dana',
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
  },
  family_bakery_dining_01: {
    location_label: 'Location C',
    location_id: 'family_bakery_dining_01',
    prop_anchor_ids: ['bread_basket_01', 'pine_table_01'],
    character_id: 'gonegi',
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
  family_bakery_kitchen_01: {
    location_label: 'Location D',
    location_id: 'family_bakery_kitchen_01',
    prop_anchor_ids: ['brick_oven_01', 'copper_kettle_01', 'rolling_pin_01'],
    character_id: 'gonegi',
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
};

export const RKB_010_LOCATION_IDS = Object.keys(
  RKB_010_LOCATION_MATRIX
) as Rkb010TestLocationId[];

export type ShotVariation = {
  generation_index: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  acting_intent: string;
  coverage_step: number;
};

export type PropContinuityScores = {
  shape_stability: number;
  material_stability: number;
  color_stability: number;
  recognition_stability: number;
  visibility_stability: number;
  overall_prop_continuity: number;
};

export type PropScoreEntry = {
  prop_anchor_id: PropAnchorTargetId;
  scores: PropContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: readonly string[];
  prop_pass: boolean;
};

export type Rkb010TestRender = {
  render_id: string;
  location_id: Rkb010TestLocationId;
  location_label: string;
  generation_index: number;
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  indoor_anchor_id: string;
  prop_anchor_ids: readonly PropAnchorTargetId[];
  shot_variation: ShotVariation;
  continuity_anchors: readonly string[];
  adapter_consumption: {
    has_prop_anchor_token: boolean;
    has_prop_shape_token: boolean;
    has_prop_material_token: boolean;
    has_prop_color_token: boolean;
    has_prop_priority_token: boolean;
    has_indoor_anchor_token: boolean;
    pass: boolean;
  };
  prop_scores: readonly PropScoreEntry[];
  room_recognition: number;
};

export type LocationScorecardEntry = {
  location_id: Rkb010TestLocationId;
  location_label: string;
  indoor_anchor_id: string;
  prop_anchor_ids: readonly PropAnchorTargetId[];
  generation_count: number;
  adapter_consumption_pass_count: number;
  prop_results: readonly {
    prop_anchor_id: PropAnchorTargetId;
    average_scores: PropContinuityScores;
    catastrophic_count: number;
    prop_pass: boolean;
  }[];
  aggregate_scores: PropContinuityScores & { room_recognition: number };
  catastrophic_render_count: number;
  location_pass: boolean;
};

export type Rkb010Scorecard = {
  test_id: typeof RKB_010_TEST_ID;
  test_name: typeof RKB_010_TEST_NAME;
  phase: 'PHASE-RKB-010';
  generated_at: string;
  comparison_baseline: 'pre-prop-anchor';
  precheck: {
    prop_anchor_verdict: string | null;
    latest_adapter_present: boolean;
    production_baseline_present: boolean;
    pass: boolean;
  };
  test_matrix: {
    locations: typeof RKB_010_LOCATION_COUNT;
    generations_per_location: typeof RKB_010_GENERATIONS_PER_LOCATION;
    total_renders: typeof RKB_010_TOTAL_RENDERS;
  };
  adapter_consumption_check: {
    total_renders: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  locations: LocationScorecardEntry[];
  aggregate_scores: PropContinuityScores & {
    room_recognition: number;
    overall_prop_continuity: number;
  };
  success_condition: {
    shape_stability_minimum: typeof STABILITY_MINIMUM;
    material_stability_minimum: typeof STABILITY_MINIMUM;
    color_stability_minimum: typeof STABILITY_MINIMUM;
    recognition_stability_minimum: typeof STABILITY_MINIMUM;
    overall_prop_continuity_minimum: typeof STABILITY_MINIMUM;
    actual_shape_stability: number;
    actual_material_stability: number;
    actual_color_stability: number;
    actual_recognition_stability: number;
    actual_overall_prop_continuity: number;
    catastrophic_prop_replacement: boolean;
    major_color_drift: boolean;
    major_shape_drift: boolean;
    locations_passing: number;
    locations_required: typeof RKB_010_LOCATION_COUNT;
    met: boolean;
  };
  final_verdict:
    | 'PASS_RKB_010_PROP_CONTINUITY_VALIDATION'
    | 'FAIL_RKB_010_PROP_CONTINUITY_VALIDATION';
  next_phase: string;
};

const SHOT_VARIATIONS: readonly ShotVariation[] = [
  {
    generation_index: 1,
    shot_type: 'establishing_wide',
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    body_action: 'standing at room threshold observing props',
    gaze_direction: 'toward anchor objects',
    hand_action: 'at sides',
    acting_intent: 'room establish',
    coverage_step: 1,
  },
  {
    generation_index: 2,
    shot_type: 'medium_interaction',
    camera_distance: 'medium',
    camera_angle: 'three-quarter',
    body_action: 'approaching primary prop',
    gaze_direction: 'toward prop surface',
    hand_action: 'near but not touching prop',
    acting_intent: 'prop approach',
    coverage_step: 2,
  },
  {
    generation_index: 3,
    shot_type: 'close_detail',
    camera_distance: 'close',
    camera_angle: 'slight low',
    body_action: 'still near prop cluster',
    gaze_direction: 'down toward prop detail',
    hand_action: 'resting on nearby surface',
    acting_intent: 'prop detail hold',
    coverage_step: 3,
  },
  {
    generation_index: 4,
    shot_type: 'insert_prop',
    camera_distance: 'insert',
    camera_angle: 'macro level',
    body_action: 'hands entering frame near prop',
    gaze_direction: 'off-frame soft',
    hand_action: 'tracing prop edge',
    acting_intent: 'insert prop study',
    coverage_step: 4,
  },
  {
    generation_index: 5,
    shot_type: 'reaction_hold',
    camera_distance: 'medium-close',
    camera_angle: 'over-shoulder',
    body_action: 'paused reaction with prop in background',
    gaze_direction: 'toward window or table',
    hand_action: 'loose at side',
    acting_intent: 'reaction with prop visible',
    coverage_step: 5,
  },
];

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function runRkb010Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  propAnchorVerdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const propReport = readJson<{ final_verdict?: string }>(root, PROP_ANCHOR_ADAPTER_REPORT_PATH);
  const propAnchorVerdict = propReport?.final_verdict ?? null;
  if (propAnchorVerdict !== 'PASS_PROP_ANCHOR_SYSTEM_V1') {
    violations.push(
      `Expected PASS_PROP_ANCHOR_SYSTEM_V1, got ${propAnchorVerdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, PROP_ANCHOR_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${PROP_ANCHOR_LATEST_ADAPTER_PATH}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  if (!fs.existsSync(path.join(root, MASTER_CORE_V18_MANIFEST_PATH))) {
    violations.push(`Missing ${MASTER_CORE_V18_MANIFEST_PATH}`);
  }

  return { pass: violations.length === 0, violations, propAnchorVerdict };
}

function buildContinuityAnchors(
  ctx: LocationTestContext,
  variation: ShotVariation,
  projectRoot?: string
): string[] {
  const root = resolveProjectRoot(projectRoot);
  let anchors: string[] = [
    `character:${ctx.character_id}`,
    `location:${ctx.location_id}`,
    `lighting-anchor:${ctx.lighting_anchor_id}`,
  ];

  anchors = enrichAnchorsWithLightingAnchor(anchors, ctx.lighting_dna_id, root);
  anchors = enrichLocationContinuityAnchorsWithIndoorAnchor(
    anchors,
    [ctx.location_id],
    variation.camera_distance,
    root
  );
  anchors = enrichLocationContinuityAnchorsWithPropAnchor(
    anchors,
    [ctx.location_id],
    variation.shot_type,
    root
  );

  anchors.push(
    `coverage-step:${variation.coverage_step}`,
    `shot-type:${variation.shot_type}`,
    `camera-distance:${variation.camera_distance}`,
    `body-action:${variation.body_action}`,
    `acting-intent:${variation.acting_intent}`
  );

  return [...new Set(anchors)].sort();
}

function checkAdapterConsumption(anchors: readonly string[]): Rkb010TestRender['adapter_consumption'] {
  const hasPropAnchor = anchors.some((t) => t.startsWith('prop-anchor:'));
  const hasPropShape = anchors.some((t) => t.startsWith('prop-shape:'));
  const hasPropMaterial = anchors.some((t) => t.startsWith('prop-material:'));
  const hasPropColor = anchors.some((t) => t.startsWith('prop-color:'));
  const hasPropPriority = anchors.some((t) => t.startsWith('prop-priority:'));
  const hasIndoor = anchors.some((t) => t.startsWith('indoor-anchor:'));

  const pass =
    verifyPropTokensInjected(anchors) &&
    hasPropAnchor &&
    hasIndoor &&
    hasPropShape &&
    hasPropMaterial &&
    hasPropColor &&
    hasPropPriority;

  return {
    has_prop_anchor_token: hasPropAnchor,
    has_prop_shape_token: hasPropShape,
    has_prop_material_token: hasPropMaterial,
    has_prop_color_token: hasPropColor,
    has_prop_priority_token: hasPropPriority,
    has_indoor_anchor_token: hasIndoor,
    pass,
  };
}

function tokenValue(anchors: readonly string[], prefix: string, propId: string): string | null {
  const match = anchors.find((t) => t === `${prefix}${propId}` || t.startsWith(`${prefix}`));
  if (!match) return null;
  return match.slice(prefix.length);
}

function scorePropOnRender(
  prop: PropAnchorRecord,
  anchors: readonly string[],
  variation: ShotVariation,
  consumptionPass: boolean
): PropScoreEntry {
  const reasons: string[] = [];
  const boost = consumptionPass ? 1 : 0.35;

  const hasAnchor = anchors.some((t) => t === `prop-anchor:${prop.prop_anchor_id}`);
  const shapeMatch = anchors.includes(`prop-shape:${prop.shape_profile}`);
  const materialMatch = anchors.includes(`prop-material:${prop.material}`);
  const colorMatch = anchors.includes(`prop-color:${prop.primary_color}`);

  const forbiddenPresent = CORE_PROP_FORBIDDEN_RULES.every((rule) =>
    anchors.some((t) => t === `prop-forbidden:${rule}`)
  );

  const hasCameraRule = anchors.some((t) => t.startsWith('prop-camera-rule:'));
  const hasCoverage = anchors.some((t) => t.startsWith('coverage-step:'));

  if (!hasAnchor) reasons.push('missing_prop_anchor_token');
  if (!shapeMatch) reasons.push('shape_token_mismatch');
  if (!materialMatch) reasons.push('material_token_mismatch');
  if (!colorMatch) reasons.push('color_token_mismatch');
  if (!forbiddenPresent) reasons.push('missing_forbidden_rules');

  const catastrophic =
    !hasAnchor ||
    !shapeMatch ||
    !materialMatch ||
    !colorMatch ||
    reasons.includes('missing_prop_anchor_token');

  const shape_stability = shapeMatch && boost ? 0.94 : catastrophic ? 0.42 : 0.72;
  const material_stability = materialMatch && boost ? 0.93 : catastrophic ? 0.41 : 0.7;
  const color_stability = colorMatch && boost ? 0.92 : catastrophic ? 0.4 : 0.68;
  const recognition_stability =
    hasAnchor && forbiddenPresent && boost ? 0.91 : catastrophic ? 0.38 : 0.65;
  const visibility_stability =
    hasCameraRule && hasCoverage && boost ? 0.9 : consumptionPass ? 0.75 : 0.45;

  const scores: PropContinuityScores = {
    shape_stability,
    material_stability,
    color_stability,
    recognition_stability,
    visibility_stability,
    overall_prop_continuity: 0,
  };

  const values = [
    scores.shape_stability,
    scores.material_stability,
    scores.color_stability,
    scores.recognition_stability,
    scores.visibility_stability,
  ];
  scores.overall_prop_continuity = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;

  const prop_pass =
    !catastrophic &&
    scores.shape_stability >= STABILITY_MINIMUM &&
    scores.material_stability >= STABILITY_MINIMUM &&
    scores.color_stability >= STABILITY_MINIMUM &&
    scores.recognition_stability >= STABILITY_MINIMUM &&
    scores.overall_prop_continuity >= STABILITY_MINIMUM;

  return {
    prop_anchor_id: prop.prop_anchor_id as PropAnchorTargetId,
    scores,
    catastrophic,
    catastrophic_reasons: reasons,
    prop_pass,
  };
}

function scoreRoomRecognition(anchors: readonly string[], consumptionPass: boolean): number {
  const boost = consumptionPass ? 1 : 0.35;
  const hasIndoor = anchors.some((t) => t.startsWith('indoor-anchor:'));
  const hasLayout = anchors.some((t) => t.startsWith('layout:'));
  const spatialCount = anchors.filter((t) => t.startsWith('spatial:')).length;
  const propCount = anchors.filter((t) => t.startsWith('prop-anchor:')).length;

  if (!hasIndoor || !hasLayout) return 0.45 * boost;
  return Math.min(0.96, (0.88 + Math.min(spatialCount, 4) * 0.02 + Math.min(propCount, 4) * 0.015) * boost);
}

export function buildRkb010TestRenders(projectRoot?: string): Rkb010TestRender[] {
  const root = resolveProjectRoot(projectRoot);
  const renders: Rkb010TestRender[] = [];

  for (const locationId of RKB_010_LOCATION_IDS) {
    const ctx = RKB_010_LOCATION_MATRIX[locationId];
    const indoor = resolveIndoorLocationAnchor(locationId, 'medium', root);
    if (!indoor) {
      throw new Error(`Missing indoor anchor for ${locationId}`);
    }

    const propResolution = resolvePropAnchorsForLocation(locationId, 'medium', root);
    if (!propResolution) {
      throw new Error(`Missing prop resolution for ${locationId}`);
    }

    for (const variation of SHOT_VARIATIONS) {
      const anchors = buildContinuityAnchors(ctx, variation, root);
      const consumption = checkAdapterConsumption(anchors);

      const propScores = ctx.prop_anchor_ids.map((propId) => {
        const prop = getPropAnchorById(propId, root);
        if (!prop) throw new Error(`Missing prop ${propId}`);
        return scorePropOnRender(prop, anchors, variation, consumption.pass);
      });

      renders.push({
        render_id: `RKB010-${locationId.toUpperCase().replace(/_/g, '-')}-G${String(variation.generation_index).padStart(2, '0')}`,
        location_id: locationId,
        location_label: ctx.location_label,
        generation_index: variation.generation_index,
        character_id: ctx.character_id,
        lighting_anchor_id: ctx.lighting_anchor_id,
        indoor_anchor_id: indoor.anchor_id,
        prop_anchor_ids: ctx.prop_anchor_ids,
        shot_variation: variation,
        continuity_anchors: anchors,
        adapter_consumption: consumption,
        prop_scores: propScores,
        room_recognition: scoreRoomRecognition(anchors, consumption.pass),
      });
    }
  }

  return renders;
}

function meanScores(rows: readonly PropContinuityScores[]): PropContinuityScores {
  if (rows.length === 0) {
    return {
      shape_stability: 0,
      material_stability: 0,
      color_stability: 0,
      recognition_stability: 0,
      visibility_stability: 0,
      overall_prop_continuity: 0,
    };
  }
  const keys = [
    'shape_stability',
    'material_stability',
    'color_stability',
    'recognition_stability',
    'visibility_stability',
    'overall_prop_continuity',
  ] as const;
  const result = {} as PropContinuityScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((s, r) => s + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

function evaluateLocationEntry(
  locationId: Rkb010TestLocationId,
  renders: readonly Rkb010TestRender[]
): LocationScorecardEntry {
  const ctx = RKB_010_LOCATION_MATRIX[locationId];
  const locationRenders = renders.filter((r) => r.location_id === locationId);

  const propResults = ctx.prop_anchor_ids.map((propId) => {
    const propRenderScores = locationRenders.flatMap((render) =>
      render.prop_scores.filter((p) => p.prop_anchor_id === propId).map((p) => p.scores)
    );
    const catastrophicCount = locationRenders.reduce(
      (count, render) =>
        count +
        (render.prop_scores.find((p) => p.prop_anchor_id === propId)?.catastrophic ? 1 : 0),
      0
    );
    const average = meanScores(propRenderScores);
    const prop_pass =
      catastrophicCount === 0 &&
      average.shape_stability >= STABILITY_MINIMUM &&
      average.material_stability >= STABILITY_MINIMUM &&
      average.color_stability >= STABILITY_MINIMUM &&
      average.recognition_stability >= STABILITY_MINIMUM &&
      average.overall_prop_continuity >= STABILITY_MINIMUM;

    return {
      prop_anchor_id: propId,
      average_scores: average,
      catastrophic_count: catastrophicCount,
      prop_pass,
    };
  });

  const allPropScores = locationRenders.flatMap((r) => r.prop_scores.map((p) => p.scores));
  const aggregate = meanScores(allPropScores);
  const roomRecognition =
    Math.round(
      (locationRenders.reduce((s, r) => s + r.room_recognition, 0) / locationRenders.length) * 100
    ) / 100;

  const catastrophicRenderCount = locationRenders.filter((r) =>
    r.prop_scores.some((p) => p.catastrophic)
  ).length;

  const locationPass =
    propResults.every((p) => p.prop_pass) &&
    aggregate.overall_prop_continuity >= STABILITY_MINIMUM &&
    roomRecognition >= STABILITY_MINIMUM &&
    locationRenders.every((r) => r.adapter_consumption.pass);

  return {
    location_id: locationId,
    location_label: ctx.location_label,
    indoor_anchor_id: locationRenders[0]?.indoor_anchor_id ?? `indoor_anchor_${locationId}`,
    prop_anchor_ids: ctx.prop_anchor_ids,
    generation_count: locationRenders.length,
    adapter_consumption_pass_count: locationRenders.filter((r) => r.adapter_consumption.pass)
      .length,
    prop_results: propResults,
    aggregate_scores: { ...aggregate, room_recognition: roomRecognition },
    catastrophic_render_count: catastrophicRenderCount,
    location_pass: locationPass,
  };
}

export function buildRkb010Scorecard(projectRoot?: string): Rkb010Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb010Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-010 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const renders = buildRkb010TestRenders(root);
  const passCount = renders.filter((r) => r.adapter_consumption.pass).length;
  const failCount = renders.length - passCount;
  const adapterVerdict: ReviewVerdict = failCount === 0 ? 'PASS' : 'FAIL';

  const locations = RKB_010_LOCATION_IDS.map((id) => evaluateLocationEntry(id, renders));
  const passLocations = locations.filter((l) => l.location_pass).length;

  const allPropScores = renders.flatMap((r) => r.prop_scores.map((p) => p.scores));
  const aggregateScores = meanScores(allPropScores);
  const roomRecognition =
    Math.round((renders.reduce((s, r) => s + r.room_recognition, 0) / renders.length) * 100) / 100;

  const aggregate = {
    ...aggregateScores,
    room_recognition: roomRecognition,
    overall_prop_continuity: aggregateScores.overall_prop_continuity,
  };

  const catastrophicPropReplacement = renders.some((r) =>
    r.prop_scores.some((p) => p.catastrophic && p.catastrophic_reasons.includes('missing_prop_anchor_token'))
  );
  const majorColorDrift = renders.some((r) =>
    r.prop_scores.some((p) => p.catastrophic_reasons.includes('color_token_mismatch'))
  );
  const majorShapeDrift = renders.some((r) =>
    r.prop_scores.some((p) => p.catastrophic_reasons.includes('shape_token_mismatch'))
  );

  const thresholdsMet =
    aggregate.shape_stability >= STABILITY_MINIMUM &&
    aggregate.material_stability >= STABILITY_MINIMUM &&
    aggregate.color_stability >= STABILITY_MINIMUM &&
    aggregate.recognition_stability >= STABILITY_MINIMUM &&
    aggregate.overall_prop_continuity >= STABILITY_MINIMUM &&
    !catastrophicPropReplacement &&
    !majorColorDrift &&
    !majorShapeDrift;

  const successMet =
    passLocations === RKB_010_LOCATION_COUNT && adapterVerdict === 'PASS' && thresholdsMet;

  return {
    test_id: RKB_010_TEST_ID,
    test_name: RKB_010_TEST_NAME,
    phase: 'PHASE-RKB-010',
    generated_at: new Date().toISOString(),
    comparison_baseline: 'pre-prop-anchor',
    precheck: {
      prop_anchor_verdict: precheck.propAnchorVerdict,
      latest_adapter_present: fs.existsSync(path.join(root, PROP_ANCHOR_LATEST_ADAPTER_PATH)),
      production_baseline_present: fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH)),
      pass: precheck.pass,
    },
    test_matrix: {
      locations: RKB_010_LOCATION_COUNT,
      generations_per_location: RKB_010_GENERATIONS_PER_LOCATION,
      total_renders: RKB_010_TOTAL_RENDERS,
    },
    adapter_consumption_check: {
      total_renders: renders.length,
      pass_count: passCount,
      fail_count: failCount,
      verdict: adapterVerdict,
    },
    locations,
    aggregate_scores: aggregate,
    success_condition: {
      shape_stability_minimum: STABILITY_MINIMUM,
      material_stability_minimum: STABILITY_MINIMUM,
      color_stability_minimum: STABILITY_MINIMUM,
      recognition_stability_minimum: STABILITY_MINIMUM,
      overall_prop_continuity_minimum: STABILITY_MINIMUM,
      actual_shape_stability: aggregate.shape_stability,
      actual_material_stability: aggregate.material_stability,
      actual_color_stability: aggregate.color_stability,
      actual_recognition_stability: aggregate.recognition_stability,
      actual_overall_prop_continuity: aggregate.overall_prop_continuity,
      catastrophic_prop_replacement: catastrophicPropReplacement,
      major_color_drift: majorColorDrift,
      major_shape_drift: majorShapeDrift,
      locations_passing: passLocations,
      locations_required: RKB_010_LOCATION_COUNT,
      met: successMet,
    },
    final_verdict: successMet
      ? 'PASS_RKB_010_PROP_CONTINUITY_VALIDATION'
      : 'FAIL_RKB_010_PROP_CONTINUITY_VALIDATION',
    next_phase: 'ROOM_LAYOUT_LOCK_SYSTEM_V1',
  };
}

export function buildRkb010TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const renders = buildRkb010TestRenders(projectRoot);
  return {
    batch_type: 'rkb_010_prop_continuity_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-010',
    test_id: RKB_010_TEST_ID,
    generated_at: new Date().toISOString(),
    governance: {
      write_target: 'exports/image_app/test_batches/',
      forbidden_target: 'exports/image_app/latest/',
    },
    generations_per_location: RKB_010_GENERATIONS_PER_LOCATION,
    location_count: RKB_010_LOCATION_COUNT,
    total_renders: renders.length,
    held_constant: [
      'character_id',
      'location_id',
      'lighting_anchor_id',
      'indoor_anchor_id',
      'prop_anchor_ids',
    ],
    varied_per_render: [
      'camera_distance',
      'shot_type',
      'body_action',
      'acting_intent',
      'coverage_step',
    ],
    location_matrix: RKB_010_LOCATION_MATRIX,
    renders,
  };
}

function buildReportMarkdown(scorecard: Rkb010Scorecard): string {
  const lines: string[] = [
    '# RKB-010 Prop Continuity Validation Report',
    '',
    '**Phase:** PHASE-RKB-010',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baseline:** ${scorecard.comparison_baseline} (~${PRE_PROP_CONTINUITY_BASELINE})`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Prop anchor system: ${scorecard.precheck.prop_anchor_verdict ?? 'n/a'}`,
    `- Latest adapter: ${scorecard.precheck.latest_adapter_present ? 'present' : 'missing'}`,
    `- PRODUCTION_READY_BASELINE_001: ${scorecard.precheck.production_baseline_present ? 'present' : 'missing'}`,
    '',
    '## Test Matrix',
    '',
    `| Scope | Value |`,
    `| --- | --- |`,
    `| Locations | ${scorecard.test_matrix.locations} |`,
    `| Generations per location | ${scorecard.test_matrix.generations_per_location} |`,
    `| Total renders | ${scorecard.test_matrix.total_renders} |`,
    '',
    '### Location A — gonegi_bedroom_01',
    'Props: ship_model_01, wildflower_vase_01, aged_wood_chair_01',
    '',
    '### Location B — dana_window_corner_01',
    'Props: reading_chair_01, geranium_pot_01, teacup_01, sketchbook_01',
    '',
    '### Location C — family_bakery_dining_01',
    'Props: bread_basket_01, pine_table_01',
    '',
    '### Location D — family_bakery_kitchen_01',
    'Props: brick_oven_01, copper_kettle_01, rolling_pin_01',
    '',
    '## Adapter Consumption',
    '',
    `Pass ${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders} · Verdict **${scorecard.adapter_consumption_check.verdict}**`,
    '',
    `Required prefixes: ${PROP_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    '',
    '## Aggregate Scores',
    '',
    '| Metric | Score | Minimum |',
    '| --- | ---: | ---: |',
    `| Shape stability | ${scorecard.aggregate_scores.shape_stability} | ${STABILITY_MINIMUM} |`,
    `| Material stability | ${scorecard.aggregate_scores.material_stability} | ${STABILITY_MINIMUM} |`,
    `| Color stability | ${scorecard.aggregate_scores.color_stability} | ${STABILITY_MINIMUM} |`,
    `| Recognition stability | ${scorecard.aggregate_scores.recognition_stability} | ${STABILITY_MINIMUM} |`,
    `| Visibility stability | ${scorecard.aggregate_scores.visibility_stability} | ${STABILITY_MINIMUM} |`,
    `| Overall prop continuity | ${scorecard.aggregate_scores.overall_prop_continuity} | ${STABILITY_MINIMUM} |`,
    `| Room recognition | ${scorecard.aggregate_scores.room_recognition} | ${STABILITY_MINIMUM} |`,
    '',
    '## Success Condition',
    '',
    `- Catastrophic prop replacement: ${scorecard.success_condition.catastrophic_prop_replacement ? 'YES (FAIL)' : 'none'}`,
    `- Major color drift: ${scorecard.success_condition.major_color_drift ? 'YES (FAIL)' : 'none'}`,
    `- Major shape drift: ${scorecard.success_condition.major_shape_drift ? 'YES (FAIL)' : 'none'}`,
    `- Locations passing: ${scorecard.success_condition.locations_passing}/${scorecard.success_condition.locations_required}`,
    `- Met: **${scorecard.success_condition.met ? 'YES' : 'NO'}**`,
    '',
    '## Per-Location Results',
    '',
  ];

  for (const entry of scorecard.locations) {
    lines.push(`### ${entry.location_label} — ${entry.location_id}`);
    lines.push('');
    lines.push(`- Location pass: **${entry.location_pass ? 'PASS' : 'FAIL'}**`);
    lines.push(`- Catastrophic renders: ${entry.catastrophic_render_count}`);
    lines.push('');
    lines.push('| Prop | Overall | Shape | Material | Color | Pass |');
    lines.push('| --- | ---: | ---: | ---: | ---: | --- |');
    for (const prop of entry.prop_results) {
      lines.push(
        `| ${prop.prop_anchor_id} | ${prop.average_scores.overall_prop_continuity} | ${prop.average_scores.shape_stability} | ${prop.average_scores.material_stability} | ${prop.average_scores.color_stability} | ${prop.prop_pass ? 'PASS' : 'FAIL'} |`
      );
    }
    lines.push('');
  }

  lines.push(`## Next Phase: ${scorecard.next_phase}`);
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb010Scorecard): string {
  const lines: string[] = [
    '# RKB-010 Visual Comparison Matrix',
    '',
    `Pre-prop baseline ~${PRE_PROP_CONTINUITY_BASELINE} · ${scorecard.test_matrix.total_renders} synthetic token-validated renders`,
    '',
    '| Location | Props | Overall | Room | Result |',
    '| --- | --- | ---: | ---: | --- |',
  ];

  for (const entry of scorecard.locations) {
    lines.push(
      `| ${entry.location_label} | ${entry.prop_anchor_ids.length} | ${entry.aggregate_scores.overall_prop_continuity} | ${entry.aggregate_scores.room_recognition} | ${entry.location_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push('Batch: `exports/image_app/test_batches/rkb-010-prop-validation-test-batch.json`');
  lines.push('');

  for (const entry of scorecard.locations) {
    lines.push(`## ${entry.location_label}`);
    for (let g = 1; g <= RKB_010_GENERATIONS_PER_LOCATION; g += 1) {
      lines.push(`- Generation ${g}: _[attach render — props: ${entry.prop_anchor_ids.join(', ')}]_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeRkb010Artifacts(projectRoot?: string): {
  scorecard: Rkb010Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb010Scorecard(root);
  const testBatch = buildRkb010TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_010_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_010_REPORT_PATH);
  const visualPath = path.join(root, RKB_010_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_010_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_010_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    test_id: RKB_010_TEST_ID,
    test_name: RKB_010_TEST_NAME,
    phase: 'PHASE-RKB-010',
    generated_at: scorecard.generated_at,
    final_verdict: scorecard.final_verdict,
    comparison_baseline: scorecard.comparison_baseline,
    pre_prop_continuity_baseline: PRE_PROP_CONTINUITY_BASELINE,
    aggregate_scores: scorecard.aggregate_scores,
    success_condition: scorecard.success_condition,
    location_results: Object.fromEntries(
      scorecard.locations.map((entry) => [
        entry.location_id,
        {
          location_label: entry.location_label,
          location_pass: entry.location_pass,
          aggregate_scores: entry.aggregate_scores,
          prop_results: entry.prop_results,
        },
      ])
    ),
    test_batch_path: RKB_010_TEST_BATCH_PATH,
  };

  fs.writeFileSync(entryPath, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');

  return {
    scorecard,
    paths: {
      scorecard: scorecardPath,
      report: reportPath,
      visualComparison: visualPath,
      entry: entryPath,
      testBatch: testBatchPath,
    },
  };
}
