/**
 * [Edit Boundary Measurement V1]
 *
 * Real shot-cut / edit-boundary detection between consecutive canonical
 * frames -- the capability every prior materialization phase honestly
 * declared absent from this pipeline ("No shot/cut-boundary detector
 * exists anywhere in this pipeline -- Scene Truth has no whole-timeline
 * analysis, only per-frame measurement."). This file computes ZERO new
 * pixel decoding of its own: it reuses two already-measured, already-real
 * signals verbatim.
 *
 * ---------------------------------------------------------------------
 * Shot-cut detector candidate investigation (documented, not just declared)
 * ---------------------------------------------------------------------
 *   - PySceneDetect (`scenedetect`) -- NOT SELECTED: not installed in this
 *     environment (confirmed via `python -c "import scenedetect"` before
 *     writing this file), would add a new dependency for something already
 *     achievable from evidence this pipeline already measures.
 *   - OpenCV (`cv2`) histogram/frame-difference detection -- NOT SELECTED:
 *     opencv-python not installed (confirmed the same way; this is the same
 *     constraint that has blocked cv2 in every earlier phase of this
 *     effort).
 *   - Deep-learning shot-boundary models (e.g. TransNetV2) -- NOT SELECTED:
 *     needs model weights and heavy inference, categorically out of scope
 *     (same reasoning that blocked re-running Mask-RCNN in Canonical Frame
 *     Identity V1).
 *   - Reusing sceneMeasurementTemporalMotionAnalyzer.ts's already-measured
 *     grayscale mean-absolute-difference (MAD) PLUS a new, deterministic
 *     Euclidean distance between the two frames' already-measured RGB
 *     channel means (sceneMeasurementLightingAnalyzer.ts's
 *     ColorChannelStatistics) -- SELECTED. This is a real, simplified form
 *     of exactly the "content-aware" technique real shot-detection tools
 *     use (frame-to-frame visual difference against a threshold); it adds
 *     zero new dependencies and zero new pixel decoding, reusing two
 *     signals this pipeline already trusts and has already validated.
 *     Two independent signals (luminance-based MAD, color-mean shift) are
 *     combined rather than relying on either alone, since a real cut can
 *     show up more strongly in one than the other.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs. INFERRED
 * ---------------------------------------------------------------------
 * measureFramePairCutEvidence(): meanAbsoluteDifference is reused verbatim
 * (not recomputed) from the caller's own FramePairMotionMeasurement;
 * colorMeanShift is a new, deterministic, threshold-free arithmetic
 * distance between two already-measured RGB mean vectors. Confidence 1.0,
 * same convention as every MEASURED value in this pipeline.
 *
 * interpretFramePairCut(): buckets that evidence into 'cut-boundary' vs.
 * 'continuous' against two threshold constants that live here ONLY, never
 * inside the MEASURED function -- the same "thresholds only inside
 * INFERRED" discipline every prior analyzer in this effort has followed.
 * This is a confident two-way bucket (like motionType's
 * 'static'/'global-motion-detected'), never null -- real evidence always
 * exists to judge from, so there is always a defensible (if imperfect)
 * verdict to report, exactly as motionType already established.
 *
 * ---------------------------------------------------------------------
 * "Threshold not met -> boundary null, never forced" -- what this actually means
 * ---------------------------------------------------------------------
 * A single pair's cut/continuous classification is never null (see above).
 * What IS null/absent when the threshold isn't cleared is the ENTRY in the
 * aggregate cut_timestamp_ms/shot_duration_ms sequence: buildEditBoundarySequence()
 * below adds a cut timestamp ONLY for pairs classified 'cut-boundary' --
 * a 'continuous' pair contributes nothing, never a fabricated/forced
 * boundary entry. shot_duration_ms is computed only between two REAL
 * detected cuts; with zero or one cut detected, it is genuinely empty, not
 * an invented duration.
 */

import {
  buildMeasuredValue,
  buildInferredValue,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import type { FramePairMotionMeasurement } from './sceneMeasurementTemporalMotionAnalyzer.js';
import type { ColorChannelStatistics } from './sceneMeasurementLightingAnalyzer.js';

const CUT_EVIDENCE_METHOD = 'cut-evidence-from-reused-mad-and-color-mean-shift-v1' as const;

// ============================================================
// MEASURED: reused MAD + a new, threshold-free color-mean-shift distance
// ============================================================

export interface FramePairCutEvidence {
  /** Reused verbatim from the caller's own FramePairMotionMeasurement --
   *  never recomputed. */
  meanAbsoluteDifference: number;
  /** Euclidean distance between frame A's and frame B's already-measured
   *  (R,G,B) mean-channel vectors -- real, deterministic, no threshold. */
  colorMeanShift: number;
  timestampDeltaSeconds: number;
}

export function measureFramePairCutEvidence(
  projectRoot: string,
  evidenceB: ExtractedFrameEvidence,
  pairMotion: FramePairMotionMeasurement,
  colorA: ColorChannelStatistics,
  colorB: ColorChannelStatistics
): MeasuredValue<FramePairCutEvidence> {
  const colorMeanShift = Math.sqrt(
    (colorA.red.mean - colorB.red.mean) ** 2 +
      (colorA.green.mean - colorB.green.mean) ** 2 +
      (colorA.blue.mean - colorB.blue.mean) ** 2
  );
  return buildMeasuredValue(projectRoot, evidenceB, CUT_EVIDENCE_METHOD, 1.0, {
    meanAbsoluteDifference: pairMotion.meanAbsoluteDifference,
    colorMeanShift,
    timestampDeltaSeconds: pairMotion.timestampDeltaSeconds,
  });
}

// ============================================================
// INFERRED: cut-boundary bucket -- thresholds live here only
// ============================================================

export type CutBoundaryGuess = 'cut-boundary' | 'continuous';

export interface FramePairCutInterpretation {
  guess: CutBoundaryGuess;
}

// Judgment-call thresholds, deliberately well above
// sceneMeasurementTemporalMotionAnalyzer.ts's GLOBAL_MOTION_MAD_THRESHOLD
// (8.0) -- ordinary camera/subject motion between adjacent frames of the
// SAME shot produces a small frame-to-frame change; a real hard cut
// between visually unrelated shots produces a dramatically larger one.
// These values are a documented, disclosed heuristic, not a certainty.
const CUT_MAD_THRESHOLD = 30;
const CUT_COLOR_MEAN_SHIFT_THRESHOLD = 20;

export function interpretFramePairCut(
  projectRoot: string,
  evidenceB: ExtractedFrameEvidence,
  measured: FramePairCutEvidence
): InferredValue<FramePairCutInterpretation> {
  const madExceeds = measured.meanAbsoluteDifference >= CUT_MAD_THRESHOLD;
  const colorExceeds = measured.colorMeanShift >= CUT_COLOR_MEAN_SHIFT_THRESHOLD;
  const guess: CutBoundaryGuess = madExceeds || colorExceeds ? 'cut-boundary' : 'continuous';

  // Confidence: normalized distance past (cut) or short of (continuous) the
  // nearer-triggering threshold -- same "distance from threshold, capped at
  // 1" style already used throughout this effort (e.g.
  // sceneMeasurementCameraAnalyzer.ts's classifyFraming).
  const madRatio = measured.meanAbsoluteDifference / CUT_MAD_THRESHOLD;
  const colorRatio = measured.colorMeanShift / CUT_COLOR_MEAN_SHIFT_THRESHOLD;
  const dominantRatio = Math.max(madRatio, colorRatio);
  const confidence = guess === 'cut-boundary' ? Math.min(1, dominantRatio - 1) : Math.min(1, 1 - dominantRatio);

  return buildInferredValue(projectRoot, evidenceB, 'cut-boundary-guess-from-mad-and-color-mean-shift-thresholds-v1', Math.max(0, confidence), {
    guess,
  });
}

// ============================================================
// Sequence aggregation: only real, threshold-cleared cuts ever contribute
// ============================================================

export interface EditBoundaryPairResult {
  frameIndexA: number;
  frameIndexB: number;
  timestampMsB: number;
  measured: MeasuredValue<FramePairCutEvidence>;
  interpreted: InferredValue<FramePairCutInterpretation>;
}

export interface EditBoundarySequenceResult {
  pairs: readonly EditBoundaryPairResult[];
  /** Only frame_index_b's timestamp for pairs classified 'cut-boundary' --
   *  never forced, never includes a 'continuous' pair. */
  cutTimestampsMs: readonly number[];
  /** Computed only between two REAL detected cuts -- empty whenever fewer
   *  than two cuts were found in the analyzed sequence (a real, honest
   *  outcome, not an error). */
  shotDurationsMs: readonly number[];
}

export function buildEditBoundarySequence(pairs: readonly EditBoundaryPairResult[]): EditBoundarySequenceResult {
  const cutTimestampsMs = pairs.filter((p) => p.interpreted.value.guess === 'cut-boundary').map((p) => p.timestampMsB);
  const shotDurationsMs: number[] = [];
  for (let i = 1; i < cutTimestampsMs.length; i++) {
    shotDurationsMs.push(cutTimestampsMs[i] - cutTimestampsMs[i - 1]);
  }
  return { pairs: Object.freeze(pairs), cutTimestampsMs: Object.freeze(cutTimestampsMs), shotDurationsMs: Object.freeze(shotDurationsMs) };
}
