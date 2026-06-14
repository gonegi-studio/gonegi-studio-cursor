import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V3_PACKAGE_PATH,
  type BrainDatasetV3Package,
  type BrainDatasetV3Pattern,
} from './brainDatasetV3MoriMergeBuilder.js';
import type {
  TestKikiDailyLifeGrammar,
  TestKikiLocationGrammar,
} from './testKikiExtractionSchema.js';

export const BRAIN_DATASET_V3_MEDITERRANEAN_PATH =
  'exports/brain-dataset-v3-mediterranean.json' as const;
export const BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH =
  'exports/brain-dataset-v3-mediterranean-report.json' as const;

export const MEDITERRANEAN_SOVEREIGNTY_VERSION = '104D' as const;

export type MediterraneanWorldIdentity = {
  world_era: 'early-1900s';
  world_region: 'mediterranean-harbor-town';
  world_sovereignty: 'GONEGI_MEDITERRANEAN';
  world_anchor: 'mediterranean-harbor-town';
  dominant_biomes: readonly [
    'mediterranean-harbor',
    'mediterranean-village',
    'mediterranean-domestic-life',
    'mediterranean-woodland',
  ];
};

export type MediterraneanWorldBalance = {
  mediterranean_harbor: number;
  mediterranean_village: number;
  mediterranean_domestic_life: number;
  mediterranean_woodland: number;
};

export type MediterraneanWorldConstraints = {
  era_lock: 'early-1900s';
  region_lock: 'mediterranean-harbor-town';
  normalize_cottage_forest_to_mediterranean: true;
  preserve_all_behavior_libraries: true;
  forbidden_world_tokens: readonly string[];
  protected_harbor_identity: true;
};

export type BrainDatasetV3MediterraneanPackage = BrainDatasetV3Package & {
  sovereignty_version: typeof MEDITERRANEAN_SOVEREIGNTY_VERSION;
  world_identity: MediterraneanWorldIdentity;
  world_balance: MediterraneanWorldBalance;
  world_constraints: MediterraneanWorldConstraints;
};

export type MediterraneanNormalizationStats = {
  location_patterns_normalized: number;
  daily_life_touchpoints_normalized: number;
  cottage_forest_tokens_replaced: number;
};

const TOUCHPOINT_NORMALIZATION_MAP: Readonly<Record<string, string>> = Object.freeze({
  'forest-floor': 'olive-grove-floor',
  'forest-trail': 'hillside-path',
  'woodland-path': 'coastal-trail',
  'moss-log': 'stone-wall-rest',
  'shrine-steps': 'chapel-steps',
  'tatami-table': 'courtyard-table',
  'creek-bank': 'spring-bank',
  'veranda-edge': 'terrace-edge',
  'shallow-water': 'spring-shallow',
  'workroom-loom': 'workshop-bench',
  'hearth-circle': 'hearth-courtyard',
  'eave-line': 'terrace-line',
  'porch-seat': 'arcade-seat',
  'wheel-bench': 'pottery-bench',
  'garden-bed': 'herb-terrace-bed',
  'village-square': 'harbor-square',
  'field-row': 'terrace-row',
  'wooden-bridge': 'stone-arch-bridge',
  'evening-path': 'lantern-lane',
  'apiary-stand': 'hillside-apiary',
});

const LOCATION_NORMALIZATION: Readonly<
  Record<string, Partial<TestKikiLocationGrammar>>
> = Object.freeze({
  'exterior-forest|root-moss|dappled-depth|forage-path': {
    space_type: 'mediterranean-woodland',
    architectural_feature: 'olive-trunk',
    depth_cue: 'dappled-grove',
    navigation_pattern: 'grove-path',
  },
  'exterior-shrine|torii-gate|mid-depth|ascend-steps': {
    space_type: 'mediterranean-village',
    architectural_feature: 'chapel-bell-tower',
    depth_cue: 'mid-depth',
    navigation_pattern: 'chapel-approach',
  },
  'exterior-creek|stone-bank|shallow-water|wade-cross': {
    space_type: 'mediterranean-woodland',
    architectural_feature: 'spring-stone',
    depth_cue: 'shallow-spring',
    navigation_pattern: 'spring-cross',
  },
  'mixed-veranda|rain-eave|shallow-layered|shelter-pause': {
    space_type: 'mediterranean-domestic-life',
    architectural_feature: 'terrace-arcade',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'terrace-shelter',
  },
  'interior-hearth|fire-niche|intimate-close|story-circle': {
    space_type: 'mediterranean-domestic-life',
    architectural_feature: 'hearth-arch',
    depth_cue: 'intimate-close',
    navigation_pattern: 'hearth-gather',
  },
  'exterior-garden|plant-bed|shallow-layered|tend-rows': {
    space_type: 'mediterranean-domestic-life',
    architectural_feature: 'herb-terrace',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'terrace-tend',
  },
  'exterior-village|festival-banner|deep-crowd|square-gather': {
    space_type: 'mediterranean-village',
    architectural_feature: 'festival-banner',
    depth_cue: 'deep-plaza',
    navigation_pattern: 'square-gather',
  },
  'exterior-bridge|wooden-arch|valley-depth|cross-flow': {
    space_type: 'mediterranean-village',
    architectural_feature: 'stone-arch',
    depth_cue: 'valley-depth',
    navigation_pattern: 'bridge-cross',
  },
  'exterior-apiary|hive-stand|mid-depth|harvest-static': {
    space_type: 'mediterranean-woodland',
    architectural_feature: 'hillside-hive',
    depth_cue: 'mid-depth',
    navigation_pattern: 'apiary-harvest',
  },
  'exterior-field|crop-row|open-flat|sow-walk': {
    space_type: 'mediterranean-village',
    architectural_feature: 'terrace-crop',
    depth_cue: 'open-terrace',
    navigation_pattern: 'terrace-sow',
  },
  'interior-workroom|loom-frame|shallow-layered|weave-static': {
    space_type: 'mediterranean-domestic-life',
    architectural_feature: 'loom-frame',
    depth_cue: 'shallow-layered',
    navigation_pattern: 'craft-static',
  },
  'exterior-dock|wooden-pier|water-reflect|ferry-wait': {
    space_type: 'mediterranean-harbor',
    architectural_feature: 'stone-pier',
    depth_cue: 'water-reflect',
    navigation_pattern: 'ferry-wait',
  },
});

const HARBOR_SPACE_TYPES = new Set([
  'exterior-harbor',
  'mediterranean-harbor',
  'exterior-dock',
]);

const COTTAGE_FOREST_TOKENS = [
  'exterior-forest',
  'forest-floor',
  'forest-trail',
  'woodland-path',
  'torii-gate',
  'torii',
  'tatami',
  'exterior-shrine',
  'mixed-veranda',
  'moss-log',
  'creek-bank',
  'cottage',
  'japanese',
] as const;

function locationKey(location: TestKikiLocationGrammar): string {
  return `${location.space_type}|${location.architectural_feature}|${location.depth_cue}|${location.navigation_pattern}`;
}

function normalizeTouchpoint(touchpoint: string): { value: string; changed: boolean } {
  const mapped = TOUCHPOINT_NORMALIZATION_MAP[touchpoint];
  if (mapped !== undefined && mapped !== touchpoint) {
    return { value: mapped, changed: true };
  }
  return { value: touchpoint, changed: false };
}

function normalizeLocation(
  location: TestKikiLocationGrammar
): { value: TestKikiLocationGrammar; changed: boolean } {
  const key = locationKey(location);
  const mapped = LOCATION_NORMALIZATION[key];
  if (mapped !== undefined) {
    return {
      value: Object.freeze({ ...location, ...mapped }),
      changed: true,
    };
  }

  let changed = false;
  const next = { ...location };

  if (next.space_type === 'exterior-forest') {
    next.space_type = 'mediterranean-woodland';
    changed = true;
  }
  if (next.space_type === 'exterior-shrine') {
    next.space_type = 'mediterranean-village';
    changed = true;
  }
  if (next.space_type === 'exterior-creek') {
    next.space_type = 'mediterranean-woodland';
    changed = true;
  }
  if (next.space_type === 'mixed-veranda') {
    next.space_type = 'mediterranean-domestic-life';
    changed = true;
  }
  if (next.space_type === 'interior-hearth') {
    next.space_type = 'mediterranean-domestic-life';
    changed = true;
  }
  if (next.architectural_feature === 'torii-gate') {
    next.architectural_feature = 'chapel-bell-tower';
    changed = true;
  }
  if (next.space_type === 'exterior-harbor') {
    next.space_type = 'mediterranean-harbor';
    changed = true;
  }
  if (next.space_type === 'exterior-dock') {
    next.space_type = 'mediterranean-harbor';
    changed = true;
  }

  return { value: Object.freeze(next), changed };
}

function classifyLocationBiome(location: TestKikiLocationGrammar): keyof MediterraneanWorldBalance {
  if (
    location.space_type.includes('harbor') ||
    location.space_type === 'exterior-dock' ||
    location.navigation_pattern.includes('ferry')
  ) {
    return 'mediterranean_harbor';
  }
  if (
    location.space_type.includes('woodland') ||
    location.space_type.includes('forest') ||
    location.space_type.includes('grove') ||
    location.space_type.includes('apiary')
  ) {
    return 'mediterranean_woodland';
  }
  if (
    location.space_type.includes('domestic') ||
    location.space_type.startsWith('interior-') ||
    location.space_type.includes('hearth') ||
    location.space_type.includes('kitchen') ||
    location.space_type.includes('bedroom') ||
    location.space_type.includes('dining') ||
    location.space_type.includes('wash')
  ) {
    return 'mediterranean_domestic_life';
  }
  return 'mediterranean_village';
}

function computeWorldBalance(
  locations: readonly TestKikiLocationGrammar[]
): MediterraneanWorldBalance {
  const counts = {
    mediterranean_harbor: 0,
    mediterranean_village: 0,
    mediterranean_domestic_life: 0,
    mediterranean_woodland: 0,
  };
  for (const location of locations) {
    counts[classifyLocationBiome(location)] += 1;
  }
  const total = locations.length || 1;
  return Object.freeze({
    mediterranean_harbor: Number((counts.mediterranean_harbor / total).toFixed(4)),
    mediterranean_village: Number((counts.mediterranean_village / total).toFixed(4)),
    mediterranean_domestic_life: Number(
      (counts.mediterranean_domestic_life / total).toFixed(4)
    ),
    mediterranean_woodland: Number((counts.mediterranean_woodland / total).toFixed(4)),
  });
}

function recomputeDominantSpaceLanguage(
  locations: readonly TestKikiLocationGrammar[]
): string {
  const totals = new Map<string, number>();
  for (const location of locations) {
    const key = `${location.space_type}-${location.depth_cue}`;
    totals.set(key, (totals.get(key) ?? 0) + 1);
  }
  let winner = 'mediterranean-harbor-deep-horizon';
  let winnerCount = -1;
  for (const [key, count] of totals) {
    if (count > winnerCount) {
      winner = key;
      winnerCount = count;
    }
  }
  return winner;
}

function loadV3Package(projectRoot: string): BrainDatasetV3Package {
  const packagePath = path.join(projectRoot, BRAIN_DATASET_V3_PACKAGE_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing v3 package at ${BRAIN_DATASET_V3_PACKAGE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as BrainDatasetV3Package;
}

export function applyMediterraneanWorldSovereignty(
  source: BrainDatasetV3Package
): {
  packageDoc: BrainDatasetV3MediterraneanPackage;
  normalizationStats: MediterraneanNormalizationStats;
} {
  let locationNormalized = 0;
  let touchpointNormalized = 0;
  let cottageForestReplaced = 0;

  const location_grammar_library = Object.freeze(
    source.location_grammar_library.map((pattern) => {
      const { pattern_id, source_refs, ...location } = pattern;
      const { value, changed } = normalizeLocation(location);
      if (changed) {
        locationNormalized += 1;
      }
      const serialized = JSON.stringify(location).toLowerCase();
      for (const token of COTTAGE_FOREST_TOKENS) {
        if (serialized.includes(token)) {
          cottageForestReplaced += 1;
          break;
        }
      }
      const serializedAfter = JSON.stringify(value).toLowerCase();
      for (const token of COTTAGE_FOREST_TOKENS) {
        if (serialized.includes(token) && !serializedAfter.includes(token)) {
          break;
        }
      }
      return Object.freeze({
        pattern_id,
        source_refs,
        ...value,
      });
    })
  ) as readonly BrainDatasetV3Pattern<TestKikiLocationGrammar>[];

  const daily_life_grammar_library = Object.freeze(
    source.daily_life_grammar_library.map((pattern) => {
      const { pattern_id, source_refs, activity, object_interaction, environmental_touchpoint } =
        pattern;
      const normalized = normalizeTouchpoint(environmental_touchpoint);
      if (normalized.changed) {
        touchpointNormalized += 1;
      }
      const before = environmental_touchpoint.toLowerCase();
      const after = normalized.value.toLowerCase();
      for (const token of COTTAGE_FOREST_TOKENS) {
        if (before.includes(token) && !after.includes(token)) {
          cottageForestReplaced += 1;
          break;
        }
      }
      return Object.freeze({
        pattern_id,
        source_refs,
        activity,
        object_interaction,
        environmental_touchpoint: normalized.value,
      });
    })
  ) as readonly BrainDatasetV3Pattern<TestKikiDailyLifeGrammar>[];

  const normalizedLocations = location_grammar_library.map(
    ({ space_type, architectural_feature, depth_cue, navigation_pattern }) =>
      Object.freeze({ space_type, architectural_feature, depth_cue, navigation_pattern })
  );

  const world_balance = computeWorldBalance(normalizedLocations);
  const dominant_space_language = recomputeDominantSpaceLanguage(normalizedLocations);

  const packageDoc: BrainDatasetV3MediterraneanPackage = Object.freeze({
    ...source,
    sovereignty_version: MEDITERRANEAN_SOVEREIGNTY_VERSION,
    location_grammar_library,
    daily_life_grammar_library,
    global_patterns: Object.freeze({
      ...source.global_patterns,
      dominant_space_language,
    }),
    world_identity: Object.freeze({
      world_era: 'early-1900s',
      world_region: 'mediterranean-harbor-town',
      world_sovereignty: 'GONEGI_MEDITERRANEAN',
      world_anchor: 'mediterranean-harbor-town',
      dominant_biomes: Object.freeze([
        'mediterranean-harbor',
        'mediterranean-village',
        'mediterranean-domestic-life',
        'mediterranean-woodland',
      ] as const),
    }),
    world_balance,
    world_constraints: Object.freeze({
      era_lock: 'early-1900s',
      region_lock: 'mediterranean-harbor-town',
      normalize_cottage_forest_to_mediterranean: true,
      preserve_all_behavior_libraries: true,
      forbidden_world_tokens: Object.freeze([
        'subway',
        'airport',
        'skyscraper',
        'neon_city',
        'cyberpunk',
        'torii',
        'tatami',
        'forest-floor',
        'woodland-path',
      ]),
      protected_harbor_identity: true,
    }),
  });

  return {
    packageDoc,
    normalizationStats: Object.freeze({
      location_patterns_normalized: locationNormalized,
      daily_life_touchpoints_normalized: touchpointNormalized,
      cottage_forest_tokens_replaced: cottageForestReplaced,
    }),
  };
}

export function writeBrainDatasetV3Mediterranean(projectRoot: string): {
  packageDoc: BrainDatasetV3MediterraneanPackage;
  normalizationStats: MediterraneanNormalizationStats;
} {
  const source = loadV3Package(projectRoot);
  const result = applyMediterraneanWorldSovereignty(source);
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_MEDITERRANEAN_PATH),
    `${JSON.stringify(result.packageDoc)}\n`,
    'utf8'
  );
  return result;
}

export function countHarborLocations(
  locations: readonly TestKikiLocationGrammar[]
): number {
  return locations.filter(
    (location) =>
      location.space_type.includes('harbor') ||
      HARBOR_SPACE_TYPES.has(location.space_type) ||
      location.navigation_pattern.includes('ferry') ||
      location.navigation_pattern.includes('corridor-flow') ||
      location.depth_cue.includes('horizon')
  ).length;
}

export function scanRemainingCottageForestTokens(serialized: string): string[] {
  const hits: string[] = [];
  for (const token of COTTAGE_FOREST_TOKENS) {
    if (serialized.includes(token)) {
      hits.push(token);
    }
  }
  return hits;
}
