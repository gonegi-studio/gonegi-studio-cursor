import fs from 'node:fs';
import path from 'node:path';
import {
  VIDEO_BLUEPRINT_REGISTRY_PATH,
  type BlueprintStructureElement,
  type MovieAnalysisVideoBlueprintPlan,
  type SequenceBlock,
  loadMovieAnalysisVideoBlueprintPlan,
} from './movieAnalysisVideoBlueprintDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_PACKAGE_PHASE =
  'PHASE-SOURCE-VIDEO-034-MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1' as const;
export const RUNTIME_PACKAGE_SCHEMA_PATH =
  'datasets/movie_analysis/runtime_package/movie-analysis-runtime-package.schema.json' as const;
export const RUNTIME_PACKAGE_REGISTRY_PATH =
  'datasets/movie_analysis/runtime_package/movie-analysis-runtime-package-registry.json' as const;
export const RUNTIME_PACKAGE_PLANS_DIR =
  'datasets/movie_analysis/runtime_package/plans' as const;

export type RuntimePackageElement = {
  element_id: string;
  source_blueprint_element_ids: string[];
  estimated_runtime_value: string;
  package_only: true;
};

export type RuntimePackageExecutionFlags = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
};

export type MovieAnalysisRuntimePackagePlan = {
  runtime_package_id: string;
  phase: typeof RUNTIME_PACKAGE_PHASE;
  video_blueprint_id: string;
  source_video_id: string;
  scene_package: RuntimePackageElement[];
  character_package: RuntimePackageElement[];
  camera_package: RuntimePackageElement[];
  emotion_package: RuntimePackageElement[];
  transition_package: RuntimePackageElement[];
  runtime_readiness: {
    estimated_only: true;
    runtime_execution: false;
    generates_video: false;
    gpu_ready: false;
    purpose: 'future_runtime_package_preparation';
  };
  execution_flags: RuntimePackageExecutionFlags;
  designed_at: string;
};

export const SEED_RUNTIME_PACKAGE_SPECS = Object.freeze([
  {
    runtime_package_id: 'runtime_package_ghibli_01_v1',
    video_blueprint_id: 'video_blueprint_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    runtime_package_id: 'runtime_package_shinkai_01_v1',
    video_blueprint_id: 'video_blueprint_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    runtime_package_id: 'runtime_package_little_women_01_v1',
    video_blueprint_id: 'video_blueprint_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    runtime_package_id: 'runtime_package_mori_01_v1',
    video_blueprint_id: 'video_blueprint_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: RuntimePackageExecutionFlags = {
  planning_only: true,
  runtime_execution: false,
  video_generation: false,
  gpu_execution: false,
  ocr: false,
  external_call_allowed: false,
};

function buildScenePackage(
  packageId: string,
  blocks: SequenceBlock[]
): RuntimePackageElement[] {
  return [
    {
      element_id: `${packageId}_scene_001`,
      source_blueprint_element_ids: blocks.map((b) => b.block_id),
      estimated_runtime_value: 'estimated_runtime_scene_layout',
      package_only: true,
    },
    ...blocks.map((block, index) => ({
      element_id: `${packageId}_scene_${String(index + 2).padStart(3, '0')}`,
      source_blueprint_element_ids: [block.block_id],
      estimated_runtime_value: `estimated_runtime_scene_${block.estimated_block_role.replace('estimated_block_', '')}`,
      package_only: true as const,
    })),
  ];
}

function buildStructurePackage(
  packageId: string,
  packageKey: 'character' | 'camera' | 'emotion' | 'transition',
  elements: BlueprintStructureElement[],
  filterFn?: (element: BlueprintStructureElement) => boolean
): RuntimePackageElement[] {
  const matched = filterFn ? elements.filter(filterFn) : elements;
  const source = matched.length > 0 ? matched : elements;
  if (source.length === 0) return [];

  return [
    {
      element_id: `${packageId}_${packageKey}_001`,
      source_blueprint_element_ids: source.map((e) => e.element_id),
      estimated_runtime_value: `estimated_runtime_${packageKey}_layout`,
      package_only: true,
    },
    ...source.map((element, index) => ({
      element_id: `${packageId}_${packageKey}_${String(index + 2).padStart(3, '0')}`,
      source_blueprint_element_ids: [element.element_id],
      estimated_runtime_value: `estimated_runtime_${packageKey}_${element.estimated_blueprint_value.replace('estimated_blueprint_', '')}`,
      package_only: true as const,
    })),
  ];
}

function buildRuntimePackagePlan(
  spec: (typeof SEED_RUNTIME_PACKAGE_SPECS)[number],
  blueprintPlan: MovieAnalysisVideoBlueprintPlan
): MovieAnalysisRuntimePackagePlan {
  if (blueprintPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Video blueprint source mismatch for ${spec.video_blueprint_id}`);
  }

  const characterPackage = buildStructurePackage(
    spec.runtime_package_id,
    'character',
    blueprintPlan.continuity_structure,
    (e) => e.estimated_blueprint_value.includes('character')
  );
  const cameraPackage = buildStructurePackage(
    spec.runtime_package_id,
    'camera',
    blueprintPlan.camera_structure
  );
  const emotionPackage = buildStructurePackage(
    spec.runtime_package_id,
    'emotion',
    blueprintPlan.emotion_structure
  );
  const transitionPackage = buildStructurePackage(
    spec.runtime_package_id,
    'transition',
    blueprintPlan.transition_structure
  );
  const scenePackage = buildScenePackage(spec.runtime_package_id, blueprintPlan.sequence_blocks);

  return {
    runtime_package_id: spec.runtime_package_id,
    phase: RUNTIME_PACKAGE_PHASE,
    video_blueprint_id: blueprintPlan.video_blueprint_id,
    source_video_id: blueprintPlan.source_video_id,
    scene_package: scenePackage,
    character_package: characterPackage,
    camera_package: cameraPackage,
    emotion_package: emotionPackage,
    transition_package: transitionPackage,
    runtime_readiness: {
      estimated_only: true,
      runtime_execution: false,
      generates_video: false,
      gpu_ready: false,
      purpose: 'future_runtime_package_preparation',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type VideoBlueprintRegistry = {
  video_blueprint_plans: Array<{
    video_blueprint_id: string;
    source_video_id: string;
  }>;
};

function loadVideoBlueprintRegistry(projectRoot: string): VideoBlueprintRegistry | null {
  const abs = path.join(projectRoot, VIDEO_BLUEPRINT_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as VideoBlueprintRegistry;
}

export function buildSeedRuntimePackagePlans(
  projectRoot?: string
): MovieAnalysisRuntimePackagePlan[] {
  const root = resolveProjectRoot(projectRoot);
  const blueprintRegistry = loadVideoBlueprintRegistry(root);
  if (!blueprintRegistry) {
    throw new Error(`Missing video blueprint registry: ${VIDEO_BLUEPRINT_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisRuntimePackagePlan[] = [];

  for (const spec of SEED_RUNTIME_PACKAGE_SPECS) {
    const registryEntry = blueprintRegistry.video_blueprint_plans.find(
      (p) => p.video_blueprint_id === spec.video_blueprint_id
    );
    if (!registryEntry) {
      throw new Error(`Video blueprint plan not in registry: ${spec.video_blueprint_id}`);
    }

    const blueprintPlan = loadMovieAnalysisVideoBlueprintPlan(root, spec.video_blueprint_id);
    if (!blueprintPlan) {
      throw new Error(`Missing video blueprint plan: ${spec.video_blueprint_id}`);
    }

    if (blueprintPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Video blueprint source mismatch for ${spec.video_blueprint_id}`);
    }

    plans.push(buildRuntimePackagePlan(spec, blueprintPlan));
  }

  return plans;
}

export function writeMovieAnalysisRuntimePackagePlans(projectRoot?: string): {
  plans: MovieAnalysisRuntimePackagePlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedRuntimePackagePlans(root);
  const outDir = path.join(root, RUNTIME_PACKAGE_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${RUNTIME_PACKAGE_PLANS_DIR}/${plan.runtime_package_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-runtime-package-registry-v1',
    phase: RUNTIME_PACKAGE_PHASE,
    registry_version: 'v1',
    schema_path: RUNTIME_PACKAGE_SCHEMA_PATH,
    video_blueprint_registry_path: VIDEO_BLUEPRINT_REGISTRY_PATH,
    storage_dir: RUNTIME_PACKAGE_PLANS_DIR,
    runtime_package_plans: plans.map((plan) => ({
      runtime_package_id: plan.runtime_package_id,
      plan_path: `${RUNTIME_PACKAGE_PLANS_DIR}/${plan.runtime_package_id}.json`,
      source_video_id: plan.source_video_id,
      video_blueprint_id: plan.video_blueprint_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, RUNTIME_PACKAGE_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisRuntimePackagePlan(
  projectRoot: string,
  runtimePackageId: string
): MovieAnalysisRuntimePackagePlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, RUNTIME_PACKAGE_PLANS_DIR, `${runtimePackageId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRuntimePackagePlan;
}
