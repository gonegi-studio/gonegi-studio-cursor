import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeRkb009Artifacts,
  type Rkb009Scorecard,
} from '../services/rkb009BalladMvValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeRkb009Artifacts(projectRoot);
const verdict: Rkb009Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `pipeline_integrity=${scorecard.pipeline_integrity_summary.pass_count}/${scorecard.pipeline_integrity_summary.total_scenes}`
);
console.log(
  `archetypes_pass=${scorecard.success_condition.archetypes_passing}/${scorecard.success_condition.archetypes_required}`
);
console.log(`overall_average=${scorecard.aggregate_scores.overall_average}`);

if (verdict !== 'PASS_RKB_009_BALLAD_MV_PIPELINE_VALIDATION') {
  process.exit(1);
}

process.exit(0);
