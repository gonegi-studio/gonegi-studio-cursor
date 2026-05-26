import { REAL_VIDEO_INTAKE_MANIFEST_OUTPUT_EXAMPLE } from "./real-video-intake-manifest.fixtures.ts";
import {
  buildRealVideoFingerprintVerification,
  computeRealVideoFingerprintVerificationFingerprint,
} from "./real-video-fingerprint-verification.ts";

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_INPUT_EXAMPLE = Object.freeze({
  realVideoIntakeManifest: REAL_VIDEO_INTAKE_MANIFEST_OUTPUT_EXAMPLE,
});

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_OUTPUT_EXAMPLE =
  buildRealVideoFingerprintVerification(
    REAL_VIDEO_FINGERPRINT_VERIFICATION_INPUT_EXAMPLE.realVideoIntakeManifest
  );

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_FINGERPRINT =
  computeRealVideoFingerprintVerificationFingerprint(
    REAL_VIDEO_FINGERPRINT_VERIFICATION_OUTPUT_EXAMPLE
  );

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_CHECK_OUTPUT_EXAMPLE = Object.freeze({
  checkKind: "source-fingerprint" as const,
  passed: true,
});

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_ROOT_OUTPUT_EXAMPLE = Object.freeze({
  version: "v1" as const,
  verificationRootId: "real-video-fingerprint-verification-gonegi-harbor-25s-v1",
  verificationVersion: "real-video-fingerprint-verification-v1" as const,
  activeVerificationState: "25s-real-video-fingerprint-verification-metadata-only",
  verificationStatus: "verified" as const,
  totalCheckCount: 7,
  passedCheckCount: 7,
});
