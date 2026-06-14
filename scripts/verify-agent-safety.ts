import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runAgentSafetyAudit,
  writeAgentSafetyReport,
  type AgentSafetyAuditResult,
} from '../services/agentSafetyAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runAgentSafetyAudit(projectRoot);
writeAgentSafetyReport(projectRoot, report);

const result: AgentSafetyAuditResult = report.auditResult;
console.log(result);

if (result !== 'PASS') {
  for (const violation of report.violations) {
    console.error(`${violation.code}: ${violation.message}${violation.path ? ` (${violation.path})` : ''}`);
  }
  process.exit(1);
}

process.exit(0);
