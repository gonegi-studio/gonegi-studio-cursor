/**
 * [Scene Measurement Pose Detector]
 *
 * Real body-keypoint measurement, on top of sceneMeasurementEvidenceCore.ts
 * (ExtractedFrameEvidence, MeasuredValue, buildMeasuredValue,
 * measureFrameDimensions) and sceneMeasurementGeometryDetector.ts
 * (decodeJpegFrameToTensor) -- both reused directly, neither re-derived.
 *
 * ---------------------------------------------------------------------
 * Pose/keypoint detector candidate investigation
 * ---------------------------------------------------------------------
 * Considered:
 *  - @tensorflow-models/posenet: the older, now-deprecated single/multi
 *    pose package -- superseded by pose-detection below, which wraps a
 *    materially better model (MoveNet) behind the same maintainer.
 *  - MediaPipe Pose (via @mediapipe/pose, native or WASM runtime):
 *    heavier integration surface (its own runtime/graph format, not a
 *    plain tfjs model), and pose-detection already offers a BlazePose
 *    'tfjs' runtime variant of the same model family if ever needed
 *    later -- not pulled in now, keeping this minimal.
 *  - @tensorflow-models/pose-detection + MoveNet SinglePose Lightning:
 *    SELECTED. Actively maintained, Apache-2.0 (Google), runs on the
 *    same pure-JS CPU backend already proven working for
 *    sceneMeasurementGeometryDetector.ts's coco-ssd model -- no new
 *    native dependency, no new backend risk. Outputs exactly 17 COCO
 *    body keypoints per pose (nose, eyes, ears, shoulders, elbows,
 *    wrists, hips, knees, ankles), each with its own x/y and confidence
 *    score -- a direct fit for "keypoint coordinates + visibility/
 *    confidence".
 *
 * ---------------------------------------------------------------------
 * Provenance and evidence-preservation policy
 * ---------------------------------------------------------------------
 * minPoseScore is explicitly set to 0 in the model config below --
 * overriding pose-detection's own default (0.25) on purpose. That
 * default would silently filter out low-confidence pose attempts before
 * this module ever sees them, which is exactly the kind of quiet
 * evidence loss this whole system exists to prevent. With the threshold
 * at 0, MoveNet always reports whatever it actually found -- including a
 * fully-attempted pose whose keypoints are almost entirely
 * low-confidence, when the frame doesn't clearly show a person. Deciding
 * what confidence counts as "reliable enough to use" is a policy
 * decision for whichever caller consumes this evidence later, not
 * something this measurement layer decides on their behalf by silently
 * dropping data.
 *
 * Every keypoint is its own separately-provenanced MeasuredValue, all 17
 * kept verbatim per detected pose -- never filtered, never replaced with
 * a null placeholder for a low-confidence one. A body part MoveNet
 * genuinely could not localize confidently (occluded, off-frame, or no
 * person present at all) shows up as a keypoint with a real, low
 * `confidence` -- that low number IS the evidence of partial/failed
 * detection, not an omission needing a separate "did this fail?" flag.
 * confidence is the keypoint's own reported score, matching this whole
 * system's established convention (sceneMeasurementGeometryDetector.ts's
 * bbox detections) of using the detector's real per-value score, never a
 * fabricated constant.
 *
 * FramePoseMeasurementResult.ranToCompletion mirrors
 * FrameGeometryMeasurementResult's identical field for the identical
 * reason: distinguishes "the detector genuinely ran and found zero poses
 * worth reporting" (poses: []) from "this measurement was never
 * attempted" -- a real failure to run (decode error, model exception)
 * still propagates as a thrown error rather than being absorbed into
 * this result.
 *
 * No synthetic data enters this file: it only ever operates on
 * ExtractedFrameEvidence, already fail-closed-verified by
 * sceneMeasurementEvidenceCore.ts's buildMeasuredValue() before this
 * module sees it -- there is no path from
 * datasets/movie_reconstruction/titanic*'s synthetic skeleton fields
 * (titanic-body-pose-registry.json) into anything this file produces.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import { createDetector, SupportedModels, movenet, type PoseDetector } from '@tensorflow-models/pose-detection';
import { decodeJpegFrameToTensor } from './sceneMeasurementGeometryDetector.js';
import {
  buildMeasuredValue,
  type ExtractedFrameEvidence,
  type MeasuredValue,
} from './sceneMeasurementEvidenceCore.js';

const POSE_EXTRACTION_METHOD = 'movenet-singlepose-lightning' as const;

export interface KeypointMeasurement {
  name: string;
  x: number;
  y: number;
}

export interface PoseMeasurement {
  poseScore: number | null;
  keypoints: readonly MeasuredValue<KeypointMeasurement>[];
}

export interface FramePoseMeasurementResult {
  /** True once the detector has actually run to completion for this
   *  frame -- distinguishes "ran, found zero poses worth reporting" from
   *  "never attempted". A real failure to run throws instead. */
  ranToCompletion: true;
  poses: readonly PoseMeasurement[];
}

let cachedDetector: PoseDetector | null = null;

/**
 * Loads the MoveNet detector exactly once per process and reuses it --
 * loading fetches real model weights over the network on first call.
 * minPoseScore:0 -- see file header's evidence-preservation policy.
 */
async function loadDetector(): Promise<PoseDetector> {
  if (cachedDetector === null) {
    cachedDetector = await createDetector(SupportedModels.MoveNet, {
      modelType: movenet.modelType.SINGLEPOSE_LIGHTNING,
      minPoseScore: 0,
    });
  }
  return cachedDetector;
}

/**
 * Measures body keypoints for a single real frame that
 * sceneMeasurementEvidenceCore.ts already extracted and fingerprinted.
 * Throws on a genuine failure to run; returns a result with
 * ranToCompletion:true and an empty poses array when the detector runs
 * successfully but reports nothing -- these outcomes are never
 * conflated. Partial/low-confidence detections are never filtered out
 * of a reported pose's keypoints.
 */
export async function detectFramePose(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): Promise<FramePoseMeasurementResult> {
  const absoluteFramePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absoluteFramePath)) {
    throw new Error(`detectFramePose: frame file missing at ${evidence.frame_path}`);
  }

  const detector = await loadDetector();
  const imageTensor = decodeJpegFrameToTensor(absoluteFramePath);
  let rawPoses: Awaited<ReturnType<PoseDetector['estimatePoses']>>;
  try {
    rawPoses = await detector.estimatePoses(imageTensor);
  } finally {
    imageTensor.dispose();
  }

  const poses: PoseMeasurement[] = rawPoses.map((pose) => {
    const keypoints: MeasuredValue<KeypointMeasurement>[] = pose.keypoints.map((keypoint) => {
      const confidence = typeof keypoint.score === 'number' ? keypoint.score : null;
      const measurement: KeypointMeasurement = {
        name: keypoint.name ?? 'unknown',
        x: keypoint.x,
        y: keypoint.y,
      };
      return buildMeasuredValue(projectRoot, evidence, POSE_EXTRACTION_METHOD, confidence, measurement);
    });
    return {
      poseScore: typeof pose.score === 'number' ? pose.score : null,
      keypoints: Object.freeze(keypoints),
    };
  });

  return { ranToCompletion: true, poses: Object.freeze(poses) };
}

/** The 17 COCO keypoint names MoveNet reports, in case a caller needs to
 *  validate completeness of a returned pose's keypoint set without
 *  hardcoding this list again elsewhere. */
export const MOVENET_KEYPOINT_NAMES = Object.freeze([
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const);
