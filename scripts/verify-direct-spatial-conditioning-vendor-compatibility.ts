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
import {
  DSC_VENDOR_REGISTRY_PHASE,
  DSC_VENDOR_REGISTRY_SYSTEM_ID,
  VENDOR_REGISTRY_PATH,
} from '../services/directSpatialConditioningVendorRegistryBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_COMPATIBILITY_PHASE,
  VENDOR_COMPATIBILITY_PATH,
  buildDirectSpatialConditioningVendorCompatibility,
  type DirectSpatialConditioningVendorCompatibility,
} from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-compatibility.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-compatibility-implementation-registry-v1.json';

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
  'vendor_compatibility_id',
  'vendor_registry_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'compatibility_report',
  'deterministic_compatibility_rules',
  'compatibility_flow',
];

const EXPECTED_REPORT_FIELDS = [
  'compatibility_report_id',
  'vendor_registration_id',
  'vendor_registry_ref',
  'vendor_profile_id',
  'capability_set_version',
  'outcome',
  'evaluated_rules',
  'failed_rules',
  'incompatibility_codes',
  'spatial_frame_ref',
  'evaluated_at',
];

const EXPECTED_RULE_IDS = [
  'RULE_VENDOR_REGISTRY_BOUND',
  'RULE_VENDOR_PROFILE_BOUND',
  'RULE_IDENTITY_OPAQUE',
  'RULE_CAPABILITY_SET_LOCKED',
  'RULE_CAPABILITY_INTERFACE',
  'RULE_SPATIAL_FRAME_LOCKED',
  'RULE_CHANNEL_ORDER_FOUNDATION',
  'RULE_LIFECYCLE_ACTIVE_OR_PENDING',
  'RULE_NO_GPU_NO_INFERENCE',
  'RULE_NO_VENDOR_NAME',
  'RULE_DUPLICATE_ACTIVE_REJECTED',
  'RULE_DETERMINISM_INHERITED',
];

const EXPECTED_STAGES = [
  'bind_compatibility_inputs',
  'lookup_vendor_registry',
  'validate_registration_record',
  'resolve_capability_set',
  'apply_deterministic_rules',
  'aggregate_outcome',
  'emit_compatibility_report',
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

if (!fs.existsSync(path.join(projectRoot, VENDOR_REGISTRY_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing vendor registry ${VENDOR_REGISTRY_PATH}`);
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

let vendorCompatibility: DirectSpatialConditioningVendorCompatibility;
try {
  vendorCompatibility =
    buildDirectSpatialConditioningVendorCompatibility(projectRoot).vendorCompatibility;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR COMPATIBILITY FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorCompatibility.phase !== DSC_VENDOR_COMPATIBILITY_PHASE) {
  issues.push({ code: 'PHASE', message: vendorCompatibility.phase });
}
if (vendorCompatibility.mode !== 'design_only_vendor_compatibility') {
  issues.push({ code: 'MODE', message: vendorCompatibility.mode });
}
if (vendorCompatibility.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorCompatibility.target });
}
if (vendorCompatibility.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorCompatibility.vendor_registry_ref,
  });
}
if (vendorCompatibility.vendor_registry_phase !== DSC_VENDOR_REGISTRY_PHASE) {
  issues.push({
    code: 'VENDOR_REGISTRY_PHASE',
    message: vendorCompatibility.vendor_registry_phase,
  });
}
if (vendorCompatibility.vendor_registry_system_id !== DSC_VENDOR_REGISTRY_SYSTEM_ID) {
  issues.push({
    code: 'VENDOR_REGISTRY_SYSTEM_ID',
    message: vendorCompatibility.vendor_registry_system_id,
  });
}
if (vendorCompatibility.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorCompatibility.vendor_profile_ref,
  });
}
if (vendorCompatibility.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorCompatibility.family_ref });
}
if (vendorCompatibility.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorCompatibility.family_certification_ref,
  });
}
if (vendorCompatibility.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorCompatibility.reference_backend_ref,
  });
}
if (
  vendorCompatibility.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorCompatibility.reference_backend_certification_ref,
  });
}
if (vendorCompatibility.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: vendorCompatibility.template_ref });
}
if (
  vendorCompatibility.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorCompatibility.template_certification_ref,
  });
}
if (vendorCompatibility.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorCompatibility.profile_ref });
}
if (
  vendorCompatibility.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH
) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorCompatibility.profile_certification_ref,
  });
}
if (
  vendorCompatibility.backend_design_certification_ref !==
  BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorCompatibility.backend_design_certification_ref,
  });
}
if (vendorCompatibility.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorCompatibility.implementation_spec_ref,
  });
}
if (vendorCompatibility.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorCompatibility.execution_contract_ref,
  });
}
if (vendorCompatibility.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorCompatibility.runtime_router_ref,
  });
}
if (vendorCompatibility.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorCompatibility.adapter_registration_ref,
  });
}
if (vendorCompatibility.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorCompatibility.compatibility_engine_ref,
  });
}
if (vendorCompatibility.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorCompatibility.capability_registry_ref,
  });
}
if (vendorCompatibility.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorCompatibility.adapter_foundation_ref,
  });
}
if (vendorCompatibility.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorCompatibility.runtime_interface_ref,
  });
}
if (vendorCompatibility.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorCompatibility.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorCompatibility.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorCompatibility.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorCompatibility.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorCompatibility.required_channels.join(','),
  });
}
if (vendorCompatibility.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({
    code: 'SPATIAL_FRAME',
    message: vendorCompatibility.spatial_frame_ref,
  });
}
if (
  vendorCompatibility.capability_set_id !== CAPABILITY_SET_ID ||
  vendorCompatibility.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorCompatibility.capability_set_id}@${vendorCompatibility.capability_set_version}`,
  });
}

// 1) Compatibility schema.
const compatibilitySchema = vendorCompatibility.vendor_compatibility_schema;
if (compatibilitySchema.schema_id !== 'dsc-vendor-compatibility-schema-v1') {
  issues.push({
    code: 'COMPATIBILITY_SCHEMA_ID',
    message: compatibilitySchema.schema_id,
  });
}
if (
  compatibilitySchema.encoding !== 'application/json' ||
  compatibilitySchema.identity_policy !==
    'opaque_compatibility_spec_id_no_vendor_binding' ||
  compatibilitySchema.vendor_registry_ref !== VENDOR_REGISTRY_PATH ||
  compatibilitySchema.optional_fields.length !== 0 ||
  compatibilitySchema.additional_fields
) {
  issues.push({
    code: 'COMPATIBILITY_SCHEMA_POLICY',
    message: compatibilitySchema.identity_policy,
  });
}
const schemaFields = compatibilitySchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({
    code: 'COMPATIBILITY_SCHEMA_FIELDS',
    message: schemaFields.join(','),
  });
}
for (const field of compatibilitySchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'COMPATIBILITY_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Compatibility report.
const reportSchema = vendorCompatibility.compatibility_report;
if (
  reportSchema.report_schema_id !== 'dsc-vendor-compatibility-report-schema-v1' ||
  reportSchema.report_id !== 'dsc-vendor-compatibility-report-v1'
) {
  issues.push({ code: 'REPORT_SCHEMA_ID', message: reportSchema.report_id });
}
if (
  reportSchema.encoding !== 'application/json' ||
  reportSchema.additional_fields ||
  reportSchema.materializes_tensors ||
  reportSchema.materializes_frames ||
  reportSchema.evaluates_vendors_in_this_phase
) {
  issues.push({ code: 'REPORT_POLICY', message: reportSchema.report_id });
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
  JSON.stringify(['compatible', 'incompatible'])
) {
  issues.push({
    code: 'REPORT_OUTCOMES',
    message: reportSchema.outcome_values.join(','),
  });
}
if (
  JSON.stringify(reportSchema.rule_result_shape.fields) !==
    JSON.stringify(['rule_id', 'outcome', 'fail_code']) ||
  JSON.stringify(reportSchema.rule_result_shape.outcome_values) !==
    JSON.stringify(['compatible', 'incompatible'])
) {
  issues.push({ code: 'REPORT_RULE_RESULT_SHAPE', message: 'shape mismatch' });
}
if (
  reportSchema.ordering.evaluated_rules !==
    'deterministic_compatibility_rules_order' ||
  reportSchema.ordering.failed_rules !== 'deterministic_compatibility_rules_order' ||
  reportSchema.ordering.incompatibility_codes !==
    'first_failure_order_then_lexicographic'
) {
  issues.push({ code: 'REPORT_ORDERING', message: 'ordering mismatch' });
}

// 3) Deterministic compatibility rules.
const rules = vendorCompatibility.deterministic_compatibility_rules;
if (rules.rules_id !== 'dsc-vendor-deterministic-compatibility-rules-v1') {
  issues.push({ code: 'RULES_ID', message: rules.rules_id });
}
if (
  rules.purity !== 'deterministic_pure_function' ||
  rules.seed_dependence !== 'none' ||
  rules.time_dependence !== 'none' ||
  rules.randomness !== 'none' ||
  rules.vendor_invocation !== 'none' ||
  rules.aggregation_rule !== 'all_mandatory_rules_must_pass' ||
  rules.evaluation !== 'collect_all_incompatibility_codes' ||
  rules.evaluates_vendors_in_this_phase
) {
  issues.push({ code: 'RULES_PURITY', message: rules.purity });
}
if (rules.rules.length !== 12) {
  issues.push({ code: 'RULES_COUNT', message: `${rules.rules.length}` });
}
const ruleIds = rules.rules.map((rule) => rule.rule_id);
if (JSON.stringify(ruleIds) !== JSON.stringify(EXPECTED_RULE_IDS)) {
  issues.push({ code: 'RULE_IDS', message: ruleIds.join(',') });
}
const seenRuleIds = new Set<string>();
const seenFailCodes = new Set<string>();
for (let index = 0; index < rules.rules.length; index += 1) {
  const rule = rules.rules[index];
  if (seenRuleIds.has(rule.rule_id)) {
    issues.push({ code: 'RULE_DUPLICATE', message: rule.rule_id });
  }
  seenRuleIds.add(rule.rule_id);
  if (seenFailCodes.has(rule.fail_code)) {
    issues.push({ code: 'FAIL_CODE_DUPLICATE', message: rule.fail_code });
  }
  seenFailCodes.add(rule.fail_code);
  if (
    rule.order !== index + 1 ||
    !rule.mandatory ||
    !rule.deterministic ||
    rule.evaluated_in_this_phase ||
    !rule.description ||
    !rule.pass_condition ||
    !/^DSC_VENDOR_COMPAT_FAIL_[A-Z0-9_]+$/.test(rule.fail_code)
  ) {
    issues.push({ code: 'RULE_INCOMPLETE', message: rule.rule_id });
  }
}

// 4) Compatibility flow.
const flow = vendorCompatibility.compatibility_flow;
if (flow.flow_id !== 'dsc-vendor-compatibility-flow-v1') {
  issues.push({ code: 'FLOW_ID', message: flow.flow_id });
}
const stageIds = flow.ordered_stages.map((stage) => stage.stage_id);
if (JSON.stringify(stageIds) !== JSON.stringify(EXPECTED_STAGES)) {
  issues.push({ code: 'FLOW_STAGES', message: stageIds.join(',') });
}
for (let index = 0; index < flow.ordered_stages.length; index += 1) {
  const stage = flow.ordered_stages[index];
  if (
    stage.order !== index + 1 ||
    stage.side_effects !== 'none' ||
    stage.executed_in_this_phase ||
    stage.inputs.length === 0 ||
    stage.outputs.length === 0 ||
    !stage.description
  ) {
    issues.push({ code: 'FLOW_STAGE_INCOMPLETE', message: stage.stage_id });
  }
}
if (
  flow.reuse_policy.vendor_registry !== 'mandatory_exact_reuse' ||
  flow.reuse_policy.vendor_profile !== 'mandatory_read_only_via_registry' ||
  flow.accept_condition !== 'compatibility report outcome is compatible' ||
  flow.reject_condition !== 'compatibility report outcome is incompatible' ||
  JSON.stringify(flow.outcome_values) !==
    JSON.stringify(['compatible', 'incompatible']) ||
  flow.executes_flow_in_this_phase
) {
  issues.push({ code: 'FLOW_POLICY', message: flow.accept_condition });
}

// Read-only: no vendors evaluated in this phase.
const evaluated = vendorCompatibility.evaluated_vendors;
if (
  evaluated.count !== 0 ||
  evaluated.entries.length !== 0 ||
  evaluated.evaluates_vendors_in_this_phase ||
  !evaluated.evaluation_policy
) {
  issues.push({ code: 'EVALUATED_VENDORS', message: `${evaluated.count}` });
}

// Design constraints.
const constraints = vendorCompatibility.design_constraints;
if (
  !constraints.compatibility_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_vendor_registry ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.evaluates_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  VENDOR_COMPATIBILITY_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorCompatibility);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_vendor_compatibility_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_COMPATIBILITY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorCompatibility.mode,
  vendor_compatibility_schema: compatibilitySchema.schema_id,
  schema_fields: schemaFields.length,
  compatibility_report: reportSchema.report_id,
  report_fields: reportFields.length,
  deterministic_compatibility_rules: rules.rules_id,
  compatibility_rules: rules.rules.length,
  compatibility_flow: flow.flow_id,
  flow_stages: stageIds,
  evaluated_vendors: evaluated.count,
  sources_supported: vendorCompatibility.sources_supported.length,
  reuses_vendor_registry: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorCompatibility.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_compatibility: VENDOR_COMPATIBILITY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_registry: VENDOR_REGISTRY_PATH,
    vendor_profile: VENDOR_PROFILE_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_VALIDATION_REPORT.json';
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
    `schema_fields=${report.schema_fields}`,
    `report_fields=${report.report_fields}`,
    `compatibility_rules=${report.compatibility_rules}`,
    `flow_stages=${report.flow_stages.length}`,
    `evaluated_vendors=${report.evaluated_vendors}`,
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
