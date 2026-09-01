import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_INTELLIGENCE_PASS_VERDICT,
  buildProjectBrainIntelligenceReport,
} from '../services/ProjectBrainIntelligenceValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainIntelligenceReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nSemantic classifications:');
report.semantic_classifications.forEach((c) => {
  console.log(`  ${c.task_id}: [${c.tags.join(', ') || '(none)'}]`);
});

console.log('\nLearning queue:');
report.learning_events.forEach((e) => {
  console.log(`  #${e.sequence} ${e.event_id}: ${e.detail}`);
});

console.log('\nKnowledge evolution diff (before -> after, same run):');
const changeCounts = report.real_evolution_diff.reduce<Record<string, number>>((acc, d) => {
  acc[d.change] = (acc[d.change] ?? 0) + 1;
  return acc;
}, {});
console.log(`  ${JSON.stringify(changeCounts)}`);

if (report.verdict !== PROJECT_BRAIN_INTELLIGENCE_PASS_VERDICT) {
  console.error(`PROJECT BRAIN INTELLIGENCE FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
