import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS,
  MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH,
} from '../services/mvProductionBlockerResolutionCertification.js';
import {
  EVALUATION_TIER_PRODUCTION_CANDIDATE,
  MV_PRODUCTION_READY_EVALUATED_STATUS,
  MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH,
  MV_PRODUCTION_READY_EVALUATION_DIR,
  MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR,
  MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH,
  MV_PRODUCTION_READY_EVALUATION_MD_PATH,
  MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT,
  MV_PRODUCTION_READY_EVALUATION_REPORT_PATH,
  NEXT_STAGE_GATE_LABEL,
  PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED,
  SAFE_CREATE_POLICY,
  writeMvProductionReadyEvaluation,
} from '../services/mvProductionReadyEvaluation.js';
import { PRODUCTION_READINESS_TIER_PRODUCTION_READY } from '../services/mvProductionReadinessGate.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_EVALUATION_SCORE = 92;
const EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT = 3;
const EXPECTED_UNRESOLVED_HIGH_PRIORITY_COUNT = 3;
const EXPECTED_REMAINING_BLOCKER_COUNT = 6;
const EXPECTED_CRITICAL_BLOCKER_COUNT = 0;
const EXPECTED_PRODUCTION_READY_REQUIREMENTS_COUNT = 6;

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const certReportPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH);
const certArtifactPath = path.join(projectRoot, MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH);

if (!fs.existsSync(certReportPath) || !fs.existsSync(certArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production blocker resolution certification report or artifact');
  process.exit(1);
}

const certReport = JSON.parse(fs.readFileSync(certReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  next_stage_ready: string;
  mv_production_blocker_resolution_certification_ready: string;
  remaining_blocker_count: number;
  resolution_priority: { HIGH: number };
};

if (
  certReport.final_verdict !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT ||
  certReport.certification_status !== MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS ||
  certReport.next_stage_ready !== 'PASS' ||
  certReport.mv_production_blocker_resolution_certification_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_REPORT_PATH} must be ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_PASS_VERDICT} with ${MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFIED_STATUS}`
  );
  process.exit(1);
}

const report = writeMvProductionReadyEvaluation(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} evaluation_id=${report.evaluation_id} source_resolution_certification_ref=${report.source_resolution_certification_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} production_ready_decision=${report.production_ready_decision} evaluation_score=${report.evaluation_score} evaluation_tier=${report.evaluation_tier} high_priority_requirement_count=${report.high_priority_requirement_count} unresolved_high_priority_count=${report.unresolved_high_priority_count} remaining_blocker_count=${report.remaining_blocker_count} critical_blocker_count=${report.critical_blocker_count} next_stage_gate_label=${report.next_stage_gate_label} execution_scope=${report.execution_scope} resolution_certification_consumed=${report.resolution_certification_consumed} evaluation_score_valid=${report.evaluation_score_valid} evaluation_tier_valid=${report.evaluation_tier_valid} high_priority_requirement_count_valid=${report.high_priority_requirement_count_valid} production_ready_decision_valid=${report.production_ready_decision_valid} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} next_stage_approved=${report.next_stage_approved} evaluation_score_invalid=${report.evaluation_score_invalid} evaluation_tier_invalid=${report.evaluation_tier_invalid} high_priority_requirement_unresolved=${report.high_priority_requirement_unresolved} production_ready_decision_invalid=${report.production_ready_decision_invalid} resolution_certification_missing=${report.resolution_certification_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_ready_evaluation_ready=${report.mv_production_ready_evaluation_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const requirement of report.high_priority_requirements) {
  console.log(
    `  requirement ${requirement.requirement_id} [${requirement.blocker_code}] resolved=${requirement.resolved}`
  );
}
console.log(`report=${MV_PRODUCTION_READY_EVALUATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_READY_EVALUATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READY_EVALUATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.evaluation_checks.length !== 4 ||
  report.production_ready_decision !== PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED ||
  report.evaluation_score !== EXPECTED_EVALUATION_SCORE ||
  report.evaluation_tier !== EVALUATION_TIER_PRODUCTION_CANDIDATE ||
  report.high_priority_requirement_count !== EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT ||
  report.unresolved_high_priority_count !== EXPECTED_UNRESOLVED_HIGH_PRIORITY_COUNT ||
  report.remaining_blocker_count !== EXPECTED_REMAINING_BLOCKER_COUNT ||
  report.critical_blocker_count !== EXPECTED_CRITICAL_BLOCKER_COUNT ||
  report.high_priority_requirements.length !== EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.resolution_certification_consumed !== 'PASS' ||
  report.evaluation_score_valid !== 'PASS' ||
  report.evaluation_tier_valid !== 'PASS' ||
  report.high_priority_requirement_count_valid !== 'PASS' ||
  report.production_ready_decision_valid !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.evaluation_score_invalid !== false ||
  report.evaluation_tier_invalid !== false ||
  report.high_priority_requirement_unresolved !== false ||
  report.production_ready_decision_invalid !== false ||
  report.resolution_certification_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_ready_evaluation_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READY_EVALUATED_STATUS ||
  report.next_stage_approved !== true ||
  report.evaluation_checks.every((check) => check.status === 'PASS') === false ||
  report.high_priority_requirements.every((req) => req.resolved === false) === false
) {
  console.error(
    'Expected PASS with CONDITIONAL_APPROVED, score 92, PRODUCTION_CANDIDATE tier, 3 HIGH requirements, and DS_020_ENTRY gate'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READY_EVALUATION_ARTIFACT_PATH), 'utf8')
) as {
  source_resolution_certification_ref: string;
  production_ready_decision: string;
  evaluation_score: number;
  evaluation_tier: string;
  high_priority_requirement_count: number;
  target_readiness_tier: string;
  next_stage_gate_label: string;
  evaluation_complete: boolean;
  next_stage_ready: boolean;
  production_ready_requirements: string[];
};

if (
  artifact.source_resolution_certification_ref !==
    MV_PRODUCTION_BLOCKER_RESOLUTION_CERTIFICATION_ARTIFACT_PATH ||
  artifact.production_ready_decision !== PRODUCTION_READY_DECISION_CONDITIONAL_APPROVED ||
  artifact.evaluation_score !== EXPECTED_EVALUATION_SCORE ||
  artifact.evaluation_tier !== EVALUATION_TIER_PRODUCTION_CANDIDATE ||
  artifact.high_priority_requirement_count !== EXPECTED_HIGH_PRIORITY_REQUIREMENT_COUNT ||
  artifact.target_readiness_tier !== PRODUCTION_READINESS_TIER_PRODUCTION_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.evaluation_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.production_ready_requirements.length !== EXPECTED_PRODUCTION_READY_REQUIREMENTS_COUNT
) {
  console.error('Artifact fields do not match expected production ready evaluation output');
  process.exit(1);
}

process.exit(0);
