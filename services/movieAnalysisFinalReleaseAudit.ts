import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_MASTER_CERTIFICATION_PASS_VERDICT,
  DNA_MASTER_CERTIFICATION_PHASE,
  DNA_MASTER_CERTIFICATION_REPORT_PATH,
  DNA_MASTER_CERTIFICATION_STATUS_MESSAGE,
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  type DnaPipelineChain,
  type MovieAnalysisDnaMasterCertificationReport,
} from './movieAnalysisDnaMasterCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_RELEASE_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-067-MOVIE_ANALYSIS_FINAL_RELEASE_AUDIT_V1' as const;
export const FINAL_RELEASE_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_FINAL_RELEASE_AUDIT_V1' as const;
export const FINAL_RELEASE_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_FINAL_RELEASE_AUDIT_V1' as const;
export const FINAL_RELEASE_AUDIT_REPORT_PATH =
  'reports/movie-analysis-final-release-audit-report.json' as const;
export const FINAL_RELEASE_AUDIT_MD_PATH =
  'reports/MOVIE_ANALYSIS_FINAL_RELEASE_AUDIT.md' as const;
export const FINAL_RELEASE_AUDIT_STATUS_MESSAGE =
  'Movie Analysis Certified Pipeline Audit Complete' as const;

export const EXPECTED_PHASE_COUNT = 45 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type AuditStatus = 'PASS' | 'FAIL';

export type FinalReleaseAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_num?: string;
  chain?: DnaPipelineChain | 'master_certification';
};

export type FinalReleaseChainAudit = {
  chain: DnaPipelineChain | 'master_certification';
  phase_count: number;
  chain_audited: AuditStatus;
};

export type FinalReleasePhaseAudit = {
  phase_num: string;
  phase: string;
  chain: DnaPipelineChain | 'master_certification';
  report_path: string;
  phase_audited: AuditStatus;
};

export type MovieAnalysisFinalReleaseAuditReport = {
  report_id: string;
  phase: typeof FINAL_RELEASE_AUDIT_PHASE;
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
  master_certification_report_path: typeof DNA_MASTER_CERTIFICATION_REPORT_PATH;
  dataset_chain: AuditStatus;
  dna_chain: AuditStatus;
  adapter_chain: AuditStatus;
  release_chain: AuditStatus;
  archive_chain: AuditStatus;
  master_certification: AuditStatus;
  phases_022_to_066_complete: AuditStatus;
  final_release_audit_ready: AuditStatus;
  planning_only_status: AuditStatus;
  audit_status_message: typeof FINAL_RELEASE_AUDIT_STATUS_MESSAGE | null;
  chain_audits: FinalReleaseChainAudit[];
  phase_audits: FinalReleasePhaseAudit[];
  final_verdict:
    | typeof FINAL_RELEASE_AUDIT_PASS_VERDICT
    | typeof FINAL_RELEASE_AUDIT_FAIL_VERDICT;
  issues: FinalReleaseAuditIssue[];
};

function loadMasterCertificationReport(
  projectRoot: string
): MovieAnalysisDnaMasterCertificationReport | null {
  const abs = path.join(projectRoot, DNA_MASTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisDnaMasterCertificationReport;
}

function chainAuditStatus(chainPassed: boolean): AuditStatus {
  return chainPassed ? 'PASS' : 'FAIL';
}

function phaseAuditStatus(reportExists: boolean, phasePassed: boolean): AuditStatus {
  return reportExists && phasePassed ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisFinalReleaseAuditReport): string {
  const lines = [
    '# Movie Analysis Final Release Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.audit_status_message) {
    lines.push(`## ${report.audit_status_message}`, '');
  }

  lines.push(
    '## Audit Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Pipeline Audit Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| dataset_chain | ${report.dataset_chain} |`,
    `| dna_chain | ${report.dna_chain} |`,
    `| adapter_chain | ${report.adapter_chain} |`,
    `| release_chain | ${report.release_chain} |`,
    `| archive_chain | ${report.archive_chain} |`,
    `| master_certification | ${report.master_certification} |`,
    `| phases_022_to_066_complete | ${report.phases_022_to_066_complete} |`,
    `| final_release_audit_ready | ${report.final_release_audit_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Chain Audits',
    ''
  );

  for (const audit of report.chain_audits) {
    lines.push(
      `- ${audit.chain}: phases=${audit.phase_count} audited=${audit.chain_audited}`
    );
  }

  lines.push('', '## Phase Audits', '');
  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} [${audit.chain}] ${audit.phase}: audited=${audit.phase_audited}`
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

export function writeMovieAnalysisFinalReleaseAuditReport(
  projectRoot?: string
): MovieAnalysisFinalReleaseAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: FinalReleaseAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  const masterCertReport = loadMasterCertificationReport(root);
  if (!masterCertReport) {
    issues.push({
      code: 'MASTER_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${DNA_MASTER_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
      chain: 'master_certification',
    });
  }

  if (!masterCertReport) {
    const report: MovieAnalysisFinalReleaseAuditReport = {
      report_id: 'movie-analysis-final-release-audit-report-v1',
      phase: FINAL_RELEASE_AUDIT_PHASE,
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
      master_certification_report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
      dataset_chain: 'FAIL',
      dna_chain: 'FAIL',
      adapter_chain: 'FAIL',
      release_chain: 'FAIL',
      archive_chain: 'FAIL',
      master_certification: 'FAIL',
      phases_022_to_066_complete: 'FAIL',
      final_release_audit_ready: 'FAIL',
      planning_only_status: 'FAIL',
      audit_status_message: null,
      chain_audits: [],
      phase_audits: [],
      final_verdict: FINAL_RELEASE_AUDIT_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, FINAL_RELEASE_AUDIT_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, FINAL_RELEASE_AUDIT_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );

    return report;
  }

  if (masterCertReport.final_verdict !== DNA_MASTER_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'MASTER_CERTIFICATION_NOT_PASS',
      message: `Master certification must have ${DNA_MASTER_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
      chain: 'master_certification',
    });
  }

  if (masterCertReport.master_certification_ready !== 'PASS') {
    issues.push({
      code: 'MASTER_CERTIFICATION_NOT_READY',
      message: 'Master certification is not ready for final release audit',
      severity: 'error',
      chain: 'master_certification',
    });
  }

  if (masterCertReport.certification_status_message !== DNA_MASTER_CERTIFICATION_STATUS_MESSAGE) {
    issues.push({
      code: 'MASTER_CERTIFICATION_STATUS_MISMATCH',
      message: `Expected certification status message ${DNA_MASTER_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
      chain: 'master_certification',
    });
  }

  const datasetChain = chainAuditStatus(masterCertReport.dataset_chain === 'PASS');
  const dnaChain = chainAuditStatus(masterCertReport.dna_chain === 'PASS');
  const adapterChain = chainAuditStatus(masterCertReport.adapter_chain === 'PASS');
  const releaseChain = chainAuditStatus(masterCertReport.release_chain === 'PASS');
  const archiveChain = chainAuditStatus(masterCertReport.archive_chain === 'PASS');

  const chainStatuses: Record<DnaPipelineChain, AuditStatus> = {
    dataset_chain: datasetChain,
    dna_chain: dnaChain,
    adapter_chain: adapterChain,
    release_chain: releaseChain,
    archive_chain: archiveChain,
  };

  for (const [chain, status] of Object.entries(chainStatuses) as [DnaPipelineChain, AuditStatus][]) {
    if (status === 'FAIL') {
      issues.push({
        code: 'CHAIN_AUDIT_FAIL',
        message: `${chain} audit failed`,
        severity: 'error',
        chain,
      });
    }
  }

  const masterCertification =
    masterCertReport.final_verdict === DNA_MASTER_CERTIFICATION_PASS_VERDICT &&
    masterCertReport.master_certification_ready === 'PASS' &&
    masterCertReport.phases_022_to_065_complete === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (masterCertification === 'FAIL') {
    issues.push({
      code: 'MASTER_CERTIFICATION_AUDIT_FAIL',
      message: 'Master certification audit failed',
      severity: 'error',
      chain: 'master_certification',
    });
  }

  const phaseAudits: FinalReleasePhaseAudit[] = masterCertReport.phase_audits.map((audit) => {
    const audited = phaseAuditStatus(audit.report_exists, audit.phase_passed);
    if (audited === 'FAIL') {
      issues.push({
        code: 'PHASE_AUDIT_FAIL',
        message: `Phase ${audit.phase_num} audit failed`,
        severity: 'error',
        phase_num: audit.phase_num,
        chain: audit.chain,
      });
    }
    return {
      phase_num: audit.phase_num,
      phase: audit.phase,
      chain: audit.chain,
      report_path: audit.report_path,
      phase_audited: audited,
    };
  });

  const phase066Audited =
    masterCertReport.final_verdict === DNA_MASTER_CERTIFICATION_PASS_VERDICT ? 'PASS' : 'FAIL';

  if (phase066Audited === 'FAIL') {
    issues.push({
      code: 'PHASE_066_AUDIT_FAIL',
      message: 'Phase 066 master certification audit failed',
      severity: 'error',
      phase_num: '066',
      chain: 'master_certification',
    });
  }

  phaseAudits.push({
    phase_num: '066',
    phase: DNA_MASTER_CERTIFICATION_PHASE,
    chain: 'master_certification',
    report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
    phase_audited: phase066Audited,
  });

  const phases022To066Complete =
    masterCertReport.phases_022_to_065_complete === 'PASS' &&
    phase066Audited === 'PASS' &&
    phaseAudits.every((audit) => audit.phase_audited === 'PASS') &&
    phaseAudits.length === EXPECTED_PHASE_COUNT
      ? 'PASS'
      : 'FAIL';

  if (phases022To066Complete === 'FAIL') {
    issues.push({
      code: 'PHASES_022_TO_066_INCOMPLETE',
      message: 'Phases 022-066 are not complete',
      severity: 'error',
    });
  }

  if (masterCertReport.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (masterCertReport.adapter_count !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    masterCertReport.planning_only === true &&
    masterCertReport.planning_only_status === 'PASS' &&
    masterCertReport.generation === false &&
    masterCertReport.gpu_execution === false &&
    masterCertReport.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: AuditStatus = safetyValid ? 'PASS' : 'FAIL';

  const chainAudits: FinalReleaseChainAudit[] = [
    ...masterCertReport.chain_audits.map((audit) => ({
      chain: audit.chain,
      phase_count: audit.phase_count,
      chain_audited: chainAuditStatus(audit.chain_passed),
    })),
    {
      chain: 'master_certification' as const,
      phase_count: 1,
      chain_audited: masterCertification,
    },
  ];

  const finalReleaseAuditReady =
    datasetChain === 'PASS' &&
    dnaChain === 'PASS' &&
    adapterChain === 'PASS' &&
    releaseChain === 'PASS' &&
    archiveChain === 'PASS' &&
    masterCertification === 'PASS' &&
    phases022To066Complete === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    masterCertReport.source_count === EXPECTED_SOURCE_COUNT &&
    masterCertReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = finalReleaseAuditReady === 'PASS';

  const report: MovieAnalysisFinalReleaseAuditReport = {
    report_id: 'movie-analysis-final-release-audit-report-v1',
    phase: FINAL_RELEASE_AUDIT_PHASE,
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
    source_count: masterCertReport.source_count,
    adapter_count: masterCertReport.adapter_count,
    master_certification_report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
    dataset_chain: datasetChain,
    dna_chain: dnaChain,
    adapter_chain: adapterChain,
    release_chain: releaseChain,
    archive_chain: archiveChain,
    master_certification: masterCertification,
    phases_022_to_066_complete: phases022To066Complete,
    final_release_audit_ready: finalReleaseAuditReady,
    planning_only_status: planningOnlyStatus,
    audit_status_message: pass ? FINAL_RELEASE_AUDIT_STATUS_MESSAGE : null,
    chain_audits: chainAudits,
    phase_audits: phaseAudits,
    final_verdict: pass ? FINAL_RELEASE_AUDIT_PASS_VERDICT : FINAL_RELEASE_AUDIT_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, FINAL_RELEASE_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FINAL_RELEASE_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
