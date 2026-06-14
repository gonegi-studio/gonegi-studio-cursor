import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from '../services/movieAnalysisLevel2MasterCertificationV3.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_DIR,
  LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR,
  LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH,
  LEVEL2_COMPLETENESS_AUDIT_MD_PATH,
  LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_GAP_AUDIT_COUNT,
  writeMovieAnalysisLevel2CompletenessAudit,
} from '../services/movieAnalysisLevel2CompletenessAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const EXPECTED_GAP_COUNT = 5;
const EXPECTED_GAPS = [
  'Character Evolution',
  'Relationship Evolution',
  'World State Memory',
  'Long Form Narrative',
  'Production Scale',
];

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const v3Path = path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);
if (!fs.existsSync(v3Path)) {
  console.error(`PRECHECK FAIL: Missing required upstream asset: ${LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH}`);
  process.exit(1);
}

const v3Report = JSON.parse(fs.readFileSync(v3Path, 'utf8')) as {
  final_verdict: string;
  certification_status: string | null;
  level2_master_certification_v3_ready: string;
};

if (v3Report.final_verdict !== LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT) {
  console.error(`PRECHECK FAIL: ${LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH} must be ${LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT}`);
  process.exit(1);
}

if (v3Report.certification_status !== LEVEL2_COMPLETE_STATUS) {
  console.error(`PRECHECK FAIL: Level2 master certification V3 status must be ${LEVEL2_COMPLETE_STATUS}`);
  process.exit(1);
}

if (v3Report.level2_master_certification_v3_ready !== 'PASS') {
  console.error('PRECHECK FAIL: level2_master_certification_v3_ready must be PASS');
  process.exit(1);
}

const report = writeMovieAnalysisLevel2CompletenessAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} gap_count=${report.gap_count} level3_entry_ready=${report.level3_entry_ready} level2_complete_claim_validated=${report.level2_complete_claim_validated} audit_failure=${report.audit_failure} level2_completeness_audit_ready=${report.level2_completeness_audit_ready}`
);
for (const gap of report.gaps) {
  console.log(`  gap: ${gap}`);
}
for (const audit of report.gap_audits) {
  console.log(`  ${audit.audit_id}: has_gap=${audit.has_gap} category=${audit.gap_category}`);
}
console.log(`report=${LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH}`);
console.log(`markdown=${LEVEL2_COMPLETENESS_AUDIT_MD_PATH}`);
console.log(`manifest=${LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT) {
  console.error(`Expected verdict ${LEVEL2_COMPLETENESS_AUDIT_PASS_WITH_GAPS_VERDICT}`);
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, LEVEL2_COMPLETENESS_AUDIT_EXPORT_DIR, 'level2-completeness-audit.json')
  ) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_gap_audit_count !== LEVEL2_GAP_AUDIT_COUNT ||
  report.gap_count !== EXPECTED_GAP_COUNT ||
  report.gaps.length !== EXPECTED_GAP_COUNT ||
  EXPECTED_GAPS.every((gap) => report.gaps.includes(gap)) === false ||
  report.level3_entry_ready !== false ||
  report.level2_complete_claim_validated !== true ||
  report.audit_failure !== false ||
  report.level2_completeness_audit_ready !== 'PASS' ||
  report.certification_status !== null ||
  report.gap_audits.length !== LEVEL2_GAP_AUDIT_COUNT ||
  report.gap_audits.filter((audit) => audit.has_gap).length !== EXPECTED_GAP_COUNT
) {
  console.error(
    'Expected PASS_WITH_GAPS with 5 known Level2 gaps and Level3 entry blocked until gaps are closed'
  );
  process.exit(1);
}

process.exit(0);
