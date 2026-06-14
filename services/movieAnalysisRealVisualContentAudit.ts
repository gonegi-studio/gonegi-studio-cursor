import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { MIN_VALID_IMAGE_DIMENSION } from './movieAnalysisRealImageArtifactIngestion.js';
import { MINIMUM_REQUIRED_RESOLUTION } from './movieAnalysisRealImageQualityGate.js';
import {
  REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT,
  REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
  REAL_VISUAL_CONTENT_MANIFEST_PATH,
  type MovieAnalysisRealVisualContentIngestionReport,
  type RealVisualContentEntry,
  type RealVisualContentManifest,
} from './movieAnalysisRealVisualContentIngestion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_VISUAL_CONTENT_AUDIT_PHASE =
  'PHASE-LEVEL2E-007-MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_AUDIT_V1' as const;
export const REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_AUDIT_V1' as const;
export const REAL_VISUAL_CONTENT_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_AUDIT_V1' as const;
export const REAL_VISUAL_CONTENT_AUDIT_DIR =
  'reports/movie_analysis_real_visual_content_audit' as const;
export const REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH =
  'reports/movie_analysis_real_visual_content_audit/movie-analysis-real-visual-content-audit-report.json' as const;
export const REAL_VISUAL_CONTENT_AUDIT_MD_PATH =
  'reports/movie_analysis_real_visual_content_audit/MOVIE_ANALYSIS_REAL_VISUAL_CONTENT_AUDIT.md' as const;
export const BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS =
  'BLOCKED_REAL_SCENE_CONTENT_REQUIRED' as const;
export const REAL_SCENE_CONTENT_AUDIT_READY_STATUS = 'REAL_SCENE_CONTENT_AUDITED' as const;

export const MIN_EDGE_DENSITY = 0.03 as const;
export const MIN_LAPLACIAN_MAGNITUDE = 18 as const;
export const MIN_UNIQUE_COLORS = 64 as const;
export const EDGE_DIFF_THRESHOLD = 15 as const;
export const GRADIENT_STEP_DOMINANCE_RATIO = 0.88 as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const L2E_PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AuditStatus = 'PASS' | 'FAIL';

export type VisualContentMetrics = {
  unique_colors: number;
  edge_density: number;
  laplacian_magnitude: number;
  gradient_step_dominance: number;
  gradient_only_detected: boolean;
};

export type RealVisualContentAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceRealVisualContentAudit = {
  source_video_id: string;
  multi_color_validation: AuditStatus;
  visual_complexity_validation: AuditStatus;
  edge_density_validation: AuditStatus;
  non_placeholder_validation: AuditStatus;
  non_gradient_only_validation: AuditStatus;
  traceability_preserved: AuditStatus;
  gradient_only_detected: boolean;
  scene_content_present: boolean;
  blocked: boolean;
  source_visual_content_audit_ready: AuditStatus;
  metrics: VisualContentMetrics | null;
  dimensions: { width: number; height: number } | null;
};

export type MovieAnalysisRealVisualContentAuditReport = {
  report_id: string;
  phase: typeof REAL_VISUAL_CONTENT_AUDIT_PHASE;
  timestamp: string;
  real_visual_content_ingestion_report_path: typeof REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH;
  visual_content_manifest_path: typeof REAL_VISUAL_CONTENT_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  multi_color_validation: AuditStatus;
  visual_complexity_validation: AuditStatus;
  edge_density_validation: AuditStatus;
  non_placeholder_validation: AuditStatus;
  non_gradient_only_validation: AuditStatus;
  traceability_preserved: AuditStatus;
  gradient_only_detected: boolean;
  real_visual_content_audit_ready: AuditStatus;
  certification_status:
    | typeof BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS
    | typeof REAL_SCENE_CONTENT_AUDIT_READY_STATUS
    | null;
  source_audits: SourceRealVisualContentAudit[];
  final_verdict:
    | typeof REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT
    | typeof REAL_VISUAL_CONTENT_AUDIT_FAIL_VERDICT;
  issues: RealVisualContentAuditIssue[];
};

function loadIngestionReport(
  projectRoot: string
): MovieAnalysisRealVisualContentIngestionReport | null {
  const abs = path.join(projectRoot, REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealVisualContentIngestionReport;
}

function loadVisualContentManifest(projectRoot: string): RealVisualContentManifest | null {
  const abs = path.join(projectRoot, REAL_VISUAL_CONTENT_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealVisualContentManifest;
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

function countUniqueColors(pixels: Buffer, sampleStride = 4): number {
  const seen = new Set<string>();
  for (let index = 0; index < pixels.length; index += 3 * sampleStride) {
    seen.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
  }
  return seen.size;
}

function computeEdgeDensity(pixels: Buffer, width: number, height: number): number {
  let edges = 0;
  let comparisons = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;

      if (x + 1 < width) {
        const right = index + 3;
        const diff = Math.max(
          Math.abs(pixels[index] - pixels[right]),
          Math.abs(pixels[index + 1] - pixels[right + 1]),
          Math.abs(pixels[index + 2] - pixels[right + 2])
        );
        if (diff > EDGE_DIFF_THRESHOLD) {
          edges += 1;
        }
        comparisons += 1;
      }

      if (y + 1 < height) {
        const down = index + width * 3;
        const diff = Math.max(
          Math.abs(pixels[index] - pixels[down]),
          Math.abs(pixels[index + 1] - pixels[down + 1]),
          Math.abs(pixels[index + 2] - pixels[down + 2])
        );
        if (diff > EDGE_DIFF_THRESHOLD) {
          edges += 1;
        }
        comparisons += 1;
      }
    }
  }

  return comparisons === 0 ? 0 : edges / comparisons;
}

function normalizeStepDiff(left: number, right: number): number {
  let diff = right - left;
  if (diff > 128) {
    diff -= 256;
  } else if (diff < -128) {
    diff += 256;
  }
  return diff;
}

function computeChannelStepDominance(
  pixels: Buffer,
  width: number,
  height: number,
  channel: 0 | 1 | 2
): number {
  const stepCounts = new Map<number, number>();
  let total = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width - 1; x += 1) {
      const index = (y * width + x) * 3 + channel;
      const step = normalizeStepDiff(pixels[index], pixels[index + 3]);
      if (Math.abs(step) > 40) {
        continue;
      }
      stepCounts.set(step, (stepCounts.get(step) ?? 0) + 1);
      total += 1;
    }
  }

  if (total === 0) {
    return 0;
  }

  const dominant = Math.max(...stepCounts.values());
  return dominant / total;
}

function computeGradientStepDominance(
  pixels: Buffer,
  width: number,
  height: number
): number {
  const channelScores = [0, 1, 2].map((channel) =>
    computeChannelStepDominance(pixels, width, height, channel as 0 | 1 | 2)
  );
  return channelScores.reduce((sum, score) => sum + score, 0) / channelScores.length;
}

function computeLaplacianMagnitude(pixels: Buffer, width: number, height: number): number {
  let sum = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      const index = (y * width + x) * 3;
      const left = index - 3;
      const right = index + 3;
      const up = index - width * 3;
      const down = index + width * 3;

      for (const channel of [0, 1, 2] as const) {
        const center = pixels[index + channel];
        const laplacian = Math.abs(
          4 * center -
            pixels[left + channel] -
            pixels[right + channel] -
            pixels[up + channel] -
            pixels[down + channel]
        );
        sum += laplacian;
        count += 1;
      }
    }
  }

  return count === 0 ? 0 : sum / count;
}

function isGradientOnlyImage(
  pixels: Buffer,
  width: number,
  height: number,
  gradientStepDominance: number,
  laplacianMagnitude: number,
  edgeDensity: number
): boolean {
  const uniformSteps = gradientStepDominance >= GRADIENT_STEP_DOMINANCE_RATIO;
  const lowStructuralDetail =
    laplacianMagnitude < MIN_LAPLACIAN_MAGNITUDE && edgeDensity < MIN_EDGE_DENSITY;
  return uniformSteps || lowStructuralDetail;
}

function isPlaceholderImage(
  buffer: Buffer,
  dimensions: { width: number; height: number } | null
): boolean {
  if (dimensions?.width === 1 && dimensions.height === 1) {
    return true;
  }
  const knownPlaceholder = Buffer.from(L2E_PLACEHOLDER_PNG_BASE64, 'base64');
  return buffer.equals(knownPlaceholder);
}

function analyzeVisualContent(
  buffer: Buffer
): {
  dimensions: { width: number; height: number } | null;
  metrics: VisualContentMetrics | null;
} {
  const dimensions = parsePngDimensions(buffer);
  const decoded = decodePngRgb(buffer);
  if (!dimensions || !decoded) {
    return { dimensions, metrics: null };
  }

  const uniqueColors = countUniqueColors(decoded.pixels);
  const edgeDensity = computeEdgeDensity(decoded.pixels, decoded.width, decoded.height);
  const gradientStepDominance = computeGradientStepDominance(
    decoded.pixels,
    decoded.width,
    decoded.height
  );
  const laplacianMagnitude = computeLaplacianMagnitude(
    decoded.pixels,
    decoded.width,
    decoded.height
  );
  const gradientOnlyDetected = isGradientOnlyImage(
    decoded.pixels,
    decoded.width,
    decoded.height,
    gradientStepDominance,
    laplacianMagnitude,
    edgeDensity
  );

  return {
    dimensions,
    metrics: {
      unique_colors: uniqueColors,
      edge_density: edgeDensity,
      laplacian_magnitude: laplacianMagnitude,
      gradient_step_dominance: gradientStepDominance,
      gradient_only_detected: gradientOnlyDetected,
    },
  };
}

function auditSourceVisualContent(
  sourceVideoId: string,
  manifestEntry: RealVisualContentEntry | undefined,
  ingestionEntry: RealVisualContentEntry | undefined,
  projectRoot: string
): SourceRealVisualContentAudit {
  if (!manifestEntry) {
    return {
      source_video_id: sourceVideoId,
      multi_color_validation: 'FAIL',
      visual_complexity_validation: 'FAIL',
      edge_density_validation: 'FAIL',
      non_placeholder_validation: 'FAIL',
      non_gradient_only_validation: 'FAIL',
      traceability_preserved: 'FAIL',
      gradient_only_detected: true,
      scene_content_present: false,
      blocked: true,
      source_visual_content_audit_ready: 'FAIL',
      metrics: null,
      dimensions: null,
    };
  }

  const outputAbs = path.join(projectRoot, manifestEntry.output_path);
  let metrics: VisualContentMetrics | null = null;
  let dimensions: { width: number; height: number } | null = null;

  if (fs.existsSync(outputAbs)) {
    const buffer = fs.readFileSync(outputAbs);
    const analysis = analyzeVisualContent(buffer);
    dimensions = analysis.dimensions;
    metrics = analysis.metrics;

    if (isPlaceholderImage(buffer, dimensions)) {
      return {
        source_video_id: sourceVideoId,
        multi_color_validation: 'FAIL',
        visual_complexity_validation: 'FAIL',
        edge_density_validation: 'FAIL',
        non_placeholder_validation: 'FAIL',
        non_gradient_only_validation: 'FAIL',
        traceability_preserved: 'FAIL',
        gradient_only_detected: true,
        scene_content_present: false,
        blocked: true,
        source_visual_content_audit_ready: 'FAIL',
        metrics,
        dimensions,
      };
    }
  }

  const multiColorValidation =
    metrics && metrics.unique_colors >= MIN_UNIQUE_COLORS ? 'PASS' : 'FAIL';
  const visualComplexityValidation =
    metrics &&
    metrics.laplacian_magnitude >= MIN_LAPLACIAN_MAGNITUDE &&
    metrics.gradient_step_dominance < GRADIENT_STEP_DOMINANCE_RATIO
      ? 'PASS'
      : 'FAIL';
  const edgeDensityValidation =
    metrics && metrics.edge_density >= MIN_EDGE_DENSITY ? 'PASS' : 'FAIL';
  const nonPlaceholderValidation =
    dimensions &&
    dimensions.width >= MINIMUM_REQUIRED_RESOLUTION &&
    dimensions.height >= MINIMUM_REQUIRED_RESOLUTION &&
    !(dimensions.width === MIN_VALID_IMAGE_DIMENSION && dimensions.height === MIN_VALID_IMAGE_DIMENSION)
      ? 'PASS'
      : 'FAIL';
  const gradientOnlyDetected = metrics?.gradient_only_detected ?? true;
  const nonGradientOnlyValidation = gradientOnlyDetected ? 'FAIL' : 'PASS';

  const traceabilityPreserved =
    ingestionEntry &&
    manifestEntry.resolved_image_prompt === ingestionEntry.resolved_image_prompt &&
    manifestEntry.prompt_hash === ingestionEntry.prompt_hash &&
    manifestEntry.cinematic_dna_id === ingestionEntry.cinematic_dna_id &&
    JSON.stringify(manifestEntry.adapter_ids) === JSON.stringify(ingestionEntry.adapter_ids)
      ? 'PASS'
      : 'FAIL';

  const sceneContentPresent =
    multiColorValidation === 'PASS' &&
    visualComplexityValidation === 'PASS' &&
    edgeDensityValidation === 'PASS' &&
    nonGradientOnlyValidation === 'PASS' &&
    nonPlaceholderValidation === 'PASS';

  const blocked = !sceneContentPresent || gradientOnlyDetected;

  const auditChecks: AuditStatus[] = [
    multiColorValidation,
    visualComplexityValidation,
    edgeDensityValidation,
    nonPlaceholderValidation,
    nonGradientOnlyValidation,
    traceabilityPreserved,
  ];

  const sourceReady =
    traceabilityPreserved === 'PASS' &&
    (sceneContentPresent || (blocked && gradientOnlyDetected))
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    multi_color_validation: multiColorValidation,
    visual_complexity_validation: visualComplexityValidation,
    edge_density_validation: edgeDensityValidation,
    non_placeholder_validation: nonPlaceholderValidation,
    non_gradient_only_validation: nonGradientOnlyValidation,
    traceability_preserved: traceabilityPreserved,
    gradient_only_detected: gradientOnlyDetected,
    scene_content_present: sceneContentPresent,
    blocked,
    source_visual_content_audit_ready: sourceReady,
    metrics,
    dimensions,
  };
}

function aggregateStatus(
  audits: SourceRealVisualContentAudit[],
  field:
    | 'multi_color_validation'
    | 'visual_complexity_validation'
    | 'edge_density_validation'
    | 'non_placeholder_validation'
    | 'non_gradient_only_validation'
    | 'traceability_preserved'
): AuditStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealVisualContentAuditReport): string {
  const lines = [
    '# Movie Analysis Real Visual Content Audit',
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
    '## Audit Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| multi_color_validation | ${report.multi_color_validation} |`,
    `| visual_complexity_validation | ${report.visual_complexity_validation} |`,
    `| edge_density_validation | ${report.edge_density_validation} |`,
    `| non_placeholder_validation | ${report.non_placeholder_validation} |`,
    `| non_gradient_only_validation | ${report.non_gradient_only_validation} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| gradient_only_detected | ${report.gradient_only_detected} |`,
    `| real_visual_content_audit_ready | ${report.real_visual_content_audit_ready} |`,
    '',
    '## Audit Rule',
    '',
    '- Gradient-only images are BLOCKED',
    '- Real scene visual information is required for forward pass',
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    const dim = audit.dimensions
      ? `${audit.dimensions.width}x${audit.dimensions.height}`
      : 'none';
    const metrics = audit.metrics
      ? `colors=${audit.metrics.unique_colors} edge_density=${audit.metrics.edge_density.toFixed(4)} laplacian=${audit.metrics.laplacian_magnitude.toFixed(2)} step_dominance=${audit.metrics.gradient_step_dominance.toFixed(4)}`
      : 'none';
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- blocked: ${audit.blocked}`,
      `- scene_content_present: ${audit.scene_content_present}`,
      `- dimensions: ${dim}`,
      `- metrics: ${metrics}`,
      `- multi_color_validation: ${audit.multi_color_validation}`,
      `- visual_complexity_validation: ${audit.visual_complexity_validation}`,
      `- edge_density_validation: ${audit.edge_density_validation}`,
      `- non_placeholder_validation: ${audit.non_placeholder_validation}`,
      `- non_gradient_only_validation: ${audit.non_gradient_only_validation}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- gradient_only_detected: ${audit.gradient_only_detected}`,
      `- source_visual_content_audit_ready: ${audit.source_visual_content_audit_ready}`,
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
  issues: RealVisualContentAuditIssue[]
): MovieAnalysisRealVisualContentAuditReport {
  const report: MovieAnalysisRealVisualContentAuditReport = {
    report_id: 'movie-analysis-real-visual-content-audit-report-v1',
    phase: REAL_VISUAL_CONTENT_AUDIT_PHASE,
    timestamp,
    real_visual_content_ingestion_report_path: REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
    visual_content_manifest_path: REAL_VISUAL_CONTENT_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    multi_color_validation: 'FAIL',
    visual_complexity_validation: 'FAIL',
    edge_density_validation: 'FAIL',
    non_placeholder_validation: 'FAIL',
    non_gradient_only_validation: 'FAIL',
    traceability_preserved: 'FAIL',
    gradient_only_detected: true,
    real_visual_content_audit_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: REAL_VISUAL_CONTENT_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VISUAL_CONTENT_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealVisualContentAudit(
  projectRoot?: string
): MovieAnalysisRealVisualContentAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealVisualContentAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const ingestionReport = loadIngestionReport(root);
  if (!ingestionReport) {
    issues.push({
      code: 'REAL_VISUAL_CONTENT_INGESTION_REPORT_MISSING',
      message: `Missing ${REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (ingestionReport.final_verdict !== REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_006_NOT_PASS',
      message: `Real visual content ingestion must have ${REAL_VISUAL_CONTENT_INGESTION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const manifest = loadVisualContentManifest(root);
  if (!manifest) {
    issues.push({
      code: 'REAL_VISUAL_CONTENT_MANIFEST_MISSING',
      message: `Missing ${REAL_VISUAL_CONTENT_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRealVisualContentAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const manifestEntry = manifest.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const ingestionEntry = ingestionReport.entries.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const audit = auditSourceVisualContent(
      sourceVideoId,
      manifestEntry,
      ingestionEntry,
      root
    );
    sourceAudits.push(audit);

    if (audit.source_visual_content_audit_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_VISUAL_CONTENT_AUDIT_FAIL',
        message: `Real visual content audit failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = ingestionReport.source_count;
  const adapterCount = ingestionReport.adapter_count;

  const multiColorValidation = aggregateStatus(sourceAudits, 'multi_color_validation');
  const visualComplexityValidation = aggregateStatus(
    sourceAudits,
    'visual_complexity_validation'
  );
  const edgeDensityValidation = aggregateStatus(sourceAudits, 'edge_density_validation');
  const nonPlaceholderValidation = aggregateStatus(sourceAudits, 'non_placeholder_validation');
  const nonGradientOnlyValidation = aggregateStatus(
    sourceAudits,
    'non_gradient_only_validation'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const gradientOnlyDetected = sourceAudits.some((audit) => audit.gradient_only_detected);
  const anyBlocked = sourceAudits.some((audit) => audit.blocked);
  const anySceneContent = sourceAudits.some((audit) => audit.scene_content_present);

  const certificationStatus =
    anyBlocked && gradientOnlyDetected && !anySceneContent
      ? BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS
      : REAL_SCENE_CONTENT_AUDIT_READY_STATUS;

  const auditReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    traceabilityPreserved === 'PASS' &&
    sourceAudits.every((audit) => audit.source_visual_content_audit_ready === 'PASS') &&
    (gradientOnlyDetected
      ? certificationStatus === BLOCKED_REAL_SCENE_CONTENT_REQUIRED_STATUS
      : certificationStatus === REAL_SCENE_CONTENT_AUDIT_READY_STATUS) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = auditReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_VISUAL_CONTENT_AUDIT_FAIL')) {
    issues.push({
      code: 'REAL_VISUAL_CONTENT_AUDIT_FAIL',
      message: 'Real visual content audit is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealVisualContentAuditReport = {
    report_id: 'movie-analysis-real-visual-content-audit-report-v1',
    phase: REAL_VISUAL_CONTENT_AUDIT_PHASE,
    timestamp,
    real_visual_content_ingestion_report_path: REAL_VISUAL_CONTENT_INGESTION_REPORT_PATH,
    visual_content_manifest_path: REAL_VISUAL_CONTENT_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    multi_color_validation: multiColorValidation,
    visual_complexity_validation: visualComplexityValidation,
    edge_density_validation: edgeDensityValidation,
    non_placeholder_validation: nonPlaceholderValidation,
    non_gradient_only_validation: nonGradientOnlyValidation,
    traceability_preserved: traceabilityPreserved,
    gradient_only_detected: gradientOnlyDetected,
    real_visual_content_audit_ready: auditReady,
    certification_status: pass ? certificationStatus : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_VISUAL_CONTENT_AUDIT_PASS_VERDICT
      : REAL_VISUAL_CONTENT_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_VISUAL_CONTENT_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_VISUAL_CONTENT_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
