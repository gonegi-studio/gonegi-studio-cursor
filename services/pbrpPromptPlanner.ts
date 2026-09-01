import type { SceneContext } from './pbrpKnowledgeComposer.js';

/**
 * PHASE-PROJECT-BRAIN-INTEGRATION-005: PBRP Runtime Execution Preparation V1.
 *
 * Prompt Planner (04_PBRP_Execution_Architecture_Revision_V2.txt,
 * "Revision 05"): converts a Scene Context into an ordered Prompt Plan.
 * Deterministic structuring only -- no wording generation beyond fixed
 * templates, no LLM call.
 *
 * Section ids reuse the vocabulary already established by the existing,
 * real prompt-assembly convention in this repository
 * (`services/movieAnalysisPromptAssemblyEngine.ts`'s `PromptSectionId`:
 * scene/camera/emotion/style/continuity/negative) so this pipeline's output
 * is directly comparable to that existing convention, per this phase's own
 * "기존 AI Studio 결과 품질과 비교" requirement.
 */

export type PromptSectionId = 'scene' | 'camera' | 'emotion' | 'style' | 'continuity' | 'negative';

export type PromptSection = {
  section_id: PromptSectionId;
  section_order: number;
  content: string;
};

export type PromptPlan = {
  sections: PromptSection[];
  plan_mode: 'deterministic_structure_v1';
};

// Fixed instruction order (Revision 05: "Instruction Order", "Priority",
// "Section Planning"). Character/shot go into `scene`+`camera`, style into
// `style`, lighting is folded into `camera` (it is a camera/rendering
// concern in the existing convention, not a separate section id), the
// consistency rule into `continuity`, and negative rules into `negative`.
const SECTION_ORDER: readonly PromptSectionId[] = ['scene', 'camera', 'emotion', 'style', 'continuity', 'negative'];

export function planPrompt(context: SceneContext): PromptPlan {
  const sections: PromptSection[] = [];

  sections.push({
    section_id: 'scene',
    section_order: SECTION_ORDER.indexOf('scene'),
    content: context.character_summary
      ? `Character: ${context.character_summary}`
      : 'Character: (unresolved -- no Character DNA selected)',
  });

  sections.push({
    section_id: 'camera',
    section_order: SECTION_ORDER.indexOf('camera'),
    content: [
      context.shot_summary ? `Shot: ${context.shot_summary}` : 'Shot: (unresolved -- no Shot Grammar selected)',
      `Lighting: ${context.lighting.descriptor} (time_of_day=${context.lighting.time_of_day}, weather=${context.lighting.weather})`,
    ].join(' | '),
  });

  sections.push({
    section_id: 'emotion',
    section_order: SECTION_ORDER.indexOf('emotion'),
    content: context.character_summary
      ? `Emotional tone drawn from the selected Character DNA and Shot Grammar.`
      : 'Emotional tone: unresolved.',
  });

  sections.push({
    section_id: 'style',
    section_order: SECTION_ORDER.indexOf('style'),
    content: context.style_summary
      ? `Style: ${context.style_summary}`
      : 'Style: (unresolved -- no Style DNA selected)',
  });

  sections.push({
    section_id: 'continuity',
    section_order: SECTION_ORDER.indexOf('continuity'),
    content: `${context.consistency.rule_text} (world_identity_lock=${context.consistency.world_identity_lock})`,
  });

  sections.push({
    section_id: 'negative',
    section_order: SECTION_ORDER.indexOf('negative'),
    content: context.negative_rules.join(', '),
  });

  return {
    sections: sections.sort((a, b) => a.section_order - b.section_order),
    plan_mode: 'deterministic_structure_v1',
  };
}
