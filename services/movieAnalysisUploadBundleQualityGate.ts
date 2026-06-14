import fs from 'node:fs';
import path from 'node:path';
import { loadMovieAnalysisDataset } from './movieAnalysisDatasetExport.js';
import { TRACE_DEFINITIONS } from './movieAnalysisMasterPackageDesign.js';
import {
  EXPECTED_SOURCE_COUNT,
  IMAGE_UPLOAD_PATH,
  type ImageUploadEntry,
  type MovieAnalysisImageUpload,
  type MovieAnalysisUploadManifest,
  type MovieAnalysisVideoUpload,
  type VideoUploadEntry,
  UPLOAD_MANIFEST_PATH,
  VIDEO_UPLOAD_PATH,
  loadMovieAnalysisImageUpload,
  loadMovieAnalysisUploadManifest,
  loadMovieAnalysisVideoUpload,
} from './movieAnalysisUploadBundle.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const UPLOAD_BUNDLE_QUALITY_GATE_PHASE =
  'PHASE-SOURCE-VIDEO-049-MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE_V1' as const;
export const UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE_V1' as const;
export const UPLOAD_BUNDLE_QUALITY_GATE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE_V1' as const;
export const UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH =
  'reports/movie-analysis-upload-bundle-quality-gate-report.json' as const;
export const UPLOAD_BUNDLE_QUALITY_GATE_MD_PATH =
  'reports/MOVIE_ANALYSIS_UPLOAD_BUNDLE_QUALITY_GATE.md' as const;

export { EXPECTED_SOURCE_COUNT };

export type QualityGateIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type MovieAnalysisUploadBundleQualityGateReport = {
  report_id: string;
  phase: typeof UPLOAD_BUNDLE_QUALITY_GATE_PHASE;
  timestamp: string;
  source_count: number;
  image_upload_schema_valid: boolean;
  video_upload_schema_valid: boolean;
  manifest_links_valid: boolean;
  dataset_links_valid: boolean;
  package_trace_preserved: boolean;
  chain_ids_preserved: boolean;
  safety_flags_preserved: boolean;
  no_runtime_execution: boolean;
  no_video_generation: boolean;
  no_image_generation: boolean;
  no_gpu_execution: boolean;
  final_verdict:
    | typeof UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT
    | typeof UPLOAD_BUNDLE_QUALITY_GATE_FAIL_VERDICT;
  issues: QualityGateIssue[];
};

const IMAGE_UPLOAD_SCHEMA_FIELDS = [
  'upload_id',
  'upload_type',
  'phase',
  'upload_target',
  'generated_at',
  'source_dataset_path',
  'source_bridge_path',
  'dataset_id',
  'dataset_version',
  'bridge_id',
  'source_count',
  'upload_entries',
  'safety_summary',
] as const;

const VIDEO_UPLOAD_SCHEMA_FIELDS = [
  'upload_id',
  'upload_type',
  'phase',
  'upload_target',
  'generated_at',
  'source_dataset_path',
  'source_bridge_path',
  'dataset_id',
  'dataset_version',
  'bridge_id',
  'source_count',
  'upload_entries',
  'safety_summary',
] as const;

const IMAGE_UPLOAD_ENTRY_FIELDS = [
  'source_video_id',
  'source_video_path',
  'master_package_id',
  'final_runtime_bundle_id',
  'generation_blueprint_id',
  'dataset_id',
  'bridge_id',
  'package_trace',
  'chain_ids',
  'upload_payload',
  'safety',
] as const;

const VIDEO_UPLOAD_ENTRY_FIELDS = [
  'source_video_id',
  'source_video_path',
  'master_package_id',
  'final_runtime_bundle_id',
  'generation_blueprint_id',
  'dataset_id',
  'bridge_id',
  'package_trace',
  'chain_ids',
  'upload_payload',
  'safety',
] as const;

const MANIFEST_SCHEMA_FIELDS = [
  'manifest_id',
  'phase',
  'generated_at',
  'dataset_path',
  'image_bridge_path',
  'video_bridge_path',
  'image_upload_path',
  'video_upload_path',
  'consumer_targets',
  'source_count',
  'entries',
] as const;

function payloadsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function hasSchemaFields(record: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => field in record);
}

function isImageUploadSchemaValid(imageUpload: MovieAnalysisImageUpload): boolean {
  const root = imageUpload as unknown as Record<string, unknown>;
  if (!hasSchemaFields(root, IMAGE_UPLOAD_SCHEMA_FIELDS)) {
    return false;
  }
  if (
    imageUpload.upload_type !== 'movie_analysis_image_upload' ||
    imageUpload.upload_target !== 'image_app' ||
    !Array.isArray(imageUpload.upload_entries) ||
    imageUpload.upload_entries.length === 0
  ) {
    return false;
  }
  return imageUpload.upload_entries.every((entry) =>
    hasSchemaFields(entry as unknown as Record<string, unknown>, IMAGE_UPLOAD_ENTRY_FIELDS)
  );
}

function isVideoUploadSchemaValid(videoUpload: MovieAnalysisVideoUpload): boolean {
  const root = videoUpload as unknown as Record<string, unknown>;
  if (!hasSchemaFields(root, VIDEO_UPLOAD_SCHEMA_FIELDS)) {
    return false;
  }
  if (
    videoUpload.upload_type !== 'movie_analysis_video_upload' ||
    videoUpload.upload_target !== 'video_app' ||
    !Array.isArray(videoUpload.upload_entries) ||
    videoUpload.upload_entries.length === 0
  ) {
    return false;
  }
  return videoUpload.upload_entries.every((entry) =>
    hasSchemaFields(entry as unknown as Record<string, unknown>, VIDEO_UPLOAD_ENTRY_FIELDS)
  );
}

function isManifestLinksValid(
  projectRoot: string,
  manifest: MovieAnalysisUploadManifest
): boolean {
  const root = manifest as unknown as Record<string, unknown>;
  if (!hasSchemaFields(root, MANIFEST_SCHEMA_FIELDS)) {
    return false;
  }
  if (
    manifest.consumer_targets[0] !== 'image_app' ||
    manifest.consumer_targets[1] !== 'video_app'
  ) {
    return false;
  }

  const linkedPaths = [
    manifest.dataset_path,
    manifest.image_bridge_path,
    manifest.video_bridge_path,
    manifest.image_upload_path,
    manifest.video_upload_path,
  ];

  return linkedPaths.every((relPath) => fs.existsSync(path.join(projectRoot, relPath)));
}

function isPackageTracePreserved(trace: ImageUploadEntry['package_trace']): boolean {
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

function isImageChainIdsPreserved(entry: ImageUploadEntry): boolean {
  const chain = entry.chain_ids;
  const trace = entry.package_trace;
  return (
    chain.analysis_plan_id === trace[0]?.plan_id &&
    chain.keyframe_preparation_id ===
      trace.find((t) => t.plan_type === 'keyframe_preparation')?.plan_id &&
    chain.generation_blueprint_id ===
      trace.find((t) => t.plan_type === 'generation_blueprint')?.plan_id
  );
}

function isVideoChainIdsPreserved(entry: VideoUploadEntry): boolean {
  const chain = entry.chain_ids;
  const trace = entry.package_trace;
  return (
    chain.analysis_plan_id === trace[0]?.plan_id &&
    chain.video_blueprint_id === trace.find((t) => t.plan_type === 'video_blueprint')?.plan_id &&
    chain.motion_plan_id === trace.find((t) => t.plan_type === 'motion_plan')?.plan_id
  );
}

function areSafetyFlagsPreserved(safety: ImageUploadEntry['safety']): boolean {
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

function checkNoExecutionFlags(
  imageUpload: MovieAnalysisImageUpload,
  videoUpload: MovieAnalysisVideoUpload
): {
  noRuntimeExecution: boolean;
  noVideoGeneration: boolean;
  noImageGeneration: boolean;
  noGpuExecution: boolean;
} {
  const summaries = [imageUpload.safety_summary, videoUpload.safety_summary];
  const summaryOk = summaries.every(
    (summary) =>
      summary.planning_only === true &&
      summary.runtime_execution === false &&
      summary.video_generation === false &&
      summary.image_generation === false &&
      summary.gpu_execution === false
  );

  const entriesOk = [...imageUpload.upload_entries, ...videoUpload.upload_entries].every(
    (entry) =>
      entry.safety.runtime_execution === false &&
      entry.safety.video_generation === false &&
      entry.safety.image_generation === false &&
      entry.safety.gpu_execution === false
  );

  return {
    noRuntimeExecution: summaryOk && entriesOk,
    noVideoGeneration: summaryOk && entriesOk,
    noImageGeneration: summaryOk && entriesOk,
    noGpuExecution: summaryOk && entriesOk,
  };
}

function buildMarkdown(report: MovieAnalysisUploadBundleQualityGateReport): string {
  const lines = [
    '# Movie Analysis Upload Bundle Quality Gate',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Quality Gate Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| image_upload_schema_valid | ${report.image_upload_schema_valid} |`,
    `| video_upload_schema_valid | ${report.video_upload_schema_valid} |`,
    `| manifest_links_valid | ${report.manifest_links_valid} |`,
    `| dataset_links_valid | ${report.dataset_links_valid} |`,
    `| package_trace_preserved | ${report.package_trace_preserved} |`,
    `| chain_ids_preserved | ${report.chain_ids_preserved} |`,
    `| safety_flags_preserved | ${report.safety_flags_preserved} |`,
    `| no_runtime_execution | ${report.no_runtime_execution} |`,
    `| no_video_generation | ${report.no_video_generation} |`,
    `| no_image_generation | ${report.no_image_generation} |`,
    `| no_gpu_execution | ${report.no_gpu_execution} |`,
    '',
  ];

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisUploadBundleQualityGateReport(
  projectRoot?: string
): MovieAnalysisUploadBundleQualityGateReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: QualityGateIssue[] = [];
  const timestamp = new Date().toISOString();

  const imageUpload = loadMovieAnalysisImageUpload(root);
  if (!imageUpload) {
    issues.push({
      code: 'IMAGE_UPLOAD_MISSING',
      message: `Missing ${IMAGE_UPLOAD_PATH}`,
      severity: 'error',
    });
  }

  const videoUpload = loadMovieAnalysisVideoUpload(root);
  if (!videoUpload) {
    issues.push({
      code: 'VIDEO_UPLOAD_MISSING',
      message: `Missing ${VIDEO_UPLOAD_PATH}`,
      severity: 'error',
    });
  }

  const manifest = loadMovieAnalysisUploadManifest(root);
  if (!manifest) {
    issues.push({
      code: 'UPLOAD_MANIFEST_MISSING',
      message: `Missing ${UPLOAD_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: 'Missing movie-analysis-dataset.json for quality gate cross-validation',
      severity: 'error',
    });
  }

  if (!imageUpload || !videoUpload || !manifest || !dataset) {
    const report: MovieAnalysisUploadBundleQualityGateReport = {
      report_id: 'movie-analysis-upload-bundle-quality-gate-report-v1',
      phase: UPLOAD_BUNDLE_QUALITY_GATE_PHASE,
      timestamp,
      source_count: 0,
      image_upload_schema_valid: false,
      video_upload_schema_valid: false,
      manifest_links_valid: false,
      dataset_links_valid: false,
      package_trace_preserved: false,
      chain_ids_preserved: false,
      safety_flags_preserved: false,
      no_runtime_execution: false,
      no_video_generation: false,
      no_image_generation: false,
      no_gpu_execution: false,
      final_verdict: UPLOAD_BUNDLE_QUALITY_GATE_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, UPLOAD_BUNDLE_QUALITY_GATE_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  const imageSchemaValid = isImageUploadSchemaValid(imageUpload);
  const videoSchemaValid = isVideoUploadSchemaValid(videoUpload);
  const manifestLinksValid = isManifestLinksValid(root, manifest);

  if (!imageSchemaValid) {
    issues.push({
      code: 'IMAGE_UPLOAD_SCHEMA_INVALID',
      message: 'Image upload schema validation failed',
      severity: 'error',
    });
  }
  if (!videoSchemaValid) {
    issues.push({
      code: 'VIDEO_UPLOAD_SCHEMA_INVALID',
      message: 'Video upload schema validation failed',
      severity: 'error',
    });
  }
  if (!manifestLinksValid) {
    issues.push({
      code: 'MANIFEST_LINKS_INVALID',
      message: 'Upload manifest links validation failed',
      severity: 'error',
    });
  }

  if (imageUpload.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'IMAGE_SOURCE_COUNT_MISMATCH',
      message: `Image upload expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (videoUpload.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'VIDEO_SOURCE_COUNT_MISMATCH',
      message: `Video upload expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (manifest.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'MANIFEST_SOURCE_COUNT_MISMATCH',
      message: `Manifest expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  let datasetLinksValid = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let packageTracePreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let chainIdsPreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;
  let safetyFlagsPreserved = dataset.source_count === EXPECTED_SOURCE_COUNT;

  const globalDatasetLink =
    imageUpload.dataset_id === dataset.dataset_id &&
    videoUpload.dataset_id === dataset.dataset_id &&
    imageUpload.dataset_version === dataset.dataset_version &&
    videoUpload.dataset_version === dataset.dataset_version &&
    manifest.dataset_path === imageUpload.source_dataset_path;

  if (!globalDatasetLink) {
    datasetLinksValid = false;
    issues.push({
      code: 'GLOBAL_DATASET_LINK_INVALID',
      message: 'Global dataset linkage invalid across upload artifacts',
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
    const manifestEntry = manifest.entries.find(
      (e) => e.source_video_id === source.source_video_id
    );

    const linkOk =
      imageEntry &&
      videoEntry &&
      manifestEntry &&
      imageEntry.dataset_id === dataset.dataset_id &&
      payloadsEqual(imageEntry.upload_payload, dataset.image_app_payloads[source.source_video_id]) &&
      payloadsEqual(videoEntry.upload_payload, dataset.video_app_payloads[source.source_video_id]) &&
      manifestEntry.master_package_id === source.master_package_id &&
      manifestEntry.source_video_path === source.source_video_path;

    const traceOk =
      imageEntry &&
      videoEntry &&
      isPackageTracePreserved(imageEntry.package_trace) &&
      isPackageTracePreserved(videoEntry.package_trace) &&
      payloadsEqual(imageEntry.package_trace, dataset.package_traces[source.source_video_id]) &&
      payloadsEqual(videoEntry.package_trace, dataset.package_traces[source.source_video_id]);

    const chainOk =
      imageEntry &&
      videoEntry &&
      isImageChainIdsPreserved(imageEntry) &&
      isVideoChainIdsPreserved(videoEntry) &&
      payloadsEqual(imageEntry.chain_ids, {
        analysis_plan_id: dataset.chain_ids[source.source_video_id].analysis_plan_id,
        gonegi_state_mapping_id: dataset.chain_ids[source.source_video_id].gonegi_state_mapping_id,
        video_state_compilation_id:
          dataset.chain_ids[source.source_video_id].video_state_compilation_id,
        keyframe_preparation_id: dataset.chain_ids[source.source_video_id].keyframe_preparation_id,
        generation_blueprint_id: dataset.chain_ids[source.source_video_id].generation_blueprint_id,
        final_runtime_bundle_id: dataset.chain_ids[source.source_video_id].final_runtime_bundle_id,
      }) &&
      payloadsEqual(videoEntry.chain_ids, {
        analysis_plan_id: dataset.chain_ids[source.source_video_id].analysis_plan_id,
        video_blueprint_id: dataset.chain_ids[source.source_video_id].video_blueprint_id,
        temporal_flow_id: dataset.chain_ids[source.source_video_id].temporal_flow_id,
        sequence_assembly_id: dataset.chain_ids[source.source_video_id].sequence_assembly_id,
        motion_plan_id: dataset.chain_ids[source.source_video_id].motion_plan_id,
        generation_blueprint_id: dataset.chain_ids[source.source_video_id].generation_blueprint_id,
        final_runtime_bundle_id: dataset.chain_ids[source.source_video_id].final_runtime_bundle_id,
      });

    const safetyOk =
      imageEntry &&
      videoEntry &&
      areSafetyFlagsPreserved(imageEntry.safety) &&
      areSafetyFlagsPreserved(videoEntry.safety) &&
      payloadsEqual(imageEntry.safety, dataset.safety_flags.per_source[source.source_video_id]);

    if (!linkOk) {
      datasetLinksValid = false;
      issues.push({
        code: 'DATASET_LINK_INVALID',
        message: `Dataset link invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!traceOk) {
      packageTracePreserved = false;
      issues.push({
        code: 'PACKAGE_TRACE_NOT_PRESERVED',
        message: `Package trace not preserved for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!chainOk) {
      chainIdsPreserved = false;
      issues.push({
        code: 'CHAIN_IDS_NOT_PRESERVED',
        message: `Chain IDs not preserved for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!safetyOk) {
      safetyFlagsPreserved = false;
      issues.push({
        code: 'SAFETY_FLAGS_NOT_PRESERVED',
        message: `Safety flags not preserved for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
  }

  const executionFlags = checkNoExecutionFlags(imageUpload, videoUpload);
  if (!executionFlags.noRuntimeExecution) {
    issues.push({
      code: 'RUNTIME_EXECUTION_NOT_BLOCKED',
      message: 'Upload bundle must block runtime execution',
      severity: 'error',
    });
  }
  if (!executionFlags.noVideoGeneration) {
    issues.push({
      code: 'VIDEO_GENERATION_NOT_BLOCKED',
      message: 'Upload bundle must block video generation',
      severity: 'error',
    });
  }
  if (!executionFlags.noImageGeneration) {
    issues.push({
      code: 'IMAGE_GENERATION_NOT_BLOCKED',
      message: 'Upload bundle must block image generation',
      severity: 'error',
    });
  }
  if (!executionFlags.noGpuExecution) {
    issues.push({
      code: 'GPU_EXECUTION_NOT_BLOCKED',
      message: 'Upload bundle must block GPU execution',
      severity: 'error',
    });
  }

  const sourceCount = dataset.source_count;
  const pass =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    imageSchemaValid &&
    videoSchemaValid &&
    manifestLinksValid &&
    datasetLinksValid &&
    packageTracePreserved &&
    chainIdsPreserved &&
    safetyFlagsPreserved &&
    executionFlags.noRuntimeExecution &&
    executionFlags.noVideoGeneration &&
    executionFlags.noImageGeneration &&
    executionFlags.noGpuExecution &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisUploadBundleQualityGateReport = {
    report_id: 'movie-analysis-upload-bundle-quality-gate-report-v1',
    phase: UPLOAD_BUNDLE_QUALITY_GATE_PHASE,
    timestamp,
    source_count: sourceCount,
    image_upload_schema_valid: imageSchemaValid,
    video_upload_schema_valid: videoSchemaValid,
    manifest_links_valid: manifestLinksValid,
    dataset_links_valid: datasetLinksValid,
    package_trace_preserved: packageTracePreserved,
    chain_ids_preserved: chainIdsPreserved,
    safety_flags_preserved: safetyFlagsPreserved,
    no_runtime_execution: executionFlags.noRuntimeExecution,
    no_video_generation: executionFlags.noVideoGeneration,
    no_image_generation: executionFlags.noImageGeneration,
    no_gpu_execution: executionFlags.noGpuExecution,
    final_verdict: pass
      ? UPLOAD_BUNDLE_QUALITY_GATE_PASS_VERDICT
      : UPLOAD_BUNDLE_QUALITY_GATE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, UPLOAD_BUNDLE_QUALITY_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, UPLOAD_BUNDLE_QUALITY_GATE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
