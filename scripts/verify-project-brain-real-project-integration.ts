import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PASS_VERDICT,
  buildProjectBrainRepositoryReport,
} from '../services/ProjectBrainRepositoryValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainRepositoryReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nRepository Index: ${report.index?.verify_scripts.length ?? 0} real verify:* entries (built in ${elapsedMs}ms)`);
console.log(`Capability Mappings: ${report.capability_mappings.length}`);

console.log('\nTop 15 most-referenced real service files (Dependency Mapping):');
report.dependency_mapping.slice(0, 15).forEach((d) => console.log(`  ${d.referenced_by_script_count}x  ${d.service_relpath}`));

console.log('\nQuery demo — capabilities matching "project-brain":');
report.index &&
  report.index.verify_scripts
    .filter((e) => e.name.includes('project-brain'))
    .forEach((e) => console.log(`  ${e.name} (exists=${e.script_exists})`));

if (report.verdict !== PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PASS_VERDICT) {
  console.error(`PROJECT BRAIN REAL PROJECT INTEGRATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
