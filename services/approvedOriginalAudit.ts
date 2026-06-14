import fs from 'node:fs';
import path from 'node:path';
import {
  APPROVED_ORIGINALS_DIR,
  APPROVED_ORIGINALS_PHASE,
  APPROVED_ORIGINALS_SYSTEM_ID,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  REQUIRED_APPROVED_CHARACTER_IDS,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalCharacterField,
  copyApprovedOriginalCharacterPrompt,
  copyApprovedOriginalTimeSettingPrompt,
  loadApprovedOriginalCharacterPrompts,
  loadApprovedOriginalTimeSettingPrompts,
} from './approvedOriginalsLoader.js';
import {
  copySourceOfTruthCharacterFieldFromGraph,
} from './sourceOfTruthLoader.js';
import { ensureApprovedOriginalsFrozen } from './approvedOriginalsFreezeBuilder.js';
import {
  CANONICAL_ARTSTYLE_PROMPT_PATH,
  CANONICAL_CHARACTER_PROMPTS_V2_PATH,
  CANONICAL_TIMESETTING_PROMPTS_PATH,
  copyImageAppArtStylePrompt,
  copyImageAppCharacterFieldFromGraph,
  copyImageAppTimeSettingPrompt,
  loadCanonicalCharacterPromptsV2,
  loadCanonicalTimeSettingPrompts,
} from './imageAppPromptLoader.js';
import {
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  loadAllMovieImageAppNativeImportDatasets,
  loadMovieImageAppNativeImportV5Dataset,
  loadMovieImageAppNativeImportV6Dataset,
  loadMovieImageAppNativeImportV7Dataset,
  NATIVE_IMPORT_V5_OUTPUTS,
  NATIVE_IMPORT_V6_OUTPUTS,
  NATIVE_IMPORT_V7_OUTPUTS,
  writeMovieImageAppNativeImportV7Datasets,
  writeMovieImageAppNativeImports,
} from './movieImageAppNativeImportBuilder.js';
import { writeMovieMasterDatasetBindings } from './movieMasterDatasetBinding.js';
import {
  MovieSpatialGraph,
  loadMovieSpatialGraphDataset,
} from './movieSpatialGraphBuilder.js';
import { compareSourcePromptTokenDrift } from './sourcePromptLockAudit.js';
import { ensureSourceOfTruthFrozen } from './sourceOfTruthFreezeBuilder.js';
import {
  SOURCE_OF_TRUTH_ARTSTYLE_PATH,
  SOURCE_OF_TRUTH_CHARACTER_PROMPTS_PATH,
  SOURCE_OF_TRUTH_TIMESETTING_PROMPTS_PATH,
  loadSourceOfTruthCharacterPrompts,
  loadSourceOfTruthTimeSettingPrompts,
} from './sourceOfTruthLoader.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const APPROVED_ORIGINAL_AUDIT_PASS_VERDICT = 'PASS_REAL_SOURCE_RECOVERY_V1' as const;
export const APPROVED_ORIGINAL_AUDIT_FAIL_VERDICT = 'FAIL_REAL_SOURCE_RECOVERY_V1' as const;
export const APPROVED_ORIGINAL_AUDIT_REPORT_PATH =
  'reports/generation_context/REAL_SOURCE_RECOVERY_REPORT.json' as const;

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

function readRawText(root: string, rel: string): string {
  return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');
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

function lineDelta(source: string, actual: string): number {
  return Math.abs(source.split('\n').length - actual.split('\n').length);
}

function compareJsonMaps(
  left: Record<string, string>,
  right: Record<string, string>
): { match: boolean; maxCharDelta: number; maxLineDelta: number } {
  let maxCharDelta = 0;
  let maxLineDelta = 0;
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    maxCharDelta = Math.max(maxCharDelta, charDelta(left[key] ?? '', right[key] ?? ''));
    maxLineDelta = Math.max(maxLineDelta, lineDelta(left[key] ?? '', right[key] ?? ''));
    if ((left[key] ?? '') !== (right[key] ?? '')) {
      return { match: false, maxCharDelta, maxLineDelta };
    }
  }
  return { match: true, maxCharDelta, maxLineDelta };
}

function accumulateTokenDrift(
  source: string,
  actual: string,
  metrics: { token_delta: number; extra_token_count: number; missing_token_count: number; rewritten_token_count: number },
  issues: ValidationIssue[],
  context: string
): void {
  const drift = compareSourcePromptTokenDrift(source, actual);
  metrics.token_delta +=
    drift.extra_tokens.length + drift.missing_tokens.length + drift.rewritten_tokens.length;
  metrics.extra_token_count += drift.extra_tokens.length;
  metrics.missing_token_count += drift.missing_tokens.length;
  metrics.rewritten_token_count += drift.rewritten_tokens.length;

  if (drift.extra_tokens.length > 0) {
    issues.push({
      code: 'EXTRA_TOKEN_DETECTED',
      message: `${context}: extra=${drift.extra_tokens.join(',')}`,
      severity: 'error',
    });
  }
  if (drift.missing_tokens.length > 0) {
    issues.push({
      code: 'MISSING_TOKEN_DETECTED',
      message: `${context}: missing=${drift.missing_tokens.join(',')}`,
      severity: 'error',
    });
  }
  if (drift.rewritten_tokens.length > 0) {
    issues.push({
      code: 'REWRITTEN_TOKEN_DETECTED',
      message: `${context}: rewritten=${drift.rewritten_tokens.join(',')}`,
      severity: 'error',
    });
  }
}

export interface ApprovedOriginalAuditReport {
  report_id: string;
  phase: typeof APPROVED_ORIGINALS_PHASE;
  system_id: typeof APPROVED_ORIGINALS_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  approved_original_locked: boolean;
  artstyle_original_restored: boolean;
  character_original_restored: boolean;
  timesetting_locked: boolean;
  scenario_generation_only: boolean;
  image_app_import_ready: boolean;
  checks: {
    artstyle_original_match: boolean;
    character_original_match: boolean;
    timesetting_original_match: boolean;
    approved_vs_source_of_truth_artstyle_match: boolean;
    approved_vs_source_of_truth_character_match: boolean;
    approved_vs_source_of_truth_timesetting_match: boolean;
    approved_vs_prompts_artstyle_match: boolean;
    approved_vs_prompts_character_match: boolean;
    approved_vs_prompts_timesetting_match: boolean;
    approved_vs_exports_artstyle_match: boolean;
    approved_vs_exports_character_match: boolean;
    approved_vs_exports_timesetting_match: boolean;
    extra_tokens: boolean;
    missing_tokens: boolean;
    rewritten_tokens: boolean;
  };
  metrics: {
    artstyle_match_rate: number;
    character_match_rate: number;
    timesetting_match_rate: number;
    artstyle_char_delta: number;
    character_char_delta: number;
    timesetting_char_delta: number;
    char_delta: number;
    line_delta: number;
    token_delta: number;
    extra_token_count: number;
    missing_token_count: number;
    rewritten_token_count: number;
    slots_audited: number;
    export_files_audited: number;
  };
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function auditExportSlots(
  movieId: string,
  exportPath: string,
  exportVersion: string,
  slots: Array<{ artStyle: string; character: string; timeSetting: string; scenario: string }>,
  graphDataset: { spatial_graphs: MovieSpatialGraph[] },
  root: string,
  issues: ValidationIssue[],
  metrics: ApprovedOriginalAuditReport['metrics']
): { artstyleMatch: boolean; characterMatch: boolean; timesettingMatch: boolean; scenarioOnly: boolean } {
  let artstyleMatch = true;
  let characterMatch = true;
  let timesettingMatch = true;
  let scenarioOnly = true;

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
      scenarioOnly = false;
      return;
    }

    metrics.slots_audited += 1;
    const timeSettingId = resolveLockedTimeSettingId(graph);
    const expected = {
      artStyle: copyApprovedOriginalArtStyle(root),
      character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
      timeSetting: copyApprovedOriginalTimeSettingPrompt(timeSettingId, root),
    };

    const artDelta = charDelta(expected.artStyle, slot.artStyle);
    const charDeltaValue = charDelta(expected.character, slot.character);
    const timeDelta = charDelta(expected.timeSetting, slot.timeSetting);

    metrics.artstyle_char_delta = Math.max(metrics.artstyle_char_delta, artDelta);
    metrics.character_char_delta = Math.max(metrics.character_char_delta, charDeltaValue);
    metrics.timesetting_char_delta = Math.max(metrics.timesetting_char_delta, timeDelta);
    metrics.char_delta = Math.max(metrics.char_delta, artDelta, charDeltaValue, timeDelta);

    if (slot.artStyle !== expected.artStyle) {
      artstyleMatch = false;
      issues.push({
        code: 'EXPORT_ARTSTYLE_ORIGINAL_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: artStyle char_delta=${artDelta}`,
        severity: 'error',
      });
    }
    if (slot.character !== expected.character) {
      characterMatch = false;
      issues.push({
        code: 'EXPORT_CHARACTER_ORIGINAL_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: character char_delta=${charDeltaValue}`,
        severity: 'error',
      });
    }
    if (slot.timeSetting !== expected.timeSetting) {
      timesettingMatch = false;
      issues.push({
        code: 'EXPORT_TIMESETTING_ORIGINAL_MISMATCH',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: timeSetting char_delta=${timeDelta}`,
        severity: 'error',
      });
    }

    if (!slot.scenario || slot.scenario.trim().length === 0) {
      scenarioOnly = false;
      issues.push({
        code: 'SCENARIO_NOT_GENERATED',
        message: `${exportVersion}:${exportPath}[${slotIndex}]: scenario empty`,
        severity: 'error',
      });
    }

    for (const [field, expectedValue, actualValue] of [
      ['artStyle', expected.artStyle, slot.artStyle],
      ['character', expected.character, slot.character],
      ['timeSetting', expected.timeSetting, slot.timeSetting],
    ] as const) {
      accumulateTokenDrift(
        expectedValue,
        actualValue,
        metrics,
        issues,
        `${exportVersion}:${exportPath}[${slotIndex}] ${field}`
      );
    }
  });

  return { artstyleMatch, characterMatch, timesettingMatch, scenarioOnly };
}

export function runApprovedOriginalAudit(root: string): ApprovedOriginalAuditReport {
  ensureApprovedOriginalsFrozen(root);
  ensureSourceOfTruthFrozen(root);
  writeMovieMasterDatasetBindings(root);
  writeMovieImageAppNativeImports(root);
  writeMovieImageAppNativeImportV7Datasets(root);

  const issues: ValidationIssue[] = [];
  const metrics: ApprovedOriginalAuditReport['metrics'] = {
    artstyle_match_rate: 0,
    character_match_rate: 0,
    timesetting_match_rate: 0,
    artstyle_char_delta: 0,
    character_char_delta: 0,
    timesetting_char_delta: 0,
    char_delta: 0,
    line_delta: 0,
    token_delta: 0,
    extra_token_count: 0,
    missing_token_count: 0,
    rewritten_token_count: 0,
    slots_audited: 0,
    export_files_audited: 0,
  };

  const approvedExists = [ARTSTYLE_APPROVED_PATH, CHARACTER_APPROVED_PATH].every((rel) =>
    fs.existsSync(path.join(root, rel))
  );
  if (!approvedExists) {
    issues.push({
      code: 'APPROVED_ORIGINALS_MISSING',
      message: 'approved_originals files missing',
      severity: 'error',
    });
  }

  const approvedArtStyle = copyApprovedOriginalArtStyle(root);
  const approvedCharacters = loadApprovedOriginalCharacterPrompts(root);
  const approvedTimeSettings = loadApprovedOriginalTimeSettingPrompts(root);

  for (const characterId of REQUIRED_APPROVED_CHARACTER_IDS) {
    if (!approvedCharacters[characterId]) {
      issues.push({
        code: 'APPROVED_CHARACTER_MISSING',
        message: `approved_originals missing character block for ${characterId}`,
        severity: 'error',
      });
    }
  }

  const sourceArtStyle = readRawText(root, SOURCE_OF_TRUTH_ARTSTYLE_PATH);
  const sourceCharacters = loadSourceOfTruthCharacterPrompts(root);
  const sourceTimeSettings = loadSourceOfTruthTimeSettingPrompts(root);

  const approvedArtstyleDelta = charDelta(approvedArtStyle, sourceArtStyle);
  metrics.artstyle_char_delta = Math.max(metrics.artstyle_char_delta, approvedArtstyleDelta);
  metrics.line_delta = Math.max(metrics.line_delta, lineDelta(readRawText(root, ARTSTYLE_APPROVED_PATH), sourceArtStyle));
  const approvedVsSourceArtstyleMatch = approvedArtStyle === sourceArtStyle;
  if (!approvedVsSourceArtstyleMatch) {
    issues.push({
      code: 'SOURCE_OF_TRUTH_ARTSTYLE_DRIFT',
      message: `source_of_truth/artstyle.txt differs from approved_originals by ${approvedArtstyleDelta} chars`,
      severity: 'error',
    });
    accumulateTokenDrift(approvedArtStyle, sourceArtStyle, metrics, issues, 'approved_vs_source_of_truth artStyle');
  }

  const characterSourceCompare = compareJsonMaps(approvedCharacters, sourceCharacters);
  metrics.character_char_delta = Math.max(metrics.character_char_delta, characterSourceCompare.maxCharDelta);
  metrics.line_delta = Math.max(metrics.line_delta, characterSourceCompare.maxLineDelta);
  const approvedVsSourceCharacterMatch = characterSourceCompare.match;
  if (!approvedVsSourceCharacterMatch) {
    issues.push({
      code: 'SOURCE_OF_TRUTH_CHARACTER_DRIFT',
      message: 'source_of_truth/character-prompts.json differs from approved_originals',
      severity: 'error',
    });
  }

  const timeSourceCompare = compareJsonMaps(approvedTimeSettings, sourceTimeSettings);
  metrics.timesetting_char_delta = Math.max(metrics.timesetting_char_delta, timeSourceCompare.maxCharDelta);
  metrics.line_delta = Math.max(metrics.line_delta, timeSourceCompare.maxLineDelta);
  const approvedVsSourceTimesettingMatch = timeSourceCompare.match;
  if (!approvedVsSourceTimesettingMatch) {
    issues.push({
      code: 'SOURCE_OF_TRUTH_TIMESETTING_DRIFT',
      message: 'source_of_truth/timesetting-prompts.json differs from approved raw_timeSetting library',
      severity: 'error',
    });
  }

  const promptArtStyle = copyImageAppArtStylePrompt(root);
  const promptCharacters = loadCanonicalCharacterPromptsV2(root);
  const promptTimeSettings = loadCanonicalTimeSettingPrompts(root);

  const approvedPromptArtDelta = charDelta(approvedArtStyle, promptArtStyle);
  metrics.artstyle_char_delta = Math.max(metrics.artstyle_char_delta, approvedPromptArtDelta);
  const approvedVsPromptsArtstyleMatch = approvedArtStyle === promptArtStyle;
  if (!approvedVsPromptsArtstyleMatch) {
    issues.push({
      code: 'PROMPTS_ARTSTYLE_DRIFT',
      message: `${CANONICAL_ARTSTYLE_PROMPT_PATH} differs from approved_originals by ${approvedPromptArtDelta} chars`,
      severity: 'error',
    });
  }

  const characterPromptCompare = compareJsonMaps(approvedCharacters, promptCharacters);
  metrics.character_char_delta = Math.max(metrics.character_char_delta, characterPromptCompare.maxCharDelta);
  const approvedVsPromptsCharacterMatch = characterPromptCompare.match;
  if (!approvedVsPromptsCharacterMatch) {
    issues.push({
      code: 'PROMPTS_CHARACTER_DRIFT',
      message: `${CANONICAL_CHARACTER_PROMPTS_V2_PATH} differs from approved_originals`,
      severity: 'error',
    });
  }

  const timePromptCompare = compareJsonMaps(approvedTimeSettings, promptTimeSettings);
  metrics.timesetting_char_delta = Math.max(metrics.timesetting_char_delta, timePromptCompare.maxCharDelta);
  const approvedVsPromptsTimesettingMatch = timePromptCompare.match;
  if (!approvedVsPromptsTimesettingMatch) {
    issues.push({
      code: 'PROMPTS_TIMESETTING_DRIFT',
      message: `${CANONICAL_TIMESETTING_PROMPTS_PATH} differs from approved raw_timeSetting library`,
      severity: 'error',
    });
  }

  let exportsArtstyleMatch = true;
  let exportsCharacterMatch = true;
  let exportsTimesettingMatch = true;
  let scenarioGenerationOnly = true;

  const exportSpecs = [
    ...NATIVE_IMPORT_V7_OUTPUTS.map((spec) => ({ ...spec, version: 'v7' as const })),
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

    let slots: Array<{ artStyle: string; character: string; timeSetting: string; scenario: string }> | null =
      null;
    if (spec.version === 'v7') {
      slots = loadMovieImageAppNativeImportV7Dataset(root, spec.movie_id)?.slots ?? null;
    } else if (spec.version === 'v6') {
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
      scenarioGenerationOnly = false;
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
    scenarioGenerationOnly = scenarioGenerationOnly && result.scenarioOnly;
  }

  const artstyleOriginalMatch =
    approvedVsSourceArtstyleMatch && approvedVsPromptsArtstyleMatch && exportsArtstyleMatch;
  const characterOriginalMatch =
    approvedVsSourceCharacterMatch && approvedVsPromptsCharacterMatch && exportsCharacterMatch;
  const timesettingOriginalMatch =
    approvedVsSourceTimesettingMatch && approvedVsPromptsTimesettingMatch && exportsTimesettingMatch;

  metrics.artstyle_match_rate = artstyleOriginalMatch ? 1 : 0;
  metrics.character_match_rate = characterOriginalMatch ? 1 : 0;
  metrics.timesetting_match_rate = timesettingOriginalMatch ? 1 : 0;

  const approvedOriginalLocked = approvedExists && Object.keys(approvedCharacters).length === 13;
  const artstyleOriginalRestored = approvedArtstyleDelta === 0 && approvedVsSourceArtstyleMatch;
  const characterOriginalRestored =
    characterSourceCompare.match && Object.keys(approvedCharacters).length === 13;
  const timesettingLocked = timeSourceCompare.match;
  const hasExtraTokens = metrics.extra_token_count > 0;
  const hasMissingTokens = metrics.missing_token_count > 0;
  const hasRewrittenTokens = metrics.rewritten_token_count > 0;
  const imageAppImportReady =
    exportsArtstyleMatch &&
    exportsCharacterMatch &&
    exportsTimesettingMatch &&
    scenarioGenerationOnly &&
    !hasExtraTokens &&
    !hasMissingTokens &&
    !hasRewrittenTokens;

  const validationPassed =
    approvedOriginalLocked &&
    artstyleOriginalRestored &&
    characterOriginalRestored &&
    timesettingLocked &&
    scenarioGenerationOnly &&
    imageAppImportReady &&
    metrics.char_delta === 0 &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'REAL_SOURCE_RECOVERY_REPORT',
    phase: APPROVED_ORIGINALS_PHASE,
    system_id: APPROVED_ORIGINALS_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? APPROVED_ORIGINAL_AUDIT_PASS_VERDICT
      : APPROVED_ORIGINAL_AUDIT_FAIL_VERDICT,
    validation_passed: validationPassed,
    approved_original_locked: approvedOriginalLocked,
    artstyle_original_restored: artstyleOriginalRestored,
    character_original_restored: characterOriginalRestored,
    timesetting_locked: timesettingLocked,
    scenario_generation_only: scenarioGenerationOnly,
    image_app_import_ready: imageAppImportReady,
    checks: {
      artstyle_original_match: artstyleOriginalMatch,
      character_original_match: characterOriginalMatch,
      timesetting_original_match: timesettingOriginalMatch,
      approved_vs_source_of_truth_artstyle_match: approvedVsSourceArtstyleMatch,
      approved_vs_source_of_truth_character_match: approvedVsSourceCharacterMatch,
      approved_vs_source_of_truth_timesetting_match: approvedVsSourceTimesettingMatch,
      approved_vs_prompts_artstyle_match: approvedVsPromptsArtstyleMatch,
      approved_vs_prompts_character_match: approvedVsPromptsCharacterMatch,
      approved_vs_prompts_timesetting_match: approvedVsPromptsTimesettingMatch,
      approved_vs_exports_artstyle_match: exportsArtstyleMatch,
      approved_vs_exports_character_match: exportsCharacterMatch,
      approved_vs_exports_timesetting_match: exportsTimesettingMatch,
      extra_tokens: !hasExtraTokens,
      missing_tokens: !hasMissingTokens,
      rewritten_tokens: !hasRewrittenTokens,
    },
    metrics,
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeApprovedOriginalAuditReport(projectRoot?: string): ApprovedOriginalAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runApprovedOriginalAudit(root);
  writeJson(root, APPROVED_ORIGINAL_AUDIT_REPORT_PATH, report);
  return report;
}

export { APPROVED_ORIGINALS_DIR, SAFE_CREATE_POLICY };
