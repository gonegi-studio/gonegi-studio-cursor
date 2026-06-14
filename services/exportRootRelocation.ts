import fs from 'node:fs';
import path from 'node:path';
import {
  CINEMATIC_DNA_LIBRARY_DATASET_NAME,
  CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
  ensureGovernanceDirectories,
  IMAGE_APP_LATEST_DATASET_NAME,
  IMAGE_APP_LATEST_DATASET_PATH,
  IMAGE_APP_REPORTS_DIR,
  publishGovernedExport,
  refreshLatestPointers,
  validateGovernedExport,
  VIDEO_APP_LATEST_DATASET_NAME,
  VIDEO_APP_LATEST_DATASET_PATH,
  writeGovernedReport,
  type ExportValidationResult,
} from './exportGovernance.js';
import {
  buildCinematicDnaLibraryImport,
  CINEMATIC_DNA_LIBRARY_TYPE,
  CINEMATIC_DNA_LIBRARY_VERSION,
} from './cinematicDnaLibraryAdapter.js';
import {
  buildImageAppBrainIngestionPackage,
  IMAGE_APP_BRAIN_INGESTION_TYPE,
  IMAGE_APP_BRAIN_INGESTION_VERSION,
} from './imageAppBrainIngestionBuilder.js';
import {
  buildVideoBrainDataset,
  VIDEO_BRAIN_DATASET_TYPE,
  VIDEO_BRAIN_DATASET_VERSION,
} from './videoBrainDatasetBuilder.js';
import {
  findPackageJsonRoot,
  getProjectRootDiagnostics,
  isForbiddenExportAbsolutePath,
  PROJECT_FOLDER_NAME,
  resolveExportsRoot,
  resolveProjectRoot,
} from './projectRootResolver.js';

export const EXPORT_ROOT_RELOCATION_VERSION = '108A' as const;
export const EXPORT_ROOT_RELOCATION_REPORT_NAME = 'export-root-relocation-report.json' as const;

export type ExportRootRelocationVerdict =
  | 'PASS_EXPORT_ROOT_RELOCATED'
  | 'PASS_PROJECT_ROOT_CORRECTED'
  | 'FAIL_EXPORT_ROOT_OUTSIDE_PROJECT'
  | 'FAIL_FILE_NOT_FOUND'
  | 'FAIL_LEGACY_ONLY_EXPORT';

export type ExportRootRelocationReport = {
  auditTimestamp: string;
  final_verdict: ExportRootRelocationVerdict;
  relocation_version: typeof EXPORT_ROOT_RELOCATION_VERSION;
  diagnostics: ReturnType<typeof getProjectRootDiagnostics>;
  workspace_root: string;
  project_root: string;
  exports_root: string;
  legacy_exports_roots: readonly string[];
  migrated_files: readonly string[];
  image_app_latest_files: readonly string[];
  required_latest_files: {
    cinematic_dna: ExportValidationResult;
    image_brain: ExportValidationResult;
    video_brain: ExportValidationResult;
  };
  forbidden_legacy_only: boolean;
  violations: readonly string[];
};

function copyDirectoryRecursive(sourceDir: string, targetDir: string, migrated: string[]): void {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath, migrated);
    } else if (entry.isFile()) {
      if (!fs.existsSync(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        migrated.push(targetPath);
      }
    }
  }
}

export function migrateLegacyExportsToProjectRoot(startDir?: string): {
  projectRoot: string;
  exportsRoot: string;
  legacyExportsRoots: string[];
  migratedFiles: string[];
} {
  const packageRoot = findPackageJsonRoot(startDir);
  const projectRoot = resolveProjectRoot(startDir);
  const exportsRoot = resolveExportsRoot(startDir);
  const legacyExportsRoots = [
    path.join(packageRoot, 'exports'),
    path.join(packageRoot, PROJECT_FOLDER_NAME, 'exports'),
  ];
  const migratedFiles: string[] = [];

  ensureGovernanceDirectories(projectRoot);
  for (const legacyExportsRoot of legacyExportsRoots) {
    copyDirectoryRecursive(legacyExportsRoot, exportsRoot, migratedFiles);
  }

  return {
    projectRoot,
    exportsRoot,
    legacyExportsRoots,
    migratedFiles,
  };
}

export function publishRequiredLatestExports(projectRoot: string): void {
  const cinematic = buildCinematicDnaLibraryImport(projectRoot);
  publishGovernedExport({
    projectRoot,
    relativePath: CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
    datasetName: CINEMATIC_DNA_LIBRARY_DATASET_NAME,
    datasetVersion: CINEMATIC_DNA_LIBRARY_VERSION,
    datasetType: CINEMATIC_DNA_LIBRARY_TYPE,
    content: cinematic,
    archivePrevious: true,
  });

  const imageBrain = buildImageAppBrainIngestionPackage(projectRoot);
  publishGovernedExport({
    projectRoot,
    relativePath: IMAGE_APP_LATEST_DATASET_PATH,
    datasetName: IMAGE_APP_LATEST_DATASET_NAME,
    datasetVersion: IMAGE_APP_BRAIN_INGESTION_VERSION,
    datasetType: IMAGE_APP_BRAIN_INGESTION_TYPE,
    content: imageBrain,
    archivePrevious: true,
  });

  const videoBrain = buildVideoBrainDataset(projectRoot);
  publishGovernedExport({
    projectRoot,
    relativePath: VIDEO_APP_LATEST_DATASET_PATH,
    datasetName: VIDEO_APP_LATEST_DATASET_NAME,
    datasetVersion: VIDEO_BRAIN_DATASET_VERSION,
    datasetType: VIDEO_BRAIN_DATASET_TYPE,
    content: videoBrain,
    archivePrevious: true,
  });

  refreshLatestPointers(projectRoot);
}

function legacyOnlyGovernedLatest(workspaceRoot: string): boolean {
  const projectRoot = resolveProjectRoot(workspaceRoot);
  const required = [
    CINEMATIC_DNA_LIBRARY_IMPORT_PATH,
    IMAGE_APP_LATEST_DATASET_PATH,
    VIDEO_APP_LATEST_DATASET_PATH,
  ];

  const projectHasAll = required.every((relativePath) =>
    fs.existsSync(path.join(projectRoot, relativePath))
  );
  if (projectHasAll) {
    return false;
  }

  return required.every((relativePath) =>
    fs.existsSync(path.join(workspaceRoot, relativePath))
  );
}

export function auditExportRootRelocation(startDir?: string): ExportRootRelocationReport {
  const packageRoot = findPackageJsonRoot(startDir);
  const diagnostics = getProjectRootDiagnostics(startDir);
  const { projectRoot, exportsRoot, legacyExportsRoots, migratedFiles } =
    migrateLegacyExportsToProjectRoot(startDir);

  publishRequiredLatestExports(projectRoot);

  const violations: string[] = [];
  const cinematic = validateGovernedExport(projectRoot, CINEMATIC_DNA_LIBRARY_IMPORT_PATH);
  const imageBrain = validateGovernedExport(projectRoot, IMAGE_APP_LATEST_DATASET_PATH);
  const videoBrain = validateGovernedExport(projectRoot, VIDEO_APP_LATEST_DATASET_PATH);
  const expectedExportsRoot = path.normalize(exportsRoot);

  const imageAppLatestDir = path.join(projectRoot, 'exports', 'image_app', 'latest');
  const imageAppLatestFiles = fs.existsSync(imageAppLatestDir)
    ? fs.readdirSync(imageAppLatestDir)
    : [];

  for (const [label, validation] of [
    ['cinematic-dna-library-import.json', cinematic],
    ['image-app-brain-ingestion-package.json', imageBrain],
    ['video-brain-dataset.json', videoBrain],
  ] as const) {
    if (validation.verdict !== 'PASS') {
      violations.push(`${label}: ${validation.failures.join(', ')}`);
    }
    if (isForbiddenExportAbsolutePath(validation.absolute_path)) {
      violations.push(`${label} absolute path forbidden: ${validation.absolute_path}`);
    }
    if (!path.normalize(validation.absolute_path).startsWith(expectedExportsRoot)) {
      violations.push(`${label} not under resolved export root: ${expectedExportsRoot}`);
    }
  }

  const forbiddenLegacyOnly = legacyOnlyGovernedLatest(packageRoot);
  if (forbiddenLegacyOnly) {
    violations.push('Governed latest files exist only outside project-root exports');
  }

  if (path.normalize(projectRoot) === path.normalize(path.join(packageRoot, PROJECT_FOLDER_NAME))) {
    violations.push('Project root incorrectly resolved to home/Gonegi-Studio-Cursor sibling');
  }

  let final_verdict: ExportRootRelocationVerdict = 'PASS_PROJECT_ROOT_CORRECTED';
  if (forbiddenLegacyOnly) {
    final_verdict = 'FAIL_LEGACY_ONLY_EXPORT';
  } else if (
    cinematic.verdict !== 'PASS' ||
    imageBrain.verdict !== 'PASS' ||
    videoBrain.verdict !== 'PASS'
  ) {
    final_verdict = 'FAIL_FILE_NOT_FOUND';
  } else if (violations.length > 0) {
    final_verdict = 'FAIL_EXPORT_ROOT_OUTSIDE_PROJECT';
  }

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    relocation_version: EXPORT_ROOT_RELOCATION_VERSION,
    diagnostics,
    workspace_root: packageRoot,
    project_root: projectRoot,
    exports_root: exportsRoot,
    legacy_exports_roots: Object.freeze(legacyExportsRoots),
    migrated_files: Object.freeze(migratedFiles),
    image_app_latest_files: Object.freeze(imageAppLatestFiles),
    required_latest_files: Object.freeze({
      cinematic_dna: cinematic,
      image_brain: imageBrain,
      video_brain: videoBrain,
    }),
    forbidden_legacy_only: forbiddenLegacyOnly,
    violations: Object.freeze(violations),
  });
}

export function runExportRootRelocationAudit(startDir?: string): ExportRootRelocationReport {
  const projectRoot = resolveProjectRoot(startDir);
  const report = auditExportRootRelocation(startDir);
  writeGovernedReport(
    projectRoot,
    IMAGE_APP_REPORTS_DIR,
    EXPORT_ROOT_RELOCATION_REPORT_NAME,
    report
  );
  return report;
}
