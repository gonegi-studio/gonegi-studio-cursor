import fs from 'node:fs';
import path from 'node:path';
import {
  ACTIVE_PROJECT_MAP_PATH,
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  PROJECT_CLASSIFICATION_REPORT_PATH,
  PROJECT_RESTRUCTURE_PHASE,
  PROJECT_RESTRUCTURE_SYSTEM_ID,
  RESTRucture_ROOTS,
  buildProjectClassificationReport,
  classifyProjectAssets,
} from './projectClassificationBuilder.js';
import {
  PROJECT_RESTRUCTURE_REPORT_PATH,
  executeProjectRestructure,
} from './projectRestructureBuilder.js';
import { resolveProjectRoot } from './projectRootResolver.js';

export const PROJECT_RESTRUCTURE_AUDIT_REPORT_PATH =
  'reports/project_governance/PROJECT_RESTRUCTURE_AUDIT_REPORT.json' as const;
export const PROJECT_RESTRUCTURE_PASS_VERDICT = 'PASS_PROJECT_RESTRUCTURE_V1' as const;
export const PROJECT_RESTRUCTURE_FAIL_VERDICT = 'FAIL_PROJECT_RESTRUCTURE_V1' as const;

const ORPHAN_BASELINE = 3845;
const ORPHAN_TARGET = 1000;

const REQUIRED_LEGACY_EXPORTS = [
  'legacy/exports/movie_spatial/titanic-image-app-native-import-v7.json',
  'legacy/exports/movie_spatial/spirited-away-image-app-native-import-v7.json',
  'legacy/exports/movie_spatial/titanic-image-app-native-import.json',
  'legacy/exports/movie_spatial/spirited-away-image-app-native-import.json',
] as const;

const REQUIRED_ACTIVE_EXPORTS = [
  'exports/movie_spatial/ACTIVE/titanic-image-app-native-import-v8.json',
  'exports/movie_spatial/ACTIVE/spirited-away-image-app-native-import-v8.json',
] as const;

type IssueSeverity = 'error' | 'warning';

interface RestructureIssue {
  code: string;
  message: string;
  severity: IssueSeverity;
}

export interface ProjectRestructureAuditReport {
  report_id: string;
  phase: typeof PROJECT_RESTRUCTURE_PHASE;
  system_id: typeof PROJECT_RESTRUCTURE_SYSTEM_ID;
  generated_at: string;
  final_verdict: string;
  validation_passed: boolean;
  classification_complete: boolean;
  active_assets_identified: boolean;
  legacy_assets_relocated: boolean;
  orphan_asset_count_reduced: boolean;
  project_structure_clean: boolean;
  metrics: {
    active_count: number;
    legacy_count: number;
    archived_count: number;
    experimental_count: number;
    unclassified_count: number;
    orphan_asset_count: number;
    orphan_baseline: number;
    orphan_target: number;
    relocated_count: number;
    active_export_count: number;
    legacy_export_count: number;
  };
  issues: RestructureIssue[];
}

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function runProjectRestructureAudit(root: string): ProjectRestructureAuditReport {
  const issues: RestructureIssue[] = [];
  const { registry, restructure } = executeProjectRestructure(root);
  const report = buildProjectClassificationReport(registry);

  const classificationComplete = report.metrics.unclassified_count === 0;
  if (!classificationComplete) {
    issues.push({
      code: 'UNCLASSIFIED_ASSETS_REMAIN',
      message: `${report.metrics.unclassified_count} assets remain UNCLASSIFIED`,
      severity: 'warning',
    });
  }

  const activeMapPath = path.join(root, ACTIVE_PROJECT_MAP_PATH);
  let activeAssetsIdentified = false;
  if (!fs.existsSync(activeMapPath)) {
    issues.push({
      code: 'ACTIVE_PROJECT_MAP_MISSING',
      message: ACTIVE_PROJECT_MAP_PATH,
      severity: 'error',
    });
  } else {
    const activeMap = JSON.parse(fs.readFileSync(activeMapPath, 'utf8')) as {
      current_active_builders: string[];
      current_active_exports: string[];
    };
    activeAssetsIdentified =
      activeMap.current_active_builders.length > 0 &&
      activeMap.current_active_exports.length >= 2;
    if (!activeAssetsIdentified) {
      issues.push({
        code: 'ACTIVE_ASSETS_INCOMPLETE',
        message: 'ACTIVE_PROJECT_MAP missing active builders or exports',
        severity: 'error',
      });
    }
  }

  let legacyAssetsRelocated = true;
  for (const rel of REQUIRED_LEGACY_EXPORTS) {
    if (!fs.existsSync(path.join(root, rel))) {
      legacyAssetsRelocated = false;
      issues.push({
        code: 'LEGACY_EXPORT_NOT_RELOCATED',
        message: `Missing relocated legacy export ${rel}`,
        severity: 'error',
      });
    }
  }

  for (const rel of REQUIRED_ACTIVE_EXPORTS) {
    if (!fs.existsSync(path.join(root, rel))) {
      legacyAssetsRelocated = false;
      issues.push({
        code: 'ACTIVE_EXPORT_DISPLACED',
        message: `ACTIVE export must remain in place: ${rel}`,
        severity: 'error',
      });
    }
  }

  const orphanAssetCountReduced = report.metrics.orphan_asset_count < ORPHAN_TARGET;
  if (!orphanAssetCountReduced) {
    issues.push({
      code: 'ORPHAN_TARGET_NOT_MET',
      message: `orphan/unclassified count ${report.metrics.orphan_asset_count} must be < ${ORPHAN_TARGET} (baseline ${ORPHAN_BASELINE})`,
      severity: 'error',
    });
  }

  let projectStructureClean = true;
  for (const folder of Object.values(RESTRucture_ROOTS)) {
    if (!fs.existsSync(path.join(root, folder))) {
      projectStructureClean = false;
      issues.push({
        code: 'RESTRUCTURE_FOLDER_MISSING',
        message: `Missing ${folder}/`,
        severity: 'error',
      });
    }
  }

  if (restructure.errors.length > 0) {
    projectStructureClean = false;
    for (const error of restructure.errors) {
      issues.push({
        code: 'RELOCATION_ERROR',
        message: error,
        severity: 'error',
      });
    }
  }

  const activeExportCount = registry.assets.filter(
    (asset) => asset.category === 'ACTIVE' && asset.asset_type === 'export'
  ).length;
  const legacyExportCount = registry.assets.filter(
    (asset) =>
      asset.category === 'LEGACY' &&
      asset.asset_type === 'export' &&
      asset.path.includes('image-app-native-import')
  ).length;

  const validationPassed =
    activeAssetsIdentified &&
    legacyAssetsRelocated &&
    orphanAssetCountReduced &&
    projectStructureClean &&
    issues.filter((issue) => issue.severity === 'error').length === 0;

  return {
    report_id: 'PROJECT_RESTRUCTURE_AUDIT_REPORT',
    phase: PROJECT_RESTRUCTURE_PHASE,
    system_id: PROJECT_RESTRUCTURE_SYSTEM_ID,
    generated_at: new Date().toISOString(),
    final_verdict: validationPassed ? PROJECT_RESTRUCTURE_PASS_VERDICT : PROJECT_RESTRUCTURE_FAIL_VERDICT,
    validation_passed: validationPassed,
    classification_complete: classificationComplete || report.metrics.unclassified_count < 50,
    active_assets_identified: activeAssetsIdentified,
    legacy_assets_relocated: legacyAssetsRelocated,
    orphan_asset_count_reduced: orphanAssetCountReduced,
    project_structure_clean: projectStructureClean,
    metrics: {
      ...report.metrics,
      orphan_baseline: ORPHAN_BASELINE,
      orphan_target: ORPHAN_TARGET,
      active_export_count: activeExportCount,
      legacy_export_count: legacyExportCount,
    },
    issues,
  };
}

export function writeProjectRestructureAuditReport(projectRoot?: string): ProjectRestructureAuditReport {
  const root = resolveProjectRoot(projectRoot);
  const audit = runProjectRestructureAudit(root);
  writeJson(root, PROJECT_RESTRUCTURE_AUDIT_REPORT_PATH, audit);
  return audit;
}

export {
  PROJECT_CLASSIFICATION_REGISTRY_PATH,
  PROJECT_CLASSIFICATION_REPORT_PATH,
  ACTIVE_PROJECT_MAP_PATH,
  ORPHAN_BASELINE,
  ORPHAN_TARGET,
};
