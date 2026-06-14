import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_MEMORY_SPECIFICATION_PATH,
  TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT,
  TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH,
  TEMPORAL_PRESERVATION_STRATEGY_STATUS,
  writeTemporalPreservationStrategyReport,
} from '../services/temporalPreservationStrategy.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTemporalPreservationStrategyReport(projectRoot);

const spec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_MEMORY_SPECIFICATION_PATH), 'utf8')
) as {
  temporal_memory_defined: boolean;
  causal_transitions: Array<{ transition_id: string; causal_reason: string }>;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `temporal_preservation_strategy_defined=${report.temporal_preservation_strategy_defined}`,
    `temporal_memory_defined=${report.temporal_memory_defined}`,
    `continuity_format_defined=${report.continuity_format_defined}`,
    `traceability_format_defined=${report.traceability_format_defined}`,
    `causal_transition_format_defined=${report.causal_transition_format_defined}`,
    `retrieval_strategy_defined=${report.retrieval_strategy_defined}`,
    `temporal_memory_record_count=${report.temporal_memory_record_count}`,
    `causal_transition_count=${report.causal_transition_count}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [TEMPORAL_MEMORY_SPECIFICATION_PATH, TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT) {
  console.error('TEMPORAL PRESERVATION STRATEGY VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== TEMPORAL_PRESERVATION_STRATEGY_STATUS) {
  console.error(`STATUS FAIL: expected ${TEMPORAL_PRESERVATION_STRATEGY_STATUS}`);
  process.exit(1);
}

if (
  !report.temporal_memory_defined ||
  !report.continuity_format_defined ||
  !report.traceability_format_defined ||
  !report.causal_transition_format_defined ||
  !report.retrieval_strategy_defined ||
  !spec.temporal_memory_defined
) {
  console.error('PASS CONDITION FAIL: strategy definition checks not met');
  process.exit(1);
}

const transition = spec.causal_transitions.find(
  (entry) => entry.transition_id === 'transition_014_015'
);
if (!transition || transition.causal_reason !== 'character_exit') {
  console.error('EXAMPLE TRANSITION FAIL: transition_014_015 / character_exit required');
  process.exit(1);
}

process.exit(0);
