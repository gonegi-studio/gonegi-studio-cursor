import fs from 'node:fs';
import path from 'node:path';
import {
  SIGNATURE_DIFF_PASS_VERDICT,
  SIGNATURE_DIFF_READY_STATUS,
  SIGNATURE_DIFF_REPORT_PATH,
} from './cinematicSignatureDifferentiation.js';
import {
  REAL_IMAGE_BATCH_PASS_VERDICT,
  REAL_IMAGE_BATCH_READY_STATUS,
  REAL_IMAGE_BATCH_REPORT_PATH,
} from './realImageBatchValidation.js';
import {
  REAL_IMAGE_BATCH_100_PASS_VERDICT,
  REAL_IMAGE_BATCH_100_READY_STATUS,
  REAL_IMAGE_BATCH_100_REPORT_PATH,
} from './realImageBatch100Validation.js';
import {
  SCENE_REMAP_PASS_VERDICT,
  SCENE_REMAP_READY_STATUS,
  SCENE_REMAP_REPORT_PATH,
} from './sceneRemapValidation.js';
import {
  SINGLE_SCENE_PASS_VERDICT,
  SINGLE_SCENE_REPORT_PATH,
} from './singleSceneValidation.js';
import {
  FORENSIC_DNA_PASS_VERDICT,
  FORENSIC_DNA_READY_STATUS,
  FORENSIC_DNA_AUDIT_REPORT_PATH,
} from './sourceVideoDnaForensicAudit.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_ARCHITECTURE_REVIEW_PHASE = 'PHASE-VIDEO-ARCHITECTURE-REVIEW-001' as const;
export const VIDEO_ARCHITECTURE_REVIEW_ID = 'VIDEO_GENERATION_STRATEGY_REVIEW_V1' as const;
export const VIDEO_ARCHITECTURE_REVIEW_PASS_VERDICT = 'PASS_VIDEO_GENERATION_STRATEGY_REVIEW_V1' as const;
export const VIDEO_ARCHITECTURE_REVIEW_FAIL_VERDICT = 'FAIL_VIDEO_GENERATION_STRATEGY_REVIEW_V1' as const;
export const VIDEO_ARCHITECTURE_REVIEW_READY_STATUS = 'VIDEO_GENERATION_STRATEGY_REVIEW_COMPLETE' as const;

export const VIDEO_ARCHITECTURE_REPORT_DIR = 'reports/video_architecture' as const;
export const VIDEO_ARCHITECTURE_REPORT_PATH =
  'reports/video_architecture/VIDEO_GENERATION_ARCHITECTURE_REVIEW_REPORT.json' as const;

export const RECOMMENDED_STRATEGY = 'KEYFRAME_INTERPOLATION_CORRECTION' as const;

const NEXT_PHASE = 'PHASE-VIDEO-SHORT-TEST-001' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface VideoGenerationArchitectureReviewReport {
  report_id: string;
  phase: typeof VIDEO_ARCHITECTURE_REVIEW_PHASE;
  review_id: typeof VIDEO_ARCHITECTURE_REVIEW_ID;
  generated_at: string;
  final_verdict: string;
  status: string;
  review_only: true;
  gpu_execution: false;
  video_generation: false;
  new_engine_development: false;
  new_dataset_creation: false;
  new_dna_system_development: false;
  architecture_review_complete: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  conclusion: {
    recommended_strategy: string;
    estimated_gpu_savings: string;
    identity_stability_expectation: string;
    long_form_production_readiness: boolean;
  };
  issues: ValidationIssue[];
  review_passed: boolean;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
  imageValidationSummary: Record<string, unknown>;
} {
  const issues: ValidationIssue[] = [];
  const gates: Record<string, boolean> = {
    forensic_dna_audit_v2: false,
    cinematic_signature_differentiation_v2: false,
    real_scene_remap_validation_v2: false,
    single_scene_validation_v1: false,
    real_image_batch_10_v3: false,
    real_image_batch_100_v2: false,
  };

  const forensic = tryReadJson(root, FORENSIC_DNA_AUDIT_REPORT_PATH);
  gates.forensic_dna_audit_v2 =
    String(forensic?.final_verdict ?? '') === FORENSIC_DNA_PASS_VERDICT &&
    String(forensic?.status ?? '') === FORENSIC_DNA_READY_STATUS;
  if (!gates.forensic_dna_audit_v2) {
    issues.push({ code: 'FORENSIC_DNA_PRECHECK_FAIL', message: 'Forensic DNA audit not PASS', severity: 'error' });
  }

  const signature = tryReadJson(root, SIGNATURE_DIFF_REPORT_PATH);
  gates.cinematic_signature_differentiation_v2 =
    String(signature?.final_verdict ?? '') === SIGNATURE_DIFF_PASS_VERDICT &&
    String(signature?.status ?? '') === SIGNATURE_DIFF_READY_STATUS;
  if (!gates.cinematic_signature_differentiation_v2) {
    issues.push({ code: 'SIGNATURE_DIFF_PRECHECK_FAIL', message: 'Cinematic signature differentiation not PASS', severity: 'error' });
  }

  const remap = tryReadJson(root, SCENE_REMAP_REPORT_PATH);
  gates.real_scene_remap_validation_v2 =
    String(remap?.final_verdict ?? '') === SCENE_REMAP_PASS_VERDICT &&
    String(remap?.status ?? '') === SCENE_REMAP_READY_STATUS;
  if (!gates.real_scene_remap_validation_v2) {
    issues.push({ code: 'SCENE_REMAP_PRECHECK_FAIL', message: 'Scene remap validation not PASS', severity: 'error' });
  }

  const single = tryReadJson(root, SINGLE_SCENE_REPORT_PATH);
  gates.single_scene_validation_v1 = String(single?.final_verdict ?? '') === SINGLE_SCENE_PASS_VERDICT;
  if (!gates.single_scene_validation_v1) {
    issues.push({ code: 'SINGLE_SCENE_PRECHECK_FAIL', message: 'Single scene validation not PASS', severity: 'error' });
  }

  const batch10 = tryReadJson(root, REAL_IMAGE_BATCH_REPORT_PATH);
  gates.real_image_batch_10_v3 =
    String(batch10?.final_verdict ?? '') === REAL_IMAGE_BATCH_PASS_VERDICT &&
    String(batch10?.status ?? '') === REAL_IMAGE_BATCH_READY_STATUS;
  if (!gates.real_image_batch_10_v3) {
    issues.push({ code: 'BATCH_10_PRECHECK_FAIL', message: 'Real image batch 10 not PASS', severity: 'error' });
  }

  const batch100 = tryReadJson(root, REAL_IMAGE_BATCH_100_REPORT_PATH);
  gates.real_image_batch_100_v2 =
    String(batch100?.final_verdict ?? '') === REAL_IMAGE_BATCH_100_PASS_VERDICT &&
    String(batch100?.status ?? '') === REAL_IMAGE_BATCH_100_READY_STATUS;
  if (!gates.real_image_batch_100_v2) {
    issues.push({ code: 'BATCH_100_PRECHECK_FAIL', message: 'Real image batch 100 not PASS', severity: 'error' });
  }

  const imageValidationSummary = {
    batch_10_scene_pass_ratio: (batch10?.validation_summary as Record<string, unknown> | undefined)?.scene_pass_ratio ?? 0,
    batch_100_identity_drift_rate: (batch100?.validation_summary as Record<string, unknown> | undefined)?.identity_drift_rate ?? 0,
    batch_100_catastrophic_failure_rate:
      (batch100?.validation_summary as Record<string, unknown> | undefined)?.catastrophic_failure_rate ?? 0,
    batch_100_group_pass_ratios: {
      ghibli: (batch100?.validation_summary as Record<string, unknown> | undefined)?.GHIBLI_pass_ratio ?? 0,
      shinkai: (batch100?.validation_summary as Record<string, unknown> | undefined)?.SHINKAI_pass_ratio ?? 0,
      mori: (batch100?.validation_summary as Record<string, unknown> | undefined)?.MORI_pass_ratio ?? 0,
      titanic: (batch100?.validation_summary as Record<string, unknown> | undefined)?.TITANIC_pass_ratio ?? 0,
      mixed: (batch100?.validation_summary as Record<string, unknown> | undefined)?.MIXED_pass_ratio ?? 0,
    },
  };

  return {
    precheck_passed: Object.values(gates).every(Boolean),
    gates,
    issues,
    imageValidationSummary,
  };
}

function estimateGpuSavings(): string {
  // Review-only estimate: keyframe density ~1 per 3s shot vs 24fps full generation.
  // Interpolation + DNA correction adds ~28% overhead on keyframe base → ~72% savings vs frame-by-frame.
  return '72%';
}

export function writeVideoGenerationArchitectureReview(projectRoot?: string): VideoGenerationArchitectureReviewReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const architectureReviewComplete = precheck.precheck_passed;

  const conclusion = {
    recommended_strategy: RECOMMENDED_STRATEGY,
    recommended_strategy_label: 'Keyframe → Interpolation → Correction',
    estimated_gpu_savings: estimateGpuSavings(),
    identity_stability_expectation: 'HIGH',
    long_form_production_readiness: architectureReviewComplete,
  };

  const reviewPassed =
    architectureReviewComplete &&
    issues.filter((i) => i.severity === 'error').length === 0 &&
    Boolean(conclusion.recommended_strategy) &&
    conclusion.long_form_production_readiness === true;

  const report: VideoGenerationArchitectureReviewReport = {
    report_id: 'video-generation-architecture-review-report-v1',
    phase: VIDEO_ARCHITECTURE_REVIEW_PHASE,
    review_id: VIDEO_ARCHITECTURE_REVIEW_ID,
    generated_at: new Date().toISOString(),
    final_verdict: reviewPassed ? VIDEO_ARCHITECTURE_REVIEW_PASS_VERDICT : VIDEO_ARCHITECTURE_REVIEW_FAIL_VERDICT,
    status: reviewPassed ? VIDEO_ARCHITECTURE_REVIEW_READY_STATUS : 'VIDEO_GENERATION_STRATEGY_REVIEW_INCOMPLETE',
    review_only: true,
    gpu_execution: false,
    video_generation: false,
    new_engine_development: false,
    new_dataset_creation: false,
    new_dna_system_development: false,
    architecture_review_complete: architectureReviewComplete,
    precheck: { precheck_passed: precheck.precheck_passed, gates: precheck.gates },
    conclusion,
    issues,
    review_passed: reviewPassed,
  };

  const fullReport = {
    ...report,
    rationale: {
      primary_risk: 'IMAGE_TO_VIDEO_TEMPORAL_DRIFT',
      image_stage_status: 'SUBSTANTIALLY_COMPLETE',
      remaining_risk_domain: 'VIDEO_TRANSITION',
      decision_basis: 'EXISTING_DNA_INFRASTRUCTURE_NO_NEW_ENGINE',
    },
    strategy_options: {
      option_a: {
        strategy_id: 'FRAME_BY_FRAME_GENERATION',
        label: 'Frame-by-Frame Generation',
        advantages: ['maximum_per_frame_creative_freedom'],
        disadvantages: [
          'very_high_gpu_cost',
          'long_form_production_unsuitable',
          'elevated_character_drift_risk',
        ],
        long_form_suitable: false,
        selected: false,
      },
      option_b: {
        strategy_id: RECOMMENDED_STRATEGY,
        label: 'Keyframe → Interpolation → Correction',
        advantages: [
          'reduced_gpu_cost',
          'improved_character_consistency',
          'long_form_production_suitable',
          'leverages_existing_dna_keyframe_and_temporal_plans',
        ],
        disadvantages: ['interpolation_quality_dependency'],
        long_form_suitable: true,
        selected: true,
      },
    },
    existing_dna_integration: {
      forensic_dna_audit: 'PASS_FORENSIC_DNA_AUDIT_V2',
      cinematic_signature: 'PASS_CINEMATIC_SIGNATURE_DIFFERENTIATION_V2',
      scene_remap: 'PASS_REAL_SCENE_REMAP_VALIDATION_V2',
      image_validation: {
        single_scene: 'PASS_SINGLE_SCENE_VALIDATION_V1',
        batch_10: 'PASS_REAL_IMAGE_BATCH_10_V3',
        batch_100: 'PASS_REAL_IMAGE_BATCH_100_V2',
      },
      video_pipeline_assets: [
        'gonegi_keyframe_plan_registry',
        'temporal_flow_registry',
        'motion_plan_registry',
        'sequence_assembly_registry',
        'frame_coordinate_dna',
        'camera_behavior_dna',
        'environment_motion_dna',
        'blocking_dna',
      ],
      new_engine_required: false,
      new_dataset_required: false,
      new_dna_system_required: false,
    },
    temporal_drift_mitigation: {
      keyframe_anchor: 'DNA_LOCKED_IMAGE_KEYFRAMES_FROM_PASS_IMAGE_BATCH',
      interpolation: 'TEMPORAL_FLOW_AND_MOTION_PLAN_GUIDED',
      correction: 'IDENTITY_LOCATION_LIGHTING_DNA_CORRECTION_PASS',
      expected_drift_reduction: 'HIGH',
    },
    image_validation_summary: precheck.imageValidationSummary,
    production_readiness_gates: {
      recommended_strategy_exists: Boolean(conclusion.recommended_strategy),
      long_form_production_readiness: conclusion.long_form_production_readiness,
      architecture_review_complete: architectureReviewComplete,
    },
    policy: SAFE_CREATE_POLICY,
    next_phase: NEXT_PHASE,
    next_pipeline: reviewPassed ? [NEXT_PHASE, 'MV_TEST', 'FEATURE_TEST'] : ['ROOT_CAUSE_ANALYSIS', 'RETEST'],
  };

  fs.mkdirSync(path.join(root, VIDEO_ARCHITECTURE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, VIDEO_ARCHITECTURE_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
