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

export const ENV_LOCK_AB_TEST_PHASE = 'PHASE-IMAGE-APP-ENVLOCK-AB-001' as const;
export const ENV_LOCK_AB_TEST_SYSTEM_ID = 'ENVIRONMENT_LOCK_AB_TEST_V1' as const;
export const ENV_LOCK_AB_TEST_PASS_VERDICT = 'PASS_ENVLOCK_AB_IMPORT_FORMAT_FIX_V1' as const;
export const ENV_LOCK_AB_TEST_FAIL_VERDICT = 'FAIL_ENVLOCK_AB_IMPORT_FORMAT_FIX_V1' as const;

export const ENV_LOCK_AB_TEST_OUTPUT_PATH =
  `${MOVIE_SPATIAL_TEST_DIR}/environment-lock-ab-test.json` as const;

export const ENV_LOCK_AB_TEST_REPORT_PATH =
  'reports/movie_spatial/ENV_LOCK_AB_TEST_REPORT.json' as const;

export const SCENE_A_ID = 'env_lock_test_A' as const;
export const SCENE_B_ID = 'env_lock_test_B' as const;

const GONAGI_POSITION_A: Vec3 = [0.25, 0.5, 1.6];
const DANA_POSITION_A: Vec3 = [0.75, 0.5, 1.6];
const GONAGI_POSITION_B: Vec3 = [0.75, 0.5, 1.6];
const DANA_POSITION_B: Vec3 = [0.25, 0.5, 1.6];

const ENV_ANCHOR_POSITION: Vec3 = [0.5, 0.5, 3.5];
const PROP_POSITION: Vec3 = [0.15, 0.75, 1.1];
const CAMERA_POSITION: Vec3 = [0.5, 0.5, 0];
const CAMERA_ROTATION: Vec3 = [0, 0, 0];

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

export interface EnvLockAbTestImportDataset {
  native_import_id: string;
  phase: typeof ENV_LOCK_AB_TEST_PHASE;
  system_id: typeof ENV_LOCK_AB_TEST_SYSTEM_ID;
  version: 'envlock_ab_v1';
  movie_id: 'titanic';
  approved_originals_manifest_ref: typeof APPROVED_ORIGINALS_MANIFEST_PATH;
  approved_originals_artstyle_ref: typeof ARTSTYLE_APPROVED_PATH;
  approved_originals_character_ref: typeof CHARACTER_APPROVED_PATH;
  approved_originals_timesetting_ref: typeof TIMESETTING_APPROVED_PATH;
  generated_at: string;
  slot_count: 2;
  ab_test: {
    test_type: 'environment_lock_character_position_swap';
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

export interface EnvLockAbTestReport {
  report_id: string;
  phase: typeof ENV_LOCK_AB_TEST_PHASE;
  system_id: typeof ENV_LOCK_AB_TEST_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  import_format_valid: boolean;
  character_swap: boolean;
  environment_lock: boolean;
  prop_lock: boolean;
  camera_lock: boolean;
  output_path: typeof ENV_LOCK_AB_TEST_OUTPUT_PATH;
  checks: {
    root_slots_exists: boolean;
    slots_length_two: boolean;
    slot_fields_complete: boolean;
    scene_a_root_key_absent: boolean;
    scene_b_root_key_absent: boolean;
    scene_a_gonagi_left_dana_right: boolean;
    scene_b_gonagi_right_dana_left: boolean;
    character_positions_differ: boolean;
    grand_staircase_center_background: boolean;
    suitcase_left_foreground: boolean;
    staircase_present_both: boolean;
    suitcase_present_both: boolean;
    environment_identical: boolean;
    environment_type_unchanged: boolean;
    prop_identical: boolean;
    camera_identical: boolean;
    timeSetting_identical: boolean;
    artStyle_identical: boolean;
    character_dna_identical: boolean;
    scenario_structure_identical: boolean;
  };
  scene_summary: {
    scene_a: { gonagi_position: string; dana_position: string; gonagi_region: string; dana_region: string };
    scene_b: { gonagi_position: string; dana_position: string; gonagi_region: string; dana_region: string };
  };
  fail_conditions: {
    staircase_moved: boolean;
    staircase_disappeared: boolean;
    suitcase_moved: boolean;
    suitcase_disappeared: boolean;
    indoor_outdoor_changed: boolean;
    camera_changed: boolean;
    character_swap_failed: boolean;
    invalid_import_format: boolean;
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
  gonagiRegion: 'LEFT' | 'RIGHT',
  danaRegion: 'LEFT' | 'RIGHT'
): string {
  return [
    `[ENV_LOCK_AB_TEST] scene_id=${sceneId} movie_id=titanic graph_id=titanic_envlock_ab_${sceneId}`,
    `[CAMERA_LANGUAGE] eye_level wide_shot camera_observes_character:framed_subject`,
    `[CAMERA_HEIGHT] eye_level`,
    `[SHOT_TYPE] wide_shot`,
    `[CAMERA_CONDITIONING] camera_height=eye_level shot_type=wide_shot position=${formatVec3(CAMERA_POSITION)} rotation=${formatVec3(CAMERA_ROTATION)} framing_lock=hard`,
    `[CHARACTER_REGION] CHAR-gonagi region=${gonagiRegion} position=${formatVec3(gonagiPosition)} region_lock=hard; CHAR-dana region=${danaRegion} position=${formatVec3(danaPosition)} region_lock=hard`,
    `[BLOCKING] characters: CHAR-gonagi depth=midground position=${formatVec3(gonagiPosition)} rotation=${formatVec3(GONAGI_ROTATION)}; CHAR-dana depth=midground position=${formatVec3(danaPosition)} rotation=${formatVec3(DANA_ROTATION)} | interactions: CHAR-gonagi->CHAR-dana type=scene_blocking_pair`,
    `[GAZE] CHAR-gonagi->CHAR-dana origin=${formatVec3(gonagiPosition)} direction=${formatVec3(GAZE_DIRECTION_GONAGI)}; CHAR-dana->CHAR-gonagi origin=${formatVec3(danaPosition)} direction=${formatVec3(GAZE_DIRECTION_DANA)}`,
    `[FOREGROUND] layer_id=foreground depth_range=0-0.35 elements=suitcase_01`,
    `[MIDGROUND] layer_id=midground depth_range=0.35-0.7 elements=CHAR-gonagi, CHAR-dana`,
    `[BACKGROUND] layer_id=background depth_range=0.7-1 elements=grand_staircase_01`,
    `[ENVIRONMENT_ANCHOR] anchor_id=grand_staircase_01 anchor_type=staircase anchor_importance=critical anchor_position=center_background anchor_persistence=persistent anchor_visibility=always_visible environment_type=interior_luxury position=${formatVec3(ENV_ANCHOR_POSITION)}`,
    `[PROP_ANCHOR] prop_id=suitcase_01 prop_type=vintage_suitcase prop_position=left_foreground prop_importance=critical prop_persistence=persistent region=LEFT_FOREGROUND position=${formatVec3(PROP_POSITION)}`,
    `[RECONSTRUCTION_OBJECTIVE] movie_reconstruction_accuracy_primary=true environment_lock_ab_test=true`,
  ].join(' ');
}

function buildConditionedScenario(
  sceneId: string,
  gonagiPosition: Vec3,
  danaPosition: Vec3,
  gonagiRegion: 'LEFT' | 'RIGHT',
  danaRegion: 'LEFT' | 'RIGHT'
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
    .replace(/position=\[[^\]]+\]/g, 'position=[*]')
    .replace(/origin=\[[^\]]+\]/g, 'origin=[*]')
    .replace(/direction=\[[^\]]+\]/g, 'direction=[*]')
    .replace(/screen_x=[^\s]+/g, 'screen_x=[*]')
    .replace(/screen_y=[^\s]+/g, 'screen_y=[*]')
    .replace(/region=(LEFT|RIGHT|CENTER_LEFT|CENTER_RIGHT|LEFT_FOREGROUND)/g, 'region=[*]');
}

function slotHasRequiredFields(
  slot: unknown
): slot is ImageAppNativeImportSlot {
  if (!slot || typeof slot !== 'object') return false;
  const record = slot as Record<string, unknown>;
  return (
    typeof record.artStyle === 'string' &&
    typeof record.timeSetting === 'string' &&
    typeof record.scenario === 'string' &&
    typeof record.character === 'string'
  );
}

export function buildEnvLockAbTestImport(root: string): EnvLockAbTestImportDataset {
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
    native_import_id: 'environment-lock-ab-test',
    phase: ENV_LOCK_AB_TEST_PHASE,
    system_id: ENV_LOCK_AB_TEST_SYSTEM_ID,
    version: 'envlock_ab_v1',
    movie_id: 'titanic',
    approved_originals_manifest_ref: APPROVED_ORIGINALS_MANIFEST_PATH,
    approved_originals_artstyle_ref: ARTSTYLE_APPROVED_PATH,
    approved_originals_character_ref: CHARACTER_APPROVED_PATH,
    approved_originals_timesetting_ref: TIMESETTING_APPROVED_PATH,
    generated_at: new Date().toISOString(),
    slot_count: 2,
    ab_test: {
      test_type: 'environment_lock_character_position_swap',
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

export function runEnvLockAbTestValidation(projectRoot?: string): EnvLockAbTestReport {
  const root = resolveProjectRoot(projectRoot);
  const dataset = buildEnvLockAbTestImport(root);
  writeJson(root, ENV_LOCK_AB_TEST_OUTPUT_PATH, dataset);

  const issues: EnvLockAbTestReport['issues'] = [];
  const rawOutput = JSON.parse(
    fs.readFileSync(path.join(root, ENV_LOCK_AB_TEST_OUTPUT_PATH), 'utf8')
  ) as Record<string, unknown>;

  const root_slots_exists = Array.isArray(rawOutput.slots);
  const slots_length_two = root_slots_exists && rawOutput.slots.length === 2;
  const slot_fields_complete =
    slots_length_two &&
    (rawOutput.slots as unknown[]).every((slot) => slotHasRequiredFields(slot));
  const scene_a_root_key_absent = !Object.prototype.hasOwnProperty.call(rawOutput, 'SCENE_A');
  const scene_b_root_key_absent = !Object.prototype.hasOwnProperty.call(rawOutput, 'SCENE_B');
  const import_format_valid =
    root_slots_exists &&
    slots_length_two &&
    slot_fields_complete &&
    scene_a_root_key_absent &&
    scene_b_root_key_absent;

  if (!root_slots_exists) {
    issues.push({
      code: 'MISSING_ROOT_SLOTS',
      message: 'Root object must contain a slots array for Music Drama import',
      severity: 'error',
    });
  }
  if (!slots_length_two) {
    issues.push({
      code: 'INVALID_SLOT_COUNT',
      message: 'slots array must contain exactly 2 entries',
      severity: 'error',
    });
  }
  if (!slot_fields_complete) {
    issues.push({
      code: 'INCOMPLETE_SLOT_FIELDS',
      message: 'Each slot must include artStyle, timeSetting, scenario, and character',
      severity: 'error',
    });
  }
  if (!scene_a_root_key_absent || !scene_b_root_key_absent) {
    issues.push({
      code: 'LEGACY_SCENE_KEYS_PRESENT',
      message: 'Root object must not contain SCENE_A or SCENE_B keys',
      severity: 'error',
    });
  }

  const slotA = dataset.slots[0];
  const slotB = dataset.slots[1];

  const gonagiA = extractCharacterPosition(slotA.scenario, 'CHAR-gonagi');
  const danaA = extractCharacterPosition(slotA.scenario, 'CHAR-dana');
  const gonagiB = extractCharacterPosition(slotB.scenario, 'CHAR-gonagi');
  const danaB = extractCharacterPosition(slotB.scenario, 'CHAR-dana');

  const gonagiRegionA = extractCharacterRegion(slotA.scenario, 'CHAR-gonagi');
  const danaRegionA = extractCharacterRegion(slotA.scenario, 'CHAR-dana');
  const gonagiRegionB = extractCharacterRegion(slotB.scenario, 'CHAR-gonagi');
  const danaRegionB = extractCharacterRegion(slotB.scenario, 'CHAR-dana');

  const scene_a_gonagi_left_dana_right =
    gonagiRegionA === 'LEFT' &&
    danaRegionA === 'RIGHT' &&
    gonagiA === formatVec3(GONAGI_POSITION_A) &&
    danaA === formatVec3(DANA_POSITION_A);

  const scene_b_gonagi_right_dana_left =
    gonagiRegionB === 'RIGHT' &&
    danaRegionB === 'LEFT' &&
    gonagiB === formatVec3(GONAGI_POSITION_B) &&
    danaB === formatVec3(DANA_POSITION_B);

  const character_positions_differ =
    gonagiA !== gonagiB &&
    danaA !== danaB &&
    scene_a_gonagi_left_dana_right &&
    scene_b_gonagi_right_dana_left;

  const envSectionA = extractSection(slotA.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]');
  const envSectionB = extractSection(slotB.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]');
  const propSectionA = extractSection(slotA.scenario, '[PROP_ANCHOR]', '[RECONSTRUCTION_OBJECTIVE]');
  const propSectionB = extractSection(slotB.scenario, '[PROP_ANCHOR]', '[RECONSTRUCTION_OBJECTIVE]');

  const environment_identical = envSectionA === envSectionB;
  const prop_identical = propSectionA === propSectionB;

  const camera_identical =
    extractSection(slotA.scenario, '[CAMERA_LANGUAGE]', '[CHARACTER_REGION]') ===
      extractSection(slotB.scenario, '[CAMERA_LANGUAGE]', '[CHARACTER_REGION]') &&
    extractSection(slotA.scenario, '[CAMERA_CONDITIONING]', '[CHARACTER_REGION]') ===
      extractSection(slotB.scenario, '[CAMERA_CONDITIONING]', '[CHARACTER_REGION]');

  const environment_type_unchanged =
    envSectionA.includes('environment_type=interior_luxury') &&
    envSectionB.includes('environment_type=interior_luxury');

  const grand_staircase_center_background =
    envSectionA.includes('anchor_id=grand_staircase_01') &&
    envSectionA.includes('anchor_position=center_background') &&
    envSectionA.includes('anchor_visibility=always_visible') &&
    envSectionA.includes('anchor_persistence=persistent') &&
    envSectionB.includes('anchor_id=grand_staircase_01') &&
    envSectionB.includes('anchor_position=center_background') &&
    envSectionB.includes('anchor_visibility=always_visible') &&
    envSectionB.includes('anchor_persistence=persistent');

  const suitcase_left_foreground =
    propSectionA.includes('prop_id=suitcase_01') &&
    propSectionA.includes('prop_position=left_foreground') &&
    propSectionA.includes('prop_importance=critical') &&
    propSectionA.includes('prop_persistence=persistent') &&
    propSectionA.includes('region=LEFT_FOREGROUND') &&
    propSectionB.includes('prop_id=suitcase_01') &&
    propSectionB.includes('prop_position=left_foreground') &&
    propSectionB.includes('prop_importance=critical') &&
    propSectionB.includes('prop_persistence=persistent') &&
    propSectionB.includes('region=LEFT_FOREGROUND');

  const staircase_present_both =
    slotA.scenario.includes('grand_staircase_01') && slotB.scenario.includes('grand_staircase_01');

  const suitcase_present_both =
    slotA.scenario.includes('suitcase_01') && slotB.scenario.includes('suitcase_01');

  const timeSetting_identical = slotA.timeSetting === slotB.timeSetting;
  const artStyle_identical = slotA.artStyle === slotB.artStyle;
  const character_dna_identical = slotA.character === slotB.character;

  const scenario_structure_identical =
    normalizeScenarioForStructureCompare(slotA.scenario) ===
    normalizeScenarioForStructureCompare(slotB.scenario);

  const character_swap = character_positions_differ;
  const environment_lock = environment_identical && grand_staircase_center_background && environment_type_unchanged;
  const prop_lock = prop_identical && suitcase_left_foreground;
  const camera_lock = camera_identical;

  const staircase_moved = !grand_staircase_center_background;
  const staircase_disappeared = !staircase_present_both;
  const suitcase_moved = !suitcase_left_foreground || !prop_identical;
  const suitcase_disappeared = !suitcase_present_both;
  const indoor_outdoor_changed = !environment_type_unchanged;
  const camera_changed = !camera_identical;
  const character_swap_failed = !character_swap;
  const invalid_import_format = !import_format_valid;

  if (character_swap_failed) {
    issues.push({
      code: 'CHARACTER_SWAP_FAILED',
      message: 'Scene A must have Gonagi LEFT / Dana RIGHT; Scene B must swap positions',
      severity: 'error',
    });
  }
  if (staircase_moved) {
    issues.push({
      code: 'STAIRCASE_MOVED',
      message: 'grand_staircase_01 must remain at center_background in both scenes',
      severity: 'error',
    });
  }
  if (staircase_disappeared) {
    issues.push({
      code: 'STAIRCASE_DISAPPEARED',
      message: 'grand_staircase_01 anchor must be present in both scenes',
      severity: 'error',
    });
  }
  if (suitcase_moved) {
    issues.push({
      code: 'SUITCASE_MOVED',
      message: 'suitcase_01 must remain at left_foreground in both scenes',
      severity: 'error',
    });
  }
  if (suitcase_disappeared) {
    issues.push({
      code: 'SUITCASE_DISAPPEARED',
      message: 'suitcase_01 prop must be present in both scenes',
      severity: 'error',
    });
  }
  if (indoor_outdoor_changed) {
    issues.push({
      code: 'INDOOR_OUTDOOR_CHANGED',
      message: 'environment_type must remain interior_luxury in both scenes',
      severity: 'error',
    });
  }
  if (camera_changed) {
    issues.push({
      code: 'CAMERA_CHANGED',
      message: 'Camera eye_level wide_shot settings must be identical between scenes',
      severity: 'error',
    });
  }
  if (!timeSetting_identical || !artStyle_identical || !character_dna_identical) {
    issues.push({
      code: 'SHARED_FIELDS_CHANGED',
      message: 'artStyle, timeSetting, and character DNA must be identical across both scenes',
      severity: 'error',
    });
  }
  if (!scenario_structure_identical) {
    issues.push({
      code: 'SCENARIO_STRUCTURE_CHANGED',
      message: 'Scenario structure must differ only by character position swap',
      severity: 'error',
    });
  }

  const validation_passed =
    import_format_valid &&
    character_swap &&
    environment_lock &&
    prop_lock &&
    camera_lock &&
    timeSetting_identical &&
    artStyle_identical &&
    character_dna_identical &&
    scenario_structure_identical &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `env_lock_ab_test_report_${Date.now().toString(36)}`,
    phase: ENV_LOCK_AB_TEST_PHASE,
    system_id: ENV_LOCK_AB_TEST_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed ? ENV_LOCK_AB_TEST_PASS_VERDICT : ENV_LOCK_AB_TEST_FAIL_VERDICT,
    validation_passed,
    import_format_valid,
    character_swap,
    environment_lock,
    prop_lock,
    camera_lock,
    output_path: ENV_LOCK_AB_TEST_OUTPUT_PATH,
    checks: {
      root_slots_exists,
      slots_length_two,
      slot_fields_complete,
      scene_a_root_key_absent,
      scene_b_root_key_absent,
      scene_a_gonagi_left_dana_right,
      scene_b_gonagi_right_dana_left,
      character_positions_differ,
      grand_staircase_center_background,
      suitcase_left_foreground,
      staircase_present_both,
      suitcase_present_both,
      environment_identical,
      environment_type_unchanged,
      prop_identical,
      camera_identical,
      timeSetting_identical,
      artStyle_identical,
      character_dna_identical,
      scenario_structure_identical,
    },
    scene_summary: {
      scene_a: {
        gonagi_position: gonagiA ?? 'missing',
        dana_position: danaA ?? 'missing',
        gonagi_region: gonagiRegionA ?? 'missing',
        dana_region: danaRegionA ?? 'missing',
      },
      scene_b: {
        gonagi_position: gonagiB ?? 'missing',
        dana_position: danaB ?? 'missing',
        gonagi_region: gonagiRegionB ?? 'missing',
        dana_region: danaRegionB ?? 'missing',
      },
    },
    fail_conditions: {
      staircase_moved,
      staircase_disappeared,
      suitcase_moved,
      suitcase_disappeared,
      indoor_outdoor_changed,
      camera_changed,
      character_swap_failed,
      invalid_import_format,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeEnvLockAbTestReport(projectRoot?: string): EnvLockAbTestReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runEnvLockAbTestValidation(root);
  writeJson(root, ENV_LOCK_AB_TEST_REPORT_PATH, report);
  return report;
}
