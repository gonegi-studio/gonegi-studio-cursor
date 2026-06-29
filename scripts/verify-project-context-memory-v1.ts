import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_CONTEXT_LINK_KEYS,
  PROJECT_CONTEXT_MEMORY_FIELD_KEYS,
  PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT,
  PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS,
  PROJECT_CONTEXT_MEMORY_V1_METRIC_KEYS,
  PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS,
  PROJECT_CONTEXT_MEMORY_V1_PATH,
  PROJECT_CONTEXT_MEMORY_V1_REGISTRY_PATH,
  PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH,
  PROJECT_CONTEXT_MEMORY_V1_SCHEMA_PATH,
  PROJECT_CONTEXT_MEMORY_V1_VERSION,
  PROJECT_CONTEXT_RETRIEVAL_KEYS,
  PROJECT_CONTEXT_VERSION,
  writeProjectContextMemoryV1EngineReport,
} from '../services/projectContextMemoryV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectContextMemoryV1EngineReport(root);

assertExists(PROJECT_CONTEXT_MEMORY_V1_PATH);
assertExists(PROJECT_CONTEXT_MEMORY_V1_SCHEMA_PATH);
assertExists(PROJECT_CONTEXT_MEMORY_V1_REGISTRY_PATH);
assertExists(PROJECT_CONTEXT_MEMORY_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_CONTEXT_MEMORY_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_context_memory_v1_version !== PROJECT_CONTEXT_MEMORY_V1_VERSION) {
  console.error('VERSION FAIL: project_context_memory_v1_version mismatch');
  process.exit(1);
}

const memoryModel = (
  artifact.project_context_memory_intelligence as {
    project_context_memory_model: Record<string, unknown>;
  }
).project_context_memory_model;

for (const key of PROJECT_CONTEXT_MEMORY_FIELD_KEYS) {
  const fields = memoryModel.context_fields as Record<string, { defined?: boolean }>;
  if (fields[key]?.defined !== true) {
    console.error(`MEMORY FIELD FAIL: ${key} not defined`);
    process.exit(1);
  }
  if (memoryModel[key] === undefined || memoryModel[key] === '') {
    console.error(`MEMORY FIELD FAIL: ${key} value missing`);
    process.exit(1);
  }
}

if (memoryModel.context_memory_fields_defined !== true) {
  console.error('MEMORY FAIL: context_memory_fields_defined not true');
  process.exit(1);
}

const linksModel = (
  artifact.project_context_links_intelligence as {
    project_context_links_model: {
      context_links: Record<string, { defined?: boolean }>;
      context_links_defined?: boolean;
    };
  }
).project_context_links_model;

for (const key of PROJECT_CONTEXT_LINK_KEYS) {
  if (linksModel.context_links[key]?.defined !== true) {
    console.error(`CONTEXT LINK FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (linksModel.context_links_defined !== true) {
  console.error('LINKS FAIL: context_links_defined not true');
  process.exit(1);
}

const retrievalModel = (
  artifact.project_context_retrieval_intelligence as {
    project_context_retrieval_model: Record<string, unknown>;
  }
).project_context_retrieval_model;

for (const key of PROJECT_CONTEXT_RETRIEVAL_KEYS) {
  if (retrievalModel[key] !== true) {
    console.error(`RETRIEVAL FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (retrievalModel.context_retrieval_defined !== true) {
  console.error('RETRIEVAL FAIL: context_retrieval_defined not true');
  process.exit(1);
}

const updateModel = (
  artifact.project_context_update_intelligence as {
    project_context_update_model: Record<string, unknown>;
  }
).project_context_update_model;

if (updateModel.incremental_context_update !== true) {
  console.error('UPDATE FAIL: incremental_context_update not true');
  process.exit(1);
}

if (updateModel.context_validation !== true) {
  console.error('UPDATE FAIL: context_validation not true');
  process.exit(1);
}

if (updateModel.context_expiration_supported !== true) {
  console.error('UPDATE FAIL: context_expiration_supported not true');
  process.exit(1);
}

if (updateModel.context_version !== PROJECT_CONTEXT_VERSION) {
  console.error('UPDATE FAIL: context_version mismatch');
  process.exit(1);
}

if (updateModel.context_update_defined !== true) {
  console.error('UPDATE FAIL: context_update_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_context_memory_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_context_memory_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_CONTEXT_MEMORY_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_context_memory_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_context_memory_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_context_memory_status as Record<string, boolean>;
for (const key of PROJECT_CONTEXT_MEMORY_V1_PASS_STATUS_KEYS) {
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

if (!report.project_context_memory_v1_engine_passed) {
  console.error('ENGINE FAIL: project_context_memory_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_CONTEXT_MEMORY_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_CONTEXT_MEMORY_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-context-memory-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
