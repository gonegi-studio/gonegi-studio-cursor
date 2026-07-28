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
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from '../services/directSpatialConditioningBackendCapabilityRegistryBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
  buildDirectSpatialConditioningBackendCompatibilityEngine,
  type DirectSpatialConditioningBackendCompatibilityEngine,
} from '../services/directSpatialConditioningBackendCompatibilityEngineBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-compatibility-engine.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-compatibility-engine-implementation-registry-v1.json';

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
  'bind_inputs',
  'lookup_registry',
  'validate_descriptor',
  'resolve_version',
  'resolve_rows',
  'aggregate_outcome',
  'emit_report',
];

const EXPECTED_LOOKUP_SURFACES = [
  'backend_descriptor',
  'capability_schema',
  'compatibility_matrix',
  'capability_versioning',
];

const EXPECTED_ALGORITHM_STEPS = [
  'assert_descriptor_fields_present',
  'index_declared_capabilities',
  'resolve_capability_set_version',
  'resolve_capability_rows',
  'resolve_structural_rows',
  'collect_and_aggregate',
  'project_report',
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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_CAPABILITY_REGISTRY_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(
    `PRECHECK FAILED: missing capability registry ${BACKEND_CAPABILITY_REGISTRY_PATH}`
  );
  process.exit(1);
}

const capabilityRegistry = readJson<DirectSpatialConditioningBackendCapabilityRegistry>(
  BACKEND_CAPABILITY_REGISTRY_PATH
);
const matrix = capabilityRegistry.compatibility_matrix;
const registryReportFields = matrix.report_shape.required_fields;

let compatibilityEngine: DirectSpatialConditioningBackendCompatibilityEngine;
try {
  compatibilityEngine =
    buildDirectSpatialConditioningBackendCompatibilityEngine(projectRoot)
      .compatibilityEngine;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`COMPATIBILITY ENGINE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (compatibilityEngine.phase !== DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE) {
  issues.push({ code: 'PHASE', message: compatibilityEngine.phase });
}
if (compatibilityEngine.mode !== 'design_only_engine') {
  issues.push({ code: 'MODE', message: compatibilityEngine.mode });
}
if (compatibilityEngine.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: compatibilityEngine.target });
}
if (compatibilityEngine.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH) {
  issues.push({
    code: 'CAPABILITY_REGISTRY_REF',
    message: compatibilityEngine.capability_registry_ref,
  });
}
if (compatibilityEngine.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: compatibilityEngine.adapter_foundation_ref,
  });
}
if (compatibilityEngine.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: compatibilityEngine.runtime_interface_ref,
  });
}
if (compatibilityEngine.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: compatibilityEngine.runtime_package_ref,
  });
}
if (
  JSON.stringify(compatibilityEngine.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${compatibilityEngine.sources_supported.length}`,
  });
}
if (
  JSON.stringify(compatibilityEngine.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: compatibilityEngine.required_channels.join(','),
  });
}
if (compatibilityEngine.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'SPATIAL_FRAME', message: compatibilityEngine.spatial_frame_ref });
}

// 1) Evaluation flow.
const flow = compatibilityEngine.evaluation_flow;
if (flow.flow_id !== 'dsc-backend-compatibility-evaluation-flow-v1') {
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
  flow.accept_condition !== 'zero incompatibility codes after aggregate_outcome' ||
  flow.reject_condition !== 'one or more incompatibility codes collected' ||
  JSON.stringify(flow.outcome_values) !== JSON.stringify(['compatible', 'incompatible'])
) {
  issues.push({ code: 'FLOW_OUTCOME_POLICY', message: flow.accept_condition });
}

// 2) Registry lookup.
const lookup = compatibilityEngine.registry_lookup;
if (lookup.lookup_id !== 'dsc-backend-registry-lookup-v1') {
  issues.push({ code: 'LOOKUP_ID', message: lookup.lookup_id });
}
if (
  lookup.capability_registry_ref !== BACKEND_CAPABILITY_REGISTRY_PATH ||
  lookup.access_mode !== 'read_only_exact_reuse' ||
  lookup.caches ||
  lookup.mutates_registry
) {
  issues.push({ code: 'LOOKUP_ACCESS', message: lookup.access_mode });
}
const surfaceIds = lookup.surfaces.map((surface) => surface.surface_id);
if (JSON.stringify(surfaceIds) !== JSON.stringify(EXPECTED_LOOKUP_SURFACES)) {
  issues.push({ code: 'LOOKUP_SURFACES', message: surfaceIds.join(',') });
}
for (const surface of lookup.surfaces) {
  if (
    surface.access !== 'read_only' ||
    surface.fields_read.length === 0 ||
    !surface.registry_path ||
    !surface.purpose
  ) {
    issues.push({ code: 'LOOKUP_SURFACE_INCOMPLETE', message: surface.surface_id });
  }
}
if (lookup.lookup_rules.length < 5 || lookup.fails_closed_on.length < 4) {
  issues.push({ code: 'LOOKUP_RULES_INCOMPLETE', message: 'rules/fails_closed' });
}

// 3) Deterministic algorithm.
const algorithm = compatibilityEngine.deterministic_algorithm;
if (algorithm.algorithm_id !== 'dsc-backend-compatibility-algorithm-v1') {
  issues.push({ code: 'ALGORITHM_ID', message: algorithm.algorithm_id });
}
if (
  algorithm.evaluated_by_method !== 'check_compatibility' ||
  algorithm.purity !== 'deterministic_pure_function' ||
  algorithm.seed_dependence !== 'none' ||
  algorithm.time_dependence !== 'none' ||
  algorithm.randomness !== 'none' ||
  algorithm.backend_invocation !== 'none' ||
  algorithm.evaluates_backends_in_this_phase
) {
  issues.push({ code: 'ALGORITHM_PURITY', message: algorithm.purity });
}
const stepIds = algorithm.steps.map((step) => step.step_id);
if (JSON.stringify(stepIds) !== JSON.stringify(EXPECTED_ALGORITHM_STEPS)) {
  issues.push({ code: 'ALGORITHM_STEPS', message: stepIds.join(',') });
}
for (let index = 0; index < algorithm.steps.length; index += 1) {
  const step = algorithm.steps[index];
  if (
    step.order !== index + 1 ||
    step.determinism !== 'pure_function_of_inputs_and_registry' ||
    step.executed_in_this_phase ||
    !step.description
  ) {
    issues.push({ code: 'ALGORITHM_STEP_INCOMPLETE', message: step.step_id });
  }
}

const versionResolution = algorithm.version_resolution;
if (
  versionResolution.capability_set_id !== CAPABILITY_SET_ID ||
  versionResolution.major_mismatch_outcome !== 'incompatible' ||
  versionResolution.unsupported_version_outcome !== 'incompatible' ||
  versionResolution.minor_policy !==
    'compatible_if_major_matches_and_all_mandatory_rows_supported' ||
  !versionResolution.major_mismatch_code ||
  !versionResolution.unsupported_version_code
) {
  issues.push({ code: 'VERSION_RESOLUTION', message: versionResolution.capability_set_id });
}
if (
  capabilityRegistry.capability_versioning.current_capability_set_version !==
  CAPABILITY_SET_VERSION
) {
  issues.push({ code: 'CAPABILITY_SET_VERSION_DRIFT', message: CAPABILITY_SET_VERSION });
}

const rowResolution = algorithm.row_resolution;
if (
  rowResolution.matrix_ref !== matrix.matrix_id ||
  rowResolution.aggregation_rule !== matrix.aggregation_rule ||
  rowResolution.evaluation !== matrix.evaluation
) {
  issues.push({ code: 'ROW_RESOLUTION_MATRIX_DRIFT', message: rowResolution.matrix_ref });
}
if (
  rowResolution.expected_row_count !== matrix.rows.length ||
  rowResolution.expected_capability_rows !==
    matrix.rows.filter((row) => row.row_kind === 'capability').length ||
  rowResolution.expected_structural_rows !==
    matrix.rows.filter((row) => row.row_kind === 'structural').length
) {
  issues.push({
    code: 'ROW_RESOLUTION_COUNTS',
    message: `${rowResolution.expected_row_count}`,
  });
}
if (rowResolution.rules.length !== 2) {
  issues.push({ code: 'ROW_RESOLUTION_RULES', message: `${rowResolution.rules.length}` });
}
for (const rule of rowResolution.rules) {
  if (
    !rule.declaration_source ||
    !rule.supported_condition ||
    !rule.unsupported_condition ||
    !rule.undeclared_condition ||
    rule.outcome_table_ref !== 'compatibility_matrix.rows[].outcome_by_state'
  ) {
    issues.push({ code: 'ROW_RESOLUTION_RULE_INCOMPLETE', message: rule.row_kind });
  }
}

const descriptorValidation = algorithm.descriptor_validation;
if (
  descriptorValidation.unknown_capability_policy !==
    capabilityRegistry.capability_schema.unknown_capability_policy ||
  descriptorValidation.duplicate_capability_policy !==
    capabilityRegistry.capability_schema.duplicate_capability_policy ||
  descriptorValidation.missing_capability_policy !==
    capabilityRegistry.capability_schema.missing_capability_policy
) {
  issues.push({ code: 'DESCRIPTOR_VALIDATION_POLICY_DRIFT', message: 'policy' });
}
if (algorithm.tie_breakers.length < 4) {
  issues.push({ code: 'TIE_BREAKERS', message: `${algorithm.tie_breakers.length}` });
}

// 4) Report schema — field set locked to PHASE-040 report_shape.
const reportSchema = compatibilityEngine.report_schema;
if (
  reportSchema.report_schema_id !== 'dsc-backend-compatibility-report-schema-v1' ||
  reportSchema.report_id !== 'dsc-backend-compatibility-report-v1'
) {
  issues.push({ code: 'REPORT_SCHEMA_ID', message: reportSchema.report_id });
}
const reportFields = reportSchema.required_fields.map((field) => field.field);
if (JSON.stringify(reportFields) !== JSON.stringify(registryReportFields)) {
  issues.push({ code: 'REPORT_FIELDS_DRIFT', message: reportFields.join(',') });
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
  issues.push({ code: 'REPORT_OUTCOMES', message: reportSchema.outcome_values.join(',') });
}
if (
  reportSchema.row_result_shape.fields.length !== 5 ||
  JSON.stringify(reportSchema.row_result_shape.declaration_states) !==
    JSON.stringify(['supported', 'unsupported', 'undeclared']) ||
  JSON.stringify(reportSchema.row_result_shape.outcome_values) !==
    JSON.stringify(['compatible', 'incompatible'])
) {
  issues.push({ code: 'REPORT_ROW_RESULT_SHAPE', message: 'shape mismatch' });
}
if (
  reportSchema.ordering.evaluated_rows !== 'registry_matrix_row_order' ||
  reportSchema.ordering.failed_rows !== 'registry_matrix_row_order' ||
  reportSchema.ordering.incompatibility_codes !==
    'first_failure_order_then_lexicographic' ||
  reportSchema.additional_fields ||
  reportSchema.materializes_tensors ||
  reportSchema.materializes_frames
) {
  issues.push({ code: 'REPORT_POLICY', message: 'ordering/materialization' });
}

// Design constraints.
const constraints = compatibilityEngine.design_constraints;
if (
  !constraints.engine_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_capability_registry ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.evaluates_backends_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [
  BACKEND_COMPATIBILITY_ENGINE_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(compatibilityEngine);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_compatibility_engine_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_COMPATIBILITY_ENGINE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: compatibilityEngine.mode,
  evaluation_flow: flow.flow_id,
  evaluation_stages: stageIds,
  registry_lookup: lookup.lookup_id,
  lookup_surfaces: surfaceIds,
  deterministic_algorithm: algorithm.algorithm_id,
  algorithm_steps: stepIds.length,
  report_schema: reportSchema.report_schema_id,
  report_fields: reportFields.length,
  expected_matrix_rows: rowResolution.expected_row_count,
  sources_supported: compatibilityEngine.sources_supported.length,
  reuses_capability_registry: true,
  backend_agnostic: true,
  design_constraints: compatibilityEngine.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    compatibility_engine: BACKEND_COMPATIBILITY_ENGINE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    capability_registry: BACKEND_CAPABILITY_REGISTRY_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_COMPATIBILITY_ENGINE_VALIDATION_REPORT.json';
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
    `stages=${report.evaluation_stages.length}`,
    `lookup_surfaces=${report.lookup_surfaces.length}`,
    `algorithm_steps=${report.algorithm_steps}`,
    `report_fields=${report.report_fields}`,
    `matrix_rows=${report.expected_matrix_rows}`,
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
