import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_FRAME_GENERATION_PASS_VERDICT } from './movieFrameGenerationOrchestrator.js';
import { writeMovieFrameGenerationReport } from './movieFrameGenerationValidation.js';
import {
  MOVIE_CHARACTER_REPLACEMENT_FAIL_VERDICT,
  MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT,
  MOVIE_CHARACTER_REPLACEMENT_PHASE,
  MOVIE_CHARACTER_REPLACEMENT_REPORT_PATH,
  MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH,
  MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID,
  CharacterReplacementValidation,
  MovieCharacterReplacementValidationDataset,
  loadAllMovieCharacterReplacementValidationDatasets,
  writeMovieCharacterReplacementValidations,
} from './movieCharacterReplacementValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_PHASE =
  'PHASE-MOVIE-REPLICA-CHARACTER-REPLACEMENT-INTEGRITY-001' as const;
export const MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_ID = 'MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieCharacterReplacementReport {
  report_id: string;
  phase: typeof MOVIE_CHARACTER_REPLACEMENT_PHASE;
  integrity_phase: typeof MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_PHASE;
  system_id: typeof MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID;
  integrity_id: typeof MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  replacement_validation_ready: boolean;
  identity_preservation_present: boolean;
  scene_preservation_present: boolean;
  status: string;
  upstream_frame_generation_verdict: string;
  metrics: {
    scene_count: number;
    replacement_count: number;
    identity_score_avg: number;
    scene_score_avg: number;
    camera_score_avg: number;
    blocking_score_avg: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    replacement_count: number;
    identity_score_avg: number;
    scene_score_avg: number;
    camera_score_avg: number;
    blocking_score_avg: number;
    valid_replacement_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round4(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function validateReplacementEntry(entry: CharacterReplacementValidation): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${entry.movie_id}/${entry.scene_id}/${entry.original_character}`;

  if (entry.identity_preservation_score <= 0) {
    issues.push({
      code: 'IDENTITY_SCORE_ZERO',
      message: `${prefix}: identity_preservation_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.scene_preservation_score <= 0) {
    issues.push({
      code: 'SCENE_SCORE_ZERO',
      message: `${prefix}: scene_preservation_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.camera_preservation_score <= 0) {
    issues.push({
      code: 'CAMERA_SCORE_ZERO',
      message: `${prefix}: camera_preservation_score must be > 0`,
      severity: 'error',
    });
  }
  if (entry.blocking_preservation_score <= 0) {
    issues.push({
      code: 'BLOCKING_SCORE_ZERO',
      message: `${prefix}: blocking_preservation_score must be > 0`,
      severity: 'error',
    });
  }

  const flags = entry.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only validation`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieCharacterReplacementValidationDataset): {
  movie_id: string;
  scene_count: number;
  replacement_count: number;
  identity_score_avg: number;
  scene_score_avg: number;
  camera_score_avg: number;
  blocking_score_avg: number;
  valid_replacement_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validReplacementCount = 0;

  for (const entry of dataset.validations) {
    const entryIssues = validateReplacementEntry(entry);
    issues.push(...entryIssues);
    if (entryIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validReplacementCount += 1;
    }
  }

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.scene_count,
    replacement_count: dataset.replacement_count,
    identity_score_avg: average(dataset.validations.map((entry) => entry.identity_preservation_score)),
    scene_score_avg: average(dataset.validations.map((entry) => entry.scene_preservation_score)),
    camera_score_avg: average(dataset.validations.map((entry) => entry.camera_preservation_score)),
    blocking_score_avg: average(dataset.validations.map((entry) => entry.blocking_preservation_score)),
    valid_replacement_count: validReplacementCount,
    issues,
  };
}

export function runMovieCharacterReplacementIntegrity(
  root: string,
  datasets: MovieCharacterReplacementValidationDataset[],
  upstreamFrameGenerationVerdict: string
): MovieCharacterReplacementReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_REPLACEMENT_VALIDATIONS',
      message: 'No character replacement validation datasets found',
      severity: 'error',
    });
  }

  if (upstreamFrameGenerationVerdict !== MOVIE_FRAME_GENERATION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_FRAME_GENERATION_NOT_PASS',
      message: `Upstream frame generation verdict is ${upstreamFrameGenerationVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    replacement_count: summaries.reduce((sum, summary) => sum + summary.replacement_count, 0),
    identity_score_avg: average(summaries.map((summary) => summary.identity_score_avg)),
    scene_score_avg: average(summaries.map((summary) => summary.scene_score_avg)),
    camera_score_avg: average(summaries.map((summary) => summary.camera_score_avg)),
    blocking_score_avg: average(summaries.map((summary) => summary.blocking_score_avg)),
  };

  const allValidations = datasets.flatMap((dataset) => dataset.validations);
  const replacementValidationReady = datasets.length > 0 && metrics.replacement_count > 0;
  const identityPreservationPresent = allValidations.every(
    (entry) => entry.identity_preservation_score > 0
  );
  const scenePreservationPresent = allValidations.every((entry) => entry.scene_preservation_score > 0);

  const allReplacementsValid = summaries.every(
    (summary) =>
      summary.valid_replacement_count === summary.replacement_count && summary.replacement_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    replacementValidationReady &&
    identityPreservationPresent &&
    scenePreservationPresent &&
    allReplacementsValid;

  return {
    report_id: `movie_character_replacement_report_${Date.now().toString(36)}`,
    phase: MOVIE_CHARACTER_REPLACEMENT_PHASE,
    integrity_phase: MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_PHASE,
    system_id: MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID,
    integrity_id: MOVIE_CHARACTER_REPLACEMENT_INTEGRITY_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT
      : MOVIE_CHARACTER_REPLACEMENT_FAIL_VERDICT,
    validation_passed: validationPassed,
    replacement_validation_ready: replacementValidationReady,
    identity_preservation_present: identityPreservationPresent,
    scene_preservation_present: scenePreservationPresent,
    status: validationPassed
      ? MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT
      : MOVIE_CHARACTER_REPLACEMENT_FAIL_VERDICT,
    upstream_frame_generation_verdict: upstreamFrameGenerationVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieCharacterReplacementReport(projectRoot?: string): MovieCharacterReplacementReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieFrameGenerationReport(root);
  writeMovieCharacterReplacementValidations(root);
  const datasets = loadAllMovieCharacterReplacementValidationDatasets(root);
  const report = runMovieCharacterReplacementIntegrity(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_CHARACTER_REPLACEMENT_REPORT_PATH, report);
  return report;
}
