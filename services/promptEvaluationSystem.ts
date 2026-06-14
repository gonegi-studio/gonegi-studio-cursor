import fs from 'node:fs';
import path from 'node:path';
import {
  GENERATION_QA_PASS_VERDICT,
  GENERATION_QA_READY_STATUS,
  GENERATION_QA_REPORT_PATH,
  GENERATION_QA_SPEC_EXPORT_PATH,
  ERROR_CONTEXT_SPEC_EXPORT_PATH,
} from './generationQaAndErrorContextSystem.js';
import { GENERATION_OPERATION_STACK_READ_ONLY_PATHS } from './storyToBlueprint.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  COMPILED_PROMPT_EXPORT_PATH,
  PROMPT_COMPILER_SPEC_EXPORT_PATH,
} from './promptCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROMPT_EVALUATION_PHASE = 'PHASE-QA-002' as const;
export const PROMPT_EVALUATION_PASS_VERDICT = 'PASS_PROMPT_EVALUATION_SYSTEM_V1' as const;
export const PROMPT_EVALUATION_FAIL_VERDICT = 'FAIL_PROMPT_EVALUATION_SYSTEM_V1' as const;
export const PROMPT_EVALUATION_READY_STATUS = 'PROMPT_EVALUATION_READY' as const;

export const PROMPT_QUALITY_SPEC_DATASET_PATH =
  'datasets/prompt_evaluation/prompt-quality-specification.json' as const;
export const PROMPT_SCORECARD_DATASET_PATH =
  'datasets/prompt_evaluation/prompt-scorecard.json' as const;
export const PROMPT_RISK_LIBRARY_DATASET_PATH =
  'datasets/prompt_evaluation/prompt-risk-library.json' as const;
export const PROMPT_IMPROVEMENT_LIBRARY_DATASET_PATH =
  'datasets/prompt_evaluation/prompt-improvement-library.json' as const;

export const PROMPT_EVALUATION_EXPORT_DIR = 'exports/prompt_evaluation' as const;
export const PROMPT_QUALITY_SPEC_EXPORT_PATH =
  'exports/prompt_evaluation/prompt-quality-specification.json' as const;
export const PROMPT_SCORECARD_EXPORT_PATH =
  'exports/prompt_evaluation/prompt-scorecard.json' as const;
export const PROMPT_RISK_REPORT_EXPORT_PATH =
  'exports/prompt_evaluation/prompt-risk-report.json' as const;
export const PROMPT_IMPROVEMENT_REPORT_EXPORT_PATH =
  'exports/prompt_evaluation/prompt-improvement-report.json' as const;
export const GENERATION_READINESS_EXPORT_PATH =
  'exports/prompt_evaluation/generation-readiness.json' as const;

export const PROMPT_EVALUATION_REPORT_DIR = 'reports/prompt_evaluation' as const;
export const PROMPT_EVALUATION_REPORT_PATH =
  'reports/prompt_evaluation/PROMPT_EVALUATION_SYSTEM_REPORT.json' as const;

const QUALITY_DIMENSIONS = [
  'identity_clarity',
  'identity_consistency',
  'location_clarity',
  'location_consistency',
  'lighting_clarity',
  'style_clarity',
  'composition_clarity',
  'camera_clarity',
  'motion_clarity',
  'continuity_clarity',
  'memory_clarity',
] as const;

const SCORE_FIELDS = [
  'prompt_quality_score',
  'identity_score',
  'continuity_score',
  'memory_score',
  'generation_readiness_score',
] as const;

const RISK_TYPES = [
  'under_specified',
  'over_specified',
  'conflicting_identity',
  'conflicting_adapter',
  'missing_continuity',
  'missing_memory',
  'missing_generation_constraints',
] as const;

const IMPROVEMENT_FLOW = ['risk', 'cause', 'fix', 'recommended_prompt_change'] as const;

const MINIMUM_SCORE = 0.8;
const TARGET_SCORE = 0.9;
const PRODUCTION_SCORE = 0.95;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface CompiledPrompt {
  compiled_prompt_id: string;
  prompt_trace_id: string;
  prompt_version: string;
  compiler_rule_version: string;
  shot_to_prompt_integrity: string;
  prompt_traceability_integrity: string;
  input_refs: Record<string, string>;
  generation_prompt: Record<string, unknown>;
}

export interface PromptEvaluationReport {
  report_id: string;
  phase: typeof PROMPT_EVALUATION_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    generation_qa_pass: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  evaluation_summary: {
    prompt_quality_integrity: string;
    prompt_scorecard_integrity: string;
    prompt_risk_integrity: string;
    prompt_improvement_integrity: string;
    prompt_traceability_integrity: string;
    prompt_generation_readiness: string;
    prompt_compiler_compatibility: string;
    generation_qa_compatibility: string;
    generation_readiness_score: number;
  };
  outputs: {
    quality_spec_path: string;
    scorecard_path: string;
    risk_report_path: string;
    improvement_report_path: string;
    generation_readiness_path: string;
  };
  issues: ValidationIssue[];
  prompt_evaluation_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  generation_qa_pass: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, GENERATION_QA_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'GENERATION_QA_REPORT_MISSING',
      message: `Missing report at ${GENERATION_QA_REPORT_PATH}`,
      severity: 'error',
    });
    return { generation_qa_pass: false, precheck_passed: false, issues };
  }

  const qaReport = readJson<Record<string, unknown>>(root, GENERATION_QA_REPORT_PATH);
  const verdict = String(qaReport.final_verdict ?? '');
  const status = String(qaReport.status ?? '');

  const generation_qa_pass =
    verdict === GENERATION_QA_PASS_VERDICT && status === GENERATION_QA_READY_STATUS;

  if (!generation_qa_pass) {
    issues.push({
      code: 'GENERATION_QA_PRECHECK_FAIL',
      message: `Expected ${GENERATION_QA_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return { generation_qa_pass, precheck_passed: generation_qa_pass, issues };
}

function validateQualitySpec(spec: {
  quality_dimensions: string[];
  quality_dimension_count: number;
  prompt_quality_integrity: string;
}): { prompt_quality_integrity: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const dimension of QUALITY_DIMENSIONS) {
    if (!spec.quality_dimensions.includes(dimension)) {
      issues.push({
        code: 'QUALITY_DIMENSION_MISSING',
        message: `Missing dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  if (spec.quality_dimension_count < QUALITY_DIMENSIONS.length) {
    issues.push({
      code: 'QUALITY_DIMENSION_COUNT_LOW',
      message: `quality_dimension_count=${spec.quality_dimension_count}`,
      severity: 'error',
    });
  }

  const integrity =
    spec.prompt_quality_integrity === 'PASS' && issues.length === 0 ? 'PASS' : 'FAIL';

  return { prompt_quality_integrity: integrity, issues };
}

function validateScorecard(scorecard: {
  required_score_fields: string[];
  scores: Record<string, number>;
  prompt_scorecard_integrity: string;
  prompt_generation_readiness: string;
}): {
  prompt_scorecard_integrity: string;
  prompt_generation_readiness: string;
  generation_readiness_score: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const field of SCORE_FIELDS) {
    if (!scorecard.required_score_fields.includes(field)) {
      issues.push({
        code: 'SCORE_FIELD_MISSING',
        message: `Missing score field ${field}`,
        severity: 'error',
      });
    }
    const score = scorecard.scores[field];
    if (typeof score !== 'number' || score < MINIMUM_SCORE) {
      issues.push({
        code: 'SCORE_BELOW_MINIMUM',
        message: `${field}=${score}`,
        severity: 'error',
      });
    }
  }

  const readinessScore = scorecard.scores.generation_readiness_score;
  const promptGenerationReadiness =
    scorecard.prompt_generation_readiness === 'PASS' && readinessScore >= MINIMUM_SCORE
      ? 'PASS'
      : 'FAIL';

  const scorecardIntegrity =
    scorecard.prompt_scorecard_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('SCORE')).length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    prompt_scorecard_integrity: scorecardIntegrity,
    prompt_generation_readiness: promptGenerationReadiness,
    generation_readiness_score: readinessScore,
    issues,
  };
}

function validateRiskLibrary(riskLib: {
  risk_types: string[];
  risk_type_count: number;
  risks: { risk_type: string }[];
  prompt_risk_integrity: string;
}): { prompt_risk_integrity: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const riskType of RISK_TYPES) {
    if (!riskLib.risk_types.includes(riskType)) {
      issues.push({
        code: 'RISK_TYPE_MISSING',
        message: `Missing risk type ${riskType}`,
        severity: 'error',
      });
    }
    if (!riskLib.risks.some((r) => r.risk_type === riskType)) {
      issues.push({
        code: 'RISK_ENTRY_MISSING',
        message: `Missing risk entry for ${riskType}`,
        severity: 'error',
      });
    }
  }

  const integrity =
    riskLib.prompt_risk_integrity === 'PASS' &&
    riskLib.risk_type_count >= RISK_TYPES.length &&
    issues.length === 0
      ? 'PASS'
      : 'FAIL';

  return { prompt_risk_integrity: integrity, issues };
}

function validateImprovementLibrary(improvementLib: {
  improvement_flow: string[];
  improvements: {
    risk_type: string;
    cause: string;
    fix: string;
    recommended_prompt_change: string;
  }[];
  prompt_improvement_integrity: string;
}): { prompt_improvement_integrity: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  for (const step of IMPROVEMENT_FLOW) {
    if (!improvementLib.improvement_flow.includes(step)) {
      issues.push({
        code: 'IMPROVEMENT_FLOW_STEP_MISSING',
        message: `Missing flow step ${step}`,
        severity: 'error',
      });
    }
  }

  for (const improvement of improvementLib.improvements) {
    if (!improvement.cause || !improvement.fix || !improvement.recommended_prompt_change) {
      issues.push({
        code: 'IMPROVEMENT_FIELD_MISSING',
        message: `Incomplete improvement for ${improvement.risk_type}`,
        severity: 'error',
      });
    }
  }

  const integrity =
    improvementLib.prompt_improvement_integrity === 'PASS' && issues.length === 0
      ? 'PASS'
      : 'FAIL';

  return { prompt_improvement_integrity: integrity, issues };
}

function validateCompilerCompatibility(
  root: string,
  compiledPrompt: CompiledPrompt
): { prompt_compiler_compatibility: string; prompt_traceability_integrity: string; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (!fs.existsSync(path.join(root, COMPILED_PROMPT_EXPORT_PATH))) {
    issues.push({
      code: 'COMPILED_PROMPT_MISSING',
      message: `Missing ${COMPILED_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, PROMPT_COMPILER_SPEC_EXPORT_PATH))) {
    issues.push({
      code: 'PROMPT_COMPILER_SPEC_MISSING',
      message: `Missing ${PROMPT_COMPILER_SPEC_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  if (compiledPrompt.shot_to_prompt_integrity !== 'PASS') {
    issues.push({
      code: 'SHOT_TO_PROMPT_INTEGRITY_FAIL',
      message: 'Compiled prompt shot_to_prompt_integrity not PASS',
      severity: 'error',
    });
  }

  const traceabilityIntegrity =
    compiledPrompt.prompt_traceability_integrity === 'PASS' &&
    typeof compiledPrompt.prompt_trace_id === 'string' &&
    compiledPrompt.prompt_trace_id !== ''
      ? 'PASS'
      : 'FAIL';

  const compilerCompatibility =
    compiledPrompt.shot_to_prompt_integrity === 'PASS' &&
    traceabilityIntegrity === 'PASS' &&
    issues.length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    prompt_compiler_compatibility: compilerCompatibility,
    prompt_traceability_integrity: traceabilityIntegrity,
    issues,
  };
}

function validateGenerationQaCompatibility(root: string): {
  generation_qa_compatibility: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const ref of [GENERATION_QA_SPEC_EXPORT_PATH, ERROR_CONTEXT_SPEC_EXPORT_PATH]) {
    if (!fs.existsSync(path.join(root, ref))) {
      issues.push({
        code: 'GENERATION_QA_REF_MISSING',
        message: `Missing ${ref}`,
        severity: 'error',
      });
    }
  }

  return {
    generation_qa_compatibility: issues.length === 0 ? 'PASS' : 'FAIL',
    issues,
  };
}

export function writePromptEvaluationSystem(projectRoot?: string): PromptEvaluationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const qualitySpec = readJson<{
    quality_dimensions: string[];
    quality_dimension_count: number;
    prompt_quality_integrity: string;
    dimension_weights: Record<string, number>;
    minimum_quality_score: number;
  }>(root, PROMPT_QUALITY_SPEC_DATASET_PATH);

  const scorecard = readJson<{
    required_score_fields: string[];
    scores: Record<string, number>;
    prompt_scorecard_integrity: string;
    prompt_generation_readiness: string;
  }>(root, PROMPT_SCORECARD_DATASET_PATH);

  const riskLib = readJson<{
    risk_types: string[];
    risk_type_count: number;
    risks: { risk_id: string; risk_type: string; severity: string }[];
    prompt_risk_integrity: string;
  }>(root, PROMPT_RISK_LIBRARY_DATASET_PATH);

  const improvementLib = readJson<{
    improvement_flow: string[];
    improvements: {
      improvement_id: string;
      risk_type: string;
      cause: string;
      fix: string;
      recommended_prompt_change: string;
    }[];
    prompt_improvement_integrity: string;
  }>(root, PROMPT_IMPROVEMENT_LIBRARY_DATASET_PATH);

  const compiledPrompt = readJson<CompiledPrompt>(root, COMPILED_PROMPT_EXPORT_PATH);

  const qualityValidation = validateQualitySpec(qualitySpec);
  issues.push(...qualityValidation.issues);

  const scorecardValidation = validateScorecard(scorecard);
  issues.push(...scorecardValidation.issues);

  const riskValidation = validateRiskLibrary(riskLib);
  issues.push(...riskValidation.issues);

  const improvementValidation = validateImprovementLibrary(improvementLib);
  issues.push(...improvementValidation.issues);

  const compilerValidation = validateCompilerCompatibility(root, compiledPrompt);
  issues.push(...compilerValidation.issues);

  const qaCompat = validateGenerationQaCompatibility(root);
  issues.push(...qaCompat.issues);

  const detectedRisks = riskLib.risks.filter((risk) => {
    if (risk.risk_type === 'missing_continuity') {
      return scorecard.scores.continuity_score < TARGET_SCORE;
    }
    if (risk.risk_type === 'missing_memory') {
      return scorecard.scores.memory_score < TARGET_SCORE;
    }
    return false;
  });

  const riskReport = {
    risk_report_id: 'prompt-risk-report-v1',
    phase: PROMPT_EVALUATION_PHASE,
    generated_at: new Date().toISOString(),
    compiled_prompt_ref: COMPILED_PROMPT_EXPORT_PATH,
    prompt_trace_id: compiledPrompt.prompt_trace_id,
    risk_type_count: RISK_TYPES.length,
    detected_risk_count: detectedRisks.length,
    detected_risks: detectedRisks,
    all_risk_types_catalogued: [...RISK_TYPES],
    prompt_risk_integrity: riskValidation.prompt_risk_integrity,
  };

  const improvementReport = {
    improvement_report_id: 'prompt-improvement-report-v1',
    phase: PROMPT_EVALUATION_PHASE,
    generated_at: new Date().toISOString(),
    improvement_flow: [...IMPROVEMENT_FLOW],
    recommendations: improvementLib.improvements.map((imp) => ({
      risk: imp.risk_type,
      cause: imp.cause,
      fix: imp.fix,
      recommended_prompt_change: imp.recommended_prompt_change,
    })),
    prompt_improvement_integrity: improvementValidation.prompt_improvement_integrity,
  };

  const generationReadiness = {
    readiness_id: 'generation-readiness-v1',
    phase: PROMPT_EVALUATION_PHASE,
    generated_at: new Date().toISOString(),
    compiled_prompt_ref: COMPILED_PROMPT_EXPORT_PATH,
    prompt_trace_id: compiledPrompt.prompt_trace_id,
    generation_readiness_score: scorecardValidation.generation_readiness_score,
    prompt_generation_readiness: scorecardValidation.prompt_generation_readiness,
    thresholds: {
      minimum_score: MINIMUM_SCORE,
      target_score: TARGET_SCORE,
      production_score: PRODUCTION_SCORE,
    },
    quality_audit_passed: qualityValidation.prompt_quality_integrity === 'PASS',
    risk_detection_passed: riskValidation.prompt_risk_integrity === 'PASS',
    ready_for_generation:
      scorecardValidation.prompt_generation_readiness === 'PASS' &&
      scorecardValidation.generation_readiness_score >= MINIMUM_SCORE,
  };

  const scorecardExport = {
    ...scorecard,
    export_id: 'prompt-scorecard-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PROMPT_SCORECARD_DATASET_PATH,
    compiled_prompt_ref: COMPILED_PROMPT_EXPORT_PATH,
    prompt_trace_id: compiledPrompt.prompt_trace_id,
    prompt_scorecard_integrity: scorecardValidation.prompt_scorecard_integrity,
    prompt_generation_readiness: scorecardValidation.prompt_generation_readiness,
  };

  const qualityExport = {
    ...qualitySpec,
    export_id: 'prompt-quality-specification-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PROMPT_QUALITY_SPEC_DATASET_PATH,
    quality_dimension_list: [...QUALITY_DIMENSIONS],
    prompt_quality_integrity: qualityValidation.prompt_quality_integrity,
    dimension_scores: Object.fromEntries(
      QUALITY_DIMENSIONS.map((dim) => [
        dim,
        scorecard.scores.prompt_quality_score * (qualitySpec.dimension_weights[dim] ?? 0.08),
      ])
    ),
  };

  const errors = issues.filter((issue) => issue.severity === 'error');
  const evaluationReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    qualityValidation.prompt_quality_integrity === 'PASS' &&
    scorecardValidation.prompt_scorecard_integrity === 'PASS' &&
    riskValidation.prompt_risk_integrity === 'PASS' &&
    improvementValidation.prompt_improvement_integrity === 'PASS' &&
    compilerValidation.prompt_traceability_integrity === 'PASS' &&
    scorecardValidation.prompt_generation_readiness === 'PASS' &&
    compilerValidation.prompt_compiler_compatibility === 'PASS' &&
    qaCompat.generation_qa_compatibility === 'PASS';

  fs.mkdirSync(path.join(root, PROMPT_EVALUATION_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, PROMPT_EVALUATION_REPORT_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, PROMPT_QUALITY_SPEC_EXPORT_PATH),
    `${JSON.stringify(qualityExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_SCORECARD_EXPORT_PATH),
    `${JSON.stringify(scorecardExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_RISK_REPORT_EXPORT_PATH),
    `${JSON.stringify(riskReport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PROMPT_IMPROVEMENT_REPORT_EXPORT_PATH),
    `${JSON.stringify(improvementReport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATION_READINESS_EXPORT_PATH),
    `${JSON.stringify(generationReadiness, null, 2)}\n`,
    'utf8'
  );

  const report: PromptEvaluationReport = {
    report_id: 'prompt-evaluation-system-report-v1',
    phase: PROMPT_EVALUATION_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: evaluationReady
      ? PROMPT_EVALUATION_PASS_VERDICT
      : PROMPT_EVALUATION_FAIL_VERDICT,
    status: evaluationReady ? PROMPT_EVALUATION_READY_STATUS : 'PROMPT_EVALUATION_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    evaluation_summary: {
      prompt_quality_integrity: qualityValidation.prompt_quality_integrity,
      prompt_scorecard_integrity: scorecardValidation.prompt_scorecard_integrity,
      prompt_risk_integrity: riskValidation.prompt_risk_integrity,
      prompt_improvement_integrity: improvementValidation.prompt_improvement_integrity,
      prompt_traceability_integrity: compilerValidation.prompt_traceability_integrity,
      prompt_generation_readiness: scorecardValidation.prompt_generation_readiness,
      prompt_compiler_compatibility: compilerValidation.prompt_compiler_compatibility,
      generation_qa_compatibility: qaCompat.generation_qa_compatibility,
      generation_readiness_score: scorecardValidation.generation_readiness_score,
    },
    outputs: {
      quality_spec_path: PROMPT_QUALITY_SPEC_EXPORT_PATH,
      scorecard_path: PROMPT_SCORECARD_EXPORT_PATH,
      risk_report_path: PROMPT_RISK_REPORT_EXPORT_PATH,
      improvement_report_path: PROMPT_IMPROVEMENT_REPORT_EXPORT_PATH,
      generation_readiness_path: GENERATION_READINESS_EXPORT_PATH,
    },
    issues,
    prompt_evaluation_ready: evaluationReady,
  };

  fs.writeFileSync(
    path.join(root, PROMPT_EVALUATION_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export { GENERATION_OPERATION_STACK_READ_ONLY_PATHS };
