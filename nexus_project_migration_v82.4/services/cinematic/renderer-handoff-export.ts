import crypto from "crypto";
import type {
  GeneratorPayloadMode,
  MusicDramaGeneratorPayload,
  MusicDramaGeneratorPayloadItem,
} from "./music-drama-generator-payload.ts";
import { computeMusicDramaGeneratorPayloadFingerprint } from "./music-drama-generator-payload.ts";

export type RendererHandoffTarget = "image-renderer" | "video-renderer";

export type RendererHandoffItem = {
  handoffId: string;
  queueOrder: number;
  segmentId: string;
  target: RendererHandoffTarget;
  mode: GeneratorPayloadMode;
  promptIntent: string;
  continuityAnchor: string;
  outputSlot: string;
  adapterHint: string;
  rendererInputJson: string;
  handoffFingerprint: string;
};

export type RendererHandoffExport = {
  version: "v1";
  handoffExportId: string;
  generatorPayloadId: string;
  musicDramaGeneratorPayloadFingerprint: string;
  sourceFingerprint: string;
  handoffExportVersion: typeof RENDERER_HANDOFF_EXPORT_KIND_VERSION;
  activeHandoffExportState: string;
  items: readonly RendererHandoffItem[];
};

export const RENDERER_HANDOFF_EXPORT_VERSION = "v1" as const;
export const RENDERER_HANDOFF_EXPORT_ID = "renderer-handoff-export-gonegi-harbor-25s-v1" as const;
export const RENDERER_HANDOFF_EXPORT_STATE = "25s-renderer-handoff-export-metadata-only" as const;
export const RENDERER_HANDOFF_EXPORT_KIND_VERSION = "renderer-handoff-export-v1" as const;

export const RENDERER_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "target",
  "mode",
  "queueOrder",
  "segmentId",
  "promptIntent",
  "continuityAnchor",
  "outputSlot",
  "adapterHint",
] as const);

const RENDERER_TARGET_BY_MODE: Readonly<Record<GeneratorPayloadMode, RendererHandoffTarget>> =
  Object.freeze({
    image: "image-renderer",
    video: "video-renderer",
  });

let cachedRendererHandoffExport: RendererHandoffExport | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveRendererHandoffTarget(mode: GeneratorPayloadMode): RendererHandoffTarget {
  return RENDERER_TARGET_BY_MODE[mode];
}

function buildRendererInputJson(
  payloadItem: MusicDramaGeneratorPayloadItem,
  target: RendererHandoffTarget
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof RENDERER_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: RENDERER_HANDOFF_EXPORT_VERSION,
    target,
    mode: payloadItem.mode,
    queueOrder: payloadItem.queueOrder,
    segmentId: payloadItem.segmentId,
    promptIntent: payloadItem.promptIntent,
    continuityAnchor: payloadItem.continuityAnchor,
    outputSlot: payloadItem.outputSlot,
    adapterHint: payloadItem.adapterHint,
  };

  for (const key of RENDERER_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function computeRendererHandoffItemId(queueOrder: number, payloadId: string): string {
  return digestValue(
    [RENDERER_HANDOFF_EXPORT_KIND_VERSION, "renderer-handoff-item", String(queueOrder), payloadId].join(
      "|"
    )
  );
}

function computeRendererHandoffItemFingerprint(
  item: Omit<RendererHandoffItem, "handoffFingerprint">
): string {
  return digestValue(
    [
      RENDERER_HANDOFF_EXPORT_KIND_VERSION,
      item.handoffId,
      String(item.queueOrder),
      item.segmentId,
      item.target,
      item.mode,
      item.promptIntent,
      item.continuityAnchor,
      item.outputSlot,
      item.adapterHint,
      item.rendererInputJson,
    ].join("|")
  );
}

function buildRendererHandoffItem(payloadItem: MusicDramaGeneratorPayloadItem): RendererHandoffItem {
  const target = resolveRendererHandoffTarget(payloadItem.mode);
  const handoffId = computeRendererHandoffItemId(payloadItem.queueOrder, payloadItem.payloadId);
  const baseItem: Omit<RendererHandoffItem, "handoffFingerprint"> = {
    handoffId,
    queueOrder: payloadItem.queueOrder,
    segmentId: payloadItem.segmentId,
    target,
    mode: payloadItem.mode,
    promptIntent: payloadItem.promptIntent,
    continuityAnchor: payloadItem.continuityAnchor,
    outputSlot: payloadItem.outputSlot,
    adapterHint: payloadItem.adapterHint,
    rendererInputJson: buildRendererInputJson(payloadItem, target),
  };

  return Object.freeze({
    ...baseItem,
    handoffFingerprint: computeRendererHandoffItemFingerprint(baseItem),
  });
}

export function buildRendererHandoffExport(
  musicDramaGeneratorPayload: MusicDramaGeneratorPayload
): RendererHandoffExport {
  if (cachedRendererHandoffExport !== null) {
    return cachedRendererHandoffExport;
  }

  const musicDramaGeneratorPayloadFingerprint = computeMusicDramaGeneratorPayloadFingerprint(
    musicDramaGeneratorPayload
  );
  const orderedPayloadItems = [...musicDramaGeneratorPayload.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedPayloadItems.map((payloadItem) => buildRendererHandoffItem(payloadItem))
  );

  const handoffExport = Object.freeze({
    version: RENDERER_HANDOFF_EXPORT_VERSION,
    handoffExportId: RENDERER_HANDOFF_EXPORT_ID,
    generatorPayloadId: musicDramaGeneratorPayload.generatorPayloadId,
    musicDramaGeneratorPayloadFingerprint,
    sourceFingerprint: musicDramaGeneratorPayload.sourceFingerprint,
    handoffExportVersion: RENDERER_HANDOFF_EXPORT_KIND_VERSION,
    activeHandoffExportState: RENDERER_HANDOFF_EXPORT_STATE,
    items,
  });

  cachedRendererHandoffExport = handoffExport;
  return handoffExport;
}

export const RENDERER_HANDOFF_ITEM_KEY_ORDER = Object.freeze([
  "handoffId",
  "queueOrder",
  "segmentId",
  "target",
  "mode",
  "promptIntent",
  "continuityAnchor",
  "outputSlot",
  "adapterHint",
  "rendererInputJson",
  "handoffFingerprint",
] as const);

export const RENDERER_HANDOFF_EXPORT_KEY_ORDER = Object.freeze([
  "version",
  "handoffExportId",
  "generatorPayloadId",
  "musicDramaGeneratorPayloadFingerprint",
  "sourceFingerprint",
  "handoffExportVersion",
  "activeHandoffExportState",
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

export function serializeRendererHandoffExport(handoffExport: RendererHandoffExport): string {
  const orderedItems = [...handoffExport.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, RENDERER_HANDOFF_ITEM_KEY_ORDER));

  const orderedHandoffExport: Record<string, unknown> = {};
  for (const key of RENDERER_HANDOFF_EXPORT_KEY_ORDER) {
    if (key === "items") {
      orderedHandoffExport.items = orderedItems;
    } else {
      orderedHandoffExport[key] = handoffExport[key as keyof RendererHandoffExport];
    }
  }

  return JSON.stringify(orderedHandoffExport);
}

export function computeRendererHandoffExportFingerprint(
  handoffExport: RendererHandoffExport
): string {
  return digestValue(serializeRendererHandoffExport(handoffExport));
}

export function resetRendererHandoffExportCacheForVerification(): void {
  cachedRendererHandoffExport = null;
}
