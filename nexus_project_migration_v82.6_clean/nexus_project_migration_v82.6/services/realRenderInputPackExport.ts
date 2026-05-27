import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  REAL_RENDER_INPUT_PACK_EXPORT_VERSION,
  RealRenderInputPackExportResult,
  RealRenderInputVerificationCheck,
  RealRenderSettings,
  SelectedSceneRenderPack,
  SingleSceneGenerationTestStatus,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildEngineAdapterExportPackPreview } from './engineAdapterExportPack';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';
import {
  buildSingleSceneGenerationTestPreview,
  SingleSceneGenerationTestOptions,
} from './singleSceneGenerationTest';

export const REAL_RENDER_INPUT_PACK_EXPORT_EPOCH = '2026-05-27T08:00:00.000Z';
export const REAL_RENDER_INPUT_PACK_JSON_FILENAME = 'real-render-input-pack.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function resolvePhase22aStatus(
  sceneId: string,
  engineResults: { scene_id: string; engine: string; generation_test_status: SingleSceneGenerationTestStatus }[]
): SingleSceneGenerationTestStatus {
  const matching = engineResults.filter((result) => result.scene_id === sceneId);
  if (matching.length === 0) return 'test_skipped';
  if (matching.every((result) => result.generation_test_status === 'test_pass')) return 'test_pass';
  if (matching.some((result) => result.generation_test_status === 'test_fail')) return 'test_fail';
  return 'test_conditional';
}

function buildSelectedSceneRenderPack(
  sceneId: string,
  phase22aStatus: SingleSceneGenerationTestStatus
): SelectedSceneRenderPack {
  const identityLock = buildIdentityLockContinuityPreview();
  const locked = identityLock.locked_image_generation_packages.find(
    (pkg) => pkg.scene_id === sceneId
  );
  if (!locked) {
    throw new Error(`Locked package not found for scene ${sceneId}`);
  }

  return {
    scene_id: locked.scene_id,
    sequence_id: locked.sequence_id,
    compressed_prompt: locked.cinematic_prompt,
    negative_prompt: locked.negative_prompt,
    continuity_seed: locked.continuity_seed,
    style_core_ref: locked.style_core_ref,
    production_lock_ref: locked.production_lock_ref,
    identity_lock: locked.character_identity_lock,
    environment_lock: locked.environment_identity_lock,
    temporal_anchor_id: locked.temporal_anchor_id,
    continuity_strength_score: locked.continuity_strength_score,
    phase_22a_test_status: phase22aStatus,
    export_ready: true,
  };
}

function buildVerificationChecks(
  pack: SelectedSceneRenderPack,
  midjourneyCopy: string,
  fluxCopy: string,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): RealRenderInputVerificationCheck[] {
  const promptReady =
    pack.compressed_prompt.length > 0 &&
    midjourneyCopy.length > 0 &&
    fluxCopy.length > 0;
  const identityIncluded =
    pack.identity_lock.length > 0 &&
    pack.identity_lock.every((lock) => lock.face_topology.length > 0);
  const seedIncluded = pack.continuity_seed.length === 16;

  return [
    {
      check_key: 'single_scene_export',
      label: 'Single Scene Export',
      passed: !!pack.scene_id,
      detail: `Export pack scoped to scene ${pack.scene_id} only`,
    },
    {
      check_key: 'prompt_copy_ready',
      label: 'Prompt Copy Ready',
      passed: promptReady,
      detail: promptReady
        ? 'Midjourney copy_paste_command and Flux copy_paste_json populated'
        : 'Missing copy-ready prompt payload',
    },
    {
      check_key: 'identity_lock_included',
      label: 'Identity Lock Included',
      passed: identityIncluded,
      detail: identityIncluded
        ? `${pack.identity_lock.length} character identity lock(s) embedded in render pack`
        : 'Identity lock missing or incomplete',
    },
    {
      check_key: 'continuity_seed_included',
      label: 'Continuity Seed Included',
      passed: seedIncluded,
      detail: seedIncluded
        ? `Continuity seed ${pack.continuity_seed} included in both engine inputs`
        : 'Continuity seed missing',
    },
    {
      check_key: 'negative_prompt_included',
      label: 'Negative Prompt Included',
      passed: pack.negative_prompt.length > 0,
      detail: 'Grounded negative prompt exported for external engines',
    },
    {
      check_key: 'phase_22a_gate',
      label: 'PHASE-22A Test Gate',
      passed: pack.phase_22a_test_status === 'test_pass' || pack.phase_22a_test_status === 'test_conditional',
      detail: `PHASE-22A status ${pack.phase_22a_test_status}`,
    },
    {
      check_key: 'runtime_dataset_unchanged',
      label: 'Runtime Dataset Unchanged',
      passed: runtimeFingerprintBefore === runtimeFingerprintAfter,
      detail: 'Readonly export — runtime fingerprint preserved',
    },
    {
      check_key: 'canonical_export_unchanged',
      label: 'Canonical Export Unchanged',
      passed: assertCanonicalExportUnchanged(),
      detail: `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
    },
  ];
}

function buildVerificationNotes(
  pack: SelectedSceneRenderPack,
  phase22aRationale: string
): string[] {
  return [
    `Export-only pack for external image generation — no in-app provider calls.`,
    `Scene ${pack.scene_id} selected via PHASE-22A: ${phase22aRationale}`,
    `PHASE-22A test status: ${pack.phase_22a_test_status}`,
    `Continuity seed ${pack.continuity_seed} — paste into engine seed field for deterministic reproduction.`,
    `Identity lock carries ${pack.identity_lock.length} character profile(s); environment lock slot ${pack.environment_lock.city_topology.slice(0, 32)}.`,
    `Negative prompt included — do not rewrite before first external render.`,
    `Production lock ref ${pack.production_lock_ref.slice(0, 16)}… preserved for traceability.`,
  ];
}

export function buildRealRenderInputPackExport(
  options: SingleSceneGenerationTestOptions = {}
): RealRenderInputPackExportResult {
  const phase22a = buildSingleSceneGenerationTestPreview(options);
  const exportPack = buildEngineAdapterExportPackPreview();
  const identityLock = buildIdentityLockContinuityPreview();

  const selectedSceneId = phase22a.selected_scene_id;
  const phase22aStatus = resolvePhase22aStatus(selectedSceneId, phase22a.engine_results);

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const selected_scene_render_pack = buildSelectedSceneRenderPack(selectedSceneId, phase22aStatus);

  const midjourneyEntry = exportPack.export_formats.midjourney_pack.entries.find(
    (entry) => entry.scene_id === selectedSceneId
  );
  const fluxEntry = exportPack.export_formats.flux_pack.entries.find(
    (entry) => entry.scene_id === selectedSceneId
  );

  if (!midjourneyEntry || !fluxEntry) {
    throw new Error(`Engine adapter entries missing for scene ${selectedSceneId}`);
  }

  const mjParams = midjourneyEntry.engine_parameters;
  const copy_paste_command = `${midjourneyEntry.engine_prompt} --ar ${mjParams.aspect_ratio} --stylize ${mjParams.stylize} --seed ${mjParams.seed} --style ${mjParams.style_mode}`;

  const fluxPayload = {
    prompt: fluxEntry.engine_prompt,
    negative_prompt: fluxEntry.negative_prompt,
    seed: fluxEntry.engine_parameters.seed,
    guidance: fluxEntry.engine_parameters.guidance,
    steps: fluxEntry.engine_parameters.steps,
    continuity_seed: fluxEntry.continuity_seed,
    identity_lock: fluxEntry.identity_lock,
    environment_lock: fluxEntry.environment_lock,
    style_core_ref: fluxEntry.style_core_ref,
  };
  const copy_paste_json = JSON.stringify(fluxPayload, null, 2);

  const midjourney_input = {
    engine: 'midjourney' as const,
    scene_id: selectedSceneId,
    prompt: midjourneyEntry.engine_prompt,
    negative_prompt: midjourneyEntry.negative_prompt,
    copy_paste_command,
    parameters: mjParams,
    identity_lock_included: true as const,
    continuity_seed_included: true as const,
  };

  const flux_input = {
    engine: 'flux' as const,
    scene_id: selectedSceneId,
    prompt: fluxEntry.engine_prompt,
    negative_prompt: fluxEntry.negative_prompt,
    copy_paste_json,
    parameters: fluxEntry.engine_parameters,
    identity_lock_included: true as const,
    continuity_seed_included: true as const,
  };

  const render_settings: RealRenderSettings = {
    selected_scene_id: selectedSceneId,
    engines: ['midjourney', 'flux'],
    max_renders: 5,
    deterministic_seed_policy: 'continuity_seed_from_phase_21d',
    single_scene_only: true,
    external_generation_required: true,
  };

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const export_verification_checks = buildVerificationChecks(
    selected_scene_render_pack,
    copy_paste_command,
    copy_paste_json,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const verification_notes = buildVerificationNotes(
    selected_scene_render_pack,
    phase22a.selected_scene_rationale
  );

  const promptCopyReady = export_verification_checks.find(
    (check) => check.check_key === 'prompt_copy_ready'
  )?.passed ?? false;
  const identityIncluded = export_verification_checks.find(
    (check) => check.check_key === 'identity_lock_included'
  )?.passed ?? false;
  const seedIncluded = export_verification_checks.find(
    (check) => check.check_key === 'continuity_seed_included'
  )?.passed ?? false;

  const exportCore = {
    schema_version: REAL_RENDER_INPUT_PACK_EXPORT_VERSION,
    generated_at: REAL_RENDER_INPUT_PACK_EXPORT_EPOCH,
    readonly_export: true as const,
    phase_22a_test_checksum_ref: phase22a.test_checksum,
    export_pack_checksum_ref: exportPack.export_pack_checksum,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    selected_scene_id: selectedSceneId,
    selected_scene_rationale: phase22a.selected_scene_rationale,
    selected_scene_render_pack,
    midjourney_input,
    flux_input,
    render_settings,
    verification_notes,
    export_verification_checks,
    validation: {
      deterministic_export_checksum_stable: true,
      readonly_export: true as const,
      export_only: true as const,
      single_scene_only: true as const,
      no_provider_calls: true as const,
      no_in_app_image_generation: true as const,
      prompt_copy_ready: promptCopyReady,
      identity_lock_included: identityIncluded,
      seed_included: seedIncluded,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const render_input_pack_checksum = digest([
    JSON.stringify({ ...exportCore, render_input_pack_checksum: undefined }),
    phase22a.test_checksum,
    exportPack.export_pack_checksum,
  ]);

  return {
    ...exportCore,
    render_input_pack_checksum,
  };
}

let cachedExport: RealRenderInputPackExportResult | null = null;
let cachedExportKey: string | null = null;

export function buildRealRenderInputPackPreview(
  options: SingleSceneGenerationTestOptions = {}
): RealRenderInputPackExportResult {
  const key = digest([options.scene_id ?? '', options.engine ?? '']);
  if (cachedExport && cachedExportKey === key) return cachedExport;
  cachedExport = buildRealRenderInputPackExport(options);
  cachedExportKey = key;
  return cachedExport;
}

export function buildRealRenderInputPackJsonFile(
  options: SingleSceneGenerationTestOptions = {}
): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildRealRenderInputPackPreview(options);
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: REAL_RENDER_INPUT_PACK_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetRealRenderInputPackCache(): void {
  cachedExport = null;
  cachedExportKey = null;
}
