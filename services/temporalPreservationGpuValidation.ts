import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { GPU_VALIDATION_CAMPAIGN_REPORT_PATH } from './gpuValidationCampaign.js';
import { GPU_VALIDATION_DATASET_DIR } from './gpuValidationDataset.js';
import {
  TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
} from './temporalPreservationBinding.js';
import { TEMPORAL_MEMORY_SPECIFICATION_PATH } from './temporalPreservationStrategy.js';

export const TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-005B' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID =
  'TEMPORAL_PRESERVATION_GPU_VALIDATION_V1' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT =
  'PASS_TEMPORAL_PRESERVATION_GPU_VALIDATION_V1' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_FAIL_VERDICT =
  'FAIL_TEMPORAL_PRESERVATION_GPU_VALIDATION_V1' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS =
  'TEMPORAL_GPU_VALIDATION_DEFINED' as const;

export const TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_DIR =
  'datasets/gpu_validation_temporal_preservation' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_REGISTRY_PATH =
  `${TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_DIR}/temporal-preservation-gpu-validation-registry.json` as const;

export const TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL.json' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN.json' as const;
export const TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS.json' as const;

const MINIMUM_BATCH_SIZE = 30;

const EXECUTION_FLAGS = {
  validation_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface TemporalDriftLevels {
  same_timeline: number;
  strict_timeline: number;
  similar_timeline: number;
  broken_timeline: number;
}

export interface TimelineDegradationLevels {
  minor_drift: number;
  moderate_drift: number;
  critical_drift: number;
}

export interface TemporalProtocolTier {
  difficulty_tier: string;
  measurement_method: string[];
  pass_threshold: number;
  failure_examples: string[];
  transition_failure_examples: string[];
  timeline_recall_rules: {
    required_timeline_slots: number;
    minimum_continuity_chain_match: number;
  };
  exit_criteria: {
    pass_rate: number;
    edit_rhythm_alignment_score: number;
  };
}

export interface TemporalPreservationGpuValidationProtocol {
  protocol_id: string;
  phase: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  temporal_validation_defined: true;
  analysis: {
    temporal_memory_binding: string;
    edit_rhythm_binding: string;
    shot_boundary_continuity_binding: string;
    causal_transition_chain_binding: string;
    temporal_traceability_binding: string;
  };
  temporal_validation_contract: Record<string, string>;
  same_timeline_criteria: Record<string, string>;
  temporal_drift_levels: TemporalDriftLevels;
  timeline_degradation_levels: TimelineDegradationLevels;
  temporal_failure_criteria: Record<string, string>;
  transition_failure_examples: string[];
  tiers: TemporalProtocolTier[];
  timeline_recall_rules: {
    required_timeline_slots: number;
    minimum_continuity_chain_match: number;
    recall_method: string;
  };
}

export interface TemporalPreservationGpuValidationReadiness {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS
    | 'TEMPORAL_GPU_VALIDATION_NOT_DEFINED';
  validation_passed: boolean;
  temporal_validation_defined: boolean;
  same_timeline_criteria_defined: boolean;
  drift_levels_defined: boolean;
  timeline_degradation_levels_defined: boolean;
  failure_criteria_defined: boolean;
  transition_failure_examples_defined: boolean;
  dataset_plan_defined: boolean;
  expected_pass_rate_defined: boolean;
  readiness_defined: boolean;
  temporal_preservation_validated: false;
  gpu_validation_executed: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  validation_ready: boolean;
  execution_ready: false;
  blocking_factors: string[];
  highest_risk_area: string;
  expected_pass_rate: {
    easy: number;
    medium: number;
    hard: number;
  };
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface TemporalPreservationGpuValidationDatasetPlan {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  dataset_plan_defined: true;
  minimum_batch_size: number;
  easy_cases: Array<{ case_id: string; timeline_id: string; source_ref: string }>;
  medium_cases: Array<{ case_id: string; timeline_id: string; source_ref: string }>;
  hard_cases: Array<{ case_id: string; timeline_id: string; failure_mode: string }>;
}

const ANALYSIS = {
  temporal_memory_binding:
    'Timeline slots bind memory_signature and edit_rhythm_signature per source; validation recalls temporal memory records against generated frame sequences without GPU execution in this phase.',
  edit_rhythm_binding:
    'edit_rhythm edit_points from source_video_numerical_dna_full enforce cut_type and rhythm_bucket alignment; edit_rhythm_break is a primary transition failure mode.',
  shot_boundary_continuity_binding:
    'continuity_signature links adjacent shots via continuity_anchor; shot_boundary_discontinuity triggers moderate_drift degradation path.',
  causal_transition_chain_binding:
    'Ordered causal_transition records with causal_reason and continuity_anchor; highest-risk area for narrative-causal reconstruction validation.',
  temporal_traceability_binding:
    'traceability_signature binds numerical DNA edit_rhythm and motion_vectors refs to conditioning map export paths for batch audit.',
} as const;

const TEMPORAL_VALIDATION_CONTRACT = {
  contract_id: 'temporal_preservation_gpu_validation_v1',
  contract_version: '1.0',
  scope: 'Validation definition only — Validation Defined != Validation Executed.',
  binding_ref: TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
  memory_spec_ref: TEMPORAL_MEMORY_SPECIFICATION_PATH,
  dataset_ref: `${GPU_VALIDATION_DATASET_DIR}/temporal_preservation-validation-dataset.json`,
  campaign_stage_ref: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  gpu_execution: 'false — protocol and dataset plan only; execution deferred to future GPU-enabled phase.',
} as const;

const SAME_TIMELINE_CRITERIA = {
  same_timeline: 'Score >= 0.95 required for same-timeline preservation certification.',
  continuity_signature_match: 'continuity_signature stable across adjacent shots with edit_rhythm_alignment_score >= 0.95.',
  memory_signature_match: 'temporal_memory recall matches timeline_id with memory_signature hash equality.',
  assessment_note: 'Timeline Defined != Timeline Preserved.',
} as const;

const TEMPORAL_DRIFT_LEVELS: TemporalDriftLevels = {
  same_timeline: 0.95,
  strict_timeline: 0.9,
  similar_timeline: 0.75,
  broken_timeline: 0.5,
};

const TIMELINE_DEGRADATION_LEVELS: TimelineDegradationLevels = {
  minor_drift: 0.85,
  moderate_drift: 0.7,
  critical_drift: 0.5,
};

const TEMPORAL_FAILURE_CRITERIA = {
  edit_rhythm_desync: 'Generated cut points diverge from edit_rhythm_signature beyond strict_timeline threshold.',
  shot_boundary_discontinuity: 'continuity_signature unstable across shot boundary; triggers moderate_drift.',
  causal_chain_break: 'causal_transition_chain traversal fails; missing_transition_cause logged.',
  timeline_reset: 'Hard-tier failure: timeline_id continuity lost mid-sequence.',
  character_position_jump: 'Hard-tier failure: subject position discontinuous without causal transition.',
  assessment_note: 'Causal Transition Defined != Causal Transition Preserved.',
} as const;

const TRANSITION_FAILURE_EXAMPLES = [
  'character_position_jump',
  'missing_transition_cause',
  'edit_rhythm_break',
  'timeline_reset',
] as const;

const TIMELINE_RECALL_RULES = {
  required_timeline_slots: 5,
  minimum_continuity_chain_match: 3,
  recall_method:
    'Traverse causal_transition_chain from transition_id; count continuity_anchor matches >= minimum_continuity_chain_match across required_timeline_slots per batch.',
};

const PROTOCOL_TIERS: TemporalProtocolTier[] = [
  {
    difficulty_tier: 'easy',
    measurement_method: ['edit_rhythm_alignment_score', 'continuity_signature_score'],
    pass_threshold: 0.95,
    failure_examples: ['minor_lighting_drift_between_cuts'],
    transition_failure_examples: ['edit_rhythm_break'],
    timeline_recall_rules: {
      required_timeline_slots: 5,
      minimum_continuity_chain_match: 3,
    },
    exit_criteria: { pass_rate: 0.9, edit_rhythm_alignment_score: 0.95 },
  },
  {
    difficulty_tier: 'medium',
    measurement_method: ['edit_rhythm_alignment_score', 'shot_boundary_continuity_score'],
    pass_threshold: 0.9,
    failure_examples: ['shot_boundary_discontinuity', 'rhythm_bucket_shift'],
    transition_failure_examples: ['missing_transition_cause', 'edit_rhythm_break'],
    timeline_recall_rules: {
      required_timeline_slots: 5,
      minimum_continuity_chain_match: 3,
    },
    exit_criteria: { pass_rate: 0.85, edit_rhythm_alignment_score: 0.9 },
  },
  {
    difficulty_tier: 'hard',
    measurement_method: ['causal_transition_chain_score', 'continuity_signature_score'],
    pass_threshold: 0.88,
    failure_examples: ['timeline_reset', 'causal_chain_break'],
    transition_failure_examples: [...TRANSITION_FAILURE_EXAMPLES],
    timeline_recall_rules: {
      required_timeline_slots: 5,
      minimum_continuity_chain_match: 3,
    },
    exit_criteria: { pass_rate: 0.75, edit_rhythm_alignment_score: 0.88 },
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildDatasetPlan(): TemporalPreservationGpuValidationDatasetPlan {
  return {
    report_id: `temporal_preservation_gpu_dataset_plan_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
    system_id: TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    dataset_plan_defined: true,
    minimum_batch_size: MINIMUM_BATCH_SIZE,
    easy_cases: [
      { case_id: 'temp_gpu_easy_001', timeline_id: 'timeline_titanic_014', source_ref: 'temp_mem_001' },
      { case_id: 'temp_gpu_easy_002', timeline_id: 'timeline_titanic_015', source_ref: 'temp_mem_002' },
    ],
    medium_cases: [
      { case_id: 'temp_gpu_med_001', timeline_id: 'timeline_ghibli_001', source_ref: 'temp_mem_003' },
      { case_id: 'temp_gpu_med_002', timeline_id: 'timeline_gonegi_001', source_ref: 'temp_mem_004' },
    ],
    hard_cases: [
      {
        case_id: 'temp_gpu_hard_001',
        timeline_id: 'timeline_titanic_014_015',
        failure_mode: 'character_position_jump',
      },
      {
        case_id: 'temp_gpu_hard_002',
        timeline_id: 'timeline_titanic_015_016',
        failure_mode: 'missing_transition_cause',
      },
      {
        case_id: 'temp_gpu_hard_003',
        timeline_id: 'timeline_ghibli_001_002',
        failure_mode: 'timeline_reset',
      },
    ],
  };
}

function buildProtocol(): TemporalPreservationGpuValidationProtocol {
  return {
    protocol_id: 'temporal-preservation-gpu-validation-protocol-v1',
    phase: TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
    system_id: TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    temporal_validation_defined: true,
    analysis: { ...ANALYSIS },
    temporal_validation_contract: { ...TEMPORAL_VALIDATION_CONTRACT },
    same_timeline_criteria: { ...SAME_TIMELINE_CRITERIA },
    temporal_drift_levels: { ...TEMPORAL_DRIFT_LEVELS },
    timeline_degradation_levels: { ...TIMELINE_DEGRADATION_LEVELS },
    temporal_failure_criteria: { ...TEMPORAL_FAILURE_CRITERIA },
    transition_failure_examples: [...TRANSITION_FAILURE_EXAMPLES],
    tiers: PROTOCOL_TIERS.map((tier) => ({
      ...tier,
      transition_failure_examples: [...tier.transition_failure_examples],
      timeline_recall_rules: { ...tier.timeline_recall_rules },
      exit_criteria: { ...tier.exit_criteria },
    })),
    timeline_recall_rules: { ...TIMELINE_RECALL_RULES },
  };
}

export function runTemporalPreservationGpuValidationDefinition(
  projectRoot?: string
): TemporalPreservationGpuValidationReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: TemporalPreservationGpuValidationReadiness['issues'] = [];

  const prerequisitePaths = [
    TEMPORAL_PRESERVATION_GPU_VALIDATION_REGISTRY_PATH,
    TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    TEMPORAL_MEMORY_SPECIFICATION_PATH,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    `${GPU_VALIDATION_DATASET_DIR}/temporal_preservation-validation-dataset.json`,
  ];

  for (const rel of prerequisitePaths) {
    if (!fs.existsSync(path.join(root, rel))) {
      issues.push({
        code: 'PREREQUISITE_MISSING',
        message: `Missing prerequisite ${rel}`,
        severity: 'error',
      });
    }
  }

  const protocol = buildProtocol();
  const datasetPlan = buildDatasetPlan();

  const temporal_validation_defined = protocol.temporal_validation_defined === true;
  const same_timeline_criteria_defined =
    Object.keys(protocol.same_timeline_criteria).length > 0 &&
    protocol.temporal_drift_levels.same_timeline === 0.95;
  const drift_levels_defined =
    protocol.temporal_drift_levels.same_timeline === 0.95 &&
    protocol.temporal_drift_levels.strict_timeline === 0.9 &&
    protocol.temporal_drift_levels.similar_timeline === 0.75 &&
    protocol.temporal_drift_levels.broken_timeline === 0.5;
  const timeline_degradation_levels_defined =
    protocol.timeline_degradation_levels.minor_drift === 0.85 &&
    protocol.timeline_degradation_levels.moderate_drift === 0.7 &&
    protocol.timeline_degradation_levels.critical_drift === 0.5;
  const failure_criteria_defined =
    Object.keys(protocol.temporal_failure_criteria).length > 0 &&
    protocol.tiers.every((tier) => tier.failure_examples.length > 0);
  const transition_failure_examples_defined =
    protocol.transition_failure_examples.length === TRANSITION_FAILURE_EXAMPLES.length &&
    TRANSITION_FAILURE_EXAMPLES.every((example) =>
      protocol.transition_failure_examples.includes(example)
    );
  const dataset_plan_defined =
    datasetPlan.dataset_plan_defined === true &&
    datasetPlan.easy_cases.length > 0 &&
    datasetPlan.medium_cases.length > 0 &&
    datasetPlan.hard_cases.length > 0 &&
    datasetPlan.minimum_batch_size === MINIMUM_BATCH_SIZE;

  const expected_pass_rate = {
    easy: 0.8,
    medium: 0.5,
    hard: 0.2,
  };
  const expected_pass_rate_defined =
    typeof expected_pass_rate.easy === 'number' &&
    typeof expected_pass_rate.medium === 'number' &&
    typeof expected_pass_rate.hard === 'number';

  const validation_ready = temporal_validation_defined && dataset_plan_defined;
  const readiness_defined =
    validation_ready &&
    expected_pass_rate_defined &&
    transition_failure_examples_defined &&
    timeline_degradation_levels_defined;

  const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');

  if (!hardTier) {
    issues.push({ code: 'HARD_TIER', message: 'hard difficulty tier required', severity: 'error' });
  }
  if (!transition_failure_examples_defined) {
    issues.push({
      code: 'TRANSITION_FAILURE',
      message: 'transition_failure_examples must include all required examples',
      severity: 'error',
    });
  }
  if (!timeline_degradation_levels_defined) {
    issues.push({
      code: 'DEGRADATION_LEVELS',
      message: 'timeline_degradation_levels must be defined',
      severity: 'error',
    });
  }
  if (!drift_levels_defined) {
    issues.push({ code: 'DRIFT_LEVELS', message: 'temporal_drift_levels must be defined', severity: 'error' });
  }
  if (!dataset_plan_defined) {
    issues.push({ code: 'DATASET_PLAN', message: 'dataset_plan must be defined', severity: 'error' });
  }
  if (!readiness_defined) {
    issues.push({ code: 'READINESS', message: 'readiness must be defined', severity: 'error' });
  }

  const validation_passed =
    temporal_validation_defined &&
    same_timeline_criteria_defined &&
    drift_levels_defined &&
    timeline_degradation_levels_defined &&
    failure_criteria_defined &&
    transition_failure_examples_defined &&
    dataset_plan_defined &&
    expected_pass_rate_defined &&
    readiness_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readiness: TemporalPreservationGpuValidationReadiness = {
    report_id: `temporal_preservation_gpu_readiness_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
    system_id: TEMPORAL_PRESERVATION_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT
      : TEMPORAL_PRESERVATION_GPU_VALIDATION_FAIL_VERDICT,
    status: validation_passed
      ? TEMPORAL_PRESERVATION_GPU_VALIDATION_STATUS
      : 'TEMPORAL_GPU_VALIDATION_NOT_DEFINED',
    validation_passed,
    temporal_validation_defined,
    same_timeline_criteria_defined,
    drift_levels_defined,
    timeline_degradation_levels_defined,
    failure_criteria_defined,
    transition_failure_examples_defined,
    dataset_plan_defined,
    expected_pass_rate_defined,
    readiness_defined,
    temporal_preservation_validated: false,
    gpu_validation_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    validation_ready,
    execution_ready: false,
    blocking_factors: [
      'gpu_execution disabled in validation definition phase',
      'edit_rhythm_binding GPU shot duration enforcement deferred',
      'shot_boundary_continuity frame interpolation deferred',
      'causal_transition_chain runtime scene transition engine deferred',
      'Validation Defined != Validation Executed',
    ],
    highest_risk_area: 'causal_transition_chain',
    expected_pass_rate,
    checks: {
      temporal_validation_defined,
      same_timeline_criteria_defined,
      drift_levels_defined,
      timeline_degradation_levels_defined,
      failure_criteria_defined,
      transition_failure_examples_defined,
      dataset_plan_defined,
      expected_pass_rate_defined,
      readiness_defined,
      hard_tier_present: Boolean(hardTier),
      execution_ready_false: true,
      temporal_preservation_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH, protocol);
  writeJson(root, TEMPORAL_PRESERVATION_GPU_VALIDATION_DATASET_PLAN_PATH, datasetPlan);
  writeJson(root, TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH, readiness);

  return readiness;
}

export function writeTemporalPreservationGpuValidationReport(
  projectRoot?: string
): TemporalPreservationGpuValidationReadiness {
  return runTemporalPreservationGpuValidationDefinition(projectRoot);
}
