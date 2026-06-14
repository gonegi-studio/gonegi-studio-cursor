import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROMOTION_GATE_MD_PATH,
  PROMOTION_GATE_PASS_VERDICT,
  PROMOTION_GATE_REPORT_PATH,
} from '../services/gonegiPipelinePromotionGate.js';
import { validateGonegiPipelinePromotionGate } from '../services/gonegiPipelinePromotionGateValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const validation = validateGonegiPipelinePromotionGate(projectRoot);
const report = validation.report;

console.log(report.final_verdict);
console.log(
  `promotion_status=${report.promotion_status} promotion_score=${report.promotion_score} aggregate_risk=${report.aggregate_risk}`
);
console.log(
  `blocking=${report.blocking_reasons.length} warnings=${report.warning_reasons.length} watch_slots=${report.watch_slot_count}`
);
console.log(`gpu_execution=${report.gpu_execution} audit_only=${report.audit_only}`);
console.log(`decision_hash=${report.decision_hash}`);
console.log(`recommended_next_action=${report.recommended_next_action}`);
console.log(`report=${PROMOTION_GATE_REPORT_PATH}`);
console.log(`markdown=${PROMOTION_GATE_MD_PATH}`);

if (!fs.existsSync(path.join(projectRoot, PROMOTION_GATE_REPORT_PATH))) {
  console.error('Promotion gate report missing.');
  process.exit(1);
}

if (!validation.pass) {
  for (const issue of validation.issues.filter((i) => i.severity === 'error')) {
    console.error(`[${issue.code}] ${issue.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== PROMOTION_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (!report.promotion_status || typeof report.promotion_score !== 'number') {
  console.error('promotion_status and promotion_score must be generated');
  process.exit(1);
}

process.exit(0);
