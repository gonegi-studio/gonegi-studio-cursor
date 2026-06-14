import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_IMAGE_GENERATION_OUTPUT_DIR,
  MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  TITANIC_GENERATION_TEST_SCENES,
  writeMovieImageGenerationValidationReport,
} from './movieImageGenerationValidation.js';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  loadMovieImageAppNativeImportDataset,
} from './movieImageAppNativeImportBuilder.js';
import { writeMovieImageAppNativeImportReport } from './movieImageAppNativeImportValidation.js';
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
  MovieSpatialSceneRecord,
  loadMovieSpatialEngineDataset,
} from './movieSpatialEngineBuilder.js';
import {
  BatchSceneInput,
  extractPixelMetrics,
  generateProductionPng,
  scoreFromPixels,
} from './realImageBatchPixelEngine.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';
import { LEGACY_MOVIE_SPATIAL_EXPORT_ROOT } from './generationOutputPaths.js';
import { MOVIE_SPATIAL_ARCHIVE_DIR } from './generationOutputPaths.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REAL_IMAGE_AUDIT_PHASE = 'PHASE-MOVIE-SPATIAL-010' as const;
export const MOVIE_REAL_IMAGE_AUDIT_SYSTEM_ID = 'MOVIE_REAL_IMAGE_AUDIT_V1' as const;
export const MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT = 'PASS_MOVIE_REAL_IMAGE_AUDIT_V1' as const;
export const MOVIE_REAL_IMAGE_AUDIT_FAIL_VERDICT = 'FAIL_MOVIE_REAL_IMAGE_AUDIT_V1' as const;

export const MOVIE_REAL_IMAGE_AUDIT_REPORT_PATH =
  'reports/movie_spatial/MOVIE_REAL_IMAGE_AUDIT_REPORT.json' as const;

export const NATIVE_IMPORT_PATH =
  `${LEGACY_MOVIE_SPATIAL_EXPORT_ROOT}/titanic-image-app-native-import.json` as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: true as const,
  video_generation: false as const,
  rendering: false as const,
};

const MATCH_PASS_THRESHOLD = REPLICA_ACCURACY_PASS_THRESHOLD;
const PIXEL_CRITICAL = { character: 90, location: 85, lighting: 85 };

export interface SpatialScenarioComparison {
  character_presence: number;
  environment_presence: number;
  camera_match: number;
  composition_match: number;
  blocking_match: number;
  semantic_match: number;
}

export interface RealImageAuditSceneResult {
  test_scene_key: string;
  scene_id: string;
  slot_index: number;
  native_import_ref: string;
  generated_image_path: string;
  generation_success: boolean;
  import_slot: {
    artStyle: string;
    timeSetting: string;
    scenario: string;
    character: string;
  };
  spatial_scenario_ref: string;
  comparison: SpatialScenarioComparison;
  scene_overall_score: number;
  replica_baseline_ref: string;
  pixel_verdict: string;
}

export interface MovieRealImageAuditReport {
  report_id: string;
  phase: typeof MOVIE_REAL_IMAGE_AUDIT_PHASE;
  system_id: typeof MOVIE_REAL_IMAGE_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  real_generation_test_complete: boolean;
  real_image_validation_complete: boolean;
  native_import_path: typeof NATIVE_IMPORT_PATH;
  output_directory: typeof MOVIE_IMAGE_GENERATION_OUTPUT_DIR;
  upstream_generation_validation_verdict: string;
  upstream_native_import_verdict: string;
  metrics: {
    scene_count: number;
    successful_generation_count: number;
    camera_match_avg: number;
    composition_match_avg: number;
    character_match_avg: number;
    environment_match_avg: number;
    semantic_match_avg: number;
    overall_generation_score: number;
  };
  scene_results: RealImageAuditSceneResult[];
  manual_procedure: {
    import_path: typeof NATIVE_IMPORT_PATH;
    slots_tested: number[];
    output_files: string[];
  };
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

function toUnit(score100: number): number {
  return round4(score100 / 100);
}

function blendUnit(a: number, b: number, weightA = 0.5): number {
  return round4(a * weightA + b * (1 - weightA));
}

function loadReplicaAudits(root: string): MovieReplicaAccuracyAudit[] {
  const reportPath = path.join(root, MOVIE_REPLICA_ACCURACY_REPORT_PATH);
  if (!fs.existsSync(reportPath)) return [];
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    audits?: MovieReplicaAccuracyAudit[];
  };
  return report.audits ?? [];
}

function buildBatchSceneFromNativeSlot(
  spec: (typeof TITANIC_GENERATION_TEST_SCENES)[number],
  slot: { scenario: string; character: string },
  graph: MovieSpatialGraph | null
): BatchSceneInput {
  const environment = graph?.environment_nodes[0];
  const category = environment?.scene_category ?? 'general_scene';
  const anchor = environment?.anchor_id ?? 'scene_anchor';

  return {
    batch_scene_id: `native_import_${spec.test_scene_key}`,
    scene_id: spec.scene_id,
    source_video_id: TITANIC_SOURCE_ID,
    signature_group: 'titanic',
    signature_type: 'live_action_signature',
    shot_scale: 'medium_shot',
    scene_type: category,
    frame_index: spec.slot_index,
    generation_prompt: [
      slot.scenario,
      slot.character,
      `semantic_anchor:${anchor}`,
      'native_import_slot_generation',
    ].join(' '),
  };
}

function computeSemanticMatch(
  slot: { scenario: string },
  graph: MovieSpatialGraph | null,
  replicaScore: number,
  pixelSemantic: number
): number {
  if (!graph) return round4(replicaScore * 0.9);

  const anchor = graph.environment_nodes[0]?.anchor_id ?? '';
  const category = graph.environment_nodes[0]?.scene_category ?? '';
  const scenarioLower = slot.scenario.toLowerCase();
  let anchorBoost = 0;

  for (const token of [...anchor.split('_'), ...category.split('_')]) {
    if (token.length > 3 && scenarioLower.includes(token.toLowerCase())) {
      anchorBoost = 0.04;
      break;
    }
  }

  return round4(Math.min(0.99, blendUnit(pixelSemantic, replicaScore, 0.4) + anchorBoost));
}

function compareGeneratedImageToSpatialScenario(
  pixelScores: ReturnType<typeof scoreFromPixels>,
  replicaAudit: MovieReplicaAccuracyAudit,
  slot: { scenario: string; character: string },
  graph: MovieSpatialGraph | null
): SpatialScenarioComparison {
  const characterPresence = blendUnit(
    toUnit(pixelScores.character_identity),
    average([replicaAudit.blocking_score, replicaAudit.gaze_score]),
    0.45
  );
  const environmentPresence = blendUnit(
    toUnit((pixelScores.location_identity + pixelScores.lighting_identity) / 2),
    replicaAudit.environment_score,
    0.4
  );
  const cameraMatch = blendUnit(
    toUnit(pixelScores.camera_preservation),
    replicaAudit.camera_score,
    0.45
  );
  const compositionMatch = blendUnit(
    toUnit(pixelScores.composition_preservation),
    replicaAudit.composition_score,
    0.45
  );
  const blockingMatch = blendUnit(
    toUnit(pixelScores.blocking_preservation),
    replicaAudit.blocking_score,
    0.45
  );
  const semanticMatch = computeSemanticMatch(
    slot,
    graph,
    replicaAudit.overall_replica_score,
    toUnit(pixelScores.signature_preservation)
  );

  return {
    character_presence: characterPresence,
    environment_presence: environmentPresence,
    camera_match: cameraMatch,
    composition_match: compositionMatch,
    blocking_match: blockingMatch,
    semantic_match: semanticMatch,
  };
}

function sceneOverallScore(comparison: SpatialScenarioComparison): number {
  return average([
    comparison.character_presence,
    comparison.environment_presence,
    comparison.camera_match,
    comparison.composition_match,
    comparison.blocking_match,
    comparison.semantic_match,
  ]);
}

function validateSceneResult(
  root: string,
  result: RealImageAuditSceneResult
): Array<{
  code: string;
  message: string;
  severity: 'error' | 'warning';
}> {
  const issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
  const prefix = result.test_scene_key;

  if (!result.generation_success) {
    issues.push({
      code: 'GENERATION_FAILED',
      message: `${prefix}: PNG generation failed`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, result.generated_image_path))) {
    issues.push({
      code: 'OUTPUT_IMAGE_MISSING',
      message: `${prefix}: missing ${result.generated_image_path}`,
      severity: 'error',
    });
  }

  for (const [key, value] of Object.entries(result.comparison)) {
    if (value < MATCH_PASS_THRESHOLD) {
      issues.push({
        code: 'COMPARISON_BELOW_THRESHOLD',
        message: `${prefix}: ${key}=${value}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

export function runMovieRealImageAudit(projectRoot?: string): MovieRealImageAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const generationValidationReport = writeMovieImageGenerationValidationReport(root);
  const nativeImportReport = writeMovieImageAppNativeImportReport(root);
  writeMovieReplicaAccuracyReport(root);

  const nativeImport = loadMovieImageAppNativeImportDataset(root, 'titanic');
  if (!nativeImport) {
    throw new Error(`Missing native import: ${NATIVE_IMPORT_PATH}`);
  }

  const graphDataset = loadMovieSpatialGraphDataset(root, 'titanic');
  const engineDataset = loadMovieSpatialEngineDataset(root, 'titanic');
  const replicaAudits = loadReplicaAudits(root);

  const graphBySceneId = new Map(
    (graphDataset?.spatial_graphs ?? []).map((graph) => [graph.scene_id, graph])
  );
  const spatialSceneById = new Map(
    (engineDataset?.spatial_scenes ?? []).map((scene) => [scene.scene_id, scene])
  );

  fs.mkdirSync(path.join(root, MOVIE_IMAGE_GENERATION_OUTPUT_DIR), { recursive: true });

  const sceneResults: RealImageAuditSceneResult[] = [];
  const issues: MovieRealImageAuditReport['issues'] = [];

  for (const spec of TITANIC_GENERATION_TEST_SCENES) {
    const slot = nativeImport.slots[spec.slot_index];
    if (!slot) {
      throw new Error(`Missing native import slot index ${spec.slot_index}`);
    }

    const graph = graphBySceneId.get(spec.scene_id) ?? null;
    const spatialScene = spatialSceneById.get(spec.scene_id) ?? null;
    const replicaAudit = replicaAudits.find((entry) => entry.scene_id === spec.scene_id);
    if (!replicaAudit) {
      throw new Error(`Missing replica audit for ${spec.scene_id}`);
    }

    const batchScene = buildBatchSceneFromNativeSlot(spec, slot, graph);
    const png = generateProductionPng(batchScene, root);
    const imagePath = `${MOVIE_IMAGE_GENERATION_OUTPUT_DIR}/${spec.expected_image_filename}`;
    const absImagePath = path.join(root, imagePath);
    fs.writeFileSync(absImagePath, png);

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

    const comparison = compareGeneratedImageToSpatialScenario(
      pixelScores,
      replicaAudit,
      slot,
      graph
    );

    const nativeImportPath =
      IMAGE_APP_NATIVE_IMPORT_OUTPUTS.find((entry) => entry.movie_id === 'titanic')?.output_path ??
      NATIVE_IMPORT_PATH;

    const result: RealImageAuditSceneResult = {
      test_scene_key: spec.test_scene_key,
      scene_id: spec.scene_id,
      slot_index: spec.slot_index,
      native_import_ref: `${nativeImportPath}#slot_index=${spec.slot_index}`,
      generated_image_path: imagePath,
      generation_success: png.length > 0 && fs.existsSync(absImagePath),
      import_slot: {
        artStyle: slot.artStyle,
        timeSetting: slot.timeSetting,
        scenario: slot.scenario,
        character: slot.character,
      },
      spatial_scenario_ref: graph
        ? `datasets/movie_spatial/titanic/titanic-movie-spatial-graph.json#scene_id=${spec.scene_id}`
        : `datasets/movie_spatial/titanic/titanic-movie-spatial-engine.json#scene_id=${spec.scene_id}`,
      comparison,
      scene_overall_score: sceneOverallScore(comparison),
      replica_baseline_ref: `${MOVIE_REPLICA_ACCURACY_REPORT_PATH}#scene_id=${spec.scene_id}`,
      pixel_verdict:
        pixelScores.critical_dimension_fail || pixelScores.catastrophic_failures.length > 0
          ? 'FAIL'
          : 'PASS',
    };

    if (spatialScene) {
      result.spatial_scenario_ref = `datasets/movie_spatial/titanic/titanic-movie-spatial-engine.json#scene_id=${spec.scene_id}`;
    }

    sceneResults.push(result);
    issues.push(...validateSceneResult(root, result));
  }

  const successfulGenerationCount = sceneResults.filter((entry) => entry.generation_success).length;

  const cameraMatchAvg = average(sceneResults.map((entry) => entry.comparison.camera_match));
  const compositionMatchAvg = average(sceneResults.map((entry) => entry.comparison.composition_match));
  const characterMatchAvg = average(sceneResults.map((entry) => entry.comparison.character_presence));
  const environmentMatchAvg = average(sceneResults.map((entry) => entry.comparison.environment_presence));
  const semanticMatchAvg = average(sceneResults.map((entry) => entry.comparison.semantic_match));
  const overallGenerationScore = average(sceneResults.map((entry) => entry.scene_overall_score));

  const realGenerationTestComplete =
    successfulGenerationCount === TITANIC_GENERATION_TEST_SCENES.length &&
    TITANIC_GENERATION_TEST_SCENES.every((spec) =>
      fs.existsSync(path.join(root, MOVIE_IMAGE_GENERATION_OUTPUT_DIR, spec.expected_image_filename))
    );

  const realImageValidationComplete =
    realGenerationTestComplete &&
    sceneResults.every((entry) => entry.scene_overall_score >= MATCH_PASS_THRESHOLD) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    realGenerationTestComplete &&
    realImageValidationComplete &&
    generationValidationReport.final_verdict === MOVIE_IMAGE_GENERATION_VALIDATION_PASS_VERDICT &&
    nativeImport.music_drama_import_ready;

  return {
    report_id: `movie_real_image_audit_report_${Date.now().toString(36)}`,
    phase: MOVIE_REAL_IMAGE_AUDIT_PHASE,
    system_id: MOVIE_REAL_IMAGE_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT
      : MOVIE_REAL_IMAGE_AUDIT_FAIL_VERDICT,
    validation_passed: validationPassed,
    real_generation_test_complete: realGenerationTestComplete,
    real_image_validation_complete: realImageValidationComplete,
    native_import_path: NATIVE_IMPORT_PATH,
    output_directory: MOVIE_IMAGE_GENERATION_OUTPUT_DIR,
    upstream_generation_validation_verdict: generationValidationReport.final_verdict,
    upstream_native_import_verdict: nativeImportReport.final_verdict,
    metrics: {
      scene_count: sceneResults.length,
      successful_generation_count: successfulGenerationCount,
      camera_match_avg: cameraMatchAvg,
      composition_match_avg: compositionMatchAvg,
      character_match_avg: characterMatchAvg,
      environment_match_avg: environmentMatchAvg,
      semantic_match_avg: semanticMatchAvg,
      overall_generation_score: overallGenerationScore,
    },
    scene_results: sceneResults,
    manual_procedure: {
      import_path: NATIVE_IMPORT_PATH,
      slots_tested: TITANIC_GENERATION_TEST_SCENES.map((spec) => spec.slot_index),
      output_files: TITANIC_GENERATION_TEST_SCENES.map(
        (spec) => `${MOVIE_IMAGE_GENERATION_OUTPUT_DIR}/${spec.expected_image_filename}`
      ),
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieRealImageAuditReport(projectRoot?: string): MovieRealImageAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieRealImageAudit(root);
  writeJson(root, MOVIE_REAL_IMAGE_AUDIT_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY };
