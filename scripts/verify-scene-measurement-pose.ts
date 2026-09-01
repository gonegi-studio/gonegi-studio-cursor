import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames, buildMeasuredValue } from '../services/sceneMeasurementEvidenceCore.js';
import { detectFramePose, MOVENET_KEYPOINT_NAMES } from '../services/sceneMeasurementPoseDetector.js';

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

// t=13.000s is the confirmed real 'person' detection (score 0.924) from
// verify-scene-measurement-geometry.ts's own probing -- the strongest
// candidate for a genuine, confident pose in this clip. t=3.000s is a
// confirmed zero-object frame from that same script -- a real candidate
// for a low-confidence/partial pose result, not a hand-picked "empty"
// case.
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
  console.log('=== Running real pose/keypoint detection on each real frame ===');

  let sawAtLeastOnePose = false;
  let sawAHighConfidenceKeypoint = false;
  let sawALowConfidenceKeypoint = false;

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);

    const result = await detectFramePose(projectRoot, frame);
    check(`frame ${frame.timestamp_seconds}s: detector ran to completion (real outcome, not a placeholder)`, result.ranToCompletion === true);

    console.log(`  poses found: ${result.poses.length}`);
    for (const pose of result.poses) {
      sawAtLeastOnePose = true;
      console.log(`  pose score=${pose.poseScore?.toFixed(3) ?? 'null'}, keypoints=${pose.keypoints.length}`);

      check(`  frame ${frame.timestamp_seconds}s: pose reports all 17 COCO keypoints, none dropped`, pose.keypoints.length === MOVENET_KEYPOINT_NAMES.length);

      for (const kp of pose.keypoints) {
        console.log(
          `    ${kp.value.name.padEnd(15)} x=${kp.value.x.toFixed(1)} y=${kp.value.y.toFixed(1)} confidence=${kp.confidence?.toFixed(3) ?? 'null'}`
        );
        check(
          `    keypoint ${kp.value.name} carries full lineage: source_frame + extraction_method + confidence`,
          kp.provenance === 'measured' &&
            kp.source_frame === frame.frame_fingerprint &&
            kp.extraction_method === 'movenet-singlepose-lightning' &&
            typeof kp.confidence === 'number'
        );
        if ((kp.confidence ?? 0) >= 0.5) sawAHighConfidenceKeypoint = true;
        if ((kp.confidence ?? 1) < 0.3) sawALowConfidenceKeypoint = true;
      }
    }

    if (result.poses.length === 0) {
      console.log('  ZERO poses -- explicitly recorded as ranToCompletion:true, not a missing/failed measurement.');
    }
  }

  check('the positive-pose path was genuinely exercised (at least one pose reported)', sawAtLeastOnePose);
  check('at least one genuinely high-confidence keypoint was observed (proves real, non-degenerate scoring)', sawAHighConfidenceKeypoint);
  check(
    'at least one genuinely low-confidence keypoint was preserved as-is (proves partial/uncertain detection is not filtered out)',
    sawALowConfidenceKeypoint
  );

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  let rejectedFabricated = false;
  try {
    buildMeasuredValue(
      projectRoot,
      {
        frame_path: 'datasets/movie_reconstruction/titanic_dense/titanic-body-pose-registry.json',
        frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
        timestamp_seconds: '0.000',
        source_video_path: 'not-a-real-source-video.mp4',
        source_video_fingerprint: 'not-a-real-video',
      },
      'movenet-singlepose-lightning',
      0.94,
      { name: 'nose', x: 0, y: 0 }
    );
  } catch {
    rejectedFabricated = true;
  }
  check(
    'a Titanic synthetic-skeleton-shaped reference (titanic-body-pose-registry.json) still cannot enter as a MEASURED keypoint',
    rejectedFabricated
  );
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
