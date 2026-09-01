import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { buildSceneTruth, type SceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';

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

/** Recursively walks a SceneTruth (or any nested object) collecting
 *  every `provenance` field found, to confirm structurally -- not just
 *  by reading the code -- that no 'authored' value is ever produced. */
function collectProvenanceTags(value: unknown, tags: Set<string>, depth = 0): void {
  if (depth > 12 || value === null || typeof value !== 'object') return;
  if ('provenance' in (value as Record<string, unknown>)) {
    const p = (value as Record<string, unknown>).provenance;
    if (typeof p === 'string') tags.add(p);
  }
  for (const v of Object.values(value as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      for (const item of v) collectProvenanceTags(item, tags, depth + 1);
    } else {
      collectProvenanceTags(v, tags, depth + 1);
    }
  }
}

// Same real source video as the other scene-measurement verify scripts.
// Note (unchanged, out of scope here): testKikiExtractionSchema.ts's own
// TEST_KIKI_SOURCE_PATH constant is stale; this points at the verified
// real location directly.
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';

// t=3.000s: real pose, zero geometry detections (the geometry/pose
// disagreement this system already documented). t=18.500s: two real
// (misclassified) 'surfboard' detections with confirmed real bbox
// overlap -- the richest single frame available for exercising
// occlusion + object-pair spatial relationships + the 'outdoor'
// environment guess together.
const liveTargets = [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
  { timestampSeconds: '18.500', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-018.jpg' },
];

console.log('=== Extracting real Kiki frames (reusing Evidence Core) ===');
const extraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, liveTargets);

if (extraction.status !== 'extraction-success') {
  failures += 1;
  console.log(`FAIL: frame extraction did not succeed -- status=${extraction.status}, error=${extraction.error}`);
} else {
  const frame3 = extraction.frames.find((f) => f.timestamp_seconds === '3.000')!;
  const frame18 = extraction.frames.find((f) => f.timestamp_seconds === '18.500')!;

  console.log();
  console.log('=== Building full Scene Truth for frame 18.500s (richest real frame) ===');
  const truth18 = await buildSceneTruth(projectRoot, frame18);

  check('frame_fingerprint matches the real extracted frame', truth18.frame_fingerprint === frame18.frame_fingerprint);
  check(
    'source_video_fingerprint is preserved in the integrated Scene Truth (Scene Truth Integrity Repair V1)',
    truth18.source_video_fingerprint === frame18.source_video_fingerprint && truth18.source_video_fingerprint.length === 64
  );

  console.log(`  geometry.detections: ${truth18.geometry.detections.length} (${truth18.geometry.detections.map((d) => d.value.class).join(', ')})`);
  check('geometry component: real MEASURED detections present, not synthesized', truth18.geometry.detections.length === 2 && truth18.geometry.detections.every((d) => d.provenance === 'measured'));

  console.log(`  pose.poses: ${truth18.pose.poses.length}`);
  check('pose component: ranToCompletion true regardless of how many poses were found', truth18.pose.ranToCompletion === true);

  check('depth component: strictly INFERRED, confidence null (MiDaS has no confidence signal)', truth18.depth.provenance === 'inferred' && truth18.depth.confidence === null);
  console.log(`  depth: ${truth18.depth.value.width}x${truth18.depth.value.height}, min=${truth18.depth.value.min.toFixed(1)} max=${truth18.depth.value.max.toFixed(1)}`);

  check('gaze component: ranToCompletion true regardless of outcome', truth18.gaze.ranToCompletion === true);

  check('lighting component: measured + interpreted both present with correct provenance', truth18.lighting.measured.provenance === 'measured' && truth18.lighting.interpreted.lightDirection.provenance === 'inferred');

  check('camera component: measured + interpreted both present with correct provenance', truth18.camera.measured.provenance === 'measured' && truth18.camera.interpreted.cameraFov.provenance === 'inferred' && truth18.camera.interpreted.cameraFov.value.guess === null);
  check(
    'camera framingType lives in the INFERRED interpretation, not the MEASURED evidence (Scene Truth Integrity Repair V1)',
    !('framingType' in truth18.camera.measured.value) && truth18.camera.interpreted.framingType.provenance === 'inferred'
  );

  console.log(
    `  environment.indoorOutdoor: guess=${JSON.stringify(truth18.environment.interpreted.indoorOutdoor.value.guess)} matchedOutdoor=${JSON.stringify(truth18.environment.interpreted.indoorOutdoor.value.matchedOutdoorClasses)}`
  );
  check(
    'environment component: the real surfboard misclassification propagates into the outdoor guess UNCORRECTED (no auto-correction across modules)',
    truth18.environment.interpreted.indoorOutdoor.value.guess === 'outdoor' &&
      truth18.environment.interpreted.indoorOutdoor.value.matchedOutdoorClasses.includes('surfboard')
  );
  check('environment weather guess is unconditionally null', truth18.environment.interpreted.weather.value.guess === null);

  console.log(`  occlusion.measured.pairs: ${truth18.occlusion.measured.value.pairs.length}`);
  check(
    'occlusion component: real MEASURED bbox-overlap pair(s) present between the two real detections (renamed off "occlusion" -- Scene Truth Integrity Repair V1)',
    truth18.occlusion.measured.value.pairs.length === 1 && truth18.occlusion.measured.provenance === 'measured'
  );
  if (truth18.occlusion.measured.value.pairs.length === 1) {
    const pair = truth18.occlusion.measured.value.pairs[0];
    console.log(`    ${pair.objectAClass} <-> ${pair.objectBClass}: iou=${pair.iou.toFixed(4)} overlapRatioOfSmaller=${pair.overlapRatioOfSmaller.toFixed(4)}`);
    check('bbox overlap IoU is a real, finite, in-range number', Number.isFinite(pair.iou) && pair.iou >= 0 && pair.iou <= 1);
  }

  console.log(`  occlusion.interpreted.pairs: ${truth18.occlusion.interpreted.pairs.length}`);
  check(
    'occlusion-likelihood interpretation is strictly INFERRED and explicitly not real mask evidence (Scene Truth Integrity Repair V1)',
    truth18.occlusion.interpreted.pairs.length === truth18.occlusion.measured.value.pairs.length &&
      truth18.occlusion.interpreted.pairs.every(
        (p) => p.provenance === 'inferred' && p.extraction_method.includes('not-real-mask-evidence')
      )
  );

  console.log(`  objectPairSpatialRelationships: ${truth18.objectPairSpatialRelationships.length}`);
  check(
    'spatial relationship count matches bbox-overlap pair count (same object pairs, both reused from the same geometry detections)',
    truth18.objectPairSpatialRelationships.length === truth18.occlusion.measured.value.pairs.length
  );
  if (truth18.objectPairSpatialRelationships.length === 1) {
    const rel = truth18.objectPairSpatialRelationships[0];
    console.log(`    pixelDistance=${rel.relationship.value.pixelDistance.toFixed(2)} depthSeparation.closerPoint=${rel.depthSeparation.value.closerPoint}`);
    check('object-pair relationship is MEASURED, depth separation is INFERRED with null confidence', rel.relationship.provenance === 'measured' && rel.depthSeparation.provenance === 'inferred' && rel.depthSeparation.confidence === null);
  }

  check('absoluteSpatialEstimate is unconditionally null -- no calibration exists', truth18.absoluteSpatialEstimate.value.distanceMeters === null && truth18.absoluteSpatialEstimate.value.sizeMeters === null);

  console.log();
  console.log('=== Building full Scene Truth for frame 3.000s (geometry/pose disagreement case) ===');
  const truth3 = await buildSceneTruth(projectRoot, frame3);
  console.log(`  geometry.detections: ${truth3.geometry.detections.length}, pose.poses: ${truth3.pose.poses.length}`);
  check(
    'the real geometry(0)/pose(1) disagreement at this exact timestamp is preserved uncorrected in the integrated Scene Truth',
    truth3.geometry.detections.length === 0 && truth3.pose.poses.length === 1
  );
  check('occlusion pairs are empty when fewer than 2 objects are detected -- a real outcome, not an error', truth3.occlusion.measured.value.pairs.length === 0 && truth3.occlusion.interpreted.pairs.length === 0);
  check('objectPairSpatialRelationships is empty for the same reason', truth3.objectPairSpatialRelationships.length === 0);
  check(
    'environment guess is honestly null at this timestamp -- no indoor/outdoor evidence exists here',
    truth3.environment.interpreted.indoorOutdoor.value.guess === null
  );

  console.log();
  console.log('=== Structural provenance audit: no AUTHORED value anywhere ===');
  const tags18 = new Set<string>();
  const tags3 = new Set<string>();
  collectProvenanceTags(truth18 as unknown, tags18);
  collectProvenanceTags(truth3 as unknown, tags3);
  console.log(`  frame 18.500s provenance tags found: ${[...tags18].join(', ')}`);
  console.log(`  frame 3.000s provenance tags found: ${[...tags3].join(', ')}`);
  check('both real provenance tags (measured, inferred) appear -- this is a real, mixed pipeline, not one-note', tags18.has('measured') && tags18.has('inferred'));
  check('no "authored" tag appears anywhere in either Scene Truth', !tags18.has('authored') && !tags3.has('authored'));

  console.log();
  console.log('=== Fail-closed re-confirmation at the integration level (not re-implemented, inherited from every sub-module) ===');
  let rejectedAtIntegrationLevel = false;
  try {
    await buildSceneTruth(projectRoot, {
      frame_path: 'datasets/movie_reconstruction/titanic-scene-geometry-registry.json',
      frame_fingerprint: 'not-a-real-fingerprint-'.padEnd(64, '0'),
      timestamp_seconds: '0.000',
      source_video_path: 'not-a-real-source-video.mp4',
      source_video_fingerprint: 'not-a-real-video',
    });
  } catch {
    rejectedAtIntegrationLevel = true;
  }
  check(
    'buildSceneTruth() itself refuses a Titanic-registry-shaped fabricated frame reference -- inherited fail-closed, not re-implemented here',
    rejectedAtIntegrationLevel
  );
}

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
