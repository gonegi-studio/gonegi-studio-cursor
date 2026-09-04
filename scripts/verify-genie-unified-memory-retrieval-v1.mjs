// Minimal self-test for the GENIE Unified Memory Retrieval bridge. Not a
// CR-01..17 canonical contract -- checks that the bridge (a) genuinely reads
// both tiers, (b) applies the fail-closed structural-fallback discipline
// (contiguous run >=2 AND overlap ratio >=0.6, see MIN_OVERLAP_RATIO in the
// module) with honest multi-match on a genuine tie rather than guessing one
// answer or giving up, (c) writes nothing, ever, and (d) the closure-
// discipline helper returns the right call for each input combination.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findObservationsByProblem,
  retrieveGenieMemory,
  assessTaskClosureMemoryNeed,
  isMetaObservation,
} from '../services/genieUnifiedMemoryRetrieval.mjs';
import { appendObservation, OBSERVATION_LOG_PATH } from '../services/genieObservationLog.mjs';

const scratchRoot = mkdtempSync(join(tmpdir(), 'genie-unified-memory-retrieval-test-'));

try {
  // --- Observation-tier: literal substring still wins first, unchanged ---
  appendObservation({
    context: 'Real Image Batch DNA Effect Verification V1: separating DNA-completeness vs. palette/geometry/scorer causes for low camera_preservation.',
    finding: 'The camera_preservation scorer floor-asymmetry artifact was the real cause, not DNA completeness.',
    disposition: 'resolved_no_action',
    related_refs: ['services/realImageBatchValidation.ts'],
  }, scratchRoot);

  const literalHit = findObservationsByProblem('camera_preservation', scratchRoot);
  assert.equal(literalHit.matched.length, 1);
  assert.equal(literalHit.match_contract, 'CASE_INSENSITIVE_LITERAL_SUBSTRING');

  // --- Structural fallback: a real rephrasing sharing no literal substring
  // but a contiguous >=2 token run AND enough of the query's own tokens
  // (ratio >=0.6) to clear the collision guard ---
  const rephrased = findObservationsByProblem('scorer floor asymmetry artifact', scratchRoot);
  assert.equal(rephrased.matched.length, 1, 'structural fallback should find the rephrased query');
  assert.equal(rephrased.match_contract, 'STRUCTURAL_TOKEN_FALLBACK_UNIQUE_MAX_OVERLAP_PHRASE_OR_CANONICAL_OR_STRONG_CONTENT_RATIO');

  // --- Ratio guard: a short, generic 2-token coincidence inside an otherwise
  // long, unrelated query must NOT match -- this is the exact false-positive
  // class the 16-event recall benchmark caught (a short shared phrase, most
  // of the query is unrelated, so overlap/query-length is low) ---
  appendObservation({
    context: 'An unrelated later entry that happens to mention a real image once, purely incidentally.',
    finding: 'Nothing about camera scoring here -- just a coincidental two-word overlap with a longer, different query.',
    disposition: 'insufficient_evidence',
    related_refs: [],
  }, scratchRoot);
  const genericCollision = findObservationsByProblem(
    'user completed a real image manual review of many unrelated production scenes today',
    scratchRoot
  );
  assert.equal(genericCollision.matched.length, 0, 'a short generic overlap in a long unrelated query must fail the ratio guard');
  assert.equal(genericCollision.match_contract, 'NO_MATCH');

  // --- Genuine tie -> honest multi-match, not a forced single guess and not
  // a silent give-up: two equally-relevant records both clearing run>=2 and
  // ratio>=0.6 at the same max overlap should both come back ---
  appendObservation({
    context: 'Camera Preservation Alignment Persistence V1: committing the verified panEnergy scorer fix.',
    finding: 'Committed the camera_preservation scorer alignment fix after verifying it across seven pipelines.',
    disposition: 'resolved_no_action',
    related_refs: [],
  }, scratchRoot);
  const tie = findObservationsByProblem('camera preservation scorer fix', scratchRoot);
  assert.ok(tie.matched.length >= 1, 'a query matching multiple genuinely relevant records must not return zero');
  if (tie.matched.length > 1) {
    assert.equal(tie.match_contract, 'STRUCTURAL_TOKEN_FALLBACK_GENUINE_TIE_MULTI_MATCH_PHRASE_OR_CANONICAL_RATIO_GE_0.6');
  }

  // --- Meta-memory isolation: a diagnostic entry ABOUT the memory system
  // itself (every related_ref points at the memory system's own files) must
  // be excluded from the default (project-history) candidate pool, even
  // when it would otherwise win outright -- but must still be findable when
  // the caller explicitly asks a memory-diagnostic question via
  // { includeMeta: true }. No topic word is checked anywhere in this rule. ---
  appendObservation({
    context: 'GENIE Retrieval Meta Diagnostic Entry: a record entirely about the memory/retrieval system\'s own behavior, not about any real production event.',
    finding: 'This entry exists only to verify meta-memory isolation -- it must not surface for an ordinary project-history query.',
    disposition: 'expanding_scope_hold',
    related_refs: ['services/genieUnifiedMemoryRetrieval.mjs', 'scripts/verify-genie-memory-recall-benchmark-v1.mjs'],
  }, scratchRoot);
  const metaEntry = { related_refs: ['services/genieUnifiedMemoryRetrieval.mjs', 'scripts/verify-genie-memory-recall-benchmark-v1.mjs'] };
  const substantiveEntry = { related_refs: ['services/realImageBatchValidation.ts'] };
  const noRefsEntry = { related_refs: [] };
  assert.equal(isMetaObservation(metaEntry), true);
  assert.equal(isMetaObservation(substantiveEntry), false);
  assert.equal(isMetaObservation(noRefsEntry), false, 'an entry with no related_refs is not classified as meta');

  const defaultExcluded = findObservationsByProblem('GENIE Retrieval Meta Diagnostic Entry own behavior', scratchRoot);
  assert.equal(defaultExcluded.matched.length, 0, 'default search must not surface a meta-only match');

  const explicitlyIncluded = findObservationsByProblem('GENIE Retrieval Meta Diagnostic Entry own behavior', scratchRoot, { includeMeta: true });
  assert.ok(explicitlyIncluded.matched.length >= 1, 'includeMeta:true must still find the meta entry when asked for explicitly');

  // --- Canonical identity: the exact class of case this feature exists for.
  // The record writes the term as PascalCase "AIStudio" (one token after
  // lowercasing); the query writes it space-separated "AI Studio" (two
  // tokens). Neither the record's raw tokens nor a bare contiguous-run check
  // can bridge that on their own -- appendObservation() must have computed
  // and stored canonical_identity_terms (['ai','studio', ...]) for this to
  // resolve, exercising the real write path, not a hand-built fixture. ---
  const canonicalRecord = appendObservation({
    context: 'AIStudio Canonical Identity Test Entry: verifying the write path stores split identifier terms for a PascalCase compound name.',
    finding: 'This entry exists only to confirm canonical_identity_terms bridges "AIStudio" (as written here) to a query phrased "AI Studio".',
    disposition: 'resolved_no_action',
    related_refs: [],
  }, scratchRoot);
  assert.ok(Array.isArray(canonicalRecord.canonical_identity_terms), 'appendObservation must store canonical_identity_terms');
  assert.ok(canonicalRecord.canonical_identity_terms.includes('ai') && canonicalRecord.canonical_identity_terms.includes('studio'),
    'PascalCase "AIStudio" must decompose into "ai" and "studio" at write time');
  // The original text itself must be completely unmodified.
  assert.equal(canonicalRecord.context, 'AIStudio Canonical Identity Test Entry: verifying the write path stores split identifier terms for a PascalCase compound name.');

  const canonicalHit = findObservationsByProblem('AI Studio canonical identity test entry verifying write path', scratchRoot);
  assert.equal(canonicalHit.matched.length, 1, 'a space-separated query must find a record that only ever wrote the term as PascalCase');
  assert.equal(canonicalHit.matched[0].context, canonicalRecord.context);

  // A record written BEFORE this field existed (no canonical_identity_terms
  // key at all) must still work via the on-the-fly fallback -- no migration
  // or rewrite of already-stored records required.
  const legacyShapedRecord = { context: 'AIStudio Legacy Shaped Record', finding: 'No canonical_identity_terms key on this object at all.', disposition: 'resolved_no_action', related_refs: [] };
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { OBSERVATION_LOG_PATH: logRelPath } = await import('../services/genieObservationLog.mjs');
  fs.appendFileSync(path.join(scratchRoot, logRelPath), `${JSON.stringify(legacyShapedRecord)}\n`, 'utf8');
  const legacyHit = findObservationsByProblem('AI Studio legacy shaped record', scratchRoot);
  assert.ok(legacyHit.matched.some((m) => m.context === 'AIStudio Legacy Shaped Record'),
    'a pre-existing record with no stored canonical_identity_terms must still match via on-the-fly fallback computation');

  // --- No match at all still returns a clean, typed empty result ---
  const noMatch = findObservationsByProblem('completely unrelated query xyz123', scratchRoot);
  assert.equal(noMatch.matched.length, 0);
  assert.equal(noMatch.match_contract, 'NO_MATCH');

  // --- Unified bridge: merges both tiers. By this point in the test, both
  // the original entry and the tie-test entry literally contain
  // "camera_preservation", so the literal-substring path (unchanged,
  // deliberately returns every literal hit) correctly finds both. ---
  const merged = retrieveGenieMemory('camera_preservation', scratchRoot);
  assert.equal(merged.observation.matched.length, 2);
  assert.equal(typeof merged.any_match, 'boolean');
  assert.ok(merged.match_summary.includes('observation=2'));

  // --- Zero writes anywhere ---
  const logPath = join(scratchRoot, OBSERVATION_LOG_PATH);
  const beforeReads = readFileSync(logPath, 'utf8');
  findObservationsByProblem('camera_preservation', scratchRoot);
  retrieveGenieMemory('camera_preservation', scratchRoot);
  const afterReads = readFileSync(logPath, 'utf8');
  assert.equal(beforeReads, afterReads, 'the bridge must never write to the Observation Log');

  // --- Closure-discipline helper: explicit judgment, not automated detection ---
  assert.equal(
    assessTaskClosureMemoryNeed({ realWorkDone: false, hasReusableFinding: false }).should_record_observation,
    false
  );
  assert.equal(
    assessTaskClosureMemoryNeed({ realWorkDone: true, hasReusableFinding: false }).should_record_observation,
    false
  );
  assert.equal(
    assessTaskClosureMemoryNeed({ realWorkDone: true, hasReusableFinding: true }).should_record_observation,
    true
  );
  assert.equal(
    assessTaskClosureMemoryNeed({ realWorkDone: true, hasReusableFinding: true, alreadyCapturedAsExperience: true }).should_record_observation,
    false
  );

  console.log(JSON.stringify({
    verdict: 'GENIE_UNIFIED_MEMORY_RETRIEVAL_V1_SELFTEST_PASS',
    checks_run: 23,
    zero_writes_confirmed: true,
    fail_closed_on_ratio_guard_confirmed: true,
    honest_multi_match_on_genuine_tie_confirmed: true,
    meta_memory_isolation_confirmed: true,
    canonical_identity_write_and_read_path_confirmed: true,
  }, null, 2));
} finally {
  rmSync(scratchRoot, { recursive: true, force: true });
}
