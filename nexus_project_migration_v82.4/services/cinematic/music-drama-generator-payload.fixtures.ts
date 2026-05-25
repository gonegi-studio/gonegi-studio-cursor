import { MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE } from "./music-drama-prompt-brief.fixtures.ts";
import {
  buildMusicDramaGeneratorPayload,
  computeMusicDramaGeneratorPayloadFingerprint,
} from "./music-drama-generator-payload.ts";

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_INPUT_EXAMPLE = MUSIC_DRAMA_PROMPT_BRIEF_OUTPUT_EXAMPLE;

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE = buildMusicDramaGeneratorPayload(
  MUSIC_DRAMA_GENERATOR_PAYLOAD_INPUT_EXAMPLE
);

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_FINGERPRINT = computeMusicDramaGeneratorPayloadFingerprint(
  MUSIC_DRAMA_GENERATOR_PAYLOAD_OUTPUT_EXAMPLE
);

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  segmentId: "segment-001",
  mode: "image" as const,
  promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
  continuityAnchor: "continuity-anchor-segment-001",
  outputSlot: "generator-output-slot-segment-001-queue-000",
  adapterHint: "generic-image-adapter-v1",
});

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  generatorPayloadId: "music-drama-generator-payload-gonegi-harbor-25s-v1",
  generatorPayloadVersion: "music-drama-generator-payload-v1" as const,
  activeGeneratorPayloadState: "25s-music-drama-generator-payload-metadata-only",
});
