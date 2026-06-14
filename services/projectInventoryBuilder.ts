import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_GOVERNANCE_PHASE = 'PHASE-PROJECT-GOVERNANCE-001' as const;
export const PROJECT_GOVERNANCE_SYSTEM_ID = 'PROJECT_GOVERNANCE_V1' as const;

export const PROJECT_GOVERNANCE_DIR = 'project_governance' as const;
export const PROJECT_GOVERNANCE_RULES_PATH =
  `${PROJECT_GOVERNANCE_DIR}/PROJECT_GOVERNANCE_RULES.json` as const;
export const ACTIVE_ASSETS_REGISTRY_PATH =
  `${PROJECT_GOVERNANCE_DIR}/ACTIVE_ASSETS_REGISTRY.json` as const;
export const ASSET_LIFECYCLE_REGISTRY_PATH =
  `${PROJECT_GOVERNANCE_DIR}/ASSET_LIFECYCLE_REGISTRY.json` as const;

export const PROJECT_INVENTORY_REPORT_PATH =
  'reports/project_governance/PROJECT_INVENTORY_REPORT.json' as const;

export const LIFECYCLE_STATUSES = [
  'ACTIVE',
  'LEGACY',
  'DEPRECATED',
  'ARCHIVED',
  'EXPERIMENTAL',
] as const;

export type LifecycleStatus = (typeof LIFECYCLE_STATUSES)[number];
export type InventoryAssetType =
  | 'service'
  | 'dataset'
  | 'export'
  | 'report'
  | 'adapter'
  | 'schema'
  | 'governance'
  | 'script'
  | 'folder';

export type InventoryStatus = LifecycleStatus | 'UNTRACKED';

export interface LifecycleRegistryAsset {
  path: string;
  status: LifecycleStatus;
  owner_phase: string;
  replacement: string | null;
  last_verified: string | null;
}

export interface AssetLifecycleRegistry {
  registry_id: string;
  phase: string;
  system_id: string;
  version: string;
  generated_at: string;
  assets: LifecycleRegistryAsset[];
}

export interface ActiveAssetsRegistry {
  registry_id: string;
  phase: string;
  system_id: string;
  version: string;
  generated_at: string;
  active_services: string[];
  active_datasets: string[];
  active_exports: string[];
  active_reports: string[];
  active_adapters: string[];
  active_schemas: string[];
}

export interface ProjectGovernanceRules {
  registry_id: string;
  phase: string;
  system_id: string;
  version: string;
  update_before_create: boolean;
  source_of_truth_required: boolean;
  asset_registration_required: boolean;
  lifecycle_tracking_required: boolean;
  duplicate_builder_forbidden: boolean;
  duplicate_export_forbidden: boolean;
  source_of_truth_paths?: string[];
  source_of_truth_fields?: string[];
  phase_completion_report_required?: string[];
  active_export_rule?: {
    family_pattern: string;
    max_active_per_movie: number;
    current_active_version: string;
  };
}

export interface ProjectInventoryEntry {
  path: string;
  asset_type: InventoryAssetType;
  status: InventoryStatus;
  owner_phase: string | null;
  replacement: string | null;
  last_verified: string | null;
}

export interface ProjectInventoryReport {
  report_id: string;
  phase: typeof PROJECT_GOVERNANCE_PHASE;
  system_id: typeof PROJECT_GOVERNANCE_SYSTEM_ID;
  generated_at: string;
  inventory_count: number;
  entries: ProjectInventoryEntry[];
  metrics: {
    total_assets: number;
    tracked_assets: number;
    untracked_assets: number;
    orphan_assets: number;
    duplicate_assets: number;
    legacy_assets: number;
    governance_score: number;
  };
}

const INVENTORY_SCAN_ROOTS = [
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
]);

function readJson<T>(root: string, rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')) as T;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\//, '');
}

function classifyAssetType(relPath: string, isDirectory: boolean): InventoryAssetType {
  if (isDirectory) {
    return 'folder';
  }
  if (relPath.startsWith('project_governance/')) {
    return 'governance';
  }
  if (relPath.startsWith('services/')) {
    if (relPath.includes('Adapter') || relPath.includes('adapter')) {
      return 'adapter';
    }
    return 'service';
  }
  if (relPath.startsWith('exports/')) {
    return 'export';
  }
  if (relPath.startsWith('reports/')) {
    return 'report';
  }
  if (relPath.startsWith('scripts/verify-')) {
    return 'script';
  }
  if (relPath.endsWith('.schema.json')) {
    return 'schema';
  }
  if (relPath.startsWith('datasets/')) {
    return 'dataset';
  }
  return 'dataset';
}

function walkInventoryPaths(root: string, relDir: string, results: string[]): void {
  const fullDir = path.join(root, relDir);
  if (!fs.existsSync(fullDir)) {
    return;
  }

  for (const entry of fs.readdirSync(fullDir, { withFileTypes: true })) {
    if (IGNORED_DIR_NAMES.has(entry.name)) {
      continue;
    }

    const relPath = normalizePath(path.join(relDir, entry.name));
    if (entry.isDirectory()) {
      results.push(`${relPath}/`);
      walkInventoryPaths(root, relPath, results);
      continue;
    }

    results.push(relPath);
  }
}

function buildLifecycleIndex(registry: AssetLifecycleRegistry): Map<string, LifecycleRegistryAsset> {
  const index = new Map<string, LifecycleRegistryAsset>();
  for (const asset of registry.assets) {
    index.set(normalizePath(asset.path), asset);
    index.set(normalizePath(`${asset.path}/`), asset);
  }
  return index;
}

function lookupLifecycleAsset(
  relPath: string,
  lifecycleIndex: Map<string, LifecycleRegistryAsset>
): LifecycleRegistryAsset | null {
  const normalized = normalizePath(relPath);
  return lifecycleIndex.get(normalized) ?? lifecycleIndex.get(`${normalized}/`) ?? null;
}

function isPathUnderTrackedFolder(relPath: string, lifecycleIndex: Map<string, LifecycleRegistryAsset>): boolean {
  for (const assetPath of lifecycleIndex.keys()) {
    if (!assetPath.endsWith('/')) {
      continue;
    }
    if (normalizedStartsWith(relPath, assetPath)) {
      return true;
    }
  }
  return false;
}

function normalizedStartsWith(value: string, prefix: string): boolean {
  return value === prefix.slice(0, -1) || value.startsWith(prefix);
}

export function loadProjectGovernanceRules(root: string): ProjectGovernanceRules {
  return readJson<ProjectGovernanceRules>(root, PROJECT_GOVERNANCE_RULES_PATH);
}

export function loadActiveAssetsRegistry(root: string): ActiveAssetsRegistry {
  return readJson<ActiveAssetsRegistry>(root, ACTIVE_ASSETS_REGISTRY_PATH);
}

export function loadAssetLifecycleRegistry(root: string): AssetLifecycleRegistry {
  return readJson<AssetLifecycleRegistry>(root, ASSET_LIFECYCLE_REGISTRY_PATH);
}

export function buildProjectInventory(projectRoot?: string): ProjectInventoryReport {
  const root = resolveProjectRoot(projectRoot);
  const lifecycleRegistry = loadAssetLifecycleRegistry(root);
  const lifecycleIndex = buildLifecycleIndex(lifecycleRegistry);
  const generatedAt = new Date().toISOString();

  const discoveredPaths: string[] = [];
  for (const scanRoot of INVENTORY_SCAN_ROOTS) {
    walkInventoryPaths(root, scanRoot, discoveredPaths);
  }

  const entries: ProjectInventoryEntry[] = [];
  const seen = new Set<string>();

  for (const relPath of discoveredPaths.sort()) {
    const normalized = normalizePath(relPath);
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);

    const fullPath = path.join(root, normalized.replace(/\/$/, ''));
    const isDirectory = normalized.endsWith('/') || fs.statSync(fullPath).isDirectory();
    const lifecycle = lookupLifecycleAsset(normalized, lifecycleIndex);
    const assetType = classifyAssetType(normalized, isDirectory);

    entries.push({
      path: normalized.replace(/\/$/, '') || normalized,
      asset_type: assetType,
      status: lifecycle?.status ?? 'UNTRACKED',
      owner_phase: lifecycle?.owner_phase ?? null,
      replacement: lifecycle?.replacement ?? null,
      last_verified: lifecycle?.last_verified ?? null,
    });
  }

  for (const asset of lifecycleRegistry.assets) {
    const normalized = normalizePath(asset.path);
    if (seen.has(normalized) || seen.has(`${normalized}/`)) {
      continue;
    }

    const fullPath = path.join(root, normalized);
    if (!fs.existsSync(fullPath)) {
      entries.push({
        path: normalized,
        asset_type: classifyAssetType(normalized, false),
        status: asset.status,
        owner_phase: asset.owner_phase,
        replacement: asset.replacement,
        last_verified: asset.last_verified,
      });
      continue;
    }

    entries.push({
      path: normalized,
      asset_type: classifyAssetType(normalized, fs.statSync(fullPath).isDirectory()),
      status: asset.status,
      owner_phase: asset.owner_phase,
      replacement: asset.replacement,
      last_verified: asset.last_verified,
    });
  }

  entries.sort((left, right) => left.path.localeCompare(right.path));

  const trackedAssets = entries.filter((entry) => entry.status !== 'UNTRACKED').length;
  const untrackedAssets = entries.filter((entry) => entry.status === 'UNTRACKED').length;
  const legacyAssets = entries.filter((entry) => entry.status === 'LEGACY').length;

  const orphanAssets = entries.filter((entry) => {
    if (entry.status !== 'UNTRACKED') {
      return false;
    }
    if (isPathUnderTrackedFolder(entry.path, lifecycleIndex)) {
      return false;
    }
    return true;
  }).length;

  const duplicateAssets = countDuplicateFamilies(entries);

  const governanceScore = calculateGovernanceScore({
    totalAssets: entries.length,
    trackedAssets,
    untrackedAssets,
    orphanAssets,
    duplicateAssets,
  });

  return {
    report_id: 'PROJECT_INVENTORY_REPORT',
    phase: PROJECT_GOVERNANCE_PHASE,
    system_id: PROJECT_GOVERNANCE_SYSTEM_ID,
    generated_at: generatedAt,
    inventory_count: entries.length,
    entries,
    metrics: {
      total_assets: entries.length,
      tracked_assets: trackedAssets,
      untracked_assets: untrackedAssets,
      orphan_assets: orphanAssets,
      duplicate_assets: duplicateAssets,
      legacy_assets: legacyAssets,
      governance_score: governanceScore,
    },
  };
}

function countDuplicateFamilies(entries: ProjectInventoryEntry[]): number {
  const activeExportFamilies = new Map<string, number>();

  for (const entry of entries) {
    if (entry.asset_type !== 'export' || entry.status !== 'ACTIVE') {
      continue;
    }
    const match = entry.path.match(/exports\/movie_spatial\/(.+)-image-app-native-import(?:-v(\d+))?\.json$/);
    if (!match) {
      continue;
    }
    const movieKey = match[1];
    activeExportFamilies.set(movieKey, (activeExportFamilies.get(movieKey) ?? 0) + 1);
  }

  let duplicates = 0;
  for (const count of activeExportFamilies.values()) {
    if (count > 1) {
      duplicates += count - 1;
    }
  }

  const activeBuilderFamilies = new Map<string, number>();
  for (const entry of entries) {
    if (entry.asset_type !== 'service' || entry.status !== 'ACTIVE') {
      continue;
    }
    const baseName = path.basename(entry.path, '.ts');
    if (!/(Builder|Loader|Audit|Validation)$/.test(baseName)) {
      continue;
    }
    const family = baseName.replace(/(Builder|Loader|Audit|Validation)$/, '');
    activeBuilderFamilies.set(family, (activeBuilderFamilies.get(family) ?? 0) + 1);
  }

  for (const [family, count] of activeBuilderFamilies.entries()) {
    if (family.includes('movieImageAppNativeImport') || family.includes('imageAppPrompt')) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }
  }

  return duplicates;
}

function calculateGovernanceScore(metrics: {
  totalAssets: number;
  trackedAssets: number;
  untrackedAssets: number;
  orphanAssets: number;
  duplicateAssets: number;
}): number {
  if (metrics.totalAssets === 0) {
    return 0;
  }

  const trackedRatio = metrics.trackedAssets / metrics.totalAssets;
  const untrackedPenalty = metrics.untrackedAssets / metrics.totalAssets;
  const orphanPenalty = metrics.orphanAssets / metrics.totalAssets;
  const duplicatePenalty = metrics.duplicateAssets / Math.max(metrics.totalAssets, 1);

  const score = trackedRatio - untrackedPenalty * 0.25 - orphanPenalty * 0.15 - duplicatePenalty * 0.5;
  return Math.max(0, Math.min(1, Number(score.toFixed(4))));
}

export function writeProjectInventoryReport(projectRoot?: string): ProjectInventoryReport {
  const root = resolveProjectRoot(projectRoot);
  const report = buildProjectInventory(root);
  const outputPath = path.join(root, PROJECT_INVENTORY_REPORT_PATH);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export {
  INVENTORY_SCAN_ROOTS,
  normalizePath,
  lookupLifecycleAsset,
  buildLifecycleIndex,
};
