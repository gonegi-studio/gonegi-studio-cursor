import fs from 'node:fs';
import path from 'node:path';
import { BRAIN_DATASET_V3_PACKAGE_PATH } from './brainDatasetV3MoriMergeBuilder.js';
import {
  BRAIN_DATASET_V3_MEDITERRANEAN_PATH,
  BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH,
  MEDITERRANEAN_SOVEREIGNTY_VERSION,
  countHarborLocations,
  scanRemainingCottageForestTokens,
  writeBrainDatasetV3Mediterranean,
  type BrainDatasetV3MediterraneanPackage,
  type MediterraneanNormalizationStats,
} from './brainDatasetV3MediterraneanSovereignty.js';

export type MediterraneanSovereigntyVerdict = 'PASS_FOR_GONEGI_WORLD_TEST' | 'NEEDS_REFINEMENT';

export type MediterraneanSovereigntyViolation = {
  code: string;
  message: string;
  field?: string;
};

export type MediterraneanSovereigntyReport = {
  auditTimestamp: string;
  final_verdict: MediterraneanSovereigntyVerdict;
  sovereignty_version: typeof MEDITERRANEAN_SOVEREIGNTY_VERSION;
  source_package: typeof BRAIN_DATASET_V3_PACKAGE_PATH;
  world_identity: BrainDatasetV3MediterraneanPackage['world_identity'];
  world_balance: BrainDatasetV3MediterraneanPackage['world_balance'];
  world_constraints: BrainDatasetV3MediterraneanPackage['world_constraints'];
  normalization_stats: MediterraneanNormalizationStats;
  grammar_pattern_counts: BrainDatasetV3MediterraneanPackage['grammar_pattern_counts'];
  harbor_location_count: number;
  behavior_library_preserved: {
    camera: boolean;
    acting: boolean;
    object_interaction: boolean;
    extra_actor: boolean;
    animal: boolean;
    daily_life_activity_count: boolean;
  };
  remaining_cottage_forest_tokens: readonly string[];
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly MediterraneanSovereigntyViolation[];
  audit_codes: readonly string[];
};

const FORBIDDEN_CHECKS: Array<[readonly string[], string]> = [
  [
    ['image_prompt', 'negative_prompt', 'prompt_intent', 'compiled_image_prompt', 'prompt_compiler'],
    'FAIL_PROMPT_FIELD',
  ],
  [
    ['character_dna', 'gonegi', 'dana', 'outfit_key', 'silhouette_key', 'character_key'],
    'FAIL_CHARACTER_DNA',
  ],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [['env_dna', 'environment_dna', 'atmosphere_profile', 'dominant_palette'], 'FAIL_ENV_DNA'],
  [['render_rule', 'render_law', 'render_rules', 'renderer_input'], 'FAIL_RENDER_RULE'],
];

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function loadSourceCounts(projectRoot: string): BrainDatasetV3MediterraneanPackage['grammar_pattern_counts'] {
  const source = JSON.parse(
    fs.readFileSync(path.join(projectRoot, BRAIN_DATASET_V3_PACKAGE_PATH), 'utf8')
  ) as BrainDatasetV3MediterraneanPackage;
  return source.grammar_pattern_counts;
}

export function auditMediterraneanWorldSovereignty(
  packageDoc: BrainDatasetV3MediterraneanPackage,
  sourceCounts: BrainDatasetV3MediterraneanPackage['grammar_pattern_counts'],
  normalizationStats: MediterraneanNormalizationStats
): MediterraneanSovereigntyReport {
  const violations: MediterraneanSovereigntyViolation[] = [];
  const worldFacingSerialized = JSON.stringify({
    locations: packageDoc.location_grammar_library,
    touchpoints: packageDoc.daily_life_grammar_library.map(
      (pattern) => pattern.environmental_touchpoint
    ),
  }).toLowerCase();

  const grammarSerialized = JSON.stringify({
    camera_grammar_library: packageDoc.camera_grammar_library,
    acting_grammar_library: packageDoc.acting_grammar_library,
    daily_life_grammar_library: packageDoc.daily_life_grammar_library,
    location_grammar_library: packageDoc.location_grammar_library,
    object_interaction_grammar_library: packageDoc.object_interaction_grammar_library,
    extra_actor_grammar_library: packageDoc.extra_actor_grammar_library,
    animal_grammar_library: packageDoc.animal_grammar_library,
  }).toLowerCase();

  const forbiddenHits: string[] = [];
  for (const [tokens, code] of FORBIDDEN_CHECKS) {
    const hit = containsAny(grammarSerialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({ code, message: `Forbidden token detected: ${hit}` });
    }
  }

  const behaviorFields: Array<
    keyof BrainDatasetV3MediterraneanPackage['grammar_pattern_counts']
  > = ['camera', 'acting', 'object_interaction', 'extra_actor', 'animal'];

  const behavior_library_preserved = Object.freeze({
    camera: packageDoc.camera_grammar_library.length === sourceCounts.camera,
    acting: packageDoc.acting_grammar_library.length === sourceCounts.acting,
    object_interaction:
      packageDoc.object_interaction_grammar_library.length === sourceCounts.object_interaction,
    extra_actor: packageDoc.extra_actor_grammar_library.length === sourceCounts.extra_actor,
    animal: packageDoc.animal_grammar_library.length === sourceCounts.animal,
    daily_life_activity_count:
      packageDoc.daily_life_grammar_library.length === sourceCounts.daily_life,
  });

  for (const field of behaviorFields) {
    if (packageDoc.grammar_pattern_counts[field] !== sourceCounts[field]) {
      violations.push({
        code: 'FAIL_BEHAVIOR_LIBRARY_CHANGED',
        message: `${field} count changed from ${sourceCounts[field]} to ${packageDoc.grammar_pattern_counts[field]}`,
        field,
      });
    }
  }

  if (packageDoc.daily_life_grammar_library.length !== sourceCounts.daily_life) {
    violations.push({
      code: 'FAIL_BEHAVIOR_LIBRARY_CHANGED',
      message: 'daily_life count changed during sovereignty pass',
      field: 'daily_life',
    });
  }

  const remainingTokens = scanRemainingCottageForestTokens(worldFacingSerialized);
  if (remainingTokens.length > 0) {
    violations.push({
      code: 'FAIL_COTTAGE_FOREST_REMAINS',
      message: `Cottage/forest tokens remain in world-facing fields: ${remainingTokens.join(', ')}`,
      field: 'world_facing_normalization',
    });
  }

  const harborCount = countHarborLocations(
    packageDoc.location_grammar_library.map(
      ({ space_type, architectural_feature, depth_cue, navigation_pattern }) =>
        Object.freeze({
          space_type,
          architectural_feature,
          depth_cue,
          navigation_pattern,
        })
    )
  );
  if (harborCount < 3) {
    violations.push({
      code: 'FAIL_HARBOR_IDENTITY',
      message: `Harbor location anchors ${harborCount} below minimum 3`,
      field: 'location_grammar_library',
    });
  }

  const balanceSum =
    packageDoc.world_balance.mediterranean_harbor +
    packageDoc.world_balance.mediterranean_village +
    packageDoc.world_balance.mediterranean_domestic_life +
    packageDoc.world_balance.mediterranean_woodland;
  if (Math.abs(balanceSum - 1) > 0.02) {
    violations.push({
      code: 'FAIL_WORLD_BALANCE',
      message: `world_balance sum ${balanceSum.toFixed(4)} deviates from 1`,
      field: 'world_balance',
    });
  }

  if (packageDoc.world_identity.world_region !== 'mediterranean-harbor-town') {
    violations.push({
      code: 'FAIL_WORLD_IDENTITY',
      message: 'world_identity region is not mediterranean-harbor-town',
      field: 'world_identity',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const final_verdict: MediterraneanSovereigntyVerdict =
    violations.length === 0 ? 'PASS_FOR_GONEGI_WORLD_TEST' : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    sovereignty_version: MEDITERRANEAN_SOVEREIGNTY_VERSION,
    source_package: BRAIN_DATASET_V3_PACKAGE_PATH,
    world_identity: packageDoc.world_identity,
    world_balance: packageDoc.world_balance,
    world_constraints: packageDoc.world_constraints,
    normalization_stats: normalizationStats,
    grammar_pattern_counts: packageDoc.grammar_pattern_counts,
    harbor_location_count: harborCount,
    behavior_library_preserved,
    remaining_cottage_forest_tokens: Object.freeze(remainingTokens),
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
  });
}

export function runMediterraneanWorldSovereigntyAudit(
  projectRoot: string
): MediterraneanSovereigntyReport {
  const sourceCounts = loadSourceCounts(projectRoot);
  const { packageDoc, normalizationStats } = writeBrainDatasetV3Mediterranean(projectRoot);
  const report = auditMediterraneanWorldSovereignty(
    packageDoc,
    sourceCounts,
    normalizationStats
  );
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_MEDITERRANEAN_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
