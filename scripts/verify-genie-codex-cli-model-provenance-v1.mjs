// In-memory contract cases only. No CLI process, network call or Candidate persistence.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import ts from 'typescript';
import { validateTutorCandidate } from '../services/genieExternalTutorConsultationContract.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = readFileSync(join(root, 'scripts/verify-genie-external-tutor-contract-v1.mjs'), 'utf8');
const parsed = ts.createSourceFile('fixture.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const declaration = parsed.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'fixture');
const context = vm.createContext({ Buffer, sha, assert });
vm.runInContext(declaration.getText(parsed), context);
const fixture = () => {
  const f = context.fixture(), s = f.candidate.links.external_source;
  s.access_path = 'CLI_SUBSCRIPTION'; s.requested_model = s.model; s.actual_model = 'UNKNOWN';
  for (const evidence of [f.query, f.response]) {
    evidence.access_path = s.access_path; evidence.requested_model = s.requested_model;
  }
  s.query_evidence_sha256 = f.put('fixture/query.json', f.query);
  f.response.query_evidence_sha256 = s.query_evidence_sha256;
  s.response_evidence_sha256 = f.put('fixture/response.json', f.response);
  return f;
};
const known = () => {
  const f = fixture(), s = f.candidate.links.external_source;
  s.actual_model = 'fixture_serving_model';
  const proof = { candidate_id: f.candidate.candidate_id, provider: s.provider,
    query_evidence_sha256: s.query_evidence_sha256, metadata: { serving_model: s.actual_model } };
  s.actual_model_evidence = { ref: 'fixture/model-evidence.json',
    sha256: f.put('fixture/model-evidence.json', proof), location: '/metadata/serving_model' };
  return { ...f, proof };
};
let checks = 0;
const validate = f => validateTutorCandidate(f.candidate, f.read);
const legacy = context.fixture(); validate(legacy); checks++;
const unknown = fixture(), snapshot = JSON.stringify(unknown.candidate);
validate(unknown); assert.equal(JSON.stringify(unknown.candidate), snapshot); checks++;
validate(known()); checks++;
const reject = (change, factory = fixture) => {
  const f = factory(); change(f, f.candidate.links.external_source);
  assert.throws(() => validate(f)); checks++;
};
reject((f, s) => { delete s.requested_model; });
reject((f, s) => { s.requested_model = ''; });
reject((f, s) => { s.requested_model = 'different'; });
reject((f, s) => { delete s.actual_model; });
reject((f, s) => { s.actual_model = 'inferred-from-cli-name'; });
reject((f, s) => { s.actual_model = null; });
reject((f, s) => { s.actual_model_evidence = {}; });
reject((f, s) => { delete s.provider; f.candidate.executable = 'codex.exe'; });
reject((f, s) => { f.response.access_path = 'different'; s.response_evidence_sha256 = f.put('fixture/response.json', f.response); });
reject((f, s) => { s.actual_model_evidence.sha256 = '0'.repeat(64); }, known);
reject((f, s) => { s.actual_model_evidence.location = '/missing'; }, known);
reject((f, s) => { s.actual_model_evidence.location = '/bad~2pointer'; }, known);
reject((f, s) => { s.actual_model = 'not-in-evidence'; }, known);
reject((f, s) => { f.files.delete(s.actual_model_evidence.ref); }, known);
reject((f, s) => { f.proof.provider = 'different'; s.actual_model_evidence.sha256 = f.put(s.actual_model_evidence.ref, f.proof); }, known);
reject((f, s) => { f.proof.candidate_id = 'different'; s.actual_model_evidence.sha256 = f.put(s.actual_model_evidence.ref, f.proof); }, known);
reject((f, s) => { f.proof.query_evidence_sha256 = '0'.repeat(64); s.actual_model_evidence.sha256 = f.put(s.actual_model_evidence.ref, f.proof); }, known);
reject((f, s) => { s.actual_model_evidence = { ref: s.query_evidence_ref, sha256: s.query_evidence_sha256, location: '/model' }; }, known);
reject((f, s) => { s.actual_model = s.requested_model; f.proof.requested_model = s.requested_model;
  s.actual_model_evidence.location = '/requested_model'; s.actual_model_evidence.sha256 = f.put(s.actual_model_evidence.ref, f.proof); }, known);
const cache = fixture(); cache.candidate.models_cache_error = 'fixture cache warning'; validate(cache); checks++;
reject((f, s) => { s.actual_model = s.requested_model;
  s.actual_model_evidence = { ref: s.response_evidence_ref, sha256: s.response_evidence_sha256, location: '/model' }; });
console.log(JSON.stringify({ verdict: 'CODEX_CLI_MODEL_PROVENANCE_CONTRACT_INTEGRATED', fixture_checks: checks,
  unknown_actual_model_accepted: true, legacy_api_contract_preserved: true,
  cli_processes: 0, external_calls: 0, candidates_created: 0, fixtures: 'IN_MEMORY_ONLY' }, null, 2));
