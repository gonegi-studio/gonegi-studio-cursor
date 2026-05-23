import { sortIntegrityChecksums } from "./checksum-ordering.ts";

/** PR-03a: export-only ZIP determinism lock */
export const EXPORT_ZIP_FIXED_MTIME = new Date("2026-05-23T13:04:11.787Z");
export const EXPORT_DETERMINISTIC_GENERATED_AT: Record<string, string> = {
  "EXPORT-v82.4": "2026-05-23T13:04:11.787Z",
};

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
