import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames, buildMeasuredValue, buildInferredValue } from '../services/sceneMeasurementEvidenceCore.js';
import { detectFramePose } from '../services/sceneMeasurementPoseDetector.js';
import { estimateFrameGaze } from '../services/sceneMeasurementGazeEstimator.js';

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

// t=3.000s is the confirmed real pose attempt from
// verify-scene-measurement-pose.ts (MoveNet, pose score 0.355, keypoint
// confidences spanning ~0.18-0.51) -- a real candidate for a genuine,
// non-degenerate gaze vector. t=13.000s is the confirmed real
// zero-poses frame from that same script -- a real candidate for the
// "no face/pose to derive gaze from" preserved-null case, not a
// hand-picked one.
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

  console.log();
  console.log('=== Running real head-pose-proxy gaze estimation (reusing Pose Core) ===');

  let sawARealGazeVector = false;
  let sawAPreservedNonDetection = false;

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);
    const pose = await detectFramePose(projectRoot, frame);
    const result = await estimateFrameGaze(projectRoot, frame, pose);

    check(`frame ${frame.timestamp_seconds}s: gaze estimation ran to completion (real outcome, not a placeholder)`, result.ranToCompletion === true);

    if (result.gaze === null) {
      sawAPreservedNonDetection = true;
      console.log('  gaze: null -- no pose was available to derive gaze from; explicitly preserved, not an error.');
    } else {
      sawARealGazeVector = true;
      const g = result.gaze;
      console.log(
        `  gazeVector=(${g.value.gazeVector.x.toFixed(3)}, ${g.value.gazeVector.y.toFixed(3)}) confidence=${g.confidence?.toFixed(3) ?? 'null'}`
      );
      console.log(
        `  derivedFrom: nose(conf=${g.value.derivedFrom.nose.confidence?.toFixed(3)}) ` +
          `leftEye(conf=${g.value.derivedFrom.leftEye.confidence?.toFixed(3)}) ` +
          `rightEye(conf=${g.value.derivedFrom.rightEye.confidence?.toFixed(3)})`
      );

      check(
        `  frame ${frame.timestamp_seconds}s: gaze is strictly INFERRED, never measured (head-pose-based, per this task's own rule)`,
        g.provenance === 'inferred'
      );
      check(
        `  frame ${frame.timestamp_seconds}s: gaze carries source_frame + extraction_method`,
        g.source_frame === frame.frame_fingerprint && g.extraction_method === 'head-pose-proxy-from-movenet-singlepose-lightning-v1'
      );
      check(
        `  frame ${frame.timestamp_seconds}s: confidence is the real minimum of the 3 upstream keypoint confidences, not fabricated`,
        g.confidence !== null &&
          g.confidence ===
            Math.min(
              g.value.derivedFrom.nose.confidence ?? Infinity,
              g.value.derivedFrom.leftEye.confidence ?? Infinity,
              g.value.derivedFrom.rightEye.confidence ?? Infinity
            )
      );
      check(
        `  frame ${frame.timestamp_seconds}s: gaze vector components are finite real numbers`,
        Number.isFinite(g.value.gazeVector.x) && Number.isFinite(g.value.gazeVector.y)
      );
    }
  }

  check('the positive-gaze path was genuinely exercised (at least one real gaze vector produced)', sawARealGazeVector);
  check(
    'the non-detection preservation path was genuinely exercised (at least one real "no pose to derive gaze from" case)',
    sawAPreservedNonDetection
  );

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  // titanic-body-pose-registry.json is where this system's own earlier
  // coverage assessment found gaze represented only as a categorical
  // "eye_direction" field, never a vector -- used here as the
  // synthetic-data-shaped reference this fail-closed check must reject.
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction/titanic_dense/titanic-body-pose-registry.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'head-pose-proxy-from-movenet-singlepose-lightning-v1', 1.0, {
      gazeVector: { x: 0, y: 0 },
    });
  } catch {
    rejectedMeasured = true;
  }
  check('a Titanic synthetic-gaze-shaped reference cannot enter as MEASURED either', rejectedMeasured);

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'head-pose-proxy-from-movenet-singlepose-lightning-v1', 0.9, {
      gazeVector: { x: 0, y: 0 },
    });
  } catch {
    rejectedInferred = true;
  }
  check(
    'a Titanic synthetic-gaze-shaped reference (titanic-body-pose-registry.json eye_direction) cannot enter as INFERRED',
    rejectedInferred
  );
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
