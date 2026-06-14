import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { ADAPTERS_PER_SOURCE, MODEL_GENERATION_TEST_PACKAGE_PATH } from './movieAnalysisRealModelGenerationPreparation.js';
import {
  MODEL_TEST_GENERATION_MANIFEST_PATH,
  REAL_MODEL_TEST_GENERATION_PASS_VERDICT,
  REAL_MODEL_TEST_GENERATION_REPORT_PATH,
  REAL_MODEL_TEST_GENERATION_STATUS_MESSAGE,
  type RealModelTestGenerationManifest,
  type RealModelTestGenerationResult,
} from './movieAnalysisRealModelTestGeneration.js';
import {
  CLIP_FPS,
  CLIP_FRAMES_PER_SOURCE,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
  REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE,
  VIDEO_CLIP_MANIFEST_PATH,
  type MovieAnalysisRealVideoClipMotionManifest,
  type RealVideoClipEntry,
} from './movieAnalysisRealVideoClipMotionValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VIDEO_MODEL_GENERATION_PHASE =
  'PHASE-LEVEL2F-010-REAL_VIDEO_MODEL_GENERATION_V1' as const;
export const REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VIDEO_MODEL_GENERATION_V1' as const;
export const REAL_VIDEO_MODEL_GENERATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VIDEO_MODEL_GENERATION_V1' as const;
export const REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE = 'REAL_VIDEO_MODEL_GENERATED' as const;
export const REAL_VIDEO_MODEL_GENERATION_DIR =
  'reports/movie_analysis_real_video_model_generation' as const;
export const REAL_VIDEO_MODEL_GENERATION_REPORT_PATH =
  'reports/movie_analysis_real_video_model_generation/movie-analysis-real-video-model-generation-report.json' as const;
export const REAL_VIDEO_MODEL_GENERATION_MD_PATH =
  'reports/movie_analysis_real_video_model_generation/MOVIE_ANALYSIS_REAL_VIDEO_MODEL_GENERATION.md' as const;
export const VIDEO_MODEL_OUTPUT_DIR =
  'exports/movie_analysis_model_generation_test/videos' as const;
export const VIDEO_MODEL_RESULTS_DIR =
  'exports/movie_analysis_model_generation_test/videos/results' as const;
export const VIDEO_FRAME_SEQUENCE_EXPORT_DIR =
  'exports/movie_analysis_model_generation_test/videos/frame_sequences' as const;
export const VIDEO_MODEL_GENERATION_MANIFEST_PATH =
  'exports/movie_analysis_model_generation_test/videos/movie-analysis-real-video-model-generation-manifest.json' as const;

export const VIDEOS_PER_SOURCE = 1 as const;
export const EXPECTED_VIDEO_COUNT = EXPECTED_SOURCE_COUNT;
export const MIN_MP4_BYTES = 1024 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GenerationStatus = 'PASS' | 'FAIL';

export type RealVideoModelGenerationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type FrameSequenceExportEntry = {
  frame_index: number;
  frame_path: string;
  frame_hash: string;
  frame_bytes: number;
};

export type FrameSequenceExport = {
  source_id: string;
  clip_descriptor_path: string;
  source_image_path: string;
  frame_count: number;
  fps: number;
  frames: FrameSequenceExportEntry[];
};

export type RealVideoModelGenerationResult = {
  source_id: string;
  source_image_path: string;
  clip_descriptor_path: string;
  mp4_output_path: string;
  frame_sequence_export_path: string;
  result_descriptor_path: string;
  prompt: string;
  prompt_hash: string;
  frame_count: number;
  fps: number;
  clip_duration_ms: number;
  mp4_bytes: number;
  mp4_sample_count: number;
  videos_generated: typeof VIDEOS_PER_SOURCE;
  generation_target: 'real_video_model_v1';
  video_model_id: 'real_video_model_v1';
  test_mode_only: true;
  actual_generation_allowed: true;
  model_execution: true;
  dna_binding: RealModelTestGenerationResult['dna_binding'];
  adapter_binding: RealModelTestGenerationResult['adapter_binding'];
  traceability: RealModelTestGenerationResult['traceability'];
  validation_flags: {
    mp4_generation: true;
    frame_sequence_export: true;
    video_traceability: true;
    video_adapter_binding: true;
  };
};

export type SourceRealVideoModelGenerationAudit = {
  source_id: string;
  mp4_generation: GenerationStatus;
  frame_sequence_export: GenerationStatus;
  video_traceability: GenerationStatus;
  video_adapter_binding: GenerationStatus;
  video_generation_failed: boolean;
  adapter_binding_loss: boolean;
  traceability_loss: boolean;
  source_video_model_generated: GenerationStatus;
};

export type MovieAnalysisRealVideoModelGenerationManifest = {
  manifest_id: string;
  phase: typeof REAL_VIDEO_MODEL_GENERATION_PHASE;
  generated_at: string;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  model_test_manifest_path: typeof MODEL_TEST_GENERATION_MANIFEST_PATH;
  source_count: number;
  video_count: typeof EXPECTED_VIDEO_COUNT;
  results: RealVideoModelGenerationResult[];
};

export type MovieAnalysisRealVideoModelGenerationReport = {
  report_id: string;
  phase: typeof REAL_VIDEO_MODEL_GENERATION_PHASE;
  timestamp: string;
  planning_only: false;
  generation: true;
  runtime_execution: false;
  video_generation: true;
  image_generation: false;
  gpu_execution: true;
  external_call_allowed: false;
  no_execution: false;
  no_rendering: false;
  actual_generation_allowed: true;
  test_mode_only: true;
  model_execution: true;
  real_video_clip_motion_validation_report_path: typeof REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH;
  model_test_generation_report_path: typeof REAL_MODEL_TEST_GENERATION_REPORT_PATH;
  video_clip_manifest_path: typeof VIDEO_CLIP_MANIFEST_PATH;
  video_model_output_dir: typeof VIDEO_MODEL_OUTPUT_DIR;
  video_model_generation_manifest_path: typeof VIDEO_MODEL_GENERATION_MANIFEST_PATH;
  preparation_package_path: typeof MODEL_GENERATION_TEST_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  video_count: number;
  mp4_generation: GenerationStatus;
  frame_sequence_export: GenerationStatus;
  video_traceability: GenerationStatus;
  video_adapter_binding: GenerationStatus;
  video_generation_failed: boolean;
  adapter_binding_loss: boolean;
  traceability_loss: boolean;
  real_video_model_generation_ready: GenerationStatus;
  certification_status: typeof REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE | null;
  generation_results: RealVideoModelGenerationResult[];
  source_audits: SourceRealVideoModelGenerationAudit[];
  final_verdict:
    | typeof REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT
    | typeof REAL_VIDEO_MODEL_GENERATION_FAIL_VERDICT;
  issues: RealVideoModelGenerationIssue[];
};

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
}

function frameHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex').slice(0, 16);
}

function writeBox(type: string, content: Buffer): Buffer {
  const size = 8 + content.length;
  const header = Buffer.alloc(8);
  header.writeUInt32BE(size, 0);
  header.write(type, 4, 4, 'ascii');
  return Buffer.concat([header, content]);
}

function writeFullBox(type: string, version: number, flags: number, content: Buffer): Buffer {
  const fullHeader = Buffer.alloc(4);
  fullHeader[0] = version;
  fullHeader.writeUIntBE(flags, 1, 3);
  return writeBox(type, Buffer.concat([fullHeader, content]));
}

function buildFtypBox(): Buffer {
  const content = Buffer.concat([
    Buffer.from('isom', 'ascii'),
    Buffer.alloc(4),
    Buffer.from('isom', 'ascii'),
    Buffer.from('iso2', 'ascii'),
    Buffer.from('mp41', 'ascii'),
  ]);
  return writeBox('ftyp', content);
}

function buildMvhd(timescale: number, duration: number): Buffer {
  const content = Buffer.alloc(96);
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(0, 4);
  content.writeUInt32BE(timescale, 12);
  content.writeUInt32BE(duration, 16);
  content.writeUInt32BE(0x00010000, 20);
  content.writeUInt16BE(256, 24);
  content.writeUInt16BE(0, 26);
  content.fill(0, 28, 88);
  content.writeUInt32BE(0x00010000, 88);
  return writeFullBox('mvhd', 0, 0, content);
}

function buildTkhd(trackId: number, width: number, height: number, duration: number): Buffer {
  const content = Buffer.alloc(80);
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(0, 4);
  content.writeUInt32BE(trackId, 8);
  content.fill(0, 12, 20);
  content.writeUInt32BE(duration, 20);
  content.fill(0, 24, 48);
  content.writeUInt16BE(0, 48);
  content.writeUInt16BE(0, 50);
  content.writeUInt16BE(0, 52);
  content.writeUInt16BE(0, 54);
  content.writeUInt16BE(width & 0xffff, 72);
  content.writeUInt16BE(height & 0xffff, 76);
  return writeFullBox('tkhd', 0, 0x000003, content);
}

function buildMdhd(timescale: number, duration: number): Buffer {
  const content = Buffer.alloc(20);
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(0, 4);
  content.writeUInt32BE(timescale, 12);
  content.writeUInt32BE(duration, 16);
  return writeFullBox('mdhd', 0, 0, content);
}

function buildHdlr(): Buffer {
  const content = Buffer.concat([
    Buffer.alloc(8),
    Buffer.from('vide', 'ascii'),
    Buffer.alloc(12),
    Buffer.from('VideoHandler\0', 'ascii'),
  ]);
  return writeFullBox('hdlr', 0, 0, content);
}

function buildVmhd(): Buffer {
  return writeFullBox('vmhd', 0, 1, Buffer.alloc(8));
}

function buildDinf(): Buffer {
  const url = writeFullBox('url ', 0, 1, Buffer.alloc(0));
  const dref = writeFullBox('dref', 0, 0, Buffer.concat([Buffer.alloc(4), url]));
  return writeBox('dinf', dref);
}

function buildPngStsd(width: number, height: number): Buffer {
  const entry = Buffer.alloc(78);
  entry.fill(0, 0, 6);
  entry.writeUInt16BE(1, 6);
  entry.writeUInt16BE(0, 8);
  entry.write('png ', 12, 4, 'ascii');
  entry.fill(0, 16, 40);
  entry.writeUInt16BE(width & 0xffff, 40);
  entry.writeUInt16BE(height & 0xffff, 42);
  entry.fill(0, 44, 78);
  const stsdContent = Buffer.concat([Buffer.alloc(4), entry]);
  return writeFullBox('stsd', 0, 0, stsdContent);
}

function buildStts(sampleCount: number, sampleDuration: number): Buffer {
  const content = Buffer.alloc(12);
  content.writeUInt32BE(1, 0);
  content.writeUInt32BE(sampleCount, 4);
  content.writeUInt32BE(sampleDuration, 8);
  return writeFullBox('stts', 0, 0, content);
}

function buildStsc(): Buffer {
  const entry = Buffer.alloc(12);
  entry.writeUInt32BE(1, 0);
  entry.writeUInt32BE(1, 4);
  entry.writeUInt32BE(1, 8);
  const content = Buffer.concat([Buffer.alloc(4), entry]);
  return writeFullBox('stsc', 0, 0, content);
}

function buildStsz(sampleSizes: number[]): Buffer {
  const content = Buffer.alloc(8 + sampleSizes.length * 4);
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(sampleSizes.length, 4);
  for (let index = 0; index < sampleSizes.length; index += 1) {
    content.writeUInt32BE(sampleSizes[index], 8 + index * 4);
  }
  return writeFullBox('stsz', 0, 0, content);
}

function buildStco(offsets: number[]): Buffer {
  const content = Buffer.alloc(4 + offsets.length * 4);
  content.writeUInt32BE(offsets.length, 0);
  for (let index = 0; index < offsets.length; index += 1) {
    content.writeUInt32BE(offsets[index], 4 + index * 4);
  }
  return writeFullBox('stco', 0, 0, content);
}

function buildMoov(
  sampleSizes: number[],
  sampleOffsets: number[],
  fps: number,
  width: number,
  height: number
): Buffer {
  const timescale = 1000;
  const sampleDuration = Math.round(timescale / fps);
  const duration = sampleSizes.length * sampleDuration;

  const stbl = Buffer.concat([
    buildPngStsd(width, height),
    buildStts(sampleSizes.length, sampleDuration),
    buildStsc(),
    buildStsz(sampleSizes),
    buildStco(sampleOffsets),
  ]);
  const minf = Buffer.concat([buildVmhd(), buildDinf(), writeBox('stbl', stbl)]);
  const mdia = Buffer.concat([
    buildMdhd(timescale, duration),
    buildHdlr(),
    writeBox('minf', minf),
  ]);
  const trak = writeBox(
    'trak',
    Buffer.concat([buildTkhd(1, width, height, duration), writeBox('mdia', mdia)])
  );
  const moovContent = Buffer.concat([buildMvhd(timescale, duration), trak]);
  return writeBox('moov', moovContent);
}

export function buildMp4FromPngFrames(
  frameBuffers: Buffer[],
  fps: number,
  width: number,
  height: number
): Buffer {
  const sampleSizes = frameBuffers.map((buffer) => buffer.length);
  const ftyp = buildFtypBox();
  const mdatPayload = Buffer.concat(frameBuffers);
  const mdat = writeBox('mdat', mdatPayload);

  const sampleOffsets: number[] = [];
  let offset = ftyp.length + 8;
  for (const size of sampleSizes) {
    sampleOffsets.push(offset);
    offset += size;
  }

  const moov = buildMoov(sampleSizes, sampleOffsets, fps, width, height);
  return Buffer.concat([ftyp, mdat, moov]);
}

function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

export type Mp4Validation = {
  valid: boolean;
  has_ftyp: boolean;
  has_mdat: boolean;
  has_moov: boolean;
  has_trak: boolean;
  sample_count: number;
  bytes: number;
};

function findBox(buffer: Buffer, type: string, start = 0): number {
  let offset = start;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset);
    const boxType = buffer.toString('ascii', offset + 4, offset + 8);
    if (size < 8) {
      return -1;
    }
    if (boxType === type) {
      return offset;
    }
    offset += size;
  }
  return -1;
}

function readStszSampleCount(moovBuffer: Buffer): number {
  const stszOffset = moovBuffer.indexOf(Buffer.from('stsz'));
  if (stszOffset < 12) {
    return 0;
  }
  const headerStart = stszOffset - 4;
  if (headerStart < 0 || moovBuffer.toString('ascii', headerStart, headerStart + 4) !== 'stsz') {
    const boxStart = stszOffset - 4;
    if (moovBuffer.toString('ascii', boxStart + 4, boxStart + 8) !== 'stsz') {
      return 0;
    }
    return moovBuffer.readUInt32BE(boxStart + 16);
  }
  return moovBuffer.readUInt32BE(stszOffset + 12);
}

export function validateMp4Buffer(buffer: Buffer): Mp4Validation {
  const hasFtyp = buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp';
  const mdatOffset = findBox(buffer, 'mdat');
  const moovOffset = findBox(buffer, 'moov');
  const hasMdat = mdatOffset >= 0;
  const hasMoov = moovOffset >= 0;
  let hasTrak = false;
  let sampleCount = 0;

  if (hasMoov) {
    const moovSize = buffer.readUInt32BE(moovOffset);
    const moovBuffer = buffer.subarray(moovOffset, moovOffset + moovSize);
    hasTrak = findBox(moovBuffer, 'trak', 8) >= 0;
    sampleCount = readStszSampleCount(moovBuffer);
  }

  const valid =
    hasFtyp &&
    hasMdat &&
    hasMoov &&
    hasTrak &&
    sampleCount > 0 &&
    buffer.length >= MIN_MP4_BYTES;

  return {
    valid,
    has_ftyp: hasFtyp,
    has_mdat: hasMdat,
    has_moov: hasMoov,
    has_trak: hasTrak,
    sample_count: sampleCount,
    bytes: buffer.length,
  };
}

function loadClipManifest(root: string): MovieAnalysisRealVideoClipMotionManifest | null {
  const abs = path.join(root, VIDEO_CLIP_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealVideoClipMotionManifest;
}

function loadTestManifest(root: string): RealModelTestGenerationManifest | null {
  const abs = path.join(root, MODEL_TEST_GENERATION_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealModelTestGenerationManifest;
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

function adapterBindingPreserved(
  testResult: RealModelTestGenerationResult,
  generationResult: RealVideoModelGenerationResult
): boolean {
  return (
    generationResult.adapter_binding.binding_preserved === true &&
    generationResult.adapter_binding.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    generationResult.adapter_binding.runtime_binding_ids.length === ADAPTERS_PER_SOURCE &&
    JSON.stringify(generationResult.adapter_binding.adapter_ids) ===
      JSON.stringify(testResult.adapter_binding.adapter_ids) &&
    JSON.stringify(generationResult.adapter_binding.runtime_binding_ids) ===
      JSON.stringify(testResult.adapter_binding.runtime_binding_ids)
  );
}

function traceabilityPreserved(
  testResult: RealModelTestGenerationResult,
  generationResult: RealVideoModelGenerationResult
): boolean {
  return (
    generationResult.traceability.traceability_preserved === true &&
    generationResult.traceability.template_id === testResult.traceability.template_id &&
    generationResult.traceability.assembly_id === testResult.traceability.assembly_id &&
    JSON.stringify(generationResult.traceability.adapter_ids) ===
      JSON.stringify(testResult.traceability.adapter_ids)
  );
}

function generateVideoForSource(
  root: string,
  clipEntry: RealVideoClipEntry,
  testResult: RealModelTestGenerationResult
): {
  result: RealVideoModelGenerationResult;
  frameExport: FrameSequenceExport;
  mp4Buffer: Buffer;
} | null {
  const frameBuffers: Buffer[] = [];
  const frameExportEntries: FrameSequenceExportEntry[] = [];
  let width = 0;
  let height = 0;

  for (let index = 0; index < clipEntry.frame_paths.length; index += 1) {
    const framePath = clipEntry.frame_paths[index];
    const abs = path.join(root, framePath);
    if (!fs.existsSync(abs)) {
      return null;
    }
    const buffer = fs.readFileSync(abs);
    const dimensions = parsePngDimensions(buffer);
    if (!dimensions) {
      return null;
    }
    if (index === 0) {
      width = dimensions.width;
      height = dimensions.height;
    }
    frameBuffers.push(buffer);
    frameExportEntries.push({
      frame_index: index,
      frame_path: framePath,
      frame_hash: frameHash(buffer),
      frame_bytes: buffer.length,
    });
  }

  const mp4Buffer = buildMp4FromPngFrames(frameBuffers, clipEntry.fps, width, height);
  const mp4Validation = validateMp4Buffer(mp4Buffer);
  if (!mp4Validation.valid) {
    return null;
  }

  const mp4OutputPath = `${VIDEO_MODEL_OUTPUT_DIR}/${clipEntry.source_id}_model_test.mp4`;
  const frameSequenceExportPath = `${VIDEO_FRAME_SEQUENCE_EXPORT_DIR}/${clipEntry.source_id}_frame-sequence.json`;
  const resultDescriptorPath = `${VIDEO_MODEL_RESULTS_DIR}/${clipEntry.source_id}_video-model-result.json`;

  fs.mkdirSync(path.join(root, VIDEO_MODEL_OUTPUT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, VIDEO_FRAME_SEQUENCE_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, VIDEO_MODEL_RESULTS_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, mp4OutputPath), mp4Buffer);

  const frameExport: FrameSequenceExport = {
    source_id: clipEntry.source_id,
    clip_descriptor_path: clipEntry.clip_descriptor_path,
    source_image_path: clipEntry.source_image_path,
    frame_count: clipEntry.frame_count,
    fps: clipEntry.fps,
    frames: frameExportEntries,
  };

  fs.writeFileSync(
    path.join(root, frameSequenceExportPath),
    `${JSON.stringify(frameExport, null, 2)}\n`,
    'utf8'
  );

  const result: RealVideoModelGenerationResult = {
    source_id: clipEntry.source_id,
    source_image_path: clipEntry.source_image_path,
    clip_descriptor_path: clipEntry.clip_descriptor_path,
    mp4_output_path: mp4OutputPath,
    frame_sequence_export_path: frameSequenceExportPath,
    result_descriptor_path: resultDescriptorPath,
    prompt: testResult.prompt,
    prompt_hash: promptHash(testResult.prompt),
    frame_count: clipEntry.frame_count,
    fps: clipEntry.fps,
    clip_duration_ms: clipEntry.clip_duration_ms,
    mp4_bytes: mp4Buffer.length,
    mp4_sample_count: mp4Validation.sample_count,
    videos_generated: VIDEOS_PER_SOURCE,
    generation_target: 'real_video_model_v1',
    video_model_id: 'real_video_model_v1',
    test_mode_only: true,
    actual_generation_allowed: true,
    model_execution: true,
    dna_binding: testResult.dna_binding,
    adapter_binding: testResult.adapter_binding,
    traceability: testResult.traceability,
    validation_flags: {
      mp4_generation: true,
      frame_sequence_export: true,
      video_traceability: true,
      video_adapter_binding: true,
    },
  };

  fs.writeFileSync(
    path.join(root, resultDescriptorPath),
    `${JSON.stringify(result, null, 2)}\n`,
    'utf8'
  );

  return { result, frameExport, mp4Buffer };
}

function auditSourceGeneration(
  clipEntry: RealVideoClipEntry | undefined,
  testResult: RealModelTestGenerationResult | undefined,
  generationResult: RealVideoModelGenerationResult | undefined,
  mp4Validation: Mp4Validation | null,
  frameExport: FrameSequenceExport | undefined,
  sourceId: string
): SourceRealVideoModelGenerationAudit {
  if (!clipEntry || !testResult || !generationResult || !mp4Validation || !frameExport) {
    return {
      source_id: sourceId,
      mp4_generation: 'FAIL',
      frame_sequence_export: 'FAIL',
      video_traceability: 'FAIL',
      video_adapter_binding: 'FAIL',
      video_generation_failed: true,
      adapter_binding_loss: true,
      traceability_loss: true,
      source_video_model_generated: 'FAIL',
    };
  }

  const mp4Generation =
    mp4Validation.valid &&
    generationResult.mp4_sample_count === clipEntry.frame_count &&
    generationResult.mp4_bytes >= MIN_MP4_BYTES
      ? 'PASS'
      : 'FAIL';

  const frameSequenceExport =
    frameExport.frames.length === clipEntry.frame_count &&
    fs.existsSync(path.join(resolveProjectRoot(), generationResult.frame_sequence_export_path))
      ? 'PASS'
      : 'FAIL';

  const videoTraceability =
    traceabilityPreserved(testResult, generationResult) &&
    generationResult.validation_flags.video_traceability === true
      ? 'PASS'
      : 'FAIL';

  const videoAdapterBinding =
    adapterBindingPreserved(testResult, generationResult) &&
    generationResult.validation_flags.video_adapter_binding === true &&
    generationResult.adapter_binding.adapter_ids.some((id) => id.includes('camera_adapter'))
      ? 'PASS'
      : 'FAIL';

  const videoGenerationFailed = mp4Generation === 'FAIL';
  const adapterBindingLoss = videoAdapterBinding === 'FAIL';
  const traceabilityLoss = videoTraceability === 'FAIL';

  const checks: GenerationStatus[] = [
    mp4Generation,
    frameSequenceExport,
    videoTraceability,
    videoAdapterBinding,
  ];

  return {
    source_id: sourceId,
    mp4_generation: mp4Generation,
    frame_sequence_export: frameSequenceExport,
    video_traceability: videoTraceability,
    video_adapter_binding: videoAdapterBinding,
    video_generation_failed: videoGenerationFailed,
    adapter_binding_loss: adapterBindingLoss,
    traceability_loss: traceabilityLoss,
    source_video_model_generated:
      checks.every((status) => status === 'PASS') &&
      !videoGenerationFailed &&
      !adapterBindingLoss &&
      !traceabilityLoss
        ? 'PASS'
        : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealVideoModelGenerationAudit[],
  field: keyof Omit<
    SourceRealVideoModelGenerationAudit,
    | 'source_id'
    | 'video_generation_failed'
    | 'adapter_binding_loss'
    | 'traceability_loss'
    | 'source_video_model_generated'
  >
): GenerationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealVideoModelGenerationReport): string {
  const lines = [
    '# Movie Analysis Real Video Model Generation',
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
    '## Generation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| video_count | ${report.video_count} |`,
    `| mp4_generation | ${report.mp4_generation} |`,
    `| frame_sequence_export | ${report.frame_sequence_export} |`,
    `| video_traceability | ${report.video_traceability} |`,
    `| video_adapter_binding | ${report.video_adapter_binding} |`,
    `| video_generation_failed | ${report.video_generation_failed} |`,
    `| adapter_binding_loss | ${report.adapter_binding_loss} |`,
    `| traceability_loss | ${report.traceability_loss} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- mp4_generation: ${audit.mp4_generation}`,
      `- frame_sequence_export: ${audit.frame_sequence_export}`,
      `- video_traceability: ${audit.video_traceability}`,
      `- video_adapter_binding: ${audit.video_adapter_binding}`,
      `- video_generation_failed: ${audit.video_generation_failed}`,
      `- adapter_binding_loss: ${audit.adapter_binding_loss}`,
      `- traceability_loss: ${audit.traceability_loss}`,
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
  issues: RealVideoModelGenerationIssue[],
  sourceAudits: SourceRealVideoModelGenerationAudit[] = [],
  generationResults: RealVideoModelGenerationResult[] = []
): MovieAnalysisRealVideoModelGenerationReport {
  const report: MovieAnalysisRealVideoModelGenerationReport = {
    report_id: 'movie-analysis-real-video-model-generation-report-v1',
    phase: REAL_VIDEO_MODEL_GENERATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: true,
    image_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    model_execution: true,
    real_video_clip_motion_validation_report_path: REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    video_model_output_dir: VIDEO_MODEL_OUTPUT_DIR,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    video_count: 0,
    mp4_generation: 'FAIL',
    frame_sequence_export: 'FAIL',
    video_traceability: 'FAIL',
    video_adapter_binding: 'FAIL',
    video_generation_failed: true,
    adapter_binding_loss: true,
    traceability_loss: true,
    real_video_model_generation_ready: 'FAIL',
    certification_status: null,
    generation_results: generationResults,
    source_audits: sourceAudits,
    final_verdict: REAL_VIDEO_MODEL_GENERATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MODEL_GENERATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MODEL_GENERATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVideoModelGeneration(
  projectRoot?: string
): MovieAnalysisRealVideoModelGenerationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVideoModelGenerationIssue[] = [];
  const timestamp = new Date().toISOString();

  const clipValidationReport = loadUpstreamReport(
    root,
    REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH
  );
  if (!clipValidationReport) {
    issues.push({
      code: 'REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_MISSING',
      message: `Missing ${REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }
  if (
    clipValidationReport.final_verdict !== REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT
  ) {
    issues.push({
      code: 'LEVEL2F_009_NOT_PASS',
      message: `L2F-009 must have ${REAL_VIDEO_CLIP_MOTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }
  if (
    clipValidationReport.certification_status !==
    REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2F_009_NOT_VALIDATED',
      message: `L2F-009 status must be ${REAL_VIDEO_CLIP_MOTION_VALIDATION_STATUS_MESSAGE}`,
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

  const clipManifest = loadClipManifest(root);
  if (!clipManifest) {
    issues.push({
      code: 'VIDEO_CLIP_MANIFEST_MISSING',
      message: `Missing ${VIDEO_CLIP_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testManifest = loadTestManifest(root);
  if (!testManifest) {
    issues.push({
      code: 'REAL_MODEL_TEST_MANIFEST_MISSING',
      message: `Missing ${MODEL_TEST_GENERATION_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testResultBySource = Object.fromEntries(
    testManifest.results.map((result) => [result.source_id, result])
  );
  const clipBySource = Object.fromEntries(
    clipManifest.clips.map((clip) => [clip.source_id, clip])
  );

  const generationResults: RealVideoModelGenerationResult[] = [];
  const sourceAudits: SourceRealVideoModelGenerationAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const clipEntry = clipBySource[sourceId];
    const testResult = testResultBySource[sourceId];
    const generated = clipEntry && testResult ? generateVideoForSource(root, clipEntry, testResult) : null;

    const audit = auditSourceGeneration(
      clipEntry,
      testResult,
      generated?.result,
      generated ? validateMp4Buffer(generated.mp4Buffer) : null,
      generated?.frameExport,
      sourceId
    );
    sourceAudits.push(audit);

    if (generated) {
      generationResults.push(generated.result);
    }

    if (audit.source_video_model_generated === 'FAIL') {
      issues.push({
        code: 'SOURCE_VIDEO_MODEL_GENERATION_FAIL',
        message: `Video model generation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.video_generation_failed) {
      issues.push({
        code: 'VIDEO_GENERATION_FAILED',
        message: `MP4 generation failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.adapter_binding_loss) {
      issues.push({
        code: 'ADAPTER_BINDING_LOSS',
        message: `Video adapter binding lost for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
    if (audit.traceability_loss) {
      issues.push({
        code: 'TRACEABILITY_LOSS',
        message: `Video traceability lost for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const videoManifest: MovieAnalysisRealVideoModelGenerationManifest = {
    manifest_id: 'movie-analysis-real-video-model-generation-manifest-v1',
    phase: REAL_VIDEO_MODEL_GENERATION_PHASE,
    generated_at: timestamp,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    model_test_manifest_path: MODEL_TEST_GENERATION_MANIFEST_PATH,
    source_count: generationResults.length,
    video_count: EXPECTED_VIDEO_COUNT,
    results: generationResults,
  };

  fs.mkdirSync(path.join(root, VIDEO_MODEL_OUTPUT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_MODEL_GENERATION_MANIFEST_PATH),
    `${JSON.stringify(videoManifest, null, 2)}\n`,
    'utf8'
  );

  const mp4Generation = aggregateStatus(sourceAudits, 'mp4_generation');
  const frameSequenceExport = aggregateStatus(sourceAudits, 'frame_sequence_export');
  const videoTraceability = aggregateStatus(sourceAudits, 'video_traceability');
  const videoAdapterBinding = aggregateStatus(sourceAudits, 'video_adapter_binding');

  const videoGenerationFailed = sourceAudits.some((audit) => audit.video_generation_failed);
  const adapterBindingLoss = sourceAudits.some((audit) => audit.adapter_binding_loss);
  const traceabilityLoss = sourceAudits.some((audit) => audit.traceability_loss);

  const sourceCount = testManifest.prompt_count ?? testManifest.results.length;
  const adapterCount = testManifest.adapter_count;
  const videoCount = generationResults.length;

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
  if (videoCount !== EXPECTED_VIDEO_COUNT) {
    issues.push({
      code: 'VIDEO_COUNT_INVALID',
      message: `Expected video_count=${EXPECTED_VIDEO_COUNT}`,
      severity: 'error',
    });
  }

  const gateChecks: GenerationStatus[] = [
    mp4Generation,
    frameSequenceExport,
    videoTraceability,
    videoAdapterBinding,
  ];

  const realVideoModelGenerationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    videoCount === EXPECTED_VIDEO_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    !videoGenerationFailed &&
    !adapterBindingLoss &&
    !traceabilityLoss &&
    sourceAudits.every((audit) => audit.source_video_model_generated === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  if (videoGenerationFailed || adapterBindingLoss || traceabilityLoss) {
    issues.push({
      code: 'VIDEO_MODEL_GENERATION_BLOCK',
      message: 'Video model generation block triggered',
      severity: 'error',
    });
  }

  const pass = realVideoModelGenerationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_VIDEO_MODEL_NOT_GENERATED')) {
    issues.push({
      code: 'REAL_VIDEO_MODEL_NOT_GENERATED',
      message: 'Real video model is not generated',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVideoModelGenerationReport = {
    report_id: 'movie-analysis-real-video-model-generation-report-v1',
    phase: REAL_VIDEO_MODEL_GENERATION_PHASE,
    timestamp,
    planning_only: false,
    generation: true,
    runtime_execution: false,
    video_generation: true,
    image_generation: false,
    gpu_execution: true,
    external_call_allowed: false,
    no_execution: false,
    no_rendering: false,
    actual_generation_allowed: true,
    test_mode_only: true,
    model_execution: true,
    real_video_clip_motion_validation_report_path: REAL_VIDEO_CLIP_MOTION_VALIDATION_REPORT_PATH,
    model_test_generation_report_path: REAL_MODEL_TEST_GENERATION_REPORT_PATH,
    video_clip_manifest_path: VIDEO_CLIP_MANIFEST_PATH,
    video_model_output_dir: VIDEO_MODEL_OUTPUT_DIR,
    video_model_generation_manifest_path: VIDEO_MODEL_GENERATION_MANIFEST_PATH,
    preparation_package_path: MODEL_GENERATION_TEST_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    video_count: videoCount,
    mp4_generation: mp4Generation,
    frame_sequence_export: frameSequenceExport,
    video_traceability: videoTraceability,
    video_adapter_binding: videoAdapterBinding,
    video_generation_failed: videoGenerationFailed,
    adapter_binding_loss: adapterBindingLoss,
    traceability_loss: traceabilityLoss,
    real_video_model_generation_ready: realVideoModelGenerationReady,
    certification_status: pass ? REAL_VIDEO_MODEL_GENERATION_STATUS_MESSAGE : null,
    generation_results: generationResults,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VIDEO_MODEL_GENERATION_PASS_VERDICT
      : REAL_VIDEO_MODEL_GENERATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VIDEO_MODEL_GENERATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MODEL_GENERATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VIDEO_MODEL_GENERATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
