import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_PACKAGE_REGISTRY_PATH,
  type GenerationPackageElement,
  type MovieAnalysisGenerationPackagePlan,
  loadMovieAnalysisGenerationPackagePlan,
} from './movieAnalysisGenerationPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_BLUEPRINT_PHASE =
  'PHASE-SOURCE-VIDEO-036-MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1' as const;
export const GENERATION_BLUEPRINT_SCHEMA_PATH =
  'datasets/movie_analysis/generation_blueprint/movie-analysis-generation-blueprint.schema.json' as const;
export const GENERATION_BLUEPRINT_REGISTRY_PATH =
  'datasets/movie_analysis/generation_blueprint/movie-analysis-generation-blueprint-registry.json' as const;
export const GENERATION_BLUEPRINT_PLANS_DIR =
  'datasets/movie_analysis/generation_blueprint/plans' as const;

export type GenerationBlueprintStructureElement = {
  element_id: string;
  source_generation_package_element_ids: string[];
  estimated_blueprint_value: string;
  generation_blueprint_only: true;
};

export type GenerationBlueprintExecutionFlags = {
  planning_only: true;
  generation_blueprint_only: true;
  estimated_only: true;
  video_generation: false;
  image_generation: false;
  runtime_execution: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisGenerationBlueprintPlan = {
  generation_blueprint_id: string;
  phase: typeof GENERATION_BLUEPRINT_PHASE;
  generation_package_id: string;
  source_video_id: string;
  scene_generation_structure: GenerationBlueprintStructureElement[];
  character_generation_structure: GenerationBlueprintStructureElement[];
  camera_generation_structure: GenerationBlueprintStructureElement[];
  emotion_generation_structure: GenerationBlueprintStructureElement[];
  transition_generation_structure: GenerationBlueprintStructureElement[];
  continuity_generation_structure: GenerationBlueprintStructureElement[];
  execution_readiness_structure: GenerationBlueprintStructureElement[];
  execution_flags: GenerationBlueprintExecutionFlags;
  designed_at: string;
};

export const SEED_GENERATION_BLUEPRINT_SPECS = Object.freeze([
  {
    generation_blueprint_id: 'generation_blueprint_ghibli_01_v1',
    generation_package_id: 'generation_package_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    generation_blueprint_id: 'generation_blueprint_shinkai_01_v1',
    generation_package_id: 'generation_package_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    generation_blueprint_id: 'generation_blueprint_little_women_01_v1',
    generation_package_id: 'generation_package_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    generation_blueprint_id: 'generation_blueprint_mori_01_v1',
    generation_package_id: 'generation_package_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: GenerationBlueprintExecutionFlags = {
  planning_only: true,
  generation_blueprint_only: true,
  estimated_only: true,
  video_generation: false,
  image_generation: false,
  runtime_execution: false,
  gpu_execution: false,
  external_call_allowed: false,
};

type PackageSectionKey =
  | 'scene_generation_package'
  | 'character_generation_package'
  | 'camera_generation_package'
  | 'emotion_generation_package'
  | 'transition_generation_package'
  | 'continuity_generation_package';

const PACKAGE_TO_STRUCTURE_MAP: Record<PackageSectionKey, keyof MovieAnalysisGenerationBlueprintPlan> = {
  scene_generation_package: 'scene_generation_structure',
  character_generation_package: 'character_generation_structure',
  camera_generation_package: 'camera_generation_structure',
  emotion_generation_package: 'emotion_generation_structure',
  transition_generation_package: 'transition_generation_structure',
  continuity_generation_package: 'continuity_generation_structure',
};

const STRUCTURE_PREFIX_MAP: Record<PackageSectionKey, string> = {
  scene_generation_package: 'scene',
  character_generation_package: 'character',
  camera_generation_package: 'camera',
  emotion_generation_package: 'emotion',
  transition_generation_package: 'transition',
  continuity_generation_package: 'continuity',
};

function buildGenerationStructure(
  blueprintId: string,
  structurePrefix: string,
  packageElements: GenerationPackageElement[]
): GenerationBlueprintStructureElement[] {
  if (packageElements.length === 0) return [];

  return [
    {
      element_id: `${blueprintId}_${structurePrefix}_001`,
      source_generation_package_element_ids: packageElements.map((e) => e.element_id),
      estimated_blueprint_value: `estimated_blueprint_${structurePrefix}_layout`,
      generation_blueprint_only: true,
    },
    ...packageElements.map((element, index) => ({
      element_id: `${blueprintId}_${structurePrefix}_${String(index + 2).padStart(3, '0')}`,
      source_generation_package_element_ids: [element.element_id],
      estimated_blueprint_value: `estimated_blueprint_${structurePrefix}_${element.estimated_generation_value.replace('estimated_generation_', '')}`,
      generation_blueprint_only: true as const,
    })),
  ];
}

function buildExecutionReadinessStructure(
  blueprintId: string,
  packagePlan: MovieAnalysisGenerationPackagePlan
): GenerationBlueprintStructureElement[] {
  const layoutElements = [
    packagePlan.scene_generation_package[0],
    packagePlan.character_generation_package[0],
    packagePlan.camera_generation_package[0],
    packagePlan.emotion_generation_package[0],
    packagePlan.transition_generation_package[0],
    packagePlan.continuity_generation_package[0],
  ].filter((e): e is GenerationPackageElement => Boolean(e));

  const readinessRoles = [
    'planning_only',
    'generation_blueprint_only',
    'estimated_only',
    'no_video_generation',
    'no_image_generation',
    'no_runtime_execution',
  ] as const;

  return [
    {
      element_id: `${blueprintId}_readiness_001`,
      source_generation_package_element_ids: layoutElements.map((e) => e.element_id),
      estimated_blueprint_value: 'estimated_blueprint_execution_readiness_layout',
      generation_blueprint_only: true,
    },
    ...readinessRoles.map((role, index) => ({
      element_id: `${blueprintId}_readiness_${String(index + 2).padStart(3, '0')}`,
      source_generation_package_element_ids: [
        layoutElements[index % layoutElements.length].element_id,
      ],
      estimated_blueprint_value: `estimated_blueprint_execution_readiness_${role}`,
      generation_blueprint_only: true as const,
    })),
  ];
}

function buildGenerationBlueprintPlan(
  spec: (typeof SEED_GENERATION_BLUEPRINT_SPECS)[number],
  packagePlan: MovieAnalysisGenerationPackagePlan
): MovieAnalysisGenerationBlueprintPlan {
  if (packagePlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Generation package source mismatch for ${spec.generation_package_id}`);
  }

  const structures = Object.fromEntries(
    (Object.keys(PACKAGE_TO_STRUCTURE_MAP) as PackageSectionKey[]).map((packageKey) => [
      PACKAGE_TO_STRUCTURE_MAP[packageKey],
      buildGenerationStructure(
        spec.generation_blueprint_id,
        STRUCTURE_PREFIX_MAP[packageKey],
        packagePlan[packageKey]
      ),
    ])
  ) as Pick<
    MovieAnalysisGenerationBlueprintPlan,
    | 'scene_generation_structure'
    | 'character_generation_structure'
    | 'camera_generation_structure'
    | 'emotion_generation_structure'
    | 'transition_generation_structure'
    | 'continuity_generation_structure'
  >;

  return {
    generation_blueprint_id: spec.generation_blueprint_id,
    phase: GENERATION_BLUEPRINT_PHASE,
    generation_package_id: packagePlan.generation_package_id,
    source_video_id: packagePlan.source_video_id,
    ...structures,
    execution_readiness_structure: buildExecutionReadinessStructure(
      spec.generation_blueprint_id,
      packagePlan
    ),
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type GenerationPackageRegistry = {
  generation_package_plans: Array<{
    generation_package_id: string;
    source_video_id: string;
  }>;
};

function loadGenerationPackageRegistry(projectRoot: string): GenerationPackageRegistry | null {
  const abs = path.join(projectRoot, GENERATION_PACKAGE_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GenerationPackageRegistry;
}

export function buildSeedGenerationBlueprintPlans(
  projectRoot?: string
): MovieAnalysisGenerationBlueprintPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const packageRegistry = loadGenerationPackageRegistry(root);
  if (!packageRegistry) {
    throw new Error(`Missing generation package registry: ${GENERATION_PACKAGE_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisGenerationBlueprintPlan[] = [];

  for (const spec of SEED_GENERATION_BLUEPRINT_SPECS) {
    const registryEntry = packageRegistry.generation_package_plans.find(
      (p) => p.generation_package_id === spec.generation_package_id
    );
    if (!registryEntry) {
      throw new Error(`Generation package plan not in registry: ${spec.generation_package_id}`);
    }

    const packagePlan = loadMovieAnalysisGenerationPackagePlan(root, spec.generation_package_id);
    if (!packagePlan) {
      throw new Error(`Missing generation package plan: ${spec.generation_package_id}`);
    }

    if (packagePlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Generation package source mismatch for ${spec.generation_package_id}`);
    }

    plans.push(buildGenerationBlueprintPlan(spec, packagePlan));
  }

  return plans;
}

export function writeMovieAnalysisGenerationBlueprintPlans(projectRoot?: string): {
  plans: MovieAnalysisGenerationBlueprintPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedGenerationBlueprintPlans(root);
  const outDir = path.join(root, GENERATION_BLUEPRINT_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${GENERATION_BLUEPRINT_PLANS_DIR}/${plan.generation_blueprint_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-generation-blueprint-registry-v1',
    phase: GENERATION_BLUEPRINT_PHASE,
    registry_version: 'v1',
    schema_path: GENERATION_BLUEPRINT_SCHEMA_PATH,
    generation_package_registry_path: GENERATION_PACKAGE_REGISTRY_PATH,
    storage_dir: GENERATION_BLUEPRINT_PLANS_DIR,
    generation_blueprint_plans: plans.map((plan) => ({
      generation_blueprint_id: plan.generation_blueprint_id,
      plan_path: `${GENERATION_BLUEPRINT_PLANS_DIR}/${plan.generation_blueprint_id}.json`,
      source_video_id: plan.source_video_id,
      generation_package_id: plan.generation_package_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, GENERATION_BLUEPRINT_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisGenerationBlueprintPlan(
  projectRoot: string,
  generationBlueprintId: string
): MovieAnalysisGenerationBlueprintPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GENERATION_BLUEPRINT_PLANS_DIR, `${generationBlueprintId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisGenerationBlueprintPlan;
}
