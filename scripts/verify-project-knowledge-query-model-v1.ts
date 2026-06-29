import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_KNOWLEDGE_QUERY_FLOW_KEYS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_METRIC_KEYS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REGISTRY_PATH,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_SCHEMA_PATH,
  PROJECT_KNOWLEDGE_QUERY_MODEL_V1_VERSION,
  PROJECT_KNOWLEDGE_QUERY_RULE_KEYS,
  PROJECT_KNOWLEDGE_QUERY_SCOPE_KEYS,
  PROJECT_KNOWLEDGE_QUERY_TYPE_KEYS,
  PROJECT_KNOWLEDGE_QUERY_VERSION,
  writeProjectKnowledgeQueryModelV1EngineReport,
} from '../services/projectKnowledgeQueryModelV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectKnowledgeQueryModelV1EngineReport(root);

assertExists(PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH);
assertExists(PROJECT_KNOWLEDGE_QUERY_MODEL_V1_SCHEMA_PATH);
assertExists(PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REGISTRY_PATH);
assertExists(PROJECT_KNOWLEDGE_QUERY_MODEL_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_knowledge_query_model_v1_version !== PROJECT_KNOWLEDGE_QUERY_MODEL_V1_VERSION) {
  console.error('VERSION FAIL: project_knowledge_query_model_v1_version mismatch');
  process.exit(1);
}

const typesModel = (
  artifact.project_knowledge_query_types_intelligence as {
    project_knowledge_query_types_model: {
      query_types: Record<string, { defined?: boolean }>;
      query_types_defined?: boolean;
    };
  }
).project_knowledge_query_types_model;

for (const key of PROJECT_KNOWLEDGE_QUERY_TYPE_KEYS) {
  if (typesModel.query_types[key]?.defined !== true) {
    console.error(`QUERY TYPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (typesModel.query_types_defined !== true) {
  console.error('TYPES FAIL: query_types_defined not true');
  process.exit(1);
}

const scopeModel = (
  artifact.project_knowledge_query_scope_intelligence as {
    project_knowledge_query_scope_model: {
      query_scopes: Record<string, { defined?: boolean }>;
      query_scope_defined?: boolean;
    };
  }
).project_knowledge_query_scope_model;

for (const key of PROJECT_KNOWLEDGE_QUERY_SCOPE_KEYS) {
  if (scopeModel.query_scopes[key]?.defined !== true) {
    console.error(`QUERY SCOPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (scopeModel.query_scope_defined !== true) {
  console.error('SCOPE FAIL: query_scope_defined not true');
  process.exit(1);
}

const flowModel = (
  artifact.project_knowledge_query_flow_intelligence as {
    project_knowledge_query_flow_model: Record<string, unknown>;
  }
).project_knowledge_query_flow_model;

for (const key of PROJECT_KNOWLEDGE_QUERY_FLOW_KEYS) {
  const fields = flowModel.flow_fields as Record<string, { defined?: boolean }>;
  if (fields[key]?.defined !== true) {
    console.error(`FLOW FIELD FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (flowModel.query_input !== true) {
  console.error('FLOW FAIL: query_input not true');
  process.exit(1);
}

if (flowModel.query_plan !== true) {
  console.error('FLOW FAIL: query_plan not true');
  process.exit(1);
}

if (flowModel.query_result !== true) {
  console.error('FLOW FAIL: query_result not true');
  process.exit(1);
}

if (flowModel.query_confidence !== true) {
  console.error('FLOW FAIL: query_confidence not true');
  process.exit(1);
}

if (flowModel.query_trace_id === undefined || flowModel.query_trace_id === '') {
  console.error('FLOW FAIL: query_trace_id missing');
  process.exit(1);
}

if (flowModel.query_flow_defined !== true) {
  console.error('FLOW FAIL: query_flow_defined not true');
  process.exit(1);
}

const rulesModel = (
  artifact.project_knowledge_query_rules_intelligence as {
    project_knowledge_query_rules_model: Record<string, unknown>;
  }
).project_knowledge_query_rules_model;

for (const key of PROJECT_KNOWLEDGE_QUERY_RULE_KEYS) {
  if (rulesModel[key] !== true) {
    console.error(`RULES FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (rulesModel.query_rules_defined !== true) {
  console.error('RULES FAIL: query_rules_defined not true');
  process.exit(1);
}

const validationModel = (
  artifact.project_knowledge_query_validation_intelligence as {
    project_knowledge_query_validation_model: Record<string, unknown>;
  }
).project_knowledge_query_validation_model;

if (validationModel.query_validation !== true) {
  console.error('VALIDATION FAIL: query_validation not true');
  process.exit(1);
}

if (validationModel.query_consistency_check !== true) {
  console.error('VALIDATION FAIL: query_consistency_check not true');
  process.exit(1);
}

if (validationModel.query_version !== PROJECT_KNOWLEDGE_QUERY_VERSION) {
  console.error('VALIDATION FAIL: query_version mismatch');
  process.exit(1);
}

if (validationModel.query_validation_defined !== true) {
  console.error('VALIDATION FAIL: query_validation_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_knowledge_query_model_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_knowledge_query_model_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_KNOWLEDGE_QUERY_MODEL_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_knowledge_query_model_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_knowledge_query_model_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_knowledge_query_model_status as Record<string, boolean>;
for (const key of PROJECT_KNOWLEDGE_QUERY_MODEL_V1_PASS_STATUS_KEYS) {
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

if (!report.project_knowledge_query_model_v1_engine_passed) {
  console.error('ENGINE FAIL: project_knowledge_query_model_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_KNOWLEDGE_QUERY_MODEL_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-knowledge-query-model-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
