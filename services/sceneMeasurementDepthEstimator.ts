/**
 * [Scene Measurement Depth Estimator]
 *
 * Real monocular depth estimation on top of sceneMeasurementEvidenceCore.ts
 * (ExtractedFrameEvidence, InferredValue, buildInferredValue,
 * measureFrameDimensions) and sceneMeasurementGeometryDetector.ts
 * (decodeJpegFrameToTensor) -- both reused, neither re-derived.
 *
 * ---------------------------------------------------------------------
 * Depth model candidate investigation
 * ---------------------------------------------------------------------
 * There is no official TensorFlow.js "model garden" package for depth
 * estimation the way coco-ssd/pose-detection exist for detection/pose --
 * this required a different route:
 *  - A raw tfjs-format depth model hosted somewhere findable was
 *    considered but rejected: it would mean trusting an unverified
 *    third-party TFJS conversion with no canonical source to check
 *    against, exactly the kind of thing this whole system exists to
 *    avoid doing with data.
 *  - onnxruntime-node + MiDaS v2.1 small (ONNX): SELECTED. MiDaS
 *    (isl-org, Intel ISL) is the most established, widely-cited
 *    monocular depth model; its ONNX export is published directly by
 *    the original authors at github.com/isl-org/MiDaS's own v2_1
 *    release (verified via GitHub's public release API before
 *    downloading, not a search-result guess:
 *    https://github.com/isl-org/MiDaS/releases/download/v2_1/model-small.onnx,
 *    saved locally as models/midas_v21_small_256.onnx, ~64MB). The
 *    "small" variant (EfficientNet-Lite3 encoder, 256x256 input) is
 *    used, matching this whole system's "start minimal" discipline.
 *    onnxruntime-node installs with a prebuilt native binary on this
 *    platform (confirmed by smoke test -- no node-gyp/Visual Studio
 *    build required, unlike tfjs-node earlier in this session).
 *
 * ---------------------------------------------------------------------
 * Why INFERRED, never MEASURED -- enforced structurally, not just named
 * ---------------------------------------------------------------------
 * This file's only provenance-producing function is buildDepthMapValue()
 * below, which calls buildInferredValue() -- buildMeasuredValue() is
 * never imported here at all. Monocular depth-from-a-single-2D-frame is
 * fundamentally ill-posed (the same 2D image is consistent with many
 * different 3D scenes); MiDaS's output is a learned estimate of relative
 * inverse depth, not a direct read of anything present in the pixels the
 * way a bounding box or keypoint coordinate is. This matches the
 * classification already reasoned through in this system's own
 * foundation design: depth is MEASURED only with real depth
 * sensors/multi-view geometry, INFERRED otherwise.
 *
 * confidence is always null here -- MiDaS has no per-pixel (or
 * per-frame) confidence/uncertainty head at all, so null is the only
 * honest value; reporting some fabricated number (even 1.0) would
 * misrepresent an estimate as a certainty this model never claims to
 * have. This is the intended use of ProvenanceValue's `confidence:
 * number | null` contract, not a workaround of it.
 *
 * ---------------------------------------------------------------------
 * bbox/pose <-> depth connectivity
 * ---------------------------------------------------------------------
 * sampleDepthAtOriginalFramePosition() and buildDepthAtPositionValue()
 * below demonstrate that a depth map produced here can be sampled at any
 * pixel position already reported by sceneMeasurementGeometryDetector.ts
 * (a bbox's position2D) or sceneMeasurementPoseDetector.ts (a keypoint's
 * x/y) -- these are already the same pixel coordinate space (the
 * original frame), just needing rescaling to the depth map's own
 * (smaller, fixed 256x256) resolution. The sampled result is itself
 * INFERRED (its accuracy is entirely gated by the underlying depth
 * estimate, not by how precisely the measured position was located) and
 * still carries the same source_frame -- provenance is not lost or
 * blurred when values from different modules are combined this way.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence, already fail-closed-verified before this
 * module ever sees it -- there is no path from
 * datasets/movie_reconstruction/titanic*'s synthetic depth fields
 * (titanic-spatial-depth-registry.json's foreground_depth/
 * midground_depth/background_depth/parallax_class) into anything this
 * file produces.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import * as ort from 'onnxruntime-node';
import { decodeJpegFrameToTensor } from './sceneMeasurementGeometryDetector.js';
import {
  buildInferredValue,
  type ExtractedFrameEvidence,
  type InferredValue,
} from './sceneMeasurementEvidenceCore.js';

const DEPTH_EXTRACTION_METHOD = 'midas-v2.1-small-256-onnx' as const;
const MODEL_RELATIVE_PATH = 'models/midas_v21_small_256.onnx';
const MODEL_INPUT_SIZE = 256;
// Standard ImageNet normalization MiDaS's small model was trained with.
const IMAGENET_MEAN = [0.485, 0.456, 0.406] as const;
const IMAGENET_STD = [0.229, 0.224, 0.225] as const;

export interface DepthMapMeasurement {
  width: number;
  height: number;
  /** Row-major, length width*height. Relative inverse depth (MiDaS's own
   *  convention: higher value = closer) -- NOT metric depth, and not
   *  comparable in absolute units across different frames/videos. */
  values: Float32Array;
  min: number;
  max: number;
  mean: number;
}

export interface Position2D {
  x: number;
  y: number;
}

let cachedSession: ort.InferenceSession | null = null;

async function loadDepthSession(projectRoot: string): Promise<ort.InferenceSession> {
  if (cachedSession === null) {
    const modelAbsolutePath = path.resolve(projectRoot, MODEL_RELATIVE_PATH);
    if (!fs.existsSync(modelAbsolutePath)) {
      throw new Error(
        `loadDepthSession: model file missing at ${MODEL_RELATIVE_PATH}. Expected the official MiDaS v2.1 small ONNX export downloaded from isl-org/MiDaS's own v2_1 GitHub release.`
      );
    }
    cachedSession = await ort.InferenceSession.create(modelAbsolutePath);
  }
  return cachedSession;
}

/**
 * Resizes a decoded frame tensor to MiDaS's expected 256x256 input,
 * applies ImageNet normalization, and reorders HWC -> CHW for ONNX's
 * NCHW input convention. Pure preprocessing, no provenance concerns of
 * its own -- the provenance tag is attached once, to the final result.
 */
function preprocessForMidas(imageTensor: tf.Tensor3D): Float32Array {
  const resized = tf.image.resizeBilinear(imageTensor, [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  const normalized = tf.tidy(() =>
    resized
      .toFloat()
      .div(255)
      .sub(tf.tensor1d([...IMAGENET_MEAN]))
      .div(tf.tensor1d([...IMAGENET_STD]))
  );
  const hwcData = normalized.dataSync() as Float32Array;
  resized.dispose();
  normalized.dispose();

  const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const chwData = new Float32Array(3 * pixelCount);
  for (let i = 0; i < pixelCount; i++) {
    chwData[i] = hwcData[i * 3];
    chwData[pixelCount + i] = hwcData[i * 3 + 1];
    chwData[2 * pixelCount + i] = hwcData[i * 3 + 2];
  }
  return chwData;
}

/**
 * Runs real monocular depth estimation on a single real frame already
 * extracted and fingerprinted by sceneMeasurementEvidenceCore.ts. Always
 * returns an InferredValue -- never MeasuredValue -- with confidence:
 * null, since MiDaS reports no uncertainty signal.
 */
export async function estimateFrameDepth(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): Promise<InferredValue<DepthMapMeasurement>> {
  const absoluteFramePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absoluteFramePath)) {
    throw new Error(`estimateFrameDepth: frame file missing at ${evidence.frame_path}`);
  }

  const session = await loadDepthSession(projectRoot);
  const imageTensor = decodeJpegFrameToTensor(absoluteFramePath);
  let inputData: Float32Array;
  try {
    inputData = preprocessForMidas(imageTensor);
  } finally {
    imageTensor.dispose();
  }

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const inputTensor = new ort.Tensor('float32', inputData, [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);
  const results = await session.run({ [inputName]: inputTensor });
  const outputTensor = results[outputName];
  const depthValues = outputTensor.data as Float32Array;

  // Output is [1, H, W] or [H, W] depending on export -- derive
  // width/height from the tensor's own reported dims rather than
  // assuming, since trusting an unverified assumption here is exactly
  // the class of silent error this system exists to avoid.
  const dims = outputTensor.dims;
  const height = dims[dims.length - 2];
  const width = dims[dims.length - 1];
  if (height * width !== depthValues.length) {
    throw new Error(
      `estimateFrameDepth: depth output size mismatch -- dims=${JSON.stringify(dims)} but got ${depthValues.length} values.`
    );
  }

  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < depthValues.length; i++) {
    const v = depthValues[i];
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  const depthMap: DepthMapMeasurement = {
    width,
    height,
    values: depthValues,
    min,
    max,
    mean: sum / depthValues.length,
  };

  return buildInferredValue(projectRoot, evidence, DEPTH_EXTRACTION_METHOD, null, depthMap);
}

/**
 * Samples a depth map (fixed MODEL_INPUT_SIZE resolution) at a pixel
 * position expressed in the ORIGINAL frame's coordinate space -- exactly
 * the coordinate space sceneMeasurementGeometryDetector.ts's position2D
 * and sceneMeasurementPoseDetector.ts's keypoint x/y already use.
 * Nearest-neighbor sampling (no interpolation) -- sufficient to
 * demonstrate connectivity without overstating precision this composite
 * value doesn't actually have.
 */
export function sampleDepthAtOriginalFramePosition(
  depthMap: DepthMapMeasurement,
  originalFrameDimensions: { width: number; height: number },
  position: Position2D
): number {
  const depthX = Math.round((position.x / originalFrameDimensions.width) * (depthMap.width - 1));
  const depthY = Math.round((position.y / originalFrameDimensions.height) * (depthMap.height - 1));
  const clampedX = Math.max(0, Math.min(depthMap.width - 1, depthX));
  const clampedY = Math.max(0, Math.min(depthMap.height - 1, depthY));
  return depthMap.values[clampedY * depthMap.width + clampedX];
}

export interface DepthAtPositionMeasurement {
  relativeInverseDepth: number;
  sampledAtOriginalFramePosition: Position2D;
}

/**
 * Demonstrates the bbox/pose <-> depth connection point: given a
 * position already reported by the geometry or pose detector for this
 * SAME frame, produces the depth map's estimate at that location as its
 * own InferredValue (never MeasuredValue -- its accuracy is entirely
 * gated by the underlying depth estimate, not by how precisely the
 * measured position was located). extractionMethodSuffix should name
 * which upstream measurement supplied the position (e.g.
 * 'bbox-position2D' or 'pose-keypoint-nose') so the composite lineage
 * stays legible.
 */
export function buildDepthAtPositionValue(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  depthMap: DepthMapMeasurement,
  originalFrameDimensions: { width: number; height: number },
  position: Position2D,
  extractionMethodSuffix: string
): InferredValue<DepthAtPositionMeasurement> {
  const relativeInverseDepth = sampleDepthAtOriginalFramePosition(depthMap, originalFrameDimensions, position);
  return buildInferredValue(
    projectRoot,
    evidence,
    `${DEPTH_EXTRACTION_METHOD}+sample-at(${extractionMethodSuffix})`,
    null,
    { relativeInverseDepth, sampledAtOriginalFramePosition: position }
  );
}
