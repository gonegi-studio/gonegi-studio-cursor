import fs from 'node:fs';
import path from 'node:path';
import { AUDITOR_DASHBOARD_JSON_PATH } from './auditorDashboardSummary.js';
import { RELEASE_PIPELINE_JSON_PATH } from './auditorReleasePipeline.js';
import {
  PROMOTION_GATE_FAIL_VERDICT,
  PROMOTION_GATE_PASS_VERDICT,
  PROMOTION_GATE_REPORT_PATH,
  buildGonegiPipelinePromotionGateReport,
  isPromotionDecisionReproducible,
  loadPromotionGateInputs,
  writeGonegiPipelinePromotionGateReport,
  type GonegiPipelinePromotionGateReport,
  type PromotionStatus,
} from './gonegiPipelinePromotionGate.js';
import { MEMORY_BASELINE_REPORT_PATH } from './projectMemoryBaseline.js';
import { PIPELINE_AUDIT_REPORT_PATH } from './sourceVideoToGonegiPipelineValidator.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export type PromotionGateValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type PromotionGateValidationResult = {
  pass: boolean;
  issues: PromotionGateValidationIssue[];
  report: GonegiPipelinePromotionGateReport;
};

const VALID_PROMOTION_STATUSES: readonly PromotionStatus[] = [
  'BLOCKED',
  'ALLOW_WITH_WARNING',
  'ALLOW',
];

function fileExists(projectRoot: string, relPath: string): boolean {
  return fs.existsSync(path.join(projectRoot, relPath));
}

export function validateGonegiPipelinePromotionGate(
  projectRoot?: string,
  report?: GonegiPipelinePromotionGateReport
): PromotionGateValidationResult {
  const root = resolveProjectRoot(projectRoot);
  const issues: PromotionGateValidationIssue[] = [];

  const requiredInputs = [
    { code: 'PIPELINE_AUDIT_MISSING', path: PIPELINE_AUDIT_REPORT_PATH, label: 'pipeline audit' },
    { code: 'DASHBOARD_MISSING', path: AUDITOR_DASHBOARD_JSON_PATH, label: 'dashboard' },
    {
      code: 'RELEASE_PIPELINE_MISSING',
      path: RELEASE_PIPELINE_JSON_PATH,
      label: 'release pipeline',
    },
    { code: 'BASELINE_MISSING', path: MEMORY_BASELINE_REPORT_PATH, label: 'baseline' },
  ];

  for (const input of requiredInputs) {
    if (!fileExists(root, input.path)) {
      issues.push({
        code: input.code,
        message: `Missing ${input.label}: ${input.path}`,
        severity: 'error',
      });
    }
  }

  let gateReport = report;
  if (!gateReport) {
    try {
      gateReport = writeGonegiPipelinePromotionGateReport(root);
    } catch (error) {
      issues.push({
        code: 'GATE_BUILD_FAILED',
        message: error instanceof Error ? error.message : 'Failed to build promotion gate report',
        severity: 'error',
      });
      return {
        pass: false,
        issues,
        report: buildGonegiPipelinePromotionGateReport({
          pipeline_audit: {},
          dashboard: {},
          release_pipeline: {},
          baseline: {},
        }),
      };
    }
  }

  if (!fileExists(root, PROMOTION_GATE_REPORT_PATH)) {
    issues.push({
      code: 'GATE_REPORT_MISSING',
      message: `Missing gate report: ${PROMOTION_GATE_REPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!VALID_PROMOTION_STATUSES.includes(gateReport.promotion_status)) {
    issues.push({
      code: 'INVALID_PROMOTION_STATUS',
      message: `Invalid promotion_status: ${gateReport.promotion_status}`,
      severity: 'error',
    });
  }

  if (typeof gateReport.promotion_score !== 'number' || Number.isNaN(gateReport.promotion_score)) {
    issues.push({
      code: 'INVALID_PROMOTION_SCORE',
      message: 'promotion_score must be a number',
      severity: 'error',
    });
  } else if (gateReport.promotion_score < 0 || gateReport.promotion_score > 100) {
    issues.push({
      code: 'PROMOTION_SCORE_OUT_OF_RANGE',
      message: `promotion_score must be 0-100, got ${gateReport.promotion_score}`,
      severity: 'error',
    });
  }

  if (gateReport.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_NOT_FALSE',
      message: 'gpu_execution must be false',
      severity: 'error',
    });
  }

  if (gateReport.audit_only !== true) {
    issues.push({
      code: 'AUDIT_ONLY_NOT_TRUE',
      message: 'audit_only must be true',
      severity: 'error',
    });
  }

  if (!gateReport.recommended_next_action) {
    issues.push({
      code: 'MISSING_RECOMMENDED_ACTION',
      message: 'recommended_next_action must be present',
      severity: 'error',
    });
  }

  try {
    const inputs = loadPromotionGateInputs(root);
    if (!isPromotionDecisionReproducible(inputs)) {
      issues.push({
        code: 'DECISION_NOT_REPRODUCIBLE',
        message: 'Gate decision is not reproducible across repeated evaluation',
        severity: 'error',
      });
    }

    const rebuilt = buildGonegiPipelinePromotionGateReport(inputs, gateReport.timestamp);
    if (rebuilt.promotion_status !== gateReport.promotion_status) {
      issues.push({
        code: 'STATUS_MISMATCH',
        message: `Rebuilt promotion_status ${rebuilt.promotion_status} != ${gateReport.promotion_status}`,
        severity: 'error',
      });
    }
    if (rebuilt.promotion_score !== gateReport.promotion_score) {
      issues.push({
        code: 'SCORE_MISMATCH',
        message: `Rebuilt promotion_score ${rebuilt.promotion_score} != ${gateReport.promotion_score}`,
        severity: 'error',
      });
    }
    if (rebuilt.decision_hash !== gateReport.decision_hash) {
      issues.push({
        code: 'DECISION_HASH_MISMATCH',
        message: 'decision_hash does not match rebuilt evaluation',
        severity: 'error',
      });
    }
  } catch (error) {
    issues.push({
      code: 'REPRODUCIBILITY_CHECK_FAILED',
      message: error instanceof Error ? error.message : 'Reproducibility check failed',
      severity: 'error',
    });
  }

  const pass =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    gateReport.final_verdict === PROMOTION_GATE_PASS_VERDICT;

  if (!pass && gateReport.final_verdict === PROMOTION_GATE_PASS_VERDICT) {
    gateReport = { ...gateReport, final_verdict: PROMOTION_GATE_FAIL_VERDICT };
  }

  return { pass, issues, report: gateReport };
}
