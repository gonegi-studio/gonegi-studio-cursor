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

const REGENERATION_IMAGE_APP_INPUT_PREVIEW_ITEMS = Object.freeze([
  Object.freeze({
    regenerationInputId: "9d8c477490a8ee27adde29fc14663b2e33dbb00b6c9a20fb2ce6356f668f66e4",
    queueOrder: 1,
    segmentId: "segment-002",
    regenerationRequestId: "f4e83decf9a0330e0fec00ab436e13c5ed9c7a07894e748d6dae4b40d86a1d74",
    continuityAnchor: "continuity-anchor-segment-002",
    promptAdjustmentHint: "maintain-prompt-anchor-adjust-character-style",
    priority: "high" as const,
    imageAppInputJson:
      '{"version":"v1","inputKind":"regeneration","queueOrder":1,"segmentId":"segment-002","regenerationRequestId":"f4e83decf9a0330e0fec00ab436e13c5ed9c7a07894e748d6dae4b40d86a1d74","continuityAnchor":"continuity-anchor-segment-002","promptAdjustmentHint":"maintain-prompt-anchor-adjust-character-style","priority":"high","generatedEvidenceId":"b86db7405dae673539ffd8346cf1e34978d5f8f32db31457a4eafa29be2997d1","reason":"manual-character-style-continuity-review-required"}',
    inputItemFingerprint: "a53100bacb85a75f63dc3fe62bd1b0433303e49ab5f86fc2a42bb423804b012c",
  }),
  Object.freeze({
    regenerationInputId: "c3a58933dadc18e8954aaa23b277619dc90854e076b416635cf4c5eb4e336f2a",
    queueOrder: 2,
    segmentId: "segment-003",
    regenerationRequestId: "f36f1400013f6d1fddf528667991bb15dc0856f30e70f78b35ee3798502b1f19",
    continuityAnchor: "continuity-anchor-segment-003",
    promptAdjustmentHint: "hold-prompt-until-prior-queue-resolved",
    priority: "deferred" as const,
    imageAppInputJson:
      '{"version":"v1","inputKind":"regeneration","queueOrder":2,"segmentId":"segment-003","regenerationRequestId":"f36f1400013f6d1fddf528667991bb15dc0856f30e70f78b35ee3798502b1f19","continuityAnchor":"continuity-anchor-segment-003","promptAdjustmentHint":"hold-prompt-until-prior-queue-resolved","priority":"deferred","generatedEvidenceId":"61f9835175e9a8026af062fc1d6db985deed2d56c0e9fa63c0bc930989a5d707","reason":"manual-review-blocked-pending-prior-queue"}',
    inputItemFingerprint: "65b53005fc32a6f50943452f7b7d4a0cf1f230e6e0a16f04c04cd38231e63795",
  }),
] as const);

export const REGENERATION_IMAGE_APP_INPUT_PREVIEW_INPUT = Object.freeze({
  version: REGENERATION_IMAGE_APP_INPUT_VERSION,
  inputId: REGENERATION_IMAGE_APP_INPUT_ID,
  requestId: "image-regeneration-request-gonegi-harbor-25s-v1",
  imageRegenerationRequestFingerprint:
    "5470791889f5fcbd6ca4cbc5bcab77d032f53ee025cbb0bf942f7390ed017e49",
  sourceFingerprint: "3397ecf7c62f94a60c8b05d175db34404150c707b3e8b3525acfdd5eae659589",
  inputVersion: REGENERATION_IMAGE_APP_INPUT_KIND_VERSION,
  activeInputState: REGENERATION_IMAGE_APP_INPUT_STATE,
  totalRegenerationInputCount: 2,
  items: REGENERATION_IMAGE_APP_INPUT_PREVIEW_ITEMS,
});

export const REGENERATION_IMAGE_APP_INPUT_PREVIEW_FINGERPRINT =
  "019add3c5f73e3005cef246a09da48bcef87824f66388db5d0b356fb9caba3f9" as const;

export type RegenerationImageAppInputPreviewItemCounts = {
  totalItemCount: number;
  regenerationInputCount: number;
};

export type RegenerationImageAppInputPreviewPriority = {
  queueOrder: number;
  priority: RegenerationPriority;
};

export type RegenerationImageAppInputPreview = {
  regenerationImageAppInput: ReturnType<typeof JSON.parse>;
  fingerprint: string;
  itemCounts: RegenerationImageAppInputPreviewItemCounts;
  priorities: readonly RegenerationImageAppInputPreviewPriority[];
};

function partitionRegenerationInputPriorities(
  input: RegenerationImageAppInput
): readonly RegenerationImageAppInputPreviewPriority[] {
  return Object.freeze(
    [...input.items]
      .sort((a, b) => a.queueOrder - b.queueOrder)
      .map((item) =>
        Object.freeze({
          queueOrder: item.queueOrder,
          priority: item.priority,
        })
      )
  );
}

export function buildRegenerationImageAppInputPreviewFromInput(
  regenerationImageAppInput: RegenerationImageAppInput
): RegenerationImageAppInputPreview {
  const fingerprint = computeRegenerationImageAppInputFingerprint(regenerationImageAppInput);
  const priorities = partitionRegenerationInputPriorities(regenerationImageAppInput);

  return Object.freeze({
    regenerationImageAppInput: JSON.parse(
      serializeRegenerationImageAppInput(regenerationImageAppInput)
    ),
    fingerprint,
    itemCounts: Object.freeze({
      totalItemCount: regenerationImageAppInput.totalRegenerationInputCount,
      regenerationInputCount: regenerationImageAppInput.totalRegenerationInputCount,
    }),
    priorities,
  });
}

export function buildRegenerationImageAppInputPreview(): RegenerationImageAppInputPreview {
  return buildRegenerationImageAppInputPreviewFromInput(REGENERATION_IMAGE_APP_INPUT_PREVIEW_INPUT);
}

export function serializeRegenerationImageAppInputPreview(
  preview: RegenerationImageAppInputPreview
): string {
  return JSON.stringify({
    regenerationImageAppInput: preview.regenerationImageAppInput,
    fingerprint: preview.fingerprint,
    itemCounts: preview.itemCounts,
    priorities: preview.priorities,
  });
}
