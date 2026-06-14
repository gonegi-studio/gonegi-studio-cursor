import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
} from '../services/movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_ADAPTER_VALIDATION_MD_PATH,
  DNA_ADAPTER_VALIDATION_PASS_VERDICT,
  DNA_ADAPTER_VALIDATION_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaAdapterValidationReport,
} from '../services/movieAnalysisDnaAdapterValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [DNA_ADAPTER_LIBRARY_PATH, DNA_ADAPTER_LIBRARY_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaAdapterValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} scene_adapter_valid=${report.scene_adapter_valid} camera_adapter_valid=${report.camera_adapter_valid} emotion_adapter_valid=${report.emotion_adapter_valid} transition_adapter_valid=${report.transition_adapter_valid} continuity_adapter_valid=${report.continuity_adapter_valid} storytelling_adapter_valid=${report.storytelling_adapter_valid} image_mapping_valid=${report.image_mapping_valid} video_mapping_valid=${report.video_mapping_valid} adapter_trace_integrity=${report.adapter_trace_integrity} adapter_consistency=${report.adapter_consistency} adapter_validation_ready=${report.adapter_validation_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_adapter_valid} camera=${audit.camera_adapter_valid} emotion=${audit.emotion_adapter_valid} transition=${audit.transition_adapter_valid} continuity=${audit.continuity_adapter_valid} storytelling=${audit.storytelling_adapter_valid} trace=${audit.adapter_trace_integrity} consistency=${audit.adapter_consistency} source_pass=${audit.source_pass}`
  );
}
console.log(`ready_for_adapter_certification=${report.ready_for_adapter_certification}`);
console.log(`report=${DNA_ADAPTER_VALIDATION_REPORT_PATH}`);
console.log(`markdown=${DNA_ADAPTER_VALIDATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_ADAPTER_VALIDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.scene_adapter_valid !== 'PASS' ||
  report.camera_adapter_valid !== 'PASS' ||
  report.emotion_adapter_valid !== 'PASS' ||
  report.transition_adapter_valid !== 'PASS' ||
  report.continuity_adapter_valid !== 'PASS' ||
  report.storytelling_adapter_valid !== 'PASS' ||
  report.image_mapping_valid !== 'PASS' ||
  report.video_mapping_valid !== 'PASS' ||
  report.adapter_trace_integrity !== 'PASS' ||
  report.adapter_consistency !== 'PASS' ||
  report.adapter_validation_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  !report.ready_for_adapter_certification
) {
  console.error(
    'Expected source_count=4 all adapter validations PASS adapter_trace_integrity=PASS adapter_consistency=PASS adapter_validation_ready=PASS planning_only=PASS ready_for_adapter_certification=true'
  );
  process.exit(1);
}

process.exit(0);
