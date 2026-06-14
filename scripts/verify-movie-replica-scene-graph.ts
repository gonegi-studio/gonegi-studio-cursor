import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT,
  MOVIE_REPLICA_SCENE_GRAPH_REPORT_PATH,
  MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH,
  SCENE_GRAPH_OUTPUTS,
} from '../services/movieReplicaSceneGraphBuilder.js';
import { writeMovieReplicaSceneGraphReport } from '../services/movieReplicaSceneGraphValidation.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeMovieReplicaSceneGraphReport(projectRoot);
const metrics = report.metrics;

console.log(report.final_verdict);
console.log(
  [
    `validation_passed=${report.validation_passed}`,
    `runtime_scene_graph_created=${report.runtime_scene_graph_created}`,
    `character_nodes_present=${report.character_nodes_present}`,
    `camera_nodes_present=${report.camera_nodes_present}`,
    `spatial_edges_present=${report.spatial_edges_present}`,
    `timeline_edges_present=${report.timeline_edges_present}`,
    `scene_count=${metrics.scene_count}`,
    `character_node_count=${metrics.character_node_count}`,
    `camera_node_count=${metrics.camera_node_count}`,
    `spatial_edge_count=${metrics.spatial_edge_count}`,
    `timeline_edge_count=${metrics.timeline_edge_count}`,
  ].join(' | ')
);

for (const rel of [
  MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH,
  MOVIE_REPLICA_SCENE_GRAPH_REPORT_PATH,
  ...SCENE_GRAPH_OUTPUTS.map((spec) => spec.output_path),
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT) {
  console.error('MOVIE REPLICA SCENE GRAPH VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
