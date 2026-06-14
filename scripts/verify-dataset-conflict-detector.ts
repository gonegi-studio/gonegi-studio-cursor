import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CONFLICT_DETECTOR_PASS_VERDICT,
  CONFLICT_DETECTOR_REPORT_PATH,
  CONFLICT_DETECTOR_BASELINE_PATH,
  DATASET16_FIXTURE_PATH,
  runDataset16FixtureVerification,
} from '../services/datasetConflictDetector.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { result, fixturePass, final_verdict } = runDataset16FixtureVerification(projectRoot);

console.log(final_verdict);
console.log(
  `fixture=${DATASET16_FIXTURE_PATH} top=${result.top_suspects[0]?.file_path ?? 'none'} score=${result.top_suspects[0]?.suspect_score ?? 0} risk=${result.risk_score}`
);
console.log(
  `signals=${result.top_suspects[0]?.evidence_summary ?? 'none'} changed_files=${result.files_changed}`
);
console.log(`report=${CONFLICT_DETECTOR_REPORT_PATH} baseline=${CONFLICT_DETECTOR_BASELINE_PATH}`);

if (result.top_suspects[0]) {
  for (const signal of result.top_suspects[0].signals) {
    console.log(`  ${signal.signal} (+${signal.weight}): ${signal.detail}`);
  }
}

if (!fixturePass || final_verdict !== CONFLICT_DETECTOR_PASS_VERDICT) {
  console.error('Dataset #16 fixture ranking failed — outdoor-layout-lock-adapter must be top suspect.');
  process.exit(1);
}

process.exit(0);
