/** Phase-17A: generation session export — full feedback loop archive/replay bundle (pure, deterministic) */

import crypto from "crypto";
import type { AiStudioTestExport } from "./ai-studio-test-export.ts";
import type { ExportTarget, ImageGenerationRequest } from "./image-generation-request.ts";
import type { ImageResultEvaluation } from "./image-result-evaluation.ts";
import type { MultiIterationFeedbackMemory } from "./multi-iteration-feedback-memory.ts";
import type { NextGenerationRequest } from "./next-generation-request-composer.ts";
import type { PromptPolicyFeedback } from "./prompt-policy-feedback.ts";

export type GenerationSessionExportVersion = "v1";

export type GenerationSessionReplayBundle = {
  readonly request: {
    readonly requestId: string;
    readonly characterId: string;
    readonly prompt: string;
    readonly negativePrompt: string;
    readonly aspectRatio: ImageGenerationRequest["aspectRatio"];
    readonly seedPolicy: ImageGenerationRequest["seedPolicy"];
    readonly exportTarget: ExportTarget;
    readonly identityLockCount: number;
    readonly styleLockCount: number;
    readonly steeringLockCount: number;
  };
  readonly aiStudioExport: {
    readonly exportId: string;
    readonly copyBlock: string;
    readonly prompt: string;
    readonly negativePrompt: string;
    readonly settingsSummary: string;
    readonly lockSummary: string;
    readonly testChecklist: readonly string[];
  };
  readonly evaluation: {
    readonly evaluationId: string;
    readonly characterConsistencyScore: number;
    readonly styleConsistencyScore: number;
    readonly emotionalContinuityScore: number;
    readonly driftRisk: ImageResultEvaluation["driftRisk"];
    readonly continuityBreaks: readonly string[];
    readonly recommendedPromptAdjustments: readonly string[];
    readonly recommendedNegativeAdjustments: readonly string[];
  };
  readonly feedback: {
    readonly feedbackId: string;
    readonly riskLevel: PromptPolicyFeedback["riskLevel"];
    readonly promptAdjustments: readonly string[];
    readonly negativePromptAdjustments: readonly string[];
    readonly lockAdjustments: readonly string[];
    readonly nextRequestHints: PromptPolicyFeedback["nextRequestHints"];
  };
  readonly nextRequest: {
    readonly requestId: string;
    readonly parentRequestId: string;
    readonly prompt: string;
    readonly negativePrompt: string;
    readonly appliedFeedback: readonly string[];
    readonly improvementSummary: NextGenerationRequest["improvementSummary"];
  };
  readonly memory: {
    readonly memoryId: string;
    readonly iterations: MultiIterationFeedbackMemory["iterations"];
    readonly cumulativeCharacterScore: number;
    readonly cumulativeStyleScore: number;
    readonly cumulativeEmotionScore: number;
    readonly promptDriftRisk: MultiIterationFeedbackMemory["promptDriftRisk"];
    readonly overCorrectionRisk: MultiIterationFeedbackMemory["overCorrectionRisk"];
    readonly stablePolicyHints: readonly string[];
  };
};

export type GenerationSessionArchiveSummary = {
  readonly sessionId: string;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly exportId: string;
  readonly evaluationId: string;
  readonly feedbackId: string;
  readonly memoryId: string;
  readonly iterationCount: number;
  readonly exportTarget: ExportTarget;
};

export type GenerationSessionQualitySummary = {
  readonly characterConsistencyScore: number;
  readonly styleConsistencyScore: number;
  readonly emotionalContinuityScore: number;
  readonly driftRisk: ImageResultEvaluation["driftRisk"];
  readonly cumulativeCharacterScore: number;
  readonly cumulativeStyleScore: number;
  readonly cumulativeEmotionScore: number;
};

export type GenerationSessionFeedbackSummary = {
  readonly feedbackId: string;
  readonly riskLevel: PromptPolicyFeedback["riskLevel"];
  readonly promptAdjustmentCount: number;
  readonly negativeAdjustmentCount: number;
  readonly lockAdjustmentCount: number;
  readonly appliedFeedbackCount: number;
};

export type GenerationSessionMemorySummary = {
  readonly memoryId: string;
  readonly iterationCount: number;
  readonly promptDriftRisk: MultiIterationFeedbackMemory["promptDriftRisk"];
  readonly overCorrectionRisk: MultiIterationFeedbackMemory["overCorrectionRisk"];
  readonly stablePolicyHintCount: number;
};

export type GenerationSessionExportInput = {
  readonly request: ImageGenerationRequest;
  readonly aiStudioExport: AiStudioTestExport;
  readonly evaluation: ImageResultEvaluation;
  readonly feedback: PromptPolicyFeedback;
  readonly nextRequest: NextGenerationRequest;
  readonly memory: MultiIterationFeedbackMemory;
  readonly sessionIndex?: number;
};

export type GenerationSessionExport = {
  readonly version: GenerationSessionExportVersion;
  readonly sessionId: string;
  readonly sourceRequestId: string;
  readonly nextRequestId: string;
  readonly exportTarget: ExportTarget;
  readonly replayBundle: GenerationSessionReplayBundle;
  readonly archiveSummary: GenerationSessionArchiveSummary;
  readonly qualitySummary: GenerationSessionQualitySummary;
  readonly feedbackSummary: GenerationSessionFeedbackSummary;
  readonly memorySummary: GenerationSessionMemorySummary;
};

export const GENERATION_SESSION_EXPORT_VERSION: GenerationSessionExportVersion = "v1";

function buildSessionId(sessionIndex: number): string {
  return `generation-session-${String(sessionIndex + 1).padStart(3, "0")}`;
}

function resolveSessionIndex(request: ImageGenerationRequest, sessionIndex: number | undefined): number {
  if (sessionIndex !== undefined) {
    return sessionIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function buildReplayBundle(input: GenerationSessionExportInput): GenerationSessionReplayBundle {
  const { request, aiStudioExport, evaluation, feedback, nextRequest, memory } = input;

  return Object.freeze({
    request: Object.freeze({
      requestId: request.requestId,
      characterId: request.characterId,
      prompt: request.prompt,
      negativePrompt: request.negativePrompt,
      aspectRatio: request.aspectRatio,
      seedPolicy: request.seedPolicy,
      exportTarget: request.exportTarget,
      identityLockCount: request.identityLocks.length,
      styleLockCount: request.styleLocks.length,
      steeringLockCount: request.steeringLocks.length,
    }),
    aiStudioExport: Object.freeze({
      exportId: aiStudioExport.exportId,
      copyBlock: aiStudioExport.copyBlock,
      prompt: aiStudioExport.prompt,
      negativePrompt: aiStudioExport.negativePrompt,
      settingsSummary: aiStudioExport.settingsSummary,
      lockSummary: aiStudioExport.lockSummary,
      testChecklist: aiStudioExport.testChecklist,
    }),
    evaluation: Object.freeze({
      evaluationId: evaluation.evaluationId,
      characterConsistencyScore: evaluation.characterConsistencyScore,
      styleConsistencyScore: evaluation.styleConsistencyScore,
      emotionalContinuityScore: evaluation.emotionalContinuityScore,
      driftRisk: evaluation.driftRisk,
      continuityBreaks: evaluation.continuityBreaks,
      recommendedPromptAdjustments: evaluation.recommendedPromptAdjustments,
      recommendedNegativeAdjustments: evaluation.recommendedNegativeAdjustments,
    }),
    feedback: Object.freeze({
      feedbackId: feedback.feedbackId,
      riskLevel: feedback.riskLevel,
      promptAdjustments: feedback.promptAdjustments,
      negativePromptAdjustments: feedback.negativePromptAdjustments,
      lockAdjustments: feedback.lockAdjustments,
      nextRequestHints: feedback.nextRequestHints,
    }),
    nextRequest: Object.freeze({
      requestId: nextRequest.requestId,
      parentRequestId: nextRequest.parentRequestId,
      prompt: nextRequest.prompt,
      negativePrompt: nextRequest.negativePrompt,
      appliedFeedback: nextRequest.appliedFeedback,
      improvementSummary: nextRequest.improvementSummary,
    }),
    memory: Object.freeze({
      memoryId: memory.memoryId,
      iterations: memory.iterations,
      cumulativeCharacterScore: memory.cumulativeCharacterScore,
      cumulativeStyleScore: memory.cumulativeStyleScore,
      cumulativeEmotionScore: memory.cumulativeEmotionScore,
      promptDriftRisk: memory.promptDriftRisk,
      overCorrectionRisk: memory.overCorrectionRisk,
      stablePolicyHints: memory.stablePolicyHints,
    }),
  });
}

function buildArchiveSummary(
  sessionId: string,
  input: GenerationSessionExportInput
): GenerationSessionArchiveSummary {
  const { request, aiStudioExport, evaluation, feedback, nextRequest, memory } = input;

  return Object.freeze({
    sessionId,
    sourceRequestId: request.requestId,
    nextRequestId: nextRequest.requestId,
    exportId: aiStudioExport.exportId,
    evaluationId: evaluation.evaluationId,
    feedbackId: feedback.feedbackId,
    memoryId: memory.memoryId,
    iterationCount: memory.iterations.length,
    exportTarget: request.exportTarget,
  });
}

function buildQualitySummary(
  evaluation: ImageResultEvaluation,
  memory: MultiIterationFeedbackMemory
): GenerationSessionQualitySummary {
  return Object.freeze({
    characterConsistencyScore: evaluation.characterConsistencyScore,
    styleConsistencyScore: evaluation.styleConsistencyScore,
    emotionalContinuityScore: evaluation.emotionalContinuityScore,
    driftRisk: evaluation.driftRisk,
    cumulativeCharacterScore: memory.cumulativeCharacterScore,
    cumulativeStyleScore: memory.cumulativeStyleScore,
    cumulativeEmotionScore: memory.cumulativeEmotionScore,
  });
}

function buildFeedbackSummary(
  feedback: PromptPolicyFeedback,
  nextRequest: NextGenerationRequest
): GenerationSessionFeedbackSummary {
  return Object.freeze({
    feedbackId: feedback.feedbackId,
    riskLevel: feedback.riskLevel,
    promptAdjustmentCount: feedback.promptAdjustments.length,
    negativeAdjustmentCount: feedback.negativePromptAdjustments.length,
    lockAdjustmentCount: feedback.lockAdjustments.length,
    appliedFeedbackCount: nextRequest.appliedFeedback.length,
  });
}

function buildMemorySummary(memory: MultiIterationFeedbackMemory): GenerationSessionMemorySummary {
  return Object.freeze({
    memoryId: memory.memoryId,
    iterationCount: memory.iterations.length,
    promptDriftRisk: memory.promptDriftRisk,
    overCorrectionRisk: memory.overCorrectionRisk,
    stablePolicyHintCount: memory.stablePolicyHints.length,
  });
}

export function buildGenerationSessionExport(input: GenerationSessionExportInput): GenerationSessionExport {
  const sessionIndex = resolveSessionIndex(input.request, input.sessionIndex);
  const sessionId = buildSessionId(sessionIndex);
  const replayBundle = buildReplayBundle(input);

  return Object.freeze({
    version: GENERATION_SESSION_EXPORT_VERSION,
    sessionId,
    sourceRequestId: input.request.requestId,
    nextRequestId: input.nextRequest.requestId,
    exportTarget: input.request.exportTarget,
    replayBundle,
    archiveSummary: buildArchiveSummary(sessionId, input),
    qualitySummary: buildQualitySummary(input.evaluation, input.memory),
    feedbackSummary: buildFeedbackSummary(input.feedback, input.nextRequest),
    memorySummary: buildMemorySummary(input.memory),
  });
}

export function serializeGenerationSessionExport(sessionExport: GenerationSessionExport): string {
  return JSON.stringify({
    version: sessionExport.version,
    sessionId: sessionExport.sessionId,
    sourceRequestId: sessionExport.sourceRequestId,
    nextRequestId: sessionExport.nextRequestId,
    exportTarget: sessionExport.exportTarget,
    replayBundle: sessionExport.replayBundle,
    archiveSummary: sessionExport.archiveSummary,
    qualitySummary: sessionExport.qualitySummary,
    feedbackSummary: sessionExport.feedbackSummary,
    memorySummary: sessionExport.memorySummary,
  });
}

export function computeGenerationSessionExportFingerprint(sessionExport: GenerationSessionExport): string {
  return crypto.createHash("sha256").update(serializeGenerationSessionExport(sessionExport)).digest("hex");
}

export function assertGenerationSessionExportDeterministic(sessionExport: GenerationSessionExport): boolean {
  const checklistSorted = [...sessionExport.replayBundle.aiStudioExport.testChecklist]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const hintsSorted = [...sessionExport.replayBundle.memory.stablePolicyHints]
    .sort((left, right) => left.localeCompare(right))
    .join("|");

  return (
    sessionExport.sessionId.length > 0 &&
    sessionExport.sourceRequestId === sessionExport.replayBundle.request.requestId &&
    sessionExport.nextRequestId === sessionExport.replayBundle.nextRequest.requestId &&
    sessionExport.archiveSummary.evaluationId === sessionExport.replayBundle.evaluation.evaluationId &&
    sessionExport.archiveSummary.feedbackId === sessionExport.replayBundle.feedback.feedbackId &&
    sessionExport.archiveSummary.memoryId === sessionExport.replayBundle.memory.memoryId &&
    sessionExport.replayBundle.aiStudioExport.testChecklist.join("|") === checklistSorted &&
    sessionExport.replayBundle.memory.stablePolicyHints.join("|") === hintsSorted
  );
}

export function assertGenerationSessionExportIdsPreserved(sessionExport: GenerationSessionExport): boolean {
  const bundle = sessionExport.replayBundle;

  return (
    bundle.request.requestId === sessionExport.sourceRequestId &&
    bundle.nextRequest.requestId === sessionExport.nextRequestId &&
    bundle.evaluation.evaluationId === sessionExport.archiveSummary.evaluationId &&
    bundle.feedback.feedbackId === sessionExport.feedbackSummary.feedbackId &&
    bundle.memory.memoryId === sessionExport.memorySummary.memoryId
  );
}
