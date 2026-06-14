import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runImageAppExportGovernanceAudit,
  type ImageAppExportGovernanceVerdict,
} from '../services/imageAppExportGovernance.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runImageAppExportGovernanceAudit(projectRoot);

const verdict: ImageAppExportGovernanceVerdict = report.final_verdict;
console.log(verdict);
console.log(`latest_files=${report.latest_policy.files_present.join(', ')}`);
console.log(`test_batches=${report.test_batches.files_in_test_batches.join(', ')}`);

if (verdict !== 'PASS_IMAGE_APP_EXPORT_GOVERNANCE_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
