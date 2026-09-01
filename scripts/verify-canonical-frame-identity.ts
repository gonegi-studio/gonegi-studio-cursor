import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { buildSceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import {
  bindRealOcclusionToSceneTruth,
  auditSceneTruthV2ForSyntheticLeakage,
} from '../services/sceneMeasurementSceneTruthV2Integrator.js';
import { loadRealOcclusionEvidenceFile } from '../services/realOcclusionIntegration.js';
import {
  computeCanonicalFrameIdentity,
  reExtractCanonicalFrame,
  deriveCanonicalIdentityFromExtractedFrame,
  canonicalIdentitiesMatch,
  assessCanonicalFrameBindingReadiness,
  type CanonicalFrameBindingResult,
} from '../services/canonicalFrameIdentity.js';

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

function sha256File(absolutePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

const SOURCE_VIDEO = 'imports/source_videos/active/ghibli/GHIBLI_01.mp4';
const FRAME_INDICES = [1280, 1281] as const;

console.log('=== No forced/approximate matching -- structural check ===');
const identitySource = fs.readFileSync(path.join(projectRoot, 'services/canonicalFrameIdentity.ts'), 'utf8');
const matchFunctionBody = identitySource.slice(
  identitySource.indexOf('export function canonicalIdentitiesMatch'),
  identitySource.indexOf('export function canonicalIdentitiesMatch') + 400
);
check(
  'canonicalIdentitiesMatch() uses exact equality (===) only, no tolerance/distance/similarity comparison',
  matchFunctionBody.includes('===') &&
    !/tolerance|similarity|Math\.abs|threshold|approx/i.test(matchFunctionBody)
);

console.log();
console.log('=== Existing provenance/hashes untouched -- Real Occlusion Integration V1 evidence ===');
const originalEvidence = loadRealOcclusionEvidenceFile(projectRoot);
let originalUntouched = true;
for (const frame of originalEvidence.frames) {
  const actual = sha256File(path.join(projectRoot, frame.source_png_relpath));
  if (actual !== frame.source_sha256) originalUntouched = false;
  for (const detection of frame.detections) {
    const actualMask = sha256File(path.join(projectRoot, detection.mask_relpath));
    if (actualMask !== detection.mask_sha256) originalUntouched = false;
  }
}
check('every original anchor-cache frame and mask file still hashes to what Real Occlusion Integration V1 recorded (nothing overwritten)', originalUntouched);

console.log();
console.log('=== Canonical re-extraction through the same ffmpeg path, live (not read from a cached manifest) ===');
const canonicalResults: CanonicalFrameBindingResult[] = [];

for (const frameIndex of FRAME_INDICES) {
  console.log();
  console.log(`--- frame_index=${frameIndex} ---`);
  const identity = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, frameIndex);
  console.log(`  canonical identity: fps=${identity.fps} timestamp_seconds=${identity.timestamp_seconds}`);

  const outputRelativePath = `storage/canonical-frame-identity-verify/GHIBLI_01_f${frameIndex}_live.jpg`;
  const evidence = reExtractCanonicalFrame(projectRoot, identity, outputRelativePath);
  console.log(`  re-extracted frame_fingerprint=${evidence.frame_fingerprint}`);

  const reDerivedIdentity = deriveCanonicalIdentityFromExtractedFrame(projectRoot, evidence);
  check(
    `frame_index=${frameIndex}: re-deriving canonical identity from the freshly re-extracted frame reproduces the same identity (self-consistent)`,
    canonicalIdentitiesMatch(identity, reDerivedIdentity)
  );

  const sceneTruth = await buildSceneTruth(projectRoot, evidence);
  check(
    `frame_index=${frameIndex}: buildSceneTruth() succeeds on the canonically re-extracted real frame (all 9 components present)`,
    sceneTruth.geometry !== undefined &&
      sceneTruth.pose !== undefined &&
      sceneTruth.depth !== undefined &&
      sceneTruth.gaze !== undefined &&
      sceneTruth.lighting !== undefined &&
      sceneTruth.camera !== undefined &&
      sceneTruth.environment !== undefined &&
      sceneTruth.occlusion !== undefined &&
      sceneTruth.objectPairSpatialRelationships !== undefined
  );

  const binding = bindRealOcclusionToSceneTruth(projectRoot, sceneTruth);
  console.log(`  realOcclusion binding: status=${binding.status} matched_via=${binding.matched_via} matched_evidence_frame_index=${binding.matched_evidence_frame_index}`);
  console.log(`  reason: ${binding.reason}`);
  check(
    `frame_index=${frameIndex}: real occlusion evidence is now genuinely integrated`,
    binding.status === 'integrated'
  );
  check(
    `frame_index=${frameIndex}: integration was achieved via canonical-identity, not byte-hash (the two frames' PNG/JPG bytes are still not identical to the anchor PNG -- honestly disclosed, not hidden)`,
    binding.matched_via === 'canonical-identity'
  );
  check(
    `frame_index=${frameIndex}: matched_evidence_frame_index equals the requested frame_index`,
    binding.matched_evidence_frame_index === frameIndex
  );

  const audit = auditSceneTruthV2ForSyntheticLeakage({ sceneTruth, realOcclusion: binding });
  console.log(`  synthetic-leakage audit: ${audit.clean ? 'clean' : audit.issues.join('; ')}`);
  check(`frame_index=${frameIndex}: synthetic/default leakage audit is clean`, audit.clean);

  const nonzeroCount = (binding.measured_pairs ?? []).filter((p) => p.intersection_pixels > 0).length;
  console.log(`  nonzero mask-intersection pairs: ${nonzeroCount} / ${binding.measured_pairs?.length ?? 0}`);

  canonicalResults.push({
    frame_index: frameIndex,
    status: binding.status,
    matched_via: binding.matched_via,
    measured_nonzero_pair_count: nonzeroCount,
  });
}

console.log();
console.log('=== No spurious match against an unrelated real video (TEST_KIKI_25S.mp4) ===');
const testKikiExtraction = extractSelectedFrames(
  projectRoot,
  'imports/source_videos/archive/test/TEST_KIKI_25S.mp4',
  [{ timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' }]
);
check('TEST_KIKI_25S.mp4 frame extraction still succeeds', testKikiExtraction.status === 'extraction-success');
if (testKikiExtraction.status === 'extraction-success') {
  const testKikiSceneTruth = await buildSceneTruth(projectRoot, testKikiExtraction.frames[0]);
  const testKikiBinding = bindRealOcclusionToSceneTruth(projectRoot, testKikiSceneTruth);
  console.log(`  TEST_KIKI_25S.mp4 t=3.000s binding: status=${testKikiBinding.status} matched_via=${testKikiBinding.matched_via}`);
  check(
    'a Scene Truth from an unregistered video (TEST_KIKI_25S.mp4) is correctly reported as no-real-evidence -- the registry never guesses a match for an unknown video',
    testKikiBinding.status === 'no-real-evidence-for-this-frame' && testKikiBinding.matched_via === null
  );
}

console.log();
console.log('=== Frame-index precision: a known video at the wrong frame number does not match ===');
const wrongFrameIdentity = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, 9999);
const knownEvidenceIdentity1280 = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, 1280);
check(
  'two different frame_index values on the SAME real video never compare equal (exact-integer discipline, not "same video is close enough")',
  !canonicalIdentitiesMatch(wrongFrameIdentity, knownEvidenceIdentity1280)
);

console.log();
console.log('=== Final verdict ===');
const readiness = assessCanonicalFrameBindingReadiness(canonicalResults);
console.log(`  ${readiness.verdict}: ${readiness.reason}`);
check('overall verdict is CANONICAL_FRAME_BOUND for the real Kiki (GHIBLI_01) frames', readiness.verdict === 'CANONICAL_FRAME_BOUND');

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
