import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V2_REBALANCED_PATH,
  BRAIN_DATASET_V2_REBALANCED_REPORT_PATH,
} from './brainDatasetGlobalRebalance.js';
import {
  BRAIN_DATASET_V3_PACKAGE_PATH,
  BRAIN_DATASET_V3_REPORT_PATH,
  BRAIN_DATASET_V3_TYPE,
  BRAIN_DATASET_V3_VERSION,
  countIdleDailyLifePatterns,
  writeBrainDatasetV3Package,
  type BrainDatasetV3MergeStats,
  type BrainDatasetV3Package,
} from './brainDatasetV3MoriMergeBuilder.js';
import {
  MORI_GRAMMAR_CATALOG_PATH,
  MORI_GRAMMAR_CATALOG_REPORT_PATH,
} from './moriGrammarCatalog.js';

export type BrainDatasetV3Verdict =
  | 'PASS_FOR_IMAGE_APP_V3_TEST'
  | 'NEEDS_REFINEMENT';

export type BrainDatasetV3Violation = {
  code: string;
  message: string;
  field?: string;
};

export type BrainDatasetV3Report = {
  auditTimestamp: string;
  final_verdict: BrainDatasetV3Verdict;
  dataset_type: typeof BRAIN_DATASET_V3_TYPE;
  dataset_version: typeof BRAIN_DATASET_V3_VERSION;
  source_inputs: {
    rebalanced_v2: typeof BRAIN_DATASET_V2_REBALANCED_PATH;
    rebalanced_v2_report: typeof BRAIN_DATASET_V2_REBALANCED_REPORT_PATH;
    mori_catalog: typeof MORI_GRAMMAR_CATALOG_PATH;
    mori_catalog_report: typeof MORI_GRAMMAR_CATALOG_REPORT_PATH;
  };
  pre_merge_counts: BrainDatasetV3MergeStats['pre_merge'];
  post_merge_counts: BrainDatasetV3MergeStats['post_merge'];
  added_counts: BrainDatasetV3MergeStats['added'];
  deduped_counts: BrainDatasetV3MergeStats['deduped'];
  mori_contribution_ratio: BrainDatasetV3MergeStats['mori_contribution_ratio'];
  idle_cluster_warning: {
    idle_daily_life_count: number;
    productive_daily_life_count: number;
    idle_ratio: number;
  };
  animal_extra_actor_growth: {
    extra_actor_pre: number;
    extra_actor_post: number;
    animal_pre: number;
    animal_post: number;
  };
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly BrainDatasetV3Violation[];
  audit_codes: readonly string[];
  quality_targets: {
    camera: number;
    acting: number;
    daily_life: number;
    object_interaction: number;
    extra_actor: number;
    animal: number;
  };
};

const QUALITY_MINIMUMS = Object.freeze({
  camera: 28,
  acting: 28,
  daily_life: 50,
  object_interaction: 35,
  extra_actor: 12,
  animal: 12,
});

const PRODUCTIVE_DAILY_LIFE = new Set([
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
  'foraging',
  'fishing',
  'weaving',
  'pottery',
  'meal-prep',
  'tea-serve',
  'garden-tend',
  'mending',
  'honey-harvest',
  'seed-sow',
  'festival-help',
  'letter-deliver',
]);

const FORBIDDEN_CHECKS: Array<[readonly string[], string]> = [
  [
    [
      'image_prompt',
      'negative_prompt',
      'prompt_intent',
      'compiled_image_prompt',
      'prompt_compiler',
      'midjourney',
      'runway',
      'kling',
      'image_generation_payload',
    ],
    'FAIL_PROMPT_FIELD',
  ],
  [
    ['character_dna', 'gonegi', 'dana', 'outfit_key', 'silhouette_key', 'character_key'],
    'FAIL_CHARACTER_DNA',
  ],
  [['style_core', 'master_style_core', 'master_style', 'brushwork'], 'FAIL_STYLE_CORE'],
  [['env_dna', 'environment_dna', 'atmosphere_profile', 'dominant_palette'], 'FAIL_ENV_DNA'],
  [['render_rule', 'render_law', 'renderer_input', 'render_rules'], 'FAIL_RENDER_RULE'],
];

function containsAny(haystack: string, tokens: readonly string[]): string | null {
  for (const token of tokens) {
    if (haystack.includes(token)) {
      return token;
    }
  }
  return null;
}

function exactPatternKey(value: Record<string, string>): string {
  return Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => `${key}=${value[key]}`)
    .join('|');
}

function scanDuplicatePatterns(
  violations: BrainDatasetV3Violation[],
  libraryName: string,
  patterns: readonly Record<string, unknown>[]
): void {
  const seen = new Map<string, string>();
  for (const pattern of patterns) {
    const { pattern_id, source_refs, ...fields } = pattern;
    const key = exactPatternKey(fields as Record<string, string>);
    const prior = seen.get(key);
    if (prior !== undefined) {
      violations.push({
        code: 'FAIL_DUPLICATE_PATTERN',
        message: `Duplicate ${libraryName} pattern ${String(pattern_id)} matches ${prior}`,
        field: libraryName,
      });
    } else {
      seen.set(key, String(pattern_id));
    }
  }
}

function scanSourceReferences(
  violations: BrainDatasetV3Violation[],
  libraryName: string,
  patterns: readonly { pattern_id?: string; source_refs?: unknown }[]
): void {
  if (patterns.length === 0) {
    violations.push({
      code: 'FAIL_EMPTY_LIBRARY',
      message: `${libraryName} is empty`,
      field: libraryName,
    });
    return;
  }

  for (const pattern of patterns) {
    if (!Array.isArray(pattern.source_refs) || pattern.source_refs.length === 0) {
      violations.push({
        code: 'FAIL_SOURCE_REFERENCE_MISSING',
        message: `Missing source_refs on ${libraryName}/${String(pattern.pattern_id)}`,
        field: libraryName,
      });
    }
  }
}

function countProductiveDailyLife(
  patterns: BrainDatasetV3Package['daily_life_grammar_library']
): number {
  return patterns.filter((pattern) => PRODUCTIVE_DAILY_LIFE.has(pattern.activity)).length;
}

export function auditBrainDatasetV3Package(
  packageDoc: BrainDatasetV3Package,
  mergeStats: BrainDatasetV3MergeStats
): BrainDatasetV3Report {
  const violations: BrainDatasetV3Violation[] = [];
  const serialized = JSON.stringify(packageDoc).toLowerCase();
  const forbiddenHits: string[] = [];

  scanSourceReferences(
    violations,
    'camera_grammar_library',
    packageDoc.camera_grammar_library
  );
  scanSourceReferences(
    violations,
    'acting_grammar_library',
    packageDoc.acting_grammar_library
  );
  scanSourceReferences(
    violations,
    'daily_life_grammar_library',
    packageDoc.daily_life_grammar_library
  );
  scanSourceReferences(
    violations,
    'location_grammar_library',
    packageDoc.location_grammar_library
  );
  scanSourceReferences(
    violations,
    'object_interaction_grammar_library',
    packageDoc.object_interaction_grammar_library
  );
  scanSourceReferences(
    violations,
    'extra_actor_grammar_library',
    packageDoc.extra_actor_grammar_library
  );
  scanSourceReferences(
    violations,
    'animal_grammar_library',
    packageDoc.animal_grammar_library
  );

  scanDuplicatePatterns(
    violations,
    'camera_grammar_library',
    packageDoc.camera_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'acting_grammar_library',
    packageDoc.acting_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'daily_life_grammar_library',
    packageDoc.daily_life_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'location_grammar_library',
    packageDoc.location_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'object_interaction_grammar_library',
    packageDoc.object_interaction_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'extra_actor_grammar_library',
    packageDoc.extra_actor_grammar_library as readonly Record<string, unknown>[]
  );
  scanDuplicatePatterns(
    violations,
    'animal_grammar_library',
    packageDoc.animal_grammar_library as readonly Record<string, unknown>[]
  );

  for (const key of Object.keys(QUALITY_MINIMUMS) as Array<keyof typeof QUALITY_MINIMUMS>) {
    const minimum = QUALITY_MINIMUMS[key];
    const count = packageDoc.grammar_pattern_counts[key];
    if (count < minimum) {
      violations.push({
        code: 'FAIL_QUALITY_TARGET',
        message: `${key} count ${count} below minimum ${minimum}`,
        field: key,
      });
    }
  }

  for (const [tokens, code] of FORBIDDEN_CHECKS) {
    const hit = containsAny(serialized, tokens);
    if (hit !== null) {
      forbiddenHits.push(hit);
      violations.push({ code, message: `Forbidden token detected: ${hit}` });
    }
  }

  if (serialized.includes('negative_prompt')) {
    forbiddenHits.push('negative_prompt');
    violations.push({
      code: 'FAIL_PROMPT_FIELD',
      message: 'Negative prompt field detected',
    });
  }

  const moriOnlyRatio =
    mergeStats.mori_only_daily_life / packageDoc.grammar_pattern_counts.daily_life;
  if (moriOnlyRatio > 0.55) {
    violations.push({
      code: 'FAIL_MORI_OVERDOMINANCE',
      message: `MORI-only daily_life ratio ${moriOnlyRatio.toFixed(4)} exceeds 0.55`,
      field: 'daily_life_grammar_library',
    });
  }

  const idleCount = countIdleDailyLifePatterns(packageDoc.daily_life_grammar_library);
  const productiveCount = countProductiveDailyLife(packageDoc.daily_life_grammar_library);
  const idleRatio = idleCount / packageDoc.grammar_pattern_counts.daily_life;
  if (idleCount >= productiveCount || idleRatio > 0.3) {
    violations.push({
      code: 'FAIL_IDLE_CLUSTER_OVERDOMINANCE',
      message: `Idle daily_life (${idleCount}) rivals productive (${productiveCount}), ratio ${idleRatio.toFixed(4)}`,
      field: 'daily_life_grammar_library',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const final_verdict: BrainDatasetV3Verdict =
    violations.length === 0 ? 'PASS_FOR_IMAGE_APP_V3_TEST' : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    dataset_type: BRAIN_DATASET_V3_TYPE,
    dataset_version: BRAIN_DATASET_V3_VERSION,
    source_inputs: Object.freeze({
      rebalanced_v2: BRAIN_DATASET_V2_REBALANCED_PATH,
      rebalanced_v2_report: BRAIN_DATASET_V2_REBALANCED_REPORT_PATH,
      mori_catalog: MORI_GRAMMAR_CATALOG_PATH,
      mori_catalog_report: MORI_GRAMMAR_CATALOG_REPORT_PATH,
    }),
    pre_merge_counts: mergeStats.pre_merge,
    post_merge_counts: mergeStats.post_merge,
    added_counts: mergeStats.added,
    deduped_counts: mergeStats.deduped,
    mori_contribution_ratio: mergeStats.mori_contribution_ratio,
    idle_cluster_warning: Object.freeze({
      idle_daily_life_count: idleCount,
      productive_daily_life_count: productiveCount,
      idle_ratio: Number(idleRatio.toFixed(4)),
    }),
    animal_extra_actor_growth: Object.freeze({
      extra_actor_pre: mergeStats.pre_merge.extra_actor,
      extra_actor_post: mergeStats.post_merge.extra_actor,
      animal_pre: mergeStats.pre_merge.animal,
      animal_post: mergeStats.post_merge.animal,
    }),
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
    quality_targets: QUALITY_MINIMUMS,
  });
}

export function runBrainDatasetV3MoriMergeAudit(projectRoot: string): BrainDatasetV3Report {
  const { packageDoc, mergeStats } = writeBrainDatasetV3Package(projectRoot);
  const report = auditBrainDatasetV3Package(packageDoc, mergeStats);
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V3_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
