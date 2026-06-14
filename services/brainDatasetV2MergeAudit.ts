import fs from 'node:fs';
import path from 'node:path';
import {
  BRAIN_DATASET_V2_PACKAGE_PATH,
  BRAIN_DATASET_V2_REPORT_PATH,
  BRAIN_DATASET_V2_TYPE,
  BRAIN_DATASET_V2_VERSION,
  writeBrainDatasetV2Package,
  type BrainDatasetV2MergeStats,
  type BrainDatasetV2Package,
  type BrainDatasetV2SourceRef,
} from './brainDatasetV2MergeBuilder.js';
import { GHIBLI_01_VIDEO_ID } from './ghibli01GrammarCatalog.js';
import { TEST_KIKI_VIDEO_ID } from './testKikiExtractionSchema.js';

export type BrainDatasetV2Verdict =
  | 'PASS_FOR_IMAGE_APP_V2_TEST'
  | 'NEEDS_REFINEMENT';

export type BrainDatasetV2Violation = {
  code: string;
  message: string;
  field?: string;
};

export type BrainDatasetV2Report = {
  auditTimestamp: string;
  final_verdict: BrainDatasetV2Verdict;
  dataset_type: typeof BRAIN_DATASET_V2_TYPE;
  dataset_version: typeof BRAIN_DATASET_V2_VERSION;
  sources: readonly BrainDatasetV2SourceRef[];
  pre_merge_counts: BrainDatasetV2MergeStats['pre_merge'];
  post_merge_counts: BrainDatasetV2MergeStats['post_merge'];
  added_counts: BrainDatasetV2MergeStats['added'];
  deduped_counts: BrainDatasetV2MergeStats['deduped'];
  generic_pattern_warnings: readonly string[];
  forbidden_field_scan: {
    passed: boolean;
    hits: readonly string[];
  };
  violations: readonly BrainDatasetV2Violation[];
  audit_codes: readonly string[];
  quality_targets: {
    camera: number;
    acting: number;
    daily_life: number;
    location: number;
    object_interaction: number;
    extra_actor: number;
    animal: number;
  };
};

const QUALITY_MINIMUMS = Object.freeze({
  camera: 15,
  acting: 18,
  daily_life: 25,
  location: 12,
  object_interaction: 15,
  extra_actor: 5,
  animal: 5,
});

const CHARACTER_DNA_TOKENS = [
  'character_dna',
  'gonegi',
  'dana',
  'outfit_key',
  'silhouette_key',
  'character_key',
] as const;

const STYLE_CORE_TOKENS = [
  'style_core',
  'master_style',
  'master_style_core',
  'brushwork',
  'palette_key',
] as const;

const ENV_DNA_TOKENS = [
  'env_dna',
  'environment_dna',
  'atmosphere_profile',
  'weather_system',
  'dominant_palette',
] as const;

const RENDER_RULE_TOKENS = ['render_rule', 'render_law', 'renderer_input'] as const;

const PROMPT_TOKENS = [
  'image_prompt',
  'negative_prompt',
  'prompt_intent',
  'compiled_image_prompt',
  'prompt_compiler',
  'midjourney',
  'runway',
  'kling',
  'image_generation_payload',
] as const;

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

function collectGenericDailyLifeWarnings(
  packageDoc: BrainDatasetV2Package
): readonly string[] {
  const warnings: string[] = [];
  for (const pattern of packageDoc.daily_life_grammar_library) {
    const isGenericIdle =
      (pattern.activity === 'observing' ||
        pattern.activity === 'waiting' ||
        pattern.activity === 'interacting') &&
      pattern.object_interaction === 'none';
    if (isGenericIdle) {
      warnings.push(
        `${pattern.pattern_id}: generic daily_life ${pattern.activity}/none/${pattern.environmental_touchpoint}`
      );
    }
  }
  return Object.freeze(warnings);
}

function scanDuplicatePatterns(
  violations: BrainDatasetV2Violation[],
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
  violations: BrainDatasetV2Violation[],
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

export function auditBrainDatasetV2Package(
  packageDoc: BrainDatasetV2Package,
  mergeStats: BrainDatasetV2MergeStats
): BrainDatasetV2Report {
  const violations: BrainDatasetV2Violation[] = [];
  const serialized = JSON.stringify(packageDoc).toLowerCase();

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

  for (const [category, minimum] of Object.entries(QUALITY_MINIMUMS)) {
    const count =
      packageDoc.grammar_pattern_counts[
        category as keyof typeof QUALITY_MINIMUMS
      ];
    if (count < minimum) {
      violations.push({
        code: 'FAIL_QUALITY_TARGET',
        message: `${category} count ${count} below minimum ${minimum}`,
        field: category,
      });
    }
  }

  const forbiddenChecks: Array<[readonly string[], string]> = [
    [PROMPT_TOKENS, 'FAIL_PROMPT_FIELD'],
    [CHARACTER_DNA_TOKENS, 'FAIL_CHARACTER_DNA'],
    [STYLE_CORE_TOKENS, 'FAIL_STYLE_CORE'],
    [ENV_DNA_TOKENS, 'FAIL_ENV_DNA'],
    [RENDER_RULE_TOKENS, 'FAIL_RENDER_RULE'],
  ];

  const forbiddenHits: string[] = [];
  for (const [tokens, code] of forbiddenChecks) {
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

  const genericWarnings = collectGenericDailyLifeWarnings(packageDoc);
  const genericFailCount = genericWarnings.filter((warning) =>
    warning.includes('/interacting/none/')
  ).length;
  if (genericFailCount > 0) {
    violations.push({
      code: 'FAIL_GENERIC_DAILY_LIFE',
      message: `Generic interacting/none daily_life patterns: ${genericFailCount}`,
      field: 'daily_life_grammar_library',
    });
  }

  const auditCodes = [...new Set(violations.map((violation) => violation.code))];
  const final_verdict: BrainDatasetV2Verdict =
    violations.length === 0 ? 'PASS_FOR_IMAGE_APP_V2_TEST' : 'NEEDS_REFINEMENT';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    dataset_type: BRAIN_DATASET_V2_TYPE,
    dataset_version: BRAIN_DATASET_V2_VERSION,
    sources: Object.freeze([TEST_KIKI_VIDEO_ID, GHIBLI_01_VIDEO_ID]),
    pre_merge_counts: mergeStats.pre_merge,
    post_merge_counts: mergeStats.post_merge,
    added_counts: mergeStats.added,
    deduped_counts: mergeStats.deduped,
    generic_pattern_warnings: genericWarnings,
    forbidden_field_scan: Object.freeze({
      passed: forbiddenHits.length === 0,
      hits: Object.freeze(forbiddenHits),
    }),
    violations: Object.freeze(violations),
    audit_codes: Object.freeze(auditCodes),
    quality_targets: QUALITY_MINIMUMS,
  });
}

export function runBrainDatasetV2MergeAudit(projectRoot: string): BrainDatasetV2Report {
  const { packageDoc, mergeStats } = writeBrainDatasetV2Package(projectRoot);
  const report = auditBrainDatasetV2Package(packageDoc, mergeStats);
  fs.writeFileSync(
    path.join(projectRoot, BRAIN_DATASET_V2_REPORT_PATH),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );
  return report;
}
