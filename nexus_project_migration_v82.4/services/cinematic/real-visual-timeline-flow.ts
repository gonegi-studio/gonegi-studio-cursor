import crypto from "crypto";
import type { RealVisualDnaGrammarBinding } from "./real-visual-dna-grammar-binding.ts";
import {
  REAL_VISUAL_DNA_GRAMMAR_BINDING_MAX_ITEM_COUNT,
  computeRealVisualDnaGrammarBindingFingerprint,
} from "./real-visual-dna-grammar-binding.ts";
import { REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS } from "./real-mp4-frame-extraction.ts";

export type RealVisualTimelineFlowStatus = "flow-complete" | "flow-blocked" | "flow-mismatch";

export type RealVisualTimelineFlowNode = {
  nodeId: string;
  queueOrder: number;
  timestampSeconds: string;
  frameEvidenceId: string;
  visualDnaSeedId: string;
  grammarBindingId: string;
  cinematicRole: RealVisualDnaGrammarBinding["items"][number]["cinematicRole"];
  pacingRole: RealVisualDnaGrammarBinding["items"][number]["pacingRole"];
  continuityRole: RealVisualDnaGrammarBinding["items"][number]["continuityRole"];
  emotionTone: RealVisualDnaGrammarBinding["items"][number]["emotionTone"];
};

export type RealVisualTimelineFlowEdge = {
  edgeId: string;
  fromQueueOrder: number;
  toQueueOrder: number;
  transitionRole: string;
  pacingContinuity: string;
  emotionContinuity: string;
};

export type RealVisualTimelineFlow = {
  version: "v1";
  timelineFlowId: string;
  bindingRootId: string;
  grammarBindingFingerprint: string;
  flowVersion: typeof REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION;
  activeFlowState: string;
  flowStatus: RealVisualTimelineFlowStatus;
  nodeCount: typeof REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT;
  edgeCount: typeof REAL_VISUAL_TIMELINE_FLOW_EDGE_COUNT;
  nodes: readonly RealVisualTimelineFlowNode[];
  edges: readonly RealVisualTimelineFlowEdge[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_VISUAL_TIMELINE_FLOW_VERSION = "v1" as const;
export const REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION = "real-visual-timeline-flow-v1" as const;
export const REAL_VISUAL_TIMELINE_FLOW_ROOT_ID =
  "real-visual-timeline-flow-gonegi-harbor-25s-v1" as const;
export const REAL_VISUAL_TIMELINE_FLOW_STATE =
  "25s-real-visual-timeline-flow-metadata-only" as const;
export const REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT = 3 as const;
export const REAL_VISUAL_TIMELINE_FLOW_EDGE_COUNT = 2 as const;

export const REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS = Object.freeze([
  Object.freeze({
    fromQueueOrder: 0,
    toQueueOrder: 1,
    transitionRole: "visual-anchor-to-motion-bridge",
  }),
  Object.freeze({
    fromQueueOrder: 1,
    toQueueOrder: 2,
    transitionRole: "motion-bridge-to-emotional-anchor",
  }),
] as const);

export const REAL_VISUAL_TIMELINE_FLOW_KEY_ORDER = Object.freeze([
  "version",
  "timelineFlowId",
  "bindingRootId",
  "grammarBindingFingerprint",
  "flowVersion",
  "activeFlowState",
  "flowStatus",
  "nodeCount",
  "edgeCount",
  "nodes",
  "edges",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_VISUAL_TIMELINE_FLOW_NODE_KEY_ORDER = Object.freeze([
  "nodeId",
  "queueOrder",
  "timestampSeconds",
  "frameEvidenceId",
  "visualDnaSeedId",
  "grammarBindingId",
  "cinematicRole",
  "pacingRole",
  "continuityRole",
  "emotionTone",
] as const);

export const REAL_VISUAL_TIMELINE_FLOW_EDGE_KEY_ORDER = Object.freeze([
  "edgeId",
  "fromQueueOrder",
  "toQueueOrder",
  "transitionRole",
  "pacingContinuity",
  "emotionContinuity",
] as const);

let cachedRealVisualTimelineFlow: RealVisualTimelineFlow | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveTimestampSeconds(queueOrder: number): string {
  const target = REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.find(
    (spec) => spec.queueOrder === queueOrder
  );
  return target?.timestampSeconds ?? "0.000";
}

function computeTimelineFlowId(
  binding: RealVisualDnaGrammarBinding,
  grammarBindingFingerprint: string
): string {
  return digestValue(
    [
      REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION,
      "timeline-flow",
      binding.bindingRootId,
      grammarBindingFingerprint,
    ].join("|")
  );
}

function computeTimelineNodeId(queueOrder: number, grammarBindingId: string): string {
  return digestValue(
    [
      REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION,
      "timeline-node",
      String(queueOrder),
      grammarBindingId,
    ].join("|")
  );
}

function computeTimelineEdgeId(
  fromQueueOrder: number,
  toQueueOrder: number,
  transitionRole: string,
  fromNodeId: string,
  toNodeId: string
): string {
  return digestValue(
    [
      REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION,
      "timeline-edge",
      String(fromQueueOrder),
      String(toQueueOrder),
      transitionRole,
      fromNodeId,
      toNodeId,
    ].join("|")
  );
}

function computePacingContinuity(fromPacingRole: string, toPacingRole: string): string {
  return `${fromPacingRole}-to-${toPacingRole}`;
}

function computeEmotionContinuity(fromEmotionTone: string, toEmotionTone: string): string {
  return `${fromEmotionTone}-to-${toEmotionTone}`;
}

function resolveFlowBlockedReason(binding: RealVisualDnaGrammarBinding): string | null {
  if (binding.bindingStatus !== "binding-complete") {
    return "grammar-binding-not-complete";
  }
  if (binding.boundItemCount !== REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT) {
    return "bound-item-count-mismatch";
  }
  if (binding.items.length !== REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT) {
    return "grammar-item-count-mismatch";
  }
  if (!binding.items.every((item) => item.bindingStatus === "bound")) {
    return "grammar-item-not-bound";
  }
  return null;
}

function buildTimelineNode(
  grammarItem: RealVisualDnaGrammarBinding["items"][number]
): RealVisualTimelineFlowNode {
  return Object.freeze({
    nodeId: computeTimelineNodeId(grammarItem.queueOrder, grammarItem.grammarBindingId),
    queueOrder: grammarItem.queueOrder,
    timestampSeconds: resolveTimestampSeconds(grammarItem.queueOrder),
    frameEvidenceId: grammarItem.frameEvidenceId,
    visualDnaSeedId: grammarItem.visualDnaSeedId,
    grammarBindingId: grammarItem.grammarBindingId,
    cinematicRole: grammarItem.cinematicRole,
    pacingRole: grammarItem.pacingRole,
    continuityRole: grammarItem.continuityRole,
    emotionTone: grammarItem.emotionTone,
  });
}

function buildTimelineEdge(
  edgeSpec: (typeof REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS)[number],
  nodeByQueue: ReadonlyMap<number, RealVisualTimelineFlowNode>
): RealVisualTimelineFlowEdge | null {
  const fromNode = nodeByQueue.get(edgeSpec.fromQueueOrder);
  const toNode = nodeByQueue.get(edgeSpec.toQueueOrder);
  if (fromNode === undefined || toNode === undefined) {
    return null;
  }

  return Object.freeze({
    edgeId: computeTimelineEdgeId(
      edgeSpec.fromQueueOrder,
      edgeSpec.toQueueOrder,
      edgeSpec.transitionRole,
      fromNode.nodeId,
      toNode.nodeId
    ),
    fromQueueOrder: edgeSpec.fromQueueOrder,
    toQueueOrder: edgeSpec.toQueueOrder,
    transitionRole: edgeSpec.transitionRole,
    pacingContinuity: computePacingContinuity(fromNode.pacingRole, toNode.pacingRole),
    emotionContinuity: computeEmotionContinuity(fromNode.emotionTone, toNode.emotionTone),
  });
}

function resolveFlowStatus(
  flowBlocked: boolean,
  nodes: readonly RealVisualTimelineFlowNode[],
  edges: readonly RealVisualTimelineFlowEdge[]
): RealVisualTimelineFlowStatus {
  if (flowBlocked) {
    return "flow-blocked";
  }

  const queueOrderValid = nodes.every((node, index) => node.queueOrder === index);
  const edgeLinkageValid =
    edges.length === REAL_VISUAL_TIMELINE_FLOW_EDGE_COUNT &&
    edges.every(
      (edge, index) =>
        edge.fromQueueOrder === REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS[index]?.fromQueueOrder &&
        edge.toQueueOrder === REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS[index]?.toQueueOrder &&
        edge.transitionRole === REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS[index]?.transitionRole
    );

  if (
    !queueOrderValid ||
    !edgeLinkageValid ||
    nodes.length !== REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT
  ) {
    return "flow-mismatch";
  }

  return "flow-complete";
}

function buildRealVisualTimelineFlowInternal(
  realVisualDnaGrammarBinding: RealVisualDnaGrammarBinding
): RealVisualTimelineFlow {
  const flowBlockedReason = resolveFlowBlockedReason(realVisualDnaGrammarBinding);
  const flowBlocked = flowBlockedReason !== null;

  const grammarByQueue = new Map(
    realVisualDnaGrammarBinding.items.map((item) => [item.queueOrder, item] as const)
  );

  const nodes = Object.freeze(
    REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.map((target) => {
      const grammarItem = grammarByQueue.get(target.queueOrder);
      if (grammarItem === undefined) {
        return Object.freeze({
          nodeId: digestValue(
            [
              REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION,
              "timeline-node-blocked",
              String(target.queueOrder),
            ].join("|")
          ),
          queueOrder: target.queueOrder,
          timestampSeconds: target.timestampSeconds,
          frameEvidenceId: "",
          visualDnaSeedId: "",
          grammarBindingId: "",
          cinematicRole: "opening" as const,
          pacingRole: "slow-build" as const,
          continuityRole: "visual-anchor" as const,
          emotionTone: "nostalgic-calm" as const,
        });
      }
      return buildTimelineNode(grammarItem);
    })
  );

  const nodeByQueue = new Map(nodes.map((node) => [node.queueOrder, node] as const));
  const edges = Object.freeze(
    flowBlocked
      ? ([] as RealVisualTimelineFlowEdge[])
      : REAL_VISUAL_TIMELINE_FLOW_EDGE_SPECS.map((edgeSpec) =>
          buildTimelineEdge(edgeSpec, nodeByQueue)
        ).filter((edge): edge is RealVisualTimelineFlowEdge => edge !== null)
  );

  const grammarBindingFingerprint = computeRealVisualDnaGrammarBindingFingerprint(
    realVisualDnaGrammarBinding
  );

  return Object.freeze({
    version: REAL_VISUAL_TIMELINE_FLOW_VERSION,
    timelineFlowId: computeTimelineFlowId(realVisualDnaGrammarBinding, grammarBindingFingerprint),
    bindingRootId: realVisualDnaGrammarBinding.bindingRootId,
    grammarBindingFingerprint,
    flowVersion: REAL_VISUAL_TIMELINE_FLOW_KIND_VERSION,
    activeFlowState: REAL_VISUAL_TIMELINE_FLOW_STATE,
    flowStatus: resolveFlowStatus(flowBlocked, nodes, edges),
    nodeCount: REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT,
    edgeCount: REAL_VISUAL_TIMELINE_FLOW_EDGE_COUNT,
    nodes,
    edges,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealVisualTimelineFlow(
  realVisualDnaGrammarBinding: RealVisualDnaGrammarBinding
): RealVisualTimelineFlow {
  if (cachedRealVisualTimelineFlow !== null) {
    return cachedRealVisualTimelineFlow;
  }

  const flow = buildRealVisualTimelineFlowInternal(realVisualDnaGrammarBinding);
  cachedRealVisualTimelineFlow = flow;
  return flow;
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeRealVisualTimelineFlow(flow: RealVisualTimelineFlow): string {
  const orderedNodes = [...flow.nodes]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((node) => orderRecord(node, REAL_VISUAL_TIMELINE_FLOW_NODE_KEY_ORDER));

  const orderedEdges = [...flow.edges]
    .sort((a, b) => a.fromQueueOrder - b.fromQueueOrder)
    .map((edge) => orderRecord(edge, REAL_VISUAL_TIMELINE_FLOW_EDGE_KEY_ORDER));

  const orderedFlow: Record<string, unknown> = {};
  for (const key of REAL_VISUAL_TIMELINE_FLOW_KEY_ORDER) {
    if (key === "nodes") {
      orderedFlow.nodes = orderedNodes;
    } else if (key === "edges") {
      orderedFlow.edges = orderedEdges;
    } else {
      orderedFlow[key] = flow[key as keyof RealVisualTimelineFlow];
    }
  }

  return JSON.stringify(orderedFlow);
}

export function computeRealVisualTimelineFlowFingerprint(flow: RealVisualTimelineFlow): string {
  return digestValue(serializeRealVisualTimelineFlow(flow));
}

export function resetRealVisualTimelineFlowCacheForVerification(): void {
  cachedRealVisualTimelineFlow = null;
}
