import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames, buildMeasuredValue, buildInferredValue } from '../services/sceneMeasurementEvidenceCore.js';
import { measureFrameLighting, interpretFrameLighting } from '../services/sceneMeasurementLightingAnalyzer.js';

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

// Static guard: confirm the lighting analyzer's own source never
// references the pre-existing lighting_dna/styleCore prose concept --
// every value it produces must come from real decoded pixels, not a
// reused description string.
const lightingModuleSource = fs.readFileSync(path.join(projectRoot, 'services', 'sceneMeasurementLightingAnalyzer.ts'), 'utf-8');
check(
  'sceneMeasurementLightingAnalyzer.ts never references lighting_dna as a data source (only in its own doc comments explaining the exclusion)',
  !/lighting_dna\s*[:=.]/.test(lightingModuleSource)
);

// Same real source video as the other scene-measurement verify scripts.
// Note (unchanged, out of scope here): testKikiExtractionSchema.ts's own
// TEST_KIKI_SOURCE_PATH constant is stale; this points at the verified
// real location directly.
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';

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
  console.log('=== Measuring real pixel-based lighting statistics (MEASURED) ===');

  for (const frame of extraction.frames) {
    console.log(`--- frame ${frame.timestamp_seconds}s (fingerprint ${frame.frame_fingerprint.slice(0, 16)}...) ---`);
    const measured = measureFrameLighting(projectRoot, frame);

    check(
      `frame ${frame.timestamp_seconds}s: lighting statistics are strictly MEASURED`,
      measured.provenance === 'measured'
    );
    check(
      `frame ${frame.timestamp_seconds}s: carries source_frame + extraction_method + confidence=1.0 (deterministic pixel arithmetic)`,
      measured.source_frame === frame.frame_fingerprint &&
        measured.extraction_method === 'pixel-lighting-statistics-v1' &&
        measured.confidence === 1.0
    );

    const m = measured.value;
    console.log(
      `  luminance: mean=${m.luminance.mean.toFixed(2)} min=${m.luminance.min} max=${m.luminance.max} stdDev(contrast)=${m.luminance.stdDev.toFixed(2)}`
    );
    console.log(
      `  color: R=${m.color.red.mean.toFixed(2)} G=${m.color.green.mean.toFixed(2)} B=${m.color.blue.mean.toFixed(2)}`
    );
    console.log(
      `  quadrants: TL=${m.quadrantLuminance.topLeft.toFixed(2)} TR=${m.quadrantLuminance.topRight.toFixed(2)} BL=${m.quadrantLuminance.bottomLeft.toFixed(2)} BR=${m.quadrantLuminance.bottomRight.toFixed(2)}`
    );

    check(
      `frame ${frame.timestamp_seconds}s: luminance stats are real and self-consistent (min <= mean <= max, stdDev >= 0)`,
      m.luminance.min <= m.luminance.mean &&
        m.luminance.mean <= m.luminance.max &&
        m.luminance.stdDev >= 0 &&
        m.luminance.sampleCount > 0
    );
    check(
      `frame ${frame.timestamp_seconds}s: color channel stats are real and self-consistent`,
      m.color.red.min <= m.color.red.mean &&
        m.color.red.mean <= m.color.red.max &&
        m.color.green.min <= m.color.green.mean &&
        m.color.green.mean <= m.color.green.max &&
        m.color.blue.min <= m.color.blue.mean &&
        m.color.blue.mean <= m.color.blue.max
    );
    check(
      `frame ${frame.timestamp_seconds}s: quadrant luminance means are real byte-range values`,
      [m.quadrantLuminance.topLeft, m.quadrantLuminance.topRight, m.quadrantLuminance.bottomLeft, m.quadrantLuminance.bottomRight].every(
        (v) => v >= 0 && v <= 255
      )
    );

    console.log();
    console.log(`  --- interpreting (INFERRED) ---`);
    const interpretation = interpretFrameLighting(projectRoot, frame, m);

    for (const [name, iv] of [
      ['lightDirection', interpretation.lightDirection],
      ['lightType', interpretation.lightType],
      ['colorTemperature', interpretation.colorTemperature],
    ] as const) {
      console.log(`  ${name}: guess=${JSON.stringify(iv.value.guess)} confidence=${iv.confidence?.toFixed(3)}`);
      check(`  ${name} is strictly INFERRED, never measured`, iv.provenance === 'inferred');
      check(
        `  ${name} carries source_frame matching the measured statistics it was derived from`,
        iv.source_frame === measured.source_frame
      );
      check(`  ${name} confidence is a real, non-fabricated number in [0,1] (not null -- a signal-strength formula exists)`, typeof iv.confidence === 'number' && iv.confidence >= 0 && iv.confidence <= 1);
    }

    // Recompute the direction confidence formula independently to
    // confirm interpretFrameLighting() actually implements what it
    // documents, not just asserts a plausible-looking number.
    const quadrantValues = [m.quadrantLuminance.topLeft, m.quadrantLuminance.topRight, m.quadrantLuminance.bottomLeft, m.quadrantLuminance.bottomRight];
    const expectedSpread = Math.max(...quadrantValues) - Math.min(...quadrantValues);
    const expectedDirectionConfidence = expectedSpread < 10 ? Math.max(0, expectedSpread / 10) : Math.min(1, expectedSpread / 128);
    check(
      `frame ${frame.timestamp_seconds}s: lightDirection confidence matches the documented quadrant-spread formula exactly`,
      Math.abs((interpretation.lightDirection.confidence ?? -1) - expectedDirectionConfidence) < 1e-9
    );
  }

  console.log();
  console.log('=== Fail-closed re-confirmation (reusing Evidence Core, not re-implemented) ===');
  const fabricatedEvidence = {
    frame_path: 'datasets/movie_reconstruction/titanic-scene-geometry-registry.json',
    frame_fingerprint: crypto.createHash('sha256').update('not-a-real-frame').digest('hex'),
    timestamp_seconds: '0.000',
    source_video_path: 'not-a-real-source-video.mp4',
    source_video_fingerprint: 'not-a-real-video',
  };
  const fakeLighting = {
    luminance: { mean: 128, min: 0, max: 255, sampleCount: 100, stdDev: 40 },
    color: { red: { mean: 128, min: 0, max: 255 }, green: { mean: 128, min: 0, max: 255 }, blue: { mean: 128, min: 0, max: 255 }, sampleCount: 100 },
    quadrantLuminance: { topLeft: 128, topRight: 128, bottomLeft: 128, bottomRight: 128 },
  };

  let rejectedMeasured = false;
  try {
    buildMeasuredValue(projectRoot, fabricatedEvidence, 'pixel-lighting-statistics-v1', 1.0, fakeLighting);
  } catch {
    rejectedMeasured = true;
  }
  check('a fabricated frame reference cannot enter as MEASURED lighting', rejectedMeasured);

  let rejectedInferred = false;
  try {
    buildInferredValue(projectRoot, fabricatedEvidence, 'lighting-direction-guess-from-quadrant-luminance-v1', 0.9, {
      guess: 'front-even',
    });
  } catch {
    rejectedInferred = true;
  }
  check('a fabricated frame reference cannot enter as INFERRED lighting interpretation either', rejectedInferred);
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
