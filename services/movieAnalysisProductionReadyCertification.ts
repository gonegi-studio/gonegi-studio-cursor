import fs from 'node:fs';
import path from 'node:path';
import {
  FINAL_RELEASE_AUDIT_PASS_VERDICT,
  FINAL_RELEASE_AUDIT_PHASE,
  FINAL_RELEASE_AUDIT_REPORT_PATH,
  FINAL_RELEASE_AUDIT_STATUS_MESSAGE,
  type MovieAnalysisFinalReleaseAuditReport,
} from './movieAnalysisFinalReleaseAudit.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
} from './movieAnalysisDnaMasterCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_READY_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-068-MOVIE_ANALYSIS_PRODUCTION_READY_CERTIFICATION_V1' as const;
export const PRODUCTION_READY_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_READY_CERTIFICATION_V1' as const;
export const PRODUCTION_READY_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_READY_CERTIFICATION_V1' as const;
export const PRODUCTION_READY_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-production-ready-certification-report.json' as const;
export const PRODUCTION_READY_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_PRODUCTION_READY_CERTIFICATION.md' as const;
export const PRODUCTION_READY_STATUS_MESSAGE =
  'MOVIE_ANALYSIS_ENGINE_PRODUCTION_READY' as const;

export const EXPECTED_PHASE_COUNT = 46 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ProductionReadyCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_num?: string;
};

export type ProductionReadyPhaseAudit = {
  phase_num: string;
  phase: string;
  report_path: string;
  phase_certified: CertificationStatus;
};

export type MovieAnalysisProductionReadyCertificationReport = {
  report_id: string;
  phase: typeof PRODUCTION_READY_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  source_count: number;
  adapter_count: number;
  final_release_audit_report_path: typeof FINAL_RELEASE_AUDIT_REPORT_PATH;
  dataset_ready: CertificationStatus;
  dna_ready: CertificationStatus;
  adapter_ready: CertificationStatus;
  release_ready: CertificationStatus;
  archive_ready: CertificationStatus;
  audit_ready: CertificationStatus;
  phases_022_to_067_complete: CertificationStatus;
  production_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof PRODUCTION_READY_STATUS_MESSAGE | null;
  phase_audits: ProductionReadyPhaseAudit[];
  final_verdict:
    | typeof PRODUCTION_READY_CERTIFICATION_PASS_VERDICT
    | typeof PRODUCTION_READY_CERTIFICATION_FAIL_VERDICT;
  issues: ProductionReadyCertificationIssue[];
};

function loadFinalReleaseAuditReport(
  projectRoot: string
): MovieAnalysisFinalReleaseAuditReport | null {
  const abs = path.join(projectRoot, FINAL_RELEASE_AUDIT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisFinalReleaseAuditReport;
}

function buildMarkdown(report: MovieAnalysisProductionReadyCertificationReport): string {
  const lines = [
    '# Movie Analysis Production Ready Certification',
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
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Readiness Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| dataset_ready | ${report.dataset_ready} |`,
    `| dna_ready | ${report.dna_ready} |`,
    `| adapter_ready | ${report.adapter_ready} |`,
    `| release_ready | ${report.release_ready} |`,
    `| archive_ready | ${report.archive_ready} |`,
    `| audit_ready | ${report.audit_ready} |`,
    `| phases_022_to_067_complete | ${report.phases_022_to_067_complete} |`,
    `| production_ready | ${report.production_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Phase Certification Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} ${audit.phase}: certified=${audit.phase_certified}`
    );
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisProductionReadyCertificationReport(
  projectRoot?: string
): MovieAnalysisProductionReadyCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionReadyCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalAuditReport = loadFinalReleaseAuditReport(root);
  if (!finalAuditReport) {
    issues.push({
      code: 'FINAL_RELEASE_AUDIT_REPORT_MISSING',
      message: `Missing ${FINAL_RELEASE_AUDIT_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!finalAuditReport) {
    const report: MovieAnalysisProductionReadyCertificationReport = {
      report_id: 'movie-analysis-production-ready-certification-report-v1',
      phase: PRODUCTION_READY_CERTIFICATION_PHASE,
      timestamp,
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
      source_count: 0,
      adapter_count: 0,
      final_release_audit_report_path: FINAL_RELEASE_AUDIT_REPORT_PATH,
      dataset_ready: 'FAIL',
      dna_ready: 'FAIL',
      adapter_ready: 'FAIL',
      release_ready: 'FAIL',
      archive_ready: 'FAIL',
      audit_ready: 'FAIL',
      phases_022_to_067_complete: 'FAIL',
      production_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status: null,
      phase_audits: [],
      final_verdict: PRODUCTION_READY_CERTIFICATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, PRODUCTION_READY_CERTIFICATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, PRODUCTION_READY_CERTIFICATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );

    return report;
  }

  if (finalAuditReport.final_verdict !== FINAL_RELEASE_AUDIT_PASS_VERDICT) {
    issues.push({
      code: 'FINAL_RELEASE_AUDIT_NOT_PASS',
      message: `Final release audit must have ${FINAL_RELEASE_AUDIT_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (finalAuditReport.final_release_audit_ready !== 'PASS') {
    issues.push({
      code: 'FINAL_RELEASE_AUDIT_NOT_READY',
      message: 'Final release audit is not ready for production certification',
      severity: 'error',
    });
  }

  if (finalAuditReport.audit_status_message !== FINAL_RELEASE_AUDIT_STATUS_MESSAGE) {
    issues.push({
      code: 'FINAL_RELEASE_AUDIT_STATUS_MISMATCH',
      message: `Expected audit status message ${FINAL_RELEASE_AUDIT_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const datasetReady = finalAuditReport.dataset_chain === 'PASS' ? 'PASS' : 'FAIL';
  const dnaReady = finalAuditReport.dna_chain === 'PASS' ? 'PASS' : 'FAIL';
  const adapterReady = finalAuditReport.adapter_chain === 'PASS' ? 'PASS' : 'FAIL';
  const releaseReady = finalAuditReport.release_chain === 'PASS' ? 'PASS' : 'FAIL';
  const archiveReady = finalAuditReport.archive_chain === 'PASS' ? 'PASS' : 'FAIL';

  const readinessChecks: [string, CertificationStatus][] = [
    ['dataset_ready', datasetReady],
    ['dna_ready', dnaReady],
    ['adapter_ready', adapterReady],
    ['release_ready', releaseReady],
    ['archive_ready', archiveReady],
  ];

  for (const [check, status] of readinessChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'READINESS_CHECK_FAIL',
        message: `${check} validation failed`,
        severity: 'error',
      });
    }
  }

  const phaseAudits: ProductionReadyPhaseAudit[] = finalAuditReport.phase_audits.map((audit) => {
    const certified = audit.phase_audited === 'PASS' ? 'PASS' : 'FAIL';
    if (certified === 'FAIL') {
      issues.push({
        code: 'PHASE_NOT_CERTIFIED',
        message: `Phase ${audit.phase_num} not certified`,
        severity: 'error',
        phase_num: audit.phase_num,
      });
    }
    return {
      phase_num: audit.phase_num,
      phase: audit.phase,
      report_path: audit.report_path,
      phase_certified: certified,
    };
  });

  const phase067Certified =
    finalAuditReport.final_verdict === FINAL_RELEASE_AUDIT_PASS_VERDICT ? 'PASS' : 'FAIL';

  if (phase067Certified === 'FAIL') {
    issues.push({
      code: 'PHASE_067_NOT_CERTIFIED',
      message: 'Phase 067 final release audit not certified',
      severity: 'error',
      phase_num: '067',
    });
  }

  phaseAudits.push({
    phase_num: '067',
    phase: FINAL_RELEASE_AUDIT_PHASE,
    report_path: FINAL_RELEASE_AUDIT_REPORT_PATH,
    phase_certified: phase067Certified,
  });

  const auditReady =
    finalAuditReport.final_release_audit_ready === 'PASS' &&
    finalAuditReport.master_certification === 'PASS' &&
    phase067Certified === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (auditReady === 'FAIL') {
    issues.push({
      code: 'AUDIT_NOT_READY',
      message: 'Audit readiness validation failed',
      severity: 'error',
    });
  }

  const phases022To067Complete =
    finalAuditReport.phases_022_to_066_complete === 'PASS' &&
    phase067Certified === 'PASS' &&
    phaseAudits.every((audit) => audit.phase_certified === 'PASS') &&
    phaseAudits.length === EXPECTED_PHASE_COUNT
      ? 'PASS'
      : 'FAIL';

  if (phases022To067Complete === 'FAIL') {
    issues.push({
      code: 'PHASES_022_TO_067_INCOMPLETE',
      message: 'Phases 022-067 are not complete',
      severity: 'error',
    });
  }

  if (finalAuditReport.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (finalAuditReport.adapter_count !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    finalAuditReport.planning_only === true &&
    finalAuditReport.planning_only_status === 'PASS' &&
    finalAuditReport.generation === false &&
    finalAuditReport.gpu_execution === false &&
    finalAuditReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const productionReady =
    datasetReady === 'PASS' &&
    dnaReady === 'PASS' &&
    adapterReady === 'PASS' &&
    releaseReady === 'PASS' &&
    archiveReady === 'PASS' &&
    auditReady === 'PASS' &&
    phases022To067Complete === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    finalAuditReport.source_count === EXPECTED_SOURCE_COUNT &&
    finalAuditReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = productionReady === 'PASS';

  const report: MovieAnalysisProductionReadyCertificationReport = {
    report_id: 'movie-analysis-production-ready-certification-report-v1',
    phase: PRODUCTION_READY_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    generation: false,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    source_count: finalAuditReport.source_count,
    adapter_count: finalAuditReport.adapter_count,
    final_release_audit_report_path: FINAL_RELEASE_AUDIT_REPORT_PATH,
    dataset_ready: datasetReady,
    dna_ready: dnaReady,
    adapter_ready: adapterReady,
    release_ready: releaseReady,
    archive_ready: archiveReady,
    audit_ready: auditReady,
    phases_022_to_067_complete: phases022To067Complete,
    production_ready: productionReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? PRODUCTION_READY_STATUS_MESSAGE : null,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? PRODUCTION_READY_CERTIFICATION_PASS_VERDICT
      : PRODUCTION_READY_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_READY_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_READY_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
