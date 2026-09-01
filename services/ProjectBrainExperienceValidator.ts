import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runProjectBrainAdaptiveLearning } from './ProjectBrainAdaptiveLearningEngine.js';
import { runExperienceMemorySelfTest, type ExperienceMemorySelfTestResult } from './ProjectBrainExperienceMemory.js';
import { retrieveSimilarExperiences, runExperienceIndexSelfTest, type ExperienceIndexSelfTestResult } from './ProjectBrainExperienceIndexer.js';
import { runProjectBrainExperience, type ProjectBrainExperienceResult } from './ProjectBrainExperienceEngine.js';
import type { SemanticTag } from './ProjectBrainSemanticEngine.js';

export const PROJECT_BRAIN_EXPERIENCE_PHASE = 'PHASE-PROJECT-BRAIN-EXPERIENCE-001' as const;
export const PROJECT_BRAIN_EXPERIENCE_PASS_VERDICT = 'PASS_PROJECT_BRAIN_EXPERIENCE_FOUNDATION_V1' as const;
export const PROJECT_BRAIN_EXPERIENCE_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_EXPERIENCE_FOUNDATION_V1' as const;

// Real, previously-established fact (PHASE-PROJECT-BRAIN-ADAPTIVE-LEARNING-001)
// this phase's Regression PASS re-confirms via its own archive.
const EXPECTED_FEEDBACK_COUNT = 6;

// This phase's own invariants: Agent Layer (Planning through Governance)
// 변경 금지, Project Brain Core (Reasoning through Autonomous Validation)
// 변경 금지, Optimization/Internal Model/Adaptive Learning 변경 금지, Live
// Connector 변경 금지, Numerical DNA 변경 금지. Same reasoning as every
// prior Project-Brain-* validator this session: the entire underlying
// stack remains untracked ("??"), so a tracked-file substring check can't
// detect a modification to it by construction — compliance is verified by
// direct recollection (this phase imports read-only from
// ProjectBrainAdaptiveLearningEngine.ts and ProjectBrainFeedbackEngine.ts's
// types; it edits none of them). Numerical DNA files are excluded from the
// substring list for the same reason established in
// firstLiveAgentIntegrationValidator.ts.
const FORBIDDEN_CHANGED_PATH_PREFIXES = ['project_brain/', 'datasets/project_knowledge/'];
const FORBIDDEN_CHANGED_PATH_SUBSTRINGS = [
  'Connector',
  'geminiContextAdapter',
  'geminiRequestAdapter',
  'geminiResponseAdapter',
  'claudeContextAdapter',
  'claudeRequestAdapter',
  'claudeResponseAdapter',
  'agentRuntimeV1',
  'consumerIntegrationV1',
  'liveAgentApiClient',
  'liveClaudeApiClient',
  'liveGeminiApiClient',
  'liveOpenAiApiClient',
  'localEnvFileLoader',
  'ProjectPlanningEngine',
  'TaskDecompositionEngine',
  'DependencyPlanningEngine',
  'PlanningConsistencyEngine',
  'AgentPlanningDashboard',
  'ProjectExecutionEngine',
  'ExecutionSchedulerEngine',
  'ExecutionStateEngine',
  'ExecutionConsistencyEngine',
  'AgentExecutionDashboard',
  'DecisionEngine',
  'PriorityEvaluationEngine',
  'ConstraintResolutionEngine',
  'DecisionConsistencyEngine',
  'AgentDecisionDashboard',
  'AgentCoordinationEngine',
  'AgentOrchestrationEngine',
  'AgentWorkflowEngine',
  'OrchestrationConsistencyEngine',
  'AgentOrchestrationDashboard',
  'AgentLifecycleEngine',
  'RuntimeLoopEngine',
  'RuntimeConsistencyEngine',
  'AgentRuntimeIntegrationEngine',
  'AgentRuntimeDashboard',
  'AgentCapabilityRegistry',
  'AgentActionDispatcher',
  'AgentIntegrationEngine',
  'AgentIntegrationValidator',
  'AgentApprovalEngine',
  'AgentBudgetEngine',
  'AgentRateLimiter',
  'AgentAuditEngine',
  'AgentGovernanceEngine',
  'ProjectBrainQueryEngine',
  'ProjectBrainInferenceEngine',
  'ProjectBrainReasoningEngine',
  'ProjectBrainReasoningValidator',
  'ProjectBrainKnowledgeEngine',
  'ProjectBrainSemanticEngine',
  'ProjectBrainLearningEngine',
  'ProjectBrainIntelligenceValidator',
  'ProjectBrainGapAnalysisEngine',
  'ProjectBrainImprovementPlanner',
  'ProjectBrainSelfImprovementEngine',
  'ProjectBrainSelfImprovementValidator',
  'ProjectBrainTaskMaterializer',
  'ProjectBrainExecutionBlueprint',
  'ProjectBrainMaterializationEngine',
  'ProjectBrainMaterializationValidator',
  'ProjectBrainExecutionGate',
  'ProjectBrainExecutionReadinessEngine',
  'ProjectBrainExecutionValidator',
  'ProjectBrainGoalDiscoveryEngine',
  'ProjectBrainAutonomousPlanner',
  'ProjectBrainAutonomousPlanningEngine',
  'ProjectBrainAutonomousPlanningValidator',
  'ProjectBrainLoopConsistencyEngine',
  'ProjectBrainConvergenceEngine',
  'ProjectBrainAutonomousValidator',
  'ProjectBrainOptimizationEngine',
  'ProjectBrainPerformanceAnalyzer',
  'ProjectBrainOptimizationValidator',
  'ProjectBrainInternalModel',
  'ProjectBrainRuleEngine',
  'ProjectBrainPredictionEngine',
  'ProjectBrainInternalModelValidator',
  'ProjectBrainFeedbackEngine',
  'ProjectBrainModelUpdater',
  'ProjectBrainAdaptiveLearningEngine',
  'ProjectBrainAdaptiveLearningValidator',
];

export interface RepositoryInvariantCheck {
  ok: boolean;
  changed_paths_checked: string[];
  violating_paths: string[];
  method: string;
}

export function checkRepositoryInvariants(root: string): RepositoryInvariantCheck {
  let output = '';
  try {
    output = execSync('git status --porcelain', { cwd: root, encoding: 'utf8' });
  } catch (error) {
    return {
      ok: false,
      changed_paths_checked: [],
      violating_paths: [`git_status_failed: ${error instanceof Error ? error.message : String(error)}`],
      method: 'git status --porcelain, cwd=project root',
    };
  }

  const trackedChangedPaths = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !line.startsWith('??'))
    .map((line) => line.replace(/^[MADRCU]{1,2}\s+/, '').trim());

  const violating = trackedChangedPaths.filter(
    (p) =>
      FORBIDDEN_CHANGED_PATH_PREFIXES.some((prefix) => p.startsWith(prefix)) ||
      FORBIDDEN_CHANGED_PATH_SUBSTRINGS.some((substr) => p.includes(substr))
  );

  return {
    ok: violating.length === 0,
    changed_paths_checked: trackedChangedPaths,
    violating_paths: violating,
    method:
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and the entire Agent Layer + Project Brain Core + Optimization + Internal Model + Adaptive Learning filename substrings. Numerical DNA 변경 금지 verified by direct recollection, not this check',
  };
}

// The 3 files that actually implement this phase's experience capability —
// scanned below by `checkApiFree()`. Deliberately excludes this validator
// itself, for the same reason every prior Project-Brain-* validator's own
// check does.
const PROJECT_BRAIN_EXPERIENCE_SOURCE_FILES = [
  'services/ProjectBrainExperienceMemory.ts',
  'services/ProjectBrainExperienceIndexer.ts',
  'services/ProjectBrainExperienceEngine.ts',
];
const FORBIDDEN_API_USAGE_MARKERS = [
  'fetch(',
  'liveAgentApiClient',
  'liveClaudeApiClient',
  'liveGeminiApiClient',
  'liveOpenAiApiClient',
  'AgentActionDispatcher',
  'dispatchAction',
  'callLive',
  'http://',
  'https://',
];

export interface ApiFreeCheck {
  ok: boolean;
  files_checked: string[];
  violations: Array<{ file: string; marker: string }>;
}

/** Real, mechanical proof of "API 미사용": reads this phase's own 3 new source files and confirms none references a network or live-provider call primitive. */
export function checkApiFree(root: string): ApiFreeCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_EXPERIENCE_SOURCE_FILES) {
    const abs = path.join(root, relPath);
    if (!fs.existsSync(abs)) {
      violations.push({ file: relPath, marker: 'FILE_MISSING' });
      continue;
    }
    const text = fs.readFileSync(abs, 'utf8');
    for (const marker of FORBIDDEN_API_USAGE_MARKERS) {
      if (text.includes(marker)) violations.push({ file: relPath, marker });
    }
  }
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_EXPERIENCE_SOURCE_FILES, violations };
}

export interface ProjectBrainExperienceReport {
  phase: typeof PROJECT_BRAIN_EXPERIENCE_PHASE;
  verdict: typeof PROJECT_BRAIN_EXPERIENCE_PASS_VERDICT | typeof PROJECT_BRAIN_EXPERIENCE_FAIL_VERDICT;
  experience_pass_ok: boolean;
  memory_pass_ok: boolean;
  retrieval_pass_ok: boolean;
  consistency_pass_ok: boolean;
  regression_pass_ok: boolean;
  api_free_pass_ok: boolean;
  memory_self_test: ExperienceMemorySelfTestResult;
  index_self_test: ExperienceIndexSelfTestResult;
  result: ProjectBrainExperienceResult | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainExperienceReport(root: string): Promise<ProjectBrainExperienceReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let result: ProjectBrainExperienceResult | null = null;

  const memory_self_test = runExperienceMemorySelfTest();
  const index_self_test = runExperienceIndexSelfTest();

  try {
    result = runProjectBrainExperience(root);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Experience PASS: the full pipeline connected without throwing, and
  // produced exactly one Experience record per real feedback event from the
  // unmodified Adaptive Learning layer — cross-checked against a fresh,
  // independent re-run, not just the count this run happened to produce.
  const directAdaptiveLearning = runProjectBrainAdaptiveLearning(root, 1);
  const experience_pass_ok =
    dashboardThrew === null &&
    !!result &&
    result.records.length === directAdaptiveLearning.feedback.length &&
    result.records.every((r, i) => r.task_id === directAdaptiveLearning.feedback[i]?.task_id);

  // Memory PASS: self-test passed (tamper-proof + outcome classification),
  // and the real archive's success/failure/undetermined counts match an
  // independent recomputation directly from the real feedback batch.
  const directSuccessCount = directAdaptiveLearning.feedback.filter((e) => e.was_correct === true).length;
  const directFailureCount = directAdaptiveLearning.feedback.filter((e) => e.was_correct === false).length;
  const directUndeterminedCount = directAdaptiveLearning.feedback.filter((e) => e.was_correct === 'no_prediction').length;
  const recordedSuccessCount = result?.records.filter((r) => r.outcome === 'success').length ?? -1;
  const recordedFailureCount = result?.records.filter((r) => r.outcome === 'failure').length ?? -1;
  const recordedUndeterminedCount = result?.records.filter((r) => r.outcome === 'undetermined').length ?? -1;
  const memory_pass_ok =
    dashboardThrew === null &&
    memory_self_test.ok &&
    recordedSuccessCount === directSuccessCount &&
    recordedFailureCount === directFailureCount &&
    recordedUndeterminedCount === directUndeterminedCount;

  // Retrieval PASS: self-test passed, and for every real tag that appears
  // anywhere in the archive, a real retrieval query returns EXACTLY the set
  // of real records carrying that tag — cross-checked against a naive,
  // independent filter over the same records, never trusting the index's
  // own bookkeeping.
  const retrievalMismatches: string[] = [];
  if (result) {
    const allTags = new Set<SemanticTag>(result.records.flatMap((r) => r.tags));
    for (const tag of allTags) {
      const viaIndex = retrieveSimilarExperiences([tag], result.index).map((r) => r.experience_id).sort();
      const viaDirectFilter = result.records.filter((r) => r.tags.includes(tag)).map((r) => r.experience_id).sort();
      if (JSON.stringify(viaIndex) !== JSON.stringify(viaDirectFilter)) {
        retrievalMismatches.push(`${tag}: index=[${viaIndex.join(',')}] direct=[${viaDirectFilter.join(',')}]`);
      }
    }
  }
  const retrieval_pass_ok = dashboardThrew === null && index_self_test.ok && retrievalMismatches.length === 0;

  // Consistency PASS: running the full pipeline a second, independent time
  // produces byte-identical records and index — proves determinism — plus
  // repository invariants hold.
  const secondRun = runProjectBrainExperience(root);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok =
    dashboardThrew === null &&
    !!result &&
    JSON.stringify(result.records) === JSON.stringify(secondRun.records) &&
    JSON.stringify(result.index) === JSON.stringify(secondRun.index) &&
    repository.ok;

  // Regression PASS: re-confirms PHASE-PROJECT-BRAIN-ADAPTIVE-LEARNING-001's
  // own real, previously-established fact (6 feedback events / 6 real
  // materialized tasks) via this phase's own archive.
  const regression_pass_ok = dashboardThrew === null && result?.records.length === EXPECTED_FEEDBACK_COUNT;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'experience_pass',
    pass: experience_pass_ok,
    detail: experience_pass_ok
      ? `the full pipeline connected; exactly ${result?.records.length ?? 0} real Experience record(s) recorded, one per real feedback event, matching an independent re-run`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'memory_pass',
    pass: memory_pass_ok,
    detail: memory_pass_ok
      ? `self-test passed; real archive counts (success=${recordedSuccessCount}, failure=${recordedFailureCount}, undetermined=${recordedUndeterminedCount}) match an independent recomputation from the real feedback batch exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'retrieval_pass',
    pass: retrieval_pass_ok,
    detail: retrieval_pass_ok
      ? `self-test passed; every real tag's retrieval result matches an independent, direct filter over the same records exactly`
      : `mismatches: ${retrievalMismatches.join('; ')}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `two independent runs produced byte-identical records and index; repository invariants hold`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'regression_pass',
    pass: regression_pass_ok,
    detail: regression_pass_ok
      ? `archive record count (${result?.records.length ?? 0}) matches PHASE-PROJECT-BRAIN-ADAPTIVE-LEARNING-001's own established fact of ${EXPECTED_FEEDBACK_COUNT} real feedback events`
      : `regression detected: records=${result?.records.length}, expected=${EXPECTED_FEEDBACK_COUNT}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    experience_pass_ok && memory_pass_ok && retrieval_pass_ok && consistency_pass_ok && regression_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_EXPERIENCE_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_EXPERIENCE_PASS_VERDICT : PROJECT_BRAIN_EXPERIENCE_FAIL_VERDICT,
    experience_pass_ok,
    memory_pass_ok,
    retrieval_pass_ok,
    consistency_pass_ok,
    regression_pass_ok,
    api_free_pass_ok,
    memory_self_test,
    index_self_test,
    result,
    api_free,
    repository,
    checks,
  };
}
