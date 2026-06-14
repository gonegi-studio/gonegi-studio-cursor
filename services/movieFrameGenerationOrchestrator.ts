import fs from 'node:fs';
import path from 'node:path';
import {
  KeyframeReconstructionPlan,
  MovieKeyframeReconstructionDataset,
  loadAllMovieKeyframeReconstructionDatasets,
} from './movieKeyframeReconstructionBuilder.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_FRAME_GENERATION_PHASE = 'PHASE-MOVIE-REPLICA-005' as const;
export const MOVIE_FRAME_GENERATION_SYSTEM_ID = 'MOVIE_FRAME_GENERATION_ORCHESTRATION_V1' as const;
export const MOVIE_FRAME_GENERATION_PASS_VERDICT = 'PASS_MOVIE_FRAME_GENERATION_V1' as const;
export const MOVIE_FRAME_GENERATION_FAIL_VERDICT = 'FAIL_MOVIE_FRAME_GENERATION_V1' as const;

export const MOVIE_FRAME_GENERATION_SCHEMA_PATH =
  'datasets/movie_replica/movie-frame-generation.schema.json' as const;
export const MOVIE_FRAME_GENERATION_REPORT_PATH =
  'reports/movie_replica/MOVIE_FRAME_GENERATION_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const FRAME_GENERATION_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-frame-generation-plan.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-frame-generation-plan.json',
  },
] as const;

type JsonRecord = Record<string, unknown>;

export interface FrameGenerationUnit {
  generation_id: string;
  movie_id: string;
  scene_id: string;
  keyframe_id: string;
  plan_id: string;
  generation_order: number;
  batch_id: string;
  camera_state: JsonRecord;
  character_state: JsonRecord;
  environment_state: JsonRecord;
  replacement_map: JsonRecord;
  generation_priority: number;
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieFrameGenerationPlan {
  generation_plan_id: string;
  phase: typeof MOVIE_FRAME_GENERATION_PHASE;
  system_id: typeof MOVIE_FRAME_GENERATION_SYSTEM_ID;
  movie_id: string;
  source_keyframe_plan_dataset_id: string;
  generated_at: string;
  scene_count: number;
  keyframe_count: number;
  generation_unit_count: number;
  batch_count: number;
  batches: Array<{ batch_id: string; scene_id: string; unit_count: number }>;
  generation_units: FrameGenerationUnit[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sceneBatchId(movieId: string, sceneId: string): string {
  const suffix = sceneId.replace(/^scene_[a-z0-9_]+_/, '').replace(/^scene_/, '');
  return `${movieId}_batch_${suffix}`;
}

function sortKeyframePlans(plans: KeyframeReconstructionPlan[]): KeyframeReconstructionPlan[] {
  return [...plans].sort((a, b) => {
    const sceneCompare = a.scene_id.localeCompare(b.scene_id);
    if (sceneCompare !== 0) return sceneCompare;
    const timestampCompare = a.timestamp - b.timestamp;
    if (timestampCompare !== 0) return timestampCompare;
    return a.reconstruction_priority - b.reconstruction_priority;
  });
}

function buildGenerationUnit(
  plan: KeyframeReconstructionPlan,
  generationOrder: number,
  builtAt: string
): FrameGenerationUnit {
  return {
    generation_id: `${plan.movie_id}_gen_${String(generationOrder).padStart(6, '0')}`,
    movie_id: plan.movie_id,
    scene_id: plan.scene_id,
    keyframe_id: plan.keyframe_id,
    plan_id: plan.plan_id,
    generation_order: generationOrder,
    batch_id: sceneBatchId(plan.movie_id, plan.scene_id),
    camera_state: plan.camera_state,
    character_state: plan.character_state,
    environment_state: plan.environment_state,
    replacement_map: plan.identity_replacement_map,
    generation_priority: plan.reconstruction_priority,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildMovieFrameGenerationPlan(
  dataset: MovieKeyframeReconstructionDataset
): MovieFrameGenerationPlan {
  const builtAt = new Date().toISOString();
  const sortedPlans = sortKeyframePlans(dataset.keyframe_plans);
  const generationUnits = sortedPlans.map((plan, index) =>
    buildGenerationUnit(plan, index + 1, builtAt)
  );

  const batchMap = new Map<string, { batch_id: string; scene_id: string; unit_count: number }>();
  for (const unit of generationUnits) {
    const existing = batchMap.get(unit.batch_id);
    if (existing) {
      existing.unit_count += 1;
    } else {
      batchMap.set(unit.batch_id, {
        batch_id: unit.batch_id,
        scene_id: unit.scene_id,
        unit_count: 1,
      });
    }
  }

  const batches = [...batchMap.values()].sort((a, b) => a.batch_id.localeCompare(b.batch_id));

  return {
    generation_plan_id: `${dataset.movie_id}-frame-generation-plan-v1`,
    phase: MOVIE_FRAME_GENERATION_PHASE,
    system_id: MOVIE_FRAME_GENERATION_SYSTEM_ID,
    movie_id: dataset.movie_id,
    source_keyframe_plan_dataset_id: dataset.plan_dataset_id,
    generated_at: builtAt,
    scene_count: dataset.scene_count,
    keyframe_count: dataset.keyframe_plan_count,
    generation_unit_count: generationUnits.length,
    batch_count: batches.length,
    batches,
    generation_units: generationUnits,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieFrameGenerationPlans(root: string): MovieFrameGenerationPlan[] {
  const keyframeDatasets = loadAllMovieKeyframeReconstructionDatasets(root);
  return keyframeDatasets.map((dataset) => buildMovieFrameGenerationPlan(dataset));
}

export function writeMovieFrameGenerationPlans(projectRoot?: string): MovieFrameGenerationPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildAllMovieFrameGenerationPlans(root);

  for (const spec of FRAME_GENERATION_OUTPUTS) {
    const plan = plans.find((item) => item.movie_id === spec.movie_id);
    if (plan) {
      writeJson(root, spec.output_path, plan);
    }
  }

  return plans;
}

export function loadMovieFrameGenerationPlan(root: string, movieId: string): MovieFrameGenerationPlan | null {
  const spec = FRAME_GENERATION_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieFrameGenerationPlan;
}

export function loadAllMovieFrameGenerationPlans(root: string): MovieFrameGenerationPlan[] {
  return FRAME_GENERATION_OUTPUTS.map((spec) => loadMovieFrameGenerationPlan(root, spec.movie_id)).filter(
    (plan): plan is MovieFrameGenerationPlan => plan !== null
  );
}

export { SAFE_CREATE_POLICY };
