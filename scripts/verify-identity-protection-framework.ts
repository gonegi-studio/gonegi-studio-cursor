import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IDENTITY_PROTECTION_FINAL_VERDICT_PASS,
  IDENTITY_PROTECTION_REPORT_PATH,
  runIdentityProtectionFrameworkAudit,
} from '../services/identityProtectionFramework.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runIdentityProtectionFrameworkAudit(projectRoot);

console.log(report.final_verdict);
console.log(
  `scanned=${report.summary.adapters_scanned} passed=${report.summary.adapters_passed} failed=${report.summary.adapters_failed} high_risk=${report.summary.high_risk_count}`
);
console.log(
  `precheck contract=${report.precheck.character_first_contract_present} outdoor_v2=${report.precheck.outdoor_layout_v2_safe}`
);
console.log(`report=${report.phase} -> ${IDENTITY_PROTECTION_REPORT_PATH}`);

for (const entry of report.adapter_audits.filter((row) => row.pass_fail === 'fail')) {
  console.error(
    `FAIL ${entry.adapter_name}: risk=${entry.risk_level} tokens=${entry.dangerous_tokens.length} priority=${entry.identity_priority_status}`
  );
}

if (report.final_verdict !== IDENTITY_PROTECTION_FINAL_VERDICT_PASS) {
  for (const violation of report.violations) {
    console.error(violation);
  }
  process.exit(1);
}

process.exit(0);
