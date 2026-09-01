import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSceneTruth } from '../services/sceneMeasurementSceneTruthIntegrator.js';
import { computeCanonicalFrameIdentity, reExtractCanonicalFrame } from '../services/canonicalFrameIdentity.js';
import {
  materializeProductionContract,
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
const FRAME_INDEX = 1280;

console.log('=== Real GHIBLI canonical frame E2E (same frame Canonical Frame Identity V1 bound) ===');
const identity = computeCanonicalFrameIdentity(projectRoot, SOURCE_VIDEO, FRAME_INDEX);
const evidence = reExtractCanonicalFrame(
  projectRoot,
  identity,
  `storage/dsc-scene-truth-materialization-verify/GHIBLI_01_f${FRAME_INDEX}.jpg`
);
console.log(`  canonical frame_fingerprint=${evidence.frame_fingerprint}`);

const sceneTruth = await buildSceneTruth(projectRoot, evidence);
check('buildSceneTruth() succeeds on the real canonical GHIBLI frame', sceneTruth.frame_fingerprint === evidence.frame_fingerprint);

const contract = materializeProductionContract(projectRoot, sceneTruth, evidence);
check('materialized contract carries exactly 8 channels', contract.channels.length === 8);

console.log();
console.log('=== Honest gaps: channels with genuinely no source in Scene Truth ===');
for (const id of ['camera_pose_field', 'camera_temporal_track', 'edit_rhythm_boundaries', 'scene_energy_field']) {
  const channel = findChannel(contract.channels, id);
  console.log(`  ${id}: status=${channel.status}`);
  check(`${id} is honestly reported as no_real_source (never a fabricated default)`, channel.status === 'no_real_source');
  check(
    `${id}: every field has no 'value' key at all (nothing masquerading as real data)`,
    channel.fields.every((f) => f.status === 'no_real_source' && !('value' in f) && typeof f.reason === 'string' && f.reason.length > 0)
  );
}

console.log();
console.log('=== Partial channels: real fields materialized, unavailable ones honestly gapped ===');
const subjectPosition = findChannel(contract.channels, 'subject_position_field');
console.log(`  subject_position_field: status=${subjectPosition.status} fields=${JSON.stringify(subjectPosition.fields.map((f) => ({ n: f.name, s: f.status })))}`);
check('subject_position_field is partial (center_u/v real, displacement_u/v not)', subjectPosition.status === 'partial');
check(
  'subject_position_field.center_u/center_v are materialized with real provenance',
  subjectPosition.fields.find((f) => f.name === 'center_u')?.status === 'materialized' &&
    subjectPosition.fields.find((f) => f.name === 'center_v')?.status === 'materialized' &&
    subjectPosition.fields.find((f) => f.name === 'center_u')?.provenance === 'measured'
);
check(
  'subject_position_field.displacement_u/displacement_v are honestly no_real_source (temporal, single-frame pipeline)',
  subjectPosition.fields.find((f) => f.name === 'displacement_u')?.status === 'no_real_source' &&
    subjectPosition.fields.find((f) => f.name === 'displacement_v')?.status === 'no_real_source'
);

const framingComposition = findChannel(contract.channels, 'framing_composition_map');
console.log(`  framing_composition_map: status=${framingComposition.status} fields=${JSON.stringify(framingComposition.fields.map((f) => ({ n: f.name, s: f.status, v: f.value })))}`);
// Composition Region Measurement V1 closed the composition_region gap this
// check originally asserted -- framing_composition_map is now fully
// materialized, not merely partial. Updated here to match that real,
// later improvement (see directSpatialConditioningSceneTruthMaterialization.ts's
// own header for the full history).
check('framing_composition_map is now fully materialized (Composition Region Measurement V1)', framingComposition.status === 'materialized');
check(
  'framing_composition_map.shot_scale is materialized from real camera.interpreted.framingType',
  framingComposition.fields.find((f) => f.name === 'shot_scale')?.status === 'materialized'
);
check(
  'framing_composition_map.composition_region is materialized from real, reused Geometry/Camera evidence (Composition Region Measurement V1)',
  framingComposition.fields.find((f) => f.name === 'composition_region')?.status === 'materialized'
);

console.log();
console.log('=== Fully-sourceable channels (DSC Scene Truth Compatibility V1) ===');
const lighting = findChannel(contract.channels, 'lighting_condition_field');
const environment = findChannel(contract.channels, 'environment_condition_field');
console.log(`  lighting_condition_field: status=${lighting.status}`);
console.log(`  environment_condition_field: status=${environment.status}`);
check('lighting_condition_field is fully materialized', lighting.status === 'materialized');
check('environment_condition_field is fully materialized', environment.status === 'materialized');
check(
  'environment_condition_field.weather_guess is materialized-but-null (honestly unknown, not no_real_source -- Scene Truth DID attempt this)',
  environment.fields.find((f) => f.name === 'weather_guess')?.status === 'materialized' &&
    environment.fields.find((f) => f.name === 'weather_guess')?.value === null
);

console.log();
console.log('=== Real Occlusion evidence: separate section, genuinely connected ===');
console.log(`  real_occlusion.status=${contract.real_occlusion.status} matched_via=${contract.real_occlusion.matched_via}`);
check(
  'real_occlusion is genuinely integrated for this real GHIBLI canonical frame (Canonical Frame Identity V1 binding reused)',
  contract.real_occlusion.status === 'integrated' && contract.real_occlusion.matched_via === 'canonical-identity'
);
check('real_occlusion carries real nonzero-or-real measured pairs, not fabricated', (contract.real_occlusion.measured_pairs?.length ?? 0) > 0);
check(
  'real_occlusion is not present inside any channel (kept structurally separate)',
  contract.channels.every((c) => !JSON.stringify(c).includes('intersection_pixels'))
);

console.log();
console.log('=== Character/Style swap boundary ===');
check(
  'exactly character and style are swappable in the materialized contract',
  contract.swap_boundary.filter((e) => e.lock === 'swappable').map((e) => e.domain).sort().join(',') === 'character,style'
);

console.log();
console.log('=== Final verdict ===');
const readiness = assessProductionContractMaterialization(contract);
console.log(`  ${readiness.verdict}: ${readiness.reason}`);
check(
  'honest verdict is REAL_GAP -- camera_pose_field/camera_temporal_track/edit_rhythm_boundaries/scene_energy_field still have zero real source and subject_position_field is still partial, so this cannot claim PRODUCTION_CONTRACT_MATERIALIZED without fabricating data',
  readiness.verdict === 'REAL_GAP'
);
check('the REAL_GAP reason names the actual incomplete channels, not a vague failure', readiness.reason.includes('camera_pose_field'));

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
