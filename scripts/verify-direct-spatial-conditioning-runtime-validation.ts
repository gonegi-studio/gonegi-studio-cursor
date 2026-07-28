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
  RUNTIME_INTERFACE_PATH,
  type DirectSpatialConditioningRuntimeInterface,
} from '../services/directSpatialConditioningRuntimeInterfaceBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_RUNTIME_VALIDATION_PHASE,
  RUNTIME_VALIDATION_PATH,
  buildDirectSpatialConditioningRuntimeValidation,
  type DirectSpatialConditioningRuntimeValidation,
  type RuntimeValidationCheck,
} from '../services/directSpatialConditioningRuntimeValidationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-runtime-validation.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-runtime-validation-implementation-registry-v1.json';

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
  RUNTIME_INTERFACE_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [RUNTIME_INTERFACE_PATH, GENERATION_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing dependency ${required}`);
    process.exit(1);
  }
}

const runtimeInterface = readJson<DirectSpatialConditioningRuntimeInterface>(
  RUNTIME_INTERFACE_PATH
);
const generation = readJson<DirectSpatialConditioningPacketGeneration>(GENERATION_PATH);

let validation: DirectSpatialConditioningRuntimeValidation;
try {
  validation = buildDirectSpatialConditioningRuntimeValidation(projectRoot).validation;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`RUNTIME VALIDATION SPEC FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (validation.phase !== DSC_RUNTIME_VALIDATION_PHASE) {
  issues.push({ code: 'PHASE', message: validation.phase });
}
if (validation.mode !== 'design_only_validation') {
  issues.push({ code: 'MODE', message: validation.mode });
}
if (validation.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: validation.target });
}
if (validation.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({ code: 'INTERFACE_REF', message: validation.runtime_interface_ref });
}
if (validation.generation_ref !== GENERATION_PATH) {
  issues.push({ code: 'GENERATION_REF', message: validation.generation_ref });
}

const procedure = validation.validation_procedure;
if (
  JSON.stringify(procedure.ordered_stages) !==
  JSON.stringify(['runtime_api', 'packet_flow', 'interface_contract', 'generation_reuse'])
) {
  issues.push({ code: 'STAGE_ORDER', message: procedure.ordered_stages.join(',') });
}

const allChecks: RuntimeValidationCheck[] = [
  ...validation.runtime_api_checks,
  ...validation.packet_flow_checks,
  ...validation.interface_contract_checks,
  ...validation.generation_reuse_checks,
];
const checkIds = new Set<string>();
for (const entry of allChecks) {
  if (checkIds.has(entry.check_id)) {
    issues.push({ code: 'DUPLICATE_CHECK_ID', message: entry.check_id });
  }
  checkIds.add(entry.check_id);
  if (entry.severity !== 'error' || !entry.description || !entry.predicate) {
    issues.push({ code: 'CHECK_INCOMPLETE', message: entry.check_id });
  }
}

// Evaluate the four validation stages against the live frozen artifacts.
const failedChecks: string[] = [];

function failCheck(checkId: string, detail: string): void {
  failedChecks.push(checkId);
  issues.push({ code: `CHECK_FAILED_${checkId}`, message: detail });
}

// Stage 1: runtime API
{
  const api = runtimeInterface.runtime_api;
  if (
    api.api_id !== 'dsc-runtime-api-v1' ||
    api.version !== 'v1' ||
    api.transport !== 'in_process_function_surface'
  ) {
    failCheck('API_IDENTITY', JSON.stringify(api));
  }
  if (api.methods.length !== 4) {
    failCheck('API_METHOD_COUNT', `${api.methods.length}`);
  }
  if (
    JSON.stringify(api.methods.map((m) => m.method_id)) !==
    JSON.stringify(validation.expected_api_methods)
  ) {
    failCheck(
      'API_METHOD_SET',
      api.methods.map((m) => m.method_id).join(',')
    );
  }
  for (const method of api.methods) {
    if (method.side_effects !== 'none') failCheck(`API_SIDE_EFFECTS_${method.method_id.toUpperCase()}`, method.side_effects);
    if (method.requires_backend) failCheck(`API_NO_BACKEND_${method.method_id.toUpperCase()}`, 'true');
    if (method.requires_gpu) failCheck(`API_NO_GPU_${method.method_id.toUpperCase()}`, 'true');
    if (method.performs_inference) failCheck(`API_NO_INFERENCE_${method.method_id.toUpperCase()}`, 'true');
    if (!method.signature || !method.description) {
      failCheck(`API_SIGNATURE_${method.method_id.toUpperCase()}`, 'incomplete');
    }
  }
}

// Stage 2: packet flow
{
  const input = runtimeInterface.packet_input;
  const output = runtimeInterface.validated_output;
  const methods = Object.fromEntries(
    runtimeInterface.runtime_api.methods.map((m) => [m.method_id, m])
  );

  if (input.surface_id !== 'dsc_runtime_packet_input_v1') {
    failCheck('FLOW_INPUT_SURFACE', input.surface_id);
  }
  if (
    JSON.stringify(input.required_fields.map((f) => f.field)) !==
    JSON.stringify(['source_video_id', 'packet_id'])
  ) {
    failCheck('FLOW_INPUT_FIELDS', input.required_fields.map((f) => f.field).join(','));
  }
  if (input.optional_fields.length !== 0) {
    failCheck('FLOW_INPUT_NO_OPTIONAL', `${input.optional_fields.length}`);
  }
  if (
    JSON.stringify(input.accepted_packet_shape.channel_order) !==
    JSON.stringify(CONDITIONING_CHANNEL_IDS)
  ) {
    failCheck('FLOW_INPUT_CHANNEL_ORDER', input.accepted_packet_shape.channel_order.join(','));
  }
  if (input.accepted_packet_shape.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
    failCheck('FLOW_INPUT_SPATIAL_FRAME', input.accepted_packet_shape.spatial_frame_ref);
  }
  if (
    methods.generate_packet?.input_ref !== 'dsc_runtime_packet_input_v1' ||
    methods.generate_packet?.output_ref !== 'assembled_packet_candidate'
  ) {
    failCheck('FLOW_GENERATE_TO_CANDIDATE', JSON.stringify(methods.generate_packet));
  }
  if (
    methods.validate_packet?.input_ref !== 'assembled_packet_candidate' ||
    methods.validate_packet?.output_ref !== 'validation_result'
  ) {
    failCheck('FLOW_VALIDATE_TO_RESULT', JSON.stringify(methods.validate_packet));
  }
  if (
    methods.produce_validated_packet?.input_ref !== 'dsc_runtime_packet_input_v1' ||
    methods.produce_validated_packet?.output_ref !== 'dsc_runtime_validated_output_v1'
  ) {
    failCheck('FLOW_PRODUCE_TO_VALIDATED', JSON.stringify(methods.produce_validated_packet));
  }
  if (output.surface_id !== 'dsc_runtime_validated_output_v1') {
    failCheck('FLOW_OUTPUT_SURFACE', output.surface_id);
  }
  if (output.artifact_kind !== generation.validated_packet_output.artifact_kind) {
    failCheck('FLOW_OUTPUT_KIND', output.artifact_kind);
  }
  if (JSON.stringify(output.outcome_values) !== JSON.stringify(['accepted', 'rejected'])) {
    failCheck('FLOW_OUTPUT_OUTCOMES', output.outcome_values.join(','));
  }
  if (
    !output.accepted_packet_embedded ||
    !output.rejection_codes_embedded ||
    output.materializes_tensors ||
    output.materializes_frames
  ) {
    failCheck('FLOW_OUTPUT_EMBEDDING', JSON.stringify(output));
  }
  if (input.generation_input_alignment.maps_to_generation_step !== 'bind_generation_inputs') {
    failCheck('FLOW_INPUT_GENERATION_STEP', input.generation_input_alignment.maps_to_generation_step);
  }
  if (
    output.generation_output_alignment.maps_to_generation_step !== 'produce_validated_packet'
  ) {
    failCheck(
      'FLOW_OUTPUT_GENERATION_STEP',
      output.generation_output_alignment.maps_to_generation_step
    );
  }
  if (methods.generate_packet?.generation_step_ref !== 'execute_assembly_order') {
    failCheck('FLOW_METHOD_STEP_GENERATE', `${methods.generate_packet?.generation_step_ref}`);
  }
  if (methods.validate_packet?.generation_step_ref !== 'apply_packet_validation') {
    failCheck('FLOW_METHOD_STEP_VALIDATE', `${methods.validate_packet?.generation_step_ref}`);
  }
  if (methods.produce_validated_packet?.generation_step_ref !== 'produce_validated_packet') {
    failCheck(
      'FLOW_METHOD_STEP_PRODUCE',
      `${methods.produce_validated_packet?.generation_step_ref}`
    );
  }
  if (runtimeInterface.sources_supported.length !== SOURCE_IDS.length) {
    failCheck('FLOW_SOURCES_COUNT', `${runtimeInterface.sources_supported.length}`);
  }
}

// Stage 3: interface contract
{
  const contract = runtimeInterface.interface_contract;
  if (contract.contract_id !== 'dsc-runtime-interface-contract-v1') {
    failCheck('CONTRACT_ID', contract.contract_id);
  }
  if (
    JSON.stringify(contract.mandatory_methods) !==
    JSON.stringify(validation.expected_api_methods)
  ) {
    failCheck('CONTRACT_MANDATORY_METHODS', contract.mandatory_methods.join(','));
  }
  if (contract.packet_input_surface_ref !== runtimeInterface.packet_input.surface_id) {
    failCheck('CONTRACT_PACKET_INPUT_REF', contract.packet_input_surface_ref);
  }
  if (
    contract.validated_output_surface_ref !== runtimeInterface.validated_output.surface_id
  ) {
    failCheck('CONTRACT_VALIDATED_OUTPUT_REF', contract.validated_output_surface_ref);
  }
  if (contract.generation_ref !== GENERATION_PATH) {
    failCheck('CONTRACT_GENERATION_REF', contract.generation_ref);
  }
  if (contract.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
    failCheck('CONTRACT_RUNTIME_PACKAGE_REF', contract.runtime_package_ref);
  }
  if (contract.guarantees.length < 5) {
    failCheck('CONTRACT_GUARANTEES', `${contract.guarantees.length}`);
  }
  const forbiddenText = contract.forbidden.join(' ').toLowerCase();
  for (const token of [
    'backend',
    'gpu',
    'inference',
    'tensor',
    'frame',
    'dataset',
    'placeholder',
  ]) {
    if (!forbiddenText.includes(token)) {
      failCheck('CONTRACT_FORBIDDEN', `missing ${token}`);
      break;
    }
  }
}

// Stage 4: generation reuse
{
  if (runtimeInterface.generation_ref !== GENERATION_PATH) {
    failCheck('REUSE_GENERATION_REF', runtimeInterface.generation_ref);
  }
  if (runtimeInterface.generation_phase !== 'PHASE-DSC-035') {
    failCheck('REUSE_GENERATION_PHASE', runtimeInterface.generation_phase);
  }
  if (
    runtimeInterface.generation_system_id !==
    'DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1'
  ) {
    failCheck('REUSE_GENERATION_SYSTEM', runtimeInterface.generation_system_id);
  }
  if (generation.generation_procedure.generation_policy !== 'assemble_then_validate') {
    failCheck(
      'REUSE_GENERATION_POLICY',
      generation.generation_procedure.generation_policy
    );
  }
  if (
    JSON.stringify(runtimeInterface.validated_output.required_fields) !==
    JSON.stringify(generation.validated_packet_output.required_fields)
  ) {
    failCheck('REUSE_OUTPUT_FIELDS', 'fields drift');
  }
  if (
    runtimeInterface.validated_output.artifact_kind !==
    generation.validated_packet_output.artifact_kind
  ) {
    failCheck('REUSE_OUTPUT_KIND', runtimeInterface.validated_output.artifact_kind);
  }
  const shape = runtimeInterface.packet_input.accepted_packet_shape;
  const generated = generation.generated_packet_instance;
  if (
    shape.packet_type !== generated.packet_type ||
    shape.packet_version !== generated.packet_version ||
    JSON.stringify(shape.required_sections) !== JSON.stringify(generated.required_sections)
  ) {
    failCheck('REUSE_PACKET_SHAPE', 'shape drift');
  }
  if (
    runtimeInterface.runtime_package_ref !== generation.runtime_package_ref ||
    runtimeInterface.runtime_package_ref !== RUNTIME_PACKAGE_PATH
  ) {
    failCheck('REUSE_RUNTIME_PACKAGE', runtimeInterface.runtime_package_ref);
  }
  if (
    JSON.stringify(runtimeInterface.sources_supported) !==
    JSON.stringify(generation.sources_supported)
  ) {
    failCheck('REUSE_SOURCES', 'sources drift');
  }
  if (!runtimeInterface.design_constraints.reuses_packet_generation) {
    failCheck('REUSE_CONSTRAINT_FLAG', 'false');
  }
}

const constraints = validation.design_constraints;
if (
  !constraints.validation_only ||
  !constraints.reuses_runtime_interface ||
  !constraints.reuses_packet_generation ||
  constraints.backend !== 'none' ||
  constraints.gpu ||
  constraints.inference ||
  constraints.executes_runtime_methods_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [RUNTIME_VALIDATION_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(validation);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0 && failedChecks.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_runtime_validation_${Date.now().toString(36)}`,
  phase: DSC_RUNTIME_VALIDATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: validation.mode,
  stages: procedure.ordered_stages,
  runtime_api_check_count: validation.runtime_api_checks.length,
  packet_flow_check_count: validation.packet_flow_checks.length,
  interface_contract_check_count: validation.interface_contract_checks.length,
  generation_reuse_check_count: validation.generation_reuse_checks.length,
  total_check_count: allChecks.length,
  failed_check_count: failedChecks.length,
  failed_checks: failedChecks,
  expected_api_methods: validation.expected_api_methods,
  reuses_runtime_interface: true,
  reuses_packet_generation: true,
  design_constraints: validation.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    validation: RUNTIME_VALIDATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_interface: RUNTIME_INTERFACE_PATH,
    generation: GENERATION_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_RUNTIME_VALIDATION_VALIDATION_REPORT.json';
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
    `checks=${report.total_check_count}`,
    `runtime_api=${report.runtime_api_check_count}`,
    `packet_flow=${report.packet_flow_check_count}`,
    `interface_contract=${report.interface_contract_check_count}`,
    `generation_reuse=${report.generation_reuse_check_count}`,
    `failed=${report.failed_check_count}`,
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
