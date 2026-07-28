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
import {
  DSC_VENDOR_COMPATIBILITY_PHASE,
  DSC_VENDOR_COMPATIBILITY_SYSTEM_ID,
  VENDOR_COMPATIBILITY_PATH,
} from '../services/directSpatialConditioningVendorCompatibilityBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_VENDOR_ROUTER_PHASE,
  VENDOR_ROUTER_PATH,
  buildDirectSpatialConditioningVendorRouter,
  type DirectSpatialConditioningVendorRouter,
} from '../services/directSpatialConditioningVendorRouterBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-router.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-vendor-router-implementation-registry-v1.json';

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
  'vendor_router_id',
  'vendor_compatibility_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_routing_policy',
  'fallback_policy',
  'routing_report',
  'routing_flow',
];

const EXPECTED_STAGES = [
  'bind_routing_request',
  'lookup_compatible_vendors',
  'filter_eligible_vendors',
  'rank_candidates',
  'select_primary_route',
  'apply_fallback_if_needed',
  'emit_routing_report',
];

const EXPECTED_RANKING_KEYS = [
  'preferred_registration_first',
  'capability_set_version_desc',
  'vendor_profile_version_desc',
  'vendor_registration_id_asc',
];

const EXPECTED_FALLBACK_BRANCHES = [
  'no_compatible_vendors',
  'compatible_but_none_eligible',
  'preferred_ineligible_use_next_ranked',
  'explicit_unroutable_terminal',
];

const EXPECTED_REPORT_FIELDS = [
  'routing_request_id',
  'outcome',
  'selected_vendor_registration_id',
  'selected_vendor_handle',
  'fallback_branch_id',
  'candidates_considered',
  'rejected_candidates',
  'routing_codes',
  'capability_set_version',
  'spatial_frame_ref',
];

const EXPECTED_CANDIDATE_FIELDS = [
  'vendor_registration_id',
  'opaque_vendor_handle',
  'lifecycle_state',
  'capability_set_version',
  'compatibility_outcome',
  'eligibility',
  'rank_index_or_null',
  'rejection_code_or_null',
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

if (!fs.existsSync(path.join(projectRoot, VENDOR_COMPATIBILITY_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing vendor compatibility ${VENDOR_COMPATIBILITY_PATH}`
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

const vendorCompatibility = readJson<{ target?: string }>(VENDOR_COMPATIBILITY_PATH);
if (
  vendorCompatibility.target !==
  'PASS_DIRECT_SPATIAL_CONDITIONING_VENDOR_COMPATIBILITY_V1'
) {
  console.error(FAIL_VERDICT);
  console.error(
    'PRECHECK FAILED: vendor compatibility is not certified with the PASS target'
  );
  process.exit(1);
}

let vendorRouter: DirectSpatialConditioningVendorRouter;
try {
  vendorRouter =
    buildDirectSpatialConditioningVendorRouter(projectRoot).vendorRouter;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VENDOR ROUTER FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (vendorRouter.phase !== DSC_VENDOR_ROUTER_PHASE) {
  issues.push({ code: 'PHASE', message: vendorRouter.phase });
}
if (vendorRouter.mode !== 'design_only_vendor_router') {
  issues.push({ code: 'MODE', message: vendorRouter.mode });
}
if (vendorRouter.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: vendorRouter.target });
}
if (vendorRouter.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_REF',
    message: vendorRouter.vendor_compatibility_ref,
  });
}
if (vendorRouter.vendor_compatibility_phase !== DSC_VENDOR_COMPATIBILITY_PHASE) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_PHASE',
    message: vendorRouter.vendor_compatibility_phase,
  });
}
if (
  vendorRouter.vendor_compatibility_system_id !== DSC_VENDOR_COMPATIBILITY_SYSTEM_ID
) {
  issues.push({
    code: 'VENDOR_COMPATIBILITY_SYSTEM_ID',
    message: vendorRouter.vendor_compatibility_system_id,
  });
}
if (vendorRouter.vendor_registry_ref !== VENDOR_REGISTRY_PATH) {
  issues.push({
    code: 'VENDOR_REGISTRY_REF',
    message: vendorRouter.vendor_registry_ref,
  });
}
if (vendorRouter.vendor_profile_ref !== VENDOR_PROFILE_PATH) {
  issues.push({
    code: 'VENDOR_PROFILE_REF',
    message: vendorRouter.vendor_profile_ref,
  });
}
if (vendorRouter.family_ref !== BACKEND_FAMILY_PATH) {
  issues.push({ code: 'FAMILY_REF', message: vendorRouter.family_ref });
}
if (vendorRouter.family_certification_ref !== BACKEND_FAMILY_CERTIFICATION_PATH) {
  issues.push({
    code: 'FAMILY_CERTIFICATION_REF',
    message: vendorRouter.family_certification_ref,
  });
}
if (vendorRouter.reference_backend_ref !== REFERENCE_BACKEND_PATH) {
  issues.push({
    code: 'REFERENCE_BACKEND_REF',
    message: vendorRouter.reference_backend_ref,
  });
}
if (
  vendorRouter.reference_backend_certification_ref !==
  REFERENCE_BACKEND_CERTIFICATION_PATH
) {
  issues.push({
    code: 'REFERENCE_BACKEND_CERTIFICATION_REF',
    message: vendorRouter.reference_backend_certification_ref,
  });
}
if (vendorRouter.template_ref !== BACKEND_TEMPLATE_PATH) {
  issues.push({ code: 'TEMPLATE_REF', message: vendorRouter.template_ref });
}
if (vendorRouter.template_certification_ref !== BACKEND_TEMPLATE_CERTIFICATION_PATH) {
  issues.push({
    code: 'TEMPLATE_CERTIFICATION_REF',
    message: vendorRouter.template_certification_ref,
  });
}
if (vendorRouter.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: vendorRouter.profile_ref });
}
if (vendorRouter.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: vendorRouter.profile_certification_ref,
  });
}
if (
  vendorRouter.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: vendorRouter.backend_design_certification_ref,
  });
}
if (vendorRouter.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: vendorRouter.implementation_spec_ref,
  });
}
if (vendorRouter.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: vendorRouter.execution_contract_ref,
  });
}
if (vendorRouter.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({
    code: 'RUNTIME_ROUTER_REF',
    message: vendorRouter.runtime_router_ref,
  });
}
if (vendorRouter.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: vendorRouter.adapter_registration_ref,
  });
}
if (vendorRouter.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: vendorRouter.compatibility_engine_ref,
  });
}
if (vendorRouter.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: vendorRouter.capability_registry_ref,
  });
}
if (vendorRouter.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: vendorRouter.adapter_foundation_ref,
  });
}
if (vendorRouter.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: vendorRouter.runtime_interface_ref,
  });
}
if (vendorRouter.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: vendorRouter.runtime_package_ref,
  });
}
if (
  JSON.stringify(vendorRouter.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${vendorRouter.sources_supported.length}`,
  });
}
if (
  JSON.stringify(vendorRouter.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: vendorRouter.required_channels.join(','),
  });
}
if (vendorRouter.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: vendorRouter.spatial_frame_ref });
}
if (
  vendorRouter.capability_set_id !== CAPABILITY_SET_ID ||
  vendorRouter.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${vendorRouter.capability_set_id}@${vendorRouter.capability_set_version}`,
  });
}

// 1) Router schema.
const routerSchema = vendorRouter.vendor_router_schema;
if (routerSchema.schema_id !== 'dsc-vendor-router-schema-v1') {
  issues.push({ code: 'ROUTER_SCHEMA_ID', message: routerSchema.schema_id });
}
if (
  routerSchema.encoding !== 'application/json' ||
  routerSchema.identity_policy !== 'opaque_router_id_no_vendor_binding' ||
  routerSchema.vendor_compatibility_ref !== VENDOR_COMPATIBILITY_PATH ||
  routerSchema.optional_fields.length !== 0 ||
  routerSchema.additional_fields
) {
  issues.push({ code: 'ROUTER_SCHEMA_POLICY', message: routerSchema.identity_policy });
}
const schemaFields = routerSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'ROUTER_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of routerSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'ROUTER_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Routing flow.
const flow = vendorRouter.routing_flow;
if (flow.flow_id !== 'dsc-vendor-routing-flow-v1') {
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
  flow.reuse_policy.vendor_compatibility !== 'mandatory_exact_reuse' ||
  flow.reuse_policy.vendor_registry !== 'mandatory_read_only_via_compatibility' ||
  flow.accept_condition !==
    'routing report outcome is routed or fallback with declared branch' ||
  flow.reject_condition !== 'routing report outcome is unroutable' ||
  JSON.stringify(flow.outcome_values) !==
    JSON.stringify(['routed', 'fallback', 'unroutable']) ||
  flow.executes_flow_in_this_phase
) {
  issues.push({ code: 'FLOW_POLICY', message: flow.accept_condition });
}

// 3) Deterministic routing policy.
const policy = vendorRouter.deterministic_routing_policy;
if (policy.policy_id !== 'dsc-vendor-deterministic-routing-policy-v1') {
  issues.push({ code: 'ROUTING_POLICY_ID', message: policy.policy_id });
}
if (
  policy.eligibility.lifecycle_state_required !== 'active' ||
  policy.eligibility.compatibility_outcome_required !== 'compatible' ||
  policy.eligibility.vendor_profile_binding_required !== true ||
  policy.eligibility.capability_set_id_required !== CAPABILITY_SET_ID ||
  policy.eligibility.spatial_frame_required !== SPATIAL_FRAME.frame_id ||
  policy.eligibility.channel_coverage_required !== 'exact_foundation_order'
) {
  issues.push({ code: 'ROUTING_ELIGIBILITY', message: 'eligibility mismatch' });
}
const rankingKeys = policy.ranking_keys.map((key) => key.key_id);
if (JSON.stringify(rankingKeys) !== JSON.stringify(EXPECTED_RANKING_KEYS)) {
  issues.push({ code: 'RANKING_KEYS', message: rankingKeys.join(',') });
}
for (let index = 0; index < policy.ranking_keys.length; index += 1) {
  const key = policy.ranking_keys[index];
  if (
    key.order !== index + 1 ||
    !key.field ||
    (key.direction !== 'ascending' && key.direction !== 'descending') ||
    !key.description
  ) {
    issues.push({ code: 'RANKING_KEY_INCOMPLETE', message: key.key_id });
  }
}
if (
  policy.selection_rule !== 'first_after_stable_sort' ||
  policy.purity !== 'deterministic_pure_function' ||
  policy.seed_dependence !== 'none' ||
  policy.time_dependence !== 'none' ||
  policy.randomness !== 'none' ||
  policy.vendor_invocation !== 'none' ||
  policy.routes_vendors_in_this_phase ||
  policy.tie_breakers.length < 4
) {
  issues.push({ code: 'ROUTING_POLICY_PURITY', message: policy.purity });
}

// 4) Fallback policy.
const fallback = vendorRouter.fallback_policy;
if (fallback.policy_id !== 'dsc-vendor-routing-fallback-policy-v1') {
  issues.push({ code: 'FALLBACK_ID', message: fallback.policy_id });
}
const branchIds = fallback.branches.map((branch) => branch.branch_id);
if (JSON.stringify(branchIds) !== JSON.stringify(EXPECTED_FALLBACK_BRANCHES)) {
  issues.push({ code: 'FALLBACK_BRANCHES', message: branchIds.join(',') });
}
for (let index = 0; index < fallback.branches.length; index += 1) {
  const branch = fallback.branches[index];
  const validOutcome =
    branch.outcome === 'routed' ||
    branch.outcome === 'fallback' ||
    branch.outcome === 'unroutable';
  const validCode =
    branch.routing_code === null ||
    /^DSC_VENDOR_ROUTING_[A-Z0-9_]+$/.test(branch.routing_code);
  if (
    branch.order !== index + 1 ||
    !branch.condition ||
    !branch.action ||
    !validOutcome ||
    !validCode
  ) {
    issues.push({ code: 'FALLBACK_BRANCH_INCOMPLETE', message: branch.branch_id });
  }
}
if (
  fallback.primary_exhausted_behavior !== 'evaluate_fallback_branches_in_order' ||
  !fallback.never_invents_vendor ||
  !fallback.never_bypasses_compatibility ||
  fallback.executed_in_this_phase ||
  fallback.forbidden.length < 5
) {
  issues.push({ code: 'FALLBACK_POLICY', message: fallback.primary_exhausted_behavior });
}

// 5) Routing report.
const report = vendorRouter.routing_report;
if (
  report.report_schema_id !== 'dsc-vendor-routing-report-schema-v1' ||
  report.report_id !== 'dsc-vendor-routing-report-v1'
) {
  issues.push({ code: 'REPORT_SCHEMA_ID', message: report.report_id });
}
if (
  report.encoding !== 'application/json' ||
  report.additional_fields ||
  report.materializes_tensors ||
  report.materializes_frames ||
  report.routes_vendors_in_this_phase
) {
  issues.push({ code: 'REPORT_POLICY', message: report.report_id });
}
const reportFields = report.required_fields.map((field) => field.field);
if (JSON.stringify(reportFields) !== JSON.stringify(EXPECTED_REPORT_FIELDS)) {
  issues.push({ code: 'REPORT_FIELDS', message: reportFields.join(',') });
}
for (const field of report.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'REPORT_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  JSON.stringify(report.outcome_values) !==
  JSON.stringify(['routed', 'fallback', 'unroutable'])
) {
  issues.push({ code: 'REPORT_OUTCOMES', message: report.outcome_values.join(',') });
}
if (
  JSON.stringify(report.candidate_entry_shape.fields) !==
  JSON.stringify(EXPECTED_CANDIDATE_FIELDS)
) {
  issues.push({
    code: 'REPORT_CANDIDATE_SHAPE',
    message: report.candidate_entry_shape.fields.join(','),
  });
}
if (
  report.ordering.candidates_considered !== 'ranking_key_order' ||
  report.ordering.rejected_candidates !== 'ranking_key_order' ||
  report.ordering.routing_codes !== 'first_failure_order_then_lexicographic'
) {
  issues.push({ code: 'REPORT_ORDERING', message: 'ordering mismatch' });
}

// Read-only: no vendors routed in this phase.
const routed = vendorRouter.routed_vendors;
if (
  routed.count !== 0 ||
  routed.entries.length !== 0 ||
  routed.routes_vendors_in_this_phase ||
  !routed.routing_policy
) {
  issues.push({ code: 'ROUTED_VENDORS', message: `${routed.count}` });
}

// Design constraints.
const constraints = vendorRouter.design_constraints;
if (
  !constraints.router_only ||
  !constraints.read_only ||
  !constraints.vendor_neutral ||
  !constraints.reuses_vendor_compatibility ||
  !constraints.no_vendor_implementation ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.routes_vendors_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [VENDOR_ROUTER_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(vendorRouter);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report_out = {
  report_id: `direct_spatial_conditioning_vendor_router_${Date.now().toString(36)}`,
  phase: DSC_VENDOR_ROUTER_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: vendorRouter.mode,
  vendor_router_schema: routerSchema.schema_id,
  schema_fields: schemaFields.length,
  routing_flow: flow.flow_id,
  flow_stages: stageIds,
  deterministic_routing_policy: policy.policy_id,
  ranking_keys: rankingKeys.length,
  fallback_policy: fallback.policy_id,
  fallback_branches: branchIds.length,
  routing_report: report.report_id,
  report_fields: reportFields.length,
  routed_vendors: routed.count,
  sources_supported: vendorRouter.sources_supported.length,
  reuses_vendor_compatibility: true,
  vendor_neutral: true,
  no_vendor_implementation: true,
  design_constraints: vendorRouter.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    vendor_router: VENDOR_ROUTER_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    vendor_compatibility: VENDOR_COMPATIBILITY_PATH,
    vendor_registry: VENDOR_REGISTRY_PATH,
    family_certification: BACKEND_FAMILY_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_VENDOR_ROUTER_VALIDATION_REPORT.json';
fs.mkdirSync(path.dirname(path.join(projectRoot, reportPath)), { recursive: true });
fs.writeFileSync(
  path.join(projectRoot, reportPath),
  `${JSON.stringify(report_out, null, 2)}\n`,
  'utf8'
);

console.log(report_out.final_verdict);
console.log(
  [
    `mode=${report_out.mode}`,
    `schema_fields=${report_out.schema_fields}`,
    `flow_stages=${report_out.flow_stages.length}`,
    `ranking_keys=${report_out.ranking_keys}`,
    `fallback_branches=${report_out.fallback_branches}`,
    `report_fields=${report_out.report_fields}`,
    `routed_vendors=${report_out.routed_vendors}`,
    `upstream_unmodified=${report_out.upstream_protected_unmodified}`,
    `error_count=${report_out.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const issue of issues) {
    console.error(`[error] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

process.exit(0);
