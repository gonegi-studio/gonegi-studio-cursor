import crypto from "crypto";
import type {
  MusicDramaPromptBrief,
  MusicDramaPromptBriefItem,
} from "./music-drama-prompt-brief.ts";
import { computeMusicDramaPromptBriefFingerprint } from "./music-drama-prompt-brief.ts";

export type GeneratorPayloadMode = "image" | "video";

export type MusicDramaGeneratorPayloadItem = {
  payloadId: string;
  queueOrder: number;
  segmentId: string;
  mode: GeneratorPayloadMode;
  promptIntent: string;
  continuityAnchor: string;
  outputSlot: string;
  adapterHint: string;
  payloadFingerprint: string;
};

export type MusicDramaGeneratorPayload = {
  version: "v1";
  generatorPayloadId: string;
  promptBriefId: string;
  musicDramaPromptBriefFingerprint: string;
  sourceFingerprint: string;
  generatorPayloadVersion: typeof MUSIC_DRAMA_GENERATOR_PAYLOAD_KIND_VERSION;
  activeGeneratorPayloadState: string;
  items: readonly MusicDramaGeneratorPayloadItem[];
};

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_VERSION = "v1" as const;
export const MUSIC_DRAMA_GENERATOR_PAYLOAD_ID =
  "music-drama-generator-payload-gonegi-harbor-25s-v1" as const;
export const MUSIC_DRAMA_GENERATOR_PAYLOAD_STATE =
  "25s-music-drama-generator-payload-metadata-only" as const;
export const MUSIC_DRAMA_GENERATOR_PAYLOAD_KIND_VERSION =
  "music-drama-generator-payload-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

let cachedMusicDramaGeneratorPayload: MusicDramaGeneratorPayload | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveGeneratorPayloadMode(briefItem: MusicDramaPromptBriefItem): GeneratorPayloadMode {
  return briefItem.queueOrder <= FRAME_EXPORT_QUEUE_MAX ? "image" : "video";
}

function resolveOutputSlot(briefItem: MusicDramaPromptBriefItem): string {
  return `generator-output-slot-${briefItem.segmentId}-queue-${String(briefItem.queueOrder).padStart(3, "0")}`;
}

function resolveAdapterHint(mode: GeneratorPayloadMode): string {
  return mode === "image" ? "generic-image-adapter-v1" : "generic-video-adapter-v1";
}

function computeMusicDramaGeneratorPayloadItemId(
  queueOrder: number,
  briefId: string
): string {
  return digestValue(
    [
      MUSIC_DRAMA_GENERATOR_PAYLOAD_KIND_VERSION,
      "generator-payload-item",
      String(queueOrder),
      briefId,
    ].join("|")
  );
}

function computeMusicDramaGeneratorPayloadItemFingerprint(
  item: Omit<MusicDramaGeneratorPayloadItem, "payloadFingerprint">
): string {
  return digestValue(
    [
      MUSIC_DRAMA_GENERATOR_PAYLOAD_KIND_VERSION,
      item.payloadId,
      String(item.queueOrder),
      item.segmentId,
      item.mode,
      item.promptIntent,
      item.continuityAnchor,
      item.outputSlot,
      item.adapterHint,
    ].join("|")
  );
}

function buildMusicDramaGeneratorPayloadItem(
  briefItem: MusicDramaPromptBriefItem
): MusicDramaGeneratorPayloadItem {
  const mode = resolveGeneratorPayloadMode(briefItem);
  const payloadId = computeMusicDramaGeneratorPayloadItemId(briefItem.queueOrder, briefItem.briefId);
  const baseItem: Omit<MusicDramaGeneratorPayloadItem, "payloadFingerprint"> = {
    payloadId,
    queueOrder: briefItem.queueOrder,
    segmentId: briefItem.segmentId,
    mode,
    promptIntent: briefItem.promptIntent,
    continuityAnchor: briefItem.continuityAnchor,
    outputSlot: resolveOutputSlot(briefItem),
    adapterHint: resolveAdapterHint(mode),
  };

  return Object.freeze({
    ...baseItem,
    payloadFingerprint: computeMusicDramaGeneratorPayloadItemFingerprint(baseItem),
  });
}

export function buildMusicDramaGeneratorPayload(
  musicDramaPromptBrief: MusicDramaPromptBrief
): MusicDramaGeneratorPayload {
  if (cachedMusicDramaGeneratorPayload !== null) {
    return cachedMusicDramaGeneratorPayload;
  }

  const musicDramaPromptBriefFingerprint =
    computeMusicDramaPromptBriefFingerprint(musicDramaPromptBrief);
  const orderedBriefItems = [...musicDramaPromptBrief.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedBriefItems.map((briefItem) => buildMusicDramaGeneratorPayloadItem(briefItem))
  );

  const generatorPayload = Object.freeze({
    version: MUSIC_DRAMA_GENERATOR_PAYLOAD_VERSION,
    generatorPayloadId: MUSIC_DRAMA_GENERATOR_PAYLOAD_ID,
    promptBriefId: musicDramaPromptBrief.promptBriefId,
    musicDramaPromptBriefFingerprint,
    sourceFingerprint: musicDramaPromptBrief.sourceFingerprint,
    generatorPayloadVersion: MUSIC_DRAMA_GENERATOR_PAYLOAD_KIND_VERSION,
    activeGeneratorPayloadState: MUSIC_DRAMA_GENERATOR_PAYLOAD_STATE,
    items,
  });

  cachedMusicDramaGeneratorPayload = generatorPayload;
  return generatorPayload;
}

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_ITEM_KEY_ORDER = Object.freeze([
  "payloadId",
  "queueOrder",
  "segmentId",
  "mode",
  "promptIntent",
  "continuityAnchor",
  "outputSlot",
  "adapterHint",
  "payloadFingerprint",
] as const);

export const MUSIC_DRAMA_GENERATOR_PAYLOAD_KEY_ORDER = Object.freeze([
  "version",
  "generatorPayloadId",
  "promptBriefId",
  "musicDramaPromptBriefFingerprint",
  "sourceFingerprint",
  "generatorPayloadVersion",
  "activeGeneratorPayloadState",
  "items",
] as const);

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

export function serializeMusicDramaGeneratorPayload(
  generatorPayload: MusicDramaGeneratorPayload
): string {
  const orderedItems = [...generatorPayload.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, MUSIC_DRAMA_GENERATOR_PAYLOAD_ITEM_KEY_ORDER));

  const orderedGeneratorPayload: Record<string, unknown> = {};
  for (const key of MUSIC_DRAMA_GENERATOR_PAYLOAD_KEY_ORDER) {
    if (key === "items") {
      orderedGeneratorPayload.items = orderedItems;
    } else {
      orderedGeneratorPayload[key] = generatorPayload[key as keyof MusicDramaGeneratorPayload];
    }
  }

  return JSON.stringify(orderedGeneratorPayload);
}

export function computeMusicDramaGeneratorPayloadFingerprint(
  generatorPayload: MusicDramaGeneratorPayload
): string {
  return digestValue(serializeMusicDramaGeneratorPayload(generatorPayload));
}

export function resetMusicDramaGeneratorPayloadCacheForVerification(): void {
  cachedMusicDramaGeneratorPayload = null;
}
