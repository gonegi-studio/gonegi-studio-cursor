import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS,
  TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC_PATH,
  writeTemporalPreservationEvidenceCollectionReport,
} from '../services/temporalPreservationEvidenceCollection.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTemporalPreservationEvidenceCollectionReport(projectRoot);

const collectionPlan = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN_PATH), 'utf8')
) as {
  batch_plan_defined: boolean;
  target_sample_count: number;
  collection_order: string[];
  long_horizon_batch: Array<{ horizon_mode: string }>;
  evidence_collection_contract: Record<string, string>;
  collection_traceability_rules: Record<string, string>;
};

const recordSpec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC_PATH), 'utf8')
) as {
  record_spec_defined: boolean;
  timeline_classification: string[];
  classification_reason: string[];
  causally_broken_timeline_defined: boolean;
  memory_recall_match_defined: boolean;
  temporal_evidence_record_format: Record<string, string>;
};

const readinessReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH), 'utf8')
) as {
  collection_ready: boolean;
  collection_executed: boolean;
  validation_ready: boolean;
  gpu_authorization_ready: boolean;
  evidence_collection_mode: string;
  highest_risk_area: string;
  timeline_recoverability: string;
  evidence_records_generated: number;
  temporal_evidence_collected: boolean;
  temporal_validated: boolean;
  temporal_preservation_ready: boolean;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `collection_contract_defined=${report.collection_contract_defined}`,
    `batch_plan_defined=${report.batch_plan_defined}`,
    `long_horizon_batch_defined=${report.long_horizon_batch_defined}`,
    `record_spec_defined=${report.record_spec_defined}`,
    `causally_broken_timeline_defined=${report.causally_broken_timeline_defined}`,
    `classification_reason_defined=${report.classification_reason_defined}`,
    `memory_recall_match_defined=${report.memory_recall_match_defined}`,
    `traceability_rules_defined=${report.traceability_rules_defined}`,
    `timeline_recoverability_defined=${report.timeline_recoverability_defined}`,
    `collection_ready=${report.collection_ready}`,
    `collection_executed=${report.collection_executed}`,
    `validation_ready=${report.validation_ready}`,
    `gpu_authorization_ready=${report.gpu_authorization_ready}`,
    `evidence_collection_mode=${report.evidence_collection_mode}`,
    `highest_risk_area=${readinessReport.highest_risk_area}`,
    `timeline_recoverability=${readinessReport.timeline_recoverability}`,
    `expected_collection_size=${report.expected_collection_size}`,
    `evidence_records_generated=${readinessReport.evidence_records_generated}`,
    `temporal_evidence_collected=${readinessReport.temporal_evidence_collected}`,
  ].join(' | ')
);

for (const rel of [
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PLAN_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_RECORD_SPEC_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT) {
  console.error('TEMPORAL EVIDENCE COLLECTION DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS) {
  console.error(`STATUS FAIL: expected ${TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_STATUS}`);
  process.exit(1);
}

if (
  !report.collection_contract_defined ||
  !report.batch_plan_defined ||
  !report.long_horizon_batch_defined ||
  !report.record_spec_defined ||
  !report.causally_broken_timeline_defined ||
  !report.classification_reason_defined ||
  !report.memory_recall_match_defined ||
  !report.traceability_rules_defined ||
  !report.timeline_recoverability_defined ||
  !report.collection_ready ||
  report.collection_executed !== false ||
  report.validation_ready !== false ||
  report.gpu_authorization_ready !== false ||
  report.evidence_collection_mode !== 'DEFINITION_ONLY'
) {
  console.error('PASS CONDITION FAIL: temporal evidence collection definition checks not met');
  process.exit(1);
}

if (
  readinessReport.collection_executed ||
  readinessReport.validation_ready ||
  readinessReport.gpu_authorization_ready ||
  readinessReport.temporal_evidence_collected ||
  readinessReport.temporal_validated ||
  readinessReport.temporal_preservation_ready ||
  report.temporal_evidence_collected ||
  report.temporal_validated ||
  report.temporal_preservation_ready ||
  report.gpu_validation_executed ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify collection executed or temporal validated');
  process.exit(1);
}

if (readinessReport.evidence_records_generated !== 0) {
  console.error('EVIDENCE RECORDS FAIL: evidence_records_generated must be 0');
  process.exit(1);
}

if (readinessReport.highest_risk_area !== 'causal_transition_chain') {
  console.error('HIGHEST RISK AREA FAIL: expected causal_transition_chain');
  process.exit(1);
}

if (readinessReport.timeline_recoverability !== 'LOW') {
  console.error('TIMELINE RECOVERABILITY FAIL: expected LOW');
  process.exit(1);
}

if (collectionPlan.target_sample_count !== 30) {
  console.error('TARGET SAMPLE COUNT FAIL: target_sample_count=30 required');
  process.exit(1);
}

const horizonModes = collectionPlan.long_horizon_batch.map((entry) => entry.horizon_mode);
for (const mode of ['callback_after_20_scenes', 'callback_after_50_scenes', 'callback_after_100_scenes']) {
  if (!horizonModes.includes(mode)) {
    console.error(`LONG HORIZON BATCH FAIL: missing horizon_mode ${mode}`);
    process.exit(1);
  }
}

if (!recordSpec.timeline_classification.includes('causally_broken_timeline')) {
  console.error('CAUSALLY BROKEN TIMELINE FAIL: causally_broken_timeline required in record spec');
  process.exit(1);
}

if (!recordSpec.classification_reason.includes('memory_recall_match')) {
  console.error('MEMORY RECALL MATCH FAIL: memory_recall_match required in classification_reason');
  process.exit(1);
}

const requiredClassifications = [
  'same_timeline',
  'strict_timeline',
  'similar_timeline',
  'broken_timeline',
  'causally_broken_timeline',
];
for (const classification of requiredClassifications) {
  if (!recordSpec.timeline_classification.includes(classification)) {
    console.error(`CLASSIFICATION FAIL: missing ${classification}`);
    process.exit(1);
  }
}

const requiredReasons = [
  'continuity_match',
  'causal_chain_match',
  'edit_rhythm_match',
  'traceability_match',
  'memory_recall_match',
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
  Object.keys(recordSpec.temporal_evidence_record_format).length === 0
) {
  console.error('CONTRACT/RULES FAIL: collection contract and traceability rules required');
  process.exit(1);
}

if (!collectionPlan.collection_order.includes('long_horizon_batch')) {
  console.error('COLLECTION ORDER FAIL: long_horizon_batch must be in collection_order');
  process.exit(1);
}

process.exit(0);
