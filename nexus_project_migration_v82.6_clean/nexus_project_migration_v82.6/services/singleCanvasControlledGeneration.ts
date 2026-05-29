import type { CharacterBook, CharacterAnchorDnaPreview, GhibliAnchor } from '../types';
import {
  generateDramaScene,
  MUSIC_DRAMA_SCENE_GENERATION_VERSION,
} from './cinematic/musicDramaSceneGeneration';
import { resolveSceneContinuityForPrompt } from './sceneContinuityResolver';

export const SINGLE_CANVAS_CONTROLLED_VERSION = MUSIC_DRAMA_SCENE_GENERATION_VERSION;

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
  runtime_bridge_debug?: ReturnType<typeof generateDramaScene>['runtime_bridge_debug'];
  render_safety_gate?: ReturnType<typeof generateDramaScene>['render_safety_gate'];
}

export interface SingleCanvasControlledGenerationResult {
  version: typeof SINGLE_CANVAS_CONTROLLED_VERSION;
  readiness: 'READY' | 'NOT_READY';
  blocked_reason?: string;
  controlled_prompt: string;
  bridged_prompt?: string;
  refined_prompt?: string;
  debug: SingleCanvasIdentityDebug;
  dna_debug?: ReturnType<typeof generateDramaScene>['dna_debug'];
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
  const continuity = resolveSceneContinuityForPrompt(input.controlledPrompt);

  const drama = generateDramaScene({
    slot: {
      slot_id: 'single-canvas-controlled',
      scenario: input.controlledPrompt,
    },
    characterBook: input.characterBook,
    controlledPrompt: input.controlledPrompt,
    styleAnchors: input.styleAnchors,
    refinedPrompt: input.refinedPrompt,
  });

  const bridged = drama.bridged_prompt ?? '';
  const stylePos = bridged.indexOf('[STYLE_CORE_LIGHT]');
  const envPos = bridged.indexOf('[ENVIRONMENT]');
  const firstStyleEnv =
    stylePos >= 0 ? stylePos : envPos >= 0 ? envPos : Number.MAX_SAFE_INTEGER;
  const gonegiPos = bridged.indexOf('Pazu-lookalike');
  const danaPos = bridged.indexOf('oceanic blue');
  const identity_before_style_prompt =
    gonegiPos >= 0 && danaPos >= 0 && gonegiPos < firstStyleEnv && danaPos < firstStyleEnv;

  const debug: SingleCanvasIdentityDebug = {
    detected_characters: drama.detected_characters,
    injected_elite_image_ids: drama.injected_elite_image_ids,
    reference_order: drama.reference_order,
    used_prompt_bridge: drama.used_prompt_bridge,
    readiness: drama.readiness,
    blocked_reason: drama.blocked_reason,
    preserved_name_tokens: drama.preserved_name_tokens,
    dna_source: 'character_anchor.index.json',
    injected_character_dna: drama.character_anchor_dna_preview?.injected_character_dna,
    identity_before_style: drama.identity_before_style && identity_before_style_prompt,
    cinematic_modulation_injected: bridged.includes('[CINEMATIC_MODULATION]'),
    scene_continuity_checks: continuity.continuity_checks,
    runtime_bridge_debug: drama.runtime_bridge_debug,
    render_safety_gate: drama.render_safety_gate,
  };

  return {
    version: SINGLE_CANVAS_CONTROLLED_VERSION,
    readiness: drama.readiness,
    blocked_reason: drama.blocked_reason,
    controlled_prompt: input.controlledPrompt,
    bridged_prompt: drama.bridged_prompt,
    refined_prompt: drama.refined_prompt,
    dna_debug: drama.dna_debug,
    character_anchor_dna_preview: drama.character_anchor_dna_preview,
    debug,
  };
}
