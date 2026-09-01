import type { PromptPlan, PromptSection } from './pbrpPromptPlanner.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Prompt Optimizer (04_PBRP_Execution_Architecture_Revision_V2.txt,
 * "Revision 06"): deterministic dedup/compression of the Prompt Plan.
 * "Duplicate Removal", "Compression", "Token Optimization", "Instruction
 * Cleanup" -- no LLM call, no wording rewrite.
 */

export type OptimizedPromptSection = PromptSection & {
  original_length: number;
  optimized_length: number;
};

export type OptimizedPromptPlan = {
  sections: OptimizedPromptSection[];
  positive_text: string;
  negative_text: string;
  metrics: {
    original_char_count: number;
    optimized_char_count: number;
    reduction_ratio: number;
  };
  optimize_mode: 'deterministic_dedup_v1';
};

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Removes exact duplicate comma/pipe-separated fragments within one section. */
function dedupeFragments(text: string): string {
  const seen = new Set<string>();
  const fragments = text.split(/[,|]/).map((f) => f.trim()).filter(Boolean);
  const kept: string[] = [];
  for (const fragment of fragments) {
    const key = fragment.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      kept.push(fragment);
    }
  }
  return kept.join(', ');
}

export function optimizePrompt(plan: PromptPlan): OptimizedPromptPlan {
  const sections: OptimizedPromptSection[] = plan.sections.map((s) => {
    const original_length = s.content.length;
    const optimized = dedupeFragments(collapseWhitespace(s.content));
    return {
      ...s,
      content: optimized,
      original_length,
      optimized_length: optimized.length,
    };
  });

  const positiveSections = sections.filter((s) => s.section_id !== 'negative');
  const negativeSection = sections.find((s) => s.section_id === 'negative');

  const positive_text = positiveSections.map((s) => s.content).join('. ');
  const negative_text = negativeSection ? negativeSection.content : '';

  const original_char_count = plan.sections.reduce((sum, s) => sum + s.content.length, 0);
  const optimized_char_count = sections.reduce((sum, s) => sum + s.content.length, 0);
  const reduction_ratio = original_char_count === 0
    ? 0
    : Number(((original_char_count - optimized_char_count) / original_char_count).toFixed(4));

  return {
    sections,
    positive_text,
    negative_text,
    metrics: { original_char_count, optimized_char_count, reduction_ratio },
    optimize_mode: 'deterministic_dedup_v1',
  };
}
