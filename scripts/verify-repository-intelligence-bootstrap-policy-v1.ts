import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_METRIC_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REGISTRY_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_SCHEMA_PATH,
  PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_VERSION,
  REPOSITORY_SCAN_SCOPE_RULE_KEYS,
  writeProjectRepositoryIntelligenceBootstrapPolicyV1EngineReport,
} from '../services/projectRepositoryIntelligenceBootstrapPolicyV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectRepositoryIntelligenceBootstrapPolicyV1EngineReport(root);

assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_SCHEMA_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REGISTRY_PATH);
assertExists(PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.repository_bootstrap_policy_v1_version !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_VERSION) {
  console.error('VERSION FAIL: repository_bootstrap_policy_v1_version mismatch');
  process.exit(1);
}

const scanScope = (
  artifact.repository_scan_scope_intelligence as {
    repository_scan_scope_model: Record<string, unknown>;
  }
).repository_scan_scope_model;

for (const key of REPOSITORY_SCAN_SCOPE_RULE_KEYS) {
  if (!scanScope[key]) {
    console.error(`SCAN SCOPE FAIL: missing ${key}`);
    process.exit(1);
  }
}

const scanPriority = (
  artifact.repository_scan_priority_intelligence as {
    repository_scan_priority_model: Record<string, unknown>;
  }
).repository_scan_priority_model;

for (const [key, expected] of [
  ['metadata_first', true],
  ['hash_second', true],
  ['dependency_third', true],
  ['content_last', true],
] as const) {
  if (scanPriority[key] !== expected) {
    console.error(`SCAN PRIORITY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const incremental = (
  artifact.repository_incremental_policy_intelligence as {
    repository_incremental_policy_model: Record<string, unknown>;
  }
).repository_incremental_policy_model;

for (const [key, expected] of [
  ['changed_files_only', true],
  ['timestamp_supported', true],
  ['hash_supported', true],
  ['incremental_priority', true],
  ['rename_detection_supported', true],
] as const) {
  if (incremental[key] !== expected) {
    console.error(`INCREMENTAL FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const cachePolicy = (
  artifact.repository_cache_policy_intelligence as {
    repository_cache_policy_model: Record<string, unknown>;
  }
).repository_cache_policy_model;

for (const [key, expected] of [
  ['cache_reuse', true],
  ['cache_validation', true],
  ['cache_rebuild_required', false],
  ['bootstrap_completed', false],
  ['cache_version', 1],
  ['cache_integrity_check', true],
] as const) {
  if (cachePolicy[key] !== expected) {
    console.error(`CACHE POLICY FAIL: ${key} expected ${String(expected)}`);
    process.exit(1);
  }
}

const rip = (
  artifact.repository_intelligence_bootstrap_policy_model_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.repository_intelligence_bootstrap_policy_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'repository_intelligence_bootstrap_policy_score' && entry.master !== true) {
    console.error('METRICS FAIL: repository_intelligence_bootstrap_policy_score must be master');
    process.exit(1);
  }
}

const status = artifact.repository_intelligence_bootstrap_policy_status as Record<string, boolean>;
for (const key of PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_PASS_STATUS_KEYS) {
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

if (!report.project_repository_intelligence_bootstrap_policy_v1_engine_passed) {
  console.error('ENGINE FAIL: project_repository_intelligence_bootstrap_policy_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_REPOSITORY_INTELLIGENCE_BOOTSTRAP_POLICY_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-repository-intelligence-bootstrap-policy-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
