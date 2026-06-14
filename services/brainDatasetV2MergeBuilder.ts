import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  GHIBLI_01_GRAMMAR_CATALOG_PATH,
  GHIBLI_01_VIDEO_ID,
  type Ghibli01AnimalCandidate,
  type Ghibli01ExtraActorCandidate,
  type Ghibli01GrammarCatalog,
  type Ghibli01ObjectInteractionCandidate,
} from './ghibli01GrammarCatalog.js';
import {
  TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH,
  type TestKikiBrainDatasetPackage,
} from './testKikiBrainDatasetBuilder.js';
import { TEST_KIKI_VIDEO_ID } from './testKikiExtractionSchema.js';
import type {
  TestKikiActingGrammar,
  TestKikiCameraGrammar,
  TestKikiDailyLifeGrammar,
  TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';

export const BRAIN_DATASET_V2_PACKAGE_PATH =
  'exports/brain-dataset-v2-kiki-ghibli01.json' as const;
export const BRAIN_DATASET_V2_REPORT_PATH =
  'exports/brain-dataset-v2-kiki-ghibli01-report.json' as const;

export const BRAIN_DATASET_V2_TYPE = 'brain_dataset_v2' as const;
export const BRAIN_DATASET_V2_VERSION = '102B' as const;

export type BrainDatasetV2SourceRef = typeof TEST_KIKI_VIDEO_ID | typeof GHIBLI_01_VIDEO_ID;

export type BrainDatasetV2Pattern<T extends Record<string, string>> = T & {
  pattern_id: string;
  source_refs: readonly BrainDatasetV2SourceRef[];
};

export type BrainDatasetV2Package = {
  dataset_type: typeof BRAIN_DATASET_V2_TYPE;
  dataset_version: typeof BRAIN_DATASET_V2_VERSION;
  sources: readonly BrainDatasetV2SourceRef[];
  base_dataset_version: string;
  catalog_version: string;
  app_ingestion_targets: readonly string[];
  camera_grammar_library: readonly BrainDatasetV2Pattern<TestKikiCameraGrammar>[];
  acting_grammar_library: readonly BrainDatasetV2Pattern<TestKikiActingGrammar>[];
  daily_life_grammar_library: readonly BrainDatasetV2Pattern<TestKikiDailyLifeGrammar>[];
  location_grammar_library: readonly BrainDatasetV2Pattern<TestKikiLocationGrammar>[];
  object_interaction_grammar_library: readonly BrainDatasetV2Pattern<Ghibli01ObjectInteractionCandidate>[];
  extra_actor_grammar_library: readonly BrainDatasetV2Pattern<Ghibli01ExtraActorCandidate>[];
  animal_grammar_library: readonly BrainDatasetV2Pattern<Ghibli01AnimalCandidate>[];
  global_patterns: TestKikiBrainDatasetPackage['global_patterns'];
  grammar_pattern_counts: {
    camera: number;
    acting: number;
    daily_life: number;
    location: number;
    object_interaction: number;
    extra_actor: number;
    animal: number;
  };
};

export type BrainDatasetV2MergeStats = {
  pre_merge: BrainDatasetV2Package['grammar_pattern_counts'];
  post_merge: BrainDatasetV2Package['grammar_pattern_counts'];
  added: BrainDatasetV2Package['grammar_pattern_counts'];
  deduped: BrainDatasetV2Package['grammar_pattern_counts'];
};

const KIKI_OBJECT_INTERACTION_DERIVED: readonly Ghibli01ObjectInteractionCandidate[] = Object.freeze([
  {
    interaction_type: 'flight-control',
    object_category: 'broom-vehicle',
    grip_style: 'dual-hand-brace',
    interaction_phase: 'steering',
  },
  {
    interaction_type: 'carry',
    object_category: 'personal-prop',
    grip_style: 'single-hand',
    interaction_phase: 'carry',
  },
  {
    interaction_type: 'task',
    object_category: 'work-tool',
    grip_style: 'dual-hand-firm',
    interaction_phase: 'tool-use',
  },
  {
    interaction_type: 'carry',
    object_category: 'delivery-container',
    grip_style: 'two-hand-hold',
    interaction_phase: 'transport',
  },
]);

const GHIBLI_TOUCHPOINT_LOCATIONS: readonly TestKikiLocationGrammar[] = Object.freeze([
  {
    space_type: 'interior-shop',
    architectural_feature: 'oven-hearth',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'counter-service',
  },
  {
    space_type: 'interior-dining',
    architectural_feature: 'table-set',
    depth_cue: 'intimate-close',
    navigation_pattern: 'seated-meal',
  },
  {
    space_type: 'interior-kitchen',
    architectural_feature: 'prep-surface',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'work-station',
  },
  {
    space_type: 'interior-bedroom',
    architectural_feature: 'bed-frame',
    depth_cue: 'intimate-close',
    navigation_pattern: 'rest-static',
  },
  {
    space_type: 'exterior-market',
    architectural_feature: 'stall-canopy',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'browse-path',
  },
  {
    space_type: 'interior-workroom',
    architectural_feature: 'table-loom',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'craft-static',
  },
  {
    space_type: 'exterior-rooftop',
    architectural_feature: 'chimney-cluster',
    depth_cue: 'open-sky',
    navigation_pattern: 'repair-work',
  },
  {
    space_type: 'exterior-courtyard',
    architectural_feature: 'clothes-line',
    depth_cue: 'mid-depth',
    navigation_pattern: 'line-work',
  },
  {
    space_type: 'exterior-street',
    architectural_feature: 'incline-cobble',
    depth_cue: 'deep-alley',
    navigation_pattern: 'steep-ascent',
  },
  {
    space_type: 'exterior-street',
    architectural_feature: 'festival-row',
    depth_cue: 'deep-crowd',
    navigation_pattern: 'gather-circle',
  },
  {
    space_type: 'interior-wash',
    architectural_feature: 'mirror-wall',
    depth_cue: 'intimate-close',
    navigation_pattern: 'groom-static',
  },
  {
    space_type: 'mixed-threshold',
    architectural_feature: 'entry-door',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'greet-entry',
  },
]);

function digestPattern(prefix: string, value: Record<string, string>): string {
  const ordered = Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${value[key]}`)
    .join('|');
  return `${prefix}-${crypto.createHash('sha256').update(ordered).digest('hex').slice(0, 12)}`;
}

function exactKey(value: Record<string, string>): string {
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${value[key]}`)
    .join('|');
}

function dailyLifeNearDupKey(value: TestKikiDailyLifeGrammar): string {
  const activity =
    value.activity === 'transiting'
      ? 'traveling'
      : (value.activity === 'observing' || value.activity === 'waiting') &&
          value.object_interaction === 'none'
        ? 'passive-idle'
        : value.activity;
  return `${activity}|${value.object_interaction}|${value.environmental_touchpoint}`;
}

function actingNearDupKey(value: TestKikiActingGrammar): string {
  if (
    value.posture === 'walking-stride' &&
    value.body_weight_distribution === 'forward-weighted'
  ) {
    return 'walking-stride|forward-weighted';
  }
  return exactKey(value);
}

function locationNearDupKey(value: TestKikiLocationGrammar): string {
  if (value.space_type === 'exterior-harbor' && value.depth_cue === 'deep-horizon') {
    return `exterior-harbor|deep-horizon|${value.navigation_pattern}`;
  }
  return exactKey(value);
}

type MergeAccumulator<T extends Record<string, string>> = {
  patterns: BrainDatasetV2Pattern<T>[];
  exactKeys: Set<string>;
  nearDupKeys: Set<string>;
  added: number;
  deduped: number;
};

function createAccumulator<T extends Record<string, string>>(): MergeAccumulator<T> {
  return {
    patterns: [],
    exactKeys: new Set<string>(),
    nearDupKeys: new Set<string>(),
    added: 0,
    deduped: 0,
  };
}

function addPattern<T extends Record<string, string>>(
  acc: MergeAccumulator<T>,
  prefix: string,
  value: T,
  source: BrainDatasetV2SourceRef,
  nearDupKey: string,
  preservePatternId?: string
): void {
  const exact = exactKey(value);
  const existingIndex = acc.patterns.findIndex((entry) => exactKey(entry) === exact);

  if (existingIndex >= 0) {
    if (source === GHIBLI_01_VIDEO_ID) {
      acc.deduped += 1;
    }
    const existing = acc.patterns[existingIndex];
    if (!existing.source_refs.includes(source)) {
      acc.patterns[existingIndex] = Object.freeze({
        ...existing,
        source_refs: Object.freeze([...existing.source_refs, source]),
      });
    }
    return;
  }

  if (acc.nearDupKeys.has(nearDupKey)) {
    acc.deduped += 1;
    return;
  }

  acc.exactKeys.add(exact);
  acc.nearDupKeys.add(nearDupKey);
  acc.patterns.push(
    Object.freeze({
      pattern_id: preservePatternId ?? digestPattern(prefix, value),
      source_refs: Object.freeze([source]),
      ...value,
    })
  );
  if (source === GHIBLI_01_VIDEO_ID) {
    acc.added += 1;
  }
}

function finalizePatterns<T extends Record<string, string>>(
  acc: MergeAccumulator<T>
): readonly BrainDatasetV2Pattern<T>[] {
  return Object.freeze(
    acc.patterns.sort((left, right) => left.pattern_id.localeCompare(right.pattern_id))
  );
}

function loadKikiPackage(projectRoot: string): TestKikiBrainDatasetPackage {
  const packagePath = path.join(projectRoot, TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing base package at ${TEST_KIKI_BRAIN_DATASET_PACKAGE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as TestKikiBrainDatasetPackage;
}

function loadGhibliCatalog(projectRoot: string): Ghibli01GrammarCatalog {
  const catalogPath = path.join(projectRoot, GHIBLI_01_GRAMMAR_CATALOG_PATH);
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Missing grammar catalog at ${GHIBLI_01_GRAMMAR_CATALOG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as Ghibli01GrammarCatalog;
}

function mergeCamera(
  kiki: TestKikiBrainDatasetPackage,
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<TestKikiCameraGrammar>[]; stats: MergeAccumulator<TestKikiCameraGrammar> } {
  const acc = createAccumulator<TestKikiCameraGrammar>();

  for (const pattern of kiki.camera_grammar_library) {
    const { pattern_id, ...value } = pattern;
    addPattern(acc, 'camera', value, TEST_KIKI_VIDEO_ID, exactKey(value), pattern_id);
  }
  for (const value of ghibli.camera_candidates) {
    addPattern(acc, 'camera', value, GHIBLI_01_VIDEO_ID, exactKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeActing(
  kiki: TestKikiBrainDatasetPackage,
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<TestKikiActingGrammar>[]; stats: MergeAccumulator<TestKikiActingGrammar> } {
  const acc = createAccumulator<TestKikiActingGrammar>();

  for (const pattern of kiki.acting_grammar_library) {
    const { pattern_id, ...value } = pattern;
    addPattern(acc, 'acting', value, TEST_KIKI_VIDEO_ID, actingNearDupKey(value), pattern_id);
  }
  for (const value of ghibli.acting_candidates) {
    addPattern(acc, 'acting', value, GHIBLI_01_VIDEO_ID, actingNearDupKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeDailyLife(
  kiki: TestKikiBrainDatasetPackage,
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<TestKikiDailyLifeGrammar>[]; stats: MergeAccumulator<TestKikiDailyLifeGrammar> } {
  const acc = createAccumulator<TestKikiDailyLifeGrammar>();

  for (const pattern of kiki.daily_life_grammar_library) {
    const { pattern_id, ...value } = pattern;
    addPattern(acc, 'daily-life', value, TEST_KIKI_VIDEO_ID, dailyLifeNearDupKey(value), pattern_id);
  }
  for (const value of ghibli.daily_life_candidates) {
    addPattern(acc, 'daily-life', value, GHIBLI_01_VIDEO_ID, dailyLifeNearDupKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeLocation(
  kiki: TestKikiBrainDatasetPackage,
  ghibliLocations: readonly TestKikiLocationGrammar[]
): { patterns: readonly BrainDatasetV2Pattern<TestKikiLocationGrammar>[]; stats: MergeAccumulator<TestKikiLocationGrammar> } {
  const acc = createAccumulator<TestKikiLocationGrammar>();

  for (const pattern of kiki.location_grammar_library) {
    const { pattern_id, ...value } = pattern;
    addPattern(acc, 'location', value, TEST_KIKI_VIDEO_ID, locationNearDupKey(value), pattern_id);
  }
  for (const value of ghibliLocations) {
    addPattern(acc, 'location', value, GHIBLI_01_VIDEO_ID, locationNearDupKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeObjectInteraction(
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<Ghibli01ObjectInteractionCandidate>[]; stats: MergeAccumulator<Ghibli01ObjectInteractionCandidate> } {
  const acc = createAccumulator<Ghibli01ObjectInteractionCandidate>();

  for (const value of KIKI_OBJECT_INTERACTION_DERIVED) {
    addPattern(acc, 'object-interaction', value, TEST_KIKI_VIDEO_ID, exactKey(value));
  }
  for (const value of ghibli.object_interaction_candidates) {
    addPattern(acc, 'object-interaction', value, GHIBLI_01_VIDEO_ID, exactKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeExtraActor(
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<Ghibli01ExtraActorCandidate>[]; stats: MergeAccumulator<Ghibli01ExtraActorCandidate> } {
  const acc = createAccumulator<Ghibli01ExtraActorCandidate>();

  for (const value of ghibli.extra_actor_candidates) {
    addPattern(acc, 'extra-actor', value, GHIBLI_01_VIDEO_ID, exactKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function mergeAnimal(
  ghibli: Ghibli01GrammarCatalog
): { patterns: readonly BrainDatasetV2Pattern<Ghibli01AnimalCandidate>[]; stats: MergeAccumulator<Ghibli01AnimalCandidate> } {
  const acc = createAccumulator<Ghibli01AnimalCandidate>();

  for (const value of ghibli.animal_candidates) {
    addPattern(acc, 'animal', value, GHIBLI_01_VIDEO_ID, exactKey(value));
  }

  return { patterns: finalizePatterns(acc), stats: acc };
}

function countCategory(
  kiki: TestKikiBrainDatasetPackage,
  ghibli: Ghibli01GrammarCatalog,
  category: keyof BrainDatasetV2Package['grammar_pattern_counts']
): number {
  switch (category) {
    case 'camera':
      return kiki.camera_grammar_library.length + ghibli.camera_candidates.length;
    case 'acting':
      return kiki.acting_grammar_library.length + ghibli.acting_candidates.length;
    case 'daily_life':
      return kiki.daily_life_grammar_library.length + ghibli.daily_life_candidates.length;
    case 'location':
      return kiki.location_grammar_library.length + GHIBLI_TOUCHPOINT_LOCATIONS.length;
    case 'object_interaction':
      return KIKI_OBJECT_INTERACTION_DERIVED.length + ghibli.object_interaction_candidates.length;
    case 'extra_actor':
      return ghibli.extra_actor_candidates.length;
    case 'animal':
      return ghibli.animal_candidates.length;
  }
}

export function buildBrainDatasetV2Package(projectRoot: string): {
  packageDoc: BrainDatasetV2Package;
  mergeStats: BrainDatasetV2MergeStats;
} {
  const kiki = loadKikiPackage(projectRoot);
  const ghibli = loadGhibliCatalog(projectRoot);

  const cameraMerge = mergeCamera(kiki, ghibli);
  const actingMerge = mergeActing(kiki, ghibli);
  const dailyLifeMerge = mergeDailyLife(kiki, ghibli);
  const locationMerge = mergeLocation(kiki, GHIBLI_TOUCHPOINT_LOCATIONS);
  const objectInteractionMerge = mergeObjectInteraction(ghibli);
  const extraActorMerge = mergeExtraActor(ghibli);
  const animalMerge = mergeAnimal(ghibli);

  const grammar_pattern_counts = Object.freeze({
    camera: cameraMerge.patterns.length,
    acting: actingMerge.patterns.length,
    daily_life: dailyLifeMerge.patterns.length,
    location: locationMerge.patterns.length,
    object_interaction: objectInteractionMerge.patterns.length,
    extra_actor: extraActorMerge.patterns.length,
    animal: animalMerge.patterns.length,
  });

  const pre_merge = Object.freeze({
    camera: countCategory(kiki, ghibli, 'camera'),
    acting: countCategory(kiki, ghibli, 'acting'),
    daily_life: countCategory(kiki, ghibli, 'daily_life'),
    location: countCategory(kiki, ghibli, 'location'),
    object_interaction: countCategory(kiki, ghibli, 'object_interaction'),
    extra_actor: countCategory(kiki, ghibli, 'extra_actor'),
    animal: countCategory(kiki, ghibli, 'animal'),
  });

  const added = Object.freeze({
    camera: cameraMerge.stats.added,
    acting: actingMerge.stats.added,
    daily_life: dailyLifeMerge.stats.added,
    location: locationMerge.stats.added,
    object_interaction: objectInteractionMerge.stats.added,
    extra_actor: extraActorMerge.stats.added,
    animal: animalMerge.stats.added,
  });

  const deduped = Object.freeze({
    camera: cameraMerge.stats.deduped,
    acting: actingMerge.stats.deduped,
    daily_life: dailyLifeMerge.stats.deduped,
    location: locationMerge.stats.deduped,
    object_interaction: objectInteractionMerge.stats.deduped,
    extra_actor: extraActorMerge.stats.deduped,
    animal: animalMerge.stats.deduped,
  });

  const packageDoc: BrainDatasetV2Package = Object.freeze({
    dataset_type: BRAIN_DATASET_V2_TYPE,
    dataset_version: BRAIN_DATASET_V2_VERSION,
    sources: Object.freeze([TEST_KIKI_VIDEO_ID, GHIBLI_01_VIDEO_ID]),
    base_dataset_version: kiki.dataset_version,
    catalog_version: ghibli.catalog_version,
    app_ingestion_targets: kiki.app_ingestion_targets,
    camera_grammar_library: cameraMerge.patterns,
    acting_grammar_library: actingMerge.patterns,
    daily_life_grammar_library: dailyLifeMerge.patterns,
    location_grammar_library: locationMerge.patterns,
    object_interaction_grammar_library: objectInteractionMerge.patterns,
    extra_actor_grammar_library: extraActorMerge.patterns,
    animal_grammar_library: animalMerge.patterns,
    global_patterns: kiki.global_patterns,
    grammar_pattern_counts,
  });

  const mergeStats: BrainDatasetV2MergeStats = Object.freeze({
    pre_merge,
    post_merge: grammar_pattern_counts,
    added,
    deduped,
  });

  return { packageDoc, mergeStats };
}

export function writeBrainDatasetV2Package(projectRoot: string): {
  packageDoc: BrainDatasetV2Package;
  mergeStats: BrainDatasetV2MergeStats;
} {
  const result = buildBrainDatasetV2Package(projectRoot);
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V2_PACKAGE_PATH),
    `${JSON.stringify(result.packageDoc)}\n`,
    'utf8'
  );
  return result;
}
