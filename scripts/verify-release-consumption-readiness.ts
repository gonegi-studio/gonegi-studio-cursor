import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runReleaseConsumptionReadinessAudit,
  type ReleaseConsumptionReadinessAuditResult,
} from '../services/releaseConsumptionReadinessAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runReleaseConsumptionReadinessAudit(projectRoot);

const result: ReleaseConsumptionReadinessAuditResult = report.auditResult;
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
