import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';
import { DIRECTOR_GRAMMAR_REGISTRY_PATH } from '../services/directorGrammarExtractor.js';
import { VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import {
  SEGMENT_MD_PATH,
  SEGMENT_PASS_VERDICT,
  SEGMENT_REPORT_PATH,
  writeSourceVideoSceneSegmentReport,
} from '../services/sourceVideoSceneSegmentValidator.js';
import {
  SEGMENT_REGISTRY_PATH,
  SEGMENT_SCHEMA_PATH,
  writeSceneSegments,
} from '../services/sourceVideoSceneSegmentBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  FINAL_SET_PATH,
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  SEGMENT_SCHEMA_PATH,
  SEGMENT_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const { segments, written } = writeSceneSegments(projectRoot);
const report = writeSourceVideoSceneSegmentReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `segments=${report.segments} registry=${report.registry} source_links=${report.source_links} grammar_refs=${report.grammar_refs} video_defaults_ref=${report.video_defaults_ref}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const segment of segments) {
  const validation = report.segment_validations.find((v) => v.segment_id === segment.segment_id);
  console.log(
    `  ${segment.segment_id} (${segment.source_video_id}): ${validation?.status ?? 'FAIL'} duration=${segment.duration_seconds}s`
  );
}
console.log(`written_segments=${written.join(', ')}`);
console.log(`report=${SEGMENT_REPORT_PATH}`);
console.log(`markdown=${SEGMENT_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SEGMENT_PASS_VERDICT) {
  process.exit(1);
}

if (report.segments !== 4) {
  console.error(`Expected segments=4, got ${report.segments}`);
  process.exit(1);
}

process.exit(0);
