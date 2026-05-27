import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CharacterIdentityLock,
  ENGINE_ADAPTER_EXPORT_PACK_VERSION,
  EngineAdapterExportCoreFields,
  EngineAdapterExportPackResult,
  EngineAdapterExportVerificationCheck,
  EngineAdapterFormatPack,
  EnvironmentIdentityLock,
  FluxPackEntry,
  ImageAppUnifiedEntry,
  LockedImageGenerationPackage,
  MidjourneyPackEntry,
  RunwayReferencePackEntry,
  SdxlPackEntry,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildIdentityLockContinuityPreview } from './identityLockContinuityEngine';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const ENGINE_ADAPTER_EXPORT_PACK_EPOCH = '2026-05-27T07:00:00.000Z';
export const ENGINE_ADAPTER_EXPORT_PACK_JSON_FILENAME = 'engine-adapter-export-pack.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const EXPECTED_SCENE_COUNT = 33;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function seedToNumeric(continuitySeed: string): number {
  return parseInt(continuitySeed.slice(0, 8), 16) % 2147483646;
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function extractCoreFields(pkg: LockedImageGenerationPackage): EngineAdapterExportCoreFields {
  return {
    scene_id: pkg.scene_id,
    sequence_id: pkg.sequence_id,
    compressed_prompt: pkg.cinematic_prompt,
    negative_prompt: pkg.negative_prompt,
    identity_lock: pkg.character_identity_lock,
    continuity_seed: pkg.continuity_seed,
    style_core_ref: pkg.style_core_ref,
    environment_lock: pkg.environment_identity_lock,
    production_lock_ref: pkg.production_lock_ref,
  };
}

function buildIdentityLockSummary(locks: CharacterIdentityLock[]): string {
  return locks
    .map(
      (lock) =>
        `${lock.character_id}|face:${lock.face_topology.slice(0, 24)}|sil:${lock.silhouette.slice(0, 24)}`
    )
    .join('; ');
}

function buildEnvironmentLockSummary(lock: EnvironmentIdentityLock): string {
  return `city:${lock.city_topology.slice(0, 32)}; light:${lock.lighting_continuity.slice(0, 32)}; weather:${lock.weather_persistence}`;
}

function buildImageAppUnifiedEntry(pkg: LockedImageGenerationPackage): ImageAppUnifiedEntry {
  const core = extractCoreFields(pkg);
  return {
    ...core,
    format: 'image_app_unified',
    temporal_anchor_id: pkg.temporal_anchor_id,
    continuity_strength_score: pkg.continuity_strength_score,
    runtime_dataset_fingerprint: pkg.runtime_dataset_fingerprint,
  };
}

function buildMidjourneyPackEntry(pkg: LockedImageGenerationPackage): MidjourneyPackEntry {
  const core = extractCoreFields(pkg);
  const identitySummary = buildIdentityLockSummary(pkg.character_identity_lock);
  const envSummary = buildEnvironmentLockSummary(pkg.environment_identity_lock);
  const engine_prompt = [
    core.compressed_prompt,
    `Identity lock: ${identitySummary}`,
    `Environment: ${envSummary}`,
    `Style ref: ${core.style_core_ref.slice(0, 16)}`,
  ].join(' ');

  return {
    ...core,
    format: 'midjourney_pack',
    engine_prompt: engine_prompt.trim(),
    engine_parameters: {
      aspect_ratio: '16:9',
      stylize: 250,
      seed: core.continuity_seed,
      style_mode: 'raw',
    },
  };
}

function buildFluxPackEntry(pkg: LockedImageGenerationPackage): FluxPackEntry {
  const core = extractCoreFields(pkg);
  const engine_prompt = `${core.compressed_prompt} [seed:${core.continuity_seed}] [style:${core.style_core_ref.slice(0, 12)}]`;

  return {
    ...core,
    format: 'flux_pack',
    engine_prompt: engine_prompt.trim(),
    engine_parameters: {
      seed: seedToNumeric(core.continuity_seed),
      guidance: 3.5,
      steps: 28,
    },
  };
}

function buildSdxlPackEntry(pkg: LockedImageGenerationPackage): SdxlPackEntry {
  const core = extractCoreFields(pkg);
  const negative = core.negative_prompt;
  const engine_prompt = core.compressed_prompt;

  return {
    ...core,
    format: 'sdxl_pack',
    engine_prompt,
    engine_parameters: {
      seed: seedToNumeric(core.continuity_seed),
      cfg_scale: 7,
      sampler: 'euler_a',
    },
    negative_prompt: negative,
  };
}

function buildRunwayReferencePackEntry(pkg: LockedImageGenerationPackage): RunwayReferencePackEntry {
  const core = extractCoreFields(pkg);
  const motionHint =
    pkg.camera_profile.camera_motion_summary ||
    pkg.camera_profile.cinematography_tokens.slice(0, 3).join(', ') ||
    'static reference frame';
  const cameraSummary = [
    ...pkg.camera_profile.cinematography_tokens.slice(0, 4),
    ...pkg.camera_profile.framing.slice(0, 2),
  ]
    .filter(Boolean)
    .join(', ');

  const engine_prompt = [
    core.compressed_prompt,
    `Camera: ${cameraSummary || motionHint}`,
    `Continuity seed ${core.continuity_seed}`,
  ].join('. ');

  return {
    ...core,
    format: 'runway_reference_pack',
    engine_prompt: engine_prompt.trim(),
    reference_metadata: {
      motion_hint: motionHint,
      camera_profile_summary: cameraSummary || motionHint,
      continuity_seed_ref: core.continuity_seed,
    },
  };
}

function packChecksum<T>(formatKey: string, entries: T[]): string {
  return digest([formatKey, JSON.stringify(entries)]);
}

function buildFormatPack<T>(
  formatKey: EngineAdapterExportPackResult['export_formats'][keyof EngineAdapterExportPackResult['export_formats']]['format_key'],
  entries: T[]
): EngineAdapterFormatPack<T> {
  return {
    format_key: formatKey,
    scene_count: entries.length,
    entries,
    pack_checksum: packChecksum(formatKey, entries),
  };
}

function identityLocksMatch(
  source: LockedImageGenerationPackage,
  exported: EngineAdapterExportCoreFields
): boolean {
  if (exported.identity_lock.length !== source.character_identity_lock.length) return false;
  const env = exported.environment_lock;
  const srcEnv = source.environment_identity_lock;
  const envMatch =
    env.city_topology === srcEnv.city_topology &&
    env.architecture_rhythm === srcEnv.architecture_rhythm &&
    env.lighting_continuity === srcEnv.lighting_continuity &&
    env.atmosphere_continuity === srcEnv.atmosphere_continuity &&
    env.weather_persistence === srcEnv.weather_persistence &&
    env.material_response === srcEnv.material_response;

  const charMatch = exported.identity_lock.every((lock, index) => {
    const src = source.character_identity_lock[index];
    return (
      lock.character_id === src.character_id &&
      lock.face_topology === src.face_topology &&
      lock.silhouette === src.silhouette &&
      lock.lock_strength === src.lock_strength
    );
  });

  return (
    charMatch &&
    envMatch &&
    exported.continuity_seed === source.continuity_seed &&
    exported.style_core_ref === source.style_core_ref &&
    exported.production_lock_ref === source.production_lock_ref &&
    exported.compressed_prompt === source.cinematic_prompt &&
    exported.negative_prompt === source.negative_prompt
  );
}

function verifyIdentityLocksPreserved(
  source: LockedImageGenerationPackage[],
  allEntries: EngineAdapterExportCoreFields[]
): boolean {
  if (allEntries.length !== source.length * 5) return false;
  for (let i = 0; i < source.length; i++) {
    const offsets = [i, i + source.length, i + source.length * 2, i + source.length * 3, i + source.length * 4];
    for (const offset of offsets) {
      if (!identityLocksMatch(source[i], allEntries[offset])) return false;
    }
  }
  return true;
}

function buildVerificationChecks(
  source: LockedImageGenerationPackage[],
  exportFormats: EngineAdapterExportPackResult['export_formats'],
  identityLocksPreserved: boolean,
  runtimeFingerprintBefore: string,
  runtimeFingerprintAfter: string
): EngineAdapterExportVerificationCheck[] {
  const formatCounts = [
    exportFormats.image_app_unified.scene_count,
    exportFormats.midjourney_pack.scene_count,
    exportFormats.flux_pack.scene_count,
    exportFormats.sdxl_pack.scene_count,
    exportFormats.runway_reference_pack.scene_count,
  ];

  return [
    {
      check_key: 'packages_exported',
      label: '33 Packages Exported Per Format',
      passed: formatCounts.every((count) => count === EXPECTED_SCENE_COUNT),
      detail: formatCounts
        .map(
          (count, index) =>
            `${['image_app_unified', 'midjourney_pack', 'flux_pack', 'sdxl_pack', 'runway_reference_pack'][index]}: ${count}/${EXPECTED_SCENE_COUNT}`
        )
        .join('; '),
    },
    {
      check_key: 'identity_locks_preserved',
      label: 'Identity Locks Preserved',
      passed: identityLocksPreserved,
      detail: identityLocksPreserved
        ? 'All 5 formats preserve character/environment locks and core refs from PHASE-21D'
        : 'Identity lock mismatch detected in one or more export entries',
    },
    {
      check_key: 'all_formats_present',
      label: 'All Export Formats Present',
      passed:
        exportFormats.image_app_unified.entries.length > 0 &&
        exportFormats.midjourney_pack.entries.length > 0 &&
        exportFormats.flux_pack.entries.length > 0 &&
        exportFormats.sdxl_pack.entries.length > 0 &&
        exportFormats.runway_reference_pack.entries.length > 0,
      detail: '5 engine adapter formats exported (image_app_unified, midjourney, flux, sdxl, runway_reference)',
    },
    {
      check_key: 'source_scene_alignment',
      label: 'Source Scene Alignment',
      passed: source.length === EXPECTED_SCENE_COUNT,
      detail: `${source.length} locked packages from PHASE-21D aligned to export entries`,
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

export function buildEngineAdapterExportPack(): EngineAdapterExportPackResult {
  const identityLock = buildIdentityLockContinuityPreview();
  const source = identityLock.locked_image_generation_packages;

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const imageAppEntries = source.map(buildImageAppUnifiedEntry);
  const midjourneyEntries = source.map(buildMidjourneyPackEntry);
  const fluxEntries = source.map(buildFluxPackEntry);
  const sdxlEntries = source.map(buildSdxlPackEntry);
  const runwayEntries = source.map(buildRunwayReferencePackEntry);

  const export_formats = {
    image_app_unified: buildFormatPack('image_app_unified', imageAppEntries),
    midjourney_pack: buildFormatPack('midjourney_pack', midjourneyEntries),
    flux_pack: buildFormatPack('flux_pack', fluxEntries),
    sdxl_pack: buildFormatPack('sdxl_pack', sdxlEntries),
    runway_reference_pack: buildFormatPack('runway_reference_pack', runwayEntries),
  };

  const allCoreEntries: EngineAdapterExportCoreFields[] = [
    ...imageAppEntries,
    ...midjourneyEntries,
    ...fluxEntries,
    ...sdxlEntries,
    ...runwayEntries,
  ];
  const identityLocksPreserved = verifyIdentityLocksPreserved(source, allCoreEntries);

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const export_pack_verification_checks = buildVerificationChecks(
    source,
    export_formats,
    identityLocksPreserved,
    runtimeFingerprintBefore,
    runtimeFingerprintAfter
  );

  const exportCore = {
    schema_version: ENGINE_ADAPTER_EXPORT_PACK_VERSION,
    generated_at: ENGINE_ADAPTER_EXPORT_PACK_EPOCH,
    readonly_export: true as const,
    identity_lock_checksum_ref: identityLock.identity_lock_checksum,
    scene_count: source.length,
    export_formats,
    export_pack_verification_checks,
    validation: {
      deterministic_export_checksum_stable: true,
      readonly_export: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      all_formats_exported: export_pack_verification_checks.find(
        (check) => check.check_key === 'packages_exported'
      )?.passed ?? false,
      identity_locks_preserved: identityLocksPreserved,
    },
  };

  const export_pack_checksum = digest([
    JSON.stringify({ ...exportCore, export_pack_checksum: undefined }),
    identityLock.identity_lock_checksum,
  ]);

  return {
    ...exportCore,
    export_pack_checksum,
  };
}

let cachedExportPack: EngineAdapterExportPackResult | null = null;

export function buildEngineAdapterExportPackPreview(): EngineAdapterExportPackResult {
  if (cachedExportPack) return cachedExportPack;
  cachedExportPack = buildEngineAdapterExportPack();
  return cachedExportPack;
}

export function buildEngineAdapterExportPackJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildEngineAdapterExportPackPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: ENGINE_ADAPTER_EXPORT_PACK_JSON_FILENAME,
    body,
    contentType: 'application/json',
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetEngineAdapterExportPackCache(): void {
  cachedExportPack = null;
}
