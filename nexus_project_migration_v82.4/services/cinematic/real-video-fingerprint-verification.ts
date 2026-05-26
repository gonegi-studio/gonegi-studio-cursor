import crypto from "crypto";
import type { RealVideoIntakeManifest } from "./real-video-intake-manifest.ts";
import {
  REAL_VIDEO_INTAKE_DURATION_SECONDS,
  REAL_VIDEO_INTAKE_SOURCE_FILENAME,
  REAL_VIDEO_INTAKE_SOURCE_PATH,
  buildRealVideoIntakeManifest,
  computeRealVideoIntakeManifestFingerprint,
  resetRealVideoIntakeManifestCacheForVerification,
  resolveRealVideoIntakeSourceFileSizeBytes,
} from "./real-video-intake-manifest.ts";

export type RealVideoFingerprintVerificationStatus = "verified" | "fingerprint-mismatch";

export type RealVideoFingerprintVerificationCheckKind =
  | "manifest-fingerprint"
  | "source-fingerprint"
  | "intake-video-id"
  | "source-filename"
  | "source-path"
  | "duration-target"
  | "source-file-size";

export type RealVideoFingerprintVerificationCheck = {
  checkId: string;
  checkKind: RealVideoFingerprintVerificationCheckKind;
  expectedValue: string;
  observedValue: string;
  passed: boolean;
};

export type RealVideoFingerprintVerification = {
  version: "v1";
  verificationRootId: string;
  intakeVideoId: string;
  intakeManifestFingerprint: string;
  sourceFingerprint: string;
  sourceFilename: string;
  sourcePath: string;
  sourceFileSizeBytes: number;
  durationSeconds: number;
  verificationVersion: typeof REAL_VIDEO_FINGERPRINT_VERIFICATION_KIND_VERSION;
  activeVerificationState: string;
  verificationStatus: RealVideoFingerprintVerificationStatus;
  totalCheckCount: number;
  passedCheckCount: number;
  checks: readonly RealVideoFingerprintVerificationCheck[];
};

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_VERSION = "v1" as const;
export const REAL_VIDEO_FINGERPRINT_VERIFICATION_ID =
  "real-video-fingerprint-verification-gonegi-harbor-25s-v1" as const;
export const REAL_VIDEO_FINGERPRINT_VERIFICATION_STATE =
  "25s-real-video-fingerprint-verification-metadata-only" as const;
export const REAL_VIDEO_FINGERPRINT_VERIFICATION_KIND_VERSION =
  "real-video-fingerprint-verification-v1" as const;

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_CHECK_KEY_ORDER = Object.freeze([
  "checkId",
  "checkKind",
  "expectedValue",
  "observedValue",
  "passed",
] as const);

export const REAL_VIDEO_FINGERPRINT_VERIFICATION_KEY_ORDER = Object.freeze([
  "version",
  "verificationRootId",
  "intakeVideoId",
  "intakeManifestFingerprint",
  "sourceFingerprint",
  "sourceFilename",
  "sourcePath",
  "sourceFileSizeBytes",
  "durationSeconds",
  "verificationVersion",
  "activeVerificationState",
  "verificationStatus",
  "totalCheckCount",
  "passedCheckCount",
  "checks",
] as const);

let cachedRealVideoFingerprintVerification: RealVideoFingerprintVerification | null = null;

function digestValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function orderRecord<T extends Record<string, unknown>>(
  item: T,
  keyOrder: readonly string[]
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    ordered[key] = item[key];
  }
  return ordered;
}

function computeVerificationCheckId(checkKind: RealVideoFingerprintVerificationCheckKind): string {
  return digestValue(
    [REAL_VIDEO_FINGERPRINT_VERIFICATION_KIND_VERSION, "verification-check", checkKind].join("|")
  );
}

function buildVerificationCheck(
  checkKind: RealVideoFingerprintVerificationCheckKind,
  expectedValue: string,
  observedValue: string
): RealVideoFingerprintVerificationCheck {
  return Object.freeze({
    checkId: computeVerificationCheckId(checkKind),
    checkKind,
    expectedValue,
    observedValue,
    passed: expectedValue === observedValue,
  });
}

function buildVerificationChecks(
  realVideoIntakeManifest: RealVideoIntakeManifest,
  refreshedManifest: RealVideoIntakeManifest,
  sourceFileSizeBytes: number
): readonly RealVideoFingerprintVerificationCheck[] {
  const manifestFingerprint = computeRealVideoIntakeManifestFingerprint(realVideoIntakeManifest);
  const refreshedManifestFingerprint = computeRealVideoIntakeManifestFingerprint(refreshedManifest);

  return Object.freeze([
    buildVerificationCheck(
      "manifest-fingerprint",
      manifestFingerprint,
      refreshedManifestFingerprint
    ),
    buildVerificationCheck(
      "source-fingerprint",
      realVideoIntakeManifest.sourceFingerprint,
      refreshedManifest.sourceFingerprint
    ),
    buildVerificationCheck(
      "intake-video-id",
      realVideoIntakeManifest.intakeVideoId,
      refreshedManifest.intakeVideoId
    ),
    buildVerificationCheck(
      "source-filename",
      REAL_VIDEO_INTAKE_SOURCE_FILENAME,
      refreshedManifest.sourceFilename
    ),
    buildVerificationCheck(
      "source-path",
      REAL_VIDEO_INTAKE_SOURCE_PATH,
      refreshedManifest.sourcePath
    ),
    buildVerificationCheck(
      "duration-target",
      String(REAL_VIDEO_INTAKE_DURATION_SECONDS),
      String(refreshedManifest.durationSeconds)
    ),
    buildVerificationCheck(
      "source-file-size",
      String(sourceFileSizeBytes),
      String(sourceFileSizeBytes)
    ),
  ]);
}

export function buildRealVideoFingerprintVerification(
  realVideoIntakeManifest: RealVideoIntakeManifest
): RealVideoFingerprintVerification {
  if (cachedRealVideoFingerprintVerification !== null) {
    return cachedRealVideoFingerprintVerification;
  }

  resetRealVideoIntakeManifestCacheForVerification();
  const refreshedManifest = buildRealVideoIntakeManifest();
  const sourceFileSizeBytes = resolveRealVideoIntakeSourceFileSizeBytes();
  const checks = buildVerificationChecks(
    realVideoIntakeManifest,
    refreshedManifest,
    sourceFileSizeBytes
  );
  const passedCheckCount = checks.filter((check) => check.passed).length;
  const verificationStatus: RealVideoFingerprintVerificationStatus =
    passedCheckCount === checks.length ? "verified" : "fingerprint-mismatch";

  const verification = Object.freeze({
    version: REAL_VIDEO_FINGERPRINT_VERIFICATION_VERSION,
    verificationRootId: REAL_VIDEO_FINGERPRINT_VERIFICATION_ID,
    intakeVideoId: realVideoIntakeManifest.intakeVideoId,
    intakeManifestFingerprint: computeRealVideoIntakeManifestFingerprint(realVideoIntakeManifest),
    sourceFingerprint: realVideoIntakeManifest.sourceFingerprint,
    sourceFilename: realVideoIntakeManifest.sourceFilename,
    sourcePath: realVideoIntakeManifest.sourcePath,
    sourceFileSizeBytes,
    durationSeconds: realVideoIntakeManifest.durationSeconds,
    verificationVersion: REAL_VIDEO_FINGERPRINT_VERIFICATION_KIND_VERSION,
    activeVerificationState: REAL_VIDEO_FINGERPRINT_VERIFICATION_STATE,
    verificationStatus,
    totalCheckCount: checks.length,
    passedCheckCount,
    checks,
  });

  cachedRealVideoFingerprintVerification = verification;
  return verification;
}

export function serializeRealVideoFingerprintVerification(
  verification: RealVideoFingerprintVerification
): string {
  const orderedChecks = verification.checks.map((check) =>
    orderRecord(check, REAL_VIDEO_FINGERPRINT_VERIFICATION_CHECK_KEY_ORDER)
  );

  const orderedVerification: Record<string, unknown> = {};
  for (const key of REAL_VIDEO_FINGERPRINT_VERIFICATION_KEY_ORDER) {
    if (key === "checks") {
      orderedVerification.checks = orderedChecks;
    } else {
      orderedVerification[key] = verification[key as keyof RealVideoFingerprintVerification];
    }
  }

  return JSON.stringify(orderedVerification);
}

export function computeRealVideoFingerprintVerificationFingerprint(
  verification: RealVideoFingerprintVerification
): string {
  return digestValue(serializeRealVideoFingerprintVerification(verification));
}

export function resetRealVideoFingerprintVerificationCacheForVerification(): void {
  cachedRealVideoFingerprintVerification = null;
}
