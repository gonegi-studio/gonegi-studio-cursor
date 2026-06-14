import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
} from './environmentIdentityEvidence.js';
import { ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH } from './environmentIdentityStrategy.js';

export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-007A' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID =
  'ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT =
  'PASS_ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_FAIL_VERDICT =
  'FAIL_ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS =
  'ENVIRONMENT_EVIDENCE_COLLECTION_READY' as const;

export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_DATASET_DIR =
  'datasets/gpu_validation_environment_identity_evidence_collection' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_REGISTRY_PATH =
  `${ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_DATASET_DIR}/environment-identity-evidence-collection-registry.json` as const;

export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN.json' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC.json' as const;
export const ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH =
  'reports/movie_reconstruction/ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS.json' as const;

const TARGET_SAMPLE_COUNT = 50;
const EVIDENCE_COLLECTION_MODE = 'DEFINITION_ONLY' as const;

const EXECUTION_FLAGS = {
  collection_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const ENVIRONMENT_CLASSIFICATIONS = [
  'same_environment',
  'strict_environment',
  'similar_environment',
  'different_environment',
] as const;

const CLASSIFICATION_REASONS = [
  'layout_signature_match',
  'anchor_match',
  'reference_bank_match',
] as const;

export interface EnvironmentIdentityEvidenceCollectionPlan {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  batch_plan_defined: true;
  target_sample_count: number;
  collection_order: string[];
  easy_batch: Array<{ case_id: string; environment_id: string; reference_bank_id: string }>;
  medium_batch: Array<{ case_id: string; environment_id: string; reference_bank_id: string }>;
  hard_batch: Array<{ case_id: string; environment_id: string; failure_mode: string }>;
  stress_batch: Array<{ case_id: string; environment_id: string; stress_mode: string }>;
  identity_break_batch: Array<{ case_id: string; environment_id: string; break_mode: string }>;
}

export interface EnvironmentIdentityEvidenceRecordSpec {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  record_spec_defined: true;
  environment_evidence_record_format: Record<string, string>;
  required_fields: string[];
  environment_classification: typeof ENVIRONMENT_CLASSIFICATIONS[number][];
  classification_reason: typeof CLASSIFICATION_REASONS[number][];
  classification_thresholds: {
    same_environment: number;
    strict_environment: number;
    similar_environment: number;
    different_environment: number;
  };
  example_record: {
    environment_id: string;
    reference_bank_id: string;
    retrieval_signature: string;
    evidence_score: number;
    traceability_score: number;
    environment_classification: typeof ENVIRONMENT_CLASSIFICATIONS[number];
    classification_reason: typeof CLASSIFICATION_REASONS[number];
  };
}

export interface EnvironmentIdentityEvidenceCollectionReadiness {
  report_id: string;
  phase: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS
    | 'ENVIRONMENT_EVIDENCE_COLLECTION_NOT_READY';
  validation_passed: boolean;
  collection_contract_defined: boolean;
  batch_plan_defined: boolean;
  identity_break_batch_defined: boolean;
  record_spec_defined: boolean;
  classification_reason_defined: boolean;
  traceability_rules_defined: boolean;
  collection_ready: boolean;
  collection_executed: false;
  validation_ready: false;
  gpu_authorization_ready: false;
  evidence_collection_mode: typeof EVIDENCE_COLLECTION_MODE;
  expected_collection_size: number;
  evidence_records_generated: 0;
  environment_evidence_collected: false;
  gpu_validation_executed: false;
  environment_validated: false;
  gpu_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const ANALYSIS = {
  environment_evidence_protocol:
    'ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL defines composite scoring, pass_threshold=0.98, and reference_bank recall rules; collection plan binds batch execution order without generating records in this phase.',
  environment_dataset:
    'ENVIRONMENT_IDENTITY_EVIDENCE_DATASET provides easy/medium/hard/stress batch seeds; collection plan adds identity_break_batch for boundary classification cases.',
  environment_reference_bank:
    'Four bank entries supply reference_bank_id and retrieval_signature templates per evidence record; no raster anchors populated.',
  environment_similarity_rules:
    'environment_similarity_v1 same_environment_threshold=0.98 governs environment_classification assignment in record spec.',
} as const;

const EVIDENCE_COLLECTION_CONTRACT = {
  contract_id: 'environment_identity_evidence_collection_v1',
  contract_version: '1.0',
  scope: 'Collection execution definition only — Collection Ready != Collection Executed.',
  evidence_protocol_ref: ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  evidence_dataset_ref: ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH,
  bank_spec_ref: ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
  evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
  gpu_execution: 'false — collection plan and record spec only; no evidence records generated.',
  assessment_note: 'Evidence Records Generated = 0; do NOT claim ENVIRONMENT_EVIDENCE_COLLECTED.',
} as const;

const COLLECTION_BATCH_PLAN = {
  collection_order: 'easy_batch → medium_batch → hard_batch → stress_batch → identity_break_batch',
  target_sample_count: String(TARGET_SAMPLE_COUNT),
  batch_note: 'Sequential collection order; identity_break_batch runs last for classification boundary audit.',
} as const;

const COLLECTION_TRACEABILITY_RULES = {
  record_traceability: 'Each evidence record must bind environment_id, reference_bank_id, retrieval_signature, and traceability_score.',
  batch_audit_signature: 'Collection batch_id hashes case_id list for offline replay without GPU execution.',
  classification_audit: 'environment_classification and classification_reason required on every record at collection time.',
  cross_ref_integrity: 'reference_bank_id must resolve to bank spec; mismatch rejects record at validation.',
  collection_note: 'Collection Ready != Collection Executed.',
} as const;

const ENVIRONMENT_EVIDENCE_RECORD_FORMAT = {
  environment_id: 'Target environment_id from reference bank.',
  reference_bank_id: 'Bank entry reference_bank_id for recall audit.',
  retrieval_signature: 'Hash from environment_retrieval_v1 lookup path.',
  evidence_score: 'Composite score from evidence_scoring_rules weighted formula.',
  traceability_score: 'Traceability signature match score against conditioning_map_ref.',
  environment_classification: 'Enum: same_environment | strict_environment | similar_environment | different_environment.',
  classification_reason: 'Enum: layout_signature_match | anchor_match | reference_bank_match.',
} as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildCollectionPlan(): EnvironmentIdentityEvidenceCollectionPlan {
  return {
    report_id: `environment_evidence_collection_plan_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    batch_plan_defined: true,
    target_sample_count: TARGET_SAMPLE_COUNT,
    collection_order: [
      'easy_batch',
      'medium_batch',
      'hard_batch',
      'stress_batch',
      'identity_break_batch',
    ],
    easy_batch: [
      { case_id: 'env_col_easy_001', environment_id: 'titanic_staircase_001', reference_bank_id: 'env_ref_001' },
      { case_id: 'env_col_easy_002', environment_id: 'ghibli_kitchen_001', reference_bank_id: 'env_ref_002' },
    ],
    medium_batch: [
      { case_id: 'env_col_med_001', environment_id: 'gonegi_harbor_dock_001', reference_bank_id: 'env_ref_003' },
      { case_id: 'env_col_med_002', environment_id: 'mori_forest_clearing_001', reference_bank_id: 'env_ref_004' },
    ],
    hard_batch: [
      { case_id: 'env_col_hard_001', environment_id: 'titanic_staircase_001', failure_mode: 'different_staircase' },
      { case_id: 'env_col_hard_002', environment_id: 'titanic_staircase_001', failure_mode: 'missing_railing' },
    ],
    stress_batch: [
      { case_id: 'env_col_stress_001', environment_id: 'titanic_staircase_001', stress_mode: 'extreme_camera_rotation' },
      { case_id: 'env_col_stress_002', environment_id: 'ghibli_kitchen_001', stress_mode: 'extreme_zoom_change' },
      { case_id: 'env_col_stress_003', environment_id: 'ghibli_kitchen_001', stress_mode: 'lighting_shift' },
    ],
    identity_break_batch: [
      { case_id: 'env_col_break_001', environment_id: 'titanic_staircase_001', break_mode: 'extreme_camera_rotation' },
      { case_id: 'env_col_break_002', environment_id: 'titanic_staircase_001', break_mode: 'heavy_occlusion' },
      { case_id: 'env_col_break_003', environment_id: 'ghibli_kitchen_001', break_mode: 'major_lighting_shift' },
    ],
  };
}

function buildRecordSpec(): EnvironmentIdentityEvidenceRecordSpec {
  return {
    report_id: `environment_evidence_record_spec_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    record_spec_defined: true,
    environment_evidence_record_format: { ...ENVIRONMENT_EVIDENCE_RECORD_FORMAT },
    required_fields: [
      'environment_id',
      'reference_bank_id',
      'retrieval_signature',
      'evidence_score',
      'traceability_score',
      'environment_classification',
      'classification_reason',
    ],
    environment_classification: [...ENVIRONMENT_CLASSIFICATIONS],
    classification_reason: [...CLASSIFICATION_REASONS],
    classification_thresholds: {
      same_environment: 0.98,
      strict_environment: 0.95,
      similar_environment: 0.8,
      different_environment: 0.5,
    },
    example_record: {
      environment_id: 'titanic_staircase_001',
      reference_bank_id: 'env_ref_001',
      retrieval_signature: 'env_retrieval_v1:titanic_staircase_001:layout_sig_a1b2c3',
      evidence_score: 0.97,
      traceability_score: 0.96,
      environment_classification: 'strict_environment',
      classification_reason: 'layout_signature_match',
    },
  };
}

export function runEnvironmentIdentityEvidenceCollectionDefinition(
  projectRoot?: string
): EnvironmentIdentityEvidenceCollectionReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: EnvironmentIdentityEvidenceCollectionReadiness['issues'] = [];

  const prerequisitePaths = [
    ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_REGISTRY_PATH,
    ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
    ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH,
    ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
    ENVIRONMENT_REFERENCE_BANK_SPECIFICATION_PATH,
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

  const collectionPlan = buildCollectionPlan();
  const recordSpec = buildRecordSpec();

  const collection_contract_defined = Object.keys(EVIDENCE_COLLECTION_CONTRACT).length > 0;
  const batch_plan_defined =
    collectionPlan.batch_plan_defined === true &&
    collectionPlan.collection_order.length === 5 &&
    collectionPlan.target_sample_count === TARGET_SAMPLE_COUNT;
  const identity_break_batch_defined =
    collectionPlan.identity_break_batch.length > 0 &&
    collectionPlan.identity_break_batch.some((entry) => entry.break_mode === 'extreme_camera_rotation') &&
    collectionPlan.identity_break_batch.some((entry) => entry.break_mode === 'heavy_occlusion') &&
    collectionPlan.identity_break_batch.some((entry) => entry.break_mode === 'major_lighting_shift');
  const record_spec_defined = recordSpec.record_spec_defined === true;
  const classification_reason_defined =
    recordSpec.classification_reason.length === CLASSIFICATION_REASONS.length &&
    CLASSIFICATION_REASONS.every((reason) => recordSpec.classification_reason.includes(reason));
  const traceability_rules_defined =
    Object.keys(COLLECTION_TRACEABILITY_RULES).length > 0 &&
    recordSpec.required_fields.includes('traceability_score');

  const collection_ready =
    collection_contract_defined &&
    batch_plan_defined &&
    identity_break_batch_defined &&
    record_spec_defined &&
    traceability_rules_defined;

  if (!collection_contract_defined) {
    issues.push({ code: 'CONTRACT', message: 'evidence_collection_contract required', severity: 'error' });
  }
  if (!batch_plan_defined) {
    issues.push({ code: 'BATCH_PLAN', message: 'collection_batch_plan required', severity: 'error' });
  }
  if (!identity_break_batch_defined) {
    issues.push({ code: 'IDENTITY_BREAK', message: 'identity_break_batch required', severity: 'error' });
  }
  if (!record_spec_defined) {
    issues.push({ code: 'RECORD_SPEC', message: 'record spec required', severity: 'error' });
  }
  if (!classification_reason_defined) {
    issues.push({ code: 'CLASSIFICATION_REASON', message: 'classification_reason required', severity: 'error' });
  }
  if (!collection_ready) {
    issues.push({ code: 'COLLECTION_READY', message: 'collection_ready must be true', severity: 'error' });
  }

  const validation_passed =
    collection_contract_defined &&
    batch_plan_defined &&
    identity_break_batch_defined &&
    record_spec_defined &&
    classification_reason_defined &&
    traceability_rules_defined &&
    collection_ready &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const collectionPlanOutput = {
    ...collectionPlan,
    analysis: { ...ANALYSIS },
    evidence_collection_contract: { ...EVIDENCE_COLLECTION_CONTRACT },
    collection_batch_plan: { ...COLLECTION_BATCH_PLAN },
    collection_traceability_rules: { ...COLLECTION_TRACEABILITY_RULES },
  };

  const readiness: EnvironmentIdentityEvidenceCollectionReadiness = {
    report_id: `environment_evidence_collection_readiness_${Date.now().toString(36)}`,
    phase: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT
      : ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_FAIL_VERDICT,
    status: validation_passed
      ? ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS
      : 'ENVIRONMENT_EVIDENCE_COLLECTION_NOT_READY',
    validation_passed,
    collection_contract_defined,
    batch_plan_defined,
    identity_break_batch_defined,
    record_spec_defined,
    classification_reason_defined,
    traceability_rules_defined,
    collection_ready,
    collection_executed: false,
    validation_ready: false,
    gpu_authorization_ready: false,
    evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
    expected_collection_size: TARGET_SAMPLE_COUNT,
    evidence_records_generated: 0,
    environment_evidence_collected: false,
    gpu_validation_executed: false,
    environment_validated: false,
    gpu_ready: false,
    checks: {
      collection_contract_defined,
      batch_plan_defined,
      identity_break_batch_defined,
      record_spec_defined,
      classification_reason_defined,
      traceability_rules_defined,
      collection_ready,
      collection_executed_false: true,
      validation_ready_false: true,
      gpu_authorization_ready_false: true,
      evidence_collection_mode_definition_only: EVIDENCE_COLLECTION_MODE === 'DEFINITION_ONLY',
      evidence_records_generated_zero: true,
      environment_evidence_collected_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH, collectionPlanOutput);
  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH, recordSpec);
  writeJson(root, ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH, readiness);

  return readiness;
}

export function writeEnvironmentIdentityEvidenceCollectionReport(
  projectRoot?: string
): EnvironmentIdentityEvidenceCollectionReadiness {
  return runEnvironmentIdentityEvidenceCollectionDefinition(projectRoot);
}
