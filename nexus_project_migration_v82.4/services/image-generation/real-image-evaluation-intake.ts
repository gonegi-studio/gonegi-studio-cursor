/** Phase-21A: real image evaluation intake — AI Studio manual QA → evaluation bridge (pure, deterministic) */

import crypto from "crypto";
import type { ImageGenerationRequest } from "./image-generation-request.ts";
import type { ImageEvaluationSignals } from "./image-result-evaluation.ts";
import { CONTINUITY_BREAK_THRESHOLD } from "./image-result-evaluation.ts";

export type RealImageEvaluationIntakeVersion = "v1";

export type ManualIntakeImageEntry = {
  readonly imageRef: string;
  readonly sortKey?: string;
  readonly primary?: boolean;
  readonly visualNotes?: readonly string[];
};

export type ManualRealImageEvaluationIntake = {
  readonly images: readonly ManualIntakeImageEntry[];
  readonly visualObservations?: readonly string[];
  readonly matchScores?: Partial<ImageEvaluationSignals>;
  readonly detectedBreaks?: readonly string[];
  readonly intakeIndex?: number;
};

export type RealImageIntakeEntry = {
  readonly imageOrder: number;
  readonly imageId: string;
  readonly imageRef: string;
  readonly primary: boolean;
  readonly visualNotes: readonly string[];
};

export type RealImageContinuityFlags = {
  readonly identityStable: boolean;
  readonly anchorStable: boolean;
  readonly styleStable: boolean;
  readonly poseStable: boolean;
  readonly emotionStable: boolean;
  readonly hasContinuityBreaks: boolean;
  readonly breakCount: number;
};

export type RealImageEvaluationIntakeInput = {
  readonly request: ImageGenerationRequest;
  readonly manualIntake: ManualRealImageEvaluationIntake;
  readonly intakeIndex?: number;
};

export type RealImageEvaluationIntake = {
  readonly version: RealImageEvaluationIntakeVersion;
  readonly intakeId: string;
  readonly sourceRequestId: string;
  readonly imageSet: readonly RealImageIntakeEntry[];
  readonly normalizedSignals: ImageEvaluationSignals;
  readonly evaluationHints: readonly string[];
  readonly continuityFlags: RealImageContinuityFlags;
};

export const REAL_IMAGE_EVALUATION_INTAKE_VERSION: RealImageEvaluationIntakeVersion = "v1";

export const REAL_IMAGE_STYLE_STABILITY_THRESHOLD = 0.8;

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function buildIntakeId(intakeIndex: number): string {
  return `real-image-intake-${String(intakeIndex + 1).padStart(3, "0")}`;
}

function buildImageId(imageOrder: number): string {
  return `real-image-${String(imageOrder).padStart(3, "0")}`;
}

function resolveIntakeIndex(
  request: ImageGenerationRequest,
  manualIntake: ManualRealImageEvaluationIntake,
  intakeIndex: number | undefined
): number {
  if (intakeIndex !== undefined) {
    return intakeIndex;
  }
  if (manualIntake.intakeIndex !== undefined) {
    return manualIntake.intakeIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveImageSortKey(entry: ManualIntakeImageEntry): string {
  return entry.sortKey ?? entry.imageRef;
}

function sortManualImages(images: readonly ManualIntakeImageEntry[]): readonly ManualIntakeImageEntry[] {
  return Object.freeze(
    [...images].sort((left, right) => {
      const keyDelta = resolveImageSortKey(left).localeCompare(resolveImageSortKey(right));
      if (keyDelta !== 0) {
        return keyDelta;
      }
      return left.imageRef.localeCompare(right.imageRef);
    })
  );
}

function buildImageSet(images: readonly ManualIntakeImageEntry[]): readonly RealImageIntakeEntry[] {
  const sortedImages = sortManualImages(images);

  return Object.freeze(
    sortedImages.map((entry, index) =>
      Object.freeze({
        imageOrder: index + 1,
        imageId: buildImageId(index + 1),
        imageRef: entry.imageRef,
        primary: entry.primary ?? index === 0,
        visualNotes: sortUnique(entry.visualNotes ?? []),
      })
    )
  );
}

function buildNormalizedSignals(manualIntake: ManualRealImageEvaluationIntake): ImageEvaluationSignals {
  const scores = manualIntake.matchScores ?? {};
  const detectedBreaks = sortUnique(manualIntake.detectedBreaks ?? []);

  return Object.freeze({
    identityMatchScore: clampScore(scores.identityMatchScore ?? 0),
    anchorMatchScore: clampScore(scores.anchorMatchScore ?? 0),
    paletteMatchScore: clampScore(scores.paletteMatchScore ?? 0),
    glazeMatchScore: clampScore(scores.glazeMatchScore ?? 0),
    lineWeightMatchScore: clampScore(scores.lineWeightMatchScore ?? 0),
    poseMatchScore: clampScore(scores.poseMatchScore ?? 0),
    emotionMatchScore: clampScore(scores.emotionMatchScore ?? 0),
    detectedBreaks: detectedBreaks.length === 0 ? undefined : detectedBreaks,
  });
}

function resolveStyleStable(signals: ImageEvaluationSignals): boolean {
  const styleAverage = clampScore(
    (signals.paletteMatchScore + signals.glazeMatchScore + signals.lineWeightMatchScore) / 3
  );
  return styleAverage >= REAL_IMAGE_STYLE_STABILITY_THRESHOLD;
}

function buildContinuityFlags(
  manualIntake: ManualRealImageEvaluationIntake,
  signals: ImageEvaluationSignals
): RealImageContinuityFlags {
  const detectedBreaks = sortUnique([
    ...(manualIntake.detectedBreaks ?? []),
    ...(signals.detectedBreaks ?? []),
  ]);

  return Object.freeze({
    identityStable: signals.identityMatchScore >= CONTINUITY_BREAK_THRESHOLD,
    anchorStable: signals.anchorMatchScore >= CONTINUITY_BREAK_THRESHOLD,
    styleStable: resolveStyleStable(signals),
    poseStable: signals.poseMatchScore >= CONTINUITY_BREAK_THRESHOLD,
    emotionStable: signals.emotionMatchScore >= CONTINUITY_BREAK_THRESHOLD,
    hasContinuityBreaks: detectedBreaks.length > 0,
    breakCount: detectedBreaks.length,
  });
}

function buildEvaluationHints(
  request: ImageGenerationRequest,
  manualIntake: ManualRealImageEvaluationIntake
): readonly string[] {
  const hints: string[] = [
    "bridge visual QA to ImageResultEvaluation loop",
    `source request:${request.requestId}`,
    `character:${request.characterId}`,
    `export target:${request.exportTarget}`,
  ];

  if (request.identityLocks.length > 0) {
    hints.push(`verify identity lock count:${request.identityLocks.length}`);
  }
  if (request.styleLocks.length > 0) {
    hints.push(`verify style lock count:${request.styleLocks.length}`);
  }
  if (manualIntake.visualObservations) {
    hints.push(...manualIntake.visualObservations);
  }

  const primaryImage = sortManualImages(manualIntake.images).find((entry) => entry.primary) ??
    sortManualImages(manualIntake.images)[0];
  if (primaryImage) {
    hints.push(`primary image ref:${primaryImage.imageRef}`);
  }

  return sortUnique(hints);
}

export function buildRealImageEvaluationIntake(
  input: RealImageEvaluationIntakeInput
): RealImageEvaluationIntake {
  if (input.manualIntake.images.length === 0) {
    throw new Error("real image evaluation intake requires at least one image entry");
  }

  const intakeIndex = resolveIntakeIndex(input.request, input.manualIntake, input.intakeIndex);
  const intakeId = buildIntakeId(intakeIndex);
  const imageSet = buildImageSet(input.manualIntake.images);
  const normalizedSignals = buildNormalizedSignals(input.manualIntake);
  const evaluationHints = buildEvaluationHints(input.request, input.manualIntake);

  return Object.freeze({
    version: REAL_IMAGE_EVALUATION_INTAKE_VERSION,
    intakeId,
    sourceRequestId: input.request.requestId,
    imageSet,
    normalizedSignals,
    evaluationHints,
    continuityFlags: buildContinuityFlags(input.manualIntake, normalizedSignals),
  });
}

export function serializeRealImageEvaluationIntake(intake: RealImageEvaluationIntake): string {
  return JSON.stringify({
    version: intake.version,
    intakeId: intake.intakeId,
    sourceRequestId: intake.sourceRequestId,
    imageSet: intake.imageSet,
    normalizedSignals: intake.normalizedSignals,
    evaluationHints: intake.evaluationHints,
    continuityFlags: intake.continuityFlags,
  });
}

export function computeRealImageEvaluationIntakeFingerprint(intake: RealImageEvaluationIntake): string {
  return crypto.createHash("sha256").update(serializeRealImageEvaluationIntake(intake)).digest("hex");
}

export function assertRealImageEvaluationIntakeImageOrdering(intake: RealImageEvaluationIntake): boolean {
  const imageRefs = intake.imageSet.map((entry) => entry.imageRef);
  const sortedRefs = [...imageRefs].sort((left, right) => left.localeCompare(right));

  return (
    intake.imageSet.every(
      (entry, index) => entry.imageOrder === index + 1 && entry.imageId === buildImageId(index + 1)
    ) && imageRefs.join("|") === sortedRefs.join("|")
  );
}

export function assertRealImageEvaluationIntakeDuplicateHintsRemoved(
  intake: RealImageEvaluationIntake
): boolean {
  const uniqueCount = new Set(intake.evaluationHints).size;
  const sortedHints = [...intake.evaluationHints].sort((left, right) => left.localeCompare(right));

  return (
    uniqueCount === intake.evaluationHints.length &&
    intake.evaluationHints.join("|") === sortedHints.join("|")
  );
}

export function assertRealImageEvaluationIntakeDeterministic(
  intake: RealImageEvaluationIntake
): boolean {
  const signals = intake.normalizedSignals;
  const signalScores = [
    signals.identityMatchScore,
    signals.anchorMatchScore,
    signals.paletteMatchScore,
    signals.glazeMatchScore,
    signals.lineWeightMatchScore,
    signals.poseMatchScore,
    signals.emotionMatchScore,
  ];

  return (
    assertRealImageEvaluationIntakeImageOrdering(intake) &&
    assertRealImageEvaluationIntakeDuplicateHintsRemoved(intake) &&
    intake.sourceRequestId.length > 0 &&
    signalScores.every((score) => score >= 0 && score <= 1) &&
    intake.continuityFlags.breakCount >= 0
  );
}
