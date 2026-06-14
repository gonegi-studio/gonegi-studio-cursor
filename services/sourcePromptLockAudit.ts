import fs from 'node:fs';
import path from 'node:path';
import { detectArtStyleIdOnly, detectCharacterDnaMarker, detectMetadataFields, detectTimesettingMetadataFormat } from './imageAppPromptLoader.js';
import {
  copySourceOfTruthArtStyle,
  copySourceOfTruthCharacterFieldFromGraph,
  copySourceOfTruthTimeSettingPrompt,
  SOURCE_OF_TRUTH_DIR,
  SOURCE_OF_TRUTH_MANIFEST_PATH,
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

export const SOURCE_PROMPT_LOCK_AUDIT_PHASE = 'PHASE-GENERATION-CONTEXT-003' as const;
export const SOURCE_PROMPT_LOCK_AUDIT_SYSTEM_ID = 'SOURCE_PROMPT_LOCK_AUDIT_V1' as const;
export const SOURCE_PROMPT_LOCK_AUDIT_PASS_VERDICT = 'PASS_SOURCE_PROMPT_LOCK_AUDIT_V1' as const;
export const SOURCE_PROMPT_LOCK_AUDIT_FAIL_VERDICT = 'FAIL_SOURCE_PROMPT_LOCK_AUDIT_V1' as const;
export const SOURCE_PROMPT_LOCK_AUDIT_REPORT_PATH =
  'reports/generation_context/SOURCE_PROMPT_LOCK_AUDIT_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

const SERIALIZER_TOKEN_PATTERNS = [
  '[CHARACTER_DNA]',
  '[TIME_SETTING]',
  'character_id=',
  'time_id=',
  'location_id=',
  'lighting_id=',
  'weather_id=',
  'color_temperature=',
  'atmosphere=',
  'display_name_en=',
  'visual_identity=',
  'Ghibli Mediterranean Chronicles v17.5',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface SourcePromptTokenDrift {
  extra_tokens: string[];
  missing_tokens: string[];
  rewritten_tokens: string[];
  serializer_generated_tokens: string[];
}

export interface SourcePromptSlotAudit {
  movie_id: string;
  export_path: string;
  export_version: 'v1' | 'v5' | 'v6';
  scene_id: string;
  slot_index: number;
  artstyle_exact_match: boolean;
  character_exact_match: boolean;
  timesetting_exact_match: boolean;
  artstyle_char_delta: number;
  character_char_delta: number;
  timesetting_char_delta: number;
  artstyle_token_drift: SourcePromptTokenDrift;
  character_token_drift: SourcePromptTokenDrift;
  timesetting_token_drift: SourcePromptTokenDrift;
}

export interface SourcePromptLockAuditReport {
  report_id: string;
  phase: typeof SOURCE_PROMPT_LOCK_AUDIT_PHASE;
  system_id: typeof SOURCE_PROMPT_LOCK_AUDIT_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  prompt_copy_verified: boolean;
  rewrite_detected: boolean;
  serializer_detected: boolean;
  token_drift_detected: boolean;
  source_prompt_dir: typeof GENERATION_PROMPT_DIR;
  source_prompt_manifest_ref: typeof GENERATION_PROMPT_MANIFEST_PATH;
  export_targets: string[];
  checks: {
    artstyle_exact_match: boolean;
    character_exact_match: boolean;
    timesetting_exact_match: boolean;
    extra_tokens: boolean;
    missing_tokens: boolean;
    rewritten_tokens: boolean;
    serializer_generated_tokens: boolean;
  };
  metrics: {
    slots_audited: number;
    export_files_audited: number;
    artstyle_mismatch_count: number;
    character_mismatch_count: number;
    timesetting_mismatch_count: number;
    extra_token_count: number;
    missing_token_count: number;
    rewritten_token_count: number;
    serializer_token_count: number;
    max_artstyle_char_delta: number;
    max_character_char_delta: number;
    max_timesetting_char_delta: number;
  };
  slot_samples: SourcePromptSlotAudit[];
  issues: ValidationIssue[];
  execution_flags: typeof EXECUTION_FLAGS;
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
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

function detectSerializerGeneratedTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const pattern of SERIALIZER_TOKEN_PATTERNS) {
    if (text.includes(pattern)) {
      tokens.push(pattern);
    }
  }
  if (detectArtStyleIdOnly(text)) {
    tokens.push('artstyle_id_alias');
  }
  if (detectCharacterDnaMarker(text)) {
    tokens.push('character_dna_marker');
  }
  if (detectMetadataFields(text)) {
    tokens.push('metadata_field_syntax');
  }
  if (detectTimesettingMetadataFormat(text)) {
    tokens.push('timesetting_metadata_block');
  }
  return [...new Set(tokens)];
}

export function compareSourcePromptTokenDrift(source: string, actual: string): SourcePromptTokenDrift {
  const sourceTokens = tokenize(source);
  const actualTokens = tokenize(actual);
  const extra_tokens: string[] = [];
  const missing_tokens: string[] = [];
  const rewritten_tokens: string[] = [];

  const maxLen = Math.max(sourceTokens.length, actualTokens.length);
  for (let index = 0; index < maxLen; index += 1) {
    const sourceToken = sourceTokens[index];
    const actualToken = actualTokens[index];
    if (sourceToken === undefined && actualToken !== undefined) {
      extra_tokens.push(actualToken);
    } else if (actualToken === undefined && sourceToken !== undefined) {
      missing_tokens.push(sourceToken);
    } else if (sourceToken !== actualToken) {
      rewritten_tokens.push(`${sourceToken}->${actualToken}`);
    }
  }

  const serializer_generated_tokens = detectSerializerGeneratedTokens(actual);

  return {
    extra_tokens,
    missing_tokens,
    rewritten_tokens,
    serializer_generated_tokens,
  };
}

function buildExpectedPrompts(
  graph: MovieSpatialGraph,
  root: string
): { artStyle: string; character: string; timeSetting: string } {
  const timeSettingId = resolveLockedTimeSettingId(graph);
  return {
    artStyle: copySourceOfTruthArtStyle(root),
    character: copySourceOfTruthCharacterFieldFromGraph(graph, root),
    timeSetting: copySourceOfTruthTimeSettingPrompt(timeSettingId, root),
  };
}

function auditSlot(
  prefix: string,
  movieId: string,
  exportPath: string,
  exportVersion: 'v1' | 'v5',
  graph: MovieSpatialGraph,
  slotIndex: number,
  slot: { artStyle: string; character: string; timeSetting: string },
  root: string,
  issues: ValidationIssue[]
): SourcePromptSlotAudit {
  const expected = buildExpectedPrompts(graph, root);

  const artstyle_exact_match = slot.artStyle === expected.artStyle;
  const character_exact_match = slot.character === expected.character;
  const timesetting_exact_match = slot.timeSetting === expected.timeSetting;

  const artstyle_char_delta = charDelta(expected.artStyle, slot.artStyle);
  const character_char_delta = charDelta(expected.character, slot.character);
  const timesetting_char_delta = charDelta(expected.timeSetting, slot.timeSetting);

  const artstyle_token_drift = compareSourcePromptTokenDrift(expected.artStyle, slot.artStyle);
  const character_token_drift = compareSourcePromptTokenDrift(expected.character, slot.character);
  const timesetting_token_drift = compareSourcePromptTokenDrift(expected.timeSetting, slot.timeSetting);

  if (!artstyle_exact_match) {
    issues.push({
      code: 'ARTSTYLE_SOURCE_COPY_MISMATCH',
      message: `${prefix}: artStyle differs from canonical-artstyle-prompt.txt by ${artstyle_char_delta} character delta`,
      severity: 'error',
    });
  }
  if (!character_exact_match) {
    issues.push({
      code: 'CHARACTER_SOURCE_COPY_MISMATCH',
      message: `${prefix}: character differs from canonical-character-prompts-v2.json by ${character_char_delta} character delta`,
      severity: 'error',
    });
  }
  if (!timesetting_exact_match) {
    issues.push({
      code: 'TIMESETTING_SOURCE_COPY_MISMATCH',
      message: `${prefix}: timeSetting differs from canonical-timesetting-prompts.json by ${timesetting_char_delta} character delta`,
      severity: 'error',
    });
  }

  for (const token of artstyle_token_drift.serializer_generated_tokens) {
    issues.push({
      code: 'ARTSTYLE_SERIALIZER_TOKEN',
      message: `${prefix}: artStyle contains serializer token ${token}`,
      severity: 'error',
    });
  }
  for (const token of character_token_drift.serializer_generated_tokens) {
    issues.push({
      code: 'CHARACTER_SERIALIZER_TOKEN',
      message: `${prefix}: character contains serializer token ${token}`,
      severity: 'error',
    });
  }
  for (const token of timesetting_token_drift.serializer_generated_tokens) {
    issues.push({
      code: 'TIMESETTING_SERIALIZER_TOKEN',
      message: `${prefix}: timeSetting contains serializer token ${token}`,
      severity: 'error',
    });
  }

  return {
    movie_id: movieId,
    export_path: exportPath,
    export_version: exportVersion,
    scene_id: graph.scene_id,
    slot_index: slotIndex,
    artstyle_exact_match,
    character_exact_match,
    timesetting_exact_match,
    artstyle_char_delta,
    character_char_delta,
    timesetting_char_delta,
    artstyle_token_drift,
    character_token_drift,
    timesetting_token_drift,
  };
}

function auditExportDataset(
  movieId: string,
  exportPath: string,
  exportVersion: 'v1' | 'v5',
  slots: Array<{ artStyle: string; character: string; timeSetting: string }>,
  graphDataset: { spatial_graphs: MovieSpatialGraph[] },
  root: string,
  issues: ValidationIssue[],
  slotAudits: SourcePromptSlotAudit[]
): void {
  graphDataset.spatial_graphs.forEach((graph, slotIndex) => {
    const slot = slots[slotIndex];
    if (!slot) {
      issues.push({
        code: 'EXPORT_SLOT_MISSING',
        message: `${movieId}/${exportPath}: missing slot index ${slotIndex}`,
        severity: 'error',
      });
      return;
    }

    const prefix = `${exportVersion}:${movieId}[${slotIndex}]/${graph.scene_id}`;
    slotAudits.push(auditSlot(prefix, movieId, exportPath, exportVersion, graph, slotIndex, slot, root, issues));
  });
}

export function runSourcePromptLockAudit(root: string): SourcePromptLockAuditReport {
  ensureSourceOfTruthFrozen(root);
  writeMovieMasterDatasetBindings(root);
  writeMovieImageAppNativeImports(root);
  writeMovieImageAppNativeImportV6Datasets(root);

  const issues: ValidationIssue[] = [];
  const slotAudits: SourcePromptSlotAudit[] = [];
  const exportTargets = [
    ...NATIVE_IMPORT_V6_OUTPUTS.map((spec) => spec.output_path),
    ...NATIVE_IMPORT_V5_OUTPUTS.map((spec) => spec.output_path),
    ...IMAGE_APP_NATIVE_IMPORT_OUTPUTS.map((spec) => spec.output_path),
  ];

  let artstyleMismatchCount = 0;
  let characterMismatchCount = 0;
  let timesettingMismatchCount = 0;
  let extraTokenCount = 0;
  let missingTokenCount = 0;
  let rewrittenTokenCount = 0;
  let serializerTokenCount = 0;
  let maxArtstyleCharDelta = 0;
  let maxCharacterCharDelta = 0;
  let maxTimesettingCharDelta = 0;

  for (const spec of NATIVE_IMPORT_V6_OUTPUTS) {
    const graphDataset = loadMovieSpatialGraphDataset(root, spec.movie_id);
    const exportDataset = loadMovieImageAppNativeImportV6Dataset(root, spec.movie_id);
    if (!graphDataset || !exportDataset) {
      issues.push({
        code: 'V6_EXPORT_MISSING',
        message: `Missing v6 export or spatial graph for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    auditExportDataset(
      spec.movie_id,
      spec.output_path,
      'v6',
      exportDataset.slots,
      graphDataset,
      root,
      issues,
      slotAudits
    );
  }

  for (const spec of NATIVE_IMPORT_V5_OUTPUTS) {
    const graphDataset = loadMovieSpatialGraphDataset(root, spec.movie_id);
    const exportDataset = loadMovieImageAppNativeImportV5Dataset(root, spec.movie_id);
    if (!graphDataset || !exportDataset) {
      issues.push({
        code: 'V5_EXPORT_MISSING',
        message: `Missing v5 export or spatial graph for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    auditExportDataset(
      spec.movie_id,
      spec.output_path,
      'v5',
      exportDataset.slots,
      graphDataset,
      root,
      issues,
      slotAudits
    );
  }

  const v1Datasets = loadAllMovieImageAppNativeImportDatasets(root);
  for (const spec of IMAGE_APP_NATIVE_IMPORT_OUTPUTS) {
    const graphDataset = loadMovieSpatialGraphDataset(root, spec.movie_id);
    const exportDataset = v1Datasets.find((entry) => entry.movie_id === spec.movie_id);
    if (!graphDataset || !exportDataset) {
      issues.push({
        code: 'V1_EXPORT_MISSING',
        message: `Missing v1 export or spatial graph for movie_id=${spec.movie_id}`,
        severity: 'error',
      });
      continue;
    }

    auditExportDataset(
      spec.movie_id,
      spec.output_path,
      'v1',
      exportDataset.slots,
      graphDataset,
      root,
      issues,
      slotAudits
    );
  }

  for (const audit of slotAudits) {
    if (!audit.artstyle_exact_match) artstyleMismatchCount += 1;
    if (!audit.character_exact_match) characterMismatchCount += 1;
    if (!audit.timesetting_exact_match) timesettingMismatchCount += 1;

    maxArtstyleCharDelta = Math.max(maxArtstyleCharDelta, audit.artstyle_char_delta);
    maxCharacterCharDelta = Math.max(maxCharacterCharDelta, audit.character_char_delta);
    maxTimesettingCharDelta = Math.max(maxTimesettingCharDelta, audit.timesetting_char_delta);

    for (const drift of [audit.artstyle_token_drift, audit.character_token_drift, audit.timesetting_token_drift]) {
      extraTokenCount += drift.extra_tokens.length;
      missingTokenCount += drift.missing_tokens.length;
      rewrittenTokenCount += drift.rewritten_tokens.length;
      serializerTokenCount += drift.serializer_generated_tokens.length;
    }
  }

  const artstyleExactMatch = artstyleMismatchCount === 0;
  const characterExactMatch = characterMismatchCount === 0;
  const timesettingExactMatch = timesettingMismatchCount === 0;
  const hasExtraTokens = extraTokenCount > 0;
  const hasMissingTokens = missingTokenCount > 0;
  const hasRewrittenTokens = rewrittenTokenCount > 0;
  const hasSerializerTokens = serializerTokenCount > 0;

  const rewriteDetected = hasRewrittenTokens || hasExtraTokens || hasMissingTokens;
  const serializerDetected = hasSerializerTokens;
  const tokenDriftDetected = rewriteDetected || serializerDetected;
  const promptCopyVerified =
    artstyleExactMatch &&
    characterExactMatch &&
    timesettingExactMatch &&
    maxArtstyleCharDelta === 0 &&
    maxCharacterCharDelta === 0 &&
    maxTimesettingCharDelta === 0;

  const errors = issues.filter((issue) => issue.severity === 'error');
  const validationPassed =
    errors.length === 0 &&
    promptCopyVerified &&
    !rewriteDetected &&
    !serializerDetected &&
    !tokenDriftDetected;

  const mismatchSamples = slotAudits
    .filter(
      (audit) =>
        !audit.artstyle_exact_match ||
        !audit.character_exact_match ||
        !audit.timesetting_exact_match ||
        audit.artstyle_token_drift.serializer_generated_tokens.length > 0 ||
        audit.character_token_drift.serializer_generated_tokens.length > 0 ||
        audit.timesetting_token_drift.serializer_generated_tokens.length > 0
    )
    .slice(0, 12);

  return {
    report_id: `source_prompt_lock_audit_${Date.now().toString(36)}`,
    phase: SOURCE_PROMPT_LOCK_AUDIT_PHASE,
    system_id: SOURCE_PROMPT_LOCK_AUDIT_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed
      ? SOURCE_PROMPT_LOCK_AUDIT_PASS_VERDICT
      : SOURCE_PROMPT_LOCK_AUDIT_FAIL_VERDICT,
    validation_passed: validationPassed,
    prompt_copy_verified: promptCopyVerified,
    rewrite_detected: rewriteDetected,
    serializer_detected: serializerDetected,
    token_drift_detected: tokenDriftDetected,
    source_prompt_dir: SOURCE_OF_TRUTH_DIR,
    source_prompt_manifest_ref: SOURCE_OF_TRUTH_MANIFEST_PATH,
    export_targets: exportTargets,
    checks: {
      artstyle_exact_match: artstyleExactMatch,
      character_exact_match: characterExactMatch,
      timesetting_exact_match: timesettingExactMatch,
      extra_tokens: hasExtraTokens,
      missing_tokens: hasMissingTokens,
      rewritten_tokens: hasRewrittenTokens,
      serializer_generated_tokens: hasSerializerTokens,
    },
    metrics: {
      slots_audited: slotAudits.length,
      export_files_audited: exportTargets.length,
      artstyle_mismatch_count: artstyleMismatchCount,
      character_mismatch_count: characterMismatchCount,
      timesetting_mismatch_count: timesettingMismatchCount,
      extra_token_count: extraTokenCount,
      missing_token_count: missingTokenCount,
      rewritten_token_count: rewrittenTokenCount,
      serializer_token_count: serializerTokenCount,
      max_artstyle_char_delta: maxArtstyleCharDelta,
      max_character_char_delta: maxCharacterCharDelta,
      max_timesetting_char_delta: maxTimesettingCharDelta,
    },
    slot_samples: mismatchSamples.length > 0 ? mismatchSamples : slotAudits.slice(0, 3),
    issues: issues.slice(0, 100),
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeSourcePromptLockAuditReport(projectRoot?: string): SourcePromptLockAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runSourcePromptLockAudit(root);
  writeJson(root, SOURCE_PROMPT_LOCK_AUDIT_REPORT_PATH, report);
  return report;
}

export {
  SAFE_CREATE_POLICY,
  NATIVE_IMPORT_V5_OUTPUTS,
  IMAGE_APP_NATIVE_IMPORT_OUTPUTS,
  compareSourcePromptTokenDrift as comparePromptTokenDrift,
};
