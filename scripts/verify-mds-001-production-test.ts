import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  writeMds001Artifacts,
  type Mds001Scorecard,
} from '../services/mds001MusicDramaProductionTest.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { scorecard } = writeMds001Artifacts(projectRoot);
const verdict: Mds001Scorecard['final_verdict'] = scorecard.final_verdict;

console.log(verdict);
console.log(
  `upload_set=${scorecard.upload_set.actual_count}/${scorecard.upload_set.expected_count} manifest_ok=${scorecard.upload_set.manifest_matches_latest}`
);
console.log(`dataset_hub=${scorecard.dataset_hub.verdict}`);
console.log(
  `usability=${(scorecard.render_test.usability_rate * 100).toFixed(0)}% (${scorecard.render_test.usability_pass_count}/${scorecard.render_test.total_slots})`
);
console.log(`production_scenes=${scorecard.production_package.scene_count}`);

if (verdict !== 'PASS_MDS_001_MUSIC_DRAMA_STUDIO_FULL_PRODUCTION_TEST') {
  process.exit(1);
}

process.exit(0);
