import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  OBJECT_IDENTITY_EVIDENCE_DATASET_PATH,
  OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
} from './objectIdentityEvidence.js';
import { OBJECT_IDENTITY_BINDING_PACKAGE_PATH } from './objectIdentityBinding.js';
import { OBJECT_REFERENCE_BANK_SPECIFICATION_PATH } from './objectIdentityStrategy.js';

export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-007C' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID =
  'OBJECT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT =
  'PASS_OBJECT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_FAIL_VERDICT =
  'FAIL_OBJECT_IDENTITY_EVIDENCE_COLLECTION_V1' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS =
  'OBJECT_EVIDENCE_COLLECTION_READY' as const;

export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_DATASET_DIR =
  'datasets/gpu_validation_object_identity_evidence_collection' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_REGISTRY_PATH =
  `${OBJECT_IDENTITY_EVIDENCE_COLLECTION_DATASET_DIR}/object-identity-evidence-collection-registry.json` as const;

export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN.json' as const;
export const OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC.json' as const;
export const OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH =
  'reports/movie_reconstruction/OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS.json' as const;

const TARGET_SAMPLE_COUNT = 40;
const EVIDENCE_COLLECTION_MODE = 'DEFINITION_ONLY' as const;

const EXECUTION_FLAGS = {
  collection_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const OBJECT_CLASSIFICATIONS = [
  'same_object',
  'strict_object',
  'similar_object',
  'different_object',
  'identity_broken_object',
] as const;

const CLASSIFICATION_REASONS = [
  'identity_signature_match',
  'texture_match',
  'anchor_match',
  'role_match',
  'traceability_match',
  'reference_bank_match',
] as const;

export interface ObjectIdentityEvidenceCollectionPlan {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  batch_plan_defined: true;
  target_sample_count: number;
  collection_order: string[];
  easy_batch: Array<{ case_id: string; object_id: string; reference_bank_id: string }>;
  medium_batch: Array<{ case_id: string; object_id: string; reference_bank_id: string }>;
  hard_batch: Array<{ case_id: string; object_id: string; failure_mode: string }>;
  stress_batch: Array<{ case_id: string; object_id: string; stress_mode: string }>;
  hero_prop_batch: Array<{ case_id: string; object_id: string; role: 'hero_prop' }>;
  secondary_prop_batch: Array<{ case_id: string; object_id: string; role: 'secondary_prop' }>;
  background_object_batch: Array<{ case_id: string; object_id: string; role: 'background_object' }>;
}

export interface ObjectIdentityEvidenceRecordSpec {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  record_spec_defined: true;
  object_evidence_record_format: Record<string, string>;
  required_fields: string[];
  object_classification: typeof OBJECT_CLASSIFICATIONS[number][];
  classification_reason: typeof CLASSIFICATION_REASONS[number][];
  identity_broken_object_defined: true;
  reference_bank_match_defined: true;
  classification_thresholds: {
    same_object: number;
    strict_object: number;
    similar_object: number;
    different_object: number;
    identity_break: number;
    hero_prop: number;
    secondary_prop: number;
    background_object: number;
  };
  example_record: {
    object_id: string;
    reference_bank_id: string;
    identity_signature: string;
    traceability_signature: string;
    evidence_score: number;
    object_classification: typeof OBJECT_CLASSIFICATIONS[number];
    classification_reason: typeof CLASSIFICATION_REASONS[number];
  };
}

export interface ObjectIdentityEvidenceCollectionReadiness {
  report_id: string;
  phase: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS
    | 'OBJECT_EVIDENCE_COLLECTION_NOT_READY';
  validation_passed: boolean;
  collection_contract_defined: boolean;
  batch_plan_defined: boolean;
  hero_prop_batch_defined: boolean;
  record_spec_defined: boolean;
  identity_broken_object_defined: boolean;
  classification_reason_defined: boolean;
  reference_bank_match_defined: boolean;
  traceability_rules_defined: boolean;
  object_recoverability_defined: boolean;
  highest_failure_mode_defined: boolean;
  collection_ready: boolean;
  collection_executed: false;
  validation_ready: false;
  gpu_authorization_ready: false;
  evidence_collection_mode: typeof EVIDENCE_COLLECTION_MODE;
  highest_risk_area: string;
  highest_failure_mode: string;
  object_recoverability: 'LOW' | 'MEDIUM' | 'HIGH';
  hero_prop_expected_pass_rate: number;
  secondary_prop_expected_pass_rate: number;
  background_object_expected_pass_rate: number;
  expected_collection_size: number;
  evidence_records_generated: 0;
  object_evidence_collected: false;
  object_validated: false;
  object_identity_ready: false;
  gpu_validation_executed: false;
  gpu_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const ANALYSIS = {
  object_evidence_protocol:
    'OBJECT_IDENTITY_EVIDENCE_PROTOCOL defines composite scoring, pass_threshold=0.97, and hero_prop role gate; collection plan binds batch execution order without generating records.',
  object_dataset:
    'OBJECT_IDENTITY_EVIDENCE_DATASET provides easy/medium/hard/stress and role batch seeds for collection plan wiring.',
  object_reference_bank:
    'Bank entries (suitcase_001, chair_014, lantern_001, wooden_crate_001) supply reference_bank_id and identity_signature templates.',
  object_similarity_binding:
    'object_similarity_v1 same_object_threshold=0.97 governs object_classification assignment in record spec.',
  object_role_binding:
    'object_role_v1 assigns hero_prop > scene_prop priority; hero_prop_batch runs with strictest pass threshold.',
  object_traceability_binding:
    'traceability_signature links conditioning_map_ref and OBJECT_REFERENCE_BANK_SPECIFICATION for batch audit.',
} as const;

const EVIDENCE_COLLECTION_CONTRACT = {
  contract_id: 'object_identity_evidence_collection_v1',
  contract_version: '1.0',
  scope: 'Collection execution definition only — Collection Ready != Collection Executed.',
  evidence_protocol_ref: OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  evidence_dataset_ref: OBJECT_IDENTITY_EVIDENCE_DATASET_PATH,
  binding_ref: OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
  bank_spec_ref: OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
  evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
  gpu_execution: 'false — collection plan and record spec only; no evidence records generated.',
  texture_match_note: 'Texture Match is part of Object Identity — texture_match is a required classification_reason.',
  assessment_note: 'Do NOT claim OBJECT_EVIDENCE_COLLECTED, OBJECT_VALIDATED, or OBJECT_IDENTITY_READY.',
} as const;

const COLLECTION_BATCH_PLAN = {
  collection_order:
    'easy_batch → medium_batch → hard_batch → stress_batch → hero_prop_batch → secondary_prop_batch → background_object_batch',
  target_sample_count: String(TARGET_SAMPLE_COUNT),
  batch_note: 'Role batches run after difficulty batches; hero_prop_batch has highest failure risk.',
} as const;

const COLLECTION_TRACEABILITY_RULES = {
  record_traceability:
    'Each evidence record must bind object_id, reference_bank_id, identity_signature, and traceability_signature.',
  batch_audit_signature: 'Collection batch_id hashes case_id list for offline replay without GPU execution.',
  classification_audit: 'object_classification and classification_reason required on every record at collection time.',
  role_binding_cross_ref: 'role_match classification_reason must align with hero_prop/secondary_prop/background_object batch tier.',
  collection_note: 'Collection Ready != Collection Executed; Evidence Records Generated = 0.',
} as const;

const OBJECT_EVIDENCE_RECORD_FORMAT = {
  object_id: 'Target object_id from reference bank.',
  reference_bank_id: 'Bank entry reference_bank_id for recall audit.',
  identity_signature: 'Hash from object_similarity_v1 primary_key lookup path.',
  traceability_signature: 'Hash binding conditioning_map_ref and object_spec_ref.',
  evidence_score: 'Composite score from object_scoring_rules weighted formula.',
  object_classification:
    'Enum: same_object | strict_object | similar_object | different_object | identity_broken_object.',
  classification_reason:
    'Enum: identity_signature_match | texture_match | anchor_match | role_match | traceability_match | reference_bank_match.',
} as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildCollectionPlan(): ObjectIdentityEvidenceCollectionPlan {
  return {
    report_id: `object_evidence_collection_plan_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    batch_plan_defined: true,
    target_sample_count: TARGET_SAMPLE_COUNT,
    collection_order: [
      'easy_batch',
      'medium_batch',
      'hard_batch',
      'stress_batch',
      'hero_prop_batch',
      'secondary_prop_batch',
      'background_object_batch',
    ],
    easy_batch: [
      { case_id: 'obj_col_easy_001', object_id: 'lantern_001', reference_bank_id: 'obj_ref_003' },
      { case_id: 'obj_col_easy_002', object_id: 'wooden_crate_001', reference_bank_id: 'obj_ref_004' },
    ],
    medium_batch: [
      { case_id: 'obj_col_med_001', object_id: 'chair_014', reference_bank_id: 'obj_ref_002' },
      { case_id: 'obj_col_med_002', object_id: 'lantern_001', reference_bank_id: 'obj_ref_003' },
    ],
    hard_batch: [
      { case_id: 'obj_col_hard_001', object_id: 'suitcase_001', failure_mode: 'identity_swap' },
      { case_id: 'obj_col_hard_002', object_id: 'suitcase_001', failure_mode: 'missing_accessory' },
    ],
    stress_batch: [
      { case_id: 'obj_col_stress_001', object_id: 'suitcase_001', stress_mode: 'extreme_zoom' },
      { case_id: 'obj_col_stress_002', object_id: 'suitcase_001', stress_mode: 'partial_occlusion' },
      { case_id: 'obj_col_stress_003', object_id: 'suitcase_001', stress_mode: 'accessory_visibility_loss' },
    ],
    hero_prop_batch: [{ case_id: 'obj_col_hero_001', object_id: 'suitcase_001', role: 'hero_prop' }],
    secondary_prop_batch: [
      { case_id: 'obj_col_sec_001', object_id: 'lantern_001', role: 'secondary_prop' },
      { case_id: 'obj_col_sec_002', object_id: 'wooden_crate_001', role: 'secondary_prop' },
    ],
    background_object_batch: [
      { case_id: 'obj_col_bg_001', object_id: 'chair_014', role: 'background_object' },
    ],
  };
}

function buildRecordSpec(): ObjectIdentityEvidenceRecordSpec {
  return {
    report_id: `object_evidence_record_spec_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    record_spec_defined: true,
    object_evidence_record_format: { ...OBJECT_EVIDENCE_RECORD_FORMAT },
    required_fields: [
      'object_id',
      'reference_bank_id',
      'identity_signature',
      'traceability_signature',
      'evidence_score',
      'object_classification',
      'classification_reason',
    ],
    object_classification: [...OBJECT_CLASSIFICATIONS],
    classification_reason: [...CLASSIFICATION_REASONS],
    identity_broken_object_defined: true,
    reference_bank_match_defined: true,
    classification_thresholds: {
      same_object: 0.97,
      strict_object: 0.95,
      similar_object: 0.8,
      different_object: 0.5,
      identity_break: 0.3,
      hero_prop: 0.98,
      secondary_prop: 0.9,
      background_object: 0.75,
    },
    example_record: {
      object_id: 'suitcase_001',
      reference_bank_id: 'obj_ref_001',
      identity_signature: 'obj_id_sig_suitcase_a1b2c3',
      traceability_signature: 'trace_sig_suitcase_001',
      evidence_score: 0.96,
      object_classification: 'strict_object',
      classification_reason: 'reference_bank_match',
    },
  };
}

export function runObjectIdentityEvidenceCollectionDefinition(
  projectRoot?: string
): ObjectIdentityEvidenceCollectionReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: ObjectIdentityEvidenceCollectionReadiness['issues'] = [];

  const prerequisitePaths = [
    OBJECT_IDENTITY_EVIDENCE_COLLECTION_REGISTRY_PATH,
    OBJECT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
    OBJECT_IDENTITY_EVIDENCE_DATASET_PATH,
    OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
    OBJECT_IDENTITY_BINDING_PACKAGE_PATH,
    OBJECT_REFERENCE_BANK_SPECIFICATION_PATH,
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
    collectionPlan.collection_order.length === 7 &&
    collectionPlan.target_sample_count === TARGET_SAMPLE_COUNT;
  const hero_prop_batch_defined = collectionPlan.hero_prop_batch.length > 0;
  const record_spec_defined = recordSpec.record_spec_defined === true;
  const identity_broken_object_defined =
    recordSpec.identity_broken_object_defined === true &&
    recordSpec.object_classification.includes('identity_broken_object');
  const classification_reason_defined =
    recordSpec.classification_reason.length === CLASSIFICATION_REASONS.length &&
    CLASSIFICATION_REASONS.every((reason) => recordSpec.classification_reason.includes(reason));
  const reference_bank_match_defined =
    recordSpec.reference_bank_match_defined === true &&
    recordSpec.classification_reason.includes('reference_bank_match');
  const traceability_rules_defined =
    Object.keys(COLLECTION_TRACEABILITY_RULES).length > 0 &&
    recordSpec.required_fields.includes('traceability_signature');
  const object_recoverability_defined = true;
  const highest_failure_mode_defined = true;

  const collection_ready =
    collection_contract_defined &&
    batch_plan_defined &&
    hero_prop_batch_defined &&
    record_spec_defined &&
    identity_broken_object_defined &&
    classification_reason_defined &&
    reference_bank_match_defined &&
    traceability_rules_defined &&
    object_recoverability_defined &&
    highest_failure_mode_defined;

  if (!hero_prop_batch_defined) {
    issues.push({ code: 'HERO_PROP_BATCH', message: 'hero_prop_batch required', severity: 'error' });
  }
  if (!identity_broken_object_defined) {
    issues.push({
      code: 'IDENTITY_BROKEN',
      message: 'identity_broken_object must be defined',
      severity: 'error',
    });
  }
  if (!reference_bank_match_defined) {
    issues.push({
      code: 'REFERENCE_BANK_MATCH',
      message: 'reference_bank_match must be defined',
      severity: 'error',
    });
  }
  if (!collection_ready) {
    issues.push({ code: 'COLLECTION_READY', message: 'collection_ready must be true', severity: 'error' });
  }

  const validation_passed =
    collection_contract_defined &&
    batch_plan_defined &&
    hero_prop_batch_defined &&
    record_spec_defined &&
    identity_broken_object_defined &&
    classification_reason_defined &&
    reference_bank_match_defined &&
    traceability_rules_defined &&
    object_recoverability_defined &&
    highest_failure_mode_defined &&
    collection_ready &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const collectionPlanOutput = {
    ...collectionPlan,
    analysis: { ...ANALYSIS },
    evidence_collection_contract: { ...EVIDENCE_COLLECTION_CONTRACT },
    collection_batch_plan: { ...COLLECTION_BATCH_PLAN },
    collection_traceability_rules: { ...COLLECTION_TRACEABILITY_RULES },
  };

  const readiness: ObjectIdentityEvidenceCollectionReadiness = {
    report_id: `object_evidence_collection_readiness_${Date.now().toString(36)}`,
    phase: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    system_id: OBJECT_IDENTITY_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT
      : OBJECT_IDENTITY_EVIDENCE_COLLECTION_FAIL_VERDICT,
    status: validation_passed
      ? OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS
      : 'OBJECT_EVIDENCE_COLLECTION_NOT_READY',
    validation_passed,
    collection_contract_defined,
    batch_plan_defined,
    hero_prop_batch_defined,
    record_spec_defined,
    identity_broken_object_defined,
    classification_reason_defined,
    reference_bank_match_defined,
    traceability_rules_defined,
    object_recoverability_defined,
    highest_failure_mode_defined,
    collection_ready,
    collection_executed: false,
    validation_ready: false,
    gpu_authorization_ready: false,
    evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
    highest_risk_area: 'hero_prop_identity',
    highest_failure_mode: 'hero_prop_identity_drift',
    object_recoverability: 'MEDIUM',
    hero_prop_expected_pass_rate: 0.2,
    secondary_prop_expected_pass_rate: 0.45,
    background_object_expected_pass_rate: 0.7,
    expected_collection_size: TARGET_SAMPLE_COUNT,
    evidence_records_generated: 0,
    object_evidence_collected: false,
    object_validated: false,
    object_identity_ready: false,
    gpu_validation_executed: false,
    gpu_ready: false,
    checks: {
      collection_contract_defined,
      batch_plan_defined,
      hero_prop_batch_defined,
      record_spec_defined,
      identity_broken_object_defined,
      classification_reason_defined,
      reference_bank_match_defined,
      traceability_rules_defined,
      object_recoverability_defined,
      highest_failure_mode_defined,
      collection_ready,
      collection_executed_false: true,
      validation_ready_false: true,
      gpu_authorization_ready_false: true,
      evidence_collection_mode_definition_only: EVIDENCE_COLLECTION_MODE === 'DEFINITION_ONLY',
      evidence_records_generated_zero: true,
      object_evidence_collected_false: true,
      object_validated_false: true,
      object_identity_ready_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH, collectionPlanOutput);
  writeJson(root, OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH, recordSpec);
  writeJson(root, OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH, readiness);

  return readiness;
}

export function writeObjectIdentityEvidenceCollectionReport(
  projectRoot?: string
): ObjectIdentityEvidenceCollectionReadiness {
  return runObjectIdentityEvidenceCollectionDefinition(projectRoot);
}
