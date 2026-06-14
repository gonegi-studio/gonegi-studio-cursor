import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runMoriGrammarCatalogAudit,
  type MoriGrammarCatalogAuditResult,
} from '../services/moriGrammarCatalogAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runMoriGrammarCatalogAudit(projectRoot);

const result: MoriGrammarCatalogAuditResult = report.auditResult;
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
