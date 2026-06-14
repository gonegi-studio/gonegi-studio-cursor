import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V3_MEDITERRANEAN_PATH,
  BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH,
} from './brainDatasetV3MediterraneanSovereignty.js';
import {
  BRAIN_DATASET_V3_HARBOR_CALIBRATED_PATH,
  BRAIN_DATASET_V3_HARBOR_CALIBRATED_REPORT_PATH,
  HARBOR_CALIBRATION_VERSION,
  topLocationsByBiome,
  writeHarborCalibratedPackage,
  type BrainDatasetV3HarborCalibratedPackage,
} from './brainDatasetV3HarborCalibration.js';
import { MORI_SOURCE_IDS } from './moriGrammarCatalog.js';

export type HarborCalibrationVerdict = 'PASS_FOR_IMAGE_APP_WORLD_TEST' | 'NEEDS_REFINEMENT';

export type HarborCalibrationViolation = {
  code: string;
  message: string;
  field?: string;
};

export type HarborCalibrationReport = {
  auditTimestamp: string;
  final_verdict: HarborCalibrationVerdict;
  calibration_version: typeof HARBOR_CALIBRATION_VERSION;
  source_inputs: {
    mediterranean_package: typeof BRAIN_DATASET_V3_MEDITERRANEAN_PATH;
    mediterranean_report: typeof BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH;
  };
  old_world_balance: BrainDatasetV3HarborCalibratedPackage['world_balance_observed'];
  new_world_balance: BrainDatasetV3HarborCalibratedPackage['world_balance'];
  top_harbor_locations: ReturnType<typeof topLocationsByBiome>;
  top_village_locations: ReturnType<typeof topLocationsByBiome>;
  top_domestic_locations: ReturnType<typeof topLocationsByBiome>;
  top_woodland_locations: ReturnType<typeof topLocationsByBiome>;
  grammar_pattern_counts: BrainDatasetV3HarborCalibratedPackage['grammar_pattern_counts'];
  mori_contribution_retained: boolean;
  behavior_libraries_unchanged: boolean;
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly HarborCalibrationViolation[];
  audit_codes: readonly string[];
};

const BALANCE_RANGES = Object.freeze({
  mediterranean_harbor: { min: 0.35, max: 0.45 },
  mediterranean_village: { min: 0.25, max: 0.3 },
  mediterranean_domestic_life: { min: 0.2, max: 0.25 },
  mediterranean_woodland: { min: 0.05, max: 0.1 },
});

const FORBIDDEN_CHECKS: Array<[readonly string[], string]> = [
  [
    ['image_prompt', 'negative_prompt', 'prompt_intent', 'compiled_image_prompt', 'prompt_compiler'],
    'FAIL_PROMPT_FIELD',
  ],
  [['character_dna', 'dana', 'outfit_key', 'silhouette_key', 'character_key'], 'FAIL_CHARACTER_DNA'],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [['env_dna', 'environment_dna', 'atmosphere_profile', 'dominant_palette'], 'FAIL_ENV_DNA'],
  [['render_rule', 'render_law', 'render_rules', 'renderer_input'], 'FAIL_RENDER_RULE'],
  [['image_generation_payload', 'generation_payload', 'midjourney', 'runway', 'kling'], 'FAIL_IMAGE_GENERATION_PAYLOAD'],
];

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function loadSourcePackage(projectRoot: string): BrainDatasetV3HarborCalibratedPackage {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, BRAIN_DATASET_V3_MEDITERRANEAN_PATH), 'utf8')
  ) as BrainDatasetV3HarborCalibratedPackage;
}

function moriContributionRetained(
  source: BrainDatasetV3HarborCalibratedPackage,
  calibrated: BrainDatasetV3HarborCalibratedPackage
): boolean {
  for (const moriId of MORI_SOURCE_IDS) {
    const sourceHas = JSON.stringify(source).includes(moriId);
    const calibratedHas = JSON.stringify(calibrated).includes(moriId);
    if (sourceHas !== calibratedHas) {
      return false;
    }
  }
  return true;
}

function librariesUnchanged(
  source: BrainDatasetV3HarborCalibratedPackage,
  calibrated: BrainDatasetV3HarborCalibratedPackage
): boolean {
  const libraries = [
    'camera_grammar_library',
    'acting_grammar_library',
    'daily_life_grammar_library',
    'location_grammar_library',
    'object_interaction_grammar_library',
    'extra_actor_grammar_library',
    'animal_grammar_library',
  ] as const;
  for (const library of libraries) {
    if (JSON.stringify(source[library]) !== JSON.stringify(calibrated[library])) {
      return false;
    }
  }
  return true;
}

export function auditHarborCalibration(
  source: BrainDatasetV3HarborCalibratedPackage,
  calibrated: BrainDatasetV3HarborCalibratedPackage
): HarborCalibrationReport {
  const violations: HarborCalibrationViolation[] = [];
  const grammarSerialized = JSON.stringify({
    camera_grammar_library: calibrated.camera_grammar_library,
    acting_grammar_library: calibrated.acting_grammar_library,
    daily_life_grammar_library: calibrated.daily_life_grammar_library,
    location_grammar_library: calibrated.location_grammar_library,
    object_interaction_grammar_library: calibrated.object_interaction_grammar_library,
    extra_actor_grammar_library: calibrated.extra_actor_grammar_library,
    animal_grammar_library: calibrated.animal_grammar_library,
  }).toLowerCase();

  const forbiddenHits: string[] = [];
  for (const [tokens, code] of FORBIDDEN_CHECKS) {
    const hit = containsAny(grammarSerialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({ code, message: `Forbidden token detected: ${hit}` });
    }
  }

  for (const key of Object.keys(BALANCE_RANGES) as Array<keyof typeof BALANCE_RANGES>) {
    const range = BALANCE_RANGES[key];
    const value = calibrated.world_balance[key];
    if (value < range.min || value > range.max) {
      violations.push({
        code: 'FAIL_WORLD_BALANCE_RANGE',
        message: `${key} ${value} outside target ${range.min}-${range.max}`,
        field: key,
      });
    }
  }

  if (!calibrated.harbor_primary_world) {
    violations.push({
      code: 'FAIL_HARBOR_PRIMARY',
      message: 'harbor_primary_world flag is false',
    });
  }

  if (!librariesUnchanged(source, calibrated)) {
    violations.push({
      code: 'FAIL_GRAMMAR_LIBRARY_CHANGED',
      message: 'Grammar libraries were modified during calibration',
    });
  }

  for (const key of Object.keys(source.grammar_pattern_counts) as Array<
    keyof typeof source.grammar_pattern_counts
  >) {
    if (source.grammar_pattern_counts[key] !== calibrated.grammar_pattern_counts[key]) {
      violations.push({
        code: 'FAIL_GRAMMAR_COUNT_REDUCED',
        message: `${key} count changed from ${source.grammar_pattern_counts[key]} to ${calibrated.grammar_pattern_counts[key]}`,
        field: key,
      });
    }
  }

  if (!moriContributionRetained(source, calibrated)) {
    violations.push({
      code: 'FAIL_MORI_CONTRIBUTION',
      message: 'MORI source contribution was lost during calibration',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const final_verdict: HarborCalibrationVerdict =
    violations.length === 0 ? 'PASS_FOR_IMAGE_APP_WORLD_TEST' : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    calibration_version: HARBOR_CALIBRATION_VERSION,
    source_inputs: Object.freeze({
      mediterranean_package: BRAIN_DATASET_V3_MEDITERRANEAN_PATH,
      mediterranean_report: BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH,
    }),
    old_world_balance: calibrated.world_balance_observed,
    new_world_balance: calibrated.world_balance,
    top_harbor_locations: topLocationsByBiome(
      calibrated.location_pattern_priorities,
      'mediterranean_harbor',
      10
    ),
    top_village_locations: topLocationsByBiome(
      calibrated.location_pattern_priorities,
      'mediterranean_village',
      10
    ),
    top_domestic_locations: topLocationsByBiome(
      calibrated.location_pattern_priorities,
      'mediterranean_domestic_life',
      10
    ),
    top_woodland_locations: topLocationsByBiome(
      calibrated.location_pattern_priorities,
      'mediterranean_woodland',
      10
    ),
    grammar_pattern_counts: calibrated.grammar_pattern_counts,
    mori_contribution_retained: moriContributionRetained(source, calibrated),
    behavior_libraries_unchanged: librariesUnchanged(source, calibrated),
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
  });
}

export function runHarborCalibrationAudit(projectRoot: string): HarborCalibrationReport {
  const source = loadSourcePackage(projectRoot);
  const calibrated = writeHarborCalibratedPackage(projectRoot);
  const report = auditHarborCalibration(source, calibrated);
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_HARBOR_CALIBRATED_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
