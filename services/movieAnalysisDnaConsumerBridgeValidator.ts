import fs from 'node:fs';
import path from 'node:path';
import {
  DNA_ADAPTER_LIBRARY_PATH,
  type DnaAdapterLibraryEntry,
  loadMovieAnalysisDnaAdapterLibrary,
} from './movieAnalysisDnaAdapterLibrary.js';
import { DNA_PACKAGE_PATH, loadMovieAnalysisDnaPackage } from './movieAnalysisDnaPackaging.js';
import {
  DNA_CONSUMER_BRIDGE_FAIL_VERDICT,
  DNA_CONSUMER_BRIDGE_PASS_VERDICT,
  DNA_CONSUMER_BRIDGE_PHASE,
  DNA_CONSUMER_BRIDGE_REPORT_PATH,
  DNA_IMAGE_BRIDGE_PATH,
  DNA_VIDEO_BRIDGE_PATH,
  EXPECTED_SOURCE_COUNT,
  EXPECTED_SOURCE_VIDEO_IDS,
  type DnaImageBridgeEntry,
  type DnaVideoBridgeEntry,
  type MovieAnalysisDnaImageBridge,
  type MovieAnalysisDnaVideoBridge,
  loadMovieAnalysisDnaImageBridge,
  loadMovieAnalysisDnaVideoBridge,
} from './movieAnalysisDnaConsumerBridge.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type ValidationStatus = 'PASS' | 'FAIL';

export type DnaConsumerBridgeIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDnaConsumerBridgeAudit = {
  source_video_id: string;
  image_bridge_valid: ValidationStatus;
  video_bridge_valid: ValidationStatus;
  adapter_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  consumer_ready: ValidationStatus;
};

export type MovieAnalysisDnaConsumerBridgeReport = {
  report_id: string;
  phase: typeof DNA_CONSUMER_BRIDGE_PHASE;
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
  image_bridge_valid: ValidationStatus;
  video_bridge_valid: ValidationStatus;
  adapter_mapping_preserved: ValidationStatus;
  traceability_preserved: ValidationStatus;
  consumer_ready: ValidationStatus;
  planning_only_status: ValidationStatus;
  source_audits: SourceDnaConsumerBridgeAudit[];
  final_verdict:
    | typeof DNA_CONSUMER_BRIDGE_PASS_VERDICT
    | typeof DNA_CONSUMER_BRIDGE_FAIL_VERDICT;
  issues: DnaConsumerBridgeIssue[];
};

function mappingsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isImageBridgeEntryValid(
  entry: DnaImageBridgeEntry,
  libraryEntry: DnaAdapterLibraryEntry
): boolean {
  return (
    entry.consumer_ready === true &&
    entry.bridge_only === true &&
    entry.emotion_adapter.adapter_ready === true &&
    entry.emotion_adapter.pattern_count > 0 &&
    entry.adapter_mapping.emotion_adapter === true &&
    entry.adapter_mapping.adapter_ready === true &&
    mappingsEqual(entry.adapter_mapping, libraryEntry.image_adapter_mapping) &&
    mappingsEqual(entry.emotion_adapter, libraryEntry.emotion_adapter) &&
    mappingsEqual(entry.character_pattern_refs, libraryEntry.image_adapter_mapping.character_pattern_refs)
  );
}

function isVideoBridgeEntryValid(
  entry: DnaVideoBridgeEntry,
  libraryEntry: DnaAdapterLibraryEntry
): boolean {
  return (
    entry.consumer_ready === true &&
    entry.bridge_only === true &&
    entry.scene_adapter.adapter_ready === true &&
    entry.camera_adapter.adapter_ready === true &&
    entry.transition_adapter.adapter_ready === true &&
    entry.continuity_adapter.adapter_ready === true &&
    entry.storytelling_adapter.adapter_ready === true &&
    entry.adapter_mapping.adapter_ready === true &&
    mappingsEqual(entry.adapter_mapping, libraryEntry.video_adapter_mapping) &&
    mappingsEqual(entry.scene_adapter, libraryEntry.scene_adapter) &&
    mappingsEqual(entry.camera_adapter, libraryEntry.camera_adapter) &&
    mappingsEqual(entry.transition_adapter, libraryEntry.transition_adapter) &&
    mappingsEqual(entry.continuity_adapter, libraryEntry.continuity_adapter) &&
    mappingsEqual(entry.storytelling_adapter, libraryEntry.storytelling_adapter)
  );
}

function auditSource(
  imageEntry: DnaImageBridgeEntry | undefined,
  videoEntry: DnaVideoBridgeEntry | undefined,
  libraryEntry: DnaAdapterLibraryEntry | undefined,
  packageIds: {
    cinematic_dna_id: string;
    integration_id: string;
    adapter_library_entry_id: string;
    package_id: string;
  }
): SourceDnaConsumerBridgeAudit {
  const sourceVideoId =
    imageEntry?.source_video_id ?? videoEntry?.source_video_id ?? 'UNKNOWN';

  if (!imageEntry || !videoEntry || !libraryEntry) {
    return {
      source_video_id: sourceVideoId,
      image_bridge_valid: 'FAIL',
      video_bridge_valid: 'FAIL',
      adapter_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      consumer_ready: 'FAIL',
    };
  }

  const imageValid = isImageBridgeEntryValid(imageEntry, libraryEntry) ? 'PASS' : 'FAIL';
  const videoValid = isVideoBridgeEntryValid(videoEntry, libraryEntry) ? 'PASS' : 'FAIL';

  const adapterMappingPreserved =
    imageValid === 'PASS' && videoValid === 'PASS' ? 'PASS' : 'FAIL';

  const traceability =
    imageEntry.cinematic_dna_id === packageIds.cinematic_dna_id &&
    imageEntry.cinematic_dna_id === libraryEntry.cinematic_dna_id &&
    imageEntry.integration_id === packageIds.integration_id &&
    imageEntry.integration_id === libraryEntry.integration_id &&
    imageEntry.adapter_library_entry_id === packageIds.adapter_library_entry_id &&
    imageEntry.adapter_library_entry_id === libraryEntry.adapter_library_entry_id &&
    imageEntry.package_id === packageIds.package_id &&
    videoEntry.cinematic_dna_id === imageEntry.cinematic_dna_id &&
    videoEntry.integration_id === imageEntry.integration_id
      ? 'PASS'
      : 'FAIL';

  const consumerReady =
    imageValid === 'PASS' &&
    videoValid === 'PASS' &&
    adapterMappingPreserved === 'PASS' &&
    traceability === 'PASS'
      ? 'PASS'
      : 'FAIL';

  return {
    source_video_id: sourceVideoId,
    image_bridge_valid: imageValid,
    video_bridge_valid: videoValid,
    adapter_mapping_preserved: adapterMappingPreserved,
    traceability_preserved: traceability,
    consumer_ready: consumerReady,
  };
}

function aggregateStatus(
  audits: SourceDnaConsumerBridgeAudit[],
  field: keyof SourceDnaConsumerBridgeAudit
): ValidationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

export function writeMovieAnalysisDnaConsumerBridgeValidationReport(
  projectRoot?: string
): MovieAnalysisDnaConsumerBridgeReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DnaConsumerBridgeIssue[] = [];
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

  const sourceAudits: SourceDnaConsumerBridgeAudit[] = [];

  if (imageBridge && videoBridge && dnaPackage && adapterLibrary) {
    if (imageBridge.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'IMAGE_SOURCE_COUNT_MISMATCH',
        message: `Image bridge source_count must be ${EXPECTED_SOURCE_COUNT}`,
        severity: 'error',
      });
    }

    if (videoBridge.source_count !== EXPECTED_SOURCE_COUNT) {
      issues.push({
        code: 'VIDEO_SOURCE_COUNT_MISMATCH',
        message: `Video bridge source_count must be ${EXPECTED_SOURCE_COUNT}`,
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
          code: 'SOURCE_BRIDGE_MISSING',
          message: `Missing bridge components for ${sourceVideoId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        });
        continue;
      }

      const audit = auditSource(imageEntry, videoEntry, libraryEntry, {
        cinematic_dna_id: packageSource.cinematic_dna_id,
        integration_id: packageSource.integration_id,
        adapter_library_entry_id: packageSource.adapter_library_entry_id,
        package_id: dnaPackage.package_id,
      });
      sourceAudits.push(audit);

      if (audit.consumer_ready === 'FAIL') {
        issues.push({
          code: 'SOURCE_NOT_CONSUMER_READY',
          message: `Consumer bridge not ready for ${sourceVideoId}`,
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

  const imageBridgeValid = aggregateStatus(sourceAudits, 'image_bridge_valid');
  const videoBridgeValid = aggregateStatus(sourceAudits, 'video_bridge_valid');
  const adapterMappingPreserved = aggregateStatus(sourceAudits, 'adapter_mapping_preserved');
  const traceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');
  const consumerReady = aggregateStatus(sourceAudits, 'consumer_ready');
  const planningOnlyStatus: ValidationStatus = safetyValid ? 'PASS' : 'FAIL';

  const pass =
    imageBridge !== null &&
    videoBridge !== null &&
    dnaPackage !== null &&
    adapterLibrary !== null &&
    imageBridge.source_count === EXPECTED_SOURCE_COUNT &&
    videoBridge.source_count === EXPECTED_SOURCE_COUNT &&
    imageBridgeValid === 'PASS' &&
    videoBridgeValid === 'PASS' &&
    adapterMappingPreserved === 'PASS' &&
    traceabilityPreserved === 'PASS' &&
    consumerReady === 'PASS' &&
    planningOnlyStatus === 'PASS' &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisDnaConsumerBridgeReport = {
    report_id: 'movie-analysis-dna-consumer-bridge-report-v1',
    phase: DNA_CONSUMER_BRIDGE_PHASE,
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
    image_bridge_valid: imageBridgeValid,
    video_bridge_valid: videoBridgeValid,
    adapter_mapping_preserved: adapterMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    consumer_ready: consumerReady,
    planning_only_status: planningOnlyStatus,
    source_audits: sourceAudits,
    final_verdict: pass ? DNA_CONSUMER_BRIDGE_PASS_VERDICT : DNA_CONSUMER_BRIDGE_FAIL_VERDICT,
    issues,
  };

  const outDir = path.join(root, 'exports', 'movie_analysis_dna_consumer_bridge');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(root, DNA_CONSUMER_BRIDGE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
