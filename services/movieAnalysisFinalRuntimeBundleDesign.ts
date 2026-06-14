import fs from 'node:fs';
import path from 'node:path';
import {
  EXECUTION_READINESS_REGISTRY_PATH,
  type ExecutionReadinessElement,
  type MovieAnalysisExecutionReadinessPlan,
  loadMovieAnalysisExecutionReadinessPlan,
} from './movieAnalysisExecutionReadinessDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_RUNTIME_BUNDLE_PHASE =
  'PHASE-SOURCE-VIDEO-038-MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1' as const;
export const FINAL_RUNTIME_BUNDLE_SCHEMA_PATH =
  'datasets/movie_analysis/final_runtime_bundle/movie-analysis-final-runtime-bundle.schema.json' as const;
export const FINAL_RUNTIME_BUNDLE_REGISTRY_PATH =
  'datasets/movie_analysis/final_runtime_bundle/movie-analysis-final-runtime-bundle-registry.json' as const;
export const FINAL_RUNTIME_BUNDLE_PLANS_DIR =
  'datasets/movie_analysis/final_runtime_bundle/plans' as const;

export type FinalRuntimeBundleElement = {
  element_id: string;
  source_readiness_element_ids: string[];
  estimated_bundle_value: string;
  final_runtime_bundle_only: true;
};

export type FinalRuntimeBundleExecutionFlags = {
  planning_only: true;
  final_runtime_bundle_only: true;
  estimated_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisFinalRuntimeBundlePlan = {
  final_runtime_bundle_id: string;
  phase: typeof FINAL_RUNTIME_BUNDLE_PHASE;
  execution_readiness_id: string;
  source_video_id: string;
  scene_bundle: FinalRuntimeBundleElement[];
  character_bundle: FinalRuntimeBundleElement[];
  camera_bundle: FinalRuntimeBundleElement[];
  emotion_bundle: FinalRuntimeBundleElement[];
  transition_bundle: FinalRuntimeBundleElement[];
  continuity_bundle: FinalRuntimeBundleElement[];
  runtime_bundle: FinalRuntimeBundleElement[];
  safety_bundle: FinalRuntimeBundleElement[];
  execution_flags: FinalRuntimeBundleExecutionFlags;
  designed_at: string;
};

export const SEED_FINAL_RUNTIME_BUNDLE_SPECS = Object.freeze([
  {
    final_runtime_bundle_id: 'final_runtime_bundle_ghibli_01_v1',
    execution_readiness_id: 'execution_readiness_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    final_runtime_bundle_id: 'final_runtime_bundle_shinkai_01_v1',
    execution_readiness_id: 'execution_readiness_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    final_runtime_bundle_id: 'final_runtime_bundle_little_women_01_v1',
    execution_readiness_id: 'execution_readiness_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    final_runtime_bundle_id: 'final_runtime_bundle_mori_01_v1',
    execution_readiness_id: 'execution_readiness_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: FinalRuntimeBundleExecutionFlags = {
  planning_only: true,
  final_runtime_bundle_only: true,
  estimated_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

type ReadinessSectionKey =
  | 'scene_readiness'
  | 'character_readiness'
  | 'camera_readiness'
  | 'emotion_readiness'
  | 'transition_readiness'
  | 'continuity_readiness';

const READINESS_TO_BUNDLE_MAP: Record<ReadinessSectionKey, keyof MovieAnalysisFinalRuntimeBundlePlan> = {
  scene_readiness: 'scene_bundle',
  character_readiness: 'character_bundle',
  camera_readiness: 'camera_bundle',
  emotion_readiness: 'emotion_bundle',
  transition_readiness: 'transition_bundle',
  continuity_readiness: 'continuity_bundle',
};

const BUNDLE_PREFIX_MAP: Record<ReadinessSectionKey, string> = {
  scene_readiness: 'scene',
  character_readiness: 'character',
  camera_readiness: 'camera',
  emotion_readiness: 'emotion',
  transition_readiness: 'transition',
  continuity_readiness: 'continuity',
};

function buildBundleSection(
  bundleId: string,
  bundlePrefix: string,
  readinessElements: ExecutionReadinessElement[]
): FinalRuntimeBundleElement[] {
  if (readinessElements.length === 0) return [];

  return [
    {
      element_id: `${bundleId}_${bundlePrefix}_001`,
      source_readiness_element_ids: readinessElements.map((e) => e.element_id),
      estimated_bundle_value: `estimated_bundle_${bundlePrefix}_layout`,
      final_runtime_bundle_only: true,
    },
    ...readinessElements.map((element, index) => ({
      element_id: `${bundleId}_${bundlePrefix}_${String(index + 2).padStart(3, '0')}`,
      source_readiness_element_ids: [element.element_id],
      estimated_bundle_value: `estimated_bundle_${bundlePrefix}_${element.estimated_readiness_value.replace('estimated_readiness_', '')}`,
      final_runtime_bundle_only: true as const,
    })),
  ];
}

function collectLayoutElements(
  readinessPlan: MovieAnalysisExecutionReadinessPlan
): ExecutionReadinessElement[] {
  return [
    readinessPlan.scene_readiness[0],
    readinessPlan.character_readiness[0],
    readinessPlan.camera_readiness[0],
    readinessPlan.emotion_readiness[0],
    readinessPlan.transition_readiness[0],
    readinessPlan.continuity_readiness[0],
  ].filter((e): e is ExecutionReadinessElement => Boolean(e));
}

function buildRuntimeBundle(
  bundleId: string,
  readinessPlan: MovieAnalysisExecutionReadinessPlan
): FinalRuntimeBundleElement[] {
  const layoutElements = collectLayoutElements(readinessPlan);
  const anchor = layoutElements[0]?.element_id ?? `${readinessPlan.execution_readiness_id}_scene_001`;

  const runtimeRoles = [
    'estimated_only',
    'execution_readiness_only',
    'no_runtime_execution',
    'no_video_generation',
    'no_image_generation',
    'no_gpu_ready',
  ] as const;

  return [
    {
      element_id: `${bundleId}_runtime_001`,
      source_readiness_element_ids: layoutElements.map((e) => e.element_id),
      estimated_bundle_value: 'estimated_bundle_runtime_layout',
      final_runtime_bundle_only: true,
    },
    ...runtimeRoles.map((role, index) => ({
      element_id: `${bundleId}_runtime_${String(index + 2).padStart(3, '0')}`,
      source_readiness_element_ids: [layoutElements[index % layoutElements.length]?.element_id ?? anchor],
      estimated_bundle_value: `estimated_bundle_runtime_${role}`,
      final_runtime_bundle_only: true as const,
    })),
  ];
}

function buildSafetyBundle(
  bundleId: string,
  readinessPlan: MovieAnalysisExecutionReadinessPlan
): FinalRuntimeBundleElement[] {
  const layoutElements = collectLayoutElements(readinessPlan);
  const anchor = layoutElements[0]?.element_id ?? `${readinessPlan.execution_readiness_id}_scene_001`;

  const safetyRoles = [
    'planning_only',
    'final_runtime_bundle_only',
    'estimated_only',
    'no_runtime_execution',
    'no_video_generation',
    'no_image_generation',
    'no_gpu_execution',
    'no_external_call',
  ] as const;

  return [
    {
      element_id: `${bundleId}_safety_001`,
      source_readiness_element_ids: layoutElements.map((e) => e.element_id),
      estimated_bundle_value: 'estimated_bundle_safety_layout',
      final_runtime_bundle_only: true,
    },
    ...safetyRoles.map((role, index) => ({
      element_id: `${bundleId}_safety_${String(index + 2).padStart(3, '0')}`,
      source_readiness_element_ids: [layoutElements[index % layoutElements.length]?.element_id ?? anchor],
      estimated_bundle_value: `estimated_bundle_safety_${role}`,
      final_runtime_bundle_only: true as const,
    })),
  ];
}

function buildFinalRuntimeBundlePlan(
  spec: (typeof SEED_FINAL_RUNTIME_BUNDLE_SPECS)[number],
  readinessPlan: MovieAnalysisExecutionReadinessPlan
): MovieAnalysisFinalRuntimeBundlePlan {
  if (readinessPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Execution readiness source mismatch for ${spec.execution_readiness_id}`);
  }

  const bundleSections = Object.fromEntries(
    (Object.keys(READINESS_TO_BUNDLE_MAP) as ReadinessSectionKey[]).map((readinessKey) => [
      READINESS_TO_BUNDLE_MAP[readinessKey],
      buildBundleSection(
        spec.final_runtime_bundle_id,
        BUNDLE_PREFIX_MAP[readinessKey],
        readinessPlan[readinessKey]
      ),
    ])
  ) as Pick<
    MovieAnalysisFinalRuntimeBundlePlan,
    | 'scene_bundle'
    | 'character_bundle'
    | 'camera_bundle'
    | 'emotion_bundle'
    | 'transition_bundle'
    | 'continuity_bundle'
  >;

  return {
    final_runtime_bundle_id: spec.final_runtime_bundle_id,
    phase: FINAL_RUNTIME_BUNDLE_PHASE,
    execution_readiness_id: readinessPlan.execution_readiness_id,
    source_video_id: readinessPlan.source_video_id,
    ...bundleSections,
    runtime_bundle: buildRuntimeBundle(spec.final_runtime_bundle_id, readinessPlan),
    safety_bundle: buildSafetyBundle(spec.final_runtime_bundle_id, readinessPlan),
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type ExecutionReadinessRegistry = {
  execution_readiness_plans: Array<{
    execution_readiness_id: string;
    source_video_id: string;
  }>;
};

function loadExecutionReadinessRegistry(projectRoot: string): ExecutionReadinessRegistry | null {
  const abs = path.join(projectRoot, EXECUTION_READINESS_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as ExecutionReadinessRegistry;
}

export function buildSeedFinalRuntimeBundlePlans(
  projectRoot?: string
): MovieAnalysisFinalRuntimeBundlePlan[] {
  const root = resolveProjectRoot(projectRoot);
  const readinessRegistry = loadExecutionReadinessRegistry(root);
  if (!readinessRegistry) {
    throw new Error(`Missing execution readiness registry: ${EXECUTION_READINESS_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisFinalRuntimeBundlePlan[] = [];

  for (const spec of SEED_FINAL_RUNTIME_BUNDLE_SPECS) {
    const registryEntry = readinessRegistry.execution_readiness_plans.find(
      (p) => p.execution_readiness_id === spec.execution_readiness_id
    );
    if (!registryEntry) {
      throw new Error(`Execution readiness plan not in registry: ${spec.execution_readiness_id}`);
    }

    const readinessPlan = loadMovieAnalysisExecutionReadinessPlan(
      root,
      spec.execution_readiness_id
    );
    if (!readinessPlan) {
      throw new Error(`Missing execution readiness plan: ${spec.execution_readiness_id}`);
    }

    if (readinessPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Execution readiness source mismatch for ${spec.execution_readiness_id}`);
    }

    plans.push(buildFinalRuntimeBundlePlan(spec, readinessPlan));
  }

  return plans;
}

export function writeMovieAnalysisFinalRuntimeBundlePlans(projectRoot?: string): {
  plans: MovieAnalysisFinalRuntimeBundlePlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedFinalRuntimeBundlePlans(root);
  const outDir = path.join(root, FINAL_RUNTIME_BUNDLE_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${FINAL_RUNTIME_BUNDLE_PLANS_DIR}/${plan.final_runtime_bundle_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-final-runtime-bundle-registry-v1',
    phase: FINAL_RUNTIME_BUNDLE_PHASE,
    registry_version: 'v1',
    schema_path: FINAL_RUNTIME_BUNDLE_SCHEMA_PATH,
    execution_readiness_registry_path: EXECUTION_READINESS_REGISTRY_PATH,
    storage_dir: FINAL_RUNTIME_BUNDLE_PLANS_DIR,
    final_runtime_bundle_plans: plans.map((plan) => ({
      final_runtime_bundle_id: plan.final_runtime_bundle_id,
      plan_path: `${FINAL_RUNTIME_BUNDLE_PLANS_DIR}/${plan.final_runtime_bundle_id}.json`,
      source_video_id: plan.source_video_id,
      execution_readiness_id: plan.execution_readiness_id,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, FINAL_RUNTIME_BUNDLE_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisFinalRuntimeBundlePlan(
  projectRoot: string,
  finalRuntimeBundleId: string
): MovieAnalysisFinalRuntimeBundlePlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, FINAL_RUNTIME_BUNDLE_PLANS_DIR, `${finalRuntimeBundleId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisFinalRuntimeBundlePlan;
}
