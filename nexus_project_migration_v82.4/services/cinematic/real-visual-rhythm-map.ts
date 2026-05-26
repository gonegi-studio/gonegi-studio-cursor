import crypto from "crypto";
import type {
  RealVisualTimelineFlow,
  RealVisualTimelineFlowEdge,
  RealVisualTimelineFlowNode,
} from "./real-visual-timeline-flow.ts";
import {
  REAL_VISUAL_TIMELINE_FLOW_EDGE_COUNT,
  REAL_VISUAL_TIMELINE_FLOW_NODE_COUNT,
  computeRealVisualTimelineFlowFingerprint,
} from "./real-visual-timeline-flow.ts";
import type { RealVisualDnaPacingRole } from "./real-visual-dna-grammar-binding.ts";

export type RealVisualRhythmPhase = "rhythm-rise" | "rhythm-hold" | "rhythm-release";
export type RealVisualEnergy = "low" | "medium";
export type RealVisualCutPressure = "soft" | "moderate" | "gentle";

export type RealVisualRhythmMapStatus = "rhythm-complete" | "rhythm-blocked" | "rhythm-mismatch";

export type RealVisualRhythmBeat = {
  beatId: string;
  queueOrder: number;
  timestampSeconds: string;
  cinematicRole: RealVisualTimelineFlowNode["cinematicRole"];
  pacingRole: RealVisualTimelineFlowNode["pacingRole"];
  emotionTone: RealVisualTimelineFlowNode["emotionTone"];
  rhythmPhase: RealVisualRhythmPhase;
  visualEnergy: RealVisualEnergy;
  cutPressure: RealVisualCutPressure;
};

export type RealVisualRhythmTransition = {
  transitionId: string;
  fromQueueOrder: number;
  toQueueOrder: number;
  rhythmShift: string;
  emotionShift: string;
  pacingShift: string;
};

export type RealVisualRhythmMap = {
  version: "v1";
  rhythmMapId: string;
  timelineFlowId: string;
  timelineFlowFingerprint: string;
  rhythmMapVersion: typeof REAL_VISUAL_RHYTHM_MAP_KIND_VERSION;
  activeRhythmMapState: string;
  rhythmStatus: RealVisualRhythmMapStatus;
  beatCount: typeof REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT;
  transitionCount: typeof REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT;
  beats: readonly RealVisualRhythmBeat[];
  transitions: readonly RealVisualRhythmTransition[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_VISUAL_RHYTHM_MAP_VERSION = "v1" as const;
export const REAL_VISUAL_RHYTHM_MAP_KIND_VERSION = "real-visual-rhythm-map-v1" as const;
export const REAL_VISUAL_RHYTHM_MAP_ROOT_ID =
  "real-visual-rhythm-map-gonegi-harbor-25s-v1" as const;
export const REAL_VISUAL_RHYTHM_MAP_STATE =
  "25s-real-visual-rhythm-map-metadata-only" as const;
export const REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT = 3 as const;
export const REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT = 2 as const;

export const REAL_VISUAL_RHYTHM_PHASE_BY_PACING_ROLE: Readonly<
  Record<RealVisualDnaPacingRole, RealVisualRhythmPhase>
> = Object.freeze({
  "slow-build": "rhythm-rise",
  sustain: "rhythm-hold",
  release: "rhythm-release",
});

export const REAL_VISUAL_ENERGY_BY_RHYTHM_PHASE: Readonly<
  Record<RealVisualRhythmPhase, RealVisualEnergy>
> = Object.freeze({
  "rhythm-rise": "low",
  "rhythm-hold": "medium",
  "rhythm-release": "low",
});

export const REAL_VISUAL_CUT_PRESSURE_BY_RHYTHM_PHASE: Readonly<
  Record<RealVisualRhythmPhase, RealVisualCutPressure>
> = Object.freeze({
  "rhythm-rise": "soft",
  "rhythm-hold": "moderate",
  "rhythm-release": "gentle",
});

export const REAL_VISUAL_RHYTHM_MAP_KEY_ORDER = Object.freeze([
  "version",
  "rhythmMapId",
  "timelineFlowId",
  "timelineFlowFingerprint",
  "rhythmMapVersion",
  "activeRhythmMapState",
  "rhythmStatus",
  "beatCount",
  "transitionCount",
  "beats",
  "transitions",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_VISUAL_RHYTHM_BEAT_KEY_ORDER = Object.freeze([
  "beatId",
  "queueOrder",
  "timestampSeconds",
  "cinematicRole",
  "pacingRole",
  "emotionTone",
  "rhythmPhase",
  "visualEnergy",
  "cutPressure",
] as const);

export const REAL_VISUAL_RHYTHM_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "fromQueueOrder",
  "toQueueOrder",
  "rhythmShift",
  "emotionShift",
  "pacingShift",
] as const);

let cachedRealVisualRhythmMap: RealVisualRhythmMap | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveRhythmPhase(pacingRole: RealVisualDnaPacingRole): RealVisualRhythmPhase {
  return REAL_VISUAL_RHYTHM_PHASE_BY_PACING_ROLE[pacingRole];
}

function resolveVisualEnergy(rhythmPhase: RealVisualRhythmPhase): RealVisualEnergy {
  return REAL_VISUAL_ENERGY_BY_RHYTHM_PHASE[rhythmPhase];
}

function resolveCutPressure(rhythmPhase: RealVisualRhythmPhase): RealVisualCutPressure {
  return REAL_VISUAL_CUT_PRESSURE_BY_RHYTHM_PHASE[rhythmPhase];
}

function computeRhythmMapId(timelineFlowId: string, timelineFlowFingerprint: string): string {
  return digestValue(
    [
      REAL_VISUAL_RHYTHM_MAP_KIND_VERSION,
      "rhythm-map",
      timelineFlowId,
      timelineFlowFingerprint,
    ].join("|")
  );
}

function computeRhythmBeatId(queueOrder: number, nodeId: string): string {
  return digestValue(
    [REAL_VISUAL_RHYTHM_MAP_KIND_VERSION, "rhythm-beat", String(queueOrder), nodeId].join("|")
  );
}

function computeRhythmTransitionId(
  fromQueueOrder: number,
  toQueueOrder: number,
  fromBeatId: string,
  toBeatId: string
): string {
  return digestValue(
    [
      REAL_VISUAL_RHYTHM_MAP_KIND_VERSION,
      "rhythm-transition",
      String(fromQueueOrder),
      String(toQueueOrder),
      fromBeatId,
      toBeatId,
    ].join("|")
  );
}

function resolveRhythmBlockedReason(flow: RealVisualTimelineFlow): string | null {
  if (flow.flowStatus !== "flow-complete") {
    return "timeline-flow-not-complete";
  }
  if (flow.nodes.length !== REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT) {
    return "node-count-mismatch";
  }
  if (flow.edges.length !== REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT) {
    return "edge-count-mismatch";
  }
  return null;
}

function buildRhythmBeat(node: RealVisualTimelineFlowNode): RealVisualRhythmBeat {
  const rhythmPhase = resolveRhythmPhase(node.pacingRole);

  return Object.freeze({
    beatId: computeRhythmBeatId(node.queueOrder, node.nodeId),
    queueOrder: node.queueOrder,
    timestampSeconds: node.timestampSeconds,
    cinematicRole: node.cinematicRole,
    pacingRole: node.pacingRole,
    emotionTone: node.emotionTone,
    rhythmPhase,
    visualEnergy: resolveVisualEnergy(rhythmPhase),
    cutPressure: resolveCutPressure(rhythmPhase),
  });
}

function buildRhythmTransition(
  edge: RealVisualTimelineFlowEdge,
  fromBeat: RealVisualRhythmBeat,
  toBeat: RealVisualRhythmBeat
): RealVisualRhythmTransition {
  return Object.freeze({
    transitionId: computeRhythmTransitionId(
      edge.fromQueueOrder,
      edge.toQueueOrder,
      fromBeat.beatId,
      toBeat.beatId
    ),
    fromQueueOrder: edge.fromQueueOrder,
    toQueueOrder: edge.toQueueOrder,
    rhythmShift: `${fromBeat.rhythmPhase}|${toBeat.rhythmPhase}`,
    emotionShift: edge.emotionContinuity,
    pacingShift: edge.pacingContinuity,
  });
}

function resolveRhythmStatus(
  rhythmBlocked: boolean,
  beats: readonly RealVisualRhythmBeat[],
  transitions: readonly RealVisualRhythmTransition[]
): RealVisualRhythmMapStatus {
  if (rhythmBlocked) {
    return "rhythm-blocked";
  }

  const queueOrderValid = beats.every((beat, index) => beat.queueOrder === index);
  const mappingValid = beats.every((beat) => {
    const rhythmPhase = resolveRhythmPhase(beat.pacingRole);
    return (
      beat.rhythmPhase === rhythmPhase &&
      beat.visualEnergy === resolveVisualEnergy(rhythmPhase) &&
      beat.cutPressure === resolveCutPressure(rhythmPhase)
    );
  });
  const transitionCountValid = transitions.length === REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT;

  if (
    !queueOrderValid ||
    !mappingValid ||
    !transitionCountValid ||
    beats.length !== REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT
  ) {
    return "rhythm-mismatch";
  }

  return "rhythm-complete";
}

function buildRealVisualRhythmMapInternal(
  realVisualTimelineFlow: RealVisualTimelineFlow
): RealVisualRhythmMap {
  const rhythmBlockedReason = resolveRhythmBlockedReason(realVisualTimelineFlow);
  const rhythmBlocked = rhythmBlockedReason !== null;

  const beats = Object.freeze(
    rhythmBlocked
      ? ([] as RealVisualRhythmBeat[])
      : [...realVisualTimelineFlow.nodes]
          .sort((a, b) => a.queueOrder - b.queueOrder)
          .map((node) => buildRhythmBeat(node))
  );

  const beatByQueue = new Map(beats.map((beat) => [beat.queueOrder, beat] as const));
  const transitions = Object.freeze(
    rhythmBlocked
      ? ([] as RealVisualRhythmTransition[])
      : realVisualTimelineFlow.edges
          .map((edge) => {
            const fromBeat = beatByQueue.get(edge.fromQueueOrder);
            const toBeat = beatByQueue.get(edge.toQueueOrder);
            if (fromBeat === undefined || toBeat === undefined) {
              return null;
            }
            return buildRhythmTransition(edge, fromBeat, toBeat);
          })
          .filter((transition): transition is RealVisualRhythmTransition => transition !== null)
  );

  const timelineFlowFingerprint = computeRealVisualTimelineFlowFingerprint(realVisualTimelineFlow);

  return Object.freeze({
    version: REAL_VISUAL_RHYTHM_MAP_VERSION,
    rhythmMapId: computeRhythmMapId(realVisualTimelineFlow.timelineFlowId, timelineFlowFingerprint),
    timelineFlowId: realVisualTimelineFlow.timelineFlowId,
    timelineFlowFingerprint,
    rhythmMapVersion: REAL_VISUAL_RHYTHM_MAP_KIND_VERSION,
    activeRhythmMapState: REAL_VISUAL_RHYTHM_MAP_STATE,
    rhythmStatus: resolveRhythmStatus(rhythmBlocked, beats, transitions),
    beatCount: REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT,
    transitionCount: REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT,
    beats,
    transitions,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealVisualRhythmMap(
  realVisualTimelineFlow: RealVisualTimelineFlow
): RealVisualRhythmMap {
  if (cachedRealVisualRhythmMap !== null) {
    return cachedRealVisualRhythmMap;
  }

  const rhythmMap = buildRealVisualRhythmMapInternal(realVisualTimelineFlow);
  cachedRealVisualRhythmMap = rhythmMap;
  return rhythmMap;
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

export function serializeRealVisualRhythmMap(rhythmMap: RealVisualRhythmMap): string {
  const orderedBeats = [...rhythmMap.beats]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((beat) => orderRecord(beat, REAL_VISUAL_RHYTHM_BEAT_KEY_ORDER));

  const orderedTransitions = [...rhythmMap.transitions]
    .sort((a, b) => a.fromQueueOrder - b.fromQueueOrder)
    .map((transition) => orderRecord(transition, REAL_VISUAL_RHYTHM_TRANSITION_KEY_ORDER));

  const orderedRhythmMap: Record<string, unknown> = {};
  for (const key of REAL_VISUAL_RHYTHM_MAP_KEY_ORDER) {
    if (key === "beats") {
      orderedRhythmMap.beats = orderedBeats;
    } else if (key === "transitions") {
      orderedRhythmMap.transitions = orderedTransitions;
    } else {
      orderedRhythmMap[key] = rhythmMap[key as keyof RealVisualRhythmMap];
    }
  }

  return JSON.stringify(orderedRhythmMap);
}

export function computeRealVisualRhythmMapFingerprint(rhythmMap: RealVisualRhythmMap): string {
  return digestValue(serializeRealVisualRhythmMap(rhythmMap));
}

export function resetRealVisualRhythmMapCacheForVerification(): void {
  cachedRealVisualRhythmMap = null;
}

export function resolveRealVisualRhythmMappingForPacingRole(pacingRole: RealVisualDnaPacingRole): {
  rhythmPhase: RealVisualRhythmPhase;
  visualEnergy: RealVisualEnergy;
  cutPressure: RealVisualCutPressure;
} {
  const rhythmPhase = resolveRhythmPhase(pacingRole);
  return Object.freeze({
    rhythmPhase,
    visualEnergy: resolveVisualEnergy(rhythmPhase),
    cutPressure: resolveCutPressure(rhythmPhase),
  });
}
