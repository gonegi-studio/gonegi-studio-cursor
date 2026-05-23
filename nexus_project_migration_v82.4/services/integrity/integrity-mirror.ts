import fs from "fs";
import { computeIntegrityFingerprint } from "../deterministic/checksum-ordering.ts";
import type { IntegrityManifest } from "./integrity-manifest.ts";

export type IntegrityMirrorPaths = {
  canonical: string;
  projectMirror: string;
  rootMirror: string;
};

export function writeIntegrityManifestWithMirrors(
  paths: IntegrityMirrorPaths,
  manifest: IntegrityManifest
) {
  const payload = JSON.stringify(manifest, null, 2);
  if (fs.existsSync(paths.canonical)) {
    try {
      const existing = JSON.parse(
        fs.readFileSync(paths.canonical, "utf8")
      ) as IntegrityManifest;
      if (computeIntegrityFingerprint(existing) === computeIntegrityFingerprint(manifest)) {
        return;
      }
    } catch {
      // proceed with write if existing manifest is unreadable
    }
  }
  fs.writeFileSync(paths.canonical, payload, "utf8");
  fs.writeFileSync(paths.projectMirror, payload, "utf8");
  fs.writeFileSync(paths.rootMirror, payload, "utf8");
}
