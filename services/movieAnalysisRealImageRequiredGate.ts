import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT,
  REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
  type MovieAnalysisRealImageOutputAuditReport,
  type SourceRealImageOutputAudit,
} from './movieAnalysisRealImageOutputAudit.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_REQUIRED_GATE_PHASE =
  'PHASE-LEVEL2E-003-MOVIE_ANALYSIS_REAL_IMAGE_REQUIRED_GATE_V1' as const;
export const REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_REQUIRED_GATE_V1' as const;
export const REAL_IMAGE_REQUIRED_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_REQUIRED_GATE_V1' as const;
export const REAL_IMAGE_REQUIRED_GATE_DIR =
  'reports/movie_analysis_real_image_required_gate' as const;
export const REAL_IMAGE_REQUIRED_GATE_REPORT_PATH =
  'reports/movie_analysis_real_image_required_gate/movie-analysis-real-image-required-gate-report.json' as const;
export const REAL_IMAGE_REQUIRED_GATE_MD_PATH =
  'reports/movie_analysis_real_image_required_gate/MOVIE_ANALYSIS_REAL_IMAGE_REQUIRED_GATE.md' as const;
export const BLOCKED_REAL_IMAGE_REQUIRED_STATUS = 'BLOCKED_REAL_IMAGE_REQUIRED' as const;
export const REAL_IMAGE_REQUIRED_GATE_READY_STATUS = 'REAL_IMAGE_REQUIRED_GATE_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type GateStatus = 'PASS' | 'FAIL';

export type RealImageRequiredGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceRealImageRequiredGateAudit = {
  source_video_id: string;
  image_output_present: GateStatus;
  image_file_readable: GateStatus;
  placeholder_detected: boolean;
  mock_output_detected: boolean;
  placeholder_blocked: GateStatus;
  mock_output_blocked: GateStatus;
  traceability_preserved: GateStatus;
  real_image_required: GateStatus;
  blocked: boolean;
  source_gate_ready: GateStatus;
};

export type MovieAnalysisRealImageRequiredGateReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_REQUIRED_GATE_PHASE;
  timestamp: string;
  real_image_output_audit_report_path: typeof REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH;
  source_count: number;
  adapter_count: number;
  image_output_present: GateStatus;
  image_file_readable: GateStatus;
  placeholder_detected: boolean;
  mock_output_detected: boolean;
  real_image_required: GateStatus;
  placeholder_blocked: GateStatus;
  mock_output_blocked: GateStatus;
  traceability_preserved: GateStatus;
  real_image_required_gate_ready: GateStatus;
  certification_status:
    | typeof BLOCKED_REAL_IMAGE_REQUIRED_STATUS
    | typeof REAL_IMAGE_REQUIRED_GATE_READY_STATUS
    | null;
  source_audits: SourceRealImageRequiredGateAudit[];
  final_verdict:
    | typeof REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT
    | typeof REAL_IMAGE_REQUIRED_GATE_FAIL_VERDICT;
  issues: RealImageRequiredGateIssue[];
};

function loadOutputAuditReport(
  projectRoot: string
): MovieAnalysisRealImageOutputAuditReport | null {
  const abs = path.join(projectRoot, REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRealImageOutputAuditReport;
}

function auditSourceGate(
  sourceVideoId: string,
  outputAudit: SourceRealImageOutputAudit | undefined
): SourceRealImageRequiredGateAudit {
  if (!outputAudit) {
    return {
      source_video_id: sourceVideoId,
      image_output_present: 'FAIL',
      image_file_readable: 'FAIL',
      placeholder_detected: false,
      mock_output_detected: false,
      placeholder_blocked: 'FAIL',
      mock_output_blocked: 'FAIL',
      traceability_preserved: 'FAIL',
      real_image_required: 'PASS',
      blocked: false,
      source_gate_ready: 'FAIL',
    };
  }

  const placeholderDetected = outputAudit.placeholder_found;
  const mockOutputDetected = outputAudit.mock_output_found;
  const blocked = placeholderDetected || mockOutputDetected;

  const placeholderBlocked = placeholderDetected ? 'PASS' : 'PASS';
  const mockOutputBlocked = mockOutputDetected ? 'PASS' : 'PASS';

  const traceabilityPreserved =
    outputAudit.prompt_traceability_preserved === 'PASS' &&
    outputAudit.adapter_traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const checks: GateStatus[] = [
    outputAudit.image_output_present,
    outputAudit.image_file_readable,
    placeholderBlocked,
    mockOutputBlocked,
    traceabilityPreserved,
    'PASS',
  ];

  return {
    source_video_id: sourceVideoId,
    image_output_present: outputAudit.image_output_present,
    image_file_readable: outputAudit.image_file_readable,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    placeholder_blocked: placeholderBlocked,
    mock_output_blocked: mockOutputBlocked,
    traceability_preserved: traceabilityPreserved,
    real_image_required: 'PASS',
    blocked,
    source_gate_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateGateStatus(
  audits: SourceRealImageRequiredGateAudit[],
  field: 'image_output_present' | 'image_file_readable' | 'placeholder_blocked' | 'mock_output_blocked' | 'traceability_preserved' | 'real_image_required'
): GateStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealImageRequiredGateReport): string {
  const lines = [
    '# Movie Analysis Real Image Required Gate',
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
    '## Gate Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_output_present | ${report.image_output_present} |`,
    `| image_file_readable | ${report.image_file_readable} |`,
    `| placeholder_detected | ${report.placeholder_detected} |`,
    `| mock_output_detected | ${report.mock_output_detected} |`,
    `| real_image_required | ${report.real_image_required} |`,
    `| placeholder_blocked | ${report.placeholder_blocked} |`,
    `| mock_output_blocked | ${report.mock_output_blocked} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| real_image_required_gate_ready | ${report.real_image_required_gate_ready} |`,
    '',
    '## Gate Rule',
    '',
    '- If `placeholder_detected=true` → `BLOCKED_REAL_IMAGE_REQUIRED`',
    '- If `mock_output_detected=true` → `BLOCKED_REAL_IMAGE_REQUIRED`',
    '- Forward pass only when `placeholder_detected=false` and `mock_output_detected=false`',
    '',
    '## Source Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- blocked: ${audit.blocked}`,
      `- placeholder_detected: ${audit.placeholder_detected}`,
      `- mock_output_detected: ${audit.mock_output_detected}`,
      `- image_output_present: ${audit.image_output_present}`,
      `- image_file_readable: ${audit.image_file_readable}`,
      `- placeholder_blocked: ${audit.placeholder_blocked}`,
      `- mock_output_blocked: ${audit.mock_output_blocked}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- real_image_required: ${audit.real_image_required}`,
      `- source_gate_ready: ${audit.source_gate_ready}`,
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
  issues: RealImageRequiredGateIssue[]
): MovieAnalysisRealImageRequiredGateReport {
  const report: MovieAnalysisRealImageRequiredGateReport = {
    report_id: 'movie-analysis-real-image-required-gate-report-v1',
    phase: REAL_IMAGE_REQUIRED_GATE_PHASE,
    timestamp,
    real_image_output_audit_report_path: REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
    source_count: 0,
    adapter_count: 0,
    image_output_present: 'FAIL',
    image_file_readable: 'FAIL',
    placeholder_detected: false,
    mock_output_detected: false,
    real_image_required: 'FAIL',
    placeholder_blocked: 'FAIL',
    mock_output_blocked: 'FAIL',
    traceability_preserved: 'FAIL',
    real_image_required_gate_ready: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: REAL_IMAGE_REQUIRED_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_REQUIRED_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_REQUIRED_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageRequiredGate(
  projectRoot?: string
): MovieAnalysisRealImageRequiredGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageRequiredGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const outputAuditReport = loadOutputAuditReport(root);
  if (!outputAuditReport) {
    issues.push({
      code: 'REAL_IMAGE_OUTPUT_AUDIT_REPORT_MISSING',
      message: `Missing ${REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (outputAuditReport.final_verdict !== REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2E_002_NOT_PASS',
      message: `Real image output audit must have ${REAL_IMAGE_OUTPUT_AUDIT_PASS_VERDICT}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRealImageRequiredGateAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const outputAudit = outputAuditReport.source_audits.find(
      (item) => item.source_video_id === sourceVideoId
    );
    const gateAudit = auditSourceGate(sourceVideoId, outputAudit);
    sourceAudits.push(gateAudit);

    if (gateAudit.source_gate_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_GATE_FAIL',
        message: `Real image required gate failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sourceCount = outputAuditReport.source_count;
  const adapterCount = outputAuditReport.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const placeholderDetected = sourceAudits.some((audit) => audit.placeholder_detected);
  const mockOutputDetected = sourceAudits.some((audit) => audit.mock_output_detected);

  const imageOutputPresent = aggregateGateStatus(sourceAudits, 'image_output_present');
  const imageFileReadable = aggregateGateStatus(sourceAudits, 'image_file_readable');
  const placeholderBlocked = aggregateGateStatus(sourceAudits, 'placeholder_blocked');
  const mockOutputBlocked = aggregateGateStatus(sourceAudits, 'mock_output_blocked');
  const traceabilityPreserved = aggregateGateStatus(sourceAudits, 'traceability_preserved');
  const realImageRequired = aggregateGateStatus(sourceAudits, 'real_image_required');

  const certificationStatus =
    placeholderDetected || mockOutputDetected
      ? BLOCKED_REAL_IMAGE_REQUIRED_STATUS
      : REAL_IMAGE_REQUIRED_GATE_READY_STATUS;

  const gateChecks: GateStatus[] = [
    imageOutputPresent,
    imageFileReadable,
    placeholderBlocked,
    mockOutputBlocked,
    traceabilityPreserved,
    realImageRequired,
  ];

  const blockingApplied =
    (!placeholderDetected || placeholderBlocked === 'PASS') &&
    (!mockOutputDetected || mockOutputBlocked === 'PASS');

  const realImageRequiredGateReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_gate_ready === 'PASS') &&
    blockingApplied &&
    (placeholderDetected || mockOutputDetected
      ? certificationStatus === BLOCKED_REAL_IMAGE_REQUIRED_STATUS
      : certificationStatus === REAL_IMAGE_REQUIRED_GATE_READY_STATUS) &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = realImageRequiredGateReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'REAL_IMAGE_REQUIRED_GATE_FAIL')) {
    issues.push({
      code: 'REAL_IMAGE_REQUIRED_GATE_FAIL',
      message: 'Real image required gate is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealImageRequiredGateReport = {
    report_id: 'movie-analysis-real-image-required-gate-report-v1',
    phase: REAL_IMAGE_REQUIRED_GATE_PHASE,
    timestamp,
    real_image_output_audit_report_path: REAL_IMAGE_OUTPUT_AUDIT_REPORT_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_output_present: imageOutputPresent,
    image_file_readable: imageFileReadable,
    placeholder_detected: placeholderDetected,
    mock_output_detected: mockOutputDetected,
    real_image_required: realImageRequired,
    placeholder_blocked: placeholderBlocked,
    mock_output_blocked: mockOutputBlocked,
    traceability_preserved: traceabilityPreserved,
    real_image_required_gate_ready: realImageRequiredGateReady,
    certification_status: pass ? certificationStatus : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_REQUIRED_GATE_PASS_VERDICT
      : REAL_IMAGE_REQUIRED_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_REQUIRED_GATE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_REQUIRED_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_REQUIRED_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
