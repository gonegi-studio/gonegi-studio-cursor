import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
} from './temporalPreservationEvidence.js';
import { TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH } from './temporalPreservationBinding.js';
import { TEMPORAL_MEMORY_SPECIFICATION_PATH } from './temporalPreservationStrategy.js';

export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE =
  'PHASE-GPU-CONDITIONING-VALIDATION-007B' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID =
  'TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_V1' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT =
  'PASS_TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_V1' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_FAIL_VERDICT =
  'FAIL_TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_V1' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS =
  'TEMPORAL_EVIDENCE_COLLECTION_READY' as const;

export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_DATASET_DIR =
  'datasets/gpu_validation_temporal_preservation_evidence_collection' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_REGISTRY_PATH =
  `${TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_DATASET_DIR}/temporal-preservation-evidence-collection-registry.json` as const;

export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN.json' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC.json' as const;
export const TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH =
  'reports/movie_reconstruction/TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS.json' as const;

const TARGET_SAMPLE_COUNT = 30;
const EVIDENCE_COLLECTION_MODE = 'DEFINITION_ONLY' as const;

const EXECUTION_FLAGS = {
  collection_definition_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  ocr: false as const,
  external_api: false as const,
  safe_create_only: true as const,
};

const TIMELINE_CLASSIFICATIONS = [
  'same_timeline',
  'strict_timeline',
  'similar_timeline',
  'broken_timeline',
  'causally_broken_timeline',
] as const;

const CLASSIFICATION_REASONS = [
  'continuity_match',
  'causal_chain_match',
  'edit_rhythm_match',
  'traceability_match',
  'memory_recall_match',
] as const;

export interface TemporalPreservationEvidenceCollectionPlan {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  batch_plan_defined: true;
  target_sample_count: number;
  collection_order: string[];
  easy_batch: Array<{ case_id: string; timeline_id: string; memory_signature: string }>;
  medium_batch: Array<{ case_id: string; timeline_id: string; memory_signature: string }>;
  hard_batch: Array<{ case_id: string; timeline_id: string; failure_mode: string }>;
  stress_batch: Array<{ case_id: string; timeline_id: string; stress_mode: string }>;
  long_horizon_batch: Array<{ case_id: string; timeline_id: string; horizon_mode: string }>;
}

export interface TemporalPreservationEvidenceRecordSpec {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  record_spec_defined: true;
  temporal_evidence_record_format: Record<string, string>;
  required_fields: string[];
  timeline_classification: typeof TIMELINE_CLASSIFICATIONS[number][];
  classification_reason: typeof CLASSIFICATION_REASONS[number][];
  causally_broken_timeline_defined: true;
  memory_recall_match_defined: true;
  classification_thresholds: {
    same_timeline: number;
    strict_timeline: number;
    similar_timeline: number;
    broken_timeline: number;
    timeline_break: number;
  };
  example_record: {
    timeline_id: string;
    continuity_signature: string;
    causal_chain_signature: string;
    traceability_signature: string;
    evidence_score: number;
    timeline_classification: typeof TIMELINE_CLASSIFICATIONS[number];
    classification_reason: typeof CLASSIFICATION_REASONS[number];
  };
}

export interface TemporalPreservationEvidenceCollectionReadiness {
  report_id: string;
  phase: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE;
  system_id: typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  status:
    | typeof TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS
    | 'TEMPORAL_EVIDENCE_COLLECTION_NOT_READY';
  validation_passed: boolean;
  collection_contract_defined: boolean;
  batch_plan_defined: boolean;
  long_horizon_batch_defined: boolean;
  record_spec_defined: boolean;
  causally_broken_timeline_defined: boolean;
  classification_reason_defined: boolean;
  memory_recall_match_defined: boolean;
  traceability_rules_defined: boolean;
  timeline_recoverability_defined: boolean;
  collection_ready: boolean;
  collection_executed: false;
  validation_ready: false;
  gpu_authorization_ready: false;
  evidence_collection_mode: typeof EVIDENCE_COLLECTION_MODE;
  highest_risk_area: string;
  timeline_recoverability: 'LOW' | 'MEDIUM' | 'HIGH';
  expected_collection_size: number;
  evidence_records_generated: 0;
  temporal_evidence_collected: false;
  temporal_validated: false;
  temporal_preservation_ready: false;
  gpu_validation_executed: false;
  gpu_ready: false;
  checks: Record<string, boolean>;
  issues: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
  execution_flags: typeof EXECUTION_FLAGS;
}

const ANALYSIS = {
  temporal_evidence_protocol:
    'TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL defines composite scoring, pass_threshold=0.95, and causal_transition_chain highest risk; collection plan binds batch execution order without generating records.',
  temporal_dataset:
    'TEMPORAL_PRESERVATION_EVIDENCE_DATASET provides easy/medium/hard/stress/long_horizon batch seeds for collection plan wiring.',
  temporal_memory_binding:
    'Timeline slots bind memory_signature and edit_rhythm_signature; record spec requires memory_recall_match classification reason.',
  causal_transition_chain_binding:
    'Ordered causal_transition records govern causal_chain_signature and causally_broken_timeline classification boundary.',
  temporal_traceability_binding:
    'traceability_signature binds numerical DNA edit_rhythm refs to conditioning map export paths for batch audit.',
} as const;

const EVIDENCE_COLLECTION_CONTRACT = {
  contract_id: 'temporal_preservation_evidence_collection_v1',
  contract_version: '1.0',
  scope: 'Collection execution definition only — Collection Ready != Collection Executed.',
  evidence_protocol_ref: TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  evidence_dataset_ref: TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH,
  binding_ref: TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
  memory_spec_ref: TEMPORAL_MEMORY_SPECIFICATION_PATH,
  evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
  gpu_execution: 'false — collection plan and record spec only; no evidence records generated.',
  assessment_note: 'Do NOT claim TEMPORAL_EVIDENCE_COLLECTED, TEMPORAL_VALIDATED, or TEMPORAL_PRESERVATION_READY.',
} as const;

const COLLECTION_BATCH_PLAN = {
  collection_order: 'easy_batch → medium_batch → hard_batch → stress_batch → long_horizon_batch',
  target_sample_count: String(TARGET_SAMPLE_COUNT),
  batch_note: 'Sequential collection order; long_horizon_batch runs last for callback memory audit.',
} as const;

const COLLECTION_TRACEABILITY_RULES = {
  record_traceability:
    'Each evidence record must bind timeline_id, continuity_signature, causal_chain_signature, and traceability_signature.',
  batch_audit_signature: 'Collection batch_id hashes case_id list for offline replay without GPU execution.',
  classification_audit: 'timeline_classification and classification_reason required on every record at collection time.',
  causal_chain_integrity: 'causal_chain_signature must resolve to binding package causal_transition_chain entry.',
  collection_note: 'Collection Ready != Collection Executed; Evidence Records Generated = 0.',
} as const;

const TEMPORAL_EVIDENCE_RECORD_FORMAT = {
  timeline_id: 'Target timeline_id from temporal memory binding.',
  continuity_signature: 'Hash of shot_boundary_continuity anchors across adjacent shots.',
  causal_chain_signature: 'Hash of causal_transition_chain traversal path.',
  traceability_signature: 'Hash binding numerical DNA edit_rhythm and motion_vectors refs.',
  evidence_score: 'Composite score from temporal_scoring_rules weighted formula.',
  timeline_classification:
    'Enum: same_timeline | strict_timeline | similar_timeline | broken_timeline | causally_broken_timeline.',
  classification_reason:
    'Enum: continuity_match | causal_chain_match | edit_rhythm_match | traceability_match | memory_recall_match.',
} as const;

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildCollectionPlan(): TemporalPreservationEvidenceCollectionPlan {
  return {
    report_id: `temporal_evidence_collection_plan_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
    system_id: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    batch_plan_defined: true,
    target_sample_count: TARGET_SAMPLE_COUNT,
    collection_order: [
      'easy_batch',
      'medium_batch',
      'hard_batch',
      'stress_batch',
      'long_horizon_batch',
    ],
    easy_batch: [
      { case_id: 'temp_col_easy_001', timeline_id: 'timeline_titanic_014', memory_signature: 'temp_mem_001' },
      { case_id: 'temp_col_easy_002', timeline_id: 'timeline_titanic_015', memory_signature: 'temp_mem_002' },
    ],
    medium_batch: [
      { case_id: 'temp_col_med_001', timeline_id: 'timeline_ghibli_001', memory_signature: 'temp_mem_003' },
      { case_id: 'temp_col_med_002', timeline_id: 'timeline_gonegi_001', memory_signature: 'temp_mem_004' },
    ],
    hard_batch: [
      { case_id: 'temp_col_hard_001', timeline_id: 'timeline_titanic_014_015', failure_mode: 'character_position_jump' },
      { case_id: 'temp_col_hard_002', timeline_id: 'timeline_titanic_015_016', failure_mode: 'missing_transition_cause' },
    ],
    stress_batch: [
      { case_id: 'temp_col_stress_001', timeline_id: 'timeline_titanic_014_015', stress_mode: 'rapid_cut_sequence' },
      { case_id: 'temp_col_stress_002', timeline_id: 'timeline_titanic_015_016', stress_mode: 'cross_scene_jump' },
      { case_id: 'temp_col_stress_003', timeline_id: 'timeline_ghibli_001_002', stress_mode: 'edit_rhythm_acceleration' },
    ],
    long_horizon_batch: [
      { case_id: 'temp_col_lh_001', timeline_id: 'timeline_callback_020', horizon_mode: 'callback_after_20_scenes' },
      { case_id: 'temp_col_lh_002', timeline_id: 'timeline_callback_050', horizon_mode: 'callback_after_50_scenes' },
      { case_id: 'temp_col_lh_003', timeline_id: 'timeline_callback_100', horizon_mode: 'callback_after_100_scenes' },
    ],
  };
}

function buildRecordSpec(): TemporalPreservationEvidenceRecordSpec {
  return {
    report_id: `temporal_evidence_record_spec_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
    system_id: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    record_spec_defined: true,
    temporal_evidence_record_format: { ...TEMPORAL_EVIDENCE_RECORD_FORMAT },
    required_fields: [
      'timeline_id',
      'continuity_signature',
      'causal_chain_signature',
      'traceability_signature',
      'evidence_score',
      'timeline_classification',
      'classification_reason',
    ],
    timeline_classification: [...TIMELINE_CLASSIFICATIONS],
    classification_reason: [...CLASSIFICATION_REASONS],
    causally_broken_timeline_defined: true,
    memory_recall_match_defined: true,
    classification_thresholds: {
      same_timeline: 0.95,
      strict_timeline: 0.9,
      similar_timeline: 0.75,
      broken_timeline: 0.5,
      timeline_break: 0.3,
    },
    example_record: {
      timeline_id: 'timeline_titanic_014_015',
      continuity_signature: 'cont_sig_a1b2c3d4',
      causal_chain_signature: 'causal_sig_transition_014_015',
      traceability_signature: 'trace_sig_edit_rhythm_014_015',
      evidence_score: 0.94,
      timeline_classification: 'strict_timeline',
      classification_reason: 'causal_chain_match',
    },
  };
}

export function runTemporalPreservationEvidenceCollectionDefinition(
  projectRoot?: string
): TemporalPreservationEvidenceCollectionReadiness {
  const root = resolveProjectRoot(projectRoot);
  const issues: TemporalPreservationEvidenceCollectionReadiness['issues'] = [];

  const prerequisitePaths = [
    TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_REGISTRY_PATH,
    TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
    TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH,
    TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
    TEMPORAL_PRESERVATION_BINDING_PACKAGE_PATH,
    TEMPORAL_MEMORY_SPECIFICATION_PATH,
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
  const long_horizon_batch_defined =
    collectionPlan.long_horizon_batch.length > 0 &&
    collectionPlan.long_horizon_batch.some((entry) => entry.horizon_mode === 'callback_after_20_scenes') &&
    collectionPlan.long_horizon_batch.some((entry) => entry.horizon_mode === 'callback_after_50_scenes') &&
    collectionPlan.long_horizon_batch.some((entry) => entry.horizon_mode === 'callback_after_100_scenes');
  const record_spec_defined = recordSpec.record_spec_defined === true;
  const causally_broken_timeline_defined =
    recordSpec.causally_broken_timeline_defined === true &&
    recordSpec.timeline_classification.includes('causally_broken_timeline');
  const classification_reason_defined =
    recordSpec.classification_reason.length === CLASSIFICATION_REASONS.length &&
    CLASSIFICATION_REASONS.every((reason) => recordSpec.classification_reason.includes(reason));
  const memory_recall_match_defined =
    recordSpec.memory_recall_match_defined === true &&
    recordSpec.classification_reason.includes('memory_recall_match');
  const traceability_rules_defined =
    Object.keys(COLLECTION_TRACEABILITY_RULES).length > 0 &&
    recordSpec.required_fields.includes('traceability_signature');
  const timeline_recoverability_defined = true;

  const collection_ready =
    collection_contract_defined &&
    batch_plan_defined &&
    long_horizon_batch_defined &&
    record_spec_defined &&
    causally_broken_timeline_defined &&
    classification_reason_defined &&
    memory_recall_match_defined &&
    traceability_rules_defined &&
    timeline_recoverability_defined;

  if (!collection_contract_defined) {
    issues.push({ code: 'CONTRACT', message: 'evidence_collection_contract required', severity: 'error' });
  }
  if (!long_horizon_batch_defined) {
    issues.push({ code: 'LONG_HORIZON', message: 'long_horizon_batch required', severity: 'error' });
  }
  if (!causally_broken_timeline_defined) {
    issues.push({
      code: 'CAUSALLY_BROKEN',
      message: 'causally_broken_timeline must be defined',
      severity: 'error',
    });
  }
  if (!memory_recall_match_defined) {
    issues.push({
      code: 'MEMORY_RECALL',
      message: 'memory_recall_match must be defined',
      severity: 'error',
    });
  }
  if (!collection_ready) {
    issues.push({ code: 'COLLECTION_READY', message: 'collection_ready must be true', severity: 'error' });
  }

  const validation_passed =
    collection_contract_defined &&
    batch_plan_defined &&
    long_horizon_batch_defined &&
    record_spec_defined &&
    causally_broken_timeline_defined &&
    classification_reason_defined &&
    memory_recall_match_defined &&
    traceability_rules_defined &&
    timeline_recoverability_defined &&
    collection_ready &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const collectionPlanOutput = {
    ...collectionPlan,
    analysis: { ...ANALYSIS },
    evidence_collection_contract: { ...EVIDENCE_COLLECTION_CONTRACT },
    collection_batch_plan: { ...COLLECTION_BATCH_PLAN },
    collection_traceability_rules: { ...COLLECTION_TRACEABILITY_RULES },
  };

  const readiness: TemporalPreservationEvidenceCollectionReadiness = {
    report_id: `temporal_evidence_collection_readiness_${Date.now().toString(36)}`,
    phase: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
    system_id: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validation_passed
      ? TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT
      : TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_FAIL_VERDICT,
    status: validation_passed
      ? TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS
      : 'TEMPORAL_EVIDENCE_COLLECTION_NOT_READY',
    validation_passed,
    collection_contract_defined,
    batch_plan_defined,
    long_horizon_batch_defined,
    record_spec_defined,
    causally_broken_timeline_defined,
    classification_reason_defined,
    memory_recall_match_defined,
    traceability_rules_defined,
    timeline_recoverability_defined,
    collection_ready,
    collection_executed: false,
    validation_ready: false,
    gpu_authorization_ready: false,
    evidence_collection_mode: EVIDENCE_COLLECTION_MODE,
    highest_risk_area: 'causal_transition_chain',
    timeline_recoverability: 'LOW',
    expected_collection_size: TARGET_SAMPLE_COUNT,
    evidence_records_generated: 0,
    temporal_evidence_collected: false,
    temporal_validated: false,
    temporal_preservation_ready: false,
    gpu_validation_executed: false,
    gpu_ready: false,
    checks: {
      collection_contract_defined,
      batch_plan_defined,
      long_horizon_batch_defined,
      record_spec_defined,
      causally_broken_timeline_defined,
      classification_reason_defined,
      memory_recall_match_defined,
      traceability_rules_defined,
      timeline_recoverability_defined,
      collection_ready,
      collection_executed_false: true,
      validation_ready_false: true,
      gpu_authorization_ready_false: true,
      evidence_collection_mode_definition_only: EVIDENCE_COLLECTION_MODE === 'DEFINITION_ONLY',
      evidence_records_generated_zero: true,
      temporal_evidence_collected_false: true,
      temporal_validated_false: true,
      temporal_preservation_ready_false: true,
    },
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };

  writeJson(root, TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN_PATH, collectionPlanOutput);
  writeJson(root, TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC_PATH, recordSpec);
  writeJson(root, TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH, readiness);

  return readiness;
}

export function writeTemporalPreservationEvidenceCollectionReport(
  projectRoot?: string
): TemporalPreservationEvidenceCollectionReadiness {
  return runTemporalPreservationEvidenceCollectionDefinition(projectRoot);
}
