import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_REPLICA_PASS_VERDICT } from './movieReplicaDatasetBuilder.js';
import { writeMovieReplicaDatasetReport } from './movieReplicaDatasetValidation.js';
import {
  MOVIE_REPLICA_SCENE_GRAPH_FAIL_VERDICT,
  MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT,
  MOVIE_REPLICA_SCENE_GRAPH_PHASE,
  MOVIE_REPLICA_SCENE_GRAPH_REPORT_PATH,
  MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH,
  MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID,
  MovieReplicaSceneGraphDataset,
  RuntimeSceneGraph,
  loadAllMovieReplicaSceneGraphDatasets,
  writeMovieReplicaSceneGraphs,
} from './movieReplicaSceneGraphBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_PHASE =
  'PHASE-MOVIE-REPLICA-SCENE-GRAPH-VALIDATION-001' as const;
export const MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_ID = 'MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieReplicaSceneGraphReport {
  report_id: string;
  phase: typeof MOVIE_REPLICA_SCENE_GRAPH_PHASE;
  validation_phase: typeof MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_PHASE;
  system_id: typeof MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID;
  validation_id: typeof MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  runtime_scene_graph_created: boolean;
  character_nodes_present: boolean;
  camera_nodes_present: boolean;
  spatial_edges_present: boolean;
  timeline_edges_present: boolean;
  status: string;
  upstream_replica_verdict: string;
  metrics: {
    scene_count: number;
    character_node_count: number;
    camera_node_count: number;
    spatial_edge_count: number;
    timeline_edge_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    scene_count: number;
    character_node_count: number;
    camera_node_count: number;
    spatial_edge_count: number;
    timeline_edge_count: number;
    valid_scene_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function validateSceneGraph(graph: RuntimeSceneGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${graph.movie_id}/${graph.scene_id}`;

  if (graph.character_nodes.length <= 0) {
    issues.push({
      code: 'CHARACTER_NODE_COUNT_ZERO',
      message: `${prefix}: character node count must be > 0`,
      severity: 'error',
    });
  }
  if (graph.camera_nodes.length <= 0) {
    issues.push({
      code: 'CAMERA_NODE_COUNT_ZERO',
      message: `${prefix}: camera node count must be > 0`,
      severity: 'error',
    });
  }
  if (graph.spatial_edges.length <= 0) {
    issues.push({
      code: 'SPATIAL_EDGE_COUNT_ZERO',
      message: `${prefix}: spatial edge count must be > 0`,
      severity: 'error',
    });
  }
  if (graph.timeline_edges.length <= 0) {
    issues.push({
      code: 'TIMELINE_EDGE_COUNT_ZERO',
      message: `${prefix}: timeline edge count must be > 0`,
      severity: 'error',
    });
  }

  const flags = graph.execution_flags;
  if (flags.design_only !== true || flags.gpu_execution !== false || flags.rendering !== false) {
    issues.push({
      code: 'EXECUTION_FLAGS_INVALID',
      message: `${prefix}: execution_flags must enforce design-only runtime graph`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieReplicaSceneGraphDataset): {
  movie_id: string;
  scene_count: number;
  character_node_count: number;
  camera_node_count: number;
  spatial_edge_count: number;
  timeline_edge_count: number;
  valid_scene_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let validSceneCount = 0;

  for (const graph of dataset.scene_graphs) {
    const graphIssues = validateSceneGraph(graph);
    issues.push(...graphIssues);
    if (graphIssues.filter((issue) => issue.severity === 'error').length === 0) {
      validSceneCount += 1;
    }
  }

  return {
    movie_id: dataset.movie_id,
    scene_count: dataset.scene_graph_count,
    character_node_count: dataset.scene_graphs.reduce((sum, graph) => sum + graph.character_nodes.length, 0),
    camera_node_count: dataset.scene_graphs.reduce((sum, graph) => sum + graph.camera_nodes.length, 0),
    spatial_edge_count: dataset.scene_graphs.reduce((sum, graph) => sum + graph.spatial_edges.length, 0),
    timeline_edge_count: dataset.scene_graphs.reduce((sum, graph) => sum + graph.timeline_edges.length, 0),
    valid_scene_count: validSceneCount,
    issues,
  };
}

export function runMovieReplicaSceneGraphValidation(
  root: string,
  datasets: MovieReplicaSceneGraphDataset[],
  upstreamReplicaVerdict: string
): MovieReplicaSceneGraphReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_REPLICA_SCENE_GRAPH_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_SCENE_GRAPHS',
      message: 'No runtime scene graph datasets found',
      severity: 'error',
    });
  }

  if (upstreamReplicaVerdict !== MOVIE_REPLICA_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_REPLICA_NOT_PASS',
      message: `Upstream replica dataset verdict is ${upstreamReplicaVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    character_node_count: summaries.reduce((sum, summary) => sum + summary.character_node_count, 0),
    camera_node_count: summaries.reduce((sum, summary) => sum + summary.camera_node_count, 0),
    spatial_edge_count: summaries.reduce((sum, summary) => sum + summary.spatial_edge_count, 0),
    timeline_edge_count: summaries.reduce((sum, summary) => sum + summary.timeline_edge_count, 0),
  };

  const runtimeSceneGraphCreated = datasets.length > 0 && metrics.scene_count > 0;
  const characterNodesPresent = metrics.character_node_count > 0;
  const cameraNodesPresent = metrics.camera_node_count > 0;
  const spatialEdgesPresent = metrics.spatial_edge_count > 0;
  const timelineEdgesPresent = metrics.timeline_edge_count > 0;

  const allScenesValid = summaries.every(
    (summary) => summary.valid_scene_count === summary.scene_count && summary.scene_count > 0
  );
  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    runtimeSceneGraphCreated &&
    characterNodesPresent &&
    cameraNodesPresent &&
    spatialEdgesPresent &&
    timelineEdgesPresent &&
    allScenesValid;

  return {
    report_id: `movie_replica_scene_graph_report_${Date.now().toString(36)}`,
    phase: MOVIE_REPLICA_SCENE_GRAPH_PHASE,
    validation_phase: MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_PHASE,
    system_id: MOVIE_REPLICA_SCENE_GRAPH_SYSTEM_ID,
    validation_id: MOVIE_REPLICA_SCENE_GRAPH_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT
      : MOVIE_REPLICA_SCENE_GRAPH_FAIL_VERDICT,
    validation_passed: validationPassed,
    runtime_scene_graph_created: runtimeSceneGraphCreated,
    character_nodes_present: characterNodesPresent,
    camera_nodes_present: cameraNodesPresent,
    spatial_edges_present: spatialEdgesPresent,
    timeline_edges_present: timelineEdgesPresent,
    status: validationPassed
      ? MOVIE_REPLICA_SCENE_GRAPH_PASS_VERDICT
      : MOVIE_REPLICA_SCENE_GRAPH_FAIL_VERDICT,
    upstream_replica_verdict: upstreamReplicaVerdict,
    metrics,
    movie_summaries: summaries.map(({ issues: _issues, ...summary }) => summary),
    issues,
  };
}

export function writeMovieReplicaSceneGraphReport(projectRoot?: string): MovieReplicaSceneGraphReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieReplicaDatasetReport(root);
  writeMovieReplicaSceneGraphs(root);
  const datasets = loadAllMovieReplicaSceneGraphDatasets(root);
  const report = runMovieReplicaSceneGraphValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_REPLICA_SCENE_GRAPH_REPORT_PATH, report);
  return report;
}
