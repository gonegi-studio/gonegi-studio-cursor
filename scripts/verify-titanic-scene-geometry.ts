import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH,
  TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH,
  TITANIC_GEOMETRY_PRESERVATION_RULES_PATH,
  TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH,
  TITANIC_SCENE_GEOMETRY_PASS_VERDICT,
  TITANIC_SCENE_GEOMETRY_REGISTRY_PATH,
  TITANIC_SCENE_GEOMETRY_REPORT_PATH,
  writeTitanicSceneGeometryDensification,
} from '../services/titanicSceneGeometryDensification.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTitanicSceneGeometryDensification(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `geometry_passed=${report.geometry_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `scene_geometry_count=${summary.scene_geometry_count}`,
    `placement_count=${summary.placement_count}`,
    `fingerprint_count=${summary.fingerprint_count}`,
    `geometry_integrity=${summary.geometry_integrity}`,
    `movie_geometry_preservation_score=${summary.movie_geometry_preservation_score}`,
    `semantic_anchor_binding_rate=${summary.semantic_anchor_binding_rate}`,
    `scene_fingerprint_uniqueness=${summary.scene_fingerprint_uniqueness}`,
    `world_identity_lock=${summary.world_identity_lock}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  TITANIC_SCENE_GEOMETRY_REGISTRY_PATH,
  TITANIC_CHARACTER_PLACEMENT_REGISTRY_PATH,
  TITANIC_CAMERA_TRAJECTORY_REGISTRY_PATH,
  TITANIC_SCENE_FINGERPRINT_REGISTRY_PATH,
  TITANIC_GEOMETRY_PRESERVATION_RULES_PATH,
  TITANIC_SCENE_GEOMETRY_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TITANIC_SCENE_GEOMETRY_PASS_VERDICT) {
  console.error('TITANIC SCENE GEOMETRY DENSIFICATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
