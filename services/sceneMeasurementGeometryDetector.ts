/**
 * [Scene Measurement Geometry Detector]
 *
 * First real (not synthesized, not authored) character/object geometry
 * measurement on top of sceneMeasurementEvidenceCore.ts -- reuses that
 * module's ExtractedFrameEvidence, MeasuredValue, and
 * measureFrameDimensions() directly rather than re-deriving any of them.
 * This file adds exactly one new capability: bbox + 2D position +
 * frame-relative scale for detected characters/objects, via a real
 * pretrained object-detection model run against real decoded pixels.
 *
 * ---------------------------------------------------------------------
 * Detector candidate investigation (this file's own "select at least 1")
 * ---------------------------------------------------------------------
 * Considered:
 *  - onnxruntime-node + a YOLOv8 ONNX export: real and viable, but
 *    requires hand-rolling the model's output decode (anchor-free box
 *    regression across 3 scales) and non-max suppression from scratch --
 *    more surface area for a subtle correctness bug than this minimal
 *    phase warrants.
 *  - @tensorflow/tfjs-node + @tensorflow-models/coco-ssd: attempted
 *    first. tfjs-node's native binding requires node-gyp + a Visual
 *    Studio C++ build toolchain, confirmed NOT installed on this
 *    machine (`npm install` failed at the node-gyp configure step,
 *    "Could not find any Visual Studio installation"). Installing a full
 *    Visual Studio C++ workload is a far larger, more invasive system
 *    change than installing ffmpeg was -- not done here.
 *  - @tensorflow/tfjs (pure JS, no native binding) + @tensorflow-models/
 *    coco-ssd + jpeg-js (pure-JS JPEG decode, also no native binding):
 *    SELECTED. Installs cleanly with no compiler toolchain, gives a
 *    real pretrained COCO detector (bbox + class + confidence score
 *    directly, no manual NMS/decode needed), Apache-2.0 licensed
 *    (Google), and is plenty fast for the handful of frames this phase
 *    measures. coco-ssd's default base model ('lite_mobilenet_v2') is
 *    used as-is -- not swapped for a heavier one, matching "minimal".
 *
 * ---------------------------------------------------------------------
 * Provenance
 * ---------------------------------------------------------------------
 * Every geometry value below is MEASURED, never INFERRED or AUTHORED:
 * bbox and its class/score come directly from running the detector
 * against real decoded pixels; position2D (bbox center) and
 * frameRelativeScale (bbox height / frame height) are both deterministic
 * arithmetic over two already-measured quantities (the detection's own
 * bbox, and measureFrameDimensions()'s already-measured frame height,
 * reused from sceneMeasurementEvidenceCore.ts rather than re-measured
 * here) -- the same "deterministic arithmetic over measured inputs stays
 * MEASURED" convention already established by
 * computeGrayscaleByteStatistics() in that file. Their confidence is the
 * SAME confidence as the underlying detection's own score, since their
 * accuracy is entirely gated by how accurate that detection's bbox is --
 * no additional uncertainty is introduced by the arithmetic itself.
 *
 * Detection failure/absence is preserved as real evidence, never
 * silently dropped: FrameGeometryMeasurementResult always records
 * ranToCompletion + detections.length, so "the detector genuinely ran
 * and found zero objects in this frame" (a real, positive result) is
 * structurally distinguishable from "this measurement was never
 * attempted" -- a caller reading only `detections` could otherwise not
 * tell an empty array apart from a missing run. A genuine failure to run
 * at all (a decode error, a model inference exception) is NOT absorbed
 * into this result -- it propagates as a real thrown error, consistent
 * with this whole system's "observable, not silently absorbed" rule for
 * primary generation-adjacent data.
 *
 * No synthetic data enters this file at all: it only ever operates on
 * ExtractedFrameEvidence objects, which sceneMeasurementEvidenceCore.ts's
 * own buildMeasuredValue() already fail-closed-verifies against real
 * bytes on disk before this module ever sees them.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as tf from '@tensorflow/tfjs';
import * as jpeg from 'jpeg-js';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import {
  buildMeasuredValue,
  measureFrameDimensions,
  type ExtractedFrameEvidence,
  type MeasuredValue,
} from './sceneMeasurementEvidenceCore.js';

const DETECTOR_EXTRACTION_METHOD = 'coco-ssd-lite_mobilenet_v2' as const;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position2D {
  x: number;
  y: number;
}

export interface DetectedObjectGeometry {
  class: string;
  bbox: BoundingBox;
  position2D: Position2D;
  frameRelativeScale: number;
}

export interface FrameGeometryMeasurementResult {
  /** True once the detector has actually run to completion for this
   *  frame (regardless of how many objects it found) -- distinguishes a
   *  genuine "ran, found nothing" from "never attempted". Always true
   *  when this result is returned at all; a real failure to run throws
   *  instead of producing a result with this set to false. */
  ranToCompletion: true;
  detections: readonly MeasuredValue<DetectedObjectGeometry>[];
}

let cachedModel: cocoSsd.ObjectDetection | null = null;

/**
 * Loads the coco-ssd model exactly once per process and reuses it --
 * loading fetches real model weights (~lite_mobilenet_v2, a few MB) over
 * the network on first call in a given process; a caller measuring
 * multiple frames should reuse one call to detectFrameGeometry after the
 * first rather than triggering a redundant reload each time (this
 * function's own caching already prevents that regardless).
 */
async function loadDetector(): Promise<cocoSsd.ObjectDetection> {
  if (cachedModel === null) {
    cachedModel = await cocoSsd.load();
  }
  return cachedModel;
}

/**
 * Decodes a real JPEG frame file into an RGB tf.Tensor3D, via jpeg-js
 * (pure JS, no native binding) rather than tfjs-node's native
 * decodeImage -- consistent with this file's "no native compiler
 * toolchain" constraint. Exported so other real-pixel measurement
 * modules (e.g. sceneMeasurementPoseDetector.ts) reuse this decode step
 * rather than re-implementing it.
 */
export function decodeJpegFrameToTensor(absoluteFramePath: string): tf.Tensor3D {
  const fileBuffer = fs.readFileSync(absoluteFramePath);
  const decoded = jpeg.decode(fileBuffer, { useTArray: true });
  const { width, height, data } = decoded; // data is RGBA, one byte per channel

  const rgb = new Uint8Array(width * height * 3);
  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex++) {
    rgb[pixelIndex * 3] = data[pixelIndex * 4];
    rgb[pixelIndex * 3 + 1] = data[pixelIndex * 4 + 1];
    rgb[pixelIndex * 3 + 2] = data[pixelIndex * 4 + 2];
  }

  return tf.tensor3d(rgb, [height, width, 3], 'int32');
}

/**
 * Measures character/object bbox + 2D position + frame-relative scale
 * for a single real frame that sceneMeasurementEvidenceCore.ts already
 * extracted and fingerprinted. Throws on a genuine failure to run
 * (decode error, model inference error); returns a result with
 * ranToCompletion:true and an empty detections array when the detector
 * runs successfully but finds nothing -- these two outcomes are never
 * conflated.
 */
export async function detectFrameGeometry(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): Promise<FrameGeometryMeasurementResult> {
  const absoluteFramePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absoluteFramePath)) {
    throw new Error(`detectFrameGeometry: frame file missing at ${evidence.frame_path}`);
  }

  const frameDimensions = measureFrameDimensions(projectRoot, evidence);
  const model = await loadDetector();

  const imageTensor = decodeJpegFrameToTensor(absoluteFramePath);
  let rawDetections: cocoSsd.DetectedObject[];
  try {
    rawDetections = await model.detect(imageTensor);
  } finally {
    imageTensor.dispose();
  }

  const detections: MeasuredValue<DetectedObjectGeometry>[] = rawDetections.map((detection) => {
    const [x, y, width, height] = detection.bbox;
    const geometry: DetectedObjectGeometry = {
      class: detection.class,
      bbox: { x, y, width, height },
      position2D: { x: x + width / 2, y: y + height / 2 },
      frameRelativeScale: height / frameDimensions.value.height,
    };
    return buildMeasuredValue(projectRoot, evidence, DETECTOR_EXTRACTION_METHOD, detection.score, geometry);
  });

  return { ranToCompletion: true, detections: Object.freeze(detections) };
}
