import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runSceneCompositionAudit,
  type SceneCompositionVerdict,
} from '../services/sceneAssetCompositionAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runSceneCompositionAudit(projectRoot);

const verdict: SceneCompositionVerdict = report.final_verdict;
console.log(verdict);
console.log(`compositions=${report.composition_count}/${report.target_composition_count}`);
console.log(`synced_latest=${report.validation.adapter_synced_to_latest}`);
console.log(`tokens_injected=${report.validation.tokens_injected}`);

if (verdict !== 'PASS_SCENE_ASSET_COMPOSITION_SYSTEM_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
