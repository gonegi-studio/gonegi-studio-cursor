import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  TEST_KIKI_DURATION_SECONDS,
  TEST_KIKI_SOURCE_FILENAME,
  TEST_KIKI_SOURCE_PATH,
  type TestKikiSourceMetadata,
} from './testKikiExtractionSchema.js';

const MANIFEST_KIND_VERSION = 'test-kiki-video-intake-v1' as const;

function digestValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function digestBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function resolveTestKikiSourceAbsolutePath(projectRoot: string): string {
  return path.resolve(projectRoot, TEST_KIKI_SOURCE_PATH);
}

export function resolveTestKikiSourceFileSizeBytes(projectRoot: string): number {
  const absolutePath = resolveTestKikiSourceAbsolutePath(projectRoot);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`TEST_KIKI source video missing at ${TEST_KIKI_SOURCE_PATH}`);
  }
  return fs.statSync(absolutePath).size;
}

export function buildTestKikiSourceMetadata(projectRoot: string): TestKikiSourceMetadata {
  const absolutePath = resolveTestKikiSourceAbsolutePath(projectRoot);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`TEST_KIKI source video missing at ${TEST_KIKI_SOURCE_PATH}`);
  }

  const sourceFileSizeBytes = fs.statSync(absolutePath).size;
  const sourceContentFingerprint = digestBuffer(fs.readFileSync(absolutePath));
  const sourceFingerprint = digestValue(
    [
      MANIFEST_KIND_VERSION,
      'source-fingerprint',
      TEST_KIKI_SOURCE_PATH,
      TEST_KIKI_SOURCE_FILENAME,
      String(sourceFileSizeBytes),
      sourceContentFingerprint,
    ].join('|')
  );
  const intakeVideoId = digestValue(
    [
      MANIFEST_KIND_VERSION,
      'intake-video',
      TEST_KIKI_SOURCE_FILENAME,
      TEST_KIKI_SOURCE_PATH,
      sourceFingerprint,
    ].join('|')
  );

  return Object.freeze({
    source_filename: TEST_KIKI_SOURCE_FILENAME,
    source_path: TEST_KIKI_SOURCE_PATH,
    duration_seconds: TEST_KIKI_DURATION_SECONDS,
    source_fingerprint: sourceFingerprint,
    intake_video_id: intakeVideoId,
  });
}
