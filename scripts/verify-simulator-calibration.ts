import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIMULATOR_CALIBRATION_PASS_VERDICT,
  SIMULATOR_CALIBRATION_REPORT_PATH,
  SIMULATOR_CALIBRATION_CONFIG_PATH,
  runSimulatorCalibration,
} from '../services/simulatorCalibration.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { report, calibrated_simulator } = runSimulatorCalibration(projectRoot);

console.log(report.final_verdict);
console.log(
  `previous=${report.previous_expected_pass_rate} actual=${report.actual_pass_rate} adjusted=${report.adjusted_actual_pass_rate} calibrated=${report.calibrated_expected_pass_rate}`
);
console.log(
  `safe=${report.calibrated_quota.safe_slots.length} watch=${report.calibrated_quota.watch_slots.length} skip=${report.calibrated_quota.skip_or_rewrite_slots.length}`
);
console.log(`config=${SIMULATOR_CALIBRATION_CONFIG_PATH} report=${SIMULATOR_CALIBRATION_REPORT_PATH}`);

const partialSlots = ['MDS005-slot-03', 'MDS005-slot-06', 'MDS005-slot-10', 'MDS005-slot-14'];
const watchHits = partialSlots.filter((id) =>
  report.calibrated_quota.watch_slots.includes(id)
).length;

if (report.final_verdict !== SIMULATOR_CALIBRATION_PASS_VERDICT) {
  console.error('Calibration failed PASS checks.');
  process.exit(1);
}

if (
  report.calibrated_expected_pass_rate < 0.75 ||
  report.calibrated_expected_pass_rate > 0.9
) {
  console.error(
    `calibrated_expected_pass_rate ${report.calibrated_expected_pass_rate} outside 0.75-0.90`
  );
  process.exit(1);
}

if (report.calibrated_quota.watch_slots.length === 0) {
  console.error('Expected watch slots after calibration.');
  process.exit(1);
}

if (watchHits < 3) {
  console.error(`Expected partial-risk slots in watch list; matched ${watchHits}/4`);
  process.exit(1);
}

if (!calibrated_simulator.calibrated) {
  console.error('Calibrated simulator report not marked calibrated.');
  process.exit(1);
}

process.exit(0);
