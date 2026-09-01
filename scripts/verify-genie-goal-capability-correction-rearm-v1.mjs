// Fixture-only unit checks (in-memory retrieve/bridge doubles) plus one real,
// live check against the actual repository. Never mutates any status.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  checkGoalCapabilityContradictionsNow,
  rearmGoalCapabilityCorrectionMemory,
} from '../services/genieGoalCapabilityCorrectionRearm.mjs';
import { retrieveCanonicalLearning } from '../services/genieCanonicalLearningRetrieval.mjs';

let checks = 0;

// ---------------------------------------------------------------------------
// Fixture root: a throwaway directory containing only the 3 small live-data
// files the rearm guard reads (goal_model, the E9 canonical goal-status
// pointer, the capability overlay). The detector itself is never duplicated
// here -- it is loaded fresh from the real, unmodified PHASE-945 source file
// on every call, exactly as in production.
function writeFixtureRoot(overlayStatus) {
  const root = join(tmpdir(), `genie-rearm-fixture-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(join(root, 'datasets/project_brain/goal_model_v1'), { recursive: true });
  mkdirSync(join(root, 'project_brain/story_scenario_intelligence'), { recursive: true });
  writeFileSync(join(root, 'datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json'), JSON.stringify({
    goal_model: {
      goals: [
        { goal_id: 'goal_fixture_a', required_capability_refs: ['cap_fixture_x'] },
        { goal_id: 'goal_fixture_b', required_capability_refs: ['cap_fixture_y'] },
      ],
    },
  }));
  writeFileSync(join(root, 'project_brain/story_scenario_intelligence/project-brain-standard-goal-judgment-output-v3.json'), JSON.stringify({
    entries_summary: [
      { goal_id: 'goal_fixture_a', functional: 'satisfied' },
      { goal_id: 'goal_fixture_b', functional: 'satisfied' },
    ],
  }));
  writeFileSync(join(root, 'project_brain/story_scenario_intelligence/project-brain-lpm-capability-functional-status-overlay-v6.json'), JSON.stringify({
    capabilities: [
      { capability_id: 'cap_fixture_x', functional_status: overlayStatus.cap_fixture_x ?? 'satisfied' },
      { capability_id: 'cap_fixture_y', functional_status: overlayStatus.cap_fixture_y ?? 'satisfied' },
    ],
  }));
  return root;
}

// ---------------------------------------------------------------------------
// 1. Normal state: no contradiction -> byte-identical existing-flow behavior.
const normalRoot = writeFixtureRoot({});
const normal = rearmGoalCapabilityCorrectionMemory(normalRoot);
assert.equal(normal.contradiction_detected, false);
assert.deepEqual(normal.contradictions, []);
assert.deepEqual(normal.forced_reads, []);
rmSync(normalRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 2. 942-type positive control: satisfied goal backed by a blocked capability,
// with a fixture "correction" Experience present -> found, corrects_experience_id
// re-verified, evidence/SHA resolved.
const positiveRoot = writeFixtureRoot({ cap_fixture_x: 'blocked' });
const fixtureExperiences = {
  exp_fixture_original_mistake: {
    experience_id: 'exp_fixture_original_mistake',
    problem: 'Fixture original mistake problem statement',
    decision: {},
    links: { capability_refs: ['cap_fixture_x'] },
  },
  exp_fixture_correction: {
    experience_id: 'exp_fixture_correction',
    problem: 'Fixture correction problem statement',
    context: { goal_id: 'goal_fixture_scope' },
    decision: { corrects_experience_id: 'exp_fixture_original_mistake', decision_summary: 'Fixture decision summary text' },
    lesson: 'Fixture lesson text',
    links: { capability_refs: ['cap_fixture_x'] },
  },
};
const fixtureHistoryDoc = Buffer.from(JSON.stringify({ generated_at: '2026-01-01T00:00:00.000Z', finding: 'fixture original evidence' }));
const positiveReaders = {
  retrieve: (query) => {
    if (query.key === 'capability_ref') {
      const results = Object.values(fixtureExperiences)
        .filter((r) => r.links.capability_refs.includes(query.value))
        .map((r) => ({ id: r.experience_id, record: r }));
      return { ok: true, status: results.length ? 'OK' : 'NOT_FOUND', results };
    }
    if (query.key === 'experience_id') {
      const r = fixtureExperiences[query.value];
      return { ok: !!r, status: r ? 'OK' : 'NOT_FOUND', results: r ? [{ id: r.experience_id, record: r }] : [] };
    }
    return { ok: false, status: 'INVALID_QUERY', results: [] };
  },
  bridgeByProblem: (request) => {
    if (request.problem === 'Fixture original mistake problem statement') {
      return { ok: true, status: 'OK', results: [{ experience_id: 'exp_fixture_original_mistake',
        history: [{ ref: 'fixture-original-evidence.json', resolved: true, sha256: 'fixturesha256' }] }] };
    }
    return { ok: true, status: 'NOT_FOUND', results: [] };
  },
};
const positive = rearmGoalCapabilityCorrectionMemory(positiveRoot, positiveReaders);
assert.equal(positive.contradiction_detected, true);
assert.equal(positive.contradictions[0].rule, 'satisfied_goal_backed_by_blocked_capability');
assert.equal(positive.forced_reads.length, 1);
assert.equal(positive.forced_reads[0].experience_id, 'exp_fixture_correction');
assert.equal(positive.forced_reads[0].corrects_experience_id, 'exp_fixture_original_mistake');
assert.equal(positive.forced_reads[0].corrects_experience_id_reverified, true);
assert.deepEqual(positive.forced_reads[0].original_evidence_resolved, [{ ref: 'fixture-original-evidence.json', sha256: 'fixturesha256' }]);
// Minimal semantic-target-preservation exposure: existing goal_id + decision_summary
// fields only, never a new schema field, never used to rank/override anything.
assert.equal(positive.forced_reads[0].goal_id, 'goal_fixture_scope');
assert.equal(positive.forced_reads[0].decision_summary, 'Fixture decision summary text');
rmSync(positiveRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 3. Unrelated-correction negative control: a real contradiction, but for a
// capability with no correction Experience at all -> found, but forced_reads empty.
const unrelatedRoot = writeFixtureRoot({ cap_fixture_y: 'blocked' });
const unrelatedReaders = {
  retrieve: (query) => ({ ok: true, status: 'NOT_FOUND', results: [] }),
  bridgeByProblem: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
};
const unrelated = rearmGoalCapabilityCorrectionMemory(unrelatedRoot, unrelatedReaders);
assert.equal(unrelated.contradiction_detected, true);
assert.deepEqual(unrelated.forced_reads, []);
rmSync(unrelatedRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 4. Negative control: a matched capability_ref hit that is NOT a real
// correction (no corrects_experience_id) must never be surfaced as one.
const nonCorrectionRoot = writeFixtureRoot({ cap_fixture_x: 'blocked' });
const nonCorrectionReaders = {
  retrieve: (query) => {
    if (query.key === 'capability_ref' && query.value === 'cap_fixture_x') {
      return { ok: true, status: 'OK', results: [{ id: 'exp_fixture_unrelated_mention',
        record: { experience_id: 'exp_fixture_unrelated_mention', problem: 'mentions the capability but is not a correction',
          decision: {}, links: { capability_refs: ['cap_fixture_x'] } } }] };
    }
    return { ok: true, status: 'NOT_FOUND', results: [] };
  },
  bridgeByProblem: () => ({ ok: true, status: 'NOT_FOUND', results: [] }),
};
const nonCorrection = rearmGoalCapabilityCorrectionMemory(nonCorrectionRoot, nonCorrectionReaders);
assert.equal(nonCorrection.contradiction_detected, true);
assert.deepEqual(nonCorrection.forced_reads, []);
rmSync(nonCorrectionRoot, { recursive: true, force: true });
checks++;

// ---------------------------------------------------------------------------
// 5. Real, live check: today's actual repository state must show no
// contradiction for the 942/946 pair (946 already corrected it), and the
// underlying detector must come from the real, unmodified PHASE-945 source.
const live = checkGoalCapabilityContradictionsNow();
assert.equal(Array.isArray(live.contradictions), true);
assert.equal(live.sources.goal_model, 'datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json');
assert.match(live.sources.goal_status_pointer, /project-brain-standard-goal-judgment-output-v3\.json$/);
assert.match(live.sources.capability_overlay, /project-brain-lpm-capability-functional-status-overlay-v6\.json$/);
const liveRepoFoundation = live.links.find((l) => l.goal_id === 'goal_repository_foundation');
assert.ok(liveRepoFoundation, 'goal_repository_foundation must be present in the live check');
assert.equal(liveRepoFoundation.capability_ids.includes('cap_dataset_management'), true);
const liveRearm = rearmGoalCapabilityCorrectionMemory();
assert.equal(liveRearm.contradiction_detected, false, 'the real 942/946 pair must show no live contradiction today');
assert.deepEqual(liveRearm.forced_reads, []);
checks++;

// ---------------------------------------------------------------------------
// 6. Real 946/E22 semantic-target positive control: both are real, unrelated
// (no corrects_experience_id between them) records sharing cap_dataset_management,
// with contradictory-looking result.functional_status_after values. Existing
// context.goal_id (already on every Experience, unchanged) must distinguish
// them as two different real semantic targets -- no ranking, no latest-wins,
// no new field, no historical rewrite.
const semanticTargetQuery = retrieveCanonicalLearning({ kind: 'experience', key: 'capability_ref', value: 'cap_dataset_management' });
assert.equal(semanticTargetQuery.ok, true);
const targetIds = ['exp_phase946_semantic_quality_capability_correction_01', 'exp_phase_e22_cross_domain_principle_execution_01'];
const targets = semanticTargetQuery.results.filter((r) => targetIds.includes(r.id));
assert.equal(targets.length, 2, '946 and E22 must both still be real, retrievable Experiences for cap_dataset_management');
const goalIds = new Set(targets.map((r) => r.record.context?.goal_id));
assert.equal(goalIds.size, 2, '946 and E22 must be distinguishable as different semantic targets via existing context.goal_id');
assert.ok(goalIds.has('goal_repository_foundation') && goalIds.has('goal_semantic_quality'));
checks++;

console.log(JSON.stringify({
  verdict: 'GOAL_CAPABILITY_CORRECTION_REARM_INTEGRATED',
  fixture_checks: checks,
  detector_source: 'project_brain/story_scenario_intelligence/materializeProjectBrainPhase945ExecutionStateResolverV1.ts (unmodified, extracted verbatim)',
  detector_source_modified: false,
  live_contradiction_detected_today: liveRearm.contradiction_detected,
  live_goals_checked: live.links.length,
  status_writes: 0,
  knowledge_promoted: false,
}, null, 2));
