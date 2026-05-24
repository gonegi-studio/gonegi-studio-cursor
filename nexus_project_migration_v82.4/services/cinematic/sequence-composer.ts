import crypto from "crypto";
import type { StoryboardShot, StoryboardTimeline } from "./storyboard-timeline.ts";

export type MusicEnergy = "low" | "medium" | "high";

export type SequenceSegment = {
  segmentId: string;
  shotIds: readonly string[];
  emotionalBeat: string;
  musicEnergy: MusicEnergy;
  transitionProfile: string;
};

export type SequenceComposition = {
  version: "v1";
  segments: readonly SequenceSegment[];
};

export const SEQUENCE_COMPOSITION_VERSION = "v1" as const;

const MUSIC_ENERGY_BY_EMOTION: Readonly<Record<string, MusicEnergy>> = Object.freeze({
  nostalgic: "low",
  calm: "low",
  serene: "low",
  contemplative: "low",
  melancholic: "low",
  tender: "low",
  hopeful: "medium",
  travel: "medium",
  climax: "high",
  emotional: "high",
});

const MUSIC_ENERGY_LEXICON: readonly MusicEnergy[] = Object.freeze(["low", "medium", "high"]);

function deriveFingerprintMusicEnergy(shot: StoryboardShot): MusicEnergy {
  const fingerprint = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        shotId: shot.shotId,
        emotion: shot.emotion,
        transition: shot.transition,
      })
    )
    .digest("hex");
  return MUSIC_ENERGY_LEXICON[parseInt(fingerprint.slice(0, 2), 16) % MUSIC_ENERGY_LEXICON.length];
}

function resolveMusicEnergy(shot: StoryboardShot): MusicEnergy {
  return MUSIC_ENERGY_BY_EMOTION[shot.emotion] ?? deriveFingerprintMusicEnergy(shot);
}

function buildSegmentId(index: number): string {
  return `segment-${String(index + 1).padStart(3, "0")}`;
}

function buildTransitionProfile(shots: readonly StoryboardShot[]): string {
  return [...new Set(shots.map((shot) => shot.transition))]
    .sort((a, b) => a.localeCompare(b))
    .join("|");
}

function selectOrderedShots(timeline: StoryboardTimeline): StoryboardShot[] {
  return [...timeline.timeline].sort((a, b) => a.shotId.localeCompare(b.shotId));
}

function groupShotsIntoSegments(shots: readonly StoryboardShot[]): StoryboardShot[][] {
  if (shots.length === 0) {
    return [];
  }

  const groups: StoryboardShot[][] = [];
  let currentGroup: StoryboardShot[] = [shots[0]];
  let currentEnergy = resolveMusicEnergy(shots[0]);

  for (let index = 1; index < shots.length; index += 1) {
    const shot = shots[index];
    const energy = resolveMusicEnergy(shot);
    if (energy === currentEnergy) {
      currentGroup.push(shot);
    } else {
      groups.push(currentGroup);
      currentGroup = [shot];
      currentEnergy = energy;
    }
  }

  groups.push(currentGroup);
  return groups;
}

function buildSegment(group: readonly StoryboardShot[], index: number): SequenceSegment {
  const orderedShotIds = Object.freeze(
    group.map((shot) => shot.shotId).sort((a, b) => a.localeCompare(b))
  );

  return Object.freeze({
    segmentId: buildSegmentId(index),
    shotIds: orderedShotIds,
    emotionalBeat: group[0].emotion,
    musicEnergy: resolveMusicEnergy(group[0]),
    transitionProfile: buildTransitionProfile(group),
  });
}

export function buildSequenceComposition(timeline: StoryboardTimeline): SequenceComposition {
  const shots = selectOrderedShots(timeline);
  const groups = groupShotsIntoSegments(shots);
  const segments = Object.freeze(groups.map((group, index) => buildSegment(group, index)));

  return Object.freeze({
    version: SEQUENCE_COMPOSITION_VERSION,
    segments,
  });
}

export const SEQUENCE_SEGMENT_KEY_ORDER = Object.freeze([
  "segmentId",
  "shotIds",
  "emotionalBeat",
  "musicEnergy",
  "transitionProfile",
] as const);

export function serializeSequenceComposition(composition: SequenceComposition): string {
  const orderedSegments = [...composition.segments]
    .sort((a, b) => a.segmentId.localeCompare(b.segmentId))
    .map((segment) => {
      const ordered: Record<string, unknown> = {};
      for (const key of SEQUENCE_SEGMENT_KEY_ORDER) {
        if (key === "shotIds") {
          ordered[key] = [...segment.shotIds].sort((a, b) => a.localeCompare(b));
          continue;
        }
        ordered[key] = segment[key as keyof SequenceSegment];
      }
      return ordered;
    });

  return JSON.stringify({
    version: composition.version,
    segments: orderedSegments,
  });
}

export function computeSequenceFingerprint(composition: SequenceComposition): string {
  return crypto.createHash("sha256").update(serializeSequenceComposition(composition)).digest("hex");
}
