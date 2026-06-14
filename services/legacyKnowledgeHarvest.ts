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
import {
  LEGACY_COVERAGE_PASS_VERDICT,
  LEGACY_PRESERVATION_VERIFIED_STATUS,
  LEGACY_COVERAGE_AUDIT_REPORT_PATH,
} from './legacyToV5CoverageAudit.js';
import { IMAGE_APP_LATEST_V5_DIR, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH } from './exportRebuild/datasetMaterializer.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const LEGACY_HARVEST_PHASE = 'PHASE-LEGACY-KNOWLEDGE-HARVEST-001' as const;
export const LEGACY_HARVEST_AUDIT_ID = 'LEGACY_PATTERN_EXTRACTION_AND_V5_ENRICHMENT_V1' as const;
export const LEGACY_HARVEST_PASS_VERDICT = 'PASS_LEGACY_PATTERN_EXTRACTION_AND_V5_ENRICHMENT_V1' as const;
export const LEGACY_HARVEST_FAIL_VERDICT = 'FAIL_LEGACY_PATTERN_EXTRACTION_AND_V5_ENRICHMENT_V1' as const;

export const LEGACY_HARVEST_REPORT_DIR = 'reports/legacy_harvest' as const;
export const LEGACY_KNOWLEDGE_INVENTORY_PATH = 'reports/legacy_harvest/legacy-knowledge-inventory.json' as const;
export const LEGACY_PATTERN_MATRIX_PATH = 'reports/legacy_harvest/legacy-pattern-matrix.json' as const;
export const CONFLICT_REPORT_PATH = 'reports/legacy_harvest/conflict-report.json' as const;
export const V5_ENRICHMENT_PLAN_PATH = 'reports/legacy_harvest/v5-enrichment-plan.json' as const;
export const LEGACY_HARVEST_AUDIT_REPORT_PATH =
  'reports/legacy_harvest/LEGACY_PATTERN_EXTRACTION_AND_V5_ENRICHMENT_REPORT.json' as const;

const LEGACY_SOURCES = [
  { version: 'latest', dir: 'exports/image_app/latest' },
  { version: 'latest_v2', dir: 'exports/image_app/latest_v2' },
  { version: 'latest_v3', dir: 'exports/image_app/latest_v3' },
  { version: 'latest_v4', dir: 'exports/image_app/latest_v4' },
] as const;

const PATTERN_TYPES = [
  'adapter_pattern',
  'lock_pattern',
  'composition_pattern',
  'prompt_pattern',
  'identity_pattern',
  'layout_pattern',
  'constraint_pattern',
] as const;

type PatternType = (typeof PATTERN_TYPES)[number];
type PatternPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM';
type PatchCategory = 'EMBED' | 'MERGE' | 'CONSTRAINT_IMPORT' | 'RULE_IMPORT' | 'PATTERN_IMPORT';
type PatternClassification = 'useful_pattern' | 'obsolete_pattern' | 'duplicate_pattern' | 'conflicting_pattern';

const CRITICAL_HARVEST: {
  pattern_key: string;
  source_file: string;
  target_bundle: string;
  pattern_type: PatternType;
  patch_category: PatchCategory;
}[] = [
  { pattern_key: 'character-first-contract', source_file: 'character-first-contract.json', target_bundle: 'generation_rule_bundle', pattern_type: 'identity_pattern', patch_category: 'RULE_IMPORT' },
  { pattern_key: 'scene-asset-composition-adapter', source_file: 'scene-asset-composition-adapter.json', target_bundle: 'production_adapter_bundle', pattern_type: 'composition_pattern', patch_category: 'PATTERN_IMPORT' },
  { pattern_key: 'room-layout-lock-adapter', source_file: 'room-layout-lock-adapter.json', target_bundle: 'location_dna_bundle', pattern_type: 'lock_pattern', patch_category: 'CONSTRAINT_IMPORT' },
  { pattern_key: 'outdoor-layout-lock-adapter', source_file: 'outdoor-layout-lock-adapter.json', target_bundle: 'environment_dna_bundle', pattern_type: 'layout_pattern', patch_category: 'CONSTRAINT_IMPORT' },
  { pattern_key: 'prop-anchor-adapter', source_file: 'prop-anchor-adapter.json', target_bundle: 'environment_dna_bundle', pattern_type: 'lock_pattern', patch_category: 'CONSTRAINT_IMPORT' },
  { pattern_key: 'living-world-image-adapter', source_file: 'living-world-image-adapter.json', target_bundle: 'production_adapter_bundle', pattern_type: 'adapter_pattern', patch_category: 'EMBED' },
  { pattern_key: 'image-app-brain-ingestion-package', source_file: 'image-app-brain-ingestion-package.json', target_bundle: 'character_dna_bundle', pattern_type: 'constraint_pattern', patch_category: 'MERGE' },
  { pattern_key: 'cinematic-dna-library-import', source_file: 'cinematic-dna-library-import.json', target_bundle: 'style_dna_bundle', pattern_type: 'constraint_pattern', patch_category: 'MERGE' },
];

const V5_EMBEDDED_ADAPTERS = [
  'instrumental-mv-adapter',
  'ballad-mv-adapter',
  'emotion-acting-adapter',
  'shot-grammar-adapter',
  'indoor-location-anchor-adapter',
  'lighting-anchor-adapter',
  'living-world-core-v1-package',
  'music-drama-image-adapter',
  'location-lighting-image-adapter',
] as const;

const MIN_HARVEST_RATIO = 0.95;
const V5_CANONICAL_BUNDLE_IDS = [
  'character_dna_bundle',
  'location_dna_bundle',
  'lighting_dna_bundle',
  'environment_dna_bundle',
  'style_dna_bundle',
  'story_blueprint_bundle',
  'memory_bundle',
  'dialogue_bundle',
  'prompt_generation_bundle',
  'generation_rule_bundle',
  'production_adapter_bundle',
  'frame_coordinate_dna_bundle',
  'edit_rhythm_dna_bundle',
  'environment_motion_dna_bundle',
  'blocking_dna_bundle',
  'scene_remap_dna_bundle',
  'cinematic_signature_dna_bundle',
  'source_video_numerical_dna_bundle',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface LegacyKnowledgeHarvestReport {
  report_id: string;
  phase: typeof LEGACY_HARVEST_PHASE;
  audit_id: typeof LEGACY_HARVEST_AUDIT_ID;
  generated_at: string;
  final_verdict: string;
  harvest_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

interface ExtractedPattern {
  pattern_id: string;
  source_version: string;
  source_file: string;
  pattern_type: PatternType;
  pattern_description: string;
  pattern_priority: PatternPriority;
  classification: PatternClassification;
  mapped_v5_bundle: string;
  patch_category: PatchCategory;
  extracted_fields: Record<string, unknown>;
  source_integrity_hash: string;
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

function classifyPatternType(fileName: string, content: Record<string, unknown>): PatternType {
  const adapterType = String(content.adapter_type ?? '');
  const contractType = String(content.contract_type ?? '');
  const packageType = String(content.package_type ?? '');
  const layerId = String(content.layer_id ?? '');

  if (contractType.includes('character_first') || fileName.includes('character-first')) return 'identity_pattern';
  if (adapterType.includes('composition') || fileName.includes('scene-asset-composition')) return 'composition_pattern';
  if (adapterType.includes('layout_lock') || fileName.includes('layout-lock')) return 'layout_pattern';
  if (adapterType.includes('lock') || fileName.includes('prop-anchor')) return 'lock_pattern';
  if (adapterType.includes('adapter') || layerId.includes('production-layer')) return 'adapter_pattern';
  if (fileName.includes('prompt') || content.prompt_templates || content.compiled_prompt_ref) return 'prompt_pattern';
  if (packageType.includes('brain') || fileName.includes('brain-ingestion') || fileName.includes('cinematic-dna')) {
    return 'constraint_pattern';
  }
  if (content.generation_trace || content.generation_constraints || content.rules) return 'constraint_pattern';
  return 'adapter_pattern';
}

function patternPriority(fileName: string, patternType: PatternType): PatternPriority {
  if (CRITICAL_HARVEST.some((c) => c.source_file === fileName)) return 'CRITICAL';
  if (patternType === 'identity_pattern' || patternType === 'lock_pattern' || patternType === 'composition_pattern') {
    return 'HIGH';
  }
  return 'MEDIUM';
}

function extractPatternFields(content: Record<string, unknown>): Record<string, unknown> {
  const metadata = (content.adapter_metadata ?? {}) as Record<string, unknown>;
  const tokenContract = (content.image_app_token_contract ?? {}) as Record<string, unknown>;
  const rules = (content.rules ?? {}) as Record<string, unknown>;

  const layoutMap = content.location_to_layout_map ?? content.location_to_outdoor_layout_map;
  const compositionMap = content.composition_to_scene_map;

  const forbiddenChanges: string[] = [];
  if (Array.isArray(layoutMap) && layoutMap.length > 0) {
    const first = layoutMap[0] as Record<string, unknown>;
    const payload = (first.render_payload ?? {}) as Record<string, unknown>;
    if (Array.isArray(payload.forbidden_layout_changes)) {
      forbiddenChanges.push(...(payload.forbidden_layout_changes as string[]).slice(0, 5));
    }
  }
  if (Array.isArray(compositionMap) && compositionMap.length > 0) {
    const first = compositionMap[0] as Record<string, unknown>;
    const payload = (first.render_payload ?? {}) as Record<string, unknown>;
    if (Array.isArray(payload.forbidden_composition_changes)) {
      forbiddenChanges.push(...(payload.forbidden_composition_changes as string[]).slice(0, 5));
    }
  }

  return {
    adapter_type: content.adapter_type ?? content.contract_type ?? content.package_type ?? content.layer_id,
    responsibility_chain: content.adapter_responsibility_chain,
    priority_order: content.priority_order,
    rules_summary: Array.isArray(rules.environment_may_never_override)
      ? (rules.environment_may_never_override as string[]).slice(0, 6)
      : undefined,
    lock_token_prefixes: tokenContract.required_prefixes,
    layout_count: metadata.layout_count ?? (Array.isArray(layoutMap) ? layoutMap.length : undefined),
    composition_count: metadata.composition_count ?? (Array.isArray(compositionMap) ? compositionMap.length : undefined),
    library_reference: metadata.library_reference ?? content.library_reference,
    forbidden_changes: forbiddenChanges.length > 0 ? forbiddenChanges : undefined,
    sync_systems: content.sync_systems,
    production_adapters: Array.isArray(content.production_adapters)
      ? (content.production_adapters as Record<string, unknown>[]).map((a) => a.adapter_id)
      : undefined,
    brain_libraries: content.camera_grammar_library
      ? {
          camera: (content.camera_grammar_library as unknown[]).length,
          acting: (content.acting_grammar_library as unknown[] | undefined)?.length ?? 0,
          location: (content.location_grammar_library as unknown[] | undefined)?.length ?? 0,
        }
      : undefined,
    injection_layer: tokenContract.injection_layer,
    merge_policy: (content.compatibility_declaration as Record<string, unknown> | undefined)?.merge_policy,
  };
}

function mapToV5Bundle(fileName: string, patternType: PatternType): string {
  const critical = CRITICAL_HARVEST.find((c) => c.source_file === fileName);
  if (critical) return critical.target_bundle;
  if (patternType === 'identity_pattern') return 'generation_rule_bundle';
  if (patternType === 'layout_pattern' || patternType === 'lock_pattern') {
    return fileName.includes('room') ? 'location_dna_bundle' : 'environment_dna_bundle';
  }
  if (patternType === 'composition_pattern') return 'production_adapter_bundle';
  if (patternType === 'prompt_pattern') return 'prompt_generation_bundle';
  if (patternType === 'constraint_pattern') return 'generation_rule_bundle';
  return 'production_adapter_bundle';
}

function patchCategoryFor(fileName: string, patternType: PatternType): PatchCategory {
  const critical = CRITICAL_HARVEST.find((c) => c.source_file === fileName);
  if (critical) return critical.patch_category;
  if (patternType === 'identity_pattern') return 'RULE_IMPORT';
  if (patternType === 'constraint_pattern') return 'CONSTRAINT_IMPORT';
  if (patternType === 'prompt_pattern') return 'PATTERN_IMPORT';
  if (patternType === 'composition_pattern') return 'PATTERN_IMPORT';
  if (patternType === 'lock_pattern' || patternType === 'layout_pattern') return 'CONSTRAINT_IMPORT';
  return 'EMBED';
}

function loadV5Bundles(root: string): Record<string, Record<string, unknown>> {
  const dir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const bundles: Record<string, Record<string, unknown>> = {};
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'image-app-upload-package-v5.json')) {
    bundles[file.replace('.json', '')] = readJson(root, `${IMAGE_APP_LATEST_V5_DIR}/${file}`);
  }
  return bundles;
}

function listLegacyFiles(root: string): { version: string; file: string; relPath: string }[] {
  const files: { version: string; file: string; relPath: string }[] = [];
  for (const source of LEGACY_SOURCES) {
    const dir = path.join(root, source.dir);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      files.push({ version: source.version, file, relPath: `${source.dir}/${file}` });
    }
  }
  return files;
}

function classifyPattern(
  pattern: ExtractedPattern,
  v5Bundles: Record<string, Record<string, unknown>>
): PatternClassification {
  const baseName = pattern.source_file.replace('.json', '');
  const embedded = (v5Bundles.production_adapter_bundle?.embedded_adapters ?? {}) as Record<string, unknown>;

  if (V5_EMBEDDED_ADAPTERS.includes(baseName as (typeof V5_EMBEDDED_ADAPTERS)[number]) && embedded[baseName]) {
    return 'obsolete_pattern';
  }

  const target = v5Bundles[pattern.mapped_v5_bundle];
  const harvest = (target?.legacy_knowledge_harvest ?? {}) as { patterns?: Record<string, unknown> };
  if (harvest.patterns?.[pattern.pattern_id]) return 'duplicate_pattern';

  if (pattern.extracted_fields.merge_policy === 'replace_bundle') return 'conflicting_pattern';
  if (String(pattern.extracted_fields.adapter_type).includes('legacy_flat_restore')) return 'conflicting_pattern';

  return 'useful_pattern';
}

function isCriticalPatternHarvested(
  patternKey: string,
  v5Bundles: Record<string, Record<string, unknown>>
): boolean {
  const spec = CRITICAL_HARVEST.find((c) => c.pattern_key === patternKey);
  if (!spec) return false;

  const bundle = v5Bundles[spec.target_bundle];
  const harvest = (bundle?.legacy_knowledge_harvest ?? {}) as { patterns?: Record<string, unknown> };
  if (harvest.patterns?.[patternKey]) return true;

  if (patternKey === 'character-first-contract' && bundle?.character_first_contract_embed) return true;
  if (patternKey === 'image-app-brain-ingestion-package' && v5Bundles.character_dna_bundle?.brain_ingestion_embed) return true;
  if (patternKey === 'cinematic-dna-library-import' && v5Bundles.style_dna_bundle?.cinematic_dna_library_embed) return true;

  const productionHarvest = (v5Bundles.production_adapter_bundle?.legacy_knowledge_harvest ?? {}) as {
    patterns?: Record<string, unknown>;
  };
  if (productionHarvest.patterns?.[patternKey]) return true;

  const productionEmbed = (v5Bundles.production_adapter_bundle?.legacy_preservation_embed ?? {}) as Record<string, unknown>;
  if (productionEmbed[patternKey]) return true;

  return false;
}

function applyEnrichment(
  root: string,
  patterns: ExtractedPattern[]
): { enriched: number; plan: { pattern_id: string; target_bundle: string; patch_category: PatchCategory; action: string }[] } {
  const v5Bundles = loadV5Bundles(root);
  const plan: { pattern_id: string; target_bundle: string; patch_category: PatchCategory; action: string }[] = [];
  let enriched = 0;

  for (const pattern of patterns) {
    if (pattern.classification !== 'useful_pattern') continue;

    const bundle = v5Bundles[pattern.mapped_v5_bundle] ?? {};
    const harvest = (bundle.legacy_knowledge_harvest ?? {
      harvest_phase: LEGACY_HARVEST_PHASE,
      harvest_mode: 'PATTERN_IMPORT',
      canonical_architecture: 'latest_v5',
      patterns: {},
    }) as {
      harvest_phase: string;
      harvest_mode: string;
      canonical_architecture: string;
      patterns: Record<string, unknown>;
    };

    harvest.patterns[pattern.pattern_id] = {
      pattern_type: pattern.pattern_type,
      source_version: pattern.source_version,
      source_file: pattern.source_file,
      pattern_description: pattern.pattern_description,
      pattern_priority: pattern.pattern_priority,
      patch_category: pattern.patch_category,
      extracted_fields: pattern.extracted_fields,
      source_integrity_hash: pattern.source_integrity_hash,
      harvested_at: new Date().toISOString(),
      harvest_mode: 'PATTERN_IMPORT',
      full_legacy_restore: false,
    };

    bundle.legacy_knowledge_harvest = harvest;
    bundle.legacy_knowledge_enriched = true;
    v5Bundles[pattern.mapped_v5_bundle] = bundle;

    plan.push({
      pattern_id: pattern.pattern_id,
      target_bundle: pattern.mapped_v5_bundle,
      patch_category: pattern.patch_category,
      action: `Import ${pattern.pattern_type} from ${pattern.source_version}/${pattern.source_file} into ${pattern.mapped_v5_bundle}.legacy_knowledge_harvest`,
    });
    enriched += 1;
  }

  for (const [bundleName, bundle] of Object.entries(v5Bundles)) {
    fs.writeFileSync(
      path.join(root, `${IMAGE_APP_LATEST_V5_DIR}/${bundleName}.json`),
      `${JSON.stringify(bundle, null, 2)}\n`,
      'utf8'
    );
  }

  const uploadPkg = tryReadJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  if (uploadPkg) {
    const blocks = new Set((uploadPkg.output_blocks as string[] | undefined) ?? []);
    blocks.add('legacy_knowledge_harvest');
    uploadPkg.output_blocks = [...blocks];
    uploadPkg.legacy_knowledge_harvest_at = new Date().toISOString();
    uploadPkg.canonical_architecture = 'latest_v5';
    uploadPkg.legacy_structure_restored = false;
    fs.writeFileSync(path.join(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH), `${JSON.stringify(uploadPkg, null, 2)}\n`, 'utf8');
  }

  return { enriched, plan };
}

function hasInternalVersionMetadata(bundle: Record<string, unknown>): boolean {
  const versionFields = [
    bundle.bundle_id,
    bundle.block_id,
    bundle.contract_id,
    bundle.package_id,
    bundle.standard_id,
    bundle.schema_version,
    bundle.canonical_upload_standard,
  ];
  return versionFields.some((field) => typeof field === 'string' && field.length > 0) || bundle.materialized === true;
}

function architectureIntegrityAudit(
  root: string,
  v5FilesBefore: string[],
  v5Bundles: Record<string, Record<string, unknown>>
): {
  latest_v5_structure_preserved: boolean;
  legacy_structure_restored: boolean;
  canonical_upload_architecture_preserved: boolean;
} {
  const v5Dir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const v5FilesAfter = fs.readdirSync(v5Dir).filter((f) => f.endsWith('.json'));
  const legacyStandaloneNames = fs
    .readdirSync(path.join(root, 'exports/image_app/latest'))
    .filter((f) => f.endsWith('.json'));

  const structurePreserved =
    v5FilesBefore.every((f) => v5FilesAfter.includes(f)) &&
    Object.values(v5Bundles).every((b) => hasInternalVersionMetadata(b));

  const legacyRestored = v5FilesAfter.some((f) => legacyStandaloneNames.includes(f) && f !== 'image-app-upload-package-v5.json');

  const uploadPkg = tryReadJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  const canonicalVersionDir = String(uploadPkg?.canonical_version_dir ?? uploadPkg?.canonical_architecture ?? '');
  const canonicalPreserved =
    String(uploadPkg?.package_id ?? '') === 'image-app-upload-package-v5' &&
    canonicalVersionDir === 'latest_v5' &&
    uploadPkg?.legacy_structure_restored !== true;

  return {
    latest_v5_structure_preserved: structurePreserved,
    legacy_structure_restored: legacyRestored,
    canonical_upload_architecture_preserved: canonicalPreserved,
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
  const legacyCoverage = tryReadJson(root, LEGACY_COVERAGE_AUDIT_REPORT_PATH);

  const gates = {
    export_coverage_pass:
      String(coverage?.final_verdict ?? '') === EXPORT_COVERAGE_PASS_VERDICT &&
      String(coverage?.status ?? '') === EXPORT_COVERAGE_READY_STATUS,
    app_consumption_pass:
      String(consumption?.final_verdict ?? '') === APP_CONSUMPTION_PASS_VERDICT &&
      String(consumption?.status ?? '') === APP_CONSUMPTION_READY_STATUS,
    legacy_coverage_pass:
      String(legacyCoverage?.final_verdict ?? '') === LEGACY_COVERAGE_PASS_VERDICT &&
      String(legacyCoverage?.status ?? '') === LEGACY_PRESERVATION_VERIFIED_STATUS,
    legacy_sources_exist: LEGACY_SOURCES.every((s) => fs.existsSync(path.join(root, s.dir))),
    latest_v5_exists: fs.existsSync(path.join(root, IMAGE_APP_LATEST_V5_DIR)),
  };

  if (!gates.export_coverage_pass) issues.push({ code: 'EXPORT_COVERAGE_PRECHECK_FAIL', message: 'Export coverage not PASS', severity: 'error' });
  if (!gates.app_consumption_pass) issues.push({ code: 'APP_CONSUMPTION_PRECHECK_FAIL', message: 'App consumption not PASS', severity: 'error' });
  if (!gates.legacy_coverage_pass) issues.push({ code: 'LEGACY_COVERAGE_PRECHECK_FAIL', message: 'Legacy coverage not PASS', severity: 'error' });
  if (!gates.legacy_sources_exist) issues.push({ code: 'LEGACY_SOURCES_MISSING', message: 'One or more legacy source dirs missing', severity: 'error' });
  if (!gates.latest_v5_exists) issues.push({ code: 'LATEST_V5_MISSING', message: 'latest_v5 directory missing', severity: 'error' });

  return { precheck_passed: Object.values(gates).every(Boolean), gates, issues };
}

export function writeLegacyKnowledgeHarvest(projectRoot?: string): LegacyKnowledgeHarvestReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];
  const precheck = runPrecheck(root);
  issues.push(...precheck.issues);

  if (!precheck.precheck_passed) {
    const fail: LegacyKnowledgeHarvestReport = {
      report_id: 'legacy-pattern-extraction-v5-enrichment-report-v1',
      phase: LEGACY_HARVEST_PHASE,
      audit_id: LEGACY_HARVEST_AUDIT_ID,
      generated_at: new Date().toISOString(),
      final_verdict: LEGACY_HARVEST_FAIL_VERDICT,
      harvest_passed: false,
      precheck: { precheck_passed: false, gates: precheck.gates },
      validation_summary: {},
      issues,
    };
    fs.mkdirSync(path.join(root, LEGACY_HARVEST_REPORT_DIR), { recursive: true });
    fs.writeFileSync(path.join(root, LEGACY_HARVEST_AUDIT_REPORT_PATH), `${JSON.stringify(fail, null, 2)}\n`, 'utf8');
    return fail;
  }

  const v5Dir = path.join(root, IMAGE_APP_LATEST_V5_DIR);
  const v5FilesBefore = fs.readdirSync(v5Dir).filter((f) => f.endsWith('.json'));
  let v5Bundles = loadV5Bundles(root);

  const legacyFiles = listLegacyFiles(root);
  const extractedPatterns: ExtractedPattern[] = [];

  for (const entry of legacyFiles) {
    const content = readJson<Record<string, unknown>>(root, entry.relPath);
    const patternType = classifyPatternType(entry.file, content);
    const patternId = entry.file.replace('.json', '');
    const mappedBundle = mapToV5Bundle(entry.file, patternType);

    const pattern: ExtractedPattern = {
      pattern_id: patternId,
      source_version: entry.version,
      source_file: entry.file,
      pattern_type: patternType,
      pattern_description: String(
        (content.adapter_metadata as Record<string, unknown> | undefined)?.adapter_name ??
          content.purpose ??
          content.module ??
          `${patternType} from ${entry.version}`
      ),
      pattern_priority: patternPriority(entry.file, patternType),
      classification: 'useful_pattern',
      mapped_v5_bundle: mappedBundle,
      patch_category: patchCategoryFor(entry.file, patternType),
      extracted_fields: extractPatternFields(content),
      source_integrity_hash: contentHash(content).slice(0, 16),
    };

    pattern.classification = classifyPattern(pattern, v5Bundles);
    extractedPatterns.push(pattern);
  }

  const knowledgeInventory = {
    inventory_id: 'legacy-knowledge-inventory-v1',
    phase: LEGACY_HARVEST_PHASE,
    generated_at: new Date().toISOString(),
    source_versions: LEGACY_SOURCES.map((s) => s.version),
    pattern_type_counts: PATTERN_TYPES.reduce(
      (acc, type) => {
        acc[type] = extractedPatterns.filter((p) => p.pattern_type === type).length;
        return acc;
      },
      {} as Record<string, number>
    ),
    classification_counts: {
      useful_pattern: extractedPatterns.filter((p) => p.classification === 'useful_pattern').length,
      obsolete_pattern: extractedPatterns.filter((p) => p.classification === 'obsolete_pattern').length,
      duplicate_pattern: extractedPatterns.filter((p) => p.classification === 'duplicate_pattern').length,
      conflicting_pattern: extractedPatterns.filter((p) => p.classification === 'conflicting_pattern').length,
    },
    patterns: extractedPatterns.map((p) => ({
      pattern_id: p.pattern_id,
      pattern_type: p.pattern_type,
      source_version: p.source_version,
      source_file: p.source_file,
      classification: p.classification,
      pattern_priority: p.pattern_priority,
    })),
  };

  const patternMatrix = {
    matrix_id: 'legacy-pattern-matrix-v1',
    phase: LEGACY_HARVEST_PHASE,
    generated_at: new Date().toISOString(),
    pattern_count: extractedPatterns.length,
    rows: extractedPatterns.map((p) => ({
      pattern_id: p.pattern_id,
      source_version: p.source_version,
      source_file: p.source_file,
      pattern_type: p.pattern_type,
      pattern_description: p.pattern_description,
      pattern_priority: p.pattern_priority,
      mapped_v5_bundle: p.mapped_v5_bundle,
      classification: p.classification,
      patch_category: p.patch_category,
    })),
  };

  const conflicts = extractedPatterns
    .filter((p) => p.classification === 'conflicting_pattern')
    .map((p) => ({
      pattern_id: p.pattern_id,
      source_version: p.source_version,
      legacy_pattern: p.pattern_type,
      modern_v5_architecture: 'latest_v5_bundle_materialization',
      conflict_reason: 'Pattern merge policy conflicts with canonical v5 bundle architecture',
      resolution: 'Extract pattern fields only; do not restore legacy flat file structure',
    }));

  const usefulPatterns = extractedPatterns.filter((p) => p.classification === 'useful_pattern');
  const enrichmentResult = applyEnrichment(root, usefulPatterns);
  v5Bundles = loadV5Bundles(root);

  const criticalHarvestStatus = CRITICAL_HARVEST.map((c) => ({
    pattern_key: c.pattern_key,
    target_bundle: c.target_bundle,
    harvested: isCriticalPatternHarvested(c.pattern_key, v5Bundles),
  }));

  const criticalPatternCount = CRITICAL_HARVEST.length;
  const criticalPatternHarvestedCount = criticalHarvestStatus.filter((c) => c.harvested).length;
  const criticalPatternMissingCount = criticalPatternCount - criticalPatternHarvestedCount;

  const legacyPatternCount = extractedPatterns.length;
  const usefulPatternCount = usefulPatterns.length;
  const harvestedPatternCount = enrichmentResult.enriched + extractedPatterns.filter((p) => p.classification === 'obsolete_pattern').length;
  const obsoletePatternCount = extractedPatterns.filter((p) => p.classification === 'obsolete_pattern').length;
  const conflictingPatternCount = conflicts.length;
  const harvestRatio = usefulPatternCount > 0 ? enrichmentResult.enriched / usefulPatternCount : 1;

  const architecture = architectureIntegrityAudit(root, v5FilesBefore, v5Bundles);

  const characterFirstMissing = !isCriticalPatternHarvested('character-first-contract', v5Bundles);
  const roomLayoutLockMissing = !isCriticalPatternHarvested('room-layout-lock-adapter', v5Bundles);
  const sceneCompositionMissing = !isCriticalPatternHarvested('scene-asset-composition-adapter', v5Bundles);
  const brainIngestionMissing = !isCriticalPatternHarvested('image-app-brain-ingestion-package', v5Bundles);

  if (criticalPatternMissingCount > 0) {
    issues.push({ code: 'CRITICAL_PATTERN_MISSING', message: `critical_pattern_missing_count=${criticalPatternMissingCount}`, severity: 'error' });
  }
  if (harvestRatio < MIN_HARVEST_RATIO) {
    issues.push({ code: 'HARVEST_RATIO_FAIL', message: `harvest_ratio=${harvestRatio} below ${MIN_HARVEST_RATIO}`, severity: 'error' });
  }
  if (characterFirstMissing) issues.push({ code: 'CHARACTER_FIRST_CONTRACT_MISSING', message: 'character_first_contract_missing', severity: 'error' });
  if (roomLayoutLockMissing) issues.push({ code: 'ROOM_LAYOUT_LOCK_MISSING', message: 'room_layout_lock_missing', severity: 'error' });
  if (sceneCompositionMissing) issues.push({ code: 'SCENE_COMPOSITION_MISSING', message: 'scene_composition_missing', severity: 'error' });
  if (brainIngestionMissing) issues.push({ code: 'BRAIN_INGESTION_MISSING', message: 'brain_ingestion_pattern_missing', severity: 'error' });
  if (!architecture.latest_v5_structure_preserved) {
    issues.push({ code: 'V5_STRUCTURE_NOT_PRESERVED', message: 'latest_v5_structure_preserved=false', severity: 'error' });
  }
  if (architecture.legacy_structure_restored) {
    issues.push({ code: 'LEGACY_STRUCTURE_RESTORED', message: 'legacy_structure_restored=true (forbidden)', severity: 'error' });
  }
  if (!architecture.canonical_upload_architecture_preserved) {
    issues.push({ code: 'CANONICAL_ARCHITECTURE_BROKEN', message: 'canonical_upload_architecture_preserved=false', severity: 'error' });
  }

  const harvestPassed =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    criticalPatternMissingCount === 0 &&
    harvestRatio >= MIN_HARVEST_RATIO &&
    !characterFirstMissing &&
    !roomLayoutLockMissing &&
    !sceneCompositionMissing &&
    !brainIngestionMissing &&
    architecture.latest_v5_structure_preserved &&
    !architecture.legacy_structure_restored &&
    architecture.canonical_upload_architecture_preserved;

  const enrichmentPlan = {
    plan_id: 'v5-enrichment-plan-v1',
    phase: LEGACY_HARVEST_PHASE,
    generated_at: new Date().toISOString(),
    canonical_target: IMAGE_APP_LATEST_V5_DIR,
    restore_legacy_packages: false,
    patches: enrichmentResult.plan,
    patch_categories_used: [...new Set(enrichmentResult.plan.map((p) => p.patch_category))],
  };

  const validationSummary: Record<string, string | number | boolean> = {
    legacy_pattern_count: legacyPatternCount,
    useful_pattern_count: usefulPatternCount,
    harvested_pattern_count: harvestedPatternCount,
    obsolete_pattern_count: obsoletePatternCount,
    conflicting_pattern_count: conflictingPatternCount,
    harvest_ratio: Number(harvestRatio.toFixed(4)),
    critical_pattern_count: criticalPatternCount,
    critical_pattern_harvested_count: criticalPatternHarvestedCount,
    critical_pattern_missing_count: criticalPatternMissingCount,
    character_first_contract_missing: characterFirstMissing,
    room_layout_lock_missing: roomLayoutLockMissing,
    scene_composition_missing: sceneCompositionMissing,
    brain_ingestion_pattern_missing: brainIngestionMissing,
    patterns_enriched: enrichmentResult.enriched,
    gpu_execution: false,
    video_generation: false,
    next_order: harvestPassed ? 'PHASE-CANONICAL-UPLOAD-STANDARD-001' : 'PHASE-V5-PRESERVATION-PATCH-001',
    policy: SAFE_CREATE_POLICY,
    ...architecture,
  };

  const report: LegacyKnowledgeHarvestReport = {
    report_id: 'legacy-pattern-extraction-v5-enrichment-report-v1',
    phase: LEGACY_HARVEST_PHASE,
    audit_id: LEGACY_HARVEST_AUDIT_ID,
    generated_at: new Date().toISOString(),
    final_verdict: harvestPassed ? LEGACY_HARVEST_PASS_VERDICT : LEGACY_HARVEST_FAIL_VERDICT,
    harvest_passed: harvestPassed,
    precheck: { precheck_passed: true, gates: precheck.gates },
    validation_summary: validationSummary,
    issues,
  };

  const fullReport = {
    ...report,
    knowledge_harvest_audit: {
      useful_pattern: usefulPatternCount,
      obsolete_pattern: obsoletePatternCount,
      duplicate_pattern: extractedPatterns.filter((p) => p.classification === 'duplicate_pattern').length,
      conflicting_pattern: conflictingPatternCount,
    },
    critical_legacy_harvest: criticalHarvestStatus,
    pattern_mapping_audit: CRITICAL_HARVEST.map((c) => ({
      legacy_pattern: c.pattern_key,
      target_v5_bundle: c.target_bundle,
      harvested: isCriticalPatternHarvested(c.pattern_key, v5Bundles),
    })),
    v5_enrichment_audit: {
      pattern_integrated: enrichmentResult.enriched > 0 || criticalPatternHarvestedCount === criticalPatternCount,
      function_preserved: criticalPatternMissingCount === 0,
      architecture_preserved: architecture.latest_v5_structure_preserved,
      legacy_rollback: architecture.legacy_structure_restored,
    },
    architecture_integrity_audit: architecture,
    production_readiness_gates: {
      critical_pattern_missing_count_eq_0: criticalPatternMissingCount === 0,
      harvest_ratio_gte_0_95: harvestRatio >= MIN_HARVEST_RATIO,
      character_first_contract_missing_eq_false: !characterFirstMissing,
      room_layout_lock_missing_eq_false: !roomLayoutLockMissing,
      scene_composition_missing_eq_false: !sceneCompositionMissing,
      brain_ingestion_pattern_missing_eq_false: !brainIngestionMissing,
    },
    success_definition: {
      latest_v5_canonical: true,
      not_converted_to_legacy: !architecture.legacy_structure_restored,
      patterns_harvested_and_embedded: criticalPatternMissingCount === 0,
      no_useful_knowledge_lost: harvestRatio >= MIN_HARVEST_RATIO,
      no_architectural_rollback: architecture.canonical_upload_architecture_preserved,
    },
    next_pipeline: harvestPassed ? ['PHASE-CANONICAL-UPLOAD-STANDARD-001'] : ['PHASE-V5-PRESERVATION-PATCH-001'],
  };

  fs.mkdirSync(path.join(root, LEGACY_HARVEST_REPORT_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, LEGACY_KNOWLEDGE_INVENTORY_PATH), `${JSON.stringify(knowledgeInventory, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, LEGACY_PATTERN_MATRIX_PATH), `${JSON.stringify(patternMatrix, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, CONFLICT_REPORT_PATH), `${JSON.stringify({ report_id: 'conflict-report-v1', phase: LEGACY_HARVEST_PHASE, generated_at: new Date().toISOString(), conflicts }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, V5_ENRICHMENT_PLAN_PATH), `${JSON.stringify(enrichmentPlan, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(root, LEGACY_HARVEST_AUDIT_REPORT_PATH), `${JSON.stringify(fullReport, null, 2)}\n`, 'utf8');

  return report;
}
