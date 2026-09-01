/**
 * [Scene Truth Integration]
 *
 * Assembles a single, source-grounded Scene Truth for one real frame by
 * calling every measurement/interpretation module built across this
 * effort -- geometry, pose, depth, gaze, lighting, camera, environment,
 * occlusion, spatial-relationship -- and combining their outputs into
 * one structure. This file adds ZERO new measurement or inference logic
 * of its own; every value in a SceneTruth is produced by, and remains
 * exactly as provenance-tagged by, the module that actually computed it.
 *
 * ---------------------------------------------------------------------
 * Component inventory -- one gap found and closed, not papered over
 * ---------------------------------------------------------------------
 * Geometry, Pose, Depth, Gaze, Lighting, Camera, Environment, and
 * Spatial-Relationship all already existed as of this file. Occlusion
 * did not -- this system's own foundation design phase named it a
 * "schema gap" and no module ever measured it. Rather than integrate a
 * component that doesn't exist, or silently drop occlusion from the
 * integrated result, sceneMeasurementOcclusionAnalyzer.ts was written
 * alongside this file (minimal, reuse-only: bbox overlap between
 * already-detected objects, no new detector) so this Scene Truth
 * genuinely covers every named component instead of quietly omitting
 * one.
 *
 * ---------------------------------------------------------------------
 * Architectural invariant: pure aggregation, never reconciliation
 * ---------------------------------------------------------------------
 * buildSceneTruth() below calls each module's own function once, stores
 * whatever it returns verbatim, and never compares one module's output
 * against another's to adjust, override, or "clean up" either one. This
 * is deliberate, not an oversight: this system has already produced real
 * examples of components disagreeing (MoveNet finding zero poses at a
 * timestamp where coco-ssd confidently found a person; a misclassified
 * 'surfboard' detection propagating into an 'outdoor' environment guess
 * at matching confidence) -- and in every prior phase, the disagreement
 * was reported as-is, never smoothed over. Scene Truth Integration
 * continues that discipline structurally: there is no code path in this
 * file that reads two components' results together and changes either
 * one. A consumer of a SceneTruth sees the same disagreements, nulls,
 * empty-but-real outcomes, and low-confidence values that each component
 * would have reported standalone -- integration changes nothing about
 * what was measured, only how many things are visible together.
 *
 * ---------------------------------------------------------------------
 * Provenance preserved verbatim -- no MEASURED/INFERRED/AUTHORED erased
 * ---------------------------------------------------------------------
 * Every field in SceneTruth is the actual MeasuredValue<T>/InferredValue<T>
 * (or a structure containing them) each module already returns -- never
 * unwrapped to a bare value. A consumer can always see how a fact was
 * obtained (measured vs. inferred, which extraction method, what
 * confidence) for every single field, not just the top-level result.
 *
 * No AUTHORED value is produced anywhere in this pipeline -- every
 * measurement module built across this effort is either a direct
 * detector/pixel readout (MEASURED) or a model/heuristic estimate
 * (INFERRED); nothing here is a human-curated constant. The AUTHORED
 * variant remains part of ProvenanceValue's type contract for
 * completeness (e.g. a future human-set camera calibration constant
 * would genuinely belong there), but this file does not fabricate one
 * just to exercise the category.
 *
 * ---------------------------------------------------------------------
 * Scope decision: object-pair relationships only, not full keypoint combinatorics
 * ---------------------------------------------------------------------
 * objectPairSpatialRelationships below covers every pair of detected
 * objects (typically 0-3 in this system's real test frames) paired with
 * their relative-depth comparison, reusing the same depth map computed
 * once for the whole frame rather than re-estimating it per pair.
 * Keypoint-to-keypoint relationships (17 keypoints = 136 possible pairs
 * per pose) are NOT pre-expanded into SceneTruth -- that would be noise,
 * not truth, for most consumers. sceneMeasurementSpatialRelationshipAnalyzer.ts's
 * own measureKeypointPairRelationship() remains available for any
 * specific pair a caller actually needs; this integration does not
 * force that combinatorial expansion on every consumer.
 *
 * ---------------------------------------------------------------------
 * Synthetic data blocked structurally, not just declared
 * ---------------------------------------------------------------------
 * Every value-producing call in this file goes through a module whose
 * own builder (buildMeasuredValue/buildInferredValue in
 * sceneMeasurementEvidenceCore.ts) re-verifies the frame's real bytes on
 * disk before accepting anything. There is no code path in this
 * integrator, or in anything it calls, that could accept a
 * datasets/movie_reconstruction/titanic*-shaped fabricated reference --
 * confirmed again, holistically, in this phase's own verify script.
 */

import {
  measureFrameDimensions,
  verifyFrameSourceBinding,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry, type FrameGeometryMeasurementResult } from './sceneMeasurementGeometryDetector.js';
import { detectFramePose, type FramePoseMeasurementResult } from './sceneMeasurementPoseDetector.js';
import { estimateFrameDepth, type DepthMapMeasurement } from './sceneMeasurementDepthEstimator.js';
import { estimateFrameGaze, type FrameGazeMeasurementResult } from './sceneMeasurementGazeEstimator.js';
import {
  measureFrameLighting,
  interpretFrameLighting,
  type FrameLightingMeasurement,
  type FrameLightingInterpretation,
} from './sceneMeasurementLightingAnalyzer.js';
import {
  measureFrameCameraEvidence,
  interpretFrameCamera,
  type CameraFramingMeasurement,
  type FrameCameraInterpretation,
} from './sceneMeasurementCameraAnalyzer.js';
import {
  measureFrameEnvironmentEvidence,
  interpretFrameEnvironment,
  type FrameEnvironmentMeasurement,
  type FrameEnvironmentInterpretation,
} from './sceneMeasurementEnvironmentAnalyzer.js';
import {
  measureFrameBboxOverlapEvidence,
  interpretOcclusionLikelihood,
  type FrameBboxOverlapMeasurement,
  type FrameOcclusionLikelihoodInterpretation,
} from './sceneMeasurementOcclusionAnalyzer.js';
import {
  measureObjectPairRelationship,
  interpretRelativeDepthSeparation,
  interpretAbsoluteSpatialEstimate,
  type ScreenSpaceRelationship,
  type RelativeDepthComparison,
  type AbsoluteSpatialEstimate,
} from './sceneMeasurementSpatialRelationshipAnalyzer.js';

export interface ObjectPairSpatialRelationship {
  objectAClass: string;
  objectBClass: string;
  relationship: MeasuredValue<ScreenSpaceRelationship>;
  depthSeparation: InferredValue<RelativeDepthComparison>;
}

export interface SceneTruth {
  frame_fingerprint: string;
  timestamp_seconds: string;
  /** Preserved from the frame's own ExtractedFrameEvidence so a consumer
   *  of a standalone SceneTruth can still identify -- without needing the
   *  original evidence object -- which source video this frame came from.
   *  Added in Scene Truth Integrity Repair V1; previously this was
   *  silently dropped even though the frame's evidence carried it. */
  source_video_fingerprint: string;
  geometry: FrameGeometryMeasurementResult;
  pose: FramePoseMeasurementResult;
  depth: InferredValue<DepthMapMeasurement>;
  gaze: FrameGazeMeasurementResult;
  lighting: {
    measured: MeasuredValue<FrameLightingMeasurement>;
    interpreted: FrameLightingInterpretation;
  };
  camera: {
    measured: MeasuredValue<CameraFramingMeasurement>;
    interpreted: FrameCameraInterpretation;
  };
  environment: {
    measured: MeasuredValue<FrameEnvironmentMeasurement>;
    interpreted: FrameEnvironmentInterpretation;
  };
  /** Renamed from a bare occlusion: MeasuredValue<...> in Scene Truth
   *  Integrity Repair V1 -- the MEASURED half is real bbox overlap, not
   *  occlusion (see sceneMeasurementOcclusionAnalyzer.ts's file header);
   *  the INFERRED half is an explicitly-caveated occlusion-likelihood
   *  guess bucketed from that overlap, never promoted to MEASURED. */
  occlusion: {
    measured: MeasuredValue<FrameBboxOverlapMeasurement>;
    interpreted: FrameOcclusionLikelihoodInterpretation;
  };
  objectPairSpatialRelationships: readonly ObjectPairSpatialRelationship[];
  absoluteSpatialEstimate: InferredValue<AbsoluteSpatialEstimate>;
}

/**
 * Builds a complete Scene Truth for one real, already-extracted frame.
 * Pure aggregation -- see file header. Each sub-call is independent;
 * none of their results are read back into another sub-call except
 * where a module was already designed to compose (e.g. depth-separation
 * reusing the same depth map computed once here, exactly as
 * sceneMeasurementSpatialRelationshipAnalyzer.ts's own verify script
 * already demonstrated).
 *
 * Two structural fixes from Scene Truth Integrity Repair V1:
 *
 * 1. Frame/source-video/timestamp binding is verified ONCE, first, before
 *    any measurement runs -- fails closed immediately if evidence.frame_
 *    fingerprint does not genuinely trace back to evidence.source_video_
 *    path at evidence.timestamp_seconds. See verifyFrameSourceBinding()'s
 *    own header for why this lives here (once per frame) rather than
 *    inside buildMeasuredValue/buildInferredValue (many times per frame).
 *
 * 2. Geometry, pose, lighting, and depth are each measured EXACTLY ONCE
 *    below and the results are passed as parameters into every component
 *    that needs them (camera, environment, occlusion, gaze) -- none of
 *    those components re-derive geometry/pose/lighting internally
 *    anymore. The original version of this file called detectFrameGeometry
 *    four times (top-level, plus once each inside camera/environment/
 *    occlusion), detectFramePose twice (top-level, plus once inside
 *    gaze), and measureFrameLighting twice (top-level, plus once inside
 *    environment) for a single buildSceneTruth() call -- real,
 *    deterministic models re-run for identical results on the same
 *    frame, wasted inference cost with no benefit.
 */
export async function buildSceneTruth(projectRoot: string, evidence: ExtractedFrameEvidence): Promise<SceneTruth> {
  const binding = verifyFrameSourceBinding(projectRoot, evidence);
  if (!binding.valid) {
    throw new Error(`buildSceneTruth: frame/source-video/timestamp binding verification failed -- ${binding.reason}`);
  }

  const geometry = await detectFrameGeometry(projectRoot, evidence);
  const pose = await detectFramePose(projectRoot, evidence);
  const depth = await estimateFrameDepth(projectRoot, evidence);
  const gaze = await estimateFrameGaze(projectRoot, evidence, pose);

  const lightingMeasured = measureFrameLighting(projectRoot, evidence);
  const lightingInterpreted = interpretFrameLighting(projectRoot, evidence, lightingMeasured.value);

  const cameraMeasured = await measureFrameCameraEvidence(projectRoot, evidence, geometry);
  const cameraInterpreted = interpretFrameCamera(projectRoot, evidence, cameraMeasured.value);

  const environmentMeasured = await measureFrameEnvironmentEvidence(projectRoot, evidence, geometry, lightingMeasured);
  const environmentInterpreted = interpretFrameEnvironment(projectRoot, evidence, environmentMeasured.value);

  const occlusionMeasured = await measureFrameBboxOverlapEvidence(projectRoot, evidence, geometry);
  const occlusionInterpreted = interpretOcclusionLikelihood(projectRoot, evidence, occlusionMeasured.value);

  const dimensions = measureFrameDimensions(projectRoot, evidence);
  const objectPairSpatialRelationships: ObjectPairSpatialRelationship[] = [];
  for (let i = 0; i < geometry.detections.length; i++) {
    for (let j = i + 1; j < geometry.detections.length; j++) {
      const a = geometry.detections[i];
      const b = geometry.detections[j];
      const relationship = measureObjectPairRelationship(projectRoot, evidence, a, b);
      const depthSeparation = interpretRelativeDepthSeparation(
        projectRoot,
        evidence,
        depth.value,
        dimensions.value,
        a.value.position2D,
        b.value.position2D
      );
      objectPairSpatialRelationships.push({
        objectAClass: a.value.class,
        objectBClass: b.value.class,
        relationship,
        depthSeparation,
      });
    }
  }

  const absoluteSpatialEstimate = interpretAbsoluteSpatialEstimate(projectRoot, evidence);

  return {
    frame_fingerprint: evidence.frame_fingerprint,
    timestamp_seconds: evidence.timestamp_seconds,
    source_video_fingerprint: evidence.source_video_fingerprint,
    geometry,
    pose,
    depth,
    gaze,
    lighting: { measured: lightingMeasured, interpreted: lightingInterpreted },
    camera: { measured: cameraMeasured, interpreted: cameraInterpreted },
    environment: { measured: environmentMeasured, interpreted: environmentInterpreted },
    occlusion: { measured: occlusionMeasured, interpreted: occlusionInterpreted },
    objectPairSpatialRelationships: Object.freeze(objectPairSpatialRelationships),
    absoluteSpatialEstimate,
  };
}
