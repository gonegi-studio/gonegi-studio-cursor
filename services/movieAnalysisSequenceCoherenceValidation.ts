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
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  FRAME_CONSISTENCY_VALIDATED_STATUS,
  FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT,
  FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
  type SourceFrameConsistencyAudit,
} from './movieAnalysisFrameConsistencyValidation.js';
import {
  REAL_MOVIE_FRAMES_MANIFEST_PATH,
  type RealMovieFrameEntry,
  type RealMovieFramesManifest,
} from './movieAnalysisRealMovieFrameIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SEQUENCE_COHERENCE_VALIDATION_PHASE =
  'PHASE-LEVEL2E-013-MOVIE_ANALYSIS_SEQUENCE_COHERENCE_VALIDATION_V1' as const;
export const SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SEQUENCE_COHERENCE_VALIDATION_V1' as const;
export const SEQUENCE_COHERENCE_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SEQUENCE_COHERENCE_VALIDATION_V1' as const;
export const SEQUENCE_COHERENCE_VALIDATION_DIR =
  'reports/movie_analysis_sequence_coherence_validation' as const;
export const SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_sequence_coherence_validation/movie-analysis-sequence-coherence-validation-report.json' as const;
export const SEQUENCE_COHERENCE_VALIDATION_MD_PATH =
  'reports/movie_analysis_sequence_coherence_validation/MOVIE_ANALYSIS_SEQUENCE_COHERENCE_VALIDATION.md' as const;
export const SEQUENCE_COHERENCE_VALIDATED_STATUS = 'SEQUENCE_COHERENCE_VALIDATED' as const;

export const MAX_SEQUENCE_DRIFT = 0.46 as const;
export const MAX_CONTINUITY_BREAK = 0.55 as const;
export const MAX_NARRATIVE_BREAK_GAP = 0.72 as const;
export const MIN_NARRATIVE_STEP = 0.05 as const;
export const MAX_EMOTION_STEP = 0.48 as const;
export const MIN_SEQUENCE_COHERENCE_SCORE = 0.58 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SEQUENCE_STAGES = ['open', 'develop', 'peak', 'resolve'] as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type SequenceCoherenceValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SequenceKeyframe = {
  stage: (typeof SEQUENCE_STAGES)[number];
  luminance: number;
  emotion_warmth: number;
  tone: [number, number, number];
};

export type SequenceProgressionMetrics = {
  narrative_progression_score: number;
  emotion_progression_score: number;
  continuity_preservation_score: number;
  dna_persistence_score: number;
  sequence_coherence_score: number;
  sequence_drift: number;
  max_adjacent_gap: number;
  open_to_resolve_span: number;
};

export type SourceSequenceCoherenceAudit = {
  source_video_id: string;
  sequence_coherence: ValidationStatus;
  narrative_progression: ValidationStatus;
  emotion_progression: ValidationStatus;
  continuity_preservation: ValidationStatus;
  dna_persistence: ValidationStatus;
  adapter_traceability: ValidationStatus;
  sequence_drift: boolean;
  narrative_break: boolean;
  continuity_break: boolean;
  sequence_keyframes: SequenceKeyframe[];
  progression_metrics: SequenceProgressionMetrics | null;
  source_sequence_ready: ValidationStatus;
};

export type MovieAnalysisSequenceCoherenceValidationReport = {
  report_id: string;
  phase: typeof SEQUENCE_COHERENCE_VALIDATION_PHASE;
  timestamp: string;
  frame_consistency_validation_report_path: typeof FRAME_CONSISTENCY_VALIDATION_REPORT_PATH;
  cinematic_dna_path: typeof CINEMATIC_DNA_PATH;
  dna_adapter_library_path: typeof DNA_ADAPTER_LIBRARY_PATH;
  movie_frames_manifest_path: typeof REAL_MOVIE_FRAMES_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  sequence_coherence: ValidationStatus;
  narrative_progression: ValidationStatus;
  emotion_progression: ValidationStatus;
  continuity_preservation: ValidationStatus;
  dna_persistence: ValidationStatus;
  adapter_traceability: ValidationStatus;
  sequence_coherence_validation_ready: ValidationStatus;
  certification_status: typeof SEQUENCE_COHERENCE_VALIDATED_STATUS | null;
  source_audits: SourceSequenceCoherenceAudit[];
  final_verdict:
    | typeof SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT
    | typeof SEQUENCE_COHERENCE_VALIDATION_FAIL_VERDICT;
  issues: SequenceCoherenceValidationIssue[];
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

function extractSequenceKeyframes(pixels: Buffer, width: number, height: number): SequenceKeyframe[] {
  const ranges: Array<[number, number]> = [
    [0, 0.25],
    [0.25, 0.5],
    [0.5, 0.75],
    [0.75, 1],
  ];

  return SEQUENCE_STAGES.map((stage, index) => {
    const [start, end] = ranges[index];
    const tone = bandAverage(pixels, width, height, start, end);
    const luminance = (tone[0] + tone[1] + tone[2]) / (3 * 255);
    const emotionWarmth = (tone[0] - tone[2] + 128) / 255;
    return {
      stage,
      luminance,
      emotion_warmth: emotionWarmth,
      tone,
    };
  });
}

function hasStorytellingPatterns(dnaEntry: CinematicDnaEntry): boolean {
  const signatures = new Set(
    dnaEntry.storytelling_patterns.map((pattern) => pattern.pattern_signature)
  );
  return (
    signatures.has('narrative_hold') ||
    dnaEntry.scene_patterns.some((pattern) => pattern.pattern_signature.includes('scene_open')) ||
    dnaEntry.scene_patterns.some((pattern) => pattern.pattern_signature.includes('scene_resolve'))
  );
}

function hasContinuityPatterns(dnaEntry: CinematicDnaEntry): boolean {
  return dnaEntry.continuity_patterns.some(
    (pattern) =>
      pattern.pattern_signature.includes('continuity') ||
      pattern.pattern_signature.includes('environment_hold')
  );
}

function computeProgressionMetrics(
  keyframes: SequenceKeyframe[],
  consistencyAudit: SourceFrameConsistencyAudit | undefined
): SequenceProgressionMetrics {
  const adjacentGaps: number[] = [];
  const emotionSteps: number[] = [];

  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const gap = colorDistance(keyframes[index].tone, keyframes[index + 1].tone) / 255;
    adjacentGaps.push(gap);
    emotionSteps.push(
      Math.abs(keyframes[index].emotion_warmth - keyframes[index + 1].emotion_warmth)
    );
  }

  const maxAdjacentGap = Math.max(...adjacentGaps, 0);
  const minAdjacentGap = Math.min(...adjacentGaps, 0);
  const openToResolveSpan = colorDistance(keyframes[0].tone, keyframes[3].tone) / 255;

  const narrativeStepScores = adjacentGaps.map((gap) =>
    gap >= MIN_NARRATIVE_STEP && gap <= MAX_NARRATIVE_BREAK_GAP
      ? clamp01((gap - MIN_NARRATIVE_STEP) / (MAX_NARRATIVE_BREAK_GAP - MIN_NARRATIVE_STEP))
      : clamp01(gap / MIN_NARRATIVE_STEP) * 0.35
  );
  const stepAverage =
    narrativeStepScores.length === 0
      ? 0
      : narrativeStepScores.reduce((sum, value) => sum + value, 0) / narrativeStepScores.length;
  const spanScore = clamp01(openToResolveSpan / 0.2);
  const luminanceArc = Math.abs(keyframes[0].luminance - keyframes[3].luminance);
  const arcScore = clamp01(luminanceArc / 0.18);
  const narrativeProgressionScore = clamp01(stepAverage * 0.45 + spanScore * 0.35 + arcScore * 0.2);

  const emotionStepScores = emotionSteps.map((step) =>
    clamp01(1 - step / MAX_EMOTION_STEP)
  );
  const emotionProgressionScore =
    emotionStepScores.length === 0
      ? 0
      : emotionStepScores.reduce((sum, value) => sum + value, 0) / emotionStepScores.length;

  const continuityScores = adjacentGaps.map((gap) =>
    gap <= MAX_CONTINUITY_BREAK ? clamp01(1 - gap / MAX_CONTINUITY_BREAK) : 0
  );
  const continuityPreservationScore =
    continuityScores.length === 0
      ? 0
      : continuityScores.reduce((sum, value) => sum + value, 0) / continuityScores.length;

  let sequenceDrift = 0;
  let dnaPersistenceScore = 0.72;
  if (consistencyAudit?.frame_signals) {
    const observedEmotion =
      keyframes.reduce((sum, frame) => sum + frame.emotion_warmth, 0) / keyframes.length;
    const expectedSpan = Math.max(
      consistencyAudit.frame_signals.narrative_gradient,
      consistencyAudit.frame_signals.environment_layer_distance
    );
    sequenceDrift =
      Math.abs(openToResolveSpan - expectedSpan) * 0.55 +
      Math.abs(observedEmotion - consistencyAudit.frame_signals.emotion_warmth) * 0.45;
    dnaPersistenceScore = clamp01(1 - sequenceDrift / 0.52);
  }

  const sequenceCoherenceScore = clamp01(
    narrativeProgressionScore * 0.28 +
      emotionProgressionScore * 0.22 +
      continuityPreservationScore * 0.24 +
      dnaPersistenceScore * 0.16 +
      clamp01(minAdjacentGap / MIN_NARRATIVE_STEP) * 0.1
  );

  return {
    narrative_progression_score: narrativeProgressionScore,
    emotion_progression_score: emotionProgressionScore,
    continuity_preservation_score: continuityPreservationScore,
    dna_persistence_score: dnaPersistenceScore,
    sequence_coherence_score: sequenceCoherenceScore,
    sequence_drift: sequenceDrift,
    max_adjacent_gap: maxAdjacentGap,
    open_to_resolve_span: openToResolveSpan,
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

function auditSourceSequence(
  sourceVideoId: string,
  frameEntry: RealMovieFrameEntry | undefined,
  dnaEntry: CinematicDnaEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  consistencyAudit: SourceFrameConsistencyAudit | undefined,
  projectRoot: string
): SourceSequenceCoherenceAudit {
  if (!frameEntry || !dnaEntry || !libraryEntry) {
    return {
      source_video_id: sourceVideoId,
      sequence_coherence: 'FAIL',
      narrative_progression: 'FAIL',
      emotion_progression: 'FAIL',
      continuity_preservation: 'FAIL',
      dna_persistence: 'FAIL',
      adapter_traceability: 'FAIL',
      sequence_drift: true,
      narrative_break: true,
      continuity_break: true,
      sequence_keyframes: [],
      progression_metrics: null,
      source_sequence_ready: 'FAIL',
    };
  }

  const imagePath = path.join(projectRoot, frameEntry.output_path);
  if (!fs.existsSync(imagePath)) {
    return {
      source_video_id: sourceVideoId,
      sequence_coherence: 'FAIL',
      narrative_progression: 'FAIL',
      emotion_progression: 'FAIL',
      continuity_preservation: 'FAIL',
      dna_persistence: 'FAIL',
      adapter_traceability: 'FAIL',
      sequence_drift: true,
      narrative_break: true,
      continuity_break: true,
      sequence_keyframes: [],
      progression_metrics: null,
      source_sequence_ready: 'FAIL',
    };
  }

  const decoded = decodePngRgb(fs.readFileSync(imagePath));
  if (!decoded) {
    return {
      source_video_id: sourceVideoId,
      sequence_coherence: 'FAIL',
      narrative_progression: 'FAIL',
      emotion_progression: 'FAIL',
      continuity_preservation: 'FAIL',
      dna_persistence: 'FAIL',
      adapter_traceability: 'FAIL',
      sequence_drift: true,
      narrative_break: true,
      continuity_break: true,
      sequence_keyframes: [],
      progression_metrics: null,
      source_sequence_ready: 'FAIL',
    };
  }

  const keyframes = extractSequenceKeyframes(decoded.pixels, decoded.width, decoded.height);
  const metrics = computeProgressionMetrics(keyframes, consistencyAudit);
  const traceability = isAdapterTraceable(frameEntry, libraryEntry, dnaEntry) ? 'PASS' : 'FAIL';

  const narrativeBreak =
    metrics.open_to_resolve_span < MIN_NARRATIVE_STEP ||
    metrics.max_adjacent_gap > MAX_NARRATIVE_BREAK_GAP ||
    !hasStorytellingPatterns(dnaEntry);
  const continuityBreak =
    metrics.max_adjacent_gap > MAX_CONTINUITY_BREAK || !hasContinuityPatterns(dnaEntry);
  const sequenceDriftFlag = metrics.sequence_drift > MAX_SEQUENCE_DRIFT;

  const narrativeProgression =
    !narrativeBreak && metrics.narrative_progression_score >= 0.38 ? 'PASS' : 'FAIL';
  const emotionProgression =
    metrics.emotion_progression_score >= 0.42 ? 'PASS' : 'FAIL';
  const continuityPreservation =
    !continuityBreak && metrics.continuity_preservation_score >= 0.42 ? 'PASS' : 'FAIL';
  const dnaPersistence =
    consistencyAudit?.source_consistency_ready === 'PASS' &&
    !sequenceDriftFlag &&
    metrics.dna_persistence_score >= 0.48
      ? 'PASS'
      : 'FAIL';
  const sequenceCoherence =
    metrics.sequence_coherence_score >= MIN_SEQUENCE_COHERENCE_SCORE ? 'PASS' : 'FAIL';

  const ready =
    traceability === 'PASS' &&
    sequenceCoherence === 'PASS' &&
    narrativeProgression === 'PASS' &&
    emotionProgression === 'PASS' &&
    continuityPreservation === 'PASS' &&
    dnaPersistence === 'PASS' &&
    !sequenceDriftFlag &&
    !narrativeBreak &&
    !continuityBreak;

  return {
    source_video_id: sourceVideoId,
    sequence_coherence: sequenceCoherence,
    narrative_progression: narrativeProgression,
    emotion_progression: emotionProgression,
    continuity_preservation: continuityPreservation,
    dna_persistence: dnaPersistence,
    adapter_traceability: traceability,
    sequence_drift: sequenceDriftFlag,
    narrative_break: narrativeBreak,
    continuity_break: continuityBreak,
    sequence_keyframes: keyframes,
    progression_metrics: metrics,
    source_sequence_ready: ready ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceSequenceCoherenceAudit[],
  field:
    | 'sequence_coherence'
    | 'narrative_progression'
    | 'emotion_progression'
    | 'continuity_preservation'
    | 'dna_persistence'
    | 'adapter_traceability'
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisSequenceCoherenceValidationReport): string {
  const lines = [
    '# Movie Analysis Sequence Coherence Validation',
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
    `| sequence_coherence | ${report.sequence_coherence} |`,
    `| narrative_progression | ${report.narrative_progression} |`,
    `| emotion_progression | ${report.emotion_progression} |`,
    `| continuity_preservation | ${report.continuity_preservation} |`,
    `| dna_persistence | ${report.dna_persistence} |`,
    `| adapter_traceability | ${report.adapter_traceability} |`,
    `| sequence_coherence_validation_ready | ${report.sequence_coherence_validation_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const metrics = audit.progression_metrics
      ? `coherence=${audit.progression_metrics.sequence_coherence_score.toFixed(4)} narrative=${audit.progression_metrics.narrative_progression_score.toFixed(4)} emotion=${audit.progression_metrics.emotion_progression_score.toFixed(4)} continuity=${audit.progression_metrics.continuity_preservation_score.toFixed(4)} drift=${audit.progression_metrics.sequence_drift.toFixed(4)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- metrics: ${metrics}`,
      `- keyframes: ${audit.sequence_keyframes.length}`,
      `- sequence_coherence: ${audit.sequence_coherence}`,
      `- narrative_progression: ${audit.narrative_progression}`,
      `- emotion_progression: ${audit.emotion_progression}`,
      `- continuity_preservation: ${audit.continuity_preservation}`,
      `- dna_persistence: ${audit.dna_persistence}`,
      `- adapter_traceability: ${audit.adapter_traceability}`,
      `- sequence_drift: ${audit.sequence_drift}`,
      `- narrative_break: ${audit.narrative_break}`,
      `- continuity_break: ${audit.continuity_break}`,
      `- source_sequence_ready: ${audit.source_sequence_ready}`,
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
  issues: SequenceCoherenceValidationIssue[]
): MovieAnalysisSequenceCoherenceValidationReport {
  const report: MovieAnalysisSequenceCoherenceValidationReport = {
    report_id: 'movie-analysis-sequence-coherence-validation-report-v1',
    phase: SEQUENCE_COHERENCE_VALIDATION_PHASE,
    timestamp,
    frame_consistency_validation_report_path: FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    sequence_coherence: 'FAIL',
    narrative_progression: 'FAIL',
    emotion_progression: 'FAIL',
    continuity_preservation: 'FAIL',
    dna_persistence: 'FAIL',
    adapter_traceability: 'FAIL',
    sequence_coherence_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: SEQUENCE_COHERENCE_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SEQUENCE_COHERENCE_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SEQUENCE_COHERENCE_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisSequenceCoherenceValidation(
  projectRoot?: string
): MovieAnalysisSequenceCoherenceValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SequenceCoherenceValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const consistencyReportPath = path.join(root, FRAME_CONSISTENCY_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(consistencyReportPath)) {
    issues.push({
      code: 'FRAME_CONSISTENCY_VALIDATION_REPORT_MISSING',
      message: `Missing ${FRAME_CONSISTENCY_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const consistencyReport = JSON.parse(fs.readFileSync(consistencyReportPath, 'utf8')) as {
    final_verdict: string;
    certification_status: string | null;
    source_audits: SourceFrameConsistencyAudit[];
  };
  if (consistencyReport.final_verdict !== FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_012_NOT_PASS',
      message: `Frame consistency validation must have ${FRAME_CONSISTENCY_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (consistencyReport.certification_status !== FRAME_CONSISTENCY_VALIDATED_STATUS) {
    issues.push({
      code: 'FRAME_CONSISTENCY_NOT_VALIDATED',
      message: `Frame consistency validation status must be ${FRAME_CONSISTENCY_VALIDATED_STATUS}`,
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
  const sourceAudits: SourceSequenceCoherenceAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const frameEntry = manifest.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const dnaEntry = cinematicDna.entries.find((entry) => entry.source_video_id === sourceVideoId);
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const consistencyAudit = consistencyReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );

    const audit = auditSourceSequence(
      sourceVideoId,
      frameEntry,
      dnaEntry,
      libraryEntry,
      consistencyAudit,
      root
    );
    sourceAudits.push(audit);

    if (audit.source_sequence_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_SEQUENCE_COHERENCE_FAIL',
        message: `Sequence coherence validation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.sequence_drift) {
      issues.push({
        code: 'SEQUENCE_DRIFT',
        message: `Sequence drift detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.narrative_break) {
      issues.push({
        code: 'NARRATIVE_BREAK',
        message: `Narrative break detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }

    if (audit.continuity_break) {
      issues.push({
        code: 'CONTINUITY_BREAK',
        message: `Continuity break detected for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sequenceCoherence = aggregateStatus(sourceAudits, 'sequence_coherence');
  const narrativeProgression = aggregateStatus(sourceAudits, 'narrative_progression');
  const emotionProgression = aggregateStatus(sourceAudits, 'emotion_progression');
  const continuityPreservation = aggregateStatus(sourceAudits, 'continuity_preservation');
  const dnaPersistence = aggregateStatus(sourceAudits, 'dna_persistence');
  const adapterTraceability = aggregateStatus(sourceAudits, 'adapter_traceability');

  const gateChecks: ValidationStatus[] = [
    sequenceCoherence,
    narrativeProgression,
    emotionProgression,
    continuityPreservation,
    dnaPersistence,
    adapterTraceability,
  ];

  const sequenceCoherenceValidationReady =
    manifest.source_count === EXPECTED_SOURCE_COUNT &&
    manifest.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_sequence_ready === 'PASS') &&
    sourceAudits.every((audit) => audit.sequence_drift === false) &&
    sourceAudits.every((audit) => audit.narrative_break === false) &&
    sourceAudits.every((audit) => audit.continuity_break === false) &&
    sourceAudits.every(
      (audit) =>
        audit.progression_metrics !== null &&
        audit.progression_metrics.sequence_coherence_score >= MIN_SEQUENCE_COHERENCE_SCORE
    ) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = sequenceCoherenceValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'SEQUENCE_COHERENCE_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'SEQUENCE_COHERENCE_VALIDATION_FAIL',
      message: 'Sequence coherence validation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisSequenceCoherenceValidationReport = {
    report_id: 'movie-analysis-sequence-coherence-validation-report-v1',
    phase: SEQUENCE_COHERENCE_VALIDATION_PHASE,
    timestamp,
    frame_consistency_validation_report_path: FRAME_CONSISTENCY_VALIDATION_REPORT_PATH,
    cinematic_dna_path: CINEMATIC_DNA_PATH,
    dna_adapter_library_path: DNA_ADAPTER_LIBRARY_PATH,
    movie_frames_manifest_path: REAL_MOVIE_FRAMES_MANIFEST_PATH,
    source_count: manifest.source_count,
    adapter_count: manifest.adapter_count,
    sequence_coherence: sequenceCoherence,
    narrative_progression: narrativeProgression,
    emotion_progression: emotionProgression,
    continuity_preservation: continuityPreservation,
    dna_persistence: dnaPersistence,
    adapter_traceability: adapterTraceability,
    sequence_coherence_validation_ready: sequenceCoherenceValidationReady,
    certification_status: pass ? SEQUENCE_COHERENCE_VALIDATED_STATUS : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? SEQUENCE_COHERENCE_VALIDATION_PASS_VERDICT
      : SEQUENCE_COHERENCE_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SEQUENCE_COHERENCE_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SEQUENCE_COHERENCE_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SEQUENCE_COHERENCE_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
