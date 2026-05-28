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
import {
  AMS_LAWS,
  MEDITERRANEAN_REALITY_FOUNDATION,
  VITREOUS_ELEGANCE_PROTOCOL,
} from './cinematic/aiStudioControlledJsonRebuild.fixtures';
import { buildUnifiedAssetRegistry } from './cinematic/musicDramaAssetBinding';
import { toCompiledMotionBinding, resolveEmotionMotionBridge } from './emotionMotionBridgeResolver';
import { formatCompressedIdentityBlock } from './identityCompressionEngine';
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

export const CANONICAL_RUNTIME_ASSEMBLY_ORDER = [
  'image_anchor',
  'character',
  'style',
  'env',
  'scene_pack',
  'scene',
  'transition',
  'shot',
  'motion',
  'camera_supplement',
  'negative',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function buildImageAnchorSection(anchors: CharacterImageAnchor[]): string {
  const sorted = [...anchors].sort((a, b) => a.slot_id.localeCompare(b.slot_id));
  const lines = [
    '[IMAGE_ANCHOR]',
    'PRIMARY CHARACTER IDENTITY SOURCE: character_image_anchors',
    'image latent anchors override text-only identity; text supplements anchors only',
    ...sorted.map(
      (a) =>
        `slot ${a.slot_id} elite ${a.elite_image_id} fingerprint ${a.image_fingerprint.slice(0, 16)} embedding ${a.image_embedding_id} latent ${a.image_latent_ref.slice(0, 16)}`
    ),
  ];
  return cleanPromptSection(lines.join(SECTION_JOINER));
}

function buildCharacterSection(
  slotIds: string[],
  anchors: CharacterImageAnchor[]
): {
  section: string;
  bindings: CompiledCharacterBinding[];
} {
  const identities = resolveCharacterIdentities(slotIds);
  const registry = buildUnifiedAssetRegistry(slotIds);
  const anchorBySlot = new Map(anchors.map((a) => [a.slot_id, a]));
  const lines = ['[CHARACTER]'];
  const bindings: CompiledCharacterBinding[] = [];

  for (const identity of identities) {
    const slotBinding = registry.slot_bindings.find((b) => b.slot_id === identity.id);
    const imageAnchor = anchorBySlot.get(identity.id);
    const block = formatCompressedIdentityBlock(identity);
    if (imageAnchor) {
      lines.push(
        `${block}, supplement-only text; primary identity ${imageAnchor.elite_image_id} (${imageAnchor.image_fingerprint.slice(0, 12)})`
      );
    } else if (slotBinding?.image_anchor_ref) {
      lines.push(`${block}, image anchor ${slotBinding.image_anchor_ref} overrides text drift`);
    } else {
      lines.push(block);
    }

    bindings.push({
      slot_id: identity.id,
      character_name: identity.name,
      runtime_compressed_identity: block,
      image_anchor_ref: identity.image_anchor_ref,
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

function buildStyleSection(styleCoreIds: string[]): {
  section: string;
  bindings: CompiledStyleBinding[];
} {
  const studio = buildAiStudioControlledJsonRebuildPreview();
  const styleCore = studio.ai_studio_controlled_upload_json[0]?.styleCore ?? {};
  const sortedIds = [...styleCoreIds].sort();

  const bindings: CompiledStyleBinding[] = sortedIds.map((style_core_id) => ({
    style_core_id,
    style_key: typeof styleCore.styleKey === 'string' ? styleCore.styleKey : undefined,
    material_key: typeof styleCore.materialKey === 'string' ? styleCore.materialKey : undefined,
    lighting_key: typeof styleCore.lightingKey === 'string' ? styleCore.lightingKey : undefined,
    brushwork_key: typeof styleCore.brushworkKey === 'string' ? styleCore.brushworkKey : undefined,
    palette_key: typeof styleCore.paletteKey === 'string' ? styleCore.paletteKey : undefined,
  }));

  const lines = [
    '[STYLE]',
    typeof styleCore.styleAnchor === 'string'
      ? styleCore.styleAnchor
      : (MEDITERRANEAN_CHRONICLES_DATA.styleAnchor ?? ''),
    `style_core_ids:${sortedIds.join(', ')}`,
    VITREOUS_ELEGANCE_PROTOCOL,
    MEDITERRANEAN_REALITY_FOUNDATION,
    ...AMS_LAWS,
    'opaque gouache cel-shading, hand-painted 1980s Studio Ghibli animation',
  ];

  return { section: cleanPromptSection(lines.join(SECTION_JOINER)), bindings };
}

function buildEnvSection(envSlot: string): { section: string; bindings: CompiledEnvBinding[] } {
  const envDna =
    MEDITERRANEAN_CHRONICLES_DATA.environmentDNA?.[
      envSlot as keyof typeof MEDITERRANEAN_CHRONICLES_DATA.environmentDNA
    ] ??
    MEDITERRANEAN_CHRONICLES_DATA.environmentDNA?.global ??
    MEDITERRANEAN_CHRONICLES_DATA.globalEnvironmentDNA ??
    '';

  return {
    section: cleanPromptSection(`[ENV] environment_slot:${envSlot}. ${envDna}`),
    bindings: [
      {
        env_slot: envSlot,
        env_dna_excerpt: envDna.slice(0, 480),
        env_dna_ref: `app:characterBook.environmentDNA.${envSlot}`,
      },
    ],
  };
}

function buildScenePackSection(packId: string): {
  section: string;
  binding: CompiledScenePackBinding;
  negativeGuard: string[];
} {
  const pack = resolveScenePack(packId);
  const binding = toCompiledScenePackBinding(pack);
  const section = cleanPromptSection(
    [
      '[SCENE_PACK]',
      `pack:${pack.scene_pack_id}`,
      `tone:${pack.emotional_tone}`,
      `action:${pack.action_core}`,
      `camera:${pack.camera_behavior}`,
      `continuity:${pack.continuity_role}`,
    ].join(SECTION_JOINER)
  );
  return { section, binding, negativeGuard: [...pack.negative_guard].sort() };
}

function buildSceneSection(sceneAction: string): string {
  const isolated = isolateSceneAction(sceneAction);
  return cleanPromptSection(`[SCENE] ${isolated.sanitized_scene_action}`);
}

function buildTransitionSection(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledTransitionBinding[];
} {
  const transition = resolveTransitionDna(sequence.transition_id);
  const binding = toCompiledTransitionBinding(transition);
  const section = cleanPromptSection(
    [
      '[TRANSITION]',
      `id:${binding.transition_id}`,
      `from:${binding.from_state}`,
      `to:${binding.to_state}`,
      binding.continuity_glue,
    ].join(SECTION_JOINER)
  );
  return { section, bindings: [binding] };
}

function buildShotSection(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledShotBinding[];
} {
  const shot = resolveShotFingerprint(sequence.shot_id);
  const binding = toCompiledShotBinding(shot);
  const bias = [...shot.continuity_bias].sort().join(', ');
  const section = cleanPromptSection(
    [
      '[SHOT]',
      `id:${binding.shot_id}`,
      `framing:${binding.framing}`,
      `lens:${binding.lens_behavior}`,
      `motion:${binding.camera_motion}`,
      `distance:${binding.subject_distance}`,
      `role:${binding.cinematic_role}`,
      bias,
    ].join(SECTION_JOINER)
  );
  return { section, bindings: [binding] };
}

function buildMotionSection(sequence: CinematicSequenceCompileInput): {
  section: string;
  bindings: CompiledMotionBinding[];
} {
  const bridge = resolveEmotionMotionBridge(sequence.emotion_motion_bridge_id);
  const binding = toCompiledMotionBinding(bridge);
  const section = cleanPromptSection(
    [
      '[MOTION]',
      `bridge:${binding.bridge_id}`,
      `emotion:${binding.emotion}`,
      `body:${binding.body_motion}`,
      `pace:${binding.pacing_behavior}`,
      `eyes:${binding.eye_behavior}`,
      `space:${binding.spatial_behavior}`,
      binding.cinematic_effect,
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
  const motion = [...(input.motion ?? ['warm golden harbor light'])].sort();
  const sequence = input.cinematic_sequence;

  const imageAnchorBlock = buildImageAnchorSection(input.character_image_anchors);
  const characterBlock = buildCharacterSection(slotIds, input.character_image_anchors);
  const styleBlock = buildStyleSection(styleCoreIds);
  const envBlock = buildEnvSection(input.env_slot);
  const scenePackBlock = buildScenePackSection(sequence.scene_pack_id);
  const sceneBlock = buildSceneSection(input.scene_action);
  const transitionBlock = buildTransitionSection(sequence);
  const shotBlock = buildShotSection(sequence);
  const motionBlock = buildMotionSection(sequence);
  const cameraSupplement = buildCameraSupplement(camera, motion);

  const compiled_prompt = [
    imageAnchorBlock,
    characterBlock.section,
    styleBlock.section,
    envBlock.section,
    scenePackBlock.section,
    sceneBlock,
    transitionBlock.section,
    shotBlock.section,
    motionBlock.section,
    cameraSupplement,
  ].join(SECTION_JOINER);

  const compiled_negative_prompt = buildCompiledNegativePrompt(input.base_negative_prompt, [
    'text-only identity regeneration',
    'generic fantasy faces',
    'face drift',
    'identity collapse',
    'generic handsome man',
    'slideshow cut',
    'disconnected cuts',
    'random camera jump',
    ...scenePackBlock.negativeGuard,
  ]);

  if (!assertSceneIsolationClean(compiled_prompt) || !assertForbiddenTokensAbsent(compiled_prompt)) {
    throw new Error('PHASE-32D runtime prompt compiler failed isolation or conflict checks');
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
    JSON.stringify(scenePackBlock.binding),
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
    scene_pack_binding: scenePackBlock.binding,
    transition_bindings: transitionBlock.bindings,
    shot_bindings: shotBlock.bindings,
    motion_bindings: motionBlock.bindings,
    compile_fingerprint,
    assembly_order: [...CANONICAL_RUNTIME_ASSEMBLY_ORDER],
  };
}

export function assertCompiledPromptIntegrity(compiled: CompiledRenderPrompt): boolean {
  const prompt = compiled.compiled_prompt;
  return (
    prompt.startsWith('[IMAGE_ANCHOR]') &&
    prompt.includes('PRIMARY CHARACTER IDENTITY SOURCE: character_image_anchors') &&
    prompt.includes('[CHARACTER]') &&
    /Canonical Character: Gonegi/i.test(prompt) &&
    prompt.includes('Canonical Character: Dana') &&
    prompt.includes('[STYLE]') &&
    prompt.includes('[ENV]') &&
    prompt.includes('[SCENE_PACK]') &&
    prompt.includes('[TRANSITION]') &&
    prompt.includes('[SHOT]') &&
    prompt.includes('[MOTION]') &&
    prompt.includes('[SCENE]') &&
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
