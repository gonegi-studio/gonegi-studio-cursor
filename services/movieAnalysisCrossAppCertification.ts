import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  IMAGE_APP_BRIDGE_PATH,
  type ImageAppBridgeEntry,
  loadMovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_APP_CERTIFICATION_PASS_VERDICT,
  IMAGE_APP_CERTIFICATION_REPORT_PATH,
  IMAGE_APP_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisImageAppCertificationReport,
} from './movieAnalysisImageAppCertification.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  type VideoAppBridgeEntry,
  loadMovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import {
  VIDEO_APP_CERTIFICATION_PASS_VERDICT,
  VIDEO_APP_CERTIFICATION_REPORT_PATH,
  VIDEO_APP_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisVideoAppCertificationReport,
} from './movieAnalysisVideoAppCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CROSS_APP_CERTIFICATION_PHASE =
  'PHASE-SOURCE-VIDEO-075-MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION_V1' as const;
export const CROSS_APP_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION_V1' as const;
export const CROSS_APP_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION_V1' as const;
export const CROSS_APP_CERTIFICATION_REPORT_PATH =
  'reports/movie-analysis-cross-app-certification-report.json' as const;
export const CROSS_APP_CERTIFICATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_CROSS_APP_CERTIFICATION.md' as const;
export const CROSS_APP_CERTIFICATION_STATUS_MESSAGE =
  'MOVIE_ANALYSIS_CROSS_APP_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type CrossAppCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceCrossAppCertificationAudit = {
  source_video_id: string;
  shared_adapter_integrity: CertificationStatus;
  shared_traceability: CertificationStatus;
  cross_app_consistent: CertificationStatus;
  source_cross_app_ready: CertificationStatus;
};

export type MovieAnalysisCrossAppCertificationReport = {
  report_id: string;
  phase: typeof CROSS_APP_CERTIFICATION_PHASE;
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
  image_app_certification_report_path: typeof IMAGE_APP_CERTIFICATION_REPORT_PATH;
  video_app_certification_report_path: typeof VIDEO_APP_CERTIFICATION_REPORT_PATH;
  image_bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
  video_bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
  image_app_ready: CertificationStatus;
  video_app_ready: CertificationStatus;
  shared_adapter_integrity: CertificationStatus;
  shared_traceability: CertificationStatus;
  cross_app_consistency: CertificationStatus;
  source_count_valid: CertificationStatus;
  adapter_count_valid: CertificationStatus;
  cross_app_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof CROSS_APP_CERTIFICATION_STATUS_MESSAGE | null;
  source_audits: SourceCrossAppCertificationAudit[];
  final_verdict:
    | typeof CROSS_APP_CERTIFICATION_PASS_VERDICT
    | typeof CROSS_APP_CERTIFICATION_FAIL_VERDICT;
  issues: CrossAppCertificationIssue[];
};

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

function mappingsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function loadImageAppCertificationReport(
  projectRoot: string
): MovieAnalysisImageAppCertificationReport | null {
  const abs = path.join(projectRoot, IMAGE_APP_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageAppCertificationReport;
}

function loadVideoAppCertificationReport(
  projectRoot: string
): MovieAnalysisVideoAppCertificationReport | null {
  const abs = path.join(projectRoot, VIDEO_APP_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisVideoAppCertificationReport;
}

function isSharedAdapterIntegrity(
  imageEntry: ImageAppBridgeEntry,
  videoEntry: VideoAppBridgeEntry
): boolean {
  if (imageEntry.source_video_id !== videoEntry.source_video_id) {
    return false;
  }

  if (!mappingsEqual(imageEntry.adapter_ids, videoEntry.adapter_ids)) {
    return false;
  }

  return ADAPTER_FIELDS.every((field) =>
    mappingsEqual(imageEntry[field], videoEntry[field])
  );
}

function isSharedTraceability(
  imageEntry: ImageAppBridgeEntry,
  videoEntry: VideoAppBridgeEntry
): boolean {
  return (
    imageEntry.cinematic_dna_id === videoEntry.cinematic_dna_id &&
    imageEntry.integration_id === videoEntry.integration_id &&
    imageEntry.adapter_library_entry_id === videoEntry.adapter_library_entry_id &&
    imageEntry.release_id === videoEntry.release_id &&
    imageEntry.package_id === videoEntry.package_id
  );
}

function isBridgeMetaConsistent(
  imageBridge: NonNullable<ReturnType<typeof loadMovieAnalysisImageAppBridge>>,
  videoBridge: NonNullable<ReturnType<typeof loadMovieAnalysisVideoAppBridge>>
): boolean {
  return (
    imageBridge.release_id === videoBridge.release_id &&
    imageBridge.package_id === videoBridge.package_id &&
    imageBridge.adapter_library_id === videoBridge.adapter_library_id &&
    imageBridge.cinematic_dna_set_id === videoBridge.cinematic_dna_set_id &&
    imageBridge.integration_set_id === videoBridge.integration_set_id &&
    imageBridge.release_package_path === videoBridge.release_package_path &&
    imageBridge.production_ready_report_path === videoBridge.production_ready_report_path &&
    imageBridge.source_count === videoBridge.source_count &&
    imageBridge.adapter_count === videoBridge.adapter_count &&
    imageBridge.consumer_target === 'image_app' &&
    videoBridge.consumer_target === 'video_app'
  );
}

function aggregateStatus(
  audits: SourceCrossAppCertificationAudit[],
  field: keyof SourceCrossAppCertificationAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function auditSource(
  imageEntry: ImageAppBridgeEntry | undefined,
  videoEntry: VideoAppBridgeEntry | undefined,
  imageCertSource:
    | MovieAnalysisImageAppCertificationReport['source_audits'][number]
    | undefined,
  videoCertSource:
    | MovieAnalysisVideoAppCertificationReport['source_audits'][number]
    | undefined,
  sourceVideoId: string
): SourceCrossAppCertificationAudit {
  if (!imageEntry || !videoEntry || !imageCertSource || !videoCertSource) {
    return {
      source_video_id: sourceVideoId,
      shared_adapter_integrity: 'FAIL',
      shared_traceability: 'FAIL',
      cross_app_consistent: 'FAIL',
      source_cross_app_ready: 'FAIL',
    };
  }

  const sharedAdapterIntegrity = isSharedAdapterIntegrity(imageEntry, videoEntry)
    ? 'PASS'
    : 'FAIL';
  const sharedTraceability =
    isSharedTraceability(imageEntry, videoEntry) &&
    imageCertSource.traceability_preserved === 'PASS' &&
    videoCertSource.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';
  const crossAppConsistent =
    sharedAdapterIntegrity === 'PASS' &&
    sharedTraceability === 'PASS' &&
    imageCertSource.source_certified === 'PASS' &&
    videoCertSource.source_certified === 'PASS' &&
    imageEntry.image_app_ready === true &&
    videoEntry.video_app_ready === true &&
    imageEntry.bridge_only === true &&
    videoEntry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  const sourceCrossAppReady = crossAppConsistent === 'PASS' ? 'PASS' : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    shared_adapter_integrity: sharedAdapterIntegrity,
    shared_traceability: sharedTraceability,
    cross_app_consistent: crossAppConsistent,
    source_cross_app_ready: sourceCrossAppReady,
  };
}

function buildMarkdown(report: MovieAnalysisCrossAppCertificationReport): string {
  const lines = [
    '# Movie Analysis Cross App Certification',
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
    '## Cross App Chain',
    '',
    'Movie Analysis → DNA → Image App → Video App',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_app_ready | ${report.image_app_ready} |`,
    `| video_app_ready | ${report.video_app_ready} |`,
    `| shared_adapter_integrity | ${report.shared_adapter_integrity} |`,
    `| shared_traceability | ${report.shared_traceability} |`,
    `| cross_app_consistency | ${report.cross_app_consistency} |`,
    `| source_count_valid | ${report.source_count_valid} |`,
    `| adapter_count_valid | ${report.adapter_count_valid} |`,
    `| cross_app_certification_ready | ${report.cross_app_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Cross App Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- shared_adapter_integrity: ${audit.shared_adapter_integrity}`,
      `- shared_traceability: ${audit.shared_traceability}`,
      `- cross_app_consistent: ${audit.cross_app_consistent}`,
      `- source_cross_app_ready: ${audit.source_cross_app_ready}`,
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

export function writeMovieAnalysisCrossAppCertificationReport(
  projectRoot?: string
): MovieAnalysisCrossAppCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CrossAppCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageCertReport = loadImageAppCertificationReport(root);
  if (!imageCertReport) {
    issues.push({
      code: 'IMAGE_APP_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const videoCertReport = loadVideoAppCertificationReport(root);
  if (!videoCertReport) {
    issues.push({
      code: 'VIDEO_APP_CERTIFICATION_REPORT_MISSING',
      message: `Missing ${VIDEO_APP_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const imageBridge = loadMovieAnalysisImageAppBridge(root);
  if (!imageBridge) {
    issues.push({
      code: 'IMAGE_APP_BRIDGE_MISSING',
      message: `Missing ${IMAGE_APP_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const videoBridge = loadMovieAnalysisVideoAppBridge(root);
  if (!videoBridge) {
    issues.push({
      code: 'VIDEO_APP_BRIDGE_MISSING',
      message: `Missing ${VIDEO_APP_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  if (!imageCertReport || !videoCertReport || !imageBridge || !videoBridge) {
    const report: MovieAnalysisCrossAppCertificationReport = {
      report_id: 'movie-analysis-cross-app-certification-report-v1',
      phase: CROSS_APP_CERTIFICATION_PHASE,
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
      image_app_certification_report_path: IMAGE_APP_CERTIFICATION_REPORT_PATH,
      video_app_certification_report_path: VIDEO_APP_CERTIFICATION_REPORT_PATH,
      image_bridge_path: IMAGE_APP_BRIDGE_PATH,
      video_bridge_path: VIDEO_APP_BRIDGE_PATH,
      image_app_ready: 'FAIL',
      video_app_ready: 'FAIL',
      shared_adapter_integrity: 'FAIL',
      shared_traceability: 'FAIL',
      cross_app_consistency: 'FAIL',
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      cross_app_certification_ready: 'FAIL',
      planning_only_status: 'FAIL',
      certification_status: null,
      source_audits: [],
      final_verdict: CROSS_APP_CERTIFICATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, CROSS_APP_CERTIFICATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, CROSS_APP_CERTIFICATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (imageCertReport.final_verdict !== IMAGE_APP_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'IMAGE_APP_CERTIFICATION_NOT_PASS',
      message: `Image App certification must have ${IMAGE_APP_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (videoCertReport.final_verdict !== VIDEO_APP_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'VIDEO_APP_CERTIFICATION_NOT_PASS',
      message: `Video App certification must have ${VIDEO_APP_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageAppReady =
    imageCertReport.image_app_certification_ready === 'PASS' &&
    imageCertReport.certification_status === IMAGE_APP_CERTIFICATION_STATUS_MESSAGE &&
    imageCertReport.final_verdict === IMAGE_APP_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const videoAppReady =
    videoCertReport.video_app_certification_ready === 'PASS' &&
    videoCertReport.certification_status === VIDEO_APP_CERTIFICATION_STATUS_MESSAGE &&
    videoCertReport.final_verdict === VIDEO_APP_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const sourceCountValid =
    imageBridge.source_count === EXPECTED_SOURCE_COUNT &&
    videoBridge.source_count === EXPECTED_SOURCE_COUNT &&
    imageCertReport.source_count === EXPECTED_SOURCE_COUNT &&
    videoCertReport.source_count === EXPECTED_SOURCE_COUNT
      ? 'PASS'
      : 'FAIL';

  const adapterCountValid =
    imageBridge.adapter_count === EXPECTED_ADAPTER_COUNT &&
    videoBridge.adapter_count === EXPECTED_ADAPTER_COUNT &&
    imageCertReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    videoCertReport.adapter_count === EXPECTED_ADAPTER_COUNT
      ? 'PASS'
      : 'FAIL';

  if (imageAppReady === 'FAIL') {
    issues.push({
      code: 'IMAGE_APP_NOT_READY',
      message: 'Image App chain not ready',
      severity: 'error',
    });
  }

  if (videoAppReady === 'FAIL') {
    issues.push({
      code: 'VIDEO_APP_NOT_READY',
      message: 'Video App chain not ready',
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

  const bridgeMetaConsistent = isBridgeMetaConsistent(imageBridge, videoBridge);
  if (!bridgeMetaConsistent) {
    issues.push({
      code: 'BRIDGE_META_INCONSISTENT',
      message: 'Image and Video App bridge metadata inconsistent',
      severity: 'error',
    });
  }

  const sourceAudits: SourceCrossAppCertificationAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imageEntry = imageBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const videoEntry = videoBridge.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    const imageCertSource = imageCertReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );
    const videoCertSource = videoCertReport.source_audits.find(
      (audit) => audit.source_video_id === sourceVideoId
    );

    const audit = auditSource(
      imageEntry,
      videoEntry,
      imageCertSource,
      videoCertSource,
      sourceVideoId
    );
    sourceAudits.push(audit);

    if (audit.source_cross_app_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_CROSS_APP_NOT_READY',
        message: `Cross App certification failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sharedAdapterIntegrity = aggregateStatus(sourceAudits, 'shared_adapter_integrity');
  const sharedTraceability = aggregateStatus(sourceAudits, 'shared_traceability');

  if (sharedAdapterIntegrity === 'FAIL') {
    issues.push({
      code: 'SHARED_ADAPTER_INTEGRITY_FAIL',
      message: 'Shared adapter integrity validation failed',
      severity: 'error',
    });
  }

  if (sharedTraceability === 'FAIL') {
    issues.push({
      code: 'SHARED_TRACEABILITY_FAIL',
      message: 'Shared traceability validation failed',
      severity: 'error',
    });
  }

  const crossAppConsistency =
    imageAppReady === 'PASS' &&
    videoAppReady === 'PASS' &&
    sharedAdapterIntegrity === 'PASS' &&
    sharedTraceability === 'PASS' &&
    bridgeMetaConsistent &&
    aggregateStatus(sourceAudits, 'cross_app_consistent') === 'PASS'
      ? 'PASS'
      : 'FAIL';

  if (crossAppConsistency === 'FAIL') {
    issues.push({
      code: 'CROSS_APP_INCONSISTENT',
      message: 'Cross App consistency validation failed',
      severity: 'error',
    });
  }

  const safetyValid =
    imageBridge.safety_summary.planning_only === true &&
    imageBridge.safety_summary.generation === false &&
    imageBridge.safety_summary.runtime_execution === false &&
    imageBridge.safety_summary.gpu_execution === false &&
    imageBridge.safety_summary.external_call_allowed === false &&
    videoBridge.safety_summary.planning_only === true &&
    videoBridge.safety_summary.generation === false &&
    videoBridge.safety_summary.runtime_execution === false &&
    videoBridge.safety_summary.gpu_execution === false &&
    videoBridge.safety_summary.external_call_allowed === false &&
    imageCertReport.planning_only === true &&
    videoCertReport.planning_only === true &&
    imageCertReport.planning_only_status === 'PASS' &&
    videoCertReport.planning_only_status === 'PASS';

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const crossAppCertificationReady =
    imageAppReady === 'PASS' &&
    videoAppReady === 'PASS' &&
    sharedAdapterIntegrity === 'PASS' &&
    sharedTraceability === 'PASS' &&
    crossAppConsistency === 'PASS' &&
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_cross_app_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = crossAppCertificationReady === 'PASS';

  const report: MovieAnalysisCrossAppCertificationReport = {
    report_id: 'movie-analysis-cross-app-certification-report-v1',
    phase: CROSS_APP_CERTIFICATION_PHASE,
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
    source_count: imageBridge.source_count,
    adapter_count: imageBridge.adapter_count,
    image_app_certification_report_path: IMAGE_APP_CERTIFICATION_REPORT_PATH,
    video_app_certification_report_path: VIDEO_APP_CERTIFICATION_REPORT_PATH,
    image_bridge_path: IMAGE_APP_BRIDGE_PATH,
    video_bridge_path: VIDEO_APP_BRIDGE_PATH,
    image_app_ready: imageAppReady,
    video_app_ready: videoAppReady,
    shared_adapter_integrity: sharedAdapterIntegrity,
    shared_traceability: sharedTraceability,
    cross_app_consistency: crossAppConsistency,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    cross_app_certification_ready: crossAppCertificationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? CROSS_APP_CERTIFICATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CROSS_APP_CERTIFICATION_PASS_VERDICT
      : CROSS_APP_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, CROSS_APP_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CROSS_APP_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
