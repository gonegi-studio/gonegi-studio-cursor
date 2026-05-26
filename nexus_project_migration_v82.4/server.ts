import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import {
  collectIntegrityTree,
} from "./services/integrity/integrity-tree.ts";
import {
  assembleIntegrityManifest,
} from "./services/integrity/integrity-manifest.ts";
import { createIntegrityCacheService } from "./services/integrity/integrity-cache.ts";
import { createIntegrityExportService } from "./services/integrity/integrity-export.ts";
import { registerLegacyExportRoutes } from "./services/legacy/legacy-export.ts";
import { assembleRecoveryDiagnosticsReport } from "./services/integrity/integrity-diagnostics.ts";
import { registerApiBoundaryGuard } from "./services/runtime/api-boundary.ts";
import { buildCinematicDatasetPreview } from "./services/cinematic/cinematic-preview.ts";
import { buildStoryboardPreview } from "./services/cinematic/storyboard-preview.ts";
import { serializePipelinePreview } from "./services/cinematic/pipeline-serializer.ts";
import { buildMusicDramaPreview } from "./services/cinematic/music-drama-preview.ts";
import { buildGenerationJobManifestPreview } from "./services/cinematic/generation-job-manifest-preview.ts";
import { buildPilotIntakePreview } from "./services/cinematic/pilot-intake-schema.ts";
import { buildRendererHandoffPreview } from "./services/cinematic/renderer-handoff-export.ts";
import { buildDatasetExportPreview } from "./services/cinematic/dataset-export-package.ts";
import { buildImageAppFinalInputPreview } from "./services/cinematic/image-app-final-input-package.ts";
import { buildRealImageAppInputPreview } from "./services/cinematic/real-image-app-input-package.ts";
import { buildRealImageAppJsonFileDownload } from "./services/cinematic/real-image-app-json-file-export.ts";
import { buildRealV826CinematicDnaExportDownload } from "./services/cinematic/real-v826-cinematic-dna-export-adapter.ts";
import { buildRealV826DenseCinematicDnaExportDownload } from "./services/cinematic/real-v826-dense-cinematic-dna-export-adapter.ts";
import { buildRegenerationImageAppInputPreview } from "./services/cinematic/regeneration-image-app-input.ts";
import { buildReferenceConditionedImageInputPreview } from "./services/cinematic/reference-conditioned-image-input.ts";
import { buildImageTestBatchPreview } from "./services/cinematic/image-test-batch-export.ts";
import { buildGeneratorAdapterPreview } from "./services/cinematic/generator-adapter-preview.ts";
import { buildScenePromptExportPreview } from "./services/cinematic/scene-prompt-export-preview.ts";
import { runWithRuntimeReadonlyGuard } from "./services/runtime/runtime-guard.ts";
import { registerVisualQaDashboardPreviewRoute } from "./app/api/image-generation/visual-qa-dashboard-preview/route.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  /** PR-02: manifest authority root (= nexus package dir, not process.cwd()) */
  const INTEGRITY_PROJECT_ROOT = path.dirname(fileURLToPath(import.meta.url));
  const CANONICAL_MANIFEST_PATH = path.join(
    INTEGRITY_PROJECT_ROOT,
    "migration_integrity_manifest.json"
  );
  const PROJECT_MIRROR_PATH = path.join(
    INTEGRITY_PROJECT_ROOT,
    "project_migration_integrity.json"
  );
  const ROOT_MIRROR_PATH = path.join(
    INTEGRITY_PROJECT_ROOT,
    "..",
    "migration_integrity_manifest.json"
  );

  // [지중해 연대기] 물리적 격리 저장소 설정
  const LOCAL_VAULT_DIR = path.join(process.cwd(), "storage/local_vault"); // 제조 비법 격리 구역
  const CLOUD_STORAGE_DIR = path.join(process.cwd(), "storage/cloud");    // 클라우드 배포 시뮬레이션 구역
  const MASTER_ARCHIVE_DIR = path.join(process.cwd(), "storage/master_archive");

  [LOCAL_VAULT_DIR, CLOUD_STORAGE_DIR, MASTER_ARCHIVE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ [지중해 연대기] 저장소 생성: ${dir}`);
    }
  });

  app.use(cors());
  app.use(express.json({ limit: "100mb" }));

  // API: 마스터 아카이브 승격
  app.post("/api/promote-master", (req, res) => {
    try {
      const { hashId } = req.body;
      const sourcePath = path.join(LOCAL_VAULT_DIR, `${hashId}_recipe.json`);
      const destPath = path.join(MASTER_ARCHIVE_DIR, `${hashId}_master.json`);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`🌟 Master Archived: ${hashId}`);
        res.json({ success: true, path: destPath });
      } else {
        res.status(404).json({ error: "Recipe not found in Vault" });
      }
    } catch (error) {
      console.error("Master Archive Error:", error);
      res.status(500).json({ error: "Failed to archive master" });
    }
  });

  // API: [The Recipe] 로컬 격리 저장
  app.post("/api/save-recipe", (req, res) => {
    try {
      const { hashId, recipeData } = req.body;
      if (!hashId || !recipeData) return res.status(400).json({ error: "Missing data" });

      const filePath = path.join(LOCAL_VAULT_DIR, `${hashId}_recipe.json`);
      fs.writeFileSync(filePath, JSON.stringify(recipeData, null, 2));
      
      console.log(`🔒 [Local Vault] Recipe Secured: ${hashId}`);
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error("Recipe Save Error:", error);
      res.status(500).json({ error: "Failed to secure recipe in Vault" });
    }
  });

  // API: [The Assembler] 클라우드 배포용 메타데이터 저장
  app.post("/api/save-asm", (req, res) => {
    try {
      const { hashId, asmData } = req.body;
      if (!hashId || !asmData) return res.status(400).json({ error: "Missing data" });

      const filePath = path.join(CLOUD_STORAGE_DIR, `${hashId}_asm.json`);
      fs.writeFileSync(filePath, JSON.stringify(asmData, null, 2));
      
      console.log(`☁️ [Cloud Storage] ASM Deployed: ${hashId}`);
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error("ASM Save Error:", error);
      res.status(500).json({ error: "Failed to deploy ASM to Cloud" });
    }
  });

  // API: 비디오 파일 저장 (클라우드 배포)
  app.post("/api/save-video", (req, res) => {
    try {
      const { hashId, videoBase64 } = req.body;
      if (!hashId || !videoBase64) return res.status(400).json({ error: "Missing data" });

      const buffer = Buffer.from(videoBase64, "base64");
      const filePath = path.join(CLOUD_STORAGE_DIR, `${hashId}.mp4`);
      fs.writeFileSync(filePath, buffer);
      
      console.log(`🎬 [Cloud Storage] Video Deployed: ${hashId}`);
      res.json({ success: true, path: filePath });
    } catch (error) {
      console.error("Video Save Error:", error);
      res.status(500).json({ error: "Failed to deploy video to Cloud" });
    }
  });

  const SETTINGS_FILE = path.join(process.cwd(), "storage/system_settings.json");

  // API: Get setting
  app.get("/api/settings/:key", (req, res) => {
    try {
      const key = req.params.key;
      let settings: Record<string, any> = {};
      if (fs.existsSync(SETTINGS_FILE)) {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      }
      res.json({ value: settings[key] !== undefined ? settings[key] : null });
    } catch (e) {
      console.error("Get settings error:", e);
      res.json({ value: null });
    }
  });

  // API: Set setting
  app.post("/api/settings", (req, res) => {
    try {
      const { key, value } = req.body;
      let settings: Record<string, any> = {};
      if (fs.existsSync(SETTINGS_FILE)) {
        settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      }
      settings[key] = value;
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
      res.json({ success: true });
    } catch (e) {
      console.error("Save settings error:", e);
      res.status(500).json({ error: "Failed to save settings to server" });
    }
  });

  function getIntegrityManifest() {
    const { fileList, checksums } = collectIntegrityTree(INTEGRITY_PROJECT_ROOT, {
      includeContent: false,
    });
    return assembleIntegrityManifest(INTEGRITY_PROJECT_ROOT, fileList, checksums);
  }

  const integrityCache = createIntegrityCacheService(
    {
      canonical: CANONICAL_MANIFEST_PATH,
      projectMirror: PROJECT_MIRROR_PATH,
      rootMirror: ROOT_MIRROR_PATH,
    },
    getIntegrityManifest
  );

  const integrityExport = createIntegrityExportService(INTEGRITY_PROJECT_ROOT, integrityCache);

  try {
    integrityCache.initializeIntegrityCacheOnStartup();
  } catch (err) {
    console.error("Failed to initialize migration_integrity_manifest.json physically:", err);
  }

  registerLegacyExportRoutes(app);

  // API: One-Click Full Project Migration Export (v82.4)
  app.get("/api/developer/project-export", (req, res) => {
    try {
      const zipBuf = integrityExport.buildProjectMigrationZipBuffer();
      res.setHeader("Content-Disposition", "attachment; filename=\"nexus_project_migration_v82.4.zip\"");
      res.setHeader("Content-Type", "application/zip");
      return res.send(zipBuf);
    } catch (e) {
      console.error("Project Export Error:", e);
      return res.status(500).json({ error: "Failed to compile full project migration bundle" });
    }
  });

  // API: Download README_MIGRATION.md directly
  app.get("/api/developer/readme-export", (req, res) => {
    try {
      const readmePath = path.join(INTEGRITY_PROJECT_ROOT, "README_MIGRATION.md");
      if (fs.existsSync(readmePath)) {
        res.setHeader("Content-Disposition", "attachment; filename=\"README_MIGRATION.md\"");
        res.setHeader("Content-Type", "text/markdown");
        return res.sendFile(readmePath);
      } else {
        return res.status(404).json({ error: "README_MIGRATION.md not found" });
      }
    } catch (e) {
      console.error("README Export Error:", e);
      return res.status(500).json({ error: "Failed to read README_MIGRATION.md" });
    }
  });

  // API: Download migration_integrity_manifest.json directly
  app.get("/api/developer/integrity-manifest", (req, res) => {
    try {
      const force = req.query.refresh === "1";
      const manifest = integrityCache.ensureIntegrityManifest({ force });
      res.setHeader("Content-Disposition", "attachment; filename=\"migration_integrity_manifest.json\"");
      res.setHeader("Content-Type", "application/json");
      return res.send(JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error("Integrity Manifest Export Error:", e);
      return res.status(500).json({ error: "Failed to generate migration_integrity_manifest.json" });
    }
  });

  // API: Get Deep Project Recovery & Pipeline Diagnostics (v82.4)
  app.get("/api/developer/recovery-diagnostics", (req, res) => {
    try {
      return res.json(assembleRecoveryDiagnosticsReport(INTEGRITY_PROJECT_ROOT));
    } catch (e: any) {
      console.error("Recovery Diagnostics Error:", e);
      return res.status(500).json({
        error: "Failed to compile runtime recovery diagnostics report",
        message: e.message,
      });
    }
  });

  // API: Cinematic dataset preview (Phase-2E readonly fixture pipeline)
  app.get("/api/cinematic/dataset-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildCinematicDatasetPreview()));
    } catch (e) {
      console.error("Cinematic Dataset Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic dataset preview" });
    }
  });

  // API: Cinematic storyboard preview (Phase-3B readonly fixture pipeline)
  app.get("/api/cinematic/storyboard-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildStoryboardPreview()));
    } catch (e) {
      console.error("Cinematic Storyboard Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic storyboard preview" });
    }
  });

  // API: Unified cinematic pipeline preview (Phase-3C readonly fixture orchestration)
  app.get("/api/cinematic/pipeline-preview", (req, res) => {
    try {
      const payload = runWithRuntimeReadonlyGuard(() => serializePipelinePreview());
      res.setHeader("Content-Type", "application/json");
      return res.send(payload);
    } catch (e) {
      console.error("Cinematic Pipeline Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic pipeline preview" });
    }
  });

  // API: Unified music drama preview (Phase-4E readonly MV/Drama orchestration)
  app.get("/api/cinematic/music-drama-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildMusicDramaPreview()));
    } catch (e) {
      console.error("Cinematic Music Drama Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic music drama preview" });
    }
  });

  // API: Scene prompt export preview (Phase-5B readonly generator-ready orchestration)
  app.get("/api/cinematic/scene-prompt-export-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildScenePromptExportPreview()));
    } catch (e) {
      console.error("Cinematic Scene Prompt Export Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic scene prompt export preview" });
    }
  });

  // API: Generator adapter preview (Phase-6B readonly provider-neutral orchestration)
  app.get("/api/cinematic/generator-adapter-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildGeneratorAdapterPreview()));
    } catch (e) {
      console.error("Cinematic Generator Adapter Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic generator adapter preview" });
    }
  });

  // API: Generation job manifest preview (Phase-7B readonly execution-ready orchestration)
  app.get("/api/cinematic/generation-job-manifest-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildGenerationJobManifestPreview()));
    } catch (e) {
      console.error("Cinematic Generation Job Manifest Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic generation job manifest preview" });
    }
  });

  // API: Pilot intake preview (Phase-77B readonly 25s pilot manifest orchestration)
  app.get("/api/cinematic/pilot-intake-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildPilotIntakePreview()));
    } catch (e) {
      console.error("Cinematic Pilot Intake Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic pilot intake preview" });
    }
  });

  // API: Renderer handoff preview (Phase-83A readonly external renderer test JSON)
  app.get("/api/cinematic/renderer-handoff-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildRendererHandoffPreview()));
    } catch (e) {
      console.error("Cinematic Renderer Handoff Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic renderer handoff preview" });
    }
  });

  // API: Dataset export preview (Phase-84D readonly external dataset test JSON)
  app.get("/api/cinematic/dataset-export-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildDatasetExportPreview()));
    } catch (e) {
      console.error("Cinematic Dataset Export Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic dataset export preview" });
    }
  });

  // API: Image app final input preview (Phase-85E readonly AI Studio paste test JSON)
  app.get("/api/cinematic/image-app-final-input-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildImageAppFinalInputPreview()));
    } catch (e) {
      console.error("Cinematic Image App Final Input Preview Error:", e);
      return res.status(500).json({ error: "Failed to build cinematic image app final input preview" });
    }
  });

  // API: Regeneration image app input preview (Phase-86F readonly AI Studio regeneration test JSON)
  app.get("/api/cinematic/regeneration-image-app-input-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildRegenerationImageAppInputPreview()));
    } catch (e) {
      console.error("Cinematic Regeneration Image App Input Preview Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic regeneration image app input preview",
      });
    }
  });

  // API: Real image app input preview (Phase-93B readonly real 25s frame paste test JSON)
  app.get("/api/cinematic/real-image-app-input-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildRealImageAppInputPreview()));
    } catch (e) {
      console.error("Cinematic Real Image App Input Preview Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic real image app input preview",
      });
    }
  });

  // API: Real image app input json file (Phase-93C readonly cinematic DNA lab upload JSON)
  app.get("/api/cinematic/real-image-app-input-json-file", (req, res) => {
    try {
      const download = runWithRuntimeReadonlyGuard(() => buildRealImageAppJsonFileDownload());
      res.setHeader("Content-Disposition", `attachment; filename="${download.filename}"`);
      res.setHeader("Content-Type", download.contentType);
      res.setHeader("X-Export-Filename", download.filename);
      return res.send(download.body);
    } catch (e) {
      console.error("Cinematic Real Image App Input JSON File Export Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic real image app input json file export",
      });
    }
  });

  // API: Real v82.6 cinematic dna export json file (Phase-93D readonly legacy image app upload JSON)
  app.get("/api/cinematic/real-v826-cinematic-dna-export-json-file", (req, res) => {
    try {
      const download = runWithRuntimeReadonlyGuard(() => buildRealV826CinematicDnaExportDownload());
      res.setHeader("Content-Disposition", `attachment; filename="${download.filename}"`);
      res.setHeader("Content-Type", download.contentType);
      res.setHeader("X-Export-Filename", download.filename);
      return res.send(download.body);
    } catch (e) {
      console.error("Cinematic Real v826 Cinematic DNA Export JSON File Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic real v826 cinematic dna export json file",
      });
    }
  });

  // API: Real v82.6 dense cinematic dna export json file (Phase-93E readonly dense image app upload JSON)
  app.get("/api/cinematic/real-v826-dense-cinematic-dna-export-json-file", (req, res) => {
    try {
      const download = runWithRuntimeReadonlyGuard(() =>
        buildRealV826DenseCinematicDnaExportDownload()
      );
      res.setHeader("Content-Disposition", `attachment; filename="${download.filename}"`);
      res.setHeader("Content-Type", download.contentType);
      res.setHeader("X-Export-Filename", download.filename);
      return res.send(download.body);
    } catch (e) {
      console.error("Cinematic Real v826 Dense Cinematic DNA Export JSON File Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic real v826 dense cinematic dna export json file",
      });
    }
  });

  // API: Reference conditioned image input preview (Phase-88F readonly AI Studio paste test JSON)
  app.get("/api/cinematic/reference-conditioned-image-input-preview", (req, res) => {
    try {
      return res.json(
        runWithRuntimeReadonlyGuard(() => buildReferenceConditionedImageInputPreview())
      );
    } catch (e) {
      console.error("Cinematic Reference Conditioned Image Input Preview Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic reference conditioned image input preview",
      });
    }
  });

  // API: Image test batch preview (Phase-89B readonly AI Studio batch paste test JSON)
  app.get("/api/cinematic/image-test-batch-preview", (req, res) => {
    try {
      return res.json(runWithRuntimeReadonlyGuard(() => buildImageTestBatchPreview()));
    } catch (e) {
      console.error("Cinematic Image Test Batch Preview Error:", e);
      return res.status(500).json({
        error: "Failed to build cinematic image test batch preview",
      });
    }
  });

  registerVisualQaDashboardPreviewRoute(app);

  registerApiBoundaryGuard(app);

  // Vite 미들웨어 설정
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Engine running on http://localhost:${PORT}`);
  });
}

startServer();
