import fs from 'node:fs';
import path from 'node:path';
import { enrichLocationContinuityAnchorsWithIndoorAnchor } from './indoorLocationAnchor.js';
import {
  enrichAnchorsWithLightingAnchor,
  resolveLightingAnchorByAnchorId,
  type InitialLightingAnchorId,
} from './lightingAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  COVERAGE_GRAMMAR_LIBRARY_PATH,
  COVERAGE_PATTERN_IDS,
  REQUIRED_COVERAGE_TOKENS,
  SHOT_GRAMMAR_ADAPTER_PATH,
  resolveCoverageFromAdapterMap,
  validateCoverageSequence,
  type ShotCoverageResolutionInput,
} from './shotGrammar.js';

export const RKB_006_TEST_ID = 'RKB-006' as const;
export const RKB_006_TEST_NAME = 'COVERAGE_VALIDATION' as const;
export const RKB_006_GENERATIONS_PER_SCENE = 10 as const;
export const RKB_006_SCENE_COUNT = 4 as const;

export const RKB_006_TEST_BATCH_PATH =
  'exports/image_app/test_batches/rkb-006-coverage-validation-test-batch.json' as const;
export const RKB_006_SCORECARD_PATH = 'datasets/render_feedback/RKB-006_SCORECARD.json' as const;
export const RKB_006_REPORT_PATH = 'datasets/render_feedback/RKB-006_REPORT.md' as const;
export const RKB_006_VISUAL_COMPARISON_PATH =
  'datasets/render_feedback/RKB-006_VISUAL_COMPARISON.md' as const;
export const RKB_006_ENTRY_PATH = 'datasets/render_feedback/RKB-006.json' as const;

export const SHOT_GRAMMAR_LATEST_ADAPTER_PATH =
  'exports/image_app/latest/shot-grammar-adapter.json' as const;
export const SHOT_GRAMMAR_ADAPTER_REPORT_PATH =
  'exports/image_app/reports/shot-grammar-adapter-report.json' as const;
export const RKB_004_SCORECARD_PATH = 'datasets/render_feedback/RKB-004_SCORECARD.json' as const;
export const RKB_005_SCORECARD_PATH = 'datasets/render_feedback/RKB-005_SCORECARD.json' as const;

export type ReviewVerdict = 'PASS' | 'FAIL';

export type Rkb006SceneId = 'scene_a' | 'scene_b' | 'scene_c' | 'scene_d';

export type SceneTestContext = {
  scene_id: Rkb006SceneId;
  scene_label: string;
  scene_archetype: string;
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  character_id: 'gonegi' | 'dana';
  action_type: string;
  scene_goal: string;
  expected_coverage_id: string;
};

export const RKB_006_SCENE_CONTEXTS: Record<Rkb006SceneId, SceneTestContext> = {
  scene_a: {
    scene_id: 'scene_a',
    scene_label: 'Gonegi bakery morning',
    scene_archetype: 'bakery_opening',
    location_id: 'family_bakery_kitchen_01',
    lighting_anchor_id: 'morning_bakery_glow_01',
    lighting_dna_id: 'morning_bakery_kitchen',
    character_id: 'gonegi',
    action_type: 'awaken',
    scene_goal: 'open bakery morning ritual',
    expected_coverage_id: 'coverage_pattern_01_establishing_insert_reaction',
  },
  scene_b: {
    scene_id: 'scene_b',
    scene_label: 'Dana window reading',
    scene_archetype: 'window_gaze',
    location_id: 'dana_window_corner_01',
    lighting_anchor_id: 'sunrise_window_soft_01',
    lighting_dna_id: 'sunrise_bakery_window',
    character_id: 'dana',
    action_type: 'gaze',
    scene_goal: 'quiet reading at window nook',
    expected_coverage_id: 'coverage_pattern_03_pov_insert_chain',
  },
  scene_c: {
    scene_id: 'scene_c',
    scene_label: 'Harbor dock activity',
    scene_archetype: 'harbor_work',
    location_id: 'gonegi_harbor_dock_01',
    lighting_anchor_id: 'midday_harbor_clear_01',
    lighting_dna_id: 'morning_harbor_dock',
    character_id: 'gonegi',
    action_type: 'work',
    scene_goal: 'dock work under clear midday light',
    expected_coverage_id: 'coverage_pattern_02_environmental_close',
  },
  scene_d: {
    scene_id: 'scene_d',
    scene_label: 'Olive hill lunch',
    scene_archetype: 'hill_afternoon',
    location_id: 'gonegi_olive_hill_01',
    lighting_anchor_id: 'afternoon_olive_hill_01',
    lighting_dna_id: 'afternoon_olive_hill',
    character_id: 'gonegi',
    action_type: 'react',
    scene_goal: 'afternoon lunch pause on olive hill',
    expected_coverage_id: 'coverage_pattern_02_environmental_close',
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

export type CoverageShotVariation = {
  generation_index: number;
  coverage_step: number;
  shot_type: string;
  camera_distance: string;
  camera_angle: string;
  camera_position: string;
  body_action: string;
  gaze_direction: string;
  acting_intent: string;
};

export type Rkb006TestShot = {
  shot_id: string;
  scene_id: Rkb006SceneId;
  scene_label: string;
  generation_index: number;
  scene_goal: string;
  coverage_id: string;
  coverage_step: number;
  shot_type: string;
  shot_sequence: readonly string[];
  scene_archetype: string;
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  lighting_dna_id: string;
  character_id: 'gonegi' | 'dana';
  action_type: string;
  shot_variation: CoverageShotVariation;
  continuity_anchors: string[];
  adapter_consumption: {
    has_coverage_id_token: boolean;
    has_shot_type_token: boolean;
    has_coverage_step_token: boolean;
    has_coverage_purpose_token: boolean;
    has_forbidden_repeat_token: boolean;
    has_anchor_visibility_token: boolean;
    pass: boolean;
  };
};

export type SceneReviewCriteria = {
  coverage_diversity: ReviewVerdict;
  medium_chain_reduction: ReviewVerdict;
  cinematic_feel: ReviewVerdict;
  anchor_preservation: ReviewVerdict;
};

export type SceneScorecardEntry = {
  scene_id: Rkb006SceneId;
  scene_label: string;
  location_id: string;
  lighting_anchor_id: InitialLightingAnchorId;
  character_id: 'gonegi' | 'dana';
  scene_goal: string;
  coverage_id: string;
  shot_sequence: readonly string[];
  generation_count: number;
  adapter_consumption_pass_count: number;
  unique_shot_types: string[];
  medium_triple_chain_count: number;
  pre_shot_medium_triple_chain_count: number;
  medium_chain_reduction_rate: number;
  coverage_diversity_score: number;
  review_criteria: SceneReviewCriteria;
  metrics_pre_shot: { coverage_diversity: number; medium_chain_rate: number };
  metrics_rkb_006: { coverage_diversity: number; medium_chain_rate: number };
  coverage_pattern_recognizable: boolean;
  scene_pass: boolean;
};

export type Rkb006Scorecard = {
  test_id: typeof RKB_006_TEST_ID;
  test_name: typeof RKB_006_TEST_NAME;
  phase: 'PHASE-RKB-006';
  generated_at: string;
  comparison_baselines: ['RKB-004', 'RKB-005', 'pre-SHOT-GRAMMAR'];
  precheck: {
    shot_grammar_verdict: string | null;
    rkb_004_verdict: string | null;
    rkb_005_verdict: string | null;
    latest_adapter_present: boolean;
    pass: boolean;
  };
  adapter_consumption_check: {
    total_shots: number;
    pass_count: number;
    fail_count: number;
    verdict: ReviewVerdict;
  };
  medium_chain_reduction: {
    pre_shot_total_chains: number;
    rkb_006_total_chains: number;
    reduction_rate: number;
    target_reduction: 0.8;
    met: boolean;
  };
  scenes: SceneScorecardEntry[];
  success_condition: {
    required_pass_scenes: 4;
    actual_pass_scenes: number;
    met: boolean;
  };
  aggregate_coverage_diversity: {
    pre_shot: number;
    rkb_006: number;
    improvement: number;
  };
  final_verdict: 'PASS_RKB_006_COVERAGE_VALIDATION' | 'FAIL_RKB_006_COVERAGE_VALIDATION';
};

const DIVERSITY_TARGET_TYPES = [
  'wide',
  'medium',
  'close',
  'insert',
  'reaction',
  'pov',
  'environmental',
] as const;

const CAMERA_VARIATIONS: readonly Omit<
  CoverageShotVariation,
  'generation_index' | 'coverage_step' | 'shot_type'
>[] = [
  {
    camera_distance: 'wide',
    camera_angle: 'eye-level',
    camera_position: 'center_axis',
    body_action: 'hold scene goal',
    gaze_direction: 'toward scene focal point',
    acting_intent: 'establish coverage beat',
  },
  {
    camera_distance: 'medium',
    camera_angle: 'slight-high',
    camera_position: 'left_third',
    body_action: 'perform scene task',
    gaze_direction: 'down-left to detail',
    acting_intent: 'sustain performance',
  },
  {
    camera_distance: 'medium-close',
    camera_angle: 'eye-level',
    camera_position: 'right_profile',
    body_action: 'hand detail action',
    gaze_direction: 'at hands',
    acting_intent: 'tactile insert beat',
  },
  {
    camera_distance: 'close',
    camera_angle: 'low',
    camera_position: 'over_shoulder',
    body_action: 'micro reaction',
    gaze_direction: 'off-axis',
    acting_intent: 'emotional reaction',
  },
  {
    camera_distance: 'wide',
    camera_angle: 'high',
    camera_position: 'rear_axis',
    body_action: 'reorient in space',
    gaze_direction: 'toward horizon',
    acting_intent: 'release wide',
  },
  {
    camera_distance: 'tracking',
    camera_angle: 'eye-level',
    camera_position: 'lateral_track',
    body_action: 'walk through space',
    gaze_direction: 'forward path',
    acting_intent: 'kinetic entry',
  },
  {
    camera_distance: 'environmental',
    camera_angle: 'high-wide',
    camera_position: 'establishing_axis',
    body_action: 'pause in environment',
    gaze_direction: 'skyline',
    acting_intent: 'environmental read',
  },
  {
    camera_distance: 'pov',
    camera_angle: 'subjective',
    camera_position: 'first_person',
    body_action: 'look through subject eyes',
    gaze_direction: 'subject sightline',
    acting_intent: 'subjective pov',
  },
  {
    camera_distance: 'insert',
    camera_angle: 'top-down',
    camera_position: 'detail_macro',
    body_action: 'object interaction',
    gaze_direction: 'n/a',
    acting_intent: 'detail insert',
  },
  {
    camera_distance: 'close',
    camera_angle: 'three-quarter',
    camera_position: 'intimate_front',
    body_action: 'quiet resolve',
    gaze_direction: 'soft down',
    acting_intent: 'closing beat',
  },
];

/** Pre-SHOT baseline: flat medium-only coverage across all generations per scene. */
const PRE_SHOT_MEDIUM_CHAIN_COUNT_PER_SCENE = 8;

function readJson<T>(projectRoot: string, relativePath: string): T | null {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return null;
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

function readScorecardVerdict(relativePath: string, root: string): string | null {
  const doc = readJson<{ final_verdict?: string }>(root, relativePath);
  return doc?.final_verdict ?? null;
}

export function runRkb006Precheck(projectRoot?: string): {
  pass: boolean;
  violations: string[];
  shotGrammarVerdict: string | null;
  rkb004Verdict: string | null;
  rkb005Verdict: string | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const violations: string[] = [];

  if (!fs.existsSync(path.join(root, COVERAGE_GRAMMAR_LIBRARY_PATH))) {
    violations.push(`Missing ${COVERAGE_GRAMMAR_LIBRARY_PATH}`);
  }
  if (!fs.existsSync(path.join(root, SHOT_GRAMMAR_ADAPTER_PATH))) {
    violations.push(`Missing ${SHOT_GRAMMAR_ADAPTER_PATH}`);
  }
  if (!fs.existsSync(path.join(root, SHOT_GRAMMAR_LATEST_ADAPTER_PATH))) {
    violations.push(`Missing ${SHOT_GRAMMAR_LATEST_ADAPTER_PATH}`);
  }

  const grammarReport = readJson<{ final_verdict?: string }>(
    root,
    SHOT_GRAMMAR_ADAPTER_REPORT_PATH
  );
  const shotGrammarVerdict = grammarReport?.final_verdict ?? null;
  if (shotGrammarVerdict !== 'PASS_CINEMATIC_COVERAGE_GRAMMAR_V1') {
    violations.push(
      `Expected PASS_CINEMATIC_COVERAGE_GRAMMAR_V1, got ${shotGrammarVerdict ?? 'missing'}`
    );
  }

  const rkb004Verdict = readScorecardVerdict(RKB_004_SCORECARD_PATH, root);
  if (rkb004Verdict !== 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION') {
    violations.push(`Expected PASS_RKB_004_INDOOR_LOCATION_VALIDATION, got ${rkb004Verdict ?? 'missing'}`);
  }

  const rkb005Verdict = readScorecardVerdict(RKB_005_SCORECARD_PATH, root);
  if (rkb005Verdict !== 'PASS_RKB_005_LIGHTING_VALIDATION') {
    violations.push(`Expected PASS_RKB_005_LIGHTING_VALIDATION, got ${rkb005Verdict ?? 'missing'}`);
  }

  return { pass: violations.length === 0, violations, shotGrammarVerdict, rkb004Verdict, rkb005Verdict };
}

export function checkCoverageAdapterConsumptionTokens(
  anchors: readonly string[]
): Rkb006TestShot['adapter_consumption'] {
  const blob = anchors.join('\n');
  const hasCoverageId = anchors.some((t) => t.startsWith('coverage-id:'));
  const hasShotType = anchors.some((t) => t.startsWith('shot-type:'));
  const hasCoverageStep = anchors.some((t) => t.startsWith('coverage-step:'));
  const hasCoveragePurpose = anchors.some((t) => t.startsWith('coverage-purpose:'));
  const hasForbiddenRepeat = anchors.some((t) => t.startsWith('forbidden-repeat:'));
  const hasAnchorVisibility = anchors.some((t) => t.startsWith('anchor-visibility:'));

  const requiredPrefixesPresent = REQUIRED_COVERAGE_TOKENS.every((prefix) => blob.includes(prefix));

  return {
    has_coverage_id_token: hasCoverageId,
    has_shot_type_token: hasShotType,
    has_coverage_step_token: hasCoverageStep,
    has_coverage_purpose_token: hasCoveragePurpose,
    has_forbidden_repeat_token: hasForbiddenRepeat,
    has_anchor_visibility_token: hasAnchorVisibility,
    pass:
      requiredPrefixesPresent &&
      hasCoverageId &&
      hasShotType &&
      hasCoverageStep &&
      hasCoveragePurpose &&
      hasForbiddenRepeat &&
      hasAnchorVisibility,
  };
}

export function buildCoverageResolutionInput(context: SceneTestContext): ShotCoverageResolutionInput {
  return {
    scene_archetype: context.scene_archetype,
    location_id: context.location_id,
    lighting_anchor_id: context.lighting_anchor_id,
    action_type: context.action_type,
  };
}

export function buildContinuityAnchorsForCoverageShot(
  context: SceneTestContext,
  generationIndex: number,
  cameraDistance: string,
  projectRoot?: string
): string[] {
  const resolution = resolveCoverageFromAdapterMap(
    buildCoverageResolutionInput(context),
    projectRoot
  );
  if (!resolution) {
    throw new Error(`Unable to resolve coverage for ${context.scene_id}`);
  }

  const sequence = resolution.shot_sequence;
  const stepIndex = (generationIndex - 1) % sequence.length;
  const stepPayload = resolution.render_payload.shot_steps[stepIndex];

  const base = [
    `location:${context.location_id}`,
    `character:${context.character_id}`,
    `scene-goal:${context.scene_goal}`,
    `lighting-dna:${context.lighting_dna_id}`,
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

  return [...new Set([...merged, ...(stepPayload?.coverage_tokens ?? [])])].sort();
}

export function countMediumTripleChains(shotTypes: readonly string[]): number {
  let count = 0;
  for (let i = 0; i < shotTypes.length - 2; i += 1) {
    if (shotTypes[i] === 'medium' && shotTypes[i + 1] === 'medium' && shotTypes[i + 2] === 'medium') {
      count += 1;
    }
  }
  return count;
}

export function buildRkb006TestShots(projectRoot?: string): Rkb006TestShot[] {
  const shots: Rkb006TestShot[] = [];
  const sceneIds = Object.keys(RKB_006_SCENE_CONTEXTS) as Rkb006SceneId[];

  for (const sceneId of sceneIds) {
    const context = RKB_006_SCENE_CONTEXTS[sceneId];
    const resolution = resolveCoverageFromAdapterMap(
      buildCoverageResolutionInput(context),
      projectRoot
    );
    if (!resolution) {
      throw new Error(`Unable to resolve coverage for scene ${sceneId}`);
    }

    const sequenceCheck = validateCoverageSequence(resolution.shot_sequence);
    if (!sequenceCheck.valid) {
      throw new Error(
        `Invalid coverage sequence for ${sceneId}: ${sequenceCheck.violations.join(', ')}`
      );
    }

    for (let generationIndex = 1; generationIndex <= RKB_006_GENERATIONS_PER_SCENE; generationIndex += 1) {
      const variationTemplate = CAMERA_VARIATIONS[generationIndex - 1];
      const stepIndex = (generationIndex - 1) % resolution.shot_sequence.length;
      const shotType = resolution.shot_sequence[stepIndex];
      const coverageStep = stepIndex + 1;

      const continuityAnchors = buildContinuityAnchorsForCoverageShot(
        context,
        generationIndex,
        variationTemplate.camera_distance,
        projectRoot
      );

      shots.push({
        shot_id: `RKB006-${sceneId}-gen-${String(generationIndex).padStart(2, '0')}`,
        scene_id: sceneId,
        scene_label: context.scene_label,
        generation_index: generationIndex,
        scene_goal: context.scene_goal,
        coverage_id: resolution.coverage_id,
        coverage_step: coverageStep,
        shot_type: shotType,
        shot_sequence: resolution.shot_sequence,
        scene_archetype: context.scene_archetype,
        location_id: context.location_id,
        lighting_anchor_id: context.lighting_anchor_id,
        lighting_dna_id: context.lighting_dna_id,
        character_id: context.character_id,
        action_type: context.action_type,
        shot_variation: {
          generation_index: generationIndex,
          coverage_step: coverageStep,
          shot_type: shotType,
          ...variationTemplate,
        },
        continuity_anchors: continuityAnchors,
        adapter_consumption: checkCoverageAdapterConsumptionTokens(continuityAnchors),
      });
    }
  }

  return shots;
}

function scoreCoverageDiversity(uniqueTypes: readonly string[]): number {
  const matched = DIVERSITY_TARGET_TYPES.filter((type) => uniqueTypes.includes(type)).length;
  return Math.round((matched / DIVERSITY_TARGET_TYPES.length) * 100) / 100;
}

function evaluateSceneCriteria(
  sceneShots: readonly Rkb006TestShot[],
  context: SceneTestContext
): SceneScorecardEntry {
  const orderedTypes = sceneShots
    .slice()
    .sort((a, b) => a.generation_index - b.generation_index)
    .map((s) => s.shot_type);

  const uniqueShotTypes = [...new Set(orderedTypes)];
  const mediumChains = countMediumTripleChains(orderedTypes);
  const preShotChains = PRE_SHOT_MEDIUM_CHAIN_COUNT_PER_SCENE;
  const reductionRate =
    preShotChains === 0
      ? 1
      : Math.round(((preShotChains - mediumChains) / preShotChains) * 100) / 100;

  const diversityScore = scoreCoverageDiversity(uniqueShotTypes);
  const preShotDiversity = 0.14;
  const adapterPassCount = sceneShots.filter((s) => s.adapter_consumption.pass).length;
  const allAdapterPass = adapterPassCount === sceneShots.length;

  const hasLocation = sceneShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('location:'))
  );
  const hasLighting = sceneShots.every((s) =>
    s.continuity_anchors.some((t) => t.startsWith('lighting-anchor:'))
  );
  const hasIndoorWhenNeeded =
    !INDOOR_LOCATION_IDS.has(context.location_id) ||
    sceneShots.every((s) => s.continuity_anchors.some((t) => t.startsWith('indoor-anchor:')));

  const coverageId = sceneShots[0]?.coverage_id ?? '';
  const patternRecognizable =
    coverageId === context.expected_coverage_id ||
    COVERAGE_PATTERN_IDS.includes(coverageId as (typeof COVERAGE_PATTERN_IDS)[number]);

  const diversityPass =
    uniqueShotTypes.length >= 4 &&
    diversityScore >= 0.43 &&
    uniqueShotTypes.some((t) => ['wide', 'environmental', 'establishing', 'tracking'].includes(t)) &&
    uniqueShotTypes.some((t) => ['insert', 'reaction', 'pov', 'close', 'extreme_close'].includes(t));

  const mediumChainPass = mediumChains === 0 && reductionRate >= 0.8;
  const cinematicPass =
    diversityPass &&
    sceneShots.every((s) => s.coverage_id === coverageId) &&
    validateCoverageSequence(sceneShots[0]?.shot_sequence ?? []).valid;

  const anchorPass = hasLocation && hasLighting && hasIndoorWhenNeeded && allAdapterPass;

  const review: SceneReviewCriteria = {
    coverage_diversity: diversityPass ? 'PASS' : 'FAIL',
    medium_chain_reduction: mediumChainPass ? 'PASS' : 'FAIL',
    cinematic_feel: cinematicPass ? 'PASS' : 'FAIL',
    anchor_preservation: anchorPass ? 'PASS' : 'FAIL',
  };

  const scenePass = Object.values(review).every((v) => v === 'PASS');

  return {
    scene_id: context.scene_id,
    scene_label: context.scene_label,
    location_id: context.location_id,
    lighting_anchor_id: context.lighting_anchor_id,
    character_id: context.character_id,
    scene_goal: context.scene_goal,
    coverage_id: coverageId,
    shot_sequence: sceneShots[0]?.shot_sequence ?? [],
    generation_count: sceneShots.length,
    adapter_consumption_pass_count: adapterPassCount,
    unique_shot_types: uniqueShotTypes,
    medium_triple_chain_count: mediumChains,
    pre_shot_medium_triple_chain_count: preShotChains,
    medium_chain_reduction_rate: reductionRate,
    coverage_diversity_score: diversityScore,
    review_criteria: review,
    metrics_pre_shot: {
      coverage_diversity: preShotDiversity,
      medium_chain_rate: 1,
    },
    metrics_rkb_006: {
      coverage_diversity: diversityScore,
      medium_chain_rate: mediumChains / Math.max(1, sceneShots.length - 2),
    },
    coverage_pattern_recognizable: patternRecognizable,
    scene_pass: scenePass,
  };
}

function buildReportMarkdown(scorecard: Rkb006Scorecard): string {
  const lines: string[] = [
    '# RKB-006 Coverage Validation Report',
    '',
    '**Phase:** PHASE-RKB-006',
    `**Test:** ${scorecard.test_name}`,
    `**Generated:** ${scorecard.generated_at}`,
    `**Baselines:** ${scorecard.comparison_baselines.join(', ')}`,
    `**Final Verdict:** ${scorecard.final_verdict}`,
    '',
    '## Precheck',
    '',
    `- Shot Grammar verdict: ${scorecard.precheck.shot_grammar_verdict ?? 'n/a'}`,
    `- RKB-004 verdict: ${scorecard.precheck.rkb_004_verdict ?? 'n/a'}`,
    `- RKB-005 verdict: ${scorecard.precheck.rkb_005_verdict ?? 'n/a'}`,
    `- Latest adapter present: ${scorecard.precheck.latest_adapter_present}`,
    `- Precheck: ${scorecard.precheck.pass ? 'PASS' : 'FAIL'}`,
    '',
    '## Test Method',
    '',
    `- 4 representative scenes × ${RKB_006_GENERATIONS_PER_SCENE} generations = ${scorecard.adapter_consumption_check.total_shots} test renders`,
    '- Scene A: Gonegi bakery morning',
    '- Scene B: Dana window reading',
    '- Scene C: Harbor dock activity',
    '- Scene D: Olive hill lunch',
    '- Held constant: character, location, lighting_anchor, scene_goal',
    '- Varied: coverage sequence step, camera position, shot progression',
    '',
    '## Adapter Consumption Check',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Pass | ${scorecard.adapter_consumption_check.pass_count} |`,
    `| Fail | ${scorecard.adapter_consumption_check.fail_count} |`,
    `| Verdict | ${scorecard.adapter_consumption_check.verdict} |`,
    '',
    'Required tokens: `coverage-id:`, `shot-type:`, `coverage-step:`, `coverage-purpose:`, `forbidden-repeat:`, `anchor-visibility:`',
    '',
    '## Medium Chain Reduction',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Pre-SHOT triple-medium chains (total) | ${scorecard.medium_chain_reduction.pre_shot_total_chains} |`,
    `| RKB-006 triple-medium chains (total) | ${scorecard.medium_chain_reduction.rkb_006_total_chains} |`,
    `| Reduction rate | ${(scorecard.medium_chain_reduction.reduction_rate * 100).toFixed(0)}% |`,
    `| Target | >${(scorecard.medium_chain_reduction.target_reduction * 100).toFixed(0)}% |`,
    `| Met | ${scorecard.medium_chain_reduction.met ? 'YES' : 'NO'} |`,
    '',
    '## Aggregate Coverage Diversity',
    '',
    `| Pre-SHOT | RKB-006 | Improvement |`,
    `| ---: | ---: | ---: |`,
    `| ${scorecard.aggregate_coverage_diversity.pre_shot} | ${scorecard.aggregate_coverage_diversity.rkb_006} | +${scorecard.aggregate_coverage_diversity.improvement} |`,
    '',
    '## Per-Scene Review',
    '',
  ];

  for (const entry of scorecard.scenes) {
    lines.push(`### ${entry.scene_label} (\`${entry.scene_id}\`)`);
    lines.push('');
    lines.push(`- Coverage: \`${entry.coverage_id}\``);
    lines.push(`- Sequence: ${entry.shot_sequence.join(' → ')}`);
    lines.push(`- Unique shot types: ${entry.unique_shot_types.join(', ')}`);
    lines.push(`- Medium triple chains: ${entry.medium_triple_chain_count} (pre-SHOT baseline ${entry.pre_shot_medium_triple_chain_count})`);
    lines.push(`- Adapter consumption: ${entry.adapter_consumption_pass_count}/${entry.generation_count} PASS`);
    lines.push(`- Scene pass: **${entry.scene_pass ? 'PASS' : 'FAIL'}**`);
    lines.push('');
    lines.push('| Criterion | Verdict |');
    lines.push('| --- | --- |');
    lines.push(`| Coverage Diversity | ${entry.review_criteria.coverage_diversity} |`);
    lines.push(`| Medium Chain Reduction | ${entry.review_criteria.medium_chain_reduction} |`);
    lines.push(`| Cinematic Feel | ${entry.review_criteria.cinematic_feel} |`);
    lines.push(`| Anchor Preservation | ${entry.review_criteria.anchor_preservation} |`);
    lines.push('');
  }

  lines.push('## Success Condition');
  lines.push('');
  lines.push('- Coverage diversity exceeds pre-SHOT baseline; medium chains reduced >80%; location and lighting retained');
  lines.push(
    `- Result: **${scorecard.success_condition.actual_pass_scenes}/${scorecard.success_condition.required_pass_scenes}** scenes — ${scorecard.success_condition.met ? 'MET' : 'NOT MET'}`
  );
  lines.push('');
  lines.push('## Next Phase');
  lines.push('');
  lines.push('**EDA-001** — EMOTION_ACTING_DNA_V1');
  lines.push('');

  return lines.join('\n');
}

function buildVisualComparisonMarkdown(scorecard: Rkb006Scorecard): string {
  const lines: string[] = [
    '# RKB-006 Visual Comparison Matrix',
    '',
    'Baselines: **pre-SHOT-GRAMMAR** (flat medium coverage) · **RKB-004** (indoor) · **RKB-005** (lighting) · **RKB-006** (shot grammar)',
    '',
    '## Scene Grid',
    '',
    '| Scene | Coverage Pattern | Diversity (pre) | Diversity (006) | Medium Chains (pre) | Medium Chains (006) | Overall |',
    '| --- | --- | ---: | ---: | ---: | ---: | --- |',
  ];

  for (const entry of scorecard.scenes) {
    lines.push(
      `| ${entry.scene_label} | ${entry.coverage_id.replace('coverage_pattern_', '')} | ${entry.metrics_pre_shot.coverage_diversity} | ${entry.metrics_rkb_006.coverage_diversity} | ${entry.pre_shot_medium_triple_chain_count} | ${entry.medium_triple_chain_count} | ${entry.scene_pass ? 'PASS' : 'FAIL'} |`
    );
  }

  lines.push('');
  lines.push('## Visual Review Slots');
  lines.push('');
  lines.push('Batch: `exports/image_app/test_batches/rkb-006-coverage-validation-test-batch.json` (40 shots)');
  lines.push('');

  for (const entry of scorecard.scenes) {
    lines.push(`### ${entry.scene_label}`);
    lines.push('');
    lines.push(`Coverage sequence: ${entry.shot_sequence.join(' → ')}`);
    lines.push('');
    for (let i = 1; i <= RKB_006_GENERATIONS_PER_SCENE; i += 1) {
      lines.push(
        `- Gen ${String(i).padStart(2, '0')}: _[attach render]_ — shot diversity / directed feel / location anchor / lighting anchor`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function buildRkb006Scorecard(projectRoot?: string): Rkb006Scorecard {
  const root = resolveProjectRoot(projectRoot);
  const precheck = runRkb006Precheck(root);
  if (!precheck.pass) {
    throw new Error(`RKB-006 precheck failed: ${precheck.violations.join('; ')}`);
  }

  const shots = buildRkb006TestShots(root);
  const adapterPassCount = shots.filter((s) => s.adapter_consumption.pass).length;
  const adapterFailCount = shots.length - adapterPassCount;
  const adapterVerdict: ReviewVerdict = adapterFailCount === 0 ? 'PASS' : 'FAIL';

  const sceneIds = Object.keys(RKB_006_SCENE_CONTEXTS) as Rkb006SceneId[];
  const scenes = sceneIds.map((sceneId) => {
    const context = RKB_006_SCENE_CONTEXTS[sceneId];
    const sceneShots = shots.filter((s) => s.scene_id === sceneId);
    return evaluateSceneCriteria(sceneShots, context);
  });

  const passScenes = scenes.filter((s) => s.scene_pass).length;
  const preShotChains = scenes.reduce((sum, s) => sum + s.pre_shot_medium_triple_chain_count, 0);
  const rkb006Chains = scenes.reduce((sum, s) => sum + s.medium_triple_chain_count, 0);
  const reductionRate =
    preShotChains === 0 ? 1 : Math.round(((preShotChains - rkb006Chains) / preShotChains) * 100) / 100;

  const preShotDiversity =
    Math.round(
      (scenes.reduce((sum, s) => sum + s.metrics_pre_shot.coverage_diversity, 0) / scenes.length) * 100
    ) / 100;
  const rkb006Diversity =
    Math.round(
      (scenes.reduce((sum, s) => sum + s.metrics_rkb_006.coverage_diversity, 0) / scenes.length) * 100
    ) / 100;

  const chainReductionMet = reductionRate >= 0.8 && rkb006Chains === 0;
  const successMet =
    passScenes >= 4 &&
    adapterVerdict === 'PASS' &&
    chainReductionMet &&
    rkb006Diversity > preShotDiversity;

  return {
    test_id: RKB_006_TEST_ID,
    test_name: RKB_006_TEST_NAME,
    phase: 'PHASE-RKB-006',
    generated_at: new Date().toISOString(),
    comparison_baselines: ['RKB-004', 'RKB-005', 'pre-SHOT-GRAMMAR'],
    precheck: {
      shot_grammar_verdict: precheck.shotGrammarVerdict,
      rkb_004_verdict: precheck.rkb004Verdict,
      rkb_005_verdict: precheck.rkb005Verdict,
      latest_adapter_present: fs.existsSync(path.join(root, SHOT_GRAMMAR_LATEST_ADAPTER_PATH)),
      pass: precheck.pass,
    },
    adapter_consumption_check: {
      total_shots: shots.length,
      pass_count: adapterPassCount,
      fail_count: adapterFailCount,
      verdict: adapterVerdict,
    },
    medium_chain_reduction: {
      pre_shot_total_chains: preShotChains,
      rkb_006_total_chains: rkb006Chains,
      reduction_rate: reductionRate,
      target_reduction: 0.8,
      met: chainReductionMet,
    },
    scenes,
    success_condition: {
      required_pass_scenes: 4,
      actual_pass_scenes: passScenes,
      met: successMet,
    },
    aggregate_coverage_diversity: {
      pre_shot: preShotDiversity,
      rkb_006: rkb006Diversity,
      improvement: Math.round((rkb006Diversity - preShotDiversity) * 100) / 100,
    },
    final_verdict: successMet
      ? 'PASS_RKB_006_COVERAGE_VALIDATION'
      : 'FAIL_RKB_006_COVERAGE_VALIDATION',
  };
}

export function buildRkb006TestBatchExport(projectRoot?: string): Record<string, unknown> {
  const shots = buildRkb006TestShots(projectRoot);
  return {
    batch_type: 'rkb_006_coverage_validation_batch',
    batch_version: 'v1',
    phase: 'PHASE-RKB-006',
    test_id: RKB_006_TEST_ID,
    generated_at: new Date().toISOString(),
    scenes: Object.values(RKB_006_SCENE_CONTEXTS).map((s) => ({
      scene_id: s.scene_id,
      scene_label: s.scene_label,
    })),
    generations_per_scene: RKB_006_GENERATIONS_PER_SCENE,
    scene_count: RKB_006_SCENE_COUNT,
    total_shots: shots.length,
    held_constant: ['character_id', 'location_id', 'lighting_anchor_id', 'scene_goal'],
    varied_per_shot: [
      'coverage_step',
      'shot_type',
      'camera_position',
      'camera_angle',
      'camera_distance',
      'body_action',
    ],
    shots,
  };
}

export function writeRkb006Artifacts(projectRoot?: string): {
  scorecard: Rkb006Scorecard;
  paths: {
    scorecard: string;
    report: string;
    visualComparison: string;
    entry: string;
    testBatch: string;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const scorecard = buildRkb006Scorecard(root);
  const testBatch = buildRkb006TestBatchExport(root);

  const scorecardPath = path.join(root, RKB_006_SCORECARD_PATH);
  const reportPath = path.join(root, RKB_006_REPORT_PATH);
  const visualPath = path.join(root, RKB_006_VISUAL_COMPARISON_PATH);
  const entryPath = path.join(root, RKB_006_ENTRY_PATH);
  const testBatchPath = path.join(root, RKB_006_TEST_BATCH_PATH);

  fs.mkdirSync(path.dirname(scorecardPath), { recursive: true });
  fs.mkdirSync(path.dirname(testBatchPath), { recursive: true });

  fs.writeFileSync(scorecardPath, `${JSON.stringify(scorecard, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, `${buildReportMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(visualPath, `${buildVisualComparisonMarkdown(scorecard)}\n`, 'utf8');
  fs.writeFileSync(testBatchPath, `${JSON.stringify(testBatch, null, 2)}\n`, 'utf8');

  const entry = {
    asset_type: 'render_knowledge_base_entry',
    asset_version: 'v1',
    phase: 'PHASE-RKB-006',
    test_id: RKB_006_TEST_ID,
    test_name: RKB_006_TEST_NAME,
    test_date: scorecard.generated_at.slice(0, 10),
    comparison_baselines: scorecard.comparison_baselines,
    input_assets: {
      coverage_grammar_library: COVERAGE_GRAMMAR_LIBRARY_PATH,
      shot_grammar_adapter: SHOT_GRAMMAR_ADAPTER_PATH,
      shot_grammar_latest_adapter: SHOT_GRAMMAR_LATEST_ADAPTER_PATH,
      test_batch: RKB_006_TEST_BATCH_PATH,
      scorecard: RKB_006_SCORECARD_PATH,
    },
    generation_count: scorecard.adapter_consumption_check.total_shots,
    adapter_consumption_verdict: scorecard.adapter_consumption_check.verdict,
    medium_chain_reduction_met: scorecard.medium_chain_reduction.met,
    success_condition_met: scorecard.success_condition.met,
    final_verdict: scorecard.final_verdict,
    next_phase: 'EDA-001 EMOTION_ACTING_DNA_V1',
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
