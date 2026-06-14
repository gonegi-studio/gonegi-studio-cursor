import fs from 'node:fs';
import path from 'node:path';
import {
  TEMPORAL_FLOW_REGISTRY_PATH,
  loadMovieAnalysisTemporalFlowPlan,
  type FlowCategory,
  type MovieAnalysisTemporalFlowPlan,
} from './movieAnalysisTemporalFlowDesign.js';
import { SEED_SEGMENT_SPECS } from './sourceVideoSceneSegmentBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SEQUENCE_ASSEMBLY_PHASE =
  'PHASE-SOURCE-VIDEO-032-MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1' as const;
export const SEQUENCE_ASSEMBLY_SCHEMA_PATH =
  'datasets/movie_analysis/sequence_assembly/movie-analysis-sequence-assembly.schema.json' as const;
export const SEQUENCE_ASSEMBLY_REGISTRY_PATH =
  'datasets/movie_analysis/sequence_assembly/movie-analysis-sequence-assembly-registry.json' as const;
export const SEQUENCE_ASSEMBLY_PLANS_DIR =
  'datasets/movie_analysis/sequence_assembly/plans' as const;

export type AssemblyStrategy =
  | 'SEQUENCE_CHAIN_PLAN'
  | 'CONTINUITY_ASSEMBLY_PLAN'
  | 'EMOTION_SEQUENCE_PLAN'
  | 'TRANSITION_SEQUENCE_PLAN';

export type SequenceCategory =
  | 'sequence_chain'
  | 'continuity_chain'
  | 'emotion_chain'
  | 'camera_chain'
  | 'environment_chain'
  | 'character_chain'
  | 'crowd_chain'
  | 'transition_chain'
  | 'timing_chain';

export type SequenceCandidate = {
  sequence_candidate_id: string;
  temporal_candidate_id: string;
  sequence_category: SequenceCategory;
  estimated_sequence_value: string;
  generates_sequence: false;
  generates_video: false;
  candidate_type: 'estimated_sequence_candidate';
  estimated_only: true;
};

export type SequenceAssemblyExecutionFlags = {
  planning_only: true;
  sequence_assembly_only: true;
  sequence_generation: false;
  video_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type MovieAnalysisSequenceAssemblyPlan = {
  sequence_assembly_id: string;
  phase: typeof SEQUENCE_ASSEMBLY_PHASE;
  source_video_id: string;
  temporal_flow_id: string;
  sequence_candidate_count: number;
  assembly_strategy: AssemblyStrategy;
  sequence_candidates: SequenceCandidate[];
  sequence_categories: SequenceCategory[];
  coverage_goal: {
    segment_span_seconds: number;
    coverage_percent: number;
    purpose: 'future_video_sequence_preparation';
  };
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_sequence_generation: true;
  };
  execution_flags: SequenceAssemblyExecutionFlags;
  designed_at: string;
};

export const ALL_SEQUENCE_CATEGORIES: readonly SequenceCategory[] = [
  'sequence_chain',
  'continuity_chain',
  'emotion_chain',
  'camera_chain',
  'environment_chain',
  'character_chain',
  'crowd_chain',
  'transition_chain',
  'timing_chain',
] as const;

export const TARGET_SEQUENCE_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_SEQUENCE_ASSEMBLY_SPECS = Object.freeze([
  {
    sequence_assembly_id: 'sequence_assembly_ghibli_01_v1',
    temporal_flow_id: 'temporal_flow_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    assembly_strategy: 'CONTINUITY_ASSEMBLY_PLAN' as const,
  },
  {
    sequence_assembly_id: 'sequence_assembly_shinkai_01_v1',
    temporal_flow_id: 'temporal_flow_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    assembly_strategy: 'EMOTION_SEQUENCE_PLAN' as const,
  },
  {
    sequence_assembly_id: 'sequence_assembly_little_women_01_v1',
    temporal_flow_id: 'temporal_flow_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    assembly_strategy: 'SEQUENCE_CHAIN_PLAN' as const,
  },
  {
    sequence_assembly_id: 'sequence_assembly_mori_01_v1',
    temporal_flow_id: 'temporal_flow_mori_01_v1',
    source_video_id: 'MORI_01',
    assembly_strategy: 'TRANSITION_SEQUENCE_PLAN' as const,
  },
] as const);

const EXECUTION_FLAGS: SequenceAssemblyExecutionFlags = {
  planning_only: true,
  sequence_assembly_only: true,
  sequence_generation: false,
  video_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const FLOW_TO_SEQUENCE: Record<FlowCategory, SequenceCategory> = {
  sequence_flow: 'sequence_chain',
  emotion_flow: 'emotion_chain',
  camera_flow: 'camera_chain',
  character_flow: 'character_chain',
  environment_flow: 'environment_chain',
  crowd_flow: 'crowd_chain',
  animal_flow: 'timing_chain',
  transition_flow: 'transition_chain',
  continuity_flow: 'continuity_chain',
};

const STRATEGY_CATEGORY_PRIORITY: Record<AssemblyStrategy, SequenceCategory[]> = {
  SEQUENCE_CHAIN_PLAN: [
    'sequence_chain',
    'continuity_chain',
    'timing_chain',
    'character_chain',
    'emotion_chain',
    'camera_chain',
    'environment_chain',
    'transition_chain',
    'crowd_chain',
  ],
  CONTINUITY_ASSEMBLY_PLAN: [
    'continuity_chain',
    'sequence_chain',
    'camera_chain',
    'timing_chain',
    'character_chain',
    'emotion_chain',
    'environment_chain',
    'transition_chain',
    'crowd_chain',
  ],
  EMOTION_SEQUENCE_PLAN: [
    'emotion_chain',
    'sequence_chain',
    'continuity_chain',
    'character_chain',
    'timing_chain',
    'camera_chain',
    'environment_chain',
    'transition_chain',
    'crowd_chain',
  ],
  TRANSITION_SEQUENCE_PLAN: [
    'transition_chain',
    'sequence_chain',
    'continuity_chain',
    'timing_chain',
    'camera_chain',
    'character_chain',
    'emotion_chain',
    'environment_chain',
    'crowd_chain',
  ],
};

const ESTIMATED_SEQUENCE_VALUES: Record<SequenceCategory, string[]> = {
  sequence_chain: ['estimated_sequence_chain_open', 'estimated_sequence_chain_mid', 'estimated_sequence_chain_close'],
  continuity_chain: ['estimated_sequence_continuity_lock', 'estimated_sequence_continuity_bridge', 'estimated_sequence_continuity_hold'],
  emotion_chain: ['estimated_sequence_emotion_rise', 'estimated_sequence_emotion_hold', 'estimated_sequence_emotion_release'],
  camera_chain: ['estimated_sequence_camera_bridge', 'estimated_sequence_camera_hold', 'estimated_sequence_camera_shift'],
  environment_chain: ['estimated_sequence_environment_hold', 'estimated_sequence_environment_shift', 'estimated_sequence_environment_bridge'],
  character_chain: ['estimated_sequence_character_arc', 'estimated_sequence_character_hold', 'estimated_sequence_character_bridge'],
  crowd_chain: ['estimated_sequence_crowd_sparse', 'estimated_sequence_crowd_dense', 'estimated_sequence_crowd_absent'],
  transition_chain: ['estimated_sequence_transition_cut', 'estimated_sequence_transition_dissolve', 'estimated_sequence_transition_match'],
  timing_chain: ['estimated_sequence_timing_onset', 'estimated_sequence_timing_peak', 'estimated_sequence_timing_settle'],
};

type TemporalFlowRegistry = {
  temporal_flow_plans: Array<{
    temporal_flow_id: string;
    source_video_id: string;
  }>;
};

function sequenceCategoryForFlow(
  strategy: AssemblyStrategy,
  flowCategory: FlowCategory,
  index: number
): SequenceCategory {
  const defaultCategory = FLOW_TO_SEQUENCE[flowCategory];
  const priority = STRATEGY_CATEGORY_PRIORITY[strategy];
  if (priority.includes(defaultCategory)) {
    return defaultCategory;
  }
  return priority[index % priority.length];
}

function estimatedSequenceValue(category: SequenceCategory, index: number): string {
  const values = ESTIMATED_SEQUENCE_VALUES[category];
  return values[index % values.length];
}

function segmentSpan(sourceVideoId: string): number {
  const segment = SEED_SEGMENT_SPECS.find((s) => s.source_video_id === sourceVideoId);
  if (!segment) {
    throw new Error(`No segment spec for source video: ${sourceVideoId}`);
  }
  return Math.round((segment.timestamp_end - segment.timestamp_start) * 100) / 100;
}

function buildSequenceCandidates(
  assemblyId: string,
  strategy: AssemblyStrategy,
  temporalPlan: MovieAnalysisTemporalFlowPlan
): SequenceCandidate[] {
  return temporalPlan.temporal_candidates.map((temporal, index) => {
    const category = sequenceCategoryForFlow(strategy, temporal.flow_category, index);
    return {
      sequence_candidate_id: `${assemblyId}_sc_${String(index + 1).padStart(3, '0')}`,
      temporal_candidate_id: temporal.temporal_candidate_id,
      sequence_category: category,
      estimated_sequence_value: estimatedSequenceValue(category, index),
      generates_sequence: false,
      generates_video: false,
      candidate_type: 'estimated_sequence_candidate',
      estimated_only: true,
    };
  });
}

function buildSequenceAssemblyPlan(
  spec: (typeof SEED_SEQUENCE_ASSEMBLY_SPECS)[number],
  temporalPlan: MovieAnalysisTemporalFlowPlan
): MovieAnalysisSequenceAssemblyPlan {
  const targetCount = TARGET_SEQUENCE_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target sequence candidate count for ${spec.source_video_id}`);
  }

  if (temporalPlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Temporal flow source mismatch for ${spec.temporal_flow_id}`);
  }

  const sequenceCandidates = buildSequenceCandidates(
    spec.sequence_assembly_id,
    spec.assembly_strategy,
    temporalPlan
  );

  if (sequenceCandidates.length !== targetCount) {
    throw new Error(
      `Sequence candidate count mismatch for ${spec.sequence_assembly_id}: expected ${targetCount}, got ${sequenceCandidates.length}`
    );
  }

  return {
    sequence_assembly_id: spec.sequence_assembly_id,
    phase: SEQUENCE_ASSEMBLY_PHASE,
    source_video_id: temporalPlan.source_video_id,
    temporal_flow_id: temporalPlan.temporal_flow_id,
    sequence_candidate_count: targetCount,
    assembly_strategy: spec.assembly_strategy,
    sequence_candidates: sequenceCandidates,
    sequence_categories: [...ALL_SEQUENCE_CATEGORIES],
    coverage_goal: {
      segment_span_seconds: segmentSpan(temporalPlan.source_video_id),
      coverage_percent: 100,
      purpose: 'future_video_sequence_preparation',
    },
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_sequence_generation: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadTemporalFlowRegistry(projectRoot: string): TemporalFlowRegistry | null {
  const abs = path.join(projectRoot, TEMPORAL_FLOW_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as TemporalFlowRegistry;
}

export function buildSeedSequenceAssemblyPlans(
  projectRoot?: string
): MovieAnalysisSequenceAssemblyPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const temporalRegistry = loadTemporalFlowRegistry(root);
  if (!temporalRegistry) {
    throw new Error(`Missing temporal flow registry: ${TEMPORAL_FLOW_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisSequenceAssemblyPlan[] = [];

  for (const spec of SEED_SEQUENCE_ASSEMBLY_SPECS) {
    const registryEntry = temporalRegistry.temporal_flow_plans.find(
      (p) => p.temporal_flow_id === spec.temporal_flow_id
    );
    if (!registryEntry) {
      throw new Error(`Temporal flow plan not in registry: ${spec.temporal_flow_id}`);
    }

    const temporalPlan = loadMovieAnalysisTemporalFlowPlan(root, spec.temporal_flow_id);
    if (!temporalPlan) {
      throw new Error(`Missing temporal flow plan: ${spec.temporal_flow_id}`);
    }

    if (temporalPlan.source_video_id !== registryEntry.source_video_id) {
      throw new Error(`Temporal flow source mismatch for ${spec.temporal_flow_id}`);
    }

    plans.push(buildSequenceAssemblyPlan(spec, temporalPlan));
  }

  return plans;
}

export function writeMovieAnalysisSequenceAssemblyPlans(projectRoot?: string): {
  plans: MovieAnalysisSequenceAssemblyPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedSequenceAssemblyPlans(root);
  const outDir = path.join(root, SEQUENCE_ASSEMBLY_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${SEQUENCE_ASSEMBLY_PLANS_DIR}/${plan.sequence_assembly_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-sequence-assembly-registry-v1',
    phase: SEQUENCE_ASSEMBLY_PHASE,
    registry_version: 'v1',
    schema_path: SEQUENCE_ASSEMBLY_SCHEMA_PATH,
    temporal_flow_registry_path: TEMPORAL_FLOW_REGISTRY_PATH,
    storage_dir: SEQUENCE_ASSEMBLY_PLANS_DIR,
    sequence_assembly_plans: plans.map((plan) => ({
      sequence_assembly_id: plan.sequence_assembly_id,
      plan_path: `${SEQUENCE_ASSEMBLY_PLANS_DIR}/${plan.sequence_assembly_id}.json`,
      source_video_id: plan.source_video_id,
      temporal_flow_id: plan.temporal_flow_id,
      assembly_strategy: plan.assembly_strategy,
      sequence_candidate_count: plan.sequence_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, SEQUENCE_ASSEMBLY_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisSequenceAssemblyPlan(
  projectRoot: string,
  sequenceAssemblyId: string
): MovieAnalysisSequenceAssemblyPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, SEQUENCE_ASSEMBLY_PLANS_DIR, `${sequenceAssemblyId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisSequenceAssemblyPlan;
}
