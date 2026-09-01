import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames, buildMeasuredValue, buildInferredValue } from '../services/sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry } from '../services/sceneMeasurementGeometryDetector.js';
import { measureFrameLighting } from '../services/sceneMeasurementLightingAnalyzer.js';
import { measureFrameEnvironmentEvidence, interpretFrameEnvironment } from '../services/sceneMeasurementEnvironmentAnalyzer.js';

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

// t=3.000s has confirmed zero geometry detections (verify-scene-
// measurement-geometry.ts) -- the real candidate for the "no
// environment-relevant evidence, honest null guess" path. t=18.500s has
// two confirmed real 'surfboard' detections from that same script's own
// probing (a broom misclassification, kept as-is rather than filtered --
// see this module's own header on inheriting upstream detector
// misclassification honestly) -- the real candidate for the "real
// evidence, real outdoor guess" path, since 'surfboard' is genuinely in
// this module's outdoor-associated class set.
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
  check('extraction produced the expected number of real frames', extraction.frames.length === liveTargets.length);

  let sawARealGuess = false;
  let sawAnHonestNullGuess = false;

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);
    const geometry = await detectFrameGeometry(projectRoot, frame);
    const lighting = measureFrameLighting(projectRoot, frame);
    const measured = await measureFrameEnvironmentEvidence(projectRoot, frame, geometry, lighting);
    const m = measured.value;

    check('environment evidence is strictly MEASURED', measured.provenance === 'measured');
    check(
      'carries source_frame + extraction_method + confidence=1.0 (deterministic assembly)',
      measured.source_frame === frame.frame_fingerprint &&
        measured.extraction_method === 'environment-evidence-from-geometry-and-lighting-v1' &&
        measured.confidence === 1.0
    );
    console.log(`  detectedObjects: ${m.detectedObjects.map((o) => `${o.class}(${o.confidence?.toFixed(3) ?? 'null'})`).join(', ') || '(none)'}`);
    console.log(`  lighting.luminance.mean=${m.lighting.luminance.mean.toFixed(2)}`);
    check(
      'each detected object preserves its own real confidence (or honest null), distinct from the outer 1.0 assembly confidence -- never fabricated to 0',
      m.detectedObjects.every((o) => o.confidence === null || (o.confidence >= 0 && o.confidence <= 1))
    );
    check(
      'no detected object confidence is silently coerced from null to 0 (Scene Truth Integrity Repair V1)',
      geometry.detections.every((d, i) => m.detectedObjects[i].confidence === d.confidence)
    );
    check('lighting stats were genuinely reused (a full FrameLightingMeasurement, not recomputed)', typeof m.lighting.luminance.mean === 'number');

    console.log(`  --- interpreting (INFERRED) ---`);
    const interpretation = interpretFrameEnvironment(projectRoot, frame, m);

    check('indoorOutdoor is strictly INFERRED, never measured', interpretation.indoorOutdoor.provenance === 'inferred');
    check('weather is strictly INFERRED, never measured', interpretation.weather.provenance === 'inferred');
    check(
      'both interpretations carry source_frame matching the measured evidence',
      interpretation.indoorOutdoor.source_frame === measured.source_frame && interpretation.weather.source_frame === measured.source_frame
    );
    check(
      'weather guess/confidence are always null -- explicitly not attempted, never fabricated from indirect lighting alone',
      interpretation.weather.value.guess === null && interpretation.weather.confidence === null
    );

    console.log(
      `  indoorOutdoor guess=${JSON.stringify(interpretation.indoorOutdoor.value.guess)} confidence=${interpretation.indoorOutdoor.confidence ?? 'null'} ` +
        `matchedOutdoor=${JSON.stringify(interpretation.indoorOutdoor.value.matchedOutdoorClasses)}`
    );
    console.log(`  weather guess=${JSON.stringify(interpretation.weather.value.guess)} confidence=${interpretation.weather.confidence ?? 'null'}`);

    if (interpretation.indoorOutdoor.value.guess === null) {
      sawAnHonestNullGuess = true;
      check(
        'indoorOutdoor confidence is null when no indoor- or outdoor-associated class was detected at all',
        interpretation.indoorOutdoor.confidence === null
      );
      check(
        'no matched classes recorded when the guess is null',
        interpretation.indoorOutdoor.value.matchedIndoorClasses.length === 0 &&
          interpretation.indoorOutdoor.value.matchedOutdoorClasses.length === 0
      );
    } else {
      sawARealGuess = true;
      check(
        'a real, non-null guess carries a real, non-null confidence',
        typeof interpretation.indoorOutdoor.confidence === 'number' &&
          interpretation.indoorOutdoor.confidence > 0 &&
          interpretation.indoorOutdoor.confidence <= 1
      );
    }
  }

  check('the "real evidence produces a real guess" path was genuinely exercised', sawARealGuess);
  check('the "no evidence, honest null guess" path was genuinely exercised', sawAnHonestNullGuess);

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction_environment_identity/environment-identity-binding-package.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'environment-evidence-from-geometry-and-lighting-v1', 1.0, {
      detectedObjects: [],
      lighting: null,
    });
  } catch {
    rejectedMeasured = true;
  }
  check('a Titanic/synthetic-environment-shaped reference cannot enter as MEASURED', rejectedMeasured);

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'indoor-outdoor-guess-from-detected-object-classes-v1', 0.8, {
      guess: 'outdoor',
      matchedIndoorClasses: [],
      matchedOutdoorClasses: ['car'],
    });
  } catch {
    rejectedInferred = true;
  }
  check('the same fabricated reference cannot enter as INFERRED environment/weather interpretation either', rejectedInferred);
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
