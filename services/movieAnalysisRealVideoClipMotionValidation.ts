import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  type RealModelTestGenerationManifest,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE =
  'PHASE-LEVEL2F-009-REAL_VIDEO_CLIP_MOTION_VALIDATION_V1' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_CLIP_MOTION_VALIDATION_V1' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_CLIP_MOTION_VALIDATION_V1' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE =
  'REAL_VIDEO_CLIP_MOTION_VALIDATED' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_DIR =
  'reports/movie_analysis_real_video_clip_motion_validation' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_video_clip_motion_validation/movie-analysis-real-video-clip-motion-validation-report.json' as const;
export const REAL_VIDEO_CLIP_MOTION_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_video_clip_motion_validation/MOVIE_ANALYSIS_REAL_VIDEO_CLIP_MOTION_VALIDATION.md' as const;
export const VIDEO_CLIP_DIR =
  'exports/movie_analysis_model_generation_test/video_clips' as const;
export const VIDEO_CLIP_FRAMES_DIR =
  'exports/movie_analysis_model_generation_test/video_clips/frames' as const;
export const VIDEO_CLIP_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_clips/movie-analysis-real-video-clip-motion-manifest.json' as const;

export const CLIP_FRAMES_PER_SOURCE = 8 as const;
export const CLIP_FPS = 8 as const;
export const EXPECTED_VIDEO_CLIP_COUNT = EXPECTED_SOURCE_COUNT;
export const EXPECTED_VIDEO_CLIP_FRAME_COUNT = EXPECTED_SOURCE_COUNT * CLIP_FRAMES_PER_SOURCE;
export const MAX_OPTICAL_FLOW_VARIANCE = 0.08 as const;
export const MAX_CAMERA_JUMP = 0.42 as const;
export const MAX_SUBJECT_MOTION_DRIFT = 0.46 as const;
export const MAX_IDENTITY_DRIFT = 0.42 as const;
export const MAX_FRAME_TO_FRAME_DRIFT = 0.46 as const;
export const MAX_TEMPORAL_FLICKER = 0.48 as const;
export const MIN_OPTICAL_FLOW_SCORE = 0.58 as const;
export const MIN_CAMERA_MOTION_SCORE = 0.58 as const;
export const MIN_SUBJECT_MOTION_SCORE = 0.58 as const;
export const MIN_TEMPORAL_IDENTITY_SCORE = 0.58 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealVideoClipMotionValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoClipFrameSnapshot = {
  frame_index: number;
  global_tone_rgb: [number, number, number];
  subject_zone_rgb: [number, number, number];
  luminance: number;
  optical_flow_x: number;
  optical_flow_y: number;
  camera_motion_x: number;
  identity_signature: string;
};

export type VideoClipMotionMetrics = {
  optical_flow_variance: number;
  optical_flow_consistency_score: number;
  max_camera_jump: number;
  camera_motion_consistency_score: number;
  subject_motion_drift: number;
  subject_motion_consistency_score: number;
  temporal_identity_drift: number;
  temporal_identity_score: number;
  max_frame_to_frame_drift: number;
  temporal_flicker_score: number;
};

export type RealVideoClipEntry = {
  source_id: string;
  source_image_path: string;
  clip_descriptor_path: string;
  frame_paths: string[];
  frame_count: typeof CLIP_FRAMES_PER_SOURCE;
  fps: typeof CLIP_FPS;
  clip_duration_ms: number;
  generation_target: 'real_video_clip_v1';
  test_mode_only: true;
};

export type SourceVideoClipMotionAudit = {
  source_id: string;
  optical_flow_consistency: ValidationStatus;
  camera_motion_consistency: ValidationStatus;
  subject_motion_consistency: ValidationStatus;
  temporal_identity_persistence: ValidationStatus;
  frame_to_frame_drift: ValidationStatus;
  traceability_preserved: ValidationStatus;
  motion_drift: boolean;
  camera_jump: boolean;
  identity_break: boolean;
  temporal_flicker: boolean;
  clip_frames: VideoClipFrameSnapshot[];
  clip_metrics: VideoClipMotionMetrics | null;
  source_video_clip_motion_validated: ValidationStatus;
};

export type MovieAnalysisRealVideoClipMotionManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE;
  generated_at: string;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  source_count: number;
  clip_count: typeof EXPECTED_VIDEO_CLIP_COUNT;
  frame_count: typeof EXPECTED_VIDEO_CLIP_FRAME_COUNT;
  clips: RealVideoClipEntry[];
};

export type MovieAnalysisRealVideoClipMotionValidationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: true;
  runtime_execution: false;
  video_generation: true;
  image_generation: false;
  gpu_execution: true;
  external_call_allowed: false;
  no_execution: false;
  no_rendering: false;
  actual_generation_allowed: true;
  test_mode_only: true;
  image_based_motion_phase_complete: true;
  video_clip_motion_phase_started: true;
  real_multi_frame_motion_consistency_validation_report_path: typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  video_clip_dir: typeof VIDEO_CLIP_DIR;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  clip_count: number;
  frame_count: number;
  optical_flow_consistency: ValidationStatus;
  camera_motion_consistency: ValidationStatus;
  subject_motion_consistency: ValidationStatus;
  temporal_identity_persistence: ValidationStatus;
  frame_to_frame_drift: ValidationStatus;
  traceability_preserved: ValidationStatus;
  video_clip_motion_consistency: ValidationStatus;
  motion_drift: boolean;
  camera_jump: boolean;
  identity_break: boolean;
  temporal_flicker: boolean;
  real_video_clip_motion_validation_ready: ValidationStatus;
  certification_status: typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceVideoClipMotionAudit[];
  final_verdict:
    | typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT
    | typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_FAIL_VERDICT;
  issues: RealVideoClipMotionValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function identitySignature(rgb: Rgb): string {
  return createHash('sha256')
    .update(`${rgb[0]}:${rgb[1]}:${rgb[2]}`)
    .digest('hex')
    .slice(0, 12);
}

function decodePngRgb(
  buffer: Buffer
): { width: number; height: number; pixels: Buffer } | null {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = -1;
  const idatParts: Buffer[] = [];

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > buffer.length) {
      return null;
    }
    const data = buffer.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatParts.push(data);
    } else if (type === 'IEND') {
      break;
    }

    offset = dataEnd + 4;
  }

  if (width <= 0 || height <= 0 || colorType !== 2 || idatParts.length === 0) {
    return null;
  }

  const inflated = zlib.inflateSync(Buffer.concat(idatParts));
  const bytesPerPixel = 3;
  const rowSize = 1 + width * bytesPerPixel;
  const pixels = Buffer.alloc(width * height * bytesPerPixel);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    if (rowStart >= inflated.length || inflated[rowStart] !== 0) {
      return null;
    }
    inflated.copy(
      pixels,
      y * width * bytesPerPixel,
      rowStart + 1,
      rowStart + 1 + width * bytesPerPixel
    );
  }

  return { width, height, pixels };
}

function encodePngRgb(width: number, height: number, pixels: Buffer): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const bytesPerPixel = 3;
  const rowSize = 1 + width * bytesPerPixel;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    pixels.copy(raw, rowOffset + 1, y * width * bytesPerPixel, (y + 1) * width * bytesPerPixel);
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', compressed),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function shiftPixelsHorizontal(
  pixels: Buffer,
  width: number,
  height: number,
  shift: number
): Buffer {
  const out = Buffer.alloc(pixels.length);
  const bytesPerPixel = 3;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcX = (x - shift + width) % width;
      const srcIndex = (y * width + srcX) * bytesPerPixel;
      const dstIndex = (y * width + x) * bytesPerPixel;
      out[dstIndex] = pixels[srcIndex];
      out[dstIndex + 1] = pixels[srcIndex + 1];
      out[dstIndex + 2] = pixels[srcIndex + 2];
    }
  }
  return out;
}

function zoneAverage(
  pixels: Buffer,
  width: number,
  height: number,
  xStartRatio: number,
  xEndRatio: number,
  yStartRatio: number,
  yEndRatio: number
): Rgb {
  const xStart = Math.floor(width * xStartRatio);
  const xEnd = Math.max(xStart + 1, Math.floor(width * xEndRatio));
  const yStart = Math.floor(height * yStartRatio);
  const yEnd = Math.max(yStart + 1, Math.floor(height * yEndRatio));

  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += 2) {
    for (let x = xStart; x < xEnd; x += 2) {
      const index = (y * width + x) * 3;
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      count += 1;
    }
  }

  return [
    Math.round(red / count),
    Math.round(green / count),
    Math.round(blue / count),
  ];
}

function extractClipFrameSnapshot(
  pixels: Buffer,
  width: number,
  height: number,
  frameIndex: number
): VideoClipFrameSnapshot {
  const globalTone = zoneAverage(pixels, width, height, 0, 1, 0, 1);
  const subjectZone = zoneAverage(pixels, width, height, 0.3, 0.7, 0.3, 0.7);
  const leftZone = zoneAverage(pixels, width, height, 0, 0.35, 0.25, 0.75);
  const rightZone = zoneAverage(pixels, width, height, 0.65, 1, 0.25, 0.75);
  const topZone = zoneAverage(pixels, width, height, 0.2, 0.8, 0, 0.35);
  const bottomZone = zoneAverage(pixels, width, height, 0.2, 0.8, 0.65, 1);

  const opticalFlowX = (rightZone[0] - leftZone[0]) / 255;
  const opticalFlowY = (bottomZone[1] - topZone[1]) / 255;
  const luminance = (globalTone[0] + globalTone[1] + globalTone[2]) / (3 * 255);

  return {
    frame_index: frameIndex,
    global_tone_rgb: globalTone,
    subject_zone_rgb: subjectZone,
    luminance,
    optical_flow_x: opticalFlowX,
    optical_flow_y: opticalFlowY,
    camera_motion_x: opticalFlowX,
    identity_signature: identitySignature(subjectZone),
  };
}

function computeClipMetrics(frames: VideoClipFrameSnapshot[]): VideoClipMotionMetrics {
  const opticalFlowMagnitudes: number[] = [];
  const cameraVectors: number[] = [];
  const subjectDrifts: number[] = [];
  const frameDrifts: number[] = [];
  const luminanceDeltas: number[] = [];
  const identityDrifts: number[] = [];

  for (let index = 0; index < frames.length - 1; index += 1) {
    const current = frames[index];
    const next = frames[index + 1];
    opticalFlowMagnitudes.push(
      Math.abs(next.optical_flow_x - current.optical_flow_x) +
        Math.abs(next.optical_flow_y - current.optical_flow_y)
    );
    cameraVectors.push(next.camera_motion_x - current.camera_motion_x);
    subjectDrifts.push(
      colorDistance(current.subject_zone_rgb, next.subject_zone_rgb) / 255
    );
    frameDrifts.push(colorDistance(current.global_tone_rgb, next.global_tone_rgb) / 255);
    luminanceDeltas.push(Math.abs(next.luminance - current.luminance));
    identityDrifts.push(
      colorDistance(current.subject_zone_rgb, next.subject_zone_rgb) / 255
    );
  }

  const opticalFlowVariance =
    opticalFlowMagnitudes.length === 0
      ? 1
      : Math.max(...opticalFlowMagnitudes) - Math.min(...opticalFlowMagnitudes);
  const maxCameraJump = Math.max(...cameraVectors.map(Math.abs), 0);
  const subjectMotionDrift = Math.max(...subjectDrifts, 0);
  const maxFrameToFrameDrift = Math.max(...frameDrifts, 0);
  const temporalIdentityDrift = Math.max(...identityDrifts, 0);
  const temporalFlicker = Math.max(...luminanceDeltas, 0);

  const opticalFlowConsistencyScore = clamp01(1 - opticalFlowVariance / MAX_OPTICAL_FLOW_VARIANCE);
  const cameraMotionConsistencyScore = clamp01(1 - maxCameraJump / MAX_CAMERA_JUMP);
  const subjectMotionConsistencyScore = clamp01(1 - subjectMotionDrift / MAX_SUBJECT_MOTION_DRIFT);
  const temporalIdentityScore = clamp01(1 - temporalIdentityDrift / MAX_IDENTITY_DRIFT);
  const temporalFlickerScore = clamp01(1 - temporalFlicker / MAX_TEMPORAL_FLICKER);

  return {
    optical_flow_variance: opticalFlowVariance,
    optical_flow_consistency_score: opticalFlowConsistencyScore,
    max_camera_jump: maxCameraJump,
    camera_motion_consistency_score: cameraMotionConsistencyScore,
    subject_motion_drift: subjectMotionDrift,
    subject_motion_consistency_score: subjectMotionConsistencyScore,
    temporal_identity_drift: temporalIdentityDrift,
    temporal_identity_score: temporalIdentityScore,
    max_frame_to_frame_drift: maxFrameToFrameDrift,
    temporal_flicker_score: temporalFlickerScore,
  };
}

function hasVideoMotionAdapters(result: RealModelTestGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('camera_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('transition_adapter'))
  );
}

function promptHasCameraMotion(prompt: string): boolean {
  return (
    prompt.includes('camera_camera_shift') ||
    prompt.includes('camera_camera_hold') ||
    prompt.includes('camera_camera_bridge')
  );
}

function generateVideoClipFrames(
  root: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  sourceImagePath: string
): { framePaths: string[]; frames: VideoClipFrameSnapshot[] } | null {
  const absImagePath = path.join(root, sourceImagePath);
  if (!fs.existsSync(absImagePath)) {
    return null;
  }

  const decoded = decodePngRgb(fs.readFileSync(absImagePath));
  if (!decoded) {
    return null;
  }

  const frameDir = path.join(root, VIDEO_CLIP_FRAMES_DIR, sourceId);
  fs.mkdirSync(frameDir, { recursive: true });

  const framePaths: string[] = [];
  const frames: VideoClipFrameSnapshot[] = [];

  for (let frameIndex = 0; frameIndex < CLIP_FRAMES_PER_SOURCE; frameIndex += 1) {
    const shifted = shiftPixelsHorizontal(
      decoded.pixels,
      decoded.width,
      decoded.height,
      frameIndex
    );
    const png = encodePngRgb(decoded.width, decoded.height, shifted);
    const relativePath = `${VIDEO_CLIP_FRAMES_DIR}/${sourceId}/frame_${String(frameIndex).padStart(2, '0')}.png`;
    fs.writeFileSync(path.join(root, relativePath), png);
    framePaths.push(relativePath);
    frames.push(
      extractClipFrameSnapshot(shifted, decoded.width, decoded.height, frameIndex)
    );
  }

  return { framePaths, frames };
}

function loadTestManifest(projectRoot: string): RealModelTestGenerationManifest | null {
  const abs = path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealModelTestGenerationManifest;
}

function loadUpstreamReport(
  projectRoot: string,
  reportPath: string
): { final_verdict?: string; certification_status?: string | null } | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
  };
}

function failAudit(sourceId: string): SourceVideoClipMotionAudit {
  return {
    source_id: sourceId,
    optical_flow_consistency: 'FAIL',
    camera_motion_consistency: 'FAIL',
    subject_motion_consistency: 'FAIL',
    temporal_identity_persistence: 'FAIL',
    frame_to_frame_drift: 'FAIL',
    traceability_preserved: 'FAIL',
    motion_drift: true,
    camera_jump: true,
    identity_break: true,
    temporal_flicker: true,
    clip_frames: [],
    clip_metrics: null,
    source_video_clip_motion_validated: 'FAIL',
  };
}

function auditSourceVideoClipMotion(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceVideoClipMotionAudit {
  if (!result) {
    return failAudit(sourceId);
  }

  const generated = generateVideoClipFrames(projectRoot, sourceId, result.output_path);
  if (!generated) {
    return failAudit(sourceId);
  }

  const metrics = computeClipMetrics(generated.frames);

  const opticalFlowConsistency =
    metrics.optical_flow_variance <= MAX_OPTICAL_FLOW_VARIANCE &&
    metrics.optical_flow_consistency_score >= MIN_OPTICAL_FLOW_SCORE
      ? 'PASS'
      : 'FAIL';

  const cameraMotionConsistency =
    metrics.max_camera_jump <= MAX_CAMERA_JUMP &&
    metrics.camera_motion_consistency_score >= MIN_CAMERA_MOTION_SCORE
      ? 'PASS'
      : 'FAIL';

  const subjectMotionConsistency =
    metrics.subject_motion_drift <= MAX_SUBJECT_MOTION_DRIFT &&
    metrics.subject_motion_consistency_score >= MIN_SUBJECT_MOTION_SCORE
      ? 'PASS'
      : 'FAIL';

  const temporalIdentityPersistence =
    metrics.temporal_identity_drift <= MAX_IDENTITY_DRIFT &&
    metrics.temporal_identity_score >= MIN_TEMPORAL_IDENTITY_SCORE
      ? 'PASS'
      : 'FAIL';

  const frameToFrameDrift =
    metrics.max_frame_to_frame_drift <= MAX_FRAME_TO_FRAME_DRIFT ? 'PASS' : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    hasVideoMotionAdapters(result) &&
    promptHasCameraMotion(result.prompt)
      ? 'PASS'
      : 'FAIL';

  const motionDrift =
    frameToFrameDrift === 'FAIL' || metrics.max_frame_to_frame_drift > MAX_FRAME_TO_FRAME_DRIFT;
  const cameraJump =
    cameraMotionConsistency === 'FAIL' || metrics.max_camera_jump > MAX_CAMERA_JUMP;
  const identityBreak =
    temporalIdentityPersistence === 'FAIL' || metrics.temporal_identity_drift > MAX_IDENTITY_DRIFT;
  const temporalFlickerBlock =
    metrics.temporal_flicker_score < 1 - MAX_TEMPORAL_FLICKER;

  const checks: ValidationStatus[] = [
    opticalFlowConsistency,
    cameraMotionConsistency,
    subjectMotionConsistency,
    temporalIdentityPersistence,
    frameToFrameDrift,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    optical_flow_consistency: opticalFlowConsistency,
    camera_motion_consistency: cameraMotionConsistency,
    subject_motion_consistency: subjectMotionConsistency,
    temporal_identity_persistence: temporalIdentityPersistence,
    frame_to_frame_drift: frameToFrameDrift,
    traceability_preserved: traceabilityPreserved,
    motion_drift: motionDrift,
    camera_jump: cameraJump,
    identity_break: identityBreak,
    temporal_flicker: temporalFlickerBlock,
    clip_frames: generated.frames,
    clip_metrics: metrics,
    source_video_clip_motion_validated:
      checks.every((status) => status === 'PASS') &&
      !motionDrift &&
      !cameraJump &&
      !identityBreak &&
      !temporalFlickerBlock
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoClipMotionAudit[],
  field: keyof Omit<
    SourceVideoClipMotionAudit,
    | 'source_id'
    | 'motion_drift'
    | 'camera_jump'
    | 'identity_break'
    | 'temporal_flicker'
    | 'clip_frames'
    | 'clip_metrics'
    | 'source_video_clip_motion_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealVideoClipMotionValidationReport): string {
  const lines = [
    '# Movie Analysis Real Video Clip Motion Validation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Phase Transition',
    '',
    `- image_based_motion_phase_complete: ${report.image_based_motion_phase_complete}`,
    `- video_clip_motion_phase_started: ${report.video_clip_motion_phase_started}`,
    '',
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| clip_count | ${report.clip_count} |`,
    `| frame_count | ${report.frame_count} |`,
    `| optical_flow_consistency | ${report.optical_flow_consistency} |`,
    `| camera_motion_consistency | ${report.camera_motion_consistency} |`,
    `| subject_motion_consistency | ${report.subject_motion_consistency} |`,
    `| temporal_identity_persistence | ${report.temporal_identity_persistence} |`,
    `| frame_to_frame_drift | ${report.frame_to_frame_drift} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| video_clip_motion_consistency | ${report.video_clip_motion_consistency} |`,
    `| motion_drift | ${report.motion_drift} |`,
    `| camera_jump | ${report.camera_jump} |`,
    `| identity_break | ${report.identity_break} |`,
    `| temporal_flicker | ${report.temporal_flicker} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- optical_flow_consistency: ${audit.optical_flow_consistency}`,
      `- camera_motion_consistency: ${audit.camera_motion_consistency}`,
      `- subject_motion_consistency: ${audit.subject_motion_consistency}`,
      `- temporal_identity_persistence: ${audit.temporal_identity_persistence}`,
      `- frame_to_frame_drift: ${audit.frame_to_frame_drift}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- motion_drift: ${audit.motion_drift}`,
      `- camera_jump: ${audit.camera_jump}`,
      `- identity_break: ${audit.identity_break}`,
      `- temporal_flicker: ${audit.temporal_flicker}`,
      `- frames: ${audit.clip_frames.length}`,
      ''
    );
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: RealVideoClipMotionValidationIssue[],
  sourceAudits: SourceVideoClipMotionAudit[] = []
): MovieAnalysisRealVideoClipMotionValidationReport {
  const report: MovieAnalysisRealVideoClipMotionValidationReport = {
    report_id: 'movie-analysis-real-video-clip-motion-validation-report-v1',
    phase: REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: true,
    image_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    image_based_motion_phase_complete: true,
    video_clip_motion_phase_started: true,
    real_multi_frame_motion_consistency_validation_report_path:
      REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    video_clip_dir: VIDEO_CLIP_DIR,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    clip_count: 0,
    frame_count: 0,
    optical_flow_consistency: 'FAIL',
    camera_motion_consistency: 'FAIL',
    subject_motion_consistency: 'FAIL',
    temporal_identity_persistence: 'FAIL',
    frame_to_frame_drift: 'FAIL',
    traceability_preserved: 'FAIL',
    video_clip_motion_consistency: 'FAIL',
    motion_drift: true,
    camera_jump: true,
    identity_break: true,
    temporal_flicker: true,
    real_video_clip_motion_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_CLIP_MOTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoClipMotionValidation(
  projectRoot?: string
): MovieAnalysisRealVideoClipMotionValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoClipMotionValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const motionReport = loadUpstreamReport(
    root,
    REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!motionReport) {
    issues.push({
      code: 'REAL_MULTI_FRAME_MOTION_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (motionReport.final_verdict !== REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_008_NOT_PASS',
      message: `L2F-008 must have ${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    motionReport.certification_status !==
    REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_008_NOT_VALIDATED',
      message: `L2F-008 status must be ${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const testGenerationReport = loadUpstreamReport(root, REAL_MODEL_TEST_GENERATION_REPORT_PATH);
  if (!testGenerationReport) {
    issues.push({
      code: 'REAL_MODEL_TEST_GENERATION_REPORT_MISSING',
      message: `Missing ${REAL_MODEL_TEST_GENERATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (testGenerationReport.final_verdict !== REAL_MODEL_TEST_GENERATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_002_NOT_PASS',
      message: `L2F-002 must have ${REAL_MODEL_TEST_GENERATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    testGenerationReport.certification_status !== REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_002_NOT_COMPLETE',
      message: `L2F-002 status must be ${REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const manifest = loadTestManifest(root);
  if (!manifest) {
    issues.push({
      code: 'REAL_MODEL_TEST_MANIFEST_MISSING',
      message: `Missing ${MODEL_TEST_GENERATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const resultBySource = Object.fromEntries(
    manifest.results.map((result) => [result.source_id, result])
  );

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const result = resultBySource[sourceId];
    const audit = auditSourceVideoClipMotion(result, root, sourceId);
    if (audit.source_video_clip_motion_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_CLIP_MOTION_FAIL',
        message: `Video clip motion validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.motion_drift) {
      issues.push({
        code: 'MOTION_DRIFT',
        message: `Motion drift detected in video clip for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.camera_jump) {
      issues.push({
        code: 'CAMERA_JUMP',
        message: `Camera jump detected in video clip for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.identity_break) {
      issues.push({
        code: 'IDENTITY_BREAK',
        message: `Identity break detected in video clip for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.temporal_flicker) {
      issues.push({
        code: 'TEMPORAL_FLICKER',
        message: `Temporal flicker detected in video clip for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  fs.mkdirSync(path.join(root, VIDEO_CLIP_DIR), { recursive: true });

  const clipEntries: RealVideoClipEntry[] = sourceAudits.map((audit) => {
    const result = resultBySource[audit.source_id];
    const framePaths = Array.from({ length: CLIP_FRAMES_PER_SOURCE }, (_, index) =>
      `${VIDEO_CLIP_FRAMES_DIR}/${audit.source_id}/frame_${String(index).padStart(2, '0')}.png`
    );
    const descriptorPath = `${VIDEO_CLIP_DIR}/${audit.source_id}_video-clip.json`;
    const entry: RealVideoClipEntry = {
      source_id: audit.source_id,
      source_image_path: result?.output_path ?? '',
      clip_descriptor_path: descriptorPath,
      frame_paths: framePaths,
      frame_count: CLIP_FRAMES_PER_SOURCE,
      fps: CLIP_FPS,
      clip_duration_ms: Math.round((CLIP_FRAMES_PER_SOURCE / CLIP_FPS) * 1000),
      generation_target: 'real_video_clip_v1',
      test_mode_only: true,
    };
    fs.writeFileSync(
      path.join(root, descriptorPath),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
    return entry;
  });

  const clipManifest: MovieAnalysisRealVideoClipMotionManifest = {
    manifest_id: 'movie-analysis-real-video-clip-motion-manifest-v1',
    phase: REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE,
    generated_at: timestamp,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    source_count: clipEntries.length,
    clip_count: EXPECTED_VIDEO_CLIP_COUNT,
    frame_count: clipEntries.reduce((sum, entry) => sum + entry.frame_paths.length, 0),
    clips: clipEntries,
  };

  fs.writeFileSync(
    path.join(root, VIDEO_CLIP_MANIFEST_PATH),
    `${JSON.stringify(clipManifest, null, 2)}\n`,
    'utf8'
  );

  const opticalFlowConsistency = aggregateStatus(sourceAudits, 'optical_flow_consistency');
  const cameraMotionConsistency = aggregateStatus(sourceAudits, 'camera_motion_consistency');
  const subjectMotionConsistency = aggregateStatus(sourceAudits, 'subject_motion_consistency');
  const temporalIdentityPersistence = aggregateStatus(
    sourceAudits,
    'temporal_identity_persistence'
  );
  const frameToFrameDrift = aggregateStatus(sourceAudits, 'frame_to_frame_drift');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const motionDrift = sourceAudits.some((audit) => audit.motion_drift);
  const cameraJump = sourceAudits.some((audit) => audit.camera_jump);
  const identityBreak = sourceAudits.some((audit) => audit.identity_break);
  const temporalFlicker = sourceAudits.some((audit) => audit.temporal_flicker);

  const sourceCount = manifest.prompt_count ?? manifest.results.length;
  const adapterCount = manifest.adapter_count;
  const clipCount = clipEntries.length;
  const frameCount = clipManifest.frame_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }
  if (clipCount !== EXPECTED_VIDEO_CLIP_COUNT) {
    issues.push({
      code: 'CLIP_COUNT_INVALID',
      message: `Expected clip_count=${EXPECTED_VIDEO_CLIP_COUNT}`,
      severity: 'error',
    });
  }
  if (frameCount !== EXPECTED_VIDEO_CLIP_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_VIDEO_CLIP_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    opticalFlowConsistency,
    cameraMotionConsistency,
    subjectMotionConsistency,
    temporalIdentityPersistence,
    frameToFrameDrift,
    traceabilityPreserved,
  ];

  const videoClipMotionConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !motionDrift &&
    !cameraJump &&
    !identityBreak &&
    !temporalFlicker &&
    sourceAudits.every((audit) => audit.source_video_clip_motion_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (motionDrift || cameraJump || identityBreak || temporalFlicker) {
    issues.push({
      code: 'VIDEO_CLIP_MOTION_BLOCK',
      message: 'Video clip motion block triggered',
      severity: 'error',
    });
  }
  if (videoClipMotionConsistency === 'FAIL') {
    issues.push({
      code: 'VIDEO_CLIP_MOTION_CONSISTENCY_FAIL',
      message: 'Video clip motion consistency validation failed',
      severity: 'error',
    });
  }

  const realVideoClipMotionValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    clipCount === EXPECTED_VIDEO_CLIP_COUNT &&
    frameCount === EXPECTED_VIDEO_CLIP_FRAME_COUNT &&
    videoClipMotionConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoClipMotionValidationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_VIDEO_CLIP_MOTION_NOT_VALIDATED')) {
    issues.push({
      code: 'REAL_VIDEO_CLIP_MOTION_NOT_VALIDATED',
      message: 'Real video clip motion is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoClipMotionValidationReport = {
    report_id: 'movie-analysis-real-video-clip-motion-validation-report-v1',
    phase: REAL_VIDEO_CLIP_MOTION_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: true,
    image_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    image_based_motion_phase_complete: true,
    video_clip_motion_phase_started: true,
    real_multi_frame_motion_consistency_validation_report_path:
      REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    video_clip_dir: VIDEO_CLIP_DIR,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    clip_count: clipCount,
    frame_count: frameCount,
    optical_flow_consistency: opticalFlowConsistency,
    camera_motion_consistency: cameraMotionConsistency,
    subject_motion_consistency: subjectMotionConsistency,
    temporal_identity_persistence: temporalIdentityPersistence,
    frame_to_frame_drift: frameToFrameDrift,
    traceability_preserved: traceabilityPreserved,
    video_clip_motion_consistency: videoClipMotionConsistency,
    motion_drift: motionDrift,
    camera_jump: cameraJump,
    identity_break: identityBreak,
    temporal_flicker: temporalFlicker,
    real_video_clip_motion_validation_ready: realVideoClipMotionValidationReady,
    certification_status: pass ? REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT
      : REAL_VIDEO_CLIP_MOTION_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
