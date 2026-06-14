import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
} from './environmentIdentityGpuValidation.js';
import { ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH } from './environmentIdentityBinding.js';
import { ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH } from './environmentIdentityStrategy.js';

export const ENVIRONMENT_IDENTITY_EVIDENCE_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-006A' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID =
  'ENVIRONMENT_IDENTITY_EVIDENCE_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT =
  'PASS_ENVIRONMENT_IDENTITY_EVIDENCE_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_FAIL_VERDICT =
  'FAIL_ENVIRONMENT_IDENTITY_EVIDENCE_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_STATUS =
  'ENVIRONMENT_EVIDENCE_DEFINED' as const;

export const ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_DIR =
  'datasets/gpu_validation_environment_identity_evidence' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_REGISTRY_PATH =
  `${ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_DIR}/environment-identity-evidence-registry.json` as const;

export const ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL.json' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_DATASET.json' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_READINESS.json' as const;

const MINIMUM_BATCH_SIZE = 50;

const EXECUTION_FLAGS = {
  evidence_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

export interface EnvironmentEvidenceLevel {
  level_id: string;
  min_traceability_score: number;
  note: string;
}

export interface EnvironmentEvidenceRecordTemplate {
  environment_id: string;
  reference_bank_id: string;
  retrieval_signature: string;
  traceability_score: number;
}

export interface EnvironmentIdentityEvidenceProtocol {
  protocol_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  evidence_defined: true;
  analysis: {
    environment_validation_protocol: string;
    environment_dataset_plan: string;
    environment_reference_bank: string;
    environment_similarity_binding: string;
  };
  evidence_collection_contract: Record<string, string>;
  evidence_measurement_rules: Record<string, string>;
  evidence_scoring_rules: Record<string, string>;
  environment_evidence_levels: EnvironmentEvidenceLevel[];
  evidence_traceability_rules: Record<string, string>;
  measurement_method: string[];
  pass_threshold: number;
  evidence_score: {
    composite_formula: string;
    reference_bank_match_weight: number;
    traceability_weight: number;
    anchor_recall_weight: number;
  };
  failure_examples: string[];
  false_positive_examples: string[];
  false_negative_examples: string[];
  reference_bank_recall_rules: {
    required_reference_count: number;
    minimum_anchor_match: number;
    recall_method: string;
  };
  example_evidence_record: EnvironmentEvidenceRecordTemplate;
}

export interface EnvironmentIdentityEvidenceDataset {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  dataset_defined: true;
  minimum_batch_size: number;
  easy_batch: Array<{ case_id: string; environment_id: string; reference_bank_id: string }>;
  medium_batch: Array<{ case_id: string; environment_id: string; reference_bank_id: string }>;
  hard_batch: Array<{ case_id: string; environment_id: string; failure_mode: string }>;
  stress_batch: Array<{ case_id: string; environment_id: string; stress_mode: string }>;
}

export interface EnvironmentIdentityEvidenceReadiness {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ENVIRONMENT_IDENTITY_EVIDENCE_STATUS
    | 'ENVIRONMENT_EVIDENCE_NOT_DEFINED';
  validation_passed: boolean;
  evidence_contract_defined: boolean;
  measurement_rules_defined: boolean;
  scoring_rules_defined: boolean;
  traceability_rules_defined: boolean;
  false_positive_examples_defined: boolean;
  false_negative_examples_defined: boolean;
  stress_batch_defined: boolean;
  dataset_defined: boolean;
  readiness_defined: boolean;
  evidence_collection_ready: boolean;
  execution_ready: false;
  evidence_sufficient_for_gpu_authorization: false;
  environment_validated: false;
  gpu_validation_executed: false;
  movie_reconstruction_ready: false;
  gpu_ready: false;
  highest_risk_area: string;
  expected_pass_rate: {
    easy: number;
    medium: number;
    hard: number;
    stress: number;
  };
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const ANALYSIS = {
  environment_validation_protocol:
    'ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL defines same_environment=0.98, reference_bank recall rules, and tier pass thresholds; evidence collection binds measurable scores to those criteria without GPU execution.',
  environment_dataset_plan:
    'ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN provides easy/medium/hard case seeds; evidence dataset extends with stress_batch for camera and lighting perturbations.',
  environment_reference_bank:
    'Four bank entries (titanic_staircase_001, ghibli_kitchen_001, gonegi_harbor_dock_001, mori_forest_clearing_001) supply reference_bank_id, retrieval_signature, and traceability_score targets per evidence record.',
  environment_similarity_binding:
    'environment_similarity_v1 same_environment_threshold=0.98 governs evidence scoring; similar_environment scores must not be classified as definitive evidence.',
} as const;

const EVIDENCE_COLLECTION_CONTRACT = {
  contract_id: 'environment_identity_evidence_v1',
  contract_version: '1.0',
  scope: 'Evidence definition only — Evidence Defined != Evidence Collected.',
  validation_protocol_ref: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
  dataset_plan_ref: ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
  binding_ref: ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
  bank_spec_ref: ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
  gpu_execution: 'false — evidence protocol and dataset only; collection deferred.',
  gpu_authorization: 'false — evidence_sufficient_for_gpu_authorization must remain false until execution phase.',
  assessment_note: 'Evidence Collected != Environment Validated; Environment Validated != Movie Reconstruction Ready.',
} as const;

const EVIDENCE_MEASUREMENT_RULES = {
  reference_bank_match_score: 'Primary measurement from layout_signature and anchor descriptor recall against reference bank.',
  environment_traceability_score: 'Traceability signature match against conditioning_map_ref and bank spec path.',
  anchor_recall_score: 'Count of anchor_descriptors kind+importance matches >= minimum_anchor_match.',
  retrieval_signature_match: 'Hash equality on environment_retrieval_v1 primary_key lookup path.',
  measurement_note: 'All measurements are schema-defined; no GPU raster comparison in this phase.',
} as const;

const EVIDENCE_SCORING_RULES = {
  composite_evidence_score:
    'weighted_sum(reference_bank_match_score * 0.45, traceability_score * 0.35, anchor_recall_score * 0.20)',
  pass_threshold: 'composite_evidence_score >= 0.98 required for definitive same-environment evidence tier.',
  false_positive_penalty: 'Scores above pass_threshold on different_environment cases trigger false_positive audit.',
  false_negative_tolerance: 'same_staircase_with_lighting_variation permitted within strict_environment band [0.95, 0.98).',
  texture_included: 'Layout and anchor texture consistency contributes to reference_bank_match_score component.',
} as const;

const ENVIRONMENT_EVIDENCE_LEVELS: EnvironmentEvidenceLevel[] = [
  {
    level_id: 'definitive',
    min_traceability_score: 0.97,
    note: 'Same environment evidence; traceability_score >= 0.97 with reference_bank_match >= 0.98.',
  },
  {
    level_id: 'strong',
    min_traceability_score: 0.95,
    note: 'Strict environment band; sufficient for anchor tuning review but not identity lock.',
  },
  {
    level_id: 'weak',
    min_traceability_score: 0.85,
    note: 'Similar environment band; logged for degradation path only.',
  },
  {
    level_id: 'insufficient',
    min_traceability_score: 0,
    note: 'Below similar_environment threshold; evidence record rejected.',
  },
];

const EVIDENCE_TRACEABILITY_RULES = {
  traceability_signature: 'Must bind environment_id, reference_bank_id, conditioning_map_ref, and bank_spec_ref.',
  retrieval_signature: 'Hash of environment_retrieval_v1 lookup path for audit replay without GPU execution.',
  batch_audit_path: 'Evidence records written to ENVIRONMENT_IDENTITY_EVIDENCE_DATASET.json batches for offline review.',
  cross_ref_integrity: 'reference_bank_id must resolve to bank spec entry; mismatch triggers traceability failure.',
  evidence_layer_note: 'Evidence Defined != Evidence Collected.',
} as const;

const FALSE_POSITIVE_EXAMPLES = [
  'different_staircase_but_similar_architecture',
  'shared_style_different_layout',
  'hallucinated_railing_on_wrong_staircase',
] as const;

const FALSE_NEGATIVE_EXAMPLES = [
  'same_staircase_with_lighting_variation',
  'same_kitchen_with_color_grade_shift',
  'anchor_occlusion_but_identity_preserved',
] as const;

const FAILURE_EXAMPLES = [
  'different_staircase',
  'missing_railing',
  'hallucinated_architecture',
  'reference_drift',
  'geometry_mismatch',
] as const;

const REFERENCE_BANK_RECALL_RULES = {
  required_reference_count: 5,
  minimum_anchor_match: 3,
  recall_method:
    'Match evidence record anchors against reference bank anchor_descriptors; count kind+importance matches >= minimum_anchor_match.',
};

const EXAMPLE_EVIDENCE_RECORD: EnvironmentEvidenceRecordTemplate = {
  environment_id: 'titanic_staircase_001',
  reference_bank_id: 'env_ref_001',
  retrieval_signature: 'env_retrieval_v1:titanic_staircase_001:layout_sig_a1b2c3',
  traceability_score: 0.97,
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildProtocol(): EnvironmentIdentityEvidenceProtocol {
  return {
    protocol_id: 'environment-identity-evidence-protocol-v1',
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    evidence_defined: true,
    analysis: { ...ANALYSIS },
    evidence_collection_contract: { ...EVIDENCE_COLLECTION_CONTRACT },
    evidence_measurement_rules: { ...EVIDENCE_MEASUREMENT_RULES },
    evidence_scoring_rules: { ...EVIDENCE_SCORING_RULES },
    environment_evidence_levels: ENVIRONMENT_EVIDENCE_LEVELS.map((level) => ({ ...level })),
    evidence_traceability_rules: { ...EVIDENCE_TRACEABILITY_RULES },
    measurement_method: [
      'reference_bank_match_score',
      'environment_traceability_score',
      'anchor_recall_score',
      'retrieval_signature_match',
    ],
    pass_threshold: 0.98,
    evidence_score: {
      composite_formula:
        '0.45 * reference_bank_match_score + 0.35 * traceability_score + 0.20 * anchor_recall_score',
      reference_bank_match_weight: 0.45,
      traceability_weight: 0.35,
      anchor_recall_weight: 0.2,
    },
    failure_examples: [...FAILURE_EXAMPLES],
    false_positive_examples: [...FALSE_POSITIVE_EXAMPLES],
    false_negative_examples: [...FALSE_NEGATIVE_EXAMPLES],
    reference_bank_recall_rules: { ...REFERENCE_BANK_RECALL_RULES },
    example_evidence_record: { ...EXAMPLE_EVIDENCE_RECORD },
  };
}

function buildDataset(): EnvironmentIdentityEvidenceDataset {
  return {
    report_id: `environment_identity_evidence_dataset_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    dataset_defined: true,
    minimum_batch_size: MINIMUM_BATCH_SIZE,
    easy_batch: [
      { case_id: 'env_ev_easy_001', environment_id: 'titanic_staircase_001', reference_bank_id: 'env_ref_001' },
      { case_id: 'env_ev_easy_002', environment_id: 'ghibli_kitchen_001', reference_bank_id: 'env_ref_002' },
    ],
    medium_batch: [
      { case_id: 'env_ev_med_001', environment_id: 'gonegi_harbor_dock_001', reference_bank_id: 'env_ref_003' },
      { case_id: 'env_ev_med_002', environment_id: 'mori_forest_clearing_001', reference_bank_id: 'env_ref_004' },
    ],
    hard_batch: [
      { case_id: 'env_ev_hard_001', environment_id: 'titanic_staircase_001', failure_mode: 'different_staircase' },
      { case_id: 'env_ev_hard_002', environment_id: 'titanic_staircase_001', failure_mode: 'missing_railing' },
      { case_id: 'env_ev_hard_003', environment_id: 'ghibli_kitchen_001', failure_mode: 'hallucinated_architecture' },
    ],
    stress_batch: [
      { case_id: 'env_ev_stress_001', environment_id: 'titanic_staircase_001', stress_mode: 'extreme_camera_rotation' },
      { case_id: 'env_ev_stress_002', environment_id: 'titanic_staircase_001', stress_mode: 'extreme_zoom_change' },
      { case_id: 'env_ev_stress_003', environment_id: 'ghibli_kitchen_001', stress_mode: 'lighting_shift' },
    ],
  };
}

export function runEnvironmentIdentityEvidenceDefinition(
  projectRoot?: string
): EnvironmentIdentityEvidenceReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: EnvironmentIdentityEvidenceReadiness['issues'] = [];

  const prerequisitePaths = [
    ENVIRONMENT_IDENTITY_EVIDENCE_REGISTRY_PATH,
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_PROTOCOL_PATH,
    ENVIRONMENT_IDENTITY_GPU_VALIDATION_DATASET_PLAN_PATH,
    ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
    ENVIRONMENT_IDENTITY_BINDING_PACKAGE_PATH,
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
  const dataset = buildDataset();

  const evidence_contract_defined =
    protocol.evidence_defined === true &&
    Object.keys(protocol.evidence_collection_contract).length > 0;
  const measurement_rules_defined =
    Object.keys(protocol.evidence_measurement_rules).length > 0 &&
    protocol.measurement_method.length > 0;
  const scoring_rules_defined =
    Object.keys(protocol.evidence_scoring_rules).length > 0 &&
    protocol.pass_threshold === 0.98 &&
    protocol.evidence_score.reference_bank_match_weight > 0;
  const traceability_rules_defined =
    Object.keys(protocol.evidence_traceability_rules).length > 0 &&
    protocol.environment_evidence_levels.length >= 4;
  const false_positive_examples_defined =
    protocol.false_positive_examples.length > 0 &&
    protocol.false_positive_examples.includes('different_staircase_but_similar_architecture');
  const false_negative_examples_defined =
    protocol.false_negative_examples.length > 0 &&
    protocol.false_negative_examples.includes('same_staircase_with_lighting_variation');
  const stress_batch_defined =
    dataset.stress_batch.length > 0 &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'extreme_camera_rotation') &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'extreme_zoom_change') &&
    dataset.stress_batch.some((entry) => entry.stress_mode === 'lighting_shift');
  const dataset_defined =
    dataset.dataset_defined === true &&
    dataset.easy_batch.length > 0 &&
    dataset.medium_batch.length > 0 &&
    dataset.hard_batch.length > 0 &&
    dataset.minimum_batch_size === MINIMUM_BATCH_SIZE;

  const expected_pass_rate = {
    easy: 0.85,
    medium: 0.55,
    hard: 0.15,
    stress: 0.1,
  };

  const evidence_collection_ready =
    evidence_contract_defined &&
    measurement_rules_defined &&
    scoring_rules_defined &&
    dataset_defined;
  const readiness_defined =
    evidence_collection_ready &&
    traceability_rules_defined &&
    false_positive_examples_defined &&
    false_negative_examples_defined &&
    stress_batch_defined;

  if (!evidence_contract_defined) {
    issues.push({ code: 'EVIDENCE_CONTRACT', message: 'evidence_collection_contract required', severity: 'error' });
  }
  if (!measurement_rules_defined) {
    issues.push({ code: 'MEASUREMENT_RULES', message: 'evidence_measurement_rules required', severity: 'error' });
  }
  if (!scoring_rules_defined) {
    issues.push({ code: 'SCORING_RULES', message: 'evidence_scoring_rules required', severity: 'error' });
  }
  if (!traceability_rules_defined) {
    issues.push({ code: 'TRACEABILITY_RULES', message: 'evidence_traceability_rules required', severity: 'error' });
  }
  if (!false_positive_examples_defined) {
    issues.push({ code: 'FALSE_POSITIVE', message: 'false_positive_examples required', severity: 'error' });
  }
  if (!false_negative_examples_defined) {
    issues.push({ code: 'FALSE_NEGATIVE', message: 'false_negative_examples required', severity: 'error' });
  }
  if (!stress_batch_defined) {
    issues.push({ code: 'STRESS_BATCH', message: 'stress_batch required', severity: 'error' });
  }
  if (!dataset_defined) {
    issues.push({ code: 'DATASET', message: 'evidence dataset required', severity: 'error' });
  }
  if (!readiness_defined) {
    issues.push({ code: 'READINESS', message: 'readiness must be defined', severity: 'error' });
  }

  const validation_passed =
    evidence_contract_defined &&
    measurement_rules_defined &&
    scoring_rules_defined &&
    traceability_rules_defined &&
    false_positive_examples_defined &&
    false_negative_examples_defined &&
    stress_batch_defined &&
    dataset_defined &&
    readiness_defined &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const readiness: EnvironmentIdentityEvidenceReadiness = {
    report_id: `environment_identity_evidence_readiness_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT
      : ENVIRONMENT_IDENTITY_EVIDENCE_FAIL_VERDICT,
    status: validation_passed
      ? ENVIRONMENT_IDENTITY_EVIDENCE_STATUS
      : 'ENVIRONMENT_EVIDENCE_NOT_DEFINED',
    validation_passed,
    evidence_contract_defined,
    measurement_rules_defined,
    scoring_rules_defined,
    traceability_rules_defined,
    false_positive_examples_defined,
    false_negative_examples_defined,
    stress_batch_defined,
    dataset_defined,
    readiness_defined,
    evidence_collection_ready,
    execution_ready: false,
    evidence_sufficient_for_gpu_authorization: false,
    environment_validated: false,
    gpu_validation_executed: false,
    movie_reconstruction_ready: false,
    gpu_ready: false,
    highest_risk_area: 'reference_drift under stress_batch camera perturbations',
    expected_pass_rate,
    checks: {
      evidence_contract_defined,
      measurement_rules_defined,
      scoring_rules_defined,
      traceability_rules_defined,
      false_positive_examples_defined,
      false_negative_examples_defined,
      stress_batch_defined,
      dataset_defined,
      readiness_defined,
      evidence_collection_ready,
      evidence_sufficient_for_gpu_authorization_false: true,
      execution_ready_false: true,
      environment_validated_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH, protocol);
  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH, dataset);
  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH, readiness);

  return readiness;
}

export function writeEnvironmentIdentityEvidenceReport(
  projectRoot?: string
): EnvironmentIdentityEvidenceReadiness {
  return runEnvironmentIdentityEvidenceDefinition(projectRoot);
}
