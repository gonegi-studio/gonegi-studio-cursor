import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V3_MEDITERRANEAN_PATH,
  type BrainDatasetV3MediterraneanPackage,
  type MediterraneanWorldBalance,
} from './brainDatasetV3MediterraneanSovereignty.js';
import type { BrainDatasetV3Pattern } from './brainDatasetV3MoriMergeBuilder.js';
import type { TestKikiLocationGrammar } from './testKikiExtractionSchema.js';

export const BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH =
  'exports/brain-dataset-v3-harbor-calibrated.json' as const;
export const BRAIN_DATASET_V3_HARBOR_CALIBRATED_REPORT_PATH =
  'exports/brain-dataset-v3-harbor-calibrated-report.json' as const;

export const HARBOR_CALIBRATION_VERSION = '104E' as const;

export type HarborCalibrationBiome =
  | 'mediterranean_harbor'
  | 'mediterranean_village'
  | 'mediterranean_domestic_life'
  | 'mediterranean_woodland';

export type LocationPatternPriority = {
  pattern_id: string;
  biome: HarborCalibrationBiome;
  harbor_subtype: string;
  priority_score: number;
  selection_weight: number;
};

export type BrainDatasetV3HarborCalibratedPackage = BrainDatasetV3MediterraneanPackage & {
  calibration_version: typeof HARBOR_CALIBRATION_VERSION;
  world_balance_observed: MediterraneanWorldBalance;
  world_balance: MediterraneanWorldBalance;
  location_pattern_priorities: readonly LocationPatternPriority[];
  harbor_primary_world: true;
};

export const TARGET_WORLD_BALANCE = Object.freeze({
  mediterranean_harbor: 0.4,
  mediterranean_village: 0.27,
  mediterranean_domestic_life: 0.23,
  mediterranean_woodland: 0.07,
});

const HARBOR_SUBTYPE_BY_PATTERN: Readonly<Record<string, string>> = Object.freeze({
  'location-27e15f1a422a': 'harbor-promenade',
  'location-86da13009d72': 'harbor-cargo-area',
  'location-9bea12e2b92f': 'harbor-square',
  'location-ba614f55aa0a': 'harbor-pier',
  'location-00b6f79e9e88': 'harbor-alley',
  'location-87a737fa71b5': 'harbor-market-street',
  'location-1fdc5503109d': 'harbor-square',
  'location-f1f695f231e6': 'harbor-promenade',
  'location-c7307b7771da': 'harbor-alley',
  'location-0a5976daadf1': 'harbor-market',
  'location-6cd7cdf7bcf4': 'harbor-bakery',
  'location-c73e0b4b59fe': 'harbor-residential-district',
  'location-1ed174f3f9cc': 'harbor-residential-district',
  'location-337b00e21706': 'harbor-skyline',
  'location-3dda77981c0e': 'harbor-workshop',
});

function loadMediterraneanPackage(projectRoot: string): BrainDatasetV3MediterraneanPackage {
  const packagePath = path.join(projectRoot, BRAIN_DATASET_V3_MEDITERRANEAN_PATH);
  if (!fs.existsSync(packagePath)) {
    throw new Error(`Missing Mediterranean package at ${BRAIN_DATASET_V3_MEDITERRANEAN_PATH}`);
  }
  return JSON.parse(fs.readFileSync(packagePath, 'utf8')) as BrainDatasetV3MediterraneanPackage;
}

function classifyLocationBiome(
  location: TestKikiLocationGrammar,
  patternId: string
): HarborCalibrationBiome {
  if (HARBOR_SUBTYPE_BY_PATTERN[patternId] !== undefined) {
    return 'mediterranean_harbor';
  }
  if (location.space_type.includes('woodland') || location.space_type.includes('grove')) {
    return 'mediterranean_woodland';
  }
  if (
    location.space_type.includes('domestic') ||
    location.space_type.startsWith('interior-') ||
    location.space_type === 'exterior-courtyard'
  ) {
    return 'mediterranean_domestic_life';
  }
  if (location.space_type.includes('village')) {
    return 'mediterranean_village';
  }
  return 'mediterranean_village';
}

function resolveHarborSubtype(
  patternId: string,
  location: TestKikiLocationGrammar
): string {
  const mapped = HARBOR_SUBTYPE_BY_PATTERN[patternId];
  if (mapped !== undefined) {
    return mapped;
  }
  if (location.space_type.includes('harbor')) {
    return 'harbor-district';
  }
  return 'inland-village';
}

function buildLocationPriorities(
  locations: readonly BrainDatasetV3Pattern<TestKikiLocationGrammar>[]
): readonly LocationPatternPriority[] {
  const classified = locations.map((pattern) => {
    const biome = classifyLocationBiome(pattern, pattern.pattern_id);
    return {
      pattern_id: pattern.pattern_id,
      biome,
      harbor_subtype: resolveHarborSubtype(pattern.pattern_id, pattern),
      location: pattern,
    };
  });

  const biomeCounts = new Map<HarborCalibrationBiome, number>();
  for (const entry of classified) {
    biomeCounts.set(entry.biome, (biomeCounts.get(entry.biome) ?? 0) + 1);
  }

  return Object.freeze(
    classified
      .map((entry) => {
        const biomeTarget =
          TARGET_WORLD_BALANCE[entry.biome as keyof typeof TARGET_WORLD_BALANCE];
        const count = biomeCounts.get(entry.biome) ?? 1;
        const selection_weight = Number((biomeTarget / count).toFixed(6));
        const woodlandDampening = entry.biome === 'mediterranean_woodland' ? 0.65 : 1;
        const harborBoost = entry.biome === 'mediterranean_harbor' ? 1.35 : 1;
        const priority_score = Number(
          (selection_weight * 100 * harborBoost * woodlandDampening).toFixed(4)
        );
        return Object.freeze({
          pattern_id: entry.pattern_id,
          biome: entry.biome,
          harbor_subtype: entry.harbor_subtype,
          priority_score,
          selection_weight,
        });
      })
      .sort((left, right) => right.priority_score - left.priority_score)
  );
}

function aggregateBalanceFromPriorities(
  priorities: readonly LocationPatternPriority[]
): MediterraneanWorldBalance {
  const totals = {
    mediterranean_harbor: 0,
    mediterranean_village: 0,
    mediterranean_domestic_life: 0,
    mediterranean_woodland: 0,
  };
  for (const entry of priorities) {
    totals[entry.biome] += entry.selection_weight;
  }
  const sum =
    totals.mediterranean_harbor +
    totals.mediterranean_village +
    totals.mediterranean_domestic_life +
    totals.mediterranean_woodland;
  return Object.freeze({
    mediterranean_harbor: Number((totals.mediterranean_harbor / sum).toFixed(4)),
    mediterranean_village: Number((totals.mediterranean_village / sum).toFixed(4)),
    mediterranean_domestic_life: Number(
      (totals.mediterranean_domestic_life / sum).toFixed(4)
    ),
    mediterranean_woodland: Number((totals.mediterranean_woodland / sum).toFixed(4)),
  });
}

export function applyHarborWeightCalibration(
  source: BrainDatasetV3MediterraneanPackage
): BrainDatasetV3HarborCalibratedPackage {
  const world_balance_observed = source.world_balance;
  const location_pattern_priorities = buildLocationPriorities(source.location_grammar_library);
  const world_balance = aggregateBalanceFromPriorities(location_pattern_priorities);

  return Object.freeze({
    ...source,
    calibration_version: HARBOR_CALIBRATION_VERSION,
    world_balance_observed,
    world_balance,
    location_pattern_priorities,
    harbor_primary_world: true,
    global_patterns: Object.freeze({
      ...source.global_patterns,
      dominant_space_language: 'mediterranean-harbor-deep-horizon',
    }),
    world_identity: Object.freeze({
      ...source.world_identity,
      world_anchor: 'mediterranean-harbor-town',
      dominant_biomes: Object.freeze([
        'mediterranean-harbor',
        'mediterranean-village',
        'mediterranean-domestic-life',
        'mediterranean-woodland',
      ] as const),
    }),
  });
}

export function writeHarborCalibratedPackage(projectRoot: string): BrainDatasetV3HarborCalibratedPackage {
  const source = loadMediterraneanPackage(projectRoot);
  const packageDoc = applyHarborWeightCalibration(source);
  fs.mkdirSync(path.join(projectRoot, 'exports'), { recursive: true });
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH),
    `${JSON.stringify(packageDoc)}\n`,
    'utf8'
  );
  return packageDoc;
}

export function topLocationsByBiome(
  priorities: readonly LocationPatternPriority[],
  biome: HarborCalibrationBiome,
  limit: number
): readonly LocationPatternPriority[] {
  return Object.freeze(
    priorities.filter((entry) => entry.biome === biome).slice(0, limit)
  );
}
