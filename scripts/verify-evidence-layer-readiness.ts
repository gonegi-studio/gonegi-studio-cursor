import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EVIDENCE_LAYER_GAP_REPORT_PATH,
  EVIDENCE_LAYER_READINESS_REPORT_PATH,
  EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT,
  EVIDENCE_LAYER_READINESS_REVIEW_STATUS,
  GPU_AUTHORIZATION_PRECHECK_PATH,
  writeEvidenceLayerReadinessReviewReport,
} from '../services/evidenceLayerReadinessReview.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEvidenceLayerReadinessReviewReport(projectRoot);

const readinessReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, EVIDENCE_LAYER_READINESS_REPORT_PATH), 'utf8')
) as {
  evidence_definition_ready: boolean;
  evidence_collection_ready: boolean;
  evidence_validation_ready: boolean;
  environment_ready: boolean;
  temporal_ready: boolean;
  object_ready: boolean;
  integration_ready: boolean;
  campaign_ready: boolean;
  evidence_gaps: string[];
};

const gapReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, EVIDENCE_LAYER_GAP_REPORT_PATH), 'utf8')
) as {
  gap_report_defined: boolean;
  missing_evidence: string[];
  authorization_risk_score: number;
  authorization_blockers: string[];
};

const gpuPrecheck = JSON.parse(
  fs.readFileSync(path.join(projectRoot, GPU_AUTHORIZATION_PRECHECK_PATH), 'utf8')
) as {
  gpu_precheck_defined: boolean;
  gpu_execution_allowed: boolean;
  evidence_sufficient: boolean;
  authorization_ready: boolean;
  authorization_failure_reasons: string[];
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `evidence_layer_contract_defined=${report.evidence_layer_contract_defined}`,
    `evidence_requirements_defined=${report.evidence_requirements_defined}`,
    `sufficiency_rules_defined=${report.sufficiency_rules_defined}`,
    `readiness_report_defined=${report.readiness_report_defined}`,
    `gap_report_defined=${report.gap_report_defined}`,
    `gpu_precheck_defined=${report.gpu_precheck_defined}`,
    `evidence_definition_ready=${report.evidence_definition_ready}`,
    `evidence_collection_ready=${report.evidence_collection_ready}`,
    `evidence_validation_ready=${report.evidence_validation_ready}`,
    `environment_ready=${readinessReport.environment_ready}`,
    `integration_ready=${readinessReport.integration_ready}`,
    `campaign_ready=${readinessReport.campaign_ready}`,
    `authorization_risk_score=${gapReport.authorization_risk_score}`,
    `gpu_execution_allowed=${gpuPrecheck.gpu_execution_allowed}`,
    `evidence_sufficient=${gpuPrecheck.evidence_sufficient}`,
    `gpu_authorized=${report.gpu_authorized}`,
  ].join(' | ')
);

for (const rel of [
  EVIDENCE_LAYER_READINESS_REPORT_PATH,
  EVIDENCE_LAYER_GAP_REPORT_PATH,
  GPU_AUTHORIZATION_PRECHECK_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT) {
  console.error('EVIDENCE LAYER READINESS REVIEW FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== EVIDENCE_LAYER_READINESS_REVIEW_STATUS) {
  console.error(`STATUS FAIL: expected ${EVIDENCE_LAYER_READINESS_REVIEW_STATUS}`);
  process.exit(1);
}

if (
  !report.evidence_layer_contract_defined ||
  !report.evidence_requirements_defined ||
  !report.sufficiency_rules_defined ||
  !report.readiness_report_defined ||
  !report.gap_report_defined ||
  !report.gpu_precheck_defined ||
  !report.evidence_definition_ready ||
  report.evidence_collection_ready !== false ||
  report.evidence_validation_ready !== false
) {
  console.error('PASS CONDITION FAIL: evidence layer readiness checks not met');
  process.exit(1);
}

if (
  readinessReport.evidence_definition_ready !== true ||
  readinessReport.evidence_collection_ready !== false ||
  readinessReport.evidence_validation_ready !== false
) {
  console.error('READINESS REPORT FAIL: definition=true, collection=false, validation=false required');
  process.exit(1);
}

if (
  report.gpu_execution_allowed ||
  report.gpu_authorized ||
  report.gpu_validation_executed ||
  gpuPrecheck.gpu_execution_allowed ||
  gpuPrecheck.evidence_sufficient ||
  gpuPrecheck.authorization_ready
) {
  console.error('AUTHORIZATION SCOPE FAIL: GPU must not be authorized or execution allowed');
  process.exit(1);
}

if (gapReport.authorization_risk_score !== 0.82) {
  console.error('GAP REPORT FAIL: authorization_risk_score=0.82 required');
  process.exit(1);
}

const requiredFailureReasons = [
  'environment_evidence_not_collected',
  'temporal_evidence_not_collected',
  'object_evidence_not_collected',
];
for (const reason of requiredFailureReasons) {
  if (!gpuPrecheck.authorization_failure_reasons.includes(reason)) {
    console.error(`AUTHORIZATION FAILURE REASON MISSING: ${reason}`);
    process.exit(1);
  }
}

if (
  !readinessReport.environment_ready ||
  !readinessReport.temporal_ready ||
  !readinessReport.object_ready ||
  !readinessReport.integration_ready ||
  !readinessReport.campaign_ready
) {
  console.error('CHANNEL READINESS FAIL: all channels must report ready at definition layer');
  process.exit(1);
}

if (readinessReport.evidence_gaps.length === 0 || gapReport.missing_evidence.length === 0) {
  console.error('GAP REPORT FAIL: evidence_gaps and missing_evidence required');
  process.exit(1);
}

process.exit(0);
