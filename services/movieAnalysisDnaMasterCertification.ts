import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_INTEGRATION_PASS_VERDICT,
  CINEMATIC_DNA_INTEGRATION_PHASE,
  CINEMATIC_DNA_INTEGRATION_REPORT_PATH,
} from './movieAnalysisCinematicDnaIntegration.js';
import {
  CINEMATIC_DNA_PASS_VERDICT,
  CINEMATIC_DNA_PHASE,
  CINEMATIC_DNA_REPORT_PATH,
} from './movieAnalysisCinematicDnaExtraction.js';
import {
  CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT,
  CINEMATIC_DNA_QUALITY_GATE_PHASE,
  CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
} from './movieAnalysisCinematicDnaQualityGate.js';
import {
  CERTIFICATION_PHASE_ENTRIES,
  DATASET_CERTIFICATION_PASS_VERDICT,
  DATASET_CERTIFICATION_PHASE,
  DATASET_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDatasetCertification.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
  DNA_ADAPTER_CERTIFICATION_PHASE,
  DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDnaAdapterCertification.js';
import {
  DNA_ADAPTER_LIBRARY_PASS_VERDICT,
  DNA_ADAPTER_LIBRARY_PHASE,
  DNA_ADAPTER_LIBRARY_REPORT_PATH,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_ADAPTER_VALIDATION_PASS_VERDICT,
  DNA_ADAPTER_VALIDATION_PHASE,
  DNA_ADAPTER_VALIDATION_REPORT_PATH,
} from './movieAnalysisDnaAdapterValidation.js';
import {
  DNA_ARCHIVE_AUDIT_PASS_VERDICT,
  DNA_ARCHIVE_AUDIT_PHASE,
  DNA_ARCHIVE_AUDIT_REPORT_PATH,
  type MovieAnalysisDnaArchiveAuditReport,
} from './movieAnalysisDnaArchiveAudit.js';
import {
  DNA_ARCHIVE_PASS_VERDICT,
  DNA_ARCHIVE_PHASE,
  DNA_ARCHIVE_REPORT_PATH,
} from './movieAnalysisDnaArchive.js';
import {
  DNA_CONSUMER_BRIDGE_PASS_VERDICT,
  DNA_CONSUMER_BRIDGE_PHASE,
  DNA_CONSUMER_BRIDGE_REPORT_PATH,
} from './movieAnalysisDnaConsumerBridge.js';
import {
  DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
  DNA_CONSUMER_IMPORT_TEST_PHASE,
  DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
} from './movieAnalysisDnaConsumerImportTest.js';
import {
  DNA_PACKAGING_PASS_VERDICT,
  DNA_PACKAGING_PHASE,
  DNA_PACKAGE_REPORT_PATH,
  EXPECTED_ADAPTER_COUNT,
} from './movieAnalysisDnaPackaging.js';
import {
  DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
  DNA_RELEASE_CERTIFICATION_PHASE,
  DNA_RELEASE_CERTIFICATION_REPORT_PATH,
} from './movieAnalysisDnaReleaseCertification.js';
import {
  DNA_RELEASE_PACKAGE_PASS_VERDICT,
  DNA_RELEASE_PACKAGE_PHASE,
  DNA_RELEASE_REPORT_PATH,
  EXPECTED_SOURCE_COUNT,
} from './movieAnalysisDnaReleasePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_MASTER_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-066-MOVIE_ANALYSIS_DNA_MASTER_CERTIFICATION_V1' as const;
export const DNA_MASTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_MASTER_CERTIFICATION_V1' as const;
export const DNA_MASTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_MASTER_CERTIFICATION_V1' as const;
export const DNA_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-dna-master-certification-report.json' as const;
export const DNA_MASTER_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_MASTER_CERTIFICATION.md' as const;
export const DNA_MASTER_CERTIFICATION_STATUS_MESSAGE =
  'Movie Analysis DNA Pipeline V1 Certified' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type DnaPipelineChain =
  | 'dataset_chain'
  | 'dna_chain'
  | 'adapter_chain'
  | 'release_chain'
  | 'archive_chain';

export type DnaMasterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_num?: string;
  chain?: DnaPipelineChain;
};

export type DnaMasterPhaseEntry = {
  phase_num: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  pass_field: 'final_verdict' | 'build_status';
  check_type: 'report' | 'bridge';
  chain: DnaPipelineChain;
};

export type DnaMasterPhaseAudit = {
  phase_num: string;
  phase: string;
  chain: DnaPipelineChain;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type DnaMasterChainAudit = {
  chain: DnaPipelineChain;
  phase_count: number;
  chain_passed: boolean;
};

export type MovieAnalysisDnaMasterCertificationReport = {
  report_id: string;
  phase: typeof DNA_MASTER_CERTIFICATION_PHASE;
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
  no_generation: true;
  source_count: number;
  adapter_count: number;
  archive_audit_report_path: typeof DNA_ARCHIVE_AUDIT_REPORT_PATH;
  dataset_chain: CertificationStatus;
  dna_chain: CertificationStatus;
  adapter_chain: CertificationStatus;
  release_chain: CertificationStatus;
  archive_chain: CertificationStatus;
  phases_022_to_065_complete: CertificationStatus;
  master_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status_message: typeof DNA_MASTER_CERTIFICATION_STATUS_MESSAGE | null;
  chain_audits: DnaMasterChainAudit[];
  phase_audits: DnaMasterPhaseAudit[];
  final_verdict:
    | typeof DNA_MASTER_CERTIFICATION_PASS_VERDICT
    | typeof DNA_MASTER_CERTIFICATION_FAIL_VERDICT;
  issues: DnaMasterCertificationIssue[];
};

const DNA_EXTENSION_PHASE_ENTRIES: DnaMasterPhaseEntry[] = [
  {
    phase_num: '052',
    phase: DATASET_CERTIFICATION_PHASE,
    report_path: DATASET_CERTIFICATION_REPORT_PATH,
    pass_verdict: DATASET_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'dataset_chain',
  },
  {
    phase_num: '053',
    phase: CINEMATIC_DNA_PHASE,
    report_path: CINEMATIC_DNA_REPORT_PATH,
    pass_verdict: CINEMATIC_DNA_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'dna_chain',
  },
  {
    phase_num: '054',
    phase: CINEMATIC_DNA_INTEGRATION_PHASE,
    report_path: CINEMATIC_DNA_INTEGRATION_REPORT_PATH,
    pass_verdict: CINEMATIC_DNA_INTEGRATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'dna_chain',
  },
  {
    phase_num: '055',
    phase: CINEMATIC_DNA_QUALITY_GATE_PHASE,
    report_path: CINEMATIC_DNA_QUALITY_GATE_REPORT_PATH,
    pass_verdict: CINEMATIC_DNA_QUALITY_GATE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'dna_chain',
  },
  {
    phase_num: '056',
    phase: DNA_ADAPTER_LIBRARY_PHASE,
    report_path: DNA_ADAPTER_LIBRARY_REPORT_PATH,
    pass_verdict: DNA_ADAPTER_LIBRARY_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'adapter_chain',
  },
  {
    phase_num: '057',
    phase: DNA_ADAPTER_VALIDATION_PHASE,
    report_path: DNA_ADAPTER_VALIDATION_REPORT_PATH,
    pass_verdict: DNA_ADAPTER_VALIDATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'adapter_chain',
  },
  {
    phase_num: '058',
    phase: DNA_ADAPTER_CERTIFICATION_PHASE,
    report_path: DNA_ADAPTER_CERTIFICATION_REPORT_PATH,
    pass_verdict: DNA_ADAPTER_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'adapter_chain',
  },
  {
    phase_num: '059',
    phase: DNA_PACKAGING_PHASE,
    report_path: DNA_PACKAGE_REPORT_PATH,
    pass_verdict: DNA_PACKAGING_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'release_chain',
  },
  {
    phase_num: '060',
    phase: DNA_CONSUMER_BRIDGE_PHASE,
    report_path: DNA_CONSUMER_BRIDGE_REPORT_PATH,
    pass_verdict: DNA_CONSUMER_BRIDGE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'release_chain',
  },
  {
    phase_num: '061',
    phase: DNA_CONSUMER_IMPORT_TEST_PHASE,
    report_path: DNA_CONSUMER_IMPORT_TEST_REPORT_PATH,
    pass_verdict: DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'release_chain',
  },
  {
    phase_num: '062',
    phase: DNA_RELEASE_PACKAGE_PHASE,
    report_path: DNA_RELEASE_REPORT_PATH,
    pass_verdict: DNA_RELEASE_PACKAGE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'release_chain',
  },
  {
    phase_num: '063',
    phase: DNA_RELEASE_CERTIFICATION_PHASE,
    report_path: DNA_RELEASE_CERTIFICATION_REPORT_PATH,
    pass_verdict: DNA_RELEASE_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'release_chain',
  },
  {
    phase_num: '064',
    phase: DNA_ARCHIVE_PHASE,
    report_path: DNA_ARCHIVE_REPORT_PATH,
    pass_verdict: DNA_ARCHIVE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'archive_chain',
  },
  {
    phase_num: '065',
    phase: DNA_ARCHIVE_AUDIT_PHASE,
    report_path: DNA_ARCHIVE_AUDIT_REPORT_PATH,
    pass_verdict: DNA_ARCHIVE_AUDIT_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
    chain: 'archive_chain',
  },
];

function getChainForPhase(phaseNum: string): DnaPipelineChain {
  const num = Number.parseInt(phaseNum, 10);
  if (num <= 52) return 'dataset_chain';
  if (num <= 55) return 'dna_chain';
  if (num <= 58) return 'adapter_chain';
  if (num <= 63) return 'release_chain';
  return 'archive_chain';
}

export const DNA_MASTER_PHASE_ENTRIES: DnaMasterPhaseEntry[] = [
  ...CERTIFICATION_PHASE_ENTRIES.map((entry) => ({
    phase_num: entry.phase_num,
    phase: entry.phase,
    report_path: entry.report_path,
    pass_verdict: entry.pass_verdict,
    pass_field: entry.pass_field,
    check_type: entry.check_type,
    chain: getChainForPhase(entry.phase_num),
  })),
  ...DNA_EXTENSION_PHASE_ENTRIES,
];

function loadArchiveAuditReport(projectRoot: string): MovieAnalysisDnaArchiveAuditReport | null {
  const abs = path.join(projectRoot, DNA_ARCHIVE_AUDIT_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisDnaArchiveAuditReport;
}

function auditPhase(
  root: string,
  entry: DnaMasterPhaseEntry,
  issues: DnaMasterCertificationIssue[]
): DnaMasterPhaseAudit {
  if (entry.check_type === 'bridge') {
    const imageBridgePath = path.join(root, IMAGE_CONSUMER_BRIDGE_PATH);
    const videoBridgePath = path.join(root, VIDEO_CONSUMER_BRIDGE_PATH);
    const imageExists = fs.existsSync(imageBridgePath);
    const videoExists = fs.existsSync(videoBridgePath);

    let phasePassed = false;
    if (imageExists && videoExists) {
      const imageBridge = JSON.parse(fs.readFileSync(imageBridgePath, 'utf8')) as {
        source_count?: number;
        entries?: unknown[];
      };
      const videoBridge = JSON.parse(fs.readFileSync(videoBridgePath, 'utf8')) as {
        source_count?: number;
        entries?: unknown[];
      };
      phasePassed =
        imageBridge.source_count === EXPECTED_SOURCE_COUNT &&
        videoBridge.source_count === EXPECTED_SOURCE_COUNT &&
        (imageBridge.entries?.length ?? 0) === EXPECTED_SOURCE_COUNT &&
        (videoBridge.entries?.length ?? 0) === EXPECTED_SOURCE_COUNT;
    }

    if (!imageExists || !videoExists || !phasePassed) {
      issues.push({
        code: 'PHASE_BRIDGE_NOT_PASS',
        message: `Phase ${entry.phase_num} consumer bridge artifacts are missing or incomplete`,
        severity: 'error',
        phase_num: entry.phase_num,
        chain: entry.chain,
      });
    }

    return {
      phase_num: entry.phase_num,
      phase: entry.phase,
      chain: entry.chain,
      report_path: entry.report_path,
      report_exists: imageExists && videoExists,
      phase_passed: phasePassed,
    };
  }

  const reportPath = path.join(root, entry.report_path);
  const reportExists = fs.existsSync(reportPath);
  let phasePassed = false;

  if (reportExists) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
    phasePassed = report[entry.pass_field] === entry.pass_verdict;
  }

  if (!reportExists) {
    issues.push({
      code: 'PHASE_REPORT_MISSING',
      message: `Missing ${entry.report_path} for phase ${entry.phase_num}`,
      severity: 'error',
      phase_num: entry.phase_num,
      chain: entry.chain,
    });
  } else if (!phasePassed) {
    issues.push({
      code: 'PHASE_REPORT_NOT_PASS',
      message: `Phase ${entry.phase_num} requires ${entry.pass_field}=${entry.pass_verdict}`,
      severity: 'error',
      phase_num: entry.phase_num,
      chain: entry.chain,
    });
  }

  return {
    phase_num: entry.phase_num,
    phase: entry.phase,
    chain: entry.chain,
    report_path: entry.report_path,
    report_exists: reportExists,
    phase_passed: phasePassed,
  };
}

function auditChain(
  chain: DnaPipelineChain,
  phaseAudits: DnaMasterPhaseAudit[]
): DnaMasterChainAudit {
  const chainPhases = phaseAudits.filter((audit) => audit.chain === chain);
  return {
    chain,
    phase_count: chainPhases.length,
    chain_passed: chainPhases.every((audit) => audit.report_exists && audit.phase_passed),
  };
}

function chainStatus(audit: DnaMasterChainAudit): CertificationStatus {
  return audit.chain_passed ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaMasterCertificationReport): string {
  const lines = [
    '# Movie Analysis DNA Master Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status_message) {
    lines.push(`## ${report.certification_status_message}`, '');
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
    `| no_generation | ${report.no_generation} |`,
    '',
    '## Pipeline Summary',
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
    `| phases_022_to_065_complete | ${report.phases_022_to_065_complete} |`,
    `| master_certification_ready | ${report.master_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Chain Audits',
    ''
  );

  for (const audit of report.chain_audits) {
    lines.push(
      `- ${audit.chain}: phases=${audit.phase_count} chain=${audit.chain_passed ? 'PASS' : 'FAIL'}`
    );
  }

  lines.push('', '## Phase Audits', '');
  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} [${audit.chain}] ${audit.phase}: report=${audit.report_exists ? 'PASS' : 'FAIL'} phase=${audit.phase_passed ? 'PASS' : 'FAIL'}`
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

export function writeMovieAnalysisDnaMasterCertificationReport(
  projectRoot?: string
): MovieAnalysisDnaMasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaMasterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const archiveAuditReport = loadArchiveAuditReport(root);
  if (!archiveAuditReport) {
    issues.push({
      code: 'ARCHIVE_AUDIT_REPORT_MISSING',
      message: `Missing ${DNA_ARCHIVE_AUDIT_REPORT_PATH}`,
      severity: 'error',
      chain: 'archive_chain',
    });
  } else if (archiveAuditReport.final_verdict !== DNA_ARCHIVE_AUDIT_PASS_VERDICT) {
    issues.push({
      code: 'ARCHIVE_AUDIT_NOT_PASS',
      message: `Archive audit must have ${DNA_ARCHIVE_AUDIT_PASS_VERDICT}`,
      severity: 'error',
      chain: 'archive_chain',
    });
  }

  const phaseAudits = DNA_MASTER_PHASE_ENTRIES.map((entry) => auditPhase(root, entry, issues));
  const phases022To065Complete = phaseAudits.every(
    (audit) => audit.report_exists && audit.phase_passed
  )
    ? 'PASS'
    : 'FAIL';

  const chainAudits: DnaMasterChainAudit[] = [
    auditChain('dataset_chain', phaseAudits),
    auditChain('dna_chain', phaseAudits),
    auditChain('adapter_chain', phaseAudits),
    auditChain('release_chain', phaseAudits),
    auditChain('archive_chain', phaseAudits),
  ];

  for (const chainAudit of chainAudits) {
    if (!chainAudit.chain_passed) {
      issues.push({
        code: 'CHAIN_NOT_PASS',
        message: `${chainAudit.chain} validation failed`,
        severity: 'error',
        chain: chainAudit.chain,
      });
    }
  }

  const datasetChain = chainStatus(chainAudits[0]);
  const dnaChain = chainStatus(chainAudits[1]);
  const adapterChain = chainStatus(chainAudits[2]);
  const releaseChain = chainStatus(chainAudits[3]);
  const archiveChain = chainStatus(chainAudits[4]);

  if (archiveAuditReport && archiveAuditReport.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
      chain: 'archive_chain',
    });
  }

  if (archiveAuditReport && archiveAuditReport.adapter_count !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
      chain: 'archive_chain',
    });
  }

  const safetyValid =
    archiveAuditReport?.planning_only === true &&
    archiveAuditReport.planning_only_status === 'PASS';

  if (archiveAuditReport && !safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const masterCertificationReady =
    archiveAuditReport !== null &&
    archiveAuditReport.final_verdict === DNA_ARCHIVE_AUDIT_PASS_VERDICT &&
    archiveAuditReport.archive_audit_ready === 'PASS' &&
    phases022To065Complete === 'PASS' &&
    datasetChain === 'PASS' &&
    dnaChain === 'PASS' &&
    adapterChain === 'PASS' &&
    releaseChain === 'PASS' &&
    archiveChain === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    archiveAuditReport.source_count === EXPECTED_SOURCE_COUNT &&
    archiveAuditReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = masterCertificationReady === 'PASS';

  const report: MovieAnalysisDnaMasterCertificationReport = {
    report_id: 'movie-analysis-dna-master-certification-report-v1',
    phase: DNA_MASTER_CERTIFICATION_PHASE,
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
    no_generation: true,
    source_count: archiveAuditReport?.source_count ?? 0,
    adapter_count: archiveAuditReport?.adapter_count ?? 0,
    archive_audit_report_path: DNA_ARCHIVE_AUDIT_REPORT_PATH,
    dataset_chain: datasetChain,
    dna_chain: dnaChain,
    adapter_chain: adapterChain,
    release_chain: releaseChain,
    archive_chain: archiveChain,
    phases_022_to_065_complete: phases022To065Complete,
    master_certification_ready: masterCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status_message: pass ? DNA_MASTER_CERTIFICATION_STATUS_MESSAGE : null,
    chain_audits: chainAudits,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? DNA_MASTER_CERTIFICATION_PASS_VERDICT
      : DNA_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
