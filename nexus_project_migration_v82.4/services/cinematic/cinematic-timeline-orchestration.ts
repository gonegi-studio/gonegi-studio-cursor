import crypto from "crypto";
import type {
  CinematicGrammarBinding,
  CinematicGrammarItem,
  CinematicGrammarRole,
  CinematicPacingRole,
  CinematicTransitionBinding,
} from "./cinematic-grammar-binding.ts";
import { computeCinematicGrammarBindingFingerprint } from "./cinematic-grammar-binding.ts";

export type CinematicTimelineNode = {
  nodeId: string;
  evidenceId: string;
  queueOrder: number;
  segmentId: string;
  cinematicRole: CinematicGrammarRole;
  pacingRole: CinematicPacingRole;
  emotionalBeat: string;
  startSeconds: number;
  endSeconds: number;
  previousNodeId: string;
  nextNodeId: string;
};

export type CinematicTimelineEdge = {
  edgeId: string;
  edgeIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromNodeId: string;
  toNodeId: string;
  fromEvidenceId: string;
  toEvidenceId: string;
  transitionRole: CinematicTransitionBinding["transitionRole"];
  edgeFingerprint: string;
};

export type CinematicTimelineArc = {
  arcId: string;
  arcIndex: number;
  segmentId: string;
  cinematicRole: CinematicGrammarRole;
  pacingRole: CinematicPacingRole;
  emotionalBeat: string;
  nodeIds: readonly string[];
  startSeconds: number;
  endSeconds: number;
  arcFingerprint: string;
};

export type CinematicTimelineOrchestration = {
  version: "v1";
  orchestrationId: string;
  bindingId: string;
  grammarBindingFingerprint: string;
  sourceFingerprint: string;
  orchestrationBindingVersion: typeof CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION;
  activeOrchestrationState: string;
  nodes: readonly CinematicTimelineNode[];
  edges: readonly CinematicTimelineEdge[];
  arcs: readonly CinematicTimelineArc[];
};

export const CINEMATIC_TIMELINE_ORCHESTRATION_VERSION = "v1" as const;
export const CINEMATIC_TIMELINE_ORCHESTRATION_ID =
  "cinematic-timeline-orchestration-gonegi-harbor-25s-v1" as const;
export const CINEMATIC_TIMELINE_ORCHESTRATION_STATE =
  "25s-cinematic-timeline-orchestration-metadata-only" as const;
export const CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION =
  "cinematic-timeline-orchestration-v1" as const;

const SEGMENT_ARC_ORDER = Object.freeze(["segment-001", "segment-002", "segment-003"] as const);

let cachedCinematicTimelineOrchestration: CinematicTimelineOrchestration | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeTimelineNodeId(queueOrder: number, evidenceId: string): string {
  return digestValue(
    [CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION, "timeline-node", String(queueOrder), evidenceId].join(
      "|"
    )
  );
}

function computeTimelineEdgeId(
  edgeIndex: number,
  fromNodeId: string,
  toNodeId: string
): string {
  return digestValue(
    [
      CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION,
      "timeline-edge",
      String(edgeIndex),
      fromNodeId,
      toNodeId,
    ].join("|")
  );
}

function computeTimelineArcId(segmentId: string, arcIndex: number, nodeIds: readonly string[]): string {
  return digestValue(
    [
      CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION,
      "timeline-arc",
      String(arcIndex),
      segmentId,
      nodeIds.join("|"),
    ].join("|")
  );
}

function computeTimelineEdgeFingerprint(
  edge: Omit<CinematicTimelineEdge, "edgeFingerprint">
): string {
  return digestValue(
    [
      CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION,
      edge.edgeId,
      String(edge.edgeIndex),
      String(edge.fromQueueOrder),
      String(edge.toQueueOrder),
      edge.fromNodeId,
      edge.toNodeId,
      edge.fromEvidenceId,
      edge.toEvidenceId,
      edge.transitionRole,
    ].join("|")
  );
}

function computeTimelineArcFingerprint(
  arc: Omit<CinematicTimelineArc, "arcFingerprint">
): string {
  return digestValue(
    [
      CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION,
      arc.arcId,
      String(arc.arcIndex),
      arc.segmentId,
      arc.cinematicRole,
      arc.pacingRole,
      arc.emotionalBeat,
      arc.nodeIds.join("|"),
      String(arc.startSeconds),
      String(arc.endSeconds),
    ].join("|")
  );
}

function buildCinematicTimelineNode(
  grammarItem: CinematicGrammarItem,
  previousNodeId: string,
  nextNodeId: string
): CinematicTimelineNode {
  return Object.freeze({
    nodeId: computeTimelineNodeId(grammarItem.queueOrder, grammarItem.evidenceId),
    evidenceId: grammarItem.evidenceId,
    queueOrder: grammarItem.queueOrder,
    segmentId: grammarItem.segmentId,
    cinematicRole: grammarItem.cinematicRole,
    pacingRole: grammarItem.pacingRole,
    emotionalBeat: grammarItem.emotionalBeat,
    startSeconds: grammarItem.startSeconds,
    endSeconds: grammarItem.endSeconds,
    previousNodeId,
    nextNodeId,
  });
}

function buildCinematicTimelineEdge(
  transition: CinematicTransitionBinding,
  fromNode: CinematicTimelineNode,
  toNode: CinematicTimelineNode
): CinematicTimelineEdge {
  const edgeId = computeTimelineEdgeId(transition.transitionIndex, fromNode.nodeId, toNode.nodeId);
  const baseEdge: Omit<CinematicTimelineEdge, "edgeFingerprint"> = {
    edgeId,
    edgeIndex: transition.transitionIndex,
    fromQueueOrder: transition.fromQueueOrder,
    toQueueOrder: transition.toQueueOrder,
    fromNodeId: fromNode.nodeId,
    toNodeId: toNode.nodeId,
    fromEvidenceId: transition.fromEvidenceId,
    toEvidenceId: transition.toEvidenceId,
    transitionRole: transition.transitionRole,
  };

  return Object.freeze({
    ...baseEdge,
    edgeFingerprint: computeTimelineEdgeFingerprint(baseEdge),
  });
}

function buildCinematicTimelineArc(
  arcIndex: number,
  segmentId: string,
  nodes: readonly CinematicTimelineNode[]
): CinematicTimelineArc {
  const segmentNodes = [...nodes]
    .filter((node) => node.segmentId === segmentId)
    .sort((a, b) => a.queueOrder - b.queueOrder);
  const frameNode = segmentNodes[0];
  if (frameNode === undefined) {
    throw new Error(`Timeline arc requires at least one node for segmentId=${segmentId}`);
  }

  const nodeIds = Object.freeze(segmentNodes.map((node) => node.nodeId));
  const arcId = computeTimelineArcId(segmentId, arcIndex, nodeIds);
  const baseArc: Omit<CinematicTimelineArc, "arcFingerprint"> = {
    arcId,
    arcIndex,
    segmentId,
    cinematicRole: frameNode.cinematicRole,
    pacingRole: frameNode.pacingRole,
    emotionalBeat: frameNode.emotionalBeat,
    nodeIds,
    startSeconds: frameNode.startSeconds,
    endSeconds: frameNode.endSeconds,
  };

  return Object.freeze({
    ...baseArc,
    arcFingerprint: computeTimelineArcFingerprint(baseArc),
  });
}

export function buildCinematicTimelineOrchestration(
  cinematicGrammarBinding: CinematicGrammarBinding
): CinematicTimelineOrchestration {
  if (cachedCinematicTimelineOrchestration !== null) {
    return cachedCinematicTimelineOrchestration;
  }

  const grammarBindingFingerprint = computeCinematicGrammarBindingFingerprint(cinematicGrammarBinding);
  const orderedGrammarItems = [...cinematicGrammarBinding.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const nodes = Object.freeze(
    orderedGrammarItems.map((grammarItem, index) => {
      const previousNodeId =
        index === 0
          ? ""
          : computeTimelineNodeId(
              orderedGrammarItems[index - 1]!.queueOrder,
              orderedGrammarItems[index - 1]!.evidenceId
            );
      const nextNodeId =
        index === orderedGrammarItems.length - 1
          ? ""
          : computeTimelineNodeId(
              orderedGrammarItems[index + 1]!.queueOrder,
              orderedGrammarItems[index + 1]!.evidenceId
            );

      return buildCinematicTimelineNode(grammarItem, previousNodeId, nextNodeId);
    })
  );

  const nodeByQueueOrder = new Map(nodes.map((node) => [node.queueOrder, node]));

  const edges = Object.freeze(
    cinematicGrammarBinding.transitions.map((transition) => {
      const fromNode = nodeByQueueOrder.get(transition.fromQueueOrder);
      const toNode = nodeByQueueOrder.get(transition.toQueueOrder);
      if (fromNode === undefined || toNode === undefined) {
        throw new Error("Timeline edge requires resolved source and target nodes");
      }
      return buildCinematicTimelineEdge(transition, fromNode, toNode);
    })
  );

  const arcs = Object.freeze(
    SEGMENT_ARC_ORDER.map((segmentId, arcIndex) => buildCinematicTimelineArc(arcIndex, segmentId, nodes))
  );

  const orchestration = Object.freeze({
    version: CINEMATIC_TIMELINE_ORCHESTRATION_VERSION,
    orchestrationId: CINEMATIC_TIMELINE_ORCHESTRATION_ID,
    bindingId: cinematicGrammarBinding.bindingId,
    grammarBindingFingerprint,
    sourceFingerprint: cinematicGrammarBinding.sourceFingerprint,
    orchestrationBindingVersion: CINEMATIC_TIMELINE_ORCHESTRATION_KIND_VERSION,
    activeOrchestrationState: CINEMATIC_TIMELINE_ORCHESTRATION_STATE,
    nodes,
    edges,
    arcs,
  });

  cachedCinematicTimelineOrchestration = orchestration;
  return orchestration;
}

export const CINEMATIC_TIMELINE_NODE_KEY_ORDER = Object.freeze([
  "nodeId",
  "evidenceId",
  "queueOrder",
  "segmentId",
  "cinematicRole",
  "pacingRole",
  "emotionalBeat",
  "startSeconds",
  "endSeconds",
  "previousNodeId",
  "nextNodeId",
] as const);

export const CINEMATIC_TIMELINE_EDGE_KEY_ORDER = Object.freeze([
  "edgeId",
  "edgeIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromNodeId",
  "toNodeId",
  "fromEvidenceId",
  "toEvidenceId",
  "transitionRole",
  "edgeFingerprint",
] as const);

export const CINEMATIC_TIMELINE_ARC_KEY_ORDER = Object.freeze([
  "arcId",
  "arcIndex",
  "segmentId",
  "cinematicRole",
  "pacingRole",
  "emotionalBeat",
  "nodeIds",
  "startSeconds",
  "endSeconds",
  "arcFingerprint",
] as const);

export const CINEMATIC_TIMELINE_ORCHESTRATION_KEY_ORDER = Object.freeze([
  "version",
  "orchestrationId",
  "bindingId",
  "grammarBindingFingerprint",
  "sourceFingerprint",
  "orchestrationBindingVersion",
  "activeOrchestrationState",
  "nodes",
  "edges",
  "arcs",
] as const);

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

export function serializeCinematicTimelineOrchestration(
  orchestration: CinematicTimelineOrchestration
): string {
  const orderedNodes = [...orchestration.nodes]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((node) => orderRecord(node, CINEMATIC_TIMELINE_NODE_KEY_ORDER));

  const orderedEdges = [...orchestration.edges]
    .sort((a, b) => a.edgeIndex - b.edgeIndex)
    .map((edge) => orderRecord(edge, CINEMATIC_TIMELINE_EDGE_KEY_ORDER));

  const orderedArcs = [...orchestration.arcs]
    .sort((a, b) => a.arcIndex - b.arcIndex)
    .map((arc) => {
      const orderedArc = orderRecord(arc, CINEMATIC_TIMELINE_ARC_KEY_ORDER);
      orderedArc.nodeIds = [...arc.nodeIds];
      return orderedArc;
    });

  const orderedOrchestration: Record<string, unknown> = {};
  for (const key of CINEMATIC_TIMELINE_ORCHESTRATION_KEY_ORDER) {
    if (key === "nodes") {
      orderedOrchestration.nodes = orderedNodes;
    } else if (key === "edges") {
      orderedOrchestration.edges = orderedEdges;
    } else if (key === "arcs") {
      orderedOrchestration.arcs = orderedArcs;
    } else {
      orderedOrchestration[key] = orchestration[key as keyof CinematicTimelineOrchestration];
    }
  }

  return JSON.stringify(orderedOrchestration);
}

export function computeCinematicTimelineOrchestrationFingerprint(
  orchestration: CinematicTimelineOrchestration
): string {
  return digestValue(serializeCinematicTimelineOrchestration(orchestration));
}

export function resetCinematicTimelineOrchestrationCacheForVerification(): void {
  cachedCinematicTimelineOrchestration = null;
}
