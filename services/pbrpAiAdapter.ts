import type { OptimizedPromptPlan } from './pbrpPromptOptimizer.js';
import type { SceneContext } from './pbrpKnowledgeComposer.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 * PHASE-PROJECT-BRAIN-INTEGRATION-007: PBRP Runtime Consumer Integration
 * Validation V1 -- extended with a second concrete consumer (Claude) and a
 * genuine, exported registration function so a future consumer can be
 * added ("향후 Consumer Extension Point") without editing this file.
 *
 * AI Adapter interface (04_PBRP_Execution_Architecture_Revision_V2.txt,
 * "Revision 07"): converts the Optimized Prompt Plan into a Consumer-
 * specific Final Prompt. Per PBRP's Consumer Model, "Consumer는 Runtime을
 * 직접 읽지 않는다. Consumer는 AI Adapter가 생성한 Final Prompt만 받는다."
 *
 * No network call, no external API dependency anywhere in this file -- pure
 * data-shaping functions. This does not modify any real AI Studio or Claude
 * consumer-facing code elsewhere in the repository; it only produces the
 * data those consumers would receive, for the purpose of validating PBRP's
 * own output.
 *
 * Final Prompt Contract (PHASE-007's own "Final Prompt Contract"
 * requirement): every consumer's `FinalPromptPackage` has the *same*
 * shape and the *same* required fields, regardless of how different that
 * consumer's actual textual format is. `rendered_text` is the one field
 * that is genuinely consumer-specific in content; `positive_prompt`,
 * `negative_prompt`, and `metadata` are always populated in the same way
 * (structurally) for every adapter, so any code consuming a
 * `FinalPromptPackage` can rely on a single stable contract without
 * knowing which consumer produced it.
 */

export type FinalPromptMetadata = {
  character_dna_applied: boolean;
  style_dna_applied: boolean;
  shot_grammar_applied: boolean;
  world_identity_lock: SceneContext['consistency']['world_identity_lock'];
  unresolved_capabilities: string[];
  token_estimate: number;
  reduction_ratio: number;
};

export type FinalPromptPackage = {
  consumer_id: string;
  /** The format identifier this consumer's `rendered_text` follows -- part of the stable contract so a downstream reader knows how to interpret it. */
  format_id: string;
  /** The actual, consumer-specific final output text. This is the field whose *content* legitimately differs per consumer. */
  rendered_text: string;
  /** Stable across every consumer: the primary/positive content, independent of `rendered_text`'s consumer-specific formatting. */
  positive_prompt: string;
  /** Stable across every consumer: the constraint/avoid content, independent of `rendered_text`'s consumer-specific formatting. */
  negative_prompt: string;
  metadata: FinalPromptMetadata;
};

export interface AiAdapter {
  readonly consumer_id: string;
  readonly format_id: string;
  adapt(optimized: OptimizedPromptPlan, context: SceneContext): FinalPromptPackage;
}

/** Rough, deterministic token estimate (chars/4), consistent across runs -- no external tokenizer dependency. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function buildMetadata(optimized: OptimizedPromptPlan, context: SceneContext, renderedText: string): FinalPromptMetadata {
  return {
    character_dna_applied: context.character_dna_applied,
    style_dna_applied: context.style_dna_applied,
    shot_grammar_applied: context.shot_grammar_applied,
    world_identity_lock: context.consistency.world_identity_lock,
    unresolved_capabilities: context.unresolved_capabilities,
    token_estimate: estimateTokens(renderedText),
    reduction_ratio: optimized.metrics.reduction_ratio,
  };
}

/**
 * AI Studio's native shape is a separated positive/negative prompt pair
 * (matching how the repository's own real image-generation pipeline
 * already works elsewhere -- e.g. `positive_prompt`/`negative_prompt`
 * fields). `rendered_text` mirrors `positive_prompt`: for this consumer,
 * the "rendered" submission *is* the positive field; the negative field is
 * submitted separately by the real consumer, not embedded in the text.
 */
function buildAiStudioAdapter(): AiAdapter {
  return {
    consumer_id: 'ai_studio',
    format_id: 'ai_studio_positive_negative_v1',
    adapt(optimized, context) {
      const rendered_text = optimized.positive_text;
      return {
        consumer_id: 'ai_studio',
        format_id: 'ai_studio_positive_negative_v1',
        rendered_text,
        positive_prompt: optimized.positive_text,
        negative_prompt: optimized.negative_text,
        metadata: buildMetadata(optimized, context, rendered_text + optimized.negative_text),
      };
    },
  };
}

/**
 * Claude consumes a single instructional document, not a split positive/
 * negative field pair -- so its `rendered_text` is a structured Markdown
 * instruction embedding both the scene content and the constraints
 * ("Avoid:") inline. `positive_prompt`/`negative_prompt` are still
 * populated (same content as AI Studio's) to keep the Final Prompt
 * Contract's stable fields genuinely stable across consumers, even though
 * Claude's actual rendered instruction text combines them differently.
 */
function buildClaudeAdapter(): AiAdapter {
  return {
    consumer_id: 'claude',
    format_id: 'claude_markdown_instruction_v1',
    adapt(optimized, context) {
      const rendered_text = [
        '## Scene',
        optimized.positive_text,
        '',
        '## Avoid',
        optimized.negative_text,
      ].join('\n');
      return {
        consumer_id: 'claude',
        format_id: 'claude_markdown_instruction_v1',
        rendered_text,
        positive_prompt: optimized.positive_text,
        negative_prompt: optimized.negative_text,
        metadata: buildMetadata(optimized, context, rendered_text),
      };
    },
  };
}

export const AI_STUDIO_ADAPTER: AiAdapter = buildAiStudioAdapter();
export const CLAUDE_ADAPTER: AiAdapter = buildClaudeAdapter();

const ADAPTER_REGISTRY: Map<string, AiAdapter> = new Map([
  [AI_STUDIO_ADAPTER.consumer_id, AI_STUDIO_ADAPTER],
  [CLAUDE_ADAPTER.consumer_id, CLAUDE_ADAPTER],
]);

export function getAiAdapter(consumerId: string): AiAdapter | null {
  return ADAPTER_REGISTRY.get(consumerId) ?? null;
}

export function listRegisteredConsumerIds(): string[] {
  return [...ADAPTER_REGISTRY.keys()];
}

/**
 * "향후 Consumer Extension Point": a future consumer (Codex, Gemini CLI,
 * any other AI) is added by implementing `AiAdapter` and calling this
 * function -- no change to this file, the orchestrator, or any other
 * pipeline stage is required. Registering a `consumer_id` that already
 * exists is rejected (throws) rather than silently overwriting an existing
 * adapter, since that could otherwise let one consumer's registration
 * silently break another's already-validated behavior.
 */
export function registerAiAdapter(adapter: AiAdapter): void {
  if (ADAPTER_REGISTRY.has(adapter.consumer_id)) {
    throw new Error(`PBRP_ADAPTER_ALREADY_REGISTERED: consumer_id '${adapter.consumer_id}' is already registered`);
  }
  ADAPTER_REGISTRY.set(adapter.consumer_id, adapter);
}
