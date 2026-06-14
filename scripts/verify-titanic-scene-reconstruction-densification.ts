import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_BODY_POSE_REGISTRY_PATH,
  TITANIC_CHARACTER_INTERACTION_REGISTRY_PATH,
  TITANIC_DENSE_PASS_VERDICT,
  TITANIC_DENSE_REPORT_PATH,
  TITANIC_DEPTH_LAYER_REGISTRY_PATH,
  TITANIC_PROP_LAYOUT_REGISTRY_PATH,
  TITANIC_SCENE_DENSITY_SCORE_REGISTRY_PATH,
  TITANIC_SCENE_MASTER_REGISTRY_PATH,
  writeTitanicSceneReconstructionDensification,
} from '../services/titanicSceneReconstructionDensification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicSceneReconstructionDensification(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `densification_passed=${report.densification_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `scene_count=${summary.scene_count}`,
    `reconstruction_density_score=${summary.reconstruction_density_score}`,
    `scene_geometry_preservation_score=${summary.scene_geometry_preservation_score}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `scene_fingerprint_uniqueness=${summary.scene_fingerprint_uniqueness}`,
    `projected_reconstruction_fidelity_estimate=${summary.projected_reconstruction_fidelity_estimate}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_SCENE_MASTER_REGISTRY_PATH,
  TITANIC_BODY_POSE_REGISTRY_PATH,
  TITANIC_CHARACTER_INTERACTION_REGISTRY_PATH,
  TITANIC_PROP_LAYOUT_REGISTRY_PATH,
  TITANIC_DEPTH_LAYER_REGISTRY_PATH,
  TITANIC_SCENE_DENSITY_SCORE_REGISTRY_PATH,
  TITANIC_DENSE_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_DENSE_PASS_VERDICT) {
  console.error('TITANIC SCENE RECONSTRUCTION DENSIFICATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
