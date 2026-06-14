import fs from 'node:fs';
import path from 'node:path';
import { PROMOTION_GATE_REPORT_PATH } from './gonegiPipelinePromotionGate.js';
import {
  ANALYSIS_PLAN_REGISTRY_PATH,
  type MovieAnalysisPlan,
  loadMovieAnalysisPlan,
} from './movieAnalysisPlanBuilder.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DRY_RUN_PHASE =
  'PHASE-SOURCE-VIDEO-023-MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1' as const;
export const DRY_RUN_SCHEMA_PATH =
  'datasets/movie_analysis/dry_run/movie-analysis-dry-run.schema.json' as const;
export const DRY_RUN_REGISTRY_PATH =
  'datasets/movie_analysis/dry_run/movie-analysis-dry-run-registry.json' as const;
export const DRY_RUN_PLANS_DIR = 'datasets/movie_analysis/dry_run/plans' as const;

export type DryRunExecutionFlags = {
  planning_only: true;
  gpu_execution: false;
  external_call_allowed: false;
  frame_extraction: false;
  ocr: false;
  generation: false;
};

export type DryRunStep = {
  step_id: string;
  step_order: number;
  action: string;
  reads_frames: false;
  status: 'planned' | 'simulated_pass';
  output_ref: string | null;
};

export type MovieAnalysisDryRun = {
  dry_run_id: string;
  phase: typeof DRY_RUN_PHASE;
  analysis_plan_id: string;
  source_video_id: string;
  dry_run_steps: DryRunStep[];
  estimated_segment_count: number;
  estimated_coordinate_count: number;
  analysis_risk: {
    risk_score: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    promotion_gate_status: 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW';
    watch_slot_count: number;
  };
  identity_safety_checks: {
    identity_lock_required: 'PASS' | 'FAIL';
    character_first_contract: 'PASS' | 'FAIL';
    promotion_warning_preserved: 'PASS' | 'FAIL';
    downstream_pipeline_isolated: 'PASS' | 'FAIL';
  };
  runtime_safety_checks: {
    frame_extraction: false;
    ocr: false;
    gpu_execution: false;
    external_call_allowed: false;
    planning_only: true;
  };
  promotion_warning_preserved: boolean;
  execution_flags: DryRunExecutionFlags;
  planned_at: string;
};

export const SEED_DRY_RUN_SPECS = Object.freeze([
  {
    dry_run_id: 'dry_run_ghibli_01_v1',
    analysis_plan_id: 'analysis_plan_ghibli_01_v1',
    source_video_id: 'GHIBLI_01',
  },
  {
    dry_run_id: 'dry_run_shinkai_01_v1',
    analysis_plan_id: 'analysis_plan_shinkai_01_v1',
    source_video_id: 'SHINKAI_01',
  },
  {
    dry_run_id: 'dry_run_little_women_01_v1',
    analysis_plan_id: 'analysis_plan_little_women_01_v1',
    source_video_id: 'LITTLE_WOMEN_01',
  },
  {
    dry_run_id: 'dry_run_mori_01_v1',
    analysis_plan_id: 'analysis_plan_mori_01_v1',
    source_video_id: 'MORI_01',
  },
] as const);

const EXECUTION_FLAGS: DryRunExecutionFlags = {
  planning_only: true,
  gpu_execution: false,
  external_call_allowed: false,
  frame_extraction: false,
  ocr: false,
  generation: false,
};

const RUNTIME_SAFETY_CHECKS = {
  frame_extraction: false as const,
  ocr: false as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  planning_only: true as const,
};

type AnalysisPlanRegistry = {
  analysis_plans: Array<{
    analysis_plan_id: string;
    plan_path: string;
    source_video_id: string;
  }>;
};

type PromotionGateReport = {
  promotion_status?: 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW';
  aggregate_risk?: number;
  watch_slot_count?: number;
  warning_reasons?: string[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadAnalysisPlanRegistry(projectRoot: string): AnalysisPlanRegistry | null {
  const abs = path.join(projectRoot, ANALYSIS_PLAN_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as AnalysisPlanRegistry;
}

function loadPromotionGateReport(projectRoot: string): PromotionGateReport | null {
  const abs = path.join(projectRoot, PROMOTION_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as PromotionGateReport;
}

function riskLevel(score: number): 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' {
  if (score <= 20) return 'LOW';
  if (score <= 40) return 'MODERATE';
  if (score <= 60) return 'HIGH';
  return 'CRITICAL';
}

function buildDryRunSteps(plan: MovieAnalysisPlan): DryRunStep[] {
  return [
    {
      step_id: 'load_analysis_plan',
      step_order: 1,
      action: `Load analysis plan ${plan.analysis_plan_id} from registry without reading video frames`,
      reads_frames: false,
      status: 'simulated_pass',
      output_ref: plan.analysis_plan_id,
    },
    {
      step_id: 'validate_source_video_metadata',
      step_order: 2,
      action: `Validate source video ${plan.source_video_id} metadata from final set (path only, no decode)`,
      reads_frames: false,
      status: 'simulated_pass',
      output_ref: plan.source_video_path,
    },
    {
      step_id: 'estimate_segment_candidates',
      step_order: 3,
      action: `Estimate segment candidates via ${plan.segment_detection_strategy.method} heuristic`,
      reads_frames: false,
      status: 'planned',
      output_ref: plan.segment_detection_strategy.downstream_segment_ref,
    },
    {
      step_id: 'estimate_coordinate_candidates',
      step_order: 4,
      action: `Estimate coordinate candidates via ${plan.coordinate_detection_strategy.method} projection`,
      reads_frames: false,
      status: 'planned',
      output_ref: plan.coordinate_detection_strategy.downstream_coordinate_ref,
    },
    {
      step_id: 'identity_safety_validation',
      step_order: 5,
      action: 'Validate identity locks and character-first contract without frame analysis',
      reads_frames: false,
      status: 'simulated_pass',
      output_ref: plan.identity_safety_strategy.strategy_id,
    },
    {
      step_id: 'runtime_safety_validation',
      step_order: 6,
      action: 'Confirm planning-only execution flags (no GPU, OCR, frame extraction, external calls)',
      reads_frames: false,
      status: 'simulated_pass',
      output_ref: null,
    },
  ];
}

function buildDryRun(
  spec: (typeof SEED_DRY_RUN_SPECS)[number],
  plan: MovieAnalysisPlan,
  promotionGate: PromotionGateReport
): MovieAnalysisDryRun {
  const promotionStatus = promotionGate.promotion_status ?? 'BLOCKED';
  const riskScore = Number(promotionGate.aggregate_risk ?? 0);
  const watchSlotCount = Number(promotionGate.watch_slot_count ?? 0);
  const warningsPreserved =
    promotionStatus === 'ALLOW_WITH_WARNING' &&
    plan.identity_safety_strategy.promotion_gate_warnings_preserved &&
    (promotionGate.warning_reasons?.length ?? 0) > 0;

  const identityChecks = {
    identity_lock_required: plan.identity_safety_strategy.identity_lock_required
      ? ('PASS' as const)
      : ('FAIL' as const),
    character_first_contract: plan.identity_safety_strategy.character_first_contract
      ? ('PASS' as const)
      : ('FAIL' as const),
    promotion_warning_preserved: warningsPreserved ? ('PASS' as const) : ('FAIL' as const),
    downstream_pipeline_isolated:
      plan.identity_safety_strategy.downstream_pipeline === 'gonegi_isolated'
        ? ('PASS' as const)
        : ('FAIL' as const),
  };

  return {
    dry_run_id: spec.dry_run_id,
    phase: DRY_RUN_PHASE,
    analysis_plan_id: plan.analysis_plan_id,
    source_video_id: plan.source_video_id,
    dry_run_steps: buildDryRunSteps(plan),
    estimated_segment_count: plan.segment_detection_strategy.candidate_count_target,
    estimated_coordinate_count: plan.coordinate_detection_strategy.layer_targets.length,
    analysis_risk: {
      risk_score: riskScore,
      risk_level: riskLevel(riskScore),
      promotion_gate_status: promotionStatus,
      watch_slot_count: watchSlotCount,
    },
    identity_safety_checks: identityChecks,
    runtime_safety_checks: { ...RUNTIME_SAFETY_CHECKS },
    promotion_warning_preserved: warningsPreserved,
    execution_flags: { ...EXECUTION_FLAGS },
    planned_at: new Date().toISOString(),
  };
}

export function buildSeedDryRuns(projectRoot?: string): MovieAnalysisDryRun[] {
  const root = resolveProjectRoot(projectRoot);
  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    throw new Error(`Missing final set: ${FINAL_SET_PATH}`);
  }

  const planRegistry = loadAnalysisPlanRegistry(root);
  if (!planRegistry) {
    throw new Error(`Missing analysis plan registry: ${ANALYSIS_PLAN_REGISTRY_PATH}`);
  }

  const promotionGate = loadPromotionGateReport(root);
  if (!promotionGate) {
    throw new Error(`Missing promotion gate report: ${PROMOTION_GATE_REPORT_PATH}`);
  }

  const dryRuns: MovieAnalysisDryRun[] = [];

  for (const spec of SEED_DRY_RUN_SPECS) {
    const registryEntry = planRegistry.analysis_plans.find(
      (p) => p.analysis_plan_id === spec.analysis_plan_id
    );
    if (!registryEntry) {
      throw new Error(`Analysis plan not in registry: ${spec.analysis_plan_id}`);
    }

    const video = finalSet.videos.find((v) => v.source_video_id === spec.source_video_id);
    if (!video || video.tier !== 'active') {
      throw new Error(`Source video not active in final set: ${spec.source_video_id}`);
    }

    const plan = loadMovieAnalysisPlan(root, spec.analysis_plan_id);
    if (!plan) {
      throw new Error(`Missing analysis plan: ${spec.analysis_plan_id}`);
    }

    if (plan.source_video_id !== spec.source_video_id) {
      throw new Error(
        `Analysis plan source mismatch: ${plan.analysis_plan_id} expects ${spec.source_video_id}`
      );
    }

    dryRuns.push(buildDryRun(spec, plan, promotionGate));
  }

  return dryRuns;
}

export function writeMovieAnalysisDryRuns(projectRoot?: string): {
  dryRuns: MovieAnalysisDryRun[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const dryRuns = buildSeedDryRuns(root);
  const outDir = path.join(root, DRY_RUN_PLANS_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const dryRun of dryRuns) {
    const rel = `${DRY_RUN_PLANS_DIR}/${dryRun.dry_run_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(dryRun, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  const registry = {
    registry_id: 'movie-analysis-dry-run-registry-v1',
    phase: DRY_RUN_PHASE,
    registry_version: 'v1',
    schema_path: DRY_RUN_SCHEMA_PATH,
    analysis_plan_registry_path: ANALYSIS_PLAN_REGISTRY_PATH,
    final_set_path: FINAL_SET_PATH,
    promotion_gate_report_path: PROMOTION_GATE_REPORT_PATH,
    storage_dir: DRY_RUN_PLANS_DIR,
    dry_runs: dryRuns.map((dryRun) => ({
      dry_run_id: dryRun.dry_run_id,
      dry_run_path: `${DRY_RUN_PLANS_DIR}/${dryRun.dry_run_id}.json`,
      analysis_plan_id: dryRun.analysis_plan_id,
      source_video_id: dryRun.source_video_id,
      estimated_segment_count: dryRun.estimated_segment_count,
      estimated_coordinate_count: dryRun.estimated_coordinate_count,
      promotion_warning_preserved: dryRun.promotion_warning_preserved,
      status: 'planned',
    })),
  };

  fs.writeFileSync(
    path.join(root, DRY_RUN_REGISTRY_PATH),
    `${JSON.stringify(registry, null, 2)}\n`,
    'utf8'
  );

  return { dryRuns, written };
}

export function loadMovieAnalysisDryRun(
  projectRoot: string,
  dryRunId: string
): MovieAnalysisDryRun | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, DRY_RUN_PLANS_DIR, `${dryRunId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDryRun;
}
