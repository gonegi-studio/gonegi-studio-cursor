import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
  REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR,
  REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT,
  REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
  type MovieAnalysisRealImageGenerationValidationReport,
  type RealImageGenerationTestManifest,
  type RealImageGenerationTestResult,
} from './movieAnalysisRealImageGenerationValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_OUTPUT_AUDIT_PHASE =
  'PHASE-LEVEL2E-002-MOVIE_ANALYSIS_REAL_IMAGE_OUTPUT_AUDIT_V1' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_OUTPUT_AUDIT_V1' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_OUTPUT_AUDIT_V1' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_DIR =
  'reports/movie_analysis_real_image_output_audit' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH =
  'reports/movie_analysis_real_image_output_audit/movie-analysis-real-image-output-audit-report.json' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_MD_PATH =
  'reports/movie_analysis_real_image_output_audit/MOVIE_ANALYSIS_REAL_IMAGE_OUTPUT_AUDIT.md' as const;
export const REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE = 'REAL_IMAGE_OUTPUT_AUDITED' as const;

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const L2E_PLACEHOLDER_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type AuditStatus = 'PASS' | 'FAIL';

export type RealImageOutputAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type ImageDimensionRecord = {
  width: number;
  height: number;
  file_size_bytes: number;
  format: 'png' | 'unknown';
};

export type SourceRealImageOutputAudit = {
  source_video_id: string;
  output_path: string;
  image_output_present: AuditStatus;
  image_file_readable: AuditStatus;
  image_dimensions_recorded: AuditStatus;
  placeholder_detected: AuditStatus;
  mock_output_detected: AuditStatus;
  prompt_traceability_preserved: AuditStatus;
  adapter_traceability_preserved: AuditStatus;
  source_output_audit_ready: AuditStatus;
  placeholder_found: boolean;
  mock_output_found: boolean;
  dimensions: ImageDimensionRecord | null;
};

export type MovieAnalysisRealImageOutputAuditReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_OUTPUT_AUDIT_PHASE;
  timestamp: string;
  test_mode_only: boolean;
  actual_generation_allowed: boolean;
  full_production: boolean;
  minimal_gpu: boolean;
  real_image_generation_validation_report_path: typeof REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH;
  test_output_dir: typeof REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR;
  test_manifest_path: typeof REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH;
  source_count: number;
  adapter_count: number;
  image_output_present: AuditStatus;
  image_file_readable: AuditStatus;
  image_dimensions_recorded: AuditStatus;
  placeholder_detected: AuditStatus;
  mock_output_detected: AuditStatus;
  prompt_traceability_preserved: AuditStatus;
  adapter_traceability_preserved: AuditStatus;
  real_image_output_audit_ready: AuditStatus;
  certification_status: typeof REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE | null;
  source_audits: SourceRealImageOutputAudit[];
  final_verdict:
    | typeof REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT
    | typeof REAL_IMAGE_OUTPUT_AUDIT_FAIL_VERDICT;
  issues: RealImageOutputAuditIssue[];
};

function loadValidationReport(
  projectRoot: string
): MovieAnalysisRealImageGenerationValidationReport | null {
  const abs = path.join(projectRoot, REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealImageGenerationValidationReport;
}

function loadTestManifest(projectRoot: string): RealImageGenerationTestManifest | null {
  const abs = path.join(projectRoot, REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as RealImageGenerationTestManifest;
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

function isPlaceholderImage(buffer: Buffer, dimensions: { width: number; height: number } | null): boolean {
  if (dimensions?.width === 1 && dimensions.height === 1) {
    return true;
  }
  const knownPlaceholder = Buffer.from(L2E_PLACEHOLDER_PNG_BASE64, 'base64');
  if (buffer.equals(knownPlaceholder)) {
    return true;
  }
  if (buffer.length <= 200 && dimensions?.width === 1 && dimensions.height === 1) {
    return true;
  }
  return false;
}

function isMockOutput(
  testResult: RealImageGenerationTestResult | undefined,
  outputPath: string
): boolean {
  if (!testResult) {
    return false;
  }
  return (
    testResult.test_mode_only === true &&
    testResult.full_production === false &&
    testResult.minimal_gpu === true &&
    outputPath.endsWith('_test.png')
  );
}

function auditSourceOutput(
  sourceVideoId: string,
  testResult: RealImageGenerationTestResult | undefined,
  validationResult: RealImageGenerationTestResult | undefined,
  projectRoot: string
): SourceRealImageOutputAudit {
  const outputPath = testResult?.output_path ?? '';
  const outputAbs = outputPath ? path.join(projectRoot, outputPath) : '';

  const imageOutputPresent = outputPath.length > 0 && fs.existsSync(outputAbs) ? 'PASS' : 'FAIL';

  let imageFileReadable: AuditStatus = 'FAIL';
  let imageDimensionsRecorded: AuditStatus = 'FAIL';
  let dimensions: ImageDimensionRecord | null = null;
  let placeholderFound = false;
  let buffer: Buffer | null = null;

  if (imageOutputPresent === 'PASS') {
    try {
      buffer = fs.readFileSync(outputAbs);
      const parsed = parsePngDimensions(buffer);
      if (parsed) {
        imageFileReadable = 'PASS';
        dimensions = {
          width: parsed.width,
          height: parsed.height,
          file_size_bytes: buffer.length,
          format: 'png',
        };
        imageDimensionsRecorded = 'PASS';
        placeholderFound = isPlaceholderImage(buffer, parsed);
      }
    } catch {
      imageFileReadable = 'FAIL';
    }
  }

  const mockOutputFound = isMockOutput(testResult, outputPath);
  const placeholderDetected = placeholderFound ? 'PASS' : 'FAIL';
  const mockOutputDetected = mockOutputFound ? 'PASS' : 'FAIL';

  const promptTraceabilityPreserved =
    testResult &&
    validationResult &&
    testResult.resolved_image_prompt === validationResult.resolved_image_prompt &&
    testResult.prompt_hash === validationResult.prompt_hash &&
    testResult.prompt_hash.length > 0
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved =
    testResult &&
    validationResult &&
    testResult.cinematic_dna_id === validationResult.cinematic_dna_id &&
    JSON.stringify(testResult.adapter_ids) === JSON.stringify(validationResult.adapter_ids) &&
    testResult.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: AuditStatus[] = [
    imageOutputPresent,
    imageFileReadable,
    imageDimensionsRecorded,
    placeholderDetected,
    mockOutputDetected,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
  ];

  return {
    source_video_id: sourceVideoId,
    output_path: outputPath,
    image_output_present: imageOutputPresent,
    image_file_readable: imageFileReadable,
    image_dimensions_recorded: imageDimensionsRecorded,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    source_output_audit_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
    placeholder_found: placeholderFound,
    mock_output_found: mockOutputFound,
    dimensions,
  };
}

function aggregateStatus(
  audits: SourceRealImageOutputAudit[],
  field: keyof Omit<
    SourceRealImageOutputAudit,
    | 'source_video_id'
    | 'output_path'
    | 'source_output_audit_ready'
    | 'placeholder_found'
    | 'mock_output_found'
    | 'dimensions'
  >
): AuditStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealImageOutputAuditReport): string {
  const lines = [
    '# Movie Analysis Real Image Output Audit',
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
    `| image_output_present | ${report.image_output_present} |`,
    `| image_file_readable | ${report.image_file_readable} |`,
    `| image_dimensions_recorded | ${report.image_dimensions_recorded} |`,
    `| placeholder_detected | ${report.placeholder_detected} |`,
    `| mock_output_detected | ${report.mock_output_detected} |`,
    `| prompt_traceability_preserved | ${report.prompt_traceability_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| real_image_output_audit_ready | ${report.real_image_output_audit_ready} |`,
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
      `- output_path: ${audit.output_path}`,
      `- dimensions: ${dim}`,
      `- placeholder_found: ${audit.placeholder_found}`,
      `- mock_output_found: ${audit.mock_output_found}`,
      `- image_output_present: ${audit.image_output_present}`,
      `- image_file_readable: ${audit.image_file_readable}`,
      `- image_dimensions_recorded: ${audit.image_dimensions_recorded}`,
      `- placeholder_detected: ${audit.placeholder_detected}`,
      `- mock_output_detected: ${audit.mock_output_detected}`,
      `- prompt_traceability_preserved: ${audit.prompt_traceability_preserved}`,
      `- adapter_traceability_preserved: ${audit.adapter_traceability_preserved}`,
      `- source_output_audit_ready: ${audit.source_output_audit_ready}`,
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
  issues: RealImageOutputAuditIssue[]
): MovieAnalysisRealImageOutputAuditReport {
  const report: MovieAnalysisRealImageOutputAuditReport = {
    report_id: 'movie-analysis-real-image-output-audit-report-v1',
    phase: REAL_IMAGE_OUTPUT_AUDIT_PHASE,
    timestamp,
    test_mode_only: true,
    actual_generation_allowed: true,
    full_production: false,
    minimal_gpu: true,
    real_image_generation_validation_report_path: REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
    test_output_dir: REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR,
    test_manifest_path: REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
    source_count: 0,
    adapter_count: 0,
    image_output_present: 'FAIL',
    image_file_readable: 'FAIL',
    image_dimensions_recorded: 'FAIL',
    placeholder_detected: 'FAIL',
    mock_output_detected: 'FAIL',
    prompt_traceability_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    real_image_output_audit_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: REAL_IMAGE_OUTPUT_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_OUTPUT_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_OUTPUT_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageOutputAudit(
  projectRoot?: string
): MovieAnalysisRealImageOutputAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageOutputAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const validationReport = loadValidationReport(root);
  if (!validationReport) {
    issues.push({
      code: 'REAL_IMAGE_GENERATION_VALIDATION_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (validationReport.final_verdict !== REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_001_NOT_PASS',
      message: `Real image generation validation must have ${REAL_IMAGE_GENERATION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const testManifest = loadTestManifest(root);
  if (!testManifest) {
    issues.push({
      code: 'REAL_IMAGE_GENERATION_TEST_MANIFEST_MISSING',
      message: `Missing ${REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRealImageOutputAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const testResult = testManifest.results.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const validationResult = validationReport.test_results.find(
      (item) => item.source_video_id === sourceVideoId
    );

    const audit = auditSourceOutput(sourceVideoId, testResult, validationResult, root);
    sourceAudits.push(audit);

    if (audit.source_output_audit_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_OUTPUT_AUDIT_FAIL',
        message: `Real image output audit failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = testManifest.source_count;
  const adapterCount = testManifest.adapter_count;

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

  const imageOutputPresent = aggregateStatus(sourceAudits, 'image_output_present');
  const imageFileReadable = aggregateStatus(sourceAudits, 'image_file_readable');
  const imageDimensionsRecorded = aggregateStatus(sourceAudits, 'image_dimensions_recorded');
  const placeholderDetected = aggregateStatus(sourceAudits, 'placeholder_detected');
  const mockOutputDetected = aggregateStatus(sourceAudits, 'mock_output_detected');
  const promptTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'prompt_traceability_preserved'
  );
  const adapterTraceabilityPreserved = aggregateStatus(
    sourceAudits,
    'adapter_traceability_preserved'
  );

  const gateChecks: AuditStatus[] = [
    imageOutputPresent,
    imageFileReadable,
    imageDimensionsRecorded,
    placeholderDetected,
    mockOutputDetected,
    promptTraceabilityPreserved,
    adapterTraceabilityPreserved,
  ];

  const realImageOutputAuditReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_output_audit_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realImageOutputAuditReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_IMAGE_OUTPUT_AUDIT_FAIL')) {
    issues.push({
      code: 'REAL_IMAGE_OUTPUT_AUDIT_FAIL',
      message: 'Real image output audit is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealImageOutputAuditReport = {
    report_id: 'movie-analysis-real-image-output-audit-report-v1',
    phase: REAL_IMAGE_OUTPUT_AUDIT_PHASE,
    timestamp,
    test_mode_only: validationReport.test_mode_only,
    actual_generation_allowed: validationReport.actual_generation_allowed,
    full_production: validationReport.full_production,
    minimal_gpu: validationReport.minimal_gpu,
    real_image_generation_validation_report_path: REAL_IMAGE_GENERATION_VALIDATION_REPORT_PATH,
    test_output_dir: REAL_IMAGE_GENERATION_TEST_OUTPUT_DIR,
    test_manifest_path: REAL_IMAGE_GENERATION_TEST_MANIFEST_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_output_present: imageOutputPresent,
    image_file_readable: imageFileReadable,
    image_dimensions_recorded: imageDimensionsRecorded,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    prompt_traceability_preserved: promptTraceabilityPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    real_image_output_audit_ready: realImageOutputAuditReady,
    certification_status: pass ? REAL_IMAGE_OUTPUT_AUDIT_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT
      : REAL_IMAGE_OUTPUT_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_OUTPUT_AUDIT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_OUTPUT_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
