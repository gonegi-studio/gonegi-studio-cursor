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
  buildDirectSpatialConditioningVendorRuntimeDescriptor,
  DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
  DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID,
  RUNTIME_DESCRIPTOR_SECTION_SPECS,
  VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
  VENDOR_RUNTIME_CONTRACT_VERDICT,
  VENDOR_RUNTIME_DESCRIPTOR_ID,
  VENDOR_RUNTIME_DESCRIPTOR_VERSION,
  VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH,
  VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH,
  type DirectSpatialConditioningVendorRuntimeDescriptor,
} from '../services/directSpatialConditioningVendorRuntimeDescriptorBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_DESCRIPTOR_V1' as const;
const SCHEMA_PATH = VENDOR_RUNTIME_DESCRIPTOR_SCHEMA_PATH;
const REGISTRY_PATH = VENDOR_RUNTIME_DESCRIPTOR_IMPLEMENTATION_REGISTRY_PATH;

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
  'runtime_descriptor_id',
  'runtime_descriptor_version',
  'runtime_descriptor_kind',
  'runtime_contract_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_descriptor_identity',
  'vendor_runtime_contract_binding',
  'runtime_descriptor_composition',
  'runtime_descriptor_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_DESCRIPTOR_SECTION_SPECS.map((spec) => spec.section_id);

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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [
  VENDOR_RUNTIME_CONTRACT_PATH,
  VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime contract input ${required}`);
    process.exit(1);
  }
}

const contractEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH);
if (contractEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime contract did not pass validation');
  process.exit(1);
}
if (contractEvidence.final_verdict !== VENDOR_RUNTIME_CONTRACT_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime contract evidence does not carry the PHASE-097 PASS verdict'
  );
  process.exit(1);
}
if (contractEvidence.phase !== DSC_VENDOR_RUNTIME_CONTRACT_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime contract');
  process.exit(1);
}

const vendorRuntimeContractOnDisk = readJson<DirectSpatialConditioningVendorRuntimeContract>(
  VENDOR_RUNTIME_CONTRACT_PATH
);
if (vendorRuntimeContractOnDisk.system_id !== DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime contract system id mismatch');
  process.exit(1);
}

const runtimeSpecification = readJson<DirectSpatialConditioningVendorRuntimeSpecification>(
  vendorRuntimeContractOnDisk.runtime_specification_ref
);
if (runtimeSpecification.system_id !== DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime specification system id mismatch');
  process.exit(1);
}

const runtimeTemplate = readJson<DirectSpatialConditioningVendorRuntimeTemplate>(
  vendorRuntimeContractOnDisk.runtime_template_ref
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

let vendorRuntimeDescriptor: DirectSpatialConditioningVendorRuntimeDescriptor;
try {
  vendorRuntimeDescriptor =
    buildDirectSpatialConditioningVendorRuntimeDescriptor(projectRoot).vendorRuntimeDescriptor;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME DESCRIPTOR FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeDescriptor.phase !== DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeDescriptor.phase });
}
if (vendorRuntimeDescriptor.system_id !== DSC_VENDOR_RUNTIME_DESCRIPTOR_SYSTEM_ID) {
  issues.push({ code: 'SYSTEM_ID', message: vendorRuntimeDescriptor.system_id });
}
if (vendorRuntimeDescriptor.mode !== 'design_only_vendor_runtime_descriptor') {
  issues.push({ code: 'MODE', message: vendorRuntimeDescriptor.mode });
}
if (vendorRuntimeDescriptor.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeDescriptor.target });
}
if (vendorRuntimeDescriptor.runtime_descriptor_id !== VENDOR_RUNTIME_DESCRIPTOR_ID) {
  issues.push({
    code: 'RUNTIME_DESCRIPTOR_ID',
    message: vendorRuntimeDescriptor.runtime_descriptor_id,
  });
}
if (vendorRuntimeDescriptor.runtime_descriptor_version !== VENDOR_RUNTIME_DESCRIPTOR_VERSION) {
  issues.push({
    code: 'RUNTIME_DESCRIPTOR_VERSION',
    message: vendorRuntimeDescriptor.runtime_descriptor_version,
  });
}
if (vendorRuntimeDescriptor.runtime_descriptor_kind !== 'vendor_runtime_descriptor') {
  issues.push({
    code: 'RUNTIME_DESCRIPTOR_KIND',
    message: vendorRuntimeDescriptor.runtime_descriptor_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'runtime_contract_ref',
    vendorRuntimeDescriptor.runtime_contract_ref,
    VENDOR_RUNTIME_CONTRACT_PATH,
  ],
  [
    'runtime_contract_schema_ref',
    vendorRuntimeDescriptor.runtime_contract_schema_ref,
    VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  ],
  [
    'runtime_contract_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_contract_implementation_registry_ref,
    VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_contract_evidence_ref',
    vendorRuntimeDescriptor.runtime_contract_evidence_ref,
    VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH,
  ],
  [
    'runtime_specification_ref',
    vendorRuntimeDescriptor.runtime_specification_ref,
    VENDOR_RUNTIME_SPECIFICATION_PATH,
  ],
  [
    'runtime_specification_schema_ref',
    vendorRuntimeDescriptor.runtime_specification_schema_ref,
    VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  ],
  [
    'runtime_specification_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_specification_implementation_registry_ref,
    VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_specification_evidence_ref',
    vendorRuntimeDescriptor.runtime_specification_evidence_ref,
    VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
  ],
  [
    'runtime_template_ref',
    vendorRuntimeDescriptor.runtime_template_ref,
    VENDOR_RUNTIME_TEMPLATE_PATH,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeDescriptor.runtime_template_schema_ref,
    VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_template_implementation_registry_ref,
    VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeDescriptor.runtime_template_evidence_ref,
    VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
  ],
  ['runtime_family_ref', vendorRuntimeDescriptor.runtime_family_ref, VENDOR_RUNTIME_FAMILY_PATH],
  [
    'runtime_family_schema_ref',
    vendorRuntimeDescriptor.runtime_family_schema_ref,
    VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  ],
  [
    'runtime_family_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_family_implementation_registry_ref,
    VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_family_evidence_ref',
    vendorRuntimeDescriptor.runtime_family_evidence_ref,
    VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
  ],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeDescriptor.runtime_catalog_schema_ref,
    VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_catalog_implementation_registry_ref,
    VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeDescriptor.runtime_catalog_evidence_ref,
    VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
  ],
  ['runtime_index_ref', vendorRuntimeDescriptor.runtime_index_ref, VENDOR_RUNTIME_INDEX_PATH],
  [
    'runtime_index_schema_ref',
    vendorRuntimeDescriptor.runtime_index_schema_ref,
    VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_index_implementation_registry_ref,
    VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeDescriptor.runtime_index_evidence_ref,
    VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeDescriptor.runtime_registry_ref,
    VENDOR_RUNTIME_REGISTRY_PATH,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeDescriptor.runtime_profile_ref,
    VENDOR_RUNTIME_PROFILE_PATH,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeDescriptor.runtime_bundle_ref,
    VENDOR_RUNTIME_BUNDLE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeDescriptor.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeDescriptor.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeDescriptor.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeDescriptor.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeDescriptor.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeDescriptor.numerical_runtime_package_ref,
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
    'runtime_specification_ref',
    vendorRuntimeDescriptor.runtime_specification_ref,
    vendorRuntimeContractOnDisk.runtime_specification_ref,
  ],
  [
    'runtime_specification_schema_ref',
    vendorRuntimeDescriptor.runtime_specification_schema_ref,
    vendorRuntimeContractOnDisk.runtime_specification_schema_ref,
  ],
  [
    'runtime_specification_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_specification_implementation_registry_ref,
    vendorRuntimeContractOnDisk.runtime_specification_implementation_registry_ref,
  ],
  [
    'runtime_specification_evidence_ref',
    vendorRuntimeDescriptor.runtime_specification_evidence_ref,
    vendorRuntimeContractOnDisk.runtime_specification_evidence_ref,
  ],
  [
    'runtime_template_ref',
    vendorRuntimeDescriptor.runtime_template_ref,
    vendorRuntimeContractOnDisk.runtime_template_ref,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeDescriptor.runtime_template_schema_ref,
    vendorRuntimeContractOnDisk.runtime_template_schema_ref,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_template_implementation_registry_ref,
    vendorRuntimeContractOnDisk.runtime_template_implementation_registry_ref,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeDescriptor.runtime_template_evidence_ref,
    vendorRuntimeContractOnDisk.runtime_template_evidence_ref,
  ],
  [
    'runtime_family_ref',
    vendorRuntimeDescriptor.runtime_family_ref,
    vendorRuntimeContractOnDisk.runtime_family_ref,
  ],
  [
    'runtime_family_schema_ref',
    vendorRuntimeDescriptor.runtime_family_schema_ref,
    vendorRuntimeContractOnDisk.runtime_family_schema_ref,
  ],
  [
    'runtime_family_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_family_implementation_registry_ref,
    vendorRuntimeContractOnDisk.runtime_family_implementation_registry_ref,
  ],
  [
    'runtime_family_evidence_ref',
    vendorRuntimeDescriptor.runtime_family_evidence_ref,
    vendorRuntimeContractOnDisk.runtime_family_evidence_ref,
  ],
  [
    'runtime_catalog_ref',
    vendorRuntimeDescriptor.runtime_catalog_ref,
    vendorRuntimeContractOnDisk.runtime_catalog_ref,
  ],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeDescriptor.runtime_catalog_schema_ref,
    vendorRuntimeContractOnDisk.runtime_catalog_schema_ref,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_catalog_implementation_registry_ref,
    vendorRuntimeContractOnDisk.runtime_catalog_implementation_registry_ref,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeDescriptor.runtime_catalog_evidence_ref,
    vendorRuntimeContractOnDisk.runtime_catalog_evidence_ref,
  ],
  [
    'runtime_index_ref',
    vendorRuntimeDescriptor.runtime_index_ref,
    vendorRuntimeContractOnDisk.runtime_index_ref,
  ],
  [
    'runtime_index_schema_ref',
    vendorRuntimeDescriptor.runtime_index_schema_ref,
    vendorRuntimeContractOnDisk.runtime_index_schema_ref,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeDescriptor.runtime_index_implementation_registry_ref,
    vendorRuntimeContractOnDisk.runtime_index_implementation_registry_ref,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeDescriptor.runtime_index_evidence_ref,
    vendorRuntimeContractOnDisk.runtime_index_evidence_ref,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeDescriptor.runtime_registry_ref,
    vendorRuntimeContractOnDisk.runtime_registry_ref,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeDescriptor.runtime_profile_ref,
    vendorRuntimeContractOnDisk.runtime_profile_ref,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeDescriptor.runtime_bundle_ref,
    vendorRuntimeContractOnDisk.runtime_bundle_ref,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeDescriptor.runtime_package_ref,
    vendorRuntimeContractOnDisk.runtime_package_ref,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeDescriptor.reference_bundle_ref,
    vendorRuntimeContractOnDisk.reference_bundle_ref,
  ],
  ['package_ref', vendorRuntimeDescriptor.package_ref, vendorRuntimeContractOnDisk.package_ref],
  ['template_ref', vendorRuntimeDescriptor.template_ref, vendorRuntimeContractOnDisk.template_ref],
  [
    'template_certification_ref',
    vendorRuntimeDescriptor.template_certification_ref,
    vendorRuntimeContractOnDisk.template_certification_ref,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeDescriptor.numerical_runtime_package_ref,
    vendorRuntimeContractOnDisk.numerical_runtime_package_ref,
  ],
];
for (const [code, actual, expected] of chainRefChecks) {
  if (actual !== expected) {
    issues.push({ code: `CHAIN_${code.toUpperCase()}`, message: actual });
  }
}

if (
  JSON.stringify(vendorRuntimeDescriptor.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeDescriptor.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeDescriptor.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeDescriptor.required_channels.join(','),
  });
}
if (vendorRuntimeDescriptor.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeDescriptor.spatial_frame_ref });
}
if (
  vendorRuntimeDescriptor.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeDescriptor.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeDescriptor.capability_set_id}@${vendorRuntimeDescriptor.capability_set_version}`,
  });
}

const runtimeCatalog = readJson<DirectSpatialConditioningVendorRuntimeCatalog>(
  vendorRuntimeContractOnDisk.runtime_catalog_ref
);

const runtimeContractManifest = vendorRuntimeContractOnDisk.runtime_contract_manifest;

// 1) Runtime descriptor schema.
const descriptorSchema = vendorRuntimeDescriptor.runtime_descriptor_schema;
if (descriptorSchema.schema_id !== 'dsc-vendor-runtime-descriptor-schema-v1') {
  issues.push({ code: 'RUNTIME_DESCRIPTOR_SCHEMA_ID', message: descriptorSchema.schema_id });
}
if (
  descriptorSchema.encoding !== 'application/json' ||
  descriptorSchema.runtime_descriptor_id_policy !==
    'opaque_runtime_descriptor_id_no_vendor_binding' ||
  descriptorSchema.runtime_contract_ref !== VENDOR_RUNTIME_CONTRACT_ID ||
  descriptorSchema.optional_fields.length !== 0 ||
  descriptorSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_DESCRIPTOR_SCHEMA_POLICY',
    message: descriptorSchema.runtime_descriptor_id_policy,
  });
}
const schemaFields = descriptorSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_DESCRIPTOR_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of descriptorSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({
      code: 'RUNTIME_DESCRIPTOR_SCHEMA_FIELD_INCOMPLETE',
      message: field.field,
    });
  }
}

// 2) Deterministic runtime descriptor identity.
const identity = vendorRuntimeDescriptor.deterministic_runtime_descriptor_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-descriptor-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_descriptor_id !== VENDOR_RUNTIME_DESCRIPTOR_ID ||
  identity.runtime_descriptor_version !== VENDOR_RUNTIME_DESCRIPTOR_VERSION ||
  identity.identity_policy !== 'opaque_runtime_descriptor_id_no_vendor_binding' ||
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


// 3) Vendor Runtime Contract binding.
const binding = vendorRuntimeDescriptor.vendor_runtime_contract_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-descriptor-contract-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_contract_ref !== VENDOR_RUNTIME_CONTRACT_PATH ||
  binding.runtime_contract_id !== VENDOR_RUNTIME_CONTRACT_ID ||
  binding.runtime_contract_version !== VENDOR_RUNTIME_CONTRACT_VERSION ||
  binding.runtime_contract_phase !== DSC_VENDOR_RUNTIME_CONTRACT_PHASE ||
  binding.runtime_contract_system_id !== DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID ||
  binding.runtime_contract_evidence_ref !== VENDOR_RUNTIME_CONTRACT_EVIDENCE_PATH ||
  binding.runtime_contract_verdict !== VENDOR_RUNTIME_CONTRACT_VERDICT ||
  binding.runtime_contract_evidence_mode !== 'phase_097_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_descriptor_root' ||
  binding.describes_runtime_in_this_phase ||
  binding.implements_runtime_contract_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_contract_id !== vendorRuntimeContractOnDisk.runtime_contract_id ||
  binding.runtime_contract_version !== vendorRuntimeContractOnDisk.runtime_contract_version
) {
  issues.push({ code: 'BINDING_CONTRACT_DRIFT', message: binding.runtime_contract_id });
}

// 4) Runtime descriptor composition.
const composition = vendorRuntimeDescriptor.runtime_descriptor_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-descriptor-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_contract' ||
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

const contractMemberRefs = new Set(
  runtimeContractManifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_contract' &&
    contractMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_CONTRACT_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'runtime_contract_contents_sealed_via_runtime_contract_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_CONTRACT_ID ||
  transitive.re_lists_runtime_contract_contents ||
  transitive.sealed_component_count !== runtimeContractManifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime descriptor manifest.
const manifest = vendorRuntimeDescriptor.runtime_descriptor_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-descriptor-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_descriptor_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_contract_digest' ||
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
  manifest.sealed_runtime_contract_digest !== runtimeContractManifest.runtime_contract_digest ||
  binding.sealed_runtime_contract_digest !== runtimeContractManifest.runtime_contract_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_CONTRACT_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_contract_digest,
  });
}
if (
  manifest.sealed_runtime_specification_digest !==
    runtimeContractManifest.sealed_runtime_specification_digest ||
  binding.sealed_runtime_specification_digest !==
    runtimeContractManifest.sealed_runtime_specification_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_SPECIFICATION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_specification_digest,
  });
}
if (
  manifest.sealed_runtime_template_digest !== runtimeContractManifest.sealed_runtime_template_digest ||
  binding.sealed_runtime_template_digest !== runtimeContractManifest.sealed_runtime_template_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_TEMPLATE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_template_digest,
  });
}
if (
  manifest.sealed_runtime_family_digest !== runtimeContractManifest.sealed_runtime_family_digest ||
  binding.sealed_runtime_family_digest !== runtimeContractManifest.sealed_runtime_family_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_FAMILY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_family_digest,
  });
}
if (
  manifest.sealed_runtime_catalog_digest !== runtimeContractManifest.sealed_runtime_catalog_digest ||
  binding.sealed_runtime_catalog_digest !== runtimeContractManifest.sealed_runtime_catalog_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_CATALOG_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_catalog_digest,
  });
}
if (
  manifest.sealed_runtime_index_digest !== runtimeContractManifest.sealed_runtime_index_digest ||
  binding.sealed_runtime_index_digest !== runtimeContractManifest.sealed_runtime_index_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_index_digest,
  });
}
if (
  manifest.sealed_runtime_registry_digest !==
    runtimeContractManifest.sealed_runtime_registry_digest ||
  binding.sealed_runtime_registry_digest !==
    runtimeContractManifest.sealed_runtime_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_digest !==
    runtimeContractManifest.sealed_runtime_profile_digest ||
  binding.sealed_runtime_profile_digest !== runtimeContractManifest.sealed_runtime_profile_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_digest,
  });
}
if (
  manifest.sealed_runtime_bundle_digest !==
    runtimeContractManifest.sealed_runtime_bundle_digest ||
  binding.sealed_runtime_bundle_digest !== runtimeContractManifest.sealed_runtime_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_bundle_digest,
  });
}
if (
  manifest.sealed_runtime_package_digest !==
    runtimeContractManifest.sealed_runtime_package_digest ||
  binding.sealed_runtime_package_digest !== runtimeContractManifest.sealed_runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimeContractManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimeContractManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeDescriptorDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_contract:${manifest.sealed_runtime_contract_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_descriptor_digest !== expectedRuntimeDescriptorDigest) {
  issues.push({
    code: 'RUNTIME_DESCRIPTOR_DIGEST_DRIFT',
    message: manifest.runtime_descriptor_digest,
  });
}

const entries = vendorRuntimeDescriptor.described_runtime_entries;
if (
  entries.count !== 0 ||
  entries.entries.length !== 0 ||
  entries.describes_runtime_in_this_phase ||
  !entries.describing_policy
) {
  issues.push({ code: 'DESCRIBED_RUNTIME_ENTRIES', message: `${entries.count}` });
}

const constraints = vendorRuntimeDescriptor.design_constraints;
if (
  !constraints.runtime_descriptor_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_contract ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.describes_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeDescriptor);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeDescriptor(projectRoot)
  .vendorRuntimeDescriptor;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeDescriptor.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_DESCRIPTOR_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeDescriptor);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_descriptor_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_DESCRIPTOR_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeDescriptor.mode,
  runtime_descriptor_id: vendorRuntimeDescriptor.runtime_descriptor_id,
  runtime_descriptor_version: vendorRuntimeDescriptor.runtime_descriptor_version,
  runtime_descriptor_kind: vendorRuntimeDescriptor.runtime_descriptor_kind,
  runtime_descriptor_schema: descriptorSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_descriptor_identity: identity.identity_id,
  vendor_runtime_contract_binding: binding.binding_id,
  runtime_contract_verdict: binding.runtime_contract_verdict,
  runtime_contract_evidence_mode: binding.runtime_contract_evidence_mode,
  runtime_descriptor_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_descriptor_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_contract_digest: manifest.sealed_runtime_contract_digest,
  runtime_descriptor_digest: manifest.runtime_descriptor_digest,
  described_runtime_entries: entries.count,
  sources_supported: vendorRuntimeDescriptor.sources_supported.length,
  reuses_certified_vendor_runtime_contract: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeDescriptor.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_descriptor: VENDOR_RUNTIME_DESCRIPTOR_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
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

const reportPath = VENDOR_RUNTIME_DESCRIPTOR_VALIDATION_REPORT_PATH;
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
    `runtime_descriptor_id=${report.runtime_descriptor_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `described_runtime_entries=${report.described_runtime_entries}`,
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
