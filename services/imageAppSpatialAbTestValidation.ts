import fs from 'node:fs';
import path from 'node:path';
import {
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalCharacterField,
  copyApprovedOriginalTimeSettingPrompt,
} from './approvedOriginalsLoader.js';
import { MOVIE_SPATIAL_TEST_DIR } from './generationOutputPaths.js';
import { ImageAppNativeImportSlot } from './movieImageAppNativeImportBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  buildSpatialConditioningBundle,
  runtimeSpatialGraphFromScenario,
} from './spatialConditioningAdapter.js';

type Vec3 = [number, number, number];

export const SPATIAL_AB_TEST_PHASE = 'PHASE-IMAGE-APP-SPATIAL-AB-TEST-001' as const;
export const SPATIAL_AB_TEST_SYSTEM_ID = 'SPATIAL_AB_TEST_V1' as const;
export const SPATIAL_AB_TEST_PASS_VERDICT = 'PASS_SPATIAL_AB_TEST_V1' as const;
export const SPATIAL_AB_TEST_FAIL_VERDICT = 'FAIL_SPATIAL_AB_TEST_V1' as const;

export const SPATIAL_AB_TEST_OUTPUT_PATH =
  `${MOVIE_SPATIAL_TEST_DIR}/titanic-spatial-ab-test.json` as const;

export const SPATIAL_AB_TEST_REPORT_PATH =
  'reports/movie_spatial/SPATIAL_AB_TEST_REPORT.json' as const;

export const SCENE_A_ID = 'scene_titanic_spatial_test_A' as const;
export const SCENE_B_ID = 'scene_titanic_spatial_test_B' as const;

const GONAGI_POSITION_A: Vec3 = [0.25, 0.5, 1.6];
const DANA_POSITION_A: Vec3 = [0.75, 0.5, 1.6];
const GONAGI_POSITION_B: Vec3 = [0.75, 0.5, 1.6];
const DANA_POSITION_B: Vec3 = [0.25, 0.5, 1.6];

const PROP_POSITION: Vec3 = [0.15, 0.75, 1.1];
const ENV_POSITION: Vec3 = [0.5, 0.5, 3.5];
const CAMERA_POSITION: Vec3 = [0.5, 0.5, 3.5];
const CAMERA_DISTANCE = 4.0;
const CAMERA_HEIGHT = 'eye_level';
const CAMERA_TYPE = 'eye_level_medium_wide';
const SHOT_TYPE = 'medium_wide_shot';

const GONAGI_ROTATION: Vec3 = [6.719, 1.6387, 0];
const DANA_ROTATION: Vec3 = [7.0941, -5.1918, 0];
const GAZE_DIRECTION_GONAGI: Vec3 = [0.8944, 0, 0.4472];
const GAZE_DIRECTION_DANA: Vec3 = [-0.8944, 0, -0.4472];

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export interface SpatialAbTestImportDataset {
  native_import_id: string;
  phase: typeof SPATIAL_AB_TEST_PHASE;
  system_id: typeof SPATIAL_AB_TEST_SYSTEM_ID;
  version: 'spatial_ab_v1';
  movie_id: 'titanic';
  approved_originals_manifest_ref: typeof APPROVED_ORIGINALS_MANIFEST_PATH;
  approved_originals_artstyle_ref: typeof ARTSTYLE_APPROVED_PATH;
  approved_originals_character_ref: typeof CHARACTER_APPROVED_PATH;
  approved_originals_timesetting_ref: typeof TIMESETTING_APPROVED_PATH;
  generated_at: string;
  slot_count: 2;
  ab_test: {
    test_type: 'spatial_character_position_swap';
    scene_a_index: 0;
    scene_b_index: 1;
    scene_a_id: typeof SCENE_A_ID;
    scene_b_id: typeof SCENE_B_ID;
  };
  music_drama_import_ready: true;
  slots: Array<
    ImageAppNativeImportSlot & {
      scene_id: string;
      ab_test_variant: 'A' | 'B';
    }
  >;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface SpatialAbTestReport {
  report_id: string;
  phase: typeof SPATIAL_AB_TEST_PHASE;
  system_id: typeof SPATIAL_AB_TEST_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  ab_test_ready: boolean;
  scene_count: number;
  character_swap_only: boolean;
  environment_locked: boolean;
  prop_locked: boolean;
  camera_locked: boolean;
  ready_for_manual_image_generation: boolean;
  output_path: typeof SPATIAL_AB_TEST_OUTPUT_PATH;
  checks: {
    character_positions_differ: boolean;
    environment_identical: boolean;
    prop_identical: boolean;
    camera_identical: boolean;
    timeSetting_identical: boolean;
    artStyle_identical: boolean;
    character_dna_identical: boolean;
    scenario_structure_identical: boolean;
  };
  scene_summary: {
    scene_a: {
      scene_id: typeof SCENE_A_ID;
      gonagi_position: string;
      dana_position: string;
      gonagi_region: string;
      dana_region: string;
    };
    scene_b: {
      scene_id: typeof SCENE_B_ID;
      gonagi_position: string;
      dana_position: string;
      gonagi_region: string;
      dana_region: string;
    };
  };
  manual_test_procedure: {
    import_path: typeof SPATIAL_AB_TEST_OUTPUT_PATH;
    steps: string[];
    expected_difference: string[];
    expected_invariants: string[];
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function formatVec3(value: Vec3): string {
  return `[${value.map((entry) => entry.toFixed(4)).join(',')}]`;
}

function buildBaseScenario(
  sceneId: string,
  gonagiPosition: Vec3,
  danaPosition: Vec3,
  gonagiRegion: string,
  danaRegion: string
): string {
  return [
    `[SPATIAL_AB_TEST] scene_id=${sceneId} movie_id=titanic graph_id=titanic_spatial_ab_${sceneId}`,
    `[CAMERA_LANGUAGE] ${CAMERA_TYPE} camera_observes_character:framed_subject; camera_observes_character:framed_subject`,
    `[CAMERA_DISTANCE] ${CAMERA_DISTANCE.toFixed(4)} units label=medium_wide`,
    `[CAMERA_HEIGHT] ${CAMERA_HEIGHT}`,
    `[SHOT_TYPE] ${SHOT_TYPE}`,
    `[CAMERA_CONDITIONING] camera_type=${CAMERA_TYPE} position=${formatVec3(CAMERA_POSITION)} distance=${CAMERA_DISTANCE.toFixed(4)} framing_lock=hard`,
    `[CHARACTER_REGION] CHAR-gonagi region=${gonagiRegion} position=${formatVec3(gonagiPosition)} region_lock=hard; CHAR-dana region=${danaRegion} position=${formatVec3(danaPosition)} region_lock=hard`,
    `[BLOCKING] characters: CHAR-gonagi depth=midground position=${formatVec3(gonagiPosition)} rotation=${formatVec3(GONAGI_ROTATION)}; CHAR-dana depth=midground position=${formatVec3(danaPosition)} rotation=${formatVec3(DANA_ROTATION)} | interactions: CHAR-gonagi->CHAR-dana type=scene_blocking_pair`,
    `[GAZE] CHAR-gonagi->CHAR-dana origin=${formatVec3(gonagiPosition)} direction=${formatVec3(GAZE_DIRECTION_GONAGI)}; CHAR-dana->CHAR-gonagi origin=${formatVec3(danaPosition)} direction=${formatVec3(GAZE_DIRECTION_DANA)}`,
    `[FOREGROUND] layer_id=foreground depth_range=0-0.35 elements=suitcase_01`,
    `[MIDGROUND] layer_id=midground depth_range=0.35-0.7 elements=CHAR-gonagi, CHAR-dana`,
    `[BACKGROUND] layer_id=background depth_range=0.7-1 elements=grand_staircase`,
    `[ENVIRONMENT_ANCHOR] anchor_id=grand_staircase environment_type=interior_luxury scene_category=grand_staircase anchor_importance=critical anchor_position=center_background position=${formatVec3(ENV_POSITION)}`,
    `[PROP_ANCHOR] suitcase_01 depth=foreground region=LEFT_FOREGROUND position=${formatVec3(PROP_POSITION)} spatial_persistence=0.9100`,
    `[SEMANTIC_ANCHOR] semantic_anchor_id=grand_staircase scene_id=${sceneId} spatial_id=titanic_spatial_${sceneId}`,
    `[RECONSTRUCTION_OBJECTIVE] movie_reconstruction_accuracy_primary=true spatial_graph_conditioned_generation=true`,
  ].join(' ');
}

function buildConditionedScenario(
  sceneId: string,
  gonagiPosition: Vec3,
  danaPosition: Vec3,
  gonagiRegion: string,
  danaRegion: string
): string {
  const baseScenario = buildBaseScenario(
    sceneId,
    gonagiPosition,
    danaPosition,
    gonagiRegion,
    danaRegion
  );
  const runtimeGraph = runtimeSpatialGraphFromScenario(baseScenario);
  const bundle = buildSpatialConditioningBundle(runtimeGraph);
  return [
    baseScenario,
    ...bundle.generation_constraints,
    '[GENERATION_CONSTRAINT_PRIORITY] character_region>gaze_origin>depth_layer>camera_framing>environment_anchor>prop_persistence',
  ].join(' ');
}

function extractSection(scenario: string, start: string, end: string): string {
  const startIndex = scenario.indexOf(start);
  if (startIndex < 0) return '';
  const endIndex = scenario.indexOf(end, startIndex + start.length);
  if (endIndex < 0) return scenario.slice(startIndex);
  return scenario.slice(startIndex, endIndex);
}

function extractCharacterPosition(scenario: string, characterId: string): string | null {
  const blockingMatch = scenario.match(
    new RegExp(`${characterId} depth=midground position=(\\[[^\\]]+\\])`)
  )?.[1];
  if (blockingMatch) return blockingMatch;

  return (
    scenario.match(
      new RegExp(`${characterId} region=[A-Z_]+ position=(\\[[^\\]]+\\])`)
    )?.[1] ?? null
  );
}

function extractCharacterRegion(scenario: string, characterId: string): string | null {
  const explicitRegion = scenario.match(
    new RegExp(`\\[CHARACTER_REGION\\][^\\[]*${characterId} region=([A-Z_]+)`)
  )?.[1];
  if (explicitRegion) return explicitRegion;

  return scenario.match(new RegExp(`${characterId} region=([A-Z_]+)`))?.[1] ?? null;
}

function normalizeScenarioForStructureCompare(scenario: string): string {
  return scenario
    .replace(/scene_id=[^\s]+/g, 'scene_id=*')
    .replace(/graph_id=[^\s]+/g, 'graph_id=*')
    .replace(/spatial_id=[^\s]+/g, 'spatial_id=*')
    .replace(/position=\[[^\]]+\]/g, 'position=[*]')
    .replace(/origin=\[[^\]]+\]/g, 'origin=[*]')
    .replace(/direction=\[[^\]]+\]/g, 'direction=[*]')
    .replace(/screen_x=[^\s]+/g, 'screen_x=[*]')
    .replace(/screen_y=[^\s]+/g, 'screen_y=[*]')
    .replace(/region=(LEFT|RIGHT|CENTER_LEFT|CENTER_RIGHT|LEFT_FOREGROUND)/g, 'region=[*]');
}

export function buildSpatialAbTestImport(root: string): SpatialAbTestImportDataset {
  const artStyle = copyApprovedOriginalArtStyle(root);
  const timeSetting = copyApprovedOriginalTimeSettingPrompt('warm_golden_hour', root);
  const character = copyApprovedOriginalCharacterField(['gonegi', 'dana'], root);

  const scenarioA = buildConditionedScenario(
    SCENE_A_ID,
    GONAGI_POSITION_A,
    DANA_POSITION_A,
    'LEFT',
    'RIGHT'
  );
  const scenarioB = buildConditionedScenario(
    SCENE_B_ID,
    GONAGI_POSITION_B,
    DANA_POSITION_B,
    'RIGHT',
    'LEFT'
  );

  return {
    native_import_id: 'titanic-spatial-ab-test',
    phase: SPATIAL_AB_TEST_PHASE,
    system_id: SPATIAL_AB_TEST_SYSTEM_ID,
    version: 'spatial_ab_v1',
    movie_id: 'titanic',
    approved_originals_manifest_ref: APPROVED_ORIGINALS_MANIFEST_PATH,
    approved_originals_artstyle_ref: ARTSTYLE_APPROVED_PATH,
    approved_originals_character_ref: CHARACTER_APPROVED_PATH,
    approved_originals_timesetting_ref: TIMESETTING_APPROVED_PATH,
    generated_at: new Date().toISOString(),
    slot_count: 2,
    ab_test: {
      test_type: 'spatial_character_position_swap',
      scene_a_index: 0,
      scene_b_index: 1,
      scene_a_id: SCENE_A_ID,
      scene_b_id: SCENE_B_ID,
    },
    music_drama_import_ready: true,
    slots: [
      {
        scene_id: SCENE_A_ID,
        ab_test_variant: 'A',
        artStyle,
        timeSetting,
        scenario: scenarioA,
        character,
      },
      {
        scene_id: SCENE_B_ID,
        ab_test_variant: 'B',
        artStyle,
        timeSetting,
        scenario: scenarioB,
        character,
      },
    ],
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function runSpatialAbTestValidation(projectRoot?: string): SpatialAbTestReport {
  const root = resolveProjectRoot(projectRoot);
  const dataset = buildSpatialAbTestImport(root);
  writeJson(root, SPATIAL_AB_TEST_OUTPUT_PATH, dataset);

  const issues: SpatialAbTestReport['issues'] = [];
  const slotA = dataset.slots[0];
  const slotB = dataset.slots[1];

  const gonagiA = extractCharacterPosition(slotA.scenario, 'CHAR-gonagi');
  const danaA = extractCharacterPosition(slotA.scenario, 'CHAR-dana');
  const gonagiB = extractCharacterPosition(slotB.scenario, 'CHAR-gonagi');
  const danaB = extractCharacterPosition(slotB.scenario, 'CHAR-dana');

  const character_positions_differ =
    gonagiA !== gonagiB &&
    danaA !== danaB &&
    gonagiA === formatVec3(GONAGI_POSITION_A) &&
    danaA === formatVec3(DANA_POSITION_A) &&
    gonagiB === formatVec3(GONAGI_POSITION_B) &&
    danaB === formatVec3(DANA_POSITION_B);

  const environment_identical =
    extractSection(slotA.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]') ===
    extractSection(slotB.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]');

  const prop_identical =
    extractSection(slotA.scenario, '[PROP_ANCHOR]', '[SEMANTIC_ANCHOR]') ===
    extractSection(slotB.scenario, '[PROP_ANCHOR]', '[SEMANTIC_ANCHOR]');

  const camera_identical =
    extractSection(slotA.scenario, '[CAMERA_LANGUAGE]', '[CHARACTER_REGION]') ===
      extractSection(slotB.scenario, '[CAMERA_LANGUAGE]', '[CHARACTER_REGION]') &&
    extractSection(slotA.scenario, '[CAMERA_CONDITIONING]', '[CHARACTER_REGION]') ===
      extractSection(slotB.scenario, '[CAMERA_CONDITIONING]', '[CHARACTER_REGION]');

  const timeSetting_identical = slotA.timeSetting === slotB.timeSetting;
  const artStyle_identical = slotA.artStyle === slotB.artStyle;
  const character_dna_identical = slotA.character === slotB.character;

  const scenario_structure_identical =
    normalizeScenarioForStructureCompare(slotA.scenario) ===
    normalizeScenarioForStructureCompare(slotB.scenario);

  const character_swap_only =
    character_positions_differ &&
    environment_identical &&
    prop_identical &&
    camera_identical &&
    timeSetting_identical &&
    artStyle_identical &&
    character_dna_identical &&
    scenario_structure_identical;

  if (!character_positions_differ) {
    issues.push({
      code: 'CHARACTER_POSITIONS_NOT_DIFFERENT',
      message: 'Scene A and B must differ only by swapped character horizontal positions',
      severity: 'error',
    });
  }

  if (!environment_identical) {
    issues.push({
      code: 'ENVIRONMENT_NOT_LOCKED',
      message: 'Environment anchor must be identical between Scene A and Scene B',
      severity: 'error',
    });
  }

  if (!prop_identical) {
    issues.push({
      code: 'PROP_NOT_LOCKED',
      message: 'Prop anchor must be identical between Scene A and Scene B',
      severity: 'error',
    });
  }

  if (!camera_identical) {
    issues.push({
      code: 'CAMERA_NOT_LOCKED',
      message: 'Camera conditioning must be identical between Scene A and Scene B',
      severity: 'error',
    });
  }

  if (!character_dna_identical || !artStyle_identical || !timeSetting_identical) {
    issues.push({
      code: 'SHARED_FIELDS_CHANGED',
      message: 'artStyle, timeSetting, and character DNA must be identical across both scenes',
      severity: 'error',
    });
  }

  const ab_test_ready = fs.existsSync(path.join(root, SPATIAL_AB_TEST_OUTPUT_PATH));
  const scene_count = dataset.slots.length;
  const environment_locked = environment_identical;
  const prop_locked = prop_identical;
  const camera_locked = camera_identical;
  const ready_for_manual_image_generation =
    ab_test_ready && character_swap_only && scene_count === 2;

  const validation_passed =
    ab_test_ready &&
    scene_count === 2 &&
    character_swap_only &&
    environment_locked &&
    prop_locked &&
    camera_locked &&
    ready_for_manual_image_generation &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `spatial_ab_test_report_${Date.now().toString(36)}`,
    phase: SPATIAL_AB_TEST_PHASE,
    system_id: SPATIAL_AB_TEST_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed ? SPATIAL_AB_TEST_PASS_VERDICT : SPATIAL_AB_TEST_FAIL_VERDICT,
    validation_passed,
    ab_test_ready,
    scene_count,
    character_swap_only,
    environment_locked,
    prop_locked,
    camera_locked,
    ready_for_manual_image_generation,
    output_path: SPATIAL_AB_TEST_OUTPUT_PATH,
    checks: {
      character_positions_differ,
      environment_identical,
      prop_identical,
      camera_identical,
      timeSetting_identical,
      artStyle_identical,
      character_dna_identical,
      scenario_structure_identical,
    },
    scene_summary: {
      scene_a: {
        scene_id: SCENE_A_ID,
        gonagi_position: gonagiA ?? 'missing',
        dana_position: danaA ?? 'missing',
        gonagi_region: extractCharacterRegion(slotA.scenario, 'CHAR-gonagi') ?? 'missing',
        dana_region: extractCharacterRegion(slotA.scenario, 'CHAR-dana') ?? 'missing',
      },
      scene_b: {
        scene_id: SCENE_B_ID,
        gonagi_position: gonagiB ?? 'missing',
        dana_position: danaB ?? 'missing',
        gonagi_region: extractCharacterRegion(slotB.scenario, 'CHAR-gonagi') ?? 'missing',
        dana_region: extractCharacterRegion(slotB.scenario, 'CHAR-dana') ?? 'missing',
      },
    },
    manual_test_procedure: {
      import_path: SPATIAL_AB_TEST_OUTPUT_PATH,
      steps: [
        `Import ${SPATIAL_AB_TEST_OUTPUT_PATH} into Image App.`,
        'Generate slot 0 (Scene A) and save output as spatial-ab-scene-A.png.',
        'Generate slot 1 (Scene B) and save output as spatial-ab-scene-B.png.',
        'Compare outputs: Gonegi/Dana should swap left-right; staircase, suitcase, and camera framing should remain unchanged.',
      ],
      expected_difference: [
        'Gonegi moves from LEFT to RIGHT',
        'Dana moves from RIGHT to LEFT',
      ],
      expected_invariants: [
        'grand_staircase environment unchanged',
        'suitcase_01 prop unchanged',
        'eye_level_medium_wide camera unchanged',
      ],
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSpatialAbTestReport(projectRoot?: string): SpatialAbTestReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSpatialAbTestValidation(root);
  writeJson(root, SPATIAL_AB_TEST_REPORT_PATH, report);
  return report;
}
