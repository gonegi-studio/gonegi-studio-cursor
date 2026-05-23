import fs from "fs";
import path from "path";
import { sortIntegrityChecksums } from "../deterministic/checksum-ordering.ts";

const REQUIRED_FILES = [
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "server.ts",
  "types.ts",
  "App.tsx",
  "index.tsx",
  "index.html",
  "README_MIGRATION.md",
];

const EXTRA_FILES_TO_AUDIT = [
  "assets/goldenSetImages.ts",
  "components/features/lab/scripts/apply_v62.cjs",
  "services/jobSimulator.ts",
  "services/qualityService.ts",
];

const FOLDERS_TO_CHECK = [
  "components",
  "services",
  "utils",
  "config",
  "data",
  "storage",
  "assets",
  "server",
  "hooks",
  "scripts",
];

export function assembleIntegrityManifest(
  projectRoot: string,
  fileList: string[],
  checksums: Record<string, string>
) {
  const missing_required_files: string[] = [];
  const empty_files: string[] = [];
  const critical_empty_files: string[] = [];
  const placeholder_files: string[] = [];

  for (const relPath of REQUIRED_FILES) {
    const fullPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      missing_required_files.push(relPath);
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        empty_files.push(relPath);
        critical_empty_files.push(relPath);
      }
      const content = fs.readFileSync(fullPath, "utf8").trim();
      const lowercaseContent = content.toLowerCase();
      if (
        content.length < 20 ||
        lowercaseContent === "todo" ||
        lowercaseContent.includes("placeholder content here")
      ) {
        placeholder_files.push(relPath);
      }
    }
  }

  for (const extraPath of EXTRA_FILES_TO_AUDIT) {
    const fullPath = path.join(projectRoot, extraPath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        if (!empty_files.includes(extraPath)) {
          empty_files.push(extraPath);
        }
      }
    }
  }

  const folder_presence_check: Record<string, boolean> = {};
  for (const folder of FOLDERS_TO_CHECK) {
    folder_presence_check[folder] =
      fs.existsSync(path.join(projectRoot, folder)) ||
      fs.existsSync(path.join(projectRoot, "src", folder));
  }

  const required_files_check = missing_required_files.length === 0;
  const migration_ready = required_files_check && critical_empty_files.length === 0;
  const cursor_ready = migration_ready;

  const manifest = {
    app_version: "v82.4",
    export_version: "EXPORT-v82.4",
    generated_at: new Date().toISOString(),
    migration_complete: migration_ready,
    migration_ready,
    required_files_check,
    missing_required_files,
    empty_files,
    critical_empty_files,
    folder_presence_check,
    cursor_ready,
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
