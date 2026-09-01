import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { readCaptureState, assessPhaseCapture, enforcePhaseExperienceCapture } from '../services/genieOjtCaptureEnforcement.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'project_brain/story_scenario_intelligence');
const snapshot = () => readdirSync(directory).filter(f => f.endsWith('.json')).sort().map(f =>
  [f, createHash('sha256').update(readFileSync(join(directory, f))).digest('hex')]);
const before = snapshot();
const state = readCaptureState();
assert.ok(state.records.length > 0);
assert.equal(new Set(state.records.map(e => e.experience_id)).size, state.records.length);
const completions = state.documents.filter(d => d.ref.includes('completion-summary'));
assert.ok(completions.length > 0);
let missingBlocked = 0;
for (const { value } of completions) {
  assert.equal(assessPhaseCapture(state, value).status, 'CAPTURED', value.phase);
  // Remove real records only from the in-memory view; never edit stored evidence.
  const missing = { ...state, records: state.records.filter(e => e.phase !== value.phase) };
  assert.equal(assessPhaseCapture(missing, value).status, 'UNCAPTURED_REQUIRED', value.phase);
  missingBlocked++;
}
const s31 = completions.find(d => d.value.phase === 'PHASE-S31').value;
assert.equal(enforcePhaseExperienceCapture(s31).status, 'CAPTURED');
const noEvidence = { ...state, documents: state.documents.filter(d => d.value.phase !== s31.phase) };
assert.equal(assessPhaseCapture(noEvidence, s31).status, 'CAPTURE_EVIDENCE_UNRESOLVED');
const brief = state.documents.find(d => d.ref.endsWith('antigravity-agent-trial-task-brief-v1.json'));
assert.equal(assessPhaseCapture(state, brief.value).status, 'CAPTURED');
assert.equal(assessPhaseCapture({ ...state, documents: [brief] }, brief.value).status,
  'CAPTURE_REQUIREMENT_UNDETERMINED'); // A task brief alone cannot assert real execution.
assert.throws(() => enforcePhaseExperienceCapture({}), /CAPTURE_REQUIREMENT_UNDETERMINED/);

let hooks = 0;
for (const file of readdirSync(directory).filter(f => f.endsWith('.ts'))) {
  const source = readFileSync(join(directory, file), 'utf8');
  if (!source.includes('completion-summary')) continue;
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  assert.equal(parsed.parseDiagnostics.length, 0, file);
  assert.ok(parsed.statements.some(s => ts.isImportDeclaration(s) &&
    s.moduleSpecifier.text === '../../services/genieOjtCaptureEnforcement.mjs'), file);
  const writer = parsed.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === 'writeSidecar');
  assert.ok(writer, file);
  const js = ts.transpileModule(writer.getText(parsed), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  let writes = 0;
  const context = vm.createContext({ PB_SSI: directory, join,
    writeFileSync: () => { writes++; },
    enforcePhaseExperienceCapture: () => { throw new Error('UNCAPTURED_REQUIRED'); } });
  vm.runInContext(js, context);
  assert.throws(() => context.writeSidecar('project-brain-completion-summary-v1.json', s31), /UNCAPTURED_REQUIRED/, file);
  assert.equal(writes, 0, `Completion written before guard: ${file}`);
  context.writeSidecar('ordinary-sidecar.json', {});
  assert.equal(writes, 1, `Unrelated sidecar affected: ${file}`);
  hooks++;
}
assert.ok(hooks >= completions.length);
assert.deepEqual(snapshot(), before);
console.log(JSON.stringify({ verdict: 'CONTINUOUS_OJT_CAPTURE_ENFORCED',
  canonical_experiences: state.records.length, completion_writer_hooks: hooks,
  existing_completion_summaries_captured: completions.length,
  missing_capture_cases_blocked: missingBlocked, phase430_captured: true,
  evidence_absence_blocked: true, readiness_only_not_forced_to_capture: true,
  experience_records_created: 0, json_files_modified: 0,
  scope: 'Existing SSI completion-summary writers; other phase formats require explicit assessment, not assumed coverage.' }, null, 2));
