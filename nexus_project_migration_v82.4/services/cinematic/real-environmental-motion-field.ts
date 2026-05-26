import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealEnvironmentalMotionFieldFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  cloudDrift: {
    directionDegrees: number;
    velocityScale: number;
    driftCurve: readonly number[];
  };
  windDirection: {
    vector: readonly [number, number];
    gustIntensity: number;
    continuityScore: number;
  };
  lightMovement: {
    keyLightShiftDegrees: number;
    intensityDelta: number;
    movementCurve: readonly number[];
  };
  atmosphericParticleContinuity: {
    particleDensity: number;
    flowVector: readonly [number, number, number];
    persistenceScore: number;
  };
  environmentalFlowPersistence: {
    flowScore: number;
    decayTau: number;
    residueVector: readonly [number, number];
  };
};

export type RealEnvironmentalMotionField = {
  version: "v1";
  fieldId: string;
  inputPackageId: string;
  fieldVersion: typeof REAL_ENVIRONMENTAL_MOTION_FIELD_KIND_VERSION;
  activeFieldState: string;
  frameCount: typeof REAL_ENVIRONMENTAL_MOTION_FIELD_FRAME_COUNT;
  frames: readonly RealEnvironmentalMotionFieldFrame[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_ENVIRONMENTAL_MOTION_FIELD_VERSION = "v1" as const;
export const REAL_ENVIRONMENTAL_MOTION_FIELD_KIND_VERSION =
  "real-environmental-motion-field-v1" as const;
export const REAL_ENVIRONMENTAL_MOTION_FIELD_ROOT_ID =
  "real-environmental-motion-field-gonegi-harbor-25s-v1" as const;
export const REAL_ENVIRONMENTAL_MOTION_FIELD_STATE =
  "25s-real-environmental-motion-field-metadata-only" as const;
export const REAL_ENVIRONMENTAL_MOTION_FIELD_FRAME_COUNT = 3 as const;
export const REAL_ENVIRONMENTAL_MOTION_CURVE_LENGTH = 12 as const;

const FRAME_PROFILES = Object.freeze([
  Object.freeze({
    queueOrder: 0,
    cloudDirection: 72,
    cloudVelocity: 0.12,
    windVector: Object.freeze([0.18, 0.08] as const),
    gustIntensity: 0.22,
    keyLightShift: 8,
    intensityDelta: 0.06,
    particleDensity: 0.14,
    flowScore: 0.68,
    decayTau: 6.2,
  }),
  Object.freeze({
    queueOrder: 1,
    cloudDirection: 84,
    cloudVelocity: 0.18,
    windVector: Object.freeze([0.28, 0.12] as const),
    gustIntensity: 0.32,
    keyLightShift: 12,
    intensityDelta: 0.04,
    particleDensity: 0.18,
    flowScore: 0.74,
    decayTau: 5.4,
  }),
  Object.freeze({
    queueOrder: 2,
    cloudDirection: 58,
    cloudVelocity: 0.08,
    windVector: Object.freeze([0.12, 0.06] as const),
    gustIntensity: 0.14,
    keyLightShift: 4,
    intensityDelta: -0.02,
    particleDensity: 0.1,
    flowScore: 0.82,
    decayTau: 4.8,
  }),
] as const);

let cachedRealEnvironmentalMotionField: RealEnvironmentalMotionField | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildCurve(seed: string): readonly number[] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze(
    Array.from({ length: REAL_ENVIRONMENTAL_MOTION_CURVE_LENGTH }, (_, index) =>
      Number(((bytes[index % bytes.length] ?? 0) / 255).toFixed(6))
    )
  );
}

function buildFlowVector(seed: string): readonly [number, number, number] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze([
    Number(((bytes[0] ?? 0) / 255).toFixed(4)),
    Number(((bytes[1] ?? 0) / 255).toFixed(4)),
    Number(((bytes[2] ?? 0) / 255).toFixed(4)),
  ] as const);
}

function buildFrame(item: RealImageAppInputPackageItem): RealEnvironmentalMotionFieldFrame {
  const profile = FRAME_PROFILES.find((entry) => entry.queueOrder === item.queueOrder);
  if (profile === undefined) {
    throw new Error(`Unknown environmental motion profile for queueOrder=${item.queueOrder}`);
  }

  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    cloudDrift: Object.freeze({
      directionDegrees: profile.cloudDirection,
      velocityScale: profile.cloudVelocity,
      driftCurve: buildCurve(`${item.frameEvidenceId}|cloud-drift`),
    }),
    windDirection: Object.freeze({
      vector: profile.windVector,
      gustIntensity: profile.gustIntensity,
      continuityScore: Number((0.78 + profile.flowScore * 0.18).toFixed(4)),
    }),
    lightMovement: Object.freeze({
      keyLightShiftDegrees: profile.keyLightShift,
      intensityDelta: profile.intensityDelta,
      movementCurve: buildCurve(`${item.frameEvidenceId}|light-movement`),
    }),
    atmosphericParticleContinuity: Object.freeze({
      particleDensity: profile.particleDensity,
      flowVector: buildFlowVector(`${item.frameEvidenceId}|particles`),
      persistenceScore: profile.flowScore,
    }),
    environmentalFlowPersistence: Object.freeze({
      flowScore: profile.flowScore,
      decayTau: profile.decayTau,
      residueVector: profile.windVector,
    }),
  });
}

export function buildRealEnvironmentalMotionField(
  realImageAppInputPackage: RealImageAppInputPackage
): RealEnvironmentalMotionField {
  if (cachedRealEnvironmentalMotionField !== null) {
    return cachedRealEnvironmentalMotionField;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real environmental motion field requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real environmental motion field requires three input package items");
  }

  const fieldId = digestValue(
    [
      REAL_ENVIRONMENTAL_MOTION_FIELD_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const field = Object.freeze({
    version: REAL_ENVIRONMENTAL_MOTION_FIELD_VERSION,
    fieldId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    fieldVersion: REAL_ENVIRONMENTAL_MOTION_FIELD_KIND_VERSION,
    activeFieldState: REAL_ENVIRONMENTAL_MOTION_FIELD_STATE,
    frameCount: REAL_ENVIRONMENTAL_MOTION_FIELD_FRAME_COUNT,
    frames: Object.freeze(orderedItems.map((item) => buildFrame(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealEnvironmentalMotionField = field;
  return field;
}

export function computeRealEnvironmentalMotionFieldFingerprint(
  field: RealEnvironmentalMotionField
): string {
  return digestValue(JSON.stringify(field));
}

export function resetRealEnvironmentalMotionFieldCacheForVerification(): void {
  cachedRealEnvironmentalMotionField = null;
}

export function resolveRealEnvironmentalMotionFrameForQueue(
  field: RealEnvironmentalMotionField,
  queueOrder: number
): RealEnvironmentalMotionFieldFrame | null {
  return field.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
