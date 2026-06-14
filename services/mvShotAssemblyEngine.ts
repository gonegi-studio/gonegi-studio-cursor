import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import { SHOTS_PER_SCENE } from './mvProductionBlueprintSystem.js';
import {
  MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SCENE_ASSEMBLY_READY_STATUS,
  type MvSceneAssembly,
  type MvSceneAssemblyEngineArtifact,
} from './mvSceneAssemblyEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_SHOT_ASSEMBLY_ENGINE_PHASE =
  'PHASE-DIGITAL-STUDIO-004-MV_SHOT_ASSEMBLY_ENGINE_V1' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT = 'PASS_MV_SHOT_ASSEMBLY_ENGINE_V1' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT = 'FAIL_MV_SHOT_ASSEMBLY_ENGINE_V1' as const;
export const MV_SHOT_ASSEMBLY_READY_STATUS = 'MV_SHOT_ASSEMBLY_READY' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_DIR = 'reports/mv_shot_assembly_engine' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH =
  'reports/mv_shot_assembly_engine/mv-shot-assembly-engine-report.json' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_MD_PATH =
  'reports/mv_shot_assembly_engine/MV_SHOT_ASSEMBLY_ENGINE.md' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR = 'exports/mv_shot_assembly_engine' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH =
  'exports/mv_shot_assembly_engine/mv-shot-assembly-engine-manifest.json' as const;
export const MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH =
  'exports/mv_shot_assembly_engine/mv-shot-assembly-engine.json' as const;

export const SHOT_ASSEMBLY_ARTIFACT_WRITE_SCOPE = 'exports/mv_shot_assembly_engine/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY, SHOTS_PER_SCENE };

export type ShotAssemblyStatus = 'PASS' | 'FAIL';

export type MvShotAssemblyEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type ShotAssemblyCheck = {
  check_id: string;
  check_label: string;
  status: ShotAssemblyStatus;
};

export type MvShotUnit = {
  shot_unit_id: string;
  shot_id: string;
  scene_ref: string;
  shot_order: number;
  shot_type: string;
  lyric_or_music_section_ref: string;
  visual_intent: string;
  emotion_beat_ref: string;
  generation_prompt_seed: string;
  mv_type: MvType;
  unit_ready: ShotAssemblyStatus;
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
  transition_valid: boolean;
};

export type CameraPlanEntry = {
  shot_ref: string;
  camera_motion: string;
  plan_valid: boolean;
};

export type CameraPlan = {
  plan_id: string;
  entries: CameraPlanEntry[];
  plan_valid: boolean;
};

export type CoveragePlanEntry = {
  shot_ref: string;
  coverage_ref: string;
  coverage_role: string;
  plan_valid: boolean;
};

export type CoveragePlan = {
  plan_id: string;
  entries: CoveragePlanEntry[];
  plan_valid: boolean;
};

export type ShotDurationEntry = {
  shot_ref: string;
  scene_ref: string;
  duration_seconds: number;
  duration_valid: boolean;
};

export type ShotDurationPlan = {
  plan_id: string;
  shot_durations: ShotDurationEntry[];
  plan_valid: boolean;
};

export type MvShotMusicSyncPlan = {
  sync_id: string;
  beat_markers: Array<{
    shot_ref: string;
    scene_ref: string;
    timestamp_seconds: number;
    sync_valid: boolean;
  }>;
  sync_valid: boolean;
};

export type MvShotAssemblyTraceability = {
  source_scene_assembly_ref: typeof MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_scene_assembly_id: string;
  mv_blueprint_id: string;
  mv_foundation_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: ShotAssemblyStatus;
};

export type MvShotAssembly = {
  mv_shot_assembly_id: string;
  source_scene_assembly_ref: typeof MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_type: MvType;
  mv_type_preserved: boolean;
  mv_shot_units: MvShotUnit[];
  shot_sequence: string[];
  shot_dependencies: ShotDependencyLink[];
  shot_transitions: ShotTransitionLink[];
  camera_plan: CameraPlan;
  coverage_plan: CoveragePlan;
  shot_duration_plan: ShotDurationPlan;
  music_sync_plan: MvShotMusicSyncPlan;
  lyric_or_music_section_ref: string[];
  traceability_chain: MvShotAssemblyTraceability;
  assembly_ready: ShotAssemblyStatus;
};

export type MvShotAssemblyEngineArtifact = {
  engine_id: string;
  phase: typeof MV_SHOT_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  source_scene_assembly_ref: typeof MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  scene_assembly_engine_id: string;
  mv_shot_assemblies: MvShotAssembly[];
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
  scene_assembly_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    shot_assembly_artifact_write_scope: typeof SHOT_ASSEMBLY_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  shot_assembly_complete: boolean;
};

export type MvShotAssemblyEngineManifest = {
  manifest_id: string;
  phase: typeof MV_SHOT_ASSEMBLY_ENGINE_PHASE;
  generated_at: string;
  assembly_count: typeof MV_TYPE_COUNT;
  scene_assembly_consumed: ShotAssemblyStatus;
  shot_assembly_ready: ShotAssemblyStatus;
  shot_sequence_valid: ShotAssemblyStatus;
  shot_transition_valid: ShotAssemblyStatus;
  camera_plan_valid: ShotAssemblyStatus;
  coverage_plan_valid: ShotAssemblyStatus;
  shot_duration_valid: ShotAssemblyStatus;
  music_sync_valid: ShotAssemblyStatus;
  visual_intent_present: ShotAssemblyStatus;
  emotion_beat_ref_valid: ShotAssemblyStatus;
  generation_prompt_seed_ready: ShotAssemblyStatus;
  mv_type_preserved: ShotAssemblyStatus;
  traceability_preserved: boolean;
  production_mode_blocked: ShotAssemblyStatus;
  certification_status: typeof MV_SHOT_ASSEMBLY_READY_STATUS | null;
};

export type MvShotAssemblyEngineReport = {
  report_id: string;
  phase: typeof MV_SHOT_ASSEMBLY_ENGINE_PHASE;
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
  source_scene_assembly_ref: typeof MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_scene_assembly_engine_report_path: typeof MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH;
  mv_shot_assembly_engine_export_dir: typeof MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR;
  mv_shot_assembly_engine_manifest_path: typeof MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH;
  mv_shot_assembly_engine_artifact_path: typeof MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  assembly_count: typeof MV_TYPE_COUNT;
  scene_assembly_consumed: ShotAssemblyStatus;
  shot_assembly_ready: ShotAssemblyStatus;
  shot_sequence_valid: ShotAssemblyStatus;
  shot_transition_valid: ShotAssemblyStatus;
  camera_plan_valid: ShotAssemblyStatus;
  coverage_plan_valid: ShotAssemblyStatus;
  shot_duration_valid: ShotAssemblyStatus;
  music_sync_valid: ShotAssemblyStatus;
  visual_intent_present: ShotAssemblyStatus;
  emotion_beat_ref_valid: ShotAssemblyStatus;
  generation_prompt_seed_ready: ShotAssemblyStatus;
  mv_type_preserved: ShotAssemblyStatus;
  traceability_preserved: boolean;
  production_mode_blocked: ShotAssemblyStatus;
  scene_assembly_missing: boolean;
  shot_sequence_invalid: boolean;
  shot_transition_invalid: boolean;
  camera_plan_missing: boolean;
  coverage_plan_missing: boolean;
  shot_duration_missing: boolean;
  music_sync_invalid: boolean;
  visual_intent_missing: boolean;
  emotion_beat_ref_missing: boolean;
  generation_prompt_seed_missing: boolean;
  mv_type_loss: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_shot_assembly_engine_ready: ShotAssemblyStatus;
  certification_status: typeof MV_SHOT_ASSEMBLY_READY_STATUS | null;
  mv_shot_assemblies: MvShotAssembly[];
  assembly_checks: ShotAssemblyCheck[];
  final_verdict:
    | typeof MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT
    | typeof MV_SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT;
  issues: MvShotAssemblyEngineIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const SHOT_TYPES = ['establishing', 'medium', 'detail'] as const;
const CAMERA_MOTIONS = ['camera_static', 'camera_pan', 'camera_push'] as const;
const COVERAGE_REFS = ['coverage_pattern_01', 'coverage_pattern_02', 'coverage_pattern_03'] as const;
const COVERAGE_ROLES = ['establishing_coverage', 'medium_coverage', 'detail_coverage'] as const;
const SHOT_TRANSITION_TYPES = ['cut', 'dissolve', 'match_cut'] as const;

const READ_ONLY_UPSTREAM_PATHS = [MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH] as const;

const SHOT_EXPORT_WRITE_PATHS = [
  MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_SHOT_ASSEMBLY_ENGINE_DIR,
  MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
  MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_MD_PATH,
  ...SHOT_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): ShotAssemblyStatus {
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

function isUnderShotAssemblyWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(SHOT_ASSEMBLY_ARTIFACT_WRITE_SCOPE) ||
    relativePath === SHOT_ASSEMBLY_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function visualIntentForShot(sceneGoal: string, shotType: string): string {
  return `${shotType}_visual_intent:${sceneGoal}`;
}

function emotionBeatRef(
  sceneAssembly: MvSceneAssembly,
  sceneId: string,
  shotOrder: number
): string {
  const progression = sceneAssembly.emotional_progression_links.find(
    (link) => link.scene_ref === sceneId
  );
  return `${progression?.emotional_state ?? 'neutral'}_beat_${shotOrder}`;
}

function generationPromptSeed(mvType: MvType, sceneId: string, shotId: string): string {
  return `${mvType}_${sceneId}_${shotId}_prompt_seed_v1`;
}

function buildShotAssembly(sceneAssembly: MvSceneAssembly): MvShotAssembly {
  const mvShotUnits: MvShotUnit[] = [];
  const shotSequence: string[] = [];
  const cameraEntries: CameraPlanEntry[] = [];
  const coverageEntries: CoveragePlanEntry[] = [];
  const shotDurationEntries: ShotDurationEntry[] = [];
  const musicBeatMarkers: MvShotMusicSyncPlan['beat_markers'] = [];
  const lyricOrMusicSectionRefs: string[] = [];

  let globalShotOrder = 0;

  for (const sceneUnit of sceneAssembly.mv_scene_units) {
    const sceneDurationEntry = sceneAssembly.scene_duration_plan.scene_durations.find(
      (entry) => entry.scene_ref === sceneUnit.scene_id
    );
    const sceneDuration = sceneDurationEntry?.duration_seconds ?? sceneUnit.duration_seconds;
    const shotDuration = Math.max(1, Math.floor(sceneDuration / SHOTS_PER_SCENE));

    const sceneSync = sceneAssembly.music_sync_links.find(
      (link) => link.scene_ref === sceneUnit.scene_id
    );
    const baseTimestamp = sceneSync?.timestamp_seconds ?? 0;

    for (let shotIndex = 0; shotIndex < SHOTS_PER_SCENE; shotIndex += 1) {
      globalShotOrder += 1;
      const shotId = `${sceneUnit.scene_id}_shot_${shotIndex + 1}`;
      const shotType = SHOT_TYPES[shotIndex] ?? 'detail';
      const cameraMotion = CAMERA_MOTIONS[shotIndex] ?? 'camera_static';
      const coverageRef = COVERAGE_REFS[shotIndex] ?? 'coverage_pattern_03';
      const coverageRole = COVERAGE_ROLES[shotIndex] ?? 'detail_coverage';

      mvShotUnits.push({
        shot_unit_id: `${shotId}_unit`,
        shot_id: shotId,
        scene_ref: sceneUnit.scene_id,
        shot_order: globalShotOrder,
        shot_type: shotType,
        lyric_or_music_section_ref: sceneUnit.lyric_or_music_section_ref,
        visual_intent: visualIntentForShot(sceneUnit.scene_goal, shotType),
        emotion_beat_ref: emotionBeatRef(sceneAssembly, sceneUnit.scene_id, shotIndex + 1),
        generation_prompt_seed: generationPromptSeed(sceneAssembly.mv_type, sceneUnit.scene_id, shotId),
        mv_type: sceneAssembly.mv_type,
        unit_ready:
          sceneUnit.unit_ready === 'PASS' && sceneUnit.mv_type === sceneAssembly.mv_type
            ? 'PASS'
            : 'FAIL',
      });

      shotSequence.push(shotId);
      lyricOrMusicSectionRefs.push(sceneUnit.lyric_or_music_section_ref);

      cameraEntries.push({
        shot_ref: shotId,
        camera_motion: cameraMotion,
        plan_valid: cameraMotion.length > 0,
      });

      coverageEntries.push({
        shot_ref: shotId,
        coverage_ref: coverageRef,
        coverage_role: coverageRole,
        plan_valid: coverageRef.length > 0,
      });

      shotDurationEntries.push({
        shot_ref: shotId,
        scene_ref: sceneUnit.scene_id,
        duration_seconds: shotDuration,
        duration_valid: shotDuration > 0,
      });

      musicBeatMarkers.push({
        shot_ref: shotId,
        scene_ref: sceneUnit.scene_id,
        timestamp_seconds: baseTimestamp + shotIndex * shotDuration,
        sync_valid: true,
      });
    }
  }

  const shotDependencies: ShotDependencyLink[] = shotSequence.map((shotId, index) => ({
    shot_id: shotId,
    depends_on: index === 0 ? [] : [shotSequence[index - 1]],
    required_by: index === shotSequence.length - 1 ? [] : [shotSequence[index + 1]],
  }));

  const shotTransitions: ShotTransitionLink[] = shotSequence.slice(0, -1).map((shotId, index) => ({
    from_shot_id: shotId,
    to_shot_id: shotSequence[index + 1],
    transition_type: SHOT_TRANSITION_TYPES[index % SHOT_TRANSITION_TYPES.length],
    transition_valid: true,
  }));

  const cameraPlan: CameraPlan = {
    plan_id: `${sceneAssembly.mv_type}_camera_plan_v1`,
    entries: cameraEntries,
    plan_valid: cameraEntries.length === shotSequence.length && cameraEntries.every((e) => e.plan_valid),
  };

  const coveragePlan: CoveragePlan = {
    plan_id: `${sceneAssembly.mv_type}_coverage_plan_v1`,
    entries: coverageEntries,
    plan_valid:
      coverageEntries.length === shotSequence.length && coverageEntries.every((e) => e.plan_valid),
  };

  const shotDurationPlan: ShotDurationPlan = {
    plan_id: `${sceneAssembly.mv_type}_shot_duration_plan_v1`,
    shot_durations: shotDurationEntries,
    plan_valid:
      shotDurationEntries.length === shotSequence.length &&
      shotDurationEntries.every((entry) => entry.duration_valid),
  };

  const musicSyncPlan: MvShotMusicSyncPlan = {
    sync_id: `${sceneAssembly.mv_type}_shot_music_sync_v1`,
    beat_markers: musicBeatMarkers,
    sync_valid:
      musicBeatMarkers.length === shotSequence.length &&
      musicBeatMarkers.every((marker) => marker.sync_valid),
  };

  const traceabilityChain: MvShotAssemblyTraceability = {
    source_scene_assembly_ref: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_scene_assembly_id: sceneAssembly.mv_scene_assembly_id,
    mv_blueprint_id: sceneAssembly.traceability_chain.mv_blueprint_id,
    mv_foundation_id: sceneAssembly.traceability_chain.mv_foundation_id,
    upstream_runtime_id: sceneAssembly.traceability_chain.upstream_runtime_id,
    dataset_refs: sceneAssembly.traceability_chain.dataset_refs,
    trace_integrity:
      sceneAssembly.traceability_chain.trace_integrity === 'PASS' ? 'PASS' : 'FAIL',
  };

  const mvTypePreserved =
    sceneAssembly.mv_type_preserved === true &&
    mvShotUnits.every((unit) => unit.mv_type === sceneAssembly.mv_type);

  const assemblyReady =
    mvTypePreserved &&
    mvShotUnits.every((unit) => unit.unit_ready === 'PASS') &&
    mvShotUnits.every((unit) => unit.visual_intent.length > 0) &&
    mvShotUnits.every((unit) => unit.emotion_beat_ref.length > 0) &&
    mvShotUnits.every((unit) => unit.generation_prompt_seed.length > 0) &&
    shotSequence.length === mvShotUnits.length &&
    shotTransitions.every((transition) => transition.transition_valid) &&
    cameraPlan.plan_valid &&
    coveragePlan.plan_valid &&
    shotDurationPlan.plan_valid &&
    musicSyncPlan.sync_valid &&
    traceabilityChain.trace_integrity === 'PASS';

  return {
    mv_shot_assembly_id: `${sceneAssembly.mv_type}_shot_assembly_v1`,
    source_scene_assembly_ref: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_type: sceneAssembly.mv_type,
    mv_type_preserved: mvTypePreserved,
    mv_shot_units: mvShotUnits,
    shot_sequence: shotSequence,
    shot_dependencies: shotDependencies,
    shot_transitions: shotTransitions,
    camera_plan: cameraPlan,
    coverage_plan: coveragePlan,
    shot_duration_plan: shotDurationPlan,
    music_sync_plan: musicSyncPlan,
    lyric_or_music_section_ref: lyricOrMusicSectionRefs,
    traceability_chain: traceabilityChain,
    assembly_ready: toStatus(assemblyReady),
  };
}

function buildMarkdown(report: MvShotAssemblyEngineReport): string {
  const lines = [
    '# MV Shot Assembly Engine',
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
    `**Source Scene Assembly:** ${report.source_scene_assembly_ref}`,
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| scene_assembly_consumed | ${report.scene_assembly_consumed} |`,
    `| shot_assembly_ready | ${report.shot_assembly_ready} |`,
    `| shot_sequence_valid | ${report.shot_sequence_valid} |`,
    `| shot_transition_valid | ${report.shot_transition_valid} |`,
    `| camera_plan_valid | ${report.camera_plan_valid} |`,
    `| coverage_plan_valid | ${report.coverage_plan_valid} |`,
    `| shot_duration_valid | ${report.shot_duration_valid} |`,
    `| music_sync_valid | ${report.music_sync_valid} |`,
    `| visual_intent_present | ${report.visual_intent_present} |`,
    `| emotion_beat_ref_valid | ${report.emotion_beat_ref_valid} |`,
    `| generation_prompt_seed_ready | ${report.generation_prompt_seed_ready} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## Shot Assemblies',
    ''
  );

  for (const assembly of report.mv_shot_assemblies) {
    lines.push(
      `- ${assembly.mv_shot_assembly_id} (${assembly.mv_type}): shots=${assembly.mv_shot_units.length} ready=${assembly.assembly_ready}`
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
  issues: MvShotAssemblyEngineIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvShotAssemblyEngineReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvShotAssemblyEngineReport = {
    report_id: 'mv-shot-assembly-engine-report-v1',
    phase: MV_SHOT_ASSEMBLY_ENGINE_PHASE,
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
    source_scene_assembly_ref: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_scene_assembly_engine_report_path: MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    mv_shot_assembly_engine_export_dir: MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
    mv_shot_assembly_engine_manifest_path: MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    mv_shot_assembly_engine_artifact_path: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    assembly_count: MV_TYPE_COUNT,
    scene_assembly_consumed: 'FAIL',
    shot_assembly_ready: 'FAIL',
    shot_sequence_valid: 'FAIL',
    shot_transition_valid: 'FAIL',
    camera_plan_valid: 'FAIL',
    coverage_plan_valid: 'FAIL',
    shot_duration_valid: 'FAIL',
    music_sync_valid: 'FAIL',
    visual_intent_present: 'FAIL',
    emotion_beat_ref_valid: 'FAIL',
    generation_prompt_seed_ready: 'FAIL',
    mv_type_preserved: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    scene_assembly_missing: true,
    shot_sequence_invalid: true,
    shot_transition_invalid: true,
    camera_plan_missing: true,
    coverage_plan_missing: true,
    shot_duration_missing: true,
    music_sync_invalid: true,
    visual_intent_missing: true,
    emotion_beat_ref_missing: true,
    generation_prompt_seed_missing: true,
    mv_type_loss: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_shot_assembly_engine_ready: 'FAIL',
    certification_status: null,
    mv_shot_assemblies: [],
    assembly_checks: [],
    final_verdict: MV_SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Scene assembly artifact was modified during shot assembly write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_SHOT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvShotAssemblyEngine(projectRoot?: string): MvShotAssemblyEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvShotAssemblyEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const sceneAssemblyReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_scene_assembly_engine_ready: ShotAssemblyStatus;
    scene_assembly_ready: ShotAssemblyStatus;
    traceability_preserved: boolean;
  }>(root, MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH);
  const sceneAssemblyArtifact = loadJson<MvSceneAssemblyEngineArtifact>(
    root,
    MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH
  );

  const sceneAssemblyPrecheckValid =
    sceneAssemblyReport !== null &&
    sceneAssemblyReport.final_verdict === MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT &&
    sceneAssemblyReport.certification_status === MV_SCENE_ASSEMBLY_READY_STATUS &&
    sceneAssemblyReport.mv_scene_assembly_engine_ready === 'PASS' &&
    sceneAssemblyReport.scene_assembly_ready === 'PASS' &&
    sceneAssemblyArtifact !== null &&
    sceneAssemblyArtifact.scene_assembly_complete === true;

  if (!sceneAssemblyPrecheckValid) {
    issues.push({
      code: 'SCENE_ASSEMBLY_PRECHECK_FAILED',
      message: `Required ${MV_SCENE_ASSEMBLY_ENGINE_PASS_VERDICT} with ${MV_SCENE_ASSEMBLY_READY_STATUS}`,
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

  const mvShotAssemblies = sceneAssemblyArtifact.mv_scene_assemblies.map((sceneAssembly) =>
    buildShotAssembly(sceneAssembly)
  );

  const sceneAssemblyConsumed =
    sceneAssemblyArtifact.blueprint_consumed === true &&
    sceneAssemblyArtifact.scene_assembly_complete === true &&
    mvShotAssemblies.every(
      (assembly) =>
        assembly.source_scene_assembly_ref === MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH &&
        assembly.traceability_chain.mv_scene_assembly_id.length > 0
    );

  const shotAssemblyReady = mvShotAssemblies.every((assembly) => assembly.assembly_ready === 'PASS');
  const shotSequenceValid = mvShotAssemblies.every(
    (assembly) =>
      assembly.shot_sequence.length > 0 &&
      assembly.shot_sequence.length === assembly.mv_shot_units.length
  );
  const shotTransitionValid = mvShotAssemblies.every(
    (assembly) =>
      assembly.shot_transitions.length === Math.max(assembly.shot_sequence.length - 1, 0) &&
      assembly.shot_transitions.every((transition) => transition.transition_valid)
  );
  const cameraPlanValid = mvShotAssemblies.every((assembly) => assembly.camera_plan.plan_valid);
  const coveragePlanValid = mvShotAssemblies.every((assembly) => assembly.coverage_plan.plan_valid);
  const shotDurationValid = mvShotAssemblies.every(
    (assembly) => assembly.shot_duration_plan.plan_valid
  );
  const musicSyncValid = mvShotAssemblies.every((assembly) => assembly.music_sync_plan.sync_valid);
  const visualIntentPresent = mvShotAssemblies.every((assembly) =>
    assembly.mv_shot_units.every((unit) => unit.visual_intent.length > 0)
  );
  const emotionBeatRefValid = mvShotAssemblies.every((assembly) =>
    assembly.mv_shot_units.every((unit) => unit.emotion_beat_ref.length > 0)
  );
  const generationPromptSeedReady = mvShotAssemblies.every((assembly) =>
    assembly.mv_shot_units.every((unit) => unit.generation_prompt_seed.length > 0)
  );
  const mvTypePreserved = mvShotAssemblies.every((assembly) => assembly.mv_type_preserved === true);
  const traceabilityPreserved =
    sceneAssemblyArtifact.traceability_preserved === true &&
    mvShotAssemblies.every((assembly) => assembly.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    sceneAssemblyArtifact.safety_flags.production_mode_blocked === true;

  const shotWriteScopeValid = SHOT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderShotAssemblyWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && shotWriteScopeValid;

  const shotAssemblyComplete =
    sceneAssemblyConsumed &&
    shotAssemblyReady &&
    shotSequenceValid &&
    shotTransitionValid &&
    cameraPlanValid &&
    coveragePlanValid &&
    shotDurationValid &&
    musicSyncValid &&
    visualIntentPresent &&
    emotionBeatRefValid &&
    generationPromptSeedReady &&
    mvTypePreserved &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const sceneAssemblyMissing = !sceneAssemblyConsumed;
  const shotSequenceInvalid = !shotSequenceValid;
  const shotTransitionInvalid = !shotTransitionValid;
  const cameraPlanMissing = !cameraPlanValid;
  const coveragePlanMissing = !coveragePlanValid;
  const shotDurationMissing = !shotDurationValid;
  const musicSyncInvalid = !musicSyncValid;
  const visualIntentMissing = !visualIntentPresent;
  const emotionBeatRefMissing = !emotionBeatRefValid;
  const generationPromptSeedMissing = !generationPromptSeedReady;
  const mvTypeLoss = !mvTypePreserved;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (sceneAssemblyMissing) {
    issues.push({
      code: 'SCENE_ASSEMBLY_MISSING',
      message: 'Scene assembly was not consumed',
      severity: 'error',
    });
  }
  if (shotSequenceInvalid) {
    issues.push({
      code: 'SHOT_SEQUENCE_INVALID',
      message: 'Shot sequence is invalid',
      severity: 'error',
    });
  }
  if (shotTransitionInvalid) {
    issues.push({
      code: 'SHOT_TRANSITION_INVALID',
      message: 'Shot transitions are invalid',
      severity: 'error',
    });
  }
  if (cameraPlanMissing) {
    issues.push({
      code: 'CAMERA_PLAN_MISSING',
      message: 'Camera plan is missing or invalid',
      severity: 'error',
    });
  }
  if (coveragePlanMissing) {
    issues.push({
      code: 'COVERAGE_PLAN_MISSING',
      message: 'Coverage plan is missing or invalid',
      severity: 'error',
    });
  }
  if (shotDurationMissing) {
    issues.push({
      code: 'SHOT_DURATION_MISSING',
      message: 'Shot duration plan is missing or invalid',
      severity: 'error',
    });
  }
  if (musicSyncInvalid) {
    issues.push({
      code: 'MUSIC_SYNC_INVALID',
      message: 'Music sync plan is invalid',
      severity: 'error',
    });
  }
  if (visualIntentMissing) {
    issues.push({
      code: 'VISUAL_INTENT_MISSING',
      message: 'Visual intent is missing from shot units',
      severity: 'error',
    });
  }
  if (emotionBeatRefMissing) {
    issues.push({
      code: 'EMOTION_BEAT_REF_MISSING',
      message: 'Emotion beat references are missing',
      severity: 'error',
    });
  }
  if (generationPromptSeedMissing) {
    issues.push({
      code: 'GENERATION_PROMPT_SEED_MISSING',
      message: 'Generation prompt seeds are missing',
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

  const assemblyChecks: ShotAssemblyCheck[] = [
    {
      check_id: 'scene_assembly_consumed',
      check_label: 'Scene Assembly Consumed',
      status: toStatus(sceneAssemblyConsumed),
    },
    {
      check_id: 'shot_assembly_ready',
      check_label: 'Shot Assembly Ready',
      status: toStatus(shotAssemblyReady),
    },
    {
      check_id: 'shot_sequence_valid',
      check_label: 'Shot Sequence Valid',
      status: toStatus(shotSequenceValid),
    },
    {
      check_id: 'shot_transition_valid',
      check_label: 'Shot Transition Valid',
      status: toStatus(shotTransitionValid),
    },
    {
      check_id: 'camera_plan_valid',
      check_label: 'Camera Plan Valid',
      status: toStatus(cameraPlanValid),
    },
    {
      check_id: 'coverage_plan_valid',
      check_label: 'Coverage Plan Valid',
      status: toStatus(coveragePlanValid),
    },
    {
      check_id: 'shot_duration_valid',
      check_label: 'Shot Duration Valid',
      status: toStatus(shotDurationValid),
    },
    {
      check_id: 'music_sync_valid',
      check_label: 'Music Sync Valid',
      status: toStatus(musicSyncValid),
    },
    {
      check_id: 'visual_intent_present',
      check_label: 'Visual Intent Present',
      status: toStatus(visualIntentPresent),
    },
    {
      check_id: 'emotion_beat_ref_valid',
      check_label: 'Emotion Beat Ref Valid',
      status: toStatus(emotionBeatRefValid),
    },
    {
      check_id: 'generation_prompt_seed_ready',
      check_label: 'Generation Prompt Seed Ready',
      status: toStatus(generationPromptSeedReady),
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
    shotAssemblyComplete && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvShotAssemblyEngineArtifact = {
    engine_id: 'mv-shot-assembly-engine-v1',
    phase: MV_SHOT_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    source_scene_assembly_ref: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    scene_assembly_engine_id: sceneAssemblyArtifact.engine_id,
    mv_shot_assemblies: mvShotAssemblies,
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
    scene_assembly_consumed: sceneAssemblyConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      shot_assembly_artifact_write_scope: SHOT_ASSEMBLY_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    shot_assembly_complete: shotAssemblyComplete,
  };

  const manifest: MvShotAssemblyEngineManifest = {
    manifest_id: 'mv-shot-assembly-engine-manifest-v1',
    phase: MV_SHOT_ASSEMBLY_ENGINE_PHASE,
    generated_at: timestamp,
    assembly_count: MV_TYPE_COUNT,
    scene_assembly_consumed: toStatus(sceneAssemblyConsumed),
    shot_assembly_ready: toStatus(shotAssemblyReady),
    shot_sequence_valid: toStatus(shotSequenceValid),
    shot_transition_valid: toStatus(shotTransitionValid),
    camera_plan_valid: toStatus(cameraPlanValid),
    coverage_plan_valid: toStatus(coveragePlanValid),
    shot_duration_valid: toStatus(shotDurationValid),
    music_sync_valid: toStatus(musicSyncValid),
    visual_intent_present: toStatus(visualIntentPresent),
    emotion_beat_ref_valid: toStatus(emotionBeatRefValid),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_SHOT_ASSEMBLY_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvShotAssemblyEngineReport = {
    report_id: 'mv-shot-assembly-engine-report-v1',
    phase: MV_SHOT_ASSEMBLY_ENGINE_PHASE,
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
    source_scene_assembly_ref: MV_SCENE_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_scene_assembly_engine_report_path: MV_SCENE_ASSEMBLY_ENGINE_REPORT_PATH,
    mv_shot_assembly_engine_export_dir: MV_SHOT_ASSEMBLY_ENGINE_EXPORT_DIR,
    mv_shot_assembly_engine_manifest_path: MV_SHOT_ASSEMBLY_ENGINE_MANIFEST_PATH,
    mv_shot_assembly_engine_artifact_path: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    assembly_count: MV_TYPE_COUNT,
    scene_assembly_consumed: toStatus(sceneAssemblyConsumed),
    shot_assembly_ready: toStatus(shotAssemblyReady),
    shot_sequence_valid: toStatus(shotSequenceValid),
    shot_transition_valid: toStatus(shotTransitionValid),
    camera_plan_valid: toStatus(cameraPlanValid),
    coverage_plan_valid: toStatus(coveragePlanValid),
    shot_duration_valid: toStatus(shotDurationValid),
    music_sync_valid: toStatus(musicSyncValid),
    visual_intent_present: toStatus(visualIntentPresent),
    emotion_beat_ref_valid: toStatus(emotionBeatRefValid),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    mv_type_preserved: toStatus(mvTypePreserved),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    scene_assembly_missing: sceneAssemblyMissing,
    shot_sequence_invalid: shotSequenceInvalid,
    shot_transition_invalid: shotTransitionInvalid,
    camera_plan_missing: cameraPlanMissing,
    coverage_plan_missing: coveragePlanMissing,
    shot_duration_missing: shotDurationMissing,
    music_sync_invalid: musicSyncInvalid,
    visual_intent_missing: visualIntentMissing,
    emotion_beat_ref_missing: emotionBeatRefMissing,
    generation_prompt_seed_missing: generationPromptSeedMissing,
    mv_type_loss: mvTypeLoss,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_shot_assembly_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_SHOT_ASSEMBLY_READY_STATUS : null,
    mv_shot_assemblies: mvShotAssemblies,
    assembly_checks: assemblyChecks,
    final_verdict: pass
      ? MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT
      : MV_SHOT_ASSEMBLY_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_SHOT_ASSEMBLY_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_SHOT_ASSEMBLY_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
