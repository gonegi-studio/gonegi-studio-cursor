import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runIdentityVsLayoutVerification } from '../services/identityVsLayoutVerification.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runIdentityVsLayoutVerification(projectRoot);

console.log(report.final_verdict);
console.log(
  `outdoor full=${report.comparison.full_16.outdoor_continuity} lite=${report.comparison.lite_16.outdoor_continuity} v2=${report.comparison.v2_16.outdoor_continuity}`
);
for (const id of ['gonegi', 'dana', 'gamja', 'aengdu'] as const) {
  const f = report.comparison.full_16.character_stability.per_character[id].stability;
  const l = report.comparison.lite_16.character_stability.per_character[id].stability;
  const v = report.comparison.v2_16.character_stability.per_character[id].stability;
  console.log(`${id} full=${f} lite=${l} v2=${v}`);
}
console.log(
  `five_image_tokens full=${report.comparison.full_16.outdoor_token_count_five_image} lite=${report.comparison.lite_16.outdoor_token_count_five_image} v2=${report.comparison.v2_16.outdoor_token_count_five_image}`
);
console.log(`report=${report.phase} -> reports/identity-safe-layout-report.json`);

if (report.final_verdict !== 'PASS_IDENTITY_VS_LAYOUT_V1') {
  for (const violation of report.violations) {
    console.error(violation);
  }
  process.exit(1);
}

process.exit(0);
