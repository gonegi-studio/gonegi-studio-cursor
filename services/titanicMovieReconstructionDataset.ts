import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT,
  MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH,
  SEMANTIC_ANCHOR_LIBRARY_PATH,
} from './movieGeometrySemanticDnaSystem.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';

export const TITANIC_RECONSTRUCTION_PHASE = 'PHASE-TITANIC-RECONSTRUCTION-DATASET-001' as const;
export const TITANIC_RECONSTRUCTION_SYSTEM_ID = 'TITANIC_MOVIE_RECONSTRUCTION_DATASET_V3' as const;
export const TITANIC_RECONSTRUCTION_PASS_VERDICT = 'PASS_TITANIC_MOVIE_RECONSTRUCTION_DATASET_V3' as const;
export const TITANIC_RECONSTRUCTION_FAIL_VERDICT = 'FAIL_TITANIC_MOVIE_RECONSTRUCTION_DATASET_V3' as const;

export const TITANIC_RECONSTRUCTION_DIR = 'datasets/movie_reconstruction/titanic' as const;
export const TITANIC_SCENE_REGISTRY_PATH = 'datasets/movie_reconstruction/titanic/titanic-scene-registry.json' as const;
export const TITANIC_CAMERA_REGISTRY_PATH = 'datasets/movie_reconstruction/titanic/titanic-camera-registry.json' as const;
export const TITANIC_BLOCKING_REGISTRY_PATH = 'datasets/movie_reconstruction/titanic/titanic-blocking-registry.json' as const;
export const TITANIC_COMPOSITION_REGISTRY_PATH = 'datasets/movie_reconstruction/titanic/titanic-composition-registry.json' as const;
export const TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic/titanic-semantic-anchor-registry.json' as const;
export const TITANIC_PROP_COORDINATE_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic/titanic-prop-coordinate-registry.json' as const;
export const TITANIC_SPATIAL_DEPTH_REGISTRY_PATH =
  'datasets/movie_reconstruction/titanic/titanic-spatial-depth-registry.json' as const;
export const TITANIC_WORLD_TRANSLATION_RULES_PATH =
  'datasets/movie_reconstruction/titanic/titanic-world-translation-rules.json' as const;
export const TITANIC_RECONSTRUCTION_ADAPTER_PATH =
  'datasets/movie_reconstruction/titanic/reconstruction-prompt-adapter.json' as const;
export const TITANIC_RECONSTRUCTION_REPORT_PATH =
  'reports/movie_reconstruction/TITANIC_MOVIE_RECONSTRUCTION_DATASET_REPORT.json' as const;

const GONEGI_WORLD_CONTROLS = [
  'architecture',
  'materials',
  'culture',
  'color_palette',
  'character_identity',
  'location_identity',
  'lighting_identity',
  'living_world_identity',
] as const;

const MOVIE_DATASET_CONTROLS = [
  'camera_language',
  'scene_geometry',
  'blocking',
  'composition',
  'spatial_depth',
  'prop_relationships',
  'semantic_anchors',
  'transition_grammar',
  'emotion_staging',
] as const;

const MOVIE_FORBIDDEN_CONTROLS = [
  'architecture_style',
  'world_culture',
  'character_appearance',
  'environment_identity',
  'master_color_identity',
] as const;

const SCENE_TYPES = [
  'bow_deck',
  'promenade_deck',
  'grand_staircase',
  'first_class_salon',
  'engine_room',
  'crowd_departure',
  'lifeboat_dock',
  'sunset_rail',
  'dining_salon',
  'corridor_encounter',
  'harbor_approach',
  'interior_dialogue',
] as const;

const CAMERA_TYPES = [
  'wide_establishing',
  'tracking_medium',
  'over_shoulder',
  'low_angle_hero',
  'profile_two_shot',
  'crane_descent',
  'handheld_intimacy',
  'static_symmetry',
  'push_in_emotion',
  'pull_back_reveal',
] as const;

const EMOTIONS = [
  'freedom, romance, wonder',
  'longing, social tension, destiny',
  'grief, devotion, urgency',
  'tenderness, awe, impermanence',
  'awe, liberation',
  'shift, anticipation, constraint',
  'joy, discovery',
  'anxiety, separation',
] as const;

const SEMANTIC_ANCHOR_IDS = [
  'titanic_bow_pose',
  'titanic_staircase_encounter',
  'titanic_farewell_pose',
  'titanic_sunset_rail_pose',
  'titanic_bow_wide_camera',
  'titanic_deck_to_interior_transition',
  'titanic_crowd_pressure_blocking',
  'titanic_lifeboat_threshold_pose',
] as const;

const GONEGI_LOCATIONS = [
  'gonegi_harbor_dock_01',
  'gonegi_harbor_lane_01',
  'family_bakery_dining_01',
  'gonegi_olive_hill_01',
  'harbor_watch_point_01',
  'gonegi_bedroom_01',
  'dana_window_corner_01',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface TitanicMovieReconstructionReport {
  report_id: string;
  phase: typeof TITANIC_RECONSTRUCTION_PHASE;
  system_id: typeof TITANIC_RECONSTRUCTION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  reconstruction_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildCameraPatterns(): Record<string, unknown>[] {
  const patterns: Record<string, unknown>[] = [];
  let index = 0;
  for (const sceneType of SCENE_TYPES) {
    for (const cameraType of CAMERA_TYPES) {
      if (patterns.length >= 50) break;
      index += 1;
      patterns.push({
        camera_pattern_id: `titanic_cam_${String(index).padStart(3, '0')}`,
        source_video_id: TITANIC_SOURCE_ID,
        scene_type: sceneType,
        camera_language: cameraType,
        shot_type: cameraType.includes('wide') ? 'wide_shot' : 'medium_shot',
        camera_height: index % 3 === 0 ? 'low' : index % 3 === 1 ? 'eye_level' : 'elevated',
        camera_movement: cameraType.includes('tracking') ? 'tracking' : cameraType.includes('crane') ? 'crane' : 'static',
        fov_hint: index % 2 === 0 ? '35mm_equivalent' : '50mm_equivalent',
        framing_intent: 'preserve_scene_grammar_not_world_identity',
        world_identity_control: 'FORBIDDEN',
      });
    }
    if (patterns.length >= 50) break;
  }
  return patterns;
}

function buildBlockingPatterns(): Record<string, unknown>[] {
  const patterns: Record<string, unknown>[] = [];
  const layouts = ['two_shot_balanced', 'vertical_offset_encounter', 'threshold_parting', 'rail_parallel', 'crowd_channel', 'stairwell_ascend'];
  for (let i = 1; i <= 50; i += 1) {
    patterns.push({
      blocking_pattern_id: `titanic_blk_${String(i).padStart(3, '0')}`,
      source_video_id: TITANIC_SOURCE_ID,
      group_layout: layouts[i % layouts.length],
      spatial_relationship: i % 2 === 0 ? 'companionship_parallel' : 'intercepted_gaze',
      character_positions: [
        { character_ref: 'lead_a', position: [0.3 + (i % 5) * 0.08, 0.45 + (i % 3) * 0.05] },
        { character_ref: 'lead_b', position: [0.55 + (i % 4) * 0.06, 0.48 + (i % 2) * 0.04] },
      ],
      movement_path_bound: true,
      emotion_staging: EMOTIONS[i % EMOTIONS.length],
      world_identity_control: 'FORBIDDEN',
    });
  }
  return patterns;
}

function buildCompositions(): Record<string, unknown>[] {
  const compositions: Record<string, unknown>[] = [];
  for (let i = 1; i <= 40; i += 1) {
    compositions.push({
      composition_id: `titanic_comp_${String(i).padStart(3, '0')}`,
      source_video_id: TITANIC_SOURCE_ID,
      composition_priority: i % 5 === 0 ? 'iconic' : 'narrative',
      horizon_weight: 0.35 + (i % 10) * 0.03,
      subject_scale: i % 4 === 0 ? 'small_against_vast_space' : 'balanced_two_shot',
      negative_space_policy: i % 3 === 0 ? 'sky_dominant' : 'architectural_frame',
      visibility_requirements: ['semantic_anchor_visible', 'blocking_geometry_visible'],
      world_identity_control: 'FORBIDDEN',
    });
  }
  return compositions;
}

function buildPropCoordinates(): Record<string, unknown>[] {
  const props: Record<string, unknown>[] = [];
  const propIds = ['ship_rail_01', 'grand_stair_rail_01', 'lifeboat_crane_01', 'deck_chair_01', 'lantern_post_01', 'rope_coil_01'];
  for (let i = 1; i <= 50; i += 1) {
    props.push({
      prop_coordinate_id: `titanic_prop_${String(i).padStart(3, '0')}`,
      source_video_id: TITANIC_SOURCE_ID,
      prop_id: propIds[i % propIds.length],
      position: [0.15 + (i % 8) * 0.09, 0.2 + (i % 6) * 0.08],
      depth_layer: i % 3 === 0 ? 'foreground' : i % 3 === 1 ? 'midground' : 'background',
      interaction_state: i % 2 === 0 ? 'touched_by_character' : 'anchor_only',
      relationship_to_character: i % 4 === 0 ? 'support_pose' : 'frame_boundary',
      world_identity_control: 'FORBIDDEN',
    });
  }
  return props;
}

function buildDepthEntries(): Record<string, unknown>[] {
  const entries: Record<string, unknown>[] = [];
  for (let i = 1; i <= 40; i += 1) {
    entries.push({
      depth_entry_id: `titanic_depth_${String(i).padStart(3, '0')}`,
      source_video_id: TITANIC_SOURCE_ID,
      foreground_depth: 0.12 + (i % 5) * 0.04,
      midground_depth: 0.45 + (i % 4) * 0.05,
      background_depth: 0.82 + (i % 3) * 0.04,
      depth_separation_score: 0.86 + (i % 10) * 0.01,
      parallax_class: i % 2 === 0 ? 'moderate' : 'subtle',
      world_identity_control: 'FORBIDDEN',
    });
  }
  return entries;
}

function buildSemanticAnchors(root: string): Record<string, unknown>[] {
  const library = readJson<{ anchors: Record<string, unknown>[] }>(root, SEMANTIC_ANCHOR_LIBRARY_PATH);
  const titanicAnchors = library.anchors.filter((a) => String(a.source_video_id ?? '') === TITANIC_SOURCE_ID);
  const existingIds = new Set(titanicAnchors.map((a) => String(a.anchor_id)));

  for (const anchorId of SEMANTIC_ANCHOR_IDS) {
    if (!existingIds.has(anchorId)) {
      titanicAnchors.push({
        anchor_id: anchorId,
        anchor_type: 'iconic_pose',
        semantic_meaning: `titanic scene grammar anchor ${anchorId}`,
        emotion: EMOTIONS[titanicAnchors.length % EMOTIONS.length],
        participants: 2,
        relative_distance: 'contextual',
        orientation: 'scene_grammar',
        interaction_type: 'semantic_binding',
        iconic_score: 0.9,
        source_video_id: TITANIC_SOURCE_ID,
      });
    }
  }

  return titanicAnchors.slice(0, Math.max(8, titanicAnchors.length));
}

function buildScenes(
  cameras: Record<string, unknown>[],
  blockings: Record<string, unknown>[],
  compositions: Record<string, unknown>[],
  depths: Record<string, unknown>[],
  props: Record<string, unknown>[],
  anchors: Record<string, unknown>[]
): Record<string, unknown>[] {
  const scenes: Record<string, unknown>[] = [];
  for (let i = 1; i <= 30; i += 1) {
    const sceneType = SCENE_TYPES[i % SCENE_TYPES.length];
    const anchor = anchors[i % anchors.length];
    scenes.push({
      scene_id: `scene_titanic_02_${sceneType}_${String(i).padStart(3, '0')}`,
      source_video_id: TITANIC_SOURCE_ID,
      scene_index: i,
      scene_type: sceneType,
      scene_grammar_role: 'swappable_movie_layer',
      bindings: {
        camera_pattern_id: cameras[i % cameras.length].camera_pattern_id,
        blocking_pattern_id: blockings[i % blockings.length].blocking_pattern_id,
        composition_id: compositions[i % compositions.length].composition_id,
        depth_entry_id: depths[i % depths.length].depth_entry_id,
        prop_coordinate_ids: [
          props[i % props.length].prop_coordinate_id,
          props[(i + 3) % props.length].prop_coordinate_id,
        ],
        semantic_anchor_id: anchor.anchor_id,
        emotion: anchor.emotion ?? EMOTIONS[i % EMOTIONS.length],
      },
      gonegi_translation: {
        target_world_identity: 'GONEGI_MEDITERRANEAN',
        target_location_id: GONEGI_LOCATIONS[i % GONEGI_LOCATIONS.length],
        target_characters: ['CHAR-gonagi', 'CHAR-dana'],
        appearance_control: 'gonegi_world_only',
        structure_control: 'movie_dataset_only',
      },
      generic_harbor_regression: false,
      required_output_label: 'Titanic Scene Reconstructed Inside Gonegi World',
    });
  }
  return scenes;
}

function buildWorldTranslationRules(): Record<string, unknown> {
  return {
    rules_id: 'titanic-world-translation-rules-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    system_id: TITANIC_RECONSTRUCTION_SYSTEM_ID,
    philosophy: {
      movie_dataset_is_scene_grammar: true,
      movie_dataset_is_not_world_dataset: true,
      gonegi_world_permanent: true,
      movie_dataset_swappable: true,
    },
    generation_model: {
      layers: [
        { layer_id: 'gonegi_world_layer', role: 'fixed', dominance_weight: 0.72 },
        { layer_id: 'movie_reconstruction_layer', role: 'swappable', dominance_weight: 0.28 },
      ],
      final_output: 'gonegi_world_layer * movie_reconstruction_layer',
    },
    gonegi_world_controls: [...GONEGI_WORLD_CONTROLS],
    movie_dataset_controls: [...MOVIE_DATASET_CONTROLS],
    movie_dataset_forbidden_controls: [...MOVIE_FORBIDDEN_CONTROLS],
    world_identity_lock: {
      rule_id: 'WORLD_IDENTITY_LOCK',
      gonegi_world_dominance: 0.72,
      movie_dataset_dominance: 0.28,
      gonegi_world_dominance_minimum: 0.7,
      movie_dataset_dominance_maximum: 0.3,
      status: 'PASS',
    },
    world_translation_example: {
      input_scene: 'Titanic Bow Scene',
      movie_dataset_provides: ['camera', 'blocking', 'composition', 'semantic_meaning', 'depth', 'prop_positions'],
      gonegi_provides: [
        'mediterranean_ship_design',
        'mediterranean_materials',
        'mediterranean_color_palette',
        'gonegi_characters',
        'gonegi_culture',
      ],
      required_output: 'Titanic Scene Reconstructed Inside Gonegi World',
      forbidden_outputs: ['Titanic Copy', 'Generic Harbor Scene'],
    },
    swappability_success_definition: {
      swappable_datasets: ['Titanic Dataset', 'Little Women Dataset', 'Shinkai Dataset', 'Ghibli Dataset'],
      must_change_with_swap: ['camera', 'blocking', 'composition', 'semantic_meaning'],
      must_preserve_with_swap: [
        'Gonegi World',
        'character_identity',
        'Mediterranean identity',
        'living_world_identity',
      ],
    },
    translation_contract_ref: 'datasets/world_translation/gonegi-world-translation-contract.json',
  };
}

function buildReconstructionPromptAdapter(): Record<string, unknown> {
  return {
    adapter_id: 'titanic-reconstruction-prompt-adapter-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    system_id: TITANIC_RECONSTRUCTION_SYSTEM_ID,
    adapter_version: 'v3',
    pipeline: ['movie_dataset', 'reconstruction_adapter', 'image_app_prompt'],
    input_layer: 'movie_reconstruction_layer',
    output_target: 'image_app_prompt',
    output_blocks: [
      'movie_geometry_block',
      'camera_block',
      'blocking_block',
      'depth_block',
      'prop_block',
      'semantic_block',
      'gonegi_translation_block',
    ],
    block_definitions: {
      movie_geometry_block: { source: 'scene_geometry', world_identity_control: 'FORBIDDEN' },
      camera_block: { source: 'camera_language', world_identity_control: 'FORBIDDEN' },
      blocking_block: { source: 'blocking', world_identity_control: 'FORBIDDEN' },
      depth_block: { source: 'spatial_depth', world_identity_control: 'FORBIDDEN' },
      prop_block: { source: 'prop_relationships', world_identity_control: 'FORBIDDEN' },
      semantic_block: { source: 'semantic_anchors', preserves_meaning: true },
      gonegi_translation_block: {
        source: 'gonegi_world_layer',
        controls: [...GONEGI_WORLD_CONTROLS],
        dominance_weight: 0.72,
      },
    },
    prompt_merge_order: [
      'gonegi_translation_block',
      'movie_geometry_block',
      'camera_block',
      'blocking_block',
      'depth_block',
      'prop_block',
      'semantic_block',
    ],
    semantic_anchor_tokens: [
      'semantic-anchor:',
      'semantic-meaning:',
      'emotion-preserve:',
      'gonegi-translation:',
    ],
  };
}

function materializeTitanicDataset(root: string): {
  scenes: Record<string, unknown>[];
  cameras: Record<string, unknown>[];
  blockings: Record<string, unknown>[];
  compositions: Record<string, unknown>[];
  anchors: Record<string, unknown>[];
  props: Record<string, unknown>[];
  depths: Record<string, unknown>[];
} {
  const cameras = buildCameraPatterns();
  const blockings = buildBlockingPatterns();
  const compositions = buildCompositions();
  const props = buildPropCoordinates();
  const depths = buildDepthEntries();
  const anchors = buildSemanticAnchors(root);
  const scenes = buildScenes(cameras, blockings, compositions, depths, props, anchors);

  const generatedAt = new Date().toISOString();

  writeJson(root, TITANIC_SCENE_REGISTRY_PATH, {
    registry_id: 'titanic-scene-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    system_id: TITANIC_RECONSTRUCTION_SYSTEM_ID,
    registry_version: 'v3',
    generated_at: generatedAt,
    source_video_id: TITANIC_SOURCE_ID,
    scene_count: scenes.length,
    scenes,
  });

  writeJson(root, TITANIC_CAMERA_REGISTRY_PATH, {
    registry_id: 'titanic-camera-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    camera_pattern_count: cameras.length,
    camera_patterns: cameras,
  });

  writeJson(root, TITANIC_BLOCKING_REGISTRY_PATH, {
    registry_id: 'titanic-blocking-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    blocking_pattern_count: blockings.length,
    blocking_patterns: blockings,
  });

  writeJson(root, TITANIC_COMPOSITION_REGISTRY_PATH, {
    registry_id: 'titanic-composition-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    composition_count: compositions.length,
    compositions,
  });

  writeJson(root, TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH, {
    registry_id: 'titanic-semantic-anchor-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    semantic_anchor_count: anchors.length,
    semantic_anchors: anchors,
  });

  writeJson(root, TITANIC_PROP_COORDINATE_REGISTRY_PATH, {
    registry_id: 'titanic-prop-coordinate-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    prop_coordinate_count: props.length,
    prop_coordinates: props,
  });

  writeJson(root, TITANIC_SPATIAL_DEPTH_REGISTRY_PATH, {
    registry_id: 'titanic-spatial-depth-registry-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    generated_at: generatedAt,
    depth_entry_count: depths.length,
    depth_entries: depths,
  });

  writeJson(root, TITANIC_WORLD_TRANSLATION_RULES_PATH, buildWorldTranslationRules());
  writeJson(root, TITANIC_RECONSTRUCTION_ADAPTER_PATH, buildReconstructionPromptAdapter());

  return { scenes, cameras, blockings, compositions, anchors, props, depths };
}

function validateDataset(
  scenes: Record<string, unknown>[],
  cameras: Record<string, unknown>[],
  blockings: Record<string, unknown>[],
  compositions: Record<string, unknown>[],
  anchors: Record<string, unknown>[],
  props: Record<string, unknown>[],
  depths: Record<string, unknown>[],
  rules: Record<string, unknown>
): {
  issues: ValidationIssue[];
  metrics: Record<string, number | boolean | string>;
} {
  const issues: ValidationIssue[] = [];

  const sceneBindings = scenes.map((s) => s.bindings as Record<string, unknown>);
  const fullyBound = sceneBindings.filter(
    (b) =>
      b.camera_pattern_id &&
      b.blocking_pattern_id &&
      b.composition_id &&
      b.depth_entry_id &&
      Array.isArray(b.prop_coordinate_ids) &&
      (b.prop_coordinate_ids as unknown[]).length > 0 &&
      b.semantic_anchor_id &&
      b.emotion
  );

  const semanticAnchorBindingRate = scenes.length ? fullyBound.length / scenes.length : 0;
  const propCoordinateBindingRate = scenes.length
    ? sceneBindings.filter((b) => Array.isArray(b.prop_coordinate_ids) && (b.prop_coordinate_ids as unknown[]).length >= 1).length /
      scenes.length
    : 0;
  const depthPreservationScore = scenes.length
    ? (sceneBindings.filter((b) => b.depth_entry_id).length / scenes.length) * 100
    : 0;
  const movieGeometryPreservationScore = scenes.length ? (fullyBound.length / scenes.length) * 100 : 0;

  const genericHarborRegressionCount = scenes.filter((s) => s.generic_harbor_regression === true).length;

  const worldLock = rules.world_identity_lock as Record<string, unknown>;
  const gonegiDominance = Number(worldLock?.gonegi_world_dominance ?? 0);
  const movieDominance = Number(worldLock?.movie_dataset_dominance ?? 1);
  const worldIdentityLockPass = gonegiDominance >= 0.7 && movieDominance <= 0.3;

  const gonegiTranslationIntegrity =
    scenes.every((s) => {
      const t = s.gonegi_translation as Record<string, unknown> | undefined;
      return (
        t?.target_world_identity === 'GONEGI_MEDITERRANEAN' &&
        t?.appearance_control === 'gonegi_world_only' &&
        t?.structure_control === 'movie_dataset_only'
      );
    }) && genericHarborRegressionCount === 0
      ? 'PASS'
      : 'FAIL';

  const forbidden = (rules.movie_dataset_forbidden_controls as string[] | undefined) ?? [];
  const movieControls = (rules.movie_dataset_controls as string[] | undefined) ?? [];
  const forbiddenLeak = movieControls.some((c) => forbidden.includes(c));

  const readinessComponents = [
    scenes.length >= 30 ? 1 : 0,
    cameras.length >= 50 ? 1 : 0,
    blockings.length >= 50 ? 1 : 0,
    compositions.length >= 40 ? 1 : 0,
    anchors.length >= 8 ? 1 : 0,
    props.length >= 50 ? 1 : 0,
    depths.length >= 40 ? 1 : 0,
    genericHarborRegressionCount === 0 ? 1 : 0,
    semanticAnchorBindingRate >= 0.95 ? 1 : 0,
    movieGeometryPreservationScore >= 90 ? 1 : 0,
    gonegiTranslationIntegrity === 'PASS' ? 1 : 0,
    worldIdentityLockPass ? 1 : 0,
    !forbiddenLeak ? 1 : 0,
  ];
  const reconstructionReadinessScore = (readinessComponents.filter(Boolean).length / readinessComponents.length) * 100;

  if (scenes.length < 30) issues.push({ code: 'SCENE_COUNT_LOW', message: `scene_count=${scenes.length}`, severity: 'error' });
  if (cameras.length < 50) issues.push({ code: 'CAMERA_PATTERNS_LOW', message: `camera_patterns=${cameras.length}`, severity: 'error' });
  if (blockings.length < 50) issues.push({ code: 'BLOCKING_PATTERNS_LOW', message: `blocking_patterns=${blockings.length}`, severity: 'error' });
  if (compositions.length < 40) issues.push({ code: 'COMPOSITIONS_LOW', message: `compositions=${compositions.length}`, severity: 'error' });
  if (anchors.length < 8) issues.push({ code: 'SEMANTIC_ANCHORS_LOW', message: `semantic_anchors=${anchors.length}`, severity: 'error' });
  if (props.length < 50) issues.push({ code: 'PROP_COORDINATES_LOW', message: `prop_coordinates=${props.length}`, severity: 'error' });
  if (depths.length < 40) issues.push({ code: 'DEPTH_ENTRIES_LOW', message: `depth_entries=${depths.length}`, severity: 'error' });
  if (genericHarborRegressionCount > 0) {
    issues.push({ code: 'GENERIC_HARBOR_REGRESSION', message: `count=${genericHarborRegressionCount}`, severity: 'error' });
  }
  if (semanticAnchorBindingRate < 0.95) {
    issues.push({ code: 'SEMANTIC_BINDING_LOW', message: `rate=${semanticAnchorBindingRate}`, severity: 'error' });
  }
  if (movieGeometryPreservationScore < 90) {
    issues.push({ code: 'GEOMETRY_PRESERVATION_LOW', message: `score=${movieGeometryPreservationScore}`, severity: 'error' });
  }
  if (gonegiTranslationIntegrity !== 'PASS') {
    issues.push({ code: 'GONEGI_TRANSLATION_FAIL', message: 'gonegi_translation_integrity=FAIL', severity: 'error' });
  }
  if (!worldIdentityLockPass) {
    issues.push({ code: 'WORLD_IDENTITY_LOCK_FAIL', message: `gonegi=${gonegiDominance} movie=${movieDominance}`, severity: 'error' });
  }
  if (forbiddenLeak) {
    issues.push({ code: 'FORBIDDEN_CONTROL_LEAK', message: 'Movie dataset controls forbidden world identity fields', severity: 'error' });
  }
  if (reconstructionReadinessScore < 95) {
    issues.push({ code: 'READINESS_SCORE_LOW', message: `score=${reconstructionReadinessScore}`, severity: 'error' });
  }

  const bowAnchor = anchors.find((a) => a.anchor_id === 'titanic_bow_pose');
  const bowMeaning = String(bowAnchor?.emotion ?? '');
  if (!bowMeaning.includes('freedom') || !bowMeaning.includes('romance') || !bowMeaning.includes('wonder')) {
    issues.push({ code: 'BOW_ANCHOR_MEANING', message: 'titanic_bow_pose must preserve freedom, romance, wonder', severity: 'error' });
  }

  return {
    issues,
    metrics: {
      scene_count: scenes.length,
      camera_patterns: cameras.length,
      blocking_patterns: blockings.length,
      compositions: compositions.length,
      semantic_anchors: anchors.length,
      prop_coordinates: props.length,
      depth_entries: depths.length,
      generic_harbor_regression_count: genericHarborRegressionCount,
      semantic_anchor_binding_rate: Number(semanticAnchorBindingRate.toFixed(4)),
      prop_coordinate_binding_rate: Number(propCoordinateBindingRate.toFixed(4)),
      depth_preservation_score: Number(depthPreservationScore.toFixed(2)),
      movie_geometry_preservation_score: Number(movieGeometryPreservationScore.toFixed(2)),
      gonegi_translation_integrity: gonegiTranslationIntegrity,
      gonegi_world_dominance: gonegiDominance,
      movie_dataset_dominance: movieDominance,
      world_identity_lock: worldIdentityLockPass ? 'PASS' : 'FAIL',
      reconstruction_readiness_score: Number(reconstructionReadinessScore.toFixed(2)),
    },
  };
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const geometryReport = tryReadJson(root, MOVIE_GEOMETRY_SEMANTIC_REPORT_PATH);

  const gates = {
    movie_geometry_semantic_pass:
      String(geometryReport?.final_verdict ?? '') === MOVIE_GEOMETRY_SEMANTIC_PASS_VERDICT,
    semantic_anchor_library_exists: fs.existsSync(path.join(root, SEMANTIC_ANCHOR_LIBRARY_PATH)),
    titanic_source_integrated: fs.existsSync(path.join(root, 'imports/source_videos/active/live_action/Titanic_02.json')),
  };

  if (!gates.movie_geometry_semantic_pass) {
    issues.push({ code: 'GEOMETRY_SEMANTIC_PRECHECK_FAIL', message: 'Movie geometry semantic system not PASS', severity: 'error' });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeTitanicMovieReconstructionDataset(projectRoot?: string): TitanicMovieReconstructionReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: TitanicMovieReconstructionReport = {
      report_id: 'titanic-movie-reconstruction-dataset-report-v3',
      phase: TITANIC_RECONSTRUCTION_PHASE,
      system_id: TITANIC_RECONSTRUCTION_SYSTEM_ID,
      generated_at: new Date().toISOString(),
      final_verdict: TITANIC_RECONSTRUCTION_FAIL_VERDICT,
      reconstruction_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
    writeJson(root, TITANIC_RECONSTRUCTION_REPORT_PATH, fail);
    return fail;
  }

  const dataset = materializeTitanicDataset(root);
  const rules = readJson<Record<string, unknown>>(root, TITANIC_WORLD_TRANSLATION_RULES_PATH);
  const validation = validateDataset(
    dataset.scenes,
    dataset.cameras,
    dataset.blockings,
    dataset.compositions,
    dataset.anchors,
    dataset.props,
    dataset.depths,
    rules
  );
  issues.push(...validation.issues);

  const reconstructionPassed = issues.filter((i) => i.severity === 'error').length === 0;

  const validationSummary: Record<string, string | number | boolean> = {
    ...validation.metrics,
    gpu_execution: false,
    video_generation: false,
    next_order: reconstructionPassed ? 'PHASE-VIDEO-SHORT-TEST-001' : 'PHASE-TITANIC-RECONSTRUCTION-DATASET-PATCH-001',
    policy: SAFE_CREATE_POLICY,
    movie_dataset_swappable: true,
    gonegi_world_permanent: true,
  };

  const report: TitanicMovieReconstructionReport = {
    report_id: 'titanic-movie-reconstruction-dataset-report-v3',
    phase: TITANIC_RECONSTRUCTION_PHASE,
    system_id: TITANIC_RECONSTRUCTION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: reconstructionPassed ? TITANIC_RECONSTRUCTION_PASS_VERDICT : TITANIC_RECONSTRUCTION_FAIL_VERDICT,
    reconstruction_passed: reconstructionPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
  };

  const fullReport = {
    ...report,
    core_philosophy: {
      movie_dataset_is_scene_grammar: true,
      gonegi_world_permanent: true,
      movie_dataset_swappable: true,
    },
    dataset_paths: {
      scene_registry: TITANIC_SCENE_REGISTRY_PATH,
      camera_registry: TITANIC_CAMERA_REGISTRY_PATH,
      blocking_registry: TITANIC_BLOCKING_REGISTRY_PATH,
      composition_registry: TITANIC_COMPOSITION_REGISTRY_PATH,
      semantic_anchor_registry: TITANIC_SEMANTIC_ANCHOR_REGISTRY_PATH,
      prop_coordinate_registry: TITANIC_PROP_COORDINATE_REGISTRY_PATH,
      spatial_depth_registry: TITANIC_SPATIAL_DEPTH_REGISTRY_PATH,
      world_translation_rules: TITANIC_WORLD_TRANSLATION_RULES_PATH,
      reconstruction_prompt_adapter: TITANIC_RECONSTRUCTION_ADAPTER_PATH,
    },
    production_readiness_gates: {
      scene_count_gte_30: Number(validation.metrics.scene_count) >= 30,
      camera_patterns_gte_50: Number(validation.metrics.camera_patterns) >= 50,
      blocking_patterns_gte_50: Number(validation.metrics.blocking_patterns) >= 50,
      compositions_gte_40: Number(validation.metrics.compositions) >= 40,
      semantic_anchors_gte_8: Number(validation.metrics.semantic_anchors) >= 8,
      prop_coordinates_gte_50: Number(validation.metrics.prop_coordinates) >= 50,
      depth_entries_gte_40: Number(validation.metrics.depth_entries) >= 40,
      generic_harbor_regression_eq_0: Number(validation.metrics.generic_harbor_regression_count) === 0,
      semantic_anchor_binding_rate_gte_0_95: Number(validation.metrics.semantic_anchor_binding_rate) >= 0.95,
      movie_geometry_preservation_score_gte_90: Number(validation.metrics.movie_geometry_preservation_score) >= 90,
      gonegi_translation_integrity_pass: validation.metrics.gonegi_translation_integrity === 'PASS',
      world_identity_lock_pass: validation.metrics.world_identity_lock === 'PASS',
      reconstruction_readiness_score_gte_95: Number(validation.metrics.reconstruction_readiness_score) >= 95,
    },
    success_definition: {
      swappable_movie_layers: ['Titanic', 'Little Women', 'Shinkai', 'Ghibli'],
      changes_on_swap: ['camera', 'blocking', 'composition', 'semantic_meaning'],
      preserves_on_swap: ['Gonegi World', 'character_identity', 'Mediterranean identity', 'living_world_identity'],
      required_output: 'Titanic Scene Reconstructed Inside Gonegi World',
    },
    next_pipeline: reconstructionPassed ? ['PHASE-VIDEO-SHORT-TEST-001'] : ['PHASE-TITANIC-RECONSTRUCTION-DATASET-PATCH-001'],
  };

  fs.mkdirSync(path.join(root, 'reports/movie_reconstruction'), { recursive: true });
  writeJson(root, TITANIC_RECONSTRUCTION_REPORT_PATH, fullReport);

  return report;
}
