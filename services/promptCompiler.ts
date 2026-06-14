import fs from 'node:fs';
import path from 'node:path';
import { FEATURE_FILM_SHOT_REGISTRY_PATH } from './featureFilmShotAssembly.js';
import { IMAGE_CONSISTENCY_SPEC_EXPORT_PATH } from './imageConsistencyValidation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH } from './productionExecutionPipeline.js';
import { TEMPORAL_MEMORY_SPEC_EXPORT_PATH } from './temporalMemoryValidation.js';

export const PROMPT_COMPILER_MODULE = 'PROMPT_COMPILER_V1' as const;

export const PROMPT_COMPILER_SPEC_DATASET_PATH =
  'datasets/generation/prompt-compiler-specification.json' as const;
export const PROMPT_COMPILER_SPEC_EXPORT_PATH =
  'exports/generation/prompt-compiler-specification.json' as const;
export const COMPILED_PROMPT_EXPORT_PATH = 'exports/generation/compiled-prompt.json' as const;

const COMPILER_INPUTS = ['shot', 'dna', 'continuity', 'memory'] as const;
const REQUIRED_PROMPT_FIELDS = [
  'prompt_version',
  'prompt_seed',
  'prompt_trace_id',
  'compiler_rule_version',
] as const;

const INPUT_SOURCE_REFS: Record<(typeof COMPILER_INPUTS)[number], string> = {
  shot: FEATURE_FILM_SHOT_REGISTRY_PATH,
  dna: IMAGE_CONSISTENCY_SPEC_EXPORT_PATH,
  continuity: PRODUCTION_TRACEABILITY_SPEC_EXPORT_PATH,
  memory: TEMPORAL_MEMORY_SPEC_EXPORT_PATH,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface PromptCompilerSpecification {
  spec_id: string;
  upstream_checkpoint: string;
  compiler_inputs: Record<string, { input_id: string; source_ref: string }>;
  compiler_output: { artifact_name: string; artifact_ref: string };
  required_fields: string[];
  compiler_rule_version: string;
  shot_to_prompt_integrity: string;
  prompt_traceability_integrity: string;
}

export interface PromptCompilerResult {
  shot_to_prompt_integrity: string;
  prompt_traceability_integrity: string;
  prompt_compiler_integrity: string;
  compiled_prompt_path: string;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

export function validateAndCompilePrompt(projectRoot?: string): PromptCompilerResult {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const spec = readJson<PromptCompilerSpecification>(root, PROMPT_COMPILER_SPEC_DATASET_PATH);

  if (spec.upstream_checkpoint !== 'REAL_FEATURE_PRODUCTION_READY') {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${spec.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  for (const input of COMPILER_INPUTS) {
    if (!spec.compiler_inputs[input]) {
      issues.push({
        code: 'COMPILER_INPUT_MISSING',
        message: `Missing compiler input ${input}`,
        severity: 'error',
      });
      continue;
    }
    const sourceRef = INPUT_SOURCE_REFS[input];
    if (!fs.existsSync(path.join(root, sourceRef))) {
      issues.push({
        code: 'COMPILER_INPUT_REF_MISSING',
        message: `Missing source ref ${sourceRef} for ${input}`,
        severity: 'error',
      });
    }
  }

  for (const field of REQUIRED_PROMPT_FIELDS) {
    if (!spec.required_fields.includes(field)) {
      issues.push({
        code: 'REQUIRED_FIELD_MISSING',
        message: `Missing required field ${field}`,
        severity: 'error',
      });
    }
  }

  const shotRegistry = readJson<{ registry_id: string; required_fields: string[] }>(
    root,
    FEATURE_FILM_SHOT_REGISTRY_PATH
  );
  if (!shotRegistry.registry_id || !shotRegistry.required_fields?.includes('shot_id')) {
    issues.push({
      code: 'SHOT_REGISTRY_INVALID',
      message: 'Shot registry missing required shot_id field contract',
      severity: 'error',
    });
  }

  const shotToPromptIntegrity =
    spec.shot_to_prompt_integrity === 'PASS' &&
    issues.filter((i) => i.code.startsWith('SHOT') || i.code.startsWith('COMPILER_INPUT')).length ===
      0
      ? 'PASS'
      : 'FAIL';

  const promptTraceabilityIntegrity =
    spec.prompt_traceability_integrity === 'PASS' &&
    REQUIRED_PROMPT_FIELDS.every((f) => spec.required_fields.includes(f)) &&
    issues.filter((i) => i.code === 'REQUIRED_FIELD_MISSING').length === 0
      ? 'PASS'
      : 'FAIL';

  if (spec.shot_to_prompt_integrity !== 'PASS') {
    issues.push({
      code: 'SHOT_TO_PROMPT_INTEGRITY_FAIL',
      message: `shot_to_prompt_integrity=${spec.shot_to_prompt_integrity}`,
      severity: 'error',
    });
  }
  if (spec.prompt_traceability_integrity !== 'PASS') {
    issues.push({
      code: 'PROMPT_TRACEABILITY_INTEGRITY_FAIL',
      message: `prompt_traceability_integrity=${spec.prompt_traceability_integrity}`,
      severity: 'error',
    });
  }

  const promptCompilerIntegrity =
    shotToPromptIntegrity === 'PASS' && promptTraceabilityIntegrity === 'PASS' ? 'PASS' : 'FAIL';

  const compiledPrompt = {
    compiled_prompt_id: 'compiled-prompt-v1',
    module: PROMPT_COMPILER_MODULE,
    generated_at: new Date().toISOString(),
    prompt_version: 'v1.0.0',
    prompt_seed: 'gpu-prep-001-seed',
    prompt_trace_id: 'prompt-trace-gpu-prep-001',
    compiler_rule_version: spec.compiler_rule_version,
    compilation_formula: 'shot * dna * continuity * memory -> generation_prompt',
    input_refs: { ...INPUT_SOURCE_REFS },
    shot_to_prompt_integrity: shotToPromptIntegrity,
    prompt_traceability_integrity: promptTraceabilityIntegrity,
    generation_prompt: {
      template: 'compiled_generation_prompt_v1',
      inputs_bound: [...COMPILER_INPUTS],
      trace_chain_ref: 'exports/generation/generation-trace-specification.json',
    },
  };

  const specExport = {
    ...spec,
    export_id: 'prompt-compiler-specification-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PROMPT_COMPILER_SPEC_DATASET_PATH,
    shot_to_prompt_integrity: shotToPromptIntegrity,
    prompt_traceability_integrity: promptTraceabilityIntegrity,
    input_source_refs: { ...INPUT_SOURCE_REFS },
  };

  fs.mkdirSync(path.join(root, 'exports/generation'), { recursive: true });
  fs.writeFileSync(
    path.join(root, PROMPT_COMPILER_SPEC_EXPORT_PATH),
    `${JSON.stringify(specExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, COMPILED_PROMPT_EXPORT_PATH),
    `${JSON.stringify(compiledPrompt, null, 2)}\n`,
    'utf8'
  );

  return {
    shot_to_prompt_integrity: shotToPromptIntegrity,
    prompt_traceability_integrity: promptTraceabilityIntegrity,
    prompt_compiler_integrity: promptCompilerIntegrity,
    compiled_prompt_path: COMPILED_PROMPT_EXPORT_PATH,
    issues,
  };
}
