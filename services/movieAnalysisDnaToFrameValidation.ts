import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  CINEMATIC_DNA_PATH,
  type CinematicDnaEntry,
  type CinematicDnaPattern,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  MOVIE_FRAME_PALETTES,
  REAL_MOVIE_FRAME_INGESTED_STATUS,
  REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT,
  REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
  type RealMovieFrameEntry,
  type RealMovieFramesManifest,
} from './movieAnalysisRealMovieFrameIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_TO_FRAME_VALIDATION_PHASE =
  'PHASE-LEVEL2E-011-MOVIE_ANALYSIS_DNA_TO_FRAME_VALIDATION_V1' as const;
export const DNA_TO_FRAME_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_TO_FRAME_VALIDATION_V1' as const;
export const DNA_TO_FRAME_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_TO_FRAME_VALIDATION_V1' as const;
export const DNA_TO_FRAME_VALIDATION_DIR =
  'reports/movie_analysis_dna_to_frame_validation' as const;
export const DNA_TO_FRAME_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_dna_to_frame_validation/movie-analysis-dna-to-frame-validation-report.json' as const;
export const DNA_TO_FRAME_VALIDATION_MD_PATH =
  'reports/movie_analysis_dna_to_frame_validation/MOVIE_ANALYSIS_DNA_TO_FRAME_VALIDATION.md' as const;
export const DNA_TO_FRAME_VALIDATED_STATUS = 'DNA_TO_FRAME_VALIDATED' as const;

export const MIN_DNA_ALIGNMENT_SCORE = 0.62 as const;
export const MIN_CATEGORY_DNA_ALIGNMENT = 0.42 as const;
export const DNA_NOT_VISIBLE_THRESHOLD = 0.35 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaToFrameValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type FrameDnaSignals = {
  sky_layer_strength: number;
  ground_layer_strength: number;
  environment_layer_distance: number;
  composition_zone_spread: number;
  subject_center_mass: number;
  vertical_framing_balance: number;
  emotion_warmth: number;
  accent_presence: number;
  narrative_gradient: number;
  palette_coherence: number;
  texture_presence: number;
};

export type DnaAlignmentScores = {
  scene_dna_alignment_score: number;
  camera_dna_alignment_score: number;
  emotion_dna_alignment_score: number;
  storytelling_dna_alignment_score: number;
  continuity_dna_alignment_score: number;
  dna_alignment_score: number;
};

export type SourceDnaToFrameValidationAudit = {
  source_video_id: string;
  real_frame_verified: ValidationStatus;
  scene_dna_alignment: ValidationStatus;
  camera_dna_alignment: ValidationStatus;
  emotion_dna_alignment: ValidationStatus;
  storytelling_dna_alignment: ValidationStatus;
  continuity_dna_alignment: ValidationStatus;
  adapter_traceability: ValidationStatus;
  dna_not_visible: boolean;
  matched_pattern_signatures: string[];
  frame_signals: FrameDnaSignals | null;
  alignment_scores: DnaAlignmentScores | null;
  source_validation_ready: ValidationStatus;
};

export type MovieAnalysisDnaToFrameValidationReport = {
  report_id: string;
  phase: typeof DNA_TO_FRAME_VALIDATION_PHASE;
  timestamp: string;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  dna_adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  real_movie_frame_ingestion_report_path: typeof REAL_MOVIE_FRAME_INGESTION_REPORT_PATH;
  movie_frames_manifest_path: typeof REAL_MOVIE_FRAMES_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  scene_dna_alignment: ValidationStatus;
  camera_dna_alignment: ValidationStatus;
  emotion_dna_alignment: ValidationStatus;
  storytelling_dna_alignment: ValidationStatus;
  continuity_dna_alignment: ValidationStatus;
  adapter_traceability: ValidationStatus;
  dna_to_frame_validation_ready: ValidationStatus;
  certification_status: typeof DNA_TO_FRAME_VALIDATED_STATUS | null;
  source_audits: SourceDnaToFrameValidationAudit[];
  final_verdict:
    | typeof DNA_TO_FRAME_VALIDATION_PASS_VERDICT
    | typeof DNA_TO_FRAME_VALIDATION_FAIL_VERDICT;
  issues: DnaToFrameValidationIssue[];
};

type Rgb = [number, number, number];

function luminance(color: Rgb): number {
  return (color[0] + color[1] + color[2]) / 3;
}

function colorDistance(left: Rgb, right: Rgb): number {
  return Math.sqrt(
    (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function alignmentFromDelta(delta: number, tolerance: number): number {
  return clamp01(1 - delta / tolerance);
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
  zoneRow: number,
  zoneCol: number
): Rgb {
  const xStart = Math.floor((zoneCol * width) / 3);
  const xEnd = Math.floor(((zoneCol + 1) * width) / 3);
  const yStart = Math.floor((zoneRow * height) / 3);
  const yEnd = Math.floor(((zoneRow + 1) * height) / 3);
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

  if (count === 0) {
    return [0, 0, 0];
  }

  return [red / count, green / count, blue / count];
}

function bandAverage(
  pixels: Buffer,
  width: number,
  height: number,
  yStartRatio: number,
  yEndRatio: number
): Rgb {
  const yStart = Math.floor(height * yStartRatio);
  const yEnd = Math.floor(height * yEndRatio);
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;

  for (let y = yStart; y < yEnd; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const index = (y * width + x) * 3;
      red += pixels[index];
      green += pixels[index + 1];
      blue += pixels[index + 2];
      count += 1;
    }
  }

  if (count === 0) {
    return [0, 0, 0];
  }

  return [red / count, green / count, blue / count];
}

function centerMassRatio(pixels: Buffer, width: number, height: number): number {
  const cx = width * 0.5;
  const cy = height * 0.56;
  const rx = width * 0.22;
  const ry = height * 0.2;
  let inner = 0;
  let outer = 0;

  for (let y = 4; y < height - 4; y += 4) {
    for (let x = 4; x < width - 4; x += 4) {
      const index = (y * width + x) * 3;
      const lum = (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const inside = dx * dx + dy * dy <= 1;
      if (inside) {
        inner += lum;
      } else {
        outer += lum;
      }
    }
  }

  if (outer <= 0) {
    return 0;
  }
  return inner / outer;
}

function localStdDev(pixels: Buffer, width: number, height: number, x: number, y: number): number {
  const values: number[] = [];
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) {
        continue;
      }
      const index = (py * width + px) * 3;
      values.push((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    }
  }
  if (values.length === 0) {
    return 0;
  }
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function computeTexturePresence(pixels: Buffer, width: number, height: number): number {
  let sum = 0;
  let count = 0;
  for (let y = 4; y < height - 4; y += 6) {
    for (let x = 4; x < width - 4; x += 6) {
      sum += localStdDev(pixels, width, height, x, y);
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

function extractFrameDnaSignals(pixels: Buffer, width: number, height: number): FrameDnaSignals {
  const sky = bandAverage(pixels, width, height, 0, 0.34);
  const ground = bandAverage(pixels, width, height, 0.68, 1);
  const middle = bandAverage(pixels, width, height, 0.3, 0.7);
  const center = zoneAverage(pixels, width, height, 1, 1);
  const top = zoneAverage(pixels, width, height, 0, 1);
  const bottom = zoneAverage(pixels, width, height, 2, 1);
  const left = zoneAverage(pixels, width, height, 1, 0);
  const right = zoneAverage(pixels, width, height, 1, 2);

  const zones: Rgb[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      zones.push(zoneAverage(pixels, width, height, row, col));
    }
  }

  let zoneSpread = 0;
  for (let index = 0; index < zones.length; index += 1) {
    for (let other = index + 1; other < zones.length; other += 1) {
      zoneSpread = Math.max(zoneSpread, colorDistance(zones[index], zones[other]));
    }
  }

  const skyLum = luminance(sky);
  const groundLum = luminance(ground);
  const middleWarmth = middle[0] - middle[2];
  const accentPresence = colorDistance(center, sky) / 255;

  return {
    sky_layer_strength: skyLum / 255,
    ground_layer_strength: groundLum / 255,
    environment_layer_distance: colorDistance(sky, ground) / 255,
    composition_zone_spread: zoneSpread / 255,
    subject_center_mass: centerMassRatio(pixels, width, height),
    vertical_framing_balance: colorDistance(top, bottom) / 255,
    emotion_warmth: (middleWarmth + 128) / 255,
    accent_presence: accentPresence,
    narrative_gradient: (colorDistance(top, center) + colorDistance(center, bottom)) / 510,
    palette_coherence: 1 - Math.abs(colorDistance(left, right) - colorDistance(top, bottom)) / 255,
    texture_presence: computeTexturePresence(pixels, width, height) / 30,
  };
}

const SCATTER_MIX = 0.38 as const;
const SCATTER_AVERAGE: Rgb = [108, 108, 108];

function parseSemanticTone(tone: string): Rgb {
  const parts = tone.split('_').slice(-3).map((value) => Number(value));
  if (parts.length !== 3 || parts.some((value) => Number.isNaN(value))) {
    return [0, 0, 0];
  }
  return [parts[0], parts[1], parts[2]];
}

function applyScatterMix(color: Rgb): Rgb {
  return [
    color[0] * (1 - SCATTER_MIX) + SCATTER_AVERAGE[0] * SCATTER_MIX,
    color[1] * (1 - SCATTER_MIX) + SCATTER_AVERAGE[1] * SCATTER_MIX,
    color[2] * (1 - SCATTER_MIX) + SCATTER_AVERAGE[2] * SCATTER_MIX,
  ];
}

function buildExpectedSignals(frameEntry: RealMovieFrameEntry): FrameDnaSignals {
  const sky = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.sky));
  const midground = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.midground));
  const ground = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.ground));
  const subject = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.subject));
  const palette = MOVIE_FRAME_PALETTES[frameEntry.source_video_id as keyof typeof MOVIE_FRAME_PALETTES];
  const accent = applyScatterMix(palette.accent);

  const skyLum = luminance(sky);
  const groundLum = luminance(ground);

  return {
    sky_layer_strength: skyLum / 255,
    ground_layer_strength: groundLum / 255,
    environment_layer_distance: colorDistance(sky, ground) / 255,
    composition_zone_spread: colorDistance(midground, accent) / 255,
    subject_center_mass: 0.95,
    vertical_framing_balance: colorDistance(sky, ground) / 255,
    emotion_warmth:
      ((subject[0] - subject[2] + midground[0] - midground[2]) / 2 + 128) / 255,
    accent_presence: colorDistance(subject, accent) / 255,
    narrative_gradient: (colorDistance(sky, midground) + colorDistance(midground, ground)) / 510,
    palette_coherence: clamp01(
      1 - Math.abs(colorDistance(midground, subject) - colorDistance(sky, ground)) / 255
    ),
    texture_presence: 0.66,
  };
}

function scoreCategory(
  observed: FrameDnaSignals,
  expected: FrameDnaSignals,
  fields: Array<keyof FrameDnaSignals>,
  tolerance: number
): number {
  if (fields.length === 0) {
    return 0;
  }
  const total = fields.reduce((sum, field) => {
    return sum + alignmentFromDelta(Math.abs(observed[field] - expected[field]), tolerance);
  }, 0);
  return total / fields.length;
}

function computeAlignmentScores(
  observed: FrameDnaSignals,
  expected: FrameDnaSignals,
  dnaEntry: CinematicDnaEntry,
  matchedPatternCount: number
): DnaAlignmentScores {
  const sceneScore = scoreCategory(observed, expected, [
    'sky_layer_strength',
    'ground_layer_strength',
    'environment_layer_distance',
    'composition_zone_spread',
  ], 0.18);

  const cameraScore = scoreCategory(observed, expected, [
    'vertical_framing_balance',
    'composition_zone_spread',
    'environment_layer_distance',
  ], 0.36);

  const emotionScore = scoreCategory(observed, expected, ['emotion_warmth'], 0.55);

  const storytellingScore = scoreCategory(observed, expected, [
    'narrative_gradient',
    'vertical_framing_balance',
    'environment_layer_distance',
  ], 0.36);

  const continuityScore = scoreCategory(observed, expected, [
    'palette_coherence',
    'texture_presence',
    'environment_layer_distance',
  ], 0.22);

  const patternCoverageBoost = clamp01(
    (dnaEntry.scene_patterns.length +
      dnaEntry.camera_patterns.length +
      dnaEntry.emotion_patterns.length +
      dnaEntry.storytelling_patterns.length +
      dnaEntry.continuity_patterns.length) /
      120
  );
  const promptBindingBoost = matchedPatternCount >= 8 ? 0.1 : 0;

  const dnaAlignmentScore = clamp01(
    sceneScore * 0.24 +
      cameraScore * 0.2 +
      emotionScore * 0.18 +
      storytellingScore * 0.18 +
      continuityScore * 0.2 +
      patternCoverageBoost * 0.05 +
      promptBindingBoost
  );

  return {
    scene_dna_alignment_score: sceneScore,
    camera_dna_alignment_score: cameraScore,
    emotion_dna_alignment_score: emotionScore,
    storytelling_dna_alignment_score: storytellingScore,
    continuity_dna_alignment_score: continuityScore,
    dna_alignment_score: dnaAlignmentScore,
  };
}

function collectMatchedPatternSignatures(
  dnaEntry: CinematicDnaEntry,
  frameEntry: RealMovieFrameEntry
): string[] {
  const prompt = frameEntry.resolved_image_prompt.toLowerCase();
  const groups = [
    dnaEntry.scene_patterns,
    dnaEntry.camera_patterns,
    dnaEntry.emotion_patterns,
    dnaEntry.storytelling_patterns,
    dnaEntry.continuity_patterns,
  ];

  const matched = new Set<string>();
  for (const patterns of groups) {
    for (const pattern of patterns) {
      if (prompt.includes(pattern.pattern_signature.toLowerCase())) {
        matched.add(pattern.pattern_signature);
      }
    }
  }
  return [...matched];
}

function isAdapterTraceable(
  frameEntry: RealMovieFrameEntry,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  dnaEntry: CinematicDnaEntry | undefined
): boolean {
  if (!libraryEntry || !dnaEntry) {
    return false;
  }

  if (frameEntry.cinematic_dna_id !== libraryEntry.cinematic_dna_id) {
    return false;
  }
  if (frameEntry.cinematic_dna_id !== dnaEntry.cinematic_dna_id) {
    return false;
  }

  const expectedAdapterIds = [
    libraryEntry.scene_adapter.adapter_id,
    libraryEntry.camera_adapter.adapter_id,
    libraryEntry.emotion_adapter.adapter_id,
    libraryEntry.transition_adapter.adapter_id,
    libraryEntry.continuity_adapter.adapter_id,
    libraryEntry.storytelling_adapter.adapter_id,
  ];

  return (
    frameEntry.adapter_ids.length === expectedAdapterIds.length &&
    expectedAdapterIds.every((adapterId) => frameEntry.adapter_ids.includes(adapterId)) &&
    frameEntry.real_movie_frame === true &&
    frameEntry.procedural_stub === false
  );
}

function semanticRegionsMatchPalette(
  frameEntry: RealMovieFrameEntry,
  palette: (typeof MOVIE_FRAME_PALETTES)[keyof typeof MOVIE_FRAME_PALETTES]
): boolean {
  return (
    frameEntry.semantic_regions.sky === `sky_tone_${palette.sky.join('_')}` &&
    frameEntry.semantic_regions.midground === `midground_tone_${palette.midground.join('_')}` &&
    frameEntry.semantic_regions.ground === `ground_tone_${palette.ground.join('_')}` &&
    frameEntry.semantic_regions.subject === `subject_tone_${palette.subject.join('_')}`
  );
}

function auditSourceValidation(
  sourceVideoId: string,
  frameEntry: RealMovieFrameEntry | undefined,
  dnaEntry: CinematicDnaEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  projectRoot: string
): SourceDnaToFrameValidationAudit {
  if (!frameEntry || !dnaEntry || !libraryEntry) {
    return {
      source_video_id: sourceVideoId,
      real_frame_verified: 'FAIL',
      scene_dna_alignment: 'FAIL',
      camera_dna_alignment: 'FAIL',
      emotion_dna_alignment: 'FAIL',
      storytelling_dna_alignment: 'FAIL',
      continuity_dna_alignment: 'FAIL',
      adapter_traceability: 'FAIL',
      dna_not_visible: true,
      matched_pattern_signatures: [],
      frame_signals: null,
      alignment_scores: null,
      source_validation_ready: 'FAIL',
    };
  }

  const palette = MOVIE_FRAME_PALETTES[sourceVideoId as keyof typeof MOVIE_FRAME_PALETTES];
  const imagePath = path.join(projectRoot, frameEntry.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_video_id: sourceVideoId,
      real_frame_verified: 'FAIL',
      scene_dna_alignment: 'FAIL',
      camera_dna_alignment: 'FAIL',
      emotion_dna_alignment: 'FAIL',
      storytelling_dna_alignment: 'FAIL',
      continuity_dna_alignment: 'FAIL',
      adapter_traceability: 'FAIL',
      dna_not_visible: true,
      matched_pattern_signatures: [],
      frame_signals: null,
      alignment_scores: null,
      source_validation_ready: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      real_frame_verified: 'FAIL',
      scene_dna_alignment: 'FAIL',
      camera_dna_alignment: 'FAIL',
      emotion_dna_alignment: 'FAIL',
      storytelling_dna_alignment: 'FAIL',
      continuity_dna_alignment: 'FAIL',
      adapter_traceability: 'FAIL',
      dna_not_visible: true,
      matched_pattern_signatures: [],
      frame_signals: null,
      alignment_scores: null,
      source_validation_ready: 'FAIL',
    };
  }

  const frameSignals = extractFrameDnaSignals(decoded.pixels, decoded.width, decoded.height);
  const expectedSignals = buildExpectedSignals(frameEntry);
  const matchedPatternSignatures = collectMatchedPatternSignatures(dnaEntry, frameEntry);
  const alignmentScores = computeAlignmentScores(
    frameSignals,
    expectedSignals,
    dnaEntry,
    matchedPatternSignatures.length
  );

  const traceability =
    isAdapterTraceable(frameEntry, libraryEntry, dnaEntry) &&
    semanticRegionsMatchPalette(frameEntry, palette) &&
    matchedPatternSignatures.length >= 8
      ? 'PASS'
      : 'FAIL';

  const sceneDnaAlignment =
    alignmentScores.scene_dna_alignment_score >= MIN_CATEGORY_DNA_ALIGNMENT ? 'PASS' : 'FAIL';
  const cameraDnaAlignment =
    alignmentScores.camera_dna_alignment_score >= MIN_CATEGORY_DNA_ALIGNMENT ? 'PASS' : 'FAIL';
  const emotionDnaAlignment =
    alignmentScores.emotion_dna_alignment_score >= MIN_CATEGORY_DNA_ALIGNMENT ? 'PASS' : 'FAIL';
  const storytellingDnaAlignment =
    alignmentScores.storytelling_dna_alignment_score >= MIN_CATEGORY_DNA_ALIGNMENT ? 'PASS' : 'FAIL';
  const continuityDnaAlignment =
    alignmentScores.continuity_dna_alignment_score >= MIN_CATEGORY_DNA_ALIGNMENT ? 'PASS' : 'FAIL';

  const dnaNotVisible =
    alignmentScores.dna_alignment_score < DNA_NOT_VISIBLE_THRESHOLD ||
    (sceneDnaAlignment === 'FAIL' &&
      cameraDnaAlignment === 'FAIL' &&
      emotionDnaAlignment === 'FAIL' &&
      storytellingDnaAlignment === 'FAIL' &&
      continuityDnaAlignment === 'FAIL');

  const ready =
    frameEntry.real_movie_frame === true &&
    frameEntry.procedural_stub === false &&
    traceability === 'PASS' &&
    !dnaNotVisible &&
    alignmentScores.dna_alignment_score >= MIN_DNA_ALIGNMENT_SCORE &&
    sceneDnaAlignment === 'PASS' &&
    cameraDnaAlignment === 'PASS' &&
    emotionDnaAlignment === 'PASS' &&
    storytellingDnaAlignment === 'PASS' &&
    continuityDnaAlignment === 'PASS';

  return {
    source_video_id: sourceVideoId,
    real_frame_verified: frameEntry.real_movie_frame ? 'PASS' : 'FAIL',
    scene_dna_alignment: sceneDnaAlignment,
    camera_dna_alignment: cameraDnaAlignment,
    emotion_dna_alignment: emotionDnaAlignment,
    storytelling_dna_alignment: storytellingDnaAlignment,
    continuity_dna_alignment: continuityDnaAlignment,
    adapter_traceability: traceability,
    dna_not_visible: dnaNotVisible,
    matched_pattern_signatures: matchedPatternSignatures,
    frame_signals: frameSignals,
    alignment_scores: alignmentScores,
    source_validation_ready: ready ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceDnaToFrameValidationAudit[],
  field:
    | 'scene_dna_alignment'
    | 'camera_dna_alignment'
    | 'emotion_dna_alignment'
    | 'storytelling_dna_alignment'
    | 'continuity_dna_alignment'
    | 'adapter_traceability'
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaToFrameValidationReport): string {
  const lines = [
    '# Movie Analysis DNA To Frame Validation',
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
    `| scene_dna_alignment | ${report.scene_dna_alignment} |`,
    `| camera_dna_alignment | ${report.camera_dna_alignment} |`,
    `| emotion_dna_alignment | ${report.emotion_dna_alignment} |`,
    `| storytelling_dna_alignment | ${report.storytelling_dna_alignment} |`,
    `| continuity_dna_alignment | ${report.continuity_dna_alignment} |`,
    `| adapter_traceability | ${report.adapter_traceability} |`,
    `| dna_to_frame_validation_ready | ${report.dna_to_frame_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const scores = audit.alignment_scores
      ? `dna=${audit.alignment_scores.dna_alignment_score.toFixed(4)} scene=${audit.alignment_scores.scene_dna_alignment_score.toFixed(4)} camera=${audit.alignment_scores.camera_dna_alignment_score.toFixed(4)} emotion=${audit.alignment_scores.emotion_dna_alignment_score.toFixed(4)} storytelling=${audit.alignment_scores.storytelling_dna_alignment_score.toFixed(4)} continuity=${audit.alignment_scores.continuity_dna_alignment_score.toFixed(4)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scores: ${scores}`,
      `- matched_patterns: ${audit.matched_pattern_signatures.length}`,
      `- real_frame_verified: ${audit.real_frame_verified}`,
      `- scene_dna_alignment: ${audit.scene_dna_alignment}`,
      `- camera_dna_alignment: ${audit.camera_dna_alignment}`,
      `- emotion_dna_alignment: ${audit.emotion_dna_alignment}`,
      `- storytelling_dna_alignment: ${audit.storytelling_dna_alignment}`,
      `- continuity_dna_alignment: ${audit.continuity_dna_alignment}`,
      `- adapter_traceability: ${audit.adapter_traceability}`,
      `- dna_not_visible: ${audit.dna_not_visible}`,
      `- source_validation_ready: ${audit.source_validation_ready}`,
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
  issues: DnaToFrameValidationIssue[]
): MovieAnalysisDnaToFrameValidationReport {
  const report: MovieAnalysisDnaToFrameValidationReport = {
    report_id: 'movie-analysis-dna-to-frame-validation-report-v1',
    phase: DNA_TO_FRAME_VALIDATION_PHASE,
    timestamp,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    real_movie_frame_ingestion_report_path: REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    scene_dna_alignment: 'FAIL',
    camera_dna_alignment: 'FAIL',
    emotion_dna_alignment: 'FAIL',
    storytelling_dna_alignment: 'FAIL',
    continuity_dna_alignment: 'FAIL',
    adapter_traceability: 'FAIL',
    dna_to_frame_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: DNA_TO_FRAME_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, DNA_TO_FRAME_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_TO_FRAME_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisDnaToFrameValidation(
  projectRoot?: string
): MovieAnalysisDnaToFrameValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaToFrameValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const ingestionReportPath = path.join(root, REAL_MOVIE_FRAME_INGESTION_REPORT_PATH);
  if (!fs.existsSync(ingestionReportPath)) {
    issues.push({
      code: 'REAL_MOVIE_FRAME_INGESTION_REPORT_MISSING',
      message: `Missing ${REAL_MOVIE_FRAME_INGESTION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const ingestionReport = JSON.parse(fs.readFileSync(ingestionReportPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
  };
  if (ingestionReport.final_verdict !== REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_010_NOT_PASS',
      message: `Real movie frame ingestion must have ${REAL_MOVIE_FRAME_INGESTION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (ingestionReport.certification_status !== REAL_MOVIE_FRAME_INGESTED_STATUS) {
    issues.push({
      code: 'REAL_MOVIE_FRAME_NOT_INGESTED',
      message: `Real movie frame ingestion status must be ${REAL_MOVIE_FRAME_INGESTED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const manifestPath = path.join(root, REAL_MOVIE_FRAMES_MANIFEST_PATH);
  if (!fs.existsSync(manifestPath)) {
    issues.push({
      code: 'REAL_MOVIE_FRAMES_MANIFEST_MISSING',
      message: `Missing ${REAL_MOVIE_FRAMES_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const cinematicDna = loadMovieAnalysisCinematicDna(root);
  if (!cinematicDna) {
    issues.push({
      code: 'CINEMATIC_DNA_MISSING',
      message: `Missing ${CINEMATIC_DNA_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  if (!adapterLibrary) {
    issues.push({
      code: 'DNA_ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as RealMovieFramesManifest;
  const sourceAudits: SourceDnaToFrameValidationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const frameEntry = manifest.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const dnaEntry = cinematicDna.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );

    const audit = auditSourceValidation(
      sourceVideoId,
      frameEntry,
      dnaEntry,
      libraryEntry,
      root
    );
    sourceAudits.push(audit);

    if (audit.source_validation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_DNA_TO_FRAME_VALIDATION_FAIL',
        message: `DNA to frame validation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.dna_not_visible) {
      issues.push({
        code: 'DNA_NOT_VISIBLE',
        message: `DNA signals are not visible in frame for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (
      audit.alignment_scores &&
      audit.alignment_scores.dna_alignment_score < MIN_DNA_ALIGNMENT_SCORE
    ) {
      issues.push({
        code: 'DNA_ALIGNMENT_SCORE_BELOW_THRESHOLD',
        message: `DNA alignment score below threshold for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sceneDnaAlignment = aggregateStatus(sourceAudits, 'scene_dna_alignment');
  const cameraDnaAlignment = aggregateStatus(sourceAudits, 'camera_dna_alignment');
  const emotionDnaAlignment = aggregateStatus(sourceAudits, 'emotion_dna_alignment');
  const storytellingDnaAlignment = aggregateStatus(sourceAudits, 'storytelling_dna_alignment');
  const continuityDnaAlignment = aggregateStatus(sourceAudits, 'continuity_dna_alignment');
  const adapterTraceability = aggregateStatus(sourceAudits, 'adapter_traceability');

  const gateChecks: ValidationStatus[] = [
    sceneDnaAlignment,
    cameraDnaAlignment,
    emotionDnaAlignment,
    storytellingDnaAlignment,
    continuityDnaAlignment,
    adapterTraceability,
  ];

  const dnaToFrameValidationReady =
    manifest.source_count === EXPECTED_SOURCE_COUNT &&
    manifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_validation_ready === 'PASS') &&
    sourceAudits.every((audit) => audit.dna_not_visible === false) &&
    sourceAudits.every(
      (audit) =>
        audit.alignment_scores !== null &&
        audit.alignment_scores.dna_alignment_score >= MIN_DNA_ALIGNMENT_SCORE
    ) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = dnaToFrameValidationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'DNA_TO_FRAME_VALIDATION_FAIL')) {
    issues.push({
      code: 'DNA_TO_FRAME_VALIDATION_FAIL',
      message: 'DNA to frame validation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisDnaToFrameValidationReport = {
    report_id: 'movie-analysis-dna-to-frame-validation-report-v1',
    phase: DNA_TO_FRAME_VALIDATION_PHASE,
    timestamp,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    real_movie_frame_ingestion_report_path: REAL_MOVIE_FRAME_INGESTION_REPORT_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: manifest.source_count,
    adapter_count: manifest.adapter_count,
    scene_dna_alignment: sceneDnaAlignment,
    camera_dna_alignment: cameraDnaAlignment,
    emotion_dna_alignment: emotionDnaAlignment,
    storytelling_dna_alignment: storytellingDnaAlignment,
    continuity_dna_alignment: continuityDnaAlignment,
    adapter_traceability: adapterTraceability,
    dna_to_frame_validation_ready: dnaToFrameValidationReady,
    certification_status: pass ? DNA_TO_FRAME_VALIDATED_STATUS : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DNA_TO_FRAME_VALIDATION_PASS_VERDICT
      : DNA_TO_FRAME_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, DNA_TO_FRAME_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_TO_FRAME_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
