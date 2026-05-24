import { buildDatasetIndex, serializeDatasetIndex } from "../dataset/dataset-index-builder.ts";
import { assembleEvidenceBundle, serializeEvidenceBundle } from "../evidence/evidence-assembler.ts";
import { extractSceneDna, serializeSceneDnaProfile } from "../scene-analysis/scene-dna-extractor.ts";
import { SCENE_DNA_INPUT_EXAMPLE } from "../scene-analysis/scene-dna.fixtures.ts";
import { CINEMATIC_PREVIEW_VERSION } from "./cinematic-preview.ts";
import {
  buildGenerationJobManifest,
  serializeGenerationJobManifest,
} from "./generation-job-manifest.ts";
import {
  buildGeneratorAdapterPayload,
  serializeGeneratorAdapterPayload,
} from "./generator-adapter.ts";
import { buildMusicDramaTimeline, serializeMusicDramaTimeline } from "./music-drama-timeline.ts";
import { compilePromptPack, serializeCompiledPromptPack } from "./prompt-compiler.ts";
import { buildPromptGraph, serializePromptGraph } from "./prompt-graph.ts";
import { buildSequenceComposition, serializeSequenceComposition } from "./sequence-composer.ts";
import {
  buildScenePromptExport,
  serializeScenePromptExport,
} from "./scene-prompt-export.ts";
import { buildStoryboardTimeline, serializeStoryboardTimeline } from "./storyboard-timeline.ts";

export const GENERATION_JOB_MANIFEST_PREVIEW_VERSION = CINEMATIC_PREVIEW_VERSION;

export type GenerationJobManifestPreview = {
  version: typeof GENERATION_JOB_MANIFEST_PREVIEW_VERSION;
  sceneDna: ReturnType<typeof JSON.parse>;
  evidence: ReturnType<typeof JSON.parse>;
  dataset: ReturnType<typeof JSON.parse>;
  storyboard: ReturnType<typeof JSON.parse>;
  sequence: ReturnType<typeof JSON.parse>;
  promptGraph: ReturnType<typeof JSON.parse>;
  compiledPrompt: ReturnType<typeof JSON.parse>;
  musicDrama: ReturnType<typeof JSON.parse>;
  scenePromptExport: ReturnType<typeof JSON.parse>;
  generatorAdapter: ReturnType<typeof JSON.parse>;
  generationJobManifest: ReturnType<typeof JSON.parse>;
};

export function buildGenerationJobManifestPreview(): GenerationJobManifestPreview {
  const sceneDna = extractSceneDna(SCENE_DNA_INPUT_EXAMPLE);
  const evidence = assembleEvidenceBundle({
    sourceId: "scene-001",
    profile: sceneDna,
    artifactKind: "scene-dna",
  });
  const dataset = buildDatasetIndex([evidence]);
  const storyboard = buildStoryboardTimeline(dataset);
  const sequence = buildSequenceComposition(storyboard);
  const promptGraph = buildPromptGraph(sequence);
  const compiledPrompt = compilePromptPack(promptGraph);
  const musicDrama = buildMusicDramaTimeline(compiledPrompt);
  const scenePromptExport = buildScenePromptExport(musicDrama);
  const generatorAdapter = buildGeneratorAdapterPayload(scenePromptExport);
  const generationJobManifest = buildGenerationJobManifest(generatorAdapter);

  return Object.freeze({
    version: GENERATION_JOB_MANIFEST_PREVIEW_VERSION,
    sceneDna: JSON.parse(serializeSceneDnaProfile(sceneDna)),
    evidence: JSON.parse(serializeEvidenceBundle(evidence)),
    dataset: JSON.parse(serializeDatasetIndex(dataset)),
    storyboard: JSON.parse(serializeStoryboardTimeline(storyboard)),
    sequence: JSON.parse(serializeSequenceComposition(sequence)),
    promptGraph: JSON.parse(serializePromptGraph(promptGraph)),
    compiledPrompt: JSON.parse(serializeCompiledPromptPack(compiledPrompt)),
    musicDrama: JSON.parse(serializeMusicDramaTimeline(musicDrama)),
    scenePromptExport: JSON.parse(serializeScenePromptExport(scenePromptExport)),
    generatorAdapter: JSON.parse(serializeGeneratorAdapterPayload(generatorAdapter)),
    generationJobManifest: JSON.parse(serializeGenerationJobManifest(generationJobManifest)),
  });
}

export function serializeGenerationJobManifestPreview(): string {
  const preview = buildGenerationJobManifestPreview();
  return JSON.stringify({
    version: preview.version,
    sceneDna: preview.sceneDna,
    evidence: preview.evidence,
    dataset: preview.dataset,
    storyboard: preview.storyboard,
    sequence: preview.sequence,
    promptGraph: preview.promptGraph,
    compiledPrompt: preview.compiledPrompt,
    musicDrama: preview.musicDrama,
    scenePromptExport: preview.scenePromptExport,
    generatorAdapter: preview.generatorAdapter,
    generationJobManifest: preview.generationJobManifest,
  });
}
