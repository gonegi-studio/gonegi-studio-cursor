import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MULTI_FRAME_CHARACTER_MANIFEST_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameCharacterDriftValidation.js';
import {
  MULTI_FRAME_LOCATION_MANIFEST_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
  REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealMultiFrameLocationDriftValidation.js';
import { MOVIE_FRAME_PALETTES } from './movieAnalysisRealMovieFrameIngestion.js';
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

export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-007-REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATED' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_multi_frame_style_consistency_validation' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_multi_frame_style_consistency_validation/movie-analysis-real-multi-frame-style-consistency-validation-report.json' as const;
export const REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_multi_frame_style_consistency_validation/MOVIE_ANALYSIS_REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION.md' as const;
export const MULTI_FRAME_STYLE_DIR =
  'exports/movie_analysis_model_generation_test/multi_frames_style' as const;
export const MULTI_FRAME_STYLE_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/multi_frames_style/movie-analysis-real-multi-frame-style-manifest.json' as const;

export const FRAMES_PER_SOURCE = 4 as const;
export const EXPECTED_MULTI_FRAME_COUNT = EXPECTED_SOURCE_COUNT * FRAMES_PER_SOURCE;
export const MAX_STYLE_DRIFT = 0.42 as const;
export const MAX_LIGHTING_STYLE_DRIFT = 0.45 as const;
export const MAX_TEXTURE_MISMATCH = 0.5 as const;
export const MAX_COMPOSITION_STYLE_BREAK = 0.55 as const;
export const MIN_TEXTURE_VARIANCE = 12 as const;
export const MIN_CROSS_FRAME_STYLE_SCORE = 0.58 as const;

const FRAME_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealMultiFrameStyleConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type StyleFrameSnapshot = {
  frame_index: number;
  stage: (typeof FRAME_STAGES)[number];
  style_palette_rgb: [number, number, number];
  accent_zone_rgb: [number, number, number];
  lighting_warmth: number;
  texture_variance: number;
  composition_spread: number;
  style_signature: string;
};

export type MultiFrameStyleConsistencyMetrics = {
  max_adjacent_style_gap: number;
  open_to_resolve_style_span: number;
  max_adjacent_lighting_style_gap: number;
  texture_variance_span: number;
  max_adjacent_composition_gap: number;
  cross_frame_style_score: number;
};

export type SourceMultiFrameStyleConsistencyAudit = {
  source_id: string;
  style_palette_persistence: ValidationStatus;
  lighting_style_persistence: ValidationStatus;
  texture_style_persistence: ValidationStatus;
  composition_style_persistence: ValidationStatus;
  cross_frame_style_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  style_drift: boolean;
  lighting_style_drift: boolean;
  texture_mismatch: boolean;
  composition_style_break: boolean;
  style_frames: StyleFrameSnapshot[];
  style_metrics: MultiFrameStyleConsistencyMetrics | null;
  source_multi_frame_style_validated: ValidationStatus;
};

export type MultiFrameStyleManifestEntry = {
  source_id: string;
  narrative_style_id: string;
  frame_count: typeof FRAMES_PER_SOURCE;
  frames: StyleFrameSnapshot[];
};

export type MovieAnalysisRealMultiFrameStyleManifest = {
  manifest_id: string;
  phase: typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_MULTI_FRAME_COUNT;
  entries: MultiFrameStyleManifestEntry[];
};

export type MovieAnalysisRealMultiFrameStyleConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE;
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
  real_multi_frame_character_drift_validation_report_path: typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH;
  real_multi_frame_location_drift_validation_report_path: typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_character_manifest_path: typeof MULTI_FRAME_CHARACTER_MANIFEST_PATH;
  multi_frame_location_manifest_path: typeof MULTI_FRAME_LOCATION_MANIFEST_PATH;
  multi_frame_style_dir: typeof MULTI_FRAME_STYLE_DIR;
  multi_frame_style_manifest_path: typeof MULTI_FRAME_STYLE_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  style_palette_persistence: ValidationStatus;
  lighting_style_persistence: ValidationStatus;
  texture_style_persistence: ValidationStatus;
  composition_style_persistence: ValidationStatus;
  cross_frame_style_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  multi_frame_style_consistency: ValidationStatus;
  style_drift: boolean;
  lighting_style_drift: boolean;
  texture_mismatch: boolean;
  composition_style_break: boolean;
  real_multi_frame_style_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceMultiFrameStyleConsistencyAudit[];
  final_verdict:
    | typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealMultiFrameStyleConsistencyValidationIssue[];
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

function zoneVarianceInBand(
  pixels: Buffer,
  width: number,
  height: number,
  bandStartRatio: number,
  bandEndRatio: number,
  xStartRatio: number,
  xEndRatio: number,
  yStartRatio: number,
  yEndRatio: number
): number {
  const bandStart = Math.floor(height * bandStartRatio);
  const bandEnd = Math.max(bandStart + 1, Math.floor(height * bandEndRatio));
  const bandHeight = bandEnd - bandStart;
  const xStart = Math.floor(width * xStartRatio);
  const xEnd = Math.max(xStart + 1, Math.floor(width * xEndRatio));
  const zoneStart = bandStart + Math.floor(bandHeight * yStartRatio);
  const zoneEnd = Math.max(zoneStart + 1, bandStart + Math.floor(bandHeight * yEndRatio));

  const values: number[] = [];
  for (let y = zoneStart; y < zoneEnd; y += 1) {
    for (let x = xStart; x < xEnd; x += 2) {
      const index = (y * width + x) * 3;
      values.push((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    }
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function extractStyleFrames(
  pixels: Buffer,
  width: number,
  height: number
): StyleFrameSnapshot[] {
  const ranges: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];

  return FRAME_STAGES.map((stage, index) => {
    const [bandStart, bandEnd] = ranges[index];
    const accentZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.2,
      0.8,
      0.55,
      0.85
    );
    const midgroundZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.15,
      0.85,
      0.3,
      0.7
    );
    const skyZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0,
      1,
      0,
      0.25
    );
    const leftZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0,
      0.35,
      0.2,
      0.8
    );
    const rightZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.65,
      1,
      0.2,
      0.8
    );

    const stylePalette: Rgb = [
      Math.round((accentZone[0] + midgroundZone[0]) / 2),
      Math.round((accentZone[1] + midgroundZone[1]) / 2),
      Math.round((accentZone[2] + midgroundZone[2]) / 2),
    ];
    const textureVariance = zoneVarianceInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0,
      1,
      0,
      1
    );
    const compositionSpread = colorDistance(leftZone, rightZone) / 255;

    return {
      frame_index: index,
      stage,
      style_palette_rgb: stylePalette,
      accent_zone_rgb: accentZone,
      lighting_warmth: (skyZone[0] - skyZone[2] + 128) / 255,
      texture_variance: textureVariance,
      composition_spread: compositionSpread,
      style_signature: styleSignature(stylePalette),
    };
  });
}

function computeStyleMetrics(frames: StyleFrameSnapshot[]): MultiFrameStyleConsistencyMetrics {
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

  const maxAdjacentStyleGap = Math.max(...styleGaps, 0);
  const openToResolveStyleSpan =
    colorDistance(frames[0].style_palette_rgb, frames[3].style_palette_rgb) / 255;
  const maxAdjacentLightingStyleGap = Math.max(...lightingGaps, 0);
  const textureVarianceSpan =
    textureValues.length === 0 ? 1 : Math.max(...textureValues) - Math.min(...textureValues);
  const maxAdjacentCompositionGap = Math.max(...compositionGaps, 0);

  const paletteScore = clamp01(1 - maxAdjacentStyleGap / MAX_STYLE_DRIFT);
  const lightingScore = clamp01(1 - maxAdjacentLightingStyleGap / MAX_LIGHTING_STYLE_DRIFT);
  const textureScore = clamp01(1 - textureVarianceSpan / (MIN_TEXTURE_VARIANCE * 2));
  const compositionScore = clamp01(1 - maxAdjacentCompositionGap / MAX_COMPOSITION_STYLE_BREAK);
  const crossFrameStyleScore = clamp01(
    paletteScore * 0.3 + lightingScore * 0.25 + textureScore * 0.22 + compositionScore * 0.23
  );

  return {
    max_adjacent_style_gap: maxAdjacentStyleGap,
    open_to_resolve_style_span: openToResolveStyleSpan,
    max_adjacent_lighting_style_gap: maxAdjacentLightingStyleGap,
    texture_variance_span: textureVarianceSpan,
    max_adjacent_composition_gap: maxAdjacentCompositionGap,
    cross_frame_style_score: crossFrameStyleScore,
  };
}

function hasStyleAdapters(result: RealModelTestGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('transition_adapter'))
  );
}

function promptHasNarrativeStyle(prompt: string): boolean {
  return prompt.includes('narrative_hold') && prompt.includes('transition_layout');
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

function auditSourceMultiFrameStyle(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceMultiFrameStyleConsistencyAudit {
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

  const frames = extractStyleFrames(decoded.pixels, decoded.width, decoded.height);
  const metrics = computeStyleMetrics(frames);
  const palette = MOVIE_FRAME_PALETTES[sourceId];
  const expectedStylePalette: Rgb = [
    Math.round((palette.accent[0] + palette.midground[0]) / 2),
    Math.round((palette.accent[1] + palette.midground[1]) / 2),
    Math.round((palette.accent[2] + palette.midground[2]) / 2),
  ];

  const paletteDrifts = frames.map(
    (frame) => colorDistance(frame.style_palette_rgb, expectedStylePalette) / 255
  );

  const stylePalettePersistence =
    paletteDrifts.every((drift) => drift <= MAX_STYLE_DRIFT) &&
    metrics.max_adjacent_style_gap <= MAX_STYLE_DRIFT &&
    metrics.open_to_resolve_style_span <= MAX_STYLE_DRIFT * 1.15
      ? 'PASS'
      : 'FAIL';

  const lightingStylePersistence =
    metrics.max_adjacent_lighting_style_gap <= MAX_LIGHTING_STYLE_DRIFT &&
    frames.every((frame) => frame.lighting_warmth >= 0 && frame.lighting_warmth <= 1)
      ? 'PASS'
      : 'FAIL';

  const textureStylePersistence =
    frames.every((frame) => frame.texture_variance >= MIN_TEXTURE_VARIANCE) &&
    metrics.texture_variance_span <= MIN_TEXTURE_VARIANCE * 2
      ? 'PASS'
      : 'FAIL';

  const compositionStylePersistence =
    frames.every((frame) => frame.composition_spread >= 0.02) &&
    metrics.max_adjacent_composition_gap <= MAX_COMPOSITION_STYLE_BREAK
      ? 'PASS'
      : 'FAIL';

  const crossFrameStyleConsistency =
    metrics.max_adjacent_style_gap <= MAX_STYLE_DRIFT &&
    metrics.cross_frame_style_score >= MIN_CROSS_FRAME_STYLE_SCORE
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    hasStyleAdapters(result) &&
    promptHasNarrativeStyle(result.prompt)
      ? 'PASS'
      : 'FAIL';

  const styleDrift =
    stylePalettePersistence === 'FAIL' ||
    metrics.open_to_resolve_style_span > MAX_STYLE_DRIFT * 1.15;
  const lightingStyleDrift =
    lightingStylePersistence === 'FAIL' ||
    metrics.max_adjacent_lighting_style_gap > MAX_LIGHTING_STYLE_DRIFT;
  const textureMismatch =
    textureStylePersistence === 'FAIL' ||
    metrics.texture_variance_span > MIN_TEXTURE_VARIANCE * 2;
  const compositionStyleBreak =
    compositionStylePersistence === 'FAIL' ||
    metrics.max_adjacent_composition_gap > MAX_COMPOSITION_STYLE_BREAK;

  const checks: ValidationStatus[] = [
    stylePalettePersistence,
    lightingStylePersistence,
    textureStylePersistence,
    compositionStylePersistence,
    crossFrameStyleConsistency,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    style_palette_persistence: stylePalettePersistence,
    lighting_style_persistence: lightingStylePersistence,
    texture_style_persistence: textureStylePersistence,
    composition_style_persistence: compositionStylePersistence,
    cross_frame_style_consistency: crossFrameStyleConsistency,
    traceability_preserved: traceabilityPreserved,
    style_drift: styleDrift,
    lighting_style_drift: lightingStyleDrift,
    texture_mismatch: textureMismatch,
    composition_style_break: compositionStyleBreak,
    style_frames: frames,
    style_metrics: metrics,
    source_multi_frame_style_validated:
      checks.every((status) => status === 'PASS') &&
      !styleDrift &&
      !lightingStyleDrift &&
      !textureMismatch &&
      !compositionStyleBreak
        ? 'PASS'
        : 'FAIL',
  };
}

function failAudit(sourceId: string): SourceMultiFrameStyleConsistencyAudit {
  return {
    source_id: sourceId,
    style_palette_persistence: 'FAIL',
    lighting_style_persistence: 'FAIL',
    texture_style_persistence: 'FAIL',
    composition_style_persistence: 'FAIL',
    cross_frame_style_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    style_drift: true,
    lighting_style_drift: true,
    texture_mismatch: true,
    composition_style_break: true,
    style_frames: [],
    style_metrics: null,
    source_multi_frame_style_validated: 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceMultiFrameStyleConsistencyAudit[],
  field: keyof Omit<
    SourceMultiFrameStyleConsistencyAudit,
    | 'source_id'
    | 'style_drift'
    | 'lighting_style_drift'
    | 'texture_mismatch'
    | 'composition_style_break'
    | 'style_frames'
    | 'style_metrics'
    | 'source_multi_frame_style_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealMultiFrameStyleConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Multi-Frame Style Consistency Validation',
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
    `| cross_frame_style_consistency | ${report.cross_frame_style_consistency} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| multi_frame_style_consistency | ${report.multi_frame_style_consistency} |`,
    `| style_drift | ${report.style_drift} |`,
    `| lighting_style_drift | ${report.lighting_style_drift} |`,
    `| texture_mismatch | ${report.texture_mismatch} |`,
    `| composition_style_break | ${report.composition_style_break} |`,
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
      `- cross_frame_style_consistency: ${audit.cross_frame_style_consistency}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- style_drift: ${audit.style_drift}`,
      `- lighting_style_drift: ${audit.lighting_style_drift}`,
      `- texture_mismatch: ${audit.texture_mismatch}`,
      `- composition_style_break: ${audit.composition_style_break}`,
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
  issues: RealMultiFrameStyleConsistencyValidationIssue[],
  sourceAudits: SourceMultiFrameStyleConsistencyAudit[] = []
): MovieAnalysisRealMultiFrameStyleConsistencyValidationReport {
  const report: MovieAnalysisRealMultiFrameStyleConsistencyValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-style-consistency-validation-report-v1',
    phase: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE,
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
    real_multi_frame_character_drift_validation_report_path:
      REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
    real_multi_frame_location_drift_validation_report_path:
      REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_character_manifest_path: MULTI_FRAME_CHARACTER_MANIFEST_PATH,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    multi_frame_style_dir: MULTI_FRAME_STYLE_DIR,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    style_palette_persistence: 'FAIL',
    lighting_style_persistence: 'FAIL',
    texture_style_persistence: 'FAIL',
    composition_style_persistence: 'FAIL',
    cross_frame_style_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    multi_frame_style_consistency: 'FAIL',
    style_drift: true,
    lighting_style_drift: true,
    texture_mismatch: true,
    composition_style_break: true,
    real_multi_frame_style_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealMultiFrameStyleConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealMultiFrameStyleConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealMultiFrameStyleConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const characterReport = loadUpstreamReport(
    root,
    REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH
  );
  if (!characterReport) {
    issues.push({
      code: 'REAL_MULTI_FRAME_CHARACTER_DRIFT_REPORT_MISSING',
      message: `Missing ${REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    characterReport.final_verdict !== REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_006_NOT_PASS',
      message: `L2F-006 must have ${REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    characterReport.certification_status !==
    REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_006_NOT_VALIDATED',
      message: `L2F-006 status must be ${REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const locationReport = loadUpstreamReport(
    root,
    REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH
  );
  if (!locationReport) {
    issues.push({
      code: 'REAL_MULTI_FRAME_LOCATION_DRIFT_REPORT_MISSING',
      message: `Missing ${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (
    locationReport.final_verdict !== REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_005_NOT_PASS',
      message: `L2F-005 must have ${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    locationReport.certification_status !==
    REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_005_NOT_VALIDATED',
      message: `L2F-005 status must be ${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE}`,
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
    const audit = auditSourceMultiFrameStyle(result, root, sourceId);
    if (audit.source_multi_frame_style_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_MULTI_FRAME_STYLE_FAIL',
        message: `Multi-frame style consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.style_drift) {
      issues.push({
        code: 'STYLE_DRIFT',
        message: `Style drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.lighting_style_drift) {
      issues.push({
        code: 'LIGHTING_STYLE_DRIFT',
        message: `Lighting style drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.texture_mismatch) {
      issues.push({
        code: 'TEXTURE_MISMATCH',
        message: `Texture mismatch detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.composition_style_break) {
      issues.push({
        code: 'COMPOSITION_STYLE_BREAK',
        message: `Composition style break detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: MultiFrameStyleManifestEntry[] = sourceAudits.map((audit) => ({
    source_id: audit.source_id,
    narrative_style_id: `narrative_style_${audit.source_id.toLowerCase()}_v1`,
    frame_count: FRAMES_PER_SOURCE,
    frames: audit.style_frames,
  }));

  fs.mkdirSync(path.join(root, MULTI_FRAME_STYLE_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, MULTI_FRAME_STYLE_DIR, `${entry.source_id}-multi-frame-style.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const multiFrameManifest: MovieAnalysisRealMultiFrameStyleManifest = {
    manifest_id: 'movie-analysis-real-multi-frame-style-manifest-v1',
    phase: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, MULTI_FRAME_STYLE_MANIFEST_PATH),
    `${JSON.stringify(multiFrameManifest, null, 2)}\n`,
    'utf8'
  );

  const stylePalettePersistence = aggregateStatus(sourceAudits, 'style_palette_persistence');
  const lightingStylePersistence = aggregateStatus(sourceAudits, 'lighting_style_persistence');
  const textureStylePersistence = aggregateStatus(sourceAudits, 'texture_style_persistence');
  const compositionStylePersistence = aggregateStatus(
    sourceAudits,
    'composition_style_persistence'
  );
  const crossFrameStyleConsistency = aggregateStatus(
    sourceAudits,
    'cross_frame_style_consistency'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const styleDrift = sourceAudits.some((audit) => audit.style_drift);
  const lightingStyleDrift = sourceAudits.some((audit) => audit.lighting_style_drift);
  const textureMismatch = sourceAudits.some((audit) => audit.texture_mismatch);
  const compositionStyleBreak = sourceAudits.some((audit) => audit.composition_style_break);

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
    stylePalettePersistence,
    lightingStylePersistence,
    textureStylePersistence,
    compositionStylePersistence,
    crossFrameStyleConsistency,
    traceabilityPreserved,
  ];

  const multiFrameStyleConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !styleDrift &&
    !lightingStyleDrift &&
    !textureMismatch &&
    !compositionStyleBreak &&
    sourceAudits.every((audit) => audit.source_multi_frame_style_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (styleDrift || lightingStyleDrift || textureMismatch || compositionStyleBreak) {
    issues.push({
      code: 'MULTI_FRAME_STYLE_BLOCK',
      message: 'Multi-frame style block triggered',
      severity: 'error',
    });
  }
  if (multiFrameStyleConsistency === 'FAIL') {
    issues.push({
      code: 'MULTI_FRAME_STYLE_CONSISTENCY_FAIL',
      message: 'Multi-frame style consistency validation failed',
      severity: 'error',
    });
  }

  const realMultiFrameStyleConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_MULTI_FRAME_COUNT &&
    multiFrameStyleConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realMultiFrameStyleConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MULTI_FRAME_STYLE_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_MULTI_FRAME_STYLE_NOT_VALIDATED',
      message: 'Real multi-frame style consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealMultiFrameStyleConsistencyValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-style-consistency-validation-report-v1',
    phase: REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PHASE,
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
    real_multi_frame_character_drift_validation_report_path:
      REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH,
    real_multi_frame_location_drift_validation_report_path:
      REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_character_manifest_path: MULTI_FRAME_CHARACTER_MANIFEST_PATH,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    multi_frame_style_dir: MULTI_FRAME_STYLE_DIR,
    multi_frame_style_manifest_path: MULTI_FRAME_STYLE_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    frame_count: frameCount,
    style_palette_persistence: stylePalettePersistence,
    lighting_style_persistence: lightingStylePersistence,
    texture_style_persistence: textureStylePersistence,
    composition_style_persistence: compositionStylePersistence,
    cross_frame_style_consistency: crossFrameStyleConsistency,
    traceability_preserved: traceabilityPreserved,
    multi_frame_style_consistency: multiFrameStyleConsistency,
    style_drift: styleDrift,
    lighting_style_drift: lightingStyleDrift,
    texture_mismatch: textureMismatch,
    composition_style_break: compositionStyleBreak,
    real_multi_frame_style_consistency_validation_ready:
      realMultiFrameStyleConsistencyValidationReady,
    certification_status: pass ? REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_DIR), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_STYLE_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
