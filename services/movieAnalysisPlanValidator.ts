import fs from 'node:fs';
import path from 'node:path';
import {
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  EXTRACTABLE_FAMILIES,
  type ExtractableFamily,
} from './directorGrammarExtractor.js';
import {
  PROMOTION_GATE_PASS_VERDICT,
  PROMOTION_GATE_REPORT_PATH,
} from './gonegiPipelinePromotionGate.js';
import {
  ANALYSIS_PLAN_PHASE,
  ANALYSIS_PLAN_REGISTRY_PATH,
  ANALYSIS_PLAN_SCHEMA_PATH,
  ANALYSIS_PLANS_DIR,
  SEED_ANALYSIS_PLAN_SPECS,
  TARGET_OUTPUTS,
  type MovieAnalysisPlan,
  loadMovieAnalysisPlan,
} from './movieAnalysisPlanBuilder.js';
import {
  FINAL_SET_PATH,
  type SourceVideoFinalSet,
} from './sourceVideoFinalSetBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ANALYSIS_FOUNDATION_PASS_VERDICT =
  'PASS_MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1' as const;
export const ANALYSIS_FOUNDATION_FAIL_VERDICT =
  'FAIL_MOVIE_ANALYSIS_ENGINE_FOUNDATION_V1' as const;
export const ANALYSIS_FOUNDATION_REPORT_PATH =
  'reports/movie-analysis-engine-foundation-report.json' as const;
export const ANALYSIS_FOUNDATION_MD_PATH =
  'reports/MOVIE_ANALYSIS_ENGINE_FOUNDATION.md' as const;

export type AnalysisPlanValidationIssue = {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  field?: string;
  analysis_plan_id?: string;
};

export type AnalysisPlanValidationResult = {
  analysis_plan_id: string;
  status: 'PASS' | 'FAIL';
  issues: AnalysisPlanValidationIssue[];
};

export type MovieAnalysisEngineFoundationReport = {
  report_id: string;
  phase: typeof ANALYSIS_PLAN_PHASE;
  timestamp: string;
  plans: number;
  registry: 'PASS' | 'FAIL';
  source_links: 'PASS' | 'FAIL';
  director_grammar: 'PASS' | 'FAIL';
  promotion_gate: string;
  plan_validations: AnalysisPlanValidationResult[];
  frame_extraction: false;
  ocr: false;
  gpu_execution: false;
  external_call_allowed: false;
  design_only: true;
  final_verdict:
    | typeof ANALYSIS_FOUNDATION_PASS_VERDICT
    | typeof ANALYSIS_FOUNDATION_FAIL_VERDICT;
  issues: AnalysisPlanValidationIssue[];
};

function loadFinalSet(projectRoot: string): SourceVideoFinalSet | null {
  const abs = path.join(projectRoot, FINAL_SET_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as SourceVideoFinalSet;
}

function loadGrammarIds(projectRoot: string): Set<string> {
  const abs = path.join(projectRoot, DIRECTOR_GRAMMAR_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return new Set();
  const registry = JSON.parse(fs.readFileSync(abs, 'utf8')) as {
    grammar_profiles?: Array<{ grammar_id: string }>;
  };
  return new Set((registry.grammar_profiles ?? []).map((p) => p.grammar_id));
}

function validateExecutionFlags(plan: MovieAnalysisPlan): AnalysisPlanValidationIssue[] {
  const issues: AnalysisPlanValidationIssue[] = [];
  const flags = plan.execution_flags;

  if (flags.design_only !== true) {
    issues.push({
      code: 'DESIGN_ONLY_FALSE',
      message: 'execution_flags.design_only must be true',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
      field: 'execution_flags.design_only',
    });
  }
  if (flags.gpu_execution !== false) {
    issues.push({
      code: 'GPU_EXECUTION_ENABLED',
      message: 'execution_flags.gpu_execution must be false',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }
  if (flags.external_call_allowed !== false) {
    issues.push({
      code: 'EXTERNAL_CALL_ENABLED',
      message: 'execution_flags.external_call_allowed must be false',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }
  if (flags.frame_extraction !== false) {
    issues.push({
      code: 'FRAME_EXTRACTION_ENABLED',
      message: 'execution_flags.frame_extraction must be false',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }
  if (flags.ocr !== false) {
    issues.push({
      code: 'OCR_ENABLED',
      message: 'execution_flags.ocr must be false',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  return issues;
}

function validatePlan(
  plan: MovieAnalysisPlan,
  finalSet: SourceVideoFinalSet,
  grammarIds: Set<string>,
  expectedPromotionGate: string
): AnalysisPlanValidationResult {
  const issues: AnalysisPlanValidationIssue[] = [];

  const video = finalSet.videos.find((v) => v.source_video_id === plan.source_video_id);
  if (!video || video.tier !== 'active') {
    issues.push({
      code: 'SOURCE_VIDEO_MISSING',
      message: `Source video ${plan.source_video_id} not found in active final set`,
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  } else if (plan.source_video_path !== video.import_path) {
    issues.push({
      code: 'SOURCE_VIDEO_PATH_MISMATCH',
      message: `source_video_path does not match final set import_path`,
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  if (!grammarIds.has(plan.director_grammar_ref)) {
    issues.push({
      code: 'DIRECTOR_GRAMMAR_UNLINKED',
      message: `director_grammar_ref ${plan.director_grammar_ref} not in registry`,
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  if (!EXTRACTABLE_FAMILIES.includes(plan.director_family as ExtractableFamily)) {
    issues.push({
      code: 'INVALID_DIRECTOR_FAMILY',
      message: `Invalid director_family: ${plan.director_family}`,
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  if (plan.analysis_mode !== 'design_only') {
    issues.push({
      code: 'ANALYSIS_MODE_INVALID',
      message: 'analysis_mode must be design_only',
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  for (const output of TARGET_OUTPUTS) {
    if (!plan.target_outputs.includes(output)) {
      issues.push({
        code: 'TARGET_OUTPUT_MISSING',
        message: `target_outputs missing required output: ${output}`,
        severity: 'error',
        analysis_plan_id: plan.analysis_plan_id,
      });
    }
  }

  if (plan.promotion_gate_status !== expectedPromotionGate) {
    issues.push({
      code: 'PROMOTION_GATE_STATUS_MISMATCH',
      message: `promotion_gate_status expected ${expectedPromotionGate}, got ${plan.promotion_gate_status}`,
      severity: 'error',
      analysis_plan_id: plan.analysis_plan_id,
    });
  }

  if (expectedPromotionGate === 'ALLOW_WITH_WARNING') {
    if (!plan.identity_safety_strategy.promotion_gate_warnings_preserved) {
      issues.push({
        code: 'PROMOTION_GATE_WARNINGS_NOT_PRESERVED',
        message: 'promotion_gate_warnings_preserved must be true when gate is ALLOW_WITH_WARNING',
        severity: 'error',
        analysis_plan_id: plan.analysis_plan_id,
      });
    }
  }

  issues.push(...validateExecutionFlags(plan));

  return {
    analysis_plan_id: plan.analysis_plan_id,
    status: issues.some((i) => i.severity === 'error') ? 'FAIL' : 'PASS',
    issues,
  };
}

function buildMarkdown(report: MovieAnalysisEngineFoundationReport): string {
  const lines = [
    '# Movie Analysis Engine Foundation',
    '',
    `**Phase:** ${report.phase}`,
    `**Timestamp:** ${report.timestamp}`,
    `**Verdict:** ${report.final_verdict}`,
    '',
    '## Pipeline Foundation',
    '',
    '```',
    'source video file',
    '  ↓',
    'analysis plan',
    '  ↓',
    'scene segment candidates',
    '  ↓',
    'coordinate extraction candidates',
    '  ↓',
    'gonegi pipeline',
    '```',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| plans | ${report.plans} |`,
    `| registry | ${report.registry} |`,
    `| source_links | ${report.source_links} |`,
    `| director_grammar | ${report.director_grammar} |`,
    `| promotion_gate | ${report.promotion_gate} |`,
    `| frame_extraction | ${report.frame_extraction} |`,
    `| ocr | ${report.ocr} |`,
    `| gpu_execution | ${report.gpu_execution} |`,
    `| external_call_allowed | ${report.external_call_allowed} |`,
    `| design_only | ${report.design_only} |`,
    '',
    '## Analysis Plans',
    '',
  ];

  for (const validation of report.plan_validations) {
    lines.push(`### ${validation.analysis_plan_id}`);
    lines.push('');
    lines.push(`- status: ${validation.status}`);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        lines.push(`- [${issue.severity}] ${issue.code}: ${issue.message}`);
      }
    }
    lines.push('');
  }

  lines.push('**Next phase:** PHASE-SOURCE-VIDEO-023 MOVIE_ANALYSIS_DRY_RUN_PLANNER_V1');

  return lines.join('\n');
}

export function writeMovieAnalysisEngineFoundationReport(
  projectRoot?: string
): MovieAnalysisEngineFoundationReport {
  const root = resolveProjectRoot(projectRoot);
  const issues: AnalysisPlanValidationIssue[] = [];
  const timestamp = new Date().toISOString();

  const finalSet = loadFinalSet(root);
  if (!finalSet) {
    issues.push({
      code: 'FINAL_SET_MISSING',
      message: `Missing ${FINAL_SET_PATH}`,
      severity: 'error',
    });
  }

  const grammarIds = loadGrammarIds(root);
  if (grammarIds.size === 0) {
    issues.push({
      code: 'GRAMMAR_REGISTRY_MISSING',
      message: `Missing or empty ${DIRECTOR_GRAMMAR_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const promotionGatePath = path.join(root, PROMOTION_GATE_REPORT_PATH);
  let promotionGateStatus = 'UNKNOWN';
  if (!fs.existsSync(promotionGatePath)) {
    issues.push({
      code: 'PROMOTION_GATE_MISSING',
      message: `Missing ${PROMOTION_GATE_REPORT_PATH}`,
      severity: 'error',
    });
  } else {
    const gate = JSON.parse(fs.readFileSync(promotionGatePath, 'utf8')) as {
      promotion_status?: string;
      final_verdict?: string;
    };
    promotionGateStatus = gate.promotion_status ?? 'UNKNOWN';
    if (gate.final_verdict !== PROMOTION_GATE_PASS_VERDICT) {
      issues.push({
        code: 'PROMOTION_GATE_NOT_PASSED',
        message: `Promotion gate verdict must be ${PROMOTION_GATE_PASS_VERDICT}`,
        severity: 'error',
      });
    }
  }

  const registryPath = path.join(root, ANALYSIS_PLAN_REGISTRY_PATH);
  const registryOk = fs.existsSync(registryPath);
  if (!registryOk) {
    issues.push({
      code: 'REGISTRY_MISSING',
      message: `Missing ${ANALYSIS_PLAN_REGISTRY_PATH}`,
      severity: 'error',
    });
  }

  const planValidations: AnalysisPlanValidationResult[] = [];
  const plans: MovieAnalysisPlan[] = [];

  for (const spec of SEED_ANALYSIS_PLAN_SPECS) {
    const plan = loadMovieAnalysisPlan(root, spec.analysis_plan_id);
    if (!plan) {
      issues.push({
        code: 'PLAN_MISSING',
        message: `Missing analysis plan: ${spec.analysis_plan_id}`,
        severity: 'error',
        analysis_plan_id: spec.analysis_plan_id,
      });
      planValidations.push({
        analysis_plan_id: spec.analysis_plan_id,
        status: 'FAIL',
        issues: [
          {
            code: 'PLAN_MISSING',
            message: `Plan file not found in ${ANALYSIS_PLANS_DIR}`,
            severity: 'error',
            analysis_plan_id: spec.analysis_plan_id,
          },
        ],
      });
      continue;
    }

    plans.push(plan);
    if (finalSet) {
      planValidations.push(
        validatePlan(plan, finalSet, grammarIds, promotionGateStatus)
      );
    }
  }

  const allPlanIssues = planValidations.flatMap((v) => v.issues);
  issues.push(...allPlanIssues);

  const sourceLinks =
    finalSet &&
    planValidations.every((v) => v.status === 'PASS') &&
    !allPlanIssues.some((i) => i.code.startsWith('SOURCE_'))
      ? 'PASS'
      : 'FAIL';

  const directorGrammar =
    grammarIds.size > 0 &&
    planValidations.every(
      (v) => !v.issues.some((i) => i.code === 'DIRECTOR_GRAMMAR_UNLINKED')
    )
      ? 'PASS'
      : 'FAIL';

  const registry =
    registryOk &&
    plans.length === 4 &&
    planValidations.every((v) => v.status === 'PASS')
      ? 'PASS'
      : 'FAIL';

  const pass =
    plans.length === 4 &&
    sourceLinks === 'PASS' &&
    directorGrammar === 'PASS' &&
    promotionGateStatus === 'ALLOW_WITH_WARNING' &&
    registry === 'PASS' &&
    issues.filter((i) => i.severity === 'error').length === 0;

  const report: MovieAnalysisEngineFoundationReport = {
    report_id: 'movie-analysis-engine-foundation-report-v1',
    phase: ANALYSIS_PLAN_PHASE,
    timestamp,
    plans: plans.length,
    registry,
    source_links: sourceLinks,
    director_grammar: directorGrammar,
    promotion_gate: promotionGateStatus,
    plan_validations: planValidations,
    frame_extraction: false,
    ocr: false,
    gpu_execution: false,
    external_call_allowed: false,
    design_only: true,
    final_verdict: pass ? ANALYSIS_FOUNDATION_PASS_VERDICT : ANALYSIS_FOUNDATION_FAIL_VERDICT,
    issues,
  };

  const reportsDir = path.join(root, 'reports');
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(
    path.join(root, ANALYSIS_FOUNDATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, ANALYSIS_FOUNDATION_MD_PATH), `${buildMarkdown(report)}\n`, 'utf8');

  return report;
}
