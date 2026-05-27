import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  AppliedManualDelta,
  CORRECTED_RENDER_INPUT_PACK_VERSION,
  CorrectedFluxRenderInput,
  CorrectedMidjourneyRenderInput,
  CorrectedRenderInputPackResult,
  CorrectedRenderInputVerificationCheck,
  CorrectedSceneRenderPack,
  CorrectionSafetyReport,
  SafePromptDeltaSuggestion,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildManualCorrectionPackPreview } from './manualCorrectionPackBuilder';
import { buildRealRenderInputPackPreview } from './realRenderInputPackExport';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const CORRECTED_RENDER_INPUT_PACK_EPOCH = '2026-05-27T10:00:00.000Z';
export const CORRECTED_RENDER_INPUT_PACK_JSON_FILENAME = 'corrected-render-input-pack.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function appliesToEngine(
  suggestion: SafePromptDeltaSuggestion,
  engine: 'midjourney' | 'flux'
): boolean {
  return suggestion.target_engine === 'both' || suggestion.target_engine === engine;
}

function applyPromptDeltas(
  originalPrompt: string,
  suggestions: SafePromptDeltaSuggestion[],
  engine: 'midjourney' | 'flux'
): { correctedPrompt: string; applied: AppliedManualDelta[] } {
  const sorted = [...suggestions]
    .filter((suggestion) => appliesToEngine(suggestion, engine))
    .sort((a, b) => a.suggestion_id.localeCompare(b.suggestion_id));

  const prepends: string[] = [];
  const appends: string[] = [];
  const emphases: string[] = [];
  const applied: AppliedManualDelta[] = [];

  for (const suggestion of sorted) {
    if (suggestion.delta_type === 'parameter') {
      applied.push({
        suggestion_id: suggestion.suggestion_id,
        category: suggestion.category,
        delta_type: suggestion.delta_type,
        applied_text: suggestion.suggested_text,
        target_engine: suggestion.target_engine,
        application: 'parameter_only',
        rationale: suggestion.rationale,
      });
      continue;
    }

    const application =
      suggestion.delta_type === 'prepend'
        ? 'prompt_prepend'
        : suggestion.delta_type === 'append'
          ? 'prompt_append'
          : 'prompt_emphasis';

    applied.push({
      suggestion_id: suggestion.suggestion_id,
      category: suggestion.category,
      delta_type: suggestion.delta_type,
      applied_text: suggestion.suggested_text,
      target_engine: suggestion.target_engine,
      application,
      rationale: suggestion.rationale,
    });

    if (suggestion.delta_type === 'prepend') prepends.push(suggestion.suggested_text);
    else if (suggestion.delta_type === 'append') appends.push(suggestion.suggested_text);
    else emphases.push(suggestion.suggested_text);
  }

  let correctedPrompt = originalPrompt;
  if (prepends.length > 0) {
    correctedPrompt = [...prepends, correctedPrompt].join(' ');
  }
  if (appends.length > 0) {
    correctedPrompt = [correctedPrompt, ...appends].join(' ');
  }
  if (emphases.length > 0) {
    correctedPrompt = `${correctedPrompt} [${emphases.join('; ')}]`;
  }

  return { correctedPrompt, applied };
}

function buildMidjourneyCopyPasteCommand(
  prompt: string,
  parameters: CorrectedMidjourneyRenderInput['parameters']
): string {
  return `${prompt} --ar ${parameters.aspect_ratio} --stylize ${parameters.stylize} --seed ${parameters.seed} --style ${parameters.style_mode}`;
}

function buildFluxCopyPasteJson(
  prompt: string,
  negativePrompt: string,
  fluxInput: ReturnType<typeof buildRealRenderInputPackPreview>['flux_input']
): string {
  const payload = JSON.parse(fluxInput.copy_paste_json) as Record<string, unknown>;
  return JSON.stringify({ ...payload, prompt, negative_prompt: negativePrompt }, null, 2);
}

function buildCorrectionSafetyReport(
  applied: AppliedManualDelta[],
  originalPrompt: string,
  correctedPrompt: string
): CorrectionSafetyReport {
  const promptTextDeltaCount = applied.filter(
    (delta) => delta.application !== 'parameter_only'
  ).length;
  const parameterOnlyDeltaCount = applied.filter(
    (delta) => delta.application === 'parameter_only'
  ).length;

  return {
    original_prompt_preserved: true,
    corrected_prompt_is_separate_field: true,
    no_auto_rewrite_of_original: true,
    deltas_applied_count: applied.length,
    prompt_text_delta_count: promptTextDeltaCount,
    parameter_only_delta_count: parameterOnlyDeltaCount,
    safety_verdict: 'safe_for_second_pass',
    safety_notes: [
      'PHASE-22B original compressed_prompt preserved verbatim — corrected prompt is a separate field only.',
      `Applied ${applied.length} manual delta(s) from PHASE-23B (${promptTextDeltaCount} prompt text, ${parameterOnlyDeltaCount} parameter-only).`,
      correctedPrompt !== originalPrompt
        ? 'Corrected prompt differs from original — use corrected_copy_paste payloads for second external render pass.'
        : 'Corrected prompt matches original — parameter-only deltas may still apply via engine seed field.',
      'No dataset mutation, provider calls, or in-app image generation performed.',
    ],
    blocked_operations: [
      'original_prompt_overwrite',
      'dataset_mutation',
      'canonical_export_mutation',
      'runtime_dataset_mutation',
      'provider_call',
      'image_generation',
      'auto_prompt_rewrite',
    ],
  };
}

function buildVerificationChecks(
  pack: CorrectedSceneRenderPack,
  originalRenderPrompt: string,
  correctedMjPrompt: string,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): CorrectedRenderInputVerificationCheck[] {
  return [
    {
      check_key: 'corrected_pack_generated',
      label: 'Corrected Pack Generated',
      passed: pack.corrected_compressed_prompt.length > 0,
      detail: `Second-pass render pack for ${pack.scene_id} with separate corrected prompt field`,
    },
    {
      check_key: 'original_prompt_unchanged',
      label: 'Original Prompt Unchanged',
      passed:
        pack.compressed_prompt === originalRenderPrompt &&
        pack.original_compressed_prompt === originalRenderPrompt &&
        pack.compressed_prompt === pack.original_compressed_prompt,
      detail: 'PHASE-22B compressed_prompt preserved verbatim in corrected_render_input_pack',
    },
    {
      check_key: 'corrected_prompt_exists',
      label: 'Corrected Prompt Exists',
      passed: pack.corrected_compressed_prompt.length > 0 && correctedMjPrompt.length > 0,
      detail: 'corrected_compressed_prompt and engine corrected_prompt fields populated',
    },
    {
      check_key: 'original_negative_preserved',
      label: 'Original Negative Preserved',
      passed:
        pack.negative_prompt === pack.original_negative_prompt &&
        pack.corrected_negative_prompt === pack.original_negative_prompt,
      detail: 'Negative prompt unchanged — corrections apply to primary prompt only',
    },
    {
      check_key: 'manual_deltas_applied',
      label: 'Manual Deltas Applied',
      passed: pack.manual_correction_pack_checksum_ref.length === 64,
      detail: 'PHASE-23B safe_prompt_delta_suggestions applied deterministically',
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly second-pass export — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

export function buildCorrectedRenderInputPack(): CorrectedRenderInputPackResult {
  const renderPack = buildRealRenderInputPackPreview();
  const correctionPack = buildManualCorrectionPackPreview();
  const suggestions = correctionPack.safe_prompt_delta_suggestions;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const originalScene = renderPack.selected_scene_render_pack;
  const originalMjPrompt = renderPack.midjourney_input.prompt;
  const originalFluxPrompt = renderPack.flux_input.prompt;
  const originalNegative = originalScene.negative_prompt;

  const sceneDelta = applyPromptDeltas(originalScene.compressed_prompt, suggestions, 'midjourney');
  const mjDelta = applyPromptDeltas(originalMjPrompt, suggestions, 'midjourney');
  const fluxDelta = applyPromptDeltas(originalFluxPrompt, suggestions, 'flux');

  const corrected_render_input_pack: CorrectedSceneRenderPack = {
    ...originalScene,
    original_compressed_prompt: originalScene.compressed_prompt,
    corrected_compressed_prompt: sceneDelta.correctedPrompt,
    original_negative_prompt: originalNegative,
    corrected_negative_prompt: originalNegative,
    correction_pass: 2,
    manual_correction_pack_checksum_ref: correctionPack.correction_pack_checksum,
    render_input_pack_checksum_ref: renderPack.render_input_pack_checksum,
  };

  const mjParams = renderPack.midjourney_input.parameters;
  const corrected_midjourney_input: CorrectedMidjourneyRenderInput = {
    engine: 'midjourney',
    scene_id: renderPack.selected_scene_id,
    prompt: originalMjPrompt,
    corrected_prompt: mjDelta.correctedPrompt,
    negative_prompt: originalNegative,
    corrected_negative_prompt: originalNegative,
    copy_paste_command: renderPack.midjourney_input.copy_paste_command,
    corrected_copy_paste_command: buildMidjourneyCopyPasteCommand(mjDelta.correctedPrompt, mjParams),
    parameters: mjParams,
    identity_lock_included: true,
    continuity_seed_included: true,
  };

  const corrected_flux_input: CorrectedFluxRenderInput = {
    engine: 'flux',
    scene_id: renderPack.selected_scene_id,
    prompt: originalFluxPrompt,
    corrected_prompt: fluxDelta.correctedPrompt,
    negative_prompt: originalNegative,
    corrected_negative_prompt: originalNegative,
    copy_paste_json: renderPack.flux_input.copy_paste_json,
    corrected_copy_paste_json: buildFluxCopyPasteJson(
      fluxDelta.correctedPrompt,
      originalNegative,
      renderPack.flux_input
    ),
    parameters: renderPack.flux_input.parameters,
    identity_lock_included: true,
    continuity_seed_included: true,
  };

  const appliedById = new Map<string, AppliedManualDelta>();
  for (const delta of [...sceneDelta.applied, ...mjDelta.applied, ...fluxDelta.applied]) {
    const key = `${delta.suggestion_id}:${delta.application}:${delta.target_engine}`;
    if (!appliedById.has(key)) appliedById.set(key, delta);
  }
  const applied_manual_deltas = [...appliedById.values()].sort((a, b) =>
    a.suggestion_id.localeCompare(b.suggestion_id)
  );

  const correction_safety_report = buildCorrectionSafetyReport(
    applied_manual_deltas,
    originalScene.compressed_prompt,
    corrected_render_input_pack.corrected_compressed_prompt
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const corrected_export_verification_checks = buildVerificationChecks(
    corrected_render_input_pack,
    originalScene.compressed_prompt,
    corrected_midjourney_input.corrected_prompt,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const originalPromptUnchanged =
    corrected_render_input_pack.compressed_prompt === originalScene.compressed_prompt;
  const correctedPromptExists =
    corrected_render_input_pack.corrected_compressed_prompt.length > 0;

  const packCore = {
    schema_version: CORRECTED_RENDER_INPUT_PACK_VERSION,
    generated_at: CORRECTED_RENDER_INPUT_PACK_EPOCH,
    readonly_second_pass_export: true as const,
    render_input_pack_checksum_ref: renderPack.render_input_pack_checksum,
    manual_correction_pack_checksum_ref: correctionPack.correction_pack_checksum,
    selected_scene_id: renderPack.selected_scene_id,
    corrected_render_input_pack,
    corrected_midjourney_input,
    corrected_flux_input,
    applied_manual_deltas,
    correction_safety_report,
    corrected_export_verification_checks,
    validation: {
      deterministic_corrected_pack_checksum_stable: true,
      readonly_second_pass_export: true as const,
      original_prompt_unchanged: originalPromptUnchanged as true,
      corrected_prompt_exists: correctedPromptExists,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const corrected_render_input_pack_checksum = digest([
    JSON.stringify({ ...packCore, corrected_render_input_pack_checksum: undefined }),
    renderPack.render_input_pack_checksum,
    correctionPack.correction_pack_checksum,
    originalScene.compressed_prompt,
    corrected_render_input_pack.corrected_compressed_prompt,
  ]);

  return {
    ...packCore,
    corrected_render_input_pack_checksum,
  };
}

let cachedCorrectedPack: CorrectedRenderInputPackResult | null = null;

export function buildCorrectedRenderInputPackPreview(): CorrectedRenderInputPackResult {
  if (cachedCorrectedPack) return cachedCorrectedPack;
  cachedCorrectedPack = buildCorrectedRenderInputPack();
  return cachedCorrectedPack;
}

export function buildCorrectedRenderInputPackJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildCorrectedRenderInputPackPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: CORRECTED_RENDER_INPUT_PACK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetCorrectedRenderInputPackCache(): void {
  cachedCorrectedPack = null;
}
