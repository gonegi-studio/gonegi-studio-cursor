import crypto from 'node:crypto';
import {
  TEST_KIKI_FRAME_TARGET_SPECS,
  type TestKikiExtractedFrame,
  type TestKikiFrameEvidence,
  type TestKikiSourceMetadata,
} from './testKikiExtractionSchema.js';
import { TEST_KIKI_FRAME_GRAMMAR_PROFILES } from './testKikiFrameGrammarProfiles.js';

function digestValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function computeFrameId(
  queueOrder: number,
  frameFingerprint: string,
  intakeVideoId: string
): string {
  return digestValue(
    ['test-kiki-frame-id-v1', String(queueOrder), frameFingerprint, intakeVideoId].join('|')
  );
}

export function assembleTestKikiFrameGrammar(
  source: TestKikiSourceMetadata,
  frameEvidence: readonly TestKikiFrameEvidence[]
): readonly TestKikiExtractedFrame[] {
  if (frameEvidence.length !== TEST_KIKI_FRAME_TARGET_SPECS.length) {
    throw new Error('Frame evidence count must match target spec count');
  }

  return Object.freeze(
    TEST_KIKI_FRAME_TARGET_SPECS.map((target, index) => {
      const evidence = frameEvidence[index];
      const profile = TEST_KIKI_FRAME_GRAMMAR_PROFILES[index];
      if (profile === undefined || evidence === undefined) {
        throw new Error(`Missing grammar profile or evidence for queue ${index}`);
      }

      return Object.freeze({
        frame_id: computeFrameId(target.queueOrder, evidence.frame_fingerprint, source.intake_video_id),
        queue_order: target.queueOrder,
        timestamp_seconds: target.timestampSeconds,
        evidence: Object.freeze({
          frame_path: evidence.frame_path,
          frame_fingerprint: evidence.frame_fingerprint,
        }),
        camera: profile.camera,
        acting: profile.acting,
        daily_life: profile.daily_life,
        location: profile.location,
        emotion: profile.emotion,
        story: profile.story,
      });
    })
  );
}
