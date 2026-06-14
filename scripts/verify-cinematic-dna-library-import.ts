import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runCinematicDnaLibraryAudit,
  type CinematicDnaLibraryVerdict,
} from '../services/cinematicDnaLibraryAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runCinematicDnaLibraryAudit(projectRoot);

const verdict: CinematicDnaLibraryVerdict = report.final_verdict;
console.log(verdict);

if (verdict !== 'PASS_FOR_CINEMATIC_DNA_LAB_UPLOAD') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
