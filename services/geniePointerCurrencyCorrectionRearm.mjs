// Re-arm guard for the E8->E9 stale-hardcoded-pointer error class only.
// Reuses pointerCurrencyGuard() verbatim from its original PHASE-E25 source
// (never duplicated, never re-implemented) via the same AST-extraction +
// VM-sandbox technique already used for readCaptureState() and for the
// 942->946 Goal<->Capability guard -- because that source file's main() runs
// unconditionally at module load, a normal import would re-execute the whole
// one-off PHASE-E25 materialization. Extracting just the named declarations
// avoids that entirely, without touching the original file.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { readCaptureState } from './genieOjtCaptureEnforcement.mjs';
import { retrieveCanonicalLearning, retrieveCanonicalHistoryByProblem } from './genieCanonicalLearningRetrieval.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PB_SSI = join(root, 'project_brain', 'story_scenario_intelligence');
const GUARD_SOURCE_FILE = 'materializeProjectBrainPhaseE25PointerCurrencyGuardV1.ts';

/** Extracts findLatestSatisfactionFile + pointerCurrencyGuard verbatim; never
 * imports the source file directly (its main() would re-run the whole one-off phase). */
function loadPointerCurrencyGuard() {
  const file = GUARD_SOURCE_FILE;
  const source = readFileSync(join(PB_SSI, file), 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const names = new Set(['findLatestSatisfactionFile', 'pointerCurrencyGuard']);
  const declarations = parsed.statements.filter((s) => ts.isFunctionDeclaration(s) && names.has(s.name?.text));
  if (declarations.length !== names.size) throw new Error('POINTER_CURRENCY_GUARD_UNAVAILABLE');
  const context = vm.createContext({ readdirSync });
  vm.runInContext(
    ts.transpileModule(declarations.map((s) => s.getText(parsed)).join('\n'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
    { timeout: 10000 }
  );
  if (typeof context.pointerCurrencyGuard !== 'function') throw new Error('POINTER_CURRENCY_GUARD_UNAVAILABLE');
  return context.pointerCurrencyGuard;
}

/** Same v-number pointer-chain scan PHASE-E25's own main() used: the existing
 * v1/v2/v3 convention, never a hardcoded filename -- the highest version found
 * on disk right now, re-checked every call. */
function findLatestPointerFile(ssiDir) {
  const files = readdirSync(ssiDir).filter((f) => /^project-brain-standard-goal-judgment-output-v\d+\.json$/.test(f));
  const versionOf = (f) => parseInt((f.match(/-v(\d+)\.json$/) ?? ['', '0'])[1], 10);
  return files.reduce((a, b) => (versionOf(b) > versionOf(a) ? b : a), files[0]);
}

function readTargetSummary(ssiDir, filename) {
  const abs = join(ssiDir, filename);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, 'utf8')).summary ?? null;
}

/**
 * Synchronous, single-pointer check (not a memory scan): reads only the one
 * current canonical pointer file plus the one target file it claims to point
 * at. Returns CURRENT/STALE plus the pointer's own real phase field, which is
 * the only structural link back to its correction Experience (E9's
 * capability_refs are unrelated bootstrap artifacts, not a usable key here).
 */
export function checkPointerCurrencyNow(rootDir = root) {
  const ssiDir = join(rootDir, 'project_brain', 'story_scenario_intelligence');
  const pointerFile = findLatestPointerFile(ssiDir);
  const pointer = JSON.parse(readFileSync(join(ssiDir, pointerFile), 'utf8'));
  const guard = loadPointerCurrencyGuard();
  const result = guard(pointer, ssiDir, (filename) => readTargetSummary(ssiDir, filename));
  return { pointer_file: pointerFile, pointer_id: pointer.pointer_id, pointer_phase: pointer.phase ?? null, guard: result };
}

/**
 * The only externally visible entry point. Never modifies the pointer, never
 * decides anything -- it only forces real correction History to be surfaced
 * and evidence/SHA-verified before a pointer-dependent judgment proceeds.
 * CURRENT => {contradiction_detected:false, forced_reads:[]}: the caller's
 * existing flow is byte-for-byte unaffected beyond the one cheap guard check.
 */
export function rearmPointerCurrencyCorrectionMemory(rootDir = root, readers = {
  canonical: readCaptureState,
  retrieve: retrieveCanonicalLearning,
  bridgeByProblem: retrieveCanonicalHistoryByProblem,
}) {
  const check = checkPointerCurrencyNow(rootDir);
  if (check.guard.status === 'CURRENT') {
    return { contradiction_detected: false, pointer_check: check, forced_reads: [] };
  }
  const forcedReads = [];
  if (check.pointer_phase) {
    // Targeted: an exact match on the pointer's own recorded phase field over
    // the already-loaded canonical set -- not a scored/ranked/full-text scan,
    // and not merely "an Experience with this id exists."
    const state = readers.canonical();
    const phaseMatches = state.records.filter((r) => r.phase === check.pointer_phase);
    const corrections = phaseMatches.filter((r) => typeof r.decision?.corrects_experience_id === 'string');
    for (const hit of corrections) {
      const correctedId = hit.decision.corrects_experience_id;
      const correctedExact = readers.retrieve({ kind: 'experience', key: 'experience_id', value: correctedId });
      const correctedRecord = correctedExact.ok ? correctedExact.results[0]?.record : undefined;
      const bridge = correctedRecord
        ? readers.bridgeByProblem({ problem: correctedRecord.problem })
        : { ok: false, status: 'DANGLING_REFERENCE', results: [] };
      const bridgedResult = bridge.ok ? bridge.results.find((r) => r.experience_id === correctedId) : undefined;
      forcedReads.push({
        experience_id: hit.experience_id,
        lesson: hit.lesson,
        // Existing fields only, exposed so functional_status/state fields are
        // never treated as one global fact independent of which goal_id they
        // are scoped to. The one authoritative CURRENT pointer status remains
        // the guard result from checkPointerCurrencyNow() above -- never
        // inferred or ranked from Experience result/status fields.
        goal_id: hit.context?.goal_id ?? null,
        decision_summary: hit.decision?.decision_summary ?? null,
        corrects_experience_id: correctedId,
        corrects_experience_id_reverified: correctedExact.ok && correctedExact.results.length === 1,
        original_evidence_bridge_status: bridge.status,
        original_evidence_resolved: bridgedResult
          ? bridgedResult.history.filter((h) => h.resolved !== false).map((h) => ({ ref: h.ref, sha256: h.sha256 }))
          : [],
      });
    }
  }
  return { contradiction_detected: true, pointer_check: check, forced_reads: forcedReads };
}
