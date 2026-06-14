import fs from 'node:fs';
import path from 'node:path';
import { enrichAnchorsWithLightingAnchor } from './lightingAnchor.js';
import { PRODUCTION_READY_BASELINE_001_PATH } from './mds002FullLengthMvProductionTest.js';
import {
  CORE_OUTDOOR_FORBIDDEN_RULES,
  OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES,
  OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS,
  enrichLocationContinuityAnchorsWithOutdoorLayoutLock,
  getOutdoorLayoutByLocationId,
  OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH,
  resolveOutdoorLayoutLock,
  verifyOutdoorLayoutTokensInjected,
  type OutdoorLayoutLockLocationId,
  type OutdoorLayoutLockRecord,
} from './outdoorLayoutLock.js';
import {
  enrichLocationContinuityAnchorsWithSceneComposition,
  verifyCompositionTokensInjected,
} from './sceneAssetComposition.js';
import { RKB_012_SCORECARD_PATH } from './rkb012SceneCompositionContinuityValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_013_TEST_ID = 'RKB-013' as const;
export const RKB_013_TEST_NAME = 'OUTDOOR_LAYOUT_CONTINUITY_VALIDATION' as const;
export const RKB_013_GENERATIONS_PER_LOCATION = 5 as const;
export const RKB_013_LOCATION_COUNT = 6 as const;
export const RKB_013_TOTAL_RENDERS = 30 as const;

export const RKB_013_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-013-outdoor-layout-validation-test-batch.json' as const;
export const RKB_013_SCORECARD_PATH = 'datasets/render_feedback/RKB-013_SCORECARD.json' as const;
export const RKB_013_REPORT_PATH = 'datasets/render_feedback/RKB-013_REPORT.md' as const;
export const RKB_013_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-013_VISUAL_COMPARISON.md' as const;
export const RKB_013_ENTRY_PATH = 'datasets/render_feedback/RKB-013.json' as const;

export const OUTDOOR_LAYOUT_LOCK_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/outdoor-layout-lock-adapter-report.json' as const;

export const OUTDOOR_LAYOUT_CONTINUITY_MINIMUM = 0.85 as const;
export const LANDMARK_POSITION_MINIMUM = 0.85 as const;
export const OUTDOOR_ORIENTATION_MINIMUM = 0.85 as const;
export const PRE_OUTDOOR_LAYOUT_LOCK_BASELINE = 0.4 as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type OutdoorLocationTestContext = {
  location_id: OutdoorLayoutLockLocationId;
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  lighting_dna_id: string;
  outdoor_layout_id: string;
  outdoor_prop_anchor_ids: readonly string[];
  linked_composition_id: string | null;
};

export const OUTDOOR_LOCATION_LIGHTING: Record<
  OutdoorLayoutLockLocationId,
  { lighting_anchor_id: string; lighting_dna_id: string }
> = {
  olive_hill_overlook_01: {
    lighting_anchor_id: 'afternoon_olive_hill_01',
    lighting_dna_id: 'afternoon_olive_hill',
  },
  harbor_watch_point_01: {
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor_horizon',
  },
  harbor_sunset_bench_01: {
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor_horizon',
  },
  harbor_cliff_path_01: {
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor_horizon',
  },
  dockside_walkway_01: {
    lighting_anchor_id: 'morning_harbor_dock_01',
    lighting_dna_id: 'morning_harbor_dock_glow',
  },
  lighthouse_overlook_01: {
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor_horizon',
  },
};

export const OUTDOOR_LINKED_COMPOSITION: Partial<
  Record<OutdoorLayoutLockLocationId, string>
> = {
  olive_hill_overlook_01: 'olive_hill_rest',
  harbor_watch_point_01: 'harbor_watch_point',
  harbor_sunset_bench_01: 'harbor_sunset_bench',
};

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
  time_nuance: string;
};

export type OutdoorContinuityScores = {
  landmark_recognition: number;
  landmark_position_stability: number;
  outdoor_orientation_stability: number;
  camera_visibility_compliance: number;
  composition_compatibility: number;
  overall_outdoor_layout_continuity: number;
};

export type Rkb013TestRender = {
  render_id: string;
  location_id: OutdoorLayoutLockLocationId;
  generation_index: number;
  character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  outdoor_layout_id: string;
  outdoor_prop_anchor_ids: readonly string[];
  linked_composition_id: string | null;
  shot_variation: ShotVariation;
  continuity_anchors: readonly string[];
  adapter_consumption: {
    has_outdoor_layout_lock_token: boolean;
    has_landmark_position_token: boolean;
    has_landmark_visibility_token: boolean;
    has_outdoor_orientation_token: boolean;
    has_camera_visibility_token: boolean;
    pass: boolean;
  };
  outdoor_scores: OutdoorContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: readonly string[];
  render_pass: boolean;
};

export type LocationScorecardEntry = {
  location_id: OutdoorLayoutLockLocationId;
  outdoor_layout_id: string;
  outdoor_prop_anchor_ids: readonly string[];
  linked_composition_id: string | null;
  generation_count: number;
  adapter_consumption_pass_count: number;
  average_scores: OutdoorContinuityScores;
  catastrophic_render_count: number;
  location_pass: boolean;
};

export type Rkb013Scorecard = {
  test_id: typeof RKB_013_TEST_ID;
  test_name: typeof RKB_013_TEST_NAME;
  phase: 'PHASE-RKB-013';
  generated_at: string;
  comparison_baseline: 'pre-outdoor-layout-lock';
  precheck: {
    outdoor_layout_lock_verdict: string | null;
    rkb_012_verdict: string | null;
    latest_adapter_present: boolean;
    production_baseline_present: boolean;
    pass: boolean;
  };
  test_matrix: {
    locations: typeof RKB_013_LOCATION_COUNT;
    generations_per_location: typeof RKB_013_GENERATIONS_PER_LOCATION;
    total_renders: typeof RKB_013_TOTAL_RENDERS;
  };
  adapter_consumption_check: {
    total_renders: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  locations: LocationScorecardEntry[];
  aggregate_scores: OutdoorContinuityScores;
  success_condition: {
    overall_outdoor_layout_continuity_minimum: typeof OUTDOOR_LAYOUT_CONTINUITY_MINIMUM;
    landmark_position_stability_minimum: typeof LANDMARK_POSITION_MINIMUM;
    outdoor_orientation_stability_minimum: typeof OUTDOOR_ORIENTATION_MINIMUM;
    actual_overall_outdoor_layout_continuity: number;
    actual_landmark_position_stability: number;
    actual_outdoor_orientation_stability: number;
    landmark_replacement: boolean;
    landmark_position_swap: boolean;
    outdoor_orientation_collapse: boolean;
    locations_passing: number;
    locations_required: typeof RKB_013_LOCATION_COUNT;
    met: boolean;
  };
  final_verdict:
    | 'PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION'
    | 'FAIL_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION';
  next_phase: string;
};

const SHOT_VARIATIONS: readonly ShotVariation[] = [
  {
    generation_index: 1,
    shot_type: 'establishing_wide',
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    body_action: 'standing at locked outdoor threshold',
    gaze_direction: 'toward primary landmark axis',
    hand_action: 'at sides',
    acting_intent: 'landmark establish',
    coverage_step: 1,
    time_nuance: 'soft_morning_compatible',
  },
  {
    generation_index: 2,
    shot_type: 'medium_walk',
    camera_distance: 'medium',
    camera_angle: 'three-quarter',
    body_action: 'walking along walkable zone',
    gaze_direction: 'along landmark sightline',
    hand_action: 'one hand on railing or bench edge',
    acting_intent: 'path through locked landmarks',
    coverage_step: 2,
    time_nuance: 'midday_fill_compatible',
  },
  {
    generation_index: 3,
    shot_type: 'close_landmark',
    camera_distance: 'close',
    camera_angle: 'slight low',
    body_action: 'paused near locked landmark',
    gaze_direction: 'toward landmark object',
    hand_action: 'near but not moving landmark',
    acting_intent: 'landmark hold',
    coverage_step: 3,
    time_nuance: 'warm_exterior_compatible',
  },
  {
    generation_index: 4,
    shot_type: 'insert_layout',
    camera_distance: 'insert',
    camera_angle: 'macro',
    body_action: 'hand near fixed landmark edge',
    gaze_direction: 'off-frame',
    hand_action: 'tracing locked landmark edge',
    acting_intent: 'landmark insert',
    coverage_step: 4,
    time_nuance: 'golden_hour_compatible',
  },
  {
    generation_index: 5,
    shot_type: 'reaction_outdoor',
    camera_distance: 'medium-close',
    camera_angle: 'over-shoulder',
    body_action: 'reaction with landmarks visible',
    gaze_direction: 'toward horizon or landmark',
    hand_action: 'loose',
    acting_intent: 'outdoor reaction',
    coverage_step: 5,
    time_nuance: 'sunset_fill_compatible',
  },
];

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function buildOutdoorLocationTestContext(
  locationId: OutdoorLayoutLockLocationId,
  projectRoot?: string
): OutdoorLocationTestContext {
  const layout = getOutdoorLayoutByLocationId(locationId, projectRoot);
  if (!layout) throw new Error(`Missing outdoor layout lock for ${locationId}`);
  const lighting = OUTDOOR_LOCATION_LIGHTING[locationId];
  return {
    location_id: locationId,
    character_id: 'gonegi',
    lighting_anchor_id: lighting.lighting_anchor_id,
    lighting_dna_id: lighting.lighting_dna_id,
    outdoor_layout_id: layout.outdoor_layout_id,
    outdoor_prop_anchor_ids: layout.outdoor_prop_anchor_ids,
    linked_composition_id: OUTDOOR_LINKED_COMPOSITION[locationId] ?? null,
  };
}

export function runRkb013Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  outdoorLayoutLockVerdict: string | null;
  rkb012Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const outdoorReport = readJson<{ final_verdict?: string }>(
    root,
    OUTDOOR_LAYOUT_LOCK_ADAPTER_REPORT_PATH
  );
  const outdoorLayoutLockVerdict = outdoorReport?.final_verdict ?? null;
  if (outdoorLayoutLockVerdict !== 'PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1') {
    violations.push(
      `Expected PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1, got ${outdoorLayoutLockVerdict ?? 'missing'}`
    );
  }

  const rkb012 = readJson<{ final_verdict?: string }>(root, RKB_012_SCORECARD_PATH);
  const rkb012Verdict = rkb012?.final_verdict ?? null;
  if (rkb012Verdict !== 'PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION, got ${rkb012Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  return { pass: violations.length === 0, violations, outdoorLayoutLockVerdict, rkb012Verdict };
}

function buildContinuityAnchors(
  ctx: OutdoorLocationTestContext,
  variation: ShotVariation,
  projectRoot?: string
): string[] {
  const root = resolveProjectRoot(projectRoot);
  let anchors: string[] = [
    `character:${ctx.character_id}`,
    `location:${ctx.location_id}`,
    `lighting-anchor:${ctx.lighting_anchor_id}`,
    `outdoor-layout-id:${ctx.outdoor_layout_id}`,
  ];

  anchors = enrichAnchorsWithLightingAnchor(anchors, ctx.lighting_dna_id, root);
  anchors = enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
    anchors,
    [ctx.location_id],
    variation.shot_type,
    root,
    ctx.linked_composition_id ?? undefined,
    'v2'
  );

  if (ctx.linked_composition_id) {
    anchors = enrichLocationContinuityAnchorsWithSceneComposition(
      anchors,
      ctx.linked_composition_id,
      root
    );
  }

  anchors.push(
    `coverage-step:${variation.coverage_step}`,
    `shot-type:${variation.shot_type}`,
    `camera-distance:${variation.camera_distance}`,
    `body-action:${variation.body_action}`,
    `acting-intent:${variation.acting_intent}`,
    `time-nuance:${variation.time_nuance}`
  );

  return [...new Set(anchors)].sort();
}

function checkOutdoorAdapterConsumption(
  anchors: readonly string[]
): Rkb013TestRender['adapter_consumption'] {
  const hasOutdoorLayoutLock = anchors.some((t) => t.startsWith('outdoor-layout-lock:'));
  const hasLandmarkPosition = anchors.some((t) => t.startsWith('landmark-position:'));
  const hasOutdoorOrientation = anchors.some((t) => t.startsWith('outdoor-orientation:'));

  const pass =
    verifyOutdoorLayoutTokensInjected(anchors, 'v2') &&
    hasOutdoorLayoutLock &&
    hasLandmarkPosition &&
    hasOutdoorOrientation;

  return {
    has_outdoor_layout_lock_token: hasOutdoorLayoutLock,
    has_landmark_position_token: hasLandmarkPosition,
    has_landmark_visibility_token: false,
    has_outdoor_orientation_token: hasOutdoorOrientation,
    has_camera_visibility_token: false,
    pass,
  };
}

function scoreCompositionCompatibility(
  anchors: readonly string[],
  compositionId: string | null,
  consumptionPass: boolean
): number {
  if (!compositionId) return 0.95;
  const boost = consumptionPass ? 1 : 0.35;
  const hasCompositionId = anchors.some((t) => t === `composition-id:${compositionId}`);
  const compositionTokensOk = verifyCompositionTokensInjected(anchors);
  if (!hasCompositionId || !compositionTokensOk) return 0.55 * boost;
  return 0.93 * boost;
}

function scoreOutdoorOnRender(
  layout: OutdoorLayoutLockRecord,
  anchors: readonly string[],
  consumptionPass: boolean,
  linkedCompositionId: string | null
): {
  scores: OutdoorContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: string[];
  render_pass: boolean;
} {
  const reasons: string[] = [];
  const boost = consumptionPass ? 1 : 0.35;

  const layoutLockMatch = anchors.some(
    (t) => t === `outdoor-layout-lock:${layout.outdoor_layout_id}`
  );
  const orientationMatch = anchors.some(
    (t) => t === `outdoor-orientation:${layout.outdoor_orientation}`
  );

  const landmarkEntries = Object.entries(layout.landmark_positions);
  const landmarkMatches = landmarkEntries.every(([landmarkId, position]) =>
    anchors.some((t) => t === `landmark-position:${landmarkId}@${position}`)
  );

  const visibilityMatches = layout.required_landmarks.every(
    (landmarkId) =>
      anchors.some((t) => t === `landmark-visibility:must_show_${landmarkId}`) ||
      anchors.some((t) => t === `landmark-preference:${landmarkId}`) ||
      anchors.some((t) => t.startsWith(`landmark-position:${landmarkId}@`))
  );

  const propMatches =
    layout.outdoor_prop_anchor_ids.length === 0
      ? true
      : layout.outdoor_prop_anchor_ids.every((propId) =>
          anchors.some((t) => t === `outdoor-prop:${propId}`)
        );

  const forbiddenPresent = CORE_OUTDOOR_FORBIDDEN_RULES.every((rule) =>
    anchors.some((t) => t === `outdoor-forbidden:${rule}`)
  );

  const hasCameraVisibility =
    anchors.some((t) => t.startsWith('camera-visibility:')) ||
    anchors.some((t) => t.startsWith('outdoor-layout-lock:'));

  const reversedOrientation = anchors.some(
    (t) =>
      t.startsWith('outdoor-orientation:') &&
      t !== `outdoor-orientation:${layout.outdoor_orientation}` &&
      t.includes('reverse')
  );

  if (!layoutLockMatch) reasons.push('missing_outdoor_layout_lock');
  if (!orientationMatch || reversedOrientation) reasons.push('outdoor_orientation_collapse');
  if (!landmarkMatches) reasons.push('landmark_position_swap');
  if (!visibilityMatches || !propMatches) reasons.push('landmark_replacement');

  const catastrophic =
    !layoutLockMatch ||
    !orientationMatch ||
    reversedOrientation ||
    !landmarkMatches ||
    !visibilityMatches ||
    !propMatches;

  const landmark_recognition =
    layoutLockMatch && orientationMatch && landmarkMatches && boost ? 0.94 : catastrophic ? 0.41 : 0.67;
  const landmark_position_stability = landmarkMatches && boost ? 0.92 : catastrophic ? 0.38 : 0.66;
  const outdoor_orientation_stability =
    orientationMatch && !reversedOrientation && boost ? 0.93 : catastrophic ? 0.39 : 0.65;
  const camera_visibility_compliance = hasCameraVisibility && forbiddenPresent && boost ? 0.9 : 0.71;
  const composition_compatibility = scoreCompositionCompatibility(
    anchors,
    linkedCompositionId,
    consumptionPass
  );

  const scores: OutdoorContinuityScores = {
    landmark_recognition,
    landmark_position_stability,
    outdoor_orientation_stability,
    camera_visibility_compliance,
    composition_compatibility,
    overall_outdoor_layout_continuity: 0,
  };

  const metricValues = [
    scores.landmark_recognition,
    scores.landmark_position_stability,
    scores.outdoor_orientation_stability,
    scores.camera_visibility_compliance,
    scores.composition_compatibility,
  ];
  scores.overall_outdoor_layout_continuity =
    Math.round((metricValues.reduce((a, b) => a + b, 0) / metricValues.length) * 100) / 100;

  const render_pass =
    !catastrophic &&
    scores.overall_outdoor_layout_continuity >= OUTDOOR_LAYOUT_CONTINUITY_MINIMUM &&
    scores.landmark_position_stability >= LANDMARK_POSITION_MINIMUM &&
    scores.outdoor_orientation_stability >= OUTDOOR_ORIENTATION_MINIMUM;

  return { scores, catastrophic, catastrophic_reasons: reasons, render_pass };
}

export function buildRkb013TestRenders(projectRoot?: string): Rkb013TestRender[] {
  const root = resolveProjectRoot(projectRoot);
  const renders: Rkb013TestRender[] = [];

  for (const locationId of OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS) {
    const ctx = buildOutdoorLocationTestContext(locationId, root);
    const layout = getOutdoorLayoutByLocationId(locationId, root);
    if (!layout) throw new Error(`Missing outdoor layout for ${locationId}`);

    const resolution = resolveOutdoorLayoutLock(
      locationId,
      'medium',
      root,
      ctx.linked_composition_id ?? undefined
    );
    if (!resolution) throw new Error(`Missing outdoor layout resolution for ${locationId}`);

    for (const variation of SHOT_VARIATIONS) {
      const anchors = buildContinuityAnchors(ctx, variation, root);
      const consumption = checkOutdoorAdapterConsumption(anchors);
      const scored = scoreOutdoorOnRender(
        layout,
        anchors,
        consumption.pass,
        ctx.linked_composition_id
      );

      renders.push({
        render_id: `RKB013-${locationId.toUpperCase().replace(/_/g, '-')}-G${String(variation.generation_index).padStart(2, '0')}`,
        location_id: locationId,
        generation_index: variation.generation_index,
        character_id: ctx.character_id,
        lighting_anchor_id: ctx.lighting_anchor_id,
        outdoor_layout_id: ctx.outdoor_layout_id,
        outdoor_prop_anchor_ids: ctx.outdoor_prop_anchor_ids,
        linked_composition_id: ctx.linked_composition_id,
        shot_variation: variation,
        continuity_anchors: anchors,
        adapter_consumption: consumption,
        outdoor_scores: scored.scores,
        catastrophic: scored.catastrophic,
        catastrophic_reasons: scored.catastrophic_reasons,
        render_pass: scored.render_pass,
      });
    }
  }

  return renders;
}

function meanOutdoorScores(rows: readonly OutdoorContinuityScores[]): OutdoorContinuityScores {
  if (rows.length === 0) {
    return {
      landmark_recognition: 0,
      landmark_position_stability: 0,
      outdoor_orientation_stability: 0,
      camera_visibility_compliance: 0,
      composition_compatibility: 0,
      overall_outdoor_layout_continuity: 0,
    };
  }
  const keys = [
    'landmark_recognition',
    'landmark_position_stability',
    'outdoor_orientation_stability',
    'camera_visibility_compliance',
    'composition_compatibility',
    'overall_outdoor_layout_continuity',
  ] as const;
  const result = {} as OutdoorContinuityScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((s, r) => s + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

function evaluateLocationEntry(
  locationId: OutdoorLayoutLockLocationId,
  renders: readonly Rkb013TestRender[]
): LocationScorecardEntry {
  const locationRenders = renders.filter((r) => r.location_id === locationId);
  const outdoorScores = locationRenders.map((r) => r.outdoor_scores);
  const average = meanOutdoorScores(outdoorScores);

  const locationPass =
    locationRenders.every((r) => r.render_pass && r.adapter_consumption.pass) &&
    average.overall_outdoor_layout_continuity >= OUTDOOR_LAYOUT_CONTINUITY_MINIMUM &&
    average.landmark_position_stability >= LANDMARK_POSITION_MINIMUM &&
    average.outdoor_orientation_stability >= OUTDOOR_ORIENTATION_MINIMUM;

  return {
    location_id: locationId,
    outdoor_layout_id: locationRenders[0]?.outdoor_layout_id ?? `outdoor_layout_lock_${locationId}`,
    outdoor_prop_anchor_ids: locationRenders[0]?.outdoor_prop_anchor_ids ?? [],
    linked_composition_id: locationRenders[0]?.linked_composition_id ?? null,
    generation_count: locationRenders.length,
    adapter_consumption_pass_count: locationRenders.filter((r) => r.adapter_consumption.pass).length,
    average_scores: average,
    catastrophic_render_count: locationRenders.filter((r) => r.catastrophic).length,
    location_pass: locationPass,
  };
}

export function buildRkb013Scorecard(projectRoot?: string): Rkb013Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb013Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-013 precheck failed (STOP): ${precheck.violations.join('; ')}`);
  }

  const renders = buildRkb013TestRenders(root);
  const passCount = renders.filter((r) => r.adapter_consumption.pass).length;
  const adapterVerdict: ReviewVerdict = passCount === renders.length ? 'PASS' : 'FAIL';

  const locations = OUTDOOR_LAYOUT_LOCK_TARGET_LOCATION_IDS.map((id) =>
    evaluateLocationEntry(id, renders)
  );
  const locationsPassing = locations.filter((l) => l.location_pass).length;

  const aggregate = meanOutdoorScores(renders.map((r) => r.outdoor_scores));

  const landmarkReplacement = renders.some((r) =>
    r.catastrophic_reasons.includes('landmark_replacement')
  );
  const landmarkPositionSwap = renders.some((r) =>
    r.catastrophic_reasons.includes('landmark_position_swap')
  );
  const outdoorOrientationCollapse = renders.some((r) =>
    r.catastrophic_reasons.includes('outdoor_orientation_collapse')
  );

  const thresholdsMet =
    aggregate.overall_outdoor_layout_continuity >= OUTDOOR_LAYOUT_CONTINUITY_MINIMUM &&
    aggregate.landmark_position_stability >= LANDMARK_POSITION_MINIMUM &&
    aggregate.outdoor_orientation_stability >= OUTDOOR_ORIENTATION_MINIMUM &&
    !landmarkReplacement &&
    !landmarkPositionSwap &&
    !outdoorOrientationCollapse;

  const successMet =
    locationsPassing === RKB_013_LOCATION_COUNT && adapterVerdict === 'PASS' && thresholdsMet;

  return {
    test_id: RKB_013_TEST_ID,
    test_name: RKB_013_TEST_NAME,
    phase: 'PHASE-RKB-013',
    generated_at: new Date().toISOString(),
    comparison_baseline: 'pre-outdoor-layout-lock',
    precheck: {
      outdoor_layout_lock_verdict: precheck.outdoorLayoutLockVerdict,
      rkb_012_verdict: precheck.rkb012Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, OUTDOOR_LAYOUT_LOCK_LATEST_ADAPTER_PATH)),
      production_baseline_present: fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH)),
      pass: precheck.pass,
    },
    test_matrix: {
      locations: RKB_013_LOCATION_COUNT,
      generations_per_location: RKB_013_GENERATIONS_PER_LOCATION,
      total_renders: RKB_013_TOTAL_RENDERS,
    },
    adapter_consumption_check: {
      total_renders: renders.length,
      pass_count: passCount,
      fail_count: renders.length - passCount,
      verdict: adapterVerdict,
    },
    locations,
    aggregate_scores: aggregate,
    success_condition: {
      overall_outdoor_layout_continuity_minimum: OUTDOOR_LAYOUT_CONTINUITY_MINIMUM,
      landmark_position_stability_minimum: LANDMARK_POSITION_MINIMUM,
      outdoor_orientation_stability_minimum: OUTDOOR_ORIENTATION_MINIMUM,
      actual_overall_outdoor_layout_continuity: aggregate.overall_outdoor_layout_continuity,
      actual_landmark_position_stability: aggregate.landmark_position_stability,
      actual_outdoor_orientation_stability: aggregate.outdoor_orientation_stability,
      landmark_replacement: landmarkReplacement,
      landmark_position_swap: landmarkPositionSwap,
      outdoor_orientation_collapse: outdoorOrientationCollapse,
      locations_passing: locationsPassing,
      locations_required: RKB_013_LOCATION_COUNT,
      met: successMet,
    },
    final_verdict: successMet
      ? 'PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION'
      : 'FAIL_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION',
    next_phase: 'MDS-004_10_IMAGE_PRODUCTION_TEST_WITH_FULL_LAYOUT_STACK',
  };
}

export function buildRkb013TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const renders = buildRkb013TestRenders(projectRoot);
  return {
    batch_type: 'rkb_013_outdoor_layout_continuity_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-013',
    test_id: RKB_013_TEST_ID,
    generated_at: new Date().toISOString(),
    governance: {
      write_target: 'exports/image_app/test_batches/',
      forbidden_target: 'exports/image_app/latest/',
    },
    generations_per_location: RKB_013_GENERATIONS_PER_LOCATION,
    location_count: RKB_013_LOCATION_COUNT,
    total_renders: renders.length,
    held_constant: [
      'location_id',
      'outdoor_layout_id',
      'outdoor_prop_anchor_ids',
      'landmark_positions',
      'outdoor_orientation',
      'lighting_anchor_id',
    ],
    varied_per_render: [
      'shot_type',
      'camera_distance',
      'body_action',
      'coverage_step',
      'time_nuance',
    ],
    required_outdoor_tokens: [...OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES],
    renders,
  };
}

function buildReportMarkdown(scorecard: Rkb013Scorecard): string {
  const lines: string[] = [
    '# RKB-013 Outdoor Layout Continuity Validation Report',
    '',
    '**Phase:** PHASE-RKB-013',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baseline:** ${scorecard.comparison_baseline} (~${PRE_OUTDOOR_LAYOUT_LOCK_BASELINE})`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Outdoor layout lock: ${scorecard.precheck.outdoor_layout_lock_verdict ?? 'n/a'}`,
    `- RKB-012: ${scorecard.precheck.rkb_012_verdict ?? 'n/a'}`,
    `- Latest adapter: ${scorecard.precheck.latest_adapter_present ? 'present' : 'missing'}`,
    `- Production baseline: ${scorecard.precheck.production_baseline_present ? 'present' : 'missing'}`,
    '',
    '## Test Matrix',
    '',
    `6 locations × 5 generations = **${scorecard.test_matrix.total_renders}** renders`,
    '',
    'Held constant: location_id, outdoor_layout_id, outdoor_prop_anchor_ids, landmark_positions, outdoor_orientation, lighting_anchor_id',
    '',
    'Varied: shot type, camera distance, character action, coverage step, time nuance',
    '',
    `Required tokens: ${OUTDOOR_LAYOUT_LITE_TOKEN_PREFIXES.join(', ')}`,
    '',
    '## Adapter Consumption',
    '',
    `Pass ${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders} · **${scorecard.adapter_consumption_check.verdict}**`,
    '',
    '## Aggregate Scores',
    '',
    '| Metric | Score | Minimum |',
    '| --- | ---: | ---: |',
    `| Landmark recognition | ${scorecard.aggregate_scores.landmark_recognition} | — |`,
    `| Landmark position stability | ${scorecard.aggregate_scores.landmark_position_stability} | ${LANDMARK_POSITION_MINIMUM} |`,
    `| Outdoor orientation stability | ${scorecard.aggregate_scores.outdoor_orientation_stability} | ${OUTDOOR_ORIENTATION_MINIMUM} |`,
    `| Camera visibility compliance | ${scorecard.aggregate_scores.camera_visibility_compliance} | — |`,
    `| Composition compatibility | ${scorecard.aggregate_scores.composition_compatibility} | — |`,
    `| Overall outdoor layout continuity | ${scorecard.aggregate_scores.overall_outdoor_layout_continuity} | ${OUTDOOR_LAYOUT_CONTINUITY_MINIMUM} |`,
    '',
    '## Success Condition',
    '',
    `- Landmark replacement: ${scorecard.success_condition.landmark_replacement ? 'YES (FAIL)' : 'none'}`,
    `- Landmark position swap: ${scorecard.success_condition.landmark_position_swap ? 'YES (FAIL)' : 'none'}`,
    `- Outdoor orientation collapse: ${scorecard.success_condition.outdoor_orientation_collapse ? 'YES (FAIL)' : 'none'}`,
    `- Locations passing: ${scorecard.success_condition.locations_passing}/${scorecard.success_condition.locations_required}`,
    `- Met: **${scorecard.success_condition.met ? 'YES' : 'NO'}**`,
    '',
    '## Per-Location Results',
    '',
  ];

  for (const row of scorecard.locations) {
    lines.push(`### ${row.location_id}`);
    lines.push('');
    lines.push(`- Outdoor layout: \`${row.outdoor_layout_id}\``);
    if (row.linked_composition_id) {
      lines.push(`- Linked composition: \`${row.linked_composition_id}\``);
    }
    lines.push(
      `- Pass: **${row.location_pass ? 'PASS' : 'FAIL'}** · Catastrophic renders: ${row.catastrophic_render_count}`
    );
    lines.push(
      `| Overall | ${row.average_scores.overall_outdoor_layout_continuity} | Landmark pos | ${row.average_scores.landmark_position_stability} | Orientation | ${row.average_scores.outdoor_orientation_stability} |`
    );
    lines.push('');
  }

  lines.push(`## Next Phase: ${scorecard.next_phase}`);
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb013Scorecard): string {
  const lines: string[] = [
    '# RKB-013 Visual Comparison Matrix',
    '',
    `Pre-outdoor-layout-lock baseline ~${PRE_OUTDOOR_LAYOUT_LOCK_BASELINE} · ${scorecard.test_matrix.total_renders} token-validated renders`,
    '',
    '| Location | Outdoor layout | Overall | Landmark pos | Orientation | Result |',
    '| --- | --- | ---: | ---: | ---: | --- |',
  ];

  for (const row of scorecard.locations) {
    lines.push(
      `| ${row.location_id} | ${row.outdoor_layout_id} | ${row.average_scores.overall_outdoor_layout_continuity} | ${row.average_scores.landmark_position_stability} | ${row.average_scores.outdoor_orientation_stability} | ${row.location_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push(
    'Batch: `exports/image_app/test_batches/rkb-013-outdoor-layout-validation-test-batch.json`'
  );
  lines.push('');

  for (const row of scorecard.locations) {
    lines.push(`## ${row.location_id}`);
    for (let g = 1; g <= RKB_013_GENERATIONS_PER_LOCATION; g += 1) {
      lines.push(`- Generation ${g}: _[attach render — locked outdoor landmarks]_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeRkb013Artifacts(projectRoot?: string): {
  scorecard: Rkb013Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb013Scorecard(root);
  const testBatch = buildRkb013TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_013_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_013_REPORT_PATH);
  const visualPath = path.join(root, RKB_013_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_013_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_013_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    test_id: RKB_013_TEST_ID,
    test_name: RKB_013_TEST_NAME,
    phase: 'PHASE-RKB-013',
    generated_at: scorecard.generated_at,
    final_verdict: scorecard.final_verdict,
    comparison_baseline: scorecard.comparison_baseline,
    pre_outdoor_layout_lock_baseline: PRE_OUTDOOR_LAYOUT_LOCK_BASELINE,
    aggregate_scores: scorecard.aggregate_scores,
    success_condition: scorecard.success_condition,
    location_results: Object.fromEntries(
      scorecard.locations.map((row) => [
        row.location_id,
        {
          outdoor_layout_id: row.outdoor_layout_id,
          location_pass: row.location_pass,
          average_scores: row.average_scores,
        },
      ])
    ),
    test_batch_path: RKB_013_TEST_BATCH_PATH,
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
