import { REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE } from "./real-visual-timeline-flow.fixtures.ts";
import {
  buildRealVisualRhythmMap,
  computeRealVisualRhythmMapFingerprint,
} from "./real-visual-rhythm-map.ts";

export const REAL_VISUAL_RHYTHM_MAP_INPUT_EXAMPLE = Object.freeze({
  realVisualTimelineFlow: REAL_VISUAL_TIMELINE_FLOW_OUTPUT_EXAMPLE,
});

export const REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE = buildRealVisualRhythmMap(
  REAL_VISUAL_RHYTHM_MAP_INPUT_EXAMPLE.realVisualTimelineFlow
);

export const REAL_VISUAL_RHYTHM_MAP_FINGERPRINT = computeRealVisualRhythmMapFingerprint(
  REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE
);

export const REAL_VISUAL_RHYTHM_BEAT_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  pacingRole: "slow-build" as const,
  rhythmPhase: "rhythm-rise" as const,
  visualEnergy: "low" as const,
  cutPressure: "soft" as const,
});

export const REAL_VISUAL_RHYTHM_TRANSITION_OUTPUT_EXAMPLE = Object.freeze({
  fromQueueOrder: 0,
  toQueueOrder: 1,
  rhythmShift: "rhythm-rise|rhythm-hold",
  emotionShift: "nostalgic-calm-to-adventurous-soft",
  pacingShift: "slow-build-to-sustain",
});

export const REAL_VISUAL_RHYTHM_MAP_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  rhythmMapId: REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE.rhythmMapId,
  rhythmMapVersion: "real-visual-rhythm-map-v1" as const,
  activeRhythmMapState: "25s-real-visual-rhythm-map-metadata-only",
  rhythmStatus: REAL_VISUAL_RHYTHM_MAP_OUTPUT_EXAMPLE.rhythmStatus,
  beatCount: 3,
  transitionCount: 2,
});
