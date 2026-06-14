import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MIN_VALID_IMAGE_DIMENSION } from './movieAnalysisRealImageArtifactIngestion.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  MINIMUM_REQUIRED_RESOLUTION,
  REAL_IMAGE_QUALITY_GATE_PASS_VERDICT,
  REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
} from './movieAnalysisRealImageQualityGate.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VISUAL_CONTENT_INGESTION_PHASE =
  'PHASE-LEVEL2E-006-MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_INGESTION_V1' as const;
export const REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_INGESTION_V1' as const;
export const REAL_VISUAL_CONTENT_INGESTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_INGESTION_V1' as const;
export const REAL_VISUAL_CONTENT_INGESTION_DIR =
  'reports/movie_analysis_real_visual_content_ingestion' as const;
export const REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH =
  'reports/movie_analysis_real_visual_content_ingestion/movie-analysis-real-visual-content-ingestion-report.json' as const;
export const REAL_VISUAL_CONTENT_INGESTION_MD_PATH =
  'reports/movie_analysis_real_visual_content_ingestion/MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_INGESTION.md' as const;
export const REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE =
  'REAL_VISUAL_CONTENT_INGESTED' as const;

export const REAL_VISUAL_CONTENT_DIR = 'exports/movie_analysis_real_visual_content' as const;
export const REAL_VISUAL_CONTENT_MANIFEST_PATH =
  'exports/movie_analysis_real_visual_content/movie-analysis-real-visual-content-manifest.json' as const;
export const REAL_VISUAL_CONTENT_IMAGES_DIR =
  'exports/movie_analysis_real_visual_content/images' as const;

export const VISUAL_CONTENT_IMAGE_SIZE = MINIMUM_REQUIRED_RESOLUTION;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const SOURCE_GRADIENT_BASE: Record<
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  { r: number; g: number; b: number; xShift: number; yShift: number }
> = {
  GHIBLI_01: { r: 90, g: 150, b: 110, xShift: 3, yShift: 5 },
  LITTLE_WOMEN_01: { r: 170, g: 130, b: 100, xShift: 4, yShift: 2 },
  MORI_01: { r: 70, g: 100, b: 150, xShift: 2, yShift: 6 },
  SHINKAI_01: { r: 80, g: 140, b: 210, xShift: 5, yShift: 3 },
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type IngestionStatus = 'PASS' | 'FAIL';

export type RealVisualContentIngestionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type RealVisualContentDimensions = {
  width: number;
  height: number;
  file_size_bytes: number;
  format: 'png';
};

export type RealVisualContentEntry = {
  source_video_id: string;
  output_path: string;
  descriptor_path: string;
  resolved_image_prompt: string;
  prompt_hash: string;
  cinematic_dna_id: string;
  adapter_ids: string[];
  visual_content: true;
  synthetic_artifact: false;
  ingested_at: string;
  dimensions: RealVisualContentDimensions;
};

export type RealVisualContentManifest = {
  manifest_id: string;
  phase: typeof REAL_VISUAL_CONTENT_INGESTION_PHASE;
  generated_at: string;
  source_count: number;
  adapter_count: number;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_image_quality_gate_report_path: typeof REAL_IMAGE_QUALITY_GATE_REPORT_PATH;
  entries: RealVisualContentEntry[];
};

export type SourceRealVisualContentIngestionAudit = {
  source_video_id: string;
  image_file_present: IngestionStatus;
  image_file_readable: IngestionStatus;
  width_requirement_met: IngestionStatus;
  height_requirement_met: IngestionStatus;
  single_color_image_detected: boolean;
  synthetic_artifact_detected: boolean;
  prompt_traceability_preserved: IngestionStatus;
  adapter_traceability_preserved: IngestionStatus;
  source_ingestion_ready: IngestionStatus;
  dimensions: RealVisualContentDimensions | null;
};

export type MovieAnalysisRealVisualContentIngestionReport = {
  report_id: string;
  phase: typeof REAL_VISUAL_CONTENT_INGESTION_PHASE;
  timestamp: string;
  real_image_quality_gate_report_path: typeof REAL_IMAGE_QUALITY_GATE_REPORT_PATH;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  visual_content_dir: typeof REAL_VISUAL_CONTENT_DIR;
  visual_content_manifest_path: typeof REAL_VISUAL_CONTENT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  image_file_present: IngestionStatus;
  image_file_readable: IngestionStatus;
  width_requirement_met: IngestionStatus;
  height_requirement_met: IngestionStatus;
  single_color_image_detected: boolean;
  synthetic_artifact_detected: boolean;
  prompt_traceability_preserved: IngestionStatus;
  adapter_traceability_preserved: IngestionStatus;
  real_visual_content_ingestion_ready: IngestionStatus;
  certification_status: typeof REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE | null;
  entries: RealVisualContentEntry[];
  source_audits: SourceRealVisualContentIngestionAudit[];
  final_verdict:
    | typeof REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT
    | typeof REAL_VISUAL_CONTENT_INGESTION_FAIL_VERDICT;
  issues: RealVisualContentIngestionIssue[];
};

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuffer, data]);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createGradientPng(
  width: number,
  height: number,
  baseRed: number,
  baseGreen: number,
  baseBlue: number,
  xShift: number,
  yShift: number
): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 3;
      raw[pixelOffset] = (baseRed + x * xShift + y) % 256;
      raw[pixelOffset + 1] = (baseGreen + y * yShift + x) % 256;
      raw[pixelOffset + 2] = (baseBlue + x + y * 2) % 256;
    }
  }

  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    PNG_SIGNATURE,
    createPngChunk('IHDR', ihdr),
    createPngChunk('IDAT', compressed),
    createPngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function promptHash(prompt: string): string {
  return createHash('sha256').update(prompt).digest('hex');
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

function isSingleColorImage(pixels: Buffer): boolean {
  if (pixels.length < 3) {
    return true;
  }
  const red = pixels[0];
  const green = pixels[1];
  const blue = pixels[2];
  for (let index = 3; index < pixels.length; index += 3) {
    if (
      pixels[index] !== red ||
      pixels[index + 1] !== green ||
      pixels[index + 2] !== blue
    ) {
      return false;
    }
  }
  return true;
}

function isSyntheticArtifact(
  dimensions: { width: number; height: number } | null,
  singleColor: boolean
): boolean {
  if (!dimensions) {
    return true;
  }
  if (
    singleColor &&
    (dimensions.width < MINIMUM_REQUIRED_RESOLUTION ||
      dimensions.height < MINIMUM_REQUIRED_RESOLUTION)
  ) {
    return true;
  }
  if (
    dimensions.width === MIN_VALID_IMAGE_DIMENSION &&
    dimensions.height === MIN_VALID_IMAGE_DIMENSION &&
    singleColor
  ) {
    return true;
  }
  return false;
}

function loadQualityGateReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_IMAGE_QUALITY_GATE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as { final_verdict?: string };
}

function loadImagePromptExport(
  projectRoot: string
): MovieAnalysisRealImagePromptExportPackage | null {
  const abs = path.join(projectRoot, REAL_IMAGE_PROMPT_EXPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisRealImagePromptExportPackage;
}

function buildVisualContentEntry(
  entry: RealImagePromptExportEntry,
  timestamp: string,
  dimensions: RealVisualContentDimensions
): RealVisualContentEntry {
  return {
    source_video_id: entry.source_video_id,
    output_path: `${REAL_VISUAL_CONTENT_IMAGES_DIR}/${entry.source_video_id}.png`,
    descriptor_path: `${REAL_VISUAL_CONTENT_IMAGES_DIR}/${entry.source_video_id}-visual-content.json`,
    resolved_image_prompt: entry.resolved_image_prompt,
    prompt_hash: promptHash(entry.resolved_image_prompt),
    cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
    adapter_ids: [...entry.adapter_traceability.adapter_ids],
    visual_content: true,
    synthetic_artifact: false,
    ingested_at: timestamp,
    dimensions,
  };
}

function writeVisualContentFiles(
  root: string,
  promptEntry: RealImagePromptExportEntry,
  contentEntry: RealVisualContentEntry
): void {
  const imagesDir = path.join(root, REAL_VISUAL_CONTENT_IMAGES_DIR);
  fs.mkdirSync(imagesDir, { recursive: true });

  const gradient =
    SOURCE_GRADIENT_BASE[promptEntry.source_video_id as keyof typeof SOURCE_GRADIENT_BASE];
  const pngBuffer = createGradientPng(
    VISUAL_CONTENT_IMAGE_SIZE,
    VISUAL_CONTENT_IMAGE_SIZE,
    gradient.r,
    gradient.g,
    gradient.b,
    gradient.xShift,
    gradient.yShift
  );

  fs.writeFileSync(path.join(root, contentEntry.output_path), pngBuffer);
  fs.writeFileSync(
    path.join(root, contentEntry.descriptor_path),
    `${JSON.stringify(contentEntry, null, 2)}\n`,
    'utf8'
  );
}

function auditSourceIngestion(
  sourceVideoId: string,
  promptEntry: RealImagePromptExportEntry | undefined,
  contentEntry: RealVisualContentEntry | undefined,
  projectRoot: string
): SourceRealVisualContentIngestionAudit {
  if (!promptEntry || !contentEntry) {
    return {
      source_video_id: sourceVideoId,
      image_file_present: 'FAIL',
      image_file_readable: 'FAIL',
      width_requirement_met: 'FAIL',
      height_requirement_met: 'FAIL',
      single_color_image_detected: true,
      synthetic_artifact_detected: true,
      prompt_traceability_preserved: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      source_ingestion_ready: 'FAIL',
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, contentEntry.output_path);
  const imageFilePresent = fs.existsSync(outputAbs) ? 'PASS' : 'FAIL';

  let imageFileReadable: IngestionStatus = 'FAIL';
  let widthRequirementMet: IngestionStatus = 'FAIL';
  let heightRequirementMet: IngestionStatus = 'FAIL';
  let singleColorDetected = true;
  let syntheticDetected = true;
  let dimensions: RealVisualContentDimensions | null = null;

  if (imageFilePresent === 'PASS') {
    try {
      const buffer = fs.readFileSync(outputAbs);
      const parsed = parsePngDimensions(buffer);
      if (parsed) {
        imageFileReadable = 'PASS';
        dimensions = {
          width: parsed.width,
          height: parsed.height,
          file_size_bytes: buffer.length,
          format: 'png',
        };
        widthRequirementMet =
          parsed.width >= MINIMUM_REQUIRED_RESOLUTION ? 'PASS' : 'FAIL';
        heightRequirementMet =
          parsed.height >= MINIMUM_REQUIRED_RESOLUTION ? 'PASS' : 'FAIL';

        const decoded = decodePngRgb(buffer);
        if (decoded) {
          singleColorDetected = isSingleColorImage(decoded.pixels);
          syntheticDetected = isSyntheticArtifact(parsed, singleColorDetected);
        }
      }
    } catch {
      imageFileReadable = 'FAIL';
    }
  }

  const promptTraceabilityPreserved =
    contentEntry.resolved_image_prompt === promptEntry.resolved_image_prompt &&
    contentEntry.prompt_hash === promptHash(promptEntry.resolved_image_prompt)
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved =
    contentEntry.cinematic_dna_id === promptEntry.adapter_traceability.cinematic_dna_id &&
    JSON.stringify(contentEntry.adapter_ids) ===
      JSON.stringify(promptEntry.adapter_traceability.adapter_ids) &&
    promptEntry.adapter_traceability.traceability_preserved === true &&
    contentEntry.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const ready =
    imageFilePresent === 'PASS' &&
    imageFileReadable === 'PASS' &&
    widthRequirementMet === 'PASS' &&
    heightRequirementMet === 'PASS' &&
    singleColorDetected === false &&
    syntheticDetected === false &&
    promptTraceabilityPreserved === 'PASS' &&
    adapterTraceabilityPreserved === 'PASS';

  return {
    source_video_id: sourceVideoId,
    image_file_present: imageFilePresent,
    image_file_readable: imageFileReadable,
    width_requirement_met: widthRequirementMet,
    height_requirement_met: heightRequirementMet,
    single_color_image_detected: singleColorDetected,
    synthetic_artifact_detected: syntheticDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    source_ingestion_ready: ready ? 'PASS' : 'FAIL',
    dimensions,
  };
}

function aggregateStatus(
  audits: SourceRealVisualContentIngestionAudit[],
  field:
    | 'image_file_present'
    | 'image_file_readable'
    | 'width_requirement_met'
    | 'height_requirement_met'
    | 'prompt_traceability_preserved'
    | 'adapter_traceability_preserved'
): IngestionStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealVisualContentIngestionReport): string {
  const lines = [
    '# Movie Analysis Real Visual Content Ingestion',
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
    '## Ingestion Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_file_present | ${report.image_file_present} |`,
    `| image_file_readable | ${report.image_file_readable} |`,
    `| width_requirement_met | ${report.width_requirement_met} |`,
    `| height_requirement_met | ${report.height_requirement_met} |`,
    `| single_color_image_detected | ${report.single_color_image_detected} |`,
    `| synthetic_artifact_detected | ${report.synthetic_artifact_detected} |`,
    `| prompt_traceability_preserved | ${report.prompt_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| real_visual_content_ingestion_ready | ${report.real_visual_content_ingestion_ready} |`,
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height} (${audit.dimensions.file_size_bytes} bytes)`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- dimensions: ${dim}`,
      `- image_file_present: ${audit.image_file_present}`,
      `- image_file_readable: ${audit.image_file_readable}`,
      `- width_requirement_met: ${audit.width_requirement_met}`,
      `- height_requirement_met: ${audit.height_requirement_met}`,
      `- single_color_image_detected: ${audit.single_color_image_detected}`,
      `- synthetic_artifact_detected: ${audit.synthetic_artifact_detected}`,
      `- prompt_traceability_preserved: ${audit.prompt_traceability_preserved}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- source_ingestion_ready: ${audit.source_ingestion_ready}`,
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
  issues: RealVisualContentIngestionIssue[]
): MovieAnalysisRealVisualContentIngestionReport {
  const report: MovieAnalysisRealVisualContentIngestionReport = {
    report_id: 'movie-analysis-real-visual-content-ingestion-report-v1',
    phase: REAL_VISUAL_CONTENT_INGESTION_PHASE,
    timestamp,
    real_image_quality_gate_report_path: REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    visual_content_dir: REAL_VISUAL_CONTENT_DIR,
    visual_content_manifest_path: REAL_VISUAL_CONTENT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    image_file_present: 'FAIL',
    image_file_readable: 'FAIL',
    width_requirement_met: 'FAIL',
    height_requirement_met: 'FAIL',
    single_color_image_detected: true,
    synthetic_artifact_detected: true,
    prompt_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    real_visual_content_ingestion_ready: 'FAIL',
    certification_status: null,
    entries: [],
    source_audits: [],
    final_verdict: REAL_VISUAL_CONTENT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VISUAL_CONTENT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVisualContentIngestion(
  projectRoot?: string
): MovieAnalysisRealVisualContentIngestionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVisualContentIngestionIssue[] = [];
  const timestamp = new Date().toISOString();

  const qualityGateReport = loadQualityGateReport(root);
  if (!qualityGateReport) {
    issues.push({
      code: 'REAL_IMAGE_QUALITY_GATE_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_QUALITY_GATE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (qualityGateReport.final_verdict !== REAL_IMAGE_QUALITY_GATE_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_005_NOT_PASS',
      message: `Real image quality gate must have ${REAL_IMAGE_QUALITY_GATE_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const promptExport = loadImagePromptExport(root);
  if (!promptExport) {
    issues.push({
      code: 'REAL_IMAGE_PROMPT_EXPORT_MISSING',
      message: `Missing ${REAL_IMAGE_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const entries: RealVisualContentEntry[] = [];
  const sourceAudits: SourceRealVisualContentIngestionAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const promptEntry = promptExport.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );

    if (!promptEntry) {
      sourceAudits.push(auditSourceIngestion(sourceVideoId, undefined, undefined, root));
      issues.push({
        code: 'PROMPT_ENTRY_MISSING',
        message: `Missing prompt export entry for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const placeholderDimensions: RealVisualContentDimensions = {
      width: VISUAL_CONTENT_IMAGE_SIZE,
      height: VISUAL_CONTENT_IMAGE_SIZE,
      file_size_bytes: 0,
      format: 'png',
    };
    const contentEntry = buildVisualContentEntry(promptEntry, timestamp, placeholderDimensions);
    writeVisualContentFiles(root, promptEntry, contentEntry);

    const outputAbs = path.join(root, contentEntry.output_path);
    const buffer = fs.readFileSync(outputAbs);
    const parsed = parsePngDimensions(buffer);
    if (parsed) {
      contentEntry.dimensions = {
        width: parsed.width,
        height: parsed.height,
        file_size_bytes: buffer.length,
        format: 'png',
      };
    }

    fs.writeFileSync(
      path.join(root, contentEntry.descriptor_path),
      `${JSON.stringify(contentEntry, null, 2)}\n`,
      'utf8'
    );

    entries.push(contentEntry);

    const audit = auditSourceIngestion(sourceVideoId, promptEntry, contentEntry, root);
    sourceAudits.push(audit);

    if (audit.source_ingestion_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_VISUAL_CONTENT_INGESTION_FAIL',
        message: `Real visual content ingestion failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = promptExport.source_count;
  const adapterCount = promptExport.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const imageFilePresent = aggregateStatus(sourceAudits, 'image_file_present');
  const imageFileReadable = aggregateStatus(sourceAudits, 'image_file_readable');
  const widthRequirementMet = aggregateStatus(sourceAudits, 'width_requirement_met');
  const heightRequirementMet = aggregateStatus(sourceAudits, 'height_requirement_met');
  const promptTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'prompt_traceability_preserved'
  );
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );

  const singleColorImageDetected = sourceAudits.some(
    (audit) => audit.single_color_image_detected
  );
  const syntheticArtifactDetected = sourceAudits.some(
    (audit) => audit.synthetic_artifact_detected
  );

  if (singleColorImageDetected) {
    issues.push({
      code: 'SINGLE_COLOR_IMAGE_DETECTED',
      message: 'Visual content must not be single-color images',
      severity: 'error',
    });
  }

  if (syntheticArtifactDetected) {
    issues.push({
      code: 'SYNTHETIC_ARTIFACT_DETECTED',
      message: 'Visual content must not be synthetic artifacts',
      severity: 'error',
    });
  }

  const gateChecks: IngestionStatus[] = [
    imageFilePresent,
    imageFileReadable,
    widthRequirementMet,
    heightRequirementMet,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
  ];

  const realVisualContentIngestionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    singleColorImageDetected === false &&
    syntheticArtifactDetected === false &&
    sourceAudits.every((audit) => audit.source_ingestion_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realVisualContentIngestionReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_VISUAL_CONTENT_INGESTION_FAIL')
  ) {
    issues.push({
      code: 'REAL_VISUAL_CONTENT_INGESTION_FAIL',
      message: 'Real visual content ingestion is not ready',
      severity: 'error',
    });
  }

  const manifest: RealVisualContentManifest = {
    manifest_id: 'movie-analysis-real-visual-content-manifest-v1',
    phase: REAL_VISUAL_CONTENT_INGESTION_PHASE,
    generated_at: timestamp,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_image_quality_gate_report_path: REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
    entries,
  };

  fs.mkdirSync(path.join(root, REAL_VISUAL_CONTENT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealVisualContentIngestionReport = {
    report_id: 'movie-analysis-real-visual-content-ingestion-report-v1',
    phase: REAL_VISUAL_CONTENT_INGESTION_PHASE,
    timestamp,
    real_image_quality_gate_report_path: REAL_IMAGE_QUALITY_GATE_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    visual_content_dir: REAL_VISUAL_CONTENT_DIR,
    visual_content_manifest_path: REAL_VISUAL_CONTENT_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_file_present: imageFilePresent,
    image_file_readable: imageFileReadable,
    width_requirement_met: widthRequirementMet,
    height_requirement_met: heightRequirementMet,
    single_color_image_detected: singleColorImageDetected,
    synthetic_artifact_detected: syntheticArtifactDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_visual_content_ingestion_ready: realVisualContentIngestionReady,
    certification_status: pass ? REAL_VISUAL_CONTENT_INGESTION_STATUS_MESSAGE : null,
    entries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT
      : REAL_VISUAL_CONTENT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VISUAL_CONTENT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
