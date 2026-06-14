import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANONICAL_ARTSTYLE_PATH,
  CANONICAL_CHARACTER_PROMPTS_PATH,
  CANONICAL_TIMESETTING_LIBRARY_PATH,
  GENERATION_CONTEXT_DIR,
  GENERATION_CONTEXT_MANIFEST_PATH,
} from '../services/generationContextLoader.js';
import {
  GENERATION_CONTEXT_REPORT_PATH,
  GENERATION_CONTEXT_PASS_VERDICT,
  writeGenerationContextReport,
} from '../services/generationContextValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeGenerationContextReport(projectRoot);
const { checks, metrics } = report;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `canonical_prompt_library_created=${report.canonical_prompt_library_created}`,
    `copy_only_mode_enabled=${report.copy_only_mode_enabled}`,
    `character_drift_eliminated=${report.character_drift_eliminated}`,
    `artstyle_drift_eliminated=${report.artstyle_drift_eliminated}`,
    `timesetting_drift_eliminated=${report.timesetting_drift_eliminated}`,
    `canonical_artstyle_exists=${checks.canonical_artstyle_exists}`,
    `canonical_character_exists=${checks.canonical_character_exists}`,
    `canonical_timesetting_exists=${checks.canonical_timesetting_exists}`,
    `runtime_generation_detected=${checks.runtime_generation_detected}`,
    `runtime_assembly_detected=${checks.runtime_assembly_detected}`,
    `copy_only_mode=${checks.copy_only_mode}`,
    `artstyle_count=${metrics.artstyle_count}`,
    `character_count=${metrics.character_count}`,
    `timesetting_count=${metrics.timesetting_count}`,
    `copy_operations=${metrics.copy_operations}`,
    `assembly_operations=${metrics.assembly_operations}`,
    `generation_operations=${metrics.generation_operations}`,
  ].join(' | ')
);

for (const rel of [
  GENERATION_CONTEXT_REPORT_PATH,
  GENERATION_CONTEXT_MANIFEST_PATH,
  CANONICAL_ARTSTYLE_PATH,
  CANONICAL_CHARACTER_PROMPTS_PATH,
  CANONICAL_TIMESETTING_LIBRARY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(projectRoot, GENERATION_CONTEXT_DIR))) {
  console.error(`OUTPUT MISSING: ${GENERATION_CONTEXT_DIR}/`);
  process.exit(1);
}

if (report.final_verdict !== GENERATION_CONTEXT_PASS_VERDICT) {
  console.error('GENERATION CONTEXT VALIDATION FAILED');
  for (const issue of report.issues.slice(0, 20)) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length > 20) {
    console.error(`... and ${report.issues.length - 20} more issues`);
  }
  process.exit(1);
}

process.exit(0);
