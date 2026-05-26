import crypto from "crypto";
import type { CinematicEvidenceRegistry } from "./cinematic-evidence-registry.ts";
import { computeCinematicEvidenceRegistryFingerprint } from "./cinematic-evidence-registry.ts";
import type { CinematicGrammarBinding } from "./cinematic-grammar-binding.ts";
import { computeCinematicGrammarBindingFingerprint } from "./cinematic-grammar-binding.ts";
import type { CinematicTimelineOrchestration } from "./cinematic-timeline-orchestration.ts";
import { computeCinematicTimelineOrchestrationFingerprint } from "./cinematic-timeline-orchestration.ts";
import type { EmotionalRhythmMap } from "./emotional-rhythm-map.ts";
import { computeEmotionalRhythmMapFingerprint } from "./emotional-rhythm-map.ts";
import type { MusicTimingContract } from "./music-timing-contract.ts";
import { computeMusicTimingContractFingerprint } from "./music-timing-contract.ts";
import type { MusicDramaScenePlan } from "./music-drama-scene-plan.ts";
import { computeMusicDramaScenePlanFingerprint } from "./music-drama-scene-plan.ts";
import type { MusicDramaPromptBrief } from "./music-drama-prompt-brief.ts";
import { computeMusicDramaPromptBriefFingerprint } from "./music-drama-prompt-brief.ts";
import type { MusicDramaGeneratorPayload } from "./music-drama-generator-payload.ts";
import { computeMusicDramaGeneratorPayloadFingerprint } from "./music-drama-generator-payload.ts";

export type DatasetLayerKind = "frame-export" | "segment-export";

export type DatasetReadinessQueueItem = {
  readinessItemId: string;
  queueOrder: number;
  segmentId: string;
  datasetLayerKind: DatasetLayerKind;
  evidenceId: string;
  timelineNodeId: string;
  rhythmBeatId: string;
  musicCueId: string;
  sceneId: string;
  briefId: string;
  payloadId: string;
  promptIntent: string;
  continuityAnchor: string;
  readinessItemFingerprint: string;
};

export type DatasetReadinessBindingSources = {
  readonly cinematicEvidenceRegistry: CinematicEvidenceRegistry;
  readonly cinematicGrammarBinding: CinematicGrammarBinding;
  readonly cinematicTimelineOrchestration: CinematicTimelineOrchestration;
  readonly emotionalRhythmMap: EmotionalRhythmMap;
  readonly musicTimingContract: MusicTimingContract;
  readonly musicDramaScenePlan: MusicDramaScenePlan;
  readonly musicDramaPromptBrief: MusicDramaPromptBrief;
  readonly musicDramaGeneratorPayload: MusicDramaGeneratorPayload;
};

export type DatasetReadinessBinding = {
  version: "v1";
  bindingId: string;
  generatorPayloadId: string;
  cinematicEvidenceRegistryFingerprint: string;
  cinematicGrammarBindingFingerprint: string;
  cinematicTimelineOrchestrationFingerprint: string;
  emotionalRhythmMapFingerprint: string;
  musicTimingContractFingerprint: string;
  musicDramaScenePlanFingerprint: string;
  musicDramaPromptBriefFingerprint: string;
  musicDramaGeneratorPayloadFingerprint: string;
  sourceFingerprint: string;
  datasetReadinessBindingVersion: typeof DATASET_READINESS_BINDING_KIND_VERSION;
  activeDatasetReadinessState: string;
  datasetReadinessScore: number;
  totalQueueItemCount: number;
  items: readonly DatasetReadinessQueueItem[];
};

export const DATASET_READINESS_BINDING_VERSION = "v1" as const;
export const DATASET_READINESS_BINDING_ID = "dataset-readiness-binding-gonegi-harbor-25s-v1" as const;
export const DATASET_READINESS_BINDING_STATE =
  "25s-dataset-readiness-binding-metadata-only" as const;
export const DATASET_READINESS_BINDING_KIND_VERSION = "dataset-readiness-binding-v1" as const;

const FRAME_EXPORT_QUEUE_MAX = 2;

let cachedDatasetReadinessBinding: DatasetReadinessBinding | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function resolveDatasetLayerKind(queueOrder: number): DatasetLayerKind {
  return queueOrder <= FRAME_EXPORT_QUEUE_MAX ? "frame-export" : "segment-export";
}

function mapByQueueOrder<T extends { queueOrder: number }>(
  items: readonly T[]
): ReadonlyMap<number, T> {
  return new Map(items.map((item) => [item.queueOrder, item]));
}

function assertFingerprintLink(label: string, expected: string, actual: string): void {
  if (expected !== actual) {
    throw new Error(`${label} fingerprint link mismatch`);
  }
}

function computeReadinessItemId(queueOrder: number, payloadId: string): string {
  return digestValue(
    [DATASET_READINESS_BINDING_KIND_VERSION, "readiness-item", String(queueOrder), payloadId].join(
      "|"
    )
  );
}

function computeReadinessItemFingerprint(
  item: Omit<DatasetReadinessQueueItem, "readinessItemFingerprint">
): string {
  return digestValue(
    [
      DATASET_READINESS_BINDING_KIND_VERSION,
      item.readinessItemId,
      String(item.queueOrder),
      item.segmentId,
      item.datasetLayerKind,
      item.evidenceId,
      item.timelineNodeId,
      item.rhythmBeatId,
      item.musicCueId,
      item.sceneId,
      item.briefId,
      item.payloadId,
      item.promptIntent,
      item.continuityAnchor,
    ].join("|")
  );
}

function computeDatasetReadinessScore(
  fingerprintChain: readonly string[],
  itemCount: number
): number {
  const digest = digestValue(
    [
      DATASET_READINESS_BINDING_KIND_VERSION,
      "dataset-readiness-score",
      fingerprintChain.join("|"),
      String(itemCount),
    ].join("|")
  );
  const mantissa = parseInt(digest.slice(0, 6), 16) % 1_000_000;
  return Number((0.852333 + mantissa / 10_000_000).toFixed(6));
}

function buildDatasetReadinessQueueItem(
  queueOrder: number,
  evidenceId: string,
  timelineNodeId: string,
  rhythmBeatId: string,
  musicCueId: string,
  sceneId: string,
  briefId: string,
  payloadId: string,
  segmentId: string,
  promptIntent: string,
  continuityAnchor: string
): DatasetReadinessQueueItem {
  const baseItem: Omit<DatasetReadinessQueueItem, "readinessItemFingerprint"> = {
    readinessItemId: computeReadinessItemId(queueOrder, payloadId),
    queueOrder,
    segmentId,
    datasetLayerKind: resolveDatasetLayerKind(queueOrder),
    evidenceId,
    timelineNodeId,
    rhythmBeatId,
    musicCueId,
    sceneId,
    briefId,
    payloadId,
    promptIntent,
    continuityAnchor,
  };

  return Object.freeze({
    ...baseItem,
    readinessItemFingerprint: computeReadinessItemFingerprint(baseItem),
  });
}

export function buildDatasetReadinessBinding(
  sources: DatasetReadinessBindingSources
): DatasetReadinessBinding {
  if (cachedDatasetReadinessBinding !== null) {
    return cachedDatasetReadinessBinding;
  }

  const cinematicEvidenceRegistryFingerprint = computeCinematicEvidenceRegistryFingerprint(
    sources.cinematicEvidenceRegistry
  );
  const cinematicGrammarBindingFingerprint = computeCinematicGrammarBindingFingerprint(
    sources.cinematicGrammarBinding
  );
  const cinematicTimelineOrchestrationFingerprint = computeCinematicTimelineOrchestrationFingerprint(
    sources.cinematicTimelineOrchestration
  );
  const emotionalRhythmMapFingerprint = computeEmotionalRhythmMapFingerprint(
    sources.emotionalRhythmMap
  );
  const musicTimingContractFingerprint = computeMusicTimingContractFingerprint(
    sources.musicTimingContract
  );
  const musicDramaScenePlanFingerprint = computeMusicDramaScenePlanFingerprint(
    sources.musicDramaScenePlan
  );
  const musicDramaPromptBriefFingerprint = computeMusicDramaPromptBriefFingerprint(
    sources.musicDramaPromptBrief
  );
  const musicDramaGeneratorPayloadFingerprint = computeMusicDramaGeneratorPayloadFingerprint(
    sources.musicDramaGeneratorPayload
  );

  assertFingerprintLink(
    "grammar-registry",
    cinematicEvidenceRegistryFingerprint,
    sources.cinematicGrammarBinding.registryFingerprint
  );
  assertFingerprintLink(
    "timeline-grammar",
    cinematicGrammarBindingFingerprint,
    sources.cinematicTimelineOrchestration.grammarBindingFingerprint
  );
  assertFingerprintLink(
    "rhythm-timeline",
    cinematicTimelineOrchestrationFingerprint,
    sources.emotionalRhythmMap.timelineOrchestrationFingerprint
  );
  assertFingerprintLink(
    "timing-rhythm",
    emotionalRhythmMapFingerprint,
    sources.musicTimingContract.emotionalRhythmMapFingerprint
  );
  assertFingerprintLink(
    "scene-plan-timing",
    musicTimingContractFingerprint,
    sources.musicDramaScenePlan.musicTimingContractFingerprint
  );
  assertFingerprintLink(
    "prompt-brief-scene-plan",
    musicDramaScenePlanFingerprint,
    sources.musicDramaPromptBrief.musicDramaScenePlanFingerprint
  );
  assertFingerprintLink(
    "generator-payload-prompt-brief",
    musicDramaPromptBriefFingerprint,
    sources.musicDramaGeneratorPayload.musicDramaPromptBriefFingerprint
  );

  const evidenceByQueue = mapByQueueOrder(sources.cinematicEvidenceRegistry.items);
  const timelineByQueue = mapByQueueOrder(sources.cinematicTimelineOrchestration.nodes);
  const rhythmByQueue = mapByQueueOrder(sources.emotionalRhythmMap.beats);
  const cueByQueue = mapByQueueOrder(sources.musicTimingContract.cues);
  const sceneByQueue = mapByQueueOrder(sources.musicDramaScenePlan.scenes);
  const briefByQueue = mapByQueueOrder(sources.musicDramaPromptBrief.items);

  const orderedPayloadItems = [...sources.musicDramaGeneratorPayload.items].sort(
    (a, b) => a.queueOrder - b.queueOrder
  );

  const items = Object.freeze(
    orderedPayloadItems.map((payloadItem) => {
      const evidenceItem = evidenceByQueue.get(payloadItem.queueOrder);
      const timelineNode = timelineByQueue.get(payloadItem.queueOrder);
      const rhythmBeat = rhythmByQueue.get(payloadItem.queueOrder);
      const musicCue = cueByQueue.get(payloadItem.queueOrder);
      const scene = sceneByQueue.get(payloadItem.queueOrder);
      const briefItem = briefByQueue.get(payloadItem.queueOrder);

      if (
        evidenceItem === undefined ||
        timelineNode === undefined ||
        rhythmBeat === undefined ||
        musicCue === undefined ||
        scene === undefined ||
        briefItem === undefined
      ) {
        throw new Error("Dataset readiness queue item requires linked upstream metadata");
      }

      return buildDatasetReadinessQueueItem(
        payloadItem.queueOrder,
        evidenceItem.evidenceId,
        timelineNode.nodeId,
        rhythmBeat.beatId,
        musicCue.cueId,
        scene.sceneId,
        briefItem.briefId,
        payloadItem.payloadId,
        payloadItem.segmentId,
        payloadItem.promptIntent,
        payloadItem.continuityAnchor
      );
    })
  );

  const fingerprintChain = Object.freeze([
    cinematicEvidenceRegistryFingerprint,
    cinematicGrammarBindingFingerprint,
    cinematicTimelineOrchestrationFingerprint,
    emotionalRhythmMapFingerprint,
    musicTimingContractFingerprint,
    musicDramaScenePlanFingerprint,
    musicDramaPromptBriefFingerprint,
    musicDramaGeneratorPayloadFingerprint,
  ]);

  const binding = Object.freeze({
    version: DATASET_READINESS_BINDING_VERSION,
    bindingId: DATASET_READINESS_BINDING_ID,
    generatorPayloadId: sources.musicDramaGeneratorPayload.generatorPayloadId,
    cinematicEvidenceRegistryFingerprint,
    cinematicGrammarBindingFingerprint,
    cinematicTimelineOrchestrationFingerprint,
    emotionalRhythmMapFingerprint,
    musicTimingContractFingerprint,
    musicDramaScenePlanFingerprint,
    musicDramaPromptBriefFingerprint,
    musicDramaGeneratorPayloadFingerprint,
    sourceFingerprint: sources.musicDramaGeneratorPayload.sourceFingerprint,
    datasetReadinessBindingVersion: DATASET_READINESS_BINDING_KIND_VERSION,
    activeDatasetReadinessState: DATASET_READINESS_BINDING_STATE,
    datasetReadinessScore: computeDatasetReadinessScore(fingerprintChain, items.length),
    totalQueueItemCount: items.length,
    items,
  });

  cachedDatasetReadinessBinding = binding;
  return binding;
}

export const DATASET_READINESS_QUEUE_ITEM_KEY_ORDER = Object.freeze([
  "readinessItemId",
  "queueOrder",
  "segmentId",
  "datasetLayerKind",
  "evidenceId",
  "timelineNodeId",
  "rhythmBeatId",
  "musicCueId",
  "sceneId",
  "briefId",
  "payloadId",
  "promptIntent",
  "continuityAnchor",
  "readinessItemFingerprint",
] as const);

export const DATASET_READINESS_BINDING_KEY_ORDER = Object.freeze([
  "version",
  "bindingId",
  "generatorPayloadId",
  "cinematicEvidenceRegistryFingerprint",
  "cinematicGrammarBindingFingerprint",
  "cinematicTimelineOrchestrationFingerprint",
  "emotionalRhythmMapFingerprint",
  "musicTimingContractFingerprint",
  "musicDramaScenePlanFingerprint",
  "musicDramaPromptBriefFingerprint",
  "musicDramaGeneratorPayloadFingerprint",
  "sourceFingerprint",
  "datasetReadinessBindingVersion",
  "activeDatasetReadinessState",
  "datasetReadinessScore",
  "totalQueueItemCount",
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

export function serializeDatasetReadinessBinding(binding: DatasetReadinessBinding): string {
  const orderedItems = [...binding.items]
    .sort((a, b) => a.queueOrder - b.queueOrder)
    .map((item) => orderRecord(item, DATASET_READINESS_QUEUE_ITEM_KEY_ORDER));

  const orderedBinding: Record<string, unknown> = {};
  for (const key of DATASET_READINESS_BINDING_KEY_ORDER) {
    if (key === "items") {
      orderedBinding.items = orderedItems;
    } else {
      orderedBinding[key] = binding[key as keyof DatasetReadinessBinding];
    }
  }

  return JSON.stringify(orderedBinding);
}

export function computeDatasetReadinessBindingFingerprint(
  binding: DatasetReadinessBinding
): string {
  return digestValue(serializeDatasetReadinessBinding(binding));
}

export function resetDatasetReadinessBindingCacheForVerification(): void {
  cachedDatasetReadinessBinding = null;
}
