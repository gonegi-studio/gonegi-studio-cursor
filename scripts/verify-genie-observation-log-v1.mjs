// Minimal self-test for the GENIE Observation Log. Deliberately not a CR-01..17
// canonical contract -- this only checks the module's own read/write/find
// behavior and that it stays fully separate from the canonical Experience
// system (never touches index-v8.json or the coordinator contract's inputs).
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appendObservation,
  readObservations,
  findRelatedObservations,
  OBSERVATION_LOG_PATH,
} from '../services/genieObservationLog.mjs';

// Isolated scratch root: never writes into the real repo during this test.
const scratchRoot = mkdtempSync(join(tmpdir(), 'genie-observation-log-test-'));

try {
  assert.deepEqual(readObservations(scratchRoot), [], 'Empty log must read as []');

  assert.throws(() => appendObservation({ finding: 'x', disposition: 'resolved_no_action' }, scratchRoot),
    /OBSERVATION_CONTEXT_REQUIRED/);
  assert.throws(() => appendObservation({ context: 'x', disposition: 'resolved_no_action' }, scratchRoot),
    /OBSERVATION_FINDING_REQUIRED/);
  assert.throws(() => appendObservation({ context: 'x', finding: 'y', disposition: 'not_a_real_value' }, scratchRoot),
    /OBSERVATION_DISPOSITION_INVALID/);
  assert.throws(() => appendObservation({ context: 'x', finding: 'y', disposition: 'resolved_no_action', related_refs: [1] }, scratchRoot),
    /OBSERVATION_RELATED_REFS_INVALID/);

  const first = appendObservation({
    context: 'verify:legacy-knowledge-harvest FAIL scan candidate',
    finding: 'OUTPUT MISSING was purely cascading from 2 stale prechecks (app-consumption, legacy-coverage); rebuilding both resolved the whole chain with zero real gap.',
    disposition: 'resolved_no_action',
    related_refs: ['scripts/verify-legacy-knowledge-harvest.ts', 'services/legacyKnowledgeHarvest.ts'],
  }, scratchRoot);
  assert.ok(typeof first.observed_at === 'string' && first.observed_at.endsWith('Z'));

  appendObservation({
    context: 'verify:movie-analysis-image-app-certification BRIDGE_REPORT_MISSING candidate',
    finding: 'Upstream chain (bridge -> production-ready-certification -> final-release-audit -> dna-master-certification) expands 4+ levels with no confirmed terminus.',
    disposition: 'expanding_scope_hold',
    related_refs: ['scripts/verify-movie-analysis-image-app-certification.ts'],
  }, scratchRoot);

  const all = readObservations(scratchRoot);
  assert.equal(all.length, 2, 'Both appended observations must be readable back');
  assert.equal(all[0].disposition, 'resolved_no_action');
  assert.equal(all[1].disposition, 'expanding_scope_hold');

  // JSONL format: exactly one JSON object per line, append-only (no rewrite).
  const raw = readFileSync(join(scratchRoot, OBSERVATION_LOG_PATH), 'utf8');
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  assert.equal(lines.length, 2);
  for (const line of lines) assert.doesNotThrow(() => JSON.parse(line));

  const harvestMatches = findRelatedObservations('legacy-knowledge-harvest', scratchRoot);
  assert.equal(harvestMatches.length, 1);
  assert.equal(harvestMatches[0].disposition, 'resolved_no_action');

  const bridgeMatches = findRelatedObservations('image-app-certification', scratchRoot);
  assert.equal(bridgeMatches.length, 1);
  assert.equal(bridgeMatches[0].disposition, 'expanding_scope_hold');

  assert.deepEqual(findRelatedObservations('no-such-candidate-anywhere', scratchRoot), []);
  assert.deepEqual(findRelatedObservations('', scratchRoot), [], 'Empty query must not match everything');

  // Separation guarantee: this module must never reference or write the
  // canonical Experience/index files.
  const moduleSource = readFileSync(new URL('../services/genieObservationLog.mjs', import.meta.url), 'utf8');
  assert.ok(!moduleSource.includes('experience-index-v8'), 'Must not touch the canonical index');
  assert.ok(!moduleSource.includes('story_scenario_intelligence'), 'Must not write into the canonical Experience directory');

  console.log(JSON.stringify({
    verdict: 'GENIE_OBSERVATION_LOG_V1_SELFTEST_PASS',
    checks_run: 13,
    log_path: OBSERVATION_LOG_PATH,
    dispositions_validated: ['resolved_no_action', 'expanding_scope_hold', 'invalid-rejected'],
    canonical_system_untouched: true,
  }, null, 2));
} finally {
  rmSync(scratchRoot, { recursive: true, force: true });
}
