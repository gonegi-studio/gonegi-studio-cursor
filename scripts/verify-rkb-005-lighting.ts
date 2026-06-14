import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb005Artifacts,
  type Rkb005Scorecard,
} from '../services/rkb005LightingValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb005Artifacts(projectRoot);
const verdict: Rkb005Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `anchors_pass=${scorecard.success_condition.actual_pass_anchors}/${scorecard.success_condition.required_pass_anchors}`
);
console.log(
  `adapter_consumption=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_shots}`
);

if (verdict !== 'PASS_RKB_005_LIGHTING_VALIDATION') {
  process.exit(1);
}

process.exit(0);
