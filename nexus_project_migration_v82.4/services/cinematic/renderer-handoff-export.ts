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

const RENDERER_HANDOFF_PREVIEW_EXPORT_ITEMS = Object.freeze([
  Object.freeze({
    handoffId: "0ed2edfa91b374081800095712c9dd091d7e117c2d31a7ba26f6f3bfef05f420",
    queueOrder: 0,
    segmentId: "segment-001",
    target: "image-renderer" as const,
    mode: "image" as const,
    promptIntent: "frame-establish|nostalgic-calm|rhythm-rise|low|soft",
    continuityAnchor: "continuity-anchor-segment-001",
    outputSlot: "generator-output-slot-segment-001-queue-000",
    adapterHint: "generic-image-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":0,"segmentId":"segment-001","promptIntent":"frame-establish|nostalgic-calm|rhythm-rise|low|soft","continuityAnchor":"continuity-anchor-segment-001","outputSlot":"generator-output-slot-segment-001-queue-000","adapterHint":"generic-image-adapter-v1"}',
    handoffFingerprint: "a474739647bf01fb68c88197023729124da9cd99c86cbcbfaa2d79caa6b1baea",
  }),
  Object.freeze({
    handoffId: "8b7febf497d46eab98d5e73568937f187aee0cd0476e05da5b5710a696b92abf",
    queueOrder: 1,
    segmentId: "segment-002",
    target: "image-renderer" as const,
    mode: "image" as const,
    promptIntent: "frame-bridge|reflective-bridge|rhythm-hold|medium|moderate",
    continuityAnchor: "continuity-anchor-segment-002",
    outputSlot: "generator-output-slot-segment-002-queue-001",
    adapterHint: "generic-image-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":1,"segmentId":"segment-002","promptIntent":"frame-bridge|reflective-bridge|rhythm-hold|medium|moderate","continuityAnchor":"continuity-anchor-segment-002","outputSlot":"generator-output-slot-segment-002-queue-001","adapterHint":"generic-image-adapter-v1"}',
    handoffFingerprint: "60a21aec03523dfce798bd0ad79517e0001241e5446edf5fc411ac259bdf1e7f",
  }),
  Object.freeze({
    handoffId: "168079c1a5bce8b54ef326c99ea463eaaa722b8b301f5fff2cbcb2e12b8ccabf",
    queueOrder: 2,
    segmentId: "segment-003",
    target: "image-renderer" as const,
    mode: "image" as const,
    promptIntent: "frame-resolve|warm-resolution|rhythm-release|low|gentle",
    continuityAnchor: "continuity-anchor-segment-003",
    outputSlot: "generator-output-slot-segment-003-queue-002",
    adapterHint: "generic-image-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"image-renderer","mode":"image","queueOrder":2,"segmentId":"segment-003","promptIntent":"frame-resolve|warm-resolution|rhythm-release|low|gentle","continuityAnchor":"continuity-anchor-segment-003","outputSlot":"generator-output-slot-segment-003-queue-002","adapterHint":"generic-image-adapter-v1"}',
    handoffFingerprint: "50c789e08df295bff552f6c9c36d27c1cf5d9672c1aebb73621d600b2e0090af",
  }),
  Object.freeze({
    handoffId: "c8aa9a4aec6d051f7129bcbf56c91e31400dd71083cf1965fa1722a586c47220",
    queueOrder: 3,
    segmentId: "segment-001",
    target: "video-renderer" as const,
    mode: "video" as const,
    promptIntent: "segment-establish|nostalgic-calm|rhythm-rise|low|soft",
    continuityAnchor: "continuity-anchor-segment-001",
    outputSlot: "generator-output-slot-segment-001-queue-003",
    adapterHint: "generic-video-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"video-renderer","mode":"video","queueOrder":3,"segmentId":"segment-001","promptIntent":"segment-establish|nostalgic-calm|rhythm-rise|low|soft","continuityAnchor":"continuity-anchor-segment-001","outputSlot":"generator-output-slot-segment-001-queue-003","adapterHint":"generic-video-adapter-v1"}',
    handoffFingerprint: "68a8f8f70adb0ecbd2ea73984254cea72073de319792c1b991b644a655a00b6c",
  }),
  Object.freeze({
    handoffId: "0a5b211c1ba3ec56d148f963213cf9987ad896a463235c13c8fab8ae65ad8e9a",
    queueOrder: 4,
    segmentId: "segment-002",
    target: "video-renderer" as const,
    mode: "video" as const,
    promptIntent: "segment-bridge|reflective-bridge|rhythm-hold|medium|moderate",
    continuityAnchor: "continuity-anchor-segment-002",
    outputSlot: "generator-output-slot-segment-002-queue-004",
    adapterHint: "generic-video-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"video-renderer","mode":"video","queueOrder":4,"segmentId":"segment-002","promptIntent":"segment-bridge|reflective-bridge|rhythm-hold|medium|moderate","continuityAnchor":"continuity-anchor-segment-002","outputSlot":"generator-output-slot-segment-002-queue-004","adapterHint":"generic-video-adapter-v1"}',
    handoffFingerprint: "f95c00f00eba30a2f33ad5f596c2a71f6f42eec87158d6a1ef4afc98c3d90147",
  }),
  Object.freeze({
    handoffId: "ee0f902150b21b52ffcf616008f249bb1765706d8d0fd594d2bbc10710607436",
    queueOrder: 5,
    segmentId: "segment-003",
    target: "video-renderer" as const,
    mode: "video" as const,
    promptIntent: "segment-resolve|warm-resolution|rhythm-release|low|gentle",
    continuityAnchor: "continuity-anchor-segment-003",
    outputSlot: "generator-output-slot-segment-003-queue-005",
    adapterHint: "generic-video-adapter-v1",
    rendererInputJson:
      '{"version":"v1","target":"video-renderer","mode":"video","queueOrder":5,"segmentId":"segment-003","promptIntent":"segment-resolve|warm-resolution|rhythm-release|low|gentle","continuityAnchor":"continuity-anchor-segment-003","outputSlot":"generator-output-slot-segment-003-queue-005","adapterHint":"generic-video-adapter-v1"}',
    handoffFingerprint: "426302cd2ecdaf7d3be580422a2422826d554bcf61491d99f529f808c166c8db",
  }),
] as const);

export const RENDERER_HANDOFF_PREVIEW_EXPORT = Object.freeze({
  version: RENDERER_HANDOFF_EXPORT_VERSION,
  handoffExportId: RENDERER_HANDOFF_EXPORT_ID,
  generatorPayloadId: "music-drama-generator-payload-gonegi-harbor-25s-v1",
  musicDramaGeneratorPayloadFingerprint:
    "908725895ecbeb631826610f7b2e38b3680428d8902b7a52b7983c6e92968ae6",
  sourceFingerprint: "3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589",
  handoffExportVersion: RENDERER_HANDOFF_EXPORT_KIND_VERSION,
  activeHandoffExportState: RENDERER_HANDOFF_EXPORT_STATE,
  items: RENDERER_HANDOFF_PREVIEW_EXPORT_ITEMS,
});

export const RENDERER_HANDOFF_PREVIEW_FINGERPRINT =
  "33d4c383f530d1d8e8d2ef93c5b85357ab695779c1ba0e6bf70df318aff7a29c" as const;

export type RendererHandoffPreviewItemCounts = {
  totalItemCount: number;
  imageItemCount: number;
  videoItemCount: number;
};

export type RendererHandoffPreview = {
  rendererHandoffExport: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: RendererHandoffPreviewItemCounts;
  imageItems: ReturnType<typeof JSON.parse>;
  videoItems: ReturnType<typeof JSON.parse>;
};

function partitionRendererHandoffItems(handoffExport: RendererHandoffExport): {
  imageItems: readonly RendererHandoffItem[];
  videoItems: readonly RendererHandoffItem[];
} {
  const orderedItems = [...handoffExport.items].sort((a, b) => a.queueOrder - b.queueOrder);
  return Object.freeze({
    imageItems: Object.freeze(orderedItems.filter((item) => item.mode === "image")),
    videoItems: Object.freeze(orderedItems.filter((item) => item.mode === "video")),
  });
}

export function buildRendererHandoffPreviewFromExport(
  rendererHandoffExport: RendererHandoffExport
): RendererHandoffPreview {
  const fingerprint = computeRendererHandoffExportFingerprint(rendererHandoffExport);
  const { imageItems, videoItems } = partitionRendererHandoffItems(rendererHandoffExport);

  return Object.freeze({
    rendererHandoffExport: JSON.parse(serializeRendererHandoffExport(rendererHandoffExport)),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: rendererHandoffExport.items.length,
      imageItemCount: imageItems.length,
      videoItemCount: videoItems.length,
    }),
    imageItems: JSON.parse(
      JSON.stringify(
        [...imageItems].map((item) => orderRecord(item, RENDERER_HANDOFF_ITEM_KEY_ORDER))
      )
    ),
    videoItems: JSON.parse(
      JSON.stringify([...videoItems].map((item) => orderRecord(item, RENDERER_HANDOFF_ITEM_KEY_ORDER)))
    ),
  });
}

export function buildRendererHandoffPreview(): RendererHandoffPreview {
  return buildRendererHandoffPreviewFromExport(RENDERER_HANDOFF_PREVIEW_EXPORT);
}

export function serializeRendererHandoffPreview(preview: RendererHandoffPreview): string {
  return JSON.stringify({
    rendererHandoffExport: preview.rendererHandoffExport,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    imageItems: preview.imageItems,
    videoItems: preview.videoItems,
  });
}
