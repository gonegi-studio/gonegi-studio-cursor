import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_RUNTIME_PASS_VERDICT,
  buildAgentRuntimeDashboard,
} from '../services/AgentRuntimeDashboard.js';
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
const report = await buildAgentRuntimeDashboard(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nRuntime ticks:');
report.integration?.runtime.ticks.forEach((t) => {
  const step = t.orchestration_step;
  const decidedStr = step.decided ? `${step.decided.goal_id}::${step.decided.task_id}` : 'none';
  console.log(
    `  tick ${t.tick}: lifecycle=${t.lifecycle_state} decided=${decidedStr} executed=${step.executed}${step.new_state ? ` new_state=${step.new_state}` : ''}`
  );
});
console.log(`\nfinal_lifecycle_state: ${report.integration?.runtime.final_lifecycle_state}`);
console.log(`halted_reason: ${report.integration?.runtime.halted_reason}`);

if (report.verdict !== AGENT_RUNTIME_PASS_VERDICT) {
  console.error(`AGENT RUNTIME INTEGRATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
