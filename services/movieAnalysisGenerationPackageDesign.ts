import fs from 'node:fs';
import path from 'node:path';
import {
  loadMovieAnalysisVideoBlueprintPlan,
  type MovieAnalysisVideoBlueprintPlan,
} from './movieAnalysisVideoBlueprintDesign.js';
import {
  RUNTIME_PACKAGE_REGISTRY_PATH,
  type MovieAnalysisRuntimePackagePlan,
  type RuntimePackageElement,
  loadMovieAnalysisRuntimePackagePlan,
} from './movieAnalysisRuntimePackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATION_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-035-MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1' as const;
export const GENERATION_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/generation_package/movie-analysis-generation-package.schema.json' as const;
export const GENERATION_PACKAGE_REGISTRY_PATH =
  'datasets/movie_analysis/generation_package/movie-analysis-generation-package-registry.json' as const;
export const GENERATION_PACKAGE_PLANS_DIR =
  'datasets/movie_analysis/generation_package/plans' as const;

export type GenerationPackageElement = {
  element_id: string;
  source_runtime_element_ids: string[];
  estimated_generation_value: string;
  generation_package_only: true;
};

export type GenerationPackageExecutionFlags = {
  planning_only: true;
  generation_package_only: true;
  estimated_only: true;
  video_generation: false;
  image_generation: false;
  runtime_execution: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisGenerationPackagePlan = {
  generation_package_id: string;
  phase: typeof GENERATION_PACKAGE_PHASE;
  runtime_package_id: string;
  source_video_id: string;
  scene_generation_package: GenerationPackageElement[];
  character_generation_package: GenerationPackageElement[];
  camera_generation_package: GenerationPackageElement[];
  emotion_generation_package: GenerationPackageElement[];
  transition_generation_package: GenerationPackageElement[];
  continuity_generation_package: GenerationPackageElement[];
  runtime_readiness: {
    estimated_only: true;
    generation_package_only: true;
    video_generation: false;
    image_generation: false;
    runtime_execution: false;
    gpu_ready: false;
    purpose: 'future_video_generation_preparation';
  };
  execution_flags: GenerationPackageExecutionFlags;
  designed_at: string;
};

export const SEED_GENERATION_PACKAGE_SPECS = Object.freeze([
  {
    generation_package_id: 'generation_package_ghibli_01_v1',
    runtime_package_id: 'runtime_package_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    generation_package_id: 'generation_package_shinkai_01_v1',
    runtime_package_id: 'runtime_package_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    generation_package_id: 'generation_package_little_women_01_v1',
    runtime_package_id: 'runtime_package_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    generation_package_id: 'generation_package_mori_01_v1',
    runtime_package_id: 'runtime_package_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: GenerationPackageExecutionFlags = {
  planning_only: true,
  generation_package_only: true,
  estimated_only: true,
  video_generation: false,
  image_generation: false,
  runtime_execution: false,
  gpu_execution: false,
  external_call_allowed: false,
};

type RuntimeSectionKey = 'scene' | 'character' | 'camera' | 'emotion' | 'transition';

const RUNTIME_SECTION_MAP: Record<
  RuntimeSectionKey,
  keyof Pick<
    MovieAnalysisRuntimePackagePlan,
    'scene_package' | 'character_package' | 'camera_package' | 'emotion_package' | 'transition_package'
  >
> = {
  scene: 'scene_package',
  character: 'character_package',
  camera: 'camera_package',
  emotion: 'emotion_package',
  transition: 'transition_package',
};

function buildGenerationSection(
  packageId: string,
  sectionKey: RuntimeSectionKey,
  runtimeElements: RuntimePackageElement[]
): GenerationPackageElement[] {
  if (runtimeElements.length === 0) return [];

  return [
    {
      element_id: `${packageId}_${sectionKey}_001`,
      source_runtime_element_ids: runtimeElements.map((e) => e.element_id),
      estimated_generation_value: `estimated_generation_${sectionKey}_layout`,
      generation_package_only: true,
    },
    ...runtimeElements.map((element, index) => ({
      element_id: `${packageId}_${sectionKey}_${String(index + 2).padStart(3, '0')}`,
      source_runtime_element_ids: [element.element_id],
      estimated_generation_value: `estimated_generation_${sectionKey}_${element.estimated_runtime_value.replace('estimated_runtime_', '')}`,
      generation_package_only: true as const,
    })),
  ];
}

function collectAllRuntimeElements(
  runtimePlan: MovieAnalysisRuntimePackagePlan
): RuntimePackageElement[] {
  return [
    ...runtimePlan.scene_package,
    ...runtimePlan.character_package,
    ...runtimePlan.camera_package,
    ...runtimePlan.emotion_package,
    ...runtimePlan.transition_package,
  ];
}

function buildContinuityGenerationPackage(
  packageId: string,
  runtimePlan: MovieAnalysisRuntimePackagePlan,
  blueprintPlan: MovieAnalysisVideoBlueprintPlan
): GenerationPackageElement[] {
  const allRuntimeElements = collectAllRuntimeElements(runtimePlan);
  const anchorElement =
    runtimePlan.scene_package[0]?.element_id ?? `${runtimePlan.runtime_package_id}_scene_001`;

  const environmentContinuity = blueprintPlan.continuity_structure.filter((e) =>
    e.estimated_blueprint_value.includes('environment')
  );
  const nonCharacterContinuity = blueprintPlan.continuity_structure.filter(
    (e) => !e.estimated_blueprint_value.includes('character')
  );
  const continuitySource =
    environmentContinuity.length > 0
      ? environmentContinuity
      : nonCharacterContinuity.length > 0
        ? nonCharacterContinuity
        : blueprintPlan.continuity_structure;

  return [
    {
      element_id: `${packageId}_continuity_001`,
      source_runtime_element_ids: [anchorElement],
      estimated_generation_value: 'estimated_generation_continuity_layout',
      generation_package_only: true,
    },
    ...continuitySource.map((element, index) => {
      const linkedRuntime = allRuntimeElements.find((rt) =>
        rt.source_blueprint_element_ids.includes(element.element_id)
      );
      return {
        element_id: `${packageId}_continuity_${String(index + 2).padStart(3, '0')}`,
        source_runtime_element_ids: [linkedRuntime?.element_id ?? anchorElement],
        estimated_generation_value: `estimated_generation_continuity_${element.estimated_blueprint_value.replace('estimated_blueprint_', '')}`,
        generation_package_only: true as const,
      };
    }),
  ];
}

function buildGenerationPackagePlan(
  spec: (typeof SEED_GENERATION_PACKAGE_SPECS)[number],
  runtimePlan: MovieAnalysisRuntimePackagePlan,
  blueprintPlan: MovieAnalysisVideoBlueprintPlan
): MovieAnalysisGenerationPackagePlan {
  if (runtimePlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Runtime package source mismatch for ${spec.runtime_package_id}`);
  }

  const sections = Object.fromEntries(
    (Object.keys(RUNTIME_SECTION_MAP) as RuntimeSectionKey[]).map((key) => [
      key,
      buildGenerationSection(
        spec.generation_package_id,
        key,
        runtimePlan[RUNTIME_SECTION_MAP[key]]
      ),
    ])
  ) as Record<RuntimeSectionKey, GenerationPackageElement[]>;

  return {
    generation_package_id: spec.generation_package_id,
    phase: GENERATION_PACKAGE_PHASE,
    runtime_package_id: runtimePlan.runtime_package_id,
    source_video_id: runtimePlan.source_video_id,
    scene_generation_package: sections.scene,
    character_generation_package: sections.character,
    camera_generation_package: sections.camera,
    emotion_generation_package: sections.emotion,
    transition_generation_package: sections.transition,
    continuity_generation_package: buildContinuityGenerationPackage(
      spec.generation_package_id,
      runtimePlan,
      blueprintPlan
    ),
    runtime_readiness: {
      estimated_only: true,
      generation_package_only: true,
      video_generation: false,
      image_generation: false,
      runtime_execution: false,
      gpu_ready: false,
      purpose: 'future_video_generation_preparation',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type RuntimePackageRegistry = {
  runtime_package_plans: Array<{
    runtime_package_id: string;
    source_video_id: string;
    video_blueprint_id: string;
  }>;
};

function loadRuntimePackageRegistry(projectRoot: string): RuntimePackageRegistry | null {
  const abs = path.join(projectRoot, RUNTIME_PACKAGE_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RuntimePackageRegistry;
}

export function buildSeedGenerationPackagePlans(
  projectRoot?: string
): MovieAnalysisGenerationPackagePlan[] {
  const root = resolveProjectRoot(projectRoot);
  const runtimeRegistry = loadRuntimePackageRegistry(root);
  if (!runtimeRegistry) {
    throw new Error(`Missing runtime package registry: ${RUNTIME_PACKAGE_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisGenerationPackagePlan[] = [];

  for (const spec of SEED_GENERATION_PACKAGE_SPECS) {
    const registryEntry = runtimeRegistry.runtime_package_plans.find(
      (p) => p.runtime_package_id === spec.runtime_package_id
    );
    if (!registryEntry) {
      throw new Error(`Runtime package plan not in registry: ${spec.runtime_package_id}`);
    }

    const runtimePlan = loadMovieAnalysisRuntimePackagePlan(root, spec.runtime_package_id);
    if (!runtimePlan) {
      throw new Error(`Missing runtime package plan: ${spec.runtime_package_id}`);
    }

    if (runtimePlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Runtime package source mismatch for ${spec.runtime_package_id}`);
    }

    const blueprintPlan = loadMovieAnalysisVideoBlueprintPlan(
      root,
      registryEntry.video_blueprint_id
    );
    if (!blueprintPlan) {
      throw new Error(`Missing video blueprint plan: ${registryEntry.video_blueprint_id}`);
    }

    plans.push(buildGenerationPackagePlan(spec, runtimePlan, blueprintPlan));
  }

  return plans;
}

export function writeMovieAnalysisGenerationPackagePlans(projectRoot?: string): {
  plans: MovieAnalysisGenerationPackagePlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedGenerationPackagePlans(root);
  const outDir = path.join(root, GENERATION_PACKAGE_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${GENERATION_PACKAGE_PLANS_DIR}/${plan.generation_package_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-generation-package-registry-v1',
    phase: GENERATION_PACKAGE_PHASE,
    registry_version: 'v1',
    schema_path: GENERATION_PACKAGE_SCHEMA_PATH,
    runtime_package_registry_path: RUNTIME_PACKAGE_REGISTRY_PATH,
    storage_dir: GENERATION_PACKAGE_PLANS_DIR,
    generation_package_plans: plans.map((plan) => ({
      generation_package_id: plan.generation_package_id,
      plan_path: `${GENERATION_PACKAGE_PLANS_DIR}/${plan.generation_package_id}.json`,
      source_video_id: plan.source_video_id,
      runtime_package_id: plan.runtime_package_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, GENERATION_PACKAGE_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisGenerationPackagePlan(
  projectRoot: string,
  generationPackageId: string
): MovieAnalysisGenerationPackagePlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GENERATION_PACKAGE_PLANS_DIR, `${generationPackageId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisGenerationPackagePlan;
}
