import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  NUMERICAL_DNA_PASS_VERDICT,
  NUMERICAL_DNA_READY_STATUS,
  SOURCE_VIDEO_DNA_REPORT_PATH,
  SOURCE_VIDEO_DNA_DATASET_DIR,
  SOURCE_VIDEO_DNA_EXPORT_DIR,
  IMAGE_APP_NUMERICAL_DNA_PACKAGE_PATH,
  VIDEO_APP_NUMERICAL_DNA_PACKAGE_PATH,
  collectV5Snapshots,
  verifyV5Preservation,
  writeSourceVideoNumericalAndCinematicDna,
} from '../services/sourceVideoNumericalAndCinematicDna.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const v5Before = collectV5Snapshots(projectRoot);
const report = writeSourceVideoNumericalAndCinematicDna(projectRoot);

if (!verifyV5Preservation(projectRoot, v5Before)) {
  console.error('POLICY VIOLATION: latest_v5 artifact modified');
  process.exit(1);
}

const summary = report.extraction_summary;

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `source_video_count=${summary.source_video_count}`,
    `ghibli_coverage=${summary.ghibli_coverage}`,
    `shinkai_coverage=${summary.shinkai_coverage}`,
    `live_action_coverage=${summary.live_action_coverage}`,
    `mori_coverage=${summary.mori_coverage}`,
    `frame_coordinate_integrity=${summary.frame_coordinate_integrity}`,
    `motion_vector_integrity=${summary.motion_vector_integrity}`,
    `camera_behavior_integrity=${summary.camera_behavior_integrity}`,
    `blocking_integrity=${summary.blocking_integrity}`,
    `edit_rhythm_integrity=${summary.edit_rhythm_integrity}`,
    `visual_style_integrity=${summary.visual_style_integrity}`,
    `environment_motion_integrity=${summary.environment_motion_integrity}`,
    `cinematic_signature_integrity=${summary.cinematic_signature_integrity}`,
    `signature_confidence_integrity=${summary.signature_confidence_integrity}`,
    `scene_remap_integrity=${summary.scene_remap_integrity}`,
    `image_app_numerical_dna_ready=${summary.image_app_numerical_dna_ready}`,
    `video_app_numerical_dna_ready=${summary.video_app_numerical_dna_ready}`,
    `source_video_reproduction_readiness=${summary.source_video_reproduction_readiness}`,
    `titanic_scene_remap_readiness=${summary.titanic_scene_remap_readiness}`,
    `placeholder_count=${summary.placeholder_count}`,
    `reference_only_count=${summary.reference_only_count}`,
    `latest_v5_preservation=true`,
    `gpu_execution=${report.policy.gpu_execution}`,
    `numerical_dna_ready=${report.numerical_dna_ready}`,
  ].join(' ')
);
console.log(`report=${SOURCE_VIDEO_DNA_REPORT_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) console.error(`[${err.code}] ${err.message}`);
  process.exit(1);
}

const checks: [string, boolean][] = [
  ['source_video_count=15', summary.source_video_count === 15],
  ['ghibli_coverage=PASS', summary.ghibli_coverage === 'PASS'],
  ['shinkai_coverage=PASS', summary.shinkai_coverage === 'PASS'],
  ['live_action_coverage=PASS', summary.live_action_coverage === 'PASS'],
  ['mori_coverage=PASS', summary.mori_coverage === 'PASS'],
  ['frame_coordinate_integrity=PASS', summary.frame_coordinate_integrity === 'PASS'],
  ['motion_vector_integrity=PASS', summary.motion_vector_integrity === 'PASS'],
  ['camera_behavior_integrity=PASS', summary.camera_behavior_integrity === 'PASS'],
  ['blocking_integrity=PASS', summary.blocking_integrity === 'PASS'],
  ['edit_rhythm_integrity=PASS', summary.edit_rhythm_integrity === 'PASS'],
  ['visual_style_integrity=PASS', summary.visual_style_integrity === 'PASS'],
  ['environment_motion_integrity=PASS', summary.environment_motion_integrity === 'PASS'],
  ['cinematic_signature_integrity=PASS', summary.cinematic_signature_integrity === 'PASS'],
  ['signature_confidence_integrity=PASS', summary.signature_confidence_integrity === 'PASS'],
  ['scene_remap_integrity=PASS', summary.scene_remap_integrity === 'PASS'],
  ['image_app_numerical_dna_ready=PASS', summary.image_app_numerical_dna_ready === 'PASS'],
  ['video_app_numerical_dna_ready=PASS', summary.video_app_numerical_dna_ready === 'PASS'],
  ['source_video_reproduction_readiness=PASS', summary.source_video_reproduction_readiness === 'PASS'],
  ['titanic_scene_remap_readiness=PASS', summary.titanic_scene_remap_readiness === 'PASS'],
  ['placeholder_count=0', summary.placeholder_count === 0],
  ['reference_only_count=0', summary.reference_only_count === 0],
  ['gpu_execution=false', report.policy.gpu_execution === false],
  ['latest_v5_preservation=PASS', verifyV5Preservation(projectRoot, v5Before)],
];

for (const [label, ok] of checks) {
  if (!ok) {
    console.error(`VERIFY FAIL: ${label}`);
    process.exit(1);
  }
}

const requiredPaths = [
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/source-video-registry-v2.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/frame-coordinate-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/motion-vector-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/camera-behavior-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/blocking-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/edit-rhythm-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/visual-style-numerical-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/environment-motion-dna-specification.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/cinematic-signature-library.json`,
  `${SOURCE_VIDEO_DNA_DATASET_DIR}/scene-remap-engine-specification.json`,
  IMAGE_APP_NUMERICAL_DNA_PACKAGE_PATH,
  VIDEO_APP_NUMERICAL_DNA_PACKAGE_PATH,
  `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/GHIBLI_01.json`,
  `${SOURCE_VIDEO_DNA_EXPORT_DIR}/frame-coordinate-dna/LITTLE_WOMEN_01.json`,
];

for (const rel of requiredPaths) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`VERIFY FAIL: missing output ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== NUMERICAL_DNA_PASS_VERDICT) process.exit(1);
if (report.status !== NUMERICAL_DNA_READY_STATUS) process.exit(1);
