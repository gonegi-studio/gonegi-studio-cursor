import fs from 'node:fs';
import path from 'node:path';
import {
  EXPORT_GOVERNANCE_VERSION,
  EXPORT_MANIFEST_PATH,
  GOVERNANCE_DIRECTORY_PATHS,
  IMAGE_APP_LATEST_DATASET_NAME,
  IMAGE_APP_LATEST_DATASET_PATH,
  LATEST_IMAGE_APP_POINTER_PATH,
  LATEST_VIDEO_APP_POINTER_PATH,
  LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH,
  SNAPSHOTS_DIR,
  VIDEO_APP_LATEST_DATASET_NAME,
  VIDEO_APP_LATEST_DATASET_PATH,
  copyFileIfSourceExists,
  createMilestoneSnapshot,
  ensureGovernanceDirectories,
  publishGovernedExport,
  refreshLatestPointers,
  upsertExportManifestEntry,
  validateGovernedExport,
  type ExportManifest,
  type ExportValidationResult,
  type LatestDatasetPointer,
} from './exportGovernance.js';
import {
  IMAGE_APP_BRAIN_INGESTION_TYPE,
  IMAGE_APP_BRAIN_INGESTION_VERSION,
  buildImageAppBrainIngestionPackage,
} from './imageAppBrainIngestionBuilder.js';
import {
  VIDEO_BRAIN_DATASET_TYPE,
  VIDEO_BRAIN_DATASET_VERSION,
  buildVideoBrainDataset,
} from './videoBrainDatasetBuilder.js';

export type ExportGovernanceVerdict = 'PASS_EXPORT_GOVERNANCE_READY' | 'FAIL_EXPORT_NOT_GENERATED';

export type ExportGovernanceViolation = {
  code: string;
  message: string;
  field?: string;
};

export type ExportGovernanceReport = {
  auditTimestamp: string;
  final_verdict: ExportGovernanceVerdict;
  governance_version: typeof EXPORT_GOVERNANCE_VERSION;
  directory_checks: {
    passed: boolean;
    missing: readonly string[];
  };
  image_app_validation: ExportValidationResult;
  video_app_validation: ExportValidationResult;
  manifest_present: boolean;
  manifest_entry_count: number;
  latest_image_app_pointer_valid: boolean;
  latest_video_app_pointer_valid: boolean;
  migration_applied: boolean;
  snapshot_created: boolean;
  violations: readonly ExportGovernanceViolation[];
};

function loadJson<T>(projectRoot: string, relativePath: string): T | null {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

export function migrateExportsToGovernance(projectRoot: string): {
  migrationApplied: boolean;
  snapshotCreated: boolean;
} {
  ensureGovernanceDirectories(projectRoot);

  let migrationApplied = false;

  const latestImageExists = fs.existsSync(
    path.join(projectRoot, IMAGE_APP_LATEST_DATASET_PATH)
  );
  const legacyImageExists = fs.existsSync(
    path.join(projectRoot, LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH)
  );

  if (!latestImageExists && legacyImageExists) {
    copyFileIfSourceExists(
      projectRoot,
      LEGACY_IMAGE_APP_BRAIN_INGESTION_PATH,
      IMAGE_APP_LATEST_DATASET_PATH
    );
    migrationApplied = true;
  }

  if (!latestImageExists) {
    const packageDoc = buildImageAppBrainIngestionPackage(projectRoot);
    publishGovernedExport({
      projectRoot,
      relativePath: IMAGE_APP_LATEST_DATASET_PATH,
      datasetName: IMAGE_APP_LATEST_DATASET_NAME,
      datasetVersion: IMAGE_APP_BRAIN_INGESTION_VERSION,
      datasetType: IMAGE_APP_BRAIN_INGESTION_TYPE,
      content: packageDoc,
      archivePrevious: false,
    });
    migrationApplied = true;
  } else {
    const validation = validateGovernedExport(projectRoot, IMAGE_APP_LATEST_DATASET_PATH);
    if (validation.verdict === 'PASS' && validation.sha256) {
      upsertExportManifestEntry(projectRoot, {
        dataset_name: IMAGE_APP_LATEST_DATASET_NAME,
        dataset_version: IMAGE_APP_BRAIN_INGESTION_VERSION,
        dataset_type: IMAGE_APP_BRAIN_INGESTION_TYPE,
        absolute_path: validation.absolute_path,
        sha256: validation.sha256,
        file_size: validation.file_size,
        created_at: validation.created_at ?? new Date().toISOString(),
        updated_at: validation.updated_at ?? new Date().toISOString(),
      });
    }
  }

  const latestVideoExists = fs.existsSync(
    path.join(projectRoot, VIDEO_APP_LATEST_DATASET_PATH)
  );
  if (!latestVideoExists) {
    const dataset = buildVideoBrainDataset(projectRoot);
    publishGovernedExport({
      projectRoot,
      relativePath: VIDEO_APP_LATEST_DATASET_PATH,
      datasetName: VIDEO_APP_LATEST_DATASET_NAME,
      datasetVersion: VIDEO_BRAIN_DATASET_VERSION,
      datasetType: VIDEO_BRAIN_DATASET_TYPE,
      content: dataset,
      archivePrevious: false,
    });
    migrationApplied = true;
  } else {
    const validation = validateGovernedExport(projectRoot, VIDEO_APP_LATEST_DATASET_PATH);
    if (validation.verdict === 'PASS' && validation.sha256) {
      upsertExportManifestEntry(projectRoot, {
        dataset_name: VIDEO_APP_LATEST_DATASET_NAME,
        dataset_version: VIDEO_BRAIN_DATASET_VERSION,
        dataset_type: VIDEO_BRAIN_DATASET_TYPE,
        absolute_path: validation.absolute_path,
        sha256: validation.sha256,
        file_size: validation.file_size,
        created_at: validation.created_at ?? new Date().toISOString(),
        updated_at: validation.updated_at ?? new Date().toISOString(),
      });
    }
  }

  refreshLatestPointers(projectRoot);

  const snapshotCreated =
    createMilestoneSnapshot(
      projectRoot,
      'PHASE-105',
      IMAGE_APP_LATEST_DATASET_PATH,
      IMAGE_APP_LATEST_DATASET_NAME
    ) !== null;

  return { migrationApplied, snapshotCreated };
}

function validateLatestPointer(
  pointer: LatestDatasetPointer | null,
  validation: ExportValidationResult,
  datasetName: string
): boolean {
  if (pointer === null || validation.sha256 === null) {
    return false;
  }
  return (
    pointer.current_dataset === datasetName &&
    pointer.absolute_path === validation.absolute_path &&
    pointer.sha256 === validation.sha256
  );
}

export function auditExportGovernance(projectRoot: string): ExportGovernanceReport {
  const violations: ExportGovernanceViolation[] = [];
  const missingDirectories = GOVERNANCE_DIRECTORY_PATHS.filter(
    (relativePath) => !fs.existsSync(path.join(projectRoot, relativePath))
  );

  if (missingDirectories.length > 0) {
    violations.push({
      code: 'FAIL_DIRECTORY_STRUCTURE',
      message: `Missing governance directories: ${missingDirectories.join(', ')}`,
    });
  }

  const imageValidation = validateGovernedExport(projectRoot, IMAGE_APP_LATEST_DATASET_PATH);
  if (imageValidation.verdict !== 'PASS') {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: `Image App latest export invalid: ${imageValidation.failures.join(', ')}`,
      field: IMAGE_APP_LATEST_DATASET_PATH,
    });
  }

  const videoValidation = validateGovernedExport(projectRoot, VIDEO_APP_LATEST_DATASET_PATH);
  if (videoValidation.verdict !== 'PASS') {
    violations.push({
      code: 'FAIL_EXPORT_NOT_GENERATED',
      message: `Video App latest export invalid: ${videoValidation.failures.join(', ')}`,
      field: VIDEO_APP_LATEST_DATASET_PATH,
    });
  }

  const manifest = loadJson<ExportManifest>(projectRoot, EXPORT_MANIFEST_PATH);
  const manifestPresent = manifest !== null;
  if (!manifestPresent) {
    violations.push({
      code: 'FAIL_MANIFEST_MISSING',
      message: 'export-manifest.json not found',
      field: EXPORT_MANIFEST_PATH,
    });
  }

  const manifestEntryCount = manifest?.datasets.length ?? 0;
  if (manifestPresent && manifestEntryCount < 2) {
    violations.push({
      code: 'FAIL_MANIFEST_INCOMPLETE',
      message: 'export-manifest.json must contain image and video dataset entries',
      field: EXPORT_MANIFEST_PATH,
    });
  }

  if (manifestPresent && imageValidation.sha256) {
    const imageEntry = manifest.datasets.find(
      (entry) => entry.dataset_name === IMAGE_APP_LATEST_DATASET_NAME
    );
    if (!imageEntry || imageEntry.sha256 !== imageValidation.sha256) {
      violations.push({
        code: 'FAIL_MANIFEST_SHA_MISMATCH',
        message: 'Image App manifest sha256 does not match latest file',
        field: EXPORT_MANIFEST_PATH,
      });
    }
  }

  if (manifestPresent && videoValidation.sha256) {
    const videoEntry = manifest.datasets.find(
      (entry) => entry.dataset_name === VIDEO_APP_LATEST_DATASET_NAME
    );
    if (!videoEntry || videoEntry.sha256 !== videoValidation.sha256) {
      violations.push({
        code: 'FAIL_MANIFEST_SHA_MISMATCH',
        message: 'Video App manifest sha256 does not match latest file',
        field: EXPORT_MANIFEST_PATH,
      });
    }
  }

  const latestImagePointer = loadJson<LatestDatasetPointer>(
    projectRoot,
    LATEST_IMAGE_APP_POINTER_PATH
  );
  const latestVideoPointer = loadJson<LatestDatasetPointer>(
    projectRoot,
    LATEST_VIDEO_APP_POINTER_PATH
  );

  const latestImagePointerValid = validateLatestPointer(
    latestImagePointer,
    imageValidation,
    IMAGE_APP_LATEST_DATASET_NAME
  );
  const latestVideoPointerValid = validateLatestPointer(
    latestVideoPointer,
    videoValidation,
    VIDEO_APP_LATEST_DATASET_NAME
  );

  if (!latestImagePointerValid) {
    violations.push({
      code: 'FAIL_LATEST_POINTER',
      message: 'latest-image-app.json missing or stale',
      field: LATEST_IMAGE_APP_POINTER_PATH,
    });
  }

  if (!latestVideoPointerValid) {
    violations.push({
      code: 'FAIL_LATEST_POINTER',
      message: 'latest-video-app.json missing or stale',
      field: LATEST_VIDEO_APP_POINTER_PATH,
    });
  }

  const snapshotExists = fs.existsSync(
    path.join(projectRoot, SNAPSHOTS_DIR, `PHASE-105-${IMAGE_APP_LATEST_DATASET_NAME}.json`)
  );

  const final_verdict: ExportGovernanceVerdict =
    violations.length === 0 ? 'PASS_EXPORT_GOVERNANCE_READY' : 'FAIL_EXPORT_NOT_GENERATED';

  return Object.freeze({
    auditTimestamp: new Date().toISOString(),
    final_verdict,
    governance_version: EXPORT_GOVERNANCE_VERSION,
    directory_checks: Object.freeze({
      passed: missingDirectories.length === 0,
      missing: Object.freeze(missingDirectories),
    }),
    image_app_validation: imageValidation,
    video_app_validation: videoValidation,
    manifest_present: manifestPresent,
    manifest_entry_count: manifestEntryCount,
    latest_image_app_pointer_valid: latestImagePointerValid,
    latest_video_app_pointer_valid: latestVideoPointerValid,
    migration_applied: false,
    snapshot_created: snapshotExists,
    violations: Object.freeze(violations),
  });
}

export function runExportGovernanceAudit(projectRoot: string): ExportGovernanceReport {
  const { migrationApplied, snapshotCreated } = migrateExportsToGovernance(projectRoot);
  const report = auditExportGovernance(projectRoot);
  return Object.freeze({
    ...report,
    migration_applied: migrationApplied,
    snapshot_created: snapshotCreated || report.snapshot_created,
  });
}
