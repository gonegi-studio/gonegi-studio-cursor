import { buildDatasetIndex, serializeDatasetIndex } from "../dataset/dataset-index-builder.ts";
import { assembleEvidenceBundle, serializeEvidenceBundle } from "../evidence/evidence-assembler.ts";
import { extractSceneDna, serializeSceneDnaProfile } from "../scene-analysis/scene-dna-extractor.ts";
import { SCENE_DNA_INPUT_EXAMPLE } from "../scene-analysis/scene-dna.fixtures.ts";

export const CINEMATIC_PREVIEW_VERSION = "v1" as const;

export type CinematicDatasetPreview = {
  version: typeof CINEMATIC_PREVIEW_VERSION;
  sceneDna: ReturnType<typeof JSON.parse>;
  evidence: ReturnType<typeof JSON.parse>;
  dataset: ReturnType<typeof JSON.parse>;
};

export function buildCinematicDatasetPreview(): CinematicDatasetPreview {
  const sceneDna = extractSceneDna(SCENE_DNA_INPUT_EXAMPLE);
  const evidence = assembleEvidenceBundle({
    sourceId: "scene-001",
    profile: sceneDna,
    artifactKind: "scene-dna",
  });
  const dataset = buildDatasetIndex([evidence]);

  return Object.freeze({
    version: CINEMATIC_PREVIEW_VERSION,
    sceneDna: JSON.parse(serializeSceneDnaProfile(sceneDna)),
    evidence: JSON.parse(serializeEvidenceBundle(evidence)),
    dataset: JSON.parse(serializeDatasetIndex(dataset)),
  });
}

export function serializeCinematicDatasetPreview(): string {
  const preview = buildCinematicDatasetPreview();
  return JSON.stringify({
    version: preview.version,
    sceneDna: preview.sceneDna,
    evidence: preview.evidence,
    dataset: preview.dataset,
  });
}
