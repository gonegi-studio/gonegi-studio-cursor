import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CINEMATIC_DNA_PATH } from '../services/movieAnalysisCinematicDnaExtraction.js';
import { CINEMATIC_DNA_INTEGRATION_PATH } from '../services/movieAnalysisCinematicDnaIntegration.js';
import {
  CINEMATIC_DNA_QUALITY_GATE_MD_PATH,
  CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT,
  CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
  DNA_LIBRARY_CERTIFICATION_MESSAGE,
  EXPECTED_SOURCE_COUNT,
  writeMovieAnalysisCinematicDnaQualityGateReport,
} from '../services/movieAnalysisCinematicDnaQualityGate.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [CINEMATIC_DNA_PATH, CINEMATIC_DNA_INTEGRATION_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisCinematicDnaQualityGateReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `source_count=${report.source_count} scene_dna_complete=${report.scene_dna_complete} camera_dna_complete=${report.camera_dna_complete} emotion_dna_complete=${report.emotion_dna_complete} transition_dna_complete=${report.transition_dna_complete} continuity_dna_complete=${report.continuity_dna_complete} storytelling_dna_complete=${report.storytelling_dna_complete} integration_consistency=${report.integration_consistency} image_app_mapping_valid=${report.image_app_mapping_valid} video_app_mapping_valid=${report.video_app_mapping_valid} reusability_score_valid=${report.reusability_score_valid} dna_library_ready=${report.dna_library_ready} planning_only=${report.planning_only_status}`
);
for (const audit of report.source_audits) {
  console.log(
    `  ${audit.source_video_id}: scene=${audit.scene_dna_complete} camera=${audit.camera_dna_complete} emotion=${audit.emotion_dna_complete} transition=${audit.transition_dna_complete} continuity=${audit.continuity_dna_complete} storytelling=${audit.storytelling_dna_complete} integration=${audit.integration_consistency} source_pass=${audit.source_pass}`
  );
}
if (report.dna_library_certification_message) {
  console.log(report.dna_library_certification_message);
}
console.log(`ready_for_image_app_adapter=${report.ready_for_image_app_adapter}`);
console.log(`ready_for_video_app_adapter=${report.ready_for_video_app_adapter}`);
console.log(`report=${CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH}`);
console.log(`markdown=${CINEMATIC_DNA_QUALITY_GATE_MD_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.scene_dna_complete !== 'PASS' ||
  report.camera_dna_complete !== 'PASS' ||
  report.emotion_dna_complete !== 'PASS' ||
  report.transition_dna_complete !== 'PASS' ||
  report.continuity_dna_complete !== 'PASS' ||
  report.storytelling_dna_complete !== 'PASS' ||
  report.integration_consistency !== 'PASS' ||
  report.image_app_mapping_valid !== 'PASS' ||
  report.video_app_mapping_valid !== 'PASS' ||
  report.reusability_score_valid !== 'PASS' ||
  report.dna_library_ready !== 'PASS' ||
  report.planning_only_status !== 'PASS' ||
  report.dna_library_certification_message !== DNA_LIBRARY_CERTIFICATION_MESSAGE ||
  !report.ready_for_image_app_adapter ||
  !report.ready_for_video_app_adapter
) {
  console.error(
    'Expected source_count=4 all DNA categories PASS integration_consistency=PASS image_app_mapping_valid=PASS video_app_mapping_valid=PASS reusability_score_valid=PASS dna_library_ready=PASS planning_only=PASS Certified DNA Library'
  );
  process.exit(1);
}

process.exit(0);
