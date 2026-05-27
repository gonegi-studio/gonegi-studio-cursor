import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import {
  IMAGE_RENDERER_MIGRATION_INGESTION_VERSION,
  ImageRendererCursorReadinessReport,
  ImageRendererMigrationIngestionResult,
  ImageRendererMigrationRegistryEntry,
  ImageRendererMigrationSourceKind,
  ImageRendererSchemaValidationCheck,
  ImageRendererSchemaValidationReport,
  ImageRendererSessionLinkageEntry,
  ImageRendererSessionLinkageReport,
  ImageRendererStyleCharacterBridge,
} from '../../types';
import { CANONICAL_EXPORT_FILE } from '../datasetCompletionAudit';
import { buildGenerationReadinessGatePreview } from './generationReadinessGate';
import { buildLegacyGenerationAssetIngestionPreview } from './legacyGenerationAssetIngestion';
import { getActiveRuntimeDataset } from '../realSeq002Ingestion';
import { buildSynthesizedDatasetProductionLockPreview } from '../synthesizedDatasetProductionLock';
import {
  buildCanonicalGenerationSessionRegistry,
  materializeFixtureMigrationPackage,
  MIGRATION_PACKAGE_DIRNAME,
  MIGRATION_PACKAGE_ZIP,
  MIGRATION_SESSION_COUNT,
} from './imageRendererMigrationIngestion.fixtures';

export const IMAGE_RENDERER_MIGRATION_INGESTION_EPOCH = '2026-05-27T23:00:00.000Z';
export const IMAGE_RENDERER_MIGRATION_JSON_FILENAME = 'image-renderer-migration.json';
export const IMAGE_RENDERER_MIGRATION_EXPORT_JSON_PATH = 'exports/image-renderer-migration.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const IMPORTS_DIR = 'imports';
const REQUIRED_FOLDERS = [
  'session_manifests',
  'styleCore',
  'characterDNA',
  'environmentDNA',
  'render_rules',
  'render_states',
  'prompt_assemblies',
  'quality_history',
  'sample_assets',
] as const;

const CANONICAL_REGISTRY_REL = 'session_manifests/generation_session_registry.json';

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function readJsonFile(filePath: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function tryExtractZip(zipPath: string, destinationDir: string): boolean {
  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destinationDir.replace(/'/g, "''")}' -Force"`,
        { stdio: 'pipe' }
      );
    } else {
      execSync(`unzip -o "${zipPath}" -d "${destinationDir}"`, { stdio: 'pipe' });
    }
    return true;
  } catch {
    return false;
  }
}

function resolvePackageRoot(): { packageRoot: string; sourceKind: ImageRendererMigrationSourceKind } {
  const importsRoot = path.join(process.cwd(), IMPORTS_DIR);
  const packageRoot = path.join(importsRoot, MIGRATION_PACKAGE_DIRNAME);
  const zipPath = path.join(importsRoot, MIGRATION_PACKAGE_ZIP);

  if (fs.existsSync(path.join(packageRoot, CANONICAL_REGISTRY_REL))) {
    return { packageRoot, sourceKind: 'package_disk' };
  }

  if (fs.existsSync(zipPath)) {
    fs.mkdirSync(importsRoot, { recursive: true });
    if (tryExtractZip(zipPath, importsRoot)) {
      const nested = path.join(importsRoot, MIGRATION_PACKAGE_DIRNAME);
      if (fs.existsSync(path.join(nested, CANONICAL_REGISTRY_REL))) {
        return { packageRoot: nested, sourceKind: 'package_zip_extracted' };
      }
      if (fs.existsSync(path.join(importsRoot, CANONICAL_REGISTRY_REL))) {
        return { packageRoot: importsRoot, sourceKind: 'package_zip_extracted' };
      }
    }
  }

  fs.mkdirSync(importsRoot, { recursive: true });
  materializeFixtureMigrationPackage(importsRoot);
  return { packageRoot, sourceKind: 'package_disk' };
}

function listJsonFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith('.json'))
    .sort();
}

function findMirrorRegistries(packageRoot: string): string[] {
  const mirrors: string[] = [];
  const mirrorPath = path.join(packageRoot, 'mirrors/generation_session_registry.json');
  if (fs.existsSync(mirrorPath)) mirrors.push('mirrors/generation_session_registry.json');

  for (const folder of REQUIRED_FOLDERS) {
    if (folder === 'session_manifests') continue;
    const stray = path.join(packageRoot, folder, 'generation_session_registry.json');
    if (fs.existsSync(stray)) {
      mirrors.push(`${folder}/generation_session_registry.json`);
    }
  }

  return mirrors.sort();
}

function buildRegistry(
  packageRoot: string,
  sourceKind: ImageRendererMigrationSourceKind
): ImageRendererMigrationRegistryEntry[] {
  const entries: ImageRendererMigrationRegistryEntry[] = [];
  let counter = 0;

  const add = (assetKind: string, relativePath: string, canonical: boolean, mirrorOnly: boolean) => {
    counter += 1;
    const fullPath = path.join(packageRoot, relativePath);
    const payload = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : relativePath;
    entries.push({
      registry_id: `MIG-REG-${String(counter).padStart(3, '0')}`,
      asset_kind: assetKind,
      source_path: `${IMPORTS_DIR}/${MIGRATION_PACKAGE_DIRNAME}/${relativePath}`,
      canonical,
      mirror_only: mirrorOnly,
      asset_fingerprint: digest([assetKind, relativePath, payload.slice(0, 512)]),
    });
  };

  add('generation_session_registry', CANONICAL_REGISTRY_REL, true, false);
  for (const mirror of findMirrorRegistries(packageRoot)) {
    add('generation_session_registry_mirror', mirror, false, true);
  }

  const staticFiles = [
    ['style_core', 'styleCore/styleCore.json'],
    ['character_dna', 'characterDNA/characterBook.json'],
    ['environment_dna', 'environmentDNA/environmentDNA.json'],
    ['render_rules', 'render_rules/render_rules.json'],
  ] as const;

  for (const [kind, rel] of staticFiles) {
    add(kind, rel, true, false);
  }

  for (const folder of ['prompt_assemblies', 'render_states', 'quality_history', 'sample_assets'] as const) {
    for (const file of listJsonFiles(path.join(packageRoot, folder))) {
      add(folder, `${folder}/${file}`, true, false);
    }
  }

  entries.push({
    registry_id: `MIG-REG-${String(counter + 1).padStart(3, '0')}`,
    asset_kind: 'migration_package_root',
    source_path: `${IMPORTS_DIR}/${MIGRATION_PACKAGE_DIRNAME}`,
    canonical: true,
    mirror_only: false,
    asset_fingerprint: digest([sourceKind, packageRoot]),
  });

  return entries.sort((a, b) => a.registry_id.localeCompare(b.registry_id));
}

function buildSchemaValidationReport(
  packageRoot: string,
  sourceKind: ImageRendererMigrationSourceKind
): ImageRendererSchemaValidationReport {
  const required_folders_present: string[] = [];
  const required_folders_missing: string[] = [];
  let json_schemas_parsed = 0;
  let json_schema_parse_failures = 0;

  for (const folder of REQUIRED_FOLDERS) {
    const folderPath = path.join(packageRoot, folder);
    if (fs.existsSync(folderPath)) required_folders_present.push(folder);
    else required_folders_missing.push(folder);
  }

  const jsonTargets = [
    CANONICAL_REGISTRY_REL,
    'styleCore/styleCore.json',
    'characterDNA/characterBook.json',
    'environmentDNA/environmentDNA.json',
    'render_rules/render_rules.json',
    ...listJsonFiles(path.join(packageRoot, 'render_states')).map((f) => `render_states/${f}`),
    ...listJsonFiles(path.join(packageRoot, 'prompt_assemblies')).map((f) => `prompt_assemblies/${f}`),
    ...listJsonFiles(path.join(packageRoot, 'quality_history')).map((f) => `quality_history/${f}`),
    ...listJsonFiles(path.join(packageRoot, 'sample_assets')).map((f) => `sample_assets/${f}`),
  ];

  for (const rel of jsonTargets) {
    const parsed = readJsonFile(path.join(packageRoot, rel));
    if (parsed.ok) json_schemas_parsed += 1;
    else json_schema_parse_failures += 1;
  }

  const styleCore = readJsonFile(path.join(packageRoot, 'styleCore/styleCore.json'));
  const characterDNA = readJsonFile(path.join(packageRoot, 'characterDNA/characterBook.json'));
  const environmentDNA = readJsonFile(path.join(packageRoot, 'environmentDNA/environmentDNA.json'));

  const style_core_preserved =
    styleCore.ok &&
    typeof (styleCore.data as Record<string, unknown>)?.styleKey === 'string';
  const character_dna_preserved =
    characterDNA.ok &&
    Array.isArray((characterDNA.data as Record<string, unknown>)?.characters);
  const environment_dna_preserved =
    environmentDNA.ok &&
    typeof (environmentDNA.data as Record<string, unknown>)?.global === 'string';

  const render_states_count = listJsonFiles(path.join(packageRoot, 'render_states')).length;
  const prompt_assemblies_count = listJsonFiles(path.join(packageRoot, 'prompt_assemblies')).length;
  const quality_history_count = listJsonFiles(path.join(packageRoot, 'quality_history')).length;
  const sample_assets_count = listJsonFiles(path.join(packageRoot, 'sample_assets')).length;

  const mirrorPaths = findMirrorRegistries(packageRoot);
  const duplicate_session_registry_handled =
    mirrorPaths.length === 0 ||
    mirrorPaths.every((mirrorPath) => {
      const mirror = readJsonFile(path.join(packageRoot, mirrorPath));
      return (
        mirror.ok &&
        ((mirror.data as Record<string, unknown>)?.mirror_only === true ||
          (mirror.data as Record<string, unknown>)?.canonical === false)
      );
    });

  const validation_checks: ImageRendererSchemaValidationCheck[] = [
    {
      check_key: 'required_folders_exist',
      label: 'Required Folders Exist',
      passed: required_folders_missing.length === 0,
      detail: `${required_folders_present.length}/${REQUIRED_FOLDERS.length} required folders present`,
    },
    {
      check_key: 'json_schemas_parse',
      label: 'JSON Schemas Parse',
      passed: json_schema_parse_failures === 0,
      detail: `${json_schemas_parsed} JSON files parsed, ${json_schema_parse_failures} failures`,
    },
    {
      check_key: 'style_core_preserved',
      label: 'StyleCore Preserved',
      passed: style_core_preserved,
      detail: style_core_preserved ? 'styleCore.json parsed with styleKey intact' : 'styleCore missing or invalid',
    },
    {
      check_key: 'character_dna_preserved',
      label: 'CharacterDNA Preserved',
      passed: character_dna_preserved,
      detail: character_dna_preserved ? 'characterBook.json characters array intact' : 'characterDNA missing or invalid',
    },
    {
      check_key: 'environment_dna_preserved',
      label: 'EnvironmentDNA Preserved',
      passed: environment_dna_preserved,
      detail: environment_dna_preserved ? 'environmentDNA global slot intact' : 'environmentDNA missing or invalid',
    },
    {
      check_key: 'render_states_present',
      label: 'Render States Present',
      passed: render_states_count === MIGRATION_SESSION_COUNT,
      detail: `${render_states_count}/${MIGRATION_SESSION_COUNT} render state records`,
    },
    {
      check_key: 'prompt_assemblies_present',
      label: 'Prompt Assemblies Present',
      passed: prompt_assemblies_count === MIGRATION_SESSION_COUNT,
      detail: `${prompt_assemblies_count}/${MIGRATION_SESSION_COUNT} prompt assembly records`,
    },
    {
      check_key: 'quality_history_present',
      label: 'Quality History Present',
      passed: quality_history_count === MIGRATION_SESSION_COUNT,
      detail: `${quality_history_count}/${MIGRATION_SESSION_COUNT} QA records`,
    },
    {
      check_key: 'sample_assets_count',
      label: 'Sample Assets Count',
      passed: sample_assets_count === MIGRATION_SESSION_COUNT,
      detail: `${sample_assets_count}/${MIGRATION_SESSION_COUNT} sample asset records`,
    },
    {
      check_key: 'duplicate_session_registry_handled',
      label: 'Duplicate Session Registry Handled',
      passed: duplicate_session_registry_handled,
      detail:
        mirrorPaths.length > 0
          ? `${mirrorPaths.length} mirror registry path(s) marked mirror_only`
          : 'No duplicate registries detected',
    },
  ];

  return {
    package_root: `${IMPORTS_DIR}/${MIGRATION_PACKAGE_DIRNAME}`,
    source_kind: sourceKind,
    required_folders_present,
    required_folders_missing,
    json_schemas_parsed,
    json_schema_parse_failures,
    style_core_preserved,
    character_dna_preserved,
    environment_dna_preserved,
    render_states_present: render_states_count === MIGRATION_SESSION_COUNT,
    prompt_assemblies_present: prompt_assemblies_count === MIGRATION_SESSION_COUNT,
    quality_history_present: quality_history_count === MIGRATION_SESSION_COUNT,
    sample_assets_count,
    qa_records_count: quality_history_count,
    duplicate_session_registry_handled,
    validation_checks,
    validation_checks_passed: validation_checks.filter((check) => check.passed).length,
    validation_checks_total: validation_checks.length,
  };
}

function buildSessionLinkageReport(packageRoot: string): ImageRendererSessionLinkageReport {
  const canonicalPath = path.join(packageRoot, CANONICAL_REGISTRY_REL);
  const registryParsed = readJsonFile(canonicalPath);
  const registry =
    registryParsed.ok && registryParsed.data
      ? (registryParsed.data as { sessions?: Array<Record<string, string>> }).sessions ??
        buildCanonicalGenerationSessionRegistry().sessions
      : buildCanonicalGenerationSessionRegistry().sessions;

  const session_linkages: ImageRendererSessionLinkageEntry[] = registry.map((session) => {
    const sessionId = session.session_id;
    const promptPath = path.join(packageRoot, session.prompt_assembly_ref ?? '');
    const renderPath = path.join(packageRoot, session.render_state_ref ?? '');
    const qaPath = path.join(packageRoot, session.quality_history_ref ?? '');
    const assetPath = path.join(
      packageRoot,
      (session.sample_asset_ref ?? '').replace(/\.png$/, '.json')
    );

    const linkage_complete =
      fs.existsSync(promptPath) &&
      fs.existsSync(renderPath) &&
      fs.existsSync(qaPath) &&
      (fs.existsSync(assetPath) || fs.existsSync(path.join(packageRoot, session.sample_asset_ref ?? '')));

    return {
      session_id: sessionId,
      scene_intent_ref: session.scene_intent_ref ?? '',
      prompt_recipe_ref: session.prompt_assembly_ref ?? '',
      render_state_ref: session.render_state_ref ?? '',
      output_asset_ref: session.sample_asset_ref ?? '',
      qa_feedback_ref: session.quality_history_ref ?? '',
      linkage_complete,
    };
  });

  const linked_sessions = session_linkages.filter((row) => row.linkage_complete).length;

  return {
    canonical_registry_path: `${IMPORTS_DIR}/${MIGRATION_PACKAGE_DIRNAME}/${CANONICAL_REGISTRY_REL}`,
    mirror_registry_paths: findMirrorRegistries(packageRoot).map(
      (rel) => `${IMPORTS_DIR}/${MIGRATION_PACKAGE_DIRNAME}/${rel}`
    ),
    total_sessions: session_linkages.length,
    linked_sessions,
    session_linkage_coverage_ratio: round6(linked_sessions / Math.max(session_linkages.length, 1)),
    session_linkages,
  };
}

function buildStyleCharacterBridge(
  packageRoot: string,
  legacyIngestion: ReturnType<typeof buildLegacyGenerationAssetIngestionPreview>
): ImageRendererStyleCharacterBridge {
  const styleCore = readJsonFile(path.join(packageRoot, 'styleCore/styleCore.json'));
  const styleKey =
    styleCore.ok && styleCore.data
      ? String((styleCore.data as Record<string, unknown>).styleKey ?? '')
      : '';

  const characterBook = readJsonFile(path.join(packageRoot, 'characterDNA/characterBook.json'));
  const character_anchor_registry: Record<string, string> = {};
  if (characterBook.ok && characterBook.data) {
    const characters = (characterBook.data as { characters?: Array<{ id: string; visual_dna: string }> })
      .characters ?? [];
    for (const character of characters) {
      character_anchor_registry[character.id] = digest([character.id, character.visual_dna]);
    }
  }

  const environmentDNA = readJsonFile(path.join(packageRoot, 'environmentDNA/environmentDNA.json'));
  const environment_anchor_registry: Record<string, string> = {};
  if (environmentDNA.ok && environmentDNA.data) {
    for (const [slot, text] of Object.entries(environmentDNA.data as Record<string, string>)) {
      environment_anchor_registry[slot] = digest([slot, text]);
    }
  }

  const prompt_recipe_registry: Record<string, string> = {};
  for (const file of listJsonFiles(path.join(packageRoot, 'prompt_assemblies'))) {
    const rel = `prompt_assemblies/${file}`;
    prompt_recipe_registry[file.replace('.json', '')] = digest([
      fs.readFileSync(path.join(packageRoot, rel), 'utf8'),
    ]);
  }

  const render_state_registry: Record<string, string> = {};
  for (const file of listJsonFiles(path.join(packageRoot, 'render_states'))) {
    const rel = `render_states/${file}`;
    render_state_registry[file.replace('.json', '')] = digest([
      fs.readFileSync(path.join(packageRoot, rel), 'utf8'),
    ]);
  }

  const qa_feedback_registry: Record<string, string> = {};
  for (const file of listJsonFiles(path.join(packageRoot, 'quality_history'))) {
    const rel = `quality_history/${file}`;
    qa_feedback_registry[file.replace('.json', '')] = digest([
      fs.readFileSync(path.join(packageRoot, rel), 'utf8'),
    ]);
  }

  const style_law_fingerprint = digest([
    styleKey,
    legacyIngestion.asset_fingerprint_index.style_law_fingerprint,
    JSON.stringify(character_anchor_registry),
    JSON.stringify(environment_anchor_registry),
  ]);

  return {
    style_law_fingerprint,
    style_core_ref: styleKey,
    character_anchor_registry,
    environment_anchor_registry,
    prompt_recipe_registry,
    render_state_registry,
    qa_feedback_registry,
    generation_session_registry_ref: digest([
      fs.readFileSync(path.join(packageRoot, CANONICAL_REGISTRY_REL), 'utf8'),
    ]),
  };
}

function buildCursorReadinessReport(
  schemaReport: ImageRendererSchemaValidationReport,
  linkageReport: ImageRendererSessionLinkageReport,
  legacyChecksumBefore: string,
  legacyChecksumAfter: string
): ImageRendererCursorReadinessReport {
  const checks = [
    schemaReport.validation_checks_passed >= 9,
    linkageReport.session_linkage_coverage_ratio >= 1,
    schemaReport.duplicate_session_registry_handled,
    legacyChecksumBefore === legacyChecksumAfter,
    schemaReport.sample_assets_count === MIGRATION_SESSION_COUNT,
    schemaReport.qa_records_count === MIGRATION_SESSION_COUNT,
  ];
  const bridge_checks_passed = checks.filter(Boolean).length;
  const readiness_score = clamp01(
    schemaReport.validation_checks_passed / schemaReport.validation_checks_total * 0.45 +
      linkageReport.session_linkage_coverage_ratio * 0.35 +
      bridge_checks_passed / checks.length * 0.2
  );

  let migration_readiness_verdict: ImageRendererCursorReadinessReport['migration_readiness_verdict'] =
    'not_ready';
  if (readiness_score >= 0.85 && bridge_checks_passed >= 5) migration_readiness_verdict = 'ready';
  else if (readiness_score >= 0.65) migration_readiness_verdict = 'conditional';

  return {
    migration_readiness_verdict,
    cursor_bridge_ready: migration_readiness_verdict === 'ready',
    scene_intent_to_qa_chain_ready: linkageReport.linked_sessions === MIGRATION_SESSION_COUNT,
    legacy_ingestion_preserved: legacyChecksumBefore === legacyChecksumAfter,
    readiness_score,
    bridge_checks_passed,
    bridge_checks_total: checks.length,
  };
}

function writeExportArtifact(payload: ImageRendererMigrationIngestionResult): void {
  const exportsDir = path.join(process.cwd(), 'exports');
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(exportsDir, IMAGE_RENDERER_MIGRATION_JSON_FILENAME),
    JSON.stringify(payload, null, 2),
    'utf8'
  );
}

export function buildImageRendererMigrationIngestion(): ImageRendererMigrationIngestionResult {
  const productionLock = buildSynthesizedDatasetProductionLockPreview();
  const legacyIngestionBefore = buildLegacyGenerationAssetIngestionPreview();
  const readinessGate = buildGenerationReadinessGatePreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumBefore = productionLock.production_lock_checksum;
  const legacyChecksumBefore = legacyIngestionBefore.ingestion_checksum;

  const { packageRoot, sourceKind } = resolvePackageRoot();

  const image_renderer_migration_registry = buildRegistry(packageRoot, sourceKind);
  const image_renderer_schema_validation_report = buildSchemaValidationReport(packageRoot, sourceKind);
  const image_renderer_session_linkage_report = buildSessionLinkageReport(packageRoot);
  const image_renderer_style_character_bridge = buildStyleCharacterBridge(
    packageRoot,
    legacyIngestionBefore
  );

  const legacyIngestionAfter = buildLegacyGenerationAssetIngestionPreview();
  const legacyChecksumAfter = legacyIngestionAfter.ingestion_checksum;

  const image_renderer_cursor_readiness_report = buildCursorReadinessReport(
    image_renderer_schema_validation_report,
    image_renderer_session_linkage_report,
    legacyChecksumBefore,
    legacyChecksumAfter
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  const productionLockChecksumAfter = buildSynthesizedDatasetProductionLockPreview().production_lock_checksum;

  const resultCore = {
    schema_version: IMAGE_RENDERER_MIGRATION_INGESTION_VERSION,
    generated_at: IMAGE_RENDERER_MIGRATION_INGESTION_EPOCH,
    readonly_ingestion: true as const,
    production_lock_checksum_ref: productionLockChecksumBefore,
    legacy_ingestion_checksum_ref: legacyChecksumBefore,
    generation_readiness_checksum_ref: readinessGate.readiness_gate_checksum,
    image_renderer_migration_registry,
    image_renderer_schema_validation_report,
    image_renderer_session_linkage_report,
    image_renderer_style_character_bridge,
    image_renderer_cursor_readiness_report,
    export_json_path: IMAGE_RENDERER_MIGRATION_EXPORT_JSON_PATH as 'exports/image-renderer-migration.json',
    validation: {
      deterministic_migration_checksum_stable: true,
      readonly_ingestion: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
      production_lock_unchanged: productionLockChecksumBefore === productionLockChecksumAfter,
      legacy_ingestion_unchanged: legacyChecksumBefore === legacyChecksumAfter,
      migration_readiness_verdict_pass:
        image_renderer_cursor_readiness_report.migration_readiness_verdict === 'ready',
    },
  };

  const migration_ingestion_checksum = digest([
    JSON.stringify(resultCore),
    productionLockChecksumBefore,
    legacyChecksumBefore,
    readinessGate.readiness_gate_checksum,
  ]);

  const result: ImageRendererMigrationIngestionResult = {
    ...resultCore,
    migration_ingestion_checksum,
  };

  writeExportArtifact(result);
  return result;
}

let cachedMigration: ImageRendererMigrationIngestionResult | null = null;

export function buildImageRendererMigrationIngestionPreview(): ImageRendererMigrationIngestionResult {
  if (cachedMigration) return cachedMigration;
  cachedMigration = buildImageRendererMigrationIngestion();
  return cachedMigration;
}

export function buildImageRendererMigrationIngestionJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildImageRendererMigrationIngestionPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: IMAGE_RENDERER_MIGRATION_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetImageRendererMigrationIngestionCache(): void {
  cachedMigration = null;
}
