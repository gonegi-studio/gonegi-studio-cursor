/**
 * [Canonical Frame Identity V1]
 *
 * Fixes the real problem Scene Truth Final Integration V2 found and
 * reported honestly: sceneTruth.frame_fingerprint (sha256 of ffmpeg's own
 * PNG output) and the real occlusion evidence's source_sha256 (sha256 of
 * whatever tool originally produced datasets/movie_analysis/
 * numerical_cinematography/anchor_frame_cache/GHIBLI_01_f1280.png) can
 * legitimately disagree for the SAME underlying video frame -- confirmed
 * empirically (see sceneMeasurementSceneTruthV2Integrator.ts's own header):
 * re-extracting GHIBLI_01.mp4's frame 1280 via this repo's ffmpeg pipeline,
 * two different ways, reproduces the exact same bytes as EACH OTHER but a
 * different sha256 than the anchor cache PNG. PNG byte hash is therefore
 * the wrong identity to compare across tools; it only proves "these exact
 * bytes are unmodified," never "these are the same frame."
 *
 * ---------------------------------------------------------------------
 * Canonical identity: which real video, which real frame number -- not bytes
 * ---------------------------------------------------------------------
 * A CanonicalFrameIdentity is (source_video_fingerprint, frame_index, fps,
 * timestamp_seconds derived from frame_index/fps). This is real, computed,
 * verifiable data -- fps comes from ffprobe against the real video file,
 * source_video_fingerprint from re-hashing that same real file -- never an
 * assumed or hand-typed constant. Two extractions sharing a
 * CanonicalFrameIdentity are claimed to be the same frame because they were
 * asked for by the same video + frame number, not because their output
 * bytes happen to match.
 *
 * ---------------------------------------------------------------------
 * No forced/approximate matching -- re-extract through the SAME path instead
 * ---------------------------------------------------------------------
 * This module does not attempt to prove the pre-existing anchor-cache PNG
 * and a fresh ffmpeg extraction are "close enough" (e.g. via perceptual
 * hashing or pixel-difference tolerance) to call them identical -- that
 * would be exactly the forced matching this phase was told to avoid.
 * Instead, reExtractCanonicalFrame() below re-extracts the frame through
 * sceneMeasurementEvidenceCore.ts's own extractSelectedFrames() -- the
 * exact same function buildSceneTruth()'s verifyFrameSourceBinding() already
 * trusts -- producing a frame whose provenance is self-consistent and
 * reproducible by construction, with no comparison against the old anchor
 * PNG required or attempted anywhere in this file.
 *
 * ---------------------------------------------------------------------
 * Existing provenance/hashes are never touched
 * ---------------------------------------------------------------------
 * This module never reads from or writes to anchor_frame_cache/ or the
 * original kiki-real-instance-mask-occlusion-v1.json evidence file. Every
 * output it produces goes to its own canonical_frame_cache/ directory and
 * its own manifest file (see scripts/extract-canonical-kiki-frames-v1.ts),
 * so the original Real Occlusion Integration V1 evidence remains exactly as
 * it was, independently valid on its own terms.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  extractSelectedFrames,
  fingerprintSourceVideo,
  type ExtractedFrameEvidence,
} from './sceneMeasurementEvidenceCore.js';

const FFPROBE_TIMEOUT_MS = 5000;

export interface CanonicalFrameIdentity {
  source_video_path: string;
  source_video_fingerprint: string;
  frame_index: number;
  fps: number;
  timestamp_seconds: string;
}

/**
 * Real fps, read from the real video file via ffprobe -- never assumed.
 * Throws (fail-closed) rather than defaulting to a guessed frame rate when
 * ffprobe cannot report one.
 */
export function measureVideoFps(projectRoot: string, sourceVideoRelativePath: string): number {
  const absolutePath = path.resolve(projectRoot, sourceVideoRelativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`measureVideoFps: source video missing at ${sourceVideoRelativePath}`);
  }
  const spawnResult = spawnSync(
    'ffprobe',
    [
      '-v', 'quiet',
      '-print_format', 'json',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate',
      absolutePath,
    ],
    { shell: false, stdio: ['pipe', 'pipe', 'pipe'], timeout: FFPROBE_TIMEOUT_MS, windowsHide: true }
  );
  if (spawnResult.error !== undefined) {
    throw new Error(`measureVideoFps: ffprobe unavailable -- ${String(spawnResult.error)}`);
  }
  if (spawnResult.status !== 0 || spawnResult.signal !== null) {
    throw new Error(
      `measureVideoFps: ffprobe exited abnormally (status=${spawnResult.status}, signal=${spawnResult.signal})`
    );
  }
  const parsed = JSON.parse(spawnResult.stdout.toString()) as { streams?: Array<{ r_frame_rate?: string }> };
  const rate = parsed.streams?.[0]?.r_frame_rate;
  if (!rate || !/^\d+\/\d+$/.test(rate)) {
    throw new Error(
      `measureVideoFps: ffprobe did not return a parseable r_frame_rate for ${sourceVideoRelativePath} (got ${String(rate)})`
    );
  }
  const [numeratorText, denominatorText] = rate.split('/');
  const numerator = Number(numeratorText);
  const denominator = Number(denominatorText);
  if (denominator === 0) {
    throw new Error(`measureVideoFps: r_frame_rate has zero denominator (${rate})`);
  }
  return numerator / denominator;
}

/**
 * Computes a real, verifiable canonical identity for a given 0-indexed
 * frame number of a real source video. Deliberately does not touch, read,
 * or reference any pre-existing extraction of this frame.
 */
export function computeCanonicalFrameIdentity(
  projectRoot: string,
  sourceVideoRelativePath: string,
  frameIndex: number
): CanonicalFrameIdentity {
  if (!Number.isInteger(frameIndex) || frameIndex < 0) {
    throw new Error(`computeCanonicalFrameIdentity: frameIndex must be a non-negative integer, got ${frameIndex}`);
  }
  const fps = measureVideoFps(projectRoot, sourceVideoRelativePath);
  const sourceVideoFingerprint = fingerprintSourceVideo(projectRoot, sourceVideoRelativePath);
  return {
    source_video_path: sourceVideoRelativePath,
    source_video_fingerprint: sourceVideoFingerprint,
    frame_index: frameIndex,
    fps,
    timestamp_seconds: (frameIndex / fps).toString(),
  };
}

/**
 * Re-extracts a canonical frame identity through the exact same ffmpeg
 * extraction path sceneMeasurementEvidenceCore.ts's extractSelectedFrames()
 * already implements -- never a bespoke ffmpeg invocation of this module's
 * own. Because it is literally the same function verifyFrameSourceBinding()
 * re-runs to check reproducibility, the result is self-consistent by
 * construction: buildSceneTruth() can accept it directly.
 */
export function reExtractCanonicalFrame(
  projectRoot: string,
  identity: CanonicalFrameIdentity,
  outputRelativePath: string
): ExtractedFrameEvidence {
  const result = extractSelectedFrames(projectRoot, identity.source_video_path, [
    { timestampSeconds: identity.timestamp_seconds, outputRelativePath },
  ]);
  if (result.status !== 'extraction-success' || result.frames.length !== 1) {
    throw new Error(
      `reExtractCanonicalFrame: failed to re-extract frame_index=${identity.frame_index} of ${identity.source_video_path} ` +
        `(status=${result.status}): ${result.error ?? 'no frame produced'}`
    );
  }
  return result.frames[0];
}

/**
 * Re-derives the canonical identity a real, already-built ExtractedFrameEvidence
 * corresponds to, from its own timestamp_seconds + the real fps of its own
 * source_video_path -- and re-verifies (fail-closed) that its claimed
 * source_video_fingerprint still matches the real file on disk before
 * trusting it. Used to confirm a canonically re-extracted frame's own
 * identity is self-consistent, independent of reExtractCanonicalFrame()
 * having produced it.
 */
export function deriveCanonicalIdentityFromExtractedFrame(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): CanonicalFrameIdentity {
  const actualFingerprint = fingerprintSourceVideo(projectRoot, evidence.source_video_path);
  if (actualFingerprint !== evidence.source_video_fingerprint) {
    throw new Error(
      `deriveCanonicalIdentityFromExtractedFrame: source_video_fingerprint mismatch for ${evidence.source_video_path} ` +
        `(claimed ${evidence.source_video_fingerprint}, actual ${actualFingerprint})`
    );
  }
  const timestamp = Number(evidence.timestamp_seconds);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`deriveCanonicalIdentityFromExtractedFrame: timestamp_seconds is not a finite number (${evidence.timestamp_seconds})`);
  }
  const fps = measureVideoFps(projectRoot, evidence.source_video_path);
  return {
    source_video_path: evidence.source_video_path,
    source_video_fingerprint: actualFingerprint,
    frame_index: Math.round(timestamp * fps),
    fps,
    timestamp_seconds: evidence.timestamp_seconds,
  };
}

// ============================================================
// Known source-video registry -- explicit, small, fail-closed on the unknown
// ============================================================

/**
 * The real occlusion evidence file only records a source_video_id string
 * ("GHIBLI_01"), not a file path. This is the one place that string is
 * resolved to a real, on-disk video -- deliberately small and explicit; an
 * id not listed here fails closed (throws) rather than being guessed at.
 */
const KNOWN_SOURCE_VIDEO_PATHS: Readonly<Record<string, string>> = Object.freeze({
  GHIBLI_01: 'imports/source_videos/active/ghibli/GHIBLI_01.mp4',
});

export function resolveKnownSourceVideoPath(sourceVideoId: string): string {
  const sourceVideoPath = KNOWN_SOURCE_VIDEO_PATHS[sourceVideoId];
  if (!sourceVideoPath) {
    throw new Error(
      `resolveKnownSourceVideoPath: unknown source_video_id "${sourceVideoId}" -- no real video path registered, refusing to guess one`
    );
  }
  return sourceVideoPath;
}

export function resolveCanonicalIdentityForKnownSourceVideo(
  projectRoot: string,
  sourceVideoId: string,
  frameIndex: number
): CanonicalFrameIdentity {
  return computeCanonicalFrameIdentity(projectRoot, resolveKnownSourceVideoPath(sourceVideoId), frameIndex);
}

/**
 * Given only a fingerprint (as a SceneTruth carries -- see
 * sceneMeasurementSceneTruthIntegrator.ts's SceneTruth.source_video_fingerprint),
 * finds which registered source_video_id (if any) it belongs to, by
 * re-hashing each registered real video file. Returns null -- never a
 * guess -- when the fingerprint matches no registered video (e.g. any
 * TEST_KIKI_25S.mp4-derived Scene Truth, which is not in this registry).
 */
export function findKnownSourceVideoIdByFingerprint(projectRoot: string, sourceVideoFingerprint: string): string | null {
  for (const [sourceVideoId, relativePath] of Object.entries(KNOWN_SOURCE_VIDEO_PATHS)) {
    if (fingerprintSourceVideo(projectRoot, relativePath) === sourceVideoFingerprint) {
      return sourceVideoId;
    }
  }
  return null;
}

/**
 * Exact equality only -- source_video_fingerprint (a full sha256 of the
 * real video file) and frame_index (an exact integer). No tolerance, no
 * distance metric, no "close enough" anywhere in this comparison -- that is
 * the whole point: a canonical match is either exactly the same (video,
 * frame number) or it is not a match.
 */
export function canonicalIdentitiesMatch(a: CanonicalFrameIdentity, b: CanonicalFrameIdentity): boolean {
  return a.source_video_fingerprint === b.source_video_fingerprint && a.frame_index === b.frame_index;
}

// ============================================================
// Verdict: CANONICAL_FRAME_BOUND / REAL_GAP
// ============================================================

export interface CanonicalFrameBindingResult {
  frame_index: number;
  status: 'integrated' | 'no-real-evidence-for-this-frame' | 'evidence-file-unavailable';
  matched_via: 'byte-hash' | 'canonical-identity' | null;
  measured_nonzero_pair_count: number;
}

export interface CanonicalFrameBindingReadiness {
  verdict: 'CANONICAL_FRAME_BOUND' | 'REAL_GAP';
  reason: string;
}

export function assessCanonicalFrameBindingReadiness(
  results: readonly CanonicalFrameBindingResult[]
): CanonicalFrameBindingReadiness {
  if (results.length === 0) {
    return { verdict: 'REAL_GAP', reason: 'no canonical frames were tested' };
  }

  const canonicalIntegration = results.find((r) => r.status === 'integrated' && r.matched_via === 'canonical-identity');
  if (!canonicalIntegration) {
    return {
      verdict: 'REAL_GAP',
      reason: 'no frame achieved real occlusion integration via canonical (source-video-fingerprint + frame-index) identity -- the PNG-byte-hash-vs-video-frame-identity gap remains unresolved for every frame tested',
    };
  }

  if (canonicalIntegration.measured_nonzero_pair_count === 0) {
    return {
      verdict: 'REAL_GAP',
      reason: `canonical identity matched frame_index=${canonicalIntegration.frame_index} but it carried zero nonzero real mask-intersection pairs`,
    };
  }

  return {
    verdict: 'CANONICAL_FRAME_BOUND',
    reason:
      `frame_index=${canonicalIntegration.frame_index} achieved genuine canonical-identity binding to real occlusion evidence ` +
      `(exact source_video_fingerprint + frame_index match, both derived from real ffprobe fps and real video hashing -- ` +
      `no byte-hash requirement, no approximate/perceptual matching anywhere) with ${canonicalIntegration.measured_nonzero_pair_count} real nonzero mask-intersection pair(s)`,
  };
}
