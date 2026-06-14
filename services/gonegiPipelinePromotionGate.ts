import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import { RELEASE_PIPELINE_JSON_PATH } from './auditorReleasePipeline.js';
import { MEMORY_BASELINE_REPORT_PATH } from './projectMemoryBaseline.js';
import { PIPELINE_AUDIT_REPORT_PATH } from './sourceVideoToGonegiPipelineValidator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMOTION_GATE_PHASE =
  'PHASE-SOURCE-VIDEO-021-GONEGI_PIPELINE_PROMOTION_GATE_V1' as const;
export const PROMOTION_GATE_PASS_VERDICT = 'PASS_GONEGI_PIPELINE_PROMOTION_GATE_V1' as const;
export const PROMOTION_GATE_FAIL_VERDICT = 'FAIL_GONEGI_PIPELINE_PROMOTION_GATE_V1' as const;
export const PROMOTION_GATE_REPORT_PATH = 'reports/gonegi-pipeline-promotion-gate-report.json' as const;
export const PROMOTION_GATE_MD_PATH = 'reports/GONEGI_PIPELINE_PROMOTION_GATE.md' as const;

export type PromotionStatus = 'BLOCKED' | 'ALLOW_WITH_WARNING' | 'ALLOW';

export type PipelineAuditInput = {
  chain_status?: string;
  identity_status?: string;
  continuity_status?: string;
  traceability_status?: string;
  execution_safety_status?: string;
  missing_links?: string[];
  orphan_records?: string[];
  final_verdict?: string;
  gpu_execution?: boolean;
  design_only?: boolean;
  issues?: Array<{ severity?: string }>;
};

export type DashboardInput = {
  critical_errors?: number;
  aggregate_risk?: number;
  watch_slots?: string[];
  project_status?: string;
  final_verdict?: string;
};

export type ReleasePipelineInput = {
  release_status?: string;
  release_score?: number;
  critical_errors?: number;
  aggregate_risk?: number;
  final_verdict?: string;
};

export type BaselineInput = {
  current_release_status?: string;
  current_risk?: number;
  final_verdict?: string;
};

export type PromotionGateInputs = {
  pipeline_audit: PipelineAuditInput;
  dashboard: DashboardInput;
  release_pipeline: ReleasePipelineInput;
  baseline: BaselineInput;
};

export type PromotionGateEvaluation = {
  promotion_status: PromotionStatus;
  promotion_score: number;
  blocking_reasons: string[];
  warning_reasons: string[];
  recommended_next_action: string;
};

export type GonegiPipelinePromotionGateReport = PromotionGateEvaluation & {
  gate_id: string;
  phase: typeof PROMOTION_GATE_PHASE;
  timestamp: string;
  input_sources: {
    pipeline_audit: string;
    dashboard: string;
    release_pipeline: string;
    baseline: string;
  };
  pipeline_audit_verdict: string;
  dashboard_verdict: string;
  release_pipeline_verdict: string;
  baseline_verdict: string;
  aggregate_risk: number;
  watch_slot_count: number;
  critical_errors: number;
  missing_link_count: number;
  orphan_record_count: number;
  identity_status: string;
  continuity_status: string;
  traceability_status: string;
  release_status: string;
  gpu_execution: false;
  audit_only: true;
  decision_hash: string;
  final_verdict: typeof PROMOTION_GATE_PASS_VERDICT | typeof PROMOTION_GATE_FAIL_VERDICT;
};

function releaseStatusHasWarning(status: string): boolean {
  return /WARNING/i.test(status);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function computePromotionScore(
  inputs: PromotionGateInputs,
  blocking_reasons: string[],
  warning_reasons: string[]
): number {
  const dashboard = inputs.dashboard;
  const audit = inputs.pipeline_audit;
  const release = inputs.release_pipeline;

  const criticalErrors = Number(dashboard.critical_errors ?? 0);
  const aggregateRisk = Number(dashboard.aggregate_risk ?? release.aggregate_risk ?? 0);
  const watchSlots = dashboard.watch_slots?.length ?? 0;
  const missingLinks = audit.missing_links?.length ?? 0;
  const orphanRecords = audit.orphan_records?.length ?? 0;

  let score = 100;
  score -= criticalErrors * 50;
  score -= missingLinks * 20;
  score -= orphanRecords * 20;
  if (audit.identity_status !== 'PASS') score -= 30;
  if (audit.continuity_status !== 'PASS') score -= 20;
  if (audit.traceability_status !== 'PASS') score -= 20;
  score -= Math.max(0, aggregateRisk - 20);
  score -= watchSlots * 2;
  if (releaseStatusHasWarning(String(release.release_status ?? ''))) score -= 8;
  score -= blocking_reasons.length * 5;
  score -= warning_reasons.length * 2;

  return clampScore(score);
}

export function evaluateGonegiPipelinePromotion(
  inputs: PromotionGateInputs
): PromotionGateEvaluation {
  const audit = inputs.pipeline_audit;
  const dashboard = inputs.dashboard;
  const release = inputs.release_pipeline;
  const baseline = inputs.baseline;

  const blocking_reasons: string[] = [];
  const warning_reasons: string[] = [];

  const criticalErrors = Number(dashboard.critical_errors ?? 0);
  const missingLinks = audit.missing_links ?? [];
  const orphanRecords = audit.orphan_records ?? [];
  const watchSlots = dashboard.watch_slots ?? [];
  const aggregateRisk = Number(
    dashboard.aggregate_risk ?? release.aggregate_risk ?? baseline.current_risk ?? 0
  );
  const releaseStatus = String(
    release.release_status ?? baseline.current_release_status ?? ''
  );

  if (criticalErrors > 0) {
    blocking_reasons.push(`${criticalErrors} critical auditor error(s) on dashboard`);
  }
  if (missingLinks.length > 0) {
    blocking_reasons.push(`${missingLinks.length} missing pipeline link(s)`);
  }
  if (orphanRecords.length > 0) {
    blocking_reasons.push(`${orphanRecords.length} orphan pipeline record(s)`);
  }
  if (audit.identity_status !== 'PASS') {
    blocking_reasons.push(`identity_status=${audit.identity_status ?? 'UNKNOWN'}`);
  }
  if (audit.continuity_status !== 'PASS') {
    blocking_reasons.push(`continuity_status=${audit.continuity_status ?? 'UNKNOWN'}`);
  }
  if (audit.traceability_status !== 'PASS') {
    blocking_reasons.push(`traceability_status=${audit.traceability_status ?? 'UNKNOWN'}`);
  }

  if (watchSlots.length > 0) {
    warning_reasons.push(`${watchSlots.length} watch slot(s): ${watchSlots.join(', ')}`);
  }
  if (aggregateRisk > 20) {
    warning_reasons.push(`aggregate_risk ${aggregateRisk} exceeds caution threshold 20`);
  }
  if (releaseStatusHasWarning(releaseStatus)) {
    warning_reasons.push(`release_status contains WARNING: ${releaseStatus}`);
  }

  let promotion_status: PromotionStatus;
  if (blocking_reasons.length > 0) {
    promotion_status = 'BLOCKED';
  } else if (warning_reasons.length > 0) {
    promotion_status = 'ALLOW_WITH_WARNING';
  } else {
    promotion_status = 'ALLOW';
  }

  const promotion_score = computePromotionScore(inputs, blocking_reasons, warning_reasons);

  let recommended_next_action: string;
  if (promotion_status === 'BLOCKED') {
    recommended_next_action =
      'Resolve all blocking_reasons before any Source Video chain promotion; re-run npm run verify:source-video-to-gonegi-pipeline.';
  } else if (promotion_status === 'ALLOW_WITH_WARNING') {
    recommended_next_action =
      'Pipeline design chain is traceable but project risk is elevated; clear watch slots and reduce aggregate_risk to ≤20 before GPU execution stages.';
  } else {
    recommended_next_action =
      'All promotion checks passed; proceed to PHASE-SOURCE-VIDEO-022 MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1.';
  }

  return {
    promotion_status,
    promotion_score,
    blocking_reasons,
    warning_reasons,
    recommended_next_action,
  };
}

function stableDecisionHash(evaluation: PromotionGateEvaluation): string {
  const payload = JSON.stringify({
    promotion_status: evaluation.promotion_status,
    promotion_score: evaluation.promotion_score,
    blocking_reasons: evaluation.blocking_reasons,
    warning_reasons: evaluation.warning_reasons,
    recommended_next_action: evaluation.recommended_next_action,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
  }
  return `gate_decision_${hash.toString(16)}`;
}

export function loadPromotionGateInputs(projectRoot?: string): PromotionGateInputs {
  const root = resolveProjectRoot(projectRoot);

  const pipeline_audit = readJsonRecord(root, PIPELINE_AUDIT_REPORT_PATH) as PipelineAuditInput | null;
  if (!pipeline_audit) {
    throw new Error(`Missing ${PIPELINE_AUDIT_REPORT_PATH}`);
  }

  const dashboard = readJsonRecord(root, AUDITOR_DASHBOARD_JSON_PATH) as DashboardInput | null;
  if (!dashboard) {
    throw new Error(`Missing ${AUDITOR_DASHBOARD_JSON_PATH}`);
  }

  const release_pipeline = readJsonRecord(root, RELEASE_PIPELINE_JSON_PATH) as ReleasePipelineInput | null;
  if (!release_pipeline) {
    throw new Error(`Missing ${RELEASE_PIPELINE_JSON_PATH}`);
  }

  const baseline = readJsonRecord(root, MEMORY_BASELINE_REPORT_PATH) as BaselineInput | null;
  if (!baseline) {
    throw new Error(`Missing ${MEMORY_BASELINE_REPORT_PATH}`);
  }

  return { pipeline_audit, dashboard, release_pipeline, baseline };
}

export function buildGonegiPipelinePromotionGateReport(
  inputs: PromotionGateInputs,
  timestamp?: string
): GonegiPipelinePromotionGateReport {
  const evaluation = evaluateGonegiPipelinePromotion(inputs);
  const audit = inputs.pipeline_audit;
  const dashboard = inputs.dashboard;
  const release = inputs.release_pipeline;
  const baseline = inputs.baseline;

  const aggregateRisk = Number(
    dashboard.aggregate_risk ?? release.aggregate_risk ?? baseline.current_risk ?? 0
  );

  return {
    gate_id: 'gonegi-pipeline-promotion-gate-v1',
    phase: PROMOTION_GATE_PHASE,
    timestamp: timestamp ?? new Date().toISOString(),
    input_sources: {
      pipeline_audit: PIPELINE_AUDIT_REPORT_PATH,
      dashboard: AUDITOR_DASHBOARD_JSON_PATH,
      release_pipeline: RELEASE_PIPELINE_JSON_PATH,
      baseline: MEMORY_BASELINE_REPORT_PATH,
    },
    pipeline_audit_verdict: String(audit.final_verdict ?? 'UNKNOWN'),
    dashboard_verdict: String(dashboard.final_verdict ?? 'UNKNOWN'),
    release_pipeline_verdict: String(release.final_verdict ?? 'UNKNOWN'),
    baseline_verdict: String(baseline.final_verdict ?? 'UNKNOWN'),
    promotion_status: evaluation.promotion_status,
    promotion_score: evaluation.promotion_score,
    blocking_reasons: evaluation.blocking_reasons,
    warning_reasons: evaluation.warning_reasons,
    recommended_next_action: evaluation.recommended_next_action,
    aggregate_risk: aggregateRisk,
    watch_slot_count: dashboard.watch_slots?.length ?? 0,
    critical_errors: Number(dashboard.critical_errors ?? 0),
    missing_link_count: audit.missing_links?.length ?? 0,
    orphan_record_count: audit.orphan_records?.length ?? 0,
    identity_status: String(audit.identity_status ?? 'UNKNOWN'),
    continuity_status: String(audit.continuity_status ?? 'UNKNOWN'),
    traceability_status: String(audit.traceability_status ?? 'UNKNOWN'),
    release_status: String(
      release.release_status ?? baseline.current_release_status ?? 'UNKNOWN'
    ),
    gpu_execution: false,
    audit_only: true,
    decision_hash: stableDecisionHash(evaluation),
    final_verdict: PROMOTION_GATE_PASS_VERDICT,
  };
}

function buildMarkdown(report: GonegiPipelinePromotionGateReport): string {
  const lines = [
    '# Gonegi Pipeline Promotion Gate',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Promotion Decision',
    '',
    '| Field | Value |',
    '| --- | --- |',
    `| promotion_status | ${report.promotion_status} |`,
    `| promotion_score | ${report.promotion_score} |`,
    `| aggregate_risk | ${report.aggregate_risk} |`,
    `| watch_slot_count | ${report.watch_slot_count} |`,
    `| critical_errors | ${report.critical_errors} |`,
    `| missing_link_count | ${report.missing_link_count} |`,
    `| orphan_record_count | ${report.orphan_record_count} |`,
    `| identity_status | ${report.identity_status} |`,
    `| continuity_status | ${report.continuity_status} |`,
    `| traceability_status | ${report.traceability_status} |`,
    `| release_status | ${report.release_status} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| audit_only | ${report.audit_only} |`,
    `| decision_hash | ${report.decision_hash} |`,
    '',
    '## Gate Rules',
    '',
    '**BLOCKED** when any of:',
    '- critical_errors > 0',
    '- missing_links > 0',
    '- orphan_records > 0',
    '- identity / continuity / traceability != PASS',
    '',
    '**ALLOW_WITH_WARNING** when any of:',
    '- watch_slots > 0',
    '- aggregate_risk > 20',
    '- release_status contains WARNING',
    '',
    '**ALLOW** when all checks pass, aggregate_risk ≤ 20, watch_slots = 0.',
    '',
    '## Input Sources',
    '',
    `- Pipeline audit: \`${report.input_sources.pipeline_audit}\` (${report.pipeline_audit_verdict})`,
    `- Dashboard: \`${report.input_sources.dashboard}\` (${report.dashboard_verdict})`,
    `- Release pipeline: \`${report.input_sources.release_pipeline}\` (${report.release_pipeline_verdict})`,
    `- Baseline: \`${report.input_sources.baseline}\` (${report.baseline_verdict})`,
    '',
    '## Blocking Reasons',
    '',
  ];

  if (report.blocking_reasons.length === 0) {
    lines.push('- none');
  } else {
    for (const reason of report.blocking_reasons) {
      lines.push(`- ${reason}`);
    }
  }

  lines.push('', '## Warning Reasons', '');
  if (report.warning_reasons.length === 0) {
    lines.push('- none');
  } else {
    for (const reason of report.warning_reasons) {
      lines.push(`- ${reason}`);
    }
  }

  lines.push('', '## Recommended Next Action', '', report.recommended_next_action, '');
  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-022 MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1');

  return lines.join('\n');
}

export function writeGonegiPipelinePromotionGateReport(
  projectRoot?: string
): GonegiPipelinePromotionGateReport {
  const root = resolveProjectRoot(projectRoot);
  const inputs = loadPromotionGateInputs(root);
  const report = buildGonegiPipelinePromotionGateReport(inputs);

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, PROMOTION_GATE_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, PROMOTION_GATE_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}

export function isPromotionDecisionReproducible(inputs: PromotionGateInputs): boolean {
  const first = evaluateGonegiPipelinePromotion(inputs);
  const second = evaluateGonegiPipelinePromotion(inputs);
  return (
    first.promotion_status === second.promotion_status &&
    first.promotion_score === second.promotion_score &&
    JSON.stringify(first.blocking_reasons) === JSON.stringify(second.blocking_reasons) &&
    JSON.stringify(first.warning_reasons) === JSON.stringify(second.warning_reasons) &&
    first.recommended_next_action === second.recommended_next_action
  );
}
