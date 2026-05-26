import crypto from "crypto";
import type {
  RealImageAppInputPackage,
  RealImageAppInputPackageItem,
} from "./real-image-app-input-package.ts";
import { REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT } from "./real-image-app-input-package.ts";

export type RealEnvironmentalZone = {
  zoneId: string;
  label: string;
  lightingEvolution: {
    keyLightAngleDegrees: number;
    intensityDelta: number;
    colorTempKelvin: number;
    shadowSoftness: number;
    fillRatio: number;
  };
  atmosphereDrift: {
    hazeIndex: number;
    humidityWeight: number;
    windVector: readonly [number, number];
    particulateDensity: number;
  };
  spatialConsistency: {
    anchorPoint: string;
    horizonLock: number;
    parallaxCoherence: number;
    depthLayer: "foreground" | "midground" | "background";
  };
};

export type RealEnvironmentalPersistenceFrame = {
  queueOrder: number;
  frameEvidenceId: string;
  timestampSeconds: string;
  zones: readonly RealEnvironmentalZone[];
};

export type RealEnvironmentalPersistence = {
  version: "v1";
  persistenceId: string;
  inputPackageId: string;
  persistenceVersion: typeof REAL_ENVIRONMENTAL_PERSISTENCE_KIND_VERSION;
  activePersistenceState: string;
  frameCount: typeof REAL_ENVIRONMENTAL_PERSISTENCE_FRAME_COUNT;
  zoneCountPerFrame: typeof REAL_ENVIRONMENTAL_PERSISTENCE_ZONE_COUNT;
  frames: readonly RealEnvironmentalPersistenceFrame[];
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_ENVIRONMENTAL_PERSISTENCE_VERSION = "v1" as const;
export const REAL_ENVIRONMENTAL_PERSISTENCE_KIND_VERSION =
  "real-environmental-persistence-v1" as const;
export const REAL_ENVIRONMENTAL_PERSISTENCE_ROOT_ID =
  "real-environmental-persistence-gonegi-harbor-25s-v1" as const;
export const REAL_ENVIRONMENTAL_PERSISTENCE_STATE =
  "25s-real-environmental-persistence-metadata-only" as const;
export const REAL_ENVIRONMENTAL_PERSISTENCE_FRAME_COUNT = 3 as const;
export const REAL_ENVIRONMENTAL_PERSISTENCE_ZONE_COUNT = 8 as const;

const ZONE_TEMPLATES = Object.freeze([
  Object.freeze({ label: "harbor-sky-dome", anchorPoint: "upper-horizon", depthLayer: "background" as const }),
  Object.freeze({ label: "coastal-water-surface", anchorPoint: "lower-horizon", depthLayer: "midground" as const }),
  Object.freeze({ label: "town-rooftop-cluster", anchorPoint: "mid-left-grid", depthLayer: "midground" as const }),
  Object.freeze({ label: "flight-corridor-air", anchorPoint: "center-flight-path", depthLayer: "foreground" as const }),
  Object.freeze({ label: "golden-hour-key-light", anchorPoint: "west-sun-vector", depthLayer: "background" as const }),
  Object.freeze({ label: "sea-breeze-layer", anchorPoint: "atmospheric-band", depthLayer: "midground" as const }),
  Object.freeze({ label: "harbor-architecture-silhouette", anchorPoint: "lower-third", depthLayer: "midground" as const }),
  Object.freeze({ label: "subject-shadow-ground", anchorPoint: "subject-base", depthLayer: "foreground" as const }),
] as const);

const FRAME_ZONE_OFFSETS = Object.freeze([
  Object.freeze([0.02, 0.04, 0.01, 0.06, 0.03, 0.05, 0.02, 0.04]),
  Object.freeze([0.04, 0.02, 0.05, 0.08, 0.04, 0.03, 0.06, 0.05]),
  Object.freeze([0.01, 0.03, 0.02, 0.04, 0.02, 0.06, 0.03, 0.02]),
] as const);

let cachedRealEnvironmentalPersistence: RealEnvironmentalPersistence | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function buildWindVector(seed: string): readonly [number, number] {
  const bytes = crypto.createHash("sha256").update(seed).digest();
  return Object.freeze([
    Number(((bytes[0] ?? 0) / 255).toFixed(4)),
    Number(((bytes[1] ?? 0) / 255).toFixed(4)),
  ] as const);
}

function buildZones(item: RealImageAppInputPackageItem): readonly RealEnvironmentalZone[] {
  const offsets = FRAME_ZONE_OFFSETS[item.queueOrder] ?? FRAME_ZONE_OFFSETS[0];

  return Object.freeze(
    ZONE_TEMPLATES.map((template, index) => {
      const offset = offsets[index] ?? 0;
      const zoneId = digestValue(
        [REAL_ENVIRONMENTAL_PERSISTENCE_KIND_VERSION, item.frameEvidenceId, template.label].join("|")
      ).slice(0, 20);

      return Object.freeze({
        zoneId,
        label: template.label,
        lightingEvolution: Object.freeze({
          keyLightAngleDegrees: Number((42 + index * 8 + offset * 10).toFixed(2)),
          intensityDelta: Number((0.12 + index * 0.04 + offset).toFixed(4)),
          colorTempKelvin: Number((5200 + index * 120 + offset * 200).toFixed(0)),
          shadowSoftness: Number((0.28 + index * 0.05 + offset).toFixed(4)),
          fillRatio: Number((0.42 + index * 0.03).toFixed(4)),
        }),
        atmosphereDrift: Object.freeze({
          hazeIndex: Number((0.14 + index * 0.06 + offset).toFixed(4)),
          humidityWeight: Number((0.52 + index * 0.04).toFixed(4)),
          windVector: buildWindVector(
            [item.frameEvidenceId, template.label, "wind"].join("|")
          ),
          particulateDensity: Number((0.08 + index * 0.02 + offset).toFixed(4)),
        }),
        spatialConsistency: Object.freeze({
          anchorPoint: template.anchorPoint,
          horizonLock: Number((0.88 + index * 0.01).toFixed(4)),
          parallaxCoherence: Number((0.72 + index * 0.03 + offset).toFixed(4)),
          depthLayer: template.depthLayer,
        }),
      });
    })
  );
}

function buildFrame(item: RealImageAppInputPackageItem): RealEnvironmentalPersistenceFrame {
  return Object.freeze({
    queueOrder: item.queueOrder,
    frameEvidenceId: item.frameEvidenceId,
    timestampSeconds: item.timestampSeconds,
    zones: buildZones(item),
  });
}

export function buildRealEnvironmentalPersistence(
  realImageAppInputPackage: RealImageAppInputPackage
): RealEnvironmentalPersistence {
  if (cachedRealEnvironmentalPersistence !== null) {
    return cachedRealEnvironmentalPersistence;
  }

  if (realImageAppInputPackage.packageStatus !== "package-complete") {
    throw new Error("Real environmental persistence requires package-complete input package");
  }

  const orderedItems = [...realImageAppInputPackage.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  if (orderedItems.length !== REAL_IMAGE_APP_INPUT_PACKAGE_ITEM_COUNT) {
    throw new Error("Real environmental persistence requires three input package items");
  }

  const persistenceId = digestValue(
    [
      REAL_ENVIRONMENTAL_PERSISTENCE_KIND_VERSION,
      realImageAppInputPackage.realInputPackageId,
      orderedItems.map((item) => item.frameEvidenceId).join(","),
    ].join("|")
  );

  const persistence = Object.freeze({
    version: REAL_ENVIRONMENTAL_PERSISTENCE_VERSION,
    persistenceId,
    inputPackageId: realImageAppInputPackage.realInputPackageId,
    persistenceVersion: REAL_ENVIRONMENTAL_PERSISTENCE_KIND_VERSION,
    activePersistenceState: REAL_ENVIRONMENTAL_PERSISTENCE_STATE,
    frameCount: REAL_ENVIRONMENTAL_PERSISTENCE_FRAME_COUNT,
    zoneCountPerFrame: REAL_ENVIRONMENTAL_PERSISTENCE_ZONE_COUNT,
    frames: Object.freeze(orderedItems.map((item) => buildFrame(item))),
    inferenceExecuted: false as const,
    providerCallExecuted: false as const,
  });

  cachedRealEnvironmentalPersistence = persistence;
  return persistence;
}

export function computeRealEnvironmentalPersistenceFingerprint(
  persistence: RealEnvironmentalPersistence
): string {
  return digestValue(JSON.stringify(persistence));
}

export function resetRealEnvironmentalPersistenceCacheForVerification(): void {
  cachedRealEnvironmentalPersistence = null;
}

export function resolveRealEnvironmentalFrameForQueue(
  persistence: RealEnvironmentalPersistence,
  queueOrder: number
): RealEnvironmentalPersistenceFrame | null {
  return persistence.frames.find((frame) => frame.queueOrder === queueOrder) ?? null;
}
