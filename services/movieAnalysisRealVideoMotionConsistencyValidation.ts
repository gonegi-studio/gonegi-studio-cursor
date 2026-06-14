import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MAX_CONTINUITY_BREAK,
  MAX_DIRECTION_CONFLICT,
  MAX_MOTION_DRIFT,
  MAX_MOTION_STEP,
  MAX_TEMPORAL_BREAK,
  MIN_CROSS_FRAME_MOTION_SCORE,
  MIN_FLOW_SIGNAL,
  MIN_MOTION_STEP,
  MULTI_FRAME_MOTION_MANIFEST_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  type MovieAnalysisRealMultiFrameMotionManifest,
} from './movieAnalysisRealMultiFrameMotionConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationManifest,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  CLIP_FRAMES_PER_SOURCE,
  MAX_CAMERA_JUMP,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_MANIFEST_PATH,
} from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealVideoStyleConsistencyValidation.js';
import { extractPngSamplesFromMp4 } from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
import {
  REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT,
  REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
  REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE,
  VIDEO_MODEL_GENERATION_MANIFEST_PATH,
  validateMp4Buffer,
  type MovieAnalysisRealVideoModelGenerationManifest,
  type RealVideoModelGenerationResult,
} from './movieAnalysisRealVideoModelGeneration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-014-REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_VIDEO_MOTION_CONSISTENCY_VALIDATED' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_video_motion_consistency_validation' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_video_motion_consistency_validation/movie-analysis-real-video-motion-consistency-validation-report.json' as const;
export const REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_video_motion_consistency_validation/MOVIE_ANALYSIS_REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION.md' as const;
export const VIDEO_MOTION_DIR =
  'exports/movie_analysis_model_generation_test/video_motion' as const;
export const VIDEO_MOTION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_motion/movie-analysis-real-video-motion-consistency-manifest.json' as const;

export const EXPECTED_VIDEO_MOTION_FRAME_COUNT = EXPECTED_SOURCE_COUNT * CLIP_FRAMES_PER_SOURCE;
export const MIN_CAMERA_MOTION_SCORE = 0.58 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealVideoMotionConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoMotionFrameSnapshot = {
  frame_index: number;
  motion_tone_rgb: [number, number, number];
  luminance: number;
  horizontal_flow: number;
  vertical_flow: number;
  motion_speed: number;
  motion_direction: number;
  camera_motion_x: number;
  motion_signature: string;
};

export type VideoMotionConsistencyMetrics = {
  max_adjacent_motion_gap: number;
  open_to_last_motion_span: number;
  motion_speed_variance: number;
  temporal_flow_score: number;
  direction_conflict_score: number;
  max_camera_jump: number;
  camera_motion_consistency_score: number;
  frame_to_frame_motion_drift: number;
  video_motion_score: number;
};

export type VideoMotionManifestEntry = {
  source_id: string;
  motion_profile_id: string;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  mp4_output_path: string;
  frame_count: number;
  frames: VideoMotionFrameSnapshot[];
};

export type MovieAnalysisRealVideoMotionConsistencyManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_VIDEO_MOTION_FRAME_COUNT;
  entries: VideoMotionManifestEntry[];
};

export type SourceVideoMotionConsistencyAudit = {
  source_id: string;
  motion_direction_persistence: ValidationStatus;
  motion_speed_consistency: ValidationStatus;
  camera_motion_consistency: ValidationStatus;
  temporal_flow_consistency: ValidationStatus;
  frame_to_frame_motion_drift: ValidationStatus;
  motion_drift: boolean;
  camera_jump: boolean;
  temporal_break: boolean;
  motion_direction_conflict: boolean;
  motion_frames: VideoMotionFrameSnapshot[];
  motion_metrics: VideoMotionConsistencyMetrics | null;
  source_video_motion_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealVideoMotionConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  real_video_style_consistency_validation_report_path: typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_video_clip_motion_validation_report_path: typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH;
  real_multi_frame_motion_consistency_validation_report_path: typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_video_model_generation_report_path: typeof REAL_VIDEO_MODEL_GENERATION_REPORT_PATH;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  video_motion_dir: typeof VIDEO_MOTION_DIR;
  video_motion_manifest_path: typeof VIDEO_MOTION_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  motion_direction_persistence: ValidationStatus;
  motion_speed_consistency: ValidationStatus;
  camera_motion_consistency: ValidationStatus;
  temporal_flow_consistency: ValidationStatus;
  frame_to_frame_motion_drift: ValidationStatus;
  video_motion_consistency: ValidationStatus;
  motion_drift: boolean;
  camera_jump: boolean;
  temporal_break: boolean;
  motion_direction_conflict: boolean;
  real_video_motion_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceVideoMotionConsistencyAudit[];
  final_verdict:
    | typeof REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealVideoMotionConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function motionSignature(rgb: Rgb, direction: number): string {
  return createHash('sha256')
    .update(`${rgb[0]}:${rgb[1]}:${rgb[2]}:${direction}`)
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

  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
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

function extractVideoMotionFrame(
  pixels: Buffer,
  width: number,
  height: number,
  frameIndex: number
): VideoMotionFrameSnapshot {
  const tone = zoneAverage(pixels, width, height, 0, 1, 0, 1);
  const leftZone = zoneAverage(pixels, width, height, 0, 0.4, 0.2, 0.8);
  const rightZone = zoneAverage(pixels, width, height, 0.6, 1, 0.2, 0.8);
  const topZone = zoneAverage(pixels, width, height, 0.2, 0.8, 0, 0.35);
  const bottomZone = zoneAverage(pixels, width, height, 0.2, 0.8, 0.65, 1);

  const luminance = (tone[0] + tone[1] + tone[2]) / (3 * 255);
  const horizontalFlow = (rightZone[0] - leftZone[0] + rightZone[1] - leftZone[1]) / 510;
  const verticalFlow = (bottomZone[1] - topZone[1]) / 255;
  const motionDirection = Math.sign(horizontalFlow + verticalFlow * 0.35) || 1;
  const motionSpeed = Math.abs(horizontalFlow) + Math.abs(verticalFlow) * 0.5;

  return {
    frame_index: frameIndex,
    motion_tone_rgb: tone,
    luminance,
    horizontal_flow: horizontalFlow,
    vertical_flow: verticalFlow,
    motion_speed: motionSpeed,
    motion_direction: motionDirection,
    camera_motion_x: horizontalFlow,
    motion_signature: motionSignature(tone, motionDirection),
  };
}

function computeVideoMotionMetrics(
  frames: VideoMotionFrameSnapshot[],
  generationResult: RealVideoModelGenerationResult
): VideoMotionConsistencyMetrics {
  const motionGaps: number[] = [];
  const speedValues: number[] = [];
  const cameraVectors: number[] = [];
  let directionConflicts = 0;

  for (let index = 0; index < frames.length - 1; index += 1) {
    motionGaps.push(
      colorDistance(frames[index].motion_tone_rgb, frames[index + 1].motion_tone_rgb) / 255
    );
    speedValues.push(Math.abs(frames[index + 1].motion_speed - frames[index].motion_speed));
    cameraVectors.push(frames[index + 1].camera_motion_x - frames[index].camera_motion_x);

    const leftFlow = frames[index].motion_speed;
    const rightFlow = frames[index + 1].motion_speed;
    if (leftFlow >= MIN_FLOW_SIGNAL || rightFlow >= MIN_FLOW_SIGNAL) {
      if (frames[index].motion_direction !== frames[index + 1].motion_direction) {
        directionConflicts += 1;
      }
    }
  }

  const maxAdjacentMotionGap = Math.max(...motionGaps, 0);
  const minAdjacentMotionGap = Math.min(...motionGaps, 0);
  const openToLastMotionSpan =
    colorDistance(frames[0].motion_tone_rgb, frames[frames.length - 1].motion_tone_rgb) / 255;
  const motionSpeedVariance =
    speedValues.length === 0 ? 1 : Math.max(...speedValues) - Math.min(...speedValues);
  const directionConflictScore =
    frames.length <= 1 ? 0 : directionConflicts / (frames.length - 1);
  const maxCameraJump = Math.max(...cameraVectors.map(Math.abs), 0);

  const continuityScores = motionGaps.map((gap) =>
    gap <= MAX_CONTINUITY_BREAK ? clamp01(1 - gap / MAX_CONTINUITY_BREAK) : 0
  );
  const continuityPreservationScore =
    continuityScores.length === 0
      ? 0
      : continuityScores.reduce((sum, value) => sum + value, 0) / continuityScores.length;

  const narrativeHold = generationResult.prompt.includes('narrative_hold');
  const stepScores = motionGaps.map((gap) => {
    if (narrativeHold && gap <= MAX_MOTION_DRIFT) {
      return clamp01(1 - gap / MAX_MOTION_DRIFT);
    }
    return gap >= MIN_MOTION_STEP && gap <= MAX_MOTION_STEP
      ? clamp01((gap - MIN_MOTION_STEP) / (MAX_MOTION_STEP - MIN_MOTION_STEP))
      : clamp01(gap / MIN_MOTION_STEP) * 0.35;
  });
  const stepAverage =
    stepScores.length === 0
      ? 0
      : stepScores.reduce((sum, value) => sum + value, 0) / stepScores.length;
  const luminanceArc = Math.abs(frames[0].luminance - frames[frames.length - 1].luminance);
  const arcScore = clamp01(luminanceArc / 0.18);
  const stageArcScore = clamp01(frames.length / CLIP_FRAMES_PER_SOURCE);
  const temporalFlowScore = clamp01(
    continuityPreservationScore * 0.42 +
      stepAverage * 0.28 +
      arcScore * 0.15 +
      stageArcScore * 0.15
  );

  const directionScore = clamp01(1 - directionConflictScore / MAX_DIRECTION_CONFLICT);
  const speedScore = clamp01(1 - motionSpeedVariance / MAX_MOTION_DRIFT);
  const gapScore = clamp01(1 - maxAdjacentMotionGap / MAX_MOTION_DRIFT);
  const temporalScore = clamp01(temporalFlowScore);
  const cameraScore = clamp01(1 - maxCameraJump / MAX_CAMERA_JUMP);
  const holdBonus = narrativeHold ? clamp01(minAdjacentMotionGap / MIN_MOTION_STEP) * 0.08 : 0;
  const frameToFrameMotionDrift = Math.max(
    maxAdjacentMotionGap,
    maxCameraJump * 0.55 + motionSpeedVariance * 0.45
  );
  const videoMotionScore = clamp01(
    directionScore * 0.2 +
      speedScore * 0.18 +
      gapScore * 0.18 +
      temporalScore * 0.16 +
      cameraScore * 0.16 +
      holdBonus
  );

  return {
    max_adjacent_motion_gap: maxAdjacentMotionGap,
    open_to_last_motion_span: openToLastMotionSpan,
    motion_speed_variance: motionSpeedVariance,
    temporal_flow_score: temporalFlowScore,
    direction_conflict_score: directionConflictScore,
    max_camera_jump: maxCameraJump,
    camera_motion_consistency_score: cameraScore,
    frame_to_frame_motion_drift: frameToFrameMotionDrift,
    video_motion_score: videoMotionScore,
  };
}

function hasMotionAdapters(result: RealVideoModelGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('camera_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('transition_adapter'))
  );
}

function loadVideoManifest(root: string): MovieAnalysisRealVideoModelGenerationManifest | null {
  const abs = path.join(root, VIDEO_MODEL_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealVideoModelGenerationManifest;
}

function loadMotionManifest(root: string): MovieAnalysisRealMultiFrameMotionManifest | null {
  const abs = path.join(root, MULTI_FRAME_MOTION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealMultiFrameMotionManifest;
}

function loadUpstreamReport(
  root: string,
  reportPath: string
): { final_verdict?: string; certification_status?: string | null } | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
  };
}

function failAudit(sourceId: string): SourceVideoMotionConsistencyAudit {
  return {
    source_id: sourceId,
    motion_direction_persistence: 'FAIL',
    motion_speed_consistency: 'FAIL',
    camera_motion_consistency: 'FAIL',
    temporal_flow_consistency: 'FAIL',
    frame_to_frame_motion_drift: 'FAIL',
    motion_drift: true,
    camera_jump: true,
    temporal_break: true,
    motion_direction_conflict: true,
    motion_frames: [],
    motion_metrics: null,
    source_video_motion_consistency_validated: 'FAIL',
  };
}

function auditSourceVideoMotion(
  generationResult: RealVideoModelGenerationResult | undefined,
  motionEntry: MovieAnalysisRealMultiFrameMotionManifest['entries'][number] | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceVideoMotionConsistencyAudit {
  if (!generationResult || !motionEntry) {
    return failAudit(sourceId);
  }

  const mp4Path = path.join(projectRoot, generationResult.mp4_output_path);
  if (!fs.existsSync(mp4Path)) {
    return failAudit(sourceId);
  }

  const mp4Buffer = fs.readFileSync(mp4Path);
  if (!validateMp4Buffer(mp4Buffer).valid) {
    return failAudit(sourceId);
  }

  const pngSamples = extractPngSamplesFromMp4(mp4Buffer);
  if (pngSamples.length !== generationResult.frame_count) {
    return failAudit(sourceId);
  }

  const motionFrames: VideoMotionFrameSnapshot[] = [];
  for (let index = 0; index < pngSamples.length; index += 1) {
    const decoded = decodePngRgb(pngSamples[index]);
    if (!decoded) {
      return failAudit(sourceId);
    }
    motionFrames.push(
      extractVideoMotionFrame(decoded.pixels, decoded.width, decoded.height, index)
    );
  }

  const metrics = computeVideoMotionMetrics(motionFrames, generationResult);

  const motionDirectionPersistence =
    metrics.direction_conflict_score <= MAX_DIRECTION_CONFLICT && hasMotionAdapters(generationResult)
      ? 'PASS'
      : 'FAIL';

  const motionSpeedConsistency =
    metrics.motion_speed_variance <= MAX_MOTION_DRIFT &&
    metrics.max_adjacent_motion_gap <= MAX_MOTION_STEP
      ? 'PASS'
      : 'FAIL';

  const cameraMotionConsistency =
    metrics.max_camera_jump <= MAX_CAMERA_JUMP &&
    metrics.camera_motion_consistency_score >= MIN_CAMERA_MOTION_SCORE &&
    generationResult.prompt.includes('[camera]')
      ? 'PASS'
      : 'FAIL';

  const temporalFlowConsistency =
    metrics.temporal_flow_score >= 0.35 &&
    metrics.open_to_last_motion_span <= MAX_TEMPORAL_BREAK
      ? 'PASS'
      : 'FAIL';

  const frameToFrameMotionDrift =
    metrics.frame_to_frame_motion_drift <= MAX_MOTION_DRIFT &&
    metrics.video_motion_score >= MIN_CROSS_FRAME_MOTION_SCORE
      ? 'PASS'
      : 'FAIL';

  const motionDrift =
    motionSpeedConsistency === 'FAIL' || metrics.max_adjacent_motion_gap > MAX_MOTION_DRIFT;
  const cameraJump =
    cameraMotionConsistency === 'FAIL' || metrics.max_camera_jump > MAX_CAMERA_JUMP;
  const temporalBreak =
    temporalFlowConsistency === 'FAIL' || metrics.open_to_last_motion_span > MAX_TEMPORAL_BREAK;
  const motionDirectionConflict =
    motionDirectionPersistence === 'FAIL' ||
    metrics.direction_conflict_score > MAX_DIRECTION_CONFLICT;

  const checks: ValidationStatus[] = [
    motionDirectionPersistence,
    motionSpeedConsistency,
    cameraMotionConsistency,
    temporalFlowConsistency,
    frameToFrameMotionDrift,
  ];

  return {
    source_id: sourceId,
    motion_direction_persistence: motionDirectionPersistence,
    motion_speed_consistency: motionSpeedConsistency,
    camera_motion_consistency: cameraMotionConsistency,
    temporal_flow_consistency: temporalFlowConsistency,
    frame_to_frame_motion_drift: frameToFrameMotionDrift,
    motion_drift: motionDrift,
    camera_jump: cameraJump,
    temporal_break: temporalBreak,
    motion_direction_conflict: motionDirectionConflict,
    motion_frames: motionFrames,
    motion_metrics: metrics,
    source_video_motion_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !motionDrift &&
      !cameraJump &&
      !temporalBreak &&
      !motionDirectionConflict
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoMotionConsistencyAudit[],
  field: keyof Omit<
    SourceVideoMotionConsistencyAudit,
    | 'source_id'
    | 'motion_drift'
    | 'camera_jump'
    | 'temporal_break'
    | 'motion_direction_conflict'
    | 'motion_frames'
    | 'motion_metrics'
    | 'source_video_motion_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealVideoMotionConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Video Motion Consistency Validation',
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
    '## Validation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| frame_count | ${report.frame_count} |`,
    `| motion_direction_persistence | ${report.motion_direction_persistence} |`,
    `| motion_speed_consistency | ${report.motion_speed_consistency} |`,
    `| camera_motion_consistency | ${report.camera_motion_consistency} |`,
    `| temporal_flow_consistency | ${report.temporal_flow_consistency} |`,
    `| frame_to_frame_motion_drift | ${report.frame_to_frame_motion_drift} |`,
    `| video_motion_consistency | ${report.video_motion_consistency} |`,
    `| motion_drift | ${report.motion_drift} |`,
    `| camera_jump | ${report.camera_jump} |`,
    `| temporal_break | ${report.temporal_break} |`,
    `| motion_direction_conflict | ${report.motion_direction_conflict} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- motion_direction_persistence: ${audit.motion_direction_persistence}`,
      `- motion_speed_consistency: ${audit.motion_speed_consistency}`,
      `- camera_motion_consistency: ${audit.camera_motion_consistency}`,
      `- temporal_flow_consistency: ${audit.temporal_flow_consistency}`,
      `- frame_to_frame_motion_drift: ${audit.frame_to_frame_motion_drift}`,
      `- motion_drift: ${audit.motion_drift}`,
      `- camera_jump: ${audit.camera_jump}`,
      `- temporal_break: ${audit.temporal_break}`,
      `- motion_direction_conflict: ${audit.motion_direction_conflict}`,
      `- frames: ${audit.motion_frames.length}`,
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
  issues: RealVideoMotionConsistencyValidationIssue[],
  sourceAudits: SourceVideoMotionConsistencyAudit[] = []
): MovieAnalysisRealVideoMotionConsistencyValidationReport {
  const report: MovieAnalysisRealVideoMotionConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-motion-consistency-validation-report-v1',
    phase: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    real_video_style_consistency_validation_report_path:
      REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_clip_motion_validation_report_path: REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
    real_multi_frame_motion_consistency_validation_report_path:
      REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    video_motion_dir: VIDEO_MOTION_DIR,
    video_motion_manifest_path: VIDEO_MOTION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    motion_direction_persistence: 'FAIL',
    motion_speed_consistency: 'FAIL',
    camera_motion_consistency: 'FAIL',
    temporal_flow_consistency: 'FAIL',
    frame_to_frame_motion_drift: 'FAIL',
    video_motion_consistency: 'FAIL',
    motion_drift: true,
    camera_jump: true,
    temporal_break: true,
    motion_direction_conflict: true,
    real_video_motion_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoMotionConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealVideoMotionConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoMotionConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const styleReport = loadUpstreamReport(
    root,
    REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!styleReport) {
    issues.push({
      code: 'REAL_VIDEO_STYLE_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (styleReport.final_verdict !== REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_013_NOT_PASS',
      message: `L2F-013 must have ${REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    styleReport.certification_status !== REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_013_NOT_VALIDATED',
      message: `L2F-013 status must be ${REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const clipMotionReport = loadUpstreamReport(root, REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH);
  if (!clipMotionReport) {
    issues.push({
      code: 'REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (
    clipMotionReport.final_verdict !== REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_009_NOT_PASS',
      message: `L2F-009 must have ${REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    clipMotionReport.certification_status !== REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_009_NOT_VALIDATED',
      message: `L2F-009 status must be ${REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

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
  } else if (
    motionReport.final_verdict !== REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_008_NOT_PASS',
      message: `L2F-008 must have ${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    motionReport.certification_status !==
    REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_008_NOT_VALIDATED',
      message: `L2F-008 status must be ${REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const videoGenerationReport = loadUpstreamReport(root, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH);
  if (!videoGenerationReport) {
    issues.push({
      code: 'REAL_VIDEO_MODEL_GENERATION_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_MODEL_GENERATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (videoGenerationReport.final_verdict !== REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_010_NOT_PASS',
      message: `L2F-010 must have ${REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    videoGenerationReport.certification_status !== REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_010_NOT_GENERATED',
      message: `L2F-010 status must be ${REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const videoManifest = loadVideoManifest(root);
  if (!videoManifest) {
    issues.push({
      code: 'VIDEO_MODEL_GENERATION_MANIFEST_MISSING',
      message: `Missing ${VIDEO_MODEL_GENERATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const motionManifest = loadMotionManifest(root);
  if (!motionManifest) {
    issues.push({
      code: 'MULTI_FRAME_MOTION_MANIFEST_MISSING',
      message: `Missing ${MULTI_FRAME_MOTION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(path.join(root, VIDEO_CLIP_MANIFEST_PATH))) {
    issues.push({
      code: 'VIDEO_CLIP_MANIFEST_MISSING',
      message: `Missing ${VIDEO_CLIP_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const generationResultBySource = Object.fromEntries(
    videoManifest.results.map((result) => [result.source_id, result])
  );
  const motionEntryBySource = Object.fromEntries(
    motionManifest.entries.map((entry) => [entry.source_id, entry])
  );

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const generationResult = generationResultBySource[sourceId];
    const motionEntry = motionEntryBySource[sourceId];
    const audit = auditSourceVideoMotion(generationResult, motionEntry, root, sourceId);
    if (audit.source_video_motion_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_MOTION_FAIL',
        message: `Video motion consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.motion_drift) {
      issues.push({
        code: 'MOTION_DRIFT',
        message: `Motion drift detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.camera_jump) {
      issues.push({
        code: 'CAMERA_JUMP',
        message: `Camera jump detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.temporal_break) {
      issues.push({
        code: 'TEMPORAL_BREAK',
        message: `Temporal break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.motion_direction_conflict) {
      issues.push({
        code: 'MOTION_DIRECTION_CONFLICT',
        message: `Motion direction conflict detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: VideoMotionManifestEntry[] = sourceAudits.map((audit) => {
    const motionEntry = motionEntryBySource[audit.source_id];
    const generationResult = generationResultBySource[audit.source_id];
    return {
      source_id: audit.source_id,
      motion_profile_id: motionEntry?.motion_profile_id ?? `motion_profile_${audit.source_id.toLowerCase()}_v1`,
      multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
      video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
      mp4_output_path: generationResult?.mp4_output_path ?? '',
      frame_count: audit.motion_frames.length,
      frames: audit.motion_frames,
    };
  });

  fs.mkdirSync(path.join(root, VIDEO_MOTION_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, VIDEO_MOTION_DIR, `${entry.source_id}-video-motion.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const motionManifestOut: MovieAnalysisRealVideoMotionConsistencyManifest = {
    manifest_id: 'movie-analysis-real-video-motion-consistency-manifest-v1',
    phase: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, VIDEO_MOTION_MANIFEST_PATH),
    `${JSON.stringify(motionManifestOut, null, 2)}\n`,
    'utf8'
  );

  const motionDirectionPersistence = aggregateStatus(sourceAudits, 'motion_direction_persistence');
  const motionSpeedConsistency = aggregateStatus(sourceAudits, 'motion_speed_consistency');
  const cameraMotionConsistency = aggregateStatus(sourceAudits, 'camera_motion_consistency');
  const temporalFlowConsistency = aggregateStatus(sourceAudits, 'temporal_flow_consistency');
  const frameToFrameMotionDrift = aggregateStatus(sourceAudits, 'frame_to_frame_motion_drift');

  const motionDrift = sourceAudits.some((audit) => audit.motion_drift);
  const cameraJump = sourceAudits.some((audit) => audit.camera_jump);
  const temporalBreak = sourceAudits.some((audit) => audit.temporal_break);
  const motionDirectionConflict = sourceAudits.some((audit) => audit.motion_direction_conflict);

  const sourceCount = videoManifest.source_count;
  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  const testManifest = fs.existsSync(testManifestPath)
    ? (JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as RealModelTestGenerationManifest)
    : null;
  const adapterCountFromManifest = testManifest?.adapter_count ?? 0;
  const frameCount = motionManifestOut.frame_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (adapterCountFromManifest !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }
  if (frameCount !== EXPECTED_VIDEO_MOTION_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_VIDEO_MOTION_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    motionDirectionPersistence,
    motionSpeedConsistency,
    cameraMotionConsistency,
    temporalFlowConsistency,
    frameToFrameMotionDrift,
  ];

  const videoMotionConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !motionDrift &&
    !cameraJump &&
    !temporalBreak &&
    !motionDirectionConflict &&
    sourceAudits.every((audit) => audit.source_video_motion_consistency_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (motionDrift || cameraJump || temporalBreak || motionDirectionConflict) {
    issues.push({
      code: 'VIDEO_MOTION_BLOCK',
      message: 'Video motion consistency block triggered',
      severity: 'error',
    });
  }
  if (videoMotionConsistency === 'FAIL') {
    issues.push({
      code: 'VIDEO_MOTION_CONSISTENCY_FAIL',
      message: 'Video motion consistency validation failed',
      severity: 'error',
    });
  }

  const realVideoMotionConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCountFromManifest === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_VIDEO_MOTION_FRAME_COUNT &&
    videoMotionConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoMotionConsistencyValidationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_VIDEO_MOTION_NOT_VALIDATED')) {
    issues.push({
      code: 'REAL_VIDEO_MOTION_NOT_VALIDATED',
      message: 'Real video motion consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoMotionConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-motion-consistency-validation-report-v1',
    phase: REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    planning_only: false,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    real_video_style_consistency_validation_report_path:
      REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_clip_motion_validation_report_path: REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
    real_multi_frame_motion_consistency_validation_report_path:
      REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    video_motion_dir: VIDEO_MOTION_DIR,
    video_motion_manifest_path: VIDEO_MOTION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCountFromManifest,
    frame_count: frameCount,
    motion_direction_persistence: motionDirectionPersistence,
    motion_speed_consistency: motionSpeedConsistency,
    camera_motion_consistency: cameraMotionConsistency,
    temporal_flow_consistency: temporalFlowConsistency,
    frame_to_frame_motion_drift: frameToFrameMotionDrift,
    video_motion_consistency: videoMotionConsistency,
    motion_drift: motionDrift,
    camera_jump: cameraJump,
    temporal_break: temporalBreak,
    motion_direction_conflict: motionDirectionConflict,
    real_video_motion_consistency_validation_ready: realVideoMotionConsistencyValidationReady,
    certification_status: pass ? REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MOTION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
