import fs from 'node:fs';
import path from 'node:path';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from './movieAnalysisDnaPackaging.js';
import { PRODUCTION_RUNTIME_CERTIFICATION_ARTIFACT_PATH } from './movieAnalysisProductionRuntimeCertification.js';
import {
  MV_PRODUCTION_FOUNDATION_READY_STATUS,
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
  MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT,
  MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
  MV_TYPE_COUNT,
  SAFE_CREATE_POLICY,
  SUPPORTED_MV_TYPES,
  type MvProductionSystemFoundationArtifact,
  type MvType,
} from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE =
  'PHASE-DIGITAL-STUDIO-002-MV_PRODUCTION_BLUEPRINT_SYSTEM_V1' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT =
  'PASS_MV_PRODUCTION_BLUEPRINT_SYSTEM_V1' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_FAIL_VERDICT =
  'FAIL_MV_PRODUCTION_BLUEPRINT_SYSTEM_V1' as const;
export const MV_PRODUCTION_BLUEPRINT_READY_STATUS = 'MV_PRODUCTION_BLUEPRINT_READY' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR =
  'reports/mv_production_blueprint_system' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH =
  'reports/mv_production_blueprint_system/mv-production-blueprint-system-report.json' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH =
  'reports/mv_production_blueprint_system/MV_PRODUCTION_BLUEPRINT_SYSTEM.md' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR =
  'exports/mv_production_blueprint_system' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH =
  'exports/mv_production_blueprint_system/mv-production-blueprint-system-manifest.json' as const;
export const MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH =
  'exports/mv_production_blueprint_system/mv-production-blueprint-system.json' as const;

export const BLUEPRINT_ARTIFACT_WRITE_SCOPE = 'exports/mv_production_blueprint_system/' as const;
export const SHOTS_PER_SCENE = 3 as const;

export { EXPECTED_SOURCE_COUNT, EXPECTED_ADAPTER_COUNT, SUPPORTED_MV_TYPES, MV_TYPE_COUNT, SAFE_CREATE_POLICY };

export type BlueprintStatus = 'PASS' | 'FAIL';

export type MvProductionBlueprintSystemIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  mv_type?: MvType;
  check_id?: string;
};

export type BlueprintCheck = {
  check_id: string;
  check_label: string;
  status: BlueprintStatus;
};

export type NarrativeStructure = {
  structure_type: string;
  beats: string[];
  structure_ready: boolean;
};

export type SceneCountPlan = {
  planned_scene_count: number;
  min_scene_count: number;
  max_scene_count: number;
  plan_valid: boolean;
};

export type ShotCountPlan = {
  planned_shot_count: number;
  shots_per_scene: typeof SHOTS_PER_SCENE;
  plan_valid: boolean;
};

export type MusicSyncPlan = {
  sync_id: string;
  beat_markers: Array<{
    beat_index: number;
    scene_ref: string;
    timestamp_seconds: number;
  }>;
  sync_valid: boolean;
};

export type RuntimeEstimate = {
  estimated_seconds_min: number;
  estimated_seconds_max: number;
  estimate_valid: boolean;
};

export type MvSceneSequenceEntry = {
  scene_id: string;
  scene_order: number;
  scene_goal: string;
  mv_type: MvType;
  sequence_valid: boolean;
};

export type MvShotSequenceEntry = {
  shot_id: string;
  scene_ref: string;
  shot_order: number;
  shot_type: string;
  coverage_ref: string;
  sequence_valid: boolean;
};

export type MvBlueprintTraceability = {
  source_foundation_ref: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH;
  mv_foundation_id: string;
  upstream_blueprint_id: string;
  upstream_runtime_id: string;
  dataset_refs: string[];
  trace_integrity: BlueprintStatus;
};

export type MvBlueprint = {
  mv_blueprint_id: string;
  source_foundation_ref: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH;
  mv_type: MvType;
  narrative_structure: NarrativeStructure;
  scene_count_plan: SceneCountPlan;
  shot_count_plan: ShotCountPlan;
  music_sync_plan: MusicSyncPlan;
  emotional_arc: string[];
  runtime_estimate: RuntimeEstimate;
  mv_scene_sequence: MvSceneSequenceEntry[];
  mv_shot_sequence: MvShotSequenceEntry[];
  traceability_chain: MvBlueprintTraceability;
  blueprint_ready: BlueprintStatus;
};

export type MvProductionBlueprintSystemArtifact = {
  blueprint_system_id: string;
  phase: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE;
  generated_at: string;
  source_foundation_ref: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH;
  mv_foundation_id: string;
  mv_blueprints: MvBlueprint[];
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
  foundation_consumed: boolean;
  production_mode_blocked: true;
  traceability_preserved: boolean;
  safe_create_policy: {
    policy: typeof SAFE_CREATE_POLICY;
    read_only_upstream_paths: string[];
    write_paths: string[];
    blueprint_artifact_write_scope: typeof BLUEPRINT_ARTIFACT_WRITE_SCOPE;
    upstream_artifacts_unchanged: boolean;
  };
  blueprint_system_ready: boolean;
};

export type MvProductionBlueprintSystemManifest = {
  manifest_id: string;
  phase: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE;
  generated_at: string;
  mv_blueprint_count: typeof MV_TYPE_COUNT;
  foundation_consumed: BlueprintStatus;
  mv_blueprint_ready: BlueprintStatus;
  scene_sequence_valid: BlueprintStatus;
  shot_sequence_valid: BlueprintStatus;
  music_sync_valid: BlueprintStatus;
  narrative_arc_valid: BlueprintStatus;
  runtime_estimate_valid: BlueprintStatus;
  traceability_preserved: boolean;
  production_mode_blocked: BlueprintStatus;
  certification_status: typeof MV_PRODUCTION_BLUEPRINT_READY_STATUS | null;
};

export type MvProductionBlueprintSystemReport = {
  report_id: string;
  phase: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE;
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
  source_foundation_ref: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH;
  mv_production_system_foundation_report_path: typeof MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH;
  mv_production_blueprint_system_export_dir: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR;
  mv_production_blueprint_system_manifest_path: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH;
  mv_production_blueprint_system_artifact_path: typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH;
  source_count: number;
  adapter_count: number;
  mv_blueprint_count: typeof MV_TYPE_COUNT;
  foundation_consumed: BlueprintStatus;
  mv_blueprint_ready: BlueprintStatus;
  scene_sequence_valid: BlueprintStatus;
  shot_sequence_valid: BlueprintStatus;
  music_sync_valid: BlueprintStatus;
  narrative_arc_valid: BlueprintStatus;
  runtime_estimate_valid: BlueprintStatus;
  traceability_preserved: boolean;
  production_mode_blocked: BlueprintStatus;
  foundation_missing: boolean;
  mv_blueprint_missing: boolean;
  scene_sequence_invalid: boolean;
  shot_sequence_invalid: boolean;
  music_sync_invalid: boolean;
  runtime_estimate_missing: boolean;
  traceability_loss: boolean;
  production_mode_unblocked: boolean;
  mv_production_blueprint_system_ready: BlueprintStatus;
  certification_status: typeof MV_PRODUCTION_BLUEPRINT_READY_STATUS | null;
  mv_blueprints: MvBlueprint[];
  blueprint_checks: BlueprintCheck[];
  final_verdict:
    | typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT
    | typeof MV_PRODUCTION_BLUEPRINT_SYSTEM_FAIL_VERDICT;
  issues: MvProductionBlueprintSystemIssue[];
};

type FileSnapshot = {
  size: number;
  mtimeMs: number;
};

type ArchetypeSceneBlueprint = {
  scene_index: number;
  scene_goal: string;
};

type MvBlueprintPlan = {
  mv_type: MvType;
  narrative_beats: string[];
  structure_type: string;
  emotional_arc: string[];
  runtime_min: number;
  runtime_max: number;
  scene_templates: ArchetypeSceneBlueprint[];
};

const MV_BLUEPRINT_PLANS: Record<MvType, Omit<MvBlueprintPlan, 'mv_type'>> = {
  instrumental_mv: {
    narrative_beats: ['establish', 'develop', 'peak', 'resolve', 'close'],
    structure_type: 'instrumental_visual_flow',
    emotional_arc: ['hope', 'wonder', 'determination', 'gratitude'],
    runtime_min: 90,
    runtime_max: 120,
    scene_templates: [],
  },
  ballad_mv: {
    narrative_beats: [
      'first_meeting',
      'shared_daily_life',
      'growing_affection',
      'quiet_distance',
      'farewell_day',
      'memory_after_parting',
      'reunion_after_time',
      'hopeful_future',
    ],
    structure_type: 'ballad_relationship_arc',
    emotional_arc: ['tenderness', 'longing', 'distance', 'memory', 'hope'],
    runtime_min: 120,
    runtime_max: 180,
    scene_templates: [],
  },
  story_mv: {
    narrative_beats: ['setup', 'inciting', 'rising', 'climax', 'falling', 'resolution'],
    structure_type: 'short_film_narrative_arc',
    emotional_arc: ['curiosity', 'tension', 'conflict', 'release', 'closure'],
    runtime_min: 180,
    runtime_max: 240,
    scene_templates: [],
  },
  music_drama_mv: {
    narrative_beats: [
      'daily_life',
      'companion_bond',
      'community_presence',
      'emotional_turn',
      'memory_anchor',
      'farewell_signal',
      'afterglow',
      'future_hint',
    ],
    structure_type: 'music_drama_episode_arc',
    emotional_arc: ['peace', 'warmth', 'community', 'transition', 'hope'],
    runtime_min: 150,
    runtime_max: 210,
    scene_templates: [],
  },
};

const READ_ONLY_UPSTREAM_PATHS = [
  MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
] as const;

const BLUEPRINT_EXPORT_WRITE_PATHS = [
  MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
] as const;

const WRITE_PATHS = [
  MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH,
  MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH,
  ...BLUEPRINT_EXPORT_WRITE_PATHS,
] as const;

function toStatus(pass: boolean): BlueprintStatus {
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

function isUnderBlueprintWriteScope(relativePath: string): boolean {
  return (
    relativePath.startsWith(BLUEPRINT_ARTIFACT_WRITE_SCOPE) ||
    relativePath === BLUEPRINT_ARTIFACT_WRITE_SCOPE.slice(0, -1)
  );
}

function parseDurationRange(range: string): { min: number; max: number } | null {
  const match = range.match(/(\d+)s\s*-\s*(\d+)s/);
  if (!match) return null;
  return { min: Number(match[1]), max: Number(match[2]) };
}

function loadArchetypeScenes(
  root: string,
  libraryPath: string | null
): ArchetypeSceneBlueprint[] {
  if (!libraryPath) return [];
  const library = loadJson<{
    archetypes?: Array<{ scene_blueprints?: ArchetypeSceneBlueprint[] }>;
    archetype_count?: number;
  }>(root, libraryPath);
  const firstArchetype = library?.archetypes?.[0];
  if (firstArchetype?.scene_blueprints && firstArchetype.scene_blueprints.length > 0) {
    return firstArchetype.scene_blueprints;
  }
  return [];
}

function loadMusicDramaScenes(root: string, libraryPath: string | null): ArchetypeSceneBlueprint[] {
  if (!libraryPath) return [];
  const library = loadJson<{
    archetypes?: Array<{ archetype_id: string; label: string }>;
  }>(root, libraryPath);
  if (!library?.archetypes) return [];
  return library.archetypes.map((archetype, index) => ({
    scene_index: index + 1,
    scene_goal: archetype.label,
  }));
}

function buildSyntheticScenes(
  mvType: MvType,
  sceneCount: number,
  beats: string[]
): ArchetypeSceneBlueprint[] {
  return Array.from({ length: sceneCount }, (_, index) => ({
    scene_index: index + 1,
    scene_goal: `${mvType}_scene_${index + 1}_${beats[index % beats.length] ?? 'beat'}`,
  }));
}

function resolveBlueprintPlan(
  root: string,
  foundation: MvProductionSystemFoundationArtifact,
  mvType: MvType
): MvBlueprintPlan {
  const basePlan = MV_BLUEPRINT_PLANS[mvType];
  const registryEntry = foundation.mv_archetype_registry.entries.find(
    (entry) => entry.mv_type === mvType
  );
  const traceEntry = foundation.mv_traceability_chain.find((entry) => entry.mv_type === mvType);

  let sceneTemplates = loadArchetypeScenes(root, registryEntry?.library_path ?? null);
  if (mvType === 'music_drama_mv' && sceneTemplates.length === 0) {
    sceneTemplates = loadMusicDramaScenes(root, registryEntry?.library_path ?? null);
  }
  if (sceneTemplates.length === 0) {
    const sceneCount =
      mvType === 'story_mv'
        ? Math.min(registryEntry?.archetype_count ?? 10, 10)
        : registryEntry?.archetype_count ?? basePlan.narrative_beats.length;
    sceneTemplates = buildSyntheticScenes(mvType, sceneCount, basePlan.narrative_beats);
  }

  let runtimeMin = basePlan.runtime_min;
  let runtimeMax = basePlan.runtime_max;
  if (registryEntry?.index_path) {
    const index = loadJson<{ entries?: Array<{ recommended_duration?: string }> }>(
      root,
      registryEntry.index_path
    );
    const duration = index?.entries?.[0]?.recommended_duration;
    if (duration) {
      const parsed = parseDurationRange(duration);
      if (parsed) {
        runtimeMin = parsed.min;
        runtimeMax = parsed.max;
      }
    }
  }

  return {
    mv_type: mvType,
    narrative_beats:
      mvType === 'ballad_mv' && sceneTemplates.length > 0
        ? basePlan.narrative_beats.slice(0, sceneTemplates.length)
        : basePlan.narrative_beats,
    structure_type: basePlan.structure_type,
    emotional_arc: basePlan.emotional_arc,
    runtime_min: runtimeMin,
    runtime_max: runtimeMax,
    scene_templates: sceneTemplates,
  };
}

function buildMvBlueprint(
  foundation: MvProductionSystemFoundationArtifact,
  plan: MvBlueprintPlan
): MvBlueprint {
  const traceEntry = foundation.mv_traceability_chain.find(
    (entry) => entry.mv_type === plan.mv_type
  );
  const sceneCount = plan.scene_templates.length;
  const shotCount = sceneCount * SHOTS_PER_SCENE;
  const secondsPerScene = Math.max(
    1,
    Math.floor((plan.runtime_min + plan.runtime_max) / 2 / Math.max(sceneCount, 1))
  );

  const mvSceneSequence: MvSceneSequenceEntry[] = plan.scene_templates.map((scene, index) => ({
    scene_id: `${plan.mv_type}_scene_${scene.scene_index}`,
    scene_order: index + 1,
    scene_goal: scene.scene_goal,
    mv_type: plan.mv_type,
    sequence_valid: true,
  }));

  const shotTypes = ['establishing', 'medium', 'detail'] as const;
  const mvShotSequence: MvShotSequenceEntry[] = [];
  for (const scene of mvSceneSequence) {
    for (let shotIndex = 0; shotIndex < SHOTS_PER_SCENE; shotIndex += 1) {
      mvShotSequence.push({
        shot_id: `${scene.scene_id}_shot_${shotIndex + 1}`,
        scene_ref: scene.scene_id,
        shot_order: shotIndex + 1,
        shot_type: shotTypes[shotIndex] ?? 'detail',
        coverage_ref: `coverage_pattern_0${shotIndex + 1}`,
        sequence_valid: true,
      });
    }
  }

  const beatMarkers = mvSceneSequence.map((scene, index) => ({
    beat_index: index + 1,
    scene_ref: scene.scene_id,
    timestamp_seconds: index * secondsPerScene,
  }));

  const narrativeStructure: NarrativeStructure = {
    structure_type: plan.structure_type,
    beats: plan.narrative_beats,
    structure_ready: plan.narrative_beats.length > 0,
  };

  const sceneCountPlan: SceneCountPlan = {
    planned_scene_count: sceneCount,
    min_scene_count: sceneCount,
    max_scene_count: sceneCount,
    plan_valid: sceneCount > 0,
  };

  const shotCountPlan: ShotCountPlan = {
    planned_shot_count: shotCount,
    shots_per_scene: SHOTS_PER_SCENE,
    plan_valid: shotCount === sceneCount * SHOTS_PER_SCENE,
  };

  const musicSyncPlan: MusicSyncPlan = {
    sync_id: `${plan.mv_type}_music_sync_v1`,
    beat_markers: beatMarkers,
    sync_valid:
      beatMarkers.length === sceneCount &&
      beatMarkers.every((marker) => marker.scene_ref.length > 0),
  };

  const runtimeEstimate: RuntimeEstimate = {
    estimated_seconds_min: plan.runtime_min,
    estimated_seconds_max: plan.runtime_max,
    estimate_valid: plan.runtime_min > 0 && plan.runtime_max >= plan.runtime_min,
  };

  const traceabilityChain: MvBlueprintTraceability = {
    source_foundation_ref: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    mv_foundation_id: foundation.mv_foundation_id,
    upstream_blueprint_id: traceEntry?.upstream_blueprint_id ?? '',
    upstream_runtime_id: traceEntry?.upstream_runtime_id ?? '',
    dataset_refs: traceEntry?.dataset_refs ?? [],
    trace_integrity: traceEntry?.trace_integrity === 'PASS' ? 'PASS' : 'FAIL',
  };

  const blueprintReady =
    narrativeStructure.structure_ready &&
    sceneCountPlan.plan_valid &&
    shotCountPlan.plan_valid &&
    musicSyncPlan.sync_valid &&
    runtimeEstimate.estimate_valid &&
    mvSceneSequence.every((scene) => scene.sequence_valid) &&
    mvShotSequence.every((shot) => shot.sequence_valid) &&
    traceabilityChain.trace_integrity === 'PASS';

  return {
    mv_blueprint_id: `${plan.mv_type}_blueprint_v1`,
    source_foundation_ref: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    mv_type: plan.mv_type,
    narrative_structure: narrativeStructure,
    scene_count_plan: sceneCountPlan,
    shot_count_plan: shotCountPlan,
    music_sync_plan: musicSyncPlan,
    emotional_arc: plan.emotional_arc,
    runtime_estimate: runtimeEstimate,
    mv_scene_sequence: mvSceneSequence,
    mv_shot_sequence: mvShotSequence,
    traceability_chain: traceabilityChain,
    blueprint_ready: toStatus(blueprintReady),
  };
}

function buildMarkdown(report: MvProductionBlueprintSystemReport): string {
  const lines = [
    '# MV Production Blueprint System',
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
    `**Source Foundation:** ${report.source_foundation_ref}`,
    '',
    '## Pipeline',
    '',
    'MV Foundation → MV Blueprint → Scene Sequence → Shot Sequence → Future MV Production Pipeline',
    '',
    '## Summary',
    '',
    '| Check | Status |',
    '| --- | --- |',
    `| foundation_consumed | ${report.foundation_consumed} |`,
    `| mv_blueprint_ready | ${report.mv_blueprint_ready} |`,
    `| scene_sequence_valid | ${report.scene_sequence_valid} |`,
    `| shot_sequence_valid | ${report.shot_sequence_valid} |`,
    `| music_sync_valid | ${report.music_sync_valid} |`,
    `| narrative_arc_valid | ${report.narrative_arc_valid} |`,
    `| runtime_estimate_valid | ${report.runtime_estimate_valid} |`,
    `| traceability_preserved | ${report.traceability_preserved} |`,
    `| production_mode_blocked | ${report.production_mode_blocked} |`,
    '',
    '## MV Blueprints',
    ''
  );

  for (const blueprint of report.mv_blueprints) {
    lines.push(
      `- ${blueprint.mv_blueprint_id} (${blueprint.mv_type}): scenes=${blueprint.scene_count_plan.planned_scene_count} shots=${blueprint.shot_count_plan.planned_shot_count} ready=${blueprint.blueprint_ready}`
    );
  }

  lines.push('', '## Blueprint Checks', '');
  for (const check of report.blueprint_checks) {
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
  issues: MvProductionBlueprintSystemIssue[],
  upstreamSnapshots: Record<string, FileSnapshot | null>
): MvProductionBlueprintSystemReport {
  const upstreamUnchanged = snapshotsUnchanged(root, upstreamSnapshots);

  const report: MvProductionBlueprintSystemReport = {
    report_id: 'mv-production-blueprint-system-report-v1',
    phase: MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE,
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
    source_foundation_ref: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    mv_production_system_foundation_report_path: MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
    mv_production_blueprint_system_export_dir: MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR,
    mv_production_blueprint_system_manifest_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
    mv_production_blueprint_system_artifact_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    source_count: 0,
    adapter_count: 0,
    mv_blueprint_count: MV_TYPE_COUNT,
    foundation_consumed: 'FAIL',
    mv_blueprint_ready: 'FAIL',
    scene_sequence_valid: 'FAIL',
    shot_sequence_valid: 'FAIL',
    music_sync_valid: 'FAIL',
    narrative_arc_valid: 'FAIL',
    runtime_estimate_valid: 'FAIL',
    traceability_preserved: false,
    production_mode_blocked: 'FAIL',
    foundation_missing: true,
    mv_blueprint_missing: true,
    scene_sequence_invalid: true,
    shot_sequence_invalid: true,
    music_sync_invalid: true,
    runtime_estimate_missing: true,
    traceability_loss: true,
    production_mode_unblocked: true,
    mv_production_blueprint_system_ready: 'FAIL',
    certification_status: null,
    mv_blueprints: [],
    blueprint_checks: [],
    final_verdict: MV_PRODUCTION_BLUEPRINT_SYSTEM_FAIL_VERDICT,
    issues: upstreamUnchanged
      ? issues
      : [
          ...issues,
          {
            code: 'SAFE_CREATE_POLICY_VIOLATION',
            message: 'Foundation artifact was modified during blueprint write',
            severity: 'error' as const,
          },
        ],
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );
  return report;
}

export function writeMvProductionBlueprintSystem(
  projectRoot?: string
): MvProductionBlueprintSystemReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: MvProductionBlueprintSystemIssue[] = [];
  const timestamp = new Date().toISOString();

  const upstreamSnapshots = Object.fromEntries(
    READ_ONLY_UPSTREAM_PATHS.map((relativePath) => [
      relativePath,
      snapshotFile(root, relativePath),
    ])
  ) as Record<string, FileSnapshot | null>;

  const foundationReport = loadJson<{
    final_verdict: string;
    certification_status: string | null;
    mv_production_system_foundation_ready: BlueprintStatus;
    mv_foundation_created: BlueprintStatus;
    production_mode_blocked: BlueprintStatus;
    traceability_preserved: boolean;
  }>(root, MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH);
  const foundationArtifact = loadJson<MvProductionSystemFoundationArtifact>(
    root,
    MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH
  );

  const foundationPrecheckValid =
    foundationReport !== null &&
    foundationReport.final_verdict === MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT &&
    foundationReport.certification_status === MV_PRODUCTION_FOUNDATION_READY_STATUS &&
    foundationReport.mv_production_system_foundation_ready === 'PASS' &&
    foundationReport.mv_foundation_created === 'PASS' &&
    foundationArtifact !== null &&
    foundationArtifact.mv_foundation_created === true;

  if (!foundationPrecheckValid) {
    issues.push({
      code: 'FOUNDATION_PRECHECK_FAILED',
      message: `Required ${MV_PRODUCTION_SYSTEM_FOUNDATION_PASS_VERDICT} with ${MV_PRODUCTION_FOUNDATION_READY_STATUS}`,
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

  const mvBlueprints = SUPPORTED_MV_TYPES.map((mvType) => {
    const plan = resolveBlueprintPlan(root, foundationArtifact, mvType);
    return buildMvBlueprint(foundationArtifact, plan);
  });

  const foundationConsumed =
    foundationArtifact.mv_foundation_created === true &&
    foundationArtifact.mv_archetype_registry.registry_ready === true &&
    mvBlueprints.every(
      (blueprint) =>
        blueprint.source_foundation_ref === MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH &&
        blueprint.traceability_chain.mv_foundation_id === foundationArtifact.mv_foundation_id
    );

  const mvBlueprintReady = mvBlueprints.every((blueprint) => blueprint.blueprint_ready === 'PASS');
  const sceneSequenceValid = mvBlueprints.every((blueprint) =>
    blueprint.mv_scene_sequence.every((scene) => scene.sequence_valid)
  );
  const shotSequenceValid = mvBlueprints.every((blueprint) =>
    blueprint.mv_shot_sequence.every((shot) => shot.sequence_valid)
  );
  const musicSyncValid = mvBlueprints.every((blueprint) => blueprint.music_sync_plan.sync_valid);
  const narrativeArcValid = mvBlueprints.every(
    (blueprint) => blueprint.narrative_structure.structure_ready && blueprint.emotional_arc.length > 0
  );
  const runtimeEstimateValid = mvBlueprints.every(
    (blueprint) => blueprint.runtime_estimate.estimate_valid
  );
  const traceabilityPreserved =
    foundationArtifact.traceability_preserved === true &&
    mvBlueprints.every((blueprint) => blueprint.traceability_chain.trace_integrity === 'PASS');

  const productionModeBlocked =
    runtimeCertArtifact.production_mode_blocked === true &&
    runtimeCertArtifact.real_generation_blocked === true &&
    runtimeCertArtifact.no_external_calls === true &&
    runtimeCertArtifact.no_gpu_execution === true &&
    foundationArtifact.production_mode_blocked === true;

  const blueprintWriteScopeValid = BLUEPRINT_EXPORT_WRITE_PATHS.every((writePath) =>
    isUnderBlueprintWriteScope(writePath)
  );
  const upstreamArtifactsUnchanged = snapshotsUnchanged(root, upstreamSnapshots);
  const safeCreatePolicyVerified = upstreamArtifactsUnchanged && blueprintWriteScopeValid;

  const blueprintSystemReady =
    foundationConsumed &&
    mvBlueprintReady &&
    sceneSequenceValid &&
    shotSequenceValid &&
    musicSyncValid &&
    narrativeArcValid &&
    runtimeEstimateValid &&
    traceabilityPreserved &&
    productionModeBlocked &&
    safeCreatePolicyVerified;

  const foundationMissing = !foundationConsumed;
  const mvBlueprintMissing = !mvBlueprintReady;
  const sceneSequenceInvalid = !sceneSequenceValid;
  const shotSequenceInvalid = !shotSequenceValid;
  const musicSyncInvalid = !musicSyncValid;
  const runtimeEstimateMissing = !runtimeEstimateValid;
  const traceabilityLoss = !traceabilityPreserved;
  const productionModeUnblocked = !productionModeBlocked;

  if (foundationMissing) {
    issues.push({ code: 'FOUNDATION_MISSING', message: 'Foundation was not consumed', severity: 'error' });
  }
  if (mvBlueprintMissing) {
    issues.push({ code: 'MV_BLUEPRINT_MISSING', message: 'MV blueprint is missing or incomplete', severity: 'error' });
  }
  if (sceneSequenceInvalid) {
    issues.push({
      code: 'SCENE_SEQUENCE_INVALID',
      message: 'MV scene sequence is invalid',
      severity: 'error',
    });
  }
  if (shotSequenceInvalid) {
    issues.push({
      code: 'SHOT_SEQUENCE_INVALID',
      message: 'MV shot sequence is invalid',
      severity: 'error',
    });
  }
  if (musicSyncInvalid) {
    issues.push({ code: 'MUSIC_SYNC_INVALID', message: 'Music sync plan is invalid', severity: 'error' });
  }
  if (runtimeEstimateMissing) {
    issues.push({
      code: 'RUNTIME_ESTIMATE_MISSING',
      message: 'Runtime estimate is missing or invalid',
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

  const blueprintChecks: BlueprintCheck[] = [
    {
      check_id: 'foundation_consumed',
      check_label: 'Foundation Consumed',
      status: toStatus(foundationConsumed),
    },
    {
      check_id: 'mv_blueprint_ready',
      check_label: 'MV Blueprint Ready',
      status: toStatus(mvBlueprintReady),
    },
    {
      check_id: 'scene_sequence_valid',
      check_label: 'Scene Sequence Valid',
      status: toStatus(sceneSequenceValid),
    },
    {
      check_id: 'shot_sequence_valid',
      check_label: 'Shot Sequence Valid',
      status: toStatus(shotSequenceValid),
    },
    {
      check_id: 'music_sync_valid',
      check_label: 'Music Sync Valid',
      status: toStatus(musicSyncValid),
    },
    {
      check_id: 'narrative_arc_valid',
      check_label: 'Narrative Arc Valid',
      status: toStatus(narrativeArcValid),
    },
    {
      check_id: 'runtime_estimate_valid',
      check_label: 'Runtime Estimate Valid',
      status: toStatus(runtimeEstimateValid),
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
    blueprintSystemReady && issues.filter((issue) => issue.severity === 'error').length === 0;

  const artifact: MvProductionBlueprintSystemArtifact = {
    blueprint_system_id: 'mv-production-blueprint-system-v1',
    phase: MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE,
    generated_at: timestamp,
    source_foundation_ref: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    mv_foundation_id: foundationArtifact.mv_foundation_id,
    mv_blueprints: mvBlueprints,
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
    foundation_consumed: foundationConsumed,
    production_mode_blocked: true,
    traceability_preserved: traceabilityPreserved,
    safe_create_policy: {
      policy: SAFE_CREATE_POLICY,
      read_only_upstream_paths: [...READ_ONLY_UPSTREAM_PATHS],
      write_paths: [...WRITE_PATHS],
      blueprint_artifact_write_scope: BLUEPRINT_ARTIFACT_WRITE_SCOPE,
      upstream_artifacts_unchanged: upstreamArtifactsUnchanged,
    },
    blueprint_system_ready: blueprintSystemReady,
  };

  const manifest: MvProductionBlueprintSystemManifest = {
    manifest_id: 'mv-production-blueprint-system-manifest-v1',
    phase: MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE,
    generated_at: timestamp,
    mv_blueprint_count: MV_TYPE_COUNT,
    foundation_consumed: toStatus(foundationConsumed),
    mv_blueprint_ready: toStatus(mvBlueprintReady),
    scene_sequence_valid: toStatus(sceneSequenceValid),
    shot_sequence_valid: toStatus(shotSequenceValid),
    music_sync_valid: toStatus(musicSyncValid),
    narrative_arc_valid: toStatus(narrativeArcValid),
    runtime_estimate_valid: toStatus(runtimeEstimateValid),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    certification_status: pass ? MV_PRODUCTION_BLUEPRINT_READY_STATUS : null,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH),
    `${JSON.stringify(artifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  const report: MvProductionBlueprintSystemReport = {
    report_id: 'mv-production-blueprint-system-report-v1',
    phase: MV_PRODUCTION_BLUEPRINT_SYSTEM_PHASE,
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
    source_foundation_ref: MV_PRODUCTION_SYSTEM_FOUNDATION_ARTIFACT_PATH,
    mv_production_system_foundation_report_path: MV_PRODUCTION_SYSTEM_FOUNDATION_REPORT_PATH,
    mv_production_blueprint_system_export_dir: MV_PRODUCTION_BLUEPRINT_SYSTEM_EXPORT_DIR,
    mv_production_blueprint_system_manifest_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_MANIFEST_PATH,
    mv_production_blueprint_system_artifact_path: MV_PRODUCTION_BLUEPRINT_SYSTEM_ARTIFACT_PATH,
    source_count: EXPECTED_SOURCE_COUNT,
    adapter_count: EXPECTED_ADAPTER_COUNT,
    mv_blueprint_count: MV_TYPE_COUNT,
    foundation_consumed: toStatus(foundationConsumed),
    mv_blueprint_ready: toStatus(mvBlueprintReady),
    scene_sequence_valid: toStatus(sceneSequenceValid),
    shot_sequence_valid: toStatus(shotSequenceValid),
    music_sync_valid: toStatus(musicSyncValid),
    narrative_arc_valid: toStatus(narrativeArcValid),
    runtime_estimate_valid: toStatus(runtimeEstimateValid),
    traceability_preserved: traceabilityPreserved,
    production_mode_blocked: toStatus(productionModeBlocked),
    foundation_missing: foundationMissing,
    mv_blueprint_missing: mvBlueprintMissing,
    scene_sequence_invalid: sceneSequenceInvalid,
    shot_sequence_invalid: shotSequenceInvalid,
    music_sync_invalid: musicSyncInvalid,
    runtime_estimate_missing: runtimeEstimateMissing,
    traceability_loss: traceabilityLoss,
    production_mode_unblocked: productionModeUnblocked,
    mv_production_blueprint_system_ready: pass ? 'PASS' : 'FAIL',
    certification_status: pass ? MV_PRODUCTION_BLUEPRINT_READY_STATUS : null,
    mv_blueprints: mvBlueprints,
    blueprint_checks: blueprintChecks,
    final_verdict: pass
      ? MV_PRODUCTION_BLUEPRINT_SYSTEM_PASS_VERDICT
      : MV_PRODUCTION_BLUEPRINT_SYSTEM_FAIL_VERDICT,
    issues,
  };

  fs.mkdirSync(path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_DIR), { recursive: true });
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MV_PRODUCTION_BLUEPRINT_SYSTEM_MD_PATH),
    `${buildMarkdown(report)}\n`,
    'utf8'
  );

  return report;
}
