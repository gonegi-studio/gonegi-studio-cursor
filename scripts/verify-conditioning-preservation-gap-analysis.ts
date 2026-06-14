import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONDITIONING_PRESERVATION_GAP_REPORT_PATH,
  CONDITIONING_PRESERVATION_GAP_ANALYSIS_PASS_VERDICT,
  CONDITIONING_PRESERVATION_GAP_ANALYSIS_STATUS,
  writeConditioningPreservationGapReport,
} from '../services/conditioningPreservationGapAnalysis.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeConditioningPreservationGapReport(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `preservation_gap_analysis_complete=${report.preservation_gap_analysis_complete}`,
    `domains_analyzed=${report.domains_analyzed}`,
    `critical_gap_count=${report.critical_gap_count}`,
    `low_recoverability_count=${report.low_recoverability_count}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const gap of report.gaps) {
  console.log(
    [
      `domain=${gap.domain}`,
      `preservation_score=${gap.preservation_score}`,
      `loss_severity=${gap.loss_severity}`,
      `recoverability=${gap.recoverability}`,
      `recommended_solution=${gap.recommended_solution}`,
    ].join(' | ')
  );
}

if (!fs.existsSync(path.join(projectRoot, CONDITIONING_PRESERVATION_GAP_REPORT_PATH))) {
  console.error(`OUTPUT MISSING: ${CONDITIONING_PRESERVATION_GAP_REPORT_PATH}`);
  process.exit(1);
}

if (report.final_verdict !== CONDITIONING_PRESERVATION_GAP_ANALYSIS_PASS_VERDICT) {
  console.error('CONDITIONING PRESERVATION GAP ANALYSIS FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== CONDITIONING_PRESERVATION_GAP_ANALYSIS_STATUS) {
  console.error(`STATUS FAIL: expected ${CONDITIONING_PRESERVATION_GAP_ANALYSIS_STATUS}`);
  process.exit(1);
}

if (report.domains_analyzed !== 7 || report.gaps.length !== 7) {
  console.error('DOMAIN COUNT FAIL: expected 7 preservation domains');
  process.exit(1);
}

const envGap = report.gaps.find((entry) => entry.domain === 'environment_identity');
if (
  !envGap ||
  envGap.preservation_score !== 0.12 ||
  envGap.loss_severity !== 'CRITICAL' ||
  envGap.recoverability !== 'LOW' ||
  envGap.recommended_solution !== 'environment_reference_bank'
) {
  console.error('ENVIRONMENT IDENTITY GAP FAIL: expected critical low-recoverability profile');
  process.exit(1);
}

process.exit(0);
