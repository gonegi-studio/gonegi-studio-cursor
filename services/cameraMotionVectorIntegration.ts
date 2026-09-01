/**
 * [Camera Motion Vector Measurement V1]
 *
 * Loads and re-verifies the real global frame-translation evidence
 * scripts/measure-camera-motion-vector-v1.py produced (via
 * skimage.registration.phase_cross_correlation -- see that script's own
 * header for the candidate investigation and validation that preceded
 * selecting it). This file computes ZERO new measurement -- it reuses the
 * evidence verbatim, fail-closed re-verifies it against real bytes on disk,
 * and adds exactly one INFERRED interpretation layer on top.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs INFERRED, kept structurally distinct
 * ---------------------------------------------------------------------
 * translation_u/translation_v (a real pixel-shift vector from a validated
 * registration algorithm) are MEASURED, reused verbatim, provenance intact.
 * Whether that vector actually represents CAMERA motion (as opposed to,
 * say, a genuinely static background that happens to have zero shift, or
 * some other real-world cause) is a judgment call -- interpretCameraMotionVector()
 * below is the only place that judgment is made, with its threshold
 * constant living inside it only, matching every other INFERRED
 * interpretation across this whole effort (sceneMeasurementOcclusionAnalyzer.ts,
 * sceneMeasurementTemporalMotionAnalyzer.ts, etc.).
 *
 * ---------------------------------------------------------------------
 * Subject motion vs. camera motion: verified separate, not just trusted
 * ---------------------------------------------------------------------
 * The Python script excludes each pair's detected subject bbox(es) from the
 * registration via reference_mask/moving_mask whenever a subject exists,
 * and self-reports background_masking_applied. This file does not simply
 * trust that self-report: assessCameraMotionVectorReadiness() below
 * independently cross-checks it against canonical-frame-subject-bbox-v1.json
 * (was a subject actually detected for this pair? if so, was masking
 * actually applied?) and fails closed if they ever disagree.
 *
 * ---------------------------------------------------------------------
 * Verdict: REAL_CAMERA_MOTION_VECTOR_READY / REAL_GAP
 * ---------------------------------------------------------------------
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CAMERA_MOTION_VECTOR_EVIDENCE_PATH =
  'datasets/movie_analysis/numerical_cinematography/occlusion_evidence/camera-motion-vector-evidence-v1.json';
export const CANONICAL_FRAME_SUBJECT_BBOX_PATH =
  'datasets/movie_analysis/numerical_cinematography/occlusion_evidence/canonical-frame-subject-bbox-v1.json';
const CANONICAL_FRAME_CACHE_DIR =
  'datasets/movie_analysis/numerical_cinematography/occlusion_evidence/canonical_frame_cache';

export interface CameraMotionVectorMeasured {
  translation_u_normalized: number;
  translation_v_normalized: number;
  shift_row_px: number;
  shift_col_px: number;
  error: number | null;
  provenance_class: string;
}

export interface BBoxPx {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraMotionVectorPair {
  frame_index_a: number;
  frame_index_b: number;
  source_sha256_a: string;
  source_sha256_b: string;
  timestamp_delta_seconds: number;
  background_masking_applied: boolean;
  excluded_subject_bboxes_px: readonly BBoxPx[] | null;
  measured: CameraMotionVectorMeasured;
  unmasked_reference_only: { note: string; shift_row_px: number; shift_col_px: number; error: number | null };
}

export interface CameraMotionVectorEvidenceFile {
  evidence_id: string;
  source_video_id: string;
  pairs: readonly CameraMotionVectorPair[];
}

export interface CanonicalFrameSubjectBboxFile {
  source_video_id: string;
  frames: readonly { frame_index: number; frame_fingerprint: string; subject: { class: string; bbox_px: BBoxPx; confidence: number | null } | null }[];
}

function sha256File(absolutePath: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
}

export function loadCameraMotionVectorEvidence(projectRoot: string): CameraMotionVectorEvidenceFile {
  const absolutePath = path.resolve(projectRoot, CAMERA_MOTION_VECTOR_EVIDENCE_PATH);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`loadCameraMotionVectorEvidence: no evidence file at ${CAMERA_MOTION_VECTOR_EVIDENCE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as CameraMotionVectorEvidenceFile;
}

function loadCanonicalFrameSubjectBbox(projectRoot: string): CanonicalFrameSubjectBboxFile {
  const absolutePath = path.resolve(projectRoot, CANONICAL_FRAME_SUBJECT_BBOX_PATH);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`loadCanonicalFrameSubjectBbox: no bbox file at ${CANONICAL_FRAME_SUBJECT_BBOX_PATH}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as CanonicalFrameSubjectBboxFile;
}

export interface CameraMotionVectorBindingVerification {
  valid: boolean;
  reason?: string;
}

/**
 * Fail-closed re-verification against real bytes on disk right now: both
 * frames referenced by a pair must still hash to what the evidence file
 * claims. Frame paths are derived from the established
 * GHIBLI_01_f{index}_canonical.jpg naming convention (scripts/extract-canonical-kiki-frames-v1.ts)
 * rather than trusted from the evidence file itself.
 */
export function verifyCameraMotionVectorPairBinding(
  projectRoot: string,
  pair: CameraMotionVectorPair
): CameraMotionVectorBindingVerification {
  for (const [frameIndex, claimedHash] of [
    [pair.frame_index_a, pair.source_sha256_a],
    [pair.frame_index_b, pair.source_sha256_b],
  ] as const) {
    const framePath = path.resolve(projectRoot, CANONICAL_FRAME_CACHE_DIR, `GHIBLI_01_f${frameIndex}_canonical.jpg`);
    if (!fs.existsSync(framePath)) {
      return { valid: false, reason: `canonical frame missing for frame_index=${frameIndex}` };
    }
    const actual = sha256File(framePath);
    if (actual !== claimedHash) {
      return {
        valid: false,
        reason: `sha256 mismatch for frame_index=${frameIndex} (claimed ${claimedHash}, actual ${actual})`,
      };
    }
  }
  return { valid: true };
}

export function getCameraMotionVectorForPair(
  projectRoot: string,
  frameIndexA: number,
  frameIndexB: number
): CameraMotionVectorPair | null {
  const file = loadCameraMotionVectorEvidence(projectRoot);
  const pair = file.pairs.find((p) => p.frame_index_a === frameIndexA && p.frame_index_b === frameIndexB);
  if (!pair) return null;
  const binding = verifyCameraMotionVectorPairBinding(projectRoot, pair);
  if (!binding.valid) {
    throw new Error(`getCameraMotionVectorForPair: fail-closed binding verification failed for ${frameIndexA}->${frameIndexB}: ${binding.reason}`);
  }
  return pair;
}

// ============================================================
// INFERRED: is this plausibly camera motion? -- threshold lives here only
// ============================================================

export type CameraMotionGuess = 'likely-static' | 'likely-camera-motion';

export interface CameraMotionInterpretation {
  guess: CameraMotionGuess;
  confidence: number | null;
  provenance: 'inferred';
}

// Judgment-call boundary over the measured shift magnitude (pixels) --
// lives here only, never inside the MEASURED evidence above.
const CAMERA_MOTION_MAGNITUDE_THRESHOLD_PX = 1.0;

export function interpretCameraMotionVector(pair: CameraMotionVectorPair): CameraMotionInterpretation {
  const magnitudePx = Math.hypot(pair.measured.shift_row_px, pair.measured.shift_col_px);
  const guess: CameraMotionGuess = magnitudePx >= CAMERA_MOTION_MAGNITUDE_THRESHOLD_PX ? 'likely-camera-motion' : 'likely-static';
  // error is null whenever background masking was applied (skimage's own
  // masked-registration limitation, not something this file can improve on)
  // -- confidence stays null rather than fabricating one from nothing.
  const confidence = pair.measured.error === null ? null : Math.max(0, Math.min(1, 1 - pair.measured.error));
  return { guess, confidence, provenance: 'inferred' };
}

// ============================================================
// Verdict: REAL_CAMERA_MOTION_VECTOR_READY / REAL_GAP
// ============================================================

export interface CameraMotionVectorReadiness {
  verdict: 'REAL_CAMERA_MOTION_VECTOR_READY' | 'REAL_GAP';
  reason: string;
}

export function assessCameraMotionVectorReadiness(projectRoot: string): CameraMotionVectorReadiness {
  let evidenceFile: CameraMotionVectorEvidenceFile;
  try {
    evidenceFile = loadCameraMotionVectorEvidence(projectRoot);
  } catch (err) {
    return { verdict: 'REAL_GAP', reason: `camera motion vector evidence unavailable: ${String(err)}` };
  }

  let subjectBboxFile: CanonicalFrameSubjectBboxFile;
  try {
    subjectBboxFile = loadCanonicalFrameSubjectBbox(projectRoot);
  } catch (err) {
    return { verdict: 'REAL_GAP', reason: `canonical frame subject-bbox file unavailable: ${String(err)}` };
  }

  if (evidenceFile.pairs.length === 0) {
    return { verdict: 'REAL_GAP', reason: 'evidence file has zero pairs' };
  }

  for (const pair of evidenceFile.pairs) {
    const binding = verifyCameraMotionVectorPairBinding(projectRoot, pair);
    if (!binding.valid) {
      return {
        verdict: 'REAL_GAP',
        reason: `pair ${pair.frame_index_a}->${pair.frame_index_b} failed fail-closed binding verification: ${binding.reason}`,
      };
    }

    // Independent structural cross-check: if either frame in this pair
    // really had a detected subject, masking MUST have been applied --
    // never trust the evidence file's own self-report alone.
    const subjectA = subjectBboxFile.frames.find((f) => f.frame_index === pair.frame_index_a)?.subject ?? null;
    const subjectB = subjectBboxFile.frames.find((f) => f.frame_index === pair.frame_index_b)?.subject ?? null;
    const shouldHaveMasked = subjectA !== null || subjectB !== null;
    if (shouldHaveMasked && !pair.background_masking_applied) {
      return {
        verdict: 'REAL_GAP',
        reason: `pair ${pair.frame_index_a}->${pair.frame_index_b} has a detected subject but background_masking_applied is false -- subject motion may have contaminated the camera-motion measurement`,
      };
    }
    if (pair.background_masking_applied && pair.measured.error !== null) {
      return {
        verdict: 'REAL_GAP',
        reason: `pair ${pair.frame_index_a}->${pair.frame_index_b} has background_masking_applied=true but a non-null error -- expected null per skimage's masked-registration limitation; this is unexpected and untrusted`,
      };
    }
  }

  return {
    verdict: 'REAL_CAMERA_MOTION_VECTOR_READY',
    reason: `${evidenceFile.pairs.length} real consecutive frame pair(s) produced a validated, background-separated MEASURED translation vector; every pair's binding re-verified against real bytes on disk; masking correctly applied whenever a subject was actually detected.`,
  };
}
