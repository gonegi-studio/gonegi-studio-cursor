import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MAX_COMPOSITION_STYLE_BREAK,
  MAX_LIGHTING_STYLE_DRIFT,
  MAX_STYLE_DRIFT,
  MIN_CROSS_FRAME_STYLE_SCORE,
  MIN_TEXTURE_VARIANCE,
  MULTI_FRAME_STYLE_MANIFEST_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  type MovieAnalysisRealMultiFrameStyleManifest,
} from './movieAnalysisRealMultiFrameStyleConsistencyValidation.js';
import { MOVIE_FRAME_PALETTES } from './movieAnalysisRealMovieFrameIngestion.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationManifest,
} from './movieAnalysisRealModelTestGeneration.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealVideoLocationConsistencyValidation.js';
import {
  extractPngSamplesFromMp4,
} from './movieAnalysisRealVideoIdentityConsistencyValidation.js';
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

export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-013-REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_VIDEO_STYLE_CONSISTENCY_VALIDATED' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_video_style_consistency_validation' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_video_style_consistency_validation/movie-analysis-real-video-style-consistency-validation-report.json' as const;
export const REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_video_style_consistency_validation/MOVIE_ANALYSIS_REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION.md' as const;
export const VIDEO_STYLE_DIR =
  'exports/movie_analysis_model_generation_test/video_style' as const;
export const VIDEO_STYLE_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_style/movie-analysis-real-video-style-consistency-manifest.json' as const;

export const EXPECTED_VIDEO_STYLE_FRAME_COUNT = EXPECTED_SOURCE_COUNT * CLIP_FRAMES_PER_SOURCE;
export const MIN_VIDEO_COMPOSITION_SPREAD = 0.015 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealVideoStyleConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoStyleFrameSnapshot = {
  frame_index: number;
  style_palette_rgb: [number, number, number];
  accent_zone_rgb: [number, number, number];
  lighting_warmth: number;
  texture_variance: number;
  composition_spread: number;
  style_signature: string;
};

export type VideoStyleConsistencyMetrics = {
  max_adjacent_style_gap: number;
  anchor_to_last_style_span: number;
  max_adjacent_lighting_style_gap: number;
  texture_variance_span: number;
  max_adjacent_composition_gap: number;
  frame_to_frame_style_drift: number;
  video_style_score: number;
};

export type VideoStyleManifestEntry = {
  source_id: string;
  narrative_style_id: string;
  multi_frame_style_manifest_path: typeof MULTI_FRAME_STYLE_MANIFEST_PATH;
  mp4_output_path: string;
  frame_count: number;
  frames: VideoStyleFrameSnapshot[];
};

export type MovieAnalysisRealVideoStyleConsistencyManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  multi_frame_style_manifest_path: typeof MULTI_FRAME_STYLE_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_VIDEO_STYLE_FRAME_COUNT;
  entries: VideoStyleManifestEntry[];
};

export type SourceVideoStyleConsistencyAudit = {
  source_id: string;
  style_palette_persistence: ValidationStatus;
  lighting_style_persistence: ValidationStatus;
  texture_style_persistence: ValidationStatus;
  composition_style_persistence: ValidationStatus;
  frame_to_frame_style_drift: ValidationStatus;
  style_adapter_binding: ValidationStatus;
  style_drift: boolean;
  lighting_style_break: boolean;
  texture_mismatch: boolean;
  composition_break: boolean;
  style_frames: VideoStyleFrameSnapshot[];
  style_metrics: VideoStyleConsistencyMetrics | null;
  source_video_style_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealVideoStyleConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE;
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
  real_video_location_consistency_validation_report_path: typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_multi_frame_style_consistency_validation_report_path: typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_video_model_generation_report_path: typeof REAL_VIDEO_MODEL_GENERATION_REPORT_PATH;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  multi_frame_style_manifest_path: typeof MULTI_FRAME_STYLE_MANIFEST_PATH;
  video_style_dir: typeof VIDEO_STYLE_DIR;
  video_style_manifest_path: typeof VIDEO_STYLE_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  style_palette_persistence: ValidationStatus;
  lighting_style_persistence: ValidationStatus;
  texture_style_persistence: ValidationStatus;
  composition_style_persistence: ValidationStatus;
  frame_to_frame_style_drift: ValidationStatus;
  style_adapter_binding: ValidationStatus;
  video_style_consistency: ValidationStatus;
  style_drift: boolean;
  lighting_style_break: boolean;
  texture_mismatch: boolean;
  composition_break: boolean;
  real_video_style_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceVideoStyleConsistencyAudit[];
  final_verdict:
    | typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealVideoStyleConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function styleSignature(rgb: Rgb): string {
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

function zoneVariance(
  pixels: Buffer,
  width: number,
  height: number,
  xStartRatio: number,
  xEndRatio: number,
  yStartRatio: number,
  yEndRatio: number
): number {
  const xStart = Math.floor(width * xStartRatio);
  const xEnd = Math.max(xStart + 1, Math.floor(width * xEndRatio));
  const yStart = Math.floor(height * yStartRatio);
  const yEnd = Math.max(yStart + 1, Math.floor(height * yEndRatio));

  const values: number[] = [];
  for (let y = yStart; y < yEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 1) {
      const index = (y * width + x) * 3;
      values.push((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    }
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function extractStyleFrame(
  pixels: Buffer,
  width: number,
  height: number,
  frameIndex: number
): VideoStyleFrameSnapshot {
  const accentZone = zoneAverage(pixels, width, height, 0.3, 0.7, 0.55, 0.85);
  const midgroundZone = zoneAverage(pixels, width, height, 0.25, 0.75, 0.35, 0.65);
  const skyZone = zoneAverage(pixels, width, height, 0, 1, 0, 0.25);
  const leftZone = zoneAverage(pixels, width, height, 0, 0.35, 0.2, 0.8);
  const rightZone = zoneAverage(pixels, width, height, 0.65, 1, 0.2, 0.8);

  const stylePalette: Rgb = [
    Math.round((accentZone[0] + midgroundZone[0]) / 2),
    Math.round((accentZone[1] + midgroundZone[1]) / 2),
    Math.round((accentZone[2] + midgroundZone[2]) / 2),
  ];

  return {
    frame_index: frameIndex,
    style_palette_rgb: stylePalette,
    accent_zone_rgb: accentZone,
    lighting_warmth: (skyZone[0] - skyZone[2] + 128) / 255,
    texture_variance: zoneVariance(pixels, width, height, 0, 1, 0, 1),
    composition_spread: colorDistance(leftZone, rightZone) / 255,
    style_signature: styleSignature(stylePalette),
  };
}

function computeStyleMetrics(frames: VideoStyleFrameSnapshot[]): VideoStyleConsistencyMetrics {
  const styleGaps: number[] = [];
  const lightingGaps: number[] = [];
  const compositionGaps: number[] = [];
  const textureValues = frames.map((frame) => frame.texture_variance);

  for (let index = 0; index < frames.length - 1; index += 1) {
    styleGaps.push(
      colorDistance(frames[index].style_palette_rgb, frames[index + 1].style_palette_rgb) / 255
    );
    lightingGaps.push(
      Math.abs(frames[index].lighting_warmth - frames[index + 1].lighting_warmth)
    );
    compositionGaps.push(
      Math.abs(frames[index].composition_spread - frames[index + 1].composition_spread)
    );
  }

  const anchorSpans = frames.map(
    (frame) => colorDistance(frames[0].style_palette_rgb, frame.style_palette_rgb) / 255
  );

  const maxAdjacentStyleGap = Math.max(...styleGaps, 0);
  const anchorToLastStyleSpan = Math.max(...anchorSpans, 0);
  const maxAdjacentLightingStyleGap = Math.max(...lightingGaps, 0);
  const textureVarianceSpan =
    textureValues.length === 0 ? 1 : Math.max(...textureValues) - Math.min(...textureValues);
  const maxAdjacentCompositionGap = Math.max(...compositionGaps, 0);
  const frameToFrameStyleDrift = Math.max(
    maxAdjacentStyleGap,
    maxAdjacentCompositionGap * 0.6 + maxAdjacentLightingStyleGap * 0.4
  );

  const paletteScore = clamp01(1 - maxAdjacentStyleGap / MAX_STYLE_DRIFT);
  const lightingScore = clamp01(1 - maxAdjacentLightingStyleGap / MAX_LIGHTING_STYLE_DRIFT);
  const textureScore = clamp01(1 - textureVarianceSpan / (MIN_TEXTURE_VARIANCE * 2));
  const compositionScore = clamp01(1 - maxAdjacentCompositionGap / MAX_COMPOSITION_STYLE_BREAK);
  const videoStyleScore = clamp01(
    paletteScore * 0.3 + lightingScore * 0.25 + textureScore * 0.22 + compositionScore * 0.23
  );

  return {
    max_adjacent_style_gap: maxAdjacentStyleGap,
    anchor_to_last_style_span: anchorToLastStyleSpan,
    max_adjacent_lighting_style_gap: maxAdjacentLightingStyleGap,
    texture_variance_span: textureVarianceSpan,
    max_adjacent_composition_gap: maxAdjacentCompositionGap,
    frame_to_frame_style_drift: frameToFrameStyleDrift,
    video_style_score: videoStyleScore,
  };
}

function hasStyleAdapters(result: RealVideoModelGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('transition_adapter'))
  );
}

function promptHasNarrativeStyle(prompt: string): boolean {
  return prompt.includes('narrative_hold') && prompt.includes('transition_layout');
}

function loadVideoManifest(root: string): MovieAnalysisRealVideoModelGenerationManifest | null {
  const abs = path.join(root, VIDEO_MODEL_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealVideoModelGenerationManifest;
}

function loadStyleManifest(root: string): MovieAnalysisRealMultiFrameStyleManifest | null {
  const abs = path.join(root, MULTI_FRAME_STYLE_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealMultiFrameStyleManifest;
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

function failAudit(sourceId: string): SourceVideoStyleConsistencyAudit {
  return {
    source_id: sourceId,
    style_palette_persistence: 'FAIL',
    lighting_style_persistence: 'FAIL',
    texture_style_persistence: 'FAIL',
    composition_style_persistence: 'FAIL',
    frame_to_frame_style_drift: 'FAIL',
    style_adapter_binding: 'FAIL',
    style_drift: true,
    lighting_style_break: true,
    texture_mismatch: true,
    composition_break: true,
    style_frames: [],
    style_metrics: null,
    source_video_style_consistency_validated: 'FAIL',
  };
}

function auditSourceVideoStyle(
  generationResult: RealVideoModelGenerationResult | undefined,
  styleEntry: MovieAnalysisRealMultiFrameStyleManifest['entries'][number] | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceVideoStyleConsistencyAudit {
  if (!generationResult || !styleEntry) {
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

  const styleFrames: VideoStyleFrameSnapshot[] = [];
  for (let index = 0; index < pngSamples.length; index += 1) {
    const decoded = decodePngRgb(pngSamples[index]);
    if (!decoded) {
      return failAudit(sourceId);
    }
    styleFrames.push(
      extractStyleFrame(decoded.pixels, decoded.width, decoded.height, index)
    );
  }

  const metrics = computeStyleMetrics(styleFrames);
  const palette = MOVIE_FRAME_PALETTES[sourceId];
  const expectedStylePalette: Rgb = [
    Math.round((palette.accent[0] + palette.midground[0]) / 2),
    Math.round((palette.accent[1] + palette.midground[1]) / 2),
    Math.round((palette.accent[2] + palette.midground[2]) / 2),
  ];

  const paletteDrifts = styleFrames.map(
    (frame) => colorDistance(frame.style_palette_rgb, expectedStylePalette) / 255
  );

  const stylePalettePersistence =
    paletteDrifts.every((drift) => drift <= MAX_STYLE_DRIFT) &&
    metrics.max_adjacent_style_gap <= MAX_STYLE_DRIFT &&
    metrics.anchor_to_last_style_span <= MAX_STYLE_DRIFT * 1.15
      ? 'PASS'
      : 'FAIL';

  const lightingStylePersistence =
    metrics.max_adjacent_lighting_style_gap <= MAX_LIGHTING_STYLE_DRIFT &&
    styleFrames.every((frame) => frame.lighting_warmth >= 0 && frame.lighting_warmth <= 1)
      ? 'PASS'
      : 'FAIL';

  const textureStylePersistence =
    styleFrames.every((frame) => frame.texture_variance >= MIN_TEXTURE_VARIANCE) &&
    metrics.texture_variance_span <= MIN_TEXTURE_VARIANCE * 2
      ? 'PASS'
      : 'FAIL';

  const compositionStylePersistence =
    styleFrames.every((frame) => frame.composition_spread >= MIN_VIDEO_COMPOSITION_SPREAD) &&
    metrics.max_adjacent_composition_gap <= MAX_COMPOSITION_STYLE_BREAK
      ? 'PASS'
      : 'FAIL';

  const frameToFrameStyleDrift =
    metrics.frame_to_frame_style_drift <= MAX_STYLE_DRIFT &&
    metrics.video_style_score >= MIN_CROSS_FRAME_STYLE_SCORE
      ? 'PASS'
      : 'FAIL';

  const styleAdapterBinding =
    generationResult.traceability.traceability_preserved === true &&
    hasStyleAdapters(generationResult) &&
    promptHasNarrativeStyle(generationResult.prompt)
      ? 'PASS'
      : 'FAIL';

  const styleDrift =
    stylePalettePersistence === 'FAIL' ||
    metrics.anchor_to_last_style_span > MAX_STYLE_DRIFT * 1.15;
  const lightingStyleBreak =
    lightingStylePersistence === 'FAIL' ||
    metrics.max_adjacent_lighting_style_gap > MAX_LIGHTING_STYLE_DRIFT;
  const textureMismatch =
    textureStylePersistence === 'FAIL' ||
    metrics.texture_variance_span > MIN_TEXTURE_VARIANCE * 2;
  const compositionBreak =
    compositionStylePersistence === 'FAIL' ||
    metrics.max_adjacent_composition_gap > MAX_COMPOSITION_STYLE_BREAK;

  const checks: ValidationStatus[] = [
    stylePalettePersistence,
    lightingStylePersistence,
    textureStylePersistence,
    compositionStylePersistence,
    frameToFrameStyleDrift,
    styleAdapterBinding,
  ];

  return {
    source_id: sourceId,
    style_palette_persistence: stylePalettePersistence,
    lighting_style_persistence: lightingStylePersistence,
    texture_style_persistence: textureStylePersistence,
    composition_style_persistence: compositionStylePersistence,
    frame_to_frame_style_drift: frameToFrameStyleDrift,
    style_adapter_binding: styleAdapterBinding,
    style_drift: styleDrift,
    lighting_style_break: lightingStyleBreak,
    texture_mismatch: textureMismatch,
    composition_break: compositionBreak,
    style_frames: styleFrames,
    style_metrics: metrics,
    source_video_style_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !styleDrift &&
      !lightingStyleBreak &&
      !textureMismatch &&
      !compositionBreak
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoStyleConsistencyAudit[],
  field: keyof Omit<
    SourceVideoStyleConsistencyAudit,
    | 'source_id'
    | 'style_drift'
    | 'lighting_style_break'
    | 'texture_mismatch'
    | 'composition_break'
    | 'style_frames'
    | 'style_metrics'
    | 'source_video_style_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealVideoStyleConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Video Style Consistency Validation',
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
    `| style_palette_persistence | ${report.style_palette_persistence} |`,
    `| lighting_style_persistence | ${report.lighting_style_persistence} |`,
    `| texture_style_persistence | ${report.texture_style_persistence} |`,
    `| composition_style_persistence | ${report.composition_style_persistence} |`,
    `| frame_to_frame_style_drift | ${report.frame_to_frame_style_drift} |`,
    `| style_adapter_binding | ${report.style_adapter_binding} |`,
    `| video_style_consistency | ${report.video_style_consistency} |`,
    `| style_drift | ${report.style_drift} |`,
    `| lighting_style_break | ${report.lighting_style_break} |`,
    `| texture_mismatch | ${report.texture_mismatch} |`,
    `| composition_break | ${report.composition_break} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- style_palette_persistence: ${audit.style_palette_persistence}`,
      `- lighting_style_persistence: ${audit.lighting_style_persistence}`,
      `- texture_style_persistence: ${audit.texture_style_persistence}`,
      `- composition_style_persistence: ${audit.composition_style_persistence}`,
      `- frame_to_frame_style_drift: ${audit.frame_to_frame_style_drift}`,
      `- style_adapter_binding: ${audit.style_adapter_binding}`,
      `- style_drift: ${audit.style_drift}`,
      `- lighting_style_break: ${audit.lighting_style_break}`,
      `- texture_mismatch: ${audit.texture_mismatch}`,
      `- composition_break: ${audit.composition_break}`,
      `- frames: ${audit.style_frames.length}`,
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
  issues: RealVideoStyleConsistencyValidationIssue[],
  sourceAudits: SourceVideoStyleConsistencyAudit[] = []
): MovieAnalysisRealVideoStyleConsistencyValidationReport {
  const report: MovieAnalysisRealVideoStyleConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-style-consistency-validation-report-v1',
    phase: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_location_consistency_validation_report_path:
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_multi_frame_style_consistency_validation_report_path:
      REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    video_style_dir: VIDEO_STYLE_DIR,
    video_style_manifest_path: VIDEO_STYLE_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    style_palette_persistence: 'FAIL',
    lighting_style_persistence: 'FAIL',
    texture_style_persistence: 'FAIL',
    composition_style_persistence: 'FAIL',
    frame_to_frame_style_drift: 'FAIL',
    style_adapter_binding: 'FAIL',
    video_style_consistency: 'FAIL',
    style_drift: true,
    lighting_style_break: true,
    texture_mismatch: true,
    composition_break: true,
    real_video_style_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoStyleConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealVideoStyleConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoStyleConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const locationReport = loadUpstreamReport(
    root,
    REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!locationReport) {
    issues.push({
      code: 'REAL_VIDEO_LOCATION_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    locationReport.final_verdict !== REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_012_NOT_PASS',
      message: `L2F-012 must have ${REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    locationReport.certification_status !==
    REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_012_NOT_VALIDATED',
      message: `L2F-012 status must be ${REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

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
  } else if (
    styleReport.final_verdict !== REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_007_NOT_PASS',
      message: `L2F-007 must have ${REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    styleReport.certification_status !==
    REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_007_NOT_VALIDATED',
      message: `L2F-007 status must be ${REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
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

  const styleManifest = loadStyleManifest(root);
  if (!styleManifest) {
    issues.push({
      code: 'MULTI_FRAME_STYLE_MANIFEST_MISSING',
      message: `Missing ${MULTI_FRAME_STYLE_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const generationResultBySource = Object.fromEntries(
    videoManifest.results.map((result) => [result.source_id, result])
  );
  const styleEntryBySource = Object.fromEntries(
    styleManifest.entries.map((entry) => [entry.source_id, entry])
  );

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const generationResult = generationResultBySource[sourceId];
    const styleEntry = styleEntryBySource[sourceId];
    const audit = auditSourceVideoStyle(generationResult, styleEntry, root, sourceId);
    if (audit.source_video_style_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_STYLE_FAIL',
        message: `Video style consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.style_drift) {
      issues.push({
        code: 'STYLE_DRIFT',
        message: `Style drift detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.lighting_style_break) {
      issues.push({
        code: 'LIGHTING_STYLE_BREAK',
        message: `Lighting style break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.texture_mismatch) {
      issues.push({
        code: 'TEXTURE_MISMATCH',
        message: `Texture mismatch detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.composition_break) {
      issues.push({
        code: 'COMPOSITION_BREAK',
        message: `Composition break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: VideoStyleManifestEntry[] = sourceAudits.map((audit) => {
    const styleEntry = styleEntryBySource[audit.source_id];
    const generationResult = generationResultBySource[audit.source_id];
    return {
      source_id: audit.source_id,
      narrative_style_id: styleEntry?.narrative_style_id ?? `narrative_style_${audit.source_id.toLowerCase()}_v1`,
      multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
      mp4_output_path: generationResult?.mp4_output_path ?? '',
      frame_count: audit.style_frames.length,
      frames: audit.style_frames,
    };
  });

  fs.mkdirSync(path.join(root, VIDEO_STYLE_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, VIDEO_STYLE_DIR, `${entry.source_id}-video-style.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const styleManifestOut: MovieAnalysisRealVideoStyleConsistencyManifest = {
    manifest_id: 'movie-analysis-real-video-style-consistency-manifest-v1',
    phase: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, VIDEO_STYLE_MANIFEST_PATH),
    `${JSON.stringify(styleManifestOut, null, 2)}\n`,
    'utf8'
  );

  const stylePalettePersistence = aggregateStatus(sourceAudits, 'style_palette_persistence');
  const lightingStylePersistence = aggregateStatus(sourceAudits, 'lighting_style_persistence');
  const textureStylePersistence = aggregateStatus(sourceAudits, 'texture_style_persistence');
  const compositionStylePersistence = aggregateStatus(
    sourceAudits,
    'composition_style_persistence'
  );
  const frameToFrameStyleDrift = aggregateStatus(sourceAudits, 'frame_to_frame_style_drift');
  const styleAdapterBinding = aggregateStatus(sourceAudits, 'style_adapter_binding');

  const styleDrift = sourceAudits.some((audit) => audit.style_drift);
  const lightingStyleBreak = sourceAudits.some((audit) => audit.lighting_style_break);
  const textureMismatch = sourceAudits.some((audit) => audit.texture_mismatch);
  const compositionBreak = sourceAudits.some((audit) => audit.composition_break);

  const sourceCount = videoManifest.source_count;
  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  const testManifest = fs.existsSync(testManifestPath)
    ? (JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as RealModelTestGenerationManifest)
    : null;
  const adapterCountFromManifest = testManifest?.adapter_count ?? 0;
  const frameCount = styleManifestOut.frame_count;

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
  if (frameCount !== EXPECTED_VIDEO_STYLE_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_VIDEO_STYLE_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    stylePalettePersistence,
    lightingStylePersistence,
    textureStylePersistence,
    compositionStylePersistence,
    frameToFrameStyleDrift,
    styleAdapterBinding,
  ];

  const videoStyleConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !styleDrift &&
    !lightingStyleBreak &&
    !textureMismatch &&
    !compositionBreak &&
    sourceAudits.every((audit) => audit.source_video_style_consistency_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (styleDrift || lightingStyleBreak || textureMismatch || compositionBreak) {
    issues.push({
      code: 'VIDEO_STYLE_BLOCK',
      message: 'Video style consistency block triggered',
      severity: 'error',
    });
  }
  if (videoStyleConsistency === 'FAIL') {
    issues.push({
      code: 'VIDEO_STYLE_CONSISTENCY_FAIL',
      message: 'Video style consistency validation failed',
      severity: 'error',
    });
  }

  const realVideoStyleConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCountFromManifest === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_VIDEO_STYLE_FRAME_COUNT &&
    videoStyleConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoStyleConsistencyValidationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_VIDEO_STYLE_NOT_VALIDATED')) {
    issues.push({
      code: 'REAL_VIDEO_STYLE_NOT_VALIDATED',
      message: 'Real video style consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoStyleConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-style-consistency-validation-report-v1',
    phase: REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_location_consistency_validation_report_path:
      REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_multi_frame_style_consistency_validation_report_path:
      REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    video_style_dir: VIDEO_STYLE_DIR,
    video_style_manifest_path: VIDEO_STYLE_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCountFromManifest,
    frame_count: frameCount,
    style_palette_persistence: stylePalettePersistence,
    lighting_style_persistence: lightingStylePersistence,
    texture_style_persistence: textureStylePersistence,
    composition_style_persistence: compositionStylePersistence,
    frame_to_frame_style_drift: frameToFrameStyleDrift,
    style_adapter_binding: styleAdapterBinding,
    video_style_consistency: videoStyleConsistency,
    style_drift: styleDrift,
    lighting_style_break: lightingStyleBreak,
    texture_mismatch: textureMismatch,
    composition_break: compositionBreak,
    real_video_style_consistency_validation_ready: realVideoStyleConsistencyValidationReady,
    certification_status: pass ? REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_STYLE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
