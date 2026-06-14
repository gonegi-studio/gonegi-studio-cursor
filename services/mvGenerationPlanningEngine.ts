import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
  MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT,
  MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
  MV_SHOT_ASSEMBLY_READY_STATUS,
  type MvShotAssembly,
  type MvShotAssemblyEngineArtifact,
  type MvShotUnit,
} from './mvShotAssemblyEngine.js';
import {
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_GENERATION_PLANNING_ENGINE_PHASE =
  'PHASE-DIGITAL-STUDIO-005-MV_GENERATION_PLANNING_ENGINE_V1' as const;
export const MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT =
  'PASS_MV_GENERATION_PLANNING_ENGINE_V1' as const;
export const MV_GENERATION_PLANNING_ENGINE_FAIL_VERDICT =
  'FAIL_MV_GENERATION_PLANNING_ENGINE_V1' as const;
export const MV_GENERATION_PLANNING_READY_STATUS = 'MV_GENERATION_PLANNING_READY' as const;
export const MV_GENERATION_PLANNING_ENGINE_DIR =
  'reports/mv_generation_planning_engine' as const;
export const MV_GENERATION_PLANNING_ENGINE_REPORT_PATH =
  'reports/mv_generation_planning_engine/mv-generation-planning-engine-report.json' as const;
export const MV_GENERATION_PLANNING_ENGINE_MD_PATH =
  'reports/mv_generation_planning_engine/MV_GENERATION_PLANNING_ENGINE.md' as const;
export const MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR =
  'exports/mv_generation_planning_engine' as const;
export const MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH =
  'exports/mv_generation_planning_engine/mv-generation-planning-engine-manifest.json' as const;
export const MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH =
  'exports/mv_generation_planning_engine/mv-generation-planning-engine.json' as const;

export const GENERATION_PLANNING_ARTIFACT_WRITE_SCOPE =
  'exports/mv_generation_planning_engine/' as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type PlanningStatus = 'PASS' | 'FAIL';

export type MvGenerationPlanningEngineIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type PlanningCheck = {
  check_id: string;
  check_label: string;
  status: PlanningStatus;
};

export type MvGenerationUnit = {
  unit_id: string;
  shot_id: string;
  scene_ref: string;
  generation_prompt_seed: string;
  visual_intent: string;
  emotion_beat_ref: string;
  lyric_or_music_section_ref: string;
  adapter_requirements: string[];
  image_target: string;
  video_target: string;
  consistency_target: string;
  music_sync_ref: string;
  unit_ready: PlanningStatus;
};

export type ImageGenerationPlan = {
  plan_id: string;
  target_count: number;
  image_targets: string[];
  planning_only: true;
  plan_valid: boolean;
};

export type VideoGenerationPlan = {
  plan_id: string;
  target_count: number;
  video_targets: string[];
  planning_only: true;
  plan_valid: boolean;
};

export type ConsistencyPlanEntry = {
  unit_id: string;
  shot_id: string;
  consistency_target: string;
  continuity_preserved: PlanningStatus;
};

export type ConsistencyPlan = {
  plan_id: string;
  entry_count: number;
  entries: ConsistencyPlanEntry[];
  plan_valid: boolean;
};

export type QualityGateEntry = {
  unit_id: string;
  shot_id: string;
  gate_id: string;
  gate_label: string;
  gate_passed: PlanningStatus;
};

export type QualityGatePlan = {
  plan_id: string;
  entry_count: number;
  entries: QualityGateEntry[];
  plan_valid: boolean;
};

export type MvGenerationMusicSyncPlan = {
  sync_id: string;
  beat_markers: Array<{
    shot_ref: string;
    scene_ref: string;
    timestamp_seconds: number;
    sync_preserved: PlanningStatus;
  }>;
  sync_valid: boolean;
};

export type MvGenerationPlanTraceability = {
  source_shot_assembly_ref: typeof MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_shot_assembly_id: string;
  mv_scene_assembly_id: string;
  mv_blueprint_id: string;
  mv_foundation_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: PlanningStatus;
};

export type MvGenerationPlan = {
  generation_plan_id: string;
  source_shot_assembly_ref: typeof MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_type: MvType;
  mv_type_preserved: boolean;
  generation_units: MvGenerationUnit[];
  image_generation_plan: ImageGenerationPlan;
  video_generation_plan: VideoGenerationPlan;
  consistency_plan: ConsistencyPlan;
  quality_gate_plan: QualityGatePlan;
  adapter_requirements: string[];
  music_sync_plan: MvGenerationMusicSyncPlan;
  lyric_or_music_section_ref: string[];
  visual_intent: string[];
  emotion_beat_ref: string[];
  generation_prompt_seed: string[];
  traceability_chain: MvGenerationPlanTraceability;
  generation_plan_ready: PlanningStatus;
};

export type MvGenerationPlanningEngineArtifact = {
  engine_id: string;
  phase: typeof MV_GENERATION_PLANNING_ENGINE_PHASE;
  generated_at: string;
  source_shot_assembly_ref: typeof MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  shot_assembly_engine_id: string;
  generation_plans: MvGenerationPlan[];
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
  shot_assembly_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    generation_planning_artifact_write_scope: typeof GENERATION_PLANNING_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  generation_planning_complete: boolean;
};

export type MvGenerationPlanningEngineManifest = {
  manifest_id: string;
  phase: typeof MV_GENERATION_PLANNING_ENGINE_PHASE;
  generated_at: string;
  generation_plan_count: typeof MV_TYPE_COUNT;
  shot_assembly_consumed: PlanningStatus;
  generation_plan_ready: PlanningStatus;
  image_generation_plan_valid: PlanningStatus;
  video_generation_plan_valid: PlanningStatus;
  consistency_plan_valid: PlanningStatus;
  quality_gate_valid: PlanningStatus;
  music_sync_preserved: PlanningStatus;
  mv_type_preserved: PlanningStatus;
  generation_prompt_seed_ready: PlanningStatus;
  adapter_requirements_valid: PlanningStatus;
  traceability_preserved: boolean;
  production_mode_blocked: PlanningStatus;
  certification_status: typeof MV_GENERATION_PLANNING_READY_STATUS | null;
};

export type MvGenerationPlanningEngineReport = {
  report_id: string;
  phase: typeof MV_GENERATION_PLANNING_ENGINE_PHASE;
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
  source_shot_assembly_ref: typeof MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH;
  mv_shot_assembly_engine_report_path: typeof MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH;
  mv_generation_planning_engine_export_dir: typeof MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR;
  mv_generation_planning_engine_manifest_path: typeof MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH;
  mv_generation_planning_engine_artifact_path: typeof MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  generation_plan_count: typeof MV_TYPE_COUNT;
  shot_assembly_consumed: PlanningStatus;
  generation_plan_ready: PlanningStatus;
  image_generation_plan_valid: PlanningStatus;
  video_generation_plan_valid: PlanningStatus;
  consistency_plan_valid: PlanningStatus;
  quality_gate_valid: PlanningStatus;
  music_sync_preserved: PlanningStatus;
  mv_type_preserved: PlanningStatus;
  generation_prompt_seed_ready: PlanningStatus;
  adapter_requirements_valid: PlanningStatus;
  traceability_preserved: boolean;
  production_mode_blocked: PlanningStatus;
  shot_assembly_missing: boolean;
  generation_plan_invalid: boolean;
  image_generation_plan_missing: boolean;
  video_generation_plan_missing: boolean;
  consistency_plan_missing: boolean;
  quality_gate_missing: boolean;
  music_sync_loss: boolean;
  mv_type_loss: boolean;
  generation_prompt_seed_missing: boolean;
  adapter_requirements_missing: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_generation_planning_engine_ready: PlanningStatus;
  certification_status: typeof MV_GENERATION_PLANNING_READY_STATUS | null;
  generation_plans: MvGenerationPlan[];
  planning_checks: PlanningCheck[];
  final_verdict:
    | typeof MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT
    | typeof MV_GENERATION_PLANNING_ENGINE_FAIL_VERDICT;
  issues: MvGenerationPlanningEngineIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

const MV_ADAPTER_REQUIREMENTS: Record<MvType, string[]> = {
  instrumental_mv: [
    'instrumental_mv_image_adapter',
    'shot_grammar_adapter',
    'lighting_anchor_adapter',
    'emotion_acting_adapter',
  ],
  ballad_mv: [
    'ballad_mv_image_adapter',
    'instrumental_mv_image_adapter',
    'shot_grammar_adapter',
    'emotion_acting_adapter',
  ],
  story_mv: [
    'shot_grammar_adapter',
    'emotion_acting_adapter',
    'lighting_anchor_adapter',
    'indoor_location_anchor_adapter',
  ],
  music_drama_mv: [
    'music_drama_image_adapter',
    'shot_grammar_adapter',
    'emotion_acting_adapter',
    'lighting_anchor_adapter',
  ],
};

const READ_ONLY_UPSTREAM_PATHS = [MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH] as const;

const PLANNING_EXPORT_WRITE_PATHS = [
  MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
  MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_GENERATION_PLANNING_ENGINE_DIR,
  MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR,
  MV_GENERATION_PLANNING_ENGINE_REPORT_PATH,
  MV_GENERATION_PLANNING_ENGINE_MD_PATH,
  ...PLANNING_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): PlanningStatus {
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

function isUnderPlanningWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(GENERATION_PLANNING_ARTIFACT_WRITE_SCOPE) ||
    relativePath === GENERATION_PLANNING_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function imageTargetForShot(mvType: MvType, shot: MvShotUnit): string {
  return `mock_image_${mvType}_${shot.shot_id}`;
}

function videoTargetForShot(mvType: MvType, shot: MvShotUnit): string {
  return `mock_video_${mvType}_${shot.shot_id}`;
}

function consistencyTargetForShot(shotAssembly: MvShotAssembly, shotId: string): string {
  const coverage = shotAssembly.coverage_plan.entries.find((entry) => entry.shot_ref === shotId);
  return coverage
    ? `${shotId}_${coverage.coverage_role}_consistency`
    : `${shotId}_continuity_hold`;
}

function musicSyncRefForShot(shotAssembly: MvShotAssembly, shotId: string): string {
  const marker = shotAssembly.music_sync_plan.beat_markers.find(
    (entry) => entry.shot_ref === shotId
  );
  return marker ? `${shotAssembly.mv_type}_sync_${marker.timestamp_seconds}s` : `${shotId}_sync`;
}

function buildGenerationUnit(
  shotAssembly: MvShotAssembly,
  shot: MvShotUnit,
  index: number
): MvGenerationUnit {
  const adapterRequirements = MV_ADAPTER_REQUIREMENTS[shotAssembly.mv_type];
  const imageTarget = imageTargetForShot(shotAssembly.mv_type, shot);
  const videoTarget = videoTargetForShot(shotAssembly.mv_type, shot);
  const consistencyTarget = consistencyTargetForShot(shotAssembly, shot.shot_id);
  const musicSyncRef = musicSyncRefForShot(shotAssembly, shot.shot_id);

  const unitReady =
    shot.unit_ready === 'PASS' &&
    shot.mv_type === shotAssembly.mv_type &&
    shot.generation_prompt_seed.length > 0 &&
    shot.visual_intent.length > 0 &&
    shot.emotion_beat_ref.length > 0 &&
    shot.lyric_or_music_section_ref.length > 0 &&
    adapterRequirements.length > 0 &&
    imageTarget.length > 0 &&
    videoTarget.length > 0 &&
    consistencyTarget.length > 0;

  return {
    unit_id: `mv_generation_unit_${shotAssembly.mv_type}_${index + 1}`,
    shot_id: shot.shot_id,
    scene_ref: shot.scene_ref,
    generation_prompt_seed: shot.generation_prompt_seed,
    visual_intent: shot.visual_intent,
    emotion_beat_ref: shot.emotion_beat_ref,
    lyric_or_music_section_ref: shot.lyric_or_music_section_ref,
    adapter_requirements: adapterRequirements,
    image_target: imageTarget,
    video_target: videoTarget,
    consistency_target: consistencyTarget,
    music_sync_ref: musicSyncRef,
    unit_ready: toStatus(unitReady),
  };
}

function buildQualityGates(unit: MvGenerationUnit): QualityGateEntry[] {
  return [
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-PROMPT-SEED',
      gate_label: 'Prompt Seed Present',
      gate_passed: toStatus(unit.generation_prompt_seed.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-ADAPTER-BINDING',
      gate_label: 'Adapter Binding Present',
      gate_passed: toStatus(unit.adapter_requirements.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-CONSISTENCY-TARGET',
      gate_label: 'Consistency Target Present',
      gate_passed: toStatus(unit.consistency_target.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-MUSIC-SYNC',
      gate_label: 'Music Sync Ref Present',
      gate_passed: toStatus(unit.music_sync_ref.length > 0),
    },
    {
      unit_id: unit.unit_id,
      shot_id: unit.shot_id,
      gate_id: 'GATE-PLANNING-ONLY',
      gate_label: 'Planning Only (No Execution)',
      gate_passed: 'PASS',
    },
  ];
}

function buildGenerationPlan(shotAssembly: MvShotAssembly): MvGenerationPlan {
  const generationUnits = shotAssembly.mv_shot_units.map((shot, index) =>
    buildGenerationUnit(shotAssembly, shot, index)
  );

  const consistencyEntries: ConsistencyPlanEntry[] = generationUnits.map((unit) => ({
    unit_id: unit.unit_id,
    shot_id: unit.shot_id,
    consistency_target: unit.consistency_target,
    continuity_preserved: toStatus(unit.consistency_target.length > 0),
  }));

  const qualityEntries = generationUnits.flatMap((unit) => buildQualityGates(unit));

  const imageTargets = generationUnits.map((unit) => unit.image_target);
  const videoTargets = generationUnits.map((unit) => unit.video_target);

  const imagePlanValid = imageTargets.length > 0;
  const videoPlanValid = videoTargets.length > 0;
  const consistencyPlanValid = consistencyEntries.every(
    (entry) => entry.continuity_preserved === 'PASS'
  );
  const qualityGateValid = qualityEntries.every((entry) => entry.gate_passed === 'PASS');

  const musicSyncPlan: MvGenerationMusicSyncPlan = {
    sync_id: `${shotAssembly.mv_type}_generation_music_sync_v1`,
    beat_markers: shotAssembly.music_sync_plan.beat_markers.map((marker) => ({
      shot_ref: marker.shot_ref,
      scene_ref: marker.scene_ref,
      timestamp_seconds: marker.timestamp_seconds,
      sync_preserved: marker.sync_valid ? 'PASS' : 'FAIL',
    })),
    sync_valid:
      shotAssembly.music_sync_plan.sync_valid &&
      shotAssembly.music_sync_plan.beat_markers.length > 0,
  };

  const lyricOrMusicSectionRefs = generationUnits.map((unit) => unit.lyric_or_music_section_ref);
  const visualIntents = generationUnits.map((unit) => unit.visual_intent);
  const emotionBeatRefs = generationUnits.map((unit) => unit.emotion_beat_ref);
  const generationPromptSeeds = generationUnits.map((unit) => unit.generation_prompt_seed);
  const adapterRequirements = MV_ADAPTER_REQUIREMENTS[shotAssembly.mv_type];

  const traceabilityChain: MvGenerationPlanTraceability = {
    source_shot_assembly_ref: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_shot_assembly_id: shotAssembly.mv_shot_assembly_id,
    mv_scene_assembly_id: shotAssembly.traceability_chain.mv_scene_assembly_id,
    mv_blueprint_id: shotAssembly.traceability_chain.mv_blueprint_id,
    mv_foundation_id: shotAssembly.traceability_chain.mv_foundation_id,
    upstream_runtime_id: shotAssembly.traceability_chain.upstream_runtime_id,
    dataset_refs: shotAssembly.traceability_chain.dataset_refs,
    trace_integrity:
      shotAssembly.traceability_chain.trace_integrity === 'PASS' ? 'PASS' : 'FAIL',
  };

  const mvTypePreserved =
    shotAssembly.mv_type_preserved === true &&
    generationUnits.every((unit) => unit.unit_ready === 'PASS');

  const generationPlanReady =
    mvTypePreserved &&
    generationUnits.length === shotAssembly.mv_shot_units.length &&
    imagePlanValid &&
    videoPlanValid &&
    consistencyPlanValid &&
    qualityGateValid &&
    musicSyncPlan.sync_valid &&
    generationPromptSeeds.every((seed) => seed.length > 0) &&
    adapterRequirements.length > 0 &&
    traceabilityChain.trace_integrity === 'PASS';

  return {
    generation_plan_id: `${shotAssembly.mv_type}_generation_plan_v1`,
    source_shot_assembly_ref: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_type: shotAssembly.mv_type,
    mv_type_preserved: mvTypePreserved,
    generation_units: generationUnits,
    image_generation_plan: {
      plan_id: `${shotAssembly.mv_type}_image_generation_plan_v1`,
      target_count: imageTargets.length,
      image_targets: imageTargets,
      planning_only: true,
      plan_valid: imagePlanValid,
    },
    video_generation_plan: {
      plan_id: `${shotAssembly.mv_type}_video_generation_plan_v1`,
      target_count: videoTargets.length,
      video_targets: videoTargets,
      planning_only: true,
      plan_valid: videoPlanValid,
    },
    consistency_plan: {
      plan_id: `${shotAssembly.mv_type}_consistency_plan_v1`,
      entry_count: consistencyEntries.length,
      entries: consistencyEntries,
      plan_valid: consistencyPlanValid,
    },
    quality_gate_plan: {
      plan_id: `${shotAssembly.mv_type}_quality_gate_plan_v1`,
      entry_count: qualityEntries.length,
      entries: qualityEntries,
      plan_valid: qualityGateValid,
    },
    adapter_requirements: adapterRequirements,
    music_sync_plan: musicSyncPlan,
    lyric_or_music_section_ref: lyricOrMusicSectionRefs,
    visual_intent: visualIntents,
    emotion_beat_ref: emotionBeatRefs,
    generation_prompt_seed: generationPromptSeeds,
    traceability_chain: traceabilityChain,
    generation_plan_ready: toStatus(generationPlanReady),
  };
}

function buildMarkdown(report: MvGenerationPlanningEngineReport): string {
  const lines = [
    '# MV Generation Planning Engine',
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
    `**Source Shot Assembly:** ${report.source_shot_assembly_ref}`,
    '',
    '## Flow',
    '',
    'Shot Assembly → Generation Planning → Image + Video + Consistency + Quality Gate Planning',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| shot_assembly_consumed | ${report.shot_assembly_consumed} |`,
    `| generation_plan_ready | ${report.generation_plan_ready} |`,
    `| image_generation_plan_valid | ${report.image_generation_plan_valid} |`,
    `| video_generation_plan_valid | ${report.video_generation_plan_valid} |`,
    `| consistency_plan_valid | ${report.consistency_plan_valid} |`,
    `| quality_gate_valid | ${report.quality_gate_valid} |`,
    `| music_sync_preserved | ${report.music_sync_preserved} |`,
    `| mv_type_preserved | ${report.mv_type_preserved} |`,
    `| generation_prompt_seed_ready | ${report.generation_prompt_seed_ready} |`,
    `| adapter_requirements_valid | ${report.adapter_requirements_valid} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## Generation Plans',
    ''
  );

  for (const plan of report.generation_plans) {
    lines.push(
      `- ${plan.generation_plan_id} (${plan.mv_type}): units=${plan.generation_units.length} images=${plan.image_generation_plan.target_count} videos=${plan.video_generation_plan.target_count} ready=${plan.generation_plan_ready}`
    );
  }

  lines.push('', '## Planning Checks', '');
  for (const check of report.planning_checks) {
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
  issues: MvGenerationPlanningEngineIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvGenerationPlanningEngineReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvGenerationPlanningEngineReport = {
    report_id: 'mv-generation-planning-engine-report-v1',
    phase: MV_GENERATION_PLANNING_ENGINE_PHASE,
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
    source_shot_assembly_ref: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_shot_assembly_engine_report_path: MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    mv_generation_planning_engine_export_dir: MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR,
    mv_generation_planning_engine_manifest_path: MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    mv_generation_planning_engine_artifact_path: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    generation_plan_count: MV_TYPE_COUNT,
    shot_assembly_consumed: 'FAIL',
    generation_plan_ready: 'FAIL',
    image_generation_plan_valid: 'FAIL',
    video_generation_plan_valid: 'FAIL',
    consistency_plan_valid: 'FAIL',
    quality_gate_valid: 'FAIL',
    music_sync_preserved: 'FAIL',
    mv_type_preserved: 'FAIL',
    generation_prompt_seed_ready: 'FAIL',
    adapter_requirements_valid: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    shot_assembly_missing: true,
    generation_plan_invalid: true,
    image_generation_plan_missing: true,
    video_generation_plan_missing: true,
    consistency_plan_missing: true,
    quality_gate_missing: true,
    music_sync_loss: true,
    mv_type_loss: true,
    generation_prompt_seed_missing: true,
    adapter_requirements_missing: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_generation_planning_engine_ready: 'FAIL',
    certification_status: null,
    generation_plans: [],
    planning_checks: [],
    final_verdict: MV_GENERATION_PLANNING_ENGINE_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Shot assembly artifact was modified during generation planning write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_GENERATION_PLANNING_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvGenerationPlanningEngine(
  projectRoot?: string
): MvGenerationPlanningEngineReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvGenerationPlanningEngineIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const shotAssemblyReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_shot_assembly_engine_ready: PlanningStatus;
    shot_assembly_ready: PlanningStatus;
    traceability_preserved: boolean;
  }>(root, MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH);
  const shotAssemblyArtifact = loadJson<MvShotAssemblyEngineArtifact>(
    root,
    MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH
  );

  const shotAssemblyPrecheckValid =
    shotAssemblyReport !== null &&
    shotAssemblyReport.final_verdict === MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT &&
    shotAssemblyReport.certification_status === MV_SHOT_ASSEMBLY_READY_STATUS &&
    shotAssemblyReport.mv_shot_assembly_engine_ready === 'PASS' &&
    shotAssemblyReport.shot_assembly_ready === 'PASS' &&
    shotAssemblyArtifact !== null &&
    shotAssemblyArtifact.shot_assembly_complete === true;

  if (!shotAssemblyPrecheckValid) {
    issues.push({
      code: 'SHOT_ASSEMBLY_PRECHECK_FAILED',
      message: `Required ${MV_SHOT_ASSEMBLY_ENGINE_PASS_VERDICT} with ${MV_SHOT_ASSEMBLY_READY_STATUS}`,
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

  const generationPlans = shotAssemblyArtifact.mv_shot_assemblies.map((shotAssembly) =>
    buildGenerationPlan(shotAssembly)
  );

  const shotAssemblyConsumed =
    shotAssemblyArtifact.scene_assembly_consumed === true &&
    shotAssemblyArtifact.shot_assembly_complete === true &&
    generationPlans.every(
      (plan) =>
        plan.source_shot_assembly_ref === MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH &&
        plan.traceability_chain.mv_shot_assembly_id.length > 0
    );

  const generationPlanReady = generationPlans.every(
    (plan) => plan.generation_plan_ready === 'PASS'
  );
  const imageGenerationPlanValid = generationPlans.every(
    (plan) => plan.image_generation_plan.plan_valid
  );
  const videoGenerationPlanValid = generationPlans.every(
    (plan) => plan.video_generation_plan.plan_valid
  );
  const consistencyPlanValid = generationPlans.every((plan) => plan.consistency_plan.plan_valid);
  const qualityGateValid = generationPlans.every((plan) => plan.quality_gate_plan.plan_valid);
  const musicSyncPreserved = generationPlans.every((plan) => plan.music_sync_plan.sync_valid);
  const mvTypePreserved = generationPlans.every((plan) => plan.mv_type_preserved === true);
  const generationPromptSeedReady = generationPlans.every((plan) =>
    plan.generation_prompt_seed.every((seed) => seed.length > 0)
  );
  const adapterRequirementsValid = generationPlans.every(
    (plan) => plan.adapter_requirements.length > 0
  );
  const traceabilityPreserved =
    shotAssemblyArtifact.traceability_preserved === true &&
    generationPlans.every((plan) => plan.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    shotAssemblyArtifact.safety_flags.production_mode_blocked === true;

  const planningWriteScopeValid = PLANNING_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderPlanningWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && planningWriteScopeValid;

  const generationPlanningComplete =
    shotAssemblyConsumed &&
    generationPlanReady &&
    imageGenerationPlanValid &&
    videoGenerationPlanValid &&
    consistencyPlanValid &&
    qualityGateValid &&
    musicSyncPreserved &&
    mvTypePreserved &&
    generationPromptSeedReady &&
    adapterRequirementsValid &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const shotAssemblyMissing = !shotAssemblyConsumed;
  const generationPlanInvalid = !generationPlanReady;
  const imageGenerationPlanMissing = !imageGenerationPlanValid;
  const videoGenerationPlanMissing = !videoGenerationPlanValid;
  const consistencyPlanMissing = !consistencyPlanValid;
  const qualityGateMissing = !qualityGateValid;
  const musicSyncLoss = !musicSyncPreserved;
  const mvTypeLoss = !mvTypePreserved;
  const generationPromptSeedMissing = !generationPromptSeedReady;
  const adapterRequirementsMissing = !adapterRequirementsValid;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (shotAssemblyMissing) {
    issues.push({
      code: 'SHOT_ASSEMBLY_MISSING',
      message: 'Shot assembly was not consumed',
      severity: 'error',
    });
  }
  if (generationPlanInvalid) {
    issues.push({
      code: 'GENERATION_PLAN_INVALID',
      message: 'Generation plan is invalid or incomplete',
      severity: 'error',
    });
  }
  if (imageGenerationPlanMissing) {
    issues.push({
      code: 'IMAGE_GENERATION_PLAN_MISSING',
      message: 'Image generation plan is missing or invalid',
      severity: 'error',
    });
  }
  if (videoGenerationPlanMissing) {
    issues.push({
      code: 'VIDEO_GENERATION_PLAN_MISSING',
      message: 'Video generation plan is missing or invalid',
      severity: 'error',
    });
  }
  if (consistencyPlanMissing) {
    issues.push({
      code: 'CONSISTENCY_PLAN_MISSING',
      message: 'Consistency plan is missing or invalid',
      severity: 'error',
    });
  }
  if (qualityGateMissing) {
    issues.push({
      code: 'QUALITY_GATE_MISSING',
      message: 'Quality gate plan is missing or invalid',
      severity: 'error',
    });
  }
  if (musicSyncLoss) {
    issues.push({
      code: 'MUSIC_SYNC_LOSS',
      message: 'Music sync plan is not preserved',
      severity: 'error',
    });
  }
  if (mvTypeLoss) {
    issues.push({ code: 'MV_TYPE_LOSS', message: 'MV type was not preserved', severity: 'error' });
  }
  if (generationPromptSeedMissing) {
    issues.push({
      code: 'GENERATION_PROMPT_SEED_MISSING',
      message: 'Generation prompt seeds are missing',
      severity: 'error',
    });
  }
  if (adapterRequirementsMissing) {
    issues.push({
      code: 'ADAPTER_REQUIREMENTS_MISSING',
      message: 'Adapter requirements are missing',
      severity: 'error',
    });
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

  const planningChecks: PlanningCheck[] = [
    {
      check_id: 'shot_assembly_consumed',
      check_label: 'Shot Assembly Consumed',
      status: toStatus(shotAssemblyConsumed),
    },
    {
      check_id: 'generation_plan_ready',
      check_label: 'Generation Plan Ready',
      status: toStatus(generationPlanReady),
    },
    {
      check_id: 'image_generation_plan_valid',
      check_label: 'Image Generation Plan Valid',
      status: toStatus(imageGenerationPlanValid),
    },
    {
      check_id: 'video_generation_plan_valid',
      check_label: 'Video Generation Plan Valid',
      status: toStatus(videoGenerationPlanValid),
    },
    {
      check_id: 'consistency_plan_valid',
      check_label: 'Consistency Plan Valid',
      status: toStatus(consistencyPlanValid),
    },
    {
      check_id: 'quality_gate_valid',
      check_label: 'Quality Gate Valid',
      status: toStatus(qualityGateValid),
    },
    {
      check_id: 'music_sync_preserved',
      check_label: 'Music Sync Preserved',
      status: toStatus(musicSyncPreserved),
    },
    {
      check_id: 'mv_type_preserved',
      check_label: 'MV Type Preserved',
      status: toStatus(mvTypePreserved),
    },
    {
      check_id: 'generation_prompt_seed_ready',
      check_label: 'Generation Prompt Seed Ready',
      status: toStatus(generationPromptSeedReady),
    },
    {
      check_id: 'adapter_requirements_valid',
      check_label: 'Adapter Requirements Valid',
      status: toStatus(adapterRequirementsValid),
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
    generationPlanningComplete &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvGenerationPlanningEngineArtifact = {
    engine_id: 'mv-generation-planning-engine-v1',
    phase: MV_GENERATION_PLANNING_ENGINE_PHASE,
    generated_at: timestamp,
    source_shot_assembly_ref: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    shot_assembly_engine_id: shotAssemblyArtifact.engine_id,
    generation_plans: generationPlans,
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
    shot_assembly_consumed: shotAssemblyConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      generation_planning_artifact_write_scope: GENERATION_PLANNING_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    generation_planning_complete: generationPlanningComplete,
  };

  const manifest: MvGenerationPlanningEngineManifest = {
    manifest_id: 'mv-generation-planning-engine-manifest-v1',
    phase: MV_GENERATION_PLANNING_ENGINE_PHASE,
    generated_at: timestamp,
    generation_plan_count: MV_TYPE_COUNT,
    shot_assembly_consumed: toStatus(shotAssemblyConsumed),
    generation_plan_ready: toStatus(generationPlanReady),
    image_generation_plan_valid: toStatus(imageGenerationPlanValid),
    video_generation_plan_valid: toStatus(videoGenerationPlanValid),
    consistency_plan_valid: toStatus(consistencyPlanValid),
    quality_gate_valid: toStatus(qualityGateValid),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    adapter_requirements_valid: toStatus(adapterRequirementsValid),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_GENERATION_PLANNING_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvGenerationPlanningEngineReport = {
    report_id: 'mv-generation-planning-engine-report-v1',
    phase: MV_GENERATION_PLANNING_ENGINE_PHASE,
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
    source_shot_assembly_ref: MV_SHOT_ASSEMBLY_ENGINE_ARTIFACT_PATH,
    mv_shot_assembly_engine_report_path: MV_SHOT_ASSEMBLY_ENGINE_REPORT_PATH,
    mv_generation_planning_engine_export_dir: MV_GENERATION_PLANNING_ENGINE_EXPORT_DIR,
    mv_generation_planning_engine_manifest_path: MV_GENERATION_PLANNING_ENGINE_MANIFEST_PATH,
    mv_generation_planning_engine_artifact_path: MV_GENERATION_PLANNING_ENGINE_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    generation_plan_count: MV_TYPE_COUNT,
    shot_assembly_consumed: toStatus(shotAssemblyConsumed),
    generation_plan_ready: toStatus(generationPlanReady),
    image_generation_plan_valid: toStatus(imageGenerationPlanValid),
    video_generation_plan_valid: toStatus(videoGenerationPlanValid),
    consistency_plan_valid: toStatus(consistencyPlanValid),
    quality_gate_valid: toStatus(qualityGateValid),
    music_sync_preserved: toStatus(musicSyncPreserved),
    mv_type_preserved: toStatus(mvTypePreserved),
    generation_prompt_seed_ready: toStatus(generationPromptSeedReady),
    adapter_requirements_valid: toStatus(adapterRequirementsValid),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    shot_assembly_missing: shotAssemblyMissing,
    generation_plan_invalid: generationPlanInvalid,
    image_generation_plan_missing: imageGenerationPlanMissing,
    video_generation_plan_missing: videoGenerationPlanMissing,
    consistency_plan_missing: consistencyPlanMissing,
    quality_gate_missing: qualityGateMissing,
    music_sync_loss: musicSyncLoss,
    mv_type_loss: mvTypeLoss,
    generation_prompt_seed_missing: generationPromptSeedMissing,
    adapter_requirements_missing: adapterRequirementsMissing,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_generation_planning_engine_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_GENERATION_PLANNING_READY_STATUS : null,
    generation_plans: generationPlans,
    planning_checks: planningChecks,
    final_verdict: pass
      ? MV_GENERATION_PLANNING_ENGINE_PASS_VERDICT
      : MV_GENERATION_PLANNING_ENGINE_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_GENERATION_PLANNING_ENGINE_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_GENERATION_PLANNING_ENGINE_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
