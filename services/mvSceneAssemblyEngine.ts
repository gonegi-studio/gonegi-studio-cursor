import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_BLUEPRINT_READY_STATUS,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
  type MvBlueprint,
  type MvProductionBlueprintSystemArtifact,
} from './mvProductionBlueprintSystem.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_SCENE_ASSEMBLY_ENGINE_PHASE =
  'PHASE-DIGITAL-STUDIO-003-MV_SCENE_ASSEMBLY_ENGINE_V1' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT = 'PASS_MV_SCENE_ASSEMBLY_ENGINE_V1' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT = 'FAIL_MV_SCENE_ASSEMBLY_ENGINE_V1' as const;
export const MV_SCENE_ASSEMBLY_READY_STATUS = 'MV_SCENE_ASSEMBLY_READY' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_DIR = 'reports/mv_scene_assembly_engine' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH =
  'reports/mv_scene_assembly_engine/mv-scene-assembly-engine-report.json' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_MD_PATH =
  'reports/mv_scene_assembly_engine/MV_SCENE_ASSEMBLY_ENGINE.md' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR = 'exports/mv_scene_assembly_engine' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH =
  'exports/mv_scene_assembly_engine/mv-scene-assembly-engine-manifest.json' as const;
export const MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH =
  'exports/mv_scene_assembly_engine/mv-scene-assembly-engine.json' as const;

export const SCENE_ASSEMBLY_ARTIFACT_WRITE_SCOPE = 'exports/mv_scene_assembly_engine/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type AssemblyStatus = 'PASS' | 'FAIL';

export type MvSceneAssemblyEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type AssemblyCheck = {
  check_id: string;
  check_label: string;
  status: AssemblyStatus;
};

export type MvSceneUnit = {
  scene_unit_id: string;
  scene_id: string;
  scene_order: number;
  scene_goal: string;
  mv_type: MvType;
  lyric_or_music_section_ref: string;
  duration_seconds: number;
  unit_ready: AssemblyStatus;
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
  transition_valid: boolean;
};

export type ContinuityLink = {
  continuity_link_id: string;
  linked_scene_ids: string[];
  continuity_target: string;
  continuity_preserved: AssemblyStatus;
};

export type MusicSyncLink = {
  sync_link_id: string;
  scene_ref: string;
  beat_index: number;
  timestamp_seconds: number;
  sync_preserved: AssemblyStatus;
};

export type EmotionalProgressionLink = {
  progression_link_id: string;
  scene_ref: string;
  emotional_state: string;
  progression_order: number;
  progression_preserved: AssemblyStatus;
};

export type SceneDurationEntry = {
  scene_ref: string;
  duration_seconds: number;
  duration_valid: boolean;
};

export type SceneDurationPlan = {
  plan_id: string;
  total_seconds_min: number;
  total_seconds_max: number;
  scene_durations: SceneDurationEntry[];
  plan_valid: boolean;
};

export type MvSceneAssemblyTraceability = {
  source_blueprint_ref: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH;
  mv_blueprint_id: string;
  mv_foundation_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: AssemblyStatus;
};

export type MvSceneAssembly = {
  mv_scene_assembly_id: string;
  source_blueprint_ref: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH;
  mv_type: MvType;
  mv_type_preserved: boolean;
  mv_scene_units: MvSceneUnit[];
  scene_sequence: string[];
  scene_dependencies: SceneDependencyLink[];
  scene_transitions: SceneTransitionLink[];
  continuity_links: ContinuityLink[];
  music_sync_links: MusicSyncLink[];
  emotional_progression_links: EmotionalProgressionLink[];
  scene_duration_plan: SceneDurationPlan;
  lyric_or_music_section_ref: string[];
  traceability_chain: MvSceneAssemblyTraceability;
  assembly_ready: AssemblyStatus;
};

export type MvSceneAssemblyEngineArtifact = {
  engine_id: string;
  phase: typeof MV_SCENE_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  source_blueprint_ref: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH;
  blueprint_system_id: string;
  mv_scene_assemblies: MvSceneAssembly[];
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
    production_mode_blocked: true;
  };
  blueprint_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    scene_assembly_artifact_write_scope: typeof SCENE_ASSEMBLY_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  scene_assembly_complete: boolean;
};

export type MvSceneAssemblyEngineManifest = {
  manifest_id: string;
  phase: typeof MV_SCENE_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  assembly_count: typeof MV_TYPE_COUNT;
  blueprint_consumed: AssemblyStatus;
  scene_assembly_ready: AssemblyStatus;
  scene_sequence_valid: AssemblyStatus;
  scene_transition_valid: AssemblyStatus;
  scene_duration_valid: AssemblyStatus;
  music_section_ref_valid: AssemblyStatus;
  continuity_preserved: AssemblyStatus;
  music_sync_preserved: AssemblyStatus;
  emotional_progression_preserved: AssemblyStatus;
  mv_type_preserved: AssemblyStatus;
  traceability_preserved: boolean;
  production_mode_blocked: AssemblyStatus;
  certification_status: typeof MV_SCENE_ASSEMBLY_READY_STATUS | null;
};

export type MvSceneAssemblyEngineReport = {
  report_id: string;
  phase: typeof MV_SCENE_ASSEMBLY_ENGINE_PHASE;
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
  source_blueprint_ref: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH;
  mv_production_blueprint_system_report_path: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH;
  mv_scene_assembly_engine_export_dir: typeof MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR;
  mv_scene_assembly_engine_manifest_path: typeof MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH;
  mv_scene_assembly_engine_artifact_path: typeof MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  assembly_count: typeof MV_TYPE_COUNT;
  blueprint_consumed: AssemblyStatus;
  scene_assembly_ready: AssemblyStatus;
  scene_sequence_valid: AssemblyStatus;
  scene_transition_valid: AssemblyStatus;
  scene_duration_valid: AssemblyStatus;
  music_section_ref_valid: AssemblyStatus;
  continuity_preserved: AssemblyStatus;
  music_sync_preserved: AssemblyStatus;
  emotional_progression_preserved: AssemblyStatus;
  mv_type_preserved: AssemblyStatus;
  traceability_preserved: boolean;
  production_mode_blocked: AssemblyStatus;
  blueprint_missing: boolean;
  scene_sequence_invalid: boolean;
  scene_transition_invalid: boolean;
  scene_duration_missing: boolean;
  music_section_ref_missing: boolean;
  continuity_loss: boolean;
  music_sync_loss: boolean;
  emotional_progression_loss: boolean;
  mv_type_loss: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_scene_assembly_engine_ready: AssemblyStatus;
  certification_status: typeof MV_SCENE_ASSEMBLY_READY_STATUS | null;
  mv_scene_assemblies: MvSceneAssembly[];
  assembly_checks: AssemblyCheck[];
  final_verdict:
    | typeof MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT
    | typeof MV_SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT;
  issues: MvSceneAssemblyEngineIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const MUSIC_SECTION_PREFIX: Record<MvType, string> = {
  instrumental_mv: 'instrumental_section',
  ballad_mv: 'ballad_section',
  story_mv: 'story_section',
  music_drama_mv: 'music_drama_section',
};

const TRANSITION_TYPES = ['cut', 'dissolve', 'match_cut', 'fade'] as const;

const READ_ONLY_UPSTREAM_PATHS = [MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH] as const;

const ASSEMBLY_EXPORT_WRITE_PATHS = [
  MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_SCENE_ASSEMBLY_ENGINE_DIR,
  MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
  MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_MD_PATH,
  ...ASSEMBLY_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): AssemblyStatus {
  return pass ? 'PASS' : 'FAIL';
}

function loadJson<T>(root: string, relativePath: string): T | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

function snapshotFile(root: string, relativePath: string): FileSnapshot | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  const stat = fs.statSync(fullPath);
  return { size: stat.size, mtimeMs: stat.mtimeMs };
}

function snapshotsUnchanged(
  root: string,
  snapshots: Record<string, FileSnapshot | null>
): boolean {
  for (const [relativePath, snapshot] of Object.entries(snapshots)) {
    if (!snapshot) return false;
    const current = snapshotFile(root, relativePath);
    if (!current || current.size !== snapshot.size || current.mtimeMs !== snapshot.mtimeMs) {
      return false;
    }
  }
  return true;
}

function isUnderAssemblyWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(SCENE_ASSEMBLY_ARTIFACT_WRITE_SCOPE) ||
    relativePath === SCENE_ASSEMBLY_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function musicSectionRef(mvType: MvType, sceneOrder: number): string {
  return `${MUSIC_SECTION_PREFIX[mvType]}_${sceneOrder}`;
}

function buildSceneAssembly(
  blueprintSystemId: string,
  blueprint: MvBlueprint
): MvSceneAssembly {
  const scenes = blueprint.mv_scene_sequence;
  const sceneCount = scenes.length;
  const avgRuntime = Math.floor(
    (blueprint.runtime_estimate.estimated_seconds_min +
      blueprint.runtime_estimate.estimated_seconds_max) /
      2
  );
  const defaultSceneDuration = sceneCount > 0 ? Math.max(1, Math.floor(avgRuntime / sceneCount)) : 0;

  const sceneDurationEntries: SceneDurationEntry[] = scenes.map((scene) => {
    const marker = blueprint.music_sync_plan.beat_markers.find(
      (beat) => beat.scene_ref === scene.scene_id
    );
    const nextMarker = blueprint.music_sync_plan.beat_markers.find(
      (beat) => beat.beat_index === (marker?.beat_index ?? 0) + 1
    );
    const durationSeconds =
      marker && nextMarker
        ? Math.max(1, nextMarker.timestamp_seconds - marker.timestamp_seconds)
        : defaultSceneDuration;

    return {
      scene_ref: scene.scene_id,
      duration_seconds: durationSeconds,
      duration_valid: durationSeconds > 0,
    };
  });

  const mvSceneUnits: MvSceneUnit[] = scenes.map((scene, index) => {
    const duration = sceneDurationEntries[index]?.duration_seconds ?? defaultSceneDuration;
    return {
      scene_unit_id: `${scene.scene_id}_unit`,
      scene_id: scene.scene_id,
      scene_order: scene.scene_order,
      scene_goal: scene.scene_goal,
      mv_type: blueprint.mv_type,
      lyric_or_music_section_ref: musicSectionRef(blueprint.mv_type, scene.scene_order),
      duration_seconds: duration,
      unit_ready: scene.sequence_valid && scene.mv_type === blueprint.mv_type ? 'PASS' : 'FAIL',
    };
  });

  const sceneSequence = scenes.map((scene) => scene.scene_id);

  const sceneDependencies: SceneDependencyLink[] = scenes.map((scene, index) => ({
    scene_id: scene.scene_id,
    depends_on: index === 0 ? [] : [scenes[index - 1].scene_id],
    required_by: index === scenes.length - 1 ? [] : [scenes[index + 1].scene_id],
  }));

  const sceneTransitions: SceneTransitionLink[] = scenes.slice(0, -1).map((scene, index) => ({
    from_scene_id: scene.scene_id,
    to_scene_id: scenes[index + 1].scene_id,
    transition_type: TRANSITION_TYPES[index % TRANSITION_TYPES.length],
    transition_valid: true,
  }));

  const continuityLinks: ContinuityLink[] = [
    {
      continuity_link_id: `${blueprint.mv_type}_continuity_chain_v1`,
      linked_scene_ids: sceneSequence,
      continuity_target: blueprint.narrative_structure.structure_type,
      continuity_preserved: sceneSequence.length > 0 ? 'PASS' : 'FAIL',
    },
  ];

  const musicSyncLinks: MusicSyncLink[] = blueprint.music_sync_plan.beat_markers.map((marker) => ({
    sync_link_id: `${blueprint.mv_type}_sync_${marker.beat_index}`,
    scene_ref: marker.scene_ref,
    beat_index: marker.beat_index,
    timestamp_seconds: marker.timestamp_seconds,
    sync_preserved:
      scenes.some((scene) => scene.scene_id === marker.scene_ref) ? 'PASS' : 'FAIL',
  }));

  const emotionalProgressionLinks: EmotionalProgressionLink[] = scenes.map((scene, index) => ({
    progression_link_id: `${blueprint.mv_type}_emotion_${index + 1}`,
    scene_ref: scene.scene_id,
    emotional_state: blueprint.emotional_arc[index % blueprint.emotional_arc.length] ?? 'neutral',
    progression_order: index + 1,
    progression_preserved: blueprint.emotional_arc.length > 0 ? 'PASS' : 'FAIL',
  }));

  const sceneDurationPlan: SceneDurationPlan = {
    plan_id: `${blueprint.mv_type}_scene_duration_plan_v1`,
    total_seconds_min: blueprint.runtime_estimate.estimated_seconds_min,
    total_seconds_max: blueprint.runtime_estimate.estimated_seconds_max,
    scene_durations: sceneDurationEntries,
    plan_valid:
      sceneDurationEntries.length === sceneCount &&
      sceneDurationEntries.every((entry) => entry.duration_valid),
  };

  const lyricOrMusicSectionRefs = mvSceneUnits.map((unit) => unit.lyric_or_music_section_ref);

  const traceabilityChain: MvSceneAssemblyTraceability = {
    source_blueprint_ref: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    mv_blueprint_id: blueprint.mv_blueprint_id,
    mv_foundation_id: blueprint.traceability_chain.mv_foundation_id,
    upstream_runtime_id: blueprint.traceability_chain.upstream_runtime_id,
    dataset_refs: blueprint.traceability_chain.dataset_refs,
    trace_integrity: blueprint.traceability_chain.trace_integrity === 'PASS' ? 'PASS' : 'FAIL',
  };

  const mvTypePreserved = scenes.every((scene) => scene.mv_type === blueprint.mv_type);

  const assemblyReady =
    mvTypePreserved &&
    mvSceneUnits.every((unit) => unit.unit_ready === 'PASS') &&
    sceneSequence.length === sceneCount &&
    sceneTransitions.every((transition) => transition.transition_valid) &&
    sceneDurationPlan.plan_valid &&
    lyricOrMusicSectionRefs.length === sceneCount &&
    continuityLinks.every((link) => link.continuity_preserved === 'PASS') &&
    musicSyncLinks.every((link) => link.sync_preserved === 'PASS') &&
    emotionalProgressionLinks.every((link) => link.progression_preserved === 'PASS') &&
    traceabilityChain.trace_integrity === 'PASS';

  return {
    mv_scene_assembly_id: `${blueprint.mv_type}_scene_assembly_v1`,
    source_blueprint_ref: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    mv_type: blueprint.mv_type,
    mv_type_preserved: mvTypePreserved,
    mv_scene_units: mvSceneUnits,
    scene_sequence: sceneSequence,
    scene_dependencies: sceneDependencies,
    scene_transitions: sceneTransitions,
    continuity_links: continuityLinks,
    music_sync_links: musicSyncLinks,
    emotional_progression_links: emotionalProgressionLinks,
    scene_duration_plan: sceneDurationPlan,
    lyric_or_music_section_ref: lyricOrMusicSectionRefs,
    traceability_chain: traceabilityChain,
    assembly_ready: toStatus(assemblyReady),
  };
}

function buildMarkdown(report: MvSceneAssemblyEngineReport): string {
  const lines = [
    '# MV Scene Assembly Engine',
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
    `**Source Blueprint:** ${report.source_blueprint_ref}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| blueprint_consumed | ${report.blueprint_consumed} |`,
    `| scene_assembly_ready | ${report.scene_assembly_ready} |`,
    `| scene_sequence_valid | ${report.scene_sequence_valid} |`,
    `| scene_transition_valid | ${report.scene_transition_valid} |`,
    `| scene_duration_valid | ${report.scene_duration_valid} |`,
    `| music_section_ref_valid | ${report.music_section_ref_valid} |`,
    `| continuity_preserved | ${report.continuity_preserved} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| emotional_progression_preserved | ${report.emotional_progression_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## Scene Assemblies',
    ''
  );

  for (const assembly of report.mv_scene_assemblies) {
    lines.push(
      `- ${assembly.mv_scene_assembly_id} (${assembly.mv_type}): units=${assembly.mv_scene_units.length} ready=${assembly.assembly_ready}`
    );
  }

  lines.push('', '## Assembly Checks', '');
  for (const check of report.assembly_checks) {
    lines.push(`- ${check.check_id}: ${check.status}`);
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
  issues: MvSceneAssemblyEngineIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvSceneAssemblyEngineReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvSceneAssemblyEngineReport = {
    report_id: 'mv-scene-assembly-engine-report-v1',
    phase: MV_SCENE_ASSEMBLY_ENGINE_PHASE,
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
    source_blueprint_ref: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    mv_production_blueprint_system_report_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
    mv_scene_assembly_engine_export_dir: MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
    mv_scene_assembly_engine_manifest_path: MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    mv_scene_assembly_engine_artifact_path: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    assembly_count: MV_TYPE_COUNT,
    blueprint_consumed: 'FAIL',
    scene_assembly_ready: 'FAIL',
    scene_sequence_valid: 'FAIL',
    scene_transition_valid: 'FAIL',
    scene_duration_valid: 'FAIL',
    music_section_ref_valid: 'FAIL',
    continuity_preserved: 'FAIL',
    music_sync_preserved: 'FAIL',
    emotional_progression_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    blueprint_missing: true,
    scene_sequence_invalid: true,
    scene_transition_invalid: true,
    scene_duration_missing: true,
    music_section_ref_missing: true,
    continuity_loss: true,
    music_sync_loss: true,
    emotional_progression_loss: true,
    mv_type_loss: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_scene_assembly_engine_ready: 'FAIL',
    certification_status: null,
    mv_scene_assemblies: [],
    assembly_checks: [],
    final_verdict: MV_SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Blueprint artifact was modified during scene assembly write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_SCENE_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvSceneAssemblyEngine(
  projectRoot?: string
): MvSceneAssemblyEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvSceneAssemblyEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const blueprintReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_production_blueprint_system_ready: AssemblyStatus;
    mv_blueprint_ready: AssemblyStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH);
  const blueprintArtifact = loadJson<MvProductionBlueprintSystemArtifact>(
    root,
    MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH
  );

  const blueprintPrecheckValid =
    blueprintReport !== null &&
    blueprintReport.final_verdict === MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT &&
    blueprintReport.certification_status === MV_PRODUCTION_BLUEPRINT_READY_STATUS &&
    blueprintReport.mv_production_blueprint_system_ready === 'PASS' &&
    blueprintReport.mv_blueprint_ready === 'PASS' &&
    blueprintArtifact !== null &&
    blueprintArtifact.blueprint_system_ready === true;

  if (!blueprintPrecheckValid) {
    issues.push({
      code: 'BLUEPRINT_PRECHECK_FAILED',
      message: `Required ${MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT} with ${MV_PRODUCTION_BLUEPRINT_READY_STATUS}`,
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const runtimeCertArtifact = loadJson<{
    production_mode_blocked: boolean;
    real_generation_blocked: boolean;
    no_external_calls: boolean;
    no_gpu_execution: boolean;
  }>(root, PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH);

  if (!runtimeCertArtifact) {
    issues.push({
      code: 'RUNTIME_CERTIFICATION_MISSING',
      message: 'Missing production runtime certification artifact',
      severity: 'error',
    });
    return writeFailReport(root, timestamp, issues, upstreamSnapshots);
  }

  const mvSceneAssemblies = blueprintArtifact.mv_blueprints.map((blueprint) =>
    buildSceneAssembly(blueprintArtifact.blueprint_system_id, blueprint)
  );

  const blueprintConsumed =
    blueprintArtifact.foundation_consumed === true &&
    blueprintArtifact.blueprint_system_ready === true &&
    mvSceneAssemblies.every(
      (assembly) =>
        assembly.source_blueprint_ref === MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH &&
        assembly.traceability_chain.mv_blueprint_id.length > 0
    );

  const sceneAssemblyReady = mvSceneAssemblies.every(
    (assembly) => assembly.assembly_ready === 'PASS'
  );
  const sceneSequenceValid = mvSceneAssemblies.every(
    (assembly) =>
      assembly.scene_sequence.length > 0 &&
      assembly.scene_sequence.length === assembly.mv_scene_units.length
  );
  const sceneTransitionValid = mvSceneAssemblies.every(
    (assembly) =>
      assembly.scene_transitions.length === Math.max(assembly.scene_sequence.length - 1, 0) &&
      assembly.scene_transitions.every((transition) => transition.transition_valid)
  );
  const sceneDurationValid = mvSceneAssemblies.every(
    (assembly) => assembly.scene_duration_plan.plan_valid
  );
  const musicSectionRefValid = mvSceneAssemblies.every(
    (assembly) =>
      assembly.lyric_or_music_section_ref.length === assembly.mv_scene_units.length &&
      assembly.mv_scene_units.every((unit) => unit.lyric_or_music_section_ref.length > 0)
  );
  const continuityPreserved = mvSceneAssemblies.every((assembly) =>
    assembly.continuity_links.every((link) => link.continuity_preserved === 'PASS')
  );
  const musicSyncPreserved = mvSceneAssemblies.every((assembly) =>
    assembly.music_sync_links.every((link) => link.sync_preserved === 'PASS')
  );
  const emotionalProgressionPreserved = mvSceneAssemblies.every((assembly) =>
    assembly.emotional_progression_links.every((link) => link.progression_preserved === 'PASS')
  );
  const mvTypePreserved = mvSceneAssemblies.every(
    (assembly) => assembly.mv_type_preserved === true
  );
  const traceabilityPreserved =
    blueprintArtifact.traceability_preserved === true &&
    mvSceneAssemblies.every((assembly) => assembly.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    blueprintArtifact.safety_flags.production_mode_blocked === true;

  const assemblyWriteScopeValid = ASSEMBLY_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderAssemblyWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && assemblyWriteScopeValid;

  const sceneAssemblyComplete =
    blueprintConsumed &&
    sceneAssemblyReady &&
    sceneSequenceValid &&
    sceneTransitionValid &&
    sceneDurationValid &&
    musicSectionRefValid &&
    continuityPreserved &&
    musicSyncPreserved &&
    emotionalProgressionPreserved &&
    mvTypePreserved &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const blueprintMissing = !blueprintConsumed;
  const sceneSequenceInvalid = !sceneSequenceValid;
  const sceneTransitionInvalid = !sceneTransitionValid;
  const sceneDurationMissing = !sceneDurationValid;
  const musicSectionRefMissing = !musicSectionRefValid;
  const continuityLoss = !continuityPreserved;
  const musicSyncLoss = !musicSyncPreserved;
  const emotionalProgressionLoss = !emotionalProgressionPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (blueprintMissing) {
    issues.push({ code: 'BLUEPRINT_MISSING', message: 'Blueprint was not consumed', severity: 'error' });
  }
  if (sceneSequenceInvalid) {
    issues.push({
      code: 'SCENE_SEQUENCE_INVALID',
      message: 'Scene sequence is invalid',
      severity: 'error',
    });
  }
  if (sceneTransitionInvalid) {
    issues.push({
      code: 'SCENE_TRANSITION_INVALID',
      message: 'Scene transitions are invalid',
      severity: 'error',
    });
  }
  if (sceneDurationMissing) {
    issues.push({
      code: 'SCENE_DURATION_MISSING',
      message: 'Scene duration plan is missing or invalid',
      severity: 'error',
    });
  }
  if (musicSectionRefMissing) {
    issues.push({
      code: 'MUSIC_SECTION_REF_MISSING',
      message: 'Lyric or music section references are missing',
      severity: 'error',
    });
  }
  if (continuityLoss) {
    issues.push({ code: 'CONTINUITY_LOSS', message: 'Continuity links are not preserved', severity: 'error' });
  }
  if (musicSyncLoss) {
    issues.push({ code: 'MUSIC_SYNC_LOSS', message: 'Music sync links are not preserved', severity: 'error' });
  }
  if (emotionalProgressionLoss) {
    issues.push({
      code: 'EMOTIONAL_PROGRESSION_LOSS',
      message: 'Emotional progression links are not preserved',
      severity: 'error',
    });
  }
  if (mvTypeLoss) {
    issues.push({ code: 'MV_TYPE_LOSS', message: 'MV type was not preserved', severity: 'error' });
  }
  if (traceabilityLoss) {
    issues.push({
      code: 'TRACEABILITY_LOSS',
      message: 'Traceability chain is not preserved',
      severity: 'error',
    });
  }
  if (productionModeUnblocked) {
    issues.push({
      code: 'PRODUCTION_MODE_UNBLOCKED',
      message: 'Production mode is not blocked',
      severity: 'error',
    });
  }
  if (!safeCreatePolicyVerified) {
    issues.push({
      code: 'SAFE_CREATE_POLICY_VIOLATION',
      message: 'Safe create policy was violated',
      severity: 'error',
    });
  }

  const assemblyChecks: AssemblyCheck[] = [
    {
      check_id: 'blueprint_consumed',
      check_label: 'Blueprint Consumed',
      status: toStatus(blueprintConsumed),
    },
    {
      check_id: 'scene_assembly_ready',
      check_label: 'Scene Assembly Ready',
      status: toStatus(sceneAssemblyReady),
    },
    {
      check_id: 'scene_sequence_valid',
      check_label: 'Scene Sequence Valid',
      status: toStatus(sceneSequenceValid),
    },
    {
      check_id: 'scene_transition_valid',
      check_label: 'Scene Transition Valid',
      status: toStatus(sceneTransitionValid),
    },
    {
      check_id: 'scene_duration_valid',
      check_label: 'Scene Duration Valid',
      status: toStatus(sceneDurationValid),
    },
    {
      check_id: 'music_section_ref_valid',
      check_label: 'Music Section Ref Valid',
      status: toStatus(musicSectionRefValid),
    },
    {
      check_id: 'continuity_preserved',
      check_label: 'Continuity Preserved',
      status: toStatus(continuityPreserved),
    },
    {
      check_id: 'music_sync_preserved',
      check_label: 'Music Sync Preserved',
      status: toStatus(musicSyncPreserved),
    },
    {
      check_id: 'emotional_progression_preserved',
      check_label: 'Emotional Progression Preserved',
      status: toStatus(emotionalProgressionPreserved),
    },
    {
      check_id: 'mv_type_preserved',
      check_label: 'MV Type Preserved',
      status: toStatus(mvTypePreserved),
    },
    {
      check_id: 'traceability_preserved',
      check_label: 'Traceability Preserved',
      status: toStatus(traceabilityPreserved),
    },
    {
      check_id: 'production_mode_blocked',
      check_label: 'Production Mode Blocked',
      status: toStatus(productionModeBlocked),
    },
  ];

  const pass =
    sceneAssemblyComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvSceneAssemblyEngineArtifact = {
    engine_id: 'mv-scene-assembly-engine-v1',
    phase: MV_SCENE_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    source_blueprint_ref: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    blueprint_system_id: blueprintArtifact.blueprint_system_id,
    mv_scene_assemblies: mvSceneAssemblies,
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
      production_mode_blocked: true,
    },
    blueprint_consumed: blueprintConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      scene_assembly_artifact_write_scope: SCENE_ASSEMBLY_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    scene_assembly_complete: sceneAssemblyComplete,
  };

  const manifest: MvSceneAssemblyEngineManifest = {
    manifest_id: 'mv-scene-assembly-engine-manifest-v1',
    phase: MV_SCENE_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    assembly_count: MV_TYPE_COUNT,
    blueprint_consumed: toStatus(blueprintConsumed),
    scene_assembly_ready: toStatus(sceneAssemblyReady),
    scene_sequence_valid: toStatus(sceneSequenceValid),
    scene_transition_valid: toStatus(sceneTransitionValid),
    scene_duration_valid: toStatus(sceneDurationValid),
    music_section_ref_valid: toStatus(musicSectionRefValid),
    continuity_preserved: toStatus(continuityPreserved),
    music_sync_preserved: toStatus(musicSyncPreserved),
    emotional_progression_preserved: toStatus(emotionalProgressionPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_SCENE_ASSEMBLY_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvSceneAssemblyEngineReport = {
    report_id: 'mv-scene-assembly-engine-report-v1',
    phase: MV_SCENE_ASSEMBLY_ENGINE_PHASE,
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
    source_blueprint_ref: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    mv_production_blueprint_system_report_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
    mv_scene_assembly_engine_export_dir: MV_SCENE_ASSEMBLY_ENGINE_EXPORT_DIR,
    mv_scene_assembly_engine_manifest_path: MV_SCENE_ASSEMBLY_ENGINE_MANIFEST_PATH,
    mv_scene_assembly_engine_artifact_path: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    assembly_count: MV_TYPE_COUNT,
    blueprint_consumed: toStatus(blueprintConsumed),
    scene_assembly_ready: toStatus(sceneAssemblyReady),
    scene_sequence_valid: toStatus(sceneSequenceValid),
    scene_transition_valid: toStatus(sceneTransitionValid),
    scene_duration_valid: toStatus(sceneDurationValid),
    music_section_ref_valid: toStatus(musicSectionRefValid),
    continuity_preserved: toStatus(continuityPreserved),
    music_sync_preserved: toStatus(musicSyncPreserved),
    emotional_progression_preserved: toStatus(emotionalProgressionPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    blueprint_missing: blueprintMissing,
    scene_sequence_invalid: sceneSequenceInvalid,
    scene_transition_invalid: sceneTransitionInvalid,
    scene_duration_missing: sceneDurationMissing,
    music_section_ref_missing: musicSectionRefMissing,
    continuity_loss: continuityLoss,
    music_sync_loss: musicSyncLoss,
    emotional_progression_loss: emotionalProgressionLoss,
    mv_type_loss: mvTypeLoss,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_scene_assembly_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_SCENE_ASSEMBLY_READY_STATUS : null,
    mv_scene_assemblies: mvSceneAssemblies,
    assembly_checks: assemblyChecks,
    final_verdict: pass
      ? MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT
      : MV_SCENE_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_SCENE_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SCENE_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
