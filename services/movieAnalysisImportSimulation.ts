import fs from 'node:fs';
import path from 'node:path';
import {
  loadMovieAnalysisGenerationBlueprintPlan,
  type MovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  loadMovieAnalysisFinalRuntimeBundlePlan,
  type MovieAnalysisFinalRuntimeBundlePlan,
} from './movieAnalysisFinalRuntimeBundleDesign.js';
import {
  TRACE_DEFINITIONS,
  loadMovieAnalysisMasterPackagePlan,
} from './movieAnalysisMasterPackageDesign.js';
import {
  EXPORT_PACKAGE_PASS_VERDICT,
  EXPORT_PACKAGE_PATH,
  EXPECTED_SOURCE_COUNT,
  IMAGE_APP_CONSUMER_TARGET,
  VIDEO_APP_CONSUMER_TARGET,
  type MovieAnalysisExportEntry,
  type MovieAnalysisExportManifest,
  type MovieAnalysisExportPackage,
  loadMovieAnalysisExportManifest,
  loadMovieAnalysisExportPackage,
  loadMovieAnalysisExportReport,
} from './movieAnalysisExportPackage.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const IMPORT_SIMULATION_PHASE =
  'PHASE-SOURCE-VIDEO-043-MOVIE_ANALYSIS_IMPORT_SIMULATION_V1' as const;
export const IMPORT_SIMULATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_IMPORT_SIMULATION_V1' as const;
export const IMPORT_SIMULATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_IMPORT_SIMULATION_V1' as const;
export const IMPORT_SIMULATION_REPORT_PATH =
  'reports/movie-analysis-import-simulation-report.json' as const;
export const IMPORT_SIMULATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_IMPORT_SIMULATION.md' as const;

export { EXPECTED_SOURCE_COUNT } from './movieAnalysisExportPackage.js';

const IMAGE_APP_IMPORT_FIELDS = [
  'keyframe_preparation_id',
  'gonegi_state_mapping_id',
  'video_state_compilation_id',
  'character_generation_structure',
  'emotion_generation_structure',
  'character_bundle',
  'emotion_bundle',
] as const;

const VIDEO_APP_IMPORT_FIELDS = [
  'video_blueprint_id',
  'temporal_flow_id',
  'sequence_assembly_id',
  'motion_plan_id',
  'scene_generation_structure',
  'camera_generation_structure',
  'transition_generation_structure',
  'continuity_generation_structure',
  'scene_bundle',
  'camera_bundle',
  'transition_bundle',
  'continuity_bundle',
  'runtime_bundle',
] as const;

const EXPORT_PACKAGE_SCHEMA_FIELDS = [
  'export_id',
  'phase',
  'generated_at',
  'source_count',
  'design_only',
  'full_trace_preserved',
  'image_app_ready',
  'video_app_ready',
  'entries',
  'safety_summary',
] as const;

const EXPORT_ENTRY_SCHEMA_FIELDS = [
  'source_video_id',
  'master_package_id',
  'final_runtime_bundle_id',
  'generation_blueprint_id',
  'package_trace',
  'chain_ids',
  'image_app',
  'video_app',
  'safety',
] as const;

export type ImportSimulationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type SourceImportSimulationAudit = {
  source_video_id: string;
  master_package_id: string;
  image_app_importable: boolean;
  video_app_importable: boolean;
  chain_trace_preserved: boolean;
  payload_integrity: boolean;
};

export type MovieAnalysisImportSimulationReport = {
  report_id: string;
  phase: typeof IMPORT_SIMULATION_PHASE;
  timestamp: string;
  export_package_path: typeof EXPORT_PACKAGE_PATH;
  source_count: number;
  image_app_importable: boolean;
  video_app_importable: boolean;
  chain_trace_preserved: boolean;
  payload_integrity: boolean;
  schema_integrity: boolean;
  consumer_integrity: boolean;
  source_audits: SourceImportSimulationAudit[];
  final_verdict:
    | typeof IMPORT_SIMULATION_PASS_VERDICT
    | typeof IMPORT_SIMULATION_FAIL_VERDICT;
  issues: ImportSimulationIssue[];
};

function sectionsPresent(
  payload: Record<string, unknown>,
  sections: readonly string[]
): boolean {
  return sections.every((section) => {
    const value = payload[section];
    if (typeof value === 'string') {
      return value.length > 0;
    }
    return Array.isArray(value) && value.length > 0;
  });
}

function payloadsEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function simulateImageAppImport(entry: MovieAnalysisExportEntry): boolean {
  const imageApp = entry.image_app;
  if (imageApp.consumer_target !== IMAGE_APP_CONSUMER_TARGET) {
    return false;
  }
  if (!sectionsPresent(imageApp, IMAGE_APP_IMPORT_FIELDS)) {
    return false;
  }
  if (
    imageApp.keyframe_preparation_id !== entry.chain_ids.keyframe_preparation_id ||
    imageApp.gonegi_state_mapping_id !== entry.chain_ids.gonegi_state_mapping_id ||
    imageApp.video_state_compilation_id !== entry.chain_ids.video_state_compilation_id
  ) {
    return false;
  }
  return (
    entry.safety.planning_only === true &&
    entry.safety.design_only === true &&
    entry.safety.image_generation === false &&
    entry.safety.runtime_execution === false
  );
}

function simulateVideoAppImport(entry: MovieAnalysisExportEntry): boolean {
  const videoApp = entry.video_app;
  if (videoApp.consumer_target !== VIDEO_APP_CONSUMER_TARGET) {
    return false;
  }
  if (!sectionsPresent(videoApp, VIDEO_APP_IMPORT_FIELDS)) {
    return false;
  }
  if (
    videoApp.video_blueprint_id !== entry.chain_ids.video_blueprint_id ||
    videoApp.temporal_flow_id !== entry.chain_ids.temporal_flow_id ||
    videoApp.sequence_assembly_id !== entry.chain_ids.sequence_assembly_id ||
    videoApp.motion_plan_id !== entry.chain_ids.motion_plan_id
  ) {
    return false;
  }
  return (
    entry.safety.planning_only === true &&
    entry.safety.design_only === true &&
    entry.safety.video_generation === false &&
    entry.safety.runtime_execution === false
  );
}

function isChainTracePreserved(entry: MovieAnalysisExportEntry): boolean {
  if (entry.package_trace.length !== TRACE_DEFINITIONS.length) {
    return false;
  }

  for (let i = 0; i < TRACE_DEFINITIONS.length; i++) {
    const definition = TRACE_DEFINITIONS[i];
    const traceEntry = entry.package_trace[i];
    const chainId = entry.chain_ids[definition.idKey];

    if (
      !traceEntry ||
      traceEntry.step !== i + 1 ||
      traceEntry.phase !== definition.phase ||
      traceEntry.plan_type !== definition.plan_type ||
      traceEntry.plan_id !== chainId
    ) {
      return false;
    }
  }

  return true;
}

function isPayloadIntegrity(
  entry: MovieAnalysisExportEntry,
  bundle: MovieAnalysisFinalRuntimeBundlePlan,
  blueprint: MovieAnalysisGenerationBlueprintPlan
): boolean {
  return (
    payloadsEqual(
      entry.image_app.character_generation_structure,
      blueprint.character_generation_structure
    ) &&
    payloadsEqual(entry.image_app.emotion_generation_structure, blueprint.emotion_generation_structure) &&
    payloadsEqual(entry.image_app.character_bundle, bundle.character_bundle) &&
    payloadsEqual(entry.image_app.emotion_bundle, bundle.emotion_bundle) &&
    payloadsEqual(entry.video_app.scene_generation_structure, blueprint.scene_generation_structure) &&
    payloadsEqual(
      entry.video_app.camera_generation_structure,
      blueprint.camera_generation_structure
    ) &&
    payloadsEqual(
      entry.video_app.transition_generation_structure,
      blueprint.transition_generation_structure
    ) &&
    payloadsEqual(
      entry.video_app.continuity_generation_structure,
      blueprint.continuity_generation_structure
    ) &&
    payloadsEqual(entry.video_app.scene_bundle, bundle.scene_bundle) &&
    payloadsEqual(entry.video_app.camera_bundle, bundle.camera_bundle) &&
    payloadsEqual(entry.video_app.transition_bundle, bundle.transition_bundle) &&
    payloadsEqual(entry.video_app.continuity_bundle, bundle.continuity_bundle) &&
    payloadsEqual(entry.video_app.runtime_bundle, bundle.runtime_bundle)
  );
}

function isSchemaIntegrity(exportPackage: MovieAnalysisExportPackage): boolean {
  const rootRecord = exportPackage as unknown as Record<string, unknown>;
  if (!EXPORT_PACKAGE_SCHEMA_FIELDS.every((field) => field in rootRecord)) {
    return false;
  }
  if (exportPackage.design_only !== true) {
    return false;
  }
  if (!Array.isArray(exportPackage.entries) || exportPackage.entries.length === 0) {
    return false;
  }

  return exportPackage.entries.every((entry) => {
    const entryRecord = entry as unknown as Record<string, unknown>;
    return EXPORT_ENTRY_SCHEMA_FIELDS.every((field) => field in entryRecord);
  });
}

function isConsumerIntegrity(
  exportPackage: MovieAnalysisExportPackage,
  manifest: MovieAnalysisExportManifest
): boolean {
  if (manifest.source_count !== exportPackage.source_count) {
    return false;
  }
  if (
    manifest.consumer_targets[0] !== IMAGE_APP_CONSUMER_TARGET ||
    manifest.consumer_targets[1] !== VIDEO_APP_CONSUMER_TARGET
  ) {
    return false;
  }
  if (manifest.entries.length !== exportPackage.entries.length) {
    return false;
  }

  return manifest.entries.every((manifestEntry) => {
    const packageEntry = exportPackage.entries.find(
      (entry) => entry.source_video_id === manifestEntry.source_video_id
    );
    if (!packageEntry) {
      return false;
    }

    return (
      manifestEntry.master_package_id === packageEntry.master_package_id &&
      manifestEntry.final_runtime_bundle_id === packageEntry.final_runtime_bundle_id &&
      manifestEntry.generation_blueprint_id === packageEntry.generation_blueprint_id &&
      manifestEntry.image_app_ready === exportPackage.image_app_ready &&
      manifestEntry.video_app_ready === exportPackage.video_app_ready &&
      packageEntry.image_app.consumer_target === IMAGE_APP_CONSUMER_TARGET &&
      packageEntry.video_app.consumer_target === VIDEO_APP_CONSUMER_TARGET
    );
  });
}

function buildMarkdown(report: MovieAnalysisImportSimulationReport): string {
  const lines = [
    '# Movie Analysis Import Simulation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Simulation Checks',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| image_app_importable | ${report.image_app_importable} |`,
    `| video_app_importable | ${report.video_app_importable} |`,
    `| chain_trace_preserved | ${report.chain_trace_preserved} |`,
    `| payload_integrity | ${report.payload_integrity} |`,
    `| schema_integrity | ${report.schema_integrity} |`,
    `| consumer_integrity | ${report.consumer_integrity} |`,
    '',
    '## Source Import Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(`### ${audit.source_video_id}`);
    lines.push('');
    lines.push(`- master_package_id: ${audit.master_package_id}`);
    lines.push(`- image_app_importable: ${audit.image_app_importable}`);
    lines.push(`- video_app_importable: ${audit.video_app_importable}`);
    lines.push(`- chain_trace_preserved: ${audit.chain_trace_preserved}`);
    lines.push(`- payload_integrity: ${audit.payload_integrity}`);
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

export function writeMovieAnalysisImportSimulationReport(
  projectRoot?: string
): MovieAnalysisImportSimulationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ImportSimulationIssue[] = [];
  const timestamp = new Date().toISOString();

  const exportPackage = loadMovieAnalysisExportPackage(root);
  if (!exportPackage) {
    issues.push({
      code: 'EXPORT_PACKAGE_MISSING',
      message: `Missing ${EXPORT_PACKAGE_PATH}`,
      severity: 'error',
    });
  }

  const exportReport = loadMovieAnalysisExportReport(root);
  if (!exportReport) {
    issues.push({
      code: 'EXPORT_REPORT_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-report.json',
      severity: 'error',
    });
  } else if (exportReport.final_verdict !== EXPORT_PACKAGE_PASS_VERDICT) {
    issues.push({
      code: 'EXPORT_PACKAGE_NOT_PASS',
      message: `Export package must have ${EXPORT_PACKAGE_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  const manifest = loadMovieAnalysisExportManifest(root);
  if (!manifest) {
    issues.push({
      code: 'EXPORT_MANIFEST_MISSING',
      message: 'Missing exports/movie_analysis/movie-analysis-export-manifest.json',
      severity: 'error',
    });
  }

  if (!exportPackage || !manifest) {
    const report: MovieAnalysisImportSimulationReport = {
      report_id: 'movie-analysis-import-simulation-report-v1',
      phase: IMPORT_SIMULATION_PHASE,
      timestamp,
      export_package_path: EXPORT_PACKAGE_PATH,
      source_count: 0,
      image_app_importable: false,
      video_app_importable: false,
      chain_trace_preserved: false,
      payload_integrity: false,
      schema_integrity: false,
      consumer_integrity: false,
      source_audits: [],
      final_verdict: IMPORT_SIMULATION_FAIL_VERDICT,
      issues,
    };

    fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
    fs.writeFileSync(
      path.join(root, IMPORT_SIMULATION_REPORT_PATH),
      `${JSON.stringify(report, null, 2)}\n`,
      'utf8'
    );
    fs.writeFileSync(
      path.join(root, IMPORT_SIMULATION_MD_PATH),
      `${buildMarkdown(report)}\n`,
      'utf8'
    );
    return report;
  }

  const schemaIntegrity = isSchemaIntegrity(exportPackage);
  if (!schemaIntegrity) {
    issues.push({
      code: 'SCHEMA_INTEGRITY_FAIL',
      message: 'Export package schema integrity check failed',
      severity: 'error',
    });
  }

  const consumerIntegrity = isConsumerIntegrity(exportPackage, manifest);
  if (!consumerIntegrity) {
    issues.push({
      code: 'CONSUMER_INTEGRITY_FAIL',
      message: 'Export manifest consumer integrity check failed',
      severity: 'error',
    });
  }

  if (exportPackage.source_count !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_MISMATCH',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}, got ${exportPackage.source_count}`,
      severity: 'error',
    });
  }

  const sourceAudits: SourceImportSimulationAudit[] = [];

  for (const entry of exportPackage.entries) {
    const master = loadMovieAnalysisMasterPackagePlan(root, entry.master_package_id);
    const bundle = loadMovieAnalysisFinalRuntimeBundlePlan(root, entry.final_runtime_bundle_id);
    const blueprint = loadMovieAnalysisGenerationBlueprintPlan(
      root,
      entry.generation_blueprint_id
    );

    if (!master || !bundle || !blueprint) {
      issues.push({
        code: 'UPSTREAM_PLAN_MISSING',
        message: `Missing upstream plans for ${entry.source_video_id}`,
        severity: 'error',
        source_video_id: entry.source_video_id,
      });
      sourceAudits.push({
        source_video_id: entry.source_video_id,
        master_package_id: entry.master_package_id,
        image_app_importable: false,
        video_app_importable: false,
        chain_trace_preserved: false,
        payload_integrity: false,
      });
      continue;
    }

    const imageImportable = simulateImageAppImport(entry);
    const videoImportable = simulateVideoAppImport(entry);
    const chainTrace = isChainTracePreserved(entry);
    const payloadOk = isPayloadIntegrity(entry, bundle, blueprint);

    if (!imageImportable) {
      issues.push({
        code: 'IMAGE_APP_IMPORT_FAIL',
        message: `Image App import simulation failed for ${entry.source_video_id}`,
        severity: 'error',
        source_video_id: entry.source_video_id,
      });
    }
    if (!videoImportable) {
      issues.push({
        code: 'VIDEO_APP_IMPORT_FAIL',
        message: `Video App import simulation failed for ${entry.source_video_id}`,
        severity: 'error',
        source_video_id: entry.source_video_id,
      });
    }
    if (!chainTrace) {
      issues.push({
        code: 'CHAIN_TRACE_NOT_PRESERVED',
        message: `Chain trace not preserved for ${entry.source_video_id}`,
        severity: 'error',
        source_video_id: entry.source_video_id,
      });
    }
    if (!payloadOk) {
      issues.push({
        code: 'PAYLOAD_INTEGRITY_FAIL',
        message: `Payload integrity check failed for ${entry.source_video_id}`,
        severity: 'error',
        source_video_id: entry.source_video_id,
      });
    }

    sourceAudits.push({
      source_video_id: entry.source_video_id,
      master_package_id: entry.master_package_id,
      image_app_importable: imageImportable,
      video_app_importable: videoImportable,
      chain_trace_preserved: chainTrace,
      payload_integrity: payloadOk,
    });
  }

  const imageAppImportable =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.image_app_importable);
  const videoAppImportable =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.video_app_importable);
  const chainTracePreserved =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.chain_trace_preserved);
  const payloadIntegrity =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.payload_integrity);

  const pass =
    exportPackage.source_count === EXPECTED_SOURCE_COUNT &&
    imageAppImportable &&
    videoAppImportable &&
    chainTracePreserved &&
    payloadIntegrity &&
    schemaIntegrity &&
    consumerIntegrity &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: MovieAnalysisImportSimulationReport = {
    report_id: 'movie-analysis-import-simulation-report-v1',
    phase: IMPORT_SIMULATION_PHASE,
    timestamp,
    export_package_path: EXPORT_PACKAGE_PATH,
    source_count: exportPackage.source_count,
    image_app_importable: imageAppImportable,
    video_app_importable: videoAppImportable,
    chain_trace_preserved: chainTracePreserved,
    payload_integrity: payloadIntegrity,
    schema_integrity: schemaIntegrity,
    consumer_integrity: consumerIntegrity,
    source_audits: sourceAudits,
    final_verdict: pass ? IMPORT_SIMULATION_PASS_VERDICT : IMPORT_SIMULATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, IMPORT_SIMULATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, IMPORT_SIMULATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
