import type { CharacterBook, GhibliAnchor } from '../types';
import { PromptBridge, preserveLockedCharacterNames } from './promptBridge';
import { selectMasterAssets } from './selectMasterAssets';

export const SINGLE_CANVAS_CONTROLLED_VERSION = 'PHASE-33C-v1' as const;

export interface SingleCanvasIdentityDebug {
  detected_characters: string[];
  injected_elite_image_ids: string[];
  reference_order: Array<{ kind: string; ref_id: string; slot_id?: string; character_name?: string }>;
  used_prompt_bridge: boolean;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  preserved_name_tokens: string[];
}

export interface SingleCanvasControlledGenerationResult {
  version: typeof SINGLE_CANVAS_CONTROLLED_VERSION;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  controlled_prompt: string;
  bridged_prompt?: string;
  refined_prompt?: string;
  debug: SingleCanvasIdentityDebug;
}

export interface SingleCanvasControlledGenerationInput {
  controlledPrompt: string;
  characterBook: CharacterBook;
  styleAnchors?: GhibliAnchor[];
  refinedPrompt?: string;
}

export function buildSingleCanvasControlledGeneration(
  input: SingleCanvasControlledGenerationInput
): SingleCanvasControlledGenerationResult {
  const assetSelection = selectMasterAssets({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    styleAnchors: input.styleAnchors,
  });

  const baseDebug: SingleCanvasIdentityDebug = {
    detected_characters: assetSelection.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    used_prompt_bridge: false,
    readiness: assetSelection.readiness,
    blocked_reason: assetSelection.blocked_reason,
    preserved_name_tokens: [],
  };

  if (assetSelection.readiness !== 'READY') {
    return {
      version: SINGLE_CANVAS_CONTROLLED_VERSION,
      readiness: 'NOT_READY',
      blocked_reason: assetSelection.blocked_reason,
      controlled_prompt: input.controlledPrompt,
      debug: baseDebug,
    };
  }

  const bridgeResult = PromptBridge.bridge({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    identityRefs: assetSelection.identity_refs,
    styleAnchor: input.characterBook.styleAnchor,
    environmentDna: input.characterBook.environmentDNA?.global,
  });

  const refinedRaw = input.refinedPrompt ?? input.controlledPrompt;
  const refined_prompt = preserveLockedCharacterNames(refinedRaw, input.controlledPrompt);

  return {
    version: SINGLE_CANVAS_CONTROLLED_VERSION,
    readiness: 'READY',
    controlled_prompt: input.controlledPrompt,
    bridged_prompt: bridgeResult.bridged_prompt,
    refined_prompt,
    debug: {
      detected_characters: bridgeResult.detected_characters,
      injected_elite_image_ids: assetSelection.injected_elite_image_ids,
      reference_order: assetSelection.reference_order,
      used_prompt_bridge: true,
      readiness: 'READY',
      preserved_name_tokens: bridgeResult.preserved_name_tokens,
    },
  };
}
