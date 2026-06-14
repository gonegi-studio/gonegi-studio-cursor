import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalTimeSettingPrompt,
} from './approvedOriginalsLoader.js';
import {
  ImageAppNativeImportSlot,
  NATIVE_IMPORT_REQUIRED_SLOT_FIELDS,
  MovieImageAppNativeImportV8Dataset,
  loadMovieImageAppNativeImportV8Dataset,
} from './movieImageAppNativeImportBuilder.js';
import { REPLICA_ACCURACY_PASS_THRESHOLD } from './movieReplicaAccuracyAudit.js';
import { loadMovieSpatialGraphDataset } from './movieSpatialGraphBuilder.js';
import { copySourceOfTruthCharacterFieldFromGraph } from './sourceOfTruthLoader.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import {
  MOVIE_SPATIAL_ARCHIVE_DIR,
  MOVIE_SPATIAL_MANUAL_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
  REAL_IMAGE_APP_MANUAL_ASSETS,
} from './generationOutputPaths.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_APP_MANUAL_PHASE = 'PHASE-IMAGE-APP-MANUAL-VALIDATION-001' as const;
export const REAL_IMAGE_APP_MANUAL_SYSTEM_ID = 'REAL_IMAGE_APP_MANUAL_V1' as const;
export const REAL_IMAGE_APP_MANUAL_PASS_VERDICT = 'PASS_REAL_IMAGE_APP_MANUAL_V1' as const;
export const REAL_IMAGE_APP_MANUAL_FAIL_VERDICT = 'FAIL_REAL_IMAGE_APP_MANUAL_V1' as const;

export const REAL_IMAGE_APP_MANUAL_REPORT_PATH = REAL_IMAGE_APP_MANUAL_ASSETS.report;

export const REAL_IMAGE_APP_MANUAL_INTAKE_PATH = REAL_IMAGE_APP_MANUAL_ASSETS.intake;

export const REAL_IMAGE_APP_MANUAL_OUTPUT_DIR = MOVIE_SPATIAL_MANUAL_DIR;

export const REAL_IMAGE_APP_MANUAL_IMPORT_PATH = NATIVE_IMPORT_V8_ACTIVE_OUTPUTS[0].output_path;

export const REAL_IMAGE_APP_MANUAL_REVIEW_THRESHOLD = REPLICA_ACCURACY_PASS_THRESHOLD;

export const REAL_IMAGE_APP_MANUAL_SCENES = [
  {
    test_scene_key: 'scene_001',
    slot_index: 0,
    scene_id: 'scene_titanic_dense_promenade_0001',
    output_filename: 'real_scene_001.png',
  },
  {
    test_scene_key: 'scene_002',
    slot_index: 1,
    scene_id: 'scene_titanic_dense_grand_staircase_0002',
    output_filename: 'real_scene_002.png',
  },
  {
    test_scene_key: 'scene_003',
    slot_index: 2,
    scene_id: 'scene_titanic_dense_first_class_salon_0003',
    output_filename: 'real_scene_003.png',
  },
] as const;

export const REAL_IMAGE_APP_MANUAL_PROCEDURE = {
  title: 'Real Image App Manual Validation',
  native_import_path: REAL_IMAGE_APP_MANUAL_IMPORT_PATH,
  output_directory: REAL_IMAGE_APP_MANUAL_OUTPUT_DIR,
  intake_path: REAL_IMAGE_APP_MANUAL_INTAKE_PATH,
  global_steps: [
    `Open the real Image App and import ${REAL_IMAGE_APP_MANUAL_IMPORT_PATH}.`,
    'Confirm slots[] load with artStyle, timeSetting, scenario, and character fields.',
    'Generate scene 001 (slot index 0), scene 002 (slot index 1), and scene 003 (slot index 2).',
    `Save outputs to ${REAL_IMAGE_APP_MANUAL_OUTPUT_DIR}/real_scene_001.png, real_scene_002.png, real_scene_003.png.`,
    `Record human review scores in ${REAL_IMAGE_APP_MANUAL_INTAKE_PATH}.`,
    'Run npm run verify:real-image-app-manual to produce REAL_IMAGE_APP_MANUAL_REPORT.json.',
  ],
} as const;

const SIMULATED_OUTPUT_DIRS = [
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/image_app_real_test`,
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/test_generation`,
] as const;

const EXECUTION_FLAGS = {
  design_only: false as const,
  gpu_execution: false as const,
  image_generation: true as const,
  video_generation: false as const,
  rendering: false as const,
  pixel_engine: false as const,
  simulation: false as const,
};

export interface RealImageAppManualReviewScores {
  artStyle_accuracy: number | null;
  character_accuracy: number | null;
  timeSetting_accuracy: number | null;
  scenario_accuracy: number | null;
  overall_replica_quality: number | null;
  reviewer_notes?: string;
}

export interface RealImageAppManualIntakeScene {
  test_scene_key: string;
  slot_index: number;
  scene_id: string;
  output_filename: string;
  import_success: boolean;
  generation_success: boolean;
  review: RealImageAppManualReviewScores;
}

export interface RealImageAppManualIntake {
  intake_id: string;
  phase: typeof REAL_IMAGE_APP_MANUAL_PHASE;
  system_id: typeof REAL_IMAGE_APP_MANUAL_SYSTEM_ID;
  native_import_path: typeof REAL_IMAGE_APP_MANUAL_IMPORT_PATH;
  import_completed: boolean;
  reviewer: string;
  reviewed_at: string | null;
  scenes: RealImageAppManualIntakeScene[];
}

export interface RealImageAppManualReviewResult {
  artStyle_accuracy: number;
  character_accuracy: number;
  timeSetting_accuracy: number;
  scenario_accuracy: number;
  overall_replica_quality: number;
  scene_average_score: number;
  passed: boolean;
  reviewer_notes: string;
}

export interface RealImageAppManualSceneResult {
  test_scene_key: string;
  scene_id: string;
  slot_index: number;
  native_import_ref: string;
  expected_output_path: string;
  output_exists: boolean;
  output_sha256: string | null;
  output_bytes: number;
  simulated_output_rejected: boolean;
  import_success: boolean;
  generation_success: boolean;
  import_slot: {
    artStyle: string;
    timeSetting: string;
    scenario: string;
    character: string;
  };
  review: RealImageAppManualReviewResult | null;
  scene_passed: boolean;
}

export interface RealImageAppManualReport {
  report_id: string;
  phase: typeof REAL_IMAGE_APP_MANUAL_PHASE;
  system_id: typeof REAL_IMAGE_APP_MANUAL_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  manual_validation_complete: boolean;
  real_application_output_verified: boolean;
  human_review_complete: boolean;
  native_import_path: typeof REAL_IMAGE_APP_MANUAL_IMPORT_PATH;
  output_directory: typeof REAL_IMAGE_APP_MANUAL_OUTPUT_DIR;
  intake_path: typeof REAL_IMAGE_APP_MANUAL_INTAKE_PATH;
  reviewer: string;
  reviewed_at: string | null;
  manual_test_procedure: typeof REAL_IMAGE_APP_MANUAL_PROCEDURE;
  metrics: {
    scene_count: number;
    scenes_passed: number;
    real_output_count: number;
    average_artStyle_accuracy: number;
    average_character_accuracy: number;
    average_timeSetting_accuracy: number;
    average_scenario_accuracy: number;
    average_overall_replica_quality: number;
    average_scene_score: number;
  };
  scene_results: RealImageAppManualSceneResult[];
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
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

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function sha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

function isValidPng(buffer: Buffer): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  );
}

function collectSimulatedHashes(root: string): Set<string> {
  const hashes = new Set<string>();

  for (const dir of SIMULATED_OUTPUT_DIRS) {
    const fullDir = path.join(root, dir);
    if (!fs.existsSync(fullDir)) continue;

    for (const entry of fs.readdirSync(fullDir)) {
      if (!entry.toLowerCase().endsWith('.png')) continue;
      const full = path.join(fullDir, entry);
      if (!fs.statSync(full).isFile()) continue;
      hashes.add(sha256(fs.readFileSync(full)));
    }
  }

  return hashes;
}

function buildDefaultIntake(
  dataset: MovieImageAppNativeImportV8Dataset | null
): RealImageAppManualIntake {
  return {
    intake_id: 'real_image_app_manual_intake_v1',
    phase: REAL_IMAGE_APP_MANUAL_PHASE,
    system_id: REAL_IMAGE_APP_MANUAL_SYSTEM_ID,
    native_import_path: REAL_IMAGE_APP_MANUAL_IMPORT_PATH,
    import_completed: false,
    reviewer: '',
    reviewed_at: null,
    scenes: REAL_IMAGE_APP_MANUAL_SCENES.map((spec) => {
      const slot = dataset?.slots[spec.slot_index];
      return {
        test_scene_key: spec.test_scene_key,
        slot_index: spec.slot_index,
        scene_id: spec.scene_id,
        output_filename: spec.output_filename,
        import_success: false,
        generation_success: false,
        review: {
          artStyle_accuracy: null,
          character_accuracy: null,
          timeSetting_accuracy: null,
          scenario_accuracy: null,
          overall_replica_quality: null,
          reviewer_notes: slot
            ? 'Awaiting human review after real Image App import and generation.'
            : 'Awaiting v8 import slot availability.',
        },
      };
    }),
  };
}

export function ensureRealImageAppManualIntake(projectRoot?: string): RealImageAppManualIntake {
  const root = resolveProjectRoot(projectRoot);
  const dataset = loadMovieImageAppNativeImportV8Dataset(root, 'titanic');
  const intakePath = path.join(root, REAL_IMAGE_APP_MANUAL_INTAKE_PATH);

  if (!fs.existsSync(intakePath)) {
    const intake = buildDefaultIntake(dataset);
    writeJson(root, REAL_IMAGE_APP_MANUAL_INTAKE_PATH, intake);
    return intake;
  }

  return JSON.parse(fs.readFileSync(intakePath, 'utf8')) as RealImageAppManualIntake;
}

function isValidScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function buildReviewResult(
  review: RealImageAppManualReviewScores
): RealImageAppManualReviewResult | null {
  const scores = [
    review.artStyle_accuracy,
    review.character_accuracy,
    review.timeSetting_accuracy,
    review.scenario_accuracy,
    review.overall_replica_quality,
  ];

  if (!scores.every(isValidScore)) {
    return null;
  }

  const sceneAverageScore = average(scores);
  const passed = sceneAverageScore >= REAL_IMAGE_APP_MANUAL_REVIEW_THRESHOLD;

  return {
    artStyle_accuracy: review.artStyle_accuracy as number,
    character_accuracy: review.character_accuracy as number,
    timeSetting_accuracy: review.timeSetting_accuracy as number,
    scenario_accuracy: review.scenario_accuracy as number,
    overall_replica_quality: review.overall_replica_quality as number,
    scene_average_score: sceneAverageScore,
    passed,
    reviewer_notes: review.reviewer_notes?.trim() ?? '',
  };
}

function validateSlotFields(slot: ImageAppNativeImportSlot | undefined): boolean {
  if (!slot) return false;
  return NATIVE_IMPORT_REQUIRED_SLOT_FIELDS.every((field) => hasNonEmptyString(slot[field]));
}

export function runRealImageAppManualValidation(projectRoot?: string): RealImageAppManualReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageAppManualReport['issues'] = [];
  const intake = ensureRealImageAppManualIntake(root);
  const dataset = loadMovieImageAppNativeImportV8Dataset(root, 'titanic');
  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const graphBySceneId = new Map(
    (graphDataset?.spatial_graphs ?? []).map((graph) => [graph.scene_id, graph])
  );
  const simulatedHashes = collectSimulatedHashes(root);

  if (!dataset) {
    issues.push({
      code: 'IMPORT_FILE_MISSING',
      message: `Missing v8 import ${REAL_IMAGE_APP_MANUAL_IMPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!intake.import_completed) {
    issues.push({
      code: 'IMPORT_NOT_ATTESTED',
      message: `Set import_completed=true in ${REAL_IMAGE_APP_MANUAL_INTAKE_PATH} after real Image App import`,
      severity: 'error',
    });
  }

  if (!hasNonEmptyString(intake.reviewer)) {
    issues.push({
      code: 'REVIEWER_MISSING',
      message: `Set reviewer in ${REAL_IMAGE_APP_MANUAL_INTAKE_PATH}`,
      severity: 'error',
    });
  }

  if (!hasNonEmptyString(intake.reviewed_at)) {
    issues.push({
      code: 'REVIEW_TIMESTAMP_MISSING',
      message: `Set reviewed_at in ${REAL_IMAGE_APP_MANUAL_INTAKE_PATH}`,
      severity: 'error',
    });
  }

  const intakeBySceneKey = new Map(intake.scenes.map((scene) => [scene.test_scene_key, scene]));
  const sceneResults: RealImageAppManualSceneResult[] = [];

  for (const spec of REAL_IMAGE_APP_MANUAL_SCENES) {
    const slot = dataset?.slots[spec.slot_index];
    const graph = graphBySceneId.get(spec.scene_id) ?? null;
    const intakeScene = intakeBySceneKey.get(spec.test_scene_key);
    const outputPath = `${REAL_IMAGE_APP_MANUAL_OUTPUT_DIR}/${spec.output_filename}`;
    const outputFull = path.join(root, outputPath);

    let outputExists = false;
    let outputSha256: string | null = null;
    let outputBytes = 0;
    let simulatedOutputRejected = false;

    if (fs.existsSync(outputFull)) {
      const buffer = fs.readFileSync(outputFull);
      outputBytes = buffer.length;
      outputSha256 = sha256(buffer);
      outputExists = isValidPng(buffer) && outputBytes > 0;
      simulatedOutputRejected = simulatedHashes.has(outputSha256);

      if (!outputExists) {
        issues.push({
          code: 'REAL_OUTPUT_INVALID_PNG',
          message: `${spec.output_filename} is not a valid PNG`,
          severity: 'error',
        });
      }

      if (simulatedOutputRejected) {
        issues.push({
          code: 'SIMULATED_OUTPUT_REJECTED',
          message: `${spec.output_filename} matches a known simulated/pixel-engine output hash`,
          severity: 'error',
        });
      }
    } else {
      issues.push({
        code: 'REAL_OUTPUT_MISSING',
        message: `Missing real Image App output ${outputPath}`,
        severity: 'error',
      });
    }

    if (!intakeScene?.import_success) {
      issues.push({
        code: 'IMPORT_SUCCESS_NOT_ATTESTED',
        message: `${spec.test_scene_key}: set import_success=true in intake after real import`,
        severity: 'error',
      });
    }

    if (!intakeScene?.generation_success) {
      issues.push({
        code: 'GENERATION_SUCCESS_NOT_ATTESTED',
        message: `${spec.test_scene_key}: set generation_success=true in intake after real generation`,
        severity: 'error',
      });
    }

    const review = intakeScene ? buildReviewResult(intakeScene.review) : null;
    if (!review) {
      issues.push({
        code: 'HUMAN_REVIEW_INCOMPLETE',
        message: `${spec.test_scene_key}: all review scores must be numbers between 0 and 1`,
        severity: 'error',
      });
    } else if (!review.passed) {
      issues.push({
        code: 'HUMAN_REVIEW_BELOW_THRESHOLD',
        message: `${spec.test_scene_key}: scene_average_score=${review.scene_average_score} threshold=${REAL_IMAGE_APP_MANUAL_REVIEW_THRESHOLD}`,
        severity: 'error',
      });
    }

    const slotFieldsValid = validateSlotFields(slot);
    if (dataset && !slotFieldsValid) {
      issues.push({
        code: 'IMPORT_SLOT_INVALID',
        message: `${spec.test_scene_key}: v8 slot missing required fields`,
        severity: 'error',
      });
    }

    const importSlot = {
      artStyle: slot?.artStyle ?? copyApprovedOriginalArtStyle(root),
      timeSetting: graph
        ? copyApprovedOriginalTimeSettingPrompt(resolveLockedTimeSettingId(graph), root)
        : (slot?.timeSetting ?? ''),
      scenario: slot?.scenario ?? '',
      character: graph
        ? copySourceOfTruthCharacterFieldFromGraph(graph, root)
        : (slot?.character ?? ''),
    };

    const scenePassed =
      outputExists &&
      !simulatedOutputRejected &&
      Boolean(intakeScene?.import_success) &&
      Boolean(intakeScene?.generation_success) &&
      slotFieldsValid &&
      review !== null &&
      review.passed;

    sceneResults.push({
      test_scene_key: spec.test_scene_key,
      scene_id: spec.scene_id,
      slot_index: spec.slot_index,
      native_import_ref: `${REAL_IMAGE_APP_MANUAL_IMPORT_PATH}#slot_index=${spec.slot_index}`,
      expected_output_path: outputPath,
      output_exists: outputExists,
      output_sha256: outputSha256,
      output_bytes: outputBytes,
      simulated_output_rejected: simulatedOutputRejected,
      import_success: Boolean(intakeScene?.import_success),
      generation_success: Boolean(intakeScene?.generation_success),
      import_slot: importSlot,
      review,
      scene_passed: scenePassed,
    });
  }

  const realOutputCount = sceneResults.filter(
    (scene) => scene.output_exists && !scene.simulated_output_rejected
  ).length;
  const scenesPassed = sceneResults.filter((scene) => scene.scene_passed).length;
  const completedReviews = sceneResults
    .map((scene) => scene.review)
    .filter((review): review is RealImageAppManualReviewResult => review !== null);

  const realApplicationOutputVerified =
    realOutputCount === REAL_IMAGE_APP_MANUAL_SCENES.length &&
    sceneResults.every((scene) => !scene.simulated_output_rejected);

  const humanReviewComplete =
    completedReviews.length === REAL_IMAGE_APP_MANUAL_SCENES.length &&
    completedReviews.every((review) => review.passed);

  const manualValidationComplete =
    intake.import_completed &&
    realApplicationOutputVerified &&
    humanReviewComplete &&
    scenesPassed === REAL_IMAGE_APP_MANUAL_SCENES.length;

  const validationPassed =
    manualValidationComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `real_image_app_manual_report_${Date.now().toString(36)}`,
    phase: REAL_IMAGE_APP_MANUAL_PHASE,
    system_id: REAL_IMAGE_APP_MANUAL_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? REAL_IMAGE_APP_MANUAL_PASS_VERDICT
      : REAL_IMAGE_APP_MANUAL_FAIL_VERDICT,
    validation_passed: validationPassed,
    manual_validation_complete: manualValidationComplete,
    real_application_output_verified: realApplicationOutputVerified,
    human_review_complete: humanReviewComplete,
    native_import_path: REAL_IMAGE_APP_MANUAL_IMPORT_PATH,
    output_directory: REAL_IMAGE_APP_MANUAL_OUTPUT_DIR,
    intake_path: REAL_IMAGE_APP_MANUAL_INTAKE_PATH,
    reviewer: intake.reviewer,
    reviewed_at: intake.reviewed_at,
    manual_test_procedure: REAL_IMAGE_APP_MANUAL_PROCEDURE,
    metrics: {
      scene_count: sceneResults.length,
      scenes_passed: scenesPassed,
      real_output_count: realOutputCount,
      average_artStyle_accuracy: average(
        completedReviews.map((review) => review.artStyle_accuracy)
      ),
      average_character_accuracy: average(
        completedReviews.map((review) => review.character_accuracy)
      ),
      average_timeSetting_accuracy: average(
        completedReviews.map((review) => review.timeSetting_accuracy)
      ),
      average_scenario_accuracy: average(
        completedReviews.map((review) => review.scenario_accuracy)
      ),
      average_overall_replica_quality: average(
        completedReviews.map((review) => review.overall_replica_quality)
      ),
      average_scene_score: average(
        completedReviews.map((review) => review.scene_average_score)
      ),
    },
    scene_results: sceneResults,
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeRealImageAppManualReport(projectRoot?: string): RealImageAppManualReport {
  const root = resolveProjectRoot(projectRoot);
  fs.mkdirSync(path.join(root, REAL_IMAGE_APP_MANUAL_OUTPUT_DIR), { recursive: true });
  const report = runRealImageAppManualValidation(root);
  writeJson(root, REAL_IMAGE_APP_MANUAL_REPORT_PATH, report);
  return report;
}

export {
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  SAFE_CREATE_POLICY,
};
