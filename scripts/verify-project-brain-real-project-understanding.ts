import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_PROJECT_UNDERSTANDING_PASS_VERDICT,
  buildProjectBrainProjectUnderstandingReport,
} from '../services/ProjectBrainProjectUnderstandingValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainProjectUnderstandingReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);

console.log('\nCurrent Project State / Development Stage — top 15 domains by capability count:');
report.result?.domain_stats.slice(0, 15).forEach((d) => {
  console.log(`  ${d.capability_count}x  ${d.domain}  (most recent activity: ${d.most_recent_mtime_iso ?? 'unknown'})`);
});

console.log('\nMissing Component Analysis — groups:');
report.result?.missing_component_groups.forEach((g) => console.log(`  ${g.missing_count}x  ${g.group_key}  e.g. [${g.sample_services.join(', ')}]`));

console.log('\nNext Development Priority:');
report.result?.development_priorities.forEach((p) => console.log(`  #${p.rank} ${p.group_key} (missing=${p.missing_count}): ${p.recommended_action}`));

if (report.verdict !== PROJECT_BRAIN_PROJECT_UNDERSTANDING_PASS_VERDICT) {
  console.error(`PROJECT BRAIN PROJECT UNDERSTANDING: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
