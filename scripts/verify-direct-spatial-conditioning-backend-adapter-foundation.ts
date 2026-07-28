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
import {
  PACKET_PATH,
  type DirectSpatialConditioningPacket,
} from '../services/directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from '../services/directSpatialConditioningPacketValidationBuilder.js';
import { ASSEMBLY_PATH } from '../services/directSpatialConditioningPacketAssemblyBuilder.js';
import { GENERATION_PATH } from '../services/directSpatialConditioningPacketGenerationBuilder.js';
import { RUNTIME_INTERFACE_PATH } from '../services/directSpatialConditioningRuntimeInterfaceBuilder.js';
import { RUNTIME_VALIDATION_PATH } from '../services/directSpatialConditioningRuntimeValidationBuilder.js';
import { RUNTIME_PACKAGE_PATH, SOURCE_IDS } from '../services/numericalReconstructionExportBuilder.js';
import {
  BACKEND_ADAPTER_FOUNDATION_PATH,
  DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
  buildDirectSpatialConditioningBackendAdapterFoundation,
  type DirectSpatialConditioningBackendAdapterFoundation,
} from '../services/directSpatialConditioningBackendAdapterFoundationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT =
  'PASS_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1' as const;
const FAIL_VERDICT =
  'FAIL_DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-adapter-foundation.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-backend-adapter-foundation-implementation-registry-v1.json';

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

// Upstream artifacts this phase must never modify.
const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  ASSEMBLY_PATH,
  GENERATION_PATH,
  RUNTIME_INTERFACE_PATH,
  RUNTIME_VALIDATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/direct_spatial_conditioning_certification/v1/direct-spatial-conditioning-production-certification-v1.json',
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const requiredUpstream of [RUNTIME_INTERFACE_PATH, PACKET_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredUpstream))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing upstream ${requiredUpstream}`);
    process.exit(1);
  }
}

const packet = readJson<DirectSpatialConditioningPacket>(PACKET_PATH);

let adapterFoundation: DirectSpatialConditioningBackendAdapterFoundation;
try {
  adapterFoundation =
    buildDirectSpatialConditioningBackendAdapterFoundation(projectRoot).adapterFoundation;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`ADAPTER FOUNDATION FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

// Identity.
if (adapterFoundation.phase !== DSC_BACKEND_ADAPTER_FOUNDATION_PHASE) {
  issues.push({ code: 'PHASE', message: adapterFoundation.phase });
}
if (adapterFoundation.mode !== 'design_only_abstraction') {
  issues.push({ code: 'MODE', message: adapterFoundation.mode });
}
if (adapterFoundation.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: adapterFoundation.target });
}
if (adapterFoundation.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({ code: 'RUNTIME_INTERFACE_REF', message: adapterFoundation.runtime_interface_ref });
}
if (adapterFoundation.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({ code: 'RUNTIME_PACKAGE_REF', message: adapterFoundation.runtime_package_ref });
}
if (
  JSON.stringify(adapterFoundation.sources_supported) !== JSON.stringify([...SOURCE_IDS])
) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${adapterFoundation.sources_supported.length}`,
  });
}

// Backend interface — abstract, backend-agnostic, unimplemented.
const backendInterface = adapterFoundation.backend_interface;
if (
  backendInterface.interface_id !== 'dsc-backend-adapter-interface-v1' ||
  backendInterface.transport !== 'abstract_function_surface' ||
  backendInterface.consumes !== 'validated_conditioning_packet'
) {
  issues.push({ code: 'INTERFACE_IDENTITY', message: JSON.stringify(backendInterface) });
}
if (
  JSON.stringify(backendInterface.methods.map((method) => method.method_id)) !==
  JSON.stringify(EXPECTED_METHODS)
) {
  issues.push({
    code: 'INTERFACE_METHODS',
    message: backendInterface.methods.map((method) => method.method_id).join(','),
  });
}
for (const method of backendInterface.methods) {
  if (
    method.side_effects !== 'none' ||
    !method.abstract ||
    method.implemented_in_this_phase ||
    method.requires_specific_backend ||
    method.requires_gpu ||
    method.performs_inference
  ) {
    issues.push({ code: 'METHOD_ABSTRACTION_FLAG', message: method.method_id });
  }
  if (!method.signature || !method.description || !method.input_ref || !method.output_ref) {
    issues.push({ code: 'METHOD_INCOMPLETE', message: method.method_id });
  }
}

// Packet adapter — reuses the PHASE-036 validated output surface, identity passthrough only.
const adapter = adapterFoundation.packet_adapter;
if (adapter.adapter_id !== 'dsc-packet-adapter-v1') {
  issues.push({ code: 'ADAPTER_ID', message: adapter.adapter_id });
}
if (adapter.input_surface_ref !== 'dsc_runtime_validated_output_v1') {
  issues.push({ code: 'ADAPTER_INPUT_SURFACE', message: adapter.input_surface_ref });
}
if (adapter.input_artifact_kind !== 'validated_conditioning_packet') {
  issues.push({ code: 'ADAPTER_INPUT_KIND', message: adapter.input_artifact_kind });
}
if (adapter.runtime_interface_ref !== RUNTIME_INTERFACE_PATH) {
  issues.push({ code: 'ADAPTER_INTERFACE_REF', message: adapter.runtime_interface_ref });
}
if (
  adapter.output_shape.shape_id !== 'dsc_adapted_conditioning_input_v1' ||
  adapter.output_shape.encoding !== 'backend_agnostic_structured' ||
  adapter.output_shape.spatial_frame_ref !== SPATIAL_FRAME.frame_id ||
  JSON.stringify(adapter.output_shape.channel_order) !==
    JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'ADAPTER_OUTPUT_SHAPE', message: 'shape mismatch' });
}
if (
  adapter.passthrough_policy !== 'structure_preserving_no_transform' ||
  adapter.accepts_outcome !== 'accepted' ||
  adapter.materializes_tensors ||
  adapter.materializes_frames
) {
  issues.push({ code: 'ADAPTER_POLICY', message: JSON.stringify(adapter.passthrough_policy) });
}

// Channel mappings — one per channel, components reused verbatim from the frozen packet.
if (
  JSON.stringify(adapter.channel_mappings.map((mapping) => mapping.channel_id)) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({
    code: 'ADAPTER_CHANNEL_ORDER',
    message: adapter.channel_mappings.map((mapping) => mapping.channel_id).join(','),
  });
}
for (const mapping of adapter.channel_mappings) {
  const payload = packet.channel_payloads.find((p) => p.channel_id === mapping.channel_id);
  if (!payload) {
    issues.push({ code: 'ADAPTER_CHANNEL_UNKNOWN', message: mapping.channel_id });
    continue;
  }
  const expectedComponents = payload.component_fields.map((component) => component.name);
  if (JSON.stringify(mapping.component_names) !== JSON.stringify(expectedComponents)) {
    issues.push({ code: 'ADAPTER_COMPONENT_DRIFT', message: mapping.channel_id });
  }
  if (
    mapping.source_channel_ref !== mapping.channel_id ||
    mapping.value_space_ref !== SPATIAL_FRAME.frame_id ||
    mapping.transform !== 'identity_passthrough' ||
    !mapping.lossless
  ) {
    issues.push({ code: 'ADAPTER_MAPPING_FLAG', message: mapping.channel_id });
  }
}

// Capability contract — backend-agnostic declarations only.
const capability = adapterFoundation.capability_contract;
if (capability.contract_id !== 'dsc-backend-capability-contract-v1') {
  issues.push({ code: 'CAPABILITY_ID', message: capability.contract_id });
}
if (!capability.backend_agnostic) {
  issues.push({ code: 'CAPABILITY_NOT_AGNOSTIC', message: 'backend_agnostic=false' });
}
if (capability.spatial_frame_ref !== SPATIAL_FRAME.frame_id) {
  issues.push({ code: 'CAPABILITY_FRAME', message: capability.spatial_frame_ref });
}
if (
  JSON.stringify(capability.required_channels) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'CAPABILITY_CHANNELS', message: capability.required_channels.join(',') });
}
if (capability.required_sources !== SOURCE_IDS.length) {
  issues.push({ code: 'CAPABILITY_SOURCES', message: `${capability.required_sources}` });
}
if (capability.adapted_input_shape_ref !== 'dsc_adapted_conditioning_input_v1') {
  issues.push({ code: 'CAPABILITY_SHAPE_REF', message: capability.adapted_input_shape_ref });
}
if (capability.required_capabilities.length < 6) {
  issues.push({
    code: 'CAPABILITY_REQUIREMENTS_INCOMPLETE',
    message: `${capability.required_capabilities.length}`,
  });
}
for (const requirement of capability.required_capabilities) {
  if (
    requirement.requirement !== 'mandatory' ||
    !requirement.declared_by_backend ||
    requirement.evaluated_at !== 'check_compatibility' ||
    !requirement.capability_id ||
    !requirement.description
  ) {
    issues.push({ code: 'CAPABILITY_REQUIREMENT_INVALID', message: requirement.capability_id });
  }
}
if (
  capability.compatibility_rules.length < 5 ||
  capability.guarantees.length < 5 ||
  capability.forbidden.length < 5
) {
  issues.push({ code: 'CAPABILITY_TEXT_INCOMPLETE', message: 'rules/guarantees/forbidden' });
}

// Design constraints — abstraction only, backend agnostic, no implementation.
const constraints = adapterFoundation.design_constraints;
if (
  !constraints.abstraction_only ||
  !constraints.backend_agnostic ||
  !constraints.reuses_runtime_interface ||
  constraints.backend !== 'none' ||
  !constraints.no_backend_implementation ||
  constraints.gpu ||
  constraints.inference ||
  constraints.materializes_tensors ||
  constraints.materializes_frames ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

// Required artifacts present.
for (const requiredArtifact of [BACKEND_ADAPTER_FOUNDATION_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

// Placeholder scan.
const serialized = JSON.stringify(adapterFoundation);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_backend_adapter_foundation_${Date.now().toString(36)}`,
  phase: DSC_BACKEND_ADAPTER_FOUNDATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: adapterFoundation.mode,
  backend_interface_methods: backendInterface.methods.map((method) => method.method_id),
  packet_adapter: adapter.adapter_id,
  adapted_input_shape: adapter.output_shape.shape_id,
  capability_contract: capability.contract_id,
  required_capabilities: capability.required_capabilities.length,
  channel_mappings: adapter.channel_mappings.length,
  sources_supported: adapterFoundation.sources_supported.length,
  reuses_runtime_interface: true,
  backend_agnostic: true,
  design_constraints: adapterFoundation.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    adapter_foundation: BACKEND_ADAPTER_FOUNDATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    runtime_interface: RUNTIME_INTERFACE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_BACKEND_ADAPTER_FOUNDATION_VALIDATION_REPORT.json';
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
    `methods=${report.backend_interface_methods.join(',')}`,
    `adapter=${report.packet_adapter}`,
    `capabilities=${report.required_capabilities}`,
    `channels=${report.channel_mappings}`,
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

process.exit(0);
