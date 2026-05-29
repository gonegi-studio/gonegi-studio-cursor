import type { CharacterBook } from '../types';
import { RUNTIME_PROMPT_COMPILER_VERSION } from '../types';
import { buildMasterCoreV175Snapshot } from './cinematic/aiStudioControlledJsonRebuild.fixtures';
import { buildSingleCanvasControlledGeneration } from './singleCanvasControlledGeneration';
import { preserveLockedCharacterNames } from './promptBridge';
import {
  buildCharacterAnchorDnaDebug,
  detectCharactersInPromptWithAnchorDna,
  validateCompiledPromptDnaContent,
} from './loadCharacterAnchorDNA';
import { buildRichCueSignalPreview } from './cinematic/buildRichCueSignals';
import { resolveSceneContinuityForPrompt } from './sceneContinuityResolver';

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
  const dnaRecords = detectCharactersInPromptWithAnchorDna(prompt);
  const dnaContent = bridged
    ? validateCompiledPromptDnaContent(bridged, dnaRecords)
    : { ready: false, blocked_reason: 'bridged prompt missing' };

  const continuity = resolveSceneContinuityForPrompt(prompt);
  const bridged35b = pipeline.bridged_prompt ?? '';
  const bridged35aOnly = bridged35b.replace(/\n?\[CINEMATIC_MODULATION\]:[^\n]*/g, '').trim();

  const promptInflation =
    bridged35aOnly.length > 0
      ? Number(((bridged35b.length - bridged35aOnly.length) / bridged35aOnly.length).toFixed(4))
      : 0;

  return {
    phase: 'PHASE-35B',
    compiler_version: RUNTIME_PROMPT_COMPILER_VERSION,
    controlled_prompt: prompt,
    pipeline,
    dna_debug: pipeline.dna_debug ?? buildCharacterAnchorDnaDebug(),
    character_anchor_dna_preview: pipeline.character_anchor_dna_preview,
    name_lock_verification: {
      original_names: dnaRecords.map((r) => r.name),
      refined_with_generic_nouns: 'The boy and his companion stroll by the harbor.',
      after_name_lock: refinedSample,
      gonegi_preserved: /\bGonegi\b/i.test(refinedSample),
      dana_preserved: /\bDana\b/i.test(refinedSample),
    },
    anchor_dna_verification: {
      gonegi_pazu_lookalike_in_prompt: bridged.includes('Pazu-lookalike'),
      gonegi_sun_kissed_tan_in_prompt: bridged.includes('sun-kissed tan'),
      gonegi_suspenders_in_prompt: bridged.includes('suspenders'),
      dana_oceanic_blue_in_prompt: bridged.includes('oceanic blue'),
      dana_low_twin_ponytails_in_prompt: bridged.includes('low twin ponytails'),
      dana_pale_cornflower_blue_in_prompt: bridged.includes('Pale Cornflower Blue'),
      legacy_warm_olive_gaze_absent: !bridged.includes('warm olive gaze'),
      legacy_seafoam_linen_wrap_absent: !bridged.includes('seafoam linen wrap'),
      legacy_harbor_shawl_absent: !bridged.includes('harbor shawl'),
      character_dna_lock_in_prompt: bridged.includes('[CHARACTER_DNA_LOCK]'),
      identity_before_style: pipeline.debug.identity_before_style === true,
      dna_content_ready: dnaContent.ready,
    },
    music_drama_parity: {
      elite_refs_injected: pipeline.debug.injected_elite_image_ids.length >= 2,
      identity_before_style: pipeline.debug.identity_before_style === true,
      used_prompt_bridge: pipeline.debug.used_prompt_bridge,
      dna_source: pipeline.debug.dna_source ?? 'character_anchor.index.json',
    },
    rich_cue_layer: buildRichCueSignalPreview(),
    scene_continuity: continuity,
    comparison_35a_vs_35b: {
      prompt_length_35a_only: bridged35aOnly.length,
      prompt_length_35a_plus_35b: bridged35b.length,
      prompt_inflation_ratio: promptInflation,
      within_15_percent_budget: promptInflation <= 0.15,
      cinematic_modulation_injected: bridged35b.includes('[CINEMATIC_MODULATION]'),
    },
  };
}
