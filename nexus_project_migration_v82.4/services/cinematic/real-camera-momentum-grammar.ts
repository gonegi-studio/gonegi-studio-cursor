import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealCameraMomentumGrammarFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  cameraAcceleration: number;
  cinematicInertia: number;
  easingCurve: readonly number[];
  movementMomentum: number;
  shotTransitionForce: number;
};

export type RealCameraMomentumGrammar = {
  version: "v1";
  grammarId: string;
  inputPackageId: string;
  grammarVersion: typeof REAL_CAMERA_MOMENTUM_GRAMMAR_KIND_VERSION;
  activeGrammarState: string;
  frameCount: typeof REAL_CAMERA_MOMENTUM_GRAMMAR_FRAME_COUNT;
  frames: readonly RealCameraMomentumGrammarFrame[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_CAMERA_MOMENTUM_GRAMMAR_VERSION = "v1" as const;
export const REAL_CAMERA_MOMENTUM_GRAMMAR_KIND_VERSION =
  "real-camera-momentum-grammar-v1" as const;
export const REAL_CAMERA_MOMENTUM_GRAMMAR_ROOT_ID =
  "real-camera-momentum-grammar-gonegi-harbor-25s-v1" as const;
export const REAL_CAMERA_MOMENTUM_GRAMMAR_STATE =
  "25s-real-camera-momentum-grammar-metadata-only" as const;
export const REAL_CAMERA_MOMENTUM_GRAMMAR_FRAME_COUNT = 3 as const;
export const REAL_CAMERA_MOMENTUM_EASING_CURVE_LENGTH = 16 as const;

const FRAME_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    cameraAcceleration: 0.09,
    cinematicInertia: 0.88,
    movementMomentum: 0.22,
    shotTransitionForce: 0.35,
  }),
  Object.freeze({
    queueOrder: 1,
    cameraAcceleration: 0.18,
    cinematicInertia: 0.74,
    movementMomentum: 0.48,
    shotTransitionForce: 0.52,
  }),
  Object.freeze({
    queueOrder: 2,
    cameraAcceleration: 0.04,
    cinematicInertia: 0.94,
    movementMomentum: 0.14,
    shotTransitionForce: 0.28,
  }),
] as const);

let cachedRealCameraMomentumGrammar: RealCameraMomentumGrammar | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildEasingCurve(seed: string): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length: REAL_CAMERA_MOMENTUM_EASING_CURVE_LENGTH }, (_, index) => {
      const t = index / Math.max(REAL_CAMERA_MOMENTUM_EASING_CURVE_LENGTH - 1, 1);
      const ease = t * t * (3 - 2 * t);
      const noise = (bytes[index % bytes.length] ?? 0) / 255 / 20;
      return Number(Math.min(1, ease + noise).toFixed(6));
    })
  );
}

function buildFrame(item: RealImageAppInputPackageItem): RealCameraMomentumGrammarFrame {
  const profile = FRAME_PROFILES.find((entry) => entry.queueOrder === item.queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown camera momentum profile for queueOrder=${item.queueOrder}`);
  }

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    cameraAcceleration: profile.cameraAcceleration,
    cinematicInertia: profile.cinematicInertia,
    easingCurve: buildEasingCurve(
      [REAL_CAMERA_MOMENTUM_GRAMMAR_KIND_VERSION, item.frameEvidenceId, "easing"].join("|")
    ),
    movementMomentum: profile.movementMomentum,
    shotTransitionForce: profile.shotTransitionForce,
  });
}

export function buildRealCameraMomentumGrammar(
  realImageAppInputPackage: RealImageAppInputPackage
): RealCameraMomentumGrammar {
  if (cachedRealCameraMomentumGrammar !== null) {
    return cachedRealCameraMomentumGrammar;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real camera momentum grammar requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real camera momentum grammar requires three input package items");
  }

  const grammarId = digestValue(
    [
      REAL_CAMERA_MOMENTUM_GRAMMAR_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const grammar = Object.freeze({
    version: REAL_CAMERA_MOMENTUM_GRAMMAR_VERSION,
    grammarId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    grammarVersion: REAL_CAMERA_MOMENTUM_GRAMMAR_KIND_VERSION,
    activeGrammarState: REAL_CAMERA_MOMENTUM_GRAMMAR_STATE,
    frameCount: REAL_CAMERA_MOMENTUM_GRAMMAR_FRAME_COUNT,
    frames: Object.freeze(orderedItems.map((item) => buildFrame(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealCameraMomentumGrammar = grammar;
  return grammar;
}

export function computeRealCameraMomentumGrammarFingerprint(
  grammar: RealCameraMomentumGrammar
): string {
  return digestValue(JSON.stringify(grammar));
}

export function resetRealCameraMomentumGrammarCacheForVerification(): void {
  cachedRealCameraMomentumGrammar = null;
}

export function resolveRealCameraMomentumFrameForQueue(
  grammar: RealCameraMomentumGrammar,
  queueOrder: number
): RealCameraMomentumGrammarFrame | null {
  return grammar.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
