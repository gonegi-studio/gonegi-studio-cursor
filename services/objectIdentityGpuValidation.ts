import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import { GPU_VALIDATION_CAMPAIGN_REPORT_PATH } from './gpuValidationCampaign.js';
import { GPU_VALIDATION_DATASET_DIR } from './gpuValidationDataset.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';
import { OBJECT_REFERENCE_BANK_SPECIFICATION_PATH } from './objectIdentityStrategy.js';

export const OBJECT_IDENTITY_GPU_VALIDATION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-005C' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID =
  'OBJECT_IDENTITY_GPU_VALIDATION_V1' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT =
  'PASS_OBJECT_IDENTITY_GPU_VALIDATION_V1' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_FAIL_VERDICT =
  'FAIL_OBJECT_IDENTITY_GPU_VALIDATION_V1' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_STATUS =
  'OBJECT_GPU_VALIDATION_DEFINED' as const;

export const OBJECT_IDENTITY_GPU_VALIDATION_DATASET_DIR =
  'datasets/gpu_validation_object_identity' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_REGISTRY_PATH =
  `${OBJECT_IDENTITY_GPU_VALIDATION_DATASET_DIR}/object-identity-gpu-validation-registry.json` as const;

export const OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL.json' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN.json' as const;
export const OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_GPU_VALIDATION_READINESS.json' as const;

const MINIMUM_BATCH_SIZE = 40;

const EXECUTION_FLAGS = {
  validation_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface ObjectDriftLevels {
  same_object: number;
  strict_object: number;
  similar_object: number;
  different_object: number;
}

export interface ObjectDegradationLevels {
  minor_drift: number;
  moderate_drift: number;
  critical_drift: number;
}

export interface ObjectRoleThresholds {
  hero_prop: number;
  secondary_prop: number;
  background_object: number;
}

export interface ObjectIdentityTier {
  tier_id: string;
  role: keyof ObjectRoleThresholds;
  pass_threshold: number;
  identity_level: string;
  note: string;
}

export interface ObjectProtocolTier {
  difficulty_tier: string;
  measurement_method: string[];
  pass_threshold: number;
  failure_examples: string[];
  object_failure_examples: string[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
  };
  exit_criteria: {
    pass_rate: number;
    same_object_score: number;
  };
}

export interface ObjectIdentityGpuValidationProtocol {
  protocol_id: string;
  phase: typeof OBJECT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  object_validation_defined: true;
  analysis: {
    object_reference_bank_binding: string;
    object_similarity_binding: string;
    object_variation_tolerance_binding: string;
    object_role_binding: string;
    object_traceability_binding: string;
  };
  object_validation_contract: Record<string, string>;
  same_object_criteria: Record<string, string>;
  object_drift_levels: ObjectDriftLevels;
  object_degradation_levels: ObjectDegradationLevels;
  object_failure_criteria: Record<string, string>;
  object_role_thresholds: ObjectRoleThresholds;
  object_identity_tiers: ObjectIdentityTier[];
  object_failure_examples: string[];
  tiers: ObjectProtocolTier[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
    recall_method: string;
  };
}

export interface ObjectIdentityGpuValidationReadiness {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof OBJECT_IDENTITY_GPU_VALIDATION_STATUS
    | 'OBJECT_GPU_VALIDATION_NOT_DEFINED';
  validation_passed: boolean;
  object_validation_defined: boolean;
  same_object_criteria_defined: boolean;
  drift_levels_defined: boolean;
  degradation_levels_defined: boolean;
  object_identity_tiers_defined: boolean;
  failure_criteria_defined: boolean;
  role_thresholds_defined: boolean;
  object_failure_examples_defined: boolean;
  dataset_plan_defined: boolean;
  expected_pass_rate_defined: boolean;
  hero_prop_expected_pass_rate_defined: boolean;
  readiness_defined: boolean;
  object_identity_validated: false;
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
  hero_prop_expected_pass_rate: number;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface ObjectIdentityGpuValidationDatasetPlan {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_GPU_VALIDATION_PHASE;
  system_id: typeof OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID;
  generated_at: string;
  dataset_plan_defined: true;
  minimum_batch_size: number;
  easy_cases: Array<{ case_id: string; object_id: string; source_ref: string }>;
  medium_cases: Array<{ case_id: string; object_id: string; source_ref: string }>;
  hard_cases: Array<{ case_id: string; object_id: string; failure_mode: string }>;
  hero_prop_cases: Array<{ case_id: string; object_id: string; role: 'hero_prop' }>;
  secondary_prop_cases: Array<{ case_id: string; object_id: string; role: 'secondary_prop' }>;
  background_object_cases: Array<{ case_id: string; object_id: string; role: 'background_object' }>;
}

const ANALYSIS = {
  object_reference_bank_binding:
    'Reference bank entries (suitcase_001, chair_014, lantern_001, wooden_crate_001) bind identity_signature and anchor_descriptors; recall rules require minimum anchor match against bank entries per batch.',
  object_similarity_binding:
    'object_similarity_v1 governs same_object_threshold=0.97 vs similarity_threshold=0.82; validation must not treat similar_object scores as identity lock.',
  object_variation_tolerance_binding:
    'variation_tolerance bands (strict/medium/loose) derive lock_strength independently from similarity score; evaluated separately from visual match.',
  object_role_binding:
    'object_role_v1 assigns hero_prop > scene_prop > environment_prop > background_furniture priority; role governs narrative lock weight and pass threshold tier.',
  object_traceability_binding:
    'traceability_signature links conditioning_map_ref and OBJECT_REFERENCE_BANK_SPECIFICATION for batch audit without GPU execution in this phase.',
} as const;

const OBJECT_VALIDATION_CONTRACT = {
  contract_id: 'object_identity_gpu_validation_v1',
  contract_version: '1.0',
  scope: 'Validation definition only — Validation Defined != Validation Executed.',
  binding_ref: OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  bank_spec_ref: OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
  dataset_ref: `${GPU_VALIDATION_DATASET_DIR}/object_identity-validation-dataset.json`,
  campaign_stage_ref: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  gpu_execution: 'false — protocol and dataset plan only; execution deferred to future GPU-enabled phase.',
  texture_match_note: 'Texture Match is part of Object Identity — texture_drift is a first-class object failure mode.',
} as const;

const SAME_OBJECT_CRITERIA = {
  same_object: 'Score >= 0.97 required for same-object identity lock certification.',
  identity_signature_match: 'Exact object_id or identity_signature hash match with reference_bank_match_score >= 0.97.',
  texture_match: 'Texture consistency contributes to same_object score; texture_drift below minor_drift triggers degradation review.',
  assessment_note: 'Object Defined != Object Preserved.',
} as const;

const OBJECT_DRIFT_LEVELS: ObjectDriftLevels = {
  same_object: 0.97,
  strict_object: 0.95,
  similar_object: 0.8,
  different_object: 0.5,
};

const OBJECT_DEGRADATION_LEVELS: ObjectDegradationLevels = {
  minor_drift: 0.85,
  moderate_drift: 0.7,
  critical_drift: 0.5,
};

const OBJECT_ROLE_THRESHOLDS: ObjectRoleThresholds = {
  hero_prop: 0.98,
  secondary_prop: 0.9,
  background_object: 0.75,
};

const OBJECT_IDENTITY_TIERS: ObjectIdentityTier[] = [
  {
    tier_id: 'hero_prop_strict',
    role: 'hero_prop',
    pass_threshold: 0.98,
    identity_level: 'strict',
    note: 'Hero Prop Defined != Hero Prop Preserved — suitcase_001 and narrative-critical props require highest lock.',
  },
  {
    tier_id: 'secondary_prop_medium',
    role: 'secondary_prop',
    pass_threshold: 0.9,
    identity_level: 'medium',
    note: 'Maps to scene_prop and environment_prop roles in object_role_v1 binding.',
  },
  {
    tier_id: 'background_object_loose',
    role: 'background_object',
    pass_threshold: 0.75,
    identity_level: 'loose',
    note: 'Maps to background_furniture role; permits higher variation within band.',
  },
];

const OBJECT_FAILURE_CRITERIA = {
  identity_embedding_drift: 'Generated object embedding diverges from identity_signature beyond strict_object threshold.',
  role_weight_ignored: 'Hero prop lock weight ignored; role_threshold not applied during conditioning.',
  variation_tolerance_exceeded: 'Output drift exceeds variation_tolerance band for bound identity_level.',
  texture_drift: 'Surface texture diverges from reference anchor; contributes to object identity score degradation.',
  missing_accessory: 'Hard-tier failure: attached accessory absent from generated object.',
  shape_change: 'Hard-tier failure: silhouette or geometry inconsistent with reference bank.',
  identity_swap: 'Hard-tier failure: wrong object_id rendered in hero prop slot.',
  hallucinated_object: 'Hard-tier failure: object not present in reference bank.',
} as const;

const OBJECT_FAILURE_EXAMPLES = [
  'missing_accessory',
  'shape_change',
  'identity_swap',
  'hallucinated_object',
  'texture_drift',
] as const;

const REFERENCE_BANK_RECALL_RULES = {
  required_reference_count: 4,
  minimum_anchor_match: 2,
  recall_method:
    'Match generated object anchors against reference bank anchor_descriptors; count kind+importance matches >= minimum_anchor_match across required_reference_count bank entries per batch.',
};

const PROTOCOL_TIERS: ObjectProtocolTier[] = [
  {
    difficulty_tier: 'easy',
    measurement_method: ['identity_signature_match_score', 'texture_match_score'],
    pass_threshold: 0.97,
    failure_examples: ['minor_texture_drift'],
    object_failure_examples: ['texture_drift'],
    reference_bank_recall_rules: {
      required_reference_count: 4,
      minimum_anchor_match: 2,
    },
    exit_criteria: { pass_rate: 0.9, same_object_score: 0.97 },
  },
  {
    difficulty_tier: 'medium',
    measurement_method: ['identity_signature_match_score', 'variation_tolerance_band_score'],
    pass_threshold: 0.95,
    failure_examples: ['variation_tolerance_exceeded', 'identity_embedding_drift'],
    object_failure_examples: ['texture_drift', 'shape_change'],
    reference_bank_recall_rules: {
      required_reference_count: 4,
      minimum_anchor_match: 2,
    },
    exit_criteria: { pass_rate: 0.85, same_object_score: 0.95 },
  },
  {
    difficulty_tier: 'hard',
    measurement_method: ['identity_signature_match_score', 'role_weight_score', 'texture_match_score'],
    pass_threshold: 0.93,
    failure_examples: ['role_weight_ignored', 'identity_swap'],
    object_failure_examples: [...OBJECT_FAILURE_EXAMPLES],
    reference_bank_recall_rules: {
      required_reference_count: 4,
      minimum_anchor_match: 2,
    },
    exit_criteria: { pass_rate: 0.78, same_object_score: 0.93 },
  },
];

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildDatasetPlan(): ObjectIdentityGpuValidationDatasetPlan {
  return {
    report_id: `object_identity_gpu_dataset_plan_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    dataset_plan_defined: true,
    minimum_batch_size: MINIMUM_BATCH_SIZE,
    easy_cases: [
      { case_id: 'obj_gpu_easy_001', object_id: 'lantern_001', source_ref: 'obj_ref_003' },
      { case_id: 'obj_gpu_easy_002', object_id: 'wooden_crate_001', source_ref: 'obj_ref_004' },
    ],
    medium_cases: [
      { case_id: 'obj_gpu_med_001', object_id: 'chair_014', source_ref: 'obj_ref_002' },
      { case_id: 'obj_gpu_med_002', object_id: 'lantern_001', source_ref: 'obj_ref_003' },
    ],
    hard_cases: [
      { case_id: 'obj_gpu_hard_001', object_id: 'suitcase_001', failure_mode: 'identity_swap' },
      { case_id: 'obj_gpu_hard_002', object_id: 'suitcase_001', failure_mode: 'missing_accessory' },
      { case_id: 'obj_gpu_hard_003', object_id: 'suitcase_001', failure_mode: 'hallucinated_object' },
    ],
    hero_prop_cases: [
      { case_id: 'obj_gpu_hero_001', object_id: 'suitcase_001', role: 'hero_prop' },
    ],
    secondary_prop_cases: [
      { case_id: 'obj_gpu_sec_001', object_id: 'lantern_001', role: 'secondary_prop' },
      { case_id: 'obj_gpu_sec_002', object_id: 'wooden_crate_001', role: 'secondary_prop' },
    ],
    background_object_cases: [
      { case_id: 'obj_gpu_bg_001', object_id: 'chair_014', role: 'background_object' },
    ],
  };
}

function buildProtocol(): ObjectIdentityGpuValidationProtocol {
  return {
    protocol_id: 'object-identity-gpu-validation-protocol-v1',
    phase: OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    object_validation_defined: true,
    analysis: { ...ANALYSIS },
    object_validation_contract: { ...OBJECT_VALIDATION_CONTRACT },
    same_object_criteria: { ...SAME_OBJECT_CRITERIA },
    object_drift_levels: { ...OBJECT_DRIFT_LEVELS },
    object_degradation_levels: { ...OBJECT_DEGRADATION_LEVELS },
    object_failure_criteria: { ...OBJECT_FAILURE_CRITERIA },
    object_role_thresholds: { ...OBJECT_ROLE_THRESHOLDS },
    object_identity_tiers: OBJECT_IDENTITY_TIERS.map((tier) => ({ ...tier })),
    object_failure_examples: [...OBJECT_FAILURE_EXAMPLES],
    tiers: PROTOCOL_TIERS.map((tier) => ({
      ...tier,
      object_failure_examples: [...tier.object_failure_examples],
      reference_bank_recall_rules: { ...tier.reference_bank_recall_rules },
      exit_criteria: { ...tier.exit_criteria },
    })),
    reference_bank_recall_rules: { ...REFERENCE_BANK_RECALL_RULES },
  };
}

export function runObjectIdentityGpuValidationDefinition(
  projectRoot?: string
): ObjectIdentityGpuValidationReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: ObjectIdentityGpuValidationReadiness['issues'] = [];

  const prerequisitePaths = [
    OBJECT_IDENTITY_GPU_VALIDATION_REGISTRY_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
    OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
    GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    `${GPU_VALIDATION_DATASET_DIR}/object_identity-validation-dataset.json`,
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

  const object_validation_defined = protocol.object_validation_defined === true;
  const same_object_criteria_defined =
    Object.keys(protocol.same_object_criteria).length > 0 &&
    protocol.object_drift_levels.same_object === 0.97;
  const drift_levels_defined =
    protocol.object_drift_levels.same_object === 0.97 &&
    protocol.object_drift_levels.strict_object === 0.95 &&
    protocol.object_drift_levels.similar_object === 0.8 &&
    protocol.object_drift_levels.different_object === 0.5;
  const degradation_levels_defined =
    protocol.object_degradation_levels.minor_drift === 0.85 &&
    protocol.object_degradation_levels.moderate_drift === 0.7 &&
    protocol.object_degradation_levels.critical_drift === 0.5;
  const object_identity_tiers_defined =
    protocol.object_identity_tiers.length === 3 &&
    protocol.object_identity_tiers.every((tier) => tier.pass_threshold > 0);
  const failure_criteria_defined =
    Object.keys(protocol.object_failure_criteria).length > 0 &&
    protocol.tiers.every((tier) => tier.failure_examples.length > 0);
  const role_thresholds_defined =
    protocol.object_role_thresholds.hero_prop === 0.98 &&
    protocol.object_role_thresholds.secondary_prop === 0.9 &&
    protocol.object_role_thresholds.background_object === 0.75;
  const object_failure_examples_defined =
    protocol.object_failure_examples.length === OBJECT_FAILURE_EXAMPLES.length &&
    OBJECT_FAILURE_EXAMPLES.every((example) => protocol.object_failure_examples.includes(example));
  const dataset_plan_defined =
    datasetPlan.dataset_plan_defined === true &&
    datasetPlan.easy_cases.length > 0 &&
    datasetPlan.medium_cases.length > 0 &&
    datasetPlan.hard_cases.length > 0 &&
    datasetPlan.hero_prop_cases.length > 0 &&
    datasetPlan.secondary_prop_cases.length > 0 &&
    datasetPlan.background_object_cases.length > 0 &&
    datasetPlan.minimum_batch_size === MINIMUM_BATCH_SIZE;

  const expected_pass_rate = {
    easy: 0.75,
    medium: 0.45,
    hard: 0.25,
  };
  const hero_prop_expected_pass_rate = 0.2;
  const expected_pass_rate_defined =
    typeof expected_pass_rate.easy === 'number' &&
    typeof expected_pass_rate.medium === 'number' &&
    typeof expected_pass_rate.hard === 'number';
  const hero_prop_expected_pass_rate_defined = hero_prop_expected_pass_rate === 0.2;

  const validation_ready = object_validation_defined && dataset_plan_defined;
  const readiness_defined =
    validation_ready &&
    expected_pass_rate_defined &&
    hero_prop_expected_pass_rate_defined &&
    object_failure_examples_defined &&
    object_identity_tiers_defined &&
    role_thresholds_defined;

  const hardTier = protocol.tiers.find((tier) => tier.difficulty_tier === 'hard');

  if (!hardTier) {
    issues.push({ code: 'HARD_TIER', message: 'hard difficulty tier required', severity: 'error' });
  }
  if (!object_failure_examples_defined) {
    issues.push({
      code: 'OBJECT_FAILURE',
      message: 'object_failure_examples must include all required examples',
      severity: 'error',
    });
  }
  if (!object_identity_tiers_defined) {
    issues.push({
      code: 'IDENTITY_TIERS',
      message: 'object_identity_tiers must be defined',
      severity: 'error',
    });
  }
  if (!role_thresholds_defined) {
    issues.push({
      code: 'ROLE_THRESHOLDS',
      message: 'object_role_thresholds must be defined',
      severity: 'error',
    });
  }
  if (!drift_levels_defined) {
    issues.push({ code: 'DRIFT_LEVELS', message: 'object_drift_levels must be defined', severity: 'error' });
  }
  if (!degradation_levels_defined) {
    issues.push({
      code: 'DEGRADATION_LEVELS',
      message: 'object_degradation_levels must be defined',
      severity: 'error',
    });
  }
  if (!dataset_plan_defined) {
    issues.push({ code: 'DATASET_PLAN', message: 'dataset_plan must be defined', severity: 'error' });
  }
  if (!readiness_defined) {
    issues.push({ code: 'READINESS', message: 'readiness must be defined', severity: 'error' });
  }

  const validation_passed =
    object_validation_defined &&
    same_object_criteria_defined &&
    drift_levels_defined &&
    degradation_levels_defined &&
    object_identity_tiers_defined &&
    failure_criteria_defined &&
    role_thresholds_defined &&
    object_failure_examples_defined &&
    dataset_plan_defined &&
    expected_pass_rate_defined &&
    hero_prop_expected_pass_rate_defined &&
    readiness_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readiness: ObjectIdentityGpuValidationReadiness = {
    report_id: `object_identity_gpu_readiness_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
    system_id: OBJECT_IDENTITY_GPU_VALIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT
      : OBJECT_IDENTITY_GPU_VALIDATION_FAIL_VERDICT,
    status: validation_passed
      ? OBJECT_IDENTITY_GPU_VALIDATION_STATUS
      : 'OBJECT_GPU_VALIDATION_NOT_DEFINED',
    validation_passed,
    object_validation_defined,
    same_object_criteria_defined,
    drift_levels_defined,
    degradation_levels_defined,
    object_identity_tiers_defined,
    failure_criteria_defined,
    role_thresholds_defined,
    object_failure_examples_defined,
    dataset_plan_defined,
    expected_pass_rate_defined,
    hero_prop_expected_pass_rate_defined,
    readiness_defined,
    object_identity_validated: false,
    gpu_validation_executed: false,
    conditioning_ready: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    validation_ready,
    execution_ready: false,
    blocking_factors: [
      'gpu_execution disabled in validation definition phase',
      'object_identity map not exported with populated payload',
      'IP-Adapter object reference nodes not connected',
      'anchor_images are metadata placeholders only',
      'Validation Defined != Validation Executed',
    ],
    highest_risk_area: 'hero_prop_identity',
    expected_pass_rate,
    hero_prop_expected_pass_rate,
    checks: {
      object_validation_defined,
      same_object_criteria_defined,
      drift_levels_defined,
      degradation_levels_defined,
      object_identity_tiers_defined,
      failure_criteria_defined,
      role_thresholds_defined,
      object_failure_examples_defined,
      dataset_plan_defined,
      expected_pass_rate_defined,
      hero_prop_expected_pass_rate_defined,
      readiness_defined,
      hard_tier_present: Boolean(hardTier),
      execution_ready_false: true,
      object_identity_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, OBJECT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH, protocol);
  writeJson(root, OBJECT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH, datasetPlan);
  writeJson(root, OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH, readiness);

  return readiness;
}

export function writeObjectIdentityGpuValidationReport(
  projectRoot?: string
): ObjectIdentityGpuValidationReadiness {
  return runObjectIdentityGpuValidationDefinition(projectRoot);
}
