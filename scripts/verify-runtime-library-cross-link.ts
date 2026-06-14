import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runRuntimeLibraryCrossLinkAudit,
  writeRuntimeLibraryCrossLinkReport,
  type RuntimeLibraryCrossLinkAuditResult,
} from '../services/runtimeLibraryCrossLinkAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runRuntimeLibraryCrossLinkAudit(projectRoot);
writeRuntimeLibraryCrossLinkReport(projectRoot, report);

const result: RuntimeLibraryCrossLinkAuditResult = report.auditResult;
console.log(result);

if (result !== 'PASS') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
