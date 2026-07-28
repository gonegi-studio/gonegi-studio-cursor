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
import {
  GENERATION_PATH,
  type DirectSpatialConditioningPacketGeneration,
} from '../services/directSpatialConditioningPacketGenerationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_RUNTIME_INTERFACE_PHASE,
  RUNTIME_INTERFACE_PATH,
  buildDirectSpatialConditioningRuntimeInterface,
  type DirectSpatialConditioningRuntimeInterface,
} from '../services/directSpatialConditioningRuntimeInterfaceBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-runtime-interface.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-runtime-interface-implementation-registry-v1.json';

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

const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  ASSEMBLY_PATH,
  GENERATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, GENERATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing generation ${GENERATION_PATH}`);
  process.exit(1);
}

const generation = readJson<DirectSpatialConditioningPacketGeneration>(GENERATION_PATH);

let runtimeInterface: DirectSpatialConditioningRuntimeInterface;
try {
  runtimeInterface =
    buildDirectSpatialConditioningRuntimeInterface(projectRoot).runtimeInterface;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`RUNTIME INTERFACE FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (runtimeInterface.phase !== DSC_RUNTIME_INTERFACE_PHASE) {
  issues.push({ code: 'PHASE', message: runtimeInterface.phase });
}
if (runtimeInterface.mode !== 'design_only_interface') {
  issues.push({ code: 'MODE', message: runtimeInterface.mode });
}
if (runtimeInterface.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: runtimeInterface.target });
}
if (runtimeInterface.generation_ref !== GENERATION_PATH) {
  issues.push({ code: 'GENERATION_REF', message: runtimeInterface.generation_ref });
}
if (runtimeInterface.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({ code: 'RUNTIME_REF', message: runtimeInterface.runtime_package_ref });
}
if (
  JSON.stringify(runtimeInterface.sources_supported) !==
  JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${runtimeInterface.sources_supported.length}`,
  });
}

const api = runtimeInterface.runtime_api;
if (
  api.api_id !== 'dsc-runtime-api-v1' ||
  api.version !== 'v1' ||
  api.transport !== 'in_process_function_surface'
) {
  issues.push({ code: 'API_IDENTITY', message: JSON.stringify(api) });
}

const expectedMethods = [
  'list_sources',
  'generate_packet',
  'validate_packet',
  'produce_validated_packet',
];
if (
  JSON.stringify(api.methods.map((method) => method.method_id)) !==
  JSON.stringify(expectedMethods)
) {
  issues.push({
    code: 'API_METHODS',
    message: api.methods.map((method) => method.method_id).join(','),
  });
}
for (const method of api.methods) {
  if (
    method.side_effects !== 'none' ||
    method.requires_backend ||
    method.requires_gpu ||
    method.performs_inference
  ) {
    issues.push({ code: 'METHOD_RUNTIME_FLAG', message: method.method_id });
  }
  if (!method.signature || !method.description || !method.input_ref || !method.output_ref) {
    issues.push({ code: 'METHOD_INCOMPLETE', message: method.method_id });
  }
}

const packetInput = runtimeInterface.packet_input;
if (packetInput.surface_id !== 'dsc_runtime_packet_input_v1') {
  issues.push({ code: 'PACKET_INPUT_SURFACE', message: packetInput.surface_id });
}
const inputFields = packetInput.required_fields.map((field) => field.field);
if (
  JSON.stringify(inputFields) !== JSON.stringify(['source_video_id', 'packet_id'])
) {
  issues.push({ code: 'PACKET_INPUT_FIELDS', message: inputFields.join(',') });
}
for (const field of packetInput.required_fields) {
  if (!field.required || field.nullable || !field.constraint) {
    issues.push({ code: 'PACKET_INPUT_FIELD_INCOMPLETE', message: field.field });
  }
}
if (packetInput.optional_fields.length !== 0) {
  issues.push({ code: 'PACKET_INPUT_OPTIONAL', message: 'must be empty' });
}
if (
  packetInput.accepted_packet_shape.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  JSON.stringify(packetInput.accepted_packet_shape.channel_order) !==
    JSON.stringify(CONDITIONING_CHANNEL_IDS)
) {
  issues.push({ code: 'PACKET_INPUT_SHAPE', message: 'shape mismatch' });
}
if (
  packetInput.generation_input_alignment.generation_ref !== GENERATION_PATH ||
  packetInput.generation_input_alignment.maps_to_generation_step !==
    'bind_generation_inputs'
) {
  issues.push({ code: 'PACKET_INPUT_ALIGNMENT', message: 'generation alignment' });
}

const validatedOutput = runtimeInterface.validated_output;
if (validatedOutput.surface_id !== 'dsc_runtime_validated_output_v1') {
  issues.push({ code: 'VALIDATED_OUTPUT_SURFACE', message: validatedOutput.surface_id });
}
if (
  validatedOutput.artifact_kind !==
  generation.validated_packet_output.artifact_kind
) {
  issues.push({ code: 'OUTPUT_KIND_DRIFT', message: validatedOutput.artifact_kind });
}
if (
  JSON.stringify(validatedOutput.required_fields) !==
  JSON.stringify(generation.validated_packet_output.required_fields)
) {
  issues.push({ code: 'OUTPUT_FIELDS_DRIFT', message: 'required_fields' });
}
if (
  JSON.stringify(validatedOutput.outcome_values) !==
  JSON.stringify(['accepted', 'rejected'])
) {
  issues.push({
    code: 'OUTPUT_OUTCOMES',
    message: validatedOutput.outcome_values.join(','),
  });
}
if (
  !validatedOutput.accepted_packet_embedded ||
  !validatedOutput.rejection_codes_embedded ||
  validatedOutput.materializes_tensors ||
  validatedOutput.materializes_frames
) {
  issues.push({ code: 'OUTPUT_CONTRACT', message: JSON.stringify(validatedOutput) });
}
if (
  validatedOutput.generation_output_alignment.generation_ref !== GENERATION_PATH ||
  validatedOutput.generation_output_alignment.maps_to_generation_step !==
    'produce_validated_packet'
) {
  issues.push({ code: 'OUTPUT_ALIGNMENT', message: 'generation alignment' });
}

const contract = runtimeInterface.interface_contract;
if (contract.contract_id !== 'dsc-runtime-interface-contract-v1') {
  issues.push({ code: 'CONTRACT_ID', message: contract.contract_id });
}
if (
  JSON.stringify(contract.mandatory_methods) !== JSON.stringify(expectedMethods)
) {
  issues.push({
    code: 'CONTRACT_METHODS',
    message: contract.mandatory_methods.join(','),
  });
}
if (
  contract.packet_input_surface_ref !== packetInput.surface_id ||
  contract.validated_output_surface_ref !== validatedOutput.surface_id ||
  contract.generation_ref !== GENERATION_PATH ||
  contract.runtime_package_ref !== RUNTIME_PACKAGE_PATH
) {
  issues.push({ code: 'CONTRACT_REFS', message: 'surface/ref mismatch' });
}
if (contract.guarantees.length < 5 || contract.forbidden.length < 5) {
  issues.push({ code: 'CONTRACT_INCOMPLETE', message: 'guarantees/forbidden' });
}

const constraints = runtimeInterface.design_constraints;
if (
  !constraints.interface_only ||
  !constraints.reuses_packet_generation ||
  constraints.backend !== 'none' ||
  constraints.gpu ||
  constraints.inference ||
  constraints.implements_runtime_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [RUNTIME_INTERFACE_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(runtimeInterface);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_runtime_interface_${Date.now().toString(36)}`,
  phase: DSC_RUNTIME_INTERFACE_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: runtimeInterface.mode,
  api_methods: api.methods.map((method) => method.method_id),
  packet_input_surface: packetInput.surface_id,
  validated_output_surface: validatedOutput.surface_id,
  interface_contract: contract.contract_id,
  sources_supported: runtimeInterface.sources_supported.length,
  reuses_packet_generation: true,
  design_constraints: runtimeInterface.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    runtime_interface: RUNTIME_INTERFACE_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    generation: GENERATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_RUNTIME_INTERFACE_VALIDATION_REPORT.json';
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
    `methods=${report.api_methods.join(',')}`,
    `packet_input=${report.packet_input_surface}`,
    `validated_output=${report.validated_output_surface}`,
    `sources=${report.sources_supported}`,
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
