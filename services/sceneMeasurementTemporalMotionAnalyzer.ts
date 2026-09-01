/**
 * [Temporal -> Production Contract Integration V1]
 *
 * Real, minimal frame-pair motion measurement -- the capability Scene Truth
 * Production Contract Materialization V1 found genuinely absent from this
 * pipeline (camera_temporal_track, scene_energy_field, and
 * subject_position_field.displacement_u/v all reported 'no_real_source'
 * because Scene Truth was built strictly per single frame). This file adds
 * exactly two real measurements between two ALREADY-VERIFIED
 * ExtractedFrameEvidence frames -- no new detector, no new model, reusing
 * geometry detections buildSceneTruth() already computed.
 *
 * ---------------------------------------------------------------------
 * What this deliberately does NOT claim
 * ---------------------------------------------------------------------
 * Mean-absolute-difference (MAD) over grayscale bytes tells you HOW MUCH a
 * frame changed, not WHETHER that was camera motion, subject motion, or
 * both, and not WHICH DIRECTION anything moved. There is no optical-flow or
 * feature-tracking estimator anywhere in this codebase. So:
 *   - motionType is only ever 'static' or 'global-motion-detected' -- never
 *     'pan'/'zoom'/'dolly', which would require actually distinguishing
 *     camera motion from scene content change.
 *   - camera_temporal_track's translation_u/translation_v (a directional
 *     vector) are NOT produced by this file at all -- MAD has no direction.
 *     They remain 'no_real_source' in the materialization layer, honestly.
 *   - Subject "displacement" is only ever measured when the SAME primary
 *     subject (by pickPrimarySubject()'s existing largest-frameRelativeScale
 *     rule, mirroring sceneMeasurementCameraAnalyzer.ts's own local rule
 *     exactly -- not modified there) has an IDENTICAL class label in both
 *     frames. A class mismatch is treated as "no continuous subject", not
 *     as an error -- COCO labels are generic classes, not object identity
 *     (the same caveat already carried throughout this whole effort, e.g.
 *     realOcclusionIntegration.ts's `character_identity: null`).
 *
 * ---------------------------------------------------------------------
 * MEASURED: grayscale byte MAD, deterministic, no threshold
 * ---------------------------------------------------------------------
 * measureFramePairMotion() computes mean/max/stddev absolute difference
 * over the two frames' grayscale byte buffers (reusing
 * sceneMeasurementEvidenceCore.ts's decodeFrameToGrayscaleBytes(), the same
 * decoder every other measurement module in this pipeline already uses) --
 * pure pixel arithmetic, zero interpretation, confidence 1.0. Both frames'
 * own frame_fingerprint are explicitly re-verified against real bytes on
 * disk before any byte is read (fail-closed, matching
 * sceneMeasurementEvidenceCore.ts's own assertFrameEvidenceIsReal()
 * discipline for the earlier of the two frames, which buildMeasuredValue()
 * does not itself check).
 *
 * ---------------------------------------------------------------------
 * INFERRED: motion-type bucket and camera/subject relationship, threshold-gated
 * ---------------------------------------------------------------------
 * interpretFramePairMotion()'s GLOBAL_MOTION_MAD_THRESHOLD and
 * interpretCameraSubjectRelationship()'s SCALE_DELTA_THRESHOLD are the only
 * two judgment-call constants in this file, and both live inside their
 * INFERRED function only -- the same "thresholds only inside INFERRED"
 * discipline sceneMeasurementOcclusionAnalyzer.ts and
 * sceneMeasurementCameraAnalyzer.ts already established.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildMeasuredValue,
  buildInferredValue,
  decodeFrameToGrayscaleBytes,
  measureFrameDimensions,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import type { FrameGeometryMeasurementResult, DetectedObjectGeometry } from './sceneMeasurementGeometryDetector.js';

const FRAME_PAIR_MOTION_METHOD = 'grayscale-byte-mean-absolute-difference-v1' as const;
const SUBJECT_DISPLACEMENT_METHOD = 'primary-subject-position-delta-across-verified-frame-pair-v1' as const;

/**
 * Re-verifies evidenceA's own frame_fingerprint against real bytes on disk.
 * measureFramePairMotion() reads evidenceA's bytes directly (via
 * decodeFrameToGrayscaleBytes, which does not itself hash-check) rather than
 * through buildMeasuredValue() (which only checks the ONE evidence passed to
 * it, here evidenceB) -- so this file must do that check itself for
 * evidenceA, matching the same fail-closed guarantee every other real value
 * in this pipeline carries.
 */
function assertFrameFingerprintMatches(projectRoot: string, evidence: ExtractedFrameEvidence, callerName: string): void {
  const absolutePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${callerName}: fail-closed -- frame file missing at ${evidence.frame_path}`);
  }
  const actual = crypto.createHash('sha256').update(fs.readFileSync(absolutePath)).digest('hex');
  if (actual !== evidence.frame_fingerprint) {
    throw new Error(
      `${callerName}: fail-closed -- frame_fingerprint mismatch for ${evidence.frame_path} (claimed ${evidence.frame_fingerprint}, actual ${actual})`
    );
  }
}

// ============================================================
// MEASURED: grayscale byte mean-absolute-difference
// ============================================================

export interface FramePairMotionMeasurement {
  meanAbsoluteDifference: number;
  maxAbsoluteDifference: number;
  stdDevAbsoluteDifference: number;
  sampleCount: number;
  timestampDeltaSeconds: number;
}

/**
 * Real, deterministic frame-to-frame pixel-difference measurement between
 * two already-verified frames. Requires matching byte-buffer length (same
 * dimensions) -- throws rather than silently cropping/resizing on mismatch.
 */
export function measureFramePairMotion(
  projectRoot: string,
  evidenceA: ExtractedFrameEvidence,
  evidenceB: ExtractedFrameEvidence
): MeasuredValue<FramePairMotionMeasurement> {
  assertFrameFingerprintMatches(projectRoot, evidenceA, 'measureFramePairMotion');

  const bytesA = decodeFrameToGrayscaleBytes(projectRoot, evidenceA.frame_path);
  const bytesB = decodeFrameToGrayscaleBytes(projectRoot, evidenceB.frame_path);
  if (bytesA.length !== bytesB.length) {
    throw new Error(
      `measureFramePairMotion: frame byte-length mismatch (${bytesA.length} vs ${bytesB.length}) -- frames must share dimensions; refusing to compare mismatched frames`
    );
  }

  let sum = 0;
  let max = 0;
  const diffs = new Uint8Array(bytesA.length);
  for (let i = 0; i < bytesA.length; i++) {
    const d = Math.abs(bytesA[i] - bytesB[i]);
    diffs[i] = d;
    sum += d;
    if (d > max) max = d;
  }
  const mean = sum / bytesA.length;
  let squaredDiffSum = 0;
  for (let i = 0; i < diffs.length; i++) {
    const delta = diffs[i] - mean;
    squaredDiffSum += delta * delta;
  }
  const stdDev = Math.sqrt(squaredDiffSum / diffs.length);
  const timestampASeconds = Number(evidenceA.timestamp_seconds);
  const timestampBSeconds = Number(evidenceB.timestamp_seconds);
  if (!Number.isFinite(timestampASeconds) || !Number.isFinite(timestampBSeconds)) {
    throw new Error(
      `measureFramePairMotion: timestamps must be finite numbers (A=${evidenceA.timestamp_seconds}, B=${evidenceB.timestamp_seconds})`
    );
  }
  const timestampDeltaSeconds = timestampBSeconds - timestampASeconds;
  if (!Number.isFinite(timestampDeltaSeconds) || timestampDeltaSeconds <= 0) {
    throw new Error(
      `measureFramePairMotion: timestampDeltaSeconds must be finite and > 0 (got ${timestampDeltaSeconds})`
    );
  }

  // evidenceB is the anchor frame_fingerprint this MeasuredValue is grounded
  // in (buildMeasuredValue re-verifies it); evidenceA was independently
  // re-verified above.
  return buildMeasuredValue(projectRoot, evidenceB, FRAME_PAIR_MOTION_METHOD, 1.0, {
    meanAbsoluteDifference: mean,
    maxAbsoluteDifference: max,
    stdDevAbsoluteDifference: stdDev,
    sampleCount: bytesA.length,
    timestampDeltaSeconds,
  });
}

// ============================================================
// INFERRED: motion-type bucket -- threshold lives here only
// ============================================================

export type MotionTypeGuess = 'static' | 'global-motion-detected';

export interface FramePairMotionInterpretation {
  motionType: InferredValue<{ guess: MotionTypeGuess }>;
}

// Judgment-call boundary over meanAbsoluteDifference (0-255 grayscale byte
// scale) -- lives here, inside the INFERRED interpretation, never inside
// measureFramePairMotion() above.
const GLOBAL_MOTION_MAD_THRESHOLD = 8;

export function interpretFramePairMotion(
  projectRoot: string,
  evidenceB: ExtractedFrameEvidence,
  measured: FramePairMotionMeasurement
): FramePairMotionInterpretation {
  const guess: MotionTypeGuess = measured.meanAbsoluteDifference >= GLOBAL_MOTION_MAD_THRESHOLD ? 'global-motion-detected' : 'static';
  const confidence = Math.min(1, measured.meanAbsoluteDifference / (GLOBAL_MOTION_MAD_THRESHOLD * 2));
  const motionType = buildInferredValue(
    projectRoot,
    evidenceB,
    'motion-type-guess-from-mean-absolute-difference-v1',
    confidence,
    { guess }
  );
  return { motionType };
}

// ============================================================
// MEASURED: primary-subject displacement across a verified frame pair
// ============================================================

export interface SubjectDisplacementMeasurement {
  /** Non-null only when the SAME class was picked as primary subject in
   *  both frames -- a class mismatch (or no detection in either frame) is a
   *  real "no continuous subject" outcome, not an error. */
  subjectClass: string | null;
  displacementU: number | null;
  displacementV: number | null;
  frameRelativeScaleDelta: number | null;
  /** Per-pair confidence (min of the two matched detections' own
   *  confidence) -- distinct from the outer MeasuredValue's own confidence,
   *  which is 1.0 unconditionally: the "is there a continuous subject"
   *  determination is itself deterministic, exactly mirroring
   *  sceneMeasurementOcclusionAnalyzer.ts's own outer/inner confidence split. */
  matchConfidence: number | null;
}

/**
 * Mirrors sceneMeasurementCameraAnalyzer.ts's own (non-exported)
 * pickPrimarySubject() rule exactly -- largest frame-relative scale -- so
 * displacement is measured about the same subject that file's own framing
 * measurements are grounded in. Reimplemented locally rather than exported
 * from that file, to avoid touching it for this addition. Exported here
 * (this file's own rule) so later phases needing the same "primary
 * subject" concept -- e.g. Camera Motion Vector Measurement V1's bbox
 * export for background-motion masking -- reuse this single copy instead
 * of a third reimplementation.
 */
export function pickPrimarySubject(
  detections: readonly MeasuredValue<DetectedObjectGeometry>[]
): MeasuredValue<DetectedObjectGeometry> | null {
  return pickPrimarySubjectWithIndex(detections)?.detection ?? null;
}

export interface IndexedPrimarySubject {
  detection_index: number;
  detection: MeasuredValue<DetectedObjectGeometry>;
}

/** Preserves the exact source-array index selected by the established
 * largest-frameRelativeScale rule. The index is captured during selection;
 * it is never reconstructed later by bbox/class matching. */
export function pickPrimarySubjectWithIndex(
  detections: readonly MeasuredValue<DetectedObjectGeometry>[]
): IndexedPrimarySubject | null {
  if (detections.length === 0) return null;
  let detectionIndex = 0;
  for (let index = 1; index < detections.length; index += 1) {
    if (detections[index].value.frameRelativeScale > detections[detectionIndex].value.frameRelativeScale) {
      detectionIndex = index;
    }
  }
  return { detection_index: detectionIndex, detection: detections[detectionIndex] };
}

export function measureSubjectDisplacement(
  projectRoot: string,
  evidenceA: ExtractedFrameEvidence,
  geometryA: FrameGeometryMeasurementResult,
  evidenceB: ExtractedFrameEvidence,
  geometryB: FrameGeometryMeasurementResult
): MeasuredValue<SubjectDisplacementMeasurement> {
  const subjectA = pickPrimarySubject(geometryA.detections);
  const subjectB = pickPrimarySubject(geometryB.detections);

  if (subjectA === null || subjectB === null || subjectA.value.class !== subjectB.value.class) {
    return buildMeasuredValue(projectRoot, evidenceB, SUBJECT_DISPLACEMENT_METHOD, 1.0, {
      subjectClass: null,
      displacementU: null,
      displacementV: null,
      frameRelativeScaleDelta: null,
      matchConfidence: null,
    });
  }

  const dimsA = measureFrameDimensions(projectRoot, evidenceA);
  const dimsB = measureFrameDimensions(projectRoot, evidenceB);
  const normA = { x: subjectA.value.position2D.x / dimsA.value.width, y: subjectA.value.position2D.y / dimsA.value.height };
  const normB = { x: subjectB.value.position2D.x / dimsB.value.width, y: subjectB.value.position2D.y / dimsB.value.height };
  const matchConfidence =
    subjectA.confidence === null || subjectB.confidence === null ? null : Math.min(subjectA.confidence, subjectB.confidence);

  return buildMeasuredValue(projectRoot, evidenceB, SUBJECT_DISPLACEMENT_METHOD, 1.0, {
    subjectClass: subjectB.value.class,
    displacementU: normB.x - normA.x,
    displacementV: normB.y - normA.y,
    frameRelativeScaleDelta: subjectB.value.frameRelativeScale - subjectA.value.frameRelativeScale,
    matchConfidence,
  });
}

// ============================================================
// INFERRED: camera/subject relationship -- threshold lives here only
// ============================================================

export type CameraSubjectRelationshipGuess = 'approaching' | 'receding' | 'static-relationship' | 'unknown';

export interface FrameCameraSubjectRelationshipInterpretation {
  relationship: InferredValue<{ guess: CameraSubjectRelationshipGuess }>;
}

// Judgment-call boundary over frameRelativeScaleDelta -- lives here only.
const SCALE_DELTA_THRESHOLD = 0.02;

export function interpretCameraSubjectRelationship(
  projectRoot: string,
  evidenceB: ExtractedFrameEvidence,
  displacement: SubjectDisplacementMeasurement
): FrameCameraSubjectRelationshipInterpretation {
  if (displacement.frameRelativeScaleDelta === null) {
    const relationship = buildInferredValue(
      projectRoot,
      evidenceB,
      'camera-subject-relationship-guess-from-scale-delta-v1',
      null,
      { guess: 'unknown' as const }
    );
    return { relationship };
  }
  const delta = displacement.frameRelativeScaleDelta;
  const guess: CameraSubjectRelationshipGuess =
    Math.abs(delta) < SCALE_DELTA_THRESHOLD ? 'static-relationship' : delta > 0 ? 'approaching' : 'receding';
  const confidence = Math.min(1, Math.abs(delta) / (SCALE_DELTA_THRESHOLD * 4));
  const relationship = buildInferredValue(
    projectRoot,
    evidenceB,
    'camera-subject-relationship-guess-from-scale-delta-v1',
    confidence,
    { guess }
  );
  return { relationship };
}

// ============================================================
// MEASURED: relative velocity -- pure derived arithmetic, no new judgment
// ============================================================

/**
 * magnitude(displacement) / timestampDelta -- deterministic once
 * displacement and the real inter-frame time delta are both known. Null
 * only when displacement itself is null (no continuous subject). Invalid
 * temporal input is rejected instead of being disguised as missing motion.
 */
export function computeSubjectRelativeVelocity(
  displacement: SubjectDisplacementMeasurement,
  timestampDeltaSeconds: number
): number | null {
  if (!Number.isFinite(timestampDeltaSeconds) || timestampDeltaSeconds <= 0) {
    throw new Error(
      `computeSubjectRelativeVelocity: timestampDeltaSeconds must be finite and > 0 (got ${timestampDeltaSeconds})`
    );
  }
  if (displacement.displacementU === null || displacement.displacementV === null) return null;
  return Math.hypot(displacement.displacementU, displacement.displacementV) / timestampDeltaSeconds;
}
