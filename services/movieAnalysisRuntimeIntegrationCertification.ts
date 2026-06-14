import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_RUNTIME_PACKAGE_PASS_VERDICT,
  IMAGE_RUNTIME_PACKAGE_PATH,
  IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
  type AdapterTraceability as ImageAdapterTraceability,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
  type MovieAnalysisImageRuntimePackageReport,
} from './movieAnalysisImageRuntimePackage.js';
import {
  VIDEO_RUNTIME_PACKAGE_PASS_VERDICT,
  VIDEO_RUNTIME_PACKAGE_PATH,
  VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
  type AdapterTraceability as VideoAdapterTraceability,
  type MovieAnalysisVideoRuntimePackage,
  type MovieAnalysisVideoRuntimePackageReport,
  type VideoRuntimeBlock,
  type VideoRuntimePackageEntry,
} from './movieAnalysisVideoRuntimePackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RUNTIME_INTEGRATION_CERTIFICATION_PHASE =
  'PHASE-LEVEL2-008-MOVIE_ANALYSIS_RUNTIME_INTEGRATION_CERTIFICATION_V1' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_RUNTIME_INTEGRATION_CERTIFICATION_V1' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_RUNTIME_INTEGRATION_CERTIFICATION_V1' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_DIR =
  'reports/movie_analysis_runtime_integration_certification' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH =
  'reports/movie_analysis_runtime_integration_certification/movie-analysis-runtime-integration-certification-report.json' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_MD_PATH =
  'reports/movie_analysis_runtime_integration_certification/MOVIE_ANALYSIS_RUNTIME_INTEGRATION_CERTIFICATION.md' as const;
export const RUNTIME_INTEGRATION_CERTIFICATION_STATUS_MESSAGE =
  'MOVIE_ANALYSIS_RUNTIME_INTEGRATION_READY' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type CertificationStatus = 'PASS' | 'FAIL';

export type RuntimeIntegrationCertificationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_id?: string;
};

export type SourceRuntimeIntegrationAudit = {
  source_id: string;
  shared_runtime_mappings: CertificationStatus;
  shared_traceability: CertificationStatus;
  cross_runtime_consistent: CertificationStatus;
  source_integration_ready: CertificationStatus;
};

export type MovieAnalysisRuntimeIntegrationCertificationReport = {
  report_id: string;
  phase: typeof RUNTIME_INTEGRATION_CERTIFICATION_PHASE;
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
  image_runtime_package_report_path: typeof IMAGE_RUNTIME_PACKAGE_REPORT_PATH;
  video_runtime_package_report_path: typeof VIDEO_RUNTIME_PACKAGE_REPORT_PATH;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  video_runtime_package_path: typeof VIDEO_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  image_runtime_package_ready: CertificationStatus;
  video_runtime_package_ready: CertificationStatus;
  runtime_mapping_preserved: CertificationStatus;
  adapter_traceability_preserved: CertificationStatus;
  cross_runtime_consistency: CertificationStatus;
  runtime_integration_certification_ready: CertificationStatus;
  planning_only_status: CertificationStatus;
  certification_status: typeof RUNTIME_INTEGRATION_CERTIFICATION_STATUS_MESSAGE | null;
  source_audits: SourceRuntimeIntegrationAudit[];
  final_verdict:
    | typeof RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT
    | typeof RUNTIME_INTEGRATION_CERTIFICATION_FAIL_VERDICT;
  issues: RuntimeIntegrationCertificationIssue[];
};

const VIDEO_RUNTIME_BLOCKS = [
  'scene_runtime',
  'camera_runtime',
  'emotion_runtime',
  'transition_runtime',
  'continuity_runtime',
  'storytelling_runtime',
] as const;

function loadImageRuntimeReport(
  projectRoot: string
): MovieAnalysisImageRuntimePackageReport | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisImageRuntimePackageReport;
}

function loadVideoRuntimeReport(
  projectRoot: string
): MovieAnalysisVideoRuntimePackageReport | null {
  const abs = path.join(projectRoot, VIDEO_RUNTIME_PACKAGE_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisVideoRuntimePackageReport;
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

function traceabilityEqual(
  imageTraceability: ImageAdapterTraceability,
  videoTraceability: VideoAdapterTraceability
): boolean {
  return (
    imageTraceability.cinematic_dna_id === videoTraceability.cinematic_dna_id &&
    imageTraceability.integration_id === videoTraceability.integration_id &&
    imageTraceability.adapter_library_entry_id ===
      videoTraceability.adapter_library_entry_id &&
    JSON.stringify(imageTraceability.adapter_ids) ===
      JSON.stringify(videoTraceability.adapter_ids) &&
    imageTraceability.traceability_preserved === true &&
    videoTraceability.traceability_preserved === true
  );
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

function videoRuntimeBindingsConsistent(videoEntry: VideoRuntimePackageEntry): boolean {
  const blocks = VIDEO_RUNTIME_BLOCKS.map(
    (key) => videoEntry.video_runtime_package[key] as VideoRuntimeBlock
  );

  return blocks.every((block) =>
    videoEntry.resolved_runtime_mappings.some(
      (mapping) =>
        mapping.binding_id === block.binding_id &&
        mapping.runtime_target === block.runtime_target &&
        JSON.stringify(mapping.resolved_pattern_signatures) ===
          JSON.stringify(block.resolved_pattern_signatures)
    )
  );
}

function auditSourceIntegration(
  imageEntry: ImageRuntimePackageEntry | undefined,
  videoEntry: VideoRuntimePackageEntry | undefined,
  sourceId: string
): SourceRuntimeIntegrationAudit {
  if (!imageEntry || !videoEntry) {
    return {
      source_id: sourceId,
      shared_runtime_mappings: 'FAIL',
      shared_traceability: 'FAIL',
      cross_runtime_consistent: 'FAIL',
      source_integration_ready: 'FAIL',
    };
  }

  const sharedRuntimeMappings = runtimeMappingsEqual(imageEntry, videoEntry) ? 'PASS' : 'FAIL';
  const sharedTraceability = traceabilityEqual(
    imageEntry.adapter_traceability,
    videoEntry.traceability
  )
    ? 'PASS'
    : 'FAIL';

  const crossRuntimeConsistent =
    imageEntry.source_video_id === videoEntry.source_id &&
    sharedRuntimeMappings === 'PASS' &&
    sharedTraceability === 'PASS' &&
    videoRuntimeBindingsConsistent(videoEntry) &&
    imageEntry.planning_only === true &&
    videoEntry.planning_only === true &&
    imageEntry.generation === false &&
    videoEntry.generation === false &&
    imageEntry.bridge_only === true &&
    videoEntry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  return {
    source_id: sourceId,
    shared_runtime_mappings: sharedRuntimeMappings,
    shared_traceability: sharedTraceability,
    cross_runtime_consistent: crossRuntimeConsistent,
    source_integration_ready: crossRuntimeConsistent === 'PASS' ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRuntimeIntegrationAudit[],
  field: keyof SourceRuntimeIntegrationAudit
): CertificationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRuntimeIntegrationCertificationReport): string {
  const lines = [
    '# Movie Analysis Runtime Integration Certification',
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
    '## Integration Chain',
    '',
    'Image Runtime Package (L2-006) ↔ Video Runtime Package (L2-007)',
    '',
    '## Certification Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_runtime_package_ready | ${report.image_runtime_package_ready} |`,
    `| video_runtime_package_ready | ${report.video_runtime_package_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| adapter_traceability_preserved | ${report.adapter_traceability_preserved} |`,
    `| cross_runtime_consistency | ${report.cross_runtime_consistency} |`,
    `| runtime_integration_certification_ready | ${report.runtime_integration_certification_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Integration Audits',
    ''
  );

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_id}`,
      '',
      `- shared_runtime_mappings: ${audit.shared_runtime_mappings}`,
      `- shared_traceability: ${audit.shared_traceability}`,
      `- cross_runtime_consistent: ${audit.cross_runtime_consistent}`,
      `- source_integration_ready: ${audit.source_integration_ready}`,
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
  issues: RuntimeIntegrationCertificationIssue[]
): MovieAnalysisRuntimeIntegrationCertificationReport {
  const report: MovieAnalysisRuntimeIntegrationCertificationReport = {
    report_id: 'movie-analysis-runtime-integration-certification-report-v1',
    phase: RUNTIME_INTEGRATION_CERTIFICATION_PHASE,
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
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    video_runtime_package_report_path: VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    image_runtime_package_ready: 'FAIL',
    video_runtime_package_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    adapter_traceability_preserved: 'FAIL',
    cross_runtime_consistency: 'FAIL',
    runtime_integration_certification_ready: 'FAIL',
    planning_only_status: 'FAIL',
    certification_status: null,
    source_audits: [],
    final_verdict: RUNTIME_INTEGRATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRuntimeIntegrationCertification(
  projectRoot?: string
): MovieAnalysisRuntimeIntegrationCertificationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RuntimeIntegrationCertificationIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageRuntimeReport = loadImageRuntimeReport(root);
  if (!imageRuntimeReport) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_REPORT_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (imageRuntimeReport.final_verdict !== IMAGE_RUNTIME_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_NOT_PASS',
      message: `Image runtime package must have ${IMAGE_RUNTIME_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const videoRuntimeReport = loadVideoRuntimeReport(root);
  if (!videoRuntimeReport) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_REPORT_MISSING',
      message: `Missing ${VIDEO_RUNTIME_PACKAGE_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (videoRuntimeReport.final_verdict !== VIDEO_RUNTIME_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'VIDEO_RUNTIME_PACKAGE_NOT_PASS',
      message: `Video runtime package must have ${VIDEO_RUNTIME_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const imageRuntimePackage = loadImageRuntimePackage(root);
  const videoRuntimePackage = loadVideoRuntimePackage(root);

  if (!imageRuntimePackage || !videoRuntimePackage) {
    issues.push({
      code: 'RUNTIME_PACKAGE_EXPORT_MISSING',
      message: 'Missing image or video runtime package export',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sourceAudits: SourceRuntimeIntegrationAudit[] = [];

  for (const sourceId of EXPECTED_SOURCE_VIDEO_IDS) {
    const imageEntry = imageRuntimePackage.entries.find(
      (entry) => entry.source_video_id === sourceId
    );
    const videoEntry = videoRuntimePackage.entries.find((entry) => entry.source_id === sourceId);
    const audit = auditSourceIntegration(imageEntry, videoEntry, sourceId);
    sourceAudits.push(audit);

    if (audit.source_integration_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_INTEGRATION_NOT_READY',
        message: `Runtime integration failed for ${sourceId}`,
        severity: 'error',
        source_id: sourceId,
      });
    }
  }

  const imageRuntimePackageReady: CertificationStatus =
    imageRuntimeReport.image_runtime_package_ready === 'PASS' &&
    imageRuntimeReport.final_verdict === IMAGE_RUNTIME_PACKAGE_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const videoRuntimePackageReady: CertificationStatus =
    videoRuntimeReport.video_runtime_package_ready === 'PASS' &&
    videoRuntimeReport.final_verdict === VIDEO_RUNTIME_PACKAGE_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: CertificationStatus =
    imageRuntimeReport.runtime_mapping_preserved === 'PASS' &&
    videoRuntimeReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const adapterTraceabilityPreserved: CertificationStatus =
    imageRuntimeReport.adapter_traceability_preserved === 'PASS' &&
    videoRuntimeReport.adapter_traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const crossRuntimeConsistency = aggregateStatus(sourceAudits, 'cross_runtime_consistent');

  const safetyValid =
    imageRuntimeReport.planning_only === true &&
    imageRuntimeReport.planning_only_status === 'PASS' &&
    imageRuntimeReport.generation === false &&
    videoRuntimeReport.planning_only === true &&
    videoRuntimeReport.planning_only_status === 'PASS' &&
    videoRuntimeReport.generation === false &&
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

  const sourceCount =
    imageRuntimePackage.source_count === videoRuntimePackage.source_count
      ? imageRuntimePackage.source_count
      : 0;
  const adapterCount =
    imageRuntimePackage.adapter_count === videoRuntimePackage.adapter_count
      ? imageRuntimePackage.adapter_count
      : 0;

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

  const gateChecks: CertificationStatus[] = [
    imageRuntimePackageReady,
    videoRuntimePackageReady,
    runtimeMappingPreserved,
    adapterTraceabilityPreserved,
    crossRuntimeConsistency,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'INTEGRATION_VALIDATION_FAIL',
        message: 'Runtime integration certification validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const integrationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    imageRuntimePackage.entries.length === EXPECTED_SOURCE_COUNT &&
    videoRuntimePackage.entries.length === EXPECTED_SOURCE_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_integration_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = integrationReady === 'PASS';

  if (!pass && !issues.some((issue) => issue.code === 'INTEGRATION_VALIDATION_FAIL')) {
    issues.push({
      code: 'RUNTIME_INTEGRATION_NOT_READY',
      message: 'Runtime integration certification is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRuntimeIntegrationCertificationReport = {
    report_id: 'movie-analysis-runtime-integration-certification-report-v1',
    phase: RUNTIME_INTEGRATION_CERTIFICATION_PHASE,
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
    image_runtime_package_report_path: IMAGE_RUNTIME_PACKAGE_REPORT_PATH,
    video_runtime_package_report_path: VIDEO_RUNTIME_PACKAGE_REPORT_PATH,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    video_runtime_package_path: VIDEO_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_runtime_package_ready: imageRuntimePackageReady,
    video_runtime_package_ready: videoRuntimePackageReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    adapter_traceability_preserved: adapterTraceabilityPreserved,
    cross_runtime_consistency: crossRuntimeConsistency,
    runtime_integration_certification_ready: integrationReady,
    planning_only_status: planningOnlyStatus,
    certification_status: pass ? RUNTIME_INTEGRATION_CERTIFICATION_STATUS_MESSAGE : null,
    source_audits: sourceAudits,
    final_verdict: pass
      ? RUNTIME_INTEGRATION_CERTIFICATION_PASS_VERDICT
      : RUNTIME_INTEGRATION_CERTIFICATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RUNTIME_INTEGRATION_CERTIFICATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
