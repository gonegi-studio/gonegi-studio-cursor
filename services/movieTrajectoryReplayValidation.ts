import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT } from './movieReplicaSceneGraphBuilder.js';
import { writeMovieReplicaSceneGraphReport } from './movieReplicaSceneGraphValidation.js';
import {
  MOVIE_TRAJECTORY_REPLAY_FAIL_VERDICT,
  MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT,
  MOVIE_TRAJECTORY_REPLAY_PHASE,
  MOVIE_TRAJECTORY_REPLAY_REPORT_PATH,
  MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH,
  MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID,
  MovieTrajectoryReplayDataset,
  TrajectoryReplayGraph,
  loadAllMovieTrajectoryReplayDatasets,
  writeMovieTrajectoryReplayGraphs,
} from './movieTrajectoryReplayBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_TRAJECTORY_REPLAY_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-TRAJECTORY-REPLAY-VALIDATION-001' as const;
export const MOVIE_TRAJECTORY_REPLAY_VALIDATION_ID = 'MOVIE_TRAJECTORY_REPLAY_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieTrajectoryReplayReport {
  report_id: string;
  phase: typeof MOVIE_TRAJECTORY_REPLAY_PHASE;
  validation_phase: typeof MOVIE_TRAJECTORY_REPLAY_VALIDATION_PHASE;
  system_id: typeof MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID;
  validation_id: typeof MOVIE_TRAJECTORY_REPLAY_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  trajectory_replay_created: boolean;
  character_trajectory_present: boolean;
  camera_trajectory_present: boolean;
  keyframe_sequence_present: boolean;
  motion_segments_present: boolean;
  status: string;
  upstream_scene_graph_verdict: string;
  metrics: {
    scene_count: number;
    trajectory_count: number;
    camera_trajectory_count: number;
    keyframe_count: number;
    motion_segment_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    trajectory_count: number;
    camera_trajectory_count: number;
    keyframe_count: number;
    motion_segment_count: number;
    valid_scene_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function countTrajectories(replay: TrajectoryReplayGraph): number {
  return (
    replay.character_trajectory.trajectory_count +
    replay.camera_trajectory.trajectory_count +
    replay.prop_trajectory.trajectory_count
  );
}

function validateReplayGraph(replay: TrajectoryReplayGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${replay.movie_id}/${replay.scene_id}`;
  const trajectoryCount = countTrajectories(replay);

  if (trajectoryCount <= 0) {
    issues.push({
      code: 'TRAJECTORY_COUNT_ZERO',
      message: `${prefix}: trajectory count must be > 0`,
      severity: 'error',
    });
  }
  if (replay.keyframe_sequence.keyframe_count <= 0) {
    issues.push({
      code: 'KEYFRAME_COUNT_ZERO',
      message: `${prefix}: keyframe count must be > 0`,
      severity: 'error',
    });
  }
  if (replay.motion_segments.segment_count <= 0) {
    issues.push({
      code: 'MOTION_SEGMENT_COUNT_ZERO',
      message: `${prefix}: motion segment count must be > 0`,
      severity: 'error',
    });
  }
  if (replay.timeline_segments.segment_count <= 0) {
    issues.push({
      code: 'TIMELINE_SEGMENT_COUNT_ZERO',
      message: `${prefix}: timeline segment count must be > 0`,
      severity: 'error',
    });
  }
  if (replay.character_trajectory.trajectory_count <= 0) {
    issues.push({
      code: 'CHARACTER_TRAJECTORY_MISSING',
      message: `${prefix}: character trajectory must be present`,
      severity: 'error',
    });
  }
  if (replay.camera_trajectory.trajectory_count <= 0) {
    issues.push({
      code: 'CAMERA_TRAJECTORY_MISSING',
      message: `${prefix}: camera trajectory must be present`,
      severity: 'error',
    });
  }

  const flags = replay.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.rendering !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only replay graph`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieTrajectoryReplayDataset): {
  movie_id: string;
  scene_count: number;
  trajectory_count: number;
  camera_trajectory_count: number;
  keyframe_count: number;
  motion_segment_count: number;
  valid_scene_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validSceneCount = 0;

  for (const replay of dataset.replay_graphs) {
    const replayIssues = validateReplayGraph(replay);
    issues.push(...replayIssues);
    if (replayIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validSceneCount += 1;
    }
  }

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.replay_graph_count,
    trajectory_count: dataset.replay_graphs.reduce((sum, replay) => sum + countTrajectories(replay), 0),
    camera_trajectory_count: dataset.replay_graphs.reduce(
      (sum, replay) => sum + replay.camera_trajectory.trajectory_count,
      0
    ),
    keyframe_count: dataset.replay_graphs.reduce(
      (sum, replay) => sum + replay.keyframe_sequence.keyframe_count,
      0
    ),
    motion_segment_count: dataset.replay_graphs.reduce(
      (sum, replay) => sum + replay.motion_segments.segment_count,
      0
    ),
    valid_scene_count: validSceneCount,
    issues,
  };
}

export function runMovieTrajectoryReplayValidation(
  root: string,
  datasets: MovieTrajectoryReplayDataset[],
  upstreamSceneGraphVerdict: string
): MovieTrajectoryReplayReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_TRAJECTORY_REPLAY_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_REPLAY_GRAPHS',
      message: 'No trajectory replay datasets found',
      severity: 'error',
    });
  }

  if (upstreamSceneGraphVerdict !== MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_SCENE_GRAPH_NOT_PASS',
      message: `Upstream scene graph verdict is ${upstreamSceneGraphVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    trajectory_count: summaries.reduce((sum, summary) => sum + summary.trajectory_count, 0),
    camera_trajectory_count: summaries.reduce((sum, summary) => sum + summary.camera_trajectory_count, 0),
    keyframe_count: summaries.reduce((sum, summary) => sum + summary.keyframe_count, 0),
    motion_segment_count: summaries.reduce((sum, summary) => sum + summary.motion_segment_count, 0),
  };

  const trajectoryReplayCreated = datasets.length > 0 && metrics.scene_count > 0;
  const characterTrajectoryPresent = datasets.every((dataset) =>
    dataset.replay_graphs.every((replay) => replay.character_trajectory.trajectory_count > 0)
  );
  const cameraTrajectoryPresent = metrics.camera_trajectory_count > 0;
  const keyframeSequencePresent = metrics.keyframe_count > 0;
  const motionSegmentsPresent = metrics.motion_segment_count > 0;

  const allScenesValid = summaries.every(
    (summary) => summary.valid_scene_count === summary.scene_count && summary.scene_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    trajectoryReplayCreated &&
    characterTrajectoryPresent &&
    cameraTrajectoryPresent &&
    keyframeSequencePresent &&
    motionSegmentsPresent &&
    allScenesValid;

  return {
    report_id: `movie_trajectory_replay_report_${Date.now().toString(36)}`,
    phase: MOVIE_TRAJECTORY_REPLAY_PHASE,
    validation_phase: MOVIE_TRAJECTORY_REPLAY_VALIDATION_PHASE,
    system_id: MOVIE_TRAJECTORY_REPLAY_SYSTEM_ID,
    validation_id: MOVIE_TRAJECTORY_REPLAY_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT
      : MOVIE_TRAJECTORY_REPLAY_FAIL_VERDICT,
    validation_passed: validationPassed,
    trajectory_replay_created: trajectoryReplayCreated,
    character_trajectory_present: characterTrajectoryPresent,
    camera_trajectory_present: cameraTrajectoryPresent,
    keyframe_sequence_present: keyframeSequencePresent,
    motion_segments_present: motionSegmentsPresent,
    status: validationPassed
      ? MOVIE_TRAJECTORY_REPLAY_PASS_VERDICT
      : MOVIE_TRAJECTORY_REPLAY_FAIL_VERDICT,
    upstream_scene_graph_verdict: upstreamSceneGraphVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieTrajectoryReplayReport(projectRoot?: string): MovieTrajectoryReplayReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaSceneGraphReport(root);
  writeMovieTrajectoryReplayGraphs(root);
  const datasets = loadAllMovieTrajectoryReplayDatasets(root);
  const report = runMovieTrajectoryReplayValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_TRAJECTORY_REPLAY_REPORT_PATH, report);
  return report;
}
