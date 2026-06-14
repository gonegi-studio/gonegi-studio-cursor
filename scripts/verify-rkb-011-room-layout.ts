import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb011Artifacts,
  type Rkb011Scorecard,
} from '../services/rkb011RoomLayoutContinuityValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb011Artifacts(projectRoot);
const verdict: Rkb011Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `renders=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders}`
);
console.log(
  `layout_continuity=${scorecard.aggregate_scores.overall_layout_continuity} window=${scorecard.aggregate_scores.window_wall_stability} anchor_pos=${scorecard.aggregate_scores.anchor_position_stability}`
);
console.log(
  `rooms=${scorecard.success_condition.rooms_passing}/${scorecard.success_condition.rooms_required}`
);

if (verdict !== 'PASS_RKB_011_ROOM_LAYOUT_CONTINUITY_VALIDATION') {
  process.exit(1);
}

process.exit(0);
