import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb010Artifacts,
  type Rkb010Scorecard,
} from '../services/rkb010PropContinuityValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb010Artifacts(projectRoot);
const verdict: Rkb010Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `renders=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders}`
);
console.log(
  `overall_prop_continuity=${scorecard.aggregate_scores.overall_prop_continuity} shape=${scorecard.aggregate_scores.shape_stability}`
);
console.log(
  `locations=${scorecard.success_condition.locations_passing}/${scorecard.success_condition.locations_required}`
);

if (verdict !== 'PASS_RKB_010_PROP_CONTINUITY_VALIDATION') {
  process.exit(1);
}

process.exit(0);
