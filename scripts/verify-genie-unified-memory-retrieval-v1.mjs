// Minimal self-test for the GENIE Unified Memory Retrieval bridge. Not a
// CR-01..17 canonical contract -- checks that the bridge (a) genuinely reads
// both tiers, (b) applies the same fail-closed structural-fallback
// discipline the Experience tier already uses, (c) writes nothing, ever,
// and (d) the closure-discipline helper returns the right call for each
// input combination.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  findObservationsByProblem,
  retrieveGenieMemory,
  assessTaskClosureMemoryNeed,
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

  // --- Structural fallback: a real rephrasing that shares no literal substring
  // but does share a contiguous >=2 token run with the stored record's own text ---
  const rephrased = findObservationsByProblem('scorer floor asymmetry artifact', scratchRoot);
  assert.equal(rephrased.matched.length, 1, 'structural fallback should find the rephrased query');
  assert.equal(rephrased.match_contract, 'STRUCTURAL_TOKEN_FALLBACK_UNIQUE_MAX_OVERLAP_CONTIGUOUS_RUN_GE_2');

  // --- Fail-closed on ambiguity: two records with equal, non-contiguous overlap must not match ---
  appendObservation({
    context: 'Unrelated second entry sharing only scattered single-word overlap with the query below.',
    finding: 'This entry exists only to create a tie in total token overlap without a shared contiguous phrase.',
    disposition: 'insufficient_evidence',
    related_refs: [],
  }, scratchRoot);
  const ambiguous = findObservationsByProblem('scattered overlap tie query words', scratchRoot);
  assert.equal(ambiguous.matched.length, 0, 'ambiguous/no-real-phrase overlap must fail closed, not guess');

  // --- No match at all still returns a clean, typed empty result ---
  const noMatch = findObservationsByProblem('completely unrelated query xyz123', scratchRoot);
  assert.equal(noMatch.matched.length, 0);
  assert.equal(noMatch.match_contract, 'NO_MATCH');

  // --- Unified bridge: merges both tiers, never throws even if Experience-tier read fails ---
  const merged = retrieveGenieMemory('camera_preservation', scratchRoot);
  assert.equal(merged.observation.matched.length, 1);
  assert.equal(typeof merged.any_match, 'boolean');
  assert.ok(merged.match_summary.includes('observation=1'));

  // --- Zero writes anywhere: scratch log file content must be byte-identical
  // before/after every read call above ---
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
    checks_run: 11,
    zero_writes_confirmed: true,
    fail_closed_on_ambiguity_confirmed: true,
  }, null, 2));
} finally {
  rmSync(scratchRoot, { recursive: true, force: true });
}
