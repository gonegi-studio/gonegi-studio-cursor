import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runBehaviorDnaSchemaAudit,
  type BehaviorDnaSchemaAuditResult,
} from '../services/behaviorDnaSchemaAudit.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

const report = runBehaviorDnaSchemaAudit(projectRoot);

const result: BehaviorDnaSchemaAuditResult = report.auditResult;
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
