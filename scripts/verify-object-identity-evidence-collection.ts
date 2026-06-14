import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS,
  OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH,
  writeObjectIdentityEvidenceCollectionReport,
} from '../services/objectIdentityEvidenceCollection.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeObjectIdentityEvidenceCollectionReport(projectRoot);

const collectionPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH), 'utf8')
) as {
  batch_plan_defined: boolean;
  target_sample_count: number;
  collection_order: string[];
  hero_prop_batch: unknown[];
  evidence_collection_contract: Record<string, string>;
  collection_traceability_rules: Record<string, string>;
};

const recordSpec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH), 'utf8')
) as {
  record_spec_defined: boolean;
  object_classification: string[];
  classification_reason: string[];
  identity_broken_object_defined: boolean;
  reference_bank_match_defined: boolean;
  object_evidence_record_format: Record<string, string>;
};

const readinessReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH), 'utf8')
) as {
  collection_ready: boolean;
  collection_executed: boolean;
  validation_ready: boolean;
  gpu_authorization_ready: boolean;
  evidence_collection_mode: string;
  highest_risk_area: string;
  highest_failure_mode: string;
  object_recoverability: string;
  hero_prop_expected_pass_rate: number;
  secondary_prop_expected_pass_rate: number;
  background_object_expected_pass_rate: number;
  evidence_records_generated: number;
  object_evidence_collected: boolean;
  object_validated: boolean;
  object_identity_ready: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `collection_contract_defined=${report.collection_contract_defined}`,
    `batch_plan_defined=${report.batch_plan_defined}`,
    `hero_prop_batch_defined=${report.hero_prop_batch_defined}`,
    `record_spec_defined=${report.record_spec_defined}`,
    `identity_broken_object_defined=${report.identity_broken_object_defined}`,
    `classification_reason_defined=${report.classification_reason_defined}`,
    `reference_bank_match_defined=${report.reference_bank_match_defined}`,
    `traceability_rules_defined=${report.traceability_rules_defined}`,
    `object_recoverability_defined=${report.object_recoverability_defined}`,
    `highest_failure_mode_defined=${report.highest_failure_mode_defined}`,
    `collection_ready=${report.collection_ready}`,
    `collection_executed=${report.collection_executed}`,
    `validation_ready=${report.validation_ready}`,
    `gpu_authorization_ready=${report.gpu_authorization_ready}`,
    `evidence_collection_mode=${report.evidence_collection_mode}`,
    `highest_risk_area=${readinessReport.highest_risk_area}`,
    `highest_failure_mode=${readinessReport.highest_failure_mode}`,
    `object_recoverability=${readinessReport.object_recoverability}`,
    `hero_prop_expected_pass_rate=${readinessReport.hero_prop_expected_pass_rate}`,
    `expected_collection_size=${report.expected_collection_size}`,
    `evidence_records_generated=${readinessReport.evidence_records_generated}`,
    `object_evidence_collected=${readinessReport.object_evidence_collected}`,
  ].join(' | ')
);

for (const rel of [
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_PLAN_PATH,
  OBJECT_IDENTITY_EVIDENCE_RECORD_SPEC_PATH,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT) {
  console.error('OBJECT EVIDENCE COLLECTION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS) {
  console.error(`STATUS FAIL: expected ${OBJECT_IDENTITY_EVIDENCE_COLLECTION_STATUS}`);
  process.exit(1);
}

if (
  !report.collection_contract_defined ||
  !report.batch_plan_defined ||
  !report.hero_prop_batch_defined ||
  !report.record_spec_defined ||
  !report.identity_broken_object_defined ||
  !report.classification_reason_defined ||
  !report.reference_bank_match_defined ||
  !report.traceability_rules_defined ||
  !report.object_recoverability_defined ||
  !report.highest_failure_mode_defined ||
  !report.collection_ready ||
  report.collection_executed !== false ||
  report.validation_ready !== false ||
  report.gpu_authorization_ready !== false ||
  report.evidence_collection_mode !== 'DEFINITION_ONLY'
) {
  console.error('PASS CONDITION FAIL: object evidence collection definition checks not met');
  process.exit(1);
}

if (
  readinessReport.collection_executed ||
  readinessReport.validation_ready ||
  readinessReport.gpu_authorization_ready ||
  readinessReport.object_evidence_collected ||
  readinessReport.object_validated ||
  readinessReport.object_identity_ready ||
  report.object_evidence_collected ||
  report.object_validated ||
  report.object_identity_ready ||
  report.gpu_validation_executed ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify collection executed or object validated');
  process.exit(1);
}

if (readinessReport.evidence_records_generated !== 0) {
  console.error('EVIDENCE RECORDS FAIL: evidence_records_generated must be 0');
  process.exit(1);
}

if (readinessReport.highest_risk_area !== 'hero_prop_identity') {
  console.error('HIGHEST RISK AREA FAIL: expected hero_prop_identity');
  process.exit(1);
}

if (readinessReport.highest_failure_mode !== 'hero_prop_identity_drift') {
  console.error('HIGHEST FAILURE MODE FAIL: expected hero_prop_identity_drift');
  process.exit(1);
}

if (readinessReport.object_recoverability !== 'MEDIUM') {
  console.error('OBJECT RECOVERABILITY FAIL: expected MEDIUM');
  process.exit(1);
}

if (readinessReport.hero_prop_expected_pass_rate !== 0.2) {
  console.error('HERO PROP PASS RATE FAIL: hero_prop_expected_pass_rate=0.20 required');
  process.exit(1);
}

if (readinessReport.secondary_prop_expected_pass_rate !== 0.45) {
  console.error('SECONDARY PROP PASS RATE FAIL: secondary_prop_expected_pass_rate=0.45 required');
  process.exit(1);
}

if (readinessReport.background_object_expected_pass_rate !== 0.7) {
  console.error('BACKGROUND OBJECT PASS RATE FAIL: background_object_expected_pass_rate=0.70 required');
  process.exit(1);
}

if (collectionPlan.target_sample_count !== 40) {
  console.error('TARGET SAMPLE COUNT FAIL: target_sample_count=40 required');
  process.exit(1);
}

if (collectionPlan.hero_prop_batch.length === 0) {
  console.error('HERO PROP BATCH FAIL: hero_prop_batch required');
  process.exit(1);
}

if (!recordSpec.object_classification.includes('identity_broken_object')) {
  console.error('IDENTITY BROKEN OBJECT FAIL: identity_broken_object required in record spec');
  process.exit(1);
}

if (!recordSpec.classification_reason.includes('reference_bank_match')) {
  console.error('REFERENCE BANK MATCH FAIL: reference_bank_match required in classification_reason');
  process.exit(1);
}

const requiredClassifications = [
  'same_object',
  'strict_object',
  'similar_object',
  'different_object',
  'identity_broken_object',
];
for (const classification of requiredClassifications) {
  if (!recordSpec.object_classification.includes(classification)) {
    console.error(`CLASSIFICATION FAIL: missing ${classification}`);
    process.exit(1);
  }
}

const requiredReasons = [
  'identity_signature_match',
  'texture_match',
  'anchor_match',
  'role_match',
  'traceability_match',
  'reference_bank_match',
];
for (const reason of requiredReasons) {
  if (!recordSpec.classification_reason.includes(reason)) {
    console.error(`CLASSIFICATION REASON FAIL: missing ${reason}`);
    process.exit(1);
  }
}

if (
  Object.keys(collectionPlan.evidence_collection_contract).length === 0 ||
  Object.keys(collectionPlan.collection_traceability_rules).length === 0 ||
  Object.keys(recordSpec.object_evidence_record_format).length === 0
) {
  console.error('CONTRACT/RULES FAIL: collection contract and traceability rules required');
  process.exit(1);
}

if (!collectionPlan.collection_order.includes('hero_prop_batch')) {
  console.error('COLLECTION ORDER FAIL: hero_prop_batch must be in collection_order');
  process.exit(1);
}

process.exit(0);
