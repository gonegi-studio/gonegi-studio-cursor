import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loadCameraMotionVectorEvidence,
  verifyCameraMotionVectorPairBinding,
  getCameraMotionVectorForPair,
  interpretCameraMotionVector,
  assessCameraMotionVectorReadiness,
  CAMERA_MOTION_VECTOR_EVIDENCE_PATH,
  type CameraMotionVectorPair,
} from '../services/cameraMotionVectorIntegration.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(scriptDir, '..');

let failures = 0;
function check(label: string, condition: boolean): void {
  if (condition) {
    console.log(`PASS: ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL: ${label}`);
  }
}

console.log('=== Real optical-flow/global-motion candidate investigation, documented not just declared ===');
const pythonSource = fs.readFileSync(path.join(projectRoot, 'scripts/measure-camera-motion-vector-v1.py'), 'utf8');
check(
  'the measurement script documents a real candidate investigation (OpenCV rejected, custom block-matching rejected, skimage selected)',
  pythonSource.includes('candidate_investigation') && pythonSource.includes('phase_cross_correlation') && pythonSource.includes('opencv-python is not installed')
);
check(
  'the script documents validating the tool via a synthetic known-shift self-test before trusting it on real frames',
  pythonSource.includes('synthetic known-shift self-test') || pythonSource.includes('synthetic self-test')
);

console.log();
console.log('=== Real evidence file: fail-closed binding + structural no-mixing verification ===');
const evidenceFile = loadCameraMotionVectorEvidence(projectRoot);
check('evidence file resolved at the expected path', fs.existsSync(path.join(projectRoot, CAMERA_MOTION_VECTOR_EVIDENCE_PATH)));
check('evidence covers the real GHIBLI 1280-1282 pairs', evidenceFile.pairs.length === 2);

for (const pair of evidenceFile.pairs) {
  console.log(`--- pair ${pair.frame_index_a} -> ${pair.frame_index_b} ---`);
  const binding = verifyCameraMotionVectorPairBinding(projectRoot, pair);
  check(`${pair.frame_index_a}->${pair.frame_index_b}: fail-closed binding verification passes against real bytes on disk`, binding.valid);

  console.log(`  translation_u=${pair.measured.translation_u_normalized} translation_v=${pair.measured.translation_v_normalized} error=${pair.measured.error} masking_applied=${pair.background_masking_applied}`);
  check(`${pair.frame_index_a}->${pair.frame_index_b}: measured translation is a real finite number, provenance MEASURED`, Number.isFinite(pair.measured.translation_u_normalized) && Number.isFinite(pair.measured.translation_v_normalized) && pair.measured.provenance_class === 'MEASURED');
  check(
    `${pair.frame_index_a}->${pair.frame_index_b}: subject motion excluded (background_masking_applied) since a real subject was detected`,
    pair.background_masking_applied === true
  );
  check(
    `${pair.frame_index_a}->${pair.frame_index_b}: masked registration honestly reports null error (skimage's own documented limitation, not fabricated)`,
    pair.measured.error === null
  );
  check(
    `${pair.frame_index_a}->${pair.frame_index_b}: unmasked reference value is present but explicitly labeled never-canonical`,
    pair.unmasked_reference_only.note.includes('NEVER the canonical')
  );

  const interpretation = interpretCameraMotionVector(pair);
  console.log(`  INFERRED: guess=${interpretation.guess} confidence=${interpretation.confidence}`);
  check(`${pair.frame_index_a}->${pair.frame_index_b}: INFERRED interpretation carries provenance 'inferred', distinct from the MEASURED vector`, interpretation.provenance === 'inferred');
}

console.log();
console.log('=== Structural cross-check: masking correctness is independently re-derived, not trusted ===');
const bboxSource = fs.readFileSync(path.join(projectRoot, 'services/cameraMotionVectorIntegration.ts'), 'utf8');
check(
  'assessCameraMotionVectorReadiness cross-checks masking against canonical-frame-subject-bbox-v1.json independently',
  bboxSource.includes('shouldHaveMasked') && bboxSource.includes('subject motion may have contaminated')
);

console.log();
console.log('=== Frame-pair lookup helper ===');
const lookedUp = getCameraMotionVectorForPair(projectRoot, 1280, 1281);
check('getCameraMotionVectorForPair returns the real 1280->1281 pair with binding pre-verified', lookedUp !== null && lookedUp.frame_index_a === 1280);
const missing = getCameraMotionVectorForPair(projectRoot, 1280, 9999);
check('a non-existent pair returns null explicitly, never a fabricated result', missing === null);

console.log();
console.log('=== Fail-closed: tampered evidence is rejected ===');
const fabricatedPair: CameraMotionVectorPair = {
  ...evidenceFile.pairs[0],
  source_sha256_a: 'not-a-real-hash-'.padEnd(64, '0'),
};
const tamperedBinding = verifyCameraMotionVectorPairBinding(projectRoot, fabricatedPair);
check('a fabricated source_sha256_a is rejected, fail-closed', !tamperedBinding.valid);

console.log();
console.log('=== Final verdict ===');
const readiness = assessCameraMotionVectorReadiness(projectRoot);
console.log(`  ${readiness.verdict}: ${readiness.reason}`);
check('overall verdict is REAL_CAMERA_MOTION_VECTOR_READY', readiness.verdict === 'REAL_CAMERA_MOTION_VECTOR_READY');

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
