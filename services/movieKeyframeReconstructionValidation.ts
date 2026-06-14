import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT } from './movieTrajectoryReplayBuilder.js';
import { writeMovieTrajectoryReplayReport } from './movieTrajectoryReplayValidation.js';
import {
  MOVIE_KEYFRAME_RECONSTRUCTION_FAIL_VERDICT,
  MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT,
  MOVIE_KEYFRAME_RECONSTRUCTION_PHASE,
  MOVIE_KEYFRAME_RECONSTRUCTION_REPORT_PATH,
  MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH,
  MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID,
  KeyframeReconstructionPlan,
  MovieKeyframeReconstructionDataset,
  loadAllMovieKeyframeReconstructionDatasets,
  writeMovieKeyframeReconstructionPlans,
} from './movieKeyframeReconstructionBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-KEYFRAME-RECONSTRUCTION-VALIDATION-001' as const;
export const MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_ID =
  'MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieKeyframeReconstructionReport {
  report_id: string;
  phase: typeof MOVIE_KEYFRAME_RECONSTRUCTION_PHASE;
  validation_phase: typeof MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_PHASE;
  system_id: typeof MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID;
  validation_id: typeof MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  keyframe_reconstruction_created: boolean;
  camera_state_present: boolean;
  character_state_present: boolean;
  identity_replacement_ready: boolean;
  status: string;
  upstream_trajectory_replay_verdict: string;
  metrics: {
    scene_count: number;
    keyframe_count: number;
    camera_state_count: number;
    character_state_count: number;
    replacement_map_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    keyframe_count: number;
    camera_state_count: number;
    character_state_count: number;
    replacement_map_count: number;
    valid_scene_count: number;
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

function validateKeyframePlan(plan: KeyframeReconstructionPlan): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${plan.movie_id}/${plan.scene_id}/${plan.keyframe_id}`;

  if (!isNonEmptyObject(plan.camera_state)) {
    issues.push({
      code: 'CAMERA_STATE_MISSING',
      message: `${prefix}: camera_state must be present`,
      severity: 'error',
    });
  }
  if (!isNonEmptyObject(plan.character_state)) {
    issues.push({
      code: 'CHARACTER_STATE_MISSING',
      message: `${prefix}: character_state must be present`,
      severity: 'error',
    });
  } else {
    const characterState = plan.character_state as { character_count?: number; characters?: unknown[] };
    if (Number(characterState.character_count ?? 0) <= 0) {
      issues.push({
        code: 'CHARACTER_STATE_EMPTY',
        message: `${prefix}: character_state count must be > 0`,
        severity: 'error',
      });
    }
  }
  if (!isNonEmptyObject(plan.identity_replacement_map)) {
    issues.push({
      code: 'IDENTITY_REPLACEMENT_MAP_MISSING',
      message: `${prefix}: identity_replacement_map must be present`,
      severity: 'error',
    });
  } else {
    const replacementMap = plan.identity_replacement_map as {
      mapping_count?: number;
      replacement_ready?: boolean;
    };
    if (Number(replacementMap.mapping_count ?? 0) <= 0) {
      issues.push({
        code: 'IDENTITY_REPLACEMENT_MAP_EMPTY',
        message: `${prefix}: identity_replacement_map count must be > 0`,
        severity: 'error',
      });
    }
    if (replacementMap.replacement_ready !== true) {
      issues.push({
        code: 'IDENTITY_REPLACEMENT_NOT_READY',
        message: `${prefix}: identity_replacement_map must be ready`,
        severity: 'error',
      });
    }
  }

  const flags = plan.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.image_generation !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only keyframe plan`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieKeyframeReconstructionDataset): {
  movie_id: string;
  scene_count: number;
  keyframe_count: number;
  camera_state_count: number;
  character_state_count: number;
  replacement_map_count: number;
  valid_scene_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const sceneKeyframeCounts = new Map<string, number>();
  const sceneValid = new Map<string, boolean>();

  for (const plan of dataset.keyframe_plans) {
    const planIssues = validateKeyframePlan(plan);
    issues.push(...planIssues);
    sceneKeyframeCounts.set(plan.scene_id, (sceneKeyframeCounts.get(plan.scene_id) ?? 0) + 1);

    const hasErrors = planIssues.some((issue) => issue.severity === 'error');
    if (!hasErrors) {
      sceneValid.set(plan.scene_id, (sceneValid.get(plan.scene_id) ?? true) && true);
    } else {
      sceneValid.set(plan.scene_id, false);
    }
  }

  for (const [sceneId, count] of sceneKeyframeCounts) {
    if (count <= 0) {
      issues.push({
        code: 'KEYFRAME_COUNT_ZERO',
        message: `${dataset.movie_id}/${sceneId}: keyframe count must be > 0`,
        severity: 'error',
      });
      sceneValid.set(sceneId, false);
    }
  }

  const validSceneCount = [...sceneValid.values()].filter(Boolean).length;

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.scene_count,
    keyframe_count: dataset.keyframe_plan_count,
    camera_state_count: dataset.keyframe_plans.filter((plan) => isNonEmptyObject(plan.camera_state)).length,
    character_state_count: dataset.keyframe_plans.reduce((sum, plan) => {
      const characterState = plan.character_state as { character_count?: number };
      return sum + Number(characterState.character_count ?? 0);
    }, 0),
    replacement_map_count: dataset.keyframe_plans.reduce((sum, plan) => {
      const replacementMap = plan.identity_replacement_map as { mapping_count?: number };
      return sum + Number(replacementMap.mapping_count ?? 0);
    }, 0),
    valid_scene_count: validSceneCount,
    issues,
  };
}

export function runMovieKeyframeReconstructionValidation(
  root: string,
  datasets: MovieKeyframeReconstructionDataset[],
  upstreamTrajectoryReplayVerdict: string
): MovieKeyframeReconstructionReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_KEYFRAME_RECONSTRUCTION_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_KEYFRAME_PLANS',
      message: 'No keyframe reconstruction datasets found',
      severity: 'error',
    });
  }

  if (upstreamTrajectoryReplayVerdict !== MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_TRAJECTORY_REPLAY_NOT_PASS',
      message: `Upstream trajectory replay verdict is ${upstreamTrajectoryReplayVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    keyframe_count: summaries.reduce((sum, summary) => sum + summary.keyframe_count, 0),
    camera_state_count: summaries.reduce((sum, summary) => sum + summary.camera_state_count, 0),
    character_state_count: summaries.reduce((sum, summary) => sum + summary.character_state_count, 0),
    replacement_map_count: summaries.reduce((sum, summary) => sum + summary.replacement_map_count, 0),
  };

  const keyframeReconstructionCreated = datasets.length > 0 && metrics.keyframe_count > 0;
  const cameraStatePresent = metrics.camera_state_count === metrics.keyframe_count && metrics.keyframe_count > 0;
  const characterStatePresent = metrics.character_state_count > 0;
  const identityReplacementReady = datasets.every((dataset) =>
    dataset.keyframe_plans.every((plan) => {
      const replacementMap = plan.identity_replacement_map as { replacement_ready?: boolean; mapping_count?: number };
      return replacementMap.replacement_ready === true && Number(replacementMap.mapping_count ?? 0) > 0;
    })
  );

  const allScenesValid = summaries.every(
    (summary) => summary.valid_scene_count === summary.scene_count && summary.scene_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    keyframeReconstructionCreated &&
    cameraStatePresent &&
    characterStatePresent &&
    identityReplacementReady &&
    allScenesValid;

  return {
    report_id: `movie_keyframe_reconstruction_report_${Date.now().toString(36)}`,
    phase: MOVIE_KEYFRAME_RECONSTRUCTION_PHASE,
    validation_phase: MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_PHASE,
    system_id: MOVIE_KEYFRAME_RECONSTRUCTION_SYSTEM_ID,
    validation_id: MOVIE_KEYFRAME_RECONSTRUCTION_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT
      : MOVIE_KEYFRAME_RECONSTRUCTION_FAIL_VERDICT,
    validation_passed: validationPassed,
    keyframe_reconstruction_created: keyframeReconstructionCreated,
    camera_state_present: cameraStatePresent,
    character_state_present: characterStatePresent,
    identity_replacement_ready: identityReplacementReady,
    status: validationPassed
      ? MOVIE_KEYFRAME_RECONSTRUCTION_PASS_VERDICT
      : MOVIE_KEYFRAME_RECONSTRUCTION_FAIL_VERDICT,
    upstream_trajectory_replay_verdict: upstreamTrajectoryReplayVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieKeyframeReconstructionReport(projectRoot?: string): MovieKeyframeReconstructionReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieTrajectoryReplayReport(root);
  writeMovieKeyframeReconstructionPlans(root);
  const datasets = loadAllMovieKeyframeReconstructionDatasets(root);
  const report = runMovieKeyframeReconstructionValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_KEYFRAME_RECONSTRUCTION_REPORT_PATH, report);
  return report;
}
