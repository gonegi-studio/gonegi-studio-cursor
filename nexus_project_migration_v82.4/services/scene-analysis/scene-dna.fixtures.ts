import type { SceneDnaInput } from "./scene-dna.types.ts";
import { SCENE_DNA_EXAMPLE } from "./scene-dna.types.ts";

export const SCENE_DNA_INPUT_EXAMPLE: Readonly<SceneDnaInput> = Object.freeze({
  emotionHint: "nostalgic",
  paletteHints: Object.freeze(["warm-green", "dust-orange"] as const),
  lensHint: "35mm",
  rhythmHint: "slow-breathing",
  framingHint: "foreground-frame",
});

export const SCENE_DNA_OUTPUT_EXAMPLE: Readonly<typeof SCENE_DNA_EXAMPLE> = SCENE_DNA_EXAMPLE;

export const SCENE_DNA_PALETTE_ORDER_FIXTURE: Readonly<SceneDnaInput> = Object.freeze({
  emotionHint: " Nostalgic ",
  paletteHints: Object.freeze(["dust-orange", "warm-green", "warm-green"] as const),
  lensHint: "35MM",
  rhythmHint: " Slow-Breathing ",
  framingHint: "Foreground-Frame",
});

export const SCENE_DNA_PALETTE_ORDER_EXPECTED = Object.freeze({
  emotion: "nostalgic",
  palette: Object.freeze(["dust-orange", "warm-green"] as const),
  lens: "35mm",
  rhythm: "slow-breathing",
  framing: "foreground-frame",
});
