import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runHarborCalibrationAudit,
  type HarborCalibrationVerdict,
} from '../services/brainDatasetV3HarborCalibrationAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runHarborCalibrationAudit(projectRoot);

const verdict: HarborCalibrationVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_IMAGE_APP_WORLD_TEST') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
