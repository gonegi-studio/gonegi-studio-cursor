import crypto from "crypto";
import type { PromptGraph, PromptGraphNode } from "./prompt-graph.ts";

export type CompiledPromptUnit = {
  unitId: string;
  nodeId: string;
  prompt: string;
  tokenEstimate: number;
};

export type CompiledPromptPack = {
  version: "v1";
  units: readonly CompiledPromptUnit[];
};

export const COMPILED_PROMPT_PACK_VERSION = "v1" as const;

function buildUnitId(index: number): string {
  return `prompt-${String(index + 1).padStart(3, "0")}`;
}

function dedupeCompactTokens(tokens: readonly string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const token of tokens) {
    const normalized = token.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    deduped.push(normalized);
  }

  return deduped;
}

function buildCompactPrompt(node: PromptGraphNode): string {
  const rawTokens = [...node.promptIntent.split(/[|/-]+/), ...node.shotIds];
  return dedupeCompactTokens(rawTokens).join(";");
}

function estimateTokenCount(prompt: string): number {
  return prompt.split(";").filter(Boolean).length * 4;
}

function buildUnit(node: PromptGraphNode, index: number): CompiledPromptUnit {
  const prompt = buildCompactPrompt(node);
  return Object.freeze({
    unitId: buildUnitId(index),
    nodeId: node.nodeId,
    prompt,
    tokenEstimate: estimateTokenCount(prompt),
  });
}

export function compilePromptPack(graph: PromptGraph): CompiledPromptPack {
  const orderedNodes = [...graph.nodes].sort((a, b) => a.nodeId.localeCompare(b.nodeId));
  const units = Object.freeze(orderedNodes.map((node, index) => buildUnit(node, index)));

  return Object.freeze({
    version: COMPILED_PROMPT_PACK_VERSION,
    units,
  });
}

export const COMPILED_PROMPT_UNIT_KEY_ORDER = Object.freeze([
  "unitId",
  "nodeId",
  "prompt",
  "tokenEstimate",
] as const);

export function serializeCompiledPromptPack(pack: CompiledPromptPack): string {
  const orderedUnits = [...pack.units]
    .sort((a, b) => a.unitId.localeCompare(b.unitId))
    .map((unit) => {
      const ordered: Record<string, unknown> = {};
      for (const key of COMPILED_PROMPT_UNIT_KEY_ORDER) {
        ordered[key] = unit[key as keyof CompiledPromptUnit];
      }
      return ordered;
    });

  return JSON.stringify({
    version: pack.version,
    units: orderedUnits,
  });
}

export function computeCompiledPromptPackFingerprint(pack: CompiledPromptPack): string {
  return crypto.createHash("sha256").update(serializeCompiledPromptPack(pack)).digest("hex");
}
