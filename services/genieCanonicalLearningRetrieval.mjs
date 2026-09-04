// Read-only exact-key retrieval. Canonical membership comes only from the existing loader.
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readCaptureState } from './genieOjtCaptureEnforcement.mjs';
import { loadTutorCandidates } from './genieTutorCandidateLoader.mjs';
import { repositoryEvidenceReader } from './genieExternalTutorConsultationContract.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const principleRef = 'project_brain/story_scenario_intelligence/project-brain-cross-domain-principle-registry-e23-v1.json';
const liveReaders = {
  canonical: readCaptureState,
  candidates: () => loadTutorCandidates(root),
  principle: () => JSON.parse(repositoryEvidenceReader(root)(principleRef).toString()),
};
const keys = {
  experience: ['experience_id', 'goal_ref', 'gap_ref', 'dependency_ref', 'capability_ref',
    'experience_kind', 'assignment_ref', 'verifies_external_experience_id'],
  candidate: ['candidate_id', 'query_evidence_ref'],
  principle: ['principle_id', 'domain', 'provenance_experience_id'],
};
const text = v => typeof v === 'string' && v.trim().length > 0;
function requireValid(ok, code, detail) {
  if (!ok) throw Object.assign(new Error(detail), { code });
}
function uniqueMap(records, field, kind) {
  requireValid(Array.isArray(records), 'INVALID_SOURCE', `${kind} collection`);
  const map = new Map();
  for (const record of records) {
    const id = record?.[field];
    requireValid(text(id), 'INVALID_REFERENCE', `${kind} identity`);
    requireValid(!map.has(id), 'AMBIGUOUS_REFERENCE', `${kind}: ${id}`);
    map.set(id, record);
  }
  return map;
}

/** One exact key per query; no scoring, fuzzy matching, index-version selection or writes.
 * Optional readers are a fixture seam for already-loaded sources, not alternate snapshot discovery.
 * Historical documents and index snapshots are never used as membership sources.
 */
export function retrieveCanonicalLearning(query, readers = liveReaders) {
  let canonicalCount = null;
  try {
    requireValid(query && typeof query === 'object' && !Array.isArray(query) &&
      Object.keys(query).length === 3 && Object.keys(query).every(k => ['kind', 'key', 'value'].includes(k)) &&
      Object.hasOwn(keys, query.kind) && keys[query.kind].includes(query.key) && text(query.value),
    'INVALID_QUERY', 'Expected { kind, key, value } with one supported exact structural key');
    const state = readers.canonical();
    const experiences = uniqueMap(state.records, 'experience_id', 'Experience');
    canonicalCount = experiences.size;
    const loaded = readers.candidates();
    requireValid(loaded?.ok === true && Array.isArray(loaded.errors) && loaded.errors.length === 0,
      loaded?.errors?.some(e => e.error === 'DUPLICATE_CANDIDATE_ID') ? 'AMBIGUOUS_REFERENCE' : 'INVALID_SOURCE',
      `Candidate loader rejected sources: ${JSON.stringify(loaded?.errors ?? [])}`);
    const candidates = uniqueMap(loaded.candidates, 'candidate_id', 'Candidate');
    for (const [id, candidate] of candidates) {
      requireValid(candidate.links?.provenance_source === 'EXTERNAL', 'INVALID_REFERENCE', `Non-EXTERNAL Candidate: ${id}`);
      requireValid(!experiences.has(id), 'AMBIGUOUS_REFERENCE', `Experience/Candidate namespace: ${id}`);
    }
    const registry = readers.principle();
    requireValid(registry && text(registry.registry_id) && registry.principle,
      'INVALID_SOURCE', 'Existing Principle registry');
    const principles = uniqueMap([registry.principle], 'principle_id', 'Principle');
    const references = new Map();
    const one = (map, ref, owner, kind) => {
      requireValid(text(ref), 'INVALID_REFERENCE', `${owner}: invalid ${kind} reference`);
      requireValid(map.has(ref), 'DANGLING_REFERENCE', `${owner}: ${kind} ${ref}`);
      return { kind, id: ref };
    };
    // Check relations across the loaded set before returning any partial result.
    for (const [id, e] of experiences) {
      requireValid(e.links && typeof e.links === 'object' && e.decision && typeof e.decision === 'object',
        'INVALID_SOURCE', `Experience structure: ${id}`);
      const refs = [];
      if (e.decision.corrects_experience_id != null) {
        requireValid(e.decision.corrects_experience_id !== id, 'INVALID_REFERENCE', `Self correction: ${id}`);
        refs.push(one(experiences, e.decision.corrects_experience_id, id, 'experience'));
      }
      if (Object.hasOwn(e.links, 'verifies_external_experience_id')) {
        const ref = e.links.verifies_external_experience_id;
        requireValid(text(ref), 'INVALID_REFERENCE', `External reference: ${id}`);
        const kind = experiences.has(ref) ? 'experience' : 'candidate';
        const map = kind === 'experience' ? experiences : candidates;
        refs.push(one(map, ref, id, kind));
        requireValid(map.get(ref).links?.provenance_source === 'EXTERNAL',
          'INVALID_REFERENCE', `External target provenance: ${id} -> ${ref}`);
      }
      references.set(e, refs);
    }
    for (const [id, p] of principles) {
      requireValid(Array.isArray(p.provenance_experience_ids), 'INVALID_REFERENCE', `Principle provenance: ${id}`);
      requireValid(new Set(p.provenance_experience_ids).size === p.provenance_experience_ids.length,
        'AMBIGUOUS_REFERENCE', `Repeated Principle provenance: ${id}`);
      references.set(p, p.provenance_experience_ids.map(ref => one(experiences, ref, id, 'experience')));
    }
    const values = record => {
      if (query.kind === 'experience') {
        if (query.key === 'capability_ref') return record.links.capability_refs ?? [];
        if (['experience_id', 'experience_kind'].includes(query.key)) return [record[query.key]];
        return [record.links[query.key]];
      }
      if (query.kind === 'candidate') return [query.key === 'candidate_id' ? record.candidate_id : record.links.external_source?.query_evidence_ref];
      if (query.key === 'domain') return record.domains_validated ?? [];
      if (query.key === 'provenance_experience_id') return record.provenance_experience_ids;
      return [record.principle_id];
    };
    const map = { experience: experiences, candidate: candidates, principle: principles }[query.kind];
    const results = [...map].filter(([, record]) => values(record).includes(query.value))
      // Stable identity order only; this is not a relevance ranking.
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([id, record]) => ({
        kind: query.kind, id, record,
        matched_key: query.key, matched_value: query.value,
        provenance_source: record.links?.provenance_source ?? null,
        resolved_references: references.get(record) ?? [],
        verification: {
          canonical_membership: query.kind === 'experience',
          candidate_contract_validated: query.kind === 'candidate',
          reference_integrity: 'RESOLVED',
          reference_scope: 'Canonical loader checks plus correction, external-target and Principle Experience-provenance links; not arbitrary evidence paths or historical promotion lineage.',
          // Labels, historical PASS, or EXTERNAL provenance are never proof of knowledge.
          substantive_evidence: 'NOT_EVALUATED',
          knowledge_verified: false, promotion_authorized: false,
        },
        ...(query.kind === 'principle' ? { registry_ref: principleRef,
          scope: 'Registry principle and its canonical Experience provenance only; historical promotion lineage is not revalidated.' } : {}),
      }));
    return { ok: true, status: results.length ? 'OK' : 'NOT_FOUND', canonical_count: canonicalCount,
      results, errors: [], scope: 'Current canonical Experiences, validated Tutor Candidates, existing E23 Principle registry' };
  } catch (error) {
    const code = ['INVALID_QUERY', 'INVALID_SOURCE', 'INVALID_REFERENCE', 'DANGLING_REFERENCE', 'AMBIGUOUS_REFERENCE'].includes(error.code)
      ? error.code : /DUPLICATE/.test(error.message) ? 'AMBIGUOUS_REFERENCE' : 'INVALID_SOURCE';
    return { ok: false, status: code, canonical_count: canonicalCount, results: [],
      errors: [{ code, detail: error.message }] };
  }
}

const repositoryJsonRef = value => text(value) && /^[A-Za-z0-9_./-]+\.json$/.test(value) &&
  !value.startsWith('/') && !value.split('/').includes('..');
const normalizedPhrase = value => value.trim().replace(/\s+/g, ' ').toLowerCase();

// Structural, non-scoring fallback (see below): plain word tokens, no stopword
// list, no stemming. Used only to measure (a) unique corpus-wide overlap count
// and (b) whether the query and a candidate share an actual contiguous phrase
// (run length >= 2), never as a tunable relevance score.
const tokenize = value => normalizedPhrase(value).match(/[a-z0-9]+/g) || [];

// "Natural Language Retrieval Gap Assessment V1" (2026-09-04) root-caused 4
// wrong-match failures against this module's own structural fallback below:
// unlike the sibling Observation-tier fallback (genieUnifiedMemoryRetrieval.mjs),
// this one had no ratio/density guard at all -- only "unique corpus-wide max
// overlap" + "contiguous run>=2" -- so on a genuinely natural (long,
// connective-heavy) query against the full canonical corpus, generic-word
// overlap alone could produce a confident, uniquely-selected, topically
// unrelated match (diagnosed live: 4/4 of the queried natural questions
// measured raw overlap ratios of 0.29-0.64 against their WRONG unique-max
// candidate). "Observation Natural Retrieval Repair V1" fixed the sibling
// fallback's own separate ratio-denominator problem (stopwords diluting the
// ratio on natural queries) using the same content-word approach; this
// constant and STOPWORDS below apply that same, independently-verified
// design to this fallback's missing guard. Swept against all 4 diagnosed
// wrong-match queries (0/4 still wrong at minRatio>=0.55) and the fixed
// 16-event recall benchmark (0 regressions); every live query this file's
// own self-test (scripts/verify-genie-canonical-learning-retrieval-v1.mjs)
// exercises against real data resolves via the literal-phrase path above,
// never reaching this fallback, so existing verified recall is structurally
// unaffected by this guard. Duplicated (not imported) from the sibling
// module deliberately, matching longestContiguousRun's own established
// duplication rationale directly below.
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
const MIN_OVERLAP_RATIO = 0.55;

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

// The one directory this module and readCaptureState() already treat as the
// canonical home of every Experience/History document -- reused here, not a
// new or incident-specific location.
const CANONICAL_HISTORY_DOCUMENT_DIRECTORY = 'project_brain/story_scenario_intelligence';

/**
 * A bare filename (no path separator) evidence_source/`ref` predates the
 * explicit evidence_ref/evidence_location convention (CR-15) and was never
 * guaranteed to resolve at the repository root. The only additional location
 * tried is CANONICAL_HISTORY_DOCUMENT_DIRECTORY -- never assumed correct by
 * itself. Resolution is accepted only when it is unique among the locations
 * that actually contain a real file, and matches any declared SHA-256;
 * anything else is reported unresolved rather than guessed at or thrown.
 */
function resolveLegacyEvidenceReference(ref, declaredSha256, readEvidence) {
  const candidates = ref.includes('/') ? [ref] : [ref, `${CANONICAL_HISTORY_DOCUMENT_DIRECTORY}/${ref}`];
  const found = [];
  for (const candidate of candidates) {
    let bytes;
    try { bytes = readEvidence(candidate); } catch { continue; }
    found.push({ candidate, bytes, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  if (found.length === 0) return { ok: false, reason: 'UNRESOLVED_MISSING', candidates_tried: candidates };
  if (found.length > 1) return { ok: false, reason: 'UNRESOLVED_AMBIGUOUS', candidates_tried: candidates,
    resolved_candidates: found.map((f) => f.candidate) };
  const [only] = found;
  if (declaredSha256 !== null && declaredSha256 !== only.sha256) {
    return { ok: false, reason: 'UNRESOLVED_SHA_MISMATCH', candidates_tried: candidates, resolved_candidate: only.candidate };
  }
  return { ok: true, ref: only.candidate, bytes: only.bytes, sha256: only.sha256 };
}

function collectRepositoryJsonRefs(value) {
  const refs = [];
  const visit = current => {
    if (!current || typeof current !== 'object') return;
    if (Array.isArray(current)) {
      for (const item of current) visit(item);
      return;
    }
    for (const [key, child] of Object.entries(current)) {
      const referenceField = key === 'ref' || key === 'evidence_source' || key.endsWith('_ref');
      if (referenceField && repositoryJsonRef(child)) {
        const stem = key.endsWith('_ref') ? key.slice(0, -4) : null;
        const declaredSha = key === 'ref' && typeof current.sha256 === 'string' ? current.sha256 :
          stem && typeof current[`${stem}_sha256`] === 'string' ? current[`${stem}_sha256`] : null;
        refs.push({ ref: child, declared_sha256: declaredSha });
      }
      visit(child);
    }
  };
  visit(value);
  return refs;
}

function collectExperienceBridge(experiences, anchorId) {
  const assignmentGroups = new Map();
  for (const [id, record] of experiences) {
    const assignmentRef = record.links?.assignment_ref;
    if (!text(assignmentRef)) continue;
    if (!assignmentGroups.has(assignmentRef)) assignmentGroups.set(assignmentRef, []);
    assignmentGroups.get(assignmentRef).push(id);
  }
  for (const ids of assignmentGroups.values()) ids.sort();

  const queue = [{ id: anchorId, depth: 0, path: [] }];
  const visited = new Set([anchorId]);
  const bridged = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current.depth >= 4) continue;
    const record = experiences.get(current.id);
    const neighbors = [];
    for (const [field, relation] of [
      ['source_experience_id', 'SOURCE_EXPERIENCE_ID'],
      ['corrects_experience_id', 'CORRECTS_EXPERIENCE_ID'],
    ]) {
      const target = record.decision?.[field];
      if (target == null) continue;
      requireValid(text(target), 'INVALID_REFERENCE', `${current.id}: invalid ${field}`);
      requireValid(experiences.has(target), 'DANGLING_REFERENCE', `${current.id}: ${field} ${target}`);
      neighbors.push({ id: target, relation, value: target });
    }
    const assignmentRef = record.links?.assignment_ref;
    if (text(assignmentRef)) {
      for (const target of assignmentGroups.get(assignmentRef) ?? []) {
        if (target !== current.id) neighbors.push({ id: target, relation: 'SHARED_ASSIGNMENT_REF', value: assignmentRef });
      }
    }
    neighbors.sort((a, b) => a.id.localeCompare(b.id) || a.relation.localeCompare(b.relation));
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.id)) continue;
      visited.add(neighbor.id);
      const path = [...current.path, { from_experience_id: current.id, relation: neighbor.relation,
        value: neighbor.value, to_experience_id: neighbor.id }];
      const target = experiences.get(neighbor.id);
      bridged.push({
        experience_id: neighbor.id,
        record: target,
        original_goal_ref: target.links?.goal_ref ?? null,
        bridge_path: path,
      });
      queue.push({ id: neighbor.id, depth: current.depth + 1, path });
    }
  }
  return bridged;
}

/**
 * Cross-context History lookup without embeddings, ranking, report ingestion, or
 * a second memory index. A literal problem phrase selects canonical Experience;
 * only explicit repository JSON references already attached to that Experience
 * are then followed. Referenced bytes remain in place and declared SHA-256 values
 * are enforced when present. A legacy bare-filename reference is additionally
 * tried against CANONICAL_HISTORY_DOCUMENT_DIRECTORY only, and only when that
 * yields one real, SHA-consistent file; anything else is reported unresolved
 * for that one node instead of guessing or aborting the whole lookup.
 */
export function retrieveCanonicalHistoryByProblem(request, readers = {
  canonical: readCaptureState,
  evidence: repositoryEvidenceReader(root),
}) {
  let canonicalCount = null;
  try {
    requireValid(request && typeof request === 'object' && !Array.isArray(request) &&
      Object.keys(request).length === 1 && text(request.problem), 'INVALID_QUERY',
    'Expected { problem: non-empty literal phrase }');
    const experiences = uniqueMap(readers.canonical().records, 'experience_id', 'Experience');
    canonicalCount = experiences.size;
    const phrase = normalizedPhrase(request.problem);
    let matched = [...experiences].filter(([, record]) => text(record.problem) &&
      normalizedPhrase(record.problem).includes(phrase)).sort(([a], [b]) => a.localeCompare(b));
    let matchContract = 'CASE_INSENSITIVE_LITERAL_PHRASE_NO_SCORING';

    // Structural fallback, substring-first contract unchanged: only tried when
    // the literal phrase match above found nothing. Not a relevance score --
    // fail-closed on any ambiguity (tie for the corpus-wide max overlap) and
    // requires an actual shared phrase (contiguous run >= 2 tokens), not just
    // scattered single-word coincidences, before ever returning a match.
    if (matched.length === 0) {
      const queryTokens = tokenize(request.problem);
      // Content (non-stopword) subset of the query, used only for the ratio
      // guard below -- candidate SELECTION (overlap / maxOverlap / unique-max
      // detection) is unchanged and still runs over the full raw token set.
      const queryContentTokens = queryTokens.filter((t) => !STOPWORDS.has(t));
      const candidates = [...experiences]
        .filter(([, record]) => text(record.problem))
        .map(([id, record]) => ({ id, record, tokens: tokenize(record.problem) }))
        .map((c) => ({ ...c, overlap: queryTokens.filter((t) => c.tokens.includes(t)).length }));
      const maxOverlap = candidates.reduce((m, c) => Math.max(m, c.overlap), 0);
      const atMax = maxOverlap > 0 ? candidates.filter((c) => c.overlap === maxOverlap) : [];
      if (atMax.length === 1) {
        const contentOverlapCount = queryContentTokens.filter((t) => atMax[0].tokens.includes(t)).length;
        const contentRatio = queryContentTokens.length > 0 ? contentOverlapCount / queryContentTokens.length : 0;
        if (longestContiguousRun(queryTokens, atMax[0].tokens) >= 2 && contentRatio >= MIN_OVERLAP_RATIO) {
          matched = [[atMax[0].id, atMax[0].record]];
          matchContract = 'STRUCTURAL_TOKEN_FALLBACK_UNIQUE_MAX_OVERLAP_CONTIGUOUS_RUN_GE_2_CONTENT_RATIO_GE_0.55';
        }
      }
    }

    const results = [];
    for (const [experienceId, record] of matched) {
      const queue = collectRepositoryJsonRefs(record).map(entry => ({ ...entry, depth: 1, parent_ref: experienceId }));
      const visited = new Set();
      const history = [];
      while (queue.length > 0) {
        const next = queue.shift();
        if (visited.has(next.ref) || next.depth > 4) continue;
        visited.add(next.ref);

        // A legacy (path-separator-free) reference that cannot be uniquely,
        // safely resolved is fail-closed for this one node only: recorded as
        // unresolved and not expanded, without aborting the rest of this
        // Experience's History or any other matched Experience.
        if (!next.ref.includes('/')) {
          const resolution = resolveLegacyEvidenceReference(next.ref, next.declared_sha256, readers.evidence);
          if (!resolution.ok) {
            history.push({
              ref: next.ref, parent_ref: next.parent_ref, depth: next.depth, resolved: false,
              resolution_reason: resolution.reason, candidates_tried: resolution.candidates_tried,
              sha256: null, declared_sha256: next.declared_sha256, generated_at: null, phase: null, document: null,
            });
            continue;
          }
          let document;
          try { document = JSON.parse(resolution.bytes.toString()); }
          catch {
            history.push({
              ref: next.ref, resolved_ref: resolution.ref, parent_ref: next.parent_ref, depth: next.depth,
              resolved: false, resolution_reason: 'UNRESOLVED_INVALID_JSON',
              sha256: resolution.sha256, declared_sha256: next.declared_sha256, generated_at: null, phase: null, document: null,
            });
            continue;
          }
          history.push({
            ref: next.ref, resolved_ref: resolution.ref,
            resolution: resolution.ref === next.ref ? 'AS_WRITTEN' : 'CANONICAL_HISTORY_DIRECTORY_FALLBACK',
            parent_ref: next.parent_ref, depth: next.depth, resolved: true,
            sha256: resolution.sha256, declared_sha256: next.declared_sha256,
            generated_at: text(document.generated_at) ? document.generated_at : null,
            phase: text(document.phase) ? document.phase : null,
            document,
          });
          for (const child of collectRepositoryJsonRefs(document)) {
            queue.push({ ...child, depth: next.depth + 1, parent_ref: next.ref });
          }
          continue;
        }

        // Unchanged existing contract for references that already carry a
        // real path: a SHA mismatch remains a hard failure of the whole call.
        const bytes = readers.evidence(next.ref);
        const sha256 = createHash('sha256').update(bytes).digest('hex');
        requireValid(next.declared_sha256 === null || next.declared_sha256 === sha256,
          'INVALID_REFERENCE', `History SHA mismatch: ${next.ref}`);
        let document;
        try { document = JSON.parse(bytes.toString()); }
        catch { throw Object.assign(new Error(`History JSON invalid: ${next.ref}`), { code: 'INVALID_SOURCE' }); }
        history.push({
          ref: next.ref,
          resolution: 'AS_WRITTEN',
          parent_ref: next.parent_ref,
          depth: next.depth,
          resolved: true,
          sha256,
          declared_sha256: next.declared_sha256,
          generated_at: text(document.generated_at) ? document.generated_at : null,
          phase: text(document.phase) ? document.phase : null,
          document,
        });
        for (const child of collectRepositoryJsonRefs(document)) {
          queue.push({ ...child, depth: next.depth + 1, parent_ref: next.ref });
        }
      }
      results.push({
        experience_id: experienceId,
        matched_problem: record.problem,
        match_contract: matchContract,
        historical_experience_bridge: collectExperienceBridge(experiences, experienceId),
        history,
        unresolved_legacy_reference_count: history.filter((h) => h.resolved === false).length,
        verification: {
          canonical_membership: true,
          experience_bridge_contract: 'EXPLICIT_SOURCE_OR_CORRECTION_ID_AND_EXACT_SHARED_ASSIGNMENT_REF_ONLY',
          original_goal_refs_preserved: true,
          explicit_reference_chain_only: true,
          repository_bytes_resolved_in_place: true,
          legacy_reference_directory_fallback: 'CANONICAL_HISTORY_DOCUMENT_DIRECTORY_ONLY_WHEN_UNIQUE_AND_SHA_CONSISTENT',
          unresolved_legacy_reference_fails_closed_not_whole_call: true,
          semantic_search_used: false,
          vector_search_used: false,
          rag_used: false,
          knowledge_verified: false,
          promotion_authorized: false,
        },
      });
    }
    return { ok: true, status: results.length ? 'OK' : 'NOT_FOUND', canonical_count: canonicalCount,
      results, errors: [], scope: 'Canonical Experience problem phrase -> explicit Experience provenance/assignment edges and repository JSON reference chain' };
  } catch (error) {
    const code = ['INVALID_QUERY', 'INVALID_SOURCE', 'INVALID_REFERENCE', 'AMBIGUOUS_REFERENCE'].includes(error.code)
      ? error.code : /DUPLICATE/.test(error.message) ? 'AMBIGUOUS_REFERENCE' : 'INVALID_SOURCE';
    return { ok: false, status: code, canonical_count: canonicalCount, results: [],
      errors: [{ code, detail: error.message }] };
  }
}
