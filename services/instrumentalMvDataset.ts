import fs from 'node:fs';
import path from 'node:path';
import { enrichAnchorsWithEmotionActing } from './emotionActing.js';
import { enrichLocationContinuityAnchorsWithIndoorAnchor } from './indoorLocationAnchor.js';
import { enrichLocationContinuityAnchorsWithPropAnchor } from './propAnchor.js';
import { enrichLocationContinuityAnchorsWithOutdoorLayoutLock } from './outdoorLayoutLock.js';
import { enrichLocationContinuityAnchorsWithRoomLayoutLock } from './roomLayoutLock.js';
import {
  DEFAULT_COMPOSITION_BY_LOCATION,
  enrichLocationContinuityAnchorsWithSceneComposition,
} from './sceneAssetComposition.js';
import { enrichAnchorsWithLightingAnchor } from './lightingAnchor.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  buildShotCoverageRenderPayload,
  getCoverageById,
  resolveCoverageFromAdapterMap,
} from './shotGrammar.js';

export const INSTRUMENTAL_MV_LIBRARY_PATH =
  'datasets/mv/instrumental-mv-archetype-library-v1.json' as const;
export const INSTRUMENTAL_MV_INDEX_PATH =
  'datasets/mv/instrumental-mv-archetype-index-v1.json' as const;
export const INSTRUMENTAL_MV_ADAPTER_PATH =
  'exports/image_app/adapters/instrumental-mv-adapter.json' as const;

export const INITIAL_MV_ARCHETYPE_IDS = [
  'harbor_morning_walk',
  'olive_hill_daydream',
  'bakery_daily_life',
  'window_memory_montage',
  'harbor_sunset_reflection',
  'rainy_street_observation',
  'festival_preparation',
  'seaside_evening_journey',
] as const;

export type MvArchetypeId = (typeof INITIAL_MV_ARCHETYPE_IDS)[number];

export const VALIDATED_SYSTEM_REFS = {
  character_dna: 'exports/character-continuity-preview.json',
  location_dna: 'exports/location-continuity-preview.json',
  indoor_anchor: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
  lighting_anchor: 'exports/image_app/adapters/lighting-anchor-adapter.json',
  shot_grammar: 'exports/image_app/adapters/shot-grammar-adapter.json',
  emotion_acting: 'exports/image_app/adapters/emotion-acting-adapter.json',
} as const;

export const REQUIRED_MV_ARCHETYPE_FIELDS = [
  'mv_archetype_id',
  'theme',
  'emotion_flow',
  'location_flow',
  'lighting_flow',
  'coverage_flow',
  'character_focus',
  'environmental_focus',
  'scene_count_range',
  'recommended_duration',
] as const;

export type MvSceneBlueprint = {
  scene_index: number;
  scene_goal: string;
  character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  lighting_dna_id: string;
  coverage_id: string;
  emotion_id: string;
  scene_archetype: string;
  action_type: string;
};

export type MvArchetypeRecord = {
  mv_archetype_id: string;
  theme: string;
  emotion_flow: readonly string[];
  location_flow: readonly string[];
  lighting_flow: readonly string[];
  coverage_flow: readonly string[];
  character_focus: readonly string[];
  environmental_focus: readonly string[];
  scene_count_range: string;
  recommended_duration: string;
  scene_blueprints: readonly MvSceneBlueprint[];
};

export type InstrumentalMvLibrary = {
  archetypes: readonly MvArchetypeRecord[];
  integrated_systems?: Record<string, string>;
  archetype_count?: number;
};

export type InstrumentalMvIndexEntry = {
  mv_archetype_id: string;
  theme: string;
  recommended_duration: string;
};

export type InstrumentalMvIndex = {
  entries: readonly InstrumentalMvIndexEntry[];
  archetype_count?: number;
};

export type MvSceneRenderPayload = {
  scene_index: number;
  scene_goal: string;
  character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  emotion_id: string;
  coverage_id: string;
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  continuity_tokens: readonly string[];
  shot_payload: ReturnType<typeof buildShotCoverageRenderPayload> | null;
};

export type MvArchetypeRenderPayload = {
  mv_archetype_id: string;
  theme: string;
  recommended_duration: string;
  scene_count_range: string;
  scene_sequence: readonly MvSceneRenderPayload[];
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  mv_tokens: readonly string[];
  output_target: {
    format: 'instrumental_mv_image_sequence';
    duration_minutes: string;
    video_compatible: boolean;
    lyrics: false;
    dialogue: false;
  };
  integrated_system_refs: typeof VALIDATED_SYSTEM_REFS;
};

export type MvArchetypeMapEntry = {
  mv_archetype_id: string;
  scene_sequence: readonly MvSceneRenderPayload[];
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  render_payload: MvArchetypeRenderPayload;
};

export type InstrumentalMvAdapter = {
  archetype_to_sequence_map: readonly MvArchetypeMapEntry[];
};

const INDOOR_LOCATION_IDS = new Set([
  'gonegi_bedroom_01',
  'gonegi_window_corner_01',
  'family_bakery_kitchen_01',
  'family_bakery_dining_01',
  'dana_bedroom_01',
  'dana_window_corner_01',
]);

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing instrumental MV asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadInstrumentalMvLibrary(projectRoot?: string): InstrumentalMvLibrary {
  return readJson(resolveProjectRoot(projectRoot), INSTRUMENTAL_MV_LIBRARY_PATH);
}

export function loadInstrumentalMvIndex(projectRoot?: string): InstrumentalMvIndex {
  return readJson(resolveProjectRoot(projectRoot), INSTRUMENTAL_MV_INDEX_PATH);
}

export function loadInstrumentalMvAdapter(projectRoot?: string): InstrumentalMvAdapter {
  return readJson(resolveProjectRoot(projectRoot), INSTRUMENTAL_MV_ADAPTER_PATH);
}

export function getMvArchetypeById(
  archetypeId: string,
  projectRoot?: string
): MvArchetypeRecord | null {
  const library = loadInstrumentalMvLibrary(projectRoot);
  return library.archetypes.find((row) => row.mv_archetype_id === archetypeId) ?? null;
}

export function buildSceneContinuityTokens(
  blueprint: MvSceneBlueprint,
  projectRoot?: string
): string[] {
  const coverage = getCoverageById(blueprint.coverage_id, projectRoot);
  const primaryShot = coverage?.coverage_sequence[0] ?? 'medium';

  const base = [
    `mv-scene:${blueprint.scene_index}`,
    `character:${blueprint.character_id}`,
    `location:${blueprint.location_id}`,
    `scene-goal:${blueprint.scene_goal}`,
    `lighting-dna:${blueprint.lighting_dna_id}`,
    `environmental-focus:${blueprint.scene_index}`,
  ];

  let merged = enrichAnchorsWithLightingAnchor(base, blueprint.lighting_dna_id, projectRoot);

  if (INDOOR_LOCATION_IDS.has(blueprint.location_id)) {
    merged = enrichLocationContinuityAnchorsWithIndoorAnchor(
      merged,
      [blueprint.location_id],
      primaryShot,
      projectRoot
    );
    merged = enrichLocationContinuityAnchorsWithPropAnchor(
      merged,
      [blueprint.location_id],
      primaryShot,
      projectRoot
    );
    merged = enrichLocationContinuityAnchorsWithRoomLayoutLock(
      merged,
      [blueprint.location_id],
      primaryShot,
      projectRoot
    );
  } else {
    merged = enrichLocationContinuityAnchorsWithOutdoorLayoutLock(
      merged,
      [blueprint.location_id],
      primaryShot,
      projectRoot,
      DEFAULT_COMPOSITION_BY_LOCATION[blueprint.location_id],
      'v2'
    );
  }

  const compositionId = DEFAULT_COMPOSITION_BY_LOCATION[blueprint.location_id];
  if (compositionId) {
    merged = enrichLocationContinuityAnchorsWithSceneComposition(
      merged,
      compositionId,
      projectRoot
    );
  }

  const coverageResolution = resolveCoverageFromAdapterMap(
    {
      scene_archetype: blueprint.scene_archetype,
      location_id: blueprint.location_id,
      lighting_anchor_id: blueprint.lighting_anchor_id,
      action_type: blueprint.action_type,
    },
    projectRoot
  );

  if (coverageResolution) {
    merged = [...new Set([...merged, ...coverageResolution.coverage_tokens])].sort();
  }

  merged = enrichAnchorsWithEmotionActing(merged, blueprint.emotion_id, primaryShot, projectRoot);

  return merged;
}

export function buildMvSceneRenderPayload(
  blueprint: MvSceneBlueprint,
  projectRoot?: string
): MvSceneRenderPayload {
  const coverage = getCoverageById(blueprint.coverage_id, projectRoot);
  const shotPayload = coverage ? buildShotCoverageRenderPayload(coverage) : null;
  const continuityTokens = buildSceneContinuityTokens(blueprint, projectRoot);

  return {
    scene_index: blueprint.scene_index,
    scene_goal: blueprint.scene_goal,
    character_id: blueprint.character_id,
    location_id: blueprint.location_id,
    lighting_anchor_id: blueprint.lighting_anchor_id,
    emotion_id: blueprint.emotion_id,
    coverage_id: blueprint.coverage_id,
    coverage_sequence: coverage?.coverage_sequence ?? [],
    emotion_sequence: [blueprint.emotion_id],
    continuity_tokens: continuityTokens,
    shot_payload: shotPayload,
  };
}

export function buildMvArchetypeRenderPayload(
  archetype: MvArchetypeRecord,
  projectRoot?: string
): MvArchetypeRenderPayload {
  const sceneSequence = archetype.scene_blueprints.map((blueprint) =>
    buildMvSceneRenderPayload(blueprint, projectRoot)
  );

  const coverageSequence = sceneSequence.flatMap((scene) => [...scene.coverage_sequence]);
  const emotionSequence = sceneSequence.flatMap((scene) => [...scene.emotion_sequence]);

  const mvTokens = [
    `mv-archetype:${archetype.mv_archetype_id}`,
    `mv-theme:${archetype.theme}`,
    `mv-duration:${archetype.recommended_duration}`,
    `mv-scene-count:${archetype.scene_count_range}`,
    `mv-output:instrumental_image_sequence`,
    `mv-video-compatible:true`,
    `mv-lyrics:false`,
    `mv-dialogue:false`,
    ...sceneSequence.flatMap((scene) => scene.continuity_tokens),
  ];

  return {
    mv_archetype_id: archetype.mv_archetype_id,
    theme: archetype.theme,
    recommended_duration: archetype.recommended_duration,
    scene_count_range: archetype.scene_count_range,
    scene_sequence: sceneSequence,
    coverage_sequence: coverageSequence,
    emotion_sequence: emotionSequence,
    mv_tokens: [...new Set(mvTokens)].sort(),
    output_target: {
      format: 'instrumental_mv_image_sequence',
      duration_minutes: '1-3',
      video_compatible: true,
      lyrics: false,
      dialogue: false,
    },
    integrated_system_refs: VALIDATED_SYSTEM_REFS,
  };
}

export function buildMvArchetypeMapEntry(
  archetype: MvArchetypeRecord,
  projectRoot?: string
): MvArchetypeMapEntry {
  const render_payload = buildMvArchetypeRenderPayload(archetype, projectRoot);
  return {
    mv_archetype_id: archetype.mv_archetype_id,
    scene_sequence: render_payload.scene_sequence,
    coverage_sequence: render_payload.coverage_sequence,
    emotion_sequence: render_payload.emotion_sequence,
    render_payload,
  };
}

export function resolveInstrumentalMvByArchetypeId(
  mvArchetypeId: string,
  projectRoot?: string
): MvArchetypeRenderPayload | null {
  const adapter = loadInstrumentalMvAdapter(projectRoot);
  const entry = adapter.archetype_to_sequence_map.find((row) => row.mv_archetype_id === mvArchetypeId);
  if (entry) return entry.render_payload;

  const archetype = getMvArchetypeById(mvArchetypeId, projectRoot);
  if (!archetype) return null;
  return buildMvArchetypeRenderPayload(archetype, projectRoot);
}

export function buildInstrumentalMvAdapterFromLibrary(
  library: InstrumentalMvLibrary,
  index: InstrumentalMvIndex
): Record<string, unknown> {
  const archetypeToSequenceMap = library.archetypes.map((archetype) =>
    buildMvArchetypeMapEntry(archetype)
  );

  return {
    adapter_type: 'instrumental_mv_image_adapter',
    adapter_metadata: {
      adapter_name: 'instrumental-mv-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-MV-DATASET-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      archetype_count: library.archetypes.length,
      library_reference: INSTRUMENTAL_MV_LIBRARY_PATH,
      index_reference: INSTRUMENTAL_MV_INDEX_PATH,
    },
    adapter_responsibility_chain: [
      'mv_archetype',
      'scene_sequence',
      'coverage_sequence',
      'emotion_sequence',
      'render_payload',
    ],
    archetype_to_sequence_map: archetypeToSequenceMap,
    integrated_systems: VALIDATED_SYSTEM_REFS,
    runtime_verification_fields: {
      mv_archetype_id: { exported: true, required_for_mv: true },
      scene_sequence: { exported: true, required_for_mv: true },
      coverage_sequence: { exported: true, required_for_mv: true },
      emotion_sequence: { exported: true, required_for_mv: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'MV pipeline must consume character, location, indoor, lighting, shot grammar, and emotion acting layers from render_payload tokens.',
    },
    image_app_contract: {
      supported_mv_archetype_ids: [...INITIAL_MV_ARCHETYPE_IDS],
      output_target: {
        type: 'instrumental_mv_image_sequence',
        duration: '1-3 minutes',
        lyrics: false,
        dialogue: false,
        story_dependency: 'minimal',
        video_pipeline_compatible: true,
      },
      resolution_flow: {
        step_1: 'select mv_archetype_id',
        step_2: 'expand scene_sequence from archetype blueprint',
        step_3: 'attach coverage_sequence per scene via shot grammar',
        step_4: 'attach emotion_sequence per scene via emotion acting DNA',
        step_5: 'emit render_payload for image sequence generation',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_008_validation_target: {
      test_id: 'RKB-008',
      test_name: 'INSTRUMENTAL_MV_PIPELINE_VALIDATION',
      comparison_baselines: ['RKB-004', 'RKB-005', 'RKB-006', 'RKB-007'],
      success_condition:
        'Full MV archetype pipeline produces coherent image sequences with all validated identity layers preserved.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: Object.entries(VALIDATED_SYSTEM_REFS).map(([asset_id, reference_path]) => ({
        asset_id,
        reference_path,
      })),
    },
    index_summary: index.entries,
  };
}
