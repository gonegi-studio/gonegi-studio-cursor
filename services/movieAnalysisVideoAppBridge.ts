import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  EXPECTED_SOURCE_COUNT,
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
  type DnaReleaseSourceEntry,
  type MovieAnalysisDnaReleasePackage,
  loadMovieAnalysisDnaReleasePackage,
} from './movieAnalysisDnaReleasePackage.js';
import {
  PRODUCTION_READY_CERTIFICATION_PASS_VERDICT,
  PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
  PRODUCTION_READY_STATUS_MESSAGE,
  type MovieAnalysisProductionReadyCertificationReport,
} from './movieAnalysisProductionReadyCertification.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const VIDEO_APP_BRIDGE_PHASE =
  'PHASE-SOURCE-VIDEO-072-MOVIE_ANALYSIS_VIDEO_APP_BRIDGE_V1' as const;
export const VIDEO_APP_BRIDGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_VIDEO_APP_BRIDGE_V1' as const;
export const VIDEO_APP_BRIDGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_VIDEO_APP_BRIDGE_V1' as const;
export const VIDEO_APP_BRIDGE_DIR = 'exports/movie_analysis_video_bridge' as const;
export const VIDEO_APP_BRIDGE_PATH =
  'exports/movie_analysis_video_bridge/movie-analysis-video-app-bridge.json' as const;
export const VIDEO_APP_BRIDGE_REPORT_PATH =
  'reports/movie-analysis-video-app-bridge-report.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, ADAPTERS_PER_SOURCE };

export type ValidationStatus = 'PASS' | 'FAIL';

export type VideoAppBridgeSafetySummary = {
  planning_only: true;
  generation: false;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  external_call_allowed: false;
};

export type VideoAppBridgeAdapterMapping = {
  consumer_target: 'video_app';
  scene_adapter: true;
  camera_adapter: true;
  emotion_adapter: true;
  transition_adapter: true;
  continuity_adapter: true;
  storytelling_adapter: true;
  adapter_ready: true;
};

export type VideoAppBridgeEntry = {
  source_video_id: string;
  cinematic_dna_id: string;
  integration_id: string;
  adapter_library_entry_id: string;
  release_id: string;
  package_id: string;
  adapter_ids: string[];
  scene_adapter: DnaAdapterDefinition;
  camera_adapter: DnaAdapterDefinition;
  emotion_adapter: DnaAdapterDefinition;
  transition_adapter: DnaAdapterDefinition;
  continuity_adapter: DnaAdapterDefinition;
  storytelling_adapter: DnaAdapterDefinition;
  adapter_mapping: VideoAppBridgeAdapterMapping;
  video_app_ready: true;
  bridge_only: true;
};

export type MovieAnalysisVideoAppBridge = {
  bridge_id: string;
  bridge_type: 'movie_analysis_video_app_bridge';
  phase: typeof VIDEO_APP_BRIDGE_PHASE;
  consumer_target: 'video_app';
  generated_at: string;
  production_ready_report_path: typeof PRODUCTION_READY_CERTIFICATION_REPORT_PATH;
  release_package_path: typeof DNA_RELEASE_PACKAGE_PATH;
  release_id: string;
  package_id: string;
  adapter_library_id: string;
  cinematic_dna_set_id: string;
  integration_set_id: string;
  source_count: number;
  adapter_count: number;
  entries: VideoAppBridgeEntry[];
  safety_summary: VideoAppBridgeSafetySummary;
};

export type VideoAppBridgeIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceVideoAppBridgeAudit = {
  source_video_id: string;
  scene_adapter_mapped: ValidationStatus;
  camera_adapter_mapped: ValidationStatus;
  emotion_adapter_mapped: ValidationStatus;
  transition_adapter_mapped: ValidationStatus;
  continuity_adapter_mapped: ValidationStatus;
  storytelling_adapter_mapped: ValidationStatus;
  traceability_preserved: ValidationStatus;
  source_bridge_ready: ValidationStatus;
};

export type MovieAnalysisVideoAppBridgeReport = {
  report_id: string;
  phase: typeof VIDEO_APP_BRIDGE_PHASE;
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
  production_ready_linked: ValidationStatus;
  release_package_linked: ValidationStatus;
  scene_adapter_mapped: ValidationStatus;
  camera_adapter_mapped: ValidationStatus;
  emotion_adapter_mapped: ValidationStatus;
  transition_adapter_mapped: ValidationStatus;
  continuity_adapter_mapped: ValidationStatus;
  storytelling_adapter_mapped: ValidationStatus;
  traceability_preserved: ValidationStatus;
  video_app_bridge_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceVideoAppBridgeAudit[];
  final_verdict:
    | typeof VIDEO_APP_BRIDGE_PASS_VERDICT
    | typeof VIDEO_APP_BRIDGE_FAIL_VERDICT;
  issues: VideoAppBridgeIssue[];
};

const BRIDGE_SAFETY_SUMMARY: VideoAppBridgeSafetySummary = {
  planning_only: true,
  generation: false,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  external_call_allowed: false,
};

const ADAPTER_FIELDS = [
  'scene_adapter',
  'camera_adapter',
  'emotion_adapter',
  'transition_adapter',
  'continuity_adapter',
  'storytelling_adapter',
] as const;

function loadProductionReadyReport(
  projectRoot: string
): MovieAnalysisProductionReadyCertificationReport | null {
  const abs = path.join(projectRoot, PRODUCTION_READY_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisProductionReadyCertificationReport;
}

function isAdapterMapped(
  bridgeAdapter: DnaAdapterDefinition,
  libraryAdapter: DnaAdapterDefinition,
  releaseAdapterIds: string[]
): boolean {
  return (
    bridgeAdapter.adapter_ready === true &&
    bridgeAdapter.pattern_count > 0 &&
    bridgeAdapter.adapter_id === libraryAdapter.adapter_id &&
    releaseAdapterIds.includes(bridgeAdapter.adapter_id)
  );
}

function buildAdapterMapping(libraryEntry: DnaAdapterLibraryEntry): VideoAppBridgeAdapterMapping {
  return {
    consumer_target: 'video_app',
    scene_adapter: true,
    camera_adapter: true,
    emotion_adapter: true,
    transition_adapter: true,
    continuity_adapter: true,
    storytelling_adapter: true,
    adapter_ready: libraryEntry.video_adapter_mapping.adapter_ready,
  };
}

function buildBridgeEntry(
  releaseSource: DnaReleaseSourceEntry,
  libraryEntry: DnaAdapterLibraryEntry,
  releasePackage: MovieAnalysisDnaReleasePackage
): VideoAppBridgeEntry {
  return {
    source_video_id: releaseSource.source_video_id,
    cinematic_dna_id: releaseSource.cinematic_dna_id,
    integration_id: releaseSource.integration_id,
    adapter_library_entry_id: releaseSource.adapter_library_entry_id,
    release_id: releasePackage.release_id,
    package_id: releasePackage.package_id,
    adapter_ids: [...releaseSource.adapter_ids],
    scene_adapter: libraryEntry.scene_adapter,
    camera_adapter: libraryEntry.camera_adapter,
    emotion_adapter: libraryEntry.emotion_adapter,
    transition_adapter: libraryEntry.transition_adapter,
    continuity_adapter: libraryEntry.continuity_adapter,
    storytelling_adapter: libraryEntry.storytelling_adapter,
    adapter_mapping: buildAdapterMapping(libraryEntry),
    video_app_ready: true,
    bridge_only: true,
  };
}

function auditSource(
  entry: VideoAppBridgeEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  releaseSource: DnaReleaseSourceEntry | undefined,
  sourceVideoId: string
): SourceVideoAppBridgeAudit {
  if (!entry || !libraryEntry || !releaseSource) {
    return {
      source_video_id: sourceVideoId,
      scene_adapter_mapped: 'FAIL',
      camera_adapter_mapped: 'FAIL',
      emotion_adapter_mapped: 'FAIL',
      transition_adapter_mapped: 'FAIL',
      continuity_adapter_mapped: 'FAIL',
      storytelling_adapter_mapped: 'FAIL',
      traceability_preserved: 'FAIL',
      source_bridge_ready: 'FAIL',
    };
  }

  const adapterStatuses = ADAPTER_FIELDS.map((field) =>
    isAdapterMapped(entry[field], libraryEntry[field], releaseSource.adapter_ids)
      ? 'PASS'
      : 'FAIL'
  ) as ValidationStatus[];

  const traceabilityPreserved =
    entry.cinematic_dna_id === releaseSource.cinematic_dna_id &&
    entry.integration_id === releaseSource.integration_id &&
    entry.adapter_library_entry_id === releaseSource.adapter_library_entry_id &&
    entry.adapter_ids.length === ADAPTERS_PER_SOURCE
      ? 'PASS'
      : 'FAIL';

  const sourceBridgeReady =
    adapterStatuses.every((status) => status === 'PASS') &&
    traceabilityPreserved === 'PASS' &&
    entry.video_app_ready === true &&
    entry.bridge_only === true
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    scene_adapter_mapped: adapterStatuses[0],
    camera_adapter_mapped: adapterStatuses[1],
    emotion_adapter_mapped: adapterStatuses[2],
    transition_adapter_mapped: adapterStatuses[3],
    continuity_adapter_mapped: adapterStatuses[4],
    storytelling_adapter_mapped: adapterStatuses[5],
    traceability_preserved: traceabilityPreserved,
    source_bridge_ready: sourceBridgeReady,
  };
}

function aggregateStatus(
  audits: SourceVideoAppBridgeAudit[],
  field: keyof SourceVideoAppBridgeAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

export function buildMovieAnalysisVideoAppBridge(
  releasePackage: MovieAnalysisDnaReleasePackage,
  adapterLibrary: NonNullable<ReturnType<typeof loadMovieAnalysisDnaAdapterLibrary>>
): MovieAnalysisVideoAppBridge {
  const entries: VideoAppBridgeEntry[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const releaseSource = releasePackage.sources.find(
      (source) => source.source_video_id === sourceVideoId
    );
    const libraryEntry = adapterLibrary.entries.find(
      (entry) => entry.source_video_id === sourceVideoId
    );
    if (!releaseSource || !libraryEntry) {
      throw new Error(`Missing release or library entry for ${sourceVideoId}`);
    }
    entries.push(buildBridgeEntry(releaseSource, libraryEntry, releasePackage));
  }

  const adapterCount = entries.reduce((sum, entry) => sum + entry.adapter_ids.length, 0);

  return {
    bridge_id: 'movie-analysis-video-app-bridge-v1',
    bridge_type: 'movie_analysis_video_app_bridge',
    phase: VIDEO_APP_BRIDGE_PHASE,
    consumer_target: 'video_app',
    generated_at: new Date().toISOString(),
    production_ready_report_path: PRODUCTION_READY_CERTIFICATION_REPORT_PATH,
    release_package_path: DNA_RELEASE_PACKAGE_PATH,
    release_id: releasePackage.release_id,
    package_id: releasePackage.package_id,
    adapter_library_id: releasePackage.adapter_library_id,
    cinematic_dna_set_id: releasePackage.cinematic_dna_set_id,
    integration_set_id: releasePackage.integration_set_id,
    source_count: entries.length,
    adapter_count: adapterCount,
    entries,
    safety_summary: BRIDGE_SAFETY_SUMMARY,
  };
}

export function writeMovieAnalysisVideoAppBridge(
  projectRoot?: string
): { bridge: MovieAnalysisVideoAppBridge; report: MovieAnalysisVideoAppBridgeReport } {
  const root = resolveProjectRoot(projectRoot);
  const issues: VideoAppBridgeIssue[] = [];
  const timestamp = new Date().toISOString();

  const productionReadyReport = loadProductionReadyReport(root);
  if (!productionReadyReport) {
    issues.push({
      code: 'PRODUCTION_READY_REPORT_MISSING',
      message: `Missing ${PRODUCTION_READY_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
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

  if (!productionReadyReport || !releasePackage || !adapterLibrary) {
    const report: MovieAnalysisVideoAppBridgeReport = {
      report_id: 'movie-analysis-video-app-bridge-report-v1',
      phase: VIDEO_APP_BRIDGE_PHASE,
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
      production_ready_linked: 'FAIL',
      release_package_linked: 'FAIL',
      scene_adapter_mapped: 'FAIL',
      camera_adapter_mapped: 'FAIL',
      emotion_adapter_mapped: 'FAIL',
      transition_adapter_mapped: 'FAIL',
      continuity_adapter_mapped: 'FAIL',
      storytelling_adapter_mapped: 'FAIL',
      traceability_preserved: 'FAIL',
      video_app_bridge_ready: 'FAIL',
      planning_only_status: 'FAIL',
      source_audits: [],
      final_verdict: VIDEO_APP_BRIDGE_FAIL_VERDICT,
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, VIDEO_APP_BRIDGE_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    return { bridge: null as unknown as MovieAnalysisVideoAppBridge, report };
  }

  if (productionReadyReport.final_verdict !== PRODUCTION_READY_CERTIFICATION_PASS_VERDICT) {
    issues.push({
      code: 'PRODUCTION_READY_NOT_PASS',
      message: `Production ready must have ${PRODUCTION_READY_CERTIFICATION_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  if (productionReadyReport.certification_status !== PRODUCTION_READY_STATUS_MESSAGE) {
    issues.push({
      code: 'PRODUCTION_READY_STATUS_MISMATCH',
      message: `Expected status ${PRODUCTION_READY_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  if (releasePackage.release_readiness.release_ready !== true) {
    issues.push({
      code: 'RELEASE_PACKAGE_NOT_READY',
      message: 'DNA release package is not ready for Video App bridge',
      severity: 'error',
    });
  }

  const productionReadyLinked =
    productionReadyReport.production_ready === 'PASS' &&
    productionReadyReport.final_verdict === PRODUCTION_READY_CERTIFICATION_PASS_VERDICT
      ? 'PASS'
      : 'FAIL';

  const releasePackageLinked =
    fs.existsSync(path.join(root, DNA_RELEASE_PACKAGE_PATH)) &&
    releasePackage.certification_status === 'CERTIFIED'
      ? 'PASS'
      : 'FAIL';

  if (productionReadyLinked === 'FAIL') {
    issues.push({
      code: 'PRODUCTION_READY_NOT_LINKED',
      message: 'Production ready certification not linked',
      severity: 'error',
    });
  }

  if (releasePackageLinked === 'FAIL') {
    issues.push({
      code: 'RELEASE_PACKAGE_NOT_LINKED',
      message: 'DNA release package not linked',
      severity: 'error',
    });
  }

  const bridge = buildMovieAnalysisVideoAppBridge(releasePackage, adapterLibrary);

  const outDir = path.join(root, VIDEO_APP_BRIDGE_DIR);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_APP_BRIDGE_PATH),
    `${JSON.stringify(bridge, null, 2)}\n`,
    'utf8'
  );

  const sourceAudits: SourceVideoAppBridgeAudit[] = [];
  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = bridge.entries.find((e) => e.source_video_id === sourceVideoId);
    const libraryEntry = adapterLibrary.entries.find(
      (e) => e.source_video_id === sourceVideoId
    );
    const releaseSource = releasePackage.sources.find(
      (s) => s.source_video_id === sourceVideoId
    );
    const audit = auditSource(entry, libraryEntry, releaseSource, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_bridge_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_BRIDGE_NOT_READY',
        message: `Video App bridge not ready for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const sceneAdapterMapped = aggregateStatus(sourceAudits, 'scene_adapter_mapped');
  const cameraAdapterMapped = aggregateStatus(sourceAudits, 'camera_adapter_mapped');
  const emotionAdapterMapped = aggregateStatus(sourceAudits, 'emotion_adapter_mapped');
  const transitionAdapterMapped = aggregateStatus(sourceAudits, 'transition_adapter_mapped');
  const continuityAdapterMapped = aggregateStatus(sourceAudits, 'continuity_adapter_mapped');
  const storytellingAdapterMapped = aggregateStatus(sourceAudits, 'storytelling_adapter_mapped');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const safetyValid =
    bridge.safety_summary.planning_only === true &&
    bridge.safety_summary.generation === false &&
    bridge.safety_summary.runtime_execution === false &&
    bridge.safety_summary.gpu_execution === false &&
    bridge.safety_summary.external_call_allowed === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Safety planning_only validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const videoAppBridgeReady =
    bridge.source_count === EXPECTED_SOURCE_COUNT &&
    bridge.adapter_count === EXPECTED_ADAPTER_COUNT &&
    productionReadyLinked === 'PASS' &&
    releasePackageLinked === 'PASS' &&
    sceneAdapterMapped === 'PASS' &&
    cameraAdapterMapped === 'PASS' &&
    emotionAdapterMapped === 'PASS' &&
    transitionAdapterMapped === 'PASS' &&
    continuityAdapterMapped === 'PASS' &&
    storytellingAdapterMapped === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    sourceAudits.every((audit) => audit.source_bridge_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = videoAppBridgeReady === 'PASS';

  const report: MovieAnalysisVideoAppBridgeReport = {
    report_id: 'movie-analysis-video-app-bridge-report-v1',
    phase: VIDEO_APP_BRIDGE_PHASE,
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
    production_ready_linked: productionReadyLinked,
    release_package_linked: releasePackageLinked,
    scene_adapter_mapped: sceneAdapterMapped,
    camera_adapter_mapped: cameraAdapterMapped,
    emotion_adapter_mapped: emotionAdapterMapped,
    transition_adapter_mapped: transitionAdapterMapped,
    continuity_adapter_mapped: continuityAdapterMapped,
    storytelling_adapter_mapped: storytellingAdapterMapped,
    traceability_preserved: traceabilityPreserved,
    video_app_bridge_ready: videoAppBridgeReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? VIDEO_APP_BRIDGE_PASS_VERDICT : VIDEO_APP_BRIDGE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, VIDEO_APP_BRIDGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return { bridge, report };
}

export function loadMovieAnalysisVideoAppBridge(
  projectRoot?: string
): MovieAnalysisVideoAppBridge | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_APP_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoAppBridge;
}
