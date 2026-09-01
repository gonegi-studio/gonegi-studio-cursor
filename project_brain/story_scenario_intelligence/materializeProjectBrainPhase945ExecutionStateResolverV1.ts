/**
 * PHASE-945 -- Project Brain Execution State Resolver V1.
 *
 * PHASE-944 built resolveFunctionalStatus (evidence -> satisfied/blocked/pending/unknown). This
 * phase adds the companion resolveExecutionState (evidence -> NOT_STARTED/IN_PROGRESS/COMPLETED/
 * VERIFIED) and reuses the SAME EvidenceInput taxonomy for both, so one real execution result
 * produces two projections: a functional_status (already handled by PHASE-944) and an
 * execution_state (this phase). This is what "실행 결과 -> evidence -> functional status ->
 * execution_state 연결" means concretely: one evidence object, two resolvers, no duplication.
 *
 * Transition rules (forward-only, evidence-gated, never forced):
 *   no_evidence          -> state unchanged (cannot advance without evidence)
 *   attempted_incomplete -> NOT_STARTED -> IN_PROGRESS (once); no further effect once IN_PROGRESS+
 *   hard_fail             -> state unchanged (a real failure is NOT progress -- kept distinct from
 *                            attempted_incomplete, which is real-but-unresolved, not a real negative)
 *   hard_pass             -> advances directly to VERIFIED (a real independent pass evidences both
 *                            completion and verification at once)
 *
 * Applied to the existing 3 chains (production_runtime/GPU, ghibli_pipeline, semantic_quality):
 * no real execution was performed this phase (explicitly forbidden), so each chain's evidence is
 * 'no_evidence' and every chain is expected to -- and does -- remain NOT_STARTED. This demonstrates
 * "억지 진행 금지" as an enforced property of the resolver, not just a stated intention.
 *
 * Also adds a general, reusable Goal<->Capability contradiction detector (not limited to the 3
 * chains -- run across all 5 goals' required_capability_refs against the overlay v3 capability
 * statuses) and reports what it finds, without silently correcting any prior phase's recorded
 * status.
 *
 * Additive-only. No GPU/adapter fix, no cap_dataset_management reclassification, no LPM
 * regeneration, no repository scan.
 */
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const PB_SSI = __dirname;

function repoPath(...parts: string[]): string {
  return join(REPO_ROOT, ...parts);
}
function sha256File(absPath: string): string {
  return createHash('sha256').update(readFileSync(absPath)).digest('hex');
}
function requireExists(abs: string, label?: string): string {
  if (!existsSync(abs)) throw new Error(`PHASE-945 fail-closed: referenced real file does not exist: ${label ?? abs}`);
  return abs;
}
function writeSidecar(filename: string, obj: unknown): void {
  writeFileSync(join(PB_SSI, filename), JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`  wrote ${filename}`);
}

// ---------------------------------------------------------------------------
// Shared evidence taxonomy (same shape as PHASE-944's resolveFunctionalStatus input).
// ---------------------------------------------------------------------------
type EvidenceInput =
  | { kind: 'no_evidence' }
  | { kind: 'hard_pass'; source: string; detail: string }
  | { kind: 'hard_fail'; source: string; detail: string }
  | { kind: 'attempted_incomplete'; source: string; detail: string };

type ExecutionState = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';

function resolveExecutionState(currentState: ExecutionState, evidence: EvidenceInput): { state: ExecutionState; transitioned: boolean; reason: string } {
  switch (evidence.kind) {
    case 'no_evidence':
      return { state: currentState, transitioned: false, reason: 'No execution evidence -- state cannot advance without real evidence (no forced progression).' };
    case 'attempted_incomplete':
      if (currentState === 'NOT_STARTED') {
        return { state: 'IN_PROGRESS', transitioned: true, reason: `Real evidence of an attempted-but-incomplete execution: ${evidence.detail}` };
      }
      return { state: currentState, transitioned: false, reason: 'Already at or past IN_PROGRESS; attempted_incomplete evidence does not regress or re-advance.' };
    case 'hard_fail':
      return { state: currentState, transitioned: false, reason: `Execution evidence shows a hard failure, distinct from an incomplete-but-real attempt: ${evidence.detail}. A failure is never treated as progress.` };
    case 'hard_pass':
      if (currentState === 'VERIFIED') {
        return { state: 'VERIFIED', transitioned: false, reason: 'Already VERIFIED.' };
      }
      return { state: 'VERIFIED', transitioned: true, reason: `Real, independent evidence confirms the execution succeeded and is verified: ${evidence.detail}` };
  }
}

// ---------------------------------------------------------------------------
// General Goal <-> Capability contradiction detector.
// ---------------------------------------------------------------------------
type StatusLike = 'satisfied' | 'blocked' | 'pending' | 'unknown';

interface ContradictionRule {
  name: string;
  description: string;
  test: (goalStatus: StatusLike, capStatuses: StatusLike[]) => boolean;
}
const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    name: 'satisfied_goal_backed_by_blocked_capability',
    description: 'A goal marked satisfied cannot be backed by any required capability that is itself blocked.',
    test: (g, caps) => g === 'satisfied' && caps.includes('blocked'),
  },
  {
    name: 'blocked_goal_with_no_blocking_capability',
    description: 'A goal marked blocked should have at least one required, assessed capability that is not satisfied to explain the block.',
    test: (g, caps) => g === 'blocked' && caps.length > 0 && caps.every((c) => c === 'satisfied'),
  },
];

function detectGoalCapabilityContradictions(
  links: Array<{ goal_id: string; goal_status: StatusLike; capability_ids: string[]; capability_statuses: StatusLike[] }>
) {
  return links.flatMap((link) =>
    CONTRADICTION_RULES.filter((r) => r.test(link.goal_status, link.capability_statuses)).map((r) => ({
      goal_id: link.goal_id,
      rule: r.name,
      description: r.description,
      capability_ids: link.capability_ids,
      capability_statuses: link.capability_statuses,
    }))
  );
}

async function main() {
  console.log('=== PHASE-945 -- Project Brain Execution State Resolver V1 ===\n');

  console.log('[0] Pre-flight baseline hashes -- files this phase must NOT modify');
  const outOfScopeAbs: Record<string, string> = {
    char_dana: repoPath('project_brain', 'story_scenario_intelligence', 'authored_content', 'character_arcs', 'CHAR-dana.json'),
    char_gonagi: repoPath('project_brain', 'story_scenario_intelligence', 'authored_content', 'character_arcs', 'CHAR-gonagi.json'),
    lpm: repoPath('datasets', 'project_brain', 'lpm_v1', 'living-project-model-v1.json'),
    goal_model: repoPath('datasets', 'project_brain', 'goal_model_v1', 'project-brain-goal-model-v1.json'),
    v4_assessment: join(PB_SSI, 'project-brain-goal-satisfaction-v4-resolver-applied-assessment-v1.json'),
    trace_v4: join(PB_SSI, 'project-brain-goal-gap-dependency-trace-v4.json'),
    overlay_v3: join(PB_SSI, 'project-brain-lpm-capability-functional-status-overlay-v3.json'),
    semantics_v1: join(PB_SSI, 'project-brain-capability-functional-status-semantics-v1.json'),
    check_4layer_v944: join(PB_SSI, 'project-brain-4layer-consistency-check-phase944-v1.json'),
  };
  const before: Record<string, string> = {};
  for (const [k, abs] of Object.entries(outOfScopeAbs)) before[k] = sha256File(requireExists(abs, k));
  console.log(`  hashed ${Object.keys(before).length} out-of-scope files`);
  console.log();

  const v4 = JSON.parse(readFileSync(outOfScopeAbs.v4_assessment, 'utf8'));
  const traceV4 = JSON.parse(readFileSync(outOfScopeAbs.trace_v4, 'utf8'));
  const overlayV3 = JSON.parse(readFileSync(outOfScopeAbs.overlay_v3, 'utf8'));
  const goalModel = JSON.parse(readFileSync(outOfScopeAbs.goal_model, 'utf8'));

  // ---------------------------------------------------------------------
  // [1] Apply resolveExecutionState to the existing 3 chains -- no real execution occurred.
  // ---------------------------------------------------------------------
  console.log('[1] Applying Execution State Resolver to the 3 existing chains (GPU / ghibli_pipeline / semantic_quality)');
  const traceV5 = {
    trace_id: 'project_brain_goal_gap_dependency_trace_v5',
    phase: 'PHASE-945',
    generated_at: new Date().toISOString(),
    mode: 'ADDITIVE_EXTENSION_OF_TRACE_V4_NOT_A_REPLACEMENT_V4_UNCHANGED_ON_DISK',
    resolver_used: 'resolveExecutionState (this phase\'s Execution State Resolver V1, see script) -- reuses the same EvidenceInput taxonomy as PHASE-944\'s resolveFunctionalStatus',
    execution_state_transition_rules: {
      no_evidence: 'state unchanged',
      attempted_incomplete: 'NOT_STARTED -> IN_PROGRESS (once); no effect once IN_PROGRESS or later',
      hard_fail: 'state unchanged -- a failure is never treated as progress, kept distinct from attempted_incomplete',
      hard_pass: 'advances directly to VERIFIED from any prior state',
    },
    chains: traceV4.chains.map((c: any) => {
      const evidence: EvidenceInput = { kind: 'no_evidence' };
      const resolved = resolveExecutionState(c.execution_state as ExecutionState, evidence);
      return {
        ...c,
        execution_state: resolved.state,
        execution_state_transitioned_this_phase: resolved.transitioned,
        execution_state_resolution_reason: resolved.reason,
        execution_state_last_checked_at: new Date().toISOString(),
        execution_state_evidence_ref: null,
        execution_state_evidence_this_phase: 'no_evidence -- PHASE-945 explicitly forbids performing the actual GPU/adapter/reclassification work',
      };
    }),
  };
  for (const c of traceV5.chains) console.log(`  ${c.goal_id}: ${c.execution_state} (transitioned: ${c.execution_state_transitioned_this_phase})`);
  const noForcedProgress = traceV5.chains.every((c: any) => c.execution_state === 'NOT_STARTED' && c.execution_state_transitioned_this_phase === false);
  console.log(`  no forced progress confirmed: ${noForcedProgress}`);
  writeSidecar('project-brain-goal-gap-dependency-trace-v5.json', traceV5);
  console.log();

  // ---------------------------------------------------------------------
  // [2] Demonstrate the resolver's real behavior on hypothetical (not applied) evidence,
  //     to prove attempted_incomplete vs hard_fail are handled distinctly. Illustrative only --
  //     not persisted as if it happened; clearly labeled as a dry-run demonstration.
  // ---------------------------------------------------------------------
  console.log('[2] Dry-run demonstration of resolver behavior (illustrative only, NOT applied to any real chain)');
  const dryRun = {
    demonstration_id: 'project_brain_execution_state_resolver_dry_run_demonstration_phase945',
    note: 'These are hypothetical evidence inputs used only to prove the resolver distinguishes attempted_incomplete from hard_fail and never forces progress. None of this was applied to the real 3 chains above (all of which used no_evidence).',
    cases: [
      { from: 'NOT_STARTED', evidence: { kind: 'attempted_incomplete', source: 'hypothetical', detail: 'e.g. a GPU restart was attempted but the service is still not reachable' }, result: resolveExecutionState('NOT_STARTED', { kind: 'attempted_incomplete', source: 'hypothetical', detail: 'partial attempt' }) },
      { from: 'NOT_STARTED', evidence: { kind: 'hard_fail', source: 'hypothetical', detail: 'e.g. the attempted fix was applied and re-validation still returns FAIL' }, result: resolveExecutionState('NOT_STARTED', { kind: 'hard_fail', source: 'hypothetical', detail: 'real failure' }) },
      { from: 'IN_PROGRESS', evidence: { kind: 'hard_pass', source: 'hypothetical', detail: 'e.g. re-validation independently confirms success' }, result: resolveExecutionState('IN_PROGRESS', { kind: 'hard_pass', source: 'hypothetical', detail: 'real independent pass' }) },
    ],
  };
  writeSidecar('project-brain-execution-state-resolver-dry-run-demonstration-phase945-v1.json', dryRun);
  console.log('  dry-run cases written (illustrative, not applied to real chains)');
  console.log();

  // ---------------------------------------------------------------------
  // [3] General Goal<->Capability contradiction detection across all 5 goals.
  // ---------------------------------------------------------------------
  console.log('[3] Running general Goal<->Capability contradiction detector across all 5 goals\' required_capability_refs');
  const overlayStatusById = new Map<string, StatusLike>(overlayV3.capabilities.map((c: any) => [c.capability_id, c.functional_status]));
  function goalFunctionalStatus(goalId: string): StatusLike {
    const e = v4.entries.find((x: any) => x.goal_id === goalId);
    return (e?.phase944_functional_status ?? e?.functional_status) as StatusLike;
  }
  const links = goalModel.goal_model.goals.map((g: any) => {
    const assessedCapIds: string[] = g.required_capability_refs.filter((id: string) => overlayStatusById.has(id));
    return {
      goal_id: g.goal_id,
      goal_status: goalFunctionalStatus(g.goal_id),
      capability_ids: assessedCapIds,
      capability_statuses: assessedCapIds.map((id) => overlayStatusById.get(id) as StatusLike),
    };
  });
  const contradictions = detectGoalCapabilityContradictions(links);
  console.log(`  goals checked: ${links.length}, contradictions found: ${contradictions.length}`);
  for (const c of contradictions) console.log(`    [${c.rule}] ${c.goal_id} <-> ${JSON.stringify(c.capability_ids)} = ${JSON.stringify(c.capability_statuses)}`);
  const contradictionReport = {
    check_id: 'project_brain_goal_capability_contradiction_detection_phase945_v1',
    generated_at: new Date().toISOString(),
    method: 'detectGoalCapabilityContradictions (this phase\'s general detector) applied to ALL 5 goals\' required_capability_refs (from goal_model) crossed with overlay v3 capability statuses -- not limited to the 3 trace chains.',
    goal_capability_links_checked: links,
    contradictions_found: contradictions,
    disposition: contradictions.length === 0
      ? 'No contradictions found.'
      : 'Contradiction(s) found and reported here as a NEW finding. Not silently corrected -- resolving a detected contradiction means re-evaluating an existing goal/capability status, which is out of this phase\'s scope (this phase builds the detector, not a re-adjudication of prior phases\' recorded statuses). Flagged for a future phase.',
  };
  writeSidecar('project-brain-goal-capability-contradiction-report-phase945-v1.json', contradictionReport);
  console.log();

  // ---------------------------------------------------------------------
  // [4] 4-layer consistency check, re-run against v5 trace (v4 assessment / overlay v3 unchanged).
  // ---------------------------------------------------------------------
  console.log('[4] 4-layer consistency check (re-run against trace v5; v4 assessment / overlay v3 not re-derived)');
  const goalIds = new Set(v4.entries.map((e: any) => e.goal_id));
  const capIds = new Set(overlayV3.capabilities.map((c: any) => c.capability_id));
  const gapIds = new Set(traceV5.chains.map((c: any) => c.gap_id));
  const dependencyIds = new Set(traceV5.chains.map((c: any) => c.dependency_id));

  const layer1_goal = {
    layer: 'Goal',
    every_blocked_goal_has_exactly_one_chain: v4.entries
      .filter((e: any) => goalFunctionalStatus(e.goal_id) === 'blocked')
      .every((e: any) => traceV5.chains.filter((c: any) => c.goal_id === e.goal_id).length === 1),
    every_chain_goal_id_exists_in_v4: [...new Set(traceV5.chains.map((c: any) => c.goal_id))].every((id) => goalIds.has(id as string)),
    exactly_3_chains_kept: traceV5.chains.length === 3,
  };
  const layer2_gap = {
    layer: 'Gap',
    every_chain_has_blocking_reason_evidence_execution_unit_and_state: traceV5.chains.every((c: any) => !!c.blocking_reason && !!c.evidence && !!c.next_action_execution_unit && !!c.execution_state),
    gap_ids_unique: gapIds.size === traceV5.chains.length,
  };
  const layer3_dependency = {
    layer: 'Dependency',
    dependency_ids_unique: dependencyIds.size === traceV5.chains.length,
    every_blocked_by_capability_resolves_in_overlay_v3: traceV5.chains.every((c: any) =>
      c.blocked_by_capability.split(',').map((s: string) => s.trim().split(' ')[0]).every((id: string) => capIds.has(id))
    ),
  };
  const overlayViolations = overlayV3.capabilities.filter((c: any) => c.functional_status !== 'unknown' && !c.evidence_source);
  const layer4_capability = {
    layer: 'Capability',
    all_entries_conform_to_phase943_fixed_semantics: overlayViolations.length === 0,
    no_new_hard_contradiction_from_the_3_chains: traceV5.chains.every((c: any) => {
      const capIdsForChain: string[] = c.blocked_by_capability.split(',').map((s: string) => s.trim().split(' ')[0]);
      const anyBlockedCap = capIdsForChain.some((id) => overlayV3.capabilities.find((cc: any) => cc.capability_id === id)?.functional_status === 'blocked');
      return !(anyBlockedCap && goalFunctionalStatus(c.goal_id) === 'satisfied');
    }),
    general_contradiction_detector_result: { contradictions_found: contradictions.length, note: 'Reported in project-brain-goal-capability-contradiction-report-phase945-v1.json; does NOT fail this 4-layer check by itself -- a detected contradiction is a finding to surface, not a structural integrity failure of this phase\'s own outputs.' },
  };

  const check4LayerV945 = {
    check_id: 'project_brain_4layer_goal_gap_dependency_capability_consistency_check_phase945_v1',
    generated_at: new Date().toISOString(),
    checked_against: [
      'project-brain-goal-satisfaction-v4-resolver-applied-assessment-v1.json (PHASE-944, not re-derived)',
      'project-brain-goal-gap-dependency-trace-v5.json (this phase)',
      'project-brain-lpm-capability-functional-status-overlay-v3.json (PHASE-944, not re-derived)',
      'project-brain-capability-functional-status-semantics-v1.json (PHASE-943, not re-derived)',
    ],
    layers: [layer1_goal, layer2_gap, layer3_dependency, layer4_capability],
    all_layers_structurally_passed: [layer1_goal, layer2_gap, layer3_dependency]
      .every((l) => Object.entries(l).filter(([k]) => k !== 'layer').every(([, v]) => v === true))
      && layer4_capability.all_entries_conform_to_phase943_fixed_semantics
      && layer4_capability.no_new_hard_contradiction_from_the_3_chains,
  };
  console.log(`  all_layers_structurally_passed: ${check4LayerV945.all_layers_structurally_passed}`);
  writeSidecar('project-brain-4layer-consistency-check-phase945-v1.json', check4LayerV945);
  console.log();

  // ---------------------------------------------------------------------
  // [5] Non-modification proof
  // ---------------------------------------------------------------------
  console.log('[5] Non-modification proof -- out-of-scope files byte-identical before/after');
  const after: Record<string, string> = {};
  for (const [k, abs] of Object.entries(outOfScopeAbs)) after[k] = sha256File(abs);
  let allUnchanged = true;
  for (const k of Object.keys(before)) {
    const ok = before[k] === after[k];
    allUnchanged = allUnchanged && ok;
    console.log(`  ${k} unchanged: ${ok}`);
  }
  console.log();

  const ok = allUnchanged && noForcedProgress && check4LayerV945.all_layers_structurally_passed;
  console.log(`${ok ? 'OK' : 'CHECK NEEDED'} -- PHASE-945 complete. No forced execution-state progress: ${noForcedProgress}. 4-layer structural consistency: ${check4LayerV945.all_layers_structurally_passed}. Goal<->Capability contradictions found (surfaced, not corrected): ${contradictions.length}. All out-of-scope files unchanged: ${allUnchanged}.`);
  process.exitCode = ok ? 0 : 1;
}

main();
