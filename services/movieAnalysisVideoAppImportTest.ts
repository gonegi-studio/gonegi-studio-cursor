import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaAdapterDefinition,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import {
  ADAPTERS_PER_SOURCE,
  EXPECTED_ADAPTER_COUNT,
} from './movieAnalysisDnaPackaging.js';
import {
  DNA_RELEASE_PACKAGE_PATH,
  loadMovieAnalysisDnaReleasePackage,
} from './movieAnalysisDnaReleasePackage.js';
import {
  EXPECTED_SOURCE_COUNT,
  VIDEO_APP_BRIDGE_PASS_VERDICT,
  VIDEO_APP_BRIDGE_PATH,
  VIDEO_APP_BRIDGE_REPORT_PATH,
  type VideoAppBridgeEntry,
  loadMovieAnalysisVideoAppBridge,
} from './movieAnalysisVideoAppBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_APP_IMPORT_TEST_PHASE =
  'PHASE-SOURCE-VIDEO-073-MOVIE_ANALYSIS_VIDEO_APP_IMPORT_TEST_V1' as const;
export const VIDEO_APP_IMPORT_TEST_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_APP_IMPORT_TEST_V1' as const;
export const VIDEO_APP_IMPORT_TEST_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_APP_IMPORT_TEST_V1' as const;
export const VIDEO_APP_IMPORT_TEST_REPORT_PATH =
  'reports/movie-analysis-video-app-import-test-report.json' as const;
export const VIDEO_APP_IMPORT_TEST_MD_PATH =
  'reports/MOVIE_ANALYSIS_VIDEO_APP_IMPORT_TEST.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, ADAPTERS_PER_SOURCE };

export type ValidationStatus = 'PASS' | 'FAIL';

export type VideoAppImportTestIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceVideoAppImportAudit = {
  source_video_id: string;
  scene_adapter_import: ValidationStatus;
  camera_adapter_import: ValidationStatus;
  emotion_adapter_import: ValidationStatus;
  transition_adapter_import: ValidationStatus;
  continuity_adapter_import: ValidationStatus;
  storytelling_adapter_import: ValidationStatus;
  traceability_preserved: ValidationStatus;
  import_ready: ValidationStatus;
};

export type MovieAnalysisVideoAppImportTestReport = {
  report_id: string;
  phase: typeof VIDEO_APP_IMPORT_TEST_PHASE;
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
  bridge_path: typeof VIDEO_APP_BRIDGE_PATH;
  source_count_valid: ValidationStatus;
  adapter_count_valid: ValidationStatus;
  scene_adapter_import: ValidationStatus;
  camera_adapter_import: ValidationStatus;
  emotion_adapter_import: ValidationStatus;
  transition_adapter_import: ValidationStatus;
  continuity_adapter_import: ValidationStatus;
  storytelling_adapter_import: ValidationStatus;
  traceability_preserved: ValidationStatus;
  video_app_import_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceVideoAppImportAudit[];
  final_verdict:
    | typeof VIDEO_APP_IMPORT_TEST_PASS_VERDICT
    | typeof VIDEO_APP_IMPORT_TEST_FAIL_VERDICT;
  issues: VideoAppImportTestIssue[];
};

const BRIDGE_ENTRY_FIELDS = [
  'source_video_id',
  'cinematic_dna_id',
  'integration_id',
  'adapter_library_entry_id',
  'release_id',
  'package_id',
  'adapter_ids',
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
  'adapter_mapping',
  'video_app_ready',
  'bridge_only',
] as const;

const ADAPTER_IMPORT_FIELDS = [
  { field: 'scene_adapter' as const, mappingKey: 'scene_adapter' as const },
  { field: 'camera_adapter' as const, mappingKey: 'camera_adapter' as const },
  { field: 'emotion_adapter' as const, mappingKey: 'emotion_adapter' as const },
  { field: 'transition_adapter' as const, mappingKey: 'transition_adapter' as const },
  { field: 'continuity_adapter' as const, mappingKey: 'continuity_adapter' as const },
  { field: 'storytelling_adapter' as const, mappingKey: 'storytelling_adapter' as const },
];

function mappingsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function simulateAdapterImport(
  adapter: DnaAdapterDefinition,
  mappingEnabled: boolean
): boolean {
  return (
    adapter.adapter_ready === true &&
    adapter.pattern_count > 0 &&
    adapter.library_only === true &&
    mappingEnabled === true
  );
}

function simulateVideoAppBridgeImport(entry: VideoAppBridgeEntry): boolean {
  const record = entry as unknown as Record<string, unknown>;
  if (!BRIDGE_ENTRY_FIELDS.every((field) => field in record)) {
    return false;
  }

  const mapping = entry.adapter_mapping;
  return (
    entry.video_app_ready === true &&
    entry.bridge_only === true &&
    mapping.consumer_target === 'video_app' &&
    mapping.adapter_ready === true &&
    ADAPTER_IMPORT_FIELDS.every(({ field, mappingKey }) =>
      simulateAdapterImport(entry[field], mapping[mappingKey])
    )
  );
}

function isTraceabilityPreserved(
  entry: VideoAppBridgeEntry,
  libraryEntry: DnaAdapterLibraryEntry,
  releaseSource: {
    cinematic_dna_id: string;
    integration_id: string;
    adapter_library_entry_id: string;
    adapter_ids: string[];
  },
  bridgeMeta: {
    release_id: string;
    package_id: string;
    adapter_library_id: string;
  }
): boolean {
  return (
    entry.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    entry.cinematic_dna_id === releaseSource.cinematic_dna_id &&
    entry.integration_id === libraryEntry.integration_id &&
    entry.integration_id === releaseSource.integration_id &&
    entry.adapter_library_entry_id === libraryEntry.adapter_library_entry_id &&
    entry.adapter_library_entry_id === releaseSource.adapter_library_entry_id &&
    entry.release_id === bridgeMeta.release_id &&
    entry.package_id === bridgeMeta.package_id &&
    entry.adapter_ids.length === ADAPTERS_PER_SOURCE &&
    entry.adapter_ids.every((adapterId) => releaseSource.adapter_ids.includes(adapterId)) &&
    mappingsEqual(entry.scene_adapter, libraryEntry.scene_adapter) &&
    mappingsEqual(entry.camera_adapter, libraryEntry.camera_adapter) &&
    mappingsEqual(entry.emotion_adapter, libraryEntry.emotion_adapter) &&
    mappingsEqual(entry.transition_adapter, libraryEntry.transition_adapter) &&
    mappingsEqual(entry.continuity_adapter, libraryEntry.continuity_adapter) &&
    mappingsEqual(entry.storytelling_adapter, libraryEntry.storytelling_adapter)
  );
}

function auditSource(
  entry: VideoAppBridgeEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  releaseSource:
    | {
        cinematic_dna_id: string;
        integration_id: string;
        adapter_library_entry_id: string;
        adapter_ids: string[];
      }
    | undefined,
  bridgeMeta: {
    release_id: string;
    package_id: string;
    adapter_library_id: string;
  }
): SourceVideoAppImportAudit {
  const sourceVideoId = entry?.source_video_id ?? 'UNKNOWN';

  if (!entry || !libraryEntry || !releaseSource) {
    return {
      source_video_id: sourceVideoId,
      scene_adapter_import: 'FAIL',
      camera_adapter_import: 'FAIL',
      emotion_adapter_import: 'FAIL',
      transition_adapter_import: 'FAIL',
      continuity_adapter_import: 'FAIL',
      storytelling_adapter_import: 'FAIL',
      traceability_preserved: 'FAIL',
      import_ready: 'FAIL',
    };
  }

  const adapterImports = ADAPTER_IMPORT_FIELDS.map(({ field, mappingKey }) =>
    simulateAdapterImport(entry[field], entry.adapter_mapping[mappingKey]) ? 'PASS' : 'FAIL'
  ) as ValidationStatus[];

  const bridgeImportable = simulateVideoAppBridgeImport(entry);
  if (!bridgeImportable) {
    adapterImports.fill('FAIL');
  }

  const traceability = isTraceabilityPreserved(entry, libraryEntry, releaseSource, bridgeMeta)
    ? 'PASS'
    : 'FAIL';

  const importReady =
    bridgeImportable &&
    adapterImports.every((status) => status === 'PASS') &&
    traceability === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    scene_adapter_import: adapterImports[0],
    camera_adapter_import: adapterImports[1],
    emotion_adapter_import: adapterImports[2],
    transition_adapter_import: adapterImports[3],
    continuity_adapter_import: adapterImports[4],
    storytelling_adapter_import: adapterImports[5],
    traceability_preserved: traceability,
    import_ready: importReady,
  };
}

function aggregateStatus(
  audits: SourceVideoAppImportAudit[],
  field: keyof SourceVideoAppImportAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisVideoAppImportTestReport): string {
  const lines = [
    '# Movie Analysis Video App Import Test',
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
    `| adapter_count | ${report.adapter_count} |`,
    `| source_count_valid | ${report.source_count_valid} |`,
    `| adapter_count_valid | ${report.adapter_count_valid} |`,
    `| scene_adapter_import | ${report.scene_adapter_import} |`,
    `| camera_adapter_import | ${report.camera_adapter_import} |`,
    `| emotion_adapter_import | ${report.emotion_adapter_import} |`,
    `| transition_adapter_import | ${report.transition_adapter_import} |`,
    `| continuity_adapter_import | ${report.continuity_adapter_import} |`,
    `| storytelling_adapter_import | ${report.storytelling_adapter_import} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| video_app_import_ready | ${report.video_app_import_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Import Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- scene_adapter_import: ${audit.scene_adapter_import}`,
      `- camera_adapter_import: ${audit.camera_adapter_import}`,
      `- emotion_adapter_import: ${audit.emotion_adapter_import}`,
      `- transition_adapter_import: ${audit.transition_adapter_import}`,
      `- continuity_adapter_import: ${audit.continuity_adapter_import}`,
      `- storytelling_adapter_import: ${audit.storytelling_adapter_import}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
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

export function writeMovieAnalysisVideoAppImportTestReport(
  projectRoot?: string
): MovieAnalysisVideoAppImportTestReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoAppImportTestIssue[] = [];
  const timestamp = new Date().toISOString();

  const bridge = loadMovieAnalysisVideoAppBridge(root);
  if (!bridge) {
    issues.push({
      code: 'VIDEO_APP_BRIDGE_MISSING',
      message: `Missing ${VIDEO_APP_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const bridgeReportPath = path.join(root, VIDEO_APP_BRIDGE_REPORT_PATH);
  if (fs.existsSync(bridgeReportPath)) {
    const bridgeReport = JSON.parse(fs.readFileSync(bridgeReportPath, 'utf8')) as {
      final_verdict?: string;
      video_app_bridge_ready?: string;
    };
    if (bridgeReport.final_verdict !== VIDEO_APP_BRIDGE_PASS_VERDICT) {
      issues.push({
        code: 'VIDEO_APP_BRIDGE_NOT_PASS',
        message: `Video App bridge must have ${VIDEO_APP_BRIDGE_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const releasePackage = loadMovieAnalysisDnaReleasePackage(root);
  if (!releasePackage) {
    issues.push({
      code: 'RELEASE_PACKAGE_MISSING',
      message: `Missing ${DNA_RELEASE_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  const adapterLibrary = loadMovieAnalysisDnaAdapterLibrary(root);
  if (!adapterLibrary) {
    issues.push({
      code: 'ADAPTER_LIBRARY_MISSING',
      message: `Missing ${DNA_ADAPTER_LIBRARY_PATH}`,
      severity: 'error',
    });
  }

  if (!bridge || !releasePackage || !adapterLibrary) {
    const report: MovieAnalysisVideoAppImportTestReport = {
      report_id: 'movie-analysis-video-app-import-test-report-v1',
      phase: VIDEO_APP_IMPORT_TEST_PHASE,
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
      bridge_path: VIDEO_APP_BRIDGE_PATH,
      source_count_valid: 'FAIL',
      adapter_count_valid: 'FAIL',
      scene_adapter_import: 'FAIL',
      camera_adapter_import: 'FAIL',
      emotion_adapter_import: 'FAIL',
      transition_adapter_import: 'FAIL',
      continuity_adapter_import: 'FAIL',
      storytelling_adapter_import: 'FAIL',
      traceability_preserved: 'FAIL',
      video_app_import_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: VIDEO_APP_IMPORT_TEST_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, VIDEO_APP_IMPORT_TEST_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, VIDEO_APP_IMPORT_TEST_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  if (bridge.consumer_target !== 'video_app') {
    issues.push({
      code: 'BRIDGE_TARGET_INVALID',
      message: 'Video App bridge consumer_target must be video_app',
      severity: 'error',
    });
  }

  if (bridge.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (bridge.adapter_count !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_MISMATCH',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const bridgeMeta = {
    release_id: bridge.release_id,
    package_id: bridge.package_id,
    adapter_library_id: bridge.adapter_library_id,
  };

  const sourceAudits: SourceVideoAppImportAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = bridge.entries.find((e) => e.source_video_id === sourceVideoId);
    const libraryEntry = adapterLibrary.entries.find(
      (e) => e.source_video_id === sourceVideoId
    );
    const releaseSource = releasePackage.sources.find(
      (s) => s.source_video_id === sourceVideoId
    );

    if (!entry || !libraryEntry || !releaseSource) {
      issues.push({
        code: 'SOURCE_IMPORT_COMPONENTS_MISSING',
        message: `Missing import components for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
      continue;
    }

    const audit = auditSource(entry, libraryEntry, releaseSource, bridgeMeta);
    sourceAudits.push(audit);

    if (audit.import_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_IMPORT_NOT_READY',
        message: `Video App import not ready for ${sourceVideoId}`,
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
    bridge.safety_summary.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Bridge safety planning_only validation failed',
      severity: 'error',
    });
  }

  const sourceCountValid =
    bridge.source_count === EXPECTED_SOURCE_COUNT ? 'PASS' : 'FAIL';
  const adapterCountValid =
    bridge.adapter_count === EXPECTED_ADAPTER_COUNT ? 'PASS' : 'FAIL';

  const sceneAdapterImport = aggregateStatus(sourceAudits, 'scene_adapter_import');
  const cameraAdapterImport = aggregateStatus(sourceAudits, 'camera_adapter_import');
  const emotionAdapterImport = aggregateStatus(sourceAudits, 'emotion_adapter_import');
  const transitionAdapterImport = aggregateStatus(sourceAudits, 'transition_adapter_import');
  const continuityAdapterImport = aggregateStatus(sourceAudits, 'continuity_adapter_import');
  const storytellingAdapterImport = aggregateStatus(
    sourceAudits,
    'storytelling_adapter_import'
  );
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const videoAppImportReady =
    bridge !== null &&
    sourceCountValid === 'PASS' &&
    adapterCountValid === 'PASS' &&
    sceneAdapterImport === 'PASS' &&
    cameraAdapterImport === 'PASS' &&
    emotionAdapterImport === 'PASS' &&
    transitionAdapterImport === 'PASS' &&
    continuityAdapterImport === 'PASS' &&
    storytellingAdapterImport === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.import_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = videoAppImportReady === 'PASS';

  const report: MovieAnalysisVideoAppImportTestReport = {
    report_id: 'movie-analysis-video-app-import-test-report-v1',
    phase: VIDEO_APP_IMPORT_TEST_PHASE,
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
    bridge_path: VIDEO_APP_BRIDGE_PATH,
    source_count_valid: sourceCountValid,
    adapter_count_valid: adapterCountValid,
    scene_adapter_import: sceneAdapterImport,
    camera_adapter_import: cameraAdapterImport,
    emotion_adapter_import: emotionAdapterImport,
    transition_adapter_import: transitionAdapterImport,
    continuity_adapter_import: continuityAdapterImport,
    storytelling_adapter_import: storytellingAdapterImport,
    traceability_preserved: traceabilityPreserved,
    video_app_import_ready: videoAppImportReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass
      ? VIDEO_APP_IMPORT_TEST_PASS_VERDICT
      : VIDEO_APP_IMPORT_TEST_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_APP_IMPORT_TEST_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_APP_IMPORT_TEST_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
