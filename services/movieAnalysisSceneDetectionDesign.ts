import fs from 'node:fs';
import path from 'node:path';
import {
  FRAME_SAMPLING_REGISTRY_PATH,
  loadMovieAnalysisFrameSamplingPlan,
  type MovieAnalysisFrameSamplingPlan,
} from './movieAnalysisFrameSamplingDesign.js';
import { SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_DETECTION_PHASE =
  'PHASE-SOURCE-VIDEO-025-MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1' as const;
export const SCENE_DETECTION_SCHEMA_PATH =
  'datasets/movie_analysis/scene_detection/movie-analysis-scene-detection.schema.json' as const;
export const SCENE_DETECTION_REGISTRY_PATH =
  'datasets/movie_analysis/scene_detection/movie-analysis-scene-detection-registry.json' as const;
export const SCENE_DETECTION_PLANS_DIR =
  'datasets/movie_analysis/scene_detection/plans' as const;

export type SceneDetectionStrategy =
  | 'VISUAL_TRANSITION_CANDIDATE'
  | 'EMOTIONAL_SHIFT_CANDIDATE'
  | 'LOCATION_CHANGE_CANDIDATE'
  | 'DIALOGUE_BLOCK_CANDIDATE';

export type SceneCandidateRole =
  | 'visual_transition'
  | 'emotional_shift'
  | 'location_change'
  | 'dialogue_block';

export type SceneCandidate = {
  candidate_id: string;
  estimated_start_seconds: number;
  estimated_end_seconds: number;
  candidate_role: SceneCandidateRole;
  reads_frame: false;
  extracts_boundary: false;
  validates_timestamp: false;
  candidate_type: 'estimated_scene_candidate';
  estimated_only: true;
};

export type SceneDetectionExecutionFlags = {
  planning_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
};

export type MovieAnalysisSceneDetectionPlan = {
  scene_detection_id: string;
  phase: typeof SCENE_DETECTION_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_plan_id: string;
  scene_candidate_count: number;
  scene_detection_strategy: SceneDetectionStrategy;
  scene_candidates: SceneCandidate[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_coordinate_extraction_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_boundary_extraction: true;
  };
  execution_flags: SceneDetectionExecutionFlags;
  designed_at: string;
};

export const TARGET_SCENE_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 4,
  SHINKAI_01: 4,
  LITTLE_WOMEN_01: 6,
  MORI_01: 4,
};

export const SEED_SCENE_DETECTION_SPECS = Object.freeze([
  {
    scene_detection_id: 'scene_detection_ghibli_01_v1',
    sampling_plan_id: 'frame_sampling_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    scene_detection_strategy: 'VISUAL_TRANSITION_CANDIDATE' as const,
  },
  {
    scene_detection_id: 'scene_detection_shinkai_01_v1',
    sampling_plan_id: 'frame_sampling_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    scene_detection_strategy: 'EMOTIONAL_SHIFT_CANDIDATE' as const,
  },
  {
    scene_detection_id: 'scene_detection_little_women_01_v1',
    sampling_plan_id: 'frame_sampling_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    scene_detection_strategy: 'DIALOGUE_BLOCK_CANDIDATE' as const,
  },
  {
    scene_detection_id: 'scene_detection_mori_01_v1',
    sampling_plan_id: 'frame_sampling_mori_01_v1',
    source_video_id: 'MORI_01',
    scene_detection_strategy: 'LOCATION_CHANGE_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: SceneDetectionExecutionFlags = {
  planning_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  scene_extraction: false,
  ocr: false,
};

const STRATEGY_TO_ROLE: Record<SceneDetectionStrategy, SceneCandidateRole> = {
  VISUAL_TRANSITION_CANDIDATE: 'visual_transition',
  EMOTIONAL_SHIFT_CANDIDATE: 'emotional_shift',
  LOCATION_CHANGE_CANDIDATE: 'location_change',
  DIALOGUE_BLOCK_CANDIDATE: 'dialogue_block',
};

type FrameSamplingRegistry = {
  sampling_plans: Array<{
    sampling_plan_id: string;
    source_video_id: string;
    analysis_plan_id: string;
    dry_run_id: string;
  }>;
};

function roundTimestamp(value: number): number {
  return Math.round(value * 100) / 100;
}

function strategyRole(strategy: SceneDetectionStrategy): SceneCandidateRole {
  return STRATEGY_TO_ROLE[strategy];
}

function segmentWindow(sourceVideoId: string): { start: number; end: number } {
  const segment = SEED_SEGMENT_SPECS.find((s) => s.source_video_id === sourceVideoId);
  if (!segment) {
    throw new Error(`No segment spec for source video: ${sourceVideoId}`);
  }
  return { start: segment.timestamp_start, end: segment.timestamp_end };
}

function estimateSceneCandidates(
  planId: string,
  strategy: SceneDetectionStrategy,
  start: number,
  end: number,
  count: number,
  samplingPoints: MovieAnalysisFrameSamplingPlan['sampling_points']
): SceneCandidate[] {
  const role = strategyRole(strategy);
  const span = end - start;
  const step = span / count;
  const candidates: SceneCandidate[] = [];

  for (let i = 0; i < count; i++) {
    const estimatedStart = roundTimestamp(start + step * i);
    const estimatedEnd = roundTimestamp(i === count - 1 ? end : start + step * (i + 1));

    const anchorPoint = samplingPoints[Math.min(i, samplingPoints.length - 1)];
    const midpoint = roundTimestamp((estimatedStart + estimatedEnd) / 2);
    const hintOffset = anchorPoint
      ? roundTimestamp((anchorPoint.timestamp_seconds - midpoint) * 0.1)
      : 0;

    candidates.push({
      candidate_id: `${planId}_sc_${String(i + 1).padStart(3, '0')}`,
      estimated_start_seconds: roundTimestamp(estimatedStart + hintOffset),
      estimated_end_seconds: estimatedEnd,
      candidate_role: role,
      reads_frame: false,
      extracts_boundary: false,
      validates_timestamp: false,
      candidate_type: 'estimated_scene_candidate',
      estimated_only: true,
    });
  }

  return candidates;
}

function buildSceneDetectionPlan(
  spec: (typeof SEED_SCENE_DETECTION_SPECS)[number],
  samplingPlan: MovieAnalysisFrameSamplingPlan
): MovieAnalysisSceneDetectionPlan {
  const targetCount = TARGET_SCENE_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target scene candidate count for ${spec.source_video_id}`);
  }

  if (samplingPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Sampling plan source mismatch for ${spec.sampling_plan_id}`);
  }

  const { start, end } = segmentWindow(spec.source_video_id);
  const span = roundTimestamp(end - start);
  const sceneCandidates = estimateSceneCandidates(
    spec.scene_detection_id,
    spec.scene_detection_strategy,
    start,
    end,
    targetCount,
    samplingPlan.sampling_points
  );

  if (sceneCandidates.length !== targetCount) {
    throw new Error(
      `Scene candidate count mismatch for ${spec.scene_detection_id}: expected ${targetCount}, got ${sceneCandidates.length}`
    );
  }

  return {
    scene_detection_id: spec.scene_detection_id,
    phase: SCENE_DETECTION_PHASE,
    source_video_id: samplingPlan.source_video_id,
    analysis_plan_id: samplingPlan.analysis_plan_id,
    dry_run_id: samplingPlan.dry_run_id,
    sampling_plan_id: samplingPlan.sampling_plan_id,
    scene_candidate_count: targetCount,
    scene_detection_strategy: spec.scene_detection_strategy,
    scene_candidates: sceneCandidates,
    coverage_goal: {
      segment_span_seconds: span,
      coverage_percent: 100,
      purpose: 'future_coordinate_extraction_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_boundary_extraction: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadFrameSamplingRegistry(projectRoot: string): FrameSamplingRegistry | null {
  const abs = path.join(projectRoot, FRAME_SAMPLING_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as FrameSamplingRegistry;
}

export function buildSeedSceneDetectionPlans(
  projectRoot?: string
): MovieAnalysisSceneDetectionPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const samplingRegistry = loadFrameSamplingRegistry(root);
  if (!samplingRegistry) {
    throw new Error(`Missing frame sampling registry: ${FRAME_SAMPLING_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisSceneDetectionPlan[] = [];

  for (const spec of SEED_SCENE_DETECTION_SPECS) {
    const registryEntry = samplingRegistry.sampling_plans.find(
      (s) => s.sampling_plan_id === spec.sampling_plan_id
    );
    if (!registryEntry) {
      throw new Error(`Sampling plan not in registry: ${spec.sampling_plan_id}`);
    }

    const samplingPlan = loadMovieAnalysisFrameSamplingPlan(root, spec.sampling_plan_id);
    if (!samplingPlan) {
      throw new Error(`Missing sampling plan: ${spec.sampling_plan_id}`);
    }

    if (samplingPlan.dry_run_id !== registryEntry.dry_run_id) {
      throw new Error(`Sampling plan dry_run mismatch for ${spec.sampling_plan_id}`);
    }

    plans.push(buildSceneDetectionPlan(spec, samplingPlan));
  }

  return plans;
}

export function writeMovieAnalysisSceneDetectionPlans(projectRoot?: string): {
  plans: MovieAnalysisSceneDetectionPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedSceneDetectionPlans(root);
  const outDir = path.join(root, SCENE_DETECTION_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${SCENE_DETECTION_PLANS_DIR}/${plan.scene_detection_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-scene-detection-registry-v1',
    phase: SCENE_DETECTION_PHASE,
    registry_version: 'v1',
    schema_path: SCENE_DETECTION_SCHEMA_PATH,
    frame_sampling_registry_path: FRAME_SAMPLING_REGISTRY_PATH,
    storage_dir: SCENE_DETECTION_PLANS_DIR,
    scene_detection_plans: plans.map((plan) => ({
      scene_detection_id: plan.scene_detection_id,
      plan_path: `${SCENE_DETECTION_PLANS_DIR}/${plan.scene_detection_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_plan_id: plan.sampling_plan_id,
      scene_detection_strategy: plan.scene_detection_strategy,
      scene_candidate_count: plan.scene_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, SCENE_DETECTION_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisSceneDetectionPlan(
  projectRoot: string,
  sceneDetectionId: string
): MovieAnalysisSceneDetectionPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, SCENE_DETECTION_PLANS_DIR, `${sceneDetectionId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisSceneDetectionPlan;
}
