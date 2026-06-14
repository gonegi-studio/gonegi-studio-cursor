import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_FIDELITY_SCORECARD_PATH,
  FORENSIC_DNA_AUDIT_REPORT_PATH,
  FORENSIC_DNA_PASS_VERDICT,
  FORENSIC_DNA_READY_STATUS,
  RECONSTRUCTION_POTENTIAL_REPORT_PATH,
  SOURCE_FIDELITY_MATRIX_PATH,
  writeSourceVideoDnaForensicAudit,
} from '../services/sourceVideoDnaForensicAudit.js';
import { TOTAL_SOURCE_VIDEO_COUNT } from '../services/sourceVideoNumericalAndCinematicDna.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeSourceVideoDnaForensicAudit(projectRoot);
const summary = report.forensic_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `overall_fidelity_score=${summary.overall_fidelity_score}`,
    `minimum_fidelity_level=${summary.minimum_fidelity_level}`,
    `lowest_fidelity_source=${summary.lowest_fidelity_source}`,
    `fidelity_balance_score=${summary.fidelity_balance_score}`,
    `reconstruction_potential_score=${summary.reconstruction_potential_score}`,
    `reconstruction_confidence=${summary.reconstruction_confidence}`,
    `fidelity_imbalance=${summary.fidelity_imbalance}`,
    `level_0_count=${summary.level_0_count}`,
    `level_1_count=${summary.level_1_count}`,
    `source_count=${summary.source_count}`,
    `gpu_execution=${summary.gpu_execution}`,
    `forensic_passed=${report.forensic_passed}`,
  ].join(' ')
);
console.log(`report=${FORENSIC_DNA_AUDIT_REPORT_PATH}`);
console.log(`scorecard=${DNA_FIDELITY_SCORECARD_PATH}`);
console.log(`matrix=${SOURCE_FIDELITY_MATRIX_PATH}`);
console.log(`reconstruction=${RECONSTRUCTION_POTENTIAL_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const scorecard = JSON.parse(
  fs.readFileSync(path.join(projectRoot, DNA_FIDELITY_SCORECARD_PATH), 'utf8')
) as {
  minimum_fidelity_audit: { minimum_fidelity_level: string; fidelity_imbalance: string };
  aggregate_scores: { overall_fidelity_score: number; fidelity_balance_score: number; reconstruction_confidence: number };
};

const matrix = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SOURCE_FIDELITY_MATRIX_PATH), 'utf8')
) as { sources: { source_id: string; fidelity_level: string }[] };

const levelOrder = ['LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5'];
const minLevel = scorecard.minimum_fidelity_audit.minimum_fidelity_level;

const checks: [string, boolean][] = [
  ['overall_fidelity_score>=85', Number(summary.overall_fidelity_score) >= 85],
  ['minimum_fidelity_level>=LEVEL_3', levelOrder.indexOf(minLevel) >= levelOrder.indexOf('LEVEL_3')],
  ['fidelity_balance_score>=80', Number(summary.fidelity_balance_score) >= 80],
  ['no_level_0', Number(summary.level_0_count) === 0],
  ['no_level_1', Number(summary.level_1_count) === 0],
  ['reconstruction_confidence>=90', Number(summary.reconstruction_confidence) >= 90],
  ['fidelity_imbalance<=LOW', summary.fidelity_imbalance === 'LOW'],
  ['source_count=16', matrix.sources.length === TOTAL_SOURCE_VIDEO_COUNT],
  ['gpu_execution=false', summary.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== FORENSIC_DNA_PASS_VERDICT) process.exit(1);
if (report.status !== FORENSIC_DNA_READY_STATUS) process.exit(1);
