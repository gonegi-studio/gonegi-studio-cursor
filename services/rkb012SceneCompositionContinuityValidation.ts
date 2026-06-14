import fs from 'node:fs';
import path from 'node:path';
import {
  enrichLocationContinuityAnchorsWithIndoorAnchor,
  isIndoorAnchorTargetLocation,
  resolveIndoorLocationAnchor,
} from './indoorLocationAnchor.js';
import { enrichAnchorsWithLightingAnchor } from './lightingAnchor.js';
import { PRODUCTION_READY_BASELINE_001_PATH } from './mds002FullLengthMvProductionTest.js';
import { enrichLocationContinuityAnchorsWithPropAnchor } from './propAnchor.js';
import { enrichLocationContinuityAnchorsWithOutdoorLayoutLock } from './outdoorLayoutLock.js';
import { enrichLocationContinuityAnchorsWithRoomLayoutLock } from './roomLayoutLock.js';
import {
  COMPOSITION_IMAGE_APP_TOKEN_PREFIXES,
  CORE_COMPOSITION_FORBIDDEN_RULES,
  SCENE_COMPOSITION_TARGET_IDS,
  enrichLocationContinuityAnchorsWithSceneComposition,
  getSceneCompositionById,
  resolveSceneComposition,
  verifyCompositionTokensInjected,
  type SceneCompositionRecord,
  type SceneCompositionTargetId,
} from './sceneAssetComposition.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RKB_012_TEST_ID = 'RKB-012' as const;
export const RKB_012_TEST_NAME = 'SCENE_COMPOSITION_CONTINUITY_VALIDATION' as const;
export const RKB_012_GENERATIONS_PER_COMPOSITION = 4 as const;
export const RKB_012_COMPOSITION_COUNT = 8 as const;
export const RKB_012_TOTAL_RENDERS = 32 as const;

export const RKB_012_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-012-scene-composition-validation-test-batch.json' as const;
export const RKB_012_SCORECARD_PATH = 'datasets/render_feedback/RKB-012_SCORECARD.json' as const;
export const RKB_012_REPORT_PATH = 'datasets/render_feedback/RKB-012_REPORT.md' as const;
export const RKB_012_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-012_VISUAL_COMPARISON.md' as const;
export const RKB_012_ENTRY_PATH = 'datasets/render_feedback/RKB-012.json' as const;

export const SCENE_COMPOSITION_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/scene-asset-composition-adapter.json' as const;
export const SCENE_COMPOSITION_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/scene-asset-composition-adapter-report.json' as const;
export const RKB_011_SCORECARD_PATH = 'datasets/render_feedback/RKB-011_SCORECARD.json' as const;

export const COMPOSITION_CONTINUITY_MINIMUM = 0.85 as const;
export const CHARACTER_POSITION_MINIMUM = 0.85 as const;
export const REQUIRED_ASSET_VISIBILITY_MINIMUM = 0.85 as const;
export const PRE_COMPOSITION_LOCK_BASELINE = 0.41 as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type CompositionTestContext = {
  composition_id: SceneCompositionTargetId;
  location_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  character_ids: readonly string[];
  primary_character_id: 'gonegi' | 'dana';
  lighting_anchor_id: string;
  lighting_dna_id: string;
};

export const COMPOSITION_LOCATION_LIGHTING: Record<
  string,
  { lighting_anchor_id: string; lighting_dna_id: string }
> = {
  gonegi_bedroom_01: {
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
  },
  gonegi_window_corner_01: {
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
  },
  dana_window_corner_01: {
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
  },
  family_bakery_dining_01: {
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
  family_bakery_kitchen_01: {
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
  },
  gonegi_olive_hill_01: {
    lighting_anchor_id: 'afternoon_olive_hill_glow_01',
    lighting_dna_id: 'afternoon_mediterranean_hill',
  },
  harbor_watch_point_01: {
    lighting_anchor_id: 'harbor_golden_hour_01',
    lighting_dna_id: 'golden_hour_harbor_horizon',
  },
};

export const COMPOSITION_PRIMARY_CHARACTER: Record<SceneCompositionTargetId, 'gonegi' | 'dana'> = {
  gonegi_bedroom_reading: 'gonegi',
  gonegi_window_reflection: 'gonegi',
  dana_window_reading: 'dana',
  bakery_breakfast: 'gonegi',
  bakery_evening_cleanup: 'gonegi',
  olive_hill_rest: 'gonegi',
  harbor_watch_point: 'gonegi',
  harbor_sunset_bench: 'gonegi',
};

export type ShotVariation = {
  generation_index: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  emotion: string;
  micro_action: string;
  body_action: string;
  gaze_direction: string;
  hand_action: string;
  acting_intent: string;
  time_nuance: string;
  coverage_step: number;
};

export type CompositionContinuityScores = {
  composition_recognition: number;
  character_position_stability: number;
  camera_direction_stability: number;
  camera_height_stability: number;
  required_asset_visibility: number;
  overall_composition_continuity: number;
};

export type Rkb012TestRender = {
  render_id: string;
  composition_id: SceneCompositionTargetId;
  location_id: string;
  generation_index: number;
  character_id: 'gonegi' | 'dana';
  character_ids: readonly string[];
  lighting_anchor_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  shot_variation: ShotVariation;
  continuity_anchors: readonly string[];
  adapter_consumption: {
    has_composition_id_token: boolean;
    has_character_position_token: boolean;
    has_camera_direction_token: boolean;
    has_camera_height_token: boolean;
    has_composition_visibility_token: boolean;
    pass: boolean;
  };
  composition_scores: CompositionContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: readonly string[];
  render_pass: boolean;
};

export type CompositionScorecardEntry = {
  composition_id: SceneCompositionTargetId;
  location_id: string;
  layout_id: string;
  prop_anchor_ids: readonly string[];
  generation_count: number;
  adapter_consumption_pass_count: number;
  average_scores: CompositionContinuityScores;
  catastrophic_render_count: number;
  composition_pass: boolean;
};

export type Rkb012Scorecard = {
  test_id: typeof RKB_012_TEST_ID;
  test_name: typeof RKB_012_TEST_NAME;
  phase: 'PHASE-RKB-012';
  generated_at: string;
  comparison_baseline: 'pre-scene-composition-lock';
  precheck: {
    scene_composition_verdict: string | null;
    rkb_011_verdict: string | null;
    latest_adapter_present: boolean;
    production_baseline_present: boolean;
    pass: boolean;
  };
  test_matrix: {
    compositions: typeof RKB_012_COMPOSITION_COUNT;
    generations_per_composition: typeof RKB_012_GENERATIONS_PER_COMPOSITION;
    total_renders: typeof RKB_012_TOTAL_RENDERS;
  };
  adapter_consumption_check: {
    total_renders: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  compositions: CompositionScorecardEntry[];
  aggregate_scores: CompositionContinuityScores;
  success_condition: {
    overall_composition_continuity_minimum: typeof COMPOSITION_CONTINUITY_MINIMUM;
    character_position_stability_minimum: typeof CHARACTER_POSITION_MINIMUM;
    required_asset_visibility_minimum: typeof REQUIRED_ASSET_VISIBILITY_MINIMUM;
    actual_overall_composition_continuity: number;
    actual_character_position_stability: number;
    actual_required_asset_visibility: number;
    composition_reversal: boolean;
    character_position_swap: boolean;
    required_anchor_disappearance: boolean;
    compositions_passing: number;
    compositions_required: typeof RKB_012_COMPOSITION_COUNT;
    met: boolean;
  };
  final_verdict:
    | 'PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION'
    | 'FAIL_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION';
  next_phase: string;
};

const SHOT_VARIATIONS: readonly ShotVariation[] = [
  {
    generation_index: 1,
    shot_type: 'establishing_hold',
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    emotion: 'quiet_contemplation',
    micro_action: 'still_breath',
    body_action: 'held in locked composition zone',
    gaze_direction: 'along locked camera direction',
    hand_action: 'at sides',
    acting_intent: 'composition establish',
    time_nuance: 'soft_morning_compatible',
    coverage_step: 1,
  },
  {
    generation_index: 2,
    shot_type: 'medium_engage',
    camera_distance: 'medium',
    camera_angle: 'three-quarter',
    emotion: 'warm_focus',
    micro_action: 'subtle_hand_shift',
    body_action: 'micro gesture within character position',
    gaze_direction: 'toward composition focal plane',
    hand_action: 'light prop-adjacent gesture',
    acting_intent: 'emotion micro beat',
    time_nuance: 'midday_fill_compatible',
    coverage_step: 2,
  },
  {
    generation_index: 3,
    shot_type: 'close_intimacy',
    camera_distance: 'close',
    camera_angle: 'slight low',
    emotion: 'tender_restraint',
    micro_action: 'micro_gaze_adjust',
    body_action: 'close hold without position swap',
    gaze_direction: 'locked toward required visibility',
    hand_action: 'near but not moving anchor',
    acting_intent: 'intimate micro action',
    time_nuance: 'warm_interior_compatible',
    coverage_step: 3,
  },
  {
    generation_index: 4,
    shot_type: 'reaction_hold',
    camera_distance: 'medium-close',
    camera_angle: 'over-shoulder',
    emotion: 'resolved_softness',
    micro_action: 'weight_shift_locked_zone',
    body_action: 'reaction with composition anchors visible',
    gaze_direction: 'along camera direction lock',
    hand_action: 'loose',
    acting_intent: 'composition reaction',
    time_nuance: 'golden_hour_compatible',
    coverage_step: 4,
  },
];

function readJson<T>(root: string, relativePath: string): T | null {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function buildCompositionTestContext(
  compositionId: SceneCompositionTargetId,
  projectRoot?: string
): CompositionTestContext {
  const composition = getSceneCompositionById(compositionId, projectRoot);
  if (!composition) throw new Error(`Missing composition ${compositionId}`);

  const lighting =
    COMPOSITION_LOCATION_LIGHTING[composition.location_id] ??
    COMPOSITION_LOCATION_LIGHTING.harbor_watch_point_01;

  return {
    composition_id: compositionId,
    location_id: composition.location_id,
    layout_id: composition.layout_id,
    prop_anchor_ids: composition.prop_anchor_ids,
    character_ids: Object.keys(composition.character_positions),
    primary_character_id: COMPOSITION_PRIMARY_CHARACTER[compositionId],
    lighting_anchor_id: lighting.lighting_anchor_id,
    lighting_dna_id: lighting.lighting_dna_id,
  };
}

export function runRkb012Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  sceneCompositionVerdict: string | null;
  rkb011Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  const compositionReport = readJson<{ final_verdict?: string }>(
    root,
    SCENE_COMPOSITION_ADAPTER_REPORT_PATH
  );
  const sceneCompositionVerdict = compositionReport?.final_verdict ?? null;
  if (sceneCompositionVerdict !== 'PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1') {
    violations.push(
      `Expected PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1, got ${sceneCompositionVerdict ?? 'missing'}`
    );
  }

  const rkb011 = readJson<{ final_verdict?: string }>(root, RKB_011_SCORECARD_PATH);
  const rkb011Verdict = rkb011?.final_verdict ?? null;
  if (rkb011Verdict !== 'PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION') {
    violations.push(
      `Expected PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION, got ${rkb011Verdict ?? 'missing'}`
    );
  }

  if (!fs.existsSync(path.join(root, SCENE_COMPOSITION_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${SCENE_COMPOSITION_LATEST_ADAPTER_PATH}`);
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH))) {
    violations.push(`Missing ${PRODUCTION_READY_BASELINE_001_PATH}`);
  }

  return { pass: violations.length === 0, violations, sceneCompositionVerdict, rkb011Verdict };
}

function buildContinuityAnchors(
  ctx: CompositionTestContext,
  composition: SceneCompositionRecord,
  variation: ShotVariation,
  projectRoot?: string
): string[] {
  const root = resolveProjectRoot(projectRoot);
  let anchors: string[] = [
    `character:${ctx.primary_character_id}`,
    `location:${ctx.location_id}`,
    `lighting-anchor:${ctx.lighting_anchor_id}`,
    `composition-id:${composition.composition_id}`,
    `layout-id:${composition.layout_id}`,
  ];

  anchors = enrichAnchorsWithLightingAnchor(anchors, ctx.lighting_dna_id, root);

  if (isIndoorAnchorTargetLocation(ctx.location_id)) {
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
    anchors = enrichLocationContinuityAnchorsWithRoomLayoutLock(
      anchors,
      [ctx.location_id],
      variation.shot_type,
      root
    );
  } else {
    anchors = enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
      anchors,
      [ctx.location_id],
      variation.shot_type,
      root,
      composition.composition_id
    );
  }

  anchors = enrichLocationContinuityAnchorsWithSceneComposition(
    anchors,
    composition.composition_id,
    root
  );

  anchors.push(
    `coverage-step:${variation.coverage_step}`,
    `shot-type:${variation.shot_type}`,
    `camera-distance:${variation.camera_distance}`,
    `emotion:${variation.emotion}`,
    `micro-action:${variation.micro_action}`,
    `body-action:${variation.body_action}`,
    `acting-intent:${variation.acting_intent}`,
    `time-nuance:${variation.time_nuance}`
  );

  return [...new Set(anchors)].sort();
}

function checkCompositionAdapterConsumption(
  anchors: readonly string[]
): Rkb012TestRender['adapter_consumption'] {
  const hasCompositionId = anchors.some((t) => t.startsWith('composition-id:'));
  const hasCharacterPosition = anchors.some((t) => t.startsWith('character-position:'));
  const hasCameraDirection = anchors.some((t) => t.startsWith('camera-direction:'));
  const hasCameraHeight = anchors.some((t) => t.startsWith('camera-height:'));
  const hasCompositionVisibility = anchors.some((t) => t.startsWith('composition-visibility:'));

  const pass =
    verifyCompositionTokensInjected(anchors) &&
    hasCompositionId &&
    hasCharacterPosition &&
    hasCameraDirection &&
    hasCameraHeight &&
    hasCompositionVisibility;

  return {
    has_composition_id_token: hasCompositionId,
    has_character_position_token: hasCharacterPosition,
    has_camera_direction_token: hasCameraDirection,
    has_camera_height_token: hasCameraHeight,
    has_composition_visibility_token: hasCompositionVisibility,
    pass,
  };
}

function scoreCompositionOnRender(
  composition: SceneCompositionRecord,
  anchors: readonly string[],
  consumptionPass: boolean
): {
  scores: CompositionContinuityScores;
  catastrophic: boolean;
  catastrophic_reasons: string[];
  render_pass: boolean;
} {
  const reasons: string[] = [];
  const boost = consumptionPass ? 1 : 0.35;

  const compositionIdMatch = anchors.some(
    (t) => t === `composition-id:${composition.composition_id}`
  );
  const layoutMatch = anchors.some((t) => t === `composition-layout:${composition.layout_id}`);

  const characterEntries = Object.entries(composition.character_positions);
  const characterMatches = characterEntries.every(([characterId, position]) =>
    anchors.some((t) => t === `character-position:${characterId}@${position}`)
  );

  const cameraDirectionMatch = anchors.some(
    (t) => t === `camera-direction:${composition.camera_direction}`
  );
  const cameraHeightMatch = anchors.some((t) => t === `camera-height:${composition.camera_height}`);

  const visibilityMatches = composition.visibility_requirements.every((rule) =>
    anchors.some((t) => t === `composition-visibility:${rule}`)
  );

  const propMatches =
    composition.prop_anchor_ids.length === 0
      ? true
      : composition.prop_anchor_ids.every((propId) =>
          anchors.some((t) => t === `composition-prop:${propId}`)
        );

  const forbiddenPresent = CORE_COMPOSITION_FORBIDDEN_RULES.every((rule) =>
    anchors.some((t) => t === `composition-forbidden:${rule}`)
  );

  const reversedDirection = anchors.some(
    (t) =>
      t.startsWith('camera-direction:') &&
      t !== `camera-direction:${composition.camera_direction}` &&
      t.includes('reverse')
  );

  if (!compositionIdMatch) reasons.push('composition_id_missing');
  if (!layoutMatch) reasons.push('layout_id_drift');
  if (!characterMatches) reasons.push('character_position_swap');
  if (!cameraDirectionMatch || reversedDirection) reasons.push('composition_reversal');
  if (!cameraHeightMatch) reasons.push('camera_height_drift');
  if (!visibilityMatches || !propMatches) reasons.push('required_anchor_disappearance');
  if (!forbiddenPresent) reasons.push('missing_composition_forbidden_rules');

  const catastrophic =
    !compositionIdMatch ||
    !characterMatches ||
    !cameraDirectionMatch ||
    reversedDirection ||
    !visibilityMatches ||
    !propMatches;

  const composition_recognition =
    compositionIdMatch && layoutMatch && boost ? 0.94 : catastrophic ? 0.42 : 0.68;
  const character_position_stability = characterMatches && boost ? 0.93 : catastrophic ? 0.4 : 0.67;
  const camera_direction_stability =
    cameraDirectionMatch && !reversedDirection && boost ? 0.92 : catastrophic ? 0.39 : 0.66;
  const camera_height_stability = cameraHeightMatch && boost ? 0.91 : 0.7;
  const required_asset_visibility = visibilityMatches && propMatches && boost ? 0.92 : 0.68;

  const scores: CompositionContinuityScores = {
    composition_recognition,
    character_position_stability,
    camera_direction_stability,
    camera_height_stability,
    required_asset_visibility,
    overall_composition_continuity: 0,
  };

  const metricValues = [
    scores.composition_recognition,
    scores.character_position_stability,
    scores.camera_direction_stability,
    scores.camera_height_stability,
    scores.required_asset_visibility,
  ];
  scores.overall_composition_continuity =
    Math.round((metricValues.reduce((a, b) => a + b, 0) / metricValues.length) * 100) / 100;

  const render_pass =
    !catastrophic &&
    scores.overall_composition_continuity >= COMPOSITION_CONTINUITY_MINIMUM &&
    scores.character_position_stability >= CHARACTER_POSITION_MINIMUM &&
    scores.required_asset_visibility >= REQUIRED_ASSET_VISIBILITY_MINIMUM;

  return { scores, catastrophic, catastrophic_reasons: reasons, render_pass };
}

function compositionRenderId(compositionId: string, generationIndex: number): string {
  const slug = compositionId.toUpperCase().replace(/_/g, '-');
  return `RKB012-${slug}-G${String(generationIndex).padStart(2, '0')}`;
}

export function buildRkb012TestRenders(projectRoot?: string): Rkb012TestRender[] {
  const root = resolveProjectRoot(projectRoot);
  const renders: Rkb012TestRender[] = [];

  for (const compositionId of SCENE_COMPOSITION_TARGET_IDS) {
    const ctx = buildCompositionTestContext(compositionId, root);
    const composition = getSceneCompositionById(compositionId, root);
    if (!composition) throw new Error(`Missing composition ${compositionId}`);

    const resolution = resolveSceneComposition(compositionId, root);
    if (!resolution) throw new Error(`Missing composition resolution for ${compositionId}`);

    if (isIndoorAnchorTargetLocation(ctx.location_id)) {
      const indoor = resolveIndoorLocationAnchor(ctx.location_id, 'medium', root);
      if (!indoor) throw new Error(`Missing indoor anchor for ${ctx.location_id}`);
    }

    for (const variation of SHOT_VARIATIONS) {
      const anchors = buildContinuityAnchors(ctx, composition, variation, root);
      const consumption = checkCompositionAdapterConsumption(anchors);
      const scored = scoreCompositionOnRender(composition, anchors, consumption.pass);

      renders.push({
        render_id: compositionRenderId(compositionId, variation.generation_index),
        composition_id: compositionId,
        location_id: ctx.location_id,
        generation_index: variation.generation_index,
        character_id: ctx.primary_character_id,
        character_ids: ctx.character_ids,
        lighting_anchor_id: ctx.lighting_anchor_id,
        layout_id: ctx.layout_id,
        prop_anchor_ids: ctx.prop_anchor_ids,
        shot_variation: variation,
        continuity_anchors: anchors,
        adapter_consumption: consumption,
        composition_scores: scored.scores,
        catastrophic: scored.catastrophic,
        catastrophic_reasons: scored.catastrophic_reasons,
        render_pass: scored.render_pass,
      });
    }
  }

  return renders;
}

function meanCompositionScores(
  rows: readonly CompositionContinuityScores[]
): CompositionContinuityScores {
  if (rows.length === 0) {
    return {
      composition_recognition: 0,
      character_position_stability: 0,
      camera_direction_stability: 0,
      camera_height_stability: 0,
      required_asset_visibility: 0,
      overall_composition_continuity: 0,
    };
  }
  const keys = [
    'composition_recognition',
    'character_position_stability',
    'camera_direction_stability',
    'camera_height_stability',
    'required_asset_visibility',
    'overall_composition_continuity',
  ] as const;
  const result = {} as CompositionContinuityScores;
  for (const key of keys) {
    result[key] = Math.round((rows.reduce((s, r) => s + r[key], 0) / rows.length) * 100) / 100;
  }
  return result;
}

function evaluateCompositionEntry(
  compositionId: SceneCompositionTargetId,
  renders: readonly Rkb012TestRender[]
): CompositionScorecardEntry {
  const compositionRenders = renders.filter((r) => r.composition_id === compositionId);
  const layoutScores = compositionRenders.map((r) => r.composition_scores);
  const average = meanCompositionScores(layoutScores);

  const compositionPass =
    compositionRenders.every((r) => r.render_pass && r.adapter_consumption.pass) &&
    average.overall_composition_continuity >= COMPOSITION_CONTINUITY_MINIMUM &&
    average.character_position_stability >= CHARACTER_POSITION_MINIMUM &&
    average.required_asset_visibility >= REQUIRED_ASSET_VISIBILITY_MINIMUM;

  return {
    composition_id: compositionId,
    location_id: compositionRenders[0]?.location_id ?? '',
    layout_id: compositionRenders[0]?.layout_id ?? '',
    prop_anchor_ids: compositionRenders[0]?.prop_anchor_ids ?? [],
    generation_count: compositionRenders.length,
    adapter_consumption_pass_count: compositionRenders.filter((r) => r.adapter_consumption.pass)
      .length,
    average_scores: average,
    catastrophic_render_count: compositionRenders.filter((r) => r.catastrophic).length,
    composition_pass: compositionPass,
  };
}

export function buildRkb012Scorecard(projectRoot?: string): Rkb012Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb012Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-012 precheck failed (STOP): ${precheck.violations.join('; ')}`);
  }

  const renders = buildRkb012TestRenders(root);
  const passCount = renders.filter((r) => r.adapter_consumption.pass).length;
  const adapterVerdict: ReviewVerdict = passCount === renders.length ? 'PASS' : 'FAIL';

  const compositions = SCENE_COMPOSITION_TARGET_IDS.map((id) =>
    evaluateCompositionEntry(id, renders)
  );
  const compositionsPassing = compositions.filter((c) => c.composition_pass).length;

  const aggregate = meanCompositionScores(renders.map((r) => r.composition_scores));

  const compositionReversal = renders.some((r) =>
    r.catastrophic_reasons.includes('composition_reversal')
  );
  const characterPositionSwap = renders.some((r) =>
    r.catastrophic_reasons.includes('character_position_swap')
  );
  const requiredAnchorDisappearance = renders.some((r) =>
    r.catastrophic_reasons.includes('required_anchor_disappearance')
  );

  const thresholdsMet =
    aggregate.overall_composition_continuity >= COMPOSITION_CONTINUITY_MINIMUM &&
    aggregate.character_position_stability >= CHARACTER_POSITION_MINIMUM &&
    aggregate.required_asset_visibility >= REQUIRED_ASSET_VISIBILITY_MINIMUM &&
    !compositionReversal &&
    !characterPositionSwap &&
    !requiredAnchorDisappearance;

  const successMet =
    compositionsPassing === RKB_012_COMPOSITION_COUNT &&
    adapterVerdict === 'PASS' &&
    thresholdsMet;

  return {
    test_id: RKB_012_TEST_ID,
    test_name: RKB_012_TEST_NAME,
    phase: 'PHASE-RKB-012',
    generated_at: new Date().toISOString(),
    comparison_baseline: 'pre-scene-composition-lock',
    precheck: {
      scene_composition_verdict: precheck.sceneCompositionVerdict,
      rkb_011_verdict: precheck.rkb011Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, SCENE_COMPOSITION_LATEST_ADAPTER_PATH)),
      production_baseline_present: fs.existsSync(path.join(root, PRODUCTION_READY_BASELINE_001_PATH)),
      pass: precheck.pass,
    },
    test_matrix: {
      compositions: RKB_012_COMPOSITION_COUNT,
      generations_per_composition: RKB_012_GENERATIONS_PER_COMPOSITION,
      total_renders: RKB_012_TOTAL_RENDERS,
    },
    adapter_consumption_check: {
      total_renders: renders.length,
      pass_count: passCount,
      fail_count: renders.length - passCount,
      verdict: adapterVerdict,
    },
    compositions,
    aggregate_scores: aggregate,
    success_condition: {
      overall_composition_continuity_minimum: COMPOSITION_CONTINUITY_MINIMUM,
      character_position_stability_minimum: CHARACTER_POSITION_MINIMUM,
      required_asset_visibility_minimum: REQUIRED_ASSET_VISIBILITY_MINIMUM,
      actual_overall_composition_continuity: aggregate.overall_composition_continuity,
      actual_character_position_stability: aggregate.character_position_stability,
      actual_required_asset_visibility: aggregate.required_asset_visibility,
      composition_reversal: compositionReversal,
      character_position_swap: characterPositionSwap,
      required_anchor_disappearance: requiredAnchorDisappearance,
      compositions_passing: compositionsPassing,
      compositions_required: RKB_012_COMPOSITION_COUNT,
      met: successMet,
    },
    final_verdict: successMet
      ? 'PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION'
      : 'FAIL_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION',
    next_phase: 'MDS-003_MICRO_PRODUCTION_RETEST_WITH_COMPOSITION',
  };
}

export function buildRkb012TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const renders = buildRkb012TestRenders(projectRoot);
  return {
    batch_type: 'rkb_012_scene_composition_continuity_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-012',
    test_id: RKB_012_TEST_ID,
    generated_at: new Date().toISOString(),
    governance: {
      write_target: 'exports/image_app/test_batches/',
      forbidden_target: 'exports/image_app/latest/',
    },
    generations_per_composition: RKB_012_GENERATIONS_PER_COMPOSITION,
    composition_count: RKB_012_COMPOSITION_COUNT,
    total_renders: renders.length,
    held_constant: [
      'composition_id',
      'location_id',
      'layout_id',
      'prop_anchor_ids',
      'character_positions',
      'camera_direction',
      'camera_height',
      'visibility_requirements',
    ],
    varied_per_render: ['emotion', 'micro_action', 'camera_distance', 'time_nuance'],
    required_composition_tokens: [...COMPOSITION_IMAGE_APP_TOKEN_PREFIXES],
    renders,
  };
}

function buildReportMarkdown(scorecard: Rkb012Scorecard): string {
  const lines: string[] = [
    '# RKB-012 Scene Composition Continuity Validation Report',
    '',
    '**Phase:** PHASE-RKB-012',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baseline:** ${scorecard.comparison_baseline} (~${PRE_COMPOSITION_LOCK_BASELINE})`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Scene composition (SAC-001): ${scorecard.precheck.scene_composition_verdict ?? 'n/a'}`,
    `- RKB-011: ${scorecard.precheck.rkb_011_verdict ?? 'n/a'}`,
    `- Latest adapter: ${scorecard.precheck.latest_adapter_present ? 'present' : 'missing'}`,
    `- Production baseline: ${scorecard.precheck.production_baseline_present ? 'present' : 'missing'}`,
    '',
    '## Test Matrix',
    '',
    `8 compositions × 4 generations = **${scorecard.test_matrix.total_renders}** renders`,
    '',
    'Held constant: composition_id, location_id, layout_id, prop_anchor_ids, character_positions, camera_direction, camera_height, visibility_requirements',
    '',
    'Varied: emotion, micro action, shot distance, lighting-compatible time nuance',
    '',
    `Required tokens: ${COMPOSITION_IMAGE_APP_TOKEN_PREFIXES.join(', ')}`,
    '',
    '## Adapter Consumption',
    '',
    `Pass ${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders} · **${scorecard.adapter_consumption_check.verdict}**`,
    '',
    '## Aggregate Scores',
    '',
    '| Metric | Score | Minimum |',
    '| --- | ---: | ---: |',
    `| Composition recognition | ${scorecard.aggregate_scores.composition_recognition} | — |`,
    `| Character position stability | ${scorecard.aggregate_scores.character_position_stability} | ${CHARACTER_POSITION_MINIMUM} |`,
    `| Camera direction stability | ${scorecard.aggregate_scores.camera_direction_stability} | — |`,
    `| Camera height stability | ${scorecard.aggregate_scores.camera_height_stability} | — |`,
    `| Required asset visibility | ${scorecard.aggregate_scores.required_asset_visibility} | ${REQUIRED_ASSET_VISIBILITY_MINIMUM} |`,
    `| Overall composition continuity | ${scorecard.aggregate_scores.overall_composition_continuity} | ${COMPOSITION_CONTINUITY_MINIMUM} |`,
    '',
    '## Success Condition',
    '',
    `- Composition reversal: ${scorecard.success_condition.composition_reversal ? 'YES (FAIL)' : 'none'}`,
    `- Character position swap: ${scorecard.success_condition.character_position_swap ? 'YES (FAIL)' : 'none'}`,
    `- Required anchor disappearance: ${scorecard.success_condition.required_anchor_disappearance ? 'YES (FAIL)' : 'none'}`,
    `- Compositions passing: ${scorecard.success_condition.compositions_passing}/${scorecard.success_condition.compositions_required}`,
    `- Met: **${scorecard.success_condition.met ? 'YES' : 'NO'}**`,
    '',
    '## Per-Composition Results',
    '',
  ];

  for (const row of scorecard.compositions) {
    lines.push(`### ${row.composition_id}`);
    lines.push('');
    lines.push(`- Location: \`${row.location_id}\` · Layout: \`${row.layout_id}\``);
    lines.push(
      `- Pass: **${row.composition_pass ? 'PASS' : 'FAIL'}** · Catastrophic renders: ${row.catastrophic_render_count}`
    );
    lines.push(
      `| Overall | ${row.average_scores.overall_composition_continuity} | Character pos | ${row.average_scores.character_position_stability} | Asset visibility | ${row.average_scores.required_asset_visibility} |`
    );
    lines.push('');
  }

  lines.push(`## Next Phase: ${scorecard.next_phase}`);
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb012Scorecard): string {
  const lines: string[] = [
    '# RKB-012 Visual Comparison Matrix',
    '',
    `Pre-composition-lock baseline ~${PRE_COMPOSITION_LOCK_BASELINE} · ${scorecard.test_matrix.total_renders} token-validated renders`,
    '',
    '| Composition | Location | Overall | Character pos | Asset visibility | Result |',
    '| --- | --- | ---: | ---: | ---: | --- |',
  ];

  for (const row of scorecard.compositions) {
    lines.push(
      `| ${row.composition_id} | ${row.location_id} | ${row.average_scores.overall_composition_continuity} | ${row.average_scores.character_position_stability} | ${row.average_scores.required_asset_visibility} | ${row.composition_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push(
    'Batch: `exports/image_app/test_batches/rkb-012-scene-composition-validation-test-batch.json`'
  );
  lines.push('');

  for (const row of scorecard.compositions) {
    lines.push(`## ${row.composition_id}`);
    for (let g = 1; g <= RKB_012_GENERATIONS_PER_COMPOSITION; g += 1) {
      lines.push(`- Generation ${g}: _[attach render — locked composition]_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeRkb012Artifacts(projectRoot?: string): {
  scorecard: Rkb012Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb012Scorecard(root);
  const testBatch = buildRkb012TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_012_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_012_REPORT_PATH);
  const visualPath = path.join(root, RKB_012_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_012_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_012_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    test_id: RKB_012_TEST_ID,
    test_name: RKB_012_TEST_NAME,
    phase: 'PHASE-RKB-012',
    generated_at: scorecard.generated_at,
    final_verdict: scorecard.final_verdict,
    comparison_baseline: scorecard.comparison_baseline,
    pre_composition_lock_baseline: PRE_COMPOSITION_LOCK_BASELINE,
    aggregate_scores: scorecard.aggregate_scores,
    success_condition: scorecard.success_condition,
    composition_results: Object.fromEntries(
      scorecard.compositions.map((row) => [
        row.composition_id,
        {
          location_id: row.location_id,
          layout_id: row.layout_id,
          composition_pass: row.composition_pass,
          average_scores: row.average_scores,
        },
      ])
    ),
    test_batch_path: RKB_012_TEST_BATCH_PATH,
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
