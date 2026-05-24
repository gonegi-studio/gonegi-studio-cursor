/** Phase-12C: AI Studio test export — copy-paste friendly format (pure, deterministic) */

import crypto from "crypto";
import type { ImageGenerationRequest } from "./image-generation-request.ts";

export type AiStudioTestExportVersion = "v1";

export type AiStudioTestExport = {
  readonly version: AiStudioTestExportVersion;
  readonly exportId: string;
  readonly copyBlock: string;
  readonly prompt: string;
  readonly negativePrompt: string;
  readonly settingsSummary: string;
  readonly lockSummary: string;
  readonly testChecklist: readonly string[];
};

export type AiStudioTestExportInput = {
  readonly request: ImageGenerationRequest;
  readonly exportIndex?: number;
};

export const AI_STUDIO_TEST_EXPORT_VERSION: AiStudioTestExportVersion = "v1";

const BASE_TEST_CHECKLIST: readonly string[] = Object.freeze([
  "confirm aspect ratio matches settingsSummary",
  "confirm character identity locks are reflected in output",
  "confirm gonegi style palette remains stable",
  "confirm negative prompt suppresses drift blockers",
  "confirm prompt preserves scene continuity intent",
  "confirm seed policy remains locked across retries",
  "confirm style locks prevent watercolor glaze break",
]);

function buildExportId(exportIndex: number): string {
  return `ai-studio-export-${String(exportIndex + 1).padStart(3, "0")}`;
}

function resolveExportIndex(request: ImageGenerationRequest, exportIndex: number | undefined): number {
  if (exportIndex !== undefined) {
    return exportIndex;
  }

  const match = request.requestId.match(/(\d+)$/);
  if (!match) {
    return 0;
  }

  return Number.parseInt(match[1], 10) - 1;
}

function buildSettingsSummary(request: ImageGenerationRequest): string {
  return [
    `aspectRatio:${request.aspectRatio}`,
    `seedPolicy:${request.seedPolicy}`,
    `exportTarget:${request.exportTarget}`,
    `characterId:${request.characterId}`,
    `requestId:${request.requestId}`,
  ].join(" | ");
}

function formatLockLine(
  lockId: string,
  strength: number,
  level?: string,
  priority?: number
): string {
  const levelSegment = level ? ` level:${level}` : "";
  const prioritySegment = priority !== undefined ? ` priority:${priority}` : "";
  return `${lockId}${levelSegment}${prioritySegment} strength:${strength}`;
}

function buildLockSummary(request: ImageGenerationRequest): string {
  const identityLines = request.identityLocks.map((lock) => formatLockLine(lock.lockId, lock.strength));
  const styleLines = request.styleLocks.map((lock) => formatLockLine(lock.lockId, lock.strength));
  const steeringLines = request.steeringLocks.map((lock) =>
    formatLockLine(lock.lockId, lock.strength, lock.level, lock.priority)
  );

  return [
    "identityLocks:",
    ...identityLines.map((line) => `  ${line}`),
    "styleLocks:",
    ...styleLines.map((line) => `  ${line}`),
    "steeringLocks:",
    ...steeringLines.map((line) => `  ${line}`),
  ].join("\n");
}

function buildTestChecklist(request: ImageGenerationRequest): readonly string[] {
  const dynamicItems: string[] = [];

  if (request.identityLocks.length > 0) {
    dynamicItems.push(`verify identity lock count:${request.identityLocks.length}`);
  }
  if (request.styleLocks.length > 0) {
    dynamicItems.push(`verify style lock count:${request.styleLocks.length}`);
  }
  if (request.steeringLocks.length > 0) {
    dynamicItems.push(`verify steering lock count:${request.steeringLocks.length}`);
  }

  return Object.freeze(
    [...BASE_TEST_CHECKLIST, ...dynamicItems].sort((left, right) => left.localeCompare(right))
  );
}

function buildCopyBlock(exportId: string, request: ImageGenerationRequest, sections: {
  settingsSummary: string;
  lockSummary: string;
  testChecklist: readonly string[];
}): string {
  const checklistBlock = sections.testChecklist.map((item) => `- ${item}`).join("\n");

  return [
    "=== AI STUDIO TEST EXPORT ===",
    `exportId: ${exportId}`,
    `characterId: ${request.characterId}`,
    "",
    "[PROMPT]",
    request.prompt,
    "",
    "[NEGATIVE PROMPT]",
    request.negativePrompt,
    "",
    "[SETTINGS]",
    sections.settingsSummary,
    "",
    "[LOCKS]",
    sections.lockSummary,
    "",
    "[CHECKLIST]",
    checklistBlock,
  ].join("\n");
}

export function buildAiStudioTestExport(input: AiStudioTestExportInput): AiStudioTestExport {
  const { request } = input;
  const exportIndex = resolveExportIndex(request, input.exportIndex);
  const exportId = buildExportId(exportIndex);
  const settingsSummary = buildSettingsSummary(request);
  const lockSummary = buildLockSummary(request);
  const testChecklist = buildTestChecklist(request);
  const copyBlock = buildCopyBlock(exportId, request, {
    settingsSummary,
    lockSummary,
    testChecklist,
  });

  return Object.freeze({
    version: AI_STUDIO_TEST_EXPORT_VERSION,
    exportId,
    copyBlock,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    settingsSummary,
    lockSummary,
    testChecklist,
  });
}

export function serializeAiStudioTestExport(exportPack: AiStudioTestExport): string {
  return JSON.stringify({
    version: exportPack.version,
    exportId: exportPack.exportId,
    copyBlock: exportPack.copyBlock,
    prompt: exportPack.prompt,
    negativePrompt: exportPack.negativePrompt,
    settingsSummary: exportPack.settingsSummary,
    lockSummary: exportPack.lockSummary,
    testChecklist: exportPack.testChecklist,
  });
}

export function computeAiStudioTestExportFingerprint(exportPack: AiStudioTestExport): string {
  return crypto.createHash("sha256").update(serializeAiStudioTestExport(exportPack)).digest("hex");
}

export function assertAiStudioTestExportDeterministic(exportPack: AiStudioTestExport): boolean {
  const checklistSorted = [...exportPack.testChecklist]
    .sort((left, right) => left.localeCompare(right))
    .join("|");
  const checklistValid = exportPack.testChecklist.join("|") === checklistSorted;

  return (
    checklistValid &&
    exportPack.prompt.length > 0 &&
    exportPack.negativePrompt.length > 0 &&
    exportPack.copyBlock.includes("[PROMPT]") &&
    exportPack.copyBlock.includes("[NEGATIVE PROMPT]") &&
    exportPack.copyBlock.includes("[SETTINGS]") &&
    exportPack.copyBlock.includes("[LOCKS]") &&
    exportPack.copyBlock.includes("[CHECKLIST]")
  );
}
