/** Phase-19A: automated replay orchestrator — multi-session replay queue (pure, deterministic) */

import crypto from "crypto";
import type { SessionReplayPlan } from "./session-replay-composer.ts";

export type AutomatedReplayOrchestratorVersion = "v1";

export type ReplayQueueEntry = {
  readonly queueOrder: number;
  readonly queueId: string;
  readonly replayId: string;
  readonly sessionId: string;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly stepCount: number;
};

export type ReplayComparison = {
  readonly comparisonId: string;
  readonly leftReplayId: string;
  readonly rightReplayId: string;
  readonly leftSessionId: string;
  readonly rightSessionId: string;
  readonly characterScoreDelta: number;
  readonly styleScoreDelta: number;
  readonly emotionScoreDelta: number;
  readonly driftRiskMatch: boolean;
  readonly integrityMatch: boolean;
};

export type ReplayIntegritySummary = {
  readonly orchestratorId: string;
  readonly queueCount: number;
  readonly allIdsPreserved: boolean;
  readonly allBundleAligned: boolean;
  readonly uniqueSessionCount: number;
  readonly uniqueSourceRequestCount: number;
};

export type ReplayStabilitySummary = {
  readonly averageCharacterScore: number;
  readonly averageStyleScore: number;
  readonly averageEmotionScore: number;
  readonly highDriftCount: number;
  readonly lowOverCorrectionCount: number;
  readonly queueStabilityScore: number;
};

export type AutomatedReplayOrchestratorInput = {
  readonly replayPlans: readonly SessionReplayPlan[];
  readonly orchestratorIndex?: number;
};

export type AutomatedReplayOrchestratorPlan = {
  readonly version: AutomatedReplayOrchestratorVersion;
  readonly orchestratorId: string;
  readonly replayQueue: readonly ReplayQueueEntry[];
  readonly replayComparisons: readonly ReplayComparison[];
  readonly integritySummary: ReplayIntegritySummary;
  readonly stabilitySummary: ReplayStabilitySummary;
};

export const AUTOMATED_REPLAY_ORCHESTRATOR_VERSION: AutomatedReplayOrchestratorVersion = "v1";

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(Math.min(1, Math.max(0, value)).toFixed(6));
}

function averageScores(values: readonly number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return clampScore(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function buildOrchestratorId(orchestratorIndex: number): string {
  return `replay-orchestrator-${String(orchestratorIndex + 1).padStart(3, "0")}`;
}

function buildQueueId(queueOrder: number): string {
  return `replay-queue-${String(queueOrder).padStart(3, "0")}`;
}

function buildComparisonId(index: number): string {
  return `replay-comparison-${String(index + 1).padStart(3, "0")}`;
}

function resolveRequestIndex(requestId: string): number {
  const match = requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }
  return Number.parseInt(match[1], 10);
}

function sortReplayPlans(plans: readonly SessionReplayPlan[]): readonly SessionReplayPlan[] {
  return Object.freeze(
    [...plans].sort((left, right) => {
      const sourceDelta = resolveRequestIndex(left.sourceRequestId) - resolveRequestIndex(right.sourceRequestId);
      if (sourceDelta !== 0) {
        return sourceDelta;
      }

      const sessionDelta = left.sessionId.localeCompare(right.sessionId);
      if (sessionDelta !== 0) {
        return sessionDelta;
      }

      return left.replayId.localeCompare(right.replayId);
    })
  );
}

function buildReplayQueue(plans: readonly SessionReplayPlan[]): readonly ReplayQueueEntry[] {
  const sortedPlans = sortReplayPlans(plans);

  return Object.freeze(
    sortedPlans.map((plan, index) =>
      Object.freeze({
        queueOrder: index + 1,
        queueId: buildQueueId(index + 1),
        replayId: plan.replayId,
        sessionId: plan.sessionId,
        sourceRequestId: plan.sourceRequestId,
        nextRequestId: plan.nextRequestId,
        stepCount: plan.replaySteps.length,
      })
    )
  );
}

function buildReplayComparisons(plans: readonly SessionReplayPlan[]): readonly ReplayComparison[] {
  const sortedPlans = sortReplayPlans(plans);
  if (sortedPlans.length < 2) {
    return Object.freeze([]);
  }

  const comparisons: ReplayComparison[] = [];

  for (let index = 0; index < sortedPlans.length - 1; index += 1) {
    const left = sortedPlans[index];
    const right = sortedPlans[index + 1];
    const leftOutputs = left.expectedOutputs;
    const rightOutputs = right.expectedOutputs;

    comparisons.push(
      Object.freeze({
        comparisonId: buildComparisonId(index),
        leftReplayId: left.replayId,
        rightReplayId: right.replayId,
        leftSessionId: left.sessionId,
        rightSessionId: right.sessionId,
        characterScoreDelta: clampScore(
          rightOutputs.characterConsistencyScore - leftOutputs.characterConsistencyScore
        ),
        styleScoreDelta: clampScore(rightOutputs.styleConsistencyScore - leftOutputs.styleConsistencyScore),
        emotionScoreDelta: clampScore(
          rightOutputs.emotionalContinuityScore - leftOutputs.emotionalContinuityScore
        ),
        driftRiskMatch: leftOutputs.driftRisk === rightOutputs.driftRisk,
        integrityMatch:
          left.replayIntegrity.idsPreserved &&
          right.replayIntegrity.idsPreserved &&
          left.replayIntegrity.bundleAligned &&
          right.replayIntegrity.bundleAligned,
      })
    );
  }

  return Object.freeze(
    [...comparisons].sort((left, right) => left.comparisonId.localeCompare(right.comparisonId))
  );
}

function buildIntegritySummary(
  orchestratorId: string,
  plans: readonly SessionReplayPlan[]
): ReplayIntegritySummary {
  const sessionIds = new Set(plans.map((plan) => plan.sessionId));
  const sourceRequestIds = new Set(plans.map((plan) => plan.sourceRequestId));

  return Object.freeze({
    orchestratorId,
    queueCount: plans.length,
    allIdsPreserved: plans.every((plan) => plan.replayIntegrity.idsPreserved),
    allBundleAligned: plans.every((plan) => plan.replayIntegrity.bundleAligned),
    uniqueSessionCount: sessionIds.size,
    uniqueSourceRequestCount: sourceRequestIds.size,
  });
}

function buildStabilitySummary(plans: readonly SessionReplayPlan[]): ReplayStabilitySummary {
  const characterScores = plans.map((plan) => plan.expectedOutputs.characterConsistencyScore);
  const styleScores = plans.map((plan) => plan.expectedOutputs.styleConsistencyScore);
  const emotionScores = plans.map((plan) => plan.expectedOutputs.emotionalContinuityScore);
  const highDriftCount = plans.filter(
    (plan) =>
      plan.expectedOutputs.driftRisk === "high" || plan.expectedOutputs.promptDriftRisk === "high"
  ).length;
  const lowOverCorrectionCount = plans.filter(
    (plan) => plan.expectedOutputs.overCorrectionRisk === "low"
  ).length;
  const alignmentScore = plans.filter(
    (plan) => plan.replayIntegrity.idsPreserved && plan.replayIntegrity.bundleAligned
  ).length;

  return Object.freeze({
    averageCharacterScore: averageScores(characterScores),
    averageStyleScore: averageScores(styleScores),
    averageEmotionScore: averageScores(emotionScores),
    highDriftCount,
    lowOverCorrectionCount,
    queueStabilityScore: clampScore(plans.length === 0 ? 0 : alignmentScore / plans.length),
  });
}

export function buildAutomatedReplayOrchestratorPlan(
  input: AutomatedReplayOrchestratorInput
): AutomatedReplayOrchestratorPlan {
  if (input.replayPlans.length === 0) {
    throw new Error("automated replay orchestrator requires at least one replay plan");
  }

  const orchestratorIndex = input.orchestratorIndex ?? 0;
  const orchestratorId = buildOrchestratorId(orchestratorIndex);
  const replayQueue = buildReplayQueue(input.replayPlans);
  const replayComparisons = buildReplayComparisons(input.replayPlans);

  return Object.freeze({
    version: AUTOMATED_REPLAY_ORCHESTRATOR_VERSION,
    orchestratorId,
    replayQueue,
    replayComparisons,
    integritySummary: buildIntegritySummary(orchestratorId, input.replayPlans),
    stabilitySummary: buildStabilitySummary(input.replayPlans),
  });
}

export function serializeAutomatedReplayOrchestratorPlan(plan: AutomatedReplayOrchestratorPlan): string {
  return JSON.stringify({
    version: plan.version,
    orchestratorId: plan.orchestratorId,
    replayQueue: plan.replayQueue,
    replayComparisons: plan.replayComparisons,
    integritySummary: plan.integritySummary,
    stabilitySummary: plan.stabilitySummary,
  });
}

export function computeAutomatedReplayOrchestratorFingerprint(plan: AutomatedReplayOrchestratorPlan): string {
  return crypto.createHash("sha256").update(serializeAutomatedReplayOrchestratorPlan(plan)).digest("hex");
}

export function assertAutomatedReplayOrchestratorDeterministic(
  plan: AutomatedReplayOrchestratorPlan
): boolean {
  const queueOrdered = plan.replayQueue.every(
    (entry, index) => entry.queueOrder === index + 1 && entry.queueId === buildQueueId(index + 1)
  );

  const comparisonsSorted = [...plan.replayComparisons]
    .sort((left, right) => left.comparisonId.localeCompare(right.comparisonId))
    .map((entry) => entry.comparisonId)
    .join("|");

  return (
    queueOrdered &&
    plan.replayComparisons.map((entry) => entry.comparisonId).join("|") === comparisonsSorted &&
    plan.integritySummary.orchestratorId === plan.orchestratorId &&
    plan.integritySummary.queueCount === plan.replayQueue.length &&
    plan.stabilitySummary.queueStabilityScore >= 0 &&
    plan.stabilitySummary.queueStabilityScore <= 1
  );
}

export function assertAutomatedReplayOrchestratorQueueOrdering(
  plan: AutomatedReplayOrchestratorPlan
): boolean {
  const queueSourceIds = plan.replayQueue.map((entry) => resolveRequestIndex(entry.sourceRequestId));
  return queueSourceIds.every(
    (value, index) => index === 0 || value >= queueSourceIds[index - 1]
  );
}
