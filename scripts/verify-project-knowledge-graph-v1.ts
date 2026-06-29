import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_KNOWLEDGE_GRAPH_EDGE_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_NAVIGATION_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_NODE_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_GRAPH_V1_METRIC_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_GRAPH_V1_PATH,
  PROJECT_KNOWLEDGE_GRAPH_V1_REGISTRY_PATH,
  PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH,
  PROJECT_KNOWLEDGE_GRAPH_V1_SCHEMA_PATH,
  PROJECT_KNOWLEDGE_GRAPH_V1_VERSION,
  PROJECT_KNOWLEDGE_GRAPH_VERSION,
  writeProjectKnowledgeGraphV1EngineReport,
} from '../services/projectKnowledgeGraphV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectKnowledgeGraphV1EngineReport(root);

assertExists(PROJECT_KNOWLEDGE_GRAPH_V1_PATH);
assertExists(PROJECT_KNOWLEDGE_GRAPH_V1_SCHEMA_PATH);
assertExists(PROJECT_KNOWLEDGE_GRAPH_V1_REGISTRY_PATH);
assertExists(PROJECT_KNOWLEDGE_GRAPH_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_KNOWLEDGE_GRAPH_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_knowledge_graph_v1_version !== PROJECT_KNOWLEDGE_GRAPH_V1_VERSION) {
  console.error('VERSION FAIL: project_knowledge_graph_v1_version mismatch');
  process.exit(1);
}

const nodesModel = (
  artifact.project_knowledge_graph_nodes_intelligence as {
    project_knowledge_graph_nodes_model: {
      nodes: Record<string, { defined?: boolean }>;
      knowledge_graph_nodes_defined?: boolean;
    };
  }
).project_knowledge_graph_nodes_model;

for (const key of PROJECT_KNOWLEDGE_GRAPH_NODE_KEYS) {
  if (nodesModel.nodes[key]?.defined !== true) {
    console.error(`NODE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (nodesModel.knowledge_graph_nodes_defined !== true) {
  console.error('NODES FAIL: knowledge_graph_nodes_defined not true');
  process.exit(1);
}

const edgesModel = (
  artifact.project_knowledge_graph_edges_intelligence as {
    project_knowledge_graph_edges_model: {
      edges: Record<string, { defined?: boolean }>;
      knowledge_graph_edges_defined?: boolean;
    };
  }
).project_knowledge_graph_edges_model;

for (const key of PROJECT_KNOWLEDGE_GRAPH_EDGE_KEYS) {
  if (edgesModel.edges[key]?.defined !== true) {
    console.error(`EDGE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (edgesModel.knowledge_graph_edges_defined !== true) {
  console.error('EDGES FAIL: knowledge_graph_edges_defined not true');
  process.exit(1);
}

const navigationModel = (
  artifact.project_graph_navigation_intelligence as {
    project_graph_navigation_model: Record<string, unknown>;
  }
).project_graph_navigation_model;

for (const key of PROJECT_KNOWLEDGE_GRAPH_NAVIGATION_KEYS) {
  if (navigationModel[key] !== true) {
    console.error(`NAVIGATION FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (navigationModel.graph_navigation_defined !== true) {
  console.error('NAVIGATION FAIL: graph_navigation_defined not true');
  process.exit(1);
}

const integrityModel = (
  artifact.project_graph_integrity_intelligence as {
    project_graph_integrity_model: Record<string, unknown>;
  }
).project_graph_integrity_model;

if (integrityModel.graph_validation !== true) {
  console.error('INTEGRITY FAIL: graph_validation not true');
  process.exit(1);
}

if (integrityModel.orphan_node_check !== true) {
  console.error('INTEGRITY FAIL: orphan_node_check not true');
  process.exit(1);
}

if (integrityModel.cycle_detection_supported !== true) {
  console.error('INTEGRITY FAIL: cycle_detection_supported not true');
  process.exit(1);
}

if (integrityModel.disconnected_subgraph_check !== true) {
  console.error('INTEGRITY FAIL: disconnected_subgraph_check not true');
  process.exit(1);
}

if (integrityModel.graph_version !== PROJECT_KNOWLEDGE_GRAPH_VERSION) {
  console.error('INTEGRITY FAIL: graph_version mismatch');
  process.exit(1);
}

if (integrityModel.graph_integrity_defined !== true) {
  console.error('INTEGRITY FAIL: graph_integrity_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_knowledge_graph_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_knowledge_graph_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_KNOWLEDGE_GRAPH_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_knowledge_graph_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_knowledge_graph_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_knowledge_graph_status as Record<string, boolean>;
for (const key of PROJECT_KNOWLEDGE_GRAPH_V1_PASS_STATUS_KEYS) {
  if (key === 'bootstrap_completed') {
    if (status[key] !== false) {
      console.error('STATUS FAIL: bootstrap_completed must remain false at planning phase');
      process.exit(1);
    }
    continue;
  }
  if (status[key] !== true) {
    console.error(`STATUS FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (!report.project_knowledge_graph_v1_engine_passed) {
  console.error('ENGINE FAIL: project_knowledge_graph_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_KNOWLEDGE_GRAPH_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-knowledge-graph-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
