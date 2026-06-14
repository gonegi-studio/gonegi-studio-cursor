import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GATEKEEPER_PHASE = 'PHASE-AUDITOR-008' as const;
export const GATEKEEPER_PASS_VERDICT = 'PASS_AUDITOR_GATEKEEPER_V1' as const;
export const GATEKEEPER_FAIL_VERDICT = 'FAIL_AUDITOR_GATEKEEPER_V1' as const;
export const GATEKEEPER_REPORT_PATH = 'reports/auditor-gatekeeper-report.json' as const;

export const DATASET16_FULL_FIXTURE_PATH =
  'reports/fixtures/dataset16-full-promotion-candidate.json' as const;
export const DATASET16_V2_FIXTURE_PATH =
  'reports/fixtures/dataset16-v2-promotion-candidate.json' as const;

export type GateStatus = 'ALLOW' | 'ALLOW_WITH_WARNING' | 'BLOCK';

export type PromotionCandidateInput = {
  candidate_id: string;
  candidate_type: 'dataset' | 'adapter' | 'contract';
  candidate_path: string;
  label?: string;
};

export type PromotionCandidateResult = {
  candidate_id: string;
  candidate_type: string;
  candidate_path: string;
  gate_status: GateStatus;
  promotion_allowed: boolean;
  gate_reason: string;
  blocking_items: readonly string[];
  warning_items: readonly string[];
  identity_threats_found: number;
};

export type ProjectGateSnapshot = {
  project_status: string;
  aggregate_risk: number;
  critical_errors: number;
  safe_slot_count: number;
  watch_slot_count: number;
  skip_slot_count: number;
};

export type AuditorGatekeeperReport = {
  gatekeeper_id: string;
  phase: typeof GATEKEEPER_PHASE;
  timestamp: string;
  dashboard_source: string;
  project_gate: ProjectGateSnapshot;
  gate_status: GateStatus;
  gate_reason: string;
  promotion_allowed: boolean;
  blocking_items: readonly string[];
  warning_items: readonly string[];
  recommended_actions: readonly string[];
  promotion_simulations: readonly PromotionCandidateResult[];
  final_verdict: typeof GATEKEEPER_PASS_VERDICT | typeof GATEKEEPER_FAIL_VERDICT;
};

const EXCLUDED_TOKEN_PARENT_KEYS = new Set([
  'removed_harmful_prefixes',
  'forbidden_in_latest',
  'retained_outdoor_lock_prefixes',
  'soft_guidance_prefixes',
  'forbidden_mutation_rules',
  'removed_in_v2_rebuild',
  'removed_in_lite_mode',
  'required_prefixes',
  'image_app_token_contract',
]);

const INJECTABLE_TOKEN_KEYS = new Set([
  'layout_tokens',
  'priority_tokens',
  'tokens',
  'visual_memory_tokens',
  'spatial_tokens',
]);

type DashboardDoc = {
  project_status?: string;
  aggregate_risk?: number;
  critical_errors?: number;
  safe_slots?: string[];
  watch_slots?: string[];
  skip_slots?: string[];
  recommended_next_actions?: string[];
};

function collectInjectableStrings(value: unknown, key: string | null, out: string[], depth = 0): void {
  if (depth > 14) return;
  if (key && EXCLUDED_TOKEN_PARENT_KEYS.has(key)) return;
  if (key && INJECTABLE_TOKEN_KEYS.has(key) && Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string') out.push(item);
    }
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === 'string' && item.includes(':')) out.push(item);
      else collectInjectableStrings(item, key, out, depth + 1);
    }
    return;
  }
  if (value && typeof value === 'object') {
    for (const [childKey, child] of Object.entries(value as Record<string, unknown>)) {
      collectInjectableStrings(child, childKey, out, depth + 1);
    }
  }
}

function scanIdentityThreats(doc: Record<string, unknown>): {
  blocking: string[];
  warnings: string[];
} {
  const injectable: string[] = [];
  collectInjectableStrings(doc, null, injectable);

  const blocking: string[] = [];
  const warnings: string[] = [];

  const secondary = doc.runtime_verification_fields as
    | { secondary_validation?: string }
    | undefined;
  const enforcementText = String(secondary?.secondary_validation ?? '');
  if (/\bfail if ignored\b/i.test(enforcementText) && !/no fail/i.test(enforcementText)) {
    blocking.push('runtime_verification_fields.secondary_validation contains FAIL-if-ignored enforcement');
  }

  for (const token of injectable) {
    const colonIndex = token.indexOf(':');
    if (colonIndex < 0 || colonIndex >= token.length - 1) continue;

    if (/^landmark-visibility:must_show_/i.test(token)) {
      blocking.push(`Injectable identity-threatening token: ${token}`);
    } else if (/^camera-visibility:/i.test(token)) {
      blocking.push(`Injectable camera-visibility enforcement: ${token}`);
    } else if (/^walkable-zone:/i.test(token)) {
      blocking.push(`Injectable walkable-zone token: ${token}`);
    } else if (/^landmark-visibility:/i.test(token)) {
      warnings.push(`Landmark visibility token present: ${token}`);
    }
  }

  return { blocking: [...new Set(blocking)], warnings: [...new Set(warnings)] };
}

export function evaluateProjectGate(dashboard: DashboardDoc): {
  gate_status: GateStatus;
  gate_reason: string;
  blocking_items: string[];
  warning_items: string[];
} {
  const blocking_items: string[] = [];
  const warning_items: string[] = [];

  const critical_errors = Number(dashboard.critical_errors ?? 0);
  const skip_slots = dashboard.skip_slots ?? [];
  const watch_slots = dashboard.watch_slots ?? [];
  const aggregate_risk = Number(dashboard.aggregate_risk ?? 0);

  if (critical_errors > 0) {
    blocking_items.push(`${critical_errors} critical auditor error(s) on dashboard`);
    return {
      gate_status: 'BLOCK',
      gate_reason: 'critical_errors > 0',
      blocking_items,
      warning_items,
    };
  }

  if (skip_slots.length > 0) {
    blocking_items.push(`skip_slots present: ${skip_slots.join(', ')}`);
    return {
      gate_status: 'BLOCK',
      gate_reason: 'skip_slots > 0',
      blocking_items,
      warning_items,
    };
  }

  if (aggregate_risk > 60) {
    blocking_items.push(`aggregate_risk ${aggregate_risk} exceeds threshold 60`);
    return {
      gate_status: 'BLOCK',
      gate_reason: 'aggregate_risk > 60',
      blocking_items,
      warning_items,
    };
  }

  if (watch_slots.length > 0) {
    warning_items.push(`${watch_slots.length} watch slot(s): ${watch_slots.join(', ')}`);
    return {
      gate_status: 'ALLOW_WITH_WARNING',
      gate_reason: 'watch_slots > 0',
      blocking_items,
      warning_items,
    };
  }

  return {
    gate_status: 'ALLOW',
    gate_reason: 'project health within promotion thresholds',
    blocking_items,
    warning_items,
  };
}

function mergeGateStatus(a: GateStatus, b: GateStatus): GateStatus {
  if (a === 'BLOCK' || b === 'BLOCK') return 'BLOCK';
  if (a === 'ALLOW_WITH_WARNING' || b === 'ALLOW_WITH_WARNING') return 'ALLOW_WITH_WARNING';
  return 'ALLOW';
}

export function simulatePromotion(
  projectRoot: string,
  candidate: PromotionCandidateInput,
  projectGate: ReturnType<typeof evaluateProjectGate>
): PromotionCandidateResult {
  const root = resolveProjectRoot(projectRoot);
  const absPath = path.join(root, candidate.candidate_path);
  const blocking_items: string[] = [...projectGate.blocking_items];
  const warning_items: string[] = [...projectGate.warning_items];

  if (!fs.existsSync(absPath)) {
    blocking_items.push(`Candidate file missing: ${candidate.candidate_path}`);
    return {
      candidate_id: candidate.candidate_id,
      candidate_type: candidate.candidate_type,
      candidate_path: candidate.candidate_path,
      gate_status: 'BLOCK',
      promotion_allowed: false,
      gate_reason: 'candidate_file_missing',
      blocking_items: Object.freeze(blocking_items),
      warning_items: Object.freeze(warning_items),
      identity_threats_found: 0,
    };
  }

  const doc = JSON.parse(fs.readFileSync(absPath, 'utf8')) as Record<string, unknown>;
  const threats = scanIdentityThreats(doc);
  blocking_items.push(...threats.blocking);
  warning_items.push(...threats.warnings);

  let candidateGate: GateStatus = 'ALLOW';
  let gate_reason = projectGate.gate_reason;

  if (threats.blocking.length > 0) {
    candidateGate = 'BLOCK';
    gate_reason = 'identity-threatening enforcement tokens in candidate';
  } else if (threats.warnings.length > 0) {
    candidateGate = mergeGateStatus(candidateGate, 'ALLOW_WITH_WARNING');
    if (gate_reason === 'project health within promotion thresholds') {
      gate_reason = 'candidate contains cautionary visibility tokens';
    }
  }

  const gate_status = mergeGateStatus(projectGate.gate_status, candidateGate);

  return {
    candidate_id: candidate.candidate_id,
    candidate_type: candidate.candidate_type,
    candidate_path: candidate.candidate_path,
    gate_status,
    promotion_allowed: gate_status !== 'BLOCK',
    gate_reason,
    blocking_items: Object.freeze(blocking_items),
    warning_items: Object.freeze(warning_items),
    identity_threats_found: threats.blocking.length,
  };
}

export function runAuditorGatekeeper(projectRoot?: string): AuditorGatekeeperReport {
  const root = resolveProjectRoot(projectRoot);
  const dashboard = readJsonRecord(root, AUDITOR_DASHBOARD_JSON_PATH) as DashboardDoc | null;

  if (!dashboard) {
    throw new Error(`Missing ${AUDITOR_DASHBOARD_JSON_PATH}`);
  }

  const projectGateEval = evaluateProjectGate(dashboard);
  const project_gate: ProjectGateSnapshot = {
    project_status: String(dashboard.project_status ?? 'UNKNOWN'),
    aggregate_risk: Number(dashboard.aggregate_risk ?? 0),
    critical_errors: Number(dashboard.critical_errors ?? 0),
    safe_slot_count: dashboard.safe_slots?.length ?? 0,
    watch_slot_count: dashboard.watch_slots?.length ?? 0,
    skip_slot_count: dashboard.skip_slots?.length ?? 0,
  };

  const fullFixture = JSON.parse(
    fs.readFileSync(path.join(root, DATASET16_FULL_FIXTURE_PATH), 'utf8')
  ) as PromotionCandidateInput & { expected_gate_status: GateStatus };

  const v2Fixture = JSON.parse(
    fs.readFileSync(path.join(root, DATASET16_V2_FIXTURE_PATH), 'utf8')
  ) as PromotionCandidateInput & { expected_gate_status: GateStatus };

  const promotion_simulations = Object.freeze([
    simulatePromotion(root, fullFixture, projectGateEval),
    simulatePromotion(root, v2Fixture, projectGateEval),
  ]);

  const recommended_actions = Object.freeze([
    ...(dashboard.recommended_next_actions ?? []).slice(0, 3),
    'Run npm run verify:auditor-dashboard before any latest/ promotion.',
    'Dataset #16 Full must never be promoted — use v2-safe outdoor adapter only.',
    ...(project_gate.watch_slot_count > 0
      ? ['Promotion allowed with warning while watch slots remain — validate RKB before batch spend.']
      : []),
  ]);

  return {
    gatekeeper_id: `gatekeeper_${Date.now().toString(36)}`,
    phase: GATEKEEPER_PHASE,
    timestamp: new Date().toISOString(),
    dashboard_source: AUDITOR_DASHBOARD_JSON_PATH,
    project_gate,
    gate_status: projectGateEval.gate_status,
    gate_reason: projectGateEval.gate_reason,
    promotion_allowed: projectGateEval.gate_status !== 'BLOCK',
    blocking_items: Object.freeze(projectGateEval.blocking_items),
    warning_items: Object.freeze(projectGateEval.warning_items),
    recommended_actions,
    promotion_simulations,
    final_verdict: GATEKEEPER_PASS_VERDICT,
  };
}

export function validateGatekeeperFixtures(report: AuditorGatekeeperReport): {
  pass: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const full = report.promotion_simulations.find((s) => s.candidate_id === 'dataset16-full');
  const v2 = report.promotion_simulations.find((s) => s.candidate_id === 'dataset16-v2');

  if (!full || full.gate_status !== 'BLOCK') {
    violations.push(`Dataset #16 Full expected BLOCK, got ${full?.gate_status ?? 'missing'}`);
  }
  if (!full?.blocking_items.some((b) => b.includes('identity-threatening') || b.includes('must_show'))) {
    violations.push('Dataset #16 Full missing identity-threatening blocking reason');
  }

  if (!v2 || (v2.gate_status !== 'ALLOW' && v2.gate_status !== 'ALLOW_WITH_WARNING')) {
    violations.push(`Dataset #16 V2 expected ALLOW or ALLOW_WITH_WARNING, got ${v2?.gate_status ?? 'missing'}`);
  }
  if (!v2?.promotion_allowed) {
    violations.push('Dataset #16 V2 promotion should be allowed');
  }

  return { pass: violations.length === 0, violations };
}

export function writeAuditorGatekeeperReport(projectRoot?: string): AuditorGatekeeperReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runAuditorGatekeeper(root);
  const validation = validateGatekeeperFixtures(report);

  const finalReport: AuditorGatekeeperReport = {
    ...report,
    final_verdict: validation.pass ? GATEKEEPER_PASS_VERDICT : GATEKEEPER_FAIL_VERDICT,
  };

  const payload = {
    ...finalReport,
    report_type: 'auditor_gatekeeper_report',
    report_version: 'v1',
    export_path: GATEKEEPER_REPORT_PATH,
    next_phase: 'PHASE-AUDITOR-009 SELF_HEALING_RECOMMENDATION_ENGINE_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, GATEKEEPER_REPORT_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );

  return finalReport;
}
