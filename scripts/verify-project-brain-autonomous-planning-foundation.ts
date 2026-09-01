import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_AUTONOMOUS_PLANNING_PASS_VERDICT,
  buildProjectBrainAutonomousPlanningReport,
} from '../services/ProjectBrainAutonomousPlanningValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainAutonomousPlanningReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nDiscovered goal candidates (priority order):');
report.result?.candidates.forEach((c) => {
  console.log(`  ${c.candidate_goal_id} (score=${c.priority_score}) [${c.source_kind}]: ${c.title}`);
});

console.log('\nAutonomous plans:');
report.result?.plans.forEach((p) => {
  console.log(`  ${p.goal.goal_id}: ready=${p.planning.ready} execution_order=[${p.planning.execution_plan?.execution_order.join(', ') ?? ''}]`);
});

if (report.verdict !== PROJECT_BRAIN_AUTONOMOUS_PLANNING_PASS_VERDICT) {
  console.error(`PROJECT BRAIN AUTONOMOUS PLANNING FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
