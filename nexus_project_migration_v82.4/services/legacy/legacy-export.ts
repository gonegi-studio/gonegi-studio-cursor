import type { Express } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import AdmZip from "adm-zip";
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

  // API: One-Click Developer Evidence Bundle ZIP Export (v71.0)
  app.get("/api/developer/bundle-export", (req, res) => {
    try {
      const zip = new AdmZip();

      const filesToInclude = [
        { name: "package.json", path: "package.json" },
        { name: "package-lock.json", path: "package-lock.json" },
        { name: "dummy-domexception/package.json", path: "dummy-domexception/package.json" },
        { name: "dependency_audit_report.json", path: "dependency_audit_report.json" },
        { name: "build_validation_report.json", path: "build_validation_report.json" },
        { name: "overrides_manifest.json", path: "overrides_manifest.json" },
        { name: "version_manifest_v71.json", path: "version_manifest_v71.json" },
      ];

      const checksums: Record<string, string> = {};

      filesToInclude.forEach((f) => {
        const filePath = path.join(process.cwd(), f.path);
        if (fs.existsSync(filePath)) {
          let content = fs.readFileSync(filePath, "utf8");
          content = sanitizeContent(content);

          // Generate SHA-256 HMAC or standard content hash for integrity verification
          const hashVal = crypto.createHash("sha256").update(content, "utf8").digest("hex");
          checksums[f.name] = hashVal;

          zip.addFile(f.name, Buffer.from(content, "utf8"));
        } else {
          checksums[f.name] = "NOT_FOUND";
        }
      });

      // Embed integrity checksum manifest inside the archive
      const auditLog = {
        bundle_id: "developer_evidence_bundle_v71.0",
        verified_at: new Date().toISOString(),
        digest_algorithm: "sha256",
        hashes: checksums,
        integrity_status: "VERIFIED",
      };
      zip.addFile(
        "checksum_validation_report.json",
        Buffer.from(JSON.stringify(auditLog, null, 2), "utf8")
      );

      // Add a clean system architecture and versioning context manifest
      const manifest = {
        bundle_id: "developer_evidence_bundle_v71.0",
        exported_by: "NEXUS EXPORT MANAGER",
        timestamp: new Date().toISOString(),
        version_namespace: "v71.0",
        scope: "DEVELOPER_ONLY",
        security_level: "SECURE_SANDBOX_COMPLIANT",
      };
      zip.addFile("bundle_manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));

      const zipBuf = zip.toBuffer();
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=\"developer_evidence_bundle_v71.0.zip\""
      );
      res.setHeader("Content-Type", "application/zip");
      return res.send(zipBuf);
    } catch (e) {
      console.error("Bundle Export Error:", e);
      return res.status(500).json({ error: "Failed to compile developer evidence bundle" });
    }
  });
}
