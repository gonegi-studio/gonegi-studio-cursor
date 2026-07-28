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
  DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE,
  DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID,
  VENDOR_RUNTIME_SPECIFICATION_ID,
  VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_SPECIFICATION_PATH,
  VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  VENDOR_RUNTIME_SPECIFICATION_VERSION,
  VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
  type DirectSpatialConditioningVendorRuntimeSpecification,
} from '../services/directSpatialConditioningVendorRuntimeSpecificationBuilder.js';
import {
  buildDirectSpatialConditioningVendorRuntimeContract,
  DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
  DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID,
  RUNTIME_CONTRACT_SECTION_SPECS,
  VENDOR_RUNTIME_CONTRACT_ID,
  VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_CONTRACT_PATH,
  VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH,
  VENDOR_RUNTIME_CONTRACT_VERSION,
  VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
  VENDOR_RUNTIME_SPECIFICATION_VERDICT,
  type DirectSpatialConditioningVendorRuntimeContract,
} from '../services/directSpatialConditioningVendorRuntimeContractBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_V1' as const;
const SCHEMA_PATH = VENDOR_RUNTIME_CONTRACT_SCHEMA_PATH;
const REGISTRY_PATH = VENDOR_RUNTIME_CONTRACT_IMPLEMENTATION_REGISTRY_PATH;

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
  'runtime_contract_id',
  'runtime_contract_version',
  'runtime_contract_kind',
  'runtime_specification_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_runtime_contract_identity',
  'vendor_runtime_specification_binding',
  'runtime_contract_composition',
  'runtime_contract_manifest',
];

const EXPECTED_SECTION_IDS = RUNTIME_CONTRACT_SECTION_SPECS.map((spec) => spec.section_id);

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
  VENDOR_RUNTIME_SPECIFICATION_PATH,
  VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing vendor runtime specification input ${required}`);
    process.exit(1);
  }
}

const specificationEvidence = readJson<{
  final_verdict?: string;
  validation_passed?: boolean;
  phase?: string;
  error_count?: number;
}>(VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH);
if (specificationEvidence.validation_passed !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime specification did not pass validation');
  process.exit(1);
}
if (specificationEvidence.final_verdict !== VENDOR_RUNTIME_SPECIFICATION_VERDICT) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: runtime specification evidence does not carry the PHASE-095 PASS verdict'
  );
  process.exit(1);
}
if (specificationEvidence.phase !== DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: evidence does not cover the vendor runtime specification');
  process.exit(1);
}

const runtimeSpecification = readJson<DirectSpatialConditioningVendorRuntimeSpecification>(
  VENDOR_RUNTIME_SPECIFICATION_PATH
);
if (runtimeSpecification.system_id !== DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: vendor runtime specification system id mismatch');
  process.exit(1);
}

const runtimeTemplate = readJson<DirectSpatialConditioningVendorRuntimeTemplate>(
  runtimeSpecification.runtime_template_ref
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

let vendorRuntimeContract: DirectSpatialConditioningVendorRuntimeContract;
try {
  vendorRuntimeContract =
    buildDirectSpatialConditioningVendorRuntimeContract(projectRoot).vendorRuntimeContract;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR RUNTIME CONTRACT FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (vendorRuntimeContract.phase !== DSC_VENDOR_RUNTIME_CONTRACT_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRuntimeContract.phase });
}
if (vendorRuntimeContract.system_id !== DSC_VENDOR_RUNTIME_CONTRACT_SYSTEM_ID) {
  issues.push({ code: 'SYSTEM_ID', message: vendorRuntimeContract.system_id });
}
if (vendorRuntimeContract.mode !== 'design_only_vendor_runtime_contract') {
  issues.push({ code: 'MODE', message: vendorRuntimeContract.mode });
}
if (vendorRuntimeContract.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRuntimeContract.target });
}
if (vendorRuntimeContract.runtime_contract_id !== VENDOR_RUNTIME_CONTRACT_ID) {
  issues.push({
    code: 'RUNTIME_CONTRACT_ID',
    message: vendorRuntimeContract.runtime_contract_id,
  });
}
if (
  vendorRuntimeContract.runtime_contract_version !== VENDOR_RUNTIME_CONTRACT_VERSION
) {
  issues.push({
    code: 'RUNTIME_CONTRACT_VERSION',
    message: vendorRuntimeContract.runtime_contract_version,
  });
}
if (vendorRuntimeContract.runtime_contract_kind !== 'vendor_runtime_contract') {
  issues.push({
    code: 'RUNTIME_CONTRACT_KIND',
    message: vendorRuntimeContract.runtime_contract_kind,
  });
}

const refChecks: Array<[string, string, string]> = [
  [
    'runtime_specification_ref',
    vendorRuntimeContract.runtime_specification_ref,
    VENDOR_RUNTIME_SPECIFICATION_PATH,
  ],
  [
    'runtime_specification_schema_ref',
    vendorRuntimeContract.runtime_specification_schema_ref,
    VENDOR_RUNTIME_SPECIFICATION_SCHEMA_PATH,
  ],
  [
    'runtime_specification_implementation_registry_ref',
    vendorRuntimeContract.runtime_specification_implementation_registry_ref,
    VENDOR_RUNTIME_SPECIFICATION_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_specification_evidence_ref',
    vendorRuntimeContract.runtime_specification_evidence_ref,
    VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH,
  ],
  [
    'runtime_template_ref',
    vendorRuntimeContract.runtime_template_ref,
    VENDOR_RUNTIME_TEMPLATE_PATH,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeContract.runtime_template_schema_ref,
    VENDOR_RUNTIME_TEMPLATE_SCHEMA_PATH,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeContract.runtime_template_implementation_registry_ref,
    VENDOR_RUNTIME_TEMPLATE_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeContract.runtime_template_evidence_ref,
    VENDOR_RUNTIME_TEMPLATE_EVIDENCE_PATH,
  ],
  ['runtime_family_ref', vendorRuntimeContract.runtime_family_ref, VENDOR_RUNTIME_FAMILY_PATH],
  [
    'runtime_family_schema_ref',
    vendorRuntimeContract.runtime_family_schema_ref,
    VENDOR_RUNTIME_FAMILY_SCHEMA_PATH,
  ],
  [
    'runtime_family_implementation_registry_ref',
    vendorRuntimeContract.runtime_family_implementation_registry_ref,
    VENDOR_RUNTIME_FAMILY_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_family_evidence_ref',
    vendorRuntimeContract.runtime_family_evidence_ref,
    VENDOR_RUNTIME_FAMILY_EVIDENCE_PATH,
  ],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeContract.runtime_catalog_schema_ref,
    VENDOR_RUNTIME_CATALOG_SCHEMA_PATH,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeContract.runtime_catalog_implementation_registry_ref,
    VENDOR_RUNTIME_CATALOG_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeContract.runtime_catalog_evidence_ref,
    VENDOR_RUNTIME_CATALOG_EVIDENCE_PATH,
  ],
  ['runtime_index_ref', vendorRuntimeContract.runtime_index_ref, VENDOR_RUNTIME_INDEX_PATH],
  [
    'runtime_index_schema_ref',
    vendorRuntimeContract.runtime_index_schema_ref,
    VENDOR_RUNTIME_INDEX_SCHEMA_PATH,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeContract.runtime_index_implementation_registry_ref,
    VENDOR_RUNTIME_INDEX_IMPLEMENTATION_REGISTRY_PATH,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeContract.runtime_index_evidence_ref,
    VENDOR_RUNTIME_INDEX_EVIDENCE_PATH,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeContract.runtime_registry_ref,
    VENDOR_RUNTIME_REGISTRY_PATH,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeContract.runtime_profile_ref,
    VENDOR_RUNTIME_PROFILE_PATH,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeContract.runtime_bundle_ref,
    VENDOR_RUNTIME_BUNDLE_PATH,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeContract.runtime_package_ref,
    VENDOR_RUNTIME_PACKAGE_PATH,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeContract.reference_bundle_ref,
    VENDOR_REFERENCE_BUNDLE_PATH,
  ],
  ['package_ref', vendorRuntimeContract.package_ref, VENDOR_REFERENCE_PACKAGE_PATH],
  ['template_ref', vendorRuntimeContract.template_ref, VENDOR_IMPLEMENTATION_TEMPLATE_PATH],
  [
    'template_certification_ref',
    vendorRuntimeContract.template_certification_ref,
    VENDOR_IMPLEMENTATION_TEMPLATE_CERTIFICATION_PATH,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeContract.numerical_runtime_package_ref,
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
    'runtime_template_ref',
    vendorRuntimeContract.runtime_template_ref,
    runtimeSpecification.runtime_template_ref,
  ],
  [
    'runtime_template_schema_ref',
    vendorRuntimeContract.runtime_template_schema_ref,
    runtimeSpecification.runtime_template_schema_ref,
  ],
  [
    'runtime_template_implementation_registry_ref',
    vendorRuntimeContract.runtime_template_implementation_registry_ref,
    runtimeSpecification.runtime_template_implementation_registry_ref,
  ],
  [
    'runtime_template_evidence_ref',
    vendorRuntimeContract.runtime_template_evidence_ref,
    runtimeSpecification.runtime_template_evidence_ref,
  ],
  ['runtime_catalog_ref', vendorRuntimeContract.runtime_catalog_ref, runtimeSpecification.runtime_catalog_ref],
  [
    'runtime_catalog_schema_ref',
    vendorRuntimeContract.runtime_catalog_schema_ref,
    runtimeSpecification.runtime_catalog_schema_ref,
  ],
  [
    'runtime_catalog_implementation_registry_ref',
    vendorRuntimeContract.runtime_catalog_implementation_registry_ref,
    runtimeSpecification.runtime_catalog_implementation_registry_ref,
  ],
  [
    'runtime_catalog_evidence_ref',
    vendorRuntimeContract.runtime_catalog_evidence_ref,
    runtimeSpecification.runtime_catalog_evidence_ref,
  ],
  ['runtime_index_ref', vendorRuntimeContract.runtime_index_ref, runtimeSpecification.runtime_index_ref],
  [
    'runtime_index_schema_ref',
    vendorRuntimeContract.runtime_index_schema_ref,
    runtimeSpecification.runtime_index_schema_ref,
  ],
  [
    'runtime_index_implementation_registry_ref',
    vendorRuntimeContract.runtime_index_implementation_registry_ref,
    runtimeSpecification.runtime_index_implementation_registry_ref,
  ],
  [
    'runtime_index_evidence_ref',
    vendorRuntimeContract.runtime_index_evidence_ref,
    runtimeSpecification.runtime_index_evidence_ref,
  ],
  [
    'runtime_registry_ref',
    vendorRuntimeContract.runtime_registry_ref,
    runtimeSpecification.runtime_registry_ref,
  ],
  [
    'runtime_profile_ref',
    vendorRuntimeContract.runtime_profile_ref,
    runtimeSpecification.runtime_profile_ref,
  ],
  [
    'runtime_bundle_ref',
    vendorRuntimeContract.runtime_bundle_ref,
    runtimeSpecification.runtime_bundle_ref,
  ],
  [
    'runtime_package_ref',
    vendorRuntimeContract.runtime_package_ref,
    runtimeSpecification.runtime_package_ref,
  ],
  [
    'reference_bundle_ref',
    vendorRuntimeContract.reference_bundle_ref,
    runtimeSpecification.reference_bundle_ref,
  ],
  ['package_ref', vendorRuntimeContract.package_ref, runtimeSpecification.package_ref],
  ['template_ref', vendorRuntimeContract.template_ref, runtimeSpecification.template_ref],
  [
    'template_certification_ref',
    vendorRuntimeContract.template_certification_ref,
    runtimeSpecification.template_certification_ref,
  ],
  [
    'numerical_runtime_package_ref',
    vendorRuntimeContract.numerical_runtime_package_ref,
    runtimeSpecification.numerical_runtime_package_ref,
  ],
];
for (const [code, actual, expected] of chainRefChecks) {
  if (actual !== expected) {
    issues.push({ code: `CHAIN_${code.toUpperCase()}`, message: actual });
  }
}

if (
  JSON.stringify(vendorRuntimeContract.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRuntimeContract.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRuntimeContract.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRuntimeContract.required_channels.join(','),
  });
}
if (vendorRuntimeContract.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRuntimeContract.spatial_frame_ref });
}
if (
  vendorRuntimeContract.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRuntimeContract.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRuntimeContract.capability_set_id}@${vendorRuntimeContract.capability_set_version}`,
  });
}

// 1) Runtime contract schema.
const contractSchema = vendorRuntimeContract.runtime_contract_schema;
if (contractSchema.schema_id !== 'dsc-vendor-runtime-contract-schema-v1') {
  issues.push({ code: 'RUNTIME_CONTRACT_SCHEMA_ID', message: contractSchema.schema_id });
}
if (
  contractSchema.encoding !== 'application/json' ||
  contractSchema.runtime_contract_id_policy !==
    'opaque_runtime_contract_id_no_vendor_binding' ||
  contractSchema.runtime_specification_ref !== VENDOR_RUNTIME_SPECIFICATION_ID ||
  contractSchema.optional_fields.length !== 0 ||
  contractSchema.additional_fields
) {
  issues.push({
    code: 'RUNTIME_CONTRACT_SCHEMA_POLICY',
    message: contractSchema.runtime_contract_id_policy,
  });
}
const schemaFields = contractSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'RUNTIME_CONTRACT_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of contractSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({
      code: 'RUNTIME_CONTRACT_SCHEMA_FIELD_INCOMPLETE',
      message: field.field,
    });
  }
}

// 2) Deterministic runtime contract identity.
const identity = vendorRuntimeContract.deterministic_runtime_contract_identity;
if (identity.identity_id !== 'dsc-vendor-runtime-contract-deterministic-identity-v1') {
  issues.push({ code: 'IDENTITY_ID', message: identity.identity_id });
}
if (
  identity.runtime_contract_id !== VENDOR_RUNTIME_CONTRACT_ID ||
  identity.runtime_contract_version !== VENDOR_RUNTIME_CONTRACT_VERSION ||
  identity.identity_policy !== 'opaque_runtime_contract_id_no_vendor_binding' ||
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

const runtimeCatalog = readJson<DirectSpatialConditioningVendorRuntimeCatalog>(
  runtimeSpecification.runtime_catalog_ref
);

// 3) Vendor Runtime Specification binding.
const binding = vendorRuntimeContract.vendor_runtime_specification_binding;
if (binding.binding_id !== 'dsc-vendor-runtime-contract-specification-binding-v1') {
  issues.push({ code: 'BINDING_ID', message: binding.binding_id });
}
if (
  binding.runtime_specification_ref !== VENDOR_RUNTIME_SPECIFICATION_PATH ||
  binding.runtime_specification_id !== VENDOR_RUNTIME_SPECIFICATION_ID ||
  binding.runtime_specification_version !== VENDOR_RUNTIME_SPECIFICATION_VERSION ||
  binding.runtime_specification_phase !== DSC_VENDOR_RUNTIME_SPECIFICATION_PHASE ||
  binding.runtime_specification_system_id !== DSC_VENDOR_RUNTIME_SPECIFICATION_SYSTEM_ID ||
  binding.runtime_specification_evidence_ref !== VENDOR_RUNTIME_SPECIFICATION_EVIDENCE_PATH ||
  binding.runtime_specification_verdict !== VENDOR_RUNTIME_SPECIFICATION_VERDICT ||
  binding.runtime_specification_evidence_mode !== 'phase_095_pass_verdict_gated_at_build_time' ||
  binding.binding_mode !== 'exact_reuse' ||
  binding.role !== 'runtime_contract_root' ||
  binding.contracts_runtime_in_this_phase ||
  binding.implements_runtime_specification_in_this_phase
) {
  issues.push({ code: 'BINDING_POLICY', message: binding.binding_mode });
}
if (
  binding.runtime_specification_id !== runtimeSpecification.runtime_specification_id ||
  binding.runtime_specification_version !== runtimeSpecification.runtime_specification_version
) {
  issues.push({ code: 'BINDING_SPECIFICATION_DRIFT', message: binding.runtime_specification_id });
}

// 4) Runtime contract composition.
const composition = vendorRuntimeContract.runtime_contract_composition;
if (composition.composition_id !== 'dsc-vendor-runtime-contract-composition-v1') {
  issues.push({ code: 'COMPOSITION_ID', message: composition.composition_id });
}
if (
  composition.root_section_id !== 'vendor_runtime_specification' ||
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

const runtimeSpecificationManifest = runtimeSpecification.runtime_specification_manifest;
const specificationMemberRefs = new Set(
  runtimeSpecificationManifest.entries.map((entry) => entry.artifact_ref)
);
for (const section of composition.sections) {
  if (
    section.section_id !== 'vendor_runtime_specification' &&
    specificationMemberRefs.has(section.artifact_ref)
  ) {
    issues.push({
      code: 'SECTION_DUPLICATES_RUNTIME_SPECIFICATION_MEMBER',
      message: section.artifact_ref,
    });
  }
}
const transitive = composition.transitive_seal;
if (
  transitive.policy !== 'runtime_specification_contents_sealed_via_runtime_specification_digest' ||
  transitive.sealed_via !== VENDOR_RUNTIME_SPECIFICATION_ID ||
  transitive.re_lists_runtime_specification_contents ||
  transitive.sealed_component_count !== runtimeSpecificationManifest.sealed_component_count
) {
  issues.push({ code: 'TRANSITIVE_SEAL', message: `${transitive.sealed_component_count}` });
}

// 5) Runtime contract manifest.
const manifest = vendorRuntimeContract.runtime_contract_manifest;
if (manifest.manifest_id !== 'dsc-vendor-runtime-contract-manifest-v1') {
  issues.push({ code: 'MANIFEST_ID', message: manifest.manifest_id });
}
if (
  manifest.integrity_method !== 'sha256_content_addressed_read_only' ||
  manifest.runtime_contract_digest_method !==
    'sha256_of_ordered_section_digests_and_sealed_runtime_specification_digest' ||
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
  manifest.sealed_runtime_specification_digest !==
    runtimeSpecificationManifest.runtime_specification_digest ||
  binding.sealed_runtime_specification_digest !==
    runtimeSpecificationManifest.runtime_specification_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_SPECIFICATION_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_specification_digest,
  });
}
if (
  manifest.sealed_runtime_template_digest !== runtimeSpecificationManifest.sealed_runtime_template_digest ||
  binding.sealed_runtime_template_digest !== runtimeSpecificationManifest.sealed_runtime_template_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_TEMPLATE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_template_digest,
  });
}
if (
  manifest.sealed_runtime_family_digest !== runtimeSpecificationManifest.sealed_runtime_family_digest ||
  binding.sealed_runtime_family_digest !== runtimeSpecificationManifest.sealed_runtime_family_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_FAMILY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_family_digest,
  });
}
if (
  manifest.sealed_runtime_catalog_digest !== runtimeSpecificationManifest.sealed_runtime_catalog_digest ||
  binding.sealed_runtime_catalog_digest !== runtimeSpecificationManifest.sealed_runtime_catalog_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_CATALOG_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_catalog_digest,
  });
}
if (
  manifest.sealed_runtime_index_digest !== runtimeSpecificationManifest.sealed_runtime_index_digest ||
  binding.sealed_runtime_index_digest !== runtimeSpecificationManifest.sealed_runtime_index_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_INDEX_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_index_digest,
  });
}
if (
  manifest.sealed_runtime_registry_digest !==
    runtimeSpecificationManifest.sealed_runtime_registry_digest ||
  binding.sealed_runtime_registry_digest !==
    runtimeSpecificationManifest.sealed_runtime_registry_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_REGISTRY_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_registry_digest,
  });
}
if (
  manifest.sealed_runtime_profile_digest !==
    runtimeSpecificationManifest.sealed_runtime_profile_digest ||
  binding.sealed_runtime_profile_digest !== runtimeSpecificationManifest.sealed_runtime_profile_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PROFILE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_profile_digest,
  });
}
if (
  manifest.sealed_runtime_bundle_digest !==
    runtimeSpecificationManifest.sealed_runtime_bundle_digest ||
  binding.sealed_runtime_bundle_digest !== runtimeSpecificationManifest.sealed_runtime_bundle_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_BUNDLE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_bundle_digest,
  });
}
if (
  manifest.sealed_runtime_package_digest !==
    runtimeSpecificationManifest.sealed_runtime_package_digest ||
  binding.sealed_runtime_package_digest !== runtimeSpecificationManifest.sealed_runtime_package_digest
) {
  issues.push({
    code: 'SEALED_RUNTIME_PACKAGE_DIGEST_MISMATCH',
    message: manifest.sealed_runtime_package_digest,
  });
}
if (
  manifest.sealed_component_count !== runtimeSpecificationManifest.sealed_component_count ||
  binding.sealed_component_count !== runtimeSpecificationManifest.sealed_component_count
) {
  issues.push({
    code: 'SEALED_COMPONENT_COUNT',
    message: `${manifest.sealed_component_count}`,
  });
}

const expectedRuntimeContractDigest = crypto
  .createHash('sha256')
  .update(
    [
      ...manifest.entries.map((entry) => `${entry.section_id}:${entry.sha256}`),
      `sealed_runtime_specification:${manifest.sealed_runtime_specification_digest}`,
    ].join('\n')
  )
  .digest('hex');
if (manifest.runtime_contract_digest !== expectedRuntimeContractDigest) {
  issues.push({
    code: 'RUNTIME_CONTRACT_DIGEST_DRIFT',
    message: manifest.runtime_contract_digest,
  });
}

const entries = vendorRuntimeContract.contracted_runtime_entries;
if (
  entries.count !== 0 ||
  entries.entries.length !== 0 ||
  entries.contracts_runtime_in_this_phase ||
  !entries.contracting_policy
) {
  issues.push({ code: 'CONTRACTED_RUNTIME_ENTRIES', message: `${entries.count}` });
}

const constraints = vendorRuntimeContract.design_constraints;
if (
  !constraints.runtime_contract_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_certified_vendor_runtime_specification ||
  !constraints.no_actual_implementation ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.declares_runtime_execution ||
  constraints.contracts_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

const firstSerialized = JSON.stringify(vendorRuntimeContract);
const rebuilt = buildDirectSpatialConditioningVendorRuntimeContract(projectRoot)
  .vendorRuntimeContract;
const rebuiltSerialized = JSON.stringify({
  ...rebuilt,
  created_at: vendorRuntimeContract.created_at,
});
if (firstSerialized !== rebuiltSerialized) {
  issues.push({ code: 'NON_REPRODUCIBLE', message: 'rebuild diverged from first build' });
}

for (const requiredArtifact of [VENDOR_RUNTIME_CONTRACT_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRuntimeContract);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_runtime_contract_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_RUNTIME_CONTRACT_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRuntimeContract.mode,
  runtime_contract_id: vendorRuntimeContract.runtime_contract_id,
  runtime_contract_version: vendorRuntimeContract.runtime_contract_version,
  runtime_contract_kind: vendorRuntimeContract.runtime_contract_kind,
  runtime_contract_schema: contractSchema.schema_id,
  schema_fields: schemaFields.length,
  deterministic_runtime_contract_identity: identity.identity_id,
  vendor_runtime_specification_binding: binding.binding_id,
  runtime_specification_verdict: binding.runtime_specification_verdict,
  runtime_specification_evidence_mode: binding.runtime_specification_evidence_mode,
  runtime_contract_composition: composition.composition_id,
  section_count: composition.sections.length,
  runtime_contract_manifest: manifest.manifest_id,
  manifest_entry_count: manifest.entries.length,
  sealed_component_count: manifest.sealed_component_count,
  sealed_runtime_specification_digest: manifest.sealed_runtime_specification_digest,
  runtime_contract_digest: manifest.runtime_contract_digest,
  contracted_runtime_entries: entries.count,
  sources_supported: vendorRuntimeContract.sources_supported.length,
  reuses_certified_vendor_runtime_specification: true,
  vendor_neutral: true,
  design_constraints: vendorRuntimeContract.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_runtime_contract: VENDOR_RUNTIME_CONTRACT_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
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

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_RUNTIME_CONTRACT_VALIDATION_REPORT.json';
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
    `runtime_contract_id=${report.runtime_contract_id}`,
    `schema_fields=${report.schema_fields}`,
    `sections=${report.section_count}`,
    `manifest_entries=${report.manifest_entry_count}`,
    `sealed_components=${report.sealed_component_count}`,
    `contracted_runtime_entries=${report.contracted_runtime_entries}`,
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
