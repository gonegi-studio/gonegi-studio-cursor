import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENT_REGISTRY_PATH } from '../services/sourceVideoSceneSegmentBuilder.js';
import {
  COORDINATE_MD_PATH,
  COORDINATE_PASS_VERDICT,
  COORDINATE_REPORT_PATH,
  writeSourceVideoCoordinateReport,
} from '../services/sourceVideoCoordinateValidator.js';
import {
  COORDINATE_REGISTRY_PATH,
  COORDINATE_SCHEMA_PATH,
  writeCoordinateRecords,
} from '../services/sourceVideoSegmentToCoordinateCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  SEGMENT_REGISTRY_PATH,
  COORDINATE_SCHEMA_PATH,
  COORDINATE_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { records, written } = writeCoordinateRecords(projectRoot);
const report = writeSourceVideoCoordinateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `coordinate_records=${report.coordinate_records} registry=${report.registry} segment_links=${report.segment_links} grammar_refs=${report.grammar_refs} identity_locks=${report.identity_locks}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const record of records) {
  const validation = report.record_validations.find(
    (v) => v.coordinate_record_id === record.coordinate_record_id
  );
  console.log(
    `  ${record.coordinate_record_id} → ${record.segment_id}: ${validation?.status ?? 'FAIL'}`
  );
}
console.log(`written_records=${written.join(', ')}`);
console.log(`report=${COORDINATE_REPORT_PATH}`);
console.log(`markdown=${COORDINATE_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== COORDINATE_PASS_VERDICT) {
  process.exit(1);
}

if (report.coordinate_records !== 4) {
  console.error(`Expected coordinate_records=4, got ${report.coordinate_records}`);
  process.exit(1);
}

process.exit(0);
