import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  NUMERICAL_DNA_COMPLETION_PASS_VERDICT,
  validateNumericalCinematographyDnaCompletion,
} from '../services/numericalCinematographyDnaCompletionValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

assertCwdMatchesProjectRoot(projectRoot);

const report = validateNumericalCinematographyDnaCompletion(projectRoot);

console.log(report.verdict);
console.log(
  [
    `dna_extraction_pass=${report.dna_extraction_pass_ok}`,
    `numerical_dna_pass=${report.numerical_dna_pass_ok}`,
    `runtime_pass=${report.runtime_pass_ok}`,
    `end_to_end_pass=${report.end_to_end_pass_ok}`,
    `repository_pass=${report.repository_pass_ok}`,
  ].join(' | ')
);
console.log(
  [
    `mve_coverage_ratio=${report.evidence.mve.coverage_ratio}`,
    `full_coverage_ratio=${report.evidence.full.coverage_ratio}`,
    `validation_coverage_ratio=${report.evidence.validation.coverage_ratio}`,
    `validation_score=${report.evidence.validation.validation_score}`,
  ].join(' | ')
);

if (report.remaining_blocked_sources.length > 0) {
  console.log(`REMAINING BLOCKED SOURCES (${report.remaining_blocked_sources.length}):`);
  for (const failure of report.remaining_blocked_sources) {
    console.log(`  - ${failure.source_video_id} (${failure.source_group}): ${failure.error}`);
  }
}

for (const check of report.checks) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${check.id}: ${check.detail}`);
}

if (report.verdict !== NUMERICAL_DNA_COMPLETION_PASS_VERDICT) {
  console.error(`NUMERICAL CINEMATOGRAPHY DNA COMPLETION: ${report.verdict}`);
  process.exit(1);
}

process.exit(0);
