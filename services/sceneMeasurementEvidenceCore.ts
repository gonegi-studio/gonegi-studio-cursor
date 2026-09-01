/**
 * [Scene Measurement Evidence Core]
 *
 * Foundation for real, frame-grounded scene measurement -- as opposed to
 * the procedurally-synthesized placeholder data found in
 * titanicSceneGeometryDensification.ts / titanicSceneReconstructionDensification.ts /
 * titanicMovieReconstructionDataset.ts (confirmed by direct code read: those
 * generate camera_position/pose/depth as pure functions of a loop index,
 * e.g. `0.5 - (i % 6) * 0.05`, with zero frame-level grounding despite
 * looking numeric).
 *
 * Reuses testKikiFrameExtraction.ts's proven pattern verbatim in spirit --
 * same spawnSync safety shape (shell:false, explicit timeout, windowsHide),
 * same SHA-256 content-fingerprint discipline for both source video and
 * extracted frame (see testKikiVideoIntake.ts) -- but generalized: any
 * source video path, any list of timestamps, not hardcoded to one 25s
 * test clip.
 *
 * Scope of this file, deliberately minimal: the input boundary (video ->
 * selected frames, fingerprinted) and the provenance contract
 * (MEASURED/INFERRED/AUTHORED, all three requiring source_frame +
 * extraction_method + confidence), plus exactly two measurements that are
 * directly computable from real pixel bytes with zero ML model needed:
 * frame dimensions and basic grayscale byte statistics (mean/min/max).
 * This exists to validate the lineage mechanism end-to-end against a real
 * frame, not to build a real measurement engine -- pose/depth/gaze/bbox
 * detection (needing actual CV/ML models) are explicitly NOT added here.
 *
 * Fail-closed by construction, not by convention: buildMeasuredValue()
 * below is the ONLY way to produce a MeasuredValue, and it re-hashes the
 * claimed frame file on disk, right now, before accepting anything --
 * there is no code path anywhere in this module that could accept a
 * hand-typed fingerprint, a value copied from datasets/movie_reconstruction/
 * titanic*, or any other data this module did not itself just extract and
 * hash in this same process.
 */

import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const FFMPEG_TIMEOUT_MS = 5000;
const FFPROBE_TIMEOUT_MS = 5000;

// ============================================================
// Provenance contract
// ============================================================

export type ProvenanceTag = 'measured' | 'inferred' | 'authored';

interface ProvenanceLineageBase {
  /** Content-hash (sha256 hex) of the exact frame this value was derived
   *  from -- never a path, since paths rot/rename and hashes don't. null
   *  only for a value not grounded in any single frame (e.g. a whole-clip
   *  aggregate spanning many frames) -- no such value exists in this
   *  minimal core yet. */
  source_frame: string | null;
  /** Name of the specific algorithm/model/human process that produced
   *  this value. Never a generic placeholder like "computed" or
   *  "unknown" -- e.g. 'ffprobe-stream-dimensions', not 'measured'. */
  extraction_method: string;
  /** Required, not optional: every value must explicitly state whether a
   *  confidence exists rather than silently omitting it. 1.0 for
   *  deterministic pixel arithmetic (no uncertainty to report); null when
   *  extraction_method genuinely has no confidence signal (typical for
   *  AUTHORED values -- a human rarely self-reports a numeric
   *  certainty). */
  confidence: number | null;
}

export interface MeasuredValue<T> extends ProvenanceLineageBase {
  provenance: 'measured';
  value: T;
}

export interface InferredValue<T> extends ProvenanceLineageBase {
  provenance: 'inferred';
  value: T;
}

export interface AuthoredValue<T> extends ProvenanceLineageBase {
  provenance: 'authored';
  value: T;
}

export type ProvenanceValue<T> = MeasuredValue<T> | InferredValue<T> | AuthoredValue<T>;

// ============================================================
// Frame evidence (the only acceptable source_frame anchor)
// ============================================================

/**
 * A frame this module itself extracted and fingerprinted in this same
 * process. The only shape buildMeasuredValue() below will accept as
 * evidence for a MEASURED value -- never hand-constructed, never copied
 * from an existing registry.
 */
export interface ExtractedFrameEvidence {
  frame_path: string;
  frame_fingerprint: string;
  timestamp_seconds: string;
  /** Relative path to the source video this frame was claimed to be
   *  extracted from -- required so the frame/source-video/timestamp
   *  binding can actually be re-verified later (see
   *  verifyFrameSourceBinding() below), not just asserted by three
   *  mutually-trusting fields. */
  source_video_path: string;
  source_video_fingerprint: string;
}

export class SceneMeasurementBinaryUnavailableError extends Error {
  constructor(binary: string, cause: unknown) {
    super(
      `${binary} is not available on PATH -- cannot perform real frame extraction/measurement. Underlying error: ${String(cause)}`
    );
    this.name = 'SceneMeasurementBinaryUnavailableError';
  }
}

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash('sha256').update(buffer ?? Buffer.alloc(0)).digest('hex');
}

// ============================================================
// Input boundary: source video -> selected, fingerprinted frames
// ============================================================

export function fingerprintSourceVideo(projectRoot: string, sourceVideoRelativePath: string): string {
  const absolutePath = path.resolve(projectRoot, sourceVideoRelativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`fingerprintSourceVideo: source video missing at ${sourceVideoRelativePath}`);
  }
  return digestBuffer(fs.readFileSync(absolutePath));
}

export interface FrameExtractionTarget {
  timestampSeconds: string;
  outputRelativePath: string;
}

export type FrameExtractionStatus = 'extraction-success' | 'extraction-failed' | 'binary-unavailable';

export interface FrameExtractionResult {
  status: FrameExtractionStatus;
  frames: readonly ExtractedFrameEvidence[];
  error?: string;
}

/**
 * General-purpose video -> selected-frames extraction. Generalizes
 * testKikiFrameExtraction.ts's spawnSync shape (same shell:false,
 * explicit timeout, windowsHide) to an arbitrary source video and
 * arbitrary timestamp list, rather than the fixed TEST_KIKI constants
 * that file hardcodes. Synthetic/placeholder data (e.g. Titanic's
 * generators) has no path into this function at all -- it only ever
 * calls the real ffmpeg binary against a real file on disk.
 */
export function extractSelectedFrames(
  projectRoot: string,
  sourceVideoRelativePath: string,
  targets: readonly FrameExtractionTarget[]
): FrameExtractionResult {
  const sourceAbsolutePath = path.resolve(projectRoot, sourceVideoRelativePath);
  if (!fs.existsSync(sourceAbsolutePath)) {
    return {
      status: 'extraction-failed',
      frames: Object.freeze([]),
      error: `source video missing at ${sourceVideoRelativePath}`,
    };
  }

  let sourceVideoFingerprint: string;
  try {
    sourceVideoFingerprint = fingerprintSourceVideo(projectRoot, sourceVideoRelativePath);
  } catch (err) {
    return { status: 'extraction-failed', frames: Object.freeze([]), error: String(err) };
  }

  const frames: ExtractedFrameEvidence[] = [];

  for (const target of targets) {
    const outputAbsolutePath = path.resolve(projectRoot, target.outputRelativePath);
    fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });

    const spawnResult = spawnSync(
      'ffmpeg',
      ['-y', '-ss', target.timestampSeconds, '-i', sourceAbsolutePath, '-frames:v', '1', outputAbsolutePath],
      {
        cwd: projectRoot,
        shell: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: FFMPEG_TIMEOUT_MS,
        windowsHide: true,
      }
    );

    if (spawnResult.error !== undefined) {
      return {
        status: 'binary-unavailable',
        frames: Object.freeze(frames),
        error: String(spawnResult.error),
      };
    }

    const outputExists = fs.existsSync(outputAbsolutePath) && fs.statSync(outputAbsolutePath).size > 0;
    if (spawnResult.status !== 0 || spawnResult.signal !== null || !outputExists) {
      return {
        status: 'extraction-failed',
        frames: Object.freeze(frames),
        error: `ffmpeg failed for timestamp ${target.timestampSeconds} (status=${spawnResult.status}, signal=${spawnResult.signal}). stderr: ${spawnResult.stderr?.toString().slice(0, 500) ?? ''}`,
      };
    }

    frames.push(
      Object.freeze({
        frame_path: target.outputRelativePath,
        frame_fingerprint: digestBuffer(fs.readFileSync(outputAbsolutePath)),
        timestamp_seconds: target.timestampSeconds,
        source_video_path: sourceVideoRelativePath,
        source_video_fingerprint: sourceVideoFingerprint,
      })
    );
  }

  return { status: 'extraction-success', frames: Object.freeze(frames) };
}

// ============================================================
// Fail-closed MeasuredValue construction
// ============================================================

/**
 * Shared fail-closed check behind both buildMeasuredValue() and
 * buildInferredValue() below: re-verifies, on disk, right now, that the
 * frame file at evidence.frame_path still hashes to
 * evidence.frame_fingerprint. Throws rather than silently accepting a
 * value when the frame is missing or has been modified since extraction.
 * This concern -- "does this evidence actually correspond to a real
 * frame this process extracted?" -- is identical regardless of whether
 * the resulting value ends up tagged measured or inferred, so it is
 * checked once here, not duplicated in each builder.
 */
function assertFrameEvidenceIsReal(projectRoot: string, evidence: ExtractedFrameEvidence, callerName: string): void {
  const absolutePath = path.resolve(projectRoot, evidence.frame_path);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `${callerName}: fail-closed -- frame file missing at ${evidence.frame_path}. Refusing to fabricate a value with no real frame behind it.`
    );
  }
  const actualFingerprint = digestBuffer(fs.readFileSync(absolutePath));
  if (actualFingerprint !== evidence.frame_fingerprint) {
    throw new Error(
      `${callerName}: fail-closed -- frame_fingerprint mismatch for ${evidence.frame_path} ` +
        `(claimed ${evidence.frame_fingerprint}, actual ${actualFingerprint}). Refusing to attach a provenance tag to unverified evidence.`
    );
  }
}

// ============================================================
// Frame <-> source video <-> timestamp binding verification
// ============================================================

export interface FrameSourceBindingVerification {
  valid: boolean;
  reason?: string;
}

/**
 * Genuinely re-verifies that a claimed frame really came from its claimed
 * source video at its claimed timestamp -- not just that the frame file's
 * own bytes match frame_fingerprint (assertFrameEvidenceIsReal already
 * covers that), but that source_video_fingerprint and timestamp_seconds
 * actually PRODUCE that same frame_fingerprint when re-derived from
 * scratch. Without this, a caller could construct an ExtractedFrameEvidence
 * with a real, on-disk frame_path/frame_fingerprint (passing every
 * per-value fail-closed check) paired with a fabricated or mismatched
 * source_video_fingerprint/timestamp_seconds, and nothing would catch it --
 * the three fields would simply be trusted to agree with each other.
 *
 * Two checks, both against real bytes on disk right now:
 *  1. The source video at source_video_path still exists and still hashes
 *     to source_video_fingerprint (catches a swapped/tampered/fabricated
 *     source video reference).
 *  2. Re-running the exact same extraction (same source video, same
 *     timestamp) into a throwaway scratch file reproduces the exact same
 *     frame_fingerprint (catches a timestamp that does not actually
 *     correspond to this frame, or a frame that did not really come from
 *     this source video at all).
 *
 * Deliberately NOT called from buildMeasuredValue()/buildInferredValue():
 * those run many times per frame (once per measured/inferred value), and
 * re-running ffmpeg extraction on every single call would reintroduce
 * exactly the kind of redundant, wasteful recomputation this repair
 * phase's shared-measurement fix (see sceneMeasurementSceneTruthIntegrator.ts)
 * exists to eliminate. Instead, a caller assembling a full Scene Truth
 * calls this once per frame, before any measurement runs, and fails
 * closed immediately if the binding does not hold.
 */
export function verifyFrameSourceBinding(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): FrameSourceBindingVerification {
  const sourceAbsolutePath = path.resolve(projectRoot, evidence.source_video_path);
  if (!fs.existsSync(sourceAbsolutePath)) {
    return { valid: false, reason: `source video missing at ${evidence.source_video_path}` };
  }
  const actualSourceFingerprint = digestBuffer(fs.readFileSync(sourceAbsolutePath));
  if (actualSourceFingerprint !== evidence.source_video_fingerprint) {
    return {
      valid: false,
      reason:
        `source_video_fingerprint mismatch for ${evidence.source_video_path} ` +
        `(claimed ${evidence.source_video_fingerprint}, actual ${actualSourceFingerprint})`,
    };
  }

  // Canonical Frame Identity V1 fix: the scratch re-extraction's file
  // extension must match evidence.frame_path's own extension, not a
  // hardcoded '.jpg'. extractSelectedFrames() -> ffmpeg's image2 muxer picks
  // its output codec purely from the output filename's extension, so a
  // '.png'-extracted frame re-verified through a hardcoded '.jpg' scratch
  // path was silently compared as a lossy JPEG re-encode against the
  // original lossless PNG bytes -- guaranteed to mismatch regardless of
  // whether the underlying frame content was reproduced correctly.
  // Confirmed directly: re-running ffmpeg at an identical timestamp with a
  // '.jpg' output reproduced the exact bytes this bug was comparing against,
  // while the matching '.png' extraction reproduced the real frame_fingerprint.
  // Existing '.jpg'-based callers (every current one) are unaffected --
  // their derived scratch extension is still '.jpg'.
  const scratchExtension = path.extname(evidence.frame_path) || '.jpg';
  const scratchRelativePath = path.join(
    'storage',
    'scene-measurement-source-binding-verification',
    `scratch-${crypto.randomUUID()}${scratchExtension}`
  );
  const scratchAbsolutePath = path.resolve(projectRoot, scratchRelativePath);
  try {
    const reExtraction = extractSelectedFrames(projectRoot, evidence.source_video_path, [
      { timestampSeconds: evidence.timestamp_seconds, outputRelativePath: scratchRelativePath },
    ]);
    if (reExtraction.status !== 'extraction-success' || reExtraction.frames.length !== 1) {
      return {
        valid: false,
        reason:
          `re-extraction at claimed timestamp ${evidence.timestamp_seconds} failed ` +
          `(status=${reExtraction.status}): ${reExtraction.error ?? 'no frame produced'}`,
      };
    }
    const reExtractedFingerprint = reExtraction.frames[0].frame_fingerprint;
    if (reExtractedFingerprint !== evidence.frame_fingerprint) {
      return {
        valid: false,
        reason:
          `re-extracting source_video_path at timestamp_seconds does not reproduce frame_fingerprint ` +
          `(claimed ${evidence.frame_fingerprint}, re-extracted ${reExtractedFingerprint}) -- ` +
          `frame/source-video/timestamp binding is not genuine`,
      };
    }
    return { valid: true };
  } finally {
    if (fs.existsSync(scratchAbsolutePath)) {
      fs.rmSync(scratchAbsolutePath);
    }
  }
}

/**
 * The ONLY sanctioned way to construct a MeasuredValue in this module.
 * See assertFrameEvidenceIsReal() for the fail-closed check this relies
 * on -- there is no way to reach this function with a fingerprint that
 * was never actually verified against real bytes on disk in this
 * process.
 */
export function buildMeasuredValue<T>(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  extractionMethod: string,
  confidence: number | null,
  value: T
): MeasuredValue<T> {
  assertFrameEvidenceIsReal(projectRoot, evidence, 'buildMeasuredValue');
  return Object.freeze({
    provenance: 'measured',
    value,
    source_frame: evidence.frame_fingerprint,
    extraction_method: extractionMethod,
    confidence,
  });
}

/**
 * The ONLY sanctioned way to construct an InferredValue in this module.
 * Same fail-closed frame verification as buildMeasuredValue() -- the
 * distinction between measured and inferred is about how the VALUE was
 * derived (direct pixel measurement vs. a model's estimate one step
 * removed from raw pixels, e.g. monocular depth), never about whether
 * the frame it's grounded in is real; that check is identical either
 * way. Use this whenever the value being recorded is fundamentally an
 * estimate rather than a direct measurement -- see
 * sceneMeasurementDepthEstimator.ts for the first real consumer.
 */
export function buildInferredValue<T>(
  projectRoot: string,
  evidence: ExtractedFrameEvidence,
  extractionMethod: string,
  confidence: number | null,
  value: T
): InferredValue<T> {
  assertFrameEvidenceIsReal(projectRoot, evidence, 'buildInferredValue');
  return Object.freeze({
    provenance: 'inferred',
    value,
    source_frame: evidence.frame_fingerprint,
    extraction_method: extractionMethod,
    confidence,
  });
}

// ============================================================
// Measurement 1: frame dimensions (via ffprobe)
// ============================================================

export interface FrameDimensions {
  width: number;
  height: number;
}

export function measureFrameDimensionsRaw(projectRoot: string, frameRelativePath: string): FrameDimensions {
  const absolutePath = path.resolve(projectRoot, frameRelativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`measureFrameDimensionsRaw: frame file missing at ${frameRelativePath}`);
  }
  const spawnResult = spawnSync(
    'ffprobe',
    ['-v', 'quiet', '-print_format', 'json', '-show_entries', 'stream=width,height', absolutePath],
    { shell: false, stdio: ['pipe', 'pipe', 'pipe'], timeout: FFPROBE_TIMEOUT_MS, windowsHide: true }
  );
  if (spawnResult.error !== undefined) {
    throw new SceneMeasurementBinaryUnavailableError('ffprobe', spawnResult.error);
  }
  if (spawnResult.status !== 0 || spawnResult.signal !== null) {
    throw new Error(
      `measureFrameDimensionsRaw: ffprobe exited abnormally (status=${spawnResult.status}, signal=${spawnResult.signal}). stderr: ${spawnResult.stderr?.toString().slice(0, 500) ?? ''}`
    );
  }
  const parsed = JSON.parse(spawnResult.stdout.toString());
  const stream = parsed?.streams?.[0];
  if (!stream || typeof stream.width !== 'number' || typeof stream.height !== 'number') {
    throw new Error('measureFrameDimensionsRaw: ffprobe output did not contain width/height.');
  }
  return { width: stream.width, height: stream.height };
}

// ============================================================
// Measurement 2: basic grayscale pixel statistics
// ============================================================

export interface GrayscaleByteStatistics {
  mean: number;
  min: number;
  max: number;
  sampleCount: number;
  /** Population standard deviation of the byte values -- the standard,
   *  direct definition of image "contrast" in this contract. Added
   *  alongside mean/min/max (not a separate function) since it's the
   *  same single pass over the same buffer; no existing caller
   *  constructs a GrayscaleByteStatistics object literal of its own (the
   *  only producer is this function), so adding a field here is a safe,
   *  non-breaking extension, confirmed by checking every call site
   *  before making this change. */
  stdDev: number;
}

/**
 * Pure function, no ffmpeg dependency -- computes mean/min/max/stdDev
 * over whatever byte buffer it's given. Kept separate from
 * decodeFrameToGrayscaleBytes() below specifically so this arithmetic is
 * unit-testable against a synthetic buffer without needing a real ffmpeg
 * binary or a real frame on disk.
 */
export function computeGrayscaleByteStatistics(buffer: Buffer): GrayscaleByteStatistics {
  if (buffer.length === 0) {
    throw new Error('computeGrayscaleByteStatistics: empty buffer, cannot compute statistics over zero samples.');
  }
  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < buffer.length; i++) {
    const byteValue = buffer[i];
    sum += byteValue;
    if (byteValue < min) min = byteValue;
    if (byteValue > max) max = byteValue;
  }
  const mean = sum / buffer.length;
  let squaredDiffSum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const diff = buffer[i] - mean;
    squaredDiffSum += diff * diff;
  }
  const stdDev = Math.sqrt(squaredDiffSum / buffer.length);
  return { mean, min, max, sampleCount: buffer.length, stdDev };
}

/**
 * Decodes a frame to raw 8-bit grayscale bytes via ffmpeg -- no image
 * library dependency added to this repo (none exists here today; this
 * reuses the one real tool already proven working in
 * testKikiFrameExtraction.ts rather than introducing a new one).
 */
export function decodeFrameToGrayscaleBytes(projectRoot: string, frameRelativePath: string): Buffer {
  const absolutePath = path.resolve(projectRoot, frameRelativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`decodeFrameToGrayscaleBytes: frame file missing at ${frameRelativePath}`);
  }
  const spawnResult = spawnSync(
    'ffmpeg',
    ['-y', '-i', absolutePath, '-f', 'rawvideo', '-pix_fmt', 'gray', '-'],
    {
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: FFMPEG_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 64,
    }
  );
  if (spawnResult.error !== undefined) {
    throw new SceneMeasurementBinaryUnavailableError('ffmpeg', spawnResult.error);
  }
  if (spawnResult.status !== 0 || spawnResult.signal !== null) {
    throw new Error(
      `decodeFrameToGrayscaleBytes: ffmpeg exited abnormally (status=${spawnResult.status}, signal=${spawnResult.signal}). stderr: ${spawnResult.stderr?.toString().slice(0, 500) ?? ''}`
    );
  }
  if (!spawnResult.stdout || spawnResult.stdout.length === 0) {
    throw new Error('decodeFrameToGrayscaleBytes: ffmpeg produced no output bytes.');
  }
  return spawnResult.stdout;
}

export function measureFrameLuminanceStats(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): MeasuredValue<GrayscaleByteStatistics> {
  const bytes = decodeFrameToGrayscaleBytes(projectRoot, evidence.frame_path);
  const stats = computeGrayscaleByteStatistics(bytes);
  return buildMeasuredValue(projectRoot, evidence, 'ffmpeg-rawvideo-grayscale-mean-min-max', 1.0, stats);
}

export function measureFrameDimensions(
  projectRoot: string,
  evidence: ExtractedFrameEvidence
): MeasuredValue<FrameDimensions> {
  const dimensions = measureFrameDimensionsRaw(projectRoot, evidence.frame_path);
  return buildMeasuredValue(projectRoot, evidence, 'ffprobe-stream-dimensions', 1.0, dimensions);
}
