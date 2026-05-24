import type { SceneDnaInput, SceneDnaProfile } from "./scene-dna.types.ts";

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePalette(hints: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const hint of [...hints].sort((a, b) => a.localeCompare(b))) {
    const token = normalizeToken(hint);
    if (!token || seen.has(token)) {
      continue;
    }
    seen.add(token);
    normalized.push(token);
  }

  return Object.freeze(normalized);
}

export function extractSceneDna(input: SceneDnaInput): SceneDnaProfile {
  return Object.freeze({
    emotion: normalizeToken(input.emotionHint),
    palette: normalizePalette(input.paletteHints),
    lens: normalizeToken(input.lensHint),
    rhythm: normalizeToken(input.rhythmHint),
    framing: normalizeToken(input.framingHint),
  });
}

export function sceneDnaProfileKeyOrder(profile: SceneDnaProfile): readonly string[] {
  return Object.freeze(["emotion", "palette", "lens", "rhythm", "framing"] as const);
}

export function serializeSceneDnaProfile(profile: SceneDnaProfile): string {
  const ordered: Record<string, unknown> = {};
  for (const key of sceneDnaProfileKeyOrder(profile)) {
    ordered[key] = profile[key as keyof SceneDnaProfile];
  }
  return JSON.stringify(ordered);
}
