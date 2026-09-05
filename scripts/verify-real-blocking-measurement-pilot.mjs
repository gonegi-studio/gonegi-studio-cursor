import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const measurementPath = 'datasets/movie_analysis/coordinate_extraction/real_blocking_measurements/ghibli_01_v1_cc004_pair_exchange_blocking.json';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const fail = (message) => { console.error(`FAIL: ${message}`); process.exit(1); };
const measurement = readJson(measurementPath);
const pilot = readJson('datasets/movie_analysis/coordinate_extraction/real_bbox_measurements/ghibli_01_v1_multi_frame_pilot.json');
const plan = readJson('datasets/movie_analysis/coordinate_extraction/plans/coordinate_extraction_ghibli_01_v1.json');
const evidence = measurement.provenance?.persisted_evidence_file;
if (measurement.measurement_status !== 'REAL' || measurement.estimated_only !== false || measurement.synthetic !== false) fail('measurement must be explicitly real and non-synthetic');
if (!evidence || !fs.existsSync(path.join(root, evidence))) fail('persisted evidence file is missing');
const evidenceSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, evidence))).digest('hex');
if (evidenceSha !== measurement.provenance.persisted_evidence_sha256) fail('evidence SHA-256 mismatch');
const sourceMeasurement = pilot.measurements.find((entry) => entry.frame_extraction?.requested_timestamp_ms === 53320);
if (!sourceMeasurement || sourceMeasurement.frame_extraction.persisted_evidence_file !== evidence) fail('measurement does not reuse PHASE-689 evidence');
for (const id of ['coordinate_extraction_ghibli_01_v1_cc_004', 'coordinate_extraction_ghibli_01_v1_cc_005', 'coordinate_extraction_ghibli_01_v1_cc_006']) {
  const candidate = plan.coordinate_candidates.find((entry) => entry.candidate_id === id);
  if (!candidate || candidate.measurement_status !== 'REAL' || candidate.source_timestamp_ms !== 53320) fail(`invalid source-plan provenance for ${id}`);
}
const frame = measurement.blocking_map_compatibility_projection?.frames?.[0];
if (!frame || frame.frame_index !== 1280 || frame.character_regions?.length !== 2 || frame.interaction_pairs?.length !== 1) fail('blocking_map projection is incomplete');
for (const region of frame.character_regions) {
  if (!region.character_id || !Array.isArray(region.screen_position) || region.screen_position.length !== 2 || !region.screen_position.every((value) => Number.isFinite(value) && value >= 0 && value <= 1) || !['foreground', 'midground', 'background'].includes(region.depth_layer) || !['LEFT', 'CENTER', 'RIGHT'].includes(region.region_label)) fail(`invalid region: ${region.character_id ?? 'unknown'}`);
}
if (measurement.compatibility_boundary?.backend_wiring_performed !== false || measurement.compatibility_boundary?.legacy_blocking_dna_modified !== false || measurement.compatibility_boundary?.full_numerical_dna_modified !== false) fail('pilot scope boundary violated');
console.log('PASS_REAL_BLOCKING_MEASUREMENT_PILOT_V1');
console.log(`evidence_sha256=${evidenceSha}`);
console.log(`blocking_regions=${frame.character_regions.length} interaction_pairs=${frame.interaction_pairs.length}`);
