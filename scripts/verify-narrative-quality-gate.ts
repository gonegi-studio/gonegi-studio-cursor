import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runNarrativeQualityGate,
  type NarrativeQualityGateAuditResult,
} from '../services/narrativeQualityGate.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runNarrativeQualityGate(projectRoot);

const result: NarrativeQualityGateAuditResult = report.auditResult;
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
