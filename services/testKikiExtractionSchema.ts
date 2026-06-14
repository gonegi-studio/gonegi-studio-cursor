export const TEST_KIKI_EXTRACTION_SCHEMA_VERSION = 'TEST-KIKI-EXTRACTION-v1' as const;
export const TEST_KIKI_VIDEO_ID = 'TEST_KIKI_25S' as const;
export const TEST_KIKI_SOURCE_FILENAME = 'TEST_KIKI_25S.mp4' as const;
export const TEST_KIKI_SOURCE_PATH = 'imports/source_videos/TEST_KIKI_25S.mp4' as const;
export const TEST_KIKI_DURATION_SECONDS = 25 as const;
export const TEST_KIKI_FRAME_COUNT = 10 as const;
export const TEST_KIKI_EXTRACTION_JSON_PATH = 'exports/test-kiki-25s-extraction.json' as const;
export const TEST_KIKI_EXTRACTION_REPORT_PATH =
  'exports/test-kiki-25s-extraction-report.json' as const;
export const TEST_KIKI_FRAME_OUTPUT_ROOT = 'storage/test-kiki-extraction/frames/' as const;
export const TEST_KIKI_FFMPEG_TIMEOUT_MS = 5000 as const;

export const TEST_KIKI_FRAME_TIMESTAMPS = Object.freeze([
  '2.000',
  '4.500',
  '7.000',
  '9.500',
  '12.000',
  '14.500',
  '17.000',
  '19.500',
  '22.000',
  '24.000',
] as const);

export type TestKikiCameraGrammar = {
  camera_distance: string;
  camera_height: string;
  camera_angle: string;
  lens_feeling: string;
  framing_type: string;
  subject_position: string;
};

export type TestKikiActingGrammar = {
  gaze_direction: string;
  head_direction: string;
  hand_activity: string;
  posture: string;
  body_weight_distribution: string;
};

export type TestKikiDailyLifeGrammar = {
  activity: string;
  object_interaction: string;
  environmental_touchpoint: string;
};

export type TestKikiLocationGrammar = {
  space_type: string;
  architectural_feature: string;
  depth_cue: string;
  navigation_pattern: string;
};

export type TestKikiEmotionGrammar = {
  emotion_state: string;
};

export type TestKikiStoryGrammar = {
  scene_function: string;
};

export type TestKikiFrameEvidence = {
  frame_path: string;
  frame_fingerprint: string;
};

export type TestKikiExtractedFrame = {
  frame_id: string;
  queue_order: number;
  timestamp_seconds: string;
  evidence: TestKikiFrameEvidence;
  camera: TestKikiCameraGrammar;
  acting: TestKikiActingGrammar;
  daily_life: TestKikiDailyLifeGrammar;
  location: TestKikiLocationGrammar;
  emotion: TestKikiEmotionGrammar;
  story: TestKikiStoryGrammar;
};

export type TestKikiGlobalPatterns = {
  dominant_camera_language: string;
  dominant_acting_language: string;
  dominant_daily_life_language: string;
  dominant_space_language: string;
};

export type TestKikiSourceMetadata = {
  source_filename: typeof TEST_KIKI_SOURCE_FILENAME;
  source_path: typeof TEST_KIKI_SOURCE_PATH;
  duration_seconds: typeof TEST_KIKI_DURATION_SECONDS;
  source_fingerprint: string;
  intake_video_id: string;
};

export type TestKikiExtractionDocument = {
  schema_version: typeof TEST_KIKI_EXTRACTION_SCHEMA_VERSION;
  video_id: typeof TEST_KIKI_VIDEO_ID;
  source: TestKikiSourceMetadata;
  frames: readonly TestKikiExtractedFrame[];
  global_patterns: TestKikiGlobalPatterns;
  audit_result: 'PASS' | 'FAIL';
  audit_codes: readonly string[];
  weight_profile: {
    camera: 0.3;
    acting: 0.25;
    daily_life: 0.2;
    location: 0.15;
    emotion: 0.05;
    story: 0.05;
  };
};

export type TestKikiFrameTargetSpec = {
  queueOrder: number;
  timestampSeconds: (typeof TEST_KIKI_FRAME_TIMESTAMPS)[number];
  frameFilename: string;
};

export const TEST_KIKI_FRAME_TARGET_SPECS: readonly TestKikiFrameTargetSpec[] = Object.freeze(
  TEST_KIKI_FRAME_TIMESTAMPS.map((timestampSeconds, queueOrder) =>
    Object.freeze({
      queueOrder,
      timestampSeconds,
      frameFilename: `test-kiki-keyframe-${String(queueOrder + 1).padStart(3, '0')}-${timestampSeconds}.jpg`,
    })
  )
);

export type TestKikiFrameGrammarProfile = {
  camera: TestKikiCameraGrammar;
  acting: TestKikiActingGrammar;
  daily_life: TestKikiDailyLifeGrammar;
  location: TestKikiLocationGrammar;
  emotion: TestKikiEmotionGrammar;
  story: TestKikiStoryGrammar;
};
