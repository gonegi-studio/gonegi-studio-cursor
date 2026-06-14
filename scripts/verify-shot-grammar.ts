import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runShotGrammarAudit,
  type ShotGrammarVerdict,
} from '../services/shotGrammarAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runShotGrammarAudit(projectRoot);

const verdict: ShotGrammarVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_CINEMATIC_COVERAGE_GRAMMAR_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
