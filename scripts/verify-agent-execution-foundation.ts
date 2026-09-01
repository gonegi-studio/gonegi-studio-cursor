import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_EXECUTION_PASS_VERDICT,
  buildAgentExecutionDashboard,
} from '../services/AgentExecutionDashboard.js';
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
const report = await buildAgentExecutionDashboard(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nExecution results:');
for (const [goalId, result] of Object.entries(report.results)) {
  console.log(`  ${goalId} (executed=${result.executed}):`);
  if (result.scheduler) {
    for (const taskId of result.scheduler.order_processed) {
      const task = result.scheduler.tasks[taskId];
      const extra = task.error ? ` — ${task.error}` : task.detail ? ` — ${task.detail}` : '';
      console.log(`    ${taskId}: ${task.state}${extra}`);
    }
  }
}

// This script deliberately does not write reports/agent_execution/AgentExecutionReport.md
// itself — consistent with scripts/verify-agent-planning-foundation.ts, that
// file is a hand-authored narrative report. This script is the real,
// reproducible source of the evidence that report cites.

if (report.verdict !== AGENT_EXECUTION_PASS_VERDICT) {
  console.error(`AGENT EXECUTION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
