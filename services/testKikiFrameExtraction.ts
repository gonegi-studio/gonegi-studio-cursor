import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  TEST_KIKI_FFMPEG_TIMEOUT_MS,
  TEST_KIKI_FRAME_OUTPUT_ROOT,
  TEST_KIKI_FRAME_TARGET_SPECS,
  TEST_KIKI_SOURCE_PATH,
  type TestKikiFrameEvidence,
} from './testKikiExtractionSchema.js';
import { resolveTestKikiSourceAbsolutePath } from './testKikiVideoIntake.js';

export type TestKikiFrameExtractionStatus = 'extraction-success' | 'extraction-failed';

export type TestKikiFrameExtractionResult = {
  extractionStatus: TestKikiFrameExtractionStatus;
  spawnCount: number;
  frames: readonly TestKikiFrameEvidence[];
};

function digestBuffer(buffer: Buffer | null | undefined): string {
  return crypto.createHash('sha256').update(buffer ?? Buffer.alloc(0)).digest('hex');
}

function resolveAbsolutePath(projectRoot: string, relativePath: string): string {
  return path.resolve(projectRoot, relativePath);
}

function buildFrameRelativePath(frameFilename: string): string {
  return `${TEST_KIKI_FRAME_OUTPUT_ROOT}${frameFilename}`;
}

function resolveOutputFileSizeBytes(projectRoot: string, relativePath: string): number {
  const absolutePath = resolveAbsolutePath(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return 0;
  }
  return fs.statSync(absolutePath).size;
}

function resolveFrameFingerprint(projectRoot: string, relativePath: string): string {
  const absolutePath = resolveAbsolutePath(projectRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return digestBuffer(null);
  }
  return digestBuffer(fs.readFileSync(absolutePath));
}

function buildSpawnArgs(timestampSeconds: string, framePath: string): readonly string[] {
  return Object.freeze([
    '-ss',
    timestampSeconds,
    '-i',
    TEST_KIKI_SOURCE_PATH,
    '-frames:v',
    '1',
    framePath,
  ]);
}

export function extractTestKikiFrames(projectRoot: string): TestKikiFrameExtractionResult {
  if (!fs.existsSync(resolveTestKikiSourceAbsolutePath(projectRoot))) {
    throw new Error(`TEST_KIKI source video missing at ${TEST_KIKI_SOURCE_PATH}`);
  }

  let spawnCount = 0;
  let spawnFailed = false;
  const frames: TestKikiFrameEvidence[] = [];

  for (const target of TEST_KIKI_FRAME_TARGET_SPECS) {
    const framePath = buildFrameRelativePath(target.frameFilename);
    const outputAbsolutePath = resolveAbsolutePath(projectRoot, framePath);
    const existingSize = resolveOutputFileSizeBytes(projectRoot, framePath);

    if (existingSize <= 0) {
      fs.mkdirSync(path.dirname(outputAbsolutePath), { recursive: true });
      spawnCount += 1;
      const spawnResult = spawnSync(
        'ffmpeg',
        [...buildSpawnArgs(target.timestampSeconds, framePath)],
        {
          cwd: projectRoot,
          shell: false,
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: TEST_KIKI_FFMPEG_TIMEOUT_MS,
          windowsHide: true,
        }
      );
      const outputFileSizeBytes = resolveOutputFileSizeBytes(projectRoot, framePath);
      if (
        spawnResult.error !== undefined ||
        spawnResult.status !== 0 ||
        spawnResult.signal !== null ||
        outputFileSizeBytes <= 0
      ) {
        spawnFailed = true;
      }
    }

    frames.push(
      Object.freeze({
        frame_path: framePath,
        frame_fingerprint: resolveFrameFingerprint(projectRoot, framePath),
      })
    );
  }

  const extractionStatus: TestKikiFrameExtractionStatus =
    spawnFailed || frames.some((frame) => frame.frame_fingerprint === digestBuffer(null))
      ? 'extraction-failed'
      : 'extraction-success';

  return Object.freeze({
    extractionStatus,
    spawnCount,
    frames: Object.freeze(frames),
  });
}
