import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { readJsonRecord } from './auditors/auditorShared.js';
import {
  DATASET16_FULL_FIXTURE_PATH,
  DATASET16_V2_FIXTURE_PATH,
  GATEKEEPER_REPORT_PATH,
} from './auditorGatekeeper.js';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import { SELF_HEALING_JSON_PATH } from './selfHealingRecommendationEngine.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const RELEASE_PIPELINE_PHASE = 'PHASE-AUDITOR-010' as const;
export const RELEASE_PIPELINE_PASS_VERDICT = 'PASS_AUDITOR_RELEASE_PIPELINE_V1' as const;
export const RELEASE_PIPELINE_FAIL_VERDICT = 'FAIL_AUDITOR_RELEASE_PIPELINE_V1' as const;
export const RELEASE_PIPELINE_JSON_PATH = 'reports/auditor-release-pipeline-report.json' as const;
export const RELEASE_PIPELINE_MD_PATH = 'reports/AUDITOR_RELEASE_PIPELINE.md' as const;

export const DATASET16_FULL_RELEASE_EXPECTATIONS_PATH =
  'reports/fixtures/dataset16-full-release-expectations.json' as const;
export const DATASET16_V2_RELEASE_EXPECTATIONS_PATH =
  'reports/fixtures/dataset16-v2-release-expectations.json' as const;

export type ReleaseStatus = 'RELEASE_PASS' | 'RELEASE_PASS_WITH_WARNING' | 'RELEASE_BLOCKED';

export type ReadinessTier = 'READY' | 'READY_WITH_WARNING' | 'BLOCKED';

export const PIPELINE_STEPS = Object.freeze([
  { step_id: 'project-auditor', npm_script: 'verify:project-auditor' },
  { step_id: 'dataset-conflict-detector', npm_script: 'verify:dataset-conflict-detector' },
  { step_id: 'identity-drift-predictor', npm_script: 'verify:identity-drift-predictor' },
  { step_id: 'pre-generation-simulator', npm_script: 'verify:pre-generation-simulator' },
  { step_id: 'generation-feedback', npm_script: 'verify:generation-feedback' },
  { step_id: 'simulator-calibration', npm_script: 'verify:simulator-calibration' },
  { step_id: 'auditor-dashboard', npm_script: 'verify:auditor-dashboard' },
  { step_id: 'auditor-gatekeeper', npm_script: 'verify:auditor-gatekeeper' },
  { step_id: 'self-healing-recommendation', npm_script: 'verify:self-healing-recommendation' },
] as const);

export type PipelineStepResult = {
  step_id: string;
  npm_script: string;
  passed: boolean;
  exit_code: number;
  duration_ms: number;
  stdout_tail: string;
};

export type CandidateReleaseEvaluation = {
  candidate_id: string;
  candidate_path: string;
  release_status: ReleaseStatus;
  promotion_allowed: boolean;
  gate_status: string;
  fix_required: boolean;
};

export type AuditorReleasePipelineReport = {
  pipeline_id: string;
  phase: typeof RELEASE_PIPELINE_PHASE;
  timestamp: string;
  release_status: ReleaseStatus;
  release_score: number;
  readiness_tier: ReadinessTier;
  critical_findings: readonly string[];
  warning_findings: readonly string[];
  blocked_items: readonly string[];
  recommended_actions: readonly string[];
  promotion_ready: boolean;
  pipeline_steps: readonly PipelineStepResult[];
  steps_passed: number;
  steps_failed: number;
  project_gate_status: string;
  aggregate_risk: number;
  critical_errors: number;
  candidate_evaluations: readonly CandidateReleaseEvaluation[];
  required_retests: readonly string[];
  final_verdict: typeof RELEASE_PIPELINE_PASS_VERDICT | typeof RELEASE_PIPELINE_FAIL_VERDICT;
};

function tailOutput(text: string, max = 400): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(-max);
}

export function runPipelineStep(projectRoot: string, step: (typeof PIPELINE_STEPS)[number]): PipelineStepResult {
  const started = Date.now();
  const result = spawnSync('npm', ['run', step.npm_script], {
    cwd: projectRoot,
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  const stdout = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return {
    step_id: step.step_id,
    npm_script: step.npm_script,
    passed: result.status === 0,
    exit_code: result.status ?? 1,
    duration_ms: Date.now() - started,
    stdout_tail: tailOutput(stdout),
  };
}

export function runAllPipelineSteps(projectRoot?: string): PipelineStepResult[] {
  const root = resolveProjectRoot(projectRoot);
  const results: PipelineStepResult[] = [];

  for (const step of PIPELINE_STEPS) {
    results.push(runPipelineStep(root, step));
    if (!results[results.length - 1].passed) break;
  }

  return results;
}

function gateStatusToReleaseStatus(gateStatus: string): ReleaseStatus {
  if (gateStatus === 'BLOCK') return 'RELEASE_BLOCKED';
  if (gateStatus === 'ALLOW_WITH_WARNING') return 'RELEASE_PASS_WITH_WARNING';
  return 'RELEASE_PASS';
}

export function computeReleaseScore(input: {
  aggregate_risk: number;
  critical_errors: number;
  watch_slot_count: number;
  skip_slot_count: number;
  steps_failed: number;
}): number {
  let score = 100;
  score -= input.critical_errors * 30;
  score -= input.skip_slot_count * 20;
  score -= Math.max(0, input.aggregate_risk - 20) * 0.8;
  score -= input.watch_slot_count * 2;
  score -= input.steps_failed * 15;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToReadinessTier(score: number): ReadinessTier {
  if (score >= 90) return 'READY';
  if (score >= 70) return 'READY_WITH_WARNING';
  return 'BLOCKED';
}

export function deriveProjectReleaseStatus(input: {
  critical_errors: number;
  project_gate_status: string;
  steps_failed: number;
}): ReleaseStatus {
  if (input.steps_failed > 0 || input.critical_errors > 0) {
    return 'RELEASE_BLOCKED';
  }
  if (input.project_gate_status === 'BLOCK') {
    return 'RELEASE_BLOCKED';
  }
  if (input.project_gate_status === 'ALLOW_WITH_WARNING') {
    return 'RELEASE_PASS_WITH_WARNING';
  }
  return 'RELEASE_PASS';
}

export function buildCandidateEvaluations(
  gatekeeper: Record<string, unknown> | null,
  selfHealing: Record<string, unknown> | null
): CandidateReleaseEvaluation[] {
  const simulations =
    (gatekeeper?.promotion_simulations as Array<{
      candidate_id: string;
      candidate_path: string;
      gate_status: string;
      promotion_allowed: boolean;
    }>) ?? [];

  const plans =
    (selfHealing?.candidate_plans as Array<{
      candidate_id: string;
      candidate_file: string;
      fix_required: boolean;
    }>) ?? [];

  return simulations.map((sim) => {
    const plan = plans.find((p) => p.candidate_id === sim.candidate_id);
    return {
      candidate_id: sim.candidate_id,
      candidate_path: sim.candidate_path,
      release_status: gateStatusToReleaseStatus(sim.gate_status),
      promotion_allowed: sim.promotion_allowed,
      gate_status: sim.gate_status,
      fix_required: plan?.fix_required ?? sim.gate_status === 'BLOCK',
    };
  });
}

export function assembleReleasePipelineReport(
  projectRoot: string,
  pipelineSteps: PipelineStepResult[]
): AuditorReleasePipelineReport {
  const dashboard = readJsonRecord(projectRoot, AUDITOR_DASHBOARD_JSON_PATH) as {
    aggregate_risk?: number;
    critical_errors?: number;
    watch_slots?: string[];
    skip_slots?: string[];
    top_warnings?: string[];
    recommended_next_actions?: string[];
  } | null;

  const gatekeeper = readJsonRecord(projectRoot, GATEKEEPER_REPORT_PATH) as {
    gate_status?: string;
    blocking_items?: string[];
    warning_items?: string[];
    recommended_actions?: string[];
    project_gate?: { critical_errors?: number };
    promotion_simulations?: unknown[];
  } | null;

  const selfHealing = readJsonRecord(projectRoot, SELF_HEALING_JSON_PATH) as {
    candidate_plans?: unknown[];
  } | null;

  const critical_errors = Number(
    dashboard?.critical_errors ?? gatekeeper?.project_gate?.critical_errors ?? 0
  );
  const aggregate_risk = Number(dashboard?.aggregate_risk ?? 0);
  const watch_slots = dashboard?.watch_slots ?? [];
  const skip_slots = dashboard?.skip_slots ?? [];
  const project_gate_status = String(gatekeeper?.gate_status ?? 'UNKNOWN');
  const steps_failed = pipelineSteps.filter((s) => !s.passed).length;
  const steps_passed = pipelineSteps.filter((s) => s.passed).length;

  const release_score = computeReleaseScore({
    aggregate_risk,
    critical_errors,
    watch_slot_count: watch_slots.length,
    skip_slot_count: skip_slots.length,
    steps_failed,
  });

  const readiness_tier = scoreToReadinessTier(release_score);
  const release_status = deriveProjectReleaseStatus({
    critical_errors,
    project_gate_status,
    steps_failed,
  });

  const critical_findings: string[] = [];
  if (critical_errors > 0) {
    critical_findings.push(`${critical_errors} critical auditor error(s)`);
  }
  if (steps_failed > 0) {
    const failed = pipelineSteps.filter((s) => !s.passed).map((s) => s.npm_script);
    critical_findings.push(`Pipeline step failure(s): ${failed.join(', ')}`);
  }
  for (const item of gatekeeper?.blocking_items ?? []) {
    critical_findings.push(item);
  }

  const warning_findings = [
    ...(dashboard?.top_warnings ?? []).slice(0, 6),
    ...(gatekeeper?.warning_items ?? []),
  ];

  const blocked_items: string[] = [];
  if (release_status === 'RELEASE_BLOCKED') {
    blocked_items.push(...critical_findings);
  }
  const candidate_evaluations = buildCandidateEvaluations(gatekeeper, selfHealing);
  for (const candidate of candidate_evaluations) {
    if (candidate.release_status === 'RELEASE_BLOCKED') {
      blocked_items.push(
        `${candidate.candidate_id} (${candidate.candidate_path}) — ${candidate.release_status}`
      );
    }
  }

  const recommended_actions = [
    ...(gatekeeper?.recommended_actions ?? []).slice(0, 4),
    ...(dashboard?.recommended_next_actions ?? []).slice(0, 3),
    'Run npm run verify:auditor-release-pipeline before promoting any file to latest/.',
  ];

  const required_retests = [
    'npm run verify:auditor-release-pipeline',
    'npm run verify:auditor-gatekeeper',
    'npm run verify:pre-generation-simulator',
    ...(watch_slots.length > 0
      ? [`Validate watch slots before batch: ${watch_slots.slice(0, 4).join(', ')}`]
      : []),
  ];

  const promotion_ready =
    release_status !== 'RELEASE_BLOCKED' && release_score >= 70 && steps_failed === 0;

  return {
    pipeline_id: `release_pipeline_${Date.now().toString(36)}`,
    phase: RELEASE_PIPELINE_PHASE,
    timestamp: new Date().toISOString(),
    release_status,
    release_score,
    readiness_tier,
    critical_findings: Object.freeze([...new Set(critical_findings)]),
    warning_findings: Object.freeze([...new Set(warning_findings)]),
    blocked_items: Object.freeze([...new Set(blocked_items)]),
    recommended_actions: Object.freeze([...new Set(recommended_actions)]),
    promotion_ready,
    pipeline_steps: Object.freeze(pipelineSteps),
    steps_passed,
    steps_failed,
    project_gate_status,
    aggregate_risk,
    critical_errors,
    candidate_evaluations: Object.freeze(candidate_evaluations),
    required_retests: Object.freeze(required_retests),
    final_verdict: RELEASE_PIPELINE_PASS_VERDICT,
  };
}

export function renderReleasePipelineMarkdown(report: AuditorReleasePipelineReport): string {
  const promotionRecommendation = report.promotion_ready
    ? report.readiness_tier === 'READY'
      ? 'Promotion to latest/ is ready after candidate-specific gatekeeper approval.'
      : 'Promotion allowed with warning — prefer v2-safe adapters and validate watch slots first.'
    : 'Do not promote to latest/ until blocking issues are resolved.';

  const candidateLines = report.candidate_evaluations
    .map(
      (c) =>
        `- **${c.candidate_id}** (\`${c.candidate_path}\`): ${c.release_status} — promotion_allowed=${c.promotion_allowed}`
    )
    .join('\n');

  return [
    '# Auditor Release Pipeline',
    '',
    '## Release Status',
    '',
    `| Field | Value |`,
    `|-------|-------|`,
    `| **Verdict** | ${report.final_verdict} |`,
    `| **Release status** | ${report.release_status} |`,
    `| **Readiness tier** | ${report.readiness_tier} (${report.release_score}/100) |`,
    `| **Promotion ready** | ${report.promotion_ready} |`,
    `| **Pipeline steps** | ${report.steps_passed}/${report.pipeline_steps.length} passed |`,
    `| **Project gate** | ${report.project_gate_status} |`,
    '',
    '## Risk Summary',
    '',
    `- Aggregate risk: **${report.aggregate_risk}**`,
    `- Critical errors: **${report.critical_errors}**`,
    `- Candidate evaluations: ${report.candidate_evaluations.length}`,
    '',
    '## Blocking Issues',
    '',
    report.blocked_items.length > 0
      ? report.blocked_items.map((b) => `- ${b}`).join('\n')
      : '- None at project level.',
    '',
    '### Candidate release checks',
    '',
    candidateLines || '- None',
    '',
    '## Warnings',
    '',
    report.warning_findings.length > 0
      ? report.warning_findings.map((w) => `- ${w}`).join('\n')
      : '- None',
    '',
    '## Promotion Recommendation',
    '',
    promotionRecommendation,
    '',
    '## Required Retests',
    '',
    report.required_retests.map((r) => `- ${r}`).join('\n'),
    '',
    '---',
    '',
    `**Phase:** ${report.phase}`,
    `**Generated:** ${report.timestamp}`,
    '',
    '**Next phase:** PHASE-AUDITOR-011 PROJECT_MEMORY_BASELINE_V1',
    '',
  ].join('\n');
}

export function validateReleasePipelineFixtures(report: AuditorReleasePipelineReport): {
  pass: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const full = report.candidate_evaluations.find((c) => c.candidate_id === 'dataset16-full');
  const v2 = report.candidate_evaluations.find((c) => c.candidate_id === 'dataset16-v2');

  if (!full || full.release_status !== 'RELEASE_BLOCKED') {
    violations.push(`Dataset #16 Full expected RELEASE_BLOCKED, got ${full?.release_status ?? 'missing'}`);
  }
  if (full?.promotion_allowed) {
    violations.push('Dataset #16 Full must not allow promotion');
  }

  if (!v2 || v2.release_status !== 'RELEASE_PASS_WITH_WARNING') {
    violations.push(
      `Dataset #16 V2 expected RELEASE_PASS_WITH_WARNING, got ${v2?.release_status ?? 'missing'}`
    );
  }
  if (!v2?.promotion_allowed) {
    violations.push('Dataset #16 V2 promotion should be allowed');
  }

  if (report.steps_failed > 0) {
    violations.push(`${report.steps_failed} pipeline step(s) failed`);
  }

  return { pass: violations.length === 0, violations };
}

export function runAuditorReleasePipeline(projectRoot?: string): AuditorReleasePipelineReport {
  const root = resolveProjectRoot(projectRoot);
  const pipelineSteps = runAllPipelineSteps(root);
  return assembleReleasePipelineReport(root, pipelineSteps);
}

export function writeAuditorReleasePipelineReport(projectRoot?: string): AuditorReleasePipelineReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runAuditorReleasePipeline(root);
  const validation = validateReleasePipelineFixtures(report);

  const finalReport: AuditorReleasePipelineReport = {
    ...report,
    final_verdict: validation.pass ? RELEASE_PIPELINE_PASS_VERDICT : RELEASE_PIPELINE_FAIL_VERDICT,
  };

  const payload = {
    ...finalReport,
    report_type: 'auditor_release_pipeline_report',
    report_version: 'v1',
    export_path: RELEASE_PIPELINE_JSON_PATH,
    fixture_inputs: {
      dataset16_full: DATASET16_FULL_FIXTURE_PATH,
      dataset16_v2: DATASET16_V2_FIXTURE_PATH,
    },
    next_phase: 'PHASE-AUDITOR-011 PROJECT_MEMORY_BASELINE_V1',
  };

  fs.mkdirSync(path.join(root, 'reports'), { recursive: true });
  fs.writeFileSync(
    path.join(root, RELEASE_PIPELINE_JSON_PATH),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, RELEASE_PIPELINE_MD_PATH),
    renderReleasePipelineMarkdown(finalReport),
    'utf8'
  );

  return finalReport;
}
