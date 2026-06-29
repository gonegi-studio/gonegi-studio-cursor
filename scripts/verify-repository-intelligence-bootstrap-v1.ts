import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_METRIC_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REGISTRY_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REPORT_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_SCHEMA_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_VERSION,
  REPOSITORY_CACHE_STRUCTURE_KEYS,
  REPOSITORY_INTELLIGENCE_BOOTSTRAP_MODEL_KEYS,
  writeProjectRepositoryIntelligenceBootstrapV1EngineReport,
} from '../services/projectRepositoryIntelligenceBootstrapV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectRepositoryIntelligenceBootstrapV1EngineReport(root);

assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_SCHEMA_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REGISTRY_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.repository_bootstrap_v1_version !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_VERSION) {
  console.error('VERSION FAIL: repository_bootstrap_v1_version mismatch');
  process.exit(1);
}

const policy = (
  artifact.repository_bootstrap_policy_intelligence as {
    repository_bootstrap_policy_model: Record<string, unknown>;
  }
).repository_bootstrap_policy_model;

for (const [key, expected] of [
  ['metadata_first', true],
  ['hash_first', true],
  ['incremental_scan_supported', true],
  ['full_rescan_required', false],
  ['cache_version', 1],
  ['schema_version', 1],
] as const) {
  if (policy[key] !== expected) {
    console.error(`POLICY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const continuous = (
  artifact.repository_continuous_intelligence_intelligence as {
    repository_continuous_intelligence_model: Record<string, unknown>;
  }
).repository_continuous_intelligence_model;

for (const [key, expected] of [
  ['changed_files_only', true],
  ['cache_reuse', true],
  ['incremental_update', true],
  ['cache_validation', true],
  ['incremental_consistency_check', true],
  ['cache_rebuild_required', false],
  ['bootstrap_completed', false],
] as const) {
  if (continuous[key] !== expected) {
    console.error(`CONTINUOUS FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const cacheModel = (
  artifact.repository_cache_structure_intelligence as {
    repository_cache_structure_model: Record<string, unknown>;
  }
).repository_cache_structure_model;

for (const key of REPOSITORY_CACHE_STRUCTURE_KEYS) {
  if (!cacheModel[key]) {
    console.error(`CACHE FAIL: missing ${key}`);
    process.exit(1);
  }
}

const modelIntelligence = artifact.repository_intelligence_bootstrap_model_intelligence as Record<string, unknown>;
for (const key of REPOSITORY_INTELLIGENCE_BOOTSTRAP_MODEL_KEYS) {
  if (key === 'repository_intelligence_protocol_model') {
    const rip = modelIntelligence.repository_intelligence_protocol_model as Record<string, unknown>;
    if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
      console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
      process.exit(1);
    }
    continue;
  }
}

const metrics = artifact.repository_intelligence_bootstrap_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'repository_intelligence_bootstrap_score' && entry.master !== true) {
    console.error('METRICS FAIL: repository_intelligence_bootstrap_score must be master');
    process.exit(1);
  }
}

const status = artifact.repository_intelligence_bootstrap_status as Record<string, boolean>;
for (const key of PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_PASS_STATUS_KEYS) {
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

if (!report.project_repository_intelligence_bootstrap_v1_engine_passed) {
  console.error('ENGINE FAIL: project_repository_intelligence_bootstrap_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-repository-intelligence-bootstrap-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
