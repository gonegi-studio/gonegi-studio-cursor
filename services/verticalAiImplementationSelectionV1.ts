import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
  SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH,
  writeSourceVideoNumericalDnaAuditReport,
} from './sourceVideoNumericalDnaAudit.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
  SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH,
  writeSourceVideoNumericalDnaExtractionDesignReport,
} from './sourceVideoNumericalDnaExtractionDesign.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
  writeSourceVideoNumericalDnaFoundationReport,
} from './sourceVideoNumericalDnaFoundation.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXTRACTION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_FULL_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_FULL_PHASE,
  writeSourceVideoNumericalDnaFullExtractionReport,
} from './sourceVideoNumericalDnaFullExtraction.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
  writeSourceVideoNumericalDnaMveExtractionReport,
} from './sourceVideoNumericalDnaMveExtraction.js';
import {
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT,
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
  SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH,
  writeSourceVideoNumericalDnaValidationReport,
} from './sourceVideoNumericalDnaValidation.js';
import {
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE,
  MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH,
  writeMovieReconstructionConditioningAuditReport,
} from './movieReconstructionConditioningAudit.js';
import {
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
  MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH,
  writeMovieReconstructionConditioningDesignReport,
} from './movieReconstructionConditioningDesign.js';
import {
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH,
  MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
  writeMovieReconstructionConditioningArchitectureDecisionReport,
} from './movieReconstructionConditioningArchitectureDecision.js';
import {
  CONDITIONING_MAP_EXPORT_PASS_VERDICT,
  CONDITIONING_MAP_EXPORT_PHASE,
  CONDITIONING_MAP_EXPORT_REPORT_PATH,
  writeConditioningMapExportReport,
} from './conditioningMapExport.js';
import {
  CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT,
  CONDITIONING_BACKEND_ADAPTER_PHASE,
  CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
  writeConditioningBackendAdapterReport,
} from './conditioningBackendAdapterDesign.js';
import {
  IMAGE_APP_MAP_INGESTION_PASS_VERDICT,
  IMAGE_APP_MAP_INGESTION_PHASE,
  IMAGE_APP_MAP_INGESTION_REPORT_PATH,
  writeImageAppMapIngestionReport,
} from './imageAppMapIngestion.js';
import {
  ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT,
  ADAPTER_TRANSLATION_VALIDATION_PHASE,
  ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
  writeAdapterTranslationValidationReport,
} from './adapterTranslationValidation.js';
import {
  CONDITIONING_PRESERVATION_GAP_ANALYSIS_PASS_VERDICT,
  CONDITIONING_PRESERVATION_GAP_ANALYSIS_PHASE,
  CONDITIONING_PRESERVATION_GAP_REPORT_PATH,
  writeConditioningPreservationGapReport,
} from './conditioningPreservationGapAnalysis.js';
import {
  ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_STRATEGY_PHASE,
  ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH,
  writeEnvironmentIdentityStrategyReport,
} from './environmentIdentityStrategy.js';
import {
  TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT,
  TEMPORAL_PRESERVATION_STRATEGY_PHASE,
  TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH,
  writeTemporalPreservationStrategyReport,
} from './temporalPreservationStrategy.js';
import {
  OBJECT_IDENTITY_STRATEGY_PASS_VERDICT,
  OBJECT_IDENTITY_STRATEGY_PHASE,
  OBJECT_IDENTITY_STRATEGY_REPORT_PATH,
  writeObjectIdentityStrategyReport,
} from './objectIdentityStrategy.js';
import {
  BACKEND_RUNTIME_BRIDGE_PASS_VERDICT,
  BACKEND_RUNTIME_BRIDGE_PHASE,
  BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
  writeBackendRuntimeBridgeReport,
} from './backendRuntimeBridge.js';
import {
  TEMPORAL_PRESERVATION_BINDING_PASS_VERDICT,
  TEMPORAL_PRESERVATION_BINDING_PHASE,
  TEMPORAL_PRESERVATION_BINDING_REPORT_PATH,
  writeTemporalPreservationBindingReport,
} from './temporalPreservationBinding.js';
import {
  ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_BINDING_PHASE,
  ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH,
  writeEnvironmentIdentityBindingReport,
} from './environmentIdentityBinding.js';
import {
  OBJECT_IDENTITY_BINDING_PASS_VERDICT,
  OBJECT_IDENTITY_BINDING_PHASE,
  OBJECT_IDENTITY_BINDING_REPORT_PATH,
  writeObjectIdentityBindingReport,
} from './objectIdentityBinding.js';
import {
  VIDEO_CONDITIONING_BACKEND_PASS_VERDICT,
  VIDEO_CONDITIONING_BACKEND_PHASE,
  VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
  writeVideoConditioningBackendReport,
} from './videoConditioningBackend.js';
import {
  GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT,
  GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE,
  GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
  writeGpuConditioningCapabilityAuditReport,
} from './gpuConditioningCapabilityAudit.js';
import {
  VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT,
  VIDEO_RUNTIME_ENFORCEMENT_PHASE,
  RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH,
  writeVideoRuntimeEnforcementReport,
} from './videoRuntimeEnforcement.js';
import {
  GPU_VALIDATION_DATASET_PASS_VERDICT,
  GPU_VALIDATION_DATASET_PHASE,
  GPU_VALIDATION_DATASET_REPORT_PATH,
  writeGpuValidationDatasetReport,
} from './gpuValidationDataset.js';
import {
  GPU_VALIDATION_CAMPAIGN_PASS_VERDICT,
  GPU_VALIDATION_CAMPAIGN_PHASE,
  GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
  writeGpuValidationCampaignReport,
} from './gpuValidationCampaign.js';
import {
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
  ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
  writeEnvironmentIdentityGpuValidationReport,
} from './environmentIdentityGpuValidation.js';
import {
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
  TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
  writeTemporalPreservationGpuValidationReport,
} from './temporalPreservationGpuValidation.js';
import {
  OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
  OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
  OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
  writeObjectIdentityGpuValidationReport,
} from './objectIdentityGpuValidation.js';
import {
  GPU_VALIDATION_INTEGRATION_PASS_VERDICT,
  GPU_VALIDATION_INTEGRATION_PHASE,
  GPU_VALIDATION_INTEGRATION_REPORT_PATH,
  GPU_VALIDATION_MASTER_READINESS_PATH,
  writeGpuValidationIntegrationReport,
} from './gpuValidationIntegration.js';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
  ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
  writeEnvironmentIdentityEvidenceReport,
} from './environmentIdentityEvidence.js';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_PASS_VERDICT,
  TEMPORAL_PRESERVATION_EVIDENCE_PHASE,
  TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
  writeTemporalPreservationEvidenceReport,
} from './temporalPreservationEvidence.js';
import {
  OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT,
  OBJECT_IDENTITY_EVIDENCE_PHASE,
  OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
  writeObjectIdentityEvidenceReport,
} from './objectIdentityEvidence.js';
import {
  EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT,
  EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
  EVIDENCE_LAYER_READINESS_REPORT_PATH,
  writeEvidenceLayerReadinessReviewReport,
} from './evidenceLayerReadinessReview.js';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
  ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
  writeEnvironmentIdentityEvidenceCollectionReport,
} from './environmentIdentityEvidenceCollection.js';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
  TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH,
  writeTemporalPreservationEvidenceCollectionReport,
} from './temporalPreservationEvidenceCollection.js';
import {
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
  OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
  writeObjectIdentityEvidenceCollectionReport,
} from './objectIdentityEvidenceCollection.js';
import {
  EVIDENCE_VALIDATION_INTEGRATION_PASS_VERDICT,
  EVIDENCE_VALIDATION_INTEGRATION_PHASE,
  EVIDENCE_VALIDATION_INTEGRATION_REPORT_PATH,
  writeEvidenceValidationIntegrationReport,
} from './evidenceValidationIntegration.js';
import {
  GPU_AUTHORIZATION_REVIEW_PASS_VERDICT,
  GPU_AUTHORIZATION_REVIEW_PHASE,
  GPU_AUTHORIZATION_REVIEW_REPORT_PATH,
  writeGpuAuthorizationReviewReport,
} from './gpuAuthorizationReview.js';
import {
  EVIDENCE_COLLECTION_EXECUTION_PLANNING_PASS_VERDICT,
  EVIDENCE_COLLECTION_EXECUTION_PLANNING_PHASE,
  EVIDENCE_COLLECTION_EXECUTION_READINESS_PATH,
  writeEvidenceCollectionExecutionPlanningReport,
} from './evidenceCollectionExecutionPlanning.js';
import {
  EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PASS_VERDICT,
  EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PHASE,
  EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_READINESS_PATH,
  writeEvidenceCollectionExecutionProtocolReport,
} from './evidenceCollectionExecutionProtocol.js';
import {
  EVIDENCE_MATERIALIZATION_PROTOCOL_PASS_VERDICT,
  EVIDENCE_MATERIALIZATION_PROTOCOL_PHASE,
  EVIDENCE_MATERIALIZATION_READINESS_PATH,
  writeEvidenceMaterializationProtocolReport,
} from './evidenceMaterializationProtocol.js';

const MOVIE_RECONSTRUCTION_BINDING = {
  capability_id: 'cap_movie_reconstruction',
  domain_id: 'movie_reconstruction',
} as const;

export type VerticalAiFeatureBinding = {
  inventory_ref: string;
  name: string;
  semantic_purpose: string;
  capability_id: string;
  domain_id: string;
};

export type VerticalAiImplementationCandidate = {
  candidate_id: string;
  plan_phase: string;
  feature_phase: string;
  title: string;
  priority: number;
  pass_verdict: string;
  report_path: string;
  binding: VerticalAiFeatureBinding;
  execute: (root: string) => { passed: boolean; verdict: string; reportPath: string | null };
};

export const VERTICAL_AI_IMPLEMENTATION_CANDIDATES: VerticalAiImplementationCandidate[] = [
  {
    candidate_id: 'numerical_dna_foundation',
    plan_phase: 'PHASE-VERTICAL-AI-FEATURE-INCREMENT-V1',
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_PHASE,
    title: 'Source Video Numerical DNA Foundation',
    priority: 100,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaFoundation.ts',
      name: 'sourceVideoNumericalDnaFoundation',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: source video numerical DNA foundation',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaFoundationReport(root);
      return {
        passed: report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_FOUNDATION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'numerical_dna_audit',
    plan_phase: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PHASE,
    title: 'Source Video Numerical DNA Audit',
    priority: 90,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaAudit.ts',
      name: 'sourceVideoNumericalDnaAudit',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: source video numerical DNA audit',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaAuditReport(root);
      return {
        passed: report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_AUDIT_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'numerical_dna_extraction_design',
    plan_phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PHASE,
    title: 'Source Video Numerical DNA Extraction Design',
    priority: 80,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaExtractionDesign.ts',
      name: 'sourceVideoNumericalDnaExtractionDesign',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: numerical DNA extraction design',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaExtractionDesignReport(root);
      return {
        passed:
          report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_EXTRACTION_DESIGN_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'numerical_dna_mve_extraction',
    plan_phase: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PHASE,
    title: 'Source Video Numerical DNA MVE Extraction',
    priority: 70,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaMveExtraction.ts',
      name: 'sourceVideoNumericalDnaMveExtraction',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: minimum viable numerical DNA extraction',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaMveExtractionReport(root);
      return {
        passed: report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_MVE_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_MVE_EXTRACTION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'numerical_dna_full_extraction',
    plan_phase: SOURCE_VIDEO_NUMERICAL_DNA_FULL_PHASE,
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_FULL_PHASE,
    title: 'Source Video Numerical DNA Full Extraction',
    priority: 60,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_FULL_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXTRACTION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaFullExtraction.ts',
      name: 'sourceVideoNumericalDnaFullExtraction',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: full numerical DNA extraction',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaFullExtractionReport(root);
      return {
        passed:
          report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_FULL_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_FULL_EXTRACTION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'numerical_dna_validation',
    plan_phase: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
    feature_phase: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PHASE,
    title: 'Source Video Numerical DNA Validation',
    priority: 50,
    pass_verdict: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT,
    report_path: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/sourceVideoNumericalDnaValidation.ts',
      name: 'sourceVideoNumericalDnaValidation',
      semantic_purpose:
        'Engine module for cap_source_video_analysis: numerical DNA validation gate',
      capability_id: 'cap_source_video_analysis',
      domain_id: 'source_video_analysis',
    },
    execute: (root) => {
      const report = writeSourceVideoNumericalDnaValidationReport(root);
      return {
        passed:
          report.final_verdict === SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: SOURCE_VIDEO_NUMERICAL_DNA_VALIDATION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'movie_reconstruction_conditioning_audit',
    plan_phase: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE,
    feature_phase: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PHASE,
    title: 'Movie Reconstruction Conditioning Audit',
    priority: 45,
    pass_verdict: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT,
    report_path: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH,
    binding: {
      inventory_ref: 'services/movieReconstructionConditioningAudit.ts',
      name: 'movieReconstructionConditioningAudit',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: movie reconstruction conditioning audit',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeMovieReconstructionConditioningAuditReport(root);
      return {
        passed:
          report.final_verdict === MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: MOVIE_RECONSTRUCTION_CONDITIONING_AUDIT_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'movie_reconstruction_conditioning_design',
    plan_phase: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
    feature_phase: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PHASE,
    title: 'Movie Reconstruction Conditioning Design',
    priority: 44,
    pass_verdict: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT,
    report_path: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH,
    binding: {
      inventory_ref: 'services/movieReconstructionConditioningDesign.ts',
      name: 'movieReconstructionConditioningDesign',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: movie reconstruction conditioning design',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeMovieReconstructionConditioningDesignReport(root);
      return {
        passed:
          report.final_verdict === MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: MOVIE_RECONSTRUCTION_CONDITIONING_DESIGN_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'movie_reconstruction_conditioning_architecture',
    plan_phase: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
    feature_phase: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PHASE,
    title: 'Movie Reconstruction Conditioning Architecture Decision',
    priority: 43,
    pass_verdict: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT,
    report_path: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/movieReconstructionConditioningArchitectureDecision.ts',
      name: 'movieReconstructionConditioningArchitectureDecision',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: conditioning architecture decision',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeMovieReconstructionConditioningArchitectureDecisionReport(root);
      return {
        passed:
          report.final_verdict === MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: MOVIE_RECONSTRUCTION_CONDITIONING_ARCHITECTURE_DECISION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'conditioning_map_export',
    plan_phase: CONDITIONING_MAP_EXPORT_PHASE,
    feature_phase: CONDITIONING_MAP_EXPORT_PHASE,
    title: 'Conditioning Map Export',
    priority: 42,
    pass_verdict: CONDITIONING_MAP_EXPORT_PASS_VERDICT,
    report_path: CONDITIONING_MAP_EXPORT_REPORT_PATH,
    binding: {
      inventory_ref: 'services/conditioningMapExport.ts',
      name: 'conditioningMapExport',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: conditioning map export bundle',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeConditioningMapExportReport(root);
      return {
        passed:
          report.final_verdict === CONDITIONING_MAP_EXPORT_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: CONDITIONING_MAP_EXPORT_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'conditioning_backend_adapter',
    plan_phase: CONDITIONING_BACKEND_ADAPTER_PHASE,
    feature_phase: CONDITIONING_BACKEND_ADAPTER_PHASE,
    title: 'Conditioning Backend Adapter Design',
    priority: 41,
    pass_verdict: CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT,
    report_path: CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
    binding: {
      inventory_ref: 'services/conditioningBackendAdapterDesign.ts',
      name: 'conditioningBackendAdapterDesign',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: conditioning backend adapter design',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeConditioningBackendAdapterReport(root);
      return {
        passed:
          report.final_verdict === CONDITIONING_BACKEND_ADAPTER_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: CONDITIONING_BACKEND_ADAPTER_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'adapter_translation_validation',
    plan_phase: ADAPTER_TRANSLATION_VALIDATION_PHASE,
    feature_phase: ADAPTER_TRANSLATION_VALIDATION_PHASE,
    title: 'Adapter Translation Validation',
    priority: 39,
    pass_verdict: ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT,
    report_path: ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/adapterTranslationValidation.ts',
      name: 'adapterTranslationValidation',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: adapter translation validation',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeAdapterTranslationValidationReport(root);
      return {
        passed:
          report.final_verdict === ADAPTER_TRANSLATION_VALIDATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ADAPTER_TRANSLATION_VALIDATION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'conditioning_preservation_gap_analysis',
    plan_phase: CONDITIONING_PRESERVATION_GAP_ANALYSIS_PHASE,
    feature_phase: CONDITIONING_PRESERVATION_GAP_ANALYSIS_PHASE,
    title: 'Conditioning Preservation Gap Analysis',
    priority: 38,
    pass_verdict: CONDITIONING_PRESERVATION_GAP_ANALYSIS_PASS_VERDICT,
    report_path: CONDITIONING_PRESERVATION_GAP_REPORT_PATH,
    binding: {
      inventory_ref: 'services/conditioningPreservationGapAnalysis.ts',
      name: 'conditioningPreservationGapAnalysis',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: conditioning preservation gap analysis',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeConditioningPreservationGapReport(root);
      return {
        passed:
          report.final_verdict === CONDITIONING_PRESERVATION_GAP_ANALYSIS_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: CONDITIONING_PRESERVATION_GAP_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'environment_identity_strategy',
    plan_phase: ENVIRONMENT_IDENTITY_STRATEGY_PHASE,
    feature_phase: ENVIRONMENT_IDENTITY_STRATEGY_PHASE,
    title: 'Environment Identity Strategy',
    priority: 37,
    pass_verdict: ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT,
    report_path: ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH,
    binding: {
      inventory_ref: 'services/environmentIdentityStrategy.ts',
      name: 'environmentIdentityStrategy',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: environment identity strategy',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEnvironmentIdentityStrategyReport(root);
      return {
        passed:
          report.final_verdict === ENVIRONMENT_IDENTITY_STRATEGY_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ENVIRONMENT_IDENTITY_STRATEGY_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'temporal_preservation_strategy',
    plan_phase: TEMPORAL_PRESERVATION_STRATEGY_PHASE,
    feature_phase: TEMPORAL_PRESERVATION_STRATEGY_PHASE,
    title: 'Temporal Preservation Strategy',
    priority: 36,
    pass_verdict: TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT,
    report_path: TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH,
    binding: {
      inventory_ref: 'services/temporalPreservationStrategy.ts',
      name: 'temporalPreservationStrategy',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: temporal preservation strategy',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeTemporalPreservationStrategyReport(root);
      return {
        passed:
          report.final_verdict === TEMPORAL_PRESERVATION_STRATEGY_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: TEMPORAL_PRESERVATION_STRATEGY_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'object_identity_strategy',
    plan_phase: OBJECT_IDENTITY_STRATEGY_PHASE,
    feature_phase: OBJECT_IDENTITY_STRATEGY_PHASE,
    title: 'Object Identity Strategy',
    priority: 35,
    pass_verdict: OBJECT_IDENTITY_STRATEGY_PASS_VERDICT,
    report_path: OBJECT_IDENTITY_STRATEGY_REPORT_PATH,
    binding: {
      inventory_ref: 'services/objectIdentityStrategy.ts',
      name: 'objectIdentityStrategy',
      semantic_purpose: 'Engine module for cap_movie_reconstruction: object identity strategy',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeObjectIdentityStrategyReport(root);
      return {
        passed:
          report.final_verdict === OBJECT_IDENTITY_STRATEGY_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: OBJECT_IDENTITY_STRATEGY_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'image_app_map_ingestion',
    plan_phase: IMAGE_APP_MAP_INGESTION_PHASE,
    feature_phase: IMAGE_APP_MAP_INGESTION_PHASE,
    title: 'Image App Map Ingestion',
    priority: 40,
    pass_verdict: IMAGE_APP_MAP_INGESTION_PASS_VERDICT,
    report_path: IMAGE_APP_MAP_INGESTION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/imageAppMapIngestion.ts',
      name: 'imageAppMapIngestion',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: image app map ingestion specification',
      capability_id: 'cap_movie_reconstruction',
      domain_id: 'movie_reconstruction',
    },
    execute: (root) => {
      const report = writeImageAppMapIngestionReport(root);
      return {
        passed:
          report.final_verdict === IMAGE_APP_MAP_INGESTION_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: IMAGE_APP_MAP_INGESTION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'backend_runtime_bridge',
    plan_phase: BACKEND_RUNTIME_BRIDGE_PHASE,
    feature_phase: BACKEND_RUNTIME_BRIDGE_PHASE,
    title: 'Backend Runtime Bridge',
    priority: 33,
    pass_verdict: BACKEND_RUNTIME_BRIDGE_PASS_VERDICT,
    report_path: BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
    binding: {
      inventory_ref: 'services/backendRuntimeBridge.ts',
      name: 'backendRuntimeBridge',
      semantic_purpose: 'Engine module for cap_movie_reconstruction: backend runtime bridge',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeBackendRuntimeBridgeReport(root);
      return {
        passed:
          report.final_verdict === BACKEND_RUNTIME_BRIDGE_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: BACKEND_RUNTIME_BRIDGE_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'temporal_preservation_binding',
    plan_phase: TEMPORAL_PRESERVATION_BINDING_PHASE,
    feature_phase: TEMPORAL_PRESERVATION_BINDING_PHASE,
    title: 'Temporal Preservation Binding',
    priority: 32,
    pass_verdict: TEMPORAL_PRESERVATION_BINDING_PASS_VERDICT,
    report_path: TEMPORAL_PRESERVATION_BINDING_REPORT_PATH,
    binding: {
      inventory_ref: 'services/temporalPreservationBinding.ts',
      name: 'temporalPreservationBinding',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: temporal preservation binding',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeTemporalPreservationBindingReport(root);
      return {
        passed:
          report.final_verdict === TEMPORAL_PRESERVATION_BINDING_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: TEMPORAL_PRESERVATION_BINDING_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'environment_identity_binding',
    plan_phase: ENVIRONMENT_IDENTITY_BINDING_PHASE,
    feature_phase: ENVIRONMENT_IDENTITY_BINDING_PHASE,
    title: 'Environment Identity Binding',
    priority: 31,
    pass_verdict: ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT,
    report_path: ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH,
    binding: {
      inventory_ref: 'services/environmentIdentityBinding.ts',
      name: 'environmentIdentityBinding',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: environment identity binding',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEnvironmentIdentityBindingReport(root);
      return {
        passed:
          report.final_verdict === ENVIRONMENT_IDENTITY_BINDING_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ENVIRONMENT_IDENTITY_BINDING_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'object_identity_binding',
    plan_phase: OBJECT_IDENTITY_BINDING_PHASE,
    feature_phase: OBJECT_IDENTITY_BINDING_PHASE,
    title: 'Object Identity Binding',
    priority: 30,
    pass_verdict: OBJECT_IDENTITY_BINDING_PASS_VERDICT,
    report_path: OBJECT_IDENTITY_BINDING_REPORT_PATH,
    binding: {
      inventory_ref: 'services/objectIdentityBinding.ts',
      name: 'objectIdentityBinding',
      semantic_purpose: 'Engine module for cap_movie_reconstruction: object identity binding',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeObjectIdentityBindingReport(root);
      return {
        passed:
          report.final_verdict === OBJECT_IDENTITY_BINDING_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: OBJECT_IDENTITY_BINDING_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'gpu_conditioning_capability_audit',
    plan_phase: GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE,
    feature_phase: GPU_CONDITIONING_CAPABILITY_AUDIT_PHASE,
    title: 'GPU Conditioning Capability Audit',
    priority: 29,
    pass_verdict: GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT,
    report_path: GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
    binding: {
      inventory_ref: 'services/gpuConditioningCapabilityAudit.ts',
      name: 'gpuConditioningCapabilityAudit',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: GPU conditioning capability audit',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeGpuConditioningCapabilityAuditReport(root);
      return {
        passed:
          report.final_verdict === GPU_CONDITIONING_CAPABILITY_AUDIT_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: GPU_CONDITIONING_CAPABILITY_AUDIT_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'video_conditioning_backend',
    plan_phase: VIDEO_CONDITIONING_BACKEND_PHASE,
    feature_phase: VIDEO_CONDITIONING_BACKEND_PHASE,
    title: 'Video Conditioning Backend',
    priority: 29,
    pass_verdict: VIDEO_CONDITIONING_BACKEND_PASS_VERDICT,
    report_path: VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
    binding: {
      inventory_ref: 'services/videoConditioningBackend.ts',
      name: 'videoConditioningBackend',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: video conditioning backend requirements',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeVideoConditioningBackendReport(root);
      return {
        passed:
          report.final_verdict === VIDEO_CONDITIONING_BACKEND_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: VIDEO_CONDITIONING_BACKEND_REQUIREMENTS_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'video_runtime_enforcement',
    plan_phase: VIDEO_RUNTIME_ENFORCEMENT_PHASE,
    feature_phase: VIDEO_RUNTIME_ENFORCEMENT_PHASE,
    title: 'Video Runtime Enforcement',
    priority: 28,
    pass_verdict: VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT,
    report_path: RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH,
    binding: {
      inventory_ref: 'services/videoRuntimeEnforcement.ts',
      name: 'videoRuntimeEnforcement',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: video runtime enforcement protocol',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeVideoRuntimeEnforcementReport(root);
      return {
        passed:
          report.final_verdict === VIDEO_RUNTIME_ENFORCEMENT_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: RUNTIME_ENFORCEMENT_READINESS_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'gpu_validation_dataset',
    plan_phase: GPU_VALIDATION_DATASET_PHASE,
    feature_phase: GPU_VALIDATION_DATASET_PHASE,
    title: 'GPU Validation Dataset',
    priority: 27,
    pass_verdict: GPU_VALIDATION_DATASET_PASS_VERDICT,
    report_path: GPU_VALIDATION_DATASET_REPORT_PATH,
    binding: {
      inventory_ref: 'services/gpuValidationDataset.ts',
      name: 'gpuValidationDataset',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: GPU validation dataset definition',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeGpuValidationDatasetReport(root);
      return {
        passed:
          report.final_verdict === GPU_VALIDATION_DATASET_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: GPU_VALIDATION_DATASET_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'gpu_validation_campaign',
    plan_phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    feature_phase: GPU_VALIDATION_CAMPAIGN_PHASE,
    title: 'GPU Validation Campaign',
    priority: 26,
    pass_verdict: GPU_VALIDATION_CAMPAIGN_PASS_VERDICT,
    report_path: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
    binding: {
      inventory_ref: 'services/gpuValidationCampaign.ts',
      name: 'gpuValidationCampaign',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: GPU validation campaign planning',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeGpuValidationCampaignReport(root);
      return {
        passed:
          report.final_verdict === GPU_VALIDATION_CAMPAIGN_PASS_VERDICT && report.validation_passed,
        verdict: report.final_verdict,
        reportPath: GPU_VALIDATION_CAMPAIGN_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'environment_identity_gpu_validation',
    plan_phase: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
    feature_phase: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PHASE,
    title: 'Environment Identity GPU Validation',
    priority: 25,
    pass_verdict: ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
    report_path: ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/environmentIdentityGpuValidation.ts',
      name: 'environmentIdentityGpuValidation',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: environment identity GPU validation',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEnvironmentIdentityGpuValidationReport(root);
      return {
        passed:
          report.final_verdict === ENVIRONMENT_IDENTITY_GPU_VALIDATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ENVIRONMENT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'temporal_preservation_gpu_validation',
    plan_phase: TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
    feature_phase: TEMPORAL_PRESERVATION_GPU_VALIDATION_PHASE,
    title: 'Temporal Preservation GPU Validation',
    priority: 24,
    pass_verdict: TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT,
    report_path: TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/temporalPreservationGpuValidation.ts',
      name: 'temporalPreservationGpuValidation',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: temporal preservation GPU validation',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeTemporalPreservationGpuValidationReport(root);
      return {
        passed:
          report.final_verdict === TEMPORAL_PRESERVATION_GPU_VALIDATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: TEMPORAL_PRESERVATION_GPU_VALIDATION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'object_identity_gpu_validation',
    plan_phase: OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
    feature_phase: OBJECT_IDENTITY_GPU_VALIDATION_PHASE,
    title: 'Object Identity GPU Validation',
    priority: 23,
    pass_verdict: OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT,
    report_path: OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/objectIdentityGpuValidation.ts',
      name: 'objectIdentityGpuValidation',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: object identity GPU validation',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeObjectIdentityGpuValidationReport(root);
      return {
        passed:
          report.final_verdict === OBJECT_IDENTITY_GPU_VALIDATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: OBJECT_IDENTITY_GPU_VALIDATION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'gpu_validation_integration',
    plan_phase: GPU_VALIDATION_INTEGRATION_PHASE,
    feature_phase: GPU_VALIDATION_INTEGRATION_PHASE,
    title: 'GPU Validation Integration',
    priority: 22,
    pass_verdict: GPU_VALIDATION_INTEGRATION_PASS_VERDICT,
    report_path: GPU_VALIDATION_MASTER_READINESS_PATH,
    binding: {
      inventory_ref: 'services/gpuValidationIntegration.ts',
      name: 'gpuValidationIntegration',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: GPU validation integration master plan',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeGpuValidationIntegrationReport(root);
      return {
        passed:
          report.final_verdict === GPU_VALIDATION_INTEGRATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: GPU_VALIDATION_MASTER_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'environment_identity_evidence',
    plan_phase: ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
    feature_phase: ENVIRONMENT_IDENTITY_EVIDENCE_PHASE,
    title: 'Environment Identity Evidence',
    priority: 21,
    pass_verdict: ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT,
    report_path: ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
    binding: {
      inventory_ref: 'services/environmentIdentityEvidence.ts',
      name: 'environmentIdentityEvidence',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: environment identity evidence definition',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEnvironmentIdentityEvidenceReport(root);
      return {
        passed:
          report.final_verdict === ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'temporal_preservation_evidence',
    plan_phase: TEMPORAL_PRESERVATION_EVIDENCE_PHASE,
    feature_phase: TEMPORAL_PRESERVATION_EVIDENCE_PHASE,
    title: 'Temporal Preservation Evidence',
    priority: 20,
    pass_verdict: TEMPORAL_PRESERVATION_EVIDENCE_PASS_VERDICT,
    report_path: TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
    binding: {
      inventory_ref: 'services/temporalPreservationEvidence.ts',
      name: 'temporalPreservationEvidence',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: temporal preservation evidence definition',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeTemporalPreservationEvidenceReport(root);
      return {
        passed:
          report.final_verdict === TEMPORAL_PRESERVATION_EVIDENCE_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'object_identity_evidence',
    plan_phase: OBJECT_IDENTITY_EVIDENCE_PHASE,
    feature_phase: OBJECT_IDENTITY_EVIDENCE_PHASE,
    title: 'Object Identity Evidence',
    priority: 19,
    pass_verdict: OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT,
    report_path: OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
    binding: {
      inventory_ref: 'services/objectIdentityEvidence.ts',
      name: 'objectIdentityEvidence',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: object identity evidence definition',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeObjectIdentityEvidenceReport(root);
      return {
        passed:
          report.final_verdict === OBJECT_IDENTITY_EVIDENCE_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: OBJECT_IDENTITY_EVIDENCE_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'evidence_layer_readiness_review',
    plan_phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    feature_phase: EVIDENCE_LAYER_READINESS_REVIEW_PHASE,
    title: 'Evidence Layer Readiness Review',
    priority: 18,
    pass_verdict: EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT,
    report_path: EVIDENCE_LAYER_READINESS_REPORT_PATH,
    binding: {
      inventory_ref: 'services/evidenceLayerReadinessReview.ts',
      name: 'evidenceLayerReadinessReview',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: evidence layer readiness review',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEvidenceLayerReadinessReviewReport(root);
      return {
        passed:
          report.final_verdict === EVIDENCE_LAYER_READINESS_REVIEW_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: EVIDENCE_LAYER_READINESS_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'environment_identity_evidence_collection',
    plan_phase: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    feature_phase: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    title: 'Environment Identity Evidence Collection',
    priority: 17,
    pass_verdict: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
    report_path: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/environmentIdentityEvidenceCollection.ts',
      name: 'environmentIdentityEvidenceCollection',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: environment identity evidence collection',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEnvironmentIdentityEvidenceCollectionReport(root);
      return {
        passed:
          report.final_verdict === ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: ENVIRONMENT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'temporal_preservation_evidence_collection',
    plan_phase: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
    feature_phase: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PHASE,
    title: 'Temporal Preservation Evidence Collection',
    priority: 16,
    pass_verdict: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT,
    report_path: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/temporalPreservationEvidenceCollection.ts',
      name: 'temporalPreservationEvidenceCollection',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: temporal preservation evidence collection',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeTemporalPreservationEvidenceCollectionReport(root);
      return {
        passed:
          report.final_verdict === TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: TEMPORAL_PRESERVATION_EVIDENCE_COLLECTION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'object_identity_evidence_collection',
    plan_phase: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    feature_phase: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PHASE,
    title: 'Object Identity Evidence Collection',
    priority: 15,
    pass_verdict: OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT,
    report_path: OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/objectIdentityEvidenceCollection.ts',
      name: 'objectIdentityEvidenceCollection',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: object identity evidence collection',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeObjectIdentityEvidenceCollectionReport(root);
      return {
        passed:
          report.final_verdict === OBJECT_IDENTITY_EVIDENCE_COLLECTION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: OBJECT_IDENTITY_EVIDENCE_COLLECTION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'evidence_validation_integration',
    plan_phase: EVIDENCE_VALIDATION_INTEGRATION_PHASE,
    feature_phase: EVIDENCE_VALIDATION_INTEGRATION_PHASE,
    title: 'Evidence Validation Integration',
    priority: 14,
    pass_verdict: EVIDENCE_VALIDATION_INTEGRATION_PASS_VERDICT,
    report_path: EVIDENCE_VALIDATION_INTEGRATION_REPORT_PATH,
    binding: {
      inventory_ref: 'services/evidenceValidationIntegration.ts',
      name: 'evidenceValidationIntegration',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: cross-channel evidence validation integration',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEvidenceValidationIntegrationReport(root);
      return {
        passed:
          report.final_verdict === EVIDENCE_VALIDATION_INTEGRATION_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: EVIDENCE_VALIDATION_INTEGRATION_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'gpu_authorization_review',
    plan_phase: GPU_AUTHORIZATION_REVIEW_PHASE,
    feature_phase: GPU_AUTHORIZATION_REVIEW_PHASE,
    title: 'GPU Authorization Review',
    priority: 13,
    pass_verdict: GPU_AUTHORIZATION_REVIEW_PASS_VERDICT,
    report_path: GPU_AUTHORIZATION_REVIEW_REPORT_PATH,
    binding: {
      inventory_ref: 'services/gpuAuthorizationReview.ts',
      name: 'gpuAuthorizationReview',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: GPU authorization readiness review',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeGpuAuthorizationReviewReport(root);
      return {
        passed:
          report.final_verdict === GPU_AUTHORIZATION_REVIEW_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: GPU_AUTHORIZATION_REVIEW_REPORT_PATH,
      };
    },
  },
  {
    candidate_id: 'evidence_collection_execution_planning',
    plan_phase: EVIDENCE_COLLECTION_EXECUTION_PLANNING_PHASE,
    feature_phase: EVIDENCE_COLLECTION_EXECUTION_PLANNING_PHASE,
    title: 'Evidence Collection Execution Planning',
    priority: 12,
    pass_verdict: EVIDENCE_COLLECTION_EXECUTION_PLANNING_PASS_VERDICT,
    report_path: EVIDENCE_COLLECTION_EXECUTION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/evidenceCollectionExecutionPlanning.ts',
      name: 'evidenceCollectionExecutionPlanning',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: evidence collection execution planning',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEvidenceCollectionExecutionPlanningReport(root);
      return {
        passed:
          report.final_verdict === EVIDENCE_COLLECTION_EXECUTION_PLANNING_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: EVIDENCE_COLLECTION_EXECUTION_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'evidence_collection_execution_protocol',
    plan_phase: EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PHASE,
    feature_phase: EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PHASE,
    title: 'Evidence Collection Execution Protocol',
    priority: 11,
    pass_verdict: EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PASS_VERDICT,
    report_path: EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_READINESS_PATH,
    binding: {
      inventory_ref: 'services/evidenceCollectionExecutionProtocol.ts',
      name: 'evidenceCollectionExecutionProtocol',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: evidence collection execution protocol',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEvidenceCollectionExecutionProtocolReport(root);
      return {
        passed:
          report.final_verdict === EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: EVIDENCE_COLLECTION_EXECUTION_PROTOCOL_READINESS_PATH,
      };
    },
  },
  {
    candidate_id: 'evidence_materialization_protocol',
    plan_phase: EVIDENCE_MATERIALIZATION_PROTOCOL_PHASE,
    feature_phase: EVIDENCE_MATERIALIZATION_PROTOCOL_PHASE,
    title: 'Evidence Materialization Protocol',
    priority: 10,
    pass_verdict: EVIDENCE_MATERIALIZATION_PROTOCOL_PASS_VERDICT,
    report_path: EVIDENCE_MATERIALIZATION_READINESS_PATH,
    binding: {
      inventory_ref: 'services/evidenceMaterializationProtocol.ts',
      name: 'evidenceMaterializationProtocol',
      semantic_purpose:
        'Engine module for cap_movie_reconstruction: evidence materialization protocol',
      ...MOVIE_RECONSTRUCTION_BINDING,
    },
    execute: (root) => {
      const report = writeEvidenceMaterializationProtocolReport(root);
      return {
        passed:
          report.final_verdict === EVIDENCE_MATERIALIZATION_PROTOCOL_PASS_VERDICT &&
          report.validation_passed,
        verdict: report.final_verdict,
        reportPath: EVIDENCE_MATERIALIZATION_READINESS_PATH,
      };
    },
  },
];

export const VERTICAL_AI_NUMERICAL_DNA_CANDIDATES = VERTICAL_AI_IMPLEMENTATION_CANDIDATES.filter(
  (candidate) => candidate.candidate_id.startsWith('numerical_dna_')
);

const VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH =
  'datasets/stage7/vertical_ai_implementation_v1/vertical-ai-implementation-validation-v1.json' as const;

const CANDIDATE_ALTERNATE_REPORT_PATHS: Partial<Record<string, string[]>> = {
  gpu_validation_integration: [GPU_VALIDATION_MASTER_READINESS_PATH],
};

type ReportCompletionState = {
  final_verdict?: string;
  validation_passed?: boolean;
};

export type CandidateVerifiedRepositoryTruth = {
  candidate_id: string;
  primary_report_path: string;
  primary_verdict: string | null;
  verified_verdict: string | null;
  verified_source: 'primary' | 'alternate' | 'validated_record' | null;
  satisfied: boolean;
  materialized: boolean;
  repository_incomplete: boolean;
};

function writeJson(root: string, rel: string, value: unknown): void {
  fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  fs.writeFileSync(path.join(root, rel), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function readReportState(root: string, reportPath: string): ReportCompletionState | null {
  if (!fs.existsSync(path.join(root, reportPath))) {
    return null;
  }
  return JSON.parse(fs.readFileSync(path.join(root, reportPath), 'utf8')) as ReportCompletionState;
}

function isRepositoryIncomplete(
  root: string,
  candidate: VerticalAiImplementationCandidate,
  alternatePaths: string[]
): boolean {
  for (const reportPath of [candidate.report_path, ...alternatePaths]) {
    const report = readReportState(root, reportPath);
    if (!report) {
      continue;
    }
    if (
      report.final_verdict &&
      report.final_verdict !== candidate.pass_verdict &&
      report.final_verdict.includes('FAIL')
    ) {
      return true;
    }
    if (report.validation_passed === false && report.final_verdict !== candidate.pass_verdict) {
      return true;
    }
  }
  return false;
}

function loadValidatedImplementationRecord(root: string): {
  plan_phase: string;
  expected_pass_verdict: string;
  validated: boolean;
} | null {
  if (!fs.existsSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH))) {
    return null;
  }
  const record = JSON.parse(
    fs.readFileSync(path.join(root, VERTICAL_AI_IMPLEMENTATION_VALIDATION_V1_PATH), 'utf8')
  ) as {
    plan_phase?: string;
    expected_pass_verdict?: string;
    validated?: boolean;
  };
  if (!record.plan_phase || !record.expected_pass_verdict || record.validated !== true) {
    return null;
  }
  return {
    plan_phase: record.plan_phase,
    expected_pass_verdict: record.expected_pass_verdict,
    validated: true,
  };
}

export function materializeVerifiedRepositoryTruthForVerticalAiSelection(
  projectRoot?: string
): {
  materialized_count: number;
  entries: CandidateVerifiedRepositoryTruth[];
  fingerprint: string;
} {
  const root = resolveProjectRoot(projectRoot);
  const validatedRecord = loadValidatedImplementationRecord(root);
  let materialized_count = 0;

  const entries = VERTICAL_AI_IMPLEMENTATION_CANDIDATES.map((candidate) => {
    const alternatePaths = CANDIDATE_ALTERNATE_REPORT_PATHS[candidate.candidate_id] ?? [];
    const primary = readReportState(root, candidate.report_path);
    const repositoryIncomplete = isRepositoryIncomplete(root, candidate, alternatePaths);
    let verified_verdict = primary?.final_verdict ?? null;
    let verified_source: CandidateVerifiedRepositoryTruth['verified_source'] =
      verified_verdict === candidate.pass_verdict ? 'primary' : null;
    let materialized = false;

    if (!verified_source) {
      for (const alternatePath of alternatePaths) {
        const alternate = readReportState(root, alternatePath);
        if (alternate?.final_verdict === candidate.pass_verdict) {
          verified_verdict = alternate.final_verdict;
          verified_source = 'alternate';
          if (
            fs.existsSync(path.join(root, candidate.report_path)) &&
            primary?.final_verdict !== candidate.pass_verdict
          ) {
            const primaryReport = JSON.parse(
              fs.readFileSync(path.join(root, candidate.report_path), 'utf8')
            ) as Record<string, unknown>;
            primaryReport.final_verdict = alternate.final_verdict;
            primaryReport.validation_passed = alternate.validation_passed ?? true;
            writeJson(root, candidate.report_path, primaryReport);
            materialized = true;
            materialized_count += 1;
          }
          break;
        }
      }
    }

    if (
      !verified_source &&
      validatedRecord &&
      validatedRecord.plan_phase === candidate.plan_phase &&
      validatedRecord.expected_pass_verdict === candidate.pass_verdict &&
      !repositoryIncomplete
    ) {
      verified_verdict = validatedRecord.expected_pass_verdict;
      verified_source = 'validated_record';
    }

    const satisfied =
      verified_verdict === candidate.pass_verdict && !repositoryIncomplete;

    return {
      candidate_id: candidate.candidate_id,
      primary_report_path: candidate.report_path,
      primary_verdict: primary?.final_verdict ?? null,
      verified_verdict,
      verified_source,
      satisfied,
      materialized,
      repository_incomplete: repositoryIncomplete,
    };
  });

  const fingerprint = entries
    .map(
      (entry) =>
        `${entry.candidate_id}:${entry.verified_verdict ?? 'pending'}:${entry.verified_source ?? 'none'}`
    )
    .join('|');

  return { materialized_count, entries, fingerprint };
}

export type VerticalAiDiscoveryEvidenceSource =
  | 'repository_truth'
  | 'project_truth'
  | 'goal_truth'
  | 'operational_constraints'
  | 'development_intelligence';

export type VerticalAiDiscoveryInput = {
  repositoryTruthFingerprint: string;
  projectTruthFingerprint: string;
  goalTruthFingerprint: string;
  activeGoalIds: string[];
  operationalConstraintsRespected: boolean;
  developmentPlanId: string | null;
  inventoryExists: boolean;
};

export type DiscoveredVerticalAiCandidate = {
  candidate_id: string;
  plan_phase: string;
  evidence_score: number;
  evidence_sources: VerticalAiDiscoveryEvidenceSource[];
  repository_verdict: string | null;
  dependencies_satisfied: boolean;
  evidence_supports_implementation: boolean;
};

export function discoverEvidenceBasedVerticalAiImplementationCandidates(
  materialization: ReturnType<typeof materializeVerifiedRepositoryTruthForVerticalAiSelection>,
  discoveryInput: VerticalAiDiscoveryInput
): DiscoveredVerticalAiCandidate[] {
  const completionById = new Map(
    materialization.entries.map((entry) => [entry.candidate_id, entry])
  );
  const discovered: DiscoveredVerticalAiCandidate[] = [];

  for (let index = 0; index < VERTICAL_AI_IMPLEMENTATION_CANDIDATES.length; index++) {
    const candidate = VERTICAL_AI_IMPLEMENTATION_CANDIDATES[index];
    const completion = completionById.get(candidate.candidate_id);
    if (completion?.satisfied) {
      continue;
    }

    const dependencies_satisfied = VERTICAL_AI_IMPLEMENTATION_CANDIDATES.slice(0, index).every(
      (prior) => completionById.get(prior.candidate_id)?.satisfied === true
    );

    const evidence_sources: VerticalAiDiscoveryEvidenceSource[] = [];
    let evidence_score = candidate.priority;

    if (!completion?.satisfied) {
      evidence_sources.push('repository_truth');
    }
    if (discoveryInput.inventoryExists) {
      evidence_sources.push('project_truth');
      evidence_score += 1;
    }
    if (
      discoveryInput.activeGoalIds.includes('goal_ghibli_production_pipeline') ||
      discoveryInput.activeGoalIds.includes('goal_production_runtime')
    ) {
      evidence_sources.push('goal_truth');
      if (candidate.binding.domain_id === 'movie_reconstruction') {
        evidence_score += 10;
      }
    }
    if (discoveryInput.operationalConstraintsRespected) {
      evidence_sources.push('operational_constraints');
    }
    if (discoveryInput.developmentPlanId) {
      evidence_sources.push('development_intelligence');
      evidence_score += 1;
    }

    const evidence_supports_implementation =
      dependencies_satisfied &&
      discoveryInput.operationalConstraintsRespected &&
      evidence_sources.includes('repository_truth') &&
      completion?.repository_incomplete !== true;

    if (evidence_supports_implementation) {
      discovered.push({
        candidate_id: candidate.candidate_id,
        plan_phase: candidate.plan_phase,
        evidence_score,
        evidence_sources,
        repository_verdict: completion?.verified_verdict ?? null,
        dependencies_satisfied,
        evidence_supports_implementation,
      });
    }
  }

  return discovered;
}

export function selectHighestValueVerticalAiImplementation(
  projectRoot?: string,
  discoveryInput?: VerticalAiDiscoveryInput
): {
  selected: VerticalAiImplementationCandidate | null;
  rationale: string;
  evaluated: Array<{ candidate_id: string; verdict: string | null; satisfied: boolean }>;
  materialization: ReturnType<typeof materializeVerifiedRepositoryTruthForVerticalAiSelection>;
  discovery: DiscoveredVerticalAiCandidate[];
  discovery_input: VerticalAiDiscoveryInput | null;
} {
  const root = resolveProjectRoot(projectRoot);
  const materialization = materializeVerifiedRepositoryTruthForVerticalAiSelection(root);
  const completionById = new Map(
    materialization.entries.map((entry) => [entry.candidate_id, entry])
  );

  const evaluated = VERTICAL_AI_IMPLEMENTATION_CANDIDATES.map((candidate) => {
    const completion = completionById.get(candidate.candidate_id);
    const verdict = completion?.verified_verdict ?? null;
    const satisfied = completion?.satisfied === true;
    return { candidate_id: candidate.candidate_id, verdict, satisfied };
  });

  const resolvedDiscoveryInput =
    discoveryInput ??
    ({
      repositoryTruthFingerprint: 'unknown',
      projectTruthFingerprint: 'unknown',
      goalTruthFingerprint: 'unknown',
      activeGoalIds: [],
      operationalConstraintsRespected: true,
      developmentPlanId: null,
      inventoryExists: fs.existsSync(
        path.join(root, 'datasets/repository_intelligence/project-entity-extraction-v1.json')
      ),
    } satisfies VerticalAiDiscoveryInput);

  const discovery = discoverEvidenceBasedVerticalAiImplementationCandidates(
    materialization,
    resolvedDiscoveryInput
  );

  const selected =
    discovery.length > 0
      ? (VERTICAL_AI_IMPLEMENTATION_CANDIDATES.find(
          (candidate) =>
            candidate.candidate_id ===
            discovery.reduce((best, entry) =>
              entry.evidence_score > best.evidence_score ? entry : best
            ).candidate_id
        ) ?? null)
      : null;

  const rationale = selected
    ? `Evidence-based highest-value implementation: ${selected.title} (${selected.plan_phase})`
    : discovery.length === 0
      ? 'No evidence-supported pending implementation candidate discovered from current truths'
      : 'All registered vertical AI implementation increments satisfied';

  return {
    selected,
    rationale,
    evaluated,
    materialization,
    discovery,
    discovery_input: discoveryInput ?? null,
  };
}

export function findVerticalAiCandidateByPlanPhase(
  planPhase: string
): VerticalAiImplementationCandidate | null {
  return (
    VERTICAL_AI_IMPLEMENTATION_CANDIDATES.find((candidate) => candidate.plan_phase === planPhase) ??
    null
  );
}
