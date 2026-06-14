import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_BLUEPRINT_REGISTRY_PATH,
  type GenerationBlueprintStructureElement,
  type MovieAnalysisGenerationBlueprintPlan,
  loadMovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const EXECUTION_READINESS_PHASE =
  'PHASE-SOURCE-VIDEO-037-MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1' as const;
export const EXECUTION_READINESS_SCHEMA_PATH =
  'datasets/movie_analysis/execution_readiness/movie-analysis-execution-readiness.schema.json' as const;
export const EXECUTION_READINESS_REGISTRY_PATH =
  'datasets/movie_analysis/execution_readiness/movie-analysis-execution-readiness-registry.json' as const;
export const EXECUTION_READINESS_PLANS_DIR =
  'datasets/movie_analysis/execution_readiness/plans' as const;

export type ExecutionReadinessElement = {
  element_id: string;
  source_blueprint_element_ids: string[];
  estimated_readiness_value: string;
  execution_readiness_only: true;
};

export type ExecutionReadinessExecutionFlags = {
  planning_only: true;
  execution_readiness_only: true;
  estimated_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisExecutionReadinessPlan = {
  execution_readiness_id: string;
  phase: typeof EXECUTION_READINESS_PHASE;
  generation_blueprint_id: string;
  source_video_id: string;
  scene_readiness: ExecutionReadinessElement[];
  character_readiness: ExecutionReadinessElement[];
  camera_readiness: ExecutionReadinessElement[];
  emotion_readiness: ExecutionReadinessElement[];
  transition_readiness: ExecutionReadinessElement[];
  continuity_readiness: ExecutionReadinessElement[];
  runtime_readiness: {
    estimated_only: true;
    execution_readiness_only: true;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_ready: false;
    purpose: 'future_execution_readiness_preparation';
  };
  execution_flags: ExecutionReadinessExecutionFlags;
  designed_at: string;
};

export const SEED_EXECUTION_READINESS_SPECS = Object.freeze([
  {
    execution_readiness_id: 'execution_readiness_ghibli_01_v1',
    generation_blueprint_id: 'generation_blueprint_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    execution_readiness_id: 'execution_readiness_shinkai_01_v1',
    generation_blueprint_id: 'generation_blueprint_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    execution_readiness_id: 'execution_readiness_little_women_01_v1',
    generation_blueprint_id: 'generation_blueprint_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    execution_readiness_id: 'execution_readiness_mori_01_v1',
    generation_blueprint_id: 'generation_blueprint_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: ExecutionReadinessExecutionFlags = {
  planning_only: true,
  execution_readiness_only: true,
  estimated_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

type BlueprintStructureKey =
  | 'scene_generation_structure'
  | 'character_generation_structure'
  | 'camera_generation_structure'
  | 'emotion_generation_structure'
  | 'transition_generation_structure'
  | 'continuity_generation_structure';

const BLUEPRINT_TO_READINESS_MAP: Record<BlueprintStructureKey, keyof MovieAnalysisExecutionReadinessPlan> = {
  scene_generation_structure: 'scene_readiness',
  character_generation_structure: 'character_readiness',
  camera_generation_structure: 'camera_readiness',
  emotion_generation_structure: 'emotion_readiness',
  transition_generation_structure: 'transition_readiness',
  continuity_generation_structure: 'continuity_readiness',
};

const READINESS_PREFIX_MAP: Record<BlueprintStructureKey, string> = {
  scene_generation_structure: 'scene',
  character_generation_structure: 'character',
  camera_generation_structure: 'camera',
  emotion_generation_structure: 'emotion',
  transition_generation_structure: 'transition',
  continuity_generation_structure: 'continuity',
};

function buildReadinessSection(
  readinessId: string,
  readinessPrefix: string,
  structureElements: GenerationBlueprintStructureElement[]
): ExecutionReadinessElement[] {
  if (structureElements.length === 0) return [];

  return [
    {
      element_id: `${readinessId}_${readinessPrefix}_001`,
      source_blueprint_element_ids: structureElements.map((e) => e.element_id),
      estimated_readiness_value: `estimated_readiness_${readinessPrefix}_layout`,
      execution_readiness_only: true,
    },
    ...structureElements.map((element, index) => ({
      element_id: `${readinessId}_${readinessPrefix}_${String(index + 2).padStart(3, '0')}`,
      source_blueprint_element_ids: [element.element_id],
      estimated_readiness_value: `estimated_readiness_${readinessPrefix}_${element.estimated_blueprint_value.replace('estimated_blueprint_', '')}`,
      execution_readiness_only: true as const,
    })),
  ];
}

function buildExecutionReadinessPlan(
  spec: (typeof SEED_EXECUTION_READINESS_SPECS)[number],
  blueprintPlan: MovieAnalysisGenerationBlueprintPlan
): MovieAnalysisExecutionReadinessPlan {
  if (blueprintPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Generation blueprint source mismatch for ${spec.generation_blueprint_id}`);
  }

  const readinessSections = Object.fromEntries(
    (Object.keys(BLUEPRINT_TO_READINESS_MAP) as BlueprintStructureKey[]).map((structureKey) => [
      BLUEPRINT_TO_READINESS_MAP[structureKey],
      buildReadinessSection(
        spec.execution_readiness_id,
        READINESS_PREFIX_MAP[structureKey],
        blueprintPlan[structureKey]
      ),
    ])
  ) as Pick<
    MovieAnalysisExecutionReadinessPlan,
    | 'scene_readiness'
    | 'character_readiness'
    | 'camera_readiness'
    | 'emotion_readiness'
    | 'transition_readiness'
    | 'continuity_readiness'
  >;

  return {
    execution_readiness_id: spec.execution_readiness_id,
    phase: EXECUTION_READINESS_PHASE,
    generation_blueprint_id: blueprintPlan.generation_blueprint_id,
    source_video_id: blueprintPlan.source_video_id,
    ...readinessSections,
    runtime_readiness: {
      estimated_only: true,
      execution_readiness_only: true,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_ready: false,
      purpose: 'future_execution_readiness_preparation',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type GenerationBlueprintRegistry = {
  generation_blueprint_plans: Array<{
    generation_blueprint_id: string;
    source_video_id: string;
  }>;
};

function loadGenerationBlueprintRegistry(projectRoot: string): GenerationBlueprintRegistry | null {
  const abs = path.join(projectRoot, GENERATION_BLUEPRINT_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GenerationBlueprintRegistry;
}

export function buildSeedExecutionReadinessPlans(
  projectRoot?: string
): MovieAnalysisExecutionReadinessPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const blueprintRegistry = loadGenerationBlueprintRegistry(root);
  if (!blueprintRegistry) {
    throw new Error(`Missing generation blueprint registry: ${GENERATION_BLUEPRINT_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisExecutionReadinessPlan[] = [];

  for (const spec of SEED_EXECUTION_READINESS_SPECS) {
    const registryEntry = blueprintRegistry.generation_blueprint_plans.find(
      (p) => p.generation_blueprint_id === spec.generation_blueprint_id
    );
    if (!registryEntry) {
      throw new Error(`Generation blueprint plan not in registry: ${spec.generation_blueprint_id}`);
    }

    const blueprintPlan = loadMovieAnalysisGenerationBlueprintPlan(
      root,
      spec.generation_blueprint_id
    );
    if (!blueprintPlan) {
      throw new Error(`Missing generation blueprint plan: ${spec.generation_blueprint_id}`);
    }

    if (blueprintPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Generation blueprint source mismatch for ${spec.generation_blueprint_id}`);
    }

    plans.push(buildExecutionReadinessPlan(spec, blueprintPlan));
  }

  return plans;
}

export function writeMovieAnalysisExecutionReadinessPlans(projectRoot?: string): {
  plans: MovieAnalysisExecutionReadinessPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedExecutionReadinessPlans(root);
  const outDir = path.join(root, EXECUTION_READINESS_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${EXECUTION_READINESS_PLANS_DIR}/${plan.execution_readiness_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-execution-readiness-registry-v1',
    phase: EXECUTION_READINESS_PHASE,
    registry_version: 'v1',
    schema_path: EXECUTION_READINESS_SCHEMA_PATH,
    generation_blueprint_registry_path: GENERATION_BLUEPRINT_REGISTRY_PATH,
    storage_dir: EXECUTION_READINESS_PLANS_DIR,
    execution_readiness_plans: plans.map((plan) => ({
      execution_readiness_id: plan.execution_readiness_id,
      plan_path: `${EXECUTION_READINESS_PLANS_DIR}/${plan.execution_readiness_id}.json`,
      source_video_id: plan.source_video_id,
      generation_blueprint_id: plan.generation_blueprint_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, EXECUTION_READINESS_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisExecutionReadinessPlan(
  projectRoot: string,
  executionReadinessId: string
): MovieAnalysisExecutionReadinessPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, EXECUTION_READINESS_PLANS_DIR, `${executionReadinessId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisExecutionReadinessPlan;
}
