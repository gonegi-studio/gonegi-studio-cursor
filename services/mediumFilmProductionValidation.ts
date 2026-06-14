import fs from 'node:fs';
import path from 'node:path';
import { MEDIUM_FILM_BLUEPRINT_PATH } from './mediumFilmBlueprintAssembly.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { MEDIUM_FILM_SCENE_REGISTRY_PATH } from './mediumFilmSceneAssembly.js';
import {
  MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT,
  MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH,
  MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH,
  MEDIUM_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
  MEDIUM_FILM_SHOT_REGISTRY_PATH,
  MEDIUM_FILM_SHOT_READY_STATUS,
  MEDIUM_FILM_SHOT_SEQUENCE_PATH,
} from './mediumFilmShotAssembly.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE = 'PHASE-L3-MEDIUM-005' as const;
export const MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT =
  'PASS_MEDIUM_FILM_PRODUCTION_VALIDATION_V1' as const;
export const MEDIUM_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT =
  'FAIL_MEDIUM_FILM_PRODUCTION_VALIDATION_V1' as const;
export const MEDIUM_FILM_PRODUCTION_READY_STATUS = 'MEDIUM_FILM_PRODUCTION_READY' as const;

export const MEDIUM_FILM_PRODUCTION_VALIDATION_EXPORT_DIR =
  'exports/medium_film_production_validation' as const;
export const MEDIUM_FILM_PRODUCTION_READINESS_PATH =
  'exports/medium_film_production_validation/medium-film-production-readiness.json' as const;
export const MEDIUM_FILM_CONTINUITY_AUDIT_PATH =
  'exports/medium_film_production_validation/medium-film-continuity-audit.json' as const;
export const MEDIUM_FILM_CALLBACK_AUDIT_PATH =
  'exports/medium_film_production_validation/medium-film-callback-audit.json' as const;
export const MEDIUM_FILM_COVERAGE_AUDIT_PATH =
  'exports/medium_film_production_validation/medium-film-coverage-audit.json' as const;

export const MEDIUM_FILM_PRODUCTION_VALIDATION_DIR = 'reports/medium_film_production_validation' as const;
export const MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH =
  'reports/medium_film_production_validation/MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT.json' as const;

const CALLBACK_RESOLUTION_RATIO_MIN = 0.9;
const PRODUCTION_READINESS_SCORE_MIN = 90;
const MAX_PRODUCTION_READINESS_SCORE = 100;

const CONTINUITY_V2_DIMENSIONS = [
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
] as const;

const WITHIN_SCENE_CRITICAL_DIMENSIONS = [
  'character_arc',
  'location_arc',
  'lighting_arc',
] as const;

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

interface BlueprintCallbackPair {
  foreshadow_scene: number;
  payoff_scene: number;
  anchor_id: string;
}

interface CallbackLayerEntry {
  anchor_id: string;
  callback_seed: number;
  callback_resolution: number | null;
}

interface ContinuityBreak {
  break_id: string;
  shot_id: string;
  scene_id: string;
  dimension: string;
  severity: 'standard' | 'critical';
  reason: string;
}

export interface MediumFilmProductionValidationReport {
  report_id: string;
  phase: typeof MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    medium_film_shot_ready: boolean;
    pass_medium_film_shot_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    production_ready_state_modified: boolean;
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    continuity_dimension_count: number;
    continuity_break_count: number;
    critical_continuity_break_count: number;
    callback_resolution_ratio: number;
    callback_resolution_percent: number;
    coverage_collapse_count: number;
    coverage_validation_passed: boolean;
    dependency_integrity: string;
    orphan_scene_count: number;
    orphan_shot_count: number;
    production_readiness_score: number;
    production_readiness_status: string;
    pass_rules_met: boolean;
  };
  outputs: {
    production_readiness_path: string;
    continuity_audit_path: string;
    callback_audit_path: string;
    coverage_audit_path: string;
  };
  issues: ValidationIssue[];
  medium_film_production_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function extractArchetypeId(sceneId: string): string {
  const match = /^(.*)_scene_\d+$/.exec(sceneId);
  return match?.[1] ?? sceneId;
}

function runPrecheck(root: string): {
  medium_film_shot_ready: boolean;
  pass_medium_film_shot_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SHOT_REPORT_MISSING',
      message: `Missing shot assembly report at ${MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      medium_film_shot_ready: false,
      pass_medium_film_shot_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const shotReport = readJson<Record<string, unknown>>(root, MEDIUM_FILM_SHOT_ASSEMBLY_REPORT_PATH);
  const status = String(shotReport.status ?? '');
  const verdict = String(shotReport.final_verdict ?? '');

  const medium_film_shot_ready = status === MEDIUM_FILM_SHOT_READY_STATUS;
  const pass_medium_film_shot_assembly_v1 = verdict === MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT;

  if (!medium_film_shot_ready) {
    issues.push({
      code: 'SHOT_NOT_READY',
      message: `Expected status=${MEDIUM_FILM_SHOT_READY_STATUS}, got ${status}`,
      severity: 'error',
    });
  }
  if (!pass_medium_film_shot_assembly_v1) {
    issues.push({
      code: 'SHOT_VERDICT_FAIL',
      message: `Expected final_verdict=${MEDIUM_FILM_SHOT_ASSEMBLY_PASS_VERDICT}, got ${verdict}`,
      severity: 'error',
    });
  }

  return {
    medium_film_shot_ready,
    pass_medium_film_shot_assembly_v1,
    precheck_passed: medium_film_shot_ready && pass_medium_film_shot_assembly_v1,
    issues,
  };
}

function buildContinuityAudit(
  continuityMap: {
    continuity_dimension_count: number;
    archetypes: {
      medium_film_archetype_id: string;
      entries: ShotContinuityEntry[];
    }[];
  },
  sceneRegistry: { entries: SceneRecord[] },
  shotRegistry: { entries: { shot_id: string; scene_id: string; coverage_role: string }[] }
): {
  continuity_break_count: number;
  critical_continuity_break_count: number;
  breaks: ContinuityBreak[];
  audit_passed: boolean;
  dimension_coverage: Record<string, boolean>;
} {
  const breaks: ContinuityBreak[] = [];
  const sceneById = new Map(sceneRegistry.entries.map((scene) => [scene.scene_id, scene]));
  const shotRoleById = new Map(shotRegistry.entries.map((shot) => [shot.shot_id, shot.coverage_role]));
  const dimensionCoverage: Record<string, boolean> = Object.fromEntries(
    CONTINUITY_V2_DIMENSIONS.map((dim) => [dim, false])
  );

  for (const archetype of continuityMap.archetypes) {
    const entries = [...archetype.entries].sort((a, b) => a.shot_id.localeCompare(b.shot_id));
    const byScene = new Map<string, ShotContinuityEntry[]>();

    for (const entry of entries) {
      const group = byScene.get(entry.scene_id) ?? [];
      group.push(entry);
      byScene.set(entry.scene_id, group);

      for (const dimension of CONTINUITY_V2_DIMENSIONS) {
        if (entry.inherited_from_scene[dimension] !== undefined) {
          dimensionCoverage[dimension] = true;
        }
      }
    }

    for (const [sceneId, sceneEntries] of byScene) {
      const baseline = sceneEntries[0]?.inherited_from_scene;
      if (!baseline) continue;

      for (const entry of sceneEntries) {
        for (const dimension of WITHIN_SCENE_CRITICAL_DIMENSIONS) {
          if (entry.inherited_from_scene[dimension] !== baseline[dimension]) {
            breaks.push({
              break_id: `critical_${entry.shot_id}_${dimension}`,
              shot_id: entry.shot_id,
              scene_id: sceneId,
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

      const locationChanged =
        prior.inherited_from_scene.location_arc !== current.inherited_from_scene.location_arc;
      if (locationChanged) {
        const priorRole = shotRoleById.get(prior.shot_id) ?? '';
        const currentRole = shotRoleById.get(current.shot_id) ?? '';
        const hasTransitionBoundary =
          priorRole === 'transition' ||
          currentRole === 'transition' ||
          currentRole === 'establishing' ||
          priorRole === 'resolution';

        if (!hasTransitionBoundary) {
          breaks.push({
            break_id: `break_${prior.shot_id}_${current.shot_id}_location_arc`,
            shot_id: current.shot_id,
            scene_id: current.scene_id,
            dimension: 'location_arc',
            severity: 'standard',
            reason: 'cross-scene location_arc change without transition boundary coverage',
          });
        }
      }

      const worldChanged =
        prior.inherited_from_scene.world_arc !== current.inherited_from_scene.world_arc;
      if (worldChanged) {
        const currentRole = shotRoleById.get(current.shot_id) ?? '';
        if (currentRole !== 'establishing' && currentRole !== 'transition') {
          breaks.push({
            break_id: `break_${prior.shot_id}_${current.shot_id}_world_arc`,
            shot_id: current.shot_id,
            scene_id: current.scene_id,
            dimension: 'world_arc',
            severity: 'standard',
            reason: 'cross-scene world_arc change without establishing/transition coverage',
          });
        }
      }
    }
  }

  const criticalContinuityBreakCount = breaks.filter((entry) => entry.severity === 'critical').length;

  return {
    continuity_break_count: breaks.length,
    critical_continuity_break_count: criticalContinuityBreakCount,
    breaks,
    audit_passed: criticalContinuityBreakCount === 0,
    dimension_coverage: dimensionCoverage,
  };
}

function parseSceneRangeMax(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return 1000;
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
    scene.continuity_refs.memory_callback_arc === anchorId
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
  pair: BlueprintCallbackPair,
  blueprint: { scene_count_target: number; scene_count_range: string },
  scenes: SceneRecord[]
): boolean {
  const seedSceneIndex = resolveCallbackSceneIndex(
    pair.foreshadow_scene,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );
  const payoffSceneIndex = resolveCallbackSceneIndex(
    pair.payoff_scene,
    blueprint.scene_count_target,
    blueprint.scene_count_range,
    scenes
  );

  const seedScene = scenes.find((scene) => scene.scene_index === seedSceneIndex);
  const payoffScene = scenes.find((scene) => scene.scene_index === payoffSceneIndex);
  if (!seedScene || !payoffScene) return false;
  if (!hasAnchorLinkage(seedScene, pair.anchor_id)) return false;

  return (
    hasAnchorLinkage(payoffScene, pair.anchor_id) ||
    payoffScene.act_id === 3 ||
    payoffScene.callback_refs.some((ref) => ref.startsWith('resolution:'))
  );
}

function collectCallbackPairs(blueprint: {
  callback_layer: { entries: CallbackLayerEntry[] };
  multi_callback_arc: {
    callback_layers: { foreshadow_payoff_pairs: BlueprintCallbackPair[] }[];
  };
}): BlueprintCallbackPair[] {
  const pairs: BlueprintCallbackPair[] = [];
  const seen = new Set<string>();

  for (const entry of blueprint.callback_layer.entries) {
    if (entry.callback_seed <= 0 || !entry.callback_resolution) continue;
    const key = `${entry.anchor_id}:${entry.callback_seed}:${entry.callback_resolution}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      foreshadow_scene: entry.callback_seed,
      payoff_scene: entry.callback_resolution,
      anchor_id: entry.anchor_id,
    });
  }

  for (const layer of blueprint.multi_callback_arc.callback_layers) {
    for (const pair of layer.foreshadow_payoff_pairs) {
      if (pair.foreshadow_scene <= 0 || pair.payoff_scene <= 0) continue;
      const key = `${pair.anchor_id}:${pair.foreshadow_scene}:${pair.payoff_scene}`;
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push(pair);
    }
  }

  return pairs;
}

function buildCallbackAudit(
  blueprintArtifact: {
    blueprints: {
      medium_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      callback_layer: { entries: CallbackLayerEntry[] };
      multi_callback_arc: {
        callback_layers: { foreshadow_payoff_pairs: BlueprintCallbackPair[] }[];
      };
    }[];
  },
  sceneRegistry: { entries: SceneRecord[] }
): {
  callback_resolution_ratio: number;
  callback_resolution_percent: number;
  audit_passed: boolean;
  archetypes: {
    medium_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_resolution_ratio: number;
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
    medium_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_resolution_ratio: number;
  }[] = [];

  let totalPairs = 0;
  let completedPairs = 0;

  for (const blueprint of blueprintArtifact.blueprints) {
    const archetypeScenes = scenesByArchetype.get(blueprint.medium_film_archetype_id) ?? [];
    const pairs = collectCallbackPairs(blueprint);
    const completed = pairs.filter((pair) =>
      isCallbackPairComplete(pair, blueprint, archetypeScenes)
    ).length;
    const ratio = pairs.length > 0 ? completed / pairs.length : 1;

    archetypeAudits.push({
      medium_film_archetype_id: blueprint.medium_film_archetype_id,
      total_pairs: pairs.length,
      completed_pairs: completed,
      callback_resolution_ratio: Number(ratio.toFixed(4)),
    });

    totalPairs += pairs.length;
    completedPairs += completed;
  }

  const callbackResolutionRatio = totalPairs > 0 ? completedPairs / totalPairs : 1;

  return {
    callback_resolution_ratio: Number(callbackResolutionRatio.toFixed(4)),
    callback_resolution_percent: Math.round(callbackResolutionRatio * 100),
    audit_passed: callbackResolutionRatio >= CALLBACK_RESOLUTION_RATIO_MIN,
    archetypes: archetypeAudits,
  };
}

function buildCoverageAudit(coverageMap: {
  coverage_collapse_count: number;
  validation_passed: boolean;
  archetypes: {
    medium_film_archetype_id: string;
    validation_passed: boolean;
    violations: unknown[];
  }[];
}): {
  coverage_collapse_count: number;
  coverage_validation_passed: boolean;
  audit_passed: boolean;
  archetypes: {
    medium_film_archetype_id: string;
    validation_passed: boolean;
    violation_count: number;
  }[];
} {
  const archetypes = coverageMap.archetypes.map((entry) => ({
    medium_film_archetype_id: entry.medium_film_archetype_id,
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
    sequences: { medium_film_archetype_id: string; shot_count: number; shot_ids: string[] }[];
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
    const archetypeShots = [...(shotsByArchetype.get(sequence.medium_film_archetype_id) ?? [])].sort(
      (a, b) => a.shot_order - b.shot_order
    );

    if (archetypeShots.length !== sequence.shot_count) {
      issues.push(`shot_count_mismatch:${sequence.medium_film_archetype_id}`);
    }

    for (let index = 0; index < archetypeShots.length; index += 1) {
      if (archetypeShots[index].shot_order !== index + 1) {
        issues.push(`shot_order_gap:${archetypeShots[index].shot_id}`);
      }
    }

    if (sequence.shot_ids.length !== archetypeShots.length) {
      issues.push(`sequence_registry_mismatch:${sequence.medium_film_archetype_id}`);
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

function computeProductionReadinessScore(
  continuityBreakCount: number,
  criticalContinuityBreakCount: number,
  callbackResolutionRatio: number,
  coverageValidationPassed: boolean,
  dependencyIntegrity: string
): number {
  let score = MAX_PRODUCTION_READINESS_SCORE;

  score -= Math.min(continuityBreakCount, 6);
  if (criticalContinuityBreakCount > 0) score -= 25;
  if (callbackResolutionRatio < CALLBACK_RESOLUTION_RATIO_MIN) {
    score -= Math.round((CALLBACK_RESOLUTION_RATIO_MIN - callbackResolutionRatio) * 100);
  }
  if (!coverageValidationPassed) score -= 20;
  if (dependencyIntegrity !== 'PASS') score -= 15;

  return Math.max(0, Math.min(MAX_PRODUCTION_READINESS_SCORE, score));
}

export function writeMediumFilmProductionValidation(
  projectRoot?: string
): MediumFilmProductionValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const continuityMap = readJson<{
    continuity_dimension_count: number;
    archetypes: { medium_film_archetype_id: string; entries: ShotContinuityEntry[] }[];
  }>(root, MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH);
  const coverageMap = readJson<{
    coverage_collapse_count: number;
    validation_passed: boolean;
    archetypes: {
      medium_film_archetype_id: string;
      validation_passed: boolean;
      violations: unknown[];
    }[];
  }>(root, MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH);
  const shotSequence = readJson<{
    sequences: { medium_film_archetype_id: string; shot_count: number; shot_ids: string[] }[];
  }>(root, MEDIUM_FILM_SHOT_SEQUENCE_PATH);
  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, MEDIUM_FILM_SCENE_REGISTRY_PATH);
  const shotRegistry = readJson<{
    entries: {
      shot_id: string;
      scene_id: string;
      archetype: string;
      shot_order: number;
      coverage_role: string;
    }[];
  }>(root, MEDIUM_FILM_SHOT_REGISTRY_PATH);
  const blueprintArtifact = readJson<{
    blueprints: {
      medium_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      callback_layer: { entries: CallbackLayerEntry[] };
      multi_callback_arc: {
        callback_layers: { foreshadow_payoff_pairs: BlueprintCallbackPair[] }[];
      };
    }[];
  }>(root, MEDIUM_FILM_BLUEPRINT_PATH);

  const continuityAudit = buildContinuityAudit(continuityMap, sceneRegistry, shotRegistry);
  const callbackAudit = buildCallbackAudit(blueprintArtifact, sceneRegistry);
  const coverageAudit = buildCoverageAudit(coverageMap);
  const dependencyAudit = buildDependencyAudit(shotSequence, sceneRegistry, shotRegistry);

  const productionReadinessScore = computeProductionReadinessScore(
    continuityAudit.continuity_break_count,
    continuityAudit.critical_continuity_break_count,
    callbackAudit.callback_resolution_ratio,
    coverageAudit.coverage_validation_passed,
    dependencyAudit.dependency_integrity
  );

  const passRulesMet =
    continuityAudit.critical_continuity_break_count === 0 &&
    callbackAudit.callback_resolution_ratio >= CALLBACK_RESOLUTION_RATIO_MIN &&
    coverageAudit.coverage_collapse_count === 0 &&
    coverageAudit.coverage_validation_passed &&
    dependencyAudit.dependency_integrity === 'PASS' &&
    dependencyAudit.orphan_scene_count === 0 &&
    dependencyAudit.orphan_shot_count === 0 &&
    productionReadinessScore >= PRODUCTION_READINESS_SCORE_MIN;

  if (continuityAudit.critical_continuity_break_count > 0) {
    issues.push({
      code: 'CRITICAL_CONTINUITY_BREAKS',
      message: `critical_continuity_break_count=${continuityAudit.critical_continuity_break_count}, expected 0`,
      severity: 'error',
    });
  }
  if (callbackAudit.callback_resolution_ratio < CALLBACK_RESOLUTION_RATIO_MIN) {
    issues.push({
      code: 'CALLBACK_RESOLUTION_LOW',
      message: `callback_resolution_ratio=${callbackAudit.callback_resolution_ratio}, minimum ${CALLBACK_RESOLUTION_RATIO_MIN}`,
      severity: 'error',
    });
  }
  if (coverageAudit.coverage_collapse_count !== 0) {
    issues.push({
      code: 'COVERAGE_COLLAPSE',
      message: `coverage_collapse_count=${coverageAudit.coverage_collapse_count}, expected 0`,
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
      message: `dependency_integrity=${dependencyAudit.dependency_integrity}, expected PASS`,
      severity: 'error',
    });
  }
  if (dependencyAudit.orphan_scene_count > 0) {
    issues.push({
      code: 'ORPHAN_SCENES',
      message: `orphan_scene_count=${dependencyAudit.orphan_scene_count}, expected 0`,
      severity: 'error',
    });
  }
  if (dependencyAudit.orphan_shot_count > 0) {
    issues.push({
      code: 'ORPHAN_SHOTS',
      message: `orphan_shot_count=${dependencyAudit.orphan_shot_count}, expected 0`,
      severity: 'error',
    });
  }
  if (productionReadinessScore < PRODUCTION_READINESS_SCORE_MIN) {
    issues.push({
      code: 'PRODUCTION_READINESS_SCORE_LOW',
      message: `production_readiness_score=${productionReadinessScore}, minimum ${PRODUCTION_READINESS_SCORE_MIN}`,
      severity: 'error',
    });
  }

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationReady = precheck.precheck_passed && errors.length === 0 && passRulesMet;

  const productionReadinessStatus = validationReady
    ? MEDIUM_FILM_PRODUCTION_READY_STATUS
    : 'MEDIUM_FILM_PRODUCTION_NOT_READY';

  const continuityAuditArtifact = {
    audit_id: 'medium-film-continuity-audit-v1',
    phase: MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    continuity_v2_dimensions: [...CONTINUITY_V2_DIMENSIONS],
    continuity_dimension_count: continuityMap.continuity_dimension_count,
    dimension_coverage: continuityAudit.dimension_coverage,
    continuity_break_count: continuityAudit.continuity_break_count,
    critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
    audit_passed: continuityAudit.audit_passed,
    pass_rule: 'critical_continuity_break_count=0',
    breaks: continuityAudit.breaks,
  };

  const callbackAuditArtifact = {
    audit_id: 'medium-film-callback-audit-v1',
    phase: MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
    callback_resolution_percent: callbackAudit.callback_resolution_percent,
    audit_passed: callbackAudit.audit_passed,
    pass_rule: `callback_resolution_ratio>=${CALLBACK_RESOLUTION_RATIO_MIN}`,
    archetypes: callbackAudit.archetypes,
  };

  const coverageAuditArtifact = {
    audit_id: 'medium-film-coverage-audit-v1',
    phase: MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    coverage_collapse_count: coverageAudit.coverage_collapse_count,
    coverage_validation_passed: coverageAudit.coverage_validation_passed,
    audit_passed: coverageAudit.audit_passed,
    pass_rule: 'coverage_collapse_count=0',
    archetypes: coverageAudit.archetypes,
  };

  const productionReadinessArtifact = {
    readiness_id: 'medium-film-production-readiness-v1',
    phase: MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    production_readiness_score: productionReadinessScore,
    production_readiness_status: productionReadinessStatus,
    production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    pass_rules: {
      critical_continuity_break_count: 0,
      callback_resolution_ratio_min: CALLBACK_RESOLUTION_RATIO_MIN,
      coverage_collapse_count: 0,
      dependency_integrity: 'PASS',
      orphan_scene_count: 0,
      orphan_shot_count: 0,
      production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    },
    pass_rules_met: passRulesMet,
    validation_metrics: {
      continuity_dimension_count: continuityMap.continuity_dimension_count,
      continuity_break_count: continuityAudit.continuity_break_count,
      critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
      callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
      coverage_collapse_count: coverageAudit.coverage_collapse_count,
      dependency_integrity: dependencyAudit.dependency_integrity,
      orphan_scene_count: dependencyAudit.orphan_scene_count,
      orphan_shot_count: dependencyAudit.orphan_shot_count,
    },
    audits: {
      continuity_audit_ref: MEDIUM_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_ref: MEDIUM_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_ref: MEDIUM_FILM_COVERAGE_AUDIT_PATH,
    },
    upstream_refs: {
      shot_sequence_ref: MEDIUM_FILM_SHOT_SEQUENCE_PATH,
      shot_registry_ref: MEDIUM_FILM_SHOT_REGISTRY_PATH,
      shot_dependency_graph_ref: MEDIUM_FILM_SHOT_DEPENDENCY_GRAPH_PATH,
      shot_continuity_map_ref: MEDIUM_FILM_SHOT_CONTINUITY_MAP_PATH,
      shot_coverage_map_ref: MEDIUM_FILM_SHOT_COVERAGE_MAP_PATH,
    },
    validation_ready: validationReady,
  };

  const report: MediumFilmProductionValidationReport = {
    report_id: 'medium-film-production-validation-report-v1',
    phase: MEDIUM_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: validationReady
      ? MEDIUM_FILM_PRODUCTION_VALIDATION_PASS_VERDICT
      : MEDIUM_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT,
    status: productionReadinessStatus,
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      production_ready_state_modified: false,
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      continuity_dimension_count: continuityMap.continuity_dimension_count,
      continuity_break_count: continuityAudit.continuity_break_count,
      critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
      callback_resolution_ratio: callbackAudit.callback_resolution_ratio,
      callback_resolution_percent: callbackAudit.callback_resolution_percent,
      coverage_collapse_count: coverageAudit.coverage_collapse_count,
      coverage_validation_passed: coverageAudit.coverage_validation_passed,
      dependency_integrity: dependencyAudit.dependency_integrity,
      orphan_scene_count: dependencyAudit.orphan_scene_count,
      orphan_shot_count: dependencyAudit.orphan_shot_count,
      production_readiness_score: productionReadinessScore,
      production_readiness_status: productionReadinessStatus,
      pass_rules_met: passRulesMet,
    },
    outputs: {
      production_readiness_path: MEDIUM_FILM_PRODUCTION_READINESS_PATH,
      continuity_audit_path: MEDIUM_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_path: MEDIUM_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_path: MEDIUM_FILM_COVERAGE_AUDIT_PATH,
    },
    issues,
    medium_film_production_ready: validationReady,
  };

  fs.mkdirSync(path.join(root, MEDIUM_FILM_PRODUCTION_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, MEDIUM_FILM_PRODUCTION_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_PRODUCTION_READINESS_PATH),
    `${JSON.stringify(productionReadinessArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_CONTINUITY_AUDIT_PATH),
    `${JSON.stringify(continuityAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_CALLBACK_AUDIT_PATH),
    `${JSON.stringify(callbackAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_COVERAGE_AUDIT_PATH),
    `${JSON.stringify(coverageAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MEDIUM_FILM_PRODUCTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
