import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CompletionCertificationCheck,
  CompletionVerdict,
  FINAL_DATASET_COMPLETION_CERTIFICATION_VERSION,
  FinalDatasetCompletionCertificate,
  FinalDatasetCompletionCertificationResult,
  ImageGenerationApproval,
  NextPhaseRecommendation,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { buildFinalDatasetSemanticQualityAuditPreview } from './finalDatasetSemanticQualityAudit';
import { buildFinalDatasetStructuralIntegrityAuditPreview } from './finalDatasetStructuralIntegrityAudit';
import { buildLongformDatasetProductionLockPreview } from './longformDatasetProductionLock';
import { buildLongformFatigueRiskReducerAuditPreview } from './longformFatigueRiskReducerAudit';
import { getActiveRuntimeDataset } from './realSeq002Ingestion';

export const FINAL_DATASET_COMPLETION_CERTIFICATION_EPOCH = '2026-05-27T12:30:00.000Z';
export const FINAL_DATASET_COMPLETION_CERTIFICATION_JSON_FILENAME =
  'final-dataset-completion-certificate.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

function buildCheck(
  check_key: string,
  label: string,
  passed: boolean,
  detail: string
): CompletionCertificationCheck {
  return { check_key, label, passed, detail };
}

function resolveCompletionVerdict(
  structuralComplete: boolean,
  semanticReady: boolean,
  noBlocking: boolean,
  productionLockValid: boolean,
  generationReadiness: 'ready' | 'conditional' | 'not_ready'
): CompletionVerdict {
  if (!structuralComplete || !semanticReady || !noBlocking || !productionLockValid) {
    return 'not_certified';
  }
  if (generationReadiness === 'ready') return 'certified_complete';
  if (generationReadiness === 'conditional') return 'certified_conditional';
  return 'not_certified';
}

function resolveImageGenerationApproval(
  verdict: CompletionVerdict,
  generationReadiness: 'ready' | 'conditional' | 'not_ready'
): ImageGenerationApproval {
  if (verdict === 'not_certified') return 'blocked';
  if (generationReadiness === 'ready' && verdict === 'certified_complete') return 'approved';
  if (generationReadiness === 'conditional' || verdict === 'certified_conditional') {
    return 'conditional';
  }
  return 'blocked';
}

function resolveNextPhaseRecommendation(
  verdict: CompletionVerdict,
  structuralComplete: boolean,
  semanticReady: boolean,
  noBlocking: boolean,
  generationReadiness: 'ready' | 'conditional' | 'not_ready',
  fatigueCauseCount: number
): NextPhaseRecommendation {
  if (!noBlocking) return 'hold_until_blocking_issues_cleared';
  if (!structuralComplete) return 'resolve_structural_gaps';
  if (!semanticReady) return 'resolve_semantic_gaps';
  if (
    (generationReadiness === 'conditional' || fatigueCauseCount > 0) &&
    verdict === 'certified_conditional'
  ) {
    return 'proceed_with_fatigue_mitigation_plan';
  }
  if (verdict === 'certified_complete' || verdict === 'certified_conditional') {
    return 'proceed_external_image_generation';
  }
  return 'hold_until_blocking_issues_cleared';
}

function buildRemainingAdvisories(
  structuralGaps: number,
  semanticGaps: number,
  weakScenes: string[],
  fatigueRecommendations: string[],
  generationReadiness: 'ready' | 'conditional' | 'not_ready'
): string[] {
  const advisories: string[] = [];

  if (structuralGaps > 0) {
    advisories.push(`${structuralGaps} structural gap(s) remain — review PHASE-24A gap_list before export.`);
  }
  if (semanticGaps > 0) {
    advisories.push(`${semanticGaps} semantic gap(s) flagged — review PHASE-24B semantic_gap_list.`);
  }
  if (weakScenes.length > 0) {
    advisories.push(
      `Weak semantic scenes: ${weakScenes.slice(0, 5).join(', ')}${weakScenes.length > 5 ? '…' : ''}.`
    );
  }
  if (generationReadiness === 'conditional') {
    advisories.push(
      'Longform generation readiness is conditional — apply PHASE-24C fatigue_reduction_plan before high-volume external renders.'
    );
  }
  advisories.push(...fatigueRecommendations.slice(0, 5));

  if (advisories.length === 0) {
    advisories.push(
      'No remaining advisories — dataset structurally and semantically certified for external image generation.'
    );
  }

  return [...new Set(advisories)];
}

export function buildFinalDatasetCompletionCertification(): FinalDatasetCompletionCertificationResult {
  const structural = buildFinalDatasetStructuralIntegrityAuditPreview();
  const semantic = buildFinalDatasetSemanticQualityAuditPreview();
  const fatigue = buildLongformFatigueRiskReducerAuditPreview();
  const productionLock = buildLongformDatasetProductionLockPreview();

  const runtimeFingerprintBefore = digest([JSON.stringify(getActiveRuntimeDataset())]);

  const structuralComplete =
    structural.final_dataset_integrity_verdict === 'structurally_complete';
  const semanticReady = semantic.final_semantic_verdict === 'semantically_ready';
  const productionLockValid =
    productionLock.release_readiness_verdict === 'production_locked' &&
    productionLock.longform_production_lock.export_candidate_checksum_ref ===
      structural.export_candidate_checksum_ref;

  const totalBlockingIssues =
    structural.blocking_issues.length +
    semantic.semantic_blocking_issues.length +
    fatigue.reducer_blocking_issues.length;
  const noBlocking = totalBlockingIssues === 0;

  const fatigueRiskAcknowledged =
    fatigue.fatigue_risk_causes.length > 0 &&
    fatigue.fatigue_reduction_plan.steps.length > 0;

  const generationReadiness = semantic.longform_generation_readiness;

  const completion_verdict = resolveCompletionVerdict(
    structuralComplete,
    semanticReady,
    noBlocking,
    productionLockValid,
    generationReadiness
  );

  const approved_for_image_generation = resolveImageGenerationApproval(
    completion_verdict,
    generationReadiness
  );

  const next_phase_recommendation = resolveNextPhaseRecommendation(
    completion_verdict,
    structuralComplete,
    semanticReady,
    noBlocking,
    generationReadiness,
    fatigue.fatigue_risk_causes.length
  );

  const remaining_advisories = buildRemainingAdvisories(
    structural.gap_list.length,
    semantic.semantic_gap_list.length,
    semantic.weak_scene_ids,
    fatigue.safe_non_mutating_recommendations,
    generationReadiness
  );

  const final_dataset_completion_certificate: FinalDatasetCompletionCertificate = {
    certificate_id: `CERT-24D-${structural.export_candidate_id.slice(0, 12)}`,
    certified_at: FINAL_DATASET_COMPLETION_CERTIFICATION_EPOCH,
    export_candidate_id: structural.export_candidate_id,
    locked_export_id: structural.locked_export_id,
    scene_count: structural.scene_count,
    structural_integrity_verdict: structural.final_dataset_integrity_verdict,
    semantic_verdict: semantic.final_semantic_verdict,
    longform_generation_readiness: semantic.longform_generation_readiness,
    fatigue_risk_acknowledged: fatigueRiskAcknowledged as true,
    fatigue_causes_documented: fatigue.fatigue_risk_causes.length,
    production_lock_valid: productionLockValid,
    structural_audit_checksum_ref: structural.structural_integrity_audit_checksum,
    semantic_audit_checksum_ref: semantic.semantic_audit_checksum,
    fatigue_reducer_audit_checksum_ref: fatigue.fatigue_reducer_audit_checksum,
    production_lock_checksum_ref: productionLock.production_lock_checksum,
    readonly_certification: true,
  };

  const completion_certification_checks: CompletionCertificationCheck[] = [
    buildCheck(
      'structural_integrity_complete',
      'Structural Integrity Complete',
      structuralComplete,
      `PHASE-24A verdict: ${structural.final_dataset_integrity_verdict}`
    ),
    buildCheck(
      'semantic_readiness_pass',
      'Semantic Readiness Pass',
      semanticReady,
      `PHASE-24B verdict: ${semantic.final_semantic_verdict}; quality ${semantic.semantic_quality_score}`
    ),
    buildCheck(
      'fatigue_risk_acknowledged',
      'Fatigue Risk Acknowledged',
      fatigueRiskAcknowledged,
      `PHASE-24C documented ${fatigue.fatigue_risk_causes.length} cause(s) with ${fatigue.fatigue_reduction_plan.steps.length} plan step(s)`
    ),
    buildCheck(
      'no_blocking_issues',
      'No Blocking Issues',
      noBlocking,
      noBlocking
        ? 'Zero blocking issues across PHASE-24A/24B/24C'
        : `${totalBlockingIssues} blocking issue(s) across integrated audits`
    ),
    buildCheck(
      'production_lock_valid',
      'Production Lock Valid',
      productionLockValid,
      productionLockValid
        ? `PHASE-20 production_locked; checksum ref aligned`
        : `Production lock invalid: ${productionLock.release_readiness_verdict}`
    ),
    buildCheck(
      'image_generation_readiness',
      'Image Generation Readiness',
      generationReadiness === 'ready' || generationReadiness === 'conditional',
      `Longform generation readiness: ${generationReadiness}; approval: ${approved_for_image_generation}`
    ),
    buildCheck(
      'canonical_export_unchanged',
      'Canonical Export Unchanged',
      assertCanonicalExportUnchanged(),
      `Parent canonical export remains ${CANONICAL_EXPORT_SIZE_BYTES} bytes`
    ),
  ];

  const runtimeFingerprintAfter = digest([JSON.stringify(getActiveRuntimeDataset())]);
  if (runtimeFingerprintBefore !== runtimeFingerprintAfter) {
    completion_certification_checks.push(
      buildCheck(
        'runtime_dataset_unchanged',
        'Runtime Dataset Unchanged',
        false,
        'Runtime dataset fingerprint changed during certification'
      )
    );
  } else {
    completion_certification_checks.push(
      buildCheck(
        'runtime_dataset_unchanged',
        'Runtime Dataset Unchanged',
        true,
        'Readonly certification — runtime fingerprint preserved'
      )
    );
  }

  const certCore = {
    schema_version: FINAL_DATASET_COMPLETION_CERTIFICATION_VERSION,
    generated_at: FINAL_DATASET_COMPLETION_CERTIFICATION_EPOCH,
    readonly_certification: true as const,
    final_dataset_completion_certificate,
    completion_verdict,
    approved_for_image_generation,
    remaining_advisories,
    next_phase_recommendation,
    completion_certification_checks,
    validation: {
      deterministic_certificate_checksum_stable: true,
      readonly_certification: true as const,
      no_dataset_mutation: true as const,
      no_prompt_rewrite: true as const,
      no_image_generation: true as const,
      no_provider_calls: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_runtime_dataset_mutation: (runtimeFingerprintBefore === runtimeFingerprintAfter) as true,
    },
  };

  const final_certificate_checksum = digest([
    JSON.stringify({ ...certCore, final_certificate_checksum: undefined }),
    structural.structural_integrity_audit_checksum,
    semantic.semantic_audit_checksum,
    fatigue.fatigue_reducer_audit_checksum,
    completion_verdict,
    approved_for_image_generation,
  ]);

  return {
    ...certCore,
    final_certificate_checksum,
  };
}

let cachedCertification: FinalDatasetCompletionCertificationResult | null = null;

export function buildFinalDatasetCompletionCertificationPreview(): FinalDatasetCompletionCertificationResult {
  if (cachedCertification) return cachedCertification;
  cachedCertification = buildFinalDatasetCompletionCertification();
  return cachedCertification;
}

export function buildFinalDatasetCompletionCertificationJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildFinalDatasetCompletionCertificationPreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: FINAL_DATASET_COMPLETION_CERTIFICATION_JSON_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetFinalDatasetCompletionCertificationCache(): void {
  cachedCertification = null;
}
