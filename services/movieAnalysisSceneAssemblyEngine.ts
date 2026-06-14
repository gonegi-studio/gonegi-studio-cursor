import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_EXPANDED_STATUS,
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT,
  PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  type ExpandedProductionBlueprint,
  type ProductionBlueprintExpansionArtifact,
} from './movieAnalysisProductionBlueprintExpansion.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_ASSEMBLY_ENGINE_PHASE = 'PHASE-LEVEL3-003-SCENE_ASSEMBLY_ENGINE_V1' as const;
export const SCENE_ASSEMBLY_ENGINE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SCENE_ASSEMBLY_ENGINE_V1' as const;
export const SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SCENE_ASSEMBLY_ENGINE_V1' as const;
export const SCENE_ASSEMBLY_READY_STATUS = 'SCENE_ASSEMBLY_READY' as const;
export const SCENE_ASSEMBLY_ENGINE_DIR = 'reports/movie_analysis_scene_assembly_engine' as const;
export const SCENE_ASSEMBLY_ENGINE_REPORT_PATH =
  'reports/movie_analysis_scene_assembly_engine/movie-analysis-scene-assembly-engine-report.json' as const;
export const SCENE_ASSEMBLY_ENGINE_MD_PATH =
  'reports/movie_analysis_scene_assembly_engine/MOVIE_ANALYSIS_SCENE_ASSEMBLY_ENGINE.md' as const;
export const SCENE_ASSEMBLY_ENGINE_EXPORT_DIR =
  'exports/movie_analysis_scene_assembly_engine' as const;
export const SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH =
  'exports/movie_analysis_scene_assembly_engine/movie-analysis-scene-assembly-engine-manifest.json' as const;
export const SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH =
  'exports/movie_analysis_scene_assembly_engine/scene-assembly-engine.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type SceneAssemblyEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  assembly_id?: string;
  scene_id?: string;
};

export type SceneUnit = {
  scene_id: string;
  scene_order: number;
  scene_purpose: string;
  incoming_dependencies: string[];
  outgoing_dependencies: string[];
  transition_in: string;
  transition_out: string;
  memory_refs: string[];
  execution_ready: CertificationStatus;
};

export type SceneDependencyLink = {
  scene_id: string;
  depends_on: string[];
  required_by: string[];
};

export type SceneTransitionLink = {
  from_scene_id: string;
  to_scene_id: string;
  transition_type: string;
};

export type ContinuityLink = {
  continuity_target_id: string;
  linked_scene_ids: string[];
  continuity_preserved: CertificationStatus;
};

export type SceneAssembly = {
  assembly_id: string;
  production_type: ExpandedProductionBlueprint['production_type'];
  blueprint_id: string;
  scene_units: SceneUnit[];
  scene_sequence: string[];
  scene_dependencies: SceneDependencyLink[];
  scene_transitions: SceneTransitionLink[];
  scene_ordering: number[];
  continuity_links: ContinuityLink[];
  memory_bindings: {
    character_memory_refs: string[];
    location_memory_refs: string[];
    story_memory_refs: string[];
  };
  execution_readiness: CertificationStatus;
  traceability_chain: {
    foundation_id: string;
    generation_blueprint_ids: string[];
    trace_entry_count: number;
    trace_integrity: CertificationStatus;
  };
  assembly_ready: CertificationStatus;
};

export type SceneAssemblyEngineArtifact = {
  engine_id: string;
  phase: typeof SCENE_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  blueprint_expansion_artifact_path: typeof PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH;
  assemblies: SceneAssembly[];
  scene_assembly_complete: boolean;
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

export type MovieAnalysisSceneAssemblyEngineManifest = {
  manifest_id: string;
  phase: typeof SCENE_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  assembly_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  blueprint_consumed: CertificationStatus;
  scene_assembly_complete: CertificationStatus;
  scene_order_preserved: CertificationStatus;
  scene_dependencies_valid: CertificationStatus;
  scene_transition_valid: CertificationStatus;
  continuity_preserved: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  character_memory_preserved: CertificationStatus;
  location_memory_preserved: CertificationStatus;
  story_memory_preserved: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof SCENE_ASSEMBLY_READY_STATUS | null;
};

export type MovieAnalysisSceneAssemblyEngineReport = {
  report_id: string;
  phase: typeof SCENE_ASSEMBLY_ENGINE_PHASE;
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
  production_blueprint_expansion_report_path: typeof PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH;
  production_blueprint_expansion_artifact_path: typeof PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH;
  scene_assembly_engine_export_dir: typeof SCENE_ASSEMBLY_ENGINE_EXPORT_DIR;
  scene_assembly_engine_manifest_path: typeof SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH;
  scene_assembly_engine_artifact_path: typeof SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  assembly_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  blueprint_consumed: CertificationStatus;
  scene_assembly_complete: CertificationStatus;
  scene_order_preserved: CertificationStatus;
  scene_dependencies_valid: CertificationStatus;
  scene_transition_valid: CertificationStatus;
  continuity_preserved: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  character_memory_preserved: CertificationStatus;
  location_memory_preserved: CertificationStatus;
  story_memory_preserved: CertificationStatus;
  traceability_preserved: boolean;
  blueprint_missing: boolean;
  scene_assembly_failure: boolean;
  scene_dependency_break: boolean;
  transition_break: boolean;
  continuity_loss: boolean;
  execution_not_ready: boolean;
  memory_binding_loss: boolean;
  traceability_loss: boolean;
  scene_assembly_engine_ready: CertificationStatus;
  certification_status: typeof SCENE_ASSEMBLY_READY_STATUS | null;
  assemblies: SceneAssembly[];
  final_verdict: typeof SCENE_ASSEMBLY_ENGINE_PASS_VERDICT | typeof SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT;
  issues: SceneAssemblyEngineIssue[];
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

function transitionType(fromPurpose: string, toPurpose: string): string {
  return `${fromPurpose}_to_${toPurpose}`;
}

function buildContinuityLinks(
  blueprint: ExpandedProductionBlueprint
): ContinuityLink[] {
  return blueprint.generation_plan.consistency_targets.map((targetId) => {
    const blueprintPrefix = targetId.split('_continuity_')[0] ?? targetId.split('_character_')[0];
    const linkedSceneIds = blueprint.scene_plan.scene_ids.filter((sceneId) =>
      sceneId.startsWith(blueprintPrefix)
    );
    return {
      continuity_target_id: targetId,
      linked_scene_ids: linkedSceneIds.length > 0 ? linkedSceneIds : blueprint.scene_plan.scene_ids.slice(0, 1),
      continuity_preserved: toStatus(linkedSceneIds.length > 0),
    };
  });
}

function buildSceneUnits(blueprint: ExpandedProductionBlueprint): SceneUnit[] {
  const memoryRefs = [
    ...blueprint.character_memory_refs,
    ...blueprint.location_memory_refs,
    ...blueprint.story_memory_refs,
  ];

  return blueprint.scene_plan.scene_ids.map((sceneId, index) => {
    const sceneOrder = blueprint.scene_plan.scene_order[index] ?? index + 1;
    const scenePurpose = blueprint.scene_plan.scene_purpose[index] ?? 'establish';
    const prevSceneId = index > 0 ? blueprint.scene_plan.scene_ids[index - 1] : null;
    const nextSceneId =
      index < blueprint.scene_plan.scene_ids.length - 1
        ? blueprint.scene_plan.scene_ids[index + 1]
        : null;
    const prevPurpose = index > 0 ? blueprint.scene_plan.scene_purpose[index - 1] : null;
    const nextPurpose =
      index < blueprint.scene_plan.scene_purpose.length - 1
        ? blueprint.scene_plan.scene_purpose[index + 1]
        : null;

    const incoming = prevSceneId ? [prevSceneId] : [];
    const outgoing = nextSceneId ? [nextSceneId] : [];
    const transitionIn =
      index === 0
        ? 'assembly_entry'
        : transitionType(prevPurpose ?? 'establish', scenePurpose);
    const transitionOut =
      index === blueprint.scene_plan.scene_ids.length - 1
        ? 'assembly_exit'
        : transitionType(scenePurpose, nextPurpose ?? 'establish');

    const executionReady =
      sceneOrder === index + 1 &&
      scenePurpose.length > 0 &&
      memoryRefs.length > 0 &&
      (index === 0 || incoming.length === 1) &&
      (index === blueprint.scene_plan.scene_ids.length - 1 || outgoing.length === 1);

    return {
      scene_id: sceneId,
      scene_order: sceneOrder,
      scene_purpose: scenePurpose,
      incoming_dependencies: incoming,
      outgoing_dependencies: outgoing,
      transition_in: transitionIn,
      transition_out: transitionOut,
      memory_refs: memoryRefs,
      execution_ready: toStatus(executionReady),
    };
  });
}

function buildSceneAssembly(blueprint: ExpandedProductionBlueprint): SceneAssembly {
  const sceneUnits = buildSceneUnits(blueprint);
  const sceneSequence = sceneUnits.map((unit) => unit.scene_id);
  const sceneOrdering = sceneUnits.map((unit) => unit.scene_order);

  const sceneDependencies: SceneDependencyLink[] = sceneUnits.map((unit) => ({
    scene_id: unit.scene_id,
    depends_on: [...unit.incoming_dependencies],
    required_by: [...unit.outgoing_dependencies],
  }));

  const sceneTransitions: SceneTransitionLink[] = sceneUnits.slice(0, -1).map((unit, index) => ({
    from_scene_id: unit.scene_id,
    to_scene_id: sceneUnits[index + 1].scene_id,
    transition_type: unit.transition_out,
  }));

  const continuityLinks = buildContinuityLinks(blueprint);
  const executionReadiness = toStatus(sceneUnits.every((unit) => unit.execution_ready === 'PASS'));
  const assemblyReady = toStatus(
    sceneUnits.length === blueprint.scene_plan.scene_count &&
      executionReadiness === 'PASS' &&
      continuityLinks.every((link) => link.continuity_preserved === 'PASS') &&
      blueprint.traceability.trace_integrity === 'PASS'
  );

  return {
    assembly_id: `${blueprint.production_type.replace('_blueprint', '')}_assembly_v1`,
    production_type: blueprint.production_type,
    blueprint_id: blueprint.blueprint_id,
    scene_units: sceneUnits,
    scene_sequence: sceneSequence,
    scene_dependencies: sceneDependencies,
    scene_transitions: sceneTransitions,
    scene_ordering: sceneOrdering,
    continuity_links: continuityLinks,
    memory_bindings: {
      character_memory_refs: blueprint.character_memory_refs,
      location_memory_refs: blueprint.location_memory_refs,
      story_memory_refs: blueprint.story_memory_refs,
    },
    execution_readiness: executionReadiness,
    traceability_chain: {
      foundation_id: blueprint.traceability.foundation_id,
      generation_blueprint_ids: blueprint.traceability.generation_blueprint_ids,
      trace_entry_count: blueprint.traceability.trace_entry_count,
      trace_integrity: blueprint.traceability.trace_integrity,
    },
    assembly_ready: assemblyReady,
  };
}

function isSceneOrderPreserved(assembly: SceneAssembly, blueprint: ExpandedProductionBlueprint): boolean {
  if (assembly.scene_ordering.length !== blueprint.scene_plan.scene_order.length) return false;
  return assembly.scene_ordering.every((order, index) => order === blueprint.scene_plan.scene_order[index]);
}

function areSceneDependenciesValid(assembly: SceneAssembly): boolean {
  return assembly.scene_dependencies.every((dependency, index) => {
    const unit = assembly.scene_units[index];
    if (!unit) return false;
    if (index === 0) return dependency.depends_on.length === 0;
    return (
      dependency.depends_on.length === 1 &&
      dependency.depends_on[0] === assembly.scene_units[index - 1]?.scene_id
    );
  });
}

function sceneTransitionsValid(assembly: SceneAssembly): boolean {
  return (
    assembly.scene_transitions.length === assembly.scene_units.length - 1 &&
    assembly.scene_transitions.every((transition, index) => {
      const fromUnit = assembly.scene_units[index];
      const toUnit = assembly.scene_units[index + 1];
      return (
        transition.from_scene_id === fromUnit?.scene_id &&
        transition.to_scene_id === toUnit?.scene_id &&
        transition.transition_type === fromUnit?.transition_out
      );
    })
  );
}

function buildMarkdown(report: MovieAnalysisSceneAssemblyEngineReport): string {
  const lines = [
    '# Movie Analysis Scene Assembly Engine',
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
    `| blueprint_consumed | ${report.blueprint_consumed} |`,
    `| scene_assembly_complete | ${report.scene_assembly_complete} |`,
    `| scene_order_preserved | ${report.scene_order_preserved} |`,
    `| scene_dependencies_valid | ${report.scene_dependencies_valid} |`,
    `| scene_transition_valid | ${report.scene_transition_valid} |`,
    `| continuity_preserved | ${report.continuity_preserved} |`,
    `| execution_readiness_valid | ${report.execution_readiness_valid} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Assemblies',
    ''
  );

  for (const assembly of report.assemblies) {
    lines.push(
      `- ${assembly.assembly_id}: ready=${assembly.assembly_ready} scenes=${assembly.scene_units.length} transitions=${assembly.scene_transitions.length}`
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
  issues: SceneAssemblyEngineIssue[]
): MovieAnalysisSceneAssemblyEngineReport {
  const report: MovieAnalysisSceneAssemblyEngineReport = {
    report_id: 'movie-analysis-scene-assembly-engine-report-v1',
    phase: SCENE_ASSEMBLY_ENGINE_PHASE,
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
    production_blueprint_expansion_report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    production_blueprint_expansion_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    scene_assembly_engine_export_dir: SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
    scene_assembly_engine_manifest_path: SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    scene_assembly_engine_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    blueprint_consumed: 'FAIL',
    scene_assembly_complete: 'FAIL',
    scene_order_preserved: 'FAIL',
    scene_dependencies_valid: 'FAIL',
    scene_transition_valid: 'FAIL',
    continuity_preserved: 'FAIL',
    execution_readiness_valid: 'FAIL',
    character_memory_preserved: 'FAIL',
    location_memory_preserved: 'FAIL',
    story_memory_preserved: 'FAIL',
    traceability_preserved: false,
    blueprint_missing: true,
    scene_assembly_failure: true,
    scene_dependency_break: true,
    transition_break: true,
    continuity_loss: true,
    execution_not_ready: true,
    memory_binding_loss: true,
    traceability_loss: true,
    scene_assembly_engine_ready: 'FAIL',
    certification_status: null,
    assemblies: [],
    final_verdict: SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SCENE_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisSceneAssemblyEngine(
  projectRoot?: string
): MovieAnalysisSceneAssemblyEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: SceneAssemblyEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const expansionReport = loadReport<Record<string, unknown>>(
    root,
    PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH
  );
  const expansionArtifactPath = path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH);
  const blueprintMissing =
    !expansionReport ||
    expansionReport.final_verdict !== PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT ||
    expansionReport.certification_status !== PRODUCTION_BLUEPRINT_EXPANDED_STATUS ||
    !fs.existsSync(expansionArtifactPath);

  if (blueprintMissing) {
    issues.push({
      code: 'BLUEPRINT_MISSING',
      message: `Required ${PRODUCTION_BLUEPRINT_EXPANSION_PASS_VERDICT} with ${PRODUCTION_BLUEPRINT_EXPANDED_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const expansion = JSON.parse(
    fs.readFileSync(expansionArtifactPath, 'utf8')
  ) as ProductionBlueprintExpansionArtifact;

  if (!expansion.blueprint_expansion_complete || expansion.expanded_blueprints.length === 0) {
    issues.push({
      code: 'BLUEPRINT_NOT_READY',
      message: 'Production blueprint expansion artifact is not complete',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const assemblies = expansion.expanded_blueprints.map((blueprint) => buildSceneAssembly(blueprint));

  for (const assembly of assemblies) {
    if (assembly.assembly_ready === 'FAIL') {
      issues.push({
        code: 'SCENE_ASSEMBLY_FAILURE',
        message: `Scene assembly failed for ${assembly.assembly_id}`,
        severity: 'error',
        assembly_id: assembly.assembly_id,
      });
    }
  }

  const blueprintConsumed = toStatus(!blueprintMissing && expansion.blueprint_expansion_complete);
  const sceneAssemblyComplete = toStatus(
    assemblies.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      assemblies.every((assembly) => assembly.assembly_ready === 'PASS')
  );
  const sceneOrderPreserved = toStatus(
    assemblies.every((assembly, index) =>
      isSceneOrderPreserved(assembly, expansion.expanded_blueprints[index])
    )
  );
  const sceneDependenciesValid = toStatus(
    assemblies.every((assembly) => areSceneDependenciesValid(assembly))
  );
  const sceneTransitionValid = toStatus(assemblies.every((assembly) => sceneTransitionsValid(assembly)));
  const continuityPreserved = toStatus(
    assemblies.every((assembly) =>
      assembly.continuity_links.every((link) => link.continuity_preserved === 'PASS')
    )
  );
  const executionReadinessValid = toStatus(
    assemblies.every((assembly) => assembly.execution_readiness === 'PASS')
  );

  const characterMemoryPreserved = toStatus(
    assemblies.every((assembly) => assembly.memory_bindings.character_memory_refs.length > 0)
  );
  const locationMemoryPreserved = toStatus(
    assemblies.every((assembly) => assembly.memory_bindings.location_memory_refs.length > 0)
  );
  const storyMemoryPreserved = toStatus(
    assemblies.every((assembly) => assembly.memory_bindings.story_memory_refs.length > 0)
  );

  const traceabilityPreserved =
    assemblies.every((assembly) => assembly.traceability_chain.trace_integrity === 'PASS') &&
    characterMemoryPreserved === 'PASS' &&
    locationMemoryPreserved === 'PASS' &&
    storyMemoryPreserved === 'PASS';

  const sceneDependencyBreak = sceneDependenciesValid === 'FAIL';
  const transitionBreak = sceneTransitionValid === 'FAIL';
  const continuityLoss = continuityPreserved === 'FAIL';
  const executionNotReady = executionReadinessValid === 'FAIL';
  const memoryBindingLoss =
    characterMemoryPreserved === 'FAIL' ||
    locationMemoryPreserved === 'FAIL' ||
    storyMemoryPreserved === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;
  const sceneAssemblyFailure = sceneAssemblyComplete === 'FAIL';

  const pass =
    blueprintConsumed === 'PASS' &&
    sceneAssemblyComplete === 'PASS' &&
    sceneOrderPreserved === 'PASS' &&
    sceneDependenciesValid === 'PASS' &&
    sceneTransitionValid === 'PASS' &&
    continuityPreserved === 'PASS' &&
    executionReadinessValid === 'PASS' &&
    characterMemoryPreserved === 'PASS' &&
    locationMemoryPreserved === 'PASS' &&
    storyMemoryPreserved === 'PASS' &&
    traceabilityPreserved &&
    !sceneAssemblyFailure &&
    !sceneDependencyBreak &&
    !transitionBreak &&
    !continuityLoss &&
    !executionNotReady &&
    !memoryBindingLoss &&
    !traceabilityLoss &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: SceneAssemblyEngineArtifact = {
    engine_id: 'scene-assembly-engine-v1',
    phase: SCENE_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    blueprint_expansion_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    assemblies,
    scene_assembly_complete: pass,
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

  const manifest: MovieAnalysisSceneAssemblyEngineManifest = {
    manifest_id: 'movie-analysis-scene-assembly-engine-manifest-v1',
    phase: SCENE_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    blueprint_consumed: blueprintConsumed,
    scene_assembly_complete: sceneAssemblyComplete,
    scene_order_preserved: sceneOrderPreserved,
    scene_dependencies_valid: sceneDependenciesValid,
    scene_transition_valid: sceneTransitionValid,
    continuity_preserved: continuityPreserved,
    execution_readiness_valid: executionReadinessValid,
    character_memory_preserved: characterMemoryPreserved,
    location_memory_preserved: locationMemoryPreserved,
    story_memory_preserved: storyMemoryPreserved,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? SCENE_ASSEMBLY_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, SCENE_ASSEMBLY_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisSceneAssemblyEngineReport = {
    report_id: 'movie-analysis-scene-assembly-engine-report-v1',
    phase: SCENE_ASSEMBLY_ENGINE_PHASE,
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
    production_blueprint_expansion_report_path: PRODUCTION_BLUEPRINT_EXPANSION_REPORT_PATH,
    production_blueprint_expansion_artifact_path: PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
    scene_assembly_engine_export_dir: SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
    scene_assembly_engine_manifest_path: SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    scene_assembly_engine_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    blueprint_consumed: blueprintConsumed,
    scene_assembly_complete: sceneAssemblyComplete,
    scene_order_preserved: sceneOrderPreserved,
    scene_dependencies_valid: sceneDependenciesValid,
    scene_transition_valid: sceneTransitionValid,
    continuity_preserved: continuityPreserved,
    execution_readiness_valid: executionReadinessValid,
    character_memory_preserved: characterMemoryPreserved,
    location_memory_preserved: locationMemoryPreserved,
    story_memory_preserved: storyMemoryPreserved,
    traceability_preserved: traceabilityPreserved,
    blueprint_missing: false,
    scene_assembly_failure: sceneAssemblyFailure,
    scene_dependency_break: sceneDependencyBreak,
    transition_break: transitionBreak,
    continuity_loss: continuityLoss,
    execution_not_ready: executionNotReady,
    memory_binding_loss: memoryBindingLoss,
    traceability_loss: traceabilityLoss,
    scene_assembly_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? SCENE_ASSEMBLY_READY_STATUS : null,
    assemblies,
    final_verdict: pass ? SCENE_ASSEMBLY_ENGINE_PASS_VERDICT : SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SCENE_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SCENE_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
