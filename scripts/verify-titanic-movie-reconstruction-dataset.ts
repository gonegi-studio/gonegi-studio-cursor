import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_BLOCKING_REGISTRY_PATH,
  TITANIC_CAMERA_REGISTRY_PATH,
  TITANIC_COMPOSITION_REGISTRY_PATH,
  TITANIC_PROP_COORDINATE_REGISTRY_PATH,
  TITANIC_RECONSTRUCTION_ADAPTER_PATH,
  TITANIC_RECONSTRUCTION_PASS_VERDICT,
  TITANIC_RECONSTRUCTION_REPORT_PATH,
  TITANIC_SCENE_REGISTRY_PATH,
  TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH,
  TITANIC_SPATIAL_DEPTH_REGISTRY_PATH,
  TITANIC_WORLD_TRANSLATION_RULES_PATH,
  writeTitanicMovieReconstructionDataset,
} from '../services/titanicMovieReconstructionDataset.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicMovieReconstructionDataset(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `reconstruction_passed=${report.reconstruction_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `scene_count=${summary.scene_count}`,
    `camera_patterns=${summary.camera_patterns}`,
    `blocking_patterns=${summary.blocking_patterns}`,
    `compositions=${summary.compositions}`,
    `semantic_anchors=${summary.semantic_anchors}`,
    `prop_coordinates=${summary.prop_coordinates}`,
    `depth_entries=${summary.depth_entries}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `movie_geometry_preservation_score=${summary.movie_geometry_preservation_score}`,
    `gonegi_translation_integrity=${summary.gonegi_translation_integrity}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `generic_harbor_regression_count=${summary.generic_harbor_regression_count}`,
    `reconstruction_readiness_score=${summary.reconstruction_readiness_score}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_SCENE_REGISTRY_PATH,
  TITANIC_CAMERA_REGISTRY_PATH,
  TITANIC_BLOCKING_REGISTRY_PATH,
  TITANIC_COMPOSITION_REGISTRY_PATH,
  TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH,
  TITANIC_PROP_COORDINATE_REGISTRY_PATH,
  TITANIC_SPATIAL_DEPTH_REGISTRY_PATH,
  TITANIC_WORLD_TRANSLATION_RULES_PATH,
  TITANIC_RECONSTRUCTION_ADAPTER_PATH,
  TITANIC_RECONSTRUCTION_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_RECONSTRUCTION_PASS_VERDICT) {
  console.error('TITANIC MOVIE RECONSTRUCTION DATASET FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
