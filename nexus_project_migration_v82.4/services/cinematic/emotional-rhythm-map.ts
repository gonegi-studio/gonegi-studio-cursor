import crypto from "crypto";
import type { CinematicPacingRole } from "./cinematic-grammar-binding.ts";
import type {
  CinematicTimelineEdge,
  CinematicTimelineNode,
  CinematicTimelineOrchestration,
} from "./cinematic-timeline-orchestration.ts";
import { computeCinematicTimelineOrchestrationFingerprint } from "./cinematic-timeline-orchestration.ts";

export type EmotionalRhythmPhase = "rhythm-rise" | "rhythm-hold" | "rhythm-release";

export type EmotionalRhythmBeat = {
  beatId: string;
  nodeId: string;
  evidenceId: string;
  queueOrder: number;
  segmentId: string;
  emotionalBeat: string;
  pacingRole: CinematicPacingRole;
  rhythmPhase: EmotionalRhythmPhase;
  startSeconds: number;
  endSeconds: number;
  previousBeatId: string;
  nextBeatId: string;
  beatFingerprint: string;
};

export type EmotionalRhythmTransition = {
  transitionId: string;
  transitionIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromBeatId: string;
  toBeatId: string;
  fromEmotionalBeat: string;
  toEmotionalBeat: string;
  fromPacingRole: CinematicPacingRole;
  toPacingRole: CinematicPacingRole;
  rhythmShift: string;
  transitionFingerprint: string;
};

export type EmotionalRhythmMap = {
  version: "v1";
  rhythmMapId: string;
  orchestrationId: string;
  timelineOrchestrationFingerprint: string;
  sourceFingerprint: string;
  rhythmMapBindingVersion: typeof EMOTIONAL_RHYTHM_MAP_KIND_VERSION;
  activeRhythmMapState: string;
  beats: readonly EmotionalRhythmBeat[];
  transitions: readonly EmotionalRhythmTransition[];
};

export const EMOTIONAL_RHYTHM_MAP_VERSION = "v1" as const;
export const EMOTIONAL_RHYTHM_MAP_ID = "emotional-rhythm-map-gonegi-harbor-25s-v1" as const;
export const EMOTIONAL_RHYTHM_MAP_STATE = "25s-emotional-rhythm-map-metadata-only" as const;
export const EMOTIONAL_RHYTHM_MAP_KIND_VERSION = "emotional-rhythm-map-v1" as const;

const RHYTHM_PHASE_BY_PACING_ROLE: Readonly<Record<CinematicPacingRole, EmotionalRhythmPhase>> =
  Object.freeze({
    "slow-build": "rhythm-rise",
    sustain: "rhythm-hold",
    resolve: "rhythm-release",
  });

let cachedEmotionalRhythmMap: EmotionalRhythmMap | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveRhythmPhase(pacingRole: CinematicPacingRole): EmotionalRhythmPhase {
  return RHYTHM_PHASE_BY_PACING_ROLE[pacingRole];
}

function resolveRhythmShift(fromEmotionalBeat: string, toEmotionalBeat: string): string {
  return `${fromEmotionalBeat}|${toEmotionalBeat}`;
}

function computeEmotionalRhythmBeatId(queueOrder: number, nodeId: string): string {
  return digestValue(
    [EMOTIONAL_RHYTHM_MAP_KIND_VERSION, "rhythm-beat", String(queueOrder), nodeId].join("|")
  );
}

function computeEmotionalRhythmTransitionId(
  transitionIndex: number,
  fromBeatId: string,
  toBeatId: string
): string {
  return digestValue(
    [
      EMOTIONAL_RHYTHM_MAP_KIND_VERSION,
      "rhythm-transition",
      String(transitionIndex),
      fromBeatId,
      toBeatId,
    ].join("|")
  );
}

function computeEmotionalRhythmBeatFingerprint(
  beat: Omit<EmotionalRhythmBeat, "beatFingerprint">
): string {
  return digestValue(
    [
      EMOTIONAL_RHYTHM_MAP_KIND_VERSION,
      beat.beatId,
      beat.nodeId,
      beat.evidenceId,
      String(beat.queueOrder),
      beat.segmentId,
      beat.emotionalBeat,
      beat.pacingRole,
      beat.rhythmPhase,
      String(beat.startSeconds),
      String(beat.endSeconds),
      beat.previousBeatId,
      beat.nextBeatId,
    ].join("|")
  );
}

function computeEmotionalRhythmTransitionFingerprint(
  transition: Omit<EmotionalRhythmTransition, "transitionFingerprint">
): string {
  return digestValue(
    [
      EMOTIONAL_RHYTHM_MAP_KIND_VERSION,
      transition.transitionId,
      String(transition.transitionIndex),
      String(transition.fromQueueOrder),
      String(transition.toQueueOrder),
      transition.fromBeatId,
      transition.toBeatId,
      transition.fromEmotionalBeat,
      transition.toEmotionalBeat,
      transition.fromPacingRole,
      transition.toPacingRole,
      transition.rhythmShift,
    ].join("|")
  );
}

function buildEmotionalRhythmBeat(
  node: CinematicTimelineNode,
  previousBeatId: string,
  nextBeatId: string
): EmotionalRhythmBeat {
  const beatId = computeEmotionalRhythmBeatId(node.queueOrder, node.nodeId);
  const rhythmPhase = resolveRhythmPhase(node.pacingRole);
  const baseBeat: Omit<EmotionalRhythmBeat, "beatFingerprint"> = {
    beatId,
    nodeId: node.nodeId,
    evidenceId: node.evidenceId,
    queueOrder: node.queueOrder,
    segmentId: node.segmentId,
    emotionalBeat: node.emotionalBeat,
    pacingRole: node.pacingRole,
    rhythmPhase,
    startSeconds: node.startSeconds,
    endSeconds: node.endSeconds,
    previousBeatId,
    nextBeatId,
  };

  return Object.freeze({
    ...baseBeat,
    beatFingerprint: computeEmotionalRhythmBeatFingerprint(baseBeat),
  });
}

function buildEmotionalRhythmTransition(
  edge: CinematicTimelineEdge,
  fromBeat: EmotionalRhythmBeat,
  toBeat: EmotionalRhythmBeat
): EmotionalRhythmTransition {
  const transitionId = computeEmotionalRhythmTransitionId(
    edge.edgeIndex,
    fromBeat.beatId,
    toBeat.beatId
  );
  const baseTransition: Omit<EmotionalRhythmTransition, "transitionFingerprint"> = {
    transitionId,
    transitionIndex: edge.edgeIndex,
    fromQueueOrder: edge.fromQueueOrder,
    toQueueOrder: edge.toQueueOrder,
    fromBeatId: fromBeat.beatId,
    toBeatId: toBeat.beatId,
    fromEmotionalBeat: fromBeat.emotionalBeat,
    toEmotionalBeat: toBeat.emotionalBeat,
    fromPacingRole: fromBeat.pacingRole,
    toPacingRole: toBeat.pacingRole,
    rhythmShift: resolveRhythmShift(fromBeat.emotionalBeat, toBeat.emotionalBeat),
  };

  return Object.freeze({
    ...baseTransition,
    transitionFingerprint: computeEmotionalRhythmTransitionFingerprint(baseTransition),
  });
}

export function buildEmotionalRhythmMap(
  cinematicTimelineOrchestration: CinematicTimelineOrchestration
): EmotionalRhythmMap {
  if (cachedEmotionalRhythmMap !== null) {
    return cachedEmotionalRhythmMap;
  }

  const timelineOrchestrationFingerprint = computeCinematicTimelineOrchestrationFingerprint(
    cinematicTimelineOrchestration
  );
  const orderedNodes = [...cinematicTimelineOrchestration.nodes].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const beats = Object.freeze(
    orderedNodes.map((node, index) => {
      const previousBeatId =
        index === 0
          ? ""
          : computeEmotionalRhythmBeatId(
              orderedNodes[index - 1]!.queueOrder,
              orderedNodes[index - 1]!.nodeId
            );
      const nextBeatId =
        index === orderedNodes.length - 1
          ? ""
          : computeEmotionalRhythmBeatId(
              orderedNodes[index + 1]!.queueOrder,
              orderedNodes[index + 1]!.nodeId
            );

      return buildEmotionalRhythmBeat(node, previousBeatId, nextBeatId);
    })
  );

  const beatByQueueOrder = new Map(beats.map((beat) => [beat.queueOrder, beat]));

  const transitions = Object.freeze(
    cinematicTimelineOrchestration.edges.map((edge) => {
      const fromBeat = beatByQueueOrder.get(edge.fromQueueOrder);
      const toBeat = beatByQueueOrder.get(edge.toQueueOrder);
      if (fromBeat === undefined || toBeat === undefined) {
        throw new Error("Emotional rhythm transition requires resolved source and target beats");
      }
      return buildEmotionalRhythmTransition(edge, fromBeat, toBeat);
    })
  );

  const rhythmMap = Object.freeze({
    version: EMOTIONAL_RHYTHM_MAP_VERSION,
    rhythmMapId: EMOTIONAL_RHYTHM_MAP_ID,
    orchestrationId: cinematicTimelineOrchestration.orchestrationId,
    timelineOrchestrationFingerprint,
    sourceFingerprint: cinematicTimelineOrchestration.sourceFingerprint,
    rhythmMapBindingVersion: EMOTIONAL_RHYTHM_MAP_KIND_VERSION,
    activeRhythmMapState: EMOTIONAL_RHYTHM_MAP_STATE,
    beats,
    transitions,
  });

  cachedEmotionalRhythmMap = rhythmMap;
  return rhythmMap;
}

export const EMOTIONAL_RHYTHM_BEAT_KEY_ORDER = Object.freeze([
  "beatId",
  "nodeId",
  "evidenceId",
  "queueOrder",
  "segmentId",
  "emotionalBeat",
  "pacingRole",
  "rhythmPhase",
  "startSeconds",
  "endSeconds",
  "previousBeatId",
  "nextBeatId",
  "beatFingerprint",
] as const);

export const EMOTIONAL_RHYTHM_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "transitionIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromBeatId",
  "toBeatId",
  "fromEmotionalBeat",
  "toEmotionalBeat",
  "fromPacingRole",
  "toPacingRole",
  "rhythmShift",
  "transitionFingerprint",
] as const);

export const EMOTIONAL_RHYTHM_MAP_KEY_ORDER = Object.freeze([
  "version",
  "rhythmMapId",
  "orchestrationId",
  "timelineOrchestrationFingerprint",
  "sourceFingerprint",
  "rhythmMapBindingVersion",
  "activeRhythmMapState",
  "beats",
  "transitions",
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

export function serializeEmotionalRhythmMap(rhythmMap: EmotionalRhythmMap): string {
  const orderedBeats = [...rhythmMap.beats]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((beat) => orderRecord(beat, EMOTIONAL_RHYTHM_BEAT_KEY_ORDER));

  const orderedTransitions = [...rhythmMap.transitions]
    .sort((a, b) => a.transitionIndex - b.transitionIndex)
    .map((transition) => orderRecord(transition, EMOTIONAL_RHYTHM_TRANSITION_KEY_ORDER));

  const orderedRhythmMap: Record<string, unknown> = {};
  for (const key of EMOTIONAL_RHYTHM_MAP_KEY_ORDER) {
    if (key === "beats") {
      orderedRhythmMap.beats = orderedBeats;
    } else if (key === "transitions") {
      orderedRhythmMap.transitions = orderedTransitions;
    } else {
      orderedRhythmMap[key] = rhythmMap[key as keyof EmotionalRhythmMap];
    }
  }

  return JSON.stringify(orderedRhythmMap);
}

export function computeEmotionalRhythmMapFingerprint(rhythmMap: EmotionalRhythmMap): string {
  return digestValue(serializeEmotionalRhythmMap(rhythmMap));
}

export function resetEmotionalRhythmMapCacheForVerification(): void {
  cachedEmotionalRhythmMap = null;
}
