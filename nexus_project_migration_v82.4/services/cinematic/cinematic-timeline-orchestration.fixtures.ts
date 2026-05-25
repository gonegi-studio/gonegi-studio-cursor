import { CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE } from "./cinematic-grammar-binding.fixtures.ts";
import {
  buildCinematicTimelineOrchestration,
  computeCinematicTimelineOrchestrationFingerprint,
} from "./cinematic-timeline-orchestration.ts";

export const CINEMATIC_TIMELINE_ORCHESTRATION_INPUT_EXAMPLE =
  CINEMATIC_GRAMMAR_BINDING_OUTPUT_EXAMPLE;

export const CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE = buildCinematicTimelineOrchestration(
  CINEMATIC_TIMELINE_ORCHESTRATION_INPUT_EXAMPLE
);

export const CINEMATIC_TIMELINE_ORCHESTRATION_FINGERPRINT =
  computeCinematicTimelineOrchestrationFingerprint(CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE);

export const CINEMATIC_TIMELINE_NODE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  cinematicRole: "opening" as const,
  pacingRole: "slow-build" as const,
  emotionalBeat: "nostalgic-calm",
  previousNodeId: "",
  startSeconds: 0,
  endSeconds: 8,
});

export const CINEMATIC_TIMELINE_EDGE_OUTPUT_EXAMPLE = Object.freeze({
  edgeIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  transitionRole: "bridge" as const,
});

export const CINEMATIC_TIMELINE_ARC_OUTPUT_EXAMPLE = Object.freeze({
  arcIndex: 0,
  segmentId: "segment-001",
  cinematicRole: "opening" as const,
  pacingRole: "slow-build" as const,
  emotionalBeat: "nostalgic-calm",
  startSeconds: 0,
  endSeconds: 8,
});

export const CINEMATIC_TIMELINE_ORCHESTRATION_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  orchestrationId: "cinematic-timeline-orchestration-gonegi-harbor-25s-v1",
  orchestrationBindingVersion: "cinematic-timeline-orchestration-v1" as const,
  activeOrchestrationState: "25s-cinematic-timeline-orchestration-metadata-only",
});
