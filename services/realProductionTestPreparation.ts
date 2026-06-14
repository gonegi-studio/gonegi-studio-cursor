import fs from 'node:fs';
import path from 'node:path';
import {
  DIALOGUE_LIPSYNC_PASS_VERDICT,
  DIALOGUE_LIPSYNC_READY_STATUS,
  DIALOGUE_LIPSYNC_REPORT_PATH,
  PROMPT_EVALUATION_READ_ONLY_PATHS,
} from './dialogueLipsyncSystem.js';
import {
  GENERATION_QA_PASS_VERDICT,
  GENERATION_QA_READY_STATUS,
  GENERATION_QA_REPORT_PATH,
} from './generationQaAndErrorContextSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  PROMPT_EVALUATION_PASS_VERDICT,
  PROMPT_EVALUATION_READY_STATUS,
  PROMPT_EVALUATION_REPORT_PATH,
} from './promptEvaluationSystem.js';
import { COMPILED_PROMPT_EXPORT_PATH } from './promptCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  STORY_TO_BLUEPRINT_PASS_VERDICT,
  STORY_TO_BLUEPRINT_REPORT_PATH,
} from './storyToBlueprint.js';

export const REAL_PRODUCTION_TEST_PREP_PHASE = 'PHASE-GPU-PREP-002' as const;
export const REAL_PRODUCTION_TEST_PREP_PASS_VERDICT =
  'PASS_REAL_PRODUCTION_TEST_PREPARATION_V1' as const;
export const REAL_PRODUCTION_TEST_PREP_FAIL_VERDICT =
  'FAIL_REAL_PRODUCTION_TEST_PREPARATION_V1' as const;
export const REAL_PRODUCTION_TEST_READY_STATUS = 'REAL_PRODUCTION_TEST_READY' as const;

export const PRODUCTION_TEST_SPEC_DATASET_PATH =
  'datasets/production_test/production-test-specification.json' as const;
export const PRODUCTION_TEST_SCORECARD_DATASET_PATH =
  'datasets/production_test/production-test-scorecard.json' as const;
export const PRODUCTION_TEST_FAILURE_LIBRARY_DATASET_PATH =
  'datasets/production_test/production-test-failure-library.json' as const;
export const GPU_READINESS_CHECKLIST_DATASET_PATH =
  'datasets/production_test/gpu-readiness-checklist.json' as const;

export const PRODUCTION_TEST_EXPORT_DIR = 'exports/production_test' as const;
export const PRODUCTION_TEST_SPEC_EXPORT_PATH =
  'exports/production_test/production-test-specification.json' as const;
export const PRODUCTION_TEST_SCORECARD_EXPORT_PATH =
  'exports/production_test/production-test-scorecard.json' as const;
export const PRODUCTION_TEST_FAILURE_LIBRARY_EXPORT_PATH =
  'exports/production_test/production-test-failure-library.json' as const;
export const GPU_READINESS_CHECKLIST_EXPORT_PATH =
  'exports/production_test/gpu-readiness-checklist.json' as const;

export const REAL_PRODUCTION_TEST_PREP_REPORT_DIR = 'reports/production_test' as const;
export const REAL_PRODUCTION_TEST_PREP_REPORT_PATH =
  'reports/production_test/REAL_PRODUCTION_TEST_PREPARATION_REPORT.json' as const;

const IDENTITY_DIMENSIONS = [
  'character_identity',
  'location_identity',
  'lighting_identity',
  'style_identity',
  'composition_identity',
  'camera_identity',
  'motion_identity',
  'dialogue_identity',
  'lipsync_identity',
  'memory_identity',
] as const;

const FAILURE_TYPES = [
  'generation_failure',
  'identity_failure',
  'continuity_failure',
  'memory_failure',
  'render_failure',
  'lipsync_failure',
  'prompt_failure',
  'traceability_failure',
] as const;

const CHECKLIST_ITEMS = [
  'prompt_compiler',
  'prompt_evaluation',
  'generation_qa',
  'generation_trace',
  'asset_registry',
  'dataset_evolution',
  'story_engine',
  'dialogue_lipsync',
] as const;

const MINIMUM_SCORE = 0.8;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface ProductionTestScorecard {
  identity_dimensions: string[];
  identity_dimension_count: number;
  memory_identity_integrity: string;
  scorecard_integrity: string;
  scores: Record<string, number>;
}

interface FailureEntry {
  failure_id: string;
  failure_type: string;
  recovery_strategy: string;
}

interface ProductionTestFailureLibrary {
  failure_types: string[];
  failure_type_count: number;
  failures: FailureEntry[];
  prompt_failure_recovery_integrity: string;
  traceability_failure_recovery_integrity: string;
  failure_library_integrity: string;
}

interface ChecklistRef {
  item_id: string;
  readiness_ref: string;
  expected_verdict?: string;
  expected_integrity?: string;
}

interface GpuReadinessChecklist {
  checklist_items: string[];
  checklist_item_count: number;
  prompt_evaluation_readiness: string;
  generation_qa_readiness: string;
  gpu_readiness: string;
  checklist_integrity: string;
  readiness_refs: Record<string, ChecklistRef>;
}

export interface RealProductionTestPreparationReport {
  report_id: string;
  phase: typeof REAL_PRODUCTION_TEST_PREP_PHASE;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: {
    dialogue_lipsync_pass: boolean;
    precheck_passed: boolean;
  };
  policy: {
    all_previous_outputs_read_only: boolean;
    write_policy: typeof SAFE_CREATE_POLICY;
  };
  preparation_summary: {
    memory_identity_integrity: string;
    prompt_failure_recovery_integrity: string;
    traceability_failure_recovery_integrity: string;
    prompt_evaluation_readiness: string;
    generation_qa_readiness: string;
    gpu_readiness: string;
    scorecard_integrity: string;
    failure_library_integrity: string;
    checklist_integrity: string;
    overall_generation_score: number;
    identity_dimension_count: number;
    checklist_item_count: number;
  };
  outputs: {
    spec_path: string;
    scorecard_path: string;
    failure_library_path: string;
    checklist_path: string;
  };
  issues: ValidationIssue[];
  real_production_test_ready: boolean;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function runPrecheck(root: string): {
  dialogue_lipsync_pass: boolean;
  precheck_passed: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const reportPath = path.join(root, DIALOGUE_LIPSYNC_REPORT_PATH);

  if (!fs.existsSync(reportPath)) {
    issues.push({
      code: 'DIALOGUE_LIPSYNC_REPORT_MISSING',
      message: `Missing report at ${DIALOGUE_LIPSYNC_REPORT_PATH}`,
      severity: 'error',
    });
    return { dialogue_lipsync_pass: false, precheck_passed: false, issues };
  }

  const lipsyncReport = readJson<Record<string, unknown>>(root, DIALOGUE_LIPSYNC_REPORT_PATH);
  const verdict = String(lipsyncReport.final_verdict ?? '');
  const status = String(lipsyncReport.status ?? '');

  const dialogue_lipsync_pass =
    verdict === DIALOGUE_LIPSYNC_PASS_VERDICT && status === DIALOGUE_LIPSYNC_READY_STATUS;

  if (!dialogue_lipsync_pass) {
    issues.push({
      code: 'DIALOGUE_LIPSYNC_PRECHECK_FAIL',
      message: `Expected ${DIALOGUE_LIPSYNC_PASS_VERDICT}`,
      severity: 'error',
    });
  }

  return { dialogue_lipsync_pass, precheck_passed: dialogue_lipsync_pass, issues };
}

function validateScorecard(scorecard: ProductionTestScorecard): {
  memory_identity_integrity: string;
  scorecard_integrity: string;
  overall_generation_score: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const dimension of IDENTITY_DIMENSIONS) {
    if (!scorecard.identity_dimensions.includes(dimension)) {
      issues.push({
        code: 'IDENTITY_DIMENSION_MISSING',
        message: `Missing dimension ${dimension}`,
        severity: 'error',
      });
    }
    const score = scorecard.scores[dimension];
    if (typeof score !== 'number' || score < MINIMUM_SCORE) {
      issues.push({
        code: 'IDENTITY_SCORE_BELOW_MINIMUM',
        message: `${dimension}=${score}`,
        severity: 'error',
      });
    }
  }

  const memoryScore = scorecard.scores.memory_identity;
  const memoryIdentityIntegrity =
    scorecard.memory_identity_integrity === 'PASS' &&
    typeof memoryScore === 'number' &&
    memoryScore >= MINIMUM_SCORE
      ? 'PASS'
      : 'FAIL';

  const overallScore = scorecard.scores.overall_generation_score;
  if (typeof overallScore !== 'number' || overallScore < MINIMUM_SCORE) {
    issues.push({
      code: 'OVERALL_GENERATION_SCORE_LOW',
      message: `overall_generation_score=${overallScore}`,
      severity: 'error',
    });
  }

  const scorecardIntegrity =
    scorecard.scorecard_integrity === 'PASS' &&
    scorecard.identity_dimension_count >= IDENTITY_DIMENSIONS.length &&
    issues.filter((i) => i.code.startsWith('IDENTITY')).length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    memory_identity_integrity: memoryIdentityIntegrity,
    scorecard_integrity: scorecardIntegrity,
    overall_generation_score: overallScore,
    issues,
  };
}

function validateFailureLibrary(failureLib: ProductionTestFailureLibrary): {
  prompt_failure_recovery_integrity: string;
  traceability_failure_recovery_integrity: string;
  failure_library_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const failureType of FAILURE_TYPES) {
    if (!failureLib.failure_types.includes(failureType)) {
      issues.push({
        code: 'FAILURE_TYPE_MISSING',
        message: `Missing failure type ${failureType}`,
        severity: 'error',
      });
    }
    const entry = failureLib.failures.find((f) => f.failure_type === failureType);
    if (!entry?.recovery_strategy) {
      issues.push({
        code: 'RECOVERY_STRATEGY_MISSING',
        message: `Missing recovery for ${failureType}`,
        severity: 'error',
      });
    }
  }

  const promptFailure = failureLib.failures.find((f) => f.failure_type === 'prompt_failure');
  const traceFailure = failureLib.failures.find((f) => f.failure_type === 'traceability_failure');

  const promptFailureRecoveryIntegrity =
    failureLib.prompt_failure_recovery_integrity === 'PASS' &&
    promptFailure?.recovery_strategy
      ? 'PASS'
      : 'FAIL';

  const traceabilityFailureRecoveryIntegrity =
    failureLib.traceability_failure_recovery_integrity === 'PASS' &&
    traceFailure?.recovery_strategy
      ? 'PASS'
      : 'FAIL';

  const failureLibraryIntegrity =
    failureLib.failure_library_integrity === 'PASS' &&
    failureLib.failure_type_count >= FAILURE_TYPES.length &&
    issues.length === 0
      ? 'PASS'
      : 'FAIL';

  return {
    prompt_failure_recovery_integrity: promptFailureRecoveryIntegrity,
    traceability_failure_recovery_integrity: traceabilityFailureRecoveryIntegrity,
    failure_library_integrity: failureLibraryIntegrity,
    issues,
  };
}

function validateChecklistItem(
  root: string,
  item: ChecklistRef
): { ready: boolean; issue?: ValidationIssue } {
  const refPath = path.join(root, item.readiness_ref);
  if (!fs.existsSync(refPath)) {
    return {
      ready: false,
      issue: {
        code: 'CHECKLIST_REF_MISSING',
        message: `Missing ${item.readiness_ref} for ${item.item_id}`,
        severity: 'error',
      },
    };
  }

  if (item.expected_verdict) {
    const report = readJson<Record<string, unknown>>(root, item.readiness_ref);
    if (String(report.final_verdict ?? '') !== item.expected_verdict) {
      return {
        ready: false,
        issue: {
          code: 'CHECKLIST_VERDICT_MISMATCH',
          message: `${item.item_id}: expected ${item.expected_verdict}`,
          severity: 'error',
        },
      };
    }
  }

  if (item.item_id === 'prompt_compiler') {
    const compiled = readJson<Record<string, unknown>>(root, item.readiness_ref);
    if (
      compiled.shot_to_prompt_integrity !== 'PASS' ||
      compiled.prompt_traceability_integrity !== 'PASS'
    ) {
      return {
        ready: false,
        issue: {
          code: 'PROMPT_COMPILER_NOT_READY',
          message: 'compiled prompt integrity not PASS',
          severity: 'error',
        },
      };
    }
  }

  if (item.expected_integrity) {
    const artifact = readJson<Record<string, unknown>>(root, item.readiness_ref);
    const integrityFields = [
      'generation_trace_integrity',
      'asset_registry_integrity',
      'evolution_integrity',
      'dataset_evolution_integrity',
    ];
    const matched = integrityFields.some((field) => artifact[field] === item.expected_integrity);
    if (!matched && item.item_id !== 'prompt_compiler') {
      const hasPassField = Object.values(artifact).includes('PASS');
      if (!hasPassField && item.item_id !== 'generation_trace' && item.item_id !== 'asset_registry' && item.item_id !== 'dataset_evolution') {
        // report-based items use expected_verdict; artifact items may use different field names
      }
      if (['generation_trace', 'asset_registry', 'dataset_evolution'].includes(item.item_id)) {
        const fieldMap: Record<string, string> = {
          generation_trace: 'generation_trace_integrity',
          asset_registry: 'asset_registry_integrity',
          dataset_evolution: 'dataset_evolution_integrity',
        };
        const field = fieldMap[item.item_id];
        if (field && artifact[field] !== item.expected_integrity) {
          return {
            ready: false,
            issue: {
              code: 'CHECKLIST_INTEGRITY_MISMATCH',
              message: `${item.item_id}: ${field} not PASS`,
              severity: 'error',
            },
          };
        }
      }
    }
  }

  return { ready: true };
}

function validateGpuChecklist(
  root: string,
  checklist: GpuReadinessChecklist
): {
  prompt_evaluation_readiness: string;
  generation_qa_readiness: string;
  gpu_readiness: string;
  checklist_integrity: string;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  for (const item of CHECKLIST_ITEMS) {
    if (!checklist.checklist_items.includes(item)) {
      issues.push({
        code: 'CHECKLIST_ITEM_MISSING',
        message: `Missing checklist item ${item}`,
        severity: 'error',
      });
    }
  }

  let allReady = true;
  for (const itemId of CHECKLIST_ITEMS) {
    const ref = checklist.readiness_refs[itemId];
    if (!ref) {
      issues.push({
        code: 'CHECKLIST_REF_CONFIG_MISSING',
        message: `Missing readiness ref for ${itemId}`,
        severity: 'error',
      });
      allReady = false;
      continue;
    }
    const result = validateChecklistItem(root, ref);
    if (!result.ready && result.issue) {
      issues.push(result.issue);
      allReady = false;
    }
  }

  const promptEvalReport = fs.existsSync(path.join(root, PROMPT_EVALUATION_REPORT_PATH))
    ? readJson<Record<string, unknown>>(root, PROMPT_EVALUATION_REPORT_PATH)
    : null;
  const generationQaReport = fs.existsSync(path.join(root, GENERATION_QA_REPORT_PATH))
    ? readJson<Record<string, unknown>>(root, GENERATION_QA_REPORT_PATH)
    : null;

  const promptEvaluationReadiness =
    checklist.prompt_evaluation_readiness === 'PASS' &&
    promptEvalReport?.final_verdict === PROMPT_EVALUATION_PASS_VERDICT &&
    promptEvalReport?.status === PROMPT_EVALUATION_READY_STATUS
      ? 'PASS'
      : 'FAIL';

  const generationQaReadiness =
    checklist.generation_qa_readiness === 'PASS' &&
    generationQaReport?.final_verdict === GENERATION_QA_PASS_VERDICT &&
    generationQaReport?.status === GENERATION_QA_READY_STATUS
      ? 'PASS'
      : 'FAIL';

  const gpuReadiness =
    checklist.gpu_readiness === 'PASS' && allReady && issues.length === 0 ? 'PASS' : 'FAIL';

  const checklistIntegrity =
    checklist.checklist_integrity === 'PASS' &&
    checklist.checklist_item_count >= CHECKLIST_ITEMS.length
      ? 'PASS'
      : 'FAIL';

  return {
    prompt_evaluation_readiness: promptEvaluationReadiness,
    generation_qa_readiness: generationQaReadiness,
    gpu_readiness: gpuReadiness,
    checklist_integrity: checklistIntegrity,
    issues,
  };
}

export function writeRealProductionTestPreparation(
  projectRoot?: string
): RealProductionTestPreparationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  const testSpec = readJson<Record<string, unknown>>(root, PRODUCTION_TEST_SPEC_DATASET_PATH);
  const scorecard = readJson<ProductionTestScorecard>(
    root,
    PRODUCTION_TEST_SCORECARD_DATASET_PATH
  );
  const failureLib = readJson<ProductionTestFailureLibrary>(
    root,
    PRODUCTION_TEST_FAILURE_LIBRARY_DATASET_PATH
  );
  const checklist = readJson<GpuReadinessChecklist>(
    root,
    GPU_READINESS_CHECKLIST_DATASET_PATH
  );

  const scorecardValidation = validateScorecard(scorecard);
  issues.push(...scorecardValidation.issues);

  const failureValidation = validateFailureLibrary(failureLib);
  issues.push(...failureValidation.issues);

  const checklistValidation = validateGpuChecklist(root, checklist);
  issues.push(...checklistValidation.issues);

  const errors = issues.filter((issue) => issue.severity === 'error');
  const preparationReady =
    precheck.precheck_passed &&
    errors.length === 0 &&
    scorecardValidation.memory_identity_integrity === 'PASS' &&
    failureValidation.prompt_failure_recovery_integrity === 'PASS' &&
    failureValidation.traceability_failure_recovery_integrity === 'PASS' &&
    checklistValidation.prompt_evaluation_readiness === 'PASS' &&
    checklistValidation.generation_qa_readiness === 'PASS' &&
    checklistValidation.gpu_readiness === 'PASS';

  const specExport = {
    ...testSpec,
    export_id: 'production-test-specification-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_TEST_SPEC_DATASET_PATH,
    real_production_test_ready: preparationReady,
  };

  const scorecardExport = {
    ...scorecard,
    export_id: 'production-test-scorecard-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_TEST_SCORECARD_DATASET_PATH,
    identity_dimension_list: [...IDENTITY_DIMENSIONS],
    memory_identity_integrity: scorecardValidation.memory_identity_integrity,
    scorecard_integrity: scorecardValidation.scorecard_integrity,
  };

  const failureExport = {
    ...failureLib,
    export_id: 'production-test-failure-library-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: PRODUCTION_TEST_FAILURE_LIBRARY_DATASET_PATH,
    failure_type_list: [...FAILURE_TYPES],
    prompt_failure_recovery_integrity: failureValidation.prompt_failure_recovery_integrity,
    traceability_failure_recovery_integrity:
      failureValidation.traceability_failure_recovery_integrity,
    failure_library_integrity: failureValidation.failure_library_integrity,
  };

  const checklistExport = {
    ...checklist,
    export_id: 'gpu-readiness-checklist-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: GPU_READINESS_CHECKLIST_DATASET_PATH,
    checklist_item_list: [...CHECKLIST_ITEMS],
    prompt_evaluation_readiness: checklistValidation.prompt_evaluation_readiness,
    generation_qa_readiness: checklistValidation.generation_qa_readiness,
    gpu_readiness: checklistValidation.gpu_readiness,
    checklist_integrity: checklistValidation.checklist_integrity,
  };

  fs.mkdirSync(path.join(root, PRODUCTION_TEST_EXPORT_DIR), { recursive: true });
  fs.mkdirSync(path.join(root, REAL_PRODUCTION_TEST_PREP_REPORT_DIR), { recursive: true });

  fs.writeFileSync(
    path.join(root, PRODUCTION_TEST_SPEC_EXPORT_PATH),
    `${JSON.stringify(specExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_TEST_SCORECARD_EXPORT_PATH),
    `${JSON.stringify(scorecardExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, PRODUCTION_TEST_FAILURE_LIBRARY_EXPORT_PATH),
    `${JSON.stringify(failureExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GPU_READINESS_CHECKLIST_EXPORT_PATH),
    `${JSON.stringify(checklistExport, null, 2)}\n`,
    'utf8'
  );

  const report: RealProductionTestPreparationReport = {
    report_id: 'real-production-test-preparation-report-v1',
    phase: REAL_PRODUCTION_TEST_PREP_PHASE,
    generated_at: new Date().toISOString(),
    final_verdict: preparationReady
      ? REAL_PRODUCTION_TEST_PREP_PASS_VERDICT
      : REAL_PRODUCTION_TEST_PREP_FAIL_VERDICT,
    status: preparationReady ? REAL_PRODUCTION_TEST_READY_STATUS : 'REAL_PRODUCTION_TEST_INCOMPLETE',
    precheck,
    policy: {
      all_previous_outputs_read_only: true,
      write_policy: SAFE_CREATE_POLICY,
    },
    preparation_summary: {
      memory_identity_integrity: scorecardValidation.memory_identity_integrity,
      prompt_failure_recovery_integrity: failureValidation.prompt_failure_recovery_integrity,
      traceability_failure_recovery_integrity:
        failureValidation.traceability_failure_recovery_integrity,
      prompt_evaluation_readiness: checklistValidation.prompt_evaluation_readiness,
      generation_qa_readiness: checklistValidation.generation_qa_readiness,
      gpu_readiness: checklistValidation.gpu_readiness,
      scorecard_integrity: scorecardValidation.scorecard_integrity,
      failure_library_integrity: failureValidation.failure_library_integrity,
      checklist_integrity: checklistValidation.checklist_integrity,
      overall_generation_score: scorecardValidation.overall_generation_score,
      identity_dimension_count: IDENTITY_DIMENSIONS.length,
      checklist_item_count: CHECKLIST_ITEMS.length,
    },
    outputs: {
      spec_path: PRODUCTION_TEST_SPEC_EXPORT_PATH,
      scorecard_path: PRODUCTION_TEST_SCORECARD_EXPORT_PATH,
      failure_library_path: PRODUCTION_TEST_FAILURE_LIBRARY_EXPORT_PATH,
      checklist_path: GPU_READINESS_CHECKLIST_EXPORT_PATH,
    },
    issues,
    real_production_test_ready: preparationReady,
  };

  fs.writeFileSync(
    path.join(root, REAL_PRODUCTION_TEST_PREP_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  return report;
}

export { PROMPT_EVALUATION_READ_ONLY_PATHS as DIALOGUE_STACK_READ_ONLY_PATHS };
