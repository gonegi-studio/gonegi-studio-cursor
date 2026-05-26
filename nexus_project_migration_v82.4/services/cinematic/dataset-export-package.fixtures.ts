import { DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE } from "./dataset-lock-manifest.fixtures.ts";
import {
  buildDatasetExportPackage,
  computeDatasetExportPackageFingerprint,
} from "./dataset-export-package.ts";

export const DATASET_EXPORT_PACKAGE_INPUT_EXAMPLE = DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE;

export const DATASET_EXPORT_PACKAGE_OUTPUT_EXAMPLE = buildDatasetExportPackage(
  DATASET_EXPORT_PACKAGE_INPUT_EXAMPLE
);

export const DATASET_EXPORT_PACKAGE_FINGERPRINT = computeDatasetExportPackageFingerprint(
  DATASET_EXPORT_PACKAGE_OUTPUT_EXAMPLE
);

export const DATASET_EXPORT_PACKAGE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  datasetLayerKind: "frame-export" as const,
  lockStatus: "locked-ready" as const,
});

export const DATASET_EXPORT_PACKAGE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  packageId: "dataset-export-package-gonegi-harbor-25s-v1",
  exportPackageVersion: "dataset-export-package-v1" as const,
  activeExportPackageState: "25s-dataset-export-package-metadata-only",
  totalPackageItemCount: 6,
});
