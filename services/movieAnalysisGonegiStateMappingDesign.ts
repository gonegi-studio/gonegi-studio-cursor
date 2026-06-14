import fs from 'node:fs';
import path from 'node:path';
import {
  COORDINATE_EXTRACTION_REGISTRY_PATH,
  loadMovieAnalysisCoordinateExtractionPlan,
  type CoordinateType,
  type MovieAnalysisCoordinateExtractionPlan,
} from './movieAnalysisCoordinateExtractionDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GONEGI_STATE_MAPPING_PHASE =
  'PHASE-SOURCE-VIDEO-027-MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1' as const;
export const GONEGI_STATE_MAPPING_SCHEMA_PATH =
  'datasets/movie_analysis/gonegi_state_mapping/movie-analysis-gonegi-state-mapping.schema.json' as const;
export const GONEGI_STATE_MAPPING_REGISTRY_PATH =
  'datasets/movie_analysis/gonegi_state_mapping/movie-analysis-gonegi-state-mapping-registry.json' as const;
export const GONEGI_STATE_MAPPING_PLANS_DIR =
  'datasets/movie_analysis/gonegi_state_mapping/plans' as const;

export type MappingStrategy =
  | 'WORLD_TRANSLATION_CANDIDATE'
  | 'CHARACTER_REPLACEMENT_CANDIDATE'
  | 'EMOTION_TRANSLATION_CANDIDATE'
  | 'SCENE_STATE_CANDIDATE';

export type StateCategory =
  | 'environment_state'
  | 'character_state'
  | 'emotion_state'
  | 'camera_state'
  | 'lighting_state'
  | 'relationship_state'
  | 'crowd_state'
  | 'animal_state'
  | 'transition_state';

export type SourceCoordinateRef = {
  coordinate_candidate_id: string;
  scene_candidate_id: string;
  coordinate_type: CoordinateType;
  estimated_value: string;
};

export type GonegiStateCandidate = {
  state_id: string;
  source_coordinate_id: string;
  state_category: StateCategory;
  estimated_state_value: string;
  executes_state: false;
  creates_runtime_payload: false;
  candidate_type: 'estimated_gonegi_state_candidate';
  estimated_only: true;
};

export type GonegiStateMappingExecutionFlags = {
  planning_only: true;
  state_mapping_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  coordinate_extraction: false;
  frame_extraction: false;
  scene_extraction: false;
  ocr: false;
};

export type MovieAnalysisGonegiStateMappingPlan = {
  gonegi_state_mapping_id: string;
  phase: typeof GONEGI_STATE_MAPPING_PHASE;
  source_video_id: string;
  analysis_plan_id: string;
  dry_run_id: string;
  sampling_plan_id: string;
  scene_detection_id: string;
  coordinate_extraction_id: string;
  state_candidate_count: number;
  mapping_strategy: MappingStrategy;
  source_coordinates: SourceCoordinateRef[];
  gonegi_states: GonegiStateCandidate[];
  state_categories: StateCategory[];
  identity_safety: {
    identity_lock_required: true;
    character_first_contract: true;
    estimated_only: true;
    no_state_execution: true;
  };
  execution_flags: GonegiStateMappingExecutionFlags;
  designed_at: string;
};

export const ALL_STATE_CATEGORIES: readonly StateCategory[] = [
  'environment_state',
  'character_state',
  'emotion_state',
  'camera_state',
  'lighting_state',
  'relationship_state',
  'crowd_state',
  'animal_state',
  'transition_state',
] as const;

export const TARGET_STATE_CANDIDATE_COUNTS: Record<string, number> = {
  GHIBLI_01: 12,
  SHINKAI_01: 12,
  LITTLE_WOMEN_01: 18,
  MORI_01: 12,
};

export const SEED_GONEGI_STATE_MAPPING_SPECS = Object.freeze([
  {
    gonegi_state_mapping_id: 'gonegi_state_mapping_ghibli_01_v1',
    coordinate_extraction_id: 'coordinate_extraction_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    mapping_strategy: 'WORLD_TRANSLATION_CANDIDATE' as const,
  },
  {
    gonegi_state_mapping_id: 'gonegi_state_mapping_shinkai_01_v1',
    coordinate_extraction_id: 'coordinate_extraction_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    mapping_strategy: 'EMOTION_TRANSLATION_CANDIDATE' as const,
  },
  {
    gonegi_state_mapping_id: 'gonegi_state_mapping_little_women_01_v1',
    coordinate_extraction_id: 'coordinate_extraction_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    mapping_strategy: 'CHARACTER_REPLACEMENT_CANDIDATE' as const,
  },
  {
    gonegi_state_mapping_id: 'gonegi_state_mapping_mori_01_v1',
    coordinate_extraction_id: 'coordinate_extraction_mori_01_v1',
    source_video_id: 'MORI_01',
    mapping_strategy: 'SCENE_STATE_CANDIDATE' as const,
  },
] as const);

const EXECUTION_FLAGS: GonegiStateMappingExecutionFlags = {
  planning_only: true,
  state_mapping_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  coordinate_extraction: false,
  frame_extraction: false,
  scene_extraction: false,
  ocr: false,
};

const COORDINATE_TO_STATE_CATEGORY: Record<CoordinateType, StateCategory> = {
  shot_scale: 'camera_state',
  camera_angle: 'camera_state',
  camera_motion: 'camera_state',
  subject_position: 'character_state',
  blocking: 'relationship_state',
  location_anchor: 'environment_state',
  lighting_state: 'lighting_state',
  emotion_state: 'emotion_state',
  transition_hint: 'transition_state',
};

const STRATEGY_CATEGORY_PRIORITY: Record<MappingStrategy, StateCategory[]> = {
  WORLD_TRANSLATION_CANDIDATE: [
    'environment_state',
    'transition_state',
    'lighting_state',
    'camera_state',
    'character_state',
    'emotion_state',
    'relationship_state',
    'crowd_state',
    'animal_state',
  ],
  CHARACTER_REPLACEMENT_CANDIDATE: [
    'character_state',
    'relationship_state',
    'emotion_state',
    'environment_state',
    'camera_state',
    'lighting_state',
    'crowd_state',
    'animal_state',
    'transition_state',
  ],
  EMOTION_TRANSLATION_CANDIDATE: [
    'emotion_state',
    'character_state',
    'relationship_state',
    'lighting_state',
    'environment_state',
    'camera_state',
    'crowd_state',
    'animal_state',
    'transition_state',
  ],
  SCENE_STATE_CANDIDATE: [
    'environment_state',
    'camera_state',
    'lighting_state',
    'transition_state',
    'character_state',
    'emotion_state',
    'relationship_state',
    'crowd_state',
    'animal_state',
  ],
};

const ESTIMATED_STATE_VALUES: Record<StateCategory, string[]> = {
  environment_state: ['estimated_gonegi_environment', 'estimated_gonegi_locale', 'estimated_gonegi_set'],
  character_state: ['estimated_gonegi_character_pose', 'estimated_gonegi_character_identity', 'estimated_gonegi_character_action'],
  emotion_state: ['estimated_gonegi_emotion_neutral', 'estimated_gonegi_emotion_tense', 'estimated_gonegi_emotion_warm'],
  camera_state: ['estimated_gonegi_camera_static', 'estimated_gonegi_camera_pan', 'estimated_gonegi_camera_close'],
  lighting_state: ['estimated_gonegi_light_soft', 'estimated_gonegi_light_hard', 'estimated_gonegi_light_ambient'],
  relationship_state: ['estimated_gonegi_relation_pair', 'estimated_gonegi_relation_group', 'estimated_gonegi_relation_solo'],
  crowd_state: ['estimated_gonegi_crowd_sparse', 'estimated_gonegi_crowd_dense', 'estimated_gonegi_crowd_absent'],
  animal_state: ['estimated_gonegi_animal_present', 'estimated_gonegi_animal_absent', 'estimated_gonegi_animal_background'],
  transition_state: ['estimated_gonegi_transition_cut', 'estimated_gonegi_transition_dissolve', 'estimated_gonegi_transition_match'],
};

type CoordinateExtractionRegistry = {
  coordinate_extraction_plans: Array<{
    coordinate_extraction_id: string;
    source_video_id: string;
    analysis_plan_id: string;
    dry_run_id: string;
    sampling_plan_id: string;
    scene_detection_id: string;
  }>;
};

function stateCategoryForCoordinate(
  strategy: MappingStrategy,
  coordinateType: CoordinateType,
  index: number
): StateCategory {
  const defaultCategory = COORDINATE_TO_STATE_CATEGORY[coordinateType];
  const priority = STRATEGY_CATEGORY_PRIORITY[strategy];
  if (priority.includes(defaultCategory)) {
    return defaultCategory;
  }
  return priority[index % priority.length];
}

function estimatedStateValue(category: StateCategory, index: number): string {
  const values = ESTIMATED_STATE_VALUES[category];
  return values[index % values.length];
}

function buildSourceCoordinates(
  coordinatePlan: MovieAnalysisCoordinateExtractionPlan
): SourceCoordinateRef[] {
  return coordinatePlan.coordinate_candidates.map((candidate) => ({
    coordinate_candidate_id: candidate.candidate_id,
    scene_candidate_id: candidate.scene_candidate_id,
    coordinate_type: candidate.coordinate_type,
    estimated_value: candidate.estimated_value,
  }));
}

function buildGonegiStates(
  mappingId: string,
  strategy: MappingStrategy,
  sourceCoordinates: SourceCoordinateRef[]
): GonegiStateCandidate[] {
  return sourceCoordinates.map((source, index) => {
    const category = stateCategoryForCoordinate(strategy, source.coordinate_type, index);
    return {
      state_id: `${mappingId}_gs_${String(index + 1).padStart(3, '0')}`,
      source_coordinate_id: source.coordinate_candidate_id,
      state_category: category,
      estimated_state_value: estimatedStateValue(category, index),
      executes_state: false,
      creates_runtime_payload: false,
      candidate_type: 'estimated_gonegi_state_candidate',
      estimated_only: true,
    };
  });
}

function buildGonegiStateMappingPlan(
  spec: (typeof SEED_GONEGI_STATE_MAPPING_SPECS)[number],
  coordinatePlan: MovieAnalysisCoordinateExtractionPlan
): MovieAnalysisGonegiStateMappingPlan {
  const targetCount = TARGET_STATE_CANDIDATE_COUNTS[spec.source_video_id];
  if (!targetCount) {
    throw new Error(`No target state candidate count for ${spec.source_video_id}`);
  }

  if (coordinatePlan.source_video_id !== spec.source_video_id) {
    throw new Error(`Coordinate extraction source mismatch for ${spec.coordinate_extraction_id}`);
  }

  const sourceCoordinates = buildSourceCoordinates(coordinatePlan);
  const gonegiStates = buildGonegiStates(
    spec.gonegi_state_mapping_id,
    spec.mapping_strategy,
    sourceCoordinates
  );

  if (gonegiStates.length !== targetCount) {
    throw new Error(
      `State candidate count mismatch for ${spec.gonegi_state_mapping_id}: expected ${targetCount}, got ${gonegiStates.length}`
    );
  }

  return {
    gonegi_state_mapping_id: spec.gonegi_state_mapping_id,
    phase: GONEGI_STATE_MAPPING_PHASE,
    source_video_id: coordinatePlan.source_video_id,
    analysis_plan_id: coordinatePlan.analysis_plan_id,
    dry_run_id: coordinatePlan.dry_run_id,
    sampling_plan_id: coordinatePlan.sampling_plan_id,
    scene_detection_id: coordinatePlan.scene_detection_id,
    coordinate_extraction_id: coordinatePlan.coordinate_extraction_id,
    state_candidate_count: targetCount,
    mapping_strategy: spec.mapping_strategy,
    source_coordinates: sourceCoordinates,
    gonegi_states: gonegiStates,
    state_categories: [...ALL_STATE_CATEGORIES],
    identity_safety: {
      identity_lock_required: true,
      character_first_contract: true,
      estimated_only: true,
      no_state_execution: true,
    },
    execution_flags: { ...EXECUTION_FLAGS },
    designed_at: new Date().toISOString(),
  };
}

function loadCoordinateExtractionRegistry(projectRoot: string): CoordinateExtractionRegistry | null {
  const abs = path.join(projectRoot, COORDINATE_EXTRACTION_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as CoordinateExtractionRegistry;
}

export function buildSeedGonegiStateMappingPlans(
  projectRoot?: string
): MovieAnalysisGonegiStateMappingPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const coordinateRegistry = loadCoordinateExtractionRegistry(root);
  if (!coordinateRegistry) {
    throw new Error(`Missing coordinate extraction registry: ${COORDINATE_EXTRACTION_REGISTRY_PATH}`);
  }

  const plans: MovieAnalysisGonegiStateMappingPlan[] = [];

  for (const spec of SEED_GONEGI_STATE_MAPPING_SPECS) {
    const registryEntry = coordinateRegistry.coordinate_extraction_plans.find(
      (p) => p.coordinate_extraction_id === spec.coordinate_extraction_id
    );
    if (!registryEntry) {
      throw new Error(`Coordinate extraction plan not in registry: ${spec.coordinate_extraction_id}`);
    }

    const coordinatePlan = loadMovieAnalysisCoordinateExtractionPlan(
      root,
      spec.coordinate_extraction_id
    );
    if (!coordinatePlan) {
      throw new Error(`Missing coordinate extraction plan: ${spec.coordinate_extraction_id}`);
    }

    if (coordinatePlan.dry_run_id !== registryEntry.dry_run_id) {
      throw new Error(`Coordinate extraction dry_run mismatch for ${spec.coordinate_extraction_id}`);
    }

    plans.push(buildGonegiStateMappingPlan(spec, coordinatePlan));
  }

  return plans;
}

export function writeMovieAnalysisGonegiStateMappingPlans(projectRoot?: string): {
  plans: MovieAnalysisGonegiStateMappingPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedGonegiStateMappingPlans(root);
  const outDir = path.join(root, GONEGI_STATE_MAPPING_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${GONEGI_STATE_MAPPING_PLANS_DIR}/${plan.gonegi_state_mapping_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-gonegi-state-mapping-registry-v1',
    phase: GONEGI_STATE_MAPPING_PHASE,
    registry_version: 'v1',
    schema_path: GONEGI_STATE_MAPPING_SCHEMA_PATH,
    coordinate_extraction_registry_path: COORDINATE_EXTRACTION_REGISTRY_PATH,
    storage_dir: GONEGI_STATE_MAPPING_PLANS_DIR,
    mapping_plans: plans.map((plan) => ({
      gonegi_state_mapping_id: plan.gonegi_state_mapping_id,
      plan_path: `${GONEGI_STATE_MAPPING_PLANS_DIR}/${plan.gonegi_state_mapping_id}.json`,
      source_video_id: plan.source_video_id,
      analysis_plan_id: plan.analysis_plan_id,
      dry_run_id: plan.dry_run_id,
      sampling_plan_id: plan.sampling_plan_id,
      scene_detection_id: plan.scene_detection_id,
      coordinate_extraction_id: plan.coordinate_extraction_id,
      mapping_strategy: plan.mapping_strategy,
      state_candidate_count: plan.state_candidate_count,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, GONEGI_STATE_MAPPING_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisGonegiStateMappingPlan(
  projectRoot: string,
  gonegiStateMappingId: string
): MovieAnalysisGonegiStateMappingPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_STATE_MAPPING_PLANS_DIR, `${gonegiStateMappingId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisGonegiStateMappingPlan;
}
