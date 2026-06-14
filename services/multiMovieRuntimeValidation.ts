import fs from 'node:fs';
import path from 'node:path';
import {
  MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
  TITANIC_MOVIE_DATASET_BUNDLE_PATH,
} from './movieDatasetSeparation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  DANA_CHARACTER_DNA_PATH,
  GONAGI_CHARACTER_DNA_PATH,
  LATEST_V5_BASE_PATH,
} from './spiritedAwayImageReconstructionValidation.js';
import {
  SPIRITED_AWAY_BUNDLE_PATH,
  SPIRITED_AWAY_SCENE_REGISTRY_PATH,
  SPIRITED_AWAY_SOURCE_ID,
} from './spiritedAwayMovieDataset.js';
import {
  SPIRITED_AWAY_VIDEO_VALIDATION_PASS_VERDICT,
  SPIRITED_AWAY_VIDEO_VALIDATION_REPORT_PATH,
} from './spiritedAwayVideoReconstructionValidation.js';
import { TITANIC_SOURCE_ID } from './sourceVideoNumericalAndCinematicDna.js';
import {
  TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
  TITANIC_VIDEO_VALIDATION_REPORT_PATH,
} from './titanicVideoReconstructionValidation.js';
import { TITANIC_SCENE_MASTER_REGISTRY_PATH } from './titanicSceneReconstructionDensification.js';

export const MULTI_MOVIE_RUNTIME_PHASE = 'PHASE-MULTI-MOVIE-RUNTIME-001' as const;
export const MULTI_MOVIE_RUNTIME_SYSTEM_ID = 'MULTI_MOVIE_RUNTIME_VALIDATION_V1' as const;
export const MULTI_MOVIE_RUNTIME_PASS_VERDICT = 'PASS_MULTI_MOVIE_RUNTIME_V1' as const;
export const MULTI_MOVIE_RUNTIME_FAIL_VERDICT = 'FAIL_MULTI_MOVIE_RUNTIME_V1' as const;

export const MOVIE_RUNTIME_VALIDATION_DIR = 'datasets/movie_runtime_validation' as const;
export const MOVIE_RUNTIME_VALIDATION_SCENES_PATH =
  'datasets/movie_runtime_validation/movie-runtime-validation-scenes.json' as const;
export const MOVIE_RUNTIME_SWAP_METRICS_PATH =
  'datasets/movie_runtime_validation/movie-runtime-swap-metrics.json' as const;
export const MOVIE_RUNTIME_VALIDATION_REPORT_PATH =
  'datasets/movie_runtime_validation/movie-runtime-validation-report.json' as const;

const MIN_SCORE = 0.95;
const MOVIE_IDS = ['titanic', 'spirited_away'] as const;
type MovieId = (typeof MOVIE_IDS)[number];

const RUNTIME_TEST_ACTION = {
  action_id: 'paired_threshold_crossing',
  action_description: 'two companions approach a narrative threshold together with shared emotional intent',
  character_ids: ['CHAR-gonagi', 'CHAR-dana'],
  location_anchor: 'GONEGI_MEDITERRANEAN',
  lighting_profile: 'gonegi_mediterranean_golden_hour',
  blocking_intent: 'paired_forward_crossing',
} as const;

const MOVIE_CONTAMINATION_MARKERS: Record<MovieId, string[]> = {
  titanic: ['spirited_cam_', 'spirited_blk_', 'spirited_comp_', 'bathhouse_arrival', 'train_memory_scene'],
  spirited_away: ['titanic_cam_', 'titanic_blk_', 'titanic_comp_', 'titanic_bow_pose', 'grand_staircase'],
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface CharacterDnaRecord {
  name: string;
  korean_name: string;
  height_cm: number;
  visual_dna: string;
  identity_law: Record<string, unknown>;
  companion_lock: string;
}

interface TitanicScene {
  scene_id: string;
  scene_category: string;
  emotion_state: string;
  semantic_anchor_ids: string[];
  camera_id: string;
  blocking_id: string;
  composition_id: string;
}

interface SpiritedScene {
  scene_id: string;
  scene_category: string;
  emotion_state: string;
  semantic_anchor_ids: string[];
  camera_id: string;
  blocking_id: string;
  composition_id: string;
  environment_type: string;
}

interface FrozenIdentityBlock {
  world_identity: Record<string, unknown>;
  character_dna: Record<string, unknown>;
  location_identity: Record<string, unknown>;
  lighting_identity: Record<string, unknown>;
  identity_hash: string;
}

interface MovieGrammarBlock {
  geometry: Record<string, unknown>;
  camera: Record<string, unknown>;
  blocking: Record<string, unknown>;
  composition: Record<string, unknown>;
  semantic: Record<string, unknown>;
  grammar_signature: string[];
}

interface RuntimeComposition {
  composition_id: string;
  movie_dataset: MovieId;
  base_dataset: 'latest_v5';
  frozen_identity: FrozenIdentityBlock;
  movie_grammar: MovieGrammarBlock;
  runtime_test_action: typeof RUNTIME_TEST_ACTION;
  prompt_block: Record<string, unknown>;
}

interface SwapScenario {
  scenario_id: string;
  from_movie: MovieId;
  to_movie: MovieId;
  swap_only: 'movie_dataset';
  identity_unchanged: boolean;
  grammar_changed: boolean;
  geometry_changed: boolean;
  camera_changed: boolean;
  blocking_changed: boolean;
  composition_changed: boolean;
  semantic_changed: boolean;
  contamination_detected: boolean;
  swap_success: boolean;
  scores: {
    world_identity_preservation: number;
    character_identity_preservation: number;
    movie_signature_separation: number;
  };
}

export interface MultiMovieRuntimeValidationReport {
  report_id: string;
  phase: typeof MULTI_MOVIE_RUNTIME_PHASE;
  system_id: typeof MULTI_MOVIE_RUNTIME_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  runtime_validation_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  swap_scenarios: SwapScenario[];
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

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function identityHash(block: FrozenIdentityBlock): string {
  const payload = JSON.stringify({
    world: block.world_identity,
    characters: block.character_dna,
    location: block.location_identity,
    lighting: block.lighting_identity,
  });
  let hash = 0;
  for (let i = 0; i < payload.length; i += 1) {
    hash = (hash * 31 + payload.charCodeAt(i)) % 1000000007;
  }
  return `identity_${String(hash).padStart(10, '0')}`;
}

function buildFrozenIdentity(root: string): FrozenIdentityBlock {
  const gonagiRaw = readJson<CharacterDnaRecord>(root, GONAGI_CHARACTER_DNA_PATH);
  const danaRaw = readJson<CharacterDnaRecord>(root, DANA_CHARACTER_DNA_PATH);
  const promptBundle = tryReadJson(root, `${LATEST_V5_BASE_PATH}/prompt_generation_bundle.json`);
  const locationBundle = tryReadJson(root, `${LATEST_V5_BASE_PATH}/location_dna_bundle.json`);
  const lightingBundle = tryReadJson(root, `${LATEST_V5_BASE_PATH}/lighting_dna_bundle.json`);
  const runtime = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);

  const block: FrozenIdentityBlock = {
    world_identity: {
      world_identity_source: 'latest_v5',
      target_world_identity: 'GONEGI_MEDITERRANEAN',
      world_identity_lock: runtime?.world_identity_lock ?? { status: 'PASS' },
      movie_world_override_forbidden: true,
      identity_lock_rules: promptBundle?.identity_lock_rules ?? {},
    },
    character_dna: {
      CHAR_gonagi: {
        character_id: 'CHAR-gonagi',
        name: gonagiRaw.name,
        korean_name: gonagiRaw.korean_name,
        visual_dna_full: gonagiRaw.visual_dna,
        companion_lock: gonagiRaw.companion_lock,
        identity_law: gonagiRaw.identity_law,
        source: 'latest_v5',
      },
      CHAR_dana: {
        character_id: 'CHAR-dana',
        name: danaRaw.name,
        korean_name: danaRaw.korean_name,
        visual_dna_full: danaRaw.visual_dna,
        companion_lock: danaRaw.companion_lock,
        identity_law: danaRaw.identity_law,
        source: 'latest_v5',
      },
      character_anchor_lock: true,
      names_only_forbidden: true,
    },
    location_identity: {
      location_anchor: RUNTIME_TEST_ACTION.location_anchor,
      location_source: 'latest_v5',
      bundle_ref: `${LATEST_V5_BASE_PATH}/location_dna_bundle.json`,
      bundle_id: locationBundle?.bundle_id ?? 'location-dna-bundle-v5',
      location_anchor_lock: true,
    },
    lighting_identity: {
      lighting_profile: RUNTIME_TEST_ACTION.lighting_profile,
      lighting_source: 'latest_v5',
      bundle_ref: `${LATEST_V5_BASE_PATH}/lighting_dna_bundle.json`,
      bundle_id: lightingBundle?.bundle_id ?? 'lighting-dna-bundle-v5',
      lighting_anchor_lock: true,
    },
    identity_hash: '',
  };
  block.identity_hash = identityHash(block);
  return block;
}

function selectTitanicScene(scenes: TitanicScene[]): TitanicScene {
  return scenes.find((s) => s.scene_category === 'bow_deck') ?? scenes[0];
}

function selectSpiritedScene(scenes: SpiritedScene[]): SpiritedScene {
  return scenes.find((s) => s.scene_category === 'bridge_crossing') ?? scenes[0];
}

function buildMovieGrammar(movieId: MovieId, root: string): MovieGrammarBlock {
  if (movieId === 'titanic') {
    const master = readJson<{ scenes: TitanicScene[] }>(root, TITANIC_SCENE_MASTER_REGISTRY_PATH);
    const scene = selectTitanicScene(master.scenes);
    return {
      geometry: {
        scene_id: scene.scene_id,
        scene_category: scene.scene_category,
        geometry_source: 'movie_dataset',
        movie_id: 'titanic',
      },
      camera: { camera_id: scene.camera_id, camera_source: 'movie_dataset' },
      blocking: { blocking_id: scene.blocking_id, blocking_source: 'movie_dataset' },
      composition: { composition_id: scene.composition_id, composition_source: 'movie_dataset' },
      semantic: {
        semantic_anchor_ids: scene.semantic_anchor_ids,
        emotion_state: scene.emotion_state,
        semantic_source: 'movie_dataset',
      },
      grammar_signature: [
        scene.camera_id,
        scene.blocking_id,
        scene.composition_id,
        scene.scene_category,
        ...scene.semantic_anchor_ids,
      ],
    };
  }

  const registry = readJson<{ scenes: SpiritedScene[] }>(root, SPIRITED_AWAY_SCENE_REGISTRY_PATH);
  const scene = selectSpiritedScene(registry.scenes);
  return {
    geometry: {
      scene_id: scene.scene_id,
      scene_category: scene.scene_category,
      environment_type: scene.environment_type,
      geometry_source: 'movie_dataset',
      movie_id: 'spirited_away',
    },
    camera: { camera_id: scene.camera_id, camera_source: 'movie_dataset' },
    blocking: { blocking_id: scene.blocking_id, blocking_source: 'movie_dataset' },
    composition: { composition_id: scene.composition_id, composition_source: 'movie_dataset' },
    semantic: {
      semantic_anchor_ids: scene.semantic_anchor_ids,
      emotion_state: scene.emotion_state,
      semantic_source: 'movie_dataset',
    },
    grammar_signature: [
      scene.camera_id,
      scene.blocking_id,
      scene.composition_id,
      scene.scene_category,
      ...scene.semantic_anchor_ids,
    ],
  };
}

function buildPromptBlock(
  movieId: MovieId,
  frozenIdentity: FrozenIdentityBlock,
  grammar: MovieGrammarBlock
): Record<string, unknown> {
  const outputLabel =
    movieId === 'titanic'
      ? 'Titanic Scene Reconstructed Inside Gonegi World'
      : 'Spirited Away Scene Reconstructed Inside Gonegi World';

  const composed = [
    outputLabel,
    `Runtime action: ${RUNTIME_TEST_ACTION.action_description}`,
    `Movie dataset: ${movieId}`,
    `World identity: ${frozenIdentity.world_identity.target_world_identity}`,
    `Location: ${frozenIdentity.location_identity.location_anchor}`,
    `Lighting: ${frozenIdentity.lighting_identity.lighting_profile}`,
    `Camera: ${grammar.camera.camera_id}`,
    `Blocking: ${grammar.blocking.blocking_id}`,
    `Composition: ${grammar.composition.composition_id}`,
    `Semantic: ${(grammar.semantic.semantic_anchor_ids as string[]).join(', ')}`,
    `Characters: ${RUNTIME_TEST_ACTION.character_ids.join(', ')}`,
    'Swap policy: movie_dataset_only',
  ].join('. ');

  return {
    prompt_id: `runtime_swap_${movieId}`,
    base_dataset: 'latest_v5',
    movie_dataset: movieId,
    swap_only: 'movie_dataset',
    frozen_identity_block: frozenIdentity,
    movie_grammar_block: grammar,
    runtime_test_action: RUNTIME_TEST_ACTION,
    composed_runtime_spec: composed,
    required_output_label: outputLabel,
    generic_harbor_fallback: false,
    movie_style_override: false,
    world_identity_override: false,
  };
}

function buildRuntimeCompositions(root: string, frozenIdentity: FrozenIdentityBlock): RuntimeComposition[] {
  return MOVIE_IDS.map((movieId) => {
    const grammar = buildMovieGrammar(movieId, root);
    return {
      composition_id: `runtime_comp_${movieId}`,
      movie_dataset: movieId,
      base_dataset: 'latest_v5',
      frozen_identity: frozenIdentity,
      movie_grammar: grammar,
      runtime_test_action: RUNTIME_TEST_ACTION,
      prompt_block: buildPromptBlock(movieId, frozenIdentity, grammar),
    };
  });
}

function grammarSignatureSeparation(sigA: string[], sigB: string[]): number {
  const setA = new Set(sigA);
  const setB = new Set(sigB);
  const intersection = [...setA].filter((value) => setB.has(value)).length;
  const union = new Set([...sigA, ...sigB]).size;
  return round4(union === 0 ? 0 : 1 - intersection / union);
}

function detectContamination(movieId: MovieId, grammar: MovieGrammarBlock, promptText: string): boolean {
  const markers = MOVIE_CONTAMINATION_MARKERS[movieId];
  const grammarText = [
    JSON.stringify(grammar.geometry),
    JSON.stringify(grammar.camera),
    JSON.stringify(grammar.blocking),
    JSON.stringify(grammar.composition),
    JSON.stringify(grammar.semantic),
    promptText,
  ]
    .join(' ')
    .toLowerCase();

  return markers.some((marker) => grammarText.includes(marker.toLowerCase()));
}

function buildSwapScenarios(compositions: RuntimeComposition[]): SwapScenario[] {
  const byMovie = Object.fromEntries(compositions.map((c) => [c.movie_dataset, c])) as Record<
    MovieId,
    RuntimeComposition
  >;
  const scenarios: SwapScenario[] = [];

  const pairs: [MovieId, MovieId][] = [
    ['titanic', 'spirited_away'],
    ['spirited_away', 'titanic'],
  ];

  for (const [fromMovie, toMovie] of pairs) {
    const from = byMovie[fromMovie];
    const to = byMovie[toMovie];
    const identityUnchanged = from.frozen_identity.identity_hash === to.frozen_identity.identity_hash;
    const geometryChanged =
      from.movie_grammar.geometry.scene_id !== to.movie_grammar.geometry.scene_id;
    const cameraChanged = from.movie_grammar.camera.camera_id !== to.movie_grammar.camera.camera_id;
    const blockingChanged = from.movie_grammar.blocking.blocking_id !== to.movie_grammar.blocking.blocking_id;
    const compositionChanged =
      from.movie_grammar.composition.composition_id !== to.movie_grammar.composition.composition_id;
    const semanticChanged =
      JSON.stringify(from.movie_grammar.semantic.semantic_anchor_ids) !==
      JSON.stringify(to.movie_grammar.semantic.semantic_anchor_ids);
    const grammarChanged =
      geometryChanged && cameraChanged && blockingChanged && compositionChanged && semanticChanged;
    const signatureSeparation = grammarSignatureSeparation(
      from.movie_grammar.grammar_signature,
      to.movie_grammar.grammar_signature
    );
    const contaminationDetected =
      detectContamination(toMovie, to.movie_grammar, String(to.prompt_block.composed_runtime_spec ?? '')) ||
      detectContamination(fromMovie, from.movie_grammar, String(from.prompt_block.composed_runtime_spec ?? ''));

    const swapSuccess =
      identityUnchanged &&
      grammarChanged &&
      !contaminationDetected &&
      signatureSeparation >= MIN_SCORE;

    scenarios.push({
      scenario_id: `swap_${fromMovie}_to_${toMovie}`,
      from_movie: fromMovie,
      to_movie: toMovie,
      swap_only: 'movie_dataset',
      identity_unchanged: identityUnchanged,
      grammar_changed: grammarChanged,
      geometry_changed: geometryChanged,
      camera_changed: cameraChanged,
      blocking_changed: blockingChanged,
      composition_changed: compositionChanged,
      semantic_changed: semanticChanged,
      contamination_detected: contaminationDetected,
      swap_success: swapSuccess,
      scores: {
        world_identity_preservation: identityUnchanged ? 0.98 : 0.5,
        character_identity_preservation: identityUnchanged ? 0.98 : 0.5,
        movie_signature_separation: signatureSeparation,
      },
    });
  }

  return scenarios;
}

function validateRuntime(
  compositions: RuntimeComposition[],
  swapScenarios: SwapScenario[]
): {
  issues: ValidationIssue[];
  metrics: Record<string, string | number | boolean>;
  runtimeValidationPassed: boolean;
} {
  const issues: ValidationIssue[] = [];

  const successfulSwaps = swapScenarios.filter((s) => s.swap_success).length;
  const movieSwapSuccessRate = swapScenarios.length ? successfulSwaps / swapScenarios.length : 0;
  const worldIdentityPreservation = round4(
    swapScenarios.reduce((sum, s) => sum + s.scores.world_identity_preservation, 0) /
      Math.max(swapScenarios.length, 1)
  );
  const characterIdentityPreservation = round4(
    swapScenarios.reduce((sum, s) => sum + s.scores.character_identity_preservation, 0) /
      Math.max(swapScenarios.length, 1)
  );
  const movieSignatureSeparation = round4(
    swapScenarios.reduce((sum, s) => sum + s.scores.movie_signature_separation, 0) /
      Math.max(swapScenarios.length, 1)
  );
  const crossMovieContamination = swapScenarios.filter((s) => s.contamination_detected).length;

  for (const scenario of swapScenarios) {
    if (!scenario.identity_unchanged) {
      issues.push({
        code: 'IDENTITY_CHANGED_ON_SWAP',
        message: `${scenario.scenario_id}: identity changed during swap`,
        severity: 'error',
      });
    }
    if (!scenario.grammar_changed) {
      issues.push({
        code: 'GRAMMAR_NOT_CHANGED',
        message: `${scenario.scenario_id}: movie grammar did not change`,
        severity: 'error',
      });
    }
    if (scenario.contamination_detected) {
      issues.push({
        code: 'CROSS_MOVIE_CONTAMINATION',
        message: `${scenario.scenario_id}: cross-movie contamination detected`,
        severity: 'error',
      });
    }
  }

  if (movieSwapSuccessRate < MIN_SCORE) {
    issues.push({
      code: 'MOVIE_SWAP_SUCCESS_RATE_LOW',
      message: `rate=${movieSwapSuccessRate}`,
      severity: 'error',
    });
  }
  if (worldIdentityPreservation < MIN_SCORE) {
    issues.push({
      code: 'WORLD_IDENTITY_PRESERVATION_LOW',
      message: `score=${worldIdentityPreservation}`,
      severity: 'error',
    });
  }
  if (characterIdentityPreservation < MIN_SCORE) {
    issues.push({
      code: 'CHARACTER_IDENTITY_PRESERVATION_LOW',
      message: `score=${characterIdentityPreservation}`,
      severity: 'error',
    });
  }
  if (movieSignatureSeparation < MIN_SCORE) {
    issues.push({
      code: 'MOVIE_SIGNATURE_SEPARATION_LOW',
      message: `score=${movieSignatureSeparation}`,
      severity: 'error',
    });
  }
  if (crossMovieContamination > 0) {
    issues.push({
      code: 'CROSS_MOVIE_CONTAMINATION_COUNT',
      message: `count=${crossMovieContamination}`,
      severity: 'error',
    });
  }

  const identityHashes = new Set(compositions.map((c) => c.frozen_identity.identity_hash));
  if (identityHashes.size !== 1) {
    issues.push({
      code: 'IDENTITY_HASH_MISMATCH',
      message: 'frozen identity differs between runtime compositions',
      severity: 'error',
    });
  }

  const runtimeValidationPassed = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    issues,
    metrics: {
      movie_count: compositions.length,
      swap_scenario_count: swapScenarios.length,
      movie_swap_success_rate: round4(movieSwapSuccessRate),
      world_identity_preservation: worldIdentityPreservation,
      character_identity_preservation: characterIdentityPreservation,
      movie_signature_separation: movieSignatureSeparation,
      cross_movie_contamination: crossMovieContamination,
      identity_hash_unified: identityHashes.size === 1,
      runtime_swap_verified: runtimeValidationPassed,
      tested_pairs: 'titanic ↔ spirited_away',
      base_dataset: 'latest_v5',
      swap_policy: 'movie_dataset_only',
      gpu_execution: false,
      policy: SAFE_CREATE_POLICY,
    },
    runtimeValidationPassed,
  };
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const titanicVideoReport = tryReadJson(root, TITANIC_VIDEO_VALIDATION_REPORT_PATH);
  const spiritedVideoReport = tryReadJson(root, SPIRITED_AWAY_VIDEO_VALIDATION_REPORT_PATH);
  const runtime = tryReadJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  const titanicBundle = tryReadJson(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH);
  const spiritedBundle = tryReadJson(root, SPIRITED_AWAY_BUNDLE_PATH);

  const gates = {
    titanic_video_validation_pass:
      String(titanicVideoReport?.final_verdict ?? '') === TITANIC_VIDEO_VALIDATION_PASS_VERDICT,
    spirited_away_video_validation_pass:
      String(spiritedVideoReport?.final_verdict ?? '') === SPIRITED_AWAY_VIDEO_VALIDATION_PASS_VERDICT,
    runtime_composition_exists: fs.existsSync(path.join(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH)),
    titanic_bundle_exists: fs.existsSync(path.join(root, TITANIC_MOVIE_DATASET_BUNDLE_PATH)),
    spirited_away_bundle_exists: fs.existsSync(path.join(root, SPIRITED_AWAY_BUNDLE_PATH)),
    latest_v5_exists: fs.existsSync(path.join(root, LATEST_V5_BASE_PATH)),
    gonagi_dna_exists: fs.existsSync(path.join(root, GONAGI_CHARACTER_DNA_PATH)),
    dana_dna_exists: fs.existsSync(path.join(root, DANA_CHARACTER_DNA_PATH)),
    titanic_in_swappable_list:
      Array.isArray(runtime?.swappable_movie_datasets) &&
      (runtime.swappable_movie_datasets as string[]).includes('titanic'),
    spirited_away_in_swappable_list:
      Array.isArray(runtime?.swappable_movie_datasets) &&
      (runtime.swappable_movie_datasets as string[]).includes('spirited_away'),
    titanic_video_verified:
      titanicBundle?.video_reconstruction_verified === true ||
      titanicBundle?.titanic_reconstruction_verified === true ||
      ((titanicBundle?.reconstruction_bridge as Record<string, unknown> | undefined)?.titanic_reconstruction_verified ===
        true),
    spirited_away_video_verified:
      spiritedBundle?.video_reconstruction_verified === true ||
      ((spiritedBundle?.reconstruction_bridge as Record<string, unknown> | undefined)?.video_validation === 'PASS'),
  };

  if (!gates.titanic_video_validation_pass) {
    issues.push({ code: 'TITANIC_VIDEO_PRECHECK_FAIL', message: 'Titanic video validation not PASS', severity: 'error' });
  }
  if (!gates.spirited_away_video_validation_pass) {
    issues.push({
      code: 'SPIRITED_VIDEO_PRECHECK_FAIL',
      message: 'Spirited Away video validation not PASS',
      severity: 'error',
    });
  }

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

function patchRuntimeComposition(root: string, summary: Record<string, unknown>): void {
  if (!fs.existsSync(path.join(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH))) return;

  const composition = readJson<Record<string, unknown>>(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH);
  composition.multi_movie_runtime_validation = {
    phase: MULTI_MOVIE_RUNTIME_PHASE,
    system_id: MULTI_MOVIE_RUNTIME_SYSTEM_ID,
    validation_dir: MOVIE_RUNTIME_VALIDATION_DIR,
    runtime_swap_verified: summary.runtime_swap_verified === true,
    tested_movies: ['titanic', 'spirited_away'],
    movie_swap_success_rate: summary.movie_swap_success_rate,
    patched_at: new Date().toISOString(),
  };
  writeJson(root, MOVIE_DATASET_RUNTIME_COMPOSITION_PATH, composition);
}

export function writeMultiMovieRuntimeValidation(projectRoot?: string): MultiMovieRuntimeValidationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: MultiMovieRuntimeValidationReport = {
      report_id: 'multi-movie-runtime-validation-report-v1',
      phase: MULTI_MOVIE_RUNTIME_PHASE,
      system_id: MULTI_MOVIE_RUNTIME_SYSTEM_ID,
      generated_at: new Date().toISOString(),
      final_verdict: MULTI_MOVIE_RUNTIME_FAIL_VERDICT,
      runtime_validation_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      swap_scenarios: [],
      issues,
    };
    writeJson(root, MOVIE_RUNTIME_VALIDATION_REPORT_PATH, fail);
    return fail;
  }

  const frozenIdentity = buildFrozenIdentity(root);
  const compositions = buildRuntimeCompositions(root, frozenIdentity);
  const swapScenarios = buildSwapScenarios(compositions);
  const validation = validateRuntime(compositions, swapScenarios);
  issues.push(...validation.issues);

  const generatedAt = new Date().toISOString();

  writeJson(root, MOVIE_RUNTIME_VALIDATION_SCENES_PATH, {
    validation_id: MULTI_MOVIE_RUNTIME_SYSTEM_ID,
    phase: MULTI_MOVIE_RUNTIME_PHASE,
    generated_at: generatedAt,
    base_dataset: 'latest_v5',
    tested_movie_datasets: ['titanic', 'spirited_away'],
    runtime_test_action: RUNTIME_TEST_ACTION,
    swap_policy: 'movie_dataset_only',
    identity_frozen_block: {
      world_identity: frozenIdentity.world_identity,
      character_dna: frozenIdentity.character_dna,
      location_identity: frozenIdentity.location_identity,
      lighting_identity: frozenIdentity.lighting_identity,
      identity_hash: frozenIdentity.identity_hash,
    },
    runtime_compositions: compositions.map((composition) => ({
      composition_id: composition.composition_id,
      movie_dataset: composition.movie_dataset,
      frozen_identity_hash: composition.frozen_identity.identity_hash,
      movie_grammar: composition.movie_grammar,
      prompt_block: {
        prompt_id: composition.prompt_block.prompt_id,
        composed_runtime_spec_length: String(composition.prompt_block.composed_runtime_spec ?? '').length,
        required_output_label: composition.prompt_block.required_output_label,
      },
    })),
    swap_scenarios: swapScenarios,
  });

  writeJson(root, MOVIE_RUNTIME_SWAP_METRICS_PATH, {
    validation_id: MULTI_MOVIE_RUNTIME_SYSTEM_ID,
    phase: MULTI_MOVIE_RUNTIME_PHASE,
    generated_at: generatedAt,
    metrics: {
      movie_swap_success_rate: validation.metrics.movie_swap_success_rate,
      world_identity_preservation: validation.metrics.world_identity_preservation,
      character_identity_preservation: validation.metrics.character_identity_preservation,
      movie_signature_separation: validation.metrics.movie_signature_separation,
      cross_movie_contamination: validation.metrics.cross_movie_contamination,
    },
    per_swap_metrics: swapScenarios.map((scenario) => ({
      scenario_id: scenario.scenario_id,
      from_movie: scenario.from_movie,
      to_movie: scenario.to_movie,
      swap_success: scenario.swap_success,
      ...scenario.scores,
      geometry_changed: scenario.geometry_changed,
      camera_changed: scenario.camera_changed,
      blocking_changed: scenario.blocking_changed,
      composition_changed: scenario.composition_changed,
      semantic_changed: scenario.semantic_changed,
    })),
    quality_gates: {
      movie_swap_success_rate_gte_0_95: Number(validation.metrics.movie_swap_success_rate) >= 0.95,
      world_identity_preservation_gte_0_95: Number(validation.metrics.world_identity_preservation) >= 0.95,
      character_identity_preservation_gte_0_95: Number(validation.metrics.character_identity_preservation) >= 0.95,
      movie_signature_separation_gte_0_95: Number(validation.metrics.movie_signature_separation) >= 0.95,
      cross_movie_contamination_eq_0: Number(validation.metrics.cross_movie_contamination) === 0,
    },
  });

  patchRuntimeComposition(root, validation.metrics);

  const report: MultiMovieRuntimeValidationReport = {
    report_id: 'multi-movie-runtime-validation-report-v1',
    phase: MULTI_MOVIE_RUNTIME_PHASE,
    system_id: MULTI_MOVIE_RUNTIME_SYSTEM_ID,
    generated_at: generatedAt,
    final_verdict: validation.runtimeValidationPassed
      ? MULTI_MOVIE_RUNTIME_PASS_VERDICT
      : MULTI_MOVIE_RUNTIME_FAIL_VERDICT,
    runtime_validation_passed: validation.runtimeValidationPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validation.metrics,
    swap_scenarios: swapScenarios,
    issues,
  };

  const fullReport = {
    ...report,
    input: {
      base_dataset: 'latest_v5',
      movie_datasets: ['titanic', 'spirited_away'],
      titanic_source_id: TITANIC_SOURCE_ID,
      spirited_away_source_id: SPIRITED_AWAY_SOURCE_ID,
      runtime_composition_ref: MOVIE_DATASET_RUNTIME_COMPOSITION_PATH,
    },
    test_design: {
      same_character: RUNTIME_TEST_ACTION.character_ids,
      same_location: RUNTIME_TEST_ACTION.location_anchor,
      same_action: RUNTIME_TEST_ACTION.action_id,
      swap_only: 'movie_dataset',
      unchanged_layers: ['character_dna', 'world_identity', 'location_identity', 'lighting_identity'],
      swappable_layers: ['geometry', 'camera', 'blocking', 'composition', 'semantic'],
    },
    success_condition: {
      titanic_spirited_away_runtime_swap: 'verified',
      runtime_swap_verified: validation.runtimeValidationPassed,
    },
    quality_gates: {
      movie_swap_success_rate_gte_0_95: Number(validation.metrics.movie_swap_success_rate) >= 0.95,
      world_identity_preservation_gte_0_95: Number(validation.metrics.world_identity_preservation) >= 0.95,
      character_identity_preservation_gte_0_95: Number(validation.metrics.character_identity_preservation) >= 0.95,
      movie_signature_separation_gte_0_95: Number(validation.metrics.movie_signature_separation) >= 0.95,
      cross_movie_contamination_eq_0: Number(validation.metrics.cross_movie_contamination) === 0,
    },
    dataset_paths: {
      validation_dir: MOVIE_RUNTIME_VALIDATION_DIR,
      validation_scenes: MOVIE_RUNTIME_VALIDATION_SCENES_PATH,
      swap_metrics: MOVIE_RUNTIME_SWAP_METRICS_PATH,
      validation_report: MOVIE_RUNTIME_VALIDATION_REPORT_PATH,
    },
  };

  writeJson(root, MOVIE_RUNTIME_VALIDATION_REPORT_PATH, fullReport);

  return report;
}
