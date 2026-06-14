import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_ASSETS_REGISTRY_PATH,
  ASSET_LIFECYCLE_REGISTRY_PATH,
  normalizePath,
  type AssetLifecycleRegistry,
} from './projectInventoryBuilder.js';
import {
  ACTIVE_CONSOLIDATION_PHASE,
  ACTIVE_CONSOLIDATION_REPORT_PATH,
  ACTIVE_CONSOLIDATION_SYSTEM_ID,
  ACTIVE_COUNT_TARGET_MAX,
  ACTIVE_COUNT_TARGET_MIN,
  CORE_PROJECT_MAP_PATH,
  applyActiveConsolidation,
  auditActiveAssets,
  detectActiveDuplicates,
} from './projectActiveConsolidationBuilder.js';
import { buildProjectClassificationReport } from './projectClassificationBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const ACTIVE_CONSOLIDATION_PASS_VERDICT = 'PASS_ACTIVE_CONSOLIDATION_V1' as const;
export const ACTIVE_CONSOLIDATION_FAIL_VERDICT = 'FAIL_ACTIVE_CONSOLIDATION_V1' as const;

type IssueSeverity = 'error' | 'warning';

interface ConsolidationIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface ActiveConsolidationAuditReport {
  report_id: string;
  phase: typeof ACTIVE_CONSOLIDATION_PHASE;
  system_id: typeof ACTIVE_CONSOLIDATION_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  core_assets_identified: boolean;
  duplicate_active_assets_removed: boolean;
  production_surface_reduced: boolean;
  metrics: {
    active_baseline: number;
    active_after: number;
    active_target_min: number;
    active_target_max: number;
    core_count: number;
    optional_count: number;
    obsolete_active_count: number;
    demoted_count: number;
    duplicate_builder_count: number;
    parallel_pipeline_count: number;
    redundant_validator_count: number;
    unused_active_report_count: number;
    overlapping_dataset_count: number;
  };
  detections: ReturnType<typeof detectActiveDuplicates>;
  issues: ConsolidationIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function updateActiveAssetsRegistry(
  root: string,
  coreMap: ReturnType<typeof applyActiveConsolidation>['coreMap']
): void {
  const optionalServices = [
    'services/projectInventoryBuilder.ts',
    'services/projectGovernanceAudit.ts',
    'services/projectClassificationBuilder.ts',
    'services/projectRestructureBuilder.ts',
    'services/projectRestructureAudit.ts',
    'services/projectActiveConsolidationBuilder.ts',
    'services/projectActiveConsolidationAudit.ts',
    'services/movieMasterScenarioPackageBuilder.ts',
    'services/movieSpatialGraphValidation.ts',
    'services/movieSpatialEngineValidation.ts',
  ];

  const activeRegistry = {
    registry_id: 'ACTIVE_ASSETS_REGISTRY',
    phase: ACTIVE_CONSOLIDATION_PHASE,
    system_id: ACTIVE_CONSOLIDATION_SYSTEM_ID,
    version: 'v2',
    generated_at: new Date().toISOString(),
    active_services: [...new Set([...coreMap.core_builders, ...optionalServices])].sort(),
    active_datasets: coreMap.core_datasets,
    active_exports: coreMap.core_exports,
    active_reports: [
      ...coreMap.core_reports,
      'reports/project_governance/PROJECT_GOVERNANCE_REPORT.json',
      'reports/project_governance/ACTIVE_CONSOLIDATION_REPORT.json',
    ],
    active_adapters: [],
    active_schemas: coreMap.core_schemas,
  };

  writeJson(root, ACTIVE_ASSETS_REGISTRY_PATH, activeRegistry);
}

function syncLifecycleRegistryFromClassification(
  root: string,
  classification: ReturnType<typeof applyActiveConsolidation>['updatedClassification']
): void {
  const lifecycle = JSON.parse(
    fs.readFileSync(path.join(root, ASSET_LIFECYCLE_REGISTRY_PATH), 'utf8')
  ) as AssetLifecycleRegistry;

  const index = new Map(
    lifecycle.assets.map((asset) => [normalizePath(asset.path), asset])
  );

  for (const asset of classification.assets) {
    const normalized = normalizePath(asset.path);
    if (asset.category !== 'ACTIVE' && asset.category !== 'LEGACY') {
      continue;
    }

    const existing = index.get(normalized);
    if (existing) {
      existing.status = asset.category;
      if (asset.replacement) {
        existing.replacement = asset.replacement;
      }
      existing.last_verified = new Date().toISOString();
      continue;
    }

    if (asset.category === 'ACTIVE') {
      lifecycle.assets.push({
        path: normalized,
        status: 'ACTIVE',
        owner_phase: ACTIVE_CONSOLIDATION_PHASE,
        replacement: asset.replacement,
        last_verified: new Date().toISOString(),
      });
    }
  }

  lifecycle.generated_at = new Date().toISOString();

  const activeRegistry = JSON.parse(
    fs.readFileSync(path.join(root, ACTIVE_ASSETS_REGISTRY_PATH), 'utf8')
  ) as {
    active_services: string[];
    active_reports: string[];
  };

  for (const relPath of [...activeRegistry.active_services, ...activeRegistry.active_reports]) {
    const normalized = normalizePath(relPath);
    const existing = lifecycle.assets.find((asset) => normalizePath(asset.path) === normalized);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.last_verified = new Date().toISOString();
      continue;
    }
    lifecycle.assets.push({
      path: normalized,
      status: 'ACTIVE',
      owner_phase: ACTIVE_CONSOLIDATION_PHASE,
      replacement: null,
      last_verified: new Date().toISOString(),
    });
  }

  writeJson(root, ASSET_LIFECYCLE_REGISTRY_PATH, lifecycle);
}

export function runActiveConsolidationAudit(root: string): ActiveConsolidationAuditReport {
  const issues: ConsolidationIssue[] = [];
  const { consolidated } = auditActiveAssets(root);
  const detectionsBefore = detectActiveDuplicates(consolidated);

  const applied = applyActiveConsolidation(root);
  const classificationReport = buildProjectClassificationReport(applied.updatedClassification);
  writeJson(root, 'reports/project_governance/PROJECT_CLASSIFICATION_REPORT.json', classificationReport);

  updateActiveAssetsRegistry(root, applied.coreMap);
  syncLifecycleRegistryFromClassification(root, applied.updatedClassification);

  const detectionsAfter = detectActiveDuplicates(applied.consolidationRegistry.assets);

  const coreAssetsIdentified =
    fs.existsSync(path.join(root, CORE_PROJECT_MAP_PATH)) && applied.coreMap.core_count >= 20;
  if (!coreAssetsIdentified) {
    issues.push({
      code: 'CORE_MAP_INCOMPLETE',
      message: `CORE_PROJECT_MAP core_count=${applied.coreMap.core_count} below minimum`,
      severity: 'error',
    });
  }

  const duplicateActiveAssetsRemoved = detectionsAfter.duplicate_builders.length === 0;
  if (!duplicateActiveAssetsRemoved) {
    for (const duplicate of detectionsAfter.duplicate_builders) {
      issues.push({
        code: 'DUPLICATE_ACTIVE_BUILDER',
        message: duplicate,
        severity: 'error',
      });
    }
  }

  const productionSurfaceReduced =
    applied.metrics.active_after >= ACTIVE_COUNT_TARGET_MIN &&
    applied.metrics.active_after <= ACTIVE_COUNT_TARGET_MAX;

  if (applied.metrics.active_after > ACTIVE_COUNT_TARGET_MAX) {
    issues.push({
      code: 'ACTIVE_COUNT_ABOVE_TARGET',
      message: `ACTIVE count ${applied.metrics.active_after} exceeds target max ${ACTIVE_COUNT_TARGET_MAX}`,
      severity: 'error',
    });
  }
  if (applied.metrics.active_after < ACTIVE_COUNT_TARGET_MIN) {
    issues.push({
      code: 'ACTIVE_COUNT_BELOW_TARGET',
      message: `ACTIVE count ${applied.metrics.active_after} below target min ${ACTIVE_COUNT_TARGET_MIN}`,
      severity: 'error',
    });
  }

  const validationPassed =
    coreAssetsIdentified &&
    duplicateActiveAssetsRemoved &&
    productionSurfaceReduced &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  const report: ActiveConsolidationAuditReport = {
    report_id: 'ACTIVE_CONSOLIDATION_REPORT',
    phase: ACTIVE_CONSOLIDATION_PHASE,
    system_id: ACTIVE_CONSOLIDATION_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? ACTIVE_CONSOLIDATION_PASS_VERDICT : ACTIVE_CONSOLIDATION_FAIL_VERDICT,
    validation_passed: validationPassed,
    core_assets_identified: coreAssetsIdentified,
    duplicate_active_assets_removed: duplicateActiveAssetsRemoved,
    production_surface_reduced: productionSurfaceReduced,
    metrics: {
      active_baseline: applied.metrics.active_baseline,
      active_after: applied.metrics.active_after,
      active_target_min: ACTIVE_COUNT_TARGET_MIN,
      active_target_max: ACTIVE_COUNT_TARGET_MAX,
      core_count: applied.metrics.core_count,
      optional_count: applied.metrics.optional_count,
      obsolete_active_count: applied.metrics.obsolete_active_count,
      demoted_count: applied.metrics.demoted_count,
      duplicate_builder_count: detectionsAfter.duplicate_builders.length,
      parallel_pipeline_count: detectionsBefore.parallel_pipelines.length,
      redundant_validator_count: detectionsBefore.redundant_validators.length,
      unused_active_report_count: detectionsBefore.unused_active_reports.length,
      overlapping_dataset_count: detectionsBefore.overlapping_datasets.length,
    },
    detections: detectionsBefore,
    issues,
  };

  writeJson(root, ACTIVE_CONSOLIDATION_REPORT_PATH, report);
  return report;
}

export function writeActiveConsolidationAuditReport(projectRoot?: string): ActiveConsolidationAuditReport {
  return runActiveConsolidationAudit(resolveProjectRoot(projectRoot));
}
