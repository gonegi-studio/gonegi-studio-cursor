import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
  SOURCE_LOCATION_DNA_ANCHORS,
} from './movieAnalysisRealLocationConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_IMAGES_DIR,
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  type RealModelTestGenerationManifest,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE =
  'PHASE-LEVEL2F-005-REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE =
  'REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATED' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_DIR =
  'reports/movie_analysis_real_multi_frame_location_drift_validation' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_multi_frame_location_drift_validation/movie-analysis-real-multi-frame-location-drift-validation-report.json' as const;
export const REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_multi_frame_location_drift_validation/MOVIE_ANALYSIS_REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION.md' as const;
export const MULTI_FRAME_LOCATION_DIR =
  'exports/movie_analysis_model_generation_test/multi_frames' as const;
export const MULTI_FRAME_LOCATION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/multi_frames/movie-analysis-real-multi-frame-location-manifest.json' as const;

export const FRAMES_PER_SOURCE = 4 as const;
export const EXPECTED_MULTI_FRAME_COUNT = EXPECTED_SOURCE_COUNT * FRAMES_PER_SOURCE;
export const MAX_CROSS_FRAME_LOCATION_DRIFT = 0.42 as const;
export const MAX_ANCHOR_DRIFT = 0.38 as const;
export const MAX_LIGHTING_FRAME_DRIFT = 0.45 as const;
export const MAX_ENVIRONMENT_LAYOUT_BREAK = 0.55 as const;
export const MIN_INDOOR_ANCHOR_STRENGTH = 0.45 as const;

const FRAME_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealMultiFrameLocationDriftValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type LocationFrameSnapshot = {
  frame_index: number;
  stage: (typeof FRAME_STAGES)[number];
  sky_zone_rgb: [number, number, number];
  midground_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  indoor_anchor_strength: number;
  lighting_warmth: number;
  layout_signature: string;
};

export type MultiFrameLocationDriftMetrics = {
  max_adjacent_location_gap: number;
  open_to_resolve_location_span: number;
  max_adjacent_lighting_gap: number;
  max_adjacent_layout_gap: number;
  indoor_anchor_variance: number;
  cross_frame_consistency_score: number;
};

export type SourceMultiFrameLocationDriftAudit = {
  source_id: string;
  same_location_identity: ValidationStatus;
  indoor_anchor_persistence: ValidationStatus;
  lighting_anchor_persistence: ValidationStatus;
  environment_layout_persistence: ValidationStatus;
  cross_frame_location_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  location_drift: boolean;
  anchor_drift: boolean;
  lighting_drift: boolean;
  environment_layout_break: boolean;
  location_frames: LocationFrameSnapshot[];
  drift_metrics: MultiFrameLocationDriftMetrics | null;
  source_multi_frame_location_validated: ValidationStatus;
};

export type MultiFrameLocationManifestEntry = {
  source_id: string;
  location_dna_id: string;
  indoor_anchor_id: string;
  lighting_anchor_id: string;
  frame_count: typeof FRAMES_PER_SOURCE;
  frames: LocationFrameSnapshot[];
};

export type MovieAnalysisRealMultiFrameLocationManifest = {
  manifest_id: string;
  phase: typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE;
  generated_at: string;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_MULTI_FRAME_COUNT;
  entries: MultiFrameLocationManifestEntry[];
};

export type MovieAnalysisRealMultiFrameLocationDriftValidationReport = {
  report_id: string;
  phase: typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE;
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
  real_location_consistency_validation_report_path: typeof REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_location_dir: typeof MULTI_FRAME_LOCATION_DIR;
  multi_frame_location_manifest_path: typeof MULTI_FRAME_LOCATION_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  same_location_identity: ValidationStatus;
  indoor_anchor_persistence: ValidationStatus;
  lighting_anchor_persistence: ValidationStatus;
  environment_layout_persistence: ValidationStatus;
  cross_frame_location_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  multi_frame_location_consistency: ValidationStatus;
  location_drift: boolean;
  anchor_drift: boolean;
  lighting_drift: boolean;
  environment_layout_break: boolean;
  real_multi_frame_location_drift_validation_ready: ValidationStatus;
  certification_status: typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceMultiFrameLocationDriftAudit[];
  final_verdict:
    | typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT
    | typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_FAIL_VERDICT;
  issues: RealMultiFrameLocationDriftValidationIssue[];
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
  zoneStartRatio: number,
  zoneEndRatio: number
): Rgb {
  const bandStart = Math.floor(height * bandStartRatio);
  const bandEnd = Math.max(bandStart + 1, Math.floor(height * bandEndRatio));
  const bandHeight = bandEnd - bandStart;
  const zoneStart = bandStart + Math.floor(bandHeight * zoneStartRatio);
  const zoneEnd = Math.max(zoneStart + 1, bandStart + Math.floor(bandHeight * zoneEndRatio));

  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = zoneStart; y < zoneEnd; y += 1) {
    for (let x = 0; x < width; x += 2) {
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

function extractLocationFrames(
  pixels: Buffer,
  width: number,
  height: number
): LocationFrameSnapshot[] {
  const ranges: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];

  return FRAME_STAGES.map((stage, index) => {
    const [bandStart, bandEnd] = ranges[index];
    const skyZone = zoneAverageInBand(pixels, width, height, bandStart, bandEnd, 0, 0.32);
    const midgroundZone = zoneAverageInBand(pixels, width, height, bandStart, bandEnd, 0.34, 0.66);
    const groundZone = zoneAverageInBand(pixels, width, height, bandStart, bandEnd, 0.68, 1);
    const lightingWarmth = (skyZone[0] - skyZone[2] + 128) / 255;
    const indoorAnchorStrength = clamp01(
      1 - colorDistance(midgroundZone, groundZone) / (3 * 255)
    );

    return {
      frame_index: index,
      stage,
      sky_zone_rgb: skyZone,
      midground_zone_rgb: midgroundZone,
      ground_zone_rgb: groundZone,
      indoor_anchor_strength: indoorAnchorStrength,
      lighting_warmth: lightingWarmth,
      layout_signature: layoutSignature(midgroundZone),
    };
  });
}

function computeDriftMetrics(frames: LocationFrameSnapshot[]): MultiFrameLocationDriftMetrics {
  const locationGaps: number[] = [];
  const lightingGaps: number[] = [];
  const layoutGaps: number[] = [];
  const indoorStrengths = frames.map((frame) => frame.indoor_anchor_strength);

  for (let index = 0; index < frames.length - 1; index += 1) {
    locationGaps.push(
      colorDistance(frames[index].midground_zone_rgb, frames[index + 1].midground_zone_rgb) / 255
    );
    lightingGaps.push(Math.abs(frames[index].lighting_warmth - frames[index + 1].lighting_warmth));
    layoutGaps.push(
      colorDistance(frames[index].midground_zone_rgb, frames[index + 1].midground_zone_rgb) / 255
    );
  }

  const maxAdjacentLocationGap = Math.max(...locationGaps, 0);
  const openToResolveLocationSpan =
    colorDistance(frames[0].midground_zone_rgb, frames[3].midground_zone_rgb) / 255;
  const maxAdjacentLightingGap = Math.max(...lightingGaps, 0);
  const maxAdjacentLayoutGap = Math.max(...layoutGaps, 0);
  const indoorAnchorVariance =
    indoorStrengths.length === 0
      ? 1
      : Math.max(...indoorStrengths) - Math.min(...indoorStrengths);

  const locationScore = clamp01(1 - maxAdjacentLocationGap / MAX_CROSS_FRAME_LOCATION_DRIFT);
  const lightingScore = clamp01(1 - maxAdjacentLightingGap / MAX_LIGHTING_FRAME_DRIFT);
  const layoutScore = clamp01(1 - maxAdjacentLayoutGap / MAX_ENVIRONMENT_LAYOUT_BREAK);
  const anchorScore = clamp01(1 - indoorAnchorVariance / MAX_ANCHOR_DRIFT);
  const crossFrameConsistencyScore = clamp01(
    locationScore * 0.3 + lightingScore * 0.25 + layoutScore * 0.25 + anchorScore * 0.2
  );

  return {
    max_adjacent_location_gap: maxAdjacentLocationGap,
    open_to_resolve_location_span: openToResolveLocationSpan,
    max_adjacent_lighting_gap: maxAdjacentLightingGap,
    max_adjacent_layout_gap: maxAdjacentLayoutGap,
    indoor_anchor_variance: indoorAnchorVariance,
    cross_frame_consistency_score: crossFrameConsistencyScore,
  };
}

function hasContinuityAdapter(result: RealModelTestGenerationResult): boolean {
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

function loadTestManifest(projectRoot: string): RealModelTestGenerationManifest | null {
  const abs = path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealModelTestGenerationManifest;
}

function loadLocationConsistencyReport(
  projectRoot: string
): {
  final_verdict?: string;
  certification_status?: string | null;
} | null {
  const abs = path.join(projectRoot, REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
  };
}

function loadTestGenerationReport(
  projectRoot: string
): {
  final_verdict?: string;
} | null {
  const abs = path.join(projectRoot, REAL_MODEL_TEST_GENERATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
}

function auditSourceMultiFrameLocation(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceMultiFrameLocationDriftAudit {
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[sourceId];

  if (!result || !anchors) {
    return {
      source_id: sourceId,
      same_location_identity: 'FAIL',
      indoor_anchor_persistence: 'FAIL',
      lighting_anchor_persistence: 'FAIL',
      environment_layout_persistence: 'FAIL',
      cross_frame_location_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_drift: true,
      lighting_drift: true,
      environment_layout_break: true,
      location_frames: [],
      drift_metrics: null,
      source_multi_frame_location_validated: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, result.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_id: sourceId,
      same_location_identity: 'FAIL',
      indoor_anchor_persistence: 'FAIL',
      lighting_anchor_persistence: 'FAIL',
      environment_layout_persistence: 'FAIL',
      cross_frame_location_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_drift: true,
      lighting_drift: true,
      environment_layout_break: true,
      location_frames: [],
      drift_metrics: null,
      source_multi_frame_location_validated: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_id: sourceId,
      same_location_identity: 'FAIL',
      indoor_anchor_persistence: 'FAIL',
      lighting_anchor_persistence: 'FAIL',
      environment_layout_persistence: 'FAIL',
      cross_frame_location_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_drift: true,
      lighting_drift: true,
      environment_layout_break: true,
      location_frames: [],
      drift_metrics: null,
      source_multi_frame_location_validated: 'FAIL',
    };
  }

  const frames = extractLocationFrames(decoded.pixels, decoded.width, decoded.height);
  const metrics = computeDriftMetrics(frames);

  const identityDrifts = frames.map(
    (frame) => colorDistance(frame.midground_zone_rgb, frames[0].midground_zone_rgb) / 255
  );
  const sameLocationIdentity =
    identityDrifts.every((drift) => drift <= MAX_CROSS_FRAME_LOCATION_DRIFT) &&
    metrics.open_to_resolve_location_span <= MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15 &&
    result.dna_binding.cinematic_dna_id === anchors.location_dna_id.replace('location_dna', 'cinematic_dna')
      ? 'PASS'
      : 'FAIL';

  const indoorAnchorPersistence =
    promptHasIndoorAnchor(result.prompt, sourceId) &&
    frames.every((frame) => frame.indoor_anchor_strength >= MIN_INDOOR_ANCHOR_STRENGTH) &&
    metrics.indoor_anchor_variance <= MAX_ANCHOR_DRIFT
      ? 'PASS'
      : 'FAIL';

  const lightingAnchorPersistence =
    metrics.max_adjacent_lighting_gap <= MAX_LIGHTING_FRAME_DRIFT &&
    result.prompt.includes('continuity_layout')
      ? 'PASS'
      : 'FAIL';

  const environmentLayoutPersistence =
    metrics.max_adjacent_layout_gap <= MAX_ENVIRONMENT_LAYOUT_BREAK
      ? 'PASS'
      : 'FAIL';

  const crossFrameLocationConsistency =
    metrics.max_adjacent_location_gap <= MAX_CROSS_FRAME_LOCATION_DRIFT &&
    metrics.cross_frame_consistency_score >= 0.58
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    hasContinuityAdapter(result) &&
    result.traceability.cinematic_dna_id.length > 0
      ? 'PASS'
      : 'FAIL';

  const locationDrift =
    sameLocationIdentity === 'FAIL' ||
    metrics.open_to_resolve_location_span > MAX_CROSS_FRAME_LOCATION_DRIFT * 1.15;
  const anchorDrift = indoorAnchorPersistence === 'FAIL';
  const lightingDrift =
    lightingAnchorPersistence === 'FAIL' ||
    metrics.max_adjacent_lighting_gap > MAX_LIGHTING_FRAME_DRIFT;
  const environmentLayoutBreak =
    environmentLayoutPersistence === 'FAIL' ||
    metrics.max_adjacent_layout_gap > MAX_ENVIRONMENT_LAYOUT_BREAK;

  const checks: ValidationStatus[] = [
    sameLocationIdentity,
    indoorAnchorPersistence,
    lightingAnchorPersistence,
    environmentLayoutPersistence,
    crossFrameLocationConsistency,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    same_location_identity: sameLocationIdentity,
    indoor_anchor_persistence: indoorAnchorPersistence,
    lighting_anchor_persistence: lightingAnchorPersistence,
    environment_layout_persistence: environmentLayoutPersistence,
    cross_frame_location_consistency: crossFrameLocationConsistency,
    traceability_preserved: traceabilityPreserved,
    location_drift: locationDrift,
    anchor_drift: anchorDrift,
    lighting_drift: lightingDrift,
    environment_layout_break: environmentLayoutBreak,
    location_frames: frames,
    drift_metrics: metrics,
    source_multi_frame_location_validated:
      checks.every((status) => status === 'PASS') &&
      !locationDrift &&
      !anchorDrift &&
      !lightingDrift &&
      !environmentLayoutBreak
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceMultiFrameLocationDriftAudit[],
  field: keyof Omit<
    SourceMultiFrameLocationDriftAudit,
    | 'source_id'
    | 'location_drift'
    | 'anchor_drift'
    | 'lighting_drift'
    | 'environment_layout_break'
    | 'location_frames'
    | 'drift_metrics'
    | 'source_multi_frame_location_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealMultiFrameLocationDriftValidationReport): string {
  const lines = [
    '# Movie Analysis Real Multi-Frame Location Drift Validation',
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
    `| same_location_identity | ${report.same_location_identity} |`,
    `| indoor_anchor_persistence | ${report.indoor_anchor_persistence} |`,
    `| lighting_anchor_persistence | ${report.lighting_anchor_persistence} |`,
    `| environment_layout_persistence | ${report.environment_layout_persistence} |`,
    `| cross_frame_location_consistency | ${report.cross_frame_location_consistency} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| multi_frame_location_consistency | ${report.multi_frame_location_consistency} |`,
    `| location_drift | ${report.location_drift} |`,
    `| anchor_drift | ${report.anchor_drift} |`,
    `| lighting_drift | ${report.lighting_drift} |`,
    `| environment_layout_break | ${report.environment_layout_break} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- same_location_identity: ${audit.same_location_identity}`,
      `- indoor_anchor_persistence: ${audit.indoor_anchor_persistence}`,
      `- lighting_anchor_persistence: ${audit.lighting_anchor_persistence}`,
      `- environment_layout_persistence: ${audit.environment_layout_persistence}`,
      `- cross_frame_location_consistency: ${audit.cross_frame_location_consistency}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- location_drift: ${audit.location_drift}`,
      `- anchor_drift: ${audit.anchor_drift}`,
      `- lighting_drift: ${audit.lighting_drift}`,
      `- environment_layout_break: ${audit.environment_layout_break}`,
      `- frames: ${audit.location_frames.length}`,
      ''
    );
    if (audit.drift_metrics) {
      lines.push(
        `- max_adjacent_location_gap: ${audit.drift_metrics.max_adjacent_location_gap.toFixed(4)}`,
        `- cross_frame_consistency_score: ${audit.drift_metrics.cross_frame_consistency_score.toFixed(4)}`,
        ''
      );
    }
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
  issues: RealMultiFrameLocationDriftValidationIssue[],
  sourceAudits: SourceMultiFrameLocationDriftAudit[] = []
): MovieAnalysisRealMultiFrameLocationDriftValidationReport {
  const report: MovieAnalysisRealMultiFrameLocationDriftValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-location-drift-validation-report-v1',
    phase: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE,
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
    real_location_consistency_validation_report_path: REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_location_dir: MULTI_FRAME_LOCATION_DIR,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    same_location_identity: 'FAIL',
    indoor_anchor_persistence: 'FAIL',
    lighting_anchor_persistence: 'FAIL',
    environment_layout_persistence: 'FAIL',
    cross_frame_location_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    multi_frame_location_consistency: 'FAIL',
    location_drift: true,
    anchor_drift: true,
    lighting_drift: true,
    environment_layout_break: true,
    real_multi_frame_location_drift_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealMultiFrameLocationDriftValidation(
  projectRoot?: string
): MovieAnalysisRealMultiFrameLocationDriftValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealMultiFrameLocationDriftValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const locationConsistencyReport = loadLocationConsistencyReport(root);
  if (!locationConsistencyReport) {
    issues.push({
      code: 'REAL_LOCATION_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (locationConsistencyReport.final_verdict !== REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_004_NOT_PASS',
      message: `L2F-004 must have ${REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (
    locationConsistencyReport.certification_status !==
    REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_004_NOT_VALIDATED',
      message: `L2F-004 status must be ${REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const testGenerationReport = loadTestGenerationReport(root);
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
    const audit = auditSourceMultiFrameLocation(result, root, sourceId);
    if (audit.source_multi_frame_location_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_MULTI_FRAME_LOCATION_FAIL',
        message: `Multi-frame location drift validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.location_drift) {
      issues.push({
        code: 'LOCATION_DRIFT',
        message: `Location drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.anchor_drift) {
      issues.push({
        code: 'ANCHOR_DRIFT',
        message: `Indoor anchor drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.lighting_drift) {
      issues.push({
        code: 'LIGHTING_DRIFT',
        message: `Lighting drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.environment_layout_break) {
      issues.push({
        code: 'ENVIRONMENT_LAYOUT_BREAK',
        message: `Environment layout break detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: MultiFrameLocationManifestEntry[] = sourceAudits.map((audit) => {
    const anchors = SOURCE_LOCATION_DNA_ANCHORS[audit.source_id as keyof typeof SOURCE_LOCATION_DNA_ANCHORS];
    return {
      source_id: audit.source_id,
      location_dna_id: anchors.location_dna_id,
      indoor_anchor_id: anchors.indoor_anchor_id,
      lighting_anchor_id: anchors.lighting_anchor_id,
      frame_count: FRAMES_PER_SOURCE,
      frames: audit.location_frames,
    };
  });

  fs.mkdirSync(path.join(root, MULTI_FRAME_LOCATION_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    const entryPath = path.join(
      root,
      MULTI_FRAME_LOCATION_DIR,
      `${entry.source_id}-multi-frame-location.json`
    );
    fs.writeFileSync(`${entryPath}`, `${JSON.stringify(entry, null, 2)}\n`, 'utf8');
  }

  const multiFrameManifest: MovieAnalysisRealMultiFrameLocationManifest = {
    manifest_id: 'movie-analysis-real-multi-frame-location-manifest-v1',
    phase: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE,
    generated_at: timestamp,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, MULTI_FRAME_LOCATION_MANIFEST_PATH),
    `${JSON.stringify(multiFrameManifest, null, 2)}\n`,
    'utf8'
  );

  const sameLocationIdentity = aggregateStatus(sourceAudits, 'same_location_identity');
  const indoorAnchorPersistence = aggregateStatus(sourceAudits, 'indoor_anchor_persistence');
  const lightingAnchorPersistence = aggregateStatus(sourceAudits, 'lighting_anchor_persistence');
  const environmentLayoutPersistence = aggregateStatus(
    sourceAudits,
    'environment_layout_persistence'
  );
  const crossFrameLocationConsistency = aggregateStatus(
    sourceAudits,
    'cross_frame_location_consistency'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const locationDrift = sourceAudits.some((audit) => audit.location_drift);
  const anchorDrift = sourceAudits.some((audit) => audit.anchor_drift);
  const lightingDrift = sourceAudits.some((audit) => audit.lighting_drift);
  const environmentLayoutBreak = sourceAudits.some((audit) => audit.environment_layout_break);

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
    sameLocationIdentity,
    indoorAnchorPersistence,
    lightingAnchorPersistence,
    environmentLayoutPersistence,
    crossFrameLocationConsistency,
    traceabilityPreserved,
  ];

  const multiFrameLocationConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !locationDrift &&
    !anchorDrift &&
    !lightingDrift &&
    !environmentLayoutBreak &&
    sourceAudits.every((audit) => audit.source_multi_frame_location_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (locationDrift || anchorDrift || lightingDrift || environmentLayoutBreak) {
    issues.push({
      code: 'MULTI_FRAME_LOCATION_BLOCK',
      message: 'Multi-frame location block triggered',
      severity: 'error',
    });
  }

  if (multiFrameLocationConsistency === 'FAIL') {
    issues.push({
      code: 'MULTI_FRAME_LOCATION_CONSISTENCY_FAIL',
      message: 'Multi-frame location consistency validation failed',
      severity: 'error',
    });
  }

  const realMultiFrameLocationDriftValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_MULTI_FRAME_COUNT &&
    multiFrameLocationConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realMultiFrameLocationDriftValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MULTI_FRAME_LOCATION_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_MULTI_FRAME_LOCATION_NOT_VALIDATED',
      message: 'Real multi-frame location drift is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealMultiFrameLocationDriftValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-location-drift-validation-report-v1',
    phase: REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PHASE,
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
    real_location_consistency_validation_report_path: REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_location_dir: MULTI_FRAME_LOCATION_DIR,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    frame_count: frameCount,
    same_location_identity: sameLocationIdentity,
    indoor_anchor_persistence: indoorAnchorPersistence,
    lighting_anchor_persistence: lightingAnchorPersistence,
    environment_layout_persistence: environmentLayoutPersistence,
    cross_frame_location_consistency: crossFrameLocationConsistency,
    traceability_preserved: traceabilityPreserved,
    multi_frame_location_consistency: multiFrameLocationConsistency,
    location_drift: locationDrift,
    anchor_drift: anchorDrift,
    lighting_drift: lightingDrift,
    environment_layout_break: environmentLayoutBreak,
    real_multi_frame_location_drift_validation_ready: realMultiFrameLocationDriftValidationReady,
    certification_status: pass ? REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT
      : REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
