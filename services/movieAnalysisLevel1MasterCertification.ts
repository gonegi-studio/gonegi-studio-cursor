import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_APP_CERTIFICATION_PASS_VERDICT,
  CROSS_APP_CERTIFICATION_PHASE,
  CROSS_APP_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisCrossAppCertificationReport,
} from './movieAnalysisCrossAppCertification.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  DNA_MASTER_CERTIFICATION_PASS_VERDICT,
  DNA_MASTER_CERTIFICATION_PHASE,
  DNA_MASTER_CERTIFICATION_REPORT_PATH,
  DNA_MASTER_PHASE_ENTRIES,
  type DnaMasterPhaseEntry,
  type MovieAnalysisDnaMasterCertificationReport,
} from './movieAnalysisDnaMasterCertification.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  ENGINE_FINAL_HANDOFF_PASS_VERDICT,
  ENGINE_FINAL_HANDOFF_PHASE,
  ENGINE_FINAL_HANDOFF_REPORT_PATH,
  type MovieAnalysisEngineFinalHandoffReport,
} from './movieAnalysisEngineFinalHandoff.js';
import {
  FINAL_RELEASE_AUDIT_PASS_VERDICT,
  FINAL_RELEASE_AUDIT_PHASE,
  FINAL_RELEASE_AUDIT_REPORT_PATH,
} from './movieAnalysisFinalReleaseAudit.js';
import {
  IMAGE_APP_BRIDGE_PASS_VERDICT,
  IMAGE_APP_BRIDGE_PHASE,
  IMAGE_APP_BRIDGE_REPORT_PATH,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_APP_CERTIFICATION_PASS_VERDICT,
  IMAGE_APP_CERTIFICATION_PHASE,
  IMAGE_APP_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisImageAppCertificationReport,
} from './movieAnalysisImageAppCertification.js';
import {
  IMAGE_APP_IMPORT_TEST_PASS_VERDICT,
  IMAGE_APP_IMPORT_TEST_PHASE,
  IMAGE_APP_IMPORT_TEST_REPORT_PATH,
} from './movieAnalysisImageAppImportTest.js';
import {
  L1B_FINAL_CERTIFICATION_PASS_VERDICT,
  L1B_FINAL_CERTIFICATION_PHASE,
  L1B_FINAL_CERTIFICATION_REPORT_PATH,
  L1B_FINAL_CERTIFICATION_STATUS_MESSAGE,
  type L1bPhaseAudit,
  type MovieAnalysisL1bFinalCertificationReport,
} from './movieAnalysisL1bFinalCertification.js';
import {
  PRODUCTION_READY_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_READY_CERTIFICATION_PHASE,
  PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisProductionReadyCertificationReport,
} from './movieAnalysisProductionReadyCertification.js';
import {
  VIDEO_APP_BRIDGE_PASS_VERDICT,
  VIDEO_APP_BRIDGE_PHASE,
  VIDEO_APP_BRIDGE_REPORT_PATH,
} from './movieAnalysisVideoAppBridge.js';
import {
  VIDEO_APP_CERTIFICATION_PASS_VERDICT,
  VIDEO_APP_CERTIFICATION_PHASE,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisVideoAppCertificationReport,
} from './movieAnalysisVideoAppCertification.js';
import {
  VIDEO_APP_IMPORT_TEST_PASS_VERDICT,
  VIDEO_APP_IMPORT_TEST_PHASE,
  VIDEO_APP_IMPORT_TEST_REPORT_PATH,
} from './movieAnalysisVideoAppImportTest.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL1_MASTER_CERTIFICATION_PHASE =
  'PHASE-L1B-008-MOVIE_ANALYSIS_LEVEL1_MASTER_CERTIFICATION_V1' as const;
export const LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL1_MASTER_CERTIFICATION_V1' as const;
export const LEVEL1_MASTER_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL1_MASTER_CERTIFICATION_V1' as const;
export const LEVEL1_MASTER_CERTIFICATION_DIR =
  'reports/movie_analysis_level1_master_certification' as const;
export const LEVEL1_MASTER_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level1_master_certification/movie-analysis-level1-master-certification-report.json' as const;
export const LEVEL1_MASTER_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level1_master_certification/MOVIE_ANALYSIS_LEVEL1_MASTER_CERTIFICATION.md' as const;
export const LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE = 'LEVEL_1_COMPLETE' as const;

export const PHASE_RANGE_START = '022' as const;
export const PHASE_RANGE_END = '076' as const;
export const PHASE_RANGE_COUNT = 55 as const;
export const L1B_PHASE_COUNT = 7 as const;
export const TOTAL_LEVEL1_PHASE_COUNT = 62 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level1MasterCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_num?: string;
  phase_id?: string;
};

export type Level1aPhaseEntry = {
  phase_num: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
  pass_field: 'final_verdict' | 'build_status';
  check_type: 'report' | 'bridge';
};

export type Level1PhaseAudit = {
  phase_num: string;
  phase: string;
  report_path: string;
  track: 'level1a' | 'level1b';
  report_exists: boolean;
  phase_passed: boolean;
};

export type Level1CompletionValidation = {
  engine_complete: CertificationStatus;
  dna_complete: CertificationStatus;
  adapter_complete: CertificationStatus;
  release_complete: CertificationStatus;
  archive_complete: CertificationStatus;
  image_app_complete: CertificationStatus;
  video_app_complete: CertificationStatus;
  cross_app_complete: CertificationStatus;
  validation_complete: CertificationStatus;
  normalization_complete: CertificationStatus;
  granularity_restore_complete: CertificationStatus;
  adapter_restore_complete: CertificationStatus;
};

export type MovieAnalysisLevel1MasterCertificationReport = {
  report_id: string;
  phase: typeof LEVEL1_MASTER_CERTIFICATION_PHASE;
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
  phase_range_start: typeof PHASE_RANGE_START;
  phase_range_end: typeof PHASE_RANGE_END;
  phase_range_count: typeof PHASE_RANGE_COUNT;
  l1b_phase_count: typeof L1B_PHASE_COUNT;
  total_level1_phase_count: typeof TOTAL_LEVEL1_PHASE_COUNT;
  phases_022_to_076_complete: CertificationStatus;
  l1b_phases_complete: CertificationStatus;
  completion_validation: Level1CompletionValidation;
  level1_master_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE | null;
  l1b_final_certification_report_path: typeof L1B_FINAL_CERTIFICATION_REPORT_PATH;
  engine_final_handoff_report_path: typeof ENGINE_FINAL_HANDOFF_REPORT_PATH;
  dna_master_certification_report_path: typeof DNA_MASTER_CERTIFICATION_REPORT_PATH;
  phase_audits: Level1PhaseAudit[];
  final_verdict:
    | typeof LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL1_MASTER_CERTIFICATION_FAIL_VERDICT;
  issues: Level1MasterCertificationIssue[];
};

const LEVEL1A_POST_DNA_PHASE_ENTRIES: Level1aPhaseEntry[] = [
  {
    phase_num: '066',
    phase: DNA_MASTER_CERTIFICATION_PHASE,
    report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
    pass_verdict: DNA_MASTER_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '067',
    phase: FINAL_RELEASE_AUDIT_PHASE,
    report_path: FINAL_RELEASE_AUDIT_REPORT_PATH,
    pass_verdict: FINAL_RELEASE_AUDIT_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '068',
    phase: PRODUCTION_READY_CERTIFICATION_PHASE,
    report_path: PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
    pass_verdict: PRODUCTION_READY_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '069',
    phase: IMAGE_APP_BRIDGE_PHASE,
    report_path: IMAGE_APP_BRIDGE_REPORT_PATH,
    pass_verdict: IMAGE_APP_BRIDGE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '070',
    phase: IMAGE_APP_IMPORT_TEST_PHASE,
    report_path: IMAGE_APP_IMPORT_TEST_REPORT_PATH,
    pass_verdict: IMAGE_APP_IMPORT_TEST_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '071',
    phase: IMAGE_APP_CERTIFICATION_PHASE,
    report_path: IMAGE_APP_CERTIFICATION_REPORT_PATH,
    pass_verdict: IMAGE_APP_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '072',
    phase: VIDEO_APP_BRIDGE_PHASE,
    report_path: VIDEO_APP_BRIDGE_REPORT_PATH,
    pass_verdict: VIDEO_APP_BRIDGE_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '073',
    phase: VIDEO_APP_IMPORT_TEST_PHASE,
    report_path: VIDEO_APP_IMPORT_TEST_REPORT_PATH,
    pass_verdict: VIDEO_APP_IMPORT_TEST_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '074',
    phase: VIDEO_APP_CERTIFICATION_PHASE,
    report_path: VIDEO_APP_CERTIFICATION_REPORT_PATH,
    pass_verdict: VIDEO_APP_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '075',
    phase: CROSS_APP_CERTIFICATION_PHASE,
    report_path: CROSS_APP_CERTIFICATION_REPORT_PATH,
    pass_verdict: CROSS_APP_CERTIFICATION_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
  {
    phase_num: '076',
    phase: ENGINE_FINAL_HANDOFF_PHASE,
    report_path: ENGINE_FINAL_HANDOFF_REPORT_PATH,
    pass_verdict: ENGINE_FINAL_HANDOFF_PASS_VERDICT,
    pass_field: 'final_verdict',
    check_type: 'report',
  },
];

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function auditLevel1aPhase(
  projectRoot: string,
  entry: Level1aPhaseEntry | DnaMasterPhaseEntry,
  issues: Level1MasterCertificationIssue[]
): Level1PhaseAudit {
  if (entry.check_type === 'bridge') {
    const imageBridgePath = path.join(projectRoot, IMAGE_CONSUMER_BRIDGE_PATH);
    const videoBridgePath = path.join(projectRoot, VIDEO_CONSUMER_BRIDGE_PATH);
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
        code: 'LEVEL1A_PHASE_BRIDGE_NOT_PASS',
        message: `Phase ${entry.phase_num} consumer bridge artifacts are missing or incomplete`,
        severity: 'error',
        phase_num: entry.phase_num,
      });
    }

    return {
      phase_num: entry.phase_num,
      phase: entry.phase,
      report_path: entry.report_path,
      track: 'level1a',
      report_exists: imageExists && videoExists,
      phase_passed: phasePassed,
    };
  }

  const reportPath = path.join(projectRoot, entry.report_path);
  const reportExists = fs.existsSync(reportPath);
  let phasePassed = false;

  if (reportExists) {
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as Record<string, unknown>;
    phasePassed = report[entry.pass_field] === entry.pass_verdict;
  }

  if (!reportExists) {
    issues.push({
      code: 'LEVEL1A_PHASE_REPORT_MISSING',
      message: `Missing ${entry.report_path} for phase ${entry.phase_num}`,
      severity: 'error',
      phase_num: entry.phase_num,
    });
  } else if (!phasePassed) {
    issues.push({
      code: 'LEVEL1A_PHASE_NOT_PASS',
      message: `Phase ${entry.phase_num} requires ${entry.pass_field}=${entry.pass_verdict}`,
      severity: 'error',
      phase_num: entry.phase_num,
    });
  }

  return {
    phase_num: entry.phase_num,
    phase: entry.phase,
    report_path: entry.report_path,
    track: 'level1a',
    report_exists: reportExists,
    phase_passed: phasePassed,
  };
}

function auditL1bPhase(
  audit: L1bPhaseAudit,
  issues: Level1MasterCertificationIssue[]
): Level1PhaseAudit {
  if (!audit.report_exists || !audit.phase_passed) {
    issues.push({
      code: 'L1B_PHASE_NOT_PASS',
      message: `${audit.phase_id} validation failed`,
      severity: 'error',
      phase_id: audit.phase_id,
    });
  }

  return {
    phase_num: audit.phase_id,
    phase: audit.phase,
    report_path: audit.report_path,
    track: 'level1b',
    report_exists: audit.report_exists,
    phase_passed: audit.phase_passed,
  };
}

function buildMarkdown(report: MovieAnalysisLevel1MasterCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 1 Master Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## ${report.certification_status}`, '');
  }

  lines.push(
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    '',
    '## Phase Range',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| phase_range | ${report.phase_range_start}-${report.phase_range_end} |`,
    `| phase_range_count | ${report.phase_range_count} |`,
    `| l1b_phase_count | ${report.l1b_phase_count} |`,
    `| total_level1_phase_count | ${report.total_level1_phase_count} |`,
    `| phases_022_to_076_complete | ${report.phases_022_to_076_complete} |`,
    `| l1b_phases_complete | ${report.l1b_phases_complete} |`,
    '',
    '## Completion Validation',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| engine_complete | ${report.completion_validation.engine_complete} |`,
    `| dna_complete | ${report.completion_validation.dna_complete} |`,
    `| adapter_complete | ${report.completion_validation.adapter_complete} |`,
    `| release_complete | ${report.completion_validation.release_complete} |`,
    `| archive_complete | ${report.completion_validation.archive_complete} |`,
    `| image_app_complete | ${report.completion_validation.image_app_complete} |`,
    `| video_app_complete | ${report.completion_validation.video_app_complete} |`,
    `| cross_app_complete | ${report.completion_validation.cross_app_complete} |`,
    `| validation_complete | ${report.completion_validation.validation_complete} |`,
    `| normalization_complete | ${report.completion_validation.normalization_complete} |`,
    `| granularity_restore_complete | ${report.completion_validation.granularity_restore_complete} |`,
    `| adapter_restore_complete | ${report.completion_validation.adapter_restore_complete} |`,
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level1_master_certification_ready | ${report.level1_master_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Phase Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} [${audit.track}] ${audit.phase}: report=${audit.report_exists ? 'PASS' : 'FAIL'} phase=${audit.phase_passed ? 'PASS' : 'FAIL'}`
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

function writeFailReport(
  root: string,
  timestamp: string,
  issues: Level1MasterCertificationIssue[],
  phaseAudits: Level1PhaseAudit[] = []
): MovieAnalysisLevel1MasterCertificationReport {
  const report: MovieAnalysisLevel1MasterCertificationReport = {
    report_id: 'movie-analysis-level1-master-certification-report-v1',
    phase: LEVEL1_MASTER_CERTIFICATION_PHASE,
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
    phase_range_start: PHASE_RANGE_START,
    phase_range_end: PHASE_RANGE_END,
    phase_range_count: PHASE_RANGE_COUNT,
    l1b_phase_count: L1B_PHASE_COUNT,
    total_level1_phase_count: TOTAL_LEVEL1_PHASE_COUNT,
    phases_022_to_076_complete: 'FAIL',
    l1b_phases_complete: 'FAIL',
    completion_validation: {
      engine_complete: 'FAIL',
      dna_complete: 'FAIL',
      adapter_complete: 'FAIL',
      release_complete: 'FAIL',
      archive_complete: 'FAIL',
      image_app_complete: 'FAIL',
      video_app_complete: 'FAIL',
      cross_app_complete: 'FAIL',
      validation_complete: 'FAIL',
      normalization_complete: 'FAIL',
      granularity_restore_complete: 'FAIL',
      adapter_restore_complete: 'FAIL',
    },
    level1_master_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    l1b_final_certification_report_path: L1B_FINAL_CERTIFICATION_REPORT_PATH,
    engine_final_handoff_report_path: ENGINE_FINAL_HANDOFF_REPORT_PATH,
    dna_master_certification_report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: LEVEL1_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL1_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL1_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel1MasterCertificationReport(
  projectRoot?: string
): MovieAnalysisLevel1MasterCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level1MasterCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const l1bReport = loadReport<MovieAnalysisL1bFinalCertificationReport>(
    root,
    L1B_FINAL_CERTIFICATION_REPORT_PATH
  );
  if (!l1bReport) {
    issues.push({
      code: 'L1B_FINAL_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${L1B_FINAL_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
      phase_id: 'L1B-007',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (l1bReport.final_verdict !== L1B_FINAL_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'L1B_FINAL_CERTIFICATION_NOT_PASS',
      message: `L1B final certification must have ${L1B_FINAL_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
      phase_id: 'L1B-007',
    });
  }

  if (l1bReport.certification_status !== L1B_FINAL_CERTIFICATION_STATUS_MESSAGE) {
    issues.push({
      code: 'L1B_STATUS_MISMATCH',
      message: `Expected ${L1B_FINAL_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
      phase_id: 'L1B-007',
    });
  }

  const engineReport = loadReport<MovieAnalysisEngineFinalHandoffReport>(
    root,
    ENGINE_FINAL_HANDOFF_REPORT_PATH
  );
  const dnaMasterReport = loadReport<MovieAnalysisDnaMasterCertificationReport>(
    root,
    DNA_MASTER_CERTIFICATION_REPORT_PATH
  );
  const productionReadyReport = loadReport<MovieAnalysisProductionReadyCertificationReport>(
    root,
    PRODUCTION_READY_CERTIFICATION_REPORT_PATH
  );
  const imageCertReport = loadReport<MovieAnalysisImageAppCertificationReport>(
    root,
    IMAGE_APP_CERTIFICATION_REPORT_PATH
  );
  const videoCertReport = loadReport<MovieAnalysisVideoAppCertificationReport>(
    root,
    VIDEO_APP_CERTIFICATION_REPORT_PATH
  );
  const crossAppReport = loadReport<MovieAnalysisCrossAppCertificationReport>(
    root,
    CROSS_APP_CERTIFICATION_REPORT_PATH
  );

  const level1aPhaseAudits = [
    ...DNA_MASTER_PHASE_ENTRIES.map((entry) => auditLevel1aPhase(root, entry, issues)),
    ...LEVEL1A_POST_DNA_PHASE_ENTRIES.map((entry) => auditLevel1aPhase(root, entry, issues)),
  ];

  const l1bPhaseAudits = l1bReport.phase_audits.map((audit) => auditL1bPhase(audit, issues));
  const l1b007Audit: Level1PhaseAudit = {
    phase_num: 'L1B-007',
    phase: L1B_FINAL_CERTIFICATION_PHASE,
    report_path: L1B_FINAL_CERTIFICATION_REPORT_PATH,
    track: 'level1b',
    report_exists: true,
    phase_passed: l1bReport.final_verdict === L1B_FINAL_CERTIFICATION_PASS_VERDICT,
  };

  if (!l1b007Audit.phase_passed) {
    issues.push({
      code: 'L1B_007_NOT_PASS',
      message: 'L1B-007 final certification phase failed',
      severity: 'error',
      phase_id: 'L1B-007',
    });
  }

  const phaseAudits = [...level1aPhaseAudits, ...l1bPhaseAudits, l1b007Audit];

  const phases022To076Complete =
    level1aPhaseAudits.length === PHASE_RANGE_COUNT &&
    level1aPhaseAudits.every((audit) => audit.report_exists && audit.phase_passed)
      ? 'PASS'
      : 'FAIL';

  if (phases022To076Complete === 'FAIL') {
    issues.push({
      code: 'PHASES_022_TO_076_INCOMPLETE',
      message: `Expected ${PHASE_RANGE_COUNT} Level 1-A phases complete`,
      severity: 'error',
    });
  }

  const l1bPhasesComplete =
    l1bReport.l1b_phases_complete === 'PASS' &&
    l1bReport.level1b_certification_ready === 'PASS' &&
    [...l1bPhaseAudits, l1b007Audit].every((audit) => audit.report_exists && audit.phase_passed)
      ? 'PASS'
      : 'FAIL';

  if (l1bPhasesComplete === 'FAIL') {
    issues.push({
      code: 'L1B_PHASES_INCOMPLETE',
      message: `Expected ${L1B_PHASE_COUNT} Level 1-B phases complete`,
      severity: 'error',
    });
  }

  const engineComplete =
    engineReport?.final_verdict === ENGINE_FINAL_HANDOFF_PASS_VERDICT &&
    engineReport.handoff_package_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const dnaComplete =
    dnaMasterReport?.dna_chain === 'PASS' && productionReadyReport?.dna_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const adapterComplete =
    dnaMasterReport?.adapter_chain === 'PASS' && productionReadyReport?.adapter_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const releaseComplete =
    dnaMasterReport?.release_chain === 'PASS' && productionReadyReport?.release_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const archiveComplete =
    dnaMasterReport?.archive_chain === 'PASS' && productionReadyReport?.archive_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const imageAppComplete =
    imageCertReport?.final_verdict === IMAGE_APP_CERTIFICATION_PASS_VERDICT ? 'PASS' : 'FAIL';
  const videoAppComplete =
    videoCertReport?.final_verdict === VIDEO_APP_CERTIFICATION_PASS_VERDICT ? 'PASS' : 'FAIL';
  const crossAppComplete =
    crossAppReport?.final_verdict === CROSS_APP_CERTIFICATION_PASS_VERDICT ? 'PASS' : 'FAIL';
  const validationComplete =
    l1bReport.real_world_validation === 'PASS' && l1bReport.l1b_phases_complete === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const normalizationComplete =
    l1bReport.dataset_normalization === 'PASS' &&
    l1bReport.normalization_quality_gate === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const granularityRestoreComplete =
    l1bReport.scene_granularity_restore === 'PASS' &&
    l1bReport.additional_validation.scene_granularity_restored === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const adapterRestoreComplete =
    l1bReport.adapter_detail_restore === 'PASS' &&
    l1bReport.additional_validation.adapter_detail_restored === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const completionValidation: Level1CompletionValidation = {
    engine_complete: engineComplete,
    dna_complete: dnaComplete,
    adapter_complete: adapterComplete,
    release_complete: releaseComplete,
    archive_complete: archiveComplete,
    image_app_complete: imageAppComplete,
    video_app_complete: videoAppComplete,
    cross_app_complete: crossAppComplete,
    validation_complete: validationComplete,
    normalization_complete: normalizationComplete,
    granularity_restore_complete: granularityRestoreComplete,
    adapter_restore_complete: adapterRestoreComplete,
  };

  for (const [check, status] of Object.entries(completionValidation)) {
    if (status === 'FAIL') {
      issues.push({
        code: 'COMPLETION_CHECK_FAIL',
        message: `${check} must be PASS`,
        severity: 'error',
      });
    }
  }

  const sourceCount = l1bReport.source_count;
  const adapterCount = l1bReport.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const planningReports = [
    l1bReport,
    engineReport,
    dnaMasterReport,
    productionReadyReport,
    imageCertReport,
    videoCertReport,
    crossAppReport,
  ].filter((report): report is NonNullable<typeof report> => report !== null);

  const safetyValid = planningReports.every(
    (report) => report.planning_only === true && report.planning_only_status === 'PASS'
  );

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed across Level 1 phases',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const completionValid = Object.values(completionValidation).every((status) => status === 'PASS');

  const level1MasterCertificationReady =
    phases022To076Complete === 'PASS' &&
    l1bPhasesComplete === 'PASS' &&
    completionValid &&
    planningOnlyStatus === 'PASS' &&
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    phaseAudits.length === TOTAL_LEVEL1_PHASE_COUNT &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level1MasterCertificationReady === 'PASS';

  const report: MovieAnalysisLevel1MasterCertificationReport = {
    report_id: 'movie-analysis-level1-master-certification-report-v1',
    phase: LEVEL1_MASTER_CERTIFICATION_PHASE,
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
    source_count: sourceCount,
    adapter_count: adapterCount,
    phase_range_start: PHASE_RANGE_START,
    phase_range_end: PHASE_RANGE_END,
    phase_range_count: PHASE_RANGE_COUNT,
    l1b_phase_count: L1B_PHASE_COUNT,
    total_level1_phase_count: TOTAL_LEVEL1_PHASE_COUNT,
    phases_022_to_076_complete: phases022To076Complete,
    l1b_phases_complete: l1bPhasesComplete,
    completion_validation: completionValidation,
    level1_master_certification_ready: level1MasterCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL1_MASTER_CERTIFICATION_STATUS_MESSAGE : null,
    l1b_final_certification_report_path: L1B_FINAL_CERTIFICATION_REPORT_PATH,
    engine_final_handoff_report_path: ENGINE_FINAL_HANDOFF_REPORT_PATH,
    dna_master_certification_report_path: DNA_MASTER_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? LEVEL1_MASTER_CERTIFICATION_PASS_VERDICT
      : LEVEL1_MASTER_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL1_MASTER_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL1_MASTER_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL1_MASTER_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
