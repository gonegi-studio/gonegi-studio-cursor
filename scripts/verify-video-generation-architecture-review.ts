import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RECOMMENDED_STRATEGY,
  VIDEO_ARCHITECTURE_REPORT_PATH,
  VIDEO_ARCHITECTURE_REVIEW_PASS_VERDICT,
  VIDEO_ARCHITECTURE_REVIEW_READY_STATUS,
  writeVideoGenerationArchitectureReview,
} from '../services/videoGenerationArchitectureReview.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeVideoGenerationArchitectureReview(projectRoot);

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `review_only=${report.review_only}`,
    `architecture_review_complete=${report.architecture_review_complete}`,
    `recommended_strategy=${report.conclusion.recommended_strategy}`,
    `estimated_gpu_savings=${report.conclusion.estimated_gpu_savings}`,
    `identity_stability_expectation=${report.conclusion.identity_stability_expectation}`,
    `long_form_production_readiness=${report.conclusion.long_form_production_readiness}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `gpu_execution=${report.gpu_execution}`,
    `video_generation=${report.video_generation}`,
    `new_engine_development=${report.new_engine_development}`,
    `review_passed=${report.review_passed}`,
  ].join(' ')
);
console.log(`report=${VIDEO_ARCHITECTURE_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const fullReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, VIDEO_ARCHITECTURE_REPORT_PATH), 'utf8')
) as {
  conclusion: {
    recommended_strategy: string;
    long_form_production_readiness: boolean;
  };
  architecture_review_complete: boolean;
  review_only: boolean;
  gpu_execution: boolean;
  video_generation: boolean;
  new_engine_development: boolean;
  new_dataset_creation: boolean;
  new_dna_system_development: boolean;
  production_readiness_gates: {
    recommended_strategy_exists: boolean;
    long_form_production_readiness: boolean;
    architecture_review_complete: boolean;
  };
  next_phase: string;
};

const checks: [string, boolean][] = [
  ['recommended_strategy_exists', Boolean(fullReport.conclusion.recommended_strategy)],
  ['recommended_strategy=KEYFRAME_INTERPOLATION_CORRECTION', fullReport.conclusion.recommended_strategy === RECOMMENDED_STRATEGY],
  ['long_form_production_readiness=true', fullReport.conclusion.long_form_production_readiness === true],
  ['architecture_review_complete=true', fullReport.architecture_review_complete === true],
  ['review_only=true', fullReport.review_only === true],
  ['gpu_execution=false', fullReport.gpu_execution === false],
  ['video_generation=false', fullReport.video_generation === false],
  ['new_engine_development=false', fullReport.new_engine_development === false],
  ['new_dataset_creation=false', fullReport.new_dataset_creation === false],
  ['new_dna_system_development=false', fullReport.new_dna_system_development === false],
  ['gate_recommended_strategy_exists', fullReport.production_readiness_gates.recommended_strategy_exists],
  ['gate_long_form_production_readiness', fullReport.production_readiness_gates.long_form_production_readiness],
  ['gate_architecture_review_complete', fullReport.production_readiness_gates.architecture_review_complete],
  ['option_b_selected', (fullReport as { strategy_options?: { option_b?: { selected?: boolean } } }).strategy_options?.option_b?.selected === true],
  ['next_phase=PHASE-VIDEO-SHORT-TEST-001', fullReport.next_phase === 'PHASE-VIDEO-SHORT-TEST-001'],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

if (report.final_verdict !== VIDEO_ARCHITECTURE_REVIEW_PASS_VERDICT) process.exit(1);
if (report.status !== VIDEO_ARCHITECTURE_REVIEW_READY_STATUS) process.exit(1);
