import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runPromptPackPairingAudit,
  type PromptPackPairingAuditResult,
} from '../services/promptPackPairingAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runPromptPackPairingAudit(projectRoot);

const result: PromptPackPairingAuditResult = report.auditResult;
console.log(result);

if (result !== 'PASS') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
