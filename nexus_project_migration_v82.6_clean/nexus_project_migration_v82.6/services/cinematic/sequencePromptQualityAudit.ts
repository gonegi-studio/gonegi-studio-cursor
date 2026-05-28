import crypto from 'crypto';
import {
  RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
  SEQUENCE_PROMPT_QUALITY_AUDIT_VERSION,
  SequencePromptQualityAuditResult,
  SequencePromptQualityVerdict,
} from '../../types';
import { findForbiddenTermHits } from '../promptConflictCleaner';
import {
  CANONICAL_RUNTIME_ASSEMBLY_ORDER,
  compileRuntimePrompt,
} from '../runtimePromptCompiler';
import { assertSceneIsolationClean } from '../sceneIsolationGuard';
import { buildCanonicalRuntimePromptCompileInput } from './minimalRenderCommandExport';

export const SEQUENCE_PROMPT_QUALITY_AUDIT_EPOCH = '2026-05-28T08:00:00.000Z';

const MAX_PASS_PROMPT_LENGTH = 14_000;
const MAX_WARN_PROMPT_LENGTH = 18_000;
const MAX_PASS_DUPLICATE_PHRASES = 0;
const MAX_WARN_DUPLICATE_PHRASES = 2;
const MIN_PHRASE_LENGTH_FOR_DUPLICATE = 20;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function splitPromptPhrases(text: string): string[] {
  return text
    .split(/(?<=\.)\s+|,\s+(?=\[|[A-Z])/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length >= MIN_PHRASE_LENGTH_FOR_DUPLICATE);
}

export function countDuplicatePhrases(text: string): number {
  const seen = new Map<string, number>();
  let duplicates = 0;

  for (const phrase of splitPromptPhrases(text)) {
    const count = (seen.get(phrase) ?? 0) + 1;
    seen.set(phrase, count);
    if (count === 2) duplicates += 1;
  }

  return duplicates;
}

export function checkIdentityBeforeAction(compiledPrompt: string): boolean {
  const imageIdx = compiledPrompt.indexOf('[IMAGE_ANCHOR]');
  const characterIdx = compiledPrompt.indexOf('[CHARACTER]');
  const sceneIdx = compiledPrompt.indexOf('[SCENE]');
  const transitionIdx = compiledPrompt.indexOf('[TRANSITION]');
  const shotIdx = compiledPrompt.indexOf('[SHOT]');
  const motionIdx = compiledPrompt.indexOf('[MOTION]');

  if (
    imageIdx < 0 ||
    characterIdx < 0 ||
    sceneIdx < 0 ||
    transitionIdx < 0 ||
    shotIdx < 0 ||
    motionIdx < 0
  ) {
    return false;
  }

  return (
    imageIdx < characterIdx &&
    characterIdx < sceneIdx &&
    characterIdx < transitionIdx &&
    characterIdx < shotIdx &&
    characterIdx < motionIdx
  );
}

export function checkAssemblyOrder(assemblyOrder: string[]): boolean {
  if (assemblyOrder.length !== CANONICAL_RUNTIME_ASSEMBLY_ORDER.length) return false;
  return assemblyOrder.every(
    (step, index) => step === CANONICAL_RUNTIME_ASSEMBLY_ORDER[index]
  );
}

function isPromptLengthAcceptable(length: number): boolean {
  return length <= MAX_PASS_PROMPT_LENGTH;
}

function resolveVerdict(input: {
  forbidden_term_hits: string[];
  identity_before_action: boolean;
  assembly_order_valid: boolean;
  duplicate_phrase_count: number;
  compiled_prompt_length: number;
  scene_isolation_clean: boolean;
}): SequencePromptQualityVerdict {
  if (
    input.forbidden_term_hits.length > 0 ||
    !input.identity_before_action ||
    !input.assembly_order_valid ||
    !input.scene_isolation_clean ||
    input.compiled_prompt_length > MAX_WARN_PROMPT_LENGTH ||
    input.duplicate_phrase_count > MAX_WARN_DUPLICATE_PHRASES
  ) {
    return 'FAIL';
  }

  if (
    input.duplicate_phrase_count > MAX_PASS_DUPLICATE_PHRASES ||
    input.compiled_prompt_length > MAX_PASS_PROMPT_LENGTH
  ) {
    return 'WARN';
  }

  return 'PASS';
}

function buildStableAuditBody(
  audit: Omit<
    SequencePromptQualityAuditResult,
    'audit_checksum' | 'deterministic_audit_stable' | 'generated_at'
  >
): Omit<SequencePromptQualityAuditResult, 'audit_checksum' | 'deterministic_audit_stable' | 'generated_at'> {
  return {
    ...audit,
    transition_ids: [...audit.transition_ids].sort(),
    shot_ids: [...audit.shot_ids].sort(),
    motion_ids: [...audit.motion_ids].sort(),
    forbidden_term_hits: [...audit.forbidden_term_hits].sort(),
    assembly_order: [...audit.assembly_order],
  };
}

function buildSequencePromptQualityAuditBody(): Omit<
  SequencePromptQualityAuditResult,
  'audit_checksum' | 'deterministic_audit_stable' | 'generated_at'
> {
  const compileInput = buildCanonicalRuntimePromptCompileInput();
  const compiled = compileRuntimePrompt(compileInput);
  const compiledPrompt = compiled.compiled_prompt;

  const duplicate_phrase_count = countDuplicatePhrases(compiledPrompt);
  const forbidden_term_hits = findForbiddenTermHits(compiledPrompt);
  const identity_before_action = checkIdentityBeforeAction(compiledPrompt);
  const assembly_order_valid = checkAssemblyOrder(compiled.assembly_order);
  const compiled_prompt_length = compiledPrompt.length;
  const prompt_length_acceptable = isPromptLengthAcceptable(compiled_prompt_length);

  const auditBody = buildStableAuditBody({
    schema_version: SEQUENCE_PROMPT_QUALITY_AUDIT_VERSION,
    compiler_version: RUNTIME_CINEMATIC_SEQUENCE_EXPORT_VERSION,
    scene_pack_id: compileInput.cinematic_sequence.scene_pack_id,
    transition_ids: compiled.transition_bindings.map((binding) => binding.transition_id),
    shot_ids: compiled.shot_bindings.map((binding) => binding.shot_id),
    motion_ids: compiled.motion_bindings.map((binding) => binding.bridge_id),
    compiled_prompt_length,
    duplicate_phrase_count,
    forbidden_term_hits,
    assembly_order: compiled.assembly_order,
    assembly_order_valid,
    identity_before_action,
    prompt_length_acceptable,
    verdict: 'PASS',
  });

  auditBody.verdict = resolveVerdict({
    forbidden_term_hits,
    identity_before_action,
    assembly_order_valid,
    duplicate_phrase_count,
    compiled_prompt_length,
    scene_isolation_clean: assertSceneIsolationClean(compiledPrompt),
  });

  return auditBody;
}

export function buildSequencePromptQualityAudit(): SequencePromptQualityAuditResult {
  const auditBody = buildSequencePromptQualityAuditBody();
  return {
    ...auditBody,
    audit_checksum: digest([JSON.stringify(auditBody)]),
    deterministic_audit_stable: verifySequencePromptQualityAuditDeterminism(5),
    generated_at: SEQUENCE_PROMPT_QUALITY_AUDIT_EPOCH,
  };
}

export function verifySequencePromptQualityAuditDeterminism(runs = 5): boolean {
  const checksums = Array.from({ length: runs }, () =>
    digest([JSON.stringify(buildSequencePromptQualityAuditBody())])
  );
  return checksums.every((checksum) => checksum === checksums[0]);
}

let cachedAudit: SequencePromptQualityAuditResult | null = null;

export function buildSequencePromptQualityAuditPreview(): SequencePromptQualityAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildSequencePromptQualityAudit();
  return cachedAudit;
}

export function resetSequencePromptQualityAuditCache(): void {
  cachedAudit = null;
}
