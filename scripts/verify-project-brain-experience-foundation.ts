import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  PROJECT_BRAIN_EXPERIENCE_PASS_VERDICT,
  buildProjectBrainExperienceReport,
} from '../services/ProjectBrainExperienceValidator.js';
import { retrieveSimilarExperiences, retrieveByOutcome } from '../services/ProjectBrainExperienceIndexer.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = await buildProjectBrainExperienceReport(projectRoot);

console.log(report.verdict);
for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

console.log('\nExperience trace:');
report.result?.records.forEach((r) => {
  console.log(`  ${r.experience_id} ${r.task_id}: predicted=${r.predicted_status} actual=${r.actual_status} outcome=${r.outcome} tags=[${r.tags.join(', ')}]`);
});

if (report.result) {
  console.log('\nRetrieval demo — experiences similar to a new task tagged ["commit"]:');
  retrieveSimilarExperiences(['commit'], report.result.index).forEach((r) => console.log(`  ${r.experience_id} ${r.task_id} (outcome=${r.outcome})`));

  console.log('\nRetrieval demo — all real successes:');
  retrieveByOutcome('success', report.result.index).forEach((r) => console.log(`  ${r.experience_id} ${r.task_id}`));
}

if (report.verdict !== PROJECT_BRAIN_EXPERIENCE_PASS_VERDICT) {
  console.error(`PROJECT BRAIN EXPERIENCE FOUNDATION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
