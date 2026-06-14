import fs from 'node:fs';
import path from 'node:path';
import {
  IMAGE_APP_EXPORT_OUTPUTS,
  MOVIE_IMAGE_APP_EXPORT_DIR,
  MOVIE_IMAGE_APP_EXPORT_FAIL_VERDICT,
  MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT,
  MOVIE_IMAGE_APP_EXPORT_PHASE,
  MOVIE_IMAGE_APP_EXPORT_REPORT_PATH,
  MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH,
  MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID,
  MovieImageAppExportDataset,
  MovieImageAppSceneExport,
  REQUIRED_IMAGE_APP_PAYLOAD_FIELDS,
  loadAllMovieImageAppExportDatasets,
  writeMovieImageAppExports,
} from './movieImageAppExportBuilder.js';
import { MOVIE_REPLICA_ACCURACY_PASS_VERDICT } from './movieReplicaAccuracyAudit.js';
import { writeMovieReplicaAccuracyReport } from './movieReplicaAccuracyValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_IMAGE_APP_EXPORT_VALIDATION_PHASE = 'PHASE-MOVIE-IMAGE-APP-EXPORT-VALIDATION-001' as const;
export const MOVIE_IMAGE_APP_EXPORT_VALIDATION_ID = 'MOVIE_IMAGE_APP_EXPORT_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

const IMAGE_APP_DIRECT_FIELDS = ['artStyle', 'timeSetting', 'scenario', 'character'] as const;

const GENERATION_PAYLOAD_REQUIRED = [
  'version',
  ...IMAGE_APP_DIRECT_FIELDS,
  ...REQUIRED_IMAGE_APP_PAYLOAD_FIELDS,
  'spatial_context',
  'camera_context',
  'blocking_context',
  'composition_context',
] as const;

export interface MovieImageAppExportReport {
  report_id: string;
  phase: typeof MOVIE_IMAGE_APP_EXPORT_PHASE;
  validation_phase: typeof MOVIE_IMAGE_APP_EXPORT_VALIDATION_PHASE;
  system_id: typeof MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID;
  validation_id: typeof MOVIE_IMAGE_APP_EXPORT_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  image_app_export_created: boolean;
  direct_generation_ready: boolean;
  generation_payload_present: boolean;
  image_app_format_valid: boolean;
  scenario_present: boolean;
  character_present: boolean;
  status: string;
  upstream_replica_accuracy_verdict: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    export_count: number;
    generation_ready_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    export_dataset_id: string;
    scene_count: number;
    generation_ready_count: number;
    direct_generation_ready: boolean;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function hasNonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateSceneExport(sceneExport: MovieImageAppSceneExport): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${sceneExport.movie_id}/${sceneExport.scene_id}`;

  for (const field of IMAGE_APP_DIRECT_FIELDS) {
    if (!hasNonEmptyString(sceneExport[field])) {
      issues.push({
        code: 'DIRECT_FIELD_MISSING',
        message: `${prefix}: ${field} is missing`,
        severity: 'error',
      });
    }
  }

  if (!sceneExport.generation_payload) {
    issues.push({
      code: 'GENERATION_PAYLOAD_MISSING',
      message: `${prefix}: generation_payload is missing`,
      severity: 'error',
    });
    return issues;
  }

  const payload = sceneExport.generation_payload;
  for (const field of GENERATION_PAYLOAD_REQUIRED) {
    const value = payload[field as keyof typeof payload];
    if (value === undefined || value === null) {
      issues.push({
        code: 'PAYLOAD_FIELD_MISSING',
        message: `${prefix}: generation_payload.${field} is missing`,
        severity: 'error',
      });
      continue;
    }
    if (typeof value === 'string' && value.trim().length === 0) {
      issues.push({
        code: 'PAYLOAD_FIELD_EMPTY',
        message: `${prefix}: generation_payload.${field} is empty`,
        severity: 'error',
      });
    }
  }

  if (payload.version !== 'v1') {
    issues.push({
      code: 'PAYLOAD_VERSION_INVALID',
      message: `${prefix}: generation_payload.version must be v1`,
      severity: 'error',
    });
  }

  if (!sceneExport.camera_context?.gaze_direction) {
    issues.push({
      code: 'GAZE_CONTEXT_MISSING',
      message: `${prefix}: camera_context.gaze_direction missing`,
      severity: 'error',
    });
  }

  if (!sceneExport.composition_context?.spatial_depth_profile) {
    issues.push({
      code: 'DEPTH_CONTEXT_MISSING',
      message: `${prefix}: composition_context.spatial_depth_profile missing`,
      severity: 'error',
    });
  }

  if (!sceneExport.spatial_context?.environment_anchor) {
    issues.push({
      code: 'ENVIRONMENT_CONTEXT_MISSING',
      message: `${prefix}: spatial_context.environment_anchor missing`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieImageAppExportDataset): {
  movie_id: string;
  export_dataset_id: string;
  scene_count: number;
  generation_ready_count: number;
  direct_generation_ready: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (dataset.scene_exports.length === 0) {
    issues.push({
      code: 'NO_SCENE_EXPORTS',
      message: `${dataset.movie_id}: scene_exports is empty`,
      severity: 'error',
    });
  }

  for (const sceneExport of dataset.scene_exports) {
    issues.push(...validateSceneExport(sceneExport));
  }

  return {
    movie_id: dataset.movie_id,
    export_dataset_id: dataset.export_dataset_id,
    scene_count: dataset.scene_exports.length,
    generation_ready_count: dataset.scene_exports.filter((entry) => entry.generation_ready).length,
    direct_generation_ready: dataset.direct_generation_ready,
    issues,
  };
}

export function runMovieImageAppExportValidation(
  root: string,
  datasets: MovieImageAppExportDataset[],
  upstreamReplicaAccuracyVerdict: string
): MovieImageAppExportReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_IMAGE_APP_EXPORT_DIR))) {
    issues.push({
      code: 'MISSING_EXPORT_DIR',
      message: `${MOVIE_IMAGE_APP_EXPORT_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_IMAGE_APP_EXPORT_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_DATASETS',
      message: 'No image app export datasets found',
      severity: 'error',
    });
  }

  if (upstreamReplicaAccuracyVerdict !== MOVIE_REPLICA_ACCURACY_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_REPLICA_ACCURACY_NOT_PASS',
      message: `Upstream replica accuracy verdict is ${upstreamReplicaAccuracyVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const allExports = datasets.flatMap((dataset) => dataset.scene_exports);
  const metrics = {
    movie_count: datasets.length,
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    export_count: allExports.length,
    generation_ready_count: summaries.reduce((sum, summary) => sum + summary.generation_ready_count, 0),
  };

  const imageAppExportCreated = datasets.length > 0 && metrics.export_count > 0;
  const generationPayloadPresent = allExports.every((entry) => entry.generation_payload !== null);
  const scenarioPresent = allExports.every((entry) => hasNonEmptyString(entry.scenario));
  const characterPresent = allExports.every((entry) => hasNonEmptyString(entry.character));
  const imageAppFormatValid = allExports.every((entry) => {
    const payload = entry.generation_payload;
    return (
      payload.version === 'v1' &&
      GENERATION_PAYLOAD_REQUIRED.every((field) => {
        const value = payload[field as keyof typeof payload];
        return value !== undefined && value !== null && (typeof value !== 'string' || value.trim().length > 0);
      })
    );
  });
  const directGenerationReady =
    imageAppExportCreated &&
    generationPayloadPresent &&
    imageAppFormatValid &&
    scenarioPresent &&
    characterPresent &&
    metrics.generation_ready_count === metrics.export_count &&
    datasets.every((dataset) => dataset.direct_generation_ready);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed = errors.length === 0 && directGenerationReady;

  return {
    report_id: `movie_image_app_export_report_${Date.now().toString(36)}`,
    phase: MOVIE_IMAGE_APP_EXPORT_PHASE,
    validation_phase: MOVIE_IMAGE_APP_EXPORT_VALIDATION_PHASE,
    system_id: MOVIE_IMAGE_APP_EXPORT_SYSTEM_ID,
    validation_id: MOVIE_IMAGE_APP_EXPORT_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT : MOVIE_IMAGE_APP_EXPORT_FAIL_VERDICT,
    validation_passed: validationPassed,
    image_app_export_created: imageAppExportCreated,
    direct_generation_ready: directGenerationReady,
    generation_payload_present: generationPayloadPresent,
    image_app_format_valid: imageAppFormatValid,
    scenario_present: scenarioPresent,
    character_present: characterPresent,
    status: validationPassed ? MOVIE_IMAGE_APP_EXPORT_PASS_VERDICT : MOVIE_IMAGE_APP_EXPORT_FAIL_VERDICT,
    upstream_replica_accuracy_verdict: upstreamReplicaAccuracyVerdict,
    metrics,
    movie_summaries: summaries.map((summary) => ({
      movie_id: summary.movie_id,
      export_dataset_id: summary.export_dataset_id,
      scene_count: summary.scene_count,
      generation_ready_count: summary.generation_ready_count,
      direct_generation_ready: summary.direct_generation_ready,
    })),
    issues,
  };
}

export function writeMovieImageAppExportReport(projectRoot?: string): MovieImageAppExportReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaAccuracyReport(root);
  writeMovieImageAppExports(root);
  const datasets = loadAllMovieImageAppExportDatasets(root);
  const report = runMovieImageAppExportValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_IMAGE_APP_EXPORT_REPORT_PATH, report);
  return report;
}
