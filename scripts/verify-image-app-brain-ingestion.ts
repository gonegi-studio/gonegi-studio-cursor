import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runImageAppBrainIngestionAudit,
  type ImageAppBrainIngestionVerdict,
} from '../services/imageAppBrainIngestionAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runImageAppBrainIngestionAudit(projectRoot);

const verdict: ImageAppBrainIngestionVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_IMAGE_APP_UPLOAD') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
