import crypto from "crypto";
import type {
  ImageRegenerationRequest,
  RegenerationPriority,
} from "./image-regeneration-request.ts";
import { computeImageRegenerationRequestFingerprint } from "./image-regeneration-request.ts";

export type RegenerationImageAppInputItem = {
  regenerationInputId: string;
  queueOrder: number;
  segmentId: string;
  regenerationRequestId: string;
  continuityAnchor: string;
  promptAdjustmentHint: string;
  priority: RegenerationPriority;
  imageAppInputJson: string;
  inputItemFingerprint: string;
};

export type RegenerationImageAppInput = {
  version: "v1";
  inputId: string;
  requestId: string;
  imageRegenerationRequestFingerprint: string;
  sourceFingerprint: string;
  inputVersion: typeof REGENERATION_IMAGE_APP_INPUT_KIND_VERSION;
  activeInputState: string;
  totalRegenerationInputCount: number;
  items: readonly RegenerationImageAppInputItem[];
};

export const REGENERATION_IMAGE_APP_INPUT_VERSION = "v1" as const;
export const REGENERATION_IMAGE_APP_INPUT_ID =
  "regeneration-image-app-input-gonegi-harbor-25s-v1" as const;
export const REGENERATION_IMAGE_APP_INPUT_STATE =
  "25s-regeneration-image-app-input-metadata-only" as const;
export const REGENERATION_IMAGE_APP_INPUT_KIND_VERSION =
  "regeneration-image-app-input-v1" as const;

const REGENERATION_IMAGE_APP_INPUT_JSON_KEY_ORDER = Object.freeze([
  "version",
  "inputKind",
  "queueOrder",
  "segmentId",
  "regenerationRequestId",
  "continuityAnchor",
  "promptAdjustmentHint",
  "priority",
  "generatedEvidenceId",
  "reason",
] as const);

let cachedRegenerationImageAppInput: RegenerationImageAppInput | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

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

function buildRegenerationImageAppInputJson(
  requestItem: ImageRegenerationRequest["items"][number]
): string {
  const orderedInput: Record<string, unknown> = {};
  const values: Record<(typeof REGENERATION_IMAGE_APP_INPUT_JSON_KEY_ORDER)[number], unknown> = {
    version: REGENERATION_IMAGE_APP_INPUT_VERSION,
    inputKind: "regeneration",
    queueOrder: requestItem.queueOrder,
    segmentId: requestItem.segmentId,
    regenerationRequestId: requestItem.regenerationRequestId,
    continuityAnchor: requestItem.continuityAnchor,
    promptAdjustmentHint: requestItem.promptAdjustmentHint,
    priority: requestItem.priority,
    generatedEvidenceId: requestItem.generatedEvidenceId,
    reason: requestItem.reason,
  };

  for (const key of REGENERATION_IMAGE_APP_INPUT_JSON_KEY_ORDER) {
    orderedInput[key] = values[key];
  }

  return JSON.stringify(orderedInput);
}

function computeRegenerationInputItemId(
  queueOrder: number,
  regenerationRequestId: string
): string {
  return digestValue(
    [
      REGENERATION_IMAGE_APP_INPUT_KIND_VERSION,
      "regeneration-input-item",
      String(queueOrder),
      regenerationRequestId,
    ].join("|")
  );
}

function computeInputItemFingerprint(
  item: Omit<RegenerationImageAppInputItem, "inputItemFingerprint">
): string {
  return digestValue(
    [
      REGENERATION_IMAGE_APP_INPUT_KIND_VERSION,
      item.regenerationInputId,
      String(item.queueOrder),
      item.segmentId,
      item.regenerationRequestId,
      item.continuityAnchor,
      item.promptAdjustmentHint,
      item.priority,
      item.imageAppInputJson,
    ].join("|")
  );
}

function buildRegenerationImageAppInputItem(
  requestItem: ImageRegenerationRequest["items"][number]
): RegenerationImageAppInputItem {
  const imageAppInputJson = buildRegenerationImageAppInputJson(requestItem);

  const baseItem: Omit<RegenerationImageAppInputItem, "inputItemFingerprint"> = {
    regenerationInputId: computeRegenerationInputItemId(
      requestItem.queueOrder,
      requestItem.regenerationRequestId
    ),
    queueOrder: requestItem.queueOrder,
    segmentId: requestItem.segmentId,
    regenerationRequestId: requestItem.regenerationRequestId,
    continuityAnchor: requestItem.continuityAnchor,
    promptAdjustmentHint: requestItem.promptAdjustmentHint,
    priority: requestItem.priority,
    imageAppInputJson,
  };

  return Object.freeze({
    ...baseItem,
    inputItemFingerprint: computeInputItemFingerprint(baseItem),
  });
}

export function buildRegenerationImageAppInput(
  imageRegenerationRequest: ImageRegenerationRequest
): RegenerationImageAppInput {
  if (cachedRegenerationImageAppInput !== null) {
    return cachedRegenerationImageAppInput;
  }

  const imageRegenerationRequestFingerprint =
    computeImageRegenerationRequestFingerprint(imageRegenerationRequest);
  const orderedRequestItems = [...imageRegenerationRequest.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedRequestItems.map((requestItem) => buildRegenerationImageAppInputItem(requestItem))
  );

  const input = Object.freeze({
    version: REGENERATION_IMAGE_APP_INPUT_VERSION,
    inputId: REGENERATION_IMAGE_APP_INPUT_ID,
    requestId: imageRegenerationRequest.requestId,
    imageRegenerationRequestFingerprint,
    sourceFingerprint: imageRegenerationRequest.sourceFingerprint,
    inputVersion: REGENERATION_IMAGE_APP_INPUT_KIND_VERSION,
    activeInputState: REGENERATION_IMAGE_APP_INPUT_STATE,
    totalRegenerationInputCount: items.length,
    items,
  });

  cachedRegenerationImageAppInput = input;
  return input;
}

export const REGENERATION_IMAGE_APP_INPUT_ITEM_KEY_ORDER = Object.freeze([
  "regenerationInputId",
  "queueOrder",
  "segmentId",
  "regenerationRequestId",
  "continuityAnchor",
  "promptAdjustmentHint",
  "priority",
  "imageAppInputJson",
  "inputItemFingerprint",
] as const);

export const REGENERATION_IMAGE_APP_INPUT_KEY_ORDER = Object.freeze([
  "version",
  "inputId",
  "requestId",
  "imageRegenerationRequestFingerprint",
  "sourceFingerprint",
  "inputVersion",
  "activeInputState",
  "totalRegenerationInputCount",
  "items",
] as const);

export function serializeRegenerationImageAppInput(input: RegenerationImageAppInput): string {
  const orderedItems = [...input.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REGENERATION_IMAGE_APP_INPUT_ITEM_KEY_ORDER));

  const orderedInput: Record<string, unknown> = {};
  for (const key of REGENERATION_IMAGE_APP_INPUT_KEY_ORDER) {
    if (key === "items") {
      orderedInput.items = orderedItems;
    } else {
      orderedInput[key] = input[key as keyof RegenerationImageAppInput];
    }
  }

  return JSON.stringify(orderedInput);
}

export function computeRegenerationImageAppInputFingerprint(
  input: RegenerationImageAppInput
): string {
  return digestValue(serializeRegenerationImageAppInput(input));
}

export function resetRegenerationImageAppInputCacheForVerification(): void {
  cachedRegenerationImageAppInput = null;
}
