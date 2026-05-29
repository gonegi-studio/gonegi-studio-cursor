import type { CharacterBook, CharacterAnchorDnaPreview, GhibliAnchor } from '../../types';
import {
  type CharacterAnchorDnaDebug,
  detectCharactersInPromptWithAnchorDna,
  validateAnchorDnaForCharacters,
  validateCompiledPromptDnaContent,
} from '../loadCharacterAnchorDNA';
import { PromptBridge, preserveLockedCharacterNames } from '../promptBridge';
import { selectMasterAssets } from '../selectMasterAssets';
import { ESTIMATED_BRIDGED_PROMPT_BASELINE } from './buildRuntimeCueBridge';
import { buildControlledGenerationPackExportPreview } from './controlledGenerationPackExport';
import {
  resolveMusicDramaRuntimeCue,
  type MusicDramaRuntimeBridgeDebug,
  type MusicDramaSlotScenario,
} from './musicDramaRuntimeBridge';
import {
  evaluateRenderSafetyGate,
  type RenderSafetyGateResult,
} from './renderSafetyGate';

export const MUSIC_DRAMA_SCENE_GENERATION_VERSION = 'PHASE-36C-v1' as const;

export interface MusicDramaSceneGenerationInput {
  slot: MusicDramaSlotScenario;
  characterBook: CharacterBook;
  controlledPrompt: string;
  styleAnchors?: GhibliAnchor[];
  refinedPrompt?: string;
}

export interface MusicDramaSceneGenerationResult {
  version: typeof MUSIC_DRAMA_SCENE_GENERATION_VERSION;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  controlled_prompt: string;
  bridged_prompt?: string;
  refined_prompt?: string;
  runtime_bridge_debug: MusicDramaRuntimeBridgeDebug;
  render_safety_gate: RenderSafetyGateResult;
  character_anchor_dna_preview?: CharacterAnchorDnaPreview;
  dna_debug?: CharacterAnchorDnaDebug;
  used_prompt_bridge: boolean;
  detected_characters: string[];
  injected_elite_image_ids: string[];
  reference_order: Array<{
    kind: string;
    ref_id: string;
    slot_id?: string;
    character_name?: string;
  }>;
  preserved_name_tokens: string[];
  identity_before_style: boolean;
}

export interface MusicDramaActiveVersionInput {
  characterBook: CharacterBook;
  styleAnchors?: GhibliAnchor[];
  refinedPrompt?: string;
  activeRank?: number;
}

function buildNotReadyResult(
  partial: Omit<MusicDramaSceneGenerationResult, 'version' | 'readiness' | 'render_safety_gate'> & {
    render_safety_gate: RenderSafetyGateResult;
  }
): MusicDramaSceneGenerationResult {
  return {
    version: MUSIC_DRAMA_SCENE_GENERATION_VERSION,
    readiness: 'NOT_READY',
    ...partial,
  };
}

function buildMusicDramaScene(
  input: MusicDramaSceneGenerationInput
): MusicDramaSceneGenerationResult {
  const anchorDetected = detectCharactersInPromptWithAnchorDna(input.controlledPrompt);
  const dnaGate = validateAnchorDnaForCharacters(
    anchorDetected.map((record) => ({ name: record.name, slot_id: record.slot_id }))
  );

  const runtimeCue = resolveMusicDramaRuntimeCue(input.slot, {
    baselinePromptLength: ESTIMATED_BRIDGED_PROMPT_BASELINE,
  });

  const assetSelection = selectMasterAssets({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    styleAnchors: input.styleAnchors,
  });

  const styleIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'style');
  const identityIndex = assetSelection.reference_order.findIndex((e) => e.kind === 'identity');
  const identity_before_style =
    identityIndex >= 0 && (styleIndex < 0 || identityIndex < styleIndex);

  const renderSafety = evaluateRenderSafetyGate({
    controlledPrompt: input.controlledPrompt,
    runtimeCue,
    detected_characters: assetSelection.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    identity_before_style,
    anchor_dna_ready: dnaGate.ready,
    asset_selection_ready: assetSelection.readiness === 'READY',
  });

  const baseFields = {
    controlled_prompt: input.controlledPrompt,
    runtime_bridge_debug: runtimeCue.debug,
    render_safety_gate: renderSafety,
    detected_characters: assetSelection.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    preserved_name_tokens: [] as string[],
    identity_before_style,
    used_prompt_bridge: false,
    dna_debug: dnaGate.dna_debug,
  };

  if (renderSafety.status !== 'READY') {
    return buildNotReadyResult({
      ...baseFields,
      blocked_reason: renderSafety.blocked_reason,
    });
  }

  const bridgeResult = PromptBridge.bridge({
    controlledPrompt: input.controlledPrompt,
    characterBook: input.characterBook,
    identityRefs: assetSelection.identity_refs,
    anchorDnaRecords: dnaGate.records,
    styleAnchor: input.characterBook.styleAnchor,
    environmentDna: input.characterBook.environmentDNA?.global,
    cinematicModulation: runtimeCue.prompt_modulation,
    runtimeCinematicContext: runtimeCue.runtime_context,
  });

  const refinedRaw = input.refinedPrompt ?? input.controlledPrompt;
  const refined_prompt = preserveLockedCharacterNames(refinedRaw, input.controlledPrompt);

  const promptDna = validateCompiledPromptDnaContent(
    bridgeResult.bridged_prompt,
    dnaGate.records
  );
  if (!promptDna.ready) {
    return buildNotReadyResult({
      ...baseFields,
      blocked_reason: promptDna.blocked_reason,
      bridged_prompt: bridgeResult.bridged_prompt,
      refined_prompt,
      used_prompt_bridge: true,
      character_anchor_dna_preview: bridgeResult.character_anchor_dna_preview,
      preserved_name_tokens: bridgeResult.preserved_name_tokens,
    });
  }

  return {
    version: MUSIC_DRAMA_SCENE_GENERATION_VERSION,
    readiness: 'READY',
    controlled_prompt: input.controlledPrompt,
    bridged_prompt: bridgeResult.bridged_prompt,
    refined_prompt,
    runtime_bridge_debug: runtimeCue.debug,
    render_safety_gate: renderSafety,
    used_prompt_bridge: true,
    character_anchor_dna_preview: bridgeResult.character_anchor_dna_preview,
    dna_debug: dnaGate.dna_debug,
    detected_characters: bridgeResult.detected_characters,
    injected_elite_image_ids: assetSelection.injected_elite_image_ids,
    reference_order: assetSelection.reference_order,
    preserved_name_tokens: bridgeResult.preserved_name_tokens,
    identity_before_style,
  };
}

/** MusicDrama slot → RuntimeCueBridge → RenderSafetyGate → PromptBridge (no image engine call). */
export function generateDramaScene(
  input: MusicDramaSceneGenerationInput
): MusicDramaSceneGenerationResult {
  return buildMusicDramaScene(input);
}

/** Active controlled-generation pack version → same safety-gated path as generateDramaScene. */
export function generateActiveVersionScene(
  input: MusicDramaActiveVersionInput
): MusicDramaSceneGenerationResult {
  const packPreview = buildControlledGenerationPackExportPreview();
  const activeRank = input.activeRank ?? 1;
  const packs = packPreview.controlled_generation_packs ?? [];
  const activePack = packs.find((pack) => pack.rank === activeRank) ?? packs[0];

  if (!activePack) {
    const emptyRuntime = resolveMusicDramaRuntimeCue({
      slot_id: 'drama-active-missing',
      scenario: '',
    });
    const emptyGate = evaluateRenderSafetyGate({
      controlledPrompt: '',
      runtimeCue: emptyRuntime,
      detected_characters: [],
      injected_elite_image_ids: [],
      reference_order: [],
      identity_before_style: false,
      anchor_dna_ready: false,
      asset_selection_ready: false,
    });

    return buildNotReadyResult({
      blocked_reason: 'PHASE-36B no active controlled-generation pack available',
      controlled_prompt: '',
      runtime_bridge_debug: emptyRuntime.debug,
      render_safety_gate: emptyGate,
      detected_characters: [],
      injected_elite_image_ids: [],
      reference_order: [],
      preserved_name_tokens: [],
      identity_before_style: false,
      used_prompt_bridge: false,
    });
  }

  const controlledPrompt = activePack.generation_prompt_pack.positive_prompt;

  return generateDramaScene({
    slot: {
      slot_id: `drama-active-rank-${activePack.rank}`,
      scene_id: activePack.scene_id,
      scene_pack_id: activePack.scene_fingerprint,
      scenario: controlledPrompt,
    },
    characterBook: input.characterBook,
    controlledPrompt,
    styleAnchors: input.styleAnchors,
    refinedPrompt: input.refinedPrompt,
  });
}
