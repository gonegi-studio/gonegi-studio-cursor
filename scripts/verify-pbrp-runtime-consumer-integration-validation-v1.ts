import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  getAiAdapter,
  listRegisteredConsumerIds,
  registerAiAdapter,
  type AiAdapter,
  type FinalPromptPackage,
} from '../services/pbrpAiAdapter.js';
import { runPbrpRuntimeExecutionPreparation } from '../services/pbrpRuntimeOrchestrator.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-007: PBRP Runtime Consumer Integration
 * Validation V1.
 *
 * Validates the PBRP Runtime -> AI Consumer delivery boundary: the Final
 * Prompt Contract, per-consumer formatting (AI Studio, Claude), DNA
 * preservation, input->output traceability, determinism, failure handling,
 * and the "future Consumer Extension Point" mechanism -- via a real,
 * dynamically-registered test adapter, not a hypothetical claim. No
 * network call, no real AI invocation anywhere in this file.
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

const SAMPLE_INPUT = 'A scene full of freedom, romance and wonder, set in bright clear daylight.';

// =========================================================================
// 1. Final Prompt Contract -- every registered consumer's output shares the
//    same top-level shape and field types, regardless of format
// =========================================================================
{
  const requiredKeys = ['consumer_id', 'format_id', 'rendered_text', 'positive_prompt', 'negative_prompt', 'metadata'] as const;
  const requiredMetadataKeys = ['character_dna_applied', 'style_dna_applied', 'shot_grammar_applied', 'world_identity_lock', 'unresolved_capabilities', 'token_estimate', 'reduction_ratio'] as const;

  for (const consumerId of ['ai_studio', 'claude']) {
    const run = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, consumerId);
    const pkg = run.final_prompt;
    check(`contract.${consumerId}.pass`, run.pass === true);
    if (pkg) {
      for (const key of requiredKeys) {
        check(`contract.${consumerId}.has_${key}`, key in pkg, `keys=${Object.keys(pkg).join(',')}`);
      }
      for (const key of requiredMetadataKeys) {
        check(`contract.${consumerId}.metadata_has_${key}`, key in pkg.metadata);
      }
      check(`contract.${consumerId}.consumer_id_matches`, pkg.consumer_id === consumerId);
      check(`contract.${consumerId}.rendered_text_string`, typeof pkg.rendered_text === 'string' && pkg.rendered_text.length > 0);
      check(`contract.${consumerId}.positive_prompt_string`, typeof pkg.positive_prompt === 'string' && pkg.positive_prompt.length > 0);
      check(`contract.${consumerId}.negative_prompt_string`, typeof pkg.negative_prompt === 'string' && pkg.negative_prompt.length > 0);
    }
  }
}

// =========================================================================
// 2. AI Adapter 출력 -- structural validity per adapter
// =========================================================================
{
  const aiStudio = getAiAdapter('ai_studio');
  const claude = getAiAdapter('claude');
  check('adapter_output.ai_studio_registered', aiStudio !== null);
  check('adapter_output.claude_registered', claude !== null);
  check('adapter_output.ai_studio_format_id', aiStudio?.format_id === 'ai_studio_positive_negative_v1', aiStudio?.format_id);
  check('adapter_output.claude_format_id', claude?.format_id === 'claude_markdown_instruction_v1', claude?.format_id);
  check('adapter_output.registered_ids_include_both', listRegisteredConsumerIds().includes('ai_studio') && listRegisteredConsumerIds().includes('claude'));
}

// =========================================================================
// 3. Consumer별 포맷 -- AI Studio and Claude must produce genuinely
//    different rendered_text for the identical input (not just different
//    consumer_id labels on the same text)
// =========================================================================
{
  const aiStudioRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'ai_studio');
  const claudeRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'claude');
  const aiText = aiStudioRun.final_prompt?.rendered_text ?? '';
  const claudeText = claudeRun.final_prompt?.rendered_text ?? '';

  check('format.ai_studio_equals_positive_prompt', aiText === aiStudioRun.final_prompt?.positive_prompt, 'AI Studio rendered_text should exactly mirror positive_prompt (its native split format)');
  check('format.claude_has_markdown_headers', claudeText.includes('## Scene') && claudeText.includes('## Avoid'), claudeText.slice(0, 80));
  check('format.claude_differs_from_ai_studio', claudeText !== aiText);
  check('format.claude_embeds_negative_inline', claudeText.includes(claudeRun.final_prompt?.negative_prompt ?? ' '), 'Claude format should embed the negative/avoid content inline, unlike AI Studio');
}

// =========================================================================
// 4. Character / Style / Shot Grammar 보존 -- preserved across the format
//    transformation for every consumer, not just AI Studio
// =========================================================================
{
  for (const consumerId of ['ai_studio', 'claude']) {
    const run = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, consumerId);
    const text = run.final_prompt?.rendered_text ?? '';
    const charId = run.selection?.character?.anchor_id;
    const styleId = run.selection?.style?.composition_id;
    const shotId = run.selection?.shot?.shot_id;
    check(`preservation.${consumerId}.character_id_present`, !!charId && text.includes(charId), charId);
    check(`preservation.${consumerId}.style_id_present`, !!styleId && text.includes(styleId), styleId);
    check(`preservation.${consumerId}.shot_id_present`, !!shotId && text.includes(shotId), shotId);
    check(`preservation.${consumerId}.metadata_flags_true`, run.final_prompt?.metadata.character_dna_applied === true && run.final_prompt?.metadata.style_dna_applied === true && run.final_prompt?.metadata.shot_grammar_applied === true);
  }
}

// =========================================================================
// 5. Input -> Final Prompt Traceability -- the same input, run against two
//    different consumers, must resolve to the *identical* underlying
//    selection (selection must be consumer-independent; only rendering
//    differs)
// =========================================================================
{
  const aiStudioRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'ai_studio');
  const claudeRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'claude');
  check('traceability.same_character_across_consumers', aiStudioRun.selection?.character?.anchor_id === claudeRun.selection?.character?.anchor_id);
  check('traceability.same_style_across_consumers', aiStudioRun.selection?.style?.composition_id === claudeRun.selection?.style?.composition_id);
  check('traceability.same_shot_across_consumers', aiStudioRun.selection?.shot?.shot_id === claudeRun.selection?.shot?.shot_id);
  check('traceability.same_intent_id', aiStudioRun.intent?.intent_id === claudeRun.intent?.intent_id);
}

// =========================================================================
// 6. Deterministic 반복성 -- per consumer, 5 repeated runs
// =========================================================================
{
  for (const consumerId of ['ai_studio', 'claude']) {
    const runs = Array.from({ length: 5 }, () => runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, consumerId));
    const serialized = runs.map((r) => JSON.stringify(r));
    check(`determinism.${consumerId}.5x_identical`, serialized.every((s) => s === serialized[0]));
  }
}

// =========================================================================
// 7. Failure / Invalid Consumer 처리
// =========================================================================
{
  const unknown = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'not_a_real_consumer');
  check('failure.unknown_consumer_pass_false', unknown.pass === false);
  check('failure.unknown_consumer_error_module', unknown.error?.module === 'ai_adapt', unknown.error?.module);
  check('failure.unknown_consumer_no_final_prompt', unknown.final_prompt === null);

  // Extension point: registering an adapter for an *already-registered*
  // consumer_id must be rejected, not silently overwrite the existing one.
  let duplicateRejected = false;
  try {
    registerAiAdapter({ consumer_id: 'ai_studio', format_id: 'bogus', adapt: () => { throw new Error('unused'); } });
  } catch (e) {
    duplicateRejected = e instanceof Error && e.message.includes('PBRP_ADAPTER_ALREADY_REGISTERED');
  }
  check('failure.duplicate_registration_rejected', duplicateRejected);
  check('failure.ai_studio_adapter_unaffected_by_rejected_duplicate', getAiAdapter('ai_studio')?.format_id === 'ai_studio_positive_negative_v1', 'a rejected duplicate registration must not have mutated the existing adapter');
}

// =========================================================================
// "향후 Consumer Extension Point" -- prove it with a real, dynamically
// registered test adapter, not just a design claim
// =========================================================================
{
  const testAdapter: AiAdapter = {
    consumer_id: 'future_ai_test_v1',
    format_id: 'future_ai_generic_json_v1',
    adapt(optimized, context): FinalPromptPackage {
      const rendered_text = JSON.stringify({ scene: optimized.positive_text, avoid: optimized.negative_text });
      return {
        consumer_id: 'future_ai_test_v1',
        format_id: 'future_ai_generic_json_v1',
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

  registerAiAdapter(testAdapter);
  check('extension_point.registered_without_editing_adapter_file', getAiAdapter('future_ai_test_v1') !== null);

  const extRun = runPbrpRuntimeExecutionPreparation(projectRoot, SAMPLE_INPUT, 'future_ai_test_v1');
  check('extension_point.pipeline_runs_with_new_consumer', extRun.pass === true);
  check('extension_point.dna_preserved_in_new_format', !!extRun.selection?.character?.anchor_id && (extRun.final_prompt?.rendered_text ?? '').includes(extRun.selection!.character!.anchor_id));
  check('extension_point.contract_shape_still_matches', extRun.final_prompt !== null && 'format_id' in (extRun.final_prompt as object) && 'rendered_text' in (extRun.final_prompt as object) && 'positive_prompt' in (extRun.final_prompt as object) && 'negative_prompt' in (extRun.final_prompt as object) && 'metadata' in (extRun.final_prompt as object));
}

// =========================================================================
// API-Free confirmation (structural scan of the 8 pipeline files this
// phase validates -- NOT including this verify script itself: the scan
// pattern below is guaranteed to self-match its own source text, e.g. the
// literal substring "fetch(" inside the regex definition, which produced a
// genuine false positive during this phase's own first run before this
// exclusion was added -- caught and fixed, not silently avoided)
// =========================================================================
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
  ];
  const apiPattern = /fetch\(|axios|http\.request|https\.request|openai|anthropic|XMLHttpRequest|WebSocket|process\.env\.[A-Z_]*KEY/i;
  for (const rel of pbrpFiles) {
    const content = fs.readFileSync(path.join(projectRoot, rel), 'utf8');
    check(`api_free.${rel}`, !apiPattern.test(content));
  }
}

// --- Report ---------------------------------------------------------------
const REPORT_DIR = 'reports/project_brain_integration';
const REPORT_PATH = 'reports/project_brain_integration/pbrp-runtime-consumer-integration-validation-v1-report.json';
fs.mkdirSync(path.join(projectRoot, REPORT_DIR), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, REPORT_PATH),
  `${JSON.stringify({ phase: 'PHASE-PROJECT-BRAIN-INTEGRATION-007', generated_at: new Date().toISOString(), results, issues }, null, 2)}\n`,
  'utf8'
);

const checkCount = Object.keys(results).length;
const failCount = issues.length;

console.log(issues.length === 0 ? 'PASS_PROJECT_BRAIN_INTEGRATION_007_RUNTIME_CONSUMER_INTEGRATION_VALIDATION_V1' : 'FAIL_PROJECT_BRAIN_INTEGRATION_007_RUNTIME_CONSUMER_INTEGRATION_VALIDATION_V1');
console.log(
  [
    `total_checks=${checkCount}`,
    `pass_count=${checkCount - failCount}`,
    `fail_count=${failCount}`,
    `consumers=ai_studio,claude,future_ai_test_v1(extension-point-only)`,
  ].join(' | ')
);

if (issues.length > 0) {
  for (const issue of issues) {
    console.error(`[error] ${issue}`);
  }
  process.exit(1);
}

process.exit(0);
