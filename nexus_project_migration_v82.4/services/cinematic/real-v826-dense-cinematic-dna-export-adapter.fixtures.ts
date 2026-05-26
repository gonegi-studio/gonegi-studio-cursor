import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealV826DenseCinematicDnaExportAdapter,
  buildRealV826DenseCinematicDnaExportDownload,
  computeRealV826DenseCinematicDnaExportAdapterFingerprint,
} from "./real-v826-dense-cinematic-dna-export-adapter.ts";

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ADAPTER_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE =
  buildRealV826DenseCinematicDnaExportAdapter(
    REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ADAPTER_INPUT_EXAMPLE.realImageAppInputPackage
  );

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT =
  computeRealV826DenseCinematicDnaExportAdapterFingerprint(
    REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE
  );

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE =
  buildRealV826DenseCinematicDnaExportDownload();

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_RECORD_OUTPUT_EXAMPLE = Object.freeze({
  schema_version: "v82.6" as const,
  category: "ESTABLISH",
  source_material: "Kiki's Delivery Service(FHD)_25s.mp4",
  visualAtomCount: 3,
  relationshipGraphCount: 4,
});

export const REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  filename: REAL_V826_DENSE_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE.filename,
  itemCount: 3,
  schemaVersion: "v82.6" as const,
});
