import fs from 'node:fs';
import path from 'node:path';
import { DATASET_PATH, loadMovieAnalysisDataset } from './movieAnalysisDatasetExport.js';
import {
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
} from './movieAnalysisDatasetConsumerBridge.js';
import { CHAIN_PHASE_AUDIT_ENTRIES } from './movieAnalysisMasterChainAudit.js';
import { TRACE_DEFINITIONS } from './movieAnalysisMasterPackageDesign.js';
import {
  EXPECTED_SOURCE_COUNT,
  RELEASE_PACKAGE_PASS_VERDICT,
  RELEASE_PACKAGE_PATH,
  loadMovieAnalysisReleasePackage,
  loadMovieAnalysisReleaseReport,
} from './movieAnalysisReleasePackage.js';
import {
  RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT,
  RUNTIME_CONSUMER_VALIDATION_REPORT_PATH,
  type MovieAnalysisRuntimeConsumerValidationReport,
} from './movieAnalysisRuntimeConsumerValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DATASET_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-052-MOVIE_ANALYSIS_DATASET_CERTIFICATION_V1' as const;
export const DATASET_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DATASET_CERTIFICATION_V1' as const;
export const DATASET_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DATASET_CERTIFICATION_V1' as const;
export const DATASET_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-dataset-certification-report.json' as const;
export const DATASET_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DATASET_CERTIFICATION.md' as const;
export const CERTIFICATION_STATUS_MESSAGE = 'Movie Analysis V1 Certified' as const;

export { EXPECTED_SOURCE_COUNT };

const CHAIN_ID_KEYS = [
  'analysis_plan_id',
  'dry_run_id',
  'frame_sampling_id',
  'scene_detection_id',
  'coordinate_extraction_id',
  'gonegi_state_mapping_id',
  'video_state_compilation_id',
  'keyframe_preparation_id',
  'motion_plan_id',
  'temporal_flow_id',
  'sequence_assembly_id',
  'video_blueprint_id',
  'runtime_package_id',
  'generation_package_id',
  'generation_blueprint_id',
  'execution_readiness_id',
  'final_runtime_bundle_id',
] as const;

export const CERTIFICATION_PHASE_ENTRIES = [
  ...CHAIN_PHASE_AUDIT_ENTRIES.map((entry) => ({
    phase_num: entry.phase_num,
    phase: entry.phase,
    report_path: entry.report_path,
    pass_verdict: getPassVerdictForPhase(entry.phase_num),
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  })),
  {
    phase_num: '040',
    phase: 'PHASE-SOURCE-VIDEO-040-MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT_V1',
    report_path: 'reports/movie-analysis-master-chain-audit-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_MASTER_CHAIN_AUDIT_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '041',
    phase: 'PHASE-SOURCE-VIDEO-041-MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT_V1',
    report_path: 'reports/movie-analysis-consumption-readiness-audit-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_CONSUMPTION_READINESS_AUDIT_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '042',
    phase: 'PHASE-SOURCE-VIDEO-042-MOVIE_ANALYSIS_EXPORT_PACKAGE_V1',
    report_path: 'exports/movie_analysis/movie-analysis-export-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_EXPORT_PACKAGE_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '043',
    phase: 'PHASE-SOURCE-VIDEO-043-MOVIE_ANALYSIS_IMPORT_SIMULATION_V1',
    report_path: 'reports/movie-analysis-import-simulation-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_IMPORT_SIMULATION_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '044',
    phase: 'PHASE-SOURCE-VIDEO-044-MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION_V1',
    report_path: 'reports/movie-analysis-real-source-integration-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_REAL_SOURCE_INTEGRATION_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '045',
    phase: 'PHASE-SOURCE-VIDEO-045-MOVIE_ANALYSIS_DATASET_EXPORT_V1',
    report_path: 'exports/movie_analysis_dataset/movie-analysis-dataset-report.json',
    pass_verdict: 'PASS',
    pass_field: 'build_status' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '046',
    phase: 'PHASE-SOURCE-VIDEO-046-MOVIE_ANALYSIS_DATASET_CONSUMER_BRIDGE_V1',
    report_path: IMAGE_CONSUMER_BRIDGE_PATH,
    pass_verdict: 'PASS_MOVIE_ANALYSIS_DATASET_CONSUMER_BRIDGE_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'bridge' as const,
  },
  {
    phase_num: '047',
    phase: 'PHASE-SOURCE-VIDEO-047-MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST_V1',
    report_path: 'reports/movie-analysis-consumer-bridge-import-test-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '048',
    phase: 'PHASE-SOURCE-VIDEO-048-MOVIE_ANALYSIS_UPLOAD_BUNDLE_V1',
    report_path: 'exports/movie_analysis_upload_bundle/movie-analysis-upload-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_UPLOAD_BUNDLE_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '049',
    phase: 'PHASE-SOURCE-VIDEO-049-MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE_V1',
    report_path: 'reports/movie-analysis-upload-bundle-quality-gate-report.json',
    pass_verdict: 'PASS_MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE_V1',
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '050',
    phase: 'PHASE-SOURCE-VIDEO-050-MOVIE_ANALYSIS_RELEASE_PACKAGE_V1',
    report_path: 'exports/movie_analysis_release/movie-analysis-release-report.json',
    pass_verdict: RELEASE_PACKAGE_PASS_VERDICT,
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
  {
    phase_num: '051',
    phase: 'PHASE-SOURCE-VIDEO-051-MOVIE_ANALYSIS_RUNTIME_CONSUMER_VALIDATION_V1',
    report_path: RUNTIME_CONSUMER_VALIDATION_REPORT_PATH,
    pass_verdict: RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT,
    pass_field: 'final_verdict' as const,
    check_type: 'report' as const,
  },
] as const;

function getPassVerdictForPhase(phaseNum: string): string {
  const verdicts: Record<string, string> = {
    '022': 'PASS_MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1',
    '023': 'PASS_MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1',
    '024': 'PASS_MOVIE_ANALYSIS_FRAME_SAMPLING_DESIGN_V1',
    '025': 'PASS_MOVIE_ANALYSIS_SCENE_DETECTION_DESIGN_V1',
    '026': 'PASS_MOVIE_ANALYSIS_COORDINATE_EXTRACTION_DESIGN_V1',
    '027': 'PASS_MOVIE_ANALYSIS_GONEGI_STATE_MAPPING_DESIGN_V1',
    '028': 'PASS_MOVIE_ANALYSIS_VIDEO_STATE_COMPILATION_DESIGN_V1',
    '029': 'PASS_MOVIE_ANALYSIS_KEYFRAME_PREPARATION_DESIGN_V1',
    '030': 'PASS_MOVIE_ANALYSIS_MOTION_PLANNING_DESIGN_V1',
    '031': 'PASS_MOVIE_ANALYSIS_TEMPORAL_FLOW_DESIGN_V1',
    '032': 'PASS_MOVIE_ANALYSIS_SEQUENCE_ASSEMBLY_DESIGN_V1',
    '033': 'PASS_MOVIE_ANALYSIS_VIDEO_BLUEPRINT_DESIGN_V1',
    '034': 'PASS_MOVIE_ANALYSIS_RUNTIME_PACKAGE_DESIGN_V1',
    '035': 'PASS_MOVIE_ANALYSIS_GENERATION_PACKAGE_DESIGN_V1',
    '036': 'PASS_MOVIE_ANALYSIS_GENERATION_BLUEPRINT_DESIGN_V1',
    '037': 'PASS_MOVIE_ANALYSIS_EXECUTION_READINESS_DESIGN_V1',
    '038': 'PASS_MOVIE_ANALYSIS_FINAL_RUNTIME_BUNDLE_DESIGN_V1',
    '039': 'PASS_MOVIE_ANALYSIS_MASTER_PACKAGE_DESIGN_V1',
  };
  return verdicts[phaseNum] ?? 'PASS';
}

export type CertificationStatus = 'PASS' | 'FAIL';

export type DatasetCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  phase_num?: string;
  source_video_id?: string;
};

export type PhaseCertificationAudit = {
  phase_num: string;
  phase: string;
  report_path: string;
  report_exists: boolean;
  phase_passed: boolean;
};

export type MovieAnalysisDatasetCertificationReport = {
  report_id: string;
  phase: typeof DATASET_CERTIFICATION_PHASE;
  timestamp: string;
  planning_only: true;
  certification_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
  no_execution: true;
  no_rendering: true;
  no_inference: true;
  no_generation: true;
  source_count: number;
  certification_status_message: typeof CERTIFICATION_STATUS_MESSAGE | null;
  certification_ready: CertificationStatus;
  image_app_certified: CertificationStatus;
  video_app_certified: CertificationStatus;
  dataset_certified: CertificationStatus;
  traceability_certified: CertificationStatus;
  safety_certified: CertificationStatus;
  certification_checks: {
    phase_chain_complete: boolean;
    phase_022_to_051_complete: boolean;
    release_package_pass: boolean;
    runtime_consumer_validation_pass: boolean;
    image_app_ready: boolean;
    video_app_ready: boolean;
    source_traceability_complete: boolean;
    dataset_integrity_complete: boolean;
    package_trace_integrity_complete: boolean;
    chain_id_integrity_complete: boolean;
  };
  safety_checks: {
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    planning_only: true;
    certification_only: true;
  };
  phase_audits: PhaseCertificationAudit[];
  final_verdict:
    | typeof DATASET_CERTIFICATION_PASS_VERDICT
    | typeof DATASET_CERTIFICATION_FAIL_VERDICT;
  issues: DatasetCertificationIssue[];
};

function isPackageTraceComplete(trace: { step: number; phase: string; plan_type: string }[]): boolean {
  if (trace.length !== TRACE_DEFINITIONS.length) {
    return false;
  }
  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = trace[i];
    if (
      !entry ||
      entry.step !== i + 1 ||
      entry.phase !== definition.phase ||
      entry.plan_type !== definition.plan_type
    ) {
      return false;
    }
  }
  return true;
}

function areChainIdsComplete(chainIds: Record<string, string | undefined>): boolean {
  return CHAIN_ID_KEYS.every((key) => Boolean(chainIds[key]));
}

function loadRuntimeConsumerValidationReport(
  projectRoot: string
): MovieAnalysisRuntimeConsumerValidationReport | null {
  const abs = path.join(projectRoot, RUNTIME_CONSUMER_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisRuntimeConsumerValidationReport;
}

function auditPhase(
  root: string,
  entry: (typeof CERTIFICATION_PHASE_ENTRIES)[number],
  issues: DatasetCertificationIssue[]
): PhaseCertificationAudit {
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
      });
    }

    return {
      phase_num: entry.phase_num,
      phase: entry.phase,
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
    const value = report[entry.pass_field];
    phasePassed = value === entry.pass_verdict;
  }

  if (!reportExists) {
    issues.push({
      code: 'PHASE_REPORT_MISSING',
      message: `Missing ${entry.report_path} for phase ${entry.phase_num}`,
      severity: 'error',
      phase_num: entry.phase_num,
    });
  } else if (!phasePassed) {
    issues.push({
      code: 'PHASE_REPORT_NOT_PASS',
      message: `Phase ${entry.phase_num} requires ${entry.pass_field}=${entry.pass_verdict}`,
      severity: 'error',
      phase_num: entry.phase_num,
    });
  }

  return {
    phase_num: entry.phase_num,
    phase: entry.phase,
    report_path: entry.report_path,
    report_exists: reportExists,
    phase_passed: phasePassed,
  };
}

function buildMarkdown(report: MovieAnalysisDatasetCertificationReport): string {
  const lines = [
    '# Movie Analysis Dataset Certification',
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
    `| certification_only | ${report.certification_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    `| no_inference | ${report.no_inference} |`,
    `| no_generation | ${report.no_generation} |`,
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| certification_ready | ${report.certification_ready} |`,
    `| image_app_certified | ${report.image_app_certified} |`,
    `| video_app_certified | ${report.video_app_certified} |`,
    `| dataset_certified | ${report.dataset_certified} |`,
    `| traceability_certified | ${report.traceability_certified} |`,
    `| safety_certified | ${report.safety_certified} |`,
    '',
    '## Certification Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| phase_chain_complete | ${report.certification_checks.phase_chain_complete} |`,
    `| phase_022_to_051_complete | ${report.certification_checks.phase_022_to_051_complete} |`,
    `| release_package_pass | ${report.certification_checks.release_package_pass} |`,
    `| runtime_consumer_validation_pass | ${report.certification_checks.runtime_consumer_validation_pass} |`,
    `| image_app_ready | ${report.certification_checks.image_app_ready} |`,
    `| video_app_ready | ${report.certification_checks.video_app_ready} |`,
    `| source_traceability_complete | ${report.certification_checks.source_traceability_complete} |`,
    `| dataset_integrity_complete | ${report.certification_checks.dataset_integrity_complete} |`,
    `| package_trace_integrity_complete | ${report.certification_checks.package_trace_integrity_complete} |`,
    `| chain_id_integrity_complete | ${report.certification_checks.chain_id_integrity_complete} |`,
    '',
    '## Phase Audits',
    ''
  );

  for (const audit of report.phase_audits) {
    lines.push(
      `- ${audit.phase_num} ${audit.phase}: report=${audit.report_exists ? 'PASS' : 'FAIL'} phase=${audit.phase_passed ? 'PASS' : 'FAIL'}`
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

export function writeMovieAnalysisDatasetCertificationReport(
  projectRoot?: string
): MovieAnalysisDatasetCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DatasetCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const releasePackage = loadMovieAnalysisReleasePackage(root);
  const releaseReport = loadMovieAnalysisReleaseReport(root);
  const runtimeConsumerReport = loadRuntimeConsumerValidationReport(root);
  const dataset = loadMovieAnalysisDataset(root);

  if (!releasePackage) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: `Missing ${RELEASE_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  if (!runtimeConsumerReport) {
    issues.push({
      code: 'RUNTIME_CONSUMER_VALIDATION_MISSING',
      message: `Missing ${RUNTIME_CONSUMER_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const phaseAudits = CERTIFICATION_PHASE_ENTRIES.map((entry) => auditPhase(root, entry, issues));
  const phaseChainComplete = phaseAudits.every((audit) => audit.report_exists && audit.phase_passed);
  const phase022To051Complete = phaseChainComplete;

  const releasePackagePass =
    releaseReport !== null &&
    releaseReport.final_verdict === RELEASE_PACKAGE_PASS_VERDICT &&
    releaseReport.release_package_complete === true;

  if (!releasePackagePass) {
    issues.push({
      code: 'RELEASE_PACKAGE_NOT_PASS',
      message: `Release package must have ${RELEASE_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const runtimeConsumerValidationPass =
    runtimeConsumerReport !== null &&
    runtimeConsumerReport.final_verdict === RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT &&
    runtimeConsumerReport.runtime_consumer_validation_only_status === 'PASS';

  if (!runtimeConsumerValidationPass) {
    issues.push({
      code: 'RUNTIME_CONSUMER_VALIDATION_NOT_PASS',
      message: `Runtime consumer validation must have ${RUNTIME_CONSUMER_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageAppReady =
    runtimeConsumerReport?.image_consumer_ready === 'PASS' &&
    runtimeConsumerReport.safety_integrity === 'PASS';
  const videoAppReady =
    runtimeConsumerReport?.video_consumer_ready === 'PASS' &&
    runtimeConsumerReport.release_integrity === 'PASS';

  if (!imageAppReady) {
    issues.push({
      code: 'IMAGE_APP_NOT_READY',
      message: 'Image App consumer readiness check failed',
      severity: 'error',
    });
  }
  if (!videoAppReady) {
    issues.push({
      code: 'VIDEO_APP_NOT_READY',
      message: 'Video App consumer readiness check failed',
      severity: 'error',
    });
  }

  let sourceTraceabilityComplete = false;
  let datasetIntegrityComplete = false;
  let packageTraceIntegrityComplete = false;
  let chainIdIntegrityComplete = false;

  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
  } else if (dataset.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'DATASET_SOURCE_COUNT_MISMATCH',
      message: `Dataset source_count must be ${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  } else {
    const datasetSourceIds = dataset.sources.map((s) => s.source_video_id).sort();
    const releaseSourceIds =
      releasePackage?.sources.map((s) => s.source_video_id).sort() ?? [];

    sourceTraceabilityComplete =
      releaseSourceIds.length === EXPECTED_SOURCE_COUNT &&
      datasetSourceIds.length === EXPECTED_SOURCE_COUNT &&
      datasetSourceIds.every((id, index) => id === releaseSourceIds[index]) &&
      dataset.sources.every(
        (source) =>
          Boolean(source.source_video_path) &&
          Boolean(source.master_package_id) &&
          Boolean(source.final_runtime_bundle_id) &&
          Boolean(source.generation_blueprint_id)
      );

    if (!sourceTraceabilityComplete) {
      issues.push({
        code: 'SOURCE_TRACEABILITY_INCOMPLETE',
        message: 'Source traceability between release package and dataset is incomplete',
        severity: 'error',
      });
    }

    packageTraceIntegrityComplete = dataset.sources.every((source) => {
      const trace = dataset.package_traces[source.source_video_id];
      return trace ? isPackageTraceComplete(trace) : false;
    });

    if (!packageTraceIntegrityComplete) {
      for (const source of dataset.sources) {
        const trace = dataset.package_traces[source.source_video_id];
        if (!trace || !isPackageTraceComplete(trace)) {
          issues.push({
            code: 'PACKAGE_TRACE_INCOMPLETE',
            message: `Package trace incomplete for ${source.source_video_id}`,
            severity: 'error',
            source_video_id: source.source_video_id,
          });
        }
      }
    }

    chainIdIntegrityComplete = dataset.sources.every((source) => {
      const chainIds = dataset.chain_ids[source.source_video_id];
      return chainIds ? areChainIdsComplete(chainIds) : false;
    });

    if (!chainIdIntegrityComplete) {
      for (const source of dataset.sources) {
        const chainIds = dataset.chain_ids[source.source_video_id];
        if (!chainIds || !areChainIdsComplete(chainIds)) {
          issues.push({
            code: 'CHAIN_ID_INCOMPLETE',
            message: `Chain IDs incomplete for ${source.source_video_id}`,
            severity: 'error',
            source_video_id: source.source_video_id,
          });
        }
      }
    }

    datasetIntegrityComplete =
      fs.existsSync(path.join(root, DATASET_PATH)) &&
      dataset.source_count === EXPECTED_SOURCE_COUNT &&
      Object.keys(dataset.image_app_payloads).length === EXPECTED_SOURCE_COUNT &&
      Object.keys(dataset.video_app_payloads).length === EXPECTED_SOURCE_COUNT &&
      dataset.safety_flags.summary.planning_only === true &&
      dataset.safety_flags.summary.runtime_execution === false &&
      dataset.safety_flags.summary.video_generation === false &&
      dataset.safety_flags.summary.image_generation === false &&
      dataset.safety_flags.summary.gpu_execution === false &&
      dataset.safety_flags.summary.external_call_allowed === false;

    if (!datasetIntegrityComplete) {
      issues.push({
        code: 'DATASET_INTEGRITY_INCOMPLETE',
        message: 'Dataset integrity validation failed',
        severity: 'error',
      });
    }
  }

  const releaseSafety = releasePackage?.safety_summary;
  const runtimeSafety = runtimeConsumerReport?.safety_checks;
  const safetyCertified =
    releaseSafety?.planning_only === true &&
    releaseSafety.runtime_execution === false &&
    releaseSafety.video_generation === false &&
    releaseSafety.image_generation === false &&
    releaseSafety.gpu_execution === false &&
    releaseSafety.external_call_allowed === false &&
    runtimeSafety?.runtime_execution === false &&
    runtimeSafety.video_generation === false &&
    runtimeSafety.image_generation === false &&
    runtimeSafety.gpu_execution === false &&
    runtimeSafety.external_call_allowed === false &&
    runtimeSafety.planning_only === true;

  if (!safetyCertified) {
    issues.push({
      code: 'SAFETY_CERTIFICATION_FAIL',
      message: 'Safety certification checks failed',
      severity: 'error',
    });
  }

  const imageAppCertified = imageAppReady && runtimeConsumerValidationPass ? 'PASS' : 'FAIL';
  const videoAppCertified = videoAppReady && runtimeConsumerValidationPass ? 'PASS' : 'FAIL';
  const datasetCertified = datasetIntegrityComplete ? 'PASS' : 'FAIL';
  const traceabilityCertified =
    sourceTraceabilityComplete &&
    packageTraceIntegrityComplete &&
    chainIdIntegrityComplete
      ? 'PASS'
      : 'FAIL';
  const safetyCertifiedStatus: CertificationStatus = safetyCertified ? 'PASS' : 'FAIL';

  const certificationReady =
    phaseChainComplete &&
    phase022To051Complete &&
    releasePackagePass &&
    runtimeConsumerValidationPass &&
    imageAppReady &&
    videoAppReady &&
    sourceTraceabilityComplete &&
    datasetIntegrityComplete &&
    packageTraceIntegrityComplete &&
    chainIdIntegrityComplete &&
    safetyCertified &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = certificationReady === 'PASS';

  const report: MovieAnalysisDatasetCertificationReport = {
    report_id: 'movie-analysis-dataset-certification-report-v1',
    phase: DATASET_CERTIFICATION_PHASE,
    timestamp,
    planning_only: true,
    certification_only: true,
    runtime_execution: false,
    video_generation: false,
    image_generation: false,
    gpu_execution: false,
    external_call_allowed: false,
    no_execution: true,
    no_rendering: true,
    no_inference: true,
    no_generation: true,
    source_count: releasePackage?.source_count ?? dataset?.source_count ?? 0,
    certification_status_message: pass ? CERTIFICATION_STATUS_MESSAGE : null,
    certification_ready: certificationReady,
    image_app_certified: imageAppCertified,
    video_app_certified: videoAppCertified,
    dataset_certified: datasetCertified,
    traceability_certified: traceabilityCertified,
    safety_certified: safetyCertifiedStatus,
    certification_checks: {
      phase_chain_complete: phaseChainComplete,
      phase_022_to_051_complete: phase022To051Complete,
      release_package_pass: releasePackagePass,
      runtime_consumer_validation_pass: runtimeConsumerValidationPass,
      image_app_ready: imageAppReady,
      video_app_ready: videoAppReady,
      source_traceability_complete: sourceTraceabilityComplete,
      dataset_integrity_complete: datasetIntegrityComplete,
      package_trace_integrity_complete: packageTraceIntegrityComplete,
      chain_id_integrity_complete: chainIdIntegrityComplete,
    },
    safety_checks: {
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      planning_only: true,
      certification_only: true,
    },
    phase_audits: phaseAudits,
    final_verdict: pass
      ? DATASET_CERTIFICATION_PASS_VERDICT
      : DATASET_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DATASET_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DATASET_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
