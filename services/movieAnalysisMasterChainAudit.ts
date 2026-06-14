import fs from 'node:fs';
import path from 'node:path';
import {
  MASTER_PACKAGE_PHASE,
  MASTER_PACKAGE_REGISTRY_PATH,
  SEED_MASTER_PACKAGE_SPECS,
  TRACE_DEFINITIONS,
  type MovieAnalysisMasterPackagePlan,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import {
  MASTER_PACKAGE_PASS_VERDICT,
  MASTER_PACKAGE_REPORT_PATH,
} from './movieAnalysisMasterPackageValidator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MASTER_CHAIN_AUDIT_PHASE =
  'PHASE-SOURCE-VIDEO-040-MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT_V1' as const;
export const MASTER_CHAIN_AUDIT_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT_V1' as const;
export const MASTER_CHAIN_AUDIT_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT_V1' as const;
export const MASTER_CHAIN_AUDIT_REPORT_PATH =
  'reports/movie-analysis-master-chain-audit-report.json' as const;
export const MASTER_CHAIN_AUDIT_MD_PATH =
  'reports/MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT.md' as const;

export const EXPECTED_SOURCE_COUNT = 4 as const;
export const EXPECTED_PACKAGE_TRACE_LENGTH = 17 as const;

export const CHAIN_PHASE_AUDIT_ENTRIES = [
  {
    phase_num: '022',
    phase: 'PHASE-SOURCE-VIDEO-022-MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1',
    verify_script: 'scripts/verify-movie-analysis-foundation.ts',
    report_path: 'reports/movie-analysis-engine-foundation-report.json',
  },
  {
    phase_num: '023',
    phase: 'PHASE-SOURCE-VIDEO-023-MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1',
    verify_script: 'scripts/verify-movie-analysis-dry-run.ts',
    report_path: 'reports/movie-analysis-dry-run-planner-report.json',
  },
  {
    phase_num: '024',
    phase: 'PHASE-SOURCE-VIDEO-024-MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-frame-sampling.ts',
    report_path: 'reports/movie-analysis-frame-sampling-report.json',
  },
  {
    phase_num: '025',
    phase: 'PHASE-SOURCE-VIDEO-025-MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-scene-detection.ts',
    report_path: 'reports/movie-analysis-scene-detection-report.json',
  },
  {
    phase_num: '026',
    phase: 'PHASE-SOURCE-VIDEO-026-MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-coordinate-extraction.ts',
    report_path: 'reports/movie-analysis-coordinate-extraction-report.json',
  },
  {
    phase_num: '027',
    phase: 'PHASE-SOURCE-VIDEO-027-MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-gonegi-state-mapping.ts',
    report_path: 'reports/movie-analysis-gonegi-state-mapping-report.json',
  },
  {
    phase_num: '028',
    phase: 'PHASE-SOURCE-VIDEO-028-MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-video-state-compilation.ts',
    report_path: 'reports/movie-analysis-video-state-compilation-report.json',
  },
  {
    phase_num: '029',
    phase: 'PHASE-SOURCE-VIDEO-029-MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-keyframe-preparation.ts',
    report_path: 'reports/movie-analysis-keyframe-preparation-report.json',
  },
  {
    phase_num: '030',
    phase: 'PHASE-SOURCE-VIDEO-030-MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-motion-planning.ts',
    report_path: 'reports/movie-analysis-motion-planning-report.json',
  },
  {
    phase_num: '031',
    phase: 'PHASE-SOURCE-VIDEO-031-MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-temporal-flow.ts',
    report_path: 'reports/movie-analysis-temporal-flow-report.json',
  },
  {
    phase_num: '032',
    phase: 'PHASE-SOURCE-VIDEO-032-MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-sequence-assembly.ts',
    report_path: 'reports/movie-analysis-sequence-assembly-report.json',
  },
  {
    phase_num: '033',
    phase: 'PHASE-SOURCE-VIDEO-033-MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-video-blueprint.ts',
    report_path: 'reports/movie-analysis-video-blueprint-report.json',
  },
  {
    phase_num: '034',
    phase: 'PHASE-SOURCE-VIDEO-034-MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-runtime-package.ts',
    report_path: 'reports/movie-analysis-runtime-package-report.json',
  },
  {
    phase_num: '035',
    phase: 'PHASE-SOURCE-VIDEO-035-MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-generation-package.ts',
    report_path: 'reports/movie-analysis-generation-package-report.json',
  },
  {
    phase_num: '036',
    phase: 'PHASE-SOURCE-VIDEO-036-MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-generation-blueprint.ts',
    report_path: 'reports/movie-analysis-generation-blueprint-report.json',
  },
  {
    phase_num: '037',
    phase: 'PHASE-SOURCE-VIDEO-037-MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-execution-readiness.ts',
    report_path: 'reports/movie-analysis-execution-readiness-report.json',
  },
  {
    phase_num: '038',
    phase: 'PHASE-SOURCE-VIDEO-038-MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1',
    verify_script: 'scripts/verify-movie-analysis-final-runtime-bundle.ts',
    report_path: 'reports/movie-analysis-final-runtime-bundle-report.json',
  },
  {
    phase_num: '039',
    phase: MASTER_PACKAGE_PHASE,
    verify_script: 'scripts/verify-movie-analysis-master-package.ts',
    report_path: MASTER_PACKAGE_REPORT_PATH,
  },
] as const;

export const EXPECTED_CHAIN_PHASES = CHAIN_PHASE_AUDIT_ENTRIES.map((entry) => entry.phase);

export type MasterChainAuditIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  master_package_id?: string;
  phase_num?: string;
};

export type PhaseAuditResult = {
  phase_num: string;
  phase: string;
  verify_script: string;
  verify_script_exists: boolean;
  report_path: string;
  report_exists: boolean;
};

export type MasterPackageAuditResult = {
  master_package_id: string;
  source_video_id: string;
  package_trace_count: number;
  package_trace_expected: number;
  phase_trace_complete: boolean;
  safety_flags_preserved: boolean;
};

export type MovieAnalysisMasterChainAuditReport = {
  report_id: string;
  phase: typeof MASTER_CHAIN_AUDIT_PHASE;
  timestamp: string;
  source_count: number;
  master_package_count: number;
  phase_trace_complete: boolean;
  phases_022_to_039_present: boolean;
  package_trace: string;
  all_verify_scripts_exist: boolean;
  all_reports_exist: boolean;
  all_safety_flags_preserved: boolean;
  no_runtime_execution: true;
  no_video_generation: true;
  no_image_generation: true;
  no_gpu_execution: true;
  no_external_call: true;
  phase_audits: PhaseAuditResult[];
  master_package_audits: MasterPackageAuditResult[];
  final_verdict:
    | typeof MASTER_CHAIN_AUDIT_PASS_VERDICT
    | typeof MASTER_CHAIN_AUDIT_FAIL_VERDICT;
  issues: MasterChainAuditIssue[];
};

function safetyFlagsPreserved(plan: MovieAnalysisMasterPackagePlan): boolean {
  const flags = plan.execution_flags;
  const safety = plan.safety_summary;
  const readiness = plan.readiness_summary;

  return (
    flags.planning_only === true &&
    flags.master_package_only === true &&
    flags.runtime_execution === false &&
    flags.video_generation === false &&
    flags.image_generation === false &&
    flags.gpu_execution === false &&
    flags.external_call_allowed === false &&
    safety.planning_only === true &&
    safety.master_package_only === true &&
    safety.runtime_execution === false &&
    safety.video_generation === false &&
    safety.image_generation === false &&
    safety.gpu_execution === false &&
    safety.external_call_allowed === false &&
    safety.no_execution === true &&
    safety.no_rendering === true &&
    safety.no_inference === true &&
    readiness.design_only === true &&
    readiness.master_package_only === true &&
    readiness.chain_complete === true &&
    readiness.runtime_execution === false &&
    readiness.video_generation === false &&
    readiness.image_generation === false &&
    readiness.gpu_ready === false
  );
}

function isPhaseTraceComplete(plan: MovieAnalysisMasterPackagePlan): boolean {
  if (plan.package_trace.length !== EXPECTED_PACKAGE_TRACE_LENGTH) {
    return false;
  }

  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = plan.package_trace[i];
    if (!entry) return false;
    if (
      entry.step !== i + 1 ||
      entry.phase !== definition.phase ||
      entry.plan_type !== definition.plan_type ||
      entry.plan_id !== plan[definition.idKey] ||
      entry.status !== 'designed'
    ) {
      return false;
    }
  }

  return plan.phase === MASTER_PACKAGE_PHASE;
}

function collectObservedPhases(plans: MovieAnalysisMasterPackagePlan[]): Set<string> {
  const phases = new Set<string>();
  for (const plan of plans) {
    phases.add(plan.phase);
    for (const entry of plan.package_trace) {
      phases.add(entry.phase);
    }
  }
  return phases;
}

function buildMarkdown(report: MovieAnalysisMasterChainAuditReport): string {
  const lines = [
    '# Movie Analysis Master Chain Audit',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Audit Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| master_package_count | ${report.master_package_count} |`,
    `| phase_trace_complete | ${report.phase_trace_complete} |`,
    `| phases_022_to_039_present | ${report.phases_022_to_039_present} |`,
    `| package_trace | ${report.package_trace} |`,
    `| all_verify_scripts_exist | ${report.all_verify_scripts_exist} |`,
    `| all_reports_exist | ${report.all_reports_exist} |`,
    `| all_safety_flags_preserved | ${report.all_safety_flags_preserved} |`,
    `| no_runtime_execution | ${report.no_runtime_execution} |`,
    `| no_video_generation | ${report.no_video_generation} |`,
    `| no_image_generation | ${report.no_image_generation} |`,
    `| no_gpu_execution | ${report.no_gpu_execution} |`,
    `| no_external_call | ${report.no_external_call} |`,
    '',
    '## Phase Audits',
    '',
  ];

  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} ${audit.phase}: verify=${audit.verify_script_exists ? 'PASS' : 'FAIL'} report=${audit.report_exists ? 'PASS' : 'FAIL'}`
    );
  }

  lines.push('', '## Master Package Audits', '');

  for (const audit of report.master_package_audits) {
    lines.push(
      `- ${audit.master_package_id} (${audit.source_video_id}): trace=${audit.package_trace_count}/${audit.package_trace_expected} phase_trace=${audit.phase_trace_complete ? 'PASS' : 'FAIL'} safety=${audit.safety_flags_preserved ? 'PASS' : 'FAIL'}`
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

export function writeMovieAnalysisMasterChainAuditReport(
  projectRoot?: string
): MovieAnalysisMasterChainAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MasterChainAuditIssue[] = [];
  const timestamp = new Date().toISOString();

  if (!fs.existsSync(path.join(root, MASTER_PACKAGE_REGISTRY_PATH))) {
    issues.push({
      code: 'MASTER_PACKAGE_REGISTRY_MISSING',
      message: `Missing ${MASTER_PACKAGE_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const masterPackageReportPath = path.join(root, MASTER_PACKAGE_REPORT_PATH);
  if (!fs.existsSync(masterPackageReportPath)) {
    issues.push({
      code: 'MASTER_PACKAGE_REPORT_MISSING',
      message: `Missing ${MASTER_PACKAGE_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const masterReport = JSON.parse(fs.readFileSync(masterPackageReportPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (masterReport.final_verdict !== MASTER_PACKAGE_PASS_VERDICT) {
      issues.push({
        code: 'MASTER_PACKAGE_REPORT_NOT_PASS',
        message: `${MASTER_PACKAGE_REPORT_PATH} must have ${MASTER_PACKAGE_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const plans: MovieAnalysisMasterPackagePlan[] = [];
  for (const spec of SEED_MASTER_PACKAGE_SPECS) {
    const plan = loadMovieAnalysisMasterPackagePlan(root, spec.master_package_id);
    if (!plan) {
      issues.push({
        code: 'MASTER_PACKAGE_PLAN_MISSING',
        message: `Missing master package plan: ${spec.master_package_id}`,
        severity: 'error',
        master_package_id: spec.master_package_id,
      });
      continue;
    }
    plans.push(plan);
  }

  const sourceIds = new Set(plans.map((p) => p.source_video_id));
  if (sourceIds.size !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}, got ${sourceIds.size}`,
      severity: 'error',
    });
  }

  const masterPackageAudits: MasterPackageAuditResult[] = plans.map((plan) => {
    const traceComplete = isPhaseTraceComplete(plan);
    const safetyOk = safetyFlagsPreserved(plan);

    if (!traceComplete) {
      issues.push({
        code: 'PHASE_TRACE_INCOMPLETE',
        message: `package_trace incomplete for ${plan.master_package_id}`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }
    if (!safetyOk) {
      issues.push({
        code: 'SAFETY_FLAGS_NOT_PRESERVED',
        message: `safety flags not preserved for ${plan.master_package_id}`,
        severity: 'error',
        master_package_id: plan.master_package_id,
      });
    }

    return {
      master_package_id: plan.master_package_id,
      source_video_id: plan.source_video_id,
      package_trace_count: plan.package_trace.length,
      package_trace_expected: EXPECTED_PACKAGE_TRACE_LENGTH,
      phase_trace_complete: traceComplete,
      safety_flags_preserved: safetyOk,
    };
  });

  const phaseTraceComplete =
    plans.length === EXPECTED_SOURCE_COUNT &&
    masterPackageAudits.every((audit) => audit.phase_trace_complete);

  const observedPhases = collectObservedPhases(plans);
  const phases022To039Present = EXPECTED_CHAIN_PHASES.every((phase) => observedPhases.has(phase));
  if (!phases022To039Present) {
    for (const phase of EXPECTED_CHAIN_PHASES) {
      if (!observedPhases.has(phase)) {
        issues.push({
          code: 'CHAIN_PHASE_MISSING',
          message: `Missing phase in master chain: ${phase}`,
          severity: 'error',
        });
      }
    }
  }

  const packageTraceOk =
    plans.length === EXPECTED_SOURCE_COUNT &&
    masterPackageAudits.every(
      (audit) => audit.package_trace_count === EXPECTED_PACKAGE_TRACE_LENGTH
    );

  const phaseAudits: PhaseAuditResult[] = CHAIN_PHASE_AUDIT_ENTRIES.map((entry) => {
    const verifyExists = fs.existsSync(path.join(root, entry.verify_script));
    const reportExists = fs.existsSync(path.join(root, entry.report_path));

    if (!verifyExists) {
      issues.push({
        code: 'VERIFY_SCRIPT_MISSING',
        message: `Missing verify script: ${entry.verify_script}`,
        severity: 'error',
        phase_num: entry.phase_num,
      });
    }
    if (!reportExists) {
      issues.push({
        code: 'PHASE_REPORT_MISSING',
        message: `Missing phase report: ${entry.report_path}`,
        severity: 'error',
        phase_num: entry.phase_num,
      });
    }

    return {
      phase_num: entry.phase_num,
      phase: entry.phase,
      verify_script: entry.verify_script,
      verify_script_exists: verifyExists,
      report_path: entry.report_path,
      report_exists: reportExists,
    };
  });

  const allVerifyScriptsExist = phaseAudits.every((audit) => audit.verify_script_exists);
  const allReportsExist = phaseAudits.every((audit) => audit.report_exists);
  const allSafetyFlagsPreserved =
    plans.length === EXPECTED_SOURCE_COUNT &&
    masterPackageAudits.every((audit) => audit.safety_flags_preserved);

  const pass =
    plans.length === EXPECTED_SOURCE_COUNT &&
    sourceIds.size === EXPECTED_SOURCE_COUNT &&
    phaseTraceComplete &&
    phases022To039Present &&
    packageTraceOk &&
    allVerifyScriptsExist &&
    allReportsExist &&
    allSafetyFlagsPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisMasterChainAuditReport = {
    report_id: 'movie-analysis-master-chain-audit-report-v1',
    phase: MASTER_CHAIN_AUDIT_PHASE,
    timestamp,
    source_count: sourceIds.size,
    master_package_count: plans.length,
    phase_trace_complete: phaseTraceComplete,
    phases_022_to_039_present: phases022To039Present,
    package_trace: `${EXPECTED_PACKAGE_TRACE_LENGTH}/${EXPECTED_PACKAGE_TRACE_LENGTH}`,
    all_verify_scripts_exist: allVerifyScriptsExist,
    all_reports_exist: allReportsExist,
    all_safety_flags_preserved: allSafetyFlagsPreserved,
    no_runtime_execution: true,
    no_video_generation: true,
    no_image_generation: true,
    no_gpu_execution: true,
    no_external_call: true,
    phase_audits: phaseAudits,
    master_package_audits: masterPackageAudits,
    final_verdict: pass ? MASTER_CHAIN_AUDIT_PASS_VERDICT : MASTER_CHAIN_AUDIT_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, MASTER_CHAIN_AUDIT_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MASTER_CHAIN_AUDIT_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
