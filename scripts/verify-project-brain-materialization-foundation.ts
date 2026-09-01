import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_MATERIALIZATION_PASS_VERDICT,
  buildProjectBrainMaterializationReport,
} from '../services/ProjectBrainMaterializationValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainMaterializationReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nMaterialized tasks:');
report.result?.materialized_tasks.forEach((t) => {
  console.log(`  ${t.task_id} [${t.action_type}] status=${t.status} depends_on=[${t.depends_on.join(', ')}]`);
});

console.log('\nBlueprint:');
console.log(`  ready=${report.result?.blueprint.planning.ready}`);
console.log(`  execution_order=[${report.result?.blueprint.planning.execution_plan?.execution_order.join(', ') ?? ''}]`);

if (report.verdict !== PROJECT_BRAIN_MATERIALIZATION_PASS_VERDICT) {
  console.error(`PROJECT BRAIN MATERIALIZATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
