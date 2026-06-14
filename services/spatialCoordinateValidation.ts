import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_SPATIAL_TEST_DIR } from './generationOutputPaths.js';
import { MovieImageAppNativeImportV8Dataset } from './movieImageAppNativeImportBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SPATIAL_COORDINATE_VALIDATION_PHASE = 'PHASE-MOVIE-SPATIAL-015' as const;
export const SPATIAL_COORDINATE_VALIDATION_SYSTEM_ID =
  'SPATIAL_COORDINATE_VALIDATION_V1' as const;
export const SPATIAL_COORDINATE_VALIDATION_PASS_VERDICT =
  'PASS_SPATIAL_COORDINATE_VALIDATION_V1' as const;
export const SPATIAL_COORDINATE_VALIDATION_FAIL_VERDICT =
  'FAIL_SPATIAL_COORDINATE_VALIDATION_V1' as const;

export const SPATIAL_COORDINATE_VALIDATION_REPORT_PATH =
  'reports/movie_spatial/SPATIAL_COORDINATE_VALIDATION_REPORT.json' as const;

export const SPATIAL_COORDINATE_SOURCE_PATH =
  `${MOVIE_SPATIAL_TEST_DIR}/titanic-test-1scene.json` as const;

export const SPATIAL_COORDINATE_TEST_A_PATH =
  `${MOVIE_SPATIAL_TEST_DIR}/titanic-coordinate-test-A.json` as const;

export const SPATIAL_COORDINATE_TEST_B_PATH =
  `${MOVIE_SPATIAL_TEST_DIR}/titanic-coordinate-test-B.json` as const;

export const COORDINATE_TEST_CHARACTER_POSITIONS = {
  gonagi: '[0.4200,0.4850,1.6000]',
  dana: '[0.5800,0.4850,1.6800]',
} as const;

const PRESERVED_SCENARIO_SECTIONS = [
  '[CAMERA_LANGUAGE]',
  '[CAMERA_DISTANCE]',
  '[CAMERA_HEIGHT]',
  '[SHOT_TYPE]',
  '[ENVIRONMENT_ANCHOR]',
  '[PROP_ANCHOR]',
  '[SEMANTIC_ANCHOR]',
  '[REPLICA_PRESERVATION]',
] as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export interface CoordinateCharacterPositions {
  gonagi_blocking_position: string | null;
  dana_blocking_position: string | null;
  gonagi_gaze_origin: string | null;
  dana_gaze_origin: string | null;
}

export interface SpatialCoordinateValidationReport {
  report_id: string;
  phase: typeof SPATIAL_COORDINATE_VALIDATION_PHASE;
  system_id: typeof SPATIAL_COORDINATE_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  coordinate_test_created: boolean;
  test_a_created: boolean;
  test_b_created: boolean;
  position_swap_applied: boolean;
  all_other_fields_identical: boolean;
  ready_for_manual_image_app_test: boolean;
  source_path: typeof SPATIAL_COORDINATE_SOURCE_PATH;
  test_a_path: typeof SPATIAL_COORDINATE_TEST_A_PATH;
  test_b_path: typeof SPATIAL_COORDINATE_TEST_B_PATH;
  coordinate_test: {
    test_a: {
      char_gonagi_position: string;
      char_dana_position: string;
    };
    test_b: {
      char_gonagi_position: string;
      char_dana_position: string;
    };
    expected_mirror: true;
  };
  preserved_fields: {
    artStyle: boolean;
    timeSetting: boolean;
    character: boolean;
    camera_language: boolean;
    environment_anchor: boolean;
    semantic_anchor: boolean;
    gaze_direction: boolean;
    shot_type: boolean;
  };
  manual_test_procedure: {
    title: string;
    steps: string[];
    expected_visual_difference: string[];
    expected_visual_invariants: string[];
  };
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function extractSection(scenario: string, startMarker: string, endMarker: string | null): string {
  const start = scenario.indexOf(startMarker);
  if (start < 0) return '';
  if (!endMarker) return scenario.slice(start);
  const end = scenario.indexOf(endMarker, start + startMarker.length);
  if (end < 0) return scenario.slice(start);
  return scenario.slice(start, end);
}

function extractCharacterPositions(scenario: string): CoordinateCharacterPositions {
  const gonagiBlocking = scenario.match(
    /CHAR-gonagi depth=midground position=(\[[^\]]+\])/
  )?.[1] ?? null;
  const danaBlocking = scenario.match(
    /CHAR-dana depth=midground position=(\[[^\]]+\])/
  )?.[1] ?? null;
  const gonagiGaze = scenario.match(
    /CHAR-gonagi->CHAR-dana origin=(\[[^\]]+\])/
  )?.[1] ?? null;
  const danaGaze = scenario.match(
    /CHAR-dana->CHAR-gonagi origin=(\[[^\]]+\])/
  )?.[1] ?? null;

  return {
    gonagi_blocking_position: gonagiBlocking,
    dana_blocking_position: danaBlocking,
    gonagi_gaze_origin: gonagiGaze,
    dana_gaze_origin: danaGaze,
  };
}

function swapCharacterPositionsInScenario(scenario: string): string {
  const gonagiPos = COORDINATE_TEST_CHARACTER_POSITIONS.gonagi;
  const danaPos = COORDINATE_TEST_CHARACTER_POSITIONS.dana;
  const gonagiMarker = '__COORD_GONAGI__';
  const danaMarker = '__COORD_DANA__';

  let swapped = scenario;
  swapped = swapped.replaceAll(`position=${gonagiPos}`, `position=${gonagiMarker}`);
  swapped = swapped.replaceAll(`origin=${gonagiPos}`, `origin=${gonagiMarker}`);
  swapped = swapped.replaceAll(`position=${danaPos}`, `position=${gonagiPos}`);
  swapped = swapped.replaceAll(`origin=${danaPos}`, `origin=${gonagiPos}`);
  swapped = swapped.replaceAll(`position=${gonagiMarker}`, `position=${danaPos}`);
  swapped = swapped.replaceAll(`origin=${gonagiMarker}`, `origin=${danaPos}`);

  return swapped;
}

function buildCoordinateTestDataset(
  source: MovieImageAppNativeImportV8Dataset,
  testId: 'A' | 'B'
): MovieImageAppNativeImportV8Dataset {
  const sourceSlot = source.slots[0];
  if (!sourceSlot) {
    throw new Error('Source coordinate test pack must contain one slot');
  }

  const scenario =
    testId === 'A'
      ? sourceSlot.scenario
      : swapCharacterPositionsInScenario(sourceSlot.scenario);

  return {
    ...source,
    native_import_id: `titanic-coordinate-test-${testId}`,
    generated_at: new Date().toISOString(),
    slot_count: 1,
    slots: [
      {
        artStyle: sourceSlot.artStyle,
        timeSetting: sourceSlot.timeSetting,
        scenario,
        character: sourceSlot.character,
      },
    ],
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

function comparePreservedScenarioSections(scenarioA: string, scenarioB: string): boolean {
  for (const marker of PRESERVED_SCENARIO_SECTIONS) {
    const sectionA = extractSection(
      scenarioA,
      marker,
      PRESERVED_SCENARIO_SECTIONS[PRESERVED_SCENARIO_SECTIONS.indexOf(marker) + 1] ?? null
    );
    const sectionB = extractSection(
      scenarioB,
      marker,
      PRESERVED_SCENARIO_SECTIONS[PRESERVED_SCENARIO_SECTIONS.indexOf(marker) + 1] ?? null
    );
    if (sectionA !== sectionB) {
      return false;
    }
  }
  return true;
}

function extractGazeDirections(scenario: string): string {
  const gazeSection = extractSection(scenario, '[GAZE]', '[FOREGROUND]');
  return gazeSection.replace(/origin=\[[^\]]+\]/g, 'origin=[*]');
}

function validateCoordinateTests(
  testA: MovieImageAppNativeImportV8Dataset,
  testB: MovieImageAppNativeImportV8Dataset,
  source: MovieImageAppNativeImportV8Dataset
): {
  position_swap_applied: boolean;
  all_other_fields_identical: boolean;
  preserved_fields: SpatialCoordinateValidationReport['preserved_fields'];
  issues: SpatialCoordinateValidationReport['issues'];
} {
  const issues: SpatialCoordinateValidationReport['issues'] = [];
  const slotA = testA.slots[0];
  const slotB = testB.slots[0];
  const sourceSlot = source.slots[0];

  if (!slotA || !slotB || !sourceSlot) {
    issues.push({
      code: 'COORDINATE_TEST_SLOT_MISSING',
      message: 'Coordinate test A/B/source must each contain one slot',
      severity: 'error',
    });
    return {
      position_swap_applied: false,
      all_other_fields_identical: false,
      preserved_fields: {
        artStyle: false,
        timeSetting: false,
        character: false,
        camera_language: false,
        environment_anchor: false,
        semantic_anchor: false,
        gaze_direction: false,
        shot_type: false,
      },
      issues,
    };
  }

  const positionsA = extractCharacterPositions(slotA.scenario);
  const positionsB = extractCharacterPositions(slotB.scenario);

  const position_swap_applied =
    positionsA.gonagi_blocking_position === COORDINATE_TEST_CHARACTER_POSITIONS.gonagi &&
    positionsA.dana_blocking_position === COORDINATE_TEST_CHARACTER_POSITIONS.dana &&
    positionsB.gonagi_blocking_position === COORDINATE_TEST_CHARACTER_POSITIONS.dana &&
    positionsB.dana_blocking_position === COORDINATE_TEST_CHARACTER_POSITIONS.gonagi &&
    positionsA.gonagi_gaze_origin === COORDINATE_TEST_CHARACTER_POSITIONS.gonagi &&
    positionsA.dana_gaze_origin === COORDINATE_TEST_CHARACTER_POSITIONS.dana &&
    positionsB.gonagi_gaze_origin === COORDINATE_TEST_CHARACTER_POSITIONS.dana &&
    positionsB.dana_gaze_origin === COORDINATE_TEST_CHARACTER_POSITIONS.gonagi;

  if (!position_swap_applied) {
    issues.push({
      code: 'POSITION_SWAP_NOT_APPLIED',
      message: 'Test B must swap only CHAR-gonagi and CHAR-dana blocking/gaze origins',
      severity: 'error',
    });
  }

  const artStyle = slotA.artStyle === slotB.artStyle && slotA.artStyle === sourceSlot.artStyle;
  const timeSetting =
    slotA.timeSetting === slotB.timeSetting && slotA.timeSetting === sourceSlot.timeSetting;
  const character =
    slotA.character === slotB.character && slotA.character === sourceSlot.character;

  const cameraA = extractSection(slotA.scenario, '[CAMERA_LANGUAGE]', '[BLOCKING]');
  const cameraB = extractSection(slotB.scenario, '[CAMERA_LANGUAGE]', '[BLOCKING]');
  const camera_language = cameraA === cameraB;

  const environmentA = extractSection(slotA.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]');
  const environmentB = extractSection(slotB.scenario, '[ENVIRONMENT_ANCHOR]', '[PROP_ANCHOR]');
  const environment_anchor = environmentA === environmentB;

  const semanticA = extractSection(slotA.scenario, '[SEMANTIC_ANCHOR]', '[REPLICA_PRESERVATION]');
  const semanticB = extractSection(slotB.scenario, '[SEMANTIC_ANCHOR]', '[REPLICA_PRESERVATION]');
  const semantic_anchor = semanticA === semanticB;

  const shotA = extractSection(slotA.scenario, '[SHOT_TYPE]', '[BLOCKING]');
  const shotB = extractSection(slotB.scenario, '[SHOT_TYPE]', '[BLOCKING]');
  const shot_type = shotA === shotB;

  const gaze_direction = extractGazeDirections(slotA.scenario) === extractGazeDirections(slotB.scenario);

  const preserved_fields = {
    artStyle,
    timeSetting,
    character,
    camera_language,
    environment_anchor,
    semantic_anchor,
    gaze_direction,
    shot_type,
  };

  for (const [field, passed] of Object.entries(preserved_fields)) {
    if (!passed) {
      issues.push({
        code: 'PRESERVED_FIELD_CHANGED',
        message: `Test A and Test B must keep ${field} identical`,
        severity: 'error',
      });
    }
  }

  if (slotA.scenario !== sourceSlot.scenario) {
    issues.push({
      code: 'TEST_A_SCENARIO_DRIFT',
      message: 'Test A scenario must match source titanic-test-1scene.json',
      severity: 'error',
    });
  }

  const all_other_fields_identical = Object.values(preserved_fields).every(Boolean);

  return {
    position_swap_applied,
    all_other_fields_identical,
    preserved_fields,
    issues,
  };
}

export function runSpatialCoordinateValidation(projectRoot?: string): SpatialCoordinateValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SpatialCoordinateValidationReport['issues'] = [];

  if (!fs.existsSync(path.join(root, SPATIAL_COORDINATE_SOURCE_PATH))) {
    issues.push({
      code: 'SOURCE_MISSING',
      message: `Missing source pack ${SPATIAL_COORDINATE_SOURCE_PATH}`,
      severity: 'error',
    });
  }

  const source = fs.existsSync(path.join(root, SPATIAL_COORDINATE_SOURCE_PATH))
    ? readJson<MovieImageAppNativeImportV8Dataset>(root, SPATIAL_COORDINATE_SOURCE_PATH)
    : null;

  let testA: MovieImageAppNativeImportV8Dataset | null = null;
  let testB: MovieImageAppNativeImportV8Dataset | null = null;

  if (source) {
    testA = buildCoordinateTestDataset(source, 'A');
    testB = buildCoordinateTestDataset(source, 'B');
    writeJson(root, SPATIAL_COORDINATE_TEST_A_PATH, testA);
    writeJson(root, SPATIAL_COORDINATE_TEST_B_PATH, testB);
  }

  const test_a_created = fs.existsSync(path.join(root, SPATIAL_COORDINATE_TEST_A_PATH));
  const test_b_created = fs.existsSync(path.join(root, SPATIAL_COORDINATE_TEST_B_PATH));

  if (!test_a_created) {
    issues.push({
      code: 'TEST_A_MISSING',
      message: `Missing ${SPATIAL_COORDINATE_TEST_A_PATH}`,
      severity: 'error',
    });
  }

  if (!test_b_created) {
    issues.push({
      code: 'TEST_B_MISSING',
      message: `Missing ${SPATIAL_COORDINATE_TEST_B_PATH}`,
      severity: 'error',
    });
  }

  const validation =
    source && testA && testB
      ? validateCoordinateTests(testA, testB, source)
      : {
          position_swap_applied: false,
          all_other_fields_identical: false,
          preserved_fields: {
            artStyle: false,
            timeSetting: false,
            character: false,
            camera_language: false,
            environment_anchor: false,
            semantic_anchor: false,
            gaze_direction: false,
            shot_type: false,
          },
          issues: [] as SpatialCoordinateValidationReport['issues'],
        };

  issues.push(...validation.issues);

  const coordinate_test_created = test_a_created && test_b_created;
  const ready_for_manual_image_app_test = coordinate_test_created && validation.position_swap_applied;

  const validation_passed =
    coordinate_test_created &&
    test_a_created &&
    test_b_created &&
    validation.position_swap_applied &&
    validation.all_other_fields_identical &&
    ready_for_manual_image_app_test &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `spatial_coordinate_validation_report_${Date.now().toString(36)}`,
    phase: SPATIAL_COORDINATE_VALIDATION_PHASE,
    system_id: SPATIAL_COORDINATE_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? SPATIAL_COORDINATE_VALIDATION_PASS_VERDICT
      : SPATIAL_COORDINATE_VALIDATION_FAIL_VERDICT,
    validation_passed,
    coordinate_test_created,
    test_a_created,
    test_b_created,
    position_swap_applied: validation.position_swap_applied,
    all_other_fields_identical: validation.all_other_fields_identical,
    ready_for_manual_image_app_test,
    source_path: SPATIAL_COORDINATE_SOURCE_PATH,
    test_a_path: SPATIAL_COORDINATE_TEST_A_PATH,
    test_b_path: SPATIAL_COORDINATE_TEST_B_PATH,
    coordinate_test: {
      test_a: {
        char_gonagi_position: COORDINATE_TEST_CHARACTER_POSITIONS.gonagi,
        char_dana_position: COORDINATE_TEST_CHARACTER_POSITIONS.dana,
      },
      test_b: {
        char_gonagi_position: COORDINATE_TEST_CHARACTER_POSITIONS.dana,
        char_dana_position: COORDINATE_TEST_CHARACTER_POSITIONS.gonagi,
      },
      expected_mirror: true,
    },
    preserved_fields: validation.preserved_fields,
    manual_test_procedure: {
      title: 'Spatial Coordinate Influence Test',
      steps: [
        `Import ${SPATIAL_COORDINATE_TEST_A_PATH} into Image App and generate one image.`,
        `Import ${SPATIAL_COORDINATE_TEST_B_PATH} into Image App and generate one image.`,
        'Compare the two outputs side by side.',
        'Confirm Gonegi and Dana swap screen-left/screen-right positions.',
        'Confirm camera framing, environment, and shot type remain unchanged.',
      ],
      expected_visual_difference: [
        'Gonegi location changes',
        'Dana location changes',
        'Character layout mirrors',
      ],
      expected_visual_invariants: [
        'Camera remains identical',
        'Environment remains identical',
      ],
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSpatialCoordinateValidationReport(
  projectRoot?: string
): SpatialCoordinateValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSpatialCoordinateValidation(root);
  writeJson(root, SPATIAL_COORDINATE_VALIDATION_REPORT_PATH, report);
  return report;
}
