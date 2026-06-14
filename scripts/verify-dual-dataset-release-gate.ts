import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runDualDatasetReleaseGate,
  type DualDatasetReleaseGateResult,
} from '../services/dualDatasetReleaseGate.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runDualDatasetReleaseGate(projectRoot);

const result: DualDatasetReleaseGateResult = report.auditResult;
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
