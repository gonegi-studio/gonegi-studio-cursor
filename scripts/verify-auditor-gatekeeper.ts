import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GATEKEEPER_PASS_VERDICT,
  GATEKEEPER_REPORT_PATH,
  validateGatekeeperFixtures,
  writeAuditorGatekeeperReport,
} from '../services/auditorGatekeeper.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = writeAuditorGatekeeperReport(projectRoot);
const validation = validateGatekeeperFixtures(report);

console.log(report.final_verdict);
console.log(
  `project_gate=${report.gate_status} promotion_allowed=${report.promotion_allowed} reason=${report.gate_reason}`
);
for (const sim of report.promotion_simulations) {
  console.log(
    `  ${sim.candidate_id}: ${sim.gate_status} allowed=${sim.promotion_allowed} threats=${sim.identity_threats_found}`
  );
}
console.log(`report=${GATEKEEPER_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, GATEKEEPER_REPORT_PATH))) {
  console.error('Gatekeeper report missing.');
  process.exit(1);
}

if (!validation.pass) {
  for (const v of validation.violations) console.error(v);
  process.exit(1);
}

if (report.final_verdict !== GATEKEEPER_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
