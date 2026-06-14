import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { EXPECTED_SOURCE_VIDEO_IDS } from './movieAnalysisDnaAdapterLibrary.js';
import {
  IMAGE_RUNTIME_PACKAGE_DIR,
  IMAGE_RUNTIME_PACKAGE_PATH,
  type ImageRuntimePackageEntry,
  type MovieAnalysisImageRuntimePackage,
} from './movieAnalysisImageRuntimePackage.js';
import {
  LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2MasterCertificationReport,
} from './movieAnalysisLevel2MasterCertification.js';
import {
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
  LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE,
  type MovieAnalysisLevel2MasterSimulationCertificationReport,
} from './movieAnalysisLevel2MasterSimulationCertification.js';
import type { RuntimeTarget } from './movieAnalysisRuntimeBindingFramework.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const REAL_IMAGE_RUNTIME_PREPARATION_PHASE =
  'PHASE-LEVEL2D-001-MOVIE_ANALYSIS_REAL_IMAGE_RUNTIME_PREPARATION_V1' as const;
export const REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_REAL_IMAGE_RUNTIME_PREPARATION_V1' as const;
export const REAL_IMAGE_RUNTIME_PREPARATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_REAL_IMAGE_RUNTIME_PREPARATION_V1' as const;
export const REAL_IMAGE_RUNTIME_PREPARATION_DIR =
  'reports/movie_analysis_real_image_runtime_preparation' as const;
export const REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH =
  'reports/movie_analysis_real_image_runtime_preparation/movie-analysis-real-image-runtime-preparation-report.json' as const;
export const REAL_IMAGE_RUNTIME_PREPARATION_MD_PATH =
  'reports/movie_analysis_real_image_runtime_preparation/MOVIE_ANALYSIS_REAL_IMAGE_RUNTIME_PREPARATION.md' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_VIDEO_IDS };

export type PreparationStatus = 'PASS' | 'FAIL';

export type RealImageRuntimePreparationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type RealImageRuntimePreparationEntry = {
  source_video_id: string;
  resolved_image_prompt: string;
  negative_prompt: string;
  runtime_mapping_count: number;
  runtime_targets: RuntimeTarget[];
  adapter_traceability_preserved: true;
  preparation_ready: true;
  planning_only: true;
  generation: false;
};

export type SourceRealImageRuntimePreparationAudit = {
  source_video_id: string;
  image_runtime_entry_present: PreparationStatus;
  runtime_mapping_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  source_preparation_ready: PreparationStatus;
};

export type MovieAnalysisRealImageRuntimePreparationReport = {
  report_id: string;
  phase: typeof REAL_IMAGE_RUNTIME_PREPARATION_PHASE;
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
  level2_master_certification_report_path: typeof LEVEL2_MASTER_CERTIFICATION_REPORT_PATH;
  level2_master_simulation_certification_report_path: typeof LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH;
  image_runtime_package_dir: typeof IMAGE_RUNTIME_PACKAGE_DIR;
  image_runtime_package_path: typeof IMAGE_RUNTIME_PACKAGE_PATH;
  source_count: number;
  adapter_count: number;
  image_runtime_ready: PreparationStatus;
  image_app_consumption_ready: PreparationStatus;
  image_generation_simulation_ready: PreparationStatus;
  runtime_mapping_preserved: PreparationStatus;
  traceability_preserved: PreparationStatus;
  runtime_preparation_ready: PreparationStatus;
  planning_only_status: PreparationStatus;
  preparation_entries: RealImageRuntimePreparationEntry[];
  source_audits: SourceRealImageRuntimePreparationAudit[];
  final_verdict:
    | typeof REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT
    | typeof REAL_IMAGE_RUNTIME_PREPARATION_FAIL_VERDICT;
  issues: RealImageRuntimePreparationIssue[];
};

const IMAGE_PRIMARY_TARGETS: RuntimeTarget[] = [
  'scene_prompt',
  'camera_prompt',
  'emotion_prompt',
  'transition_runtime_rule',
  'continuity_runtime_rule',
  'narrative_runtime_rule',
];

function loadLevel2MasterReport(
  projectRoot: string
): MovieAnalysisLevel2MasterCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL2_MASTER_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel2MasterCertificationReport;
}

function loadMasterSimulationReport(
  projectRoot: string
): MovieAnalysisLevel2MasterSimulationCertificationReport | null {
  const abs = path.join(projectRoot, LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(
    fs.readFileSync(abs, 'utf8')
  ) as MovieAnalysisLevel2MasterSimulationCertificationReport;
}

function loadImageRuntimePackage(projectRoot: string): MovieAnalysisImageRuntimePackage | null {
  const abs = path.join(projectRoot, IMAGE_RUNTIME_PACKAGE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as MovieAnalysisImageRuntimePackage;
}

function buildPreparationEntry(entry: ImageRuntimePackageEntry): RealImageRuntimePreparationEntry {
  return {
    source_video_id: entry.source_video_id,
    resolved_image_prompt: entry.final_image_prompt_resolved,
    negative_prompt: entry.negative_prompt,
    runtime_mapping_count: entry.resolved_runtime_mappings.length,
    runtime_targets: entry.resolved_runtime_mappings.map((mapping) => mapping.runtime_target),
    adapter_traceability_preserved: true,
    preparation_ready: true,
    planning_only: true,
    generation: false,
  };
}

function auditSourcePreparation(
  entry: ImageRuntimePackageEntry | undefined,
  sourceVideoId: string
): SourceRealImageRuntimePreparationAudit {
  if (!entry) {
    return {
      source_video_id: sourceVideoId,
      image_runtime_entry_present: 'FAIL',
      runtime_mapping_preserved: 'FAIL',
      traceability_preserved: 'FAIL',
      source_preparation_ready: 'FAIL',
    };
  }

  const entryPresent =
    entry.template_id.length > 0 &&
    entry.assembly_id.length > 0 &&
    entry.image_prompt_ready === true &&
    entry.planning_only === true &&
    entry.generation === false &&
    entry.bridge_only === true &&
    entry.final_image_prompt_resolved.startsWith('image_prompt:') &&
    entry.negative_prompt.trim().length > 0
      ? 'PASS'
      : 'FAIL';

  const mappingPreserved =
    entry.resolved_runtime_mappings.length === 6 &&
    entry.resolved_runtime_mappings.every((mapping) => mapping.conflict_free === true) &&
    IMAGE_PRIMARY_TARGETS.every((target) =>
      entry.resolved_runtime_mappings.some((mapping) => mapping.runtime_target === target)
    )
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved =
    entry.adapter_traceability.traceability_preserved === true &&
    entry.adapter_traceability.cinematic_dna_id.length > 0 &&
    entry.adapter_traceability.integration_id.length > 0 &&
    entry.adapter_traceability.adapter_library_entry_id.length > 0 &&
    entry.adapter_traceability.adapter_ids.length === 6
      ? 'PASS'
      : 'FAIL';

  const checks: PreparationStatus[] = [entryPresent, mappingPreserved, traceabilityPreserved];

  return {
    source_video_id: sourceVideoId,
    image_runtime_entry_present: entryPresent,
    runtime_mapping_preserved: mappingPreserved,
    traceability_preserved: traceabilityPreserved,
    source_preparation_ready: checks.every((status) => status === 'PASS') ? 'PASS' : 'FAIL',
  };
}

function aggregateStatus(
  audits: SourceRealImageRuntimePreparationAudit[],
  field: keyof Omit<SourceRealImageRuntimePreparationAudit, 'source_video_id' | 'source_preparation_ready'>
): PreparationStatus {
  if (audits.length !== EXPECTED_SOURCE_COUNT) {
    return 'FAIL';
  }
  return audits.every((audit) => audit[field] === 'PASS') ? 'PASS' : 'FAIL';
}

function buildMarkdown(report: MovieAnalysisRealImageRuntimePreparationReport): string {
  const lines = [
    '# Movie Analysis Real Image Runtime Preparation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Preparation Mode',
    '',
    '| Flag | Value |',
    '| --- | --- |',
    `| planning_only | ${report.planning_only} |`,
    `| generation | ${report.generation} |`,
    `| no_execution | ${report.no_execution} |`,
    `| no_rendering | ${report.no_rendering} |`,
    '',
    '## Preparation Summary',
    '',
    '| Check | Value |',
    '| --- | --- |',
    `| source_count | ${report.source_count} |`,
    `| adapter_count | ${report.adapter_count} |`,
    `| image_runtime_ready | ${report.image_runtime_ready} |`,
    `| image_app_consumption_ready | ${report.image_app_consumption_ready} |`,
    `| image_generation_simulation_ready | ${report.image_generation_simulation_ready} |`,
    `| runtime_mapping_preserved | ${report.runtime_mapping_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| runtime_preparation_ready | ${report.runtime_preparation_ready} |`,
    `| planning_only | ${report.planning_only_status} |`,
    '',
    '## Source Audits',
    '',
  ];

  for (const audit of report.source_audits) {
    lines.push(
      `### ${audit.source_video_id}`,
      '',
      `- image_runtime_entry_present: ${audit.image_runtime_entry_present}`,
      `- runtime_mapping_preserved: ${audit.runtime_mapping_preserved}`,
      `- traceability_preserved: ${audit.traceability_preserved}`,
      `- source_preparation_ready: ${audit.source_preparation_ready}`,
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

function writeFailReport(
  root: string,
  timestamp: string,
  issues: RealImageRuntimePreparationIssue[]
): MovieAnalysisRealImageRuntimePreparationReport {
  const report: MovieAnalysisRealImageRuntimePreparationReport = {
    report_id: 'movie-analysis-real-image-runtime-preparation-report-v1',
    phase: REAL_IMAGE_RUNTIME_PREPARATION_PHASE,
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
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    level2_master_simulation_certification_report_path:
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    source_count: 0,
    adapter_count: 0,
    image_runtime_ready: 'FAIL',
    image_app_consumption_ready: 'FAIL',
    image_generation_simulation_ready: 'FAIL',
    runtime_mapping_preserved: 'FAIL',
    traceability_preserved: 'FAIL',
    runtime_preparation_ready: 'FAIL',
    planning_only_status: 'FAIL',
    preparation_entries: [],
    source_audits: [],
    final_verdict: REAL_IMAGE_RUNTIME_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisRealImageRuntimePreparation(
  projectRoot?: string
): MovieAnalysisRealImageRuntimePreparationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: RealImageRuntimePreparationIssue[] = [];
  const timestamp = new Date().toISOString();

  const masterSimulationDir = path.join(root, LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR);
  if (!fs.existsSync(masterSimulationDir)) {
    issues.push({
      code: 'LEVEL2_MASTER_SIMULATION_DIR_MISSING',
      message: `Missing ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const level2MasterReport = loadLevel2MasterReport(root);
  if (!level2MasterReport) {
    issues.push({
      code: 'LEVEL2_MASTER_REPORT_MISSING',
      message: `Missing ${LEVEL2_MASTER_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    level2MasterReport.final_verdict !== LEVEL2_MASTER_CERTIFICATION_PASS_VERDICT ||
    level2MasterReport.certification_status !== LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2_NOT_COMPLETE',
      message: `Level 2 must be ${LEVEL2_MASTER_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const masterSimulationReport = loadMasterSimulationReport(root);
  if (!masterSimulationReport) {
    issues.push({
      code: 'LEVEL2_MASTER_SIMULATION_REPORT_MISSING',
      message: `Missing ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  if (
    masterSimulationReport.final_verdict !== LEVEL2_MASTER_SIMULATION_CERTIFICATION_PASS_VERDICT ||
    masterSimulationReport.certification_status !==
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE
  ) {
    issues.push({
      code: 'LEVEL2_SIMULATION_NOT_COMPLETE',
      message: `Level 2 simulation must be ${LEVEL2_MASTER_SIMULATION_CERTIFICATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
  }

  const runtimePackageDir = path.join(root, IMAGE_RUNTIME_PACKAGE_DIR);
  if (!fs.existsSync(runtimePackageDir)) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_DIR_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_DIR}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const runtimePackage = loadImageRuntimePackage(root);
  if (!runtimePackage) {
    issues.push({
      code: 'IMAGE_RUNTIME_PACKAGE_MISSING',
      message: `Missing ${IMAGE_RUNTIME_PACKAGE_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const preparationEntries: RealImageRuntimePreparationEntry[] = [];
  const sourceAudits: SourceRealImageRuntimePreparationAudit[] = [];

  for (const sourceVideoId of EXPECTED_SOURCE_VIDEO_IDS) {
    const entry = runtimePackage.entries.find((item) => item.source_video_id === sourceVideoId);
    if (entry) {
      preparationEntries.push(buildPreparationEntry(entry));
    }

    const audit = auditSourcePreparation(entry, sourceVideoId);
    sourceAudits.push(audit);

    if (audit.source_preparation_ready === 'FAIL') {
      issues.push({
        code: 'SOURCE_PREPARATION_NOT_READY',
        message: `Real image runtime preparation failed for ${sourceVideoId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      });
    }
  }

  const packageRuntimeMappingPreserved = aggregateStatus(sourceAudits, 'runtime_mapping_preserved');
  const packageTraceabilityPreserved = aggregateStatus(sourceAudits, 'traceability_preserved');

  const imageRuntimeReady: PreparationStatus =
    masterSimulationReport.completion_validation.image_runtime_ready === 'PASS' &&
    runtimePackage.source_count === EXPECTED_SOURCE_COUNT &&
    runtimePackage.adapter_count === EXPECTED_ADAPTER_COUNT &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false &&
    preparationEntries.length === EXPECTED_SOURCE_COUNT &&
    sourceAudits.every((audit) => audit.image_runtime_entry_present === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const imageAppConsumptionReady: PreparationStatus =
    masterSimulationReport.completion_validation.image_app_consumption_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const imageGenerationSimulationReady: PreparationStatus =
    masterSimulationReport.completion_validation.image_generation_simulation_ready === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const runtimeMappingPreserved: PreparationStatus =
    packageRuntimeMappingPreserved === 'PASS' &&
    masterSimulationReport.runtime_mapping_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const traceabilityPreserved: PreparationStatus =
    packageTraceabilityPreserved === 'PASS' &&
    masterSimulationReport.traceability_preserved === 'PASS'
      ? 'PASS'
      : 'FAIL';

  const sourceCount = runtimePackage.source_count;
  const adapterCount = runtimePackage.adapter_count;

  if (sourceCount !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'SOURCE_COUNT_INVALID',
      message: `Expected source_count=${EXPECTED_SOURCE_COUNT}`,
      severity: 'error',
    });
  }

  if (adapterCount !== EXPECTED_ADAPTER_COUNT) {
    issues.push({
      code: 'ADAPTER_COUNT_INVALID',
      message: `Expected adapter_count=${EXPECTED_ADAPTER_COUNT}`,
      severity: 'error',
    });
  }

  const safetyValid =
    level2MasterReport.planning_only === true &&
    level2MasterReport.planning_only_status === 'PASS' &&
    level2MasterReport.generation === false &&
    masterSimulationReport.planning_only === true &&
    masterSimulationReport.planning_only_status === 'PASS' &&
    masterSimulationReport.generation === false &&
    runtimePackage.safety_summary.planning_only === true &&
    runtimePackage.safety_summary.generation === false;

  if (!safetyValid) {
    issues.push({
      code: 'PLANNING_ONLY_FAIL',
      message: 'Planning-only safety validation failed',
      severity: 'error',
    });
  }

  const planningOnlyStatus: PreparationStatus = safetyValid ? 'PASS' : 'FAIL';

  const gateChecks: PreparationStatus[] = [
    imageRuntimeReady,
    imageAppConsumptionReady,
    imageGenerationSimulationReady,
    runtimeMappingPreserved,
    traceabilityPreserved,
    planningOnlyStatus,
  ];

  for (const status of gateChecks) {
    if (status === 'FAIL') {
      issues.push({
        code: 'REAL_IMAGE_RUNTIME_PREPARATION_VALIDATION_FAIL',
        message: 'Real image runtime preparation validation failed',
        severity: 'error',
      });
      break;
    }
  }

  const runtimePreparationReady =
    sourceCount === EXPECTED_SOURCE_COUNT &&
    adapterCount === EXPECTED_ADAPTER_COUNT &&
    gateChecks.every((status) => status === 'PASS') &&
    sourceAudits.every((audit) => audit.source_preparation_ready === 'PASS') &&
    issues.filter((issue) => issue.severity === 'error').length === 0
      ? 'PASS'
      : 'FAIL';

  const pass = runtimePreparationReady === 'PASS';

  if (
    !pass &&
    !issues.some((issue) => issue.code === 'REAL_IMAGE_RUNTIME_PREPARATION_VALIDATION_FAIL')
  ) {
    issues.push({
      code: 'REAL_IMAGE_RUNTIME_PREPARATION_NOT_READY',
      message: 'Real image runtime preparation is not ready',
      severity: 'error',
    });
  }

  const report: MovieAnalysisRealImageRuntimePreparationReport = {
    report_id: 'movie-analysis-real-image-runtime-preparation-report-v1',
    phase: REAL_IMAGE_RUNTIME_PREPARATION_PHASE,
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
    level2_master_certification_report_path: LEVEL2_MASTER_CERTIFICATION_REPORT_PATH,
    level2_master_simulation_certification_report_path:
      LEVEL2_MASTER_SIMULATION_CERTIFICATION_REPORT_PATH,
    image_runtime_package_dir: IMAGE_RUNTIME_PACKAGE_DIR,
    image_runtime_package_path: IMAGE_RUNTIME_PACKAGE_PATH,
    source_count: sourceCount,
    adapter_count: adapterCount,
    image_runtime_ready: imageRuntimeReady,
    image_app_consumption_ready: imageAppConsumptionReady,
    image_generation_simulation_ready: imageGenerationSimulationReady,
    runtime_mapping_preserved: runtimeMappingPreserved,
    traceability_preserved: traceabilityPreserved,
    runtime_preparation_ready: runtimePreparationReady,
    planning_only_status: planningOnlyStatus,
    preparation_entries: preparationEntries,
    source_audits: sourceAudits,
    final_verdict: pass
      ? REAL_IMAGE_RUNTIME_PREPARATION_PASS_VERDICT
      : REAL_IMAGE_RUNTIME_PREPARATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, REAL_IMAGE_RUNTIME_PREPARATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
