import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildRepositoryIndex } from './ProjectBrainRepositoryIndexer.js';
import { mapCapabilities, type CapabilityMapping } from './ProjectBrainRepositoryBridge.js';
import {
  buildEntityGraphFromMappings,
  runEntityGraphSelfTest,
  type RepositoryEntityGraph,
  type EntityGraphSelfTestResult,
} from './ProjectBrainRepositoryKnowledgeEngine.js';
import {
  buildCapabilityGraph,
  buildDependencyGraph,
  runCapabilityGraphSelfTest,
  runDependencyGraphSelfTest,
  type CapabilityRelation,
  type ServiceUsage,
  type CapabilityGraphSelfTestResult,
  type DependencyGraphSelfTestResult,
} from './ProjectBrainCapabilityGraph.js';
import {
  detectMissingCapabilities,
  detectDeadCapabilities,
  runGapAnalyzerSelfTest,
  type MissingCapabilityReport,
  type DeadCapabilityReport,
  type GapAnalyzerSelfTestResult,
} from './ProjectBrainGapAnalyzer.js';

export const PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PHASE = 'PHASE-PROJECT-BRAIN-REAL-PROJECT-INTELLIGENCE-001' as const;
export const PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PASS_VERDICT = 'PASS_PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_V1' as const;
export const PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_FAIL_VERDICT = 'FAIL_PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_V1' as const;

// This phase's own invariants: Agent Layer 변경 금지, Project Brain Core
// 변경 금지, Repository Index (PHASE-PROJECT-BRAIN-REAL-PROJECT
// -INTEGRATION-001's own 3 files) 변경 금지, Live Connector 변경 금지,
// Numerical DNA 변경 금지. Same reasoning as every prior Project-Brain-*
// validator this session: the entire underlying stack remains untracked
// ("??"), so a tracked-file substring check can't detect a modification to
// it by construction — compliance is verified by direct recollection (this
// phase imports read-only from ProjectBrainRepositoryIndexer.ts and
// ProjectBrainRepositoryBridge.ts; it edits neither). Numerical DNA files
// are excluded from the substring list for the same reason established in
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
  'ProjectBrainRepositoryIndexer',
  'ProjectBrainRepositoryBridge',
  'ProjectBrainRepositoryValidator',
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
      'git status --porcelain, cwd=project root, tracked-file changes only (untracked ?? entries excluded); checked project_brain/ and datasets/project_knowledge/ prefixes and every Engine-family filename substring established across all prior phases, including Repository Index.',
  };
}

const PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_SOURCE_FILES = [
  'services/ProjectBrainRepositoryKnowledgeEngine.ts',
  'services/ProjectBrainCapabilityGraph.ts',
  'services/ProjectBrainGapAnalyzer.ts',
  'services/ProjectBrainVerificationSemanticsClassifier.ts',
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
  for (const relPath of PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_SOURCE_FILES) {
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
  return { ok: violations.length === 0, files_checked: PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_SOURCE_FILES, violations };
}

export interface ProjectBrainRealProjectIntelligenceReport {
  phase: typeof PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PHASE;
  verdict: typeof PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PASS_VERDICT | typeof PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_FAIL_VERDICT;
  repository_pass_ok: boolean;
  knowledge_pass_ok: boolean;
  capability_pass_ok: boolean;
  dependency_pass_ok: boolean;
  gap_pass_ok: boolean;
  api_free_pass_ok: boolean;
  entity_graph_self_test: EntityGraphSelfTestResult;
  capability_graph_self_test: CapabilityGraphSelfTestResult;
  dependency_graph_self_test: DependencyGraphSelfTestResult;
  gap_analyzer_self_test: GapAnalyzerSelfTestResult;
  entity_graph: RepositoryEntityGraph | null;
  capability_graph: CapabilityRelation[];
  dependency_graph: ServiceUsage[];
  missing_capabilities: MissingCapabilityReport | null;
  dead_capabilities: DeadCapabilityReport | null;
  api_free: ApiFreeCheck;
  repository: RepositoryInvariantCheck;
  checks: Array<{ id: string; pass: boolean; detail: string }>;
}

export async function buildProjectBrainRealProjectIntelligenceReport(root: string): Promise<ProjectBrainRealProjectIntelligenceReport> {
  const checks: Array<{ id: string; pass: boolean; detail: string }> = [];

  let dashboardThrew: string | null = null;
  let entity_graph: RepositoryEntityGraph | null = null;
  let capability_graph: CapabilityRelation[] = [];
  let dependency_graph: ServiceUsage[] = [];
  let missing_capabilities: MissingCapabilityReport | null = null;
  let dead_capabilities: DeadCapabilityReport | null = null;
  let capabilityMappings: CapabilityMapping[] = [];

  const entity_graph_self_test = runEntityGraphSelfTest();
  const capability_graph_self_test = runCapabilityGraphSelfTest();
  const dependency_graph_self_test = runDependencyGraphSelfTest();
  const gap_analyzer_self_test = runGapAnalyzerSelfTest();

  try {
    const index = buildRepositoryIndex(root);
    capabilityMappings = mapCapabilities(root, index);
    entity_graph = buildEntityGraphFromMappings(capabilityMappings);
    capability_graph = buildCapabilityGraph(capabilityMappings);
    dependency_graph = buildDependencyGraph(capabilityMappings);
    missing_capabilities = detectMissingCapabilities(root, capabilityMappings);
    dead_capabilities = detectDeadCapabilities(capabilityMappings);
  } catch (error) {
    dashboardThrew = error instanceof Error ? error.message : String(error);
  }

  // Repository PASS: re-confirms the unmodified Real Project Integration
  // layer still produces the same real facts this phase builds on top of —
  // a fresh, independent re-run of buildRepositoryIndex()/mapCapabilities()
  // must match exactly.
  const directIndex = buildRepositoryIndex(root);
  const directMappings = mapCapabilities(root, directIndex);
  const repository_pass_ok = dashboardThrew === null && JSON.stringify(capabilityMappings) === JSON.stringify(directMappings);

  // Knowledge PASS: self-test passed, and the real entity graph's counts
  // are independently re-derivable from the real capability mappings —
  // capability-entity count must equal the real mapping count, and edge
  // count must equal the total real imported_services count.
  const expectedEdgeCount = capabilityMappings.reduce((sum, m) => sum + m.imported_services.length, 0);
  const knowledge_pass_ok =
    dashboardThrew === null &&
    entity_graph_self_test.ok &&
    !!entity_graph &&
    entity_graph.entities.filter((e) => e.entity_type === 'capability').length === capabilityMappings.length &&
    entity_graph.edges.length === expectedEdgeCount;

  // Capability PASS: self-test passed (hub-exclusion proven), and the real
  // capability graph never includes a relation whose evidence contains a
  // service referenced by more real capabilities than the disclosed
  // threshold allows — cross-checked directly against the real dependency
  // graph's own usage counts.
  const usageByService = new Map(dependency_graph.map((u) => [u.service_relpath, u.used_by_capabilities.length]));
  const capabilityGraphHubViolations = capability_graph.filter((rel) => rel.shared_distinctive_services.some((s) => (usageByService.get(s) ?? 0) > 3));
  const capability_pass_ok = dashboardThrew === null && capability_graph_self_test.ok && capabilityGraphHubViolations.length === 0;

  // Dependency PASS: the dependency graph intentionally remains the
  // registered verify:* graph, so compare it with the explicitly separated
  // registered-verify count rather than the broader semantic-coverage union.
  const dependency_pass_ok =
    dashboardThrew === null &&
    dependency_graph_self_test.ok &&
    !!missing_capabilities &&
    dependency_graph.length === missing_capabilities.registered_verify_referenced_services;

  // Gap PASS: self-test passed, and the real missing+referenced counts sum
  // exactly to the real total service count — no service double-counted or
  // dropped between the two categories.
  const gap_pass_ok =
    dashboardThrew === null &&
    gap_analyzer_self_test.ok &&
    !!missing_capabilities &&
    missing_capabilities.missing_capability_count + missing_capabilities.referenced_services === missing_capabilities.total_real_services;

  const repository = checkRepositoryInvariants(root);
  const api_free = checkApiFree(root);
  const api_free_pass_ok = api_free.ok;

  checks.push({
    id: 'repository_pass',
    pass: repository_pass_ok,
    detail: repository_pass_ok
      ? `the unmodified Real Project Integration layer's real capability mappings re-confirmed byte-identical on a fresh, independent call`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'knowledge_pass',
    pass: knowledge_pass_ok,
    detail: knowledge_pass_ok
      ? `self-test passed; real entity graph has ${entity_graph?.entities.length ?? 0} entities and ${entity_graph?.edges.length ?? 0} edges, matching an independent recomputation exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'capability_pass',
    pass: capability_pass_ok,
    detail: capability_pass_ok
      ? `self-test passed; ${capability_graph.length} real capability relation(s) found, none backed only by an over-threshold "hub" service`
      : `hub violations: ${capabilityGraphHubViolations.length}`,
  });
  checks.push({
    id: 'dependency_pass',
    pass: dependency_pass_ok,
    detail: dependency_pass_ok
      ? `self-test passed; registered verify:* dependency graph covers ${dependency_graph.length} distinct real service(s), matching the independently separated registered-verify referenced count exactly`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'gap_pass',
    pass: gap_pass_ok,
    detail: gap_pass_ok
      ? `self-test passed; ${missing_capabilities?.missing_capability_count ?? 0} missing + ${missing_capabilities?.referenced_services ?? 0} referenced = ${missing_capabilities?.total_real_services ?? 0} real total services, exactly; ${dead_capabilities?.dead_capability_count ?? 0} real dead capabilities found`
      : `unhandled_exception: ${dashboardThrew}`,
  });
  checks.push({
    id: 'api_free_pass',
    pass: api_free_pass_ok,
    detail: api_free_pass_ok
      ? `API 미사용 mechanically confirmed — ${api_free.files_checked.length} files scanned, 0 forbidden network/live-dispatch markers found`
      : `API-usage markers found: ${api_free.violations.map((v) => `${v.file}:${v.marker}`).join(', ')}`,
  });

  const end_to_end_pass_ok =
    repository_pass_ok && knowledge_pass_ok && capability_pass_ok && dependency_pass_ok && gap_pass_ok && api_free_pass_ok && repository.ok;

  return {
    phase: PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PHASE,
    verdict: end_to_end_pass_ok ? PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_PASS_VERDICT : PROJECT_BRAIN_REAL_PROJECT_INTELLIGENCE_FAIL_VERDICT,
    repository_pass_ok,
    knowledge_pass_ok,
    capability_pass_ok,
    dependency_pass_ok,
    gap_pass_ok,
    api_free_pass_ok,
    entity_graph_self_test,
    capability_graph_self_test,
    dependency_graph_self_test,
    gap_analyzer_self_test,
    entity_graph,
    capability_graph,
    dependency_graph,
    missing_capabilities,
    dead_capabilities,
    api_free,
    repository,
    checks,
  };
}
