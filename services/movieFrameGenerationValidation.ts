import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT } from './movieKeyframeReconstructionBuilder.js';
import { writeMovieKeyframeReconstructionReport } from './movieKeyframeReconstructionValidation.js';
import {
  MOVIE_FRAME_GENERATION_FAIL_VERDICT,
  MOVIE_FRAME_GENERATION_PASS_VERDICT,
  MOVIE_FRAME_GENERATION_PHASE,
  MOVIE_FRAME_GENERATION_REPORT_PATH,
  MOVIE_FRAME_GENERATION_SCHEMA_PATH,
  MOVIE_FRAME_GENERATION_SYSTEM_ID,
  FrameGenerationUnit,
  MovieFrameGenerationPlan,
  loadAllMovieFrameGenerationPlans,
  writeMovieFrameGenerationPlans,
} from './movieFrameGenerationOrchestrator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_FRAME_GENERATION_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-FRAME-GENERATION-VALIDATION-001' as const;
export const MOVIE_FRAME_GENERATION_VALIDATION_ID = 'MOVIE_FRAME_GENERATION_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieFrameGenerationReport {
  report_id: string;
  phase: typeof MOVIE_FRAME_GENERATION_PHASE;
  validation_phase: typeof MOVIE_FRAME_GENERATION_VALIDATION_PHASE;
  system_id: typeof MOVIE_FRAME_GENERATION_SYSTEM_ID;
  validation_id: typeof MOVIE_FRAME_GENERATION_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  frame_generation_ready: boolean;
  generation_order_present: boolean;
  batch_assignment_present: boolean;
  replacement_map_present: boolean;
  priority_present: boolean;
  status: string;
  upstream_keyframe_reconstruction_verdict: string;
  metrics: {
    scene_count: number;
    keyframe_count: number;
    generation_unit_count: number;
    batch_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    keyframe_count: number;
    generation_unit_count: number;
    batch_count: number;
    valid_unit_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function isNonEmptyObject(value: unknown): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0;
}

function validateGenerationUnit(unit: FrameGenerationUnit): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${unit.movie_id}/${unit.scene_id}/${unit.keyframe_id}`;

  if (!Number.isInteger(unit.generation_order) || unit.generation_order <= 0) {
    issues.push({
      code: 'GENERATION_ORDER_MISSING',
      message: `${prefix}: generation_order must be present and > 0`,
      severity: 'error',
    });
  }
  if (!unit.batch_id || unit.batch_id.length === 0) {
    issues.push({
      code: 'BATCH_ASSIGNMENT_MISSING',
      message: `${prefix}: batch_id must be present`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(unit.replacement_map)) {
    issues.push({
      code: 'REPLACEMENT_MAP_MISSING',
      message: `${prefix}: replacement_map must be present`,
      severity: 'error',
    });
  } else {
    const replacementMap = unit.replacement_map as { mapping_count?: number };
    if (Number(replacementMap.mapping_count ?? 0) <= 0) {
      issues.push({
        code: 'REPLACEMENT_MAP_EMPTY',
        message: `${prefix}: replacement_map must have mappings`,
        severity: 'error',
      });
    }
  }
  if (!Number.isInteger(unit.generation_priority) || unit.generation_priority <= 0) {
    issues.push({
      code: 'PRIORITY_MISSING',
      message: `${prefix}: generation_priority must be present and > 0`,
      severity: 'error',
    });
  }

  const flags = unit.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only orchestration`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizePlan(plan: MovieFrameGenerationPlan): {
  movie_id: string;
  scene_count: number;
  keyframe_count: number;
  generation_unit_count: number;
  batch_count: number;
  valid_unit_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validUnitCount = 0;

  const orders = plan.generation_units.map((unit) => unit.generation_order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    issues.push({
      code: 'GENERATION_ORDER_DUPLICATE',
      message: `${plan.movie_id}: generation_order values must be unique`,
      severity: 'error',
    });
  }

  for (const unit of plan.generation_units) {
    const unitIssues = validateGenerationUnit(unit);
    issues.push(...unitIssues);
    if (unitIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validUnitCount += 1;
    }
  }

  if (plan.batch_count !== plan.batches.length) {
    issues.push({
      code: 'BATCH_COUNT_MISMATCH',
      message: `${plan.movie_id}: batch_count does not match batches array`,
      severity: 'error',
    });
  }

  return {
    movie_id: plan.movie_id,
    scene_count: plan.scene_count,
    keyframe_count: plan.keyframe_count,
    generation_unit_count: plan.generation_unit_count,
    batch_count: plan.batch_count,
    valid_unit_count: validUnitCount,
    issues,
  };
}

export function runMovieFrameGenerationValidation(
  root: string,
  plans: MovieFrameGenerationPlan[],
  upstreamKeyframeVerdict: string
): MovieFrameGenerationReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_FRAME_GENERATION_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_FRAME_GENERATION_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (plans.length === 0) {
    issues.push({
      code: 'NO_GENERATION_PLANS',
      message: 'No frame generation plans found',
      severity: 'error',
    });
  }

  if (upstreamKeyframeVerdict !== MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_KEYFRAME_RECONSTRUCTION_NOT_PASS',
      message: `Upstream keyframe reconstruction verdict is ${upstreamKeyframeVerdict}`,
      severity: 'error',
    });
  }

  const summaries = plans.map((plan) => summarizePlan(plan));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    keyframe_count: summaries.reduce((sum, summary) => sum + summary.keyframe_count, 0),
    generation_unit_count: summaries.reduce((sum, summary) => sum + summary.generation_unit_count, 0),
    batch_count: summaries.reduce((sum, summary) => sum + summary.batch_count, 0),
  };

  const allUnits = plans.flatMap((plan) => plan.generation_units);
  const generationOrderPresent =
    allUnits.length > 0 &&
    allUnits.every((unit) => Number.isInteger(unit.generation_order) && unit.generation_order > 0);
  const batchAssignmentPresent =
    allUnits.length > 0 && allUnits.every((unit) => typeof unit.batch_id === 'string' && unit.batch_id.length > 0);
  const replacementMapPresent =
    allUnits.length > 0 &&
    allUnits.every((unit) => {
      const map = unit.replacement_map as { mapping_count?: number };
      return isNonEmptyObject(unit.replacement_map) && Number(map.mapping_count ?? 0) > 0;
    });
  const priorityPresent =
    allUnits.length > 0 &&
    allUnits.every((unit) => Number.isInteger(unit.generation_priority) && unit.generation_priority > 0);

  const frameGenerationReady =
    plans.length > 0 && metrics.generation_unit_count > 0 && metrics.batch_count > 0;

  const allUnitsValid = summaries.every(
    (summary) => summary.valid_unit_count === summary.generation_unit_count && summary.generation_unit_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    frameGenerationReady &&
    generationOrderPresent &&
    batchAssignmentPresent &&
    replacementMapPresent &&
    priorityPresent &&
    allUnitsValid;

  return {
    report_id: `movie_frame_generation_report_${Date.now().toString(36)}`,
    phase: MOVIE_FRAME_GENERATION_PHASE,
    validation_phase: MOVIE_FRAME_GENERATION_VALIDATION_PHASE,
    system_id: MOVIE_FRAME_GENERATION_SYSTEM_ID,
    validation_id: MOVIE_FRAME_GENERATION_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_FRAME_GENERATION_PASS_VERDICT : MOVIE_FRAME_GENERATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    frame_generation_ready: frameGenerationReady,
    generation_order_present: generationOrderPresent,
    batch_assignment_present: batchAssignmentPresent,
    replacement_map_present: replacementMapPresent,
    priority_present: priorityPresent,
    status: validationPassed ? MOVIE_FRAME_GENERATION_PASS_VERDICT : MOVIE_FRAME_GENERATION_FAIL_VERDICT,
    upstream_keyframe_reconstruction_verdict: upstreamKeyframeVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieFrameGenerationReport(projectRoot?: string): MovieFrameGenerationReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieKeyframeReconstructionReport(root);
  writeMovieFrameGenerationPlans(root);
  const plans = loadAllMovieFrameGenerationPlans(root);
  const report = runMovieFrameGenerationValidation(root, plans, upstreamReport.final_verdict);
  writeJson(root, MOVIE_FRAME_GENERATION_REPORT_PATH, report);
  return report;
}
