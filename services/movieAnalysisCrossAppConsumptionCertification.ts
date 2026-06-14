import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_APP_BRIDGE_PATH,
  type ImageAppBridgeEntry,
  type MovieAnalysisImageAppBridge,
} from './movieAnalysisImageAppBridge.js';
import {
  IMAGE_APP_CONSUMPTION_VALIDATION_DIR,
  IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  type MovieAnalysisImageAppConsumptionValidationReport,
  type SourceImageAppConsumptionAudit,
} from './movieAnalysisImageAppConsumptionValidation.js';
import {
  IMAGE_RUNTIME_PACKAGE_PATH,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
} from './movieAnalysisImageRuntimePackage.js';
import {
  VIDEO_APP_BRIDGE_PATH,
  type VideoAppBridgeEntry,
  type MovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import {
  VIDEO_APP_CONSUMPTION_VALIDATION_DIR,
  VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT,
  VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
  type MovieAnalysisVideoAppConsumptionValidationReport,
  type SourceVideoAppConsumptionAudit,
} from './movieAnalysisVideoAppConsumptionValidation.js';
import {
  VIDEO_RUNTIME_PACKAGE_PATH,
  type MovieAnalysisVideoRuntimePackage,
  type VideoRuntimePackageEntry,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2B-003-MOVIE_ANALYSIS_CROSS_APP_CONSUMPTION_CERTIFICATION_V1' as const;
export const CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CROSS_APP_CONSUMPTION_CERTIFICATION_V1' as const;
export const CROSS_APP_CONSUMPTION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CROSS_APP_CONSUMPTION_CERTIFICATION_V1' as const;
export const CROSS_APP_CONSUMPTION_CERTIFICATION_DIR =
  'reports/movie_analysis_cross_app_consumption_certification' as const;
export const CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_cross_app_consumption_certification/movie-analysis-cross-app-consumption-certification-report.json' as const;
export const CROSS_APP_CONSUMPTION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_cross_app_consumption_certification/MOVIE_ANALYSIS_CROSS_APP_CONSUMPTION_CERTIFICATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type CrossAppConsumptionCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type SourceCrossAppConsumptionAudit = {
  source_id: string;
  image_consumption_ready: CertificationStatus;
  video_consumption_ready: CertificationStatus;
  runtime_mapping_consistent: CertificationStatus;
  traceability_preserved: CertificationStatus;
  cross_app_binding_consistent: CertificationStatus;
  cross_app_consumption_ready: CertificationStatus;
};

export type MovieAnalysisCrossAppConsumptionCertificationReport = {
  report_id: string;
  phase: typeof CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE;
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
  image_app_consumption_validation_report_path: typeof IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH;
  video_app_consumption_validation_report_path: typeof VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  image_app_bridge_path: typeof IMAGE_APP_BRIDGE_PATH;
  video_app_bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
  source_count: number;
  adapter_count: number;
  image_app_consumption_ready: CertificationStatus;
  video_app_consumption_ready: CertificationStatus;
  runtime_mapping_consistency: CertificationStatus;
  adapter_traceability_consistency: CertificationStatus;
  cross_app_binding_consistency: CertificationStatus;
  cross_app_consumption_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  source_audits: SourceCrossAppConsumptionAudit[];
  final_verdict:
    | typeof CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT
    | typeof CROSS_APP_CONSUMPTION_CERTIFICATION_FAIL_VERDICT;
  issues: CrossAppConsumptionCertificationIssue[];
};

function loadImageConsumptionReport(
  projectRoot: string
): MovieAnalysisImageAppConsumptionValidationReport | null {
  const abs = path.join(projectRoot, IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageAppConsumptionValidationReport;
}

function loadVideoConsumptionReport(
  projectRoot: string
): MovieAnalysisVideoAppConsumptionValidationReport | null {
  const abs = path.join(projectRoot, VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisVideoAppConsumptionValidationReport;
}

function loadImageRuntimePackage(projectRoot: string): MovieAnalysisImageRuntimePackage | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageRuntimePackage;
}

function loadVideoRuntimePackage(projectRoot: string): MovieAnalysisVideoRuntimePackage | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoRuntimePackage;
}

function loadImageBridge(projectRoot: string): MovieAnalysisImageAppBridge | null {
  const abs = path.join(projectRoot, IMAGE_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageAppBridge;
}

function loadVideoBridge(projectRoot: string): MovieAnalysisVideoAppBridge | null {
  const abs = path.join(projectRoot, VIDEO_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoAppBridge;
}

function runtimeMappingsEqual(
  imageEntry: ImageRuntimePackageEntry,
  videoEntry: VideoRuntimePackageEntry
): boolean {
  if (imageEntry.resolved_runtime_mappings.length !== videoEntry.resolved_runtime_mappings.length) {
    return false;
  }

  return imageEntry.resolved_runtime_mappings.every((imageMapping) => {
    const videoMapping = videoEntry.resolved_runtime_mappings.find(
      (mapping) =>
        mapping.binding_id === imageMapping.binding_id &&
        mapping.runtime_target === imageMapping.runtime_target
    );
    if (!videoMapping) {
      return false;
    }

    return (
      imageMapping.conflict_free === videoMapping.conflict_free &&
      JSON.stringify(imageMapping.resolved_pattern_signatures) ===
        JSON.stringify(videoMapping.resolved_pattern_signatures)
    );
  });
}

function traceabilityEqual(
  imageEntry: ImageRuntimePackageEntry,
  videoEntry: VideoRuntimePackageEntry
): boolean {
  const imageTraceability = imageEntry.adapter_traceability;
  const videoTraceability = videoEntry.traceability;

  return (
    imageTraceability.cinematic_dna_id === videoTraceability.cinematic_dna_id &&
    imageTraceability.integration_id === videoTraceability.integration_id &&
    imageTraceability.adapter_library_entry_id === videoTraceability.adapter_library_entry_id &&
    JSON.stringify(imageTraceability.adapter_ids) === JSON.stringify(videoTraceability.adapter_ids) &&
    imageTraceability.traceability_preserved === true &&
    videoTraceability.traceability_preserved === true
  );
}

function crossAppBindingConsistent(
  imageBridgeEntry: ImageAppBridgeEntry,
  videoBridgeEntry: VideoAppBridgeEntry
): boolean {
  return (
    imageBridgeEntry.source_video_id === videoBridgeEntry.source_video_id &&
    imageBridgeEntry.cinematic_dna_id === videoBridgeEntry.cinematic_dna_id &&
    imageBridgeEntry.integration_id === videoBridgeEntry.integration_id &&
    imageBridgeEntry.adapter_library_entry_id === videoBridgeEntry.adapter_library_entry_id &&
    imageBridgeEntry.release_id === videoBridgeEntry.release_id &&
    imageBridgeEntry.package_id === videoBridgeEntry.package_id &&
    JSON.stringify(imageBridgeEntry.adapter_ids) === JSON.stringify(videoBridgeEntry.adapter_ids) &&
    imageBridgeEntry.adapter_mapping.consumer_target === 'image_app' &&
    videoBridgeEntry.adapter_mapping.consumer_target === 'video_app' &&
    imageBridgeEntry.image_app_ready === true &&
    videoBridgeEntry.video_app_ready === true
  );
}

function auditSource(
  sourceId: string,
  imageConsumptionAudit: SourceImageAppConsumptionAudit | undefined,
  videoConsumptionAudit: SourceVideoAppConsumptionAudit | undefined,
  imageRuntimeEntry: ImageRuntimePackageEntry | undefined,
  videoRuntimeEntry: VideoRuntimePackageEntry | undefined,
  imageBridgeEntry: ImageAppBridgeEntry | undefined,
  videoBridgeEntry: VideoAppBridgeEntry | undefined
): SourceCrossAppConsumptionAudit {
  if (
    !imageConsumptionAudit ||
    !videoConsumptionAudit ||
    !imageRuntimeEntry ||
    !videoRuntimeEntry ||
    !imageBridgeEntry ||
    !videoBridgeEntry
  ) {
    return {
      source_id: sourceId,
      image_consumption_ready: 'FAIL',
      video_consumption_ready: 'FAIL',
      runtime_mapping_consistent: 'FAIL',
      traceability_preserved: 'FAIL',
      cross_app_binding_consistent: 'FAIL',
      cross_app_consumption_ready: 'FAIL',
    };
  }

  const imageConsumptionReady =
    imageConsumptionAudit.source_consumption_ready === 'PASS' ? 'PASS' : 'FAIL';
  const videoConsumptionReady =
    videoConsumptionAudit.source_consumption_ready === 'PASS' ? 'PASS' : 'FAIL';

  const runtimeMappingConsistent = runtimeMappingsEqual(imageRuntimeEntry, videoRuntimeEntry)
    ? 'PASS'
    : 'FAIL';

  const traceabilityPreserved =
    traceabilityEqual(imageRuntimeEntry, videoRuntimeEntry) &&
    imageConsumptionAudit.traceability_preserved === 'PASS' &&
    videoConsumptionAudit.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const bindingConsistent = crossAppBindingConsistent(imageBridgeEntry, videoBridgeEntry)
    ? 'PASS'
    : 'FAIL';

  const crossAppConsumptionReady =
    imageConsumptionReady === 'PASS' &&
    videoConsumptionReady === 'PASS' &&
    runtimeMappingConsistent === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    bindingConsistent === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_id: sourceId,
    image_consumption_ready: imageConsumptionReady,
    video_consumption_ready: videoConsumptionReady,
    runtime_mapping_consistent: runtimeMappingConsistent,
    traceability_preserved: traceabilityPreserved,
    cross_app_binding_consistent: bindingConsistent,
    cross_app_consumption_ready: crossAppConsumptionReady,
  };
}

function aggregateStatus(
  audits: SourceCrossAppConsumptionAudit[],
  field: keyof SourceCrossAppConsumptionAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisCrossAppConsumptionCertificationReport): string {
  const lines = [
    '# Movie Analysis Cross App Consumption Certification',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Certification Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Consumption Chain',
    '',
    `${IMAGE_APP_CONSUMPTION_VALIDATION_DIR} ↔ ${VIDEO_APP_CONSUMPTION_VALIDATION_DIR}`,
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_app_consumption_ready | ${report.image_app_consumption_ready} |`,
    `| video_app_consumption_ready | ${report.video_app_consumption_ready} |`,
    `| runtime_mapping_consistency | ${report.runtime_mapping_consistency} |`,
    `| adapter_traceability_consistency | ${report.adapter_traceability_consistency} |`,
    `| cross_app_binding_consistency | ${report.cross_app_binding_consistency} |`,
    `| cross_app_consumption_certification_ready | ${report.cross_app_consumption_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- image_consumption_ready: ${audit.image_consumption_ready}`,
      `- video_consumption_ready: ${audit.video_consumption_ready}`,
      `- runtime_mapping_consistent: ${audit.runtime_mapping_consistent}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- cross_app_binding_consistent: ${audit.cross_app_binding_consistent}`,
      `- cross_app_consumption_ready: ${audit.cross_app_consumption_ready}`,
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
  issues: CrossAppConsumptionCertificationIssue[]
): MovieAnalysisCrossAppConsumptionCertificationReport {
  const report: MovieAnalysisCrossAppConsumptionCertificationReport = {
    report_id: 'movie-analysis-cross-app-consumption-certification-report-v1',
    phase: CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE,
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
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_app_consumption_validation_report_path: VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    image_app_bridge_path: IMAGE_APP_BRIDGE_PATH,
    video_app_bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count: 0,
    adapter_count: 0,
    image_app_consumption_ready: 'FAIL',
    video_app_consumption_ready: 'FAIL',
    runtime_mapping_consistency: 'FAIL',
    adapter_traceability_consistency: 'FAIL',
    cross_app_binding_consistency: 'FAIL',
    cross_app_consumption_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    source_audits: [],
    final_verdict: CROSS_APP_CONSUMPTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisCrossAppConsumptionCertification(
  projectRoot?: string
): MovieAnalysisCrossAppConsumptionCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: CrossAppConsumptionCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageConsumptionDir = path.join(root, IMAGE_APP_CONSUMPTION_VALIDATION_DIR);
  const videoConsumptionDir = path.join(root, VIDEO_APP_CONSUMPTION_VALIDATION_DIR);

  if (!fs.existsSync(imageConsumptionDir)) {
    issues.push({
      code: 'IMAGE_CONSUMPTION_DIR_MISSING',
      message: `Missing ${IMAGE_APP_CONSUMPTION_VALIDATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (!fs.existsSync(videoConsumptionDir)) {
    issues.push({
      code: 'VIDEO_CONSUMPTION_DIR_MISSING',
      message: `Missing ${VIDEO_APP_CONSUMPTION_VALIDATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const imageConsumptionReport = loadImageConsumptionReport(root);
  if (!imageConsumptionReport) {
    issues.push({
      code: 'IMAGE_CONSUMPTION_REPORT_MISSING',
      message: `Missing ${IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imageConsumptionReport.final_verdict !== IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2B_001_NOT_PASS',
      message: `Image app consumption must have ${IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const videoConsumptionReport = loadVideoConsumptionReport(root);
  if (!videoConsumptionReport) {
    issues.push({
      code: 'VIDEO_CONSUMPTION_REPORT_MISSING',
      message: `Missing ${VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (videoConsumptionReport.final_verdict !== VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT) {
    issues.push({
      code: 'LEVEL2B_002_NOT_PASS',
      message: `Video app consumption must have ${VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageRuntimePackage = loadImageRuntimePackage(root);
  const videoRuntimePackage = loadVideoRuntimePackage(root);
  const imageBridge = loadImageBridge(root);
  const videoBridge = loadVideoBridge(root);

  if (!imageRuntimePackage || !videoRuntimePackage || !imageBridge || !videoBridge) {
    issues.push({
      code: 'CROSS_APP_INPUT_MISSING',
      message: 'Missing runtime packages or app bridges for cross-app certification',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceCrossAppConsumptionAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const audit = auditSource(
      sourceId,
      imageConsumptionReport.source_audits.find((entry) => entry.source_video_id === sourceId),
      videoConsumptionReport.source_audits.find((entry) => entry.source_id === sourceId),
      imageRuntimePackage.entries.find((entry) => entry.source_video_id === sourceId),
      videoRuntimePackage.entries.find((entry) => entry.source_id === sourceId),
      imageBridge.entries.find((entry) => entry.source_video_id === sourceId),
      videoBridge.entries.find((entry) => entry.source_video_id === sourceId)
    );
    sourceAudits.push(audit);

    if (audit.cross_app_consumption_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_CROSS_APP_CONSUMPTION_NOT_READY',
        message: `Cross app consumption certification failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const imageAppConsumptionReady: CertificationStatus =
    imageConsumptionReport.image_app_consumption_ready === 'PASS' &&
    imageConsumptionReport.final_verdict === IMAGE_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const videoAppConsumptionReady: CertificationStatus =
    videoConsumptionReport.video_app_consumption_ready === 'PASS' &&
    videoConsumptionReport.final_verdict === VIDEO_APP_CONSUMPTION_VALIDATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingConsistency = aggregateStatus(sourceAudits, 'runtime_mapping_consistent');
  const adapterTraceabilityConsistency = aggregateStatus(sourceAudits, 'traceability_preserved');
  const crossAppBindingConsistency = aggregateStatus(
    sourceAudits,
    'cross_app_binding_consistent'
  );

  const gateChecks: CertificationStatus[] = [
    imageAppConsumptionReady,
    videoAppConsumptionReady,
    runtimeMappingConsistency,
    adapterTraceabilityConsistency,
    crossAppBindingConsistency,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'CROSS_APP_CERTIFICATION_VALIDATION_FAIL',
        message: 'Cross app consumption certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const safetyValid =
    imageConsumptionReport.planning_only === true &&
    imageConsumptionReport.planning_only_status === 'PASS' &&
    imageConsumptionReport.generation === false &&
    videoConsumptionReport.planning_only === true &&
    videoConsumptionReport.planning_only_status === 'PASS' &&
    videoConsumptionReport.generation === false &&
    imageRuntimePackage.safety_summary.planning_only === true &&
    imageRuntimePackage.safety_summary.generation === false &&
    videoRuntimePackage.safety_summary.planning_only === true &&
    videoRuntimePackage.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: CertificationStatus = safetyValid ? 'PASS' : 'FAIL';

  const sourceCount = imageConsumptionReport.source_count;
  const adapterCount = imageConsumptionReport.adapter_count;

  if (
    sourceCount !== EXPECTED_SOURCE_COUNT ||
    videoConsumptionReport.source_count !== EXPECTED_SOURCE_COUNT
  ) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (
    adapterCount !== EXPECTED_ADAPTER_COUNT ||
    videoConsumptionReport.adapter_count !== EXPECTED_ADAPTER_COUNT
  ) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const crossAppConsumptionCertificationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    videoConsumptionReport.source_count === EXPECTED_SOURCE_COUNT &&
    videoConsumptionReport.adapter_count === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.cross_app_consumption_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = crossAppConsumptionCertificationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'CROSS_APP_CERTIFICATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'CROSS_APP_CONSUMPTION_NOT_READY',
      message: 'Cross app consumption certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisCrossAppConsumptionCertificationReport = {
    report_id: 'movie-analysis-cross-app-consumption-certification-report-v1',
    phase: CROSS_APP_CONSUMPTION_CERTIFICATION_PHASE,
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
    image_app_consumption_validation_report_path: IMAGE_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    video_app_consumption_validation_report_path: VIDEO_APP_CONSUMPTION_VALIDATION_REPORT_PATH,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    image_app_bridge_path: IMAGE_APP_BRIDGE_PATH,
    video_app_bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_app_consumption_ready: imageAppConsumptionReady,
    video_app_consumption_ready: videoAppConsumptionReady,
    runtime_mapping_consistency: runtimeMappingConsistency,
    adapter_traceability_consistency: adapterTraceabilityConsistency,
    cross_app_binding_consistency: crossAppBindingConsistency,
    cross_app_consumption_certification_ready: crossAppConsumptionCertificationReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CROSS_APP_CONSUMPTION_CERTIFICATION_PASS_VERDICT
      : CROSS_APP_CONSUMPTION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CROSS_APP_CONSUMPTION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
