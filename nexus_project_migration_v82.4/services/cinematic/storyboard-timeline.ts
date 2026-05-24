import crypto from "crypto";
import type { DatasetIndex, DatasetRecordRef } from "../dataset/dataset.types.ts";

export type StoryboardShot = {
  shotId: string;
  emotion: string;
  duration: number;
  transition: string;
};

export type StoryboardTimeline = {
  timeline: readonly StoryboardShot[];
};

const SCENE_PATH_SLUG_PATTERN = /\/scenes\/([^/]+)\.dna\.json$/;

const EMOTION_LEXICON: readonly string[] = Object.freeze([
  "contemplative",
  "hopeful",
  "melancholic",
  "nostalgic",
  "serene",
  "tender",
]);

const TRANSITION_LEXICON: readonly string[] = Object.freeze([
  "cross-dissolve",
  "cut",
  "dissolve",
  "match-cut",
  "slow-fade",
]);

const SCENE_PACING_BY_SLUG: Readonly<
  Record<string, Readonly<{ emotion: string; duration: number; transition: string }>>
> = Object.freeze({
  "scene-001": Object.freeze({
    emotion: "nostalgic",
    duration: 4,
    transition: "slow-fade",
  }),
});

function extractSceneSlug(relativePath: string): string | null {
  const match = relativePath.match(SCENE_PATH_SLUG_PATTERN);
  return match ? match[1] : null;
}

function deriveRecordFingerprint(record: DatasetRecordRef): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        partition: record.partition,
        recordId: record.recordId,
        relativePath: record.relativePath,
      })
    )
    .digest("hex");
}

function resolvePacing(record: DatasetRecordRef): {
  emotion: string;
  duration: number;
  transition: string;
} {
  const slug = extractSceneSlug(record.relativePath);
  if (slug && SCENE_PACING_BY_SLUG[slug]) {
    return SCENE_PACING_BY_SLUG[slug];
  }

  const fingerprint = deriveRecordFingerprint(record);
  const emotionIndex = parseInt(fingerprint.slice(0, 2), 16) % EMOTION_LEXICON.length;
  const transitionIndex = parseInt(fingerprint.slice(2, 4), 16) % TRANSITION_LEXICON.length;
  const duration = 2 + (parseInt(fingerprint.slice(4, 6), 16) % 7);

  return {
    emotion: EMOTION_LEXICON[emotionIndex],
    duration,
    transition: TRANSITION_LEXICON[transitionIndex],
  };
}

function buildShotId(index: number): string {
  return `shot-${String(index + 1).padStart(3, "0")}`;
}

function selectTimelineRecords(index: DatasetIndex): DatasetRecordRef[] {
  return [...index.records]
    .filter((record) => record.partition === "scene-corpus")
    .sort((a, b) => {
      const pathCmp = a.relativePath.localeCompare(b.relativePath);
      if (pathCmp !== 0) {
        return pathCmp;
      }
      return a.recordId.localeCompare(b.recordId);
    });
}

export function buildStoryboardTimeline(index: DatasetIndex): StoryboardTimeline {
  const records = selectTimelineRecords(index);
  const timeline = records.map((record, shotIndex) => {
    const pacing = resolvePacing(record);
    return Object.freeze({
      shotId: buildShotId(shotIndex),
      emotion: pacing.emotion,
      duration: pacing.duration,
      transition: pacing.transition,
    });
  });

  return Object.freeze({
    timeline: Object.freeze(timeline),
  });
}

export const STORYBOARD_SHOT_KEY_ORDER = Object.freeze([
  "shotId",
  "emotion",
  "duration",
  "transition",
] as const);

export function serializeStoryboardTimeline(timeline: StoryboardTimeline): string {
  const orderedShots = [...timeline.timeline]
    .sort((a, b) => a.shotId.localeCompare(b.shotId))
    .map((shot) => {
      const ordered: Record<string, unknown> = {};
      for (const key of STORYBOARD_SHOT_KEY_ORDER) {
        ordered[key] = shot[key as keyof StoryboardShot];
      }
      return ordered;
    });

  return JSON.stringify({ timeline: orderedShots });
}
