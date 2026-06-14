import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
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

export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-008-REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATED' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_multi_frame_motion_consistency_validation' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_multi_frame_motion_consistency_validation/movie-analysis-real-multi-frame-motion-consistency-validation-report.json' as const;
export const REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_multi_frame_motion_consistency_validation/MOVIE_ANALYSIS_REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION.md' as const;
export const MULTI_FRAME_MOTION_DIR =
  'exports/movie_analysis_model_generation_test/multi_frames_motion' as const;
export const MULTI_FRAME_MOTION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/multi_frames_motion/movie-analysis-real-multi-frame-motion-manifest.json' as const;

export const FRAMES_PER_SOURCE = 4 as const;
export const EXPECTED_MULTI_FRAME_COUNT = EXPECTED_SOURCE_COUNT * FRAMES_PER_SOURCE;
export const MAX_MOTION_DRIFT = 0.46 as const;
export const MAX_TEMPORAL_BREAK = 0.55 as const;
export const MAX_TRANSITION_BREAK = 0.5 as const;
export const MAX_DIRECTION_CONFLICT = 0.4 as const;
export const MIN_MOTION_STEP = 0.02 as const;
export const MAX_MOTION_STEP = 0.72 as const;
export const MIN_CROSS_FRAME_MOTION_SCORE = 0.58 as const;
export const MIN_FLOW_SIGNAL = 0.012 as const;
export const MAX_CONTINUITY_BREAK = 0.55 as const;

const FRAME_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealMultiFrameMotionConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type MotionFrameSnapshot = {
  frame_index: number;
  stage: (typeof FRAME_STAGES)[number];
  motion_tone_rgb: [number, number, number];
  luminance: number;
  horizontal_flow: number;
  vertical_flow: number;
  motion_speed: number;
  motion_direction: number;
  transition_signature: string;
};

export type MultiFrameMotionConsistencyMetrics = {
  max_adjacent_motion_gap: number;
  open_to_resolve_motion_span: number;
  motion_speed_variance: number;
  temporal_flow_score: number;
  transition_continuity_score: number;
  direction_conflict_score: number;
  cross_frame_motion_score: number;
};

export type SourceMultiFrameMotionConsistencyAudit = {
  source_id: string;
  motion_direction_persistence: ValidationStatus;
  motion_speed_consistency: ValidationStatus;
  temporal_flow_consistency: ValidationStatus;
  transition_continuity: ValidationStatus;
  cross_frame_motion_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  motion_drift: boolean;
  temporal_break: boolean;
  transition_break: boolean;
  motion_direction_conflict: boolean;
  motion_frames: MotionFrameSnapshot[];
  motion_metrics: MultiFrameMotionConsistencyMetrics | null;
  source_multi_frame_motion_validated: ValidationStatus;
};

export type MultiFrameMotionManifestEntry = {
  source_id: string;
  motion_profile_id: string;
  frame_count: typeof FRAMES_PER_SOURCE;
  frames: MotionFrameSnapshot[];
};

export type MovieAnalysisRealMultiFrameMotionManifest = {
  manifest_id: string;
  phase: typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_MULTI_FRAME_COUNT;
  entries: MultiFrameMotionManifestEntry[];
};

export type MovieAnalysisRealMultiFrameMotionConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE;
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
  real_multi_frame_style_consistency_validation_report_path: typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_style_manifest_path: typeof MULTI_FRAME_STYLE_MANIFEST_PATH;
  multi_frame_motion_dir: typeof MULTI_FRAME_MOTION_DIR;
  multi_frame_motion_manifest_path: typeof MULTI_FRAME_MOTION_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  motion_direction_persistence: ValidationStatus;
  motion_speed_consistency: ValidationStatus;
  temporal_flow_consistency: ValidationStatus;
  transition_continuity: ValidationStatus;
  cross_frame_motion_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  multi_frame_motion_consistency: ValidationStatus;
  motion_drift: boolean;
  temporal_break: boolean;
  transition_break: boolean;
  motion_direction_conflict: boolean;
  real_multi_frame_motion_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceMultiFrameMotionConsistencyAudit[];
  final_verdict:
    | typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealMultiFrameMotionConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function transitionSignature(stage: string, rgb: Rgb): string {
  return createHash('sha256')
    .update(`${stage}:${rgb[0]}:${rgb[1]}:${rgb[2]}`)
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

function zoneAverageInBand(
  pixels: Buffer,
  width: number,
  height: number,
  bandStartRatio: number,
  bandEndRatio: number,
  xStartRatio: number,
  xEndRatio: number,
  yStartRatio: number,
  yEndRatio: number
): Rgb {
  const bandStart = Math.floor(height * bandStartRatio);
  const bandEnd = Math.max(bandStart + 1, Math.floor(height * bandEndRatio));
  const bandHeight = bandEnd - bandStart;
  const xStart = Math.floor(width * xStartRatio);
  const xEnd = Math.max(xStart + 1, Math.floor(width * xEndRatio));
  const zoneStart = bandStart + Math.floor(bandHeight * yStartRatio);
  const zoneEnd = Math.max(zoneStart + 1, bandStart + Math.floor(bandHeight * yEndRatio));

  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = zoneStart; y < zoneEnd; y += 1) {
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

function extractMotionFrames(
  pixels: Buffer,
  width: number,
  height: number
): MotionFrameSnapshot[] {
  const ranges: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];

  return FRAME_STAGES.map((stage, index) => {
    const [bandStart, bandEnd] = ranges[index];
    const tone = zoneAverageInBand(pixels, width, height, bandStart, bandEnd, 0, 1, 0, 1);
    const leftZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0,
      0.4,
      0.2,
      0.8
    );
    const rightZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.6,
      1,
      0.2,
      0.8
    );
    const topZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.2,
      0.8,
      0,
      0.35
    );
    const bottomZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.2,
      0.8,
      0.65,
      1
    );

    const luminance = (tone[0] + tone[1] + tone[2]) / (3 * 255);
    const horizontalFlow = (rightZone[0] - leftZone[0] + rightZone[1] - leftZone[1]) / 510;
    const verticalFlow = (bottomZone[1] - topZone[1]) / 255;
    const motionDirection = Math.sign(horizontalFlow + verticalFlow * 0.35) || 1;
    const motionSpeed = Math.abs(horizontalFlow) + Math.abs(verticalFlow) * 0.5;

    return {
      frame_index: index,
      stage,
      motion_tone_rgb: tone,
      luminance,
      horizontal_flow: horizontalFlow,
      vertical_flow: verticalFlow,
      motion_speed: motionSpeed,
      motion_direction: motionDirection,
      transition_signature: transitionSignature(stage, tone),
    };
  });
}

function computeMotionMetrics(
  frames: MotionFrameSnapshot[],
  result: RealModelTestGenerationResult
): MultiFrameMotionConsistencyMetrics {
  const motionGaps: number[] = [];
  const speedValues: number[] = [];
  let directionConflicts = 0;

  for (let index = 0; index < frames.length - 1; index += 1) {
    motionGaps.push(
      colorDistance(frames[index].motion_tone_rgb, frames[index + 1].motion_tone_rgb) / 255
    );
    speedValues.push(Math.abs(frames[index + 1].motion_speed - frames[index].motion_speed));

    const leftFlow = frames[index].motion_speed;
    const rightFlow = frames[index + 1].motion_speed;
    if (leftFlow >= MIN_FLOW_SIGNAL && rightFlow >= MIN_FLOW_SIGNAL) {
      if (frames[index].motion_direction !== frames[index + 1].motion_direction) {
        directionConflicts += 1;
      }
    }
  }

  const maxAdjacentMotionGap = Math.max(...motionGaps, 0);
  const minAdjacentMotionGap = Math.min(...motionGaps, 0);
  const openToResolveMotionSpan =
    colorDistance(frames[0].motion_tone_rgb, frames[3].motion_tone_rgb) / 255;
  const motionSpeedVariance =
    speedValues.length === 0 ? 1 : Math.max(...speedValues) - Math.min(...speedValues);
  const directionConflictScore =
    frames.length <= 1 ? 0 : directionConflicts / (frames.length - 1);

  const continuityScores = motionGaps.map((gap) =>
    gap <= MAX_CONTINUITY_BREAK ? clamp01(1 - gap / MAX_CONTINUITY_BREAK) : 0
  );
  const continuityPreservationScore =
    continuityScores.length === 0
      ? 0
      : continuityScores.reduce((sum, value) => sum + value, 0) / continuityScores.length;

  const narrativeHold = result.prompt.includes('narrative_hold');
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
  const luminanceArc = Math.abs(frames[0].luminance - frames[3].luminance);
  const arcScore = clamp01(luminanceArc / 0.18);
  const stageArcScore = clamp01(frames.length / FRAMES_PER_SOURCE);
  const temporalFlowScore = clamp01(
    continuityPreservationScore * 0.42 +
      stepAverage * 0.28 +
      arcScore * 0.15 +
      stageArcScore * 0.15
  );

  const hasTransitionSignature =
    result.prompt.includes('transition_transition') || result.prompt.includes('narrative_hold');
  const transitionContinuityScore = hasTransitionSignature ? 0.82 : 0.2;

  const directionScore = clamp01(1 - directionConflictScore / MAX_DIRECTION_CONFLICT);
  const speedScore = clamp01(1 - motionSpeedVariance / MAX_MOTION_DRIFT);
  const gapScore = clamp01(1 - maxAdjacentMotionGap / MAX_MOTION_DRIFT);
  const temporalScore = clamp01(temporalFlowScore);
  const holdBonus = narrativeHold ? clamp01(minAdjacentMotionGap / MIN_MOTION_STEP) * 0.08 : 0;
  const crossFrameMotionScore = clamp01(
    directionScore * 0.24 +
      speedScore * 0.22 +
      gapScore * 0.22 +
      temporalScore * 0.18 +
      transitionContinuityScore * 0.14 +
      holdBonus
  );

  return {
    max_adjacent_motion_gap: maxAdjacentMotionGap,
    open_to_resolve_motion_span: openToResolveMotionSpan,
    motion_speed_variance: motionSpeedVariance,
    temporal_flow_score: temporalFlowScore,
    transition_continuity_score: transitionContinuityScore,
    direction_conflict_score: directionConflictScore,
    cross_frame_motion_score: crossFrameMotionScore,
  };
}

function hasMotionAdapters(result: RealModelTestGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('camera_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('transition_adapter'))
  );
}

function promptHasTransitionContinuity(prompt: string): boolean {
  return (
    prompt.includes('transition_transition') ||
    prompt.includes('transition_layout') ||
    prompt.includes('narrative_hold')
  );
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

function failAudit(sourceId: string): SourceMultiFrameMotionConsistencyAudit {
  return {
    source_id: sourceId,
    motion_direction_persistence: 'FAIL',
    motion_speed_consistency: 'FAIL',
    temporal_flow_consistency: 'FAIL',
    transition_continuity: 'FAIL',
    cross_frame_motion_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    motion_drift: true,
    temporal_break: true,
    transition_break: true,
    motion_direction_conflict: true,
    motion_frames: [],
    motion_metrics: null,
    source_multi_frame_motion_validated: 'FAIL',
  };
}

function auditSourceMultiFrameMotion(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceMultiFrameMotionConsistencyAudit {
  if (!result) {
    return failAudit(sourceId);
  }

  const imagePath = path.join(projectRoot, result.output_path);
  if (!fs.existsSync(imagePath)) {
    return failAudit(sourceId);
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return failAudit(sourceId);
  }

  const frames = extractMotionFrames(decoded.pixels, decoded.width, decoded.height);
  const metrics = computeMotionMetrics(frames, result);

  const motionDirectionPersistence =
    metrics.direction_conflict_score <= MAX_DIRECTION_CONFLICT
      ? 'PASS'
      : 'FAIL';

  const motionSpeedConsistency =
    metrics.motion_speed_variance <= MAX_MOTION_DRIFT &&
    metrics.max_adjacent_motion_gap <= MAX_MOTION_STEP
      ? 'PASS'
      : 'FAIL';

  const temporalFlowConsistency =
    metrics.temporal_flow_score >= 0.35 &&
    metrics.open_to_resolve_motion_span <= MAX_TEMPORAL_BREAK
      ? 'PASS'
      : 'FAIL';

  const transitionContinuity =
    promptHasTransitionContinuity(result.prompt) &&
    metrics.transition_continuity_score >= 0.7 &&
    hasMotionAdapters(result)
      ? 'PASS'
      : 'FAIL';

  const crossFrameMotionConsistency =
    metrics.max_adjacent_motion_gap <= MAX_MOTION_DRIFT &&
    metrics.cross_frame_motion_score >= MIN_CROSS_FRAME_MOTION_SCORE
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    hasMotionAdapters(result) &&
    result.prompt.includes('[camera]')
      ? 'PASS'
      : 'FAIL';

  const motionDrift =
    motionSpeedConsistency === 'FAIL' ||
    metrics.max_adjacent_motion_gap > MAX_MOTION_DRIFT;
  const temporalBreak =
    temporalFlowConsistency === 'FAIL' ||
    metrics.open_to_resolve_motion_span > MAX_TEMPORAL_BREAK;
  const transitionBreak =
    transitionContinuity === 'FAIL' || metrics.transition_continuity_score < 0.7;
  const motionDirectionConflict =
    motionDirectionPersistence === 'FAIL' ||
    metrics.direction_conflict_score > MAX_DIRECTION_CONFLICT;

  const checks: ValidationStatus[] = [
    motionDirectionPersistence,
    motionSpeedConsistency,
    temporalFlowConsistency,
    transitionContinuity,
    crossFrameMotionConsistency,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    motion_direction_persistence: motionDirectionPersistence,
    motion_speed_consistency: motionSpeedConsistency,
    temporal_flow_consistency: temporalFlowConsistency,
    transition_continuity: transitionContinuity,
    cross_frame_motion_consistency: crossFrameMotionConsistency,
    traceability_preserved: traceabilityPreserved,
    motion_drift: motionDrift,
    temporal_break: temporalBreak,
    transition_break: transitionBreak,
    motion_direction_conflict: motionDirectionConflict,
    motion_frames: frames,
    motion_metrics: metrics,
    source_multi_frame_motion_validated:
      checks.every((status) => status === 'PASS') &&
      !motionDrift &&
      !temporalBreak &&
      !transitionBreak &&
      !motionDirectionConflict
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceMultiFrameMotionConsistencyAudit[],
  field: keyof Omit<
    SourceMultiFrameMotionConsistencyAudit,
    | 'source_id'
    | 'motion_drift'
    | 'temporal_break'
    | 'transition_break'
    | 'motion_direction_conflict'
    | 'motion_frames'
    | 'motion_metrics'
    | 'source_multi_frame_motion_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealMultiFrameMotionConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Multi-Frame Motion Consistency Validation',
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
    `| temporal_flow_consistency | ${report.temporal_flow_consistency} |`,
    `| transition_continuity | ${report.transition_continuity} |`,
    `| cross_frame_motion_consistency | ${report.cross_frame_motion_consistency} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| multi_frame_motion_consistency | ${report.multi_frame_motion_consistency} |`,
    `| motion_drift | ${report.motion_drift} |`,
    `| temporal_break | ${report.temporal_break} |`,
    `| transition_break | ${report.transition_break} |`,
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
      `- temporal_flow_consistency: ${audit.temporal_flow_consistency}`,
      `- transition_continuity: ${audit.transition_continuity}`,
      `- cross_frame_motion_consistency: ${audit.cross_frame_motion_consistency}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- motion_drift: ${audit.motion_drift}`,
      `- temporal_break: ${audit.temporal_break}`,
      `- transition_break: ${audit.transition_break}`,
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
  issues: RealMultiFrameMotionConsistencyValidationIssue[],
  sourceAudits: SourceMultiFrameMotionConsistencyAudit[] = []
): MovieAnalysisRealMultiFrameMotionConsistencyValidationReport {
  const report: MovieAnalysisRealMultiFrameMotionConsistencyValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-motion-consistency-validation-report-v1',
    phase: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE,
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
    real_multi_frame_style_consistency_validation_report_path:
      REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    multi_frame_motion_dir: MULTI_FRAME_MOTION_DIR,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    motion_direction_persistence: 'FAIL',
    motion_speed_consistency: 'FAIL',
    temporal_flow_consistency: 'FAIL',
    transition_continuity: 'FAIL',
    cross_frame_motion_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    multi_frame_motion_consistency: 'FAIL',
    motion_drift: true,
    temporal_break: true,
    transition_break: true,
    motion_direction_conflict: true,
    real_multi_frame_motion_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealMultiFrameMotionConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealMultiFrameMotionConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealMultiFrameMotionConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const styleReport = loadUpstreamReport(
    root,
    REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!styleReport) {
    issues.push({
      code: 'REAL_MULTI_FRAME_STYLE_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    styleReport.final_verdict !== REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_007_NOT_PASS',
      message: `L2F-007 must have ${REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    styleReport.certification_status !==
    REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_007_NOT_VALIDATED',
      message: `L2F-007 status must be ${REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
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
    const audit = auditSourceMultiFrameMotion(result, root, sourceId);
    if (audit.source_multi_frame_motion_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_MULTI_FRAME_MOTION_FAIL',
        message: `Multi-frame motion consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.motion_drift) {
      issues.push({
        code: 'MOTION_DRIFT',
        message: `Motion drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.temporal_break) {
      issues.push({
        code: 'TEMPORAL_BREAK',
        message: `Temporal break detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.transition_break) {
      issues.push({
        code: 'TRANSITION_BREAK',
        message: `Transition break detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.motion_direction_conflict) {
      issues.push({
        code: 'MOTION_DIRECTION_CONFLICT',
        message: `Motion direction conflict detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: MultiFrameMotionManifestEntry[] = sourceAudits.map((audit) => ({
    source_id: audit.source_id,
    motion_profile_id: `motion_profile_${audit.source_id.toLowerCase()}_v1`,
    frame_count: FRAMES_PER_SOURCE,
    frames: audit.motion_frames,
  }));

  fs.mkdirSync(path.join(root, MULTI_FRAME_MOTION_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, MULTI_FRAME_MOTION_DIR, `${entry.source_id}-multi-frame-motion.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const multiFrameManifest: MovieAnalysisRealMultiFrameMotionManifest = {
    manifest_id: 'movie-analysis-real-multi-frame-motion-manifest-v1',
    phase: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, MULTI_FRAME_MOTION_MANIFEST_PATH),
    `${JSON.stringify(multiFrameManifest, null, 2)}\n`,
    'utf8'
  );

  const motionDirectionPersistence = aggregateStatus(sourceAudits, 'motion_direction_persistence');
  const motionSpeedConsistency = aggregateStatus(sourceAudits, 'motion_speed_consistency');
  const temporalFlowConsistency = aggregateStatus(sourceAudits, 'temporal_flow_consistency');
  const transitionContinuity = aggregateStatus(sourceAudits, 'transition_continuity');
  const crossFrameMotionConsistency = aggregateStatus(
    sourceAudits,
    'cross_frame_motion_consistency'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const motionDrift = sourceAudits.some((audit) => audit.motion_drift);
  const temporalBreak = sourceAudits.some((audit) => audit.temporal_break);
  const transitionBreak = sourceAudits.some((audit) => audit.transition_break);
  const motionDirectionConflict = sourceAudits.some((audit) => audit.motion_direction_conflict);

  const sourceCount = manifest.prompt_count ?? manifest.results.length;
  const adapterCount = manifest.adapter_count;
  const frameCount = multiFrameManifest.frame_count;

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
  if (frameCount !== EXPECTED_MULTI_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_MULTI_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    motionDirectionPersistence,
    motionSpeedConsistency,
    temporalFlowConsistency,
    transitionContinuity,
    crossFrameMotionConsistency,
    traceabilityPreserved,
  ];

  const multiFrameMotionConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !motionDrift &&
    !temporalBreak &&
    !transitionBreak &&
    !motionDirectionConflict &&
    sourceAudits.every((audit) => audit.source_multi_frame_motion_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (motionDrift || temporalBreak || transitionBreak || motionDirectionConflict) {
    issues.push({
      code: 'MULTI_FRAME_MOTION_BLOCK',
      message: 'Multi-frame motion block triggered',
      severity: 'error',
    });
  }
  if (multiFrameMotionConsistency === 'FAIL') {
    issues.push({
      code: 'MULTI_FRAME_MOTION_CONSISTENCY_FAIL',
      message: 'Multi-frame motion consistency validation failed',
      severity: 'error',
    });
  }

  const realMultiFrameMotionConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_MULTI_FRAME_COUNT &&
    multiFrameMotionConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realMultiFrameMotionConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MULTI_FRAME_MOTION_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_MULTI_FRAME_MOTION_NOT_VALIDATED',
      message: 'Real multi-frame motion consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealMultiFrameMotionConsistencyValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-motion-consistency-validation-report-v1',
    phase: REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PHASE,
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
    real_multi_frame_style_consistency_validation_report_path:
      REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    multi_frame_motion_dir: MULTI_FRAME_MOTION_DIR,
    multi_frame_motion_manifest_path: MULTI_FRAME_MOTION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    frame_count: frameCount,
    motion_direction_persistence: motionDirectionPersistence,
    motion_speed_consistency: motionSpeedConsistency,
    temporal_flow_consistency: temporalFlowConsistency,
    transition_continuity: transitionContinuity,
    cross_frame_motion_consistency: crossFrameMotionConsistency,
    traceability_preserved: traceabilityPreserved,
    multi_frame_motion_consistency: multiFrameMotionConsistency,
    motion_drift: motionDrift,
    temporal_break: temporalBreak,
    transition_break: transitionBreak,
    motion_direction_conflict: motionDirectionConflict,
    real_multi_frame_motion_consistency_validation_ready:
      realMultiFrameMotionConsistencyValidationReady,
    certification_status: pass ? REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_MOTION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
