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
import { readObservations, findRelatedObservations, extractCanonicalIdentityTerms } from './genieObservationLog.mjs';

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

// Minimum fraction of the query's own CONTENT tokens that a candidate must
// share to even be considered by the structural fallback below. Root-caused
// against a fixed 16-event recall benchmark (see
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
// let one new false positive through. This ratio requirement was swept from
// 0 to 0.75 against the fixed benchmark and found stable (0 false
// negatives, 0 false positives) across [0.6, 0.65]; 0.6 was chosen as the
// more recall-favoring edge of that stable range.
//
// "Natural Language Retrieval Gap Assessment V1" (2026-09-04) root-caused a
// SEPARATE later problem with this same guard: it was originally computed
// against the query's RAW (unfiltered) token count, which is correct for
// short, keyword-dense queries (the benchmark's own style) but fails closed
// on genuinely natural questions, where 60-70% of the tokens are
// connectives ("was," "did," "the," "a," "to," "it") that inflate the
// denominator without being real signal -- 11 of 13 diagnosed real-world
// no-match failures were ratio-limited this way, several by a single point
// (e.g. ratio 0.59 against the exact right record). STOPWORDS below is a
// minimal, closed, corpus-independent set of standard English function
// words (articles, pronouns, common auxiliaries, prepositions, conjunctions,
// question words) -- not tuned to any specific query or record. The ratio
// is now computed over CONTENT tokens only (stopwords counted in neither
// numerator nor denominator), which both recovers ratio-limited real
// matches AND strengthens the false-positive guard (a candidate sharing only
// stopwords with the query now scores 0, not a deceptively high raw ratio --
// this is why 2 of the diagnosed wrong-matches, which passed the old raw
// gate on stopword volume alone, no longer qualify). Swept jointly with
// STRONG_CONTENT_RATIO below against both the fixed 16-benchmark and a
// separate 19-query natural-language set; found stable at 0 benchmark
// regressions across [0.52, 0.57], with 0.55 chosen as a non-edge point in
// that stable range, mirroring the original threshold's own selection
// discipline.
const MIN_OVERLAP_RATIO = 0.55;

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'am',
  'do', 'does', 'did', 'done', 'doing', 'has', 'have', 'had', 'having',
  'i', 'we', 'you', 'your', 'our', 'it', 'its', 'this', 'that', 'these', 'those',
  'he', 'she', 'they', 'them', 'his', 'her', 'their',
  'to', 'of', 'in', 'on', 'at', 'for', 'from', 'by', 'with', 'about', 'as', 'into', 'onto', 'over', 'under',
  'and', 'or', 'but', 'if', 'so', 'than', 'then', 'not', 'no', 'nor',
  'what', 'who', 'when', 'where', 'why', 'how', 'which', 'whose',
  'ever', 'anyone', 'any', 'all', 'some', 'someone', 'something', 'somewhere',
  'there', 'here', 'can', 'could', 'will', 'would', 'should', 'shall', 'may', 'might', 'must',
  'just', 'also', 'still', 'yet', 'already', 'actually', 'really',
]);

// A small, individually hand-verified table of true single-word synonyms --
// NOT stemming (no suffix rules) and NOT concept-aliasing (no word maps to
// an unrelated technical term). "Semantic Retrieval Strategy Assessment V1"
// (2026-09-04) scratch-simulated three candidate approaches against the
// diagnosed natural-language gap: blanket suffix-stemming caused a NET
// recall loss and a new false positive even from a minimal stripper
// (rejected); a broader concept-alias set (e.g. "fake"->"self-certifying")
// fixed one query but broke another via new false ties (rejected); this
// exact 7-pair table was the only candidate that improved recall with zero
// new false positives or benchmark regressions when swept. Each pair was
// individually verified against a real diagnosed query, not chosen
// generically -- a word not in this list gets no synonym credit. Applied as
// query-side-only expansion: a query token additionally counts as
// overlapping if any of its listed synonyms appear in the candidate's own
// tokens (not reciprocated in the other direction, since the candidate side
// is already covered by canonical-identity terms where relevant).
const SYNONYMS = {
  old: ['legacy'], legacy: ['old'],
  started: ['genesis'], genesis: ['started'],
  try: ['attempt'], tried: ['attempted'], attempt: ['try'],
  connecting: ['connection'], connection: ['connecting'],
  finished: ['completed'], completed: ['finished'],
  generating: ['generation'], generation: ['generating'],
  upscaling: ['upscale'], upscale: ['upscaling'],
};

// A sufficiently high CONTENT ratio can substitute for the phrase/canonical
// run≥2 signal below, rather than being vetoed by it. Root-caused as a
// distinct failure mode from the ratio-denominator problem above: query C1
// in the Natural Language Retrieval Gap Assessment ("when GENIE was asked
// what to do next did it actually give a useful answer") scored a strong
// 0.73 raw ratio against the exact right record, yet still failed closed
// because natural grammar scatters content words instead of keeping them
// adjacent (rawRun=1, canonicalMatchCount=0) -- proof that run≥2 can veto an
// otherwise-decisive match. This is an ADDITIONAL qualifying path, not a
// replacement for run≥2/canonicalMatchCount>=2 -- MIN_OVERLAP_RATIO above
// still applies unconditionally either way. Swept jointly with
// MIN_OVERLAP_RATIO; stable at 0 benchmark regressions across [0.56, 0.60].
const STRONG_CONTENT_RATIO = 0.6;

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
  // Same source of identifier-shaped terms as the write path (see
  // "GENIE Memory Identity Canonicalization Implementation V1") -- if the
  // query itself contains a compound identifier (e.g. bare "AIStudio"), its
  // split sub-words are eligible signal too, symmetric with how a record's
  // own canonical terms are matched below.
  const queryCanonicalTerms = extractCanonicalIdentityTerms(problem);
  // Content-word subset of the query, used only for the ratio computation
  // below -- corpus-wide candidate SELECTION (overlap / maxOverlap / tie
  // detection) is unchanged and still runs over the full raw token set, so
  // which record(s) are even considered is not affected by this list.
  const queryContentTokens = queryTokens.filter((t) => !STOPWORDS.has(t));

  const allRaw = readObservations(projectRoot);
  const all = includeMeta ? allRaw : allRaw.filter((r) => !isMetaObservation(r));
  const candidates = all.map((record) => {
    const haystack = [record.context, record.finding, ...(record.related_refs ?? [])].join(' ');
    const tokens = tokenize(haystack);
    // canonical_identity_terms is stored at write time by appendObservation();
    // records written before this field existed fall back to computing it
    // fresh here, from the same haystack, via the same shared function -- no
    // migration or rewrite of the stored record is needed or performed.
    const canonicalTerms = record.canonical_identity_terms ?? extractCanonicalIdentityTerms(haystack);

    const overlapTokens = new Set();
    let canonicalMatchCount = 0;
    for (const t of queryTokens) {
      if (tokens.includes(t)) overlapTokens.add(t);
      else if (canonicalTerms.includes(t)) { overlapTokens.add(t); canonicalMatchCount += 1; }
      else if ((SYNONYMS[t] ?? []).some((syn) => tokens.includes(syn))) overlapTokens.add(t);
    }
    for (const t of queryCanonicalTerms) {
      if (tokens.includes(t) || canonicalTerms.includes(t)) overlapTokens.add(t);
    }

    const rawRun = longestContiguousRun(queryTokens, tokens);
    // contentRatio: numerator and denominator both restricted to the query's
    // own content (non-stopword) tokens -- see MIN_OVERLAP_RATIO above. A
    // query made entirely of stopwords (queryContentTokens.length === 0)
    // fails closed to ratio 0, same fail-closed posture as the empty-query
    // case above.
    const contentOverlapCount = queryContentTokens.filter((t) => overlapTokens.has(t)).length;
    const contentRatio = queryContentTokens.length > 0 ? contentOverlapCount / queryContentTokens.length : 0;
    return { record, tokens, overlap: overlapTokens.size, rawRun, canonicalMatchCount, ratio: contentRatio };
  });
  const maxOverlap = candidates.reduce((m, c) => Math.max(m, c.overlap), 0);
  const atMax = maxOverlap > 0 ? candidates.filter((c) => c.overlap === maxOverlap) : [];

  // Three independent, equally-valid "this is a real shared phrase, not a
  // coincidence" signals: the existing raw contiguous-run>=2, OR at least 2
  // distinct query tokens matching via canonical-identity terms (a record's
  // stored/derived canonical terms, or the query's own), OR (added by
  // "Observation Natural Retrieval Repair V1") a STRONG_CONTENT_RATIO --
  // see that constant's own comment for the C1 counter-example this
  // addresses. None of the three signals is a substitute for the ratio
  // guard -- MIN_OVERLAP_RATIO still applies to the combined overlap count
  // either way. The first two were root-caused and swept against the fixed
  // 16-event benchmark in "GENIE Memory Identity Canonicalization
  // Assessment/Implementation V1": requiring the phrase signal to come from
  // raw contiguous tokens only meant a candidate whose only strong signal
  // was a canonical-identity match could never qualify on its own, and
  // could even drag an otherwise-unique correct match into a failing tie.
  const qualifies = (c) => (c.rawRun >= 2 || c.canonicalMatchCount >= 2 || c.ratio >= STRONG_CONTENT_RATIO) && c.ratio >= MIN_OVERLAP_RATIO;
  if (atMax.length > 0 && atMax.every(qualifies)) {
    return {
      matched: atMax.map((c) => c.record),
      match_contract:
        atMax.length === 1
          ? 'STRUCTURAL_TOKEN_FALLBACK_UNIQUE_MAX_OVERLAP_PHRASE_OR_CANONICAL_OR_STRONG_CONTENT_RATIO'
          : 'STRUCTURAL_TOKEN_FALLBACK_GENUINE_TIE_MULTI_MATCH_PHRASE_OR_CANONICAL_OR_STRONG_CONTENT_RATIO',
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
