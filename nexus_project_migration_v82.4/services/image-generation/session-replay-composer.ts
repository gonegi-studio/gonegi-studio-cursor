/** Phase-18A: session replay composer — archived session deterministic replay plan (pure, deterministic) */

import crypto from "crypto";
import type { GenerationSessionExport } from "./generation-session-export.ts";

export type SessionReplayPlanVersion = "v1";

export type SessionReplayStepKind =
  | "load-source-request"
  | "export-ai-studio"
  | "evaluate-result"
  | "apply-feedback"
  | "compose-next-request"
  | "consolidate-memory";

export type SessionReplayStep = {
  readonly stepId: string;
  readonly stepOrder: number;
  readonly stepKind: SessionReplayStepKind;
  readonly artifactId: string;
  readonly description: string;
};

export type SessionReplayIntegrity = {
  readonly sessionId: string;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly exportId: string;
  readonly evaluationId: string;
  readonly feedbackId: string;
  readonly memoryId: string;
  readonly iterationCount: number;
  readonly idsPreserved: boolean;
  readonly bundleAligned: boolean;
};

export type SessionReplayExpectedOutputs = {
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly exportId: string;
  readonly evaluationId: string;
  readonly feedbackId: string;
  readonly memoryId: string;
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
  readonly driftRisk: GenerationSessionExport["qualitySummary"]["driftRisk"];
  readonly cumulativeCharacterScore: number;
  readonly cumulativeStyleScore: number;
  readonly cumulativeEmotionScore: number;
  readonly promptDriftRisk: GenerationSessionExport["memorySummary"]["promptDriftRisk"];
  readonly overCorrectionRisk: GenerationSessionExport["memorySummary"]["overCorrectionRisk"];
  readonly appliedFeedbackCount: number;
};

export type SessionReplayComposerInput = {
  readonly sessionExport: GenerationSessionExport;
  readonly replayIndex?: number;
};

export type SessionReplayPlan = {
  readonly version: SessionReplayPlanVersion;
  readonly replayId: string;
  readonly sessionId: string;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly replaySteps: readonly SessionReplayStep[];
  readonly replayIntegrity: SessionReplayIntegrity;
  readonly expectedOutputs: SessionReplayExpectedOutputs;
};

export const SESSION_REPLAY_PLAN_VERSION: SessionReplayPlanVersion = "v1";

const REPLAY_STEP_SEQUENCE: readonly SessionReplayStepKind[] = Object.freeze([
  "load-source-request",
  "export-ai-studio",
  "evaluate-result",
  "apply-feedback",
  "compose-next-request",
  "consolidate-memory",
]);

function buildReplayId(replayIndex: number): string {
  return `session-replay-${String(replayIndex + 1).padStart(3, "0")}`;
}

function buildStepId(stepOrder: number): string {
  return `replay-step-${String(stepOrder).padStart(3, "0")}`;
}

function resolveReplayIndex(sessionExport: GenerationSessionExport, replayIndex: number | undefined): number {
  if (replayIndex !== undefined) {
    return replayIndex;
  }

  const match = sessionExport.sessionId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function resolveArtifactId(stepKind: SessionReplayStepKind, sessionExport: GenerationSessionExport): string {
  const archive = sessionExport.archiveSummary;
  const bundle = sessionExport.replayBundle;

  switch (stepKind) {
    case "load-source-request":
      return bundle.request.requestId;
    case "export-ai-studio":
      return bundle.aiStudioExport.exportId;
    case "evaluate-result":
      return bundle.evaluation.evaluationId;
    case "apply-feedback":
      return bundle.feedback.feedbackId;
    case "compose-next-request":
      return bundle.nextRequest.requestId;
    case "consolidate-memory":
      return bundle.memory.memoryId;
    default:
      return archive.sessionId;
  }
}

function resolveStepDescription(stepKind: SessionReplayStepKind, artifactId: string): string {
  switch (stepKind) {
    case "load-source-request":
      return `load archived source request:${artifactId}`;
    case "export-ai-studio":
      return `replay AI Studio export:${artifactId}`;
    case "evaluate-result":
      return `replay image result evaluation:${artifactId}`;
    case "apply-feedback":
      return `replay prompt policy feedback:${artifactId}`;
    case "compose-next-request":
      return `replay next generation request:${artifactId}`;
    case "consolidate-memory":
      return `replay multi-iteration feedback memory:${artifactId}`;
    default:
      return `replay artifact:${artifactId}`;
  }
}

function buildReplaySteps(sessionExport: GenerationSessionExport): readonly SessionReplayStep[] {
  return Object.freeze(
    REPLAY_STEP_SEQUENCE.map((stepKind, index) => {
      const stepOrder = index + 1;
      const artifactId = resolveArtifactId(stepKind, sessionExport);

      return Object.freeze({
        stepId: buildStepId(stepOrder),
        stepOrder,
        stepKind,
        artifactId,
        description: resolveStepDescription(stepKind, artifactId),
      });
    })
  );
}

function resolveIdsPreserved(sessionExport: GenerationSessionExport): boolean {
  const archive = sessionExport.archiveSummary;
  const bundle = sessionExport.replayBundle;

  return (
    archive.sessionId === sessionExport.sessionId &&
    archive.sourceRequestId === sessionExport.sourceRequestId &&
    archive.nextRequestId === sessionExport.nextRequestId &&
    bundle.request.requestId === sessionExport.sourceRequestId &&
    bundle.nextRequest.requestId === sessionExport.nextRequestId &&
    bundle.evaluation.evaluationId === archive.evaluationId &&
    bundle.feedback.feedbackId === archive.feedbackId &&
    bundle.memory.memoryId === archive.memoryId
  );
}

function resolveBundleAligned(sessionExport: GenerationSessionExport): boolean {
  const bundle = sessionExport.replayBundle;

  return (
    bundle.nextRequest.parentRequestId === bundle.request.requestId &&
    bundle.aiStudioExport.prompt === bundle.request.prompt &&
    bundle.aiStudioExport.negativePrompt === bundle.request.negativePrompt &&
    bundle.feedback.nextRequestHints.sourceRequestId === bundle.request.requestId &&
    bundle.feedback.nextRequestHints.sourceEvaluationId === bundle.evaluation.evaluationId
  );
}

function buildReplayIntegrity(sessionExport: GenerationSessionExport): SessionReplayIntegrity {
  const archive = sessionExport.archiveSummary;

  return Object.freeze({
    sessionId: sessionExport.sessionId,
    sourceRequestId: sessionExport.sourceRequestId,
    nextRequestId: sessionExport.nextRequestId,
    exportId: archive.exportId,
    evaluationId: archive.evaluationId,
    feedbackId: archive.feedbackId,
    memoryId: archive.memoryId,
    iterationCount: archive.iterationCount,
    idsPreserved: resolveIdsPreserved(sessionExport),
    bundleAligned: resolveBundleAligned(sessionExport),
  });
}

function buildExpectedOutputs(sessionExport: GenerationSessionExport): SessionReplayExpectedOutputs {
  const archive = sessionExport.archiveSummary;
  const quality = sessionExport.qualitySummary;
  const feedback = sessionExport.feedbackSummary;
  const memory = sessionExport.memorySummary;

  return Object.freeze({
    sourceRequestId: sessionExport.sourceRequestId,
    nextRequestId: sessionExport.nextRequestId,
    exportId: archive.exportId,
    evaluationId: archive.evaluationId,
    feedbackId: archive.feedbackId,
    memoryId: archive.memoryId,
    characterConsistencyScore: quality.characterConsistencyScore,
    styleConsistencyScore: quality.styleConsistencyScore,
    emotionalContinuityScore: quality.emotionalContinuityScore,
    driftRisk: quality.driftRisk,
    cumulativeCharacterScore: quality.cumulativeCharacterScore,
    cumulativeStyleScore: quality.cumulativeStyleScore,
    cumulativeEmotionScore: quality.cumulativeEmotionScore,
    promptDriftRisk: memory.promptDriftRisk,
    overCorrectionRisk: memory.overCorrectionRisk,
    appliedFeedbackCount: feedback.appliedFeedbackCount,
  });
}

export function buildSessionReplayPlan(input: SessionReplayComposerInput): SessionReplayPlan {
  const { sessionExport } = input;
  const replayIndex = resolveReplayIndex(sessionExport, input.replayIndex);
  const replayId = buildReplayId(replayIndex);

  return Object.freeze({
    version: SESSION_REPLAY_PLAN_VERSION,
    replayId,
    sessionId: sessionExport.sessionId,
    sourceRequestId: sessionExport.sourceRequestId,
    nextRequestId: sessionExport.nextRequestId,
    replaySteps: buildReplaySteps(sessionExport),
    replayIntegrity: buildReplayIntegrity(sessionExport),
    expectedOutputs: buildExpectedOutputs(sessionExport),
  });
}

export function serializeSessionReplayPlan(plan: SessionReplayPlan): string {
  return JSON.stringify({
    version: plan.version,
    replayId: plan.replayId,
    sessionId: plan.sessionId,
    sourceRequestId: plan.sourceRequestId,
    nextRequestId: plan.nextRequestId,
    replaySteps: plan.replaySteps,
    replayIntegrity: plan.replayIntegrity,
    expectedOutputs: plan.expectedOutputs,
  });
}

export function computeSessionReplayPlanFingerprint(plan: SessionReplayPlan): string {
  return crypto.createHash("sha256").update(serializeSessionReplayPlan(plan)).digest("hex");
}

export function assertSessionReplayPlanDeterministic(plan: SessionReplayPlan): boolean {
  const stepOrderValid = plan.replaySteps.every(
    (step, index) => step.stepOrder === index + 1 && step.stepId === buildStepId(index + 1)
  );

  const stepKindsOrdered = plan.replaySteps.map((step) => step.stepKind).join("|") === REPLAY_STEP_SEQUENCE.join("|");

  return (
    stepOrderValid &&
    stepKindsOrdered &&
    plan.replayIntegrity.idsPreserved &&
    plan.replayIntegrity.bundleAligned &&
    plan.replayId.length > 0 &&
    plan.sessionId === plan.replayIntegrity.sessionId &&
    plan.sourceRequestId === plan.expectedOutputs.sourceRequestId &&
    plan.nextRequestId === plan.expectedOutputs.nextRequestId
  );
}

export function assertSessionReplayPlanIdsPreserved(plan: SessionReplayPlan): boolean {
  return (
    plan.sourceRequestId === plan.expectedOutputs.sourceRequestId &&
    plan.nextRequestId === plan.expectedOutputs.nextRequestId &&
    plan.replayIntegrity.sourceRequestId === plan.sourceRequestId &&
    plan.replayIntegrity.nextRequestId === plan.nextRequestId &&
    plan.replayIntegrity.evaluationId === plan.expectedOutputs.evaluationId &&
    plan.replayIntegrity.feedbackId === plan.expectedOutputs.feedbackId &&
    plan.replayIntegrity.memoryId === plan.expectedOutputs.memoryId
  );
}
