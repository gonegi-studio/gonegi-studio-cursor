import { sortIntegrityChecksums } from "./checksum-ordering.ts";

/** PR-03a: export-only ZIP determinism lock */
const EXPORT_ZIP_FIXED_MTIME_ISO = "2026-05-23T13:04:11.787Z";
export const EXPORT_ZIP_FIXED_MTIME = Object.freeze(new Date(EXPORT_ZIP_FIXED_MTIME_ISO));
export const EXPORT_DETERMINISTIC_GENERATED_AT: Readonly<Record<string, string>> = Object.freeze({
  "EXPORT-v82.4": EXPORT_ZIP_FIXED_MTIME_ISO,
});

export function buildExportManifestSnapshot<
  T extends {
    export_version: string;
    generated_at: string;
    checksums: Record<string, string>;
  },
>(raw: T) {
  return {
    ...raw,
    checksums: sortIntegrityChecksums(raw.checksums),
    generated_at:
      EXPORT_DETERMINISTIC_GENERATED_AT[raw.export_version] ?? raw.generated_at,
  };
}
