import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  DATASET16_FULL_FIXTURE_PATH,
  DATASET16_V2_FIXTURE_PATH,
  GATEKEEPER_REPORT_PATH,
  type PromotionCandidateResult,
  type GateStatus,
} from './auditorGatekeeper.js';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SELF_HEALING_PHASE = 'PHASE-AUDITOR-009' as const;
export const SELF_HEALING_PASS_VERDICT = 'PASS_SELF_HEALING_RECOMMENDATION_ENGINE_V1' as const;
export const SELF_HEALING_FAIL_VERDICT = 'FAIL_SELF_HEALING_RECOMMENDATION_ENGINE_V1' as const;
export const SELF_HEALING_JSON_PATH = 'reports/self-healing-recommendation-report.json' as const;
export const SELF_HEALING_MD_PATH = 'reports/SELF_HEALING_RECOMMENDATION.md' as const;

export const IDENTITY_DRIFT_REPORT_PATH = 'reports/identity-drift-predictor-report.json' as const;
export const CONFLICT_DETECTOR_REPORT_PATH = 'reports/dataset-conflict-detector-report.json' as const;

export const DATASET16_FULL_HEALING_EXPECTATIONS_PATH =
  'reports/fixtures/dataset16-full-healing-expectations.json' as const;
export const DATASET16_V2_HEALING_EXPECTATIONS_PATH =
  'reports/fixtures/dataset16-v2-healing-expectations.json' as const;

export type RecommendationCategory =
  | 'identity_override_fix'
  | 'hard_enforcement_softening'
  | 'priority_order_repair'
  | 'token_pressure_reduction'
  | 'adapter_split_recommendation'
  | 'latest_sync_safety'
  | 'regression_test_recommendation';

export type RecommendedEdit = {
  category: RecommendationCategory;
  field_path: string;
  current_pattern: string;
  recommended_action: string;
  safe_replacement_pattern: string;
};

export type DangerousField = {
  json_path: string;
  value: string;
  threat_type: string;
};

export type CandidateFixPlan = {
  candidate_id: string;
  candidate_file: string;
  blocked_status: GateStatus;
  promotion_allowed: boolean;
  fix_required: boolean;
  primary_causes: readonly string[];
  dangerous_fields: readonly DangerousField[];
  recommended_edits: readonly RecommendedEdit[];
  safe_replacement_patterns: readonly string[];
  required_verifications: readonly string[];
  recommendation_categories: readonly RecommendationCategory[];
  estimated_risk_after_fix: {
    aggregate_risk: number;
    identity_risk: number;
    risk_level: string;
    promotion_gate: GateStatus;
  };
};

export type SelfHealingRecommendationReport = {
  engine_id: string;
  phase: typeof SELF_HEALING_PHASE;
  timestamp: string;
  inputs: {
    gatekeeper_report: string;
    dashboard_summary: string;
    identity_drift_report: string;
    conflict_detector_report: string;
  };
  candidate_plans: readonly CandidateFixPlan[];
  final_verdict: typeof SELF_HEALING_PASS_VERDICT | typeof SELF_HEALING_FAIL_VERDICT;
};

const EXCLUDED_SCAN_KEYS = new Set([
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

const INJECTABLE_KEYS = new Set([
  'layout_tokens',
  'priority_tokens',
  'tokens',
  'visual_memory_tokens',
  'spatial_tokens',
]);

const SAFE_REPLACEMENT_PATTERNS = Object.freeze([
  'landmark-preference:{landmark_id}',
  'environment-supporting-elements:{landmark_a}_{landmark_b}',
  'camera-preference:prefer_{context}_character_foreground_priority',
  'character-priority:identity_over_environment',
  'priority_order: [character_identity, character_reference, character_continuity, location_continuity, environment_details]',
]);

type ThreatScan = {
  dangerous_fields: DangerousField[];
  primary_causes: string[];
};

function walkDangerousFields(
  value: unknown,
  jsonPath: string,
  parentKey: string | null,
  out: DangerousField[],
  causes: Set<string>
): void {
  if (parentKey && EXCLUDED_SCAN_KEYS.has(parentKey)) return;

  if (typeof value === 'string') {
    const colonIndex = value.indexOf(':');
    const hasSuffix = colonIndex >= 0 && colonIndex < value.length - 1;

    if (/^landmark-visibility:must_show_/i.test(value)) {
      out.push({
        json_path: jsonPath,
        value,
        threat_type: 'landmark-visibility:must_show_*',
      });
      causes.add('Injectable landmark-visibility:must_show_* tokens override character foreground');
    } else if (hasSuffix && /^camera-visibility:/i.test(value)) {
      out.push({ json_path: jsonPath, value, threat_type: 'camera-visibility:' });
      causes.add('camera-visibility: tokens hard-bind camera framing over character identity');
    } else if (hasSuffix && /^walkable-zone:/i.test(value)) {
      out.push({ json_path: jsonPath, value, threat_type: 'walkable-zone:' });
      causes.add('walkable-zone: tokens add spatial enforcement pressure');
    }

    if (
      jsonPath.includes('secondary_validation') &&
      /\bfail if ignored\b/i.test(value) &&
      !/no fail/i.test(value)
    ) {
      out.push({
        json_path: jsonPath,
        value,
        threat_type: 'FAIL-if-ignored',
      });
      causes.add('FAIL-if-ignored enforcement in runtime_verification_fields');
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      walkDangerousFields(item, `${jsonPath}[${index}]`, parentKey, out, causes);
    });
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const nextPath = jsonPath ? `${jsonPath}.${key}` : key;
      if (INJECTABLE_KEYS.has(key) && Array.isArray(child)) {
        child.forEach((item, index) => {
          walkDangerousFields(item, `${nextPath}[${index}]`, key, out, causes);
        });
        continue;
      }
      walkDangerousFields(child, nextPath, key, out, causes);
    }
  }
}

function scanCandidateThreats(doc: Record<string, unknown>): ThreatScan {
  const dangerous_fields: DangerousField[] = [];
  const causes = new Set<string>();
  walkDangerousFields(doc, '', null, dangerous_fields, causes);
  return {
    dangerous_fields,
    primary_causes: [...causes],
  };
}

function hasPriorityOrder(doc: Record<string, unknown>): boolean {
  const contract = doc.image_app_token_contract as { priority_order?: unknown } | undefined;
  return Array.isArray(contract?.priority_order) && contract.priority_order.length > 0;
}

function countInjectableTokens(doc: Record<string, unknown>): number {
  const scan = scanCandidateThreats(doc);
  const layoutTokenPaths = scan.dangerous_fields.filter((f) => f.json_path.includes('layout_tokens'));
  return layoutTokenPaths.length > 0
    ? layoutTokenPaths.length
    : scan.dangerous_fields.filter((f) => f.threat_type !== 'FAIL-if-ignored').length;
}

function suggestReplacement(token: string, threatType: string): string {
  if (threatType === 'landmark-visibility:must_show_*') {
    const landmark = token.replace(/^landmark-visibility:must_show_/i, '');
    return `landmark-preference:${landmark}`;
  }
  if (threatType === 'camera-visibility:') {
    const context = token.replace(/^camera-visibility:/i, '');
    return `camera-preference:prefer_${context}_character_foreground_priority`;
  }
  if (threatType === 'walkable-zone:') {
    return 'Remove walkable-zone token; retain outdoor-orientation and landmark-position locks only';
  }
  if (threatType === 'FAIL-if-ignored') {
    return 'Soft outdoor guidance only; character identity has higher priority than environment details. No FAIL-if-ignored enforcement.';
  }
  return 'Review token against character-first-contract';
}

function buildRecommendedEdits(
  dangerous_fields: DangerousField[],
  doc: Record<string, unknown>
): RecommendedEdit[] {
  const edits: RecommendedEdit[] = [];
  const seen = new Set<string>();

  for (const field of dangerous_fields) {
    const key = `${field.threat_type}:${field.json_path}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (field.threat_type === 'landmark-visibility:must_show_*') {
      edits.push({
        category: 'identity_override_fix',
        field_path: field.json_path,
        current_pattern: 'landmark-visibility:must_show_*',
        recommended_action: 'Replace hard landmark visibility enforcement with soft landmark preference',
        safe_replacement_pattern: suggestReplacement(field.value, field.threat_type),
      });
    } else if (field.threat_type === 'camera-visibility:') {
      edits.push({
        category: 'hard_enforcement_softening',
        field_path: field.json_path,
        current_pattern: 'camera-visibility:',
        recommended_action: 'Replace camera-visibility enforcement with camera-preference guidance',
        safe_replacement_pattern: suggestReplacement(field.value, field.threat_type),
      });
    } else if (field.threat_type === 'walkable-zone:') {
      edits.push({
        category: 'token_pressure_reduction',
        field_path: field.json_path,
        current_pattern: 'walkable-zone:',
        recommended_action: 'Remove walkable-zone spatial enforcement from injectable layout_tokens',
        safe_replacement_pattern: suggestReplacement(field.value, field.threat_type),
      });
    } else if (field.threat_type === 'FAIL-if-ignored') {
      edits.push({
        category: 'hard_enforcement_softening',
        field_path: field.json_path,
        current_pattern: 'FAIL if ignored',
        recommended_action: 'Remove hard fail enforcement or downgrade to soft validation note',
        safe_replacement_pattern: suggestReplacement(field.value, field.threat_type),
      });
    }
  }

  if (!hasPriorityOrder(doc)) {
    edits.push({
      category: 'priority_order_repair',
      field_path: 'image_app_token_contract.priority_order',
      current_pattern: 'missing or empty',
      recommended_action: 'Add character-first priority_order before promotion',
      safe_replacement_pattern:
        '["character_identity","character_reference","character_continuity","location_continuity","environment_details"]',
    });
  }

  const tokenCount = countInjectableTokens(doc);
  if (tokenCount >= 12) {
    edits.push({
      category: 'adapter_split_recommendation',
      field_path: 'location_to_outdoor_layout_map',
      current_pattern: `${tokenCount} high-pressure injectable tokens`,
      recommended_action:
        'Split full outdoor adapter into v2-safe rebuild; keep full_reference as audit-only archive',
      safe_replacement_pattern:
        'exports/image_app/adapters/outdoor-layout-lock-adapter-v2.json (character-first token mode)',
    });
  }

  return edits;
}

function buildRequiredVerifications(
  candidatePath: string,
  gateSim: PromotionCandidateResult | undefined,
  dashboard: Record<string, unknown> | null,
  fixRequired: boolean
): string[] {
  const verifications = [
    'npm run verify:auditor-gatekeeper',
    'npm run verify:project-auditor',
    'npm run verify:identity-drift-predictor',
    'npm run verify:dataset-conflict-detector',
  ];

  if (fixRequired) {
    verifications.push(
      'npm run verify:pre-generation-simulator — confirm watch/skip slots after token softening',
      `Re-run gatekeeper simulation on repaired candidate (not ${candidatePath} full_reference)`
    );
  }

  const watchSlots = (dashboard?.watch_slots as string[] | undefined) ?? [];
  if (watchSlots.length > 0) {
    verifications.push(
      `npm run verify:generation-feedback — validate watch slots: ${watchSlots.slice(0, 3).join(', ')}`
    );
  }

  if (gateSim?.gate_status === 'BLOCK') {
    verifications.push('Do not copy candidate into exports/image_app/latest/ until gate_status is ALLOW');
  }

  return verifications;
}

function estimateRiskAfterFix(
  identityReport: Record<string, unknown> | null,
  dashboard: Record<string, unknown> | null,
  fixRequired: boolean
): CandidateFixPlan['estimated_risk_after_fix'] {
  const identityRisk = Number(identityReport?.overall_identity_risk ?? 17);
  const aggregateRisk = Number(dashboard?.aggregate_risk ?? 32);
  const adjustedAggregate = fixRequired ? Math.max(18, aggregateRisk - 14) : aggregateRisk;
  const adjustedIdentity = fixRequired ? Math.max(8, identityRisk - 6) : identityRisk;
  const level =
    adjustedAggregate > 60 ? 'HIGH' : adjustedAggregate > 35 ? 'MODERATE' : adjustedIdentity > 25 ? 'MODERATE' : 'LOW';
  const promotion_gate: GateStatus = fixRequired
    ? dashboard && ((dashboard.watch_slots as string[] | undefined)?.length ?? 0) > 0
      ? 'ALLOW_WITH_WARNING'
      : 'ALLOW'
    : 'ALLOW_WITH_WARNING';

  return {
    aggregate_risk: adjustedAggregate,
    identity_risk: adjustedIdentity,
    risk_level: level,
    promotion_gate,
  };
}

function enrichFromConflictReport(
  candidatePath: string,
  conflictReport: Record<string, unknown> | null,
  causes: string[]
): void {
  const suspects = (conflictReport?.top_suspects as Array<{ file_path?: string; evidence_summary?: string }>) ?? [];
  const match = suspects.find(
    (s) =>
      s.file_path === candidatePath ||
      candidatePath.includes('outdoor-layout-lock') &&
        String(s.file_path ?? '').includes('outdoor-layout-lock')
  );
  if (match?.evidence_summary) {
    causes.push(`Conflict detector evidence: ${match.evidence_summary}`);
  }
}

function enrichFromIdentityReport(
  candidatePath: string,
  identityReport: Record<string, unknown> | null,
  causes: string[]
): void {
  const dimensions = identityReport?.dimensions as Record<string, { findings?: Array<{ message?: string; source?: string }> }> | undefined;
  if (!dimensions) return;
  for (const dim of Object.values(dimensions)) {
    for (const finding of dim.findings ?? []) {
      if (
        finding.message?.includes('enforcement token') ||
        finding.message?.includes('override face') ||
        String(finding.source ?? '').includes('outdoor-layout')
      ) {
        causes.push(finding.message ?? 'Identity drift enforcement risk');
      }
    }
  }
  if (candidatePath.includes('full_reference')) {
    causes.push('Full-reference adapter retains Dataset #16 regression token profile');
  }
}

export function buildCandidateFixPlan(
  projectRoot: string,
  candidateId: string,
  candidatePath: string,
  gateSim: PromotionCandidateResult | undefined,
  dashboard: Record<string, unknown> | null,
  identityReport: Record<string, unknown> | null,
  conflictReport: Record<string, unknown> | null
): CandidateFixPlan {
  const root = resolveProjectRoot(projectRoot);
  const absPath = path.join(root, candidatePath);
  const doc = fs.existsSync(absPath)
    ? (JSON.parse(fs.readFileSync(absPath, 'utf8')) as Record<string, unknown>)
    : {};

  const scan = scanCandidateThreats(doc);
  const primary_causes = [...scan.primary_causes];
  enrichFromConflictReport(candidatePath, conflictReport, primary_causes);
  enrichFromIdentityReport(candidatePath, identityReport, primary_causes);

  const blocked_status = gateSim?.gate_status ?? 'BLOCK';
  const promotion_allowed = gateSim?.promotion_allowed ?? false;
  const fix_required = blocked_status === 'BLOCK' || scan.dangerous_fields.length > 0;

  let recommended_edits = buildRecommendedEdits(scan.dangerous_fields, doc);

  if (fix_required && !hasPriorityOrder(doc)) {
    primary_causes.push('Missing character-first priority_order in image_app_token_contract');
  }

  if (!fix_required) {
    recommended_edits = [];
    if ((dashboard?.watch_slots as string[] | undefined)?.length) {
      recommended_edits = [
        {
          category: 'regression_test_recommendation',
          field_path: 'project.watch_slots',
          current_pattern: 'watch_slots > 0',
          recommended_action: 'No adapter fix required; run calibrated pre-generation on watch slots before batch spend',
          safe_replacement_pattern: 'npm run verify:pre-generation-simulator',
        },
      ];
    }
  } else {
    recommended_edits.push({
      category: 'latest_sync_safety',
      field_path: 'exports/image_app/latest/',
      current_pattern: 'promotion blocked',
      recommended_action: 'Do not sync full adapter to latest/; promote v2-safe rebuild only after gatekeeper ALLOW',
      safe_replacement_pattern: 'exports/image_app/adapters/outdoor-layout-lock-adapter-v2.json',
    });
    recommended_edits.push({
      category: 'regression_test_recommendation',
      field_path: 'reports/fixtures/MDS005_15_IMAGE_PRODUCTION_TEST_V2_16_FULL_FORMAT.json',
      current_pattern: 'Dataset #16 regression fixture',
      recommended_action: 'Retest MDS005 outdoor slots after applying v2-safe token replacements',
      safe_replacement_pattern: 'npm run verify:pre-generation-simulator && npm run verify:generation-feedback',
    });
  }

  const categories = [...new Set(recommended_edits.map((e) => e.category))] as RecommendationCategory[];

  return {
    candidate_id: candidateId,
    candidate_file: candidatePath,
    blocked_status,
    promotion_allowed,
    fix_required,
    primary_causes: Object.freeze([...new Set(primary_causes)]),
    dangerous_fields: Object.freeze(scan.dangerous_fields),
    recommended_edits: Object.freeze(recommended_edits),
    safe_replacement_patterns: Object.freeze([...SAFE_REPLACEMENT_PATTERNS]),
    required_verifications: Object.freeze(
      buildRequiredVerifications(candidatePath, gateSim, dashboard, fix_required)
    ),
    recommendation_categories: Object.freeze(categories),
    estimated_risk_after_fix: estimateRiskAfterFix(identityReport, dashboard, fix_required),
  };
}

export function runSelfHealingRecommendationEngine(projectRoot?: string): SelfHealingRecommendationReport {
  const root = resolveProjectRoot(projectRoot);

  const gatekeeper = readJsonRecord(root, GATEKEEPER_REPORT_PATH) as {
    promotion_simulations?: PromotionCandidateResult[];
  } | null;
  const dashboard = readJsonRecord(root, AUDITOR_DASHBOARD_JSON_PATH);
  const identityReport = readJsonRecord(root, IDENTITY_DRIFT_REPORT_PATH);
  const conflictReport = readJsonRecord(root, CONFLICT_DETECTOR_REPORT_PATH);

  if (!gatekeeper?.promotion_simulations?.length) {
    throw new Error(`Missing or empty ${GATEKEEPER_REPORT_PATH}`);
  }

  const fullFixture = JSON.parse(
    fs.readFileSync(path.join(root, DATASET16_FULL_FIXTURE_PATH), 'utf8')
  ) as { candidate_id: string; candidate_path: string };
  const v2Fixture = JSON.parse(
    fs.readFileSync(path.join(root, DATASET16_V2_FIXTURE_PATH), 'utf8')
  ) as { candidate_id: string; candidate_path: string };

  const fullSim = gatekeeper.promotion_simulations.find((s) => s.candidate_id === 'dataset16-full');
  const v2Sim = gatekeeper.promotion_simulations.find((s) => s.candidate_id === 'dataset16-v2');

  const candidate_plans = Object.freeze([
    buildCandidateFixPlan(
      root,
      fullFixture.candidate_id,
      fullFixture.candidate_path,
      fullSim,
      dashboard,
      identityReport,
      conflictReport
    ),
    buildCandidateFixPlan(
      root,
      v2Fixture.candidate_id,
      v2Fixture.candidate_path,
      v2Sim,
      dashboard,
      identityReport,
      conflictReport
    ),
  ]);

  return {
    engine_id: `self_healing_${Date.now().toString(36)}`,
    phase: SELF_HEALING_PHASE,
    timestamp: new Date().toISOString(),
    inputs: {
      gatekeeper_report: GATEKEEPER_REPORT_PATH,
      dashboard_summary: AUDITOR_DASHBOARD_JSON_PATH,
      identity_drift_report: IDENTITY_DRIFT_REPORT_PATH,
      conflict_detector_report: CONFLICT_DETECTOR_REPORT_PATH,
    },
    candidate_plans,
    final_verdict: SELF_HEALING_PASS_VERDICT,
  };
}

function renderCandidateMarkdown(plan: CandidateFixPlan): string {
  const problem =
    plan.fix_required
      ? `Promotion blocked for \`${plan.candidate_file}\` (${plan.blocked_status}).`
      : `No adapter repair required for \`${plan.candidate_file}\` (${plan.blocked_status}).`;

  const cause =
    plan.primary_causes.length > 0
      ? plan.primary_causes.map((c) => `- ${c}`).join('\n')
      : '- Project watch slots only; adapter token mode is v2-safe.';

  const fixPlan =
    plan.recommended_edits.length > 0
      ? plan.recommended_edits
          .map(
            (e) =>
              `- **${e.category}** @ \`${e.field_path}\`: ${e.recommended_action} → \`${e.safe_replacement_pattern}\``
          )
          .join('\n')
      : '- None required.';

  const retest = plan.required_verifications.map((v) => `- ${v}`).join('\n');

  const expected = plan.fix_required
    ? `Gatekeeper \`${plan.estimated_risk_after_fix.promotion_gate}\`, estimated aggregate risk ${plan.estimated_risk_after_fix.aggregate_risk} (${plan.estimated_risk_after_fix.risk_level}), identity risk ${plan.estimated_risk_after_fix.identity_risk}.`
    : `Promotion allowed with warning; continue monitoring watch slots. Estimated risk unchanged (aggregate ${plan.estimated_risk_after_fix.aggregate_risk}).`;

  return [
    `## ${plan.candidate_id}`,
    '',
    '### Problem',
    problem,
    '',
    '### Cause',
    cause,
    '',
    '### Fix Plan',
    fixPlan,
    '',
    '### Retest Plan',
    retest,
    '',
    '### Expected Result',
    expected,
    '',
  ].join('\n');
}

export function renderSelfHealingMarkdown(report: SelfHealingRecommendationReport): string {
  const sections = report.candidate_plans.map(renderCandidateMarkdown).join('\n');
  return [
    '# Self-Healing Recommendation Report',
    '',
    `**Phase:** ${report.phase}`,
    `**Generated:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    sections,
    '---',
    '',
    '**Next phase:** PHASE-AUDITOR-010 AUDITOR_RELEASE_PIPELINE_V1',
    '',
  ].join('\n');
}

export function validateSelfHealingFixtures(report: SelfHealingRecommendationReport): {
  pass: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const full = report.candidate_plans.find((p) => p.candidate_id === 'dataset16-full');
  const v2 = report.candidate_plans.find((p) => p.candidate_id === 'dataset16-v2');

  if (!full?.fix_required) {
    violations.push('Dataset #16 Full must require fix');
  }
  if (full?.blocked_status !== 'BLOCK') {
    violations.push(`Dataset #16 Full expected BLOCK, got ${full?.blocked_status}`);
  }

  const fullPatterns = (full?.recommended_edits ?? []).map((e) => e.current_pattern.toLowerCase());
  const requiredFull = [
    'landmark-visibility:must_show_*',
    'camera-visibility:',
    'walkable-zone:',
    'fail if ignored',
  ];
  for (const pattern of requiredFull) {
    if (!fullPatterns.some((p) => p.includes(pattern.replace('*', '')) || p.includes(pattern))) {
      violations.push(`Dataset #16 Full missing recommendation for ${pattern}`);
    }
  }
  if (!full?.recommended_edits.some((e) => e.category === 'priority_order_repair')) {
    violations.push('Dataset #16 Full missing priority_order_repair recommendation');
  }

  if (v2?.fix_required) {
    violations.push('Dataset #16 V2 must not require fix');
  }
  if (!v2?.promotion_allowed) {
    violations.push('Dataset #16 V2 promotion should be allowed');
  }
  if (v2 && v2.blocked_status !== 'ALLOW' && v2.blocked_status !== 'ALLOW_WITH_WARNING') {
    violations.push(`Dataset #16 V2 expected ALLOW or ALLOW_WITH_WARNING, got ${v2.blocked_status}`);
  }

  return { pass: violations.length === 0, violations };
}

export function writeSelfHealingRecommendationReport(projectRoot?: string): SelfHealingRecommendationReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSelfHealingRecommendationEngine(root);
  const validation = validateSelfHealingFixtures(report);

  const finalReport: SelfHealingRecommendationReport = {
    ...report,
    final_verdict: validation.pass ? SELF_HEALING_PASS_VERDICT : SELF_HEALING_FAIL_VERDICT,
  };

  const jsonPayload = {
    ...finalReport,
    report_type: 'self_healing_recommendation_report',
    report_version: 'v1',
    export_path: SELF_HEALING_JSON_PATH,
    next_phase: 'PHASE-AUDITOR-010 AUDITOR_RELEASE_PIPELINE_V1',
    candidate_plans: finalReport.candidate_plans.map((plan) => ({
      candidate_file: plan.candidate_file,
      blocked_status: plan.blocked_status,
      primary_causes: plan.primary_causes,
      dangerous_fields: plan.dangerous_fields,
      recommended_edits: plan.recommended_edits,
      safe_replacement_patterns: plan.safe_replacement_patterns,
      required_verifications: plan.required_verifications,
      estimated_risk_after_fix: plan.estimated_risk_after_fix,
      candidate_id: plan.candidate_id,
      promotion_allowed: plan.promotion_allowed,
      fix_required: plan.fix_required,
      recommendation_categories: plan.recommendation_categories,
    })),
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, SELF_HEALING_JSON_PATH),
    `${JSON.stringify(jsonPayload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, SELF_HEALING_MD_PATH),
    renderSelfHealingMarkdown(finalReport),
    'utf8'
  );

  return finalReport;
}
