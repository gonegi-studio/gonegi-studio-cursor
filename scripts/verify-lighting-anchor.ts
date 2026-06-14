import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runLightingAnchorAudit,
  type LightingAnchorVerdict,
} from '../services/lightingAnchorAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runLightingAnchorAudit(projectRoot);

const verdict: LightingAnchorVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_LIGHTING_ANCHOR_BUNDLE_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
