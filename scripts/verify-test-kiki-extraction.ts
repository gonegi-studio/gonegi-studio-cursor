import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runTestKikiExtractionAudit } from '../services/testKikiExtractionExport.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runTestKikiExtractionAudit(projectRoot);

console.log(report.auditResult);

if (report.auditResult !== 'PASS') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
