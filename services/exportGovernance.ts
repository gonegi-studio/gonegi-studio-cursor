import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  isForbiddenExportAbsolutePath,
  resolveProjectRoot,
} from './projectRootResolver.js';

export const EXPORT_GOVERNANCE_VERSION = '108A' as const;

export const EXPORT_ROOT = 'exports' as const;
export const EXPORT_MANIFEST_PATH = 'exports/export-manifest.json' as const;
export const LATEST_IMAGE_APP_POINTER_PATH = 'exports/latest-image-app.json' as const;
export const LATEST_VIDEO_APP_POINTER_PATH = 'exports/latest-video-app.json' as const;

export const IMAGE_APP_ROOT = 'exports/image_app' as const;
export const IMAGE_APP_LATEST_DIR = 'exports/image_app/latest' as const;
export const IMAGE_APP_ARCHIVE_DIR = 'exports/image_app/archive' as const;
export const IMAGE_APP_REPORTS_DIR = 'exports/image_app/reports' as const;
export const IMAGE_APP_LATEST_DATASET_PATH =
  'exports/image_app/latest/image-app-brain-ingestion-package.json' as const;
export const IMAGE_APP_LATEST_DATASET_NAME = 'image-app-brain-ingestion-package' as const;
export const CINEMATIC_DNA_LIBRARY_IMPORT_PATH =
  'exports/image_app/latest/cinematic-dna-library-import.json' as const;
export const CINEMATIC_DNA_LIBRARY_DATASET_NAME = 'cinematic-dna-library-import' as const;

export const VIDEO_APP_ROOT = 'exports/video_app' as const;
export const VIDEO_APP_LATEST_DIR = 'exports/video_app/latest' as const;
export const VIDEO_APP_ARCHIVE_DIR = 'exports/video_app/archive' as const;
export const VIDEO_APP_REPORTS_DIR = 'exports/video_app/reports' as const;
export const VIDEO_APP_LATEST_DATASET_PATH =
  'exports/video_app/latest/video-brain-dataset.json' as const;
export const VIDEO_APP_LATEST_DATASET_NAME = 'video-brain-dataset' as const;

export const SNAPSHOTS_DIR = 'exports/snapshots' as const;

export const LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH =
  'exports/image-app-brain-ingestion-package.json' as const;

export const GOVERNANCE_DIRECTORY_PATHS = Object.freeze([
  EXPORT_ROOT,
  IMAGE_APP_ROOT,
  IMAGE_APP_LATEST_DIR,
  IMAGE_APP_ARCHIVE_DIR,
  IMAGE_APP_REPORTS_DIR,
  'exports/image_app/upload_bundle',
  'exports/image_app/adapters',
  'exports/image_app/test_batches',
  VIDEO_APP_ROOT,
  VIDEO_APP_LATEST_DIR,
  VIDEO_APP_ARCHIVE_DIR,
  VIDEO_APP_REPORTS_DIR,
  SNAPSHOTS_DIR,
] as const);

export const MILESTONE_SNAPSHOT_PHASES = Object.freeze(['PHASE-105', 'PHASE-110', 'PHASE-120'] as const);

export type ExportValidationVerdict = 'PASS' | 'FAIL_EXPORT_NOT_GENERATED';

export type ExportValidationResult = {
  verdict: ExportValidationVerdict;
  relative_path: string;
  absolute_path: string;
  file_exists: boolean;
  file_size: number;
  json_valid: boolean;
  sha256: string | null;
  created_at: string | null;
  updated_at: string | null;
  failures: readonly string[];
};

export type ExportManifestEntry = {
  dataset_name: string;
  dataset_version: string;
  dataset_type: string;
  absolute_path: string;
  sha256: string;
  file_size: number;
  created_at: string;
  updated_at: string;
};

export type ExportManifest = {
  governance_version: typeof EXPORT_GOVERNANCE_VERSION;
  updated_at: string;
  datasets: readonly ExportManifestEntry[];
};

export type LatestDatasetPointer = {
  current_dataset: string;
  absolute_path: string;
  sha256: string;
  created_at: string;
};

export type PublishGovernedExportOptions = {
  projectRoot: string;
  relativePath: string;
  datasetName: string;
  datasetVersion: string;
  datasetType: string;
  content: unknown;
  archivePrevious?: boolean;
};

function normalizeGovernanceRoot(projectRoot?: string): string {
  return resolveProjectRoot(projectRoot);
}

function isoFromStat(stat: fs.Stats): { created_at: string; updated_at: string } {
  return {
    created_at: stat.birthtime.toISOString(),
    updated_at: stat.mtime.toISOString(),
  };
}

export function ensureGovernanceDirectories(projectRoot?: string): void {
  const root = normalizeGovernanceRoot(projectRoot);
  for (const relativePath of GOVERNANCE_DIRECTORY_PATHS) {
    fs.mkdirSync(path.join(root, relativePath), { recursive: true });
  }
}

export function computeFileSha256(projectRoot: string, relativePath: string): string | null {
  const root = normalizeGovernanceRoot(projectRoot);
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }
  const content = fs.readFileSync(absolutePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function validateGovernedExport(
  projectRoot: string,
  relativePath: string
): ExportValidationResult {
  const root = normalizeGovernanceRoot(projectRoot);
  const absolutePath = path.resolve(root, relativePath);
  const failures: string[] = [];

  if (!fs.existsSync(absolutePath)) {
    return Object.freeze({
      verdict: 'FAIL_EXPORT_NOT_GENERATED',
      relative_path: relativePath,
      absolute_path: absolutePath,
      file_exists: false,
      file_size: 0,
      json_valid: false,
      sha256: null,
      created_at: null,
      updated_at: null,
      failures: Object.freeze(['file_missing']),
    });
  }

  const stat = fs.statSync(absolutePath);
  const { created_at, updated_at } = isoFromStat(stat);

  if (stat.size <= 0) {
    failures.push('file_size_zero');
  }

  let jsonValid = false;
  let sha256: string | null = null;

  try {
    const raw = fs.readFileSync(absolutePath, 'utf8');
    JSON.parse(raw);
    jsonValid = true;
    sha256 = crypto.createHash('sha256').update(raw).digest('hex');
  } catch {
    failures.push('json_parse_failed');
  }

  if (!absolutePath.startsWith(path.resolve(root))) {
    failures.push('absolute_path_outside_project');
  }

  if (isForbiddenExportAbsolutePath(absolutePath)) {
    failures.push('export_root_outside_project_exports');
  }

  const exportsRoot = path.resolve(root, EXPORT_ROOT);
  if (!absolutePath.startsWith(exportsRoot)) {
    failures.push('export_not_under_project_exports');
  }

  const verdict: ExportValidationVerdict =
    failures.length === 0 ? 'PASS' : 'FAIL_EXPORT_NOT_GENERATED';

  return Object.freeze({
    verdict,
    relative_path: relativePath,
    absolute_path: absolutePath,
    file_exists: true,
    file_size: stat.size,
    json_valid: jsonValid,
    sha256,
    created_at,
    updated_at,
    failures: Object.freeze(failures),
  });
}

function archiveExistingLatest(
  projectRoot: string,
  latestRelativePath: string,
  archiveDirRelativePath: string,
  datasetName: string
): void {
  const latestAbsolutePath = path.join(projectRoot, latestRelativePath);
  if (!fs.existsSync(latestAbsolutePath)) {
    return;
  }

  const archiveDir = path.join(projectRoot, archiveDirRelativePath);
  fs.mkdirSync(archiveDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveFileName = `${datasetName}-${timestamp}.json`;
  const archivePath = path.join(archiveDir, archiveFileName);
  fs.copyFileSync(latestAbsolutePath, archivePath);
}

export function publishGovernedExport(options: PublishGovernedExportOptions): ExportValidationResult {
  const {
    relativePath,
    datasetName,
    datasetVersion,
    datasetType,
    content,
    archivePrevious = true,
  } = options;
  const projectRoot = normalizeGovernanceRoot(options.projectRoot);

  ensureGovernanceDirectories(projectRoot);

  const targetDir = path.dirname(path.join(projectRoot, relativePath));
  fs.mkdirSync(targetDir, { recursive: true });

  if (archivePrevious) {
    const archiveDir =
      relativePath.includes('/image_app/')
        ? IMAGE_APP_ARCHIVE_DIR
        : relativePath.includes('/video_app/')
          ? VIDEO_APP_ARCHIVE_DIR
          : path.join(path.dirname(relativePath), 'archive');
    archiveExistingLatest(projectRoot, relativePath, archiveDir, datasetName);
  }

  const absolutePath = path.join(projectRoot, relativePath);
  fs.writeFileSync(absolutePath, `${JSON.stringify(content)}\n`, 'utf8');

  const validation = validateGovernedExport(projectRoot, relativePath);
  if (validation.verdict !== 'PASS' || validation.sha256 === null) {
    return validation;
  }

  upsertExportManifestEntry(projectRoot, {
    dataset_name: datasetName,
    dataset_version: datasetVersion,
    dataset_type: datasetType,
    absolute_path: validation.absolute_path,
    sha256: validation.sha256,
    file_size: validation.file_size,
    created_at: validation.created_at ?? new Date().toISOString(),
    updated_at: validation.updated_at ?? new Date().toISOString(),
  });

  refreshLatestPointers(projectRoot);

  return validation;
}

export function writeGovernedReport(
  projectRoot: string,
  reportsDirRelativePath: string,
  reportFileName: string,
  report: unknown
): string {
  const root = normalizeGovernanceRoot(projectRoot);
  ensureGovernanceDirectories(root);
  const reportDir = path.join(root, reportsDirRelativePath);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, reportFileName);
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return reportPath;
}

function loadExportManifest(projectRoot?: string): ExportManifest {
  const root = normalizeGovernanceRoot(projectRoot);
  const manifestPath = path.join(root, EXPORT_MANIFEST_PATH);
  if (!fs.existsSync(manifestPath)) {
    return {
      governance_version: EXPORT_GOVERNANCE_VERSION,
      updated_at: new Date().toISOString(),
      datasets: [],
    };
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as ExportManifest;
}

export function upsertExportManifestEntry(
  projectRoot: string,
  entry: ExportManifestEntry
): ExportManifest {
  const root = normalizeGovernanceRoot(projectRoot);
  ensureGovernanceDirectories(root);
  const manifest = loadExportManifest(root);
  const datasets = manifest.datasets.filter(
    (dataset) => dataset.dataset_name !== entry.dataset_name
  );
  const nextManifest: ExportManifest = {
    governance_version: EXPORT_GOVERNANCE_VERSION,
    updated_at: new Date().toISOString(),
    datasets: Object.freeze([...datasets, Object.freeze({ ...entry })]) as readonly ExportManifestEntry[],
  };
  fs.writeFileSync(
    path.join(root, EXPORT_MANIFEST_PATH),
    `${JSON.stringify(nextManifest, null, 2)}\n`,
    'utf8'
  );
  return nextManifest;
}

export function writeLatestDatasetPointer(
  projectRoot: string,
  pointerRelativePath: string,
  pointer: LatestDatasetPointer
): string {
  const root = normalizeGovernanceRoot(projectRoot);
  ensureGovernanceDirectories(root);
  const pointerPath = path.join(root, pointerRelativePath);
  fs.writeFileSync(pointerPath, `${JSON.stringify(pointer, null, 2)}\n`, 'utf8');
  return pointerPath;
}

export function refreshLatestPointers(projectRoot?: string): void {
  const root = normalizeGovernanceRoot(projectRoot);
  const manifest = loadExportManifest(root);

  const imageEntry =
    manifest.datasets.find(
      (dataset) => dataset.dataset_name === CINEMATIC_DNA_LIBRARY_DATASET_NAME
    ) ??
    manifest.datasets.find(
      (dataset) => dataset.dataset_name === IMAGE_APP_LATEST_DATASET_NAME
    );
  if (imageEntry) {
    writeLatestDatasetPointer(root, LATEST_IMAGE_APP_POINTER_PATH, {
      current_dataset: imageEntry.dataset_name,
      absolute_path: imageEntry.absolute_path,
      sha256: imageEntry.sha256,
      created_at: imageEntry.updated_at,
    });
  }

  const videoEntry = manifest.datasets.find(
    (dataset) => dataset.dataset_name === VIDEO_APP_LATEST_DATASET_NAME
  );
  if (videoEntry) {
    writeLatestDatasetPointer(root, LATEST_VIDEO_APP_POINTER_PATH, {
      current_dataset: videoEntry.dataset_name,
      absolute_path: videoEntry.absolute_path,
      sha256: videoEntry.sha256,
      created_at: videoEntry.updated_at,
    });
  }
}

export function copyFileIfSourceExists(
  projectRoot: string,
  sourceRelativePath: string,
  targetRelativePath: string
): boolean {
  const sourcePath = path.join(projectRoot, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) {
    return false;
  }
  const targetPath = path.join(projectRoot, targetRelativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
  return true;
}

export function createMilestoneSnapshot(
  projectRoot: string,
  phase: (typeof MILESTONE_SNAPSHOT_PHASES)[number],
  sourceRelativePath: string,
  datasetName: string
): string | null {
  if (!MILESTONE_SNAPSHOT_PHASES.includes(phase)) {
    return null;
  }

  const sourcePath = path.join(projectRoot, sourceRelativePath);
  if (!fs.existsSync(sourcePath)) {
    return null;
  }

  ensureGovernanceDirectories(projectRoot);
  const snapshotPath = path.join(projectRoot, SNAPSHOTS_DIR, `${phase}-${datasetName}.json`);
  fs.copyFileSync(sourcePath, snapshotPath);
  return snapshotPath;
}

export function assertExportReadyForPass(
  projectRoot: string,
  relativePath: string
): ExportValidationResult {
  return validateGovernedExport(projectRoot, relativePath);
}
