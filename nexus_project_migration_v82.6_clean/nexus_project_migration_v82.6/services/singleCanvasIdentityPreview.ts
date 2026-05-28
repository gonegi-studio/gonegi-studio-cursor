import type { CharacterBook } from '../types';
import { buildMasterCoreV175Snapshot } from './cinematic/aiStudioControlledJsonRebuild.fixtures';
import { buildSingleCanvasControlledGeneration } from './singleCanvasControlledGeneration';
import { preserveLockedCharacterNames } from './promptBridge';
import { detectCharactersInPromptWithAnchorDna } from './loadCharacterAnchorDNA';

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

  const bridged = pipeline.bridged_prompt ?? '';

  return {
    phase: 'PHASE-33E',
    controlled_prompt: prompt,
    pipeline,
    character_anchor_dna_preview: pipeline.character_anchor_dna_preview,
    name_lock_verification: {
      original_names: detectCharactersInPromptWithAnchorDna(prompt).map((r) => r.name),
      refined_with_generic_nouns: 'The boy and his companion stroll by the harbor.',
      after_name_lock: refinedSample,
      gonegi_preserved: /\bGonegi\b/i.test(refinedSample),
      dana_preserved: /\bDana\b/i.test(refinedSample),
    },
    anchor_dna_verification: {
      gonegi_facial_dna_in_prompt: bridged.includes('Gonegi facial topology'),
      dana_facial_dna_in_prompt: bridged.includes('Dana facial topology'),
      character_dna_lock_in_prompt: bridged.includes('[CHARACTER_DNA_LOCK]'),
      identity_before_style: pipeline.debug.identity_before_style === true,
    },
    music_drama_parity: {
      elite_refs_injected: pipeline.debug.injected_elite_image_ids.length >= 2,
      identity_before_style: pipeline.debug.identity_before_style === true,
      used_prompt_bridge: pipeline.debug.used_prompt_bridge,
      dna_source: pipeline.debug.dna_source ?? 'anchor_slot_json',
    },
  };
}
