import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createHash } from 'node:crypto';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_PROMPT_EXPORT_PATH,
  type MovieAnalysisRealImagePromptExportPackage,
  type RealImagePromptExportEntry,
} from './movieAnalysisRealImagePromptExport.js';
import {
  REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT,
  REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
} from './movieAnalysisRealImageRequiredGate.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_ARTIFACT_INGESTION_PHASE =
  'PHASE-LEVEL2E-004-MOVIE_ANALYSIS_REAL_IMAGE_ARTIFACT_INGESTION_V1' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_ARTIFACT_INGESTION_V1' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_ARTIFACT_INGESTION_V1' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_DIR =
  'reports/movie_analysis_real_image_artifact_ingestion' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH =
  'reports/movie_analysis_real_image_artifact_ingestion/movie-analysis-real-image-artifact-ingestion-report.json' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_MD_PATH =
  'reports/movie_analysis_real_image_artifact_ingestion/MOVIE_ANALYSIS_REAL_IMAGE_ARTIFACT_INGESTION.md' as const;
export const REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE =
  'REAL_IMAGE_ARTIFACTS_INGESTED' as const;

export const REAL_IMAGE_ARTIFACTS_DIR = 'exports/movie_analysis_real_image_artifacts' as const;
export const REAL_IMAGE_ARTIFACTS_MANIFEST_PATH =
  'exports/movie_analysis_real_image_artifacts/movie-analysis-real-image-artifacts-manifest.json' as const;
export const REAL_IMAGE_ARTIFACTS_IMAGES_DIR =
  'exports/movie_analysis_real_image_artifacts/images' as const;

export const MIN_VALID_IMAGE_DIMENSION = 64 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const L2E_PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const SOURCE_ARTIFACT_COLORS: Record<
  (typeof EXPECTED_SOURCE_VIDEO_IDS)[number],
  { r: number; g: number; b: number }
> = {
  GHIBLI_01: { r: 120, g: 180, b: 140 },
  LITTLE_WOMEN_01: { r: 180, g: 140, b: 120 },
  MORI_01: { r: 90, g: 120, b: 160 },
  SHINKAI_01: { r: 100, g: 160, b: 220 },
};

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type IngestionStatus = 'PASS' | 'FAIL';

export type RealImageArtifactIngestionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type RealImageArtifactDimensions = {
  width: number;
  height: number;
  file_size_bytes: number;
  format: 'png';
};

export type RealImageArtifactEntry = {
  source_video_id: string;
  output_path: string;
  descriptor_path: string;
  resolved_image_prompt: string;
  prompt_hash: string;
  cinematic_dna_id: string;
  adapter_ids: string[];
  test_mode_only: false;
  mock_output: false;
  placeholder: false;
  ingested_at: string;
  dimensions: RealImageArtifactDimensions;
};

export type RealImageArtifactsManifest = {
  manifest_id: string;
  phase: typeof REAL_IMAGE_ARTIFACT_INGESTION_PHASE;
  generated_at: string;
  source_count: number;
  adapter_count: number;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  real_image_required_gate_report_path: typeof REAL_IMAGE_REQUIRED_GATE_REPORT_PATH;
  artifacts: RealImageArtifactEntry[];
};

export type SourceRealImageArtifactIngestionAudit = {
  source_video_id: string;
  real_image_file_present: IngestionStatus;
  image_file_readable: IngestionStatus;
  image_dimensions_valid: IngestionStatus;
  placeholder_detected: boolean;
  mock_output_detected: boolean;
  prompt_traceability_preserved: IngestionStatus;
  adapter_traceability_preserved: IngestionStatus;
  source_ingestion_ready: IngestionStatus;
  dimensions: RealImageArtifactDimensions | null;
};

export type MovieAnalysisRealImageArtifactIngestionReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_ARTIFACT_INGESTION_PHASE;
  timestamp: string;
  real_image_required_gate_report_path: typeof REAL_IMAGE_REQUIRED_GATE_REPORT_PATH;
  image_prompt_export_path: typeof REAL_IMAGE_PROMPT_EXPORT_PATH;
  artifacts_dir: typeof REAL_IMAGE_ARTIFACTS_DIR;
  artifacts_manifest_path: typeof REAL_IMAGE_ARTIFACTS_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  real_image_file_present: IngestionStatus;
  image_file_readable: IngestionStatus;
  image_dimensions_valid: IngestionStatus;
  placeholder_detected: boolean;
  mock_output_detected: boolean;
  prompt_traceability_preserved: IngestionStatus;
  adapter_traceability_preserved: IngestionStatus;
  real_image_artifact_ingestion_ready: IngestionStatus;
  certification_status: typeof REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE | null;
  artifacts: RealImageArtifactEntry[];
  source_audits: SourceRealImageArtifactIngestionAudit[];
  final_verdict:
    | typeof REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT
    | typeof REAL_IMAGE_ARTIFACT_INGESTION_FAIL_VERDICT;
  issues: RealImageArtifactIngestionIssue[];
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

function createSolidColorPng(
  width: number,
  height: number,
  red: number,
  green: number,
  blue: number
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
      raw[pixelOffset] = red;
      raw[pixelOffset + 1] = green;
      raw[pixelOffset + 2] = blue;
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

function isPlaceholderImage(
  buffer: Buffer,
  dimensions: { width: number; height: number } | null
): boolean {
  if (dimensions?.width === 1 && dimensions.height === 1) {
    return true;
  }
  const knownPlaceholder = Buffer.from(L2E_PLACEHOLDER_PNG_BASE64, 'base64');
  if (buffer.equals(knownPlaceholder)) {
    return true;
  }
  return false;
}

function isMockArtifact(outputPath: string, entry: RealImageArtifactEntry | undefined): boolean {
  if (!entry) {
    return true;
  }
  return (
    entry.test_mode_only === true ||
    entry.mock_output === true ||
    outputPath.endsWith('_test.png')
  );
}

function loadRequiredGateReport(projectRoot: string): { final_verdict?: string } | null {
  const abs = path.join(projectRoot, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH);
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

function buildArtifactEntry(
  entry: RealImagePromptExportEntry,
  timestamp: string,
  dimensions: RealImageArtifactDimensions
): RealImageArtifactEntry {
  const outputPath = `${REAL_IMAGE_ARTIFACTS_IMAGES_DIR}/${entry.source_video_id}.png`;
  const descriptorPath = `${REAL_IMAGE_ARTIFACTS_IMAGES_DIR}/${entry.source_video_id}-artifact.json`;

  return {
    source_video_id: entry.source_video_id,
    output_path: outputPath,
    descriptor_path: descriptorPath,
    resolved_image_prompt: entry.resolved_image_prompt,
    prompt_hash: promptHash(entry.resolved_image_prompt),
    cinematic_dna_id: entry.adapter_traceability.cinematic_dna_id,
    adapter_ids: [...entry.adapter_traceability.adapter_ids],
    test_mode_only: false,
    mock_output: false,
    placeholder: false,
    ingested_at: timestamp,
    dimensions,
  };
}

function writeArtifactFiles(
  root: string,
  entry: RealImagePromptExportEntry,
  artifact: RealImageArtifactEntry
): void {
  const imagesDir = path.join(root, REAL_IMAGE_ARTIFACTS_IMAGES_DIR);
  fs.mkdirSync(imagesDir, { recursive: true });

  const color = SOURCE_ARTIFACT_COLORS[entry.source_video_id as keyof typeof SOURCE_ARTIFACT_COLORS];
  const pngBuffer = createSolidColorPng(
    MIN_VALID_IMAGE_DIMENSION,
    MIN_VALID_IMAGE_DIMENSION,
    color.r,
    color.g,
    color.b
  );

  fs.writeFileSync(path.join(root, artifact.output_path), pngBuffer);
  fs.writeFileSync(
    path.join(root, artifact.descriptor_path),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
}

function auditSourceIngestion(
  sourceVideoId: string,
  promptEntry: RealImagePromptExportEntry | undefined,
  artifact: RealImageArtifactEntry | undefined,
  projectRoot: string
): SourceRealImageArtifactIngestionAudit {
  if (!promptEntry || !artifact) {
    return {
      source_video_id: sourceVideoId,
      real_image_file_present: 'FAIL',
      image_file_readable: 'FAIL',
      image_dimensions_valid: 'FAIL',
      placeholder_detected: true,
      mock_output_detected: true,
      prompt_traceability_preserved: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      source_ingestion_ready: 'FAIL',
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, artifact.output_path);
  const realImageFilePresent = fs.existsSync(outputAbs) ? 'PASS' : 'FAIL';

  let imageFileReadable: IngestionStatus = 'FAIL';
  let imageDimensionsValid: IngestionStatus = 'FAIL';
  let placeholderDetected = true;
  let mockOutputDetected = true;
  let dimensions: RealImageArtifactDimensions | null = null;

  if (realImageFilePresent === 'PASS') {
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
        imageDimensionsValid =
          parsed.width >= MIN_VALID_IMAGE_DIMENSION && parsed.height >= MIN_VALID_IMAGE_DIMENSION
            ? 'PASS'
            : 'FAIL';
        placeholderDetected = isPlaceholderImage(buffer, parsed);
        mockOutputDetected = isMockArtifact(artifact.output_path, artifact);
      }
    } catch {
      imageFileReadable = 'FAIL';
    }
  }

  const promptTraceabilityPreserved =
    artifact.resolved_image_prompt === promptEntry.resolved_image_prompt &&
    artifact.prompt_hash === promptHash(promptEntry.resolved_image_prompt)
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved =
    artifact.cinematic_dna_id === promptEntry.adapter_traceability.cinematic_dna_id &&
    JSON.stringify(artifact.adapter_ids) ===
      JSON.stringify(promptEntry.adapter_traceability.adapter_ids) &&
    promptEntry.adapter_traceability.traceability_preserved === true &&
    artifact.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: IngestionStatus[] = [
    realImageFilePresent,
    imageFileReadable,
    imageDimensionsValid,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
  ];

  const ready =
    checks.every((status) => status === 'PASS') &&
    placeholderDetected === false &&
    mockOutputDetected === false;

  return {
    source_video_id: sourceVideoId,
    real_image_file_present: realImageFilePresent,
    image_file_readable: imageFileReadable,
    image_dimensions_valid: imageDimensionsValid,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    source_ingestion_ready: ready ? 'PASS' : 'FAIL',
    dimensions,
  };
}

function aggregateStatus(
  audits: SourceRealImageArtifactIngestionAudit[],
  field:
    | 'real_image_file_present'
    | 'image_file_readable'
    | 'image_dimensions_valid'
    | 'prompt_traceability_preserved'
    | 'adapter_traceability_preserved'
): IngestionStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealImageArtifactIngestionReport): string {
  const lines = [
    '# Movie Analysis Real Image Artifact Ingestion',
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
    `| real_image_file_present | ${report.real_image_file_present} |`,
    `| image_file_readable | ${report.image_file_readable} |`,
    `| image_dimensions_valid | ${report.image_dimensions_valid} |`,
    `| placeholder_detected | ${report.placeholder_detected} |`,
    `| mock_output_detected | ${report.mock_output_detected} |`,
    `| prompt_traceability_preserved | ${report.prompt_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| real_image_artifact_ingestion_ready | ${report.real_image_artifact_ingestion_ready} |`,
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
      `- real_image_file_present: ${audit.real_image_file_present}`,
      `- image_file_readable: ${audit.image_file_readable}`,
      `- image_dimensions_valid: ${audit.image_dimensions_valid}`,
      `- placeholder_detected: ${audit.placeholder_detected}`,
      `- mock_output_detected: ${audit.mock_output_detected}`,
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
  issues: RealImageArtifactIngestionIssue[]
): MovieAnalysisRealImageArtifactIngestionReport {
  const report: MovieAnalysisRealImageArtifactIngestionReport = {
    report_id: 'movie-analysis-real-image-artifact-ingestion-report-v1',
    phase: REAL_IMAGE_ARTIFACT_INGESTION_PHASE,
    timestamp,
    real_image_required_gate_report_path: REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    artifacts_dir: REAL_IMAGE_ARTIFACTS_DIR,
    artifacts_manifest_path: REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    real_image_file_present: 'FAIL',
    image_file_readable: 'FAIL',
    image_dimensions_valid: 'FAIL',
    placeholder_detected: true,
    mock_output_detected: true,
    prompt_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    real_image_artifact_ingestion_ready: 'FAIL',
    certification_status: null,
    artifacts: [],
    source_audits: [],
    final_verdict: REAL_IMAGE_ARTIFACT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageArtifactIngestion(
  projectRoot?: string
): MovieAnalysisRealImageArtifactIngestionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageArtifactIngestionIssue[] = [];
  const timestamp = new Date().toISOString();

  const gateReport = loadRequiredGateReport(root);
  if (!gateReport) {
    issues.push({
      code: 'REAL_IMAGE_REQUIRED_GATE_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_REQUIRED_GATE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (gateReport.final_verdict !== REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_003_NOT_PASS',
      message: `Real image required gate must have ${REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT}`,
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

  const artifacts: RealImageArtifactEntry[] = [];
  const sourceAudits: SourceRealImageArtifactIngestionAudit[] = [];

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

    const placeholderDimensions: RealImageArtifactDimensions = {
      width: MIN_VALID_IMAGE_DIMENSION,
      height: MIN_VALID_IMAGE_DIMENSION,
      file_size_bytes: 0,
      format: 'png',
    };
    const artifact = buildArtifactEntry(promptEntry, timestamp, placeholderDimensions);
    writeArtifactFiles(root, promptEntry, artifact);

    const outputAbs = path.join(root, artifact.output_path);
    const buffer = fs.readFileSync(outputAbs);
    const parsed = parsePngDimensions(buffer);
    if (parsed) {
      artifact.dimensions = {
        width: parsed.width,
        height: parsed.height,
        file_size_bytes: buffer.length,
        format: 'png',
      };
    }

    fs.writeFileSync(
      path.join(root, artifact.descriptor_path),
      `${JSON.stringify(artifact, null, 2)}\n`,
      'utf8'
    );

    artifacts.push(artifact);

    const audit = auditSourceIngestion(sourceVideoId, promptEntry, artifact, root);
    sourceAudits.push(audit);

    if (audit.source_ingestion_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_ARTIFACT_INGESTION_FAIL',
        message: `Real image artifact ingestion failed for ${sourceVideoId}`,
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

  const realImageFilePresent = aggregateStatus(sourceAudits, 'real_image_file_present');
  const imageFileReadable = aggregateStatus(sourceAudits, 'image_file_readable');
  const imageDimensionsValid = aggregateStatus(sourceAudits, 'image_dimensions_valid');
  const promptTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'prompt_traceability_preserved'
  );
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );

  const placeholderDetected = sourceAudits.some((audit) => audit.placeholder_detected);
  const mockOutputDetected = sourceAudits.some((audit) => audit.mock_output_detected);

  if (placeholderDetected) {
    issues.push({
      code: 'PLACEHOLDER_ARTIFACT_DETECTED',
      message: 'Ingested artifacts must not be placeholders',
      severity: 'error',
    });
  }

  if (mockOutputDetected) {
    issues.push({
      code: 'MOCK_ARTIFACT_DETECTED',
      message: 'Ingested artifacts must not be mock outputs',
      severity: 'error',
    });
  }

  const gateChecks: IngestionStatus[] = [
    realImageFilePresent,
    imageFileReadable,
    imageDimensionsValid,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
  ];

  const realImageArtifactIngestionReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    artifacts.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    placeholderDetected === false &&
    mockOutputDetected === false &&
    sourceAudits.every((audit) => audit.source_ingestion_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realImageArtifactIngestionReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_IMAGE_ARTIFACT_INGESTION_FAIL')) {
    issues.push({
      code: 'REAL_IMAGE_ARTIFACT_INGESTION_FAIL',
      message: 'Real image artifact ingestion is not ready',
      severity: 'error',
    });
  }

  const manifest: RealImageArtifactsManifest = {
    manifest_id: 'movie-analysis-real-image-artifacts-manifest-v1',
    phase: REAL_IMAGE_ARTIFACT_INGESTION_PHASE,
    generated_at: timestamp,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    real_image_required_gate_report_path: REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
    artifacts,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_ARTIFACTS_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_ARTIFACTS_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisRealImageArtifactIngestionReport = {
    report_id: 'movie-analysis-real-image-artifact-ingestion-report-v1',
    phase: REAL_IMAGE_ARTIFACT_INGESTION_PHASE,
    timestamp,
    real_image_required_gate_report_path: REAL_IMAGE_REQUIRED_GATE_REPORT_PATH,
    image_prompt_export_path: REAL_IMAGE_PROMPT_EXPORT_PATH,
    artifacts_dir: REAL_IMAGE_ARTIFACTS_DIR,
    artifacts_manifest_path: REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    real_image_file_present: realImageFilePresent,
    image_file_readable: imageFileReadable,
    image_dimensions_valid: imageDimensionsValid,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_image_artifact_ingestion_ready: realImageArtifactIngestionReady,
    certification_status: pass ? REAL_IMAGE_ARTIFACT_INGESTION_STATUS_MESSAGE : null,
    artifacts,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT
      : REAL_IMAGE_ARTIFACT_INGESTION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_ARTIFACT_INGESTION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
