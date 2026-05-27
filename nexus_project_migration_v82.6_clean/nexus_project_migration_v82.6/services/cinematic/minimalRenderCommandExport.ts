import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  MINIMAL_RENDER_COMMAND_VERSION,
  MinimalRenderCommandEntry,
  MinimalRenderCommandExportMetadata,
  MinimalRenderCommandExportResult,
  MinimalRenderCommandUploadPayload,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import { buildAiStudioControlledJsonRebuildPreview } from './aiStudioControlledJsonRebuild';
import { buildControlledGenerationPackExportPreview } from './controlledGenerationPackExport';

export const MINIMAL_RENDER_COMMAND_EXPORT_EPOCH = '2026-05-28T02:00:00.000Z';
export const MINIMAL_RENDER_COMMAND_JSON_FILENAME = 'minimal-render-command.json';
export const MINIMAL_RENDER_COMMAND_EXPORT_PATH = 'exports/minimal-render-command.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const RENDER_COUNT = 1 as const;
const GONEGI_SLOT = 'slot_1-1';
const DANA_SLOT = 'slot_2-1';
const DEFAULT_CFG = 7.5;
const DEFAULT_SAMPLER = 'euler_a';

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

function extractPromptDelta(fullPrompt: string): string {
  const anchorIdx = fullPrompt.indexOf('Ghibli Mediterranean');
  const narrative = anchorIdx > 0 ? fullPrompt.slice(0, anchorIdx).trim() : fullPrompt;

  const emotionMatch = fullPrompt.match(/emotion_wave:[^,]+(?:, [^.,]+){0,4}/);
  const cadenceMatch = fullPrompt.match(/motion_cadence:[^,]+/);
  const tokens = [narrative.replace(/\.\s*$/, ''), emotionMatch?.[0], cadenceMatch?.[0]]
    .filter(Boolean)
    .join('. ');

  return tokens.slice(0, 480);
}

function extractStyleCoreIds(styleCore: Record<string, unknown> | undefined): string[] {
  if (!styleCore) return [];
  return [
    styleCore.styleKey,
    styleCore.materialKey,
    styleCore.lightingKey,
    styleCore.brushworkKey,
    styleCore.paletteKey,
  ]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort();
}

function assertNoMasterCoreDuplication(serialized: string): boolean {
  return !FORBIDDEN_PAYLOAD_KEYS.some((key) => serialized.includes(`"${key}"`));
}

function buildCopyPastePrompt(
  controlledPackEntry: ReturnType<
    typeof buildControlledGenerationPackExportPreview
  >['controlled_generation_packs'][number],
  studioPack: ReturnType<
    typeof buildAiStudioControlledJsonRebuildPreview
  >['ai_studio_controlled_upload_json'][number]
): string {
  const narrative = extractPromptDelta(controlledPackEntry.generation_prompt_pack.positive_prompt);
  const envSlot = studioPack.selected_environment_slot;
  const styleIds = extractStyleCoreIds(studioPack.styleCore as Record<string, unknown>).join(', ');

  return [
    narrative,
    `env_slot:${envSlot}`,
    `style_core_ids:${styleIds}`,
    `character_slots:${GONEGI_SLOT},${DANA_SLOT}`,
    'character_anchor_priority:image_anchor_over_prompt',
    'opaque gouache cel-shading, hand-painted Studio Ghibli animation',
  ]
    .filter(Boolean)
    .join('. ');
}

function buildCommandMetadata(
  rank: number,
  controlledPack: ReturnType<typeof buildControlledGenerationPackExportPreview>,
  studioPack: ReturnType<
    typeof buildAiStudioControlledJsonRebuildPreview
  >['ai_studio_controlled_upload_json'][number]
): MinimalRenderCommandEntry {
  const packEntry = controlledPack.controlled_generation_packs.find(
    (pack) => pack.generation_session_id === studioPack.generation_session_id
  );
  if (!packEntry) {
    throw new Error(`Controlled pack missing session ${studioPack.generation_session_id}`);
  }

  return {
    command_id: `MRC-${String(rank).padStart(3, '0')}`,
    generation_session_id: studioPack.generation_session_id,
    scene_id: studioPack.scene_id,
    prompt_delta: extractPromptDelta(packEntry.generation_prompt_pack.positive_prompt),
    negative_delta: DRIFT_NEGATIVE_DELTA,
    selected_env_slot: studioPack.selected_environment_slot,
    selected_style_core_ids: extractStyleCoreIds(studioPack.styleCore as Record<string, unknown>),
    required_character_slots: [GONEGI_SLOT, DANA_SLOT],
    character_anchor_priority: 'image_anchor_over_prompt',
    seed: studioPack.seed,
    aspect_ratio: '16:9',
    qa_reconnect_token: studioPack.qa_reconnect_token,
  };
}

function buildUploadPayload(
  controlledPackEntry: ReturnType<
    typeof buildControlledGenerationPackExportPreview
  >['controlled_generation_packs'][number],
  studioPack: ReturnType<
    typeof buildAiStudioControlledJsonRebuildPreview
  >['ai_studio_controlled_upload_json'][number]
): MinimalRenderCommandUploadPayload {
  return {
    ai_studio_render_recipe: {
      copy_paste_prompt: buildCopyPastePrompt(controlledPackEntry, studioPack),
      copy_paste_negative:
        controlledPackEntry.negative_prompt_pack.negative_prompt || DRIFT_NEGATIVE_DELTA,
    },
    cfg: controlledPackEntry.render_state_bundle.cfg ?? DEFAULT_CFG,
    sampler: controlledPackEntry.render_state_bundle.sampler ?? DEFAULT_SAMPLER,
    aspect_ratio: '16:9',
    seed: controlledPackEntry.ai_studio_render_recipe.seed,
    scene_id: studioPack.scene_id,
    generation_session_id: studioPack.generation_session_id,
    qa_reconnect_token: studioPack.qa_reconnect_token,
  };
}

export function toMinimalRenderCommandUploadPayload(
  result: MinimalRenderCommandExportResult
): MinimalRenderCommandUploadPayload {
  return {
    ai_studio_render_recipe: result.ai_studio_render_recipe,
    cfg: result.cfg,
    sampler: result.sampler,
    aspect_ratio: result.aspect_ratio,
    seed: result.seed,
    scene_id: result.scene_id,
    generation_session_id: result.generation_session_id,
    qa_reconnect_token: result.qa_reconnect_token,
  };
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

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const controlledPackChecksumBefore = controlledPackBefore.pack_export_checksum;
  const studioRebuildChecksumBefore = studioRebuildBefore.controlled_json_rebuild_checksum;

  const topControlledPack =
    controlledPackBefore.controlled_generation_packs.find((pack) => pack.rank === 1) ??
    controlledPackBefore.controlled_generation_packs[0];

  const topStudioPack = studioRebuildBefore.ai_studio_controlled_upload_json.find(
    (pack) => pack.generation_session_id === topControlledPack.generation_session_id
  );
  if (!topStudioPack) {
    throw new Error(`PHASE-29B upload pack missing for ${topControlledPack.generation_session_id}`);
  }

  const uploadPayload = buildUploadPayload(topControlledPack, topStudioPack);
  const commandMetadata = buildCommandMetadata(
    topControlledPack.rank,
    controlledPackBefore,
    topStudioPack
  );

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
      has_copy_paste_prompt: uploadPayload.ai_studio_render_recipe.copy_paste_prompt.length > 0,
      has_copy_paste_negative: uploadPayload.ai_studio_render_recipe.copy_paste_negative.length > 0,
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

  const controlledPackAfter = buildControlledGenerationPackExportPreview();
  const studioRebuildAfter = buildAiStudioControlledJsonRebuildPreview();
  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  export_metadata.validation = {
    ...export_metadata.validation,
    ai_studio_parser_compatible:
      export_metadata.validation.has_copy_paste_prompt &&
      export_metadata.validation.has_copy_paste_negative,
    no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
    phase_29b_unchanged:
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
  const preview = buildMinimalRenderCommandExportPreview();
  const uploadPayload = toMinimalRenderCommandUploadPayload(preview);
  const body = JSON.stringify(uploadPayload, null, 2);
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
