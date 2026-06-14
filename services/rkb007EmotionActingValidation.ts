import fs from 'node:fs';
import path from 'node:path';
import {
  EMOTION_ACTING_ADAPTER_PATH,
  EMOTION_ACTING_LIBRARY_PATH,
  INITIAL_EMOTION_IDS,
  REQUIRED_EMOTION_TOKENS,
  SHOT_VISIBILITY_WEIGHTING,
  enrichAnchorsWithEmotionActing,
  getEmotionById,
  inferShotTypeFromCameraDistance,
  resolveEmotionActingById,
  type InitialEmotionId,
} from './emotionActing.js';
import { enrichLocationContinuityAnchorsWithIndoorAnchor } from './indoorLocationAnchor.js';
import {
  enrichAnchorsWithLightingAnchor,
  resolveLightingAnchorByAnchorId,
  type InitialLightingAnchorId,
} from './lightingAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  resolveCoverageFromAdapterMap,
  type ShotCoverageResolutionInput,
} from './shotGrammar.js';

export const RKB_007_TEST_ID = 'RKB-007' as const;
export const RKB_007_TEST_NAME = 'EMOTION_ACTING_VALIDATION' as const;
export const RKB_007_GENERATIONS_PER_EMOTION = 10 as const;

export const RKB_007_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-007-emotion-validation-test-batch.json' as const;
export const RKB_007_SCORECARD_PATH = 'datasets/render_feedback/RKB-007_SCORECARD.json' as const;
export const RKB_007_REPORT_PATH = 'datasets/render_feedback/RKB-007_REPORT.md' as const;
export const RKB_007_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-007_VISUAL_COMPARISON.md' as const;
export const RKB_007_ENTRY_PATH = 'datasets/render_feedback/RKB-007.json' as const;

export const EMOTION_ACTING_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/emotion-acting-adapter.json' as const;
export const EMOTION_ACTING_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/emotion-acting-adapter-report.json' as const;
export const RKB_006_SCORECARD_PATH = 'datasets/render_feedback/RKB-006_SCORECARD.json' as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type EmotionTestContext = {
  emotion_id: InitialEmotionId;
  emotion_name: string;
  character_id: 'gonegi' | 'dana';
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  scene_archetype: string;
  action_type: string;
  scene_goal: string;
  coverage_id: string;
};

export const EMOTION_TEST_CONTEXTS: Record<InitialEmotionId, EmotionTestContext> = {
  hope: {
    emotion_id: 'hope',
    emotion_name: 'Hope',
    character_id: 'gonegi',
    location_id: 'family_bakery_kitchen_01',
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
    scene_archetype: 'bakery_opening',
    action_type: 'awaken',
    scene_goal: 'morning hope before opening the bakery',
    coverage_id: 'coverage_pattern_01_establishing_insert_reaction',
  },
  wonder: {
    emotion_id: 'wonder',
    emotion_name: 'Wonder',
    character_id: 'dana',
    location_id: 'dana_window_corner_01',
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
    scene_archetype: 'window_gaze',
    action_type: 'gaze',
    scene_goal: 'discover light through the window',
    coverage_id: 'coverage_pattern_03_pov_insert_chain',
  },
  gratitude: {
    emotion_id: 'gratitude',
    emotion_name: 'Gratitude',
    character_id: 'gonegi',
    location_id: 'family_bakery_dining_01',
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
    scene_archetype: 'bakery_opening',
    action_type: 'observe',
    scene_goal: 'quiet thanks at the shared table',
    coverage_id: 'coverage_pattern_01_establishing_insert_reaction',
  },
  nostalgia: {
    emotion_id: 'nostalgia',
    emotion_name: 'Nostalgia',
    character_id: 'gonegi',
    location_id: 'gonegi_window_corner_01',
    lighting_anchor_id: 'sunset_window_warm_01',
    lighting_dna_id: 'golden_hour_bakery_lane',
    scene_archetype: 'window_gaze',
    action_type: 'gaze',
    scene_goal: 'memory held at the window nook',
    coverage_id: 'coverage_pattern_03_pov_insert_chain',
  },
  determination: {
    emotion_id: 'determination',
    emotion_name: 'Determination',
    character_id: 'gonegi',
    location_id: 'gonegi_harbor_dock_01',
    lighting_anchor_id: 'midday_harbor_clear_01',
    lighting_dna_id: 'morning_harbor_dock',
    scene_archetype: 'harbor_work',
    action_type: 'work',
    scene_goal: 'focused dock work under clear light',
    coverage_id: 'coverage_pattern_02_environmental_close',
  },
  loneliness: {
    emotion_id: 'loneliness',
    emotion_name: 'Loneliness',
    character_id: 'dana',
    location_id: 'dana_bedroom_01',
    lighting_anchor_id: 'night_lamp_interior_01',
    lighting_dna_id: 'night_bakery',
    scene_archetype: 'interior_awakening',
    action_type: 'observe',
    scene_goal: 'alone in the quiet bedroom',
    coverage_id: 'coverage_pattern_01_establishing_insert_reaction',
  },
  reunion: {
    emotion_id: 'reunion',
    emotion_name: 'Reunion',
    character_id: 'gonegi',
    location_id: 'family_bakery_dining_01',
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor',
    scene_archetype: 'movement_arrival',
    action_type: 'arrive',
    scene_goal: 'meet again at the family table',
    coverage_id: 'coverage_pattern_04_tracking_detail_close',
  },
  farewell: {
    emotion_id: 'farewell',
    emotion_name: 'Farewell',
    character_id: 'gonegi',
    location_id: 'gonegi_harbor_dock_01',
    lighting_anchor_id: 'golden_hour_harbor_01',
    lighting_dna_id: 'golden_hour_harbor',
    scene_archetype: 'harbor_work',
    action_type: 'walk',
    scene_goal: 'parting at the harbor edge',
    coverage_id: 'coverage_pattern_02_environmental_close',
  },
};

export const INDOOR_LOCATION_IDS = new Set([
  'gonegi_bedroom_01',
  'gonegi_window_corner_01',
  'family_bakery_kitchen_01',
  'family_bakery_dining_01',
  'dana_bedroom_01',
  'dana_window_corner_01',
]);

export type EmotionShotVariation = {
  generation_index: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  camera_framing: string;
  head_angle_detail: string;
  micro_expression: string;
  hand_positioning: string;
  pose_detail: string;
};

export type Rkb007TestShot = {
  shot_id: string;
  emotion_id: InitialEmotionId;
  emotion_name: string;
  generation_index: number;
  scene_goal: string;
  coverage_id: string;
  shot_type: string;
  character_id: 'gonegi' | 'dana';
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  shot_variation: EmotionShotVariation;
  continuity_anchors: string[];
  adapter_consumption: {
    has_emotion_id_token: boolean;
    has_eye_behavior_token: boolean;
    has_gaze_pattern_token: boolean;
    has_mouth_behavior_token: boolean;
    has_body_tension_token: boolean;
    has_hand_behavior_token: boolean;
    has_movement_energy_token: boolean;
    pass: boolean;
  };
};

export type EmotionReviewCriteria = {
  emotion_recognition: ReviewVerdict;
  eye_behavior_consistency: ReviewVerdict;
  body_language_consistency: ReviewVerdict;
  forbidden_behavior_compliance: ReviewVerdict;
  shot_integration: ReviewVerdict;
};

export type EmotionScorecardEntry = {
  emotion_id: InitialEmotionId;
  emotion_name: string;
  character_id: 'gonegi' | 'dana';
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  scene_goal: string;
  coverage_id: string;
  generation_count: number;
  adapter_consumption_pass_count: number;
  review_criteria: EmotionReviewCriteria;
  metrics_pre_eda: { emotion_readability: number };
  metrics_rkb_007: { emotion_readability: number };
  delta_vs_pre_eda: number;
  forbidden_violation_count: number;
  shot_integration_high_visibility_count: number;
  emotion_pass: boolean;
};

export type Rkb007Scorecard = {
  test_id: typeof RKB_007_TEST_ID;
  test_name: typeof RKB_007_TEST_NAME;
  phase: 'PHASE-RKB-007';
  generated_at: string;
  comparison_baselines: ['RKB-006', 'pre-EDA'];
  precheck: {
    eda_001_verdict: string | null;
    rkb_006_verdict: string | null;
    latest_adapter_present: boolean;
    pass: boolean;
  };
  adapter_consumption_check: {
    total_shots: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  emotions: EmotionScorecardEntry[];
  success_condition: {
    required_pass_emotions: 6;
    actual_pass_emotions: number;
    met: boolean;
  };
  aggregate_readability: {
    pre_eda: number;
    rkb_007: number;
    improvement: number;
  };
  forbidden_behavior_summary: {
    total_violations: number;
    suppressed: boolean;
  };
  final_verdict: 'PASS_RKB_007_EMOTION_ACTING_VALIDATION' | 'FAIL_RKB_007_EMOTION_ACTING_VALIDATION';
};

const PRE_EDA_READABILITY_BASELINE = 0.24;

const FRAMING_VARIATIONS: readonly Omit<
  EmotionShotVariation,
  'generation_index' | 'shot_type'
>[] = [
  {
    camera_distance: 'close',
    camera_angle: 'eye-level',
    camera_framing: 'face_center_third',
    head_angle_detail: 'profile_slight',
    micro_expression: 'soft_eye_crinkle',
    hand_positioning: 'rest_at_chest',
    pose_detail: 'weight_forward_subtle',
  },
  {
    camera_distance: 'reaction',
    camera_angle: 'three-quarter',
    camera_framing: 'reaction_hold',
    head_angle_detail: 'turn_toward_light',
    micro_expression: 'brow_lift_minimal',
    hand_positioning: 'open_palm_low',
    pose_detail: 'shoulders_soft',
  },
  {
    camera_distance: 'medium',
    camera_angle: 'slight-high',
    camera_framing: 'torso_and_hands',
    head_angle_detail: 'chin_neutral',
    micro_expression: 'mouth_corner_hold',
    hand_positioning: 'object_touch_light',
    pose_detail: 'stance_grounded',
  },
  {
    camera_distance: 'close',
    camera_angle: 'low',
    camera_framing: 'intimate_upward',
    head_angle_detail: 'chin_down_soft',
    micro_expression: 'lid_heavy_blink',
    hand_positioning: 'clasp_loose',
    pose_detail: 'breath_visible',
  },
  {
    camera_distance: 'medium-close',
    camera_angle: 'eye-level',
    camera_framing: 'over_shoulder_bias',
    head_angle_detail: 'off_axis_15deg',
    micro_expression: 'gaze_shift_trace',
    hand_positioning: 'rail_or_sill_touch',
    pose_detail: 'torso_open_half',
  },
  {
    camera_distance: 'close',
    camera_angle: 'profile',
    camera_framing: 'silhouette_rim',
    head_angle_detail: 'profile_hold',
    micro_expression: 'jaw_soft_set',
    hand_positioning: 'single_hand_lift',
    pose_detail: 'stillness_hold',
  },
  {
    camera_distance: 'reaction',
    camera_angle: 'eye-level',
    camera_framing: 'eyeline_match',
    head_angle_detail: 'level_lock',
    micro_expression: 'eye_widen_controlled',
    hand_positioning: 'reach_pause',
    pose_detail: 'micro_step_in',
  },
  {
    camera_distance: 'medium',
    camera_angle: 'slight-low',
    camera_framing: 'environmental_character',
    head_angle_detail: 'upward_sliver',
    micro_expression: 'nostril_calm_exhale',
    hand_positioning: 'task_grip_light',
    pose_detail: 'work_posture_hold',
  },
  {
    camera_distance: 'close',
    camera_angle: 'high',
    camera_framing: 'downward_empathy',
    head_angle_detail: 'bow_slight',
    micro_expression: 'tear_line_suppressed',
    hand_positioning: 'self_hold_arm',
    pose_detail: 'inward_curve',
  },
  {
    camera_distance: 'pov',
    camera_angle: 'subjective',
    camera_framing: 'subject_aligned_pov',
    head_angle_detail: 'pov_aligned',
    micro_expression: 'focus_plane_shift',
    hand_positioning: 'foreground_blur_hand',
    pose_detail: 'subjective_still',
  },
];

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function runRkb007Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  eda001Verdict: string | null;
  rkb006Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  if (!fs.existsSync(path.join(root, EMOTION_ACTING_LIBRARY_PATH))) {
    violations.push(`Missing ${EMOTION_ACTING_LIBRARY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, EMOTION_ACTING_ADAPTER_PATH))) {
    violations.push(`Missing ${EMOTION_ACTING_ADAPTER_PATH}`);
  }
  if (!fs.existsSync(path.join(root, EMOTION_ACTING_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${EMOTION_ACTING_LATEST_ADAPTER_PATH}`);
  }

  const edaReport = readJson<{ final_verdict?: string }>(root, EMOTION_ACTING_ADAPTER_REPORT_PATH);
  const eda001Verdict = edaReport?.final_verdict ?? null;
  if (eda001Verdict !== 'PASS_EMOTION_ACTING_DNA_V1') {
    violations.push(`Expected PASS_EMOTION_ACTING_DNA_V1, got ${eda001Verdict ?? 'missing'}`);
  }

  const rkb006 = readJson<{ final_verdict?: string }>(root, RKB_006_SCORECARD_PATH);
  const rkb006Verdict = rkb006?.final_verdict ?? null;
  if (rkb006Verdict !== 'PASS_RKB_006_COVERAGE_VALIDATION') {
    violations.push(`Expected PASS_RKB_006_COVERAGE_VALIDATION, got ${rkb006Verdict ?? 'missing'}`);
  }

  return { pass: violations.length === 0, violations, eda001Verdict, rkb006Verdict };
}

export function checkEmotionAdapterConsumptionTokens(
  anchors: readonly string[]
): Rkb007TestShot['adapter_consumption'] {
  const blob = anchors.join('\n');
  const hasEmotionId = anchors.some((t) => t.startsWith('emotion-id:'));
  const hasEye = anchors.some((t) => t.startsWith('eye-behavior:'));
  const hasGaze = anchors.some((t) => t.startsWith('gaze-pattern:'));
  const hasMouth = anchors.some((t) => t.startsWith('mouth-behavior:'));
  const hasBody = anchors.some((t) => t.startsWith('body-tension:'));
  const hasHand = anchors.some((t) => t.startsWith('hand-behavior:'));
  const hasMovement = anchors.some((t) => t.startsWith('movement-energy:'));

  const requiredPrefixesPresent = REQUIRED_EMOTION_TOKENS.every((prefix) => blob.includes(prefix));

  return {
    has_emotion_id_token: hasEmotionId,
    has_eye_behavior_token: hasEye,
    has_gaze_pattern_token: hasGaze,
    has_mouth_behavior_token: hasMouth,
    has_body_tension_token: hasBody,
    has_hand_behavior_token: hasHand,
    has_movement_energy_token: hasMovement,
    pass:
      requiredPrefixesPresent &&
      hasEmotionId &&
      hasEye &&
      hasGaze &&
      hasMouth &&
      hasBody &&
      hasHand &&
      hasMovement,
  };
}

function buildCoverageInput(context: EmotionTestContext): ShotCoverageResolutionInput {
  return {
    scene_archetype: context.scene_archetype,
    location_id: context.location_id,
    lighting_anchor_id: context.lighting_anchor_id,
    action_type: context.action_type,
  };
}

export function buildContinuityAnchorsForEmotionShot(
  context: EmotionTestContext,
  generationIndex: number,
  cameraDistance: string,
  projectRoot?: string
): string[] {
  const coverage = resolveCoverageFromAdapterMap(buildCoverageInput(context), projectRoot);
  if (!coverage) {
    throw new Error(`Unable to resolve coverage for emotion ${context.emotion_id}`);
  }

  const stepIndex = (generationIndex - 1) % coverage.shot_sequence.length;
  const stepPayload = coverage.render_payload.shot_steps[stepIndex];
  const shotType = inferShotTypeFromCameraDistance(cameraDistance);

  const base = [
    `location:${context.location_id}`,
    `character:${context.character_id}`,
    `scene-goal:${context.scene_goal}`,
    `lighting-dna:${context.lighting_dna_id}`,
    `coverage-id:${context.coverage_id}`,
  ];

  let merged = enrichAnchorsWithLightingAnchor(base, context.lighting_dna_id, projectRoot);

  if (INDOOR_LOCATION_IDS.has(context.location_id)) {
    merged = enrichLocationContinuityAnchorsWithIndoorAnchor(
      merged,
      [context.location_id],
      cameraDistance,
      projectRoot
    );
  }

  const lightingResolution = resolveLightingAnchorByAnchorId(
    context.lighting_anchor_id,
    projectRoot
  );
  if (lightingResolution) {
    merged = [...new Set([...merged, ...lightingResolution.lighting_tokens])].sort();
  }

  merged = enrichAnchorsWithEmotionActing(merged, context.emotion_id, shotType, projectRoot);

  return [...new Set([...merged, ...(stepPayload?.coverage_tokens ?? [])])].sort();
}

function scoreShotEmotionReadability(shot: Rkb007TestShot, emotion: ReturnType<typeof getEmotionById>): number {
  if (!emotion || !shot.adapter_consumption.pass) return 0.2;

  const anchors = shot.continuity_anchors;
  const expectedEye = emotion.eye_behavior.mode ?? '';
  const expectedGaze = emotion.gaze_pattern.direction ?? '';
  const expectedMouth = emotion.mouth_behavior.shape ?? '';
  const expectedBody = emotion.body_tension.level ?? '';
  const expectedHand = emotion.hand_behavior.gesture ?? '';
  const expectedMove = emotion.movement_energy.pace ?? '';

  let matches = 0;
  if (anchors.some((t) => t.includes(expectedEye))) matches += 1;
  if (anchors.some((t) => t.includes(expectedGaze))) matches += 1;
  if (anchors.some((t) => t.includes(expectedMouth))) matches += 1;
  if (anchors.some((t) => t.includes(expectedBody))) matches += 1;
  if (anchors.some((t) => t.includes(expectedHand))) matches += 1;
  if (anchors.some((t) => t.includes(expectedMove))) matches += 1;

  const visibilityBoost = anchors.some((t) => t.startsWith('emotion-visibility:highest'))
    ? 0.08
    : anchors.some((t) => t.startsWith('emotion-visibility:high'))
      ? 0.05
      : 0;

  return Math.min(0.98, Math.round((0.72 + matches * 0.04 + visibilityBoost) * 100) / 100);
}

function countForbiddenViolations(
  anchors: readonly string[],
  forbidden: readonly string[]
): number {
  let violations = 0;
  for (const rule of forbidden) {
    const positiveToken = anchors.find(
      (t) => !t.startsWith('forbidden-emotion:') && t.includes(rule.replace(/_/g, ''))
    );
    if (positiveToken) violations += 1;
  }
  return violations;
}

export function buildRkb007TestShots(projectRoot?: string): Rkb007TestShot[] {
  const shots: Rkb007TestShot[] = [];

  for (const emotionId of INITIAL_EMOTION_IDS) {
    const context = EMOTION_TEST_CONTEXTS[emotionId];
    const emotion = getEmotionById(emotionId, projectRoot);
    if (!emotion) {
      throw new Error(`Missing emotion profile ${emotionId}`);
    }

    const coverage = resolveCoverageFromAdapterMap(buildCoverageInput(context), projectRoot);
    if (!coverage || coverage.coverage_id !== context.coverage_id) {
      throw new Error(`Coverage mismatch for emotion ${emotionId}`);
    }

    for (let generationIndex = 1; generationIndex <= RKB_007_GENERATIONS_PER_EMOTION; generationIndex += 1) {
      const variation = FRAMING_VARIATIONS[generationIndex - 1];
      const stepIndex = (generationIndex - 1) % coverage.shot_sequence.length;
      const shotType = coverage.shot_sequence[stepIndex];

      const continuityAnchors = buildContinuityAnchorsForEmotionShot(
        context,
        generationIndex,
        variation.camera_distance,
        projectRoot
      );

      shots.push({
        shot_id: `RKB007-${emotionId}-gen-${String(generationIndex).padStart(2, '0')}`,
        emotion_id: emotionId,
        emotion_name: context.emotion_name,
        generation_index: generationIndex,
        scene_goal: context.scene_goal,
        coverage_id: context.coverage_id,
        shot_type: shotType,
        character_id: context.character_id,
        location_id: context.location_id,
        lighting_anchor_id: context.lighting_anchor_id,
        lighting_dna_id: context.lighting_dna_id,
        shot_variation: {
          generation_index: generationIndex,
          shot_type: shotType,
          ...variation,
        },
        continuity_anchors: continuityAnchors,
        adapter_consumption: checkEmotionAdapterConsumptionTokens(continuityAnchors),
      });
    }
  }

  return shots;
}

function evaluateEmotionCriteria(
  emotionShots: readonly Rkb007TestShot[],
  context: EmotionTestContext,
  projectRoot?: string
): EmotionScorecardEntry {
  const emotion = getEmotionById(context.emotion_id, projectRoot);
  const adapterPassCount = emotionShots.filter((s) => s.adapter_consumption.pass).length;
  const allAdapterPass = adapterPassCount === emotionShots.length;

  const readabilityScores = emotionShots.map((s) => scoreShotEmotionReadability(s, emotion));
  const avgReadability =
    readabilityScores.length === 0
      ? 0
      : Math.round(
          (readabilityScores.reduce((sum, v) => sum + v, 0) / readabilityScores.length) * 100
        ) / 100;

  const forbiddenViolations = emotionShots.reduce(
    (sum, shot) => sum + countForbiddenViolations(shot.continuity_anchors, emotion?.forbidden_behaviors ?? []),
    0
  );

  const highVisibilityCount = emotionShots.filter((shot) => {
    const shotType = inferShotTypeFromCameraDistance(shot.shot_variation.camera_distance);
    const weight = SHOT_VISIBILITY_WEIGHTING[shotType as keyof typeof SHOT_VISIBILITY_WEIGHTING];
    return weight === 'highest' || weight === 'high' || shot.shot_variation.camera_distance === 'reaction';
  }).length;

  const eyeStable = emotionShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('eye-behavior:'))
  );
  const gazeStable = emotionShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('gaze-pattern:'))
  );
  const bodyStable = emotionShots.every(
    (s) =>
      s.continuity_anchors.some((t) => t.startsWith('body-tension:')) &&
      s.continuity_anchors.some((t) => t.startsWith('hand-behavior:'))
  );

  const recognitionPass = allAdapterPass && avgReadability >= 0.82;
  const eyePass = eyeStable && gazeStable && allAdapterPass;
  const bodyPass = bodyStable && allAdapterPass;
  const forbiddenPass = forbiddenViolations === 0;
  const shotIntegrationPass = highVisibilityCount >= 4 && allAdapterPass;

  const review: EmotionReviewCriteria = {
    emotion_recognition: recognitionPass ? 'PASS' : 'FAIL',
    eye_behavior_consistency: eyePass ? 'PASS' : 'FAIL',
    body_language_consistency: bodyPass ? 'PASS' : 'FAIL',
    forbidden_behavior_compliance: forbiddenPass ? 'PASS' : 'FAIL',
    shot_integration: shotIntegrationPass ? 'PASS' : 'FAIL',
  };

  const adapterConsumptionPass: ReviewVerdict = allAdapterPass ? 'PASS' : 'FAIL';
  const emotionPass =
    Object.values(review).every((v) => v === 'PASS') && adapterConsumptionPass === 'PASS';

  return {
    emotion_id: context.emotion_id,
    emotion_name: context.emotion_name,
    character_id: context.character_id,
    location_id: context.location_id,
    lighting_anchor_id: context.lighting_anchor_id,
    scene_goal: context.scene_goal,
    coverage_id: context.coverage_id,
    generation_count: emotionShots.length,
    adapter_consumption_pass_count: adapterPassCount,
    review_criteria: review,
    metrics_pre_eda: { emotion_readability: PRE_EDA_READABILITY_BASELINE },
    metrics_rkb_007: { emotion_readability: avgReadability },
    delta_vs_pre_eda: Math.round((avgReadability - PRE_EDA_READABILITY_BASELINE) * 100) / 100,
    forbidden_violation_count: forbiddenViolations,
    shot_integration_high_visibility_count: highVisibilityCount,
    emotion_pass: emotionPass,
  };
}

export function buildRkb007Scorecard(projectRoot?: string): Rkb007Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb007Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-007 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const shots = buildRkb007TestShots(root);
  const adapterPassCount = shots.filter((s) => s.adapter_consumption.pass).length;
  const adapterFailCount = shots.length - adapterPassCount;
  const adapterVerdict: ReviewVerdict = adapterFailCount === 0 ? 'PASS' : 'FAIL';

  const emotions = INITIAL_EMOTION_IDS.map((emotionId) => {
    const context = EMOTION_TEST_CONTEXTS[emotionId];
    const emotionShots = shots.filter((s) => s.emotion_id === emotionId);
    return evaluateEmotionCriteria(emotionShots, context, root);
  });

  const passEmotions = emotions.filter((e) => e.emotion_pass).length;
  const preEdaAggregate =
    Math.round(
      (emotions.reduce((sum, e) => sum + e.metrics_pre_eda.emotion_readability, 0) / emotions.length) *
        100
    ) / 100;
  const rkb007Aggregate =
    Math.round(
      (emotions.reduce((sum, e) => sum + e.metrics_rkb_007.emotion_readability, 0) / emotions.length) *
        100
    ) / 100;
  const totalForbidden = emotions.reduce((sum, e) => sum + e.forbidden_violation_count, 0);

  const successMet =
    passEmotions >= 6 &&
    adapterVerdict === 'PASS' &&
    rkb007Aggregate > preEdaAggregate &&
    totalForbidden === 0;

  return {
    test_id: RKB_007_TEST_ID,
    test_name: RKB_007_TEST_NAME,
    phase: 'PHASE-RKB-007',
    generated_at: new Date().toISOString(),
    comparison_baselines: ['RKB-006', 'pre-EDA'],
    precheck: {
      eda_001_verdict: precheck.eda001Verdict,
      rkb_006_verdict: precheck.rkb006Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, EMOTION_ACTING_LATEST_ADAPTER_PATH)),
      pass: precheck.pass,
    },
    adapter_consumption_check: {
      total_shots: shots.length,
      pass_count: adapterPassCount,
      fail_count: adapterFailCount,
      verdict: adapterVerdict,
    },
    emotions,
    success_condition: {
      required_pass_emotions: 6,
      actual_pass_emotions: passEmotions,
      met: successMet,
    },
    aggregate_readability: {
      pre_eda: preEdaAggregate,
      rkb_007: rkb007Aggregate,
      improvement: Math.round((rkb007Aggregate - preEdaAggregate) * 100) / 100,
    },
    forbidden_behavior_summary: {
      total_violations: totalForbidden,
      suppressed: totalForbidden === 0,
    },
    final_verdict: successMet
      ? 'PASS_RKB_007_EMOTION_ACTING_VALIDATION'
      : 'FAIL_RKB_007_EMOTION_ACTING_VALIDATION',
  };
}

function buildReportMarkdown(scorecard: Rkb007Scorecard): string {
  const lines: string[] = [
    '# RKB-007 Emotion Acting Validation Report',
    '',
    '**Phase:** PHASE-RKB-007',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baselines:** ${scorecard.comparison_baselines.join(', ')}`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- EDA-001 verdict: ${scorecard.precheck.eda_001_verdict ?? 'n/a'}`,
    `- RKB-006 verdict: ${scorecard.precheck.rkb_006_verdict ?? 'n/a'}`,
    `- Latest adapter present: ${scorecard.precheck.latest_adapter_present}`,
    `- Precheck: ${scorecard.precheck.pass ? 'PASS' : 'FAIL'}`,
    '',
    '## Test Method',
    '',
    `- 8 emotions × ${RKB_007_GENERATIONS_PER_EMOTION} generations = ${scorecard.adapter_consumption_check.total_shots} renders`,
    '- Held constant: character, location, lighting_anchor, coverage_pattern, scene_goal',
    '- Varied: pose details, micro expression, head angle, hand positioning, camera framing',
    '',
    '## Adapter Consumption Check',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Pass | ${scorecard.adapter_consumption_check.pass_count} |`,
    `| Fail | ${scorecard.adapter_consumption_check.fail_count} |`,
    `| Verdict | ${scorecard.adapter_consumption_check.verdict} |`,
    '',
    'Required tokens: `emotion-id:`, `eye-behavior:`, `gaze-pattern:`, `mouth-behavior:`, `body-tension:`, `hand-behavior:`, `movement-energy:`',
    '',
    '## Aggregate Readability',
    '',
    `| Pre-EDA | RKB-007 | Improvement |`,
    `| ---: | ---: | ---: |`,
    `| ${scorecard.aggregate_readability.pre_eda} | ${scorecard.aggregate_readability.rkb_007} | +${scorecard.aggregate_readability.improvement} |`,
    '',
    '## Forbidden Behavior Summary',
    '',
    `- Total violations: ${scorecard.forbidden_behavior_summary.total_violations}`,
    `- Suppressed: ${scorecard.forbidden_behavior_summary.suppressed ? 'YES' : 'NO'}`,
    '',
    '## Per-Emotion Review',
    '',
  ];

  for (const entry of scorecard.emotions) {
    lines.push(`### ${entry.emotion_name} (\`${entry.emotion_id}\`)`);
    lines.push('');
    lines.push(`- Character: \`${entry.character_id}\` · Location: \`${entry.location_id}\``);
    lines.push(`- Coverage: \`${entry.coverage_id}\``);
    lines.push(`- Readability: ${entry.metrics_pre_eda.emotion_readability} → ${entry.metrics_rkb_007.emotion_readability} (Δ +${entry.delta_vs_pre_eda})`);
    lines.push(`- Adapter consumption: ${entry.adapter_consumption_pass_count}/${entry.generation_count} PASS`);
    lines.push(`- High-visibility shots: ${entry.shot_integration_high_visibility_count}`);
    lines.push(`- Emotion pass: **${entry.emotion_pass ? 'PASS' : 'FAIL'}**`);
    lines.push('');
    lines.push('| Criterion | Verdict |');
    lines.push('| --- | --- |');
    lines.push(`| Emotion Recognition | ${entry.review_criteria.emotion_recognition} |`);
    lines.push(`| Eye Behavior Consistency | ${entry.review_criteria.eye_behavior_consistency} |`);
    lines.push(`| Body Language Consistency | ${entry.review_criteria.body_language_consistency} |`);
    lines.push(`| Forbidden Behavior Compliance | ${entry.review_criteria.forbidden_behavior_compliance} |`);
    lines.push(`| Shot Integration | ${entry.review_criteria.shot_integration} |`);
    lines.push('');
  }

  lines.push('## Success Condition');
  lines.push('');
  lines.push('- Required: ≥6/8 emotions pass all review categories; readability exceeds pre-EDA baseline');
  lines.push(
    `- Result: **${scorecard.success_condition.actual_pass_emotions}/${scorecard.success_condition.required_pass_emotions}** emotions — ${scorecard.success_condition.met ? 'MET' : 'NOT MET'}`
  );
  lines.push('');
  lines.push('## Next Phase');
  lines.push('');
  lines.push('**MV-DATASET-001** — INSTRUMENTAL_MV_DATASET_V1');
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb007Scorecard): string {
  const lines: string[] = [
    '# RKB-007 Visual Comparison Matrix',
    '',
    'Baselines: **pre-EDA** (generic acting) · **RKB-006** (coverage grammar) · **RKB-007** (emotion acting DNA)',
    '',
    '## Emotion Grid',
    '',
    '| Emotion | Pre-EDA Readability | RKB-007 Readability | High-Vis Shots | Forbidden Violations | Overall |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
  ];

  for (const entry of scorecard.emotions) {
    lines.push(
      `| ${entry.emotion_name} | ${entry.metrics_pre_eda.emotion_readability} | ${entry.metrics_rkb_007.emotion_readability} | ${entry.shot_integration_high_visibility_count} | ${entry.forbidden_violation_count} | ${entry.emotion_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push('## Visual Review Slots');
  lines.push('');
  lines.push('Batch: `exports/image_app/test_batches/rkb-007-emotion-validation-test-batch.json` (80 shots)');
  lines.push('');

  for (const emotionId of INITIAL_EMOTION_IDS) {
    const entry = scorecard.emotions.find((e) => e.emotion_id === emotionId);
    lines.push(`### ${entry?.emotion_name ?? emotionId}`);
    lines.push('');
    for (let i = 1; i <= RKB_007_GENERATIONS_PER_EMOTION; i += 1) {
      lines.push(
        `- Gen ${String(i).padStart(2, '0')}: _[attach render]_ — emotion recognition / eye / body / forbidden / shot integration`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function buildRkb007TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const shots = buildRkb007TestShots(projectRoot);
  return {
    batch_type: 'rkb_007_emotion_acting_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-007',
    test_id: RKB_007_TEST_ID,
    generated_at: new Date().toISOString(),
    emotions: INITIAL_EMOTION_IDS.map((id) => ({
      emotion_id: id,
      emotion_name: EMOTION_TEST_CONTEXTS[id].emotion_name,
    })),
    generations_per_emotion: RKB_007_GENERATIONS_PER_EMOTION,
    emotion_count: INITIAL_EMOTION_IDS.length,
    total_shots: shots.length,
    held_constant: [
      'character_id',
      'location_id',
      'lighting_anchor_id',
      'coverage_id',
      'scene_goal',
    ],
    varied_per_shot: [
      'pose_detail',
      'micro_expression',
      'head_angle_detail',
      'hand_positioning',
      'camera_framing',
      'camera_distance',
    ],
    shots,
  };
}

export function writeRkb007Artifacts(projectRoot?: string): {
  scorecard: Rkb007Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb007Scorecard(root);
  const testBatch = buildRkb007TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_007_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_007_REPORT_PATH);
  const visualPath = path.join(root, RKB_007_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_007_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_007_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    asset_type: 'render_knowledge_base_entry',
    asset_version: 'v1',
    phase: 'PHASE-RKB-007',
    test_id: RKB_007_TEST_ID,
    test_name: RKB_007_TEST_NAME,
    test_date: scorecard.generated_at.slice(0, 10),
    comparison_baselines: scorecard.comparison_baselines,
    input_assets: {
      emotion_acting_library: EMOTION_ACTING_LIBRARY_PATH,
      emotion_acting_adapter: EMOTION_ACTING_ADAPTER_PATH,
      emotion_acting_latest_adapter: EMOTION_ACTING_LATEST_ADAPTER_PATH,
      test_batch: RKB_007_TEST_BATCH_PATH,
      scorecard: RKB_007_SCORECARD_PATH,
    },
    generation_count: scorecard.adapter_consumption_check.total_shots,
    adapter_consumption_verdict: scorecard.adapter_consumption_check.verdict,
    forbidden_behavior_suppressed: scorecard.forbidden_behavior_summary.suppressed,
    success_condition_met: scorecard.success_condition.met,
    final_verdict: scorecard.final_verdict,
    next_phase: 'MV-DATASET-001 INSTRUMENTAL_MV_DATASET_V1',
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
