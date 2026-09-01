import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  extractSelectedFrames,
  buildMeasuredValue,
  buildInferredValue,
  measureFrameDimensions,
} from '../services/sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry } from '../services/sceneMeasurementGeometryDetector.js';
import { detectFramePose } from '../services/sceneMeasurementPoseDetector.js';
import { estimateFrameDepth } from '../services/sceneMeasurementDepthEstimator.js';
import {
  measureObjectPairRelationship,
  measureKeypointPairRelationship,
  interpretRelativeDepthSeparation,
  interpretAbsoluteSpatialEstimate,
} from '../services/sceneMeasurementSpatialRelationshipAnalyzer.js';

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

// Same real source video as the other scene-measurement verify scripts.
// Note (unchanged, out of scope here): testKikiExtractionSchema.ts's own
// TEST_KIKI_SOURCE_PATH constant is stale; this points at the verified
// real location directly.
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';

// t=18.500s has two confirmed real 'surfboard' detections (geometry
// verify script's own probing) -- the real object-pair case. t=3.000s
// has a confirmed real pose with all 17 keypoints (pose verify script) --
// the real keypoint-pair case (left_wrist vs right_wrist).
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '18.500', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-018.jpg' },
];

console.log('=== Extracting a small number of real Kiki frames (reusing Evidence Core) ===');
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);

if (extraction.status !== 'extraction-success') {
  failures += 1;
  console.log(`FAIL: frame extraction did not succeed -- status=${extraction.status}, error=${extraction.error}`);
} else {
  const frame3 = extraction.frames.find((f) => f.timestamp_seconds === '3.000')!;
  const frame18 = extraction.frames.find((f) => f.timestamp_seconds === '18.500')!;

  console.log();
  console.log('=== Object-pair relationship (reusing Geometry Core, real two-object frame) ===');
  const geometry18 = await detectFrameGeometry(projectRoot, frame18);
  check('frame 18.500s has at least two real geometry detections to relate', geometry18.detections.length >= 2);

  if (geometry18.detections.length >= 2) {
    const [objA, objB] = geometry18.detections;
    const objRelationship = measureObjectPairRelationship(projectRoot, frame18, objA, objB);

    check('object-pair relationship is strictly MEASURED', objRelationship.provenance === 'measured');
    check(
      'carries source_frame + extraction_method',
      objRelationship.source_frame === frame18.frame_fingerprint &&
        objRelationship.extraction_method === 'screen-space-distance-and-size-ratio-from-geometry-bboxes-v1'
    );
    check(
      'confidence is the real minimum of the two objects\' own detection confidences',
      objRelationship.confidence === Math.min(objA.confidence ?? Infinity, objB.confidence ?? Infinity)
    );
    console.log(
      `  pixelDistance=${objRelationship.value.pixelDistance.toFixed(2)} relativeSizeRatio=${objRelationship.value.relativeSizeRatio?.toFixed(4)} confidence=${objRelationship.confidence?.toFixed(3)}`
    );
    check(
      'pixelDistance and relativeSizeRatio are real, positive, finite numbers',
      objRelationship.value.pixelDistance >= 0 &&
        Number.isFinite(objRelationship.value.pixelDistance) &&
        objRelationship.value.relativeSizeRatio !== null &&
        objRelationship.value.relativeSizeRatio > 0
    );

    console.log();
    console.log('  --- relative depth separation for this same object pair (reusing Depth Core) ---');
    const dims18 = measureFrameDimensions(projectRoot, frame18);
    const depth18 = await estimateFrameDepth(projectRoot, frame18);
    const depthSeparation = interpretRelativeDepthSeparation(
      projectRoot,
      frame18,
      depth18.value,
      dims18.value,
      objA.value.position2D,
      objB.value.position2D
    );
    check('relative depth separation is strictly INFERRED, never measured', depthSeparation.provenance === 'inferred');
    check(
      'confidence is unconditionally null -- MiDaS reports no per-pixel confidence to propagate',
      depthSeparation.confidence === null
    );
    check('carries source_frame matching both upstream measurements', depthSeparation.source_frame === frame18.frame_fingerprint);
    console.log(
      `  pointADepth=${depthSeparation.value.pointADepth.toFixed(2)} pointBDepth=${depthSeparation.value.pointBDepth.toFixed(2)} ` +
        `closerPoint=${depthSeparation.value.closerPoint}`
    );
    check(
      'depth values fall within the real depth map\'s own min/max range',
      depthSeparation.value.pointADepth >= depth18.value.min &&
        depthSeparation.value.pointADepth <= depth18.value.max &&
        depthSeparation.value.pointBDepth >= depth18.value.min &&
        depthSeparation.value.pointBDepth <= depth18.value.max
    );
  }

  console.log();
  console.log('=== Keypoint-pair relationship (reusing Pose Core, real detected pose) ===');
  const pose3 = await detectFramePose(projectRoot, frame3);
  check('frame 3.000s has a real detected pose to relate keypoints within', pose3.poses.length > 0);

  if (pose3.poses.length > 0) {
    const keypoints = pose3.poses[0].keypoints;
    const leftWrist = keypoints.find((k) => k.value.name === 'left_wrist')!;
    const rightWrist = keypoints.find((k) => k.value.name === 'right_wrist')!;
    const kpRelationship = measureKeypointPairRelationship(projectRoot, frame3, leftWrist, rightWrist);

    check('keypoint-pair relationship is strictly MEASURED', kpRelationship.provenance === 'measured');
    check(
      'carries source_frame + extraction_method',
      kpRelationship.source_frame === frame3.frame_fingerprint &&
        kpRelationship.extraction_method === 'screen-space-distance-from-pose-keypoints-v1'
    );
    check(
      'confidence is the real minimum of the two keypoints\' own confidences',
      kpRelationship.confidence === Math.min(leftWrist.confidence ?? Infinity, rightWrist.confidence ?? Infinity)
    );
    check('relativeSizeRatio is null for a keypoint pair -- a keypoint has no inherent size', kpRelationship.value.relativeSizeRatio === null);
    console.log(`  pixelDistance=${kpRelationship.value.pixelDistance.toFixed(2)} (left_wrist <-> right_wrist) confidence=${kpRelationship.confidence?.toFixed(3)}`);
    check('pixelDistance is a real, positive, finite number', kpRelationship.value.pixelDistance >= 0 && Number.isFinite(kpRelationship.value.pixelDistance));

    console.log();
    console.log('  --- relative depth separation for this same keypoint pair ---');
    const dims3 = measureFrameDimensions(projectRoot, frame3);
    const depth3 = await estimateFrameDepth(projectRoot, frame3);
    const kpDepthSeparation = interpretRelativeDepthSeparation(
      projectRoot,
      frame3,
      depth3.value,
      dims3.value,
      { x: leftWrist.value.x, y: leftWrist.value.y },
      { x: rightWrist.value.x, y: rightWrist.value.y }
    );
    check('keypoint-pair depth separation is strictly INFERRED', kpDepthSeparation.provenance === 'inferred');
    check('confidence is unconditionally null here too', kpDepthSeparation.confidence === null);
  }

  console.log();
  console.log('=== Absolute distance/size -- must always be null, no calibration exists ===');
  for (const frame of [frame3, frame18]) {
    const absolute = interpretAbsoluteSpatialEstimate(projectRoot, frame);
    check(
      `frame ${frame.timestamp_seconds}s: absolute distanceMeters/sizeMeters are unconditionally null`,
      absolute.value.distanceMeters === null && absolute.value.sizeMeters === null && absolute.confidence === null
    );
    check(`frame ${frame.timestamp_seconds}s: absolute estimate is still a real InferredValue with full lineage`, absolute.provenance === 'inferred' && absolute.source_frame === frame.frame_fingerprint);
  }

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction/titanic-character-placement-registry.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'screen-space-distance-and-size-ratio-from-geometry-bboxes-v1', 0.9, {
      pixelDistance: 100,
      relativeSizeRatio: 1.5,
    });
  } catch {
    rejectedMeasured = true;
  }
  check('a Titanic synthetic-placement-shaped reference cannot enter as MEASURED spatial relationship', rejectedMeasured);

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'relative-depth-comparison-from-midas-v2.1-small-256-onnx-v1', null, {
      pointADepth: 500,
      pointBDepth: 400,
      relativeInverseDepthDifference: 100,
      closerPoint: 'A',
    });
  } catch {
    rejectedInferred = true;
  }
  check('the same fabricated reference cannot enter as INFERRED depth separation either', rejectedInferred);
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
