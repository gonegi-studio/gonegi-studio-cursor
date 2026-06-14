import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACTIVE_ASSETS_REGISTRY_PATH,
  ASSET_LIFECYCLE_REGISTRY_PATH,
  PROJECT_GOVERNANCE_DIR,
  PROJECT_GOVERNANCE_RULES_PATH,
  PROJECT_INVENTORY_REPORT_PATH,
} from '../services/projectInventoryBuilder.js';
import {
  PROJECT_GOVERNANCE_PASS_VERDICT,
  PROJECT_GOVERNANCE_REPORT_PATH,
  writeProjectGovernanceReports,
} from '../services/projectGovernanceAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const { inventory, governance } = writeProjectGovernanceReports(projectRoot);

console.log(governance.final_verdict);
console.log(
  [
    `validation_passed=${governance.validation_passed}`,
    `governance_system_active=${governance.governance_system_active}`,
    `inventory_tracking_active=${governance.inventory_tracking_active}`,
    `lifecycle_tracking_active=${governance.lifecycle_tracking_active}`,
    `future_pollution_prevented=${governance.future_pollution_prevented}`,
    `source_of_truth_rule=${governance.checks.source_of_truth_rule}`,
    `active_export_version_rule=${governance.checks.active_export_version_rule}`,
    `duplicate_exports=${governance.checks.duplicate_exports}`,
    `duplicate_builders=${governance.checks.duplicate_builders}`,
    `total_assets=${governance.metrics.total_assets}`,
    `tracked_assets=${governance.metrics.tracked_assets}`,
    `untracked_assets=${governance.metrics.untracked_assets}`,
    `orphan_assets=${governance.metrics.orphan_assets}`,
    `duplicate_assets=${governance.metrics.duplicate_assets}`,
    `legacy_assets=${governance.metrics.legacy_assets}`,
    `governance_score=${governance.metrics.governance_score}`,
    `active_export_count=${governance.metrics.active_export_count}`,
    `legacy_export_count=${governance.metrics.legacy_export_count}`,
  ].join(' | ')
);

for (const rel of [
  PROJECT_GOVERNANCE_RULES_PATH,
  ACTIVE_ASSETS_REGISTRY_PATH,
  ASSET_LIFECYCLE_REGISTRY_PATH,
  PROJECT_INVENTORY_REPORT_PATH,
  PROJECT_GOVERNANCE_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, PROJECT_GOVERNANCE_DIR))) {
  console.error(`OUTPUT MISSING: ${PROJECT_GOVERNANCE_DIR}/`);
  process.exit(1);
}

if (governance.final_verdict !== PROJECT_GOVERNANCE_PASS_VERDICT) {
  console.error('PROJECT GOVERNANCE AUDIT FAILED');
  for (const issue of governance.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (governance.issues.length > 20) {
    console.error(`... and ${governance.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
