/** Phase-15A: next generation request composer — feedback loop request recomposition (pure, deterministic) */

import crypto from "crypto";
import type {
  AspectRatio,
  ExportTarget,
  ImageGenerationLock,
  ImageGenerationRequest,
  ImageGenerationSteeringLock,
  SeedPolicy,
} from "./image-generation-request.ts";
import type { ImageResultEvaluation } from "./image-result-evaluation.ts";
import type { PromptPolicyFeedback, PromptPolicyRiskLevel } from "./prompt-policy-feedback.ts";

export type NextGenerationRequestVersion = "v1";

export type ImprovementSummary = {
  readonly parentRequestId: string;
  readonly feedbackId: string;
  readonly evaluationId: string;
  readonly riskLevel: PromptPolicyRiskLevel;
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
  readonly appliedPromptCount: number;
  readonly appliedNegativeCount: number;
  readonly appliedLockCount: number;
};

export type NextGenerationRequest = {
  readonly version: NextGenerationRequestVersion;
  readonly requestId: string;
  readonly parentRequestId: string;
  readonly characterId: string;
  readonly prompt: string;
  readonly negativePrompt: string;
  readonly aspectRatio: AspectRatio;
  readonly seedPolicy: SeedPolicy;
  readonly identityLocks: readonly ImageGenerationLock[];
  readonly styleLocks: readonly ImageGenerationLock[];
  readonly steeringLocks: readonly ImageGenerationSteeringLock[];
  readonly exportTarget: ExportTarget;
  readonly appliedFeedback: readonly string[];
  readonly improvementSummary: ImprovementSummary;
};

export type NextGenerationRequestComposerInput = {
  readonly previousRequest: ImageGenerationRequest;
  readonly evaluation: ImageResultEvaluation;
  readonly feedback: PromptPolicyFeedback;
  readonly nextRequestIndex?: number;
};

export const NEXT_GENERATION_REQUEST_VERSION: NextGenerationRequestVersion = "v1";

const FEEDBACK_PRIORITY_ORDER = Object.freeze({
  character: 1,
  style: 2,
  emotion: 3,
  other: 4,
});

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function normalizeCompactText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function sortUnique(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

function buildRequestId(index: number): string {
  return `image-request-${String(index + 1).padStart(3, "0")}`;
}

function resolveNextRequestIndex(
  previousRequest: ImageGenerationRequest,
  nextRequestIndex: number | undefined
): number {
  if (nextRequestIndex !== undefined) {
    return nextRequestIndex;
  }

  const match = previousRequest.requestId.match(/(\d+)$/);
  if (!match) {
    return 1;
  }

  return Number.parseInt(match[1], 10);
}

function classifyPromptAdjustment(adjustment: string): keyof typeof FEEDBACK_PRIORITY_ORDER {
  if (/identity|character|anchor/i.test(adjustment)) {
    return "character";
  }
  if (/style|glaze|palette|line/i.test(adjustment)) {
    return "style";
  }
  if (/emotion|pose/i.test(adjustment)) {
    return "emotion";
  }
  return "other";
}

function orderPromptAdjustments(adjustments: readonly string[]): readonly string[] {
  return Object.freeze(
    [...adjustments].sort((left, right) => {
      const leftPriority = FEEDBACK_PRIORITY_ORDER[classifyPromptAdjustment(left)];
      const rightPriority = FEEDBACK_PRIORITY_ORDER[classifyPromptAdjustment(right)];
      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }
      return left.localeCompare(right);
    })
  );
}

function splitNegativeFragments(value: string): readonly string[] {
  return value
    .split(",")
    .map((fragment) => normalizeCompactText(fragment))
    .filter(Boolean);
}

function mergeNegativePrompt(previousRequest: ImageGenerationRequest, feedback: PromptPolicyFeedback): string {
  const fragments = [
    ...splitNegativeFragments(previousRequest.negativePrompt),
    ...feedback.negativePromptAdjustments.flatMap((adjustment) => splitNegativeFragments(adjustment)),
  ];

  return normalizeCompactText([...new Set(fragments)].sort((left, right) => left.localeCompare(right)).join(", "));
}

function mergePrompt(
  previousRequest: ImageGenerationRequest,
  feedback: PromptPolicyFeedback
): string {
  const orderedAdjustments = orderPromptAdjustments(feedback.promptAdjustments);
  const policySegments = orderedAdjustments.map((adjustment) => `policy:${normalizeCompactText(adjustment)}`);
  const segments = [previousRequest.prompt, ...policySegments].filter(Boolean);

  return normalizeCompactText(segments.join(" | "));
}

function parseLockAdjustment(
  adjustment: string
): { readonly lockId: string; readonly strength: number } | null {
  const match = adjustment.match(/^strengthen (?:identity|style|steering) lock:([^:]+):([0-9.]+)$/);
  if (!match) {
    return null;
  }

  return Object.freeze({
    lockId: match[1],
    strength: clampScore(Number.parseFloat(match[2])),
  });
}

function applyLockStrength<T extends { readonly lockId: string; readonly strength: number }>(
  locks: readonly T[],
  adjustments: readonly string[]
): readonly T[] {
  const strengthByLockId = new Map<string, number>();

  for (const adjustment of adjustments) {
    const parsed = parseLockAdjustment(adjustment);
    if (parsed) {
      strengthByLockId.set(parsed.lockId, parsed.strength);
    }
  }

  return Object.freeze(
    locks.map((lock) =>
      strengthByLockId.has(lock.lockId)
        ? Object.freeze({ ...lock, strength: strengthByLockId.get(lock.lockId)! })
        : lock
    )
  );
}

function resolveAppliedFeedback(feedback: PromptPolicyFeedback): readonly string[] {
  return sortUnique([
    ...feedback.promptAdjustments.map((adjustment) => `prompt:${adjustment}`),
    ...feedback.negativePromptAdjustments.map((adjustment) => `negative:${adjustment}`),
    ...feedback.lockAdjustments.map((adjustment) => `lock:${adjustment}`),
  ]);
}

function resolveImprovementSummary(
  previousRequest: ImageGenerationRequest,
  evaluation: ImageResultEvaluation,
  feedback: PromptPolicyFeedback
): ImprovementSummary {
  return Object.freeze({
    parentRequestId: previousRequest.requestId,
    feedbackId: feedback.feedbackId,
    evaluationId: evaluation.evaluationId,
    riskLevel: feedback.riskLevel,
    characterConsistencyScore: evaluation.characterConsistencyScore,
    styleConsistencyScore: evaluation.styleConsistencyScore,
    emotionalContinuityScore: evaluation.emotionalContinuityScore,
    appliedPromptCount: feedback.promptAdjustments.length,
    appliedNegativeCount: feedback.negativePromptAdjustments.length,
    appliedLockCount: feedback.lockAdjustments.length,
  });
}

export function buildNextGenerationRequest(
  input: NextGenerationRequestComposerInput
): NextGenerationRequest {
  const { previousRequest, evaluation, feedback } = input;
  const nextRequestIndex = resolveNextRequestIndex(previousRequest, input.nextRequestIndex);
  const requestId = buildRequestId(nextRequestIndex);
  const appliedFeedback = resolveAppliedFeedback(feedback);

  return Object.freeze({
    version: NEXT_GENERATION_REQUEST_VERSION,
    requestId,
    parentRequestId: previousRequest.requestId,
    characterId: previousRequest.characterId,
    prompt: mergePrompt(previousRequest, feedback),
    negativePrompt: mergeNegativePrompt(previousRequest, feedback),
    aspectRatio: previousRequest.aspectRatio,
    seedPolicy: previousRequest.seedPolicy,
    identityLocks: applyLockStrength(previousRequest.identityLocks, feedback.lockAdjustments),
    styleLocks: applyLockStrength(previousRequest.styleLocks, feedback.lockAdjustments),
    steeringLocks: applyLockStrength(previousRequest.steeringLocks, feedback.lockAdjustments),
    exportTarget: previousRequest.exportTarget,
    appliedFeedback,
    improvementSummary: resolveImprovementSummary(previousRequest, evaluation, feedback),
  });
}

export function serializeNextGenerationRequest(request: NextGenerationRequest): string {
  return JSON.stringify({
    version: request.version,
    requestId: request.requestId,
    parentRequestId: request.parentRequestId,
    characterId: request.characterId,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    aspectRatio: request.aspectRatio,
    seedPolicy: request.seedPolicy,
    identityLocks: request.identityLocks,
    styleLocks: request.styleLocks,
    steeringLocks: request.steeringLocks,
    exportTarget: request.exportTarget,
    appliedFeedback: request.appliedFeedback,
    improvementSummary: request.improvementSummary,
  });
}

export function computeNextGenerationRequestFingerprint(request: NextGenerationRequest): string {
  return crypto.createHash("sha256").update(serializeNextGenerationRequest(request)).digest("hex");
}

export function assertNextGenerationRequestDeterministic(request: NextGenerationRequest): boolean {
  const appliedSorted = [...request.appliedFeedback]
    .sort((left, right) => left.localeCompare(right))
    .join("|");

  return (
    request.appliedFeedback.join("|") === appliedSorted &&
    request.requestId.length > 0 &&
    request.parentRequestId.length > 0 &&
    request.prompt.length > 0 &&
    request.negativePrompt.length > 0
  );
}

export function assertNextGenerationRequestIdIncrement(
  previousRequest: ImageGenerationRequest,
  nextRequest: NextGenerationRequest
): boolean {
  return (
    nextRequest.parentRequestId === previousRequest.requestId &&
    nextRequest.requestId !== previousRequest.requestId
  );
}

export function assertFeedbackPriorityPreserved(request: NextGenerationRequest): boolean {
  const policySegments = request.prompt
    .split(" | ")
    .filter((segment) => segment.startsWith("policy:"))
    .map((segment) => segment.replace(/^policy:/, ""));

  if (policySegments.length < 2) {
    return true;
  }

  const priorities = policySegments.map((segment) => FEEDBACK_PRIORITY_ORDER[classifyPromptAdjustment(segment)]);

  return priorities.every(
    (priority, index) => index === 0 || priority >= priorities[index - 1]
  );
}

export function assertNextGenerationRequestNoDuplicates(request: NextGenerationRequest): boolean {
  return new Set(request.appliedFeedback).size === request.appliedFeedback.length;
}
