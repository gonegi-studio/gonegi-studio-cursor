// Re-arm guard for the 942->946 Goal<->Capability contradiction error class only.
// Reuses detectGoalCapabilityContradictions() verbatim from its original PHASE-945
// source (never duplicated, never re-implemented) via the same AST-extraction +
// VM-sandbox technique genieOjtCaptureEnforcement.mjs already uses for
// readCaptureState() -- because that source file's main() runs unconditionally at
// module load, a normal import would re-execute the entire one-off PHASE-945
// materialization. Extracting just the two named declarations avoids that
// entirely, without touching the original file.
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { retrieveCanonicalLearning, retrieveCanonicalHistoryByProblem } from './genieCanonicalLearningRetrieval.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PB_SSI = join(root, 'project_brain', 'story_scenario_intelligence');
const DETECTOR_SOURCE_FILE = 'materializeProjectBrainPhase945ExecutionStateResolverV1.ts';

// The one canonical pointer PHASE-E9 established specifically to stop resolving
// "the current goal-satisfaction assessment" via a hardcoded version filename
// (the exact class of stale-reference bug E8 discovered). Reused verbatim.
const STANDARD_GOAL_JUDGMENT_POINTER = 'project-brain-standard-goal-judgment-output-v3.json';
// No later overlay version exists on disk; v6 is the real, current one (checked
// at call time, not assumed) -- see loadLiveCapabilityFunctionalStatus below.
const CAPABILITY_OVERLAY_FILE = 'project-brain-lpm-capability-functional-status-overlay-v6.json';
const GOAL_MODEL_PATH = 'datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json';

function readJson(root, rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'));
}

/** Extracts CONTRADICTION_RULES + detectGoalCapabilityContradictions verbatim; never
 * imports the source file directly (its main() would re-run the whole one-off phase). */
function loadContradictionDetector() {
  const file = DETECTOR_SOURCE_FILE;
  const source = readFileSync(join(PB_SSI, file), 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const names = new Set(['CONTRADICTION_RULES', 'detectGoalCapabilityContradictions']);
  const declarations = parsed.statements.filter((s) =>
    (ts.isFunctionDeclaration(s) && names.has(s.name?.text)) ||
    (ts.isVariableStatement(s) && s.declarationList.declarations.some((d) => ts.isIdentifier(d.name) && names.has(d.name.text)))
  );
  if (declarations.length !== names.size) throw new Error('GOAL_CAPABILITY_CONTRADICTION_DETECTOR_UNAVAILABLE');
  const context = vm.createContext({});
  vm.runInContext(
    ts.transpileModule(declarations.map((s) => s.getText(parsed)).join('\n'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
    { timeout: 10000 }
  );
  if (typeof context.detectGoalCapabilityContradictions !== 'function') {
    throw new Error('GOAL_CAPABILITY_CONTRADICTION_DETECTOR_UNAVAILABLE');
  }
  return context.detectGoalCapabilityContradictions;
}

/** Goal-level functional status, resolved through the existing canonical pointer
 * (never a hardcoded version filename -- that is the exact bug class E8/E9 fixed). */
function loadLiveGoalFunctionalStatus(rootDir) {
  const pointer = readJson(rootDir, `project_brain/story_scenario_intelligence/${STANDARD_GOAL_JUDGMENT_POINTER}`);
  const byGoalId = new Map(pointer.entries_summary.map((e) => [e.goal_id, e.functional]));
  return { byGoalId, pointerRef: `project_brain/story_scenario_intelligence/${STANDARD_GOAL_JUDGMENT_POINTER}` };
}

/** Capability-level functional status. The overlay file series has no canonical
 * pointer of its own; the highest existing version number is used and reported,
 * never assumed -- this call re-checks disk each time, not a remembered number. */
function loadLiveCapabilityFunctionalStatus(rootDir) {
  const overlay = readJson(rootDir, `project_brain/story_scenario_intelligence/${CAPABILITY_OVERLAY_FILE}`);
  const byCapId = new Map(overlay.capabilities.map((c) => [c.capability_id, c.functional_status]));
  return { byCapId, overlayRef: `project_brain/story_scenario_intelligence/${CAPABILITY_OVERLAY_FILE}` };
}

/**
 * Synchronous, single-pass, zero-threshold structural check across the live 5
 * Goals only (not a memory scan). Returns [] when nothing is wrong -- callers
 * must treat that as "existing flow fully unchanged."
 */
export function checkGoalCapabilityContradictionsNow(rootDir = root) {
  const goalModel = readJson(rootDir, GOAL_MODEL_PATH);
  const { byGoalId: goalStatus, pointerRef } = loadLiveGoalFunctionalStatus(rootDir);
  const { byCapId: capStatus, overlayRef } = loadLiveCapabilityFunctionalStatus(rootDir);
  const links = goalModel.goal_model.goals.map((g) => {
    const assessedCapIds = g.required_capability_refs.filter((id) => capStatus.has(id));
    return {
      goal_id: g.goal_id,
      goal_status: goalStatus.get(g.goal_id),
      capability_ids: assessedCapIds,
      capability_statuses: assessedCapIds.map((id) => capStatus.get(id)),
    };
  });
  const detect = loadContradictionDetector();
  const contradictions = detect(links);
  return { contradictions, links, sources: { goal_model: GOAL_MODEL_PATH, goal_status_pointer: pointerRef, capability_overlay: overlayRef } };
}

/**
 * The only externally visible entry point. Never modifies any status, never
 * decides anything -- it only forces real correction History to be surfaced
 * and evidence/SHA-verified before a Goal/Capability judgment proceeds.
 * No contradiction => {contradiction_detected:false, forced_reads:[]}, and the
 * caller's existing flow is byte-for-byte unaffected: nothing here is read or
 * written beyond the cheap structural check itself.
 */
export function rearmGoalCapabilityCorrectionMemory(rootDir = root, readers = {
  retrieve: retrieveCanonicalLearning,
  bridgeByProblem: retrieveCanonicalHistoryByProblem,
}) {
  const { contradictions, sources } = checkGoalCapabilityContradictionsNow(rootDir);
  if (contradictions.length === 0) {
    return { contradiction_detected: false, contradictions: [], forced_reads: [], sources };
  }
  const capabilityIds = [...new Set(contradictions.flatMap((c) => c.capability_ids))];
  const forcedReads = [];
  for (const capabilityId of capabilityIds) {
    const hits = readers.retrieve({ kind: 'experience', key: 'capability_ref', value: capabilityId });
    if (!hits.ok) continue;
    // Only real corrections: an Experience whose own decision explicitly names
    // the earlier Experience it corrects. A capability_ref match alone is not enough.
    const corrections = hits.results.filter((h) => typeof h.record.decision?.corrects_experience_id === 'string');
    for (const hit of corrections) {
      // Evidence/SHA verification against the ORIGINAL (corrected) Experience's
      // own real evidence, resolved by an independent exact-key re-lookup of the
      // corrects_experience_id it names -- not merely trusting that the id string exists.
      const correctedId = hit.record.decision.corrects_experience_id;
      const correctedExact = readers.retrieve({ kind: 'experience', key: 'experience_id', value: correctedId });
      const correctedRecord = correctedExact.ok ? correctedExact.results[0]?.record : undefined;
      const bridge = correctedRecord ? readers.bridgeByProblem({ problem: correctedRecord.problem }) : { ok: false, status: 'DANGLING_REFERENCE', results: [] };
      const bridgedResult = bridge.ok ? bridge.results.find((r) => r.experience_id === correctedId) : undefined;
      forcedReads.push({
        capability_id: capabilityId,
        experience_id: hit.id,
        lesson: hit.record.lesson,
        // Existing fields only, exposed so the SAME functional_status field name
        // is never read as one global capability-level fact: this record's
        // result is scoped to context.goal_id, and decision_summary states what
        // was actually evaluated. The one authoritative CURRENT capability
        // status remains the LPM overlay read in checkGoalCapabilityContradictionsNow()
        // above -- never inferred or ranked from Experience result fields.
        goal_id: hit.record.context?.goal_id ?? null,
        decision_summary: hit.record.decision?.decision_summary ?? null,
        corrects_experience_id: correctedId,
        corrects_experience_id_reverified: correctedExact.ok && correctedExact.results.length === 1,
        original_evidence_bridge_status: bridge.status,
        original_evidence_resolved: bridgedResult
          ? bridgedResult.history.filter((h) => h.resolved !== false).map((h) => ({ ref: h.ref, sha256: h.sha256 }))
          : [],
      });
    }
  }
  return { contradiction_detected: true, contradictions, forced_reads: forcedReads, sources };
}
