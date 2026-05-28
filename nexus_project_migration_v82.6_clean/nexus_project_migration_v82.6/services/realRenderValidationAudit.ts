import crypto from 'crypto';
import {
  REAL_RENDER_VALIDATION_AUDIT_VERSION,
  RealRenderReadinessVerdict,
  RealRenderValidationAuditResult,
  RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
} from '../types';
import {
  assertCharacterImageAnchorsPresent,
  assertCharacterImageAnchorsSlotMapped,
} from './aiStudioReferencePayloadBuilder';
import {
  CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID,
  CANONICAL_SEQUENCE_SCENE_PACK_ID,
  CANONICAL_SEQUENCE_SHOT_ID,
  CANONICAL_SEQUENCE_TRANSITION_ID,
} from './cinematic/cinematicSequence.fixtures';
import {
  buildCanonicalMinimalRenderUploadPayload,
  buildCanonicalRuntimePromptCompileInput,
  CANONICAL_HARBOR_WALK_SCENE_ID,
} from './cinematic/minimalRenderCommandExport';
import { findForbiddenTermHits } from './promptConflictCleaner';
import { assertSceneIsolationClean } from './sceneIsolationGuard';

export const REAL_RENDER_VALIDATION_AUDIT_EPOCH = '2026-05-28T09:00:00.000Z';

const MAX_RENDER_READY_PROMPT_LENGTH = 14_000;
const RENDER_COUNT = 1 as const;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function isCanonicalHarborSequence(input: ReturnType<typeof buildCanonicalRuntimePromptCompileInput>): boolean {
  const sequence = input.cinematic_sequence;
  return (
    input.scene_id === CANONICAL_HARBOR_WALK_SCENE_ID &&
    sequence.scene_pack_id === CANONICAL_SEQUENCE_SCENE_PACK_ID &&
    sequence.transition_id === CANONICAL_SEQUENCE_TRANSITION_ID &&
    sequence.shot_id === CANONICAL_SEQUENCE_SHOT_ID &&
    sequence.emotion_motion_bridge_id === CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID
  );
}

function resolveRenderReadinessVerdict(checks: {
  identity_anchor_present: boolean;
  scene_pack_binding_present: boolean;
  transition_bindings_present: boolean;
  shot_bindings_present: boolean;
  motion_bindings_present: boolean;
  prompt_size_acceptable: boolean;
  forbidden_term_hits: string[];
  canonical_harbor_sequence_only: boolean;
  scene_isolation_clean: boolean;
}): RealRenderReadinessVerdict {
  const critical =
    checks.identity_anchor_present &&
    checks.scene_pack_binding_present &&
    checks.transition_bindings_present &&
    checks.shot_bindings_present &&
    checks.motion_bindings_present &&
    checks.canonical_harbor_sequence_only &&
    checks.scene_isolation_clean &&
    checks.forbidden_term_hits.length === 0;

  if (!critical) return 'NOT_READY';
  if (!checks.prompt_size_acceptable) return 'CONDITIONAL';
  return 'READY';
}

function buildRealRenderValidationAuditBody(): Omit<
  RealRenderValidationAuditResult,
  'audit_checksum' | 'deterministic_audit_stable' | 'generated_at'
> {
  const compileInput = buildCanonicalRuntimePromptCompileInput();
  const payload = buildCanonicalMinimalRenderUploadPayload();

  let identity_slot_mapping_valid = false;
  try {
    assertCharacterImageAnchorsSlotMapped(
      payload.character_image_anchors,
      payload.character_bindings
    );
    identity_slot_mapping_valid = true;
  } catch {
    identity_slot_mapping_valid = false;
  }

  const identity_anchor_present =
    assertCharacterImageAnchorsPresent(payload.character_image_anchors) &&
    identity_slot_mapping_valid;

  const scene_pack_binding_present =
    payload.scene_pack_binding?.scene_pack_id === CANONICAL_SEQUENCE_SCENE_PACK_ID;

  const transition_bindings_present = payload.transition_bindings.length > 0;
  const shot_bindings_present = payload.shot_bindings.length > 0;
  const motion_bindings_present = payload.motion_bindings.length > 0;

  const transition_ids = payload.transition_bindings.map((b) => b.transition_id).sort();
  const shot_ids = payload.shot_bindings.map((b) => b.shot_id).sort();
  const motion_ids = payload.motion_bindings.map((b) => b.bridge_id).sort();

  const compiled_prompt_length = payload.compiled_prompt.length;
  const prompt_size_acceptable = compiled_prompt_length <= MAX_RENDER_READY_PROMPT_LENGTH;
  const forbidden_term_hits = findForbiddenTermHits(payload.compiled_prompt);
  const canonical_harbor_sequence_only =
    isCanonicalHarborSequence(compileInput) &&
    scene_pack_binding_present &&
    transition_ids[0] === CANONICAL_SEQUENCE_TRANSITION_ID &&
    shot_ids[0] === CANONICAL_SEQUENCE_SHOT_ID &&
    motion_ids[0] === CANONICAL_SEQUENCE_EMOTION_BRIDGE_ID;

  const render_readiness_verdict = resolveRenderReadinessVerdict({
    identity_anchor_present,
    scene_pack_binding_present,
    transition_bindings_present,
    shot_bindings_present,
    motion_bindings_present,
    prompt_size_acceptable,
    forbidden_term_hits,
    canonical_harbor_sequence_only,
    scene_isolation_clean: assertSceneIsolationClean(payload.compiled_prompt),
  });

  return {
    schema_version: REAL_RENDER_VALIDATION_AUDIT_VERSION,
    render_mode: 'single_scene_harbor_walk',
    scene_id: CANONICAL_HARBOR_WALK_SCENE_ID,
    render_count: RENDER_COUNT,
    batch_generation: false,
    lora_training: false,
    compiler_version: RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
    scene_pack_id: payload.scene_pack_binding.scene_pack_id,
    transition_ids,
    shot_ids,
    motion_ids,
    identity_anchor_present,
    scene_pack_binding_present,
    transition_bindings_present,
    shot_bindings_present,
    motion_bindings_present,
    prompt_size_acceptable,
    compiled_prompt_length,
    forbidden_term_hits,
    canonical_harbor_sequence_only,
    render_readiness_verdict,
  };
}

export function verifyRealRenderValidationAuditDeterminism(runs = 5): boolean {
  const checksums = Array.from({ length: runs }, () =>
    digest([JSON.stringify(buildRealRenderValidationAuditBody())])
  );
  return checksums.every((checksum) => checksum === checksums[0]);
}

export function buildRealRenderValidationAudit(): RealRenderValidationAuditResult {
  const body = buildRealRenderValidationAuditBody();
  return {
    ...body,
    audit_checksum: digest([JSON.stringify(body)]),
    deterministic_audit_stable: verifyRealRenderValidationAuditDeterminism(5),
    generated_at: REAL_RENDER_VALIDATION_AUDIT_EPOCH,
  };
}

let cachedAudit: RealRenderValidationAuditResult | null = null;

export function buildRealRenderValidationAuditPreview(): RealRenderValidationAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildRealRenderValidationAudit();
  return cachedAudit;
}

export function resetRealRenderValidationAuditCache(): void {
  cachedAudit = null;
}
