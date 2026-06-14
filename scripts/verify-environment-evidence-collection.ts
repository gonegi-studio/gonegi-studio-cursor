import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS,
  ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH,
  writeEnvironmentIdentityEvidenceCollectionReport,
} from '../services/environmentIdentityEvidenceCollection.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvironmentIdentityEvidenceCollectionReport(projectRoot);

const collectionPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH), 'utf8')
) as {
  batch_plan_defined: boolean;
  target_sample_count: number;
  collection_order: string[];
  identity_break_batch: Array<{ break_mode: string }>;
  evidence_collection_contract: Record<string, string>;
  collection_traceability_rules: Record<string, string>;
};

const recordSpec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH), 'utf8')
) as {
  record_spec_defined: boolean;
  environment_classification: string[];
  classification_reason: string[];
  environment_evidence_record_format: Record<string, string>;
};

const readinessReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH), 'utf8')
) as {
  collection_ready: boolean;
  collection_executed: boolean;
  validation_ready: boolean;
  gpu_authorization_ready: boolean;
  evidence_collection_mode: string;
  evidence_records_generated: number;
  environment_evidence_collected: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `collection_contract_defined=${report.collection_contract_defined}`,
    `batch_plan_defined=${report.batch_plan_defined}`,
    `identity_break_batch_defined=${report.identity_break_batch_defined}`,
    `record_spec_defined=${report.record_spec_defined}`,
    `classification_reason_defined=${report.classification_reason_defined}`,
    `traceability_rules_defined=${report.traceability_rules_defined}`,
    `collection_ready=${report.collection_ready}`,
    `collection_executed=${report.collection_executed}`,
    `validation_ready=${report.validation_ready}`,
    `gpu_authorization_ready=${report.gpu_authorization_ready}`,
    `evidence_collection_mode=${report.evidence_collection_mode}`,
    `expected_collection_size=${report.expected_collection_size}`,
    `evidence_records_generated=${readinessReport.evidence_records_generated}`,
    `environment_evidence_collected=${readinessReport.environment_evidence_collected}`,
  ].join(' | ')
);

for (const rel of [
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT) {
  console.error('ENVIRONMENT EVIDENCE COLLECTION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS) {
  console.error(`STATUS FAIL: expected ${ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_STATUS}`);
  process.exit(1);
}

if (
  !report.collection_contract_defined ||
  !report.batch_plan_defined ||
  !report.identity_break_batch_defined ||
  !report.record_spec_defined ||
  !report.classification_reason_defined ||
  !report.traceability_rules_defined ||
  !report.collection_ready ||
  report.collection_executed !== false ||
  report.validation_ready !== false ||
  report.gpu_authorization_ready !== false ||
  report.evidence_collection_mode !== 'DEFINITION_ONLY'
) {
  console.error('PASS CONDITION FAIL: environment evidence collection definition checks not met');
  process.exit(1);
}

if (
  readinessReport.collection_executed ||
  readinessReport.validation_ready ||
  readinessReport.gpu_authorization_ready ||
  readinessReport.environment_evidence_collected ||
  report.environment_evidence_collected ||
  report.gpu_validation_executed ||
  report.environment_validated ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify collection executed or evidence collected');
  process.exit(1);
}

if (readinessReport.evidence_records_generated !== 0) {
  console.error('EVIDENCE RECORDS FAIL: evidence_records_generated must be 0');
  process.exit(1);
}

if (collectionPlan.target_sample_count !== 50) {
  console.error('TARGET SAMPLE COUNT FAIL: target_sample_count=50 required');
  process.exit(1);
}

const breakModes = collectionPlan.identity_break_batch.map((entry) => entry.break_mode);
for (const mode of ['extreme_camera_rotation', 'heavy_occlusion', 'major_lighting_shift']) {
  if (!breakModes.includes(mode)) {
    console.error(`IDENTITY BREAK BATCH FAIL: missing break_mode ${mode}`);
    process.exit(1);
  }
}

const requiredClassifications = [
  'same_environment',
  'strict_environment',
  'similar_environment',
  'different_environment',
];
for (const classification of requiredClassifications) {
  if (!recordSpec.environment_classification.includes(classification)) {
    console.error(`CLASSIFICATION FAIL: missing ${classification}`);
    process.exit(1);
  }
}

const requiredReasons = ['layout_signature_match', 'anchor_match', 'reference_bank_match'];
for (const reason of requiredReasons) {
  if (!recordSpec.classification_reason.includes(reason)) {
    console.error(`CLASSIFICATION REASON FAIL: missing ${reason}`);
    process.exit(1);
  }
}

if (
  Object.keys(collectionPlan.evidence_collection_contract).length === 0 ||
  Object.keys(collectionPlan.collection_traceability_rules).length === 0 ||
  Object.keys(recordSpec.environment_evidence_record_format).length === 0
) {
  console.error('CONTRACT/RULES FAIL: collection contract and traceability rules required');
  process.exit(1);
}

if (!collectionPlan.collection_order.includes('identity_break_batch')) {
  console.error('COLLECTION ORDER FAIL: identity_break_batch must be in collection_order');
  process.exit(1);
}

process.exit(0);
