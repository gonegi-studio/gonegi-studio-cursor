import crypto from 'crypto';
import {
  RUNTIME_CHARACTER_FIRST_EXPORT_VERSION,
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

export const SEQUENCE_PROMPT_QUALITY_AUDIT_EPOCH = '2026-05-28T10:00:00.000Z';

/** Pre-33A typical compiled_prompt length for reduction comparison. */
const PHASE_32D_BASELINE_PROMPT_LENGTH = 4173;
const TARGET_REDUCTION_RATIO = 0.35;
const MAX_PASS_PROMPT_LENGTH = 14_000;
const MAX_WARN_PROMPT_LENGTH = 18_000;
const MAX_PASS_DUPLICATE_PHRASES = 1;
const MAX_WARN_DUPLICATE_PHRASES = 3;
const MIN_PHRASE_LENGTH_FOR_DUPLICATE = 24;

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
  const characterIdx = compiledPrompt.indexOf('[CHARACTER_CORE]');
  const referenceIdx = compiledPrompt.indexOf('[REFERENCE_TRIGGER]');
  const actionIdx = compiledPrompt.indexOf('[ACTION]');
  const sceneIdx = compiledPrompt.indexOf('[SCENE]');
  const styleIdx = compiledPrompt.indexOf('[STYLE_CORE_LIGHT]');
  const shotIdx = compiledPrompt.indexOf('[SHOT]');

  if (
    characterIdx < 0 ||
    referenceIdx < 0 ||
    actionIdx < 0 ||
    sceneIdx < 0 ||
    styleIdx < 0 ||
    shotIdx < 0
  ) {
    return false;
  }

  return (
    characterIdx < referenceIdx &&
    referenceIdx < actionIdx &&
    characterIdx < sceneIdx &&
    characterIdx < styleIdx &&
    sceneIdx < styleIdx &&
    characterIdx < shotIdx
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

function isPromptLengthReduced(length: number): boolean {
  return length <= Math.floor(PHASE_32D_BASELINE_PROMPT_LENGTH * (1 - TARGET_REDUCTION_RATIO));
}

function resolveVerdict(input: {
  forbidden_term_hits: string[];
  identity_before_action: boolean;
  assembly_order_valid: boolean;
  duplicate_phrase_count: number;
  compiled_prompt_length: number;
  scene_isolation_clean: boolean;
  character_first_order: boolean;
  prompt_length_reduced: boolean;
}): SequencePromptQualityVerdict {
  if (
    input.forbidden_term_hits.length > 0 ||
    !input.identity_before_action ||
    !input.assembly_order_valid ||
    !input.scene_isolation_clean ||
    !input.character_first_order ||
    input.compiled_prompt_length > MAX_WARN_PROMPT_LENGTH ||
    input.duplicate_phrase_count > MAX_WARN_DUPLICATE_PHRASES
  ) {
    return 'FAIL';
  }

  if (
    input.duplicate_phrase_count > MAX_PASS_DUPLICATE_PHRASES ||
    input.compiled_prompt_length > MAX_PASS_PROMPT_LENGTH ||
    !input.prompt_length_reduced
  ) {
    return 'WARN';
  }

  return 'PASS';
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
  const character_first_order = compiledPrompt.startsWith('[CHARACTER_CORE]');

  const auditBody = {
    schema_version: SEQUENCE_PROMPT_QUALITY_AUDIT_VERSION,
    compiler_version: RUNTIME_CHARACTER_FIRST_EXPORT_VERSION,
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
    verdict: 'PASS' as SequencePromptQualityVerdict,
  };

  auditBody.verdict = resolveVerdict({
    forbidden_term_hits,
    identity_before_action,
    assembly_order_valid,
    duplicate_phrase_count,
    compiled_prompt_length,
    scene_isolation_clean: assertSceneIsolationClean(compiledPrompt),
    character_first_order,
    prompt_length_reduced: isPromptLengthReduced(compiled_prompt_length),
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
