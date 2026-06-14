import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  IMAGE_APP_INGESTION_SPECIFICATION_PATH,
  IMAGE_APP_MAP_INGESTION_PASS_VERDICT,
  IMAGE_APP_MAP_INGESTION_REPORT_PATH,
  IMAGE_APP_MAP_INGESTION_STATUS,
  writeImageAppMapIngestionReport,
} from '../services/imageAppMapIngestion.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FALLBACK_BEHAVIOR =
  'If backend map ingestion is unavailable, degrade to text spatial compiler with NOT_PRODUCTION_REPLICA flag.';

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeImageAppMapIngestionReport(projectRoot);

const spec = JSON.parse(
  fs.readFileSync(path.join(projectRoot, IMAGE_APP_INGESTION_SPECIFICATION_PATH), 'utf8')
) as {
  ingestion_contract_defined: boolean;
  fallback_behavior: string;
  runtime_bridge: { bridge_id: string; bridge_only: boolean };
  binding_rules: string[];
  translation_path: string[];
  fallback_text_path: { output_flag: string; compiler: string };
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `image_app_map_ingestion_defined=${report.image_app_map_ingestion_defined}`,
    `ingestion_contract_defined=${report.ingestion_contract_defined}`,
    `binding_rules_defined=${report.binding_rules_defined}`,
    `translation_path_defined=${report.translation_path_defined}`,
    `fallback_text_path_defined=${report.fallback_text_path_defined}`,
    `runtime_bridge_defined=${report.runtime_bridge_defined}`,
    `supported_input_count=${report.supported_input_count}`,
    `unsupported_input_count=${report.unsupported_input_count}`,
    `conditioning_ready=${report.conditioning_ready}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [IMAGE_APP_INGESTION_SPECIFICATION_PATH, IMAGE_APP_MAP_INGESTION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== IMAGE_APP_MAP_INGESTION_PASS_VERDICT) {
  console.error('IMAGE APP MAP INGESTION VALIDATION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== IMAGE_APP_MAP_INGESTION_STATUS) {
  console.error(`STATUS FAIL: expected ${IMAGE_APP_MAP_INGESTION_STATUS}`);
  process.exit(1);
}

if (
  !report.ingestion_contract_defined ||
  !report.binding_rules_defined ||
  !report.translation_path_defined ||
  !report.fallback_text_path_defined ||
  !report.runtime_bridge_defined ||
  !spec.ingestion_contract_defined
) {
  console.error('PASS CONDITION FAIL: ingestion definition checks not met');
  process.exit(1);
}

if (spec.fallback_behavior !== REQUIRED_FALLBACK_BEHAVIOR) {
  console.error('FALLBACK BEHAVIOR FAIL: required degradation text missing');
  process.exit(1);
}

if (
  spec.fallback_text_path.output_flag !== 'NOT_PRODUCTION_REPLICA' ||
  spec.fallback_text_path.compiler !== 'ConditionedPromptBuilder'
) {
  console.error('FALLBACK TEXT PATH FAIL: ConditionedPromptBuilder / NOT_PRODUCTION_REPLICA required');
  process.exit(1);
}

if (!spec.runtime_bridge.bridge_only || spec.binding_rules.length === 0 || spec.translation_path.length === 0) {
  console.error('SPEC CONTENT FAIL: runtime_bridge, binding_rules, or translation_path incomplete');
  process.exit(1);
}

process.exit(0);
