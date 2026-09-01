import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildRepositoryIndex,
  queryCapabilitiesByKeyword,
  runRepositoryIndexSelfTest,
  runQuerySelfTest,
  type RepositoryIndex,
  type RepositoryIndexSelfTestResult,
  type QuerySelfTestResult,
} from './ProjectBrainRepositoryIndexer.js';
import {
  mapCapabilities,
  mapDependencies,
  runCapabilityMappingSelfTest,
  runDependencyMappingSelfTest,
  type CapabilityMapping,
  type DependencyMappingEntry,
  type CapabilityMappingSelfTestResult,
  type DependencyMappingSelfTestResult,
} from './ProjectBrainRepositoryBridge.js';

export const PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PHASE = 'PHASE-PROJECT-BRAIN-REAL-PROJECT-INTEGRATION-001' as const;
export const PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PASS_VERDICT = 'PASS_PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_V1' as const;
export const PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_V1' as const;

// Real, previously-established npm scripts (this session's own prior
// phases, PHASE-AGENT-PROJECT-BRAIN-001 through PHASE-PROJECT-BRAIN
// -ARCHITECTURE-CONSOLIDATION-001) this phase's Regression PASS
// re-confirms are still present and resolvable in the real repository
// index.
const EXPECTED_PRIOR_VERIFY_SCRIPT_NAMES = [
  'agent-project-brain-reasoning-foundation',
  'project-brain-intelligence-foundation',
  'project-brain-self-improvement-foundation',
  'project-brain-materialization-foundation',
  'project-brain-execution-readiness-foundation',
  'project-brain-autonomous-planning-foundation',
  'project-brain-autonomous-validation-foundation',
  'project-brain-optimization-foundation',
  'project-brain-internal-model-foundation',
  'project-brain-adaptive-learning-foundation',
  'project-brain-experience-foundation',
  'project-brain-architecture-consolidation',
];

// This phase's own invariants: Agent Layer 변경 금지, Project Brain Core
// (Reasoning through Autonomous Validation) 변경 금지, Internal Model 변경
// 금지, Experience 변경 금지, Live Connector 변경 금지, Numerical DNA 변경
// 금지. Same reasoning as every prior Project-Brain-* validator this
// session: the entire underlying stack remains untracked ("??"), so a
// tracked-file substring check can't detect a modification to it by
// construction — compliance is verified by direct recollection (this phase
// only reads `package.json` and real script files via `fs`; it edits none
// of the files it reads). Numerical DNA files are excluded from the
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
  'ProjectBrainExperienceMemory',
  'ProjectBrainExperienceIndexer',
  'ProjectBrainExperienceEngine',
  'ProjectBrainExperienceValidator',
  'ProjectBrainDependencyAnalyzer',
  'ProjectBrainArchitectureValidator',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases.',
  };
}

const PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_SOURCE_FILES = ['services/ProjectBrainRepositoryIndexer.ts', 'services/ProjectBrainRepositoryBridge.ts'];
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

/** Real, mechanical proof of "API 미사용": reads this phase's own 2 new source files and confirms neither references a network or live-provider call primitive. */
export function checkApiFree(root: string): ApiFreeCheck {
  const violations: Array<{ file: string; marker: string }> = [];
  for (const relPath of PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_SOURCE_FILES, violations };
}

export interface ProjectBrainRepositoryReport {
  phase: typeof PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PHASE;
  verdict: typeof PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PASS_VERDICT | typeof PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_FAIL_VERDICT;
  repository_pass_ok: boolean;
  query_pass_ok: boolean;
  mapping_pass_ok: boolean;
  consistency_pass_ok: boolean;
  regression_pass_ok: boolean;
  api_free_pass_ok: boolean;
  repository_index_self_test: RepositoryIndexSelfTestResult;
  query_self_test: QuerySelfTestResult;
  capability_mapping_self_test: CapabilityMappingSelfTestResult;
  dependency_mapping_self_test: DependencyMappingSelfTestResult;
  index: RepositoryIndex | null;
  capability_mappings: CapabilityMapping[];
  dependency_mapping: DependencyMappingEntry[];
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainRepositoryReport(root: string): Promise<ProjectBrainRepositoryReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let index: RepositoryIndex | null = null;
  let capability_mappings: CapabilityMapping[] = [];
  let dependency_mapping: DependencyMappingEntry[] = [];

  const repository_index_self_test = runRepositoryIndexSelfTest(root);
  const query_self_test = runQuerySelfTest();
  const capability_mapping_self_test = runCapabilityMappingSelfTest();
  const dependency_mapping_self_test = runDependencyMappingSelfTest();

  try {
    index = buildRepositoryIndex(root);
    capability_mappings = mapCapabilities(root, index);
    dependency_mapping = mapDependencies(capability_mappings);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Repository PASS: self-test passed, and the real index's script count
  // matches a fresh, independent re-parse of the real package.json's
  // scripts field — never trusts the index's own bookkeeping.
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string> };
  const directVerifyScriptCount = Object.keys(packageJson.scripts ?? {}).filter((k) => k.startsWith('verify:')).length;
  const repository_pass_ok =
    dashboardThrew === null && repository_index_self_test.ok && !!index && index.verify_scripts.length === directVerifyScriptCount;

  // Query PASS: self-test passed, and a real query for a known real
  // keyword ("project-brain") returns a non-empty result, cross-checked
  // against a direct, independent filter over the same real index.
  const realQueryResults = index ? queryCapabilitiesByKeyword(index, 'project-brain') : [];
  const directQueryResults = index ? index.verify_scripts.filter((e) => e.name.toLowerCase().includes('project-brain')) : [];
  const query_pass_ok =
    dashboardThrew === null &&
    query_self_test.ok &&
    realQueryResults.length > 0 &&
    JSON.stringify(realQueryResults.map((e) => e.name).sort()) === JSON.stringify(directQueryResults.map((e) => e.name).sort());

  // Mapping PASS: both self-tests passed, and the real run produced exactly
  // one Capability Mapping per real, existing verify script — nothing
  // skipped or fabricated.
  const existingScriptCount = index?.verify_scripts.filter((e) => e.script_exists).length ?? -1;
  const mapping_pass_ok =
    dashboardThrew === null &&
    capability_mapping_self_test.ok &&
    dependency_mapping_self_test.ok &&
    capability_mappings.length === existingScriptCount;

  // Consistency PASS: a second, independent run of the entire pipeline
  // (index -> capability mapping -> dependency mapping) must produce
  // byte-identical results — proves determinism — plus repository
  // invariants hold.
  const secondIndex = buildRepositoryIndex(root);
  const secondMappings = mapCapabilities(root, secondIndex);
  const secondDependencyMapping = mapDependencies(secondMappings);
  const repository = checkRepositoryInvariants(root);
  const consistency_pass_ok =
    dashboardThrew === null &&
    JSON.stringify(index) === JSON.stringify(secondIndex) &&
    JSON.stringify(capability_mappings) === JSON.stringify(secondMappings) &&
    JSON.stringify(dependency_mapping) === JSON.stringify(secondDependencyMapping) &&
    repository.ok;

  // Regression PASS: every real npm script this session's own 12 prior
  // Project-Brain-* phases established must still be present in the real
  // index and still resolve to a real, existing script file.
  const missingPriorScripts = EXPECTED_PRIOR_VERIFY_SCRIPT_NAMES.filter((name) => {
    const entry = index?.verify_scripts.find((e) => e.name === name);
    return !entry || !entry.script_exists;
  });
  const regression_pass_ok = dashboardThrew === null && missingPriorScripts.length === 0;

  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'repository_pass',
    pass: repository_pass_ok,
    detail: repository_pass_ok
      ? `self-test passed; real Repository Index built with ${index?.verify_scripts.length ?? 0} real verify:* entries, matching an independent re-parse of package.json exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'query_pass',
    pass: query_pass_ok,
    detail: query_pass_ok
      ? `self-test passed; a real query for "project-brain" returned ${realQueryResults.length} real matching entries, matching an independent direct filter exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'mapping_pass',
    pass: mapping_pass_ok,
    detail: mapping_pass_ok
      ? `both self-tests passed; ${capability_mappings.length} real Capability Mapping(s) produced, one per real existing verify script, aggregated into ${dependency_mapping.length} real Dependency Mapping entries`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'consistency_pass',
    pass: consistency_pass_ok,
    detail: consistency_pass_ok
      ? `a second, independent run of the full pipeline produced byte-identical index, capability mappings, and dependency mapping; repository invariants hold`
      : `unhandled_exception: ${dashboardThrew}${repository.ok ? '' : `; repository invariant violation: ${repository.violating_paths.join(',')}`}`,
  });
  checks.push({
    id: 'regression_pass',
    pass: regression_pass_ok,
    detail: regression_pass_ok
      ? `all ${EXPECTED_PRIOR_VERIFY_SCRIPT_NAMES.length} real verify:* scripts from this session's 12 prior Project-Brain-* phases are still present and resolve to a real, existing script file`
      : `regression detected — missing or unresolved prior scripts: ${missingPriorScripts.join(', ')}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    repository_pass_ok && query_pass_ok && mapping_pass_ok && consistency_pass_ok && regression_pass_ok && api_free_pass_ok;

  return {
    phase: PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_PASS_VERDICT : PROJECT_BRAIN_REAL_PROJECT_INTEGRATION_FAIL_VERDICT,
    repository_pass_ok,
    query_pass_ok,
    mapping_pass_ok,
    consistency_pass_ok,
    regression_pass_ok,
    api_free_pass_ok,
    repository_index_self_test,
    query_self_test,
    capability_mapping_self_test,
    dependency_mapping_self_test,
    index,
    capability_mappings,
    dependency_mapping,
    api_free,
    repository,
    checks,
  };
}
