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
import {
  DSC_PACKET_VALIDATION_PHASE,
  REJECTION_CODES,
  VALIDATION_PATH,
  buildDirectSpatialConditioningPacketValidation,
  type DirectSpatialConditioningPacketValidation,
  type ValidationCheck,
} from '../services/directSpatialConditioningPacketValidationBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_V1' as const;
const SCHEMA_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-validation.schema.json';
const REGISTRY_PATH =
  'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-packet-validation-implementation-registry-v1.json';

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
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const before = new Map(protectedPaths.map((entry) => [entry, sha256(entry)]));

if (!fs.existsSync(path.join(projectRoot, PACKET_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing packet specification ${PACKET_PATH}`);
  process.exit(1);
}

const packet = readJson<DirectSpatialConditioningPacket>(PACKET_PATH);

let validation: DirectSpatialConditioningPacketValidation;
try {
  validation = buildDirectSpatialConditioningPacketValidation(projectRoot).validation;
} catch (error) {
  console.error(FAIL_VERDICT);
  console.error(`VALIDATION SPEC FAILED: ${(error as Error).message}`);
  process.exit(1);
}

for (const relativePath of protectedPaths) {
  if (before.get(relativePath) !== sha256(relativePath)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: relativePath });
  }
}

if (validation.phase !== DSC_PACKET_VALIDATION_PHASE) {
  issues.push({ code: 'PHASE', message: validation.phase });
}
if (validation.mode !== 'design_only_validation') {
  issues.push({ code: 'MODE', message: validation.mode });
}
if (validation.target !== PASS_VERDICT) {
  issues.push({ code: 'TARGET', message: validation.target });
}
if (validation.packet_ref !== PACKET_PATH) {
  issues.push({ code: 'PACKET_REF', message: validation.packet_ref });
}

const procedure = validation.validation_procedure;
if (
  JSON.stringify(procedure.ordered_stages) !==
  JSON.stringify(['structural', 'metadata', 'channel_payload', 'cross_channel'])
) {
  issues.push({ code: 'STAGE_ORDER', message: procedure.ordered_stages.join(',') });
}
if (
  procedure.evaluation !== 'collect_all_rejections' ||
  JSON.stringify(procedure.outcome_values) !== JSON.stringify(['accepted', 'rejected'])
) {
  issues.push({ code: 'PROCEDURE', message: JSON.stringify(procedure) });
}

// Rejection code catalog integrity.
const codeSet = new Set<string>();
for (const rejection of validation.rejection_codes) {
  if (codeSet.has(rejection.code)) {
    issues.push({ code: 'DUPLICATE_REJECTION_CODE', message: rejection.code });
  }
  codeSet.add(rejection.code);
  if (!/^DSC_REJ_[A-Z0-9_]+$/.test(rejection.code)) {
    issues.push({ code: 'REJECTION_CODE_FORMAT', message: rejection.code });
  }
  if (rejection.severity !== 'reject') {
    issues.push({ code: 'REJECTION_SEVERITY', message: rejection.code });
  }
  if (!rejection.description || !rejection.remediation) {
    issues.push({ code: 'REJECTION_INCOMPLETE', message: rejection.code });
  }
}
for (const expected of REJECTION_CODES) {
  if (!codeSet.has(expected.code)) {
    issues.push({ code: 'MISSING_REJECTION_CODE', message: expected.code });
  }
}
for (const category of ['structural', 'metadata', 'channel_payload', 'cross_channel']) {
  if (!validation.rejection_codes.some((entry) => entry.category === category)) {
    issues.push({ code: 'REJECTION_CATEGORY_EMPTY', message: category });
  }
}

// Every declared check must be complete and bound to a catalogued rejection code.
const checkIds = new Set<string>();
function auditChecks(checks: ValidationCheck[], expectedStage: string): void {
  for (const check of checks) {
    if (checkIds.has(check.check_id)) {
      issues.push({ code: 'DUPLICATE_CHECK_ID', message: check.check_id });
    }
    checkIds.add(check.check_id);
    if (check.stage !== expectedStage) {
      issues.push({ code: 'CHECK_STAGE', message: check.check_id });
    }
    if (!check.description || !check.predicate || !check.applies_to) {
      issues.push({ code: 'CHECK_INCOMPLETE', message: check.check_id });
    }
    if (!codeSet.has(check.rejection_code)) {
      issues.push({ code: 'CHECK_UNKNOWN_REJECTION_CODE', message: check.check_id });
    }
  }
}

auditChecks(validation.structural_checks, 'structural');
auditChecks(validation.metadata_checks, 'metadata');
auditChecks(validation.cross_channel_checks, 'cross_channel');

// Metadata coverage: every declared packet metadata field must be validated.
const metadataTargets = new Set(
  validation.metadata_checks.map((check) => check.applies_to)
);
for (const field of packet.metadata.fields) {
  if (!metadataTargets.has(`metadata.${field.field}`)) {
    issues.push({ code: 'METADATA_FIELD_UNVALIDATED', message: field.field });
  }
}

// Channel payload coverage: envelope fields and components must all be validated.
if (validation.channel_payload_validations.length !== 6) {
  issues.push({
    code: 'CHANNEL_VALIDATION_COUNT',
    message: `${validation.channel_payload_validations.length}`,
  });
}
const seenChannels: string[] = [];
for (const channelValidation of validation.channel_payload_validations) {
  seenChannels.push(channelValidation.channel_id);
  auditChecks(channelValidation.envelope_checks, 'channel_payload');
  auditChecks(channelValidation.component_checks, 'channel_payload');

  if (!channelValidation.closed_component_set) {
    issues.push({ code: 'OPEN_COMPONENT_SET', message: channelValidation.channel_id });
  }

  const payload = packet.channel_payloads.find(
    (entry) => entry.channel_id === channelValidation.channel_id
  );
  if (!payload) {
    issues.push({ code: 'PACKET_CHANNEL_MISSING', message: channelValidation.channel_id });
    continue;
  }
  if (channelValidation.payload_id !== payload.payload_id) {
    issues.push({ code: 'PAYLOAD_ID_DRIFT', message: channelValidation.channel_id });
  }

  const envelopeTargets = new Set(
    channelValidation.envelope_checks.map((check) => check.applies_to)
  );
  for (const field of payload.envelope_fields) {
    if (!envelopeTargets.has(`${payload.channel_id}.${field.field}`)) {
      issues.push({
        code: 'ENVELOPE_FIELD_UNVALIDATED',
        message: `${payload.channel_id}.${field.field}`,
      });
    }
  }

  const componentTargets = new Set(
    channelValidation.component_checks.map((check) => check.applies_to)
  );
  for (const component of payload.component_fields) {
    if (
      !componentTargets.has(`${payload.channel_id}.components.${component.name}`)
    ) {
      issues.push({
        code: 'COMPONENT_UNVALIDATED',
        message: `${payload.channel_id}.components.${component.name}`,
      });
    }
  }
  if (!componentTargets.has(`${payload.channel_id}.components`)) {
    issues.push({ code: 'CLOSED_SET_CHECK_MISSING', message: payload.channel_id });
  }
}

if (JSON.stringify(seenChannels) !== JSON.stringify(CONDITIONING_CHANNEL_IDS)) {
  issues.push({ code: 'CHANNEL_SET_MISMATCH', message: seenChannels.join(',') });
}

// Cross-channel coverage must include the required consistency dimensions.
const crossCodes = new Set(
  validation.cross_channel_checks.map((check) => check.rejection_code)
);
for (const required of [
  'DSC_REJ_CHANNEL_SET_INCOMPLETE',
  'DSC_REJ_CHANNEL_DUPLICATE',
  'DSC_REJ_SOURCE_ID_DIVERGENT',
  'DSC_REJ_FRAME_DIVERGENT',
  'DSC_REJ_CHANNEL_COUNT_DIVERGENT',
  'DSC_REJ_EDIT_RHYTHM_LENGTH_MISMATCH',
]) {
  if (!crossCodes.has(required)) {
    issues.push({ code: 'CROSS_CHANNEL_COVERAGE', message: required });
  }
}

// Spatial frame must stay locked to the foundation frame.
if (!JSON.stringify(validation).includes(SPATIAL_FRAME.frame_id)) {
  issues.push({ code: 'SPATIAL_FRAME_UNREFERENCED', message: SPATIAL_FRAME.frame_id });
}

const constraints = validation.design_constraints;
if (
  !constraints.validation_only ||
  constraints.backend !== 'none' ||
  constraints.gpu ||
  constraints.inference ||
  constraints.validates_packet_instances_in_this_phase ||
  constraints.modifies_existing_datasets ||
  constraints.placeholders
) {
  issues.push({
    code: 'DESIGN_CONSTRAINT_VIOLATION',
    message: JSON.stringify(constraints),
  });
}

for (const requiredArtifact of [VALIDATION_PATH, SCHEMA_PATH, REGISTRY_PATH]) {
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

const channelCheckCount = validation.channel_payload_validations.reduce(
  (sum, entry) => sum + entry.envelope_checks.length + entry.component_checks.length,
  0
);
const totalChecks =
  validation.structural_checks.length +
  validation.metadata_checks.length +
  validation.cross_channel_checks.length +
  channelCheckCount;

const validationPassed = issues.length === 0;
const report = {
  report_id: `direct_spatial_conditioning_packet_validation_${Date.now().toString(36)}`,
  phase: DSC_PACKET_VALIDATION_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: validation.mode,
  stages: validation.validation_procedure.ordered_stages,
  structural_check_count: validation.structural_checks.length,
  metadata_check_count: validation.metadata_checks.length,
  channel_payload_check_count: channelCheckCount,
  cross_channel_check_count: validation.cross_channel_checks.length,
  total_check_count: totalChecks,
  rejection_code_count: validation.rejection_codes.length,
  design_constraints: validation.design_constraints,
  upstream_protected_unmodified: protectedPaths.every(
    (entry) => before.get(entry) === sha256(entry)
  ),
  artifacts: {
    validation: VALIDATION_PATH,
    schema: SCHEMA_PATH,
    registry: REGISTRY_PATH,
    packet: PACKET_PATH,
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

const reportPath =
  'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_PACKET_VALIDATION_VALIDATION_REPORT.json';
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
    `metadata=${report.metadata_check_count}`,
    `payload=${report.channel_payload_check_count}`,
    `cross_channel=${report.cross_channel_check_count}`,
    `rejection_codes=${report.rejection_code_count}`,
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
