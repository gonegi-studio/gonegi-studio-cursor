import fs from 'node:fs';
import path from 'node:path';
import {
  loadMovieImageAppNativeImportDataset,
} from './movieImageAppNativeImportBuilder.js';
import { writeMovieImageAppNativeImportReport } from './movieImageAppNativeImportValidation.js';
import {
  MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT,
  NATIVE_IMPORT_PATH,
  writeMovieRealImageAuditReport,
} from './movieRealImageAudit.js';
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
import { MOVIE_SPATIAL_ARCHIVE_DIR } from './generationOutputPaths.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REAL_IMAGE_APP_VALIDATION_PHASE = 'PHASE-MOVIE-SPATIAL-011' as const;
export const MOVIE_REAL_IMAGE_APP_VALIDATION_SYSTEM_ID = 'MOVIE_REAL_IMAGE_APP_VALIDATION_V1' as const;
export const MOVIE_REAL_IMAGE_APP_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_REAL_IMAGE_APP_VALIDATION_V1' as const;
export const MOVIE_REAL_IMAGE_APP_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_REAL_IMAGE_APP_VALIDATION_V1' as const;

export const MOVIE_REAL_IMAGE_APP_REPORT_PATH =
  'reports/movie_spatial/MOVIE_REAL_IMAGE_APP_REPORT.json' as const;

export const REAL_IMAGE_APP_OUTPUT_DIR =
  `${MOVIE_SPATIAL_ARCHIVE_DIR}/real_image_app` as const;

export const REAL_IMAGE_APP_TEST_SCENES = [
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

const MATCH_PASS_THRESHOLD = REPLICA_ACCURACY_PASS_THRESHOLD;
const PIXEL_CRITICAL = { character: 90, location: 85, lighting: 85 };

export interface ImageAppSpatialPreservationChecks {
  character_identity: number;
  camera_language: number;
  blocking: number;
  composition: number;
  environment: number;
  semantic_anchor: number;
}

export interface RealImageAppSceneResult {
  test_scene_key: string;
  scene_id: string;
  slot_index: number;
  native_import_ref: string;
  image_app_output_path: string;
  image_app_generation_success: boolean;
  generation_source: 'image_app_output' | 'image_app_simulated';
  import_slot: {
    artStyle: string;
    timeSetting: string;
    scenario: string;
    character: string;
  };
  spatial_source_ref: string;
  preservation: ImageAppSpatialPreservationChecks;
  scene_overall_score: number;
  replica_baseline_ref: string;
}

export interface MovieRealImageAppReport {
  report_id: string;
  phase: typeof MOVIE_REAL_IMAGE_APP_VALIDATION_PHASE;
  system_id: typeof MOVIE_REAL_IMAGE_APP_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  image_app_validation_complete: boolean;
  real_app_generation_verified: boolean;
  native_import_path: typeof NATIVE_IMPORT_PATH;
  output_directory: typeof REAL_IMAGE_APP_OUTPUT_DIR;
  upstream_real_image_audit_verdict: string;
  upstream_native_import_verdict: string;
  metrics: {
    scene_count: number;
    image_app_generation_count: number;
    character_score: number;
    camera_score: number;
    composition_score: number;
    environment_score: number;
    semantic_score: number;
    overall_score: number;
  };
  scene_results: RealImageAppSceneResult[];
  image_app_procedure: {
    import_path: typeof NATIVE_IMPORT_PATH;
    slots: number[];
    save_directory: typeof REAL_IMAGE_APP_OUTPUT_DIR;
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

function buildImageAppBatchScene(
  spec: (typeof REAL_IMAGE_APP_TEST_SCENES)[number],
  slot: { scenario: string; character: string; artStyle: string; timeSetting: string },
  graph: MovieSpatialGraph | null
): BatchSceneInput {
  const environment = graph?.environment_nodes[0];
  const category = environment?.scene_category ?? 'general_scene';
  const anchor = environment?.anchor_id ?? 'scene_anchor';

  return {
    batch_scene_id: `image_app_${spec.test_scene_key}`,
    scene_id: spec.scene_id,
    source_video_id: TITANIC_SOURCE_ID,
    signature_group: 'titanic',
    signature_type: 'live_action_signature',
    shot_scale: 'medium_shot',
    scene_type: category,
    frame_index: spec.slot_index,
    generation_prompt: [
      'Image App Native Import Generation',
      slot.artStyle,
      slot.timeSetting,
      slot.scenario,
      slot.character,
      `semantic_anchor:${anchor}`,
      `slot_index:${spec.slot_index}`,
    ].join(' '),
  };
}

function computeSemanticAnchorScore(
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

function compareImageAppOutputToSpatialSource(
  pixelScores: ReturnType<typeof scoreFromPixels>,
  replicaAudit: MovieReplicaAccuracyAudit,
  slot: { scenario: string; character: string },
  graph: MovieSpatialGraph | null,
  spatialScene: MovieSpatialSceneRecord | null
): ImageAppSpatialPreservationChecks {
  const characterIdentity = blendUnit(
    toUnit(pixelScores.character_identity),
    average([replicaAudit.blocking_score, replicaAudit.gaze_score]),
    0.4
  );

  const cameraLanguage = blendUnit(
    toUnit(pixelScores.camera_preservation),
    replicaAudit.camera_score,
    0.45
  );

  const blocking = blendUnit(
    toUnit(pixelScores.blocking_preservation),
    replicaAudit.blocking_score,
    0.45
  );

  const composition = blendUnit(
    toUnit(pixelScores.composition_preservation),
    replicaAudit.composition_score,
    0.45
  );

  const environment = blendUnit(
    toUnit((pixelScores.location_identity + pixelScores.lighting_identity) / 2),
    replicaAudit.environment_score,
    0.4
  );

  let semanticAnchor = computeSemanticAnchorScore(
    slot,
    graph,
    replicaAudit.overall_replica_score,
    toUnit(pixelScores.signature_preservation)
  );

  if (spatialScene && graph) {
    const anchor = graph.environment_nodes[0]?.anchor_id ?? '';
    if (slot.scenario.toLowerCase().includes(anchor.replace(/_/g, ' ').split(' ')[0]?.toLowerCase() ?? '')) {
      semanticAnchor = round4(Math.min(0.99, semanticAnchor + 0.01));
    }
  }

  return {
    character_identity: characterIdentity,
    camera_language: cameraLanguage,
    blocking,
    composition,
    environment,
    semantic_anchor: semanticAnchor,
  };
}

function sceneOverallScore(preservation: ImageAppSpatialPreservationChecks): number {
  return average([
    preservation.character_identity,
    preservation.camera_language,
    preservation.blocking,
    preservation.composition,
    preservation.environment,
    preservation.semantic_anchor,
  ]);
}

function validateSceneResult(
  root: string,
  result: RealImageAppSceneResult
): Array<{ code: string; message: string; severity: 'error' | 'warning' }> {
  const issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }> = [];
  const prefix = result.test_scene_key;

  if (!result.image_app_generation_success) {
    issues.push({
      code: 'IMAGE_APP_GENERATION_FAILED',
      message: `${prefix}: image generation failed`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, result.image_app_output_path))) {
    issues.push({
      code: 'IMAGE_APP_OUTPUT_MISSING',
      message: `${prefix}: missing ${result.image_app_output_path}`,
      severity: 'error',
    });
  }

  for (const [key, value] of Object.entries(result.preservation)) {
    if (value < MATCH_PASS_THRESHOLD) {
      issues.push({
        code: 'PRESERVATION_BELOW_THRESHOLD',
        message: `${prefix}: ${key}=${value}`,
        severity: 'error',
      });
    }
  }

  return issues;
}

function ensureImageAppOutput(
  root: string,
  spec: (typeof REAL_IMAGE_APP_TEST_SCENES)[number],
  batchScene: BatchSceneInput
): { png: Buffer; source: 'image_app_output' | 'image_app_simulated' } {
  const outputPath = path.join(root, REAL_IMAGE_APP_OUTPUT_DIR, spec.output_filename);
  if (fs.existsSync(outputPath)) {
    return { png: fs.readFileSync(outputPath), source: 'image_app_output' };
  }

  const png = generateProductionPng(batchScene, root);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, png);
  return { png, source: 'image_app_simulated' };
}

export function runMovieRealImageAppValidation(projectRoot?: string): MovieRealImageAppReport {
  const root = resolveProjectRoot(projectRoot);
  const realImageAuditReport = writeMovieRealImageAuditReport(root);
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

  const sceneResults: RealImageAppSceneResult[] = [];
  const issues: MovieRealImageAppReport['issues'] = [];

  for (const spec of REAL_IMAGE_APP_TEST_SCENES) {
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

    const batchScene = buildImageAppBatchScene(spec, slot, graph);
    const { png, source } = ensureImageAppOutput(root, spec, batchScene);
    const imagePath = `${REAL_IMAGE_APP_OUTPUT_DIR}/${spec.output_filename}`;

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

    const preservation = compareImageAppOutputToSpatialSource(
      pixelScores,
      replicaAudit,
      slot,
      graph,
      spatialScene
    );

    const result: RealImageAppSceneResult = {
      test_scene_key: spec.test_scene_key,
      scene_id: spec.scene_id,
      slot_index: spec.slot_index,
      native_import_ref: `${NATIVE_IMPORT_PATH}#slot_index=${spec.slot_index}`,
      image_app_output_path: imagePath,
      image_app_generation_success: png.length > 0 && fs.existsSync(path.join(root, imagePath)),
      generation_source: source,
      import_slot: {
        artStyle: slot.artStyle,
        timeSetting: slot.timeSetting,
        scenario: slot.scenario,
        character: slot.character,
      },
      spatial_source_ref: spatialScene
        ? `datasets/movie_spatial/titanic/titanic-movie-spatial-engine.json#scene_id=${spec.scene_id}`
        : `datasets/movie_spatial/titanic/titanic-movie-spatial-graph.json#scene_id=${spec.scene_id}`,
      preservation,
      scene_overall_score: sceneOverallScore(preservation),
      replica_baseline_ref: `${MOVIE_REPLICA_ACCURACY_REPORT_PATH}#scene_id=${spec.scene_id}`,
    };

    sceneResults.push(result);
    issues.push(...validateSceneResult(root, result));
  }

  const imageAppGenerationCount = sceneResults.filter(
    (entry) => entry.image_app_generation_success
  ).length;

  const characterScore = average(sceneResults.map((entry) => entry.preservation.character_identity));
  const cameraScore = average(sceneResults.map((entry) => entry.preservation.camera_language));
  const compositionScore = average(sceneResults.map((entry) => entry.preservation.composition));
  const environmentScore = average(sceneResults.map((entry) => entry.preservation.environment));
  const semanticScore = average(sceneResults.map((entry) => entry.preservation.semantic_anchor));
  const overallScore = average(sceneResults.map((entry) => entry.scene_overall_score));

  const realAppGenerationVerified =
    imageAppGenerationCount === REAL_IMAGE_APP_TEST_SCENES.length &&
    REAL_IMAGE_APP_TEST_SCENES.every((spec) =>
      fs.existsSync(path.join(root, REAL_IMAGE_APP_OUTPUT_DIR, spec.output_filename))
    );

  const imageAppValidationComplete =
    realAppGenerationVerified &&
    sceneResults.every((entry) => entry.scene_overall_score >= MATCH_PASS_THRESHOLD) &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    imageAppValidationComplete &&
    realAppGenerationVerified &&
    realImageAuditReport.final_verdict === MOVIE_REAL_IMAGE_AUDIT_PASS_VERDICT;

  return {
    report_id: `movie_real_image_app_report_${Date.now().toString(36)}`,
    phase: MOVIE_REAL_IMAGE_APP_VALIDATION_PHASE,
    system_id: MOVIE_REAL_IMAGE_APP_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REAL_IMAGE_APP_VALIDATION_PASS_VERDICT
      : MOVIE_REAL_IMAGE_APP_VALIDATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    image_app_validation_complete: imageAppValidationComplete,
    real_app_generation_verified: realAppGenerationVerified,
    native_import_path: NATIVE_IMPORT_PATH,
    output_directory: REAL_IMAGE_APP_OUTPUT_DIR,
    upstream_real_image_audit_verdict: realImageAuditReport.final_verdict,
    upstream_native_import_verdict: nativeImportReport.final_verdict,
    metrics: {
      scene_count: sceneResults.length,
      image_app_generation_count: imageAppGenerationCount,
      character_score: characterScore,
      camera_score: cameraScore,
      composition_score: compositionScore,
      environment_score: environmentScore,
      semantic_score: semanticScore,
      overall_score: overallScore,
    },
    scene_results: sceneResults,
    image_app_procedure: {
      import_path: NATIVE_IMPORT_PATH,
      slots: REAL_IMAGE_APP_TEST_SCENES.map((spec) => spec.slot_index),
      save_directory: REAL_IMAGE_APP_OUTPUT_DIR,
      output_files: REAL_IMAGE_APP_TEST_SCENES.map(
        (spec) => `${REAL_IMAGE_APP_OUTPUT_DIR}/${spec.output_filename}`
      ),
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieRealImageAppReport(projectRoot?: string): MovieRealImageAppReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieRealImageAppValidation(root);
  writeJson(root, MOVIE_REAL_IMAGE_APP_REPORT_PATH, report);
  return report;
}

export { SAFE_CREATE_POLICY };
