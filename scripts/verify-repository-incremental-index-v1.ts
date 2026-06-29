import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_METRIC_KEYS,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REGISTRY_PATH,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_SCHEMA_PATH,
  PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_VERSION,
  REPOSITORY_CHANGE_DETECTION_KEYS,
  REPOSITORY_INCREMENTAL_INDEX_FIELD_KEYS,
  writeProjectRepositoryIncrementalIndexV1EngineReport,
} from '../services/projectRepositoryIncrementalIndexV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectRepositoryIncrementalIndexV1EngineReport(root);

assertExists(PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH);
assertExists(PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_SCHEMA_PATH);
assertExists(PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REGISTRY_PATH);
assertExists(PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.repository_incremental_index_v1_version !== PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_VERSION) {
  console.error('VERSION FAIL: repository_incremental_index_v1_version mismatch');
  process.exit(1);
}

const indexModel = (
  artifact.repository_incremental_index_intelligence as {
    repository_incremental_index_model: Record<string, unknown>;
  }
).repository_incremental_index_model;

for (const key of REPOSITORY_INCREMENTAL_INDEX_FIELD_KEYS) {
  if (!indexModel[key]) {
    console.error(`INDEX FAIL: missing ${key}`);
    process.exit(1);
  }
}

const changeDetection = (
  artifact.repository_change_detection_intelligence as {
    repository_change_detection_model: Record<string, unknown>;
  }
).repository_change_detection_model;

for (const key of REPOSITORY_CHANGE_DETECTION_KEYS) {
  if (!changeDetection[key]) {
    console.error(`CHANGE DETECTION FAIL: missing ${key}`);
    process.exit(1);
  }
}

const updatePolicy = (
  artifact.repository_update_policy_intelligence as {
    repository_update_policy_model: Record<string, unknown>;
  }
).repository_update_policy_model;

for (const [key, expected] of [
  ['changed_files_only', true],
  ['incremental_update', true],
  ['full_rescan_required', false],
  ['incremental_checkpoint_supported', true],
] as const) {
  if (updatePolicy[key] !== expected) {
    console.error(`UPDATE POLICY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const consistency = (
  artifact.repository_consistency_intelligence as {
    repository_consistency_model: Record<string, unknown>;
  }
).repository_consistency_model;

for (const [key, expected] of [
  ['cache_validation', true],
  ['incremental_consistency_check', true],
  ['cache_integrity_check', true],
] as const) {
  if (consistency[key] !== expected) {
    console.error(`CONSISTENCY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const rip = (
  artifact.repository_incremental_index_model_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.repository_incremental_index_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'repository_incremental_index_score' && entry.master !== true) {
    console.error('METRICS FAIL: repository_incremental_index_score must be master');
    process.exit(1);
  }
}

const status = artifact.repository_incremental_index_status as Record<string, boolean>;
for (const key of PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_PASS_STATUS_KEYS) {
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

if (!report.project_repository_incremental_index_v1_engine_passed) {
  console.error('ENGINE FAIL: project_repository_incremental_index_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_REPOSITORY_INCREMENTAL_INDEX_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-repository-incremental-index-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
