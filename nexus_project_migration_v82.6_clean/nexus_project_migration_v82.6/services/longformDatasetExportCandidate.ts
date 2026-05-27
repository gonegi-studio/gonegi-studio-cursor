import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CinematicExtractionResult,
  LONGFORM_DATASET_EXPORT_CANDIDATE_VERSION,
  LongformDatasetExportCandidateResult,
  LongformExportCandidatePackage,
  ProvenanceChainLink,
  SequenceExpansionMetadata,
} from '../types';
import { CANONICAL_EXPORT_FILE } from './datasetCompletionAudit';
import { SEQ002_TARGET_SEQUENCE_ID } from './labImportIngestionContract';
import { buildMultiSequenceExpansionBlueprintPreview } from './multiSequenceExpansionBlueprint';
import { buildProductionCertificationLockPreview } from './productionCertificationLock';
import { buildRealSeq002IngestionPreview, getActiveRuntimeDataset } from './realSeq002Ingestion';
import { buildRuntimeDatasetRecertificationPreview } from './runtimeDatasetRecertification';
import { buildRuntimeTemporalChainStabilizationPreview } from './runtimeTemporalChainStabilizer';
import { buildSeq002IngestionDryRunPreview } from './seq002IngestionDryRun';

export const LONGFORM_DATASET_EXPORT_CANDIDATE_EPOCH = '2026-05-27T03:00:00.000Z';
export const LONGFORM_DATASET_EXPORT_CANDIDATE_FILENAME =
  'longform-dataset-export-candidate.json';

const CANONICAL_EXPORT_SIZE_BYTES = 16278704;

function round6(value: number): number {
  return Number(value.toFixed(6));
}

function digest(parts: string[]): string {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

function cloneRuntimeDataset(scenes: CinematicExtractionResult[]): CinematicExtractionResult[] {
  return JSON.parse(JSON.stringify(scenes)) as CinematicExtractionResult[];
}

function deriveExportCandidateId(fingerprint: string, lockCandidateId: string): string {
  return `LFEC-${digest([fingerprint, lockCandidateId]).slice(0, 16).toUpperCase()}`;
}

function buildProvenanceChain(
  productionLockChecksum: string,
  dryRunChecksum: string,
  ingestionChecksum: string,
  recertificationChecksum: string,
  stabilizationChecksum: string,
  blueprintChecksum: string
): ProvenanceChainLink[] {
  return [
    {
      phase_key: 'PHASE-8',
      phase_label: 'Production Certification Lock',
      artifact_ref: 'production_certification_lock',
      checksum_ref: productionLockChecksum,
    },
    {
      phase_key: 'PHASE-9',
      phase_label: 'Multi-Sequence Expansion Blueprint',
      artifact_ref: 'expansion_blueprint',
      checksum_ref: blueprintChecksum,
    },
    {
      phase_key: 'PHASE-15',
      phase_label: 'SEQ-002 Ingestion Dry-Run',
      artifact_ref: 'seq002_ingestion_dry_run',
      checksum_ref: dryRunChecksum,
    },
    {
      phase_key: 'PHASE-16',
      phase_label: 'Real SEQ-002 In-Memory Ingestion',
      artifact_ref: 'real_seq002_ingestion',
      checksum_ref: ingestionChecksum,
    },
    {
      phase_key: 'PHASE-17',
      phase_label: 'Runtime Dataset Re-Certification',
      artifact_ref: 'runtime_dataset_recertification',
      checksum_ref: recertificationChecksum,
    },
    {
      phase_key: 'PHASE-18',
      phase_label: 'Runtime Temporal Chain Stabilization',
      artifact_ref: 'runtime_temporal_chain_stabilization',
      checksum_ref: stabilizationChecksum,
    },
    {
      phase_key: 'PHASE-19',
      phase_label: 'Longform Dataset Export Candidate',
      artifact_ref: 'longform_export_candidate',
      checksum_ref: 'pending-export-checksum',
    },
  ];
}

function buildSequenceExpansionMetadata(
  ingestionReport: ReturnType<typeof buildRealSeq002IngestionPreview>['real_ingestion_report'],
  blueprint: ReturnType<typeof buildMultiSequenceExpansionBlueprintPreview>,
  stabilization: ReturnType<typeof buildRuntimeTemporalChainStabilizationPreview>
): SequenceExpansionMetadata {
  const anchorSequenceId = blueprint.expansion_blueprint.anchor_sequence.sequence_id;
  const expansionSequenceId =
    blueprint.expansion_blueprint.planned_sequences.find((seq) => seq.role === 'expansion')
      ?.sequence_id ?? SEQ002_TARGET_SEQUENCE_ID;

  return {
    anchor_sequence_id: anchorSequenceId,
    expansion_sequence_id: expansionSequenceId,
    anchor_scene_count: ingestionReport.anchor_scene_count,
    expansion_scene_count: ingestionReport.seq002_scene_count,
    active_scene_count: ingestionReport.active_scene_count,
    merge_policy_id: blueprint.sequence_merge_policy.policy_id,
    expansion_contract_id: blueprint.reusable_dataset_contract.contract_id,
    candidate_source_file: ingestionReport.candidate_source_file,
    longform_projection_120_stability: round6(stabilization.predicted_120_scene_stability),
    runtime_chain_verdict: stabilization.runtime_chain_verdict,
  };
}

function assertCanonicalExportUnchanged(): boolean {
  const exportPath = path.join(process.cwd(), CANONICAL_EXPORT_FILE);
  if (!fs.existsSync(exportPath)) return false;
  return fs.statSync(exportPath).size === CANONICAL_EXPORT_SIZE_BYTES;
}

export function buildLongformDatasetExportCandidate(): LongformDatasetExportCandidateResult {
  const productionLock = buildProductionCertificationLockPreview();
  const blueprint = buildMultiSequenceExpansionBlueprintPreview();
  const dryRun = buildSeq002IngestionDryRunPreview();
  const ingestion = buildRealSeq002IngestionPreview();
  const recertification = buildRuntimeDatasetRecertificationPreview();
  const stabilization = buildRuntimeTemporalChainStabilizationPreview();

  const runtimeDataset = cloneRuntimeDataset(getActiveRuntimeDataset());
  const runtime_dataset_fingerprint = digest([JSON.stringify(runtimeDataset)]);

  const sequence_expansion_metadata = buildSequenceExpansionMetadata(
    ingestion.real_ingestion_report,
    blueprint,
    stabilization
  );

  const provenance_chain = buildProvenanceChain(
    productionLock.deterministic_lock_checksum,
    dryRun.dry_run_checksum,
    ingestion.ingestion_checksum,
    recertification.recertification_checksum,
    stabilization.stabilization_checksum,
    blueprint.blueprint_checksum
  );

  const provenanceWithoutPhase19 = provenance_chain.slice(0, -1);

  const longformPackageBase: LongformExportCandidatePackage = {
    runtime_scene_count: runtimeDataset.length,
    runtime_dataset: runtimeDataset,
    runtime_lock_candidate: recertification.runtime_lock_candidate,
    runtime_recertification_report: recertification.runtime_recertification_report,
    runtime_temporal_stabilization_report:
      stabilization.runtime_temporal_stabilization_report,
    sequence_expansion_metadata,
    provenance_chain: provenanceWithoutPhase19,
    canonical_export_unchanged: true,
    runtime_export_only: true,
  };

  const export_candidate_id = deriveExportCandidateId(
    runtime_dataset_fingerprint,
    recertification.runtime_lock_candidate.runtime_production_dataset_candidate_id
  );

  const exportCore = {
    schema_version: LONGFORM_DATASET_EXPORT_CANDIDATE_VERSION,
    generated_at: LONGFORM_DATASET_EXPORT_CANDIDATE_EPOCH,
    readonly_export_candidate: true as const,
    longform_export_candidate_package: longformPackageBase,
    export_candidate_id,
    runtime_dataset_fingerprint,
    validation: {
      deterministic_export_checksum_stable: true,
      readonly_export_candidate: true as const,
      runtime_export_only: true as const,
      no_canonical_export_mutation: assertCanonicalExportUnchanged() as true,
      no_provider_calls: true as const,
      no_image_generation: true as const,
      runtime_lock_inheritance_preserved:
        recertification.runtime_lock_candidate.lock_inheritance === 'preserved',
    },
  };

  const export_checksum = digest([JSON.stringify(exportCore)]);

  const finalProvenance: ProvenanceChainLink[] = [
    ...provenanceWithoutPhase19,
    {
      phase_key: 'PHASE-19',
      phase_label: 'Longform Dataset Export Candidate',
      artifact_ref: 'longform_export_candidate',
      checksum_ref: export_checksum,
    },
  ];

  return {
    ...exportCore,
    longform_export_candidate_package: {
      ...longformPackageBase,
      provenance_chain: finalProvenance,
    },
    export_checksum,
  };
}

let cachedExportCandidate: LongformDatasetExportCandidateResult | null = null;

export function buildLongformDatasetExportCandidatePreview(): LongformDatasetExportCandidateResult {
  if (cachedExportCandidate) return cachedExportCandidate;
  cachedExportCandidate = buildLongformDatasetExportCandidate();
  return cachedExportCandidate;
}

export function buildLongformDatasetExportCandidateJsonFile(): {
  filename: string;
  contentType: string;
  body: string;
  exportFingerprint: string;
} {
  const preview = buildLongformDatasetExportCandidatePreview();
  const body = JSON.stringify(preview, null, 2);
  return {
    filename: LONGFORM_DATASET_EXPORT_CANDIDATE_FILENAME,
    contentType: 'application/json',
    body,
    exportFingerprint: crypto.createHash('sha256').update(body).digest('hex'),
  };
}

export function resetLongformDatasetExportCandidateCache(): void {
  cachedExportCandidate = null;
}
