import type { TestKikiExtractedFrame, TestKikiGlobalPatterns } from './testKikiExtractionSchema.js';

function modeToken(values: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let winner = values[0] ?? 'unknown';
  let winnerCount = -1;
  for (const [token, count] of counts) {
    if (count > winnerCount) {
      winner = token;
      winnerCount = count;
    }
  }
  return winner;
}

function modePair(
  frames: readonly TestKikiExtractedFrame[],
  pickA: (frame: TestKikiExtractedFrame) => string,
  pickB: (frame: TestKikiExtractedFrame) => string
): string {
  const pairs = frames.map((frame) => `${pickA(frame)}-${pickB(frame)}`);
  return modeToken(pairs);
}

export function aggregateTestKikiGlobalPatterns(
  frames: readonly TestKikiExtractedFrame[]
): TestKikiGlobalPatterns {
  return Object.freeze({
    dominant_camera_language: modePair(
      frames,
      (frame) => frame.camera.camera_distance,
      (frame) => frame.camera.framing_type
    ),
    dominant_acting_language: modePair(
      frames,
      (frame) => frame.acting.gaze_direction,
      (frame) => frame.acting.posture
    ),
    dominant_daily_life_language: modePair(
      frames,
      (frame) => frame.daily_life.activity,
      (frame) => frame.daily_life.object_interaction
    ),
    dominant_space_language: modePair(
      frames,
      (frame) => frame.location.space_type,
      (frame) => frame.location.depth_cue
    ),
  });
}
