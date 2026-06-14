import fs from 'node:fs';
import path from 'node:path';
import { buildSceneContinuityTokens } from './instrumentalMvDataset.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { buildShotCoverageRenderPayload, getCoverageById } from './shotGrammar.js';

export const BALLAD_MV_LIBRARY_PATH =
  'datasets/mv/ballad-mv-archetype-library-v1.json' as const;
export const BALLAD_MV_INDEX_PATH = 'datasets/mv/ballad-mv-archetype-index-v1.json' as const;
export const BALLAD_MV_ADAPTER_PATH = 'exports/image_app/adapters/ballad-mv-adapter.json' as const;

export const INITIAL_BALLAD_ARCHETYPE_IDS = [
  'first_meeting',
  'shared_daily_life',
  'growing_affection',
  'quiet_distance',
  'farewell_day',
  'memory_after_parting',
  'reunion_after_time',
  'hopeful_future',
] as const;

export type BalladArchetypeId = (typeof INITIAL_BALLAD_ARCHETYPE_IDS)[number];

export const MEMORY_ANCHOR_CATALOG = [
  'shared_window',
  'shared_bread',
  'harbor_bench',
  'olive_tree',
  'book_exchange',
  'letter_fragment',
] as const;

export const BALLAD_VALIDATED_SYSTEM_REFS = {
  character_dna: 'exports/character-continuity-preview.json',
  location_dna: 'exports/location-continuity-preview.json',
  indoor_anchor: 'exports/image_app/adapters/indoor-location-anchor-adapter.json',
  lighting_anchor: 'exports/image_app/adapters/lighting-anchor-adapter.json',
  shot_grammar: 'exports/image_app/adapters/shot-grammar-adapter.json',
  emotion_acting: 'exports/image_app/adapters/emotion-acting-adapter.json',
  instrumental_mv: 'exports/image_app/adapters/instrumental-mv-adapter.json',
  relationship_arc: 'datasets/mv/ballad-mv-archetype-library-v1.json',
  memory_anchors: 'datasets/mv/ballad-mv-archetype-library-v1.json',
} as const;

export const REQUIRED_BALLAD_ARCHETYPE_FIELDS = [
  'ballad_archetype_id',
  'relationship_arc',
  'emotion_flow',
  'memory_anchors',
  'location_flow',
  'lighting_flow',
  'coverage_flow',
  'scene_transition_rules',
  'callback_rules',
  'recommended_duration',
] as const;

export type BalladSceneBlueprint = {
  scene_index: number;
  relationship_stage: string;
  emotional_progression: string;
  memory_anchor: string;
  callback_scene: string | null;
  transition_reason: string;
  scene_goal: string;
  character_id: string;
  partner_character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  lighting_dna_id: string;
  coverage_id: string;
  emotion_id: string;
  scene_archetype: string;
  action_type: string;
};

export type BalladArchetypeRecord = {
  ballad_archetype_id: string;
  theme: string;
  relationship_arc: readonly string[];
  emotion_flow: readonly string[];
  memory_anchors: readonly string[];
  location_flow: readonly string[];
  lighting_flow: readonly string[];
  coverage_flow: readonly string[];
  scene_transition_rules: readonly string[];
  callback_rules: readonly string[];
  recommended_duration: string;
  scene_blueprints: readonly BalladSceneBlueprint[];
};

export type BalladMvLibrary = {
  archetypes: readonly BalladArchetypeRecord[];
  global_relationship_progression?: readonly string[];
  memory_anchor_catalog?: readonly string[];
  archetype_count?: number;
};

export type BalladMvIndexEntry = {
  ballad_archetype_id: string;
  theme: string;
  recommended_duration: string;
  relationship_stages: number;
};

export type BalladMvIndex = {
  entries: readonly BalladMvIndexEntry[];
  archetype_count?: number;
  global_progression?: readonly string[];
};

export type BalladSceneRenderPayload = {
  scene_index: number;
  relationship_stage: string;
  emotional_progression: string;
  memory_anchor: string;
  callback_scene: string | null;
  transition_reason: string;
  scene_goal: string;
  character_id: string;
  partner_character_id: string;
  location_id: string;
  lighting_anchor_id: string;
  emotion_id: string;
  coverage_id: string;
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  continuity_tokens: readonly string[];
  shot_payload: ReturnType<typeof buildShotCoverageRenderPayload> | null;
};

export type MemoryCallbackEntry = {
  memory_anchor: string;
  callback_scene: string;
  source_archetype: string;
  source_scene_index: number;
  transition_reason: string;
};

export type BalladArchetypeRenderPayload = {
  ballad_archetype_id: string;
  theme: string;
  recommended_duration: string;
  relationship_arc: readonly string[];
  scene_sequence: readonly BalladSceneRenderPayload[];
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  memory_callbacks: readonly MemoryCallbackEntry[];
  ballad_tokens: readonly string[];
  output_target: {
    format: 'ballad_mv_image_sequence';
    duration_minutes: string;
    video_compatible: boolean;
    lyrics: boolean;
    dialogue: boolean;
    narrative_dependency: 'high';
  };
  integrated_system_refs: typeof BALLAD_VALIDATED_SYSTEM_REFS;
};

export type BalladArchetypeMapEntry = {
  ballad_archetype_id: string;
  relationship_arc: readonly string[];
  scene_sequence: readonly BalladSceneRenderPayload[];
  coverage_sequence: readonly string[];
  emotion_sequence: readonly string[];
  memory_callbacks: readonly MemoryCallbackEntry[];
  render_payload: BalladArchetypeRenderPayload;
};

export type BalladMvAdapter = {
  archetype_to_sequence_map: readonly BalladArchetypeMapEntry[];
};

function readJson<T>(projectRoot: string, relativePath: string): T {
  const absolutePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing ballad MV asset: ${relativePath}`);
  }
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8')) as T;
}

export function loadBalladMvLibrary(projectRoot?: string): BalladMvLibrary {
  return readJson(resolveProjectRoot(projectRoot), BALLAD_MV_LIBRARY_PATH);
}

export function loadBalladMvIndex(projectRoot?: string): BalladMvIndex {
  return readJson(resolveProjectRoot(projectRoot), BALLAD_MV_INDEX_PATH);
}

export function loadBalladMvAdapter(projectRoot?: string): BalladMvAdapter {
  return readJson(resolveProjectRoot(projectRoot), BALLAD_MV_ADAPTER_PATH);
}

export function getBalladArchetypeById(
  archetypeId: string,
  projectRoot?: string
): BalladArchetypeRecord | null {
  const library = loadBalladMvLibrary(projectRoot);
  return library.archetypes.find((row) => row.ballad_archetype_id === archetypeId) ?? null;
}

export function parseCallbackScene(
  callbackScene: string | null
): { source_archetype: string; source_scene_index: number } | null {
  if (!callbackScene) return null;
  const match = /^([^:]+):scene_(\d+)$/.exec(callbackScene);
  if (!match) return null;
  return {
    source_archetype: match[1],
    source_scene_index: Number.parseInt(match[2], 10),
  };
}

export function buildMemoryCallbacks(
  archetype: BalladArchetypeRecord
): MemoryCallbackEntry[] {
  const callbacks: MemoryCallbackEntry[] = [];
  for (const blueprint of archetype.scene_blueprints) {
    if (!blueprint.callback_scene) continue;
    const parsed = parseCallbackScene(blueprint.callback_scene);
    if (!parsed) continue;
    callbacks.push({
      memory_anchor: blueprint.memory_anchor,
      callback_scene: blueprint.callback_scene,
      source_archetype: parsed.source_archetype,
      source_scene_index: parsed.source_scene_index,
      transition_reason: blueprint.transition_reason,
    });
  }
  return callbacks;
}

export function buildBalladSceneContinuityTokens(
  archetypeId: string,
  blueprint: BalladSceneBlueprint,
  projectRoot?: string
): string[] {
  const instrumentalBlueprint = {
    scene_index: blueprint.scene_index,
    scene_goal: blueprint.scene_goal,
    character_id: blueprint.character_id,
    location_id: blueprint.location_id,
    lighting_anchor_id: blueprint.lighting_anchor_id,
    lighting_dna_id: blueprint.lighting_dna_id,
    coverage_id: blueprint.coverage_id,
    emotion_id: blueprint.emotion_id,
    scene_archetype: blueprint.scene_archetype,
    action_type: blueprint.action_type,
  };

  const coverage = getCoverageById(blueprint.coverage_id, projectRoot);
  const primaryShot = coverage?.coverage_sequence[0] ?? 'medium';

  let merged = buildSceneContinuityTokens(instrumentalBlueprint, projectRoot);

  const balladTokens = [
    `ballad-archetype:${archetypeId}`,
    `relationship-stage:${blueprint.relationship_stage}`,
    `emotional-progression:${blueprint.emotional_progression}`,
    `memory-anchor:${blueprint.memory_anchor}`,
    `transition-reason:${blueprint.transition_reason}`,
    `partner-character:${blueprint.partner_character_id}`,
    `story-continuity:ballad_narrative`,
  ];

  if (blueprint.callback_scene) {
    balladTokens.push(`callback-scene:${blueprint.callback_scene}`);
    balladTokens.push(`memory-callback:${blueprint.memory_anchor}`);
  }

  return [...new Set([...merged, ...balladTokens])].sort();
}

export function buildBalladSceneRenderPayload(
  archetypeId: string,
  blueprint: BalladSceneBlueprint,
  projectRoot?: string
): BalladSceneRenderPayload {
  const coverage = getCoverageById(blueprint.coverage_id, projectRoot);
  const shotPayload = coverage ? buildShotCoverageRenderPayload(coverage) : null;
  const continuityTokens = buildBalladSceneContinuityTokens(archetypeId, blueprint, projectRoot);

  return {
    scene_index: blueprint.scene_index,
    relationship_stage: blueprint.relationship_stage,
    emotional_progression: blueprint.emotional_progression,
    memory_anchor: blueprint.memory_anchor,
    callback_scene: blueprint.callback_scene,
    transition_reason: blueprint.transition_reason,
    scene_goal: blueprint.scene_goal,
    character_id: blueprint.character_id,
    partner_character_id: blueprint.partner_character_id,
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

export function buildBalladArchetypeRenderPayload(
  archetype: BalladArchetypeRecord,
  projectRoot?: string
): BalladArchetypeRenderPayload {
  const sceneSequence = archetype.scene_blueprints.map((blueprint) =>
    buildBalladSceneRenderPayload(archetype.ballad_archetype_id, blueprint, projectRoot)
  );

  const coverageSequence = sceneSequence.flatMap((scene) => [...scene.coverage_sequence]);
  const emotionSequence = sceneSequence.flatMap((scene) => [...scene.emotion_sequence]);
  const memoryCallbacks = buildMemoryCallbacks(archetype);

  const balladTokens = [
    `ballad-archetype:${archetype.ballad_archetype_id}`,
    `ballad-theme:${archetype.theme}`,
    `ballad-duration:${archetype.recommended_duration}`,
    ...archetype.relationship_arc.map((stage) => `relationship-arc:${stage}`),
    ...archetype.memory_anchors.map((anchor) => `memory-anchor-catalog:${anchor}`),
    `mv-output:ballad_image_sequence`,
    `mv-video-compatible:true`,
    `mv-lyrics:true`,
    `mv-dialogue:false`,
    `narrative-dependency:high`,
    ...sceneSequence.flatMap((scene) => scene.continuity_tokens),
    ...memoryCallbacks.map((cb) => `memory-callback:${cb.memory_anchor}@${cb.callback_scene}`),
  ];

  return {
    ballad_archetype_id: archetype.ballad_archetype_id,
    theme: archetype.theme,
    recommended_duration: archetype.recommended_duration,
    relationship_arc: [...archetype.relationship_arc],
    scene_sequence: sceneSequence,
    coverage_sequence: coverageSequence,
    emotion_sequence: emotionSequence,
    memory_callbacks: memoryCallbacks,
    ballad_tokens: [...new Set(balladTokens)].sort(),
    output_target: {
      format: 'ballad_mv_image_sequence',
      duration_minutes: '2-4',
      video_compatible: true,
      lyrics: true,
      dialogue: false,
      narrative_dependency: 'high',
    },
    integrated_system_refs: BALLAD_VALIDATED_SYSTEM_REFS,
  };
}

export function buildBalladArchetypeMapEntry(
  archetype: BalladArchetypeRecord,
  projectRoot?: string
): BalladArchetypeMapEntry {
  const render_payload = buildBalladArchetypeRenderPayload(archetype, projectRoot);
  return {
    ballad_archetype_id: archetype.ballad_archetype_id,
    relationship_arc: render_payload.relationship_arc,
    scene_sequence: render_payload.scene_sequence,
    coverage_sequence: render_payload.coverage_sequence,
    emotion_sequence: render_payload.emotion_sequence,
    memory_callbacks: render_payload.memory_callbacks,
    render_payload,
  };
}

export function resolveBalladMvByArchetypeId(
  balladArchetypeId: string,
  projectRoot?: string
): BalladArchetypeRenderPayload | null {
  const adapter = loadBalladMvAdapter(projectRoot);
  const entry = adapter.archetype_to_sequence_map.find(
    (row) => row.ballad_archetype_id === balladArchetypeId
  );
  if (entry) return entry.render_payload;

  const archetype = getBalladArchetypeById(balladArchetypeId, projectRoot);
  if (!archetype) return null;
  return buildBalladArchetypeRenderPayload(archetype, projectRoot);
}

export function buildBalladMvAdapterFromLibrary(
  library: BalladMvLibrary,
  index: BalladMvIndex
): Record<string, unknown> {
  const archetypeToSequenceMap = library.archetypes.map((archetype) =>
    buildBalladArchetypeMapEntry(archetype)
  );

  return {
    adapter_type: 'ballad_mv_image_adapter',
    adapter_metadata: {
      adapter_name: 'ballad-mv-adapter',
      adapter_version: 'v1',
      phase: 'PHASE-BALLAD-MV-DATASET-001',
      generated_at: new Date().toISOString(),
      target_app: 'image_app',
      world_identity: 'GONEGI_MEDITERRANEAN',
      archetype_count: library.archetypes.length,
      library_reference: BALLAD_MV_LIBRARY_PATH,
      index_reference: BALLAD_MV_INDEX_PATH,
      instrumental_mv_reference: 'exports/image_app/adapters/instrumental-mv-adapter.json',
    },
    adapter_responsibility_chain: [
      'ballad_archetype',
      'relationship_arc',
      'scene_sequence',
      'emotion_sequence',
      'memory_callbacks',
      'render_payload',
    ],
    global_relationship_progression: library.global_relationship_progression ?? [
      ...INITIAL_BALLAD_ARCHETYPE_IDS,
    ],
    memory_anchor_catalog: library.memory_anchor_catalog ?? [...MEMORY_ANCHOR_CATALOG],
    archetype_to_sequence_map: archetypeToSequenceMap,
    integrated_systems: BALLAD_VALIDATED_SYSTEM_REFS,
    runtime_verification_fields: {
      ballad_archetype_id: { exported: true, required_for_ballad: true },
      relationship_arc: { exported: true, required_for_ballad: true },
      memory_callbacks: { exported: true, required_for_ballad: true },
      render_payload: { exported: true, consumed_by_image_app: true },
      secondary_validation:
        'Ballad MV must export relationship arc, memory callbacks, and full validated-system token stack per scene.',
    },
    image_app_contract: {
      supported_ballad_archetype_ids: [...INITIAL_BALLAD_ARCHETYPE_IDS],
      output_target: {
        type: 'ballad_mv_image_sequence',
        duration: '2-4 minutes',
        lyrics: true,
        dialogue: false,
        narrative_dependency: 'high',
        video_pipeline_compatible: true,
      },
      resolution_flow: {
        step_1: 'select ballad_archetype_id',
        step_2: 'expand relationship_arc stages',
        step_3: 'build scene_sequence with transition_reason per scene',
        step_4: 'attach emotion_sequence and coverage_sequence',
        step_5: 'wire memory_callbacks from callback_scene references',
        step_6: 'emit render_payload for ballad image sequence',
      },
      field_separation_preserved: true,
      generates_scenarios: false,
      generates_prompts: false,
    },
    rkb_009_validation_target: {
      test_id: 'RKB-009',
      test_name: 'BALLAD_MV_PIPELINE_VALIDATION',
      comparison_baselines: ['RKB-008', 'instrumental_mv'],
      success_condition:
        'Ballad MV pipeline preserves relationship progression, memory callbacks, and story continuity across scenes.',
    },
    compatibility_declaration: {
      merge_policy: 'reference_only',
      references: Object.entries(BALLAD_VALIDATED_SYSTEM_REFS).map(([asset_id, reference_path]) => ({
        asset_id,
        reference_path,
      })),
    },
    index_summary: index.entries,
  };
}
