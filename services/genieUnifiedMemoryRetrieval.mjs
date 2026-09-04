// GENIE Unified Memory Retrieval Bridge (V1).
//
// Closes a structural blind spot found by the Memory Chain diagnostic:
// retrieveCanonicalHistoryByProblem() (genieCanonicalLearningRetrieval.mjs)
// only ever searches Experience records' `.problem` field, and
// findRelatedObservations() (genieObservationLog.mjs) only ever searches the
// Observation Log -- there was no single call that checks both tiers. A
// caller who only knew the more prominent Experience-retrieval function got
// zero signal from the Observation tier, no matter how good its entries
// were. This module does not replace either store or change their contracts;
// it only combines their existing read paths, plus adds one minimal,
// fail-closed structural fallback to the Observation side (mirroring the
// same fallback contract genieCanonicalLearningRetrieval.mjs already uses
// for Experience, so natural-language rephrasing of a stored problem has a
// real chance of matching instead of requiring near-verbatim substring
// reuse). No writes, no synthetic records, no scoring/ranking ambiguity.
import { retrieveCanonicalHistoryByProblem } from './genieCanonicalLearningRetrieval.mjs';
import { readObservations, findRelatedObservations } from './genieObservationLog.mjs';

function tokenize(value) {
  return String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** Same algorithm as genieCanonicalLearningRetrieval.mjs's private
 * longestContiguousRun -- duplicated (not imported) because that function is
 * intentionally private to the Experience-tier module; this keeps the two
 * tiers' fallback logic independently readable and auditable rather than
 * introducing a cross-module dependency for ~15 lines. */
function longestContiguousRun(queryTokens, candidateTokens) {
  let best = 0;
  for (let i = 0; i < queryTokens.length; i += 1) {
    let len = 0;
    while (i + len < queryTokens.length) {
      const window = queryTokens.slice(i, i + len + 1);
      let found = false;
      for (let j = 0; j + window.length <= candidateTokens.length; j += 1) {
        if (window.every((t, k) => candidateTokens[j + k] === t)) { found = true; break; }
      }
      if (!found) break;
      len += 1;
    }
    if (len > best) best = len;
  }
  return best;
}

// An Observation's provenance, not its content: every one of its
// related_refs points at the memory system's own files (this module, its
// verify scripts, or the Observation Log itself) rather than at any real
// production file. No topic word is named anywhere in this rule -- it is
// purely "what is this record ABOUT," derived from the same related_refs
// field every Observation already carries, not a new field and not a
// keyword scan of context/finding text.
const GENIE_SELF_REF = /^services\/genie|^scripts\/verify-genie|^project_brain\/observation_log/;
export function isMetaObservation(record) {
  const refs = record.related_refs ?? [];
  if (refs.length === 0) return false;
  return refs.every((ref) => GENIE_SELF_REF.test(ref));
}

// Minimum fraction of the query's own tokens that a candidate must share to
// even be considered by the structural fallback below. Root-caused against a
// fixed 16-event recall benchmark (see
// scripts/verify-genie-memory-recall-benchmark-v1.mjs): the prior version of
// this fallback (raw overlap count + a bare contiguous-run>=2 requirement,
// with no ratio floor) produced 4 false negatives -- forced fail-closed
// whenever two or more genuinely relevant records tied on overlap count
// instead of returning both -- and, separately, 1 false positive, where a
// short, generic 2-3 token coincidence (e.g. "real image" or "titanic
// scenes") in an otherwise long, unrelated query was enough to pass. Neither
// problem was fixable by tuning contiguous-run length alone: raising it
// traded the false positive for *more* false negatives, and multi-match
// alone (returning every tied candidate) fixed all 4 false negatives but
// let one new false positive through. This ratio requirement -- a
// candidate's overlap must cover at least 60% of the query's own token
// count, evaluated against the SAME raw (unfiltered) tokens already used for
// overlap/contiguous-run, no stopword list or corpus-frequency filtering
// needed -- was swept from 0 to 0.75 against the fixed benchmark and found
// stable (0 false negatives, 0 false positives) across [0.6, 0.65]; 0.6 was
// chosen as the more recall-favoring edge of that stable range. This is
// still a plain count/ratio threshold, not a scored or fuzzy match.
const MIN_OVERLAP_RATIO = 0.6;

/**
 * Observation-tier search: literal substring first (delegates to the
 * existing findRelatedObservations, unchanged, then locally re-filtered by
 * provenance), then -- only if that finds nothing -- a structural
 * token-overlap fallback over context/finding/related_refs, mirroring the
 * same fail-closed contiguous-run>=2 discipline genieCanonicalLearningRetrieval.mjs
 * already applies to Experience records, plus the MIN_OVERLAP_RATIO guard
 * above. When multiple candidates genuinely tie at the corpus-wide max
 * overlap AND all of them individually clear both the contiguous-run and
 * ratio bars, every one of them is returned -- an honest "these are equally
 * the best match," not a guess at picking one (if even one tied candidate
 * fails either bar, the whole query still fails closed to no match, exactly
 * as before).
 *
 * By default, meta Observations (see isMetaObservation above) are excluded
 * from the candidate pool entirely -- ordinary project-history questions
 * should recall the substantive record the memory system is ABOUT, not a
 * later diagnostic note that happens to discuss it at length and out-competes
 * it on raw token overlap. Root-caused in "GENIE Retrieval Source Priority
 * Assessment V1": meta entries repeatedly won or coincidentally matched
 * ties/uniques ahead of the real events they described, and this got worse,
 * not better, as more meta entries accumulated. Pass { includeMeta: true }
 * explicitly when the query IS about the memory/retrieval system's own
 * behavior -- the caller already knows which kind of question it's asking;
 * this is a scope switch, not a keyword-based intent guess.
 */
export function findObservationsByProblem(problem, projectRoot, { includeMeta = false } = {}) {
  const literalRaw = findRelatedObservations(problem, projectRoot);
  const literal = includeMeta ? literalRaw : literalRaw.filter((r) => !isMetaObservation(r));
  if (literal.length > 0) {
    return { matched: literal, match_contract: 'CASE_INSENSITIVE_LITERAL_SUBSTRING' };
  }

  const queryTokens = tokenize(problem);
  if (queryTokens.length === 0) {
    return { matched: [], match_contract: 'NO_MATCH_EMPTY_QUERY' };
  }

  const allRaw = readObservations(projectRoot);
  const all = includeMeta ? allRaw : allRaw.filter((r) => !isMetaObservation(r));
  const candidates = all.map((record) => {
    const haystack = [record.context, record.finding, ...(record.related_refs ?? [])].join(' ');
    const tokens = tokenize(haystack);
    const overlap = queryTokens.filter((t) => tokens.includes(t)).length;
    return { record, tokens, overlap, ratio: overlap / queryTokens.length };
  });
  const maxOverlap = candidates.reduce((m, c) => Math.max(m, c.overlap), 0);
  const atMax = maxOverlap > 0 ? candidates.filter((c) => c.overlap === maxOverlap) : [];

  const qualifies = (c) => longestContiguousRun(queryTokens, c.tokens) >= 2 && c.ratio >= MIN_OVERLAP_RATIO;
  if (atMax.length > 0 && atMax.every(qualifies)) {
    return {
      matched: atMax.map((c) => c.record),
      match_contract:
        atMax.length === 1
          ? 'STRUCTURAL_TOKEN_FALLBACK_UNIQUE_MAX_OVERLAP_CONTIGUOUS_RUN_GE_2_RATIO_GE_0.6'
          : 'STRUCTURAL_TOKEN_FALLBACK_GENUINE_TIE_MULTI_MATCH_CONTIGUOUS_RUN_GE_2_RATIO_GE_0.6',
    };
  }
  return { matched: [], match_contract: 'NO_MATCH' };
}

/**
 * The one call a task should make at start-of-work: "does GENIE already
 * know anything about this problem, in either tier?" Merges both retrieval
 * paths; changes nothing about either store, adds no new failure mode to
 * either (a read error in one tier does not suppress the other's result).
 *
 * includeMeta defaults to false -- ordinary project-history questions.
 * Pass { includeMeta: true } only when the question is actually about the
 * memory/retrieval system's own behavior (e.g. another memory-diagnostic
 * task like this one). The Experience tier has no meta records today, so
 * this only affects the Observation tier; if that ever changes, this is the
 * one place to extend the same filter to retrieveCanonicalHistoryByProblem.
 */
export function retrieveGenieMemory(problem, projectRoot, { includeMeta = false } = {}) {
  let experience;
  try {
    experience = retrieveCanonicalHistoryByProblem({ problem });
  } catch (e) {
    experience = { ok: false, error: e instanceof Error ? e.message : String(e), results: [] };
  }
  const observation = findObservationsByProblem(problem, projectRoot, { includeMeta });

  const experienceMatches = Array.isArray(experience?.results) ? experience.results.length : 0;
  const observationMatches = observation.matched.length;

  return {
    problem,
    experience,
    observation,
    any_match: experienceMatches > 0 || observationMatches > 0,
    match_summary: `experience=${experienceMatches} observation=${observationMatches}`,
  };
}

/**
 * Persistence-discipline helper: an explicit, deliberate judgment call to
 * make at the end of every real task -- not automated detection (this
 * module cannot see what a task actually did), just a small forcing
 * function so the question "should this be recorded?" gets asked instead of
 * silently skipped. Call it, answer honestly, act on the result.
 */
export function assessTaskClosureMemoryNeed({ realWorkDone, hasReusableFinding, alreadyCapturedAsExperience = false }) {
  if (alreadyCapturedAsExperience) {
    return { should_record_observation: false, reason: 'Already captured at the Experience tier -- no separate Observation needed.' };
  }
  if (!realWorkDone) {
    return { should_record_observation: false, reason: 'No real work was done this task (pure question, or work deferred entirely to the user/a later task).' };
  }
  if (!hasReusableFinding) {
    return { should_record_observation: false, reason: 'Real work was done, but nothing about it would help a future task avoid re-deriving the same thing.' };
  }
  return { should_record_observation: true, reason: 'Real work produced a reusable finding -- record it as an Observation before ending this task.' };
}
