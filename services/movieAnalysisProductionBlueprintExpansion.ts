import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  loadMovieAnalysisGenerationBlueprintPlan,
  type MovieAnalysisGenerationBlueprintPlan,
} from './movieAnalysisGenerationBlueprintDesign.js';
import {
  LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT,
  LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
  LEVEL3_ENTRY_APPROVED_STATUS,
} from './movieAnalysisLevel3BridgeCertification.js';
import {
  PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT,
  PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
  PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE,
  type ProductionEngineFoundationArtifact,
} from './movieAnalysisProductionEngineFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PRODUCTION_BLUEPRINT_EXPANSION_PHASE =
  'PHASE-LEVEL3-002-PRODUCTION_BLUEPRINT_EXPANSION_V1' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_PRODUCTION_BLUEPRINT_EXPANSION_V1' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_PRODUCTION_BLUEPRINT_EXPANSION_V1' as const;
export const PRODUCTION_BLUEPRINT_EXPANDED_STATUS = 'PRODUCTION_BLUEPRINT_EXPANDED' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_DIR =
  'reports/movie_analysis_production_blueprint_expansion' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH =
  'reports/movie_analysis_production_blueprint_expansion/movie-analysis-production-blueprint-expansion-report.json' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_MD_PATH =
  'reports/movie_analysis_production_blueprint_expansion/MOVIE_ANALYSIS_PRODUCTION_BLUEPRINT_EXPANSION.md' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR =
  'exports/movie_analysis_production_blueprint_expansion' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH =
  'exports/movie_analysis_production_blueprint_expansion/movie-analysis-production-blueprint-expansion-manifest.json' as const;
export const PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH =
  'exports/movie_analysis_production_blueprint_expansion/production-blueprint-expansion.json' as const;

export const PRODUCTION_BLUEPRINT_TYPE_COUNT = 4 as const;
export const PRODUCTION_BLUEPRINT_TYPES = [
  'mv_blueprint',
  'short_film_blueprint',
  'episode_blueprint',
  'scene_sequence_blueprint',
] as const;

export type ProductionBlueprintType = (typeof PRODUCTION_BLUEPRINT_TYPES)[number];
export type CertificationStatus = 'PASS' | 'FAIL';

export type ProductionBlueprintExpansionIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  blueprint_id?: string;
};

export type ScenePlan = {
  scene_count: number;
  scene_order: number[];
  scene_ids: string[];
  scene_purpose: string[];
};

export type ShotPlan = {
  shot_count: number;
  shot_types: string[];
  camera_motion: string[];
  coverage_strategy: string;
};

export type GenerationPlan = {
  image_generation_targets: string[];
  video_generation_targets: string[];
  adapter_requirements: string[];
  consistency_targets: string[];
};

export type ExpandedProductionBlueprint = {
  blueprint_id: string;
  production_type: ProductionBlueprintType;
  source_dataset_ref: {
    dataset_path: string;
    dataset_id: string;
    source_count: number;
  };
  character_memory_refs: string[];
  location_memory_refs: string[];
  story_memory_refs: string[];
  scene_plan: ScenePlan;
  shot_plan: ShotPlan;
  generation_plan: GenerationPlan;
  traceability: {
    foundation_id: string;
    generation_blueprint_ids: string[];
    trace_entry_count: number;
    trace_integrity: CertificationStatus;
  };
  blueprint_ready: CertificationStatus;
};

export type ProductionBlueprintExpansionArtifact = {
  expansion_id: string;
  phase: typeof PRODUCTION_BLUEPRINT_EXPANSION_PHASE;
  generated_at: string;
  foundation_artifact_path: typeof PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH;
  expanded_blueprints: ExpandedProductionBlueprint[];
  blueprint_expansion_complete: boolean;
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
};

export type MovieAnalysisProductionBlueprintExpansionManifest = {
  manifest_id: string;
  phase: typeof PRODUCTION_BLUEPRINT_EXPANSION_PHASE;
  generated_at: string;
  blueprint_type_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  bridge_certification_consumed: CertificationStatus;
  foundation_consumed: CertificationStatus;
  blueprint_expansion_complete: CertificationStatus;
  mv_blueprint_ready: CertificationStatus;
  short_film_blueprint_ready: CertificationStatus;
  episode_blueprint_ready: CertificationStatus;
  scene_sequence_blueprint_ready: CertificationStatus;
  scene_plan_complete: CertificationStatus;
  shot_plan_complete: CertificationStatus;
  generation_plan_complete: CertificationStatus;
  character_memory_preserved: CertificationStatus;
  location_memory_preserved: CertificationStatus;
  story_memory_preserved: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof PRODUCTION_BLUEPRINT_EXPANDED_STATUS | null;
};

export type MovieAnalysisProductionBlueprintExpansionReport = {
  report_id: string;
  phase: typeof PRODUCTION_BLUEPRINT_EXPANSION_PHASE;
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
  production_engine_foundation_report_path: typeof PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH;
  production_engine_foundation_artifact_path: typeof PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH;
  production_blueprint_expansion_export_dir: typeof PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR;
  production_blueprint_expansion_manifest_path: typeof PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH;
  production_blueprint_expansion_artifact_path: typeof PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  blueprint_type_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  bridge_certification_consumed: CertificationStatus;
  foundation_consumed: CertificationStatus;
  blueprint_expansion_complete: CertificationStatus;
  mv_blueprint_ready: CertificationStatus;
  short_film_blueprint_ready: CertificationStatus;
  episode_blueprint_ready: CertificationStatus;
  scene_sequence_blueprint_ready: CertificationStatus;
  scene_plan_complete: CertificationStatus;
  shot_plan_complete: CertificationStatus;
  generation_plan_complete: CertificationStatus;
  character_memory_preserved: CertificationStatus;
  location_memory_preserved: CertificationStatus;
  story_memory_preserved: CertificationStatus;
  traceability_preserved: boolean;
  bridge_missing: boolean;
  foundation_missing: boolean;
  blueprint_expansion_failure: boolean;
  scene_plan_incomplete: boolean;
  shot_plan_incomplete: boolean;
  generation_plan_incomplete: boolean;
  memory_binding_loss: boolean;
  traceability_loss: boolean;
  production_plan_incomplete: boolean;
  production_blueprint_expansion_ready: CertificationStatus;
  certification_status: typeof PRODUCTION_BLUEPRINT_EXPANDED_STATUS | null;
  expanded_blueprints: ExpandedProductionBlueprint[];
  final_verdict:
    | typeof PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT
    | typeof PRODUCTION_BLUEPRINT_EXPANSION_FAIL_VERDICT;
  issues: ProductionBlueprintExpansionIssue[];
};

const COVERAGE_STRATEGIES: Record<ProductionBlueprintType, string> = {
  mv_blueprint: 'full_arc_coverage',
  short_film_blueprint: 'condensed_arc_coverage',
  episode_blueprint: 'episodic_coverage',
  scene_sequence_blueprint: 'sequence_coverage',
};

const SCENE_PURPOSE_SUFFIXES = ['open', 'develop', 'peak', 'resolve', 'bridge', 'hold', 'layout'];

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function deriveScenePurpose(value: string): string {
  for (const suffix of SCENE_PURPOSE_SUFFIXES) {
    if (value.includes(suffix)) return suffix;
  }
  return 'establish';
}

function deriveShotType(value: string): string {
  if (value.includes('bridge')) return 'bridge_shot';
  if (value.includes('hold')) return 'hold_shot';
  if (value.includes('shift')) return 'shift_shot';
  if (value.includes('layout')) return 'layout_shot';
  return 'coverage_shot';
}

function deriveCameraMotion(value: string): string {
  if (value.includes('shift')) return 'camera_shift';
  if (value.includes('bridge')) return 'camera_bridge';
  if (value.includes('hold')) return 'camera_hold';
  return 'camera_static';
}

function scenePlanComplete(scenePlan: ScenePlan): boolean {
  return (
    scenePlan.scene_count > 0 &&
    scenePlan.scene_order.length === scenePlan.scene_count &&
    scenePlan.scene_ids.length === scenePlan.scene_count &&
    scenePlan.scene_purpose.length === scenePlan.scene_count &&
    scenePlan.scene_order.every((order, index) => order === index + 1)
  );
}

function shotPlanComplete(shotPlan: ShotPlan): boolean {
  return (
    shotPlan.shot_count > 0 &&
    shotPlan.shot_types.length === shotPlan.shot_count &&
    shotPlan.camera_motion.length === shotPlan.shot_count &&
    shotPlan.coverage_strategy.length > 0
  );
}

function generationPlanComplete(generationPlan: GenerationPlan): boolean {
  return (
    generationPlan.image_generation_targets.length > 0 &&
    generationPlan.video_generation_targets.length > 0 &&
    generationPlan.adapter_requirements.length > 0 &&
    generationPlan.consistency_targets.length > 0
  );
}

function buildExpandedBlueprint(
  root: string,
  foundation: ProductionEngineFoundationArtifact,
  productionType: ProductionBlueprintType,
  blueprintPlans: MovieAnalysisGenerationBlueprintPlan[]
): ExpandedProductionBlueprint {
  const sceneElements = blueprintPlans.flatMap((plan) => plan.scene_generation_structure);
  const cameraElements = blueprintPlans.flatMap((plan) => plan.camera_generation_structure);
  const characterElements = blueprintPlans.flatMap((plan) => plan.character_generation_structure);
  const emotionElements = blueprintPlans.flatMap((plan) => plan.emotion_generation_structure);
  const continuityElements = blueprintPlans.flatMap((plan) => plan.continuity_generation_structure);
  const transitionElements = blueprintPlans.flatMap((plan) => plan.transition_generation_structure);

  const sceneIds = sceneElements.map((element) => element.element_id);
  const scenePurposes = sceneElements.map((element) =>
    deriveScenePurpose(element.estimated_blueprint_value)
  );
  const shotTypes = cameraElements.map((element) =>
    deriveShotType(element.estimated_blueprint_value)
  );
  const cameraMotion = cameraElements.map((element) =>
    deriveCameraMotion(element.estimated_blueprint_value)
  );

  const scenePlan: ScenePlan = {
    scene_count: sceneIds.length,
    scene_order: sceneIds.map((_, index) => index + 1),
    scene_ids: sceneIds,
    scene_purpose: scenePurposes,
  };

  const shotPlan: ShotPlan = {
    shot_count: shotTypes.length,
    shot_types: shotTypes,
    camera_motion: cameraMotion,
    coverage_strategy: COVERAGE_STRATEGIES[productionType],
  };

  const generationPlan: GenerationPlan = {
    image_generation_targets: [
      ...characterElements.map((element) => element.element_id),
      ...emotionElements.map((element) => element.element_id),
    ],
    video_generation_targets: [
      ...sceneElements.map((element) => element.element_id),
      ...cameraElements.map((element) => element.element_id),
      ...transitionElements.map((element) => element.element_id),
    ],
    adapter_requirements: foundation.production_blueprints.flatMap((entry) => [
      `${entry.source_video_id}_scene_adapter`,
      `${entry.source_video_id}_camera_adapter`,
      `${entry.source_video_id}_emotion_adapter`,
      `${entry.source_video_id}_transition_adapter`,
      `${entry.source_video_id}_continuity_adapter`,
      `${entry.source_video_id}_storytelling_adapter`,
    ]),
    consistency_targets: continuityElements.map((element) => element.element_id),
  };

  const traceEntryCount = foundation.traceability_chain.reduce(
    (sum, entry) => sum + entry.trace_entry_count,
    0
  );
  const traceIntegrity = foundation.traceability_chain.every(
    (entry) => entry.trace_integrity === 'PASS'
  );

  const blueprintReady =
    scenePlanComplete(scenePlan) &&
    shotPlanComplete(shotPlan) &&
    generationPlanComplete(generationPlan) &&
    traceIntegrity;

  const characterBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'character_memory_binding'
  );
  const locationBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'location_memory_binding'
  );
  const storyBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'story_memory_binding'
  );
  const crossEpisodeBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'cross_episode_memory_binding'
  );

  return {
    blueprint_id: `${productionType}_v1`,
    production_type: productionType,
    source_dataset_ref: {
      dataset_path: foundation.production_dataset.dataset_path,
      dataset_id: foundation.production_dataset.dataset_id,
      source_count: foundation.production_dataset.source_count,
    },
    character_memory_refs: [
      characterBinding?.evidence_report_path ?? '',
      crossEpisodeBinding?.evidence_report_path ?? '',
    ].filter(Boolean),
    location_memory_refs: [locationBinding?.evidence_report_path ?? ''].filter(Boolean),
    story_memory_refs: [storyBinding?.evidence_report_path ?? ''].filter(Boolean),
    scene_plan: scenePlan,
    shot_plan: shotPlan,
    generation_plan: generationPlan,
    traceability: {
      foundation_id: foundation.foundation_id,
      generation_blueprint_ids: foundation.production_blueprints.map(
        (entry) => entry.generation_blueprint_id
      ),
      trace_entry_count: traceEntryCount,
      trace_integrity: toStatus(traceIntegrity),
    },
    blueprint_ready: toStatus(blueprintReady),
  };
}

function buildMarkdown(report: MovieAnalysisProductionBlueprintExpansionReport): string {
  const lines = [
    '# Movie Analysis Production Blueprint Expansion',
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
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| bridge_certification_consumed | ${report.bridge_certification_consumed} |`,
    `| foundation_consumed | ${report.foundation_consumed} |`,
    `| blueprint_expansion_complete | ${report.blueprint_expansion_complete} |`,
    `| mv_blueprint_ready | ${report.mv_blueprint_ready} |`,
    `| short_film_blueprint_ready | ${report.short_film_blueprint_ready} |`,
    `| episode_blueprint_ready | ${report.episode_blueprint_ready} |`,
    `| scene_sequence_blueprint_ready | ${report.scene_sequence_blueprint_ready} |`,
    `| scene_plan_complete | ${report.scene_plan_complete} |`,
    `| shot_plan_complete | ${report.shot_plan_complete} |`,
    `| generation_plan_complete | ${report.generation_plan_complete} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Expanded Blueprints',
    ''
  );

  for (const blueprint of report.expanded_blueprints) {
    lines.push(
      `- ${blueprint.blueprint_id}: ready=${blueprint.blueprint_ready} scenes=${blueprint.scene_plan.scene_count} shots=${blueprint.shot_plan.shot_count}`
    );
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
  issues: ProductionBlueprintExpansionIssue[]
): MovieAnalysisProductionBlueprintExpansionReport {
  const report: MovieAnalysisProductionBlueprintExpansionReport = {
    report_id: 'movie-analysis-production-blueprint-expansion-report-v1',
    phase: PRODUCTION_BLUEPRINT_EXPANSION_PHASE,
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
    production_engine_foundation_report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    production_engine_foundation_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    production_blueprint_expansion_export_dir: PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR,
    production_blueprint_expansion_manifest_path: PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
    production_blueprint_expansion_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    blueprint_type_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    bridge_certification_consumed: 'FAIL',
    foundation_consumed: 'FAIL',
    blueprint_expansion_complete: 'FAIL',
    mv_blueprint_ready: 'FAIL',
    short_film_blueprint_ready: 'FAIL',
    episode_blueprint_ready: 'FAIL',
    scene_sequence_blueprint_ready: 'FAIL',
    scene_plan_complete: 'FAIL',
    shot_plan_complete: 'FAIL',
    generation_plan_complete: 'FAIL',
    character_memory_preserved: 'FAIL',
    location_memory_preserved: 'FAIL',
    story_memory_preserved: 'FAIL',
    traceability_preserved: false,
    bridge_missing: true,
    foundation_missing: true,
    blueprint_expansion_failure: true,
    scene_plan_incomplete: true,
    shot_plan_incomplete: true,
    generation_plan_incomplete: true,
    memory_binding_loss: true,
    traceability_loss: true,
    production_plan_incomplete: true,
    production_blueprint_expansion_ready: 'FAIL',
    certification_status: null,
    expanded_blueprints: [],
    final_verdict: PRODUCTION_BLUEPRINT_EXPANSION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisProductionBlueprintExpansion(
  projectRoot?: string
): MovieAnalysisProductionBlueprintExpansionReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ProductionBlueprintExpansionIssue[] = [];
  const timestamp = new Date().toISOString();

  const bridgeReport = loadReport<Record<string, unknown>>(
    root,
    LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH
  );
  const bridgeMissing =
    !bridgeReport ||
    bridgeReport.final_verdict !== LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT ||
    bridgeReport.final_output_status !== LEVEL3_ENTRY_APPROVED_STATUS ||
    bridgeReport.level3_entry_ready !== true;

  if (bridgeMissing) {
    issues.push({
      code: 'BRIDGE_MISSING',
      message: `Required ${LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT} with ${LEVEL3_ENTRY_APPROVED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const foundationReport = loadReport<Record<string, unknown>>(
    root,
    PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH
  );
  const foundationArtifactPath = path.join(root, PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH);
  const foundationMissing =
    !foundationReport ||
    foundationReport.final_verdict !== PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT ||
    foundationReport.certification_status !== PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE ||
    !fs.existsSync(foundationArtifactPath);

  if (foundationMissing) {
    issues.push({
      code: 'FOUNDATION_MISSING',
      message: `Required ${PRODUCTION_ENGINE_FOUNDATION_PASS_VERDICT} with ${PRODUCTION_ENGINE_FOUNDATION_STATUS_MESSAGE}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const foundation = JSON.parse(
    fs.readFileSync(foundationArtifactPath, 'utf8')
  ) as ProductionEngineFoundationArtifact;

  if (!foundation.production_engine_foundation_ready) {
    issues.push({
      code: 'FOUNDATION_NOT_READY',
      message: 'Production engine foundation artifact is not ready',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const blueprintPlans: MovieAnalysisGenerationBlueprintPlan[] = [];
  for (const entry of foundation.production_blueprints) {
    const plan = loadMovieAnalysisGenerationBlueprintPlan(root, entry.generation_blueprint_id);
    if (!plan) {
      issues.push({
        code: 'BLUEPRINT_PLAN_MISSING',
        message: `Missing generation blueprint plan: ${entry.generation_blueprint_id}`,
        severity: 'error',
        blueprint_id: entry.generation_blueprint_id,
      });
      continue;
    }
    blueprintPlans.push(plan);
  }

  if (blueprintPlans.length !== EXPECTED_SOURCE_COUNT) {
    issues.push({
      code: 'BLUEPRINT_EXPANSION_FAILURE',
      message: `Expected ${EXPECTED_SOURCE_COUNT} generation blueprint plans`,
      severity: 'error',
    });
  }

  const expandedBlueprints = PRODUCTION_BLUEPRINT_TYPES.map((productionType) =>
    buildExpandedBlueprint(root, foundation, productionType, blueprintPlans)
  );

  for (const blueprint of expandedBlueprints) {
    if (blueprint.blueprint_ready === 'FAIL') {
      issues.push({
        code: 'BLUEPRINT_EXPANSION_FAILURE',
        message: `Blueprint expansion failed for ${blueprint.blueprint_id}`,
        severity: 'error',
        blueprint_id: blueprint.blueprint_id,
      });
    }
  }

  const bridgeCertificationConsumed = toStatus(!bridgeMissing);
  const foundationConsumed = toStatus(!foundationMissing && foundation.production_engine_foundation_ready);

  const mvBlueprint = expandedBlueprints.find((blueprint) => blueprint.production_type === 'mv_blueprint');
  const shortFilmBlueprint = expandedBlueprints.find(
    (blueprint) => blueprint.production_type === 'short_film_blueprint'
  );
  const episodeBlueprint = expandedBlueprints.find(
    (blueprint) => blueprint.production_type === 'episode_blueprint'
  );
  const sceneSequenceBlueprint = expandedBlueprints.find(
    (blueprint) => blueprint.production_type === 'scene_sequence_blueprint'
  );

  const mvBlueprintReady = mvBlueprint?.blueprint_ready ?? 'FAIL';
  const shortFilmBlueprintReady = shortFilmBlueprint?.blueprint_ready ?? 'FAIL';
  const episodeBlueprintReady = episodeBlueprint?.blueprint_ready ?? 'FAIL';
  const sceneSequenceBlueprintReady = sceneSequenceBlueprint?.blueprint_ready ?? 'FAIL';

  const scenePlanCompleteStatus = toStatus(
    expandedBlueprints.every((blueprint) => scenePlanComplete(blueprint.scene_plan))
  );
  const shotPlanCompleteStatus = toStatus(
    expandedBlueprints.every((blueprint) => shotPlanComplete(blueprint.shot_plan))
  );
  const generationPlanCompleteStatus = toStatus(
    expandedBlueprints.every((blueprint) => generationPlanComplete(blueprint.generation_plan))
  );

  const characterBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'character_memory_binding'
  );
  const locationBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'location_memory_binding'
  );
  const storyBinding = foundation.memory_bindings.find(
    (binding) => binding.binding_id === 'story_memory_binding'
  );

  const characterMemoryPreserved = toStatus(characterBinding?.binding_ready === 'PASS');
  const locationMemoryPreserved = toStatus(locationBinding?.binding_ready === 'PASS');
  const storyMemoryPreserved = toStatus(storyBinding?.binding_ready === 'PASS');

  const traceabilityPreserved =
    foundation.traceability_chain.every((entry) => entry.trace_integrity === 'PASS') &&
    expandedBlueprints.every((blueprint) => blueprint.traceability.trace_integrity === 'PASS') &&
    characterMemoryPreserved === 'PASS' &&
    locationMemoryPreserved === 'PASS' &&
    storyMemoryPreserved === 'PASS';

  const blueprintExpansionComplete = toStatus(
    expandedBlueprints.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      expandedBlueprints.every((blueprint) => blueprint.blueprint_ready === 'PASS')
  );

  const memoryBindingLoss =
    characterMemoryPreserved === 'FAIL' ||
    locationMemoryPreserved === 'FAIL' ||
    storyMemoryPreserved === 'FAIL';
  const scenePlanIncomplete = scenePlanCompleteStatus === 'FAIL';
  const shotPlanIncomplete = shotPlanCompleteStatus === 'FAIL';
  const generationPlanIncomplete = generationPlanCompleteStatus === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;
  const blueprintExpansionFailure = blueprintExpansionComplete === 'FAIL';
  const productionPlanIncomplete =
    blueprintExpansionFailure ||
    scenePlanIncomplete ||
    shotPlanIncomplete ||
    generationPlanIncomplete ||
    memoryBindingLoss ||
    traceabilityLoss;

  const pass =
    bridgeCertificationConsumed === 'PASS' &&
    foundationConsumed === 'PASS' &&
    blueprintExpansionComplete === 'PASS' &&
    mvBlueprintReady === 'PASS' &&
    shortFilmBlueprintReady === 'PASS' &&
    episodeBlueprintReady === 'PASS' &&
    sceneSequenceBlueprintReady === 'PASS' &&
    scenePlanCompleteStatus === 'PASS' &&
    shotPlanCompleteStatus === 'PASS' &&
    generationPlanCompleteStatus === 'PASS' &&
    characterMemoryPreserved === 'PASS' &&
    locationMemoryPreserved === 'PASS' &&
    storyMemoryPreserved === 'PASS' &&
    traceabilityPreserved &&
    !productionPlanIncomplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ProductionBlueprintExpansionArtifact = {
    expansion_id: 'production-blueprint-expansion-v1',
    phase: PRODUCTION_BLUEPRINT_EXPANSION_PHASE,
    generated_at: timestamp,
    foundation_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    expanded_blueprints: expandedBlueprints,
    blueprint_expansion_complete: pass,
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
  };

  const manifest: MovieAnalysisProductionBlueprintExpansionManifest = {
    manifest_id: 'movie-analysis-production-blueprint-expansion-manifest-v1',
    phase: PRODUCTION_BLUEPRINT_EXPANSION_PHASE,
    generated_at: timestamp,
    blueprint_type_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    bridge_certification_consumed: bridgeCertificationConsumed,
    foundation_consumed: foundationConsumed,
    blueprint_expansion_complete: blueprintExpansionComplete,
    mv_blueprint_ready: mvBlueprintReady,
    short_film_blueprint_ready: shortFilmBlueprintReady,
    episode_blueprint_ready: episodeBlueprintReady,
    scene_sequence_blueprint_ready: sceneSequenceBlueprintReady,
    scene_plan_complete: scenePlanCompleteStatus,
    shot_plan_complete: shotPlanCompleteStatus,
    generation_plan_complete: generationPlanCompleteStatus,
    character_memory_preserved: characterMemoryPreserved,
    location_memory_preserved: locationMemoryPreserved,
    story_memory_preserved: storyMemoryPreserved,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? PRODUCTION_BLUEPRINT_EXPANDED_STATUS : null,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisProductionBlueprintExpansionReport = {
    report_id: 'movie-analysis-production-blueprint-expansion-report-v1',
    phase: PRODUCTION_BLUEPRINT_EXPANSION_PHASE,
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
    production_engine_foundation_report_path: PRODUCTION_ENGINE_FOUNDATION_REPORT_PATH,
    production_engine_foundation_artifact_path: PRODUCTION_ENGINE_FOUNDATION_ARTIFACT_PATH,
    production_blueprint_expansion_export_dir: PRODUCTION_BLUEPRINT_EXPANSION_EXPORT_DIR,
    production_blueprint_expansion_manifest_path: PRODUCTION_BLUEPRINT_EXPANSION_MANIFEST_PATH,
    production_blueprint_expansion_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    blueprint_type_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    bridge_certification_consumed: bridgeCertificationConsumed,
    foundation_consumed: foundationConsumed,
    blueprint_expansion_complete: blueprintExpansionComplete,
    mv_blueprint_ready: mvBlueprintReady,
    short_film_blueprint_ready: shortFilmBlueprintReady,
    episode_blueprint_ready: episodeBlueprintReady,
    scene_sequence_blueprint_ready: sceneSequenceBlueprintReady,
    scene_plan_complete: scenePlanCompleteStatus,
    shot_plan_complete: shotPlanCompleteStatus,
    generation_plan_complete: generationPlanCompleteStatus,
    character_memory_preserved: characterMemoryPreserved,
    location_memory_preserved: locationMemoryPreserved,
    story_memory_preserved: storyMemoryPreserved,
    traceability_preserved: traceabilityPreserved,
    bridge_missing: false,
    foundation_missing: false,
    blueprint_expansion_failure: blueprintExpansionFailure,
    scene_plan_incomplete: scenePlanIncomplete,
    shot_plan_incomplete: shotPlanIncomplete,
    generation_plan_incomplete: generationPlanIncomplete,
    memory_binding_loss: memoryBindingLoss,
    traceability_loss: traceabilityLoss,
    production_plan_incomplete: productionPlanIncomplete,
    production_blueprint_expansion_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? PRODUCTION_BLUEPRINT_EXPANDED_STATUS : null,
    expanded_blueprints: expandedBlueprints,
    final_verdict: pass
      ? PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT
      : PRODUCTION_BLUEPRINT_EXPANSION_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
