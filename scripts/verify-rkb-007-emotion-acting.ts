import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb007Artifacts,
  type Rkb007Scorecard,
} from '../services/rkb007EmotionActingValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb007Artifacts(projectRoot);
const verdict: Rkb007Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `emotions_pass=${scorecard.success_condition.actual_pass_emotions}/${scorecard.success_condition.required_pass_emotions}`
);
console.log(
  `adapter_consumption=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_shots}`
);
console.log(
  `readability=${scorecard.aggregate_readability.pre_eda}→${scorecard.aggregate_readability.rkb_007}`
);

if (verdict !== 'PASS_RKB_007_EMOTION_ACTING_VALIDATION') {
  process.exit(1);
}

process.exit(0);
