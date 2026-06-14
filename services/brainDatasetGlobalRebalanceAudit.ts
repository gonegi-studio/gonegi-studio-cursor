import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V2_PACKAGE_PATH,
  BRAIN_DATASET_V2_REPORT_PATH,
  type BrainDatasetV2Package,
} from './brainDatasetV2MergeBuilder.js';
import {
  BRAIN_DATASET_V2_REBALANCED_PATH,
  BRAIN_DATASET_V2_REBALANCED_REPORT_PATH,
  BRAIN_DATASET_REBALANCE_VERSION,
  TARGET_CATEGORY_WEIGHTS,
  summarizeWeightTotals,
  writeBrainDatasetV2Rebalanced,
  type BrainDatasetV2RebalancedPackage,
  type PatternPriorityEntry,
  type RebalancedGlobalPatterns,
} from './brainDatasetGlobalRebalance.js';

export type BrainDatasetRebalanceVerdict =
  | 'PASS_FOR_MORI_INTEGRATION_PREP'
  | 'NEEDS_REBALANCE';

export type BrainDatasetRebalanceViolation = {
  code: string;
  message: string;
  field?: string;
};

export type BrainDatasetRebalanceReport = {
  auditTimestamp: string;
  final_verdict: BrainDatasetRebalanceVerdict;
  rebalance_version: typeof BRAIN_DATASET_REBALANCE_VERSION;
  source_package: typeof BRAIN_DATASET_V2_PACKAGE_PATH;
  source_report: typeof BRAIN_DATASET_V2_REPORT_PATH;
  old_dominant_patterns: BrainDatasetV2Package['global_patterns'];
  new_dominant_patterns: RebalancedGlobalPatterns;
  weight_changes: {
    category_weights: typeof TARGET_CATEGORY_WEIGHTS;
    idle_daily_life_weight: number;
    productive_daily_life_weight: number;
    extra_actor_effective_weight: number;
    animal_effective_weight: number;
  };
  top_daily_life_priorities: readonly PatternPriorityEntry[];
  top_object_interaction_priorities: readonly PatternPriorityEntry[];
  top_extra_actor_priorities: readonly PatternPriorityEntry[];
  top_animal_priorities: readonly PatternPriorityEntry[];
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly BrainDatasetRebalanceViolation[];
  audit_codes: readonly string[];
};

const KIKI_DOMINANCE_DOMINANT_TOKENS = [
  'observing',
  'traveling',
  'window-watch',
  'deep-horizon',
  'ground-stand',
] as const;

const FORBIDDEN_TOKEN_GROUPS: Array<[readonly string[], string]> = [
  [
    ['character_dna', 'gonegi', 'dana', 'outfit_key', 'silhouette_key'],
    'FAIL_CHARACTER_DNA',
  ],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [
    ['env_dna', 'environment_dna', 'atmosphere_profile', 'dominant_palette'],
    'FAIL_ENV_DNA',
  ],
  [
    [
      'image_prompt',
      'negative_prompt',
      'prompt_intent',
      'compiled_image_prompt',
      'prompt_compiler',
    ],
    'FAIL_PROMPT_FIELD',
  ],
  [['render_rule', 'render_law', 'renderer_input'], 'FAIL_RENDER_RULE'],
];

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function isKikiDominantDominant(pattern: string): boolean {
  const lower = pattern.toLowerCase();
  return KIKI_DOMINANCE_DOMINANT_TOKENS.some((token) => lower.includes(token));
}

function loadSourcePackage(projectRoot: string): BrainDatasetV2Package {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, BRAIN_DATASET_V2_PACKAGE_PATH), 'utf8')
  ) as BrainDatasetV2Package;
}

export function auditBrainDatasetGlobalRebalance(
  rebalanced: BrainDatasetV2RebalancedPackage,
  source: BrainDatasetV2Package
): BrainDatasetRebalanceReport {
  const violations: BrainDatasetRebalanceViolation[] = [];
  const serialized = JSON.stringify(rebalanced).toLowerCase();
  const weightSummary = summarizeWeightTotals(rebalanced);

  const dominantDaily = rebalanced.global_patterns.dominant_daily_life_language.toLowerCase();
  const dominantSpace = rebalanced.global_patterns.dominant_space_language.toLowerCase();
  const dominantActing = rebalanced.global_patterns.dominant_acting_language.toLowerCase();

  if (
    isKikiDominantDominant(dominantDaily) ||
    isKikiDominantDominant(dominantSpace) ||
    isKikiDominantDominant(dominantActing) ||
    isKikiDominantDominant(rebalanced.global_patterns.dominant_camera_language)
  ) {
    violations.push({
      code: 'FAIL_GLOBAL_KIKI_DOMINANCE',
      message:
        'Rebalanced global patterns still dominated by observing/traveling/window-watch/deep-horizon signals',
      field: 'global_patterns',
    });
  }

  if (weightSummary.idle_daily_life_weight >= weightSummary.productive_daily_life_weight) {
    violations.push({
      code: 'FAIL_IDLE_CLUSTER',
      message: `Idle daily-life weight (${weightSummary.idle_daily_life_weight}) exceeds productive weight (${weightSummary.productive_daily_life_weight})`,
      field: 'pattern_priorities.daily_life',
    });
  }

  if (weightSummary.extra_actor_effective_weight < 0.025) {
    violations.push({
      code: 'FAIL_EXTRA_ACTOR_UNDERREPRESENTED',
      message: `Extra actor effective weight ${weightSummary.extra_actor_effective_weight} below threshold`,
      field: 'extra_actor_grammar_library',
    });
  }

  if (weightSummary.animal_effective_weight < 0.015) {
    violations.push({
      code: 'FAIL_ANIMAL_UNDERREPRESENTED',
      message: `Animal effective weight ${weightSummary.animal_effective_weight} below threshold`,
      field: 'animal_grammar_library',
    });
  }

  const forbiddenHits: string[] = [];
  for (const [tokens, code] of FORBIDDEN_TOKEN_GROUPS) {
    const hit = containsAny(serialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({
        code,
        message: `Forbidden token detected: ${hit}`,
      });
    }
  }

  if (serialized.includes('negative_prompt')) {
    forbiddenHits.push('negative_prompt');
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: 'Negative prompt field detected',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const final_verdict: BrainDatasetRebalanceVerdict =
    violations.length === 0 ? 'PASS_FOR_MORI_INTEGRATION_PREP' : 'NEEDS_REBALANCE';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    rebalance_version: BRAIN_DATASET_REBALANCE_VERSION,
    source_package: BRAIN_DATASET_V2_PACKAGE_PATH,
    source_report: BRAIN_DATASET_V2_REPORT_PATH,
    old_dominant_patterns: source.global_patterns,
    new_dominant_patterns: rebalanced.global_patterns,
    weight_changes: Object.freeze({
      category_weights: TARGET_CATEGORY_WEIGHTS,
      ...weightSummary,
    }),
    top_daily_life_priorities: Object.freeze(
      rebalanced.pattern_priorities.daily_life.slice(0, 20)
    ),
    top_object_interaction_priorities: Object.freeze(
      rebalanced.pattern_priorities.object_interaction.slice(0, 10)
    ),
    top_extra_actor_priorities: Object.freeze(rebalanced.pattern_priorities.extra_actor),
    top_animal_priorities: Object.freeze(rebalanced.pattern_priorities.animal),
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
  });
}

export function runBrainDatasetGlobalRebalanceAudit(
  projectRoot: string
): BrainDatasetRebalanceReport {
  const source = loadSourcePackage(projectRoot);
  const rebalanced = writeBrainDatasetV2Rebalanced(projectRoot);
  const report = auditBrainDatasetGlobalRebalance(rebalanced, source);
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V2_REBALANCED_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
