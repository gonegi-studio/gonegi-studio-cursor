import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONTRACT_PATH,
  type DirectSpatialConditioningContract,
} from '../services/directSpatialConditioningContractBuilder.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_FRAME,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import {
  DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
  PACKET_PATH,
  buildDirectSpatialConditioningPacket,
  type DirectSpatialConditioningPacket,
} from '../services/directSpatialConditioningPacketBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_PACKET_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-implementation-registry-v1.json';

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
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')
  ) as T;
}

const protectedPaths = [
  FOUNDATION_PATH,
  CONTRACT_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, CONTRACT_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing contract ${CONTRACT_PATH}`);
  process.exit(1);
}

const contract = readJson<DirectSpatialConditioningContract>(CONTRACT_PATH);
let packet: DirectSpatialConditioningPacket;
try {
  packet = buildDirectSpatialConditioningPacket(projectRoot).packet;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`PACKET FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (packet.phase !== DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE) {
  issues.push({ code: 'PHASE', message: packet.phase });
}
if (packet.mode !== 'design_only_packet') {
  issues.push({ code: 'MODE', message: packet.mode });
}
if (packet.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: packet.target });
}
if (packet.contract_ref !== CONTRACT_PATH) {
  issues.push({ code: 'CONTRACT_REF', message: packet.contract_ref });
}

const structure = packet.packet_structure;
if (
  structure.packet_type !== 'direct_spatial_conditioning_packet' ||
  structure.packet_version !== 'v1' ||
  structure.encoding !== 'application/json'
) {
  issues.push({ code: 'PACKET_STRUCTURE', message: JSON.stringify(structure) });
}
if (
  structure.channel_cardinality !== 6 ||
  structure.additional_channels ||
  JSON.stringify(structure.required_sections) !==
    JSON.stringify(['metadata', 'channels'])
) {
  issues.push({ code: 'PACKET_CARDINALITY', message: JSON.stringify(structure) });
}
if (
  JSON.stringify(structure.channel_order) !==
  JSON.stringify(CONDITIONING_CHANNEL_IDS)
) {
  issues.push({ code: 'CHANNEL_ORDER', message: structure.channel_order.join(',') });
}

const metadataFields = new Set(packet.metadata.fields.map((entry) => entry.field));
for (const required of [
  'packet_id',
  'packet_version',
  'source_video_id',
  'spatial_frame_ref',
  'timebase',
  'contract_id',
  'channel_count',
]) {
  if (!metadataFields.has(required)) {
    issues.push({ code: 'METADATA_FIELD_MISSING', message: required });
  }
}
if (
  packet.metadata.fields.length !== 7 ||
  packet.metadata.spatial_frame_ref !== SPATIAL_FRAME.frame_id
) {
  issues.push({ code: 'METADATA_SCHEMA', message: packet.metadata.schema_id });
}
for (const field of packet.metadata.fields) {
  if (!field.required || field.nullable || !field.constraint) {
    issues.push({ code: 'METADATA_FIELD_INCOMPLETE', message: field.field });
  }
}

if (packet.channel_payloads.length !== 6) {
  issues.push({
    code: 'CHANNEL_PAYLOAD_COUNT',
    message: `${packet.channel_payloads.length}`,
  });
}
const seenChannels = new Set<string>();
for (const payload of packet.channel_payloads) {
  if (seenChannels.has(payload.channel_id)) {
    issues.push({ code: 'DUPLICATE_CHANNEL', message: payload.channel_id });
  }
  seenChannels.add(payload.channel_id);
  if (payload.serialization !== 'json_object' || payload.additional_components) {
    issues.push({ code: 'PAYLOAD_SHAPE', message: payload.channel_id });
  }
  if (payload.envelope_fields.length !== 5) {
    issues.push({ code: 'ENVELOPE_FIELD_COUNT', message: payload.channel_id });
  }
  for (const field of payload.envelope_fields) {
    if (!field.required || field.nullable || !field.constraint) {
      issues.push({
        code: 'ENVELOPE_FIELD_INCOMPLETE',
        message: `${payload.channel_id}.${field.field}`,
      });
    }
  }

  const contractChannel = contract.channel_contracts.find(
    (entry) => entry.channel_id === payload.channel_id
  );
  if (!contractChannel) {
    issues.push({ code: 'CONTRACT_CHANNEL_MISSING', message: payload.channel_id });
    continue;
  }
  if (
    payload.contract_input_schema_ref !== contractChannel.input_schema.schema_id
  ) {
    issues.push({ code: 'INPUT_SCHEMA_REF', message: payload.channel_id });
  }
  if (
    JSON.stringify(payload.component_fields) !==
    JSON.stringify(contractChannel.input_schema.fields.components)
  ) {
    issues.push({ code: 'COMPONENT_SCHEMA_DRIFT', message: payload.channel_id });
  }
  for (const component of payload.component_fields) {
    if (!component.required || component.nullable || !component.description) {
      issues.push({
        code: 'COMPONENT_INCOMPLETE',
        message: `${payload.channel_id}.${component.name}`,
      });
    }
  }
}

if (
  JSON.stringify([...seenChannels]) !== JSON.stringify(CONDITIONING_CHANNEL_IDS)
) {
  issues.push({
    code: 'CHANNEL_SET_MISMATCH',
    message: [...seenChannels].join(','),
  });
}

if (packet.packet_invariants.length < 6) {
  issues.push({
    code: 'PACKET_INVARIANTS',
    message: `${packet.packet_invariants.length}`,
  });
}

const constraints = packet.design_constraints;
if (
  !constraints.packet_only ||
  constraints.backend !== 'none' ||
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

for (const requiredArtifact of [PACKET_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
  if (!fs.existsSync(path.join(projectRoot, requiredArtifact))) {
    issues.push({ code: 'ARTIFACT_MISSING', message: requiredArtifact });
  }
}

const serialized = JSON.stringify(packet);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token)) {
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
  }
}

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_packet_${Date.now().toString(36)}`,
  phase: DIRECT_SPATIAL_CONDITIONING_PACKET_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: packet.mode,
  packet_type: packet.packet_structure.packet_type,
  metadata_field_count: packet.metadata.fields.length,
  channel_payload_count: packet.channel_payloads.length,
  component_field_count: packet.channel_payloads.reduce(
    (sum, payload) => sum + payload.component_fields.length,
    0
  ),
  packet_invariant_count: packet.packet_invariants.length,
  design_constraints: packet.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    packet: PACKET_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    contract: CONTRACT_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_REPORT.json';
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
    `metadata_fields=${report.metadata_field_count}`,
    `channel_payloads=${report.channel_payload_count}`,
    `component_fields=${report.component_field_count}`,
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
