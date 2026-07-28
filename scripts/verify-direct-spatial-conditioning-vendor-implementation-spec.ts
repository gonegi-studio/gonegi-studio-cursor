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
  type DirectSpatialConditioningVendorProfile,
} from '../services/directSpatialConditioningVendorProfileBuilder.js';
import { VENDOR_REGISTRY_PATH } from '../services/directSpatialConditioningVendorRegistryBuilder.js';
import { VENDOR_COMPATIBILITY_PATH } from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';
import { VENDOR_ROUTER_PATH } from '../services/directSpatialConditioningVendorRouterBuilder.js';
import {
  DSC_VENDOR_EXECUTION_CONTRACT_PHASE,
  DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID,
  VENDOR_EXECUTION_CONTRACT_PATH,
} from '../services/directSpatialConditioningVendorExecutionContractBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  buildDirectSpatialConditioningVendorImplementationSpec,
  type DirectSpatialConditioningVendorImplementationSpec,
} from '../services/directSpatialConditioningVendorImplementationSpecBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-spec.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-implementation-spec-implementation-registry-v1.json';

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

const EXPECTED_METHODS = [
  'describe_capabilities',
  'check_compatibility',
  'bind_conditioning_input',
  'release_conditioning_binding',
];

const EXPECTED_REPORT_FIELDS = [
  'implementation_report_id',
  'opaque_vendor_handle',
  'vendor_execution_contract_ref',
  'vendor_implementation_spec_ref',
  'outcome',
  'checklist_results',
  'failed_checks',
  'fail_codes',
  'methods_implemented',
  'spatial_frame_ref',
  'capability_set_version',
  'evaluated_at',
];

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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  BACKEND_TEMPLATE_CERTIFICATION_PATH,
  REFERENCE_BACKEND_CERTIFICATION_PATH,
  BACKEND_FAMILY_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, VENDOR_EXECUTION_CONTRACT_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor execution contract ${VENDOR_EXECUTION_CONTRACT_PATH}`
  );
  process.exit(1);
}
if (!fs.existsSync(path.join(projectRoot, BACKEND_FAMILY_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing backend family certification ${BACKEND_FAMILY_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const familyCertification = readJson<{ certified?: boolean }>(
  BACKEND_FAMILY_CERTIFICATION_PATH
);
if (familyCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: backend family is not certified');
  process.exit(1);
}

const vendorExecutionContract = readJson<{ target?: string }>(
  VENDOR_EXECUTION_CONTRACT_PATH
);
if (
  vendorExecutionContract.target !==
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_EXECUTION_CONTRACT_V1'
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: vendor execution contract is not certified with the PASS target'
  );
  process.exit(1);
}

const vendorProfile = readJson<DirectSpatialConditioningVendorProfile>(
  VENDOR_PROFILE_PATH
);

let vendorImplementationSpec: DirectSpatialConditioningVendorImplementationSpec;
try {
  vendorImplementationSpec =
    buildDirectSpatialConditioningVendorImplementationSpec(projectRoot)
      .vendorImplementationSpec;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(
    `VENDOR IMPLEMENTATION SPEC FAILED: ${(error as Error).message}`
  );
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorImplementationSpec.phase !== DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE) {
  issues.push({ code: 'PHASE', message: vendorImplementationSpec.phase });
}
if (vendorImplementationSpec.mode !== 'design_only_vendor_implementation_spec') {
  issues.push({ code: 'MODE', message: vendorImplementationSpec.mode });
}
if (vendorImplementationSpec.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorImplementationSpec.target });
}
if (
  vendorImplementationSpec.vendor_execution_contract_ref !==
  VENDOR_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_REF',
    message: vendorImplementationSpec.vendor_execution_contract_ref,
  });
}
if (
  vendorImplementationSpec.vendor_execution_contract_phase !==
  DSC_VENDOR_EXECUTION_CONTRACT_PHASE
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_PHASE',
    message: vendorImplementationSpec.vendor_execution_contract_phase,
  });
}
if (
  vendorImplementationSpec.vendor_execution_contract_system_id !==
  DSC_VENDOR_EXECUTION_CONTRACT_SYSTEM_ID
) {
  issues.push({
    code: 'VENDOR_EXECUTION_CONTRACT_SYSTEM_ID',
    message: vendorImplementationSpec.vendor_execution_contract_system_id,
  });
}
if (vendorImplementationSpec.vendor_router_ref !== VENDOR_ROUTER_PATH) {
  issues.push({
    code: 'VENDOR_ROUTER_REF',
    message: vendorImplementationSpec.vendor_router_ref,
  });
}
if (
  vendorImplementationSpec.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH
) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: vendorImplementationSpec.vendor_compatibility_ref,
  });
}
if (vendorImplementationSpec.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorImplementationSpec.vendor_registry_ref,
  });
}
if (vendorImplementationSpec.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorImplementationSpec.vendor_profile_ref,
  });
}
if (vendorImplementationSpec.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorImplementationSpec.family_ref });
}
if (
  vendorImplementationSpec.family_certification_ref !==
  BACKEND_FAMILY_CERTIFICATION_PATH
) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorImplementationSpec.family_certification_ref,
  });
}
if (vendorImplementationSpec.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorImplementationSpec.reference_backend_ref,
  });
}
if (
  vendorImplementationSpec.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorImplementationSpec.reference_backend_certification_ref,
  });
}
if (vendorImplementationSpec.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({
    code: 'TEMPLATE_REF',
    message: vendorImplementationSpec.template_ref,
  });
}
if (
  vendorImplementationSpec.template_certification_ref !==
  BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorImplementationSpec.template_certification_ref,
  });
}
if (vendorImplementationSpec.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({
    code: 'PROFILE_REF',
    message: vendorImplementationSpec.profile_ref,
  });
}
if (
  vendorImplementationSpec.profile_certification_ref !==
  BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorImplementationSpec.profile_certification_ref,
  });
}
if (
  vendorImplementationSpec.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorImplementationSpec.backend_design_certification_ref,
  });
}
if (
  vendorImplementationSpec.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH
) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorImplementationSpec.implementation_spec_ref,
  });
}
if (
  vendorImplementationSpec.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH
) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorImplementationSpec.execution_contract_ref,
  });
}
if (vendorImplementationSpec.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorImplementationSpec.runtime_router_ref,
  });
}
if (
  vendorImplementationSpec.adapter_registration_ref !==
  BACKEND_ADAPTER_REGISTRATION_PATH
) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorImplementationSpec.adapter_registration_ref,
  });
}
if (
  vendorImplementationSpec.compatibility_engine_ref !==
  BACKEND_COMPATIBILITY_ENGINE_PATH
) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorImplementationSpec.compatibility_engine_ref,
  });
}
if (
  vendorImplementationSpec.capability_registry_ref !==
  BACKEND_CAPABILITY_REGISTRY_PATH
) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorImplementationSpec.capability_registry_ref,
  });
}
if (
  vendorImplementationSpec.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH
) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorImplementationSpec.adapter_foundation_ref,
  });
}
if (vendorImplementationSpec.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorImplementationSpec.runtime_interface_ref,
  });
}
if (vendorImplementationSpec.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorImplementationSpec.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorImplementationSpec.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorImplementationSpec.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorImplementationSpec.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorImplementationSpec.required_channels.join(','),
  });
}
if (vendorImplementationSpec.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorImplementationSpec.spatial_frame_ref,
  });
}
if (
  vendorImplementationSpec.capability_set_id !== CAPABILITY_SET_ID ||
  vendorImplementationSpec.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorImplementationSpec.capability_set_id}@${vendorImplementationSpec.capability_set_version}`,
  });
}

// 1) Vendor implementation requirements.
const requirementsBlock = vendorImplementationSpec.vendor_implementation_requirements;
if (
  requirementsBlock.requirements_id !== 'dsc-vendor-implementation-requirements-v1'
) {
  issues.push({
    code: 'REQUIREMENTS_ID',
    message: requirementsBlock.requirements_id,
  });
}
if (requirementsBlock.requirements.length !== 12) {
  issues.push({
    code: 'REQUIREMENTS_COUNT',
    message: `${requirementsBlock.requirements.length}`,
  });
}
const seenRequirementIds = new Set<string>();
for (const requirement of requirementsBlock.requirements) {
  if (seenRequirementIds.has(requirement.requirement_id)) {
    issues.push({
      code: 'REQUIREMENT_DUPLICATE',
      message: requirement.requirement_id,
    });
  }
  seenRequirementIds.add(requirement.requirement_id);
  if (
    !requirement.mandatory ||
    requirement.implemented_in_this_phase ||
    !requirement.category ||
    !requirement.description ||
    !requirement.evidence_ref
  ) {
    issues.push({
      code: 'REQUIREMENT_INCOMPLETE',
      message: requirement.requirement_id,
    });
  }
}
for (const requiredId of [
  'REQ_IMPLEMENT_VENDOR_INTERFACE',
  'REQ_EXECUTION_REQUEST_SHAPE',
  'REQ_EXECUTION_RESPONSE_SHAPE',
  'REQ_DETERMINISTIC_OUTCOME',
  'REQ_NO_GPU_NO_INFERENCE',
]) {
  if (!seenRequirementIds.has(requiredId)) {
    issues.push({ code: 'REQUIREMENT_MISSING', message: requiredId });
  }
}

// 2) Required interfaces — must mirror PHASE-055 vendor capability methods.
const interfaces = vendorImplementationSpec.required_interfaces;
if (interfaces.interfaces_id !== 'dsc-vendor-required-interfaces-v1') {
  issues.push({ code: 'INTERFACES_ID', message: interfaces.interfaces_id });
}
if (
  interfaces.vendor_capability_interface_ref !==
    'dsc-vendor-capability-interface-v1' ||
  interfaces.vendor_profile_ref !== VENDOR_PROFILE_PATH ||
  interfaces.implements_interfaces_in_this_phase
) {
  issues.push({
    code: 'INTERFACES_BINDING',
    message: interfaces.vendor_capability_interface_ref,
  });
}
const methodIds = interfaces.methods.map((method) => method.method_id);
if (JSON.stringify(methodIds) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'INTERFACE_METHODS', message: methodIds.join(',') });
}
const profileMethodIds = vendorProfile.vendor_capability_interface.methods.map(
  (method) => method.method_id
);
if (JSON.stringify(methodIds) !== JSON.stringify(profileMethodIds)) {
  issues.push({ code: 'INTERFACE_METHOD_DRIFT', message: methodIds.join(',') });
}
for (const method of interfaces.methods) {
  if (
    !method.abstract ||
    !method.must_be_implemented_by_vendor ||
    method.requires_gpu ||
    method.performs_inference ||
    method.implemented_in_this_phase ||
    !method.signature
  ) {
    issues.push({ code: 'INTERFACE_METHOD_FLAGS', message: method.method_id });
  }
}
if (interfaces.surfaces.length !== 5) {
  issues.push({
    code: 'INTERFACE_SURFACES',
    message: `${interfaces.surfaces.length}`,
  });
}
for (const surface of interfaces.surfaces) {
  if (!surface.mandatory || !surface.artifact_ref || !surface.purpose) {
    issues.push({
      code: 'INTERFACE_SURFACE_INCOMPLETE',
      message: surface.surface_id,
    });
  }
}

// 3) Deterministic compliance checklist.
const checklist = vendorImplementationSpec.deterministic_compliance_checklist;
if (checklist.checklist_id !== 'dsc-vendor-deterministic-compliance-checklist-v1') {
  issues.push({ code: 'CHECKLIST_ID', message: checklist.checklist_id });
}
if (
  checklist.evaluation !== 'collect_all_failures' ||
  checklist.accept_condition !== 'zero failed checks' ||
  JSON.stringify(checklist.outcome_values) !==
    JSON.stringify(['compliant', 'non_compliant']) ||
  checklist.evaluates_implementations_in_this_phase
) {
  issues.push({ code: 'CHECKLIST_POLICY', message: checklist.accept_condition });
}
if (checklist.items.length !== 16) {
  issues.push({
    code: 'CHECKLIST_ITEMS',
    message: `${checklist.items.length}`,
  });
}
const seenCheckIds = new Set<string>();
const seenFailCodes = new Set<string>();
for (const item of checklist.items) {
  if (seenCheckIds.has(item.check_id)) {
    issues.push({ code: 'CHECKLIST_CHECK_DUPLICATE', message: item.check_id });
  }
  seenCheckIds.add(item.check_id);
  if (seenFailCodes.has(item.fail_code)) {
    issues.push({ code: 'CHECKLIST_CODE_DUPLICATE', message: item.fail_code });
  }
  seenFailCodes.add(item.fail_code);
  if (
    !item.mandatory ||
    item.status_in_this_phase !== 'not_evaluated' ||
    item.evaluation !== 'design_time_declaration_only' ||
    !item.requirement_id ||
    !item.pass_condition ||
    !/^DSC_VENDOR_IMPL_FAIL_[A-Z0-9_]+$/.test(item.fail_code)
  ) {
    issues.push({ code: 'CHECKLIST_ITEM_INCOMPLETE', message: item.check_id });
  }
}
for (const requiredCheck of [
  'CHK_NO_SEED_DEPENDENCE',
  'CHK_NO_TIME_DEPENDENCE',
  'CHK_NO_RANDOMNESS',
  'CHK_CHANNEL_ORDER_FOUNDATION',
]) {
  if (!seenCheckIds.has(requiredCheck)) {
    issues.push({ code: 'CHECKLIST_MISSING', message: requiredCheck });
  }
}

// 4) Implementation report.
const reportSchema = vendorImplementationSpec.implementation_report;
if (
  reportSchema.report_schema_id !== 'dsc-vendor-implementation-report-schema-v1' ||
  reportSchema.report_id !== 'dsc-vendor-implementation-report-v1'
) {
  issues.push({ code: 'REPORT_ID', message: reportSchema.report_id });
}
const reportFields = reportSchema.required_fields.map((field) => field.field);
if (JSON.stringify(reportFields) !== JSON.stringify(EXPECTED_REPORT_FIELDS)) {
  issues.push({ code: 'REPORT_FIELDS', message: reportFields.join(',') });
}
for (const field of reportSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'REPORT_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  JSON.stringify(reportSchema.outcome_values) !==
    JSON.stringify(['compliant', 'non_compliant']) ||
  reportSchema.checklist_entry_shape.fields.length !== 5 ||
  JSON.stringify(reportSchema.checklist_entry_shape.status_values) !==
    JSON.stringify(['pass', 'fail', 'not_evaluated']) ||
  reportSchema.ordering.checklist_results !== 'checklist_item_order' ||
  reportSchema.ordering.failed_checks !== 'checklist_item_order' ||
  reportSchema.additional_fields ||
  reportSchema.materializes_tensors ||
  reportSchema.materializes_frames ||
  reportSchema.evaluates_implementations_in_this_phase
) {
  issues.push({
    code: 'REPORT_POLICY',
    message: 'outcomes/ordering/materialization',
  });
}

// Read-only: no vendors implemented in this phase.
const implemented = vendorImplementationSpec.implemented_vendors;
if (
  implemented.count !== 0 ||
  implemented.entries.length !== 0 ||
  implemented.implements_vendors_in_this_phase ||
  !implemented.implementation_policy
) {
  issues.push({ code: 'IMPLEMENTED_VENDORS', message: `${implemented.count}` });
}

// Design constraints.
const constraints = vendorImplementationSpec.design_constraints;
if (
  !constraints.specification_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_vendor_execution_contract ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.implements_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_IMPLEMENTATION_SPEC_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorImplementationSpec);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_implementation_spec_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_IMPLEMENTATION_SPEC_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorImplementationSpec.mode,
  vendor_implementation_requirements: requirementsBlock.requirements_id,
  requirement_count: requirementsBlock.requirements.length,
  required_interfaces: interfaces.interfaces_id,
  required_methods: methodIds,
  required_surfaces: interfaces.surfaces.length,
  deterministic_compliance_checklist: checklist.checklist_id,
  checklist_items: checklist.items.length,
  implementation_report: reportSchema.report_id,
  implementation_report_fields: reportFields.length,
  implemented_vendors: implemented.count,
  sources_supported: vendorImplementationSpec.sources_supported.length,
  reuses_vendor_execution_contract: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorImplementationSpec.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_implementation_spec: VENDOR_IMPLEMENTATION_SPEC_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_execution_contract: VENDOR_EXECUTION_CONTRACT_PATH,
    vendor_router: VENDOR_ROUTER_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_IMPLEMENTATION_SPEC_VALIDATION_REPORT.json';
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
    `requirements=${report.requirement_count}`,
    `methods=${report.required_methods.length}`,
    `surfaces=${report.required_surfaces}`,
    `checklist_items=${report.checklist_items}`,
    `report_fields=${report.implementation_report_fields}`,
    `implemented_vendors=${report.implemented_vendors}`,
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
