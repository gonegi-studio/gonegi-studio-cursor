import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_INTEGRATION_PASS_VERDICT,
  buildAgentIntegrationValidation,
} from '../services/AgentIntegrationValidator.js';
import type { PlanningGoal, PlanningTaskInput } from '../services/ProjectPlanningEngine.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const GOALS_DIR = path.join(projectRoot, 'datasets/agent_planning/goals');

function loadGoals(): Array<{ goal: PlanningGoal; tasks: PlanningTaskInput[] }> {
  const files = fs.readdirSync(GOALS_DIR).filter((f) => f.endsWith('.json'));
  return files.sort().map((file) => {
    const raw = JSON.parse(fs.readFileSync(path.join(GOALS_DIR, file), 'utf8')) as {
      goal: PlanningGoal;
      tasks: PlanningTaskInput[];
    };
    return { goal: raw.goal, tasks: raw.tasks };
  });
}

const goals = loadGoals();
const report = await buildAgentIntegrationValidation(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nRuntime ticks:');
report.integration?.runtime.runtime.ticks.forEach((t) => {
  const step = t.orchestration_step;
  const decidedStr = step.decided ? `${step.decided.goal_id}::${step.decided.task_id}` : 'none';
  console.log(
    `  tick ${t.tick}: lifecycle=${t.lifecycle_state} decided=${decidedStr} executed=${step.executed}${step.new_state ? ` new_state=${step.new_state}` : ''}`
  );
});

console.log('\nDispatch attempts (capability=text_completion):');
report.integration?.dispatch.attempts.forEach((a) => {
  console.log(`  ${a.provider}: credential_present=${a.credential_present} result=${a.result.ok ? 'ok' : a.result.kind}`);
});
console.log(`dispatch chosen_provider: ${report.integration?.dispatch.chosen_provider ?? 'none'}`);

if (report.verdict !== AGENT_INTEGRATION_PASS_VERDICT) {
  console.error(`AGENT INTEGRATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
