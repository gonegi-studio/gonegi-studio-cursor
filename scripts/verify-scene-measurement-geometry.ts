import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry } from '../services/sceneMeasurementGeometryDetector.js';

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

// Reuses the same real source video already established in
// verify-scene-measurement-evidence-core.ts. Note (unchanged from that
// script, not fixed here -- out of scope): testKikiExtractionSchema.ts's
// own TEST_KIKI_SOURCE_PATH constant is stale; this points at the
// verified real location directly.
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';

// t=3.000s/10.000s are the same two frames verify-scene-measurement-evidence-core.ts
// already exercises (kept here to also confirm the geometry detector's
// "ran, found nothing" path on real data); t=13.000s is a confirmed real
// positive detection (found via manual probing of this same clip: a
// 'person' at score 0.924), included so this checked-in test genuinely
// exercises the non-empty detection path too, not only by chance.
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '10.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-010.jpg' },
  { timestampSeconds: '13.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-013.jpg' },
];

console.log('=== Extracting a small number of real frames (reusing Evidence Core) ===');
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);

let totalDetectionsAcrossAllFrames = 0;

if (extraction.status !== 'extraction-success') {
  failures += 1;
  console.log(`FAIL: frame extraction did not succeed -- status=${extraction.status}, error=${extraction.error}`);
} else {
  check('extraction produced the expected number of real frames', extraction.frames.length === liveTargets.length);

  console.log();
  console.log('=== Running real object detection on each real frame ===');

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);

    const result = await detectFrameGeometry(projectRoot, frame);

    check(`frame ${frame.timestamp_seconds}s: detector ran to completion (real outcome, not a placeholder)`, result.ranToCompletion === true);

    console.log(`  detections found: ${result.detections.length}`);
    totalDetectionsAcrossAllFrames += result.detections.length;
    for (const detection of result.detections) {
      console.log(
        `    class=${detection.value.class} score=${detection.confidence?.toFixed(3)} bbox=${JSON.stringify(detection.value.bbox)} ` +
          `position2D=${JSON.stringify(detection.value.position2D)} frameRelativeScale=${detection.value.frameRelativeScale.toFixed(4)}`
      );

      check(
        `  detection (${detection.value.class}) carries full lineage: source_frame + extraction_method + confidence`,
        detection.provenance === 'measured' &&
          detection.source_frame === frame.frame_fingerprint &&
          detection.extraction_method === 'coco-ssd-lite_mobilenet_v2' &&
          typeof detection.confidence === 'number' &&
          detection.confidence > 0 &&
          detection.confidence <= 1
      );
      check(
        `  detection (${detection.value.class}) bbox/position/scale are geometrically consistent`,
        detection.value.bbox.width > 0 &&
          detection.value.bbox.height > 0 &&
          detection.value.position2D.x === detection.value.bbox.x + detection.value.bbox.width / 2 &&
          detection.value.position2D.y === detection.value.bbox.y + detection.value.bbox.height / 2 &&
          detection.value.frameRelativeScale > 0 &&
          detection.value.frameRelativeScale <= 1
      );
    }

    if (result.detections.length === 0) {
      console.log(
        `  ZERO detections -- explicitly recorded as ranToCompletion:true, not a missing/failed measurement.`
      );
    }
  }

  check(
    'the non-empty detection path was genuinely exercised (at least one real detection across the sampled frames)',
    totalDetectionsAcrossAllFrames > 0
  );

  // Fail-closed sanity check specific to this module: confirm there is
  // still no way to obtain a MEASURED geometry value from data this
  // module did not itself just detect -- reuses
  // sceneMeasurementEvidenceCore.ts's own guard, not a new one.
  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  const { buildMeasuredValue } = await import('../services/sceneMeasurementEvidenceCore.js');
  let rejectedFabricated = false;
  try {
    buildMeasuredValue(
      projectRoot,
      {
        frame_path: 'datasets/movie_reconstruction/titanic-scene-geometry-registry.json',
        frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
        timestamp_seconds: '0.000',
        source_video_path: 'not-a-real-source-video.mp4',
        source_video_fingerprint: 'not-a-real-video',
      },
      'coco-ssd-lite_mobilenet_v2',
      0.9,
      { class: 'person', bbox: { x: 0, y: 0, width: 1, height: 1 }, position2D: { x: 0, y: 0 }, frameRelativeScale: 1 }
    );
  } catch {
    rejectedFabricated = true;
  }
  check('a Titanic-registry-shaped reference still cannot enter as a MEASURED geometry value', rejectedFabricated);
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
