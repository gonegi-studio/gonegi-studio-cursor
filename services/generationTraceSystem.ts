import fs from 'node:fs';
import path from 'node:path';
import { COMPILED_PROMPT_EXPORT_PATH } from './promptCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { PRODUCTION_FAILURE_SPEC_EXPORT_PATH } from './productionExecutionPipeline.js';

export const GENERATION_TRACE_MODULE = 'GENERATION_TRACE_SYSTEM_V1' as const;

export const GENERATION_TRACE_SPEC_DATASET_PATH =
  'datasets/generation/generation-trace-specification.json' as const;
export const GENERATION_TRACE_SPEC_EXPORT_PATH =
  'exports/generation/generation-trace-specification.json' as const;

const TRACE_DIMENSIONS = [
  'prompt_trace',
  'image_trace',
  'video_trace',
  'failure_trace',
  'recovery_trace',
] as const;

const TRACE_FLOW = ['prompt', 'image', 'video', 'failure_trace'] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface GenerationTraceSpecification {
  spec_id: string;
  upstream_checkpoint: string;
  trace_flow: string[];
  trace_dimension_count: number;
  trace_dimensions: string[];
  generation_trace_integrity: string;
  trace_links: { trace_id: string; input_trace: string; output_trace: string }[];
  compiled_prompt_ref: string;
  production_failure_spec_ref: string;
}

export interface GenerationTraceResult {
  generation_trace_integrity: string;
  trace_dimension_count: number;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

export function validateAndExportGenerationTrace(projectRoot?: string): GenerationTraceResult {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const spec = readJson<GenerationTraceSpecification>(root, GENERATION_TRACE_SPEC_DATASET_PATH);

  if (spec.upstream_checkpoint !== 'REAL_FEATURE_PRODUCTION_READY') {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  for (const dimension of TRACE_DIMENSIONS) {
    if (!spec.trace_dimensions.includes(dimension)) {
      issues.push({
        code: 'TRACE_DIMENSION_MISSING',
        message: `Missing trace dimension ${dimension}`,
        severity: 'error',
      });
    }
  }

  for (const step of TRACE_FLOW) {
    if (!spec.trace_flow.includes(step)) {
      issues.push({
        code: 'TRACE_FLOW_STEP_MISSING',
        message: `Missing trace flow step ${step}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, COMPILED_PROMPT_EXPORT_PATH))) {
    issues.push({
      code: 'COMPILED_PROMPT_MISSING',
      message: `Missing compiled prompt at ${COMPILED_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  if (!fs.existsSync(path.join(root, PRODUCTION_FAILURE_SPEC_EXPORT_PATH))) {
    issues.push({
      code: 'FAILURE_SPEC_MISSING',
      message: `Missing failure spec at ${PRODUCTION_FAILURE_SPEC_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  const expectedLinks = [
    { input: 'prompt_trace', output: 'image_trace' },
    { input: 'image_trace', output: 'video_trace' },
    { input: 'video_trace', output: 'failure_trace' },
    { input: 'failure_trace', output: 'recovery_trace' },
  ];

  for (const expected of expectedLinks) {
    const linked = spec.trace_links.some(
      (link) => link.input_trace === expected.input && link.output_trace === expected.output
    );
    if (!linked) {
      issues.push({
        code: 'TRACE_LINK_MISSING',
        message: `Missing trace link ${expected.input} -> ${expected.output}`,
        severity: 'error',
      });
    }
  }

  const generationTraceIntegrity =
    spec.generation_trace_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('TRACE')).length === 0
      ? 'PASS'
      : 'FAIL';

  if (spec.generation_trace_integrity !== 'PASS') {
    issues.push({
      code: 'GENERATION_TRACE_INTEGRITY_FAIL',
      message: `generation_trace_integrity=${spec.generation_trace_integrity}`,
      severity: 'error',
    });
  }

  const specExport = {
    ...spec,
    export_id: 'generation-trace-specification-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: GENERATION_TRACE_SPEC_DATASET_PATH,
    trace_dimension_list: [...TRACE_DIMENSIONS],
    trace_flow_list: [...TRACE_FLOW],
    generation_trace_integrity: generationTraceIntegrity,
  };

  fs.mkdirSync(path.join(root, 'exports/generation'), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATION_TRACE_SPEC_EXPORT_PATH),
    `${JSON.stringify(specExport, null, 2)}\n`,
    'utf8'
  );

  return {
    generation_trace_integrity: generationTraceIntegrity,
    trace_dimension_count: spec.trace_dimensions.length,
    issues,
  };
}
