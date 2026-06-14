import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
} from './environmentIdentityGpuValidation.js';
import { GPU_VALIDATION_CAMPAIGN_REPORT_PATH } from './gpuValidationCampaign.js';
import { GPU_VALIDATION_DATASET_DIR } from './gpuValidationDataset.js';
import {
  OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
} from './objectIdentityGpuValidation.js';
import {
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
} from './temporalPreservationGpuValidation.js';

export const GPU_VALIDATION_INTEGRATION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-005D' as const;
export const GPU_VALIDATION_INTEGRATION_SYSTEM_ID = 'GPU_VALIDATION_INTEGRATION_V1' as const;
export const GPU_VALIDATION_INTEGRATION_PASS_VERDICT =
  'PASS_GPU_VALIDATION_INTEGRATION_V1' as const;
export const GPU_VALIDATION_INTEGRATION_FAIL_VERDICT =
  'FAIL_GPU_VALIDATION_INTEGRATION_V1' as const;
export const GPU_VALIDATION_INTEGRATION_STATUS =
  'GPU_VALIDATION_INTEGRATION_DEFINED' as const;

export const GPU_VALIDATION_INTEGRATION_DATASET_DIR =
  'datasets/gpu_validation_integration' as const;
export const GPU_VALIDATION_INTEGRATION_REGISTRY_PATH =
  `${GPU_VALIDATION_INTEGRATION_DATASET_DIR}/gpu-validation-integration-registry.json` as const;

export const GPU_VALIDATION_INTEGRATION_REPORT_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_INTEGRATION_REPORT.json' as const;
export const GPU_VALIDATION_EXECUTION_SEQUENCE_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_EXECUTION_SEQUENCE.json' as const;
export const GPU_VALIDATION_MASTER_READINESS_PATH =
  'reports/movie_reconstruction/GPU_VALIDATION_MASTER_READINESS.json' as const;

const EXECUTION_FLAGS = {
  validation_integration_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const VALIDATION_CHANNELS = [
  'environment_identity',
  'temporal_preservation',
  'object_identity',
] as const;

type ValidationChannel = (typeof VALIDATION_CHANNELS)[number];

export interface ChannelAbortRule {
  abort_below: number;
  note: string;
}

export interface GpuValidationIntegrationReport {
  report_id: string;
  phase: typeof GPU_VALIDATION_INTEGRATION_PHASE;
  system_id: typeof GPU_VALIDATION_INTEGRATION_SYSTEM_ID;
  generated_at: string;
  validation_integration_defined: true;
  analysis: {
    environment_validation_protocol: string;
    temporal_validation_protocol: string;
    object_validation_protocol: string;
  };
  integrated_validation_contract: Record<string, string>;
  cross_channel_dependencies: Record<string, string[]>;
  cross_channel_failure_rules: Record<string, string>;
  validation_priority_order: ValidationChannel[];
  validation_channels: ValidationChannel[];
  channel_dependencies: Record<ValidationChannel, ValidationChannel[]>;
  channel_priorities: Record<ValidationChannel, number>;
  cross_channel_failure_rules_list: string[];
  channel_abort_rules: Record<ValidationChannel, ChannelAbortRule>;
}

export interface ExecutionSequenceStage {
  stage: ValidationChannel;
  stage_order: number;
  max_retry: number;
  entry_conditions: string[];
  exit_conditions: string[];
  abort_conditions: string[];
  retry_rules: {
    max_retry: number;
    backoff_strategy: string;
    escalate_on_consecutive_fail: boolean;
  };
}

export interface GpuValidationExecutionSequence {
  report_id: string;
  phase: typeof GPU_VALIDATION_INTEGRATION_PHASE;
  system_id: typeof GPU_VALIDATION_INTEGRATION_SYSTEM_ID;
  generated_at: string;
  execution_sequence_defined: true;
  retry_rules_defined: true;
  stage_order: ValidationChannel[];
  stages: ExecutionSequenceStage[];
  retry_rules: {
    default_max_retry: number;
    consecutive_fail_escalation_threshold: number;
    note: string;
  };
}

export interface GpuValidationMasterReadiness {
  report_id: string;
  phase: typeof GPU_VALIDATION_INTEGRATION_PHASE;
  system_id: typeof GPU_VALIDATION_INTEGRATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof GPU_VALIDATION_INTEGRATION_STATUS
    | 'GPU_VALIDATION_INTEGRATION_NOT_DEFINED';
  validation_passed: boolean;
  validation_integration_defined: boolean;
  integration_contract_defined: boolean;
  dependency_rules_defined: boolean;
  failure_rules_defined: boolean;
  channel_abort_rules_defined: boolean;
  execution_sequence_defined: boolean;
  retry_rules_defined: boolean;
  master_readiness_defined: boolean;
  evidence_layer_ready: true;
  environment_ready: boolean;
  temporal_ready: boolean;
  object_ready: boolean;
  integration_ready: boolean;
  gpu_execution_allowed: false;
  highest_risk_channel: ValidationChannel;
  gpu_validation_executed: false;
  environment_validated: false;
  temporal_validated: false;
  object_validated: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const PROTOCOL_REFS = {
  environment_identity: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  temporal_preservation: TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
  object_identity: OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
} as const;

const READINESS_REFS = {
  environment_identity: ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
  temporal_preservation: TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
  object_identity: OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
} as const;

const VALIDATION_PRIORITY_ORDER: ValidationChannel[] = [
  'environment_identity',
  'temporal_preservation',
  'object_identity',
];

const CHANNEL_DEPENDENCIES: Record<ValidationChannel, ValidationChannel[]> = {
  environment_identity: [],
  temporal_preservation: ['environment_identity'],
  object_identity: ['environment_identity', 'temporal_preservation'],
};

const CHANNEL_PRIORITIES: Record<ValidationChannel, number> = {
  environment_identity: 1,
  temporal_preservation: 2,
  object_identity: 3,
};

const CHANNEL_ABORT_RULES: Record<ValidationChannel, ChannelAbortRule> = {
  environment_identity: {
    abort_below: 0.3,
    note: 'Batch pass rate below 0.30 aborts campaign; blocks all subsequent channels.',
  },
  temporal_preservation: {
    abort_below: 0.35,
    note: 'Batch pass rate below 0.35 aborts temporal stage; blocks object_identity.',
  },
  object_identity: {
    abort_below: 0.4,
    note: 'Batch pass rate below 0.40 aborts object stage; triggers campaign recovery audit.',
  },
};

const CROSS_CHANNEL_FAILURE_RULES: Record<string, string> = {
  environment_blocks_all:
    'environment_identity stage failure blocks temporal_preservation and object_identity stages.',
  temporal_blocks_object:
    'temporal_preservation stage failure blocks object_identity stage until exit_criteria met.',
  object_requires_prior_pass:
    'object_identity entry requires environment_identity and temporal_preservation exit_criteria pass.',
  cross_channel_drift_cascade:
    'environment reference_drift degrades temporal continuity_signature stability; temporal edit_rhythm_desync degrades object anchor persistence.',
  integrated_validation_note:
    'Integrated Validation Defined != Integrated Validation Executed.',
};

const CROSS_CHANNEL_FAILURE_RULES_LIST = Object.keys(CROSS_CHANNEL_FAILURE_RULES);

const INTEGRATED_VALIDATION_CONTRACT = {
  contract_id: 'gpu_validation_integration_v1',
  contract_version: '1.0',
  scope: 'Integration definition only — Integrated Validation Defined != Integrated Validation Executed.',
  environment_protocol_ref: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  temporal_protocol_ref: TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
  object_protocol_ref: OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  campaign_ref: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  dataset_manifest_ref: `${GPU_VALIDATION_DATASET_DIR}/gpu-validation-dataset-manifest.json`,
  gpu_execution: 'false — integration protocol and execution sequence only; execution deferred.',
  evidence_layer_note: 'Evidence Layer Ready != Evidence Collected.',
} as const;

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildAnalysis(root: string): GpuValidationIntegrationReport['analysis'] {
  const envProtocol = readJson<{ protocol_id: string; environment_validation_defined: boolean }>(
    root,
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH
  );
  const tempProtocol = readJson<{ protocol_id: string; temporal_validation_defined: boolean }>(
    root,
    TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH
  );
  const objProtocol = readJson<{ protocol_id: string; object_validation_defined: boolean }>(
    root,
    OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH
  );

  return {
    environment_validation_protocol: `${envProtocol.protocol_id} defined=${envProtocol.environment_validation_defined}; first-priority channel with same_environment=0.98 and reference_bank recall rules.`,
    temporal_validation_protocol: `${tempProtocol.protocol_id} defined=${tempProtocol.temporal_validation_defined}; second-priority channel with same_timeline=0.95 and causal_transition_chain highest risk.`,
    object_validation_protocol: `${objProtocol.protocol_id} defined=${objProtocol.object_validation_defined}; third-priority channel with same_object=0.97 and hero_prop=0.98 role threshold.`,
  };
}

function buildIntegrationReport(root: string): GpuValidationIntegrationReport {
  return {
    report_id: `gpu_validation_integration_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_INTEGRATION_PHASE,
    system_id: GPU_VALIDATION_INTEGRATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    validation_integration_defined: true,
    analysis: buildAnalysis(root),
    integrated_validation_contract: { ...INTEGRATED_VALIDATION_CONTRACT },
    cross_channel_dependencies: {
      temporal_preservation: ['environment_identity'],
      object_identity: ['environment_identity', 'temporal_preservation'],
    },
    cross_channel_failure_rules: { ...CROSS_CHANNEL_FAILURE_RULES },
    validation_priority_order: [...VALIDATION_PRIORITY_ORDER],
    validation_channels: [...VALIDATION_CHANNELS],
    channel_dependencies: {
      environment_identity: [],
      temporal_preservation: ['environment_identity'],
      object_identity: ['environment_identity', 'temporal_preservation'],
    },
    channel_priorities: { ...CHANNEL_PRIORITIES },
    cross_channel_failure_rules_list: [...CROSS_CHANNEL_FAILURE_RULES_LIST],
    channel_abort_rules: {
      environment_identity: { ...CHANNEL_ABORT_RULES.environment_identity },
      temporal_preservation: { ...CHANNEL_ABORT_RULES.temporal_preservation },
      object_identity: { ...CHANNEL_ABORT_RULES.object_identity },
    },
  };
}

function buildExecutionSequence(): GpuValidationExecutionSequence {
  const stages: ExecutionSequenceStage[] = [
    {
      stage: 'environment_identity',
      stage_order: 1,
      max_retry: 2,
      entry_conditions: [
        'GPU_VALIDATION_CAMPAIGN_REPORT.json PASS',
        'ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL.json defined',
        'environment_identity-validation-dataset.json coverage_ratio=1.0',
        'gpu_execution_allowed=false until master readiness gate lifted',
      ],
      exit_conditions: [
        'batch pass_rate >= 0.80',
        'same_environment_score >= 0.95',
        'hard-tier pass_rate >= hard.expected_pass_rate',
      ],
      abort_conditions: [
        'batch pass_rate < channel_abort_rules.environment_identity.abort_below (0.30)',
        'two consecutive hard-tier failures on same environment_id',
      ],
      retry_rules: {
        max_retry: 2,
        backoff_strategy: 'linear_batch_delay',
        escalate_on_consecutive_fail: true,
      },
    },
    {
      stage: 'temporal_preservation',
      stage_order: 2,
      max_retry: 2,
      entry_conditions: [
        'environment_identity stage exit_criteria met',
        'TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL.json defined',
        'temporal_preservation-validation-dataset.json coverage_ratio=1.0',
      ],
      exit_conditions: [
        'batch pass_rate >= 0.75',
        'edit_rhythm_alignment_score >= 0.88',
        'continuity_signature stable across batch',
      ],
      abort_conditions: [
        'batch pass_rate < channel_abort_rules.temporal_preservation.abort_below (0.35)',
        'causal_transition_chain break on >50% hard-tier cases',
      ],
      retry_rules: {
        max_retry: 2,
        backoff_strategy: 'linear_batch_delay',
        escalate_on_consecutive_fail: true,
      },
    },
    {
      stage: 'object_identity',
      stage_order: 3,
      max_retry: 2,
      entry_conditions: [
        'temporal_preservation stage exit_criteria met',
        'OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL.json defined',
        'object_identity-validation-dataset.json coverage_ratio=1.0',
      ],
      exit_conditions: [
        'batch pass_rate >= 0.78',
        'same_object_score >= 0.93',
        'hero_prop tier pass_rate >= hero_prop_expected_pass_rate',
      ],
      abort_conditions: [
        'batch pass_rate < channel_abort_rules.object_identity.abort_below (0.40)',
        'identity_swap detected on hero_prop_cases > 25%',
      ],
      retry_rules: {
        max_retry: 2,
        backoff_strategy: 'linear_batch_delay',
        escalate_on_consecutive_fail: true,
      },
    },
  ];

  return {
    report_id: `gpu_validation_execution_sequence_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_INTEGRATION_PHASE,
    system_id: GPU_VALIDATION_INTEGRATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    execution_sequence_defined: true,
    retry_rules_defined: true,
    stage_order: [...VALIDATION_PRIORITY_ORDER],
    stages,
    retry_rules: {
      default_max_retry: 2,
      consecutive_fail_escalation_threshold: 2,
      note: 'Retry rules apply at execution time only; max_retry=2 per stage.',
    },
  };
}

function loadChannelReadiness(
  root: string,
  channel: ValidationChannel
): { validation_ready: boolean; status: string; final_verdict: string } {
  const readiness = readJson<{
    validation_ready: boolean;
    status: string;
    final_verdict: string;
  }>(root, READINESS_REFS[channel]);
  return readiness;
}

export function runGpuValidationIntegrationDefinition(
  projectRoot?: string
): GpuValidationMasterReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: GpuValidationMasterReadiness['issues'] = [];

  const prerequisitePaths = [
    GPU_VALIDATION_INTEGRATION_REGISTRY_PATH,
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
    TEMPORAL_PRESERVATION_GPU_VALIDATION_PROTOCOL_PATH,
    OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
    TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
    OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    `${GPU_VALIDATION_DATASET_DIR}/gpu-validation-dataset-manifest.json`,
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

  const integrationReport = buildIntegrationReport(root);
  const executionSequence = buildExecutionSequence();

  const envReadiness = loadChannelReadiness(root, 'environment_identity');
  const tempReadiness = loadChannelReadiness(root, 'temporal_preservation');
  const objReadiness = loadChannelReadiness(root, 'object_identity');

  const environment_ready = envReadiness.validation_ready === true;
  const temporal_ready = tempReadiness.validation_ready === true;
  const object_ready = objReadiness.validation_ready === true;

  const integration_contract_defined =
    integrationReport.validation_integration_defined === true &&
    Object.keys(integrationReport.integrated_validation_contract).length > 0;
  const dependency_rules_defined =
    Object.keys(integrationReport.cross_channel_dependencies).length > 0 &&
    VALIDATION_CHANNELS.every(
      (channel) => Array.isArray(integrationReport.channel_dependencies[channel])
    );
  const failure_rules_defined =
    Object.keys(integrationReport.cross_channel_failure_rules).length > 0 &&
    integrationReport.cross_channel_failure_rules_list.length > 0;
  const channel_abort_rules_defined =
    integrationReport.channel_abort_rules.environment_identity.abort_below === 0.3 &&
    integrationReport.channel_abort_rules.temporal_preservation.abort_below === 0.35 &&
    integrationReport.channel_abort_rules.object_identity.abort_below === 0.4;
  const execution_sequence_defined =
    executionSequence.execution_sequence_defined === true &&
    executionSequence.stages.length === 3 &&
    executionSequence.stage_order.length === 3;
  const retry_rules_defined =
    executionSequence.retry_rules_defined === true &&
    executionSequence.retry_rules.default_max_retry === 2 &&
    executionSequence.stages.every((stage) => stage.max_retry === 2);

  const evidence_layer_ready = true as const;
  const integration_ready =
    integration_contract_defined &&
    dependency_rules_defined &&
    failure_rules_defined &&
    channel_abort_rules_defined &&
    execution_sequence_defined &&
    retry_rules_defined &&
    environment_ready &&
    temporal_ready &&
    object_ready;

  const master_readiness_defined =
    integration_ready && evidence_layer_ready === true;

  const validation_integration_defined = integrationReport.validation_integration_defined === true;

  if (!integration_contract_defined) {
    issues.push({
      code: 'INTEGRATION_CONTRACT',
      message: 'integrated_validation_contract must be defined',
      severity: 'error',
    });
  }
  if (!dependency_rules_defined) {
    issues.push({
      code: 'DEPENDENCY_RULES',
      message: 'cross_channel_dependencies must be defined',
      severity: 'error',
    });
  }
  if (!failure_rules_defined) {
    issues.push({
      code: 'FAILURE_RULES',
      message: 'cross_channel_failure_rules must be defined',
      severity: 'error',
    });
  }
  if (!channel_abort_rules_defined) {
    issues.push({
      code: 'ABORT_RULES',
      message: 'channel_abort_rules must be defined',
      severity: 'error',
    });
  }
  if (!execution_sequence_defined) {
    issues.push({
      code: 'EXECUTION_SEQUENCE',
      message: 'execution_sequence must be defined',
      severity: 'error',
    });
  }
  if (!retry_rules_defined) {
    issues.push({
      code: 'RETRY_RULES',
      message: 'retry_rules must be defined',
      severity: 'error',
    });
  }
  if (!environment_ready || !temporal_ready || !object_ready) {
    issues.push({
      code: 'CHANNEL_READINESS',
      message: 'all channel validation protocols must report validation_ready=true',
      severity: 'error',
    });
  }
  if (!master_readiness_defined) {
    issues.push({
      code: 'MASTER_READINESS',
      message: 'master_readiness must be defined',
      severity: 'error',
    });
  }

  const validation_passed =
    validation_integration_defined &&
    integration_contract_defined &&
    dependency_rules_defined &&
    failure_rules_defined &&
    channel_abort_rules_defined &&
    execution_sequence_defined &&
    retry_rules_defined &&
    master_readiness_defined &&
    evidence_layer_ready === true &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const masterReadiness: GpuValidationMasterReadiness = {
    report_id: `gpu_validation_master_readiness_${Date.now().toString(36)}`,
    phase: GPU_VALIDATION_INTEGRATION_PHASE,
    system_id: GPU_VALIDATION_INTEGRATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? GPU_VALIDATION_INTEGRATION_PASS_VERDICT
      : GPU_VALIDATION_INTEGRATION_FAIL_VERDICT,
    status: validation_passed
      ? GPU_VALIDATION_INTEGRATION_STATUS
      : 'GPU_VALIDATION_INTEGRATION_NOT_DEFINED',
    validation_passed,
    validation_integration_defined,
    integration_contract_defined,
    dependency_rules_defined,
    failure_rules_defined,
    channel_abort_rules_defined,
    execution_sequence_defined,
    retry_rules_defined,
    master_readiness_defined,
    evidence_layer_ready,
    environment_ready,
    temporal_ready,
    object_ready,
    integration_ready,
    gpu_execution_allowed: false,
    highest_risk_channel: 'environment_identity',
    gpu_validation_executed: false,
    environment_validated: false,
    temporal_validated: false,
    object_validated: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    checks: {
      validation_integration_defined,
      integration_contract_defined,
      dependency_rules_defined,
      failure_rules_defined,
      channel_abort_rules_defined,
      execution_sequence_defined,
      retry_rules_defined,
      master_readiness_defined,
      evidence_layer_ready: evidence_layer_ready === true,
      environment_ready,
      temporal_ready,
      object_ready,
      integration_ready,
      gpu_execution_allowed_false: true,
      environment_validated_false: true,
      temporal_validated_false: true,
      object_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, GPU_VALIDATION_INTEGRATION_REPORT_PATH, integrationReport);
  writeJson(root, GPU_VALIDATION_EXECUTION_SEQUENCE_PATH, executionSequence);
  writeJson(root, GPU_VALIDATION_MASTER_READINESS_PATH, masterReadiness);

  return masterReadiness;
}

export function writeGpuValidationIntegrationReport(
  projectRoot?: string
): GpuValidationMasterReadiness {
  return runGpuValidationIntegrationDefinition(projectRoot);
}
