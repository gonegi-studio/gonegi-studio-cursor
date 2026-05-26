import { CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE } from "./cinematic-evidence-registry.fixtures.ts";
import { CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE } from "./cinematic-grammar-binding.fixtures.ts";
import { CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE } from "./cinematic-timeline-orchestration.fixtures.ts";
import { EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE } from "./emotional-rhythm-map.fixtures.ts";
import { MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE } from "./music-timing-contract.fixtures.ts";
import { MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE } from "./music-drama-scene-plan.fixtures.ts";
import { MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE } from "./music-drama-prompt-brief.fixtures.ts";
import { MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE } from "./music-drama-generator-payload.fixtures.ts";
import {
  buildDatasetReadinessBinding,
  computeDatasetReadinessBindingFingerprint,
} from "./dataset-readiness-binding.ts";

export const DATASET_READINESS_BINDING_INPUT_EXAMPLE = Object.freeze({
  cinematicEvidenceRegistry: CINEMATIC_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE,
  cinematicGrammarBinding: CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE,
  cinematicTimelineOrchestration: CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE,
  emotionalRhythmMap: EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE,
  musicTimingContract: MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE,
  musicDramaScenePlan: MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE,
  musicDramaPromptBrief: MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE,
  musicDramaGeneratorPayload: MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE,
});

export const DATASET_READINESS_BINDING_OUTPUT_EXAMPLE = buildDatasetReadinessBinding(
  DATASET_READINESS_BINDING_INPUT_EXAMPLE
);

export const DATASET_READINESS_BINDING_FINGERPRINT = computeDatasetReadinessBindingFingerprint(
  DATASET_READINESS_BINDING_OUTPUT_EXAMPLE
);

export const DATASET_READINESS_QUEUE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  datasetLayerKind: "frame-export" as const,
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
});

export const DATASET_READINESS_BINDING_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  bindingId: "dataset-readiness-binding-gonegi-harbor-25s-v1",
  datasetReadinessBindingVersion: "dataset-readiness-binding-v1" as const,
  activeDatasetReadinessState: "25s-dataset-readiness-binding-metadata-only",
  totalQueueItemCount: 6,
});
