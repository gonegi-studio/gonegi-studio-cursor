import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb006Artifacts,
  type Rkb006Scorecard,
} from '../services/rkb006CoverageValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb006Artifacts(projectRoot);
const verdict: Rkb006Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `scenes_pass=${scorecard.success_condition.actual_pass_scenes}/${scorecard.success_condition.required_pass_scenes}`
);
console.log(
  `adapter_consumption=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_shots}`
);
console.log(
  `medium_chain_reduction=${(scorecard.medium_chain_reduction.reduction_rate * 100).toFixed(0)}%`
);

if (verdict !== 'PASS_RKB_006_COVERAGE_VALIDATION') {
  process.exit(1);
}

process.exit(0);
