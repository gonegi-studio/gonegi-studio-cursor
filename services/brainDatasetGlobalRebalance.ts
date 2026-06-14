import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V2_PACKAGE_PATH,
  type BrainDatasetV2Package,
  type BrainDatasetV2Pattern,
} from './brainDatasetV2MergeBuilder.js';
import type {
  TestKikiActingGrammar,
  TestKikiCameraGrammar,
  TestKikiDailyLifeGrammar,
  TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';
import type {
  Ghibli01AnimalCandidate,
  Ghibli01ExtraActorCandidate,
  Ghibli01ObjectInteractionCandidate,
} from './ghibli01GrammarCatalog.js';

export const BRAIN_DATASET_V2_REBALANCED_PATH =
  'exports/brain-dataset-v2-rebalanced.json' as const;
export const BRAIN_DATASET_V2_REBALANCED_REPORT_PATH =
  'exports/brain-dataset-v2-rebalanced-report.json' as const;

export const BRAIN_DATASET_REBALANCE_VERSION = '103' as const;

export const TARGET_CATEGORY_WEIGHTS = Object.freeze({
  camera: 0.2,
  acting: 0.2,
  daily_life: 0.25,
  object_interaction: 0.2,
  location: 0.1,
  extra_actor: 0.03,
  animal: 0.02,
});

export type RebalancedGlobalPatterns = {
  dominant_camera_language: string;
  dominant_acting_language: string;
  dominant_daily_life_language: string;
  dominant_space_language: string;
  dominant_object_interaction_language: string;
  dominant_extra_actor_language: string;
  dominant_animal_language: string;
};

export type PatternPriorityEntry = {
  pattern_id: string;
  priority_score: number;
  tier: 'high' | 'medium' | 'low';
};

export type BrainDatasetV2RebalancedPackage = BrainDatasetV2Package & {
  rebalance_version: typeof BRAIN_DATASET_REBALANCE_VERSION;
  category_weights: typeof TARGET_CATEGORY_WEIGHTS;
  global_patterns: RebalancedGlobalPatterns;
  pattern_priorities: {
    daily_life: readonly PatternPriorityEntry[];
    object_interaction: readonly PatternPriorityEntry[];
    extra_actor: readonly PatternPriorityEntry[];
    animal: readonly PatternPriorityEntry[];
  };
};

const HIGH_DAILY_LIFE_ACTIVITIES = new Set([
  'baking',
  'cooking',
  'serving',
  'repairing',
  'letter-writing',
  'shopping',
  'reading',
  'laundry',
  'delivering',
  'arrival-greet',
]);

const MEDIUM_DAILY_LIFE_ACTIVITIES = new Set(['waiting', 'resting-break', 'window-watch']);

const KIKI_DOMINANCE_TOKENS = new Set([
  'observing',
  'traveling',
  'transiting',
  'window-watch',
  'deep-horizon',
  'ground-stand',
]);

const EXTRA_ACTOR_BOOST_ROLES = new Set([
  'friend-peer',
  'shopkeeper',
  'delivery-customer',
  'family-elder',
  'elder-mentor',
  'street-vendor',
]);

const ANIMAL_BOOST_TYPES = new Set(['cat-companion', 'seagull', 'bird-flock']);

const PRODUCTIVE_OBJECT_INTERACTION_TYPES = new Set([
  'serve',
  'prepare',
  'consume',
  'read',
  'write',
  'repair',
  'stitch',
  'shop',
  'receive',
  'offer',
  'pack',
]);

function loadBrainDatasetV2(projectRoot: string): BrainDatasetV2Package {
  const packagePath = path.join(projectRoot, BRAIN_DATASET_V2_PACKAGE_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing Brain Dataset v2 at ${BRAIN_DATASET_V2_PACKAGE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as BrainDatasetV2Package;
}

function weightedMode(entries: ReadonlyArray<readonly [string, number]>): string {
  const totals = new Map<string, number>();
  for (const [key, weight] of entries) {
    totals.set(key, (totals.get(key) ?? 0) + weight);
  }
  let winner = entries[0]?.[0] ?? 'unknown';
  let winnerWeight = -1;
  for (const [key, weight] of totals) {
    if (weight > winnerWeight) {
      winner = key;
      winnerWeight = weight;
    }
  }
  return winner;
}

function scoreDailyLife(pattern: BrainDatasetV2Pattern<TestKikiDailyLifeGrammar>): {
  score: number;
  tier: PatternPriorityEntry['tier'];
} {
  let score = 1;
  let tier: PatternPriorityEntry['tier'] = 'low';

  if (HIGH_DAILY_LIFE_ACTIVITIES.has(pattern.activity)) {
    score = 3;
    tier = 'high';
  } else if (MEDIUM_DAILY_LIFE_ACTIVITIES.has(pattern.activity)) {
    score = 2;
    tier = 'medium';
  } else if (pattern.activity === 'observing') {
    score = 0.4;
    tier = 'low';
  }

  if (pattern.object_interaction === 'none') {
    score *= 0.55;
    if (tier === 'high') {
      tier = 'medium';
    }
  }

  if (KIKI_DOMINANCE_TOKENS.has(pattern.activity)) {
    score *= 0.35;
  }
  if (KIKI_DOMINANCE_TOKENS.has(pattern.environmental_touchpoint)) {
    score *= 0.45;
  }

  if (
    pattern.source_refs.includes('GHIBLI_01') &&
    HIGH_DAILY_LIFE_ACTIVITIES.has(pattern.activity)
  ) {
    score *= 1.25;
  }

  return { score, tier };
}

function scoreObjectInteraction(
  pattern: BrainDatasetV2Pattern<Ghibli01ObjectInteractionCandidate>
): number {
  let score = 1;
  if (PRODUCTIVE_OBJECT_INTERACTION_TYPES.has(pattern.interaction_type)) {
    score = 2.8;
  }
  if (pattern.interaction_type === 'flight-control') {
    score *= 0.6;
  }
  if (pattern.source_refs.includes('GHIBLI_01')) {
    score *= 1.15;
  }
  return score;
}

function scoreExtraActor(
  pattern: BrainDatasetV2Pattern<Ghibli01ExtraActorCandidate>
): number {
  if (pattern.actor_role === 'crowd-extra') {
    return 0.4;
  }
  if (EXTRA_ACTOR_BOOST_ROLES.has(pattern.actor_role)) {
    return 3.2;
  }
  if (pattern.actor_role === 'rival-peer') {
    return 1.5;
  }
  return 1;
}

function scoreAnimal(pattern: BrainDatasetV2Pattern<Ghibli01AnimalCandidate>): number {
  if (pattern.animal_type === 'insect-detail') {
    return 0.25;
  }
  if (ANIMAL_BOOST_TYPES.has(pattern.animal_type)) {
    return 2.8;
  }
  return 1.2;
}

function scoreCamera(pattern: BrainDatasetV2Pattern<TestKikiCameraGrammar>): number {
  let score = 1;
  const productiveFraming = new Set([
    'dialogue-pair',
    'counter-exchange',
    'work-surface',
    'interior-walkthrough',
    'reaction-close',
  ]);
  if (productiveFraming.has(pattern.framing_type)) {
    score = 2.5;
  }
  if (pattern.framing_type === 'establishing-wide' && pattern.camera_distance === 'wide') {
    score *= 0.55;
  }
  return score;
}

function scoreActing(pattern: BrainDatasetV2Pattern<TestKikiActingGrammar>): number {
  let score = 1;
  const productivePostures = new Set([
    'standing-work',
    'standing-conversation',
    'seated-relaxed',
    'seated-attentive',
    'walking-pair',
    'kneeling-pack',
  ]);
  if (productivePostures.has(pattern.posture)) {
    score = 2.6;
  }
  if (
    pattern.gaze_direction === 'toward-horizon' &&
    pattern.posture === 'upright-neutral'
  ) {
    score *= 0.35;
  }
  if (pattern.gaze_direction === 'mutual-eye-contact') {
    score *= 1.4;
  }
  return score;
}

function scoreLocation(pattern: BrainDatasetV2Pattern<TestKikiLocationGrammar>): number {
  let score = 1;
  const productiveSpaces = new Set([
    'interior-shop',
    'interior-kitchen',
    'interior-dining',
    'interior-workroom',
    'exterior-market',
    'mixed-threshold',
  ]);
  if (productiveSpaces.has(pattern.space_type)) {
    score = 2.8;
  }
  if (pattern.space_type === 'exterior-harbor' && pattern.depth_cue === 'deep-horizon') {
    score *= 0.35;
  }
  if (pattern.navigation_pattern === 'gather-circle') {
    score *= 1.3;
  }
  return score;
}

function buildPatternPriorities<T extends Record<string, string>>(
  patterns: readonly BrainDatasetV2Pattern<T>[],
  scoreFn: (pattern: BrainDatasetV2Pattern<T>) => number | { score: number; tier: PatternPriorityEntry['tier'] }
): readonly PatternPriorityEntry[] {
  return Object.freeze(
    patterns
      .map((pattern) => {
        const result = scoreFn(pattern);
        const priority_score = typeof result === 'number' ? result : result.score;
        const tier = typeof result === 'number' ? ('medium' as const) : result.tier;
        return Object.freeze({
          pattern_id: pattern.pattern_id,
          priority_score: Number(priority_score.toFixed(4)),
          tier,
        });
      })
      .sort((left, right) => right.priority_score - left.priority_score)
  );
}

export function recomputeGlobalPatterns(
  packageDoc: BrainDatasetV2Package
): RebalancedGlobalPatterns {
  const cameraEntries = packageDoc.camera_grammar_library.map((pattern) =>
    [
      `${pattern.camera_distance}-${pattern.framing_type}`,
      scoreCamera(pattern),
    ] as const
  );
  const actingEntries = packageDoc.acting_grammar_library.map((pattern) =>
    [
      `${pattern.gaze_direction}-${pattern.posture}`,
      scoreActing(pattern),
    ] as const
  );
  const dailyLifeEntries = packageDoc.daily_life_grammar_library.map((pattern) => {
    const { score } = scoreDailyLife(pattern);
    return [`${pattern.activity}-${pattern.object_interaction}`, score] as const;
  });
  const locationEntries = packageDoc.location_grammar_library.map((pattern) =>
    [
      `${pattern.space_type}-${pattern.depth_cue}`,
      scoreLocation(pattern),
    ] as const
  );
  const objectInteractionEntries = packageDoc.object_interaction_grammar_library.map(
    (pattern) =>
      [
        `${pattern.interaction_type}-${pattern.object_category}`,
        scoreObjectInteraction(pattern),
      ] as const
  );
  const extraActorEntries = packageDoc.extra_actor_grammar_library.map((pattern) =>
    [
      `${pattern.actor_role}-${pattern.activity_involvement}`,
      scoreExtraActor(pattern),
    ] as const
  );
  const animalEntries = packageDoc.animal_grammar_library.map((pattern) =>
    [
      `${pattern.animal_type}-${pattern.movement_state}`,
      scoreAnimal(pattern),
    ] as const
  );

  return Object.freeze({
    dominant_camera_language: weightedMode(cameraEntries),
    dominant_acting_language: weightedMode(actingEntries),
    dominant_daily_life_language: weightedMode(dailyLifeEntries),
    dominant_space_language: weightedMode(locationEntries),
    dominant_object_interaction_language: weightedMode(objectInteractionEntries),
    dominant_extra_actor_language: weightedMode(extraActorEntries),
    dominant_animal_language: weightedMode(animalEntries),
  });
}

export function buildBrainDatasetV2Rebalanced(
  projectRoot: string
): BrainDatasetV2RebalancedPackage {
  const source = loadBrainDatasetV2(projectRoot);
  const global_patterns = recomputeGlobalPatterns(source);

  const dailyLifePriorities = buildPatternPriorities(
    source.daily_life_grammar_library,
    scoreDailyLife
  );
  const objectInteractionPriorities = buildPatternPriorities(
    source.object_interaction_grammar_library,
    (pattern) => scoreObjectInteraction(pattern)
  );
  const extraActorPriorities = buildPatternPriorities(
    source.extra_actor_grammar_library,
    (pattern) => scoreExtraActor(pattern)
  );
  const animalPriorities = buildPatternPriorities(
    source.animal_grammar_library,
    (pattern) => scoreAnimal(pattern)
  );

  return Object.freeze({
    ...source,
    rebalance_version: BRAIN_DATASET_REBALANCE_VERSION,
    category_weights: TARGET_CATEGORY_WEIGHTS,
    global_patterns,
    pattern_priorities: Object.freeze({
      daily_life: dailyLifePriorities,
      object_interaction: objectInteractionPriorities,
      extra_actor: extraActorPriorities,
      animal: animalPriorities,
    }),
  });
}

export function writeBrainDatasetV2Rebalanced(
  projectRoot: string
): BrainDatasetV2RebalancedPackage {
  const rebalanced = buildBrainDatasetV2Rebalanced(projectRoot);
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V2_REBALANCED_PATH),
    `${JSON.stringify(rebalanced)}\n`,
    'utf8'
  );
  return rebalanced;
}

export function summarizeWeightTotals(packageDoc: BrainDatasetV2RebalancedPackage): {
  idle_daily_life_weight: number;
  productive_daily_life_weight: number;
  extra_actor_effective_weight: number;
  animal_effective_weight: number;
} {
  let idle = 0;
  let productive = 0;
  for (const pattern of packageDoc.daily_life_grammar_library) {
    const { score } = scoreDailyLife(pattern);
    const isIdle =
      pattern.object_interaction === 'none' ||
      pattern.activity === 'observing' ||
      pattern.activity === 'window-watch';
    if (isIdle) {
      idle += score;
    } else if (HIGH_DAILY_LIFE_ACTIVITIES.has(pattern.activity)) {
      productive += score;
    }
  }

  const extraActorTotal = packageDoc.extra_actor_grammar_library.reduce(
    (sum, pattern) => sum + scoreExtraActor(pattern),
    0
  );
  const animalTotal = packageDoc.animal_grammar_library.reduce(
    (sum, pattern) => sum + scoreAnimal(pattern),
    0
  );
  const libraryTotal =
    packageDoc.camera_grammar_library.length +
    packageDoc.acting_grammar_library.length +
    packageDoc.daily_life_grammar_library.length +
    packageDoc.object_interaction_grammar_library.length +
    packageDoc.location_grammar_library.length +
    packageDoc.extra_actor_grammar_library.length +
    packageDoc.animal_grammar_library.length;

  return {
    idle_daily_life_weight: Number(idle.toFixed(4)),
    productive_daily_life_weight: Number(productive.toFixed(4)),
    extra_actor_effective_weight: Number((extraActorTotal / libraryTotal).toFixed(4)),
    animal_effective_weight: Number((animalTotal / libraryTotal).toFixed(4)),
  };
}
