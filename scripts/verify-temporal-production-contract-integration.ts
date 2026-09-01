import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSceneTruth, type SceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import { computeCanonicalFrameIdentity, reExtractCanonicalFrame } from '../services/canonicalFrameIdentity.js';
import type { ExtractedFrameEvidence } from '../services/sceneMeasurementEvidenceCore.js';
import {
  computeSubjectRelativeVelocity,
  measureFramePairMotion,
} from '../services/sceneMeasurementTemporalMotionAnalyzer.js';
import {
  materializeProductionContract,
  assessTemporalContractIntegration,
  assessProductionContractMaterialization,
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

const SOURCE_VIDEO = 'imports/source_videos/active/ghibli/GHIBLI_01.mp4';
const FRAME_INDICES = [1280, 1281, 1282] as const;

console.log('=== Real GHIBLI canonical frames 1280-1282: live extraction + Scene Truth ===');
const frames: { frameIndex: number; evidence: ExtractedFrameEvidence; sceneTruth: SceneTruth }[] = [];
for (const frameIndex of FRAME_INDICES) {
  const identity = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, frameIndex);
  const evidence = reExtractCanonicalFrame(
    projectRoot,
    identity,
    `storage/temporal-production-contract-verify/GHIBLI_01_f${frameIndex}.jpg`
  );
  const sceneTruth = await buildSceneTruth(projectRoot, evidence);
  console.log(`  frame_index=${frameIndex}: frame_fingerprint=${evidence.frame_fingerprint} geometry.detections=${sceneTruth.geometry.detections.length}`);
  frames.push({ frameIndex, evidence, sceneTruth });
}
check('all three real GHIBLI frames (1280, 1281, 1282) extracted and Scene-Truth-built', frames.length === 3);

console.log();
console.log('=== Fail-closed timestamp delta guard ===');
let nonFiniteRejected = false;
try {
  measureFramePairMotion(projectRoot, frames[0].evidence, { ...frames[1].evidence, timestamp_seconds: 'NaN' });
} catch (error) {
  nonFiniteRejected = String(error).includes('timestamps must be finite numbers');
}
check('non-finite timestamp input is rejected fail-closed', nonFiniteRejected);

let nonPositiveRejected = false;
try {
  measureFramePairMotion(projectRoot, frames[1].evidence, frames[0].evidence);
} catch (error) {
  nonPositiveRejected = String(error).includes('timestampDeltaSeconds must be finite and > 0');
}
check('zero/negative timestampDeltaSeconds is rejected fail-closed', nonPositiveRejected);

let velocityNonFiniteRejected = false;
try {
  computeSubjectRelativeVelocity({ subjectClass: null, displacementU: null, displacementV: null, frameRelativeScaleDelta: null, matchConfidence: null }, Number.POSITIVE_INFINITY);
} catch (error) {
  velocityNonFiniteRejected = String(error).includes('timestampDeltaSeconds must be finite and > 0');
}
check('relative-velocity derivation also rejects invalid timestampDeltaSeconds fail-closed', velocityNonFiniteRejected);

console.log();
console.log('=== Regression: single-frame materialization (no temporal neighbor) unchanged ===');
const singleFrameContract = materializeProductionContract(projectRoot, frames[0].sceneTruth, frames[0].evidence);
const singleCameraTemporal = findChannel(singleFrameContract.channels, 'camera_temporal_track');
check(
  'without a temporal neighbor, camera_temporal_track is still fully no_real_source (Scene Truth Production Contract Materialization V1 behavior preserved)',
  singleCameraTemporal.status === 'no_real_source'
);

let integratedVerdict: ReturnType<typeof assessTemporalContractIntegration> | null = null;

for (let i = 0; i < frames.length - 1; i++) {
  const current = frames[i];
  const next = frames[i + 1];
  console.log();
  console.log(`=== Temporal pair: frame_index ${current.frameIndex} -> ${next.frameIndex} ===`);

  const contract = materializeProductionContract(projectRoot, current.sceneTruth, current.evidence, {
    evidence: next.evidence,
    sceneTruth: next.sceneTruth,
  });

  const cameraTemporal = findChannel(contract.channels, 'camera_temporal_track');
  const sceneEnergy = findChannel(contract.channels, 'scene_energy_field');
  const subjectPosition = findChannel(contract.channels, 'subject_position_field');
  const editRhythm = findChannel(contract.channels, 'edit_rhythm_boundaries');
  const cameraPose = findChannel(contract.channels, 'camera_pose_field');

  console.log(`  camera_temporal_track: status=${cameraTemporal.status} ${JSON.stringify(cameraTemporal.fields.map((f) => ({ n: f.name, s: f.status, v: f.value })))}`);
  console.log(`  scene_energy_field: status=${sceneEnergy.status} ${JSON.stringify(sceneEnergy.fields.map((f) => ({ n: f.name, s: f.status, v: f.value })))}`);
  console.log(`  subject_position_field: status=${subjectPosition.status} ${JSON.stringify(subjectPosition.fields.map((f) => ({ n: f.name, s: f.status, v: f.value })))}`);

  check(
    `${current.frameIndex}->${next.frameIndex}: camera_temporal_track.motion_type/magnitude materialized from real MAD`,
    cameraTemporal.fields.find((f) => f.name === 'motion_type')?.status === 'materialized' &&
      cameraTemporal.fields.find((f) => f.name === 'magnitude')?.status === 'materialized' &&
      cameraTemporal.fields.find((f) => f.name === 'magnitude')?.provenance === 'measured'
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: camera_temporal_track.translation_u/v honestly remain no_real_source (MAD has no direction)`,
    cameraTemporal.fields.find((f) => f.name === 'translation_u')?.status === 'no_real_source' &&
      cameraTemporal.fields.find((f) => f.name === 'translation_v')?.status === 'no_real_source'
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: scene_energy_field.motion_magnitude/camera_subject_relationship materialized`,
    sceneEnergy.fields.find((f) => f.name === 'motion_magnitude')?.status === 'materialized' &&
      sceneEnergy.fields.find((f) => f.name === 'camera_subject_relationship')?.status === 'materialized'
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: motion_magnitude values agree across channels (same real MAD, reused not recomputed)`,
    cameraTemporal.fields.find((f) => f.name === 'magnitude')?.value === sceneEnergy.fields.find((f) => f.name === 'motion_magnitude')?.value
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: edit_rhythm_boundaries still exactly no_real_source (explicitly required to stay unsourced)`,
    editRhythm.status === 'no_real_source' && editRhythm.fields.every((f) => f.status === 'no_real_source')
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: camera_pose_field still exactly no_real_source (out of scope for this phase)`,
    cameraPose.status === 'no_real_source'
  );

  const displacementU = subjectPosition.fields.find((f) => f.name === 'displacement_u');
  const relativeVelocity = sceneEnergy.fields.find((f) => f.name === 'relative_velocity');
  if (displacementU?.status === 'materialized') {
    console.log(`  continuous matched subject found -- displacement_u=${displacementU.value}, relative_velocity=${relativeVelocity?.value}`);
    check(
      `${current.frameIndex}->${next.frameIndex}: relative_velocity materializes alongside displacement (both real, both measured)`,
      relativeVelocity?.status === 'materialized' && relativeVelocity.provenance === 'measured'
    );
  } else {
    console.log(`  no continuous matched subject across this pair -- displacement/relative_velocity honestly no_real_source`);
    check(
      `${current.frameIndex}->${next.frameIndex}: relative_velocity is also honestly no_real_source when there is no continuous subject`,
      relativeVelocity?.status === 'no_real_source'
    );
  }

  check(
    // Fields named "*_provenance" ARE the provenance tag itself (by design,
    // see directSpatialConditioningSceneTruthCompatibility.ts's
    // provenance_component: null convention) -- they carry no separate
    // provenance pointer of their own, so they're excluded here.
    `${current.frameIndex}->${next.frameIndex}: no synthetic/fallback -- every materialized field (other than the provenance tags themselves) carries a non-null provenance tag`,
    contract.channels.every((c) =>
      c.fields.every((f) => f.status !== 'materialized' || f.name.endsWith('_provenance') || f.provenance !== null)
    )
  );
  check(
    `${current.frameIndex}->${next.frameIndex}: no synthetic/fallback -- every no_real_source field carries no 'value' key and a real reason`,
    contract.channels.every((c) => c.fields.every((f) => f.status !== 'no_real_source' || (!('value' in f) && !!f.reason)))
  );

  const readiness = assessTemporalContractIntegration(contract);
  console.log(`  temporal verdict: ${readiness.verdict}: ${readiness.reason}`);
  check(`${current.frameIndex}->${next.frameIndex}: temporal integration verdict is TEMPORAL_CONTRACT_INTEGRATED`, readiness.verdict === 'TEMPORAL_CONTRACT_INTEGRATED');
  if (i === 0) integratedVerdict = readiness;

  const overall = assessProductionContractMaterialization(contract);
  console.log(`  overall production-contract verdict (unchanged expectation): ${overall.verdict}`);
  check(
    // composition_region was later closed by Composition Region Measurement
    // V1 -- camera_pose_field/edit_rhythm_boundaries (and translation_u/v
    // without a camera-motion-vector pair) are what still keep this REAL_GAP.
    `${current.frameIndex}->${next.frameIndex}: overall PRODUCTION_CONTRACT_MATERIALIZED verdict is still honestly REAL_GAP (camera_pose_field/edit_rhythm_boundaries remain unsourced)`,
    overall.verdict === 'REAL_GAP'
  );
}

console.log();
console.log('=== Final verdict (Temporal -> Production Contract Integration V1) ===');
check('at least one real temporal pair achieved TEMPORAL_CONTRACT_INTEGRATED', integratedVerdict?.verdict === 'TEMPORAL_CONTRACT_INTEGRATED');
console.log(`  ${integratedVerdict?.verdict}: ${integratedVerdict?.reason}`);

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
