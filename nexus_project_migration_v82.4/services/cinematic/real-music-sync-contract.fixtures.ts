import { REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE } from "./real-visual-rhythm-map.fixtures.ts";
import {
  buildRealMusicSyncContract,
  computeRealMusicSyncContractFingerprint,
} from "./real-music-sync-contract.ts";

export const REAL_MUSIC_SYNC_CONTRACT_INPUT_EXAMPLE = Object.freeze({
  realVisualRhythmMap: REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE,
});

export const REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE = buildRealMusicSyncContract(
  REAL_MUSIC_SYNC_CONTRACT_INPUT_EXAMPLE.realVisualRhythmMap
);

export const REAL_MUSIC_SYNC_CONTRACT_FINGERPRINT = computeRealMusicSyncContractFingerprint(
  REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE
);

export const REAL_MUSIC_SYNC_CUE_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  rhythmPhase: "rhythm-rise" as const,
  suggestedMusicEnergy: "gentle-build" as const,
  suggestedBeatDensity: "sparse" as const,
});

export const REAL_MUSIC_SYNC_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "rhythm-rise|rhythm-hold",
  suggestedTransitionCue: "gentle-build-to-steady-flow",
});

export const REAL_MUSIC_SYNC_CONTRACT_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  musicSyncContractId: REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE.musicSyncContractId,
  syncContractVersion: "real-music-sync-contract-v1" as const,
  activeSyncContractState: "25s-real-music-sync-contract-metadata-only",
  syncStatus: REAL_MUSIC_SYNC_CONTRACT_OUTPUT_EXAMPLE.syncStatus,
  cueCount: 3,
  transitionCount: 2,
});
