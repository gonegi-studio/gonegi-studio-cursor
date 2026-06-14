import fs from 'node:fs';
import path from 'node:path';
import {
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  copyImageAppArtStylePrompt,
  copyImageAppCharacterFieldFromGraph,
  copyImageAppTimeSettingPrompt,
  GENERATION_PROMPT_DIR,
  loadCanonicalCharacterPromptsV2,
  loadCanonicalTimeSettingPrompts,
} from './imageAppPromptLoader.js';
import { compareSourcePromptTokenDrift } from './sourcePromptLockAudit.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  loadSourceOfTruthCharacterPrompts,
  loadSourceOfTruthTimeSettingPrompts,
  SOURCE_OF_TRUTH_ARTSTYLE_PATH,
  SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH,
  SOURCE_OF_TRUTH_DIR,
  SOURCE_OF_TRUTH_MANIFEST_PATH,
  SOURCE_OF_TRUTH_PHASE,
  SOURCE_OF_TRUTH_SYSTEM_ID,
  SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH,
} from './sourceOfTruthLoader.js';
import { ensureSourceOfTruthFrozen } from './sourceOfTruthFreezeBuilder.js';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  loadAllMovieImageAppNativeImportDatasets,
  loadMovieImageAppNativeImportV5Dataset,
  loadMovieImageAppNativeImportV6Dataset,
  NATIVE_IMPORT_V5_OUTPUTS,
  NATIVE_IMPORT_V6_OUTPUTS,
  writeMovieImageAppNativeImportV6Datasets,
  writeMovieImageAppNativeImports,
} from './movieImageAppNativeImportBuilder.js';
import { writeMovieMasterDatasetBindings } from './movieMasterDatasetBinding.js';
import {
  MovieSpatialGraph,
  loadMovieSpatialGraphDataset,
} from './movieSpatialGraphBuilder.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const SOURCE_OF_TRUTH_AUDIT_PASS_VERDICT = 'PASS_SOURCE_OF_TRUTH_FREEZE_V1' as const;
export const SOURCE_OF_TRUTH_AUDIT_FAIL_VERDICT = 'FAIL_SOURCE_OF_TRUTH_FREEZE_V1' as const;
export const SOURCE_OF_TRUTH_AUDIT_REPORT_PATH =
  'reports/generation_context/SOURCE_OF_TRUTH_AUDIT_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface SourceOfTruthAuditReport {
  report_id: string;
  phase: typeof SOURCE_OF_TRUTH_PHASE;
  system_id: typeof SOURCE_OF_TRUTH_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  source_of_truth_created: boolean;
  rewrite_eliminated: boolean;
  normalization_eliminated: boolean;
  serializer_eliminated: boolean;
  approved_source_locked: boolean;
  image_app_import_ready: boolean;
  checks: {
    source_truth_vs_prompts_artstyle_match: boolean;
    source_truth_vs_prompts_character_match: boolean;
    source_truth_vs_prompts_timesetting_match: boolean;
    source_truth_vs_exports_artstyle_match: boolean;
    source_truth_vs_exports_character_match: boolean;
    source_truth_vs_exports_timesetting_match: boolean;
    extra_tokens: boolean;
    missing_tokens: boolean;
    rewritten_tokens: boolean;
  };
  metrics: {
    artstyle_char_delta: number;
    character_char_delta: number;
    timesetting_char_delta: number;
    rewritten_token_count: number;
    missing_token_count: number;
    extra_token_count: number;
    slots_audited: number;
    export_files_audited: number;
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function charDelta(source: string, actual: string): number {
  if (source === actual) return 0;
  let delta = Math.abs(source.length - actual.length);
  const limit = Math.min(source.length, actual.length);
  for (let index = 0; index < limit; index += 1) {
    if (source[index] !== actual[index]) {
      delta += 1;
    }
  }
  return delta;
}

function compareJsonMaps(
  left: Record<string, string>,
  right: Record<string, string>
): { match: boolean; maxCharDelta: number } {
  let maxCharDelta = 0;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    maxCharDelta = Math.max(maxCharDelta, charDelta(left[key] ?? '', right[key] ?? ''));
    if ((left[key] ?? '') !== (right[key] ?? '')) {
      return { match: false, maxCharDelta };
    }
  }
  return { match: true, maxCharDelta };
}

function auditExportSlots(
  movieId: string,
  exportPath: string,
  exportVersion: string,
  slots: Array<{ artStyle: string; character: string; timeSetting: string }>,
  graphDataset: { spatial_graphs: MovieSpatialGraph[] },
  root: string,
  issues: ValidationIssue[],
  metrics: {
    artstyle_char_delta: number;
    character_char_delta: number;
    timesetting_char_delta: number;
    rewritten_token_count: number;
    missing_token_count: number;
    extra_token_count: number;
    slots_audited: number;
  }
): { artstyleMatch: boolean; characterMatch: boolean; timesettingMatch: boolean } {
  let artstyleMatch = true;
  let characterMatch = true;
  let timesettingMatch = true;

  graphDataset.spatial_graphs.forEach((graph, slotIndex) => {
    const slot = slots[slotIndex];
    if (!slot) {
      issues.push({
        code: 'EXPORT_SLOT_MISSING',
        message: `${exportVersion}:${movieId}[${slotIndex}] missing slot`,
        severity: 'error',
      });
      artstyleMatch = false;
      characterMatch = false;
      timesettingMatch = false;
      return;
    }

    metrics.slots_audited += 1;
    const timeSettingId = resolveLockedTimeSettingId(graph);
    const expected = {
      artStyle: copySourceOfTruthArtStyle(root),
      character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
      timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
    };

    const artDelta = charDelta(expected.artStyle, slot.artStyle);
    const charDeltaValue = charDelta(expected.character, slot.character);
    const timeDelta = charDelta(expected.timeSetting, slot.timeSetting);

    metrics.artstyle_char_delta = Math.max(metrics.artstyle_char_delta, artDelta);
    metrics.character_char_delta = Math.max(metrics.character_char_delta, charDeltaValue);
    metrics.timesetting_char_delta = Math.max(metrics.timesetting_char_delta, timeDelta);

    if (slot.artStyle !== expected.artStyle) {
      artstyleMatch = false;
      issues.push({
        code: 'EXPORT_ARTSTYLE_SOURCE_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: artStyle char_delta=${artDelta}`,
        severity: 'error',
      });
    }
    if (slot.character !== expected.character) {
      characterMatch = false;
      issues.push({
        code: 'EXPORT_CHARACTER_SOURCE_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: character char_delta=${charDeltaValue}`,
        severity: 'error',
      });
    }
    if (slot.timeSetting !== expected.timeSetting) {
      timesettingMatch = false;
      issues.push({
        code: 'EXPORT_TIMESETTING_SOURCE_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: timeSetting char_delta=${timeDelta}`,
        severity: 'error',
      });
    }

    for (const [field, expectedValue, actualValue] of [
      ['artStyle', expected.artStyle, slot.artStyle],
      ['character', expected.character, slot.character],
      ['timeSetting', expected.timeSetting, slot.timeSetting],
    ] as const) {
      const drift = compareSourcePromptTokenDrift(expectedValue, actualValue);
      metrics.extra_token_count += drift.extra_tokens.length;
      metrics.missing_token_count += drift.missing_tokens.length;
      metrics.rewritten_token_count += drift.rewritten_tokens.length;
      if (drift.extra_tokens.length > 0) {
        issues.push({
          code: 'EXTRA_TOKEN_DETECTED',
          message: `${exportVersion}:${exportPath}[${slotIndex}] ${field}: extra=${drift.extra_tokens.join(',')}`,
          severity: 'error',
        });
      }
      if (drift.missing_tokens.length > 0) {
        issues.push({
          code: 'MISSING_TOKEN_DETECTED',
          message: `${exportVersion}:${exportPath}[${slotIndex}] ${field}: missing=${drift.missing_tokens.join(',')}`,
          severity: 'error',
        });
      }
      if (drift.rewritten_tokens.length > 0) {
        issues.push({
          code: 'REWRITTEN_TOKEN_DETECTED',
          message: `${exportVersion}:${exportPath}[${slotIndex}] ${field}: rewritten=${drift.rewritten_tokens.join(',')}`,
          severity: 'error',
        });
      }
    }
  });

  return { artstyleMatch, characterMatch, timesettingMatch };
}

export function runSourceOfTruthAudit(root: string): SourceOfTruthAuditReport {
  ensureSourceOfTruthFrozen(root);
  writeMovieMasterDatasetBindings(root);
  writeMovieImageAppNativeImports(root);
  writeMovieImageAppNativeImportV6Datasets(root);

  const issues: ValidationIssue[] = [];
  const metrics = {
    artstyle_char_delta: 0,
    character_char_delta: 0,
    timesetting_char_delta: 0,
    rewritten_token_count: 0,
    missing_token_count: 0,
    extra_token_count: 0,
    slots_audited: 0,
    export_files_audited: 0,
  };

  const sourceExists = [
    SOURCE_OF_TRUTH_MANIFEST_PATH,
    SOURCE_OF_TRUTH_ARTSTYLE_PATH,
    SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH,
    SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH,
  ].every((rel) => fs.existsSync(path.join(root, rel)));

  if (!sourceExists) {
    issues.push({ code: 'SOURCE_OF_TRUTH_MISSING', message: 'source_of_truth files missing', severity: 'error' });
  }

  const sourceArtStyle = copySourceOfTruthArtStyle(root);
  const promptArtStyle = copyImageAppArtStylePrompt(root);
  const sourceCharacters = loadSourceOfTruthCharacterPrompts(root);
  const promptCharacters = loadCanonicalCharacterPromptsV2(root);
  const sourceTimeSettings = loadSourceOfTruthTimeSettingPrompts(root);
  const promptTimeSettings = loadCanonicalTimeSettingPrompts(root);

  const artstylePromptDelta = charDelta(sourceArtStyle, promptArtStyle);
  metrics.artstyle_char_delta = Math.max(metrics.artstyle_char_delta, artstylePromptDelta);
  const sourceTruthVsPromptsArtstyleMatch = sourceArtStyle === promptArtStyle;
  if (!sourceTruthVsPromptsArtstyleMatch) {
    issues.push({
      code: 'PROMPTS_ARTSTYLE_DRIFT',
      message: `prompts/canonical-artstyle-prompt.txt differs from source_of_truth/artstyle.txt by ${artstylePromptDelta} chars`,
      severity: 'error',
    });
  }

  const characterCompare = compareJsonMaps(sourceCharacters, promptCharacters);
  metrics.character_char_delta = Math.max(metrics.character_char_delta, characterCompare.maxCharDelta);
  const sourceTruthVsPromptsCharacterMatch = characterCompare.match;
  if (!sourceTruthVsPromptsCharacterMatch) {
    issues.push({
      code: 'PROMPTS_CHARACTER_DRIFT',
      message: 'prompts/canonical-character-prompts-v2.json differs from source_of_truth/character-prompts.json',
      severity: 'error',
    });
  }

  const timeCompare = compareJsonMaps(sourceTimeSettings, promptTimeSettings);
  metrics.timesetting_char_delta = Math.max(metrics.timesetting_char_delta, timeCompare.maxCharDelta);
  const sourceTruthVsPromptsTimesettingMatch = timeCompare.match;
  if (!sourceTruthVsPromptsTimesettingMatch) {
    issues.push({
      code: 'PROMPTS_TIMESETTING_DRIFT',
      message: 'prompts/canonical-timesetting-prompts.json differs from source_of_truth/timesetting-prompts.json',
      severity: 'error',
    });
  }

  let exportsArtstyleMatch = true;
  let exportsCharacterMatch = true;
  let exportsTimesettingMatch = true;

  const exportSpecs = [
    ...NATIVE_IMPORT_V6_OUTPUTS.map((spec) => ({ ...spec, version: 'v6' as const })),
    ...NATIVE_IMPORT_V5_OUTPUTS.map((spec) => ({ ...spec, version: 'v5' as const })),
    ...IMAGE_APP_NATIVE_IMPORT_OUTPUTS.map((spec) => ({ ...spec, version: 'v1' as const })),
  ];

  metrics.export_files_audited = exportSpecs.length;
  const v1Datasets = loadAllMovieImageAppNativeImportDatasets(root);

  for (const spec of exportSpecs) {
    const graphDataset = loadMovieSpatialGraphDataset(root, spec.movie_id);
    if (!graphDataset) {
      issues.push({
        code: 'GRAPH_DATASET_MISSING',
        message: `Missing spatial graph for ${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    let slots: Array<{ artStyle: string; character: string; timeSetting: string }> | null = null;
    if (spec.version === 'v6') {
      slots = loadMovieImageAppNativeImportV6Dataset(root, spec.movie_id)?.slots ?? null;
    } else if (spec.version === 'v5') {
      slots = loadMovieImageAppNativeImportV5Dataset(root, spec.movie_id)?.slots ?? null;
    } else {
      slots = v1Datasets.find((entry) => entry.movie_id === spec.movie_id)?.slots ?? null;
    }

    if (!slots) {
      issues.push({
        code: 'EXPORT_DATASET_MISSING',
        message: `Missing ${spec.version} export for ${spec.movie_id}`,
        severity: 'error',
      });
      exportsArtstyleMatch = false;
      exportsCharacterMatch = false;
      exportsTimesettingMatch = false;
      continue;
    }

    const result = auditExportSlots(
      spec.movie_id,
      spec.output_path,
      spec.version,
      slots,
      graphDataset,
      root,
      issues,
      metrics
    );
    exportsArtstyleMatch = exportsArtstyleMatch && result.artstyleMatch;
    exportsCharacterMatch = exportsCharacterMatch && result.characterMatch;
    exportsTimesettingMatch = exportsTimesettingMatch && result.timesettingMatch;
  }

  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, SOURCE_OF_TRUTH_MANIFEST_PATH), 'utf8')
  ) as {
    source_locked: boolean;
    rewrite_allowed: boolean;
    normalize_allowed: boolean;
    serialize_allowed: boolean;
    generate_allowed: boolean;
  };

  const approvedSourceLocked =
    manifest.source_locked === true &&
    manifest.rewrite_allowed === false &&
    manifest.normalize_allowed === false &&
    manifest.serialize_allowed === false &&
    manifest.generate_allowed === false;

  const hasExtraTokens = metrics.extra_token_count > 0;
  const hasMissingTokens = metrics.missing_token_count > 0;
  const hasRewrittenTokens = metrics.rewritten_token_count > 0;

  const rewriteEliminated = !hasRewrittenTokens && !hasExtraTokens && !hasMissingTokens;
  const normalizationEliminated =
    sourceTruthVsPromptsArtstyleMatch &&
    sourceTruthVsPromptsCharacterMatch &&
    sourceTruthVsPromptsTimesettingMatch;
  const serializerEliminated = exportsArtstyleMatch && exportsCharacterMatch && exportsTimesettingMatch;
  const imageAppImportReady =
    exportsArtstyleMatch &&
    exportsCharacterMatch &&
    exportsTimesettingMatch &&
    metrics.artstyle_char_delta === 0 &&
    metrics.character_char_delta === 0 &&
    metrics.timesetting_char_delta === 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    sourceExists &&
    approvedSourceLocked &&
    rewriteEliminated &&
    normalizationEliminated &&
    serializerEliminated &&
    imageAppImportReady;

  return {
    report_id: `source_of_truth_audit_${Date.now().toString(36)}`,
    phase: SOURCE_OF_TRUTH_PHASE,
    system_id: SOURCE_OF_TRUTH_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? SOURCE_OF_TRUTH_AUDIT_PASS_VERDICT : SOURCE_OF_TRUTH_AUDIT_FAIL_VERDICT,
    validation_passed: validationPassed,
    source_of_truth_created: sourceExists,
    rewrite_eliminated: rewriteEliminated,
    normalization_eliminated: normalizationEliminated,
    serializer_eliminated: serializerEliminated,
    approved_source_locked: approvedSourceLocked,
    image_app_import_ready: imageAppImportReady,
    checks: {
      source_truth_vs_prompts_artstyle_match: sourceTruthVsPromptsArtstyleMatch,
      source_truth_vs_prompts_character_match: sourceTruthVsPromptsCharacterMatch,
      source_truth_vs_prompts_timesetting_match: sourceTruthVsPromptsTimesettingMatch,
      source_truth_vs_exports_artstyle_match: exportsArtstyleMatch,
      source_truth_vs_exports_character_match: exportsCharacterMatch,
      source_truth_vs_exports_timesetting_match: exportsTimesettingMatch,
      extra_tokens: hasExtraTokens,
      missing_tokens: hasMissingTokens,
      rewritten_tokens: hasRewrittenTokens,
    },
    metrics: {
      artstyle_char_delta: metrics.artstyle_char_delta,
      character_char_delta: metrics.character_char_delta,
      timesetting_char_delta: metrics.timesetting_char_delta,
      rewritten_token_count: metrics.rewritten_token_count,
      missing_token_count: metrics.missing_token_count,
      extra_token_count: metrics.extra_token_count,
      slots_audited: metrics.slots_audited,
      export_files_audited: metrics.export_files_audited,
    },
    issues: issues.slice(0, 100),
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSourceOfTruthAuditReport(projectRoot?: string): SourceOfTruthAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSourceOfTruthAudit(root);
  writeJson(root, SOURCE_OF_TRUTH_AUDIT_REPORT_PATH, report);
  return report;
}

export {
  SAFE_CREATE_POLICY,
  NATIVE_IMPORT_V6_OUTPUTS,
  SOURCE_OF_TRUTH_DIR,
  GENERATION_PROMPT_DIR,
};
