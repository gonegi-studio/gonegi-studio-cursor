import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb013Artifacts,
  type Rkb013Scorecard,
} from '../services/rkb013OutdoorLayoutContinuityValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb013Artifacts(projectRoot);
const verdict: Rkb013Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `renders=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders}`
);
console.log(
  `outdoor_continuity=${scorecard.aggregate_scores.overall_outdoor_layout_continuity} landmark_pos=${scorecard.aggregate_scores.landmark_position_stability} orientation=${scorecard.aggregate_scores.outdoor_orientation_stability}`
);
console.log(
  `locations=${scorecard.success_condition.locations_passing}/${scorecard.success_condition.locations_required}`
);

if (verdict !== 'PASS_RKB_013_OUTDOOR_LAYOUT_CONTINUITY_VALIDATION') {
  process.exit(1);
}

process.exit(0);
