import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_REAL_DEVELOPMENT_PASS_VERDICT,
  buildProjectBrainRealDevelopmentReport,
} from '../services/ProjectBrainRealDevelopmentValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainRealDevelopmentReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);

console.log(`\nRequest: "${report.result?.request_analysis.raw_query}"`);
console.log(`  matched capabilities: ${report.result?.request_analysis.matched_capability_names.length}`);
console.log(`  matched services: ${report.result?.request_analysis.matched_service_relpaths.length}`);

console.log('\nFile Selection:');
console.log(`  ok=${report.result?.file_selection.ok} selected=${report.result?.file_selection.selected_service_relpath}`);
console.log(`  reason: ${report.result?.file_selection.reason}`);

console.log('\nImpact:');
console.log(`  impacted_capability_count=${report.result?.impact?.impacted_capability_count}`);

console.log('\nVerification Plan:');
console.log(`  total_count=${report.result?.verification_plan?.total_count}`);
report.result?.verification_plan?.items.slice(0, 5).forEach((item) => console.log(`  - ${item.npm_command}`));

if (report.verdict !== PROJECT_BRAIN_REAL_DEVELOPMENT_PASS_VERDICT) {
  console.error(`PROJECT BRAIN REAL DEVELOPMENT: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
