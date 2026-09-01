import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_EXECUTION_READINESS_PASS_VERDICT,
  buildProjectBrainExecutionReadinessReport,
} from '../services/ProjectBrainExecutionValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainExecutionReadinessReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nExecution gate decisions:');
report.result?.gate_decisions.forEach((d) => {
  console.log(`  ${d.task_id}: constraint_status=${d.constraint_status} gate_clear=${d.gate_clear} (${d.reason})`);
});

if (report.verdict !== PROJECT_BRAIN_EXECUTION_READINESS_PASS_VERDICT) {
  console.error(`PROJECT BRAIN EXECUTION READINESS FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
