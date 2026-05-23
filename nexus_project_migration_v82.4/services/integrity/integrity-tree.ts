import fs from "fs";
import path from "path";
import crypto from "crypto";

export function sanitizeContent(content: string): string {
  let sanitized = content;
  sanitized = sanitized.replace(/"secret"[ \t]*:[ \t]*"[^"]*"/gi, '"secret": "[REDACTED]"');
  sanitized = sanitized.replace(/"api_key"[ \t]*:[ \t]*"[^"]*"/gi, '"api_key": "[REDACTED]"');
  sanitized = sanitized.replace(/"token"[ \t]*:[ \t]*"[^"]*"/gi, '"token": "[REDACTED]"');
  return sanitized;
}

const INTEGRITY_WALK_SKIP_ENTRIES = Object.freeze([
  "node_modules",
  "dist",
  ".git",
  ".next",
  ".cache",
  "project_migration_integrity.json",
  "migration_integrity_manifest.json",
] as const);

export const INTEGRITY_WALK_SKIP: ReadonlySet<string> = Object.freeze(
  new Set(INTEGRITY_WALK_SKIP_ENTRIES)
);

export type IntegrityTreeEntry = { zipPath: string; content: Buffer };

export function collectIntegrityTree(
  projectRoot: string,
  options: { includeContent: boolean }
) {
  const fileList: string[] = [];
  const checksums: Record<string, string> = {};
  const zipEntries: IntegrityTreeEntry[] = [];

  function walk(currentDirPath: string, zipPathPrefix = "") {
    const gFiles = fs.readdirSync(currentDirPath).sort((a, b) => a.localeCompare(b));
    for (const file of gFiles) {
      if (INTEGRITY_WALK_SKIP.has(file)) {
        continue;
      }

      const filePath = path.join(currentDirPath, file);
      const stat = fs.statSync(filePath);
      const zipPath = zipPathPrefix ? `${zipPathPrefix}/${file}` : file;

      if (stat.isDirectory()) {
        walk(filePath, zipPath);
      } else {
        try {
          let contentBinary = fs.readFileSync(filePath);
          const isText = /\.(ts|tsx|js|jsx|json|md|css|html|example)$/i.test(file);
          if (isText) {
            let contentStr = contentBinary.toString("utf8");
            contentStr = sanitizeContent(contentStr);
            contentBinary = Buffer.from(contentStr, "utf8");
          }
          const fileHash = crypto.createHash("sha256").update(contentBinary).digest("hex");
          fileList.push(zipPath);
          checksums[zipPath] = fileHash;
          if (options.includeContent) {
            zipEntries.push({ zipPath, content: contentBinary });
          }
        } catch (err) {
          // ignore temporary lock files
        }
      }
    }
  }

  try {
    walk(projectRoot);
  } catch (err) {
    console.error("Error walking directory for integrity manifest:", err);
  }

  return { fileList, checksums, zipEntries };
}
