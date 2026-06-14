import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_PASS_VERDICT,
  TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_STATUS,
  writeTemporalPreservationEvidenceReport,
} from '../services/temporalPreservationEvidence.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeTemporalPreservationEvidenceReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH), 'utf8')
) as {
  evidence_defined: boolean;
  pass_threshold: number;
  temporal_degradation_levels: {
    strict_timeline: number;
    minor_drift: number;
    moderate_drift: number;
    critical_drift: number;
    timeline_break: number;
  };
  causal_failure_examples: string[];
  false_positive_examples: string[];
  false_negative_examples: string[];
  temporal_measurement_rules: Record<string, string>;
  temporal_scoring_rules: Record<string, string>;
  temporal_traceability_rules: Record<string, string>;
  example_evidence_record: {
    timeline_id: string;
    causal_transition_chain_ref: string;
    memory_signature: string;
    traceability_score: number;
  };
};

const dataset = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH), 'utf8')
) as {
  dataset_defined: boolean;
  minimum_batch_size: number;
  easy_batch: unknown[];
  medium_batch: unknown[];
  hard_batch: unknown[];
  stress_batch: unknown[];
  long_horizon_batch: Array<{ horizon_mode: string }>;
};

console.log(report.final_verdict);
console.log(
  [
    `status=${report.status}`,
    `validation_passed=${report.validation_passed}`,
    `evidence_contract_defined=${report.evidence_contract_defined}`,
    `measurement_rules_defined=${report.measurement_rules_defined}`,
    `scoring_rules_defined=${report.scoring_rules_defined}`,
    `traceability_rules_defined=${report.traceability_rules_defined}`,
    `temporal_degradation_levels_defined=${report.temporal_degradation_levels_defined}`,
    `causal_failure_examples_defined=${report.causal_failure_examples_defined}`,
    `false_positive_examples_defined=${report.false_positive_examples_defined}`,
    `false_negative_examples_defined=${report.false_negative_examples_defined}`,
    `stress_batch_defined=${report.stress_batch_defined}`,
    `long_horizon_batch_defined=${report.long_horizon_batch_defined}`,
    `timeline_recoverability_defined=${report.timeline_recoverability_defined}`,
    `dataset_defined=${report.dataset_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `evidence_collection_ready=${report.evidence_collection_ready}`,
    `execution_ready=${report.execution_ready}`,
    `highest_risk_area=${report.highest_risk_area}`,
    `timeline_recoverability=${report.timeline_recoverability}`,
    `evidence_sufficient_for_gpu_authorization=${report.evidence_sufficient_for_gpu_authorization}`,
    `temporal_validated=${report.temporal_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  TEMPORAL_PRESERVATION_EVIDENCE_PROTOCOL_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_DATASET_PATH,
  TEMPORAL_PRESERVATION_EVIDENCE_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== TEMPORAL_PRESERVATION_EVIDENCE_PASS_VERDICT) {
  console.error('TEMPORAL PRESERVATION EVIDENCE DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== TEMPORAL_PRESERVATION_EVIDENCE_STATUS) {
  console.error(`STATUS FAIL: expected ${TEMPORAL_PRESERVATION_EVIDENCE_STATUS}`);
  process.exit(1);
}

if (
  !report.evidence_contract_defined ||
  !report.measurement_rules_defined ||
  !report.scoring_rules_defined ||
  !report.traceability_rules_defined ||
  !report.temporal_degradation_levels_defined ||
  !report.causal_failure_examples_defined ||
  !report.false_positive_examples_defined ||
  !report.false_negative_examples_defined ||
  !report.stress_batch_defined ||
  !report.long_horizon_batch_defined ||
  !report.timeline_recoverability_defined ||
  !report.dataset_defined ||
  !report.readiness_defined ||
  !protocol.evidence_defined ||
  !dataset.dataset_defined
) {
  console.error('PASS CONDITION FAIL: temporal evidence definition checks not met');
  process.exit(1);
}

if (report.evidence_sufficient_for_gpu_authorization !== false) {
  console.error('GPU AUTHORIZATION FAIL: evidence_sufficient_for_gpu_authorization must remain false');
  process.exit(1);
}

if (
  report.temporal_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or temporal validated');
  process.exit(1);
}

const degradation = protocol.temporal_degradation_levels;
if (
  degradation.strict_timeline !== 0.95 ||
  degradation.minor_drift !== 0.85 ||
  degradation.moderate_drift !== 0.7 ||
  degradation.critical_drift !== 0.5 ||
  degradation.timeline_break !== 0.3
) {
  console.error('DEGRADATION LEVELS FAIL: required temporal degradation thresholds not met');
  process.exit(1);
}

const requiredCausalFailures = [
  'missing_cause',
  'incorrect_effect',
  'reordered_event',
  'timeline_inversion',
];
for (const example of requiredCausalFailures) {
  if (!protocol.causal_failure_examples.includes(example)) {
    console.error(`CAUSAL FAILURE EXAMPLE MISSING: ${example}`);
    process.exit(1);
  }
}

if (report.highest_risk_area !== 'causal_transition_chain') {
  console.error('HIGHEST RISK AREA FAIL: expected causal_transition_chain');
  process.exit(1);
}

if (report.timeline_recoverability !== 'LOW') {
  console.error('TIMELINE RECOVERABILITY FAIL: expected LOW');
  process.exit(1);
}

if (protocol.pass_threshold !== 0.95) {
  console.error('PASS THRESHOLD FAIL: pass_threshold=0.95 required');
  process.exit(1);
}

const horizonModes = dataset.long_horizon_batch.map((entry) => entry.horizon_mode);
for (const mode of ['callback_after_20_scenes', 'callback_after_50_scenes', 'callback_after_100_scenes']) {
  if (!horizonModes.includes(mode)) {
    console.error(`LONG HORIZON BATCH FAIL: missing horizon_mode ${mode}`);
    process.exit(1);
  }
}

if (dataset.minimum_batch_size !== 30) {
  console.error('DATASET FAIL: minimum_batch_size=30 required');
  process.exit(1);
}

if (
  Object.keys(protocol.temporal_measurement_rules).length === 0 ||
  Object.keys(protocol.temporal_scoring_rules).length === 0 ||
  Object.keys(protocol.temporal_traceability_rules).length === 0
) {
  console.error('RULES FAIL: measurement, scoring, and traceability rules required');
  process.exit(1);
}

const example = protocol.example_evidence_record;
if (
  !example.timeline_id ||
  !example.causal_transition_chain_ref ||
  !example.memory_signature ||
  typeof example.traceability_score !== 'number'
) {
  console.error('EXAMPLE EVIDENCE RECORD FAIL: required fields missing');
  process.exit(1);
}

process.exit(0);
