import { REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE } from "./real-visual-dna-grammar-binding.fixtures.ts";
import {
  buildRealVisualTimelineFlow,
  computeRealVisualTimelineFlowFingerprint,
} from "./real-visual-timeline-flow.ts";

export const REAL_VISUAL_TIMELINE_FLOW_INPUT_EXAMPLE = Object.freeze({
  realVisualDnaGrammarBinding: REAL_VISUAL_DNA_GRAMMAR_BINDING_OUTPUT_EXAMPLE,
});

export const REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE = buildRealVisualTimelineFlow(
  REAL_VISUAL_TIMELINE_FLOW_INPUT_EXAMPLE.realVisualDnaGrammarBinding
);

export const REAL_VISUAL_TIMELINE_FLOW_FINGERPRINT = computeRealVisualTimelineFlowFingerprint(
  REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE
);

export const REAL_VISUAL_TIMELINE_FLOW_NODE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  cinematicRole: "opening" as const,
  pacingRole: "slow-build" as const,
  continuityRole: "visual-anchor" as const,
  emotionTone: "nostalgic-calm" as const,
});

export const REAL_VISUAL_TIMELINE_FLOW_EDGE_OUTPUT_EXAMPLE = Object.freeze({
  fromQueueOrder: 0,
  toQueueOrder: 1,
  transitionRole: "visual-anchor-to-motion-bridge",
  pacingContinuity: "slow-build-to-sustain",
  emotionContinuity: "nostalgic-calm-to-adventurous-soft",
});

export const REAL_VISUAL_TIMELINE_FLOW_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  timelineFlowId: REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE.timelineFlowId,
  flowVersion: "real-visual-timeline-flow-v1" as const,
  activeFlowState: "25s-real-visual-timeline-flow-metadata-only",
  flowStatus: REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE.flowStatus,
  nodeCount: 3,
  edgeCount: 2,
});
