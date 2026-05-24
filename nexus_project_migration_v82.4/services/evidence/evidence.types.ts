/** Phase-2A: evidence artifact — type scaffold only (zero-runtime) */

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

export const EVIDENCE_BUNDLE_VERSION = "v1" as const;
