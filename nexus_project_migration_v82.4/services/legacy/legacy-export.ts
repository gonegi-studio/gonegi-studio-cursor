import type { Express } from "express";
import path from "path";
import fs from "fs";
import { sanitizeContent } from "../integrity/integrity-tree.ts";

export function registerLegacyExportRoutes(app: Express) {
  // API: DEVELOPER_EXPORT_MANAGER (v71.0)
  app.get("/api/developer/export", (req, res) => {
    try {
      const fileType = req.query.file as string;
      const allowedFiles: Record<string, string> = {
        "package.json": "package.json",
        "package-lock.json": "package-lock.json",
        "tsconfig.json": "tsconfig.json",
        "vite.config.ts": "vite.config.ts",
        "overrides_manifest.json": "overrides_manifest.json",
        "dependency_audit_report.json": "dependency_audit_report.json",
        "dummy-domexception/package.json": "dummy-domexception/package.json",
        "build_validation_report.json": "build_validation_report.json",
        "version_manifest_v71.json": "version_manifest_v71.json",
      };

      if (!fileType || !allowedFiles[fileType]) {
        return res.status(400).json({ error: "Invalid or unauthorized export request" });
      }

      const filePath = path.join(process.cwd(), allowedFiles[fileType]);
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        content = sanitizeContent(content);

        res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);
        res.setHeader("Content-Type", "application/json");
        return res.send(content);
      } else {
        return res.status(404).json({ error: `File ${fileType} not found` });
      }
    } catch (e) {
      console.error("Single Export Error:", e);
      return res.status(500).json({ error: "Failed to perform secure developer export" });
    }
  });

  // API Core downloads (package.json, package-lock.json, dummy-domexception/package.json)
  app.get("/api/export/system/package-json", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "package.json");
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        content = sanitizeContent(content);
        res.setHeader("Content-Disposition", "attachment; filename=\"package.json\"");
        res.setHeader("Content-Type", "application/json");
        return res.send(content);
      } else {
        return res.status(404).json({ error: "package.json not found" });
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to export package.json" });
    }
  });

  app.get("/api/export/system/package-lock", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "package-lock.json");
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        content = sanitizeContent(content);
        res.setHeader("Content-Disposition", "attachment; filename=\"package-lock.json\"");
        res.setHeader("Content-Type", "application/json");
        return res.send(content);
      } else {
        return res.status(404).json({ error: "package-lock.json not found" });
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to export package-lock.json" });
    }
  });

  app.get("/api/export/system/dummy-domexception-package", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "dummy-domexception/package.json");
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, "utf8");
        content = sanitizeContent(content);
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=\"dummy-domexception-package.json\""
        );
        res.setHeader("Content-Type", "application/json");
        return res.send(content);
      } else {
        return res.status(404).json({ error: "dummy-domexception/package.json not found" });
      }
    } catch (e) {
      return res.status(500).json({ error: "Failed to export dummy-domexception package config" });
    }
  });
}
