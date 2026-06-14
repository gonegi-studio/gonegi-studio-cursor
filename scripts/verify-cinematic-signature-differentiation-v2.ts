import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  SIGNATURE_DIFF_PASS_VERDICT,
  SIGNATURE_DIFF_READY_STATUS,
  SIGNATURE_DIFF_REPORT_PATH,
  SIGNATURE_DISTANCE_REPORT_PATH,
  SIGNATURE_SEPARATION_REPORT_PATH,
  collectSignatureExtractionSnapshots,
  verifySignatureExtractionPreservation,
  writeCinematicSignatureDifferentiation,
} from '../services/cinematicSignatureDifferentiation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const extractionBefore = collectSignatureExtractionSnapshots(projectRoot);
const report = writeCinematicSignatureDifferentiation(projectRoot);

if (!verifySignatureExtractionPreservation(projectRoot, extractionBefore)) {
  console.error('POLICY VIOLATION: non-signature source_video_dna artifacts modified');
  process.exit(1);
}

const summary = report.differentiation_summary;
const distance = JSON.parse(
  fs.readFileSync(path.join(projectRoot, SIGNATURE_DISTANCE_REPORT_PATH), 'utf8')
) as { minimum_pairwise_distance: number };

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `cinematic_signature_quality=${summary.cinematic_signature_quality}`,
    `ghibli_signature_confidence=${summary.ghibli_signature_confidence}`,
    `shinkai_signature_confidence=${summary.shinkai_signature_confidence}`,
    `mori_signature_confidence=${summary.mori_signature_confidence}`,
    `live_action_signature_confidence=${summary.live_action_signature_confidence}`,
    `style_contamination=${summary.style_contamination}`,
    `signature_confusion=${summary.signature_confusion}`,
    `minimum_pairwise_distance=${summary.minimum_pairwise_distance}`,
    `director_style_separation_ready=${summary.director_style_separation_ready}`,
    `recommend_gpu_test=${summary.recommend_gpu_test}`,
    `extraction_preservation=true`,
    `gpu_execution=${summary.gpu_execution}`,
    `differentiation_passed=${report.differentiation_passed}`,
  ].join(' ')
);
console.log(`report=${SIGNATURE_DIFF_REPORT_PATH}`);
console.log(`distance=${SIGNATURE_DISTANCE_REPORT_PATH}`);
console.log(`separation=${SIGNATURE_SEPARATION_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['cinematic_signature_quality>=90', Number(summary.cinematic_signature_quality) >= 90],
  ['ghibli_signature_confidence>=85', Number(summary.ghibli_signature_confidence) >= 85],
  ['shinkai_signature_confidence>=85', Number(summary.shinkai_signature_confidence) >= 85],
  ['mori_signature_confidence>=85', Number(summary.mori_signature_confidence) >= 85],
  ['live_action_signature_confidence>=85', Number(summary.live_action_signature_confidence) >= 85],
  ['style_contamination<=10', Number(summary.style_contamination) <= 10],
  ['signature_confusion<=10', Number(summary.signature_confusion) <= 10],
  ['minimum_pairwise_distance>=0.30', distance.minimum_pairwise_distance >= 0.3],
  ['director_style_separation_ready=true', summary.director_style_separation_ready === true],
  ['recommend_gpu_test=true', summary.recommend_gpu_test === true],
  ['extraction_preservation=PASS', verifySignatureExtractionPreservation(projectRoot, extractionBefore)],
  ['gpu_execution=false', summary.gpu_execution === false],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

const library = JSON.parse(
  fs.readFileSync(
    path.join(projectRoot, 'datasets/source_video_dna/cinematic-signature-library.json'),
    'utf8'
  )
) as { groups: Record<string, Record<string, unknown>> };

for (const key of ['ghibli_signature', 'shinkai_signature', 'mori_signature', 'live_action_signature']) {
  if (!library.groups[key]?.signature_frequency_profile) {
    console.error(`VERIFY FAIL: missing signature_frequency_profile for ${key}`);
    process.exit(1);
  }
}

if (report.final_verdict !== SIGNATURE_DIFF_PASS_VERDICT) process.exit(1);
if (report.status !== SIGNATURE_DIFF_READY_STATUS) process.exit(1);
