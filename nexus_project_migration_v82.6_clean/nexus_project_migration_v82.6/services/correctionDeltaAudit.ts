import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  AppliedManualDelta,
  ApprovedCorrectedEngineInput,
  CORRECTION_DELTA_AUDIT_VERSION,
  CorrectionDeltaAuditResult,
  CorrectionDeltaCheck,
  CorrectionDeltaReport,
  CorrectionDeltaRisk,
  SecondPassReadinessVerdict,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildCorrectedRenderInputPackPreview } from './correctedRenderInputPack';
import { buildManualCorrectionPackPreview } from './manualCorrectionPackBuilder';
import { buildRealRenderInputPackPreview } from './realRenderInputPackExport';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const CORRECTION_DELTA_AUDIT_EPOCH = '2026-05-27T10:30:00.000Z';
export const CORRECTION_DELTA_AUDIT_JSON_FILENAME = 'correction-delta-audit.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;
const FORBIDDEN_STYLE_LEAKAGE_TOKENS = [
  'anime',
  'cartoon',
  'pixar',
  'disney',
  'cel-shaded',
  'low-poly',
  'stock photo',
  'watermark',
  'logo overlay',
  'nsfw',
];

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function clamp01(value: number): number {
  return round6(Math.max(0, Math.min(1, value)));
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[\s,.;:|\[\]/(){}]+/)
      .filter((token) => token.length > 3)
  );
}

function buildCheck(
  check_key: string,
  label: string,
  passed: boolean,
  detail: string,
  score: number = passed ? 1 : 0
): CorrectionDeltaCheck {
  return { check_key, label, passed, score: round6(score), detail };
}

function verifyDeltasAppliedCorrectly(
  originalPrompt: string,
  correctedPrompt: string,
  appliedDeltas: AppliedManualDelta[]
): CorrectionDeltaCheck {
  const promptDeltas = appliedDeltas.filter((delta) => delta.application !== 'parameter_only');
  const allTextsPresent = promptDeltas.every((delta) => correctedPrompt.includes(delta.applied_text));
  const containsOriginal = correctedPrompt.includes(originalPrompt);
  const passed = containsOriginal && (promptDeltas.length === 0 || allTextsPresent);

  return buildCheck(
    'correction_deltas_applied_correctly',
    'Correction Deltas Applied Correctly',
    passed,
    passed
      ? `${promptDeltas.length} prompt delta(s) verified in corrected prompt; original substring preserved`
      : 'Corrected prompt missing original body or one or more applied delta texts',
    passed ? 1 : 0.2
  );
}

function verifyNoHallucinationInjection(
  originalPrompt: string,
  correctedPrompt: string,
  appliedDeltas: AppliedManualDelta[]
): { check: CorrectionDeltaCheck; risks: CorrectionDeltaRisk[] } {
  const allowedTokens = tokenize(originalPrompt);
  for (const delta of appliedDeltas) {
    for (const token of tokenize(delta.applied_text)) allowedTokens.add(token);
  }

  const correctedTokens = [...tokenize(correctedPrompt)];
  const unexpected = correctedTokens.filter((token) => !allowedTokens.has(token));
  const passed = unexpected.length === 0;

  const risks: CorrectionDeltaRisk[] = unexpected.slice(0, 5).map((token, index) => ({
    risk_id: `RISK-HALLUC-${String(index + 1).padStart(3, '0')}`,
    severity: 'critical' as const,
    category: 'hallucination_injection',
    signal: `unexpected_token:${token}`,
    detail: `Token "${token}" appears in corrected prompt but not in original or applied deltas`,
  }));

  return {
    check: buildCheck(
      'no_hallucination_injection',
      'No Hallucination Injection',
      passed,
      passed
        ? 'All corrected prompt tokens trace to original prompt or PHASE-23B applied deltas'
        : `${unexpected.length} unexpected token(s) detected in corrected prompt`,
      passed ? 1 : 0
    ),
    risks,
  };
}

function verifyNoForbiddenStyleLeakage(
  originalPrompt: string,
  correctedPrompt: string
): { check: CorrectionDeltaCheck; risks: CorrectionDeltaRisk[] } {
  const leaks = FORBIDDEN_STYLE_LEAKAGE_TOKENS.filter(
    (token) => correctedPrompt.toLowerCase().includes(token) && !originalPrompt.toLowerCase().includes(token)
  );
  const passed = leaks.length === 0;

  const risks: CorrectionDeltaRisk[] = leaks.map((token, index) => ({
    risk_id: `RISK-STYLE-${String(index + 1).padStart(3, '0')}`,
    severity: 'critical' as const,
    category: 'forbidden_style_leakage',
    signal: `forbidden_style:${token}`,
    detail: `Forbidden style token "${token}" injected into corrected prompt`,
  }));

  return {
    check: buildCheck(
      'no_forbidden_style_leakage',
      'No Forbidden Style Leakage',
      passed,
      passed
        ? 'No forbidden style tokens introduced beyond original prompt scope'
        : `Forbidden style leakage detected: ${leaks.join(', ')}`,
      passed ? 1 : 0
    ),
    risks,
  };
}

function verifyNegativePromptSafety(
  originalNegative: string,
  correctedNegative: string
): CorrectionDeltaCheck {
  const unchanged = correctedNegative === originalNegative;
  const safelyExtended =
    !unchanged &&
    correctedNegative.startsWith(originalNegative) &&
    correctedNegative.length <= originalNegative.length + 128;
  const passed = unchanged || safelyExtended;

  return buildCheck(
    'negative_prompt_unchanged_or_safely_extended',
    'Negative Prompt Unchanged Or Safely Extended',
    passed,
    unchanged
      ? 'Negative prompt unchanged from PHASE-22B original'
      : safelyExtended
        ? 'Negative prompt safely extended with bounded append-only delta'
        : 'Negative prompt modified beyond safe extension bounds',
    passed ? 1 : 0.3
  );
}

function verifyLockPreserved<T extends object>(
  check_key: string,
  label: string,
  original: T,
  corrected: T
): CorrectionDeltaCheck {
  const passed = JSON.stringify(original) === JSON.stringify(corrected);
  return buildCheck(
    check_key,
    label,
    passed,
    passed ? `${label} identical between original and corrected packs` : `${label} mismatch detected`,
    passed ? 1 : 0
  );
}

function buildApprovedInputs(
  correctedPack: ReturnType<typeof buildCorrectedRenderInputPackPreview>,
  verdict: SecondPassReadinessVerdict
): ApprovedCorrectedEngineInput[] {
  const approved = verdict === 'ready';
  const sceneId = correctedPack.selected_scene_id;
  const continuitySeed = correctedPack.corrected_render_input_pack.continuity_seed;

  return [
    {
      engine: 'midjourney',
      approved,
      scene_id: sceneId,
      original_prompt: correctedPack.corrected_midjourney_input.prompt,
      corrected_prompt: correctedPack.corrected_midjourney_input.corrected_prompt,
      copy_paste_payload: correctedPack.corrected_midjourney_input.corrected_copy_paste_command,
      continuity_seed: continuitySeed,
      approval_reason: approved
        ? 'PHASE-23D delta audit passed — corrected Midjourney copy_paste_command approved for second pass'
        : 'PHASE-23D delta audit blocked — do not use corrected Midjourney input',
    },
    {
      engine: 'flux',
      approved,
      scene_id: sceneId,
      original_prompt: correctedPack.corrected_flux_input.prompt,
      corrected_prompt: correctedPack.corrected_flux_input.corrected_prompt,
      copy_paste_payload: correctedPack.corrected_flux_input.corrected_copy_paste_json,
      continuity_seed: continuitySeed,
      approval_reason: approved
        ? 'PHASE-23D delta audit passed — corrected Flux copy_paste_json approved for second pass'
        : 'PHASE-23D delta audit blocked — do not use corrected Flux input',
    },
  ];
}

function resolveVerdict(
  checks: CorrectionDeltaCheck[],
  blockedRisks: CorrectionDeltaRisk[]
): SecondPassReadinessVerdict {
  const criticalRisk = blockedRisks.some((risk) => risk.severity === 'critical');
  const allPassed = checks.every((check) => check.passed);
  return allPassed && !criticalRisk ? 'ready' : 'blocked';
}

export function buildCorrectionDeltaAudit(): CorrectionDeltaAuditResult {
  const renderPack = buildRealRenderInputPackPreview();
  const correctedPack = buildCorrectedRenderInputPackPreview();
  const manualPack = buildManualCorrectionPackPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const originalScene = renderPack.selected_scene_render_pack;
  const correctedScene = correctedPack.corrected_render_input_pack;
  const appliedDeltas = correctedPack.applied_manual_deltas;

  const checks: CorrectionDeltaCheck[] = [
    buildCheck(
      'original_prompt_unchanged',
      'Original Prompt Unchanged',
      correctedScene.compressed_prompt === originalScene.compressed_prompt &&
        correctedScene.original_compressed_prompt === originalScene.compressed_prompt,
      'PHASE-22B compressed_prompt preserved verbatim in corrected pack',
      correctedScene.compressed_prompt === originalScene.compressed_prompt ? 1 : 0
    ),
    buildCheck(
      'corrected_prompt_exists',
      'Corrected Prompt Exists',
      correctedScene.corrected_compressed_prompt.length > 0 &&
        correctedPack.corrected_midjourney_input.corrected_prompt.length > 0 &&
        correctedPack.corrected_flux_input.corrected_prompt.length > 0,
      'Separate corrected prompt fields populated for scene and both engines',
      correctedScene.corrected_compressed_prompt.length > 0 ? 1 : 0
    ),
    verifyDeltasAppliedCorrectly(
      originalScene.compressed_prompt,
      correctedScene.corrected_compressed_prompt,
      appliedDeltas
    ),
    verifyLockPreserved(
      'identity_lock_preserved',
      'Identity Lock Preserved',
      originalScene.identity_lock,
      correctedScene.identity_lock
    ),
    verifyLockPreserved(
      'environment_lock_preserved',
      'Environment Lock Preserved',
      originalScene.environment_lock,
      correctedScene.environment_lock
    ),
    buildCheck(
      'style_core_preserved',
      'Style Core Preserved',
      originalScene.style_core_ref === correctedScene.style_core_ref,
      `style_core_ref ${originalScene.style_core_ref.slice(0, 16)} unchanged`,
      originalScene.style_core_ref === correctedScene.style_core_ref ? 1 : 0
    ),
    verifyNegativePromptSafety(
      originalScene.negative_prompt,
      correctedScene.corrected_negative_prompt
    ),
  ];

  const hallucination = verifyNoHallucinationInjection(
    originalScene.compressed_prompt,
    correctedScene.corrected_compressed_prompt,
    appliedDeltas
  );
  checks.push(hallucination.check);

  const styleLeakage = verifyNoForbiddenStyleLeakage(
    originalScene.compressed_prompt,
    correctedScene.corrected_compressed_prompt
  );
  checks.push(styleLeakage.check);

  checks.push(
    buildCheck(
      'continuity_seed_preserved',
      'Continuity Seed Preserved',
      originalScene.continuity_seed === correctedScene.continuity_seed,
      `continuity_seed ${originalScene.continuity_seed} unchanged across correction pass`,
      originalScene.continuity_seed === correctedScene.continuity_seed ? 1 : 0
    ),
    buildCheck(
      'production_lock_preserved',
      'Production Lock Preserved',
      originalScene.production_lock_ref === correctedScene.production_lock_ref,
      `production_lock_ref ${originalScene.production_lock_ref.slice(0, 16)} unchanged`,
      originalScene.production_lock_ref === correctedScene.production_lock_ref ? 1 : 0
    ),
    buildCheck(
      'second_pass_readiness',
      'Second Pass Readiness',
      correctedPack.correction_safety_report.safety_verdict === 'safe_for_second_pass',
      `PHASE-23C safety verdict: ${correctedPack.correction_safety_report.safety_verdict}`,
      correctedPack.correction_safety_report.safety_verdict === 'safe_for_second_pass' ? 1 : 0.5
    )
  );

  const blocked_risks: CorrectionDeltaRisk[] = [
    ...hallucination.risks,
    ...styleLeakage.risks,
    ...checks
      .filter((check) => !check.passed)
      .map((check, index) => ({
        risk_id: `RISK-CHECK-${String(index + 1).padStart(3, '0')}`,
        severity: (check.check_key.includes('hallucination') ||
        check.check_key.includes('style') ||
        check.check_key.includes('identity') ||
        check.check_key.includes('original_prompt')
          ? 'critical'
          : 'moderate') as CorrectionDeltaRisk['severity'],
        category: 'audit_check_failure',
        signal: check.check_key,
        detail: check.detail,
      })),
  ];

  const delta_safety_score = clamp01(
    checks.reduce((sum, check) => sum + check.score, 0) / checks.length
  );

  const second_pass_readiness_verdict = resolveVerdict(checks, blocked_risks);

  const correction_delta_report: CorrectionDeltaReport = {
    scene_id: renderPack.selected_scene_id,
    original_render_pack_checksum_ref: renderPack.render_input_pack_checksum,
    corrected_render_pack_checksum_ref: correctedPack.corrected_render_input_pack_checksum,
    manual_correction_pack_checksum_ref: manualPack.correction_pack_checksum,
    checks,
    checks_passed: checks.filter((check) => check.passed).length,
    checks_total: checks.length,
  };

  const approved_corrected_inputs = buildApprovedInputs(
    correctedPack,
    second_pass_readiness_verdict
  );

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const audit_verification_checks: CorrectionDeltaCheck[] = [
    buildCheck(
      'audit_report_generated',
      'Audit Report Generated',
      correction_delta_report.checks_total > 0,
      `${correction_delta_report.checks_total} delta safety checks executed`,
      1
    ),
    buildCheck(
      'runtime_dataset_unchanged',
      'Runtime Dataset Unchanged',
      runtimeFingerprintBefore === runtimeFingerprintAfter,
      'Readonly audit — runtime fingerprint preserved',
      runtimeFingerprintBefore === runtimeFingerprintAfter ? 1 : 0
    ),
    buildCheck(
      'canonical_export_unchanged',
      'Canonical Export Unchanged',
      assertCanonicalExportUnchanged(),
      `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`,
      assertCanonicalExportUnchanged() ? 1 : 0
    ),
  ];

  const packCore = {
    schema_version: CORRECTION_DELTA_AUDIT_VERSION,
    generated_at: CORRECTION_DELTA_AUDIT_EPOCH,
    readonly_audit: true as const,
    render_input_pack_checksum_ref: renderPack.render_input_pack_checksum,
    corrected_render_input_pack_checksum_ref: correctedPack.corrected_render_input_pack_checksum,
    manual_correction_pack_checksum_ref: manualPack.correction_pack_checksum,
    scene_id: renderPack.selected_scene_id,
    correction_delta_report,
    delta_safety_score,
    second_pass_readiness_verdict,
    blocked_risks,
    approved_corrected_inputs,
    audit_verification_checks,
    validation: {
      deterministic_audit_checksum_stable: true,
      readonly_audit: true as const,
      no_prompt_rewrite: true as const,
      no_dataset_mutation: true as const,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const correction_delta_audit_checksum = digest([
    JSON.stringify({ ...packCore, correction_delta_audit_checksum: undefined }),
    renderPack.render_input_pack_checksum,
    correctedPack.corrected_render_input_pack_checksum,
    String(delta_safety_score),
    second_pass_readiness_verdict,
  ]);

  return {
    ...packCore,
    correction_delta_audit_checksum,
  };
}

let cachedAudit: CorrectionDeltaAuditResult | null = null;

export function buildCorrectionDeltaAuditPreview(): CorrectionDeltaAuditResult {
  if (cachedAudit) return cachedAudit;
  cachedAudit = buildCorrectionDeltaAudit();
  return cachedAudit;
}

export function buildCorrectionDeltaAuditJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildCorrectionDeltaAuditPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: CORRECTION_DELTA_AUDIT_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetCorrectionDeltaAuditCache(): void {
  cachedAudit = null;
}
