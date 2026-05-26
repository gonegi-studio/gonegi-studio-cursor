import { REAL_VIDEO_FINGERPRINT_VERIFICATION_OUTPUT_EXAMPLE } from "./real-video-fingerprint-verification.fixtures.ts";
import {
  buildRealMp4FrameExtraction,
  computeRealMp4FrameExtractionFingerprint,
} from "./real-mp4-frame-extraction.ts";

export const REAL_MP4_FRAME_EXTRACTION_INPUT_EXAMPLE = Object.freeze({
  realVideoFingerprintVerification: REAL_VIDEO_FINGERPRINT_VERIFICATION_OUTPUT_EXAMPLE,
});

export const REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE = buildRealMp4FrameExtraction(
  REAL_MP4_FRAME_EXTRACTION_INPUT_EXAMPLE.realVideoFingerprintVerification
);

export const REAL_MP4_FRAME_EXTRACTION_FINGERPRINT = computeRealMp4FrameExtractionFingerprint(
  REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE
);

export const REAL_MP4_EXTRACTED_FRAME_OUTPUT_EXAMPLE = Object.freeze({
  framePath:
    "storage/pilot-intake/real-extraction/frames/kiki-real-keyframe-001-4.000.jpg",
  timestampSeconds: "4.000",
  fileSizeBytes: 0,
});

export const REAL_MP4_FRAME_EXTRACTION_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  extractionId: REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE.extractionId,
  extractionVersion: "real-mp4-frame-extraction-v1" as const,
  activeExtractionState: "25s-real-mp4-controlled-frame-extraction-three-jpg-only",
  extractionStatus: REAL_MP4_FRAME_EXTRACTION_OUTPUT_EXAMPLE.extractionStatus,
  maxFrameCount: 3,
});
