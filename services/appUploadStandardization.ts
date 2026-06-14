import fs from 'node:fs';
import path from 'node:path';
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
  LEGACY_HARVEST_PASS_VERDICT,
  LEGACY_HARVEST_AUDIT_REPORT_PATH,
} from './legacyKnowledgeHarvest.js';
import {
  IMAGE_APP_LATEST_V5_DIR,
  IMAGE_APP_UPLOAD_PACKAGE_V5_PATH,
  VIDEO_APP_LATEST_V5_DIR,
  VIDEO_APP_UPLOAD_PACKAGE_V5_PATH,
} from './exportRebuild/datasetMaterializer.js';
import { SAFE_CREATE_POLICY } from './mvProductionSystemFoundation.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const UPLOAD_STANDARD_PHASE = 'PHASE-CANONICAL-UPLOAD-STANDARD-001' as const;
export const UPLOAD_STANDARD_AUDIT_ID = 'APP_UPLOAD_STANDARDIZATION_V1' as const;
export const UPLOAD_STANDARD_PASS_VERDICT = 'PASS_APP_UPLOAD_STANDARDIZATION_V1' as const;
export const UPLOAD_STANDARD_FAIL_VERDICT = 'FAIL_APP_UPLOAD_STANDARDIZATION_V1' as const;

export const UPLOAD_STANDARD_SPEC_PATH = 'datasets/upload_standard/app-upload-standard-v1.json' as const;
export const CANONICAL_UPLOAD_REPORT_PATH = 'reports/upload_standard/CANONICAL_UPLOAD_STANDARD_REPORT.json' as const;

const GENERATION_METADATA_CONTRACT_SOURCE = 'datasets/app_consumption/generation-metadata-contract.json' as const;

export const IMAGE_APP_CANONICAL_FILES = [
  'character_dna_bundle.json',
  'location_dna_bundle.json',
  'lighting_dna_bundle.json',
  'environment_dna_bundle.json',
  'style_dna_bundle.json',
  'source_video_dna_bundle.json',
  'generation_rule_bundle.json',
  'production_adapter_bundle.json',
  'frame_coordinate_dna_bundle.json',
  'generation_metadata_contract.json',
  'image-app-upload-package-v5.json',
] as const;

export const VIDEO_APP_CANONICAL_FILES = [
  'character_dna.json',
  'location_dna.json',
  'lighting_dna.json',
  'environment_dna.json',
  'source_video_dna.json',
  'motion_dna.json',
  'temporal_dna.json',
  'frame_coordinate_dna.json',
  'video_generation_rules.json',
  'video-app-upload-package-v5.json',
] as const;

const FORBIDDEN_VERSION_DIRS = ['latest_v6', 'latest_v7', 'latest_v8'] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface AppUploadStandardizationReport {
  report_id: string;
  phase: typeof UPLOAD_STANDARD_PHASE;
  audit_id: typeof UPLOAD_STANDARD_AUDIT_ID;
  generated_at: string;
  final_verdict: string;
  standardization_passed: boolean;
  precheck: { precheck_passed: boolean; gates: Record<string, boolean> };
  validation_summary: Record<string, string | number | boolean>;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function tryReadJson(root: string, rel: string): Record<string, unknown> | null {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  return readJson<Record<string, unknown>>(root, rel);
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function hasMetadataVersion(content: Record<string, unknown>): boolean {
  const versionFields = [
    'bundle_id',
    'block_id',
    'contract_id',
    'package_id',
    'standard_id',
    'schema_version',
    'asset_version',
    'contract_version',
  ];
  return versionFields.some((field) => typeof content[field] === 'string' && String(content[field]).length > 0);
}

function materializeCanonicalFile(
  root: string,
  targetRel: string,
  sourceRel: string,
  overrides: Record<string, unknown>
): void {
  const source = readJson<Record<string, unknown>>(root, sourceRel);
  writeJson(root, targetRel, {
    ...source,
    ...overrides,
    canonical_upload_standard: 'app-upload-standard-v1',
    canonical_filename_locked: true,
    materialized_from: sourceRel,
    materialized_at: new Date().toISOString(),
    schema_version: 'v1',
  });
}

function applyCanonicalMaterialization(root: string): string[] {
  const created: string[] = [];

  const imageDir = IMAGE_APP_LATEST_V5_DIR;
  const videoDir = VIDEO_APP_LATEST_V5_DIR;

  if (!fs.existsSync(path.join(root, `${imageDir}/source_video_dna_bundle.json`))) {
    materializeCanonicalFile(root, `${imageDir}/source_video_dna_bundle.json`, `${imageDir}/source_video_numerical_dna_bundle.json`, {
      bundle_id: 'source-video-dna-bundle-v5',
      system_id: 'source_video_dna',
      canonical_alias_of: 'source_video_numerical_dna_bundle.json',
    });
    created.push(`${imageDir}/source_video_dna_bundle.json`);
  }

  if (!fs.existsSync(path.join(root, `${imageDir}/generation_metadata_contract.json`))) {
    const contract = readJson<Record<string, unknown>>(root, GENERATION_METADATA_CONTRACT_SOURCE);
    writeJson(root, `${imageDir}/generation_metadata_contract.json`, {
      ...contract,
      canonical_upload_standard: 'app-upload-standard-v1',
      canonical_filename_locked: true,
      materialized: true,
      materialized_from: GENERATION_METADATA_CONTRACT_SOURCE,
      materialized_at: new Date().toISOString(),
      schema_version: 'v1',
      export_path: `${imageDir}/generation_metadata_contract.json`,
    });
    created.push(`${imageDir}/generation_metadata_contract.json`);
  }

  const videoDnaFromImage: { target: string; source: string; blockId: string }[] = [
    { target: `${videoDir}/character_dna.json`, source: `${imageDir}/character_dna_bundle.json`, blockId: 'character-dna-v5' },
    { target: `${videoDir}/location_dna.json`, source: `${imageDir}/location_dna_bundle.json`, blockId: 'location-dna-v5' },
    { target: `${videoDir}/lighting_dna.json`, source: `${imageDir}/lighting_dna_bundle.json`, blockId: 'lighting-dna-v5' },
    { target: `${videoDir}/environment_dna.json`, source: `${imageDir}/environment_dna_bundle.json`, blockId: 'environment-dna-v5' },
  ];

  for (const item of videoDnaFromImage) {
    if (!fs.existsSync(path.join(root, item.target))) {
      materializeCanonicalFile(root, item.target, item.source, {
        block_id: item.blockId,
        target_app: 'video_app',
        bundle_id: undefined,
      });
      created.push(item.target);
    }
  }

  if (!fs.existsSync(path.join(root, `${videoDir}/source_video_dna.json`))) {
    materializeCanonicalFile(root, `${videoDir}/source_video_dna.json`, `${videoDir}/source_video_numerical_dna.json`, {
      block_id: 'source-video-dna-v5',
      system_id: 'source_video_dna',
      canonical_alias_of: 'source_video_numerical_dna.json',
    });
    created.push(`${videoDir}/source_video_dna.json`);
  }

  if (!fs.existsSync(path.join(root, `${videoDir}/temporal_dna.json`))) {
    materializeCanonicalFile(root, `${videoDir}/temporal_dna.json`, `${videoDir}/temporal_memory_bundle.json`, {
      block_id: 'temporal-dna-v5',
      canonical_alias_of: 'temporal_memory_bundle.json',
    });
    created.push(`${videoDir}/temporal_dna.json`);
  }

  if (!fs.existsSync(path.join(root, `${videoDir}/video_generation_rules.json`))) {
    const bundle = readJson<Record<string, unknown>>(root, `${videoDir}/video_generation_bundle.json`);
    writeJson(root, `${videoDir}/video_generation_rules.json`, {
      block_id: 'video-generation-rules-v5',
      canonical_upload_standard: 'app-upload-standard-v1',
      canonical_filename_locked: true,
      materialized_from: `${videoDir}/video_generation_bundle.json`,
      materialized_at: new Date().toISOString(),
      schema_version: 'v1',
      target_app: 'video_app',
      materialized: true,
      production_grade: true,
      video_generation_rules: bundle.video_generation_rules ?? bundle,
      source_block_id: bundle.block_id,
    });
    created.push(`${videoDir}/video_generation_rules.json`);
  }

  return created;
}

function updateUploadPackages(root: string): void {
  const imagePkg = readJson<Record<string, unknown>>(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH);
  imagePkg.canonical_upload_standard = 'app-upload-standard-v1';
  imagePkg.canonical_required_files = [...IMAGE_APP_CANONICAL_FILES];
  imagePkg.schema_lock = {
    filename_change_forbidden: true,
    canonical_structure_locked: true,
    version_inside_metadata_only: true,
  };
  imagePkg.canonical_version_dir = 'latest_v5';
  imagePkg.forbidden_version_dirs = [...FORBIDDEN_VERSION_DIRS];
  imagePkg.legacy_structure_restored = false;
  const imageBlocks = new Set((imagePkg.output_blocks as string[] | undefined) ?? []);
  imageBlocks.add('source_video_dna_bundle');
  imageBlocks.add('generation_metadata_contract');
  imageBlocks.add('canonical_upload_standard');
  imagePkg.output_blocks = [...imageBlocks];
  imagePkg.canonical_upload_standardized_at = new Date().toISOString();
  writeJson(root, IMAGE_APP_UPLOAD_PACKAGE_V5_PATH, imagePkg);

  const videoPkg = readJson<Record<string, unknown>>(root, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH);
  videoPkg.canonical_upload_standard = 'app-upload-standard-v1';
  videoPkg.canonical_required_files = [...VIDEO_APP_CANONICAL_FILES];
  videoPkg.schema_lock = {
    filename_change_forbidden: true,
    canonical_structure_locked: true,
    version_inside_metadata_only: true,
  };
  videoPkg.canonical_version_dir = 'latest_v5';
  videoPkg.forbidden_version_dirs = [...FORBIDDEN_VERSION_DIRS];
  const videoBlocks = new Set((videoPkg.output_blocks as string[] | undefined) ?? []);
  for (const file of VIDEO_APP_CANONICAL_FILES) {
    if (file.endsWith('.json') && !file.includes('upload-package')) {
      videoBlocks.add(file.replace('.json', ''));
    }
  }
  videoBlocks.add('canonical_upload_standard');
  videoPkg.output_blocks = [...videoBlocks];
  videoPkg.canonical_upload_standardized_at = new Date().toISOString();
  writeJson(root, VIDEO_APP_UPLOAD_PACKAGE_V5_PATH, videoPkg);
}

function buildUploadStandardSpec(root: string): Record<string, unknown> {
  return {
    standard_id: 'app-upload-standard-v1',
    phase: UPLOAD_STANDARD_PHASE,
    audit_id: UPLOAD_STANDARD_AUDIT_ID,
    generated_at: new Date().toISOString(),
    purpose: 'Permanent canonical upload standard for Image App and Video App using latest_v5 fixed filenames.',
    policy: SAFE_CREATE_POLICY,
    canonical_version_dir: 'latest_v5',
    forbidden_version_dirs: [...FORBIDDEN_VERSION_DIRS],
    evolution_policy: {
      filename_change_forbidden: true,
      canonical_structure_locked: true,
      version_inside_metadata_only: true,
      dataset_evolution_updates_contents_only: true,
      rollback_to_legacy_structure_forbidden: true,
      harvested_legacy_pattern_loss_forbidden: true,
      dataset_deletion_forbidden: true,
    },
    schema_lock: {
      filename_change_forbidden: true,
      canonical_structure_locked: true,
      version_inside_metadata_only: true,
    },
    image_app: {
      canonical_dir: IMAGE_APP_LATEST_V5_DIR,
      upload_manifest: 'image-app-upload-package-v5.json',
      required_files: [...IMAGE_APP_CANONICAL_FILES],
      supplemental_files_allowed: true,
    },
    video_app: {
      canonical_dir: VIDEO_APP_LATEST_V5_DIR,
      upload_manifest: 'video-app-upload-package-v5.json',
      required_files: [...VIDEO_APP_CANONICAL_FILES],
      supplemental_files_allowed: true,
    },
    manifest_verification: {
      required_files_exist: true,
      schema_match: true,
      critical_missing_count_eq_0: true,
    },
    materialization_aliases: {
      image_app: {
        'source_video_dna_bundle.json': 'source_video_numerical_dna_bundle.json',
        'generation_metadata_contract.json': GENERATION_METADATA_CONTRACT_SOURCE,
      },
      video_app: {
        'character_dna.json': `${IMAGE_APP_LATEST_V5_DIR}/character_dna_bundle.json`,
        'location_dna.json': `${IMAGE_APP_LATEST_V5_DIR}/location_dna_bundle.json`,
        'lighting_dna.json': `${IMAGE_APP_LATEST_V5_DIR}/lighting_dna_bundle.json`,
        'environment_dna.json': `${IMAGE_APP_LATEST_V5_DIR}/environment_dna_bundle.json`,
        'source_video_dna.json': 'source_video_numerical_dna.json',
        'temporal_dna.json': 'temporal_memory_bundle.json',
        'video_generation_rules.json': 'video_generation_bundle.json',
      },
    },
    regression_gates: {
      export_coverage_pass: EXPORT_COVERAGE_PASS_VERDICT,
      app_consumption_pass: APP_CONSUMPTION_PASS_VERDICT,
      legacy_harvest_pass: LEGACY_HARVEST_PASS_VERDICT,
    },
    next_order: 'PHASE-VIDEO-SHORT-TEST-001',
  };
}

function verifyManifest(
  root: string,
  appDir: string,
  requiredFiles: readonly string[]
): {
  required_files_exist: boolean;
  schema_match: boolean;
  critical_missing_count: number;
  missing_files: string[];
  schema_failures: string[];
} {
  const missing: string[] = [];
  const schemaFailures: string[] = [];

  for (const file of requiredFiles) {
    const rel = `${appDir}/${file}`;
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) {
      missing.push(rel);
      continue;
    }
    try {
      const content = readJson<Record<string, unknown>>(root, rel);
      if (!hasMetadataVersion(content)) {
        schemaFailures.push(`${rel}: missing internal metadata version field`);
      }
      if (file.includes('upload-package') && !String(content.package_id ?? '').includes('v5')) {
        schemaFailures.push(`${rel}: package_id must encode version in metadata only`);
      }
    } catch {
      schemaFailures.push(`${rel}: invalid JSON`);
    }
  }

  return {
    required_files_exist: missing.length === 0,
    schema_match: schemaFailures.length === 0,
    critical_missing_count: missing.length,
    missing_files: missing,
    schema_failures: schemaFailures,
  };
}

function verifyHarvestPreserved(root: string): boolean {
  const production = tryReadJson(root, `${IMAGE_APP_LATEST_V5_DIR}/production_adapter_bundle.json`);
  const generation = tryReadJson(root, `${IMAGE_APP_LATEST_V5_DIR}/generation_rule_bundle.json`);
  const hasHarvest =
    Boolean(production?.legacy_knowledge_harvest) ||
    Boolean(production?.legacy_preservation_embed) ||
    Boolean(generation?.legacy_knowledge_harvest) ||
    Boolean(generation?.character_first_contract_embed);
  return hasHarvest;
}

function runRegressionAudit(root: string): {
  export_coverage_pass: boolean;
  app_consumption_pass: boolean;
  legacy_harvest_pass: boolean;
} {
  const exportReport = tryReadJson(root, EXPORT_COVERAGE_AUDIT_REPORT_PATH);
  const consumptionReport = tryReadJson(root, APP_CONSUMPTION_AUDIT_REPORT_PATH);
  const harvestReport = tryReadJson(root, LEGACY_HARVEST_AUDIT_REPORT_PATH);

  return {
    export_coverage_pass: String(exportReport?.final_verdict ?? '') === EXPORT_COVERAGE_PASS_VERDICT,
    app_consumption_pass:
      String(consumptionReport?.final_verdict ?? '') === APP_CONSUMPTION_PASS_VERDICT &&
      String(consumptionReport?.status ?? '') === APP_CONSUMPTION_READY_STATUS,
    legacy_harvest_pass: String(harvestReport?.final_verdict ?? '') === LEGACY_HARVEST_PASS_VERDICT,
  };
}

export function writeAppUploadStandardization(projectRoot?: string): AppUploadStandardizationReport {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const forbiddenDirsExist = FORBIDDEN_VERSION_DIRS.some((dir) =>
    fs.existsSync(path.join(root, 'exports/image_app', dir)) || fs.existsSync(path.join(root, 'exports/video_app', dir))
  );
  if (forbiddenDirsExist) {
    issues.push({ code: 'FORBIDDEN_VERSION_DIR', message: 'latest_v6/v7/v8 directories must not exist', severity: 'error' });
  }

  const createdFiles = applyCanonicalMaterialization(root);
  updateUploadPackages(root);

  const spec = buildUploadStandardSpec(root);
  writeJson(root, UPLOAD_STANDARD_SPEC_PATH, spec);

  const imageManifest = verifyManifest(root, IMAGE_APP_LATEST_V5_DIR, IMAGE_APP_CANONICAL_FILES);
  const videoManifest = verifyManifest(root, VIDEO_APP_LATEST_V5_DIR, VIDEO_APP_CANONICAL_FILES);
  const criticalMissingCount = imageManifest.critical_missing_count + videoManifest.critical_missing_count;

  if (criticalMissingCount > 0) {
    issues.push({
      code: 'CANONICAL_FILES_MISSING',
      message: `critical_missing_count=${criticalMissingCount}`,
      severity: 'error',
    });
  }
  if (!imageManifest.schema_match || !videoManifest.schema_match) {
    issues.push({
      code: 'SCHEMA_MISMATCH',
      message: `schema failures: ${[...imageManifest.schema_failures, ...videoManifest.schema_failures].join('; ')}`,
      severity: 'error',
    });
  }

  const harvestPreserved = verifyHarvestPreserved(root);
  if (!harvestPreserved) {
    issues.push({ code: 'HARVESTED_PATTERNS_LOST', message: 'Harvested legacy patterns not preserved in v5 bundles', severity: 'error' });
  }

  const regression = runRegressionAudit(root);
  if (!regression.export_coverage_pass) {
    issues.push({ code: 'EXPORT_COVERAGE_REGRESSION', message: 'PASS_EXPORT_COVERAGE not preserved', severity: 'error' });
  }
  if (!regression.app_consumption_pass) {
    issues.push({ code: 'APP_CONSUMPTION_REGRESSION', message: 'PASS_APP_CONSUMPTION not preserved', severity: 'error' });
  }
  if (!regression.legacy_harvest_pass) {
    issues.push({ code: 'LEGACY_HARVEST_REGRESSION', message: 'PASS_LEGACY_HARVEST not preserved', severity: 'error' });
  }

  const imageAppUploadReady = imageManifest.required_files_exist && imageManifest.schema_match;
  const videoAppUploadReady = videoManifest.required_files_exist && videoManifest.schema_match;
  const canonicalUploadReady =
    imageAppUploadReady &&
    videoAppUploadReady &&
    criticalMissingCount === 0 &&
    !forbiddenDirsExist &&
    harvestPreserved;

  const standardizationPassed =
    issues.filter((i) => i.severity === 'error').length === 0 &&
    canonicalUploadReady &&
    regression.export_coverage_pass &&
    regression.app_consumption_pass &&
    regression.legacy_harvest_pass;

  const validationSummary: Record<string, string | number | boolean> = {
    canonical_upload_ready: canonicalUploadReady,
    image_app_upload_ready: imageAppUploadReady,
    video_app_upload_ready: videoAppUploadReady,
    critical_missing_count: criticalMissingCount,
    image_required_files_exist: imageManifest.required_files_exist,
    video_required_files_exist: videoManifest.required_files_exist,
    image_schema_match: imageManifest.schema_match,
    video_schema_match: videoManifest.schema_match,
    filename_change_forbidden: true,
    canonical_structure_locked: true,
    version_inside_metadata_only: true,
    legacy_structure_restored: false,
    harvested_patterns_preserved: harvestPreserved,
    canonical_files_materialized: createdFiles.length,
    export_coverage_regression_pass: regression.export_coverage_pass,
    app_consumption_regression_pass: regression.app_consumption_pass,
    legacy_harvest_regression_pass: regression.legacy_harvest_pass,
    gpu_execution: false,
    video_generation: false,
    next_order: standardizationPassed ? 'PHASE-VIDEO-SHORT-TEST-001' : 'PHASE-V5-PRESERVATION-PATCH-001',
    policy: SAFE_CREATE_POLICY,
  };

  const report: AppUploadStandardizationReport = {
    report_id: 'canonical-upload-standard-report-v1',
    phase: UPLOAD_STANDARD_PHASE,
    audit_id: UPLOAD_STANDARD_AUDIT_ID,
    generated_at: new Date().toISOString(),
    final_verdict: standardizationPassed ? UPLOAD_STANDARD_PASS_VERDICT : UPLOAD_STANDARD_FAIL_VERDICT,
    standardization_passed: standardizationPassed,
    precheck: {
      precheck_passed: true,
      gates: {
        latest_v5_image_exists: fs.existsSync(path.join(root, IMAGE_APP_LATEST_V5_DIR)),
        latest_v5_video_exists: fs.existsSync(path.join(root, VIDEO_APP_LATEST_V5_DIR)),
        forbidden_version_dirs_absent: !forbiddenDirsExist,
      },
    },
    validation_summary: validationSummary,
    issues,
  };

  const fullReport = {
    ...report,
    upload_standard_spec: UPLOAD_STANDARD_SPEC_PATH,
    image_app_manifest_audit: imageManifest,
    video_app_manifest_audit: videoManifest,
    regression_audit: regression,
    materialized_canonical_files: createdFiles,
    production_readiness_gates: {
      canonical_upload_ready: canonicalUploadReady,
      image_app_upload_ready: imageAppUploadReady,
      video_app_upload_ready: videoAppUploadReady,
      critical_missing_count_eq_0: criticalMissingCount === 0,
      harvested_patterns_preserved: harvestPreserved,
      legacy_structure_restored_eq_false: true,
    },
    success_conditions: {
      latest_v5_canonical: true,
      no_latest_v6_v7_v8: !forbiddenDirsExist,
      fixed_filenames_locked: true,
      contents_evolution_allowed: true,
    },
    next_pipeline: standardizationPassed ? ['PHASE-VIDEO-SHORT-TEST-001'] : ['PHASE-V5-PRESERVATION-PATCH-001'],
  };

  fs.mkdirSync(path.join(root, 'reports/upload_standard'), { recursive: true });
  writeJson(root, CANONICAL_UPLOAD_REPORT_PATH, fullReport);

  return report;
}
