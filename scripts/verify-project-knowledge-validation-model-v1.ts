import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_KNOWLEDGE_VALIDATION_METRIC_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REGISTRY_PATH,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCHEMA_PATH,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCORE_METRIC_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_VERSION,
  PROJECT_KNOWLEDGE_VALIDATION_OUTPUT_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_RULE_KEYS,
  PROJECT_KNOWLEDGE_VALIDATION_TYPE_KEYS,
  writeProjectKnowledgeValidationModelV1EngineReport,
} from '../services/projectKnowledgeValidationModelV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectKnowledgeValidationModelV1EngineReport(root);

assertExists(PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH);
assertExists(PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCHEMA_PATH);
assertExists(PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REGISTRY_PATH);
assertExists(PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_knowledge_validation_model_v1_version !== PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_VERSION) {
  console.error('VERSION FAIL: project_knowledge_validation_model_v1_version mismatch');
  process.exit(1);
}

const typesModel = (
  artifact.project_knowledge_validation_types_intelligence as {
    project_knowledge_validation_types_model: {
      validation_types: Record<string, { defined?: boolean }>;
      validation_types_defined?: boolean;
    };
  }
).project_knowledge_validation_types_model;

for (const key of PROJECT_KNOWLEDGE_VALIDATION_TYPE_KEYS) {
  if (typesModel.validation_types[key]?.defined !== true) {
    console.error(`VALIDATION TYPE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (typesModel.validation_types_defined !== true) {
  console.error('TYPES FAIL: validation_types_defined not true');
  process.exit(1);
}

const metricsModel = (
  artifact.project_knowledge_validation_metrics_intelligence as {
    project_knowledge_validation_metrics_model: {
      validation_metrics: Record<string, { defined?: boolean }>;
      validation_metrics_defined?: boolean;
    };
  }
).project_knowledge_validation_metrics_model;

for (const key of PROJECT_KNOWLEDGE_VALIDATION_METRIC_KEYS) {
  if (metricsModel.validation_metrics[key]?.defined !== true) {
    console.error(`VALIDATION METRIC FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (metricsModel.validation_metrics_defined !== true) {
  console.error('METRICS FAIL: validation_metrics_defined not true');
  process.exit(1);
}

const rulesModel = (
  artifact.project_knowledge_validation_rules_intelligence as {
    project_knowledge_validation_rules_model: Record<string, unknown>;
  }
).project_knowledge_validation_rules_model;

for (const key of PROJECT_KNOWLEDGE_VALIDATION_RULE_KEYS) {
  if (rulesModel[key] !== true) {
    console.error(`RULES FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (rulesModel.validation_rules_defined !== true) {
  console.error('RULES FAIL: validation_rules_defined not true');
  process.exit(1);
}

const outputModel = (
  artifact.project_knowledge_validation_output_intelligence as {
    project_knowledge_validation_output_model: Record<string, unknown>;
  }
).project_knowledge_validation_output_model;

for (const key of PROJECT_KNOWLEDGE_VALIDATION_OUTPUT_KEYS) {
  const fields = outputModel.output_fields as Record<string, { defined?: boolean }>;
  if (fields[key]?.defined !== true) {
    console.error(`OUTPUT FIELD FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (outputModel.validation_score !== true) {
  console.error('OUTPUT FAIL: validation_score not true');
  process.exit(1);
}

if (outputModel.knowledge_readiness !== true) {
  console.error('OUTPUT FAIL: knowledge_readiness not true');
  process.exit(1);
}

if (outputModel.validation_trace === undefined || outputModel.validation_trace === '') {
  console.error('OUTPUT FAIL: validation_trace missing');
  process.exit(1);
}

if (outputModel.validation_result !== true) {
  console.error('OUTPUT FAIL: validation_result not true');
  process.exit(1);
}

if (outputModel.validation_output_defined !== true) {
  console.error('OUTPUT FAIL: validation_output_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_knowledge_validation_model_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_knowledge_validation_model_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_SCORE_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_knowledge_validation_model_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_knowledge_validation_model_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_knowledge_validation_model_status as Record<string, boolean>;
for (const key of PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_PASS_STATUS_KEYS) {
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

if (!report.project_knowledge_validation_model_v1_engine_passed) {
  console.error('ENGINE FAIL: project_knowledge_validation_model_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_KNOWLEDGE_VALIDATION_MODEL_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-knowledge-validation-model-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
