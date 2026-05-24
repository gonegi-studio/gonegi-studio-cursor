import type { Express, Response } from "express";
import path from "path";
import fs from "fs";
import { sanitizeContent } from "../integrity/integrity-tree.ts";

const ALLOWED_DEVELOPER_EXPORT_FILES: Readonly<Record<string, string>> = Object.freeze({
  "package.json": "package.json",
  "package-lock.json": "package-lock.json",
  "tsconfig.json": "tsconfig.json",
  "vite.config.ts": "vite.config.ts",
  "overrides_manifest.json": "overrides_manifest.json",
  "dependency_audit_report.json": "dependency_audit_report.json",
  "dummy-domexception/package.json": "dummy-domexception/package.json",
  "build_validation_report.json": "build_validation_report.json",
  "version_manifest_v71.json": "version_manifest_v71.json",
});

const SYSTEM_EXPORT_PROXY_TARGETS: Readonly<Record<string, string>> = Object.freeze({
  "/api/export/system/package-json": "package.json",
  "/api/export/system/package-lock": "package-lock.json",
  "/api/export/system/dummy-domexception-package": "dummy-domexception/package.json",
});

function sendDeveloperExportFile(
  res: Response,
  fileType: string,
  allowedFiles: Readonly<Record<string, string>>
) {
  const relPath = allowedFiles[fileType];
  const filePath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `File ${fileType} not found` });
  }

  let content = fs.readFileSync(filePath, "utf8");
  content = sanitizeContent(content);

  res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
  res.setHeader("Content-Type", "application/json");
  return res.send(content);
}

export function registerLegacyExportRoutes(app: Express) {
  app.get("/api/developer/export", (req, res) => {
    try {
      const fileType = req.query.file as string;

      if (!fileType || !ALLOWED_DEVELOPER_EXPORT_FILES[fileType]) {
        return res.status(400).json({ error: "Invalid or unauthorized export request" });
      }

      return sendDeveloperExportFile(res, fileType, ALLOWED_DEVELOPER_EXPORT_FILES);
    } catch (e) {
      console.error("Single Export Error:", e);
      return res.status(500).json({ error: "Failed to perform secure developer export" });
    }
  });

  for (const [route, fileType] of Object.entries(SYSTEM_EXPORT_PROXY_TARGETS)) {
    app.get(route, (req, res) => {
      res.redirect(
        307,
        `/api/developer/export?file=${encodeURIComponent(fileType)}`
      );
    });
  }
}
