import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FEEDBACK_INGESTOR_PASS_VERDICT,
  GENERATION_FEEDBACK_REPORT_PATH,
  MDS005_FEEDBACK_FIXTURE_PATH,
  runMds005FeedbackIngestion,
} from '../services/generationResultFeedbackIngestor.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runMds005FeedbackIngestion(projectRoot);

console.log(report.final_verdict);
console.log(
  `images=${report.summary.total_images} pass=${report.summary.pass_count} partial=${report.summary.partial_count} fail=${report.summary.fail_count}`
);
console.log(
  `actual_pass_rate=${report.summary.actual_pass_rate} adjusted_pass_rate=${report.summary.adjusted_pass_rate} prediction_accuracy=${report.simulator_vs_actual.prediction_accuracy}`
);
console.log(
  `false_safe=${report.simulator_vs_actual.false_safe_slots.length} partial_gaps=${report.simulator_vs_actual.partial_prediction_gaps.length} weight_updates=${report.suggested_simulator_weight_updates.length}`
);
console.log(`fixture=${MDS005_FEEDBACK_FIXTURE_PATH} report=${GENERATION_FEEDBACK_REPORT_PATH}`);

if (
  report.summary.pass_count !== 11 ||
  report.summary.partial_count !== 4 ||
  report.summary.fail_count !== 0
) {
  console.error('Fixture verdict counts mismatch: expected 11 PASS, 4 PARTIAL, 0 FAIL.');
  process.exit(1);
}

if (report.final_verdict !== FEEDBACK_INGESTOR_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
