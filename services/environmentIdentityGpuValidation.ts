import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH } from './environmentIdentityBinding.js';
import { ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH } from './environmentIdentityStrategy.js';
import { GPU_VALIDATION_CAMPAIGN_REPORT_PATH } from './gpuValidationCampaign.js';
import { GPU_VALIDATION_DATASET_DIR } from './gpuValidationDataset.js';

export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-005A' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID =
  'ENVIRONMENT_IDENTITY_GPU_VALIDATION_V1' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT =
  'PASS_ENVIRONMENT_IDENTITY_GPU_VALIDATION_V1' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_FAIL_VERDICT =
  'FAIL_ENVIRONMENT_IDENTITY_GPU_VALIDATION_V1' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS =
  'ENVIRONMENT_GPU_VALIDATION_DEFINED' as const;

export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_DIR =
  'datasets/gpu_validation_environment_identity' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_REGISTRY_PATH =
  `${ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_DIR}/environment-identity-gpu-validation-registry.json` as const;

export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL.json' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN.json' as const;
export const ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS.json' as const;

const MINIMUM_BATCH_SIZE = 50;

const EXECUTION_FLAGS = {
  validation_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface EnvironmentDriftLevels {
  same_environment: number;
  strict_environment: number;
  similar_environment: number;
  different_environment: number;
}

export interface EnvironmentProtocolTier {
  difficulty_tier: string;
  measurement_method: string[];
  pass_threshold: number;
  failure_examples: string[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
  };
  exit_criteria: {
    pass_rate: number;
    same_environment_score: number;
  };
}

export interface EnvironmentIdentityGpuValidationProtocol {
  protocol_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  environment_validation_defined: true;
  analysis: {
    environment_reference_bank: string;
    environment_similarity_binding: string;
    environment_traceability_binding: string;
    environment_runtime_channel: string;
  };
  environment_validation_contract: Record<string, string>;
  same_environment_criteria: Record<string, string>;
  similar_environment_criteria: Record<string, string>;
  environment_failure_criteria: Record<string, string>;
  environment_drift_levels: EnvironmentDriftLevels;
  tiers: EnvironmentProtocolTier[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
    recall_method: string;
  };
}

export interface EnvironmentIdentityGpuValidationReadiness {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS
    | 'ENVIRONMENT_GPU_VALIDATION_NOT_DEFINED';
  validation_passed: boolean;
  environment_validation_defined: boolean;
  same_environment_criteria_defined: boolean;
  similar_environment_criteria_defined: boolean;
  drift_levels_defined: boolean;
  failure_criteria_defined: boolean;
  reference_bank_recall_rules_defined: boolean;
  dataset_plan_defined: boolean;
  expected_pass_rate_defined: boolean;
  readiness_defined: boolean;
  environment_identity_validated: false;
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

export interface EnvironmentIdentityGpuValidationDatasetPlan {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  dataset_plan_defined: true;
  minimum_batch_size: number;
  easy_cases: Array<{ case_id: string; environment_id: string; source_ref: string }>;
  medium_cases: Array<{ case_id: string; environment_id: string; source_ref: string }>;
  hard_cases: Array<{ case_id: string; environment_id: string; failure_mode: string }>;
}

const ANALYSIS = {
  environment_reference_bank:
    'Four seed entries (titanic_staircase_001, ghibli_kitchen_001, gonegi_harbor_dock_001, mori_forest_clearing_001) provide validation reference targets; recall rules require minimum anchor match against bank descriptors.',
  environment_similarity_binding:
    'environment_similarity_v1 governs same_environment_threshold=0.98 vs similarity_threshold=0.85; validation must not treat similar_environment scores as identity lock.',
  environment_traceability_binding:
    'traceability_signature links conditioning_map_ref and ENVIRONMENT_REFERENCE_BANK_SPECIFICATION for batch audit without GPU execution in this phase.',
  environment_runtime_channel:
    'STRICT environment_identity runtime channel from VIDEO_CONDITIONING_BACKEND; first campaign stage with batch_size=50 and hard-tier primary Movie Reconstruction target.',
} as const;

const ENVIRONMENT_VALIDATION_CONTRACT = {
  contract_id: 'environment_identity_gpu_validation_v1',
  contract_version: '1.0',
  scope: 'Validation definition only — Validation Defined != Validation Executed.',
  binding_ref: ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
  bank_spec_ref: ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
  dataset_ref: `${GPU_VALIDATION_DATASET_DIR}/environment_identity-validation-dataset.json`,
  campaign_stage_ref: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  gpu_execution: 'false — protocol and dataset plan only; execution deferred to future GPU-enabled phase.',
} as const;

const SAME_ENVIRONMENT_CRITERIA = {
  same_environment: 'Score >= 0.98 required for same-environment identity lock certification.',
  reference_bank_match: 'Exact environment_id or layout_signature match with reference_bank_match_score >= 0.98.',
  same_environment_score: 'Primary measurement: reference_bank_match_score gated at same_environment threshold.',
  assessment_note: 'Same Environment Defined != Same Environment Achieved.',
} as const;

const SIMILAR_ENVIRONMENT_CRITERIA = {
  similar_environment: 'Score in [0.80, 0.98) classifies as similar but NOT same environment.',
  similarity_threshold: 'Scores >= 0.85 trigger similar_environment degradation path review.',
  strict_environment: 'Score in [0.95, 0.98) is strict-but-not-identical; logged for anchor tuning.',
  different_environment: 'Score < 0.50 classifies as different_environment; triggers fallback_environment.',
} as const;

const ENVIRONMENT_FAILURE_CRITERIA = {
  reference_drift: 'reference_bank_match_score drops below similar_environment threshold.',
  geometry_mismatch: 'Anchor normalized_position delta exceeds STRICT bound.',
  style_overrides_identity: 'Style conditioning weight dominates IP-Adapter environment reference weight.',
  different_staircase: 'Hard-tier failure example: wrong architectural identity.',
  missing_railing: 'Hard-tier failure example: anchor descriptor missing from output.',
  hallucinated_architecture: 'Hard-tier failure example: invented structure not in reference bank.',
} as const;

const ENVIRONMENT_DRIFT_LEVELS: EnvironmentDriftLevels = {
  same_environment: 0.98,
  strict_environment: 0.95,
  similar_environment: 0.8,
  different_environment: 0.5,
};

const REFERENCE_BANK_RECALL_RULES = {
  required_reference_count: 5,
  minimum_anchor_match: 3,
  recall_method:
    'Match generated output anchors against reference bank anchor_descriptors; count kind+importance matches >= minimum_anchor_match across required_reference_count bank entries per batch.',
};

const PROTOCOL_TIERS: EnvironmentProtocolTier[] = [
  {
    difficulty_tier: 'easy',
    measurement_method: ['reference_bank_match_score', 'environment_traceability_score'],
    pass_threshold: 0.98,
    failure_examples: ['minor_lighting_drift'],
    reference_bank_recall_rules: {
      required_reference_count: 5,
      minimum_anchor_match: 3,
    },
    exit_criteria: { pass_rate: 0.9, same_environment_score: 0.98 },
  },
  {
    difficulty_tier: 'medium',
    measurement_method: ['reference_bank_match_score', 'layout_signature_score'],
    pass_threshold: 0.95,
    failure_examples: ['partial_anchor_occlusion', 'lighting_shift'],
    reference_bank_recall_rules: {
      required_reference_count: 5,
      minimum_anchor_match: 3,
    },
    exit_criteria: { pass_rate: 0.85, same_environment_score: 0.96 },
  },
  {
    difficulty_tier: 'hard',
    measurement_method: ['reference_bank_match_score', 'anchor_persistence_score'],
    pass_threshold: 0.92,
    failure_examples: ['different_staircase', 'missing_railing', 'hallucinated_architecture'],
    reference_bank_recall_rules: {
      required_reference_count: 5,
      minimum_anchor_match: 3,
    },
    exit_criteria: { pass_rate: 0.8, same_environment_score: 0.95 },
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildDatasetPlan(): EnvironmentIdentityGpuValidationDatasetPlan {
  return {
    report_id: `environment_identity_gpu_dataset_plan_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    dataset_plan_defined: true,
    minimum_batch_size: MINIMUM_BATCH_SIZE,
    easy_cases: [
      { case_id: 'env_gpu_easy_001', environment_id: 'titanic_staircase_001', source_ref: 'env_ref_001' },
      { case_id: 'env_gpu_easy_002', environment_id: 'ghibli_kitchen_001', source_ref: 'env_ref_002' },
    ],
    medium_cases: [
      { case_id: 'env_gpu_med_001', environment_id: 'gonegi_harbor_dock_001', source_ref: 'env_ref_003' },
      { case_id: 'env_gpu_med_002', environment_id: 'mori_forest_clearing_001', source_ref: 'env_ref_004' },
    ],
    hard_cases: [
      {
        case_id: 'env_gpu_hard_001',
        environment_id: 'titanic_staircase_001',
        failure_mode: 'different_staircase',
      },
      {
        case_id: 'env_gpu_hard_002',
        environment_id: 'titanic_staircase_001',
        failure_mode: 'missing_railing',
      },
      {
        case_id: 'env_gpu_hard_003',
        environment_id: 'ghibli_kitchen_001',
        failure_mode: 'hallucinated_architecture',
      },
    ],
  };
}

function buildProtocol(): EnvironmentIdentityGpuValidationProtocol {
  return {
    protocol_id: 'environment-identity-gpu-validation-protocol-v1',
    phase: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    environment_validation_defined: true,
    analysis: { ...ANALYSIS },
    environment_validation_contract: { ...ENVIRONMENT_VALIDATION_CONTRACT },
    same_environment_criteria: { ...SAME_ENVIRONMENT_CRITERIA },
    similar_environment_criteria: { ...SIMILAR_ENVIRONMENT_CRITERIA },
    environment_failure_criteria: { ...ENVIRONMENT_FAILURE_CRITERIA },
    environment_drift_levels: { ...ENVIRONMENT_DRIFT_LEVELS },
    tiers: PROTOCOL_TIERS.map((tier) => ({
      ...tier,
      reference_bank_recall_rules: { ...tier.reference_bank_recall_rules },
      exit_criteria: { ...tier.exit_criteria },
    })),
    reference_bank_recall_rules: { ...REFERENCE_BANK_RECALL_RULES },
  };
}

export function runEnvironmentIdentityGpuValidationDefinition(
  projectRoot?: string
): EnvironmentIdentityGpuValidationReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: EnvironmentIdentityGpuValidationReadiness['issues'] = [];

  const prerequisitePaths = [
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_REGISTRY_PATH,
    ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
    ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    `${GPU_VALIDATION_DATASET_DIR}/environment_identity-validation-dataset.json`,
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

  const environment_validation_defined = protocol.environment_validation_defined === true;
  const same_environment_criteria_defined =
    Object.keys(protocol.same_environment_criteria).length > 0 &&
    protocol.environment_drift_levels.same_environment === 0.98;
  const similar_environment_criteria_defined =
    Object.keys(protocol.similar_environment_criteria).length > 0 &&
    protocol.environment_drift_levels.similar_environment === 0.8;
  const drift_levels_defined =
    protocol.environment_drift_levels.same_environment === 0.98 &&
    protocol.environment_drift_levels.strict_environment === 0.95 &&
    protocol.environment_drift_levels.similar_environment === 0.8 &&
    protocol.environment_drift_levels.different_environment === 0.5;
  const failure_criteria_defined =
    Object.keys(protocol.environment_failure_criteria).length > 0 &&
    protocol.tiers.every((tier) => tier.failure_examples.length > 0);
  const reference_bank_recall_rules_defined =
    protocol.reference_bank_recall_rules.required_reference_count === 5 &&
    protocol.reference_bank_recall_rules.minimum_anchor_match === 3;
  const dataset_plan_defined =
    datasetPlan.dataset_plan_defined === true &&
    datasetPlan.easy_cases.length > 0 &&
    datasetPlan.medium_cases.length > 0 &&
    datasetPlan.hard_cases.length > 0 &&
    datasetPlan.minimum_batch_size === MINIMUM_BATCH_SIZE;

  const expected_pass_rate = {
    easy: 0.85,
    medium: 0.55,
    hard: 0.15,
  };
  const expected_pass_rate_defined =
    typeof expected_pass_rate.easy === 'number' &&
    typeof expected_pass_rate.medium === 'number' &&
    expected_pass_rate.hard === 0.15;

  const validation_ready = environment_validation_defined && dataset_plan_defined;
  const readiness_defined =
    validation_ready &&
    expected_pass_rate_defined &&
    reference_bank_recall_rules_defined;

  const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');

  if (!hardTier) {
    issues.push({ code: 'HARD_TIER', message: 'hard difficulty tier required', severity: 'error' });
  }
  if (protocol.reference_bank_recall_rules.required_reference_count !== 5) {
    issues.push({
      code: 'RECALL_RULES',
      message: 'required_reference_count must be 5',
      severity: 'error',
    });
  }
  if (protocol.reference_bank_recall_rules.minimum_anchor_match !== 3) {
    issues.push({
      code: 'ANCHOR_MATCH',
      message: 'minimum_anchor_match must be 3',
      severity: 'error',
    });
  }
  if (!environment_validation_defined) {
    issues.push({
      code: 'ENVIRONMENT_VALIDATION',
      message: 'environment_validation must be defined',
      severity: 'error',
    });
  }
  if (!drift_levels_defined) {
    issues.push({ code: 'DRIFT_LEVELS', message: 'drift_levels must be defined', severity: 'error' });
  }
  if (!dataset_plan_defined) {
    issues.push({ code: 'DATASET_PLAN', message: 'dataset_plan must be defined', severity: 'error' });
  }
  if (!readiness_defined) {
    issues.push({ code: 'READINESS', message: 'readiness must be defined', severity: 'error' });
  }

  const validation_passed =
    environment_validation_defined &&
    same_environment_criteria_defined &&
    similar_environment_criteria_defined &&
    drift_levels_defined &&
    failure_criteria_defined &&
    reference_bank_recall_rules_defined &&
    dataset_plan_defined &&
    expected_pass_rate_defined &&
    readiness_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readiness: EnvironmentIdentityGpuValidationReadiness = {
    report_id: `environment_identity_gpu_readiness_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT
      : ENVIRONMENT_IDENTITY_GPU_VALIDATION_FAIL_VERDICT,
    status: validation_passed
      ? ENVIRONMENT_IDENTITY_GPU_VALIDATION_STATUS
      : 'ENVIRONMENT_GPU_VALIDATION_NOT_DEFINED',
    validation_passed,
    environment_validation_defined,
    same_environment_criteria_defined,
    similar_environment_criteria_defined,
    drift_levels_defined,
    failure_criteria_defined,
    reference_bank_recall_rules_defined,
    dataset_plan_defined,
    expected_pass_rate_defined,
    readiness_defined,
    environment_identity_validated: false,
    gpu_validation_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    validation_ready,
    execution_ready: false,
    blocking_factors: [
      'gpu_execution disabled in validation definition phase',
      'environment_identity_map reserved_v1 with no populated payload',
      'IP-Adapter environment reference nodes not connected',
      'anchor_images are metadata placeholders only',
      'Validation Defined != Validation Executed',
    ],
    highest_risk_area: 'reference_drift on hard-tier titanic_staircase_001 cases',
    expected_pass_rate,
    checks: {
      environment_validation_defined,
      same_environment_criteria_defined,
      similar_environment_criteria_defined,
      drift_levels_defined,
      failure_criteria_defined,
      reference_bank_recall_rules_defined,
      dataset_plan_defined,
      expected_pass_rate_defined,
      readiness_defined,
      hard_tier_present: Boolean(hardTier),
      execution_ready_false: true,
      environment_identity_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH, protocol);
  writeJson(root, ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH, datasetPlan);
  writeJson(root, ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH, readiness);

  return readiness;
}

export function writeEnvironmentIdentityGpuValidationReport(
  projectRoot?: string
): EnvironmentIdentityGpuValidationReadiness {
  return runEnvironmentIdentityGpuValidationDefinition(projectRoot);
}
