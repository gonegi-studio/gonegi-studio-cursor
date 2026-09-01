import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_SELF_IMPROVEMENT_PASS_VERDICT,
  buildProjectBrainSelfImprovementReport,
} from '../services/ProjectBrainSelfImprovementValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainSelfImprovementReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nGaps:');
report.result?.gaps.forEach((g) => {
  console.log(`  [${g.severity}] ${g.gap_id} (blocking=${g.blocking_task_count}): ${g.description}`);
});

console.log('\nWeaknesses:');
report.result?.weaknesses.forEach((w) => {
  console.log(`  [${w.severity}] ${w.weakness_id}: ${w.description}`);
});

console.log('\nImprovement plan:');
report.result?.plan.forEach((item) => {
  console.log(`  #${item.rank} [${item.kind}] ${item.source_id} (score=${item.priority_score}): ${item.recommended_action}`);
});

if (report.verdict !== PROJECT_BRAIN_SELF_IMPROVEMENT_PASS_VERDICT) {
  console.error(`PROJECT BRAIN SELF IMPROVEMENT FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
