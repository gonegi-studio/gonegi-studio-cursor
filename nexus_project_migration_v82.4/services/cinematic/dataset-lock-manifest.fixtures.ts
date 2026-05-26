import { DATASET_READINESS_BINDING_OUTPUT_EXAMPLE } from "./dataset-readiness-binding.fixtures.ts";
import {
  buildDatasetLockManifest,
  computeDatasetLockManifestFingerprint,
} from "./dataset-lock-manifest.ts";

export const DATASET_LOCK_MANIFEST_INPUT_EXAMPLE = DATASET_READINESS_BINDING_OUTPUT_EXAMPLE;

export const DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE = buildDatasetLockManifest(
  DATASET_LOCK_MANIFEST_INPUT_EXAMPLE
);

export const DATASET_LOCK_MANIFEST_FINGERPRINT = computeDatasetLockManifestFingerprint(
  DATASET_LOCK_MANIFEST_OUTPUT_EXAMPLE
);

export const DATASET_LOCK_MANIFEST_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  datasetLayerKind: "frame-export" as const,
  lockStatus: "locked-ready" as const,
});

export const DATASET_LOCK_MANIFEST_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  manifestId: "dataset-lock-manifest-gonegi-harbor-25s-v1",
  lockManifestVersion: "dataset-lock-manifest-v1" as const,
  activeLockManifestState: "25s-dataset-lock-manifest-metadata-only",
  lockStatus: "locked-ready" as const,
  totalLockItemCount: 6,
});
