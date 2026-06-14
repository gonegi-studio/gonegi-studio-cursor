import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runOutdoorLayoutLockAudit,
  type OutdoorLayoutLockVerdict,
} from '../services/outdoorLayoutLockAudit.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const report = runOutdoorLayoutLockAudit(projectRoot);

const verdict: OutdoorLayoutLockVerdict = report.final_verdict;
console.log(verdict);
console.log(`layouts=${report.layout_count}/${report.target_layout_count}`);
console.log(`synced_latest=${report.validation.adapter_synced_to_latest}`);
console.log(`tokens_injected=${report.validation.tokens_injected}`);

if (verdict !== 'PASS_OUTDOOR_LAYOUT_LOCK_SYSTEM_V1') {
  for (const violation of report.violations) {
    console.error(
      `${violation.code}: ${violation.message}${violation.field ? ` (${violation.field})` : ''}`
    );
  }
  process.exit(1);
}

process.exit(0);
