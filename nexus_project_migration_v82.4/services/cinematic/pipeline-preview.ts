import { buildCinematicDatasetPreview, CINEMATIC_PREVIEW_VERSION } from "./cinematic-preview.ts";
import { buildStoryboardPreview } from "./storyboard-preview.ts";

export const CINEMATIC_PIPELINE_PREVIEW_VERSION = CINEMATIC_PREVIEW_VERSION;

export type CinematicPipelinePreview = {
  version: typeof CINEMATIC_PIPELINE_PREVIEW_VERSION;
  sceneDna: ReturnType<typeof JSON.parse>;
  evidence: ReturnType<typeof JSON.parse>;
  dataset: ReturnType<typeof JSON.parse>;
  storyboard: ReturnType<typeof JSON.parse>;
};

export function buildCinematicPipelinePreview(): CinematicPipelinePreview {
  const datasetPreview = buildCinematicDatasetPreview();
  const storyboardPreview = buildStoryboardPreview();

  return Object.freeze({
    version: CINEMATIC_PIPELINE_PREVIEW_VERSION,
    sceneDna: datasetPreview.sceneDna,
    evidence: datasetPreview.evidence,
    dataset: datasetPreview.dataset,
    storyboard: Object.freeze({
      timeline: storyboardPreview.timeline,
    }),
  });
}

export function serializeCinematicPipelinePreview(): string {
  const preview = buildCinematicPipelinePreview();
  return JSON.stringify({
    version: preview.version,
    sceneDna: preview.sceneDna,
    evidence: preview.evidence,
    dataset: preview.dataset,
    storyboard: preview.storyboard,
  });
}
