import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT,
  MovieImageAppNativeImportDataset,
  loadMovieImageAppNativeImportDataset,
} from './movieImageAppNativeImportBuilder.js';
import {
  MOVIE_REPLICA_ACCURACY_PASS_VERDICT,
  MOVIE_REPLICA_ACCURACY_REPORT_PATH,
  MovieReplicaAccuracyAudit,
  REPLICA_ACCURACY_PASS_THRESHOLD,
} from './movieReplicaAccuracyAudit.js';
import { writeMovieReplicaAccuracyReport } from './movieReplicaAccuracyValidation.js';
import { writeMovieImageAppNativeImportReport } from './movieImageAppNativeImportValidation.js';
import {
  MOVIE_SPATIAL_ARCHIVE_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
} from './generationOutputPaths.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_GENERATION_VALIDATION_PHASE = 'PHASE-MOVIE-SPATIAL-009' as const;
export const MOVIE_IMAGE_GENERATION_VALIDATION_SYSTEM_ID =
  'MOVIE_IMAGE_GENERATION_VALIDATION_V1' as const;
export const MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_IMAGE_GENERATION_VALIDATION_V1' as const;
export const MOVIE_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_IMAGE_GENERATION_VALIDATION_V1' as const;

export const MOVIE_IMAGE_GENERATION_VALIDATION_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-generation-validation.schema.json' as const;
export const MOVIE_IMAGE_GENERATION_VALIDATION_REPORT_PATH =
  'reports/movie_spatial/MOVIE_IMAGE_GENERATION_VALIDATION_REPORT.json' as const;
export const MOVIE_IMAGE_GENERATION_TEST_DIR = 'datasets/movie_spatial/test_generation' as const;
export const MOVIE_IMAGE_GENERATION_OUTPUT_DIR =
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/test_generation` as const;

export const DESIGN_ONLY_GENERATION_FAILURE_REASON =
  'DESIGN_ONLY_AWAITING_MANUAL_IMAGE_APP_IMPORT_AND_GENERATION' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const TITANIC_GENERATION_TEST_SCENES = [
  {
    test_scene_key: 'scene_001',
    output_filename: 'titanic-scene-001-generation-validation.json',
    slot_index: 0,
    scene_id: 'scene_titanic_dense_promenade_0001',
    expected_image_filename: 'titanic-scene-001.png',
  },
  {
    test_scene_key: 'scene_002',
    output_filename: 'titanic-scene-002-generation-validation.json',
    slot_index: 1,
    scene_id: 'scene_titanic_dense_grand_staircase_0002',
    expected_image_filename: 'titanic-scene-002.png',
  },
  {
    test_scene_key: 'scene_003',
    output_filename: 'titanic-scene-003-generation-validation.json',
    slot_index: 2,
    scene_id: 'scene_titanic_dense_first_class_salon_0003',
    expected_image_filename: 'titanic-scene-003.png',
  },
] as const;

export const MANUAL_TEST_PROCEDURE = {
  title: 'Image App Native Import Generation Test',
  native_import_path: NATIVE_IMPORT_V8_ACTIVE_OUTPUTS[0].output_path,
  output_directory: MOVIE_IMAGE_GENERATION_OUTPUT_DIR,
  global_steps: [
    'Open Image App Import Scenario.',
    `Import ${NATIVE_IMPORT_V8_ACTIVE_OUTPUTS[0].output_path}.`,
    'Confirm slots[] loaded with artStyle, timeSetting, scenario, and character fields.',
    `Generate each test scene and save output PNG to ${MOVIE_IMAGE_GENERATION_OUTPUT_DIR}/.`,
    'Update validation records with generation_success, output path, and measured match scores.',
  ],
} as const;

export interface GenerationValidationResult {
  scene_id: string;
  generation_success: boolean;
  character_match_score: number;
  environment_match_score: number;
  camera_match_score: number;
  composition_match_score: number;
  replica_score: number;
  failure_reason: string | null;
  generated_output_path?: string | null;
  validated_at?: string;
}

export interface ManualTestProcedureBlock {
  native_import_path: string;
  slot_index: number;
  steps: string[];
}

export interface MovieImageGenerationValidationRecord {
  validation_id: string;
  phase: typeof MOVIE_IMAGE_GENERATION_VALIDATION_PHASE;
  system_id: typeof MOVIE_IMAGE_GENERATION_VALIDATION_SYSTEM_ID;
  test_scene_key: string;
  movie_id: string;
  scene_id: string;
  slot_index: number;
  native_import_ref: string;
  expected_output_path: string;
  manual_test_procedure: ManualTestProcedureBlock;
  import_slot: {
    artStyle: string;
    timeSetting: string;
    scenario: string;
    character: string;
  };
  validation: GenerationValidationResult;
  replica_baseline_ref: string;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieImageGenerationValidationReport {
  report_id: string;
  phase: typeof MOVIE_IMAGE_GENERATION_VALIDATION_PHASE;
  system_id: typeof MOVIE_IMAGE_GENERATION_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  generation_test_complete: boolean;
  replica_validation_complete: boolean;
  manual_test_procedure: typeof MANUAL_TEST_PROCEDURE;
  upstream_native_import_verdict: string;
  upstream_replica_accuracy_verdict: string;
  metrics: {
    test_scene_count: number;
    validation_record_count: number;
    replica_baseline_pass_count: number;
    average_replica_score: number;
  };
  test_summaries: Array<{
    test_scene_key: string;
    scene_id: string;
    validation_path: string;
    generation_success: boolean;
    replica_score: number;
  }>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(value: number): number {
  return Number(value.toFixed(4));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function loadReplicaAudits(root: string): MovieReplicaAccuracyAudit[] {
  const reportPath = path.join(root, MOVIE_REPLICA_ACCURACY_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return [];
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    audits?: MovieReplicaAccuracyAudit[];
  };
  return report.audits ?? [];
}

function buildManualSteps(testSceneKey: string, slotIndex: number, expectedOutputPath: string): string[] {
  return [
    `Import ${MANUAL_TEST_PROCEDURE.native_import_path}.`,
    `Select slot index ${slotIndex} (${testSceneKey}).`,
    'Verify artStyle, timeSetting, scenario, and character fields match import_slot in this validation record.',
    'Run Image App generation for this slot.',
    `Save generated image to ${expectedOutputPath}.`,
    'Record generation_success=true and update match scores after visual replica review.',
  ];
}

function mapReplicaAuditToValidation(
  audit: MovieReplicaAccuracyAudit,
  sceneId: string
): GenerationValidationResult {
  const characterMatchScore = average([audit.blocking_score, audit.gaze_score]);

  return {
    scene_id: sceneId,
    generation_success: false,
    character_match_score: characterMatchScore,
    environment_match_score: audit.environment_score,
    camera_match_score: audit.camera_score,
    composition_match_score: audit.composition_score,
    replica_score: audit.overall_replica_score,
    failure_reason: DESIGN_ONLY_GENERATION_FAILURE_REASON,
    generated_output_path: null,
    validated_at: new Date().toISOString(),
  };
}

export function buildMovieImageGenerationValidationRecord(
  spec: (typeof TITANIC_GENERATION_TEST_SCENES)[number],
  nativeImport: MovieImageAppNativeImportDataset,
  replicaAudit: MovieReplicaAccuracyAudit
): MovieImageGenerationValidationRecord {
  const slot = nativeImport.slots[spec.slot_index];
  if (!slot) {
    throw new Error(`Missing native import slot index ${spec.slot_index}`);
  }

  const nativeImportPath =
    IMAGE_APP_NATIVE_IMPORT_OUTPUTS.find((entry) => entry.movie_id === nativeImport.movie_id)
      ?.output_path ?? MANUAL_TEST_PROCEDURE.native_import_path;
  const expectedOutputPath = `${MOVIE_IMAGE_GENERATION_OUTPUT_DIR}/${spec.expected_image_filename}`;

  return {
    validation_id: `${spec.test_scene_key}-generation-validation-v1`,
    phase: MOVIE_IMAGE_GENERATION_VALIDATION_PHASE,
    system_id: MOVIE_IMAGE_GENERATION_VALIDATION_SYSTEM_ID,
    test_scene_key: spec.test_scene_key,
    movie_id: nativeImport.movie_id,
    scene_id: spec.scene_id,
    slot_index: spec.slot_index,
    native_import_ref: `${nativeImportPath}#slot_index=${spec.slot_index}`,
    expected_output_path: expectedOutputPath,
    manual_test_procedure: {
      native_import_path: nativeImportPath,
      slot_index: spec.slot_index,
      steps: buildManualSteps(spec.test_scene_key, spec.slot_index, expectedOutputPath),
    },
    import_slot: {
      artStyle: slot.artStyle,
      timeSetting: slot.timeSetting,
      scenario: slot.scenario,
      character: slot.character,
    },
    validation: mapReplicaAuditToValidation(replicaAudit, spec.scene_id),
    replica_baseline_ref: `${MOVIE_REPLICA_ACCURACY_REPORT_PATH}#scene_id=${spec.scene_id}`,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

function validateRecord(record: MovieImageGenerationValidationRecord): Array<{
  code: string;
  message: string;
  severity: 'error' | 'warning';
}> {
  const issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
  const prefix = record.test_scene_key;

  if (record.validation.scene_id !== record.scene_id) {
    issues.push({
      code: 'SCENE_ID_MISMATCH',
      message: `${prefix}: validation.scene_id mismatch`,
      severity: 'error',
    });
  }

  for (const field of [
    'character_match_score',
    'environment_match_score',
    'camera_match_score',
    'composition_match_score',
    'replica_score',
  ] as const) {
    const value = record.validation[field];
    if (typeof value !== 'number' || value < 0 || value > 1) {
      issues.push({
        code: 'SCORE_OUT_OF_RANGE',
        message: `${prefix}: ${field}=${value}`,
        severity: 'error',
      });
    }
  }

  if (record.validation.replica_score < REPLICA_ACCURACY_PASS_THRESHOLD) {
    issues.push({
      code: 'REPLICA_BASELINE_BELOW_THRESHOLD',
      message: `${prefix}: replica_score=${record.validation.replica_score}`,
      severity: 'error',
    });
  }

  for (const field of ['artStyle', 'timeSetting', 'scenario', 'character'] as const) {
    if (!record.import_slot[field]?.trim()) {
      issues.push({
        code: 'IMPORT_SLOT_FIELD_MISSING',
        message: `${prefix}: import_slot.${field} missing`,
        severity: 'error',
      });
    }
  }

  if (record.manual_test_procedure.steps.length === 0) {
    issues.push({
      code: 'MANUAL_PROCEDURE_MISSING',
      message: `${prefix}: manual_test_procedure.steps empty`,
      severity: 'error',
    });
  }

  return issues;
}

export function writeMovieImageGenerationValidationRecords(
  projectRoot?: string
): MovieImageGenerationValidationRecord[] {
  const root = resolveProjectRoot(projectRoot);
  writeMovieImageAppNativeImportReport(root);
  writeMovieReplicaAccuracyReport(root);

  const nativeImport = loadMovieImageAppNativeImportDataset(root, 'titanic');
  if (!nativeImport) {
    throw new Error('Missing titanic native import dataset');
  }

  const replicaAudits = loadReplicaAudits(root);
  const records: MovieImageGenerationValidationRecord[] = [];

  for (const spec of TITANIC_GENERATION_TEST_SCENES) {
    const audit = replicaAudits.find((entry) => entry.scene_id === spec.scene_id);
    if (!audit) {
      throw new Error(`Missing replica audit for scene_id=${spec.scene_id}`);
    }

    const record = buildMovieImageGenerationValidationRecord(spec, nativeImport, audit);
    const outputPath = `${MOVIE_IMAGE_GENERATION_TEST_DIR}/${spec.output_filename}`;
    writeJson(root, outputPath, record);
    records.push(record);
  }

  return records;
}

export function loadMovieImageGenerationValidationRecord(
  root: string,
  filename: string
): MovieImageGenerationValidationRecord | null {
  const full = path.join(root, MOVIE_IMAGE_GENERATION_TEST_DIR, filename);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageGenerationValidationRecord;
}

export function buildMovieImageGenerationValidationReport(
  root: string
): MovieImageGenerationValidationReport {
  const nativeImportReport = writeMovieImageAppNativeImportReport(root);
  const replicaReport = writeMovieReplicaAccuracyReport(root);
  const records = writeMovieImageGenerationValidationRecords(root);

  const issues: MovieImageGenerationValidationReport['issues'] = [];

  for (const spec of TITANIC_GENERATION_TEST_SCENES) {
    const outputPath = `${MOVIE_IMAGE_GENERATION_TEST_DIR}/${spec.output_filename}`;
    if (!fs.existsSync(path.join(root, outputPath))) {
      issues.push({
        code: 'VALIDATION_RECORD_MISSING',
        message: `Missing ${outputPath}`,
        severity: 'error',
      });
    }
  }

  for (const record of records) {
    issues.push(...validateRecord(record));
  }

  const replicaBaselinePassCount = records.filter(
    (record) => record.validation.replica_score >= REPLICA_ACCURACY_PASS_THRESHOLD
  ).length;

  const averageReplicaScore = average(records.map((record) => record.validation.replica_score));

  const generationTestComplete =
    records.length === TITANIC_GENERATION_TEST_SCENES.length &&
    records.every(
      (record) =>
        record.manual_test_procedure.steps.length > 0 &&
        record.import_slot.artStyle.trim().length > 0 &&
        record.import_slot.timeSetting.trim().length > 0 &&
        record.import_slot.scenario.trim().length > 0 &&
        record.import_slot.character.trim().length > 0
    );

  const replicaValidationComplete =
    replicaBaselinePassCount === TITANIC_GENERATION_TEST_SCENES.length &&
    records.every((record) => record.validation.replica_score >= REPLICA_ACCURACY_PASS_THRESHOLD);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    generationTestComplete &&
    replicaValidationComplete &&
    nativeImportReport.final_verdict === MOVIE_IMAGE_APP_NATIVE_IMPORT_PASS_VERDICT &&
    replicaReport.final_verdict === MOVIE_REPLICA_ACCURACY_PASS_VERDICT;

  return {
    report_id: `movie_image_generation_validation_report_${Date.now().toString(36)}`,
    phase: MOVIE_IMAGE_GENERATION_VALIDATION_PHASE,
    system_id: MOVIE_IMAGE_GENERATION_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT
      : MOVIE_IMAGE_GENERATION_VALIDATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    generation_test_complete: generationTestComplete,
    replica_validation_complete: replicaValidationComplete,
    manual_test_procedure: MANUAL_TEST_PROCEDURE,
    upstream_native_import_verdict: nativeImportReport.final_verdict,
    upstream_replica_accuracy_verdict: replicaReport.final_verdict,
    metrics: {
      test_scene_count: TITANIC_GENERATION_TEST_SCENES.length,
      validation_record_count: records.length,
      replica_baseline_pass_count: replicaBaselinePassCount,
      average_replica_score: averageReplicaScore,
    },
    test_summaries: records.map((record, index) => ({
      test_scene_key: record.test_scene_key,
      scene_id: record.scene_id,
      validation_path: `${MOVIE_IMAGE_GENERATION_TEST_DIR}/${TITANIC_GENERATION_TEST_SCENES[index].output_filename}`,
      generation_success: record.validation.generation_success,
      replica_score: record.validation.replica_score,
    })),
    issues,
  };
}

export function writeMovieImageGenerationValidationReport(
  projectRoot?: string
): MovieImageGenerationValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = buildMovieImageGenerationValidationReport(root);
  writeJson(root, MOVIE_IMAGE_GENERATION_VALIDATION_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY };
