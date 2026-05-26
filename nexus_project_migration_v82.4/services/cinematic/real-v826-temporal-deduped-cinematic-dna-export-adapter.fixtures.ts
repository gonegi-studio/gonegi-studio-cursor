import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealV826TemporalDedupedCinematicDnaExportAdapter,
  buildRealV826TemporalDedupedCinematicDnaExportDownload,
  computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint,
  countTemporalDedupedMotionEdges,
  countTemporalDedupedSequenceEdges,
} from "./real-v826-temporal-deduped-cinematic-dna-export-adapter.ts";

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE =
  buildRealV826TemporalDedupedCinematicDnaExportAdapter(
    REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_INPUT_EXAMPLE.realImageAppInputPackage
  );

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_FINGERPRINT =
  computeRealV826TemporalDedupedCinematicDnaExportAdapterFingerprint(
    REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE
  );

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE =
  buildRealV826TemporalDedupedCinematicDnaExportDownload();

export const REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  filename: REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_DOWNLOAD_OUTPUT_EXAMPLE.filename,
  itemCount: 3,
  schemaVersion: "v82.6" as const,
  totalSequenceEdgeCount: countTemporalDedupedSequenceEdges(
    REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE
  ),
  totalTemporalMotionEdgeCount: countTemporalDedupedMotionEdges(
    REAL_V826_TEMPORAL_DEDUPED_CINEMATIC_DNA_EXPORT_ADAPTER_OUTPUT_EXAMPLE
  ),
});
