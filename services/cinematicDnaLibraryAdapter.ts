import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_LIBRARY_DATASET_NAME,
  CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
  IMAGE_APP_LATEST_DATASET_PATH,
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  type ExportValidationResult,
} from './exportGovernance.js';
import type { ImageAppBrainIngestionPackage } from './imageAppBrainIngestionBuilder.js';
import type { LocationPatternPriority } from './brainDatasetV3HarborCalibration.js';

export const CINEMATIC_DNA_LIBRARY_VERSION = '107A' as const;
export const CINEMATIC_DNA_LIBRARY_TYPE = 'cinematic_dna_library' as const;
export const CINEMATIC_DNA_LIBRARY_SOURCE = 'brain-dataset-v3-harbor-calibrated' as const;
export const CINEMATIC_DNA_LIBRARY_REPORT_NAME = 'cinematic-dna-library-import-report.json' as const;

export const DIRECTOR_FAMILY = 'GONEGI_MEDITERRANEAN' as const;
export const WORLD_TYPE_LABEL = 'early-1900s mediterranean harbor town' as const;
export const DEFAULT_CONFIDENCE_SCORE = 0.95 as const;

export type CinematicDnaSceneIndexing = {
  scene_id: string;
  source_material: string;
  shot_purpose: string;
  director_family: typeof DIRECTOR_FAMILY;
};

export type CinematicDnaCoreFeatures = {
  composition: Record<string, number | string>;
  lighting: Record<string, number | string>;
  camera_and_space: Record<string, number | string>;
  emotion: Record<string, number | string>;
  world_identity: typeof DIRECTOR_FAMILY;
  world_type: typeof WORLD_TYPE_LABEL;
  harbor_priority_score?: number;
  grammar_fields?: Record<string, unknown>;
};

export type CinematicDnaPromptBridge = {
  sdxl: '';
  midjourney: '';
};

export type CinematicDnaItem = {
  scene_indexing: CinematicDnaSceneIndexing;
  core_features: CinematicDnaCoreFeatures;
  visual_description: string;
  category: string;
  confidence_score: number;
  prompt_bridge: CinematicDnaPromptBridge;
};

export type CinematicDnaCollections = {
  camera_grammar: readonly CinematicDnaItem[];
  acting_grammar: readonly CinematicDnaItem[];
  daily_life_grammar: readonly CinematicDnaItem[];
  location_grammar: readonly CinematicDnaItem[];
  object_interaction_grammar: readonly CinematicDnaItem[];
  extra_actor_grammar: readonly CinematicDnaItem[];
  animal_grammar: readonly CinematicDnaItem[];
};

export type CinematicDnaLibraryMetadata = {
  version: typeof CINEMATIC_DNA_LIBRARY_VERSION;
  dataset_type: typeof CINEMATIC_DNA_LIBRARY_TYPE;
  world_identity: typeof DIRECTOR_FAMILY;
  created_at: string;
  source_dataset: typeof CINEMATIC_DNA_LIBRARY_SOURCE;
  total_items: number;
  world_balance: ImageAppBrainIngestionPackage['world_balance'];
  world_constraints: ImageAppBrainIngestionPackage['world_constraints'];
};

export type CinematicDnaLibraryImport = {
  metadata: CinematicDnaLibraryMetadata;
  collections: CinematicDnaCollections;
};

const DISTANCE_SCORE: Record<string, number> = {
  'extreme-close': 0.95,
  close: 0.82,
  'mid-close': 0.72,
  mid: 0.58,
  'mid-wide': 0.48,
  wide: 0.38,
  'extreme-wide': 0.22,
};

const HEIGHT_SCORE: Record<string, number> = {
  'ground-level': 0.15,
  'table-level': 0.25,
  'waist-level': 0.4,
  'shoulder-level': 0.55,
  'eye-level': 0.65,
  high: 0.82,
  aerial: 0.95,
  low: 0.3,
};

function loadBrainIngestionPackage(projectRoot: string): ImageAppBrainIngestionPackage {
  const packagePath = path.join(projectRoot, IMAGE_APP_LATEST_DATASET_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing brain ingestion package at ${IMAGE_APP_LATEST_DATASET_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as ImageAppBrainIngestionPackage;
}

function sourceMaterial(sourceRefs: readonly string[] | undefined): string {
  if (!sourceRefs || sourceRefs.length === 0) {
    return 'BRAIN_DATASET';
  }
  return sourceRefs.join('|');
}

function scoreFromMap(map: Record<string, number>, key: string | undefined, fallback = 0.5): number {
  if (!key) {
    return fallback;
  }
  return map[key] ?? fallback;
}

function buildBaseCoreFeatures(
  grammarFields: Record<string, unknown>,
  extras?: Partial<CinematicDnaCoreFeatures>
): CinematicDnaCoreFeatures {
  return {
    composition: { balance_score: 0.65, depth_layers: 0.55 },
    lighting: { ambient_level: 0.6, contrast_level: 0.45 },
    camera_and_space: { spatial_openness: 0.5, subject_presence: 0.55 },
    emotion: { expressivity: 0.5, narrative_tension: 0.4 },
    world_identity: DIRECTOR_FAMILY,
    world_type: WORLD_TYPE_LABEL,
    grammar_fields: grammarFields,
    ...extras,
  };
}

function buildPromptBridge(): CinematicDnaPromptBridge {
  return Object.freeze({ sdxl: '', midjourney: '' });
}

function adaptCameraPattern(
  pattern: ImageAppBrainIngestionPackage['camera_grammar_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.framing_type ?? 'camera-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: {
          framing_weight: 0.7,
          subject_position_score: 0.6,
        },
        lighting: {
          ambient_level: 0.55,
          lens_softness: pattern.lens_feeling?.includes('shallow') ? 0.75 : 0.45,
        },
        camera_and_space: {
          distance_score: scoreFromMap(DISTANCE_SCORE, pattern.camera_distance),
          height_score: scoreFromMap(HEIGHT_SCORE, pattern.camera_height),
          angle_presence: 0.58,
        },
        emotion: {
          expressivity: 0.45,
          observational_tone: 0.55,
        },
      })
    ),
    visual_description: [
      pattern.framing_type,
      pattern.camera_distance,
      pattern.camera_height,
      pattern.camera_angle,
      pattern.lens_feeling,
      pattern.subject_position,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'camera_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptActingPattern(
  pattern: ImageAppBrainIngestionPackage['acting_grammar_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.posture ?? 'acting-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: { body_frame_score: 0.62, gesture_balance: 0.58 },
        lighting: { ambient_level: 0.5, facial_readability: 0.62 },
        camera_and_space: { proximity_feel: 0.55, posture_anchor: 0.6 },
        emotion: {
          expressivity: pattern.gaze_direction?.includes('down') ? 0.42 : 0.68,
          gesture_energy: pattern.hand_activity?.includes('at-side') ? 0.35 : 0.62,
        },
      })
    ),
    visual_description: [
      pattern.posture,
      pattern.gaze_direction,
      pattern.head_direction,
      pattern.hand_activity,
      pattern.body_weight_distribution,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'acting_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptDailyLifePattern(
  pattern: ImageAppBrainIngestionPackage['daily_life_grammar_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.activity ?? 'daily-life-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: { activity_focus: 0.64, environment_touch: 0.58 },
        lighting: { ambient_level: 0.58, domestic_warmth: 0.52 },
        camera_and_space: { routine_spatiality: 0.56, touchpoint_depth: 0.5 },
        emotion: { expressivity: 0.48, daily_rhythm: 0.72 },
      })
    ),
    visual_description: [pattern.activity, pattern.object_interaction, pattern.environmental_touchpoint]
      .filter(Boolean)
      .join(' · '),
    category: 'daily_life_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptLocationPattern(
  pattern: ImageAppBrainIngestionPackage['location_grammar_library'][number],
  harborPriorityById: ReadonlyMap<string, LocationPatternPriority>
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  const harborPriority = harborPriorityById.get(pattern.pattern_id);
  const extras: Partial<CinematicDnaCoreFeatures> = {
    composition: { architectural_weight: 0.66, depth_read: 0.62 },
    lighting: { ambient_level: 0.57, locale_mood: 0.54 },
    camera_and_space: {
      navigation_flow: 0.58,
      depth_cue_presence: pattern.depth_cue ? 0.64 : 0.45,
    },
    emotion: { expressivity: 0.4, place_identity: 0.72 },
  };
  if (harborPriority) {
    extras.harbor_priority_score = harborPriority.priority_score;
  }

  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.space_type ?? 'location-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(buildBaseCoreFeatures(grammarFields, extras)),
    visual_description: [
      pattern.space_type,
      pattern.architectural_feature,
      pattern.depth_cue,
      pattern.navigation_pattern,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'location_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptObjectInteractionPattern(
  pattern: ImageAppBrainIngestionPackage['object_interaction_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.interaction_type ?? 'object-interaction-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: { object_focus: 0.7, hand_object_ratio: 0.62 },
        lighting: { ambient_level: 0.54, surface_read: 0.58 },
        camera_and_space: { interaction_proximity: 0.6, grip_presence: 0.55 },
        emotion: { expressivity: 0.46, task_focus: 0.68 },
      })
    ),
    visual_description: [
      pattern.interaction_type,
      pattern.object_category,
      pattern.grip_style,
      pattern.interaction_phase,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'object_interaction_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptExtraActorPattern(
  pattern: ImageAppBrainIngestionPackage['extra_actor_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.actor_role ?? 'extra-actor-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: { crowd_layering: 0.52, role_visibility: 0.58 },
        lighting: { ambient_level: 0.5, background_separation: 0.48 },
        camera_and_space: { spatial_relation_score: 0.56, background_depth: 0.5 },
        emotion: { expressivity: 0.44, social_presence: 0.6 },
      })
    ),
    visual_description: [
      pattern.actor_role,
      pattern.spatial_relation,
      pattern.activity_involvement,
      pattern.visibility_weight,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'extra_actor_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function adaptAnimalPattern(
  pattern: ImageAppBrainIngestionPackage['animal_library'][number]
): CinematicDnaItem {
  const grammarFields = { ...pattern };
  return Object.freeze({
    scene_indexing: Object.freeze({
      scene_id: pattern.pattern_id,
      source_material: sourceMaterial(pattern.source_refs),
      shot_purpose: pattern.animal_type ?? 'animal-grammar',
      director_family: DIRECTOR_FAMILY,
    }),
    core_features: Object.freeze(
      buildBaseCoreFeatures(grammarFields, {
        composition: { wildlife_layer: 0.48, framing_weight: 0.55 },
        lighting: { ambient_level: 0.52, naturalism: 0.62 },
        camera_and_space: { subject_relation_score: 0.5, movement_space: 0.54 },
        emotion: { expressivity: 0.35, ambient_life: 0.7 },
      })
    ),
    visual_description: [
      pattern.animal_type,
      pattern.movement_state,
      pattern.subject_relation,
      pattern.framing_weight,
    ]
      .filter(Boolean)
      .join(' · '),
    category: 'animal_grammar',
    confidence_score: DEFAULT_CONFIDENCE_SCORE,
    prompt_bridge: buildPromptBridge(),
  });
}

function buildHarborPriorityMap(
  priorities: readonly LocationPatternPriority[]
): Map<string, LocationPatternPriority> {
  return new Map(priorities.map((entry) => [entry.pattern_id, entry]));
}

export function buildCinematicDnaLibraryImport(
  projectRoot: string
): CinematicDnaLibraryImport {
  const source = loadBrainIngestionPackage(projectRoot);
  const harborPriorityById = buildHarborPriorityMap(source.location_pattern_priorities);

  const collections = Object.freeze({
    camera_grammar: Object.freeze(source.camera_grammar_library.map(adaptCameraPattern)),
    acting_grammar: Object.freeze(source.acting_grammar_library.map(adaptActingPattern)),
    daily_life_grammar: Object.freeze(
      source.daily_life_grammar_library.map(adaptDailyLifePattern)
    ),
    location_grammar: Object.freeze(
      source.location_grammar_library.map((pattern) =>
        adaptLocationPattern(pattern, harborPriorityById)
      )
    ),
    object_interaction_grammar: Object.freeze(
      source.object_interaction_library.map(adaptObjectInteractionPattern)
    ),
    extra_actor_grammar: Object.freeze(source.extra_actor_library.map(adaptExtraActorPattern)),
    animal_grammar: Object.freeze(source.animal_library.map(adaptAnimalPattern)),
  });

  const total_items =
    collections.camera_grammar.length +
    collections.acting_grammar.length +
    collections.daily_life_grammar.length +
    collections.location_grammar.length +
    collections.object_interaction_grammar.length +
    collections.extra_actor_grammar.length +
    collections.animal_grammar.length;

  return Object.freeze({
    metadata: Object.freeze({
      version: CINEMATIC_DNA_LIBRARY_VERSION,
      dataset_type: CINEMATIC_DNA_LIBRARY_TYPE,
      world_identity: DIRECTOR_FAMILY,
      created_at: new Date().toISOString(),
      source_dataset: CINEMATIC_DNA_LIBRARY_SOURCE,
      total_items,
      world_balance: source.world_balance,
      world_constraints: source.world_constraints,
    }),
    collections,
  });
}

export function countCinematicDnaCollectionItems(
  library: CinematicDnaLibraryImport
): Record<keyof CinematicDnaCollections, number> {
  return {
    camera_grammar: library.collections.camera_grammar.length,
    acting_grammar: library.collections.acting_grammar.length,
    daily_life_grammar: library.collections.daily_life_grammar.length,
    location_grammar: library.collections.location_grammar.length,
    object_interaction_grammar: library.collections.object_interaction_grammar.length,
    extra_actor_grammar: library.collections.extra_actor_grammar.length,
    animal_grammar: library.collections.animal_grammar.length,
  };
}

export function writeCinematicDnaLibraryImport(projectRoot: string): {
  library: CinematicDnaLibraryImport;
  validation: ExportValidationResult;
} {
  const library = buildCinematicDnaLibraryImport(projectRoot);
  const validation = publishGovernedExport({
    projectRoot,
    relativePath: CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
    datasetName: CINEMATIC_DNA_LIBRARY_DATASET_NAME,
    datasetVersion: CINEMATIC_DNA_LIBRARY_VERSION,
    datasetType: CINEMATIC_DNA_LIBRARY_TYPE,
    content: library,
  });
  return { library, validation };
}
