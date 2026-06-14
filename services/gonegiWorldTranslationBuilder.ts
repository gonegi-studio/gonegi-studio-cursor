import fs from 'node:fs';
import path from 'node:path';
import { BLEND_CONTRACT_PATH } from './directorGrammarBlendBuilder.js';
import { IDENTITY_CONTRACT_SOURCE } from './sceneStateBuilder.js';
import { STATE_DRAFT_REGISTRY_PATH, loadStateDraft } from './sourceVideoCoordinateToStateCompiler.js';
import type { ExtractableFamily } from './directorGrammarExtractor.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const TRANSLATION_PHASE =
  'PHASE-SOURCE-VIDEO-011-GONEGI_WORLD_TRANSLATION_CONTRACT_V1' as const;
export const TRANSLATION_CONTRACT_PATH =
  'datasets/world_translation/gonegi-world-translation-contract.json' as const;
export const TRANSLATION_REGISTRY_PATH =
  'datasets/world_translation/gonegi-world-translation-registry.json' as const;
export const TRANSLATION_SCHEMA_PATH =
  'datasets/world_translation/gonegi-world-translation.schema.json' as const;
export const TRANSLATION_PROFILE_PATH =
  'datasets/world_translation/gonegi-master-world-translation-v1.json' as const;
export const LIVING_WORLD_FOUNDATION_INDEX_PATH =
  'datasets/living_world/living-world-foundation-index.json' as const;
export const LIVING_WORLD_INTEGRITY_INDEX_PATH =
  'datasets/living_world/living-world-integrity-index.json' as const;
export const LIVING_WORLD_ADAPTER_BOUNDARY_PATH =
  'datasets/living_world/living-world-adapter-boundary-plan.json' as const;
export const LIVING_WORLD_CORE_PATH =
  'exports/shared/latest/living-world-core-v1-package.json' as const;

export const TRANSLATION_PROFILE_ID = 'gonegi-master-world-translation-v1' as const;
export const TARGET_WORLD_IDENTITY = 'GONEGI_MEDITERRANEAN' as const;
export const TARGET_WORLD_TYPE = 'early-1900s mediterranean harbor town' as const;

const FAMILY_DRAFT_MAP: Record<ExtractableFamily, string> = {
  GHIBLI: 'state_draft_ghibli_kitchen_001_v2',
  SHINKAI: 'state_draft_shinkai_sky_light_001_v2',
  LIVE_ACTION: 'state_draft_live_action_dialogue_001_v2',
  MORI: 'state_draft_mori_emotion_flow_001_v2',
};

const FAMILY_SOURCE_WORLD: Record<ExtractableFamily, string> = {
  GHIBLI: 'ghibli_pastoral_fantasy',
  SHINKAI: 'shinkai_urban_contemplative',
  LIVE_ACTION: 'live_action_period_domestic',
  MORI: 'mori_woodland_craft_life',
};

type TranslationBlock = {
  strategy: string;
  rules: string[];
  replacement_supported: boolean;
  mappings?: Record<string, string>;
};

export type GonegiWorldTranslationProfile = {
  translation_id: typeof TRANSLATION_PROFILE_ID;
  phase: typeof TRANSLATION_PHASE;
  target_world_type: typeof TARGET_WORLD_TYPE;
  target_world_identity: typeof TARGET_WORLD_IDENTITY;
  director_blend_ref: string;
  family_translations: Record<
    ExtractableFamily,
    {
      source_world_type: string;
      target_world_type: typeof TARGET_WORLD_TYPE;
      target_world_identity: typeof TARGET_WORLD_IDENTITY;
      state_draft_ref: string;
      source_video_id: string;
    }
  >;
  character_translation: TranslationBlock;
  location_translation: TranslationBlock;
  prop_translation: TranslationBlock;
  environment_translation: TranslationBlock;
  emotion_translation: TranslationBlock;
  relationship_translation: TranslationBlock;
  camera_translation: TranslationBlock;
  lighting_translation: TranslationBlock;
  motion_translation: TranslationBlock;
  identity_rules: {
    identity_priority_rank: 1;
    character_first_contract: string;
    preserve_identity_locks: true;
    preserve_face_geometry: true;
    no_identity_swap_without_rule: true;
  };
  continuity_rules: {
    rules: string[];
    lock_preservation: true;
    layout_lock_required: true;
  };
  living_world_refs: {
    foundation_index: string;
    integrity_index: string;
    adapter_boundary_plan: string;
    living_world_core: string;
    world_identity: typeof TARGET_WORLD_IDENTITY;
  };
  source_state_draft_refs: Array<{
    state_draft_id: string;
    director_family: ExtractableFamily;
    source_video_id: string;
  }>;
  family_translation_status: Record<ExtractableFamily, 'PASS' | 'FAIL'>;
  execution_flags: {
    design_only: true;
    gpu_execution: false;
    external_call_allowed: false;
    frame_extraction: false;
    ocr: false;
    generation: false;
  };
  built_at: string;
};

type TranslationContract = {
  translation_id: string;
  director_blend_ref: string;
  target_world_type: string;
  translation_principles: string[];
};

type StateDraftRegistry = {
  state_drafts: Array<{
    state_draft_id: string;
    source_video_id: string;
    director_family: ExtractableFamily;
  }>;
};

type LivingWorldFoundation = {
  world_identity: string;
  verdict: string;
};

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  external_call_allowed: false as const,
  frame_extraction: false as const,
  ocr: false as const,
  generation: false as const,
};

function loadContract(projectRoot: string): TranslationContract | null {
  const abs = path.join(projectRoot, TRANSLATION_CONTRACT_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as TranslationContract;
}

function loadStateDraftRegistry(projectRoot: string): StateDraftRegistry | null {
  const abs = path.join(projectRoot, STATE_DRAFT_REGISTRY_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as StateDraftRegistry;
}

function loadLivingWorldFoundation(projectRoot: string): LivingWorldFoundation | null {
  const abs = path.join(projectRoot, LIVING_WORLD_FOUNDATION_INDEX_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as LivingWorldFoundation;
}

function buildTranslationBlocks(): Pick<
  GonegiWorldTranslationProfile,
  | 'character_translation'
  | 'location_translation'
  | 'prop_translation'
  | 'environment_translation'
  | 'emotion_translation'
  | 'relationship_translation'
  | 'camera_translation'
  | 'lighting_translation'
  | 'motion_translation'
> {
  return {
    character_translation: {
      strategy: 'canonical_cast_replacement',
      rules: [
        'map_source_protagonists_to_gonegi_cast',
        'preserve_primary_character_role',
        'preserve_companion_animal_when_present',
        'identity_lock_tokens_carry_to_target_character',
      ],
      replacement_supported: true,
      mappings: {
        protagonist_a: 'gonegi',
        protagonist_b: 'mare',
        solitary_figure: 'dana',
        sister_a: 'dana',
        sister_b: 'gonegi',
        walker_companion: 'gonegi',
        supporting_father: 'bardo',
        animal_companion: 'gamja',
      },
    },
    location_translation: {
      strategy: 'mediterranean_harbor_vocabulary',
      rules: [
        'domestic_kitchen_to_family_bakery_kitchen',
        'elevated_overlook_to_olive_hill_or_harbor_watch',
        'period_parlor_to_family_dining_room',
        'woodland_path_to_village_trail_or_harbor_outskirts',
        'preserve_walkable_zone_and_anchor_point_semantics',
      ],
      replacement_supported: true,
      mappings: {
        'domestic-kitchen': 'family_bakery_kitchen_01',
        'elevated-overlook': 'olive_hill_overlook_01',
        'period-parlor': 'family_dining_room_01',
        'woodland-path': 'village_trail_01',
      },
    },
    prop_translation: {
      strategy: 'mediterranean_prop_normalization',
      rules: [
        'tea_pot_to_bakery_kettle_or_teapot',
        'transit_ticket_to_harbor_ferry_ticket',
        'writing_desk_letter_to_sketchbook_or_letter_prop',
        'forage_basket_to_market_basket',
        'preserve_prop_anchor_locks',
      ],
      replacement_supported: true,
      mappings: {
        tea_pot: 'bakery_kettle_01',
        transit_ticket: 'harbor_ferry_ticket_01',
        writing_desk_letter: 'sketchbook_01',
        forage_basket: 'market_basket_01',
        window_sill_herbs: 'herb_window_sill_01',
        fireplace_practical: 'hearth_practical_01',
      },
    },
    environment_translation: {
      strategy: 'gonegi_mediterranean_environment_lock',
      rules: [
        'normalize_weather_to_mediterranean_profiles',
        'time_of_day_maps_to_living_world_time_library',
        'supporting_elements_use_harbor_village_cues',
        'no_future_tech_environment_tokens',
      ],
      replacement_supported: true,
      mappings: {
        clear_mediterranean: 'clear_mediterranean',
        overcast: 'harbor_overcast_soft',
        morning: 'morning_harbor_light',
        golden_hour: 'golden_harbor_hour',
        twilight: 'blue_hour_harbor',
      },
    },
    emotion_translation: {
      strategy: 'living_world_emotion_library',
      rules: [
        'warmth_maps_to_hope_or_gratitude',
        'longing_maps_to_nostalgia_or_loneliness',
        'tenderness_maps_to_reunion_or_gratitude',
        'craft_contentment_maps_to_hope',
        'preserve_emotion_intensity_curve',
      ],
      replacement_supported: true,
      mappings: {
        warmth: 'hope',
        longing: 'nostalgia',
        tenderness: 'reunion',
        craft_contentment: 'hope',
        companionship: 'friendship',
        solitary_contemplation: 'loneliness',
        sibling_bond: 'siblings',
        companion_walk: 'friendship',
      },
    },
    relationship_translation: {
      strategy: 'living_world_relationship_library',
      rules: [
        'ensemble_blocking_maps_to_relationship_grammar',
        'dialogue_pairs_map_to_siblings_or_friendship',
        'solitary_contemplation_maps_to_lonely_wonder',
        'preserve_participant_ids_after_character_replacement',
      ],
      replacement_supported: true,
      mappings: {
        companionship: 'friendship',
        solitary_contemplation: 'loneliness',
        sibling_bond: 'siblings',
        companion_walk: 'friendship',
      },
    },
    camera_translation: {
      strategy: 'director_blend_camera_grammar',
      rules: [
        'preserve_shot_type_and_blocking_geometry',
        'shinkai_sky_dominance_maps_to_harbor_horizon_frames',
        'ghibli_observational_patience_preserved',
        'mori_human_scale_path_following_preserved',
        'identity_safe_camera_default_true',
      ],
      replacement_supported: false,
    },
    lighting_translation: {
      strategy: 'director_blend_lighting_grammar',
      rules: [
        'shinkai_twilight_separation_to_harbor_blue_hour',
        'ghibli_warm_interior_to_bakery_hearth_practicals',
        'mori_canopy_dapple_to_olive_grove_dapple',
        'live_action_practical_warmth_to_mediterranean_interior',
      ],
      replacement_supported: false,
    },
    motion_translation: {
      strategy: 'director_blend_motion_grammar',
      rules: [
        'mori_daily_life_motion_to_harbor_chore_motion',
        'ghibli_task_motion_to_bakery_work_motion',
        'ambient_motion_preserved_in_environment_state',
        'no_chase_sequence_introduction',
      ],
      replacement_supported: false,
    },
  };
}

export function buildGonegiWorldTranslation(projectRoot?: string): GonegiWorldTranslationProfile {
  const root = resolveProjectRoot(projectRoot);
  const contract = loadContract(root);
  if (!contract) {
    throw new Error(`Missing translation contract: ${TRANSLATION_CONTRACT_PATH}`);
  }

  const draftRegistry = loadStateDraftRegistry(root);
  if (!draftRegistry?.state_drafts?.length) {
    throw new Error(`Missing state draft registry: ${STATE_DRAFT_REGISTRY_PATH}`);
  }

  const livingWorld = loadLivingWorldFoundation(root);
  if (!livingWorld) {
    throw new Error(`Missing living world foundation: ${LIVING_WORLD_FOUNDATION_INDEX_PATH}`);
  }

  if (!fs.existsSync(path.join(root, BLEND_CONTRACT_PATH))) {
    throw new Error(`Missing director blend contract: ${BLEND_CONTRACT_PATH}`);
  }

  const families = ['GHIBLI', 'SHINKAI', 'LIVE_ACTION', 'MORI'] as const;
  const family_translations = {} as GonegiWorldTranslationProfile['family_translations'];
  const source_state_draft_refs: GonegiWorldTranslationProfile['source_state_draft_refs'] = [];
  const family_translation_status = {} as Record<ExtractableFamily, 'PASS' | 'FAIL'>;

  for (const family of families) {
    const draftId = FAMILY_DRAFT_MAP[family];
    const registryEntry = draftRegistry.state_drafts.find((d) => d.state_draft_id === draftId);
    const draft = loadStateDraft(root, draftId);

    if (!registryEntry || !draft) {
      throw new Error(`Missing state draft for family ${family}: ${draftId}`);
    }

    family_translations[family] = {
      source_world_type: FAMILY_SOURCE_WORLD[family],
      target_world_type: TARGET_WORLD_TYPE,
      target_world_identity: TARGET_WORLD_IDENTITY,
      state_draft_ref: draftId,
      source_video_id: registryEntry.source_video_id,
    };

    source_state_draft_refs.push({
      state_draft_id: draftId,
      director_family: family,
      source_video_id: registryEntry.source_video_id,
    });

    family_translation_status[family] =
      draft.director_family === family &&
      draft.world_identity === TARGET_WORLD_IDENTITY &&
      draft.identity_state.identity_priority_rank === 1
        ? 'PASS'
        : 'FAIL';
  }

  const blendContract = JSON.parse(
    fs.readFileSync(path.join(root, BLEND_CONTRACT_PATH), 'utf8')
  ) as { blend_id: string };

  return {
    translation_id: TRANSLATION_PROFILE_ID,
    phase: TRANSLATION_PHASE,
    target_world_type: TARGET_WORLD_TYPE,
    target_world_identity: TARGET_WORLD_IDENTITY,
    director_blend_ref: blendContract.blend_id,
    family_translations,
    ...buildTranslationBlocks(),
    identity_rules: {
      identity_priority_rank: 1,
      character_first_contract: IDENTITY_CONTRACT_SOURCE,
      preserve_identity_locks: true,
      preserve_face_geometry: true,
      no_identity_swap_without_rule: true,
    },
    continuity_rules: {
      rules: [
        'preserve_identity_lock_tokens_through_translation',
        'preserve_location_lock_tokens_through_translation',
        'preserve_composition_and_prop_anchor_locks',
        'layout_lock_required_for_indoor_locations',
        'no_production_scene_state_registry_mutation',
        ...contract.translation_principles.filter((p) => p.includes('preserve') || p.includes('identity')),
      ],
      lock_preservation: true,
      layout_lock_required: true,
    },
    living_world_refs: {
      foundation_index: LIVING_WORLD_FOUNDATION_INDEX_PATH,
      integrity_index: LIVING_WORLD_INTEGRITY_INDEX_PATH,
      adapter_boundary_plan: LIVING_WORLD_ADAPTER_BOUNDARY_PATH,
      living_world_core: LIVING_WORLD_CORE_PATH,
      world_identity: TARGET_WORLD_IDENTITY,
    },
    source_state_draft_refs,
    family_translation_status,
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: new Date().toISOString(),
  };
}

export function writeGonegiWorldTranslation(projectRoot?: string): GonegiWorldTranslationProfile {
  const root = resolveProjectRoot(projectRoot);
  const profile = buildGonegiWorldTranslation(root);
  fs.writeFileSync(
    path.join(root, TRANSLATION_PROFILE_PATH),
    `${JSON.stringify(profile, null, 2)}\n`,
    'utf8'
  );
  return profile;
}

export function loadGonegiWorldTranslation(projectRoot?: string): GonegiWorldTranslationProfile | null {
  const root = resolveProjectRoot(projectRoot);
  const abs = path.join(root, TRANSLATION_PROFILE_PATH);
  if (!fs.existsSync(abs)) return null;
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as GonegiWorldTranslationProfile;
}
