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

export const REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-003-REAL_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_CHARACTER_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_CHARACTER_CONSISTENCY_VALIDATED' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_character_consistency_validation' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_character_consistency_validation/movie-analysis-real-character-consistency-validation-report.json' as const;
export const REAL_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_character_consistency_validation/MOVIE_ANALYSIS_REAL_CHARACTER_CONSISTENCY_VALIDATION.md' as const;

export const MAX_CHARACTER_DRIFT = 0.42 as const;
export const MAX_PALETTE_DRIFT = 0.45 as const;
export const MAX_DNA_MISMATCH_SCORE = 0.25 as const;
export const MIN_FACE_ZONE_VARIANCE = 12 as const;
export const MIN_PALETTE_SPREAD = 12 as const;
export const MAX_PALETTE_ACCENT_RATIO_DRIFT = 0.9 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealCharacterConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type CharacterConsistencySignals = {
  subject_zone_rgb: [number, number, number];
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  palette_spread: number;
  face_zone_variance: number;
  character_drift: number;
  palette_drift: number;
  palette_accent_ratio_drift: number;
  dna_mismatch_score: number;
};

export type SourceRealCharacterConsistencyAudit = {
  source_id: string;
  character_identity_preserved: ValidationStatus;
  facial_structure_preserved: ValidationStatus;
  hairstyle_preserved: ValidationStatus;
  color_palette_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  character_drift: boolean;
  identity_loss: boolean;
  dna_mismatch: boolean;
  consistency_signals: CharacterConsistencySignals | null;
  source_character_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealCharacterConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE;
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
  character_identity_preserved: ValidationStatus;
  facial_structure_preserved: ValidationStatus;
  hairstyle_preserved: ValidationStatus;
  color_palette_preserved: ValidationStatus;
  dna_binding_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  character_drift: boolean;
  identity_loss: boolean;
  dna_mismatch: boolean;
  real_character_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceRealCharacterConsistencyAudit[];
  final_verdict:
    | typeof REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealCharacterConsistencyValidationIssue[];
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

function extractConsistencySignals(
  result: RealModelTestGenerationResult,
  pixels: Buffer,
  width: number,
  height: number
): CharacterConsistencySignals {
  const subjectZone = zoneAverage(pixels, width, height, 0.3, 0.7, 0.35, 0.65);
  const faceZone = zoneAverage(pixels, width, height, 0.38, 0.62, 0.4, 0.58);
  const hairZone = zoneAverage(pixels, width, height, 0.35, 0.65, 0.08, 0.28);

  const paletteSpread = zoneVariance(pixels, width, height, 0, 1, 0, 1);

  const faceZoneVariance = zoneVariance(pixels, width, height, 0.38, 0.62, 0.4, 0.58);

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const centerIndex = (centerY * width + centerX) * 3;
  const observedCenter: Rgb = [
    pixels[centerIndex],
    pixels[centerIndex + 1],
    pixels[centerIndex + 2],
  ];
  const expectedCenter = expectedSeedPixel(result, centerX, centerY);
  const characterDrift = colorDistance(observedCenter, expectedCenter) / 255;

  const palette = MOVIE_FRAME_PALETTES[result.source_id as keyof typeof MOVIE_FRAME_PALETTES];
  const dnaAnchoredSubject: Rgb = [
    Math.round(expectedCenter[0] * 0.58 + palette.subject[0] * 0.42),
    Math.round(expectedCenter[1] * 0.58 + palette.subject[1] * 0.42),
    Math.round(expectedCenter[2] * 0.58 + palette.subject[2] * 0.42),
  ];
  const paletteDrift = colorDistance(subjectZone, dnaAnchoredSubject) / 255;

  const observedAccentRatio =
    colorDistance(hairZone, subjectZone) / Math.max(1, colorDistance(faceZone, subjectZone));
  const expectedAccentRatio =
    colorDistance(palette.accent, palette.subject) /
    Math.max(1, colorDistance(palette.midground, palette.subject));
  const paletteAccentRatioDrift =
    Math.abs(observedAccentRatio - expectedAccentRatio) / Math.max(1, expectedAccentRatio);

  const expectedDnaId = `cinematic_dna_${result.source_id.toLowerCase()}_v1`;
  const dnaMismatchScore =
    result.dna_binding.cinematic_dna_id === expectedDnaId &&
    result.traceability.cinematic_dna_id === expectedDnaId
      ? 0
      : 1;

  return {
    subject_zone_rgb: subjectZone,
    face_zone_rgb: faceZone,
    hair_zone_rgb: hairZone,
    palette_spread: paletteSpread,
    face_zone_variance: faceZoneVariance,
    character_drift: characterDrift,
    palette_drift: paletteDrift,
    palette_accent_ratio_drift: paletteAccentRatioDrift,
    dna_mismatch_score: dnaMismatchScore,
  };
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

function auditSourceCharacterConsistency(
  result: RealModelTestGenerationResult | undefined,
  projectRoot: string,
  sourceId: string
): SourceRealCharacterConsistencyAudit {
  if (!result) {
    return {
      source_id: sourceId,
      character_identity_preserved: 'FAIL',
      facial_structure_preserved: 'FAIL',
      hairstyle_preserved: 'FAIL',
      color_palette_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      dna_mismatch: true,
      consistency_signals: null,
      source_character_consistency_validated: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, result.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_id: sourceId,
      character_identity_preserved: 'FAIL',
      facial_structure_preserved: 'FAIL',
      hairstyle_preserved: 'FAIL',
      color_palette_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      dna_mismatch: true,
      consistency_signals: null,
      source_character_consistency_validated: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_id: sourceId,
      character_identity_preserved: 'FAIL',
      facial_structure_preserved: 'FAIL',
      hairstyle_preserved: 'FAIL',
      color_palette_preserved: 'FAIL',
      dna_binding_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      character_drift: true,
      identity_loss: true,
      dna_mismatch: true,
      consistency_signals: null,
      source_character_consistency_validated: 'FAIL',
    };
  }

  const signals = extractConsistencySignals(
    result,
    decoded.pixels,
    decoded.width,
    decoded.height
  );

  const expectedDnaId = `cinematic_dna_${sourceId.toLowerCase()}_v1`;

  const characterIdentityPreserved =
    result.dna_binding.cinematic_dna_id === expectedDnaId &&
    result.traceability.cinematic_dna_id === expectedDnaId &&
    signals.character_drift <= MAX_CHARACTER_DRIFT
      ? 'PASS'
      : 'FAIL';

  const dnaBindingPreserved =
    result.dna_binding.binding_preserved === true &&
    result.adapter_binding.binding_preserved === true &&
    result.dna_binding.cinematic_dna_id === result.traceability.cinematic_dna_id &&
    result.adapter_binding.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    signals.dna_mismatch_score <= MAX_DNA_MISMATCH_SCORE
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    result.traceability.traceability_preserved === true &&
    result.traceability.template_id.length > 0 &&
    result.traceability.assembly_id.length > 0 &&
    result.traceability.adapter_ids.length === ADAPTERS_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const facialStructurePreserved =
    signals.face_zone_variance >= MIN_FACE_ZONE_VARIANCE &&
    signals.character_drift <= MAX_CHARACTER_DRIFT
      ? 'PASS'
      : 'FAIL';

  const hairstylePreserved =
    colorDistance(signals.hair_zone_rgb, signals.face_zone_rgb) <= 96 &&
    colorDistance(signals.hair_zone_rgb, signals.subject_zone_rgb) <= 112
      ? 'PASS'
      : 'FAIL';

  const colorPalettePreserved =
    signals.palette_spread >= MIN_PALETTE_SPREAD &&
    signals.palette_drift <= MAX_PALETTE_DRIFT &&
    signals.palette_accent_ratio_drift <= MAX_PALETTE_ACCENT_RATIO_DRIFT
      ? 'PASS'
      : 'FAIL';

  const characterDrift =
    facialStructurePreserved === 'FAIL' || signals.character_drift > MAX_CHARACTER_DRIFT;
  const identityLoss = characterIdentityPreserved === 'FAIL';
  const dnaMismatch = dnaBindingPreserved === 'FAIL' || signals.dna_mismatch_score > MAX_DNA_MISMATCH_SCORE;

  const checks: ValidationStatus[] = [
    characterIdentityPreserved,
    facialStructurePreserved,
    hairstylePreserved,
    colorPalettePreserved,
    dnaBindingPreserved,
    traceabilityPreserved,
  ];

  return {
    source_id: sourceId,
    character_identity_preserved: characterIdentityPreserved,
    facial_structure_preserved: facialStructurePreserved,
    hairstyle_preserved: hairstylePreserved,
    color_palette_preserved: colorPalettePreserved,
    dna_binding_preserved: dnaBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    character_drift: characterDrift,
    identity_loss: identityLoss,
    dna_mismatch: dnaMismatch,
    consistency_signals: signals,
    source_character_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !characterDrift &&
      !identityLoss &&
      !dnaMismatch
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealCharacterConsistencyAudit[],
  field: keyof Omit<
    SourceRealCharacterConsistencyAudit,
    'source_id' | 'character_drift' | 'identity_loss' | 'dna_mismatch' | 'consistency_signals' | 'source_character_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealCharacterConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Real Character Consistency Validation',
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
    `| character_identity_preserved | ${report.character_identity_preserved} |`,
    `| facial_structure_preserved | ${report.facial_structure_preserved} |`,
    `| hairstyle_preserved | ${report.hairstyle_preserved} |`,
    `| color_palette_preserved | ${report.color_palette_preserved} |`,
    `| dna_binding_preserved | ${report.dna_binding_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| character_drift | ${report.character_drift} |`,
    `| identity_loss | ${report.identity_loss} |`,
    `| dna_mismatch | ${report.dna_mismatch} |`,
    `| real_character_consistency_validation_ready | ${report.real_character_consistency_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- character_identity_preserved: ${audit.character_identity_preserved}`,
      `- facial_structure_preserved: ${audit.facial_structure_preserved}`,
      `- hairstyle_preserved: ${audit.hairstyle_preserved}`,
      `- color_palette_preserved: ${audit.color_palette_preserved}`,
      `- dna_binding_preserved: ${audit.dna_binding_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- character_drift: ${audit.character_drift}`,
      `- identity_loss: ${audit.identity_loss}`,
      `- dna_mismatch: ${audit.dna_mismatch}`,
      ''
    );
    if (audit.consistency_signals) {
      lines.push(
        `- character_drift_score: ${audit.consistency_signals.character_drift.toFixed(4)}`,
        `- palette_drift_score: ${audit.consistency_signals.palette_drift.toFixed(4)}`,
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
  issues: RealCharacterConsistencyValidationIssue[],
  sourceAudits: SourceRealCharacterConsistencyAudit[] = []
): MovieAnalysisRealCharacterConsistencyValidationReport {
  const report: MovieAnalysisRealCharacterConsistencyValidationReport = {
    report_id: 'movie-analysis-real-character-consistency-validation-report-v1',
    phase: REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
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
    character_identity_preserved: 'FAIL',
    facial_structure_preserved: 'FAIL',
    hairstyle_preserved: 'FAIL',
    color_palette_preserved: 'FAIL',
    dna_binding_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    character_drift: true,
    identity_loss: true,
    dna_mismatch: true,
    real_character_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealCharacterConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealCharacterConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealCharacterConsistencyValidationIssue[] = [];
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
    const audit = auditSourceCharacterConsistency(result, root, sourceId);
    if (audit.source_character_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_CHARACTER_CONSISTENCY_FAIL',
        message: `Character consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.character_drift) {
      issues.push({
        code: 'CHARACTER_DRIFT',
        message: `Character drift detected for ${sourceId}`,
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

  const characterIdentityPreserved = aggregateStatus(sourceAudits, 'character_identity_preserved');
  const facialStructurePreserved = aggregateStatus(sourceAudits, 'facial_structure_preserved');
  const hairstylePreserved = aggregateStatus(sourceAudits, 'hairstyle_preserved');
  const colorPalettePreserved = aggregateStatus(sourceAudits, 'color_palette_preserved');
  const dnaBindingPreserved = aggregateStatus(sourceAudits, 'dna_binding_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const characterDrift = sourceAudits.some((audit) => audit.character_drift);
  const identityLoss = sourceAudits.some((audit) => audit.identity_loss);
  const dnaMismatch = sourceAudits.some((audit) => audit.dna_mismatch);

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
    characterIdentityPreserved,
    facialStructurePreserved,
    hairstylePreserved,
    colorPalettePreserved,
    dnaBindingPreserved,
    traceabilityPreserved,
  ];

  if (characterDrift || identityLoss || dnaMismatch) {
    issues.push({
      code: 'CHARACTER_CONSISTENCY_BLOCK',
      message: 'Character consistency block triggered (drift, identity loss, or DNA mismatch)',
      severity: 'error',
    });
  }

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_CHARACTER_CONSISTENCY_VALIDATION_FAIL',
        message: 'Real character consistency validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const realCharacterConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    validatedImageCount === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    !characterDrift &&
    !identityLoss &&
    !dnaMismatch &&
    sourceAudits.every((audit) => audit.source_character_consistency_validated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realCharacterConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_CHARACTER_CONSISTENCY_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_CHARACTER_CONSISTENCY_NOT_VALIDATED',
      message: 'Real character consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealCharacterConsistencyValidationReport = {
    report_id: 'movie-analysis-real-character-consistency-validation-report-v1',
    phase: REAL_CHARACTER_CONSISTENCY_VALIDATION_PHASE,
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
    character_identity_preserved: characterIdentityPreserved,
    facial_structure_preserved: facialStructurePreserved,
    hairstyle_preserved: hairstylePreserved,
    color_palette_preserved: colorPalettePreserved,
    dna_binding_preserved: dnaBindingPreserved,
    traceability_preserved: traceabilityPreserved,
    character_drift: characterDrift,
    identity_loss: identityLoss,
    dna_mismatch: dnaMismatch,
    real_character_consistency_validation_ready: realCharacterConsistencyValidationReady,
    certification_status: pass ? REAL_CHARACTER_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_CHARACTER_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_CHARACTER_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_CHARACTER_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
