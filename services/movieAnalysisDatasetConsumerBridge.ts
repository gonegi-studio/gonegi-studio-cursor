import fs from 'node:fs';
import path from 'node:path';
import {
  type ExportSafetyFlags,
  type ImageAppExportPayload,
  type VideoAppExportPayload,
} from './movieAnalysisExportPackage.js';
import {
  DATASET_EXPORT_PASS_VERDICT,
  DATASET_PATH,
  EXPECTED_SOURCE_COUNT,
  type DatasetChainIds,
  type MovieAnalysisDataset,
  loadMovieAnalysisDataset,
} from './movieAnalysisDatasetExport.js';
import { DATASET_EXPORT_VALIDATION_REPORT_PATH } from './movieAnalysisDatasetExportValidator.js';
import { type PackageTraceEntry } from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CONSUMER_BRIDGE_PHASE =
  'PHASE-SOURCE-VIDEO-046-MOVIE_ANALYSIS_DATASET_CONSUMER_BRIDGE_V1' as const;
export const CONSUMER_BRIDGE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_DATASET_CONSUMER_BRIDGE_V1' as const;
export const CONSUMER_BRIDGE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_DATASET_CONSUMER_BRIDGE_V1' as const;
export const IMAGE_CONSUMER_BRIDGE_PATH =
  'exports/image_app/movie-analysis-image-consumer-bridge.json' as const;
export const VIDEO_CONSUMER_BRIDGE_PATH =
  'exports/video_app/movie-analysis-video-consumer-bridge.json' as const;

export type BridgeSafetySummary = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
};

export type ImageConsumerBridgeEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  chain_ids: Pick<
    DatasetChainIds,
    | 'analysis_plan_id'
    | 'gonegi_state_mapping_id'
    | 'video_state_compilation_id'
    | 'keyframe_preparation_id'
    | 'generation_blueprint_id'
    | 'final_runtime_bundle_id'
  >;
  package_trace: PackageTraceEntry[];
  payload_mapping: ImageAppExportPayload;
  safety: ExportSafetyFlags;
};

export type VideoConsumerBridgeEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  chain_ids: Pick<
    DatasetChainIds,
    | 'analysis_plan_id'
    | 'video_blueprint_id'
    | 'temporal_flow_id'
    | 'sequence_assembly_id'
    | 'motion_plan_id'
    | 'generation_blueprint_id'
    | 'final_runtime_bundle_id'
  >;
  package_trace: PackageTraceEntry[];
  payload_mapping: VideoAppExportPayload;
  safety: ExportSafetyFlags;
};

export type MovieAnalysisImageConsumerBridge = {
  bridge_id: string;
  bridge_type: 'movie_analysis_image_consumer_bridge';
  phase: typeof CONSUMER_BRIDGE_PHASE;
  consumer_target: 'image_app';
  generated_at: string;
  source_dataset_path: typeof DATASET_PATH;
  dataset_id: string;
  dataset_version: string;
  source_count: number;
  entries: ImageConsumerBridgeEntry[];
  safety_summary: BridgeSafetySummary;
};

export type MovieAnalysisVideoConsumerBridge = {
  bridge_id: string;
  bridge_type: 'movie_analysis_video_consumer_bridge';
  phase: typeof CONSUMER_BRIDGE_PHASE;
  consumer_target: 'video_app';
  generated_at: string;
  source_dataset_path: typeof DATASET_PATH;
  dataset_id: string;
  dataset_version: string;
  source_count: number;
  entries: VideoConsumerBridgeEntry[];
  safety_summary: BridgeSafetySummary;
};

export type ConsumerBridgeIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieAnalysisDatasetConsumerBridgeReport = {
  report_id: string;
  phase: typeof CONSUMER_BRIDGE_PHASE;
  timestamp: string;
  source_count: number;
  image_consumer_bridge_ready: boolean;
  video_consumer_bridge_ready: boolean;
  payload_mapping_valid: boolean;
  chain_ids_preserved: boolean;
  safety_flags_preserved: boolean;
  image_bridge_path: typeof IMAGE_CONSUMER_BRIDGE_PATH;
  video_bridge_path: typeof VIDEO_CONSUMER_BRIDGE_PATH;
  final_verdict: typeof CONSUMER_BRIDGE_PASS_VERDICT | typeof CONSUMER_BRIDGE_FAIL_VERDICT;
  issues: ConsumerBridgeIssue[];
};

const BRIDGE_SAFETY_SUMMARY: BridgeSafetySummary = {
  planning_only: true,
  runtime_execution: false,
  video_generation: false,
  image_generation: false,
  gpu_execution: false,
  ocr: false,
  external_call_allowed: false,
};

function payloadsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isImagePayloadReady(payload: ImageAppExportPayload | undefined): boolean {
  if (!payload) return false;
  return (
    payload.consumer_target === 'image_app' &&
    Boolean(payload.keyframe_preparation_id) &&
    Boolean(payload.gonegi_state_mapping_id) &&
    payload.character_generation_structure.length > 0 &&
    payload.emotion_generation_structure.length > 0 &&
    payload.character_bundle.length > 0 &&
    payload.emotion_bundle.length > 0
  );
}

function isVideoPayloadReady(payload: VideoAppExportPayload | undefined): boolean {
  if (!payload) return false;
  return (
    payload.consumer_target === 'video_app' &&
    Boolean(payload.video_blueprint_id) &&
    Boolean(payload.temporal_flow_id) &&
    payload.scene_generation_structure.length > 0 &&
    payload.camera_generation_structure.length > 0 &&
    payload.scene_bundle.length > 0 &&
    payload.runtime_bundle.length > 0
  );
}

function areEntrySafetyFlagsPreserved(safety: ExportSafetyFlags | undefined): boolean {
  if (!safety) return false;
  return (
    safety.planning_only === true &&
    safety.design_only === true &&
    safety.runtime_execution === false &&
    safety.video_generation === false &&
    safety.image_generation === false &&
    safety.gpu_execution === false &&
    safety.external_call_allowed === false
  );
}

export function buildImageConsumerBridge(dataset: MovieAnalysisDataset): MovieAnalysisImageConsumerBridge {
  const entries: ImageConsumerBridgeEntry[] = dataset.sources.map((source) => {
    const chain = dataset.chain_ids[source.source_video_id];
    const payload = dataset.image_app_payloads[source.source_video_id];
    const safety = dataset.safety_flags.per_source[source.source_video_id];

    return {
      source_video_id: source.source_video_id,
      source_video_path: source.source_video_path,
      master_package_id: source.master_package_id,
      final_runtime_bundle_id: source.final_runtime_bundle_id,
      generation_blueprint_id: source.generation_blueprint_id,
      chain_ids: {
        analysis_plan_id: chain.analysis_plan_id,
        gonegi_state_mapping_id: chain.gonegi_state_mapping_id,
        video_state_compilation_id: chain.video_state_compilation_id,
        keyframe_preparation_id: chain.keyframe_preparation_id,
        generation_blueprint_id: chain.generation_blueprint_id,
        final_runtime_bundle_id: chain.final_runtime_bundle_id,
      },
      package_trace: dataset.package_traces[source.source_video_id],
      payload_mapping: payload,
      safety,
    };
  });

  return {
    bridge_id: 'movie-analysis-image-consumer-bridge-v1',
    bridge_type: 'movie_analysis_image_consumer_bridge',
    phase: CONSUMER_BRIDGE_PHASE,
    consumer_target: 'image_app',
    generated_at: new Date().toISOString(),
    source_dataset_path: DATASET_PATH,
    dataset_id: dataset.dataset_id,
    dataset_version: dataset.dataset_version,
    source_count: dataset.source_count,
    entries,
    safety_summary: BRIDGE_SAFETY_SUMMARY,
  };
}

export function buildVideoConsumerBridge(dataset: MovieAnalysisDataset): MovieAnalysisVideoConsumerBridge {
  const entries: VideoConsumerBridgeEntry[] = dataset.sources.map((source) => {
    const chain = dataset.chain_ids[source.source_video_id];
    const payload = dataset.video_app_payloads[source.source_video_id];
    const safety = dataset.safety_flags.per_source[source.source_video_id];

    return {
      source_video_id: source.source_video_id,
      source_video_path: source.source_video_path,
      master_package_id: source.master_package_id,
      final_runtime_bundle_id: source.final_runtime_bundle_id,
      generation_blueprint_id: source.generation_blueprint_id,
      chain_ids: {
        analysis_plan_id: chain.analysis_plan_id,
        video_blueprint_id: chain.video_blueprint_id,
        temporal_flow_id: chain.temporal_flow_id,
        sequence_assembly_id: chain.sequence_assembly_id,
        motion_plan_id: chain.motion_plan_id,
        generation_blueprint_id: chain.generation_blueprint_id,
        final_runtime_bundle_id: chain.final_runtime_bundle_id,
      },
      package_trace: dataset.package_traces[source.source_video_id],
      payload_mapping: payload,
      safety,
    };
  });

  return {
    bridge_id: 'movie-analysis-video-consumer-bridge-v1',
    bridge_type: 'movie_analysis_video_consumer_bridge',
    phase: CONSUMER_BRIDGE_PHASE,
    consumer_target: 'video_app',
    generated_at: new Date().toISOString(),
    source_dataset_path: DATASET_PATH,
    dataset_id: dataset.dataset_id,
    dataset_version: dataset.dataset_version,
    source_count: dataset.source_count,
    entries,
    safety_summary: BRIDGE_SAFETY_SUMMARY,
  };
}

function validateBridges(
  dataset: MovieAnalysisDataset,
  imageBridge: MovieAnalysisImageConsumerBridge,
  videoBridge: MovieAnalysisVideoConsumerBridge,
  issues: ConsumerBridgeIssue[]
): {
  imageConsumerBridgeReady: boolean;
  videoConsumerBridgeReady: boolean;
  payloadMappingValid: boolean;
  chainIdsPreserved: boolean;
  safetyFlagsPreserved: boolean;
} {
  let imageReady = imageBridge.source_count === EXPECTED_SOURCE_COUNT;
  let videoReady = videoBridge.source_count === EXPECTED_SOURCE_COUNT;
  let payloadValid = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let chainPreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let safetyPreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;

  for (const source of dataset.sources) {
    const imageEntry = imageBridge.entries.find((e) => e.source_video_id === source.source_video_id);
    const videoEntry = videoBridge.entries.find((e) => e.source_video_id === source.source_video_id);
    const datasetPayloadImage = dataset.image_app_payloads[source.source_video_id];
    const datasetPayloadVideo = dataset.video_app_payloads[source.source_video_id];
    const datasetChain = dataset.chain_ids[source.source_video_id];
    const datasetSafety = dataset.safety_flags.per_source[source.source_video_id];

    const imageOk = imageEntry ? isImagePayloadReady(imageEntry.payload_mapping) : false;
    const videoOk = videoEntry ? isVideoPayloadReady(videoEntry.payload_mapping) : false;

    const payloadOk =
      imageEntry &&
      videoEntry &&
      payloadsEqual(imageEntry.payload_mapping, datasetPayloadImage) &&
      payloadsEqual(videoEntry.payload_mapping, datasetPayloadVideo);

    const chainOk =
      imageEntry &&
      videoEntry &&
      payloadsEqual(imageEntry.chain_ids, {
        analysis_plan_id: datasetChain.analysis_plan_id,
        gonegi_state_mapping_id: datasetChain.gonegi_state_mapping_id,
        video_state_compilation_id: datasetChain.video_state_compilation_id,
        keyframe_preparation_id: datasetChain.keyframe_preparation_id,
        generation_blueprint_id: datasetChain.generation_blueprint_id,
        final_runtime_bundle_id: datasetChain.final_runtime_bundle_id,
      }) &&
      payloadsEqual(videoEntry.chain_ids, {
        analysis_plan_id: datasetChain.analysis_plan_id,
        video_blueprint_id: datasetChain.video_blueprint_id,
        temporal_flow_id: datasetChain.temporal_flow_id,
        sequence_assembly_id: datasetChain.sequence_assembly_id,
        motion_plan_id: datasetChain.motion_plan_id,
        generation_blueprint_id: datasetChain.generation_blueprint_id,
        final_runtime_bundle_id: datasetChain.final_runtime_bundle_id,
      }) &&
      payloadsEqual(imageEntry.package_trace, dataset.package_traces[source.source_video_id]) &&
      payloadsEqual(videoEntry.package_trace, dataset.package_traces[source.source_video_id]);

    const safetyOk =
      imageEntry &&
      videoEntry &&
      areEntrySafetyFlagsPreserved(imageEntry.safety) &&
      areEntrySafetyFlagsPreserved(videoEntry.safety) &&
      payloadsEqual(imageEntry.safety, datasetSafety) &&
      payloadsEqual(videoEntry.safety, datasetSafety);

    if (!imageOk) {
      imageReady = false;
      issues.push({
        code: 'IMAGE_BRIDGE_NOT_READY',
        message: `Image consumer bridge not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!videoOk) {
      videoReady = false;
      issues.push({
        code: 'VIDEO_BRIDGE_NOT_READY',
        message: `Video consumer bridge not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!payloadOk) {
      payloadValid = false;
      issues.push({
        code: 'PAYLOAD_MAPPING_INVALID',
        message: `Payload mapping invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!chainOk) {
      chainPreserved = false;
      issues.push({
        code: 'CHAIN_IDS_NOT_PRESERVED',
        message: `Chain IDs not preserved for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!safetyOk) {
      safetyPreserved = false;
      issues.push({
        code: 'SAFETY_FLAGS_NOT_PRESERVED',
        message: `Safety flags not preserved for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
  }

  const summary = dataset.safety_flags.summary;
  if (
    summary.planning_only !== true ||
    summary.runtime_execution !== false ||
    summary.video_generation !== false ||
    summary.image_generation !== false ||
    summary.gpu_execution !== false ||
    summary.ocr !== false ||
    summary.external_call_allowed !== false
  ) {
    safetyPreserved = false;
    issues.push({
      code: 'DATASET_SAFETY_SUMMARY_INVALID',
      message: 'Dataset safety summary not preserved in bridge',
      severity: 'error',
    });
  }

  return {
    imageConsumerBridgeReady: imageReady,
    videoConsumerBridgeReady: videoReady,
    payloadMappingValid: payloadValid,
    chainIdsPreserved: chainPreserved,
    safetyFlagsPreserved: safetyPreserved,
  };
}

export function writeMovieAnalysisDatasetConsumerBridge(
  projectRoot?: string
): MovieAnalysisDatasetConsumerBridgeReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ConsumerBridgeIssue[] = [];
  const timestamp = new Date().toISOString();

  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
  }

  const datasetValidationPath = path.join(root, DATASET_EXPORT_VALIDATION_REPORT_PATH);
  if (!fs.existsSync(datasetValidationPath)) {
    issues.push({
      code: 'DATASET_VALIDATION_MISSING',
      message: `Missing ${DATASET_EXPORT_VALIDATION_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const datasetValidation = JSON.parse(fs.readFileSync(datasetValidationPath, 'utf8')) as {
      final_verdict?: string;
    };
    if (datasetValidation.final_verdict !== DATASET_EXPORT_PASS_VERDICT) {
      issues.push({
        code: 'DATASET_NOT_PASS',
        message: `Dataset export must have ${DATASET_EXPORT_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  if (!dataset) {
    return {
      report_id: 'movie-analysis-dataset-consumer-bridge-report-v1',
      phase: CONSUMER_BRIDGE_PHASE,
      timestamp,
      source_count: 0,
      image_consumer_bridge_ready: false,
      video_consumer_bridge_ready: false,
      payload_mapping_valid: false,
      chain_ids_preserved: false,
      safety_flags_preserved: false,
      image_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
      video_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
      final_verdict: CONSUMER_BRIDGE_FAIL_VERDICT,
      issues,
    };
  }

  if (dataset.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}, got ${dataset.source_count}`,
      severity: 'error',
    });
  }

  const imageBridge = buildImageConsumerBridge(dataset);
  const videoBridge = buildVideoConsumerBridge(dataset);

  const checks = validateBridges(dataset, imageBridge, videoBridge, issues);

  fs.mkdirSync(path.join(root, 'exports/image_app'), { recursive: true });
  fs.mkdirSync(path.join(root, 'exports/video_app'), { recursive: true });

  fs.writeFileSync(
    path.join(root, IMAGE_CONSUMER_BRIDGE_PATH),
    `${JSON.stringify(imageBridge, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_CONSUMER_BRIDGE_PATH),
    `${JSON.stringify(videoBridge, null, 2)}\n`,
    'utf8'
  );

  const pass =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    checks.imageConsumerBridgeReady &&
    checks.videoConsumerBridgeReady &&
    checks.payloadMappingValid &&
    checks.chainIdsPreserved &&
    checks.safetyFlagsPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'movie-analysis-dataset-consumer-bridge-report-v1',
    phase: CONSUMER_BRIDGE_PHASE,
    timestamp,
    source_count: dataset.source_count,
    image_consumer_bridge_ready: checks.imageConsumerBridgeReady,
    video_consumer_bridge_ready: checks.videoConsumerBridgeReady,
    payload_mapping_valid: checks.payloadMappingValid,
    chain_ids_preserved: checks.chainIdsPreserved,
    safety_flags_preserved: checks.safetyFlagsPreserved,
    image_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
    video_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
    final_verdict: pass ? CONSUMER_BRIDGE_PASS_VERDICT : CONSUMER_BRIDGE_FAIL_VERDICT,
    issues,
  };
}

export function loadImageConsumerBridge(
  projectRoot?: string
): MovieAnalysisImageConsumerBridge | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, IMAGE_CONSUMER_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageConsumerBridge;
}

export function loadVideoConsumerBridge(
  projectRoot?: string
): MovieAnalysisVideoConsumerBridge | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_CONSUMER_BRIDGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoConsumerBridge;
}
