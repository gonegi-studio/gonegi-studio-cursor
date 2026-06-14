import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const AUDITOR_DASHBOARD_PHASE = 'PHASE-AUDITOR-007' as const;
export const AUDITOR_DASHBOARD_PASS_VERDICT = 'PASS_AUDITOR_DASHBOARD_SUMMARY_V1' as const;
export const AUDITOR_DASHBOARD_FAIL_VERDICT = 'FAIL_AUDITOR_DASHBOARD_SUMMARY_V1' as const;
export const AUDITOR_DASHBOARD_JSON_PATH = 'reports/auditor-dashboard-summary.json' as const;
export const AUDITOR_DASHBOARD_MD_PATH = 'reports/AUDITOR_DASHBOARD_SUMMARY.md' as const;

export const UPSTREAM_REPORT_PATHS = Object.freeze([
  'reports/project-auditor-report.json',
  'reports/dataset-conflict-detector-report.json',
  'reports/identity-drift-predictor-report.json',
  'reports/pre-generation-simulator-report.json',
  'reports/generation-feedback-report.json',
  'reports/simulator-calibration-report.json',
] as const);

export type DashboardStatus = 'BLOCKED' | 'READY_FOR_TEST' | 'READY_WITH_CAUTION';

export type AuditorDashboardSummary = {
  dashboard_id: string;
  phase: typeof AUDITOR_DASHBOARD_PHASE;
  timestamp: string;
  project_status: DashboardStatus;
  aggregate_risk: number;
  aggregate_risk_level: string;
  identity_risk: number;
  conflict_risk: number;
  generation_risk: number;
  calibrated_expected_pass_rate: number;
  actual_pass_rate: number;
  safe_slots: readonly string[];
  watch_slots: readonly string[];
  skip_slots: readonly string[];
  top_warnings: readonly string[];
  recommended_next_actions: readonly string[];
  do_not_touch_list: readonly string[];
  critical_errors: number;
  upstream_reports: readonly { path: string; present: boolean; verdict: string | null }[];
  source_verdicts: Record<string, string | null>;
  final_verdict: typeof AUDITOR_DASHBOARD_PASS_VERDICT | typeof AUDITOR_DASHBOARD_FAIL_VERDICT;
};

function riskLevel(score: number): string {
  if (score >= 61) return 'CRITICAL';
  if (score >= 41) return 'HIGH';
  if (score >= 21) return 'MODERATE';
  return 'LOW';
}

function buildDoNotTouchList(latestFiles: string[]): string[] {
  const base = [
    'Master Core',
    'Character Book',
    'Character TXT',
    'working latest/ upload set',
    'exports/image_app/latest/outdoor-layout-lock-adapter.json (v2 production variant)',
    'exports/image_app/adapters/outdoor-layout-lock-adapter-v2.json',
    'exports/image_app/latest/character-first-contract.json',
  ];
  for (const file of latestFiles.slice(0, 5)) {
    base.push(`exports/image_app/latest/${file}`);
  }
  return [...new Set(base)];
}

function collectTopWarnings(
  projectAuditor: Record<string, unknown> | null,
  identityDrift: Record<string, unknown> | null,
  preGen: Record<string, unknown> | null,
  feedback: Record<string, unknown> | null
): string[] {
  const warnings: string[] = [];

  if (projectAuditor && Array.isArray(projectAuditor.warnings)) {
    for (const w of projectAuditor.warnings.slice(0, 4)) {
      if (w && typeof w === 'object' && 'message' in w) {
        warnings.push(String((w as { message: string }).message));
      }
    }
  }

  const driftRecs = identityDrift?.recommended_actions;
  if (Array.isArray(driftRecs) && driftRecs.length > 0) {
    warnings.push(String(driftRecs[0]));
  }

  const patterns = feedback?.failure_patterns;
  if (Array.isArray(patterns)) {
    for (const p of patterns.slice(0, 2)) warnings.push(String(p));
  }

  const watch = (preGen?.quota_recommendation as { watch_slots?: string[] } | undefined)
    ?.watch_slots;
  if (watch && watch.length > 0) {
    warnings.push(`${watch.length} generation slot(s) flagged watch after calibration.`);
  }

  return warnings.slice(0, 8);
}

function buildRecommendedActions(
  status: DashboardStatus,
  watchSlots: string[],
  safeSlots: string[],
  feedback: Record<string, unknown> | null
): string[] {
  const actions: string[] = [];

  if (status === 'BLOCKED') {
    actions.push('Resolve critical auditor errors before any new uploads or generation batch.');
    return actions;
  }

  if (safeSlots.length > 0) {
    actions.push(
      `Spend free quota on safe slots first (${safeSlots.slice(0, 3).join(', ')}${safeSlots.length > 3 ? ', …' : ''}).`
    );
  }

  if (watchSlots.length > 0) {
    actions.push(
      `Review watch slots before render: ${watchSlots.join(', ')}.`
    );
    actions.push('Prefer medium/close shots on outdoor layout slots to protect character foreground.');
  }

  const weightUpdates = feedback?.suggested_simulator_weight_updates;
  if (Array.isArray(weightUpdates) && weightUpdates.length > 0) {
    actions.push('Simulator calibration applied — re-run pre-generation check before each batch.');
  }

  actions.push('Run RKB validation only on watch slots if quota is limited.');
  actions.push('Do not promote new adapters to latest/ without PHASE-AUDITOR-008 gatekeeper approval.');

  return actions;
}

function resolveProjectStatus(
  criticalErrors: number,
  aggregateRiskLevel: string,
  skipSlots: number,
  watchSlots: number
): DashboardStatus {
  if (criticalErrors > 0) return 'BLOCKED';
  if (watchSlots > 0) return 'READY_WITH_CAUTION';
  if ((aggregateRiskLevel === 'LOW' || aggregateRiskLevel === 'MODERATE') && skipSlots === 0) {
    return 'READY_FOR_TEST';
  }
  return 'READY_WITH_CAUTION';
}

export function buildAuditorDashboardSummary(projectRoot: string): AuditorDashboardSummary {
  const root = resolveProjectRoot(projectRoot);

  const upstream_reports = UPSTREAM_REPORT_PATHS.map((rel) => {
    const present = fs.existsSync(path.join(root, rel));
    const doc = present ? readJsonRecord(root, rel) : null;
    const verdict =
      doc && typeof doc.final_verdict === 'string' ? doc.final_verdict : null;
    return { path: rel, present, verdict };
  });

  const missing = upstream_reports.filter((r) => !r.present);
  if (missing.length > 0) {
    throw new Error(`Missing upstream reports: ${missing.map((m) => m.path).join(', ')}`);
  }

  const projectAuditor = readJsonRecord(root, UPSTREAM_REPORT_PATHS[0])!;
  const conflictDetector = readJsonRecord(root, UPSTREAM_REPORT_PATHS[1])!;
  const identityDrift = readJsonRecord(root, UPSTREAM_REPORT_PATHS[2])!;
  const preGen = readJsonRecord(root, UPSTREAM_REPORT_PATHS[3])!;
  const feedback = readJsonRecord(root, UPSTREAM_REPORT_PATHS[4])!;
  const calibration = readJsonRecord(root, UPSTREAM_REPORT_PATHS[5])!;

  const identity_risk = Number(identityDrift.overall_identity_risk ?? 0);
  const conflict_risk = Math.max(
    Number(projectAuditor.adapter_risk_score ?? 0),
    Number(projectAuditor.continuity_risk_score ?? 0)
  );
  const generation_risk = Number(preGen.overall_risk ?? 0);
  const projectRisk = Number(projectAuditor.risk_score ?? 0);

  const aggregate_risk = Math.max(identity_risk, conflict_risk, generation_risk, projectRisk);
  const aggregate_risk_level = riskLevel(aggregate_risk);

  const quota = preGen.quota_recommendation as
    | {
        safe_slots?: string[];
        watch_slots?: string[];
        skip_or_rewrite_slots?: string[];
      }
    | undefined;

  const safe_slots = Object.freeze(quota?.safe_slots ?? []);
  const watch_slots = Object.freeze(quota?.watch_slots ?? []);
  const skip_slots = Object.freeze(quota?.skip_or_rewrite_slots ?? []);

  const calibrated_expected_pass_rate = Number(
    calibration.calibrated_expected_pass_rate ?? preGen.expected_pass_rate ?? 0
  );
  const actual_pass_rate = Number(
    (feedback.summary as { actual_pass_rate?: number } | undefined)?.actual_pass_rate ??
      calibration.actual_pass_rate ??
      0
  );

  const critical_errors =
    (Array.isArray(projectAuditor.errors) ? projectAuditor.errors.length : 0) +
    Number(identityDrift.critical_findings_count ?? 0) +
    Number(
      (preGen.generation_risk_estimate as { critical_slot_count?: number } | undefined)
        ?.critical_slot_count ?? 0
    ) +
    Number((feedback.summary as { fail_count?: number } | undefined)?.fail_count ?? 0);

  const project_status = resolveProjectStatus(
    critical_errors,
    aggregate_risk_level,
    skip_slots.length,
    watch_slots.length
  );

  const latestFiles = Array.isArray(preGen.upload_set_files)
    ? (preGen.upload_set_files as string[])
    : [];

  const top_warnings = Object.freeze(
    collectTopWarnings(projectAuditor, identityDrift, preGen, feedback)
  );

  const recommended_next_actions = Object.freeze(
    buildRecommendedActions(project_status, [...watch_slots], [...safe_slots], feedback)
  );

  const do_not_touch_list = Object.freeze(buildDoNotTouchList(latestFiles));

  const pass =
    project_status !== 'BLOCKED' &&
    calibrated_expected_pass_rate > 0 &&
    upstream_reports.every((r) => r.present);

  return {
    dashboard_id: `auditor_dashboard_${Date.now().toString(36)}`,
    phase: AUDITOR_DASHBOARD_PHASE,
    timestamp: new Date().toISOString(),
    project_status,
    aggregate_risk,
    aggregate_risk_level,
    identity_risk,
    conflict_risk,
    generation_risk,
    calibrated_expected_pass_rate,
    actual_pass_rate,
    safe_slots,
    watch_slots,
    skip_slots,
    top_warnings,
    recommended_next_actions,
    do_not_touch_list,
    critical_errors,
    upstream_reports: Object.freeze(upstream_reports),
    source_verdicts: {
      project_auditor: String(projectAuditor.final_verdict ?? ''),
      conflict_detector: String(conflictDetector.final_verdict ?? ''),
      identity_drift: String(identityDrift.final_verdict ?? ''),
      pre_generation_simulator: String(preGen.final_verdict ?? ''),
      generation_feedback: String(feedback.final_verdict ?? ''),
      simulator_calibration: String(calibration.final_verdict ?? ''),
    },
    final_verdict: pass ? AUDITOR_DASHBOARD_PASS_VERDICT : AUDITOR_DASHBOARD_FAIL_VERDICT,
  };
}

export function renderAuditorDashboardMarkdown(summary: AuditorDashboardSummary): string {
  const lines: string[] = [
    '# Auditor Dashboard Summary',
    '',
    `**Phase:** ${summary.phase}`,
    `**Generated:** ${summary.timestamp}`,
    `**Verdict:** ${summary.final_verdict}`,
    '',
    '## Current Status',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| Project status | **${summary.project_status}** |`,
    `| Aggregate risk | ${summary.aggregate_risk} (${summary.aggregate_risk_level}) |`,
    `| Critical errors | ${summary.critical_errors} |`,
    '',
    '## Identity Stability',
    '',
    `- Identity risk score: **${summary.identity_risk}**`,
    `- Source: \`identity-drift-predictor-report.json\` → ${summary.source_verdicts.identity_drift}`,
    '',
    '## Dataset Conflict Risk',
    '',
    `- Conflict risk score: **${summary.conflict_risk}** (adapter + continuity exposure)`,
    `- Conflict detector: ${summary.source_verdicts.conflict_detector}`,
    '',
    '## Generation Prediction',
    '',
    `- Generation risk score: **${summary.generation_risk}**`,
    `- Calibrated expected pass rate: **${(summary.calibrated_expected_pass_rate * 100).toFixed(1)}%**`,
    `- Source: \`pre-generation-simulator-report.json\` → ${summary.source_verdicts.pre_generation_simulator}`,
    '',
    '## Actual Feedback',
    '',
    `- Actual pass rate (MDS-005): **${(summary.actual_pass_rate * 100).toFixed(1)}%**`,
    `- Source: \`generation-feedback-report.json\` → ${summary.source_verdicts.generation_feedback}`,
    '',
    '## Calibration Result',
    '',
    `- Simulator calibration: ${summary.source_verdicts.simulator_calibration}`,
    `- Calibrated expected pass rate: **${(summary.calibrated_expected_pass_rate * 100).toFixed(1)}%**`,
    '',
    '## Safe / Watch / Skip',
    '',
    `| Tier | Count | Slots |`,
    `|------|------:|-------|`,
    `| Safe | ${summary.safe_slots.length} | ${summary.safe_slots.join(', ') || '—'} |`,
    `| Watch | ${summary.watch_slots.length} | ${summary.watch_slots.join(', ') || '—'} |`,
    `| Skip | ${summary.skip_slots.length} | ${summary.skip_slots.join(', ') || '—'} |`,
    '',
    '## Top Warnings',
    '',
  ];

  if (summary.top_warnings.length === 0) {
    lines.push('- None');
  } else {
    for (const w of summary.top_warnings) lines.push(`- ${w}`);
  }

  lines.push('', '## Next Recommended Step', '');
  for (const action of summary.recommended_next_actions) {
    lines.push(`- ${action}`);
  }

  lines.push('', '## Do Not Touch', '');
  for (const item of summary.do_not_touch_list) {
    lines.push(`- ${item}`);
  }

  lines.push('', '## Upstream Reports', '');
  for (const r of summary.upstream_reports) {
    lines.push(`- [${r.present ? 'x' : ' '}] \`${r.path}\`${r.verdict ? ` — ${r.verdict}` : ''}`);
  }

  lines.push('', '---', `*${summary.final_verdict}*`, '');
  return lines.join('\n');
}

export function writeAuditorDashboardSummary(projectRoot?: string): {
  summary: AuditorDashboardSummary;
  jsonPath: string;
  mdPath: string;
} {
  const root = resolveProjectRoot(projectRoot);
  const summary = buildAuditorDashboardSummary(root);

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });

  const jsonPayload = {
    ...summary,
    report_type: 'auditor_dashboard_summary',
    report_version: 'v1',
    export_path: AUDITOR_DASHBOARD_JSON_PATH,
    markdown_path: AUDITOR_DASHBOARD_MD_PATH,
    next_phase: 'PHASE-AUDITOR-008 AUDITOR_GATEKEEPER_V1',
  };

  fs.writeFileSync(
    path.join(root, AUDITOR_DASHBOARD_JSON_PATH),
    `${JSON.stringify(jsonPayload, null, 2)}\n`,
    'utf8'
  );

  fs.writeFileSync(
    path.join(root, AUDITOR_DASHBOARD_MD_PATH),
    renderAuditorDashboardMarkdown(summary),
    'utf8'
  );

  return {
    summary,
    jsonPath: AUDITOR_DASHBOARD_JSON_PATH,
    mdPath: AUDITOR_DASHBOARD_MD_PATH,
  };
}
