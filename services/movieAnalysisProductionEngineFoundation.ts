import fs from 'node:fs';
import path from 'node:path';
import {
  CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
  CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
} from './movieAnalysisCharacterEvolutionValidation.js';
import {
  DATASET_EXPORT_PASS_VERDICT,
  DATASET_EXPORT_REPORT_PATH,
  DATASET_PATH,
  EXPECTED_SOURCE_COUNT,
  type MovieAnalysisDataset,
  loadMovieAnalysisDataset,
} from './movieAnalysisDatasetExport.js';
import { DATASET_EXPORT_VALIDATION_REPORT_PATH } from './movieAnalysisDatasetExportValidator.js';
import { EXPECTED_ADAPTER_COUNT } from './movieAnalysisDnaPackaging.js';
import { loadMovieAnalysisGenerationBlueprintPlan } from './movieAnalysisGenerationBlueprintDesign.js';
import {
  LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT,
  LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
  LEVEL3_ENTRY_APPROVED_STATUS,
} from './movieAnalysisLevel3BridgeCertification.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from './movieAnalysisLevel2MasterCertificationV3.js';
import {
  MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
  MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisMultiEpisodeConsistencyValidation.js';
import { type PackageTraceEntry } from './movieAnalysisMasterPackageDesign.js';
import {
  STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
  STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
} from './movieAnalysisStoryArcConsistencyValidation.js';
import {
  WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
  WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
} from './movieAnalysisWorldStateMemoryValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_ENGINE_FOUNDATION_PHASE =
  'PHASE-LEVEL3-001-PRODUCTION_ENGINE_FOUNDATION_V1' as const;
export const PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_ENGINE_FOUNDATION_V1' as const;
export const PRODUCTION_ENGINE_FOUNDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_ENGINE_FOUNDATION_V1' as const;
export const PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE =
  'PRODUCTION_ENGINE_FOUNDATION_READY' as const;
export const PRODUCTION_ENGINE_FOUNDATION_DIR =
  'reports/movie_analysis_production_engine_foundation' as const;
export const PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH =
  'reports/movie_analysis_production_engine_foundation/movie-analysis-production-engine-foundation-report.json' as const;
export const PRODUCTION_ENGINE_FOUNDATION_MD_PATH =
  'reports/movie_analysis_production_engine_foundation/MOVIE_ANALYSIS_PRODUCTION_ENGINE_FOUNDATION.md' as const;
export const PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR =
  'exports/movie_analysis_production_engine_foundation' as const;
export const PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH =
  'exports/movie_analysis_production_engine_foundation/movie-analysis-production-engine-foundation-manifest.json' as const;
export const PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH =
  'exports/movie_analysis_production_engine_foundation/production-engine-foundation.json' as const;

export const PRODUCTION_PIPELINE_STAGE_COUNT = 4 as const;
export const PRODUCTION_MEMORY_BINDING_COUNT = 4 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ProductionEngineFoundationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  source_video_id?: string;
};

export type ProductionBlueprintEntry = {
  source_video_id: string;
  generation_blueprint_id: string;
  generation_package_id: string;
  character_structure_count: number;
  scene_structure_count: number;
  emotion_structure_count: number;
  continuity_structure_count: number;
  blueprint_ready: CertificationStatus;
};

export type ProductionMemoryBindingAudit = {
  binding_id:
    | 'character_memory_binding'
    | 'location_memory_binding'
    | 'story_memory_binding'
    | 'cross_episode_memory_binding';
  binding_label: string;
  evidence_report_path: string;
  binding_ready: CertificationStatus;
};

export type ProductionEngineFoundationArtifact = {
  foundation_id: string;
  phase: typeof PRODUCTION_ENGINE_FOUNDATION_PHASE;
  generated_at: string;
  pipeline_stages: ['movie_analysis', 'production_dataset', 'production_blueprint', 'production_engine'];
  production_dataset: {
    dataset_path: typeof DATASET_PATH;
    dataset_id: string;
    source_count: number;
  };
  production_blueprints: ProductionBlueprintEntry[];
  memory_bindings: ProductionMemoryBindingAudit[];
  traceability_chain: Array<{
    source_video_id: string;
    trace_entry_count: number;
    trace_integrity: CertificationStatus;
  }>;
  safety_flags: {
    planning_only: true;
    generation: false;
    runtime_execution: false;
    video_generation: false;
    image_generation: false;
    gpu_execution: false;
    external_call_allowed: false;
    no_execution: true;
    no_rendering: true;
  };
  production_engine_foundation_ready: boolean;
};

export type MovieAnalysisProductionEngineFoundationManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_ENGINE_FOUNDATION_PHASE;
  generated_at: string;
  production_pipeline_stage_count: typeof PRODUCTION_PIPELINE_STAGE_COUNT;
  production_memory_binding_count: typeof PRODUCTION_MEMORY_BINDING_COUNT;
  production_blueprint_generation: CertificationStatus;
  production_dataset_consumption: CertificationStatus;
  character_memory_binding: CertificationStatus;
  location_memory_binding: CertificationStatus;
  story_memory_binding: CertificationStatus;
  cross_episode_memory_binding: CertificationStatus;
  traceability_preserved: boolean;
  production_engine_foundation_ready: boolean;
  certification_status: typeof PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE | null;
};

export type MovieAnalysisProductionEngineFoundationReport = {
  report_id: string;
  phase: typeof PRODUCTION_ENGINE_FOUNDATION_PHASE;
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
  level3_bridge_certification_report_path: typeof LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH;
  production_engine_foundation_export_dir: typeof PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR;
  production_engine_foundation_manifest_path: typeof PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH;
  production_engine_foundation_artifact_path: typeof PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  production_pipeline_stage_count: typeof PRODUCTION_PIPELINE_STAGE_COUNT;
  production_memory_binding_count: typeof PRODUCTION_MEMORY_BINDING_COUNT;
  production_blueprint_generation: CertificationStatus;
  production_dataset_consumption: CertificationStatus;
  character_memory_binding: CertificationStatus;
  location_memory_binding: CertificationStatus;
  story_memory_binding: CertificationStatus;
  cross_episode_memory_binding: CertificationStatus;
  traceability_preserved: boolean;
  dataset_consumption_failure: boolean;
  memory_binding_failure: boolean;
  production_blueprint_failure: boolean;
  traceability_loss: boolean;
  production_engine_break: boolean;
  production_engine_foundation_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE | null;
  production_blueprint_entries: ProductionBlueprintEntry[];
  memory_binding_audits: ProductionMemoryBindingAudit[];
  final_verdict:
    | typeof PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT
    | typeof PRODUCTION_ENGINE_FOUNDATION_FAIL_VERDICT;
  issues: ProductionEngineFoundationIssue[];
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function fieldPass(report: Record<string, unknown> | null, field: string): boolean {
  return report?.[field] === 'PASS';
}

function reportPassed(
  report: Record<string, unknown> | null,
  passVerdict: string,
  readyField?: string
): boolean {
  if (!report) return false;
  if (report.final_verdict !== passVerdict) return false;
  if (readyField && report[readyField] !== 'PASS') return false;
  return true;
}

function datasetExportBuildPassed(report: Record<string, unknown> | null): boolean {
  if (!report) return false;
  if (report.final_verdict === DATASET_EXPORT_PASS_VERDICT) return true;
  return report.build_status === 'PASS';
}

function traceIntegrityForSource(trace: PackageTraceEntry[] | undefined): boolean {
  if (!trace || trace.length === 0) return false;
  return trace.every(
    (entry) =>
      typeof entry.step === 'number' &&
      entry.phase.length > 0 &&
      entry.plan_type.length > 0 &&
      entry.plan_id.length > 0 &&
      entry.status === 'designed'
  );
}

function buildBlueprintEntry(
  root: string,
  sourceVideoId: string,
  generationBlueprintId: string
): { entry: ProductionBlueprintEntry; issue?: ProductionEngineFoundationIssue } {
  const blueprint = loadMovieAnalysisGenerationBlueprintPlan(root, generationBlueprintId);
  if (!blueprint) {
    return {
      entry: {
        source_video_id: sourceVideoId,
        generation_blueprint_id: generationBlueprintId,
        generation_package_id: '',
        character_structure_count: 0,
        scene_structure_count: 0,
        emotion_structure_count: 0,
        continuity_structure_count: 0,
        blueprint_ready: 'FAIL',
      },
      issue: {
        code: 'PRODUCTION_BLUEPRINT_MISSING',
        message: `Missing generation blueprint plan: ${generationBlueprintId}`,
        severity: 'error',
        source_video_id: sourceVideoId,
      },
    };
  }

  const ready =
    blueprint.source_video_id === sourceVideoId &&
    blueprint.character_generation_structure.length > 0 &&
    blueprint.scene_generation_structure.length > 0 &&
    blueprint.emotion_generation_structure.length > 0 &&
    blueprint.continuity_generation_structure.length > 0 &&
    blueprint.execution_flags.generation_blueprint_only === true;

  return {
    entry: {
      source_video_id: sourceVideoId,
      generation_blueprint_id: blueprint.generation_blueprint_id,
      generation_package_id: blueprint.generation_package_id,
      character_structure_count: blueprint.character_generation_structure.length,
      scene_structure_count: blueprint.scene_generation_structure.length,
      emotion_structure_count: blueprint.emotion_generation_structure.length,
      continuity_structure_count: blueprint.continuity_generation_structure.length,
      blueprint_ready: toStatus(ready),
    },
    issue: ready
      ? undefined
      : {
          code: 'PRODUCTION_BLUEPRINT_INVALID',
          message: `Generation blueprint structure invalid for ${generationBlueprintId}`,
          severity: 'error',
          source_video_id: sourceVideoId,
        },
  };
}

function buildMemoryBindingAudits(root: string): {
  audits: ProductionMemoryBindingAudit[];
  issues: ProductionEngineFoundationIssue[];
} {
  const issues: ProductionEngineFoundationIssue[] = [];

  const character = loadReport<Record<string, unknown>>(
    root,
    CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH
  );
  const characterReady =
    reportPassed(
      character,
      CHARACTER_EVOLUTION_VALIDATION_PASS_VERDICT,
      'character_evolution_validation_ready'
    ) &&
    fieldPass(character, 'growth_memory_preserved') &&
    fieldPass(character, 'dna_binding_preserved') &&
    fieldPass(character, 'traceability_preserved');
  if (!characterReady) {
    issues.push({
      code: 'CHARACTER_MEMORY_BINDING_FAIL',
      message: 'Character memory binding evidence failed',
      severity: 'error',
    });
  }

  const location = loadReport<Record<string, unknown>>(
    root,
    WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH
  );
  const locationReady =
    reportPassed(
      location,
      WORLD_STATE_MEMORY_VALIDATION_PASS_VERDICT,
      'world_state_memory_validation_ready'
    ) &&
    fieldPass(location, 'world_state_preserved') &&
    fieldPass(location, 'historical_memory_preserved') &&
    fieldPass(location, 'traceability_preserved');
  if (!locationReady) {
    issues.push({
      code: 'LOCATION_MEMORY_BINDING_FAIL',
      message: 'Location memory binding evidence failed',
      severity: 'error',
    });
  }

  const story = loadReport<Record<string, unknown>>(
    root,
    STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  const storyReady =
    reportPassed(
      story,
      STORY_ARC_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'story_arc_consistency_validation_ready'
    ) &&
    fieldPass(story, 'callback_memory_consistency') &&
    fieldPass(story, 'story_progression_consistency');
  if (!storyReady) {
    issues.push({
      code: 'STORY_MEMORY_BINDING_FAIL',
      message: 'Story memory binding evidence failed',
      severity: 'error',
    });
  }

  const crossEpisode = loadReport<Record<string, unknown>>(
    root,
    MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH
  );
  const crossEpisodeReady =
    reportPassed(
      crossEpisode,
      MULTI_EPISODE_CONSISTENCY_VALIDATION_PASS_VERDICT,
      'multi_episode_consistency_validation_ready'
    ) &&
    fieldPass(crossEpisode, 'cross_episode_callback') &&
    fieldPass(crossEpisode, 'series_continuity') &&
    fieldPass(crossEpisode, 'traceability_preserved');
  if (!crossEpisodeReady) {
    issues.push({
      code: 'CROSS_EPISODE_MEMORY_BINDING_FAIL',
      message: 'Cross-episode memory binding evidence failed',
      severity: 'error',
    });
  }

  return {
    audits: [
      {
        binding_id: 'character_memory_binding',
        binding_label: 'Character Memory Binding',
        evidence_report_path: CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH,
        binding_ready: toStatus(characterReady),
      },
      {
        binding_id: 'location_memory_binding',
        binding_label: 'Location Memory Binding',
        evidence_report_path: WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH,
        binding_ready: toStatus(locationReady),
      },
      {
        binding_id: 'story_memory_binding',
        binding_label: 'Story Memory Binding',
        evidence_report_path: STORY_ARC_CONSISTENCY_VALIDATION_REPORT_PATH,
        binding_ready: toStatus(storyReady),
      },
      {
        binding_id: 'cross_episode_memory_binding',
        binding_label: 'Cross Episode Memory Binding',
        evidence_report_path: MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH,
        binding_ready: toStatus(crossEpisodeReady),
      },
    ],
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisProductionEngineFoundationReport): string {
  const lines = [
    '# Movie Analysis Production Engine Foundation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
  ];

  if (report.certification_status) {
    lines.push(`## Status: ${report.certification_status}`, '');
  }

  lines.push(
    '## Pipeline',
    '',
    'Movie Analysis → Production Dataset → Production Blueprint → Production Engine',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| production_blueprint_generation | ${report.production_blueprint_generation} |`,
    `| production_dataset_consumption | ${report.production_dataset_consumption} |`,
    `| character_memory_binding | ${report.character_memory_binding} |`,
    `| location_memory_binding | ${report.location_memory_binding} |`,
    `| story_memory_binding | ${report.story_memory_binding} |`,
    `| cross_episode_memory_binding | ${report.cross_episode_memory_binding} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_engine_foundation_ready | ${report.production_engine_foundation_ready} |`,
    '',
    '## Production Blueprints',
    ''
  );

  for (const entry of report.production_blueprint_entries) {
    lines.push(
      `- ${entry.source_video_id}: ${entry.generation_blueprint_id} ready=${entry.blueprint_ready}`
    );
  }

  lines.push('', '## Memory Bindings', '');
  for (const audit of report.memory_binding_audits) {
    lines.push(`- ${audit.binding_id}: ${audit.binding_ready} (${audit.evidence_report_path})`);
  }

  if (report.issues.length > 0) {
    lines.push('', '## Issues', '');
    for (const issue of report.issues) {
      lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }

  return lines.join('\n');
}

function writeFailReport(
  root: string,
  timestamp: string,
  issues: ProductionEngineFoundationIssue[]
): MovieAnalysisProductionEngineFoundationReport {
  const report: MovieAnalysisProductionEngineFoundationReport = {
    report_id: 'movie-analysis-production-engine-foundation-report-v1',
    phase: PRODUCTION_ENGINE_FOUNDATION_PHASE,
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
    level3_bridge_certification_report_path: LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
    production_engine_foundation_export_dir: PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR,
    production_engine_foundation_manifest_path: PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
    production_engine_foundation_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    production_pipeline_stage_count: PRODUCTION_PIPELINE_STAGE_COUNT,
    production_memory_binding_count: PRODUCTION_MEMORY_BINDING_COUNT,
    production_blueprint_generation: 'FAIL',
    production_dataset_consumption: 'FAIL',
    character_memory_binding: 'FAIL',
    location_memory_binding: 'FAIL',
    story_memory_binding: 'FAIL',
    cross_episode_memory_binding: 'FAIL',
    traceability_preserved: false,
    dataset_consumption_failure: true,
    memory_binding_failure: true,
    production_blueprint_failure: true,
    traceability_loss: true,
    production_engine_break: true,
    production_engine_foundation_ready: 'FAIL',
    certification_status: null,
    production_blueprint_entries: [],
    memory_binding_audits: [],
    final_verdict: PRODUCTION_ENGINE_FOUNDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_FOUNDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionEngineFoundation(
  projectRoot?: string
): MovieAnalysisProductionEngineFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionEngineFoundationIssue[] = [];
  const timestamp = new Date().toISOString();

  const level3Bridge = loadReport<Record<string, unknown>>(
    root,
    LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH
  );
  if (
    !level3Bridge ||
    level3Bridge.final_verdict !== LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT ||
    level3Bridge.final_output_status !== LEVEL3_ENTRY_APPROVED_STATUS ||
    level3Bridge.level3_entry_ready !== true
  ) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Required ${LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT} with ${LEVEL3_ENTRY_APPROVED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const v3 = loadReport<Record<string, unknown>>(root, LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH);
  if (!v3 || v3.certification_status !== LEVEL2_COMPLETE_STATUS) {
    issues.push({
      code: 'PRECHECK_FAIL',
      message: `Missing ${LEVEL2_COMPLETE_STATUS} from Level2 master certification`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const dataset = loadMovieAnalysisDataset(root);
  if (!dataset) {
    issues.push({
      code: 'DATASET_MISSING',
      message: `Missing ${DATASET_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const datasetExportReady =
    datasetExportBuildPassed(loadReport(root, DATASET_EXPORT_REPORT_PATH)) &&
    reportPassed(loadReport(root, DATASET_EXPORT_VALIDATION_REPORT_PATH), DATASET_EXPORT_PASS_VERDICT) &&
    dataset.source_count === EXPECTED_SOURCE_COUNT &&
    dataset.sources.length === EXPECTED_SOURCE_COUNT;

  if (!datasetExportReady) {
    issues.push({
      code: 'DATASET_CONSUMPTION_FAIL',
      message: 'Production dataset consumption validation failed',
      severity: 'error',
    });
  }

  const productionBlueprintEntries: ProductionBlueprintEntry[] = [];
  for (const source of dataset.sources) {
    const { entry, issue } = buildBlueprintEntry(
      root,
      source.source_video_id,
      source.generation_blueprint_id
    );
    productionBlueprintEntries.push(entry);
    if (issue) issues.push(issue);
  }

  const productionBlueprintGeneration = toStatus(
    productionBlueprintEntries.length === EXPECTED_SOURCE_COUNT &&
      productionBlueprintEntries.every((entry) => entry.blueprint_ready === 'PASS')
  );

  const { audits: memoryBindingAudits, issues: memoryIssues } = buildMemoryBindingAudits(root);
  issues.push(...memoryIssues);

  const characterMemoryBinding =
    memoryBindingAudits.find((audit) => audit.binding_id === 'character_memory_binding')
      ?.binding_ready ?? 'FAIL';
  const locationMemoryBinding =
    memoryBindingAudits.find((audit) => audit.binding_id === 'location_memory_binding')
      ?.binding_ready ?? 'FAIL';
  const storyMemoryBinding =
    memoryBindingAudits.find((audit) => audit.binding_id === 'story_memory_binding')?.binding_ready ??
    'FAIL';
  const crossEpisodeMemoryBinding =
    memoryBindingAudits.find((audit) => audit.binding_id === 'cross_episode_memory_binding')
      ?.binding_ready ?? 'FAIL';

  const traceabilityChain = dataset.sources.map((source) => {
    const trace = dataset.package_traces[source.source_video_id];
    const integrity = traceIntegrityForSource(trace);
    return {
      source_video_id: source.source_video_id,
      trace_entry_count: trace?.length ?? 0,
      trace_integrity: toStatus(integrity),
    };
  });

  const traceabilityPreserved =
    fieldPass(v3, 'dna_traceability_preserved') &&
    fieldPass(v3, 'adapter_traceability_preserved') &&
    fieldPass(v3, 'pipeline_traceability_preserved') &&
    traceabilityChain.every((entry) => entry.trace_integrity === 'PASS') &&
    fieldPass(loadReport(root, CHARACTER_EVOLUTION_VALIDATION_REPORT_PATH), 'traceability_preserved') &&
    fieldPass(loadReport(root, WORLD_STATE_MEMORY_VALIDATION_REPORT_PATH), 'traceability_preserved') &&
    fieldPass(
      loadReport(root, MULTI_EPISODE_CONSISTENCY_VALIDATION_REPORT_PATH),
      'traceability_preserved'
    );

  if (!traceabilityPreserved) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Production engine traceability chain is incomplete',
      severity: 'error',
    });
  }

  const productionDatasetConsumption = toStatus(datasetExportReady);
  const memoryBindingFailure = memoryBindingAudits.some(
    (audit) => audit.binding_ready === 'FAIL'
  );
  const productionBlueprintFailure = productionBlueprintGeneration === 'FAIL';
  const datasetConsumptionFailure = productionDatasetConsumption === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;
  const productionEngineBreak =
    datasetConsumptionFailure ||
    memoryBindingFailure ||
    productionBlueprintFailure ||
    traceabilityLoss;

  const pass =
    !productionEngineBreak &&
    productionBlueprintGeneration === 'PASS' &&
    productionDatasetConsumption === 'PASS' &&
    characterMemoryBinding === 'PASS' &&
    locationMemoryBinding === 'PASS' &&
    storyMemoryBinding === 'PASS' &&
    crossEpisodeMemoryBinding === 'PASS' &&
    traceabilityPreserved &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ProductionEngineFoundationArtifact = {
    foundation_id: 'production-engine-foundation-v1',
    phase: PRODUCTION_ENGINE_FOUNDATION_PHASE,
    generated_at: timestamp,
    pipeline_stages: [
      'movie_analysis',
      'production_dataset',
      'production_blueprint',
      'production_engine',
    ],
    production_dataset: {
      dataset_path: DATASET_PATH,
      dataset_id: dataset.dataset_id,
      source_count: dataset.source_count,
    },
    production_blueprints: productionBlueprintEntries,
    memory_bindings: memoryBindingAudits,
    traceability_chain: traceabilityChain,
    safety_flags: {
      planning_only: true,
      generation: false,
      runtime_execution: false,
      video_generation: false,
      image_generation: false,
      gpu_execution: false,
      external_call_allowed: false,
      no_execution: true,
      no_rendering: true,
    },
    production_engine_foundation_ready: pass,
  };

  const manifest: MovieAnalysisProductionEngineFoundationManifest = {
    manifest_id: 'movie-analysis-production-engine-foundation-manifest-v1',
    phase: PRODUCTION_ENGINE_FOUNDATION_PHASE,
    generated_at: timestamp,
    production_pipeline_stage_count: PRODUCTION_PIPELINE_STAGE_COUNT,
    production_memory_binding_count: PRODUCTION_MEMORY_BINDING_COUNT,
    production_blueprint_generation: productionBlueprintGeneration,
    production_dataset_consumption: productionDatasetConsumption,
    character_memory_binding: characterMemoryBinding,
    location_memory_binding: locationMemoryBinding,
    story_memory_binding: storyMemoryBinding,
    cross_episode_memory_binding: crossEpisodeMemoryBinding,
    traceability_preserved: traceabilityPreserved,
    production_engine_foundation_ready: pass,
    certification_status: pass ? PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionEngineFoundationReport = {
    report_id: 'movie-analysis-production-engine-foundation-report-v1',
    phase: PRODUCTION_ENGINE_FOUNDATION_PHASE,
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
    level3_bridge_certification_report_path: LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
    production_engine_foundation_export_dir: PRODUCTION_ENGINE_FOUNDATION_EXPORT_DIR,
    production_engine_foundation_manifest_path: PRODUCTION_ENGINE_FOUNDATION_MANIFEST_PATH,
    production_engine_foundation_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    production_pipeline_stage_count: PRODUCTION_PIPELINE_STAGE_COUNT,
    production_memory_binding_count: PRODUCTION_MEMORY_BINDING_COUNT,
    production_blueprint_generation: productionBlueprintGeneration,
    production_dataset_consumption: productionDatasetConsumption,
    character_memory_binding: characterMemoryBinding,
    location_memory_binding: locationMemoryBinding,
    story_memory_binding: storyMemoryBinding,
    cross_episode_memory_binding: crossEpisodeMemoryBinding,
    traceability_preserved: traceabilityPreserved,
    dataset_consumption_failure: datasetConsumptionFailure,
    memory_binding_failure: memoryBindingFailure,
    production_blueprint_failure: productionBlueprintFailure,
    traceability_loss: traceabilityLoss,
    production_engine_break: productionEngineBreak,
    production_engine_foundation_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE : null,
    production_blueprint_entries: productionBlueprintEntries,
    memory_binding_audits: memoryBindingAudits,
    final_verdict: pass
      ? PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT
      : PRODUCTION_ENGINE_FOUNDATION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_ENGINE_FOUNDATION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_ENGINE_FOUNDATION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
