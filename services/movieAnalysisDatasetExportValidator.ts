import fs from 'node:fs';
import path from 'node:path';
import {
  EXPORT_PACKAGE_PATH,
  type ImageAppExportPayload,
  type VideoAppExportPayload,
  loadMovieAnalysisExportPackage,
} from './movieAnalysisExportPackage.js';
import {
  DATASET_EXPORT_FAIL_VERDICT,
  DATASET_EXPORT_PASS_VERDICT,
  DATASET_EXPORT_PHASE,
  DATASET_EXPORT_REPORT_PATH,
  DATASET_MANIFEST_PATH,
  DATASET_PATH,
  DATASET_SCHEMA_PATH,
  EXPECTED_SOURCE_COUNT,
  type MovieAnalysisDataset,
  loadMovieAnalysisDataset,
} from './movieAnalysisDatasetExport.js';
import { TRACE_DEFINITIONS } from './movieAnalysisMasterPackageDesign.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const DATASET_EXPORT_VALIDATION_REPORT_PATH =
  'reports/movie-analysis-dataset-export-report.json' as const;
export const DATASET_EXPORT_VALIDATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_DATASET_EXPORT.md' as const;

export type DatasetExportValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceDatasetValidationAudit = {
  source_video_id: string;
  trace_integrity: 'PASS' | 'FAIL';
  chain_integrity: 'PASS' | 'FAIL';
  payload_integrity: 'PASS' | 'FAIL';
  image_app_ready: 'PASS' | 'FAIL';
  video_app_ready: 'PASS' | 'FAIL';
};

export type MovieAnalysisDatasetExportValidationReport = {
  report_id: string;
  phase: typeof DATASET_EXPORT_PHASE;
  timestamp: string;
  dataset_path: typeof DATASET_PATH;
  manifest_path: typeof DATASET_MANIFEST_PATH;
  source_count: number;
  trace_integrity: 'PASS' | 'FAIL';
  chain_integrity: 'PASS' | 'FAIL';
  payload_integrity: 'PASS' | 'FAIL';
  image_app_ready: 'PASS' | 'FAIL';
  video_app_ready: 'PASS' | 'FAIL';
  dataset_export_complete: 'PASS' | 'FAIL';
  safety_flags_preserved: boolean;
  source_audits: SourceDatasetValidationAudit[];
  final_verdict: typeof DATASET_EXPORT_PASS_VERDICT | typeof DATASET_EXPORT_FAIL_VERDICT;
  issues: DatasetExportValidationIssue[];
};

function payloadsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isImageAppReady(payload: ImageAppExportPayload | undefined): boolean {
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

function isVideoAppReady(payload: VideoAppExportPayload | undefined): boolean {
  if (!payload) return false;
  return (
    payload.consumer_target === 'video_app' &&
    Boolean(payload.video_blueprint_id) &&
    Boolean(payload.temporal_flow_id) &&
    payload.scene_generation_structure.length > 0 &&
    payload.camera_generation_structure.length > 0 &&
    payload.scene_bundle.length > 0 &&
    payload.camera_bundle.length > 0 &&
    payload.runtime_bundle.length > 0
  );
}

function isTraceIntegrity(dataset: MovieAnalysisDataset, sourceVideoId: string): boolean {
  const trace = dataset.package_traces[sourceVideoId];
  if (!trace || trace.length !== TRACE_DEFINITIONS.length) {
    return false;
  }

  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const entry = trace[i];
    const chainId = dataset.chain_ids[sourceVideoId]?.[definition.idKey];
    if (
      !entry ||
      entry.step !== i + 1 ||
      entry.phase !== definition.phase ||
      entry.plan_type !== definition.plan_type ||
      entry.plan_id !== chainId
    ) {
      return false;
    }
  }

  return true;
}

function isChainIntegrity(dataset: MovieAnalysisDataset, sourceVideoId: string): boolean {
  const chain = dataset.chain_ids[sourceVideoId];
  const source = dataset.sources.find((s) => s.source_video_id === sourceVideoId);
  if (!chain || !source) {
    return false;
  }

  return (
    chain.analysis_plan_id.length > 0 &&
    chain.final_runtime_bundle_id === source.final_runtime_bundle_id &&
    chain.generation_blueprint_id === source.generation_blueprint_id &&
    Object.keys(chain).length === TRACE_DEFINITIONS.length
  );
}

function isPayloadIntegrity(
  dataset: MovieAnalysisDataset,
  sourceVideoId: string,
  exportPackage: ReturnType<typeof loadMovieAnalysisExportPackage>
): boolean {
  if (!exportPackage) return false;
  const exportEntry = exportPackage.entries.find((e) => e.source_video_id === sourceVideoId);
  if (!exportEntry) return false;

  return (
    payloadsEqual(dataset.image_app_payloads[sourceVideoId], exportEntry.image_app) &&
    payloadsEqual(dataset.video_app_payloads[sourceVideoId], exportEntry.video_app) &&
    payloadsEqual(dataset.package_traces[sourceVideoId], exportEntry.package_trace) &&
    payloadsEqual(dataset.chain_ids[sourceVideoId], exportEntry.chain_ids)
  );
}

function areSafetyFlagsPreserved(dataset: MovieAnalysisDataset): boolean {
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
    return false;
  }

  return dataset.sources.every((source) => {
    const flags = dataset.safety_flags.per_source[source.source_video_id];
    return (
      flags?.planning_only === true &&
      flags.design_only === true &&
      flags.runtime_execution === false &&
      flags.video_generation === false &&
      flags.image_generation === false &&
      flags.gpu_execution === false &&
      flags.external_call_allowed === false
    );
  });
}

function buildMarkdown(report: MovieAnalysisDatasetExportValidationReport): string {
  const lines = [
    '# Movie Analysis Dataset Export',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Validation Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| trace_integrity | ${report.trace_integrity} |`,
    `| chain_integrity | ${report.chain_integrity} |`,
    `| payload_integrity | ${report.payload_integrity} |`,
    `| image_app_ready | ${report.image_app_ready} |`,
    `| video_app_ready | ${report.video_app_ready} |`,
    `| dataset_export_complete | ${report.dataset_export_complete} |`,
    `| safety_flags_preserved | ${report.safety_flags_preserved} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- trace_integrity: ${audit.trace_integrity}`);
    lines.push(`- chain_integrity: ${audit.chain_integrity}`);
    lines.push(`- payload_integrity: ${audit.payload_integrity}`);
    lines.push(`- image_app_ready: ${audit.image_app_ready}`);
    lines.push(`- video_app_ready: ${audit.video_app_ready}`);
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

export function validateMovieAnalysisDatasetExport(
  projectRoot?: string,
  dataset?: MovieAnalysisDataset
): MovieAnalysisDatasetExportValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: DatasetExportValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const loadedDataset = dataset ?? loadMovieAnalysisDataset(root);
  if (!loadedDataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DATASET_MANIFEST_PATH))) {
    issues.push({
      code: 'DATASET_MANIFEST_MISSING',
      message: `Missing ${DATASET_MANIFEST_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DATASET_SCHEMA_PATH))) {
    issues.push({
      code: 'DATASET_SCHEMA_MISSING',
      message: `Missing ${DATASET_SCHEMA_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, DATASET_EXPORT_REPORT_PATH))) {
    issues.push({
      code: 'DATASET_BUILD_REPORT_MISSING',
      message: `Missing ${DATASET_EXPORT_REPORT_PATH}`,
      severity: 'error',
    });
  }

  const exportPackage = loadMovieAnalysisExportPackage(root);
  if (!exportPackage) {
    issues.push({
      code: 'EXPORT_PACKAGE_MISSING',
      message: `Missing ${EXPORT_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  if (!loadedDataset || !exportPackage) {
    const report: MovieAnalysisDatasetExportValidationReport = {
      report_id: 'movie-analysis-dataset-export-report-v1',
      phase: DATASET_EXPORT_PHASE,
      timestamp,
      dataset_path: DATASET_PATH,
      manifest_path: DATASET_MANIFEST_PATH,
      source_count: 0,
      trace_integrity: 'FAIL',
      chain_integrity: 'FAIL',
      payload_integrity: 'FAIL',
      image_app_ready: 'FAIL',
      video_app_ready: 'FAIL',
      dataset_export_complete: 'FAIL',
      safety_flags_preserved: false,
      source_audits: [],
      final_verdict: DATASET_EXPORT_FAIL_VERDICT,
      issues,
    };
    return report;
  }

  if (loadedDataset.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}, got ${loadedDataset.source_count}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceDatasetValidationAudit[] = [];

  for (const source of loadedDataset.sources) {
    const traceOk = isTraceIntegrity(loadedDataset, source.source_video_id);
    const chainOk = isChainIntegrity(loadedDataset, source.source_video_id);
    const payloadOk = isPayloadIntegrity(loadedDataset, source.source_video_id, exportPackage);
    const imageOk = isImageAppReady(loadedDataset.image_app_payloads[source.source_video_id]);
    const videoOk = isVideoAppReady(loadedDataset.video_app_payloads[source.source_video_id]);

    if (!traceOk) {
      issues.push({
        code: 'TRACE_INTEGRITY_FAIL',
        message: `Trace integrity failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!chainOk) {
      issues.push({
        code: 'CHAIN_INTEGRITY_FAIL',
        message: `Chain integrity failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!payloadOk) {
      issues.push({
        code: 'PAYLOAD_INTEGRITY_FAIL',
        message: `Payload integrity failed for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!imageOk) {
      issues.push({
        code: 'IMAGE_APP_NOT_READY',
        message: `Image App payload not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }
    if (!videoOk) {
      issues.push({
        code: 'VIDEO_APP_NOT_READY',
        message: `Video App payload not ready for ${source.source_video_id}`,
        severity: 'error',
        source_video_id: source.source_video_id,
      });
    }

    sourceAudits.push({
      source_video_id: source.source_video_id,
      trace_integrity: traceOk ? 'PASS' : 'FAIL',
      chain_integrity: chainOk ? 'PASS' : 'FAIL',
      payload_integrity: payloadOk ? 'PASS' : 'FAIL',
      image_app_ready: imageOk ? 'PASS' : 'FAIL',
      video_app_ready: videoOk ? 'PASS' : 'FAIL',
    });
  }

  const safetyPreserved = areSafetyFlagsPreserved(loadedDataset);
  if (!safetyPreserved) {
    issues.push({
      code: 'SAFETY_FLAGS_NOT_PRESERVED',
      message: 'Dataset safety flags not preserved',
      severity: 'error',
    });
  }

  const traceIntegrity =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.trace_integrity === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const chainIntegrity =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.chain_integrity === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const payloadIntegrity =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.payload_integrity === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const imageAppReady =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.image_app_ready === 'PASS')
      ? 'PASS'
      : 'FAIL';
  const videoAppReady =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((a) => a.video_app_ready === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const datasetExportComplete =
    fs.existsSync(path.join(root, DATASET_PATH)) &&
    fs.existsSync(path.join(root, DATASET_MANIFEST_PATH)) &&
    fs.existsSync(path.join(root, DATASET_EXPORT_REPORT_PATH)) &&
    traceIntegrity === 'PASS' &&
    chainIntegrity === 'PASS' &&
    payloadIntegrity === 'PASS' &&
    imageAppReady === 'PASS' &&
    videoAppReady === 'PASS' &&
    safetyPreserved
      ? 'PASS'
      : 'FAIL';

  const pass =
    loadedDataset.source_count === EXPECTED_SOURCE_COUNT &&
    traceIntegrity === 'PASS' &&
    chainIntegrity === 'PASS' &&
    payloadIntegrity === 'PASS' &&
    imageAppReady === 'PASS' &&
    videoAppReady === 'PASS' &&
    datasetExportComplete === 'PASS' &&
    safetyPreserved &&
    issues.filter((i) => i.severity === 'error').length === 0;

  return {
    report_id: 'movie-analysis-dataset-export-report-v1',
    phase: DATASET_EXPORT_PHASE,
    timestamp,
    dataset_path: DATASET_PATH,
    manifest_path: DATASET_MANIFEST_PATH,
    source_count: loadedDataset.source_count,
    trace_integrity: traceIntegrity,
    chain_integrity: chainIntegrity,
    payload_integrity: payloadIntegrity,
    image_app_ready: imageAppReady,
    video_app_ready: videoAppReady,
    dataset_export_complete: datasetExportComplete,
    safety_flags_preserved: safetyPreserved,
    source_audits: sourceAudits,
    final_verdict: pass ? DATASET_EXPORT_PASS_VERDICT : DATASET_EXPORT_FAIL_VERDICT,
    issues,
  };
}

export function writeMovieAnalysisDatasetExportValidationReport(
  projectRoot?: string,
  dataset?: MovieAnalysisDataset
): MovieAnalysisDatasetExportValidationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = validateMovieAnalysisDatasetExport(root, dataset);

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, DATASET_EXPORT_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, DATASET_EXPORT_VALIDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
