import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MAX_CHARACTER_DRIFT,
  MAX_DNA_MISMATCH_SCORE,
  MAX_PALETTE_DRIFT,
  MIN_FACE_ZONE_VARIANCE,
  MIN_PALETTE_SPREAD,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
  REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE,
} from './movieAnalysisRealCharacterConsistencyValidation.js';
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

export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE =
  'PHASE-LEVEL2F-006-REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_V1' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE =
  'REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATED' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_DIR =
  'reports/movie_analysis_real_multi_frame_character_drift_validation' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_multi_frame_character_drift_validation/movie-analysis-real-multi-frame-character-drift-validation-report.json' as const;
export const REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_multi_frame_character_drift_validation/MOVIE_ANALYSIS_REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION.md' as const;
export const MULTI_FRAME_CHARACTER_DIR =
  'exports/movie_analysis_model_generation_test/multi_frames_character' as const;
export const MULTI_FRAME_CHARACTER_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/multi_frames_character/movie-analysis-real-multi-frame-character-manifest.json' as const;

export const FRAMES_PER_SOURCE = 4 as const;
export const EXPECTED_MULTI_FRAME_COUNT = EXPECTED_SOURCE_COUNT * FRAMES_PER_SOURCE;
export const MAX_CROSS_FRAME_CHARACTER_DRIFT = MAX_CHARACTER_DRIFT;
export const MAX_HAIRSTYLE_FRAME_DRIFT = 0.4 as const;
export const MIN_CROSS_FRAME_CHARACTER_SCORE = 0.58 as const;

const FRAME_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealMultiFrameCharacterDriftValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type CharacterFrameSnapshot = {
  frame_index: number;
  stage: (typeof FRAME_STAGES)[number];
  subject_zone_rgb: [number, number, number];
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  face_zone_variance: number;
  palette_spread: number;
  hairstyle_ratio: number;
  character_signature: string;
};

export type MultiFrameCharacterDriftMetrics = {
  max_adjacent_character_gap: number;
  open_to_resolve_character_span: number;
  max_adjacent_hairstyle_gap: number;
  palette_variance: number;
  dna_mismatch_score: number;
  cross_frame_character_score: number;
};

export type SourceMultiFrameCharacterDriftAudit = {
  source_id: string;
  same_character_identity: ValidationStatus;
  facial_structure_persistence: ValidationStatus;
  hairstyle_persistence: ValidationStatus;
  color_palette_persistence: ValidationStatus;
  dna_persistence: ValidationStatus;
  cross_frame_character_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  character_drift: boolean;
  identity_loss: boolean;
  hairstyle_drift: boolean;
  dna_mismatch: boolean;
  character_frames: CharacterFrameSnapshot[];
  drift_metrics: MultiFrameCharacterDriftMetrics | null;
  source_multi_frame_character_validated: ValidationStatus;
};

export type MultiFrameCharacterManifestEntry = {
  source_id: string;
  cinematic_dna_id: string;
  frame_count: typeof FRAMES_PER_SOURCE;
  frames: CharacterFrameSnapshot[];
};

export type MovieAnalysisRealMultiFrameCharacterManifest = {
  manifest_id: string;
  phase: typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE;
  generated_at: string;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_MULTI_FRAME_COUNT;
  entries: MultiFrameCharacterManifestEntry[];
};

export type MovieAnalysisRealMultiFrameCharacterDriftValidationReport = {
  report_id: string;
  phase: typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE;
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
  real_character_consistency_validation_report_path: typeof REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH;
  real_multi_frame_location_drift_validation_report_path: typeof REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  multi_frame_location_manifest_path: typeof MULTI_FRAME_LOCATION_MANIFEST_PATH;
  multi_frame_character_dir: typeof MULTI_FRAME_CHARACTER_DIR;
  multi_frame_character_manifest_path: typeof MULTI_FRAME_CHARACTER_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  same_character_identity: ValidationStatus;
  facial_structure_persistence: ValidationStatus;
  hairstyle_persistence: ValidationStatus;
  color_palette_persistence: ValidationStatus;
  dna_persistence: ValidationStatus;
  cross_frame_character_consistency: ValidationStatus;
  traceability_preserved: ValidationStatus;
  multi_frame_character_consistency: ValidationStatus;
  character_drift: boolean;
  identity_loss: boolean;
  hairstyle_drift: boolean;
  dna_mismatch: boolean;
  real_multi_frame_character_drift_validation_ready: ValidationStatus;
  certification_status: typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceMultiFrameCharacterDriftAudit[];
  final_verdict:
    | typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT
    | typeof REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_FAIL_VERDICT;
  issues: RealMultiFrameCharacterDriftValidationIssue[];
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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function characterSignature(rgb: Rgb): string {
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

function extractCharacterFrames(
  result: RealModelTestGenerationResult,
  pixels: Buffer,
  width: number,
  height: number
): CharacterFrameSnapshot[] {
  const ranges: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];

  return FRAME_STAGES.map((stage, index) => {
    const [bandStart, bandEnd] = ranges[index];
    const subjectZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.3,
      0.7,
      0.35,
      0.65
    );
    const faceZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.38,
      0.62,
      0.4,
      0.58
    );
    const hairZone = zoneAverageInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.35,
      0.65,
      0.08,
      0.28
    );
    const faceZoneVariance = zoneVarianceInBand(
      pixels,
      width,
      height,
      bandStart,
      bandEnd,
      0.38,
      0.62,
      0.4,
      0.58
    );
    const paletteSpread = zoneVarianceInBand(
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
    const hairstyleRatio =
      colorDistance(hairZone, faceZone) / Math.max(1, colorDistance(subjectZone, faceZone));

    return {
      frame_index: index,
      stage,
      subject_zone_rgb: subjectZone,
      face_zone_rgb: faceZone,
      hair_zone_rgb: hairZone,
      face_zone_variance: faceZoneVariance,
      palette_spread: paletteSpread,
      hairstyle_ratio: hairstyleRatio,
      character_signature: characterSignature(subjectZone),
    };
  });
}

function computeCharacterDriftMetrics(
  frames: CharacterFrameSnapshot[],
  result: RealModelTestGenerationResult,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): MultiFrameCharacterDriftMetrics {
  const characterGaps: number[] = [];
  const hairstyleGaps: number[] = [];
  const paletteValues = frames.map((frame) => frame.palette_spread);

  for (let index = 0; index < frames.length - 1; index += 1) {
    characterGaps.push(
      colorDistance(frames[index].subject_zone_rgb, frames[index + 1].subject_zone_rgb) / 255
    );
    hairstyleGaps.push(
      Math.abs(frames[index].hairstyle_ratio - frames[index + 1].hairstyle_ratio)
    );
  }

  const maxAdjacentCharacterGap = Math.max(...characterGaps, 0);
  const openToResolveCharacterSpan =
    colorDistance(frames[0].subject_zone_rgb, frames[3].subject_zone_rgb) / 255;
  const maxAdjacentHairstyleGap = Math.max(...hairstyleGaps, 0);
  const paletteVariance =
    paletteValues.length === 0 ? 1 : Math.max(...paletteValues) - Math.min(...paletteValues);

  const expectedDnaId = `cinematic_dna_${sourceId.toLowerCase()}_v1`;
  const dnaMismatchScore =
    result.dna_binding.cinematic_dna_id === expectedDnaId &&
    result.traceability.cinematic_dna_id === expectedDnaId
      ? 0
      : 1;

  const identityScore = clamp01(1 - maxAdjacentCharacterGap / MAX_CROSS_FRAME_CHARACTER_DRIFT);
  const faceScore = clamp01(
    frames.every((frame) => frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE) ? 1 : 0.4
  );
  const hairScore = clamp01(1 - maxAdjacentHairstyleGap / MAX_HAIRSTYLE_FRAME_DRIFT);
  const paletteScore = clamp01(1 - paletteVariance / MIN_PALETTE_SPREAD);
  const dnaScore = clamp01(1 - dnaMismatchScore);
  const crossFrameCharacterScore = clamp01(
    identityScore * 0.28 + faceScore * 0.24 + hairScore * 0.2 + paletteScore * 0.14 + dnaScore * 0.14
  );

  return {
    max_adjacent_character_gap: maxAdjacentCharacterGap,
    open_to_resolve_character_span: openToResolveCharacterSpan,
    max_adjacent_hairstyle_gap: maxAdjacentHairstyleGap,
    palette_variance: paletteVariance,
    dna_mismatch_score: dnaMismatchScore,
    cross_frame_character_score: crossFrameCharacterScore,
  };
}

function hasCharacterAdapters(result: RealModelTestGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('scene_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('emotion_adapter'))
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

function auditSourceMultiFrameCharacter(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceMultiFrameCharacterDriftAudit {
  if (!result) {
    return {
      source_id: sourceId,
      same_character_identity: 'FAIL',
      facial_structure_persistence: 'FAIL',
      hairstyle_persistence: 'FAIL',
      color_palette_persistence: 'FAIL',
      dna_persistence: 'FAIL',
      cross_frame_character_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      hairstyle_drift: true,
      dna_mismatch: true,
      character_frames: [],
      drift_metrics: null,
      source_multi_frame_character_validated: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, result.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_id: sourceId,
      same_character_identity: 'FAIL',
      facial_structure_persistence: 'FAIL',
      hairstyle_persistence: 'FAIL',
      color_palette_persistence: 'FAIL',
      dna_persistence: 'FAIL',
      cross_frame_character_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      hairstyle_drift: true,
      dna_mismatch: true,
      character_frames: [],
      drift_metrics: null,
      source_multi_frame_character_validated: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_id: sourceId,
      same_character_identity: 'FAIL',
      facial_structure_persistence: 'FAIL',
      hairstyle_persistence: 'FAIL',
      color_palette_persistence: 'FAIL',
      dna_persistence: 'FAIL',
      cross_frame_character_consistency: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      hairstyle_drift: true,
      dna_mismatch: true,
      character_frames: [],
      drift_metrics: null,
      source_multi_frame_character_validated: 'FAIL',
    };
  }

  const frames = extractCharacterFrames(result, decoded.pixels, decoded.width, decoded.height);
  const metrics = computeCharacterDriftMetrics(frames, result, sourceId);
  const palette = MOVIE_FRAME_PALETTES[sourceId];
  const expectedDnaId = `cinematic_dna_${sourceId.toLowerCase()}_v1`;

  const identityDrifts = frames.map(
    (frame) => colorDistance(frame.subject_zone_rgb, frames[0].subject_zone_rgb) / 255
  );

  const sameCharacterIdentity =
    identityDrifts.every((drift) => drift <= MAX_CROSS_FRAME_CHARACTER_DRIFT) &&
    metrics.open_to_resolve_character_span <= MAX_CROSS_FRAME_CHARACTER_DRIFT * 1.15 &&
    result.dna_binding.cinematic_dna_id === expectedDnaId
      ? 'PASS'
      : 'FAIL';

  const facialStructurePersistence =
    frames.every((frame) => frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE) &&
    metrics.max_adjacent_character_gap <= MAX_CROSS_FRAME_CHARACTER_DRIFT
      ? 'PASS'
      : 'FAIL';

  const hairstylePersistence =
    frames.every(
      (frame) =>
        colorDistance(frame.hair_zone_rgb, frame.face_zone_rgb) <= 96 &&
        colorDistance(frame.hair_zone_rgb, frame.subject_zone_rgb) <= 112
    ) && metrics.max_adjacent_hairstyle_gap <= MAX_HAIRSTYLE_FRAME_DRIFT
      ? 'PASS'
      : 'FAIL';

  const centerX = Math.floor(decoded.width / 2);
  const centerY = Math.floor(decoded.height / 2);
  const expectedCenter = expectedSeedPixel(result, centerX, centerY);
  const dnaAnchoredSubject: Rgb = [
    Math.round(expectedCenter[0] * 0.58 + palette.subject[0] * 0.42),
    Math.round(expectedCenter[1] * 0.58 + palette.subject[1] * 0.42),
    Math.round(expectedCenter[2] * 0.58 + palette.subject[2] * 0.42),
  ];
  const paletteDrifts = frames.map(
    (frame) => colorDistance(frame.subject_zone_rgb, dnaAnchoredSubject) / 255
  );
  const colorPalettePersistence =
    frames.every((frame) => frame.palette_spread >= MIN_PALETTE_SPREAD) &&
    paletteDrifts.every((drift) => drift <= MAX_PALETTE_DRIFT) &&
    metrics.palette_variance <= MIN_PALETTE_SPREAD * 2
      ? 'PASS'
      : 'FAIL';

  const dnaPersistence =
    result.dna_binding.binding_preserved === true &&
    result.traceability.cinematic_dna_id === expectedDnaId &&
    metrics.dna_mismatch_score <= MAX_DNA_MISMATCH_SCORE &&
    hasCharacterAdapters(result)
      ? 'PASS'
      : 'FAIL';

  const crossFrameCharacterConsistency =
    metrics.max_adjacent_character_gap <= MAX_CROSS_FRAME_CHARACTER_DRIFT &&
    metrics.cross_frame_character_score >= MIN_CROSS_FRAME_CHARACTER_SCORE
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    result.traceability.adapter_ids.length === 6 &&
    hasCharacterAdapters(result)
      ? 'PASS'
      : 'FAIL';

  const characterDrift =
    sameCharacterIdentity === 'FAIL' ||
    metrics.open_to_resolve_character_span > MAX_CROSS_FRAME_CHARACTER_DRIFT * 1.15;
  const identityLoss = sameCharacterIdentity === 'FAIL' || dnaPersistence === 'FAIL';
  const hairstyleDrift =
    hairstylePersistence === 'FAIL' ||
    metrics.max_adjacent_hairstyle_gap > MAX_HAIRSTYLE_FRAME_DRIFT;
  const dnaMismatch =
    dnaPersistence === 'FAIL' || metrics.dna_mismatch_score > MAX_DNA_MISMATCH_SCORE;

  const checks: ValidationStatus[] = [
    sameCharacterIdentity,
    facialStructurePersistence,
    hairstylePersistence,
    colorPalettePersistence,
    dnaPersistence,
    crossFrameCharacterConsistency,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    same_character_identity: sameCharacterIdentity,
    facial_structure_persistence: facialStructurePersistence,
    hairstyle_persistence: hairstylePersistence,
    color_palette_persistence: colorPalettePersistence,
    dna_persistence: dnaPersistence,
    cross_frame_character_consistency: crossFrameCharacterConsistency,
    traceability_preserved: traceabilityPreserved,
    character_drift: characterDrift,
    identity_loss: identityLoss,
    hairstyle_drift: hairstyleDrift,
    dna_mismatch: dnaMismatch,
    character_frames: frames,
    drift_metrics: metrics,
    source_multi_frame_character_validated:
      checks.every((status) => status === 'PASS') &&
      !characterDrift &&
      !identityLoss &&
      !hairstyleDrift &&
      !dnaMismatch
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceMultiFrameCharacterDriftAudit[],
  field: keyof Omit<
    SourceMultiFrameCharacterDriftAudit,
    | 'source_id'
    | 'character_drift'
    | 'identity_loss'
    | 'hairstyle_drift'
    | 'dna_mismatch'
    | 'character_frames'
    | 'drift_metrics'
    | 'source_multi_frame_character_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealMultiFrameCharacterDriftValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Multi-Frame Character Drift Validation',
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
    `| same_character_identity | ${report.same_character_identity} |`,
    `| facial_structure_persistence | ${report.facial_structure_persistence} |`,
    `| hairstyle_persistence | ${report.hairstyle_persistence} |`,
    `| color_palette_persistence | ${report.color_palette_persistence} |`,
    `| dna_persistence | ${report.dna_persistence} |`,
    `| cross_frame_character_consistency | ${report.cross_frame_character_consistency} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| multi_frame_character_consistency | ${report.multi_frame_character_consistency} |`,
    `| character_drift | ${report.character_drift} |`,
    `| identity_loss | ${report.identity_loss} |`,
    `| hairstyle_drift | ${report.hairstyle_drift} |`,
    `| dna_mismatch | ${report.dna_mismatch} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- same_character_identity: ${audit.same_character_identity}`,
      `- facial_structure_persistence: ${audit.facial_structure_persistence}`,
      `- hairstyle_persistence: ${audit.hairstyle_persistence}`,
      `- color_palette_persistence: ${audit.color_palette_persistence}`,
      `- dna_persistence: ${audit.dna_persistence}`,
      `- cross_frame_character_consistency: ${audit.cross_frame_character_consistency}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- character_drift: ${audit.character_drift}`,
      `- identity_loss: ${audit.identity_loss}`,
      `- hairstyle_drift: ${audit.hairstyle_drift}`,
      `- dna_mismatch: ${audit.dna_mismatch}`,
      `- frames: ${audit.character_frames.length}`,
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
  issues: RealMultiFrameCharacterDriftValidationIssue[],
  sourceAudits: SourceMultiFrameCharacterDriftAudit[] = []
): MovieAnalysisRealMultiFrameCharacterDriftValidationReport {
  const report: MovieAnalysisRealMultiFrameCharacterDriftValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-character-drift-validation-report-v1',
    phase: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE,
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
    real_character_consistency_validation_report_path: REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_multi_frame_location_drift_validation_report_path:
      REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    multi_frame_character_dir: MULTI_FRAME_CHARACTER_DIR,
    multi_frame_character_manifest_path: MULTI_FRAME_CHARACTER_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    same_character_identity: 'FAIL',
    facial_structure_persistence: 'FAIL',
    hairstyle_persistence: 'FAIL',
    color_palette_persistence: 'FAIL',
    dna_persistence: 'FAIL',
    cross_frame_character_consistency: 'FAIL',
    traceability_preserved: 'FAIL',
    multi_frame_character_consistency: 'FAIL',
    character_drift: true,
    identity_loss: true,
    hairstyle_drift: true,
    dna_mismatch: true,
    real_multi_frame_character_drift_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealMultiFrameCharacterDriftValidation(
  projectRoot?: string
): MovieAnalysisRealMultiFrameCharacterDriftValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealMultiFrameCharacterDriftValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const characterConsistencyReport = loadUpstreamReport(
    root,
    REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  if (!characterConsistencyReport) {
    issues.push({
      code: 'REAL_CHARACTER_CONSISTENCY_REPORT_MISSING',
      message: `Missing ${REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    characterConsistencyReport.final_verdict !== REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_003_NOT_PASS',
      message: `L2F-003 must have ${REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    characterConsistencyReport.certification_status !==
    REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_003_NOT_VALIDATED',
      message: `L2F-003 status must be ${REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const locationDriftReport = loadUpstreamReport(
    root,
    REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH
  );
  if (!locationDriftReport) {
    issues.push({
      code: 'REAL_MULTI_FRAME_LOCATION_DRIFT_REPORT_MISSING',
      message: `Missing ${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else if (
    locationDriftReport.final_verdict !== REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_005_NOT_PASS',
      message: `L2F-005 must have ${REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  } else if (
    locationDriftReport.certification_status !==
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
    const audit = auditSourceMultiFrameCharacter(result, root, sourceId);
    if (audit.source_multi_frame_character_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_MULTI_FRAME_CHARACTER_FAIL',
        message: `Multi-frame character drift validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.character_drift) {
      issues.push({
        code: 'CHARACTER_DRIFT',
        message: `Character drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.identity_loss) {
      issues.push({
        code: 'IDENTITY_LOSS',
        message: `Character identity loss detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.hairstyle_drift) {
      issues.push({
        code: 'HAIRSTYLE_DRIFT',
        message: `Hairstyle drift detected across frames for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.dna_mismatch) {
      issues.push({
        code: 'DNA_MISMATCH',
        message: `DNA mismatch detected for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: MultiFrameCharacterManifestEntry[] = sourceAudits.map((audit) => ({
    source_id: audit.source_id,
    cinematic_dna_id: `cinematic_dna_${audit.source_id.toLowerCase()}_v1`,
    frame_count: FRAMES_PER_SOURCE,
    frames: audit.character_frames,
  }));

  fs.mkdirSync(path.join(root, MULTI_FRAME_CHARACTER_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, MULTI_FRAME_CHARACTER_DIR, `${entry.source_id}-multi-frame-character.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const multiFrameManifest: MovieAnalysisRealMultiFrameCharacterManifest = {
    manifest_id: 'movie-analysis-real-multi-frame-character-manifest-v1',
    phase: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE,
    generated_at: timestamp,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, MULTI_FRAME_CHARACTER_MANIFEST_PATH),
    `${JSON.stringify(multiFrameManifest, null, 2)}\n`,
    'utf8'
  );

  const sameCharacterIdentity = aggregateStatus(sourceAudits, 'same_character_identity');
  const facialStructurePersistence = aggregateStatus(
    sourceAudits,
    'facial_structure_persistence'
  );
  const hairstylePersistence = aggregateStatus(sourceAudits, 'hairstyle_persistence');
  const colorPalettePersistence = aggregateStatus(sourceAudits, 'color_palette_persistence');
  const dnaPersistence = aggregateStatus(sourceAudits, 'dna_persistence');
  const crossFrameCharacterConsistency = aggregateStatus(
    sourceAudits,
    'cross_frame_character_consistency'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const characterDrift = sourceAudits.some((audit) => audit.character_drift);
  const identityLoss = sourceAudits.some((audit) => audit.identity_loss);
  const hairstyleDrift = sourceAudits.some((audit) => audit.hairstyle_drift);
  const dnaMismatch = sourceAudits.some((audit) => audit.dna_mismatch);

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
    sameCharacterIdentity,
    facialStructurePersistence,
    hairstylePersistence,
    colorPalettePersistence,
    dnaPersistence,
    crossFrameCharacterConsistency,
    traceabilityPreserved,
  ];

  const multiFrameCharacterConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !characterDrift &&
    !identityLoss &&
    !hairstyleDrift &&
    !dnaMismatch &&
    sourceAudits.every((audit) => audit.source_multi_frame_character_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (characterDrift || identityLoss || hairstyleDrift || dnaMismatch) {
    issues.push({
      code: 'MULTI_FRAME_CHARACTER_BLOCK',
      message: 'Multi-frame character block triggered',
      severity: 'error',
    });
  }
  if (multiFrameCharacterConsistency === 'FAIL') {
    issues.push({
      code: 'MULTI_FRAME_CHARACTER_CONSISTENCY_FAIL',
      message: 'Multi-frame character consistency validation failed',
      severity: 'error',
    });
  }

  const realMultiFrameCharacterDriftValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_MULTI_FRAME_COUNT &&
    multiFrameCharacterConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realMultiFrameCharacterDriftValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_MULTI_FRAME_CHARACTER_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_MULTI_FRAME_CHARACTER_NOT_VALIDATED',
      message: 'Real multi-frame character drift is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealMultiFrameCharacterDriftValidationReport = {
    report_id: 'movie-analysis-real-multi-frame-character-drift-validation-report-v1',
    phase: REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PHASE,
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
    real_character_consistency_validation_report_path: REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH,
    real_multi_frame_location_drift_validation_report_path:
      REAL_MULTI_FRAME_LOCATION_DRIFT_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    multi_frame_location_manifest_path: MULTI_FRAME_LOCATION_MANIFEST_PATH,
    multi_frame_character_dir: MULTI_FRAME_CHARACTER_DIR,
    multi_frame_character_manifest_path: MULTI_FRAME_CHARACTER_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    frame_count: frameCount,
    same_character_identity: sameCharacterIdentity,
    facial_structure_persistence: facialStructurePersistence,
    hairstyle_persistence: hairstylePersistence,
    color_palette_persistence: colorPalettePersistence,
    dna_persistence: dnaPersistence,
    cross_frame_character_consistency: crossFrameCharacterConsistency,
    traceability_preserved: traceabilityPreserved,
    multi_frame_character_consistency: multiFrameCharacterConsistency,
    character_drift: characterDrift,
    identity_loss: identityLoss,
    hairstyle_drift: hairstyleDrift,
    dna_mismatch: dnaMismatch,
    real_multi_frame_character_drift_validation_ready: realMultiFrameCharacterDriftValidationReady,
    certification_status: pass ? REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_PASS_VERDICT
      : REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_MULTI_FRAME_CHARACTER_DRIFT_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
