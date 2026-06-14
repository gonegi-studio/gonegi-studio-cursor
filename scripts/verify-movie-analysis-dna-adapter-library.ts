import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CINEMATIC_DNA_PATH } from '../services/movieAnalysisCinematicDnaExtraction.js';
import { CINEMATIC_DNA_INTEGRATION_PATH } from '../services/movieAnalysisCinematicDnaIntegration.js';
import { CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH } from '../services/movieAnalysisCinematicDnaQualityGate.js';
import {
  DNA_ADAPTER_LIBRARY_MD_PATH,
  DNA_ADAPTER_LIBRARY_PASS_VERDICT,
  DNA_ADAPTER_LIBRARY_PATH,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisDnaAdapterLibrary,
} from '../services/movieAnalysisDnaAdapterLibrary.js';
import { writeMovieAnalysisDnaAdapterLibraryValidationReport } from '../services/movieAnalysisDnaAdapterLibraryValidator.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  CINEMATIC_DNA_PATH,
  CINEMATIC_DNA_INTEGRATION_PATH,
  CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const library = writeMovieAnalysisDnaAdapterLibrary(projectRoot);
const report = writeMovieAnalysisDnaAdapterLibraryValidationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} scene_adapter_complete=${report.scene_adapter_complete} camera_adapter_complete=${report.camera_adapter_complete} emotion_adapter_complete=${report.emotion_adapter_complete} transition_adapter_complete=${report.transition_adapter_complete} continuity_adapter_complete=${report.continuity_adapter_complete} storytelling_adapter_complete=${report.storytelling_adapter_complete} image_mapping_valid=${report.image_mapping_valid} video_mapping_valid=${report.video_mapping_valid} adapter_library_ready=${report.adapter_library_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_adapter_complete} camera=${audit.camera_adapter_complete} emotion=${audit.emotion_adapter_complete} transition=${audit.transition_adapter_complete} continuity=${audit.continuity_adapter_complete} storytelling=${audit.storytelling_adapter_complete} image=${audit.image_mapping_valid} video=${audit.video_mapping_valid}`
  );
}
console.log(`adapter_library=${DNA_ADAPTER_LIBRARY_PATH} entries=${library.entries.length}`);
console.log(`ready_for_image_app_integration=${report.ready_for_image_app_integration}`);
console.log(`ready_for_video_app_integration=${report.ready_for_video_app_integration}`);
console.log(`report=${DNA_ADAPTER_LIBRARY_REPORT_PATH}`);
console.log(`markdown=${DNA_ADAPTER_LIBRARY_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== DNA_ADAPTER_LIBRARY_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.scene_adapter_complete !== 'PASS' ||
  report.camera_adapter_complete !== 'PASS' ||
  report.emotion_adapter_complete !== 'PASS' ||
  report.transition_adapter_complete !== 'PASS' ||
  report.continuity_adapter_complete !== 'PASS' ||
  report.storytelling_adapter_complete !== 'PASS' ||
  report.image_mapping_valid !== 'PASS' ||
  report.video_mapping_valid !== 'PASS' ||
  report.adapter_library_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  !report.ready_for_image_app_integration ||
  !report.ready_for_video_app_integration
) {
  console.error(
    'Expected source_count=4 all adapter types PASS image_mapping_valid=PASS video_mapping_valid=PASS adapter_library_ready=PASS planning_only=PASS'
  );
  process.exit(1);
}

process.exit(0);
