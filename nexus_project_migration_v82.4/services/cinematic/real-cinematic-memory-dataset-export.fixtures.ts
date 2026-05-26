import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import { REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE } from "./real-cinematic-memory-continuity.fixtures.ts";
import { REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_FINGERPRINT } from "./real-temporal-deduped-completion-snapshot.fixtures.ts";
import {
  buildRealCinematicMemoryDatasetExportDownload,
  buildRealCinematicMemoryDatasetExportFromPackage,
  buildRealCinematicMemoryDatasetExportFromSnapshot,
  computeRealCinematicMemoryDatasetExportFingerprint,
} from "./real-cinematic-memory-dataset-export.ts";

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
  continuitySnapshot: REAL_CINEMATIC_MEMORY_CONTINUITY_OUTPUT_EXAMPLE,
  completionSnapshotFingerprint: REAL_TEMPORAL_DEDUPED_COMPLETION_SNAPSHOT_FINGERPRINT,
});

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE =
  buildRealCinematicMemoryDatasetExportFromSnapshot(
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_INPUT_EXAMPLE.continuitySnapshot,
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_INPUT_EXAMPLE.realImageAppInputPackage
  );

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_PACKAGE_OUTPUT_EXAMPLE =
  buildRealCinematicMemoryDatasetExportFromPackage(
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_INPUT_EXAMPLE.realImageAppInputPackage,
    {
      completionSnapshotFingerprint:
        REAL_CINEMATIC_MEMORY_DATASET_EXPORT_INPUT_EXAMPLE.completionSnapshotFingerprint,
    }
  );

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE =
  buildRealCinematicMemoryDatasetExportDownload();

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_FINGERPRINT =
  computeRealCinematicMemoryDatasetExportFingerprint(
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE
  );

export const REAL_CINEMATIC_MEMORY_DATASET_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  filename: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE.filename,
  frameCount: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE.frameCount,
  continuityMemoryScore: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE.continuityMemoryScore,
  schemaVersion: REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE.schemaVersion,
  imageAppBindingItemCount:
    REAL_CINEMATIC_MEMORY_DATASET_EXPORT_OUTPUT_EXAMPLE.imageAppBinding.itemCount,
});
