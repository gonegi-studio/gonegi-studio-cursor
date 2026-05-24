import crypto from "crypto";
import type { MusicEnergy, SequenceComposition, SequenceSegment } from "./sequence-composer.ts";

export type PromptGraphNode = {
  nodeId: string;
  segmentId: string;
  shotIds: readonly string[];
  promptIntent: string;
  tokenBudget: number;
};

export type PromptGraph = {
  version: "v1";
  nodes: readonly PromptGraphNode[];
};

export const PROMPT_GRAPH_VERSION = "v1" as const;

const TOKEN_BUDGET_BY_ENERGY: Readonly<Record<MusicEnergy, number>> = Object.freeze({
  low: 48,
  medium: 96,
  high: 160,
});

function buildNodeId(index: number): string {
  return `node-${String(index + 1).padStart(3, "0")}`;
}

function buildPromptIntent(segment: SequenceSegment): string {
  return `${segment.emotionalBeat}|${segment.musicEnergy}|${segment.transitionProfile}`;
}

function deriveFingerprintTokenBudget(segment: SequenceSegment): number {
  const fingerprint = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        segmentId: segment.segmentId,
        emotionalBeat: segment.emotionalBeat,
        musicEnergy: segment.musicEnergy,
        transitionProfile: segment.transitionProfile,
        shotIds: [...segment.shotIds].sort((a, b) => a.localeCompare(b)),
      })
    )
    .digest("hex");
  return 32 + (parseInt(fingerprint.slice(0, 2), 16) % 97);
}

function resolveTokenBudget(segment: SequenceSegment): number {
  const base = TOKEN_BUDGET_BY_ENERGY[segment.musicEnergy] ?? deriveFingerprintTokenBudget(segment);
  return base + segment.shotIds.length * 8;
}

function buildNode(segment: SequenceSegment, index: number): PromptGraphNode {
  return Object.freeze({
    nodeId: buildNodeId(index),
    segmentId: segment.segmentId,
    shotIds: Object.freeze([...segment.shotIds].sort((a, b) => a.localeCompare(b))),
    promptIntent: buildPromptIntent(segment),
    tokenBudget: resolveTokenBudget(segment),
  });
}

export function buildPromptGraph(composition: SequenceComposition): PromptGraph {
  const orderedSegments = [...composition.segments].sort((a, b) =>
    a.segmentId.localeCompare(b.segmentId)
  );
  const nodes = Object.freeze(orderedSegments.map((segment, index) => buildNode(segment, index)));

  return Object.freeze({
    version: PROMPT_GRAPH_VERSION,
    nodes,
  });
}

export const PROMPT_GRAPH_NODE_KEY_ORDER = Object.freeze([
  "nodeId",
  "segmentId",
  "shotIds",
  "promptIntent",
  "tokenBudget",
] as const);

export function serializePromptGraph(graph: PromptGraph): string {
  const orderedNodes = [...graph.nodes]
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId))
    .map((node) => {
      const ordered: Record<string, unknown> = {};
      for (const key of PROMPT_GRAPH_NODE_KEY_ORDER) {
        if (key === "shotIds") {
          ordered[key] = [...node.shotIds].sort((a, b) => a.localeCompare(b));
          continue;
        }
        ordered[key] = node[key as keyof PromptGraphNode];
      }
      return ordered;
    });

  return JSON.stringify({
    version: graph.version,
    nodes: orderedNodes,
  });
}

export function computePromptGraphFingerprint(graph: PromptGraph): string {
  return crypto.createHash("sha256").update(serializePromptGraph(graph)).digest("hex");
}
