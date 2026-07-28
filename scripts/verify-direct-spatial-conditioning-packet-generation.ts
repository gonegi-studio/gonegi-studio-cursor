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
import {
  ASSEMBLY_PATH,
  type DirectSpatialConditioningPacketAssembly,
} from '../services/directSpatialConditioningPacketAssemblyBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  DSC_PACKET_GENERATION_PHASE,
  GENERATION_PATH,
  buildDirectSpatialConditioningPacketGeneration,
  type DirectSpatialConditioningPacketGeneration,
} from '../services/directSpatialConditioningPacketGenerationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-generation.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-generation-implementation-registry-v1.json';

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
  RUNTIME_PACKAGE_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const required of [ASSEMBLY_PATH, VALIDATION_PATH, PACKET_PATH, RUNTIME_PACKAGE_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing dependency ${required}`);
    process.exit(1);
  }
}

const assembly = readJson<DirectSpatialConditioningPacketAssembly>(ASSEMBLY_PATH);

let generation: DirectSpatialConditioningPacketGeneration;
try {
  generation = buildDirectSpatialConditioningPacketGeneration(projectRoot).generation;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`GENERATION SPEC FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (generation.phase !== DSC_PACKET_GENERATION_PHASE) {
  issues.push({ code: 'PHASE', message: generation.phase });
}
if (generation.mode !== 'design_only_generation') {
  issues.push({ code: 'MODE', message: generation.mode });
}
if (generation.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: generation.target });
}

// Mandatory reuse of assembly, validation, and certified runtime package.
if (generation.assembly_ref !== ASSEMBLY_PATH) {
  issues.push({ code: 'ASSEMBLY_REF', message: generation.assembly_ref });
}
if (generation.validation_ref !== VALIDATION_PATH) {
  issues.push({ code: 'VALIDATION_REF', message: generation.validation_ref });
}
if (generation.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({ code: 'RUNTIME_REF', message: generation.runtime_package_ref });
}
if (generation.packet_ref !== PACKET_PATH) {
  issues.push({ code: 'PACKET_REF', message: generation.packet_ref });
}

const procedure = generation.generation_procedure;
if (procedure.generation_policy !== 'assemble_then_validate') {
  issues.push({ code: 'GENERATION_POLICY', message: procedure.generation_policy });
}
if (procedure.instance_materialization_in_this_phase) {
  issues.push({ code: 'INSTANCE_MATERIALIZED', message: 'design-only violated' });
}
if (
  procedure.reuse_policy.assembly !== 'mandatory_exact_reuse' ||
  procedure.reuse_policy.validation !== 'mandatory_exact_reuse' ||
  procedure.reuse_policy.runtime_package !== 'mandatory_certified_read_only'
) {
  issues.push({ code: 'REUSE_POLICY', message: JSON.stringify(procedure.reuse_policy) });
}

const expectedSteps = [
  'bind_generation_inputs',
  'execute_assembly_order',
  'apply_packet_validation',
  'produce_validated_packet',
];
if (
  JSON.stringify(procedure.ordered_stages.map((s) => s.step_id)) !==
  JSON.stringify(expectedSteps)
) {
  issues.push({
    code: 'GENERATION_STEPS',
    message: procedure.ordered_stages.map((s) => s.step_id).join(','),
  });
}
procedure.ordered_stages.forEach((step, index) => {
  if (step.step_index !== index) {
    issues.push({ code: 'STEP_ORDER', message: step.step_id });
  }
  if (!step.description || step.reads.length === 0 || !step.produces) {
    issues.push({ code: 'STEP_INCOMPLETE', message: step.step_id });
  }
});

// Generated packet instance shape must match assembly surface.
const generated = generation.generated_packet_instance;
if (
  generated.packet_type !== 'direct_spatial_conditioning_packet' ||
  generated.packet_version !== 'v1' ||
  generated.encoding !== 'application/json' ||
  generated.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'GENERATED_PACKET_SHAPE', message: JSON.stringify(generated) });
}
if (
  JSON.stringify(generated.channel_order) !== JSON.stringify(CONDITIONING_CHANNEL_IDS)
) {
  issues.push({ code: 'CHANNEL_ORDER', message: generated.channel_order.join(',') });
}
if (
  JSON.stringify(generated.metadata_fields) !==
  JSON.stringify(assembly.metadata_assembly.map((entry) => entry.field))
) {
  issues.push({ code: 'METADATA_FIELDS_DRIFT', message: generated.metadata_fields.join(',') });
}

for (const channel of assembly.channel_assemblies) {
  const names = generated.component_fields_by_channel[channel.channel_id];
  const expected = channel.component_source_mappings.map((m) => m.packet_component);
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    issues.push({ code: 'COMPONENT_FIELDS_DRIFT', message: channel.channel_id });
  }
}

// Channel generation bindings must be 1:1 with assembly channels.
if (generation.channel_generation_bindings.length !== 6) {
  issues.push({
    code: 'BINDING_COUNT',
    message: `${generation.channel_generation_bindings.length}`,
  });
}
generation.channel_generation_bindings.forEach((binding, index) => {
  const assemblyChannel = assembly.channel_assemblies[index];
  if (!assemblyChannel || binding.channel_id !== assemblyChannel.channel_id) {
    issues.push({ code: 'BINDING_ORDER', message: binding.channel_id });
  }
  if (binding.assembly_channel_ref !== binding.channel_id) {
    issues.push({ code: 'BINDING_REF', message: binding.channel_id });
  }
  if (
    binding.foundation_consumption_slot !==
    assemblyChannel.foundation_consumption_slot
  ) {
    issues.push({ code: 'BINDING_SLOT_DRIFT', message: binding.channel_id });
  }
  if (
    binding.component_count !== assemblyChannel.component_source_mappings.length ||
    JSON.stringify(binding.component_names) !==
      JSON.stringify(
        assemblyChannel.component_source_mappings.map((m) => m.packet_component)
      )
  ) {
    issues.push({ code: 'BINDING_COMPONENTS', message: binding.channel_id });
  }
});

// Validated packet output contract.
const output = generation.validated_packet_output;
if (output.artifact_kind !== 'validated_conditioning_packet') {
  issues.push({ code: 'OUTPUT_KIND', message: output.artifact_kind });
}
if (
  JSON.stringify(output.outcome_values) !== JSON.stringify(['accepted', 'rejected'])
) {
  issues.push({ code: 'OUTCOME_VALUES', message: output.outcome_values.join(',') });
}
for (const required of [
  'packet_id',
  'source_video_id',
  'spatial_frame_ref',
  'outcome',
  'rejection_codes',
  'generated_packet',
  'assembly_ref',
  'validation_ref',
  'runtime_package_ref',
]) {
  if (!output.required_fields.includes(required)) {
    issues.push({ code: 'OUTPUT_FIELD_MISSING', message: required });
  }
}
if (
  !output.embeds_generated_packet_on_accept ||
  !output.embeds_rejection_codes_on_reject ||
  output.materializes_tensors ||
  output.materializes_frames
) {
  issues.push({ code: 'OUTPUT_CONTRACT', message: JSON.stringify(output) });
}
if (output.accepted_requires.length < 3 || output.rejected_requires.length < 3) {
  issues.push({ code: 'OUTCOME_REQUIREMENTS', message: 'incomplete' });
}

if (JSON.stringify(generation.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
  issues.push({
    code: 'SOURCES_SUPPORTED',
    message: `${generation.sources_supported.length}`,
  });
}

const constraints = generation.design_constraints;
if (
  !constraints.generation_only ||
  !constraints.reuses_packet_assembly ||
  !constraints.reuses_certified_runtime_package ||
  constraints.backend !== 'none' ||
  constraints.gpu ||
  constraints.inference ||
  constraints.generates_packet_instances_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [GENERATION_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(generation);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_packet_generation_${Date.now().toString(36)}`,
  phase: DSC_PACKET_GENERATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: generation.mode,
  generation_policy: procedure.generation_policy,
  generation_step_count: procedure.ordered_stages.length,
  channel_binding_count: generation.channel_generation_bindings.length,
  sources_supported: generation.sources_supported.length,
  validated_packet_artifact_kind: output.artifact_kind,
  reuses_packet_assembly: true,
  reuses_certified_runtime_package: true,
  design_constraints: generation.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    generation: GENERATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    assembly: ASSEMBLY_PATH,
    validation: VALIDATION_PATH,
    packet: PACKET_PATH,
    runtime_package: RUNTIME_PACKAGE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_PACKET_GENERATION_VALIDATION_REPORT.json';
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
    `policy=${report.generation_policy}`,
    `steps=${report.generation_step_count}`,
    `channels=${report.channel_binding_count}`,
    `sources=${report.sources_supported}`,
    `validated_packet=${report.validated_packet_artifact_kind}`,
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
