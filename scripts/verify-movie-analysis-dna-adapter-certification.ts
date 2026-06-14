import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DNA_ADAPTER_LIBRARY_PATH } from '../services/movieAnalysisDnaAdapterLibrary.js';
import {
  ADAPTER_CERTIFICATION_STATUS_MESSAGE,
  DNA_ADAPTER_CERTIFICATION_MD_PATH,
  DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
  DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaAdapterCertificationReport,
} from '../services/movieAnalysisDnaAdapterCertification.js';
import { DNA_ADAPTER_VALIDATION_REPORT_PATH } from '../services/movieAnalysisDnaAdapterValidation.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [DNA_ADAPTER_LIBRARY_PATH, DNA_ADAPTER_VALIDATION_REPORT_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisDnaAdapterCertificationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} adapter_library_ready=${report.adapter_library_ready} scene_adapter_certified=${report.scene_adapter_certified} camera_adapter_certified=${report.camera_adapter_certified} emotion_adapter_certified=${report.emotion_adapter_certified} transition_adapter_certified=${report.transition_adapter_certified} continuity_adapter_certified=${report.continuity_adapter_certified} storytelling_adapter_certified=${report.storytelling_adapter_certified} image_mapping_certified=${report.image_mapping_certified} video_mapping_certified=${report.video_mapping_certified} traceability_certified=${report.traceability_certified} adapter_certification_ready=${report.adapter_certification_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_adapter_certified} camera=${audit.camera_adapter_certified} emotion=${audit.emotion_adapter_certified} transition=${audit.transition_adapter_certified} continuity=${audit.continuity_adapter_certified} storytelling=${audit.storytelling_adapter_certified} trace=${audit.traceability_certified} source_certified=${audit.source_certified}`
  );
}
if (report.certification_status_message) {
  console.log(report.certification_status_message);
}
console.log(`report=${DNA_ADAPTER_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${DNA_ADAPTER_CERTIFICATION_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_ADAPTER_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_library_ready !== 'PASS' ||
  report.scene_adapter_certified !== 'PASS' ||
  report.camera_adapter_certified !== 'PASS' ||
  report.emotion_adapter_certified !== 'PASS' ||
  report.transition_adapter_certified !== 'PASS' ||
  report.continuity_adapter_certified !== 'PASS' ||
  report.storytelling_adapter_certified !== 'PASS' ||
  report.image_mapping_certified !== 'PASS' ||
  report.video_mapping_certified !== 'PASS' ||
  report.traceability_certified !== 'PASS' ||
  report.adapter_certification_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.certification_status_message !== ADAPTER_CERTIFICATION_STATUS_MESSAGE
) {
  console.error(
    'Expected source_count=4 adapter_library_ready=PASS all adapters certified traceability_certified=PASS adapter_certification_ready=PASS planning_only=PASS DNA Adapter Library Production Ready'
  );
  process.exit(1);
}

process.exit(0);
