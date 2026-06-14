import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  type ExtractableFamily,
} from './directorGrammarExtractor.js';
import { PROMOTION_GATE_REPORT_PATH } from './gonegiPipelinePromotionGate.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ANALYSIS_PLAN_PHASE =
  'PHASE-SOURCE-VIDEO-022-MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1' as const;
export const ANALYSIS_PLAN_SCHEMA_PATH =
  'datasets/movie_analysis/movie-analysis-plan.schema.json' as const;
export const ANALYSIS_PLAN_REGISTRY_PATH =
  'datasets/movie_analysis/movie-analysis-plan-registry.json' as const;
export const ANALYSIS_PLANS_DIR = 'datasets/movie_analysis/plans' as const;

export const TARGET_OUTPUTS = Object.freeze([
  'scene_segment_candidates',
  'coordinate_extraction_candidates',
  'gonegi_pipeline_alignment',
] as const);

export type AnalysisPlanExecutionFlags = {
  design_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type MovieAnalysisPlan = {
  analysis_plan_id: string;
  phase: typeof ANALYSIS_PLAN_PHASE;
  source_video_id: string;
  source_video_path: string;
  director_family: ExtractableFamily;
  director_grammar_ref: string;
  analysis_mode: 'design_only';
  target_outputs: Array<(typeof TARGET_OUTPUTS)[number]>;
  segment_detection_strategy: {
    strategy_id: string;
    method: 'grammar_timestamp_heuristic' | 'dialogue_boundary_heuristic' | 'emotion_arc_heuristic';
    design_notes: string;
    candidate_count_target: number;
    downstream_segment_ref: string | null;
  };
  coordinate_detection_strategy: {
    strategy_id: string;
    method:
      | 'grammar_layer_projection'
      | 'blocking_geometry_projection'
      | 'lighting_vector_projection';
    design_notes: string;
    layer_targets: string[];
    downstream_coordinate_ref: string | null;
  };
  identity_safety_strategy: {
    strategy_id: string;
    identity_lock_required: true;
    character_first_contract: true;
    promotion_gate_warnings_preserved: boolean;
    downstream_pipeline: 'gonegi_isolated';
  };
  promotion_gate_status: 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW';
  execution_flags: AnalysisPlanExecutionFlags;
  built_at: string;
};

export const SEED_ANALYSIS_PLAN_SPECS = Object.freeze([
  {
    analysis_plan_id: 'analysis_plan_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
    director_family: 'GHIBLI' as const,
    segment_method: 'grammar_timestamp_heuristic' as const,
    coordinate_method: 'blocking_geometry_projection' as const,
    downstream_segment_ref: 'segment_ghibli_kitchen_001_v1',
    downstream_coordinate_ref: 'coord_ghibli_kitchen_001_v1',
    layer_targets: ['camera_coordinate', 'character_coordinate', 'location_coordinate'],
    segment_notes:
      'Detect kitchen-blocking segment candidates via Ghibli grammar timestamp heuristics without frame extraction.',
    coordinate_notes:
      'Project blocking geometry layers into coordinate extraction candidates aligned with existing pipeline seed.',
  },
  {
    analysis_plan_id: 'analysis_plan_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
    director_family: 'SHINKAI' as const,
    segment_method: 'grammar_timestamp_heuristic' as const,
    coordinate_method: 'lighting_vector_projection' as const,
    downstream_segment_ref: 'segment_shinkai_sky_light_001_v1',
    downstream_coordinate_ref: 'coord_shinkai_sky_light_001_v1',
    layer_targets: ['lighting_coordinate', 'camera_coordinate', 'location_coordinate'],
    segment_notes:
      'Detect sky-light segment candidates via Shinkai lighting grammar heuristics without frame extraction.',
    coordinate_notes:
      'Project lighting-vector layers into coordinate extraction candidates for horizon-dominant scenes.',
  },
  {
    analysis_plan_id: 'analysis_plan_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
    director_family: 'LIVE_ACTION' as const,
    segment_method: 'dialogue_boundary_heuristic' as const,
    coordinate_method: 'grammar_layer_projection' as const,
    downstream_segment_ref: 'segment_live_action_dialogue_001_v1',
    downstream_coordinate_ref: 'coord_live_action_dialogue_001_v1',
    layer_targets: ['camera_coordinate', 'character_coordinate', 'prop_coordinate'],
    segment_notes:
      'Detect dialogue-blocking segment candidates via live-action boundary heuristics without OCR.',
    coordinate_notes:
      'Project dialogue-blocking grammar layers into coordinate extraction candidates.',
  },
  {
    analysis_plan_id: 'analysis_plan_mori_01_v1',
    source_video_id: 'MORI_01',
    director_family: 'MORI' as const,
    segment_method: 'emotion_arc_heuristic' as const,
    coordinate_method: 'grammar_layer_projection' as const,
    downstream_segment_ref: 'segment_mori_emotion_flow_001_v1',
    downstream_coordinate_ref: 'coord_mori_emotion_flow_001_v1',
    layer_targets: ['emotion_coordinate', 'character_coordinate', 'motion_coordinate'],
    segment_notes:
      'Detect emotion-flow segment candidates via Mori emotion-arc heuristics without frame extraction.',
    coordinate_notes:
      'Project emotion-flow grammar layers into coordinate extraction candidates.',
  },
] as const);

const EXECUTION_FLAGS: AnalysisPlanExecutionFlags = {
  design_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

type DirectorGrammarRegistry = {
  grammar_profiles: Array<{
    grammar_id: string;
    source_family: ExtractableFamily;
    profile_path: string;
  }>;
};

type PromotionGateReport = {
  promotion_status?: 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW';
  warning_reasons?: string[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadGrammarRegistry(projectRoot: string): DirectorGrammarRegistry | null {
  const abs = path.join(projectRoot, DIRECTOR_GRAMMAR_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as DirectorGrammarRegistry;
}

function loadPromotionGateReport(projectRoot: string): PromotionGateReport | null {
  const abs = path.join(projectRoot, PROMOTION_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as PromotionGateReport;
}

function grammarIdForFamily(
  registry: DirectorGrammarRegistry,
  family: ExtractableFamily
): string | null {
  const entry = registry.grammar_profiles.find((p) => p.source_family === family);
  return entry?.grammar_id ?? null;
}

function buildAnalysisPlan(
  spec: (typeof SEED_ANALYSIS_PLAN_SPECS)[number],
  sourceVideoPath: string,
  grammarRef: string,
  promotionGateStatus: 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW',
  warningsPreserved: boolean
): MovieAnalysisPlan {
  return {
    analysis_plan_id: spec.analysis_plan_id,
    phase: ANALYSIS_PLAN_PHASE,
    source_video_id: spec.source_video_id,
    source_video_path: sourceVideoPath,
    director_family: spec.director_family,
    director_grammar_ref: grammarRef,
    analysis_mode: 'design_only',
    target_outputs: [...TARGET_OUTPUTS],
    segment_detection_strategy: {
      strategy_id: `${spec.analysis_plan_id}_segment_strategy`,
      method: spec.segment_method,
      design_notes: spec.segment_notes,
      candidate_count_target: 1,
      downstream_segment_ref: spec.downstream_segment_ref,
    },
    coordinate_detection_strategy: {
      strategy_id: `${spec.analysis_plan_id}_coordinate_strategy`,
      method: spec.coordinate_method,
      design_notes: spec.coordinate_notes,
      layer_targets: [...spec.layer_targets],
      downstream_coordinate_ref: spec.downstream_coordinate_ref,
    },
    identity_safety_strategy: {
      strategy_id: `${spec.analysis_plan_id}_identity_safety`,
      identity_lock_required: true,
      character_first_contract: true,
      promotion_gate_warnings_preserved: warningsPreserved,
      downstream_pipeline: 'gonegi_isolated',
    },
    promotion_gate_status: promotionGateStatus,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: new Date().toISOString(),
  };
}

export function buildSeedAnalysisPlans(projectRoot?: string): MovieAnalysisPlan[] {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    throw new Error(`Missing final set: ${FINAL_SET_PATH}`);
  }

  const grammarRegistry = loadGrammarRegistry(root);
  if (!grammarRegistry) {
    throw new Error(`Missing grammar registry: ${DIRECTOR_GRAMMAR_REGISTRY_PATH}`);
  }

  const promotionGate = loadPromotionGateReport(root);
  if (!promotionGate) {
    throw new Error(`Missing promotion gate report: ${PROMOTION_GATE_REPORT_PATH}`);
  }

  const promotionGateStatus = promotionGate.promotion_status ?? 'BLOCKED';
  const warningsPreserved =
    promotionGateStatus === 'ALLOW_WITH_WARNING' &&
    (promotionGate.warning_reasons?.length ?? 0) > 0;

  const plans: MovieAnalysisPlan[] = [];

  for (const spec of SEED_ANALYSIS_PLAN_SPECS) {
    const video = finalSet.videos.find((v) => v.source_video_id === spec.source_video_id);
    if (!video || video.tier !== 'active') {
      throw new Error(`Source video not active in final set: ${spec.source_video_id}`);
    }

    const grammarRef = grammarIdForFamily(grammarRegistry, spec.director_family);
    if (!grammarRef) {
      throw new Error(`No grammar profile for family: ${spec.director_family}`);
    }

    plans.push(
      buildAnalysisPlan(spec, video.import_path, grammarRef, promotionGateStatus, warningsPreserved)
    );
  }

  return plans;
}

export function writeMovieAnalysisPlans(projectRoot?: string): {
  plans: MovieAnalysisPlan[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const plans = buildSeedAnalysisPlans(root);
  const outDir = path.join(root, ANALYSIS_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const plan of plans) {
    const rel = `${ANALYSIS_PLANS_DIR}/${plan.analysis_plan_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-plan-registry-v1',
    phase: ANALYSIS_PLAN_PHASE,
    registry_version: 'v1',
    schema_path: ANALYSIS_PLAN_SCHEMA_PATH,
    final_set_path: FINAL_SET_PATH,
    director_grammar_registry_path: DIRECTOR_GRAMMAR_REGISTRY_PATH,
    promotion_gate_report_path: PROMOTION_GATE_REPORT_PATH,
    storage_dir: ANALYSIS_PLANS_DIR,
    analysis_plans: plans.map((plan) => ({
      analysis_plan_id: plan.analysis_plan_id,
      plan_path: `${ANALYSIS_PLANS_DIR}/${plan.analysis_plan_id}.json`,
      source_video_id: plan.source_video_id,
      director_family: plan.director_family,
      director_grammar_ref: plan.director_grammar_ref,
      promotion_gate_status: plan.promotion_gate_status,
      status: 'designed',
    })),
  };

  fs.writeFileSync(
    path.join(root, ANALYSIS_PLAN_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { plans, written };
}

export function loadMovieAnalysisPlan(
  projectRoot: string,
  analysisPlanId: string
): MovieAnalysisPlan | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, ANALYSIS_PLANS_DIR, `${analysisPlanId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisPlan;
}
