import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runPropAnchorAudit,
  type PropAnchorVerdict,
} from '../services/propAnchorAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runPropAnchorAudit(projectRoot);

const verdict: PropAnchorVerdict = report.final_verdict;
console.log(verdict);
console.log(`props=${report.prop_anchor_count}/${report.target_prop_count}`);
console.log(`synced_latest=${report.validation.adapter_synced_to_latest}`);
console.log(`tokens_injected=${report.validation.tokens_injected}`);

if (verdict !== 'PASS_PROP_ANCHOR_SYSTEM_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
