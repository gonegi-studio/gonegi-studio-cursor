import crypto from "crypto";
import type {
  EmotionalRhythmBeat,
  EmotionalRhythmMap,
  EmotionalRhythmPhase,
  EmotionalRhythmTransition,
} from "./emotional-rhythm-map.ts";
import { computeEmotionalRhythmMapFingerprint } from "./emotional-rhythm-map.ts";
import type { MusicEnergy } from "./sequence-composer.ts";

export type MusicCutPressure = "soft" | "moderate" | "gentle";

export type MusicTimingCue = {
  cueId: string;
  queueOrder: number;
  segmentId: string;
  startSeconds: number;
  endSeconds: number;
  rhythmPhase: EmotionalRhythmPhase;
  emotionalBeat: string;
  suggestedMusicEnergy: MusicEnergy;
  suggestedCutPressure: MusicCutPressure;
  cueFingerprint: string;
};

export type MusicTimingTransition = {
  transitionId: string;
  transitionIndex: number;
  fromQueueOrder: number;
  toQueueOrder: number;
  fromCueId: string;
  toCueId: string;
  rhythmShift: string;
  transitionFingerprint: string;
};

export type MusicTimingContract = {
  version: "v1";
  contractId: string;
  rhythmMapId: string;
  emotionalRhythmMapFingerprint: string;
  sourceFingerprint: string;
  timingContractVersion: typeof MUSIC_TIMING_CONTRACT_KIND_VERSION;
  activeContractState: string;
  cues: readonly MusicTimingCue[];
  transitions: readonly MusicTimingTransition[];
};

export const MUSIC_TIMING_CONTRACT_VERSION = "v1" as const;
export const MUSIC_TIMING_CONTRACT_ID = "music-timing-contract-gonegi-harbor-25s-v1" as const;
export const MUSIC_TIMING_CONTRACT_STATE = "25s-music-timing-contract-metadata-only" as const;
export const MUSIC_TIMING_CONTRACT_KIND_VERSION = "music-timing-contract-v1" as const;

const SUGGESTED_MUSIC_ENERGY_BY_RHYTHM_PHASE: Readonly<Record<EmotionalRhythmPhase, MusicEnergy>> =
  Object.freeze({
    "rhythm-rise": "low",
    "rhythm-hold": "medium",
    "rhythm-release": "low",
  });

const SUGGESTED_CUT_PRESSURE_BY_RHYTHM_PHASE: Readonly<
  Record<EmotionalRhythmPhase, MusicCutPressure>
> = Object.freeze({
  "rhythm-rise": "soft",
  "rhythm-hold": "moderate",
  "rhythm-release": "gentle",
});

let cachedMusicTimingContract: MusicTimingContract | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function computeMusicTimingCueId(queueOrder: number, beatId: string): string {
  return digestValue(
    [MUSIC_TIMING_CONTRACT_KIND_VERSION, "music-cue", String(queueOrder), beatId].join("|")
  );
}

function computeMusicTimingTransitionId(
  transitionIndex: number,
  fromCueId: string,
  toCueId: string
): string {
  return digestValue(
    [
      MUSIC_TIMING_CONTRACT_KIND_VERSION,
      "music-transition",
      String(transitionIndex),
      fromCueId,
      toCueId,
    ].join("|")
  );
}

function computeMusicTimingCueFingerprint(
  cue: Omit<MusicTimingCue, "cueFingerprint">
): string {
  return digestValue(
    [
      MUSIC_TIMING_CONTRACT_KIND_VERSION,
      cue.cueId,
      String(cue.queueOrder),
      cue.segmentId,
      String(cue.startSeconds),
      String(cue.endSeconds),
      cue.rhythmPhase,
      cue.emotionalBeat,
      cue.suggestedMusicEnergy,
      cue.suggestedCutPressure,
    ].join("|")
  );
}

function computeMusicTimingTransitionFingerprint(
  transition: Omit<MusicTimingTransition, "transitionFingerprint">
): string {
  return digestValue(
    [
      MUSIC_TIMING_CONTRACT_KIND_VERSION,
      transition.transitionId,
      String(transition.transitionIndex),
      String(transition.fromQueueOrder),
      String(transition.toQueueOrder),
      transition.fromCueId,
      transition.toCueId,
      transition.rhythmShift,
    ].join("|")
  );
}

function buildMusicTimingCue(beat: EmotionalRhythmBeat): MusicTimingCue {
  const cueId = computeMusicTimingCueId(beat.queueOrder, beat.beatId);
  const baseCue: Omit<MusicTimingCue, "cueFingerprint"> = {
    cueId,
    queueOrder: beat.queueOrder,
    segmentId: beat.segmentId,
    startSeconds: beat.startSeconds,
    endSeconds: beat.endSeconds,
    rhythmPhase: beat.rhythmPhase,
    emotionalBeat: beat.emotionalBeat,
    suggestedMusicEnergy: SUGGESTED_MUSIC_ENERGY_BY_RHYTHM_PHASE[beat.rhythmPhase],
    suggestedCutPressure: SUGGESTED_CUT_PRESSURE_BY_RHYTHM_PHASE[beat.rhythmPhase],
  };

  return Object.freeze({
    ...baseCue,
    cueFingerprint: computeMusicTimingCueFingerprint(baseCue),
  });
}

function buildMusicTimingTransition(
  rhythmTransition: EmotionalRhythmTransition,
  fromCue: MusicTimingCue,
  toCue: MusicTimingCue
): MusicTimingTransition {
  const transitionId = computeMusicTimingTransitionId(
    rhythmTransition.transitionIndex,
    fromCue.cueId,
    toCue.cueId
  );
  const baseTransition: Omit<MusicTimingTransition, "transitionFingerprint"> = {
    transitionId,
    transitionIndex: rhythmTransition.transitionIndex,
    fromQueueOrder: rhythmTransition.fromQueueOrder,
    toQueueOrder: rhythmTransition.toQueueOrder,
    fromCueId: fromCue.cueId,
    toCueId: toCue.cueId,
    rhythmShift: rhythmTransition.rhythmShift,
  };

  return Object.freeze({
    ...baseTransition,
    transitionFingerprint: computeMusicTimingTransitionFingerprint(baseTransition),
  });
}

export function buildMusicTimingContract(
  emotionalRhythmMap: EmotionalRhythmMap
): MusicTimingContract {
  if (cachedMusicTimingContract !== null) {
    return cachedMusicTimingContract;
  }

  const emotionalRhythmMapFingerprint = computeEmotionalRhythmMapFingerprint(emotionalRhythmMap);
  const orderedBeats = [...emotionalRhythmMap.beats].sort((a, b) => a.queueOrder - b.queueOrder);

  const cues = Object.freeze(orderedBeats.map((beat) => buildMusicTimingCue(beat)));
  const cueByQueueOrder = new Map(cues.map((cue) => [cue.queueOrder, cue]));

  const transitions = Object.freeze(
    emotionalRhythmMap.transitions.map((rhythmTransition) => {
      const fromCue = cueByQueueOrder.get(rhythmTransition.fromQueueOrder);
      const toCue = cueByQueueOrder.get(rhythmTransition.toQueueOrder);
      if (fromCue === undefined || toCue === undefined) {
        throw new Error("Music timing transition requires resolved source and target cues");
      }
      return buildMusicTimingTransition(rhythmTransition, fromCue, toCue);
    })
  );

  const contract = Object.freeze({
    version: MUSIC_TIMING_CONTRACT_VERSION,
    contractId: MUSIC_TIMING_CONTRACT_ID,
    rhythmMapId: emotionalRhythmMap.rhythmMapId,
    emotionalRhythmMapFingerprint,
    sourceFingerprint: emotionalRhythmMap.sourceFingerprint,
    timingContractVersion: MUSIC_TIMING_CONTRACT_KIND_VERSION,
    activeContractState: MUSIC_TIMING_CONTRACT_STATE,
    cues,
    transitions,
  });

  cachedMusicTimingContract = contract;
  return contract;
}

export const MUSIC_TIMING_CUE_KEY_ORDER = Object.freeze([
  "cueId",
  "queueOrder",
  "segmentId",
  "startSeconds",
  "endSeconds",
  "rhythmPhase",
  "emotionalBeat",
  "suggestedMusicEnergy",
  "suggestedCutPressure",
  "cueFingerprint",
] as const);

export const MUSIC_TIMING_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "transitionIndex",
  "fromQueueOrder",
  "toQueueOrder",
  "fromCueId",
  "toCueId",
  "rhythmShift",
  "transitionFingerprint",
] as const);

export const MUSIC_TIMING_CONTRACT_KEY_ORDER = Object.freeze([
  "version",
  "contractId",
  "rhythmMapId",
  "emotionalRhythmMapFingerprint",
  "sourceFingerprint",
  "timingContractVersion",
  "activeContractState",
  "cues",
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

export function serializeMusicTimingContract(contract: MusicTimingContract): string {
  const orderedCues = [...contract.cues]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((cue) => orderRecord(cue, MUSIC_TIMING_CUE_KEY_ORDER));

  const orderedTransitions = [...contract.transitions]
    .sort((a, b) => a.transitionIndex - b.transitionIndex)
    .map((transition) => orderRecord(transition, MUSIC_TIMING_TRANSITION_KEY_ORDER));

  const orderedContract: Record<string, unknown> = {};
  for (const key of MUSIC_TIMING_CONTRACT_KEY_ORDER) {
    if (key === "cues") {
      orderedContract.cues = orderedCues;
    } else if (key === "transitions") {
      orderedContract.transitions = orderedTransitions;
    } else {
      orderedContract[key] = contract[key as keyof MusicTimingContract];
    }
  }

  return JSON.stringify(orderedContract);
}

export function computeMusicTimingContractFingerprint(contract: MusicTimingContract): string {
  return digestValue(serializeMusicTimingContract(contract));
}

export function resetMusicTimingContractCacheForVerification(): void {
  cachedMusicTimingContract = null;
}
