import fs from 'node:fs';
import path from 'node:path';
import { BLEND_PROFILE_PATH } from './directorGrammarBlendBuilder.js';
import {
  REPLACEMENT_CONTRACT_ID,
  REPLACEMENT_CONTRACT_PATH,
  type CharacterReplacementContract,
  type ReplacementRule,
  loadCharacterReplacementContract,
} from './characterReplacementContractBuilder.js';
import {
  TRANSLATION_PROFILE_ID,
  TRANSLATION_PROFILE_PATH,
  type GonegiWorldTranslationProfile,
  loadGonegiWorldTranslation,
} from './gonegiWorldTranslationBuilder.js';
import {
  CHARACTER_SOURCE,
  COMPOSITION_LIBRARY_SOURCE,
  EMOTION_INDEX_SOURCE,
  IDENTITY_CONTRACT_SOURCE,
  LIGHTING_INDEX_SOURCE,
  LOCATION_INDEX_SOURCE,
  RELATIONSHIP_SOURCE,
  SCENE_STATE_PHASE,
  SHOT_INDEX_SOURCE,
  WORLD_IDENTITY,
} from './sceneStateBuilder.js';
import {
  STATE_DRAFT_REGISTRY_PATH,
  type SourceVideoStateDraft,
  loadStateDraft,
} from './sourceVideoCoordinateToStateCompiler.js';
import type { ExtractableFamily } from './directorGrammarExtractor.js';
import { VIDEO_STATE_DEFAULTS_ID } from './sourceVideoGrammarToVideoStateCompiler.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GONEGI_COMPILER_PHASE =
  'PHASE-SOURCE-VIDEO-013-SOURCE_STATE_TO_GONEGI_STATE_COMPILER_V1' as const;
export const GONEGI_STATE_SCHEMA_PATH = 'datasets/gonegi_state/gonegi-scene-state.schema.json' as const;
export const GONEGI_STATE_REGISTRY_PATH = 'datasets/gonegi_state/gonegi-scene-state-registry.json' as const;
export const GONEGI_STATES_DIR = 'datasets/gonegi_state/states' as const;

export const SEED_GONEGI_STATE_SPECS = Object.freeze([
  {
    gonegi_state_id: 'gonegi_state_ghibli_kitchen_v1',
    source_state_draft_id: 'state_draft_ghibli_kitchen_001_v2',
    director_family: 'GHIBLI' as const,
  },
  {
    gonegi_state_id: 'gonegi_state_shinkai_sky_light_v1',
    source_state_draft_id: 'state_draft_shinkai_sky_light_001_v2',
    director_family: 'SHINKAI' as const,
  },
  {
    gonegi_state_id: 'gonegi_state_live_action_dialogue_v1',
    source_state_draft_id: 'state_draft_live_action_dialogue_001_v2',
    director_family: 'LIVE_ACTION' as const,
  },
  {
    gonegi_state_id: 'gonegi_state_mori_emotion_flow_v1',
    source_state_draft_id: 'state_draft_mori_emotion_flow_001_v2',
    director_family: 'MORI' as const,
  },
] as const);

const CANONICAL_CAST = ['gonegi', 'dana', 'gamja', 'aengdu'] as const;
const COMPANION_PAIRS: Record<string, string> = { gonegi: 'gamja', dana: 'aengdu' };

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

export type GonegiSceneState = {
  gonegi_state_id: string;
  phase: typeof GONEGI_COMPILER_PHASE;
  scene_state_phase: typeof SCENE_STATE_PHASE;
  world_identity: typeof WORLD_IDENTITY;
  source_state_draft_id: string;
  source_video_id: string;
  director_family: ExtractableFamily;
  world_translation_ref: typeof TRANSLATION_PROFILE_ID;
  character_replacement_ref: typeof REPLACEMENT_CONTRACT_ID;
  director_blend_ref: string;
  video_defaults_ref: typeof VIDEO_STATE_DEFAULTS_ID;
  identity_state: SourceVideoStateDraft['identity_state'];
  character_state: SourceVideoStateDraft['character_state'] & { companion_injected: string[] };
  emotion_state: SourceVideoStateDraft['emotion_state'] & { source_emotion_id: string };
  relationship_state: SourceVideoStateDraft['relationship_state'];
  camera_state: SourceVideoStateDraft['camera_state'];
  composition_state: SourceVideoStateDraft['composition_state'];
  location_state: SourceVideoStateDraft['location_state'] & { source_location_type: string };
  lighting_state: SourceVideoStateDraft['lighting_state'];
  environment_state: SourceVideoStateDraft['environment_state'];
  translation_trace: {
    translation_id: string;
    source_world_type: string;
    target_world_identity: string;
    applied_dimensions: string[];
    location_mapping: Record<string, string>;
    prop_mappings: Record<string, string>;
    emotion_mapping: Record<string, string>;
  };
  replacement_trace: {
    contract_id: string;
    replacements_applied: Array<{
      source_role: string;
      target_character_id: string;
      replacement_id: string;
    }>;
    companions_injected: string[];
  };
  continuity_locks: SourceVideoStateDraft['continuity_locks'];
  production_status: {
    isolated: true;
    storage_domain: 'gonegi_state';
    production_registry: false;
    draft_status: 'gonegi_world_compiled_v1';
  };
  execution_flags: typeof EXECUTION_FLAGS;
  compiled_at: string;
};

function findReplacement(
  contract: CharacterReplacementContract,
  sourceRole: string
): ReplacementRule | undefined {
  return contract.replacements.find((r) => r.source_role === sourceRole);
}

function translateLocation(
  translation: GonegiWorldTranslationProfile,
  locationType: string
): { location_id: string; location_type: string } {
  const mapped = translation.location_translation.mappings?.[locationType];
  if (mapped) {
    return { location_id: mapped, location_type: locationType };
  }
  return {
    location_id: `gonegi_translated_${locationType.replace(/-/g, '_')}`,
    location_type: locationType,
  };
}

function translateProp(translation: GonegiWorldTranslationProfile, propId: string): string {
  return translation.prop_translation.mappings?.[propId] ?? propId;
}

function translateEmotion(translation: GonegiWorldTranslationProfile, emotionId: string): string {
  return translation.emotion_translation.mappings?.[emotionId] ?? emotionId;
}

function translateRelationship(
  translation: GonegiWorldTranslationProfile,
  relationshipId: string | undefined
): string | undefined {
  if (!relationshipId) return relationshipId;
  return translation.relationship_translation.mappings?.[relationshipId] ?? relationshipId;
}

function injectCompanions(characterIds: string[]): { ids: string[]; injected: string[] } {
  const ids = [...characterIds];
  const injected: string[] = [];

  for (const [primary, companion] of Object.entries(COMPANION_PAIRS)) {
    if (ids.includes(primary) && !ids.includes(companion)) {
      ids.push(companion);
      injected.push(companion);
    }
  }

  return { ids: dedupeCanonical(ids), injected };
}

function dedupeCanonical(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (CANONICAL_CAST.includes(id as (typeof CANONICAL_CAST)[number])) {
      if (!seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    } else if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  }
  return result;
}

function buildIdentityLocks(
  contract: CharacterReplacementContract,
  characterIds: string[]
): string[] {
  const locks: string[] = [];
  for (const charId of characterIds) {
    const rule = contract.replacements.find((r) => r.target_character_id === charId);
    if (rule) {
      locks.push(...rule.continuity_locks);
    }
  }
  return [...new Set(locks)];
}

export function compileGonegiSceneState(
  projectRoot: string,
  spec: (typeof SEED_GONEGI_STATE_SPECS)[number],
  sourceDraft: SourceVideoStateDraft,
  translation: GonegiWorldTranslationProfile,
  replacement: CharacterReplacementContract
): GonegiSceneState {
  const familyTranslation = translation.family_translations[spec.director_family];
  const replacementsApplied: GonegiSceneState['replacement_trace']['replacements_applied'] = [];

  const roleToTarget = new Map<string, string>();
  for (const sourceRole of sourceDraft.character_state.active_character_ids) {
    const rule = findReplacement(replacement, sourceRole);
    if (!rule) {
      throw new Error(`No replacement rule for source role: ${sourceRole}`);
    }
    roleToTarget.set(sourceRole, rule.target_character_id);
    replacementsApplied.push({
      source_role: sourceRole,
      target_character_id: rule.target_character_id,
      replacement_id: rule.replacement_id,
    });
  }

  let activeIds = [...roleToTarget.values()];
  const primarySource = sourceDraft.character_state.primary_character_id;
  const primaryTarget = roleToTarget.get(primarySource) ?? activeIds[0];

  const { ids: withCompanions, injected } = injectCompanions(activeIds);
  activeIds = withCompanions;

  const characterPositions: Record<string, string> = {};
  for (const [sourceRole, position] of Object.entries(
    sourceDraft.composition_state.character_positions
  )) {
    const target = roleToTarget.get(sourceRole);
    if (target) characterPositions[target] = position;
  }
  for (const companion of injected) {
    const paired = companion === 'gamja' ? 'gonegi' : 'dana';
    if (characterPositions[paired]) {
      characterPositions[companion] = `${characterPositions[paired]}_companion_near`;
    }
  }

  const sourceLocationType = sourceDraft.location_state.location_type;
  const translatedLocation = translateLocation(translation, sourceLocationType);

  const propMappings: Record<string, string> = {};
  const translatedProps = sourceDraft.composition_state.prop_anchor_ids.map((prop) => {
    const translated = translateProp(translation, prop);
    propMappings[prop] = translated;
    return translated;
  });

  const sourceEmotion = sourceDraft.emotion_state.emotion_id;
  const translatedEmotion = translateEmotion(translation, sourceEmotion);

  const translatedParticipants = activeIds.filter((id) =>
    CANONICAL_CAST.includes(id as (typeof CANONICAL_CAST)[number])
  );

  const identityLocks = buildIdentityLocks(replacement, activeIds);

  return {
    gonegi_state_id: spec.gonegi_state_id,
    phase: GONEGI_COMPILER_PHASE,
    scene_state_phase: SCENE_STATE_PHASE,
    world_identity: WORLD_IDENTITY,
    source_state_draft_id: spec.source_state_draft_id,
    source_video_id: sourceDraft.source_video_id,
    director_family: spec.director_family,
    world_translation_ref: TRANSLATION_PROFILE_ID,
    character_replacement_ref: REPLACEMENT_CONTRACT_ID,
    director_blend_ref: sourceDraft.director_blend_ref,
    video_defaults_ref: VIDEO_STATE_DEFAULTS_ID,
    identity_state: {
      identity_priority_rank: 1,
      identity_source: IDENTITY_CONTRACT_SOURCE,
      character_first_contract: IDENTITY_CONTRACT_SOURCE,
      protected_character_ids: activeIds.filter((id) =>
        CANONICAL_CAST.includes(id as (typeof CANONICAL_CAST)[number])
      ),
      identity_lock_tokens: identityLocks,
      location_lock_tokens: [
        `location_id:${translatedLocation.location_id}`,
        sourceDraft.location_state.layout_lock_id ?? `layout_lock:${sourceLocationType}`,
      ],
      composition_lock_tokens: translatedProps.map((p) => `prop_anchor:${p}`),
    },
    character_state: {
      active_character_ids: activeIds,
      primary_character_id: primaryTarget,
      character_source: CHARACTER_SOURCE,
      character_tokens: activeIds.map((id) => `character:${id}`),
      companion_injected: injected,
    },
    emotion_state: {
      emotion_id: translatedEmotion,
      emotion_source: EMOTION_INDEX_SOURCE,
      intensity: sourceDraft.emotion_state.intensity,
      acting_visibility_weight: sourceDraft.emotion_state.acting_visibility_weight,
      source_emotion_id: sourceEmotion,
    },
    relationship_state: {
      relationship_id: translateRelationship(
        translation,
        sourceDraft.relationship_state.relationship_id
      ),
      relationship_source: RELATIONSHIP_SOURCE,
      participant_ids: translatedParticipants,
      distance_behavior: sourceDraft.relationship_state.distance_behavior,
      gaze_pattern: sourceDraft.relationship_state.gaze_pattern
        ?.split(' / ')
        .map((part) => roleToTarget.get(part.trim()) ?? part.trim())
        .join(' / '),
      blocking_primary_focus: sourceDraft.relationship_state.blocking_primary_focus,
    },
    camera_state: { ...sourceDraft.camera_state, camera_source: SHOT_INDEX_SOURCE },
    composition_state: {
      composition_id: `gonegi_composition_${spec.gonegi_state_id}`,
      composition_source: COMPOSITION_LIBRARY_SOURCE,
      prop_anchor_ids: translatedProps,
      character_positions: characterPositions,
      depth_layers: sourceDraft.composition_state.depth_layers,
      negative_space: sourceDraft.composition_state.negative_space,
    },
    location_state: {
      location_id: translatedLocation.location_id,
      location_name: translatedLocation.location_type,
      location_type: translatedLocation.location_type,
      domain: 'gonegi_state_draft',
      location_source: LOCATION_INDEX_SOURCE,
      layout_lock_id: `layout_lock:${translatedLocation.location_id}`,
      walkable_zone: sourceDraft.location_state.walkable_zone,
      source_location_type: sourceLocationType,
    },
    lighting_state: {
      ...sourceDraft.lighting_state,
      lighting_id: `gonegi_lighting_${spec.gonegi_state_id}`,
      lighting_source: LIGHTING_INDEX_SOURCE,
    },
    environment_state: {
      ...sourceDraft.environment_state,
      world_identity: WORLD_IDENTITY,
      environment_source: LOCATION_INDEX_SOURCE,
    },
    translation_trace: {
      translation_id: translation.translation_id,
      source_world_type: familyTranslation.source_world_type,
      target_world_identity: WORLD_IDENTITY,
      applied_dimensions: [
        'character_translation',
        'location_translation',
        'prop_translation',
        'emotion_translation',
        'relationship_translation',
        'environment_translation',
      ],
      location_mapping: { [sourceLocationType]: translatedLocation.location_id },
      prop_mappings: propMappings,
      emotion_mapping: { [sourceEmotion]: translatedEmotion },
    },
    replacement_trace: {
      contract_id: replacement.contract_id,
      replacements_applied: replacementsApplied,
      companions_injected: injected,
    },
    continuity_locks: {
      identity_locks: identityLocks,
      location_locks: [
        `location_id:${translatedLocation.location_id}`,
        ...(sourceDraft.continuity_locks.location_locks ?? []),
      ],
      composition_locks: [
        ...translatedProps.map((p) => `prop_anchor:${p}`),
        ...(sourceDraft.continuity_locks.composition_locks ?? []),
      ],
    },
    production_status: {
      isolated: true,
      storage_domain: 'gonegi_state',
      production_registry: false,
      draft_status: 'gonegi_world_compiled_v1',
    },
    execution_flags: { ...EXECUTION_FLAGS },
    compiled_at: new Date().toISOString(),
  };
}

export function compileAllGonegiSceneStates(projectRoot?: string): GonegiSceneState[] {
  const root = resolveProjectRoot(projectRoot);

  if (!fs.existsSync(path.join(root, STATE_DRAFT_REGISTRY_PATH))) {
    throw new Error(`Missing state draft registry: ${STATE_DRAFT_REGISTRY_PATH}`);
  }

  const translation = loadGonegiWorldTranslation(root);
  if (!translation) {
    throw new Error(`Missing world translation profile: ${TRANSLATION_PROFILE_PATH}`);
  }

  const replacement = loadCharacterReplacementContract(root);
  if (!replacement) {
    throw new Error(`Missing character replacement contract: ${REPLACEMENT_CONTRACT_PATH}`);
  }

  if (!fs.existsSync(path.join(root, BLEND_PROFILE_PATH))) {
    throw new Error(`Missing director blend profile: ${BLEND_PROFILE_PATH}`);
  }

  const states: GonegiSceneState[] = [];
  for (const spec of SEED_GONEGI_STATE_SPECS) {
    const draft = loadStateDraft(root, spec.source_state_draft_id);
    if (!draft) {
      throw new Error(`Missing source state draft: ${spec.source_state_draft_id}`);
    }
    states.push(compileGonegiSceneState(root, spec, draft, translation, replacement));
  }

  return states;
}

export function writeGonegiSceneStates(projectRoot?: string): {
  states: GonegiSceneState[];
  written: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const states = compileAllGonegiSceneStates(root);
  const outDir = path.join(root, GONEGI_STATES_DIR);
  fs.mkdirSync(outDir, { recursive: true });

  const written: string[] = [];
  for (const state of states) {
    const rel = `${GONEGI_STATES_DIR}/${state.gonegi_state_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    written.push(rel);
  }

  return { states, written };
}

export function loadGonegiSceneState(
  projectRoot: string,
  gonegiStateId: string
): GonegiSceneState | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, GONEGI_STATES_DIR, `${gonegiStateId}.json`);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiSceneState;
}
