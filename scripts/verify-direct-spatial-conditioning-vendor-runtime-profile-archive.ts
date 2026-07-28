import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import { CONTRACT_PATH } from '../services/directSpatialConditioningContractBuilder.js';
import { PACKET_PATH } from '../services/directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from '../services/directSpatialConditioningPacketValidationBuilder.js';
import { ASSEMBLY_PATH } from '../services/directSpatialConditioningPacketAssemblyBuilder.js';
import { GENERATION_PATH } from '../services/directSpatialConditioningPacketGenerationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from '../services/directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_VALIDATION_PATH } from '../services/directSpatialConditioningRuntimeValidationBuilder.js';
import { BACKEND_ADAPTER_FOUNDATION_PATH } from '../services/directSpatialConditioningBackendAdapterFoundationBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
} from '../services/directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { BACKEND_COMPATIBILITY_ENGINE_PATH } from '../services/directSpatialConditioningBackendCompatibilityEngineBuilder.js';
import { BACKEND_ADAPTER_REGISTRATION_PATH } from '../services/directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { BACKEND_RUNTIME_ROUTER_PATH } from '../services/directSpatialConditioningBackendRuntimeRouterBuilder.js';
import { BACKEND_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningBackendExecutionContractBuilder.js';
import { BACKEND_IMPLEMENTATION_SPEC_PATH } from '../services/directSpatialConditioningBackendImplementationSpecBuilder.js';
import { BACKEND_DESIGN_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendDesignCertificationBuilder.js';
import { BACKEND_PROFILE_PATH } from '../services/directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendProfileCertificationBuilder.js';
import { BACKEND_TEMPLATE_PATH } from '../services/directSpatialConditioningBackendTemplateBuilder.js';
import {
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_PATH,
} from '../services/directSpatialConditioningReferenceBackendBuilder.js';
import {
  BACKEND_FAMILY_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
} from '../services/directSpatialConditioningBackendFamilyBuilder.js';
import {
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_PROFILE_PATH,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from '../services/directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from '../services/directSpatialConditioningVendorRouterBuilder.js';
import { VENDOR_EXECUTION_CONTRACT_PATH } from '../services/directSpatialConditioningVendorExecutionContractBuilder.js';
import { VENDOR_IMPLEMENTATION_SPEC_PATH } from '../services/directSpatialConditioningVendorImplementationSpecBuilder.js';
import { VENDOR_REFERENCE_PROFILE_PATH } from '../services/directSpatialConditioningVendorReferenceProfileBuilder.js';
import { VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceProfileCertificationBuilder.js';
import { VENDOR_TEMPLATE_PATH } from '../services/directSpatialConditioningVendorTemplateBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationBuilder.js';
import { VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorReferenceImplementationCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_PATH } from '../services/directSpatialConditioningVendorImplementationFamilyBuilder.js';
import { VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationFamilyCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_PATH } from '../services/directSpatialConditioningVendorImplementationProfileBuilder.js';
import { VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationProfileCertificationBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_PATH } from '../services/directSpatialConditioningVendorImplementationTemplateBuilder.js';
import { VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH } from '../services/directSpatialConditioningVendorImplementationTemplateCertificationBuilder.js';
import { VENDOR_REFERENCE_PACKAGE_PATH } from '../services/directSpatialConditioningVendorReferencePackageBuilder.js';
import { VENDOR_REFERENCE_BUNDLE_PATH } from '../services/directSpatialConditioningVendorReferenceBundleBuilder.js';
import { VENDOR_RUNTIME_PACKAGE_PATH } from '../services/directSpatialConditioningVendorRuntimePackageBuilder.js';
import { VENDOR_RUNTIME_BUNDLE_PATH } from '../services/directSpatialConditioningVendorRuntimeBundleBuilder.js';
import { VENDOR_RUNTIME_PROFILE_PATH } from '../services/directSpatialConditioningVendorRuntimeProfileBuilder.js';
import {
  DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_REGISTRY_PATH,
  type DirectSpatialConditioningVendorRuntimeRegistry,
} from '../services/directSpatialConditioningVendorRuntimeRegistryBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  type DirectSpatialConditioningVendorRuntimeIndex,
} from '../services/directSpatialConditioningVendorRuntimeIndexBuilder.js';
import {
  VENDOR_RUNTIME_CATALOG_PATH,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  type DirectSpatialConditioningVendorRuntimeCatalog,
} from '../services/directSpatialConditioningVendorRuntimeCatalogBuilder.js';
import {
  VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
  VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  VENDOR_RUNTIME_FAMILY_PATH,
  VENDOR_RUNTIME_FAMILY_VERSION,
} from '../services/directSpatialConditioningVendorRuntimeFamilyBuilder.js';
import {
  DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID,
  VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
  VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  VENDOR_RUNTIME_TEMPLATE_ID,
  VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_TEMPLATE_PATH,
  VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  VENDOR_RUNTIME_TEMPLATE_VERSION,
  type DirectSpatialConditioningVendorRuntimeTemplate,
} from '../services/directSpatialConditioningVendorRuntimeTemplateBuilder.js';
import {
  DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID,
  VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_SPECIFICATION_PATH,
  VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
  type DirectSpatialConditioningVendorRuntimeSpecification,
} from '../services/directSpatialConditioningVendorRuntimeSpecificationBuilder.js';
import {
  DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
  DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID,
  VENDOR_RUNTIME_CONTRACT_ID,
  VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CONTRACT_PATH,
  VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  VENDOR_RUNTIME_CONTRACT_VERSION,
  VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
  type DirectSpatialConditioningVendorRuntimeContract,
} from '../services/directSpatialConditioningVendorRuntimeContractBuilder.js';
import {
  DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
  DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID,
  VENDOR_RUNTIME_DESCRIPTOR_ID,
  VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_VERSION,
  VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
  type DirectSpatialConditioningVendorRuntimeDescriptor,
} from '../services/directSpatialConditioningVendorRuntimeDescriptorBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeDefinition,
  DSC_VENDOR_RUNTIME_DEFINITION_PHASE,
  DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID,
  VENDOR_RUNTIME_DEFINITION_ID,
  VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DEFINITION_PATH,
  VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
  VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_DEFINITION_VERSION,
  type DirectSpatialConditioningVendorRuntimeDefinition,
} from '../services/directSpatialConditioningVendorRuntimeDefinitionBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeBlueprint,
  DSC_VENDOR_RUNTIME_BLUEPRINT_PHASE,
  DSC_VENDOR_RUNTIME_BLUEPRINT_SYSTEM_ID,
  VENDOR_RUNTIME_BLUEPRINT_ID,
  VENDOR_RUNTIME_BLUEPRINT_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_BLUEPRINT_PATH,
  VENDOR_RUNTIME_BLUEPRINT_SCHEMA_PATH,
  VENDOR_RUNTIME_BLUEPRINT_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_BLUEPRINT_VERSION,
  type DirectSpatialConditioningVendorRuntimeBlueprint,
} from '../services/directSpatialConditioningVendorRuntimeBlueprintBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileSet,
  DSC_VENDOR_RUNTIME_PROFILE_SET_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_SET_SYSTEM_ID,
  RUNTIME_PROFILE_SET_SECTION_SPECS,
  VENDOR_RUNTIME_BLUEPRINT_EVIDENCE_PATH,
  VENDOR_RUNTIME_BLUEPRINT_VERDICT,
  VENDOR_RUNTIME_PROFILE_SET_ID,
  VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_SET_PATH,
  VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_SET_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_SET_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileSet,
} from '../services/directSpatialConditioningVendorRuntimeProfileSetBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileCollection,
  DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_COLLECTION_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_COLLECTION_ID,
  VENDOR_RUNTIME_PROFILE_COLLECTION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_COLLECTION_PATH,
  VENDOR_RUNTIME_PROFILE_COLLECTION_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_COLLECTION_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_COLLECTION_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileCollection,
} from '../services/directSpatialConditioningVendorRuntimeProfileCollectionBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileIndex,
  DSC_VENDOR_RUNTIME_PROFILE_INDEX_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_INDEX_SYSTEM_ID,
  RUNTIME_PROFILE_INDEX_SECTION_SPECS,
  VENDOR_RUNTIME_PROFILE_COLLECTION_EVIDENCE_PATH,
  VENDOR_RUNTIME_PROFILE_COLLECTION_VERDICT,
  VENDOR_RUNTIME_PROFILE_INDEX_ID,
  VENDOR_RUNTIME_PROFILE_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_INDEX_PATH,
  VENDOR_RUNTIME_PROFILE_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_INDEX_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_INDEX_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileIndex,
} from '../services/directSpatialConditioningVendorRuntimeProfileIndexBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileRegistry,
  DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_REGISTRY_ID,
  VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_REGISTRY_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileRegistry,
} from '../services/directSpatialConditioningVendorRuntimeProfileRegistryBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileCatalog,
  DSC_VENDOR_RUNTIME_PROFILE_CATALOG_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_CATALOG_ID,
  VENDOR_RUNTIME_PROFILE_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_CATALOG_PATH,
  VENDOR_RUNTIME_PROFILE_CATALOG_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_CATALOG_VALIDATION_REPORT_PATH,
  type DirectSpatialConditioningVendorRuntimeProfileCatalog,
} from '../services/directSpatialConditioningVendorRuntimeProfileCatalogBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileReference,
  DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_REFERENCE_ID,
  VENDOR_RUNTIME_PROFILE_REFERENCE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_REFERENCE_PATH,
  VENDOR_RUNTIME_PROFILE_REFERENCE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_REFERENCE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_REFERENCE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileReference,
} from '../services/directSpatialConditioningVendorRuntimeProfileReferenceBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileDescriptor,
  DSC_VENDOR_RUNTIME_PROFILE_DESCRIPTOR_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_DESCRIPTOR_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_ID,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_DESCRIPTOR_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileDescriptor,
} from '../services/directSpatialConditioningVendorRuntimeProfileDescriptorBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileDefinition,
  DSC_VENDOR_RUNTIME_PROFILE_DEFINITION_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_DEFINITION_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_DEFINITION_ID,
  VENDOR_RUNTIME_PROFILE_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_DEFINITION_PATH,
  VENDOR_RUNTIME_PROFILE_DEFINITION_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_DEFINITION_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_DEFINITION_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileDefinition,
} from '../services/directSpatialConditioningVendorRuntimeProfileDefinitionBuilder.js';

import {
  buildDirectSpatialConditioningVendorRuntimeProfilePackage,
  DSC_VENDOR_RUNTIME_PROFILE_PACKAGE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_PACKAGE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_PACKAGE_ID,
  VENDOR_RUNTIME_PROFILE_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_PACKAGE_PATH,
  VENDOR_RUNTIME_PROFILE_PACKAGE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_PACKAGE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_PACKAGE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfilePackage,
} from '../services/directSpatialConditioningVendorRuntimeProfilePackageBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileBundle,
  DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID,
  VENDOR_RUNTIME_PROFILE_BUNDLE_ID,
  VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileBundle,
} from '../services/directSpatialConditioningVendorRuntimeProfileBundleBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeProfileArchive,
  DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE,
  DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID,
  RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS,
  VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_ID,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT_PATH,
  VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION,
  type DirectSpatialConditioningVendorRuntimeProfileArchive,
} from '../services/directSpatialConditioningVendorRuntimeProfileArchiveBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_PROFILE_ARCHIVE_V1' as const;
const SCHEMA_PATH = VENDOR_RUNTIME_PROFILE_ARCHIVE_SCHEMA_PATH;
const REGISTRY_PATH = VENDOR_RUNTIME_PROFILE_ARCHIVE_IMPLEMENTATION_REGISTRY_PATH;

interface Issue {
  code: string;
  message: string;
}
const issues: Issue[] = [];

function sha256(relativePath: string): string | null {
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')) as T;
}

const EXPECTED_SCHEMA_FIELDS = [
  'runtime_profile_archive_id',
  'runtime_profile_archive_version',
  'runtime_profile_archive_kind',
  'runtime_profile_bundle_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_profile_archive_identity',
  'vendor_runtime_profile_bundle_binding',
  'runtime_profile_archive_composition',
  'runtime_profile_archive_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_PROFILE_ARCHIVE_SECTION_SPECS.map((spec) => spec.section_id);

const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  ASSEMBLY_PATH,
  GENERATION_PATH,
  RUNTIME_INTERFACE_PATH,
  RUNTIME_VALIDATION_PATH,
  BACKEND_ADAPTER_FOUNDATION_PATH,
  BACKEND_CAPABILITY_REGISTRY_PATH,
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  BACKEND_ADAPTER_REGISTRATION_PATH,
  BACKEND_RUNTIME_ROUTER_PATH,
  BACKEND_EXECUTION_CONTRACT_PATH,
  BACKEND_IMPLEMENTATION_SPEC_PATH,
  BACKEND_PROFILE_PATH,
  BACKEND_TEMPLATE_PATH,
  REFERENCE_BACKEND_PATH,
  BACKEND_FAMILY_PATH,
  VENDOR_PROFILE_PATH,
  VENDOR_REGISTRY_PATH,
  VENDOR_COMPATIBILITY_PATH,
  VENDOR_ROUTER_PATH,
  VENDOR_EXECUTION_CONTRACT_PATH,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  VENDOR_REFERENCE_PROFILE_PATH,
  VENDOR_TEMPLATE_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_PATH,
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_REFERENCE_PACKAGE_PATH,
  VENDOR_REFERENCE_BUNDLE_PATH,
  VENDOR_RUNTIME_PACKAGE_PATH,
  VENDOR_RUNTIME_BUNDLE_PATH,
  VENDOR_RUNTIME_PROFILE_PATH,
  VENDOR_RUNTIME_REGISTRY_PATH,
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  VENDOR_REFERENCE_PROFILE_CERTIFICATION_PATH,
  VENDOR_REFERENCE_IMPLEMENTATION_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_FAMILY_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_PROFILE_CERTIFICATION_PATH,
  VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
  VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  VENDOR_RUNTIME_INDEX_PATH,
  VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  VENDOR_RUNTIME_CATALOG_PATH,
  VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
  VENDOR_RUNTIME_FAMILY_PATH,
  VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
  VENDOR_RUNTIME_TEMPLATE_PATH,
  VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CONTRACT_PATH,
  VENDOR_RUNTIME_SPECIFICATION_PATH,
  VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime profile bundle input ${required}`);
    process.exit(1);
  }
}

const profileReferenceEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH);
if (profileReferenceEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime profile bundle did not pass validation');
  process.exit(1);
}
if (profileReferenceEvidence.final_verdict !== VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime profile bundle evidence does not carry the PHASE-DSC-123 PASS verdict'
  );
  process.exit(1);
}
if (profileReferenceEvidence.phase !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime profile bundle');
  process.exit(1);
}

const vendorRuntimeProfileBundleOnDisk =
  readJson<DirectSpatialConditioningVendorRuntimeProfileBundle>(
    VENDOR_RUNTIME_PROFILE_BUNDLE_PATH
  );
if (
  vendorRuntimeProfileBundleOnDisk.system_id !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime profile bundle system id mismatch');
  process.exit(1);
}
const vendorRuntimeProfileRegistryOnDisk =
  readJson<DirectSpatialConditioningVendorRuntimeProfileRegistry>(
    VENDOR_RUNTIME_PROFILE_REGISTRY_PATH
  );
if (
  vendorRuntimeProfileRegistryOnDisk.system_id !== DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime profile registry system id mismatch');
  process.exit(1);
}

const vendorRuntimeProfileCatalogOnDisk =
  readJson<DirectSpatialConditioningVendorRuntimeProfileCatalog>(
    VENDOR_RUNTIME_PROFILE_CATALOG_PATH
  );
if (
  vendorRuntimeProfileCatalogOnDisk.system_id !== DSC_VENDOR_RUNTIME_PROFILE_CATALOG_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime profile catalog system id mismatch');
  process.exit(1);
}

const vendorRuntimeProfileIndexOnDisk =
  readJson<DirectSpatialConditioningVendorRuntimeProfileIndex>(
    VENDOR_RUNTIME_PROFILE_INDEX_PATH
  );
if (
  vendorRuntimeProfileIndexOnDisk.system_id !== DSC_VENDOR_RUNTIME_PROFILE_INDEX_SYSTEM_ID
) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime profile index system id mismatch');
  process.exit(1);
}

const vendorRuntimeBlueprintOnDisk = readJson<DirectSpatialConditioningVendorRuntimeBlueprint>(
  VENDOR_RUNTIME_BLUEPRINT_PATH
);
if (vendorRuntimeBlueprintOnDisk.system_id !== DSC_VENDOR_RUNTIME_BLUEPRINT_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime blueprint system id mismatch');
  process.exit(1);
}

const vendorRuntimeDefinitionOnDisk = readJson<DirectSpatialConditioningVendorRuntimeDefinition>(
  VENDOR_RUNTIME_DEFINITION_PATH
);
if (vendorRuntimeDefinitionOnDisk.system_id !== DSC_VENDOR_RUNTIME_DEFINITION_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime definition system id mismatch');
  process.exit(1);
}

const vendorRuntimeDescriptorOnDisk = readJson<DirectSpatialConditioningVendorRuntimeDescriptor>(
  VENDOR_RUNTIME_DESCRIPTOR_PATH
);
if (vendorRuntimeDescriptorOnDisk.system_id !== DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime descriptor system id mismatch');
  process.exit(1);
}

const vendorRuntimeContractOnDisk = readJson<DirectSpatialConditioningVendorRuntimeContract>(
  vendorRuntimeDefinitionOnDisk.runtime_contract_ref
);
if (vendorRuntimeContractOnDisk.system_id !== DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime contract system id mismatch');
  process.exit(1);
}

const runtimeSpecification = readJson<DirectSpatialConditioningVendorRuntimeSpecification>(
  vendorRuntimeDefinitionOnDisk.runtime_specification_ref
);
if (runtimeSpecification.system_id !== DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime specification system id mismatch');
  process.exit(1);
}

const runtimeTemplate = readJson<DirectSpatialConditioningVendorRuntimeTemplate>(
  vendorRuntimeDefinitionOnDisk.runtime_template_ref
);
if (runtimeTemplate.system_id !== DSC_VENDOR_RUNTIME_TEMPLATE_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime template system id mismatch');
  process.exit(1);
}

const runtimeRegistry = readJson<DirectSpatialConditioningVendorRuntimeRegistry>(
  VENDOR_RUNTIME_REGISTRY_PATH
);
if (runtimeRegistry.system_id !== DSC_VENDOR_RUNTIME_REGISTRY_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime registry system id mismatch');
  process.exit(1);
}

try {
  buildDirectSpatialConditioningVendorRuntimeBlueprint(projectRoot);
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME BLUEPRINT UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileSet: DirectSpatialConditioningVendorRuntimeProfileSet;
try {
  vendorRuntimeProfileSet =
    buildDirectSpatialConditioningVendorRuntimeProfileSet(projectRoot).vendorRuntimeProfileSet;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE SET UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileCollection: DirectSpatialConditioningVendorRuntimeProfileCollection;
try {
  vendorRuntimeProfileCollection =
    buildDirectSpatialConditioningVendorRuntimeProfileCollection(projectRoot)
      .vendorRuntimeProfileCollection;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE COLLECTION UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileIndex: DirectSpatialConditioningVendorRuntimeProfileIndex;
try {
  vendorRuntimeProfileIndex =
    buildDirectSpatialConditioningVendorRuntimeProfileIndex(projectRoot).vendorRuntimeProfileIndex;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE INDEX UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

try {
  buildDirectSpatialConditioningVendorRuntimeProfileCatalog(projectRoot);
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE CATALOG UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileRegistry: DirectSpatialConditioningVendorRuntimeProfileRegistry;
try {
  vendorRuntimeProfileRegistry =
    buildDirectSpatialConditioningVendorRuntimeProfileRegistry(projectRoot)
      .vendorRuntimeProfileRegistry;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE REGISTRY UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileReference: DirectSpatialConditioningVendorRuntimeProfileReference;
try {
  vendorRuntimeProfileReference =
    buildDirectSpatialConditioningVendorRuntimeProfileReference(projectRoot)
      .vendorRuntimeProfileReference;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE REFERENCE UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileDescriptor: DirectSpatialConditioningVendorRuntimeProfileDescriptor;
try {
  vendorRuntimeProfileDescriptor =
    buildDirectSpatialConditioningVendorRuntimeProfileDescriptor(projectRoot)
      .vendorRuntimeProfileDescriptor;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE DESCRIPTOR UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileDefinition: DirectSpatialConditioningVendorRuntimeProfileDefinition;
try {
  vendorRuntimeProfileDefinition =
    buildDirectSpatialConditioningVendorRuntimeProfileDefinition(projectRoot)
      .vendorRuntimeProfileDefinition;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE DEFINITION UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfilePackage: DirectSpatialConditioningVendorRuntimeProfilePackage;
try {
  vendorRuntimeProfilePackage =
    buildDirectSpatialConditioningVendorRuntimeProfilePackage(projectRoot)
      .vendorRuntimeProfilePackage;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE PACKAGE UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileBundle: DirectSpatialConditioningVendorRuntimeProfileBundle;
try {
  vendorRuntimeProfileBundle =
    buildDirectSpatialConditioningVendorRuntimeProfileBundle(projectRoot)
      .vendorRuntimeProfileBundle;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE BUNDLE UPSTREAM FAILED: ${(error as Error).message}`);
  process.exit(1);
}

let vendorRuntimeProfileArchive: DirectSpatialConditioningVendorRuntimeProfileArchive;
try {
  vendorRuntimeProfileArchive =
    buildDirectSpatialConditioningVendorRuntimeProfileArchive(projectRoot)
      .vendorRuntimeProfileArchive;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME PROFILE ARCHIVE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeProfileArchive.phase !== DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeProfileArchive.phase });
}
if (vendorRuntimeProfileArchive.system_id !== DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_SYSTEM_ID) {
  issues.push({ code: 'SYSTEM_ID', message: vendorRuntimeProfileArchive.system_id });
}
if (vendorRuntimeProfileArchive.mode !== 'design_only_vendor_runtime_profile_archive') {
  issues.push({ code: 'MODE', message: vendorRuntimeProfileArchive.mode });
}
if (vendorRuntimeProfileArchive.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeProfileArchive.target });
}
if (vendorRuntimeProfileArchive.runtime_profile_archive_id !== VENDOR_RUNTIME_PROFILE_ARCHIVE_ID) {
  issues.push({
    code: 'RUNTIME_PROFILE_ARCHIVE_ID',
    message: vendorRuntimeProfileArchive.runtime_profile_archive_id,
  });
}
if (vendorRuntimeProfileArchive.runtime_profile_archive_version !== VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION) {
  issues.push({
    code: 'RUNTIME_PROFILE_ARCHIVE_VERSION',
    message: vendorRuntimeProfileArchive.runtime_profile_archive_version,
  });
}
if (vendorRuntimeProfileArchive.runtime_profile_archive_kind !== 'vendor_runtime_profile_archive') {
  issues.push({
    code: 'RUNTIME_PROFILE_ARCHIVE_KIND',
    message: vendorRuntimeProfileArchive.runtime_profile_archive_kind,
  });
}
if (
  vendorRuntimeProfileRegistry.system_id !== DSC_VENDOR_RUNTIME_PROFILE_REGISTRY_SYSTEM_ID ||
  vendorRuntimeProfileRegistry.runtime_profile_registry_id !== VENDOR_RUNTIME_PROFILE_REGISTRY_ID
) {
  issues.push({
    code: 'NESTED_REGISTRY_SYSTEM_ID',
    message: vendorRuntimeProfileRegistry.system_id,
  });
}
if (
  vendorRuntimeProfileBundle.system_id !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID ||
  vendorRuntimeProfileBundle.runtime_profile_bundle_id !== VENDOR_RUNTIME_PROFILE_BUNDLE_ID
) {
  issues.push({
    code: 'NESTED_BUNDLE_SYSTEM_ID',
    message: vendorRuntimeProfileBundle.system_id,
  });
}
if (
  vendorRuntimeProfilePackage.system_id !== DSC_VENDOR_RUNTIME_PROFILE_PACKAGE_SYSTEM_ID ||
  vendorRuntimeProfilePackage.runtime_profile_package_id !== VENDOR_RUNTIME_PROFILE_PACKAGE_ID
) {
  issues.push({
    code: 'NESTED_PACKAGE_SYSTEM_ID',
    message: vendorRuntimeProfilePackage.system_id,
  });
}

if (
  vendorRuntimeProfileDefinition.system_id !== DSC_VENDOR_RUNTIME_PROFILE_DEFINITION_SYSTEM_ID ||
  vendorRuntimeProfileDefinition.runtime_profile_definition_id !== VENDOR_RUNTIME_PROFILE_DEFINITION_ID
) {
  issues.push({
    code: 'NESTED_DEFINITION_SYSTEM_ID',
    message: vendorRuntimeProfileDefinition.system_id,
  });
}
if (
  vendorRuntimeProfileDescriptor.system_id !== DSC_VENDOR_RUNTIME_PROFILE_DESCRIPTOR_SYSTEM_ID ||
  vendorRuntimeProfileDescriptor.runtime_profile_descriptor_id !== VENDOR_RUNTIME_PROFILE_DESCRIPTOR_ID
) {
  issues.push({
    code: 'NESTED_DESCRIPTOR_SYSTEM_ID',
    message: vendorRuntimeProfileDescriptor.system_id,
  });
}
if (
  vendorRuntimeProfileReference.system_id !== DSC_VENDOR_RUNTIME_PROFILE_REFERENCE_SYSTEM_ID ||
  vendorRuntimeProfileReference.runtime_profile_reference_id !== VENDOR_RUNTIME_PROFILE_REFERENCE_ID
) {
  issues.push({
    code: 'NESTED_REFERENCE_SYSTEM_ID',
    message: vendorRuntimeProfileReference.system_id,
  });
}

if (
  vendorRuntimeProfileRegistry.vendor_runtime_profile_catalog_binding.runtime_profile_catalog_id !==
    VENDOR_RUNTIME_PROFILE_CATALOG_ID ||
  vendorRuntimeProfileCatalogOnDisk.system_id !== DSC_VENDOR_RUNTIME_PROFILE_CATALOG_SYSTEM_ID
) {
  issues.push({
    code: 'NESTED_CATALOG_SYSTEM_ID',
    message: vendorRuntimeProfileCatalogOnDisk.system_id,
  });
}
if (
  vendorRuntimeProfileIndex.system_id !== DSC_VENDOR_RUNTIME_PROFILE_INDEX_SYSTEM_ID ||
  vendorRuntimeProfileIndex.runtime_profile_index_id !== VENDOR_RUNTIME_PROFILE_INDEX_ID
) {
  issues.push({
    code: 'NESTED_INDEX_SYSTEM_ID',
    message: vendorRuntimeProfileIndex.system_id,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'runtime_profile_bundle_ref',
    vendorRuntimeProfileArchive.runtime_profile_bundle_ref,
    VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
  ],
  [
    'runtime_profile_bundle_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_bundle_schema_ref,
    VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
  ],
  [
    'runtime_profile_bundle_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_bundle_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_bundle_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_bundle_evidence_ref,
    VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
  ],
  [
    'runtime_profile_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_ref,
    VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
  ],
  [
    'runtime_profile_registry_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_schema_ref,
    VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
  ],
  [
    'runtime_profile_registry_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_registry_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_evidence_ref,
    VENDOR_RUNTIME_PROFILE_REGISTRY_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_profile_catalog_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_ref,
    VENDOR_RUNTIME_PROFILE_CATALOG_PATH,
  ],
  [
    'runtime_profile_catalog_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_schema_ref,
    VENDOR_RUNTIME_PROFILE_CATALOG_SCHEMA_PATH,
  ],
  [
    'runtime_profile_catalog_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_catalog_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_evidence_ref,
    VENDOR_RUNTIME_PROFILE_CATALOG_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_profile_index_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_ref,
    VENDOR_RUNTIME_PROFILE_INDEX_PATH,
  ],
  [
    'runtime_profile_index_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_schema_ref,
    VENDOR_RUNTIME_PROFILE_INDEX_SCHEMA_PATH,
  ],
  [
    'runtime_profile_index_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_index_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_evidence_ref,
    VENDOR_RUNTIME_PROFILE_INDEX_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_profile_collection_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_ref,
    VENDOR_RUNTIME_PROFILE_COLLECTION_PATH,
  ],
  [
    'runtime_profile_collection_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_schema_ref,
    VENDOR_RUNTIME_PROFILE_COLLECTION_SCHEMA_PATH,
  ],
  [
    'runtime_profile_collection_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_COLLECTION_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_collection_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_evidence_ref,
    VENDOR_RUNTIME_PROFILE_COLLECTION_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_profile_set_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_ref,
    VENDOR_RUNTIME_PROFILE_SET_PATH,
  ],
  [
    'runtime_profile_set_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_schema_ref,
    VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
  ],
  [
    'runtime_profile_set_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_implementation_registry_ref,
    VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_profile_set_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_evidence_ref,
    VENDOR_RUNTIME_PROFILE_SET_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_blueprint_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_ref,
    VENDOR_RUNTIME_BLUEPRINT_PATH,
  ],
  [
    'runtime_blueprint_schema_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_schema_ref,
    VENDOR_RUNTIME_BLUEPRINT_SCHEMA_PATH,
  ],
  [
    'runtime_blueprint_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_implementation_registry_ref,
    VENDOR_RUNTIME_BLUEPRINT_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_blueprint_evidence_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_evidence_ref,
    VENDOR_RUNTIME_BLUEPRINT_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_definition_ref',
    vendorRuntimeProfileArchive.runtime_definition_ref,
    VENDOR_RUNTIME_DEFINITION_PATH,
  ],
  [
    'runtime_definition_schema_ref',
    vendorRuntimeProfileArchive.runtime_definition_schema_ref,
    VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
  ],
  [
    'runtime_definition_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_definition_implementation_registry_ref,
    VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_definition_evidence_ref',
    vendorRuntimeProfileArchive.runtime_definition_evidence_ref,
    VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_descriptor_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_ref,
    VENDOR_RUNTIME_DESCRIPTOR_PATH,
  ],
  [
    'runtime_descriptor_schema_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_schema_ref,
    VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  ],
  [
    'runtime_descriptor_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_implementation_registry_ref,
    VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_descriptor_evidence_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_evidence_ref,
    VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
  ],
  [
    'runtime_contract_ref',
    vendorRuntimeProfileArchive.runtime_contract_ref,
    VENDOR_RUNTIME_CONTRACT_PATH,
  ],
  [
    'runtime_contract_schema_ref',
    vendorRuntimeProfileArchive.runtime_contract_schema_ref,
    VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  ],
  [
    'runtime_contract_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_contract_implementation_registry_ref,
    VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_contract_evidence_ref',
    vendorRuntimeProfileArchive.runtime_contract_evidence_ref,
    VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
  ],
  [
    'runtime_specification_ref',
    vendorRuntimeProfileArchive.runtime_specification_ref,
    VENDOR_RUNTIME_SPECIFICATION_PATH,
  ],
  [
    'runtime_specification_schema_ref',
    vendorRuntimeProfileArchive.runtime_specification_schema_ref,
    VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  ],
  [
    'runtime_specification_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_specification_implementation_registry_ref,
    VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_specification_evidence_ref',
    vendorRuntimeProfileArchive.runtime_specification_evidence_ref,
    VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
  ],
  [
    'runtime_template_ref',
    vendorRuntimeProfileArchive.runtime_template_ref,
    VENDOR_RUNTIME_TEMPLATE_PATH,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeProfileArchive.runtime_template_schema_ref,
    VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_template_implementation_registry_ref,
    VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeProfileArchive.runtime_template_evidence_ref,
    VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
  ],
  ['runtime_family_ref', vendorRuntimeProfileArchive.runtime_family_ref, VENDOR_RUNTIME_FAMILY_PATH],
  [
    'runtime_family_schema_ref',
    vendorRuntimeProfileArchive.runtime_family_schema_ref,
    VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  ],
  [
    'runtime_family_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_family_implementation_registry_ref,
    VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_family_evidence_ref',
    vendorRuntimeProfileArchive.runtime_family_evidence_ref,
    VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
  ],
  [
    'runtime_catalog_ref',
    vendorRuntimeProfileArchive.runtime_catalog_ref,
    VENDOR_RUNTIME_CATALOG_PATH,
  ],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeProfileArchive.runtime_catalog_schema_ref,
    VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_catalog_implementation_registry_ref,
    VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeProfileArchive.runtime_catalog_evidence_ref,
    VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
  ],
  ['runtime_index_ref', vendorRuntimeProfileArchive.runtime_index_ref, VENDOR_RUNTIME_INDEX_PATH],
  [
    'runtime_index_schema_ref',
    vendorRuntimeProfileArchive.runtime_index_schema_ref,
    VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_index_implementation_registry_ref,
    VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeProfileArchive.runtime_index_evidence_ref,
    VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeProfileArchive.runtime_registry_ref,
    VENDOR_RUNTIME_REGISTRY_PATH,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeProfileArchive.runtime_profile_ref,
    VENDOR_RUNTIME_PROFILE_PATH,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeProfileArchive.runtime_bundle_ref,
    VENDOR_RUNTIME_BUNDLE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeProfileArchive.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeProfileArchive.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeProfileArchive.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeProfileArchive.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeProfileArchive.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeProfileArchive.numerical_runtime_package_ref,
    RUNTIME_PACKAGE_PATH,
  ],
];
for (const [code, actual, expected] of refChecks) {
  if (actual !== expected) {
    issues.push({ code: `REF_${code.toUpperCase()}`, message: actual });
  }
  if (!fs.existsSync(path.join(projectRoot, expected))) {
    issues.push({ code: `UNRESOLVED_${code.toUpperCase()}`, message: expected });
  }
}

const chainRefChecks: Array<[string, string, string]> = [
  [
    'runtime_profile_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_registry_ref,
  ],
  [
    'runtime_profile_registry_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_registry_schema_ref,
  ],
  [
    'runtime_profile_registry_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_registry_implementation_registry_ref,
  ],
  [
    'runtime_profile_registry_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_registry_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_registry_evidence_ref,
  ],
  [
    'runtime_profile_catalog_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_catalog_ref,
  ],
  [
    'runtime_profile_catalog_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_catalog_schema_ref,
  ],
  [
    'runtime_profile_catalog_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_catalog_implementation_registry_ref,
  ],
  [
    'runtime_profile_catalog_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_catalog_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_catalog_evidence_ref,
  ],
  [
    'runtime_profile_index_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_index_ref,
  ],
  [
    'runtime_profile_index_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_index_schema_ref,
  ],
  [
    'runtime_profile_index_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_index_implementation_registry_ref,
  ],
  [
    'runtime_profile_index_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_index_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_index_evidence_ref,
  ],
  [
    'runtime_profile_collection_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_collection_ref,
  ],
  [
    'runtime_profile_collection_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_collection_schema_ref,
  ],
  [
    'runtime_profile_collection_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_collection_implementation_registry_ref,
  ],
  [
    'runtime_profile_collection_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_collection_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_collection_evidence_ref,
  ],
  [
    'runtime_profile_set_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_set_ref,
  ],
  [
    'runtime_profile_set_schema_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_set_schema_ref,
  ],
  [
    'runtime_profile_set_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_set_implementation_registry_ref,
  ],
  [
    'runtime_profile_set_evidence_ref',
    vendorRuntimeProfileArchive.runtime_profile_set_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_set_evidence_ref,
  ],
  [
    'runtime_blueprint_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_blueprint_ref,
  ],
  [
    'runtime_blueprint_schema_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_blueprint_schema_ref,
  ],
  [
    'runtime_blueprint_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_blueprint_implementation_registry_ref,
  ],
  [
    'runtime_blueprint_evidence_ref',
    vendorRuntimeProfileArchive.runtime_blueprint_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_blueprint_evidence_ref,
  ],
  [
    'runtime_definition_ref',
    vendorRuntimeProfileArchive.runtime_definition_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_definition_ref,
  ],
  [
    'runtime_definition_schema_ref',
    vendorRuntimeProfileArchive.runtime_definition_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_definition_schema_ref,
  ],
  [
    'runtime_definition_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_definition_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_definition_implementation_registry_ref,
  ],
  [
    'runtime_definition_evidence_ref',
    vendorRuntimeProfileArchive.runtime_definition_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_definition_evidence_ref,
  ],
  [
    'runtime_descriptor_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_descriptor_ref,
  ],
  [
    'runtime_descriptor_schema_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_descriptor_schema_ref,
  ],
  [
    'runtime_descriptor_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_descriptor_implementation_registry_ref,
  ],
  [
    'runtime_descriptor_evidence_ref',
    vendorRuntimeProfileArchive.runtime_descriptor_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_descriptor_evidence_ref,
  ],
  [
    'runtime_contract_ref',
    vendorRuntimeProfileArchive.runtime_contract_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_contract_ref,
  ],
  [
    'runtime_contract_schema_ref',
    vendorRuntimeProfileArchive.runtime_contract_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_contract_schema_ref,
  ],
  [
    'runtime_contract_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_contract_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_contract_implementation_registry_ref,
  ],
  [
    'runtime_contract_evidence_ref',
    vendorRuntimeProfileArchive.runtime_contract_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_contract_evidence_ref,
  ],
  [
    'runtime_specification_ref',
    vendorRuntimeProfileArchive.runtime_specification_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_specification_ref,
  ],
  [
    'runtime_specification_schema_ref',
    vendorRuntimeProfileArchive.runtime_specification_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_specification_schema_ref,
  ],
  [
    'runtime_specification_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_specification_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_specification_implementation_registry_ref,
  ],
  [
    'runtime_specification_evidence_ref',
    vendorRuntimeProfileArchive.runtime_specification_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_specification_evidence_ref,
  ],
  [
    'runtime_template_ref',
    vendorRuntimeProfileArchive.runtime_template_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_template_ref,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeProfileArchive.runtime_template_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_template_schema_ref,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_template_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_template_implementation_registry_ref,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeProfileArchive.runtime_template_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_template_evidence_ref,
  ],
  [
    'runtime_family_ref',
    vendorRuntimeProfileArchive.runtime_family_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_family_ref,
  ],
  [
    'runtime_family_schema_ref',
    vendorRuntimeProfileArchive.runtime_family_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_family_schema_ref,
  ],
  [
    'runtime_family_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_family_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_family_implementation_registry_ref,
  ],
  [
    'runtime_family_evidence_ref',
    vendorRuntimeProfileArchive.runtime_family_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_family_evidence_ref,
  ],
  [
    'runtime_catalog_ref',
    vendorRuntimeProfileArchive.runtime_catalog_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_catalog_ref,
  ],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeProfileArchive.runtime_catalog_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_catalog_schema_ref,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_catalog_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_catalog_implementation_registry_ref,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeProfileArchive.runtime_catalog_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_catalog_evidence_ref,
  ],
  [
    'runtime_index_ref',
    vendorRuntimeProfileArchive.runtime_index_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_index_ref,
  ],
  [
    'runtime_index_schema_ref',
    vendorRuntimeProfileArchive.runtime_index_schema_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_index_schema_ref,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeProfileArchive.runtime_index_implementation_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_index_implementation_registry_ref,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeProfileArchive.runtime_index_evidence_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_index_evidence_ref,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeProfileArchive.runtime_registry_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_registry_ref,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeProfileArchive.runtime_profile_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_profile_ref,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeProfileArchive.runtime_bundle_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_bundle_ref,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeProfileArchive.runtime_package_ref,
    vendorRuntimeProfileBundleOnDisk.runtime_package_ref,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeProfileArchive.reference_bundle_ref,
    vendorRuntimeProfileBundleOnDisk.reference_bundle_ref,
  ],
  ['package_ref', vendorRuntimeProfileArchive.package_ref, vendorRuntimeProfileBundleOnDisk.package_ref],
  ['template_ref', vendorRuntimeProfileArchive.template_ref, vendorRuntimeProfileBundleOnDisk.template_ref],
  [
    'template_certification_ref',
    vendorRuntimeProfileArchive.template_certification_ref,
    vendorRuntimeProfileBundleOnDisk.template_certification_ref,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeProfileArchive.numerical_runtime_package_ref,
    vendorRuntimeProfileBundleOnDisk.numerical_runtime_package_ref,
  ],
];
for (const [code, actual, expected] of chainRefChecks) {
  if (actual !== expected) {
    issues.push({ code: `CHAIN_${code.toUpperCase()}`, message: actual });
  }
}

if (
  JSON.stringify(vendorRuntimeProfileArchive.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeProfileArchive.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeProfileArchive.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeProfileArchive.required_channels.join(','),
  });
}
if (vendorRuntimeProfileArchive.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeProfileArchive.spatial_frame_ref });
}
if (
  vendorRuntimeProfileArchive.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeProfileArchive.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeProfileArchive.capability_set_id}@${vendorRuntimeProfileArchive.capability_set_version}`,
  });
}

const runtimeCatalog = readJson<DirectSpatialConditioningVendorRuntimeCatalog>(
  vendorRuntimeDefinitionOnDisk.runtime_catalog_ref
);

const runtimeProfileBundleManifest =
  vendorRuntimeProfileBundle.runtime_profile_bundle_manifest;
const runtimeBlueprintManifest = vendorRuntimeBlueprintOnDisk.runtime_blueprint_manifest;
const runtimeDefinitionManifest = vendorRuntimeDefinitionOnDisk.runtime_definition_manifest;
const runtimeDescriptorManifest = vendorRuntimeDescriptorOnDisk.runtime_descriptor_manifest;
const runtimeContractManifest = vendorRuntimeContractOnDisk.runtime_contract_manifest;

// 1) Runtime profile bundle schema.
const registrySchema = vendorRuntimeProfileArchive.runtime_profile_archive_schema;
if (registrySchema.schema_id !== 'dsc-vendor-runtime-profile-archive-schema-v1') {
  issues.push({ code: 'RUNTIME_PROFILE_REGISTRY_SCHEMA_ID', message: registrySchema.schema_id });
}
if (
  registrySchema.encoding !== 'application/json' ||
  registrySchema.runtime_profile_archive_id_policy !==
    'opaque_runtime_profile_archive_id_no_vendor_binding' ||
  registrySchema.runtime_profile_bundle_ref !== VENDOR_RUNTIME_PROFILE_BUNDLE_ID ||
  registrySchema.optional_fields.length !== 0 ||
  registrySchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_PROFILE_REGISTRY_SCHEMA_POLICY',
    message: registrySchema.runtime_profile_archive_id_policy,
  });
}
const schemaFields = registrySchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_PROFILE_REGISTRY_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of registrySchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({
      code: 'RUNTIME_PROFILE_REGISTRY_SCHEMA_FIELD_INCOMPLETE',
      message: field.field,
    });
  }
}

// 2) Deterministic runtime profile bundle identity.
const identity = vendorRuntimeProfileArchive.deterministic_runtime_profile_archive_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-profile-archive-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_profile_archive_id !== VENDOR_RUNTIME_PROFILE_ARCHIVE_ID ||
  identity.runtime_profile_archive_version !== VENDOR_RUNTIME_PROFILE_ARCHIVE_VERSION ||
  identity.identity_policy !== 'opaque_runtime_profile_archive_id_no_vendor_binding' ||
  identity.derivation !== 'literal_constant_declared_at_design_time' ||
  identity.purity !== 'deterministic_pure_constant' ||
  identity.seed_dependence !== 'none' ||
  identity.time_dependence !== 'none' ||
  identity.randomness !== 'none' ||
  identity.vendor_binding !== 'none' ||
  identity.framework_binding !== 'none' ||
  identity.device_binding !== 'none' ||
  identity.vendor_name !== 'none' ||
  identity.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'IDENTITY_POLICY', message: identity.derivation });
}
if (
  identity.capability_set_id !== CAPABILITY_SET_ID ||
  identity.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({ code: 'IDENTITY_CAPABILITY_SET', message: identity.capability_set_id });
}
if (
  JSON.stringify(identity.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'IDENTITY_CHANNELS', message: identity.required_channels.join(',') });
}


// 3) Vendor Runtime Profile Bundle binding.
const binding = vendorRuntimeProfileArchive.vendor_runtime_profile_bundle_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-profile-archive-profile-bundle-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_profile_bundle_ref !== VENDOR_RUNTIME_PROFILE_BUNDLE_PATH ||
  binding.runtime_profile_bundle_id !== VENDOR_RUNTIME_PROFILE_BUNDLE_ID ||
  binding.runtime_profile_bundle_version !== VENDOR_RUNTIME_PROFILE_BUNDLE_VERSION ||
  binding.runtime_profile_bundle_phase !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_PHASE ||
  binding.runtime_profile_bundle_system_id !== DSC_VENDOR_RUNTIME_PROFILE_BUNDLE_SYSTEM_ID ||
  binding.runtime_profile_bundle_evidence_ref !==
    VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH ||
  binding.runtime_profile_bundle_verdict !== VENDOR_RUNTIME_PROFILE_BUNDLE_VERDICT ||
  binding.runtime_profile_bundle_evidence_mode !== 'phase_123_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_profile_archive_root' ||
  binding.archives_profile_bundle_in_this_phase ||
  binding.implements_runtime_profile_bundle_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_profile_bundle_id !== vendorRuntimeProfileBundleOnDisk.runtime_profile_bundle_id ||
  binding.runtime_profile_bundle_version !== vendorRuntimeProfileBundleOnDisk.runtime_profile_bundle_version
) {
  issues.push({ code: 'BINDING_PROFILE_INDEX_DRIFT', message: binding.runtime_profile_bundle_id });
}

// 4) Runtime profile bundle composition.
const composition = vendorRuntimeProfileArchive.runtime_profile_archive_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-profile-archive-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_profile_bundle' ||
  composition.section_order !== 'fixed_declared_order' ||
  !composition.closed_set ||
  composition.vendor_specific_sections !== 'forbidden' ||
  composition.includes_implementations ||
  composition.declares_runtime_execution
) {
  issues.push({
    code: 'COMPOSITION_POLICY',
    message: composition.vendor_specific_sections,
  });
}
const sectionIds = composition.sections.map((section) => section.section_id);
if (JSON.stringify(sectionIds) !== JSON.stringify(EXPECTED_SECTION_IDS)) {
  issues.push({ code: 'COMPOSITION_SECTIONS', message: sectionIds.join(',') });
}
composition.sections.forEach((section, index) => {
  if (section.order !== index + 1) {
    issues.push({ code: 'SECTION_ORDER', message: section.section_id });
  }
  if (!fs.existsSync(path.join(projectRoot, section.artifact_ref))) {
    issues.push({ code: 'SECTION_UNRESOLVED', message: section.artifact_ref });
  }
  if (!section.role || !section.kind) {
    issues.push({ code: 'SECTION_INCOMPLETE', message: section.section_id });
  }
});
if (new Set(sectionIds).size !== sectionIds.length) {
  issues.push({ code: 'SECTION_ID_DUPLICATE', message: `${sectionIds.length}` });
}
const sectionRefs = composition.sections.map((section) => section.artifact_ref);
if (new Set(sectionRefs).size !== sectionRefs.length) {
  issues.push({ code: 'SECTION_REF_DUPLICATE', message: `${sectionRefs.length}` });
}

const profileRegistryMemberRefs = new Set(
  runtimeProfileBundleManifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_profile_bundle' &&
    profileRegistryMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_PROFILE_CATALOG_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !==
    'runtime_profile_bundle_contents_sealed_via_runtime_profile_bundle_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_PROFILE_BUNDLE_ID ||
  transitive.re_lists_runtime_profile_bundle_contents ||
  transitive.sealed_component_count !== runtimeProfileBundleManifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime profile bundle manifest.
const manifest = vendorRuntimeProfileArchive.runtime_profile_archive_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-profile-archive-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_profile_archive_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_profile_bundle_digest' ||
  manifest.verifies_implementations_in_this_phase
) {
  issues.push({ code: 'MANIFEST_POLICY', message: manifest.integrity_method });
}
if (manifest.entry_count !== manifest.entries.length) {
  issues.push({ code: 'MANIFEST_ENTRY_COUNT', message: `${manifest.entry_count}` });
}
if (manifest.entries.length !== composition.sections.length) {
  issues.push({
    code: 'MANIFEST_COMPOSITION_MISMATCH',
    message: `${manifest.entries.length}`,
  });
}
const manifestSectionIds = manifest.entries.map((entry) => entry.section_id);
if (JSON.stringify(manifestSectionIds) !== JSON.stringify(EXPECTED_SECTION_IDS)) {
  issues.push({ code: 'MANIFEST_SECTIONS', message: manifestSectionIds.join(',') });
}
for (const entry of manifest.entries) {
  if (!entry.content_addressed || !/^[a-f0-9]{64}$/.test(entry.sha256) || entry.bytes < 1) {
    issues.push({ code: 'MANIFEST_ENTRY_INCOMPLETE', message: entry.section_id });
    continue;
  }
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({ code: 'MANIFEST_DIGEST_DRIFT', message: entry.section_id });
  }
}

for (const entry of runtimeDefinitionManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_DEFINITION_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeDefinitionDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeDefinitionManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_runtime_descriptor:${runtimeDefinitionManifest.sealed_runtime_descriptor_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeDefinitionDigest !== runtimeDefinitionManifest.runtime_definition_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_DEFINITION_DIGEST_DRIFT',
    message: recomputedRuntimeDefinitionDigest,
  });
}

for (const entry of runtimeDescriptorManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_DESCRIPTOR_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeDescriptorDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeDescriptorManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_runtime_contract:${runtimeDescriptorManifest.sealed_runtime_contract_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeDescriptorDigest !== runtimeDescriptorManifest.runtime_descriptor_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_DESCRIPTOR_DIGEST_DRIFT',
    message: recomputedRuntimeDescriptorDigest,
  });
}

for (const entry of runtimeContractManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_CONTRACT_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeContractDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeContractManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_runtime_specification:${runtimeContractManifest.sealed_runtime_specification_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeContractDigest !== runtimeContractManifest.runtime_contract_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_CONTRACT_DIGEST_DRIFT',
    message: recomputedRuntimeContractDigest,
  });
}

const runtimeSpecificationManifest = runtimeSpecification.runtime_specification_manifest;
for (const entry of runtimeSpecificationManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_SPECIFICATION_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeSpecificationDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeSpecificationManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_runtime_template:${runtimeSpecificationManifest.sealed_runtime_template_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (
  recomputedRuntimeSpecificationDigest !==
  runtimeSpecificationManifest.runtime_specification_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_SPECIFICATION_DIGEST_DRIFT',
    message: recomputedRuntimeSpecificationDigest,
  });
}

const runtimeTemplateManifest = runtimeTemplate.runtime_template_manifest;
for (const entry of runtimeTemplateManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_TEMPLATE_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeTemplateDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeTemplateManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_family:${runtimeTemplateManifest.sealed_runtime_family_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeTemplateDigest !== runtimeTemplateManifest.runtime_template_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_TEMPLATE_DIGEST_DRIFT',
    message: recomputedRuntimeTemplateDigest,
  });
}

const runtimeCatalogManifest = runtimeCatalog.runtime_catalog_manifest;
for (const entry of runtimeCatalogManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_CATALOG_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeCatalogDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeCatalogManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_index:${runtimeCatalogManifest.sealed_runtime_index_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeCatalogDigest !== runtimeCatalogManifest.runtime_catalog_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_CATALOG_DIGEST_DRIFT',
    message: recomputedRuntimeCatalogDigest,
  });
}

const runtimeIndex = readJson<DirectSpatialConditioningVendorRuntimeIndex>(
  VENDOR_RUNTIME_INDEX_PATH
);
const runtimeIndexManifest = runtimeIndex.runtime_index_manifest;
for (const entry of runtimeIndexManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_INDEX_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeIndexDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeIndexManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_registry:${runtimeIndexManifest.sealed_runtime_registry_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeIndexDigest !== runtimeIndexManifest.runtime_index_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_DRIFT',
    message: recomputedRuntimeIndexDigest,
  });
}

const runtimeRegistryManifest = runtimeRegistry.runtime_registry_manifest;
for (const entry of runtimeRegistryManifest.entries) {
  if (sha256(entry.artifact_ref) !== entry.sha256) {
    issues.push({
      code: 'SEALED_RUNTIME_REGISTRY_SECTION_DRIFT',
      message: entry.artifact_ref,
    });
  }
}
const recomputedRuntimeRegistryDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeRegistryManifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_profile:${runtimeRegistryManifest.sealed_runtime_profile_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (recomputedRuntimeRegistryDigest !== runtimeRegistryManifest.runtime_registry_digest) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_DRIFT',
    message: recomputedRuntimeRegistryDigest,
  });
}

if (
  manifest.sealed_runtime_profile_package_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_package_digest ||
  binding.sealed_runtime_profile_package_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_package_digest,
  });
}
if (
  manifest.sealed_runtime_profile_definition_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_definition_digest ||
  binding.sealed_runtime_profile_definition_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_definition_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DEFINITION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_definition_digest,
  });
}
if (
  manifest.sealed_runtime_profile_descriptor_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_descriptor_digest ||
  binding.sealed_runtime_profile_descriptor_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_descriptor_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DESCRIPTOR_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_descriptor_digest,
  });
}
if (
  manifest.sealed_runtime_profile_reference_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_reference_digest ||
  binding.sealed_runtime_profile_reference_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_reference_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_REFERENCE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_reference_digest,
  });
}
if (
  manifest.sealed_runtime_profile_registry_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_registry_digest ||
  binding.sealed_runtime_profile_registry_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_catalog_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_catalog_digest ||
  binding.sealed_runtime_profile_catalog_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_catalog_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_CATALOG_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_catalog_digest,
  });
}
if (
  manifest.sealed_runtime_profile_index_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_index_digest ||
  binding.sealed_runtime_profile_index_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_index_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_INDEX_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_index_digest,
  });
}
if (
  manifest.sealed_runtime_profile_collection_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_collection_digest ||
  binding.sealed_runtime_profile_collection_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_collection_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_COLLECTION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_collection_digest,
  });
}
if (
  manifest.sealed_runtime_profile_set_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_set_digest ||
  binding.sealed_runtime_profile_set_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_set_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_SET_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_set_digest,
  });
}
if (
  manifest.sealed_runtime_blueprint_digest !==
    runtimeProfileBundleManifest.sealed_runtime_blueprint_digest ||
  binding.sealed_runtime_blueprint_digest !==
    runtimeProfileBundleManifest.sealed_runtime_blueprint_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BLUEPRINT_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_blueprint_digest,
  });
}
if (
  manifest.sealed_runtime_definition_digest !==
    runtimeProfileBundleManifest.sealed_runtime_definition_digest ||
  binding.sealed_runtime_definition_digest !== runtimeProfileBundleManifest.sealed_runtime_definition_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_DEFINITION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_definition_digest,
  });
}
if (
  manifest.sealed_runtime_descriptor_digest !==
    runtimeProfileBundleManifest.sealed_runtime_descriptor_digest ||
  binding.sealed_runtime_descriptor_digest !== runtimeProfileBundleManifest.sealed_runtime_descriptor_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_DESCRIPTOR_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_descriptor_digest,
  });
}
if (
  manifest.sealed_runtime_contract_digest !== runtimeProfileBundleManifest.sealed_runtime_contract_digest ||
  binding.sealed_runtime_contract_digest !== runtimeProfileBundleManifest.sealed_runtime_contract_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_CONTRACT_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_contract_digest,
  });
}
if (
  manifest.sealed_runtime_specification_digest !==
    runtimeProfileBundleManifest.sealed_runtime_specification_digest ||
  binding.sealed_runtime_specification_digest !==
    runtimeProfileBundleManifest.sealed_runtime_specification_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_SPECIFICATION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_specification_digest,
  });
}
if (
  manifest.sealed_runtime_template_digest !== runtimeProfileBundleManifest.sealed_runtime_template_digest ||
  binding.sealed_runtime_template_digest !== runtimeProfileBundleManifest.sealed_runtime_template_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_TEMPLATE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_template_digest,
  });
}
if (
  manifest.sealed_runtime_family_digest !== runtimeProfileBundleManifest.sealed_runtime_family_digest ||
  binding.sealed_runtime_family_digest !== runtimeProfileBundleManifest.sealed_runtime_family_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_FAMILY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_family_digest,
  });
}
if (
  manifest.sealed_runtime_catalog_digest !== runtimeProfileBundleManifest.sealed_runtime_catalog_digest ||
  binding.sealed_runtime_catalog_digest !== runtimeProfileBundleManifest.sealed_runtime_catalog_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_CATALOG_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_catalog_digest,
  });
}
if (
  manifest.sealed_runtime_index_digest !== runtimeProfileBundleManifest.sealed_runtime_index_digest ||
  binding.sealed_runtime_index_digest !== runtimeProfileBundleManifest.sealed_runtime_index_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_index_digest,
  });
}
if (
  manifest.sealed_runtime_registry_digest !==
    runtimeProfileBundleManifest.sealed_runtime_registry_digest ||
  binding.sealed_runtime_registry_digest !==
    runtimeProfileBundleManifest.sealed_runtime_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_digest !==
    runtimeProfileBundleManifest.sealed_runtime_profile_digest ||
  binding.sealed_runtime_profile_digest !== runtimeProfileBundleManifest.sealed_runtime_profile_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_digest,
  });
}
if (
  manifest.sealed_runtime_bundle_digest !==
    runtimeProfileBundleManifest.sealed_runtime_bundle_digest ||
  binding.sealed_runtime_bundle_digest !== runtimeProfileBundleManifest.sealed_runtime_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_ARCHIVE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_bundle_digest,
  });
}
if (
  manifest.sealed_runtime_package_digest !==
    runtimeProfileBundleManifest.sealed_runtime_package_digest ||
  binding.sealed_runtime_package_digest !== runtimeProfileBundleManifest.sealed_runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimeProfileBundleManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimeProfileBundleManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeProfileArchiveDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_profile_bundle:${manifest.sealed_runtime_profile_bundle_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_profile_archive_digest !== expectedRuntimeProfileArchiveDigest) {
  issues.push({
    code: 'RUNTIME_PROFILE_ARCHIVE_DIGEST_DRIFT',
    message: manifest.runtime_profile_archive_digest,
  });
}

// Recompute upstream package digest with exact profile-package builder formula.
const expectedUpstreamReferenceDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...runtimeProfileBundleManifest.entries.map(
        (entry) => `${entry.section_id}:${entry.sha256}`
      ),
      `sealed_runtime_profile_package:${runtimeProfileBundleManifest.sealed_runtime_profile_package_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (
  runtimeProfileBundleManifest.runtime_profile_bundle_digest !==
  expectedUpstreamReferenceDigest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_BUNDLE_DIGEST_DRIFT',
    message: expectedUpstreamReferenceDigest,
  });
}
if (
  manifest.sealed_runtime_profile_bundle_digest !==
    runtimeProfileBundleManifest.runtime_profile_bundle_digest ||
  binding.sealed_runtime_profile_bundle_digest !==
    runtimeProfileBundleManifest.runtime_profile_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_bundle_digest,
  });
}

const entries = vendorRuntimeProfileArchive.profile_archive_runtime_entries;
if (
  entries.count !== 0 ||
  entries.entries.length !== 0 ||
  entries.archives_profile_bundle_in_this_phase ||
  !entries.archiving_policy
) {
  issues.push({ code: 'PROFILE_REGISTRY_RUNTIME_ENTRIES', message: `${entries.count}` });
}

const constraints = vendorRuntimeProfileArchive.design_constraints;
if (
  !constraints.runtime_profile_archive_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_profile_bundle ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.archives_profile_bundle_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeProfileArchive);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeProfileArchive(projectRoot)
  .vendorRuntimeProfileArchive;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeProfileArchive.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeProfileArchive);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_profile_archive_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_PROFILE_ARCHIVE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeProfileArchive.mode,
  runtime_profile_archive_id: vendorRuntimeProfileArchive.runtime_profile_archive_id,
  runtime_profile_archive_version: vendorRuntimeProfileArchive.runtime_profile_archive_version,
  runtime_profile_archive_kind: vendorRuntimeProfileArchive.runtime_profile_archive_kind,
  runtime_profile_archive_schema: registrySchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_profile_archive_identity: identity.identity_id,
  vendor_runtime_profile_bundle_binding: binding.binding_id,
  runtime_profile_bundle_verdict: binding.runtime_profile_bundle_verdict,
  runtime_profile_bundle_evidence_mode: binding.runtime_profile_bundle_evidence_mode,
  runtime_profile_archive_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_profile_archive_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_profile_bundle_digest: manifest.sealed_runtime_profile_bundle_digest,
  runtime_profile_archive_digest: manifest.runtime_profile_archive_digest,
  profile_archive_runtime_entries: entries.count,
  sources_supported: vendorRuntimeProfileArchive.sources_supported.length,
  reuses_certified_vendor_runtime_profile_bundle: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeProfileArchive.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_profile_archive: VENDOR_RUNTIME_PROFILE_ARCHIVE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_profile_bundle: VENDOR_RUNTIME_PROFILE_BUNDLE_PATH,
    runtime_profile_bundle_schema: VENDOR_RUNTIME_PROFILE_BUNDLE_SCHEMA_PATH,
    runtime_profile_bundle_implementation_registry:
      VENDOR_RUNTIME_PROFILE_BUNDLE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_bundle_evidence: VENDOR_RUNTIME_PROFILE_BUNDLE_EVIDENCE_PATH,
    runtime_profile_package: VENDOR_RUNTIME_PROFILE_PACKAGE_PATH,
    runtime_profile_package_schema: VENDOR_RUNTIME_PROFILE_PACKAGE_SCHEMA_PATH,
    runtime_profile_package_implementation_registry:
      VENDOR_RUNTIME_PROFILE_PACKAGE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_package_evidence: VENDOR_RUNTIME_PROFILE_PACKAGE_VALIDATION_REPORT_PATH,
    runtime_profile_definition: VENDOR_RUNTIME_PROFILE_DEFINITION_PATH,
    runtime_profile_definition_schema: VENDOR_RUNTIME_PROFILE_DEFINITION_SCHEMA_PATH,
    runtime_profile_definition_implementation_registry:
      VENDOR_RUNTIME_PROFILE_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_definition_evidence: VENDOR_RUNTIME_PROFILE_DEFINITION_VALIDATION_REPORT_PATH,
    runtime_profile_descriptor: VENDOR_RUNTIME_PROFILE_DESCRIPTOR_PATH,
    runtime_profile_descriptor_schema: VENDOR_RUNTIME_PROFILE_DESCRIPTOR_SCHEMA_PATH,
    runtime_profile_descriptor_implementation_registry:
      VENDOR_RUNTIME_PROFILE_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_descriptor_evidence: VENDOR_RUNTIME_PROFILE_DESCRIPTOR_VALIDATION_REPORT_PATH,
    runtime_profile_reference: VENDOR_RUNTIME_PROFILE_REFERENCE_PATH,
    runtime_profile_reference_schema: VENDOR_RUNTIME_PROFILE_REFERENCE_SCHEMA_PATH,
    runtime_profile_reference_implementation_registry:
      VENDOR_RUNTIME_PROFILE_REFERENCE_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_reference_evidence: VENDOR_RUNTIME_PROFILE_REFERENCE_VALIDATION_REPORT_PATH,
    runtime_profile_registry: VENDOR_RUNTIME_PROFILE_REGISTRY_PATH,
    runtime_profile_registry_schema: VENDOR_RUNTIME_PROFILE_REGISTRY_SCHEMA_PATH,
    runtime_profile_registry_implementation_registry:
      VENDOR_RUNTIME_PROFILE_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_registry_evidence: VENDOR_RUNTIME_PROFILE_REGISTRY_VALIDATION_REPORT_PATH,
    runtime_profile_catalog: VENDOR_RUNTIME_PROFILE_CATALOG_PATH,
    runtime_profile_catalog_schema: VENDOR_RUNTIME_PROFILE_CATALOG_SCHEMA_PATH,
    runtime_profile_catalog_implementation_registry:
      VENDOR_RUNTIME_PROFILE_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_catalog_evidence: VENDOR_RUNTIME_PROFILE_CATALOG_VALIDATION_REPORT_PATH,
    runtime_profile_index: VENDOR_RUNTIME_PROFILE_INDEX_PATH,
    runtime_profile_index_schema: VENDOR_RUNTIME_PROFILE_INDEX_SCHEMA_PATH,
    runtime_profile_index_implementation_registry:
      VENDOR_RUNTIME_PROFILE_INDEX_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_index_evidence: VENDOR_RUNTIME_PROFILE_INDEX_VALIDATION_REPORT_PATH,
    runtime_profile_collection: VENDOR_RUNTIME_PROFILE_COLLECTION_PATH,
    runtime_profile_collection_schema: VENDOR_RUNTIME_PROFILE_COLLECTION_SCHEMA_PATH,
    runtime_profile_collection_implementation_registry:
      VENDOR_RUNTIME_PROFILE_COLLECTION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_collection_evidence: VENDOR_RUNTIME_PROFILE_COLLECTION_VALIDATION_REPORT_PATH,
    runtime_profile_set: VENDOR_RUNTIME_PROFILE_SET_PATH,
    runtime_profile_set_schema: VENDOR_RUNTIME_PROFILE_SET_SCHEMA_PATH,
    runtime_profile_set_implementation_registry: VENDOR_RUNTIME_PROFILE_SET_IMPLEMENTATION_REGISTRY_PATH,
    runtime_profile_set_evidence: VENDOR_RUNTIME_PROFILE_SET_VALIDATION_REPORT_PATH,
    runtime_blueprint: VENDOR_RUNTIME_BLUEPRINT_PATH,
    runtime_blueprint_schema: VENDOR_RUNTIME_BLUEPRINT_SCHEMA_PATH,
    runtime_blueprint_implementation_registry:
      VENDOR_RUNTIME_BLUEPRINT_IMPLEMENTATION_REGISTRY_PATH,
    runtime_blueprint_evidence: VENDOR_RUNTIME_BLUEPRINT_VALIDATION_REPORT_PATH,
    runtime_definition: VENDOR_RUNTIME_DEFINITION_PATH,
    runtime_definition_schema: VENDOR_RUNTIME_DEFINITION_SCHEMA_PATH,
    runtime_definition_implementation_registry:
      VENDOR_RUNTIME_DEFINITION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_definition_evidence: VENDOR_RUNTIME_DEFINITION_VALIDATION_REPORT_PATH,
    runtime_descriptor: VENDOR_RUNTIME_DESCRIPTOR_PATH,
    runtime_descriptor_schema: VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
    runtime_descriptor_implementation_registry: VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
    runtime_descriptor_evidence: VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
    runtime_contract: VENDOR_RUNTIME_CONTRACT_PATH,
    runtime_contract_schema: VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
    runtime_contract_implementation_registry: VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
    runtime_contract_evidence: VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
    runtime_specification: VENDOR_RUNTIME_SPECIFICATION_PATH,
    runtime_specification_schema: VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
    runtime_specification_implementation_registry:
      VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
    runtime_specification_evidence: VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
    runtime_family: VENDOR_RUNTIME_FAMILY_PATH,
    runtime_family_schema: VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
    runtime_family_implementation_registry: VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_family_evidence: VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
    runtime_catalog: VENDOR_RUNTIME_CATALOG_PATH,
    runtime_catalog_schema: VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
    runtime_catalog_implementation_registry:
      VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
    runtime_catalog_evidence: VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
    runtime_index: VENDOR_RUNTIME_INDEX_PATH,
    runtime_index_schema: VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
    runtime_index_implementation_registry: VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
    runtime_index_evidence: VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
    runtime_registry: VENDOR_RUNTIME_REGISTRY_PATH,
    runtime_registry_schema: VENDOR_RUNTIME_REGISTRY_SCHEMA_PATH,
    runtime_registry_implementation_registry:
      VENDOR_RUNTIME_REGISTRY_IMPLEMENTATION_REGISTRY_PATH,
    runtime_registry_evidence: VENDOR_RUNTIME_REGISTRY_EVIDENCE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath = VENDOR_RUNTIME_PROFILE_ARCHIVE_VALIDATION_REPORT_PATH;
fs.mkdirSync(path.dirname(path.join(projectRoot, reportPath)), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, reportPath),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(report.final_verdict);
console.log(
  [
    `mode=${report.mode}`,
    `runtime_profile_archive_id=${report.runtime_profile_archive_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `profile_archive_runtime_entries=${report.profile_archive_runtime_entries}`,
    `upstream_unmodified=${report.upstream_protected_unmodified}`,
    `error_count=${report.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const issue of issues) {
    console.error(`[error] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
