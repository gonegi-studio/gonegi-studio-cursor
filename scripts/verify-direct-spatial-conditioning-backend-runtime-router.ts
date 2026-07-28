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
import {
  BACKEND_ADAPTER_REGISTRATION_PATH,
  type DirectSpatialConditioningBackendAdapterRegistration,
} from '../services/directSpatialConditioningBackendAdapterRegistrationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_RUNTIME_ROUTER_PATH,
  DSC_BACKEND_RUNTIME_ROUTER_PHASE,
  buildDirectSpatialConditioningBackendRuntimeRouter,
  type DirectSpatialConditioningBackendRuntimeRouter,
} from '../services/directSpatialConditioningBackendRuntimeRouterBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-runtime-router.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-runtime-router-implementation-registry-v1.json';

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

const EXPECTED_STAGES = [
  'bind_routing_request',
  'lookup_active_registrations',
  'filter_eligible_adapters',
  'rank_candidates',
  'select_primary_route',
  'apply_fallback_if_needed',
  'emit_routing_report',
];

const EXPECTED_RANKING_KEYS = [
  'preferred_registration_first',
  'capability_set_version_desc',
  'backend_version_asc',
  'registration_id_asc',
];

const EXPECTED_FALLBACK_BRANCHES = [
  'no_active_registrations',
  'active_but_none_eligible',
  'preferred_ineligible_use_next_ranked',
  'explicit_unroutable_terminal',
];

const EXPECTED_REPORT_FIELDS = [
  'routing_request_id',
  'outcome',
  'selected_registration_id',
  'selected_backend_id',
  'fallback_branch_id',
  'candidates_considered',
  'rejected_candidates',
  'routing_codes',
  'capability_set_version',
  'spatial_frame_ref',
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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_ADAPTER_REGISTRATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing adapter registration ${BACKEND_ADAPTER_REGISTRATION_PATH}`
  );
  process.exit(1);
}

const adapterRegistration = readJson<DirectSpatialConditioningBackendAdapterRegistration>(
  BACKEND_ADAPTER_REGISTRATION_PATH
);

let runtimeRouter: DirectSpatialConditioningBackendRuntimeRouter;
try {
  runtimeRouter =
    buildDirectSpatialConditioningBackendRuntimeRouter(projectRoot).runtimeRouter;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`RUNTIME ROUTER FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (runtimeRouter.phase !== DSC_BACKEND_RUNTIME_ROUTER_PHASE) {
  issues.push({ code: 'PHASE', message: runtimeRouter.phase });
}
if (runtimeRouter.mode !== 'design_only_router') {
  issues.push({ code: 'MODE', message: runtimeRouter.mode });
}
if (runtimeRouter.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: runtimeRouter.target });
}
if (runtimeRouter.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: runtimeRouter.adapter_registration_ref,
  });
}
if (runtimeRouter.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: runtimeRouter.compatibility_engine_ref,
  });
}
if (runtimeRouter.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: runtimeRouter.capability_registry_ref,
  });
}
if (runtimeRouter.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: runtimeRouter.adapter_foundation_ref,
  });
}
if (runtimeRouter.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: runtimeRouter.runtime_interface_ref,
  });
}
if (runtimeRouter.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: runtimeRouter.runtime_package_ref,
  });
}
if (
  JSON.stringify(runtimeRouter.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${runtimeRouter.sources_supported.length}`,
  });
}
if (
  JSON.stringify(runtimeRouter.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: runtimeRouter.required_channels.join(','),
  });
}
if (runtimeRouter.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: runtimeRouter.spatial_frame_ref });
}
if (
  runtimeRouter.capability_set_id !== CAPABILITY_SET_ID ||
  runtimeRouter.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${runtimeRouter.capability_set_id}@${runtimeRouter.capability_set_version}`,
  });
}
if (
  runtimeRouter.adapter_registration_phase !== adapterRegistration.phase ||
  runtimeRouter.adapter_registration_system_id !== adapterRegistration.system_id
) {
  issues.push({ code: 'REGISTRATION_IDENTITY_DRIFT', message: 'phase/system_id' });
}

// 1) Selection flow.
const flow = runtimeRouter.selection_flow;
if (flow.flow_id !== 'dsc-backend-selection-flow-v1') {
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
  flow.reuse_policy.adapter_registration !== 'mandatory_exact_reuse' ||
  flow.reuse_policy.compatibility_engine !== 'mandatory_read_only_via_registration'
) {
  issues.push({ code: 'FLOW_REUSE_POLICY', message: JSON.stringify(flow.reuse_policy) });
}
if (
  JSON.stringify(flow.outcome_values) !==
  JSON.stringify(['routed', 'fallback', 'unroutable'])
) {
  issues.push({ code: 'FLOW_OUTCOMES', message: flow.outcome_values.join(',') });
}

// 2) Deterministic routing policy.
const policy = runtimeRouter.deterministic_routing_policy;
if (policy.policy_id !== 'dsc-backend-deterministic-routing-policy-v1') {
  issues.push({ code: 'POLICY_ID', message: policy.policy_id });
}
if (
  policy.eligibility.lifecycle_state_required !==
    adapterRegistration.lifecycle.active_state ||
  policy.eligibility.compatibility_outcome_required !== 'compatible' ||
  policy.eligibility.capability_set_id_required !== CAPABILITY_SET_ID ||
  policy.eligibility.spatial_frame_required !== SPATIAL_FRAME.frame_id ||
  policy.eligibility.channel_coverage_required !== 'exact_foundation_order'
) {
  issues.push({ code: 'POLICY_ELIGIBILITY', message: JSON.stringify(policy.eligibility) });
}
const rankingKeyIds = policy.ranking_keys.map((key) => key.key_id);
if (JSON.stringify(rankingKeyIds) !== JSON.stringify(EXPECTED_RANKING_KEYS)) {
  issues.push({ code: 'RANKING_KEYS', message: rankingKeyIds.join(',') });
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
  policy.backend_invocation !== 'none' ||
  policy.selects_backends_in_this_phase ||
  policy.tie_breakers.length < 4
) {
  issues.push({ code: 'POLICY_PURITY', message: policy.selection_rule });
}

// 3) Fallback policy.
const fallback = runtimeRouter.fallback_policy;
if (fallback.policy_id !== 'dsc-backend-routing-fallback-policy-v1') {
  issues.push({ code: 'FALLBACK_ID', message: fallback.policy_id });
}
if (fallback.primary_exhausted_behavior !== 'evaluate_fallback_branches_in_order') {
  issues.push({
    code: 'FALLBACK_BEHAVIOR',
    message: fallback.primary_exhausted_behavior,
  });
}
const branchIds = fallback.branches.map((branch) => branch.branch_id);
if (JSON.stringify(branchIds) !== JSON.stringify(EXPECTED_FALLBACK_BRANCHES)) {
  issues.push({ code: 'FALLBACK_BRANCHES', message: branchIds.join(',') });
}
const seenBranchIds = new Set<string>();
for (const branch of fallback.branches) {
  if (seenBranchIds.has(branch.branch_id)) {
    issues.push({ code: 'FALLBACK_BRANCH_DUPLICATE', message: branch.branch_id });
  }
  seenBranchIds.add(branch.branch_id);
  if (
    !branch.condition ||
    !branch.action ||
    !['routed', 'fallback', 'unroutable'].includes(branch.outcome)
  ) {
    issues.push({ code: 'FALLBACK_BRANCH_INCOMPLETE', message: branch.branch_id });
  }
}
if (
  !fallback.never_invents_backend ||
  !fallback.never_bypasses_registration ||
  fallback.executed_in_this_phase ||
  fallback.forbidden.length < 5
) {
  issues.push({ code: 'FALLBACK_GUARDS', message: 'guards violated' });
}

// 4) Routing report.
const reportSchema = runtimeRouter.routing_report;
if (
  reportSchema.report_schema_id !== 'dsc-backend-routing-report-schema-v1' ||
  reportSchema.report_id !== 'dsc-backend-routing-report-v1'
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
  JSON.stringify(['routed', 'fallback', 'unroutable'])
) {
  issues.push({ code: 'REPORT_OUTCOMES', message: reportSchema.outcome_values.join(',') });
}
if (reportSchema.candidate_entry_shape.fields.length !== 7) {
  issues.push({
    code: 'REPORT_CANDIDATE_SHAPE',
    message: `${reportSchema.candidate_entry_shape.fields.length}`,
  });
}
if (
  reportSchema.ordering.candidates_considered !== 'ranking_key_order' ||
  reportSchema.ordering.rejected_candidates !== 'ranking_key_order' ||
  reportSchema.additional_fields ||
  reportSchema.materializes_tensors ||
  reportSchema.materializes_frames
) {
  issues.push({ code: 'REPORT_POLICY', message: 'ordering/materialization' });
}

// Read-only: no backend routed in this phase.
const routed = runtimeRouter.routed_backends;
if (
  routed.count !== 0 ||
  routed.entries.length !== 0 ||
  routed.routes_backends_in_this_phase ||
  !routed.routing_policy
) {
  issues.push({ code: 'ROUTED_BACKENDS', message: `${routed.count}` });
}

// Design constraints.
const constraints = runtimeRouter.design_constraints;
if (
  !constraints.router_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_adapter_registration ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.routes_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [BACKEND_RUNTIME_ROUTER_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(runtimeRouter);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_runtime_router_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_RUNTIME_ROUTER_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: runtimeRouter.mode,
  selection_flow: flow.flow_id,
  selection_stages: stageIds,
  deterministic_routing_policy: policy.policy_id,
  ranking_keys: rankingKeyIds.length,
  fallback_policy: fallback.policy_id,
  fallback_branches: branchIds.length,
  routing_report: reportSchema.report_id,
  routing_report_fields: reportFields.length,
  routed_backends: routed.count,
  sources_supported: runtimeRouter.sources_supported.length,
  reuses_adapter_registration: true,
  backend_agnostic: true,
  design_constraints: runtimeRouter.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    runtime_router: BACKEND_RUNTIME_ROUTER_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    adapter_registration: BACKEND_ADAPTER_REGISTRATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_RUNTIME_ROUTER_VALIDATION_REPORT.json';
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
    `stages=${report.selection_stages.length}`,
    `ranking_keys=${report.ranking_keys}`,
    `fallback_branches=${report.fallback_branches}`,
    `report_fields=${report.routing_report_fields}`,
    `routed_backends=${report.routed_backends}`,
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
