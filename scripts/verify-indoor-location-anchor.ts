import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runIndoorLocationAnchorAudit,
  type IndoorLocationAnchorVerdict,
} from '../services/indoorLocationAnchorAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runIndoorLocationAnchorAudit(projectRoot);

const verdict: IndoorLocationAnchorVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_INDOOR_LOCATION_ANCHOR_SYSTEM_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
