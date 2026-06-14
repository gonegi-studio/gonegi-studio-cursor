import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBrainDatasetV3MoriMergeAudit,
  type BrainDatasetV3Verdict,
} from '../services/brainDatasetV3MoriMergeAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runBrainDatasetV3MoriMergeAudit(projectRoot);

const verdict: BrainDatasetV3Verdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_IMAGE_APP_V3_TEST') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
