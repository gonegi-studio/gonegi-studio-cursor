import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PROJECT_ONTOLOGY_DOMAIN_KEYS,
  PROJECT_ONTOLOGY_ENTITY_ROLE_KEYS,
  PROJECT_ONTOLOGY_SEMANTIC_CATEGORY_KEYS,
  PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT,
  PROJECT_ONTOLOGY_V1_ENGINE_STATUS,
  PROJECT_ONTOLOGY_V1_METRIC_KEYS,
  PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS,
  PROJECT_ONTOLOGY_V1_PATH,
  PROJECT_ONTOLOGY_V1_REGISTRY_PATH,
  PROJECT_ONTOLOGY_V1_REPORT_PATH,
  PROJECT_ONTOLOGY_V1_SCHEMA_PATH,
  PROJECT_ONTOLOGY_V1_VERSION,
  PROJECT_ONTOLOGY_VERSION,
  writeProjectOntologyV1EngineReport,
} from '../services/projectOntologyV1Engine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function assertExists(rel: string): void {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`MISSING: ${rel}`);
    process.exit(1);
  }
}

const report = writeProjectOntologyV1EngineReport(root);

assertExists(PROJECT_ONTOLOGY_V1_PATH);
assertExists(PROJECT_ONTOLOGY_V1_SCHEMA_PATH);
assertExists(PROJECT_ONTOLOGY_V1_REGISTRY_PATH);
assertExists(PROJECT_ONTOLOGY_V1_REPORT_PATH);

const artifact = JSON.parse(
  fs.readFileSync(path.join(root, PROJECT_ONTOLOGY_V1_PATH), 'utf8')
) as Record<string, unknown>;

if (artifact.project_ontology_v1_version !== PROJECT_ONTOLOGY_V1_VERSION) {
  console.error('VERSION FAIL: project_ontology_v1_version mismatch');
  process.exit(1);
}

const domainsModel = (
  artifact.project_domains_intelligence as {
    project_domains_model: {
      domains: Record<string, { defined?: boolean }>;
      project_domains_defined?: boolean;
    };
  }
).project_domains_model;

for (const key of PROJECT_ONTOLOGY_DOMAIN_KEYS) {
  if (domainsModel.domains[key]?.defined !== true) {
    console.error(`DOMAIN FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (domainsModel.project_domains_defined !== true) {
  console.error('DOMAINS FAIL: project_domains_defined not true');
  process.exit(1);
}

const rolesModel = (
  artifact.project_entity_roles_intelligence as {
    project_entity_roles_model: {
      entity_roles: Record<string, { defined?: boolean }>;
      entity_roles_defined?: boolean;
    };
  }
).project_entity_roles_model;

for (const key of PROJECT_ONTOLOGY_ENTITY_ROLE_KEYS) {
  if (rolesModel.entity_roles[key]?.defined !== true) {
    console.error(`ENTITY ROLE FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (rolesModel.entity_roles_defined !== true) {
  console.error('ENTITY ROLES FAIL: entity_roles_defined not true');
  process.exit(1);
}

const categoriesModel = (
  artifact.project_semantic_categories_intelligence as {
    project_semantic_categories_model: {
      semantic_categories: Record<string, { defined?: boolean }>;
      semantic_categories_defined?: boolean;
    };
  }
).project_semantic_categories_model;

for (const key of PROJECT_ONTOLOGY_SEMANTIC_CATEGORY_KEYS) {
  if (categoriesModel.semantic_categories[key]?.defined !== true) {
    console.error(`SEMANTIC CATEGORY FAIL: ${key} not defined`);
    process.exit(1);
  }
}

if (categoriesModel.semantic_categories_defined !== true) {
  console.error('SEMANTIC CATEGORIES FAIL: semantic_categories_defined not true');
  process.exit(1);
}

const rulesModel = (
  artifact.project_knowledge_rules_intelligence as {
    project_knowledge_rules_model: Record<string, unknown>;
  }
).project_knowledge_rules_model;

if (rulesModel.entity_role_validation !== true) {
  console.error('RULES FAIL: entity_role_validation not true');
  process.exit(1);
}

if (rulesModel.semantic_consistency_check !== true) {
  console.error('RULES FAIL: semantic_consistency_check not true');
  process.exit(1);
}

if (rulesModel.ontology_validation !== true) {
  console.error('RULES FAIL: ontology_validation not true');
  process.exit(1);
}

if (rulesModel.ontology_version !== PROJECT_ONTOLOGY_VERSION) {
  console.error('RULES FAIL: ontology_version mismatch');
  process.exit(1);
}

if (rulesModel.knowledge_rules_defined !== true) {
  console.error('RULES FAIL: knowledge_rules_defined not true');
  process.exit(1);
}

const rip = (
  artifact.project_ontology_rip_intelligence as {
    repository_intelligence_protocol_model: Record<string, unknown>;
  }
).repository_intelligence_protocol_model;

if (rip.protocol_version !== 'rip_v1' || rip.adapter_ready !== true || rip.backward_compatible !== true) {
  console.error('RIP FAIL: repository_intelligence_protocol_model invalid');
  process.exit(1);
}

const metrics = artifact.project_ontology_metrics as Record<string, { master?: boolean; value?: number }>;
for (const key of PROJECT_ONTOLOGY_V1_METRIC_KEYS) {
  const entry = metrics[key];
  if (!entry?.value) {
    console.error(`METRICS FAIL: missing ${key}`);
    process.exit(1);
  }
  if (key === 'project_ontology_score' && entry.master !== true) {
    console.error('METRICS FAIL: project_ontology_score must be master');
    process.exit(1);
  }
}

const status = artifact.project_ontology_status as Record<string, boolean>;
for (const key of PROJECT_ONTOLOGY_V1_PASS_STATUS_KEYS) {
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

if (!report.project_ontology_v1_engine_passed) {
  console.error('ENGINE FAIL: project_ontology_v1_engine_passed not true');
  process.exit(1);
}

if (report.final_verdict !== PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT) {
  console.error(`VERDICT FAIL: expected ${PROJECT_ONTOLOGY_V1_ENGINE_PASS_VERDICT}`);
  process.exit(1);
}

if (report.status !== PROJECT_ONTOLOGY_V1_ENGINE_STATUS) {
  console.error(`STATUS FAIL: expected ${PROJECT_ONTOLOGY_V1_ENGINE_STATUS}`);
  process.exit(1);
}

console.log('PASS verify-project-ontology-v1');
console.log(`final_verdict=${report.final_verdict}`);
console.log(`status=${report.status}`);
