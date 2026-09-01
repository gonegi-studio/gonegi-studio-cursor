/**
 * [Scene Measurement Camera Analyzer]
 *
 * Real camera framing/composition measurement on top of
 * sceneMeasurementEvidenceCore.ts (ExtractedFrameEvidence, MeasuredValue,
 * InferredValue, buildMeasuredValue, buildInferredValue,
 * measureFrameDimensions) and sceneMeasurementGeometryDetector.ts
 * (detectFrameGeometry -- reusing its already-measured bbox/position2D/
 * frameRelativeScale directly, never re-detecting a subject here). No
 * new model, no new dependency -- this is geometry arithmetic over
 * values two other modules already measured.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs. INFERRED -- the dividing line this task specifies
 * ---------------------------------------------------------------------
 * MEASURED (measureFrameCameraEvidence): everything that stays entirely
 * in SCREEN SPACE AND requires no judgment call about bucket boundaries --
 * the frame's own aspect ratio, the subject's already-measured
 * frame-relative scale (reused verbatim from
 * sceneMeasurementGeometryDetector.ts, not recomputed), the subject's
 * normalized screen position, headroom (space above the subject's bbox
 * relative to frame height), and rule-of-thirds proximity. None of this
 * requires assuming anything about the 3D world the frame depicts --
 * "this bbox occupies 70% of the frame's height" is an objective fact
 * about the 2D image regardless of what is physically true in front of
 * the camera, exactly the same character as measureFrameDimensions()'s
 * own width/height. Confidence is 1.0 throughout (deterministic
 * geometry), the same convention as every other MEASURED value in this
 * system.
 *
 * [Composition Region Measurement V1] compositionRegion follows the exact
 * same discipline: a nine-region grid bucket (top-left..bottom-right,
 * center) over the already-measured subjectScreenPosition, thresholds
 * (1/3, 2/3, matching nearestRuleOfThirdsDistance()'s own convention below)
 * living only inside the INFERRED classifier. guess is null exactly when
 * subjectScreenPosition is null -- never defaulted to 'center' or any other
 * bucket when no subject was detected.
 *
 * INFERRED (interpretFrameCamera: framingType, cameraAngle, cameraFov):
 * framingType (close-up/medium/wide) buckets the measured scale ratio
 * against threshold constants (0.7, 0.35) -- a judgment call about what
 * those bucket boundaries mean, not an objective fact the way the raw
 * ratio itself is. This repair phase moved it here from MEASURED
 * specifically for that reason: bucketing a measured value against a
 * threshold is exactly the same kind of judgment call this system already
 * classifies as INFERRED elsewhere (e.g.
 * sceneMeasurementLightingAnalyzer.ts's lightType guess from a contrast
 * threshold), so leaving it in MEASURED was an inconsistency, not a
 * defensible exception. "No subject was found" is still a real,
 * confidently-observed fact -- framingType: 'no-subject-detected' still
 * carries a real (null) confidence honestly reflecting that there was no
 * screen-space evidence to bucket at all, never a fabricated 1.0. Camera
 * ANGLE and FIELD OF VIEW both require reasoning about the 3D
 * world/camera that produced the 2D image -- assumptions this system has
 * no way to verify from pixels alone. Camera angle is estimated via a
 * documented, admittedly weak heuristic (subject vertical screen position
 * relative to frame center) with the same honesty standard already
 * applied to sceneMeasurementLightingAnalyzer.ts's light-direction guess:
 * a real, used-in-practice proxy, explicitly flagged as influenced by
 * many compositional choices beyond camera angle, not a strong claim.
 * Field-of-view estimation from a single uncalibrated frame with no known
 * reference object size is NOT attempted at all -- confidence: null and
 * guess: null, honestly, rather than fabricating a plausible-looking
 * degree value with no real evidentiary basis. This is the intended use
 * of this system's `confidence: number | null` contract: some questions
 * genuinely have no answer worth reporting.
 *
 * ---------------------------------------------------------------------
 * Titanic synthetic camera data -- explicitly not reused
 * ---------------------------------------------------------------------
 * This file never reads datasets/movie_reconstruction/titanic-scene-
 * geometry-registry.json's camera_position/camera_rotation/
 * camera_distance fields (confirmed, in an earlier phase of this same
 * measurement effort, to be procedurally synthesized from a loop index
 * in services/titanicSceneGeometryDensification.ts, not real
 * measurements) or titanic-camera-trajectory-registry.json. Every value
 * here is computed fresh from a real frame's real dimensions and a real
 * detector's real bbox for that same frame.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence and geometry detections derived from it, both
 * already fail-closed-verified upstream.
 */

import {
  buildMeasuredValue,
  buildInferredValue,
  measureFrameDimensions,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import type { FrameGeometryMeasurementResult, DetectedObjectGeometry } from './sceneMeasurementGeometryDetector.js';

const CAMERA_FRAMING_METHOD = 'camera-framing-from-geometry-bbox-v1' as const;

export type FramingType = 'close-up' | 'medium-shot' | 'wide-shot' | 'no-subject-detected';

export interface CameraFramingMeasurement {
  frameAspectRatio: number;
  /** Reused verbatim from the subject's own DetectedObjectGeometry --
   *  never recomputed. null when no subject was detected. */
  subjectFrameRelativeScale: number | null;
  /** Subject's screen position normalized to [0,1] on each axis. null
   *  when no subject was detected. */
  subjectScreenPosition: { x: number; y: number } | null;
  /** Vertical space above the subject's bbox top, as a fraction of frame
   *  height. null when no subject was detected. */
  headroomRatio: number | null;
  /** Normalized distance (0 = exactly on a rule-of-thirds intersection)
   *  from the subject's screen position to the nearest of the four
   *  rule-of-thirds intersection points. null when no subject was
   *  detected. */
  ruleOfThirdsDistance: number | null;
}

function nearestRuleOfThirdsDistance(normX: number, normY: number): number {
  const lines = [1 / 3, 2 / 3];
  let minDist = Infinity;
  for (const lx of lines) {
    for (const ly of lines) {
      const dist = Math.hypot(normX - lx, normY - ly);
      if (dist < minDist) minDist = dist;
    }
  }
  return minDist;
}

/**
 * Picks the "primary subject" bbox from a frame's already-measured
 * geometry detections -- the largest by frame-relative scale, on the
 * (documented, simple) assumption that the largest detected subject is
 * the one framing decisions were made around. Returns null when there
 * are no detections at all, never fabricating a subject.
 */
function pickPrimarySubject(
  detections: readonly MeasuredValue<DetectedObjectGeometry>[]
): MeasuredValue<DetectedObjectGeometry> | null {
  if (detections.length === 0) return null;
  return detections.reduce((a, b) => (b.value.frameRelativeScale > a.value.frameRelativeScale ? b : a));
}

/**
 * Measures real screen-space camera/framing evidence for a single real
 * frame, from an ALREADY-COMPUTED geometry detection result passed in by
 * the caller -- never runs a second, redundant detection pass itself.
 */
export async function measureFrameCameraEvidence(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  geometry: FrameGeometryMeasurementResult
): Promise<MeasuredValue<CameraFramingMeasurement>> {
  const dimensions = measureFrameDimensions(projectRoot, evidence);
  const subject = pickPrimarySubject(geometry.detections);

  const frameAspectRatio = dimensions.value.width / dimensions.value.height;

  let subjectFrameRelativeScale: number | null = null;
  let subjectScreenPosition: { x: number; y: number } | null = null;
  let headroomRatio: number | null = null;
  let ruleOfThirdsDistance: number | null = null;

  if (subject !== null) {
    subjectFrameRelativeScale = subject.value.frameRelativeScale;
    const normX = subject.value.position2D.x / dimensions.value.width;
    const normY = subject.value.position2D.y / dimensions.value.height;
    subjectScreenPosition = { x: normX, y: normY };
    headroomRatio = subject.value.bbox.y / dimensions.value.height;
    ruleOfThirdsDistance = nearestRuleOfThirdsDistance(normX, normY);
  }

  const measurement: CameraFramingMeasurement = {
    frameAspectRatio,
    subjectFrameRelativeScale,
    subjectScreenPosition,
    headroomRatio,
    ruleOfThirdsDistance,
  };

  return buildMeasuredValue(projectRoot, evidence, CAMERA_FRAMING_METHOD, 1.0, measurement);
}

export type CameraAngleGuess = 'high-angle' | 'eye-level' | 'low-angle';

export interface CameraAngleInterpretation {
  guess: CameraAngleGuess | null;
}

export interface CameraFovInterpretation {
  guess: null;
}

export interface FramingTypeInterpretation {
  guess: FramingType;
}

/**
 * [Composition Region Measurement V1] Nine-region compositional-grid
 * bucket over the SAME already-measured subjectScreenPosition
 * measureFrameCameraEvidence() above already produces -- no new
 * measurement, no new detector. Real Geometry/Camera evidence reused
 * verbatim (see classifyCompositionRegion() below); guess is null exactly
 * when subjectScreenPosition is null (no subject detected), never
 * defaulted to e.g. 'center'.
 */
export type CompositionRegionGuess =
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface CompositionRegionInterpretation {
  guess: CompositionRegionGuess | null;
}

export interface FrameCameraInterpretation {
  framingType: InferredValue<FramingTypeInterpretation>;
  cameraAngle: InferredValue<CameraAngleInterpretation>;
  cameraFov: InferredValue<CameraFovInterpretation>;
  compositionRegion: InferredValue<CompositionRegionInterpretation>;
}

// Bucket boundaries for framing-type classification -- a judgment call
// about what "close" vs "medium" vs "wide" means, not an objective fact
// about the frame the way subjectFrameRelativeScale itself is. This is
// why the threshold logic lives here, inside the INFERRED interpretation
// layer, and never inside measureFrameCameraEvidence() (MEASURED) above --
// this repair phase moved it out of MEASURED specifically because a
// threshold bucketing is exactly the same kind of judgment call this
// system already classifies as INFERRED elsewhere (e.g.
// sceneMeasurementLightingAnalyzer.ts's lightType guess from a contrast
// threshold); treating it as MEASURED here would have been inconsistent.
const CLOSE_UP_THRESHOLD = 0.7;
const MEDIUM_SHOT_THRESHOLD = 0.35;

/**
 * Classifies framing type from the already-measured subject scale ratio,
 * with confidence as the normalized distance from the nearest bucket
 * boundary -- the same "distance from threshold, capped at 1" style
 * sceneMeasurementLightingAnalyzer.ts's lightType guess already
 * established, not a newly-invented formula.
 */
function classifyFraming(frameRelativeScale: number | null): { guess: FramingType; confidence: number | null } {
  if (frameRelativeScale === null) {
    // No screen-space evidence at all -- honestly null, not a fabricated
    // confidence for a bucket assigned with no subject to measure.
    return { guess: 'no-subject-detected', confidence: null };
  }
  let guess: FramingType;
  let nearestBoundaryDistance: number;
  if (frameRelativeScale > CLOSE_UP_THRESHOLD) {
    guess = 'close-up';
    nearestBoundaryDistance = frameRelativeScale - CLOSE_UP_THRESHOLD;
  } else if (frameRelativeScale > MEDIUM_SHOT_THRESHOLD) {
    guess = 'medium-shot';
    nearestBoundaryDistance = Math.min(frameRelativeScale - MEDIUM_SHOT_THRESHOLD, CLOSE_UP_THRESHOLD - frameRelativeScale);
  } else {
    guess = 'wide-shot';
    nearestBoundaryDistance = MEDIUM_SHOT_THRESHOLD - frameRelativeScale;
  }
  const confidence = Math.min(1, nearestBoundaryDistance / MEDIUM_SHOT_THRESHOLD);
  return { guess, confidence };
}

// Same 1/3, 2/3 rule-of-thirds line convention nearestRuleOfThirdsDistance()
// above already uses for this file's other composition metric -- a
// judgment call about region BOUNDARIES, so it lives here, inside the
// INFERRED classifier, never inside measureFrameCameraEvidence() (MEASURED).
const REGION_LOW_BOUNDARY = 1 / 3;
const REGION_HIGH_BOUNDARY = 2 / 3;
// Half the width of one grid cell (1/3 of the frame) -- the confidence
// normalization scale: a point exactly on a cell boundary gets confidence
// 0, a point exactly at a cell's center gets confidence 1.
const REGION_HALF_CELL_WIDTH = 1 / 6;

function classifyAxisBucket(value: number): 'low' | 'mid' | 'high' {
  if (value < REGION_LOW_BOUNDARY) return 'low';
  if (value < REGION_HIGH_BOUNDARY) return 'mid';
  return 'high';
}

/**
 * Buckets the already-measured, normalized subject screen position into a
 * nine-region compositional grid -- reuses subjectScreenPosition verbatim
 * (see file header); computes nothing new about the frame itself. Real
 * Geometry/Camera evidence reused, matching Composition Region Measurement
 * V1's "기존 Geometry/Camera evidence 재사용" requirement.
 */
function classifyCompositionRegion(
  subjectScreenPosition: { x: number; y: number } | null
): { guess: CompositionRegionGuess | null; confidence: number | null } {
  if (subjectScreenPosition === null) {
    // No subject detected -- honestly null, never defaulted to e.g. 'center'.
    return { guess: null, confidence: null };
  }
  const { x, y } = subjectScreenPosition;
  const columnBucket = classifyAxisBucket(x);
  const rowBucket = classifyAxisBucket(y);

  const columnLabel = columnBucket === 'low' ? 'left' : columnBucket === 'high' ? 'right' : 'center';
  const rowLabel = rowBucket === 'low' ? 'top' : rowBucket === 'high' ? 'bottom' : 'middle';
  const guess: CompositionRegionGuess =
    rowBucket === 'mid' && columnBucket === 'mid' ? 'center' : (`${rowLabel}-${columnLabel}` as CompositionRegionGuess);

  const distanceToNearestBoundary = Math.min(
    Math.abs(x - REGION_LOW_BOUNDARY),
    Math.abs(x - REGION_HIGH_BOUNDARY),
    Math.abs(y - REGION_LOW_BOUNDARY),
    Math.abs(y - REGION_HIGH_BOUNDARY)
  );
  const confidence = Math.min(1, distanceToNearestBoundary / REGION_HALF_CELL_WIDTH);
  return { guess, confidence };
}

/**
 * Interprets already-measured framing evidence into framing-type,
 * camera-angle, and field-of-view guesses -- never calls
 * buildMeasuredValue.
 */
export function interpretFrameCamera(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  measured: CameraFramingMeasurement
): FrameCameraInterpretation {
  const { guess: framingGuess, confidence: framingConfidence } = classifyFraming(measured.subjectFrameRelativeScale);
  const framingType = buildInferredValue(
    projectRoot,
    evidence,
    'camera-framing-type-guess-from-subject-scale-thresholds-v1',
    framingConfidence,
    { guess: framingGuess }
  );

  let angleGuess: CameraAngleGuess | null = null;
  let angleConfidence: number | null = null;

  if (measured.subjectScreenPosition !== null) {
    const y = measured.subjectScreenPosition.y;
    // Weak, documented heuristic: subject vertical screen position
    // relative to frame center, as a proxy for camera angle. Real
    // composition choices (headroom convention, rule-of-thirds framing,
    // multiple subjects) influence this just as much as camera angle
    // does -- this is a real, used-in-practice proxy, not a strong
    // claim, the same honesty standard as
    // sceneMeasurementLightingAnalyzer.ts's light-direction guess.
    if (y < 0.4) {
      angleGuess = 'low-angle';
    } else if (y > 0.6) {
      angleGuess = 'high-angle';
    } else {
      angleGuess = 'eye-level';
    }
    angleConfidence = Math.min(1, Math.abs(y - 0.5) / 0.5);
  }
  // angleConfidence stays null when there is no subject at all -- there
  // is no screen-space evidence whatsoever to base even a weak guess on.

  const cameraAngle = buildInferredValue(
    projectRoot,
    evidence,
    'camera-angle-guess-from-subject-vertical-position-v1',
    angleConfidence,
    { guess: angleGuess }
  );

  // Field of view from a single uncalibrated frame with no known
  // reference object size is not attempted -- see file header. null
  // guess, null confidence: the honest answer, not a fabricated number.
  const cameraFov = buildInferredValue(
    projectRoot,
    evidence,
    'camera-fov-guess-not-attempted-no-calibration-v1',
    null,
    { guess: null }
  );

  const { guess: regionGuess, confidence: regionConfidence } = classifyCompositionRegion(measured.subjectScreenPosition);
  const compositionRegion = buildInferredValue(
    projectRoot,
    evidence,
    'composition-region-guess-from-subject-screen-position-nine-grid-v1',
    regionConfidence,
    { guess: regionGuess }
  );

  return { framingType, cameraAngle, cameraFov, compositionRegion };
}
