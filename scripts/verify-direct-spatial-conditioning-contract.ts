import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCwdMatchesProjectRoot } from '../services/projectRootResolver.js';
import {
  CONDITIONING_CHANNEL_IDS,
  FOUNDATION_PATH,
  SPATIAL_CONDITIONING_CHANNELS,
  SPATIAL_FRAME,
} from '../services/directSpatialConditioningFoundationBuilder.js';
import {
  CONTRACT_PATH,
  CONTRACT_VALIDATION_RULES,
  DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
  buildDirectSpatialConditioningContract,
  type DirectSpatialConditioningContract,
} from '../services/directSpatialConditioningContractBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
assertCwdMatchesProjectRoot(projectRoot);

const PASS_VERDICT = 'PASS_DIRECT_SPATIAL_CONDITIONING_CONTRACT_V1' as const;
const FAIL_VERDICT = 'FAIL_DIRECT_SPATIAL_CONDITIONING_CONTRACT_V1' as const;

interface Issue {
  code: string;
  message: string;
}
const issues: Issue[] = [];

function sha256File(rel: string): string | null {
  const full = path.join(projectRoot, rel);
  if (!fs.existsSync(full)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
}

// Protect foundation + certified upstream from modification by this design-only phase.
const PROTECTED = [
  FOUNDATION_PATH,
  'exports/movie_reconstruction_master/v1/movie-reconstruction-master-package-v1.json',
  'exports/movie_reconstruction_certification/v1/movie-reconstruction-production-certification-v1.json',
];
const preHashes = new Map<string, string | null>();
for (const rel of PROTECTED) preHashes.set(rel, sha256File(rel));

if (!fs.existsSync(path.join(projectRoot, FOUNDATION_PATH))) {
  console.error(FAIL_VERDICT);
  console.error(`PRECHECK FAILED: missing foundation ${FOUNDATION_PATH}`);
  process.exit(1);
}

let contract: DirectSpatialConditioningContract;
try {
  contract = buildDirectSpatialConditioningContract(projectRoot).contract;
} catch (err) {
  console.error(FAIL_VERDICT);
  console.error(`CONTRACT FAILED: ${(err as Error).message}`);
  process.exit(1);
}

for (const rel of PROTECTED) {
  if (preHashes.get(rel) !== sha256File(rel)) {
    issues.push({ code: 'UPSTREAM_MODIFIED', message: rel });
  }
}

if (contract.phase !== DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE)
  issues.push({ code: 'PHASE', message: contract.phase });
if (contract.mode !== 'design_only_contract')
  issues.push({ code: 'MODE', message: contract.mode });
if (contract.target !== PASS_VERDICT)
  issues.push({ code: 'TARGET', message: contract.target });
if (contract.foundation_ref !== FOUNDATION_PATH)
  issues.push({ code: 'FOUNDATION_REF', message: contract.foundation_ref });

const dc = contract.design_constraints;
if (dc.backend !== 'none') issues.push({ code: 'BACKEND', message: dc.backend });
if (dc.gpu || dc.inference || dc.modifies_existing_datasets || dc.placeholders)
  issues.push({ code: 'CONSTRAINT_VIOLATION', message: JSON.stringify(dc) });
if (dc.contract_only !== true)
  issues.push({ code: 'NOT_CONTRACT_ONLY', message: `${dc.contract_only}` });

if (contract.channel_contracts.length !== 6)
  issues.push({ code: 'CHANNEL_COUNT', message: `${contract.channel_contracts.length}` });
if (contract.input_schema.required_channel_count !== 6)
  issues.push({
    code: 'INPUT_CHANNEL_COUNT',
    message: `${contract.input_schema.required_channel_count}`,
  });
if (contract.validation_rules.length < 10)
  issues.push({
    code: 'VALIDATION_RULE_COUNT',
    message: `${contract.validation_rules.length}`,
  });

const seen = new Set<string>();
for (const ch of contract.channel_contracts) {
  if (seen.has(ch.channel_id))
    issues.push({ code: 'DUPLICATE_CHANNEL', message: ch.channel_id });
  seen.add(ch.channel_id);

  if (ch.spatial_frame_ref !== SPATIAL_FRAME.frame_id)
    issues.push({ code: 'FRAME_MISMATCH', message: ch.channel_id });
  if (ch.requires_backend || ch.requires_gpu || ch.performs_inference)
    issues.push({ code: 'RUNTIME_FLAG', message: ch.channel_id });
  if (ch.output_schema.materializes_tensors || ch.output_schema.materializes_frames)
    issues.push({ code: 'MATERIALIZATION', message: ch.channel_id });
  if (!ch.input_schema.fields.components.length)
    issues.push({ code: 'EMPTY_COMPONENTS', message: ch.channel_id });
  if (!ch.validation_rule_ids.length)
    issues.push({ code: 'NO_RULES', message: ch.channel_id });

  const foundation = SPATIAL_CONDITIONING_CHANNELS.find(
    (f) => f.channel_id === ch.channel_id
  );
  if (!foundation) {
    issues.push({ code: 'FOUNDATION_CHANNEL_MISSING', message: ch.channel_id });
  } else {
    const names = ch.input_schema.fields.components.map((c) => c.name);
    if (JSON.stringify(names) !== JSON.stringify([...foundation.value_space.components])) {
      issues.push({ code: 'COMPONENT_DRIFT', message: ch.channel_id });
    }
    if (ch.consumption_slot !== foundation.upstream.consumption_slot)
      issues.push({ code: 'SLOT_DRIFT', message: ch.channel_id });
    if (ch.integrated_layer !== foundation.upstream.integrated_layer)
      issues.push({ code: 'LAYER_DRIFT', message: ch.channel_id });
  }

  for (const comp of ch.input_schema.fields.components) {
    if (!comp.required || comp.nullable)
      issues.push({ code: 'COMPONENT_OPTIONAL_OR_NULLABLE', message: `${ch.channel_id}.${comp.name}` });
    if (!comp.description)
      issues.push({ code: 'COMPONENT_NO_DESCRIPTION', message: `${ch.channel_id}.${comp.name}` });
  }
}

if (
  JSON.stringify([...seen].sort()) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS].sort())
) {
  issues.push({ code: 'CHANNEL_SET_MISMATCH', message: [...seen].join(',') });
}

if (
  JSON.stringify(contract.input_schema.required_channel_ids) !==
  JSON.stringify([...CONDITIONING_CHANNEL_IDS])
) {
  issues.push({ code: 'INPUT_CHANNEL_IDS', message: 'mismatch' });
}

const oc = contract.output_schema;
if (oc.materializes_tensors || oc.materializes_frames || oc.emits_inference)
  issues.push({ code: 'OUTPUT_RUNTIME', message: 'forbidden materialization/inference' });
if (oc.produces !== 'validated_conditioning_bundle')
  issues.push({ code: 'OUTPUT_PRODUCES', message: oc.produces });

const ruleIds = new Set(contract.validation_rules.map((r) => r.rule_id));
if (ruleIds.size !== contract.validation_rules.length)
  issues.push({ code: 'DUPLICATE_RULE_ID', message: 'validation_rules' });
for (const expected of CONTRACT_VALIDATION_RULES) {
  if (!ruleIds.has(expected.rule_id))
    issues.push({ code: 'MISSING_RULE', message: expected.rule_id });
}
for (const rule of contract.validation_rules) {
  if (rule.severity !== 'error')
    issues.push({ code: 'RULE_SEVERITY', message: rule.rule_id });
  if (!rule.description || !rule.predicate)
    issues.push({ code: 'RULE_INCOMPLETE', message: rule.rule_id });
}

const serialized = JSON.stringify(contract);
for (const token of ['TODO', 'PLACEHOLDER', 'FIXME', 'TBD']) {
  if (serialized.includes(token))
    issues.push({ code: 'PLACEHOLDER_TOKEN', message: token });
}

if (!fs.existsSync(path.join(projectRoot, CONTRACT_PATH)))
  issues.push({ code: 'ARTIFACT_MISSING', message: CONTRACT_PATH });

const validationPassed = issues.length === 0;

const report = {
  report_id: `direct_spatial_conditioning_contract_${Date.now().toString(36)}`,
  phase: DIRECT_SPATIAL_CONDITIONING_CONTRACT_PHASE,
  final_verdict: validationPassed ? PASS_VERDICT : FAIL_VERDICT,
  validation_passed: validationPassed,
  mode: contract.mode,
  channel_contracts: contract.channel_contracts.map((c) => ({
    channel_id: c.channel_id,
    component_count: c.input_schema.fields.components.length,
    validation_rule_count: c.validation_rule_ids.length,
  })),
  channel_count: contract.channel_contracts.length,
  validation_rule_count: contract.validation_rules.length,
  spatial_frame: contract.spatial_frame.frame_id,
  design_constraints: contract.design_constraints,
  upstream_protected_unmodified: PROTECTED.every(
    (rel) => preHashes.get(rel) === sha256File(rel)
  ),
  artifacts: {
    contract: CONTRACT_PATH,
    foundation: FOUNDATION_PATH,
    schema:
      'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-contract.schema.json',
    registry:
      'datasets/movie_analysis/numerical_cinematography/movie-analysis-direct-spatial-conditioning-contract-implementation-registry-v1.json',
  },
  error_count: issues.length,
  issues,
  generated_at: new Date().toISOString(),
};

fs.mkdirSync(path.join(projectRoot, 'reports/numerical_cinematography'), {
  recursive: true,
});
fs.writeFileSync(
  path.join(
    projectRoot,
    'reports/numerical_cinematography/DIRECT_SPATIAL_CONDITIONING_CONTRACT_VALIDATION_REPORT.json'
  ),
  `${JSON.stringify(report, null, 2)}\n`,
  'utf8'
);

console.log(report.final_verdict);
console.log(
  [
    `mode=${report.mode}`,
    `channels=${report.channel_count}`,
    `validation_rules=${report.validation_rule_count}`,
    `spatial_frame=${report.spatial_frame}`,
    `upstream_unmodified=${report.upstream_protected_unmodified}`,
    `error_count=${report.error_count}`,
  ].join(' | ')
);

if (!validationPassed) {
  for (const issue of issues) console.error(`[error] ${issue.code}: ${issue.message}`);
  process.exit(1);
}

process.exit(0);
