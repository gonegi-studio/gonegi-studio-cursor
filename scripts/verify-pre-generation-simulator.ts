import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MDS005_FIXTURE_PATH,
  PRE_GEN_SIMULATOR_PASS_VERDICT,
  PRE_GEN_SIMULATOR_REPORT_PATH,
  runMds005FixtureVerification,
} from '../services/preGenerationSimulator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runMds005FixtureVerification(projectRoot);

console.log(report.final_verdict);
console.log(
  `overall=${report.overall_risk} (${report.generation_risk_estimate.overall_risk_level}) pass_rate=${report.expected_pass_rate} slots=${report.slot_results.length} critical=${report.generation_risk_estimate.critical_slot_count}`
);
console.log(
  `safe=${report.quota_recommendation.safe_slots.length} watch=${report.quota_recommendation.watch_slots.length} skip=${report.quota_recommendation.skip_or_rewrite_slots.length}`
);
console.log(`fixture=${MDS005_FIXTURE_PATH} report=${PRE_GEN_SIMULATOR_REPORT_PATH}`);
console.log(`highest_risk=${report.highest_risk_slots.join(', ')}`);

if (report.final_verdict !== PRE_GEN_SIMULATOR_PASS_VERDICT) {
  for (const slot of report.slot_results.filter((s) => s.risk_level === 'CRITICAL')) {
    console.error(`CRITICAL ${slot.slot_id}: score=${slot.risk_score} ${slot.top_risk_reasons.join('; ')}`);
  }
  process.exit(1);
}

process.exit(0);
