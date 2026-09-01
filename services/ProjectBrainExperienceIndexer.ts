import {
  createExperienceArchive,
  recordExperience,
  type ExperienceArchive,
  type ExperienceRecord,
  type ExperienceOutcome,
} from './ProjectBrainExperienceMemory.js';
import type { SemanticTag } from './ProjectBrainSemanticEngine.js';

/**
 * PHASE-PROJECT-BRAIN-EXPERIENCE-001's real Experience Index + Experience
 * Retrieval: an inverted index over tag and outcome, enabling "what
 * happened before in situations like this" queries. Retrieval here is
 * deliberately exact-tag-match similarity — NOT embedding-based or
 * LLM-based semantic similarity (API 미사용) — a disclosed, simple,
 * fully-explainable rule: two tasks are "similar" if they share at least
 * one real Semantic Reasoning tag.
 */
export interface ExperienceIndex {
  by_tag: Partial<Record<SemanticTag, ExperienceRecord[]>>;
  by_outcome: Record<ExperienceOutcome, ExperienceRecord[]>;
}

export function buildExperienceIndex(archive: ExperienceArchive): ExperienceIndex {
  const by_tag: Partial<Record<SemanticTag, ExperienceRecord[]>> = {};
  const by_outcome: Record<ExperienceOutcome, ExperienceRecord[]> = { success: [], failure: [], undetermined: [] };

  for (const record of archive.records) {
    for (const tag of record.tags) {
      if (!by_tag[tag]) by_tag[tag] = [];
      by_tag[tag]!.push(record);
    }
    by_outcome[record.outcome].push(record);
  }

  return { by_tag, by_outcome };
}

/** Real Experience Retrieval by tag similarity: a record matching more than one queried tag appears exactly once in the result (deduplicated by `experience_id`), sorted by real recording order. */
export function retrieveSimilarExperiences(tags: SemanticTag[], index: ExperienceIndex): ExperienceRecord[] {
  const seen = new Set<string>();
  const results: ExperienceRecord[] = [];

  for (const tag of tags) {
    for (const record of index.by_tag[tag] ?? []) {
      if (!seen.has(record.experience_id)) {
        seen.add(record.experience_id);
        results.push(record);
      }
    }
  }

  return results.sort((a, b) => a.sequence - b.sequence);
}

export function retrieveByOutcome(outcome: ExperienceOutcome, index: ExperienceIndex): ExperienceRecord[] {
  return [...index.by_outcome[outcome]];
}

export interface ExperienceIndexSelfTestResult {
  ok: boolean;
  detail: string;
}

/**
 * Real self-test over a small, synthetic, clearly-labeled archive: a query
 * for `['commit']` must return exactly the 2 records tagged `commit`; a
 * query for `['credential', 'commit']` against a record that carries BOTH
 * tags must return that record exactly once (deduplication proof, not
 * twice); a query for an unrelated tag must return only its own real
 * match; `retrieveByOutcome('success', ...)` must return exactly the real
 * successes.
 */
export function runExperienceIndexSelfTest(): ExperienceIndexSelfTestResult {
  const archive = createExperienceArchive();
  recordExperience(archive, { task_id: 'self_test_a', tags: ['credential', 'commit'], predicted_status: 'human_required', actual_status: 'human_required', was_correct: true });
  recordExperience(archive, { task_id: 'self_test_b', tags: ['commit'], predicted_status: 'machine_executable', actual_status: 'machine_executable', was_correct: true });
  recordExperience(archive, { task_id: 'self_test_c', tags: ['review'], predicted_status: 'unknown', actual_status: 'machine_executable', was_correct: 'no_prediction' });

  const index = buildExperienceIndex(archive);
  const byCommit = retrieveSimilarExperiences(['commit'], index);
  const byCredentialOrCommit = retrieveSimilarExperiences(['credential', 'commit'], index);
  const byReview = retrieveSimilarExperiences(['review'], index);
  const successes = retrieveByOutcome('success', index);

  const ok =
    byCommit.length === 2 &&
    byCommit.map((r) => r.task_id).includes('self_test_a') &&
    byCommit.map((r) => r.task_id).includes('self_test_b') &&
    byCredentialOrCommit.length === 2 &&
    byReview.length === 1 &&
    byReview[0]?.task_id === 'self_test_c' &&
    successes.length === 2;

  return {
    ok,
    detail: ok
      ? `tag query "commit" correctly returned both real matches; a 2-tag query against a record carrying both tags correctly deduplicated to a single entry; an unrelated tag query correctly returned only its own match; outcome retrieval correctly returned exactly the 2 real successes`
      : `FAILED — byCommit=${byCommit.length}, byCredentialOrCommit=${byCredentialOrCommit.length}, byReview=${byReview.length}, successes=${successes.length}`,
  };
}
