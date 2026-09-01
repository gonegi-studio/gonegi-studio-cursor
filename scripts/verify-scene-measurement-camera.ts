import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames, buildMeasuredValue, buildInferredValue } from '../services/sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry } from '../services/sceneMeasurementGeometryDetector.js';
import { measureFrameCameraEvidence, interpretFrameCamera } from '../services/sceneMeasurementCameraAnalyzer.js';

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

// t=13.000s has a confirmed real subject (coco-ssd person, score 0.924,
// frameRelativeScale=0.5208 from verify-scene-measurement-geometry.ts) --
// the real candidate for the "subject detected" framing path. t=3.000s
// has confirmed zero geometry detections from that same script -- the
// real candidate for the "no subject detected" preservation path, not a
// hand-picked empty case.
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

  let sawSubjectDetectedFraming = false;
  let sawNoSubjectFraming = false;

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);
    const geometry = await detectFrameGeometry(projectRoot, frame);
    const measured = await measureFrameCameraEvidence(projectRoot, frame, geometry);
    const m = measured.value;

    check(`frame ${frame.timestamp_seconds}s: camera framing evidence is strictly MEASURED`, measured.provenance === 'measured');
    check(
      `frame ${frame.timestamp_seconds}s: carries source_frame + extraction_method + confidence=1.0`,
      measured.source_frame === frame.frame_fingerprint &&
        measured.extraction_method === 'camera-framing-from-geometry-bbox-v1' &&
        measured.confidence === 1.0
    );
    check(`frame ${frame.timestamp_seconds}s: frameAspectRatio is a real positive number`, m.frameAspectRatio > 0);
    console.log(`  frameAspectRatio=${m.frameAspectRatio.toFixed(4)}`);

    const noSubject = m.subjectFrameRelativeScale === null;
    if (noSubject) {
      sawNoSubjectFraming = true;
      check(
        `frame ${frame.timestamp_seconds}s: all subject-dependent fields are null when no subject was detected`,
        m.subjectFrameRelativeScale === null &&
          m.subjectScreenPosition === null &&
          m.headroomRatio === null &&
          m.ruleOfThirdsDistance === null
      );
    } else {
      sawSubjectDetectedFraming = true;
      console.log(
        `  subjectFrameRelativeScale=${m.subjectFrameRelativeScale?.toFixed(4)} subjectScreenPosition=${JSON.stringify(m.subjectScreenPosition)} ` +
          `headroomRatio=${m.headroomRatio?.toFixed(4)} ruleOfThirdsDistance=${m.ruleOfThirdsDistance?.toFixed(4)}`
      );
      check(
        `frame ${frame.timestamp_seconds}s: subject fields are real, self-consistent numbers`,
        m.subjectFrameRelativeScale !== null &&
          m.subjectFrameRelativeScale > 0 &&
          m.subjectScreenPosition !== null &&
          m.subjectScreenPosition.x >= 0 &&
          m.subjectScreenPosition.x <= 1 &&
          m.subjectScreenPosition.y >= 0 &&
          m.subjectScreenPosition.y <= 1 &&
          m.headroomRatio !== null &&
          m.ruleOfThirdsDistance !== null &&
          m.ruleOfThirdsDistance >= 0
      );
    }

    console.log(`  --- interpreting (INFERRED) ---`);
    const interpretation = interpretFrameCamera(projectRoot, frame, m);

    check('framingType is strictly INFERRED, never measured (Scene Truth Integrity Repair V1: moved off MEASURED)', interpretation.framingType.provenance === 'inferred');
    check(
      'framingType carries source_frame matching the measured evidence it was derived from',
      interpretation.framingType.source_frame === measured.source_frame
    );
    console.log(`  framingType guess=${interpretation.framingType.value.guess} confidence=${interpretation.framingType.confidence ?? 'null'}`);
    if (noSubject) {
      check(
        'framingType guess is no-subject-detected with null confidence when there was no subject to bucket at all',
        interpretation.framingType.value.guess === 'no-subject-detected' && interpretation.framingType.confidence === null
      );
    } else {
      check(
        'framingType classification matches the documented scale thresholds exactly',
        (m.subjectFrameRelativeScale! > 0.7 && interpretation.framingType.value.guess === 'close-up') ||
          (m.subjectFrameRelativeScale! > 0.35 && m.subjectFrameRelativeScale! <= 0.7 && interpretation.framingType.value.guess === 'medium-shot') ||
          (m.subjectFrameRelativeScale! <= 0.35 && interpretation.framingType.value.guess === 'wide-shot')
      );
      check(
        'framingType confidence is a real, non-null, in-range number when a subject was measured',
        typeof interpretation.framingType.confidence === 'number' &&
          interpretation.framingType.confidence >= 0 &&
          interpretation.framingType.confidence <= 1
      );
    }

    check('cameraAngle is strictly INFERRED, never measured', interpretation.cameraAngle.provenance === 'inferred');
    check(
      'cameraAngle carries source_frame matching the measured evidence it was derived from',
      interpretation.cameraAngle.source_frame === measured.source_frame
    );
    check('cameraFov is strictly INFERRED, never measured', interpretation.cameraFov.provenance === 'inferred');
    console.log(
      `  cameraAngle guess=${JSON.stringify(interpretation.cameraAngle.value.guess)} confidence=${interpretation.cameraAngle.confidence ?? 'null'}`
    );
    console.log(
      `  cameraFov guess=${JSON.stringify(interpretation.cameraFov.value.guess)} confidence=${interpretation.cameraFov.confidence ?? 'null'}`
    );

    check(
      'cameraFov guess/confidence are always null -- explicitly not attempted without calibration, never fabricated',
      interpretation.cameraFov.value.guess === null && interpretation.cameraFov.confidence === null
    );

    if (noSubject) {
      check(
        'cameraAngle guess/confidence are null when there was no subject to base even a weak guess on',
        interpretation.cameraAngle.value.guess === null && interpretation.cameraAngle.confidence === null
      );
    } else {
      check(
        'cameraAngle produces a real, non-null guess and confidence when a subject was measured',
        interpretation.cameraAngle.value.guess !== null &&
          typeof interpretation.cameraAngle.confidence === 'number' &&
          interpretation.cameraAngle.confidence >= 0 &&
          interpretation.cameraAngle.confidence <= 1
      );
      const y = m.subjectScreenPosition!.y;
      const expectedGuess = y < 0.4 ? 'low-angle' : y > 0.6 ? 'high-angle' : 'eye-level';
      const expectedConfidence = Math.min(1, Math.abs(y - 0.5) / 0.5);
      check(
        'cameraAngle guess matches the documented vertical-position formula exactly',
        interpretation.cameraAngle.value.guess === expectedGuess
      );
      check(
        'cameraAngle confidence matches the documented formula exactly',
        Math.abs((interpretation.cameraAngle.confidence ?? -1) - expectedConfidence) < 1e-9
      );
    }
  }

  check('the "subject detected" framing path was genuinely exercised', sawSubjectDetectedFraming);
  check('the "no subject detected" preservation path was genuinely exercised', sawNoSubjectFraming);

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction/titanic-scene-geometry-registry.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'camera-framing-from-geometry-bbox-v1', 1.0, {
      frameAspectRatio: 1.78,
      subjectFrameRelativeScale: 0.5,
      subjectScreenPosition: { x: 0.5, y: 0.5 },
      headroomRatio: 0.1,
      ruleOfThirdsDistance: 0.2,
    });
  } catch {
    rejectedMeasured = true;
  }
  check(
    'a Titanic synthetic-camera-shaped reference (titanic-scene-geometry-registry.json) cannot enter as MEASURED',
    rejectedMeasured
  );

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'camera-angle-guess-from-subject-vertical-position-v1', 0.8, {
      guess: 'eye-level',
    });
  } catch {
    rejectedInferred = true;
  }
  check('the same fabricated reference cannot enter as INFERRED camera interpretation either', rejectedInferred);
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
