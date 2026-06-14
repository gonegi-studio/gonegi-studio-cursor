import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASE_PIPELINE_JSON_PATH } from '../services/auditorReleasePipeline.js';
import {
  LATEST_STABLE_ALIAS_PATH,
  MEMORY_BASELINE_MD_PATH,
  MEMORY_BASELINE_PASS_VERDICT,
  MEMORY_BASELINE_REPORT_PATH,
  MEMORY_SNAPSHOT_DIR,
  validateComparisonUtility,
  writeProjectMemoryBaselineReport,
} from '../services/projectMemoryBaseline.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!fs.existsSync(path.join(projectRoot, RELEASE_PIPELINE_JSON_PATH))) {
  console.error(`Missing upstream release pipeline report: ${RELEASE_PIPELINE_JSON_PATH}`);
  console.error('Run npm run verify:auditor-release-pipeline first.');
  process.exit(1);
}

const utilityCheck = validateComparisonUtility();
if (!utilityCheck.pass) {
  for (const v of utilityCheck.violations) console.error(v);
  process.exit(1);
}

const report = writeProjectMemoryBaselineReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `baseline_id=${report.baseline_id} release=${report.current_release_status} risk=${report.current_risk} alias_updated=${report.stable_alias_updated}`
);
console.log(`snapshot=${report.snapshot_path} alias=${report.alias_path}`);
if (report.comparison_to_previous_if_exists) {
  const cmp = report.comparison_to_previous_if_exists;
  console.log(
    `comparison: risk_delta=${cmp.risk_delta.aggregate_risk} hash_changes=${cmp.file_hash_changes.length} new_warnings=${cmp.new_warnings.length}`
  );
} else {
  console.log('comparison: none (first baseline or same-day overwrite)');
}
console.log(`json=${MEMORY_BASELINE_REPORT_PATH} md=${MEMORY_BASELINE_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, report.snapshot_path))) {
  console.error('Timestamped baseline snapshot missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, LATEST_STABLE_ALIAS_PATH))) {
  console.error('latest-stable-baseline.json alias missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MEMORY_BASELINE_REPORT_PATH))) {
  console.error('Project memory baseline report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MEMORY_BASELINE_MD_PATH))) {
  console.error('Project memory baseline markdown missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, MEMORY_SNAPSHOT_DIR))) {
  console.error('auditor_memory directory missing.');
  process.exit(1);
}

if (report.final_verdict !== MEMORY_BASELINE_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
