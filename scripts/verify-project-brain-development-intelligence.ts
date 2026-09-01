import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PASS_VERDICT,
  buildProjectBrainDevelopmentIntelligenceReport,
} from '../services/ProjectBrainDevelopmentIntelligenceValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainDevelopmentIntelligenceReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);

console.log('\nImpact Analysis — top 10 most-impactful real services:');
report.result?.top_service_impacts.forEach((i) => console.log(`  ${i.impacted_capability_count}x impacted capabilities  ${i.service_relpath}`));

console.log('\nPriority Report — refined Development Priority (missing_count + recency):');
report.result?.refined_priorities.forEach((p) =>
  console.log(`  #${p.rank} ${p.group_key} (missing=${p.missing_count}, recency_rank=${p.recency_rank}, score=${p.priority_score})`)
);

console.log('\nGenerated Tasks:');
report.result?.generated_tasks.forEach((t) => {
  console.log(`  ${t.goal.goal_id}: ready=${t.planning.ready} execution_order=[${t.planning.execution_plan?.execution_order.join(', ')}]`);
});

if (report.verdict !== PROJECT_BRAIN_DEVELOPMENT_INTELLIGENCE_PASS_VERDICT) {
  console.error(`PROJECT BRAIN DEVELOPMENT INTELLIGENCE: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
