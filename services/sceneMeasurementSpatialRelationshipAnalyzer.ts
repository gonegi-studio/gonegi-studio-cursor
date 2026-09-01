/**
 * [Scene Measurement Spatial Relationship Analyzer]
 *
 * Real 2D distance/relative-size measurement between detected entities,
 * plus an honestly-scoped 3D-relative depth comparison, on top of
 * sceneMeasurementEvidenceCore.ts (ExtractedFrameEvidence, MeasuredValue,
 * InferredValue, buildMeasuredValue, buildInferredValue),
 * sceneMeasurementGeometryDetector.ts (DetectedObjectGeometry --
 * object-pair relationships), sceneMeasurementPoseDetector.ts
 * (KeypointMeasurement -- keypoint-pair relationships), and
 * sceneMeasurementDepthEstimator.ts (sampleDepthAtOriginalFramePosition
 * -- the relative-depth comparison). No new detector, no new pixel
 * decode -- every input here is a value one of those three modules
 * already measured or inferred for the same frame.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs. INFERRED -- the dividing line this task specifies
 * ---------------------------------------------------------------------
 * MEASURED (measureObjectPairRelationship, measureKeypointPairRelationship):
 * pixel-space Euclidean distance between two already-measured screen
 * positions, and (for object pairs only -- keypoints have no inherent
 * size) the ratio of their bbox heights. Both stay entirely in 2D screen
 * space -- no assumption about the 3D scene is needed to say "these two
 * points are 340 pixels apart" or "this bbox is 2.1x the height of that
 * one", exactly the same character as
 * sceneMeasurementCameraAnalyzer.ts's screen-space framing measurements.
 * Confidence is the MINIMUM of the two input entities' own confidences
 * (a relationship between a 0.9-confidence detection and a
 * 0.3-confidence one is only as trustworthy as the weaker one) -- the
 * same propagation rule sceneMeasurementGazeEstimator.ts already
 * established, reused here rather than inventing a new aggregation.
 *
 * INFERRED, and only when a real basis exists
 * (interpretRelativeDepthSeparation): comparing MiDaS's relative inverse
 * depth at the two same points a 2D relationship was already measured
 * between. This is produced only because sceneMeasurementDepthEstimator.ts
 * genuinely provides a real signal to draw on (an actual model output at
 * each point, not a fabricated pseudo-depth from bbox size alone) --
 * that is the "근거" (basis) this task requires before attempting any
 * 3D-relative estimate at all. Even so, confidence is unconditionally
 * null: MiDaS itself reports no per-pixel confidence (established when
 * sceneMeasurementDepthEstimator.ts was built), so there is no honest
 * number to propagate here either -- and the result is explicitly
 * ordinal/relative only (which point the model estimates as closer),
 * never a metric distance.
 *
 * ---------------------------------------------------------------------
 * Absolute distance/size -- always null, no calibration exists
 * ---------------------------------------------------------------------
 * interpretAbsoluteSpatialEstimate() always returns
 * { distanceMeters: null, sizeMeters: null }, unconditionally. This
 * system has no camera intrinsics, no known real-world reference object
 * size, and no stereo/multi-view geometry anywhere -- there is no
 * calibration source to convert any screen-space or relative-depth value
 * into a real-world unit. This is implemented as a real function (not
 * just a comment) so "calibration absent -> absolute values null" is a
 * verifiable code path, the same discipline already applied to camera
 * field-of-view and weather.
 *
 * ---------------------------------------------------------------------
 * Titanic synthetic scale/position -- explicitly not reused
 * ---------------------------------------------------------------------
 * This file never reads datasets/movie_reconstruction/titanic*'s
 * position/scale-shaped fields (titanic-character-placement-registry.json,
 * titanic-scene-geometry-registry.json's camera_distance, or any
 * "distance_between_subjects"-style field) -- this system's own earlier
 * findings already established those are procedurally synthesized from a
 * loop index, not real measurements. Every value here is computed fresh
 * from two real, already-measured positions for the same real frame.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence and measurements/inferences derived from it,
 * all already fail-closed-verified upstream.
 */

import {
  buildMeasuredValue,
  buildInferredValue,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import type { DetectedObjectGeometry, Position2D } from './sceneMeasurementGeometryDetector.js';
import type { KeypointMeasurement } from './sceneMeasurementPoseDetector.js';
import { sampleDepthAtOriginalFramePosition, type DepthMapMeasurement } from './sceneMeasurementDepthEstimator.js';

const OBJECT_PAIR_METHOD = 'screen-space-distance-and-size-ratio-from-geometry-bboxes-v1' as const;
const KEYPOINT_PAIR_METHOD = 'screen-space-distance-from-pose-keypoints-v1' as const;
const DEPTH_SEPARATION_METHOD = 'relative-depth-comparison-from-midas-v2.1-small-256-onnx-v1' as const;
const ABSOLUTE_ESTIMATE_METHOD = 'absolute-spatial-estimate-not-attempted-no-calibration-v1' as const;

export interface ScreenSpaceRelationship {
  pixelDistance: number;
  /** null for keypoint-pair relationships -- a keypoint has no inherent
   *  size to ratio against another keypoint's. */
  relativeSizeRatio: number | null;
}

function minConfidence(a: number | null, b: number | null): number | null {
  if (a === null || b === null) return null;
  return Math.min(a, b);
}

/**
 * Measures real 2D distance + relative bbox-height ratio between two
 * already-detected objects in the same frame. Reuses their own
 * position2D/bbox verbatim -- no re-detection.
 */
export function measureObjectPairRelationship(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  objectA: MeasuredValue<DetectedObjectGeometry>,
  objectB: MeasuredValue<DetectedObjectGeometry>
): MeasuredValue<ScreenSpaceRelationship> {
  const pixelDistance = Math.hypot(
    objectA.value.position2D.x - objectB.value.position2D.x,
    objectA.value.position2D.y - objectB.value.position2D.y
  );
  const relativeSizeRatio = objectA.value.bbox.height / objectB.value.bbox.height;
  const confidence = minConfidence(objectA.confidence, objectB.confidence);

  return buildMeasuredValue(projectRoot, evidence, OBJECT_PAIR_METHOD, confidence, {
    pixelDistance,
    relativeSizeRatio,
  });
}

/**
 * Measures real 2D distance between two keypoints of the same (or, if
 * ever extended to a multi-pose model later, different) detected pose.
 * Reuses their own x/y verbatim -- no re-estimation.
 */
export function measureKeypointPairRelationship(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  keypointA: MeasuredValue<KeypointMeasurement>,
  keypointB: MeasuredValue<KeypointMeasurement>
): MeasuredValue<ScreenSpaceRelationship> {
  const pixelDistance = Math.hypot(keypointA.value.x - keypointB.value.x, keypointA.value.y - keypointB.value.y);
  const confidence = minConfidence(keypointA.confidence, keypointB.confidence);

  return buildMeasuredValue(projectRoot, evidence, KEYPOINT_PAIR_METHOD, confidence, {
    pixelDistance,
    relativeSizeRatio: null,
  });
}

export interface RelativeDepthComparison {
  pointADepth: number;
  pointBDepth: number;
  /** MiDaS convention: higher relative inverse depth = closer. Positive
   *  means point A is estimated closer than point B. */
  relativeInverseDepthDifference: number;
  closerPoint: 'A' | 'B' | 'indeterminate';
}

/**
 * Compares MiDaS's relative inverse depth at two screen-space positions
 * already used for a 2D relationship measurement above. Produced only
 * because a real depth map genuinely exists for this frame (the "근거"
 * this task requires) -- confidence is unconditionally null, since MiDaS
 * itself reports no per-pixel confidence signal to propagate.
 */
export function interpretRelativeDepthSeparation(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  depthMap: DepthMapMeasurement,
  originalFrameDimensions: { width: number; height: number },
  pointA: Position2D,
  pointB: Position2D
): InferredValue<RelativeDepthComparison> {
  const pointADepth = sampleDepthAtOriginalFramePosition(depthMap, originalFrameDimensions, pointA);
  const pointBDepth = sampleDepthAtOriginalFramePosition(depthMap, originalFrameDimensions, pointB);
  const relativeInverseDepthDifference = pointADepth - pointBDepth;

  // A small fraction of the depth map's own overall range is treated as
  // "no meaningful difference" -- an arbitrary-scale relative_inverse
  // depth value has no absolute threshold that means anything without
  // calibration, so this is scaled to the depth map's own observed range
  // rather than a fixed constant.
  const range = depthMap.max - depthMap.min;
  const noiseFloor = range * 0.02;
  const closerPoint: RelativeDepthComparison['closerPoint'] =
    Math.abs(relativeInverseDepthDifference) < noiseFloor ? 'indeterminate' : relativeInverseDepthDifference > 0 ? 'A' : 'B';

  return buildInferredValue(projectRoot, evidence, DEPTH_SEPARATION_METHOD, null, {
    pointADepth,
    pointBDepth,
    relativeInverseDepthDifference,
    closerPoint,
  });
}

export interface AbsoluteSpatialEstimate {
  distanceMeters: null;
  sizeMeters: null;
}

/**
 * Always returns null values -- no calibration source (camera
 * intrinsics, a known real-world reference object size, or multi-view
 * geometry) exists anywhere in this system. Implemented as a real,
 * callable function so this is a verifiable code path, not just a
 * documented intention.
 */
export function interpretAbsoluteSpatialEstimate(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): InferredValue<AbsoluteSpatialEstimate> {
  return buildInferredValue(projectRoot, evidence, ABSOLUTE_ESTIMATE_METHOD, null, {
    distanceMeters: null,
    sizeMeters: null,
  });
}
