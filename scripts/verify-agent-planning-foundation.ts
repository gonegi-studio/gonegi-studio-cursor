import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_PLANNING_PASS_VERDICT,
  buildAgentPlanningDashboard,
  type GoalInput,
} from '../services/AgentPlanningDashboard.js';
import type { PlanningGoal, PlanningTaskInput } from '../services/ProjectPlanningEngine.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const GOALS_DIR = path.join(projectRoot, 'datasets/agent_planning/goals');

function loadGoals(): GoalInput[] {
  const files = fs.readdirSync(GOALS_DIR).filter((f) => f.endsWith('.json'));
  return files
    .sort()
    .map((file) => {
      const raw = JSON.parse(fs.readFileSync(path.join(GOALS_DIR, file), 'utf8')) as {
        goal: PlanningGoal;
        tasks: PlanningTaskInput[];
      };
      return { goal: raw.goal, tasks: raw.tasks };
    });
}

const goals = loadGoals();
const report = buildAgentPlanningDashboard(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nExecution plans:');
for (const result of report.results) {
  console.log(`  ${result.goal.goal_id} (ready=${result.ready}):`);
  if (result.execution_plan) {
    for (const taskId of result.execution_plan.execution_order) {
      const task = result.execution_plan.tasks.find((t) => t.task_id === taskId)!;
      console.log(`    ${result.execution_plan.execution_order.indexOf(taskId) + 1}. ${taskId} [${task.status}] — ${task.title}`);
    }
  } else {
    console.log(`    (no execution plan — consistency/dependency failure)`);
  }
}

// This script deliberately does not write reports/agent_planning/AgentPlanningReport.md
// itself — that file is a hand-authored narrative report (Level 3 Planning
// Verification Report / Planning Readiness / Dependency Graph / Execution
// Plan / Agent Readiness / Project Brain Proposal), consistent with every
// other phase's report this session. This script's role is to be the real,
// reproducible source of the evidence that report cites, not to overwrite it
// with a thinner machine-only rendering on every run.

if (report.verdict !== AGENT_PLANNING_PASS_VERDICT) {
  console.error(`AGENT PLANNING FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
