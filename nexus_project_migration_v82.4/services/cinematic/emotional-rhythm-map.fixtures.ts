import { CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE } from "./cinematic-timeline-orchestration.fixtures.ts";
import {
  buildEmotionalRhythmMap,
  computeEmotionalRhythmMapFingerprint,
} from "./emotional-rhythm-map.ts";

export const EMOTIONAL_RHYTHM_MAP_INPUT_EXAMPLE = CINEMATIC_TIMELINE_ORCHESTRATION_OUTPUT_EXAMPLE;

export const EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE = buildEmotionalRhythmMap(
  EMOTIONAL_RHYTHM_MAP_INPUT_EXAMPLE
);

export const EMOTIONAL_RHYTHM_MAP_FINGERPRINT = computeEmotionalRhythmMapFingerprint(
  EMOTIONAL_RHYTHM_MAP_OUTPUT_EXAMPLE
);

export const EMOTIONAL_RHYTHM_BEAT_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  emotionalBeat: "nostalgic-calm",
  pacingRole: "slow-build" as const,
  rhythmPhase: "rhythm-rise" as const,
  previousBeatId: "",
  startSeconds: 0,
  endSeconds: 8,
});

export const EMOTIONAL_RHYTHM_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  transitionIndex: 0,
  fromQueueOrder: 0,
  toQueueOrder: 1,
  fromEmotionalBeat: "nostalgic-calm",
  toEmotionalBeat: "reflective-bridge",
  rhythmShift: "nostalgic-calm|reflective-bridge",
});

export const EMOTIONAL_RHYTHM_MAP_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  rhythmMapId: "emotional-rhythm-map-gonegi-harbor-25s-v1",
  rhythmMapBindingVersion: "emotional-rhythm-map-v1" as const,
  activeRhythmMapState: "25s-emotional-rhythm-map-metadata-only",
});
