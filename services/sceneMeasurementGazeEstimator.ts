/**
 * [Scene Measurement Gaze Estimator]
 *
 * Real gaze-direction estimation on top of sceneMeasurementEvidenceCore.ts
 * (ExtractedFrameEvidence, InferredValue, buildInferredValue) and
 * sceneMeasurementPoseDetector.ts (detectFramePose, the nose/left_eye/
 * right_eye keypoints it already measures) -- reused directly, nothing
 * re-derived.
 *
 * ---------------------------------------------------------------------
 * Gaze/head-pose model candidate investigation
 * ---------------------------------------------------------------------
 * Considered:
 *  - @mediapipe/tasks-vision FaceLandmarker (includes iris landmarks --
 *    the closest available thing to genuine, direct eye/pupil
 *    measurement, which would have justified a MEASURED classification
 *    per this task's own rule): ACTUALLY ATTEMPTED, not just assumed
 *    unworkable. Installed the real package and tried to initialize a
 *    real FaceLandmarker in this Node environment -- it throws
 *    `ReferenceError: document is not defined`. MediaPipe Tasks Vision
 *    depends on browser DOM APIs internally; working around that would
 *    mean a DOM polyfill (jsdom + the `canvas` package), and `canvas`
 *    itself requires native compilation -- the exact same
 *    node-gyp/Visual-Studio risk class that already blocked tfjs-node
 *    earlier in this session. Uninstalled after confirming this, not
 *    left as a dead dependency.
 *  - A dedicated appearance-based gaze model (e.g. an L2CS-Net or
 *    MPIIGaze-trained ONNX export): no canonical, official, easily
 *    verifiable single-file release exists the way MiDaS's did (isl-org's
 *    own GitHub release) -- pursuing this would mean trusting an
 *    unverified third-party export, which this whole system's own
 *    discipline already rejected once for depth. Not pursued.
 *  - Head-pose-from-2D-keypoints, computed directly from
 *    sceneMeasurementPoseDetector.ts's already-measured nose/left_eye/
 *    right_eye keypoints: SELECTED. Zero new model, zero new
 *    dependency, zero new install risk -- genuinely achievable today,
 *    and a well-established, real technique (head orientation as a
 *    proxy for gaze direction) for exactly the case this task's own
 *    classification rule anticipates.
 *
 * ---------------------------------------------------------------------
 * Why INFERRED, never MEASURED -- per this task's own explicit rule
 * ---------------------------------------------------------------------
 * This file's only provenance-producing call is buildInferredValue();
 * buildMeasuredValue is never imported. The computed vector is a head-
 * orientation PROXY for gaze (nose position relative to the eye
 * midpoint, normalized by interocular distance) -- not a direct
 * measurement of eye/pupil position, which is exactly the dividing line
 * this task specifies: direct eye-gaze would be MEASURED, head-pose-
 * based is INFERRED. If a genuine iris/pupil-based measurement ever
 * becomes viable in this environment (e.g. once a native-compiler
 * toolchain exists, unblocking MediaPipe or an ONNX iris model), that
 * would warrant a MEASURED classification and belongs in a different
 * function -- not a reason to relabel this one.
 *
 * confidence is the MINIMUM of the three upstream MoveNet keypoint
 * confidences (nose, left_eye, right_eye) that feed the computation --
 * not a single detector's own reported score (there is no single "gaze
 * model" here to ask), and not an average, which would let one strong
 * keypoint mask another's unreliability. A chain is only as strong as
 * its weakest measured input; propagating the minimum is the honest,
 * conservative choice, not an arbitrary one.
 *
 * ---------------------------------------------------------------------
 * Non-detection / low-confidence preservation
 * ---------------------------------------------------------------------
 * When sceneMeasurementPoseDetector.ts reports zero poses for a frame
 * (a real, already-established outcome -- see that module's own
 * ranToCompletion + empty-poses convention), there is nothing to derive
 * gaze from at all. This is recorded explicitly as `gaze: null` inside a
 * result that still has ranToCompletion:true -- never thrown as an
 * error (this is a legitimate, expected outcome, not a failure), and
 * never silently omitted. When a pose IS found but its nose/eye
 * keypoints are individually low-confidence, the resulting gaze
 * InferredValue's own (minimum-propagated) confidence reflects that
 * honestly -- low-confidence gaze estimates are returned, never
 * filtered out or replaced with a null.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence and the pose keypoints derived from it, both
 * already fail-closed-verified upstream. There is no path from any
 * dataset under datasets/movie_reconstruction/ (which has no gaze field
 * at all, per this system's own earlier coverage assessment -- gaze
 * there is categorical-only, e.g. "eye_direction": "forward_horizon",
 * never a vector) into anything this file produces.
 */

import type { FramePoseMeasurementResult } from './sceneMeasurementPoseDetector.js';
import { buildInferredValue, type ExtractedFrameEvidence, type InferredValue } from './sceneMeasurementEvidenceCore.js';

const GAZE_EXTRACTION_METHOD = 'head-pose-proxy-from-movenet-singlepose-lightning-v1' as const;

export interface GazeVector {
  /** Normalized horizontal head-orientation proxy: (nose.x - midEye.x) /
   *  interocularDistance. ~0 when facing the camera; increasingly
   *  positive/negative as the head turns, sign convention fixed by pixel
   *  coordinate space (image x increases rightward). */
  x: number;
  /** Normalized vertical head-orientation proxy: (nose.y - midEye.y) /
   *  interocularDistance. */
  y: number;
}

export interface KeypointSnapshot {
  x: number;
  y: number;
  confidence: number | null;
}

export interface GazeMeasurement {
  gazeVector: GazeVector;
  /** The exact keypoints this estimate was derived from, kept for
   *  traceability -- a caller can see precisely what fed the
   *  computation and each input's own individual confidence, not just
   *  the propagated minimum. */
  derivedFrom: {
    nose: KeypointSnapshot;
    leftEye: KeypointSnapshot;
    rightEye: KeypointSnapshot;
  };
}

export interface FrameGazeMeasurementResult {
  /** True once gaze estimation has genuinely run to completion for this
   *  frame -- distinguishes "ran, no pose was available to derive gaze
   *  from" (gaze: null) from "never attempted". A real failure to run
   *  (a malformed upstream pose missing an expected keypoint) throws
   *  instead. */
  ranToCompletion: true;
  /** null exactly when detectFramePose() found zero poses for this
   *  frame -- a real, preserved outcome, never an error. */
  gaze: InferredValue<GazeMeasurement> | null;
}

/**
 * Estimates head-pose-proxy gaze direction for a single real frame, from
 * an ALREADY-COMPUTED pose detection result passed in by the caller --
 * never runs a second, redundant pose-detection pass itself.
 */
export async function estimateFrameGaze(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  poseResult: FramePoseMeasurementResult
): Promise<FrameGazeMeasurementResult> {
  if (poseResult.poses.length === 0) {
    return { ranToCompletion: true, gaze: null };
  }

  // Single-pose model -- exactly one pose when poses.length > 0.
  const keypoints = poseResult.poses[0].keypoints;
  const nose = keypoints.find((k) => k.value.name === 'nose');
  const leftEye = keypoints.find((k) => k.value.name === 'left_eye');
  const rightEye = keypoints.find((k) => k.value.name === 'right_eye');

  if (nose === undefined || leftEye === undefined || rightEye === undefined) {
    throw new Error(
      'estimateFrameGaze: upstream pose is missing an expected keypoint (nose/left_eye/right_eye) -- this indicates a malformed pose result, not a legitimate non-detection.'
    );
  }

  const midEyeX = (leftEye.value.x + rightEye.value.x) / 2;
  const midEyeY = (leftEye.value.y + rightEye.value.y) / 2;
  const interocularDistance = Math.hypot(rightEye.value.x - leftEye.value.x, rightEye.value.y - leftEye.value.y);

  const gazeVector: GazeVector =
    interocularDistance > 0
      ? {
          x: (nose.value.x - midEyeX) / interocularDistance,
          y: (nose.value.y - midEyeY) / interocularDistance,
        }
      : { x: 0, y: 0 };

  const toSnapshot = (kp: typeof nose): KeypointSnapshot => ({
    x: kp.value.x,
    y: kp.value.y,
    confidence: kp.confidence,
  });

  const confidences = [nose.confidence, leftEye.confidence, rightEye.confidence].filter(
    (c): c is number => typeof c === 'number'
  );
  const propagatedConfidence = confidences.length > 0 ? Math.min(...confidences) : null;

  const measurement: GazeMeasurement = {
    gazeVector,
    derivedFrom: {
      nose: toSnapshot(nose),
      leftEye: toSnapshot(leftEye),
      rightEye: toSnapshot(rightEye),
    },
  };

  const gaze = buildInferredValue(projectRoot, evidence, GAZE_EXTRACTION_METHOD, propagatedConfidence, measurement);
  return { ranToCompletion: true, gaze };
}
