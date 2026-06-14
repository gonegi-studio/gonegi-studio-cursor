import fs from 'node:fs';
import path from 'node:path';
import {
  ImageAppNativeImportSlot,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT,
  NATIVE_IMPORT_REQUIRED_SLOT_FIELDS,
  loadMovieImageAppNativeImportDataset,
  writeMovieImageAppNativeImports,
} from './movieImageAppNativeImportBuilder.js';
import { writeMovieImageAppNativeImportReport } from './movieImageAppNativeImportValidation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SCENARIO_QUALITY_TEST_PHASE = 'PHASE-MOVIE-SPATIAL-012' as const;
export const MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID = 'MOVIE_SCENARIO_QUALITY_TEST_V1' as const;
export const MOVIE_SCENARIO_QUALITY_PASS_VERDICT = 'PASS_MOVIE_SCENARIO_QUALITY_V1' as const;
export const MOVIE_SCENARIO_QUALITY_FAIL_VERDICT = 'FAIL_MOVIE_SCENARIO_QUALITY_V1' as const;

export const MOVIE_SCENARIO_QUALITY_REPORT_PATH =
  'reports/movie_spatial/MOVIE_SCENARIO_QUALITY_REPORT.json' as const;
export const MOVIE_SCENARIO_QUALITY_SCHEMA_PATH =
  'datasets/movie_spatial/movie-scenario-quality-test.schema.json' as const;

export const NATIVE_IMPORT_SOURCE_PATH =
  'exports/movie_spatial/titanic-image-app-native-import.json' as const;
export const SCENARIO_TEST_OUTPUT_DIR = 'exports/movie_spatial/test_scenarios' as const;

export const SCENARIO_TEST_SCENES = [
  {
    test_scene_key: 'scene_001',
    slot_index: 0,
    scene_id: 'scene_titanic_dense_promenade_0001',
    json_filename: 'titanic-scene-001-test.json',
    readable_filename: 'titanic-scene-001-readable.txt',
  },
  {
    test_scene_key: 'scene_002',
    slot_index: 1,
    scene_id: 'scene_titanic_dense_grand_staircase_0002',
    json_filename: 'titanic-scene-002-test.json',
    readable_filename: 'titanic-scene-002-readable.txt',
  },
  {
    test_scene_key: 'scene_003',
    slot_index: 2,
    scene_id: 'scene_titanic_dense_first_class_salon_0003',
    json_filename: 'titanic-scene-003-test.json',
    readable_filename: 'titanic-scene-003-readable.txt',
  },
] as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const MIN_ART_STYLE_LENGTH = 10;
export const MIN_TIME_SETTING_LENGTH = 20;
export const MIN_CHARACTER_LENGTH = 50;
export const MIN_SCENARIO_LENGTH = 50;
export const MIN_TOKEN_DENSITY = 0.08;
export const MAX_TOKEN_DENSITY = 0.35;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface ScenarioFieldQualityMetrics {
  artStyle_length: number;
  timeSetting_length: number;
  character_length: number;
  scenario_length: number;
  total_character_length: number;
  estimated_token_count: number;
  token_density: number;
}

export interface MovieScenarioTestDataset {
  test_scenario_id: string;
  phase: typeof MOVIE_SCENARIO_QUALITY_TEST_PHASE;
  system_id: typeof MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID;
  movie_id: string;
  scene_id: string;
  slot_index: number;
  source_native_import_ref: typeof NATIVE_IMPORT_SOURCE_PATH;
  generated_at: string;
  slot_count: 1;
  single_scene_only: true;
  single_scene_test_ready: boolean;
  human_review_ready: boolean;
  image_app_generation_test_ready: boolean;
  slots: [ImageAppNativeImportSlot];
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ScenarioQualitySceneResult {
  test_scene_key: string;
  scene_id: string;
  slot_index: number;
  json_output_path: string;
  readable_output_path: string;
  quality: ScenarioFieldQualityMetrics;
  quality_passed: boolean;
}

export interface MovieScenarioQualityReport {
  report_id: string;
  phase: typeof MOVIE_SCENARIO_QUALITY_TEST_PHASE;
  system_id: typeof MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  single_scene_test_ready: boolean;
  human_review_ready: boolean;
  image_app_generation_test_ready: boolean;
  native_import_path: typeof NATIVE_IMPORT_SOURCE_PATH;
  output_directory: typeof SCENARIO_TEST_OUTPUT_DIR;
  upstream_native_import_verdict: string;
  metrics: {
    scene_count: number;
    scenario_length: number;
    character_length: number;
    time_length: number;
    artStyle_length: number;
    token_density: number;
  };
  scene_results: ScenarioQualitySceneResult[];
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(root: string, rel: string, value: string): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), value, 'utf8');
}

function estimateTokenCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function computeScenarioFieldQuality(slot: ImageAppNativeImportSlot): ScenarioFieldQualityMetrics {
  const artStyle_length = slot.artStyle.length;
  const timeSetting_length = slot.timeSetting.length;
  const character_length = slot.character.length;
  const scenario_length = slot.scenario.length;
  const total_character_length =
    artStyle_length + timeSetting_length + character_length + scenario_length;
  const estimated_token_count =
    estimateTokenCount(slot.artStyle) +
    estimateTokenCount(slot.timeSetting) +
    estimateTokenCount(slot.character) +
    estimateTokenCount(slot.scenario);
  const token_density =
    total_character_length > 0 ? estimated_token_count / total_character_length : 0;

  return {
    artStyle_length,
    timeSetting_length,
    character_length,
    scenario_length,
    total_character_length,
    estimated_token_count,
    token_density: round4(token_density),
  };
}

function buildReadableScenarioText(
  spec: (typeof SCENARIO_TEST_SCENES)[number],
  slot: ImageAppNativeImportSlot,
  quality: ScenarioFieldQualityMetrics
): string {
  const lines = [
    '=== Titanic Single-Scene Image App Test Scenario ===',
    '',
    `Phase: ${MOVIE_SCENARIO_QUALITY_TEST_PHASE}`,
    `System: ${MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID}`,
    `Test Scene Key: ${spec.test_scene_key}`,
    `Scene ID: ${spec.scene_id}`,
    `Slot Index: ${spec.slot_index}`,
    `Source: ${NATIVE_IMPORT_SOURCE_PATH}#slot_index=${spec.slot_index}`,
    '',
    '--- Quality Summary ---',
    `artStyle length: ${quality.artStyle_length}`,
    `timeSetting length: ${quality.timeSetting_length}`,
    `character length: ${quality.character_length}`,
    `scenario length: ${quality.scenario_length}`,
    `estimated tokens: ${quality.estimated_token_count}`,
    `token density: ${quality.token_density}`,
    '',
    `--- artStyle (${quality.artStyle_length} chars) ---`,
    slot.artStyle,
    '',
    `--- timeSetting (${quality.timeSetting_length} chars) ---`,
    slot.timeSetting,
    '',
    `--- character (${quality.character_length} chars) ---`,
    slot.character,
    '',
    `--- scenario (${quality.scenario_length} chars) ---`,
    slot.scenario,
    '',
    '--- Human Review Notes ---',
    'Import this JSON file into Image App as a single-slot native import test.',
    'Verify artStyle, timeSetting, character, and scenario read naturally before generation.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function buildScenarioTestDataset(
  spec: (typeof SCENARIO_TEST_SCENES)[number],
  slot: ImageAppNativeImportSlot
): MovieScenarioTestDataset {
  return {
    test_scenario_id: `titanic-${spec.test_scene_key.replace('_', '-')}-test-v1`,
    phase: MOVIE_SCENARIO_QUALITY_TEST_PHASE,
    system_id: MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID,
    movie_id: 'titanic',
    scene_id: spec.scene_id,
    slot_index: spec.slot_index,
    source_native_import_ref: NATIVE_IMPORT_SOURCE_PATH,
    generated_at: new Date().toISOString(),
    slot_count: 1,
    single_scene_only: true,
    single_scene_test_ready: true,
    human_review_ready: true,
    image_app_generation_test_ready: true,
    slots: [slot],
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

function validateSlotFields(
  prefix: string,
  slot: ImageAppNativeImportSlot
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const field of NATIVE_IMPORT_REQUIRED_SLOT_FIELDS) {
    if (typeof slot[field] !== 'string' || slot[field].trim().length === 0) {
      issues.push({
        code: 'SLOT_FIELD_MISSING',
        message: `${prefix}: ${field} is missing or empty`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function validateQualityMetrics(
  prefix: string,
  quality: ScenarioFieldQualityMetrics
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (quality.artStyle_length < MIN_ART_STYLE_LENGTH) {
    issues.push({
      code: 'ART_STYLE_LENGTH_TOO_SHORT',
      message: `${prefix}: artStyle length ${quality.artStyle_length} < ${MIN_ART_STYLE_LENGTH}`,
      severity: 'error',
    });
  }

  if (quality.timeSetting_length < MIN_TIME_SETTING_LENGTH) {
    issues.push({
      code: 'TIME_SETTING_LENGTH_TOO_SHORT',
      message: `${prefix}: timeSetting length ${quality.timeSetting_length} < ${MIN_TIME_SETTING_LENGTH}`,
      severity: 'error',
    });
  }

  if (quality.character_length < MIN_CHARACTER_LENGTH) {
    issues.push({
      code: 'CHARACTER_LENGTH_TOO_SHORT',
      message: `${prefix}: character length ${quality.character_length} < ${MIN_CHARACTER_LENGTH}`,
      severity: 'error',
    });
  }

  if (quality.scenario_length < MIN_SCENARIO_LENGTH) {
    issues.push({
      code: 'SCENARIO_LENGTH_TOO_SHORT',
      message: `${prefix}: scenario length ${quality.scenario_length} < ${MIN_SCENARIO_LENGTH}`,
      severity: 'error',
    });
  }

  if (quality.token_density < MIN_TOKEN_DENSITY) {
    issues.push({
      code: 'TOKEN_DENSITY_TOO_LOW',
      message: `${prefix}: token_density ${quality.token_density} < ${MIN_TOKEN_DENSITY}`,
      severity: 'error',
    });
  }

  if (quality.token_density > MAX_TOKEN_DENSITY) {
    issues.push({
      code: 'TOKEN_DENSITY_TOO_HIGH',
      message: `${prefix}: token_density ${quality.token_density} > ${MAX_TOKEN_DENSITY}`,
      severity: 'error',
    });
  }

  return issues;
}

function validateScenarioTestDataset(
  root: string,
  spec: (typeof SCENARIO_TEST_SCENES)[number],
  dataset: MovieScenarioTestDataset,
  quality: ScenarioFieldQualityMetrics
): ValidationIssue[] {
  const prefix = spec.test_scene_key;
  const issues: ValidationIssue[] = [];

  if (dataset.slot_count !== 1 || dataset.slots.length !== 1) {
    issues.push({
      code: 'MULTI_SLOT_VIOLATION',
      message: `${prefix}: test scenario must contain exactly one slot`,
      severity: 'error',
    });
  }

  if (!dataset.single_scene_only) {
    issues.push({
      code: 'SINGLE_SCENE_FLAG_MISSING',
      message: `${prefix}: single_scene_only must be true`,
      severity: 'error',
    });
  }

  if (dataset.phase !== MOVIE_SCENARIO_QUALITY_TEST_PHASE) {
    issues.push({
      code: 'PHASE_MISMATCH',
      message: `${prefix}: phase=${dataset.phase}`,
      severity: 'error',
    });
  }

  if (dataset.system_id !== MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID) {
    issues.push({
      code: 'SYSTEM_ID_MISMATCH',
      message: `${prefix}: system_id=${dataset.system_id}`,
      severity: 'error',
    });
  }

  if (dataset.scene_id !== spec.scene_id) {
    issues.push({
      code: 'SCENE_ID_MISMATCH',
      message: `${prefix}: scene_id=${dataset.scene_id}`,
      severity: 'error',
    });
  }

  if (dataset.slot_index !== spec.slot_index) {
    issues.push({
      code: 'SLOT_INDEX_MISMATCH',
      message: `${prefix}: slot_index=${dataset.slot_index}`,
      severity: 'error',
    });
  }

  issues.push(...validateSlotFields(prefix, dataset.slots[0]));
  issues.push(...validateQualityMetrics(prefix, quality));

  const jsonPath = path.join(root, SCENARIO_TEST_OUTPUT_DIR, spec.json_filename);
  const readablePath = path.join(root, SCENARIO_TEST_OUTPUT_DIR, spec.readable_filename);

  if (!fs.existsSync(jsonPath)) {
    issues.push({
      code: 'JSON_OUTPUT_MISSING',
      message: `${prefix}: missing ${SCENARIO_TEST_OUTPUT_DIR}/${spec.json_filename}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(readablePath)) {
    issues.push({
      code: 'READABLE_OUTPUT_MISSING',
      message: `${prefix}: missing ${SCENARIO_TEST_OUTPUT_DIR}/${spec.readable_filename}`,
      severity: 'error',
    });
  } else {
    const readable = fs.readFileSync(readablePath, 'utf8');
    for (const field of NATIVE_IMPORT_REQUIRED_SLOT_FIELDS) {
      if (!readable.includes(slotFieldLabel(field))) {
        issues.push({
          code: 'READABLE_FIELD_SECTION_MISSING',
          message: `${prefix}: readable file missing ${field} section`,
          severity: 'error',
        });
      }
    }
  }

  return issues;
}

function slotFieldLabel(field: (typeof NATIVE_IMPORT_REQUIRED_SLOT_FIELDS)[number]): string {
  return `--- ${field}`;
}

export function runMovieScenarioQualityTest(root: string): MovieScenarioQualityReport {
  writeMovieImageAppNativeImports(root);
  const nativeImportReport = writeMovieImageAppNativeImportReport(root);

  const nativeImport = loadMovieImageAppNativeImportDataset(root, 'titanic');
  if (!nativeImport) {
    throw new Error(`Missing native import: ${NATIVE_IMPORT_SOURCE_PATH}`);
  }

  const sceneResults: ScenarioQualitySceneResult[] = [];
  const issues: ValidationIssue[] = [];

  for (const spec of SCENARIO_TEST_SCENES) {
    const slot = nativeImport.slots[spec.slot_index];
    if (!slot) {
      issues.push({
        code: 'NATIVE_IMPORT_SLOT_MISSING',
        message: `${spec.test_scene_key}: slot_index=${spec.slot_index} not found`,
        severity: 'error',
      });
      continue;
    }

    const quality = computeScenarioFieldQuality(slot);
    const dataset = buildScenarioTestDataset(spec, slot);
    const jsonPath = `${SCENARIO_TEST_OUTPUT_DIR}/${spec.json_filename}`;
    const readablePath = `${SCENARIO_TEST_OUTPUT_DIR}/${spec.readable_filename}`;

    writeJson(root, jsonPath, dataset);
    writeText(root, readablePath, buildReadableScenarioText(spec, slot, quality));

    const sceneIssues = validateScenarioTestDataset(root, spec, dataset, quality);
    issues.push(...sceneIssues);

    sceneResults.push({
      test_scene_key: spec.test_scene_key,
      scene_id: spec.scene_id,
      slot_index: spec.slot_index,
      json_output_path: jsonPath,
      readable_output_path: readablePath,
      quality,
      quality_passed: sceneIssues.every((issue) => issue.severity !== 'error'),
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const allScenesReady = sceneResults.length === SCENARIO_TEST_SCENES.length;
  const allQualityPassed = sceneResults.every((entry) => entry.quality_passed);
  const allReadablePresent = SCENARIO_TEST_SCENES.every((spec) =>
    fs.existsSync(path.join(root, SCENARIO_TEST_OUTPUT_DIR, spec.readable_filename))
  );
  const allJsonPresent = SCENARIO_TEST_SCENES.every((spec) =>
    fs.existsSync(path.join(root, SCENARIO_TEST_OUTPUT_DIR, spec.json_filename))
  );

  const singleSceneTestReady =
    allScenesReady && allJsonPresent && allQualityPassed && errors.length === 0;
  const humanReviewReady = singleSceneTestReady && allReadablePresent;
  const imageAppGenerationTestReady =
    humanReviewReady &&
    nativeImportReport.final_verdict === MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT;

  const validationPassed =
    singleSceneTestReady &&
    humanReviewReady &&
    imageAppGenerationTestReady &&
    nativeImportReport.final_verdict === MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT;

  return {
    report_id: `movie_scenario_quality_report_${Date.now().toString(36)}`,
    phase: MOVIE_SCENARIO_QUALITY_TEST_PHASE,
    system_id: MOVIE_SCENARIO_QUALITY_TEST_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_SCENARIO_QUALITY_PASS_VERDICT
      : MOVIE_SCENARIO_QUALITY_FAIL_VERDICT,
    validation_passed: validationPassed,
    single_scene_test_ready: singleSceneTestReady,
    human_review_ready: humanReviewReady,
    image_app_generation_test_ready: imageAppGenerationTestReady,
    native_import_path: NATIVE_IMPORT_SOURCE_PATH,
    output_directory: SCENARIO_TEST_OUTPUT_DIR,
    upstream_native_import_verdict: nativeImportReport.final_verdict,
    metrics: {
      scene_count: sceneResults.length,
      scenario_length: average(sceneResults.map((entry) => entry.quality.scenario_length)),
      character_length: average(sceneResults.map((entry) => entry.quality.character_length)),
      time_length: average(sceneResults.map((entry) => entry.quality.timeSetting_length)),
      artStyle_length: average(sceneResults.map((entry) => entry.quality.artStyle_length)),
      token_density: average(sceneResults.map((entry) => entry.quality.token_density)),
    },
    scene_results: sceneResults,
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieScenarioQualityReport(projectRoot?: string): MovieScenarioQualityReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieScenarioQualityTest(root);
  writeJson(root, MOVIE_SCENARIO_QUALITY_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY };
