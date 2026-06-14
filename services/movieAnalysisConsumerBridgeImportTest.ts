import fs from 'node:fs';
import path from 'node:path';
import {
  type ImageConsumerBridgeEntry,
  type VideoConsumerBridgeEntry,
  IMAGE_CONSUMER_BRIDGE_PATH,
  VIDEO_CONSUMER_BRIDGE_PATH,
  loadImageConsumerBridge,
  loadVideoConsumerBridge,
} from './movieAnalysisDatasetConsumerBridge.js';
import {
  EXPECTED_SOURCE_COUNT,
  loadMovieAnalysisDataset,
} from './movieAnalysisDatasetExport.js';
import { TRACE_DEFINITIONS } from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const CONSUMER_BRIDGE_IMPORT_TEST_PHASE =
  'PHASE-SOURCE-VIDEO-047-MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST_V1' as const;
export const CONSUMER_BRIDGE_IMPORT_TEST_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST_V1' as const;
export const CONSUMER_BRIDGE_IMPORT_TEST_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST_V1' as const;
export const CONSUMER_BRIDGE_IMPORT_TEST_REPORT_PATH =
  'reports/movie-analysis-consumer-bridge-import-test-report.json' as const;
export const CONSUMER_BRIDGE_IMPORT_TEST_MD_PATH =
  'reports/MOVIE_ANALYSIS_CONSUMER_BRIDGE_IMPORT_TEST.md' as const;

export { EXPECTED_SOURCE_COUNT };

export type ConsumerBridgeImportTestIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceBridgeImportAudit = {
  source_video_id: string;
  image_bridge_importable: boolean;
  video_bridge_importable: boolean;
  payload_mapping_valid: boolean;
  chain_ids_valid: boolean;
  package_trace_valid: boolean;
  safety_flags_valid: boolean;
};

export type MovieAnalysisConsumerBridgeImportTestReport = {
  report_id: string;
  phase: typeof CONSUMER_BRIDGE_IMPORT_TEST_PHASE;
  timestamp: string;
  image_bridge_path: typeof IMAGE_CONSUMER_BRIDGE_PATH;
  video_bridge_path: typeof VIDEO_CONSUMER_BRIDGE_PATH;
  source_count: number;
  image_bridge_importable: boolean;
  video_bridge_importable: boolean;
  payload_mapping_valid: boolean;
  chain_ids_valid: boolean;
  package_trace_valid: boolean;
  safety_flags_valid: boolean;
  source_audits: SourceBridgeImportAudit[];
  final_verdict:
    | typeof CONSUMER_BRIDGE_IMPORT_TEST_PASS_VERDICT
    | typeof CONSUMER_BRIDGE_IMPORT_TEST_FAIL_VERDICT;
  issues: ConsumerBridgeImportTestIssue[];
};

const IMAGE_BRIDGE_ENTRY_FIELDS = [
  'source_video_id',
  'source_video_path',
  'master_package_id',
  'final_runtime_bundle_id',
  'generation_blueprint_id',
  'chain_ids',
  'package_trace',
  'payload_mapping',
  'safety',
] as const;

const VIDEO_BRIDGE_ENTRY_FIELDS = [
  'source_video_id',
  'source_video_path',
  'master_package_id',
  'final_runtime_bundle_id',
  'generation_blueprint_id',
  'chain_ids',
  'package_trace',
  'payload_mapping',
  'safety',
] as const;

function payloadsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPackageTraceValid(trace: ImageConsumerBridgeEntry['package_trace']): boolean {
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

function isImageChainIdsValid(entry: ImageConsumerBridgeEntry): boolean {
  const chain = entry.chain_ids;
  const trace = entry.package_trace;
  return (
    Boolean(chain.analysis_plan_id) &&
    Boolean(chain.keyframe_preparation_id) &&
    Boolean(chain.gonegi_state_mapping_id) &&
    Boolean(chain.generation_blueprint_id) &&
    chain.keyframe_preparation_id ===
      trace.find((t) => t.plan_type === 'keyframe_preparation')?.plan_id &&
    chain.gonegi_state_mapping_id ===
      trace.find((t) => t.plan_type === 'gonegi_state_mapping')?.plan_id &&
    chain.generation_blueprint_id ===
      trace.find((t) => t.plan_type === 'generation_blueprint')?.plan_id
  );
}

function isVideoChainIdsValid(entry: VideoConsumerBridgeEntry): boolean {
  const chain = entry.chain_ids;
  const trace = entry.package_trace;
  return (
    Boolean(chain.analysis_plan_id) &&
    Boolean(chain.video_blueprint_id) &&
    Boolean(chain.temporal_flow_id) &&
    Boolean(chain.motion_plan_id) &&
    chain.video_blueprint_id === trace.find((t) => t.plan_type === 'video_blueprint')?.plan_id &&
    chain.temporal_flow_id === trace.find((t) => t.plan_type === 'temporal_flow')?.plan_id &&
    chain.motion_plan_id === trace.find((t) => t.plan_type === 'motion_plan')?.plan_id
  );
}

function areSafetyFlagsValid(safety: ImageConsumerBridgeEntry['safety']): boolean {
  return (
    safety.planning_only === true &&
    safety.design_only === true &&
    safety.runtime_execution === false &&
    safety.video_generation === false &&
    safety.image_generation === false &&
    safety.gpu_execution === false &&
    safety.external_call_allowed === false &&
    safety.no_execution === true &&
    safety.no_rendering === true &&
    safety.no_inference === true
  );
}

function simulateImageBridgeImport(
  projectRoot: string,
  entry: ImageConsumerBridgeEntry
): boolean {
  const record = entry as unknown as Record<string, unknown>;
  if (!IMAGE_BRIDGE_ENTRY_FIELDS.every((field) => field in record)) {
    return false;
  }

  const payload = entry.payload_mapping;
  const sourcePath = path.join(projectRoot, entry.source_video_path);

  return (
    entry.payload_mapping.consumer_target === 'image_app' &&
    payload.character_generation_structure.length > 0 &&
    payload.emotion_generation_structure.length > 0 &&
    payload.character_bundle.length > 0 &&
    payload.emotion_bundle.length > 0 &&
    fs.existsSync(sourcePath)
  );
}

function simulateVideoBridgeImport(
  projectRoot: string,
  entry: VideoConsumerBridgeEntry
): boolean {
  const record = entry as unknown as Record<string, unknown>;
  if (!VIDEO_BRIDGE_ENTRY_FIELDS.every((field) => field in record)) {
    return false;
  }

  const payload = entry.payload_mapping;
  const sourcePath = path.join(projectRoot, entry.source_video_path);

  return (
    entry.payload_mapping.consumer_target === 'video_app' &&
    payload.scene_generation_structure.length > 0 &&
    payload.camera_generation_structure.length > 0 &&
    payload.scene_bundle.length > 0 &&
    payload.runtime_bundle.length > 0 &&
    fs.existsSync(sourcePath)
  );
}

function buildMarkdown(report: MovieAnalysisConsumerBridgeImportTestReport): string {
  const lines = [
    '# Movie Analysis Consumer Bridge Import Test',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Import Test Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| image_bridge_importable | ${report.image_bridge_importable} |`,
    `| video_bridge_importable | ${report.video_bridge_importable} |`,
    `| payload_mapping_valid | ${report.payload_mapping_valid} |`,
    `| chain_ids_valid | ${report.chain_ids_valid} |`,
    `| package_trace_valid | ${report.package_trace_valid} |`,
    `| safety_flags_valid | ${report.safety_flags_valid} |`,
    '',
    '## Source Import Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- image_bridge_importable: ${audit.image_bridge_importable}`);
    lines.push(`- video_bridge_importable: ${audit.video_bridge_importable}`);
    lines.push(`- payload_mapping_valid: ${audit.payload_mapping_valid}`);
    lines.push(`- chain_ids_valid: ${audit.chain_ids_valid}`);
    lines.push(`- package_trace_valid: ${audit.package_trace_valid}`);
    lines.push(`- safety_flags_valid: ${audit.safety_flags_valid}`);
    lines.push('');
  }

  if (report.issues.length > 0) {
    lines.push('## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function writeMovieAnalysisConsumerBridgeImportTestReport(
  projectRoot?: string
): MovieAnalysisConsumerBridgeImportTestReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ConsumerBridgeImportTestIssue[] = [];
  const timestamp = new Date().toISOString();

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

  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: 'Missing movie-analysis-dataset.json for cross-validation',
      severity: 'error',
    });
  }

  if (!imageBridge || !videoBridge || !dataset) {
    const report: MovieAnalysisConsumerBridgeImportTestReport = {
      report_id: 'movie-analysis-consumer-bridge-import-test-report-v1',
      phase: CONSUMER_BRIDGE_IMPORT_TEST_PHASE,
      timestamp,
      image_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
      video_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
      source_count: 0,
      image_bridge_importable: false,
      video_bridge_importable: false,
      payload_mapping_valid: false,
      chain_ids_valid: false,
      package_trace_valid: false,
      safety_flags_valid: false,
      source_audits: [],
      final_verdict: CONSUMER_BRIDGE_IMPORT_TEST_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, CONSUMER_BRIDGE_IMPORT_TEST_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, CONSUMER_BRIDGE_IMPORT_TEST_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

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
      code: 'IMAGE_BRIDGE_SOURCE_COUNT_MISMATCH',
      message: `Image bridge expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }
  if (videoBridge.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'VIDEO_BRIDGE_SOURCE_COUNT_MISMATCH',
      message: `Video bridge expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceBridgeImportAudit[] = [];

  for (const source of dataset.sources) {
    const imageEntry = imageBridge.entries.find((e) => e.source_video_id === source.source_video_id);
    const videoEntry = videoBridge.entries.find((e) => e.source_video_id === source.source_video_id);

    if (!imageEntry || !videoEntry) {
      issues.push({
        code: 'BRIDGE_ENTRY_MISSING',
        message: `Bridge entry missing for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
      sourceAudits.push({
        source_video_id: source.source_video_id,
        image_bridge_importable: false,
        video_bridge_importable: false,
        payload_mapping_valid: false,
        chain_ids_valid: false,
        package_trace_valid: false,
        safety_flags_valid: false,
      });
      continue;
    }

    const imageImportable = simulateImageBridgeImport(root, imageEntry);
    const videoImportable = simulateVideoBridgeImport(root, videoEntry);
    const payloadValid =
      payloadsEqual(imageEntry.payload_mapping, dataset.image_app_payloads[source.source_video_id]) &&
      payloadsEqual(videoEntry.payload_mapping, dataset.video_app_payloads[source.source_video_id]);
    const chainValid = isImageChainIdsValid(imageEntry) && isVideoChainIdsValid(videoEntry);
    const traceValid =
      isPackageTraceValid(imageEntry.package_trace) &&
      isPackageTraceValid(videoEntry.package_trace) &&
      payloadsEqual(imageEntry.package_trace, videoEntry.package_trace) &&
      payloadsEqual(imageEntry.package_trace, dataset.package_traces[source.source_video_id]);
    const safetyValid =
      areSafetyFlagsValid(imageEntry.safety) &&
      areSafetyFlagsValid(videoEntry.safety) &&
      payloadsEqual(imageEntry.safety, dataset.safety_flags.per_source[source.source_video_id]);

    if (!imageImportable) {
      issues.push({
        code: 'IMAGE_BRIDGE_IMPORT_FAIL',
        message: `Image bridge import simulation failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!videoImportable) {
      issues.push({
        code: 'VIDEO_BRIDGE_IMPORT_FAIL',
        message: `Video bridge import simulation failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!payloadValid) {
      issues.push({
        code: 'PAYLOAD_MAPPING_INVALID',
        message: `Payload mapping invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!chainValid) {
      issues.push({
        code: 'CHAIN_IDS_INVALID',
        message: `Chain IDs invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!traceValid) {
      issues.push({
        code: 'PACKAGE_TRACE_INVALID',
        message: `Package trace invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!safetyValid) {
      issues.push({
        code: 'SAFETY_FLAGS_INVALID',
        message: `Safety flags invalid for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }

    sourceAudits.push({
      source_video_id: source.source_video_id,
      image_bridge_importable: imageImportable,
      video_bridge_importable: videoImportable,
      payload_mapping_valid: payloadValid,
      chain_ids_valid: chainValid,
      package_trace_valid: traceValid,
      safety_flags_valid: safetyValid,
    });
  }

  const imageSummary = imageBridge.safety_summary;
  const videoSummary = videoBridge.safety_summary;
  const summaryValid =
    imageSummary.planning_only === true &&
    imageSummary.runtime_execution === false &&
    videoSummary.planning_only === true &&
    videoSummary.runtime_execution === false;

  if (!summaryValid) {
    issues.push({
      code: 'BRIDGE_SAFETY_SUMMARY_INVALID',
      message: 'Bridge safety summary invalid',
      severity: 'error',
    });
  }

  const imageBridgeImportable =
    imageBridge.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.image_bridge_importable);
  const videoBridgeImportable =
    videoBridge.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.video_bridge_importable);
  const payloadMappingValid =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.payload_mapping_valid);
  const chainIdsValid =
    dataset.source_count === EXPECTED_SOURCE_COUNT && sourceAudits.every((a) => a.chain_ids_valid);
  const packageTraceValid =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.package_trace_valid);
  const safetyFlagsValid =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.safety_flags_valid) &&
    summaryValid;

  const pass =
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    imageBridgeImportable &&
    videoBridgeImportable &&
    payloadMappingValid &&
    chainIdsValid &&
    packageTraceValid &&
    safetyFlagsValid &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisConsumerBridgeImportTestReport = {
    report_id: 'movie-analysis-consumer-bridge-import-test-report-v1',
    phase: CONSUMER_BRIDGE_IMPORT_TEST_PHASE,
    timestamp,
    image_bridge_path: IMAGE_CONSUMER_BRIDGE_PATH,
    video_bridge_path: VIDEO_CONSUMER_BRIDGE_PATH,
    source_count: dataset.source_count,
    image_bridge_importable: imageBridgeImportable,
    video_bridge_importable: videoBridgeImportable,
    payload_mapping_valid: payloadMappingValid,
    chain_ids_valid: chainIdsValid,
    package_trace_valid: packageTraceValid,
    safety_flags_valid: safetyFlagsValid,
    source_audits: sourceAudits,
    final_verdict: pass
      ? CONSUMER_BRIDGE_IMPORT_TEST_PASS_VERDICT
      : CONSUMER_BRIDGE_IMPORT_TEST_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, CONSUMER_BRIDGE_IMPORT_TEST_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, CONSUMER_BRIDGE_IMPORT_TEST_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
