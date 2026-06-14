import fs from 'node:fs';
import path from 'node:path';
import { MOVIE_SPATIAL_DIR, MOVIE_SPATIAL_ENGINE_PASS_VERDICT } from './movieSpatialEngineBuilder.js';
import { writeMovieSpatialEngineReport } from './movieSpatialEngineValidation.js';
import {
  MOVIE_SPATIAL_GRAPH_FAIL_VERDICT,
  MOVIE_SPATIAL_GRAPH_PASS_VERDICT,
  MOVIE_SPATIAL_GRAPH_PHASE,
  MOVIE_SPATIAL_GRAPH_REPORT_PATH,
  MOVIE_SPATIAL_GRAPH_SCHEMA_PATH,
  MOVIE_SPATIAL_GRAPH_SYSTEM_ID,
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
  writeMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_SPATIAL_GRAPH_VALIDATION_PHASE = 'PHASE-MOVIE-SPATIAL-GRAPH-VALIDATION-001' as const;
export const MOVIE_SPATIAL_GRAPH_VALIDATION_ID = 'MOVIE_SPATIAL_GRAPH_VALIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface MovieSpatialGraphReport {
  report_id: string;
  phase: typeof MOVIE_SPATIAL_GRAPH_PHASE;
  validation_phase: typeof MOVIE_SPATIAL_GRAPH_VALIDATION_PHASE;
  system_id: typeof MOVIE_SPATIAL_GRAPH_SYSTEM_ID;
  validation_id: typeof MOVIE_SPATIAL_GRAPH_VALIDATION_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  spatial_graph_created: boolean;
  camera_nodes_present: boolean;
  character_nodes_present: boolean;
  spatial_edges_present: boolean;
  visibility_edges_present: boolean;
  depth_edges_present: boolean;
  status: string;
  upstream_spatial_engine_verdict: string;
  metrics: {
    movie_count: number;
    scene_count: number;
    camera_node_count: number;
    character_node_count: number;
    prop_node_count: number;
    spatial_edge_count: number;
    visibility_edge_count: number;
    depth_edge_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    graph_dataset_id: string;
    scene_count: number;
    camera_node_count: number;
    character_node_count: number;
    prop_node_count: number;
    spatial_edge_count: number;
    visibility_edge_count: number;
    depth_edge_count: number;
  }>;
  issues: ValidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function validateSpatialGraph(graph: MovieSpatialGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `${graph.movie_id}/${graph.scene_id}`;

  if (!Array.isArray(graph.camera_nodes) || graph.camera_nodes.length === 0) {
    issues.push({
      code: 'CAMERA_NODES_MISSING',
      message: `${prefix}: camera_nodes must contain at least one node`,
      severity: 'error',
    });
  }

  if (!Array.isArray(graph.character_nodes) || graph.character_nodes.length === 0) {
    issues.push({
      code: 'CHARACTER_NODES_MISSING',
      message: `${prefix}: character_nodes must contain at least one node`,
      severity: 'error',
    });
  }

  if (!Array.isArray(graph.spatial_edges) || graph.spatial_edges.length === 0) {
    issues.push({
      code: 'SPATIAL_EDGES_MISSING',
      message: `${prefix}: spatial_edges must contain at least one edge`,
      severity: 'error',
    });
  }

  if (!Array.isArray(graph.visibility_edges) || graph.visibility_edges.length === 0) {
    issues.push({
      code: 'VISIBILITY_EDGES_MISSING',
      message: `${prefix}: visibility_edges must contain at least one edge`,
      severity: 'error',
    });
  }

  if (!Array.isArray(graph.depth_edges) || graph.depth_edges.length === 0) {
    issues.push({
      code: 'DEPTH_EDGES_MISSING',
      message: `${prefix}: depth_edges must contain at least one edge`,
      severity: 'error',
    });
  }

  return issues;
}

function summarizeDataset(dataset: MovieSpatialGraphDataset): {
  movie_id: string;
  graph_dataset_id: string;
  scene_count: number;
  camera_node_count: number;
  character_node_count: number;
  prop_node_count: number;
  spatial_edge_count: number;
  visibility_edge_count: number;
  depth_edge_count: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  if (dataset.spatial_graphs.length === 0) {
    issues.push({
      code: 'NO_SPATIAL_GRAPHS',
      message: `${dataset.movie_id}: spatial_graphs is empty`,
      severity: 'error',
    });
  }

  for (const graph of dataset.spatial_graphs) {
    issues.push(...validateSpatialGraph(graph));
  }

  return {
    movie_id: dataset.movie_id,
    graph_dataset_id: dataset.graph_dataset_id,
    scene_count: dataset.spatial_graphs.length,
    camera_node_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.camera_nodes.length, 0),
    character_node_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.character_nodes.length, 0),
    prop_node_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.prop_nodes.length, 0),
    spatial_edge_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.spatial_edges.length, 0),
    visibility_edge_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.visibility_edges.length, 0),
    depth_edge_count: dataset.spatial_graphs.reduce((sum, graph) => sum + graph.depth_edges.length, 0),
    issues,
  };
}

export function runMovieSpatialGraphValidation(
  root: string,
  datasets: MovieSpatialGraphDataset[],
  upstreamSpatialEngineVerdict: string
): MovieSpatialGraphReport {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_DIR))) {
    issues.push({
      code: 'MISSING_SPATIAL_DIR',
      message: `${MOVIE_SPATIAL_DIR} does not exist`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, MOVIE_SPATIAL_GRAPH_SCHEMA_PATH))) {
    issues.push({
      code: 'MISSING_SCHEMA',
      message: `${MOVIE_SPATIAL_GRAPH_SCHEMA_PATH} does not exist`,
      severity: 'error',
    });
  }

  if (datasets.length === 0) {
    issues.push({
      code: 'NO_DATASETS',
      message: 'No movie spatial graph datasets found',
      severity: 'error',
    });
  }

  if (upstreamSpatialEngineVerdict !== MOVIE_SPATIAL_ENGINE_PASS_VERDICT) {
    issues.push({
      code: 'UPSTREAM_SPATIAL_ENGINE_NOT_PASS',
      message: `Upstream spatial engine verdict is ${upstreamSpatialEngineVerdict}`,
      severity: 'error',
    });
  }

  const summaries = datasets.map((dataset) => summarizeDataset(dataset));
  issues.push(...summaries.flatMap((summary) => summary.issues));

  const metrics = {
    movie_count: datasets.length,
    scene_count: summaries.reduce((sum, summary) => sum + summary.scene_count, 0),
    camera_node_count: summaries.reduce((sum, summary) => sum + summary.camera_node_count, 0),
    character_node_count: summaries.reduce((sum, summary) => sum + summary.character_node_count, 0),
    prop_node_count: summaries.reduce((sum, summary) => sum + summary.prop_node_count, 0),
    spatial_edge_count: summaries.reduce((sum, summary) => sum + summary.spatial_edge_count, 0),
    visibility_edge_count: summaries.reduce((sum, summary) => sum + summary.visibility_edge_count, 0),
    depth_edge_count: summaries.reduce((sum, summary) => sum + summary.depth_edge_count, 0),
  };

  const spatialGraphCreated = datasets.length > 0 && metrics.scene_count > 0;
  const cameraNodesPresent = metrics.camera_node_count >= metrics.scene_count && metrics.scene_count > 0;
  const characterNodesPresent = metrics.character_node_count >= metrics.scene_count;
  const spatialEdgesPresent = metrics.spatial_edge_count >= metrics.scene_count;
  const visibilityEdgesPresent = metrics.visibility_edge_count >= metrics.scene_count;
  const depthEdgesPresent = metrics.depth_edge_count >= metrics.scene_count;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    spatialGraphCreated &&
    cameraNodesPresent &&
    characterNodesPresent &&
    spatialEdgesPresent &&
    visibilityEdgesPresent &&
    depthEdgesPresent;

  return {
    report_id: `movie_spatial_graph_report_${Date.now().toString(36)}`,
    phase: MOVIE_SPATIAL_GRAPH_PHASE,
    validation_phase: MOVIE_SPATIAL_GRAPH_VALIDATION_PHASE,
    system_id: MOVIE_SPATIAL_GRAPH_SYSTEM_ID,
    validation_id: MOVIE_SPATIAL_GRAPH_VALIDATION_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? MOVIE_SPATIAL_GRAPH_PASS_VERDICT : MOVIE_SPATIAL_GRAPH_FAIL_VERDICT,
    validation_passed: validationPassed,
    spatial_graph_created: spatialGraphCreated,
    camera_nodes_present: cameraNodesPresent,
    character_nodes_present: characterNodesPresent,
    spatial_edges_present: spatialEdgesPresent,
    visibility_edges_present: visibilityEdgesPresent,
    depth_edges_present: depthEdgesPresent,
    status: validationPassed ? MOVIE_SPATIAL_GRAPH_PASS_VERDICT : MOVIE_SPATIAL_GRAPH_FAIL_VERDICT,
    upstream_spatial_engine_verdict: upstreamSpatialEngineVerdict,
    metrics,
    movie_summaries: summaries.map((summary) => ({
      movie_id: summary.movie_id,
      graph_dataset_id: summary.graph_dataset_id,
      scene_count: summary.scene_count,
      camera_node_count: summary.camera_node_count,
      character_node_count: summary.character_node_count,
      prop_node_count: summary.prop_node_count,
      spatial_edge_count: summary.spatial_edge_count,
      visibility_edge_count: summary.visibility_edge_count,
      depth_edge_count: summary.depth_edge_count,
    })),
    issues,
  };
}

export function writeMovieSpatialGraphReport(projectRoot?: string): MovieSpatialGraphReport {
  const root = resolveProjectRoot(projectRoot);
  const upstreamReport = writeMovieSpatialEngineReport(root);
  writeMovieSpatialGraphDatasets(root);
  const datasets = loadAllMovieSpatialGraphDatasets(root);
  const report = runMovieSpatialGraphValidation(root, datasets, upstreamReport.final_verdict);
  writeJson(root, MOVIE_SPATIAL_GRAPH_REPORT_PATH, report);
  return report;
}
