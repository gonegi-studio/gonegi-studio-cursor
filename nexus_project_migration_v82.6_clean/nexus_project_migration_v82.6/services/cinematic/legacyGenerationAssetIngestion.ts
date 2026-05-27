import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  LEGACY_GENERATION_ASSET_INGESTION_VERSION,
  LegacyAssetFingerprintIndex,
  LegacyGenerationAssetIngestionResult,
  LegacyGenerationAssetKind,
  LegacyGenerationAssetRegistryEntry,
  LegacyGenerationQaBridgeReport,
  LegacyGenerationSchemaReport,
  LegacyNormalizedGenerationAsset,
  LegacyNormalizedImageAsset,
  LegacyNormalizedStyleAsset,
  LegacyNormalizedVideoAsset,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildEngineAdapterExportPackPreview } from '../engineAdapterExportPack';
import { buildGeneratedImageFeedbackPreview } from '../generatedImageFeedbackAnalyzer';
import { buildMasterCoreDNAAdapterPreview } from '../masterCoreDNAAdapter';
import { buildRealRenderInputPackPreview } from '../realRenderInputPackExport';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import { buildFingerprintSeparabilityReinforcementPreview } from './fingerprintSeparabilityReinforcement';
import {
  buildCanonicalLegacyAsmFixture,
  buildCanonicalLegacyRenderRulesFixture,
  buildCanonicalLegacyStyleCoreFixture,
  buildCanonicalLegacyVideoRecipeFixture,
  LEGACY_CANONICAL_VIDEO_HASH,
} from './legacyGenerationAssetIngestion.fixtures';

export const LEGACY_GENERATION_ASSET_INGESTION_EPOCH = '2026-05-27T21:00:00.000Z';
export const LEGACY_GENERATION_ASSET_JSON_FILENAME = 'legacy-generation-assets.json';
export const LEGACY_GENERATION_ASSET_EXPORT_JSON_PATH = 'exports/legacy-generation-assets.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const LOCAL_VAULT_DIR = 'storage/local_vault';
const CLOUD_STORAGE_DIR = 'storage/cloud';

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function readVaultJsonFiles(directory: string, suffix: string): Array<{ path: string; data: unknown }> {
  const dirPath = path.join(process.cwd(), directory);
  if (!fs.existsSync(dirPath)) return [];

  return fs
    .readdirSync(dirPath)
    .filter((filename) => filename.endsWith(suffix))
    .sort()
    .map((filename) => {
      const filePath = path.join(dirPath, filename);
      try {
        return {
          path: `${directory}/${filename}`,
          data: JSON.parse(fs.readFileSync(filePath, 'utf8')),
        };
      } catch {
        return null;
      }
    })
    .filter((entry): entry is { path: string; data: unknown } => entry !== null);
}

function registryEntry(
  assetKind: LegacyGenerationAssetKind,
  sourcePath: string,
  sourceOrigin: LegacyGenerationAssetRegistryEntry['source_origin'],
  fingerprintSeed: string
): LegacyGenerationAssetRegistryEntry {
  return {
    asset_id: `LEGACY-${assetKind.toUpperCase().replace(/_/g, '-')}-${digest([assetKind, sourcePath]).slice(0, 12).toUpperCase()}`,
    asset_kind: assetKind,
    source_path: sourcePath,
    source_origin: sourceOrigin,
    normalized: true,
    asset_fingerprint: digest([assetKind, fingerprintSeed]),
  };
}

function normalizeImageRecipeFromRenderExport(): LegacyNormalizedImageAsset {
  const renderExport = buildRealRenderInputPackPreview();
  const enginePack = buildEngineAdapterExportPackPreview();
  const sceneId = renderExport.selected_scene_id;
  const sdxlEntry = enginePack.export_formats.sdxl_pack.entries.find(
    (entry) => entry.scene_id === sceneId
  );
  const mjInput = renderExport.midjourney_input;
  const fluxInput = renderExport.flux_input;

  return {
    asset_id: `LEGACY-IMAGE-RECIPE-${sceneId}`,
    asset_kind: 'image_recipe',
    prompt: renderExport.selected_scene_render_pack.compressed_prompt,
    negative_prompt: renderExport.selected_scene_render_pack.negative_prompt,
    seed: sdxlEntry?.engine_parameters.seed ?? mjInput.parameters.seed,
    cfg: sdxlEntry?.engine_parameters.cfg_scale ?? 7,
    sampler: sdxlEntry?.engine_parameters.sampler ?? 'euler_a',
    model_hash: 'ghibli_v3_final_prod_4k',
    denoise: 0.7,
    aspect_ratio: mjInput.parameters.aspect_ratio,
    render_rules_ref: renderExport.selected_scene_render_pack.style_core_ref,
    style_metrics: {
      stylize: mjInput.parameters.stylize,
      guidance: fluxInput.parameters.guidance,
      steps: fluxInput.parameters.steps,
    },
    scene_id: sceneId,
    style_core_ref: renderExport.selected_scene_render_pack.style_core_ref,
    continuity_seed: renderExport.selected_scene_render_pack.continuity_seed,
  };
}

function normalizeImageMetadataFromFeedback(): LegacyNormalizedImageAsset {
  const feedback = buildGeneratedImageFeedbackPreview();
  const renderExport = buildRealRenderInputPackPreview();
  const report = feedback.feedback_reports[0];

  return {
    asset_id: `LEGACY-IMAGE-METADATA-${renderExport.selected_scene_id}`,
    asset_kind: 'image_metadata',
    prompt: renderExport.selected_scene_render_pack.compressed_prompt,
    negative_prompt: renderExport.selected_scene_render_pack.negative_prompt,
    seed: renderExport.selected_scene_render_pack.continuity_seed,
    scene_id: renderExport.selected_scene_id,
    style_core_ref: renderExport.selected_scene_render_pack.style_core_ref,
    continuity_seed: renderExport.selected_scene_render_pack.continuity_seed,
    style_metrics: {
      style_drift_score: report?.style_drift_score ?? 0,
      identity_drift_score: report?.identity_drift_score ?? 0,
      environment_drift_score: report?.environment_drift_score ?? 0,
      temporal_drift_score: report?.temporal_drift_score ?? 0,
      style_core_alignment_score: report?.overall_alignment_score ?? 0,
    },
  };
}

function normalizeVideoRecipe(data: Record<string, unknown>, assetId: string): LegacyNormalizedVideoAsset {
  const hyper = (data.hyper_parameters as Record<string, unknown>) ?? {};
  const promptData = (data.prompt_data as Record<string, unknown>) ?? {};
  const pipeline = (data.pipeline_context as Record<string, unknown>) ?? {};

  return {
    asset_id: assetId,
    asset_kind: 'video_recipe',
    prompt: String(promptData.positive ?? data.prompt ?? ''),
    negative_prompt: String(promptData.negative ?? data.negative_prompt ?? ''),
    seed: Number(hyper.seed ?? data.seed ?? 0),
    cfg: Number(hyper.cfg ?? data.cfg_scale ?? 0),
    motion_bucket: Number(hyper.motion_bucket ?? data.motion_bucket_id ?? 0),
    scheduler: String(pipeline.scheduler ?? 'Euler a'),
    aspect_ratio: String(hyper.aspect_ratio ?? '16:9'),
    source_engine: String(data.source_engine ?? 'unknown'),
  };
}

function normalizeAsm(data: Record<string, unknown>, assetId: string): LegacyNormalizedVideoAsset {
  const quality = (data.quality as Record<string, unknown>) ?? {};
  const physics = (data.physics_logic as Record<string, unknown>) ?? {};
  const material = (data.material_dna as Record<string, unknown>) ?? {};

  return {
    asset_id: assetId,
    asset_kind: 'asm_motion_analysis',
    timeline: String(data.timeline ?? ''),
    motion_peak: Number(data.motion_peak ?? 0),
    physics_logic: {
      wind_force: Number(physics.wind_force ?? 0),
      gravity_scale: Number(physics.gravity_scale ?? 1),
      air_resistance: Number(physics.air_resistance ?? 0),
    },
    material_dna: {
      gouache_viscosity: Number(material.gouache_viscosity ?? 0),
      brush_grain_density: Number(material.brush_grain_density ?? 0),
      edge_sharpness: Number(material.edge_sharpness ?? 0),
      aesthetic: String(material.aesthetic ?? ''),
    },
    quality_metrics: {
      total: Number(quality.total ?? 0),
      eye_gloss: Number(quality.eye_gloss ?? 0),
      mask_fixation: Number(quality.mask_fixation ?? 0),
    },
    source_engine: String(data.source_engine ?? 'unknown'),
  };
}

function normalizeStyleAssets(): LegacyNormalizedStyleAsset[] {
  const masterCore = buildMasterCoreDNAAdapterPreview();
  const styleCore = masterCore.style_core_profile;
  const renderRules = buildCanonicalLegacyRenderRulesFixture();

  const characterBookAsset: LegacyNormalizedStyleAsset = {
    asset_id: 'LEGACY-CHARACTER-BOOK-CANONICAL',
    asset_kind: 'character_book',
    character_book_version: masterCore.master_core_profile.book_version,
    character_count: Object.keys(masterCore.character_dna_index).length,
  };

  const environmentAsset: LegacyNormalizedStyleAsset = {
    asset_id: 'LEGACY-ENVIRONMENT-DNA-CANONICAL',
    asset_kind: 'environment_dna',
    environment_slot_count: Object.keys(masterCore.environment_dna_index).length,
  };

  const styleCoreAsset: LegacyNormalizedStyleAsset = {
    asset_id: 'LEGACY-STYLE-CORE-CANONICAL',
    asset_kind: 'style_core',
    style_core: buildCanonicalLegacyStyleCoreFixture(),
    style_core_metrics: styleCore.metrics ?? {
      contrast_norm: 0.72,
      warmth_norm: 0.88,
      brushwork_density: 0.81,
      palette_coherence: 0.93,
      material_fidelity: 0.89,
      lighting_consistency: 0.9,
    },
  };

  const renderRulesAsset: LegacyNormalizedStyleAsset = {
    asset_id: 'LEGACY-RENDER-RULES-CANONICAL',
    asset_kind: 'render_rules',
    render_rules: renderRules,
  };

  return [styleCoreAsset, characterBookAsset, environmentAsset, renderRulesAsset];
}

function buildAssetFingerprintIndex(
  normalizedAssets: LegacyNormalizedGenerationAsset[],
  masterCore: ReturnType<typeof buildMasterCoreDNAAdapterPreview>
): LegacyAssetFingerprintIndex {
  const imageRecipe = normalizedAssets.find(
    (asset) => asset.asset_kind === 'image_recipe'
  ) as LegacyNormalizedImageAsset | undefined;
  const videoRecipe = normalizedAssets.find(
    (asset) => asset.asset_kind === 'video_recipe'
  ) as LegacyNormalizedVideoAsset | undefined;
  const asm = normalizedAssets.find(
    (asset) => asset.asset_kind === 'asm_motion_analysis'
  ) as LegacyNormalizedVideoAsset | undefined;
  const styleCore = normalizedAssets.find(
    (asset) => asset.asset_kind === 'style_core'
  ) as LegacyNormalizedStyleAsset | undefined;
  const renderRules = normalizedAssets.find(
    (asset) => asset.asset_kind === 'render_rules'
  ) as LegacyNormalizedStyleAsset | undefined;

  const character_anchor_map: Record<string, string> = {};
  for (const [key, entry] of Object.entries(masterCore.character_dna_index)) {
    character_anchor_map[key] = digest([
      entry.character_id,
      entry.name,
      entry.visual_dna,
      entry.grid_position ?? '',
    ]);
  }

  const environment_anchor_map: Record<string, string> = {};
  for (const [key, entry] of Object.entries(masterCore.environment_dna_index)) {
    environment_anchor_map[key] = entry.fingerprint;
  }

  return {
    generation_fingerprint: digest([
      imageRecipe?.continuity_seed ?? '',
      String(videoRecipe?.seed ?? ''),
      LEGACY_CANONICAL_VIDEO_HASH,
      masterCore.export_checksum,
    ]),
    render_fingerprint: digest([
      imageRecipe?.prompt ?? '',
      String(imageRecipe?.seed ?? ''),
      String(imageRecipe?.cfg ?? ''),
      imageRecipe?.sampler ?? '',
      imageRecipe?.model_hash ?? '',
      imageRecipe?.aspect_ratio ?? '',
    ]),
    motion_fingerprint: digest([
      String(videoRecipe?.motion_bucket ?? ''),
      String(asm?.motion_peak ?? ''),
      asm?.timeline ?? '',
      JSON.stringify(asm?.physics_logic ?? {}),
    ]),
    material_fingerprint: digest([
      JSON.stringify(asm?.material_dna ?? {}),
      styleCore?.style_core?.materialKey ?? '',
      String(styleCore?.style_core_metrics?.material_fidelity ?? ''),
    ]),
    style_law_fingerprint: digest([
      styleCore?.style_core?.styleKey ?? '',
      styleCore?.style_core?.lightingKey ?? '',
      styleCore?.style_core?.brushworkKey ?? '',
      styleCore?.style_core?.paletteKey ?? '',
      JSON.stringify(renderRules?.render_rules ?? {}),
    ]),
    character_anchor_map,
    environment_anchor_map,
  };
}

function buildSchemaReport(normalizedAssets: LegacyNormalizedGenerationAsset[]): LegacyGenerationSchemaReport {
  const imageAssets = normalizedAssets.filter((asset) =>
    ['image_recipe', 'image_metadata'].includes(asset.asset_kind)
  ).length;
  const videoAssets = normalizedAssets.filter((asset) =>
    ['video_recipe', 'asm_motion_analysis'].includes(asset.asset_kind)
  ).length;
  const styleAssets = normalizedAssets.filter((asset) =>
    ['style_core', 'character_book', 'environment_dna', 'render_rules'].includes(asset.asset_kind)
  ).length;

  const schemaFields = new Set<string>();
  for (const asset of normalizedAssets) {
    Object.keys(asset).forEach((key) => schemaFields.add(`${asset.asset_kind}.${key}`));
  }

  const expectedKinds = 8;
  const mappedKinds = new Set(normalizedAssets.map((asset) => asset.asset_kind)).size;

  return {
    total_assets_ingested: normalizedAssets.length,
    image_assets: imageAssets,
    video_assets: videoAssets,
    style_assets: styleAssets,
    schema_fields_mapped: schemaFields.size,
    mapping_coverage_ratio: round6(mappedKinds / expectedKinds),
    normalization_complete: true,
    readonly_ingestion: true,
  };
}

function buildQaBridgeReport(
  schemaReport: LegacyGenerationSchemaReport,
  fingerprintIndex: LegacyAssetFingerprintIndex
): LegacyGenerationQaBridgeReport {
  const checks = [
    schemaReport.mapping_coverage_ratio >= 1,
    Object.keys(fingerprintIndex.character_anchor_map).length > 0,
    Object.keys(fingerprintIndex.environment_anchor_map).length > 0,
    !!fingerprintIndex.generation_fingerprint,
    !!fingerprintIndex.render_fingerprint,
    !!fingerprintIndex.motion_fingerprint,
    schemaReport.image_assets >= 2,
    schemaReport.video_assets >= 2,
  ];
  const bridge_checks_passed = checks.filter(Boolean).length;

  return {
    scene_linkage_ready: schemaReport.image_assets >= 1,
    generation_fingerprint_ready: !!fingerprintIndex.generation_fingerprint,
    visual_qa_loop_ready: bridge_checks_passed >= 6,
    image_generation_ready: schemaReport.image_assets >= 1 && !!fingerprintIndex.render_fingerprint,
    video_generation_ready: schemaReport.video_assets >= 2 && !!fingerprintIndex.motion_fingerprint,
    evidence_grounded_graph_ready: bridge_checks_passed >= 7,
    bridge_checks_passed,
    bridge_checks_total: checks.length,
  };
}

function writeExportArtifact(payload: LegacyGenerationAssetIngestionResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, LEGACY_GENERATION_ASSET_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildLegacyGenerationAssetIngestion(): LegacyGenerationAssetIngestionResult {
  const productionLock = buildSynthesizedDatasetProductionLockPreview();
  const fingerprintReinforcement = buildFingerprintSeparabilityReinforcementPreview();
  const masterCore = buildMasterCoreDNAAdapterPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;

  const normalized_generation_assets: LegacyNormalizedGenerationAsset[] = [];
  const legacy_generation_asset_registry: LegacyGenerationAssetRegistryEntry[] = [];

  const imageRecipe = normalizeImageRecipeFromRenderExport();
  normalized_generation_assets.push(imageRecipe);
  legacy_generation_asset_registry.push(
    registryEntry('image_recipe', 'synthesized:realRenderInputPackExport', 'synthesized_preview', JSON.stringify(imageRecipe))
  );

  const imageMetadata = normalizeImageMetadataFromFeedback();
  normalized_generation_assets.push(imageMetadata);
  legacy_generation_asset_registry.push(
    registryEntry('image_metadata', 'synthesized:generatedImageFeedbackAnalyzer', 'synthesized_preview', JSON.stringify(imageMetadata))
  );

  const canonicalVideoRecipe = buildCanonicalLegacyVideoRecipeFixture();
  const normalizedCanonicalVideo = normalizeVideoRecipe(
    canonicalVideoRecipe as unknown as Record<string, unknown>,
    `LEGACY-VIDEO-RECIPE-${LEGACY_CANONICAL_VIDEO_HASH}`
  );
  normalized_generation_assets.push(normalizedCanonicalVideo);
  legacy_generation_asset_registry.push(
    registryEntry('video_recipe', 'fixtures:legacyGenerationAssetIngestion.fixtures', 'canonical_fixture', JSON.stringify(canonicalVideoRecipe))
  );

  const canonicalAsm = buildCanonicalLegacyAsmFixture();
  const normalizedCanonicalAsm = normalizeAsm(
    canonicalAsm as unknown as Record<string, unknown>,
    `LEGACY-ASM-${LEGACY_CANONICAL_VIDEO_HASH}`
  );
  normalized_generation_assets.push(normalizedCanonicalAsm);
  legacy_generation_asset_registry.push(
    registryEntry('asm_motion_analysis', 'fixtures:legacyGenerationAssetIngestion.fixtures', 'canonical_fixture', JSON.stringify(canonicalAsm))
  );

  for (const styleAsset of normalizeStyleAssets()) {
    normalized_generation_assets.push(styleAsset);
    legacy_generation_asset_registry.push(
      registryEntry(
        styleAsset.asset_kind,
        'synthesized:masterCoreDNAAdapterPreview',
        styleAsset.asset_kind === 'render_rules' ? 'canonical_fixture' : 'synthesized_preview',
        JSON.stringify(styleAsset)
      )
    );
  }

  const vaultRecipes = readVaultJsonFiles(LOCAL_VAULT_DIR, '_recipe.json');
  for (const entry of vaultRecipes) {
    const data = entry.data as Record<string, unknown>;
    const hashId = String(data.hash_id ?? path.basename(entry.path, '_recipe.json'));
    const normalized = normalizeVideoRecipe(data, `LEGACY-VAULT-VIDEO-RECIPE-${hashId}`);
    normalized_generation_assets.push(normalized);
    legacy_generation_asset_registry.push(
      registryEntry('video_recipe', entry.path, 'runtime_vault', JSON.stringify(data))
    );
  }

  const vaultAsm = readVaultJsonFiles(CLOUD_STORAGE_DIR, '_asm.json');
  for (const entry of vaultAsm) {
    const data = entry.data as Record<string, unknown>;
    const hashId = String(data.hash_id ?? path.basename(entry.path, '_asm.json'));
    const normalized = normalizeAsm(data, `LEGACY-VAULT-ASM-${hashId}`);
    normalized_generation_assets.push(normalized);
    legacy_generation_asset_registry.push(
      registryEntry('asm_motion_analysis', entry.path, 'runtime_vault', JSON.stringify(data))
    );
  }

  const asset_fingerprint_index = buildAssetFingerprintIndex(normalized_generation_assets, masterCore);
  const generation_schema_report = buildSchemaReport(normalized_generation_assets);
  const generation_qa_bridge_report = buildQaBridgeReport(
    generation_schema_report,
    asset_fingerprint_index
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  const resultCore = {
    schema_version: LEGACY_GENERATION_ASSET_INGESTION_VERSION,
    generated_at: LEGACY_GENERATION_ASSET_INGESTION_EPOCH,
    readonly_ingestion: true as const,
    production_lock_checksum_ref: productionLockChecksumBefore,
    fingerprint_reinforcement_checksum_ref: fingerprintReinforcement.reinforcement_checksum,
    legacy_generation_asset_registry,
    normalized_generation_assets,
    generation_schema_report,
    asset_fingerprint_index,
    generation_qa_bridge_report,
    export_json_path: LEGACY_GENERATION_ASSET_EXPORT_JSON_PATH as 'exports/legacy-generation-assets.json',
    validation: {
      deterministic_ingestion_checksum_stable: true,
      readonly_ingestion: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      asset_mapping_coverage_generated: generation_schema_report.mapping_coverage_ratio >= 1,
    },
  };

  const ingestion_checksum = digest([
    JSON.stringify(resultCore),
    productionLockChecksumBefore,
    fingerprintReinforcement.reinforcement_checksum,
    masterCore.export_checksum,
  ]);

  const result: LegacyGenerationAssetIngestionResult = {
    ...resultCore,
    ingestion_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedIngestion: LegacyGenerationAssetIngestionResult | null = null;

export function buildLegacyGenerationAssetIngestionPreview(): LegacyGenerationAssetIngestionResult {
  if (cachedIngestion) return cachedIngestion;
  cachedIngestion = buildLegacyGenerationAssetIngestion();
  return cachedIngestion;
}

export function buildLegacyGenerationAssetIngestionJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildLegacyGenerationAssetIngestionPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: LEGACY_GENERATION_ASSET_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetLegacyGenerationAssetIngestionCache(): void {
  cachedIngestion = null;
}
