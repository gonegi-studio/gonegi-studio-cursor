import { buildDatasetIndex } from "../dataset/dataset-index-builder.ts";
import { assembleEvidenceBundle } from "../evidence/evidence-assembler.ts";
import { extractSceneDna } from "../scene-analysis/scene-dna-extractor.ts";
import { SCENE_DNA_INPUT_EXAMPLE } from "../scene-analysis/scene-dna.fixtures.ts";
import {
  buildStoryboardTimeline,
  serializeStoryboardTimeline,
} from "./storyboard-timeline.ts";

export const STORYBOARD_PREVIEW_VERSION = "v1" as const;

export type StoryboardPreview = {
  version: typeof STORYBOARD_PREVIEW_VERSION;
  timeline: ReturnType<typeof JSON.parse>;
};

export function buildStoryboardPreview(): StoryboardPreview {
  const sceneDna = extractSceneDna(SCENE_DNA_INPUT_EXAMPLE);
  const evidence = assembleEvidenceBundle({
    sourceId: "scene-001",
    profile: sceneDna,
    artifactKind: "scene-dna",
  });
  const dataset = buildDatasetIndex([evidence]);
  const storyboard = buildStoryboardTimeline(dataset);

  return Object.freeze({
    version: STORYBOARD_PREVIEW_VERSION,
    timeline: JSON.parse(serializeStoryboardTimeline(storyboard)).timeline,
  });
}

export function serializeStoryboardPreview(): string {
  const preview = buildStoryboardPreview();
  return JSON.stringify({
    version: preview.version,
    timeline: preview.timeline,
  });
}
