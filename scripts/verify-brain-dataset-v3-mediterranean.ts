import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runMediterraneanWorldSovereigntyAudit,
  type MediterraneanSovereigntyVerdict,
} from '../services/brainDatasetV3MediterraneanAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runMediterraneanWorldSovereigntyAudit(projectRoot);

const verdict: MediterraneanSovereigntyVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_GONEGI_WORLD_TEST') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
