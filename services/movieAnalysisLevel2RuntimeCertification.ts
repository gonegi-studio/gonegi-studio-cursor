import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_PHASE,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
  type MovieAnalysisImageRuntimePackageReport,
} from './movieAnalysisImageRuntimePackage.js';
import {
  PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT,
  PROMPT_ASSEMBLY_ENGINE_PHASE,
  PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
  type MovieAnalysisPromptAssemblyEngineReport,
} from './movieAnalysisPromptAssemblyEngine.js';
import {
  PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT,
  PROMPT_CONFLICT_RESOLUTION_PHASE,
  PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
  type MovieAnalysisPromptConflictResolutionReport,
} from './movieAnalysisPromptConflictResolution.js';
import {
  PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT,
  PROMPT_GENERATION_FRAMEWORK_PHASE,
  PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
  type MovieAnalysisPromptGenerationFrameworkReport,
} from './movieAnalysisPromptGenerationFramework.js';
import {
  PROMPT_QUALITY_GATE_PASS_VERDICT,
  PROMPT_QUALITY_GATE_PHASE,
  PROMPT_QUALITY_GATE_REPORT_PATH,
  type MovieAnalysisPromptQualityGateReport,
} from './movieAnalysisPromptQualityGate.js';
import {
  RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  RUNTIME_BINDING_FRAMEWORK_PHASE,
  RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
  type MovieAnalysisRuntimeBindingFrameworkReport,
} from './movieAnalysisRuntimeBindingFramework.js';
import {
  RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT,
  RUNTIME_INTEGRATION_CERTIFICATION_PHASE,
  RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH,
  type MovieAnalysisRuntimeIntegrationCertificationReport,
} from './movieAnalysisRuntimeIntegrationCertification.js';
import {
  VIDEO_RUNTIME_PACKAGE_PASS_VERDICT,
  VIDEO_RUNTIME_PACKAGE_PHASE,
  VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
  type MovieAnalysisVideoRuntimePackageReport,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEVEL2_RUNTIME_CERTIFICATION_PHASE =
  'PHASE-LEVEL2-009-MOVIE_ANALYSIS_LEVEL2_RUNTIME_CERTIFICATION_V1' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_LEVEL2_RUNTIME_CERTIFICATION_V1' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_LEVEL2_RUNTIME_CERTIFICATION_V1' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_DIR =
  'reports/movie_analysis_level2_runtime_certification' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_level2_runtime_certification/movie-analysis-level2-runtime-certification-report.json' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_level2_runtime_certification/MOVIE_ANALYSIS_LEVEL2_RUNTIME_CERTIFICATION.md' as const;
export const LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE = 'LEVEL2_COMPLETE' as const;

export const LEVEL2_PHASE_COUNT = 8 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type Level2RuntimeCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_id?: string;
};

export type Level2PhaseEntry = {
  phase_id: string;
  phase: string;
  report_path: string;
  pass_verdict: string;
};

export type Level2PhaseAudit = {
  phase_id: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type Level2CompletionValidation = {
  runtime_binding_complete: CertificationStatus;
  prompt_generation_complete: CertificationStatus;
  prompt_assembly_complete: CertificationStatus;
  prompt_quality_gate_complete: CertificationStatus;
  prompt_conflict_resolution_complete: CertificationStatus;
  image_runtime_package_ready: CertificationStatus;
  video_runtime_package_ready: CertificationStatus;
  runtime_integration_ready: CertificationStatus;
};

export type MovieAnalysisLevel2RuntimeCertificationReport = {
  report_id: string;
  phase: typeof LEVEL2_RUNTIME_CERTIFICATION_PHASE;
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
  level2_phase_count: typeof LEVEL2_PHASE_COUNT;
  level2_phases_complete: CertificationStatus;
  completion_validation: Level2CompletionValidation;
  runtime_mapping_preserved: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_runtime_consistency: CertificationStatus;
  level2_runtime_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE | null;
  runtime_binding_framework_report_path: typeof RUNTIME_BINDING_FRAMEWORK_REPORT_PATH;
  prompt_generation_framework_report_path: typeof PROMPT_GENERATION_FRAMEWORK_REPORT_PATH;
  prompt_assembly_engine_report_path: typeof PROMPT_ASSEMBLY_ENGINE_REPORT_PATH;
  prompt_quality_gate_report_path: typeof PROMPT_QUALITY_GATE_REPORT_PATH;
  prompt_conflict_resolution_report_path: typeof PROMPT_CONFLICT_RESOLUTION_REPORT_PATH;
  image_runtime_package_report_path: typeof IMAGE_RUNTIME_PACKAGE_REPORT_PATH;
  video_runtime_package_report_path: typeof VIDEO_RUNTIME_PACKAGE_REPORT_PATH;
  runtime_integration_certification_report_path: typeof RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH;
  phase_audits: Level2PhaseAudit[];
  final_verdict:
    | typeof LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT
    | typeof LEVEL2_RUNTIME_CERTIFICATION_FAIL_VERDICT;
  issues: Level2RuntimeCertificationIssue[];
};

export const LEVEL2_PHASE_ENTRIES: Level2PhaseEntry[] = [
  {
    phase_id: 'L2-001',
    phase: RUNTIME_BINDING_FRAMEWORK_PHASE,
    report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    pass_verdict: RUNTIME_BINDING_FRAMEWORK_PASS_VERDICT,
  },
  {
    phase_id: 'L2-002',
    phase: PROMPT_GENERATION_FRAMEWORK_PHASE,
    report_path: PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
    pass_verdict: PROMPT_GENERATION_FRAMEWORK_PASS_VERDICT,
  },
  {
    phase_id: 'L2-003',
    phase: PROMPT_ASSEMBLY_ENGINE_PHASE,
    report_path: PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
    pass_verdict: PROMPT_ASSEMBLY_ENGINE_PASS_VERDICT,
  },
  {
    phase_id: 'L2-004',
    phase: PROMPT_QUALITY_GATE_PHASE,
    report_path: PROMPT_QUALITY_GATE_REPORT_PATH,
    pass_verdict: PROMPT_QUALITY_GATE_PASS_VERDICT,
  },
  {
    phase_id: 'L2-005',
    phase: PROMPT_CONFLICT_RESOLUTION_PHASE,
    report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    pass_verdict: PROMPT_CONFLICT_RESOLUTION_PASS_VERDICT,
  },
  {
    phase_id: 'L2-006',
    phase: IMAGE_RUNTIME_PACKAGE_PHASE,
    report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    pass_verdict: IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  },
  {
    phase_id: 'L2-007',
    phase: VIDEO_RUNTIME_PACKAGE_PHASE,
    report_path: VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
    pass_verdict: VIDEO_RUNTIME_PACKAGE_PASS_VERDICT,
  },
  {
    phase_id: 'L2-008',
    phase: RUNTIME_INTEGRATION_CERTIFICATION_PHASE,
    report_path: RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH,
    pass_verdict: RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT,
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

function auditPhase(projectRoot: string, entry: Level2PhaseEntry): Level2PhaseAudit {
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

function buildMarkdown(report: MovieAnalysisLevel2RuntimeCertificationReport): string {
  const lines = [
    '# Movie Analysis Level 2 Runtime Certification',
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
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Level 2 Chain',
    '',
    'Runtime Binding → Prompt Generation → Prompt Assembly → Quality Gate → Conflict Resolution → Image Runtime → Video Runtime → Integration',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| level2_phase_count | ${report.level2_phase_count} |`,
    `| level2_phases_complete | ${report.level2_phases_complete} |`,
    `| runtime_binding_complete | ${report.completion_validation.runtime_binding_complete} |`,
    `| prompt_generation_complete | ${report.completion_validation.prompt_generation_complete} |`,
    `| prompt_assembly_complete | ${report.completion_validation.prompt_assembly_complete} |`,
    `| prompt_quality_gate_complete | ${report.completion_validation.prompt_quality_gate_complete} |`,
    `| prompt_conflict_resolution_complete | ${report.completion_validation.prompt_conflict_resolution_complete} |`,
    `| image_runtime_package_ready | ${report.completion_validation.image_runtime_package_ready} |`,
    `| video_runtime_package_ready | ${report.completion_validation.video_runtime_package_ready} |`,
    `| runtime_integration_ready | ${report.completion_validation.runtime_integration_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| cross_runtime_consistency | ${report.cross_runtime_consistency} |`,
    `| level2_runtime_certification_ready | ${report.level2_runtime_certification_ready} |`,
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
  issues: Level2RuntimeCertificationIssue[],
  phaseAudits: Level2PhaseAudit[] = []
): MovieAnalysisLevel2RuntimeCertificationReport {
  const report: MovieAnalysisLevel2RuntimeCertificationReport = {
    report_id: 'movie-analysis-level2-runtime-certification-report-v1',
    phase: LEVEL2_RUNTIME_CERTIFICATION_PHASE,
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
    level2_phase_count: LEVEL2_PHASE_COUNT,
    level2_phases_complete: 'FAIL',
    completion_validation: {
      runtime_binding_complete: 'FAIL',
      prompt_generation_complete: 'FAIL',
      prompt_assembly_complete: 'FAIL',
      prompt_quality_gate_complete: 'FAIL',
      prompt_conflict_resolution_complete: 'FAIL',
      image_runtime_package_ready: 'FAIL',
      video_runtime_package_ready: 'FAIL',
      runtime_integration_ready: 'FAIL',
    },
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    cross_runtime_consistency: 'FAIL',
    level2_runtime_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    runtime_binding_framework_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    prompt_generation_framework_report_path: PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
    prompt_assembly_engine_report_path: PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
    prompt_quality_gate_report_path: PROMPT_QUALITY_GATE_REPORT_PATH,
    prompt_conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    video_runtime_package_report_path: VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
    runtime_integration_certification_report_path: RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: LEVEL2_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisLevel2RuntimeCertification(
  projectRoot?: string
): MovieAnalysisLevel2RuntimeCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: Level2RuntimeCertificationIssue[] = [];
  const timestamp = new Date().toISOString();
  const phaseAudits = LEVEL2_PHASE_ENTRIES.map((entry) => auditPhase(root, entry));

  for (const audit of phaseAudits) {
    if (!audit.report_exists) {
      issues.push({
        code: 'LEVEL2_PHASE_REPORT_MISSING',
        message: `Missing ${audit.report_path}`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    } else if (!audit.phase_passed) {
      issues.push({
        code: 'LEVEL2_PHASE_NOT_PASS',
        message: `${audit.phase_id} must have PASS verdict`,
        severity: 'error',
        phase_id: audit.phase_id,
      });
    }
  }

  const bindingReport = loadReport<MovieAnalysisRuntimeBindingFrameworkReport>(
    root,
    RUNTIME_BINDING_FRAMEWORK_REPORT_PATH
  );
  const generationReport = loadReport<MovieAnalysisPromptGenerationFrameworkReport>(
    root,
    PROMPT_GENERATION_FRAMEWORK_REPORT_PATH
  );
  const assemblyReport = loadReport<MovieAnalysisPromptAssemblyEngineReport>(
    root,
    PROMPT_ASSEMBLY_ENGINE_REPORT_PATH
  );
  const qualityGateReport = loadReport<MovieAnalysisPromptQualityGateReport>(
    root,
    PROMPT_QUALITY_GATE_REPORT_PATH
  );
  const conflictReport = loadReport<MovieAnalysisPromptConflictResolutionReport>(
    root,
    PROMPT_CONFLICT_RESOLUTION_REPORT_PATH
  );
  const imageRuntimeReport = loadReport<MovieAnalysisImageRuntimePackageReport>(
    root,
    IMAGE_RUNTIME_PACKAGE_REPORT_PATH
  );
  const videoRuntimeReport = loadReport<MovieAnalysisVideoRuntimePackageReport>(
    root,
    VIDEO_RUNTIME_PACKAGE_REPORT_PATH
  );
  const integrationReport = loadReport<MovieAnalysisRuntimeIntegrationCertificationReport>(
    root,
    RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH
  );

  if (
    !bindingReport ||
    !generationReport ||
    !assemblyReport ||
    !qualityGateReport ||
    !conflictReport ||
    !imageRuntimeReport ||
    !videoRuntimeReport ||
    !integrationReport
  ) {
    return writeFailReport(root, timestamp, issues, phaseAudits);
  }

  const completionValidation: Level2CompletionValidation = {
    runtime_binding_complete: toStatus(bindingReport.runtime_binding_framework_ready === 'PASS'),
    prompt_generation_complete: toStatus(
      generationReport.prompt_generation_framework_ready === 'PASS'
    ),
    prompt_assembly_complete: toStatus(assemblyReport.prompt_assembly_engine_ready === 'PASS'),
    prompt_quality_gate_complete: toStatus(qualityGateReport.prompt_quality_gate_ready === 'PASS'),
    prompt_conflict_resolution_complete: toStatus(
      conflictReport.prompt_conflict_resolution_ready === 'PASS'
    ),
    image_runtime_package_ready: toStatus(
      imageRuntimeReport.image_runtime_package_ready === 'PASS'
    ),
    video_runtime_package_ready: toStatus(
      videoRuntimeReport.video_runtime_package_ready === 'PASS'
    ),
    runtime_integration_ready: toStatus(
      integrationReport.runtime_integration_certification_ready === 'PASS'
    ),
  };

  const runtimeMappingPreserved = toStatus(
    bindingReport.runtime_mapping_complete === 'PASS' &&
      imageRuntimeReport.runtime_mapping_preserved === 'PASS' &&
      videoRuntimeReport.runtime_mapping_preserved === 'PASS' &&
      integrationReport.runtime_mapping_preserved === 'PASS'
  );

  const traceabilityPreserved = toStatus(
    bindingReport.traceability_preserved === 'PASS' &&
      imageRuntimeReport.adapter_traceability_preserved === 'PASS' &&
      videoRuntimeReport.adapter_traceability_preserved === 'PASS' &&
      integrationReport.adapter_traceability_preserved === 'PASS'
  );

  const crossRuntimeConsistency = toStatus(
    integrationReport.cross_runtime_consistency === 'PASS'
  );

  const sourceCount = integrationReport.source_count;
  const adapterCount = integrationReport.adapter_count;

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
    bindingReport.planning_only === true &&
    bindingReport.planning_only_status === 'PASS' &&
    generationReport.planning_only === true &&
    generationReport.planning_only_status === 'PASS' &&
    assemblyReport.planning_only === true &&
    assemblyReport.planning_only_status === 'PASS' &&
    qualityGateReport.planning_only === true &&
    qualityGateReport.planning_only_status === 'PASS' &&
    conflictReport.planning_only === true &&
    conflictReport.planning_only_status === 'PASS' &&
    imageRuntimeReport.planning_only === true &&
    imageRuntimeReport.planning_only_status === 'PASS' &&
    videoRuntimeReport.planning_only === true &&
    videoRuntimeReport.planning_only_status === 'PASS' &&
    integrationReport.planning_only === true &&
    integrationReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = toStatus(safetyValid);

  const level2PhasesComplete = toStatus(
    phaseAudits.length === LEVEL2_PHASE_COUNT && phaseAudits.every((audit) => audit.phase_passed)
  );

  const completionChecks = Object.values(completionValidation);
  const aggregateChecks: CertificationStatus[] = [
    level2PhasesComplete,
    ...completionChecks,
    runtimeMappingPreserved,
    traceabilityPreserved,
    crossRuntimeConsistency,
    planningOnlyStatus,
  ];

  for (const status of aggregateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'LEVEL2_VALIDATION_FAIL',
        message: 'Level 2 runtime certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const level2RuntimeCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    aggregateChecks.every((status) => status === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = level2RuntimeCertificationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'LEVEL2_VALIDATION_FAIL')) {
    issues.push({
      code: 'LEVEL2_RUNTIME_CERTIFICATION_NOT_READY',
      message: 'Level 2 runtime certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisLevel2RuntimeCertificationReport = {
    report_id: 'movie-analysis-level2-runtime-certification-report-v1',
    phase: LEVEL2_RUNTIME_CERTIFICATION_PHASE,
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
    level2_phase_count: LEVEL2_PHASE_COUNT,
    level2_phases_complete: level2PhasesComplete,
    completion_validation: completionValidation,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    cross_runtime_consistency: crossRuntimeConsistency,
    level2_runtime_certification_ready: level2RuntimeCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? LEVEL2_RUNTIME_CERTIFICATION_STATUS_MESSAGE : null,
    runtime_binding_framework_report_path: RUNTIME_BINDING_FRAMEWORK_REPORT_PATH,
    prompt_generation_framework_report_path: PROMPT_GENERATION_FRAMEWORK_REPORT_PATH,
    prompt_assembly_engine_report_path: PROMPT_ASSEMBLY_ENGINE_REPORT_PATH,
    prompt_quality_gate_report_path: PROMPT_QUALITY_GATE_REPORT_PATH,
    prompt_conflict_resolution_report_path: PROMPT_CONFLICT_RESOLUTION_REPORT_PATH,
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    video_runtime_package_report_path: VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
    runtime_integration_certification_report_path: RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH,
    phase_audits: phaseAudits,
    final_verdict: pass
      ? LEVEL2_RUNTIME_CERTIFICATION_PASS_VERDICT
      : LEVEL2_RUNTIME_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, LEVEL2_RUNTIME_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, LEVEL2_RUNTIME_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, LEVEL2_RUNTIME_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
