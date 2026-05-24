/** Phase-12A: image generation request export — external AI Studio payload (pure, deterministic) */

import crypto from "crypto";
import type {
  CharacterContinuityReport,
  SteeringLock,
} from "../character-continuity/character-continuity-report.ts";

export type ImageGenerationRequestVersion = "v1";

export type SeedPolicy = "locked";

export type AspectRatio = "16:9";

export type ExportTarget = "external-ai-studio";

export type ImageGenerationLock = {
  readonly lockId: string;
  readonly strength: number;
};

export type ImageGenerationSteeringLock = {
  readonly lockId: string;
  readonly level: SteeringLock["level"];
  readonly priority: number;
  readonly strength: number;
};

export type CinematicStyleHints = {
  readonly traitHints?: readonly string[];
  readonly styleHints?: readonly string[];
};

export type ImageGenerationRequestInput = {
  readonly continuityReport: CharacterContinuityReport;
  readonly scenePrompt: string;
  readonly cinematicHints?: CinematicStyleHints;
  readonly requestIndex?: number;
};

export type ImageGenerationRequest = {
  readonly version: ImageGenerationRequestVersion;
  readonly requestId: string;
  readonly characterId: string;
  readonly prompt: string;
  readonly negativePrompt: string;
  readonly aspectRatio: AspectRatio;
  readonly seedPolicy: SeedPolicy;
  readonly identityLocks: readonly ImageGenerationLock[];
  readonly styleLocks: readonly ImageGenerationLock[];
  readonly steeringLocks: readonly ImageGenerationSteeringLock[];
  readonly exportTarget: ExportTarget;
};

export const IMAGE_GENERATION_REQUEST_VERSION: ImageGenerationRequestVersion = "v1";
export const IMAGE_GENERATION_EXPORT_TARGET: ExportTarget = "external-ai-studio";
export const IMAGE_GENERATION_ASPECT_RATIO: AspectRatio = "16:9";
export const IMAGE_GENERATION_SEED_POLICY: SeedPolicy = "locked";

const BASE_NEGATIVE_BLOCKERS: readonly string[] = Object.freeze([
  "wrong character",
  "different face",
  "anatomy drift",
  "pose break",
  "emotion overshoot",
  "style drift",
  "palette shift",
  "harsh line weight",
  "plastic skin",
  "identity collapse",
]);

function buildRequestId(index: number): string {
  return `image-request-${String(index + 1).padStart(3, "0")}`;
}

function normalizeCompactText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sortLocksById(locks: readonly ImageGenerationLock[]): readonly ImageGenerationLock[] {
  return Object.freeze(
    [...locks].sort((left, right) => left.lockId.localeCompare(right.lockId))
  );
}

function resolveIdentityLocks(report: CharacterContinuityReport): readonly ImageGenerationLock[] {
  const locks = report.steeringLocks
    .filter((lock) => lock.level === "identity" || lock.level === "anchor")
    .map((lock) =>
      Object.freeze({
        lockId: lock.lockId,
        strength: lock.strength,
      })
    );

  return sortLocksById(locks);
}

function resolveStyleLocks(report: CharacterContinuityReport): readonly ImageGenerationLock[] {
  const locks = report.steeringLocks
    .filter((lock) => lock.level === "style")
    .map((lock) =>
      Object.freeze({
        lockId: lock.lockId,
        strength: lock.strength,
      })
    );

  return sortLocksById(locks);
}

function resolveSteeringLocks(report: CharacterContinuityReport): readonly ImageGenerationSteeringLock[] {
  return Object.freeze(
    report.steeringLocks.map((lock) =>
      Object.freeze({
        lockId: lock.lockId,
        level: lock.level,
        priority: lock.priority,
        strength: lock.strength,
      })
    )
  );
}

function resolveTraitHintSegment(hints: CinematicStyleHints | undefined): string {
  const traits = hints?.traitHints ?? [];
  const styles = hints?.styleHints ?? [];
  const segments = [...traits, ...styles].map((hint) => normalizeCompactText(hint)).filter(Boolean);
  if (segments.length === 0) {
    return "";
  }
  return `style-hints:${segments.join(",")}`;
}

function buildCompactPrompt(
  report: CharacterContinuityReport,
  scenePrompt: string,
  cinematicHints: CinematicStyleHints | undefined
): string {
  const segments = [
    normalizeCompactText(scenePrompt),
    `character:${report.identitySummary.displayName}`,
    `continuity:${report.continuityScore}`,
    `risk:${report.riskLevel}`,
    `palette-stability:${report.styleSummary.paletteStability}`,
    resolveTraitHintSegment(cinematicHints),
  ].filter(Boolean);

  return segments.join(" | ");
}

function resolveDriftBlockers(report: CharacterContinuityReport): readonly string[] {
  const blockers: string[] = [];

  if (report.driftSummary.poseDriftScore > 0.2) {
    blockers.push("pose drift");
  }
  if (report.driftSummary.emotionDriftScore > 0.2) {
    blockers.push("emotion drift");
  }
  if (report.styleSummary.styleRisk !== "low") {
    blockers.push("gonegi style break");
  }
  if (report.anchorSummary.anchorRisk !== "low") {
    blockers.push("anchor mismatch");
  }

  return Object.freeze(blockers);
}

function buildNegativePrompt(report: CharacterContinuityReport): string {
  const driftBlockers = resolveDriftBlockers(report);
  const combined = [...BASE_NEGATIVE_BLOCKERS, ...driftBlockers];
  return normalizeCompactText([...new Set(combined)].sort((left, right) => left.localeCompare(right)).join(", "));
}

export function buildImageGenerationRequest(
  input: ImageGenerationRequestInput
): ImageGenerationRequest {
  const requestIndex = input.requestIndex ?? 0;
  const cinematicHints = input.cinematicHints;

  return Object.freeze({
    version: IMAGE_GENERATION_REQUEST_VERSION,
    requestId: buildRequestId(requestIndex),
    characterId: input.continuityReport.characterId,
    prompt: buildCompactPrompt(input.continuityReport, input.scenePrompt, cinematicHints),
    negativePrompt: buildNegativePrompt(input.continuityReport),
    aspectRatio: IMAGE_GENERATION_ASPECT_RATIO,
    seedPolicy: IMAGE_GENERATION_SEED_POLICY,
    identityLocks: resolveIdentityLocks(input.continuityReport),
    styleLocks: resolveStyleLocks(input.continuityReport),
    steeringLocks: resolveSteeringLocks(input.continuityReport),
    exportTarget: IMAGE_GENERATION_EXPORT_TARGET,
  });
}

export function serializeImageGenerationRequest(request: ImageGenerationRequest): string {
  return JSON.stringify({
    version: request.version,
    requestId: request.requestId,
    characterId: request.characterId,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    aspectRatio: request.aspectRatio,
    seedPolicy: request.seedPolicy,
    identityLocks: request.identityLocks,
    styleLocks: request.styleLocks,
    steeringLocks: request.steeringLocks,
    exportTarget: request.exportTarget,
  });
}

export function computeImageGenerationRequestFingerprint(request: ImageGenerationRequest): string {
  return crypto.createHash("sha256").update(serializeImageGenerationRequest(request)).digest("hex");
}

export function assertImageGenerationRequestOrdering(request: ImageGenerationRequest): boolean {
  const identitySorted = [...request.identityLocks]
    .map((lock) => lock.lockId)
    .join(",");
  const identityExpected = [...request.identityLocks]
    .map((lock) => lock.lockId)
    .sort((left, right) => left.localeCompare(right))
    .join(",");

  const styleSorted = [...request.styleLocks]
    .map((lock) => lock.lockId)
    .join(",");
  const styleExpected = [...request.styleLocks]
    .map((lock) => lock.lockId)
    .sort((left, right) => left.localeCompare(right))
    .join(",");

  const steeringPriorities = request.steeringLocks.map((lock) => lock.priority);
  const steeringOrdered = steeringPriorities.every(
    (priority, index) => index === 0 || priority >= steeringPriorities[index - 1]
  );

  return identitySorted === identityExpected && styleSorted === styleExpected && steeringOrdered;
}
