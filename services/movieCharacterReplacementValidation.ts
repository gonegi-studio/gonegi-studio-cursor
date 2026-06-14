import fs from 'node:fs';
import path from 'node:path';
import {
  FrameGenerationUnit,
  MovieFrameGenerationPlan,
  loadAllMovieFrameGenerationPlans,
} from './movieFrameGenerationOrchestrator.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_CHARACTER_REPLACEMENT_PHASE = 'PHASE-MOVIE-REPLICA-006' as const;
export const MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID = 'MOVIE_CHARACTER_REPLACEMENT_VALIDATION_V1' as const;
export const MOVIE_CHARACTER_REPLACEMENT_PASS_VERDICT = 'PASS_MOVIE_CHARACTER_REPLACEMENT_V1' as const;
export const MOVIE_CHARACTER_REPLACEMENT_FAIL_VERDICT = 'FAIL_MOVIE_CHARACTER_REPLACEMENT_V1' as const;

export const MOVIE_CHARACTER_REPLACEMENT_SCHEMA_PATH =
  'datasets/movie_replica/movie-character-replacement-validation.schema.json' as const;
export const MOVIE_CHARACTER_REPLACEMENT_REPORT_PATH =
  'reports/movie_replica/MOVIE_CHARACTER_REPLACEMENT_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

export const CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'datasets/movie_replica/titanic/titanic-character-replacement-validation.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'datasets/movie_replica/spirited_away/spirited-away-character-replacement-validation.json',
  },
] as const;

const CANONICAL_TARGETS = new Set(['gonegi', 'dana', 'gamja', 'aengdu']);

type JsonRecord = Record<string, unknown>;

export interface CharacterReplacementValidation {
  validation_id: string;
  movie_id: string;
  scene_id: string;
  original_character: string;
  replacement_character: string;
  replacement_map: JsonRecord;
  identity_preservation_score: number;
  scene_preservation_score: number;
  camera_preservation_score: number;
  blocking_preservation_score: number;
  execution_flags: typeof EXECUTION_FLAGS;
  built_at: string;
}

export interface MovieCharacterReplacementValidationDataset {
  validation_dataset_id: string;
  phase: typeof MOVIE_CHARACTER_REPLACEMENT_PHASE;
  system_id: typeof MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID;
  movie_id: string;
  source_generation_plan_id: string;
  generated_at: string;
  scene_count: number;
  replacement_count: number;
  validations: CharacterReplacementValidation[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function round4(n: number): number {
  return Number(n.toFixed(4));
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

function computeIdentityScore(
  unit: FrameGenerationUnit,
  originalCharacter: string,
  targetCharacterId: string
): number {
  const replacementMap = unit.replacement_map;
  const replacementReady = replacementMap.replacement_ready === true;
  const canonical = CANONICAL_TARGETS.has(targetCharacterId);
  const characterState = unit.character_state as { characters?: JsonRecord[] };
  const characterReady = asArray(characterState.characters).some(
    (character) =>
      String(character.character_id ?? '') === originalCharacter && character.replacement_ready === true
  );

  let score = 0.88;
  if (replacementReady) score += 0.04;
  if (canonical) score += 0.04;
  if (characterReady) score += 0.03;
  return round4(Math.min(score, 0.99));
}

function computeSceneScore(unit: FrameGenerationUnit): number {
  const environment = unit.environment_state;
  let score = 0.86;
  if (environment.structure_control === 'movie_dataset_only') score += 0.05;
  if (environment.appearance_control === 'gonegi_world_only') score += 0.04;
  if (typeof environment.environment_type === 'string') score += 0.02;
  return round4(Math.min(score, 0.98));
}

function computeCameraScore(unit: FrameGenerationUnit): number {
  const camera = unit.camera_state;
  let score = 0.87;
  if (typeof camera.movement_type === 'string') score += 0.03;
  if (typeof camera.shot_type === 'string') score += 0.03;
  if (Array.isArray(camera.start_position) && Array.isArray(camera.end_position)) score += 0.04;
  if (typeof camera.timeline_ref === 'string') score += 0.02;
  return round4(Math.min(score, 0.99));
}

function computeBlockingScore(unit: FrameGenerationUnit, originalCharacter: string): number {
  const characterState = unit.character_state as { character_count?: number; characters?: JsonRecord[] };
  const characters = asArray(characterState.characters);
  const target = characters.find((character) => String(character.character_id) === originalCharacter);

  let score = 0.85;
  if (Number(characterState.character_count ?? 0) >= 2) score += 0.04;
  if (target && typeof target.motion_state === 'string') score += 0.04;
  if (target && typeof target.interaction_motion === 'string') score += 0.03;
  if (characters.every((character) => character.replacement_ready === true)) score += 0.02;
  return round4(Math.min(score, 0.98));
}

function sceneRepresentativeUnits(plan: MovieFrameGenerationPlan): Map<string, FrameGenerationUnit> {
  const byScene = new Map<string, FrameGenerationUnit>();
  for (const unit of plan.generation_units) {
    if (!byScene.has(unit.scene_id)) {
      byScene.set(unit.scene_id, unit);
    }
  }
  return byScene;
}

function buildValidationEntry(
  unit: FrameGenerationUnit,
  mapping: JsonRecord,
  index: number,
  builtAt: string
): CharacterReplacementValidation {
  const originalCharacter = String(mapping.source_character_id);
  const replacementCharacter = String(mapping.target_character_id);
  const sceneSuffix = unit.scene_id.replace(/^scene_[a-z0-9_]+_/, '');

  return {
    validation_id: `${unit.movie_id}_cr_val_${sceneSuffix}_${index + 1}`,
    movie_id: unit.movie_id,
    scene_id: unit.scene_id,
    original_character: originalCharacter,
    replacement_character: replacementCharacter,
    replacement_map: unit.replacement_map,
    identity_preservation_score: computeIdentityScore(unit, originalCharacter, replacementCharacter),
    scene_preservation_score: computeSceneScore(unit),
    camera_preservation_score: computeCameraScore(unit),
    blocking_preservation_score: computeBlockingScore(unit, originalCharacter),
    execution_flags: { ...EXECUTION_FLAGS },
    built_at: builtAt,
  };
}

export function buildCharacterReplacementValidationsForPlan(
  plan: MovieFrameGenerationPlan
): CharacterReplacementValidation[] {
  const builtAt = new Date().toISOString();
  const validations: CharacterReplacementValidation[] = [];
  const representatives = sceneRepresentativeUnits(plan);

  for (const unit of representatives.values()) {
    const mappings = asArray((unit.replacement_map as JsonRecord).mappings);
    mappings.forEach((mapping, index) => {
      validations.push(buildValidationEntry(unit, mapping, index, builtAt));
    });
  }

  return validations.sort((a, b) => {
    const sceneCompare = a.scene_id.localeCompare(b.scene_id);
    if (sceneCompare !== 0) return sceneCompare;
    return a.original_character.localeCompare(b.original_character);
  });
}

export function buildMovieCharacterReplacementValidationDataset(
  plan: MovieFrameGenerationPlan
): MovieCharacterReplacementValidationDataset {
  const builtAt = new Date().toISOString();
  const validations = buildCharacterReplacementValidationsForPlan(plan);
  const sceneIds = new Set(validations.map((validation) => validation.scene_id));

  return {
    validation_dataset_id: `${plan.movie_id}-character-replacement-validation-v1`,
    phase: MOVIE_CHARACTER_REPLACEMENT_PHASE,
    system_id: MOVIE_CHARACTER_REPLACEMENT_SYSTEM_ID,
    movie_id: plan.movie_id,
    source_generation_plan_id: plan.generation_plan_id,
    generated_at: builtAt,
    scene_count: sceneIds.size,
    replacement_count: validations.length,
    validations,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function buildAllMovieCharacterReplacementValidationDatasets(
  root: string
): MovieCharacterReplacementValidationDataset[] {
  const plans = loadAllMovieFrameGenerationPlans(root);
  return plans.map((plan) => buildMovieCharacterReplacementValidationDataset(plan));
}

export function writeMovieCharacterReplacementValidations(
  projectRoot?: string
): MovieCharacterReplacementValidationDataset[] {
  const root = resolveProjectRoot(projectRoot);
  const datasets = buildAllMovieCharacterReplacementValidationDatasets(root);

  for (const spec of CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS) {
    const dataset = datasets.find((item) => item.movie_id === spec.movie_id);
    if (dataset) {
      writeJson(root, spec.output_path, dataset);
    }
  }

  return datasets;
}

export function loadMovieCharacterReplacementValidationDataset(
  root: string,
  movieId: string
): MovieCharacterReplacementValidationDataset | null {
  const spec = CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieCharacterReplacementValidationDataset;
}

export function loadAllMovieCharacterReplacementValidationDatasets(
  root: string
): MovieCharacterReplacementValidationDataset[] {
  return CHARACTER_REPLACEMENT_VALIDATION_OUTPUTS.map((spec) =>
    loadMovieCharacterReplacementValidationDataset(root, spec.movie_id)
  ).filter((dataset): dataset is MovieCharacterReplacementValidationDataset => dataset !== null);
}

export { SAFE_CREATE_POLICY };
