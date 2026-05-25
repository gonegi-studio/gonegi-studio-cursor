import crypto from "crypto";
import type { PilotVideoManifest } from "./pilot-intake-schema.ts";
import { computePilotVideoManifestFingerprint } from "./pilot-intake-schema.ts";

export type PilotIntakeSessionStatus = "ready";

export type PilotIntakeSessionItem = {
  itemId: string;
  manifestId: string;
  segmentId: string;
  segmentSlug: string;
  orderIndex: number;
  durationSec: number;
  status: PilotIntakeSessionStatus;
};

export type PilotIntakeSession = {
  version: "v1";
  sessionId: string;
  status: PilotIntakeSessionStatus;
  manifestId: string;
  pilotVideoMode: string;
  canonicalSampleSlotId: string;
  durationSec: number;
  manifestFingerprint: string;
  activeSessionState: string;
  items: readonly PilotIntakeSessionItem[];
};

export const PILOT_INTAKE_SESSION_VERSION = "v1" as const;
export const PILOT_INTAKE_SESSION_STATUS: PilotIntakeSessionStatus = "ready";

function buildSessionItemId(orderIndex: number): string {
  return `pilot-intake-session-item-${String(orderIndex + 1).padStart(3, "0")}`;
}

function buildPilotIntakeSessionItem(
  manifest: PilotVideoManifest,
  segment: PilotVideoManifest["sceneSegments"][number]
): PilotIntakeSessionItem {
  return Object.freeze({
    itemId: buildSessionItemId(segment.orderIndex),
    manifestId: manifest.manifestId,
    segmentId: segment.segmentId,
    segmentSlug: segment.segmentSlug,
    orderIndex: segment.orderIndex,
    durationSec: segment.durationSec,
    status: PILOT_INTAKE_SESSION_STATUS,
  });
}

export function buildPilotIntakeSession(manifest: PilotVideoManifest): PilotIntakeSession {
  const items = Object.freeze(
    [...manifest.sceneSegments]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((segment) => buildPilotIntakeSessionItem(manifest, segment))
  );

  return Object.freeze({
    version: PILOT_INTAKE_SESSION_VERSION,
    sessionId: "pilot-intake-session-gonegi-harbor-25s-v1",
    status: PILOT_INTAKE_SESSION_STATUS,
    manifestId: manifest.manifestId,
    pilotVideoMode: manifest.pilotVideoMode,
    canonicalSampleSlotId: manifest.canonicalSampleSlotId,
    durationSec: manifest.durationSec,
    manifestFingerprint: computePilotVideoManifestFingerprint(manifest),
    activeSessionState: "25s-pilot-intake-session-ready-without-file-processing",
    items,
  });
}

export const PILOT_INTAKE_SESSION_KEY_ORDER = Object.freeze([
  "version",
  "sessionId",
  "status",
  "manifestId",
  "pilotVideoMode",
  "canonicalSampleSlotId",
  "durationSec",
  "manifestFingerprint",
  "activeSessionState",
  "items",
] as const);

export const PILOT_INTAKE_SESSION_ITEM_KEY_ORDER = Object.freeze([
  "itemId",
  "manifestId",
  "segmentId",
  "segmentSlug",
  "orderIndex",
  "durationSec",
  "status",
] as const);

function orderRecord<T extends Record<string, unknown>>(item: T, keyOrder: readonly string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializePilotIntakeSession(session: PilotIntakeSession): string {
  const orderedItems = [...session.items]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((item) => orderRecord(item, PILOT_INTAKE_SESSION_ITEM_KEY_ORDER));

  const orderedSession: Record<string, unknown> = {};
  for (const key of PILOT_INTAKE_SESSION_KEY_ORDER) {
    if (key === "items") {
      orderedSession.items = orderedItems;
    } else {
      orderedSession[key] = session[key as keyof PilotIntakeSession];
    }
  }

  return JSON.stringify(orderedSession);
}

export function computePilotIntakeSessionFingerprint(session: PilotIntakeSession): string {
  return crypto.createHash("sha256").update(serializePilotIntakeSession(session)).digest("hex");
}
