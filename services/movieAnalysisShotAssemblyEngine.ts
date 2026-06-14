import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import {
  PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH,
  type ExpandedProductionBlueprint,
  type ProductionBlueprintExpansionArtifact,
} from './movieAnalysisProductionBlueprintExpansion.js';
import {
  PRODUCTION_BLUEPRINT_TYPE_COUNT,
  SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  SCENE_ASSEMBLY_READY_STATUS,
  type SceneAssembly,
  type SceneAssemblyEngineArtifact,
  type SceneUnit,
} from './movieAnalysisSceneAssemblyEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SHOT_ASSEMBLY_ENGINE_PHASE = 'PHASE-LEVEL3-004-SHOT_ASSEMBLY_ENGINE_V1' as const;
export const SHOT_ASSEMBLY_ENGINE_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_SHOT_ASSEMBLY_ENGINE_V1' as const;
export const SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_SHOT_ASSEMBLY_ENGINE_V1' as const;
export const SHOT_ASSEMBLY_READY_STATUS = 'SHOT_ASSEMBLY_READY' as const;
export const SHOT_ASSEMBLY_ENGINE_DIR = 'reports/movie_analysis_shot_assembly_engine' as const;
export const SHOT_ASSEMBLY_ENGINE_REPORT_PATH =
  'reports/movie_analysis_shot_assembly_engine/movie-analysis-shot-assembly-engine-report.json' as const;
export const SHOT_ASSEMBLY_ENGINE_MD_PATH =
  'reports/movie_analysis_shot_assembly_engine/MOVIE_ANALYSIS_SHOT_ASSEMBLY_ENGINE.md' as const;
export const SHOT_ASSEMBLY_ENGINE_EXPORT_DIR =
  'exports/movie_analysis_shot_assembly_engine' as const;
export const SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH =
  'exports/movie_analysis_shot_assembly_engine/movie-analysis-shot-assembly-engine-manifest.json' as const;
export const SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH =
  'exports/movie_analysis_shot_assembly_engine/shot-assembly-engine.json' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, PRODUCTION_BLUEPRINT_TYPE_COUNT };

export type CertificationStatus = 'PASS' | 'FAIL';

export type ShotAssemblyEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  shot_assembly_id?: string;
  shot_id?: string;
};

export type ShotDurationPlan = {
  duration_seconds: number;
  duration_unit: 'seconds';
  pacing_role: string;
};

export type ShotUnit = {
  shot_id: string;
  scene_id: string;
  shot_order: number;
  shot_type: string;
  camera_motion: string;
  coverage_role: string;
  shot_duration_plan: ShotDurationPlan;
  visual_intent: string;
  generation_prompt_seed: string;
  adapter_requirements: string[];
  incoming_dependencies: string[];
  outgoing_dependencies: string[];
  execution_ready: CertificationStatus;
};

export type ShotDependencyLink = {
  shot_id: string;
  depends_on: string[];
  required_by: string[];
};

export type ShotTransitionLink = {
  from_shot_id: string;
  to_shot_id: string;
  transition_type: string;
};

export type CoverageLink = {
  shot_id: string;
  coverage_strategy: string;
  coverage_role: string;
  coverage_preserved: CertificationStatus;
};

export type CameraMotionLink = {
  shot_id: string;
  camera_motion: string;
  motion_preserved: CertificationStatus;
};

export type ShotContinuityLink = {
  continuity_target_id: string;
  linked_shot_ids: string[];
  continuity_preserved: CertificationStatus;
};

export type ShotAssembly = {
  shot_assembly_id: string;
  assembly_id: string;
  production_type: SceneAssembly['production_type'];
  shot_units: ShotUnit[];
  shot_sequence: string[];
  shot_dependencies: ShotDependencyLink[];
  shot_transitions: ShotTransitionLink[];
  coverage_links: CoverageLink[];
  camera_motion_links: CameraMotionLink[];
  continuity_links: ShotContinuityLink[];
  execution_readiness: CertificationStatus;
  traceability_chain: SceneAssembly['traceability_chain'];
  shot_assembly_ready: CertificationStatus;
};

export type ShotAssemblyEngineArtifact = {
  engine_id: string;
  phase: typeof SHOT_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  scene_assembly_artifact_path: typeof SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  shot_assemblies: ShotAssembly[];
  shot_assembly_complete: boolean;
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

export type MovieAnalysisShotAssemblyEngineManifest = {
  manifest_id: string;
  phase: typeof SHOT_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  shot_assembly_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  scene_assembly_consumed: CertificationStatus;
  shot_assembly_complete: CertificationStatus;
  shot_order_preserved: CertificationStatus;
  shot_dependencies_valid: CertificationStatus;
  shot_transition_valid: CertificationStatus;
  shot_duration_valid: CertificationStatus;
  generation_prompt_seed_present: CertificationStatus;
  adapter_requirements_preserved: CertificationStatus;
  coverage_preserved: CertificationStatus;
  camera_motion_preserved: CertificationStatus;
  continuity_preserved: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  certification_status: typeof SHOT_ASSEMBLY_READY_STATUS | null;
};

export type MovieAnalysisShotAssemblyEngineReport = {
  report_id: string;
  phase: typeof SHOT_ASSEMBLY_ENGINE_PHASE;
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
  scene_assembly_engine_report_path: typeof SCENE_ASSEMBLY_ENGINE_REPORT_PATH;
  scene_assembly_engine_artifact_path: typeof SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  shot_assembly_engine_export_dir: typeof SHOT_ASSEMBLY_ENGINE_EXPORT_DIR;
  shot_assembly_engine_manifest_path: typeof SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH;
  shot_assembly_engine_artifact_path: typeof SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  shot_assembly_count: typeof PRODUCTION_BLUEPRINT_TYPE_COUNT;
  scene_assembly_consumed: CertificationStatus;
  shot_assembly_complete: CertificationStatus;
  shot_order_preserved: CertificationStatus;
  shot_dependencies_valid: CertificationStatus;
  shot_transition_valid: CertificationStatus;
  shot_duration_valid: CertificationStatus;
  generation_prompt_seed_present: CertificationStatus;
  adapter_requirements_preserved: CertificationStatus;
  coverage_preserved: CertificationStatus;
  camera_motion_preserved: CertificationStatus;
  continuity_preserved: CertificationStatus;
  execution_readiness_valid: CertificationStatus;
  traceability_preserved: boolean;
  scene_assembly_missing: boolean;
  shot_assembly_failure: boolean;
  shot_dependency_break: boolean;
  shot_transition_break: boolean;
  shot_duration_invalid: boolean;
  generation_prompt_seed_missing: boolean;
  adapter_requirements_loss: boolean;
  coverage_loss: boolean;
  continuity_loss: boolean;
  execution_not_ready: boolean;
  traceability_loss: boolean;
  shot_assembly_engine_ready: CertificationStatus;
  certification_status: typeof SHOT_ASSEMBLY_READY_STATUS | null;
  shot_assemblies: ShotAssembly[];
  final_verdict: typeof SHOT_ASSEMBLY_ENGINE_PASS_VERDICT | typeof SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT;
  issues: ShotAssemblyEngineIssue[];
};

const COVERAGE_ROLE_MAP: Record<string, string> = {
  layout_shot: 'establishing_coverage',
  bridge_shot: 'connective_coverage',
  hold_shot: 'sustain_coverage',
  shift_shot: 'transition_coverage',
  coverage_shot: 'general_coverage',
};

const DURATION_BY_SHOT_TYPE: Record<string, number> = {
  layout_shot: 2.5,
  bridge_shot: 1.5,
  hold_shot: 3.0,
  shift_shot: 2.0,
  coverage_shot: 2.0,
};

function loadReport<T>(root: string, reportPath: string): T | null {
  const abs = path.join(root, reportPath);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function toStatus(value: boolean): CertificationStatus {
  return value ? 'PASS' : 'FAIL';
}

const BLUEPRINT_PREFIX_TO_SOURCE: Record<string, string> = {
  generation_blueprint_ghibli_01_v1: 'GHIBLI_01',
  generation_blueprint_little_women_01_v1: 'LITTLE_WOMEN_01',
  generation_blueprint_mori_01_v1: 'MORI_01',
  generation_blueprint_shinkai_01_v1: 'SHINKAI_01',
};

function sourcePrefixFromId(id: string): string {
  for (const prefix of Object.keys(BLUEPRINT_PREFIX_TO_SOURCE)) {
    if (id.startsWith(prefix)) return prefix;
  }
  return id;
}

function sourceVideoIdFromSceneId(sceneId: string): string {
  const prefix = sourcePrefixFromId(sceneId);
  return BLUEPRINT_PREFIX_TO_SOURCE[prefix] ?? prefix;
}

function coverageRoleForShotType(shotType: string): string {
  return COVERAGE_ROLE_MAP[shotType] ?? 'general_coverage';
}

function durationForShotType(shotType: string): ShotDurationPlan {
  const duration = DURATION_BY_SHOT_TYPE[shotType] ?? 2.0;
  return {
    duration_seconds: duration,
    duration_unit: 'seconds',
    pacing_role: shotType.replace('_shot', '_pacing'),
  };
}

function isShotDurationValid(plan: ShotDurationPlan): boolean {
  return plan.duration_seconds > 0 && plan.duration_unit === 'seconds' && plan.pacing_role.length > 0;
}

function transitionType(fromType: string, toType: string): string {
  return `${fromType}_to_${toType}`;
}

function extractCameraShotIds(blueprint: ExpandedProductionBlueprint): string[] {
  return blueprint.generation_plan.video_generation_targets.filter((target) =>
    target.includes('_camera_')
  );
}

function adaptersForScene(sceneId: string, blueprint: ExpandedProductionBlueprint): string[] {
  const sourceVideoId = sourceVideoIdFromSceneId(sceneId);
  return blueprint.generation_plan.adapter_requirements.filter((adapter) =>
    adapter.startsWith(`${sourceVideoId}_`)
  );
}

function assignShotsToScenes(
  shotIds: string[],
  shotTypes: string[],
  cameraMotions: string[],
  scenes: SceneUnit[],
  blueprint: ExpandedProductionBlueprint
): Array<{
  shotId: string;
  sceneId: string;
  shotType: string;
  cameraMotion: string;
  scenePurpose: string;
  adapterRequirements: string[];
}> {
  const scenesBySource = new Map<string, SceneUnit[]>();
  for (const scene of scenes) {
    const prefix = sourcePrefixFromId(scene.scene_id);
    const group = scenesBySource.get(prefix) ?? [];
    group.push(scene);
    scenesBySource.set(prefix, group);
  }

  const shotsBySource = new Map<
    string,
    Array<{ shotId: string; shotType: string; cameraMotion: string }>
  >();
  for (let index = 0; index < shotIds.length; index += 1) {
    const shotId = shotIds[index];
    const prefix = sourcePrefixFromId(shotId);
    const group = shotsBySource.get(prefix) ?? [];
    group.push({
      shotId,
      shotType: shotTypes[index] ?? 'coverage_shot',
      cameraMotion: cameraMotions[index] ?? 'camera_static',
    });
    shotsBySource.set(prefix, group);
  }

  const assignments: Array<{
    shotId: string;
    sceneId: string;
    shotType: string;
    cameraMotion: string;
    scenePurpose: string;
    adapterRequirements: string[];
  }> = [];

  for (const [prefix, shots] of shotsBySource.entries()) {
    const sourceScenes = scenesBySource.get(prefix) ?? [];
    if (sourceScenes.length === 0) continue;

    shots.forEach((shot, index) => {
      const scene = sourceScenes[index % sourceScenes.length];
      assignments.push({
        shotId: shot.shotId,
        sceneId: scene.scene_id,
        shotType: shot.shotType,
        cameraMotion: shot.cameraMotion,
        scenePurpose: scene.scene_purpose,
        adapterRequirements: adaptersForScene(scene.scene_id, blueprint),
      });
    });
  }

  return assignments.sort((left, right) => left.shotId.localeCompare(right.shotId));
}

function buildShotUnits(
  assignments: ReturnType<typeof assignShotsToScenes>
): ShotUnit[] {
  return assignments.map((assignment, index) => {
    const prevShotId = index > 0 ? assignments[index - 1].shotId : null;
    const nextShotId = index < assignments.length - 1 ? assignments[index + 1].shotId : null;
    const coverageRole = coverageRoleForShotType(assignment.shotType);
    const durationPlan = durationForShotType(assignment.shotType);
    const promptSeed = `${assignment.shotId}_${assignment.scenePurpose}_${assignment.shotType}`;

    const executionReady =
      assignment.shotId.length > 0 &&
      assignment.sceneId.length > 0 &&
      promptSeed.length > 0 &&
      assignment.adapterRequirements.length > 0 &&
      isShotDurationValid(durationPlan);

    return {
      shot_id: assignment.shotId,
      scene_id: assignment.sceneId,
      shot_order: index + 1,
      shot_type: assignment.shotType,
      camera_motion: assignment.cameraMotion,
      coverage_role: coverageRole,
      shot_duration_plan: durationPlan,
      visual_intent: `${assignment.scenePurpose}_${coverageRole}`,
      generation_prompt_seed: promptSeed,
      adapter_requirements: assignment.adapterRequirements,
      incoming_dependencies: prevShotId ? [prevShotId] : [],
      outgoing_dependencies: nextShotId ? [nextShotId] : [],
      execution_ready: toStatus(executionReady),
    };
  });
}

function buildShotAssembly(
  sceneAssembly: SceneAssembly,
  blueprint: ExpandedProductionBlueprint
): ShotAssembly {
  const shotIds = extractCameraShotIds(blueprint);
  const assignments = assignShotsToScenes(
    shotIds,
    blueprint.shot_plan.shot_types,
    blueprint.shot_plan.camera_motion,
    sceneAssembly.scene_units,
    blueprint
  );
  const shotUnits = buildShotUnits(assignments);
  const shotSequence = shotUnits.map((unit) => unit.shot_id);

  const shotDependencies: ShotDependencyLink[] = shotUnits.map((unit) => ({
    shot_id: unit.shot_id,
    depends_on: [...unit.incoming_dependencies],
    required_by: [...unit.outgoing_dependencies],
  }));

  const shotTransitions: ShotTransitionLink[] = shotUnits.slice(0, -1).map((unit, index) => ({
    from_shot_id: unit.shot_id,
    to_shot_id: shotUnits[index + 1].shot_id,
    transition_type: transitionType(unit.shot_type, shotUnits[index + 1].shot_type),
  }));

  const coverageLinks: CoverageLink[] = shotUnits.map((unit) => ({
    shot_id: unit.shot_id,
    coverage_strategy: blueprint.shot_plan.coverage_strategy,
    coverage_role: unit.coverage_role,
    coverage_preserved: toStatus(unit.coverage_role.length > 0),
  }));

  const cameraMotionLinks: CameraMotionLink[] = shotUnits.map((unit) => ({
    shot_id: unit.shot_id,
    camera_motion: unit.camera_motion,
    motion_preserved: toStatus(unit.camera_motion.length > 0),
  }));

  const continuityLinks: ShotContinuityLink[] = sceneAssembly.continuity_links.map((link) => {
    const linkedShotIds = shotUnits
      .filter((unit) => link.linked_scene_ids.includes(unit.scene_id))
      .map((unit) => unit.shot_id);
    return {
      continuity_target_id: link.continuity_target_id,
      linked_shot_ids: linkedShotIds,
      continuity_preserved: toStatus(linkedShotIds.length > 0),
    };
  });

  const executionReadiness = toStatus(shotUnits.every((unit) => unit.execution_ready === 'PASS'));
  const shotAssemblyReady = toStatus(
    shotUnits.length === blueprint.shot_plan.shot_count &&
      executionReadiness === 'PASS' &&
      coverageLinks.every((link) => link.coverage_preserved === 'PASS') &&
      cameraMotionLinks.every((link) => link.motion_preserved === 'PASS') &&
      continuityLinks.every((link) => link.continuity_preserved === 'PASS') &&
      sceneAssembly.traceability_chain.trace_integrity === 'PASS'
  );

  return {
    shot_assembly_id: sceneAssembly.assembly_id.replace('_assembly_', '_shot_assembly_'),
    assembly_id: sceneAssembly.assembly_id,
    production_type: sceneAssembly.production_type,
    shot_units: shotUnits,
    shot_sequence: shotSequence,
    shot_dependencies: shotDependencies,
    shot_transitions: shotTransitions,
    coverage_links: coverageLinks,
    camera_motion_links: cameraMotionLinks,
    continuity_links: continuityLinks,
    execution_readiness: executionReadiness,
    traceability_chain: sceneAssembly.traceability_chain,
    shot_assembly_ready: shotAssemblyReady,
  };
}

function isShotOrderPreserved(shotAssembly: ShotAssembly): boolean {
  return shotAssembly.shot_units.every((unit, index) => unit.shot_order === index + 1);
}

function areShotDependenciesValid(shotAssembly: ShotAssembly): boolean {
  return shotAssembly.shot_dependencies.every((dependency, index) => {
    if (index === 0) return dependency.depends_on.length === 0;
    return (
      dependency.depends_on.length === 1 &&
      dependency.depends_on[0] === shotAssembly.shot_units[index - 1]?.shot_id
    );
  });
}

function areShotTransitionsValid(shotAssembly: ShotAssembly): boolean {
  return (
    shotAssembly.shot_transitions.length === shotAssembly.shot_units.length - 1 &&
    shotAssembly.shot_transitions.every((transition, index) => {
      const fromUnit = shotAssembly.shot_units[index];
      const toUnit = shotAssembly.shot_units[index + 1];
      return (
        transition.from_shot_id === fromUnit?.shot_id &&
        transition.to_shot_id === toUnit?.shot_id
      );
    })
  );
}

function buildMarkdown(report: MovieAnalysisShotAssemblyEngineReport): string {
  const lines = [
    '# Movie Analysis Shot Assembly Engine',
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
    `| scene_assembly_consumed | ${report.scene_assembly_consumed} |`,
    `| shot_assembly_complete | ${report.shot_assembly_complete} |`,
    `| shot_order_preserved | ${report.shot_order_preserved} |`,
    `| shot_dependencies_valid | ${report.shot_dependencies_valid} |`,
    `| shot_transition_valid | ${report.shot_transition_valid} |`,
    `| shot_duration_valid | ${report.shot_duration_valid} |`,
    `| generation_prompt_seed_present | ${report.generation_prompt_seed_present} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    '',
    '## Shot Assemblies',
    ''
  );

  for (const assembly of report.shot_assemblies) {
    lines.push(
      `- ${assembly.shot_assembly_id}: ready=${assembly.shot_assembly_ready} shots=${assembly.shot_units.length}`
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
  issues: ShotAssemblyEngineIssue[]
): MovieAnalysisShotAssemblyEngineReport {
  const report: MovieAnalysisShotAssemblyEngineReport = {
    report_id: 'movie-analysis-shot-assembly-engine-report-v1',
    phase: SHOT_ASSEMBLY_ENGINE_PHASE,
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
    scene_assembly_engine_report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    scene_assembly_engine_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    shot_assembly_engine_export_dir: SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
    shot_assembly_engine_manifest_path: SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    shot_assembly_engine_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    shot_assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    scene_assembly_consumed: 'FAIL',
    shot_assembly_complete: 'FAIL',
    shot_order_preserved: 'FAIL',
    shot_dependencies_valid: 'FAIL',
    shot_transition_valid: 'FAIL',
    shot_duration_valid: 'FAIL',
    generation_prompt_seed_present: 'FAIL',
    adapter_requirements_preserved: 'FAIL',
    coverage_preserved: 'FAIL',
    camera_motion_preserved: 'FAIL',
    continuity_preserved: 'FAIL',
    execution_readiness_valid: 'FAIL',
    traceability_preserved: false,
    scene_assembly_missing: true,
    shot_assembly_failure: true,
    shot_dependency_break: true,
    shot_transition_break: true,
    shot_duration_invalid: true,
    generation_prompt_seed_missing: true,
    adapter_requirements_loss: true,
    coverage_loss: true,
    continuity_loss: true,
    execution_not_ready: true,
    traceability_loss: true,
    shot_assembly_engine_ready: 'FAIL',
    certification_status: null,
    shot_assemblies: [],
    final_verdict: SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SHOT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMovieAnalysisShotAssemblyEngine(
  projectRoot?: string
): MovieAnalysisShotAssemblyEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: ShotAssemblyEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const sceneAssemblyReport = loadReport<Record<string, unknown>>(
    root,
    SCENE_ASSEMBLY_ENGINE_REPORT_PATH
  );
  const sceneAssemblyArtifactPath = path.join(root, SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH);
  const sceneAssemblyMissing =
    !sceneAssemblyReport ||
    sceneAssemblyReport.final_verdict !== SCENE_ASSEMBLY_ENGINE_PASS_VERDICT ||
    sceneAssemblyReport.certification_status !== SCENE_ASSEMBLY_READY_STATUS ||
    !fs.existsSync(sceneAssemblyArtifactPath);

  if (sceneAssemblyMissing) {
    issues.push({
      code: 'SCENE_ASSEMBLY_MISSING',
      message: `Required ${SCENE_ASSEMBLY_ENGINE_PASS_VERDICT} with ${SCENE_ASSEMBLY_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const sceneAssemblyArtifact = JSON.parse(
    fs.readFileSync(sceneAssemblyArtifactPath, 'utf8')
  ) as SceneAssemblyEngineArtifact;

  if (!sceneAssemblyArtifact.scene_assembly_complete || sceneAssemblyArtifact.assemblies.length === 0) {
    issues.push({
      code: 'SCENE_ASSEMBLY_NOT_READY',
      message: 'Scene assembly engine artifact is not complete',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const expansionArtifactPath = path.join(root, PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH);
  if (!fs.existsSync(expansionArtifactPath)) {
    issues.push({
      code: 'BLUEPRINT_EXPANSION_MISSING',
      message: `Missing read-only upstream artifact ${PRODUCTION_BLUEPRINT_EXPANSION_ARTIFACT_PATH}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues);
  }

  const expansion = JSON.parse(
    fs.readFileSync(expansionArtifactPath, 'utf8')
  ) as ProductionBlueprintExpansionArtifact;

  const shotAssemblies: ShotAssembly[] = [];
  for (const sceneAssembly of sceneAssemblyArtifact.assemblies) {
    const blueprint = expansion.expanded_blueprints.find(
      (entry) => entry.production_type === sceneAssembly.production_type
    );
    if (!blueprint) {
      issues.push({
        code: 'SHOT_ASSEMBLY_FAILURE',
        message: `Missing expanded blueprint for ${sceneAssembly.production_type}`,
        severity: 'error',
        shot_assembly_id: sceneAssembly.assembly_id,
      });
      continue;
    }

    const shotAssembly = buildShotAssembly(sceneAssembly, blueprint);
    shotAssemblies.push(shotAssembly);
    if (shotAssembly.shot_assembly_ready === 'FAIL') {
      issues.push({
        code: 'SHOT_ASSEMBLY_FAILURE',
        message: `Shot assembly failed for ${shotAssembly.shot_assembly_id}`,
        severity: 'error',
        shot_assembly_id: shotAssembly.shot_assembly_id,
      });
    }
  }

  const sceneAssemblyConsumed = toStatus(
    !sceneAssemblyMissing && sceneAssemblyArtifact.scene_assembly_complete
  );
  const shotAssemblyComplete = toStatus(
    shotAssemblies.length === PRODUCTION_BLUEPRINT_TYPE_COUNT &&
      shotAssemblies.every((assembly) => assembly.shot_assembly_ready === 'PASS')
  );
  const shotOrderPreserved = toStatus(shotAssemblies.every((assembly) => isShotOrderPreserved(assembly)));
  const shotDependenciesValid = toStatus(
    shotAssemblies.every((assembly) => areShotDependenciesValid(assembly))
  );
  const shotTransitionValid = toStatus(
    shotAssemblies.every((assembly) => areShotTransitionsValid(assembly))
  );
  const shotDurationValid = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.shot_units.every((unit) => isShotDurationValid(unit.shot_duration_plan))
    )
  );
  const generationPromptSeedPresent = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.shot_units.every((unit) => unit.generation_prompt_seed.length > 0)
    )
  );
  const adapterRequirementsPreserved = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.shot_units.every((unit) => unit.adapter_requirements.length > 0)
    )
  );
  const coveragePreserved = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.coverage_links.every((link) => link.coverage_preserved === 'PASS')
    )
  );
  const cameraMotionPreserved = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.camera_motion_links.every((link) => link.motion_preserved === 'PASS')
    )
  );
  const continuityPreserved = toStatus(
    shotAssemblies.every((assembly) =>
      assembly.continuity_links.every((link) => link.continuity_preserved === 'PASS')
    )
  );
  const executionReadinessValid = toStatus(
    shotAssemblies.every((assembly) => assembly.execution_readiness === 'PASS')
  );
  const traceabilityPreserved =
    shotAssemblies.every((assembly) => assembly.traceability_chain.trace_integrity === 'PASS') &&
    generationPromptSeedPresent === 'PASS' &&
    adapterRequirementsPreserved === 'PASS';

  const shotDependencyBreak = shotDependenciesValid === 'FAIL';
  const shotTransitionBreak = shotTransitionValid === 'FAIL';
  const shotDurationInvalid = shotDurationValid === 'FAIL';
  const generationPromptSeedMissing = generationPromptSeedPresent === 'FAIL';
  const adapterRequirementsLoss = adapterRequirementsPreserved === 'FAIL';
  const coverageLoss = coveragePreserved === 'FAIL';
  const continuityLoss = continuityPreserved === 'FAIL';
  const executionNotReady = executionReadinessValid === 'FAIL';
  const traceabilityLoss = !traceabilityPreserved;
  const shotAssemblyFailure = shotAssemblyComplete === 'FAIL';

  const pass =
    sceneAssemblyConsumed === 'PASS' &&
    shotAssemblyComplete === 'PASS' &&
    shotOrderPreserved === 'PASS' &&
    shotDependenciesValid === 'PASS' &&
    shotTransitionValid === 'PASS' &&
    shotDurationValid === 'PASS' &&
    generationPromptSeedPresent === 'PASS' &&
    adapterRequirementsPreserved === 'PASS' &&
    coveragePreserved === 'PASS' &&
    cameraMotionPreserved === 'PASS' &&
    continuityPreserved === 'PASS' &&
    executionReadinessValid === 'PASS' &&
    traceabilityPreserved &&
    !shotAssemblyFailure &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: ShotAssemblyEngineArtifact = {
    engine_id: 'shot-assembly-engine-v1',
    phase: SHOT_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    scene_assembly_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    shot_assemblies: shotAssemblies,
    shot_assembly_complete: pass,
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

  const manifest: MovieAnalysisShotAssemblyEngineManifest = {
    manifest_id: 'movie-analysis-shot-assembly-engine-manifest-v1',
    phase: SHOT_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    shot_assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    scene_assembly_consumed: sceneAssemblyConsumed,
    shot_assembly_complete: shotAssemblyComplete,
    shot_order_preserved: shotOrderPreserved,
    shot_dependencies_valid: shotDependenciesValid,
    shot_transition_valid: shotTransitionValid,
    shot_duration_valid: shotDurationValid,
    generation_prompt_seed_present: generationPromptSeedPresent,
    adapter_requirements_preserved: adapterRequirementsPreserved,
    coverage_preserved: coveragePreserved,
    camera_motion_preserved: cameraMotionPreserved,
    continuity_preserved: continuityPreserved,
    execution_readiness_valid: executionReadinessValid,
    traceability_preserved: traceabilityPreserved,
    certification_status: pass ? SHOT_ASSEMBLY_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, SHOT_ASSEMBLY_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MovieAnalysisShotAssemblyEngineReport = {
    report_id: 'movie-analysis-shot-assembly-engine-report-v1',
    phase: SHOT_ASSEMBLY_ENGINE_PHASE,
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
    scene_assembly_engine_report_path: SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    scene_assembly_engine_artifact_path: SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    shot_assembly_engine_export_dir: SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
    shot_assembly_engine_manifest_path: SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    shot_assembly_engine_artifact_path: SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    shot_assembly_count: PRODUCTION_BLUEPRINT_TYPE_COUNT,
    scene_assembly_consumed: sceneAssemblyConsumed,
    shot_assembly_complete: shotAssemblyComplete,
    shot_order_preserved: shotOrderPreserved,
    shot_dependencies_valid: shotDependenciesValid,
    shot_transition_valid: shotTransitionValid,
    shot_duration_valid: shotDurationValid,
    generation_prompt_seed_present: generationPromptSeedPresent,
    adapter_requirements_preserved: adapterRequirementsPreserved,
    coverage_preserved: coveragePreserved,
    camera_motion_preserved: cameraMotionPreserved,
    continuity_preserved: continuityPreserved,
    execution_readiness_valid: executionReadinessValid,
    traceability_preserved: traceabilityPreserved,
    scene_assembly_missing: false,
    shot_assembly_failure: shotAssemblyFailure,
    shot_dependency_break: shotDependencyBreak,
    shot_transition_break: shotTransitionBreak,
    shot_duration_invalid: shotDurationInvalid,
    generation_prompt_seed_missing: generationPromptSeedMissing,
    adapter_requirements_loss: adapterRequirementsLoss,
    coverage_loss: coverageLoss,
    continuity_loss: continuityLoss,
    execution_not_ready: executionNotReady,
    traceability_loss: traceabilityLoss,
    shot_assembly_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? SHOT_ASSEMBLY_READY_STATUS : null,
    shot_assemblies: shotAssemblies,
    final_verdict: pass ? SHOT_ASSEMBLY_ENGINE_PASS_VERDICT : SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, SHOT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHOT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
