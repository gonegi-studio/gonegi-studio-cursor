import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  DNA_CONSUMER_BRIDGE_PASS_VERDICT,
  DNA_CONSUMER_BRIDGE_REPORT_PATH,
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaImageBridgeEntry,
  type DnaVideoBridgeEntry,
  loadMovieAnalysisDnaImageBridge,
  loadMovieAnalysisDnaVideoBridge,
} from './movieAnalysisDnaConsumerBridge.js';
import { DNA_PACKAGE_PATH, loadMovieAnalysisDnaPackage } from './movieAnalysisDnaPackaging.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DNA_CONSUMER_IMPORT_TEST_PHASE =
  'PHASE-SOURCE-VIDEO-061-MOVIE_ANALYSIS_DNA_CONSUMER_IMPORT_TEST_V1' as const;
export const DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DNA_CONSUMER_IMPORT_TEST_V1' as const;
export const DNA_CONSUMER_IMPORT_TEST_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DNA_CONSUMER_IMPORT_TEST_V1' as const;
export const DNA_CONSUMER_IMPORT_TEST_REPORT_PATH =
  'reports/movie-analysis-dna-consumer-import-test-report.json' as const;
export const DNA_CONSUMER_IMPORT_TEST_MD_PATH =
  'reports/MOVIE_ANALYSIS_DNA_CONSUMER_IMPORT_TEST.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaConsumerImportTestIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaImportAudit = {
  source_video_id: string;
  image_importable: ValidationStatus;
  video_importable: ValidationStatus;
  mapping_integrity: ValidationStatus;
  traceability_integrity: ValidationStatus;
  import_ready: ValidationStatus;
};

export type MovieAnalysisDnaConsumerImportTestReport = {
  report_id: string;
  phase: typeof DNA_CONSUMER_IMPORT_TEST_PHASE;
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
  image_bridge_path: typeof DNA_IMAGE_BRIDGE_PATH;
  video_bridge_path: typeof DNA_VIDEO_BRIDGE_PATH;
  image_importable: ValidationStatus;
  video_importable: ValidationStatus;
  mapping_integrity: ValidationStatus;
  traceability_integrity: ValidationStatus;
  consumer_import_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceDnaImportAudit[];
  final_verdict:
    | typeof DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT
    | typeof DNA_CONSUMER_IMPORT_TEST_FAIL_VERDICT;
  issues: DnaConsumerImportTestIssue[];
};

const IMAGE_BRIDGE_ENTRY_FIELDS = [
  'source_video_id',
  'cinematic_dna_id',
  'integration_id',
  'adapter_library_entry_id',
  'package_id',
  'emotion_adapter',
  'character_pattern_refs',
  'adapter_mapping',
  'consumer_ready',
  'bridge_only',
] as const;

const VIDEO_BRIDGE_ENTRY_FIELDS = [
  'source_video_id',
  'cinematic_dna_id',
  'integration_id',
  'adapter_library_entry_id',
  'package_id',
  'scene_adapter',
  'camera_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
  'adapter_mapping',
  'consumer_ready',
  'bridge_only',
] as const;

function mappingsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function simulateImageBridgeImport(entry: DnaImageBridgeEntry): boolean {
  const record = entry as unknown as Record<string, unknown>;
  if (!IMAGE_BRIDGE_ENTRY_FIELDS.every((field) => field in record)) {
    return false;
  }

  return (
    entry.consumer_ready === true &&
    entry.bridge_only === true &&
    entry.emotion_adapter.adapter_ready === true &&
    entry.emotion_adapter.pattern_count > 0 &&
    entry.adapter_mapping.consumer_target === 'image_app' &&
    entry.adapter_mapping.adapter_ready === true &&
    entry.adapter_mapping.emotion_adapter === true &&
    entry.character_pattern_refs.length > 0
  );
}

function simulateVideoBridgeImport(entry: DnaVideoBridgeEntry): boolean {
  const record = entry as unknown as Record<string, unknown>;
  if (!VIDEO_BRIDGE_ENTRY_FIELDS.every((field) => field in record)) {
    return false;
  }

  return (
    entry.consumer_ready === true &&
    entry.bridge_only === true &&
    entry.scene_adapter.adapter_ready === true &&
    entry.camera_adapter.adapter_ready === true &&
    entry.transition_adapter.adapter_ready === true &&
    entry.continuity_adapter.adapter_ready === true &&
    entry.storytelling_adapter.adapter_ready === true &&
    entry.adapter_mapping.consumer_target === 'video_app' &&
    entry.adapter_mapping.adapter_ready === true &&
    entry.adapter_mapping.scene_adapter === true &&
    entry.adapter_mapping.camera_adapter === true &&
    entry.adapter_mapping.transition_adapter === true &&
    entry.adapter_mapping.continuity_adapter === true &&
    entry.adapter_mapping.storytelling_adapter === true
  );
}

function isMappingIntegrityValid(
  imageEntry: DnaImageBridgeEntry,
  videoEntry: DnaVideoBridgeEntry,
  libraryEntry: DnaAdapterLibraryEntry
): boolean {
  return (
    mappingsEqual(imageEntry.emotion_adapter, libraryEntry.emotion_adapter) &&
    mappingsEqual(imageEntry.adapter_mapping, libraryEntry.image_adapter_mapping) &&
    mappingsEqual(imageEntry.character_pattern_refs, libraryEntry.image_adapter_mapping.character_pattern_refs) &&
    mappingsEqual(videoEntry.scene_adapter, libraryEntry.scene_adapter) &&
    mappingsEqual(videoEntry.camera_adapter, libraryEntry.camera_adapter) &&
    mappingsEqual(videoEntry.transition_adapter, libraryEntry.transition_adapter) &&
    mappingsEqual(videoEntry.continuity_adapter, libraryEntry.continuity_adapter) &&
    mappingsEqual(videoEntry.storytelling_adapter, libraryEntry.storytelling_adapter) &&
    mappingsEqual(videoEntry.adapter_mapping, libraryEntry.video_adapter_mapping)
  );
}

function isTraceabilityIntegrityValid(
  imageEntry: DnaImageBridgeEntry,
  videoEntry: DnaVideoBridgeEntry,
  libraryEntry: DnaAdapterLibraryEntry,
  packageSource: {
    cinematic_dna_id: string;
    integration_id: string;
    adapter_library_entry_id: string;
  },
  packageId: string
): boolean {
  return (
    imageEntry.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    imageEntry.cinematic_dna_id === packageSource.cinematic_dna_id &&
    imageEntry.integration_id === libraryEntry.integration_id &&
    imageEntry.integration_id === packageSource.integration_id &&
    imageEntry.adapter_library_entry_id === libraryEntry.adapter_library_entry_id &&
    imageEntry.adapter_library_entry_id === packageSource.adapter_library_entry_id &&
    imageEntry.package_id === packageId &&
    videoEntry.cinematic_dna_id === imageEntry.cinematic_dna_id &&
    videoEntry.integration_id === imageEntry.integration_id &&
    videoEntry.adapter_library_entry_id === imageEntry.adapter_library_entry_id &&
    videoEntry.package_id === imageEntry.package_id
  );
}

function auditSource(
  imageEntry: DnaImageBridgeEntry | undefined,
  videoEntry: DnaVideoBridgeEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  packageSource:
    | {
        cinematic_dna_id: string;
        integration_id: string;
        adapter_library_entry_id: string;
      }
    | undefined,
  packageId: string
): SourceDnaImportAudit {
  const sourceVideoId =
    imageEntry?.source_video_id ?? videoEntry?.source_video_id ?? 'UNKNOWN';

  if (!imageEntry || !videoEntry || !libraryEntry || !packageSource) {
    return {
      source_video_id: sourceVideoId,
      image_importable: 'FAIL',
      video_importable: 'FAIL',
      mapping_integrity: 'FAIL',
      traceability_integrity: 'FAIL',
      import_ready: 'FAIL',
    };
  }

  const imageImportable = simulateImageBridgeImport(imageEntry) ? 'PASS' : 'FAIL';
  const videoImportable = simulateVideoBridgeImport(videoEntry) ? 'PASS' : 'FAIL';
  const mappingIntegrity = isMappingIntegrityValid(imageEntry, videoEntry, libraryEntry)
    ? 'PASS'
    : 'FAIL';
  const traceabilityIntegrity = isTraceabilityIntegrityValid(
    imageEntry,
    videoEntry,
    libraryEntry,
    packageSource,
    packageId
  )
    ? 'PASS'
    : 'FAIL';

  const importReady =
    imageImportable === 'PASS' &&
    videoImportable === 'PASS' &&
    mappingIntegrity === 'PASS' &&
    traceabilityIntegrity === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    image_importable: imageImportable,
    video_importable: videoImportable,
    mapping_integrity: mappingIntegrity,
    traceability_integrity: traceabilityIntegrity,
    import_ready: importReady,
  };
}

function aggregateStatus(
  audits: SourceDnaImportAudit[],
  field: keyof SourceDnaImportAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisDnaConsumerImportTestReport): string {
  const lines = [
    '# Movie Analysis DNA Consumer Import Test',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Import Test Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| runtime_execution | ${report.runtime_execution} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Import Test Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| image_importable | ${report.image_importable} |`,
    `| video_importable | ${report.video_importable} |`,
    `| mapping_integrity | ${report.mapping_integrity} |`,
    `| traceability_integrity | ${report.traceability_integrity} |`,
    `| consumer_import_ready | ${report.consumer_import_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Import Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- image_importable: ${audit.image_importable}`,
      `- video_importable: ${audit.video_importable}`,
      `- mapping_integrity: ${audit.mapping_integrity}`,
      `- traceability_integrity: ${audit.traceability_integrity}`,
      `- import_ready: ${audit.import_ready}`,
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

export function writeMovieAnalysisDnaConsumerImportTestReport(
  projectRoot?: string
): MovieAnalysisDnaConsumerImportTestReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaConsumerImportTestIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageBridge = loadMovieAnalysisDnaImageBridge(root);
  const videoBridge = loadMovieAnalysisDnaVideoBridge(root);
  const dnaPackage = loadMovieAnalysisDnaPackage(root);
  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);

  if (!imageBridge) {
    issues.push({
      code: 'IMAGE_BRIDGE_MISSING',
      message: `Missing ${DNA_IMAGE_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  if (!videoBridge) {
    issues.push({
      code: 'VIDEO_BRIDGE_MISSING',
      message: `Missing ${DNA_VIDEO_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const bridgeReportPath = path.join(root, DNA_CONSUMER_BRIDGE_REPORT_PATH);
  if (fs.existsSync(bridgeReportPath)) {
    const bridgeReport = JSON.parse(fs.readFileSync(bridgeReportPath, 'utf8')) as {
      final_verdict?: string;
      consumer_ready?: string;
    };
    if (bridgeReport.final_verdict !== DNA_CONSUMER_BRIDGE_PASS_VERDICT) {
      issues.push({
        code: 'CONSUMER_BRIDGE_NOT_PASS',
        message: `Consumer bridge must have ${DNA_CONSUMER_BRIDGE_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!dnaPackage) {
    issues.push({
      code: 'DNA_PACKAGE_MISSING',
      message: `Missing ${DNA_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  if (!adapterLibrary) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceDnaImportAudit[] = [];

  if (imageBridge && videoBridge && dnaPackage && adapterLibrary) {
    if (imageBridge.consumer_target !== 'image_app') {
      issues.push({
        code: 'IMAGE_BRIDGE_TARGET_INVALID',
        message: 'Image bridge consumer_target must be image_app',
        severity: 'error',
      });
    }

    if (videoBridge.consumer_target !== 'video_app') {
      issues.push({
        code: 'VIDEO_BRIDGE_TARGET_INVALID',
        message: 'Video bridge consumer_target must be video_app',
        severity: 'error',
      });
    }

    if (imageBridge.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'IMAGE_SOURCE_COUNT_MISMATCH',
        message: `Image bridge expected source_count=${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (videoBridge.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'VIDEO_SOURCE_COUNT_MISMATCH',
        message: `Video bridge expected source_count=${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (imageBridge.package_id !== dnaPackage.package_id) {
      issues.push({
        code: 'PACKAGE_ID_MISMATCH',
        message: 'Image bridge package_id does not match DNA package',
        severity: 'error',
      });
    }

    for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
      const imageEntry = imageBridge.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const videoEntry = videoBridge.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const libraryEntry = adapterLibrary.entries.find(
        (entry) => entry.source_video_id === sourceVideoId
      );
      const packageSource = dnaPackage.sources.find(
        (source) => source.source_video_id === sourceVideoId
      );

      if (!imageEntry || !videoEntry || !libraryEntry || !packageSource) {
        issues.push({
          code: 'SOURCE_IMPORT_COMPONENTS_MISSING',
          message: `Missing import components for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const audit = auditSource(
        imageEntry,
        videoEntry,
        libraryEntry,
        packageSource,
        dnaPackage.package_id
      );
      sourceAudits.push(audit);

      if (audit.import_ready === 'FAIL') {
        issues.push({
          code: 'SOURCE_IMPORT_NOT_READY',
          message: `DNA consumer import not ready for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
      }
    }
  }

  const safetyValid =
    imageBridge?.safety_summary.planning_only === true &&
    imageBridge.safety_summary.generation === false &&
    imageBridge.safety_summary.runtime_execution === false &&
    videoBridge?.safety_summary.planning_only === true &&
    videoBridge.safety_summary.generation === false &&
    videoBridge.safety_summary.runtime_execution === false;

  if ((imageBridge || videoBridge) && !safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Bridge safety planning_only validation failed',
      severity: 'error',
    });
  }

  const imageImportable = aggregateStatus(sourceAudits, 'image_importable');
  const videoImportable = aggregateStatus(sourceAudits, 'video_importable');
  const mappingIntegrity = aggregateStatus(sourceAudits, 'mapping_integrity');
  const traceabilityIntegrity = aggregateStatus(sourceAudits, 'traceability_integrity');
  const consumerImportReady = aggregateStatus(sourceAudits, 'import_ready');
  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const pass =
    imageBridge !== null &&
    videoBridge !== null &&
    dnaPackage !== null &&
    adapterLibrary !== null &&
    imageBridge.source_count === EXPECTED_SOURCE_COUNT &&
    videoBridge.source_count === EXPECTED_SOURCE_COUNT &&
    imageImportable === 'PASS' &&
    videoImportable === 'PASS' &&
    mappingIntegrity === 'PASS' &&
    traceabilityIntegrity === 'PASS' &&
    consumerImportReady === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaConsumerImportTestReport = {
    report_id: 'movie-analysis-dna-consumer-import-test-report-v1',
    phase: DNA_CONSUMER_IMPORT_TEST_PHASE,
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
    source_count: imageBridge?.source_count ?? 0,
    image_bridge_path: DNA_IMAGE_BRIDGE_PATH,
    video_bridge_path: DNA_VIDEO_BRIDGE_PATH,
    image_importable: imageImportable,
    video_importable: videoImportable,
    mapping_integrity: mappingIntegrity,
    traceability_integrity: traceabilityIntegrity,
    consumer_import_ready: consumerImportReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? DNA_CONSUMER_IMPORT_TEST_PASS_VERDICT
      : DNA_CONSUMER_IMPORT_TEST_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_CONSUMER_IMPORT_TEST_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DNA_CONSUMER_IMPORT_TEST_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
