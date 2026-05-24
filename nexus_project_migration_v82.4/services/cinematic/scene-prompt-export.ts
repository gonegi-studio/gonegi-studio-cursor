import crypto from "crypto";
import type { MusicDramaCue, MusicDramaTimeline } from "./music-drama-timeline.ts";
import type { MusicEnergy } from "./sequence-composer.ts";

export type ScenePromptExportItem = {
  sceneId: string;
  cueId: string;
  prompt: string;
  durationSec: number;
  musicEnergy: MusicEnergy;
};

export type ScenePromptExport = {
  version: "v1";
  scenes: readonly ScenePromptExportItem[];
};

export const SCENE_PROMPT_EXPORT_VERSION = "v1" as const;

function buildSceneId(index: number): string {
  return `scene-${String(index + 1).padStart(3, "0")}`;
}

function buildSceneExportItem(cue: MusicDramaCue, index: number): ScenePromptExportItem {
  return Object.freeze({
    sceneId: buildSceneId(index),
    cueId: cue.cueId,
    prompt: cue.prompt,
    durationSec: cue.durationSec,
    musicEnergy: cue.musicEnergy,
  });
}

export function buildScenePromptExport(timeline: MusicDramaTimeline): ScenePromptExport {
  const orderedCues = [...timeline.cues].sort((a, b) => a.cueId.localeCompare(b.cueId));
  const scenes = Object.freeze(orderedCues.map((cue, index) => buildSceneExportItem(cue, index)));

  return Object.freeze({
    version: SCENE_PROMPT_EXPORT_VERSION,
    scenes,
  });
}

export const SCENE_PROMPT_EXPORT_ITEM_KEY_ORDER = Object.freeze([
  "sceneId",
  "cueId",
  "prompt",
  "durationSec",
  "musicEnergy",
] as const);

export function serializeScenePromptExport(exportPack: ScenePromptExport): string {
  const orderedScenes = [...exportPack.scenes]
    .sort((a, b) => a.sceneId.localeCompare(b.sceneId))
    .map((scene) => {
      const ordered: Record<string, unknown> = {};
      for (const key of SCENE_PROMPT_EXPORT_ITEM_KEY_ORDER) {
        ordered[key] = scene[key as keyof ScenePromptExportItem];
      }
      return ordered;
    });

  return JSON.stringify({
    version: exportPack.version,
    scenes: orderedScenes,
  });
}

export function computeScenePromptExportFingerprint(exportPack: ScenePromptExport): string {
  return crypto.createHash("sha256").update(serializeScenePromptExport(exportPack)).digest("hex");
}
