import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_AUDITOR_PASS_VERDICT,
  PROJECT_AUDITOR_REPORT_PATH,
  PROJECT_AUDITOR_BASELINE_PATH,
  writeProjectAuditReports,
} from '../services/projectAuditor.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { result } = writeProjectAuditReports(projectRoot);

console.log(result.final_verdict);
console.log(
  `risk=${result.risk_score} (${result.risk_level}) identity=${result.identity_risk_score} continuity=${result.continuity_risk_score} adapter=${result.adapter_risk_score} priority=${result.priority_risk_score} integrity=${result.integrity_risk_score}`
);
console.log(
  `warnings=${result.warnings.length} errors=${result.errors.length} datasets=${result.inventory.dataset_json_count} verify_scripts=${result.inventory.verify_script_count}`
);
console.log(`report=${PROJECT_AUDITOR_REPORT_PATH} baseline=${PROJECT_AUDITOR_BASELINE_PATH}`);

if (result.errors.length > 0) {
  for (const err of result.errors) {
    console.error(`[${err.severity}] ${err.code}: ${err.message}`);
  }
}

if (result.final_verdict !== PROJECT_AUDITOR_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
