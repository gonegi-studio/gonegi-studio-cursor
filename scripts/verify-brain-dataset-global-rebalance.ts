import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBrainDatasetGlobalRebalanceAudit,
  type BrainDatasetRebalanceVerdict,
} from '../services/brainDatasetGlobalRebalanceAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runBrainDatasetGlobalRebalanceAudit(projectRoot);

const verdict: BrainDatasetRebalanceVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_MORI_INTEGRATION_PREP') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
