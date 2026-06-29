import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_METRIC_KEYS,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REGISTRY_PATH,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_SCHEMA_PATH,
  PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_VERSION,
  PROJECT_SEMANTIC_RELATIONSHIP_TYPE_KEYS,
  PROJECT_SEMANTIC_RELATIONSHIP_VERSION,
  writeProjectSemanticRelationshipModelV1EngineReport,
} from '../services/projectSemanticRelationshipModelV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectSemanticRelationshipModelV1EngineReport(root);

assertExists(PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH);
assertExists(PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_SCHEMA_PATH);
assertExists(PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REGISTRY_PATH);
assertExists(PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_semantic_relationship_model_v1_version !== PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_VERSION) {
  console.error('VERSION FAIL: project_semantic_relationship_model_v1_version mismatch');
  process.exit(1);
}

const typesModel = (
  artifact.project_semantic_relationship_types_intelligence as {
    project_semantic_relationship_types_model: {
      relationship_types: Record<string, { defined?: boolean }>;
      semantic_relationship_types_defined?: boolean;
    };
  }
).project_semantic_relationship_types_model;

for (const key of PROJECT_SEMANTIC_RELATIONSHIP_TYPE_KEYS) {
  if (typesModel.relationship_types[key]?.defined !== true) {
    console.error(`RELATIONSHIP TYPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (typesModel.semantic_relationship_types_defined !== true) {
  console.error('TYPES FAIL: semantic_relationship_types_defined not true');
  process.exit(1);
}

const directionModel = (
  artifact.project_relationship_direction_intelligence as {
    project_relationship_direction_model: Record<string, unknown>;
  }
).project_relationship_direction_model;

if (directionModel.source_entity !== true) {
  console.error('DIRECTION FAIL: source_entity not true');
  process.exit(1);
}

if (directionModel.target_entity !== true) {
  console.error('DIRECTION FAIL: target_entity not true');
  process.exit(1);
}

if (directionModel.relationship_strength !== true) {
  console.error('DIRECTION FAIL: relationship_strength not true');
  process.exit(1);
}

if (directionModel.relationship_priority !== true) {
  console.error('DIRECTION FAIL: relationship_priority not true');
  process.exit(1);
}

if (directionModel.bidirectional_supported !== true) {
  console.error('DIRECTION FAIL: bidirectional_supported not true');
  process.exit(1);
}

if (directionModel.relationship_direction_defined !== true) {
  console.error('DIRECTION FAIL: relationship_direction_defined not true');
  process.exit(1);
}

const validationModel = (
  artifact.project_relationship_validation_intelligence as {
    project_relationship_validation_model: Record<string, unknown>;
  }
).project_relationship_validation_model;

if (validationModel.relationship_validation !== true) {
  console.error('VALIDATION FAIL: relationship_validation not true');
  process.exit(1);
}

if (validationModel.semantic_graph_validation !== true) {
  console.error('VALIDATION FAIL: semantic_graph_validation not true');
  process.exit(1);
}

if (validationModel.cycle_detection_supported !== true) {
  console.error('VALIDATION FAIL: cycle_detection_supported not true');
  process.exit(1);
}

if (validationModel.orphan_relationship_check !== true) {
  console.error('VALIDATION FAIL: orphan_relationship_check not true');
  process.exit(1);
}

if (validationModel.relationship_validation_defined !== true) {
  console.error('VALIDATION FAIL: relationship_validation_defined not true');
  process.exit(1);
}

const versioningModel = (
  artifact.project_relationship_versioning_intelligence as {
    project_relationship_versioning_model: Record<string, unknown>;
  }
).project_relationship_versioning_model;

if (versioningModel.relationship_version !== PROJECT_SEMANTIC_RELATIONSHIP_VERSION) {
  console.error('VERSIONING FAIL: relationship_version mismatch');
  process.exit(1);
}

if (versioningModel.lineage_supported !== true) {
  console.error('VERSIONING FAIL: lineage_supported not true');
  process.exit(1);
}

if (versioningModel.history_supported !== true) {
  console.error('VERSIONING FAIL: history_supported not true');
  process.exit(1);
}

if (versioningModel.relationship_versioning_defined !== true) {
  console.error('VERSIONING FAIL: relationship_versioning_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_semantic_relationship_model_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_semantic_relationship_model_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_semantic_relationship_model_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_semantic_relationship_model_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_semantic_relationship_model_status as Record<string, boolean>;
for (const key of PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_PASS_STATUS_KEYS) {
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

if (!report.project_semantic_relationship_model_v1_engine_passed) {
  console.error('ENGINE FAIL: project_semantic_relationship_model_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_SEMANTIC_RELATIONSHIP_MODEL_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-semantic-relationship-model-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
