import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  EXPECTED_ADAPTER_COUNT,
  EXPECTED_SOURCE_COUNT,
  IMAGE_APP_BRIDGE_PASS_VERDICT,
  IMAGE_APP_BRIDGE_PATH,
  IMAGE_APP_BRIDGE_REPORT_PATH,
  type MovieAnalysisImageAppBridgeReport,
  loadMovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_APP_IMPORT_TEST_PASS_VERDICT,
  IMAGE_APP_IMPORT_TEST_REPORT_PATH,
  type MovieAnalysisImageAppImportTestReport,
  type SourceImageAppImportAudit,
} from './movieAnalysisImageAppImportTest.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMAGE_APP_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-071-MOVIE_ANALYSIS_IMAGE_APP_CERTIFICATION_V1' as const;
export const IMAGE_APP_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_IMAGE_APP_CERTIFICATION_V1' as const;
export const IMAGE_APP_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_IMAGE_APP_CERTIFICATION_V1' as const;
export const IMAGE_APP_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-image-app-certification-report.json' as const;
export const IMAGE_APP_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_IMAGE_APP_CERTIFICATION.md' as const;
export const IMAGE_APP_CERTIFICATION_STATUS_MESSAGE =
  'MOVIE_ANALYSIS_IMAGE_APP_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ImageAppCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceImageAppCertificationAudit = {
  source_video_id: string;
  bridge_ready: CertificationStatus;
  import_ready: CertificationStatus;
  adapter_mapping_complete: CertificationStatus;
  traceability_preserved: CertificationStatus;
  source_certified: CertificationStatus;
};

export type MovieAnalysisImageAppCertificationReport = {
  report_id: string;
  phase: typeof IMAGE_APP_CERTIFICATION_PHASE;
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
  bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
  import_test_report_path: typeof IMAGE_APP_IMPORT_TEST_REPORT_PATH;
  bridge_ready: CertificationStatus;
  import_ready: CertificationStatus;
  adapter_mapping_complete: CertificationStatus;
  traceability_preserved: CertificationStatus;
  source_count_valid: CertificationStatus;
  adapter_count_valid: CertificationStatus;
  image_app_chain_complete: CertificationStatus;
  image_app_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof IMAGE_APP_CERTIFICATION_STATUS_MESSAGE | null;
  source_audits: SourceImageAppCertificationAudit[];
  final_verdict:
    | typeof IMAGE_APP_CERTIFICATION_PASS_VERDICT
    | typeof IMAGE_APP_CERTIFICATION_FAIL_VERDICT;
  issues: ImageAppCertificationIssue[];
};

function loadImportTestReport(
  projectRoot: string
): MovieAnalysisImageAppImportTestReport | null {
  const abs = path.join(projectRoot, IMAGE_APP_IMPORT_TEST_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppImportTestReport;
}

function loadBridgeReport(projectRoot: string): MovieAnalysisImageAppBridgeReport | null {
  const abs = path.join(projectRoot, IMAGE_APP_BRIDGE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppBridgeReport;
}

function aggregateStatus(
  audits: SourceImageAppCertificationAudit[],
  field: keyof SourceImageAppCertificationAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function auditSource(
  bridgeSource:
    | MovieAnalysisImageAppBridgeReport['source_audits'][number]
    | undefined,
  importSource: SourceImageAppImportAudit | undefined,
  sourceVideoId: string
): SourceImageAppCertificationAudit {
  if (!bridgeSource || !importSource) {
    return {
      source_video_id: sourceVideoId,
      bridge_ready: 'FAIL',
      import_ready: 'FAIL',
      adapter_mapping_complete: 'FAIL',
      traceability_preserved: 'FAIL',
      source_certified: 'FAIL',
    };
  }

  const bridgeReady = bridgeSource.source_bridge_ready === 'PASS' ? 'PASS' : 'FAIL';
  const importReady = importSource.import_ready === 'PASS' ? 'PASS' : 'FAIL';
  const adapterMappingComplete =
    bridgeSource.scene_adapter_mapped === 'PASS' &&
    bridgeSource.camera_adapter_mapped === 'PASS' &&
    bridgeSource.emotion_adapter_mapped === 'PASS' &&
    bridgeSource.transition_adapter_mapped === 'PASS' &&
    bridgeSource.continuity_adapter_mapped === 'PASS' &&
    bridgeSource.storytelling_adapter_mapped === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const traceabilityPreserved =
    bridgeSource.traceability_preserved === 'PASS' &&
    importSource.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCertified =
    bridgeReady === 'PASS' &&
    importReady === 'PASS' &&
    adapterMappingComplete === 'PASS' &&
    traceabilityPreserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    bridge_ready: bridgeReady,
    import_ready: importReady,
    adapter_mapping_complete: adapterMappingComplete,
    traceability_preserved: traceabilityPreserved,
    source_certified: sourceCertified,
  };
}

function buildMarkdown(report: MovieAnalysisImageAppCertificationReport): string {
  const lines = [
    '# Movie Analysis Image App Certification',
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
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| bridge_ready | ${report.bridge_ready} |`,
    `| import_ready | ${report.import_ready} |`,
    `| adapter_mapping_complete | ${report.adapter_mapping_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| source_count_valid | ${report.source_count_valid} |`,
    `| adapter_count_valid | ${report.adapter_count_valid} |`,
    `| image_app_chain_complete | ${report.image_app_chain_complete} |`,
    `| image_app_certification_ready | ${report.image_app_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Certification Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- bridge_ready: ${audit.bridge_ready}`,
      `- import_ready: ${audit.import_ready}`,
      `- adapter_mapping_complete: ${audit.adapter_mapping_complete}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_certified: ${audit.source_certified}`,
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

export function writeMovieAnalysisImageAppCertificationReport(
  projectRoot?: string
): MovieAnalysisImageAppCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImageAppCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const importTestReport = loadImportTestReport(root);
  if (!importTestReport) {
    issues.push({
      code: 'IMPORT_TEST_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_IMPORT_TEST_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const bridgeReport = loadBridgeReport(root);
  if (!bridgeReport) {
    issues.push({
      code: 'BRIDGE_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_BRIDGE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const bridge = loadMovieAnalysisImageAppBridge(root);
  if (!bridge) {
    issues.push({
      code: 'IMAGE_APP_BRIDGE_MISSING',
      message: `Missing ${IMAGE_APP_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  if (!importTestReport || !bridgeReport || !bridge) {
    const report: MovieAnalysisImageAppCertificationReport = {
      report_id: 'movie-analysis-image-app-certification-report-v1',
      phase: IMAGE_APP_CERTIFICATION_PHASE,
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
      bridge_path: IMAGE_APP_BRIDGE_PATH,
      import_test_report_path: IMAGE_APP_IMPORT_TEST_REPORT_PATH,
      bridge_ready: 'FAIL',
      import_ready: 'FAIL',
      adapter_mapping_complete: 'FAIL',
      traceability_preserved: 'FAIL',
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      image_app_chain_complete: 'FAIL',
      image_app_certification_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status: null,
      source_audits: [],
      final_verdict: IMAGE_APP_CERTIFICATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, IMAGE_APP_CERTIFICATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, IMAGE_APP_CERTIFICATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (importTestReport.final_verdict !== IMAGE_APP_IMPORT_TEST_PASS_VERDICT) {
    issues.push({
      code: 'IMPORT_TEST_NOT_PASS',
      message: `Import test must have ${IMAGE_APP_IMPORT_TEST_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (bridgeReport.final_verdict !== IMAGE_APP_BRIDGE_PASS_VERDICT) {
    issues.push({
      code: 'BRIDGE_NOT_PASS',
      message: `Image App bridge must have ${IMAGE_APP_BRIDGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const bridgeReady =
    bridgeReport.image_app_bridge_ready === 'PASS' &&
    bridgeReport.final_verdict === IMAGE_APP_BRIDGE_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const importReady =
    importTestReport.image_app_import_ready === 'PASS' &&
    importTestReport.final_verdict === IMAGE_APP_IMPORT_TEST_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const adapterMappingComplete =
    bridgeReport.adapter_mapping_complete === 'PASS' ? 'PASS' : 'FAIL';

  const traceabilityPreserved =
    bridgeReport.traceability_preserved === 'PASS' &&
    importTestReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCountValid =
    bridge.source_count === EXPECTED_SOURCE_COUNT &&
    bridgeReport.source_count === EXPECTED_SOURCE_COUNT &&
    importTestReport.source_count === EXPECTED_SOURCE_COUNT
      ? 'PASS'
      : 'FAIL';

  const adapterCountValid =
    bridge.adapter_count === EXPECTED_ADAPTER_COUNT &&
    bridgeReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    importTestReport.adapter_count === EXPECTED_ADAPTER_COUNT
      ? 'PASS'
      : 'FAIL';

  if (bridgeReady === 'FAIL') {
    issues.push({ code: 'BRIDGE_NOT_READY', message: 'Bridge not ready', severity: 'error' });
  }
  if (importReady === 'FAIL') {
    issues.push({ code: 'IMPORT_NOT_READY', message: 'Import not ready', severity: 'error' });
  }
  if (adapterMappingComplete === 'FAIL') {
    issues.push({
      code: 'ADAPTER_MAPPING_INCOMPLETE',
      message: 'Adapter mapping incomplete',
      severity: 'error',
    });
  }
  if (traceabilityPreserved === 'FAIL') {
    issues.push({
      code: 'TRACEABILITY_NOT_PRESERVED',
      message: 'Traceability not preserved',
      severity: 'error',
    });
  }
  if (sourceCountValid === 'FAIL') {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (adapterCountValid === 'FAIL') {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceImageAppCertificationAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const bridgeSource = bridgeReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );
    const importSource = importTestReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );
    const audit = auditSource(bridgeSource, importSource, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_certified === 'FAIL') {
      issues.push({
        code: 'SOURCE_NOT_CERTIFIED',
        message: `Image App certification failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const safetyValid =
    bridge.safety_summary.planning_only === true &&
    bridge.safety_summary.generation === false &&
    bridge.safety_summary.runtime_execution === false &&
    bridge.safety_summary.gpu_execution === false &&
    bridge.safety_summary.external_call_allowed === false &&
    importTestReport.planning_only === true &&
    importTestReport.planning_only_status === 'PASS' &&
    bridgeReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const imageAppChainComplete =
    bridgeReady === 'PASS' &&
    importReady === 'PASS' &&
    adapterMappingComplete === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    aggregateStatus(sourceAudits, 'bridge_ready') === 'PASS' &&
    aggregateStatus(sourceAudits, 'import_ready') === 'PASS' &&
    aggregateStatus(sourceAudits, 'adapter_mapping_complete') === 'PASS' &&
    aggregateStatus(sourceAudits, 'traceability_preserved') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const imageAppCertificationReady =
    imageAppChainComplete === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_certified === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = imageAppCertificationReady === 'PASS';

  const report: MovieAnalysisImageAppCertificationReport = {
    report_id: 'movie-analysis-image-app-certification-report-v1',
    phase: IMAGE_APP_CERTIFICATION_PHASE,
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
    source_count: bridge.source_count,
    adapter_count: bridge.adapter_count,
    bridge_path: IMAGE_APP_BRIDGE_PATH,
    import_test_report_path: IMAGE_APP_IMPORT_TEST_REPORT_PATH,
    bridge_ready: bridgeReady,
    import_ready: importReady,
    adapter_mapping_complete: adapterMappingComplete,
    traceability_preserved: traceabilityPreserved,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    image_app_chain_complete: imageAppChainComplete,
    image_app_certification_ready: imageAppCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? IMAGE_APP_CERTIFICATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? IMAGE_APP_CERTIFICATION_PASS_VERDICT
      : IMAGE_APP_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMAGE_APP_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
