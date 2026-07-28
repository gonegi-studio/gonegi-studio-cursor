import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import { CONTRACT_PATH } from '../services/directSpatialConditioningContractBuilder.js';
import {
  PACKET_PATH,
  type DirectSpatialConditioningPacket,
} from '../services/directSpatialConditioningPacketBuilder.js';
import { VALIDATION_PATH } from '../services/directSpatialConditioningPacketValidationBuilder.js';
import {
  RUNTIME_PACKAGE_PATH,
  SOURCE_IDS,
  type NumericalReconstructionRuntimePackage,
} from '../services/numericalReconstructionExportBuilder.js';
import {
  ASSEMBLY_PATH,
  DSC_PACKET_ASSEMBLY_PHASE,
  buildDirectSpatialConditioningPacketAssembly,
  type DirectSpatialConditioningPacketAssembly,
} from '../services/directSpatialConditioningPacketAssemblyBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-assembly.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-assembly-implementation-registry-v1.json';

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

/** Resolve a dotted path against an object; true when every segment key exists. */
function pathResolves(root: unknown, dottedPath: string): boolean {
  let current: unknown = root;
  for (const segment of dottedPath.split('.')) {
    if (
      typeof current !== 'object' ||
      current === null ||
      Array.isArray(current) ||
      !Object.prototype.hasOwnProperty.call(current, segment)
    ) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return true;
}

interface ConsumptionRecord {
  source_video_id: string;
  identity: { source_timestamp_ms: number };
  pipeline_bindings: Array<{ slot_id: string; payload: Record<string, unknown> }>;
}

const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  PACKET_PATH,
  VALIDATION_PATH,
  RUNTIME_PACKAGE_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

for (const requiredArtifact of [PACKET_PATH, VALIDATION_PATH, RUNTIME_PACKAGE_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    console.error(FAIL_VERDICT);
    console.error(`PRECHECK FAILED: missing dependency ${requiredArtifact}`);
    process.exit(1);
  }
}

const packet = readJson<DirectSpatialConditioningPacket>(PACKET_PATH);
const runtimePackage = readJson<NumericalReconstructionRuntimePackage>(RUNTIME_PACKAGE_PATH);

let assembly: DirectSpatialConditioningPacketAssembly;
try {
  assembly = buildDirectSpatialConditioningPacketAssembly(projectRoot).assembly;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`ASSEMBLY SPEC FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (assembly.phase !== DSC_PACKET_ASSEMBLY_PHASE) {
  issues.push({ code: 'PHASE', message: assembly.phase });
}
if (assembly.mode !== 'design_only_assembly') {
  issues.push({ code: 'MODE', message: assembly.mode });
}
if (assembly.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: assembly.target });
}
if (assembly.packet_ref !== PACKET_PATH) {
  issues.push({ code: 'PACKET_REF', message: assembly.packet_ref });
}
if (assembly.validation_ref !== VALIDATION_PATH) {
  issues.push({ code: 'VALIDATION_REF', message: assembly.validation_ref });
}
if (assembly.runtime_package_ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({ code: 'RUNTIME_REF', message: assembly.runtime_package_ref });
}
if (JSON.stringify(assembly.sources_supported) !== JSON.stringify([...SOURCE_IDS])) {
  issues.push({ code: 'SOURCES_SUPPORTED', message: `${assembly.sources_supported.length}` });
}

// Required inputs: certified runtime package must be present and read-only.
const inputIds = new Set(assembly.required_inputs.map((entry) => entry.input_id));
for (const required of [
  'certified_runtime_package',
  'source_video_id',
  'packet_id',
  'packet_specification',
  'packet_validation_specification',
]) {
  if (!inputIds.has(required)) {
    issues.push({ code: 'REQUIRED_INPUT_MISSING', message: required });
  }
}
for (const input of assembly.required_inputs) {
  if (!input.read_only) {
    issues.push({ code: 'INPUT_NOT_READ_ONLY', message: input.input_id });
  }
}
const runtimeInput = assembly.required_inputs.find(
  (entry) => entry.input_id === 'certified_runtime_package'
);
if (!runtimeInput || runtimeInput.ref !== RUNTIME_PACKAGE_PATH) {
  issues.push({ code: 'RUNTIME_INPUT_REF', message: runtimeInput?.ref ?? 'missing' });
}

// Assembly order: contiguous, ordered steps.
assembly.assembly_order.forEach((step, index) => {
  if (step.step_index !== index) {
    issues.push({ code: 'STEP_ORDER', message: step.step_id });
  }
  if (!step.description || step.reads.length === 0 || !step.produces) {
    issues.push({ code: 'STEP_INCOMPLETE', message: step.step_id });
  }
});
if (assembly.assembly_order.length < 6) {
  issues.push({ code: 'STEP_COUNT', message: `${assembly.assembly_order.length}` });
}

// Metadata assembly covers every declared packet metadata field.
const metaFields = new Set(assembly.metadata_assembly.map((entry) => entry.field));
for (const field of packet.metadata.fields) {
  if (!metaFields.has(field.field)) {
    issues.push({ code: 'METADATA_FIELD_UNMAPPED', message: field.field });
  }
}
for (const mapping of assembly.metadata_assembly) {
  if (mapping.source_kind === 'runtime_record_field' && !mapping.runtime_record_path) {
    issues.push({ code: 'METADATA_SOURCE_PATH_MISSING', message: mapping.field });
  }
  if (mapping.source_kind === 'constant' && mapping.value === null) {
    issues.push({ code: 'METADATA_CONSTANT_NULL', message: mapping.field });
  }
}

// Channel assembly coverage + ordering.
if (
  JSON.stringify(assembly.channel_assemblies.map((c) => c.channel_id)) !==
  JSON.stringify(CONDITIONING_CHANNEL_IDS)
) {
  issues.push({
    code: 'CHANNEL_ORDER',
    message: assembly.channel_assemblies.map((c) => c.channel_id).join(','),
  });
}

const KNOWN_SLOTS = new Set([
  'edit_rhythm',
  'framing',
  'camera_pose',
  'camera_temporal',
  'subject_temporal',
  'scene_energy',
]);

for (const channel of assembly.channel_assemblies) {
  const payload = packet.channel_payloads.find((p) => p.channel_id === channel.channel_id);
  if (!payload) {
    issues.push({ code: 'PACKET_CHANNEL_MISSING', message: channel.channel_id });
    continue;
  }
  const declared = payload.component_fields.map((c) => c.name);
  const mapped = channel.component_source_mappings.map((m) => m.packet_component);
  if (JSON.stringify(declared) !== JSON.stringify(mapped)) {
    issues.push({ code: 'COMPONENT_COVERAGE', message: channel.channel_id });
  }
  for (const mapping of channel.component_source_mappings) {
    if (!KNOWN_SLOTS.has(mapping.source_consumption_slot)) {
      issues.push({
        code: 'UNKNOWN_SLOT',
        message: `${channel.channel_id}.${mapping.packet_component}`,
      });
    }
    if (mapping.extraction === 'deterministic_label') {
      if (!mapping.label_rule || mapping.label_rule.from_fields.length === 0) {
        issues.push({
          code: 'LABEL_RULE_MISSING',
          message: `${channel.channel_id}.${mapping.packet_component}`,
        });
      }
    } else if (mapping.label_rule !== null) {
      issues.push({
        code: 'UNEXPECTED_LABEL_RULE',
        message: `${channel.channel_id}.${mapping.packet_component}`,
      });
    }
  }
}

// Reuse proof: resolve every mapped runtime path against ALL 15 real consumption
// records referenced by the certified runtime package (read-only).
let resolvedComponentPaths = 0;
let resolvedEnvelopePaths = 0;
for (const sourceId of SOURCE_IDS) {
  const runtimeSource = runtimePackage.sources.find(
    (entry) => entry.source_video_id === sourceId
  );
  if (!runtimeSource) {
    issues.push({ code: 'RUNTIME_SOURCE_MISSING', message: sourceId });
    continue;
  }
  const consumptionRel = runtimeSource.layers.consumption;
  if (!fs.existsSync(path.join(projectRoot, consumptionRel))) {
    issues.push({ code: 'CONSUMPTION_RECORD_MISSING', message: consumptionRel });
    continue;
  }
  const record = readJson<ConsumptionRecord>(consumptionRel);
  const bindingBySlot = new Map(
    record.pipeline_bindings.map((binding) => [binding.slot_id, binding])
  );

  // Envelope runtime_record_field paths resolve at record root.
  for (const channel of assembly.channel_assemblies) {
    for (const envelope of channel.envelope_field_mappings) {
      if (envelope.source_kind === 'runtime_record_field' && envelope.runtime_record_path) {
        if (pathResolves(record, envelope.runtime_record_path)) {
          resolvedEnvelopePaths += 1;
        } else {
          issues.push({
            code: 'ENVELOPE_PATH_UNRESOLVED',
            message: `${sourceId}:${channel.channel_id}.${envelope.field}`,
          });
        }
      }
    }
    // Component payload paths resolve inside the matching slot binding.
    for (const mapping of channel.component_source_mappings) {
      const binding = bindingBySlot.get(mapping.source_consumption_slot);
      if (!binding) {
        issues.push({
          code: 'SLOT_BINDING_MISSING',
          message: `${sourceId}:${mapping.source_consumption_slot}`,
        });
        continue;
      }
      const allPaths = [mapping.payload_path, ...mapping.additional_source_paths];
      const resolvedAll = allPaths.every((p) => pathResolves(binding.payload, p));
      if (resolvedAll) {
        resolvedComponentPaths += 1;
      } else {
        issues.push({
          code: 'COMPONENT_PATH_UNRESOLVED',
          message: `${sourceId}:${mapping.source_consumption_slot}.${mapping.payload_path}`,
        });
      }
    }
  }
}

const constraints = assembly.design_constraints;
if (
  !constraints.assembly_only ||
  !constraints.reuses_certified_runtime_package ||
  constraints.backend !== 'none' ||
  constraints.gpu ||
  constraints.inference ||
  constraints.assembles_packet_instances_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({ code: 'DESIGN_CONSTRAINT_VIOLATION', message: JSON.stringify(constraints) });
}

for (const requiredArtifact of [ASSEMBLY_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(assembly);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_packet_assembly_${Date.now().toString(36)}`,
  phase: DSC_PACKET_ASSEMBLY_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: assembly.mode,
  runtime_package_ref: assembly.runtime_package_ref,
  sources_supported: assembly.sources_supported.length,
  required_input_count: assembly.required_inputs.length,
  assembly_step_count: assembly.assembly_order.length,
  metadata_field_count: assembly.metadata_assembly.length,
  channel_count: assembly.channel_assemblies.length,
  component_mapping_count: assembly.channel_assemblies.reduce(
    (sum, channel) => sum + channel.component_source_mappings.length,
    0
  ),
  resolved_component_paths: resolvedComponentPaths,
  resolved_envelope_paths: resolvedEnvelopePaths,
  design_constraints: assembly.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    assembly: ASSEMBLY_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    packet: PACKET_PATH,
    validation: VALIDATION_PATH,
    runtime_package: RUNTIME_PACKAGE_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_PACKET_ASSEMBLY_VALIDATION_REPORT.json';
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
    `sources=${report.sources_supported}`,
    `required_inputs=${report.required_input_count}`,
    `steps=${report.assembly_step_count}`,
    `component_mappings=${report.component_mapping_count}`,
    `resolved_paths=${report.resolved_component_paths}+${report.resolved_envelope_paths}`,
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
