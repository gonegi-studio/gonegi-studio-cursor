// Read-only completion guard. Never creates or rewrites an Experience.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';
import { repositoryEvidenceReader } from './genieExternalTutorConsultationContract.mjs';
import { validateTutorOutcomeEvaluation } from './genieTutorOutcomeEvaluationContract.mjs';
import { validateCauseOutcomeFeedback } from './genieCausalOutcomeFeedback.mjs';
import { validateReverificationEvidence } from './genieReverificationEvidenceRequiredness.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = join(root, 'project_brain/story_scenario_intelligence');

export function readCaptureState() {
  // Reuse the canonical signature and CR-08 validator without executing phase main().
  const file = 'materializeProjectBrainPhaseS31SelfImprovingStudioIntegrityAssessmentV1.ts';
  const source = readFileSync(join(directory, file), 'utf8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const names = new Set(['isExperienceShaped', 'validateOptionalCoordinatorFields',
    'loadCanonicalExperiencesStructurally', 'isValidExperienceGoalLink']);
  const declarations = parsed.statements.filter(s => ts.isFunctionDeclaration(s) && names.has(s.name?.text));
  if (declarations.length !== names.size) throw new Error('OJT_CANONICAL_LOADER_UNAVAILABLE');
  const context = vm.createContext({ readFileSync, readdirSync, existsSync, statSync, join,
    PB_SSI: directory, REPO_ROOT: root });
  vm.runInContext(ts.transpileModule(declarations.map(s => s.getText(parsed)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText, context, { timeout: 10000 });
  const loaded = vm.runInContext('loadCanonicalExperiencesStructurally()', context, { timeout: 10000 });
  if (loaded.crossFileDuplicates.length) throw new Error('OJT_DUPLICATE_EXPERIENCE_ID');
  const records = JSON.parse(JSON.stringify(loaded.experiences));
  for (const record of records) validateTutorOutcomeEvaluation(record, repositoryEvidenceReader(root), records);
  for (const record of records) validateCauseOutcomeFeedback(record.decision, record.experience_id, record.generated_at, records);
  for (const record of records) validateReverificationEvidence(record, repositoryEvidenceReader(root));
  const goals = new Set(JSON.parse(readFileSync(join(root,
    'datasets/project_brain/goal_model_v1/project-brain-goal-model-v1.json'), 'utf8')).goal_model.goals.map(g => g.goal_id));
  for (const e of records) if (!context.isValidExperienceGoalLink(e.links, goals)) {
    throw new Error(`OJT_INVALID_GOAL_LINK: ${e.experience_id}`);
  }
  const documents = [];
  for (const rel of ['project_brain/story_scenario_intelligence', 'project_brain/antigravity_agent_trial_v1']) {
    for (const file of readdirSync(join(root, rel)).filter(f => f.endsWith('.json'))) {
      documents.push({ ref: `${rel}/${file}`, value: JSON.parse(readFileSync(join(root, rel, file), 'utf8')) });
    }
  }
  return { records, documents };
}

export function assessPhaseCapture(state, completion) {
  const phase = completion?.phase;
  if (typeof phase !== 'string' || !phase.startsWith('PHASE-')) {
    return { phase: phase ?? null, status: 'CAPTURE_REQUIREMENT_UNDETERMINED', evidence_refs: [], experience_ids: [] };
  }
  const documents = state.documents.filter(d => d.value.phase === phase && !d.value.experience_id &&
    !d.ref.includes('completion-summary'));
  // Existing E2 captures verified judgments, failures and incomplete attempts, not only successes.
  // Existing completion summaries explicitly name new_experience even for read-only/no-change phases.
  const declared = typeof completion.new_experience === 'string' && completion.new_experience.startsWith('exp_');
  const verified = documents.some(d => typeof d.value.all_clear === 'boolean' ||
    typeof d.value.regression_all_passed === 'boolean');
  const executed = documents.some(d => d.value.status === 'REAL_EXECUTION_THIS_SESSION' &&
    typeof d.value.test?.exit_code === 'number');
  const required = declared || executed || (typeof completion.final_state === 'string' && verified);
  if (!required) return { phase, status: 'CAPTURE_REQUIREMENT_UNDETERMINED',
    evidence_refs: documents.map(d => d.ref), experience_ids: [] };
  const candidates = state.records.filter(e => e.phase === phase &&
    (!declared || e.experience_id === completion.new_experience));
  const linked = candidates.filter(e => e.action?.real_or_simulated === 'real' &&
    ['hard_pass', 'hard_fail', 'attempted_incomplete'].includes(e.evidence?.evidence_kind) &&
    documents.some(d => typeof e.evidence?.evidence_source === 'string' &&
      e.evidence.evidence_source.includes(basename(d.ref))));
  return { phase, status: linked.length ? 'CAPTURED' : candidates.length ? 'CAPTURE_EVIDENCE_UNRESOLVED' : 'UNCAPTURED_REQUIRED',
    evidence_refs: documents.map(d => d.ref), experience_ids: linked.map(e => e.experience_id) };
}

export function enforcePhaseExperienceCapture(completion) {
  const assessment = assessPhaseCapture(readCaptureState(), completion);
  if (assessment.status !== 'CAPTURED') throw new Error(`OJT_CAPTURE_BLOCKED: ${JSON.stringify(assessment)}`);
  return assessment;
}
