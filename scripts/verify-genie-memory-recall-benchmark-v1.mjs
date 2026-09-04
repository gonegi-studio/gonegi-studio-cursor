// GENIE Memory Recall Benchmark V1 -- fixed regression test.
//
// This is the exact 16-event natural-language recall benchmark from
// "GENIE Historical Memory Bootstrap Assessment V1" (2026-09-04), promoted
// to a permanent, fixed regression test per "GENIE Retrieval Reliability
// Repair V1". Every case is a REAL event: 10 that real memory exists for
// (either an Experience or a backfilled Observation) and 6 that are true
// negatives (real events with no memory recorded yet -- pre-08-15 commits,
// events that never happened, or categories with no accessible evidence).
// Do NOT add cases with fabricated/synthetic content; only real, verified
// events belong here. This benchmark is the pass/fail bar for any future
// change to services/genieUnifiedMemoryRetrieval.mjs or the Observation
// Log's own retrieval path -- a change that regresses this file is a
// regression, full stop, regardless of what else it improves.
import { retrieveGenieMemory } from '../services/genieUnifiedMemoryRetrieval.mjs';

const CASES = [
  { q: 'did we complete a real AI Studio image generation', expect: 'FIND', mustIncludeContext: 'AIStudio First Real Generation Trial', note: 'MANDATORY: AIStudio generation completion status. Must surface the specific record whose disposition is expanding_scope_hold (correctly PENDING) -- any_match=true alone is not sufficient here; a match on an unrelated/adjacent record that happens to satisfy the token thresholds would be a false pass.' },
  { q: 'AIStudio real image generation trial input', expect: 'FIND', note: 'AIStudio trial contract derivation' },
  { q: 'camera behavior DNA production necessity', expect: 'FIND', note: 'Camera Behavior DNA HOLD/NO_REAL_GAP verdict' },
  { q: 'AIStudio real generation readiness path fix 36 out of 36', expect: 'FIND', note: 'AIStudio path repair, 36/36' },
  { q: 'camera preservation scorer semantic floor bug', expect: 'FIND', note: 'panEnergy floor-asymmetry root cause' },
  { q: 'camera composition diversity concluded limitation shinkai mori', expect: 'FIND', note: 'SHINKAI_02/MORI_04 CONCLUDED_LIMITATION' },
  { q: 'output location governance violation build export scanner', expect: 'FIND', note: 'real pre-existing Experience (exp_output_location_governance_remediation_v1)' },
  { q: 'active export count zero despite passing native import files', expect: 'FIND', note: 'real Experience captured this session via OJT' },
  { q: 'next real production task selection ai studio nexus veo', expect: 'FIND', note: 'AIStudio-App path discovery' },
  { q: 'camera preservation alignment commit decision', expect: 'FIND', note: 'commit persistence decision' },
  { q: 'numerical DNA evidence persistence grammar catalog environment motion', expect: 'EMPTY', note: 'real event, predates Observation Log existing at all' },
  { q: 'PR-01 ProductionOS v83 types scaffold', expect: 'EMPTY', note: 'real commit 2026-05-23, pre-08-15, no memory tier covers it' },
  { q: 'GPU conditioning validation phase 007C', expect: 'EMPTY', note: 'real commit 2026-06-14, origin of the panEnergy floor bug, never captured as memory' },
  { q: 'PBRP scenario composition intelligence AI Studio ready scenario output', expect: 'EMPTY', note: 'real commit 2026-08-10, direct precursor to this session\'s AIStudio work, never captured' },
  { q: 'user completed real image app manual review titanic scenes', expect: 'EMPTY', note: 'real intake/report infrastructure exists (FAIL_REAL_IMAGE_APP_MANUAL_V1) but was never actually completed' },
  { q: 'important decisions from chatgpt conversation', expect: 'EMPTY', note: 'only a connector contract/schema exists; zero real conversation content in the repo' },
];

let falseNegatives = 0;
let falsePositives = 0;
const results = [];

for (const c of CASES) {
  const r = retrieveGenieMemory(c.q);
  const found = r.any_match;
  const allMatchedContexts = [
    ...(r.experience.results ?? []).map((m) => m.problem ?? ''),
    ...r.observation.matched.map((m) => m.context ?? ''),
  ];
  const correctRecordFound = c.mustIncludeContext
    ? allMatchedContexts.some((ctx) => ctx.includes(c.mustIncludeContext))
    : true;

  let verdict;
  if (c.expect === 'FIND' && found && correctRecordFound) verdict = 'PASS';
  else if (c.expect === 'FIND' && found && !correctRecordFound) { verdict = 'FALSE_NEGATIVE_WRONG_RECORD'; falseNegatives += 1; }
  else if (c.expect === 'FIND' && !found) { verdict = 'FALSE_NEGATIVE'; falseNegatives += 1; }
  else if (c.expect === 'EMPTY' && !found) verdict = 'PASS';
  else { verdict = 'FALSE_POSITIVE'; falsePositives += 1; }
  results.push({ q: c.q, note: c.note, expect: c.expect, verdict, match_summary: r.match_summary, matched: allMatchedContexts.map((s) => s.slice(0, 50)) });
}

for (const r of results) {
  console.log(`${r.verdict.padEnd(15)} | ${r.q}`);
  if (r.verdict !== 'PASS') console.log(`  -> ${r.note} | ${r.match_summary}`);
}

const verdict = falseNegatives === 0 && falsePositives === 0
  ? 'PASS_GENIE_MEMORY_RECALL_BENCHMARK_V1'
  : 'FAIL_GENIE_MEMORY_RECALL_BENCHMARK_V1';

console.log(verdict);
console.log(JSON.stringify({
  total_cases: CASES.length,
  false_negatives: falseNegatives,
  false_positives: falsePositives,
}));

if (verdict.startsWith('FAIL')) process.exit(1);
