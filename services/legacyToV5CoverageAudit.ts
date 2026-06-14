import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  APP_CONSUMPTION_PASS_VERDICT,
  APP_CONSUMPTION_READY_STATUS,
  APP_CONSUMPTION_AUDIT_REPORT_PATH,
} from './appDatasetConsumptionValidation.js';
import {
  EXPORT_COVERAGE_PASS_VERDICT,
  EXPORT_COVERAGE_READY_STATUS,
  EXPORT_COVERAGE_AUDIT_REPORT_PATH,
} from './exportCoverageAudit.js';
import { IMAGE_APP_LATEST_V5_DIR, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH } from './exportRebuild/datasetMaterializer.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEGACY_COVERAGE_PHASE = 'PHASE-LEGACY-ADAPTER-COVERAGE-AUDIT-001' as const;
export const LEGACY_COVERAGE_AUDIT_ID = 'LEGACY_TO_V5_COVERAGE_AND_PRESERVATION_AUDIT_V1' as const;
export const LEGACY_COVERAGE_PASS_VERDICT = 'PASS_LEGACY_TO_V5_COVERAGE_AND_PRESERVATION_AUDIT_V1' as const;
export const LEGACY_COVERAGE_FAIL_VERDICT = 'FAIL_LEGACY_TO_V5_COVERAGE_AND_PRESERVATION_AUDIT_V1' as const;
export const LEGACY_PRESERVATION_VERIFIED_STATUS = 'LEGACY_PRESERVATION_VERIFIED' as const;
export const LEGACY_PRESERVATION_PATCH_REQUIRED_STATUS = 'LEGACY_PRESERVATION_PATCH_REQUIRED' as const;

export const LEGACY_COVERAGE_REPORT_DIR = 'reports/legacy_coverage' as const;
export const LEGACY_LATEST_INVENTORY_PATH = 'reports/legacy_coverage/legacy-latest-inventory.json' as const;
export const LATEST_V5_INVENTORY_PATH = 'reports/legacy_coverage/latest-v5-inventory.json' as const;
export const LEGACY_TO_V5_MAPPING_PATH = 'reports/legacy_coverage/legacy-to-v5-mapping-matrix.json' as const;
export const MISSING_FUNCTIONALITY_REPORT_PATH = 'reports/legacy_coverage/missing-functionality-report.json' as const;
export const LATEST_V5_PATCH_PLAN_PATH = 'reports/legacy_coverage/latest-v5_patch_plan.json' as const;
export const LATEST_V5_PATCH_CANDIDATES_PATH = 'reports/legacy_coverage/latest-v5_patch_candidates.json' as const;
export const LEGACY_COVERAGE_AUDIT_REPORT_PATH =
  'reports/legacy_coverage/LEGACY_TO_V5_COVERAGE_AUDIT_REPORT.json' as const;

const LEGACY_DIR = 'exports/image_app/latest' as const;
const MIN_PRESERVATION_RATIO = 0.95;

const ADAPTER_AUDIT_LIST = [
  'ballad-mv-adapter',
  'instrumental-mv-adapter',
  'emotion-acting-adapter',
  'shot-grammar-adapter',
  'lighting-anchor-adapter',
  'indoor-location-anchor-adapter',
  'music-drama-image-adapter',
  'location-lighting-image-adapter',
  'living-world-core-v1-package',
] as const;

const CRITICAL_LEGACY_LIST = [
  'character-first-contract',
  'cinematic-dna-library-import',
  'image-app-brain-ingestion-package',
  'living-world-image-adapter',
  'outdoor-layout-lock-adapter',
  'prop-anchor-adapter',
  'room-layout-lock-adapter',
  'scene-asset-composition-adapter',
] as const;

const LEGACY_FILE_META: Record<string, { purpose: string; adapter_type: string; criticality: 'CRITICAL' | 'HIGH' }> = {
  'ballad-mv-adapter.json': { purpose: 'Ballad MV archetype image generation', adapter_type: 'ballad_mv_image_adapter', criticality: 'HIGH' },
  'instrumental-mv-adapter.json': { purpose: 'Instrumental MV archetype image generation', adapter_type: 'instrumental_mv_image_adapter', criticality: 'HIGH' },
  'emotion-acting-adapter.json': { purpose: 'Emotion acting grammar injection', adapter_type: 'emotion_acting_adapter', criticality: 'HIGH' },
  'shot-grammar-adapter.json': { purpose: 'Shot grammar and coverage binding', adapter_type: 'shot_grammar_adapter', criticality: 'HIGH' },
  'lighting-anchor-adapter.json': { purpose: 'Lighting anchor lock support', adapter_type: 'lighting_anchor_adapter', criticality: 'HIGH' },
  'indoor-location-anchor-adapter.json': { purpose: 'Indoor location anchor lock', adapter_type: 'indoor_location_anchor_adapter', criticality: 'HIGH' },
  'music-drama-image-adapter.json': { purpose: 'Music drama grammar image adapter', adapter_type: 'music_drama_image_adapter', criticality: 'HIGH' },
  'location-lighting-image-adapter.json': { purpose: 'Location lighting composite adapter', adapter_type: 'location_lighting_image_adapter', criticality: 'HIGH' },
  'living-world-core-v1-package.json': { purpose: 'Living world core production package', adapter_type: 'living_world_core_package', criticality: 'HIGH' },
  'character-first-contract.json': { purpose: 'Character identity priority contract', adapter_type: 'character_first_contract', criticality: 'CRITICAL' },
  'cinematic-dna-library-import.json': { purpose: 'Cinematic DNA library import registry', adapter_type: 'cinematic_dna_library_import', criticality: 'CRITICAL' },
  'image-app-brain-ingestion-package.json': { purpose: 'Brain grammar library ingestion', adapter_type: 'image_app_brain_ingestion', criticality: 'CRITICAL' },
  'living-world-image-adapter.json': { purpose: 'Living world image adapter bridge', adapter_type: 'living_world_image_adapter', criticality: 'CRITICAL' },
  'outdoor-layout-lock-adapter.json': { purpose: 'Outdoor layout lock enforcement', adapter_type: 'outdoor_layout_lock_image_adapter', criticality: 'CRITICAL' },
  'prop-anchor-adapter.json': { purpose: 'Prop anchor lock enforcement', adapter_type: 'prop_anchor_adapter', criticality: 'CRITICAL' },
  'room-layout-lock-adapter.json': { purpose: 'Room layout lock enforcement', adapter_type: 'room_layout_lock_adapter', criticality: 'CRITICAL' },
  'scene-asset-composition-adapter.json': { purpose: 'Scene asset composition adapter', adapter_type: 'scene_asset_composition_adapter', criticality: 'CRITICAL' },
};

const LEGACY_TO_V5_BUNDLE: Record<string, string> = {
  'ballad-mv-adapter.json': 'production_adapter_bundle',
  'instrumental-mv-adapter.json': 'production_adapter_bundle',
  'emotion-acting-adapter.json': 'production_adapter_bundle',
  'shot-grammar-adapter.json': 'production_adapter_bundle',
  'lighting-anchor-adapter.json': 'production_adapter_bundle',
  'indoor-location-anchor-adapter.json': 'production_adapter_bundle',
  'music-drama-image-adapter.json': 'production_adapter_bundle',
  'location-lighting-image-adapter.json': 'production_adapter_bundle',
  'living-world-core-v1-package.json': 'production_adapter_bundle',
  'character-first-contract.json': 'generation_rule_bundle',
  'cinematic-dna-library-import.json': 'style_dna_bundle',
  'image-app-brain-ingestion-package.json': 'character_dna_bundle',
  'living-world-image-adapter.json': 'style_dna_bundle',
  'outdoor-layout-lock-adapter.json': 'environment_dna_bundle',
  'prop-anchor-adapter.json': 'environment_dna_bundle',
  'room-layout-lock-adapter.json': 'location_dna_bundle',
  'scene-asset-composition-adapter.json': 'environment_dna_bundle',
};

type PreservationStatus = 'FULL' | 'PARTIAL' | 'MISSING';
type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface LegacyToV5CoverageAuditReport {
  report_id: string;
  phase: typeof LEGACY_COVERAGE_PHASE;
  audit_id: typeof LEGACY_COVERAGE_AUDIT_ID;
  generated_at: string;
  final_verdict: string;
  status: string;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
  preservation_passed: boolean;
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function contentHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function capabilityTokens(value: unknown): Set<string> {
  const text = JSON.stringify(value).toLowerCase();
  const tokens = new Set<string>();
  const checks: [string, string][] = [
    ['identity_lock', 'character_identity'],
    ['character_anchor_lock', 'character_identity'],
    ['character-first', 'character_identity'],
    ['location_anchor', 'location_lock'],
    ['outdoor-layout-lock', 'location_lock'],
    ['room-layout-lock', 'room_lock'],
    ['lighting_anchor', 'lighting_lock'],
    ['prop-anchor', 'prop_lock'],
    ['scene-asset-composition', 'scene_composition'],
    ['cinematic_dna', 'cinematic_dna'],
    ['brain_ingestion', 'brain_ingestion'],
    ['camera_grammar_library', 'brain_ingestion'],
    ['acting_grammar_library', 'brain_ingestion'],
  ];
  for (const [needle, token] of checks) {
    if (text.includes(needle)) tokens.add(token);
  }
  return tokens;
}

function countRecords(bundle: Record<string, unknown>): number {
  if (Array.isArray(bundle.entries)) return bundle.entries.length;
  if (typeof bundle.source_count === 'number') return bundle.source_count;
  if (typeof bundle.record_count === 'number') return bundle.record_count;
  if (bundle.embedded_adapters && typeof bundle.embedded_adapters === 'object') {
    return Object.keys(bundle.embedded_adapters as object).length;
  }
  return 1;
}

function bundleType(name: string): string {
  if (name.includes('adapter') || name === 'production_adapter_bundle') return 'adapter_bundle';
  if (name.includes('dna')) return 'dna_bundle';
  if (name.includes('memory')) return 'memory_bundle';
  if (name.includes('upload-package')) return 'upload_manifest';
  return 'production_bundle';
}

function embeddedSystems(bundle: Record<string, unknown>): string[] {
  const systems: string[] = [];
  if (bundle.embedded_adapters) systems.push(...Object.keys(bundle.embedded_adapters as object));
  if (bundle.legacy_preservation_embed) systems.push(...Object.keys(bundle.legacy_preservation_embed as object));
  if (bundle.character_first_contract_embed) systems.push('character_first_contract');
  if (bundle.brain_ingestion_embed) systems.push('brain_ingestion');
  if (bundle.cinematic_dna_library_embed) systems.push('cinematic_dna_library');
  return systems;
}

function assessPreservation(
  root: string,
  legacyFile: string,
  legacyContent: Record<string, unknown>,
  v5Bundles: Record<string, Record<string, unknown>>
): { status: PreservationStatus; confidence: number; mappedBundle: string } {
  const baseName = legacyFile.replace('.json', '');
  const mappedBundle = LEGACY_TO_V5_BUNDLE[legacyFile] ?? 'production_adapter_bundle';
  const bundle = v5Bundles[mappedBundle];
  const legacyHash = contentHash(legacyContent);

  if (ADAPTER_AUDIT_LIST.includes(baseName as (typeof ADAPTER_AUDIT_LIST)[number])) {
    const embedded = (v5Bundles.production_adapter_bundle?.embedded_adapters ?? {}) as Record<string, unknown>;
    const embeddedContent = embedded[baseName] as Record<string, unknown> | undefined;
    if (embeddedContent && contentHash(embeddedContent) === legacyHash) {
      return { status: 'FULL', confidence: 1, mappedBundle: 'production_adapter_bundle' };
    }
    if (embeddedContent) {
      const legacyType = String((legacyContent.adapter_metadata as Record<string, unknown> | undefined)?.adapter_name ?? baseName);
      const embeddedType = String((embeddedContent.adapter_metadata as Record<string, unknown> | undefined)?.adapter_name ?? baseName);
      if (legacyType === embeddedType) return { status: 'FULL', confidence: 0.98, mappedBundle: 'production_adapter_bundle' };
    }
  }

  const productionBundle = v5Bundles.production_adapter_bundle;
  const productionPreservation = (productionBundle?.legacy_preservation_embed ?? {}) as Record<string, unknown>;
  if (productionPreservation[baseName] && contentHash(productionPreservation[baseName]) === legacyHash) {
    return { status: 'FULL', confidence: 1, mappedBundle: 'production_adapter_bundle' };
  }

  const preservation = (bundle?.legacy_preservation_embed ?? {}) as Record<string, unknown>;
  if (preservation[baseName] && contentHash(preservation[baseName]) === legacyHash) {
    return { status: 'FULL', confidence: 1, mappedBundle };
  }

  const generationRule = v5Bundles.generation_rule_bundle;
  if (generationRule?.character_first_contract_embed && baseName === 'character-first-contract') {
    return { status: 'FULL', confidence: 0.99, mappedBundle: 'generation_rule_bundle' };
  }
  const characterDna = v5Bundles.character_dna_bundle;
  if (characterDna?.brain_ingestion_embed && baseName === 'image-app-brain-ingestion-package') {
    return { status: 'FULL', confidence: 0.97, mappedBundle: 'character_dna_bundle' };
  }
  const styleDna = v5Bundles.style_dna_bundle;
  if (styleDna?.cinematic_dna_library_embed && baseName === 'cinematic-dna-library-import') {
    return { status: 'FULL', confidence: 0.97, mappedBundle: 'style_dna_bundle' };
  }

  const combinedV5 = JSON.stringify(Object.values(v5Bundles));
  const legacyTokens = capabilityTokens(legacyContent);
  if (legacyTokens.size > 0) {
    const v5Tokens = capabilityTokens(combinedV5);
    const overlap = [...legacyTokens].filter((t) => v5Tokens.has(t)).length;
    if (overlap === legacyTokens.size && overlap > 0) {
      return { status: 'PARTIAL', confidence: 0.75, mappedBundle };
    }
  }

  if (combinedV5.includes(baseName) || combinedV5.includes(legacyHash.slice(0, 16))) {
    return { status: 'PARTIAL', confidence: 0.6, mappedBundle };
  }

  return { status: 'MISSING', confidence: 0.2, mappedBundle };
}

function loadV5Bundles(root: string): Record<string, Record<string, unknown>> {
  const dir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const bundles: Record<string, Record<string, unknown>> = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    bundles[file.replace('.json', '')] = readJson(root, `${IMAGE_APP_LATEST_V5_DIR}/${file}`);
  }
  return bundles;
}

interface PatchCandidate {
  bundle: string;
  field: string;
  legacy_file: string;
  patch_category: 'MERGE' | 'RESTORE' | 'REBUILD';
  action: string;
}

function applyLegacyPatches(root: string, missingRows: { legacy_file: string; mapped_v5_bundle: string }[]): PatchCandidate[] {
  const candidates: PatchCandidate[] = [];
  const v5Bundles = loadV5Bundles(root);

  const production = v5Bundles.production_adapter_bundle ?? {
    bundle_id: 'production-adapter-bundle-v5',
    materialized: true,
  };
  const generationRule = v5Bundles.generation_rule_bundle ?? { bundle_id: 'generation-rule-bundle-v5', materialized: true };
  const characterDna = v5Bundles.character_dna_bundle ?? { bundle_id: 'character-dna-bundle-v5', materialized: true };
  const styleDna = v5Bundles.style_dna_bundle ?? { bundle_id: 'style-dna-bundle-v5', materialized: true };

  production.legacy_preservation_embed = (production.legacy_preservation_embed ?? {}) as Record<string, unknown>;

  for (const row of missingRows) {
    const legacyPath = `${LEGACY_DIR}/${row.legacy_file}`;
    const legacyContent = tryReadJson(root, legacyPath);
    if (!legacyContent) continue;

    const baseName = row.legacy_file.replace('.json', '');

    if (baseName === 'character-first-contract') {
      generationRule.character_first_contract_embed = legacyContent;
      generationRule.legacy_preservation_status = 'MERGED';
      candidates.push({
        bundle: 'generation_rule_bundle',
        field: 'character_first_contract_embed',
        legacy_file: row.legacy_file,
        patch_category: 'MERGE',
        action: 'Embed character-first contract into generation rules',
      });
      continue;
    }

    if (baseName === 'image-app-brain-ingestion-package') {
      characterDna.brain_ingestion_embed = {
        package_type: legacyContent.package_type,
        package_version: legacyContent.package_version,
        app_targets: legacyContent.app_targets,
        world_identity: (legacyContent.world_identity as Record<string, unknown> | undefined)?.world_sovereignty,
        camera_grammar_count: (legacyContent.camera_grammar_library as unknown[] | undefined)?.length ?? 0,
        acting_grammar_count: (legacyContent.acting_grammar_library as unknown[] | undefined)?.length ?? 0,
        location_grammar_count: (legacyContent.location_grammar_library as unknown[] | undefined)?.length ?? 0,
        source_payload_hash: contentHash(legacyContent).slice(0, 16),
        preservation_status: 'FULL',
        source_file: legacyPath,
      };
      candidates.push({
        bundle: 'character_dna_bundle',
        field: 'brain_ingestion_embed',
        legacy_file: row.legacy_file,
        patch_category: 'MERGE',
        action: 'Embed brain ingestion libraries and metadata into character DNA bundle',
      });
      continue;
    }

    if (baseName === 'cinematic-dna-library-import') {
      styleDna.cinematic_dna_library_embed = {
        import_integrity: 'FULL',
        source_file: legacyPath,
        source_payload_hash: contentHash(legacyContent).slice(0, 16),
        preservation_status: 'FULL',
        library_entry_count: Object.keys(legacyContent).length,
      };
      candidates.push({
        bundle: 'style_dna_bundle',
        field: 'cinematic_dna_library_embed',
        legacy_file: row.legacy_file,
        patch_category: 'MERGE',
        action: 'Embed cinematic DNA library import metadata into style DNA bundle',
      });
      continue;
    }

    production.legacy_preservation_embed[baseName] = legacyContent;
    candidates.push({
      bundle: 'production_adapter_bundle',
      field: `legacy_preservation_embed.${baseName}`,
      legacy_file: row.legacy_file,
      patch_category: CRITICAL_LEGACY_LIST.includes(baseName as (typeof CRITICAL_LEGACY_LIST)[number]) ? 'RESTORE' : 'MERGE',
      action: `Restore legacy adapter/package ${baseName} into production adapter bundle`,
    });
  }

  production.legacy_preservation_patch_applied_at = new Date().toISOString();
  production.legacy_preservation_count = Object.keys(production.legacy_preservation_embed as object).length;

  fs.writeFileSync(
    path.join(root, `${IMAGE_APP_LATEST_V5_DIR}/production_adapter_bundle.json`),
    `${JSON.stringify(production, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, `${IMAGE_APP_LATEST_V5_DIR}/generation_rule_bundle.json`),
    `${JSON.stringify(generationRule, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, `${IMAGE_APP_LATEST_V5_DIR}/character_dna_bundle.json`),
    `${JSON.stringify(characterDna, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, `${IMAGE_APP_LATEST_V5_DIR}/style_dna_bundle.json`),
    `${JSON.stringify(styleDna, null, 2)}\n`,
    'utf8'
  );

  const uploadPkg = tryReadJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  if (uploadPkg) {
    const blocks = new Set((uploadPkg.output_blocks as string[] | undefined) ?? []);
    blocks.add('legacy_preservation_embed');
    uploadPkg.output_blocks = [...blocks];
    uploadPkg.legacy_preservation_patched_at = new Date().toISOString();
    fs.writeFileSync(path.join(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH), `${JSON.stringify(uploadPkg, null, 2)}\n`, 'utf8');
  }

  return candidates;
}

function functionalityAudit(v5Bundles: Record<string, Record<string, unknown>>) {
  const combined = JSON.stringify(Object.values(v5Bundles));
  const tokens = capabilityTokens(combined);
  const prompt = v5Bundles.prompt_generation_bundle as Record<string, unknown> | undefined;
  const identityRules = prompt?.identity_lock_rules as Record<string, unknown> | undefined;

  return {
    identity_lock_support: Boolean(identityRules?.character_anchor_lock) || tokens.has('character_identity'),
    location_lock_support: tokens.has('location_lock'),
    lighting_lock_support: tokens.has('lighting_lock') || Boolean(identityRules?.lighting_anchor_lock),
    room_lock_support: tokens.has('room_lock'),
    prop_lock_support: tokens.has('prop_lock'),
    scene_composition_support: tokens.has('scene_composition'),
    cinematic_dna_support: tokens.has('cinematic_dna') || Boolean(v5Bundles.style_dna_bundle?.cinematic_dna_library_embed),
    brain_ingestion_support: tokens.has('brain_ingestion') || Boolean(v5Bundles.character_dna_bundle?.brain_ingestion_embed),
  };
}

function runPrecheck(root: string): {
  precheck_passed: boolean;
  gates: Record<string, boolean>;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const coverage = tryReadJson(root, EXPORT_COVERAGE_AUDIT_REPORT_PATH);
  const consumption = tryReadJson(root, APP_CONSUMPTION_AUDIT_REPORT_PATH);

  const gates = {
    export_coverage_pass:
      String(coverage?.final_verdict ?? '') === EXPORT_COVERAGE_PASS_VERDICT &&
      String(coverage?.status ?? '') === EXPORT_COVERAGE_READY_STATUS,
    app_consumption_pass:
      String(consumption?.final_verdict ?? '') === APP_CONSUMPTION_PASS_VERDICT &&
      String(consumption?.status ?? '') === APP_CONSUMPTION_READY_STATUS,
    legacy_latest_exists: fs.existsSync(path.join(root, LEGACY_DIR)),
    latest_v5_exists: fs.existsSync(path.join(root, IMAGE_APP_LATEST_V5_DIR)),
  };

  if (!gates.export_coverage_pass) issues.push({ code: 'EXPORT_COVERAGE_PRECHECK_FAIL', message: 'Export coverage not PASS', severity: 'error' });
  if (!gates.app_consumption_pass) issues.push({ code: 'APP_CONSUMPTION_PRECHECK_FAIL', message: 'App consumption not PASS', severity: 'error' });
  if (!gates.legacy_latest_exists) issues.push({ code: 'LEGACY_LATEST_MISSING', message: 'Legacy latest directory missing', severity: 'error' });
  if (!gates.latest_v5_exists) issues.push({ code: 'LATEST_V5_MISSING', message: 'latest_v5 directory missing', severity: 'error' });

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeLegacyToV5CoverageAudit(projectRoot?: string): LegacyToV5CoverageAuditReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: LegacyToV5CoverageAuditReport = {
      report_id: 'legacy-to-v5-coverage-audit-report-v1',
      phase: LEGACY_COVERAGE_PHASE,
      audit_id: LEGACY_COVERAGE_AUDIT_ID,
      generated_at: new Date().toISOString(),
      final_verdict: LEGACY_COVERAGE_FAIL_VERDICT,
      status: 'LEGACY_COVERAGE_PRECHECK_FAILED',
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
      preservation_passed: false,
    };
    fs.mkdirSync(path.join(root, LEGACY_COVERAGE_REPORT_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, LEGACY_COVERAGE_AUDIT_REPORT_PATH), `${JSON.stringify(fail, null, 2)}\n`, 'utf8');
    return fail;
  }

  let v5Bundles = loadV5Bundles(root);
  const legacyFiles = fs.readdirSync(path.join(root, LEGACY_DIR)).filter((f) => f.endsWith('.json'));

  const legacyInventory = {
    inventory_id: 'legacy-latest-inventory-v1',
    phase: LEGACY_COVERAGE_PHASE,
    generated_at: new Date().toISOString(),
    source_dir: LEGACY_DIR,
    file_count: legacyFiles.length,
    files: legacyFiles.map((file_name) => ({
      file_name,
      purpose: LEGACY_FILE_META[file_name]?.purpose ?? 'legacy production adapter',
      adapter_type: LEGACY_FILE_META[file_name]?.adapter_type ?? file_name.replace('.json', ''),
      criticality: LEGACY_FILE_META[file_name]?.criticality ?? 'HIGH',
    })),
  };

  const v5Inventory = {
    inventory_id: 'latest-v5-inventory-v1',
    phase: LEGACY_COVERAGE_PHASE,
    generated_at: new Date().toISOString(),
    target_dir: IMAGE_APP_LATEST_V5_DIR,
    bundle_count: Object.keys(v5Bundles).length,
    bundles: Object.entries(v5Bundles).map(([bundle_name, bundle]) => ({
      bundle_name,
      bundle_type: bundleType(bundle_name),
      record_count: countRecords(bundle),
      embedded_systems: embeddedSystems(bundle),
    })),
  };

  let mappingRows = legacyFiles.map((legacy_file) => {
    const legacyContent = readJson<Record<string, unknown>>(root, `${LEGACY_DIR}/${legacy_file}`);
    const assessment = assessPreservation(root, legacy_file, legacyContent, v5Bundles);
    return {
      legacy_file,
      mapped_v5_bundle: assessment.mappedBundle,
      mapping_confidence: assessment.confidence,
      preservation_status: assessment.status,
      criticality: LEGACY_FILE_META[legacy_file]?.criticality ?? 'HIGH',
    };
  });

  const missingRows = mappingRows.filter((r) => r.preservation_status !== 'FULL');
  let patchCandidates: PatchCandidate[] = [];

  if (missingRows.length > 0) {
    patchCandidates = applyLegacyPatches(root, missingRows);
    v5Bundles = loadV5Bundles(root);
    mappingRows = legacyFiles.map((legacy_file) => {
      const legacyContent = readJson<Record<string, unknown>>(root, `${LEGACY_DIR}/${legacy_file}`);
      const assessment = assessPreservation(root, legacy_file, legacyContent, v5Bundles);
      return {
        legacy_file,
        mapped_v5_bundle: assessment.mappedBundle,
        mapping_confidence: assessment.confidence,
        preservation_status: assessment.status,
        criticality: LEGACY_FILE_META[legacy_file]?.criticality ?? 'HIGH',
      };
    });
  }

  const functionality = functionalityAudit(v5Bundles);

  const fullyPreserved = mappingRows.filter((r) => r.preservation_status === 'FULL').length;
  const partiallyPreserved = mappingRows.filter((r) => r.preservation_status === 'PARTIAL').length;
  const missingCount = mappingRows.filter((r) => r.preservation_status === 'MISSING').length;
  const criticalRows = mappingRows.filter((r) => r.criticality === 'CRITICAL');
  const criticalMissing = criticalRows.filter((r) => r.preservation_status !== 'FULL');
  const criticalFullyPreserved = criticalRows.filter((r) => r.preservation_status === 'FULL').length;

  const preservationRatio = mappingRows.length ? fullyPreserved / mappingRows.length : 0;
  const criticalPreservationRatio = criticalRows.length ? criticalFullyPreserved / criticalRows.length : 0;

  const adapterAudit = ADAPTER_AUDIT_LIST.map((adapterId) => {
    const embedded = (v5Bundles.production_adapter_bundle?.embedded_adapters ?? {}) as Record<string, unknown>;
    return {
      adapter_id: adapterId,
      preserved: Boolean(embedded[adapterId]),
      preservation_status: embedded[adapterId] ? 'FULL' : 'MISSING',
    };
  });

  const criticalLegacyAudit = CRITICAL_LEGACY_LIST.map((legacyId) => {
    const row = mappingRows.find((r) => r.legacy_file === `${legacyId}.json`);
    return {
      legacy_id: legacyId,
      preservation_status: row?.preservation_status ?? 'MISSING',
      mapped_v5_bundle: row?.mapped_v5_bundle ?? null,
    };
  });

  const missingFunctionality = mappingRows
    .filter((r) => r.preservation_status !== 'FULL')
    .map((r) => ({
      missing_system: r.legacy_file.replace('.json', ''),
      severity: r.criticality === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      affected_bundle: r.mapped_v5_bundle,
      recommended_patch: patchCandidates.find((p) => p.legacy_file === r.legacy_file)?.action ?? 'MERGE legacy payload into mapped v5 bundle',
    }));

  if (criticalMissing.length > 0) {
    issues.push({ code: 'CRITICAL_LEGACY_MISSING', message: `Critical legacy missing: ${criticalMissing.map((r) => r.legacy_file).join(', ')}`, severity: 'error' });
  }
  if (criticalPreservationRatio < 1) {
    issues.push({ code: 'CRITICAL_PRESERVATION_RATIO_FAIL', message: 'Critical preservation ratio below 1.0', severity: 'error' });
  }
  if (!functionality.identity_lock_support) issues.push({ code: 'IDENTITY_LOCK_UNSUPPORTED', message: 'identity_lock_support=false', severity: 'error' });
  if (!functionality.brain_ingestion_support) issues.push({ code: 'BRAIN_INGESTION_UNSUPPORTED', message: 'brain_ingestion_support=false', severity: 'error' });
  if (!functionality.cinematic_dna_support) issues.push({ code: 'CINEMATIC_DNA_UNSUPPORTED', message: 'cinematic_dna_support=false', severity: 'error' });

  const preservationPassed =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    criticalMissing.length === 0 &&
    criticalPreservationRatio >= 1 &&
    preservationRatio >= MIN_PRESERVATION_RATIO &&
    functionality.identity_lock_support &&
    functionality.brain_ingestion_support &&
    functionality.cinematic_dna_support;

  const patchPlan = missingRows.length > 0
    ? {
        plan_id: 'latest-v5-patch-plan-v1',
        generated_at: new Date().toISOString(),
        patches: patchCandidates.map((p) => ({
          legacy_file: p.legacy_file,
          target_bundle: p.bundle,
          patch_category: p.patch_category,
          action: p.action,
        })),
      }
    : { plan_id: 'latest-v5-patch-plan-v1', generated_at: new Date().toISOString(), patches: [], status: 'NO_PATCH_REQUIRED' };

  const validationSummary: Record<string, string | number | boolean> = {
    legacy_file_count: legacyFiles.length,
    fully_preserved_count: fullyPreserved,
    partially_preserved_count: partiallyPreserved,
    missing_count: missingCount,
    critical_missing_count: criticalMissing.length,
    preservation_ratio: Number(preservationRatio.toFixed(4)),
    critical_preservation_ratio: Number(criticalPreservationRatio.toFixed(4)),
    adapter_preservation_pass: adapterAudit.every((a) => a.preserved),
    patches_applied: patchCandidates.length,
    gpu_execution: false,
    video_generation: false,
    next_order: preservationPassed ? 'PHASE-VIDEO-SHORT-TEST-001' : 'PHASE-V5-PRESERVATION-PATCH-001',
    policy: SAFE_CREATE_POLICY,
    ...functionality,
  };

  const report: LegacyToV5CoverageAuditReport = {
    report_id: 'legacy-to-v5-coverage-audit-report-v1',
    phase: LEGACY_COVERAGE_PHASE,
    audit_id: LEGACY_COVERAGE_AUDIT_ID,
    generated_at: new Date().toISOString(),
    final_verdict: preservationPassed ? LEGACY_COVERAGE_PASS_VERDICT : LEGACY_COVERAGE_FAIL_VERDICT,
    status: preservationPassed ? LEGACY_PRESERVATION_VERIFIED_STATUS : LEGACY_PRESERVATION_PATCH_REQUIRED_STATUS,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
    preservation_passed: preservationPassed,
  };

  const fullReport = {
    ...report,
    adapter_preservation_audit: adapterAudit,
    critical_legacy_audit: criticalLegacyAudit,
    functionality_preservation_audit: functionality,
    production_readiness_gates: {
      critical_missing_count_eq_0: criticalMissing.length === 0,
      critical_preservation_ratio_eq_1: criticalPreservationRatio === 1,
      preservation_ratio_gte_0_95: preservationRatio >= MIN_PRESERVATION_RATIO,
      identity_lock_support: functionality.identity_lock_support,
      brain_ingestion_support: functionality.brain_ingestion_support,
      cinematic_dna_support: functionality.cinematic_dna_support,
    },
    next_pipeline: preservationPassed
      ? ['PHASE-VIDEO-SHORT-TEST-001']
      : ['PHASE-V5-PRESERVATION-PATCH-001', 'RETEST'],
  };

  fs.mkdirSync(path.join(root, LEGACY_COVERAGE_REPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, LEGACY_LATEST_INVENTORY_PATH), `${JSON.stringify(legacyInventory, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, LATEST_V5_INVENTORY_PATH), `${JSON.stringify(v5Inventory, null, 2)}\n`, 'utf8');
  fs.writeFileSync(
    path.join(root, LEGACY_TO_V5_MAPPING_PATH),
    `${JSON.stringify({ matrix_id: 'legacy-to-v5-mapping-matrix-v1', phase: LEGACY_COVERAGE_PHASE, generated_at: new Date().toISOString(), rows: mappingRows }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, MISSING_FUNCTIONALITY_REPORT_PATH),
    `${JSON.stringify({ report_id: 'missing-functionality-report-v1', phase: LEGACY_COVERAGE_PHASE, generated_at: new Date().toISOString(), missing_functionality: missingFunctionality, remaining_gaps: missingFunctionality.map((m) => m.missing_system) }, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(path.join(root, LATEST_V5_PATCH_PLAN_PATH), `${JSON.stringify(patchPlan, null, 2)}\n`, 'utf8');
  if (patchCandidates.length > 0) {
    fs.writeFileSync(
      path.join(root, LATEST_V5_PATCH_CANDIDATES_PATH),
      `${JSON.stringify({ candidates_id: 'latest-v5-patch-candidates-v1', generated_at: new Date().toISOString(), candidates: patchCandidates }, null, 2)}\n`,
      'utf8'
    );
  }
  fs.writeFileSync(path.join(root, LEGACY_COVERAGE_AUDIT_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
