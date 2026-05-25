import { EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE } from "./emotional-rhythm-map.fixtures.ts";
import {
  buildMusicTimingContract,
  computeMusicTimingContractFingerprint,
} from "./music-timing-contract.ts";

export const MUSIC_TIMING_CONTRACT_INPUT_EXAMPLE = EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE;

export const MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE = buildMusicTimingContract(
  MUSIC_TIMING_CONTRACT_INPUT_EXAMPLE
);

export const MUSIC_TIMING_CONTRACT_FINGERPRINT = computeMusicTimingContractFingerprint(
  MUSIC_TIMING_CONTRACT_OUTPUT_EXAMPLE
);

export const MUSIC_TIMING_CUE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  startSeconds: 0,
  endSeconds: 8,
  rhythmPhase: "rhythm-rise" as const,
  emotionalBeat: "nostalgic-calm",
  suggestedMusicEnergy: "low" as const,
  suggestedCutPressure: "soft" as const,
});

export const MUSIC_TIMING_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  transitionIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "nostalgic-calm|reflective-bridge",
});

export const MUSIC_TIMING_CONTRACT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  contractId: "music-timing-contract-gonegi-harbor-25s-v1",
  timingContractVersion: "music-timing-contract-v1" as const,
  activeContractState: "25s-music-timing-contract-metadata-only",
});
