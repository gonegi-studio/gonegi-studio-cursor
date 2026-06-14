import fs from 'node:fs';
import path from 'node:path';
import {
  SCENE_DETECTION_REGISTRY_PATH,
  loadMovieAnalysisSceneDetectionPlan,
  type MovieAnalysisSceneDetectionPlan,
} from './movieAnalysisSceneDetectionDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const COORDINATE_EXTRACTION_PHASE =
  'PHASE-SOURCE-VIDEO-026-MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1' as const;
export const COORDINATE_EXTRACTION_SCHEMA_PATH =
  'datasets/movie_analysis/coordinate_extraction/movie-analysis-coordinate-extraction.schema.json' as const;
export const COORDINATE_EXTRACTION_REGISTRY_PATH =
  'datasets/movie_analysis/coordinate_extraction/movie-analysis-coordinate-extraction-registry.json' as const;
export const COORDINATE_EXTRACTION_PLANS_DIR =
  'datasets/movie_analysis/coordinate_extraction/plans' as const;

export type CoordinateExtractionStrategy =
  | 'SHOT_GRAMMAR_CANDIDATE'
  | 'CAMERA_MOTION_CANDIDATE'
  | 'BLOCKING_CANDIDATE'
  | 'EMOTION_LOCATION_CANDIDATE';

export type CoordinateType =
  | 'shot_scale'
  | 'camera_angle'
  | 'camera_motion'
  | 'subject_position'
  | 'blocking'
  | 'location_anchor'
  | 'lighting_state'
  | 'emotion_state'
  | 'transition_hint';

export type CoordinateCandidate = {
  candidate_id: string;
  scene_candidate_id: string;
  coordinate_type: CoordinateType;
  estimated_value: string;
  reads_frame: false;
  extracts_coordinate: false;
  validates_timestamp: false;
  candidate_type: 'estimated_coordinate_candidate';
  estimated_only: true;
};

export type CoordinateExtractionExecutionFlags = {
  planning_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
};

export type MovieAnalysisCoordinateExtractionPlan = {
  coordinate_extraction_id: string;
  phase: typeof COORDINATE_EXTRACTION_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_plan_id: string;
  scene_detection_id: string;
  coordinate_candidate_count: number;
  coordinate_extraction_strategy: CoordinateExtractionStrategy;
  coordinate_candidates: CoordinateCandidate[];
  coordinate_types: CoordinateType[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_gonegi_state_mapping_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_coordinate_extraction: true;
  };
  execution_flags: CoordinateExtractionExecutionFlags;
  designed_at: string;
};

export const ALL_COORDINATE_TYPES: readonly CoordinateType[] = [
  'shot_scale',
  'camera_angle',
  'camera_motion',
  'subject_position',
  'blocking',
  'location_anchor',
  'lighting_state',
  'emotion_state',
  'transition_hint',
] as const;

export const TARGET_COORDINATE_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_COORDINATE_EXTRACTION_SPECS = Object.freeze([
  {
    coordinate_extraction_id: 'coordinate_extraction_ghibli_01_v1',
    scene_detection_id: 'scene_detection_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    coordinate_extraction_strategy: 'SHOT_GRAMMAR_CANDIDATE' as const,
  },
  {
    coordinate_extraction_id: 'coordinate_extraction_shinkai_01_v1',
    scene_detection_id: 'scene_detection_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    coordinate_extraction_strategy: 'EMOTION_LOCATION_CANDIDATE' as const,
  },
  {
    coordinate_extraction_id: 'coordinate_extraction_little_women_01_v1',
    scene_detection_id: 'scene_detection_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    coordinate_extraction_strategy: 'BLOCKING_CANDIDATE' as const,
  },
  {
    coordinate_extraction_id: 'coordinate_extraction_mori_01_v1',
    scene_detection_id: 'scene_detection_mori_01_v1',
    source_video_id: 'MORI_01',
    coordinate_extraction_strategy: 'CAMERA_MOTION_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: CoordinateExtractionExecutionFlags = {
  planning_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  coordinate_extraction: false,
  frame_extraction: false,
  scene_extraction: false,
  ocr: false,
};

const STRATEGY_TYPE_PRIORITY: Record<CoordinateExtractionStrategy, CoordinateType[]> = {
  SHOT_GRAMMAR_CANDIDATE: [
    'shot_scale',
    'camera_angle',
    'camera_motion',
    'transition_hint',
    'subject_position',
    'blocking',
    'location_anchor',
    'lighting_state',
    'emotion_state',
  ],
  CAMERA_MOTION_CANDIDATE: [
    'camera_motion',
    'camera_angle',
    'shot_scale',
    'transition_hint',
    'subject_position',
    'blocking',
    'location_anchor',
    'lighting_state',
    'emotion_state',
  ],
  BLOCKING_CANDIDATE: [
    'blocking',
    'subject_position',
    'shot_scale',
    'camera_angle',
    'camera_motion',
    'location_anchor',
    'lighting_state',
    'emotion_state',
    'transition_hint',
  ],
  EMOTION_LOCATION_CANDIDATE: [
    'emotion_state',
    'location_anchor',
    'lighting_state',
    'subject_position',
    'shot_scale',
    'camera_angle',
    'camera_motion',
    'blocking',
    'transition_hint',
  ],
};

const ESTIMATED_VALUES: Record<CoordinateType, string[]> = {
  shot_scale: ['estimated_wide', 'estimated_medium', 'estimated_close'],
  camera_angle: ['estimated_eye_level', 'estimated_low', 'estimated_high'],
  camera_motion: ['estimated_static', 'estimated_pan', 'estimated_dolly'],
  subject_position: ['estimated_center', 'estimated_left_third', 'estimated_right_third'],
  blocking: ['estimated_single_subject', 'estimated_two_shot', 'estimated_group'],
  location_anchor: ['estimated_interior', 'estimated_exterior', 'estimated_transitional'],
  lighting_state: ['estimated_soft', 'estimated_hard', 'estimated_mixed'],
  emotion_state: ['estimated_neutral', 'estimated_tense', 'estimated_warm'],
  transition_hint: ['estimated_cut', 'estimated_dissolve', 'estimated_match_cut'],
};

type SceneDetectionRegistry = {
  scene_detection_plans: Array<{
    scene_detection_id: string;
    source_video_id: string;
    analysis_plan_id: string;
    dry_run_id: string;
    sampling_plan_id: string;
  }>;
};

function estimatedValueForType(type: CoordinateType, index: number): string {
  const values = ESTIMATED_VALUES[type];
  return values[index % values.length];
}

function estimateCoordinateCandidates(
  planId: string,
  strategy: CoordinateExtractionStrategy,
  sceneDetectionPlan: MovieAnalysisSceneDetectionPlan,
  targetCount: number
): CoordinateCandidate[] {
  const typePriority = STRATEGY_TYPE_PRIORITY[strategy];
  const sceneCount = sceneDetectionPlan.scene_candidates.length;
  const perScene = Math.ceil(targetCount / sceneCount);
  const candidates: CoordinateCandidate[] = [];
  let globalIndex = 0;

  for (let sceneIdx = 0; sceneIdx < sceneCount && candidates.length < targetCount; sceneIdx++) {
    const sceneCandidate = sceneDetectionPlan.scene_candidates[sceneIdx];
    const slots = Math.min(perScene, targetCount - candidates.length);

    for (let slot = 0; slot < slots; slot++) {
      const coordinateType = typePriority[(globalIndex + slot) % typePriority.length];
      candidates.push({
        candidate_id: `${planId}_cc_${String(candidates.length + 1).padStart(3, '0')}`,
        scene_candidate_id: sceneCandidate.candidate_id,
        coordinate_type: coordinateType,
        estimated_value: estimatedValueForType(coordinateType, globalIndex + slot),
        reads_frame: false,
        extracts_coordinate: false,
        validates_timestamp: false,
        candidate_type: 'estimated_coordinate_candidate',
        estimated_only: true,
      });
    }
    globalIndex += slots;
  }

  return candidates;
}

function buildCoordinateExtractionPlan(
  spec: (typeof SEED_COORDINATE_EXTRACTION_SPECS)[number],
  sceneDetectionPlan: MovieAnalysisSceneDetectionPlan
): MovieAnalysisCoordinateExtractionPlan {
  const targetCount = TARGET_COORDINATE_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target coordinate candidate count for ${spec.source_video_id}`);
  }

  if (sceneDetectionPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Scene detection source mismatch for ${spec.scene_detection_id}`);
  }

  const coordinateCandidates = estimateCoordinateCandidates(
    spec.coordinate_extraction_id,
    spec.coordinate_extraction_strategy,
    sceneDetectionPlan,
    targetCount
  );

  if (coordinateCandidates.length !== targetCount) {
    throw new Error(
      `Coordinate candidate count mismatch for ${spec.coordinate_extraction_id}: expected ${targetCount}, got ${coordinateCandidates.length}`
    );
  }

  return {
    coordinate_extraction_id: spec.coordinate_extraction_id,
    phase: COORDINATE_EXTRACTION_PHASE,
    source_video_id: sceneDetectionPlan.source_video_id,
    analysis_plan_id: sceneDetectionPlan.analysis_plan_id,
    dry_run_id: sceneDetectionPlan.dry_run_id,
    sampling_plan_id: sceneDetectionPlan.sampling_plan_id,
    scene_detection_id: sceneDetectionPlan.scene_detection_id,
    coordinate_candidate_count: targetCount,
    coordinate_extraction_strategy: spec.coordinate_extraction_strategy,
    coordinate_candidates: coordinateCandidates,
    coordinate_types: [...ALL_COORDINATE_TYPES],
    coverage_goal: {
      segment_span_seconds: sceneDetectionPlan.coverage_goal.segment_span_seconds,
      coverage_percent: 100,
      purpose: 'future_gonegi_state_mapping_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_coordinate_extraction: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadSceneDetectionRegistry(projectRoot: string): SceneDetectionRegistry | null {
  const abs = path.join(projectRoot, SCENE_DETECTION_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SceneDetectionRegistry;
}

export function buildSeedCoordinateExtractionPlans(
  projectRoot?: string
): MovieAnalysisCoordinateExtractionPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const sceneDetectionRegistry = loadSceneDetectionRegistry(root);
  if (!sceneDetectionRegistry) {
    throw new Error(`Missing scene detection registry: ${SCENE_DETECTION_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisCoordinateExtractionPlan[] = [];

  for (const spec of SEED_COORDINATE_EXTRACTION_SPECS) {
    const registryEntry = sceneDetectionRegistry.scene_detection_plans.find(
      (s) => s.scene_detection_id === spec.scene_detection_id
    );
    if (!registryEntry) {
      throw new Error(`Scene detection plan not in registry: ${spec.scene_detection_id}`);
    }

    const sceneDetectionPlan = loadMovieAnalysisSceneDetectionPlan(root, spec.scene_detection_id);
    if (!sceneDetectionPlan) {
      throw new Error(`Missing scene detection plan: ${spec.scene_detection_id}`);
    }

    if (sceneDetectionPlan.dry_run_id !== registryEntry.dry_run_id) {
      throw new Error(`Scene detection dry_run mismatch for ${spec.scene_detection_id}`);
    }

    plans.push(buildCoordinateExtractionPlan(spec, sceneDetectionPlan));
  }

  return plans;
}

export function writeMovieAnalysisCoordinateExtractionPlans(projectRoot?: string): {
  plans: MovieAnalysisCoordinateExtractionPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedCoordinateExtractionPlans(root);
  const outDir = path.join(root, COORDINATE_EXTRACTION_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${COORDINATE_EXTRACTION_PLANS_DIR}/${plan.coordinate_extraction_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-coordinate-extraction-registry-v1',
    phase: COORDINATE_EXTRACTION_PHASE,
    registry_version: 'v1',
    schema_path: COORDINATE_EXTRACTION_SCHEMA_PATH,
    scene_detection_registry_path: SCENE_DETECTION_REGISTRY_PATH,
    storage_dir: COORDINATE_EXTRACTION_PLANS_DIR,
    coordinate_extraction_plans: plans.map((plan) => ({
      coordinate_extraction_id: plan.coordinate_extraction_id,
      plan_path: `${COORDINATE_EXTRACTION_PLANS_DIR}/${plan.coordinate_extraction_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_plan_id: plan.sampling_plan_id,
      scene_detection_id: plan.scene_detection_id,
      coordinate_extraction_strategy: plan.coordinate_extraction_strategy,
      coordinate_candidate_count: plan.coordinate_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, COORDINATE_EXTRACTION_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisCoordinateExtractionPlan(
  projectRoot: string,
  coordinateExtractionId: string
): MovieAnalysisCoordinateExtractionPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, COORDINATE_EXTRACTION_PLANS_DIR, `${coordinateExtractionId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisCoordinateExtractionPlan;
}
