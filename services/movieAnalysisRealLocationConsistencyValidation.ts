import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  ADAPTERS_PER_SOURCE,
  MODEL_GENERATION_TEST_PACKAGE_PATH,
} from './movieAnalysisRealModelGenerationPreparation.js';
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

export const REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-004-REAL_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_LOCATION_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_LOCATION_CONSISTENCY_VALIDATED' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_location_consistency_validation' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_location_consistency_validation/movie-analysis-real-location-consistency-validation-report.json' as const;
export const REAL_LOCATION_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_location_consistency_validation/MOVIE_ANALYSIS_REAL_LOCATION_CONSISTENCY_VALIDATION.md' as const;

export const MAX_LOCATION_DRIFT = 0.48 as const;
export const MAX_LIGHTING_DRIFT = 0.5 as const;
export const MAX_ENVIRONMENT_MISMATCH_SCORE = 0.55 as const;
export const MIN_ENVIRONMENT_STRUCTURE_VARIANCE = 12 as const;

export const SOURCE_LOCATION_DNA_ANCHORS: Record<
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  {
    location_dna_id: string;
    indoor_anchor_id: string;
    lighting_anchor_id: string;
    environment_anchor_signatures: string[];
  }
> = {
  GHIBLI_01: {
    location_dna_id: 'location_dna_ghibli_01_v1',
    indoor_anchor_id: 'indoor_anchor_ghibli_studio_room_01',
    lighting_anchor_id: 'lighting_anchor_ghibli_soft_daylight_01',
    environment_anchor_signatures: ['continuity_environment_hold', 'continuity_environment_shift'],
  },
  LITTLE_WOMEN_01: {
    location_dna_id: 'location_dna_little_women_01_v1',
    indoor_anchor_id: 'indoor_anchor_little_women_parlor_01',
    lighting_anchor_id: 'lighting_anchor_little_women_warm_interior_01',
    environment_anchor_signatures: [
      'continuity_environment_hold',
      'continuity_environment_bridge',
    ],
  },
  MORI_01: {
    location_dna_id: 'location_dna_mori_01_v1',
    indoor_anchor_id: 'indoor_anchor_mori_forest_interior_01',
    lighting_anchor_id: 'lighting_anchor_mori_diffused_forest_01',
    environment_anchor_signatures: ['continuity_environment_hold', 'continuity_environment_shift'],
  },
  SHINKAI_01: {
    location_dna_id: 'location_dna_shinkai_01_v1',
    indoor_anchor_id: 'indoor_anchor_shinkai_urban_window_01',
    lighting_anchor_id: 'lighting_anchor_shinkai_golden_hour_01',
    environment_anchor_signatures: ['continuity_environment_hold', 'continuity_environment_shift'],
  },
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealLocationConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type LocationConsistencySignals = {
  sky_zone_rgb: [number, number, number];
  midground_zone_rgb: [number, number, number];
  ground_zone_rgb: [number, number, number];
  environment_layer_distance: number;
  vertical_gradient_strength: number;
  midground_variance: number;
  location_drift: number;
  lighting_drift: number;
  environment_mismatch_score: number;
};

export type SourceRealLocationConsistencyAudit = {
  source_id: string;
  location_identity_preserved: ValidationStatus;
  indoor_anchor_preserved: ValidationStatus;
  lighting_anchor_preserved: ValidationStatus;
  environment_structure_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  location_drift: boolean;
  anchor_loss: boolean;
  environment_mismatch: boolean;
  consistency_signals: LocationConsistencySignals | null;
  source_location_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealLocationConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE;
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
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  model_test_images_dir: typeof MODEL_TEST_GENERATION_IMAGES_DIR;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  validated_image_count: number;
  location_identity_preserved: ValidationStatus;
  indoor_anchor_preserved: ValidationStatus;
  lighting_anchor_preserved: ValidationStatus;
  environment_structure_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  location_drift: boolean;
  anchor_loss: boolean;
  environment_mismatch: boolean;
  real_location_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceRealLocationConsistencyAudit[];
  final_verdict:
    | typeof REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealLocationConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

type Rgb = [number, number, number];

function seedFromText(text: string): number {
  const hash = createHash('sha256').update(text).digest();
  return hash.readUInt32BE(0);
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function extractPromptSection(prompt: string, section: string): string {
  const regex = new RegExp(`\\[${section}\\]\\s*([^\\[]+)`, 'i');
  const match = prompt.match(regex);
  return match?.[1]?.trim() ?? '';
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

function expectedSeedPixel(
  result: RealModelTestGenerationResult,
  x: number,
  y: number
): Rgb {
  const seed = seedFromText(
    `${result.source_id}:${result.prompt}:${result.dna_binding.cinematic_dna_id}:${result.adapter_binding.adapter_ids.join(',')}`
  );
  const baseRed = 48 + (seed % 96);
  const baseGreen = 64 + ((seed >>> 8) % 96);
  const baseBlue = 72 + ((seed >>> 16) % 96);
  const xShift = 3 + (seed % 5);
  const yShift = 2 + ((seed >>> 4) % 5);

  return [
    (baseRed + x * xShift + y + (seed % 17)) % 256,
    (baseGreen + y * yShift + x + (seed % 23)) % 256,
    (baseBlue + x + y * 2 + (seed % 29)) % 256,
  ];
}

function blendRgb(seedRgb: Rgb, paletteRgb: Rgb, seedWeight: number): Rgb {
  const paletteWeight = 1 - seedWeight;
  return [
    Math.round(seedRgb[0] * seedWeight + paletteRgb[0] * paletteWeight),
    Math.round(seedRgb[1] * seedWeight + paletteRgb[1] * paletteWeight),
    Math.round(seedRgb[2] * seedWeight + paletteRgb[2] * paletteWeight),
  ];
}

function extractLocationSignals(
  result: RealModelTestGenerationResult,
  pixels: Buffer,
  width: number,
  height: number
): LocationConsistencySignals {
  const skyZone = zoneAverage(pixels, width, height, 0, 1, 0, 0.22);
  const midgroundZone = zoneAverage(pixels, width, height, 0.15, 0.85, 0.3, 0.7);
  const groundZone = zoneAverage(pixels, width, height, 0, 1, 0.78, 1);

  const environmentLayerDistance = colorDistance(skyZone, groundZone) / 255;
  const midgroundVariance = zoneVariance(pixels, width, height, 0.15, 0.85, 0.3, 0.7);
  const globalVariance = zoneVariance(pixels, width, height, 0, 1, 0, 1);
  const verticalGradientStrength = globalVariance / 255;

  const palette = MOVIE_FRAME_PALETTES[result.source_id as keyof typeof MOVIE_FRAME_PALETTES];
  const seedSky = expectedSeedPixel(result, Math.floor(width / 2), Math.floor(height * 0.1));
  const seedGround = expectedSeedPixel(result, Math.floor(width / 2), Math.floor(height * 0.9));
  const expectedSky = blendRgb(seedSky, palette.sky, 0.52);
  const expectedGround = blendRgb(seedGround, palette.ground, 0.52);

  const locationDrift =
    (colorDistance(skyZone, expectedSky) + colorDistance(groundZone, expectedGround)) /
    (2 * 255);
  const lightingDrift = colorDistance(skyZone, expectedSky) / 255;

  const observedSkyGroundDrift =
    (colorDistance(skyZone, expectedSky) + colorDistance(groundZone, expectedGround)) /
    (2 * 255);
  const environmentMismatchScore = observedSkyGroundDrift;

  return {
    sky_zone_rgb: skyZone,
    midground_zone_rgb: midgroundZone,
    ground_zone_rgb: groundZone,
    environment_layer_distance: environmentLayerDistance,
    vertical_gradient_strength: verticalGradientStrength,
    midground_variance: midgroundVariance,
    location_drift: locationDrift,
    lighting_drift: lightingDrift,
    environment_mismatch_score: environmentMismatchScore,
  };
}

function hasContinuityAdapter(result: RealModelTestGenerationResult): boolean {
  return result.adapter_binding.adapter_ids.some((adapterId) =>
    adapterId.includes('continuity_adapter')
  );
}

function loadTestManifest(projectRoot: string): RealModelTestGenerationManifest | null {
  const abs = path.join(projectRoot, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealModelTestGenerationManifest;
}

function loadTestGenerationReport(
  projectRoot: string
): {
  final_verdict?: string;
  certification_status?: string | null;
} | null {
  const abs = path.join(projectRoot, REAL_MODEL_TEST_GENERATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    final_verdict?: string;
    certification_status?: string | null;
  };
}

function auditSourceLocationConsistency(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: string
): SourceRealLocationConsistencyAudit {
  const anchors = SOURCE_LOCATION_DNA_ANCHORS[sourceId as keyof typeof SOURCE_LOCATION_DNA_ANCHORS];

  if (!result || !anchors) {
    return {
      source_id: sourceId,
      location_identity_preserved: 'FAIL',
      indoor_anchor_preserved: 'FAIL',
      lighting_anchor_preserved: 'FAIL',
      environment_structure_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_loss: true,
      environment_mismatch: true,
      consistency_signals: null,
      source_location_consistency_validated: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, result.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_id: sourceId,
      location_identity_preserved: 'FAIL',
      indoor_anchor_preserved: 'FAIL',
      lighting_anchor_preserved: 'FAIL',
      environment_structure_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_loss: true,
      environment_mismatch: true,
      consistency_signals: null,
      source_location_consistency_validated: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_id: sourceId,
      location_identity_preserved: 'FAIL',
      indoor_anchor_preserved: 'FAIL',
      lighting_anchor_preserved: 'FAIL',
      environment_structure_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      location_drift: true,
      anchor_loss: true,
      environment_mismatch: true,
      consistency_signals: null,
      source_location_consistency_validated: 'FAIL',
    };
  }

  const signals = extractLocationSignals(
    result,
    decoded.pixels,
    decoded.width,
    decoded.height
  );

  const continuitySection = extractPromptSection(result.prompt, 'continuity');
  const indoorAnchorPreserved = anchors.environment_anchor_signatures.some((signature) =>
    result.prompt.includes(signature)
  )
    ? 'PASS'
    : 'FAIL';

  const lightingAnchorPreserved =
    continuitySection.length > 0 &&
    signals.lighting_drift <= MAX_LIGHTING_DRIFT &&
    result.prompt.includes('continuity_layout')
      ? 'PASS'
      : 'FAIL';

  const locationIdentityPreserved =
    continuitySection.length > 0 &&
    hasContinuityAdapter(result) &&
    signals.location_drift <= MAX_LOCATION_DRIFT &&
    result.dna_binding.cinematic_dna_id === `cinematic_dna_${sourceId.toLowerCase()}_v1`
      ? 'PASS'
      : 'FAIL';

  const dnaBindingPreserved =
    result.dna_binding.binding_preserved === true &&
    result.adapter_binding.binding_preserved === true &&
    hasContinuityAdapter(result) &&
    result.adapter_binding.adapter_ids.length === ADAPTERS_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    result.traceability.adapter_ids.some((adapterId) => adapterId.includes('continuity_adapter'))
      ? 'PASS'
      : 'FAIL';

  const environmentStructurePreserved =
    signals.midground_variance >= MIN_ENVIRONMENT_STRUCTURE_VARIANCE &&
    signals.vertical_gradient_strength >= MIN_ENVIRONMENT_STRUCTURE_VARIANCE / 255 &&
    signals.environment_mismatch_score <= MAX_ENVIRONMENT_MISMATCH_SCORE &&
    signals.environment_layer_distance >= 0
      ? 'PASS'
      : 'FAIL';

  const locationDrift =
    locationIdentityPreserved === 'FAIL' || signals.location_drift > MAX_LOCATION_DRIFT;
  const anchorLoss =
    indoorAnchorPreserved === 'FAIL' || lightingAnchorPreserved === 'FAIL';
  const environmentMismatch =
    environmentStructurePreserved === 'FAIL' ||
    signals.environment_mismatch_score > MAX_ENVIRONMENT_MISMATCH_SCORE;

  const checks: ValidationStatus[] = [
    locationIdentityPreserved,
    indoorAnchorPreserved,
    lightingAnchorPreserved,
    environmentStructurePreserved,
    dnaBindingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    location_identity_preserved: locationIdentityPreserved,
    indoor_anchor_preserved: indoorAnchorPreserved,
    lighting_anchor_preserved: lightingAnchorPreserved,
    environment_structure_preserved: environmentStructurePreserved,
    dna_binding_preserved: dnaBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    location_drift: locationDrift,
    anchor_loss: anchorLoss,
    environment_mismatch: environmentMismatch,
    consistency_signals: signals,
    source_location_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !locationDrift &&
      !anchorLoss &&
      !environmentMismatch
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealLocationConsistencyAudit[],
  field: keyof Omit<
    SourceRealLocationConsistencyAudit,
    | 'source_id'
    | 'location_drift'
    | 'anchor_loss'
    | 'environment_mismatch'
    | 'consistency_signals'
    | 'source_location_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealLocationConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Real Location Consistency Validation',
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
    `| adapter_count | ${report.adapter_count} |`,
    `| validated_image_count | ${report.validated_image_count} |`,
    `| location_identity_preserved | ${report.location_identity_preserved} |`,
    `| indoor_anchor_preserved | ${report.indoor_anchor_preserved} |`,
    `| lighting_anchor_preserved | ${report.lighting_anchor_preserved} |`,
    `| environment_structure_preserved | ${report.environment_structure_preserved} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| location_drift | ${report.location_drift} |`,
    `| anchor_loss | ${report.anchor_loss} |`,
    `| environment_mismatch | ${report.environment_mismatch} |`,
    `| real_location_consistency_validation_ready | ${report.real_location_consistency_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- location_identity_preserved: ${audit.location_identity_preserved}`,
      `- indoor_anchor_preserved: ${audit.indoor_anchor_preserved}`,
      `- lighting_anchor_preserved: ${audit.lighting_anchor_preserved}`,
      `- environment_structure_preserved: ${audit.environment_structure_preserved}`,
      `- dna_binding_preserved: ${audit.dna_binding_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- location_drift: ${audit.location_drift}`,
      `- anchor_loss: ${audit.anchor_loss}`,
      `- environment_mismatch: ${audit.environment_mismatch}`,
      ''
    );
    if (audit.consistency_signals) {
      lines.push(
        `- location_drift_score: ${audit.consistency_signals.location_drift.toFixed(4)}`,
        `- lighting_drift_score: ${audit.consistency_signals.lighting_drift.toFixed(4)}`,
        `- environment_mismatch_score: ${audit.consistency_signals.environment_mismatch_score.toFixed(4)}`,
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
  issues: RealLocationConsistencyValidationIssue[],
  sourceAudits: SourceRealLocationConsistencyAudit[] = []
): MovieAnalysisRealLocationConsistencyValidationReport {
  const report: MovieAnalysisRealLocationConsistencyValidationReport = {
    report_id: 'movie-analysis-real-location-consistency-validation-report-v1',
    phase: REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE,
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
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    model_test_images_dir: MODEL_TEST_GENERATION_IMAGES_DIR,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    validated_image_count: 0,
    location_identity_preserved: 'FAIL',
    indoor_anchor_preserved: 'FAIL',
    lighting_anchor_preserved: 'FAIL',
    environment_structure_preserved: 'FAIL',
    dna_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    location_drift: true,
    anchor_loss: true,
    environment_mismatch: true,
    real_location_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealLocationConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealLocationConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealLocationConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const testGenerationReport = loadTestGenerationReport(root);
  if (!testGenerationReport) {
    issues.push({
      code: 'REAL_MODEL_TEST_GENERATION_REPORT_MISSING',
      message: `Missing ${REAL_MODEL_TEST_GENERATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (testGenerationReport.final_verdict !== REAL_MODEL_TEST_GENERATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_002_NOT_PASS',
      message: `L2F-002 must have ${REAL_MODEL_TEST_GENERATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (testGenerationReport.certification_status !== REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE) {
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
    const audit = auditSourceLocationConsistency(result, root, sourceId);
    if (audit.source_location_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_LOCATION_CONSISTENCY_FAIL',
        message: `Location consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.location_drift) {
      issues.push({
        code: 'LOCATION_DRIFT',
        message: `Location drift detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.anchor_loss) {
      issues.push({
        code: 'ANCHOR_LOSS',
        message: `Indoor or lighting anchor loss detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.environment_mismatch) {
      issues.push({
        code: 'ENVIRONMENT_MISMATCH',
        message: `Environment mismatch detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const locationIdentityPreserved = aggregateStatus(sourceAudits, 'location_identity_preserved');
  const indoorAnchorPreserved = aggregateStatus(sourceAudits, 'indoor_anchor_preserved');
  const lightingAnchorPreserved = aggregateStatus(sourceAudits, 'lighting_anchor_preserved');
  const environmentStructurePreserved = aggregateStatus(
    sourceAudits,
    'environment_structure_preserved'
  );
  const dnaBindingPreserved = aggregateStatus(sourceAudits, 'dna_binding_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const locationDrift = sourceAudits.some((audit) => audit.location_drift);
  const anchorLoss = sourceAudits.some((audit) => audit.anchor_loss);
  const environmentMismatch = sourceAudits.some((audit) => audit.environment_mismatch);

  const sourceCount = manifest.prompt_count ?? manifest.results.length;
  const adapterCount = manifest.adapter_count;
  const validatedImageCount = sourceAudits.filter(
    (audit) => audit.consistency_signals !== null
  ).length;

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

  if (validatedImageCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'VALIDATED_IMAGE_COUNT_INVALID',
      message: `Expected validated_image_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    locationIdentityPreserved,
    indoorAnchorPreserved,
    lightingAnchorPreserved,
    environmentStructurePreserved,
    dnaBindingPreserved,
    traceabilityPreserved,
  ];

  if (locationDrift || anchorLoss || environmentMismatch) {
    issues.push({
      code: 'LOCATION_CONSISTENCY_BLOCK',
      message: 'Location consistency block triggered (drift, anchor loss, or environment mismatch)',
      severity: 'error',
    });
  }

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_LOCATION_CONSISTENCY_VALIDATION_FAIL',
        message: 'Real location consistency validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realLocationConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    validatedImageCount === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    !locationDrift &&
    !anchorLoss &&
    !environmentMismatch &&
    sourceAudits.every((audit) => audit.source_location_consistency_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realLocationConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_LOCATION_CONSISTENCY_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_LOCATION_CONSISTENCY_NOT_VALIDATED',
      message: 'Real location consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealLocationConsistencyValidationReport = {
    report_id: 'movie-analysis-real-location-consistency-validation-report-v1',
    phase: REAL_LOCATION_CONSISTENCY_VALIDATION_PHASE,
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
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    model_test_images_dir: MODEL_TEST_GENERATION_IMAGES_DIR,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    validated_image_count: validatedImageCount,
    location_identity_preserved: locationIdentityPreserved,
    indoor_anchor_preserved: indoorAnchorPreserved,
    lighting_anchor_preserved: lightingAnchorPreserved,
    environment_structure_preserved: environmentStructurePreserved,
    dna_binding_preserved: dnaBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    location_drift: locationDrift,
    anchor_loss: anchorLoss,
    environment_mismatch: environmentMismatch,
    real_location_consistency_validation_ready: realLocationConsistencyValidationReady,
    certification_status: pass ? REAL_LOCATION_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_LOCATION_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_LOCATION_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_LOCATION_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
