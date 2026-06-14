import fs from 'node:fs';
import path from 'node:path';
import {
  CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE,
  CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisCrossGenerationSimulationCertificationReport,
} from './movieAnalysisCrossGenerationSimulationCertification.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  IMAGE_GENERATION_SIMULATION_PHASE,
  IMAGE_GENERATION_SIMULATION_REPORT_PATH,
  type MovieAnalysisImageGenerationSimulationReport,
} from './movieAnalysisImageGenerationSimulation.js';
import {
  VIDEO_GENERATION_SIMULATION_PASS_VERDICT,
  VIDEO_GENERATION_SIMULATION_PHASE,
  VIDEO_GENERATION_SIMULATION_REPORT_PATH,
  type MovieAnalysisVideoGenerationSimulationReport,
} from './movieAnalysisVideoGenerationSimulation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2C_SIMULATION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2C-004-MOVIE_ANALYSIS_LEVEL2C_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2C_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2C_SIMULATION_CERTIFICATION_V1' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_DIR =
  'reports/movie_analysis_level2c_simulation_certification' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2c_simulation_certification/movie-analysis-level2c-simulation-certification-report.json' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2c_simulation_certification/MOVIE_ANALYSIS_LEVEL2C_SIMULATION_CERTIFICATION.md' as const;
export const LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE = 'LEVEL2C_COMPLETE' as const;

export const LEVEL2C_PHASE_COUNT = 3 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2CSimulationCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type Level2CPhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
};

export type Level2CPhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type Level2CCompletionValidation = {
  image_generation_simulation_ready: CertificationStatus;
  video_generation_simulation_ready: CertificationStatus;
  cross_generation_simulation_ready: CertificationStatus;
};

export type MovieAnalysisLevel2CSimulationCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2C_SIMULATION_CERTIFICATION_PHASE;
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
  simulation_only: true;
  source_count: number;
  adapter_count: number;
  level2c_phase_count: typeof LEVEL2C_PHASE_COUNT;
  level2c_phases_complete: CertificationStatus;
  completion_validation: Level2CCompletionValidation;
  runtime_mapping_consistency: CertificationStatus;
  traceability_consistency: CertificationStatus;
  cross_generation_consistency: CertificationStatus;
  level2c_simulation_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE | null;
  image_generation_simulation_report_path: typeof IMAGE_GENERATION_SIMULATION_REPORT_PATH;
  video_generation_simulation_report_path: typeof VIDEO_GENERATION_SIMULATION_REPORT_PATH;
  cross_generation_simulation_certification_report_path: typeof CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH;
  phase_audits: Level2CPhaseAudit[];
  final_verdict:
    | typeof LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2C_SIMULATION_CERTIFICATION_FAIL_VERDICT;
  issues: Level2CSimulationCertificationIssue[];
};

export const LEVEL2C_PHASE_ENTRIES: Level2CPhaseEntry[] = [
  {
    phase_id: 'L2C-001',
    phase: IMAGE_GENERATION_SIMULATION_PHASE,
    report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    pass_verdict: IMAGE_GENERATION_SIMULATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2C-002',
    phase: VIDEO_GENERATION_SIMULATION_PHASE,
    report_path: VIDEO_GENERATION_SIMULATION_REPORT_PATH,
    pass_verdict: VIDEO_GENERATION_SIMULATION_PASS_VERDICT,
  },
  {
    phase_id: 'L2C-003',
    phase: CROSS_GENERATION_SIMULATION_CERTIFICATION_PHASE,
    report_path: CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
    pass_verdict: CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT,
  },
];

function loadReport<T>(projectRoot: string, reportPath: string): T | null {
  const abs = path.join(projectRoot, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function auditPhase(projectRoot: string, entry: Level2CPhaseEntry): Level2CPhaseAudit {
  const report = loadReport<{ final_verdict?: string }>(projectRoot, entry.report_path);
  const reportExists = report !== null;
  const phasePassed = reportExists && report.final_verdict === entry.pass_verdict;

  return {
    phase_id: entry.phase_id,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    phase_passed: phasePassed,
  };
}

function buildMarkdown(report: MovieAnalysisLevel2CSimulationCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2C Simulation Certification',
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
    `| generation | ${report.generation} |`,
    `| simulation_only | ${report.simulation_only} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Level 2C Chain',
    '',
    'Image Generation Simulation → Video Generation Simulation → Cross Generation Simulation Certification',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2c_phase_count | ${report.level2c_phase_count} |`,
    `| level2c_phases_complete | ${report.level2c_phases_complete} |`,
    `| image_generation_simulation_ready | ${report.completion_validation.image_generation_simulation_ready} |`,
    `| video_generation_simulation_ready | ${report.completion_validation.video_generation_simulation_ready} |`,
    `| cross_generation_simulation_ready | ${report.completion_validation.cross_generation_simulation_ready} |`,
    `| runtime_mapping_consistency | ${report.runtime_mapping_consistency} |`,
    `| traceability_consistency | ${report.traceability_consistency} |`,
    `| cross_generation_consistency | ${report.cross_generation_consistency} |`,
    `| level2c_simulation_certification_ready | ${report.level2c_simulation_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Phase Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `### ${audit.phase_id}`,
      '',
      `- phase: ${audit.phase}`,
      `- report_path: ${audit.report_path}`,
      `- report_exists: ${audit.report_exists}`,
      `- phase_passed: ${audit.phase_passed}`,
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
  issues: Level2CSimulationCertificationIssue[],
  phaseAudits: Level2CPhaseAudit[] = []
): MovieAnalysisLevel2CSimulationCertificationReport {
  const report: MovieAnalysisLevel2CSimulationCertificationReport = {
    report_id: 'movie-analysis-level2c-simulation-certification-report-v1',
    phase: LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    source_count: 0,
    adapter_count: 0,
    level2c_phase_count: LEVEL2C_PHASE_COUNT,
    level2c_phases_complete: 'FAIL',
    completion_validation: {
      image_generation_simulation_ready: 'FAIL',
      video_generation_simulation_ready: 'FAIL',
      cross_generation_simulation_ready: 'FAIL',
    },
    runtime_mapping_consistency: 'FAIL',
    traceability_consistency: 'FAIL',
    cross_generation_consistency: 'FAIL',
    level2c_simulation_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_generation_simulation_report_path: VIDEO_GENERATION_SIMULATION_REPORT_PATH,
    cross_generation_simulation_certification_report_path:
      CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: LEVEL2C_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2CSimulationCertification(
  projectRoot?: string
): MovieAnalysisLevel2CSimulationCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2CSimulationCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const phaseAudits = LEVEL2C_PHASE_ENTRIES.map((entry) => auditPhase(root, entry));

  for (const audit of phaseAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2C_PHASE_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    } else if (!audit.phase_passed) {
      issues.push({
        code: 'LEVEL2C_PHASE_NOT_PASS',
        message: `${audit.phase_id} must have PASS verdict`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
  }

  const imageSimulationReport = loadReport<MovieAnalysisImageGenerationSimulationReport>(
    root,
    IMAGE_GENERATION_SIMULATION_REPORT_PATH
  );
  const videoSimulationReport = loadReport<MovieAnalysisVideoGenerationSimulationReport>(
    root,
    VIDEO_GENERATION_SIMULATION_REPORT_PATH
  );
  const crossGenerationReport = loadReport<MovieAnalysisCrossGenerationSimulationCertificationReport>(
    root,
    CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH
  );

  if (!imageSimulationReport || !videoSimulationReport || !crossGenerationReport) {
    return writeFailReport(root, timestamp, issues, phaseAudits);
  }

  const completionValidation: Level2CCompletionValidation = {
    image_generation_simulation_ready: toStatus(
      imageSimulationReport.image_generation_simulation_ready === 'PASS' &&
        imageSimulationReport.final_verdict === IMAGE_GENERATION_SIMULATION_PASS_VERDICT
    ),
    video_generation_simulation_ready: toStatus(
      videoSimulationReport.video_generation_simulation_ready === 'PASS' &&
        videoSimulationReport.final_verdict === VIDEO_GENERATION_SIMULATION_PASS_VERDICT
    ),
    cross_generation_simulation_ready: toStatus(
      crossGenerationReport.cross_generation_consistency === 'PASS' &&
        crossGenerationReport.final_verdict === CROSS_GENERATION_SIMULATION_CERTIFICATION_PASS_VERDICT
    ),
  };

  const runtimeMappingConsistency = toStatus(
    imageSimulationReport.runtime_mapping_preserved === 'PASS' &&
      videoSimulationReport.runtime_mapping_preserved === 'PASS' &&
      crossGenerationReport.runtime_mapping_consistency === 'PASS'
  );

  const traceabilityConsistency = toStatus(
    imageSimulationReport.traceability_preserved === 'PASS' &&
      videoSimulationReport.traceability_preserved === 'PASS' &&
      crossGenerationReport.traceability_consistency === 'PASS'
  );

  const crossGenerationConsistency = toStatus(
    crossGenerationReport.cross_generation_consistency === 'PASS'
  );

  const sourceCount = crossGenerationReport.source_count;
  const adapterCount = crossGenerationReport.adapter_count;

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

  const safetyValid =
    imageSimulationReport.planning_only === true &&
    imageSimulationReport.planning_only_status === 'PASS' &&
    imageSimulationReport.generation === false &&
    imageSimulationReport.simulation_only === true &&
    videoSimulationReport.planning_only === true &&
    videoSimulationReport.planning_only_status === 'PASS' &&
    videoSimulationReport.generation === false &&
    videoSimulationReport.simulation_only === true &&
    crossGenerationReport.planning_only === true &&
    crossGenerationReport.planning_only_status === 'PASS' &&
    crossGenerationReport.generation === false &&
    crossGenerationReport.simulation_only === true;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const level2cPhasesComplete = toStatus(
    phaseAudits.length === LEVEL2C_PHASE_COUNT && phaseAudits.every((audit) => audit.phase_passed)
  );

  const completionChecks = Object.values(completionValidation);
  const aggregateChecks: CertificationStatus[] = [
    level2cPhasesComplete,
    ...completionChecks,
    runtimeMappingConsistency,
    traceabilityConsistency,
    crossGenerationConsistency,
    planningOnlyStatus,
  ];

  for (const status of aggregateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'LEVEL2C_VALIDATION_FAIL',
        message: 'Level 2C simulation certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const level2cSimulationCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    imageSimulationReport.source_count === EXPECTED_SOURCE_COUNT &&
    videoSimulationReport.source_count === EXPECTED_SOURCE_COUNT &&
    imageSimulationReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    videoSimulationReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    aggregateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2cSimulationCertificationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'LEVEL2C_VALIDATION_FAIL')) {
    issues.push({
      code: 'LEVEL2C_SIMULATION_NOT_READY',
      message: 'Level 2C simulation certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisLevel2CSimulationCertificationReport = {
    report_id: 'movie-analysis-level2c-simulation-certification-report-v1',
    phase: LEVEL2C_SIMULATION_CERTIFICATION_PHASE,
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
    simulation_only: true,
    source_count: sourceCount,
    adapter_count: adapterCount,
    level2c_phase_count: LEVEL2C_PHASE_COUNT,
    level2c_phases_complete: level2cPhasesComplete,
    completion_validation: completionValidation,
    runtime_mapping_consistency: runtimeMappingConsistency,
    traceability_consistency: traceabilityConsistency,
    cross_generation_consistency: crossGenerationConsistency,
    level2c_simulation_certification_ready: level2cSimulationCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL2C_SIMULATION_CERTIFICATION_STATUS_MESSAGE : null,
    image_generation_simulation_report_path: IMAGE_GENERATION_SIMULATION_REPORT_PATH,
    video_generation_simulation_report_path: VIDEO_GENERATION_SIMULATION_REPORT_PATH,
    cross_generation_simulation_certification_report_path:
      CROSS_GENERATION_SIMULATION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? LEVEL2C_SIMULATION_CERTIFICATION_PASS_VERDICT
      : LEVEL2C_SIMULATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2C_SIMULATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
