import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRegistrySeedStates, writeSceneStates } from '../services/sceneStateBuilder.js';
import {
  PRIORITY_CONTRACT_PATH,
  REGISTRY_PATH,
  SCHEMA_PATH,
  SCENE_STATE_FOUNDATION_REPORT_PATH,
  SCENE_STATE_PASS_VERDICT,
  writeSceneStateFoundationReport,
} from '../services/sceneStateValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [SCHEMA_PATH, PRIORITY_CONTRACT_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required state asset: ${required}`);
    process.exit(1);
  }
}

const states = buildRegistrySeedStates(projectRoot);
const written = writeSceneStates(projectRoot, states);
const report = writeSceneStateFoundationReport(projectRoot, states);

console.log(report.final_verdict);
console.log(
  `states=${report.state_count} priority=${report.priority_contract_status} validation=${report.validation_status} registry=${report.registry_status}`
);
for (const validation of report.scene_validations) {
  console.log(`  ${validation.scene_state_id}: ${validation.valid ? 'PASS' : 'FAIL'}`);
}
console.log(`written=${written.join(', ')}`);
console.log(`report=${SCENE_STATE_FOUNDATION_REPORT_PATH}`);

if (!fs.existsSync(path.join(projectRoot, SCENE_STATE_FOUNDATION_REPORT_PATH))) {
  console.error('Foundation report missing.');
  process.exit(1);
}

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SCENE_STATE_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
