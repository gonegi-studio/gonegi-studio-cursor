import fs from 'node:fs';
import path from 'node:path';
import {
  type ExportSafetyFlags,
  type ImageAppExportPayload,
  type VideoAppExportPayload,
} from './movieAnalysisExportPackage.js';
import {
  type ImageConsumerBridgeEntry,
  type VideoConsumerBridgeEntry,
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
  loadImageConsumerBridge,
  loadVideoConsumerBridge,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  DATASET_PATH,
  EXPECTED_SOURCE_COUNT,
  type MovieAnalysisDataset,
  loadMovieAnalysisDataset,
} from './movieAnalysisDatasetExport.js';
import { TRACE_DEFINITIONS, type PackageTraceEntry } from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const UPLOAD_BUNDLE_PHASE =
  'PHASE-SOURCE-VIDEO-048-MOVIE_ANALYSIS_UPLOAD_BUNDLE_V1' as const;
export const UPLOAD_BUNDLE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_UPLOAD_BUNDLE_V1' as const;
export const UPLOAD_BUNDLE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_UPLOAD_BUNDLE_V1' as const;
export const UPLOAD_BUNDLE_DIR = 'exports/movie_analysis_upload_bundle' as const;
export const IMAGE_UPLOAD_PATH =
  'exports/movie_analysis_upload_bundle/movie-analysis-image-upload.json' as const;
export const VIDEO_UPLOAD_PATH =
  'exports/movie_analysis_upload_bundle/movie-analysis-video-upload.json' as const;
export const UPLOAD_MANIFEST_PATH =
  'exports/movie_analysis_upload_bundle/movie-analysis-upload-manifest.json' as const;
export const UPLOAD_REPORT_PATH =
  'exports/movie_analysis_upload_bundle/movie-analysis-upload-report.json' as const;

export { EXPECTED_SOURCE_COUNT };

export type UploadSafetySummary = {
  planning_only: true;
  runtime_execution: false;
  video_generation: false;
  image_generation: false;
  gpu_execution: false;
  ocr: false;
  external_call_allowed: false;
};

export type ImageUploadEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  dataset_id: string;
  bridge_id: string;
  package_trace: PackageTraceEntry[];
  chain_ids: ImageConsumerBridgeEntry['chain_ids'];
  upload_payload: ImageAppExportPayload;
  safety: ExportSafetyFlags;
};

export type VideoUploadEntry = {
  source_video_id: string;
  source_video_path: string;
  master_package_id: string;
  final_runtime_bundle_id: string;
  generation_blueprint_id: string;
  dataset_id: string;
  bridge_id: string;
  package_trace: PackageTraceEntry[];
  chain_ids: VideoConsumerBridgeEntry['chain_ids'];
  upload_payload: VideoAppExportPayload;
  safety: ExportSafetyFlags;
};

export type MovieAnalysisImageUpload = {
  upload_id: string;
  upload_type: 'movie_analysis_image_upload';
  phase: typeof UPLOAD_BUNDLE_PHASE;
  upload_target: 'image_app';
  generated_at: string;
  source_dataset_path: typeof DATASET_PATH;
  source_bridge_path: typeof IMAGE_CONSUMER_BRIDGE_PATH;
  dataset_id: string;
  dataset_version: string;
  bridge_id: string;
  source_count: number;
  upload_entries: ImageUploadEntry[];
  safety_summary: UploadSafetySummary;
};

export type MovieAnalysisVideoUpload = {
  upload_id: string;
  upload_type: 'movie_analysis_video_upload';
  phase: typeof UPLOAD_BUNDLE_PHASE;
  upload_target: 'video_app';
  generated_at: string;
  source_dataset_path: typeof DATASET_PATH;
  source_bridge_path: typeof VIDEO_CONSUMER_BRIDGE_PATH;
  dataset_id: string;
  dataset_version: string;
  bridge_id: string;
  source_count: number;
  upload_entries: VideoUploadEntry[];
  safety_summary: UploadSafetySummary;
};

export type MovieAnalysisUploadManifestEntry = {
  source_video_id: string;
  master_package_id: string;
  source_video_path: string;
  image_upload_ready: boolean;
  video_upload_ready: boolean;
};

export type MovieAnalysisUploadManifest = {
  manifest_id: string;
  phase: typeof UPLOAD_BUNDLE_PHASE;
  generated_at: string;
  dataset_path: typeof DATASET_PATH;
  image_bridge_path: typeof IMAGE_CONSUMER_BRIDGE_PATH;
  video_bridge_path: typeof VIDEO_CONSUMER_BRIDGE_PATH;
  image_upload_path: typeof IMAGE_UPLOAD_PATH;
  video_upload_path: typeof VIDEO_UPLOAD_PATH;
  consumer_targets: ['image_app', 'video_app'];
  source_count: number;
  entries: MovieAnalysisUploadManifestEntry[];
};

export type UploadBundleIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieAnalysisUploadReport = {
  report_id: string;
  phase: typeof UPLOAD_BUNDLE_PHASE;
  timestamp: string;
  source_count: number;
  image_upload_ready: boolean;
  video_upload_ready: boolean;
  dataset_linked: boolean;
  bridge_trace_preserved: boolean;
  safety_flags_preserved: boolean;
  image_upload_path: typeof IMAGE_UPLOAD_PATH;
  video_upload_path: typeof VIDEO_UPLOAD_PATH;
  manifest_path: typeof UPLOAD_MANIFEST_PATH;
  final_verdict: typeof UPLOAD_BUNDLE_PASS_VERDICT | typeof UPLOAD_BUNDLE_FAIL_VERDICT;
  issues: UploadBundleIssue[];
};

const UPLOAD_SAFETY_SUMMARY: UploadSafetySummary = {
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

function isImageUploadEntryReady(entry: ImageUploadEntry, projectRoot: string): boolean {
  return (
    Boolean(entry.source_video_id) &&
    Boolean(entry.upload_payload.keyframe_preparation_id) &&
    entry.upload_payload.consumer_target === 'image_app' &&
    entry.upload_payload.character_bundle.length > 0 &&
    entry.upload_payload.emotion_bundle.length > 0 &&
    fs.existsSync(path.join(projectRoot, entry.source_video_path))
  );
}

function isVideoUploadEntryReady(entry: VideoUploadEntry, projectRoot: string): boolean {
  return (
    Boolean(entry.source_video_id) &&
    Boolean(entry.upload_payload.video_blueprint_id) &&
    entry.upload_payload.consumer_target === 'video_app' &&
    entry.upload_payload.scene_bundle.length > 0 &&
    entry.upload_payload.runtime_bundle.length > 0 &&
    fs.existsSync(path.join(projectRoot, entry.source_video_path))
  );
}

function isPackageTraceValid(trace: PackageTraceEntry[]): boolean {
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

function areSafetyFlagsPreserved(safety: ExportSafetyFlags): boolean {
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

export function buildMovieAnalysisImageUpload(
  dataset: MovieAnalysisDataset,
  imageBridge: NonNullable<ReturnType<typeof loadImageConsumerBridge>>
): MovieAnalysisImageUpload {
  const uploadEntries: ImageUploadEntry[] = imageBridge.entries.map((entry) => ({
    source_video_id: entry.source_video_id,
    source_video_path: entry.source_video_path,
    master_package_id: entry.master_package_id,
    final_runtime_bundle_id: entry.final_runtime_bundle_id,
    generation_blueprint_id: entry.generation_blueprint_id,
    dataset_id: dataset.dataset_id,
    bridge_id: imageBridge.bridge_id,
    package_trace: entry.package_trace,
    chain_ids: entry.chain_ids,
    upload_payload: entry.payload_mapping,
    safety: entry.safety,
  }));

  return {
    upload_id: 'movie-analysis-image-upload-v1',
    upload_type: 'movie_analysis_image_upload',
    phase: UPLOAD_BUNDLE_PHASE,
    upload_target: 'image_app',
    generated_at: new Date().toISOString(),
    source_dataset_path: DATASET_PATH,
    source_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
    dataset_id: dataset.dataset_id,
    dataset_version: dataset.dataset_version,
    bridge_id: imageBridge.bridge_id,
    source_count: uploadEntries.length,
    upload_entries: uploadEntries,
    safety_summary: UPLOAD_SAFETY_SUMMARY,
  };
}

export function buildMovieAnalysisVideoUpload(
  dataset: MovieAnalysisDataset,
  videoBridge: NonNullable<ReturnType<typeof loadVideoConsumerBridge>>
): MovieAnalysisVideoUpload {
  const uploadEntries: VideoUploadEntry[] = videoBridge.entries.map((entry) => ({
    source_video_id: entry.source_video_id,
    source_video_path: entry.source_video_path,
    master_package_id: entry.master_package_id,
    final_runtime_bundle_id: entry.final_runtime_bundle_id,
    generation_blueprint_id: entry.generation_blueprint_id,
    dataset_id: dataset.dataset_id,
    bridge_id: videoBridge.bridge_id,
    package_trace: entry.package_trace,
    chain_ids: entry.chain_ids,
    upload_payload: entry.payload_mapping,
    safety: entry.safety,
  }));

  return {
    upload_id: 'movie-analysis-video-upload-v1',
    upload_type: 'movie_analysis_video_upload',
    phase: UPLOAD_BUNDLE_PHASE,
    upload_target: 'video_app',
    generated_at: new Date().toISOString(),
    source_dataset_path: DATASET_PATH,
    source_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
    dataset_id: dataset.dataset_id,
    dataset_version: dataset.dataset_version,
    bridge_id: videoBridge.bridge_id,
    source_count: uploadEntries.length,
    upload_entries: uploadEntries,
    safety_summary: UPLOAD_SAFETY_SUMMARY,
  };
}

function validateUploadBundle(
  projectRoot: string,
  dataset: MovieAnalysisDataset,
  imageBridge: NonNullable<ReturnType<typeof loadImageConsumerBridge>>,
  videoBridge: NonNullable<ReturnType<typeof loadVideoConsumerBridge>>,
  imageUpload: MovieAnalysisImageUpload,
  videoUpload: MovieAnalysisVideoUpload,
  issues: UploadBundleIssue[]
): {
  imageUploadReady: boolean;
  videoUploadReady: boolean;
  datasetLinked: boolean;
  bridgeTracePreserved: boolean;
  safetyFlagsPreserved: boolean;
} {
  let imageReady = imageUpload.source_count === EXPECTED_SOURCE_COUNT;
  let videoReady = videoUpload.source_count === EXPECTED_SOURCE_COUNT;
  let datasetLinked = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let tracePreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let safetyPreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;

  const datasetLinkOk =
    imageUpload.dataset_id === dataset.dataset_id &&
    videoUpload.dataset_id === dataset.dataset_id &&
    imageUpload.dataset_version === dataset.dataset_version &&
    videoUpload.dataset_version === dataset.dataset_version &&
    imageBridge.dataset_id === dataset.dataset_id &&
    videoBridge.dataset_id === dataset.dataset_id;

  if (!datasetLinkOk) {
    datasetLinked = false;
    issues.push({
      code: 'DATASET_LINK_INVALID',
      message: 'Upload bundle dataset linkage invalid',
      severity: 'error',
    });
  }

  for (const source of dataset.sources) {
    const imageEntry = imageUpload.upload_entries.find(
      (e) => e.source_video_id === source.source_video_id
    );
    const videoEntry = videoUpload.upload_entries.find(
      (e) => e.source_video_id === source.source_video_id
    );
    const bridgeImage = imageBridge.entries.find(
      (e) => e.source_video_id === source.source_video_id
    );
    const bridgeVideo = videoBridge.entries.find(
      (e) => e.source_video_id === source.source_video_id
    );

    const imageOk = imageEntry ? isImageUploadEntryReady(imageEntry, projectRoot) : false;
    const videoOk = videoEntry ? isVideoUploadEntryReady(videoEntry, projectRoot) : false;

    const linkOk =
      imageEntry &&
      videoEntry &&
      imageEntry.dataset_id === dataset.dataset_id &&
      payloadsEqual(imageEntry.upload_payload, dataset.image_app_payloads[source.source_video_id]) &&
      payloadsEqual(videoEntry.upload_payload, dataset.video_app_payloads[source.source_video_id]);

    const traceOk =
      imageEntry &&
      videoEntry &&
      bridgeImage &&
      bridgeVideo &&
      isPackageTraceValid(imageEntry.package_trace) &&
      isPackageTraceValid(videoEntry.package_trace) &&
      payloadsEqual(imageEntry.package_trace, bridgeImage.package_trace) &&
      payloadsEqual(videoEntry.package_trace, bridgeVideo.package_trace) &&
      payloadsEqual(imageEntry.package_trace, dataset.package_traces[source.source_video_id]);

    const safetyOk =
      imageEntry &&
      videoEntry &&
      areSafetyFlagsPreserved(imageEntry.safety) &&
      areSafetyFlagsPreserved(videoEntry.safety) &&
      payloadsEqual(imageEntry.safety, dataset.safety_flags.per_source[source.source_video_id]);

    if (!imageOk) {
      imageReady = false;
      issues.push({
        code: 'IMAGE_UPLOAD_NOT_READY',
        message: `Image upload not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!videoOk) {
      videoReady = false;
      issues.push({
        code: 'VIDEO_UPLOAD_NOT_READY',
        message: `Video upload not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!linkOk) {
      datasetLinked = false;
      issues.push({
        code: 'DATASET_LINK_FAIL',
        message: `Dataset link failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!traceOk) {
      tracePreserved = false;
      issues.push({
        code: 'BRIDGE_TRACE_NOT_PRESERVED',
        message: `Bridge trace not preserved for ${source.source_video_id}`,
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

  return {
    imageUploadReady: imageReady,
    videoUploadReady: videoReady,
    datasetLinked: datasetLinked && datasetLinkOk,
    bridgeTracePreserved: tracePreserved,
    safetyFlagsPreserved: safetyPreserved,
  };
}

export function writeMovieAnalysisUploadBundle(
  projectRoot?: string
): MovieAnalysisUploadReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: UploadBundleIssue[] = [];
  const timestamp = new Date().toISOString();

  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
  }

  const imageBridge = loadImageConsumerBridge(root);
  if (!imageBridge) {
    issues.push({
      code: 'IMAGE_BRIDGE_MISSING',
      message: `Missing ${IMAGE_CONSUMER_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  const videoBridge = loadVideoConsumerBridge(root);
  if (!videoBridge) {
    issues.push({
      code: 'VIDEO_BRIDGE_MISSING',
      message: `Missing ${VIDEO_CONSUMER_BRIDGE_PATH}`,
      severity: 'error',
    });
  }

  if (!dataset || !imageBridge || !videoBridge) {
    const report: MovieAnalysisUploadReport = {
      report_id: 'movie-analysis-upload-report-v1',
      phase: UPLOAD_BUNDLE_PHASE,
      timestamp,
      source_count: 0,
      image_upload_ready: false,
      video_upload_ready: false,
      dataset_linked: false,
      bridge_trace_preserved: false,
      safety_flags_preserved: false,
      image_upload_path: IMAGE_UPLOAD_PATH,
      video_upload_path: VIDEO_UPLOAD_PATH,
      manifest_path: UPLOAD_MANIFEST_PATH,
      final_verdict: UPLOAD_BUNDLE_FAIL_VERDICT,
      issues,
    };
    return report;
  }

  const imageUpload = buildMovieAnalysisImageUpload(dataset, imageBridge);
  const videoUpload = buildMovieAnalysisVideoUpload(dataset, videoBridge);

  const checks = validateUploadBundle(
    root,
    dataset,
    imageBridge,
    videoBridge,
    imageUpload,
    videoUpload,
    issues
  );

  const manifest: MovieAnalysisUploadManifest = {
    manifest_id: 'movie-analysis-upload-manifest-v1',
    phase: UPLOAD_BUNDLE_PHASE,
    generated_at: timestamp,
    dataset_path: DATASET_PATH,
    image_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
    video_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
    image_upload_path: IMAGE_UPLOAD_PATH,
    video_upload_path: VIDEO_UPLOAD_PATH,
    consumer_targets: ['image_app', 'video_app'],
    source_count: dataset.source_count,
    entries: dataset.sources.map((source) => {
      const imageEntry = imageUpload.upload_entries.find(
        (e) => e.source_video_id === source.source_video_id
      );
      const videoEntry = videoUpload.upload_entries.find(
        (e) => e.source_video_id === source.source_video_id
      );
      return {
        source_video_id: source.source_video_id,
        master_package_id: source.master_package_id,
        source_video_path: source.source_video_path,
        image_upload_ready: imageEntry
          ? isImageUploadEntryReady(imageEntry, root)
          : false,
        video_upload_ready: videoEntry ? isVideoUploadEntryReady(videoEntry, root) : false,
      };
    }),
  };

  const outDir = path.join(root, UPLOAD_BUNDLE_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, IMAGE_UPLOAD_PATH),
    `${JSON.stringify(imageUpload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, VIDEO_UPLOAD_PATH),
    `${JSON.stringify(videoUpload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, UPLOAD_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const pass =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    checks.imageUploadReady &&
    checks.videoUploadReady &&
    checks.datasetLinked &&
    checks.bridgeTracePreserved &&
    checks.safetyFlagsPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisUploadReport = {
    report_id: 'movie-analysis-upload-report-v1',
    phase: UPLOAD_BUNDLE_PHASE,
    timestamp,
    source_count: dataset.source_count,
    image_upload_ready: checks.imageUploadReady,
    video_upload_ready: checks.videoUploadReady,
    dataset_linked: checks.datasetLinked,
    bridge_trace_preserved: checks.bridgeTracePreserved,
    safety_flags_preserved: checks.safetyFlagsPreserved,
    image_upload_path: IMAGE_UPLOAD_PATH,
    video_upload_path: VIDEO_UPLOAD_PATH,
    manifest_path: UPLOAD_MANIFEST_PATH,
    final_verdict: pass ? UPLOAD_BUNDLE_PASS_VERDICT : UPLOAD_BUNDLE_FAIL_VERDICT,
    issues,
  };

  fs.writeFileSync(
    path.join(root, UPLOAD_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export function loadMovieAnalysisImageUpload(
  projectRoot?: string
): MovieAnalysisImageUpload | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, IMAGE_UPLOAD_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageUpload;
}

export function loadMovieAnalysisVideoUpload(
  projectRoot?: string
): MovieAnalysisVideoUpload | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, VIDEO_UPLOAD_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisVideoUpload;
}

export function loadMovieAnalysisUploadManifest(
  projectRoot?: string
): MovieAnalysisUploadManifest | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, UPLOAD_MANIFEST_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisUploadManifest;
}
