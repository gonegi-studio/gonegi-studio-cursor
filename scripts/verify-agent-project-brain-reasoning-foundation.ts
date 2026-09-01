import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_REASONING_PASS_VERDICT,
  buildProjectBrainReasoningReport,
} from '../services/ProjectBrainReasoningValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainReasoningReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nCapability query:');
report.reasoning?.capabilities.forEach((c) => {
  console.log(`  ${c.capability_id}: ${c.providers.map((p) => `${p.provider}:${p.credential_present}`).join(', ')}`);
});

console.log('\nGoal reasoning:');
report.reasoning?.goals.forEach((g) => {
  console.log(`  ${g.goal_id}: fully_agent_completable=${g.blockers.fully_agent_completable}`);
  g.blockers.blocked_tasks.forEach((b) => {
    console.log(`    - ${b.task_id} blocked by [${b.blocking_task_ids.join(', ')}]`);
  });
});

if (report.verdict !== PROJECT_BRAIN_REASONING_PASS_VERDICT) {
  console.error(`PROJECT BRAIN REASONING FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
