import { REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE } from "./real-frame-evidence-registry.fixtures.ts";
import { REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE } from "./real-music-drama-scene-plan.fixtures.ts";
import {
  buildRealImageAppInputPackage,
  computeRealImageAppInputPackageFingerprint,
} from "./real-image-app-input-package.ts";

export const REAL_IMAGE_APP_INPUT_PACKAGE_INPUT_EXAMPLE = Object.freeze({
  realMusicDramaScenePlan: REAL_MUSIC_DRAMA_SCENE_PLAN_OUTPUT_EXAMPLE,
  realFrameEvidenceRegistry: REAL_FRAME_EVIDENCE_REGISTRY_OUTPUT_EXAMPLE,
});

export const REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE = buildRealImageAppInputPackage(
  REAL_IMAGE_APP_INPUT_PACKAGE_INPUT_EXAMPLE.realMusicDramaScenePlan,
  REAL_IMAGE_APP_INPUT_PACKAGE_INPUT_EXAMPLE.realFrameEvidenceRegistry
);

export const REAL_IMAGE_APP_INPUT_PACKAGE_FINGERPRINT = computeRealImageAppInputPackageFingerprint(
  REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE
);

export const REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_OUTPUT_EXAMPLE = Object.freeze({
  queueOrder: 0,
  timestampSeconds: "4.000",
  dramaFunction: "real-frame-establish" as const,
  rhythmPhase: "rhythm-rise" as const,
  suggestedMusicEnergy: "gentle-build" as const,
});

export const REAL_IMAGE_APP_INPUT_PACKAGE_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  realInputPackageId: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE.realInputPackageId,
  packageVersion: "real-image-app-input-package-v1" as const,
  activePackageState: "25s-real-image-app-input-package-metadata-only",
  packageStatus: REAL_IMAGE_APP_INPUT_PACKAGE_OUTPUT_EXAMPLE.packageStatus,
  itemCount: 3,
});
