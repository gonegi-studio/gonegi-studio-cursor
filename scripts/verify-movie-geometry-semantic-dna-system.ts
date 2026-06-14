import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT,
  MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH,
  SEMANTIC_ANCHOR_LIBRARY_PATH,
  SEMANTIC_PRESERVATION_LAYER_PATH,
  WORLD_TRANSLATION_RULES_PATH,
  writeMovieGeometrySemanticDnaSystem,
} from '../services/movieGeometrySemanticDnaSystem.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieGeometrySemanticDnaSystem(projectRoot);
const summary = report.validation_summary;

console.log(report.final_verdict);
console.log(
  [
    `semantic_system_passed=${report.semantic_system_passed}`,
    `precheck_passed=${report.precheck.precheck_passed}`,
    `semantic_anchor_count=${summary.semantic_anchor_count}`,
    `anchor_types_covered=${summary.anchor_types_covered}`,
    `titanic_anchor_count=${summary.titanic_anchor_count}`,
    `titanic_bow_meaning_preserved=${summary.titanic_bow_meaning_preserved}`,
    `semantic_meaning_preservation_enabled=${summary.semantic_meaning_preservation_enabled}`,
    `movie_geometry_dominates_structure=${summary.movie_geometry_dominates_structure}`,
    `gonegi_world_dominates_appearance=${summary.gonegi_world_dominates_appearance}`,
    `next_order=${summary.next_order}`,
  ].join(' | ')
);

for (const rel of [
  SEMANTIC_ANCHOR_LIBRARY_PATH,
  SEMANTIC_PRESERVATION_LAYER_PATH,
  WORLD_TRANSLATION_RULES_PATH,
  MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT) {
  console.error('MOVIE GEOMETRY AND SEMANTIC DNA SYSTEM FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
