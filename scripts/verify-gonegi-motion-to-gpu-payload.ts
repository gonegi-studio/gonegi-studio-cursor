import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GPU_PAYLOAD_SCHEMA_PATH } from '../services/gpuRenderPayloadValidator.js';
import { GONEGI_KEYFRAME_PLAN_REGISTRY_PATH } from '../services/gonegiVideoStateToKeyframeCompiler.js';
import { GONEGI_MOTION_PLAN_REGISTRY_PATH } from '../services/gonegiKeyframeToMotionCompiler.js';
import { GONEGI_VIDEO_STATE_REGISTRY_PATH } from '../services/gonegiStateToVideoStateTranslator.js';
import { VIDEO_STATE_DEFAULTS_PATH } from '../services/sourceVideoGrammarToVideoStateCompiler.js';
import {
  GPU_PAYLOAD_COMPILER_MD_PATH,
  GPU_PAYLOAD_COMPILER_PASS_VERDICT,
  GPU_PAYLOAD_COMPILER_REPORT_PATH,
  writeGonegiGpuPayloadReport,
} from '../services/gonegiGpuPayloadValidator.js';
import {
  GONEGI_GPU_PAYLOAD_REGISTRY_PATH,
  GONEGI_GPU_PAYLOAD_SCHEMA_PATH,
  writeGonegiGpuPayloads,
} from '../services/gonegiMotionToGpuPayloadCompiler.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  GONEGI_MOTION_PLAN_REGISTRY_PATH,
  GONEGI_KEYFRAME_PLAN_REGISTRY_PATH,
  GONEGI_VIDEO_STATE_REGISTRY_PATH,
  VIDEO_STATE_DEFAULTS_PATH,
  GPU_PAYLOAD_SCHEMA_PATH,
  GONEGI_GPU_PAYLOAD_SCHEMA_PATH,
  GONEGI_GPU_PAYLOAD_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required asset: ${required}`);
    process.exit(1);
  }
}

const { payloads, written } = writeGonegiGpuPayloads(projectRoot);
const report = writeGonegiGpuPayloadReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `payloads=${report.payloads} motion_alignment=${report.motion_alignment} identity_locks=${report.identity_locks} continuity=${report.continuity}`
);
console.log(
  `execution_safety=${report.execution_safety} provider_activation=${report.provider_activation} registry=${report.registry}`
);
console.log(`design_only=${report.design_only} gpu_execution=${report.gpu_execution}`);
for (const payload of payloads) {
  const validation = report.payload_validations.find(
    (v) => v.gonegi_gpu_payload_id === payload.gonegi_gpu_payload_id
  );
  console.log(
    `  ${payload.gonegi_gpu_payload_id} ← ${payload.source_motion_plan_id}: ${validation?.status ?? 'FAIL'} kf=${payload.keyframes.length} seg=${payload.motion_segments.length} ${payload.resolution}@${payload.fps_target}fps`
  );
}
console.log(`written_payloads=${written.join(', ')}`);
console.log(`report=${GPU_PAYLOAD_COMPILER_REPORT_PATH}`);
console.log(`markdown=${GPU_PAYLOAD_COMPILER_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== GPU_PAYLOAD_COMPILER_PASS_VERDICT) {
  process.exit(1);
}

if (report.payloads !== 4) {
  console.error(`Expected payloads=4, got ${report.payloads}`);
  process.exit(1);
}

process.exit(0);
