import crypto from 'crypto';
import {
  CharacterImageAnchor,
  CinematicSequenceCompileInput,
  CompiledCharacterBinding,
  CompiledEnvBinding,
  CompiledMotionBinding,
  CompiledRenderPrompt,
  CompiledScenePackBinding,
  CompiledShotBinding,
  CompiledStyleBinding,
  CompiledTransitionBinding,
  RUNTIME_PROMPT_COMPILER_VERSION,
  RuntimePromptCompileInput,
} from '../types';
import { MEDITERRANEAN_CHRONICLES_DATA } from '../src/data/jsonData';
import { buildAiStudioControlledJsonRebuildPreview } from './cinematic/aiStudioControlledJsonRebuild';
import { buildUnifiedAssetRegistry } from './cinematic/musicDramaAssetBinding';
import { toCompiledMotionBinding, resolveEmotionMotionBridge } from './emotionMotionBridgeResolver';
import {
  CHARACTER_DOMINANCE_LOCK,
  formatCharacterCoreLine,
} from './identityCompressionEngine';
import {
  assertForbiddenTokensAbsent,
  buildCompiledNegativePrompt,
  cleanPromptSection,
} from './promptConflictCleaner';
import { resolveCharacterIdentities } from './runtimeIdentityResolver';
import { resolveScenePack, toCompiledScenePackBinding } from './scenePackResolver';
import { assertSceneIsolationClean, isolateSceneAction } from './sceneIsolationGuard';
import { resolveShotFingerprint, toCompiledShotBinding } from './shotFingerprintResolver';
import {
  resolveTransitionDna,
  toCompiledTransitionBinding,
} from './transitionDnaResolver';

const SECTION_JOINER = '. ';

const STYLE_CORE_LIGHT =
  'vitreous sharpness, matte watercolor gouache, thick ink line, Mediterranean harbor warmth';

export const CANONICAL_RUNTIME_ASSEMBLY_ORDER = [
  'character_core',
  'reference_trigger',
  'identity_lock',
  'action',
  'scene',
  'style_core_light',
  'env_light',
  'shot',
  'motion',
  'transition',
  'camera_supplement',
  'negative',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function buildCharacterCoreSection(
  slotIds: string[],
  anchors: CharacterImageAnchor[]
): {
  section: string;
  bindings: CompiledCharacterBinding[];
} {
  const identities = resolveCharacterIdentities(slotIds);
  const registry = buildUnifiedAssetRegistry(slotIds);
  const anchorBySlot = new Map(anchors.map((a) => [a.slot_id, a]));
  const lines = ['[CHARACTER_CORE]'];
  const bindings: CompiledCharacterBinding[] = [];

  for (const identity of identities) {
    const slotBinding = registry.slot_bindings.find((b) => b.slot_id === identity.id);
    const imageAnchor = anchorBySlot.get(identity.id);
    const coreLine = formatCharacterCoreLine(identity);
    lines.push(coreLine);

    bindings.push({
      slot_id: identity.id,
      character_name: identity.name,
      runtime_compressed_identity: coreLine,
      image_anchor_ref: imageAnchor?.elite_image_id ?? identity.image_anchor_ref,
      embedding_id: slotBinding?.embedding_id ?? digest(['emb', identity.id]),
      lock_flags: slotBinding?.lock_flags ?? {
        face_lock: true,
        outfit_lock: true,
        silhouette_lock: true,
      },
      source_visual_dna_ref: identity.source_visual_dna_ref,
      resolved_identity: {
        face_core: identity.face_core,
        hair_core: identity.hair_core,
        silhouette_core: identity.silhouette_core,
        outfit_core: identity.outfit_core,
        age_core: identity.age_core,
        style_core: identity.style_core,
        identity_lock: identity.identity_lock,
      },
    });
  }

  return { section: cleanPromptSection(lines.join(SECTION_JOINER)), bindings };
}

function buildReferenceTriggerSection(anchors: CharacterImageAnchor[]): string {
  const sorted = [...anchors].sort((a, b) => a.slot_id.localeCompare(b.slot_id));
  const names = sorted.map((a) => {
    const binding = resolveCharacterIdentities([a.slot_id])[0];
    return binding?.name.replace(/\s+Main$/i, '') ?? a.slot_id;
  });
  const eliteIds = sorted.map((a) => a.elite_image_id);

  return cleanPromptSection(
    [
      '[REFERENCE_TRIGGER]',
      ...names,
      ...eliteIds,
      'CharacterBook auto-reference injection active',
      'elite reference matching enabled',
    ].join(SECTION_JOINER)
  );
}

function buildIdentityLockSection(): string {
  return cleanPromptSection(
    [
      '[IDENTITY_LOCK]',
      CHARACTER_DOMINANCE_LOCK,
      '[CHARACTER_PRIORITY]',
      'main protagonists visually dominate frame',
      'background NPC LOD downgrade active',
      'preserve protagonist facial readability',
      'preserve silhouette clarity',
      '[LOD_PROTOCOL]',
      'wide shot: minimal eye detail, silhouette-first rendering',
      'medium shot: compact facial anchor',
      'close-up: iris detail enabled',
      '[SUBJECT_SEGMENTATION]',
      'maintain clean silhouette gap between Gonegi and Dana',
      'prevent merged limbs/hair',
      'maintain edge separation lighting',
    ].join(SECTION_JOINER)
  );
}

function buildActionSection(packId: string): {
  binding: CompiledScenePackBinding;
  section: string;
  negativeGuard: string[];
} {
  const pack = resolveScenePack(packId);
  const binding = toCompiledScenePackBinding(pack);
  const section = cleanPromptSection(
    [`[ACTION]`, `pack:${pack.scene_pack_id}`, pack.action_core, `tone:${pack.emotional_tone}`].join(
      SECTION_JOINER
    )
  );
  return { binding, section, negativeGuard: [...pack.negative_guard].sort() };
}

function buildSceneSection(sceneAction: string): string {
  const isolated = isolateSceneAction(sceneAction);
  return cleanPromptSection(`[SCENE] ${isolated.sanitized_scene_action}`);
}

function buildStyleCoreLightSection(styleCoreIds: string[]): {
  section: string;
  bindings: CompiledStyleBinding[];
} {
  const studio = buildAiStudioControlledJsonRebuildPreview();
  const styleCore = studio.ai_studio_controlled_upload_json[0]?.styleCore ?? {};
  const sortedIds = [...styleCoreIds].sort();
  const styleAnchor =
    typeof styleCore.styleAnchor === 'string'
      ? styleCore.styleAnchor
      : (MEDITERRANEAN_CHRONICLES_DATA.styleAnchor ?? 'Ghibli Mediterranean Chronicles');

  const bindings: CompiledStyleBinding[] = sortedIds.map((style_core_id) => ({
    style_core_id,
    style_key: typeof styleCore.styleKey === 'string' ? styleCore.styleKey : undefined,
    material_key: typeof styleCore.materialKey === 'string' ? styleCore.materialKey : undefined,
    lighting_key: typeof styleCore.lightingKey === 'string' ? styleCore.lightingKey : undefined,
    brushwork_key: typeof styleCore.brushworkKey === 'string' ? styleCore.brushworkKey : undefined,
    palette_key: typeof styleCore.paletteKey === 'string' ? styleCore.paletteKey : undefined,
  }));

  const section = cleanPromptSection(
    [`[STYLE_CORE_LIGHT]`, styleAnchor, STYLE_CORE_LIGHT, `cores:${sortedIds.join(',')}`].join(
      SECTION_JOINER
    )
  );

  return { section, bindings };
}

function buildEnvLightSection(envSlot: string): { section: string; bindings: CompiledEnvBinding[] } {
  const envDna =
    MEDITERRANEAN_CHRONICLES_DATA.environmentDNA?.[
      envSlot as keyof typeof MEDITERRANEAN_CHRONICLES_DATA.environmentDNA
    ] ??
    MEDITERRANEAN_CHRONICLES_DATA.environmentDNA?.global ??
    MEDITERRANEAN_CHRONICLES_DATA.globalEnvironmentDNA ??
    '';

  const excerpt = envDna
    .split(/(?<=\.)\s+/)
    .slice(0, 2)
    .join(' ')
    .slice(0, 200);

  return {
    section: cleanPromptSection(`[ENV_LIGHT] slot:${envSlot}. ${excerpt}`),
    bindings: [
      {
        env_slot: envSlot,
        env_dna_excerpt: excerpt,
        env_dna_ref: `app:characterBook.environmentDNA.${envSlot}`,
      },
    ],
  };
}

function buildShotSectionCompact(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledShotBinding[];
} {
  const shot = resolveShotFingerprint(sequence.shot_id);
  const binding = toCompiledShotBinding(shot);
  const section = cleanPromptSection(
    [
      '[SHOT]',
      binding.shot_id,
      binding.framing,
      binding.camera_motion,
      binding.cinematic_role,
    ].join(SECTION_JOINER)
  );
  return { section, bindings: [binding] };
}

function buildMotionSectionCompact(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledMotionBinding[];
} {
  const bridge = resolveEmotionMotionBridge(sequence.emotion_motion_bridge_id);
  const binding = toCompiledMotionBinding(bridge);
  const section = cleanPromptSection(
    [
      '[MOTION]',
      binding.bridge_id,
      binding.emotion,
      binding.body_motion,
      binding.pacing_behavior,
    ].join(SECTION_JOINER)
  );
  return { section, bindings: [binding] };
}

function buildTransitionSectionCompact(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledTransitionBinding[];
} {
  const transition = resolveTransitionDna(sequence.transition_id);
  const binding = toCompiledTransitionBinding(transition);
  const section = cleanPromptSection(
    [
      '[TRANSITION]',
      binding.transition_id,
      binding.motion_bridge,
      binding.pacing_shift,
      binding.camera_shift,
    ].join(SECTION_JOINER)
  );
  return { section, bindings: [binding] };
}

function buildCameraSupplement(camera: string[], motion: string[]): string {
  const cameraSorted = [...camera].sort();
  const motionSorted = [...motion].sort();
  return cleanPromptSection(
    ['[CAMERA_SUPPLEMENT]', ...cameraSorted, ...motionSorted].join(SECTION_JOINER)
  );
}

export function compileRuntimePrompt(input: RuntimePromptCompileInput): CompiledRenderPrompt {
  const slotIds = [...input.required_character_slots].sort();
  const styleCoreIds = [...input.style_core_ids].sort();
  const camera = [...(input.camera ?? ['EyeLevelImmersion', '16:9 cinematic frame'])].sort();
  const cameraMotion = [...(input.motion ?? ['warm golden harbor light'])].sort();
  const sequence = input.cinematic_sequence;

  const characterBlock = buildCharacterCoreSection(slotIds, input.character_image_anchors);
  const referenceTrigger = buildReferenceTriggerSection(input.character_image_anchors);
  const identityLock = buildIdentityLockSection();
  const actionBlock = buildActionSection(sequence.scene_pack_id);
  const sceneBlock = buildSceneSection(input.scene_action);
  const styleBlock = buildStyleCoreLightSection(styleCoreIds);
  const envBlock = buildEnvLightSection(input.env_slot);
  const shotBlock = buildShotSectionCompact(sequence);
  const motionBlock = buildMotionSectionCompact(sequence);
  const transitionBlock = buildTransitionSectionCompact(sequence);
  const cameraSupplement = buildCameraSupplement(camera, cameraMotion);

  const compiled_prompt = [
    characterBlock.section,
    referenceTrigger,
    identityLock,
    actionBlock.section,
    sceneBlock,
    styleBlock.section,
    envBlock.section,
    shotBlock.section,
    motionBlock.section,
    transitionBlock.section,
    cameraSupplement,
  ].join(SECTION_JOINER);

  const compiled_negative_prompt = buildCompiledNegativePrompt(input.base_negative_prompt, [
    'text-only identity regeneration',
    'generic fantasy faces',
    'face drift',
    'identity collapse',
    'slideshow cut',
    'disconnected cuts',
    ...actionBlock.negativeGuard,
  ]);

  if (!assertSceneIsolationClean(compiled_prompt) || !assertForbiddenTokensAbsent(compiled_prompt)) {
    throw new Error('PHASE-33A runtime prompt compiler failed isolation or conflict checks');
  }

  if (
    compiled_prompt.includes('image latent anchors override') ||
    compiled_prompt.includes('PRIMARY CHARACTER IDENTITY SOURCE: character_image_anchors')
  ) {
    throw new Error('PHASE-33A compiler must not emit deprecated image-anchor dominance wording');
  }

  const compile_fingerprint = digest([
    RUNTIME_PROMPT_COMPILER_VERSION,
    compiled_prompt,
    compiled_negative_prompt,
    JSON.stringify(input.character_image_anchors),
    JSON.stringify(sequence),
    JSON.stringify(characterBlock.bindings),
    JSON.stringify(styleBlock.bindings),
    JSON.stringify(envBlock.bindings),
    JSON.stringify(actionBlock.binding),
    JSON.stringify(transitionBlock.bindings),
    JSON.stringify(shotBlock.bindings),
    JSON.stringify(motionBlock.bindings),
  ]);

  return {
    compiler_version: RUNTIME_PROMPT_COMPILER_VERSION,
    compiled_prompt,
    compiled_negative_prompt,
    character_bindings: characterBlock.bindings,
    style_bindings: styleBlock.bindings,
    env_bindings: envBlock.bindings,
    scene_pack_binding: actionBlock.binding,
    transition_bindings: transitionBlock.bindings,
    shot_bindings: shotBlock.bindings,
    motion_bindings: motionBlock.bindings,
    compile_fingerprint,
    assembly_order: [...CANONICAL_RUNTIME_ASSEMBLY_ORDER],
  };
}

export function assertCompiledPromptIntegrity(compiled: CompiledRenderPrompt): boolean {
  const prompt = compiled.compiled_prompt;
  const characterIdx = prompt.indexOf('[CHARACTER_CORE]');
  const styleIdx = prompt.indexOf('[STYLE_CORE_LIGHT]');
  const sceneIdx = prompt.indexOf('[SCENE]');

  return (
    prompt.startsWith('[CHARACTER_CORE]') &&
    prompt.includes('[REFERENCE_TRIGGER]') &&
    prompt.includes('CharacterBook auto-reference injection active') &&
    prompt.includes('elite-image-gonegi-main-v1') &&
    prompt.includes('elite-image-dana-companion-v1') &&
    prompt.includes('[IDENTITY_LOCK]') &&
    prompt.includes('[CHARACTER_PRIORITY]') &&
    prompt.includes('[LOD_PROTOCOL]') &&
    /Gonegi/i.test(prompt) &&
    /Dana/i.test(prompt) &&
    characterIdx >= 0 &&
    styleIdx > characterIdx &&
    sceneIdx > characterIdx &&
    sceneIdx < styleIdx &&
    prompt.includes('[SHOT]') &&
    prompt.includes('[MOTION]') &&
    prompt.includes('[TRANSITION]') &&
    !prompt.includes('image latent anchors override') &&
    compiled.transition_bindings.length > 0 &&
    compiled.shot_bindings.length > 0 &&
    compiled.motion_bindings.length > 0 &&
    assertSceneIsolationClean(prompt) &&
    assertForbiddenTokensAbsent(prompt)
  );
}

export function verifyCompilerDeterminism(input: RuntimePromptCompileInput, runs = 5): boolean {
  const fingerprints = Array.from({ length: runs }, () => compileRuntimePrompt(input).compile_fingerprint);
  return fingerprints.every((fp) => fp === fingerprints[0]);
}

/** @deprecated Use compileRuntimePrompt */
export const compileRuntimeCharacterPrompt = compileRuntimePrompt;
