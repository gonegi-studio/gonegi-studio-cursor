import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import {
  buildExportManifestSnapshot,
  EXPORT_ZIP_FIXED_MTIME,
} from "../deterministic/zip-determinism.ts";
import { collectIntegrityTree } from "./integrity-tree.ts";
import { assembleIntegrityManifest } from "./integrity-manifest.ts";
import type { IntegrityCacheService } from "./integrity-cache.ts";

export function addExportZipEntry(zip: AdmZip, entryName: string, content: Buffer) {
  const entry = zip.addFile(entryName, content);
  entry.header.time = EXPORT_ZIP_FIXED_MTIME;
  return entry;
}

export function createIntegrityExportService(
  projectRoot: string,
  integrityCache: Pick<IntegrityCacheService, "updateIntegrityCache">
) {
  function buildDeterministicExportSnapshot() {
    const { fileList, checksums, zipEntries } = collectIntegrityTree(projectRoot, {
      includeContent: true,
    });
    const rawManifest = assembleIntegrityManifest(projectRoot, fileList, checksums);
    integrityCache.updateIntegrityCache(rawManifest);
    const exportManifest = buildExportManifestSnapshot(rawManifest);
    const manifestPayload = JSON.stringify(exportManifest, null, 2);
    zipEntries.sort((a, b) => a.zipPath.localeCompare(b.zipPath));
    return { exportManifest, manifestPayload, zipEntries };
  }

  function buildProjectMigrationZipBuffer(): Buffer {
    const zip = new AdmZip();
    const { manifestPayload, zipEntries } = buildDeterministicExportSnapshot();

    for (const { zipPath, content } of zipEntries) {
      addExportZipEntry(zip, zipPath, content);
    }

    addExportZipEntry(
      zip,
      "migration_integrity_manifest.json",
      Buffer.from(manifestPayload, "utf8")
    );
    addExportZipEntry(
      zip,
      "project_migration_integrity.json",
      Buffer.from(manifestPayload, "utf8")
    );

    const readmePath = path.join(projectRoot, "README_MIGRATION.md");
    if (fs.existsSync(readmePath)) {
      addExportZipEntry(zip, "README_MIGRATION.md", fs.readFileSync(readmePath));
    }

    return zip.toBuffer();
  }

  return {
    buildDeterministicExportSnapshot,
    buildProjectMigrationZipBuffer,
  };
}

export type IntegrityExportService = ReturnType<typeof createIntegrityExportService>;
