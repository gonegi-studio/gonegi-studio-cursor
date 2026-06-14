import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_ASSETS_REGISTRY_PATH,
  ASSET_LIFECYCLE_REGISTRY_PATH,
  loadActiveAssetsRegistry,
  loadAssetLifecycleRegistry,
  normalizePath,
  type InventoryAssetType,
} from './projectInventoryBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_RESTRUCTURE_PHASE = 'PHASE-PROJECT-GOVERNANCE-002' as const;
export const PROJECT_RESTRUCTURE_SYSTEM_ID = 'PROJECT_RESTRUCTURE_V1' as const;

export const PROJECT_CLASSIFICATION_REGISTRY_PATH =
  'project_governance/PROJECT_CLASSIFICATION_REGISTRY.json' as const;
export const PROJECT_CLASSIFICATION_REPORT_PATH =
  'reports/project_governance/PROJECT_CLASSIFICATION_REPORT.json' as const;
export const ACTIVE_PROJECT_MAP_PATH = 'project_governance/ACTIVE_PROJECT_MAP.json' as const;

export const CLASSIFICATION_CATEGORIES = [
  'ACTIVE',
  'LEGACY',
  'ARCHIVED',
  'EXPERIMENTAL',
  'UNCLASSIFIED',
] as const;

export type ClassificationCategory = (typeof CLASSIFICATION_CATEGORIES)[number];

export const RESTRucture_ROOTS = {
  legacy: 'legacy',
  archive: 'archive',
  experimental: 'experimental',
} as const;

const SCAN_ROOTS = [
  'services',
  'datasets',
  'exports',
  'reports',
  'project_governance',
  'scripts',
] as const;

const IGNORED_DIR_NAMES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.cursor',
  'terminals',
  'legacy',
  'archive',
  'experimental',
]);

export interface ClassificationRule {
  id: string;
  pattern: string;
  category: ClassificationCategory;
  relocate_to: string | null;
  owner_phase: string | null;
}

export interface ClassifiedAsset {
  path: string;
  asset_type: InventoryAssetType;
  category: ClassificationCategory;
  owner_phase: string | null;
  relocated_to: string | null;
  replacement: string | null;
}

export interface ProjectClassificationRegistry {
  registry_id: string;
  phase: typeof PROJECT_RESTRUCTURE_PHASE;
  system_id: typeof PROJECT_RESTRUCTURE_SYSTEM_ID;
  version: string;
  generated_at: string;
  categories: readonly ClassificationCategory[];
  classification_rules: ClassificationRule[];
  assets: ClassifiedAsset[];
}

export interface ProjectClassificationReport {
  report_id: string;
  phase: typeof PROJECT_RESTRUCTURE_PHASE;
  system_id: typeof PROJECT_RESTRUCTURE_SYSTEM_ID;
  generated_at: string;
  asset_count: number;
  metrics: {
    active_count: number;
    legacy_count: number;
    archived_count: number;
    experimental_count: number;
    unclassified_count: number;
    relocated_count: number;
    orphan_asset_count: number;
  };
}

const ACTIVE_VERIFY_SCRIPTS = new Set([
  'scripts/verify-final-source-lock.ts',
  'scripts/verify-project-governance.ts',
  'scripts/verify-project-restructure.ts',
  'scripts/verify-movie-master-dataset-binding.ts',
  'scripts/verify-movie-image-app-native-import.ts',
  'scripts/verify-movie-spatial-graph.ts',
  'scripts/verify-movie-spatial-engine.ts',
]);

export const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    id: 'governance-active',
    pattern: '^project_governance/',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-PROJECT-GOVERNANCE-001',
  },
  {
    id: 'approved-originals-active',
    pattern: '^datasets/generation_context/approved_originals/',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-GENERATION-CONTEXT-008',
  },
  {
    id: 'native-import-v8-active',
    pattern: '^exports/movie_spatial/ACTIVE/.+-image-app-native-import-v8\\.json$',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-GENERATION-CONTEXT-008',
  },
  {
    id: 'movie-spatial-datasets-active',
    pattern: '^datasets/movie_spatial/',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-MOVIE-SPATIAL-007',
  },
  {
    id: 'movie-replica-datasets-active',
    pattern: '^datasets/movie_replica/',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-MOVIE-REPLICA-001',
  },
  {
    id: 'governance-reports-active',
    pattern: '^reports/project_governance/',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-PROJECT-GOVERNANCE-001',
  },
  {
    id: 'final-source-report-active',
    pattern: '^reports/generation_context/FINAL_SOURCE_LOCK_REPORT\\.json$',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: 'PHASE-GENERATION-CONTEXT-008',
  },
  {
    id: 'legacy-native-import-exports',
    pattern: '^exports/movie_spatial/.+-image-app-native-import(-v[1-7])?\\.json$',
    category: 'LEGACY',
    relocate_to: 'legacy/exports/movie_spatial/',
    owner_phase: 'PHASE-MOVIE-SPATIAL-008',
  },
  {
    id: 'legacy-image-app-export',
    pattern: '^exports/movie_spatial/.+-image-app-export\\.json$',
    category: 'LEGACY',
    relocate_to: 'legacy/exports/movie_spatial/',
    owner_phase: 'PHASE-MOVIE-SPATIAL-008',
  },
  {
    id: 'legacy-generation-context-prompts',
    pattern: '^datasets/generation_context/prompts/',
    category: 'LEGACY',
    relocate_to: 'legacy/datasets/generation_context/prompts/',
    owner_phase: 'PHASE-GENERATION-CONTEXT-002',
  },
  {
    id: 'legacy-generation-context-source-of-truth',
    pattern: '^datasets/generation_context/source_of_truth/',
    category: 'LEGACY',
    relocate_to: 'legacy/datasets/generation_context/source_of_truth/',
    owner_phase: 'PHASE-GENERATION-CONTEXT-004',
  },
  {
    id: 'legacy-generation-context-records',
    pattern: '^datasets/generation_context/(artstyle|character|timesetting|manifest)/',
    category: 'LEGACY',
    relocate_to: 'legacy/datasets/generation_context/',
    owner_phase: 'PHASE-GENERATION-CONTEXT-001',
  },
  {
    id: 'legacy-generation-context-reports',
    pattern: '^reports/generation_context/',
    category: 'LEGACY',
    relocate_to: 'legacy/reports/generation_context/',
    owner_phase: 'PHASE-GENERATION-CONTEXT-001',
  },
  {
    id: 'legacy-governance-services',
    pattern: '^services/(imageAppPrompt|generationContext|sourceOfTruthAudit|approvedOriginalAudit|sourceOfTruthFreeze|approvedOriginalsFreeze|sourcePromptLock)',
    category: 'LEGACY',
    relocate_to: null,
    owner_phase: 'PHASE-GENERATION-CONTEXT-001',
  },
  {
    id: 'legacy-verify-scripts',
    pattern: '^scripts/verify-(real-source|source-of-truth|source-prompt|image-app-prompt|generation-context)',
    category: 'LEGACY',
    relocate_to: null,
    owner_phase: 'PHASE-GENERATION-CONTEXT-001',
  },
  {
    id: 'active-governance-services',
    pattern: '^services/(project(Inventory|Governance|Classification|Restructure)|approvedOriginals|sourceOfTruth|finalSource|forbiddenLegacy|movie(Master|Spatial|ImageApp|Scenario|TimeSetting|Character|Artstyle|Replica|Bundle)|resolveProjectRoot|projectRootResolver|mvProductionSystemFoundation)',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'active-verify-scripts',
    pattern: '^scripts/verify-(final-source-lock|project-governance|project-restructure|movie-master|movie-spatial|movie-image-app)',
    category: 'ACTIVE',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'experimental-paths',
    pattern: '(^|/)(experimental|preview|test-kiki|testKiki|brainDataset|brain_dataset)(/|\\.)',
    category: 'EXPERIMENTAL',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-auditors',
    pattern: '^services/auditors/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: 'PHASE-PROJECT-AUDITOR-001',
  },
  {
    id: 'archived-verify-scripts',
    pattern: '^scripts/verify-',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-render-feedback',
    pattern: '^datasets/render_feedback/',
    category: 'ARCHIVED',
    relocate_to: 'archive/datasets/render_feedback/',
    owner_phase: null,
  },
  {
    id: 'archived-datasets-default',
    pattern: '^datasets/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-services-default',
    pattern: '^services/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-reports-default',
    pattern: '^reports/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-exports-default',
    pattern: '^exports/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
  {
    id: 'archived-scripts-default',
    pattern: '^scripts/',
    category: 'ARCHIVED',
    relocate_to: null,
    owner_phase: null,
  },
];

function classifyAssetType(relPath: string, isDirectory: boolean): InventoryAssetType {
  if (isDirectory) return 'folder';
  if (relPath.startsWith('project_governance/')) return 'governance';
  if (relPath.startsWith('services/')) return relPath.includes('adapter') ? 'adapter' : 'service';
  if (relPath.startsWith('exports/')) return 'export';
  if (relPath.startsWith('reports/')) return 'report';
  if (relPath.startsWith('scripts/verify-')) return 'script';
  if (relPath.endsWith('.schema.json')) return 'schema';
  if (relPath.startsWith('datasets/')) return 'dataset';
  return 'dataset';
}

function walkPaths(root: string, relDir: string, results: string[]): void {
  const fullDir = path.join(root, relDir);
  if (!fs.existsSync(fullDir)) return;

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    if (IGNORED_DIR_NAMES.has(entry.name)) continue;
    const relPath = normalizePath(path.join(relDir, entry.name));
    if (entry.isDirectory()) {
      results.push(`${relPath}/`);
      walkPaths(root, relPath, results);
      continue;
    }
    results.push(relPath);
  }
}

function applyClassificationRule(relPath: string): ClassificationRule | null {
  const normalized = normalizePath(relPath).replace(/\/$/, '');

  for (const rule of CLASSIFICATION_RULES) {
    const regex = new RegExp(rule.pattern, 'i');
    if (regex.test(normalized) || regex.test(`${normalized}/`)) {
      return rule;
    }
  }
  return null;
}

function resolveRelocatedPath(relPath: string, rule: ClassificationRule): string | null {
  if (!rule.relocate_to) return null;
  const normalized = normalizePath(relPath);
  if (normalized.startsWith('legacy/') || normalized.startsWith('archive/') || normalized.startsWith('experimental/')) {
    return null;
  }
  const fileName = path.basename(normalized);
  if (rule.relocate_to.endsWith('/')) {
    return normalizePath(path.join(rule.relocate_to, fileName));
  }
  return normalizePath(path.join(rule.relocate_to, fileName));
}

function lookupLifecycleReplacement(relPath: string, root: string): string | null {
  try {
    const lifecycle = loadAssetLifecycleRegistry(root);
    const normalized = normalizePath(relPath);
    const asset = lifecycle.assets.find((entry) => normalizePath(entry.path) === normalized);
    return asset?.replacement ?? null;
  } catch {
    return null;
  }
}

export function classifyProjectAssets(projectRoot?: string): ProjectClassificationRegistry {
  const root = resolveProjectRoot(projectRoot);
  const generatedAt = new Date().toISOString();
  const discovered: string[] = [];

  for (const scanRoot of SCAN_ROOTS) {
    walkPaths(root, scanRoot, discovered);
  }

  const assets: ClassifiedAsset[] = [];
  const seen = new Set<string>();

  for (const relPath of discovered.sort()) {
    const normalized = normalizePath(relPath).replace(/\/$/, '') || normalizePath(relPath);
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const fullPath = path.join(root, normalized);
    const isDirectory = normalized.endsWith('/') || (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory());
    const rule = applyClassificationRule(normalized);

    let category: ClassificationCategory = rule?.category ?? 'UNCLASSIFIED';
    if (ACTIVE_VERIFY_SCRIPTS.has(normalized)) {
      category = 'ACTIVE';
    }

    assets.push({
      path: normalized,
      asset_type: classifyAssetType(normalized, isDirectory),
      category,
      owner_phase: rule?.owner_phase ?? null,
      relocated_to: rule ? resolveRelocatedPath(normalized, rule) : null,
      replacement: lookupLifecycleReplacement(normalized, root),
    });
  }

  return {
    registry_id: 'PROJECT_CLASSIFICATION_REGISTRY',
    phase: PROJECT_RESTRUCTURE_PHASE,
    system_id: PROJECT_RESTRUCTURE_SYSTEM_ID,
    version: 'v1',
    generated_at: generatedAt,
    categories: CLASSIFICATION_CATEGORIES,
    classification_rules: CLASSIFICATION_RULES,
    assets,
  };
}

export function buildProjectClassificationReport(
  registry: ProjectClassificationRegistry
): ProjectClassificationReport {
  const metrics = {
    active_count: registry.assets.filter((asset) => asset.category === 'ACTIVE').length,
    legacy_count: registry.assets.filter((asset) => asset.category === 'LEGACY').length,
    archived_count: registry.assets.filter((asset) => asset.category === 'ARCHIVED').length,
    experimental_count: registry.assets.filter((asset) => asset.category === 'EXPERIMENTAL').length,
    unclassified_count: registry.assets.filter((asset) => asset.category === 'UNCLASSIFIED').length,
    relocated_count: registry.assets.filter((asset) => asset.relocated_to !== null).length,
    orphan_asset_count: registry.assets.filter((asset) => asset.category === 'UNCLASSIFIED').length,
  };

  return {
    report_id: 'PROJECT_CLASSIFICATION_REPORT',
    phase: PROJECT_RESTRUCTURE_PHASE,
    system_id: PROJECT_RESTRUCTURE_SYSTEM_ID,
    generated_at: registry.generated_at,
    asset_count: registry.assets.length,
    metrics,
  };
}

export function writeProjectClassificationRegistry(projectRoot?: string): {
  registry: ProjectClassificationRegistry;
  report: ProjectClassificationReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const registry = classifyProjectAssets(root);
  const report = buildProjectClassificationReport(registry);

  for (const rel of [PROJECT_CLASSIFICATION_REGISTRY_PATH, PROJECT_CLASSIFICATION_REPORT_PATH]) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, `${JSON.stringify(rel === PROJECT_CLASSIFICATION_REGISTRY_PATH ? registry : report, null, 2)}\n`, 'utf8');
  }

  return { registry, report };
}

export function buildActiveProjectMap(projectRoot?: string): {
  map_id: string;
  phase: typeof PROJECT_RESTRUCTURE_PHASE;
  system_id: typeof PROJECT_RESTRUCTURE_SYSTEM_ID;
  generated_at: string;
  current_active_builders: string[];
  current_active_datasets: string[];
  current_active_exports: string[];
  current_active_reports: string[];
} {
  const root = resolveProjectRoot(projectRoot);
  const activeRegistry = loadActiveAssetsRegistry(root);
  const classification = classifyProjectAssets(root);

  const activeServices = classification.assets
    .filter((asset) => asset.category === 'ACTIVE' && asset.asset_type === 'service')
    .map((asset) => asset.path);

  const activeDatasets = classification.assets
    .filter((asset) => asset.category === 'ACTIVE' && asset.asset_type === 'dataset')
    .map((asset) => asset.path);

  const activeExports = classification.assets
    .filter((asset) => asset.category === 'ACTIVE' && asset.asset_type === 'export')
    .map((asset) => asset.path);

  const activeReports = classification.assets
    .filter((asset) => asset.category === 'ACTIVE' && asset.asset_type === 'report')
    .map((asset) => asset.path);

  return {
    map_id: 'ACTIVE_PROJECT_MAP',
    phase: PROJECT_RESTRUCTURE_PHASE,
    system_id: PROJECT_RESTRUCTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    current_active_builders: [...new Set([...activeRegistry.active_services, ...activeServices])].sort(),
    current_active_datasets: [...new Set([...activeRegistry.active_datasets, ...activeDatasets])].sort(),
    current_active_exports: [...new Set([...activeRegistry.active_exports, ...activeExports])].sort(),
    current_active_reports: [...new Set([...activeRegistry.active_reports, ...activeReports])].sort(),
  };
}

export { SCAN_ROOTS as CLASSIFICATION_SCAN_ROOTS, ACTIVE_ASSETS_REGISTRY_PATH };
