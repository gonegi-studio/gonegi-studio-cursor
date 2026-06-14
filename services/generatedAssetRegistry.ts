import fs from 'node:fs';
import path from 'node:path';
import { COMPILED_PROMPT_EXPORT_PATH } from './promptCompiler.js';
import { GENERATION_TRACE_SPEC_DATASET_PATH } from './generationTraceSystem.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const GENERATED_ASSET_REGISTRY_MODULE = 'GENERATED_ASSET_REGISTRY_V1' as const;

export const GENERATED_ASSET_REGISTRY_DATASET_PATH =
  'datasets/assets/generated-asset-registry.json' as const;
export const GENERATED_ASSET_INDEX_DATASET_PATH =
  'datasets/assets/generated-asset-index.json' as const;
export const GENERATED_ASSET_REGISTRY_EXPORT_PATH =
  'exports/assets/generated-asset-registry.json' as const;
export const GENERATED_ASSET_INDEX_EXPORT_PATH =
  'exports/assets/generated-asset-index.json' as const;

const ASSET_TYPES = ['prompt', 'image', 'video', 'edit', 'final_output'] as const;

const REQUIRED_ASSET_FIELDS = [
  'asset_id',
  'asset_type',
  'trace_id',
  'source_stage',
  'created_at',
  'integrity_status',
] as const;

type IssueSeverity = 'error' | 'warning';

interface ValidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

interface GeneratedAssetRegistry {
  registry_id: string;
  upstream_checkpoint: string;
  asset_type_count: number;
  asset_types: string[];
  asset_registry_integrity: string;
  required_asset_fields: string[];
  stage_mapping: Record<string, string>;
}

interface GeneratedAssetIndex {
  index_id: string;
  asset_type_count: number;
  index_entries: { asset_type: string; index_key: string }[];
  asset_registry_integrity: string;
}

export interface GeneratedAssetRegistryResult {
  asset_registry_integrity: string;
  asset_type_count: number;
  issues: ValidationIssue[];
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

export function validateAndExportAssetRegistry(projectRoot?: string): GeneratedAssetRegistryResult {
  const root = projectRoot ?? resolveProjectRoot();
  const issues: ValidationIssue[] = [];

  const registry = readJson<GeneratedAssetRegistry>(root, GENERATED_ASSET_REGISTRY_DATASET_PATH);
  const index = readJson<GeneratedAssetIndex>(root, GENERATED_ASSET_INDEX_DATASET_PATH);

  if (registry.upstream_checkpoint !== 'REAL_FEATURE_PRODUCTION_READY') {
    issues.push({
      code: 'UPSTREAM_CHECKPOINT_MISMATCH',
      message: `upstream_checkpoint=${registry.upstream_checkpoint}`,
      severity: 'error',
    });
  }

  for (const assetType of ASSET_TYPES) {
    if (!registry.asset_types.includes(assetType)) {
      issues.push({
        code: 'ASSET_TYPE_MISSING',
        message: `Missing asset type ${assetType}`,
        severity: 'error',
      });
    }
    if (registry.stage_mapping[assetType] !== assetType) {
      issues.push({
        code: 'STAGE_MAPPING_MISMATCH',
        message: `Stage mapping invalid for ${assetType}`,
        severity: 'error',
      });
    }
  }

  for (const field of REQUIRED_ASSET_FIELDS) {
    if (!registry.required_asset_fields.includes(field)) {
      issues.push({
        code: 'REQUIRED_ASSET_FIELD_MISSING',
        message: `Missing required asset field ${field}`,
        severity: 'error',
      });
    }
  }

  const indexTypes = index.index_entries.map((e) => e.asset_type);
  for (const assetType of ASSET_TYPES) {
    if (!indexTypes.includes(assetType)) {
      issues.push({
        code: 'INDEX_ENTRY_MISSING',
        message: `Missing index entry for ${assetType}`,
        severity: 'error',
      });
    }
  }

  if (!fs.existsSync(path.join(root, COMPILED_PROMPT_EXPORT_PATH))) {
    issues.push({
      code: 'COMPILED_PROMPT_MISSING',
      message: `Missing compiled prompt at ${COMPILED_PROMPT_EXPORT_PATH}`,
      severity: 'error',
    });
  }

  const assetRegistryIntegrity =
    registry.asset_registry_integrity === 'PASS' &&
    index.asset_registry_integrity === 'PASS' &&
    issues.length === 0
      ? 'PASS'
      : 'FAIL';

  if (registry.asset_registry_integrity !== 'PASS') {
    issues.push({
      code: 'ASSET_REGISTRY_INTEGRITY_FAIL',
      message: `asset_registry_integrity=${registry.asset_registry_integrity}`,
      severity: 'error',
    });
  }

  const registryExport = {
    ...registry,
    export_id: 'generated-asset-registry-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: GENERATED_ASSET_REGISTRY_DATASET_PATH,
    asset_type_list: [...ASSET_TYPES],
    asset_registry_integrity: assetRegistryIntegrity,
    trace_spec_ref: GENERATION_TRACE_SPEC_DATASET_PATH,
    compiled_prompt_ref: COMPILED_PROMPT_EXPORT_PATH,
  };

  const indexExport = {
    ...index,
    export_id: 'generated-asset-index-export-v1',
    generated_at: new Date().toISOString(),
    dataset_ref: GENERATED_ASSET_INDEX_DATASET_PATH,
    asset_registry_integrity: assetRegistryIntegrity,
  };

  fs.mkdirSync(path.join(root, 'exports/assets'), { recursive: true });
  fs.writeFileSync(
    path.join(root, GENERATED_ASSET_REGISTRY_EXPORT_PATH),
    `${JSON.stringify(registryExport, null, 2)}\n`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, GENERATED_ASSET_INDEX_EXPORT_PATH),
    `${JSON.stringify(indexExport, null, 2)}\n`,
    'utf8'
  );

  return {
    asset_registry_integrity: assetRegistryIntegrity,
    asset_type_count: registry.asset_types.length,
    issues,
  };
}
