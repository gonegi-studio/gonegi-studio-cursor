import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import { getAiAdapter, registerAiAdapter, type AiAdapter } from '../services/pbrpAiAdapter.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';
import {
  buildConsumerHandoffArtifact,
  writeConsumerHandoffArtifact,
  HANDOFF_ARTIFACT_JSON_PATH,
  HANDOFF_ARTIFACT_MD_PATH,
  type HandoffArtifact,
} from '../services/pbrpConsumerHandoffArtifact.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-008: PBRP Consumer Handoff Validation V1.
 *
 * Final consolidated validation of the PBRP Runtime -> Consumer handoff
 * boundary (re-confirming PHASE-007's 8 items are still stable), plus this
 * phase's own new requirement: generate a real, human-usable artifact for
 * *manually* handing a Final Prompt to AI Studio, and confirm the
 * artifact's content integrity end to end (in-memory -> disk -> re-read).
 * No network call, no real AI Studio invocation anywhere in this file.
 */

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const issues: string[] = [];
const results: Record<string, unknown> = {};

function check(label: string, condition: boolean, detail?: string): void {
  results[label] = condition ? 'PASS' : `FAIL${detail ? `: ${detail}` : ''}`;
  if (!condition) {
    issues.push(`${label}${detail ? ` -- ${detail}` : ''}`);
  }
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

const SAMPLE_INPUT = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';

// =========================================================================
// 1-6: Final consolidated re-verification (condensed vs. PHASE-007's 76
// checks -- confirming stability, not re-deriving every assertion)
// =========================================================================
const aiStudioRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'ai_studio');
const claudeRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'claude');

check('1_contract.ai_studio_shape', aiStudioRun.pass && !!aiStudioRun.final_prompt && ['consumer_id', 'format_id', 'rendered_text', 'positive_prompt', 'negative_prompt', 'metadata'].every((k) => k in aiStudioRun.final_prompt!));
check('1_contract.claude_shape', claudeRun.pass && !!claudeRun.final_prompt && ['consumer_id', 'format_id', 'rendered_text', 'positive_prompt', 'negative_prompt', 'metadata'].every((k) => k in claudeRun.final_prompt!));

check('2_adapter.ai_studio_registered', getAiAdapter('ai_studio') !== null);
check('2_adapter.claude_registered', getAiAdapter('claude') !== null);

check('3_rendering_diff.ai_studio_vs_claude', aiStudioRun.final_prompt?.rendered_text !== claudeRun.final_prompt?.rendered_text);
check('3_rendering_diff.claude_has_structure', (claudeRun.final_prompt?.rendered_text ?? '').includes('## Scene'));

const charId = aiStudioRun.selection?.character?.anchor_id;
const styleId = aiStudioRun.selection?.style?.composition_id;
const shotId = aiStudioRun.selection?.shot?.shot_id;
check('4_preservation.ai_studio', !!charId && !!styleId && !!shotId && [charId, styleId, shotId].every((id) => aiStudioRun.final_prompt!.rendered_text.includes(id)));
check('4_preservation.claude', !!charId && !!styleId && !!shotId && [charId, styleId, shotId].every((id) => claudeRun.final_prompt!.rendered_text.includes(id)));

check('5_traceability.same_selection_across_consumers', aiStudioRun.selection?.character?.anchor_id === claudeRun.selection?.character?.anchor_id && aiStudioRun.selection?.style?.composition_id === claudeRun.selection?.style?.composition_id && aiStudioRun.selection?.shot?.shot_id === claudeRun.selection?.shot?.shot_id);

const determinismRuns = Array.from({ length: 5 }, () => runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'ai_studio'));
check('6_determinism.5x_identical', determinismRuns.every((r) => JSON.stringify(r) === JSON.stringify(determinismRuns[0])));

// =========================================================================
// 7. Failure / Extension Point (re-confirmed, matching PHASE-007's finding)
// =========================================================================
const unknownConsumerRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'not_a_real_consumer_008');
check('7_failure.unknown_consumer_fails_cleanly', unknownConsumerRun.pass === false && unknownConsumerRun.error?.module === 'ai_adapt' && unknownConsumerRun.final_prompt === null);

const extensionAdapter: AiAdapter = {
  consumer_id: 'handoff_extension_test_v1',
  format_id: 'handoff_extension_test_format_v1',
  adapt(optimized, context) {
    const rendered_text = `PLAIN: ${optimized.positive_text} | AVOID: ${optimized.negative_text}`;
    return {
      consumer_id: 'handoff_extension_test_v1',
      format_id: 'handoff_extension_test_format_v1',
      rendered_text,
      positive_prompt: optimized.positive_text,
      negative_prompt: optimized.negative_text,
      metadata: {
        character_dna_applied: context.character_dna_applied,
        style_dna_applied: context.style_dna_applied,
        shot_grammar_applied: context.shot_grammar_applied,
        world_identity_lock: context.consistency.world_identity_lock,
        unresolved_capabilities: context.unresolved_capabilities,
        token_estimate: Math.ceil(rendered_text.length / 4),
        reduction_ratio: optimized.metrics.reduction_ratio,
      },
    };
  },
};
registerAiAdapter(extensionAdapter);
const extensionRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'handoff_extension_test_v1');
check('7_extension_point.new_consumer_runs_end_to_end', extensionRun.pass === true && (extensionRun.final_prompt?.rendered_text ?? '').startsWith('PLAIN:'));

// =========================================================================
// New for this phase: build the real manual-handoff artifact, then verify
// its integrity through a real disk round-trip (write -> read back ->
// recompute hash -> compare), not just "the file exists"
// =========================================================================
const artifact = buildConsumerHandoffArtifact([aiStudioRun, claudeRun]);
check('artifact.entry_count', artifact.entries.length === 2, `${artifact.entries.length}`);
check('artifact.source_input_matches', artifact.source_input === SAMPLE_INPUT);

writeConsumerHandoffArtifact(projectRoot, artifact);

const jsonPath = path.join(projectRoot, HANDOFF_ARTIFACT_JSON_PATH);
const mdPath = path.join(projectRoot, HANDOFF_ARTIFACT_MD_PATH);
check('artifact.json_file_exists', fs.existsSync(jsonPath));
check('artifact.md_file_exists', fs.existsSync(mdPath));

let diskArtifact: HandoffArtifact | null = null;
try {
  diskArtifact = JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as HandoffArtifact;
  check('artifact.json_well_formed', true);
} catch (e) {
  check('artifact.json_well_formed', false, e instanceof Error ? e.message : 'parse error');
}

// Consumer output integrity: for each entry actually read back from disk,
// recompute sha256 of its own rendered_text and confirm it equals the
// sha256 *also stored in that same disk file* -- proves the artifact was
// not corrupted between generation and disk, and additionally that its
// self-reported hash is honest (not a stale/mismatched value).
if (diskArtifact) {
  for (const entry of diskArtifact.entries) {
    const recomputed = sha256(entry.rendered_text);
    check(`integrity.${entry.consumer_id}.disk_hash_matches_content`, recomputed === entry.rendered_text_sha256, `recomputed=${recomputed} stored=${entry.rendered_text_sha256}`);
  }

  // Cross-check against the *original in-memory* pipeline output (not just
  // internal self-consistency of the artifact file) -- the true integrity
  // requirement is disk content === original pipeline output.
  const aiEntry = diskArtifact.entries.find((e) => e.consumer_id === 'ai_studio');
  const claudeEntry = diskArtifact.entries.find((e) => e.consumer_id === 'claude');
  check('integrity.ai_studio.matches_original_pipeline_output', aiEntry?.rendered_text === aiStudioRun.final_prompt?.rendered_text);
  check('integrity.claude.matches_original_pipeline_output', claudeEntry?.rendered_text === claudeRun.final_prompt?.rendered_text);
}

// The Markdown artifact must contain the actual copy-pasteable prompt text
// (not just a summary) -- confirmed by substring match against the real
// selected character id and the real rendered text content.
const mdContent = fs.readFileSync(mdPath, 'utf8');
check('artifact.md_contains_ai_studio_text', !!charId && mdContent.includes(charId) && mdContent.includes(aiStudioRun.final_prompt?.rendered_text ?? ' '));
check('artifact.md_contains_claude_markers', mdContent.includes('## Scene') && mdContent.includes('## Avoid'));
check('artifact.md_contains_sha256', diskArtifact ? diskArtifact.entries.every((e) => mdContent.includes(e.rendered_text_sha256)) : false);

// Mixed-input rejection: buildConsumerHandoffArtifact must refuse to merge
// runs from *different* source inputs into one artifact (would otherwise
// silently produce a misleading handoff document).
{
  const otherRealRun = runPbrpRuntimeExecutionPreparation(projectRoot, 'A tenderness and longing farewell scene at golden hour, with grief and impermanence, gentle rain in the air.', 'ai_studio');
  let rejected = false;
  try {
    buildConsumerHandoffArtifact([aiStudioRun, otherRealRun]);
  } catch (e) {
    rejected = e instanceof Error && e.message.includes('PBRP_HANDOFF_MIXED_INPUT');
  }
  check('artifact.mixed_input_rejected', rejected);
}

// =========================================================================
// 8. PASS→PASS Regression is verified externally by the caller running
// this script as 2 independent process invocations (see phase report).
// This script itself only reports its own single-run result.
// =========================================================================

// --- Compliance: no network/API pattern in any pbrp*.ts file, including
// the new artifact module -------------------------------------------------
{
  const pbrpFiles = [
    'services/pbrpKnowledgeRepository.ts',
    'services/pbrpIntentAnalyzer.ts',
    'services/pbrpKnowledgeSelector.ts',
    'services/pbrpKnowledgeComposer.ts',
    'services/pbrpPromptPlanner.ts',
    'services/pbrpPromptOptimizer.ts',
    'services/pbrpAiAdapter.ts',
    'services/pbrpRuntimeOrchestrator.ts',
    'services/pbrpConsumerHandoffArtifact.ts',
  ];
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
  for (const rel of pbrpFiles) {
    const content = fs.readFileSync(path.join(projectRoot, rel), 'utf8');
    check(`api_free.${rel}`, !apiPattern.test(content));
  }
}

// --- Report ---------------------------------------------------------------
const REPORT_PATH = 'reports/project_brain_integration/pbrp-consumer-handoff-validation-v1-report.json';
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PROJECT-BRAIN-INTEGRATION-008', generated_at: new Date().toISOString(), results, issues, artifact_paths: [HANDOFF_ARTIFACT_JSON_PATH, HANDOFF_ARTIFACT_MD_PATH] }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PROJECT_BRAIN_INTEGRATION_008_CONSUMER_HANDOFF_VALIDATION_V1' : 'FAIL_PROJECT_BRAIN_INTEGRATION_008_CONSUMER_HANDOFF_VALIDATION_V1');
console.log(
  [
    `total_checks=${checkCount}`,
    `pass_count=${checkCount - failCount}`,
    `fail_count=${failCount}`,
    `artifact_json=${HANDOFF_ARTIFACT_JSON_PATH}`,
    `artifact_md=${HANDOFF_ARTIFACT_MD_PATH}`,
  ].join(' | ')
);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
