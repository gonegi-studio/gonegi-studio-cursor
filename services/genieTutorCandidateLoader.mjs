// ELP-style discovery in explicit repository directories; no Experience loader changes.
import { readdirSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { repositoryEvidenceReader, validateTutorCandidate } from './genieExternalTutorConsultationContract.mjs';

export function discoverTutorCandidates(documents, readEvidence) {
  const records = [], errors = [], excluded = [], seen = new Map();
  function walk(node, ref, location, fixtureParent = false) {
    if (!node || typeof node !== 'object') return;
    const fixture = fixtureParent || node.fixture_only === true || node.test_fixture === true ||
      (typeof node.candidate_id === 'string' &&
        (node.candidate_id.includes('test_fixture') || node.candidate_id.startsWith('fixture_')));
    const intent = !Array.isArray(node) && (Object.hasOwn(node, 'consultation_kind') ||
      Object.hasOwn(node, 'selected_tutor') || (node.record_type === 'CANDIDATE' &&
      (node.links?.provenance_source === 'EXTERNAL' || node.links?.external_source)));
    if (intent) {
      if (fixture) excluded.push({ ref, location, candidate_id: node.candidate_id ?? null });
      else {
        if (typeof node.candidate_id === 'string') {
          if (seen.has(node.candidate_id)) errors.push({ ref, location, candidate_id: node.candidate_id,
            error: 'DUPLICATE_CANDIDATE_ID', first: seen.get(node.candidate_id) });
          else seen.set(node.candidate_id, { ref, location });
        }
        try { validateTutorCandidate(node, readEvidence); records.push(node); }
        catch (error) { errors.push({ ref, location, candidate_id: node.candidate_id ?? null,
          error: 'INVALID_TUTOR_CANDIDATE', detail: error.message }); }
      }
    }
    for (const [key, child] of Object.entries(node)) {
      walk(child, ref, `${location}/${key.replace(/~/g, '~0').replace(/\//g, '~1')}`, fixture);
    }
  }
  for (const { ref, bytes } of documents) {
    try { walk(JSON.parse(bytes.toString()), ref, ''); }
    catch (error) { errors.push({ ref, error: 'INVALID_JSON', detail: error.message }); }
  }
  // Never publish a partial canonical set when duplicate or invalid evidence exists.
  return { ok: errors.length === 0, candidates: errors.length ? [] : records, errors, excluded };
}

export function loadTutorCandidates(root, directories = [
  'project_brain/story_scenario_intelligence', 'project_brain/antigravity_agent_trial_v1',
]) {
  const base = realpathSync(root), readEvidence = repositoryEvidenceReader(base);
  const documents = [], errors = [], paths = new Set();
  for (const directory of directories) {
    try {
      const absolute = realpathSync(resolve(base, directory));
      const rel = relative(base, absolute);
      if (isAbsolute(rel) || rel === '..' || rel.startsWith('../') || rel.startsWith('..\\')) throw Error('Directory outside repository');
      // Same scope as ELP: every immediate .json file, including nested JSON objects.
      for (const file of readdirSync(absolute).filter(f => f.endsWith('.json')).sort()) {
        const ref = [rel.replace(/\\/g, '/'), file].filter(Boolean).join('/');
        if (paths.has(ref)) continue;
        paths.add(ref);
        try { documents.push({ ref, bytes: readEvidence(ref) }); }
        catch (error) { errors.push({ ref, error: 'UNREADABLE_CANDIDATE_SOURCE', detail: error.message }); }
      }
    } catch (error) { errors.push({ ref: directory, error: 'INVALID_SCAN_DIRECTORY', detail: error.message }); }
  }
  const result = discoverTutorCandidates(documents, readEvidence);
  errors.push(...result.errors);
  return { ...result, ok: errors.length === 0, candidates: errors.length ? [] : result.candidates,
    errors, scanned_files: documents.length };
}
