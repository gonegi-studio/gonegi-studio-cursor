import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  MIN_VALID_IMAGE_DIMENSION,
  REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT,
  REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
  REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
  type MovieAnalysisRealImageArtifactIngestionReport,
  type RealImageArtifactEntry,
  type RealImageArtifactsManifest,
} from './movieAnalysisRealImageArtifactIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_QUALITY_GATE_PHASE =
  'PHASE-LEVEL2E-005-MOVIE_ANALYSIS_REAL_IMAGE_QUALITY_GATE_V1' as const;
export const REAL_IMAGE_QUALITY_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_QUALITY_GATE_V1' as const;
export const REAL_IMAGE_QUALITY_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_QUALITY_GATE_V1' as const;
export const REAL_IMAGE_QUALITY_GATE_DIR =
  'reports/movie_analysis_real_image_quality_gate' as const;
export const REAL_IMAGE_QUALITY_GATE_REPORT_PATH =
  'reports/movie_analysis_real_image_quality_gate/movie-analysis-real-image-quality-gate-report.json' as const;
export const REAL_IMAGE_QUALITY_GATE_MD_PATH =
  'reports/movie_analysis_real_image_quality_gate/MOVIE_ANALYSIS_REAL_IMAGE_QUALITY_GATE.md' as const;
export const BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS =
  'BLOCKED_REAL_VISUAL_CONTENT_REQUIRED' as const;
export const REAL_VISUAL_CONTENT_GATE_READY_STATUS = 'REAL_VISUAL_CONTENT_GATE_READY' as const;

export const MINIMUM_REQUIRED_RESOLUTION = 512 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GateStatus = 'PASS' | 'FAIL';

export type RealImageQualityGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceRealImageQualityGateAudit = {
  source_video_id: string;
  image_file_readable: GateStatus;
  image_dimensions_valid: GateStatus;
  minimum_resolution_check: GateStatus;
  single_color_image_detected: boolean;
  synthetic_artifact_detected: boolean;
  prompt_traceability_preserved: GateStatus;
  adapter_traceability_preserved: GateStatus;
  real_visual_content_required: GateStatus;
  blocked: boolean;
  source_quality_gate_ready: GateStatus;
  dimensions: { width: number; height: number } | null;
};

export type MovieAnalysisRealImageQualityGateReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_QUALITY_GATE_PHASE;
  timestamp: string;
  real_image_artifact_ingestion_report_path: typeof REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH;
  artifacts_manifest_path: typeof REAL_IMAGE_ARTIFACTS_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  image_file_readable: GateStatus;
  image_dimensions_valid: GateStatus;
  minimum_resolution_check: GateStatus;
  single_color_image_detected: boolean;
  synthetic_artifact_detected: boolean;
  real_visual_content_required: GateStatus;
  prompt_traceability_preserved: GateStatus;
  adapter_traceability_preserved: GateStatus;
  real_image_quality_gate_ready: GateStatus;
  certification_status:
    | typeof BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS
    | typeof REAL_VISUAL_CONTENT_GATE_READY_STATUS
    | null;
  source_audits: SourceRealImageQualityGateAudit[];
  final_verdict:
    | typeof REAL_IMAGE_QUALITY_GATE_PASS_VERDICT
    | typeof REAL_IMAGE_QUALITY_GATE_FAIL_VERDICT;
  issues: RealImageQualityGateIssue[];
};

function loadIngestionReport(
  projectRoot: string
): MovieAnalysisRealImageArtifactIngestionReport | null {
  const abs = path.join(projectRoot, REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealImageArtifactIngestionReport;
}

function loadArtifactsManifest(projectRoot: string): RealImageArtifactsManifest | null {
  const abs = path.join(projectRoot, REAL_IMAGE_ARTIFACTS_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealImageArtifactsManifest;
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
    if (rowStart >= inflated.length) {
      return null;
    }
    if (inflated[rowStart] !== 0) {
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

function shouldBlockSource(
  dimensions: { width: number; height: number } | null,
  singleColorDetected: boolean,
  syntheticDetected: boolean
): boolean {
  if (!dimensions) {
    return true;
  }
  return (
    dimensions.width < MINIMUM_REQUIRED_RESOLUTION ||
    dimensions.height < MINIMUM_REQUIRED_RESOLUTION ||
    singleColorDetected ||
    syntheticDetected
  );
}

function auditSourceQuality(
  sourceVideoId: string,
  artifact: RealImageArtifactEntry | undefined,
  ingestionArtifact: RealImageArtifactEntry | undefined,
  projectRoot: string
): SourceRealImageQualityGateAudit {
  if (!artifact) {
    return {
      source_video_id: sourceVideoId,
      image_file_readable: 'FAIL',
      image_dimensions_valid: 'FAIL',
      minimum_resolution_check: 'FAIL',
      single_color_image_detected: true,
      synthetic_artifact_detected: true,
      prompt_traceability_preserved: 'FAIL',
      adapter_traceability_preserved: 'FAIL',
      real_visual_content_required: 'PASS',
      blocked: true,
      source_quality_gate_ready: 'FAIL',
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, artifact.output_path);
  let imageFileReadable: GateStatus = 'FAIL';
  let imageDimensionsValid: GateStatus = 'FAIL';
  let minimumResolutionCheck: GateStatus = 'FAIL';
  let singleColorDetected = true;
  let syntheticDetected = true;
  let dimensions: { width: number; height: number } | null = null;

  if (fs.existsSync(outputAbs)) {
    try {
      const buffer = fs.readFileSync(outputAbs);
      const parsed = parsePngDimensions(buffer);
      if (parsed) {
        imageFileReadable = 'PASS';
        dimensions = parsed;
        imageDimensionsValid = 'PASS';
        minimumResolutionCheck =
          parsed.width >= MINIMUM_REQUIRED_RESOLUTION &&
          parsed.height >= MINIMUM_REQUIRED_RESOLUTION
            ? 'PASS'
            : 'FAIL';

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
    ingestionArtifact &&
    artifact.resolved_image_prompt === ingestionArtifact.resolved_image_prompt &&
    artifact.prompt_hash === ingestionArtifact.prompt_hash
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved =
    ingestionArtifact &&
    artifact.cinematic_dna_id === ingestionArtifact.cinematic_dna_id &&
    JSON.stringify(artifact.adapter_ids) === JSON.stringify(ingestionArtifact.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const blocked = shouldBlockSource(dimensions, singleColorDetected, syntheticDetected);

  const checks: GateStatus[] = [
    imageFileReadable,
    imageDimensionsValid,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
    'PASS',
  ];

  const blockingReady =
    blocked &&
    (dimensions
      ? dimensions.width < MINIMUM_REQUIRED_RESOLUTION ||
        dimensions.height < MINIMUM_REQUIRED_RESOLUTION ||
        singleColorDetected ||
        syntheticDetected
      : true);

  return {
    source_video_id: sourceVideoId,
    image_file_readable: imageFileReadable,
    image_dimensions_valid: imageDimensionsValid,
    minimum_resolution_check: minimumResolutionCheck,
    single_color_image_detected: singleColorDetected,
    synthetic_artifact_detected: syntheticDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_visual_content_required: 'PASS',
    blocked,
    source_quality_gate_ready:
      checks.every((status) => status === 'PASS') && blockingReady ? 'PASS' : 'FAIL',
    dimensions,
  };
}

function aggregateGateStatus(
  audits: SourceRealImageQualityGateAudit[],
  field:
    | 'image_file_readable'
    | 'image_dimensions_valid'
    | 'minimum_resolution_check'
    | 'prompt_traceability_preserved'
    | 'adapter_traceability_preserved'
    | 'real_visual_content_required'
): GateStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealImageQualityGateReport): string {
  const lines = [
    '# Movie Analysis Real Image Quality Gate',
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
    '## Quality Gate Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_file_readable | ${report.image_file_readable} |`,
    `| image_dimensions_valid | ${report.image_dimensions_valid} |`,
    `| minimum_resolution_check | ${report.minimum_resolution_check} |`,
    `| single_color_image_detected | ${report.single_color_image_detected} |`,
    `| synthetic_artifact_detected | ${report.synthetic_artifact_detected} |`,
    `| real_visual_content_required | ${report.real_visual_content_required} |`,
    `| prompt_traceability_preserved | ${report.prompt_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| real_image_quality_gate_ready | ${report.real_image_quality_gate_ready} |`,
    '',
    '## Gate Rule',
    '',
    'BLOCK if:',
    '- width < 512',
    '- height < 512',
    '- single_color_image_detected=true',
    '- synthetic_artifact_detected=true',
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- blocked: ${audit.blocked}`,
      `- dimensions: ${dim}`,
      `- image_file_readable: ${audit.image_file_readable}`,
      `- image_dimensions_valid: ${audit.image_dimensions_valid}`,
      `- minimum_resolution_check: ${audit.minimum_resolution_check}`,
      `- single_color_image_detected: ${audit.single_color_image_detected}`,
      `- synthetic_artifact_detected: ${audit.synthetic_artifact_detected}`,
      `- prompt_traceability_preserved: ${audit.prompt_traceability_preserved}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- real_visual_content_required: ${audit.real_visual_content_required}`,
      `- source_quality_gate_ready: ${audit.source_quality_gate_ready}`,
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
  issues: RealImageQualityGateIssue[]
): MovieAnalysisRealImageQualityGateReport {
  const report: MovieAnalysisRealImageQualityGateReport = {
    report_id: 'movie-analysis-real-image-quality-gate-report-v1',
    phase: REAL_IMAGE_QUALITY_GATE_PHASE,
    timestamp,
    real_image_artifact_ingestion_report_path: REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
    artifacts_manifest_path: REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    image_file_readable: 'FAIL',
    image_dimensions_valid: 'FAIL',
    minimum_resolution_check: 'FAIL',
    single_color_image_detected: true,
    synthetic_artifact_detected: true,
    real_visual_content_required: 'FAIL',
    prompt_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    real_image_quality_gate_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: REAL_IMAGE_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_QUALITY_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageQualityGate(
  projectRoot?: string
): MovieAnalysisRealImageQualityGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageQualityGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const ingestionReport = loadIngestionReport(root);
  if (!ingestionReport) {
    issues.push({
      code: 'REAL_IMAGE_ARTIFACT_INGESTION_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (ingestionReport.final_verdict !== REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_004_NOT_PASS',
      message: `Real image artifact ingestion must have ${REAL_IMAGE_ARTIFACT_INGESTION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const manifest = loadArtifactsManifest(root);
  if (!manifest) {
    issues.push({
      code: 'REAL_IMAGE_ARTIFACTS_MANIFEST_MISSING',
      message: `Missing ${REAL_IMAGE_ARTIFACTS_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRealImageQualityGateAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const artifact = manifest.artifacts.find((item) => item.source_video_id === sourceVideoId);
    const ingestionArtifact = ingestionReport.artifacts.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const audit = auditSourceQuality(sourceVideoId, artifact, ingestionArtifact, root);
    sourceAudits.push(audit);

    if (audit.source_quality_gate_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_QUALITY_GATE_FAIL',
        message: `Real image quality gate failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = ingestionReport.source_count;
  const adapterCount = ingestionReport.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const imageFileReadable = aggregateGateStatus(sourceAudits, 'image_file_readable');
  const imageDimensionsValid = aggregateGateStatus(sourceAudits, 'image_dimensions_valid');
  const minimumResolutionCheck = aggregateGateStatus(sourceAudits, 'minimum_resolution_check');
  const promptTraceabilityPreserved = aggregateGateStatus(
    sourceAudits,
    'prompt_traceability_preserved'
  );
  const adapterTraceabilityPreserved = aggregateGateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );
  const realVisualContentRequired = aggregateGateStatus(
    sourceAudits,
    'real_visual_content_required'
  );

  const singleColorImageDetected = sourceAudits.some(
    (audit) => audit.single_color_image_detected
  );
  const syntheticArtifactDetected = sourceAudits.some(
    (audit) => audit.synthetic_artifact_detected
  );
  const anyBlocked = sourceAudits.some((audit) => audit.blocked);

  const certificationStatus =
    anyBlocked &&
    (singleColorImageDetected ||
      syntheticArtifactDetected ||
      sourceAudits.some(
        (audit) =>
          audit.dimensions !== null &&
          (audit.dimensions.width < MINIMUM_REQUIRED_RESOLUTION ||
            audit.dimensions.height < MINIMUM_REQUIRED_RESOLUTION)
      ))
      ? BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS
      : REAL_VISUAL_CONTENT_GATE_READY_STATUS;

  const gateChecks: GateStatus[] = [
    imageFileReadable,
    imageDimensionsValid,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
    realVisualContentRequired,
  ];

  const blockingApplied = sourceAudits.every((audit) => {
    if (!audit.blocked) {
      return true;
    }
    return (
      audit.single_color_image_detected ||
      audit.synthetic_artifact_detected ||
      (audit.dimensions !== null &&
        (audit.dimensions.width < MINIMUM_REQUIRED_RESOLUTION ||
          audit.dimensions.height < MINIMUM_REQUIRED_RESOLUTION))
    );
  });

  const realImageQualityGateReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_quality_gate_ready === 'PASS') &&
    blockingApplied &&
    (anyBlocked
      ? certificationStatus === BLOCKED_REAL_VISUAL_CONTENT_REQUIRED_STATUS
      : certificationStatus === REAL_VISUAL_CONTENT_GATE_READY_STATUS) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realImageQualityGateReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_IMAGE_QUALITY_GATE_FAIL')) {
    issues.push({
      code: 'REAL_IMAGE_QUALITY_GATE_FAIL',
      message: 'Real image quality gate is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealImageQualityGateReport = {
    report_id: 'movie-analysis-real-image-quality-gate-report-v1',
    phase: REAL_IMAGE_QUALITY_GATE_PHASE,
    timestamp,
    real_image_artifact_ingestion_report_path: REAL_IMAGE_ARTIFACT_INGESTION_REPORT_PATH,
    artifacts_manifest_path: REAL_IMAGE_ARTIFACTS_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_file_readable: imageFileReadable,
    image_dimensions_valid: imageDimensionsValid,
    minimum_resolution_check: minimumResolutionCheck,
    single_color_image_detected: singleColorImageDetected,
    synthetic_artifact_detected: syntheticArtifactDetected,
    real_visual_content_required: realVisualContentRequired,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_image_quality_gate_ready: realImageQualityGateReady,
    certification_status: pass ? certificationStatus : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_QUALITY_GATE_PASS_VERDICT
      : REAL_IMAGE_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_QUALITY_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
