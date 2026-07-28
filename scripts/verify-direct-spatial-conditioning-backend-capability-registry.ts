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
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_CAPABILITY_REGISTRY_PATH,
  CAPABILITY_SET_ID,
  CAPABILITY_SET_VERSION,
  DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
  buildDirectSpatialConditioningBackendCapabilityRegistry,
  type DirectSpatialConditioningBackendCapabilityRegistry,
} from '../services/directSpatialConditioningBackendCapabilityRegistryBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-capability-registry.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-capability-registry-implementation-registry-v1.json';

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

const EXPECTED_DESCRIPTOR_FIELDS = [
  'backend_id',
  'backend_version',
  'adapter_interface_version',
  'capability_set_version',
  'declared_capabilities',
  'declared_channels',
  'declared_spatial_frame',
  'declared_adapted_input_shape',
];

const EXPECTED_STRUCTURAL_ROWS = [
  'structural_spatial_frame',
  'structural_channel_coverage',
  'structural_adapted_input_shape',
  'structural_adapter_interface_version',
];

// Upstream artifacts this read-only phase must never modify.
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
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, BACKEND_ADAPTER_FOUNDATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing adapter foundation ${BACKEND_ADAPTER_FOUNDATION_PATH}`);
  process.exit(1);
}

const adapterFoundation = readJson<DirectSpatialConditioningBackendAdapterFoundation>(
  BACKEND_ADAPTER_FOUNDATION_PATH
);
const contract = adapterFoundation.capability_contract;
const expectedCapabilityIds = contract.required_capabilities.map(
  (capability) => capability.capability_id
);

let capabilityRegistry: DirectSpatialConditioningBackendCapabilityRegistry;
try {
  capabilityRegistry =
    buildDirectSpatialConditioningBackendCapabilityRegistry(projectRoot).capabilityRegistry;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`CAPABILITY REGISTRY FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity and upstream references.
if (capabilityRegistry.phase !== DSC_BACKEND_CAPABILITY_REGISTRY_PHASE) {
  issues.push({ code: 'PHASE', message: capabilityRegistry.phase });
}
if (capabilityRegistry.mode !== 'design_only_registry') {
  issues.push({ code: 'MODE', message: capabilityRegistry.mode });
}
if (capabilityRegistry.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: capabilityRegistry.target });
}
if (capabilityRegistry.adapter_foundation_ref !== BACKEND_ADAPTER_FOUNDATION_PATH) {
  issues.push({
    code: 'ADAPTER_FOUNDATION_REF',
    message: capabilityRegistry.adapter_foundation_ref,
  });
}
if (capabilityRegistry.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({
    code: 'RUNTIME_INTERFACE_REF',
    message: capabilityRegistry.runtime_interface_ref,
  });
}
if (capabilityRegistry.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({
    code: 'RUNTIME_PACKAGE_REF',
    message: capabilityRegistry.runtime_package_ref,
  });
}
if (
  JSON.stringify(capabilityRegistry.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${capabilityRegistry.sources_supported.length}`,
  });
}
if (
  JSON.stringify(capabilityRegistry.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'REQUIRED_CHANNELS',
    message: capabilityRegistry.required_channels.join(','),
  });
}

// 1) Backend descriptor.
const descriptor = capabilityRegistry.backend_descriptor;
if (descriptor.descriptor_id !== 'dsc-backend-descriptor-v1') {
  issues.push({ code: 'DESCRIPTOR_ID', message: descriptor.descriptor_id });
}
if (
  descriptor.produced_by_method !== 'describe_capabilities' ||
  descriptor.adapter_interface_ref !== 'dsc-backend-adapter-interface-v1'
) {
  issues.push({ code: 'DESCRIPTOR_BINDING', message: descriptor.produced_by_method });
}
const descriptorFields = descriptor.required_fields.map((field) => field.field);
if (JSON.stringify(descriptorFields) !== JSON.stringify(EXPECTED_DESCRIPTOR_FIELDS)) {
  issues.push({ code: 'DESCRIPTOR_FIELDS', message: descriptorFields.join(',') });
}
for (const field of descriptor.required_fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'DESCRIPTOR_FIELD_INCOMPLETE', message: field.field });
  }
}
if (
  descriptor.optional_fields.length !== 0 ||
  descriptor.additional_fields ||
  descriptor.identity_policy !== 'opaque_backend_id_no_vendor_binding'
) {
  issues.push({ code: 'DESCRIPTOR_POLICY', message: descriptor.identity_policy });
}

// 2) Capability schema — registered ids must mirror the PHASE-039 contract exactly.
const capabilitySchema = capabilityRegistry.capability_schema;
if (capabilitySchema.schema_id !== 'dsc-backend-capability-declaration-v1') {
  issues.push({ code: 'CAPABILITY_SCHEMA_ID', message: capabilitySchema.schema_id });
}
if (capabilitySchema.capability_contract_ref !== contract.contract_id) {
  issues.push({
    code: 'CAPABILITY_CONTRACT_REF',
    message: capabilitySchema.capability_contract_ref,
  });
}
if (
  JSON.stringify(capabilitySchema.registered_capability_ids) !==
  JSON.stringify(expectedCapabilityIds)
) {
  issues.push({
    code: 'REGISTERED_CAPABILITY_DRIFT',
    message: capabilitySchema.registered_capability_ids.join(','),
  });
}
if (
  JSON.stringify(capabilitySchema.declaration_values) !==
  JSON.stringify(['supported', 'unsupported'])
) {
  issues.push({
    code: 'DECLARATION_VALUES',
    message: capabilitySchema.declaration_values.join(','),
  });
}
if (
  capabilitySchema.unknown_capability_policy !== 'reject_unregistered_capability_id' ||
  capabilitySchema.duplicate_capability_policy !== 'reject_duplicate_capability_id' ||
  capabilitySchema.missing_capability_policy !== 'treated_as_undeclared' ||
  capabilitySchema.additional_fields
) {
  issues.push({ code: 'CAPABILITY_SCHEMA_POLICY', message: 'policy mismatch' });
}
const declarationFields = capabilitySchema.fields.map((field) => field.field);
if (
  JSON.stringify(declarationFields) !==
  JSON.stringify(['capability_id', 'declared', 'capability_version'])
) {
  issues.push({ code: 'DECLARATION_FIELDS', message: declarationFields.join(',') });
}
for (const field of capabilitySchema.fields) {
  if (!field.required || field.nullable || !field.type || !field.constraint) {
    issues.push({ code: 'DECLARATION_FIELD_INCOMPLETE', message: field.field });
  }
}

// 3) Compatibility matrix — one mandatory row per capability plus structural rows.
const matrix = capabilityRegistry.compatibility_matrix;
if (matrix.matrix_id !== 'dsc-backend-compatibility-matrix-v1') {
  issues.push({ code: 'MATRIX_ID', message: matrix.matrix_id });
}
if (matrix.evaluated_by_method !== 'check_compatibility') {
  issues.push({ code: 'MATRIX_METHOD', message: matrix.evaluated_by_method });
}
if (
  JSON.stringify(matrix.declaration_states) !==
  JSON.stringify(['supported', 'unsupported', 'undeclared'])
) {
  issues.push({ code: 'MATRIX_STATES', message: matrix.declaration_states.join(',') });
}
if (
  JSON.stringify(matrix.outcome_values) !== JSON.stringify(['compatible', 'incompatible'])
) {
  issues.push({ code: 'MATRIX_OUTCOMES', message: matrix.outcome_values.join(',') });
}
for (const state of matrix.declaration_states) {
  if (!matrix.state_semantics[state]) {
    issues.push({ code: 'MATRIX_STATE_SEMANTICS_MISSING', message: state });
  }
}

const capabilityRows = matrix.rows.filter((row) => row.row_kind === 'capability');
const structuralRows = matrix.rows.filter((row) => row.row_kind === 'structural');
if (
  JSON.stringify(capabilityRows.map((row) => row.row_id)) !==
  JSON.stringify(expectedCapabilityIds)
) {
  issues.push({
    code: 'MATRIX_CAPABILITY_ROWS',
    message: capabilityRows.map((row) => row.row_id).join(','),
  });
}
if (
  JSON.stringify(structuralRows.map((row) => row.row_id)) !==
  JSON.stringify(EXPECTED_STRUCTURAL_ROWS)
) {
  issues.push({
    code: 'MATRIX_STRUCTURAL_ROWS',
    message: structuralRows.map((row) => row.row_id).join(','),
  });
}

const seenRowIds = new Set<string>();
const seenCodes = new Set<string>();
for (const row of matrix.rows) {
  if (seenRowIds.has(row.row_id)) {
    issues.push({ code: 'MATRIX_ROW_DUPLICATE', message: row.row_id });
  }
  seenRowIds.add(row.row_id);
  if (seenCodes.has(row.incompatibility_code)) {
    issues.push({ code: 'MATRIX_CODE_DUPLICATE', message: row.incompatibility_code });
  }
  seenCodes.add(row.incompatibility_code);

  if (row.requirement !== 'mandatory' || !row.required_value || !row.source_ref) {
    issues.push({ code: 'MATRIX_ROW_INCOMPLETE', message: row.row_id });
  }
  if (
    row.outcome_by_state.supported !== 'compatible' ||
    row.outcome_by_state.unsupported !== 'incompatible' ||
    row.outcome_by_state.undeclared !== 'incompatible'
  ) {
    issues.push({ code: 'MATRIX_ROW_OUTCOME', message: row.row_id });
  }
  if (
    row.incompatibility_code !== `DSC_BACKEND_INCOMPATIBLE_${row.row_id.toUpperCase()}`
  ) {
    issues.push({ code: 'MATRIX_ROW_CODE', message: row.incompatibility_code });
  }
}

// Structural rows must carry the values frozen by the adapter foundation.
const structuralRequired = new Map(
  structuralRows.map((row) => [row.row_id, row.required_value])
);
if (structuralRequired.get('structural_spatial_frame') !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'STRUCTURAL_FRAME_DRIFT', message: 'spatial frame' });
}
if (
  structuralRequired.get('structural_channel_coverage') !==
  [...CONDITIONING_CHANNEL_IDS].join(',')
) {
  issues.push({ code: 'STRUCTURAL_CHANNEL_DRIFT', message: 'channel coverage' });
}
if (
  structuralRequired.get('structural_adapted_input_shape') !==
  contract.adapted_input_shape_ref
) {
  issues.push({ code: 'STRUCTURAL_SHAPE_DRIFT', message: 'adapted input shape' });
}
if (
  structuralRequired.get('structural_adapter_interface_version') !==
  adapterFoundation.backend_interface.version
) {
  issues.push({ code: 'STRUCTURAL_VERSION_DRIFT', message: 'interface version' });
}

if (
  matrix.aggregation_rule !== 'all_rows_must_resolve_compatible' ||
  matrix.evaluation !== 'collect_all_incompatibility_codes' ||
  matrix.evaluates_backends_in_this_phase
) {
  issues.push({ code: 'MATRIX_POLICY', message: matrix.aggregation_rule });
}
if (
  matrix.report_shape.report_id !== 'dsc-backend-compatibility-report-v1' ||
  matrix.report_shape.required_fields.length < 6
) {
  issues.push({ code: 'MATRIX_REPORT_SHAPE', message: matrix.report_shape.report_id });
}

// 3-1) Capability versioning.
const versioning = capabilityRegistry.capability_versioning;
if (versioning.versioning_id !== 'dsc-backend-capability-versioning-v1') {
  issues.push({ code: 'VERSIONING_ID', message: versioning.versioning_id });
}
if (
  versioning.scheme !== 'major_minor' ||
  versioning.capability_set_id !== CAPABILITY_SET_ID ||
  versioning.current_capability_set_version !== CAPABILITY_SET_VERSION
) {
  issues.push({ code: 'VERSIONING_IDENTITY', message: versioning.scheme });
}
if (!versioning.supported_capability_set_versions.includes(CAPABILITY_SET_VERSION)) {
  issues.push({
    code: 'VERSIONING_SUPPORTED_SET',
    message: versioning.supported_capability_set_versions.join(','),
  });
}
if (
  JSON.stringify(versioning.capability_versions.map((entry) => entry.capability_id)) !==
  JSON.stringify(expectedCapabilityIds)
) {
  issues.push({
    code: 'VERSIONING_CAPABILITY_DRIFT',
    message: versioning.capability_versions.map((entry) => entry.capability_id).join(','),
  });
}
for (const entry of versioning.capability_versions) {
  if (
    entry.status !== 'active' ||
    !entry.current_version ||
    !entry.introduced_in_capability_set_version
  ) {
    issues.push({ code: 'VERSIONING_ENTRY_INCOMPLETE', message: entry.capability_id });
  }
}
if (
  versioning.compatibility_policy.major_mismatch !== 'incompatible' ||
  versioning.compatibility_policy.minor_mismatch !==
    'compatible_if_major_matches_and_all_mandatory_rows_supported' ||
  !versioning.compatibility_policy.major_change ||
  !versioning.compatibility_policy.minor_change
) {
  issues.push({ code: 'VERSIONING_POLICY', message: 'compatibility policy' });
}
if (versioning.rules.length < 5) {
  issues.push({ code: 'VERSIONING_RULES', message: `${versioning.rules.length}` });
}
if (
  versioning.deprecation_policy.deprecated_capabilities.length !== 0 ||
  versioning.deprecation_policy.removal_requires !==
    'major_capability_set_version_increment' ||
  versioning.deprecation_policy.notice_window !== 'one_minor_version'
) {
  issues.push({ code: 'VERSIONING_DEPRECATION', message: 'deprecation policy' });
}

// Read-only: no backend registered or evaluated in this phase.
const registered = capabilityRegistry.registered_backends;
if (
  registered.count !== 0 ||
  registered.entries.length !== 0 ||
  registered.registers_backends_in_this_phase ||
  !registered.registration_policy
) {
  issues.push({ code: 'REGISTERED_BACKENDS', message: `${registered.count}` });
}

// Design constraints.
const constraints = capabilityRegistry.design_constraints;
if (
  !constraints.registry_only ||
  !constraints.read_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_adapter_foundation ||
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

// Required artifacts present.
for (const requiredArtifact of [
  BACKEND_CAPABILITY_REGISTRY_PATH,
  SCHEMA_PATH,
  REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

// Placeholder scan.
const serialized = JSON.stringify(capabilityRegistry);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_capability_registry_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_CAPABILITY_REGISTRY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: capabilityRegistry.mode,
  backend_descriptor: descriptor.descriptor_id,
  descriptor_fields: descriptorFields.length,
  capability_schema: capabilitySchema.schema_id,
  registered_capabilities: capabilitySchema.registered_capability_ids.length,
  compatibility_matrix: matrix.matrix_id,
  matrix_rows: matrix.rows.length,
  matrix_capability_rows: capabilityRows.length,
  matrix_structural_rows: structuralRows.length,
  capability_versioning: versioning.versioning_id,
  capability_set_version: versioning.current_capability_set_version,
  registered_backends: registered.count,
  sources_supported: capabilityRegistry.sources_supported.length,
  reuses_adapter_foundation: true,
  backend_agnostic: true,
  design_constraints: capabilityRegistry.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    capability_registry: BACKEND_CAPABILITY_REGISTRY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    adapter_foundation: BACKEND_ADAPTER_FOUNDATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_CAPABILITY_REGISTRY_VALIDATION_REPORT.json';
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
    `descriptor_fields=${report.descriptor_fields}`,
    `capabilities=${report.registered_capabilities}`,
    `matrix_rows=${report.matrix_rows}`,
    `capability_set=${report.capability_set_version}`,
    `registered_backends=${report.registered_backends}`,
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
