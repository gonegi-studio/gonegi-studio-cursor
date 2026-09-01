import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_AUTONOMOUS_VALIDATION_PASS_VERDICT,
  buildProjectBrainAutonomousValidationReport,
} from '../services/ProjectBrainAutonomousValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainAutonomousValidationReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nLoop consistency (per layer):');
report.consistency_reports.forEach((r) => {
  console.log(`  ${r.layer}: ok=${r.ok} (${r.detail})`);
});

console.log('\nConvergence (per layer):');
report.convergence_results.forEach((r) => {
  console.log(`  ${r.layer} [${r.metric_name}] values=[${r.values.join(', ')}]: ${r.detail}`);
});

console.log('\nStability (per layer):');
report.stability_results.forEach((r) => {
  console.log(`  ${r.layer} [${r.metric_name}]: ${r.detail}`);
});

if (report.verdict !== PROJECT_BRAIN_AUTONOMOUS_VALIDATION_PASS_VERDICT) {
  console.error(`PROJECT BRAIN AUTONOMOUS VALIDATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
