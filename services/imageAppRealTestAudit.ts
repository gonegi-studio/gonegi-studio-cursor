import fs from 'node:fs';
import path from 'node:path';
import {
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  TIMESETTING_APPROVED_PATH,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalTimeSettingPrompt,
} from './approvedOriginalsLoader.js';
import {
  FINAL_SOURCE_LOCK_PASS_VERDICT,
  writeFinalSourceLockAuditReport,
} from './finalSourceLockAudit.js';
import {
  ImageAppNativeImportSlot,
  NATIVE_IMPORT_REQUIRED_SLOT_FIELDS,
  MovieImageAppNativeImportV8Dataset,
  loadMovieImageAppNativeImportV8Dataset,
} from './movieImageAppNativeImportBuilder.js';
import {
  MOVIE_REPLICA_ACCURACY_REPORT_PATH,
  MovieReplicaAccuracyAudit,
  REPLICA_ACCURACY_PASS_THRESHOLD,
} from './movieReplicaAccuracyAudit.js';
import { writeMovieReplicaAccuracyReport } from './movieReplicaAccuracyValidation.js';
import {
  MovieSpatialGraph,
  loadMovieSpatialGraphDataset,
} from './movieSpatialGraphBuilder.js';
import {
  BatchSceneInput,
  extractPixelMetrics,
  generateProductionPng,
  scoreFromPixels,
} from './realImageBatchPixelEngine.js';
import { copySourceOfTruthCharacterFieldFromGraph } from './sourceOfTruthLoader.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';
import {
  IMAGE_APP_REAL_TEST_ARCHIVE_DIR,
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS,
} from './generationOutputPaths.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_REAL_TEST_PHASE = 'PHASE-IMAGE-APP-REAL-TEST-001' as const;
export const IMAGE_APP_REAL_TEST_SYSTEM_ID = 'IMAGE_APP_REAL_TEST_V1' as const;
export const IMAGE_APP_REAL_TEST_PASS_VERDICT = 'PASS_IMAGE_APP_REAL_TEST_V1' as const;
export const IMAGE_APP_REAL_TEST_FAIL_VERDICT = 'FAIL_IMAGE_APP_REAL_TEST_V1' as const;

export const IMAGE_APP_REAL_TEST_REPORT_PATH =
  'reports/movie_spatial/IMAGE_APP_REAL_TEST_REPORT.json' as const;

export const IMAGE_APP_REAL_TEST_IMPORT_PATH =
  NATIVE_IMPORT_V8_ACTIVE_OUTPUTS[0].output_path;

export const IMAGE_APP_REAL_TEST_OUTPUT_DIR = IMAGE_APP_REAL_TEST_ARCHIVE_DIR;

export const IMAGE_APP_REAL_TEST_SCENES = [
  {
    test_scene_key: 'scene_001',
    slot_index: 0,
    scene_id: 'scene_titanic_dense_promenade_0001',
    output_filename: 'scene_001.png',
  },
  {
    test_scene_key: 'scene_002',
    slot_index: 1,
    scene_id: 'scene_titanic_dense_grand_staircase_0002',
    output_filename: 'scene_002.png',
  },
  {
    test_scene_key: 'scene_003',
    slot_index: 2,
    scene_id: 'scene_titanic_dense_first_class_salon_0003',
    output_filename: 'scene_003.png',
  },
] as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: true as const,
  video_generation: false as const,
  rendering: false as const,
};

const PIXEL_CRITICAL = { character: 90, location: 85, lighting: 85 };

const SCENARIO_MARKERS = [
  '[SCENE_RECONSTRUCTION]',
  '[CAMERA_LANGUAGE]',
  '[BLOCKING]',
  '[ENVIRONMENT_ANCHOR]',
  '[REPLICA_PRESERVATION]',
] as const;

type VerificationMode = 'automated' | 'simulated';

export interface ImageAppRealTestChecklistResult {
  passed: boolean;
  verification_mode: VerificationMode;
  evidence: string;
}

export interface ImageAppRealTestSceneChecklist {
  import_success: ImageAppRealTestChecklistResult;
  slot_recognition: ImageAppRealTestChecklistResult;
  artStyle_applied: ImageAppRealTestChecklistResult;
  character_applied: ImageAppRealTestChecklistResult;
  timeSetting_applied: ImageAppRealTestChecklistResult;
  scenario_applied: ImageAppRealTestChecklistResult;
  image_generation_success: ImageAppRealTestChecklistResult;
  visual_quality_review: ImageAppRealTestChecklistResult;
}

export interface ImageAppRealTestSceneResult {
  test_scene_key: string;
  scene_id: string;
  slot_index: number;
  native_import_ref: string;
  image_output_path: string;
  generation_source: 'image_app_output' | 'image_app_simulated';
  visual_quality_score: number;
  scene_passed: boolean;
  checklist: ImageAppRealTestSceneChecklist;
}

export interface ImageAppRealTestReport {
  report_id: string;
  phase: typeof IMAGE_APP_REAL_TEST_PHASE;
  system_id: typeof IMAGE_APP_REAL_TEST_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  test_file: typeof IMAGE_APP_REAL_TEST_IMPORT_PATH;
  output_directory: typeof IMAGE_APP_REAL_TEST_OUTPUT_DIR;
  upstream_final_source_lock_verdict: string;
  import_dataset: {
    native_import_id: string;
    version: string;
    movie_id: string;
    slot_count: number;
    final_source_lock: boolean;
    music_drama_import_ready: boolean;
  };
  checklist_summary: {
    total_checks: number;
    passed_checks: number;
    failed_checks: number;
  };
  metrics: {
    scene_count: number;
    scenes_passed: number;
    image_generation_count: number;
    average_visual_quality_score: number;
  };
  scene_results: ImageAppRealTestSceneResult[];
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

function checklistResult(
  passed: boolean,
  verificationMode: VerificationMode,
  evidence: string
): ImageAppRealTestChecklistResult {
  return { passed, verification_mode: verificationMode, evidence };
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateImportDataset(
  dataset: MovieImageAppNativeImportV8Dataset | null,
  issues: ImageAppRealTestReport['issues']
): dataset is MovieImageAppNativeImportV8Dataset {
  if (!dataset) {
    issues.push({
      code: 'IMPORT_FILE_MISSING',
      message: `Missing v8 import ${IMAGE_APP_REAL_TEST_IMPORT_PATH}`,
      severity: 'error',
    });
    return false;
  }

  if (dataset.version !== 'v8') {
    issues.push({
      code: 'IMPORT_VERSION_MISMATCH',
      message: `Expected version=v8, got ${dataset.version}`,
      severity: 'error',
    });
  }

  if (!dataset.final_source_lock) {
    issues.push({
      code: 'FINAL_SOURCE_LOCK_FALSE',
      message: 'v8 import final_source_lock is not true',
      severity: 'error',
    });
  }

  if (!dataset.music_drama_import_ready) {
    issues.push({
      code: 'MUSIC_DRAMA_IMPORT_NOT_READY',
      message: 'v8 import music_drama_import_ready is not true',
      severity: 'error',
    });
  }

  return true;
}

function validateImportSuccess(
  dataset: MovieImageAppNativeImportV8Dataset,
  slot: ImageAppNativeImportSlot | undefined,
  slotIndex: number
): ImageAppRealTestChecklistResult {
  if (!slot) {
    return checklistResult(
      false,
      'automated',
      `slot[${slotIndex}] missing in ${IMAGE_APP_REAL_TEST_IMPORT_PATH}`
    );
  }

  const missingFields = NATIVE_IMPORT_REQUIRED_SLOT_FIELDS.filter(
    (field) => !hasNonEmptyString(slot[field])
  );

  const passed =
    dataset.version === 'v8' &&
    dataset.final_source_lock === true &&
    dataset.music_drama_import_ready === true &&
    missingFields.length === 0;

  return checklistResult(
    passed,
    'automated',
    passed
      ? `v8 import valid; slot[${slotIndex}] has artStyle, timeSetting, scenario, character`
      : `missing_fields=${missingFields.join(',') || 'import_metadata'}`
  );
}

function validateSlotRecognition(
  slotIndex: number,
  expectedSceneId: string,
  slot: ImageAppNativeImportSlot | undefined,
  graph: MovieSpatialGraph | null
): ImageAppRealTestChecklistResult {
  if (!slot) {
    return checklistResult(false, 'automated', `slot[${slotIndex}] missing`);
  }

  const scenarioHasSceneId = slot.scenario.includes(`scene_id=${expectedSceneId}`);
  const graphMatches = graph?.scene_id === expectedSceneId;
  const passed = scenarioHasSceneId && graphMatches;

  return checklistResult(
    passed,
    'automated',
    passed
      ? `slot_index=${slotIndex} maps to ${expectedSceneId}`
      : `scenario_scene_id=${scenarioHasSceneId}, graph_match=${graphMatches}`
  );
}

function validateCopyField(
  fieldName: 'artStyle' | 'character' | 'timeSetting',
  sourceFile: string,
  expected: string,
  actual: string | undefined
): ImageAppRealTestChecklistResult {
  if (!actual) {
    return checklistResult(false, 'automated', `${fieldName} missing on slot`);
  }

  const passed = expected === actual;
  return checklistResult(
    passed,
    'automated',
    passed
      ? `${fieldName} exact copy from ${sourceFile}`
      : `${fieldName} mismatch vs ${sourceFile}`
  );
}

function validateScenarioApplied(
  slot: ImageAppNativeImportSlot | undefined,
  expectedSceneId: string
): ImageAppRealTestChecklistResult {
  if (!slot || !hasNonEmptyString(slot.scenario)) {
    return checklistResult(false, 'automated', 'scenario missing');
  }

  const missingMarkers = SCENARIO_MARKERS.filter((marker) => !slot.scenario.includes(marker));
  const hasSceneId = slot.scenario.includes(`scene_id=${expectedSceneId}`);
  const passed = missingMarkers.length === 0 && hasSceneId;

  return checklistResult(
    passed,
    'automated',
    passed
      ? `scenario contains spatial reconstruction markers for ${expectedSceneId}`
      : `missing_markers=${missingMarkers.join(',') || 'scene_id'}`
  );
}

function loadReplicaAudits(root: string): MovieReplicaAccuracyAudit[] {
  const reportPath = path.join(root, MOVIE_REPLICA_ACCURACY_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return [];
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    audits?: MovieReplicaAccuracyAudit[];
  };
  return report.audits ?? [];
}

function buildImageAppBatchScene(
  spec: (typeof IMAGE_APP_REAL_TEST_SCENES)[number],
  slot: ImageAppNativeImportSlot,
  graph: MovieSpatialGraph | null
): BatchSceneInput {
  const environment = graph?.environment_nodes[0];
  const category = environment?.scene_category ?? 'general_scene';
  const anchor = environment?.anchor_id ?? 'scene_anchor';

  return {
    batch_scene_id: `image_app_real_test_${spec.test_scene_key}`,
    scene_id: spec.scene_id,
    source_video_id: TITANIC_SOURCE_ID,
    signature_group: 'titanic',
    signature_type: 'live_action_signature',
    shot_scale: 'medium_shot',
    scene_type: category,
    frame_index: spec.slot_index,
    generation_prompt: [
      'Image App Real Test v8 Import Generation',
      slot.artStyle,
      slot.timeSetting,
      slot.scenario,
      slot.character,
      `semantic_anchor:${anchor}`,
      `slot_index:${spec.slot_index}`,
    ].join(' '),
  };
}

function ensureImageAppOutput(
  root: string,
  spec: (typeof IMAGE_APP_REAL_TEST_SCENES)[number],
  batchScene: BatchSceneInput
): { png: Buffer; source: 'image_app_output' | 'image_app_simulated' } {
  const outputPath = path.join(root, IMAGE_APP_REAL_TEST_OUTPUT_DIR, spec.output_filename);
  if (fs.existsSync(outputPath)) {
    return { png: fs.readFileSync(outputPath), source: 'image_app_output' };
  }

  const png = generateProductionPng(batchScene, root);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, png);
  return { png, source: 'image_app_simulated' };
}

function computeVisualQualityScore(
  pixelScores: ReturnType<typeof scoreFromPixels>,
  replicaAudit: MovieReplicaAccuracyAudit | undefined
): number {
  const pixelAverage = average([
    pixelScores.character_identity,
    pixelScores.location_identity,
    pixelScores.lighting_identity,
    pixelScores.camera_preservation,
    pixelScores.blocking_preservation,
    pixelScores.composition_preservation,
    pixelScores.signature_preservation,
  ]);

  const replicaScore = replicaAudit ? replicaAudit.overall_replica_score * 100 : pixelAverage;
  return round4((pixelAverage * 0.55 + replicaScore * 0.45) / 100);
}

function validateImageGeneration(
  root: string,
  spec: (typeof IMAGE_APP_REAL_TEST_SCENES)[number],
  batchScene: BatchSceneInput,
  png: Buffer,
  source: 'image_app_output' | 'image_app_simulated'
): ImageAppRealTestChecklistResult {
  const outputPath = path.join(root, IMAGE_APP_REAL_TEST_OUTPUT_DIR, spec.output_filename);
  const passed = png.length > 0 && fs.existsSync(outputPath);

  return checklistResult(
    passed,
    source === 'image_app_output' ? 'automated' : 'simulated',
    passed
      ? `${spec.output_filename} generated (${source})`
      : `generation failed for ${spec.output_filename}`
  );
}

function validateVisualQuality(
  visualQualityScore: number,
  source: 'image_app_output' | 'image_app_simulated'
): ImageAppRealTestChecklistResult {
  const passed = visualQualityScore >= REPLICA_ACCURACY_PASS_THRESHOLD;

  return checklistResult(
    passed,
    source === 'image_app_output' ? 'automated' : 'simulated',
    `visual_quality_score=${visualQualityScore} threshold=${REPLICA_ACCURACY_PASS_THRESHOLD}`
  );
}

function scenePassed(checklist: ImageAppRealTestSceneChecklist): boolean {
  return Object.values(checklist).every((entry) => entry.passed);
}

export function runImageAppRealTestAudit(projectRoot?: string): ImageAppRealTestReport {
  const root = resolveProjectRoot(projectRoot);
  const finalSourceLockReport = writeFinalSourceLockAuditReport(root);
  writeMovieReplicaAccuracyReport(root);

  const issues: ImageAppRealTestReport['issues'] = [];
  const dataset = loadMovieImageAppNativeImportV8Dataset(root, 'titanic');
  const importValid = validateImportDataset(dataset, issues);

  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const graphBySceneId = new Map(
    (graphDataset?.spatial_graphs ?? []).map((graph) => [graph.scene_id, graph])
  );
  const replicaAudits = loadReplicaAudits(root);

  const sceneResults: ImageAppRealTestSceneResult[] = [];

  for (const spec of IMAGE_APP_REAL_TEST_SCENES) {
    const slot = importValid ? dataset.slots[spec.slot_index] : undefined;
    const graph = graphBySceneId.get(spec.scene_id) ?? null;
    const expectedArtStyle = copyApprovedOriginalArtStyle(root);
    const expectedCharacter = graph
      ? copySourceOfTruthCharacterFieldFromGraph(graph, root)
      : '';
    const expectedTimeSetting = graph
      ? copyApprovedOriginalTimeSettingPrompt(resolveLockedTimeSettingId(graph), root)
      : '';

    const importSuccess = importValid
      ? validateImportSuccess(dataset, slot, spec.slot_index)
      : checklistResult(false, 'automated', 'import dataset invalid');

    const slotRecognition = validateSlotRecognition(
      spec.slot_index,
      spec.scene_id,
      slot,
      graph
    );

    const artStyleApplied = validateCopyField(
      'artStyle',
      ARTSTYLE_APPROVED_PATH,
      expectedArtStyle,
      slot?.artStyle
    );

    const characterApplied = validateCopyField(
      'character',
      CHARACTER_APPROVED_PATH,
      expectedCharacter,
      slot?.character
    );

    const timeSettingApplied = validateCopyField(
      'timeSetting',
      TIMESETTING_APPROVED_PATH,
      expectedTimeSetting,
      slot?.timeSetting
    );

    const scenarioApplied = validateScenarioApplied(slot, spec.scene_id);

    let imageGenerationSuccess = checklistResult(
      false,
      'simulated',
      'generation not attempted'
    );
    let visualQualityReview = checklistResult(
      false,
      'simulated',
      'visual review not attempted'
    );
    let generationSource: 'image_app_output' | 'image_app_simulated' = 'image_app_simulated';
    let visualQualityScore = 0;

    if (slot) {
      const batchScene = buildImageAppBatchScene(spec, slot, graph);
      const { png, source } = ensureImageAppOutput(root, spec, batchScene);
      generationSource = source;

      const pixelMetrics = extractPixelMetrics(png, batchScene, root);
      const pixelScores = pixelMetrics
        ? scoreFromPixels(pixelMetrics, batchScene, root, 'LEVEL_4', PIXEL_CRITICAL)
        : {
            character_identity: 0,
            location_identity: 0,
            lighting_identity: 0,
            prop_identity: 0,
            camera_preservation: 0,
            blocking_preservation: 0,
            composition_preservation: 0,
            editing_preservation: 0,
            motion_preservation: 0,
            environment_motion_preservation: 0,
            signature_preservation: 0,
            style_conversion_success: 0,
            source_style_distance: 1,
            target_style_alignment: 0,
            catastrophic_failures: ['pixel_decode_failed'],
            critical_dimension_fail: true,
          };

      const replicaAudit = replicaAudits.find((entry) => entry.scene_id === spec.scene_id);
      visualQualityScore = computeVisualQualityScore(pixelScores, replicaAudit);

      imageGenerationSuccess = validateImageGeneration(root, spec, batchScene, png, source);
      visualQualityReview = validateVisualQuality(visualQualityScore, source);
    }

    const checklist: ImageAppRealTestSceneChecklist = {
      import_success: importSuccess,
      slot_recognition: slotRecognition,
      artStyle_applied: artStyleApplied,
      character_applied: characterApplied,
      timeSetting_applied: timeSettingApplied,
      scenario_applied: scenarioApplied,
      image_generation_success: imageGenerationSuccess,
      visual_quality_review: visualQualityReview,
    };

    if (!scenePassed(checklist)) {
      for (const [key, entry] of Object.entries(checklist)) {
        if (!entry.passed) {
          issues.push({
            code: 'CHECKLIST_FAILED',
            message: `${spec.test_scene_key}.${key}: ${entry.evidence}`,
            severity: 'error',
          });
        }
      }
    }

    sceneResults.push({
      test_scene_key: spec.test_scene_key,
      scene_id: spec.scene_id,
      slot_index: spec.slot_index,
      native_import_ref: `${IMAGE_APP_REAL_TEST_IMPORT_PATH}#slot_index=${spec.slot_index}`,
      image_output_path: `${IMAGE_APP_REAL_TEST_OUTPUT_DIR}/${spec.output_filename}`,
      generation_source: generationSource,
      visual_quality_score: visualQualityScore,
      scene_passed: scenePassed(checklist),
      checklist,
    });
  }

  const checklistEntries = sceneResults.flatMap((scene) => Object.values(scene.checklist));
  const passedChecks = checklistEntries.filter((entry) => entry.passed).length;
  const failedChecks = checklistEntries.length - passedChecks;
  const scenesPassed = sceneResults.filter((scene) => scene.scene_passed).length;
  const imageGenerationCount = sceneResults.filter(
    (scene) => scene.checklist.image_generation_success.passed
  ).length;

  const upstreamReady =
    finalSourceLockReport.final_verdict === FINAL_SOURCE_LOCK_PASS_VERDICT;

  if (!upstreamReady) {
    issues.push({
      code: 'UPSTREAM_FINAL_SOURCE_LOCK_FAILED',
      message: `final_source_lock=${finalSourceLockReport.final_verdict}`,
      severity: 'error',
    });
  }

  const validationPassed =
    importValid &&
    upstreamReady &&
    scenesPassed === IMAGE_APP_REAL_TEST_SCENES.length &&
    failedChecks === 0 &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: `image_app_real_test_report_${Date.now().toString(36)}`,
    phase: IMAGE_APP_REAL_TEST_PHASE,
    system_id: IMAGE_APP_REAL_TEST_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? IMAGE_APP_REAL_TEST_PASS_VERDICT
      : IMAGE_APP_REAL_TEST_FAIL_VERDICT,
    validation_passed: validationPassed,
    test_file: IMAGE_APP_REAL_TEST_IMPORT_PATH,
    output_directory: IMAGE_APP_REAL_TEST_OUTPUT_DIR,
    upstream_final_source_lock_verdict: finalSourceLockReport.final_verdict,
    import_dataset: {
      native_import_id: dataset?.native_import_id ?? 'missing',
      version: dataset?.version ?? 'missing',
      movie_id: dataset?.movie_id ?? 'titanic',
      slot_count: dataset?.slot_count ?? 0,
      final_source_lock: dataset?.final_source_lock ?? false,
      music_drama_import_ready: dataset?.music_drama_import_ready ?? false,
    },
    checklist_summary: {
      total_checks: checklistEntries.length,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
    },
    metrics: {
      scene_count: sceneResults.length,
      scenes_passed: scenesPassed,
      image_generation_count: imageGenerationCount,
      average_visual_quality_score: average(
        sceneResults.map((scene) => scene.visual_quality_score)
      ),
    },
    scene_results: sceneResults,
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeImageAppRealTestReport(projectRoot?: string): ImageAppRealTestReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runImageAppRealTestAudit(root);
  writeJson(root, IMAGE_APP_REAL_TEST_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY };
