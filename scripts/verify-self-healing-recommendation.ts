import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GATEKEEPER_REPORT_PATH } from '../services/auditorGatekeeper.js';
import {
  SELF_HEALING_JSON_PATH,
  SELF_HEALING_MD_PATH,
  SELF_HEALING_PASS_VERDICT,
  validateSelfHealingFixtures,
  writeSelfHealingRecommendationReport,
} from '../services/selfHealingRecommendationEngine.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (!fs.existsSync(path.join(projectRoot, GATEKEEPER_REPORT_PATH))) {
  console.error(`Missing upstream gatekeeper report: ${GATEKEEPER_REPORT_PATH}`);
  console.error('Run npm run verify:auditor-gatekeeper first.');
  process.exit(1);
}

const report = writeSelfHealingRecommendationReport(projectRoot);
const validation = validateSelfHealingFixtures(report);

console.log(report.final_verdict);
for (const plan of report.candidate_plans) {
  console.log(
    `  ${plan.candidate_id}: fix_required=${plan.fix_required} blocked=${plan.blocked_status} edits=${plan.recommended_edits.length}`
  );
}
console.log(`json=${SELF_HEALING_JSON_PATH} md=${SELF_HEALING_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, SELF_HEALING_JSON_PATH))) {
  console.error('Self-healing JSON report missing.');
  process.exit(1);
}

if (!fs.existsSync(path.join(projectRoot, SELF_HEALING_MD_PATH))) {
  console.error('Self-healing MD report missing.');
  process.exit(1);
}

if (!validation.pass) {
  for (const v of validation.violations) console.error(v);
  process.exit(1);
}

if (report.final_verdict !== SELF_HEALING_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
