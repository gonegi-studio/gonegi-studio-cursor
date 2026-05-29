import type { CharacterBook, CharacterAnchorDnaPreview, GhibliAnchor } from '../types';
import { PromptBridge, preserveLockedCharacterNames } from './promptBridge';
import { selectMasterAssets } from './selectMasterAssets';
import {
  type CharacterAnchorDnaDebug,
  detectCharactersInPromptWithAnchorDna,
  validateAnchorDnaForCharacters,
  validateCompiledPromptDnaContent,
} from './loadCharacterAnchorDNA';
import {
  ESTIMATED_BRIDGED_PROMPT_BASELINE,
  resolveSceneContinuityForPrompt,
} from './sceneContinuityResolver';

export const SINGLE_CANVAS_CONTROLLED_VERSION = 'PHASE-35B-v1' as const;

export interface SingleCanvasIdentityDebug {
  detected_characters: string[];
  injected_elite_image_ids: string[];
  reference_order: Array<{ kind: string; ref_id: string; slot_id?: string; character_name?: string }>;
  used_prompt_bridge: boolean;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  preserved_name_tokens: string[];
  dna_source?: 'character_anchor.index.json';
  injected_character_dna?: CharacterAnchorDnaPreview['injected_character_dna'];
  identity_before_style?: boolean;
  cinematic_modulation_injected?: boolean;
  scene_continuity_checks?: ReturnType<typeof resolveSceneContinuityForPrompt>['continuity_checks'];
}

export interface SingleCanvasControlledGenerationResult {
  version: typeof SINGLE_CANVAS_CONTROLLED_VERSION;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  controlled_prompt: string;
  bridged_prompt?: string;
  refined_prompt?: string;
  debug: SingleCanvasIdentityDebug;
  dna_debug?: CharacterAnchorDnaDebug;
  character_anchor_dna_preview?: CharacterAnchorDnaPreview;
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
  const anchorDetected = detectCharactersInPromptWithAnchorDna(input.controlledPrompt);
  const dnaGate = validateAnchorDnaForCharacters(
    anchorDetected.map((record) => ({ name: record.name, slot_id: record.slot_id }))
  );

  if (anchorDetected.length > 0 && !dnaGate.ready) {
    return {
      version: SINGLE_CANVAS_CONTROLLED_VERSION,
      readiness: 'NOT_READY',
      blocked_reason:
        dnaGate.blocked_reason ??
        `PHASE-33F character anchor DNA NOT_READY for: ${dnaGate.missing.join(', ')}`,
      controlled_prompt: input.controlledPrompt,
      dna_debug: dnaGate.dna_debug,
      debug: {
        detected_characters: anchorDetected.map((r) => r.name),
        injected_elite_image_ids: [],
        reference_order: [],
        used_prompt_bridge: false,
        readiness: 'NOT_READY',
        preserved_name_tokens: [],
        dna_source: 'character_anchor.index.json',
        injected_character_dna: anchorDetected.map((record) => ({
          name: record.name,
          slot_id: record.slot_id,
          dna_loaded: false,
        })),
      },
    };
  }

  const assetSelection = selectMasterAssets({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    styleAnchors: input.styleAnchors,
  });

  const styleIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'style');
  const identityIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'identity');
  const identity_before_style =
    identityIndex >= 0 && (styleIndex < 0 || identityIndex < styleIndex);

  const baseDebug: SingleCanvasIdentityDebug = {
    detected_characters: assetSelection.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    used_prompt_bridge: false,
    readiness: assetSelection.readiness,
    blocked_reason: assetSelection.blocked_reason,
    preserved_name_tokens: [],
    dna_source: 'character_anchor.index.json',
    injected_character_dna: dnaGate.records.map((record) => ({
      name: record.name,
      slot_id: record.slot_id,
      dna_loaded: true,
    })),
    identity_before_style,
  };

  if (assetSelection.readiness !== 'READY') {
    return {
      version: SINGLE_CANVAS_CONTROLLED_VERSION,
      readiness: 'NOT_READY',
      blocked_reason: assetSelection.blocked_reason,
      controlled_prompt: input.controlledPrompt,
      dna_debug: dnaGate.dna_debug,
      debug: baseDebug,
      character_anchor_dna_preview: {
        dna_source: 'character_anchor.index.json',
        injected_character_dna: baseDebug.injected_character_dna ?? [],
      },
    };
  }

  const continuity = resolveSceneContinuityForPrompt(input.controlledPrompt, {
    baselinePromptLength: ESTIMATED_BRIDGED_PROMPT_BASELINE,
  });

  const bridgeResult = PromptBridge.bridge({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    identityRefs: assetSelection.identity_refs,
    anchorDnaRecords: dnaGate.records,
    styleAnchor: input.characterBook.styleAnchor,
    environmentDna: input.characterBook.environmentDNA?.global,
    cinematicModulation: continuity.modulation,
  });

  const refinedRaw = input.refinedPrompt ?? input.controlledPrompt;
  const refined_prompt = preserveLockedCharacterNames(refinedRaw, input.controlledPrompt);

  const stylePos = bridgeResult.bridged_prompt.indexOf('[STYLE_CORE_LIGHT]');
  const envPos = bridgeResult.bridged_prompt.indexOf('[ENVIRONMENT]');
  const firstStyleEnv =
    stylePos >= 0 ? stylePos : envPos >= 0 ? envPos : Number.MAX_SAFE_INTEGER;
  const gonegiPos = bridgeResult.bridged_prompt.indexOf('Pazu-lookalike');
  const danaPos = bridgeResult.bridged_prompt.indexOf('oceanic blue');
  const identity_before_style_prompt =
    gonegiPos >= 0 && danaPos >= 0 && gonegiPos < firstStyleEnv && danaPos < firstStyleEnv;

  const promptDna = validateCompiledPromptDnaContent(
    bridgeResult.bridged_prompt,
    dnaGate.records
  );
  if (!promptDna.ready) {
    return {
      version: SINGLE_CANVAS_CONTROLLED_VERSION,
      readiness: 'NOT_READY',
      blocked_reason: promptDna.blocked_reason,
      controlled_prompt: input.controlledPrompt,
      bridged_prompt: bridgeResult.bridged_prompt,
      dna_debug: dnaGate.dna_debug,
      debug: {
        ...baseDebug,
        used_prompt_bridge: true,
        readiness: 'NOT_READY',
        blocked_reason: promptDna.blocked_reason,
      },
      character_anchor_dna_preview: bridgeResult.character_anchor_dna_preview,
    };
  }

  return {
    version: SINGLE_CANVAS_CONTROLLED_VERSION,
    readiness: 'READY',
    controlled_prompt: input.controlledPrompt,
    bridged_prompt: bridgeResult.bridged_prompt,
    refined_prompt,
    dna_debug: dnaGate.dna_debug,
    character_anchor_dna_preview: bridgeResult.character_anchor_dna_preview,
    debug: {
      detected_characters: bridgeResult.detected_characters,
      injected_elite_image_ids: assetSelection.injected_elite_image_ids,
      reference_order: assetSelection.reference_order,
      used_prompt_bridge: true,
      readiness: 'READY',
      preserved_name_tokens: bridgeResult.preserved_name_tokens,
      dna_source: 'character_anchor.index.json',
      injected_character_dna: bridgeResult.character_anchor_dna_preview.injected_character_dna,
      identity_before_style: identity_before_style && identity_before_style_prompt,
      cinematic_modulation_injected: bridgeResult.cinematic_modulation_injected,
      scene_continuity_checks: continuity.continuity_checks,
    },
  };
}
