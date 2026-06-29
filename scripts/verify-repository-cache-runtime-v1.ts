import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_METRIC_KEYS,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REGISTRY_PATH,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_SCHEMA_PATH,
  PROJECT_REPOSITORY_CACHE_RUNTIME_V1_VERSION,
  REPOSITORY_CACHE_RUNTIME_COMPONENT_KEYS,
  writeProjectRepositoryCacheRuntimeV1EngineReport,
} from '../services/projectRepositoryCacheRuntimeV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectRepositoryCacheRuntimeV1EngineReport(root);

assertExists(PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH);
assertExists(PROJECT_REPOSITORY_CACHE_RUNTIME_V1_SCHEMA_PATH);
assertExists(PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REGISTRY_PATH);
assertExists(PROJECT_REPOSITORY_CACHE_RUNTIME_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.repository_cache_runtime_v1_version !== PROJECT_REPOSITORY_CACHE_RUNTIME_V1_VERSION) {
  console.error('VERSION FAIL: repository_cache_runtime_v1_version mismatch');
  process.exit(1);
}

const runtimeModel = (
  artifact.repository_cache_runtime_intelligence as {
    repository_cache_runtime_model: Record<string, unknown>;
  }
).repository_cache_runtime_model;

for (const key of REPOSITORY_CACHE_RUNTIME_COMPONENT_KEYS) {
  if (!runtimeModel[key]) {
    console.error(`CACHE RUNTIME FAIL: missing ${key}`);
    process.exit(1);
  }
}

const readPolicy = (
  artifact.repository_cache_read_policy_intelligence as {
    repository_cache_read_policy_model: Record<string, unknown>;
  }
).repository_cache_read_policy_model;

for (const [key, expected] of [
  ['read_cache_first', true],
  ['read_repository_only_if_cache_miss', true],
  ['avoid_full_scan', true],
] as const) {
  if (readPolicy[key] !== expected) {
    console.error(`READ POLICY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const updatePolicy = (
  artifact.repository_cache_update_policy_intelligence as {
    repository_cache_update_policy_model: Record<string, unknown>;
  }
).repository_cache_update_policy_model;

for (const [key, expected] of [
  ['incremental_update', true],
  ['changed_files_only', true],
  ['cache_rebuild_required', false],
  ['checkpoint_supported', true],
] as const) {
  if (updatePolicy[key] !== expected) {
    console.error(`UPDATE POLICY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const safety = (
  artifact.repository_cache_safety_intelligence as {
    repository_cache_safety_model: Record<string, unknown>;
  }
).repository_cache_safety_model;

for (const [key, expected] of [
  ['cache_validation', true],
  ['cache_integrity_check', true],
  ['incremental_consistency_check', true],
  ['rollback_supported', true],
] as const) {
  if (safety[key] !== expected) {
    console.error(`SAFETY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const rip = (
  artifact.repository_cache_runtime_model_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.repository_cache_runtime_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_REPOSITORY_CACHE_RUNTIME_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'repository_cache_runtime_score' && entry.master !== true) {
    console.error('METRICS FAIL: repository_cache_runtime_score must be master');
    process.exit(1);
  }
}

const status = artifact.repository_cache_runtime_status as Record<string, boolean>;
for (const key of PROJECT_REPOSITORY_CACHE_RUNTIME_V1_PASS_STATUS_KEYS) {
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

if (!report.project_repository_cache_runtime_v1_engine_passed) {
  console.error('ENGINE FAIL: project_repository_cache_runtime_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_REPOSITORY_CACHE_RUNTIME_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-repository-cache-runtime-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
