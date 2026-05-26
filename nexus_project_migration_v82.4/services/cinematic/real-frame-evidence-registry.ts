import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { RealMp4FrameExtraction } from "./real-mp4-frame-extraction.ts";
import {
  REAL_MP4_FRAME_EXTRACTION_MAX_FRAME_COUNT,
  REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS,
  computeRealMp4FrameExtractionFingerprint,
} from "./real-mp4-frame-extraction.ts";

export type RealFrameEvidenceItemStatus = "registered" | "linkage-mismatch" | "registry-blocked";

export type RealFrameEvidenceRegistryStatus =
  | "registry-complete"
  | "registry-blocked"
  | "registry-mismatch";

export type RealFrameEvidenceItem = {
  frameEvidenceId: string;
  queueOrder: number;
  timestampSeconds: string;
  framePath: string;
  frameFingerprint: string;
  fileSizeBytes: number;
  sourceFingerprint: string;
  intakeVideoId: string;
  evidenceStatus: RealFrameEvidenceItemStatus;
};

export type RealFrameEvidenceRegistry = {
  version: "v1";
  registryId: string;
  extractionId: string;
  extractionFingerprint: string;
  registryVersion: typeof REAL_FRAME_EVIDENCE_REGISTRY_KIND_VERSION;
  activeRegistryState: string;
  registryStatus: RealFrameEvidenceRegistryStatus;
  totalFrameCount: typeof REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT;
  registeredFrameCount: number;
  items: readonly RealFrameEvidenceItem[];
  overwriteExecuted: false;
  inferenceExecuted: false;
  providerCallExecuted: false;
};

export const REAL_FRAME_EVIDENCE_REGISTRY_VERSION = "v1" as const;
export const REAL_FRAME_EVIDENCE_REGISTRY_KIND_VERSION = "real-frame-evidence-registry-v1" as const;
export const REAL_FRAME_EVIDENCE_REGISTRY_ID =
  "real-frame-evidence-registry-gonegi-harbor-25s-v1" as const;
export const REAL_FRAME_EVIDENCE_REGISTRY_STATE =
  "25s-real-frame-evidence-registry-metadata-only" as const;
export const REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT = 3 as const;

export const REAL_FRAME_EVIDENCE_REGISTRY_KEY_ORDER = Object.freeze([
  "version",
  "registryId",
  "extractionId",
  "extractionFingerprint",
  "registryVersion",
  "activeRegistryState",
  "registryStatus",
  "totalFrameCount",
  "registeredFrameCount",
  "items",
  "overwriteExecuted",
  "inferenceExecuted",
  "providerCallExecuted",
] as const);

export const REAL_FRAME_EVIDENCE_ITEM_KEY_ORDER = Object.freeze([
  "frameEvidenceId",
  "queueOrder",
  "timestampSeconds",
  "framePath",
  "frameFingerprint",
  "fileSizeBytes",
  "sourceFingerprint",
  "intakeVideoId",
  "evidenceStatus",
] as const);

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let cachedRealFrameEvidenceRegistry: RealFrameEvidenceRegistry | null = null;

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash("sha256").update(buffer ?? Buffer.alloc(0)).digest("hex");
}

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveAbsolutePath(relativePath: string): string {
  return path.join(PROJECT_ROOT, relativePath);
}

function resolveOnDiskFrameFingerprint(relativePath: string): string {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return digestBuffer(null);
  }
  return digestBuffer(fs.readFileSync(absolutePath));
}

function resolveOnDiskFileSizeBytes(relativePath: string): number {
  const absolutePath = resolveAbsolutePath(relativePath);
  if (!fs.existsSync(absolutePath)) {
    return 0;
  }
  return fs.statSync(absolutePath).size;
}

function computeFrameEvidenceId(
  queueOrder: number,
  framePath: string,
  frameFingerprint: string,
  sourceFingerprint: string,
  intakeVideoId: string
): string {
  return digestValue(
    [
      REAL_FRAME_EVIDENCE_REGISTRY_KIND_VERSION,
      "frame-evidence",
      String(queueOrder),
      framePath,
      frameFingerprint,
      sourceFingerprint,
      intakeVideoId,
    ].join("|")
  );
}

function computeRegistryId(extraction: RealMp4FrameExtraction): string {
  return digestValue(
    [
      REAL_FRAME_EVIDENCE_REGISTRY_KIND_VERSION,
      "registry",
      extraction.extractionId,
      extraction.sourceFingerprint,
      extraction.intakeVideoId,
    ].join("|")
  );
}

function resolveRegistryBlockedReason(extraction: RealMp4FrameExtraction): string | null {
  if (extraction.extractionStatus !== "extraction-success") {
    return "extraction-not-success";
  }
  if (extraction.extractedFrames.length !== REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT) {
    return "extracted-frame-count-mismatch";
  }
  if (extraction.extractedFrames.some((frame) => frame.fileSizeBytes <= 0)) {
    return "extracted-frame-size-invalid";
  }
  return null;
}

function resolveItemEvidenceStatus(
  queueOrder: number,
  expectedTimestampSeconds: string,
  extractedFrame: RealMp4FrameExtraction["extractedFrames"][number] | undefined,
  extraction: RealMp4FrameExtraction,
  registryBlocked: boolean
): RealFrameEvidenceItemStatus {
  if (registryBlocked) {
    return "registry-blocked";
  }

  if (extractedFrame === undefined) {
    return "linkage-mismatch";
  }

  const onDiskFingerprint = resolveOnDiskFrameFingerprint(extractedFrame.framePath);
  const onDiskFileSizeBytes = resolveOnDiskFileSizeBytes(extractedFrame.framePath);

  const linkagePass =
    extractedFrame.timestampSeconds === expectedTimestampSeconds &&
    extractedFrame.fileSizeBytes > 0 &&
    onDiskFileSizeBytes > 0 &&
    extractedFrame.fileSizeBytes === onDiskFileSizeBytes &&
    extractedFrame.frameFingerprint === onDiskFingerprint &&
    onDiskFingerprint.length === 64;

  return linkagePass ? "registered" : "linkage-mismatch";
}

function buildFrameEvidenceItem(
  queueOrder: number,
  expectedTimestampSeconds: string,
  extractedFrame: RealMp4FrameExtraction["extractedFrames"][number] | undefined,
  extraction: RealMp4FrameExtraction,
  registryBlocked: boolean
): RealFrameEvidenceItem {
  const evidenceStatus = resolveItemEvidenceStatus(
    queueOrder,
    expectedTimestampSeconds,
    extractedFrame,
    extraction,
    registryBlocked
  );

  const framePath = extractedFrame?.framePath ?? "";
  const frameFingerprint =
    extractedFrame !== undefined
      ? resolveOnDiskFrameFingerprint(extractedFrame.framePath)
      : digestBuffer(null);
  const fileSizeBytes =
    extractedFrame !== undefined ? resolveOnDiskFileSizeBytes(extractedFrame.framePath) : 0;

  return Object.freeze({
    frameEvidenceId: computeFrameEvidenceId(
      queueOrder,
      framePath,
      frameFingerprint,
      extraction.sourceFingerprint,
      extraction.intakeVideoId
    ),
    queueOrder,
    timestampSeconds: expectedTimestampSeconds,
    framePath,
    frameFingerprint,
    fileSizeBytes,
    sourceFingerprint: extraction.sourceFingerprint,
    intakeVideoId: extraction.intakeVideoId,
    evidenceStatus,
  });
}

function resolveRegistryStatus(
  registryBlocked: boolean,
  items: readonly RealFrameEvidenceItem[]
): RealFrameEvidenceRegistryStatus {
  if (registryBlocked) {
    return "registry-blocked";
  }

  const queueOrderValid = items.every((item, index) => item.queueOrder === index);
  const allRegistered =
    items.length === REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT &&
    items.every((item) => item.evidenceStatus === "registered");

  if (!queueOrderValid || !allRegistered) {
    return "registry-mismatch";
  }

  return "registry-complete";
}

function buildRealFrameEvidenceRegistryInternal(
  realMp4FrameExtraction: RealMp4FrameExtraction
): RealFrameEvidenceRegistry {
  const registryBlockedReason = resolveRegistryBlockedReason(realMp4FrameExtraction);
  const registryBlocked = registryBlockedReason !== null;

  const items = Object.freeze(
    REAL_MP4_FRAME_EXTRACTION_TARGET_SPECS.map((target) =>
      buildFrameEvidenceItem(
        target.queueOrder,
        target.timestampSeconds,
        realMp4FrameExtraction.extractedFrames[target.queueOrder],
        realMp4FrameExtraction,
        registryBlocked
      )
    )
  );

  const registeredFrameCount = items.filter((item) => item.evidenceStatus === "registered").length;

  return Object.freeze({
    version: REAL_FRAME_EVIDENCE_REGISTRY_VERSION,
    registryId: computeRegistryId(realMp4FrameExtraction),
    extractionId: realMp4FrameExtraction.extractionId,
    extractionFingerprint: computeRealMp4FrameExtractionFingerprint(realMp4FrameExtraction),
    registryVersion: REAL_FRAME_EVIDENCE_REGISTRY_KIND_VERSION,
    activeRegistryState: REAL_FRAME_EVIDENCE_REGISTRY_STATE,
    registryStatus: resolveRegistryStatus(registryBlocked, items),
    totalFrameCount: REAL_FRAME_EVIDENCE_REGISTRY_MAX_FRAME_COUNT,
    registeredFrameCount,
    items,
    overwriteExecuted: false,
    inferenceExecuted: false,
    providerCallExecuted: false,
  });
}

export function buildRealFrameEvidenceRegistry(
  realMp4FrameExtraction: RealMp4FrameExtraction
): RealFrameEvidenceRegistry {
  if (cachedRealFrameEvidenceRegistry !== null) {
    return cachedRealFrameEvidenceRegistry;
  }

  const registry = buildRealFrameEvidenceRegistryInternal(realMp4FrameExtraction);
  cachedRealFrameEvidenceRegistry = registry;
  return registry;
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

export function serializeRealFrameEvidenceRegistry(registry: RealFrameEvidenceRegistry): string {
  const orderedItems = [...registry.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, REAL_FRAME_EVIDENCE_ITEM_KEY_ORDER));

  const orderedRegistry: Record<string, unknown> = {};
  for (const key of REAL_FRAME_EVIDENCE_REGISTRY_KEY_ORDER) {
    if (key === "items") {
      orderedRegistry.items = orderedItems;
    } else {
      orderedRegistry[key] = registry[key as keyof RealFrameEvidenceRegistry];
    }
  }

  return JSON.stringify(orderedRegistry);
}

export function computeRealFrameEvidenceRegistryFingerprint(
  registry: RealFrameEvidenceRegistry
): string {
  return digestValue(serializeRealFrameEvidenceRegistry(registry));
}

export function resetRealFrameEvidenceRegistryCacheForVerification(): void {
  cachedRealFrameEvidenceRegistry = null;
}
