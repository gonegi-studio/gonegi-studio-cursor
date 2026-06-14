import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runExportRootRelocationAudit } from '../services/exportRootRelocation.js';
import { runLivingWorldScaffoldAudit } from '../services/livingWorldScaffoldAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const report = runExportRootRelocationAudit(scriptDir);
const scaffoldReport = runLivingWorldScaffoldAudit();

console.log('1. process.cwd():', report.diagnostics.process_cwd);
console.log('2. resolved project root:', report.project_root);
console.log('3. resolved export root:', report.exports_root);
console.log('4. exports/image_app/latest files:', report.image_app_latest_files.join(', '));
console.log(
  '5. cinematic-dna-library-import.json:',
  report.required_latest_files.cinematic_dna.absolute_path
);

console.log(report.final_verdict);

if (report.final_verdict !== 'PASS_PROJECT_ROOT_CORRECTED') {
  for (const violation of report.violations) {
    console.error(`RELOCATION: ${violation}`);
  }
  process.exit(1);
}

if (scaffoldReport.final_verdict !== 'PASS_LIVING_WORLD_SCAFFOLD_READY') {
  for (const violation of scaffoldReport.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
