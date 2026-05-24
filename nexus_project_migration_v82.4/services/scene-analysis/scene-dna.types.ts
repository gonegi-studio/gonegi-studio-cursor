/** Phase-2A: scene DNA profile — type scaffold only (zero-runtime) */

export type SceneDnaEmotion = string;

export type SceneDnaPaletteToken = string;

export type SceneDnaLens = string;

export type SceneDnaRhythm = string;

export type SceneDnaFraming = string;

export type SceneDnaProfile = {
  emotion: SceneDnaEmotion;
  palette: readonly SceneDnaPaletteToken[];
  lens: SceneDnaLens;
  rhythm: SceneDnaRhythm;
  framing: SceneDnaFraming;
};

export type SceneDnaInput = {
  emotionHint: string;
  paletteHints: readonly string[];
  lensHint: string;
  rhythmHint: string;
  framingHint: string;
};

export const SCENE_DNA_EXAMPLE: Readonly<SceneDnaProfile> = Object.freeze({
  emotion: "nostalgic",
  palette: Object.freeze(["dust-orange", "warm-green"] as const),
  lens: "35mm",
  rhythm: "slow-breathing",
  framing: "foreground-frame",
});
