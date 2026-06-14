import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBrainDatasetV2MergeAudit,
  type BrainDatasetV2Verdict,
} from '../services/brainDatasetV2MergeAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runBrainDatasetV2MergeAudit(projectRoot);

const verdict: BrainDatasetV2Verdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_IMAGE_APP_V2_TEST') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
