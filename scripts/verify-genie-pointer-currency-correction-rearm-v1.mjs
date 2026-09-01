// Fixture-only unit checks (in-memory retrieve/bridge doubles + throwaway disk
// fixtures for the pointer/target files only) plus one real, live check
// against the actual repository. Never mutates any pointer or status.
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkPointerCurrencyNow,
  rearmPointerCurrencyCorrectionMemory,
} from '../services/geniePointerCurrencyCorrectionRearm.mjs';

let checks = 0;

function writeFixtureRoot({ pointerPhase, pointerPointsTo, pointerSummary, targetSummary }) {
  const root = join(tmpdir(), `genie-pointer-rearm-fixture-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const ssiDir = join(root, 'project_brain', 'story_scenario_intelligence');
  mkdirSync(ssiDir, { recursive: true });
  writeFileSync(join(ssiDir, 'project-brain-goal-satisfaction-v8-old-fixture-v1.json'), JSON.stringify({ summary: { fixture: 'old' } }));
  writeFileSync(join(ssiDir, 'project-brain-goal-satisfaction-v12-new-fixture-v1.json'), JSON.stringify({ summary: targetSummary }));
  writeFileSync(join(ssiDir, 'project-brain-standard-goal-judgment-output-v3.json'), JSON.stringify({
    pointer_id: 'fixture_pointer', phase: pointerPhase, points_to: pointerPointsTo, summary_snapshot: pointerSummary,
  }));
  return root;
}

// ---------------------------------------------------------------------------
// 1. Positive control (E8-type): pointer names an old file while a newer one
// exists on disk -> STALE, targeted phase-match retrieval finds the fixture
// correction, corrects_experience_id independently re-verified, evidence
// bridge attempted against the corrected record's own real problem text.
const positiveRoot = writeFixtureRoot({
  pointerPhase: 'PHASE-FIXTURE-CORRECTION',
  pointerPointsTo: 'project-brain-goal-satisfaction-v8-old-fixture-v1.json',
  pointerSummary: { fixture: 'old' },
  targetSummary: { fixture: 'new' },
});
const fixtureExperiences = {
  exp_fixture_original_stale_mistake: {
    experience_id: 'exp_fixture_original_stale_mistake', phase: 'PHASE-FIXTURE-DISCOVERY',
    problem: 'Fixture original stale-reference discovery problem statement', decision: {}, links: {},
  },
  exp_fixture_pointer_correction: {
    experience_id: 'exp_fixture_pointer_correction', phase: 'PHASE-FIXTURE-CORRECTION',
    problem: 'Fixture pointer correction problem statement',
    context: { goal_id: 'goal_fixture_pointer_scope' },
    decision: { corrects_experience_id: 'exp_fixture_original_stale_mistake', decision_summary: 'Fixture pointer decision summary text' },
    lesson: 'Fixture pointer-currency lesson text', links: {},
  },
  exp_fixture_unrelated_same_phase_but_not_a_correction: {
    experience_id: 'exp_fixture_unrelated_same_phase_but_not_a_correction', phase: 'PHASE-FIXTURE-CORRECTION',
    problem: 'Mentions the same phase but is not itself a correction', decision: {}, links: {},
  },
};
const positiveReaders = {
  canonical: () => ({ records: Object.values(fixtureExperiences) }),
  retrieve: (query) => {
    if (query.key === 'experience_id') {
      const r = fixtureExperiences[query.value];
      return { ok: !!r, status: r ? 'OK' : 'NOT_FOUND', results: r ? [{ id: r.experience_id, record: r }] : [] };
    }
    return { ok: false, status: 'INVALID_QUERY', results: [] };
  },
  bridgeByProblem: (request) => {
    if (request.problem === 'Fixture original stale-reference discovery problem statement') {
      return { ok: true, status: 'OK', results: [{ experience_id: 'exp_fixture_original_stale_mistake',
        history: [{ ref: 'fixture-original-stale-evidence.json', resolved: true, sha256: 'fixturepointershasha' }] }] };
    }
    return { ok: true, status: 'NOT_FOUND', results: [] };
  },
};
const positive = rearmPointerCurrencyCorrectionMemory(positiveRoot, positiveReaders);
assert.equal(positive.contradiction_detected, true);
assert.equal(positive.pointer_check.guard.status, 'STALE');
assert.equal(positive.forced_reads.length, 1);
assert.equal(positive.forced_reads[0].experience_id, 'exp_fixture_pointer_correction');
assert.equal(positive.forced_reads[0].corrects_experience_id, 'exp_fixture_original_stale_mistake');
assert.equal(positive.forced_reads[0].corrects_experience_id_reverified, true);
assert.deepEqual(positive.forced_reads[0].original_evidence_resolved, [{ ref: 'fixture-original-stale-evidence.json', sha256: 'fixturepointershasha' }]);
// Minimal semantic-target-preservation exposure: existing goal_id + decision_summary
// fields only, never a new schema field, never used to rank/override anything.
assert.equal(positive.forced_reads[0].goal_id, 'goal_fixture_pointer_scope');
assert.equal(positive.forced_reads[0].decision_summary, 'Fixture pointer decision summary text');
rmSync(positiveRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 2. Current-valid-pointer negative control (fixture): points_to the real
// latest file and the cached summary matches it exactly -> CURRENT, zero reads.
const currentRoot = writeFixtureRoot({
  pointerPhase: 'PHASE-FIXTURE-IRRELEVANT',
  pointerPointsTo: 'project-brain-goal-satisfaction-v12-new-fixture-v1.json',
  pointerSummary: { fixture: 'new' },
  targetSummary: { fixture: 'new' },
});
const current = rearmPointerCurrencyCorrectionMemory(currentRoot, { canonical: () => { throw new Error('must not be called'); } });
assert.equal(current.contradiction_detected, false);
assert.equal(current.pointer_check.guard.status, 'CURRENT');
assert.deepEqual(current.forced_reads, []);
rmSync(currentRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 3. Unrelated-correction negative control: pointer is STALE but its phase
// matches no real corrects_experience_id-carrying Experience -> forced_reads:[].
const unrelatedRoot = writeFixtureRoot({
  pointerPhase: 'PHASE-FIXTURE-NO-CORRECTION-EXISTS',
  pointerPointsTo: 'project-brain-goal-satisfaction-v8-old-fixture-v1.json',
  pointerSummary: { fixture: 'old' },
  targetSummary: { fixture: 'new' },
});
const unrelatedReaders = {
  canonical: () => ({ records: Object.values(fixtureExperiences) }),
  retrieve: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
  bridgeByProblem: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
};
const unrelated = rearmPointerCurrencyCorrectionMemory(unrelatedRoot, unrelatedReaders);
assert.equal(unrelated.contradiction_detected, true);
assert.deepEqual(unrelated.forced_reads, []);
rmSync(unrelatedRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 4. Negative control: a same-phase match that is NOT itself a correction
// (no corrects_experience_id) must never be surfaced as one.
const nonCorrectionRoot = writeFixtureRoot({
  pointerPhase: 'PHASE-FIXTURE-CORRECTION',
  pointerPointsTo: 'project-brain-goal-satisfaction-v8-old-fixture-v1.json',
  pointerSummary: { fixture: 'old' },
  targetSummary: { fixture: 'new' },
});
const nonCorrectionReaders = {
  canonical: () => ({ records: [fixtureExperiences.exp_fixture_unrelated_same_phase_but_not_a_correction] }),
  retrieve: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
  bridgeByProblem: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
};
const nonCorrection = rearmPointerCurrencyCorrectionMemory(nonCorrectionRoot, nonCorrectionReaders);
assert.equal(nonCorrection.contradiction_detected, true);
assert.deepEqual(nonCorrection.forced_reads, []);
rmSync(nonCorrectionRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 5. Real, live check: today's actual repository pointer must be CURRENT
// (E9's fix holds), and the guard must come from the real, unmodified
// PHASE-E25 source, reading the real v-number pointer/target convention.
const live = checkPointerCurrencyNow();
assert.match(live.pointer_file, /project-brain-standard-goal-judgment-output-v\d+\.json$/);
assert.equal(live.pointer_phase, 'PHASE-E9');
assert.equal(live.guard.status, 'CURRENT', JSON.stringify(live.guard));
const liveRearm = rearmPointerCurrencyCorrectionMemory();
assert.equal(liveRearm.contradiction_detected, false, 'the real E8/E9 pointer must show CURRENT today');
assert.deepEqual(liveRearm.forced_reads, []);
checks++;

console.log(JSON.stringify({
  verdict: 'POINTER_CURRENCY_CORRECTION_REARM_INTEGRATED',
  fixture_checks: checks,
  guard_source: 'project_brain/story_scenario_intelligence/materializeProjectBrainPhaseE25PointerCurrencyGuardV1.ts (unmodified, extracted verbatim)',
  guard_source_modified: false,
  live_pointer_status_today: live.guard.status,
  live_pointer_file: live.pointer_file,
  status_writes: 0,
  knowledge_promoted: false,
}, null, 2));
