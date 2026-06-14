import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUDITOR_DASHBOARD_FAIL_VERDICT,
  AUDITOR_DASHBOARD_JSON_PATH,
  AUDITOR_DASHBOARD_MD_PATH,
  AUDITOR_DASHBOARD_PASS_VERDICT,
  UPSTREAM_REPORT_PATHS,
  writeAuditorDashboardSummary,
} from '../services/auditorDashboardSummary.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const rel of UPSTREAM_REPORT_PATHS) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`Missing upstream report: ${rel}`);
    process.exit(1);
  }
}

const { summary } = writeAuditorDashboardSummary(projectRoot);

console.log(summary.final_verdict);
console.log(
  `status=${summary.project_status} aggregate_risk=${summary.aggregate_risk} (${summary.aggregate_risk_level}) critical=${summary.critical_errors}`
);
console.log(
  `calibrated_pass=${summary.calibrated_expected_pass_rate} actual_pass=${summary.actual_pass_rate} safe=${summary.safe_slots.length} watch=${summary.watch_slots.length} skip=${summary.skip_slots.length}`
);
console.log(`json=${AUDITOR_DASHBOARD_JSON_PATH} md=${AUDITOR_DASHBOARD_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, AUDITOR_DASHBOARD_JSON_PATH))) {
  console.error('Dashboard JSON missing after write.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, AUDITOR_DASHBOARD_MD_PATH))) {
  console.error('Dashboard MD missing after write.');
  process.exit(1);
}

if (summary.project_status === 'BLOCKED') {
  console.error('Dashboard status is BLOCKED.');
  process.exit(1);
}

if (summary.calibrated_expected_pass_rate <= 0) {
  console.error('calibrated_expected_pass_rate missing or zero.');
  process.exit(1);
}

if (summary.final_verdict !== AUDITOR_DASHBOARD_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
