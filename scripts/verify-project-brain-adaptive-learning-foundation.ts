import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_ADAPTIVE_LEARNING_PASS_VERDICT,
  buildProjectBrainAdaptiveLearningReport,
} from '../services/ProjectBrainAdaptiveLearningValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainAdaptiveLearningReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nFeedback trace:');
report.result?.feedback.forEach((e) => {
  console.log(`  ${e.task_id}: predicted=${e.predicted_status} actual=${e.actual_status} was_correct=${e.was_correct} tags=[${e.tags.join(', ')}]`);
});
console.log(`\nFeedback summary: ${JSON.stringify(report.result?.feedback_summary)}`);

console.log('\nModel update (base -> after 1 update):');
if (report.result) {
  for (const tag of Object.keys(report.result.base_model.tag_outcomes)) {
    const before = report.result.base_model.tag_outcomes[tag as keyof typeof report.result.base_model.tag_outcomes];
    const after = report.result.updated_model.tag_outcomes[tag as keyof typeof report.result.updated_model.tag_outcomes];
    console.log(`  ${tag}: before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  }
}

console.log('\nAdaptation epochs (credential tag, human_required count):');
report.result?.epochs.forEach((e) => {
  console.log(`  epoch ${e.epoch}: ${e.model.tag_outcomes.credential.human_required}`);
});

if (report.verdict !== PROJECT_BRAIN_ADAPTIVE_LEARNING_PASS_VERDICT) {
  console.error(`PROJECT BRAIN ADAPTIVE LEARNING FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
