import fs from 'node:fs';
import path from 'node:path';
import { resolveCanonicalGonegiArtStyle } from './canonicalGonegiArtStyle.js';
import { ImageAppNativeImportSlot } from './movieMasterDatasetBinding.js';
import {
  generateHardenedScenarioFromSpatialGraph,
  writeMovieScenarioHardeningReport,
} from './movieScenarioHardening.js';
import {
  MovieSpatialGraph,
  MovieSpatialGraphDataset,
  SPATIAL_GRAPH_OUTPUTS,
  loadAllMovieSpatialGraphDatasets,
} from './movieSpatialGraphBuilder.js';
import {
  MovieSpatialEngineDataset,
  MovieSpatialSceneRecord,
  loadAllMovieSpatialEngineDatasets,
} from './movieSpatialEngineBuilder.js';
import {
  CHARACTER_SIMPLE_LIBRARY_PATH,
  loadTimeSettingLibrary,
} from './scenarioGenerator/scenario-generator-foundation.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import {
  copyCanonicalCharacterFieldFromGraph,
  GENERATION_CONTEXT_CHARACTER_REF,
} from './generationContextLoader.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const MOVIE_CHARACTER_DNA_LOCK_PHASE = 'PHASE-MOVIE-SPATIAL-013C' as const;
export const MOVIE_CHARACTER_DNA_LOCK_SYSTEM_ID = 'MOVIE_CHARACTER_DNA_LOCK_V1' as const;
export const MOVIE_CHARACTER_DNA_LOCK_PASS_VERDICT = 'PASS_MOVIE_CHARACTER_DNA_LOCK_V1' as const;
export const MOVIE_CHARACTER_DNA_LOCK_FAIL_VERDICT = 'FAIL_MOVIE_CHARACTER_DNA_LOCK_V1' as const;

export const MOVIE_CHARACTER_DNA_LOCK_REPORT_PATH =
  'reports/movie_spatial/MOVIE_CHARACTER_DNA_LOCK_REPORT.json' as const;
export const MOVIE_CHARACTER_DNA_LOCK_SCHEMA_PATH =
  'datasets/movie_spatial/movie-image-app-native-import-v3.schema.json' as const;

export const NATIVE_IMPORT_V3_OUTPUTS = [
  {
    movie_id: 'titanic',
    output_path: 'exports/movie_spatial/titanic-image-app-native-import-v3.json',
  },
  {
    movie_id: 'spirited_away',
    output_path: 'exports/movie_spatial/spirited-away-image-app-native-import-v3.json',
  },
] as const;

export const CHARACTER_DNA_MARKER = '[CHARACTER_DNA]' as const;

export const CHARACTER_DNA_FIELDS = [
  'character_id',
  'display_name_ko',
  'display_name_en',
  'role_type',
  'age_or_type',
  'visual_identity',
  'hair',
  'skin_or_fur',
  'eyes',
  'clothing',
  'height_cm',
  'scenario_usage_rule',
] as const;

export const LOCKED_PRIMARY_CHARACTER_IDS = ['gonegi', 'dana'] as const;

export const CHARACTER_ID_MAP: Record<string, string> = {
  'CHAR-gonagi': 'gonegi',
  'CHAR-dana': 'dana',
  gonagi: 'gonegi',
  dana: 'dana',
};

export const FORBIDDEN_SUMMARIZED_CHARACTER_PATTERNS = [
  /^Gonegi: .+\. .+\. .+\./,
  /^Dana: .+\. .+\. .+\./,
  /active scene character at .+ depth/,
] as const;

export interface CharacterSimpleProfileFull {
  character_id: string;
  display_name_ko: string;
  display_name_en: string;
  role_type: string;
  age_or_type: string;
  visual_identity: string;
  hair: string;
  skin_or_fur: string;
  eyes: string;
  clothing: string;
  height_cm: number;
  scenario_usage_rule: string;
}

export interface CharacterSimpleLibraryFull {
  asset_type: string;
  asset_version: string;
  characters: CharacterSimpleProfileFull[];
}

export interface CharacterDNAChecks {
  full_character_dna_present: boolean;
  character_generated: boolean;
  character_summarized: boolean;
  identity_tokens_present: boolean;
}

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface CharacterDNASlotResult {
  scene_id: string;
  slot_index: number;
  character_length: number;
  active_character_ids: string[];
  checks: CharacterDNAChecks;
  dna_lock_passed: boolean;
}

export interface MovieImageAppNativeImportV3Dataset {
  native_import_id: string;
  phase: typeof MOVIE_CHARACTER_DNA_LOCK_PHASE;
  system_id: typeof MOVIE_CHARACTER_DNA_LOCK_SYSTEM_ID;
  version: 'v3';
  movie_id: string;
  source_spatial_graph_ref: string;
  source_character_library_ref: typeof CHARACTER_SIMPLE_LIBRARY_PATH;
  generated_at: string;
  slot_count: number;
  character_dna_lock: true;
  character_identity_locked: boolean;
  image_app_character_ready: boolean;
  music_drama_import_ready: boolean;
  slots: ImageAppNativeImportSlot[];
  execution_flags: typeof EXECUTION_FLAGS;
}

export interface MovieCharacterDNALockReport {
  report_id: string;
  phase: typeof MOVIE_CHARACTER_DNA_LOCK_PHASE;
  system_id: typeof MOVIE_CHARACTER_DNA_LOCK_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  character_identity_locked: boolean;
  image_app_character_ready: boolean;
  source_character_library_ref: typeof CHARACTER_SIMPLE_LIBRARY_PATH;
  upstream_scenario_hardening_verdict: string;
  checks: {
    full_character_dna_present: boolean;
    character_generated: boolean;
    character_summarized: boolean;
    identity_tokens_present: boolean;
  };
  metrics: {
    movie_count: number;
    scene_count: number;
    locked_slot_count: number;
    average_character_length: number;
    dna_lock_pass_rate: number;
    locked_character_library_count: number;
  };
  movie_summaries: Array<{
    movie_id: string;
    output_path: string;
    slot_count: number;
    dna_lock_pass_count: number;
  }>;
  slot_results_sample: CharacterDNASlotResult[];
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function refForMovie<T extends { movie_id: string; output_path: string }>(
  specs: readonly T[],
  movieId: string
): string {
  const spec = specs.find((entry) => entry.movie_id === movieId);
  if (!spec) throw new Error(`Missing ref spec for movie_id=${movieId}`);
  return spec.output_path;
}

export function resolveCharacterId(characterId: string): string {
  return CHARACTER_ID_MAP[characterId] ?? characterId.replace(/^CHAR-/, '').toLowerCase();
}

export function loadFullCharacterSimpleLibrary(root: string): CharacterSimpleLibraryFull {
  return readJson<CharacterSimpleLibraryFull>(root, CHARACTER_SIMPLE_LIBRARY_PATH);
}

function serializeDnaValue(value: string | number): string {
  return String(value).replace(/\s+/g, ' ').trim();
}

export function serializeFullCharacterDNA(profile: CharacterSimpleProfileFull): string {
  const parts = CHARACTER_DNA_FIELDS.map(
    (field) => `${field}=${serializeDnaValue(profile[field])}`
  );
  return `${CHARACTER_DNA_MARKER} ${parts.join(' ')}`;
}

function selectTimeSettingId(graph: MovieSpatialGraph): string {
  const environment = graph.environment_nodes[0];
  const category = environment?.scene_category?.toLowerCase() ?? '';
  const envType = environment?.environment_type?.toLowerCase() ?? '';

  if (envType.includes('spirit') || category.includes('bath')) return 'blue_hour';
  if (envType.includes('luxury') || category.includes('promenade')) return 'golden_hour';
  if (category.includes('harbor') || category.includes('dock')) return 'morning_sunshine';
  return 'afternoon_work';
}

export function buildLockedCharacterFieldFromGraph(
  graph: MovieSpatialGraph,
  root?: string
): string {
  return copyCanonicalCharacterFieldFromGraph(graph, root);
}

export function detectSummarizedCharacterField(character: string): boolean {
  if (character.includes(CHARACTER_DNA_MARKER)) {
    return false;
  }
  return FORBIDDEN_SUMMARIZED_CHARACTER_PATTERNS.some((pattern) => pattern.test(character));
}

function profileIdentityTokens(profile: CharacterSimpleProfileFull): string[] {
  return [profile.character_id, profile.display_name_en, profile.display_name_ko];
}

function blockHasFullDNA(block: string): boolean {
  return CHARACTER_DNA_FIELDS.every((field) => block.includes(`${field}=`));
}

export function evaluateCharacterDNAChecks(
  graph: MovieSpatialGraph,
  character: string,
  root?: string
): CharacterDNAChecks {
  const projectRoot = root ?? resolveProjectRoot();
  const characterLibrary = loadFullCharacterSimpleLibrary(projectRoot);
  const activeIds = graph.character_nodes.map((node) => resolveCharacterId(node.character_id));
  const blocks = character.split(' || ').filter(Boolean);
  const characterGenerated =
    character.includes('active scene character at') || blocks.length !== activeIds.length;
  const characterSummarized = detectSummarizedCharacterField(character);

  let fullCharacterDnaPresent = blocks.length === activeIds.length;
  let identityTokensPresent = true;

  for (const profileId of activeIds) {
    const profile = characterLibrary.characters.find((entry) => entry.character_id === profileId);
    if (!profile) {
      fullCharacterDnaPresent = false;
      identityTokensPresent = false;
      continue;
    }

    const expectedBlock = serializeFullCharacterDNA(profile);
    const matchingBlock = blocks.find((block) => block.includes(`character_id=${profileId}`));
    if (!matchingBlock || matchingBlock !== expectedBlock || !blockHasFullDNA(matchingBlock)) {
      fullCharacterDnaPresent = false;
    }

    if (!profileIdentityTokens(profile).every((token) => character.includes(token))) {
      identityTokensPresent = false;
    }
  }

  return {
    full_character_dna_present: fullCharacterDnaPresent,
    character_generated: characterGenerated,
    character_summarized: characterSummarized,
    identity_tokens_present: identityTokensPresent,
  };
}

function buildNativeImportV3Slot(
  graph: MovieSpatialGraph,
  spatialScene: MovieSpatialSceneRecord | null,
  canonicalArtStyle: string,
  root: string
): ImageAppNativeImportSlot {
  const timeSettingLibrary = loadTimeSettingLibrary();
  const timeSettingId = selectTimeSettingId(graph);
  const timeSettingEntry =
    timeSettingLibrary.items.find((entry) => entry.time_setting_id === timeSettingId) ??
    timeSettingLibrary.items[0];

  return {
    artStyle: canonicalArtStyle,
    timeSetting: timeSettingEntry.raw_timeSetting,
    scenario: generateHardenedScenarioFromSpatialGraph(graph, spatialScene),
    character: buildLockedCharacterFieldFromGraph(graph, root),
  };
}

function validateCharacterSlot(
  graph: MovieSpatialGraph,
  slot: ImageAppNativeImportSlot,
  root: string
): { issues: ValidationIssue[]; result: CharacterDNASlotResult } {
  const checks = evaluateCharacterDNAChecks(graph, slot.character, root);
  const issues: ValidationIssue[] = [];

  if (!checks.full_character_dna_present) {
    issues.push({
      code: 'FULL_CHARACTER_DNA_MISSING',
      message: `${graph.scene_id}: character field missing full character-simple-v1 DNA blocks`,
      severity: 'error',
    });
  }

  if (checks.character_generated) {
    issues.push({
      code: 'CHARACTER_FIELD_GENERATED',
      message: `${graph.scene_id}: character field contains generated fallback text`,
      severity: 'error',
    });
  }

  if (checks.character_summarized) {
    issues.push({
      code: 'CHARACTER_FIELD_SUMMARIZED',
      message: `${graph.scene_id}: character field uses forbidden summarized assembly`,
      severity: 'error',
    });
  }

  if (!checks.identity_tokens_present) {
    issues.push({
      code: 'IDENTITY_TOKENS_MISSING',
      message: `${graph.scene_id}: character identity tokens missing for active scene characters`,
      severity: 'error',
    });
  }

  const expectedCharacter = buildLockedCharacterFieldFromGraph(graph, root);
  if (slot.character !== expectedCharacter) {
    issues.push({
      code: 'CHARACTER_DNA_EXACT_MISMATCH',
      message: `${graph.scene_id}: character field does not exactly match locked character-simple-v1 DNA serialization`,
      severity: 'error',
    });
  }

  return {
    issues,
    result: {
      scene_id: graph.scene_id,
      slot_index: 0,
      character_length: slot.character.length,
      active_character_ids: graph.character_nodes.map((node) => resolveCharacterId(node.character_id)),
      checks,
      dna_lock_passed: issues.every((issue) => issue.severity !== 'error'),
    },
  };
}

export function buildMovieImageAppNativeImportV3Dataset(
  graphDataset: MovieSpatialGraphDataset,
  engineDataset: MovieSpatialEngineDataset,
  canonicalArtStyle: string,
  root: string
): MovieImageAppNativeImportV3Dataset {
  const spatialSceneById = new Map(
    engineDataset.spatial_scenes.map((scene) => [scene.scene_id, scene])
  );
  const slots = graphDataset.spatial_graphs.map((graph) =>
    buildNativeImportV3Slot(
      graph,
      spatialSceneById.get(graph.scene_id) ?? null,
      canonicalArtStyle,
      root
    )
  );

  const slotResults = graphDataset.spatial_graphs.map((graph, index) =>
    validateCharacterSlot(graph, slots[index], root)
  );
  const allPassed = slotResults.every((entry) => entry.result.dna_lock_passed);

  return {
    native_import_id: `${graphDataset.movie_id}-image-app-native-import-v3`,
    phase: MOVIE_CHARACTER_DNA_LOCK_PHASE,
    system_id: MOVIE_CHARACTER_DNA_LOCK_SYSTEM_ID,
    version: 'v3',
    movie_id: graphDataset.movie_id,
    source_spatial_graph_ref: refForMovie(SPATIAL_GRAPH_OUTPUTS, graphDataset.movie_id),
    source_character_library_ref: CHARACTER_SIMPLE_LIBRARY_PATH,
    generated_at: new Date().toISOString(),
    slot_count: slots.length,
    character_dna_lock: true,
    character_identity_locked: allPassed,
    image_app_character_ready: allPassed,
    music_drama_import_ready: slots.length > 0,
    slots,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function runMovieCharacterDNALockValidation(root: string): MovieCharacterDNALockReport {
  const scenarioHardeningReport = writeMovieScenarioHardeningReport(root);
  const canonicalArtStyle = resolveCanonicalGonegiArtStyle(root).value;
  const characterLibrary = loadFullCharacterSimpleLibrary(root);
  const graphDatasets = loadAllMovieSpatialGraphDatasets(root);
  const engineDatasets = loadAllMovieSpatialEngineDatasets(root);

  const issues: ValidationIssue[] = [];
  const slotResults: CharacterDNASlotResult[] = [];
  const movieSummaries: MovieCharacterDNALockReport['movie_summaries'] = [];
  let totalCharacterLength = 0;
  let lockedSlotCount = 0;
  let dnaLockPassCount = 0;

  for (const spec of NATIVE_IMPORT_V3_OUTPUTS) {
    const graphDataset = graphDatasets.find((entry) => entry.movie_id === spec.movie_id);
    const engineDataset = engineDatasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!graphDataset || !engineDataset) {
      issues.push({
        code: 'SOURCE_DATASET_MISSING',
        message: `Missing spatial graph or engine dataset for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    const dataset = buildMovieImageAppNativeImportV3Dataset(
      graphDataset,
      engineDataset,
      canonicalArtStyle,
      root
    );
    writeJson(root, spec.output_path, dataset);

    let moviePassCount = 0;
    graphDataset.spatial_graphs.forEach((graph, index) => {
      const validation = validateCharacterSlot(graph, dataset.slots[index], root);
      issues.push(...validation.issues);
      slotResults.push({
        ...validation.result,
        scene_id: graph.scene_id,
        slot_index: index,
      });
      totalCharacterLength += dataset.slots[index].character.length;
      lockedSlotCount += 1;
      if (validation.result.dna_lock_passed) {
        dnaLockPassCount += 1;
        moviePassCount += 1;
      }
    });

    movieSummaries.push({
      movie_id: spec.movie_id,
      output_path: spec.output_path,
      slot_count: dataset.slot_count,
      dna_lock_pass_count: moviePassCount,
    });

    if (!dataset.character_identity_locked || !dataset.image_app_character_ready) {
      issues.push({
        code: 'DATASET_CHARACTER_LOCK_FLAG_FALSE',
        message: `${spec.output_path}: character_identity_locked or image_app_character_ready is false`,
        severity: 'error',
      });
    }
  }

  const aggregateChecks = {
    full_character_dna_present: slotResults.every(
      (entry) => entry.checks.full_character_dna_present
    ),
    character_generated: slotResults.some((entry) => entry.checks.character_generated),
    character_summarized: slotResults.some((entry) => entry.checks.character_summarized),
    identity_tokens_present: slotResults.every((entry) => entry.checks.identity_tokens_present),
  };

  const errors = issues.filter((issue) => issue.severity === 'error');
  const dnaLockPassRate =
    lockedSlotCount > 0 ? Math.round((dnaLockPassCount / lockedSlotCount) * 10000) / 10000 : 0;
  const characterIdentityLocked =
    dnaLockPassCount === lockedSlotCount &&
    aggregateChecks.full_character_dna_present &&
    !aggregateChecks.character_generated &&
    !aggregateChecks.character_summarized &&
    aggregateChecks.identity_tokens_present &&
    errors.length === 0;
  const imageAppCharacterReady = characterIdentityLocked;

  const validationPassed =
    characterIdentityLocked &&
    imageAppCharacterReady &&
    scenarioHardeningReport.final_verdict.startsWith('PASS');

  return {
    report_id: `movie_character_dna_lock_report_${Date.now().toString(36)}`,
    phase: MOVIE_CHARACTER_DNA_LOCK_PHASE,
    system_id: MOVIE_CHARACTER_DNA_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? MOVIE_CHARACTER_DNA_LOCK_PASS_VERDICT
      : MOVIE_CHARACTER_DNA_LOCK_FAIL_VERDICT,
    validation_passed: validationPassed,
    character_identity_locked: characterIdentityLocked,
    image_app_character_ready: imageAppCharacterReady,
    source_character_library_ref: CHARACTER_SIMPLE_LIBRARY_PATH,
    upstream_scenario_hardening_verdict: scenarioHardeningReport.final_verdict,
    checks: aggregateChecks,
    metrics: {
      movie_count: movieSummaries.length,
      scene_count: lockedSlotCount,
      locked_slot_count: lockedSlotCount,
      average_character_length:
        lockedSlotCount > 0
          ? Math.round((totalCharacterLength / lockedSlotCount) * 100) / 100
          : 0,
      dna_lock_pass_rate: dnaLockPassRate,
      locked_character_library_count: characterLibrary.characters.length,
    },
    movie_summaries: movieSummaries,
    slot_results_sample: slotResults.slice(0, 3),
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeMovieCharacterDNALockReport(projectRoot?: string): MovieCharacterDNALockReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runMovieCharacterDNALockValidation(root);
  writeJson(root, MOVIE_CHARACTER_DNA_LOCK_REPORT_PATH, report);
  return report;
}

export function loadMovieImageAppNativeImportV3Dataset(
  root: string,
  movieId: string
): MovieImageAppNativeImportV3Dataset | null {
  const spec = NATIVE_IMPORT_V3_OUTPUTS.find((entry) => entry.movie_id === movieId);
  if (!spec) return null;
  const full = path.join(root, spec.output_path);
  if (!fs.existsSync(full)) return null;
  return JSON.parse(fs.readFileSync(full, 'utf8')) as MovieImageAppNativeImportV3Dataset;
}

export { SAFE_CREATE_POLICY };
