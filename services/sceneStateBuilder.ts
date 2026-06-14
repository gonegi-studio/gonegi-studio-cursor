import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SCENE_STATE_PHASE = 'PHASE-18-STATE-ENGINE-FOUNDATION-001' as const;
export const WORLD_IDENTITY = 'GONEGI_MEDITERRANEAN' as const;

export const CHARACTER_SOURCE = 'datasets/character/character-simple-v1.json' as const;
export const LOCATION_INDEX_SOURCE = 'datasets/location/location-dna-index-v1.json' as const;
export const OUTDOOR_LOCATION_INDEX_SOURCE =
  'datasets/location/outdoor-layout-lock-index-v1.json' as const;
export const LIGHTING_INDEX_SOURCE = 'datasets/lighting/lighting-dna-index-v1.json' as const;
export const LIGHTING_LIBRARY_SOURCE = 'datasets/lighting/lighting-dna-library-v1.json' as const;
export const EMOTION_INDEX_SOURCE = 'datasets/emotion_acting/emotion-acting-dna-index-v1.json' as const;
export const RELATIONSHIP_SOURCE = 'datasets/relationship/relationship-grammar-library.json' as const;
export const COMPOSITION_LIBRARY_SOURCE =
  'datasets/scene/scene-asset-composition-library-v1.json' as const;
export const SHOT_INDEX_SOURCE = 'datasets/shot/coverage-grammar-index-v1.json' as const;
export const IDENTITY_CONTRACT_SOURCE =
  'exports/image_app/contracts/character-first-contract.json' as const;

export type SceneStateBuildInput = {
  scene_state_id: string;
  active_character_ids: string[];
  primary_character_id: string;
  location_id: string;
  emotion_id: string;
  relationship_id?: string;
  composition_id?: string;
  coverage_id?: string;
  shot_type?: string;
  lighting_id?: string;
  transition_from?: string;
  transition_type?: string;
};

export type SceneState = {
  scene_state_id: string;
  phase: typeof SCENE_STATE_PHASE;
  world_identity: typeof WORLD_IDENTITY;
  character_state: {
    active_character_ids: string[];
    primary_character_id: string;
    character_source: string;
    character_tokens: string[];
  };
  location_state: {
    location_id: string;
    location_name: string;
    location_type: string;
    domain: string;
    location_source: string;
    layout_lock_id?: string;
    outdoor_layout_id?: string;
  };
  lighting_state: {
    lighting_id: string;
    lighting_source: string;
    color_temperature_k?: number;
    direction?: string;
    intensity?: string;
  };
  emotion_state: {
    emotion_id: string;
    emotion_source: string;
    intensity: number;
    acting_visibility_weight: string;
  };
  relationship_state: {
    relationship_id?: string;
    relationship_source: string;
    participant_ids: string[];
    distance_behavior?: string;
    gaze_pattern?: string;
  };
  camera_state: {
    shot_type: string;
    coverage_id?: string;
    camera_source: string;
    camera_position?: string;
    camera_height?: string;
    camera_direction?: string;
  };
  composition_state: {
    composition_id?: string;
    composition_source: string;
    prop_anchor_ids: string[];
    character_positions: Record<string, string>;
  };
  environment_state: {
    world_identity: string;
    world_type: string;
    environment_source: string;
    time_setting_id?: string;
    weather_profile?: string;
    supporting_elements: string[];
  };
  identity_state: {
    identity_priority_rank: number;
    identity_source: string;
    character_first_contract: string;
    protected_character_ids: string[];
    identity_lock_tokens: string[];
  };
  transition?: {
    from_scene_state_id: string;
    transition_type: string;
    continuity_safe: boolean;
  };
  source_refs: Record<string, string>;
  built_at: string;
};

function readJson<T>(root: string, relPath: string): T {
  const abs = path.join(root, relPath);
  return JSON.parse(fs.readFileSync(abs, 'utf8')) as T;
}

function resolveLightingForLocation(
  root: string,
  locationId: string,
  explicitLightingId?: string
): string {
  if (explicitLightingId) return explicitLightingId;

  const library = readJson<{
    section_4_location_pairing?: {
      pairings?: Array<{ location_id: string; lighting_id: string; pairing_role?: string }>;
    };
  }>(root, LIGHTING_LIBRARY_SOURCE);

  const pairing = library.section_4_location_pairing?.pairings?.find(
    (p) => p.location_id === locationId && (p.pairing_role === 'primary' || !p.pairing_role)
  );
  return pairing?.lighting_id ?? 'morning_harbor_dock';
}

function resolveOutdoorLayoutId(root: string, locationId: string): string | undefined {
  const outdoor = readJson<{
    entries?: Array<{ location_id: string; outdoor_layout_id: string }>;
  }>(root, OUTDOOR_LOCATION_INDEX_SOURCE);
  return outdoor.entries?.find((e) => e.location_id === locationId)?.outdoor_layout_id;
}

export function buildSceneState(
  projectRoot: string,
  input: SceneStateBuildInput
): SceneState {
  const root = resolveProjectRoot(projectRoot);

  const characters = readJson<{
    characters: Array<{ character_id: string; display_name_en?: string }>;
  }>(root, CHARACTER_SOURCE);

  const locationIndex = readJson<{
    entries: Array<{
      location_id: string;
      location_name?: string;
      location_type?: string;
      domain?: string;
    }>;
  }>(root, LOCATION_INDEX_SOURCE);

  const emotionIndex = readJson<{
    entries: Array<{ emotion_id: string; primary_shot_types?: string[] }>;
  }>(root, EMOTION_INDEX_SOURCE);

  const relationshipLib = readJson<{
    patterns: Array<{
      relationship_id: string;
      distance_behavior?: string;
      gaze_pattern?: string;
    }>;
  }>(root, RELATIONSHIP_SOURCE);

  const compositionLib = readJson<{
    compositions: Array<{
      composition_id: string;
      location_id: string;
      layout_id?: string;
      prop_anchor_ids?: string[];
      character_positions?: Record<string, string>;
      camera_position?: string;
      camera_height?: string;
      camera_direction?: string;
    }>;
  }>(root, COMPOSITION_LIBRARY_SOURCE);

  const shotIndex = readJson<{
    entries: Array<{ coverage_id: string; coverage_name?: string }>;
  }>(root, SHOT_INDEX_SOURCE);

  const locationEntry =
    locationIndex.entries.find((e) => e.location_id === input.location_id) ?? {
      location_id: input.location_id,
      location_name: input.location_id,
      location_type: 'unknown',
      domain: 'unknown',
    };

  const emotionEntry = emotionIndex.entries.find((e) => e.emotion_id === input.emotion_id);
  const relationshipEntry = input.relationship_id
    ? relationshipLib.patterns.find((p) => p.relationship_id === input.relationship_id)
    : undefined;

  const compositionEntry = input.composition_id
    ? compositionLib.compositions.find((c) => c.composition_id === input.composition_id)
    : undefined;

  const coverageEntry = input.coverage_id
    ? shotIndex.entries.find((e) => e.coverage_id === input.coverage_id)
    : undefined;

  const lightingId = resolveLightingForLocation(root, input.location_id, input.lighting_id);
  const outdoorLayoutId = resolveOutdoorLayoutId(root, input.location_id);

  const characterTokens = input.active_character_ids.map(
    (id) => `character:${id}`
  );

  const identityLockTokens = input.active_character_ids.flatMap((id) => {
    const character = characters.characters.find((c) => c.character_id === id);
    return [
      `identity:character_identity:${id}`,
      `character_reference:${character?.display_name_en ?? id}`,
    ];
  });

  const shotType =
    input.shot_type ??
    emotionEntry?.primary_shot_types?.[0] ??
    compositionEntry?.camera_height ??
    'medium';

  const built: SceneState = {
    scene_state_id: input.scene_state_id,
    phase: SCENE_STATE_PHASE,
    world_identity: WORLD_IDENTITY,
    character_state: {
      active_character_ids: [...input.active_character_ids],
      primary_character_id: input.primary_character_id,
      character_source: CHARACTER_SOURCE,
      character_tokens: characterTokens,
    },
    location_state: {
      location_id: locationEntry.location_id,
      location_name: locationEntry.location_name ?? locationEntry.location_id,
      location_type: locationEntry.location_type ?? 'unknown',
      domain: locationEntry.domain ?? 'unknown',
      location_source: LOCATION_INDEX_SOURCE,
      ...(compositionEntry?.layout_id ? { layout_lock_id: compositionEntry.layout_id } : {}),
      ...(outdoorLayoutId ? { outdoor_layout_id: outdoorLayoutId } : {}),
    },
    lighting_state: {
      lighting_id: lightingId,
      lighting_source: LIGHTING_INDEX_SOURCE,
      intensity: 'scene_default',
      direction: 'motivated_natural',
    },
    emotion_state: {
      emotion_id: input.emotion_id,
      emotion_source: EMOTION_INDEX_SOURCE,
      intensity: 0.65,
      acting_visibility_weight: shotType === 'close' ? 'highest' : 'medium',
    },
    relationship_state: {
      ...(input.relationship_id ? { relationship_id: input.relationship_id } : {}),
      relationship_source: RELATIONSHIP_SOURCE,
      participant_ids: [...input.active_character_ids],
      ...(relationshipEntry?.distance_behavior
        ? { distance_behavior: relationshipEntry.distance_behavior }
        : {}),
      ...(relationshipEntry?.gaze_pattern ? { gaze_pattern: relationshipEntry.gaze_pattern } : {}),
    },
    camera_state: {
      shot_type: shotType,
      ...(input.coverage_id ? { coverage_id: input.coverage_id } : {}),
      camera_source: SHOT_INDEX_SOURCE,
      ...(compositionEntry?.camera_position
        ? { camera_position: compositionEntry.camera_position }
        : {}),
      ...(compositionEntry?.camera_height
        ? { camera_height: compositionEntry.camera_height }
        : {}),
      ...(compositionEntry?.camera_direction
        ? { camera_direction: compositionEntry.camera_direction }
        : {}),
      ...(coverageEntry?.coverage_name ? { camera_position: coverageEntry.coverage_name } : {}),
    },
    composition_state: {
      ...(input.composition_id ? { composition_id: input.composition_id } : {}),
      composition_source: COMPOSITION_LIBRARY_SOURCE,
      prop_anchor_ids: compositionEntry?.prop_anchor_ids ?? [],
      character_positions: compositionEntry?.character_positions ?? {},
    },
    environment_state: {
      world_identity: WORLD_IDENTITY,
      world_type: 'early-1900s mediterranean harbor town',
      environment_source: LOCATION_INDEX_SOURCE,
      time_setting_id: lightingId.includes('sunrise')
        ? 'sunrise'
        : lightingId.includes('morning')
          ? 'morning'
          : 'day',
      weather_profile: 'clear_mediterranean',
      supporting_elements: outdoorLayoutId ? [outdoorLayoutId] : [],
    },
    identity_state: {
      identity_priority_rank: 1,
      identity_source: IDENTITY_CONTRACT_SOURCE,
      character_first_contract: IDENTITY_CONTRACT_SOURCE,
      protected_character_ids: [...input.active_character_ids],
      identity_lock_tokens: identityLockTokens,
    },
    source_refs: {
      character: CHARACTER_SOURCE,
      location: LOCATION_INDEX_SOURCE,
      lighting: LIGHTING_INDEX_SOURCE,
      emotion: EMOTION_INDEX_SOURCE,
      relationship: RELATIONSHIP_SOURCE,
      composition: COMPOSITION_LIBRARY_SOURCE,
      camera: SHOT_INDEX_SOURCE,
      identity: IDENTITY_CONTRACT_SOURCE,
    },
    built_at: new Date().toISOString(),
  };

  if (input.transition_from) {
    built.transition = {
      from_scene_state_id: input.transition_from,
      transition_type: input.transition_type ?? 'scene_change',
      continuity_safe: true,
    };
  }

  return built;
}

export function buildRegistrySeedStates(projectRoot?: string): SceneState[] {
  const root = resolveProjectRoot(projectRoot);
  return [
    buildSceneState(root, {
      scene_state_id: 'scene_gonegi_bedroom_reading_v1',
      active_character_ids: ['gonegi', 'gamja'],
      primary_character_id: 'gonegi',
      location_id: 'gonegi_bedroom_01',
      emotion_id: 'hope',
      relationship_id: 'friendship',
      composition_id: 'gonegi_bedroom_reading',
      coverage_id: 'coverage_pattern_01_establishing_insert_reaction',
      shot_type: 'medium',
      lighting_id: 'sunrise_bakery_bedroom',
    }),
    buildSceneState(root, {
      scene_state_id: 'scene_gonegi_dana_harbor_reunion_v1',
      active_character_ids: ['gonegi', 'dana'],
      primary_character_id: 'gonegi',
      location_id: 'harbor_watch_point_01',
      emotion_id: 'reunion',
      relationship_id: 'first_love',
      coverage_id: 'coverage_pattern_02_environmental_close',
      shot_type: 'close',
    }),
    buildSceneState(root, {
      scene_state_id: 'scene_olive_hill_overlook_wonder_v1',
      active_character_ids: ['dana'],
      primary_character_id: 'dana',
      location_id: 'olive_hill_01',
      emotion_id: 'wonder',
      coverage_id: 'coverage_pattern_03_pov_insert_chain',
      shot_type: 'close',
      transition_from: 'scene_gonegi_bedroom_reading_v1',
      transition_type: 'location_change',
    }),
  ];
}

export function writeSceneStates(
  projectRoot: string,
  states: SceneState[],
  storageDir = 'datasets/state/scene-states'
): string[] {
  const root = resolveProjectRoot(projectRoot);
  const absDir = path.join(root, storageDir);
  fs.mkdirSync(absDir, { recursive: true });

  const written: string[] = [];
  for (const state of states) {
    const rel = `${storageDir}/${state.scene_state_id}.json`;
    fs.writeFileSync(path.join(root, rel), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    written.push(rel);
  }
  return written;
}
