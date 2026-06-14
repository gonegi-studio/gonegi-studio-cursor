import fs from 'node:fs';
import path from 'node:path';
import { COMPILED_PROMPT_EXPORT_PATH } from './promptCompiler.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  STORY_TO_BLUEPRINT_PASS_VERDICT,
  STORY_TO_BLUEPRINT_READY_STATUS,
  STORY_TO_BLUEPRINT_REPORT_PATH,
} from './storyToBlueprint.js';

export const GENERATION_QA_PHASE = 'PHASE-QA-001' as const;
export const GENERATION_QA_PASS_VERDICT = 'PASS_GENERATION_QA_AND_ERROR_CONTEXT_SYSTEM_V1' as const;
export const GENERATION_QA_FAIL_VERDICT = 'FAIL_GENERATION_QA_AND_ERROR_CONTEXT_SYSTEM_V1' as const;
export const GENERATION_QA_READY_STATUS = 'GENERATION_QA_READY' as const;

export const GENERATION_QA_SPEC_DATASET_PATH =
  'datasets/generation_qa/generation-qa-specification.json' as const;
export const ERROR_CONTEXT_SPEC_DATASET_PATH =
  'datasets/generation_qa/error-context-specification.json' as const;
export const GENERATION_QA_SPEC_EXPORT_PATH =
  'exports/generation_qa/generation-qa-specification.json' as const;
export const ERROR_CONTEXT_SPEC_EXPORT_PATH =
  'exports/generation_qa/error-context-specification.json' as const;
export const GENERATION_QA_REPORT_PATH =
  'reports/generation_qa/GENERATION_QA_AND_ERROR_CONTEXT_REPORT.json' as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface GenerationQaReport {
  report_id: string;
  phase: typeof GENERATION_QA_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { story_to_blueprint_pass: boolean; precheck_passed: boolean };
  policy: { all_previous_outputs_read_only: boolean; write_policy: typeof SAFE_CREATE_POLICY };
  qa_summary: { generation_qa_integrity: string; error_context_integrity: string };
  issues: ValidationIssue[];
  generation_qa_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

export function writeGenerationQaAndErrorContext(projectRoot?: string): GenerationQaReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const storyReport = readJson<Record<string, unknown>>(root, STORY_TO_BLUEPRINT_REPORT_PATH);
  const storyPass = String(storyReport.final_verdict ?? '') === STORY_TO_BLUEPRINT_PASS_VERDICT;
  const storyReady = String(storyReport.status ?? '') === STORY_TO_BLUEPRINT_READY_STATUS;

  if (!storyPass || !storyReady) {
    issues.push({
      code: 'STORY_TO_BLUEPRINT_PRECHECK_FAIL',
      message: 'Expected PASS_STORY_TO_BLUEPRINT_ENGINE_V1',
      severity: 'error',
    });
  }

  const qaSpec = readJson<{
    generation_qa_integrity: string;
    error_context_spec_ref: string;
    compiled_prompt_ref: string;
  }>(root, GENERATION_QA_SPEC_DATASET_PATH);
  const errorSpec = readJson<{ error_context_integrity: string; error_context_fields: string[] }>(
    root,
    ERROR_CONTEXT_SPEC_DATASET_PATH
  );

  if (!fs.existsSync(path.join(root, COMPILED_PROMPT_EXPORT_PATH))) {
    issues.push({
      code: 'COMPILED_PROMPT_MISSING',
      message: `Missing ${COMPILED_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  const generationQaIntegrity = qaSpec.generation_qa_integrity === 'PASS' ? 'PASS' : 'FAIL';
  const errorContextIntegrity = errorSpec.error_context_integrity === 'PASS' ? 'PASS' : 'FAIL';

  const ready =
    storyPass &&
    storyReady &&
    generationQaIntegrity === 'PASS' &&
    errorContextIntegrity === 'PASS' &&
    issues.length === 0;

  fs.mkdirSync(path.join(root, 'exports/generation_qa'), { recursive: true });
  fs.mkdirSync(path.join(root, 'reports/generation_qa'), { recursive: true });

  fs.writeFileSync(
    path.join(root, GENERATION_QA_SPEC_EXPORT_PATH),
    `${JSON.stringify({ ...qaSpec, export_id: 'generation-qa-specification-export-v1', generated_at: new Date().toISOString(), generation_qa_integrity: generationQaIntegrity }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, ERROR_CONTEXT_SPEC_EXPORT_PATH),
    `${JSON.stringify({ ...errorSpec, export_id: 'error-context-specification-export-v1', generated_at: new Date().toISOString(), error_context_integrity: errorContextIntegrity }, null, 2)}\n`,
    'utf8'
  );

  const report: GenerationQaReport = {
    report_id: 'generation-qa-and-error-context-report-v1',
    phase: GENERATION_QA_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: ready ? GENERATION_QA_PASS_VERDICT : GENERATION_QA_FAIL_VERDICT,
    status: ready ? GENERATION_QA_READY_STATUS : 'GENERATION_QA_INCOMPLETE',
    precheck: { story_to_blueprint_pass: storyPass && storyReady, precheck_passed: storyPass && storyReady },
    policy: { all_previous_outputs_read_only: true, write_policy: SAFE_CREATE_POLICY },
    qa_summary: { generation_qa_integrity: generationQaIntegrity, error_context_integrity: errorContextIntegrity },
    issues,
    generation_qa_ready: ready,
  };

  fs.writeFileSync(
    path.join(root, GENERATION_QA_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}
