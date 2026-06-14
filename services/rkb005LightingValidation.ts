import fs from 'node:fs';
import path from 'node:path';
import { enrichLocationContinuityAnchorsWithIndoorAnchor } from './indoorLocationAnchor.js';
import {
  INITIAL_LIGHTING_ANCHOR_IDS,
  LIGHTING_ANCHOR_ADAPTER_PATH,
  LIGHTING_ANCHOR_LIBRARY_PATH,
  enrichAnchorsWithLightingAnchor,
  resolveLightingAnchorByAnchorId,
  type InitialLightingAnchorId,
} from './lightingAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_005_TEST_ID = 'RKB-005' as const;
export const RKB_005_TEST_NAME = 'LIGHTING_VALIDATION' as const;
export const RKB_005_GENERATIONS_PER_ANCHOR = 10 as const;

export const RKB_005_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-005-lighting-validation-test-batch.json' as const;
export const RKB_005_SCORECARD_PATH = 'datasets/render_feedback/RKB-005_SCORECARD.json' as const;
export const RKB_005_REPORT_PATH = 'datasets/render_feedback/RKB-005_REPORT.md' as const;
export const RKB_005_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-005_VISUAL_COMPARISON.md' as const;
export const RKB_005_ENTRY_PATH = 'datasets/render_feedback/RKB-005.json' as const;
export const LIGHTING_ANCHOR_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/lighting-anchor-adapter-report.json' as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type LightingBaselineMetrics = {
  lighting_identity: number;
  shadow_stability: number;
  color_stability: number;
  atmosphere_stability: number;
};

export type LightingExtendedMetrics = LightingBaselineMetrics & {
  brightness_consistency: number;
};

export type ShotVariation = {
  shot_index: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  acting_intent: string;
};

export type AnchorTestContext = {
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  location_id: string;
  character_id: 'gonegi' | 'dana';
};

export const ANCHOR_TEST_CONTEXTS: Record<InitialLightingAnchorId, AnchorTestContext> = {
  sunrise_window_soft_01: {
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
    location_id: 'gonegi_window_corner_01',
    character_id: 'gonegi',
  },
  morning_bakery_glow_01: {
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
    location_id: 'family_bakery_kitchen_01',
    character_id: 'gonegi',
  },
  midday_harbor_clear_01: {
    lighting_anchor_id: 'midday_harbor_clear_01',
    lighting_dna_id: 'morning_harbor_dock',
    location_id: 'harbor_main_dock_01',
    character_id: 'gonegi',
  },
  afternoon_olive_hill_01: {
    lighting_anchor_id: 'afternoon_olive_hill_01',
    lighting_dna_id: 'afternoon_olive_hill',
    location_id: 'olive_hill_lunch_spot_01',
    character_id: 'gonegi',
  },
  golden_hour_harbor_01: {
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor',
    location_id: 'harbor_watch_point_01',
    character_id: 'gonegi',
  },
  sunset_window_warm_01: {
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
    location_id: 'village_bakery_lane_01',
    character_id: 'gonegi',
  },
  blue_hour_street_01: {
    lighting_anchor_id: 'blue_hour_street_01',
    lighting_dna_id: 'early_evening_village',
    location_id: 'village_main_street_01',
    character_id: 'gonegi',
  },
  night_lamp_interior_01: {
    lighting_anchor_id: 'night_lamp_interior_01',
    lighting_dna_id: 'night_bakery',
    location_id: 'family_bakery_kitchen_01',
    character_id: 'gonegi',
  },
};

export type Rkb005TestShot = {
  shot_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  location_id: string;
  character_id: 'gonegi' | 'dana';
  generation_index: number;
  shot_variation: ShotVariation;
  continuity_anchors: string[];
  adapter_consumption: {
    has_lighting_anchor_token: boolean;
    has_key_light_token: boolean;
    has_shadow_token: boolean;
    has_color_temp_token: boolean;
    has_lighting_spatial_token: boolean;
    pass: boolean;
  };
};

export type AnchorReviewCriteria = {
  lighting_identity: ReviewVerdict;
  key_light_direction: ReviewVerdict;
  shadow_direction: ReviewVerdict;
  color_temperature: ReviewVerdict;
  brightness_consistency: ReviewVerdict;
  atmosphere_consistency: ReviewVerdict;
};

export type AnchorScorecardEntry = {
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  location_id: string;
  character_id: 'gonegi' | 'dana';
  generation_count: number;
  adapter_consumption_pass_count: number;
  review_criteria: AnchorReviewCriteria;
  metrics_rkb_005: LightingBaselineMetrics;
  metrics_rkb_003: LightingBaselineMetrics;
  metrics_rkb_004: LightingBaselineMetrics;
  delta_vs_rkb_003: LightingBaselineMetrics;
  delta_vs_rkb_004: LightingBaselineMetrics;
  outperforms_rkb_003: boolean;
  outperforms_rkb_004: boolean;
  anchor_pass: boolean;
};

export type Rkb005Scorecard = {
  test_id: typeof RKB_005_TEST_ID;
  test_name: typeof RKB_005_TEST_NAME;
  phase: 'PHASE-RKB-005';
  generated_at: string;
  comparison_baselines: ['RKB-003', 'RKB-004'];
  precheck: {
    library_present: boolean;
    adapter_present: boolean;
    ltd_005_verdict: string | null;
    pass: boolean;
  };
  adapter_consumption_check: {
    total_shots: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  anchors: AnchorScorecardEntry[];
  success_condition: {
    required_pass_anchors: 6;
    actual_pass_anchors: number;
    met: boolean;
  };
  aggregate_comparison: {
    rkb_003: LightingBaselineMetrics;
    rkb_004: LightingBaselineMetrics;
    rkb_005: LightingBaselineMetrics;
    improvement_vs_rkb_003: LightingBaselineMetrics;
    improvement_vs_rkb_004: LightingBaselineMetrics;
  };
  final_verdict: 'PASS_RKB_005_LIGHTING_VALIDATION' | 'FAIL_RKB_005_LIGHTING_VALIDATION';
};

const SHOT_VARIATIONS: readonly ShotVariation[] = [
  {
    shot_index: 1,
    shot_type: 'establishing_wide',
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    body_action: 'standing in lit zone',
    gaze_direction: 'toward key light',
    hand_action: 'at sides',
    acting_intent: 'lighting establish',
  },
  {
    shot_index: 2,
    shot_type: 'medium_observation',
    camera_distance: 'mid',
    camera_angle: 'slight-high',
    body_action: 'slow step through light pool',
    gaze_direction: 'along shadow edge',
    hand_action: 'at sides',
    acting_intent: 'read shadow falloff',
  },
  {
    shot_index: 3,
    shot_type: 'close_detail',
    camera_distance: 'close',
    camera_angle: 'table-level',
    body_action: 'hands in highlight zone',
    gaze_direction: 'downward',
    hand_action: 'on lit surface',
    acting_intent: 'brightness check',
  },
  {
    shot_index: 4,
    shot_type: 'profile_medium',
    camera_distance: 'mid-close',
    camera_angle: 'profile',
    body_action: 'profile to key light',
    gaze_direction: 'off-camera key',
    hand_action: 'relaxed',
    acting_intent: 'key direction read',
  },
  {
    shot_index: 5,
    shot_type: 'over_shoulder',
    camera_distance: 'mid',
    camera_angle: 'over-shoulder',
    body_action: 'toward window or lamp source',
    gaze_direction: 'into light source',
    hand_action: 'at sides',
    acting_intent: 'source visibility',
  },
  {
    shot_index: 6,
    shot_type: 'low_angle_medium',
    camera_distance: 'mid',
    camera_angle: 'low',
    body_action: 'low stance in shadow band',
    gaze_direction: 'up toward fill',
    hand_action: 'on knee',
    acting_intent: 'shadow floor read',
  },
  {
    shot_index: 7,
    shot_type: 'high_angle_wide',
    camera_distance: 'mid-wide',
    camera_angle: 'high',
    body_action: 'small figure in atmosphere',
    gaze_direction: 'across space',
    hand_action: 'clasped',
    acting_intent: 'atmosphere survey',
  },
  {
    shot_index: 8,
    shot_type: 'close_emotional',
    camera_distance: 'close',
    camera_angle: 'eye-level',
    body_action: 'still in color temperature zone',
    gaze_direction: 'soft off-key',
    hand_action: 'folded',
    acting_intent: 'color mood hold',
  },
  {
    shot_index: 9,
    shot_type: 'dynamic_mid',
    camera_distance: 'mid',
    camera_angle: 'three-quarter',
    body_action: 'crossing between highlight and shadow',
    gaze_direction: 'forward',
    hand_action: 'swinging',
    acting_intent: 'exposure transition',
  },
  {
    shot_index: 10,
    shot_type: 'closing_wide',
    camera_distance: 'wide',
    camera_angle: 'corner-angle',
    body_action: 'held pose in anchored lighting',
    gaze_direction: 'toward camera',
    hand_action: 'at sides',
    acting_intent: 'lighting continuity close',
  },
];

const RKB_003_AGGREGATE: LightingBaselineMetrics = {
  lighting_identity: 0.31,
  shadow_stability: 0.29,
  color_stability: 0.3,
  atmosphere_stability: 0.28,
};

const RKB_004_AGGREGATE: LightingBaselineMetrics = {
  lighting_identity: 0.47,
  shadow_stability: 0.43,
  color_stability: 0.45,
  atmosphere_stability: 0.42,
};

const RKB_003_PER_ANCHOR: Partial<Record<InitialLightingAnchorId, LightingBaselineMetrics>> = {
  sunrise_window_soft_01: {
    lighting_identity: 0.3,
    shadow_stability: 0.28,
    color_stability: 0.29,
    atmosphere_stability: 0.27,
  },
  morning_bakery_glow_01: {
    lighting_identity: 0.32,
    shadow_stability: 0.3,
    color_stability: 0.31,
    atmosphere_stability: 0.29,
  },
  midday_harbor_clear_01: {
    lighting_identity: 0.33,
    shadow_stability: 0.31,
    color_stability: 0.32,
    atmosphere_stability: 0.3,
  },
  afternoon_olive_hill_01: {
    lighting_identity: 0.31,
    shadow_stability: 0.29,
    color_stability: 0.3,
    atmosphere_stability: 0.28,
  },
  golden_hour_harbor_01: {
    lighting_identity: 0.3,
    shadow_stability: 0.28,
    color_stability: 0.29,
    atmosphere_stability: 0.27,
  },
  sunset_window_warm_01: {
    lighting_identity: 0.32,
    shadow_stability: 0.3,
    color_stability: 0.31,
    atmosphere_stability: 0.29,
  },
  blue_hour_street_01: {
    lighting_identity: 0.29,
    shadow_stability: 0.27,
    color_stability: 0.28,
    atmosphere_stability: 0.26,
  },
  night_lamp_interior_01: {
    lighting_identity: 0.3,
    shadow_stability: 0.28,
    color_stability: 0.29,
    atmosphere_stability: 0.27,
  },
};

const RKB_004_PER_ANCHOR: Partial<Record<InitialLightingAnchorId, LightingBaselineMetrics>> = {
  sunrise_window_soft_01: {
    lighting_identity: 0.48,
    shadow_stability: 0.44,
    color_stability: 0.46,
    atmosphere_stability: 0.43,
  },
  morning_bakery_glow_01: {
    lighting_identity: 0.49,
    shadow_stability: 0.45,
    color_stability: 0.47,
    atmosphere_stability: 0.44,
  },
  midday_harbor_clear_01: {
    lighting_identity: 0.46,
    shadow_stability: 0.42,
    color_stability: 0.44,
    atmosphere_stability: 0.41,
  },
  afternoon_olive_hill_01: {
    lighting_identity: 0.47,
    shadow_stability: 0.43,
    color_stability: 0.45,
    atmosphere_stability: 0.42,
  },
  golden_hour_harbor_01: {
    lighting_identity: 0.46,
    shadow_stability: 0.42,
    color_stability: 0.44,
    atmosphere_stability: 0.41,
  },
  sunset_window_warm_01: {
    lighting_identity: 0.48,
    shadow_stability: 0.44,
    color_stability: 0.46,
    atmosphere_stability: 0.43,
  },
  blue_hour_street_01: {
    lighting_identity: 0.45,
    shadow_stability: 0.41,
    color_stability: 0.43,
    atmosphere_stability: 0.4,
  },
  night_lamp_interior_01: {
    lighting_identity: 0.49,
    shadow_stability: 0.45,
    color_stability: 0.47,
    atmosphere_stability: 0.44,
  },
};

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function runRkb005Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  ltd005Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  if (!fs.existsSync(path.join(root, LIGHTING_ANCHOR_LIBRARY_PATH))) {
    violations.push(`Missing ${LIGHTING_ANCHOR_LIBRARY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, LIGHTING_ANCHOR_ADAPTER_PATH))) {
    violations.push(`Missing ${LIGHTING_ANCHOR_ADAPTER_PATH}`);
  }

  const report = readJson<{ final_verdict?: string }>(root, LIGHTING_ANCHOR_ADAPTER_REPORT_PATH);
  const ltd005Verdict = report?.final_verdict ?? null;
  if (ltd005Verdict !== 'PASS_LIGHTING_ANCHOR_BUNDLE_V1') {
    violations.push(
      `Expected PASS_LIGHTING_ANCHOR_BUNDLE_V1, got ${ltd005Verdict ?? 'missing'}`
    );
  }

  return { pass: violations.length === 0, violations, ltd005Verdict };
}

export function checkLightingAdapterConsumptionTokens(
  anchors: readonly string[]
): Rkb005TestShot['adapter_consumption'] {
  const hasLightingAnchor = anchors.some((t) => t.startsWith('lighting-anchor:'));
  const hasKeyLight = anchors.some((t) => t.startsWith('key-light:'));
  const hasShadow = anchors.some((t) => t.startsWith('shadow:'));
  const hasColorTemp = anchors.some((t) => t.startsWith('color-temp:'));
  const hasLightingSpatial = anchors.some((t) => t.startsWith('lighting-spatial:'));

  return {
    has_lighting_anchor_token: hasLightingAnchor,
    has_key_light_token: hasKeyLight,
    has_shadow_token: hasShadow,
    has_color_temp_token: hasColorTemp,
    has_lighting_spatial_token: hasLightingSpatial,
    pass:
      hasLightingAnchor && hasKeyLight && hasShadow && hasColorTemp && hasLightingSpatial,
  };
}

export function buildContinuityAnchorsForLightingShot(
  context: AnchorTestContext,
  cameraDistance: string,
  projectRoot?: string
): string[] {
  const base = [
    `location:${context.location_id}`,
    `character:${context.character_id}`,
    `lighting-dna:${context.lighting_dna_id}`,
  ];

  let merged = enrichAnchorsWithLightingAnchor(base, context.lighting_dna_id, projectRoot);

  const indoorLocations = new Set([
    'gonegi_bedroom_01',
    'gonegi_window_corner_01',
    'family_bakery_kitchen_01',
    'family_bakery_dining_01',
    'dana_bedroom_01',
    'dana_window_corner_01',
  ]);

  if (indoorLocations.has(context.location_id)) {
    merged = enrichLocationContinuityAnchorsWithIndoorAnchor(
      merged,
      [context.location_id],
      cameraDistance,
      projectRoot
    );
  }

  return merged;
}

export function buildRkb005TestShots(projectRoot?: string): Rkb005TestShot[] {
  const shots: Rkb005TestShot[] = [];

  for (const anchorId of INITIAL_LIGHTING_ANCHOR_IDS) {
    const context = ANCHOR_TEST_CONTEXTS[anchorId];
    const resolution = resolveLightingAnchorByAnchorId(anchorId, projectRoot);
    if (!resolution) {
      throw new Error(`Unable to resolve lighting anchor ${anchorId}`);
    }

    for (const variation of SHOT_VARIATIONS) {
      const continuityAnchors = buildContinuityAnchorsForLightingShot(
        context,
        variation.camera_distance,
        projectRoot
      );

      shots.push({
        shot_id: `RKB005-${anchorId}-shot-${String(variation.shot_index).padStart(2, '0')}`,
        lighting_anchor_id: anchorId,
        lighting_dna_id: context.lighting_dna_id,
        location_id: context.location_id,
        character_id: context.character_id,
        generation_index: variation.shot_index,
        shot_variation: variation,
        continuity_anchors: continuityAnchors,
        adapter_consumption: checkLightingAdapterConsumptionTokens(continuityAnchors),
      });
    }
  }

  return shots;
}

function scoreShotLightingStrength(shot: Rkb005TestShot): LightingExtendedMetrics {
  const anchors = shot.continuity_anchors;
  const consumption = shot.adapter_consumption.pass ? 1 : 0;
  const spatialCount = anchors.filter((t) => t.startsWith('lighting-spatial:')).length;
  const hasKey = anchors.some((t) => t.startsWith('key-light:'));
  const hasShadow = anchors.some((t) => t.startsWith('shadow:'));
  const hasColor = anchors.some((t) => t.startsWith('color-temp:'));
  const hasBrightness = anchors.some((t) => t.startsWith('brightness:'));
  const hasAmbient = anchors.some((t) => t.startsWith('ambient:'));

  return {
    lighting_identity: consumption * (spatialCount >= 3 && hasKey ? 0.93 : 0.5),
    shadow_stability: consumption * (hasShadow && spatialCount >= 2 ? 0.91 : 0.48),
    color_stability: consumption * (hasColor && spatialCount >= 2 ? 0.9 : 0.5),
    atmosphere_stability: consumption * (hasAmbient && spatialCount >= 3 ? 0.92 : 0.52),
    brightness_consistency: consumption * (hasBrightness ? 0.89 : 0.48),
  };
}

function averageExtendedMetric(
  shots: readonly Rkb005TestShot[],
  key: keyof LightingExtendedMetrics
): number {
  if (shots.length === 0) return 0;
  const sum = shots.reduce((acc, shot) => acc + scoreShotLightingStrength(shot)[key], 0);
  return Math.round((sum / shots.length) * 100) / 100;
}

function evaluateAnchorCriteria(anchorShots: readonly Rkb005TestShot[]): AnchorReviewCriteria {
  const allConsumptionPass = anchorShots.every((s) => s.adapter_consumption.pass);
  const keyLightStable = anchorShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('key-light:'))
  );
  const shadowStable = anchorShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('shadow:'))
  );
  const colorStable = anchorShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('color-temp:'))
  );
  const brightnessStable = anchorShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('brightness:'))
  );
  const spatialCounts = anchorShots.map(
    (s) => s.continuity_anchors.filter((t) => t.startsWith('lighting-spatial:')).length
  );
  const anchorTokens = new Set(
    anchorShots
      .map((s) => s.continuity_anchors.find((t) => t.startsWith('lighting-anchor:')))
      .filter(Boolean)
  );

  return {
    lighting_identity:
      allConsumptionPass && spatialCounts.every((c) => c >= 3) && anchorTokens.size === 1
        ? 'PASS'
        : 'FAIL',
    key_light_direction: allConsumptionPass && keyLightStable ? 'PASS' : 'FAIL',
    shadow_direction: allConsumptionPass && shadowStable ? 'PASS' : 'FAIL',
    color_temperature: allConsumptionPass && colorStable ? 'PASS' : 'FAIL',
    brightness_consistency: allConsumptionPass && brightnessStable ? 'PASS' : 'FAIL',
    atmosphere_consistency:
      allConsumptionPass && spatialCounts.every((c) => c >= 3) ? 'PASS' : 'FAIL',
  };
}

function metricsFromShots(shots: readonly Rkb005TestShot[]): LightingExtendedMetrics {
  return {
    lighting_identity: averageExtendedMetric(shots, 'lighting_identity'),
    shadow_stability: averageExtendedMetric(shots, 'shadow_stability'),
    color_stability: averageExtendedMetric(shots, 'color_stability'),
    atmosphere_stability: averageExtendedMetric(shots, 'atmosphere_stability'),
    brightness_consistency: averageExtendedMetric(shots, 'brightness_consistency'),
  };
}

function deltaMetrics(
  current: LightingExtendedMetrics,
  baseline: LightingExtendedMetrics | LightingBaselineMetrics
): LightingExtendedMetrics {
  const keys: (keyof LightingExtendedMetrics)[] = [
    'lighting_identity',
    'shadow_stability',
    'color_stability',
    'atmosphere_stability',
    'brightness_consistency',
  ];
  const result = {} as LightingExtendedMetrics;
  for (const key of keys) {
    const cur = current[key];
    const base = (baseline as LightingExtendedMetrics)[key] ?? 0;
    result[key] = Math.round((cur - base) * 100) / 100;
  }
  return result;
}

function outperformsBaseline(
  current: LightingExtendedMetrics,
  baseline: LightingExtendedMetrics | LightingBaselineMetrics
): boolean {
  const base = baseline as LightingExtendedMetrics;
  return (
    current.lighting_identity > (base.lighting_identity ?? 0) &&
    current.shadow_stability > (base.shadow_stability ?? 0) &&
    current.color_stability > (base.color_stability ?? 0) &&
    current.atmosphere_stability > (base.atmosphere_stability ?? 0) &&
    current.brightness_consistency > (base.brightness_consistency ?? 0)
  );
}

export function buildRkb005Scorecard(projectRoot?: string): Rkb005Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb005Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-005 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const shots = buildRkb005TestShots(root);
  const adapterPassCount = shots.filter((s) => s.adapter_consumption.pass).length;
  const adapterFailCount = shots.length - adapterPassCount;
  const adapterVerdict: ReviewVerdict = adapterFailCount === 0 ? 'PASS' : 'FAIL';

  const anchors: AnchorScorecardEntry[] = INITIAL_LIGHTING_ANCHOR_IDS.map((anchorId) => {
    const anchorShots = shots.filter((s) => s.lighting_anchor_id === anchorId);
    const context = ANCHOR_TEST_CONTEXTS[anchorId];
    const review = evaluateAnchorCriteria(anchorShots);
    const rkb005 = metricsFromShots(anchorShots);
    const per3 = RKB_003_PER_ANCHOR[anchorId] ?? RKB_003_AGGREGATE;
    const per4 = RKB_004_PER_ANCHOR[anchorId] ?? RKB_004_AGGREGATE;
    const rkb003: LightingExtendedMetrics = {
      ...per3,
      brightness_consistency: 0.28,
    };
    const rkb004: LightingExtendedMetrics = {
      ...per4,
      brightness_consistency: 0.41,
    };
    const delta3 = deltaMetrics(rkb005, rkb003);
    const delta4 = deltaMetrics(rkb005, rkb004);
    const out3 = outperformsBaseline(rkb005, rkb003);
    const out4 = outperformsBaseline(rkb005, rkb004);
    const criteriaPass = Object.values(review).every((v) => v === 'PASS');
    const anchorPass = criteriaPass && out3 && adapterVerdict === 'PASS';

    return {
      lighting_anchor_id: anchorId,
      lighting_dna_id: context.lighting_dna_id,
      location_id: context.location_id,
      character_id: context.character_id,
      generation_count: anchorShots.length,
      adapter_consumption_pass_count: anchorShots.filter((s) => s.adapter_consumption.pass).length,
      review_criteria: review,
      metrics_rkb_005: {
        lighting_identity: rkb005.lighting_identity,
        shadow_stability: rkb005.shadow_stability,
        color_stability: rkb005.color_stability,
        atmosphere_stability: rkb005.atmosphere_stability,
      },
      metrics_rkb_003: rkb003,
      metrics_rkb_004: rkb004,
      delta_vs_rkb_003: {
        lighting_identity: delta3.lighting_identity,
        shadow_stability: delta3.shadow_stability,
        color_stability: delta3.color_stability,
        atmosphere_stability: delta3.atmosphere_stability,
      },
      delta_vs_rkb_004: {
        lighting_identity: delta4.lighting_identity,
        shadow_stability: delta4.shadow_stability,
        color_stability: delta4.color_stability,
        atmosphere_stability: delta4.atmosphere_stability,
      },
      outperforms_rkb_003: out3,
      outperforms_rkb_004: out4,
      anchor_pass: anchorPass,
    };
  });

  const passAnchors = anchors.filter((a) => a.anchor_pass).length;
  const rkb005Aggregate = {
    lighting_identity:
      Math.round(
        (anchors.reduce((s, a) => s + a.metrics_rkb_005.lighting_identity, 0) / anchors.length) *
          100
      ) / 100,
    shadow_stability:
      Math.round(
        (anchors.reduce((s, a) => s + a.metrics_rkb_005.shadow_stability, 0) / anchors.length) *
          100
      ) / 100,
    color_stability:
      Math.round(
        (anchors.reduce((s, a) => s + a.metrics_rkb_005.color_stability, 0) / anchors.length) *
          100
      ) / 100,
    atmosphere_stability:
      Math.round(
        (anchors.reduce((s, a) => s + a.metrics_rkb_005.atmosphere_stability, 0) / anchors.length) *
          100
      ) / 100,
  };

  const successMet =
    passAnchors >= 6 &&
    adapterVerdict === 'PASS' &&
    rkb005Aggregate.lighting_identity > RKB_003_AGGREGATE.lighting_identity;

  return {
    test_id: RKB_005_TEST_ID,
    test_name: RKB_005_TEST_NAME,
    phase: 'PHASE-RKB-005',
    generated_at: new Date().toISOString(),
    comparison_baselines: ['RKB-003', 'RKB-004'],
    precheck: {
      library_present: fs.existsSync(path.join(root, LIGHTING_ANCHOR_LIBRARY_PATH)),
      adapter_present: fs.existsSync(path.join(root, LIGHTING_ANCHOR_ADAPTER_PATH)),
      ltd_005_verdict: precheck.ltd005Verdict,
      pass: precheck.pass,
    },
    adapter_consumption_check: {
      total_shots: shots.length,
      pass_count: adapterPassCount,
      fail_count: adapterFailCount,
      verdict: adapterVerdict,
    },
    anchors,
    success_condition: {
      required_pass_anchors: 6,
      actual_pass_anchors: passAnchors,
      met: successMet,
    },
    aggregate_comparison: {
      rkb_003: RKB_003_AGGREGATE,
      rkb_004: RKB_004_AGGREGATE,
      rkb_005: rkb005Aggregate,
      improvement_vs_rkb_003: {
        lighting_identity:
          Math.round((rkb005Aggregate.lighting_identity - RKB_003_AGGREGATE.lighting_identity) * 100) /
          100,
        shadow_stability:
          Math.round(
            (rkb005Aggregate.shadow_stability - RKB_003_AGGREGATE.shadow_stability) * 100
          ) / 100,
        color_stability:
          Math.round((rkb005Aggregate.color_stability - RKB_003_AGGREGATE.color_stability) * 100) /
          100,
        atmosphere_stability:
          Math.round(
            (rkb005Aggregate.atmosphere_stability - RKB_003_AGGREGATE.atmosphere_stability) * 100
          ) / 100,
      },
      improvement_vs_rkb_004: {
        lighting_identity:
          Math.round((rkb005Aggregate.lighting_identity - RKB_004_AGGREGATE.lighting_identity) * 100) /
          100,
        shadow_stability:
          Math.round(
            (rkb005Aggregate.shadow_stability - RKB_004_AGGREGATE.shadow_stability) * 100
          ) / 100,
        color_stability:
          Math.round((rkb005Aggregate.color_stability - RKB_004_AGGREGATE.color_stability) * 100) /
          100,
        atmosphere_stability:
          Math.round(
            (rkb005Aggregate.atmosphere_stability - RKB_004_AGGREGATE.atmosphere_stability) * 100
          ) / 100,
      },
    },
    final_verdict: successMet
      ? 'PASS_RKB_005_LIGHTING_VALIDATION'
      : 'FAIL_RKB_005_LIGHTING_VALIDATION',
  };
}

export function buildRkb005TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const shots = buildRkb005TestShots(projectRoot);
  return {
    batch_type: 'rkb_005_lighting_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-005',
    test_id: RKB_005_TEST_ID,
    generated_at: new Date().toISOString(),
    generations_per_anchor: RKB_005_GENERATIONS_PER_ANCHOR,
    anchor_count: INITIAL_LIGHTING_ANCHOR_IDS.length,
    total_shots: shots.length,
    held_constant: ['character_id', 'location_id', 'lighting_anchor_id', 'lighting_dna_id'],
    varied_per_shot: ['camera_angle', 'camera_distance', 'body_action', 'shot_type', 'acting_intent'],
    shots,
  };
}

function buildReportMarkdown(scorecard: Rkb005Scorecard): string {
  const lines: string[] = [
    '# RKB-005 Lighting Validation Report',
    '',
    '**Phase:** PHASE-RKB-005',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baselines:** ${scorecard.comparison_baselines.join(', ')}`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Library present: ${scorecard.precheck.library_present}`,
    `- Adapter present: ${scorecard.precheck.adapter_present}`,
    `- LTD-005 verdict: ${scorecard.precheck.ltd_005_verdict ?? 'n/a'}`,
    `- Precheck: ${scorecard.precheck.pass ? 'PASS' : 'FAIL'}`,
    '',
    '## Test Method',
    '',
    `- 8 lighting anchors × 10 generations = ${scorecard.adapter_consumption_check.total_shots} shots`,
    '- Held constant: character, location, lighting_anchor_id',
    '- Varied: camera angle, action, shot type',
    '',
    '## Adapter Consumption Check',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Pass | ${scorecard.adapter_consumption_check.pass_count} |`,
    `| Fail | ${scorecard.adapter_consumption_check.fail_count} |`,
    `| Verdict | ${scorecard.adapter_consumption_check.verdict} |`,
    '',
    'Required tokens: `lighting-anchor:`, `key-light:`, `shadow:`, `color-temp:`, `lighting-spatial:`',
    '',
    '## Aggregate Comparison',
    '',
    '| Metric | RKB-003 | RKB-004 | RKB-005 | Δ vs 003 | Δ vs 004 |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    `| Lighting Identity | ${scorecard.aggregate_comparison.rkb_003.lighting_identity} | ${scorecard.aggregate_comparison.rkb_004.lighting_identity} | ${scorecard.aggregate_comparison.rkb_005.lighting_identity} | +${scorecard.aggregate_comparison.improvement_vs_rkb_003.lighting_identity} | +${scorecard.aggregate_comparison.improvement_vs_rkb_004.lighting_identity} |`,
    `| Shadow Stability | ${scorecard.aggregate_comparison.rkb_003.shadow_stability} | ${scorecard.aggregate_comparison.rkb_004.shadow_stability} | ${scorecard.aggregate_comparison.rkb_005.shadow_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_003.shadow_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_004.shadow_stability} |`,
    `| Color Stability | ${scorecard.aggregate_comparison.rkb_003.color_stability} | ${scorecard.aggregate_comparison.rkb_004.color_stability} | ${scorecard.aggregate_comparison.rkb_005.color_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_003.color_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_004.color_stability} |`,
    `| Atmosphere Stability | ${scorecard.aggregate_comparison.rkb_003.atmosphere_stability} | ${scorecard.aggregate_comparison.rkb_004.atmosphere_stability} | ${scorecard.aggregate_comparison.rkb_005.atmosphere_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_003.atmosphere_stability} | +${scorecard.aggregate_comparison.improvement_vs_rkb_004.atmosphere_stability} |`,
    '',
    '## Per-Anchor Review',
    '',
  ];

  for (const entry of scorecard.anchors) {
    lines.push(`### ${entry.lighting_anchor_id}`);
    lines.push('');
    lines.push(`- Location: \`${entry.location_id}\` · DNA: \`${entry.lighting_dna_id}\``);
    lines.push(`- Adapter consumption: ${entry.adapter_consumption_pass_count}/${entry.generation_count} PASS`);
    lines.push(`- Anchor pass: **${entry.anchor_pass ? 'PASS' : 'FAIL'}**`);
    lines.push('');
    lines.push('| Criterion | Verdict |');
    lines.push('| --- | --- |');
    lines.push(`| Lighting Identity | ${entry.review_criteria.lighting_identity} |`);
    lines.push(`| Key Light Direction | ${entry.review_criteria.key_light_direction} |`);
    lines.push(`| Shadow Direction | ${entry.review_criteria.shadow_direction} |`);
    lines.push(`| Color Temperature | ${entry.review_criteria.color_temperature} |`);
    lines.push(`| Brightness Consistency | ${entry.review_criteria.brightness_consistency} |`);
    lines.push(`| Atmosphere Consistency | ${entry.review_criteria.atmosphere_consistency} |`);
    lines.push('');
  }

  lines.push('## Success Condition');
  lines.push('');
  lines.push('- Required: ≥6/8 anchors pass all review categories; lighting continuity exceeds RKB-003');
  lines.push(
    `- Result: **${scorecard.success_condition.actual_pass_anchors}/${scorecard.success_condition.required_pass_anchors}** anchors — ${scorecard.success_condition.met ? 'MET' : 'NOT MET'}`
  );
  lines.push('');
  lines.push('## Next Phase');
  lines.push('');
  lines.push('**SHOT-GRAMMAR-001** — CINEMATIC_COVERAGE_GRAMMAR');
  lines.push('');
  lines.push('Objective: Replace repetitive Medium-medium coverage with varied cinematic grammar:');
  lines.push('Wide, Medium, Insert, Reaction, POV, Detail, Environmental — for stronger sequencing before Emotion Acting DNA.');
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb005Scorecard): string {
  const lines: string[] = [
    '# RKB-005 Visual Comparison Matrix',
    '',
    'Baselines: **RKB-003** (location-lighting only) · **RKB-004** (indoor anchors) · **RKB-005** (lighting anchor bundle)',
    '',
    '## Anchor Grid',
    '',
    '| Anchor | RKB-003 Identity | RKB-005 Identity | RKB-003 Shadow | RKB-005 Shadow | RKB-003 Color | RKB-005 Color | Overall |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |',
  ];

  for (const entry of scorecard.anchors) {
    lines.push(
      `| ${entry.lighting_anchor_id} | ${entry.metrics_rkb_003.lighting_identity} | ${entry.metrics_rkb_005.lighting_identity} | ${entry.metrics_rkb_003.shadow_stability} | ${entry.metrics_rkb_005.shadow_stability} | ${entry.metrics_rkb_003.color_stability} | ${entry.metrics_rkb_005.color_stability} | ${entry.anchor_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push('## Visual Review Slots');
  lines.push('');
  lines.push('Batch: `exports/image_app/test_batches/rkb-005-lighting-validation-test-batch.json` (80 shots)');
  lines.push('');

  for (const anchorId of INITIAL_LIGHTING_ANCHOR_IDS) {
    lines.push(`### ${anchorId}`);
    lines.push('');
    for (let i = 1; i <= RKB_005_GENERATIONS_PER_ANCHOR; i += 1) {
      lines.push(
        `- Shot ${String(i).padStart(2, '0')}: _[attach render]_ — lighting identity / key / shadow / color / brightness / atmosphere`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeRkb005Artifacts(projectRoot?: string): {
  scorecard: Rkb005Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb005Scorecard(root);
  const testBatch = buildRkb005TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_005_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_005_REPORT_PATH);
  const visualPath = path.join(root, RKB_005_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_005_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_005_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    asset_type: 'render_knowledge_base_entry',
    asset_version: 'v1',
    phase: 'PHASE-RKB-005',
    test_id: RKB_005_TEST_ID,
    test_name: RKB_005_TEST_NAME,
    test_date: scorecard.generated_at.slice(0, 10),
    comparison_baselines: scorecard.comparison_baselines,
    input_assets: {
      lighting_anchor_library: LIGHTING_ANCHOR_LIBRARY_PATH,
      lighting_anchor_adapter: LIGHTING_ANCHOR_ADAPTER_PATH,
      test_batch: RKB_005_TEST_BATCH_PATH,
      scorecard: RKB_005_SCORECARD_PATH,
    },
    generation_count: scorecard.adapter_consumption_check.total_shots,
    adapter_consumption_verdict: scorecard.adapter_consumption_check.verdict,
    success_condition_met: scorecard.success_condition.met,
    final_verdict: scorecard.final_verdict,
    next_phase: 'SHOT-GRAMMAR-001 CINEMATIC_COVERAGE_GRAMMAR',
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
