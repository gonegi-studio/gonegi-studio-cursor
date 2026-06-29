import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_KNOWLEDGE_ENTITY_TYPE_KEYS,
  PROJECT_KNOWLEDGE_IDENTITY_KEYS,
  PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_MODEL_V1_METRIC_KEYS,
  PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_MODEL_V1_REGISTRY_PATH,
  PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH,
  PROJECT_KNOWLEDGE_MODEL_V1_SCHEMA_PATH,
  PROJECT_KNOWLEDGE_MODEL_V1_VERSION,
  PROJECT_KNOWLEDGE_RELATIONSHIP_KEYS,
  writeProjectKnowledgeModelV1EngineReport,
} from '../services/projectKnowledgeModelV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectKnowledgeModelV1EngineReport(root);

assertExists(PROJECT_KNOWLEDGE_MODEL_V1_PATH);
assertExists(PROJECT_KNOWLEDGE_MODEL_V1_SCHEMA_PATH);
assertExists(PROJECT_KNOWLEDGE_MODEL_V1_REGISTRY_PATH);
assertExists(PROJECT_KNOWLEDGE_MODEL_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_KNOWLEDGE_MODEL_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_knowledge_model_v1_version !== PROJECT_KNOWLEDGE_MODEL_V1_VERSION) {
  console.error('VERSION FAIL: project_knowledge_model_v1_version mismatch');
  process.exit(1);
}

const entityTypesModel = (
  artifact.project_knowledge_entity_types_intelligence as {
    project_knowledge_entity_types_model: {
      entity_types: Record<string, { defined?: boolean }>;
      project_knowledge_entity_types_defined?: boolean;
    };
  }
).project_knowledge_entity_types_model;

for (const key of PROJECT_KNOWLEDGE_ENTITY_TYPE_KEYS) {
  if (entityTypesModel.entity_types[key]?.defined !== true) {
    console.error(`ENTITY TYPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (entityTypesModel.project_knowledge_entity_types_defined !== true) {
  console.error('ENTITY TYPES FAIL: project_knowledge_entity_types_defined not true');
  process.exit(1);
}

const relationshipsModel = (
  artifact.project_knowledge_relationships_intelligence as {
    project_knowledge_relationships_model: {
      relationships: Record<string, { defined?: boolean }>;
      project_knowledge_relationships_defined?: boolean;
    };
  }
).project_knowledge_relationships_model;

for (const key of PROJECT_KNOWLEDGE_RELATIONSHIP_KEYS) {
  if (relationshipsModel.relationships[key]?.defined !== true) {
    console.error(`RELATIONSHIP FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (relationshipsModel.project_knowledge_relationships_defined !== true) {
  console.error('RELATIONSHIPS FAIL: project_knowledge_relationships_defined not true');
  process.exit(1);
}

const identityModel = (
  artifact.project_knowledge_identity_intelligence as {
    project_knowledge_identity_model: Record<string, unknown>;
  }
).project_knowledge_identity_model;

for (const key of PROJECT_KNOWLEDGE_IDENTITY_KEYS) {
  const field = identityModel.identity_fields as Record<string, { defined?: boolean }>;
  if (field[key]?.defined !== true) {
    console.error(`IDENTITY FAIL: ${key} not defined`);
    process.exit(1);
  }
  if (identityModel[key] === undefined || identityModel[key] === '') {
    console.error(`IDENTITY FAIL: ${key} value missing`);
    process.exit(1);
  }
}

if (identityModel.project_knowledge_identity_defined !== true) {
  console.error('IDENTITY FAIL: project_knowledge_identity_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_knowledge_model_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_knowledge_model_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_KNOWLEDGE_MODEL_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_knowledge_model_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_knowledge_model_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_knowledge_model_status as Record<string, boolean>;
for (const key of PROJECT_KNOWLEDGE_MODEL_V1_PASS_STATUS_KEYS) {
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

if (!report.project_knowledge_model_v1_engine_passed) {
  console.error('ENGINE FAIL: project_knowledge_model_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_KNOWLEDGE_MODEL_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-knowledge-model-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
