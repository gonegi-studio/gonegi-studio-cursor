/**
 * [Scene Measurement Lighting Analyzer]
 *
 * Real pixel-based lighting measurement on top of
 * sceneMeasurementEvidenceCore.ts (ExtractedFrameEvidence, MeasuredValue,
 * InferredValue, buildMeasuredValue, buildInferredValue,
 * measureFrameDimensions, decodeFrameToGrayscaleBytes,
 * computeGrayscaleByteStatistics -- all reused directly) and
 * sceneMeasurementGeometryDetector.ts (decodeJpegFrameToTensor, reused
 * for RGB pixel data). No new model, no new dependency -- everything
 * here is direct pixel arithmetic, the same category of computation
 * computeGrayscaleByteStatistics() already established.
 *
 * ---------------------------------------------------------------------
 * MEASURED vs. INFERRED -- the actual dividing line this file draws
 * ---------------------------------------------------------------------
 * MEASURED (measureFrameLighting): luminance mean/min/max/stdDev
 * (stdDev IS this contract's definition of "contrast" -- the standard,
 * direct image-processing meaning of the term, not a judgment call),
 * per-channel RGB mean/min/max, and 2x2 quadrant luminance means (a
 * genuine spatial DISTRIBUTION, not a single scalar) -- every one of
 * these is a deterministic arithmetic pass over real, already-decoded
 * pixel bytes. Confidence is 1.0 throughout, the same convention
 * measureFrameDimensions()/measureFrameLuminanceStats() already use for
 * deterministic pixel arithmetic with no uncertainty to report.
 *
 * INFERRED (interpretFrameLighting): light DIRECTION, light TYPE
 * (hard/soft), and color TEMPERATURE mood are never read off pixels
 * directly -- they are heuristic judgments ABOUT what the measured
 * statistics above might imply (a brighter quadrant COULD mean a light
 * source there, but could just as easily mean a bright object under even
 * lighting; high contrast COULD mean hard directional light, but could
 * mean a high-contrast subject under soft light). Kept in a completely
 * separate function from measureFrameLighting() -- this file never
 * blends a judgment into something labeled MEASURED, and
 * interpretFrameLighting() never calls buildMeasuredValue.
 *
 * Each of the three judgments is its own InferredValue with its own
 * confidence (never a single blended confidence covering all three,
 * since they are three distinct claims of different certainty) --
 * confidence is a real, documented heuristic strength-of-signal formula
 * (how large the measured spatial/contrast/color difference actually is,
 * normalized to [0,1]), not a fabricated constant and not null, since
 * unlike MiDaS's depth output there genuinely is a well-defined signal
 * strength to report here.
 *
 * ---------------------------------------------------------------------
 * lighting_dna -- explicitly not reused as a measured value
 * ---------------------------------------------------------------------
 * This file never reads services/geminiService.ts's/CharacterBook's
 * `lighting_dna`/styleCore prose fields, and never reads
 * datasets/movie_reconstruction's registries at all. Every value
 * produced here is computed fresh from real decoded pixel bytes of a
 * real extracted frame -- there is no code path from any pre-existing
 * lighting description string into anything this file returns.
 *
 * No synthetic data enters this file: it only operates on
 * ExtractedFrameEvidence, already fail-closed-verified upstream.
 */

import fs from 'node:fs';
import path from 'node:path';
import { decodeJpegFrameToTensor } from './sceneMeasurementGeometryDetector.js';
import {
  buildMeasuredValue,
  buildInferredValue,
  measureFrameDimensions,
  decodeFrameToGrayscaleBytes,
  computeGrayscaleByteStatistics,
  type ExtractedFrameEvidence,
  type MeasuredValue,
  type InferredValue,
  type GrayscaleByteStatistics,
} from './sceneMeasurementEvidenceCore.js';

const LIGHTING_MEASUREMENT_METHOD = 'pixel-lighting-statistics-v1' as const;

export interface ColorChannelStatistics {
  red: { mean: number; min: number; max: number };
  green: { mean: number; min: number; max: number };
  blue: { mean: number; min: number; max: number };
  sampleCount: number;
}

export interface QuadrantLuminanceMeans {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

export interface FrameLightingMeasurement {
  /** stdDev here IS this contract's contrast measurement. */
  luminance: GrayscaleByteStatistics;
  color: ColorChannelStatistics;
  quadrantLuminance: QuadrantLuminanceMeans;
}

function computeColorChannelStatistics(rgbData: Int32Array, pixelCount: number): ColorChannelStatistics {
  const sums = [0, 0, 0];
  const mins = [255, 255, 255];
  const maxs = [0, 0, 0];
  for (let i = 0; i < pixelCount; i++) {
    for (let c = 0; c < 3; c++) {
      const v = rgbData[i * 3 + c];
      sums[c] += v;
      if (v < mins[c]) mins[c] = v;
      if (v > maxs[c]) maxs[c] = v;
    }
  }
  return {
    red: { mean: sums[0] / pixelCount, min: mins[0], max: maxs[0] },
    green: { mean: sums[1] / pixelCount, min: mins[1], max: maxs[1] },
    blue: { mean: sums[2] / pixelCount, min: mins[2], max: maxs[2] },
    sampleCount: pixelCount,
  };
}

function computeQuadrantLuminanceMeans(grayscaleBytes: Buffer, width: number, height: number): QuadrantLuminanceMeans {
  const halfW = Math.floor(width / 2);
  const halfH = Math.floor(height / 2);
  const sums = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  const counts = { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 };
  for (let y = 0; y < height; y++) {
    const isTop = y < halfH;
    for (let x = 0; x < width; x++) {
      const isLeft = x < halfW;
      const key = isTop ? (isLeft ? 'topLeft' : 'topRight') : isLeft ? 'bottomLeft' : 'bottomRight';
      sums[key] += grayscaleBytes[y * width + x];
      counts[key] += 1;
    }
  }
  return {
    topLeft: sums.topLeft / counts.topLeft,
    topRight: sums.topRight / counts.topRight,
    bottomLeft: sums.bottomLeft / counts.bottomLeft,
    bottomRight: sums.bottomRight / counts.bottomRight,
  };
}

/**
 * Measures real pixel-based lighting statistics for a single real frame
 * already extracted and fingerprinted by sceneMeasurementEvidenceCore.ts.
 * Always MeasuredValue -- confidence 1.0, deterministic arithmetic, same
 * convention as measureFrameDimensions()/measureFrameLuminanceStats().
 */
export function measureFrameLighting(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): MeasuredValue<FrameLightingMeasurement> {
  const absoluteFramePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absoluteFramePath)) {
    throw new Error(`measureFrameLighting: frame file missing at ${evidence.frame_path}`);
  }

  const dimensions = measureFrameDimensions(projectRoot, evidence);
  const grayscaleBytes = decodeFrameToGrayscaleBytes(projectRoot, evidence.frame_path);
  const luminance = computeGrayscaleByteStatistics(grayscaleBytes);
  const quadrantLuminance = computeQuadrantLuminanceMeans(grayscaleBytes, dimensions.value.width, dimensions.value.height);

  const imageTensor = decodeJpegFrameToTensor(absoluteFramePath);
  let color: ColorChannelStatistics;
  try {
    const rgbData = imageTensor.dataSync() as unknown as Int32Array;
    const pixelCount = dimensions.value.width * dimensions.value.height;
    color = computeColorChannelStatistics(rgbData, pixelCount);
  } finally {
    imageTensor.dispose();
  }

  return buildMeasuredValue(projectRoot, evidence, LIGHTING_MEASUREMENT_METHOD, 1.0, {
    luminance,
    color,
    quadrantLuminance,
  });
}

export type LightDirectionGuess = 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right' | 'front-even';
export type LightTypeGuess = 'hard' | 'soft';
export type ColorTemperatureGuess = 'warm' | 'cool' | 'neutral';

export interface FrameLightingInterpretation {
  lightDirection: InferredValue<{ guess: LightDirectionGuess }>;
  lightType: InferredValue<{ guess: LightTypeGuess }>;
  colorTemperature: InferredValue<{ guess: ColorTemperatureGuess }>;
}

/**
 * Interprets already-measured lighting statistics into heuristic
 * judgments -- never calls buildMeasuredValue, only buildInferredValue.
 * Each judgment's confidence is a documented, own-computed
 * strength-of-signal heuristic (how large the underlying measured
 * difference actually is, normalized to [0,1]) -- not fabricated, not
 * borrowed from an unrelated source, and not null, since a well-defined
 * signal-strength formula genuinely exists here (unlike depth
 * estimation's MiDaS, which reports no uncertainty at all).
 */
export function interpretFrameLighting(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  measured: FrameLightingMeasurement
): FrameLightingInterpretation {
  const { quadrantLuminance, luminance, color } = measured;

  // --- Light direction: brightest quadrant, confidence = normalized spread ---
  const quadrants: [LightDirectionGuess, number][] = [
    ['upper-left', quadrantLuminance.topLeft],
    ['upper-right', quadrantLuminance.topRight],
    ['lower-left', quadrantLuminance.bottomLeft],
    ['lower-right', quadrantLuminance.bottomRight],
  ];
  const brightest = quadrants.reduce((a, b) => (b[1] > a[1] ? b : a));
  const darkest = quadrants.reduce((a, b) => (b[1] < a[1] ? b : a));
  const quadrantSpread = brightest[1] - darkest[1];
  // A spread of 128 (half the 0-255 range) or more is treated as a fully
  // clear directional signal; below that, confidence scales linearly.
  // Below a small absolute threshold (10), the frame is considered
  // evenly lit rather than forcing a spurious direction.
  const directionGuess: LightDirectionGuess = quadrantSpread < 10 ? 'front-even' : brightest[0];
  const directionConfidence = quadrantSpread < 10 ? Math.max(0, quadrantSpread / 10) : Math.min(1, quadrantSpread / 128);
  const lightDirection = buildInferredValue(
    projectRoot,
    evidence,
    'lighting-direction-guess-from-quadrant-luminance-v1',
    directionConfidence,
    { guess: directionGuess }
  );

  // --- Light type: hard (high contrast) vs. soft (low contrast) ---
  // A stdDev of 80 or more (out of a possible ~127 max for 8-bit
  // grayscale) is treated as a fully clear "hard light" signal;
  // confidence scales linearly below that in either direction from a
  // 40-point midline.
  const typeGuess: LightTypeGuess = luminance.stdDev >= 40 ? 'hard' : 'soft';
  const typeConfidence = Math.min(1, Math.abs(luminance.stdDev - 40) / 40);
  const lightType = buildInferredValue(projectRoot, evidence, 'lighting-type-guess-from-contrast-v1', typeConfidence, {
    guess: typeGuess,
  });

  // --- Color temperature: red-vs-blue channel bias ---
  const rbDifference = color.red.mean - color.blue.mean;
  const temperatureGuess: ColorTemperatureGuess = Math.abs(rbDifference) < 5 ? 'neutral' : rbDifference > 0 ? 'warm' : 'cool';
  const temperatureConfidence = Math.min(1, Math.abs(rbDifference) / 60);
  const colorTemperature = buildInferredValue(
    projectRoot,
    evidence,
    'color-temperature-guess-from-rgb-channel-bias-v1',
    temperatureConfidence,
    { guess: temperatureGuess }
  );

  return { lightDirection, lightType, colorTemperature };
}
