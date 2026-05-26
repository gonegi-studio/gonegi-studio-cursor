import { REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE } from "./real-image-app-input-package.fixtures.ts";
import {
  buildRealMotionBridgeTimeline,
  computeRealMotionBridgeTimelineFingerprint,
} from "./real-motion-bridge-timeline.ts";

export const REAL_MOTION_BRIDGE_TIMELINE_INPUT_EXAMPLE = Object.freeze({
  realImageAppInputPackage: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE,
});

export const REAL_MOTION_BRIDGE_TIMELINE_OUTPUT_EXAMPLE = buildRealMotionBridgeTimeline(
  REAL_MOTION_BRIDGE_TIMELINE_INPUT_EXAMPLE.realImageAppInputPackage
);

export const REAL_MOTION_BRIDGE_TIMELINE_FINGERPRINT = computeRealMotionBridgeTimelineFingerprint(
  REAL_MOTION_BRIDGE_TIMELINE_OUTPUT_EXAMPLE
);
