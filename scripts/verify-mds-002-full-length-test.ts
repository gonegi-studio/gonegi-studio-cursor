import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeMds002Artifacts,
  type Mds002Scorecard,
} from '../services/mds002FullLengthMvProductionTest.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeMds002Artifacts(projectRoot);
const verdict: Mds002Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `mode_a=${scorecard.mode_a_instrumental.scene_count} scenes pass=${scorecard.mode_a_instrumental.mode_pass}`
);
console.log(
  `mode_b=${scorecard.mode_b_ballad.scene_count} scenes pass=${scorecard.mode_b_ballad.mode_pass}`
);
console.log(
  `stability char=${scorecard.combined_stability.character_stability} loc=${scorecard.combined_stability.location_stability} emo=${scorecard.combined_stability.emotion_readability} narrative=${scorecard.combined_stability.narrative_continuity}`
);
console.log(`drift catastrophic=${scorecard.combined_drift.catastrophic}`);
if (scorecard.baseline_artifacts.production_ready_baseline_001_created) {
  console.log(`baseline=${scorecard.baseline_artifacts.baseline_path}`);
}

if (verdict !== 'PASS_MDS_002_FULL_LENGTH_MV_PRODUCTION_TEST') {
  process.exit(1);
}

process.exit(0);
