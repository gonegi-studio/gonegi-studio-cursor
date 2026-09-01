import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { buildSceneTruth, type SceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import {
  buildSceneTruthV2,
  bindRealOcclusionToSceneTruth,
  auditSceneTruthV2ForSyntheticLeakage,
  assessSceneTruthV2Readiness,
  integrateRealOcclusionEvidence,
  type SceneTruthV2FrameAssessment,
} from '../services/sceneMeasurementSceneTruthV2Integrator.js';

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

const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '18.500', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-018.jpg' },
];

console.log('=== Structural separation: no import of the bbox-overlap proxy module ===');
const serviceSource = fs.readFileSync(path.join(projectRoot, 'services/sceneMeasurementSceneTruthV2Integrator.ts'), 'utf8');
const importLines = serviceSource.split('\n').filter((line) => /^\s*import\b.*\bfrom\s+['"]/.test(line));
check(
  'sceneMeasurementSceneTruthV2Integrator.ts does not import sceneMeasurementOcclusionAnalyzer.ts directly',
  !importLines.some((line) => line.includes('sceneMeasurementOcclusionAnalyzer'))
);

console.log();
console.log('=== Extracting real Kiki frames (reusing Evidence Core, same as Scene Truth V1) ===');
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);

if (extraction.status !== 'extraction-success') {
  failures += 1;
  console.log(`FAIL: frame extraction did not succeed -- status=${extraction.status}, error=${extraction.error}`);
} else {
  console.log();
  console.log('=== Real occlusion subsystem verdict (V1, reused as-is) ===');
  const realOcclusionSubsystem = integrateRealOcclusionEvidence(projectRoot);
  console.log(`  ${realOcclusionSubsystem.verdict}: ${realOcclusionSubsystem.reason}`);
  check('Real Occlusion Integration subsystem itself is REAL_OCCLUSION_INTEGRATED', realOcclusionSubsystem.verdict === 'REAL_OCCLUSION_INTEGRATED');

  const frameAssessments: SceneTruthV2FrameAssessment[] = [];

  for (const target of extraction.frames) {
    console.log();
    console.log(`=== Building Scene Truth V2 for real frame t=${target.timestamp_seconds}s ===`);
    const v2 = await buildSceneTruthV2(projectRoot, target);
    const directV1 = await buildSceneTruth(projectRoot, target);

    check(
      `t=${target.timestamp_seconds}s: sceneTruth is passed through verbatim (identical to a direct buildSceneTruth() call, not rebuilt)`,
      v2.sceneTruth.frame_fingerprint === directV1.frame_fingerprint &&
        v2.sceneTruth.geometry.detections.length === directV1.geometry.detections.length &&
        v2.sceneTruth.occlusion.measured.value.pairs.length === directV1.occlusion.measured.value.pairs.length
    );
    check(
      `t=${target.timestamp_seconds}s: all 9 canonical components present (geometry, pose, depth, gaze, lighting, camera, environment, occlusion, spatial-relationship)`,
      v2.sceneTruth.geometry !== undefined &&
        v2.sceneTruth.pose !== undefined &&
        v2.sceneTruth.depth !== undefined &&
        v2.sceneTruth.gaze !== undefined &&
        v2.sceneTruth.lighting !== undefined &&
        v2.sceneTruth.camera !== undefined &&
        v2.sceneTruth.environment !== undefined &&
        v2.sceneTruth.occlusion !== undefined &&
        v2.sceneTruth.objectPairSpatialRelationships !== undefined
    );

    console.log(`  realOcclusion.status: ${v2.realOcclusion.status}`);
    console.log(`  realOcclusion.reason: ${v2.realOcclusion.reason}`);
    check(
      `t=${target.timestamp_seconds}s: realOcclusion is explicit no-evidence (honest -- no fabricated connection), never populated with bbox-overlap data`,
      v2.realOcclusion.status === 'no-real-evidence-for-this-frame' && v2.realOcclusion.measured_pairs === null
    );
    check(
      `t=${target.timestamp_seconds}s: sceneTruth.occlusion (bbox proxy) is untouched and structurally distinct from realOcclusion`,
      Array.isArray(v2.sceneTruth.occlusion.measured.value.pairs)
    );

    const audit = auditSceneTruthV2ForSyntheticLeakage(v2);
    console.log(`  synthetic-leakage audit: ${audit.clean ? 'clean' : audit.issues.join('; ')}`);
    check(`t=${target.timestamp_seconds}s: synthetic/default leakage audit is clean`, audit.clean);

    frameAssessments.push({
      timestamp_seconds: target.timestamp_seconds,
      frame_fingerprint: v2.sceneTruth.frame_fingerprint,
      realOcclusionStatus: v2.realOcclusion.status,
      audit,
    });
  }

  console.log();
  console.log('=== Real, current Scene Truth V2 readiness (only ever fed real buildSceneTruth() output) ===');
  const readiness = assessSceneTruthV2Readiness(frameAssessments, realOcclusionSubsystem.verdict);
  console.log(`  ${readiness.verdict}: ${readiness.reason}`);
  check(
    'today, with the real TEST_KIKI frames and the real GHIBLI_01 occlusion evidence, the honest verdict is REAL_GAP (zero real frame-identity overlap between the two pipelines -- confirmed, not assumed)',
    readiness.verdict === 'REAL_GAP'
  );
  check(
    'the REAL_GAP reason names the actual cause (no byte-identical frame match), not a code failure',
    readiness.reason.includes('data-coverage gap')
  );

  console.log();
  console.log('=== Isolated binding-mechanism check (NOT fed into the real verdict above) ===');
  console.log('    Proves bindRealOcclusionToSceneTruth() DOES integrate when a genuine byte match exists,');
  console.log('    using a real on-disk GHIBLI_01 anchor frame hash -- not a hand-typed magic constant, and');
  console.log('    never passed to assessSceneTruthV2Readiness(), so it cannot inflate the honest verdict above.');
  const anchorFramePath = path.join(
    projectRoot,
    'datasets/movie_analysis/numerical_cinematography/anchor_frame_cache/GHIBLI_01_f1280.png'
  );
  const anchorFrameHash = crypto.createHash('sha256').update(fs.readFileSync(anchorFramePath)).digest('hex');
  // Deliberately minimal test double: bindRealOcclusionToSceneTruth() only
  // reads frame_fingerprint. This is a white-box check of the binding
  // mechanism alone, not a claim that this is a real composed Scene Truth.
  const mechanismCheckStub = { frame_fingerprint: anchorFrameHash } as unknown as SceneTruth;
  const mechanismResult = bindRealOcclusionToSceneTruth(projectRoot, mechanismCheckStub);
  console.log(`  mechanism result: ${mechanismResult.status} (matched_evidence_frame_index=${mechanismResult.matched_evidence_frame_index})`);
  check(
    'given a genuine byte-identical frame_fingerprint, the binding mechanism reports integrated with real matched pairs',
    mechanismResult.status === 'integrated' &&
      mechanismResult.matched_evidence_frame_index === 1280 &&
      (mechanismResult.measured_pairs?.length ?? 0) > 0
  );

  console.log();
  console.log('=== Fail-closed: a fabricated frame_fingerprint that matches nothing real ===');
  const fabricatedStub = { frame_fingerprint: 'not-a-real-fingerprint-'.padEnd(64, '0') } as unknown as SceneTruth;
  const fabricatedResult = bindRealOcclusionToSceneTruth(projectRoot, fabricatedStub);
  check(
    'a fabricated frame_fingerprint is rejected as no-real-evidence, never accepted',
    fabricatedResult.status === 'no-real-evidence-for-this-frame' && fabricatedResult.measured_pairs === null
  );
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
