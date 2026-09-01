import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeCanonicalFrameIdentity, reExtractCanonicalFrame } from '../services/canonicalFrameIdentity.js';
import { measureTemporalScene } from '../services/temporalSceneMeasurementFoundation.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const video = 'imports/source_videos/active/ghibli/GHIBLI_01.mp4';
const indices = [1280, 1281, 1282] as const;
let failures = 0;
const check = (label: string, ok: boolean) => { console.log(`${ok ? 'PASS' : 'FAIL'}: ${label}`); if (!ok) failures++; };

const identities = indices.map((i) => computeCanonicalFrameIdentity(root, video, i));
const frames = identities.map((identity) => reExtractCanonicalFrame(root, identity, `storage/temporal-scene-measurement-v1/GHIBLI_01_f${identity.frame_index}.jpg`));
const result = await measureTemporalScene(root, video, identities[0].fps, indices, frames);

check('same real source-video fingerprint is preserved across the consecutive canonical sequence', new Set(frames.map((f) => f.source_video_fingerprint)).size === 1);
check('canonical sequence is exactly consecutive (1280, 1281, 1282)', result.frame_indices.every((v, i) => i === 0 || v === result.frame_indices[i - 1] + 1));
check('two real frame-to-frame intervals were measured', result.pairs.length === 2);
for (const pair of result.pairs) {
  check(`${pair.from_frame_index}->${pair.to_frame_index}: scene motion energy is finite MEASURED evidence`, pair.scene_motion_energy.provenance === 'MEASURED' && Number.isFinite(pair.scene_motion_energy.value.mean_absolute_luma_difference) && pair.scene_motion_energy.value.changed_pixel_ratio >= 0 && pair.scene_motion_energy.value.changed_pixel_ratio <= 1);
  check(`${pair.from_frame_index}->${pair.to_frame_index}: camera temporal translation is finite MEASURED evidence`, pair.camera_motion_evidence.provenance === 'MEASURED' && Number.isFinite(pair.camera_motion_evidence.value.magnitude_pixels));
  check(`${pair.from_frame_index}->${pair.to_frame_index}: every object association is INFERRED and displacement arithmetic is MEASURED`, pair.object_displacements.every((d) => d.association.provenance === 'INFERRED' && d.displacement.provenance === 'MEASURED' && Number.isFinite(d.displacement.value.magnitude_pixels)));
  check(`${pair.from_frame_index}->${pair.to_frame_index}: shot/edit boundary remains null without a validated temporal boundary classifier`, pair.shot_edit_boundary === null);
  console.log(`  energy MAD=${pair.scene_motion_energy.value.mean_absolute_luma_difference.toFixed(4)}, changed=${pair.scene_motion_energy.value.changed_pixel_ratio.toFixed(4)}, camera=(${pair.camera_motion_evidence.value.dx_pixels},${pair.camera_motion_evidence.value.dy_pixels}), tracked=${pair.object_displacements.length}`);
  for (const displacement of pair.object_displacements) {
    console.log(`  ${displacement.class}: dx=${displacement.displacement.value.dx_pixels.toFixed(3)}, dy=${displacement.displacement.value.dy_pixels.toFixed(3)}, magnitude=${displacement.displacement.value.magnitude_pixels.toFixed(3)}px`);
  }
}
check('at least one real detected object displacement was produced', result.pairs.some((pair) => pair.object_displacements.length > 0));
check('no AUTHORED provenance exists in temporal output', !JSON.stringify(result).includes('AUTHORED'));
check('final verdict is TEMPORAL_MEASUREMENT_READY', result.verdict === 'TEMPORAL_MEASUREMENT_READY');
console.log(`VERDICT: ${result.verdict} -- ${result.reason}`);
process.exit(failures === 0 ? 0 : 1);
