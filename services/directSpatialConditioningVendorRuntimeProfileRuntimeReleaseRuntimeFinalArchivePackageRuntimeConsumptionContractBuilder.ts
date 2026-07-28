import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { resolveProjectRoot } from './projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  SPATIAL_FRAME,
  type ConditioningChannelId,
} from './directSpatialConditioningFoundationBuilder.js';
import {
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from './directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { SOURCE_IDS } from './numericalReconstructionExportBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage,
} from './directSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageBuilder.js';

/**
 * PHASE-DSC-186: Direct Spatial Conditioning vendor runtime profile runtime release
 * runtime final archive package runtime consumption contract.
 *
 * DESIGN ONLY / READ-ONLY / VENDOR NEUTRAL. PHASE-DSC-185 was a read-only
 * certification of the PHASE-DSC-184 Vendor Runtime Profile Runtime Release
 * Runtime Final Archive Package: it recorded a PASS verdict but created no
 * export, schema, or registry files of its own. This phase binds ONLY to that
 * PHASE-DSC-185 certification verdict (not to a dedicated DSC-185 artifact,
 * because none exists) while sealing the PHASE-DSC-184 package's own three
 * design sections (artifact, schema, implementation registry) directly, and
 * everything the PHASE-DSC-184 package owns transitively through its digest.
 *
 * The runtime consumption contract additionally declares five first-class,
 * design-only nested consumption surfaces describing how a downstream
 * consumer could, in a future implementation phase, validate compatibility
 * with the certified package: a runtime consumer schema, a runtime contract
 * registry, a consumer compatibility validation, a runtime readiness report,
 * and a contract compatibility report. None of these declare or perform
 * runtime execution.
 *
 * This contract seals three design sections directly (the PHASE-DSC-184
 * package artifact, schema, implementation registry) and seals everything the
 * package owns transitively through the package digest. It defines no
 * concrete runtime, implements no vendor, declares no runtime execution,
 * performs no GPU or inference work, and modifies no member.
 *
 * This runtime consumption contract is gated on the recorded PHASE-DSC-185
 * PASS verdict rather than a dedicated certification artifact, using the
 * PHASE-DSC-184 validation report as the persisted evidence that PHASE-DSC-185
 * certified.
 */

export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PHASE = 'PHASE-DSC-186' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_V1' as const;

/**
 * PHASE-DSC-185 was the read-only certification of the PHASE-DSC-184 package.
 * It created no export/schema/registry files; its PASS verdict is the sole
 * gate this phase binds to. These constants record that recorded verdict.
 */
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_PHASE = 'PHASE-DSC-185' as const;
export const DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_SYSTEM_ID =
  'DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_V1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ROOT =
  'exports/direct_spatial_conditioning/v1' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PATH =
  `${VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ROOT}/direct-spatial-conditioning-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-v1.json` as const;

/** Opaque deterministic identity of the vendor runtime profile runtime release final certification package runtime archive. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID =
  'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-v1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION = '1.0' as const;

/** Design-time evidence of the passing PHASE-DSC-166 vendor runtime profile runtime release final certification package. */
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_EVIDENCE_PATH =
  VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VALIDATION_REPORT_PATH;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_V1' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract.schema.json' as const;
export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_IMPLEMENTATION_REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-implementation-registry-v1.json' as const;

export const VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VALIDATION_REPORT_PATH =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VALIDATION_REPORT.json' as const;

/**
 * Ordered runtime profile runtime release final certification package runtime archive sections. Only the profile runtime release final certification package runtime archive's own
 * design-time publication set is sealed directly; everything it owns is sealed
 * transitively.
 */
export const RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS: Array<{
  section_id: string;
  role: string;
  kind:
    | 'runtime_profile_runtime_release_runtime_final_archive_package_artifact'
    | 'runtime_profile_runtime_release_runtime_final_archive_package_schema'
    | 'runtime_profile_runtime_release_runtime_final_archive_package_implementation_registry';
  artifact_ref: string;
}> = [
  {
    section_id: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract',
    role: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_root_profile_runtime_release_runtime_final_archive_package',
    kind: 'runtime_profile_runtime_release_runtime_final_archive_package_artifact',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_schema',
    role: 'runtime_profile_runtime_release_runtime_final_archive_package_shape_contract',
    kind: 'runtime_profile_runtime_release_runtime_final_archive_package_schema',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_SCHEMA_PATH,
  },
  {
    section_id: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_implementation_registry',
    role: 'runtime_profile_runtime_release_runtime_final_archive_package_provenance_registry',
    kind: 'runtime_profile_runtime_release_runtime_final_archive_package_implementation_registry',
    artifact_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
  },
];

export interface RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchemaField {
  field: string;
  type: string;
  required: true;
  nullable: false;
  constraint: string;
}

export interface VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchema {
  schema_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-schema-v1';
  description: string;
  encoding: 'application/json';
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_policy: 'opaque_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_no_vendor_binding';
  runtime_profile_runtime_release_runtime_final_archive_package_ref: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID;
  required_fields: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchemaField[];
  optional_fields: [];
  additional_fields: false;
}

export interface DeterministicRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractIdentity {
  identity_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-deterministic-identity-v1';
  description: string;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION;
  identity_policy: 'opaque_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_no_vendor_binding';
  derivation: 'literal_constant_declared_at_design_time';
  purity: 'deterministic_pure_constant';
  seed_dependence: 'none';
  time_dependence: 'none';
  randomness: 'none';
  vendor_binding: 'none';
  framework_binding: 'none';
  device_binding: 'none';
  vendor_name: 'none';
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  required_channels: ConditioningChannelId[];
}

export interface VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageBinding {
  binding_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-profile-runtime-release-runtime-final-archive-package-binding-v1';
  description: string;
  runtime_profile_runtime_release_runtime_final_archive_package_ref: string;
  runtime_profile_runtime_release_runtime_final_archive_package_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID;
  runtime_profile_runtime_release_runtime_final_archive_package_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERSION;
  runtime_profile_runtime_release_runtime_final_archive_package_phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_PHASE;
  runtime_profile_runtime_release_runtime_final_archive_package_system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_SYSTEM_ID;
  runtime_profile_runtime_release_runtime_final_archive_package_evidence_ref: string;
  runtime_profile_runtime_release_runtime_final_archive_package_verdict: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_VERDICT;
  runtime_profile_runtime_release_runtime_final_archive_package_evidence_mode: 'phase_185_pass_verdict_gated_at_build_time';
  binding_mode: 'exact_reuse';
  role: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_root';
  sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_final_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_final_package_digest: string;
  sealed_runtime_profile_runtime_release_final_bundle_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_report_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_report_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_package_digest: string;
  sealed_runtime_profile_runtime_bundle_digest: string;
  sealed_runtime_profile_runtime_package_digest: string;
  sealed_runtime_profile_runtime_definition_digest: string;
  sealed_runtime_profile_runtime_descriptor_digest: string;
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
  sealed_runtime_profile_registry_digest: string;
  sealed_runtime_profile_catalog_digest: string;
  sealed_runtime_profile_index_digest: string;
  sealed_runtime_profile_collection_digest: string;
  sealed_runtime_profile_set_digest: string;
  sealed_runtime_blueprint_digest: string;
  sealed_runtime_definition_digest: string;
  sealed_runtime_descriptor_digest: string;
  sealed_runtime_contract_digest: string;
  sealed_runtime_specification_digest: string;
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false;
  implements_runtime_profile_runtime_release_runtime_final_archive_package_in_this_phase: false;
}

export interface RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSection {
  section_id: string;
  role: string;
  kind: string;
  artifact_ref: string;
  order: number;
}

export interface RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractComposition {
  composition_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-composition-v1';
  description: string;
  root_section_id: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract';
  section_order: 'fixed_declared_order';
  closed_set: true;
  sections: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSection[];
  transitive_seal: {
    policy: 'runtime_profile_runtime_release_final_certification_package_contents_sealed_via_runtime_profile_runtime_release_runtime_final_archive_package_digest';
    sealed_via: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID;
    sealed_component_count: number;
    re_lists_runtime_profile_runtime_release_runtime_final_archive_package_contents: false;
  };
  vendor_specific_sections: 'forbidden';
  includes_implementations: false;
  declares_runtime_execution: false;
}

export interface RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifestEntry {
  section_id: string;
  artifact_ref: string;
  sha256: string;
  bytes: number;
  content_addressed: true;
}

export interface RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifest {
  manifest_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-manifest-v1';
  description: string;
  integrity_method: 'sha256_content_addressed_read_only';
  entry_count: number;
  entries: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifestEntry[];
  sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_final_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_final_package_digest: string;
  sealed_runtime_profile_runtime_release_final_bundle_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_report_digest: string;
  sealed_runtime_profile_runtime_release_archive_certification_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_package_digest: string;
  sealed_runtime_profile_runtime_release_archive_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_report_digest: string;
  sealed_runtime_profile_runtime_bundle_certification_package_digest: string;
  sealed_runtime_profile_runtime_bundle_digest: string;
  sealed_runtime_profile_runtime_package_digest: string;
  sealed_runtime_profile_runtime_definition_digest: string;
  sealed_runtime_profile_runtime_descriptor_digest: string;
  sealed_runtime_profile_runtime_reference_digest: string;
  sealed_runtime_profile_runtime_registry_digest: string;
  sealed_runtime_profile_runtime_catalog_digest: string;
  sealed_runtime_profile_runtime_index_digest: string;
  sealed_runtime_profile_master_index_digest: string;
  sealed_runtime_profile_archive_digest: string;
  sealed_runtime_profile_bundle_digest: string;
  sealed_runtime_profile_package_digest: string;
  sealed_runtime_profile_definition_digest: string;
  sealed_runtime_profile_descriptor_digest: string;
  sealed_runtime_profile_reference_digest: string;
  sealed_runtime_profile_registry_digest: string;
  sealed_runtime_profile_catalog_digest: string;
  sealed_runtime_profile_index_digest: string;
  sealed_runtime_profile_collection_digest: string;
  sealed_runtime_profile_set_digest: string;
  sealed_runtime_blueprint_digest: string;
  sealed_runtime_definition_digest: string;
  sealed_runtime_descriptor_digest: string;
  sealed_runtime_contract_digest: string;
  sealed_runtime_specification_digest: string;
  sealed_runtime_template_digest: string;
  sealed_runtime_family_digest: string;
  sealed_runtime_catalog_digest: string;
  sealed_runtime_index_digest: string;
  sealed_runtime_registry_digest: string;
  sealed_runtime_profile_digest: string;
  sealed_runtime_bundle_digest: string;
  sealed_runtime_package_digest: string;
  sealed_component_count: number;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_digest: string;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_digest_method: 'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest';
  verifies_implementations_in_this_phase: false;
}

/**
 * Opaque, vendor-neutral shape contract describing what a downstream consumer
 * of this runtime consumption contract may rely on. Design-only: it declares
 * no concrete consumer implementation and performs no runtime execution.
 */
export interface RuntimeConsumerSchema {
  consumer_schema_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumer-schema-v1';
  description: string;
  encoding: 'application/json';
  consumer_id_policy: 'opaque_consumer_id_no_vendor_binding';
  required_fields: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchemaField[];
  optional_fields: [];
  additional_fields: false;
  vendor_neutral: true;
  declares_runtime_execution: false;
}

/** Single design-time entry describing this runtime consumption contract's own registration. */
export interface RuntimeContractRegistryEntry {
  entry_id: string;
  contract_id: string;
  contract_version: string;
  contract_ref: string;
  contract_phase: string;
  status: 'registered';
}

/**
 * Design-time registry of contract entries. Holds a single entry for this
 * runtime consumption contract; closed set, no runtime execution.
 */
export interface RuntimeContractRegistry {
  registry_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-contract-registry-v1';
  description: string;
  entry_count: 1;
  entries: RuntimeContractRegistryEntry[];
  closed_set: true;
  declares_runtime_execution: false;
}

/** Single design-time compatibility rule evaluated at build time. */
export interface ConsumerCompatibilityValidationRule {
  rule_id: string;
  description: string;
  satisfied: boolean;
}

/**
 * Design-time compatibility rules and result structure. compatible is true
 * only when the sealed package digest and the PHASE-DSC-185 binding both
 * verify at build time; no runtime execution is performed or declared.
 */
export interface ConsumerCompatibilityValidation {
  validation_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-consumer-compatibility-validation-v1';
  description: string;
  rules: ConsumerCompatibilityValidationRule[];
  compatible: boolean;
  evaluated_at_build_time: true;
  declares_runtime_execution: false;
}

/** Single design-time readiness condition evaluated at build time. */
export interface RuntimeReadinessCondition {
  condition_id: string;
  description: string;
  satisfied: boolean;
}

/**
 * Design-time readiness report: ready is true only when the PHASE-DSC-185
 * PASS verdict is bound and the PHASE-DSC-184 package seals are intact.
 * Declares no runtime execution.
 */
export interface RuntimeReadinessReport {
  report_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-readiness-report-v1';
  description: string;
  ready: boolean;
  readiness_conditions: RuntimeReadinessCondition[];
  declares_runtime_execution: false;
}

/**
 * Design-time report summarizing consumer <-> package certification
 * compatibility. Design-only; no runtime execution.
 */
export interface ContractCompatibilityReport {
  report_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-contract-compatibility-report-v1';
  description: string;
  consumer_schema_ref: string;
  package_ref: string;
  certification_phase: string;
  certification_verdict: string;
  compatible: boolean;
  declares_runtime_execution: false;
}

export interface DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract {
  vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id: string;
  phase: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PHASE;
  system_id: typeof DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SYSTEM_ID;
  mode: 'design_only_vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract';
  target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_V1';
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_version: typeof VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_kind: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract';
  runtime_profile_runtime_release_runtime_final_archive_package_ref: string;
  runtime_profile_runtime_archive_certification_report_schema_ref: string;
  runtime_profile_runtime_archive_certification_report_implementation_registry_ref: string;
  runtime_profile_runtime_release_final_certification_package_evidence_ref: string;
  runtime_profile_runtime_archive_ref: string;
  runtime_profile_runtime_archive_schema_ref: string;
  runtime_profile_runtime_archive_implementation_registry_ref: string;
  runtime_profile_runtime_archive_evidence_ref: string;
  runtime_profile_runtime_bundle_certification_report_ref: string;
  runtime_profile_runtime_bundle_certification_report_schema_ref: string;
  runtime_profile_runtime_bundle_certification_report_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_certification_report_evidence_ref: string;
  runtime_profile_runtime_bundle_certification_package_ref: string;
  runtime_profile_runtime_bundle_certification_package_schema_ref: string;
  runtime_profile_runtime_bundle_certification_package_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_certification_package_evidence_ref: string;
  runtime_profile_runtime_bundle_ref: string;
  runtime_profile_runtime_bundle_schema_ref: string;
  runtime_profile_runtime_bundle_implementation_registry_ref: string;
  runtime_profile_runtime_bundle_evidence_ref: string;
  runtime_profile_runtime_package_ref: string;
  runtime_profile_runtime_package_schema_ref: string;
  runtime_profile_runtime_package_implementation_registry_ref: string;
  runtime_profile_runtime_package_evidence_ref: string;
  runtime_profile_runtime_definition_ref: string;
  runtime_profile_runtime_definition_schema_ref: string;
  runtime_profile_runtime_definition_implementation_registry_ref: string;
  runtime_profile_runtime_definition_evidence_ref: string;
  runtime_profile_runtime_descriptor_ref: string;
  runtime_profile_runtime_descriptor_schema_ref: string;
  runtime_profile_runtime_descriptor_implementation_registry_ref: string;
  runtime_profile_runtime_descriptor_evidence_ref: string;
  runtime_profile_runtime_reference_ref: string;
  runtime_profile_runtime_reference_schema_ref: string;
  runtime_profile_runtime_reference_implementation_registry_ref: string;
  runtime_profile_runtime_reference_evidence_ref: string;
  runtime_profile_runtime_registry_ref: string;
  runtime_profile_runtime_registry_schema_ref: string;
  runtime_profile_runtime_registry_implementation_registry_ref: string;
  runtime_profile_runtime_registry_evidence_ref: string;
  runtime_profile_runtime_catalog_ref: string;
  runtime_profile_runtime_catalog_schema_ref: string;
  runtime_profile_runtime_catalog_implementation_registry_ref: string;
  runtime_profile_runtime_catalog_evidence_ref: string;
  runtime_profile_runtime_index_ref: string;
  runtime_profile_runtime_index_schema_ref: string;
  runtime_profile_runtime_index_implementation_registry_ref: string;
  runtime_profile_runtime_index_evidence_ref: string;
  runtime_profile_master_index_ref: string;
  runtime_profile_master_index_schema_ref: string;
  runtime_profile_master_index_implementation_registry_ref: string;
  runtime_profile_master_index_evidence_ref: string;
  runtime_profile_archive_ref: string;
  runtime_profile_archive_schema_ref: string;
  runtime_profile_archive_implementation_registry_ref: string;
  runtime_profile_archive_evidence_ref: string;
  runtime_profile_bundle_ref: string;
  runtime_profile_bundle_schema_ref: string;
  runtime_profile_bundle_implementation_registry_ref: string;
  runtime_profile_bundle_evidence_ref: string;
  runtime_profile_package_ref: string;
  runtime_profile_package_schema_ref: string;
  runtime_profile_package_implementation_registry_ref: string;
  runtime_profile_package_evidence_ref: string;
  runtime_profile_definition_ref: string;
  runtime_profile_definition_schema_ref: string;
  runtime_profile_definition_implementation_registry_ref: string;
  runtime_profile_definition_evidence_ref: string;
  runtime_profile_descriptor_ref: string;
  runtime_profile_descriptor_schema_ref: string;
  runtime_profile_descriptor_implementation_registry_ref: string;
  runtime_profile_descriptor_evidence_ref: string;
  runtime_profile_reference_ref: string;
  runtime_profile_reference_schema_ref: string;
  runtime_profile_reference_implementation_registry_ref: string;
  runtime_profile_reference_evidence_ref: string;
  runtime_profile_registry_ref: string;
  runtime_profile_registry_schema_ref: string;
  runtime_profile_registry_implementation_registry_ref: string;
  runtime_profile_registry_evidence_ref: string;
  runtime_profile_catalog_ref: string;
  runtime_profile_catalog_schema_ref: string;
  runtime_profile_catalog_implementation_registry_ref: string;
  runtime_profile_catalog_evidence_ref: string;
  runtime_profile_index_ref: string;
  runtime_profile_index_schema_ref: string;
  runtime_profile_index_implementation_registry_ref: string;
  runtime_profile_index_evidence_ref: string;
  runtime_profile_collection_ref: string;
  runtime_profile_collection_schema_ref: string;
  runtime_profile_collection_implementation_registry_ref: string;
  runtime_profile_collection_evidence_ref: string;
  runtime_profile_set_ref: string;
  runtime_profile_set_schema_ref: string;
  runtime_profile_set_implementation_registry_ref: string;
  runtime_profile_set_evidence_ref: string;
  runtime_blueprint_ref: string;
  runtime_blueprint_schema_ref: string;
  runtime_blueprint_implementation_registry_ref: string;
  runtime_blueprint_evidence_ref: string;
  runtime_definition_ref: string;
  runtime_definition_schema_ref: string;
  runtime_definition_implementation_registry_ref: string;
  runtime_definition_evidence_ref: string;
  runtime_descriptor_ref: string;
  runtime_descriptor_schema_ref: string;
  runtime_descriptor_implementation_registry_ref: string;
  runtime_descriptor_evidence_ref: string;
  runtime_contract_ref: string;
  runtime_contract_schema_ref: string;
  runtime_contract_implementation_registry_ref: string;
  runtime_contract_evidence_ref: string;
  runtime_specification_ref: string;
  runtime_specification_schema_ref: string;
  runtime_specification_implementation_registry_ref: string;
  runtime_specification_evidence_ref: string;
  runtime_template_ref: string;
  runtime_template_schema_ref: string;
  runtime_template_implementation_registry_ref: string;
  runtime_template_evidence_ref: string;
  runtime_family_ref: string;
  runtime_family_schema_ref: string;
  runtime_family_implementation_registry_ref: string;
  runtime_family_evidence_ref: string;
  runtime_catalog_ref: string;
  runtime_catalog_schema_ref: string;
  runtime_catalog_implementation_registry_ref: string;
  runtime_catalog_evidence_ref: string;
  runtime_index_ref: string;
  runtime_index_schema_ref: string;
  runtime_index_implementation_registry_ref: string;
  runtime_index_evidence_ref: string;
  runtime_registry_ref: string;
  runtime_profile_ref: string;
  runtime_bundle_ref: string;
  runtime_package_ref: string;
  reference_bundle_ref: string;
  package_ref: string;
  template_ref: string;
  template_certification_ref: string;
  numerical_runtime_package_ref: string;
  sources_supported: string[];
  required_channels: ConditioningChannelId[];
  spatial_frame_ref: typeof SPATIAL_FRAME.frame_id;
  capability_set_id: typeof CAPABILITY_SET_ID;
  capability_set_version: typeof CAPABILITY_SET_VERSION;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_schema: VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchema;
  deterministic_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_identity: DeterministicRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractIdentity;
  vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_binding: VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageBinding;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_composition: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractComposition;
  runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_manifest: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifest;
  runtime_consumer_schema: RuntimeConsumerSchema;
  runtime_contract_registry: RuntimeContractRegistry;
  consumer_compatibility_validation: ConsumerCompatibilityValidation;
  runtime_readiness_report: RuntimeReadinessReport;
  contract_compatibility_report: ContractCompatibilityReport;
  profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_runtime_entries: {
    count: 0;
    entries: [];
    bundling_policy: string;
    bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false;
  };
  design_constraints: {
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_only: true;
    read_only: true;
    vendor_neutral: true;
    reuses_certified_vendor_runtime_profile_runtime_release_runtime_final_archive_package: true;
    no_actual_implementation: true;
    no_vendor_implementation: true;
    backend: 'none';
    no_backend_implementation: true;
    gpu: false;
    inference: false;
    declares_runtime_execution: false;
    bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false;
    modifies_existing_datasets: false;
    placeholders: false;
  };
  created_at: string;
}

function readJson<T>(root: string, relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8')) as T;
}

function sha256(root: string, relativePath: string): string {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, relativePath)))
    .digest('hex');
}

function writeJson(root: string, relativePath: string, value: unknown): void {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/**
 * Build the design-only, read-only, vendor-neutral DSC vendor runtime profile runtime release final certification package runtime archive.
 * Reuses the PHASE-DSC-166 Vendor Runtime Profile Runtime Release Final Certification Package by exact reference, gated on its
 * recorded PASS verdict; writes only the runtime profile runtime release final certification package runtime archive artifact.
 */
export function buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract(
  projectRoot?: string
): { vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract: DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract } {
  const root = resolveProjectRoot(projectRoot);

  const evidence = readJson<{
    final_verdict?: string;
    validation_passed?: boolean;
    phase?: string;
    error_count?: number;
  }>(root, VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_EVIDENCE_PATH);
  if (evidence.validation_passed !== true) {
    throw new Error('PHASE-DSC-184 vendor runtime profile runtime release final certification report did not pass validation');
  }
  if (evidence.final_verdict !== VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERDICT) {
    throw new Error(
      `PHASE-DSC-184 evidence carries an unexpected verdict: ${String(evidence.final_verdict)}`
    );
  }
  if (evidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PHASE) {
    throw new Error('PHASE-DSC-184 evidence does not cover the vendor runtime profile runtime release final certification report');
  }
  if (evidence.error_count !== 0) {
    throw new Error('PHASE-DSC-184 evidence reports outstanding errors');
  }

  const vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage =
    buildDirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage(root)
      .vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage;
  if (
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.phase !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PHASE ||
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.system_id !== DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_SYSTEM_ID
  ) {
    throw new Error('PHASE-DSC-184 vendor runtime profile runtime release final certification report is missing or incompatible');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_release_runtime_final_archive_package_id !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID
  ) {
    throw new Error('Vendor runtime profile runtime release runtime bundle identity drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_release_runtime_final_archive_package_version !==
    VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime release runtime bundle version drifted');
  }
  if (!vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.design_constraints.vendor_neutral) {
    throw new Error('Vendor runtime profile runtime release final certification package must remain vendor neutral');
  }
  if (
    !vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.design_constraints
      .reuses_certified_vendor_runtime_profile_runtime_release_runtime_final_archive
  ) {
    throw new Error(
      'Vendor runtime profile runtime release runtime final archive package must reuse the certified vendor runtime profile runtime release runtime final archive'
    );
  }
  if (vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.profile_runtime_release_runtime_final_archive_package_runtime_entries.count !== 0) {
    throw new Error('PHASE-DSC-184 must not have assembled profile runtime release final certification report runtime entries');
  }
  if (vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.design_constraints.declares_runtime_execution) {
    throw new Error('PHASE-DSC-184 must not declare runtime execution');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.required_channels) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
  ) {
    throw new Error('Vendor runtime profile runtime release final certification package channels do not match foundation channels');
  }
  if (
    JSON.stringify(vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.sources_supported) !==
    JSON.stringify([...SOURCE_IDS])
  ) {
    throw new Error(
      'Vendor runtime profile runtime release final certification package sources_supported drifted from the certified corpus'
    );
  }
  if (vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    throw new Error('Vendor runtime profile runtime release final certification package spatial frame drifted');
  }
  if (
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.capability_set_id !== CAPABILITY_SET_ID ||
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.capability_set_version !== CAPABILITY_SET_VERSION
  ) {
    throw new Error('Vendor runtime profile runtime release final certification package capability set identity drifted');
  }

  const runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream =
    vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_release_runtime_final_archive_package_manifest;
  for (const entry of runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.entries) {
    if (!fs.existsSync(path.join(root, entry.artifact_ref))) {
      throw new Error(
        `sealed runtime profile runtime release final certification package section missing on disk: ${entry.artifact_ref}`
      );
    }
    if (sha256(root, entry.artifact_ref) !== entry.sha256) {
      throw new Error(
        `sealed runtime profile runtime release final certification package section digest drifted: ${entry.artifact_ref}`
      );
    }
  }
  // Exact formula from the DSC-184 package builder (sealed prefix label unchanged):
  // re-derive DSC-184's own digest to confirm its manifest was not tampered with.
  const recomputedRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageDigest = crypto
    .createHash('sha256')
    .update(
      [
        ...runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.entries.map(
          (entry) => `${entry.section_id}:${entry.sha256}`
        ),
        `sealed_runtime_profile_runtime_release_runtime_final_archive:${runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_runtime_final_archive_digest}`,
      ].join('\n')
    )
    .digest('hex');
  if (
    recomputedRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageDigest !==
    runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.runtime_profile_runtime_release_runtime_final_archive_package_digest
  ) {
    throw new Error(
      'sealed runtime profile runtime release final certification package digest drifted from the runtime profile runtime release final certification package manifest'
    );
  }
  const sealedComponentCount = runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_component_count;

  for (const spec of RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS) {
    if (!fs.existsSync(path.join(root, spec.artifact_ref))) {
      throw new Error(`runtime profile runtime release final certification package section missing on disk: ${spec.artifact_ref}`);
    }
  }
  const sectionIds = RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS.map((spec) => spec.section_id);
  if (new Set(sectionIds).size !== sectionIds.length) {
    throw new Error('duplicate runtime profile runtime release final certification package section id');
  }
  const sectionRefs = RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS.map((spec) => spec.artifact_ref);
  if (new Set(sectionRefs).size !== sectionRefs.length) {
    throw new Error('duplicate runtime profile runtime release final certification package section artifact ref');
  }

  const runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_schema: VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractSchema = {
    schema_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-schema-v1',
    description:
      'Shape of a Direct Spatial Conditioning vendor runtime profile runtime release final certification package runtime archive. Identity is opaque and vendor-neutral; no vendor name, framework, or device binding is expressed. A runtime profile runtime release final certification package runtime archive binds one Vendor Runtime Profile Runtime Release Final Certification Package as its root, seals the profile runtime release final certification package together with its schema and implementation registry, and seals the profile runtime release final certification package contents transitively through the runtime profile runtime release final certification package digest. It defines no concrete profile runtime release final certification package runtime archive runtime and declares no runtime execution.',
    encoding: 'application/json',
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_policy: 'opaque_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_no_vendor_binding',
    runtime_profile_runtime_release_runtime_final_archive_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID,
    required_fields: [
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint:
          'non-empty opaque identifier; carries no vendor name, framework, or device semantics',
      },
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'major_minor runtime profile runtime release final certification package runtime archive version string',
      },
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_kind',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract',
      },
      {
        field: 'runtime_profile_runtime_release_final_certification_package_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must reference the vendor runtime profile runtime release final certification report ${VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID}`,
      },
      {
        field: 'capability_set_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_ID}`,
      },
      {
        field: 'capability_set_version',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${CAPABILITY_SET_VERSION}`,
      },
      {
        field: 'spatial_frame_ref',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${SPATIAL_FRAME.frame_id}`,
      },
      {
        field: 'required_channels',
        type: 'array<string>',
        required: true,
        nullable: false,
        constraint: 'must equal the six foundation channels in fixed order',
      },
      {
        field: 'deterministic_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_identity',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-deterministic-identity-v1',
        required: true,
        nullable: false,
        constraint:
          'opaque deterministic identity with no seed, time, randomness, vendor name, framework, or device dependence',
      },
      {
        field: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_binding',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-profile-runtime-release-runtime-final-archive-package-binding-v1',
        required: true,
        nullable: false,
        constraint:
          'exact reuse of the passing Vendor Runtime Profile Runtime Release Final Certification Package as the runtime profile runtime release final certification package runtime archive root, gated on its recorded PASS verdict',
      },
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_composition',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-composition-v1',
        required: true,
        nullable: false,
        constraint:
          'closed, fixed-order set of runtime profile runtime release final certification package artifact, schema, and implementation registry sections; vendor-specific sections forbidden and profile runtime release final certification package contents never re-listed',
      },
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_manifest',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-manifest-v1',
        required: true,
        nullable: false,
        constraint:
          'content-addressed SHA256 manifest with one entry per section, plus the transitively sealed runtime profile runtime release final certification package digest and a runtime profile runtime release final certification package runtime archive digest over sections and that digest',
      },
      {
        field: 'runtime_consumer_schema',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumer-schema-v1',
        required: true,
        nullable: false,
        constraint: 'opaque, vendor-neutral consumer shape contract; declares no runtime execution',
      },
      {
        field: 'runtime_contract_registry',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-contract-registry-v1',
        required: true,
        nullable: false,
        constraint: 'closed-set design-time registry with exactly one entry for this runtime consumption contract',
      },
      {
        field: 'consumer_compatibility_validation',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-consumer-compatibility-validation-v1',
        required: true,
        nullable: false,
        constraint: 'design-time compatibility rules and result; compatible true only when sealed digest and binding verdict both verify',
      },
      {
        field: 'runtime_readiness_report',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-readiness-report-v1',
        required: true,
        nullable: false,
        constraint: 'design-time readiness report; ready true only when PHASE-DSC-185 verdict is bound and PHASE-DSC-184 seals are intact',
      },
      {
        field: 'contract_compatibility_report',
        type: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-contract-compatibility-report-v1',
        required: true,
        nullable: false,
        constraint: 'design-time report summarizing consumer, package, and certification compatibility',
      },
    ],
    optional_fields: [],
    additional_fields: false,
  };

  const deterministic_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_identity: DeterministicRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractIdentity =
    {
      identity_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-deterministic-identity-v1',
      description:
        'Deterministic identity of the vendor runtime profile runtime release final certification package runtime archive. The runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id is a literal design-time constant with no seed, time, randomness, vendor name, framework, or device dependence.',
      runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID,
      runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION,
      identity_policy: 'opaque_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id_no_vendor_binding',
      derivation: 'literal_constant_declared_at_design_time',
      purity: 'deterministic_pure_constant',
      seed_dependence: 'none',
      time_dependence: 'none',
      randomness: 'none',
      vendor_binding: 'none',
      framework_binding: 'none',
      device_binding: 'none',
      vendor_name: 'none',
      capability_set_id: CAPABILITY_SET_ID,
      capability_set_version: CAPABILITY_SET_VERSION,
      spatial_frame_ref: SPATIAL_FRAME.frame_id,
      required_channels: [...CONDITIONING_CHANNEL_IDS],
    };

  const vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_binding: VendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageBinding = {
    binding_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-profile-runtime-release-runtime-final-archive-package-binding-v1',
    description:
      'Exact binding of the PHASE-DSC-185 read-only certification of the PHASE-DSC-184 Vendor Runtime Profile Runtime Release Runtime Final Archive Package as the runtime consumption contract root. PHASE-DSC-185 created no export, schema, or registry files of its own; the binding is gated at build time on its recorded PASS verdict, using the PHASE-DSC-184 validation report as the persisted evidence PHASE-DSC-185 certified, and re-seals every PHASE-DSC-184 package section and the PHASE-DSC-184 package digest before the runtime consumption contract is emitted.',
    runtime_profile_runtime_release_runtime_final_archive_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PATH,
    runtime_profile_runtime_release_runtime_final_archive_package_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID,
    runtime_profile_runtime_release_runtime_final_archive_package_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERSION,
    runtime_profile_runtime_release_runtime_final_archive_package_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_PHASE,
    runtime_profile_runtime_release_runtime_final_archive_package_system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_SYSTEM_ID,
    runtime_profile_runtime_release_runtime_final_archive_package_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_EVIDENCE_PATH,
    runtime_profile_runtime_release_runtime_final_archive_package_verdict: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_VERDICT,
    runtime_profile_runtime_release_runtime_final_archive_package_evidence_mode: 'phase_185_pass_verdict_gated_at_build_time',
    binding_mode: 'exact_reuse',
    role: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_root',
    sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.runtime_profile_runtime_release_runtime_final_archive_package_digest,
    sealed_runtime_profile_runtime_release_final_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_certification_package_digest,
    sealed_runtime_profile_runtime_release_final_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_package_digest,
    sealed_runtime_profile_runtime_release_final_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_bundle_digest,
    sealed_runtime_profile_runtime_release_archive_certification_report_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_report_digest,
    sealed_runtime_profile_runtime_release_archive_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_package_digest,
    sealed_runtime_profile_runtime_release_archive_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_package_digest,
    sealed_runtime_profile_runtime_release_archive_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_digest,
    sealed_runtime_profile_runtime_bundle_certification_report_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_report_digest,
    sealed_runtime_profile_runtime_bundle_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_package_digest,
    sealed_runtime_profile_runtime_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_digest,
    sealed_runtime_profile_runtime_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_package_digest,
    sealed_runtime_profile_runtime_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_definition_digest,
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false,
    implements_runtime_profile_runtime_release_runtime_final_archive_package_in_this_phase: false,
  };

  const runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_composition: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractComposition = {
    composition_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-composition-v1',
    description:
      'Closed, fixed-order composition of the publication envelope around the Vendor Runtime Profile Runtime Release Final Certification Package: the runtime profile runtime release final certification package artifact, its shape contract, and its implementation registry. The runtime profile runtime release final certification package contents (and everything sealed beneath them) are sealed transitively through the runtime profile runtime release final certification package digest and are deliberately not re-listed here.',
    root_section_id: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract',
    section_order: 'fixed_declared_order',
    closed_set: true,
    sections: RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS.map((spec, index) => ({
      section_id: spec.section_id,
      role: spec.role,
      kind: spec.kind,
      artifact_ref: spec.artifact_ref,
      order: index + 1,
    })),
    transitive_seal: {
    policy: 'runtime_profile_runtime_release_runtime_final_archive_package_contents_sealed_via_runtime_profile_runtime_release_final_certification_package_digest',
    sealed_via: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_ID,
      sealed_component_count: sealedComponentCount,
      re_lists_runtime_profile_runtime_release_runtime_final_archive_package_contents: false,
    },
    vendor_specific_sections: 'forbidden',
    includes_implementations: false,
    declares_runtime_execution: false,
  };

  const entries: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifestEntry[] = RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SECTION_SPECS.map(
    (spec) => ({
      section_id: spec.section_id,
      artifact_ref: spec.artifact_ref,
      sha256: sha256(root, spec.artifact_ref),
      bytes: fs.statSync(path.join(root, spec.artifact_ref)).size,
      content_addressed: true as const,
    })
  );

  const runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_digest = crypto
    .createHash('sha256')
    .update(
      [
        ...entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
        `sealed_runtime_profile_runtime_release_runtime_final_archive_package:${runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.runtime_profile_runtime_release_runtime_final_archive_package_digest}`,
      ].join('\n')
    )
    .digest('hex');

  const runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_manifest: RuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContractManifest = {
    manifest_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-manifest-v1',
    description:
      'Content-addressed SHA256 manifest of every runtime profile runtime release final certification package runtime archive section. Digests are computed read-only from disk. The sealed runtime profile runtime release final certification package digest carries the profile runtime release final certification package contents (and everything sealed beneath them) transitively, and the runtime profile runtime release final certification package runtime archive digest is the SHA256 of the ordered section digests and the sealed runtime profile runtime release final certification package digest. No implementation is verified in this phase.',
    integrity_method: 'sha256_content_addressed_read_only',
    entry_count: entries.length,
    entries,
    sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.runtime_profile_runtime_release_runtime_final_archive_package_digest,
    sealed_runtime_profile_runtime_release_final_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_certification_package_digest,
    sealed_runtime_profile_runtime_release_final_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_package_digest,
    sealed_runtime_profile_runtime_release_final_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_final_bundle_digest,
    sealed_runtime_profile_runtime_release_archive_certification_report_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_report_digest,
    sealed_runtime_profile_runtime_release_archive_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_certification_package_digest,
    sealed_runtime_profile_runtime_release_archive_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_package_digest,
    sealed_runtime_profile_runtime_release_archive_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_release_archive_digest,
    sealed_runtime_profile_runtime_bundle_certification_report_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_report_digest,
    sealed_runtime_profile_runtime_bundle_certification_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_certification_package_digest,
    sealed_runtime_profile_runtime_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_bundle_digest,
    sealed_runtime_profile_runtime_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_package_digest,
    sealed_runtime_profile_runtime_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_definition_digest,
    sealed_runtime_profile_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_descriptor_digest,
    sealed_runtime_profile_runtime_reference_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_reference_digest,
    sealed_runtime_profile_runtime_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_registry_digest,
    sealed_runtime_profile_runtime_catalog_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_catalog_digest,
    sealed_runtime_profile_runtime_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_runtime_index_digest,
    sealed_runtime_profile_master_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_master_index_digest,
    sealed_runtime_profile_archive_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_archive_digest,
    sealed_runtime_profile_bundle_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_bundle_digest,
    sealed_runtime_profile_package_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_package_digest,
    sealed_runtime_profile_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_definition_digest,
    sealed_runtime_profile_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_descriptor_digest,
    sealed_runtime_profile_reference_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_reference_digest,
    sealed_runtime_profile_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_registry_digest,
    sealed_runtime_profile_catalog_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_catalog_digest,
    sealed_runtime_profile_index_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_index_digest,
    sealed_runtime_profile_collection_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_collection_digest,
    sealed_runtime_profile_set_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_set_digest,
    sealed_runtime_blueprint_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_blueprint_digest,
    sealed_runtime_definition_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_definition_digest,
    sealed_runtime_descriptor_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_descriptor_digest,
    sealed_runtime_contract_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_contract_digest,
    sealed_runtime_specification_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_specification_digest,
    sealed_runtime_template_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_template_digest,
    sealed_runtime_family_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_family_digest,
    sealed_runtime_catalog_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_catalog_digest,
    sealed_runtime_index_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_index_digest,
    sealed_runtime_registry_digest:
      runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_registry_digest,
    sealed_runtime_profile_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_profile_digest,
    sealed_runtime_bundle_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_bundle_digest,
    sealed_runtime_package_digest: runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.sealed_runtime_package_digest,
    sealed_component_count: sealedComponentCount,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_digest,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_digest_method:
      'sha256_of_ordered_section_digests_and_sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest',
    verifies_implementations_in_this_phase: false,
  };

  // ---------------------------------------------------------------------
  // Design-only nested consumption surfaces (no runtime execution).
  // ---------------------------------------------------------------------

  const runtime_consumer_schema: RuntimeConsumerSchema = {
    consumer_schema_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumer-schema-v1',
    description:
      'Opaque, vendor-neutral shape contract describing what a downstream consumer of this runtime consumption contract may rely on: the sealed package digest, the PHASE-DSC-185 binding, and the closed section manifest. Carries no vendor name, framework, or device semantics and declares no runtime execution; a future implementation phase may register a concrete consumer against this shape.',
    encoding: 'application/json',
    consumer_id_policy: 'opaque_consumer_id_no_vendor_binding',
    required_fields: [
      {
        field: 'runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the opaque runtime consumption contract id',
      },
      {
        field: 'sealed_runtime_profile_runtime_release_runtime_final_archive_package_digest',
        type: 'string',
        required: true,
        nullable: false,
        constraint: 'must equal the sealed PHASE-DSC-184 package digest recorded in the binding',
      },
      {
        field: 'certification_phase',
        type: 'string',
        required: true,
        nullable: false,
        constraint: `must equal ${DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_PHASE}`,
      },
    ],
    optional_fields: [],
    additional_fields: false,
    vendor_neutral: true,
    declares_runtime_execution: false,
  };

  const runtime_contract_registry: RuntimeContractRegistry = {
    registry_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-contract-registry-v1',
    description:
      'Design-time registry of runtime consumption contract entries. Holds exactly one entry, for this runtime consumption contract itself; closed set, no runtime execution, no vendor-specific entries.',
    entry_count: 1,
    entries: [
      {
        entry_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-registry-entry-v1',
        contract_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID,
        contract_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION,
        contract_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PATH,
        contract_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PHASE,
        status: 'registered',
      },
    ],
    closed_set: true,
    declares_runtime_execution: false,
  };

  // Both conditions below are re-derived from checks already enforced by hard
  // throws earlier in this function (evidence verdict match and sealed digest
  // match); reaching this point means both are true.
  const sealedDigestMatches =
    recomputedRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageDigest ===
    runtimeProfileRuntimeReleaseRuntimeFinalArchivePackageManifestUpstream.runtime_profile_runtime_release_runtime_final_archive_package_digest;
  const bindingVerdictMatches = evidence.final_verdict === VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_VERDICT;

  const consumer_compatibility_validation: ConsumerCompatibilityValidation = {
    validation_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-consumer-compatibility-validation-v1',
    description:
      'Design-time compatibility rules and result for a downstream consumer of this runtime consumption contract. compatible is true only when the sealed PHASE-DSC-184 package digest verifies and the PHASE-DSC-185 binding verdict matches; both are re-checked here from the same evidence already enforced at build time. No runtime execution is performed or declared.',
    rules: [
      {
        rule_id: 'sealed_package_digest_matches',
        description: 'The recomputed PHASE-DSC-184 package digest matches the digest recorded in its manifest.',
        satisfied: sealedDigestMatches,
      },
      {
        rule_id: 'certification_binding_verdict_matches',
        description: 'The PHASE-DSC-184 validation report verdict matches the expected PASS verdict certified by PHASE-DSC-185.',
        satisfied: bindingVerdictMatches,
      },
    ],
    compatible: sealedDigestMatches && bindingVerdictMatches,
    evaluated_at_build_time: true,
    declares_runtime_execution: false,
  };

  const runtime_readiness_report: RuntimeReadinessReport = {
    report_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-readiness-report-v1',
    description:
      'Design-time readiness report. ready is true only when the PHASE-DSC-185 PASS verdict is bound and the PHASE-DSC-184 package seals are intact. Declares no runtime execution; readiness here is a design-time gate for a future implementation phase, not a runtime capability.',
    ready: bindingVerdictMatches && sealedDigestMatches,
    readiness_conditions: [
      {
        condition_id: 'phase_185_pass_verdict_bound',
        description: 'The PHASE-DSC-185 certification PASS verdict is bound at build time.',
        satisfied: bindingVerdictMatches,
      },
      {
        condition_id: 'phase_184_package_seals_intact',
        description: 'The PHASE-DSC-184 package section digests and package digest verify against its manifest.',
        satisfied: sealedDigestMatches,
      },
    ],
    declares_runtime_execution: false,
  };

  const contract_compatibility_report: ContractCompatibilityReport = {
    report_id: 'dsc-vendor-runtime-profile-runtime-release-runtime-final-archive-package-contract-compatibility-report-v1',
    description:
      'Design-time report summarizing consumer <-> package certification compatibility for this runtime consumption contract. Compatible is true only when the runtime consumer schema, the PHASE-DSC-184 package, and the PHASE-DSC-185 certification binding all agree. No runtime execution is performed or declared.',
    consumer_schema_ref: runtime_consumer_schema.consumer_schema_id,
    package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PATH,
    certification_phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_PHASE,
    certification_verdict: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_CERTIFICATION_VERDICT,
    compatible: sealedDigestMatches && bindingVerdictMatches,
    declares_runtime_execution: false,
  };

  const vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract: DirectSpatialConditioningVendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract = {
    vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id:
      'direct-spatial-conditioning-vendor-runtime-profile-runtime-release-runtime-final-archive-package-runtime-consumption-contract-v1',
    phase: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PHASE,
    system_id: DSC_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_SYSTEM_ID,
    mode: 'design_only_vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract',
    target: 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_V1',
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_id: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_ID,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_version: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_VERSION,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_kind: 'vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract',
    runtime_profile_runtime_release_runtime_final_archive_package_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_PATH,
    runtime_profile_runtime_release_runtime_final_archive_package_schema_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_SCHEMA_PATH,
    runtime_profile_runtime_release_runtime_final_archive_package_implementation_registry_ref:
      VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_runtime_release_runtime_final_archive_package_evidence_ref:
      VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_EVIDENCE_PATH,
    runtime_profile_runtime_release_final_certification_package_evidence_ref: VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_EVIDENCE_PATH,
    runtime_profile_runtime_archive_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_archive_ref,
    runtime_profile_runtime_archive_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_archive_schema_ref,
    runtime_profile_runtime_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_archive_implementation_registry_ref,
    runtime_profile_runtime_archive_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_archive_evidence_ref,
    runtime_profile_runtime_bundle_certification_report_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_report_ref,
    runtime_profile_runtime_bundle_certification_report_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_report_schema_ref,
    runtime_profile_runtime_bundle_certification_report_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_report_implementation_registry_ref,
    runtime_profile_runtime_bundle_certification_report_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_report_evidence_ref,
    runtime_profile_runtime_bundle_certification_package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_package_ref,
    runtime_profile_runtime_bundle_certification_package_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_package_schema_ref,
    runtime_profile_runtime_bundle_certification_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_package_implementation_registry_ref,
    runtime_profile_runtime_bundle_certification_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_certification_package_evidence_ref,
    runtime_profile_runtime_bundle_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_ref,
    runtime_profile_runtime_bundle_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_schema_ref,
    runtime_profile_runtime_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_implementation_registry_ref,
    runtime_profile_runtime_bundle_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_bundle_evidence_ref,
    runtime_profile_runtime_package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_package_ref,
    runtime_profile_runtime_package_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_package_schema_ref,
    runtime_profile_runtime_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_package_implementation_registry_ref,
    runtime_profile_runtime_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_package_evidence_ref,
    runtime_profile_runtime_definition_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_definition_ref,
    runtime_profile_runtime_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_definition_schema_ref,
    runtime_profile_runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_definition_implementation_registry_ref,
    runtime_profile_runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_definition_evidence_ref,
    runtime_profile_runtime_descriptor_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_descriptor_ref,
    runtime_profile_runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_descriptor_schema_ref,
    runtime_profile_runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_descriptor_implementation_registry_ref,
    runtime_profile_runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_descriptor_evidence_ref,
    runtime_profile_runtime_reference_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_reference_ref,
    runtime_profile_runtime_reference_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_reference_schema_ref,
    runtime_profile_runtime_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_reference_implementation_registry_ref,
    runtime_profile_runtime_reference_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_reference_evidence_ref,
    runtime_profile_runtime_registry_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_registry_ref,
    runtime_profile_runtime_registry_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_registry_schema_ref,
    runtime_profile_runtime_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_registry_implementation_registry_ref,
    runtime_profile_runtime_registry_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_registry_evidence_ref,
    runtime_profile_runtime_catalog_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_catalog_ref,
    runtime_profile_runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_catalog_schema_ref,
    runtime_profile_runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_catalog_implementation_registry_ref,
    runtime_profile_runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_catalog_evidence_ref,
    runtime_profile_runtime_index_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_index_ref,
    runtime_profile_runtime_index_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_index_schema_ref,
    runtime_profile_runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_index_implementation_registry_ref,
    runtime_profile_runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_runtime_index_evidence_ref,
    runtime_profile_master_index_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_master_index_ref,
    runtime_profile_master_index_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_master_index_schema_ref,
    runtime_profile_master_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_master_index_implementation_registry_ref,
    runtime_profile_master_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_master_index_evidence_ref,
    runtime_profile_archive_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_archive_ref,
    runtime_profile_archive_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_archive_schema_ref,
    runtime_profile_archive_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_archive_implementation_registry_ref,
    runtime_profile_archive_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_archive_evidence_ref,
    runtime_profile_bundle_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_bundle_ref,
    runtime_profile_bundle_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_bundle_schema_ref,
    runtime_profile_bundle_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_bundle_implementation_registry_ref,
    runtime_profile_bundle_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_bundle_evidence_ref,
    runtime_profile_package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_package_ref,
    runtime_profile_package_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_package_schema_ref,
    runtime_profile_package_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_package_implementation_registry_ref,
    runtime_profile_package_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_package_evidence_ref,
    runtime_profile_definition_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_definition_ref,
    runtime_profile_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_definition_schema_ref,
    runtime_profile_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_definition_implementation_registry_ref,
    runtime_profile_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_definition_evidence_ref,
    runtime_profile_descriptor_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_descriptor_ref,
    runtime_profile_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_descriptor_schema_ref,
    runtime_profile_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_descriptor_implementation_registry_ref,
    runtime_profile_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_descriptor_evidence_ref,
    runtime_profile_reference_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_reference_ref,
    runtime_profile_reference_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_reference_schema_ref,
    runtime_profile_reference_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_reference_implementation_registry_ref,
    runtime_profile_reference_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_reference_evidence_ref,
    runtime_profile_registry_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_registry_ref,
    runtime_profile_registry_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_registry_schema_ref,
    runtime_profile_registry_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_registry_implementation_registry_ref,
    runtime_profile_registry_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_registry_evidence_ref,
    runtime_profile_catalog_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_catalog_ref,
    runtime_profile_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_catalog_schema_ref,
    runtime_profile_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_catalog_implementation_registry_ref,
    runtime_profile_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_catalog_evidence_ref,
    runtime_profile_index_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_index_ref,
    runtime_profile_index_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_index_schema_ref,
    runtime_profile_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_index_implementation_registry_ref,
    runtime_profile_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_index_evidence_ref,
    runtime_profile_collection_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_collection_ref,
    runtime_profile_collection_schema_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_collection_schema_ref,
    runtime_profile_collection_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_collection_implementation_registry_ref,
    runtime_profile_collection_evidence_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_collection_evidence_ref,
    runtime_profile_set_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_set_ref,
    runtime_profile_set_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_set_schema_ref,
    runtime_profile_set_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_set_implementation_registry_ref,
    runtime_profile_set_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_set_evidence_ref,
    runtime_blueprint_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_blueprint_ref,
    runtime_blueprint_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_blueprint_schema_ref,
    runtime_blueprint_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_blueprint_implementation_registry_ref,
    runtime_blueprint_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_blueprint_evidence_ref,
    runtime_definition_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_definition_ref,
    runtime_definition_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_definition_schema_ref,
    runtime_definition_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_definition_implementation_registry_ref,
    runtime_definition_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_definition_evidence_ref,
    runtime_descriptor_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_descriptor_ref,
    runtime_descriptor_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_descriptor_schema_ref,
    runtime_descriptor_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_descriptor_implementation_registry_ref,
    runtime_descriptor_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_descriptor_evidence_ref,
    runtime_contract_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_contract_ref,
    runtime_contract_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_contract_schema_ref,
    runtime_contract_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_contract_implementation_registry_ref,
    runtime_contract_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_contract_evidence_ref,
    runtime_specification_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_specification_ref,
    runtime_specification_schema_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_specification_schema_ref,
    runtime_specification_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_specification_implementation_registry_ref,
    runtime_specification_evidence_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_specification_evidence_ref,
    runtime_template_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_template_ref,
    runtime_template_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_template_schema_ref,
    runtime_template_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_template_implementation_registry_ref,
    runtime_template_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_template_evidence_ref,
    runtime_family_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_family_ref,
    runtime_family_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_family_schema_ref,
    runtime_family_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_family_implementation_registry_ref,
    runtime_family_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_family_evidence_ref,
    runtime_catalog_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_catalog_ref,
    runtime_catalog_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_catalog_schema_ref,
    runtime_catalog_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_catalog_implementation_registry_ref,
    runtime_catalog_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_catalog_evidence_ref,
    runtime_index_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_index_ref,
    runtime_index_schema_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_index_schema_ref,
    runtime_index_implementation_registry_ref:
      vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_index_implementation_registry_ref,
    runtime_index_evidence_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_index_evidence_ref,
    runtime_registry_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_registry_ref,
    runtime_profile_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_profile_ref,
    runtime_bundle_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_bundle_ref,
    runtime_package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.runtime_package_ref,
    reference_bundle_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.reference_bundle_ref,
    package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.package_ref,
    template_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.template_ref,
    template_certification_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.template_certification_ref,
    numerical_runtime_package_ref: vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackage.numerical_runtime_package_ref,
    sources_supported: [...SOURCE_IDS],
    required_channels: [...CONDITIONING_CHANNEL_IDS],
    spatial_frame_ref: SPATIAL_FRAME.frame_id,
    capability_set_id: CAPABILITY_SET_ID,
    capability_set_version: CAPABILITY_SET_VERSION,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_schema,
    deterministic_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_identity,
    vendor_runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_binding,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_composition,
    runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_manifest,
    runtime_consumer_schema,
    runtime_contract_registry,
    consumer_compatibility_validation,
    runtime_readiness_report,
    contract_compatibility_report,
    profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_runtime_entries: {
      count: 0,
      entries: [],
      bundling_policy:
        'concrete vendor runtime profile runtime release final certification package runtime archive entries may be registered into this profile runtime release final certification package runtime archive only in a future implementation phase; none are registered here',
      bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false,
    },
    design_constraints: {
      runtime_profile_runtime_release_runtime_final_archive_package_runtime_consumption_contract_only: true,
      read_only: true,
      vendor_neutral: true,
      reuses_certified_vendor_runtime_profile_runtime_release_runtime_final_archive_package: true,
      no_actual_implementation: true,
      no_vendor_implementation: true,
      backend: 'none',
      no_backend_implementation: true,
      gpu: false,
      inference: false,
      declares_runtime_execution: false,
      bundles_profile_runtime_release_runtime_final_archive_package_in_this_phase: false,
      modifies_existing_datasets: false,
      placeholders: false,
    },
    created_at: '2026-07-27T00:00:00.000Z',
  };

  writeJson(root, VENDOR_RUNTIME_PROFILE_RUNTIME_RELEASE_RUNTIME_FINAL_ARCHIVE_PACKAGE_RUNTIME_CONSUMPTION_CONTRACT_PATH, vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract);
  return { vendorRuntimeProfileRuntimeReleaseRuntimeFinalArchivePackageRuntimeConsumptionContract };
}
