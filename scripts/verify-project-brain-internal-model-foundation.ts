import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_INTERNAL_MODEL_PASS_VERDICT,
  buildProjectBrainInternalModelReport,
} from '../services/ProjectBrainInternalModelValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainInternalModelReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nLearned rule model (tag -> outcome counts):');
if (report.model) {
  for (const [tag, counts] of Object.entries(report.model.tag_outcomes)) {
    console.log(`  ${tag}: machine_executable=${counts.machine_executable}, human_required=${counts.human_required}`);
  }
}

console.log('\nSelf-predictions vs. real ground truth:');
report.self_predictions.forEach((p) => {
  console.log(
    `  ${p.task_id}: predicted=${p.prediction.predicted_status} (confidence=${p.prediction.confidence.toFixed(2)}) ground_truth=${p.ground_truth} agrees=${p.agrees}`
  );
});

if (report.verdict !== PROJECT_BRAIN_INTERNAL_MODEL_PASS_VERDICT) {
  console.error(`PROJECT BRAIN INTERNAL MODEL FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
