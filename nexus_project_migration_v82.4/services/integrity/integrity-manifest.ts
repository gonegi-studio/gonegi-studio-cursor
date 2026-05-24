import { sortIntegrityChecksums } from "../deterministic/checksum-ordering.ts";
import { collectRecoveryMetadata } from "./integrity-diagnostics.ts";

export function assembleIntegrityManifest(
  projectRoot: string,
  fileList: string[],
  checksums: Record<string, string>
) {
  const metadata = collectRecoveryMetadata(projectRoot);

  const manifest = {
    app_version: "v82.4",
    export_version: "EXPORT-v82.4",
    generated_at: new Date().toISOString(),
    migration_complete: metadata.migration_ready,
    migration_ready: metadata.migration_ready,
    required_files_check: metadata.required_files_check,
    missing_required_files: metadata.missing_required_files,
    empty_files: metadata.empty_files,
    critical_empty_files: metadata.critical_empty_files,
    folder_presence_check: metadata.folder_presence_check,
    cursor_ready: metadata.cursor_ready,
    file_count: fileList.length + 1,
    files: [...fileList, "migration_integrity_manifest.json"].sort(),
    checksums: sortIntegrityChecksums({
      ...checksums,
      "migration_integrity_manifest.json": "computed-at-runtime-self-referencing",
    }),
  };
  return manifest;
}

export type IntegrityManifest = ReturnType<typeof assembleIntegrityManifest>;
