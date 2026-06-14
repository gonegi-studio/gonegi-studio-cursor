import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb012Artifacts,
  type Rkb012Scorecard,
} from '../services/rkb012SceneCompositionContinuityValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb012Artifacts(projectRoot);
const verdict: Rkb012Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `renders=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_renders}`
);
console.log(
  `composition_continuity=${scorecard.aggregate_scores.overall_composition_continuity} character_pos=${scorecard.aggregate_scores.character_position_stability} asset_visibility=${scorecard.aggregate_scores.required_asset_visibility}`
);
console.log(
  `compositions=${scorecard.success_condition.compositions_passing}/${scorecard.success_condition.compositions_required}`
);

if (verdict !== 'PASS_RKB_012_SCENE_COMPOSITION_CONTINUITY_VALIDATION') {
  process.exit(1);
}

process.exit(0);
