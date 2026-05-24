/** Phase-2A: evidence artifact — type scaffold only (zero-runtime) */

import type { SceneDnaProfile } from "../scene-analysis/scene-dna.types.ts";

export type EvidenceKind = "checksum" | "manifest-ref" | "export-snapshot" | "scene-dna";

export type EvidenceArtifactRef = {
  id: string;
  kind: EvidenceKind;
  sourcePath: string;
  capturedAt: string;
};

export type EvidenceBundle = {
  version: "v1";
  artifacts: readonly EvidenceArtifactRef[];
};

export type EvidenceAssemblerInput = {
  sourceId: string;
  profile: SceneDnaProfile;
  artifactKind: Extract<EvidenceKind, "scene-dna">;
};

export const EVIDENCE_BUNDLE_VERSION = "v1" as const;
