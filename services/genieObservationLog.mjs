// GENIE Lightweight Observation Log (V1).
//
// Deliberately separate from the canonical Experience system: no CR-01..CR-17
// validation, no goal_ref/capability_refs resolution, no index-v8 registration,
// and never merged into genieCanonicalLearningRetrieval.mjs's trusted result
// set. Purpose: record real diagnostic findings from OJT work that are not
// (yet, or ever) Experience-worthy, so the next OJT round can cheaply check
// "have we already looked at this?" instead of silently re-deriving it.
//
// A finding written here is a note, not a verified fact -- callers must treat
// findRelatedObservations() results as "here's what was found last time",
// never as authoritative canonical history the way Experience retrieval is.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const OBSERVATION_LOG_DIR = 'project_brain/observation_log';
export const OBSERVATION_LOG_PATH = `${OBSERVATION_LOG_DIR}/genie-observation-log-v1.jsonl`;

export const OBSERVATION_DISPOSITIONS = [
  'resolved_no_action',
  'expanding_scope_hold',
  'insufficient_evidence',
  'superseded',
];
const VALID_DISPOSITIONS = new Set(OBSERVATION_DISPOSITIONS);

function resolveLogPath(projectRoot) {
  return path.join(projectRoot, OBSERVATION_LOG_PATH);
}

/**
 * Appends one observation as a single JSONL line. Intentionally minimal
 * validation (required fields, valid disposition, related_refs is a string
 * array) -- no schema beyond that, no cross-file resolution, no SHA pinning.
 * That cost difference from a canonical Experience is the entire point.
 */
export function appendObservation(entry, projectRoot = defaultRoot) {
  const { context, finding, disposition, related_refs = [] } = entry ?? {};
  if (typeof context !== 'string' || context.trim().length === 0) {
    throw new Error('OBSERVATION_CONTEXT_REQUIRED');
  }
  if (typeof finding !== 'string' || finding.trim().length === 0) {
    throw new Error('OBSERVATION_FINDING_REQUIRED');
  }
  if (!VALID_DISPOSITIONS.has(disposition)) {
    throw new Error(`OBSERVATION_DISPOSITION_INVALID: ${JSON.stringify(disposition)}`);
  }
  if (!Array.isArray(related_refs) || !related_refs.every((ref) => typeof ref === 'string')) {
    throw new Error('OBSERVATION_RELATED_REFS_INVALID');
  }

  const record = {
    observed_at: new Date().toISOString(),
    context,
    finding,
    disposition,
    related_refs,
  };

  const fullPath = resolveLogPath(projectRoot);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.appendFileSync(fullPath, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

/** Reads every observation record. Returns [] if the log doesn't exist yet. */
export function readObservations(projectRoot = defaultRoot) {
  const fullPath = resolveLogPath(projectRoot);
  if (!fs.existsSync(fullPath)) return [];
  return fs
    .readFileSync(fullPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));
}

/**
 * Cheap, case-insensitive substring search over context/finding/related_refs.
 * The read path OJT task-selection should consult before re-scanning a
 * candidate: "has this already been checked, and what did we find?"
 */
export function findRelatedObservations(query, projectRoot = defaultRoot) {
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle) return [];
  return readObservations(projectRoot).filter((record) => {
    const haystack = [record.context, record.finding, ...(record.related_refs ?? [])]
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}
