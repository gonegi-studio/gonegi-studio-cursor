import fs from 'node:fs';
import path from 'node:path';
import {
  DRY_RUN_REGISTRY_PATH,
  loadMovieAnalysisDryRun,
  type MovieAnalysisDryRun,
} from './movieAnalysisDryRunPlanner.js';
import { SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FRAME_SAMPLING_PHASE =
  'PHASE-SOURCE-VIDEO-024-MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1' as const;
export const FRAME_SAMPLING_SCHEMA_PATH =
  'datasets/movie_analysis/frame_sampling/movie-analysis-frame-sampling.schema.json' as const;
export const FRAME_SAMPLING_REGISTRY_PATH =
  'datasets/movie_analysis/frame_sampling/movie-analysis-frame-sampling-registry.json' as const;
export const FRAME_SAMPLING_PLANS_DIR =
  'datasets/movie_analysis/frame_sampling/plans' as const;

export type SamplingStrategy =
  | 'START_MIDDLE_END'
  | 'UNIFORM_INTERVAL'
  | 'EMOTION_PEAK_CANDIDATE'
  | 'TRANSITION_CANDIDATE';

export type SamplingPointRole =
  | 'start_anchor'
  | 'middle_anchor'
  | 'end_anchor'
  | 'uniform_interval'
  | 'emotion_peak'
  | 'transition_in'
  | 'transition_out'
  | 'scene_detection_prep';

export type SamplingPoint = {
  point_id: string;
  timestamp_seconds: number;
  point_role: SamplingPointRole;
  reads_frame: false;
  saves_image: false;
  candidate_type: 'timestamp_candidate';
};

export type FrameSamplingExecutionFlags = {
  planning_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type MovieAnalysisFrameSamplingPlan = {
  sampling_plan_id: string;
  phase: typeof FRAME_SAMPLING_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_strategy: SamplingStrategy;
  target_frame_count: number;
  sampling_points: SamplingPoint[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_scene_detection_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    timestamp_only: true;
    no_image_assets: true;
  };
  execution_flags: FrameSamplingExecutionFlags;
  designed_at: string;
};

export const TARGET_FRAME_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 16,
  MORI_01: 12,
};

export const SEED_FRAME_SAMPLING_SPECS = Object.freeze([
  {
    sampling_plan_id: 'frame_sampling_ghibli_01_v1',
    dry_run_id: 'dry_run_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    sampling_strategy: 'UNIFORM_INTERVAL' as const,
  },
  {
    sampling_plan_id: 'frame_sampling_shinkai_01_v1',
    dry_run_id: 'dry_run_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    sampling_strategy: 'START_MIDDLE_END' as const,
  },
  {
    sampling_plan_id: 'frame_sampling_little_women_01_v1',
    dry_run_id: 'dry_run_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    sampling_strategy: 'TRANSITION_CANDIDATE' as const,
  },
  {
    sampling_plan_id: 'frame_sampling_mori_01_v1',
    dry_run_id: 'dry_run_mori_01_v1',
    source_video_id: 'MORI_01',
    sampling_strategy: 'EMOTION_PEAK_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: FrameSamplingExecutionFlags = {
  planning_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

type DryRunRegistry = {
  dry_runs: Array<{
    dry_run_id: string;
    analysis_plan_id: string;
    source_video_id: string;
  }>;
};

function roundTimestamp(value: number): number {
  return Math.round(value * 100) / 100;
}

function makePoint(
  planId: string,
  index: number,
  timestamp: number,
  role: SamplingPointRole
): SamplingPoint {
  return {
    point_id: `${planId}_sp_${String(index + 1).padStart(3, '0')}`,
    timestamp_seconds: roundTimestamp(timestamp),
    point_role: role,
    reads_frame: false,
    saves_image: false,
    candidate_type: 'timestamp_candidate',
  };
}

function uniformTimestamps(start: number, end: number, count: number): number[] {
  if (count <= 1) return [start];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

function startMiddleEndTimestamps(start: number, end: number, count: number): number[] {
  const middle = (start + end) / 2;
  const anchors = [start, middle, end];
  if (count <= 3) {
    return anchors.slice(0, count);
  }
  const remaining = count - 3;
  const firstHalf = Math.ceil(remaining / 2);
  const secondHalf = remaining - firstHalf;
  const betweenStartMiddle = uniformTimestamps(start, middle, firstHalf + 2).slice(1, -1);
  const betweenMiddleEnd = uniformTimestamps(middle, end, secondHalf + 2).slice(1, -1);
  return [start, ...betweenStartMiddle, middle, ...betweenMiddleEnd, end];
}

function emotionPeakTimestamps(start: number, end: number, count: number): number[] {
  const peak = start + (end - start) * 0.55;
  const prePeak = start + (end - start) * 0.4;
  const postPeak = start + (end - start) * 0.7;
  const anchors = [start, prePeak, peak, postPeak, end];
  if (count <= anchors.length) {
    return uniformTimestamps(start, end, count);
  }
  const remaining = count - anchors.length;
  const extras = uniformTimestamps(prePeak, postPeak, remaining + 2).slice(1, -1);
  const merged = [start, ...uniformTimestamps(start, prePeak, 3).slice(1), prePeak, peak, postPeak];
  while (merged.length < count - 1) {
    merged.push(roundTimestamp(postPeak + (end - postPeak) * (merged.length / count)));
  }
  merged.push(end);
  return merged.slice(0, count).sort((a, b) => a - b);
}

function transitionTimestamps(start: number, end: number, count: number): number[] {
  const transitionInEnd = start + (end - start) * 0.2;
  const transitionOutStart = start + (end - start) * 0.8;
  const inPoints = uniformTimestamps(start, transitionInEnd, Math.ceil(count * 0.25));
  const midPoints = uniformTimestamps(transitionInEnd, transitionOutStart, Math.ceil(count * 0.5));
  const outPoints = uniformTimestamps(transitionOutStart, end, Math.floor(count * 0.25) + 1);
  const merged = [...inPoints, ...midPoints.slice(1), ...outPoints.slice(1)];
  if (merged.length === count) return merged;
  if (merged.length > count) return merged.slice(0, count);
  const fill = uniformTimestamps(start, end, count);
  return fill;
}

function generateSamplingPoints(
  planId: string,
  strategy: SamplingStrategy,
  start: number,
  end: number,
  count: number
): SamplingPoint[] {
  let timestamps: number[];
  let roleForIndex: (index: number, ts: number, total: number) => SamplingPointRole;

  switch (strategy) {
    case 'UNIFORM_INTERVAL':
      timestamps = uniformTimestamps(start, end, count);
      roleForIndex = () => 'uniform_interval';
      break;
    case 'START_MIDDLE_END':
      timestamps = startMiddleEndTimestamps(start, end, count);
      roleForIndex = (index, ts, total) => {
        if (index === 0) return 'start_anchor';
        if (index === total - 1) return 'end_anchor';
        if (Math.abs(ts - (start + end) / 2) < 0.01) return 'middle_anchor';
        return 'scene_detection_prep';
      };
      break;
    case 'EMOTION_PEAK_CANDIDATE':
      timestamps = emotionPeakTimestamps(start, end, count);
      roleForIndex = (index, ts) => {
        if (index === 0) return 'start_anchor';
        if (index === timestamps.length - 1) return 'end_anchor';
        const peak = start + (end - start) * 0.55;
        if (Math.abs(ts - peak) < 0.5) return 'emotion_peak';
        return 'scene_detection_prep';
      };
      break;
    case 'TRANSITION_CANDIDATE':
      timestamps = transitionTimestamps(start, end, count);
      roleForIndex = (index, ts) => {
        if (index === 0) return 'transition_in';
        if (index === timestamps.length - 1) return 'transition_out';
        const transitionInEnd = start + (end - start) * 0.2;
        const transitionOutStart = start + (end - start) * 0.8;
        if (ts <= transitionInEnd) return 'transition_in';
        if (ts >= transitionOutStart) return 'transition_out';
        return 'scene_detection_prep';
      };
      break;
  }

  return timestamps.map((ts, index) =>
    makePoint(planId, index, ts, roleForIndex(index, ts, timestamps.length))
  );
}

function segmentWindow(sourceVideoId: string): { start: number; end: number } {
  const segment = SEED_SEGMENT_SPECS.find((s) => s.source_video_id === sourceVideoId);
  if (!segment) {
    throw new Error(`No segment spec for source video: ${sourceVideoId}`);
  }
  return { start: segment.timestamp_start, end: segment.timestamp_end };
}

function buildSamplingPlan(
  spec: (typeof SEED_FRAME_SAMPLING_SPECS)[number],
  dryRun: MovieAnalysisDryRun
): MovieAnalysisFrameSamplingPlan {
  const targetCount = TARGET_FRAME_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target frame count for ${spec.source_video_id}`);
  }

  const { start, end } = segmentWindow(spec.source_video_id);
  const span = roundTimestamp(end - start);
  const samplingPoints = generateSamplingPoints(
    spec.sampling_plan_id,
    spec.sampling_strategy,
    start,
    end,
    targetCount
  );

  if (samplingPoints.length !== targetCount) {
    throw new Error(
      `Sampling point count mismatch for ${spec.sampling_plan_id}: expected ${targetCount}, got ${samplingPoints.length}`
    );
  }

  return {
    sampling_plan_id: spec.sampling_plan_id,
    phase: FRAME_SAMPLING_PHASE,
    source_video_id: spec.source_video_id,
    analysis_plan_id: dryRun.analysis_plan_id,
    dry_run_id: dryRun.dry_run_id,
    sampling_strategy: spec.sampling_strategy,
    target_frame_count: targetCount,
    sampling_points: samplingPoints,
    coverage_goal: {
      segment_span_seconds: span,
      coverage_percent: 100,
      purpose: 'future_scene_detection_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      timestamp_only: true,
      no_image_assets: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadDryRunRegistry(projectRoot: string): DryRunRegistry | null {
  const abs = path.join(projectRoot, DRY_RUN_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DryRunRegistry;
}

export function buildSeedFrameSamplingPlans(projectRoot?: string): MovieAnalysisFrameSamplingPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const dryRunRegistry = loadDryRunRegistry(root);
  if (!dryRunRegistry) {
    throw new Error(`Missing dry run registry: ${DRY_RUN_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisFrameSamplingPlan[] = [];

  for (const spec of SEED_FRAME_SAMPLING_SPECS) {
    const registryEntry = dryRunRegistry.dry_runs.find((d) => d.dry_run_id === spec.dry_run_id);
    if (!registryEntry) {
      throw new Error(`Dry run not in registry: ${spec.dry_run_id}`);
    }

    const dryRun = loadMovieAnalysisDryRun(root, spec.dry_run_id);
    if (!dryRun) {
      throw new Error(`Missing dry run: ${spec.dry_run_id}`);
    }

    if (dryRun.source_video_id !== spec.source_video_id) {
      throw new Error(`Dry run source mismatch for ${spec.dry_run_id}`);
    }

    plans.push(buildSamplingPlan(spec, dryRun));
  }

  return plans;
}

export function writeMovieAnalysisFrameSamplingPlans(projectRoot?: string): {
  plans: MovieAnalysisFrameSamplingPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedFrameSamplingPlans(root);
  const outDir = path.join(root, FRAME_SAMPLING_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${FRAME_SAMPLING_PLANS_DIR}/${plan.sampling_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-frame-sampling-registry-v1',
    phase: FRAME_SAMPLING_PHASE,
    registry_version: 'v1',
    schema_path: FRAME_SAMPLING_SCHEMA_PATH,
    dry_run_registry_path: DRY_RUN_REGISTRY_PATH,
    storage_dir: FRAME_SAMPLING_PLANS_DIR,
    sampling_plans: plans.map((plan) => ({
      sampling_plan_id: plan.sampling_plan_id,
      plan_path: `${FRAME_SAMPLING_PLANS_DIR}/${plan.sampling_plan_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_strategy: plan.sampling_strategy,
      target_frame_count: plan.target_frame_count,
      sampling_point_count: plan.sampling_points.length,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, FRAME_SAMPLING_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisFrameSamplingPlan(
  projectRoot: string,
  samplingPlanId: string
): MovieAnalysisFrameSamplingPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, FRAME_SAMPLING_PLANS_DIR, `${samplingPlanId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisFrameSamplingPlan;
}
