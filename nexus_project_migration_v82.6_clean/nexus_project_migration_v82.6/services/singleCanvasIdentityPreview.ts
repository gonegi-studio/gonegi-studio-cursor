import type { CharacterBook } from '../types';
import { buildMasterCoreV175Snapshot } from './cinematic/aiStudioControlledJsonRebuild.fixtures';
import { buildSingleCanvasControlledGeneration } from './singleCanvasControlledGeneration';
import { detectNamedCharactersInPrompt, preserveLockedCharacterNames } from './promptBridge';

export function buildSingleCanvasIdentityPreview(controlledPrompt?: string) {
  const snapshot = buildMasterCoreV175Snapshot();
  const characterBook = snapshot.characterBook as CharacterBook;
  const prompt =
    controlledPrompt ??
    'Gonegi and Dana walk along the harbor terrace at golden hour, hopeful forward motion.';

  const pipeline = buildSingleCanvasControlledGeneration({
    controlledPrompt: prompt,
    characterBook,
  });

  const refinedSample = preserveLockedCharacterNames(
    'The boy and his companion stroll by the harbor.',
    prompt
  );

  return {
    phase: 'PHASE-33C',
    controlled_prompt: prompt,
    pipeline,
    name_lock_verification: {
      original_names: detectNamedCharactersInPrompt(prompt),
      refined_with_generic_nouns: 'The boy and his companion stroll by the harbor.',
      after_name_lock: refinedSample,
      gonegi_preserved: /\bGonegi\b/i.test(refinedSample),
      dana_preserved: /\bDana\b/i.test(refinedSample),
    },
    music_drama_parity: {
      elite_refs_injected: pipeline.debug.injected_elite_image_ids.length >= 2,
      identity_before_style:
        pipeline.debug.reference_order.findIndex((e) => e.kind === 'identity') <
        (pipeline.debug.reference_order.findIndex((e) => e.kind === 'style') >= 0
          ? pipeline.debug.reference_order.findIndex((e) => e.kind === 'style')
          : Number.MAX_SAFE_INTEGER),
      used_prompt_bridge: pipeline.debug.used_prompt_bridge,
    },
  };
}
