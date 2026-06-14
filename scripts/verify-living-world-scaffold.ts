import {
  getCombinedPhase108Verdict,
  runLivingWorldScaffoldAudit,
} from '../services/livingWorldScaffoldAudit.js';
import { runExportRootRelocationAudit } from '../services/exportRootRelocation.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const relocationReport = runExportRootRelocationAudit(projectRoot);
const scaffoldReport = runLivingWorldScaffoldAudit();
const combinedVerdict = getCombinedPhase108Verdict(
  relocationReport.final_verdict,
  scaffoldReport.final_verdict
);

console.log(scaffoldReport.final_verdict);
console.log(combinedVerdict);

if (scaffoldReport.final_verdict !== 'PASS_LIVING_WORLD_SCAFFOLD_READY') {
  for (const violation of scaffoldReport.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
