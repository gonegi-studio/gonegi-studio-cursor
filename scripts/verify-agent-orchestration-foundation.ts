import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_ORCHESTRATION_PASS_VERDICT,
  buildAgentOrchestrationDashboard,
} from '../services/AgentOrchestrationDashboard.js';
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
const report = await buildAgentOrchestrationDashboard(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nWorkflow steps:');
report.workflow?.steps.forEach((step, index) => {
  console.log(`  Step ${index + 1}: candidates=[${step.candidates.map((c) => `${c.task_id}(rank${c.priority_rank},sel=${c.selectable})`).join(', ')}]`);
  if (step.decided) {
    console.log(`    decided=${step.decided.goal_id}::${step.decided.task_id} executed=${step.executed} new_state=${step.new_state}${step.error ? ` error="${step.error}"` : ''}${step.detail ? ` detail="${step.detail}"` : ''}`);
  } else {
    console.log(`    decided=none (halted: ${report.workflow?.halted_reason})`);
  }
});

if (report.verdict !== AGENT_ORCHESTRATION_PASS_VERDICT) {
  console.error(`AGENT ORCHESTRATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
