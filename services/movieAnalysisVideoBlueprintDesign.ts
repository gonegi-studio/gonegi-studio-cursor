import fs from 'node:fs';
import path from 'node:path';
import {
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
  loadMovieAnalysisSequenceAssemblyPlan,
  type SequenceCategory,
  type MovieAnalysisSequenceAssemblyPlan,
} from './movieAnalysisSequenceAssemblyDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_BLUEPRINT_PHASE =
  'PHASE-SOURCE-VIDEO-033-MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1' as const;
export const VIDEO_BLUEPRINT_SCHEMA_PATH =
  'datasets/movie_analysis/video_blueprint/movie-analysis-video-blueprint.schema.json' as const;
export const VIDEO_BLUEPRINT_REGISTRY_PATH =
  'datasets/movie_analysis/video_blueprint/movie-analysis-video-blueprint-registry.json' as const;
export const VIDEO_BLUEPRINT_PLANS_DIR =
  'datasets/movie_analysis/video_blueprint/plans' as const;

export type BlueprintStructureElement = {
  element_id: string;
  source_sequence_candidate_ids: string[];
  estimated_blueprint_value: string;
  blueprint_only: true;
};

export type SequenceBlock = {
  block_id: string;
  scene_index: number;
  sequence_candidate_ids: string[];
  estimated_block_role: string;
  blueprint_only: true;
};

export type VideoBlueprintExecutionFlags = {
  planning_only: true;
  video_generation: false;
  sequence_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
};

export type MovieAnalysisVideoBlueprintPlan = {
  video_blueprint_id: string;
  phase: typeof VIDEO_BLUEPRINT_PHASE;
  sequence_assembly_id: string;
  source_video_id: string;
  scene_count: number;
  sequence_blocks: SequenceBlock[];
  continuity_structure: BlueprintStructureElement[];
  emotion_structure: BlueprintStructureElement[];
  camera_structure: BlueprintStructureElement[];
  transition_structure: BlueprintStructureElement[];
  runtime_preparation: {
    estimated_only: true;
    generates_sequence: false;
    generates_video: false;
    gpu_ready: false;
    purpose: 'future_runtime_video_preparation';
  };
  execution_flags: VideoBlueprintExecutionFlags;
  designed_at: string;
};

export const TARGET_SCENE_COUNTS: Record<string, number> = {
  GHIBLI_01: 4,
  SHINKAI_01: 4,
  LITTLE_WOMEN_01: 6,
  MORI_01: 4,
};

export const SEED_VIDEO_BLUEPRINT_SPECS = Object.freeze([
  {
    video_blueprint_id: 'video_blueprint_ghibli_01_v1',
    sequence_assembly_id: 'sequence_assembly_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    video_blueprint_id: 'video_blueprint_shinkai_01_v1',
    sequence_assembly_id: 'sequence_assembly_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    video_blueprint_id: 'video_blueprint_little_women_01_v1',
    sequence_assembly_id: 'sequence_assembly_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    video_blueprint_id: 'video_blueprint_mori_01_v1',
    sequence_assembly_id: 'sequence_assembly_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: VideoBlueprintExecutionFlags = {
  planning_only: true,
  video_generation: false,
  sequence_generation: false,
  gpu_execution: false,
  ocr: false,
  external_call_allowed: false,
};

const STRUCTURE_CATEGORY_MAP: Record<
  'continuity_structure' | 'emotion_structure' | 'camera_structure' | 'transition_structure',
  SequenceCategory[]
> = {
  continuity_structure: ['continuity_chain', 'character_chain', 'environment_chain'],
  emotion_structure: ['emotion_chain'],
  camera_structure: ['camera_chain'],
  transition_structure: ['transition_chain'],
};

const BLOCK_ROLES = [
  'estimated_block_open',
  'estimated_block_develop',
  'estimated_block_peak',
  'estimated_block_resolve',
  'estimated_block_close',
  'estimated_block_bridge',
] as const;

function buildSequenceBlocks(
  blueprintId: string,
  assemblyPlan: MovieAnalysisSequenceAssemblyPlan,
  sceneCount: number
): SequenceBlock[] {
  const candidates = assemblyPlan.sequence_candidates;
  const perScene = Math.ceil(candidates.length / sceneCount);
  const blocks: SequenceBlock[] = [];

  for (let sceneIdx = 0; sceneIdx < sceneCount; sceneIdx++) {
    const start = sceneIdx * perScene;
    const slice = candidates.slice(start, start + perScene);
    if (slice.length === 0) continue;

    blocks.push({
      block_id: `${blueprintId}_sb_${String(sceneIdx + 1).padStart(3, '0')}`,
      scene_index: sceneIdx + 1,
      sequence_candidate_ids: slice.map((c) => c.sequence_candidate_id),
      estimated_block_role: BLOCK_ROLES[sceneIdx % BLOCK_ROLES.length],
      blueprint_only: true,
    });
  }

  return blocks;
}

function buildStructure(
  blueprintId: string,
  structureKey: keyof typeof STRUCTURE_CATEGORY_MAP,
  assemblyPlan: MovieAnalysisSequenceAssemblyPlan
): BlueprintStructureElement[] {
  const categories = STRUCTURE_CATEGORY_MAP[structureKey];
  const matched = assemblyPlan.sequence_candidates.filter((c) =>
    categories.includes(c.sequence_category)
  );
  if (matched.length === 0) return [];

  const prefix = structureKey.replace('_structure', '');
  return [
    {
      element_id: `${blueprintId}_${prefix}_001`,
      source_sequence_candidate_ids: matched.map((c) => c.sequence_candidate_id),
      estimated_blueprint_value: `estimated_blueprint_${prefix}_layout`,
      blueprint_only: true,
    },
    ...matched.map((candidate, index) => ({
      element_id: `${blueprintId}_${prefix}_${String(index + 2).padStart(3, '0')}`,
      source_sequence_candidate_ids: [candidate.sequence_candidate_id],
      estimated_blueprint_value: `estimated_blueprint_${prefix}_${candidate.estimated_sequence_value.replace('estimated_sequence_', '')}`,
      blueprint_only: true as const,
    })),
  ];
}

function buildVideoBlueprintPlan(
  spec: (typeof SEED_VIDEO_BLUEPRINT_SPECS)[number],
  assemblyPlan: MovieAnalysisSequenceAssemblyPlan
): MovieAnalysisVideoBlueprintPlan {
  const sceneCount = TARGET_SCENE_COUNTS[spec.source_video_id];
  if (!sceneCount) {
    throw new Error(`No scene count for ${spec.source_video_id}`);
  }

  if (assemblyPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Sequence assembly source mismatch for ${spec.sequence_assembly_id}`);
  }

  const sequenceBlocks = buildSequenceBlocks(spec.video_blueprint_id, assemblyPlan, sceneCount);
  if (sequenceBlocks.length !== sceneCount) {
    throw new Error(
      `Sequence block count mismatch for ${spec.video_blueprint_id}: expected ${sceneCount}, got ${sequenceBlocks.length}`
    );
  }

  return {
    video_blueprint_id: spec.video_blueprint_id,
    phase: VIDEO_BLUEPRINT_PHASE,
    sequence_assembly_id: assemblyPlan.sequence_assembly_id,
    source_video_id: assemblyPlan.source_video_id,
    scene_count: sceneCount,
    sequence_blocks: sequenceBlocks,
    continuity_structure: buildStructure(
      spec.video_blueprint_id,
      'continuity_structure',
      assemblyPlan
    ),
    emotion_structure: buildStructure(spec.video_blueprint_id, 'emotion_structure', assemblyPlan),
    camera_structure: buildStructure(spec.video_blueprint_id, 'camera_structure', assemblyPlan),
    transition_structure: buildStructure(
      spec.video_blueprint_id,
      'transition_structure',
      assemblyPlan
    ),
    runtime_preparation: {
      estimated_only: true,
      generates_sequence: false,
      generates_video: false,
      gpu_ready: false,
      purpose: 'future_runtime_video_preparation',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

type SequenceAssemblyRegistry = {
  sequence_assembly_plans: Array<{
    sequence_assembly_id: string;
    source_video_id: string;
  }>;
};

function loadSequenceAssemblyRegistry(projectRoot: string): SequenceAssemblyRegistry | null {
  const abs = path.join(projectRoot, SEQUENCE_ASSEMBLY_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SequenceAssemblyRegistry;
}

export function buildSeedVideoBlueprintPlans(
  projectRoot?: string
): MovieAnalysisVideoBlueprintPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const assemblyRegistry = loadSequenceAssemblyRegistry(root);
  if (!assemblyRegistry) {
    throw new Error(`Missing sequence assembly registry: ${SEQUENCE_ASSEMBLY_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisVideoBlueprintPlan[] = [];

  for (const spec of SEED_VIDEO_BLUEPRINT_SPECS) {
    const registryEntry = assemblyRegistry.sequence_assembly_plans.find(
      (p) => p.sequence_assembly_id === spec.sequence_assembly_id
    );
    if (!registryEntry) {
      throw new Error(`Sequence assembly plan not in registry: ${spec.sequence_assembly_id}`);
    }

    const assemblyPlan = loadMovieAnalysisSequenceAssemblyPlan(root, spec.sequence_assembly_id);
    if (!assemblyPlan) {
      throw new Error(`Missing sequence assembly plan: ${spec.sequence_assembly_id}`);
    }

    if (assemblyPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Sequence assembly source mismatch for ${spec.sequence_assembly_id}`);
    }

    plans.push(buildVideoBlueprintPlan(spec, assemblyPlan));
  }

  return plans;
}

export function writeMovieAnalysisVideoBlueprintPlans(projectRoot?: string): {
  plans: MovieAnalysisVideoBlueprintPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedVideoBlueprintPlans(root);
  const outDir = path.join(root, VIDEO_BLUEPRINT_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${VIDEO_BLUEPRINT_PLANS_DIR}/${plan.video_blueprint_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-video-blueprint-registry-v1',
    phase: VIDEO_BLUEPRINT_PHASE,
    registry_version: 'v1',
    schema_path: VIDEO_BLUEPRINT_SCHEMA_PATH,
    sequence_assembly_registry_path: SEQUENCE_ASSEMBLY_REGISTRY_PATH,
    storage_dir: VIDEO_BLUEPRINT_PLANS_DIR,
    video_blueprint_plans: plans.map((plan) => ({
      video_blueprint_id: plan.video_blueprint_id,
      plan_path: `${VIDEO_BLUEPRINT_PLANS_DIR}/${plan.video_blueprint_id}.json`,
      source_video_id: plan.source_video_id,
      sequence_assembly_id: plan.sequence_assembly_id,
      scene_count: plan.scene_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, VIDEO_BLUEPRINT_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisVideoBlueprintPlan(
  projectRoot: string,
  videoBlueprintId: string
): MovieAnalysisVideoBlueprintPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_BLUEPRINT_PLANS_DIR, `${videoBlueprintId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoBlueprintPlan;
}
