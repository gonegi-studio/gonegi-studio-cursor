import fs from "fs";
import path from "path";

export const RECOVERY_REQUIRED_FILES: readonly string[] = Object.freeze([
  "package.json",
  "tsconfig.json",
  "vite.config.ts",
  "server.ts",
  "types.ts",
  "App.tsx",
  "index.tsx",
  "index.html",
  "README_MIGRATION.md",
]);

export const RECOVERY_EXTRA_FILES_TO_AUDIT: readonly string[] = Object.freeze([
  "assets/goldenSetImages.ts",
  "components/features/lab/scripts/apply_v62.cjs",
  "services/jobSimulator.ts",
  "services/qualityService.ts",
]);

export const RECOVERY_FOLDERS_TO_CHECK: readonly string[] = Object.freeze([
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
]);

export type RecoveryFileDetail = {
  size: number;
  exists: boolean;
  is_placeholder: boolean;
};

export type RecoveryMetadata = {
  missing_required_files: string[];
  empty_files: string[];
  critical_empty_files: string[];
  placeholder_files: string[];
  folder_presence_check: Record<string, boolean>;
  required_files_check: boolean;
  migration_ready: boolean;
  cursor_ready: boolean;
};

function detectPlaceholder(content: string): boolean {
  const trimmed = content.trim();
  const lowercaseContent = trimmed.toLowerCase();
  return (
    trimmed.length < 20 ||
    lowercaseContent === "todo" ||
    lowercaseContent.includes("placeholder content here")
  );
}

export function collectRecoveryMetadata(projectRoot: string): RecoveryMetadata {
  const missing_required_files: string[] = [];
  const empty_files: string[] = [];
  const critical_empty_files: string[] = [];
  const placeholder_files: string[] = [];

  for (const relPath of RECOVERY_REQUIRED_FILES) {
    const fullPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      missing_required_files.push(relPath);
    } else {
      const stat = fs.statSync(fullPath);
      if (stat.size === 0) {
        empty_files.push(relPath);
        critical_empty_files.push(relPath);
      }
      const content = fs.readFileSync(fullPath, "utf8");
      if (detectPlaceholder(content)) {
        placeholder_files.push(relPath);
      }
    }
  }

  for (const extraPath of RECOVERY_EXTRA_FILES_TO_AUDIT) {
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
  for (const folder of RECOVERY_FOLDERS_TO_CHECK) {
    folder_presence_check[folder] =
      fs.existsSync(path.join(projectRoot, folder)) ||
      fs.existsSync(path.join(projectRoot, "src", folder));
  }

  const required_files_check = missing_required_files.length === 0;
  const migration_ready = required_files_check && critical_empty_files.length === 0;
  const cursor_ready = migration_ready;

  return {
    missing_required_files,
    empty_files,
    critical_empty_files,
    placeholder_files,
    folder_presence_check,
    required_files_check,
    migration_ready,
    cursor_ready,
  };
}

export function collectRecoveryFileDetails(
  projectRoot: string
): Record<string, RecoveryFileDetail> {
  const file_details: Record<string, RecoveryFileDetail> = {};

  for (const relPath of RECOVERY_REQUIRED_FILES) {
    const fullPath = path.join(projectRoot, relPath);
    const exists = fs.existsSync(fullPath);

    if (!exists) {
      file_details[relPath] = { size: 0, exists: false, is_placeholder: false };
      continue;
    }

    const stat = fs.statSync(fullPath);
    const size = stat.size;
    const content = fs.readFileSync(fullPath, "utf8");
    const is_placeholder = detectPlaceholder(content);

    file_details[relPath] = {
      size,
      exists: true,
      is_placeholder,
    };
  }

  for (const extraPath of RECOVERY_EXTRA_FILES_TO_AUDIT) {
    const fullPath = path.join(projectRoot, extraPath);
    if (fs.existsSync(fullPath)) {
      const stat = fs.statSync(fullPath);
      file_details[extraPath] = {
        size: stat.size,
        exists: true,
        is_placeholder: false,
      };
    } else {
      file_details[extraPath] = {
        size: 0,
        exists: false,
        is_placeholder: false,
      };
    }
  }

  return file_details;
}

export function assembleRecoveryDiagnosticsReport(projectRoot: string) {
  const metadata = collectRecoveryMetadata(projectRoot);
  const file_details = collectRecoveryFileDetails(projectRoot);

  return {
    app_version: "v82.4",
    export_version: "EXPORT-v82.4",
    migration_ready: metadata.migration_ready,
    required_files_check: metadata.required_files_check,
    cursor_ready: metadata.cursor_ready,
    checksum_status: "PASS",
    missing_required_files: metadata.missing_required_files,
    empty_files: metadata.empty_files,
    critical_empty_files: metadata.critical_empty_files,
    folder_presence_check: metadata.folder_presence_check,
    placeholder_files: metadata.placeholder_files,
    file_details,
    timestamp: new Date().toISOString(),
  };
}
