import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import { MAX_CHARACTER_DRIFT, MAX_DNA_MISMATCH_SCORE } from './movieAnalysisRealCharacterConsistencyValidation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  type RealModelTestGenerationManifest,
} from './movieAnalysisRealModelTestGeneration.js';
import { CLIP_FRAMES_PER_SOURCE } from './movieAnalysisRealVideoClipMotionValidation.js';
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

export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE =
  'PHASE-LEVEL2F-011-REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_V1' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE =
  'REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATED' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_DIR =
  'reports/movie_analysis_real_video_identity_consistency_validation' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH =
  'reports/movie_analysis_real_video_identity_consistency_validation/movie-analysis-real-video-identity-consistency-validation-report.json' as const;
export const REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_MD_PATH =
  'reports/movie_analysis_real_video_identity_consistency_validation/MOVIE_ANALYSIS_REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION.md' as const;
export const VIDEO_IDENTITY_DIR =
  'exports/movie_analysis_model_generation_test/video_identity' as const;
export const VIDEO_IDENTITY_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/video_identity/movie-analysis-real-video-identity-consistency-manifest.json' as const;

export const EXPECTED_VIDEO_IDENTITY_FRAME_COUNT = EXPECTED_SOURCE_COUNT * CLIP_FRAMES_PER_SOURCE;
export const MAX_FACE_IDENTITY_DRIFT = MAX_CHARACTER_DRIFT;
export const MAX_HAIRSTYLE_DRIFT = 0.45 as const;
export const MAX_CLOTHING_DRIFT = 0.45 as const;
export const MAX_FRAME_IDENTITY_DRIFT = 0.46 as const;
export const MAX_CHARACTER_SWAP_SCORE = 0.4 as const;
export const MIN_FACE_ZONE_VARIANCE = 12 as const;
export const MIN_VIDEO_IDENTITY_SCORE = 0.58 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type RealVideoIdentityConsistencyValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type VideoIdentityFrameSnapshot = {
  frame_index: number;
  face_zone_rgb: [number, number, number];
  hair_zone_rgb: [number, number, number];
  clothing_zone_rgb: [number, number, number];
  identity_signature: string;
  face_zone_variance: number;
};

export type VideoIdentityConsistencyMetrics = {
  max_adjacent_face_drift: number;
  max_adjacent_hair_drift: number;
  max_adjacent_clothing_drift: number;
  anchor_face_drift: number;
  frame_to_frame_identity_drift: number;
  character_swap_score: number;
  dna_mismatch_score: number;
  video_identity_score: number;
};

export type VideoIdentityManifestEntry = {
  source_id: string;
  mp4_output_path: string;
  frame_count: number;
  frames: VideoIdentityFrameSnapshot[];
};

export type MovieAnalysisRealVideoIdentityConsistencyManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE;
  generated_at: string;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  source_count: number;
  frame_count: typeof EXPECTED_VIDEO_IDENTITY_FRAME_COUNT;
  entries: VideoIdentityManifestEntry[];
};

export type SourceVideoIdentityConsistencyAudit = {
  source_id: string;
  face_identity_persistence: ValidationStatus;
  hairstyle_persistence: ValidationStatus;
  clothing_persistence: ValidationStatus;
  dna_persistence: ValidationStatus;
  frame_to_frame_identity_drift: ValidationStatus;
  identity_break: boolean;
  character_swap: boolean;
  dna_mismatch: boolean;
  identity_frames: VideoIdentityFrameSnapshot[];
  identity_metrics: VideoIdentityConsistencyMetrics | null;
  source_video_identity_consistency_validated: ValidationStatus;
};

export type MovieAnalysisRealVideoIdentityConsistencyValidationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE;
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
  real_video_model_generation_report_path: typeof REAL_VIDEO_MODEL_GENERATION_REPORT_PATH;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  video_identity_dir: typeof VIDEO_IDENTITY_DIR;
  video_identity_manifest_path: typeof VIDEO_IDENTITY_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  frame_count: number;
  face_identity_persistence: ValidationStatus;
  hairstyle_persistence: ValidationStatus;
  clothing_persistence: ValidationStatus;
  dna_persistence: ValidationStatus;
  frame_to_frame_identity_drift: ValidationStatus;
  video_identity_consistency: ValidationStatus;
  identity_break: boolean;
  character_swap: boolean;
  dna_mismatch: boolean;
  real_video_identity_consistency_validation_ready: ValidationStatus;
  certification_status: typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE | null;
  source_audits: SourceVideoIdentityConsistencyAudit[];
  final_verdict:
    | typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT
    | typeof REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_FAIL_VERDICT;
  issues: RealVideoIdentityConsistencyValidationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CONTAINER_BOXES = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

type Rgb = [number, number, number];

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function identitySignature(face: Rgb, hair: Rgb, clothing: Rgb): string {
  return createHash('sha256')
    .update(`${face[0]}:${face[1]}:${face[2]}:${hair[0]}:${hair[1]}:${hair[2]}:${clothing[0]}:${clothing[1]}:${clothing[2]}`)
    .digest('hex')
    .slice(0, 12);
}

function findBoxRecursive(
  buffer: Buffer,
  type: string,
  start = 0,
  end: number = buffer.length
): number {
  let offset = start;
  while (offset + 8 <= end) {
    const size = buffer.readUInt32BE(offset);
    if (size < 8 || offset + size > end) {
      return -1;
    }
    const boxType = buffer.toString('ascii', offset + 4, offset + 8);
    if (boxType === type) {
      return offset;
    }
    if (CONTAINER_BOXES.has(boxType)) {
      const inner = findBoxRecursive(buffer, type, offset + 8, offset + size);
      if (inner >= 0) {
        return inner;
      }
    }
    offset += size;
  }
  return -1;
}

function findTopLevelBox(buffer: Buffer, type: string): number {
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    if (size < 8) {
      return -1;
    }
    const boxType = buffer.toString('ascii', offset + 4, offset + 8);
    if (boxType === type) {
      return offset;
    }
    offset += size;
  }
  return -1;
}

function readStszSampleSizes(moovBuffer: Buffer): number[] {
  const stszOffset = findBoxRecursive(moovBuffer, 'stsz');
  if (stszOffset < 0) {
    return [];
  }
  const dataStart = stszOffset + 12;
  const sampleSize = moovBuffer.readUInt32BE(dataStart);
  const sampleCount = moovBuffer.readUInt32BE(dataStart + 4);
  if (sampleSize !== 0) {
    return Array.from({ length: sampleCount }, () => sampleSize);
  }
  const sizes: number[] = [];
  for (let index = 0; index < sampleCount; index += 1) {
    sizes.push(moovBuffer.readUInt32BE(dataStart + 8 + index * 4));
  }
  return sizes;
}

function readStcoSampleOffsets(moovBuffer: Buffer): number[] {
  const stcoOffset = findBoxRecursive(moovBuffer, 'stco');
  if (stcoOffset < 0) {
    return [];
  }
  const dataStart = stcoOffset + 12;
  const entryCount = moovBuffer.readUInt32BE(dataStart);
  const offsets: number[] = [];
  for (let index = 0; index < entryCount; index += 1) {
    offsets.push(moovBuffer.readUInt32BE(dataStart + 4 + index * 4));
  }
  return offsets;
}

export function extractPngSamplesFromMp4(mp4Buffer: Buffer): Buffer[] {
  const mdatOffset = findTopLevelBox(mp4Buffer, 'mdat');
  const moovOffset = findTopLevelBox(mp4Buffer, 'moov');
  if (mdatOffset < 0 || moovOffset < 0) {
    return [];
  }

  const moovSize = mp4Buffer.readUInt32BE(moovOffset);
  const moovBuffer = mp4Buffer.subarray(moovOffset, moovOffset + moovSize);
  const sampleSizes = readStszSampleSizes(moovBuffer);
  const sampleOffsets = readStcoSampleOffsets(moovBuffer);
  if (sampleSizes.length === 0 || sampleOffsets.length === 0) {
    return [];
  }

  const samples: Buffer[] = [];
  for (let index = 0; index < sampleSizes.length; index += 1) {
    const offset = sampleOffsets[Math.min(index, sampleOffsets.length - 1)];
    const size = sampleSizes[index];
    const sample = mp4Buffer.subarray(offset, offset + size);
    if (!sample.subarray(0, 8).equals(PNG_SIGNATURE)) {
      return [];
    }
    samples.push(sample);
  }
  return samples;
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

function extractIdentityFrame(
  pixels: Buffer,
  width: number,
  height: number,
  frameIndex: number
): VideoIdentityFrameSnapshot {
  const faceZone = zoneAverage(pixels, width, height, 0.38, 0.62, 0.4, 0.58);
  const hairZone = zoneAverage(pixels, width, height, 0.35, 0.65, 0.08, 0.28);
  const clothingZone = zoneAverage(pixels, width, height, 0.32, 0.68, 0.58, 0.88);
  const faceZoneVariance = zoneVariance(pixels, width, height, 0.38, 0.62, 0.4, 0.58);

  return {
    frame_index: frameIndex,
    face_zone_rgb: faceZone,
    hair_zone_rgb: hairZone,
    clothing_zone_rgb: clothingZone,
    identity_signature: identitySignature(faceZone, hairZone, clothingZone),
    face_zone_variance: faceZoneVariance,
  };
}

function computeDnaMismatchScore(
  generationResult: RealVideoModelGenerationResult,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): number {
  const expectedDnaId = `cinematic_dna_${sourceId.toLowerCase()}_v1`;
  const dnaIdMatch =
    generationResult.dna_binding.cinematic_dna_id === expectedDnaId &&
    generationResult.traceability.cinematic_dna_id === expectedDnaId;
  return dnaIdMatch ? 0 : 1;
}

function computeIdentityMetrics(
  frames: VideoIdentityFrameSnapshot[],
  generationResult: RealVideoModelGenerationResult,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): VideoIdentityConsistencyMetrics {
  const faceDrifts: number[] = [];
  const hairDrifts: number[] = [];
  const clothingDrifts: number[] = [];
  const identityDrifts: number[] = [];

  for (let index = 0; index < frames.length - 1; index += 1) {
    faceDrifts.push(
      colorDistance(frames[index].face_zone_rgb, frames[index + 1].face_zone_rgb) / 255
    );
    hairDrifts.push(
      colorDistance(frames[index].hair_zone_rgb, frames[index + 1].hair_zone_rgb) / 255
    );
    clothingDrifts.push(
      colorDistance(frames[index].clothing_zone_rgb, frames[index + 1].clothing_zone_rgb) / 255
    );
    identityDrifts.push(
      frames[index].identity_signature === frames[index + 1].identity_signature ? 0 : 0.12
    );
  }

  const anchor = frames[0];
  const anchorFaceDrifts = frames.map(
    (frame) => colorDistance(anchor.face_zone_rgb, frame.face_zone_rgb) / 255
  );
  const characterSwapScore = Math.max(...anchorFaceDrifts, 0);

  const maxAdjacentFaceDrift = Math.max(...faceDrifts, 0);
  const maxAdjacentHairDrift = Math.max(...hairDrifts, 0);
  const maxAdjacentClothingDrift = Math.max(...clothingDrifts, 0);
  const frameToFrameIdentityDrift = Math.max(
    ...identityDrifts,
    maxAdjacentFaceDrift * 0.45 + maxAdjacentHairDrift * 0.3 + maxAdjacentClothingDrift * 0.25
  );
  const dnaMismatchScore = computeDnaMismatchScore(generationResult, sourceId);

  const faceScore = clamp01(1 - maxAdjacentFaceDrift / MAX_FACE_IDENTITY_DRIFT);
  const hairScore = clamp01(1 - maxAdjacentHairDrift / MAX_HAIRSTYLE_DRIFT);
  const clothingScore = clamp01(1 - maxAdjacentClothingDrift / MAX_CLOTHING_DRIFT);
  const driftScore = clamp01(1 - frameToFrameIdentityDrift / MAX_FRAME_IDENTITY_DRIFT);
  const dnaScore = clamp01(1 - dnaMismatchScore / MAX_DNA_MISMATCH_SCORE);
  const swapScore = clamp01(1 - characterSwapScore / MAX_CHARACTER_SWAP_SCORE);
  const videoIdentityScore = clamp01(
    faceScore * 0.24 +
      hairScore * 0.2 +
      clothingScore * 0.2 +
      driftScore * 0.18 +
      dnaScore * 0.1 +
      swapScore * 0.08
  );

  return {
    max_adjacent_face_drift: maxAdjacentFaceDrift,
    max_adjacent_hair_drift: maxAdjacentHairDrift,
    max_adjacent_clothing_drift: maxAdjacentClothingDrift,
    anchor_face_drift: Math.max(...anchorFaceDrifts, 0),
    frame_to_frame_identity_drift: frameToFrameIdentityDrift,
    character_swap_score: characterSwapScore,
    dna_mismatch_score: dnaMismatchScore,
    video_identity_score: videoIdentityScore,
  };
}

function hasCharacterAdapters(result: RealVideoModelGenerationResult): boolean {
  return (
    result.adapter_binding.adapter_ids.some((id) => id.includes('storytelling_adapter')) &&
    result.adapter_binding.adapter_ids.some((id) => id.includes('emotion_adapter'))
  );
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

function failAudit(sourceId: string): SourceVideoIdentityConsistencyAudit {
  return {
    source_id: sourceId,
    face_identity_persistence: 'FAIL',
    hairstyle_persistence: 'FAIL',
    clothing_persistence: 'FAIL',
    dna_persistence: 'FAIL',
    frame_to_frame_identity_drift: 'FAIL',
    identity_break: true,
    character_swap: true,
    dna_mismatch: true,
    identity_frames: [],
    identity_metrics: null,
    source_video_identity_consistency_validated: 'FAIL',
  };
}

function auditSourceVideoIdentity(
  generationResult: RealVideoModelGenerationResult | undefined,
  projectRoot: string,
  sourceId: (typeof EXPECTED_SOURCE_VIDEO_IDS)[number]
): SourceVideoIdentityConsistencyAudit {
  if (!generationResult) {
    return failAudit(sourceId);
  }

  const mp4Path = path.join(projectRoot, generationResult.mp4_output_path);
  if (!fs.existsSync(mp4Path)) {
    return failAudit(sourceId);
  }

  const mp4Buffer = fs.readFileSync(mp4Path);
  const mp4Validation = validateMp4Buffer(mp4Buffer);
  if (!mp4Validation.valid) {
    return failAudit(sourceId);
  }

  const pngSamples = extractPngSamplesFromMp4(mp4Buffer);
  if (pngSamples.length !== generationResult.frame_count) {
    return failAudit(sourceId);
  }

  const identityFrames: VideoIdentityFrameSnapshot[] = [];
  for (let index = 0; index < pngSamples.length; index += 1) {
    const decoded = decodePngRgb(pngSamples[index]);
    if (!decoded) {
      return failAudit(sourceId);
    }
    identityFrames.push(
      extractIdentityFrame(decoded.pixels, decoded.width, decoded.height, index)
    );
  }

  const metrics = computeIdentityMetrics(identityFrames, generationResult, sourceId);
  const expectedDnaId = `cinematic_dna_${sourceId.toLowerCase()}_v1`;

  const faceIdentityPersistence =
    metrics.max_adjacent_face_drift <= MAX_FACE_IDENTITY_DRIFT &&
    identityFrames.every((frame) => frame.face_zone_variance >= MIN_FACE_ZONE_VARIANCE)
      ? 'PASS'
      : 'FAIL';

  const hairstylePersistence =
    metrics.max_adjacent_hair_drift <= MAX_HAIRSTYLE_DRIFT ? 'PASS' : 'FAIL';

  const clothingPersistence =
    metrics.max_adjacent_clothing_drift <= MAX_CLOTHING_DRIFT ? 'PASS' : 'FAIL';

  const dnaPersistence =
    generationResult.dna_binding.cinematic_dna_id === expectedDnaId &&
    generationResult.traceability.cinematic_dna_id === expectedDnaId &&
    metrics.dna_mismatch_score <= MAX_DNA_MISMATCH_SCORE &&
    hasCharacterAdapters(generationResult)
      ? 'PASS'
      : 'FAIL';

  const frameToFrameIdentityDrift =
    metrics.frame_to_frame_identity_drift <= MAX_FRAME_IDENTITY_DRIFT &&
    metrics.video_identity_score >= MIN_VIDEO_IDENTITY_SCORE
      ? 'PASS'
      : 'FAIL';

  const identityBreak =
    faceIdentityPersistence === 'FAIL' ||
    frameToFrameIdentityDrift === 'FAIL' ||
    metrics.anchor_face_drift > MAX_FACE_IDENTITY_DRIFT;
  const characterSwap =
    metrics.character_swap_score > MAX_CHARACTER_SWAP_SCORE ||
    hairstylePersistence === 'FAIL';
  const dnaMismatch =
    dnaPersistence === 'FAIL' || metrics.dna_mismatch_score > MAX_DNA_MISMATCH_SCORE;

  const checks: ValidationStatus[] = [
    faceIdentityPersistence,
    hairstylePersistence,
    clothingPersistence,
    dnaPersistence,
    frameToFrameIdentityDrift,
  ];

  return {
    source_id: sourceId,
    face_identity_persistence: faceIdentityPersistence,
    hairstyle_persistence: hairstylePersistence,
    clothing_persistence: clothingPersistence,
    dna_persistence: dnaPersistence,
    frame_to_frame_identity_drift: frameToFrameIdentityDrift,
    identity_break: identityBreak,
    character_swap: characterSwap,
    dna_mismatch: dnaMismatch,
    identity_frames: identityFrames,
    identity_metrics: metrics,
    source_video_identity_consistency_validated:
      checks.every((status) => status === 'PASS') &&
      !identityBreak &&
      !characterSwap &&
      !dnaMismatch
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceVideoIdentityConsistencyAudit[],
  field: keyof Omit<
    SourceVideoIdentityConsistencyAudit,
    | 'source_id'
    | 'identity_break'
    | 'character_swap'
    | 'dna_mismatch'
    | 'identity_frames'
    | 'identity_metrics'
    | 'source_video_identity_consistency_validated'
  >
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(
  report: MovieAnalysisRealVideoIdentityConsistencyValidationReport
): string {
  const lines = [
    '# Movie Analysis Real Video Identity Consistency Validation',
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
    `| face_identity_persistence | ${report.face_identity_persistence} |`,
    `| hairstyle_persistence | ${report.hairstyle_persistence} |`,
    `| clothing_persistence | ${report.clothing_persistence} |`,
    `| dna_persistence | ${report.dna_persistence} |`,
    `| frame_to_frame_identity_drift | ${report.frame_to_frame_identity_drift} |`,
    `| video_identity_consistency | ${report.video_identity_consistency} |`,
    `| identity_break | ${report.identity_break} |`,
    `| character_swap | ${report.character_swap} |`,
    `| dna_mismatch | ${report.dna_mismatch} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- face_identity_persistence: ${audit.face_identity_persistence}`,
      `- hairstyle_persistence: ${audit.hairstyle_persistence}`,
      `- clothing_persistence: ${audit.clothing_persistence}`,
      `- dna_persistence: ${audit.dna_persistence}`,
      `- frame_to_frame_identity_drift: ${audit.frame_to_frame_identity_drift}`,
      `- identity_break: ${audit.identity_break}`,
      `- character_swap: ${audit.character_swap}`,
      `- dna_mismatch: ${audit.dna_mismatch}`,
      `- frames: ${audit.identity_frames.length}`,
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
  issues: RealVideoIdentityConsistencyValidationIssue[],
  sourceAudits: SourceVideoIdentityConsistencyAudit[] = []
): MovieAnalysisRealVideoIdentityConsistencyValidationReport {
  const report: MovieAnalysisRealVideoIdentityConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-identity-consistency-validation-report-v1',
    phase: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_identity_manifest_path: VIDEO_IDENTITY_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    frame_count: 0,
    face_identity_persistence: 'FAIL',
    hairstyle_persistence: 'FAIL',
    clothing_persistence: 'FAIL',
    dna_persistence: 'FAIL',
    frame_to_frame_identity_drift: 'FAIL',
    video_identity_consistency: 'FAIL',
    identity_break: true,
    character_swap: true,
    dna_mismatch: true,
    real_video_identity_consistency_validation_ready: 'FAIL',
    certification_status: null,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoIdentityConsistencyValidation(
  projectRoot?: string
): MovieAnalysisRealVideoIdentityConsistencyValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoIdentityConsistencyValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const videoGenerationReport = loadUpstreamReport(root, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH);
  if (!videoGenerationReport) {
    issues.push({
      code: 'REAL_VIDEO_MODEL_GENERATION_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_MODEL_GENERATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (videoGenerationReport.final_verdict !== REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2F_010_NOT_PASS',
      message: `L2F-010 must have ${REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (videoGenerationReport.certification_status !== REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE) {
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
    const audit = auditSourceVideoIdentity(generationResult, root, sourceId);
    if (audit.source_video_identity_consistency_validated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_IDENTITY_FAIL',
        message: `Video identity consistency validation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.identity_break) {
      issues.push({
        code: 'IDENTITY_BREAK',
        message: `Identity break detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.character_swap) {
      issues.push({
        code: 'CHARACTER_SWAP',
        message: `Character swap detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.dna_mismatch) {
      issues.push({
        code: 'DNA_MISMATCH',
        message: `DNA mismatch detected in video for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    return audit;
  });

  const manifestEntries: VideoIdentityManifestEntry[] = sourceAudits.map((audit) => {
    const generationResult = generationResultBySource[audit.source_id];
    return {
      source_id: audit.source_id,
      mp4_output_path: generationResult?.mp4_output_path ?? '',
      frame_count: audit.identity_frames.length,
      frames: audit.identity_frames,
    };
  });

  fs.mkdirSync(path.join(root, VIDEO_IDENTITY_DIR), { recursive: true });
  for (const entry of manifestEntries) {
    fs.writeFileSync(
      path.join(root, VIDEO_IDENTITY_DIR, `${entry.source_id}-video-identity.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      'utf8'
    );
  }

  const identityManifest: MovieAnalysisRealVideoIdentityConsistencyManifest = {
    manifest_id: 'movie-analysis-real-video-identity-consistency-manifest-v1',
    phase: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE,
    generated_at: timestamp,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    source_count: manifestEntries.length,
    frame_count: manifestEntries.reduce((sum, entry) => sum + entry.frames.length, 0),
    entries: manifestEntries,
  };

  fs.writeFileSync(
    path.join(root, VIDEO_IDENTITY_MANIFEST_PATH),
    `${JSON.stringify(identityManifest, null, 2)}\n`,
    'utf8'
  );

  const faceIdentityPersistence = aggregateStatus(sourceAudits, 'face_identity_persistence');
  const hairstylePersistence = aggregateStatus(sourceAudits, 'hairstyle_persistence');
  const clothingPersistence = aggregateStatus(sourceAudits, 'clothing_persistence');
  const dnaPersistence = aggregateStatus(sourceAudits, 'dna_persistence');
  const frameToFrameIdentityDrift = aggregateStatus(
    sourceAudits,
    'frame_to_frame_identity_drift'
  );

  const identityBreak = sourceAudits.some((audit) => audit.identity_break);
  const characterSwap = sourceAudits.some((audit) => audit.character_swap);
  const dnaMismatch = sourceAudits.some((audit) => audit.dna_mismatch);

  const sourceCount = videoManifest.source_count;
  const frameCount = identityManifest.frame_count;

  const testManifestPath = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  const testManifest = fs.existsSync(testManifestPath)
    ? (JSON.parse(fs.readFileSync(testManifestPath, 'utf8')) as RealModelTestGenerationManifest)
    : null;
  const adapterCountFromManifest = testManifest?.adapter_count ?? 0;

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
  if (frameCount !== EXPECTED_VIDEO_IDENTITY_FRAME_COUNT) {
    issues.push({
      code: 'FRAME_COUNT_INVALID',
      message: `Expected frame_count=${EXPECTED_VIDEO_IDENTITY_FRAME_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: ValidationStatus[] = [
    faceIdentityPersistence,
    hairstylePersistence,
    clothingPersistence,
    dnaPersistence,
    frameToFrameIdentityDrift,
  ];

  const videoIdentityConsistency =
    gateChecks.every((status) => status === 'PASS') &&
    !identityBreak &&
    !characterSwap &&
    !dnaMismatch &&
    sourceAudits.every((audit) => audit.source_video_identity_consistency_validated === 'PASS')
      ? 'PASS'
      : 'FAIL';

  if (identityBreak || characterSwap || dnaMismatch) {
    issues.push({
      code: 'VIDEO_IDENTITY_BLOCK',
      message: 'Video identity consistency block triggered',
      severity: 'error',
    });
  }
  if (videoIdentityConsistency === 'FAIL') {
    issues.push({
      code: 'VIDEO_IDENTITY_CONSISTENCY_FAIL',
      message: 'Video identity consistency validation failed',
      severity: 'error',
    });
  }

  const realVideoIdentityConsistencyValidationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCountFromManifest === EXPECTED_ADAPTER_COUNT &&
    frameCount === EXPECTED_VIDEO_IDENTITY_FRAME_COUNT &&
    videoIdentityConsistency === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVideoIdentityConsistencyValidationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_VIDEO_IDENTITY_NOT_VALIDATED')
  ) {
    issues.push({
      code: 'REAL_VIDEO_IDENTITY_NOT_VALIDATED',
      message: 'Real video identity consistency is not validated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoIdentityConsistencyValidationReport = {
    report_id: 'movie-analysis-real-video-identity-consistency-validation-report-v1',
    phase: REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PHASE,
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
    real_video_model_generation_report_path: REAL_VIDEO_MODEL_GENERATION_REPORT_PATH,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    video_identity_dir: VIDEO_IDENTITY_DIR,
    video_identity_manifest_path: VIDEO_IDENTITY_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCountFromManifest,
    frame_count: frameCount,
    face_identity_persistence: faceIdentityPersistence,
    hairstyle_persistence: hairstylePersistence,
    clothing_persistence: clothingPersistence,
    dna_persistence: dnaPersistence,
    frame_to_frame_identity_drift: frameToFrameIdentityDrift,
    video_identity_consistency: videoIdentityConsistency,
    identity_break: identityBreak,
    character_swap: characterSwap,
    dna_mismatch: dnaMismatch,
    real_video_identity_consistency_validation_ready: realVideoIdentityConsistencyValidationReady,
    certification_status: pass ? REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_PASS_VERDICT
      : REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_IDENTITY_CONSISTENCY_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
