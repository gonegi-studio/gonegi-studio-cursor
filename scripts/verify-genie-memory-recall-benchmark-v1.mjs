// GENIE Memory Recall Benchmark V1 -- fixed regression test.
//
// This is the exact 16-event natural-language recall benchmark from
// "GENIE Historical Memory Bootstrap Assessment V1" (2026-09-04), promoted
// to a permanent, fixed regression test per "GENIE Retrieval Reliability
// Repair V1". The 16 QUERIES are fixed; each one's expect: 'FIND'/'EMPTY'
// classification is a snapshot of ground truth and is meant to be updated
// -- honestly, with a note explaining why -- when real work legitimately
// changes that truth (e.g. a query correctly flips EMPTY->FIND once the
// event it asks about is genuinely captured as memory; that is a successful
// outcome, not a regression). What must NEVER happen without investigation
// is a query returning the WRONG record, or an EMPTY case matching
// something irrelevant -- that is what "regression" means here. As of
// "GENIE Historical Memory Bootstrap Pilot V1" (2026-09-04): 13 cases are
// real events with real memory (Experience, backfilled Observation, or a
// verified Historical Observation restoration) and 3 remain true negatives
// (a real event with genuinely no memory tier covering it yet, an event
// that never happened, or a category with no accessible evidence). Do NOT
// add cases with fabricated/synthetic content; only real, verified events
// belong here.
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
  { q: 'PR-01 ProductionOS v83 types scaffold', expect: 'FIND', mustIncludeContext: '182c275c', note: 'FLIPPED 2026-09-04 by "GENIE Historical Memory Bootstrap Pilot V1": commit 182c275c genuinely restored as a verified Historical Observation (git show --stat evidence). Was EMPTY before this restoration. mustIncludeContext uses the commit hash (a stable identifier this task controls directly) rather than an ordinal position like "pilot, 1/5", which would break if entries are ever renumbered or a later batch re-describes the same commit.' },
  { q: 'GPU conditioning validation phase 007C', expect: 'FIND', mustIncludeContext: '3f186ba', note: 'FLIPPED 2026-09-04: commit 3f186ba genuinely restored (partially -- 2959-file commit honestly scoped to only its verified panEnergy-origin connection). Was EMPTY before this restoration.' },
  { q: 'PBRP scenario composition intelligence AI Studio ready scenario output', expect: 'FIND', mustIncludeContext: '4236b933', note: 'FLIPPED 2026-09-04, RE-ATTRIBUTED 2026-09-04 by "GENIE Historical Memory Bootstrap Batch 1 V1": this query\'s exact phrase "AI Studio Ready Scenario Output" is the literal, verbatim title of commit 4236b933 (PHASE-PBRP-SCENARIO-COMPOSITION-INTELLIGENCE-005) -- confirmed via direct string-containment check against both records\' stored context. It does NOT appear in commit 5cb9067d\'s (PHASE-002) title. During the pilot, only 5cb9067d was restored, so the query matched it by coincidental shared PBRP/scenario/AI-Studio vocabulary, not by real title correspondence; this was an imprecise original expectation on the benchmark author\'s part, not a retrieval defect. Restoring the actual, correctly-titled source (4236b933) in this batch let retrieval correctly redirect to it -- a real accuracy improvement, not a regression.' },
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
