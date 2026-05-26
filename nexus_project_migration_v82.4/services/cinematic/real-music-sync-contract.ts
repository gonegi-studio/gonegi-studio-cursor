import crypto from "crypto";
import type {
  RealVisualRhythmBeat,
  RealVisualRhythmMap,
  RealVisualRhythmPhase,
  RealVisualRhythmTransition,
} from "./real-visual-rhythm-map.ts";
import {
  REAL_VISUAL_RHYTHM_MAP_BEAT_COUNT,
  REAL_VISUAL_RHYTHM_MAP_TRANSITION_COUNT,
  computeRealVisualRhythmMapFingerprint,
} from "./real-visual-rhythm-map.ts";

export type RealSuggestedMusicEnergy = "gentle-build" | "steady-flow" | "soft-resolve";
export type RealSuggestedBeatDensity = "sparse" | "medium";

export type RealMusicSyncStatus = "sync-complete" | "sync-blocked" | "sync-mismatch";

export type RealMusicSyncCue = {
  cueId: string;
  queueOrder: number;
  timestampSeconds: string;
  rhythmPhase: RealVisualRhythmPhase;
  visualEnergy: RealVisualRhythmBeat["visualEnergy"];
  cutPressure: RealVisualRhythmBeat["cutPressure"];
  emotionTone: RealVisualRhythmBeat["emotionTone"];
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  suggestedBeatDensity: RealSuggestedBeatDensity;
};

export type RealMusicSyncTransition = {
  transitionId: string;
  fromQueueOrder: number;
  toQueueOrder: number;
  rhythmShift: string;
  suggestedTransitionCue: string;
};

export type RealMusicSyncContract = {
  version: "v1";
  musicSyncContractId: string;
  rhythmMapId: string;
  rhythmMapFingerprint: string;
  syncContractVersion: typeof REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION;
  activeSyncContractState: string;
  syncStatus: RealMusicSyncStatus;
  cueCount: typeof REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT;
  transitionCount: typeof REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT;
  cues: readonly RealMusicSyncCue[];
  transitions: readonly RealMusicSyncTransition[];
  audioAnalysisExecuted: false;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_MUSIC_SYNC_CONTRACT_VERSION = "v1" as const;
export const REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION = "real-music-sync-contract-v1" as const;
export const REAL_MUSIC_SYNC_CONTRACT_ROOT_ID =
  "real-music-sync-contract-gonegi-harbor-25s-v1" as const;
export const REAL_MUSIC_SYNC_CONTRACT_STATE =
  "25s-real-music-sync-contract-metadata-only" as const;
export const REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT = 3 as const;
export const REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT = 2 as const;

export const REAL_SUGGESTED_MUSIC_ENERGY_BY_RHYTHM_PHASE: Readonly<
  Record<RealVisualRhythmPhase, RealSuggestedMusicEnergy>
> = Object.freeze({
  "rhythm-rise": "gentle-build",
  "rhythm-hold": "steady-flow",
  "rhythm-release": "soft-resolve",
});

export const REAL_SUGGESTED_BEAT_DENSITY_BY_RHYTHM_PHASE: Readonly<
  Record<RealVisualRhythmPhase, RealSuggestedBeatDensity>
> = Object.freeze({
  "rhythm-rise": "sparse",
  "rhythm-hold": "medium",
  "rhythm-release": "sparse",
});

export const REAL_MUSIC_SYNC_CONTRACT_KEY_ORDER = Object.freeze([
  "version",
  "musicSyncContractId",
  "rhythmMapId",
  "rhythmMapFingerprint",
  "syncContractVersion",
  "activeSyncContractState",
  "syncStatus",
  "cueCount",
  "transitionCount",
  "cues",
  "transitions",
  "audioAnalysisExecuted",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_MUSIC_SYNC_CUE_KEY_ORDER = Object.freeze([
  "cueId",
  "queueOrder",
  "timestampSeconds",
  "rhythmPhase",
  "visualEnergy",
  "cutPressure",
  "emotionTone",
  "suggestedMusicEnergy",
  "suggestedBeatDensity",
] as const);

export const REAL_MUSIC_SYNC_TRANSITION_KEY_ORDER = Object.freeze([
  "transitionId",
  "fromQueueOrder",
  "toQueueOrder",
  "rhythmShift",
  "suggestedTransitionCue",
] as const);

let cachedRealMusicSyncContract: RealMusicSyncContract | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveSuggestedMusicEnergy(rhythmPhase: RealVisualRhythmPhase): RealSuggestedMusicEnergy {
  return REAL_SUGGESTED_MUSIC_ENERGY_BY_RHYTHM_PHASE[rhythmPhase];
}

function resolveSuggestedBeatDensity(rhythmPhase: RealVisualRhythmPhase): RealSuggestedBeatDensity {
  return REAL_SUGGESTED_BEAT_DENSITY_BY_RHYTHM_PHASE[rhythmPhase];
}

function computeMusicSyncContractId(rhythmMapId: string, rhythmMapFingerprint: string): string {
  return digestValue(
    [
      REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION,
      "music-sync-contract",
      rhythmMapId,
      rhythmMapFingerprint,
    ].join("|")
  );
}

function computeMusicSyncCueId(queueOrder: number, beatId: string): string {
  return digestValue(
    [REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION, "music-sync-cue", String(queueOrder), beatId].join("|")
  );
}

function computeMusicSyncTransitionId(
  fromQueueOrder: number,
  toQueueOrder: number,
  fromCueId: string,
  toCueId: string
): string {
  return digestValue(
    [
      REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION,
      "music-sync-transition",
      String(fromQueueOrder),
      String(toQueueOrder),
      fromCueId,
      toCueId,
    ].join("|")
  );
}

function computeSuggestedTransitionCue(
  fromMusicEnergy: RealSuggestedMusicEnergy,
  toMusicEnergy: RealSuggestedMusicEnergy
): string {
  return `${fromMusicEnergy}-to-${toMusicEnergy}`;
}

function resolveSyncBlockedReason(rhythmMap: RealVisualRhythmMap): string | null {
  if (rhythmMap.rhythmStatus !== "rhythm-complete") {
    return "rhythm-map-not-complete";
  }
  if (rhythmMap.beats.length !== REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT) {
    return "beat-count-mismatch";
  }
  if (rhythmMap.transitions.length !== REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT) {
    return "transition-count-mismatch";
  }
  return null;
}

function buildMusicSyncCue(beat: RealVisualRhythmBeat): RealMusicSyncCue {
  return Object.freeze({
    cueId: computeMusicSyncCueId(beat.queueOrder, beat.beatId),
    queueOrder: beat.queueOrder,
    timestampSeconds: beat.timestampSeconds,
    rhythmPhase: beat.rhythmPhase,
    visualEnergy: beat.visualEnergy,
    cutPressure: beat.cutPressure,
    emotionTone: beat.emotionTone,
    suggestedMusicEnergy: resolveSuggestedMusicEnergy(beat.rhythmPhase),
    suggestedBeatDensity: resolveSuggestedBeatDensity(beat.rhythmPhase),
  });
}

function buildMusicSyncTransition(
  rhythmTransition: RealVisualRhythmTransition,
  fromCue: RealMusicSyncCue,
  toCue: RealMusicSyncCue
): RealMusicSyncTransition {
  return Object.freeze({
    transitionId: computeMusicSyncTransitionId(
      rhythmTransition.fromQueueOrder,
      rhythmTransition.toQueueOrder,
      fromCue.cueId,
      toCue.cueId
    ),
    fromQueueOrder: rhythmTransition.fromQueueOrder,
    toQueueOrder: rhythmTransition.toQueueOrder,
    rhythmShift: rhythmTransition.rhythmShift,
    suggestedTransitionCue: computeSuggestedTransitionCue(
      fromCue.suggestedMusicEnergy,
      toCue.suggestedMusicEnergy
    ),
  });
}

function resolveSyncStatus(
  syncBlocked: boolean,
  cues: readonly RealMusicSyncCue[],
  transitions: readonly RealMusicSyncTransition[]
): RealMusicSyncStatus {
  if (syncBlocked) {
    return "sync-blocked";
  }

  const queueOrderValid = cues.every((cue, index) => cue.queueOrder === index);
  const mappingValid = cues.every(
    (cue) =>
      cue.suggestedMusicEnergy === resolveSuggestedMusicEnergy(cue.rhythmPhase) &&
      cue.suggestedBeatDensity === resolveSuggestedBeatDensity(cue.rhythmPhase)
  );
  const transitionCountValid = transitions.length === REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT;

  if (
    !queueOrderValid ||
    !mappingValid ||
    !transitionCountValid ||
    cues.length !== REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT
  ) {
    return "sync-mismatch";
  }

  return "sync-complete";
}

function buildRealMusicSyncContractInternal(
  realVisualRhythmMap: RealVisualRhythmMap
): RealMusicSyncContract {
  const syncBlockedReason = resolveSyncBlockedReason(realVisualRhythmMap);
  const syncBlocked = syncBlockedReason !== null;

  const cues = Object.freeze(
    syncBlocked
      ? ([] as RealMusicSyncCue[])
      : [...realVisualRhythmMap.beats]
          .sort((a, b) => a.queueOrder - b.queueOrder)
          .map((beat) => buildMusicSyncCue(beat))
  );

  const cueByQueue = new Map(cues.map((cue) => [cue.queueOrder, cue] as const));
  const transitions = Object.freeze(
    syncBlocked
      ? ([] as RealMusicSyncTransition[])
      : realVisualRhythmMap.transitions
          .map((rhythmTransition) => {
            const fromCue = cueByQueue.get(rhythmTransition.fromQueueOrder);
            const toCue = cueByQueue.get(rhythmTransition.toQueueOrder);
            if (fromCue === undefined || toCue === undefined) {
              return null;
            }
            return buildMusicSyncTransition(rhythmTransition, fromCue, toCue);
          })
          .filter((transition): transition is RealMusicSyncTransition => transition !== null)
  );

  const rhythmMapFingerprint = computeRealVisualRhythmMapFingerprint(realVisualRhythmMap);

  return Object.freeze({
    version: REAL_MUSIC_SYNC_CONTRACT_VERSION,
    musicSyncContractId: computeMusicSyncContractId(
      realVisualRhythmMap.rhythmMapId,
      rhythmMapFingerprint
    ),
    rhythmMapId: realVisualRhythmMap.rhythmMapId,
    rhythmMapFingerprint,
    syncContractVersion: REAL_MUSIC_SYNC_CONTRACT_KIND_VERSION,
    activeSyncContractState: REAL_MUSIC_SYNC_CONTRACT_STATE,
    syncStatus: resolveSyncStatus(syncBlocked, cues, transitions),
    cueCount: REAL_MUSIC_SYNC_CONTRACT_CUE_COUNT,
    transitionCount: REAL_MUSIC_SYNC_CONTRACT_TRANSITION_COUNT,
    cues,
    transitions,
    audioAnalysisExecuted: false,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealMusicSyncContract(
  realVisualRhythmMap: RealVisualRhythmMap
): RealMusicSyncContract {
  if (cachedRealMusicSyncContract !== null) {
    return cachedRealMusicSyncContract;
  }

  const contract = buildRealMusicSyncContractInternal(realVisualRhythmMap);
  cachedRealMusicSyncContract = contract;
  return contract;
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

export function serializeRealMusicSyncContract(contract: RealMusicSyncContract): string {
  const orderedCues = [...contract.cues]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((cue) => orderRecord(cue, REAL_MUSIC_SYNC_CUE_KEY_ORDER));

  const orderedTransitions = [...contract.transitions]
    .sort((a, b) => a.fromQueueOrder - b.fromQueueOrder)
    .map((transition) => orderRecord(transition, REAL_MUSIC_SYNC_TRANSITION_KEY_ORDER));

  const orderedContract: Record<string, unknown> = {};
  for (const key of REAL_MUSIC_SYNC_CONTRACT_KEY_ORDER) {
    if (key === "cues") {
      orderedContract.cues = orderedCues;
    } else if (key === "transitions") {
      orderedContract.transitions = orderedTransitions;
    } else {
      orderedContract[key] = contract[key as keyof RealMusicSyncContract];
    }
  }

  return JSON.stringify(orderedContract);
}

export function computeRealMusicSyncContractFingerprint(contract: RealMusicSyncContract): string {
  return digestValue(serializeRealMusicSyncContract(contract));
}

export function resetRealMusicSyncContractCacheForVerification(): void {
  cachedRealMusicSyncContract = null;
}

export function resolveRealMusicSyncMappingForRhythmPhase(rhythmPhase: RealVisualRhythmPhase): {
  suggestedMusicEnergy: RealSuggestedMusicEnergy;
  suggestedBeatDensity: RealSuggestedBeatDensity;
} {
  return Object.freeze({
    suggestedMusicEnergy: resolveSuggestedMusicEnergy(rhythmPhase),
    suggestedBeatDensity: resolveSuggestedBeatDensity(rhythmPhase),
  });
}
