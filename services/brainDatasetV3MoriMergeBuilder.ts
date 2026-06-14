import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V2_REBALANCED_PATH,
  type BrainDatasetV2RebalancedPackage,
  type RebalancedGlobalPatterns,
} from './brainDatasetGlobalRebalance.js';
import {
  MORI_GRAMMAR_CATALOG_PATH,
  MORI_SOURCE_IDS,
  type MoriAnimalCandidate,
  type MoriExtraActorCandidate,
  type MoriGrammarCatalog,
  type MoriObjectInteractionCandidate,
  type MoriSourceId,
} from './moriGrammarCatalog.js';
import { GHIBLI_01_VIDEO_ID } from './ghibli01GrammarCatalog.js';
import { TEST_KIKI_VIDEO_ID } from './testKikiExtractionSchema.js';
import type {
  TestKikiActingGrammar,
  TestKikiCameraGrammar,
  TestKikiDailyLifeGrammar,
  TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';

export const BRAIN_DATASET_V3_PACKAGE_PATH =
  'exports/brain-dataset-v3-mori-integrated.json' as const;
export const BRAIN_DATASET_V3_REPORT_PATH =
  'exports/brain-dataset-v3-mori-integrated-report.json' as const;

export const BRAIN_DATASET_V3_TYPE = 'brain_dataset_v3' as const;
export const BRAIN_DATASET_V3_VERSION = '104B' as const;

export type BrainDatasetV3SourceRef =
  | typeof TEST_KIKI_VIDEO_ID
  | typeof GHIBLI_01_VIDEO_ID
  | MoriSourceId;

export type BrainDatasetV3Pattern<T extends Record<string, string>> = T & {
  pattern_id: string;
  source_refs: readonly BrainDatasetV3SourceRef[];
};

export type BrainDatasetV3Package = {
  dataset_type: typeof BRAIN_DATASET_V3_TYPE;
  dataset_version: typeof BRAIN_DATASET_V3_VERSION;
  sources: readonly BrainDatasetV3SourceRef[];
  base_dataset_version: string;
  catalog_version: string;
  mori_catalog_version: string;
  rebalance_version: string;
  app_ingestion_targets: readonly string[];
  category_weights: BrainDatasetV2RebalancedPackage['category_weights'];
  global_patterns: RebalancedGlobalPatterns;
  pattern_priorities: BrainDatasetV2RebalancedPackage['pattern_priorities'];
  camera_grammar_library: readonly BrainDatasetV3Pattern<TestKikiCameraGrammar>[];
  acting_grammar_library: readonly BrainDatasetV3Pattern<TestKikiActingGrammar>[];
  daily_life_grammar_library: readonly BrainDatasetV3Pattern<TestKikiDailyLifeGrammar>[];
  location_grammar_library: readonly BrainDatasetV3Pattern<TestKikiLocationGrammar>[];
  object_interaction_grammar_library: readonly BrainDatasetV3Pattern<MoriObjectInteractionCandidate>[];
  extra_actor_grammar_library: readonly BrainDatasetV3Pattern<MoriExtraActorCandidate>[];
  animal_grammar_library: readonly BrainDatasetV3Pattern<MoriAnimalCandidate>[];
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

export type BrainDatasetV3MergeStats = {
  pre_merge: BrainDatasetV3Package['grammar_pattern_counts'];
  post_merge: BrainDatasetV3Package['grammar_pattern_counts'];
  added: BrainDatasetV3Package['grammar_pattern_counts'];
  deduped: BrainDatasetV3Package['grammar_pattern_counts'];
  mori_contribution_ratio: BrainDatasetV3Package['grammar_pattern_counts'];
  mori_only_daily_life: number;
  idle_daily_life_count: number;
};

const MORI_SOURCE_SET = new Set<string>(MORI_SOURCE_IDS);

const MORI_TOUCHPOINT_LOCATIONS: readonly TestKikiLocationGrammar[] = Object.freeze([
  {
    space_type: 'exterior-forest',
    architectural_feature: 'root-moss',
    depth_cue: 'dappled-depth',
    navigation_pattern: 'forage-path',
  },
  {
    space_type: 'exterior-creek',
    architectural_feature: 'stone-bank',
    depth_cue: 'shallow-water',
    navigation_pattern: 'wade-cross',
  },
  {
    space_type: 'exterior-shrine',
    architectural_feature: 'torii-gate',
    depth_cue: 'mid-depth',
    navigation_pattern: 'ascend-steps',
  },
  {
    space_type: 'interior-workroom',
    architectural_feature: 'loom-frame',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'weave-static',
  },
  {
    space_type: 'interior-hearth',
    architectural_feature: 'fire-niche',
    depth_cue: 'intimate-close',
    navigation_pattern: 'story-circle',
  },
  {
    space_type: 'exterior-garden',
    architectural_feature: 'plant-bed',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'tend-rows',
  },
  {
    space_type: 'exterior-dock',
    architectural_feature: 'wooden-pier',
    depth_cue: 'water-reflect',
    navigation_pattern: 'ferry-wait',
  },
  {
    space_type: 'exterior-bridge',
    architectural_feature: 'wooden-arch',
    depth_cue: 'valley-depth',
    navigation_pattern: 'cross-flow',
  },
  {
    space_type: 'exterior-field',
    architectural_feature: 'crop-row',
    depth_cue: 'open-flat',
    navigation_pattern: 'sow-walk',
  },
  {
    space_type: 'exterior-village',
    architectural_feature: 'festival-banner',
    depth_cue: 'deep-crowd',
    navigation_pattern: 'square-gather',
  },
  {
    space_type: 'mixed-veranda',
    architectural_feature: 'rain-eave',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'shelter-pause',
  },
  {
    space_type: 'exterior-apiary',
    architectural_feature: 'hive-stand',
    depth_cue: 'mid-depth',
    navigation_pattern: 'harvest-static',
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

function isMoriSource(source: BrainDatasetV3SourceRef): source is MoriSourceId {
  return MORI_SOURCE_SET.has(source);
}

function dailyLifeNearDupKey(value: TestKikiDailyLifeGrammar): string {
  let activity = value.activity;
  if (activity === 'book-reading') {
    activity = 'reading';
  }
  if (activity === 'window-gazing') {
    activity = 'window-watch';
  }
  if (
    (activity === 'cooking' || activity === 'tea-serve' || activity === 'meal-prep') &&
    (value.environmental_touchpoint === 'kitchen-counter' ||
      value.environmental_touchpoint === 'kitchen-hearth' ||
      value.environmental_touchpoint === 'tatami-table')
  ) {
    activity = 'kitchen-prep-cluster';
  }
  if (activity === 'transiting') {
    activity = 'traveling';
  }
  const idleActivities = new Set([
    'observing',
    'waiting',
    'window-watch',
    'listening-outside',
    'resting-break',
    'listening',
    'storytelling',
  ]);
  if (idleActivities.has(activity) && value.object_interaction === 'none') {
    return `idle-cluster|${value.environmental_touchpoint}`;
  }
  if (
    (activity === 'observing' || activity === 'waiting') &&
    value.object_interaction === 'none'
  ) {
    return 'passive-idle|none|shared';
  }
  return `${activity}|${value.object_interaction}|${value.environmental_touchpoint}`;
}

function actingNearDupKey(value: TestKikiActingGrammar): string {
  if (
    value.posture === 'walking-stride' &&
    value.body_weight_distribution === 'forward-weighted'
  ) {
    return 'walking-stride|forward-weighted';
  }
  if (value.posture === 'seated-relaxed' && value.hand_activity === 'cup-hold') {
    return 'seated-relaxed|cup-hold';
  }
  return exactKey(value);
}

function locationNearDupKey(value: TestKikiLocationGrammar): string {
  if (value.space_type === 'exterior-harbor' && value.depth_cue === 'deep-horizon') {
    return `exterior-harbor|deep-horizon|${value.navigation_pattern}`;
  }
  return exactKey(value);
}

function animalNearDupKey(value: MoriAnimalCandidate): string {
  if (value.animal_type === 'cat-companion' || value.animal_type === 'village-cat') {
    return `domestic-cat|${value.movement_state}|${value.framing_weight}`;
  }
  return exactKey(value);
}

function objectInteractionNearDupKey(value: MoriObjectInteractionCandidate): string {
  if (value.interaction_type === 'read' && value.object_category === 'book') {
    return 'read|book|study';
  }
  return exactKey(value);
}

type MergeAccumulator<T extends Record<string, string>> = {
  patterns: BrainDatasetV3Pattern<T>[];
  nearDupKeys: Set<string>;
  added: number;
  deduped: number;
};

function createAccumulator<T extends Record<string, string>>(): MergeAccumulator<T> {
  return { patterns: [], nearDupKeys: new Set<string>(), added: 0, deduped: 0 };
}

function addExistingPatterns<T extends Record<string, string>>(
  acc: MergeAccumulator<T>,
  patterns: readonly BrainDatasetV3Pattern<T>[],
  nearDupFn: (value: T) => string
): void {
  for (const pattern of patterns) {
    const { pattern_id, source_refs, ...rest } = pattern;
    const value = rest as unknown as T;
    const nearDupKey = nearDupFn(value);
    acc.patterns.push(
      Object.freeze({
        pattern_id,
        source_refs: Object.freeze([...source_refs]),
        ...value,
      }) as BrainDatasetV3Pattern<T>
    );
    acc.nearDupKeys.add(nearDupKey);
  }
}

function addMoriPattern<T extends Record<string, string>>(
  acc: MergeAccumulator<T>,
  prefix: string,
  value: T,
  source: MoriSourceId,
  nearDupKey: string
): void {
  const exact = exactKey(value);
  const existingIndex = acc.patterns.findIndex((entry) => exactKey(entry) === exact);

  if (existingIndex >= 0) {
    acc.deduped += 1;
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

  acc.nearDupKeys.add(nearDupKey);
  acc.patterns.push(
    Object.freeze({
      pattern_id: digestPattern(prefix, value),
      source_refs: Object.freeze([source]),
      ...value,
    }) as BrainDatasetV3Pattern<T>
  );
  acc.added += 1;
}

function finalizePatterns<T extends Record<string, string>>(
  acc: MergeAccumulator<T>
): readonly BrainDatasetV3Pattern<T>[] {
  return Object.freeze(
    acc.patterns.sort((left, right) => left.pattern_id.localeCompare(right.pattern_id))
  );
}

function loadV2Rebalanced(projectRoot: string): BrainDatasetV2RebalancedPackage {
  const packagePath = path.join(projectRoot, BRAIN_DATASET_V2_REBALANCED_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing rebalanced v2 package at ${BRAIN_DATASET_V2_REBALANCED_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as BrainDatasetV2RebalancedPackage;
}

function loadMoriCatalog(projectRoot: string): MoriGrammarCatalog {
  const catalogPath = path.join(projectRoot, MORI_GRAMMAR_CATALOG_PATH);
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Missing MORI catalog at ${MORI_GRAMMAR_CATALOG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as MoriGrammarCatalog;
}

function stripSourceSegment<T extends Record<string, string>>(
  candidate: T & { source_segment?: string }
): T {
  const { source_segment: _ignored, ...value } = candidate;
  return value as T;
}

function mergeLibrary<T extends Record<string, string>>(
  prefix: string,
  existing: readonly BrainDatasetV3Pattern<T>[],
  moriCandidates: readonly (T & { source_segment: MoriSourceId })[],
  nearDupFn: (value: T) => string
): { patterns: readonly BrainDatasetV3Pattern<T>[]; stats: MergeAccumulator<T> } {
  const acc = createAccumulator<T>();
  addExistingPatterns(acc, existing, nearDupFn);
  for (const candidate of moriCandidates) {
    const source = candidate.source_segment;
    const value = stripSourceSegment(candidate);
    addMoriPattern(acc, prefix, value, source, nearDupFn(value));
  }
  return { patterns: finalizePatterns(acc), stats: acc };
}

function countMoriContribution(
  patterns: readonly { source_refs: readonly BrainDatasetV3SourceRef[] }[]
): number {
  return patterns.filter((pattern) =>
    pattern.source_refs.some((source) => isMoriSource(source))
  ).length;
}

function moriOnlyCount(
  patterns: readonly { source_refs: readonly BrainDatasetV3SourceRef[] }[]
): number {
  return patterns.filter(
    (pattern) =>
      pattern.source_refs.length > 0 &&
      pattern.source_refs.every((source) => isMoriSource(source))
  ).length;
}

export function buildBrainDatasetV3Package(projectRoot: string): {
  packageDoc: BrainDatasetV3Package;
  mergeStats: BrainDatasetV3MergeStats;
} {
  const v2 = loadV2Rebalanced(projectRoot);
  const mori = loadMoriCatalog(projectRoot);

  const cameraMerge = mergeLibrary(
    'camera',
    v2.camera_grammar_library as readonly BrainDatasetV3Pattern<TestKikiCameraGrammar>[],
    mori.camera_candidates,
    exactKey
  );
  const actingMerge = mergeLibrary(
    'acting',
    v2.acting_grammar_library as readonly BrainDatasetV3Pattern<TestKikiActingGrammar>[],
    mori.acting_candidates,
    actingNearDupKey
  );
  const dailyLifeMerge = mergeLibrary(
    'daily-life',
    v2.daily_life_grammar_library as readonly BrainDatasetV3Pattern<TestKikiDailyLifeGrammar>[],
    mori.daily_life_candidates,
    dailyLifeNearDupKey
  );
  const locationMerge = mergeLibrary(
    'location',
    v2.location_grammar_library as readonly BrainDatasetV3Pattern<TestKikiLocationGrammar>[],
    MORI_TOUCHPOINT_LOCATIONS.map((location) =>
      Object.freeze({ source_segment: 'MORI_02' as const, ...location })
    ),
    locationNearDupKey
  );
  const objectInteractionMerge = mergeLibrary(
    'object-interaction',
    v2.object_interaction_grammar_library as readonly BrainDatasetV3Pattern<MoriObjectInteractionCandidate>[],
    mori.object_interaction_candidates,
    objectInteractionNearDupKey
  );
  const extraActorMerge = mergeLibrary(
    'extra-actor',
    v2.extra_actor_grammar_library as readonly BrainDatasetV3Pattern<MoriExtraActorCandidate>[],
    mori.extra_actor_candidates,
    exactKey
  );
  const animalMerge = mergeLibrary(
    'animal',
    v2.animal_grammar_library as readonly BrainDatasetV3Pattern<MoriAnimalCandidate>[],
    mori.animal_candidates,
    animalNearDupKey
  );

  const grammar_pattern_counts = Object.freeze({
    camera: cameraMerge.patterns.length,
    acting: actingMerge.patterns.length,
    daily_life: dailyLifeMerge.patterns.length,
    location: locationMerge.patterns.length,
    object_interaction: objectInteractionMerge.patterns.length,
    extra_actor: extraActorMerge.patterns.length,
    animal: animalMerge.patterns.length,
  });

  const pre_merge = Object.freeze({ ...v2.grammar_pattern_counts });
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

  const mori_contribution_ratio = Object.freeze({
    camera: Number(
      (countMoriContribution(cameraMerge.patterns) / grammar_pattern_counts.camera).toFixed(4)
    ),
    acting: Number(
      (countMoriContribution(actingMerge.patterns) / grammar_pattern_counts.acting).toFixed(4)
    ),
    daily_life: Number(
      (countMoriContribution(dailyLifeMerge.patterns) / grammar_pattern_counts.daily_life).toFixed(
        4
      )
    ),
    location: Number(
      (countMoriContribution(locationMerge.patterns) / grammar_pattern_counts.location).toFixed(4)
    ),
    object_interaction: Number(
      (
        countMoriContribution(objectInteractionMerge.patterns) /
        grammar_pattern_counts.object_interaction
      ).toFixed(4)
    ),
    extra_actor: Number(
      (countMoriContribution(extraActorMerge.patterns) / grammar_pattern_counts.extra_actor).toFixed(
        4
      )
    ),
    animal: Number(
      (countMoriContribution(animalMerge.patterns) / grammar_pattern_counts.animal).toFixed(4)
    ),
  });

  const packageDoc: BrainDatasetV3Package = Object.freeze({
    dataset_type: BRAIN_DATASET_V3_TYPE,
    dataset_version: BRAIN_DATASET_V3_VERSION,
    sources: Object.freeze([
      TEST_KIKI_VIDEO_ID,
      GHIBLI_01_VIDEO_ID,
      'MORI_01',
      'MORI_02',
      'MORI_03',
    ] as const),
    base_dataset_version: v2.base_dataset_version,
    catalog_version: v2.catalog_version,
    mori_catalog_version: mori.catalog_version,
    rebalance_version: v2.rebalance_version,
    app_ingestion_targets: v2.app_ingestion_targets,
    category_weights: v2.category_weights,
    global_patterns: v2.global_patterns,
    pattern_priorities: v2.pattern_priorities,
    camera_grammar_library: cameraMerge.patterns,
    acting_grammar_library: actingMerge.patterns,
    daily_life_grammar_library: dailyLifeMerge.patterns,
    location_grammar_library: locationMerge.patterns,
    object_interaction_grammar_library: objectInteractionMerge.patterns,
    extra_actor_grammar_library: extraActorMerge.patterns,
    animal_grammar_library: animalMerge.patterns,
    grammar_pattern_counts,
  });

  const mergeStats: BrainDatasetV3MergeStats = Object.freeze({
    pre_merge,
    post_merge: grammar_pattern_counts,
    added,
    deduped,
    mori_contribution_ratio,
    mori_only_daily_life: moriOnlyCount(dailyLifeMerge.patterns),
    idle_daily_life_count: countIdleDailyLifePatterns(dailyLifeMerge.patterns),
  });

  return { packageDoc, mergeStats };
}

export function countIdleDailyLifePatterns(
  patterns: readonly BrainDatasetV3Pattern<TestKikiDailyLifeGrammar>[]
): number {
  const idleActivities = new Set([
    'observing',
    'waiting',
    'window-watch',
    'listening-outside',
    'storytelling',
    'creek-wade',
  ]);
  return patterns.filter(
    (pattern) =>
      idleActivities.has(pattern.activity) && pattern.object_interaction === 'none'
  ).length;
}

export function writeBrainDatasetV3Package(projectRoot: string): {
  packageDoc: BrainDatasetV3Package;
  mergeStats: BrainDatasetV3MergeStats;
} {
  const result = buildBrainDatasetV3Package(projectRoot);
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_PACKAGE_PATH),
    `${JSON.stringify(result.packageDoc)}\n`,
    'utf8'
  );
  return result;
}
