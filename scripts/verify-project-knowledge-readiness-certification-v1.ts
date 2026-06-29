import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_KNOWLEDGE_LAYER_VERIFICATION_KEYS,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_METRIC_KEYS,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PATH,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REGISTRY_PATH,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REPORT_PATH,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_SCHEMA_PATH,
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_VERSION,
  PROJECT_KNOWLEDGE_READINESS_REPORT_KEYS,
  PROJECT_KNOWLEDGE_READINESS_VERSION,
  writeProjectKnowledgeReadinessCertificationV1EngineReport,
} from '../services/projectKnowledgeReadinessCertificationV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectKnowledgeReadinessCertificationV1EngineReport(root);

assertExists(PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PATH);
assertExists(PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_SCHEMA_PATH);
assertExists(PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REGISTRY_PATH);
assertExists(PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (
  artifact.project_knowledge_readiness_certification_v1_version !==
  PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_VERSION
) {
  console.error('VERSION FAIL: project_knowledge_readiness_certification_v1_version mismatch');
  process.exit(1);
}

const status = artifact.project_knowledge_readiness_certification_status as Record<string, boolean>;
for (const key of PROJECT_KNOWLEDGE_LAYER_VERIFICATION_KEYS) {
  if (status[key] !== true) {
    console.error(`VERIFICATION FAIL: ${key} not true`);
    process.exit(1);
  }
}

const readinessReport = (
  artifact.project_knowledge_readiness_report_intelligence as {
    project_knowledge_readiness_report_model: Record<string, unknown>;
  }
).project_knowledge_readiness_report_model;

for (const key of PROJECT_KNOWLEDGE_READINESS_REPORT_KEYS) {
  if (readinessReport[key] !== true) {
    console.error(`READINESS REPORT FAIL: ${key} not true`);
    process.exit(1);
  }
}

if (readinessReport.knowledge_version !== PROJECT_KNOWLEDGE_READINESS_VERSION) {
  console.error('READINESS REPORT FAIL: knowledge_version mismatch');
  process.exit(1);
}

const rip = (
  artifact.project_knowledge_readiness_certification_model_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_knowledge_readiness_certification_metrics as Record<
  string,
  { master?: boolean; value?: number }
>;
for (const key of PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_knowledge_readiness_certification_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_knowledge_readiness_certification_score must be master');
    process.exit(1);
  }
}

for (const key of PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_PASS_STATUS_KEYS) {
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

if (!report.all_knowledge_checks_passed) {
  console.error('READINESS FAIL: all_knowledge_checks_passed not true');
  process.exit(1);
}

if (!report.project_knowledge_readiness_certification_v1_engine_passed) {
  console.error(
    'ENGINE FAIL: project_knowledge_readiness_certification_v1_engine_passed not true'
  );
  process.exit(1);
}

if (report.final_verdict !== PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT) {
  console.error(
    `VERDICT FAIL: expected ${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_PASS_VERDICT}`
  );
  process.exit(1);
}

if (report.status !== PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_KNOWLEDGE_READINESS_CERTIFICATION_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-knowledge-readiness-certification-v1');
console.log(`all_knowledge_checks_passed=${report.all_knowledge_checks_passed}`);
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
