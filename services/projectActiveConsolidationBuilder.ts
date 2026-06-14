import fs from 'node:fs';
import path from 'node:path';
import { PROJECT_CLASSIFICATION_REGISTRY_PATH } from './projectClassificationBuilder.js';
import {
  loadClassificationRegistry,
  normalizePath,
} from './projectClassificationRegistryLoader.js';
import type { ClassifiedAsset, ProjectClassificationRegistry } from './projectClassificationBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ACTIVE_CONSOLIDATION_PHASE = 'PHASE-PROJECT-GOVERNANCE-003' as const;
export const ACTIVE_CONSOLIDATION_SYSTEM_ID = 'ACTIVE_CONSOLIDATION_V1' as const;

export const CORE_PROJECT_MAP_PATH = 'project_governance/CORE_PROJECT_MAP.json' as const;
export const ACTIVE_CONSOLIDATION_REGISTRY_PATH =
  'project_governance/ACTIVE_CONSOLIDATION_REGISTRY.json' as const;
export const ACTIVE_CONSOLIDATION_REPORT_PATH =
  'reports/project_governance/ACTIVE_CONSOLIDATION_REPORT.json' as const;

export const CONSOLIDATION_TIERS = ['CORE', 'OPTIONAL', 'OBSOLETE_ACTIVE'] as const;
export type ConsolidationTier = (typeof CONSOLIDATION_TIERS)[number];

export const ACTIVE_COUNT_BASELINE = 124 as const;
export const ACTIVE_COUNT_TARGET_MIN = 50 as const;
export const ACTIVE_COUNT_TARGET_MAX = 70 as const;

export interface ConsolidationRule {
  id: string;
  pattern: string;
  tier: ConsolidationTier;
  demote_to: 'ACTIVE' | 'LEGACY' | null;
  reason: string;
  replacement: string | null;
}

export interface ConsolidatedAsset {
  path: string;
  asset_type: ClassifiedAsset['asset_type'];
  previous_category: ClassifiedAsset['category'];
  consolidation_tier: ConsolidationTier;
  new_category: ClassifiedAsset['category'];
  reason: string;
  replacement: string | null;
}

export interface CoreProjectMap {
  map_id: string;
  phase: typeof ACTIVE_CONSOLIDATION_PHASE;
  system_id: typeof ACTIVE_CONSOLIDATION_SYSTEM_ID;
  generated_at: string;
  production_pipeline: string;
  core_builders: string[];
  core_datasets: string[];
  core_exports: string[];
  core_reports: string[];
  core_schemas: string[];
  core_scripts: string[];
  core_governance: string[];
  core_count: number;
}

export interface ActiveConsolidationRegistry {
  registry_id: string;
  phase: typeof ACTIVE_CONSOLIDATION_PHASE;
  system_id: typeof ACTIVE_CONSOLIDATION_SYSTEM_ID;
  version: string;
  generated_at: string;
  active_baseline: number;
  active_target_min: number;
  active_target_max: number;
  consolidation_rules: ConsolidationRule[];
  assets: ConsolidatedAsset[];
}

export interface DuplicateDetection {
  duplicate_builders: string[];
  parallel_pipelines: string[];
  redundant_validators: string[];
  unused_active_reports: string[];
  overlapping_datasets: string[];
}

export const CONSOLIDATION_RULES: ConsolidationRule[] = [
  {
    id: 'core-approved-originals',
    pattern: '^datasets/generation_context/approved_originals/',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'User-managed source of truth for Image App fields',
    replacement: null,
  },
  {
    id: 'core-v8-exports',
    pattern: '^exports/movie_spatial/ACTIVE/.+-image-app-native-import-v8\\.json$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Production Image App native import',
    replacement: null,
  },
  {
    id: 'core-spatial-pipeline-builders',
    pattern: '^services/(approvedOriginalsLoader|sourceOfTruthLoader|forbiddenLegacySourcePaths|finalSourceLock(Audit|Validation)|movieImageAppNativeImportBuilder|movieMasterDatasetBinding|movieScenarioHardening|movieSpatialGraphBuilder|movieSpatialEngineBuilder|movieTimeSettingLock|movieCharacterDNALock|projectRootResolver|mvProductionSystemFoundation)\\.ts$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Minimal v8 Image App production pipeline',
    replacement: null,
  },
  {
    id: 'core-spatial-datasets-titanic',
    pattern: '^datasets/movie_spatial/titanic/titanic-(master-dataset-binding|movie-spatial-engine|movie-spatial-graph)\\.json$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Titanic spatial graph → binding production chain',
    replacement: null,
  },
  {
    id: 'core-spatial-datasets-spirited',
    pattern: '^datasets/movie_spatial/spirited_away/spirited-away-(master-dataset-binding|movie-spatial-engine|movie-spatial-graph)\\.json$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Spirited Away spatial graph → binding production chain',
    replacement: null,
  },
  {
    id: 'core-spatial-schemas',
    pattern: '^datasets/movie_spatial/movie-(image-app-native-import|master-dataset-binding|spatial-engine|spatial-graph)\\.schema\\.json$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Production schema contracts',
    replacement: null,
  },
  {
    id: 'core-final-source-report',
    pattern: '^reports/generation_context/FINAL_SOURCE_LOCK_REPORT\\.json$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Production source lock verification report',
    replacement: null,
  },
  {
    id: 'core-verify-scripts',
    pattern: '^scripts/verify-(final-source-lock|movie-image-app-native-import|movie-master-dataset-binding|movie-spatial-graph|movie-spatial-engine)\\.ts$',
    tier: 'CORE',
    demote_to: 'ACTIVE',
    reason: 'Production verification scripts',
    replacement: null,
  },
  {
    id: 'optional-governance',
    pattern: '^((project_governance/)|(services/project(Inventory|Governance|Classification|Restructure|ActiveConsolidation))|(scripts/verify-project-(governance|restructure|active-consolidation))|(reports/project_governance/))',
    tier: 'OPTIONAL',
    demote_to: 'ACTIVE',
    reason: 'Project governance operating system',
    replacement: null,
  },
  {
    id: 'optional-scenario-package',
    pattern: '^((services/movieMasterScenarioPackageBuilder)|(datasets/movie_spatial/.+/.*-master-scenario-package\\.json)|(datasets/movie_spatial/movie-master-scenario-package\\.schema\\.json)|(scripts/verify-movie-master-scenario-package\\.ts))',
    tier: 'OPTIONAL',
    demote_to: 'ACTIVE',
    reason: 'Scenario package layer above spatial binding',
    replacement: null,
  },
  {
    id: 'optional-spatial-validators',
    pattern: '^services/movieSpatial(Graph|Engine)Validation\\.ts$',
    tier: 'OPTIONAL',
    demote_to: 'ACTIVE',
    reason: 'Spatial pipeline validators',
    replacement: null,
  },
  {
    id: 'obsolete-parallel-export-pipeline',
    pattern: '^services/movieImageAppExport',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Parallel export pipeline superseded by native import v8',
    replacement: 'services/movieImageAppNativeImportBuilder.ts',
  },
  {
    id: 'obsolete-native-import-validation',
    pattern: '^services/movieImageAppNativeImportValidation\\.ts$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Redundant validator superseded by finalSourceLockAudit',
    replacement: 'services/finalSourceLockAudit.ts',
  },
  {
    id: 'obsolete-binding-validation',
    pattern: '^services/movieMaster(DatasetBindingValidation|ImportAudit)\\.ts$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Redundant binding validators',
    replacement: 'services/movieMasterDatasetBinding.ts',
  },
  {
    id: 'obsolete-artstyle-lock',
    pattern: '^services/movieArtstyleLockValidation\\.ts$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Superseded by approved originals + final source lock',
    replacement: 'services/finalSourceLockValidation.ts',
  },
  {
    id: 'obsolete-bundle-normalization',
    pattern: '^services/movieBundleNormalization\\.ts$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Not on v8 production path',
    replacement: null,
  },
  {
    id: 'obsolete-character-replacement',
    pattern: '^services/movieCharacterReplacement',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Replica-side validation not required for v8 export',
    replacement: 'services/movieCharacterDNALock.ts',
  },
  {
    id: 'obsolete-scenario-extras',
    pattern: '^services/movieScenario(Serialization|Test)Builder\\.ts$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Experimental scenario builders not on production path',
    replacement: 'services/movieScenarioHardening.ts',
  },
  {
    id: 'obsolete-replica-pipeline',
    pattern: '^((services/movieReplica)|(datasets/movie_replica(/|$))|(datasets/movie_spatial/movie-replica)|(datasets/movie_spatial/movie-image-app-export)|(datasets/movie_spatial/movie-image-app-native-import-v[234])|(datasets/movie_spatial/movie-image-generation)|(datasets/movie_spatial/movie-scenario-quality)|(datasets/movie_spatial/test_generation/)|(scripts/verify-movie-image-app-export)|(scripts/verify-movie-master-import-audit)|(scripts/verify-movie-replica))',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Movie replica parallel pipeline not required for v8 Image App production',
    replacement: 'services/movieSpatialGraphBuilder.ts',
  },
  {
    id: 'obsolete-active-folder-markers',
    pattern: '(^datasets/movie_replica$|^datasets/movie_spatial$|^datasets/movie_spatial/test_generation$|^datasets/generation_context/approved_originals$|^reports/project_governance$|^project_governance$|^datasets/movie_replica/spirited_away$|^datasets/movie_replica/titanic$|^datasets/movie_spatial/titanic$|^datasets/movie_spatial/spirited_away$)$',
    tier: 'OBSOLETE_ACTIVE',
    demote_to: 'LEGACY',
    reason: 'Folder marker; classification tracked at file level',
    replacement: null,
  },
];

function applyConsolidationRule(relPath: string): ConsolidationRule | null {
  const normalized = normalizePath(relPath);
  for (const rule of CONSOLIDATION_RULES) {
    if (new RegExp(rule.pattern, 'i').test(normalized)) {
      return rule;
    }
  }
  return null;
}

function loadRegistry(root: string): ProjectClassificationRegistry {
  return loadClassificationRegistry(root);
}

export function auditActiveAssets(projectRoot?: string): {
  registry: ProjectClassificationRegistry;
  activeAssets: ClassifiedAsset[];
  consolidated: ConsolidatedAsset[];
} {
  const root = resolveProjectRoot(projectRoot);
  const registry = loadRegistry(root);
  const activeAssets = registry.assets.filter((asset) => asset.category === 'ACTIVE');

  const consolidated: ConsolidatedAsset[] = activeAssets.map((asset) => {
    const rule =
      applyConsolidationRule(asset.path) ??
      ({
        id: 'default-obsolete-active',
        pattern: '*',
        tier: 'OBSOLETE_ACTIVE' as const,
        demote_to: 'LEGACY' as const,
        reason: 'Unclassified ACTIVE asset outside production surface',
        replacement: null,
      } satisfies ConsolidationRule);

    return {
      path: asset.path,
      asset_type: asset.asset_type,
      previous_category: asset.category,
      consolidation_tier: rule.tier,
      new_category: rule.demote_to ?? asset.category,
      reason: rule.reason,
      replacement: rule.replacement,
    };
  });

  return { registry, activeAssets, consolidated };
}

export function detectActiveDuplicates(consolidated: ConsolidatedAsset[]): DuplicateDetection {
  const remainingActive = consolidated.filter((asset) => asset.new_category === 'ACTIVE');

  const builderFamilies = new Map<string, string[]>();
  for (const asset of remainingActive) {
    if (asset.asset_type !== 'service') continue;
    const base = path.basename(asset.path, '.ts');
    const family = base.replace(/(Builder|Loader|Audit|Validation|Integrity|Certification)$/, '');
    const list = builderFamilies.get(family) ?? [];
    list.push(asset.path);
    builderFamilies.set(family, list);
  }

  const duplicateBuilders: string[] = [];
  for (const [family, paths] of builderFamilies.entries()) {
    if (paths.length > 1 && /^(movieImageApp|imageAppPrompt|sourceOfTruth|approvedOriginal)/i.test(family)) {
      duplicateBuilders.push(`${family}: ${paths.join(', ')}`);
    }
  }

  const parallelPipelines = [
    consolidated.some((asset) => asset.path.includes('movieImageAppExport') && asset.previous_category === 'ACTIVE')
      ? 'movieImageAppExport pipeline parallel to movieImageAppNativeImport v8'
      : null,
    consolidated.some((asset) => asset.path.startsWith('datasets/movie_replica/') && asset.previous_category === 'ACTIVE')
      ? 'movie_replica datasets parallel to movie_spatial production path'
      : null,
  ].filter((entry): entry is string => entry !== null);

  const redundantValidators = consolidated
    .filter(
      (asset) =>
        asset.consolidation_tier === 'OBSOLETE_ACTIVE' &&
        (asset.path.includes('Validation') || asset.path.includes('Audit')) &&
        asset.asset_type === 'service'
    )
    .map((asset) => asset.path);

  const unusedActiveReports = consolidated
    .filter(
      (asset) =>
        asset.asset_type === 'report' &&
        asset.consolidation_tier !== 'CORE' &&
        asset.new_category === 'ACTIVE'
    )
    .map((asset) => asset.path);

  const spatialDatasets = remainingActive.filter(
    (asset) => asset.path.startsWith('datasets/movie_spatial/') && asset.asset_type === 'dataset'
  );
  const overlappingDatasets: string[] = [];
  if (spatialDatasets.some((asset) => asset.path.includes('master-scenario-package')) &&
      spatialDatasets.some((asset) => asset.path.includes('master-dataset-binding'))) {
    overlappingDatasets.push('master-scenario-package overlaps master-dataset-binding for same movie');
  }

  return {
    duplicate_builders: duplicateBuilders,
    parallel_pipelines: parallelPipelines,
    redundant_validators: redundantValidators,
    unused_active_reports: unusedActiveReports,
    overlapping_datasets: overlappingDatasets,
  };
}

export function buildCoreProjectMap(consolidated: ConsolidatedAsset[]): CoreProjectMap {
  const coreAssets = consolidated.filter(
    (asset) => asset.consolidation_tier === 'CORE' && asset.new_category === 'ACTIVE'
  );

  const coreBuilders = coreAssets
    .filter((asset) => asset.asset_type === 'service')
    .map((asset) => asset.path);
  const coreDatasets = coreAssets
    .filter((asset) => asset.asset_type === 'dataset')
    .map((asset) => asset.path);
  const coreExports = coreAssets
    .filter((asset) => asset.asset_type === 'export')
    .map((asset) => asset.path);
  const coreReports = coreAssets
    .filter((asset) => asset.asset_type === 'report')
    .map((asset) => asset.path);
  const coreSchemas = coreAssets
    .filter((asset) => asset.asset_type === 'schema')
    .map((asset) => asset.path);
  const coreScripts = coreAssets
    .filter((asset) => asset.asset_type === 'script')
    .map((asset) => asset.path);
  const coreGovernance = coreAssets
    .filter((asset) => asset.asset_type === 'governance')
    .map((asset) => asset.path);

  return {
    map_id: 'CORE_PROJECT_MAP',
    phase: ACTIVE_CONSOLIDATION_PHASE,
    system_id: ACTIVE_CONSOLIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    production_pipeline: 'approved_originals → spatial_graph → spatial_engine → binding → v8_export',
    core_builders: coreBuilders.sort(),
    core_datasets: coreDatasets.sort(),
    core_exports: coreExports.sort(),
    core_reports: coreReports.sort(),
    core_schemas: coreSchemas.sort(),
    core_scripts: coreScripts.sort(),
    core_governance: coreGovernance.sort(),
    core_count: coreAssets.length,
  };
}

export function applyActiveConsolidation(projectRoot?: string): {
  consolidationRegistry: ActiveConsolidationRegistry;
  coreMap: CoreProjectMap;
  updatedClassification: ProjectClassificationRegistry;
  metrics: {
    active_baseline: number;
    active_after: number;
    core_count: number;
    optional_count: number;
    obsolete_active_count: number;
    demoted_count: number;
  };
} {
  const root = resolveProjectRoot(projectRoot);
  const { registry, activeAssets, consolidated } = auditActiveAssets(root);
  const generatedAt = new Date().toISOString();

  const demoteMap = new Map(consolidated.map((asset) => [asset.path, asset]));
  const updatedAssets = registry.assets.map((asset) => {
    const plan = demoteMap.get(asset.path);
    if (!plan || asset.category !== 'ACTIVE') {
      return asset;
    }
    return {
      ...asset,
      category: plan.new_category,
      replacement: plan.replacement ?? asset.replacement,
    };
  });

  const updatedClassification: ProjectClassificationRegistry = {
    ...registry,
    generated_at: generatedAt,
    assets: updatedAssets,
  };

  fs.writeFileSync(
    path.join(root, PROJECT_CLASSIFICATION_REGISTRY_PATH),
    `${JSON.stringify(updatedClassification, null, 2)}\n`,
    'utf8'
  );

  const coreMap = buildCoreProjectMap(consolidated);
  fs.writeFileSync(path.join(root, CORE_PROJECT_MAP_PATH), `${JSON.stringify(coreMap, null, 2)}\n`, 'utf8');

  const activeAfter = updatedAssets.filter((asset) => asset.category === 'ACTIVE').length;
  const consolidationRegistry: ActiveConsolidationRegistry = {
    registry_id: 'ACTIVE_CONSOLIDATION_REGISTRY',
    phase: ACTIVE_CONSOLIDATION_PHASE,
    system_id: ACTIVE_CONSOLIDATION_SYSTEM_ID,
    version: 'v1',
    generated_at: generatedAt,
    active_baseline: activeAssets.length,
    active_target_min: ACTIVE_COUNT_TARGET_MIN,
    active_target_max: ACTIVE_COUNT_TARGET_MAX,
    consolidation_rules: CONSOLIDATION_RULES,
    assets: consolidated,
  };

  fs.writeFileSync(
    path.join(root, ACTIVE_CONSOLIDATION_REGISTRY_PATH),
    `${JSON.stringify(consolidationRegistry, null, 2)}\n`,
    'utf8'
  );

  return {
    consolidationRegistry,
    coreMap,
    updatedClassification,
    metrics: {
      active_baseline: activeAssets.length,
      active_after: activeAfter,
      core_count: consolidated.filter((asset) => asset.consolidation_tier === 'CORE').length,
      optional_count: consolidated.filter((asset) => asset.consolidation_tier === 'OPTIONAL').length,
      obsolete_active_count: consolidated.filter((asset) => asset.consolidation_tier === 'OBSOLETE_ACTIVE').length,
      demoted_count: consolidated.filter((asset) => asset.new_category === 'LEGACY').length,
    },
  };
}

export { PROJECT_CLASSIFICATION_REGISTRY_PATH };
