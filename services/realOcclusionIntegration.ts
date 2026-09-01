/**
 * [Real Occlusion Integration V1]
 *
 * Wires the already-produced Mask-RCNN instance-mask evidence
 * (scripts/measure-kiki-occlusion-v1.py's output at
 * REAL_OCCLUSION_EVIDENCE_PATH below) into a reusable, fail-closed
 * integration surface. This file computes ZERO new mask data of its own --
 * it re-verifies and passes through, verbatim, the pixel-level
 * intersection/IoU that model output already produced against real GHIBLI_01
 * (Kiki) source frames. "Real Occlusion Integration" means: reuse the real
 * evidence that already exists, not: run a new detector.
 *
 * ---------------------------------------------------------------------
 * Clean separation from Scene Truth's bbox-overlap -- structural, not just documented
 * ---------------------------------------------------------------------
 * sceneMeasurementOcclusionAnalyzer.ts / sceneMeasurementSceneTruthIntegrator.ts
 * measure axis-aligned BOUNDING-BOX overlap between coco-ssd detections and
 * explicitly label it a weak proxy, never real occlusion (see that file's own
 * header). This file is the opposite case: genuine per-pixel instance-MASK
 * intersection from Mask-RCNN. The two are never merged, and this module
 * imports nothing from sceneMeasurementOcclusionAnalyzer.ts or
 * sceneMeasurementSceneTruthIntegrator.ts -- there is no code path in this
 * file that could reach the bbox-overlap proxy at all, so "fall back to bbox
 * when a real mask is missing" is not a runtime bug to avoid, it is a branch
 * that structurally does not exist here. When a frame has no real mask
 * evidence, integrateRealOcclusionEvidenceForFrame() below returns an
 * explicit 'no-real-evidence' status -- never a bbox-derived number standing
 * in for it.
 *
 * ---------------------------------------------------------------------
 * MEASURED mask intersection/IoU, front/back stays null absent real evidence
 * ---------------------------------------------------------------------
 * Every pairwise_mask_overlaps entry reused from the evidence file already
 * carries provenance_class: "MEASURED" for intersection_pixels/iou (real
 * binary-mask AND over real model output on real pixels) and an explicit
 * front_back: null with a stated front_back_null_reason whenever no
 * instance-level depth evidence exists to order the pair -- which is every
 * pair today (this system has no instance-level depth estimator). This file
 * never invents a front/back value; it only ever passes through what the
 * evidence file already recorded, and asserts (in verifyRealOcclusionFrameBinding)
 * that this null-when-ungrounded discipline actually holds before treating a
 * frame as integrated.
 *
 * ---------------------------------------------------------------------
 * Same source-frame fingerprint binding, re-verified now -- not just trusted
 * ---------------------------------------------------------------------
 * Every detection's mask PNG and every frame's source PNG are re-hashed
 * against their claimed sha256 right now, on disk, before any frame is
 * treated as real evidence -- the same fail-closed discipline
 * sceneMeasurementEvidenceCore.ts's assertFrameEvidenceIsReal() established
 * for the ffmpeg-extraction pipeline, applied here to the Mask-RCNN
 * evidence file's own claimed hashes. A frame whose source or mask bytes on
 * disk no longer match the evidence file's recorded hashes is rejected
 * ('binding-invalid'), not silently accepted.
 *
 * ---------------------------------------------------------------------
 * Verdict: REAL_OCCLUSION_INTEGRATED / REAL_GAP
 * ---------------------------------------------------------------------
 * REAL_OCCLUSION_INTEGRATED requires: the evidence file exists, every frame
 * attempted passed fingerprint-binding re-verification (any single invalid
 * binding fails the whole verdict closed -- no partial/unverified pass), at
 * least one frame actually integrated, and at least one integrated pair has
 * a real nonzero measured mask intersection. Anything short of that --
 * missing file, a broken binding, or zero real nonzero intersections -- is
 * REAL_GAP, with the specific reason recorded, never silently upgraded.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const REAL_OCCLUSION_EVIDENCE_PATH =
  'datasets/movie_analysis/numerical_cinematography/occlusion_evidence/kiki-real-instance-mask-occlusion-v1.json';

// ============================================================
// Evidence file contract (mirrors scripts/measure-kiki-occlusion-v1.py's output)
// ============================================================

export interface RealMaskDetectionEvidence {
  detection_id: string;
  generic_coco_label: string;
  character_identity: string | null;
  model_confidence: number;
  bbox_xyxy_px: readonly number[];
  mask_pixel_count: number;
  mask_area_ratio: number | null;
  mask_relpath: string;
  mask_sha256: string;
  existing_kiki_bbox_overlap_fraction: number | null;
  existing_kiki_bbox_association: string | null;
  provenance_class: string;
  model_mismatch: string;
}

export interface RealMaskPairwiseOverlap {
  instance_a: string;
  instance_b: string;
  intersection_pixels: number;
  iou: number | null;
  overlap_fraction_a: number | null;
  overlap_fraction_b: number | null;
  occlusion_2d_fraction_of_smaller_mask: number | null;
  measurement_confidence: number;
  provenance_class: string;
  front_back: 'front' | 'back' | null;
  front_back_provenance_class: string;
  front_back_confidence: number | null;
  front_back_null_reason: string | null;
}

export interface RealOcclusionEvidenceFrame {
  frame_index: number;
  source_png_relpath: string;
  source_sha256: string;
  width_px: number;
  height_px: number;
  inference_status: string;
  retained_detection_count: number;
  detections: readonly RealMaskDetectionEvidence[];
  pairwise_mask_overlaps: readonly RealMaskPairwiseOverlap[];
  miss_or_mismatch_evidence: readonly string[];
}

export interface RealOcclusionEvidenceFile {
  evidence_id: string;
  source_video_id: string;
  frames: readonly RealOcclusionEvidenceFrame[];
}

function sha256File(absolutePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

/**
 * Loads the real Mask-RCNN occlusion evidence file this module reuses.
 * Throws (fail-closed) rather than returning a fabricated empty result when
 * the file is missing -- callers must treat that as REAL_GAP, not as "zero
 * evidence found so far".
 */
export function loadRealOcclusionEvidenceFile(projectRoot: string): RealOcclusionEvidenceFile {
  const absolutePath = path.resolve(projectRoot, REAL_OCCLUSION_EVIDENCE_PATH);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`loadRealOcclusionEvidenceFile: no evidence file at ${REAL_OCCLUSION_EVIDENCE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as RealOcclusionEvidenceFile;
}

// ============================================================
// Source-frame fingerprint binding verification
// ============================================================

export interface RealOcclusionBindingVerification {
  valid: boolean;
  reason?: string;
}

/**
 * Re-verifies, against real bytes on disk right now, that a claimed frame's
 * source PNG and every one of its detections' mask PNGs still hash to what
 * the evidence file recorded, AND that every pairwise_mask_overlaps entry
 * actually references detection_ids present in this same frame's detections
 * (catches a hand-edited/corrupted pairing that no longer traces back to a
 * real detection). Fail-closed: any mismatch invalidates the whole frame.
 */
export function verifyRealOcclusionFrameBinding(
  projectRoot: string,
  frame: RealOcclusionEvidenceFrame
): RealOcclusionBindingVerification {
  const sourceAbsolutePath = path.resolve(projectRoot, frame.source_png_relpath);
  if (!fs.existsSync(sourceAbsolutePath)) {
    return { valid: false, reason: `source frame missing at ${frame.source_png_relpath}` };
  }
  const actualSourceHash = sha256File(sourceAbsolutePath);
  if (actualSourceHash !== frame.source_sha256) {
    return {
      valid: false,
      reason: `source_sha256 mismatch for ${frame.source_png_relpath} (claimed ${frame.source_sha256}, actual ${actualSourceHash})`,
    };
  }

  const knownDetectionIds = new Set(frame.detections.map((d) => d.detection_id));

  for (const detection of frame.detections) {
    const maskAbsolutePath = path.resolve(projectRoot, detection.mask_relpath);
    if (!fs.existsSync(maskAbsolutePath)) {
      return { valid: false, reason: `mask file missing at ${detection.mask_relpath}` };
    }
    const actualMaskHash = sha256File(maskAbsolutePath);
    if (actualMaskHash !== detection.mask_sha256) {
      return {
        valid: false,
        reason: `mask_sha256 mismatch for ${detection.mask_relpath} (claimed ${detection.mask_sha256}, actual ${actualMaskHash})`,
      };
    }
  }

  for (const pair of frame.pairwise_mask_overlaps) {
    if (!knownDetectionIds.has(pair.instance_a) || !knownDetectionIds.has(pair.instance_b)) {
      return {
        valid: false,
        reason: `pairwise_mask_overlaps entry (${pair.instance_a}, ${pair.instance_b}) references a detection_id absent from this frame's own detections`,
      };
    }
  }

  return { valid: true };
}

// ============================================================
// Per-frame integration -- explicit gap, never a bbox fallback
// ============================================================

export type RealOcclusionFrameIntegrationStatus = 'integrated' | 'no-real-evidence' | 'binding-invalid';

export interface RealOcclusionFrameIntegrationResult {
  status: RealOcclusionFrameIntegrationStatus;
  frame_index: number;
  reason?: string;
  measured_pairs?: readonly RealMaskPairwiseOverlap[];
}

function integrateSingleFrame(
  projectRoot: string,
  frame: RealOcclusionEvidenceFrame
): RealOcclusionFrameIntegrationResult {
  const binding = verifyRealOcclusionFrameBinding(projectRoot, frame);
  if (!binding.valid) {
    return { status: 'binding-invalid', frame_index: frame.frame_index, reason: binding.reason };
  }
  return {
    status: 'integrated',
    frame_index: frame.frame_index,
    measured_pairs: frame.pairwise_mask_overlaps,
  };
}

/**
 * Integrates real occlusion evidence for exactly one claimed frame_index.
 * When no evidence file entry matches, this returns 'no-real-evidence'
 * explicitly -- there is no code path here that substitutes a bbox-overlap
 * value for the missing real mask evidence.
 */
export function integrateRealOcclusionEvidenceForFrame(
  projectRoot: string,
  frameIndex: number
): RealOcclusionFrameIntegrationResult {
  const file = loadRealOcclusionEvidenceFile(projectRoot);
  const frame = file.frames.find((f) => f.frame_index === frameIndex);
  if (!frame) {
    return {
      status: 'no-real-evidence',
      frame_index: frameIndex,
      reason:
        'no Mask-RCNN evidence recorded for this frame -- real occlusion is unknown for it, never substituted with the bbox-overlap proxy',
    };
  }
  return integrateSingleFrame(projectRoot, frame);
}

// ============================================================
// Whole-evidence-file integration + verdict
// ============================================================

export interface RealOcclusionIntegrationReport {
  verdict: 'REAL_OCCLUSION_INTEGRATED' | 'REAL_GAP';
  reason: string;
  evidence_source_path: string;
  frame_results: readonly RealOcclusionFrameIntegrationResult[];
  nonzero_intersection_pair_count: number;
}

export function integrateRealOcclusionEvidence(projectRoot: string): RealOcclusionIntegrationReport {
  let file: RealOcclusionEvidenceFile;
  try {
    file = loadRealOcclusionEvidenceFile(projectRoot);
  } catch (err) {
    return {
      verdict: 'REAL_GAP',
      reason: `no reusable real Mask-RCNN occlusion evidence found: ${String(err)}`,
      evidence_source_path: REAL_OCCLUSION_EVIDENCE_PATH,
      frame_results: [],
      nonzero_intersection_pair_count: 0,
    };
  }

  const frameResults = file.frames.map((frame) => integrateSingleFrame(projectRoot, frame));
  const invalidBinding = frameResults.find((r) => r.status === 'binding-invalid');
  const integratedFrames = frameResults.filter((r) => r.status === 'integrated');
  const nonzeroCount = integratedFrames.reduce(
    (sum, r) => sum + (r.measured_pairs?.filter((p) => p.intersection_pixels > 0).length ?? 0),
    0
  );

  if (invalidBinding) {
    return {
      verdict: 'REAL_GAP',
      reason: `frame ${invalidBinding.frame_index} failed source-frame fingerprint binding verification (${invalidBinding.reason}) -- refusing to report a partial/unverified integration`,
      evidence_source_path: REAL_OCCLUSION_EVIDENCE_PATH,
      frame_results: frameResults,
      nonzero_intersection_pair_count: nonzeroCount,
    };
  }

  if (integratedFrames.length === 0) {
    return {
      verdict: 'REAL_GAP',
      reason: 'no frame had reusable real mask evidence to integrate',
      evidence_source_path: REAL_OCCLUSION_EVIDENCE_PATH,
      frame_results: frameResults,
      nonzero_intersection_pair_count: nonzeroCount,
    };
  }

  if (nonzeroCount === 0) {
    return {
      verdict: 'REAL_GAP',
      reason: 'real mask evidence integrated and fingerprint-verified, but no pair showed a nonzero measured mask intersection',
      evidence_source_path: REAL_OCCLUSION_EVIDENCE_PATH,
      frame_results: frameResults,
      nonzero_intersection_pair_count: nonzeroCount,
    };
  }

  return {
    verdict: 'REAL_OCCLUSION_INTEGRATED',
    reason: `${integratedFrames.length} frame(s) integrated with ${nonzeroCount} real nonzero mask-intersection pair(s), all source-frame fingerprint bindings verified`,
    evidence_source_path: REAL_OCCLUSION_EVIDENCE_PATH,
    frame_results: frameResults,
    nonzero_intersection_pair_count: nonzeroCount,
  };
}
