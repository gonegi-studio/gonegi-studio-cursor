import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runBalladMvAudit, type BalladMvVerdict } from '../services/balladMvDatasetAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runBalladMvAudit(projectRoot);

const verdict: BalladMvVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_BALLAD_MV_DATASET_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
