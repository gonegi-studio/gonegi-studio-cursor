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
import { estimateFrameDepth, buildDepthAtPositionValue } from '../services/sceneMeasurementDepthEstimator.js';

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

// Reusing the same two real frames established by the geometry/pose
// verify scripts: t=13.000s has a confirmed real bbox (coco-ssd person,
// score 0.924); t=3.000s has a confirmed real pose attempt (MoveNet,
// score 0.355). Using both lets the bbox<->depth AND pose<->depth
// connections each be demonstrated against a real, already-verified
// upstream measurement rather than an arbitrary frame.
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '13.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-013.jpg' },
];

console.log('=== Extracting a small number of real Kiki frames (reusing Evidence Core) ===');
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);

if (extraction.status !== 'extraction-success') {
  failures += 1;
  console.log(`FAIL: frame extraction did not succeed -- status=${extraction.status}, error=${extraction.error}`);
} else {
  check('extraction produced the expected number of real frames', extraction.frames.length === liveTargets.length);

  const frame3 = extraction.frames.find((f) => f.timestamp_seconds === '3.000')!;
  const frame13 = extraction.frames.find((f) => f.timestamp_seconds === '13.000')!;

  console.log();
  console.log('=== Running real monocular depth estimation ===');

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s ---`);
    const depth = await estimateFrameDepth(projectRoot, frame);

    check(
      `frame ${frame.timestamp_seconds}s: depth map is strictly INFERRED, never measured`,
      depth.provenance === 'inferred'
    );
    check(
      `frame ${frame.timestamp_seconds}s: depth carries source_frame + extraction_method`,
      depth.source_frame === frame.frame_fingerprint && depth.extraction_method === 'midas-v2.1-small-256-onnx'
    );
    check(
      `frame ${frame.timestamp_seconds}s: confidence is explicitly null (MiDaS reports no uncertainty signal -- not fabricated)`,
      depth.confidence === null
    );
    check(
      `frame ${frame.timestamp_seconds}s: depth map has real, non-degenerate values (min < mean < max, finite)`,
      Number.isFinite(depth.value.min) &&
        Number.isFinite(depth.value.max) &&
        Number.isFinite(depth.value.mean) &&
        depth.value.min < depth.value.mean &&
        depth.value.mean < depth.value.max &&
        depth.value.width > 0 &&
        depth.value.height > 0 &&
        depth.value.values.length === depth.value.width * depth.value.height
    );
    console.log(
      `  ${depth.value.width}x${depth.value.height} depth map, min=${depth.value.min.toFixed(3)} mean=${depth.value.mean.toFixed(3)} max=${depth.value.max.toFixed(3)}`
    );
  }

  console.log();
  console.log('=== Verifying bbox <-> depth connectivity (real upstream measurement, same frame) ===');
  const frame13Dimensions = measureFrameDimensions(projectRoot, frame13);
  const frame13Geometry = await detectFrameGeometry(projectRoot, frame13);
  const personDetection = frame13Geometry.detections.find((d) => d.value.class === 'person');
  check('frame 13.000s: real bbox detection is available to connect depth to', personDetection !== undefined);

  if (personDetection !== undefined) {
    const frame13Depth = await estimateFrameDepth(projectRoot, frame13);
    const depthAtBbox = buildDepthAtPositionValue(
      projectRoot,
      frame13,
      frame13Depth.value,
      frame13Dimensions.value,
      personDetection.value.position2D,
      'bbox-position2D(person)'
    );
    console.log(
      `  depth at bbox position2D ${JSON.stringify(personDetection.value.position2D)} -> relativeInverseDepth=${depthAtBbox.value.relativeInverseDepth.toFixed(3)}`
    );
    check('bbox<->depth sample: still strictly INFERRED', depthAtBbox.provenance === 'inferred');
    check('bbox<->depth sample: confidence still null (no fabricated certainty)', depthAtBbox.confidence === null);
    check(
      'bbox<->depth sample: carries the same source_frame as both upstream measurements',
      depthAtBbox.source_frame === personDetection.source_frame && depthAtBbox.source_frame === frame13Depth.source_frame
    );
    check(
      'bbox<->depth sample: sampled value falls within the depth map\'s own real min/max range',
      depthAtBbox.value.relativeInverseDepth >= frame13Depth.value.min && depthAtBbox.value.relativeInverseDepth <= frame13Depth.value.max
    );
  }

  console.log();
  console.log('=== Verifying pose keypoint <-> depth connectivity (real upstream measurement, same frame) ===');
  const frame3Dimensions = measureFrameDimensions(projectRoot, frame3);
  const frame3Pose = await detectFramePose(projectRoot, frame3);
  const nosePose = frame3Pose.poses[0]?.keypoints.find((k) => k.value.name === 'nose');
  check('frame 3.000s: real nose keypoint is available to connect depth to', nosePose !== undefined);

  if (nosePose !== undefined) {
    const frame3Depth = await estimateFrameDepth(projectRoot, frame3);
    const depthAtKeypoint = buildDepthAtPositionValue(
      projectRoot,
      frame3,
      frame3Depth.value,
      frame3Dimensions.value,
      { x: nosePose.value.x, y: nosePose.value.y },
      'pose-keypoint-nose'
    );
    console.log(
      `  depth at nose keypoint (${nosePose.value.x.toFixed(1)}, ${nosePose.value.y.toFixed(1)}) -> relativeInverseDepth=${depthAtKeypoint.value.relativeInverseDepth.toFixed(3)}`
    );
    check('keypoint<->depth sample: still strictly INFERRED', depthAtKeypoint.provenance === 'inferred');
    check(
      'keypoint<->depth sample: carries the same source_frame as both upstream measurements',
      depthAtKeypoint.source_frame === nosePose.source_frame && depthAtKeypoint.source_frame === frame3Depth.source_frame
    );
  }

  console.log();
  console.log('=== Fail-closed re-confirmation for both builders (reusing Evidence Core, not re-implemented) ===');
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction/titanic-spatial-depth-registry.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'midas-v2.1-small-256-onnx', 1.0, { fake: true });
  } catch {
    rejectedMeasured = true;
  }
  check('a Titanic synthetic-depth-shaped reference cannot enter as MEASURED either', rejectedMeasured);

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'midas-v2.1-small-256-onnx', null, { fake: true });
  } catch {
    rejectedInferred = true;
  }
  check(
    'a Titanic synthetic-depth-shaped reference (titanic-spatial-depth-registry.json) cannot enter as INFERRED',
    rejectedInferred
  );
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
