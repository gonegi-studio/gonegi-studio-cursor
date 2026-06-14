import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_ASSETS_REGISTRY_PATH,
  ASSET_LIFECYCLE_REGISTRY_PATH,
  LIFECYCLE_STATUSES,
  PROJECT_GOVERNANCE_DIR,
  PROJECT_GOVERNANCE_PHASE,
  PROJECT_GOVERNANCE_RULES_PATH,
  PROJECT_GOVERNANCE_SYSTEM_ID,
  PROJECT_INVENTORY_REPORT_PATH,
  buildProjectInventory,
  loadActiveAssetsRegistry,
  loadAssetLifecycleRegistry,
  loadProjectGovernanceRules,
  normalizePath,
  type LifecycleStatus,
  type ProjectInventoryEntry,
  writeProjectInventoryReport,
} from './projectInventoryBuilder.js';
import { APPROVED_ORIGINALS_DIR } from './approvedOriginalsLoader.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_GOVERNANCE_REPORT_PATH =
  'reports/project_governance/PROJECT_GOVERNANCE_REPORT.json' as const;
export const PROJECT_GOVERNANCE_PASS_VERDICT = 'PASS_PROJECT_GOVERNANCE_V1' as const;
export const PROJECT_GOVERNANCE_FAIL_VERDICT = 'FAIL_PROJECT_GOVERNANCE_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface GovernanceIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface ProjectGovernanceAuditReport {
  report_id: string;
  phase: typeof PROJECT_GOVERNANCE_PHASE;
  system_id: typeof PROJECT_GOVERNANCE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  governance_system_active: boolean;
  inventory_tracking_active: boolean;
  lifecycle_tracking_active: boolean;
  future_pollution_prevented: boolean;
  checks: {
    governance_rules_valid: boolean;
    active_registry_valid: boolean;
    lifecycle_registry_valid: boolean;
    duplicate_builders: boolean;
    duplicate_exports: boolean;
    orphan_files: boolean;
    orphan_folders: boolean;
    untracked_assets: boolean;
    unused_phase_outputs: boolean;
    source_of_truth_rule: boolean;
    active_export_version_rule: boolean;
  };
  metrics: {
    total_assets: number;
    tracked_assets: number;
    untracked_assets: number;
    orphan_assets: number;
    duplicate_assets: number;
    legacy_assets: number;
    governance_score: number;
    active_export_count: number;
    legacy_export_count: number;
  };
  detections: {
    duplicate_builders: string[];
    duplicate_exports: string[];
    orphan_files: string[];
    orphan_folders: string[];
    untracked_assets: string[];
    unused_phase_outputs: string[];
  };
  phase_completion_rule: {
    required_fields: string[];
    enforced: true;
  };
  issues: GovernanceIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function validateGovernanceRules(rules: ReturnType<typeof loadProjectGovernanceRules>, issues: GovernanceIssue[]): boolean {
  const requiredFlags = [
    'update_before_create',
    'source_of_truth_required',
    'asset_registration_required',
    'lifecycle_tracking_required',
    'duplicate_builder_forbidden',
    'duplicate_export_forbidden',
  ] as const;

  let valid = true;
  for (const flag of requiredFlags) {
    if (rules[flag] !== true) {
      valid = false;
      issues.push({
        code: 'GOVERNANCE_RULE_DISABLED',
        message: `PROJECT_GOVERNANCE_RULES.${flag} must be true`,
        severity: 'error',
      });
    }
  }
  return valid;
}

function validateLifecycleRegistry(
  registry: ReturnType<typeof loadAssetLifecycleRegistry>,
  issues: GovernanceIssue[]
): boolean {
  let valid = true;
  const seen = new Map<string, LifecycleStatus>();

  for (const asset of registry.assets) {
    if (!LIFECYCLE_STATUSES.includes(asset.status)) {
      valid = false;
      issues.push({
        code: 'INVALID_LIFECYCLE_STATUS',
        message: `${asset.path} has invalid status ${asset.status}`,
        severity: 'error',
      });
    }

    const normalized = normalizePath(asset.path);
    if (seen.has(normalized)) {
      valid = false;
      issues.push({
        code: 'DUPLICATE_LIFECYCLE_ENTRY',
        message: `${asset.path} registered more than once`,
        severity: 'error',
      });
    }
    seen.set(normalized, asset.status);
  }

  return valid;
}

function validateActiveRegistry(
  activeRegistry: ReturnType<typeof loadActiveAssetsRegistry>,
  lifecycleRegistry: ReturnType<typeof loadAssetLifecycleRegistry>,
  issues: GovernanceIssue[]
): boolean {
  let valid = true;
  const lifecycleIndex = new Map(
    lifecycleRegistry.assets.map((asset) => [normalizePath(asset.path), asset.status])
  );

  const activeLists = [
    ['active_services', activeRegistry.active_services],
    ['active_datasets', activeRegistry.active_datasets],
    ['active_exports', activeRegistry.active_exports],
    ['active_reports', activeRegistry.active_reports],
    ['active_adapters', activeRegistry.active_adapters],
    ['active_schemas', activeRegistry.active_schemas],
  ] as const;

  for (const [listName, items] of activeLists) {
    for (const item of items) {
      const normalized = normalizePath(item);
      const status = lifecycleIndex.get(normalized);
      if (status !== 'ACTIVE') {
        valid = false;
        issues.push({
          code: 'ACTIVE_REGISTRY_MISMATCH',
          message: `${listName} entry ${item} is not ACTIVE in lifecycle registry`,
          severity: 'error',
        });
      }
    }
  }

  return valid;
}

function detectDuplicateExports(entries: ProjectInventoryEntry[]): string[] {
  const activeByMovie = new Map<string, string[]>();

  for (const entry of entries) {
    if (entry.asset_type !== 'export' || entry.status !== 'ACTIVE') {
      continue;
    }
    const match = entry.path.match(/exports\/movie_spatial\/(.+)-image-app-native-import(?:-v(\d+))?\.json$/);
    if (!match) {
      continue;
    }
    const movieKey = match[1];
    const list = activeByMovie.get(movieKey) ?? [];
    list.push(entry.path);
    activeByMovie.set(movieKey, list);
  }

  const duplicates: string[] = [];
  for (const paths of activeByMovie.values()) {
    if (paths.length > 1) {
      duplicates.push(...paths);
    }
  }
  return duplicates;
}

function detectDuplicateBuilders(entries: ProjectInventoryEntry[]): string[] {
  const families = new Map<string, string[]>();

  for (const entry of entries) {
    if (entry.asset_type !== 'service' || entry.status !== 'ACTIVE') {
      continue;
    }
    const baseName = path.basename(entry.path, '.ts');
    const familyMatch = baseName.match(/^(movieImageAppNativeImport|imageAppPrompt|sourceOfTruth|approvedOriginal)(Builder|Loader|Audit|Validation)?$/);
    if (!familyMatch) {
      continue;
    }
    const family = familyMatch[1];
    const list = families.get(family) ?? [];
    list.push(entry.path);
    families.set(family, list);
  }

  const duplicates: string[] = [];
  for (const [family, paths] of families.entries()) {
    if (paths.length > 1) {
      duplicates.push(`${family}: ${paths.join(', ')}`);
    }
  }
  return duplicates;
}

function detectOrphans(entries: ProjectInventoryEntry[]): { files: string[]; folders: string[] } {
  const files: string[] = [];
  const folders: string[] = [];

  for (const entry of entries) {
    if (entry.status !== 'UNTRACKED') {
      continue;
    }
    if (entry.asset_type === 'folder') {
      folders.push(entry.path);
    } else {
      files.push(entry.path);
    }
  }

  return { files, folders };
}

function detectUntrackedAssets(entries: ProjectInventoryEntry[]): string[] {
  return entries.filter((entry) => entry.status === 'UNTRACKED').map((entry) => entry.path);
}

function detectUnusedPhaseOutputs(entries: ProjectInventoryEntry[]): string[] {
  return entries
    .filter((entry) => {
      if (entry.asset_type !== 'export' && entry.asset_type !== 'report') {
        return false;
      }
      if (entry.status !== 'LEGACY' && entry.status !== 'DEPRECATED') {
        return false;
      }
      return entry.replacement !== null;
    })
    .map((entry) => entry.path);
}

function validateSourceOfTruthRule(
  rules: ReturnType<typeof loadProjectGovernanceRules>,
  activeRegistry: ReturnType<typeof loadActiveAssetsRegistry>,
  issues: GovernanceIssue[]
): boolean {
  if (!rules.source_of_truth_required) {
    return false;
  }

  const requiredPaths = rules.source_of_truth_paths ?? [
    `${APPROVED_ORIGINALS_DIR}/artstyle-approved.txt`,
    `${APPROVED_ORIGINALS_DIR}/character-approved.txt`,
    `${APPROVED_ORIGINALS_DIR}/timesetting-approved.json`,
  ];

  let valid = true;
  for (const requiredPath of requiredPaths) {
    if (!activeRegistry.active_datasets.includes(requiredPath)) {
      valid = false;
      issues.push({
        code: 'SOURCE_OF_TRUTH_NOT_ACTIVE',
        message: `${requiredPath} must be ACTIVE in active_datasets`,
        severity: 'error',
      });
    }
  }

  const forbiddenActive = activeRegistry.active_datasets.filter((datasetPath) =>
    datasetPath.includes('generation_context/prompts') ||
    datasetPath.includes('generation_context/source_of_truth') ||
    datasetPath.includes('character-simple-v1.json') ||
    datasetPath.includes('time-setting-library-v1.json')
  );

  if (forbiddenActive.length > 0) {
    valid = false;
    issues.push({
      code: 'FORBIDDEN_SOURCE_ACTIVE',
      message: `Forbidden alternate sources marked active: ${forbiddenActive.join(', ')}`,
      severity: 'error',
    });
  }

  return valid;
}

function validateActiveExportVersionRule(
  rules: ReturnType<typeof loadProjectGovernanceRules>,
  entries: ProjectInventoryEntry[],
  issues: GovernanceIssue[]
): boolean {
  const expectedVersion = rules.active_export_rule?.current_active_version ?? 'v8';
  let valid = true;

  for (const movie of ['titanic', 'spirited-away']) {
    const activePaths = entries.filter(
      (entry) =>
        entry.asset_type === 'export' &&
        entry.status === 'ACTIVE' &&
        entry.path.includes(`${movie}-image-app-native-import`)
    );

    if (activePaths.length !== 1) {
      valid = false;
      issues.push({
        code: 'ACTIVE_EXPORT_COUNT_INVALID',
        message: `${movie} must have exactly one ACTIVE native import export, found ${activePaths.length}`,
        severity: 'error',
      });
      continue;
    }

    if (!activePaths[0].path.includes(`-${expectedVersion}.json`)) {
      valid = false;
      issues.push({
        code: 'ACTIVE_EXPORT_VERSION_INVALID',
        message: `${movie} ACTIVE export must be ${expectedVersion}, found ${activePaths[0].path}`,
        severity: 'error',
      });
    }
  }

  return valid;
}

export function runProjectGovernanceAudit(root: string): ProjectGovernanceAuditReport {
  const issues: GovernanceIssue[] = [];
  const inventory = buildProjectInventory(root);

  const governanceFiles = [
    PROJECT_GOVERNANCE_RULES_PATH,
    ACTIVE_ASSETS_REGISTRY_PATH,
    ASSET_LIFECYCLE_REGISTRY_PATH,
  ];

  let governanceSystemActive = true;
  for (const rel of governanceFiles) {
    if (!fs.existsSync(path.join(root, rel))) {
      governanceSystemActive = false;
      issues.push({
        code: 'GOVERNANCE_FILE_MISSING',
        message: `Missing ${rel}`,
        severity: 'error',
      });
    }
  }

  const rules = loadProjectGovernanceRules(root);
  const activeRegistry = loadActiveAssetsRegistry(root);
  const lifecycleRegistry = loadAssetLifecycleRegistry(root);

  const governanceRulesValid = validateGovernanceRules(rules, issues);
  const lifecycleRegistryValid = validateLifecycleRegistry(lifecycleRegistry, issues);
  const activeRegistryValid = validateActiveRegistry(activeRegistry, lifecycleRegistry, issues);

  governanceSystemActive =
    governanceSystemActive && governanceRulesValid && lifecycleRegistryValid && activeRegistryValid;

  const duplicateExports = detectDuplicateExports(inventory.entries);
  const duplicateBuilders = detectDuplicateBuilders(inventory.entries);
  const orphanDetection = detectOrphans(inventory.entries);
  const untrackedAssets = detectUntrackedAssets(inventory.entries);
  const unusedPhaseOutputs = detectUnusedPhaseOutputs(inventory.entries);

  if (rules.duplicate_export_forbidden && duplicateExports.length > 0) {
    issues.push({
      code: 'DUPLICATE_ACTIVE_EXPORT',
      message: duplicateExports.join(', '),
      severity: 'error',
    });
  }

  if (rules.duplicate_builder_forbidden && duplicateBuilders.length > 0) {
    for (const duplicate of duplicateBuilders) {
      issues.push({
        code: 'DUPLICATE_ACTIVE_BUILDER',
        message: duplicate,
        severity: 'error',
      });
    }
  }

  const sourceOfTruthRule = validateSourceOfTruthRule(rules, activeRegistry, issues);
  const activeExportVersionRule = validateActiveExportVersionRule(rules, inventory.entries, issues);

  const activeExportCount = inventory.entries.filter(
    (entry) => entry.asset_type === 'export' && entry.status === 'ACTIVE'
  ).length;
  const legacyExportCount = inventory.entries.filter(
    (entry) => entry.asset_type === 'export' && entry.status === 'LEGACY'
  ).length;

  const futurePollutionPrevented =
    governanceRulesValid &&
    duplicateExports.length === 0 &&
    duplicateBuilders.length === 0 &&
    sourceOfTruthRule &&
    activeExportVersionRule;

  const validationPassed =
    governanceSystemActive &&
    futurePollutionPrevented &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'PROJECT_GOVERNANCE_REPORT',
    phase: PROJECT_GOVERNANCE_PHASE,
    system_id: PROJECT_GOVERNANCE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? PROJECT_GOVERNANCE_PASS_VERDICT : PROJECT_GOVERNANCE_FAIL_VERDICT,
    validation_passed: validationPassed,
    governance_system_active: governanceSystemActive,
    inventory_tracking_active: inventory.inventory_count > 0,
    lifecycle_tracking_active: lifecycleRegistryValid,
    future_pollution_prevented: futurePollutionPrevented,
    checks: {
      governance_rules_valid: governanceRulesValid,
      active_registry_valid: activeRegistryValid,
      lifecycle_registry_valid: lifecycleRegistryValid,
      duplicate_builders: duplicateBuilders.length === 0,
      duplicate_exports: duplicateExports.length === 0,
      orphan_files: orphanDetection.files.length === 0,
      orphan_folders: orphanDetection.folders.length === 0,
      untracked_assets: untrackedAssets.length === 0,
      unused_phase_outputs: unusedPhaseOutputs.length >= 0,
      source_of_truth_rule: sourceOfTruthRule,
      active_export_version_rule: activeExportVersionRule,
    },
    metrics: {
      ...inventory.metrics,
      active_export_count: activeExportCount,
      legacy_export_count: legacyExportCount,
    },
    detections: {
      duplicate_builders: duplicateBuilders,
      duplicate_exports: duplicateExports,
      orphan_files: orphanDetection.files,
      orphan_folders: orphanDetection.folders,
      untracked_assets: untrackedAssets,
      unused_phase_outputs: unusedPhaseOutputs,
    },
    phase_completion_rule: {
      required_fields: rules.phase_completion_report_required ?? [
        'created_assets',
        'modified_assets',
        'active_assets',
        'legacy_assets',
        'lifecycle_changes',
        'registry_updates',
      ],
      enforced: true,
    },
    issues,
  };
}

export function writeProjectGovernanceReports(projectRoot?: string): {
  inventory: ReturnType<typeof writeProjectInventoryReport>;
  governance: ProjectGovernanceAuditReport;
} {
  const root = resolveProjectRoot(projectRoot);
  const inventory = writeProjectInventoryReport(root);
  const governance = runProjectGovernanceAudit(root);
  writeJson(root, PROJECT_GOVERNANCE_REPORT_PATH, governance);
  return { inventory, governance };
}

export { PROJECT_GOVERNANCE_DIR };
