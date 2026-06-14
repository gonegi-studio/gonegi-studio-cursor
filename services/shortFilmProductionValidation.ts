import fs from 'node:fs';
import path from 'node:path';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SHORT_FILM_BLUEPRINT_PATH,
} from './shortFilmBlueprintAssembly.js';
import {
  SHORT_FILM_SCENE_REGISTRY_PATH,
} from './shortFilmSceneAssembly.js';
import {
  SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT,
  SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH,
  SHORT_FILM_SHOT_CONTINUITY_MAP_PATH,
  SHORT_FILM_SHOT_COVERAGE_MAP_PATH,
  SHORT_FILM_SHOT_REGISTRY_PATH,
  SHORT_FILM_SHOT_READY_STATUS,
} from './shortFilmShotAssembly.js';

export const SHORT_FILM_PRODUCTION_VALIDATION_PHASE = 'PHASE-L3-005' as const;
export const SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT =
  'PASS_SHORT_FILM_PRODUCTION_VALIDATION_V1' as const;
export const SHORT_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT =
  'FAIL_SHORT_FILM_PRODUCTION_VALIDATION_V1' as const;
export const SHORT_FILM_PRODUCTION_READY_STATUS = 'SHORT_FILM_PRODUCTION_READY' as const;

export const SHORT_FILM_PRODUCTION_VALIDATION_EXPORT_DIR =
  'exports/short_film_production_validation' as const;
export const SHORT_FILM_PRODUCTION_READINESS_PATH =
  'exports/short_film_production_validation/short-film-production-readiness.json' as const;
export const SHORT_FILM_CONTINUITY_AUDIT_PATH =
  'exports/short_film_production_validation/short-film-continuity-audit.json' as const;
export const SHORT_FILM_CALLBACK_AUDIT_PATH =
  'exports/short_film_production_validation/short-film-callback-audit.json' as const;
export const SHORT_FILM_COVERAGE_AUDIT_PATH =
  'exports/short_film_production_validation/short-film-coverage-audit.json' as const;

export const SHORT_FILM_PRODUCTION_VALIDATION_DIR = 'reports/short_film_production_validation' as const;
export const SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH =
  'reports/short_film_production_validation/SHORT_FILM_PRODUCTION_VALIDATION_REPORT.json' as const;

const CALLBACK_COMPLETION_MIN = 0.9;
const PRODUCTION_READINESS_SCORE_MIN = 90;
const MAX_PRODUCTION_READINESS_SCORE = 100;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface SceneRecord {
  scene_id: string;
  scene_index: number;
  callback_refs: string[];
  continuity_refs: Record<string, string>;
}

interface ShotContinuityEntry {
  shot_id: string;
  scene_id: string;
  inherited_from_scene: Record<string, string>;
  coverage_role_continuity: string;
  camera_motion_continuity: string;
}

interface BlueprintCallbackPair {
  foreshadow_scene: number;
  payoff_scene: number;
  anchor_id: string;
}

interface ContinuityBreak {
  break_id: string;
  shot_id: string;
  scene_id: string;
  dimension: string;
  severity: 'standard' | 'critical';
  reason: string;
}

export interface ShortFilmProductionValidationReport {
  report_id: string;
  phase: typeof SHORT_FILM_PRODUCTION_VALIDATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    short_film_shot_ready: boolean;
    pass_short_film_shot_assembly_v1: boolean;
    precheck_passed: boolean;
  };
  policy: {
    no_new_ds_certification_chain: boolean;
    mv_baseline_modified: boolean;
    mv_production_ready_state_modified: boolean;
    upstream_artifacts_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  validation_summary: {
    continuity_break_count: number;
    critical_continuity_break_count: number;
    callback_completion_ratio: number;
    coverage_validation_passed: boolean;
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
  short_film_production_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function extractArchetypeId(sceneId: string): string {
  const match = /^(.*)_scene_\d+$/.exec(sceneId);
  return match?.[1] ?? sceneId;
}

function runPrecheck(root: string): {
  short_film_shot_ready: boolean;
  pass_short_film_shot_assembly_v1: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'SHOT_REPORT_MISSING',
      message: `Missing shot assembly report at ${SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH}`,
      severity: 'error',
    });
    return {
      short_film_shot_ready: false,
      pass_short_film_shot_assembly_v1: false,
      precheck_passed: false,
      issues,
    };
  }

  const shotReport = readJson<Record<string, unknown>>(root, SHORT_FILM_SHOT_ASSEMBLY_REPORT_PATH);
  const status = String(shotReport.status ?? '');
  const verdict = String(shotReport.final_verdict ?? '');

  const short_film_shot_ready = status === SHORT_FILM_SHOT_READY_STATUS;
  const pass_short_film_shot_assembly_v1 = verdict === SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT;

  if (!short_film_shot_ready) {
    issues.push({
      code: 'SHOT_NOT_READY',
      message: `Expected status=${SHORT_FILM_SHOT_READY_STATUS}, got ${status}`,
      severity: 'error',
    });
  }
  if (!pass_short_film_shot_assembly_v1) {
    issues.push({
      code: 'SHOT_VERDICT_FAIL',
      message: `Expected final_verdict=${SHORT_FILM_SHOT_ASSEMBLY_PASS_VERDICT}, got ${verdict}`,
      severity: 'error',
    });
  }

  return {
    short_film_shot_ready,
    pass_short_film_shot_assembly_v1,
    precheck_passed: short_film_shot_ready && pass_short_film_shot_assembly_v1,
    issues,
  };
}

function buildContinuityAudit(
  continuityMap: {
    archetypes: {
      short_film_archetype_id: string;
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
} {
  const breaks: ContinuityBreak[] = [];
  const sceneById = new Map(sceneRegistry.entries.map((scene) => [scene.scene_id, scene]));
  const shotRoleById = new Map(shotRegistry.entries.map((shot) => [shot.shot_id, shot.coverage_role]));

  for (const archetype of continuityMap.archetypes) {
    const entries = [...archetype.entries].sort((a, b) => a.shot_id.localeCompare(b.shot_id));
    const byScene = new Map<string, ShotContinuityEntry[]>();

    for (const entry of entries) {
      const group = byScene.get(entry.scene_id) ?? [];
      group.push(entry);
      byScene.set(entry.scene_id, group);
    }

    for (const [sceneId, sceneEntries] of byScene) {
      const baseline = sceneEntries[0]?.inherited_from_scene;
      if (!baseline) continue;

      for (const entry of sceneEntries) {
        for (const dimension of ['character', 'location', 'lighting'] as const) {
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

        const scene = sceneById.get(sceneId);
        const coverageRole = shotRoleById.get(entry.shot_id);
        if (
          scene &&
          scene.callback_refs.length > 0 &&
          entry.inherited_from_scene.memory_callback === 'none' &&
          (coverageRole === 'callback' || coverageRole === 'climax')
        ) {
          breaks.push({
            break_id: `critical_${entry.shot_id}_memory_callback`,
            shot_id: entry.shot_id,
            scene_id: sceneId,
            dimension: 'memory_callback',
            severity: 'critical',
            reason: 'callback/climax shot missing memory_callback linkage',
          });
        }
      }
    }

    for (let index = 1; index < entries.length; index += 1) {
      const prior = entries[index - 1];
      const current = entries[index];
      if (prior.scene_id === current.scene_id) continue;

      const locationChanged =
        prior.inherited_from_scene.location !== current.inherited_from_scene.location;
      if (!locationChanged) continue;

      const priorRole = shotRoleById.get(prior.shot_id) ?? '';
      const currentRole = shotRoleById.get(current.shot_id) ?? '';
      const hasTransitionBoundary =
        priorRole === 'transition' ||
        currentRole === 'transition' ||
        currentRole === 'establishing' ||
        priorRole === 'resolution';

      if (!hasTransitionBoundary) {
        breaks.push({
          break_id: `break_${prior.shot_id}_${current.shot_id}_location`,
          shot_id: current.shot_id,
          scene_id: current.scene_id,
          dimension: 'location',
          severity: 'standard',
          reason: 'cross-scene location change without transition boundary coverage',
        });
      }
    }
  }

  const criticalContinuityBreakCount = breaks.filter((entry) => entry.severity === 'critical').length;
  const continuityBreakCount = breaks.length;

  return {
    continuity_break_count: continuityBreakCount,
    critical_continuity_break_count: criticalContinuityBreakCount,
    breaks,
    audit_passed: criticalContinuityBreakCount === 0,
  };
}

function parseSceneRangeMax(range: string): number {
  const match = /^(\d+)-(\d+)$/.exec(range);
  if (!match) return 100;
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
  blueprint: {
    scene_count_target: number;
    scene_count_range: string;
  },
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

function buildCallbackAudit(
  blueprintArtifact: {
    blueprints: {
      short_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      callback_system: {
        foreshadow_payoff_pairs: BlueprintCallbackPair[];
        memory_anchors: string[];
      };
    }[];
  },
  sceneRegistry: { entries: SceneRecord[] }
): {
  callback_completion_ratio: number;
  callback_completion_percent: number;
  audit_passed: boolean;
  archetypes: {
    short_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_completion_ratio: number;
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
    short_film_archetype_id: string;
    total_pairs: number;
    completed_pairs: number;
    callback_completion_ratio: number;
  }[] = [];

  let totalPairs = 0;
  let completedPairs = 0;

  for (const blueprint of blueprintArtifact.blueprints) {
    const archetypeScenes = scenesByArchetype.get(blueprint.short_film_archetype_id) ?? [];
    const pairs = blueprint.callback_system.foreshadow_payoff_pairs.filter(
      (pair) => pair.foreshadow_scene > 0 && pair.payoff_scene > 0
    );

    const completed = pairs.filter((pair) =>
      isCallbackPairComplete(pair, blueprint, archetypeScenes)
    ).length;

    const ratio = pairs.length > 0 ? completed / pairs.length : 1;
    archetypeAudits.push({
      short_film_archetype_id: blueprint.short_film_archetype_id,
      total_pairs: pairs.length,
      completed_pairs: completed,
      callback_completion_ratio: Number(ratio.toFixed(4)),
    });

    totalPairs += pairs.length;
    completedPairs += completed;
  }

  const callbackCompletionRatio = totalPairs > 0 ? completedPairs / totalPairs : 1;

  return {
    callback_completion_ratio: Number(callbackCompletionRatio.toFixed(4)),
    callback_completion_percent: Math.round(callbackCompletionRatio * 100),
    audit_passed: callbackCompletionRatio >= CALLBACK_COMPLETION_MIN,
    archetypes: archetypeAudits,
  };
}

function buildCoverageAudit(coverageMap: {
  validation_passed: boolean;
  archetypes: { short_film_archetype_id: string; validation_passed: boolean; violations: unknown[] }[];
}): {
  coverage_validation_passed: boolean;
  audit_passed: boolean;
  archetypes: { short_film_archetype_id: string; validation_passed: boolean; violation_count: number }[];
} {
  const archetypes = coverageMap.archetypes.map((entry) => ({
    short_film_archetype_id: entry.short_film_archetype_id,
    validation_passed: entry.validation_passed,
    violation_count: entry.violations.length,
  }));

  return {
    coverage_validation_passed: coverageMap.validation_passed,
    audit_passed: coverageMap.validation_passed,
    archetypes,
  };
}

function computeProductionReadinessScore(
  continuityBreakCount: number,
  criticalContinuityBreakCount: number,
  callbackCompletionRatio: number,
  coverageValidationPassed: boolean
): number {
  let score = MAX_PRODUCTION_READINESS_SCORE;

  score -= Math.min(continuityBreakCount, 4);
  if (criticalContinuityBreakCount > 0) score -= 25;
  if (callbackCompletionRatio < CALLBACK_COMPLETION_MIN) {
    score -= Math.round((CALLBACK_COMPLETION_MIN - callbackCompletionRatio) * 100);
  }
  if (!coverageValidationPassed) score -= 20;

  return Math.max(0, Math.min(MAX_PRODUCTION_READINESS_SCORE, score));
}

export function writeShortFilmProductionValidation(
  projectRoot?: string
): ShortFilmProductionValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const continuityMap = readJson<{
    archetypes: { short_film_archetype_id: string; entries: ShotContinuityEntry[] }[];
  }>(root, SHORT_FILM_SHOT_CONTINUITY_MAP_PATH);
  const coverageMap = readJson<{
    validation_passed: boolean;
    archetypes: { short_film_archetype_id: string; validation_passed: boolean; violations: unknown[] }[];
  }>(root, SHORT_FILM_SHOT_COVERAGE_MAP_PATH);
  const sceneRegistry = readJson<{ entries: SceneRecord[] }>(root, SHORT_FILM_SCENE_REGISTRY_PATH);
  const shotRegistry = readJson<{
    entries: { shot_id: string; scene_id: string; coverage_role: string }[];
  }>(root, SHORT_FILM_SHOT_REGISTRY_PATH);
  const blueprintArtifact = readJson<{
    blueprints: {
      short_film_archetype_id: string;
      scene_count_target: number;
      scene_count_range: string;
      callback_system: {
        foreshadow_payoff_pairs: BlueprintCallbackPair[];
        memory_anchors: string[];
      };
    }[];
  }>(root, SHORT_FILM_BLUEPRINT_PATH);

  const continuityAudit = buildContinuityAudit(continuityMap, sceneRegistry, shotRegistry);
  const callbackAudit = buildCallbackAudit(blueprintArtifact, sceneRegistry);
  const coverageAudit = buildCoverageAudit(coverageMap);

  const productionReadinessScore = computeProductionReadinessScore(
    continuityAudit.continuity_break_count,
    continuityAudit.critical_continuity_break_count,
    callbackAudit.callback_completion_ratio,
    coverageAudit.coverage_validation_passed
  );

  const passRulesMet =
    continuityAudit.critical_continuity_break_count === 0 &&
    callbackAudit.callback_completion_ratio >= CALLBACK_COMPLETION_MIN &&
    coverageAudit.coverage_validation_passed &&
    productionReadinessScore >= PRODUCTION_READINESS_SCORE_MIN;

  if (continuityAudit.critical_continuity_break_count > 0) {
    issues.push({
      code: 'CRITICAL_CONTINUITY_BREAKS',
      message: `critical_continuity_break_count=${continuityAudit.critical_continuity_break_count}, expected 0`,
      severity: 'error',
    });
  }
  if (callbackAudit.callback_completion_ratio < CALLBACK_COMPLETION_MIN) {
    issues.push({
      code: 'CALLBACK_COMPLETION_LOW',
      message: `callback_completion_ratio=${callbackAudit.callback_completion_ratio}, minimum ${CALLBACK_COMPLETION_MIN}`,
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
    ? SHORT_FILM_PRODUCTION_READY_STATUS
    : 'SHORT_FILM_PRODUCTION_NOT_READY';

  const continuityAuditArtifact = {
    audit_id: 'short-film-continuity-audit-v1',
    phase: SHORT_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    continuity_break_count: continuityAudit.continuity_break_count,
    critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
    audit_passed: continuityAudit.audit_passed,
    pass_rule: 'critical_continuity_break_count=0',
    breaks: continuityAudit.breaks,
  };

  const callbackAuditArtifact = {
    audit_id: 'short-film-callback-audit-v1',
    phase: SHORT_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    callback_completion_ratio: callbackAudit.callback_completion_ratio,
    callback_completion_percent: callbackAudit.callback_completion_percent,
    audit_passed: callbackAudit.audit_passed,
    pass_rule: `callback_completion_ratio>=${CALLBACK_COMPLETION_MIN}`,
    archetypes: callbackAudit.archetypes,
  };

  const coverageAuditArtifact = {
    audit_id: 'short-film-coverage-audit-v1',
    phase: SHORT_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    coverage_validation_passed: coverageAudit.coverage_validation_passed,
    audit_passed: coverageAudit.audit_passed,
    pass_rule: 'coverage_validation_passed=true',
    archetypes: coverageAudit.archetypes,
  };

  const productionReadinessArtifact = {
    readiness_id: 'short-film-production-readiness-v1',
    phase: SHORT_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    production_readiness_score: productionReadinessScore,
    production_readiness_status: productionReadinessStatus,
    production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    pass_rules: {
      critical_continuity_break_count: 0,
      callback_completion_ratio_min: CALLBACK_COMPLETION_MIN,
      coverage_validation_passed: true,
      production_readiness_score_min: PRODUCTION_READINESS_SCORE_MIN,
    },
    pass_rules_met: passRulesMet,
    audits: {
      continuity_audit_ref: SHORT_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_ref: SHORT_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_ref: SHORT_FILM_COVERAGE_AUDIT_PATH,
    },
    validation_ready: validationReady,
  };

  const report: ShortFilmProductionValidationReport = {
    report_id: 'short-film-production-validation-report-v1',
    phase: SHORT_FILM_PRODUCTION_VALIDATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: validationReady
      ? SHORT_FILM_PRODUCTION_VALIDATION_PASS_VERDICT
      : SHORT_FILM_PRODUCTION_VALIDATION_FAIL_VERDICT,
    status: productionReadinessStatus,
    precheck,
    policy: {
      no_new_ds_certification_chain: true,
      mv_baseline_modified: false,
      mv_production_ready_state_modified: false,
      upstream_artifacts_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    validation_summary: {
      continuity_break_count: continuityAudit.continuity_break_count,
      critical_continuity_break_count: continuityAudit.critical_continuity_break_count,
      callback_completion_ratio: callbackAudit.callback_completion_ratio,
      coverage_validation_passed: coverageAudit.coverage_validation_passed,
      production_readiness_score: productionReadinessScore,
      production_readiness_status: productionReadinessStatus,
      pass_rules_met: passRulesMet,
    },
    outputs: {
      production_readiness_path: SHORT_FILM_PRODUCTION_READINESS_PATH,
      continuity_audit_path: SHORT_FILM_CONTINUITY_AUDIT_PATH,
      callback_audit_path: SHORT_FILM_CALLBACK_AUDIT_PATH,
      coverage_audit_path: SHORT_FILM_COVERAGE_AUDIT_PATH,
    },
    issues,
    short_film_production_ready: validationReady,
  };

  fs.mkdirSync(path.join(root, SHORT_FILM_PRODUCTION_VALIDATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, SHORT_FILM_PRODUCTION_VALIDATION_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, SHORT_FILM_PRODUCTION_READINESS_PATH),
    `${JSON.stringify(productionReadinessArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_CONTINUITY_AUDIT_PATH),
    `${JSON.stringify(continuityAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_CALLBACK_AUDIT_PATH),
    `${JSON.stringify(callbackAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_COVERAGE_AUDIT_PATH),
    `${JSON.stringify(coverageAuditArtifact, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SHORT_FILM_PRODUCTION_VALIDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
