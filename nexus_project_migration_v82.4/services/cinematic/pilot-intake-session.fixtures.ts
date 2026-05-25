import { PILOT_VIDEO_MANIFEST_OUTPUT_EXAMPLE } from "./pilot-intake-schema.fixtures.ts";
import { buildPilotIntakeSession } from "./pilot-intake-session.ts";

export const PILOT_INTAKE_SESSION_INPUT_EXAMPLE = PILOT_VIDEO_MANIFEST_OUTPUT_EXAMPLE;

export const PILOT_INTAKE_SESSION_OUTPUT_EXAMPLE = buildPilotIntakeSession(
  PILOT_INTAKE_SESSION_INPUT_EXAMPLE
);

export const PILOT_INTAKE_SESSION_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  itemId: "pilot-intake-session-item-001",
  manifestId: "pilot-video-manifest-gonegi-harbor-25s-v1",
  segmentId: "segment-001",
  segmentSlug: "harbor-opening-hold",
  orderIndex: 0,
  durationSec: 8,
  status: "ready" as const,
});
