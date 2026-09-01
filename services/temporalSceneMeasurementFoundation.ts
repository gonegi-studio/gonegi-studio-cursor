import fs from 'node:fs';
import path from 'node:path';
import * as jpeg from 'jpeg-js';
import { fingerprintSourceVideo, verifyFrameSourceBinding, type ExtractedFrameEvidence } from './sceneMeasurementEvidenceCore.js';
import { detectFrameGeometry, type DetectedObjectGeometry } from './sceneMeasurementGeometryDetector.js';

export type TemporalProvenance = 'MEASURED' | 'INFERRED';

export interface TemporalValue<T> {
  provenance: TemporalProvenance;
  value: T;
  source_frames: readonly [string, string];
  extraction_method: string;
  confidence: number | null;
}

export interface TemporalObjectDisplacement {
  class: string;
  from_detection_index: number;
  to_detection_index: number;
  association: TemporalValue<{ method: 'same-class-nearest-centroid' }>;
  displacement: TemporalValue<{ dx_pixels: number; dy_pixels: number; magnitude_pixels: number; normalized_magnitude: number }>;
}

export interface TemporalFramePairMeasurement {
  from_frame_index: number;
  to_frame_index: number;
  delta_seconds: number;
  object_displacements: readonly TemporalObjectDisplacement[];
  camera_motion_evidence: TemporalValue<{ dx_pixels: number; dy_pixels: number; magnitude_pixels: number; residual_mean_absolute_luma_difference: number }>;
  scene_motion_energy: TemporalValue<{ mean_absolute_luma_difference: number; changed_pixel_ratio: number }>;
  shot_edit_boundary: TemporalValue<{ boundary: true; luma_discontinuity: number }> | null;
}

export interface TemporalSceneMeasurement {
  source_video_path: string;
  source_video_fingerprint: string;
  fps: number;
  frame_indices: readonly number[];
  frames: readonly ExtractedFrameEvidence[];
  pairs: readonly TemporalFramePairMeasurement[];
  verdict: 'TEMPORAL_MEASUREMENT_READY' | 'REAL_GAP';
  reason: string;
}

interface GrayFrame { width: number; height: number; data: Float32Array }

function decodeGray(projectRoot: string, evidence: ExtractedFrameEvidence): GrayFrame {
  const decoded = jpeg.decode(fs.readFileSync(path.resolve(projectRoot, evidence.frame_path)), { useTArray: true });
  const data = new Float32Array(decoded.width * decoded.height);
  for (let i = 0; i < data.length; i++) {
    data[i] = 0.2126 * decoded.data[i * 4] + 0.7152 * decoded.data[i * 4 + 1] + 0.0722 * decoded.data[i * 4 + 2];
  }
  return { width: decoded.width, height: decoded.height, data };
}

function measured<T>(frames: readonly [string, string], method: string, value: T, confidence: number | null = 1): TemporalValue<T> {
  return { provenance: 'MEASURED', value, source_frames: frames, extraction_method: method, confidence };
}

function inferred<T>(frames: readonly [string, string], method: string, value: T, confidence: number | null): TemporalValue<T> {
  return { provenance: 'INFERRED', value, source_frames: frames, extraction_method: method, confidence };
}

function frameDifference(a: GrayFrame, b: GrayFrame): { mad: number; changedRatio: number } {
  if (a.width !== b.width || a.height !== b.height) throw new Error('temporal frames have different dimensions');
  let sum = 0;
  let changed = 0;
  for (let i = 0; i < a.data.length; i++) {
    const d = Math.abs(a.data[i] - b.data[i]);
    sum += d;
    if (d >= 10) changed++;
  }
  return { mad: sum / a.data.length, changedRatio: changed / a.data.length };
}

function measureGlobalTranslation(a: GrayFrame, b: GrayFrame): { dx: number; dy: number; residual: number } {
  const scale = 8;
  const maxShift = 4;
  let best = { dx: 0, dy: 0, residual: Number.POSITIVE_INFINITY };
  for (let dy = -maxShift; dy <= maxShift; dy++) for (let dx = -maxShift; dx <= maxShift; dx++) {
    let sum = 0;
    let count = 0;
    for (let y = 16; y < a.height - 16; y += scale) for (let x = 16; x < a.width - 16; x += scale) {
      const bx = x + dx * scale;
      const by = y + dy * scale;
      if (bx < 0 || by < 0 || bx >= b.width || by >= b.height) continue;
      sum += Math.abs(a.data[y * a.width + x] - b.data[by * b.width + bx]);
      count++;
    }
    const residual = count === 0 ? Number.POSITIVE_INFINITY : sum / count;
    if (residual < best.residual) best = { dx: dx * scale, dy: dy * scale, residual };
  }
  return best;
}

function associateDetections(
  frames: readonly [string, string],
  width: number,
  height: number,
  from: readonly { value: DetectedObjectGeometry; confidence: number | null }[],
  to: readonly { value: DetectedObjectGeometry; confidence: number | null }[]
): TemporalObjectDisplacement[] {
  const used = new Set<number>();
  const result: TemporalObjectDisplacement[] = [];
  from.forEach((a, ai) => {
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;
    to.forEach((b, bi) => {
      if (used.has(bi) || b.value.class !== a.value.class) return;
      const dx = b.value.position2D.x - a.value.position2D.x;
      const dy = b.value.position2D.y - a.value.position2D.y;
      const distance = Math.hypot(dx, dy);
      if (distance < bestDistance) { bestDistance = distance; bestIndex = bi; }
    });
    if (bestIndex < 0) return;
    used.add(bestIndex);
    const b = to[bestIndex];
    const dx = b.value.position2D.x - a.value.position2D.x;
    const dy = b.value.position2D.y - a.value.position2D.y;
    result.push({
      class: a.value.class,
      from_detection_index: ai,
      to_detection_index: bestIndex,
      association: inferred(frames, 'same-class-nearest-centroid-association', { method: 'same-class-nearest-centroid' }, Math.min(a.confidence ?? 0, b.confidence ?? 0)),
      displacement: measured(frames, 'bbox-centroid-difference-over-associated-real-detections', {
        dx_pixels: dx,
        dy_pixels: dy,
        magnitude_pixels: Math.hypot(dx, dy),
        normalized_magnitude: Math.hypot(dx / width, dy / height),
      }, Math.min(a.confidence ?? 0, b.confidence ?? 0)),
    });
  });
  return result;
}

export async function measureTemporalScene(
  projectRoot: string,
  sourceVideoPath: string,
  fps: number,
  frameIndices: readonly number[],
  frames: readonly ExtractedFrameEvidence[]
): Promise<TemporalSceneMeasurement> {
  if (frames.length < 2 || frames.length !== frameIndices.length) {
    return { source_video_path: sourceVideoPath, source_video_fingerprint: fingerprintSourceVideo(projectRoot, sourceVideoPath), fps, frame_indices: frameIndices, frames, pairs: [], verdict: 'REAL_GAP', reason: 'at least two aligned canonical frames are required' };
  }
  const sourceFingerprint = fingerprintSourceVideo(projectRoot, sourceVideoPath);
  for (let i = 0; i < frames.length; i++) {
    if (!verifyFrameSourceBinding(projectRoot, frames[i]).valid || frames[i].source_video_fingerprint !== sourceFingerprint) throw new Error(`frame ${frameIndices[i]} failed source binding`);
    if (i > 0 && frameIndices[i] !== frameIndices[i - 1] + 1) throw new Error('frame sequence is not consecutive');
  }
  const geometries = await Promise.all(frames.map((f) => detectFrameGeometry(projectRoot, f)));
  const grays = frames.map((f) => decodeGray(projectRoot, f));
  const pairs: TemporalFramePairMeasurement[] = [];
  for (let i = 0; i < frames.length - 1; i++) {
    const hashes: readonly [string, string] = [frames[i].frame_fingerprint, frames[i + 1].frame_fingerprint];
    const diff = frameDifference(grays[i], grays[i + 1]);
    const camera = measureGlobalTranslation(grays[i], grays[i + 1]);
    // Boundary classification is intentionally absent at this foundation stage:
    // temporal discontinuity is measured, but no validated boundary classifier exists.
    pairs.push({
      from_frame_index: frameIndices[i], to_frame_index: frameIndices[i + 1], delta_seconds: 1 / fps,
      object_displacements: associateDetections(hashes, grays[i].width, grays[i].height, geometries[i].detections, geometries[i + 1].detections),
      camera_motion_evidence: measured(hashes, 'exhaustive-global-luma-translation-block-match', { dx_pixels: camera.dx, dy_pixels: camera.dy, magnitude_pixels: Math.hypot(camera.dx, camera.dy), residual_mean_absolute_luma_difference: camera.residual }, null),
      scene_motion_energy: measured(hashes, 'pixelwise-absolute-luma-difference', { mean_absolute_luma_difference: diff.mad, changed_pixel_ratio: diff.changedRatio }),
      shot_edit_boundary: null,
    });
  }
  return { source_video_path: sourceVideoPath, source_video_fingerprint: sourceFingerprint, fps, frame_indices: Object.freeze([...frameIndices]), frames: Object.freeze([...frames]), pairs: Object.freeze(pairs), verdict: 'TEMPORAL_MEASUREMENT_READY', reason: `${frames.length} consecutive canonical frames produced ${pairs.length} real temporal interval(s)` };
}
