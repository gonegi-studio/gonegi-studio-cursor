import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  CONDITIONAL_APPROVAL_STATUS_VALID,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  PRODUCTION_CANDIDATE_CERTIFIED_STATUS,
  PRODUCTION_CANDIDATE_VERSION,
  SAFE_CREATE_POLICY,
  writeMvProductionCandidateCertification,
} from '../services/mvProductionCandidateCertification.js';
import {
  EVALUATION_TIER_PRODUCTION_CANDIDATE,
  MV_PRODUCTION_READY_EVALUATED_STATUS,
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT,
  MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
  PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED,
} from '../services/mvProductionReadyEvaluation.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_EVALUATION_SCORE = 92;
const EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT = 3;
const EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT = 0;
const EXPECTED_REMAINING_HIGH_PRIORITY_COUNT = 3;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const evalReportPath = path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_REPORT_PATH);
const evalArtifactPath = path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH);

if (!fs.existsSync(evalReportPath) || !fs.existsSync(evalArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production ready evaluation report or artifact');
  process.exit(1);
}

const evalReport = JSON.parse(fs.readFileSync(evalReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_production_ready_evaluation_ready: string;
  production_ready_decision: string;
  evaluation_tier: string;
  evaluation_score: number;
  high_priority_requirement_count: number;
  unresolved_high_priority_count: number;
};

if (
  evalReport.final_verdict !== MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT ||
  evalReport.certification_status !== MV_PRODUCTION_READY_EVALUATED_STATUS ||
  evalReport.next_stage_ready !== 'PASS' ||
  evalReport.mv_production_ready_evaluation_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_READY_EVALUATION_REPORT_PATH} must be ${MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT} with ${MV_PRODUCTION_READY_EVALUATED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionCandidateCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} certification_id=${report.certification_id} source_evaluation_ref=${report.source_evaluation_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} production_candidate_certified=${report.production_candidate_certified} conditional_approval_status=${report.conditional_approval_status} production_ready_status=${report.production_ready_status} production_candidate_version=${report.production_candidate_version} production_candidate_timestamp=${report.production_candidate_timestamp} resolved_high_priority_count=${report.resolved_high_priority_count} remaining_high_priority_count=${report.remaining_high_priority_count} high_priority_requirement_count=${report.high_priority_requirement_count} evaluation_score=${report.evaluation_score} evaluation_tier=${report.evaluation_tier} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} evaluation_consumed=${report.evaluation_consumed} production_candidate_certified_valid=${report.production_candidate_certified_valid} conditional_approval_valid=${report.conditional_approval_valid} production_candidate_version_valid=${report.production_candidate_version_valid} resolved_high_priority_count_valid=${report.resolved_high_priority_count_valid} remaining_high_priority_count_valid=${report.remaining_high_priority_count_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} production_candidate_not_certified=${report.production_candidate_not_certified} conditional_approval_invalid=${report.conditional_approval_invalid} production_candidate_version_invalid=${report.production_candidate_version_invalid} high_priority_requirement_unresolved=${report.high_priority_requirement_unresolved} evaluation_missing=${report.evaluation_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_candidate_certification_ready=${report.mv_production_candidate_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
console.log(`report=${MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_CANDIDATE_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_CANDIDATE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.certification_checks.length !== 5 ||
  report.production_candidate_certified !== true ||
  report.conditional_approval_status !== CONDITIONAL_APPROVAL_STATUS_VALID ||
  report.production_ready_status !== PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED ||
  report.production_candidate_version !== PRODUCTION_CANDIDATE_VERSION ||
  report.production_candidate_timestamp.length === 0 ||
  report.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  report.high_priority_requirement_count !== EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT ||
  report.evaluation_score !== EXPECTED_EVALUATION_SCORE ||
  report.evaluation_tier !== EVALUATION_TIER_PRODUCTION_CANDIDATE ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.evaluation_consumed !== 'PASS' ||
  report.production_candidate_certified_valid !== 'PASS' ||
  report.conditional_approval_valid !== 'PASS' ||
  report.production_candidate_version_valid !== 'PASS' ||
  report.resolved_high_priority_count_valid !== 'PASS' ||
  report.remaining_high_priority_count_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.production_candidate_not_certified !== false ||
  report.conditional_approval_invalid !== false ||
  report.production_candidate_version_invalid !== false ||
  report.high_priority_requirement_unresolved !== false ||
  report.evaluation_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_candidate_certification_ready !== 'PASS' ||
  report.certification_status !== PRODUCTION_CANDIDATE_CERTIFIED_STATUS ||
  report.next_stage_approved !== true ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.resolved_high_priority_count + report.remaining_high_priority_count !==
    EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT
) {
  console.error(
    'Expected PASS with PRODUCTION_CANDIDATE_CERTIFIED, VALID conditional approval, 0 resolved / 3 remaining HIGH, and DS_021_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_CANDIDATE_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_evaluation_ref: string;
  production_candidate_certified: boolean;
  conditional_approval_status: string;
  production_ready_status: string;
  production_candidate_version: string;
  resolved_high_priority_count: number;
  remaining_high_priority_count: number;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  candidate_certification_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_evaluation_ref !== MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH ||
  artifact.production_candidate_certified !== true ||
  artifact.conditional_approval_status !== CONDITIONAL_APPROVAL_STATUS_VALID ||
  artifact.production_ready_status !== PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED ||
  artifact.production_candidate_version !== PRODUCTION_CANDIDATE_VERSION ||
  artifact.resolved_high_priority_count !== EXPECTED_RESOLVED_HIGH_PRIORITY_COUNT ||
  artifact.remaining_high_priority_count !== EXPECTED_REMAINING_HIGH_PRIORITY_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.candidate_certification_complete !== true ||
  artifact.next_stage_ready !== true
) {
  console.error('Artifact fields do not match expected production candidate certification output');
  process.exit(1);
}

process.exit(0);
