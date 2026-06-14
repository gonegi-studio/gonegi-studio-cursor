import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runRkb004Precheck,
  writeRkb004Artifacts,
  type Rkb004Scorecard,
} from '../services/rkb004IndoorLocationValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const precheck = runRkb004Precheck(projectRoot);
if (!precheck.pass) {
  for (const violation of precheck.violations) {
    console.error(`PRECHECK_FAIL: ${violation}`);
  }
  process.exit(1);
}

const { scorecard } = writeRkb004Artifacts(projectRoot);
const verdict: Rkb004Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `locations_pass=${scorecard.success_condition.actual_pass_locations}/${scorecard.success_condition.required_pass_locations}`
);
console.log(
  `adapter_consumption=${scorecard.adapter_consumption_check.pass_count}/${scorecard.adapter_consumption_check.total_shots}`
);

if (verdict !== 'PASS_RKB_004_INDOOR_LOCATION_VALIDATION') {
  process.exit(1);
}

process.exit(0);
