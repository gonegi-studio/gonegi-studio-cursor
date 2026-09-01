import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractSelectedFrames } from '../services/sceneMeasurementEvidenceCore.js';
import { buildSceneTruth, type SceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import { computeCanonicalFrameIdentity, reExtractCanonicalFrame } from '../services/canonicalFrameIdentity.js';
import {
  materializeProductionContract,
  assessCompositionRegionReadiness,
  type ChannelMaterializationResult,
} from '../services/directSpatialConditioningSceneTruthMaterialization.js';

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

function findChannel(channels: readonly ChannelMaterializationResult[], id: string): ChannelMaterializationResult {
  const found = channels.find((c) => c.channel_id === id);
  if (!found) throw new Error(`materialization result missing channel ${id}`);
  return found;
}

function manualNineGridLabel(x: number, y: number): string {
  const col = x < 1 / 3 ? 'left' : x < 2 / 3 ? 'center' : 'right';
  const row = y < 1 / 3 ? 'top' : y < 2 / 3 ? 'middle' : 'bottom';
  if (row === 'middle' && col === 'center') return 'center';
  const rowLabel = row === 'middle' ? 'middle' : row;
  return `${rowLabel}-${col}`;
}

console.log('=== Real GHIBLI canonical frame (with a real detected subject) ===');
const SOURCE_VIDEO = 'imports/source_videos/active/ghibli/GHIBLI_01.mp4';
const identity = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, 1281);
const evidence = reExtractCanonicalFrame(projectRoot, identity, 'storage/composition-region-verify/GHIBLI_01_f1281.jpg');
const sceneTruth = await buildSceneTruth(projectRoot, evidence);

const screenPosition = sceneTruth.camera.measured.value.subjectScreenPosition;
console.log(`  subjectScreenPosition = ${JSON.stringify(screenPosition)}`);
check('a real subject was detected in this frame (subjectScreenPosition non-null)', screenPosition !== null);

const compositionRegion = sceneTruth.camera.interpreted.compositionRegion;
console.log(`  compositionRegion guess=${compositionRegion.value.guess} confidence=${compositionRegion.confidence} provenance=${compositionRegion.provenance}`);
check('compositionRegion is strictly INFERRED, never measured', compositionRegion.provenance === 'inferred');
check('compositionRegion carries source_frame matching the measured evidence it was derived from', compositionRegion.source_frame === sceneTruth.camera.measured.source_frame);

if (screenPosition) {
  const expected = manualNineGridLabel(screenPosition.x, screenPosition.y);
  check(
    `compositionRegion guess (${compositionRegion.value.guess}) matches the documented nine-grid thresholds exactly (expected ${expected})`,
    compositionRegion.value.guess === expected
  );
  check(
    'compositionRegion confidence is a real, non-null, in-range number when a subject was measured',
    typeof compositionRegion.confidence === 'number' && compositionRegion.confidence >= 0 && compositionRegion.confidence <= 1
  );
}

const contractWithSubject = materializeProductionContract(projectRoot, sceneTruth, evidence);
const framingWithSubject = findChannel(contractWithSubject.channels, 'framing_composition_map');
console.log(`  framing_composition_map status=${framingWithSubject.status} fields=${JSON.stringify(framingWithSubject.fields.map((f) => ({ n: f.name, s: f.status, v: f.value })))}`);
check('framing_composition_map is now fully materialized (composition_region no longer no_real_source)', framingWithSubject.status === 'materialized');

const readinessWithSubject = assessCompositionRegionReadiness(contractWithSubject);
console.log(`  ${readinessWithSubject.verdict}: ${readinessWithSubject.reason}`);
check('REAL_COMPOSITION_REGION_READY for the real GHIBLI frame with a detected subject', readinessWithSubject.verdict === 'REAL_COMPOSITION_REGION_READY');

console.log();
console.log('=== Real "no subject detected" case: honest null, never a fabricated default ===');
const REAL_TEST_KIKI_SOURCE_PATH = 'imports/source_videos/archive/test/TEST_KIKI_25S.mp4';
const noSubjectExtraction = extractSelectedFrames(projectRoot, REAL_TEST_KIKI_SOURCE_PATH, [
  { timestampSeconds: '3.000', outputRelativePath: 'storage/scene-measurement-evidence-core-test/frames/frame-003.jpg' },
]);
check('real no-detection frame (TEST_KIKI t=3.000s) extracted', noSubjectExtraction.status === 'extraction-success');

if (noSubjectExtraction.status === 'extraction-success') {
  const noSubjectFrame = noSubjectExtraction.frames[0];
  const noSubjectSceneTruth: SceneTruth = await buildSceneTruth(projectRoot, noSubjectFrame);
  console.log(`  geometry.detections=${noSubjectSceneTruth.geometry.detections.length}`);
  check('this real frame genuinely has zero geometry detections (a real no-subject case, not contrived)', noSubjectSceneTruth.geometry.detections.length === 0);

  const noSubjectRegion = noSubjectSceneTruth.camera.interpreted.compositionRegion;
  console.log(`  compositionRegion guess=${noSubjectRegion.value.guess} confidence=${noSubjectRegion.confidence}`);
  check(
    'compositionRegion.guess is null (not a fabricated default like "center") when no subject was detected',
    noSubjectRegion.value.guess === null
  );
  check('compositionRegion.confidence is null alongside the null guess -- never a fabricated confidence', noSubjectRegion.confidence === null);
  check('compositionRegion is still tagged inferred even when null (provenance never dropped)', noSubjectRegion.provenance === 'inferred');

  const contractNoSubject = materializeProductionContract(projectRoot, noSubjectSceneTruth, noSubjectFrame);
  const framingNoSubject = findChannel(contractNoSubject.channels, 'framing_composition_map');
  const compositionRegionField = framingNoSubject.fields.find((f) => f.name === 'composition_region');
  console.log(`  materialized composition_region: status=${compositionRegionField?.status} value=${compositionRegionField?.value}`);
  check(
    'materialized composition_region is status=materialized with value=null (genuinely attempted, honestly unknown) -- not no_real_source, not a default',
    compositionRegionField?.status === 'materialized' && compositionRegionField.value === null
  );

  const readinessNoSubject = assessCompositionRegionReadiness(contractNoSubject);
  console.log(`  ${readinessNoSubject.verdict}: ${readinessNoSubject.reason}`);
  check(
    'REAL_COMPOSITION_REGION_READY still holds for the no-subject frame (null-ness consistency check passes)',
    readinessNoSubject.verdict === 'REAL_COMPOSITION_REGION_READY'
  );
}

console.log();
console.log('=== Final verdict ===');
console.log(`  ${readinessWithSubject.verdict}: ${readinessWithSubject.reason}`);
check('overall verdict is REAL_COMPOSITION_REGION_READY', readinessWithSubject.verdict === 'REAL_COMPOSITION_REGION_READY');

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
