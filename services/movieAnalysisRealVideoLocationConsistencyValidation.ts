import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  SOURCE_LOCATION_DNA_ANCHORS,
} from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationManifest,
} from './movieAnalysisRealModelTestGeneration.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
import {
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
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

export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-012-REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATED' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_video_location_consistency_validation' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_video_location_consistency_validation/movie-analysis-real-video-location-consistency-validation-report.json' as const;
export const REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_video_location_consistency_validation/MOVIE_ANALYSIS_REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION.md' as const;
export const VIDEO_LOCATION_DIR =
  'exports/movie_analysis_model_generation_test/video_location' as const;
export const VIDEO_LOCATION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_location/movie-analysis-real-video-location-consistency-manifest.json' as const;

export const EXPECTED_VIDEO_LOCATION_FRAME_COUNT = EXPECTED_SOURCE_COUNT * CLIP_FRAMES_PER_SOURCE;
export const MAX_CROSS_FRAME_LOCATION_DRIFT = 0.42 as const;
export const MAX_ANCHOR_DRIFT = 0.38 as const;
export const MAX_LIGHTING_FRAME_DRIFT = 0.45 as const;
export const MAX_ENVIRONMENT_LAYOUT_BREAK = 0.55 as const;
export const MIN_INDOOR_ANCHOR_STRENGTH = 0.45 as const;
export const MIN_VIDEO_LOCATION_SCORE = 0.58 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealVideoLocationConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoLocationFrameSnapshot = {
  frame_index: number;
  sky_zone_rgb: [number, number, number];
  midground_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  indoor_anchor_strength: number;
  lighting_warmth: number;
  layout_signature: string;
  location_signature: string;
};

export type VideoLocationConsistencyMetrics = {
  max_adjacent_location_gap: number;
  anchor_to_last_location_span: number;
  max_adjacent_lighting_gap: number;
  max_adjacent_layout_gap: number;
  indoor_anchor_variance: number;
  frame_to_frame_location_drift: number;
  video_location_score: number;
};

export type VideoLocationManifestEntry = {
  source_id: string;
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  mp4_output_path: string;
  frame_count: number;
  frames: VideoLocationFrameSnapshot[];
};

export type MovieAnalysisRealVideoLocationConsistencyManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_VIDEO_LOCATION_FRAME_COUNT;
  entries: VideoLocationManifestEntry[];
};

export type SourceVideoLocationConsistencyAudit = {
  source_id: string;
  location_identity_persistence: ValidationStatus;
  indoor_anchor_persistence: ValidationStatus;
  lighting_anchor_persistence: ValidationStatus;
  environment_layout_persistence: ValidationStatus;
  frame_to_frame_location_drift: ValidationStatus;
  location_drift: boolean;
  anchor_loss: boolean;
  lighting_break: boolean;
  environment_break: boolean;
  location_frames: VideoLocationFrameSnapshot[];
  location_metrics: VideoLocationConsistencyMetrics | null;
  source_video_location_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealVideoLocationConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE;
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
  real_video_identity_consistency_validation_report_path: typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_video_model_generation_report_path: typeof REAL_VIDEO_MODEL_GENERATION_REPORT_PATH;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  video_location_dir: typeof VIDEO_LOCATION_DIR;
  video_location_manifest_path: typeof VIDEO_LOCATION_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  location_identity_persistence: ValidationStatus;
  indoor_anchor_persistence: ValidationStatus;
  lighting_anchor_persistence: ValidationStatus;
  environment_layout_persistence: ValidationStatus;
  frame_to_frame_location_drift: ValidationStatus;
  video_location_consistency: ValidationStatus;
  location_drift: boolean;
  anchor_loss: boolean;
  lighting_break: boolean;
  environment_break: boolean;
  real_video_location_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceVideoLocationConsistencyAudit[];
  final_verdict:
    | typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealVideoLocationConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function layoutSignature(rgb: Rgb): string {
  return createHash('sha256')
    .update(`${rgb[0]}:${rgb[1]}:${rgb[2]}`)
    .digest('hex')
    .slice(0, 12);
}

function locationSignature(sky: Rgb, mid: Rgb, ground: Rgb): string {
  return createHash('sha256')
    .update(`${sky[0]}:${sky[1]}:${sky[2]}:${mid[0]}:${mid[1]}:${mid[2]}:${ground[0]}:${ground[1]}:${ground[2]}`)
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

function extractLocationFrame(
  pixels: Buffer,
  width: number,
  height: number,
  frameIndex: number
): VideoLocationFrameSnapshot {
  const skyZone = zoneAverage(pixels, width, height, 0, 1, 0, 0.32);
  const midgroundZone = zoneAverage(pixels, width, height, 0, 1, 0.34, 0.66);
  const groundZone = zoneAverage(pixels, width, height, 0, 1, 0.68, 1);
  const lightingWarmth = (skyZone[0] - skyZone[2] + 128) / 255;
  const indoorAnchorStrength = clamp01(
    1 - colorDistance(midgroundZone, groundZone) / (3 * 255)
  );

  return {
    frame_index: frameIndex,
    sky_zone_rgb: skyZone,
    midground_zone_rgb: midgroundZone,
    ground_zone_rgb: groundZone,
    indoor_anchor_strength: indoorAnchorStrength,
    lighting_warmth: lightingWarmth,
    layout_signature: layoutSignature(midgroundZone),
    location_signature: locationSignature(skyZone, midgroundZone, groundZone),
  };
}

function computeLocationMetrics(frames: VideoLocationFrameSnapshot[]): VideoLocationConsistencyMetrics {
  const locationGaps: number[] = [];
  const lightingGaps: number[] = [];
  const layoutGaps: number[] = [];
  const indoorStrengths = frames.map((frame) => frame.indoor_anchor_strength);

  for (let index = 0; index < frames.length - 1; index += 1) {
    locationGaps.push(
      colorDistance(frames[index].midground_zone_rgb, frames[index + 1].midground_zone_rgb) / 255
    );
    lightingGaps.push(
      Math.abs(frames[index].lighting_warmth - frames[index + 1].lighting_warmth)
    );
    layoutGaps.push(
      colorDistance(frames[index].midground_zone_rgb, frames[index + 1].midground_zone_rgb) / 255
    );
  }

  const anchorDrifts = frames.map(
    (frame) => colorDistance(frames[0].midground_zone_rgb, frame.midground_zone_rgb) / 255
  );

  const maxAdjacentLocationGap = Math.max(...locationGaps, 0);
  const anchorToLastLocationSpan = Math.max(...anchorDrifts, 0);
  const maxAdjacentLightingGap = Math.max(...lightingGaps, 0);
  const maxAdjacentLayoutGap = Math.max(...layoutGaps, 0);
  const indoorAnchorVariance =
    indoorStrengths.length === 0
      ? 1
      : Math.max(...indoorStrengths) - Math.min(...indoorStrengths);
  const frameToFrameLocationDrift = Math.max(
    maxAdjacentLocationGap,
    maxAdjacentLayoutGap * 0.85 + maxAdjacentLightingGap * 0.15
  );

  const locationScore = clamp01(1 - maxAdjacentLocationGap / MAX_CROSS_FRAME_LOCATION_DRIFT);
  const anchorScore = clamp01(1 - indoorAnchorVariance / MAX_ANCHOR_DRIFT);
  const lightingScore = clamp01(1 - maxAdjacentLightingGap / MAX_LIGHTING_FRAME_DRIFT);
  const layoutScore = clamp01(1 - maxAdjacentLayoutGap / MAX_ENVIRONMENT_LAYOUT_BREAK);
  const driftScore = clamp01(1 - frameToFrameLocationDrift / MAX_CROSS_FRAME_LOCATION_DRIFT);
  const videoLocationScore = clamp01(
    locationScore * 0.28 + anchorScore * 0.24 + lightingScore * 0.2 + layoutScore * 0.18 + driftScore * 0.1
  );

  return {
    max_adjacent_location_gap: maxAdjacentLocationGap,
    anchor_to_last_location_span: anchorToLastLocationSpan,
    max_adjacent_lighting_gap: maxAdjacentLightingGap,
    max_adjacent_layout_gap: maxAdjacentLayoutGap,
    indoor_anchor_variance: indoorAnchorVariance,
    frame_to_frame_location_drift: frameToFrameLocationDrift,
    video_location_score: videoLocationScore,
  };
}

function hasContinuityAdapter(result: RealVideoModelGenerationResult): boolean {
  return result.adapter_binding.adapter_ids.some((adapterId) =>
    adapterId.includes('continuity_adapter')
  );
}

function promptHasIndoorAnchor(
  prompt: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): boolean {
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[sourceId];
  return anchors.environment_anchor_signatures.some((signature) => prompt.includes(signature));
}

function loadVideoManifest(root: string): MovieAnalysisRealVideoModelGenerationManifest | null {
  const abs = path.join(root, VIDEO_MODEL_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealVideoModelGenerationManifest;
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

function failAudit(sourceId: string): SourceVideoLocationConsistencyAudit {
  return {
    source_id: sourceId,
    location_identity_persistence: 'FAIL',
    indoor_anchor_persistence: 'FAIL',
    lighting_anchor_persistence: 'FAIL',
    environment_layout_persistence: 'FAIL',
    frame_to_frame_location_drift: 'FAIL',
    location_drift: true,
    anchor_loss: true,
    lighting_break: true,
    environment_break: true,
    location_frames: [],
    location_metrics: null,
    source_video_location_consistency_validated: 'FAIL',
  };
}

function auditSourceVideoLocation(
  generationResult: RealVideoModelGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceVideoLocationConsistencyAudit {
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[sourceId];

  if (!generationResult || !anchors) {
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

  const locationFrames: VideoLocationFrameSnapshot[] = [];
  for (let index = 0; index < pngSamples.length; index += 1) {
    const decoded = decodePngRgb(pngSamples[index]);
    if (!decoded) {
      return failAudit(sourceId);
    }
    locationFrames.push(
      extractLocationFrame(decoded.pixels, decoded.width, decoded.height, index)
    );
  }

  const metrics = computeLocationMetrics(locationFrames);
  const expectedCinematicDnaId = anchors.location_dna_id.replace('location_dna', 'cinematic_dna');
  const identityDrifts = locationFrames.map(
    (frame) => colorDistance(frame.midground_zone_rgb, locationFrames[0].midground_zone_rgb) / 255
  );

  const locationIdentityPersistence =
    identityDrifts.every((drift) => drift <= MAX_CROSS_FRAME_LOCATION_DRIFT) &&
    metrics.anchor_to_last_location_span <= MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15 &&
    generationResult.dna_binding.cinematic_dna_id === expectedCinematicDnaId
      ? 'PASS'
      : 'FAIL';

  const indoorAnchorPersistence =
    promptHasIndoorAnchor(generationResult.prompt, sourceId) &&
    locationFrames.every((frame) => frame.indoor_anchor_strength >= MIN_INDOOR_ANCHOR_STRENGTH) &&
    metrics.indoor_anchor_variance <= MAX_ANCHOR_DRIFT
      ? 'PASS'
      : 'FAIL';

  const lightingAnchorPersistence =
    metrics.max_adjacent_lighting_gap <= MAX_LIGHTING_FRAME_DRIFT &&
    generationResult.prompt.includes('continuity_layout')
      ? 'PASS'
      : 'FAIL';

  const environmentLayoutPersistence =
    metrics.max_adjacent_layout_gap <= MAX_ENVIRONMENT_LAYOUT_BREAK
      ? 'PASS'
      : 'FAIL';

  const frameToFrameLocationDriftCheck =
    metrics.frame_to_frame_location_drift <= MAX_CROSS_FRAME_LOCATION_DRIFT &&
    metrics.video_location_score >= MIN_VIDEO_LOCATION_SCORE &&
    hasContinuityAdapter(generationResult)
      ? 'PASS'
      : 'FAIL';

  const locationDrift =
    locationIdentityPersistence === 'FAIL' ||
    metrics.anchor_to_last_location_span > MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15;
  const anchorLoss = indoorAnchorPersistence === 'FAIL';
  const lightingBreak =
    lightingAnchorPersistence === 'FAIL' ||
    metrics.max_adjacent_lighting_gap > MAX_LIGHTING_FRAME_DRIFT;
  const environmentBreak =
    environmentLayoutPersistence === 'FAIL' ||
    metrics.max_adjacent_layout_gap > MAX_ENVIRONMENT_LAYOUT_BREAK;

  const checks: ValidationStatus[] = [
    locationIdentityPersistence,
    indoorAnchorPersistence,
    lightingAnchorPersistence,
    environmentLayoutPersistence,
    frameToFrameLocationDriftCheck,
  ];

  return {
    source_id: sourceId,
    location_identity_persistence: locationIdentityPersistence,
    indoor_anchor_persistence: indoorAnchorPersistence,
    lighting_anchor_persistence: lightingAnchorPersistence,
    environment_layout_persistence: environmentLayoutPersistence,
    frame_to_frame_location_drift: frameToFrameLocationDriftCheck,
    location_drift: locationDrift,
    anchor_loss: anchorLoss,
    lighting_break: lightingBreak,
    environment_break: environmentBreak,
    location_frames: locationFrames,
    location_metrics: metrics,
    source_video_location_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !locationDrift &&
      !anchorLoss &&
      !lightingBreak &&
      !environmentBreak
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoLocationConsistencyAudit[],
  field: keyof Omit<
    SourceVideoLocationConsistencyAudit,
    | 'source_id'
    | 'location_drift'
    | 'anchor_loss'
    | 'lighting_break'
    | 'environment_break'
    | 'location_frames'
    | 'location_metrics'
    | 'source_video_location_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealVideoLocationConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Video Location Consistency Validation',
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
    `| location_identity_persistence | ${report.location_identity_persistence} |`,
    `| indoor_anchor_persistence | ${report.indoor_anchor_persistence} |`,
    `| lighting_anchor_persistence | ${report.lighting_anchor_persistence} |`,
    `| environment_layout_persistence | ${report.environment_layout_persistence} |`,
    `| frame_to_frame_location_drift | ${report.frame_to_frame_location_drift} |`,
    `| video_location_consistency | ${report.video_location_consistency} |`,
    `| location_drift | ${report.location_drift} |`,
    `| anchor_loss | ${report.anchor_loss} |`,
    `| lighting_break | ${report.lighting_break} |`,
    `| environment_break | ${report.environment_break} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- location_identity_persistence: ${audit.location_identity_persistence}`,
      `- indoor_anchor_persistence: ${audit.indoor_anchor_persistence}`,
      `- lighting_anchor_persistence: ${audit.lighting_anchor_persistence}`,
      `- environment_layout_persistence: ${audit.environment_layout_persistence}`,
      `- frame_to_frame_location_drift: ${audit.frame_to_frame_location_drift}`,
      `- location_drift: ${audit.location_drift}`,
      `- anchor_loss: ${audit.anchor_loss}`,
      `- lighting_break: ${audit.lighting_break}`,
      `- environment_break: ${audit.environment_break}`,
      `- frames: ${audit.location_frames.length}`,
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
  issues: RealVideoLocationConsistencyValidationIssue[],
  sourceAudits: SourceVideoLocationConsistencyAudit[] = []
): MovieAnalysisRealVideoLocationConsistencyValidationReport {
  const report: MovieAnalysisRealVideoLocationConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-location-consistency-validation-report-v1',
    phase: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_identity_consistency_validation_report_path:
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_location_manifest_path: VIDEO_LOCATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    location_identity_persistence: 'FAIL',
    indoor_anchor_persistence: 'FAIL',
    lighting_anchor_persistence: 'FAIL',
    environment_layout_persistence: 'FAIL',
    frame_to_frame_location_drift: 'FAIL',
    video_location_consistency: 'FAIL',
    location_drift: true,
    anchor_loss: true,
    lighting_break: true,
    environment_break: true,
    real_video_location_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoLocationConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealVideoLocationConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoLocationConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const identityReport = loadUpstreamReport(
    root,
    REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!identityReport) {
    issues.push({
      code: 'REAL_VIDEO_IDENTITY_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    identityReport.final_verdict !== REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_011_NOT_PASS',
      message: `L2F-011 must have ${REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    identityReport.certification_status !==
    REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_011_NOT_VALIDATED',
      message: `L2F-011 status must be ${REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
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

  const generationResultBySource = Object.fromEntries(
    videoManifest.results.map((result) => [result.source_id, result])
  );

  const sourceAudits = EXPECTED_SOURCE_VIDEO_IDS.map((sourceId) => {
    const generationResult = generationResultBySource[sourceId];
    const audit = auditSourceVideoLocation(generationResult, root, sourceId);
    if (audit.source_video_location_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_LOCATION_FAIL',
        message: `Video location consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.location_drift) {
      issues.push({
        code: 'LOCATION_DRIFT',
        message: `Location drift detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.anchor_loss) {
      issues.push({
        code: 'ANCHOR_LOSS',
        message: `Indoor anchor loss detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.lighting_break) {
      issues.push({
        code: 'LIGHTING_BREAK',
        message: `Lighting break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.environment_break) {
      issues.push({
        code: 'ENVIRONMENT_BREAK',
        message: `Environment break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: VideoLocationManifestEntry[] = sourceAudits.map((audit) => {
    const anchors = SOURCE_LOCATION_DNA_ANCHORS[audit.source_id as keyof typeof SOURCE_LOCATION_DNA_ANCHORS];
    const generationResult = generationResultBySource[audit.source_id];
    return {
      source_id: audit.source_id,
      location_dna_id: anchors?.location_dna_id ?? '',
      indoor_anchor_id: anchors?.indoor_anchor_id ?? '',
      lighting_anchor_id: anchors?.lighting_anchor_id ?? '',
      mp4_output_path: generationResult?.mp4_output_path ?? '',
      frame_count: audit.location_frames.length,
      frames: audit.location_frames,
    };
  });

  fs.mkdirSync(path.join(root, VIDEO_LOCATION_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, VIDEO_LOCATION_DIR, `${entry.source_id}-video-location.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const locationManifest: MovieAnalysisRealVideoLocationConsistencyManifest = {
    manifest_id: 'movie-analysis-real-video-location-consistency-manifest-v1',
    phase: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, VIDEO_LOCATION_MANIFEST_PATH),
    `${JSON.stringify(locationManifest, null, 2)}\n`,
    'utf8'
  );

  const locationIdentityPersistence = aggregateStatus(sourceAudits, 'location_identity_persistence');
  const indoorAnchorPersistence = aggregateStatus(sourceAudits, 'indoor_anchor_persistence');
  const lightingAnchorPersistence = aggregateStatus(sourceAudits, 'lighting_anchor_persistence');
  const environmentLayoutPersistence = aggregateStatus(
    sourceAudits,
    'environment_layout_persistence'
  );
  const frameToFrameLocationDrift = aggregateStatus(
    sourceAudits,
    'frame_to_frame_location_drift'
  );

  const locationDrift = sourceAudits.some((audit) => audit.location_drift);
  const anchorLoss = sourceAudits.some((audit) => audit.anchor_loss);
  const lightingBreak = sourceAudits.some((audit) => audit.lighting_break);
  const environmentBreak = sourceAudits.some((audit) => audit.environment_break);

  const sourceCount = videoManifest.source_count;
  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  const testManifest = fs.existsSync(testManifestPath)
    ? (JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as RealModelTestGenerationManifest)
    : null;
  const adapterCountFromManifest = testManifest?.adapter_count ?? 0;
  const frameCount = locationManifest.frame_count;

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
  if (frameCount !== EXPECTED_VIDEO_LOCATION_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_VIDEO_LOCATION_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    locationIdentityPersistence,
    indoorAnchorPersistence,
    lightingAnchorPersistence,
    environmentLayoutPersistence,
    frameToFrameLocationDrift,
  ];

  const videoLocationConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !locationDrift &&
    !anchorLoss &&
    !lightingBreak &&
    !environmentBreak &&
    sourceAudits.every((audit) => audit.source_video_location_consistency_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (locationDrift || anchorLoss || lightingBreak || environmentBreak) {
    issues.push({
      code: 'VIDEO_LOCATION_BLOCK',
      message: 'Video location consistency block triggered',
      severity: 'error',
    });
  }
  if (videoLocationConsistency === 'FAIL') {
    issues.push({
      code: 'VIDEO_LOCATION_CONSISTENCY_FAIL',
      message: 'Video location consistency validation failed',
      severity: 'error',
    });
  }

  const realVideoLocationConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCountFromManifest === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_VIDEO_LOCATION_FRAME_COUNT &&
    videoLocationConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoLocationConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_VIDEO_LOCATION_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_VIDEO_LOCATION_NOT_VALIDATED',
      message: 'Real video location consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoLocationConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-location-consistency-validation-report-v1',
    phase: REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_identity_consistency_validation_report_path:
      REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    video_location_dir: VIDEO_LOCATION_DIR,
    video_location_manifest_path: VIDEO_LOCATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCountFromManifest,
    frame_count: frameCount,
    location_identity_persistence: locationIdentityPersistence,
    indoor_anchor_persistence: indoorAnchorPersistence,
    lighting_anchor_persistence: lightingAnchorPersistence,
    environment_layout_persistence: environmentLayoutPersistence,
    frame_to_frame_location_drift: frameToFrameLocationDrift,
    video_location_consistency: videoLocationConsistency,
    location_drift: locationDrift,
    anchor_loss: anchorLoss,
    lighting_break: lightingBreak,
    environment_break: environmentBreak,
    real_video_location_consistency_validation_ready: realVideoLocationConsistencyValidationReady,
    certification_status: pass ? REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_LOCATION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
