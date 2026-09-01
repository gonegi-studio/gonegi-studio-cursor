import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  AGENT_DECISION_PASS_VERDICT,
  buildAgentDecisionDashboard,
} from '../services/AgentDecisionDashboard.js';
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
const report = buildAgentDecisionDashboard(projectRoot, goals);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nCandidates:');
for (const candidate of report.decision?.candidates ?? []) {
  console.log(
    `  ${candidate.task.task_id} [${candidate.task.goal_id}] impact=${candidate.priority.impact_score} rank=${candidate.priority.priority_rank} selectable=${candidate.constraint.selectable}${candidate.constraint.reason ? ` (${candidate.constraint.reason})` : ''}`
  );
}
console.log(`\nnext_action: ${report.decision?.next_action?.task.task_id ?? 'none'}`);

// This script deliberately does not write reports/agent_decision/AgentDecisionReport.md
// itself — consistent with the Planning/Execution phases' scripts, that file
// is a hand-authored narrative report; this script is the real, reproducible
// source of the evidence it cites.

if (report.verdict !== AGENT_DECISION_PASS_VERDICT) {
  console.error(`AGENT DECISION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
