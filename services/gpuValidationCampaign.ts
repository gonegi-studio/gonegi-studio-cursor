import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  GPU_VALIDATION_DATASET_REPORT_PATH,
  GPU_VALIDATION_EXECUTION_PLAN_PATH,
  GPU_VALIDATION_COVERAGE_REPORT_PATH,
} from './gpuValidationDataset.js';
import { VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH } from './videoRuntimeEnforcement.js';
import { GPU_VALIDATION_ENTRY_CRITERIA_PATH } from './videoRuntimeEnforcement.js';

export const GPU_VALIDATION_CAMPAIGN_PHASE = 'PHASE-GPU-CONDITIONING-VALIDATION-004' as const;
export const GPU_VALIDATION_CAMPAIGN_SYSTEM_ID = 'GPU_VALIDATION_CAMPAIGN_V1' as const;
export const GPU_VALIDATION_CAMPAIGN_PASS_VERDICT = 'PASS_GPU_VALIDATION_CAMPAIGN_V1' as const;
export const GPU_VALIDATION_CAMPAIGN_FAIL_VERDICT = 'FAIL_GPU_VALIDATION_CAMPAIGN_V1' as const;
export const GPU_VALIDATION_CAMPAIGN_STATUS = 'GPU_VALIDATION_CAMPAIGN_DEFINED' as const;

export const GPU_VALIDATION_CAMPAIGN_DATASET_DIR = 'datasets/gpu_validation_campaign' as const;
export const GPU_VALIDATION_CAMPAIGN_REGISTRY_PATH =
  `${GPU_VALIDATION_CAMPAIGN_DATASET_DIR}/gpu-validation-campaign-registry.json` as const;

export const GPU_VALIDATION_CAMPAIGN_REPORT_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_CAMPAIGN_REPORT.json' as const;
export const GPU_VALIDATION_RISK_REPORT_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_RISK_REPORT.json' as const;
export const GPU_EXECUTION_READINESS_REPORT_PATH =
  'reports/movie_reconstruction/GPU_EXECUTION_READINESS_REPORT.json' as const;
export const CHANNEL_VALIDATION_ROADMAP_PATH =
  'reports/movie_reconstruction/CHANNEL_VALIDATION_ROADMAP.json' as const;

const CHANNEL_PHASE_ORDER = [
  {
    channel: 'environment_identity',
    phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005A',
    phase_name: 'ENVIRONMENT_IDENTITY_GPU_VALIDATION_V1',
  },
  {
    channel: 'temporal_preservation',
    phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005B',
    phase_name: 'TEMPORAL_PRESERVATION_GPU_VALIDATION_V1',
  },
  {
    channel: 'object_identity',
    phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005C',
    phase_name: 'OBJECT_IDENTITY_GPU_VALIDATION_V1',
  },
] as const;

const DEFERRED_CHANNELS = ['camera_continuity', 'multi_scene_consistency'] as const;

const EXECUTION_FLAGS = {
  campaign_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ValidationExitCriteria {
  pass_rate: number;
  [key: string]: number;
}

export interface CampaignStage {
  validation_stage: string;
  target_channel: string;
  batch_size: number;
  pass_threshold: number;
  difficulty_tier: string;
  expected_pass_rate: number;
  success_criteria: string[];
  failure_criteria: string[];
  validation_exit_criteria: ValidationExitCriteria;
  next_channel_phase: string;
}

export interface GpuValidationCampaignReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_CAMPAIGN_PHASE;
  system_id: typeof GPU_VALIDATION_CAMPAIGN_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status: typeof GPU_VALIDATION_CAMPAIGN_STATUS | 'GPU_VALIDATION_CAMPAIGN_NOT_DEFINED';
  validation_passed: boolean;
  gpu_validation_campaign_defined: boolean;
  campaign_defined: boolean;
  stage_order_defined: boolean;
  stop_conditions_defined: boolean;
  escalation_rules_defined: boolean;
  exit_criteria_defined: boolean;
  execution_readiness_defined: boolean;
  channel_validation_roadmap_defined: boolean;
  gpu_validation_executed: false;
  conditioning_ready: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  analysis: {
    environment_identity_validation: string;
    temporal_preservation_validation: string;
    object_identity_validation: string;
    camera_continuity_validation: string;
    multi_scene_consistency_validation: string;
  };
  validation_campaign_contract: Record<string, string>;
  validation_stage_order: string[];
  validation_stop_conditions: string[];
  validation_escalation_rules: string[];
  validation_exit_criteria: Record<string, string>;
  stages: CampaignStage[];
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface GpuValidationRiskReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_CAMPAIGN_PHASE;
  system_id: typeof GPU_VALIDATION_CAMPAIGN_SYSTEM_ID;
  generated_at: string;
  highest_risk_channel: string;
  expected_failure_modes: Array<{
    channel: string;
    failure_modes: string[];
    risk_severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    recovery_strategy: string;
  }>;
  campaign_abort_conditions: string[];
}

export interface GpuExecutionReadinessReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_CAMPAIGN_PHASE;
  system_id: typeof GPU_VALIDATION_CAMPAIGN_SYSTEM_ID;
  generated_at: string;
  execution_readiness_defined: true;
  ready_channels: string[];
  blocked_channels: string[];
  execution_prerequisites: string[];
  gpu_execution_allowed: false;
  assessment_note: string;
}

export interface ChannelValidationRoadmap {
  report_id: string;
  phase: typeof GPU_VALIDATION_CAMPAIGN_PHASE;
  system_id: typeof GPU_VALIDATION_CAMPAIGN_SYSTEM_ID;
  generated_at: string;
  channel_validation_roadmap_defined: true;
  channel_phase_order: Array<{
    channel: string;
    phase: string;
    phase_name: string;
  }>;
  next_channel_phase: string;
  deferred_channels: string[];
}

const ANALYSIS = {
  environment_identity_validation:
    'First-priority channel; STRICT enforcement; hard-tier pass is primary Movie Reconstruction target; minimum batch 50 with same_environment_score gate.',
  temporal_preservation_validation:
    'Second-priority channel; edit_rhythm and continuity_signature validation across frame sequences; blocks object_identity until pass.',
  object_identity_validation:
    'Third-priority channel; variation_tolerance bands and hero_prop STRICT lock; depends on environment and temporal stage pass.',
  camera_continuity_validation:
    'MEDIUM enforcement channel; deferred to post-005C campaign extension; motion_vector delta validation.',
  multi_scene_consistency_validation:
    'STRICT cross-scene anchor validation; deferred until camera_continuity baseline established.',
} as const;

const VALIDATION_CAMPAIGN_CONTRACT = {
  contract_id: 'gpu_validation_campaign_v1',
  contract_version: '1.0',
  scope: 'Campaign definition only — Channel Validation must be executed separately in 005A/B/C phases.',
  dataset_ref: GPU_VALIDATION_DATASET_REPORT_PATH,
  enforcement_protocol_ref: VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
  stage_progression: 'Sequential channel stages; next stage blocked until prior exit_criteria met.',
  certification_scope: 'Campaign Defined != Campaign Executed; gpu_execution_allowed=false in this phase.',
} as const;

const VALIDATION_STAGE_ORDER = [
  'environment_identity',
  'temporal_preservation',
  'object_identity',
  'camera_continuity',
  'multi_scene_consistency',
] as const;

const VALIDATION_STOP_CONDITIONS = [
  'Channel batch pass_rate below validation_exit_criteria.pass_rate',
  'Hard-tier pass_rate below hard_tier_pass_threshold',
  'Two consecutive escalation events on same channel',
  'campaign_abort_conditions triggered in GPU_VALIDATION_RISK_REPORT',
  'gpu_execution_allowed=false while campaign execution attempted',
] as const;

const VALIDATION_ESCALATION_RULES = [
  'environment_identity failure blocks all subsequent channel stages',
  'Medium-tier failure escalates channel to hard-tier revalidation batch',
  'Hard-tier failure triggers recovery_strategy from risk report before retry',
  'STRICT channel failure executes expected_degradation_path audit',
  'Campaign Defined != Campaign Executed — escalation rules apply at execution time only',
] as const;

const VALIDATION_EXIT_CRITERIA_DEF = {
  pass_rate: 'Minimum batch pass rate in [0,1] required to exit channel stage.',
  same_environment_score: 'Environment identity same_environment threshold for stage exit.',
  same_object_score: 'Object identity same_object threshold for stage exit.',
  hard_tier_pass_rate: 'Hard tier batch pass rate — primary Movie Reconstruction target.',
  assessment_note: 'Exit criteria defined at campaign design; not proven until channel phase execution.',
} as const;

const STAGE_DEFINITIONS: Array<{
  target_channel: string;
  batch_size: number;
  pass_threshold: number;
  difficulty_tier: string;
  expected_pass_rate: number;
  success_criteria: string[];
  failure_criteria: string[];
  exit_criteria: ValidationExitCriteria;
  next_channel_phase: string;
}> = [
  {
    target_channel: 'environment_identity',
    batch_size: 50,
    pass_threshold: 0.98,
    difficulty_tier: 'hard',
    expected_pass_rate: 0.82,
    success_criteria: ['reference_bank_match', 'same_environment_score >= 0.98'],
    failure_criteria: ['reference_drift', 'geometry_mismatch', 'style_overrides_identity'],
    exit_criteria: { pass_rate: 0.8, same_environment_score: 0.95 },
    next_channel_phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005A',
  },
  {
    target_channel: 'temporal_preservation',
    batch_size: 30,
    pass_threshold: 0.9,
    difficulty_tier: 'hard',
    expected_pass_rate: 0.75,
    success_criteria: ['edit_rhythm_alignment', 'continuity_signature_stable'],
    failure_criteria: ['edit_rhythm_desync', 'shot_boundary_discontinuity'],
    exit_criteria: { pass_rate: 0.75, edit_rhythm_alignment_score: 0.88 },
    next_channel_phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005B',
  },
  {
    target_channel: 'object_identity',
    batch_size: 40,
    pass_threshold: 0.97,
    difficulty_tier: 'hard',
    expected_pass_rate: 0.78,
    success_criteria: ['identity_signature_match', 'variation_tolerance_band_score >= 0.9'],
    failure_criteria: ['identity_embedding_drift', 'role_weight_ignored'],
    exit_criteria: { pass_rate: 0.78, same_object_score: 0.93 },
    next_channel_phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005C',
  },
  {
    target_channel: 'camera_continuity',
    batch_size: 25,
    pass_threshold: 0.85,
    difficulty_tier: 'medium',
    expected_pass_rate: 0.7,
    success_criteria: ['camera_inertia_preserved'],
    failure_criteria: ['camera_inertia_break'],
    exit_criteria: { pass_rate: 0.7, motion_vector_delta_score: 0.82 },
    next_channel_phase: 'DEFERRED_POST_005C',
  },
  {
    target_channel: 'multi_scene_consistency',
    batch_size: 35,
    pass_threshold: 0.85,
    difficulty_tier: 'hard',
    expected_pass_rate: 0.72,
    success_criteria: ['cross_scene_anchor_stable'],
    failure_criteria: ['cross_scene_memory_loss'],
    exit_criteria: { pass_rate: 0.72, anchor_persistence_score: 0.85 },
    next_channel_phase: 'DEFERRED_POST_005C',
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildStages(): CampaignStage[] {
  return STAGE_DEFINITIONS.map((def) => ({
    validation_stage: def.target_channel,
    target_channel: def.target_channel,
    batch_size: def.batch_size,
    pass_threshold: def.pass_threshold,
    difficulty_tier: def.difficulty_tier,
    expected_pass_rate: def.expected_pass_rate,
    success_criteria: [...def.success_criteria],
    failure_criteria: [...def.failure_criteria],
    validation_exit_criteria: { ...def.exit_criteria },
    next_channel_phase: def.next_channel_phase,
  }));
}

function buildRiskReport(): GpuValidationRiskReport {
  return {
    report_id: `gpu_validation_risk_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    system_id: GPU_VALIDATION_CAMPAIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    highest_risk_channel: 'environment_identity',
    expected_failure_modes: [
      {
        channel: 'environment_identity',
        failure_modes: ['reference_drift', 'geometry_mismatch', 'style_overrides_identity'],
        risk_severity: 'CRITICAL',
        recovery_strategy: 'similar_environment → fallback_environment → campaign abort if hard-tier fails twice',
      },
      {
        channel: 'temporal_preservation',
        failure_modes: ['edit_rhythm_desync', 'shot_boundary_discontinuity'],
        risk_severity: 'CRITICAL',
        recovery_strategy: 'comfyui_adapter fallback → block object_identity stage',
      },
      {
        channel: 'object_identity',
        failure_modes: ['identity_embedding_drift', 'role_weight_ignored'],
        risk_severity: 'HIGH',
        recovery_strategy: 'similar_object → loose_class_match → defer hero_prop lock',
      },
      {
        channel: 'camera_continuity',
        failure_modes: ['camera_inertia_break'],
        risk_severity: 'MEDIUM',
        recovery_strategy: 'reduced_motion_smoothing → logged warning continuation',
      },
      {
        channel: 'multi_scene_consistency',
        failure_modes: ['cross_scene_memory_loss'],
        risk_severity: 'HIGH',
        recovery_strategy: 'partial_scene_memory → fallback_environment',
      },
    ],
    campaign_abort_conditions: [
      'environment_identity hard-tier pass_rate < 0.5 after two retries',
      'temporal_preservation pass_rate < 0.6 blocking movie reconstruction feasibility',
      'gpu_execution_allowed=false at campaign start',
      'Campaign Defined != Campaign Executed violation detected',
    ],
  };
}

function buildExecutionReadinessReport(): GpuExecutionReadinessReport {
  return {
    report_id: `gpu_execution_readiness_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    system_id: GPU_VALIDATION_CAMPAIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    execution_readiness_defined: true,
    ready_channels: ['environment_identity', 'temporal_preservation', 'object_identity'],
    blocked_channels: ['camera_continuity', 'multi_scene_consistency', 'live_gpu_execution'],
    execution_prerequisites: [
      'GPU_VALIDATION_CAMPAIGN_REPORT.json defined',
      'GPU_VALIDATION_DATASET_REPORT.json PASS',
      'VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL.json defined',
      'Binding packages exported (environment, object, temporal)',
      'VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT.json PASS',
      'Explicit gpu_execution_allowed=true in future execution phase',
    ],
    gpu_execution_allowed: false,
    assessment_note:
      'Campaign and datasets defined; GPU execution blocked until 005A channel phase explicitly enables execution.',
  };
}

function buildChannelRoadmap(): ChannelValidationRoadmap {
  return {
    report_id: `channel_validation_roadmap_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    system_id: GPU_VALIDATION_CAMPAIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    channel_validation_roadmap_defined: true,
    channel_phase_order: CHANNEL_PHASE_ORDER.map((entry) => ({ ...entry })),
    next_channel_phase: 'PHASE-GPU-CONDITIONING-VALIDATION-005A',
    deferred_channels: [...DEFERRED_CHANNELS],
  };
}

export function runGpuValidationCampaignValidation(
  projectRoot?: string
): GpuValidationCampaignReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: GpuValidationCampaignReport['issues'] = [];

  const prerequisitePaths = [
    GPU_VALIDATION_CAMPAIGN_REGISTRY_PATH,
    GPU_VALIDATION_DATASET_REPORT_PATH,
    GPU_VALIDATION_EXECUTION_PLAN_PATH,
    GPU_VALIDATION_COVERAGE_REPORT_PATH,
    VIDEO_RUNTIME_ENFORCEMENT_PROTOCOL_PATH,
    GPU_VALIDATION_ENTRY_CRITERIA_PATH,
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

  const stages = buildStages();

  const campaign_defined = Object.keys(VALIDATION_CAMPAIGN_CONTRACT).length > 0 && stages.length > 0;
  const stage_order_defined = VALIDATION_STAGE_ORDER.length > 0;
  const stop_conditions_defined = VALIDATION_STOP_CONDITIONS.length > 0;
  const escalation_rules_defined = VALIDATION_ESCALATION_RULES.length > 0;
  const exit_criteria_defined =
    Object.keys(VALIDATION_EXIT_CRITERIA_DEF).length > 0 &&
    stages.every((stage) => Object.keys(stage.validation_exit_criteria).length > 0);

  const executionReadiness = buildExecutionReadinessReport();
  const execution_readiness_defined = executionReadiness.execution_readiness_defined === true;

  const channelRoadmap = buildChannelRoadmap();
  const channel_validation_roadmap_defined =
    channelRoadmap.channel_validation_roadmap_defined === true &&
    channelRoadmap.channel_phase_order.length === 3;

  const environmentStage = stages.find((stage) => stage.target_channel === 'environment_identity');

  if (!environmentStage) {
    issues.push({
      code: 'ENVIRONMENT_STAGE',
      message: 'environment_identity campaign stage required',
      severity: 'error',
    });
  } else if (
    environmentStage.validation_exit_criteria.pass_rate !== 0.8 ||
    environmentStage.validation_exit_criteria.same_environment_score !== 0.95
  ) {
    issues.push({
      code: 'ENVIRONMENT_EXIT_CRITERIA',
      message: 'environment_identity exit_criteria must match required example',
      severity: 'error',
    });
  }

  if (!campaign_defined) {
    issues.push({ code: 'CAMPAIGN', message: 'campaign must be defined', severity: 'error' });
  }
  if (!stage_order_defined) {
    issues.push({ code: 'STAGE_ORDER', message: 'stage_order must be defined', severity: 'error' });
  }
  if (!stop_conditions_defined) {
    issues.push({ code: 'STOP_CONDITIONS', message: 'stop_conditions must be defined', severity: 'error' });
  }
  if (!escalation_rules_defined) {
    issues.push({ code: 'ESCALATION_RULES', message: 'escalation_rules must be defined', severity: 'error' });
  }
  if (!exit_criteria_defined) {
    issues.push({ code: 'EXIT_CRITERIA', message: 'exit_criteria must be defined', severity: 'error' });
  }
  if (!execution_readiness_defined) {
    issues.push({
      code: 'EXECUTION_READINESS',
      message: 'execution_readiness must be defined',
      severity: 'error',
    });
  }
  if (!channel_validation_roadmap_defined) {
    issues.push({
      code: 'CHANNEL_ROADMAP',
      message: 'channel_validation_roadmap must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    campaign_defined &&
    stage_order_defined &&
    stop_conditions_defined &&
    escalation_rules_defined &&
    exit_criteria_defined &&
    execution_readiness_defined &&
    channel_validation_roadmap_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const gpu_validation_campaign_defined = validation_passed;

  const report: GpuValidationCampaignReport = {
    report_id: `gpu_validation_campaign_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    system_id: GPU_VALIDATION_CAMPAIGN_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? GPU_VALIDATION_CAMPAIGN_PASS_VERDICT
      : GPU_VALIDATION_CAMPAIGN_FAIL_VERDICT,
    status: validation_passed
      ? GPU_VALIDATION_CAMPAIGN_STATUS
      : 'GPU_VALIDATION_CAMPAIGN_NOT_DEFINED',
    validation_passed,
    gpu_validation_campaign_defined,
    campaign_defined,
    stage_order_defined,
    stop_conditions_defined,
    escalation_rules_defined,
    exit_criteria_defined,
    execution_readiness_defined,
    channel_validation_roadmap_defined,
    gpu_validation_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    analysis: { ...ANALYSIS },
    validation_campaign_contract: { ...VALIDATION_CAMPAIGN_CONTRACT },
    validation_stage_order: [...VALIDATION_STAGE_ORDER],
    validation_stop_conditions: [...VALIDATION_STOP_CONDITIONS],
    validation_escalation_rules: [...VALIDATION_ESCALATION_RULES],
    validation_exit_criteria: { ...VALIDATION_EXIT_CRITERIA_DEF },
    stages,
    checks: {
      campaign_defined,
      stage_order_defined,
      stop_conditions_defined,
      escalation_rules_defined,
      exit_criteria_defined,
      execution_readiness_defined,
      channel_validation_roadmap_defined,
      environment_stage_example_present: Boolean(environmentStage),
      gpu_validation_executed_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, GPU_VALIDATION_CAMPAIGN_REPORT_PATH, report);
  writeJson(root, GPU_VALIDATION_RISK_REPORT_PATH, buildRiskReport());
  writeJson(root, GPU_EXECUTION_READINESS_REPORT_PATH, executionReadiness);
  writeJson(root, CHANNEL_VALIDATION_ROADMAP_PATH, channelRoadmap);

  return report;
}

export function writeGpuValidationCampaignReport(
  projectRoot?: string
): GpuValidationCampaignReport {
  return runGpuValidationCampaignValidation(projectRoot);
}
