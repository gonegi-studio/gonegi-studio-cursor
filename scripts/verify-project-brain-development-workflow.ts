import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PASS_VERDICT,
  buildProjectBrainWorkflowReport,
} from '../services/ProjectBrainWorkflowValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const start = Date.now();
const report = await buildProjectBrainWorkflowReport(projectRoot);
const elapsedMs = Date.now() - start;

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBuilt in ${elapsedMs}ms`);
console.log(`\nTask Intake: ok=${report.result?.intake.ok} target=${report.result?.intake.service_relpath} (${report.result?.intake.reason})`);

console.log('\nGenerated Report:\n');
console.log(report.result?.generated_report ?? '(none)');

if (report.verdict !== PROJECT_BRAIN_DEVELOPMENT_WORKFLOW_PASS_VERDICT) {
  console.error(`PROJECT BRAIN DEVELOPMENT WORKFLOW: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
