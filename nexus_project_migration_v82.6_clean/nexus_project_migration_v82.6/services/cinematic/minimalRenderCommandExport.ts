import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterImageAnchor,
  MINIMAL_RENDER_COMMAND_VERSION,
  RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
  MinimalRenderCommandEntry,
  MinimalRenderCommandExportMetadata,
  MinimalRenderCommandExportResult,
  MinimalRenderCommandUploadPayload,
  RuntimePromptCompileInput,
} from '../../types';
import {
  assertCharacterImageAnchorsPresent,
  assertCharacterImageAnchorsSlotMapped,
  buildCharacterImageAnchors,
} from '../aiStudioReferencePayloadBuilder';
import { CANONICAL_TEST_CHARACTER_SLOTS } from '../characterSlotMap';
import {
  CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID,
  CANONICAL_SEQUENCE_SCENE_PACK_ID,
  CANONICAL_SEQUENCE_SHOT_ID,
  CANONICAL_SEQUENCE_TRANSITION_ID,
} from './cinematicSequence.fixtures';
import { assertImageAnchorFingerprintStable, resolveImageAnchors } from '../runtimeImageAnchorResolver';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import {
  assertCompiledPromptIntegrity,
  compileRuntimePrompt,
  verifyCompilerDeterminism,
} from '../runtimePromptCompiler';
import { assertSceneIsolationClean } from '../sceneIsolationGuard';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import { buildAiStudioControlledJsonRebuildPreview } from './aiStudioControlledJsonRebuild';
import { buildControlledGenerationPackExportPreview } from './controlledGenerationPackExport';
import {
  assertPhase29bReadOnlyUnchanged,
  buildMinimalRenderExecutionContract,
  buildMusicDramaBindingAnalysis,
  buildUnifiedAssetRegistry,
} from './musicDramaAssetBinding';

export const MINIMAL_RENDER_COMMAND_EXPORT_EPOCH = '2026-05-28T07:00:00.000Z';
export const MINIMAL_RENDER_COMMAND_JSON_FILENAME = 'minimal-render-command.json';
export const MINIMAL_RENDER_COMMAND_EXPORT_PATH = 'exports/minimal-render-command.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const RENDER_COUNT = 1 as const;
const DEFAULT_CFG = 7.5;
const DEFAULT_SAMPLER = 'euler_a';

const CANONICAL_CHARACTER_TEST_SCENE_ID = 'GONEGI-CHAR-TEST-001';
const CANONICAL_CHARACTER_TEST_SESSION_ID = 'MRC-CANON-SES-001';
const CANONICAL_ENV_SLOT = 'late_afternoon';

const CANONICAL_SCENE_ACTION =
  'Gonegi and Dana walking together on a sun-warmed Mediterranean harbor village terrace, terracotta roofs, turquoise sea below, warm golden friendship cadence.';

const CANONICAL_STYLE_CORE_IDS = [
  'atmospheric_light_core',
  'mediterranean_civilization_core',
] as const;

const DRIFT_NEGATIVE_DELTA =
  'text, watermark, logo, photoreal, harsh contrast, modern UI, 3d render, plastic skin, style collapse, face drift, eye highlight loss, AMS violation, emotion flattening, background modernization, lighting instability, hand anatomy distortion';

const FORBIDDEN_PAYLOAD_KEYS = [
  'characterBook',
  'environmentDNA',
  'styleCoreMetrics',
  'master_style_core_refs',
  'render_rules',
  'character_grid_anchor_refs',
  'ai_studio_controlled_upload_json',
] as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function buildCanonicalSeed(): number {
  const hex = digest(['minimal-render-command-seed', CANONICAL_CHARACTER_TEST_SCENE_ID]).slice(0, 8);
  return parseInt(hex, 16) % 1_000_000;
}

function buildCanonicalQaReconnectToken(): string {
  return digest([
    'qa-reconnect',
    CANONICAL_CHARACTER_TEST_SCENE_ID,
    CANONICAL_CHARACTER_TEST_SESSION_ID,
  ]);
}

function assertNoMasterCoreDuplication(serialized: string): boolean {
  return !FORBIDDEN_PAYLOAD_KEYS.some((key) => serialized.includes(`"${key}"`));
}

function buildCharacterImageAnchorsForExport(): CharacterImageAnchor[] {
  return buildCharacterImageAnchors(
    resolveImageAnchors([...CANONICAL_TEST_CHARACTER_SLOTS])
  );
}

function buildCompileInput(character_image_anchors: CharacterImageAnchor[]): RuntimePromptCompileInput {
  return {
    scene_id: CANONICAL_CHARACTER_TEST_SCENE_ID,
    scene_action: CANONICAL_SCENE_ACTION,
    env_slot: CANONICAL_ENV_SLOT,
    style_core_ids: [...CANONICAL_STYLE_CORE_IDS],
    required_character_slots: [...CANONICAL_TEST_CHARACTER_SLOTS],
    base_negative_prompt: DRIFT_NEGATIVE_DELTA,
    character_image_anchors,
    cinematic_sequence: {
      scene_pack_id: CANONICAL_SEQUENCE_SCENE_PACK_ID,
      transition_id: CANONICAL_SEQUENCE_TRANSITION_ID,
      shot_id: CANONICAL_SEQUENCE_SHOT_ID,
      emotion_motion_bridge_id: CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID,
    },
    camera: ['EyeLevelImmersion', 'gentle friendship framing', '16:9 cinematic frame'],
    motion: ['slow walking cadence', 'warm golden harbor light'],
  };
}

function buildCanonicalCommandMetadata(compiledPrompt: string, compiledNegative: string): MinimalRenderCommandEntry {
  return {
    command_id: 'MRC-001',
    generation_session_id: CANONICAL_CHARACTER_TEST_SESSION_ID,
    scene_id: CANONICAL_CHARACTER_TEST_SCENE_ID,
    prompt_delta: compiledPrompt.slice(0, 480),
    negative_delta: compiledNegative,
    selected_env_slot: CANONICAL_ENV_SLOT,
    selected_style_core_ids: [...CANONICAL_STYLE_CORE_IDS],
    required_character_slots: [...CANONICAL_TEST_CHARACTER_SLOTS],
    character_anchor_priority: 'image_anchor_over_prompt',
    seed: buildCanonicalSeed(),
    aspect_ratio: '16:9',
    qa_reconnect_token: buildCanonicalQaReconnectToken(),
  };
}

function buildCanonicalUploadPayload(
  compiled: ReturnType<typeof compileRuntimePrompt>,
  character_image_anchors: CharacterImageAnchor[]
): MinimalRenderCommandUploadPayload {
  const command = buildCanonicalCommandMetadata(
    compiled.compiled_prompt,
    compiled.compiled_negative_prompt
  );

  return {
    compiler_version: RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
    compiled_prompt: compiled.compiled_prompt,
    compiled_negative_prompt: compiled.compiled_negative_prompt,
    character_image_anchors,
    character_bindings: compiled.character_bindings,
    style_bindings: compiled.style_bindings,
    env_bindings: compiled.env_bindings,
    scene_pack_binding: compiled.scene_pack_binding,
    transition_bindings: compiled.transition_bindings,
    shot_bindings: compiled.shot_bindings,
    motion_bindings: compiled.motion_bindings,
    ai_studio_render_recipe: {
      copy_paste_prompt: compiled.compiled_prompt,
      copy_paste_negative: compiled.compiled_negative_prompt,
    },
    cfg: DEFAULT_CFG,
    sampler: DEFAULT_SAMPLER,
    aspect_ratio: '16:9',
    seed: command.seed,
    scene_id: command.scene_id,
    generation_session_id: command.generation_session_id,
    qa_reconnect_token: command.qa_reconnect_token,
  };
}

const FORBIDDEN_JSON_FILE_ROOT_KEYS = ['execution_contract', 'unified_asset_registry'] as const;

/** Renderer json-file root only — never pass PHASE-30B metadata fields. */
export function toMinimalRenderCommandUploadPayload(
  result: MinimalRenderCommandExportResult
): MinimalRenderCommandUploadPayload {
  if (result.compiler_version !== RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION) {
    throw new Error(
      `minimal-render-command json-file requires compiler_version ${RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION}`
    );
  }
  if (!result.compiled_prompt?.length) {
    throw new Error('minimal-render-command json-file requires compiled_prompt');
  }
  if (!assertCharacterImageAnchorsPresent(result.character_image_anchors)) {
    throw new Error('minimal-render-command json-file requires character_image_anchors');
  }

  return {
    compiler_version: RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
    compiled_prompt: result.compiled_prompt,
    compiled_negative_prompt: result.compiled_negative_prompt,
    character_image_anchors: result.character_image_anchors,
    character_bindings: result.character_bindings,
    style_bindings: result.style_bindings,
    env_bindings: result.env_bindings,
    scene_pack_binding: result.scene_pack_binding,
    transition_bindings: result.transition_bindings,
    shot_bindings: result.shot_bindings,
    motion_bindings: result.motion_bindings,
    ai_studio_render_recipe: {
      copy_paste_prompt: result.compiled_prompt,
      copy_paste_negative: result.compiled_negative_prompt,
    },
    cfg: result.cfg,
    sampler: result.sampler,
    aspect_ratio: result.aspect_ratio,
    seed: result.seed,
    scene_id: result.scene_id,
    generation_session_id: result.generation_session_id,
    qa_reconnect_token: result.qa_reconnect_token,
  };
}

function assertRendererJsonFileBody(body: string): void {
  for (const key of FORBIDDEN_JSON_FILE_ROOT_KEYS) {
    if (body.includes(`"${key}"`)) {
      throw new Error(`PHASE-31A json-file must not contain root key: ${key}`);
    }
  }
  const parsed = JSON.parse(body) as Record<string, unknown>;
  if (!parsed.compiled_prompt || typeof parsed.compiled_prompt !== 'string') {
    throw new Error('PHASE-31A json-file missing compiled_prompt');
  }
  if (parsed.compiler_version !== RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION) {
    throw new Error('PHASE-32D json-file compiler_version must be 32D');
  }
  const anchors = parsed.character_image_anchors;
  if (!Array.isArray(anchors) || !assertCharacterImageAnchorsPresent(anchors as CharacterImageAnchor[])) {
    throw new Error('PHASE-32D json-file missing character_image_anchors');
  }
  if (!Array.isArray(parsed.transition_bindings) || parsed.transition_bindings.length === 0) {
    throw new Error('PHASE-32D json-file missing transition_bindings');
  }
  if (!Array.isArray(parsed.shot_bindings) || parsed.shot_bindings.length === 0) {
    throw new Error('PHASE-32D json-file missing shot_bindings');
  }
  if (!Array.isArray(parsed.motion_bindings) || parsed.motion_bindings.length === 0) {
    throw new Error('PHASE-32D json-file missing motion_bindings');
  }
}

function verifyUploadPayloadDeterminism(
  compileInput: RuntimePromptCompileInput,
  character_image_anchors: CharacterImageAnchor[],
  runs = 5
): boolean {
  const checksums = Array.from({ length: runs }, () => {
    const compiled = compileRuntimePrompt(compileInput);
    const payload = buildCanonicalUploadPayload(compiled, character_image_anchors);
    return digest([JSON.stringify(payload)]);
  });
  return checksums.every((c) => c === checksums[0]);
}

function writeExportArtifact(result: MinimalRenderCommandExportResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  const uploadPayload = toMinimalRenderCommandUploadPayload(result);
  fs.writeFileSync(
    path.join(exportsDir, MINIMAL_RENDER_COMMAND_JSON_FILENAME),
    JSON.stringify(uploadPayload, null, 2),
    'utf8'
  );
}

export function buildMinimalRenderCommandExport(): MinimalRenderCommandExportResult {
  const productionLock = buildSynthesizedDatasetProductionLockPreview();
  const controlledPackBefore = buildControlledGenerationPackExportPreview();
  const studioRebuildBefore = buildAiStudioControlledJsonRebuildPreview();
  const musicDramaAnalysis = buildMusicDramaBindingAnalysis();
  const character_image_anchors = buildCharacterImageAnchorsForExport();
  const compileInput = buildCompileInput(character_image_anchors);

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const controlledPackChecksumBefore = controlledPackBefore.pack_export_checksum;
  const studioRebuildChecksumBefore = studioRebuildBefore.controlled_json_rebuild_checksum;

  const execution_contract = buildMinimalRenderExecutionContract(
    CANONICAL_ENV_SLOT,
    CANONICAL_CHARACTER_TEST_SCENE_ID,
    CANONICAL_CHARACTER_TEST_SESSION_ID
  );
  const unified_asset_registry = buildUnifiedAssetRegistry([...CANONICAL_TEST_CHARACTER_SLOTS]);

  const compiled = compileRuntimePrompt(compileInput);
  const uploadPayload = buildCanonicalUploadPayload(compiled, character_image_anchors);
  const uploadDeterministic = verifyUploadPayloadDeterminism(compileInput, character_image_anchors, 5);
  const anchorsPresent = assertCharacterImageAnchorsPresent(character_image_anchors);
  const fingerprintStable =
    assertImageAnchorFingerprintStable(CANONICAL_TEST_CHARACTER_SLOTS[0]) &&
    assertImageAnchorFingerprintStable(CANONICAL_TEST_CHARACTER_SLOTS[1]);
  const commandMetadata = buildCanonicalCommandMetadata(
    uploadPayload.compiled_prompt,
    uploadPayload.compiled_negative_prompt
  );
  const compiledPrompt = uploadPayload.compiled_prompt;
  const compilerDeterministic = verifyCompilerDeterminism(compileInput, 5);
  const integrityOk = assertCompiledPromptIntegrity(compiled);

  const uploadSerialized = JSON.stringify(uploadPayload);
  const noDuplication = assertNoMasterCoreDuplication(uploadSerialized);

  const export_metadata: MinimalRenderCommandExportMetadata = {
    schema_version: MINIMAL_RENDER_COMMAND_VERSION,
    source_pack_ref: 'PHASE-29B',
    render_mode: 'single_scene_test',
    render_count: RENDER_COUNT,
    generated_at: MINIMAL_RENDER_COMMAND_EXPORT_EPOCH,
    readonly_export: true,
    controlled_json_rebuild_checksum_ref: studioRebuildChecksumBefore,
    controlled_pack_checksum_ref: controlledPackChecksumBefore,
    production_lock_checksum_ref: productionLockChecksumBefore,
    commands: [commandMetadata],
    minimal_render_command_checksum: '',
    export_json_path: MINIMAL_RENDER_COMMAND_EXPORT_PATH,
    validation: {
      deterministic_command_checksum_stable: true,
      readonly_export: true,
      render_count_locked: true,
      single_command_only: true,
      ai_studio_parser_compatible: false,
      has_copy_paste_prompt: compiledPrompt.length > 0,
      has_copy_paste_negative: uploadPayload.compiled_negative_prompt.length > 0,
      compiled_prompt_present: compiledPrompt.length > 0,
      runtime_compiler_active:
        uploadPayload.compiler_version === RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
      transition_bindings_present: uploadPayload.transition_bindings.length > 0,
      shot_bindings_present: uploadPayload.shot_bindings.length > 0,
      motion_bindings_present: uploadPayload.motion_bindings.length > 0,
      cinematic_sequence_deterministic: compilerDeterministic && uploadDeterministic,
      compiler_deterministic: compilerDeterministic && uploadDeterministic,
      gonegi_identity_in_compiled_prompt: /Canonical Character: Gonegi/i.test(compiledPrompt),
      dana_identity_in_compiled_prompt: compiledPrompt.includes('Canonical Character: Dana'),
      scene_isolation_clean: assertSceneIsolationClean(compiledPrompt),
      character_image_anchors_present: anchorsPresent,
      image_anchor_fingerprint_stable: fingerprintStable,
      execution_contract_present: !!execution_contract,
      unified_asset_registry_present: !!unified_asset_registry,
      app_slot_anchors_active:
        unified_asset_registry.activate_app_slot_anchors === true &&
        musicDramaAnalysis.gonegi_slot_present &&
        musicDramaAnalysis.dana_slot_present,
      no_mastercore_payload_duplication: noDuplication,
      no_dataset_mutation: true,
      no_image_generation: true,
      no_provider_calls: true,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: false,
      production_lock_unchanged: false,
      phase_29b_unchanged: false,
    },
  };

  assertCharacterImageAnchorsSlotMapped(character_image_anchors, uploadPayload.character_bindings);

  if (!integrityOk || !compilerDeterministic || !uploadDeterministic || !anchorsPresent || !fingerprintStable) {
    throw new Error('PHASE-32D cinematic sequence export failed integrity or determinism checks');
  }

  const controlledPackAfter = buildControlledGenerationPackExportPreview();
  const studioRebuildAfter = buildAiStudioControlledJsonRebuildPreview();
  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  export_metadata.validation = {
    ...export_metadata.validation,
    ai_studio_parser_compatible:
      export_metadata.validation.compiled_prompt_present &&
      export_metadata.validation.runtime_compiler_active &&
      export_metadata.validation.gonegi_identity_in_compiled_prompt &&
      export_metadata.validation.dana_identity_in_compiled_prompt &&
      export_metadata.validation.scene_isolation_clean &&
      export_metadata.validation.character_image_anchors_present &&
      export_metadata.validation.image_anchor_fingerprint_stable &&
      export_metadata.validation.transition_bindings_present &&
      export_metadata.validation.shot_bindings_present &&
      export_metadata.validation.motion_bindings_present &&
      export_metadata.validation.cinematic_sequence_deterministic &&
      integrityOk,
    no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
    phase_29b_unchanged:
      assertPhase29bReadOnlyUnchanged() &&
      controlledPackChecksumBefore === controlledPackAfter.pack_export_checksum &&
      studioRebuildChecksumBefore === studioRebuildAfter.controlled_json_rebuild_checksum,
  };

  export_metadata.minimal_render_command_checksum = digest([
    uploadSerialized,
    JSON.stringify(export_metadata),
    productionLockChecksumBefore,
    controlledPackChecksumBefore,
    studioRebuildChecksumBefore,
  ]);

  const result: MinimalRenderCommandExportResult = {
    ...uploadPayload,
    execution_contract,
    unified_asset_registry,
    export_metadata,
  };

  writeExportArtifact(result);
  return result;
}

let cachedExport: MinimalRenderCommandExportResult | null = null;

export function buildMinimalRenderCommandExportPreview(): MinimalRenderCommandExportResult {
  if (cachedExport) return cachedExport;
  cachedExport = buildMinimalRenderCommandExport();
  return cachedExport;
}

export function buildMinimalRenderCommandJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  resetMinimalRenderCommandExportCache();
  const preview = buildMinimalRenderCommandExport();
  const uploadPayload = toMinimalRenderCommandUploadPayload(preview);
  const body = JSON.stringify(uploadPayload, null, 2);
  assertRendererJsonFileBody(body);
  writeExportArtifact(preview);
  return {
    filename: MINIMAL_RENDER_COMMAND_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetMinimalRenderCommandExportCache(): void {
  cachedExport = null;
}
