import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRANSLATION_CONTRACT_PATH } from '../services/gonegiWorldTranslationBuilder.js';
import { IDENTITY_CONTRACT_SOURCE } from '../services/sceneStateBuilder.js';
import {
  CHARACTER_ANCHOR_INDEX_PATH,
  REPLACEMENT_CONTRACT_PATH,
  REPLACEMENT_REGISTRY_PATH,
  REPLACEMENT_SCHEMA_PATH,
  REPLACEMENT_STATIC_CONTRACT_PATH,
  writeCharacterReplacementContract,
} from '../services/characterReplacementContractBuilder.js';
import {
  REPLACEMENT_MD_PATH,
  REPLACEMENT_PASS_VERDICT,
  REPLACEMENT_REPORT_PATH,
  writeCharacterReplacementContractReport,
} from '../services/characterReplacementContractValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  TRANSLATION_CONTRACT_PATH,
  CHARACTER_ANCHOR_INDEX_PATH,
  IDENTITY_CONTRACT_SOURCE,
  REPLACEMENT_SCHEMA_PATH,
  REPLACEMENT_STATIC_CONTRACT_PATH,
  REPLACEMENT_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const contract = writeCharacterReplacementContract(projectRoot);
const { report } = writeCharacterReplacementContractReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `replacement_contract=${report.replacement_contract} gonegi=${report.gonegi} dana=${report.dana} gamja=${report.gamja} aengdu=${report.aengdu}`
);
console.log(
  `companion_rules=${report.companion_rules} identity_priority=${report.identity_priority} duplication_guard=${report.duplication_guard}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
console.log(`contract_id=${contract.contract_id} replacements=${contract.replacements.length}`);
console.log(`contract=${REPLACEMENT_CONTRACT_PATH}`);
console.log(`report=${REPLACEMENT_REPORT_PATH}`);
console.log(`markdown=${REPLACEMENT_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== REPLACEMENT_PASS_VERDICT) {
  process.exit(1);
}

process.exit(0);
