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

export const SCENE_DNA_EXAMPLE: Readonly<SceneDnaProfile> = Object.freeze({
  emotion: "nostalgic",
  palette: Object.freeze(["warm-green", "dust-orange"] as const),
  lens: "35mm",
  rhythm: "slow-breathing",
  framing: "foreground-frame",
});
