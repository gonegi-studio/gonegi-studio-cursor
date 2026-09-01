import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Unit / Integration Verification + PASS->PASS Regression + AI Studio
 * Consumer Final Prompt verification, per this phase's own Workflow steps
 * 5-7. No network call, no external API -- runs the deterministic pipeline
 * in-process against real Titanic movie-reconstruction registry data.
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];

// Sample 1: real emotion keywords that exactly match an existing Character
// DNA entry (titanic_bow_pose's emotion is literally "freedom, romance,
// wonder"), with a clear lighting signal (day + clear).
const SAMPLE_1 = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';

// Sample 2: a different real emotion combination (grief, devotion,
// tenderness, impermanence), golden hour + rain, to confirm the pipeline
// selects a *different* character/style/shot deterministically.
const SAMPLE_2 = 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.';

// Sample 3: no matching emotion keyword at all -- must FAIL cleanly at
// knowledge_selection with a recorded cause, not crash or silently pass.
const SAMPLE_3 = 'A quiet abstract scene about mathematics and geometry.';

// --- Sample 1: run twice for determinism / PASS->PASS regression -------
const run1a = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_1, 'ai_studio');
const run1b = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_1, 'ai_studio');

if (!run1a.pass) {
  issues.push(`SAMPLE_1 unexpectedly failed: ${JSON.stringify(run1a.error)}`);
}
const deterministic = JSON.stringify(run1a) === JSON.stringify(run1b);
if (!deterministic) {
  issues.push('SAMPLE_1 run twice produced non-identical output -- pipeline is not deterministic');
}

// --- Sample 2: Character DNA / Style DNA / Shot Grammar application ----
const run2 = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_2, 'ai_studio');
if (!run2.pass) {
  issues.push(`SAMPLE_2 unexpectedly failed: ${JSON.stringify(run2.error)}`);
}
if (run2.final_prompt) {
  if (!run2.final_prompt.metadata.character_dna_applied) issues.push('SAMPLE_2: Character DNA not applied');
  if (!run2.final_prompt.metadata.style_dna_applied) issues.push('SAMPLE_2: Style DNA not applied');
  if (!run2.final_prompt.metadata.shot_grammar_applied) issues.push('SAMPLE_2: Shot Grammar not applied');
  if (run2.final_prompt.metadata.world_identity_lock !== 'PASS') issues.push('SAMPLE_2: world_identity_lock not PASS');
  if (run2.final_prompt.negative_prompt.trim().length === 0) issues.push('SAMPLE_2: negative_prompt is empty');
  if (run2.scene_context?.character_summary && !run2.final_prompt.positive_prompt.includes(run2.scene_context.character_summary.split(':')[0])) {
    issues.push('SAMPLE_2: selected character anchor id not traceable in the final positive prompt');
  }
}
// Confirm the lighting descriptor never contradicts its own time_of_day/
// weather label (caught as a real bug during this phase's own
// verification: an exact-combo miss silently fell through to the fully
// generic default while still being labeled with a specific
// time_of_day/weather).
if (run2.scene_context) {
  const { time_of_day, weather, descriptor } = run2.scene_context.lighting;
  if (time_of_day !== 'unspecified' && descriptor === 'neutral, balanced natural light') {
    issues.push(`SAMPLE_2: lighting descriptor is the generic default but time_of_day is labeled '${time_of_day}'/weather '${weather}' -- descriptor does not reflect its own label`);
  }
}

// Confirm sample 1 and sample 2 selected *different* knowledge (proves
// selection is genuinely driven by the input, not hardcoded).
if (run1a.selection && run2.selection && run1a.selection.character?.anchor_id === run2.selection.character?.anchor_id) {
  issues.push('SAMPLE_1 and SAMPLE_2 selected the identical character despite different emotion queries -- selection may be hardcoded');
}

// --- Sample 3: clean failure path ---------------------------------------
const run3 = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_3, 'ai_studio');
if (run3.pass) {
  issues.push('SAMPLE_3 (no matching emotion keyword) unexpectedly passed -- should fail with an unresolved capability');
}
if (run3.error === null || run3.error.module !== 'knowledge_selection') {
  issues.push(`SAMPLE_3 failed for the wrong reason: ${JSON.stringify(run3.error)}`);
}
const skippedAfterFailure = run3.trace.filter((t) => t.status === 'SKIPPED');
if (skippedAfterFailure.length === 0) {
  issues.push('SAMPLE_3 failure did not record any SKIPPED downstream stages');
}

// --- Section-coverage comparison against the existing real convention --
// (movieAnalysisPromptAssemblyEngine.ts's PromptSectionId: scene, camera,
// emotion, style, continuity, negative)
const EXISTING_CONVENTION_SECTIONS = ['scene', 'camera', 'emotion', 'style', 'continuity', 'negative'];
if (run2.prompt_plan) {
  const producedSections = run2.prompt_plan.sections.map((s) => s.section_id);
  const missingFromConvention = EXISTING_CONVENTION_SECTIONS.filter((s) => !producedSections.includes(s as never));
  if (missingFromConvention.length > 0) {
    issues.push(`Prompt Plan is missing sections present in the existing convention: ${missingFromConvention.join(', ')}`);
  }
}

// --- API-free confirmation (structural, not just runtime) --------------
const pbrpServiceFiles = [
  'services/pbrpKnowledgeRepository.ts',
  'services/pbrpIntentAnalyzer.ts',
  'services/pbrpKnowledgeSelector.ts',
  'services/pbrpKnowledgeComposer.ts',
  'services/pbrpPromptPlanner.ts',
  'services/pbrpPromptOptimizer.ts',
  'services/pbrpAiAdapter.ts',
  'services/pbrpRuntimeOrchestrator.ts',
];
const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
for (const rel of pbrpServiceFiles) {
  const full = path.join(projectRoot, rel);
  if (!fs.existsSync(full)) {
    issues.push(`MISSING FILE: ${rel}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (apiPattern.test(content)) {
    issues.push(`${rel} contains a network/API pattern -- violates "외부 API 신규 의존 금지"`);
  }
}

// --- Report --------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-runtime-execution-preparation-v1-verification.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify(
    {
      phase: 'PHASE-PROJECT-BRAIN-INTEGRATION-005',
      generated_at: new Date().toISOString(),
      determinism_pass: deterministic,
      sample_1: { pass: run1a.pass, trace: run1a.trace, final_prompt: run1a.final_prompt },
      sample_2: { pass: run2.pass, trace: run2.trace, final_prompt: run2.final_prompt },
      sample_3: { pass: run3.pass, trace: run3.trace, error: run3.error },
      issues,
    },
    null,
    2
  )}\n`,
  'utf8'
);

console.log(issues.length === 0 ? 'PASS_PROJECT_BRAIN_INTEGRATION_005_RUNTIME_EXECUTION_PREPARATION_V1' : 'FAIL_PROJECT_BRAIN_INTEGRATION_005_RUNTIME_EXECUTION_PREPARATION_V1');
console.log(
  [
    `determinism_pass=${deterministic}`,
    `sample_1_pass=${run1a.pass}`,
    `sample_2_pass=${run2.pass}`,
    `sample_2_character=${run2.selection?.character?.anchor_id ?? 'none'}`,
    `sample_2_style=${run2.selection?.style?.composition_id ?? 'none'}`,
    `sample_2_shot=${run2.selection?.shot?.shot_id ?? 'none'}`,
    `sample_3_expected_fail=${!run3.pass}`,
    `sample_3_fail_module=${run3.error?.module ?? 'none'}`,
    `issue_count=${issues.length}`,
  ].join(' | ')
);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
