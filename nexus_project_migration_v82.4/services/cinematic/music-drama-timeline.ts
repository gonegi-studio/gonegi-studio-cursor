import crypto from "crypto";
import type { CompiledPromptPack, CompiledPromptUnit } from "./prompt-compiler.ts";
import type { MusicEnergy } from "./sequence-composer.ts";

export type MusicDramaCue = {
  cueId: string;
  unitId: string;
  startSec: number;
  durationSec: number;
  musicEnergy: MusicEnergy;
  prompt: string;
};

export type MusicDramaTimeline = {
  version: "v1";
  cues: readonly MusicDramaCue[];
};

export const MUSIC_DRAMA_TIMELINE_VERSION = "v1" as const;

const MUSIC_ENERGY_TOKENS: readonly MusicEnergy[] = Object.freeze(["low", "medium", "high"]);

function buildCueId(index: number): string {
  return `cue-${String(index + 1).padStart(3, "0")}`;
}

function resolveMusicEnergyFromPrompt(prompt: string): MusicEnergy {
  const tokens = prompt.split(";").map((token) => token.trim().toLowerCase());
  for (const energy of [...MUSIC_ENERGY_TOKENS].reverse()) {
    if (tokens.includes(energy)) {
      return energy;
    }
  }

  const fingerprint = crypto.createHash("sha256").update(prompt).digest("hex");
  return MUSIC_ENERGY_TOKENS[parseInt(fingerprint.slice(0, 2), 16) % MUSIC_ENERGY_TOKENS.length];
}

function resolveDurationSec(unit: CompiledPromptUnit): number {
  return Math.max(1, Math.floor(unit.tokenEstimate / 4));
}

function buildCue(unit: CompiledPromptUnit, index: number, startSec: number): MusicDramaCue {
  return Object.freeze({
    cueId: buildCueId(index),
    unitId: unit.unitId,
    startSec,
    durationSec: resolveDurationSec(unit),
    musicEnergy: resolveMusicEnergyFromPrompt(unit.prompt),
    prompt: unit.prompt,
  });
}

export function buildMusicDramaTimeline(pack: CompiledPromptPack): MusicDramaTimeline {
  const orderedUnits = [...pack.units].sort((a, b) => a.unitId.localeCompare(b.unitId));
  let cursorSec = 0;
  const cues = orderedUnits.map((unit, index) => {
    const cue = buildCue(unit, index, cursorSec);
    cursorSec += cue.durationSec;
    return cue;
  });

  return Object.freeze({
    version: MUSIC_DRAMA_TIMELINE_VERSION,
    cues: Object.freeze(cues),
  });
}

export const MUSIC_DRAMA_CUE_KEY_ORDER = Object.freeze([
  "cueId",
  "unitId",
  "startSec",
  "durationSec",
  "musicEnergy",
  "prompt",
] as const);

export function serializeMusicDramaTimeline(timeline: MusicDramaTimeline): string {
  const orderedCues = [...timeline.cues]
    .sort((a, b) => a.cueId.localeCompare(b.cueId))
    .map((cue) => {
      const ordered: Record<string, unknown> = {};
      for (const key of MUSIC_DRAMA_CUE_KEY_ORDER) {
        ordered[key] = cue[key as keyof MusicDramaCue];
      }
      return ordered;
    });

  return JSON.stringify({
    version: timeline.version,
    cues: orderedCues,
  });
}

export function computeMusicDramaTimelineFingerprint(timeline: MusicDramaTimeline): string {
  return crypto.createHash("sha256").update(serializeMusicDramaTimeline(timeline)).digest("hex");
}
