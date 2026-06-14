import fs from 'node:fs';
import path from 'node:path';
import {
  APPROVED_ORIGINALS_MANIFEST_PATH,
  ARTSTYLE_APPROVED_PATH,
  CHARACTER_APPROVED_PATH,
  FINAL_SOURCE_LOCK_PHASE,
  FINAL_SOURCE_LOCK_SYSTEM_ID,
  TIMESETTING_APPROVED_PATH,
  assertApprovedOriginalsPresent,
  copyApprovedOriginalArtStyle,
  copyApprovedOriginalTimeSettingPrompt,
} from './approvedOriginalsLoader.js';
import { copySourceOfTruthCharacterFieldFromGraph } from './sourceOfTruthLoader.js';
import { compareSourcePromptTokenDrift } from './sourcePromptLockAudit.js';
import {
  FINAL_SOURCE_LOCK_BUILDER_PATHS,
  FINAL_SOURCE_LOCK_FAIL_VERDICT,
  FINAL_SOURCE_LOCK_PASS_VERDICT,
  runFinalSourceLockValidation,
} from './finalSourceLockValidation.js';
import {
  loadAllMovieMasterDatasetBindingDatasets,
  writeMovieMasterDatasetBindings,
} from './movieMasterDatasetBinding.js';
import {
  NATIVE_IMPORT_V8_OUTPUTS,
  loadMovieImageAppNativeImportV8Dataset,
  writeMovieImageAppNativeImportV8Datasets,
} from './movieImageAppNativeImportBuilder.js';
import {
  MovieSpatialGraph,
  loadMovieSpatialGraphDataset,
} from './movieSpatialGraphBuilder.js';
import { FORBIDDEN_LEGACY_SOURCE_PATHS, isForbiddenLegacySourceRef } from './forbiddenLegacySourcePaths.js';
import { resolveLockedTimeSettingId } from './movieTimeSettingLock.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const FINAL_SOURCE_LOCK_REPORT_PATH =
  'reports/generation_context/FINAL_SOURCE_LOCK_REPORT.json' as const;

const EXECUTION_FLAGS = {
  design_only: true as const,
  gpu_execution: false as const,
  image_generation: false as const,
  video_generation: false as const,
  rendering: false as const,
};

type IssueSeverity = 'error' | 'warning';

interface AuditIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface FieldOriginAuditRecord {
  field_name: 'artStyle' | 'character' | 'timeSetting' | 'scenario';
  source_file: string;
  copy_only: boolean;
  char_delta: number;
  token_delta: number;
}

export interface FinalSourceLockAuditReport {
  report_id: string;
  phase: typeof FINAL_SOURCE_LOCK_PHASE;
  system_id: typeof FINAL_SOURCE_LOCK_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  approved_originals_locked: boolean;
  artstyle_copy_only: boolean;
  character_copy_only: boolean;
  timesetting_copy_only: boolean;
  scenario_generation_only: boolean;
  image_app_export_v8_ready: boolean;
  metrics: {
    approved_original_files: number;
    builder_count: number;
    copy_operations: number;
    generation_operations: number;
    legacy_reference_count: number;
    char_delta: number;
    token_delta: number;
    slots_audited: number;
  };
  field_origins: FieldOriginAuditRecord[];
  issues: AuditIssue[];
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

function auditCopyField(
  fieldName: 'artStyle' | 'character' | 'timeSetting',
  sourceFile: string,
  expected: string,
  actual: string,
  metrics: FinalSourceLockAuditReport['metrics'],
  fieldOrigins: FieldOriginAuditRecord[],
  issues: AuditIssue[],
  context: string
): boolean {
  const delta = charDelta(expected, actual);
  const drift = compareSourcePromptTokenDrift(expected, actual);
  const tokenDelta =
    drift.extra_tokens.length + drift.missing_tokens.length + drift.rewritten_tokens.length;

  metrics.copy_operations += 1;
  metrics.char_delta = Math.max(metrics.char_delta, delta);
  metrics.token_delta += tokenDelta;

  fieldOrigins.push({
    field_name: fieldName,
    source_file: sourceFile,
    copy_only: true,
    char_delta: delta,
    token_delta: tokenDelta,
  });

  if (expected !== actual) {
    issues.push({
      code: 'COPY_FIELD_MISMATCH',
      message: `${context} ${fieldName}: char_delta=${delta}`,
      severity: 'error',
    });
    return false;
  }

  if (tokenDelta > 0) {
    issues.push({
      code: 'COPY_FIELD_TOKEN_DRIFT',
      message: `${context} ${fieldName}: token_delta=${tokenDelta}`,
      severity: 'error',
    });
    return false;
  }

  return true;
}

function collectLegacyReferences(root: string, issues: AuditIssue[]): number {
  let count = 0;

  const bindingDatasets = loadAllMovieMasterDatasetBindingDatasets(root);
  for (const dataset of bindingDatasets) {
    for (const ref of [
      dataset.master_binding_policy.artStyle.source,
      dataset.master_binding_policy.timeSetting.source,
      dataset.master_binding_policy.character.source,
    ]) {
      if (isForbiddenLegacySourceRef(ref)) {
        count += 1;
        issues.push({
          code: 'LEGACY_POLICY_REFERENCE',
          message: `Binding policy references legacy source ${ref}`,
          severity: 'error',
        });
      }
    }

    for (const binding of dataset.scene_bindings) {
      for (const ref of [
        binding.art_style_ref,
        binding.time_setting_ref,
        binding.character_ref,
        binding.field_binding.artStyle.source_ref,
        binding.field_binding.timeSetting.source_ref,
        binding.field_binding.character.source_ref,
      ]) {
        if (isForbiddenLegacySourceRef(ref)) {
          count += 1;
          issues.push({
            code: 'LEGACY_BINDING_REFERENCE',
            message: `${binding.scene_id} references legacy source ${ref}`,
            severity: 'error',
          });
        }
      }
    }
  }

  return count;
}

function auditV8Slots(
  root: string,
  metrics: FinalSourceLockAuditReport['metrics'],
  fieldOrigins: FieldOriginAuditRecord[],
  issues: AuditIssue[]
): {
  artstyleCopyOnly: boolean;
  characterCopyOnly: boolean;
  timesettingCopyOnly: boolean;
  scenarioGenerationOnly: boolean;
} {
  let artstyleCopyOnly = true;
  let characterCopyOnly = true;
  let timesettingCopyOnly = true;
  let scenarioGenerationOnly = true;

  for (const spec of NATIVE_IMPORT_V8_OUTPUTS) {
    const dataset = loadMovieImageAppNativeImportV8Dataset(root, spec.movie_id);
    const graphDataset = loadMovieSpatialGraphDataset(root, spec.movie_id);
    if (!dataset || !graphDataset) {
      issues.push({
        code: 'V8_EXPORT_MISSING',
        message: `Missing v8 export or graph for ${spec.movie_id}`,
        severity: 'error',
      });
      artstyleCopyOnly = false;
      characterCopyOnly = false;
      timesettingCopyOnly = false;
      scenarioGenerationOnly = false;
      continue;
    }

    graphDataset.spatial_graphs.forEach((graph, slotIndex) => {
      const slot = dataset.slots[slotIndex];
      if (!slot) {
        issues.push({
          code: 'V8_SLOT_MISSING',
          message: `${spec.movie_id}[${slotIndex}] missing`,
          severity: 'error',
        });
        return;
      }

      metrics.slots_audited += 1;
      const timeSettingId = resolveLockedTimeSettingId(graph);
      const expectedArtStyle = copyApprovedOriginalArtStyle(root);
      const expectedCharacter = copySourceOfTruthCharacterFieldFromGraph(graph, root);
      const expectedTimeSetting = copyApprovedOriginalTimeSettingPrompt(timeSettingId, root);
      const context = `v8:${spec.output_path}[${slotIndex}]`;

      artstyleCopyOnly =
        auditCopyField(
          'artStyle',
          ARTSTYLE_APPROVED_PATH,
          expectedArtStyle,
          slot.artStyle,
          metrics,
          fieldOrigins,
          issues,
          context
        ) && artstyleCopyOnly;

      characterCopyOnly =
        auditCopyField(
          'character',
          CHARACTER_APPROVED_PATH,
          expectedCharacter,
          slot.character,
          metrics,
          fieldOrigins,
          issues,
          context
        ) && characterCopyOnly;

      timesettingCopyOnly =
        auditCopyField(
          'timeSetting',
          TIMESETTING_APPROVED_PATH,
          expectedTimeSetting,
          slot.timeSetting,
          metrics,
          fieldOrigins,
          issues,
          context
        ) && timesettingCopyOnly;

      metrics.generation_operations += 1;
      const scenarioGenerated = Boolean(slot.scenario && slot.scenario.trim().length > 0);
      fieldOrigins.push({
        field_name: 'scenario',
        source_file: dataset.source_spatial_graph_ref,
        copy_only: false,
        char_delta: 0,
        token_delta: 0,
      });

      if (!scenarioGenerated) {
        scenarioGenerationOnly = false;
        issues.push({
          code: 'SCENARIO_NOT_GENERATED',
          message: `${context}: scenario empty`,
          severity: 'error',
        });
      }
    });
  }

  return { artstyleCopyOnly, characterCopyOnly, timesettingCopyOnly, scenarioGenerationOnly };
}

export function runFinalSourceLockAudit(root: string): FinalSourceLockAuditReport {
  const validation = runFinalSourceLockValidation(root);
  assertApprovedOriginalsPresent(root);
  writeMovieMasterDatasetBindings(root);
  writeMovieImageAppNativeImportV8Datasets(root);

  const issues: AuditIssue[] = validation.issues.map((issue) => ({ ...issue }));
  const metrics: FinalSourceLockAuditReport['metrics'] = {
    approved_original_files: 4,
    builder_count: FINAL_SOURCE_LOCK_BUILDER_PATHS.length,
    copy_operations: 0,
    generation_operations: 0,
    legacy_reference_count: 0,
    char_delta: 0,
    token_delta: 0,
    slots_audited: 0,
  };
  const fieldOrigins: FieldOriginAuditRecord[] = [];

  metrics.legacy_reference_count = collectLegacyReferences(root, issues);

  for (const forbidden of FORBIDDEN_LEGACY_SOURCE_PATHS) {
    if (forbidden.includes('source_of_truth') || forbidden.includes('prompts')) {
      continue;
    }
  }

  const slotAudit = auditV8Slots(root, metrics, fieldOrigins, issues);

  const approvedOriginalsLocked = validation.checks.approved_originals_only;
  const imageAppExportV8Ready =
    slotAudit.artstyleCopyOnly &&
    slotAudit.characterCopyOnly &&
    slotAudit.timesettingCopyOnly &&
    slotAudit.scenarioGenerationOnly &&
    metrics.legacy_reference_count === 0 &&
    metrics.char_delta === 0 &&
    metrics.token_delta === 0;

  const validationPassed =
    validation.validation_passed &&
    approvedOriginalsLocked &&
    slotAudit.artstyleCopyOnly &&
    slotAudit.characterCopyOnly &&
    slotAudit.timesettingCopyOnly &&
    slotAudit.scenarioGenerationOnly &&
    metrics.legacy_reference_count === 0 &&
    metrics.char_delta === 0 &&
    metrics.token_delta === 0 &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'FINAL_SOURCE_LOCK_REPORT',
    phase: FINAL_SOURCE_LOCK_PHASE,
    system_id: FINAL_SOURCE_LOCK_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? FINAL_SOURCE_LOCK_PASS_VERDICT : FINAL_SOURCE_LOCK_FAIL_VERDICT,
    validation_passed: validationPassed,
    approved_originals_locked: approvedOriginalsLocked,
    artstyle_copy_only: slotAudit.artstyleCopyOnly,
    character_copy_only: slotAudit.characterCopyOnly,
    timesetting_copy_only: slotAudit.timesettingCopyOnly,
    scenario_generation_only: slotAudit.scenarioGenerationOnly,
    image_app_export_v8_ready: imageAppExportV8Ready,
    metrics,
    field_origins: fieldOrigins,
    issues,
    execution_flags: { ...EXECUTION_FLAGS },
  };
}

export function writeFinalSourceLockAuditReport(projectRoot?: string): FinalSourceLockAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const report = runFinalSourceLockAudit(root);
  writeJson(root, FINAL_SOURCE_LOCK_REPORT_PATH, report);
  return report;
}

export { FINAL_SOURCE_LOCK_PASS_VERDICT, FINAL_SOURCE_LOCK_FAIL_VERDICT } from './finalSourceLockValidation.js';
export { SAFE_CREATE_POLICY, APPROVED_ORIGINALS_MANIFEST_PATH };
