import crypto from "crypto";
import { serializeSceneDnaProfile } from "../scene-analysis/scene-dna-extractor.ts";
import type {
  EvidenceAssemblerInput,
  EvidenceArtifactRef,
  EvidenceBundle,
  EvidenceKind,
} from "./evidence.types.ts";
import { EVIDENCE_BUNDLE_VERSION } from "./evidence.types.ts";

function computeEvidenceFingerprint(
  sourceId: string,
  profile: EvidenceAssemblerInput["profile"],
  kind: EvidenceKind
): string {
  const stablePayload = JSON.stringify({
    sourceId,
    kind,
    profile: JSON.parse(serializeSceneDnaProfile(profile)),
  });
  return crypto.createHash("sha256").update(stablePayload).digest("hex");
}

function buildArtifactId(fingerprint: string): string {
  return `evidence-${fingerprint.slice(0, 32)}`;
}

function buildDeterministicCapturedAt(fingerprint: string): string {
  return `2026-01-01T00:00:00.${fingerprint.slice(0, 3)}Z`;
}

function buildSourcePath(sourceId: string): string {
  return `services/scene-analysis/scenes/${sourceId}.dna.json`;
}

function buildArtifactRef(input: EvidenceAssemblerInput): EvidenceArtifactRef {
  const fingerprint = computeEvidenceFingerprint(
    input.sourceId,
    input.profile,
    input.artifactKind
  );

  return Object.freeze({
    id: buildArtifactId(fingerprint),
    kind: input.artifactKind,
    sourcePath: buildSourcePath(input.sourceId),
    capturedAt: buildDeterministicCapturedAt(fingerprint),
  });
}

export function assembleEvidenceBundle(input: EvidenceAssemblerInput): EvidenceBundle {
  const artifact = buildArtifactRef(input);
  const artifacts = Object.freeze([artifact].sort((a, b) => a.id.localeCompare(b.id)));

  return Object.freeze({
    version: EVIDENCE_BUNDLE_VERSION,
    artifacts,
  });
}

export const EVIDENCE_BUNDLE_KEY_ORDER = Object.freeze(["version", "artifacts"] as const);

export const EVIDENCE_ARTIFACT_KEY_ORDER = Object.freeze([
  "id",
  "kind",
  "sourcePath",
  "capturedAt",
] as const);

export function serializeEvidenceBundle(bundle: EvidenceBundle): string {
  const orderedArtifacts = [...bundle.artifacts]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((artifact) => {
      const ordered: Record<string, unknown> = {};
      for (const key of EVIDENCE_ARTIFACT_KEY_ORDER) {
        ordered[key] = artifact[key as keyof EvidenceArtifactRef];
      }
      return ordered;
    });

  const ordered: Record<string, unknown> = {
    version: bundle.version,
    artifacts: orderedArtifacts,
  };

  return JSON.stringify(ordered);
}
