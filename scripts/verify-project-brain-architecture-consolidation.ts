import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_ARCHITECTURE_CONSOLIDATION_PASS_VERDICT,
  buildProjectBrainArchitectureReport,
} from '../services/ProjectBrainArchitectureValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainArchitectureReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nAudited files: ${report.audited_files.length}`);
console.log(`Import edges: ${report.graph?.edges.length ?? 0}`);
console.log(`Cycle check: ${report.cycle_check?.ok ? 'no cycles' : `CYCLE: ${report.cycle_check?.cycle?.join(' -> ')}`}`);

console.log('\nDuplicate block report:');
console.log(`  block: ${report.duplicate_report?.block_name}`);
console.log(`  files containing block: ${report.duplicate_report?.files_containing_block}`);
console.log(`  largest identical group (${report.duplicate_report?.largest_identical_group.length} files):`);
report.duplicate_report?.largest_identical_group.forEach((f) => console.log(`    - ${f}`));

console.log('\nResponsibility audit:');
console.log(`  ${report.responsibility_audit?.files_with_early_doc_comment}/${report.responsibility_audit?.files_checked} (${report.responsibility_audit?.percentage}%) files carry an early doc comment`);
if ((report.responsibility_audit?.files_missing.length ?? 0) > 0) {
  console.log('  missing doc comment:');
  report.responsibility_audit?.files_missing.forEach((f) => console.log(`    - ${f}`));
}

if (report.verdict !== PROJECT_BRAIN_ARCHITECTURE_CONSOLIDATION_PASS_VERDICT) {
  console.error(`PROJECT BRAIN ARCHITECTURE CONSOLIDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
