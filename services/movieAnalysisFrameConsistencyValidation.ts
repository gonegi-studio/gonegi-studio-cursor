import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  CINEMATIC_DNA_PATH,
  type CinematicDnaEntry,
  loadMovieAnalysisCinematicDna,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  DNA_TO_FRAME_VALIDATED_STATUS,
  DNA_TO_FRAME_VALIDATION_PASS_VERDICT,
  DNA_TO_FRAME_VALIDATION_REPORT_PATH,
  type FrameDnaSignals,
  type SourceDnaToFrameValidationAudit,
} from './movieAnalysisDnaToFrameValidation.js';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  MOVIE_FRAME_PALETTES,
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
  type RealMovieFrameEntry,
  type RealMovieFramesManifest,
} from './movieAnalysisRealMovieFrameIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FRAME_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2E-012-MOVIE_ANALYSIS_FRAME_CONSISTENCY_VALIDATION_V1' as const;
export const FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_FRAME_CONSISTENCY_VALIDATION_V1' as const;
export const FRAME_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_FRAME_CONSISTENCY_VALIDATION_V1' as const;
export const FRAME_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_frame_consistency_validation' as const;
export const FRAME_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_frame_consistency_validation/movie-analysis-frame-consistency-validation-report.json' as const;
export const FRAME_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_frame_consistency_validation/MOVIE_ANALYSIS_FRAME_CONSISTENCY_VALIDATION.md' as const;
export const FRAME_CONSISTENCY_VALIDATED_STATUS = 'FRAME_CONSISTENCY_VALIDATED' as const;

export const MAX_CHARACTER_DRIFT = 0.42 as const;
export const MAX_EMOTION_DRIFT = 0.4 as const;
export const MAX_STORYTELLING_DRIFT = 0.38 as const;
export const MAX_CONTINUITY_DRIFT = 0.4 as const;
export const MAX_DNA_DRIFT = 0.35 as const;
export const MIN_CONSISTENCY_SCORE = 0.58 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SCATTER_MIX = 0.38 as const;
const SCATTER_AVERAGE: [number, number, number] = [108, 108, 108];

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type FrameConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type FrameDriftMetrics = {
  character_drift: number;
  emotion_drift: number;
  storytelling_drift: number;
  continuity_drift: number;
  dna_drift: number;
  consistency_score: number;
};

export type SourceFrameConsistencyAudit = {
  source_video_id: string;
  character_consistency: ValidationStatus;
  emotion_consistency: ValidationStatus;
  storytelling_consistency: ValidationStatus;
  continuity_consistency: ValidationStatus;
  dna_consistency: ValidationStatus;
  adapter_traceability: ValidationStatus;
  character_drift: boolean;
  emotion_drift: boolean;
  storytelling_drift: boolean;
  drift_metrics: FrameDriftMetrics | null;
  frame_signals: FrameDnaSignals | null;
  source_consistency_ready: ValidationStatus;
};

export type MovieAnalysisFrameConsistencyValidationReport = {
  report_id: string;
  phase: typeof FRAME_CONSISTENCY_VALIDATION_PHASE;
  timestamp: string;
  dna_to_frame_validation_report_path: typeof DNA_TO_FRAME_VALIDATION_REPORT_PATH;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  dna_adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  movie_frames_manifest_path: typeof REAL_MOVIE_FRAMES_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  character_consistency: ValidationStatus;
  emotion_consistency: ValidationStatus;
  storytelling_consistency: ValidationStatus;
  continuity_consistency: ValidationStatus;
  dna_consistency: ValidationStatus;
  adapter_traceability: ValidationStatus;
  frame_consistency_validation_ready: ValidationStatus;
  certification_status: typeof FRAME_CONSISTENCY_VALIDATED_STATUS | null;
  source_audits: SourceFrameConsistencyAudit[];
  final_verdict:
    | typeof FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof FRAME_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: FrameConsistencyValidationIssue[];
};

type Rgb = [number, number, number];

function colorDistance(left: Rgb, right: Rgb): number {
  return Math.sqrt(
    (left[0] - right[0]) ** 2 + (left[1] - right[1]) ** 2 + (left[2] - right[2]) ** 2
  );
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

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

function extractFrameSignals(pixels: Buffer, width: number, height: number): FrameDnaSignals {
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

  const skyLum = (sky[0] + sky[1] + sky[2]) / 3;
  const groundLum = (ground[0] + ground[1] + ground[2]) / 3;
  const middleWarmth = middle[0] - middle[2];

  return {
    sky_layer_strength: skyLum / 255,
    ground_layer_strength: groundLum / 255,
    environment_layer_distance: colorDistance(sky, ground) / 255,
    composition_zone_spread: zoneSpread / 255,
    subject_center_mass: 0,
    vertical_framing_balance: colorDistance(top, bottom) / 255,
    emotion_warmth: (middleWarmth + 128) / 255,
    accent_presence: colorDistance(center, sky) / 255,
    narrative_gradient: (colorDistance(top, center) + colorDistance(center, bottom)) / 510,
    palette_coherence: 1 - Math.abs(colorDistance(left, right) - colorDistance(top, bottom)) / 255,
    texture_presence: computeTexturePresence(pixels, width, height) / 30,
  };
}

function buildBaselineSignals(frameEntry: RealMovieFrameEntry): FrameDnaSignals {
  const sky = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.sky));
  const midground = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.midground));
  const ground = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.ground));
  const subject = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.subject));
  const palette = MOVIE_FRAME_PALETTES[frameEntry.source_video_id as keyof typeof MOVIE_FRAME_PALETTES];
  const accent = applyScatterMix(palette.accent);

  return {
    sky_layer_strength: (sky[0] + sky[1] + sky[2]) / (3 * 255),
    ground_layer_strength: (ground[0] + ground[1] + ground[2]) / (3 * 255),
    environment_layer_distance: colorDistance(sky, ground) / 255,
    composition_zone_spread: colorDistance(midground, accent) / 255,
    subject_center_mass: 0,
    vertical_framing_balance: colorDistance(sky, ground) / 255,
    emotion_warmth: ((subject[0] - subject[2] + midground[0] - midground[2]) / 2 + 128) / 255,
    accent_presence: colorDistance(subject, accent) / 255,
    narrative_gradient: (colorDistance(sky, midground) + colorDistance(midground, ground)) / 510,
    palette_coherence: clamp01(
      1 - Math.abs(colorDistance(midground, subject) - colorDistance(sky, ground)) / 255
    ),
    texture_presence: 0.66,
  };
}

function computeDriftMetrics(
  observed: FrameDnaSignals,
  baseline: FrameDnaSignals,
  observedSubject: Rgb,
  expectedSubject: Rgb,
  dnaBaseline: SourceDnaToFrameValidationAudit | undefined
): FrameDriftMetrics {
  const characterDrift = colorDistance(observedSubject, expectedSubject) / 255;
  const emotionDrift = Math.abs(observed.emotion_warmth - baseline.emotion_warmth);
  const storytellingDrift = Math.abs(observed.narrative_gradient - baseline.narrative_gradient);
  const continuityDrift =
    (Math.abs(observed.palette_coherence - baseline.palette_coherence) +
      Math.abs(observed.environment_layer_distance - baseline.environment_layer_distance)) /
    2;

  let dnaDrift = 0;
  if (dnaBaseline?.frame_signals) {
    dnaDrift =
      (Math.abs(observed.sky_layer_strength - dnaBaseline.frame_signals.sky_layer_strength) +
        Math.abs(observed.emotion_warmth - dnaBaseline.frame_signals.emotion_warmth) +
        Math.abs(observed.narrative_gradient - dnaBaseline.frame_signals.narrative_gradient)) /
      3;
  }

  const consistencyScore = clamp01(
    (1 - characterDrift) * 0.24 +
      (1 - emotionDrift) * 0.2 +
      (1 - storytellingDrift) * 0.2 +
      (1 - continuityDrift) * 0.18 +
      (1 - dnaDrift) * 0.18
  );

  return {
    character_drift: characterDrift,
    emotion_drift: emotionDrift,
    storytelling_drift: storytellingDrift,
    continuity_drift: continuityDrift,
    dna_drift: dnaDrift,
    consistency_score: consistencyScore,
  };
}

function isAdapterTraceable(
  frameEntry: RealMovieFrameEntry,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  dnaEntry: CinematicDnaEntry | undefined
): boolean {
  if (!libraryEntry || !dnaEntry) {
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
    frameEntry.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    frameEntry.cinematic_dna_id === dnaEntry.cinematic_dna_id &&
    frameEntry.adapter_ids.length === expectedAdapterIds.length &&
    expectedAdapterIds.every((adapterId) => frameEntry.adapter_ids.includes(adapterId)) &&
    frameEntry.real_movie_frame === true &&
    frameEntry.procedural_stub === false
  );
}

function auditSourceConsistency(
  sourceVideoId: string,
  frameEntry: RealMovieFrameEntry | undefined,
  dnaEntry: CinematicDnaEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  dnaValidationAudit: SourceDnaToFrameValidationAudit | undefined,
  projectRoot: string
): SourceFrameConsistencyAudit {
  if (!frameEntry || !dnaEntry || !libraryEntry) {
    return {
      source_video_id: sourceVideoId,
      character_consistency: 'FAIL',
      emotion_consistency: 'FAIL',
      storytelling_consistency: 'FAIL',
      continuity_consistency: 'FAIL',
      dna_consistency: 'FAIL',
      adapter_traceability: 'FAIL',
      character_drift: true,
      emotion_drift: true,
      storytelling_drift: true,
      drift_metrics: null,
      frame_signals: null,
      source_consistency_ready: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, frameEntry.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_video_id: sourceVideoId,
      character_consistency: 'FAIL',
      emotion_consistency: 'FAIL',
      storytelling_consistency: 'FAIL',
      continuity_consistency: 'FAIL',
      dna_consistency: 'FAIL',
      adapter_traceability: 'FAIL',
      character_drift: true,
      emotion_drift: true,
      storytelling_drift: true,
      drift_metrics: null,
      frame_signals: null,
      source_consistency_ready: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      character_consistency: 'FAIL',
      emotion_consistency: 'FAIL',
      storytelling_consistency: 'FAIL',
      continuity_consistency: 'FAIL',
      dna_consistency: 'FAIL',
      adapter_traceability: 'FAIL',
      character_drift: true,
      emotion_drift: true,
      storytelling_drift: true,
      drift_metrics: null,
      frame_signals: null,
      source_consistency_ready: 'FAIL',
    };
  }

  const frameSignals = extractFrameSignals(decoded.pixels, decoded.width, decoded.height);
  const baselineSignals = buildBaselineSignals(frameEntry);
  const observedSubject = zoneAverage(decoded.pixels, decoded.width, decoded.height, 1, 1);
  const expectedSubject = applyScatterMix(parseSemanticTone(frameEntry.semantic_regions.subject));
  const driftMetrics = computeDriftMetrics(
    frameSignals,
    baselineSignals,
    observedSubject,
    expectedSubject,
    dnaValidationAudit
  );

  const traceability = isAdapterTraceable(frameEntry, libraryEntry, dnaEntry) ? 'PASS' : 'FAIL';
  const characterConsistency =
    driftMetrics.character_drift <= MAX_CHARACTER_DRIFT ? 'PASS' : 'FAIL';
  const emotionConsistency = driftMetrics.emotion_drift <= MAX_EMOTION_DRIFT ? 'PASS' : 'FAIL';
  const storytellingConsistency =
    driftMetrics.storytelling_drift <= MAX_STORYTELLING_DRIFT ? 'PASS' : 'FAIL';
  const continuityConsistency =
    driftMetrics.continuity_drift <= MAX_CONTINUITY_DRIFT ? 'PASS' : 'FAIL';
  const dnaConsistency =
    dnaValidationAudit?.source_validation_ready === 'PASS' &&
    driftMetrics.dna_drift <= MAX_DNA_DRIFT &&
    (dnaValidationAudit.alignment_scores?.dna_alignment_score ?? 0) >= 0.62
      ? 'PASS'
      : 'FAIL';

  const characterDrift = driftMetrics.character_drift > MAX_CHARACTER_DRIFT;
  const emotionDrift = driftMetrics.emotion_drift > MAX_EMOTION_DRIFT;
  const storytellingDrift = driftMetrics.storytelling_drift > MAX_STORYTELLING_DRIFT;

  const ready =
    traceability === 'PASS' &&
    characterConsistency === 'PASS' &&
    emotionConsistency === 'PASS' &&
    storytellingConsistency === 'PASS' &&
    continuityConsistency === 'PASS' &&
    dnaConsistency === 'PASS' &&
    !characterDrift &&
    !emotionDrift &&
    !storytellingDrift &&
    driftMetrics.consistency_score >= MIN_CONSISTENCY_SCORE;

  return {
    source_video_id: sourceVideoId,
    character_consistency: characterConsistency,
    emotion_consistency: emotionConsistency,
    storytelling_consistency: storytellingConsistency,
    continuity_consistency: continuityConsistency,
    dna_consistency: dnaConsistency,
    adapter_traceability: traceability,
    character_drift: characterDrift,
    emotion_drift: emotionDrift,
    storytelling_drift: storytellingDrift,
    drift_metrics: driftMetrics,
    frame_signals: frameSignals,
    source_consistency_ready: ready ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceFrameConsistencyAudit[],
  field:
    | 'character_consistency'
    | 'emotion_consistency'
    | 'storytelling_consistency'
    | 'continuity_consistency'
    | 'dna_consistency'
    | 'adapter_traceability'
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisFrameConsistencyValidationReport): string {
  const lines = [
    '# Movie Analysis Frame Consistency Validation',
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
    `| character_consistency | ${report.character_consistency} |`,
    `| emotion_consistency | ${report.emotion_consistency} |`,
    `| storytelling_consistency | ${report.storytelling_consistency} |`,
    `| continuity_consistency | ${report.continuity_consistency} |`,
    `| dna_consistency | ${report.dna_consistency} |`,
    `| adapter_traceability | ${report.adapter_traceability} |`,
    `| frame_consistency_validation_ready | ${report.frame_consistency_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const drift = audit.drift_metrics
      ? `character=${audit.drift_metrics.character_drift.toFixed(4)} emotion=${audit.drift_metrics.emotion_drift.toFixed(4)} storytelling=${audit.drift_metrics.storytelling_drift.toFixed(4)} continuity=${audit.drift_metrics.continuity_drift.toFixed(4)} dna=${audit.drift_metrics.dna_drift.toFixed(4)} score=${audit.drift_metrics.consistency_score.toFixed(4)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- drift: ${drift}`,
      `- character_consistency: ${audit.character_consistency}`,
      `- emotion_consistency: ${audit.emotion_consistency}`,
      `- storytelling_consistency: ${audit.storytelling_consistency}`,
      `- continuity_consistency: ${audit.continuity_consistency}`,
      `- dna_consistency: ${audit.dna_consistency}`,
      `- adapter_traceability: ${audit.adapter_traceability}`,
      `- character_drift: ${audit.character_drift}`,
      `- emotion_drift: ${audit.emotion_drift}`,
      `- storytelling_drift: ${audit.storytelling_drift}`,
      `- source_consistency_ready: ${audit.source_consistency_ready}`,
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
  issues: FrameConsistencyValidationIssue[]
): MovieAnalysisFrameConsistencyValidationReport {
  const report: MovieAnalysisFrameConsistencyValidationReport = {
    report_id: 'movie-analysis-frame-consistency-validation-report-v1',
    phase: FRAME_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    dna_to_frame_validation_report_path: DNA_TO_FRAME_VALIDATION_REPORT_PATH,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    character_consistency: 'FAIL',
    emotion_consistency: 'FAIL',
    storytelling_consistency: 'FAIL',
    continuity_consistency: 'FAIL',
    dna_consistency: 'FAIL',
    adapter_traceability: 'FAIL',
    frame_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: FRAME_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, FRAME_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FRAME_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisFrameConsistencyValidation(
  projectRoot?: string
): MovieAnalysisFrameConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: FrameConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const dnaValidationReportPath = path.join(root, DNA_TO_FRAME_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(dnaValidationReportPath)) {
    issues.push({
      code: 'DNA_TO_FRAME_VALIDATION_REPORT_MISSING',
      message: `Missing ${DNA_TO_FRAME_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const dnaValidationReport = JSON.parse(fs.readFileSync(dnaValidationReportPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
    source_audits: SourceDnaToFrameValidationAudit[];
  };
  if (dnaValidationReport.final_verdict !== DNA_TO_FRAME_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_011_NOT_PASS',
      message: `DNA to frame validation must have ${DNA_TO_FRAME_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (dnaValidationReport.certification_status !== DNA_TO_FRAME_VALIDATED_STATUS) {
    issues.push({
      code: 'DNA_TO_FRAME_NOT_VALIDATED',
      message: `DNA to frame validation status must be ${DNA_TO_FRAME_VALIDATED_STATUS}`,
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
  const sourceAudits: SourceFrameConsistencyAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const frameEntry = manifest.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const dnaEntry = cinematicDna.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const dnaValidationAudit = dnaValidationReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );

    const audit = auditSourceConsistency(
      sourceVideoId,
      frameEntry,
      dnaEntry,
      libraryEntry,
      dnaValidationAudit,
      root
    );
    sourceAudits.push(audit);

    if (audit.source_consistency_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_FRAME_CONSISTENCY_FAIL',
        message: `Frame consistency validation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.character_drift) {
      issues.push({
        code: 'CHARACTER_DRIFT',
        message: `Character drift detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.emotion_drift) {
      issues.push({
        code: 'EMOTION_DRIFT',
        message: `Emotion drift detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.storytelling_drift) {
      issues.push({
        code: 'STORYTELLING_DRIFT',
        message: `Storytelling drift detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const characterConsistency = aggregateStatus(sourceAudits, 'character_consistency');
  const emotionConsistency = aggregateStatus(sourceAudits, 'emotion_consistency');
  const storytellingConsistency = aggregateStatus(sourceAudits, 'storytelling_consistency');
  const continuityConsistency = aggregateStatus(sourceAudits, 'continuity_consistency');
  const dnaConsistency = aggregateStatus(sourceAudits, 'dna_consistency');
  const adapterTraceability = aggregateStatus(sourceAudits, 'adapter_traceability');

  const gateChecks: ValidationStatus[] = [
    characterConsistency,
    emotionConsistency,
    storytellingConsistency,
    continuityConsistency,
    dnaConsistency,
    adapterTraceability,
  ];

  const frameConsistencyValidationReady =
    manifest.source_count === EXPECTED_SOURCE_COUNT &&
    manifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_consistency_ready === 'PASS') &&
    sourceAudits.every((audit) => audit.character_drift === false) &&
    sourceAudits.every((audit) => audit.emotion_drift === false) &&
    sourceAudits.every((audit) => audit.storytelling_drift === false) &&
    sourceAudits.every(
      (audit) =>
        audit.drift_metrics !== null &&
        audit.drift_metrics.consistency_score >= MIN_CONSISTENCY_SCORE
    ) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = frameConsistencyValidationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'FRAME_CONSISTENCY_VALIDATION_FAIL')) {
    issues.push({
      code: 'FRAME_CONSISTENCY_VALIDATION_FAIL',
      message: 'Frame consistency validation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisFrameConsistencyValidationReport = {
    report_id: 'movie-analysis-frame-consistency-validation-report-v1',
    phase: FRAME_CONSISTENCY_VALIDATION_PHASE,
    timestamp,
    dna_to_frame_validation_report_path: DNA_TO_FRAME_VALIDATION_REPORT_PATH,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: manifest.source_count,
    adapter_count: manifest.adapter_count,
    character_consistency: characterConsistency,
    emotion_consistency: emotionConsistency,
    storytelling_consistency: storytellingConsistency,
    continuity_consistency: continuityConsistency,
    dna_consistency: dnaConsistency,
    adapter_traceability: adapterTraceability,
    frame_consistency_validation_ready: frameConsistencyValidationReady,
    certification_status: pass ? FRAME_CONSISTENCY_VALIDATED_STATUS : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT
      : FRAME_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, FRAME_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FRAME_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
