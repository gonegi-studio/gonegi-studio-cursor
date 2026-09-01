import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  integrateRealOcclusionEvidence,
  integrateRealOcclusionEvidenceForFrame,
  verifyRealOcclusionFrameBinding,
  REAL_OCCLUSION_EVIDENCE_PATH,
  type RealOcclusionEvidenceFrame,
} from '../services/realOcclusionIntegration.js';

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

console.log('=== Structural separation from Scene Truth bbox-overlap ===');
const serviceSource = fs.readFileSync(path.join(projectRoot, 'services/realOcclusionIntegration.ts'), 'utf8');
// Only real `import ... from '...'` statements count -- the file's own doc
// comment legitimately names these sibling files in prose while explaining
// the separation, so a bare substring match would false-positive on that.
const importLines = serviceSource
  .split('\n')
  .filter((line) => /^\s*import\b.*\bfrom\s+['"]/.test(line));
check(
  'realOcclusionIntegration.ts imports nothing from sceneMeasurementOcclusionAnalyzer.ts (no code path to the bbox-overlap proxy)',
  !importLines.some((line) => line.includes('sceneMeasurementOcclusionAnalyzer'))
);
check(
  'realOcclusionIntegration.ts imports nothing from sceneMeasurementSceneTruthIntegrator.ts (never merged into Scene Truth)',
  !importLines.some((line) => line.includes('sceneMeasurementSceneTruthIntegrator'))
);

console.log();
console.log('=== E2E integration on real Kiki frames (GHIBLI_01 f1280, f1281) ===');
const report = integrateRealOcclusionEvidence(projectRoot);
console.log(`  evidence_source_path: ${report.evidence_source_path}`);
console.log(`  verdict: ${report.verdict}`);
console.log(`  reason: ${report.reason}`);
console.log(`  nonzero_intersection_pair_count: ${report.nonzero_intersection_pair_count}`);

check('evidence file resolved to the expected on-disk Kiki occlusion evidence path', report.evidence_source_path === REAL_OCCLUSION_EVIDENCE_PATH);
check('at least the two real Kiki frames (1280, 1281) were attempted', report.frame_results.length >= 2);
check(
  'every attempted frame integrated (source-frame fingerprint binding verified against real bytes on disk)',
  report.frame_results.every((r) => r.status === 'integrated')
);

const frame1280 = report.frame_results.find((r) => r.frame_index === 1280);
const frame1281 = report.frame_results.find((r) => r.frame_index === 1281);
check('frame 1280 integrated with real measured pairs', frame1280?.status === 'integrated' && (frame1280.measured_pairs?.length ?? 0) > 0);
check('frame 1281 integrated with real measured pairs', frame1281?.status === 'integrated' && (frame1281.measured_pairs?.length ?? 0) > 0);

const allMeasuredPairs = report.frame_results.flatMap((r) => r.measured_pairs ?? []);
check('at least one real nonzero mask-intersection pair was measured across the Kiki frames', allMeasuredPairs.some((p) => p.intersection_pixels > 0));
check(
  'every measured pair is genuinely tagged MEASURED (reused verbatim, not re-derived here)',
  allMeasuredPairs.every((p) => p.provenance_class === 'MEASURED')
);
check(
  'front/back is null for every pair -- no instance-level depth evidence exists, and this module never invents one',
  allMeasuredPairs.every((p) => p.front_back === null && typeof p.front_back_null_reason === 'string' && p.front_back_null_reason.length > 0)
);

check('overall verdict is REAL_OCCLUSION_INTEGRATED for the real Kiki evidence', report.verdict === 'REAL_OCCLUSION_INTEGRATED');

console.log();
console.log('=== No bbox fallback when real mask evidence is absent for a frame ===');
const missingFrame = integrateRealOcclusionEvidenceForFrame(projectRoot, 999999);
check(
  'a frame_index with no recorded Mask-RCNN evidence returns an explicit no-real-evidence status',
  missingFrame.status === 'no-real-evidence'
);
check('the no-real-evidence result carries no measured_pairs at all (nothing substituted from bbox-overlap)', missingFrame.measured_pairs === undefined);

console.log();
console.log('=== Fail-closed binding re-verification rejects tampered/fabricated evidence ===');
const realFile = report.frame_results[0];
const fabricatedFrame: RealOcclusionEvidenceFrame = {
  frame_index: 1280,
  source_png_relpath: 'datasets/movie_analysis/numerical_cinematography/anchor_frame_cache/GHIBLI_01_f1280.png',
  source_sha256: 'not-a-real-hash-'.padEnd(64, '0'),
  width_px: 1,
  height_px: 1,
  inference_status: 'detections_retained',
  retained_detection_count: 0,
  detections: [],
  pairwise_mask_overlaps: [],
  miss_or_mismatch_evidence: [],
};
const tampered = verifyRealOcclusionFrameBinding(projectRoot, fabricatedFrame);
check('a frame claiming a fabricated source_sha256 is rejected (fail-closed, not accepted on trust)', !tampered.valid);
console.log(`    rejection reason: ${tampered.reason}`);
void realFile;

const orphanPairFrame: RealOcclusionEvidenceFrame = {
  frame_index: 1280,
  source_png_relpath: 'datasets/movie_analysis/numerical_cinematography/anchor_frame_cache/GHIBLI_01_f1280.png',
  source_sha256: '',
  width_px: 1,
  height_px: 1,
  inference_status: 'detections_retained',
  retained_detection_count: 0,
  detections: [],
  pairwise_mask_overlaps: [
    {
      instance_a: 'does_not_exist_a',
      instance_b: 'does_not_exist_b',
      intersection_pixels: 0,
      iou: 0,
      overlap_fraction_a: 0,
      overlap_fraction_b: 0,
      occlusion_2d_fraction_of_smaller_mask: 0,
      measurement_confidence: 1,
      provenance_class: 'MEASURED',
      front_back: null,
      front_back_provenance_class: 'INFERRED',
      front_back_confidence: null,
      front_back_null_reason: 'no instance-level depth evidence',
    },
  ],
  miss_or_mismatch_evidence: [],
};
const orphanCheck = verifyRealOcclusionFrameBinding(projectRoot, orphanPairFrame);
check('a pairwise_mask_overlaps entry referencing a detection_id absent from detections[] is rejected', !orphanCheck.valid);

console.log();
console.log(failures === 0 ? 'PASS' : 'FAIL');
process.exit(failures === 0 ? 0 : 1);
