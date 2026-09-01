// Reuse the existing in-memory consultation fixture; never execute a provider or persist it.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { validateTutorCandidate, validateTutorProblemContext } from '../services/genieExternalTutorConsultationContract.mjs';
import { discoverTutorCandidates, loadTutorCandidates } from '../services/genieTutorCandidateLoader.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const directory = join(root, 'project_brain/story_scenario_intelligence');
const snapshot = () => readdirSync(directory).filter(f => f.endsWith('.json')).sort().map(f => [f, sha(readFileSync(join(directory, f)))]);
const before = snapshot();
const source = readFileSync(join(root, 'scripts/verify-genie-external-tutor-contract-v1.mjs'), 'utf8');
const parsed = ts.createSourceFile('fixture.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const declaration = parsed.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'fixture');
const context = vm.createContext({ Buffer, sha, assert });
vm.runInContext(declaration.getText(parsed), context);
const fixture = () => context.fixture();
const doc = (ref, value) => ({ ref, bytes: Buffer.from(JSON.stringify(value)) });
let checks = 0;
const rejectContext = edit => { const f = fixture(); edit(f.query.problem_context, f);
  assert.throws(() => validateTutorProblemContext(f.query.problem_context, f.read)); checks++; };
for (const field of ['source_ref', 'source_sha256', 'source_field_location']) rejectContext(c => { delete c[field]; });
rejectContext(c => { c.source_sha256 = '0'.repeat(64); });
rejectContext(c => { c.source_field_location = '/missing'; });
rejectContext(c => { c.source_field_location = '/bad~2pointer'; });
rejectContext(c => { c.problem = 'Inferred problem'; });
rejectContext(c => { c.action_type = 'invented_type'; });
rejectContext(c => { c.cause_type = 'invented_cause'; });
rejectContext(c => { c.problem_type = 'new_taxonomy'; });
const noTypes = fixture(); delete noTypes.query.problem_context.action_type; delete noTypes.query.problem_context.cause_type;
validateTutorProblemContext(noTypes.query.problem_context, noTypes.read); checks++;
const pointer = fixture();
pointer.query.problem_context.source_sha256 = pointer.put('fixture/basis.json', { 'a/b': { '~text': 'Fixture problem' } });
pointer.query.problem_context.source_field_location = '/a~1b/~0text';
delete pointer.query.problem_context.action_type; delete pointer.query.problem_context.cause_type;
validateTutorProblemContext(pointer.query.problem_context, pointer.read); checks++;
pointer.query.problem_context.action_type = 'investigation';
assert.throws(() => validateTutorProblemContext(pointer.query.problem_context, pointer.read)); checks++;
// An edit to context without renewing the existing query hash must fail.
const tampered = fixture(); tampered.query.problem_context.problem = 'Changed';
tampered.put('fixture/query.json', tampered.query);
assert.throws(() => validateTutorCandidate(tampered.candidate, tampered.read)); checks++;

const f = fixture();
// Non-fixture-shaped ID is used ONLY in this in-memory positive discovery test.
f.candidate.candidate_id = f.query.candidate_id = f.response.candidate_id = 'candidate_structural_probe';
f.candidate.links.external_source.query_evidence_sha256 = f.put('fixture/query.json', f.query);
f.response.query_evidence_sha256 = f.candidate.links.external_source.query_evidence_sha256;
f.candidate.links.external_source.response_evidence_sha256 = f.put('fixture/response.json', f.response);
const nested = doc('arbitrary-name.json', { envelope: [f.candidate] });
const found = discoverTutorCandidates([nested], f.read);
assert.equal(found.ok, true); assert.equal(found.candidates.length, 1); checks++;
const duplicate = discoverTutorCandidates([nested, doc('other-name.json', f.candidate)], f.read);
assert.equal(duplicate.ok, false); assert.equal(duplicate.candidates.length, 0);
assert.ok(duplicate.errors.some(e => e.error === 'DUPLICATE_CANDIDATE_ID')); checks++;
const invalid = structuredClone(f.candidate); delete invalid.candidate_id;
const bad = discoverTutorCandidates([nested, doc('invalid.json', invalid)], f.read);
assert.equal(bad.ok, false); assert.equal(bad.candidates.length, 0);
assert.ok(bad.errors.some(e => e.error === 'INVALID_TUTOR_CANDIDATE')); checks++;
const excluded = discoverTutorCandidates([doc('ordinary.json', { fixture_only: true, nested: f.candidate }),
  doc('another.json', fixture().candidate)], f.read);
assert.equal(excluded.ok, true); assert.equal(excluded.candidates.length, 0); assert.equal(excluded.excluded.length, 2); checks++;
const malformed = discoverTutorCandidates([{ ref: 'broken.json', bytes: Buffer.from('{') }], f.read);
assert.equal(malformed.ok, false); assert.equal(malformed.errors[0].error, 'INVALID_JSON'); checks++;
assert.equal(discoverTutorCandidates([doc('legacy.json', { candidate_id: 'legacy', candidate_type: 'improvement' })], f.read).candidates.length, 0); checks++;
const live = loadTutorCandidates(root);
assert.equal(live.ok, true, JSON.stringify(live.errors));
assert.equal(live.errors.length, 0);
assert.equal(new Set(live.candidates.map(c => c.candidate_id)).size, live.candidates.length);
assert.ok(live.candidates.every(c => c.links?.provenance_source === 'EXTERNAL')); checks++;
assert.equal(loadTutorCandidates(root, ['../']).ok, false); checks++;
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({ verdict: 'TUTOR_PROBLEM_CONTEXT_AND_CANDIDATE_LOADING_INTEGRATED',
  fixture_checks: checks, scanned_files: live.scanned_files, real_tutor_candidates: live.candidates.length,
  invalid: live.errors.length, fixtures_excluded: live.excluded.length,
  consultations_created: 0, external_calls: 0, json_files_modified: 0 }, null, 2));
