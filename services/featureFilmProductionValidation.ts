import fs from 'node:fs';
import path from 'node:path';
import { FEATURE_FILM_BLUEPRINT_PATH } from './featureFilmBlueprintAssembly.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { FEATURE_FILM_SCENE_REGISTRY_PATH } from './featureFilmSceneAssembly.js';
import {
  FEATURE_FILM_SHOT_ASSEMBLY_PASS_VERDICT,
  FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH,
  FEATURE_FILM_SHOT_COVERAGE_MAP_PATH,
  FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  FEATURE_FILM_SHOT_READY_STATUS,
  FEATURE_FILM_SHOT_REGISTRY_PATH,
  FEATURE_FILM_SHOT_SEQUENCE_PATH,
  FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH,
  FEATURE_SHOT_PER_SCENE_RULES_PATH,
  FEATURE_SHOT_SCALE_RULES_PATH,
} from './featureFilmShotAssembly.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FEATURE_FILM_PRODUCTION_VALIDATION_PHASE = 'PHASE-L3-FEATURE-005' as const;
export const FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT =
  'PASS_FEATURE_FILM_PRODUCTION_VALIDATION_V1' as const;
export const FEATURE_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT =
  'FAIL_FEATURE_FILM_PRODUCTION_VALIDATION_V1' as const;
export const FEATURE_FILM_PRODUCTION_READY_STATUS = 'FEATURE_FILM_PRODUCTION_READY' as const;

export const FEATURE_FILM_PRODUCTION_VALIDATION_EXPORT_DIR =
  'exports/feature_film_production_validation' as const;
export const FEATURE_FILM_PRODUCTION_READINESS_PATH =
  'exports/feature_film_production_validation/feature-film-production-readiness.json' as const;
export const FEATURE_FILM_CONTINUITY_AUDIT_PATH =
  'exports/feature_film_production_validation/feature-film-continuity-audit.json' as const;
export const FEATURE_FILM_CALLBACK_AUDIT_PATH =
  'exports/feature_film_production_validation/feature-film-callback-audit.json' as const;
export const FEATURE_FILM_COVERAGE_AUDIT_PATH =
  'exports/feature_film_production_validation/feature-film-coverage-audit.json' as const;
export const FEATURE_FILM_SHOT_AUDIT_PATH =
  'exports/feature_film_production_validation/feature-film-shot-audit.json' as const;

export const FEATURE_FILM_PRODUCTION_VALIDATION_DIR = 'reports/feature_film_production_validation' as const;
export const FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH =
  'reports/feature_film_production_validation/FEATURE_FILM_PRODUCTION_VALIDATION_REPORT.json' as const;

const CALLBACK_RESOLUTION_RATIO_MIN = 0.9;
const PRODUCTION_READINESS_SCORE_MIN = 90;
const MAX_PRODUCTION_READINESS_SCORE = 100;

const CONTINUITY_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
  'relationship_arc',
  'timeline_arc',
  'memory_callback_arc',
  'subplot_arc',
  'parallel_arc',
  'multi_callback_arc',
  'relationship_network',
  'world_arc',
  'world_state_arc',
  'theme_arc',
  'legacy_callback_arc',
] as const;

const WITHIN_SCENE_CRITICAL_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
] as const;

const DENSITY_CATEGORIES = ['dialogue', 'action', 'montage', 'callback', 'climax'] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SceneRecord {
  scene_id: string;
  scene_index: number;
  act_id: number;
  arc_role: string;
  callback_refs: string[];
  continuity_refs: Record<string, string>;
}

interface ShotContinuityEntry {
  shot_id: string;
  scene_id: string;
  archetype: string;
  inherited_from_scene: Record<string, string>;
  coverage_role_continuity: string;
  camera_motion_continuity: string;
}

interface CallbackLayerEntry {
  anchor_id: string;
  callback_seed: number;
  callback_resolution: number | null;
  legacy_chain: boolean;
}

interface ContinuityBreak {
  break_id: string;
  shot_id: string;
  scene_id: string;
  dimension: string;
  severity: 'standard' | 'critical';
  reason: string;
}

export interface FeatureFilmProductionValidationReport {
  report_id: string;
  phase: typeof FEATURE_FILM_PRODUCTION_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    feature_film_shot_ready: boolean;
    pass_feature_film_shot_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    continuity_dimension_count: number;
    continuity_break_count: number;
    critical_continuity_break_count: number;
    callback_resolution_ratio: number;
    callback_resolution_percent: number;
    legacy_callback_integrity: string;
    world_state_integrity: string;
    theme_arc_integrity: string;
    coverage_collapse_count: number;
    coverage_validation_passed: boolean;
    dependency_integrity: string;
    orphan_scene_count: number;
    orphan_shot_count: number;
    shot_scale_valid: boolean;
    shot_per_scene_valid: boolean;
    shot_density_valid: boolean;
    traceability_integrity: string;
    production_readiness_score: number;
    production_readiness_status: string;
    pass_rules_met: boolean;
  };
  outputs: {
    production_readiness_path: string;
    continuity_audit_path: string;
    callback_audit_path: string;
    coverage_audit_path: string;
    shot_audit_path: string;
  };
  issues: ValidationIssue[];
  feature_film_production_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function extractArchetypeId(sceneId: string): string {
  const match = /^(.*)_scene_\d+$/.exec(sceneId);
  return match?.[1] ?? sceneId;
}

function runPrecheck(root: string): {
  feature_film_shot_ready: boolean;
  pass_feature_film_shot_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SHOT_REPORT_MISSING',
      message: `Missing shot assembly report at ${FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      feature_film_shot_ready: false,
      pass_feature_film_shot_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const shotReport = readJson<Record<string, unknown>>(root, FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH);
  const status = String(shotReport.status ?? '');
  const verdict = String(shotReport.final_verdict ?? '');

  const feature_film_shot_ready = status === FEATURE_FILM_SHOT_READY_STATUS;
  const pass_feature_film_shot_assembly_v1 = verdict === FEATURE_FILM_SHOT_ASSEMBLY_PASS_VERDICT;

  if (!feature_film_shot_ready) {
    issues.push({
      code: 'SHOT_NOT_READY',
      message: `Expected status=${FEATURE_FILM_SHOT_READY_STATUS}`,
      severity: 'error',
    });
  }
  if (!pass_feature_film_shot_assembly_v1) {
    issues.push({
      code: 'SHOT_VERDICT_FAIL',
      message: `Expected final_verdict=${FEATURE_FILM_SHOT_ASSEMBLY_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return {
    feature_film_shot_ready,
    pass_feature_film_shot_assembly_v1,
    precheck_passed: feature_film_shot_ready && pass_feature_film_shot_assembly_v1,
    issues,
  };
}

function buildContinuityAudit(
  continuityMap: {
    continuity_dimension_count: number;
    archetypes: { feature_film_archetype_id: string; entries: ShotContinuityEntry[] }[];
  },
  shotRegistry: { entries: { shot_id: string; scene_id: string; coverage_role: string }[] }
): {
  continuity_break_count: number;
  critical_continuity_break_count: number;
  breaks: ContinuityBreak[];
  audit_passed: boolean;
  dimension_coverage: Record<string, boolean>;
  world_state_integrity: string;
  theme_arc_integrity: string;
  world_state_break_count: number;
  theme_arc_break_count: number;
} {
  const breaks: ContinuityBreak[] = [];
  const shotRoleById = new Map(shotRegistry.entries.map((shot) => [shot.shot_id, shot.coverage_role]));
  const dimensionCoverage: Record<string, boolean> = Object.fromEntries(
    CONTINUITY_DIMENSIONS.map((dim) => [dim, false])
  );
  let worldStateBreakCount = 0;
  let themeArcBreakCount = 0;

  for (const archetype of continuityMap.archetypes) {
    const entries = [...archetype.entries].sort((a, b) => a.shot_id.localeCompare(b.shot_id));
    const byScene = new Map<string, ShotContinuityEntry[]>();

    for (const entry of entries) {
      const group = byScene.get(entry.scene_id) ?? [];
      group.push(entry);
      byScene.set(entry.scene_id, group);

      for (const dimension of CONTINUITY_DIMENSIONS) {
        if (entry.inherited_from_scene[dimension] !== undefined) {
          dimensionCoverage[dimension] = true;
        }
      }
    }

    for (const [, sceneEntries] of byScene) {
      const baseline = sceneEntries[0]?.inherited_from_scene;
      if (!baseline) continue;

      for (const entry of sceneEntries) {
        for (const dimension of WITHIN_SCENE_CRITICAL_DIMENSIONS) {
          if (entry.inherited_from_scene[dimension] !== baseline[dimension]) {
            breaks.push({
              break_id: `critical_${entry.shot_id}_${dimension}`,
              shot_id: entry.shot_id,
              scene_id: entry.scene_id,
              dimension,
              severity: 'critical',
              reason: `within-scene ${dimension} continuity mismatch`,
            });
          }
        }
      }
    }

    for (let index = 1; index < entries.length; index += 1) {
      const prior = entries[index - 1];
      const current = entries[index];
      if (prior.scene_id === current.scene_id) continue;

      const priorRole = shotRoleById.get(prior.shot_id) ?? '';
      const currentRole = shotRoleById.get(current.shot_id) ?? '';
      const hasTransitionBoundary =
        priorRole === 'transition' ||
        currentRole === 'transition' ||
        currentRole === 'establishing' ||
        priorRole === 'resolution';

      const locationChanged =
        prior.inherited_from_scene.location_arc !== current.inherited_from_scene.location_arc;
      if (locationChanged && !hasTransitionBoundary) {
        breaks.push({
          break_id: `break_${prior.shot_id}_${current.shot_id}_location_arc`,
          shot_id: current.shot_id,
          scene_id: current.scene_id,
          dimension: 'location_arc',
          severity: 'standard',
          reason: 'cross-scene location_arc change without transition boundary coverage',
        });
      }

      const worldChanged =
        prior.inherited_from_scene.world_arc !== current.inherited_from_scene.world_arc;
      if (worldChanged && currentRole !== 'establishing' && currentRole !== 'transition') {
        breaks.push({
          break_id: `break_${prior.shot_id}_${current.shot_id}_world_arc`,
          shot_id: current.shot_id,
          scene_id: current.scene_id,
          dimension: 'world_arc',
          severity: 'standard',
          reason: 'cross-scene world_arc change without establishing/transition coverage',
        });
      }

      const worldStateChanged =
        prior.inherited_from_scene.world_state_arc !== current.inherited_from_scene.world_state_arc;
      if (worldStateChanged && !hasTransitionBoundary) {
        worldStateBreakCount += 1;
        breaks.push({
          break_id: `break_${prior.shot_id}_${current.shot_id}_world_state_arc`,
          shot_id: current.shot_id,
          scene_id: current.scene_id,
          dimension: 'world_state_arc',
          severity: 'standard',
          reason: 'cross-scene world_state_arc change without transition boundary coverage',
        });
      }

      const themeChanged =
        prior.inherited_from_scene.theme_arc !== current.inherited_from_scene.theme_arc;
      if (themeChanged && currentRole !== 'establishing' && currentRole !== 'climax') {
        themeArcBreakCount += 1;
        breaks.push({
          break_id: `break_${prior.shot_id}_${current.shot_id}_theme_arc`,
          shot_id: current.shot_id,
          scene_id: current.scene_id,
          dimension: 'theme_arc',
          severity: 'standard',
          reason: 'cross-scene theme_arc change without establishing/climax coverage',
        });
      }
    }
  }

  const criticalContinuityBreakCount = breaks.filter((entry) => entry.severity === 'critical').length;
  const worldStateCriticalBreaks = breaks.filter(
    (entry) => entry.dimension === 'world_state_arc' && entry.severity === 'critical'
  ).length;
  const themeArcCriticalBreaks = breaks.filter(
    (entry) => entry.dimension === 'theme_arc' && entry.severity === 'critical'
  ).length;
  const worldStateIntegrity =
    dimensionCoverage.world_state_arc && worldStateCriticalBreaks === 0 ? 'PASS' : 'FAIL';
  const themeArcIntegrity =
    dimensionCoverage.theme_arc && themeArcCriticalBreaks === 0 ? 'PASS' : 'FAIL';

  return {
    continuity_break_count: breaks.length,
    critical_continuity_break_count: criticalContinuityBreakCount,
    breaks,
    audit_passed: criticalContinuityBreakCount === 0,
    dimension_coverage: dimensionCoverage,
    world_state_integrity: worldStateIntegrity,
    theme_arc_integrity: themeArcIntegrity,
    world_state_break_count: worldStateBreakCount,
    theme_arc_break_count: themeArcBreakCount,
  };
}

function parseSceneRangeMax(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return 3000;
  return Number(match[2]);
}

function scaleCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string
): number {
  if (index <= 0) return 0;
  const rangeMax = parseSceneRangeMax(sceneCountRange);
  return Math.max(1, Math.min(sceneCountTarget, Math.round((index / rangeMax) * sceneCountTarget)));
}

function hasAnchorLinkage(scene: SceneRecord, anchorId: string): boolean {
  return (
    scene.callback_refs.some((ref) => ref.endsWith(`:${anchorId}`)) ||
    scene.continuity_refs.memory_callback_arc === anchorId ||
    scene.continuity_refs.legacy_callback_arc === anchorId
  );
}

function resolveCallbackSceneIndex(
  index: number,
  sceneCountTarget: number,
  sceneCountRange: string,
  scenes: SceneRecord[]
): number {
  if (index > 0 && index <= sceneCountTarget && scenes.some((scene) => scene.scene_index === index)) {
    return index;
  }
  return scaleCallbackSceneIndex(index, sceneCountTarget, sceneCountRange);
}

function isCallbackPairComplete(
  entry: CallbackLayerEntry,
  blueprint: { scene_count_target: number; scene_count_range: string; act_structure: { act_count: number } },
  scenes: SceneRecord[]
): boolean {
  const seedSceneIndex = resolveCallbackSceneIndex(
    entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );
  const payoffSceneIndex = resolveCallbackSceneIndex(
    entry.callback_resolution ?? entry.callback_seed,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );

  const seedScene = scenes.find((scene) => scene.scene_index === seedSceneIndex);
  const payoffScene = scenes.find((scene) => scene.scene_index === payoffSceneIndex);
  if (!seedScene || !payoffScene) return false;
  if (!hasAnchorLinkage(seedScene, entry.anchor_id)) return false;

  return (
    hasAnchorLinkage(payoffScene, entry.anchor_id) ||
    payoffScene.act_id >= blueprint.act_structure.act_count - 1 ||
    payoffScene.callback_refs.some((ref) => ref.startsWith('resolution:'))
  );
}

function buildCallbackAudit(
  blueprintArtifact: {
    blueprints: {
      feature_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      act_structure: { act_count: number };
      callback_layer: { entries: CallbackLayerEntry[] };
      legacy_callback_arc: {
        legacy_anchors: { anchor_id: string; seed_scene: number; payoff_scene: number }[];
      };
    }[];
  },
  sceneRegistry: { entries: SceneRecord[] }
): {
  callback_resolution_ratio: number;
  callback_resolution_percent: number;
  legacy_callback_integrity: string;
  legacy_resolution_ratio: number;
  audit_passed: boolean;
  archetypes: {
    feature_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_resolution_ratio: number;
    legacy_pairs: number;
    legacy_completed: number;
  }[];
} {
  const scenesByArchetype = new Map<string, SceneRecord[]>();
  for (const scene of sceneRegistry.entries) {
    const archetypeId = extractArchetypeId(scene.scene_id);
    const group = scenesByArchetype.get(archetypeId) ?? [];
    group.push(scene);
    scenesByArchetype.set(archetypeId, group);
  }

  const archetypeAudits: {
    feature_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_resolution_ratio: number;
    legacy_pairs: number;
    legacy_completed: number;
  }[] = [];

  let totalPairs = 0;
  let completedPairs = 0;
  let totalLegacyPairs = 0;
  let completedLegacyPairs = 0;

  for (const blueprint of blueprintArtifact.blueprints) {
    const archetypeScenes = scenesByArchetype.get(blueprint.feature_film_archetype_id) ?? [];
    const seen = new Set<string>();
    const entries: CallbackLayerEntry[] = [];

    for (const entry of blueprint.callback_layer.entries) {
      if (entry.callback_seed <= 0 || !entry.callback_resolution) continue;
      const key = `${entry.anchor_id}:${entry.callback_seed}:${entry.callback_resolution}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }

    const completed = entries.filter((entry) =>
      isCallbackPairComplete(entry, blueprint, archetypeScenes)
    ).length;
    const ratio = entries.length > 0 ? completed / entries.length : 1;

    const legacyEntries = entries.filter((e) => e.legacy_chain);
    const legacyCompleted = legacyEntries.filter((entry) =>
      isCallbackPairComplete(entry, blueprint, archetypeScenes)
    ).length;

    let archetypeLegacyPairs = 0;
    let archetypeLegacyCompleted = 0;

    if (legacyEntries.length > 0) {
      archetypeLegacyPairs = legacyEntries.length;
      archetypeLegacyCompleted = legacyCompleted;
    } else {
      for (const anchor of blueprint.legacy_callback_arc.legacy_anchors) {
        archetypeLegacyPairs += 1;
        const legacyEntry: CallbackLayerEntry = {
          anchor_id: anchor.anchor_id,
          callback_seed: anchor.seed_scene,
          callback_resolution: anchor.payoff_scene,
          legacy_chain: true,
        };
        if (isCallbackPairComplete(legacyEntry, blueprint, archetypeScenes)) {
          archetypeLegacyCompleted += 1;
        }
      }
    }

    totalLegacyPairs += archetypeLegacyPairs;
    completedLegacyPairs += archetypeLegacyCompleted;

    archetypeAudits.push({
      feature_film_archetype_id: blueprint.feature_film_archetype_id,
      total_pairs: entries.length,
      completed_pairs: completed,
      callback_resolution_ratio: Number(ratio.toFixed(4)),
      legacy_pairs: archetypeLegacyPairs,
      legacy_completed: archetypeLegacyCompleted,
    });

    totalPairs += entries.length;
    completedPairs += completed;
  }

  const callbackResolutionRatio = totalPairs > 0 ? completedPairs / totalPairs : 1;
  const legacyResolutionRatio =
    totalLegacyPairs > 0 ? completedLegacyPairs / totalLegacyPairs : 1;
  const legacyCallbackIntegrity = legacyResolutionRatio >= 1 ? 'PASS' : 'FAIL';

  return {
    callback_resolution_ratio: Number(callbackResolutionRatio.toFixed(4)),
    callback_resolution_percent: Math.round(callbackResolutionRatio * 100),
    legacy_callback_integrity: legacyCallbackIntegrity,
    legacy_resolution_ratio: Number(legacyResolutionRatio.toFixed(4)),
    audit_passed:
      callbackResolutionRatio >= CALLBACK_RESOLUTION_RATIO_MIN &&
      legacyCallbackIntegrity === 'PASS',
    archetypes: archetypeAudits,
  };
}

function buildCoverageAudit(coverageMap: {
  coverage_collapse_count: number;
  validation_passed: boolean;
  archetypes: {
    feature_film_archetype_id: string;
    validation_passed: boolean;
    violations: unknown[];
  }[];
}): {
  coverage_collapse_count: number;
  coverage_validation_passed: boolean;
  audit_passed: boolean;
  archetypes: {
    feature_film_archetype_id: string;
    validation_passed: boolean;
    violation_count: number;
  }[];
} {
  const archetypes = coverageMap.archetypes.map((entry) => ({
    feature_film_archetype_id: entry.feature_film_archetype_id,
    validation_passed: entry.validation_passed,
    violation_count: entry.violations.length,
  }));

  return {
    coverage_collapse_count: coverageMap.coverage_collapse_count,
    coverage_validation_passed:
      coverageMap.validation_passed && coverageMap.coverage_collapse_count === 0,
    audit_passed: coverageMap.validation_passed && coverageMap.coverage_collapse_count === 0,
    archetypes,
  };
}

function buildDependencyAudit(
  shotSequence: {
    sequences: { feature_film_archetype_id: string; shot_count: number; shot_ids: string[] }[];
  },
  sceneRegistry: { entries: SceneRecord[] },
  shotRegistry: {
    entries: { shot_id: string; scene_id: string; archetype: string; shot_order: number }[];
  }
): {
  dependency_integrity: string;
  orphan_scene_count: number;
  orphan_shot_count: number;
  audit_passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const sceneIds = new Set(sceneRegistry.entries.map((scene) => scene.scene_id));
  const shotIds = new Set<string>();
  const scenesWithShots = new Set<string>();
  let orphanShotCount = 0;

  for (const shot of shotRegistry.entries) {
    if (shotIds.has(shot.shot_id)) {
      orphanShotCount += 1;
      issues.push(`duplicate_shot_id:${shot.shot_id}`);
    }
    shotIds.add(shot.shot_id);
    scenesWithShots.add(shot.scene_id);
    if (!sceneIds.has(shot.scene_id)) {
      orphanShotCount += 1;
      issues.push(`orphan_shot_scene_ref:${shot.shot_id}`);
    }
  }

  let orphanSceneCount = 0;
  for (const sceneId of sceneIds) {
    if (!scenesWithShots.has(sceneId)) {
      orphanSceneCount += 1;
      issues.push(`orphan_scene:${sceneId}`);
    }
  }

  const shotsByArchetype = new Map<string, typeof shotRegistry.entries>();
  for (const shot of shotRegistry.entries) {
    const group = shotsByArchetype.get(shot.archetype) ?? [];
    group.push(shot);
    shotsByArchetype.set(shot.archetype, group);
  }

  for (const sequence of shotSequence.sequences) {
    const archetypeShots = [...(shotsByArchetype.get(sequence.feature_film_archetype_id) ?? [])].sort(
      (a, b) => a.shot_order - b.shot_order
    );

    if (archetypeShots.length !== sequence.shot_count) {
      issues.push(`shot_count_mismatch:${sequence.feature_film_archetype_id}`);
    }

    for (let index = 0; index < archetypeShots.length; index += 1) {
      if (archetypeShots[index].shot_order !== index + 1) {
        issues.push(`shot_order_gap:${archetypeShots[index].shot_id}`);
      }
    }

    if (sequence.shot_ids.length !== archetypeShots.length) {
      issues.push(`sequence_registry_mismatch:${sequence.feature_film_archetype_id}`);
    }
  }

  const auditPassed = orphanSceneCount === 0 && orphanShotCount === 0 && issues.length === 0;

  return {
    dependency_integrity: auditPassed ? 'PASS' : 'FAIL',
    orphan_scene_count: orphanSceneCount,
    orphan_shot_count: orphanShotCount,
    audit_passed: auditPassed,
    issues,
  };
}

function buildShotAudit(
  shotAssemblySummary: {
    shot_scale_valid: boolean;
    shot_per_scene_valid: boolean;
    shot_density_valid: boolean;
    total_shot_count: number;
    total_scene_count: number;
  },
  shotScaleRules: {
    global_min_shot_count: number;
    global_max_shot_count: number;
    archetypes: {
      feature_film_archetype_id: string;
      target_shot_count: number;
      min_shot_count: number;
      max_shot_count: number;
    }[];
  },
  shotPerSceneRules: {
    min_shots_per_scene: number;
    max_shots_per_scene: number;
    target_avg_shots_per_scene: number;
    archetypes: { feature_film_archetype_id: string; avg_shots_per_scene: number }[];
  },
  shotDensity: {
    density_categories: string[];
    archetypes: { feature_film_archetype_id: string; distribution: Record<string, number> }[];
  },
  shotSequence: {
    sequences: { feature_film_archetype_id: string; shot_count: number; scene_count: number }[];
  }
): {
  shot_scale_valid: boolean;
  shot_per_scene_valid: boolean;
  shot_density_valid: boolean;
  audit_passed: boolean;
  archetypes: {
    feature_film_archetype_id: string;
    shot_count: number;
    scene_count: number;
    avg_shots_per_scene: number;
    scale_valid: boolean;
    per_scene_valid: boolean;
    density_valid: boolean;
  }[];
} {
  const scaleRulesById = new Map(
    shotScaleRules.archetypes.map((entry) => [entry.feature_film_archetype_id, entry])
  );
  const perSceneById = new Map(
    shotPerSceneRules.archetypes.map((entry) => [entry.feature_film_archetype_id, entry])
  );
  const densityById = new Map(
    shotDensity.archetypes.map((entry) => [entry.feature_film_archetype_id, entry])
  );

  let shotScaleValid = shotAssemblySummary.shot_scale_valid;
  let shotPerSceneValid = shotAssemblySummary.shot_per_scene_valid;
  let shotDensityValid = shotAssemblySummary.shot_density_valid;

  const globalScaleValid =
    shotAssemblySummary.total_shot_count >= shotScaleRules.global_min_shot_count &&
    shotAssemblySummary.total_shot_count <= shotScaleRules.global_max_shot_count;

  if (!globalScaleValid) shotScaleValid = false;

  const archetypes = shotSequence.sequences.map((sequence) => {
    const scaleRule = scaleRulesById.get(sequence.feature_film_archetype_id);
    const perSceneRule = perSceneById.get(sequence.feature_film_archetype_id);
    const densityRule = densityById.get(sequence.feature_film_archetype_id);

    const avgShots = sequence.scene_count > 0 ? sequence.shot_count / sequence.scene_count : 0;
    const scaleValid =
      scaleRule !== undefined &&
      sequence.shot_count >= scaleRule.min_shot_count &&
      sequence.shot_count <= scaleRule.max_shot_count;
    const perSceneValid =
      perSceneRule !== undefined &&
      avgShots >= shotPerSceneRules.min_shots_per_scene &&
      avgShots <= shotPerSceneRules.max_shots_per_scene;
    const densityValid =
      densityRule !== undefined &&
      DENSITY_CATEGORIES.every((category) => (densityRule.distribution[category] ?? 0) > 0);

    if (!scaleValid) shotScaleValid = false;
    if (!perSceneValid) shotPerSceneValid = false;
    if (!densityValid) shotDensityValid = false;

    return {
      feature_film_archetype_id: sequence.feature_film_archetype_id,
      shot_count: sequence.shot_count,
      scene_count: sequence.scene_count,
      avg_shots_per_scene: Number(avgShots.toFixed(2)),
      scale_valid: scaleValid,
      per_scene_valid: perSceneValid,
      density_valid: densityValid,
    };
  });

  return {
    shot_scale_valid: shotScaleValid,
    shot_per_scene_valid: shotPerSceneValid,
    shot_density_valid: shotDensityValid,
    audit_passed: shotScaleValid && shotPerSceneValid && shotDensityValid,
    archetypes,
  };
}

function buildTraceabilityAudit(
  blueprintArtifact: {
    blueprints: { feature_film_archetype_id: string; medium_film_source_ref: string }[];
  }
): { traceability_integrity: string; audit_passed: boolean; missing_refs: string[] } {
  const missingRefs = blueprintArtifact.blueprints
    .filter((bp) => !bp.medium_film_source_ref)
    .map((bp) => bp.feature_film_archetype_id);

  return {
    traceability_integrity: missingRefs.length === 0 ? 'PASS' : 'FAIL',
    audit_passed: missingRefs.length === 0,
    missing_refs: missingRefs,
  };
}

function computeProductionReadinessScore(
  continuityBreakCount: number,
  criticalContinuityBreakCount: number,
  callbackResolutionRatio: number,
  coverageValidationPassed: boolean,
  dependencyIntegrity: string,
  legacyCallbackIntegrity: string,
  worldStateIntegrity: string,
  themeArcIntegrity: string,
  shotAuditPassed: boolean
): number {
  let score = MAX_PRODUCTION_READINESS_SCORE;

  score -= Math.min(continuityBreakCount, 6);
  if (criticalContinuityBreakCount > 0) score -= 25;
  if (callbackResolutionRatio < CALLBACK_RESOLUTION_RATIO_MIN) {
    score -= Math.round((CALLBACK_RESOLUTION_RATIO_MIN - callbackResolutionRatio) * 100);
  }
  if (!coverageValidationPassed) score -= 20;
  if (dependencyIntegrity !== 'PASS') score -= 15;
  if (legacyCallbackIntegrity !== 'PASS') score -= 10;
  if (worldStateIntegrity !== 'PASS') score -= 8;
  if (themeArcIntegrity !== 'PASS') score -= 8;
  if (!shotAuditPassed) score -= 10;

  return Math.max(0, Math.min(MAX_PRODUCTION_READINESS_SCORE, score));
}

export function writeFeatureFilmProductionValidation(
  projectRoot?: string
): FeatureFilmProductionValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const shotAssemblyReport = readJson<{
    assembly_summary: {
      shot_scale_valid: boolean;
      shot_per_scene_valid: boolean;
      shot_density_valid: boolean;
      total_shot_count: number;
      total_scene_count: number;
    };
  }>(root, FEATURE_FILM_SHOT_ASSEMBLY_REPORT_PATH);

  const continuityMap = readJson<{
    continuity_dimension_count: number;
    archetypes: { feature_film_archetype_id: string; entries: ShotContinuityEntry[] }[];
  }>(root, FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH);
  const coverageMap = readJson<{
    coverage_collapse_count: number;
    validation_passed: boolean;
    archetypes: {
      feature_film_archetype_id: string;
      validation_passed: boolean;
      violations: unknown[];
    }[];
  }>(root, FEATURE_FILM_SHOT_COVERAGE_MAP_PATH);
  const shotSequence = readJson<{
    total_shot_count: number;
    sequences: {
      feature_film_archetype_id: string;
      shot_count: number;
      scene_count: number;
      shot_ids: string[];
    }[];
  }>(root, FEATURE_FILM_SHOT_SEQUENCE_PATH);
  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, FEATURE_FILM_SCENE_REGISTRY_PATH);
  const shotRegistry = readJson<{
    entries: {
      shot_id: string;
      scene_id: string;
      archetype: string;
      shot_order: number;
      coverage_role: string;
    }[];
  }>(root, FEATURE_FILM_SHOT_REGISTRY_PATH);
  const blueprintArtifact = readJson<{
    blueprints: {
      feature_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      medium_film_source_ref: string;
      act_structure: { act_count: number };
      callback_layer: { entries: CallbackLayerEntry[] };
      legacy_callback_arc: {
        legacy_anchors: { anchor_id: string; seed_scene: number; payoff_scene: number }[];
      };
    }[];
  }>(root, FEATURE_FILM_BLUEPRINT_PATH);
  const shotScaleRules = readJson<{
    global_min_shot_count: number;
    global_max_shot_count: number;
    archetypes: {
      feature_film_archetype_id: string;
      target_shot_count: number;
      min_shot_count: number;
      max_shot_count: number;
    }[];
  }>(root, FEATURE_SHOT_SCALE_RULES_PATH);
  const shotPerSceneRules = readJson<{
    min_shots_per_scene: number;
    max_shots_per_scene: number;
    target_avg_shots_per_scene: number;
    archetypes: { feature_film_archetype_id: string; avg_shots_per_scene: number }[];
  }>(root, FEATURE_SHOT_PER_SCENE_RULES_PATH);
  const shotDensity = readJson<{
    density_categories: string[];
    archetypes: { feature_film_archetype_id: string; distribution: Record<string, number> }[];
  }>(root, FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH);

  const continuityAudit = buildContinuityAudit(continuityMap, shotRegistry);
  const callbackAudit = buildCallbackAudit(blueprintArtifact, sceneRegistry);
  const coverageAudit = buildCoverageAudit(coverageMap);
  const dependencyAudit = buildDependencyAudit(shotSequence, sceneRegistry, shotRegistry);
  const shotAudit = buildShotAudit(
    shotAssemblyReport.assembly_summary,
    shotScaleRules,
    shotPerSceneRules,
    shotDensity,
    shotSequence
  );
  const traceabilityAudit = buildTraceabilityAudit(blueprintArtifact);

  const productionReadinessScore = computeProductionReadinessScore(
    continuityAudit.continuity_break_count,
    continuityAudit.critical_continuity_break_count,
    callbackAudit.callback_resolution_ratio,
    coverageAudit.coverage_validation_passed,
    dependencyAudit.dependency_integrity,
    callbackAudit.legacy_callback_integrity,
    continuityAudit.world_state_integrity,
    continuityAudit.theme_arc_integrity,
    shotAudit.audit_passed
  );

  const passRulesMet =
    continuityMap.continuity_dimension_count >= 14 &&
    continuityAudit.critical_continuity_break_count === 0 &&
    callbackAudit.callback_resolution_ratio >= CALLBACK_RESOLUTION_RATIO_MIN &&
    callbackAudit.legacy_callback_integrity === 'PASS' &&
    continuityAudit.world_state_integrity === 'PASS' &&
    continuityAudit.theme_arc_integrity === 'PASS' &&
    coverageAudit.coverage_collapse_count === 0 &&
    coverageAudit.coverage_validation_passed &&
    dependencyAudit.dependency_integrity === 'PASS' &&
    dependencyAudit.orphan_scene_count === 0 &&
    dependencyAudit.orphan_shot_count === 0 &&
    shotAudit.shot_scale_valid &&
    shotAudit.shot_per_scene_valid &&
    shotAudit.shot_density_valid &&
    traceabilityAudit.traceability_integrity === 'PASS' &&
    productionReadinessScore >= PRODUCTION_READINESS_SCORE_MIN;

  if (continuityMap.continuity_dimension_count < 14) {
    issues.push({
      code: 'CONTINUITY_DIMENSION_SHORTFALL',
      message: `continuity_dimension_count=${continuityMap.continuity_dimension_count}, expected >=14`,
      severity: 'error',
    });
  }
  if (continuityAudit.critical_continuity_break_count > 0) {
    issues.push({
      code: 'CRITICAL_CONTINUITY_BREAKS',
      message: `critical_continuity_break_count=${continuityAudit.critical_continuity_break_count}`,
      severity: 'error',
    });
  }
  if (callbackAudit.callback_resolution_ratio < CALLBACK_RESOLUTION_RATIO_MIN) {
    issues.push({
      code: 'CALLBACK_RESOLUTION_LOW',
      message: `callback_resolution_ratio=${callbackAudit.callback_resolution_ratio}`,
      severity: 'error',
    });
  }
  if (callbackAudit.legacy_callback_integrity !== 'PASS') {
    issues.push({
      code: 'LEGACY_CALLBACK_INTEGRITY_FAIL',
      message: `legacy_callback_integrity=${callbackAudit.legacy_callback_integrity}`,
      severity: 'error',
    });
  }
  if (continuityAudit.world_state_integrity !== 'PASS') {
    issues.push({
      code: 'WORLD_STATE_INTEGRITY_FAIL',
      message: `world_state_integrity=${continuityAudit.world_state_integrity}`,
      severity: 'error',
    });
  }
  if (continuityAudit.theme_arc_integrity !== 'PASS') {
    issues.push({
      code: 'THEME_ARC_INTEGRITY_FAIL',
      message: `theme_arc_integrity=${continuityAudit.theme_arc_integrity}`,
      severity: 'error',
    });
  }
  if (coverageAudit.coverage_collapse_count !== 0) {
    issues.push({
      code: 'COVERAGE_COLLAPSE',
      message: `coverage_collapse_count=${coverageAudit.coverage_collapse_count}`,
      severity: 'error',
    });
  }
  if (!coverageAudit.coverage_validation_passed) {
    issues.push({
      code: 'COVERAGE_VALIDATION_FAILED',
      message: 'coverage_validation_passed must be true',
      severity: 'error',
    });
  }
  if (dependencyAudit.dependency_integrity !== 'PASS') {
    issues.push({
      code: 'DEPENDENCY_INTEGRITY_FAIL',
      message: `dependency_integrity=${dependencyAudit.dependency_integrity}`,
      severity: 'error',
    });
  }
  if (dependencyAudit.orphan_scene_count > 0) {
    issues.push({
      code: 'ORPHAN_SCENES',
      message: `orphan_scene_count=${dependencyAudit.orphan_scene_count}`,
      severity: 'error',
    });
  }
  if (dependencyAudit.orphan_shot_count > 0) {
    issues.push({
      code: 'ORPHAN_SHOTS',
      message: `orphan_shot_count=${dependencyAudit.orphan_shot_count}`,
      severity: 'error',
    });
  }
  if (!shotAudit.shot_scale_valid) {
    issues.push({ code: 'SHOT_SCALE_INVALID', message: 'shot_scale_valid=false', severity: 'error' });
  }
  if (!shotAudit.shot_per_scene_valid) {
    issues.push({
      code: 'SHOT_PER_SCENE_INVALID',
      message: 'shot_per_scene_valid=false',
      severity: 'error',
    });
  }
  if (!shotAudit.shot_density_valid) {
    issues.push({
      code: 'SHOT_DENSITY_INVALID',
      message: 'shot_density_valid=false',
      severity: 'error',
    });
  }
  if (traceabilityAudit.traceability_integrity !== 'PASS') {
    issues.push({
      code: 'TRACEABILITY_INTEGRITY_FAIL',
      message: `traceability_integrity=${traceabilityAudit.traceability_integrity}`,
      severity: 'error',
    });
  }
  if (productionReadinessScore < PRODUCTION_READINESS_SCORE_MIN) {
    issues.push({
      code: 'PRODUCTION_READINESS_SCORE_LOW',
      message: `production_readiness_score=${productionReadinessScore}`,
      severity: 'error',
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationReady = precheck.precheck_passed && errors.length === 0 && passRulesMet;

  const productionReadinessStatus = validationReady
    ? FEATURE_FILM_PRODUCTION_READY_STATUS
    : 'FEATURE_FILM_PRODUCTION_NOT_READY';

  const continuityAuditArtifact = {
    audit_id: 'feature-film-continuity-audit-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    continuity_dimensions: [...CONTINUITY_DIMENSIONS],
    continuity_dimension_count: continuityMap.continuity_dimension_count,
    dimension_coverage: continuityAudit.dimension_coverage,
    continuity_break_count: continuityAudit.continuity_break_count,
    critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
    world_state_integrity: continuityAudit.world_state_integrity,
    theme_arc_integrity: continuityAudit.theme_arc_integrity,
    world_state_break_count: continuityAudit.world_state_break_count,
    theme_arc_break_count: continuityAudit.theme_arc_break_count,
    audit_passed: continuityAudit.audit_passed,
    pass_rule: 'critical_continuity_break_count=0',
    breaks: continuityAudit.breaks,
  };

  const callbackAuditArtifact = {
    audit_id: 'feature-film-callback-audit-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
    callback_resolution_percent: callbackAudit.callback_resolution_percent,
    legacy_callback_integrity: callbackAudit.legacy_callback_integrity,
    legacy_resolution_ratio: callbackAudit.legacy_resolution_ratio,
    audit_passed: callbackAudit.audit_passed,
    pass_rules: {
      callback_resolution_ratio_min: CALLBACK_RESOLUTION_RATIO_MIN,
      legacy_callback_integrity: 'PASS',
    },
    archetypes: callbackAudit.archetypes,
  };

  const coverageAuditArtifact = {
    audit_id: 'feature-film-coverage-audit-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    coverage_collapse_count: coverageAudit.coverage_collapse_count,
    coverage_validation_passed: coverageAudit.coverage_validation_passed,
    audit_passed: coverageAudit.audit_passed,
    pass_rule: 'coverage_collapse_count=0',
    archetypes: coverageAudit.archetypes,
  };

  const shotAuditArtifact = {
    audit_id: 'feature-film-shot-audit-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    shot_scale_valid: shotAudit.shot_scale_valid,
    shot_per_scene_valid: shotAudit.shot_per_scene_valid,
    shot_density_valid: shotAudit.shot_density_valid,
    audit_passed: shotAudit.audit_passed,
    global_shot_count: shotSequence.total_shot_count,
    archetypes: shotAudit.archetypes,
    upstream_refs: {
      shot_scale_rules_ref: FEATURE_SHOT_SCALE_RULES_PATH,
      shot_per_scene_rules_ref: FEATURE_SHOT_PER_SCENE_RULES_PATH,
      shot_density_ref: FEATURE_SHOT_DENSITY_BY_SCENE_TYPE_PATH,
    },
  };

  const productionReadinessArtifact = {
    readiness_id: 'feature-film-production-readiness-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    production_readiness_score: productionReadinessScore,
    production_readiness_status: productionReadinessStatus,
    production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    pass_rules: {
      continuity_dimension_count_min: 14,
      critical_continuity_break_count: 0,
      callback_resolution_ratio_min: CALLBACK_RESOLUTION_RATIO_MIN,
      legacy_callback_integrity: 'PASS',
      world_state_integrity: 'PASS',
      theme_arc_integrity: 'PASS',
      coverage_collapse_count: 0,
      dependency_integrity: 'PASS',
      orphan_scene_count: 0,
      orphan_shot_count: 0,
      shot_scale_valid: true,
      shot_per_scene_valid: true,
      shot_density_valid: true,
      traceability_integrity: 'PASS',
      production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    },
    pass_rules_met: passRulesMet,
    validation_metrics: {
      continuity_dimension_count: continuityMap.continuity_dimension_count,
      continuity_break_count: continuityAudit.continuity_break_count,
      critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
      callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
      legacy_callback_integrity: callbackAudit.legacy_callback_integrity,
      world_state_integrity: continuityAudit.world_state_integrity,
      theme_arc_integrity: continuityAudit.theme_arc_integrity,
      coverage_collapse_count: coverageAudit.coverage_collapse_count,
      dependency_integrity: dependencyAudit.dependency_integrity,
      orphan_scene_count: dependencyAudit.orphan_scene_count,
      orphan_shot_count: dependencyAudit.orphan_shot_count,
      shot_scale_valid: shotAudit.shot_scale_valid,
      shot_per_scene_valid: shotAudit.shot_per_scene_valid,
      shot_density_valid: shotAudit.shot_density_valid,
      traceability_integrity: traceabilityAudit.traceability_integrity,
    },
    audits: {
      continuity_audit_ref: FEATURE_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_ref: FEATURE_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_ref: FEATURE_FILM_COVERAGE_AUDIT_PATH,
      shot_audit_ref: FEATURE_FILM_SHOT_AUDIT_PATH,
    },
    upstream_refs: {
      shot_sequence_ref: FEATURE_FILM_SHOT_SEQUENCE_PATH,
      shot_registry_ref: FEATURE_FILM_SHOT_REGISTRY_PATH,
      shot_dependency_graph_ref: FEATURE_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
      shot_continuity_map_ref: FEATURE_FILM_SHOT_CONTINUITY_MAP_PATH,
      shot_coverage_map_ref: FEATURE_FILM_SHOT_COVERAGE_MAP_PATH,
    },
    validation_ready: validationReady,
  };

  const report: FeatureFilmProductionValidationReport = {
    report_id: 'feature-film-production-validation-report-v1',
    phase: FEATURE_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: validationReady
      ? FEATURE_FILM_PRODUCTION_VALIDATION_PASS_VERDICT
      : FEATURE_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT,
    status: productionReadinessStatus,
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      continuity_dimension_count: continuityMap.continuity_dimension_count,
      continuity_break_count: continuityAudit.continuity_break_count,
      critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
      callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
      callback_resolution_percent: callbackAudit.callback_resolution_percent,
      legacy_callback_integrity: callbackAudit.legacy_callback_integrity,
      world_state_integrity: continuityAudit.world_state_integrity,
      theme_arc_integrity: continuityAudit.theme_arc_integrity,
      coverage_collapse_count: coverageAudit.coverage_collapse_count,
      coverage_validation_passed: coverageAudit.coverage_validation_passed,
      dependency_integrity: dependencyAudit.dependency_integrity,
      orphan_scene_count: dependencyAudit.orphan_scene_count,
      orphan_shot_count: dependencyAudit.orphan_shot_count,
      shot_scale_valid: shotAudit.shot_scale_valid,
      shot_per_scene_valid: shotAudit.shot_per_scene_valid,
      shot_density_valid: shotAudit.shot_density_valid,
      traceability_integrity: traceabilityAudit.traceability_integrity,
      production_readiness_score: productionReadinessScore,
      production_readiness_status: productionReadinessStatus,
      pass_rules_met: passRulesMet,
    },
    outputs: {
      production_readiness_path: FEATURE_FILM_PRODUCTION_READINESS_PATH,
      continuity_audit_path: FEATURE_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_path: FEATURE_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_path: FEATURE_FILM_COVERAGE_AUDIT_PATH,
      shot_audit_path: FEATURE_FILM_SHOT_AUDIT_PATH,
    },
    issues,
    feature_film_production_ready: validationReady,
  };

  fs.mkdirSync(path.join(root, FEATURE_FILM_PRODUCTION_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, FEATURE_FILM_PRODUCTION_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, FEATURE_FILM_PRODUCTION_READINESS_PATH),
    `${JSON.stringify(productionReadinessArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_CONTINUITY_AUDIT_PATH),
    `${JSON.stringify(continuityAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_CALLBACK_AUDIT_PATH),
    `${JSON.stringify(callbackAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_COVERAGE_AUDIT_PATH),
    `${JSON.stringify(coverageAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_SHOT_AUDIT_PATH),
    `${JSON.stringify(shotAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, FEATURE_FILM_PRODUCTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
