import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_OPTIMIZATION_PASS_VERDICT,
  buildProjectBrainOptimizationReport,
} from '../services/ProjectBrainOptimizationValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainOptimizationReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log(`\nBaseline (uncached, ${report.baseline_samples[0]?.calls ?? '?'} repeats each):`);
report.baseline_samples.forEach((s) => console.log(`  ${s.layer}: ${s.total_ms.toFixed(3)}ms total (${(s.total_ms / s.calls).toFixed(3)}ms/call)`));

console.log(`\nOptimized (cached, ${report.optimized_samples[0]?.calls ?? '?'} repeats each):`);
report.optimized_samples.forEach((s) => console.log(`  ${s.layer}: ${s.total_ms.toFixed(3)}ms total (${(s.total_ms / s.calls).toFixed(3)}ms/call)`));

if (report.verdict !== PROJECT_BRAIN_OPTIMIZATION_PASS_VERDICT) {
  console.error(`PROJECT BRAIN OPTIMIZATION FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
