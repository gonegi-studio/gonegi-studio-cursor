import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_REASONING_FLOW_KEYS,
  PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_REASONING_MODEL_V1_ENGINE_STATUS,
  PROJECT_REASONING_MODEL_V1_METRIC_KEYS,
  PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_REASONING_MODEL_V1_PATH,
  PROJECT_REASONING_MODEL_V1_REGISTRY_PATH,
  PROJECT_REASONING_MODEL_V1_REPORT_PATH,
  PROJECT_REASONING_MODEL_V1_SCHEMA_PATH,
  PROJECT_REASONING_MODEL_V1_VERSION,
  PROJECT_REASONING_RULE_KEYS,
  PROJECT_REASONING_TYPE_KEYS,
  PROJECT_REASONING_VERSION,
  writeProjectReasoningModelV1EngineReport,
} from '../services/projectReasoningModelV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectReasoningModelV1EngineReport(root);

assertExists(PROJECT_REASONING_MODEL_V1_PATH);
assertExists(PROJECT_REASONING_MODEL_V1_SCHEMA_PATH);
assertExists(PROJECT_REASONING_MODEL_V1_REGISTRY_PATH);
assertExists(PROJECT_REASONING_MODEL_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_REASONING_MODEL_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_reasoning_model_v1_version !== PROJECT_REASONING_MODEL_V1_VERSION) {
  console.error('VERSION FAIL: project_reasoning_model_v1_version mismatch');
  process.exit(1);
}

const typesModel = (
  artifact.project_reasoning_types_intelligence as {
    project_reasoning_types_model: {
      reasoning_types: Record<string, { defined?: boolean }>;
      reasoning_types_defined?: boolean;
    };
  }
).project_reasoning_types_model;

for (const key of PROJECT_REASONING_TYPE_KEYS) {
  if (typesModel.reasoning_types[key]?.defined !== true) {
    console.error(`REASONING TYPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (typesModel.reasoning_types_defined !== true) {
  console.error('TYPES FAIL: reasoning_types_defined not true');
  process.exit(1);
}

const flowModel = (
  artifact.project_reasoning_flow_intelligence as {
    project_reasoning_flow_model: Record<string, unknown>;
  }
).project_reasoning_flow_model;

for (const key of PROJECT_REASONING_FLOW_KEYS) {
  const fields = flowModel.flow_fields as Record<string, { defined?: boolean }>;
  if (fields[key]?.defined !== true) {
    console.error(`FLOW FIELD FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (flowModel.reasoning_input !== true) {
  console.error('FLOW FAIL: reasoning_input not true');
  process.exit(1);
}

if (flowModel.reasoning_path !== true) {
  console.error('FLOW FAIL: reasoning_path not true');
  process.exit(1);
}

if (flowModel.reasoning_output !== true) {
  console.error('FLOW FAIL: reasoning_output not true');
  process.exit(1);
}

if (flowModel.confidence_score !== true) {
  console.error('FLOW FAIL: confidence_score not true');
  process.exit(1);
}

if (flowModel.reasoning_trace_id === undefined || flowModel.reasoning_trace_id === '') {
  console.error('FLOW FAIL: reasoning_trace_id missing');
  process.exit(1);
}

if (flowModel.reasoning_flow_defined !== true) {
  console.error('FLOW FAIL: reasoning_flow_defined not true');
  process.exit(1);
}

const rulesModel = (
  artifact.project_reasoning_rules_intelligence as {
    project_reasoning_rules_model: Record<string, unknown>;
  }
).project_reasoning_rules_model;

for (const key of PROJECT_REASONING_RULE_KEYS) {
  if (rulesModel[key] !== true) {
    console.error(`RULES FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (rulesModel.reasoning_rules_defined !== true) {
  console.error('RULES FAIL: reasoning_rules_defined not true');
  process.exit(1);
}

const validationModel = (
  artifact.project_reasoning_validation_intelligence as {
    project_reasoning_validation_model: Record<string, unknown>;
  }
).project_reasoning_validation_model;

if (validationModel.reasoning_validation !== true) {
  console.error('VALIDATION FAIL: reasoning_validation not true');
  process.exit(1);
}

if (validationModel.reasoning_consistency_check !== true) {
  console.error('VALIDATION FAIL: reasoning_consistency_check not true');
  process.exit(1);
}

if (validationModel.reasoning_version !== PROJECT_REASONING_VERSION) {
  console.error('VALIDATION FAIL: reasoning_version mismatch');
  process.exit(1);
}

if (validationModel.reasoning_validation_defined !== true) {
  console.error('VALIDATION FAIL: reasoning_validation_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_reasoning_model_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_reasoning_model_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_REASONING_MODEL_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_reasoning_model_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_reasoning_model_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_reasoning_model_status as Record<string, boolean>;
for (const key of PROJECT_REASONING_MODEL_V1_PASS_STATUS_KEYS) {
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

if (!report.project_reasoning_model_v1_engine_passed) {
  console.error('ENGINE FAIL: project_reasoning_model_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_REASONING_MODEL_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_REASONING_MODEL_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_REASONING_MODEL_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-reasoning-model-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
