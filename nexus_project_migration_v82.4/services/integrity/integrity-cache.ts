import fs from "fs";
import { computeIntegrityFingerprint } from "../deterministic/checksum-ordering.ts";
import type { IntegrityManifest } from "./integrity-manifest.ts";
import {
  writeIntegrityManifestWithMirrors,
  type IntegrityMirrorPaths,
} from "./integrity-mirror.ts";

export function createIntegrityCacheService(
  paths: IntegrityMirrorPaths,
  getIntegrityManifest: () => IntegrityManifest
) {
  let integritySnapshot: IntegrityManifest | null = null;
  let integritySnapshotFingerprint: string | null = null;

  function cloneManifest(manifest: IntegrityManifest): IntegrityManifest {
    return structuredClone(manifest);
  }

  function updateIntegrityCache(manifest: IntegrityManifest, options?: { force?: boolean }) {
    const force = options?.force === true;
    const fingerprint = computeIntegrityFingerprint(manifest);
    const fingerprintChanged = integritySnapshotFingerprint !== fingerprint;

    integritySnapshot = cloneManifest(manifest);
    integritySnapshotFingerprint = fingerprint;

    if (fingerprintChanged || force) {
      writeIntegrityManifestWithMirrors(paths, manifest);
    }
  }

  function ensureIntegrityManifest(options?: { force?: boolean }): IntegrityManifest {
    const force = options?.force === true;

    if (!force && integritySnapshot && integritySnapshotFingerprint) {
      return {
        ...cloneManifest(integritySnapshot),
        generated_at: new Date().toISOString(),
      };
    }

    const manifest = getIntegrityManifest();
    updateIntegrityCache(manifest, { force });
    return cloneManifest(integritySnapshot!);
  }

  function initializeIntegrityCacheOnStartup() {
    if (fs.existsSync(paths.canonical)) {
      try {
        const diskManifest = JSON.parse(
          fs.readFileSync(paths.canonical, "utf8")
        ) as IntegrityManifest;
        const liveManifest = getIntegrityManifest();
        const diskFingerprint = computeIntegrityFingerprint(diskManifest);
        const liveFingerprint = computeIntegrityFingerprint(liveManifest);

        integritySnapshot = cloneManifest(liveManifest);
        integritySnapshotFingerprint = liveFingerprint;

        if (diskFingerprint === liveFingerprint) {
          console.log("✅ [NEXUS OS] canonical manifest fresh — startup skip write");
        } else {
          writeIntegrityManifestWithMirrors(paths, liveManifest);
          console.log("✅ [NEXUS OS] canonical manifest stale — regenerated");
        }
      } catch {
        ensureIntegrityManifest({ force: true });
      }
    } else {
      ensureIntegrityManifest({ force: true });
    }
    console.log("✅ [NEXUS OS] migration_integrity_manifest.json + mirrors synchronized on startup");
  }

  return {
    updateIntegrityCache,
    ensureIntegrityManifest,
    initializeIntegrityCacheOnStartup,
  };
}

export type IntegrityCacheService = ReturnType<typeof createIntegrityCacheService>;
