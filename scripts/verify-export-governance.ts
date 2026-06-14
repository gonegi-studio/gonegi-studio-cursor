import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runExportGovernanceAudit,
  type ExportGovernanceVerdict,
} from '../services/exportGovernanceAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runExportGovernanceAudit(projectRoot);

const verdict: ExportGovernanceVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_EXPORT_GOVERNANCE_READY') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
