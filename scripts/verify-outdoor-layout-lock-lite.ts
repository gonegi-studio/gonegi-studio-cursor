import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeRkb013Artifacts } from '../services/rkb013OutdoorLayoutContinuityValidation.js';
import {
  runOutdoorLayoutLockLiteAudit,
  type OutdoorLayoutLiteVerdict,
} from '../services/outdoorLayoutLockLiteAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runOutdoorLayoutLockLiteAudit(projectRoot);

const { scorecard } = writeRkb013Artifacts(projectRoot);

const verdict: OutdoorLayoutLiteVerdict = report.final_verdict;
console.log(verdict);
console.log(
  `outdoor_continuity=${report.outdoor_continuity.overall_outdoor_layout_continuity} met=${report.outdoor_continuity.met}`
);
console.log(
  `character_avg=${report.character_continuity.average_stability} improved=${report.character_continuity.improved_vs_pre_16th}`
);
console.log(
  `gonegi=${report.character_continuity.per_character.gonegi.stability} dana=${report.character_continuity.per_character.dana.stability} gamja=${report.character_continuity.per_character.gamja.stability} cherry=${report.character_continuity.per_character.cherry.stability}`
);
console.log(
  `five_image_tokens lite=${report.five_image_scenario.lite_outdoor_token_total} pre16=${report.five_image_scenario.pre_16th_outdoor_token_total} reduction=${report.five_image_scenario.token_reduction_percent}%`
);
console.log(`rkb013_rescore=${scorecard.final_verdict}`);

if (verdict !== 'PASS_OUTDOOR_LAYOUT_LOCK_LITE_V1') {
  for (const violation of report.violations) {
    console.error(`${violation.code}: ${violation.message}`);
  }
  process.exit(1);
}

process.exit(0);
