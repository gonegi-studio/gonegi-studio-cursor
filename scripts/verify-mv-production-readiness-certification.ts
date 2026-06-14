import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import { EXECUTION_SCOPE_TEST_MODE_ONLY } from '../services/mvTestModeExecutionAudit.js';
import {
  MAX_PRODUCTION_READINESS_SCORE,
  MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_GATE_PASS_VERDICT,
  MV_PRODUCTION_READINESS_GATE_REPORT_PATH,
  MV_PRODUCTION_READINESS_GATE_READY_STATUS,
  PRODUCTION_READINESS_TIER_TEST_READY,
} from '../services/mvProductionReadinessGate.js';
import {
  CERTIFICATION_VERSION,
  MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_DIR,
  MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR,
  MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH,
  MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT,
  MV_PRODUCTION_READINESS_CERTIFIED_STATUS,
  MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH,
  MV_TEST_READY_CERTIFIED_STATUS,
  NEXT_STAGE_GATE_LABEL,
  PRODUCTION_BLOCKER_CODES,
  SAFE_CREATE_POLICY,
  writeMvProductionReadinessCertification,
} from '../services/mvProductionReadinessCertification.js';
import { MV_TYPE_COUNT } from '../services/mvProductionSystemFoundation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const gateReportPath = path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_REPORT_PATH);
const gateArtifactPath = path.join(projectRoot, MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH);

if (!fs.existsSync(gateReportPath) || !fs.existsSync(gateArtifactPath)) {
  console.error('PRECHECK FAIL: Missing MV production readiness gate report or artifact');
  process.exit(1);
}

const gateReport = JSON.parse(fs.readFileSync(gateReportPath, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  production_readiness_tier: string;
  next_stage_ready: string;
  mv_production_readiness_gate_ready: string;
};

if (
  gateReport.final_verdict !== MV_PRODUCTION_READINESS_GATE_PASS_VERDICT ||
  gateReport.certification_status !== MV_PRODUCTION_READINESS_GATE_READY_STATUS ||
  gateReport.production_readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  gateReport.next_stage_ready !== 'PASS' ||
  gateReport.mv_production_readiness_gate_ready !== 'PASS'
) {
  console.error(
    `PRECHECK FAIL: ${MV_PRODUCTION_READINESS_GATE_REPORT_PATH} must be ${MV_PRODUCTION_READINESS_GATE_PASS_VERDICT} with ${MV_PRODUCTION_READINESS_GATE_READY_STATUS} and ${PRODUCTION_READINESS_TIER_TEST_READY}`
  );
  process.exit(1);
}

const report = writeMvProductionReadinessCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} test_ready_status=${report.test_ready_status ?? 'NONE'} certification_timestamp=${report.certification_timestamp} certification_version=${report.certification_version} source_readiness_gate_ref=${report.source_readiness_gate_ref} source_count=${report.source_count} adapter_count=${report.adapter_count} readiness_certified=${report.readiness_certified} readiness_score=${report.readiness_score} readiness_tier=${report.readiness_tier ?? 'NONE'} production_blockers_remaining=${report.production_blockers_remaining.length} next_stage_gate_label=${report.next_stage_gate_label ?? 'NONE'} execution_scope=${report.execution_scope} readiness_gate_consumed=${report.readiness_gate_consumed} readiness_certified_status=${report.readiness_certified_status} readiness_score_valid=${report.readiness_score_valid} readiness_tier_valid=${report.readiness_tier_valid} production_blockers_resolved=${report.production_blockers_resolved} certification_version_valid=${report.certification_version_valid} next_stage_gate_label_valid=${report.next_stage_gate_label_valid} test_ready_status_verified=${report.test_ready_status_verified} traceability_preserved=${report.traceability_preserved} safe_create_policy_verified=${report.safe_create_policy_verified} next_stage_ready=${report.next_stage_ready} readiness_not_certified=${report.readiness_not_certified} readiness_score_invalid=${report.readiness_score_invalid} readiness_tier_invalid=${report.readiness_tier_invalid} production_blocker_detected=${report.production_blocker_detected} certification_version_invalid=${report.certification_version_invalid} next_stage_gate_missing=${report.next_stage_gate_missing} test_ready_status_not_verified=${report.test_ready_status_not_verified} readiness_gate_missing=${report.readiness_gate_missing} traceability_loss=${report.traceability_loss} safe_create_policy_violation=${report.safe_create_policy_violation} mv_production_readiness_certification_ready=${report.mv_production_readiness_certification_ready} safe_create_policy=${SAFE_CREATE_POLICY}`
);
for (const blocker of report.production_blockers_remaining) {
  console.log(`  blocker [${blocker.severity}] ${blocker.blocker_code}: ${blocker.message}`);
}
console.log(`report=${MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${MV_PRODUCTION_READINESS_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH}`);
console.log(`artifact=${MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== MV_PRODUCTION_READINESS_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH)) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.certification_checks.length !== 7 ||
  report.readiness_certified !== true ||
  report.readiness_score !== MAX_PRODUCTION_READINESS_SCORE ||
  report.readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  report.certification_version !== CERTIFICATION_VERSION ||
  report.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  report.production_blockers_remaining.length !== PRODUCTION_BLOCKER_CODES.length ||
  report.traceability_chain.length !== MV_TYPE_COUNT ||
  report.execution_scope !== EXECUTION_SCOPE_TEST_MODE_ONLY ||
  report.readiness_gate_consumed !== 'PASS' ||
  report.readiness_certified_status !== 'PASS' ||
  report.readiness_score_valid !== 'PASS' ||
  report.readiness_tier_valid !== 'PASS' ||
  report.production_blockers_resolved !== 'PASS' ||
  report.certification_version_valid !== 'PASS' ||
  report.next_stage_gate_label_valid !== 'PASS' ||
  report.test_ready_status_verified !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.safe_create_policy_verified !== 'PASS' ||
  report.next_stage_ready !== 'PASS' ||
  report.readiness_not_certified !== false ||
  report.readiness_score_invalid !== false ||
  report.readiness_tier_invalid !== false ||
  report.production_blocker_detected !== false ||
  report.certification_version_invalid !== false ||
  report.next_stage_gate_missing !== false ||
  report.test_ready_status_not_verified !== false ||
  report.readiness_gate_missing !== false ||
  report.traceability_loss !== false ||
  report.safe_create_policy_violation !== false ||
  report.mv_production_readiness_certification_ready !== 'PASS' ||
  report.certification_status !== MV_PRODUCTION_READINESS_CERTIFIED_STATUS ||
  report.test_ready_status !== MV_TEST_READY_CERTIFIED_STATUS ||
  report.certification_timestamp.length === 0 ||
  report.certification_checks.every((check) => check.status === 'PASS') === false ||
  report.production_blockers_remaining.every((blocker) =>
    PRODUCTION_BLOCKER_CODES.includes(
      blocker.blocker_code as (typeof PRODUCTION_BLOCKER_CODES)[number]
    )
  ) === false
) {
  console.error(
    'Expected PASS with TEST_READY certification, V1 version, DS_016_ENTRY gate, and next_stage_ready'
  );
  process.exit(1);
}

const artifact = JSON.parse(
  fs.readFileSync(path.join(projectRoot, MV_PRODUCTION_READINESS_CERTIFICATION_ARTIFACT_PATH), 'utf8')
) as {
  source_readiness_gate_ref: string;
  certification_timestamp: string;
  certification_version: string;
  readiness_certified: boolean;
  readiness_score: number;
  readiness_tier: string;
  production_blockers_remaining: unknown[];
  next_stage_gate_label: string;
  readiness_certification_complete: boolean;
  next_stage_ready: boolean;
};

if (
  artifact.source_readiness_gate_ref !== MV_PRODUCTION_READINESS_GATE_ARTIFACT_PATH ||
  artifact.certification_version !== CERTIFICATION_VERSION ||
  artifact.readiness_certified !== true ||
  artifact.readiness_score !== MAX_PRODUCTION_READINESS_SCORE ||
  artifact.readiness_tier !== PRODUCTION_READINESS_TIER_TEST_READY ||
  artifact.next_stage_gate_label !== NEXT_STAGE_GATE_LABEL ||
  artifact.production_blockers_remaining.length !== PRODUCTION_BLOCKER_CODES.length ||
  artifact.readiness_certification_complete !== true ||
  artifact.next_stage_ready !== true ||
  artifact.certification_timestamp.length === 0
) {
  console.error('Artifact fields do not match expected TEST_READY certification output');
  process.exit(1);
}

process.exit(0);
