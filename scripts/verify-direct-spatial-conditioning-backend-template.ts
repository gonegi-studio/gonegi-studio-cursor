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
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
  type DirectSpatialConditioningBackendAdapterFoundation,
} from '../services/directSpatialConditioningBackendAdapterFoundationBuilder.js';
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
import {
  BACKEND_PROFILE_ID,
  BACKEND_PROFILE_PATH,
} from '../services/directSpatialConditioningBackendProfileBuilder.js';
import { BACKEND_PROFILE_CERTIFICATION_PATH } from '../services/directSpatialConditioningBackendProfileCertificationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_TEMPLATE_ID,
  BACKEND_TEMPLATE_PATH,
  BACKEND_TEMPLATE_VERSION,
  DSC_BACKEND_TEMPLATE_PHASE,
  buildDirectSpatialConditioningBackendTemplate,
  type DirectSpatialConditioningBackendTemplate,
} from '../services/directSpatialConditioningBackendTemplateBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_TEMPLATE_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_TEMPLATE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-template.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-template-implementation-registry-v1.json';

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

const EXPECTED_EXTENSION_POINTS = [
  'EXT_DECLARE_CAPABILITIES',
  'EXT_RESOLVE_COMPATIBILITY',
  'EXT_BIND_ADAPTED_INPUT',
  'EXT_RELEASE_BINDING',
];

const EXPECTED_SCHEMA_FIELDS = [
  'template_id',
  'template_version',
  'template_kind',
  'profile_ref',
  'capability_set_id',
  'capability_set_version',
  'spatial_frame_ref',
  'required_channels',
  'deterministic_implementation_skeleton',
  'extension_points',
  'validation_template',
];

const EXPECTED_VALIDATION_CHECKS = [
  'CHK_TEMPLATE_IDENTITY_OPAQUE',
  'CHK_PROFILE_BINDING',
  'CHK_SKELETON_STEP_COVERAGE',
  'CHK_SKELETON_ORDER_FIXED',
  'CHK_SKELETON_SIDE_EFFECT_FREE',
  'CHK_SKELETON_DETERMINISTIC',
  'CHK_EXTENSION_POINT_COVERAGE',
  'CHK_EXTENSION_SET_CLOSED',
  'CHK_EXTENSION_DETERMINISM_INHERITED',
  'CHK_CHANNEL_ORDER_FOUNDATION',
  'CHK_SPATIAL_FRAME_LOCKED',
  'CHK_NO_GPU_NO_INFERENCE',
  'CHK_NO_BACKEND_TEMPLATED',
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
  BACKEND_DESIGN_CERTIFICATION_PATH,
  BACKEND_PROFILE_CERTIFICATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_PROFILE_CERTIFICATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing profile certification ${BACKEND_PROFILE_CERTIFICATION_PATH}`
  );
  process.exit(1);
}

const profileCertification = readJson<{ certified?: boolean }>(
  BACKEND_PROFILE_CERTIFICATION_PATH
);
if (profileCertification.certified !== true) {
  console.error(FAIL_VERDICT);
  console.error('PRECHECK FAILED: backend profile is not certified');
  process.exit(1);
}

const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
  BACKEND_ADAPTER_FOUNDATION_PATH
);

let backendTemplate: DirectSpatialConditioningBackendTemplate;
try {
  backendTemplate =
    buildDirectSpatialConditioningBackendTemplate(projectRoot).backendTemplate;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`BACKEND TEMPLATE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (backendTemplate.phase !== DSC_BACKEND_TEMPLATE_PHASE) {
  issues.push({ code: 'PHASE', message: backendTemplate.phase });
}
if (backendTemplate.mode !== 'design_only_template') {
  issues.push({ code: 'MODE', message: backendTemplate.mode });
}
if (backendTemplate.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: backendTemplate.target });
}
if (backendTemplate.template_id !== BACKEND_TEMPLATE_ID) {
  issues.push({ code: 'TEMPLATE_ID', message: backendTemplate.template_id });
}
if (backendTemplate.template_version !== BACKEND_TEMPLATE_VERSION) {
  issues.push({ code: 'TEMPLATE_VERSION', message: backendTemplate.template_version });
}
if (backendTemplate.template_kind !== 'generic_backend_template') {
  issues.push({ code: 'TEMPLATE_KIND', message: backendTemplate.template_kind });
}
if (backendTemplate.profile_ref !== BACKEND_PROFILE_PATH) {
  issues.push({ code: 'PROFILE_REF', message: backendTemplate.profile_ref });
}
if (backendTemplate.profile_certification_ref !== BACKEND_PROFILE_CERTIFICATION_PATH) {
  issues.push({
    code: 'PROFILE_CERTIFICATION_REF',
    message: backendTemplate.profile_certification_ref,
  });
}
if (
  backendTemplate.backend_design_certification_ref !== BACKEND_DESIGN_CERTIFICATION_PATH
) {
  issues.push({
    code: 'BACKEND_DESIGN_CERTIFICATION_REF',
    message: backendTemplate.backend_design_certification_ref,
  });
}
if (backendTemplate.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH) {
  issues.push({
    code: 'IMPLEMENTATION_SPEC_REF',
    message: backendTemplate.implementation_spec_ref,
  });
}
if (backendTemplate.execution_contract_ref !== BACKEND_EXECUTION_CONTRACT_PATH) {
  issues.push({
    code: 'EXECUTION_CONTRACT_REF',
    message: backendTemplate.execution_contract_ref,
  });
}
if (backendTemplate.runtime_router_ref !== BACKEND_RUNTIME_ROUTER_PATH) {
  issues.push({ code: 'RUNTIME_ROUTER_REF', message: backendTemplate.runtime_router_ref });
}
if (backendTemplate.adapter_registration_ref !== BACKEND_ADAPTER_REGISTRATION_PATH) {
  issues.push({
    code: 'ADAPTER_REGISTRATION_REF',
    message: backendTemplate.adapter_registration_ref,
  });
}
if (backendTemplate.compatibility_engine_ref !== BACKEND_COMPATIBILITY_ENGINE_PATH) {
  issues.push({
    code: 'COMPATIBILITY_ENGINE_REF',
    message: backendTemplate.compatibility_engine_ref,
  });
}
if (backendTemplate.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: backendTemplate.capability_registry_ref,
  });
}
if (backendTemplate.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: backendTemplate.adapter_foundation_ref,
  });
}
if (backendTemplate.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: backendTemplate.runtime_interface_ref,
  });
}
if (backendTemplate.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: backendTemplate.runtime_package_ref,
  });
}
if (JSON.stringify(backendTemplate.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${backendTemplate.sources_supported.length}`,
  });
}
if (
  JSON.stringify(backendTemplate.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: backendTemplate.required_channels.join(','),
  });
}
if (backendTemplate.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: backendTemplate.spatial_frame_ref });
}
if (
  backendTemplate.capability_set_id !== CAPABILITY_SET_ID ||
  backendTemplate.capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({
    code: 'CAPABILITY_SET',
    message: `${backendTemplate.capability_set_id}@${backendTemplate.capability_set_version}`,
  });
}

// 1) Backend template schema.
const templateSchema = backendTemplate.backend_template_schema;
if (templateSchema.schema_id !== 'dsc-backend-template-schema-v1') {
  issues.push({ code: 'TEMPLATE_SCHEMA_ID', message: templateSchema.schema_id });
}
if (
  templateSchema.encoding !== 'application/json' ||
  templateSchema.template_id_policy !== 'opaque_template_id_no_vendor_binding' ||
  templateSchema.profile_ref !== BACKEND_PROFILE_ID ||
  templateSchema.optional_fields.length !== 0 ||
  templateSchema.additional_fields
) {
  issues.push({
    code: 'TEMPLATE_SCHEMA_POLICY',
    message: templateSchema.template_id_policy,
  });
}
const schemaFields = templateSchema.required_fields.map((field) => field.field);
if (JSON.stringify(schemaFields) !== JSON.stringify(EXPECTED_SCHEMA_FIELDS)) {
  issues.push({ code: 'TEMPLATE_SCHEMA_FIELDS', message: schemaFields.join(',') });
}
for (const field of templateSchema.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'TEMPLATE_SCHEMA_FIELD_INCOMPLETE', message: field.field });
  }
}

// 2) Deterministic implementation skeleton — must mirror PHASE-039 methods exactly.
const skeleton = backendTemplate.deterministic_implementation_skeleton;
if (skeleton.skeleton_id !== 'dsc-backend-deterministic-implementation-skeleton-v1') {
  issues.push({ code: 'SKELETON_ID', message: skeleton.skeleton_id });
}
if (
  skeleton.adapter_interface_ref !== 'dsc-backend-adapter-interface-v1' ||
  skeleton.implementation_spec_ref !== BACKEND_IMPLEMENTATION_SPEC_PATH ||
  skeleton.purity !== 'deterministic_pure_function_per_step' ||
  skeleton.seed_dependence !== 'none' ||
  skeleton.time_dependence !== 'none' ||
  skeleton.randomness !== 'none' ||
  skeleton.step_order !== 'fixed_declared_order' ||
  !skeleton.same_inputs_same_outcome ||
  skeleton.requires_gpu ||
  skeleton.performs_inference ||
  skeleton.implements_steps_in_this_phase
) {
  issues.push({ code: 'SKELETON_POLICY', message: skeleton.purity });
}
const stepMethodIds = skeleton.steps.map((step) => step.method_id);
if (JSON.stringify(stepMethodIds) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'SKELETON_METHODS', message: stepMethodIds.join(',') });
}
const foundationMethodIds = adapterFoundation.backend_interface.methods.map(
  (method) => method.method_id
);
if (JSON.stringify(stepMethodIds) !== JSON.stringify(foundationMethodIds)) {
  issues.push({ code: 'SKELETON_METHOD_DRIFT', message: stepMethodIds.join(',') });
}
const foundationSignatures = new Map(
  adapterFoundation.backend_interface.methods.map((method) => [
    method.method_id,
    method.signature,
  ])
);
skeleton.steps.forEach((step, index) => {
  if (step.order !== index + 1) {
    issues.push({ code: 'SKELETON_STEP_ORDER', message: step.step_id });
  }
  if (step.signature !== foundationSignatures.get(step.method_id)) {
    issues.push({ code: 'SKELETON_SIGNATURE_DRIFT', message: step.method_id });
  }
  if (
    step.side_effects !== 'none' ||
    !step.deterministic ||
    step.implemented_in_this_phase ||
    step.reads.length === 0 ||
    !step.emits ||
    !step.extension_point_ref
  ) {
    issues.push({ code: 'SKELETON_STEP_INCOMPLETE', message: step.step_id });
  }
});

// 3) Extension points — closed set, one per skeleton step.
const extensionPoints = backendTemplate.extension_points;
if (extensionPoints.extension_points_id !== 'dsc-backend-template-extension-points-v1') {
  issues.push({ code: 'EXTENSION_POINTS_ID', message: extensionPoints.extension_points_id });
}
if (
  !extensionPoints.closed_set ||
  extensionPoints.unknown_extension_policy !== 'reject_undeclared_extension_point' ||
  extensionPoints.fills_extension_points_in_this_phase
) {
  issues.push({
    code: 'EXTENSION_POINTS_POLICY',
    message: extensionPoints.unknown_extension_policy,
  });
}
const extensionPointIds = extensionPoints.points.map((point) => point.extension_point_id);
if (JSON.stringify(extensionPointIds) !== JSON.stringify(EXPECTED_EXTENSION_POINTS)) {
  issues.push({ code: 'EXTENSION_POINT_SET', message: extensionPointIds.join(',') });
}
const stepExtensionRefs = skeleton.steps.map((step) => step.extension_point_ref);
if (JSON.stringify(stepExtensionRefs) !== JSON.stringify(extensionPointIds)) {
  issues.push({ code: 'EXTENSION_POINT_COVERAGE', message: stepExtensionRefs.join(',') });
}
const pointTargets = extensionPoints.points.map((point) => point.target_method_id);
if (JSON.stringify(pointTargets) !== JSON.stringify(EXPECTED_METHODS)) {
  issues.push({ code: 'EXTENSION_POINT_TARGETS', message: pointTargets.join(',') });
}
for (const point of extensionPoints.points) {
  if (
    !point.must_remain_deterministic ||
    point.may_require_gpu ||
    point.may_perform_inference ||
    point.may_modify_certified_artifacts ||
    point.filled_in_this_phase ||
    !point.contract ||
    !point.category
  ) {
    issues.push({ code: 'EXTENSION_POINT_INCOMPLETE', message: point.extension_point_id });
  }
}

// 4) Validation template.
const validationTemplate = backendTemplate.validation_template;
if (
  validationTemplate.validation_template_id !==
  'dsc-backend-template-validation-template-v1'
) {
  issues.push({
    code: 'VALIDATION_TEMPLATE_ID',
    message: validationTemplate.validation_template_id,
  });
}
if (
  validationTemplate.evaluation !== 'collect_all_failures' ||
  validationTemplate.accept_condition !== 'zero failed checks' ||
  JSON.stringify(validationTemplate.outcome_values) !==
    JSON.stringify(['conforms', 'non_conforming']) ||
  validationTemplate.profile_validation_ref !== 'dsc-backend-profile-validation-v1' ||
  !validationTemplate.requires_all_steps_declared ||
  !validationTemplate.requires_all_extension_points_declared ||
  validationTemplate.validates_implementations_in_this_phase
) {
  issues.push({
    code: 'VALIDATION_TEMPLATE_POLICY',
    message: validationTemplate.accept_condition,
  });
}
if (validationTemplate.checks.length < 13) {
  issues.push({
    code: 'VALIDATION_TEMPLATE_CHECKS',
    message: `${validationTemplate.checks.length}`,
  });
}
const seenCheckIds = new Set<string>();
const seenFailCodes = new Set<string>();
for (const check of validationTemplate.checks) {
  if (seenCheckIds.has(check.check_id)) {
    issues.push({ code: 'VALIDATION_CHECK_DUPLICATE', message: check.check_id });
  }
  seenCheckIds.add(check.check_id);
  if (seenFailCodes.has(check.fail_code)) {
    issues.push({ code: 'VALIDATION_CODE_DUPLICATE', message: check.fail_code });
  }
  seenFailCodes.add(check.fail_code);
  if (
    !check.mandatory ||
    check.evaluation !== 'design_time_declaration_only' ||
    check.status_in_this_phase !== 'not_evaluated' ||
    !check.target ||
    !check.pass_condition ||
    !/^DSC_BACKEND_TEMPLATE_FAIL_[A-Z0-9_]+$/.test(check.fail_code)
  ) {
    issues.push({ code: 'VALIDATION_CHECK_INCOMPLETE', message: check.check_id });
  }
}
for (const requiredCheck of EXPECTED_VALIDATION_CHECKS) {
  if (!seenCheckIds.has(requiredCheck)) {
    issues.push({ code: 'VALIDATION_MISSING', message: requiredCheck });
  }
}

// Read-only: no backend templated in this phase.
const templated = backendTemplate.templated_backends;
if (
  templated.count !== 0 ||
  templated.entries.length !== 0 ||
  templated.templates_backends_in_this_phase ||
  !templated.templating_policy
) {
  issues.push({ code: 'TEMPLATED_BACKENDS', message: `${templated.count}` });
}

// Design constraints.
const constraints = backendTemplate.design_constraints;
if (
  !constraints.template_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_certified_profile ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.templates_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [BACKEND_TEMPLATE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(backendTemplate);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_template_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_TEMPLATE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: backendTemplate.mode,
  template_id: backendTemplate.template_id,
  template_version: backendTemplate.template_version,
  template_kind: backendTemplate.template_kind,
  backend_template_schema: templateSchema.schema_id,
  template_schema_fields: schemaFields.length,
  deterministic_implementation_skeleton: skeleton.skeleton_id,
  skeleton_steps: skeleton.steps.length,
  skeleton_methods: stepMethodIds,
  extension_points: extensionPoints.extension_points_id,
  extension_point_ids: extensionPointIds,
  validation_template: validationTemplate.validation_template_id,
  validation_template_checks: validationTemplate.checks.length,
  templated_backends: templated.count,
  sources_supported: backendTemplate.sources_supported.length,
  reuses_certified_profile: true,
  backend_agnostic: true,
  design_constraints: backendTemplate.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    backend_template: BACKEND_TEMPLATE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    profile: BACKEND_PROFILE_PATH,
    profile_certification: BACKEND_PROFILE_CERTIFICATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_TEMPLATE_VALIDATION_REPORT.json';
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
    `template_id=${report.template_id}`,
    `schema_fields=${report.template_schema_fields}`,
    `steps=${report.skeleton_steps}`,
    `extension_points=${report.extension_point_ids.length}`,
    `validation_checks=${report.validation_template_checks}`,
    `templated_backends=${report.templated_backends}`,
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
