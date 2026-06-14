import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT,
  ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_STATUS,
  writeEnvironmentIdentityEvidenceReport,
} from '../services/environmentIdentityEvidence.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  process.exit(1);
}

const report = writeEnvironmentIdentityEvidenceReport(projectRoot);

const protocol = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH), 'utf8')
) as {
  evidence_defined: boolean;
  pass_threshold: number;
  false_positive_examples: string[];
  false_negative_examples: string[];
  evidence_measurement_rules: Record<string, string>;
  evidence_scoring_rules: Record<string, string>;
  evidence_traceability_rules: Record<string, string>;
  example_evidence_record: {
    environment_id: string;
    reference_bank_id: string;
    retrieval_signature: string;
    traceability_score: number;
  };
};

const dataset = JSON.parse(
  fs.readFileSync(path.join(projectRoot, ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH), 'utf8')
) as {
  dataset_defined: boolean;
  minimum_batch_size: number;
  easy_batch: unknown[];
  medium_batch: unknown[];
  hard_batch: unknown[];
  stress_batch: Array<{ stress_mode: string }>;
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
    `false_positive_examples_defined=${report.false_positive_examples_defined}`,
    `false_negative_examples_defined=${report.false_negative_examples_defined}`,
    `stress_batch_defined=${report.stress_batch_defined}`,
    `dataset_defined=${report.dataset_defined}`,
    `readiness_defined=${report.readiness_defined}`,
    `evidence_collection_ready=${report.evidence_collection_ready}`,
    `execution_ready=${report.execution_ready}`,
    `evidence_sufficient_for_gpu_authorization=${report.evidence_sufficient_for_gpu_authorization}`,
    `environment_validated=${report.environment_validated}`,
    `gpu_ready=${report.gpu_ready}`,
  ].join(' | ')
);

for (const rel of [
  ENVIRONMENT_IDENTITY_EVIDENCE_PROTOCOL_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_DATASET_PATH,
  ENVIRONMENT_IDENTITY_EVIDENCE_READINESS_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`OUTPUT MISSING: ${rel}`);
    process.exit(1);
  }
}

if (report.final_verdict !== ENVIRONMENT_IDENTITY_EVIDENCE_PASS_VERDICT) {
  console.error('ENVIRONMENT IDENTITY EVIDENCE DEFINITION FAILED');
  for (const issue of report.issues) {
    console.error(`[${issue.severity}] ${issue.code}: ${issue.message}`);
  }
  process.exit(1);
}

if (report.status !== ENVIRONMENT_IDENTITY_EVIDENCE_STATUS) {
  console.error(`STATUS FAIL: expected ${ENVIRONMENT_IDENTITY_EVIDENCE_STATUS}`);
  process.exit(1);
}

if (
  !report.evidence_contract_defined ||
  !report.measurement_rules_defined ||
  !report.scoring_rules_defined ||
  !report.traceability_rules_defined ||
  !report.false_positive_examples_defined ||
  !report.false_negative_examples_defined ||
  !report.stress_batch_defined ||
  !report.dataset_defined ||
  !report.readiness_defined ||
  !protocol.evidence_defined ||
  !dataset.dataset_defined
) {
  console.error('PASS CONDITION FAIL: environment evidence definition checks not met');
  process.exit(1);
}

if (report.evidence_sufficient_for_gpu_authorization !== false) {
  console.error('GPU AUTHORIZATION FAIL: evidence_sufficient_for_gpu_authorization must remain false');
  process.exit(1);
}

if (
  report.environment_validated ||
  report.gpu_validation_executed ||
  report.execution_ready ||
  report.movie_reconstruction_ready ||
  report.gpu_ready
) {
  console.error('CERTIFICATION SCOPE FAIL: must not certify validation executed or environment validated');
  process.exit(1);
}

if (
  !protocol.false_positive_examples.includes('different_staircase_but_similar_architecture') ||
  !protocol.false_negative_examples.includes('same_staircase_with_lighting_variation')
) {
  console.error('EXAMPLE FAIL: required false positive/negative examples missing');
  process.exit(1);
}

if (protocol.pass_threshold !== 0.98) {
  console.error('PASS THRESHOLD FAIL: pass_threshold=0.98 required');
  process.exit(1);
}

if (
  Object.keys(protocol.evidence_measurement_rules).length === 0 ||
  Object.keys(protocol.evidence_scoring_rules).length === 0 ||
  Object.keys(protocol.evidence_traceability_rules).length === 0
) {
  console.error('RULES FAIL: measurement, scoring, and traceability rules required');
  process.exit(1);
}

const stressModes = dataset.stress_batch.map((entry) => entry.stress_mode);
for (const mode of ['extreme_camera_rotation', 'extreme_zoom_change', 'lighting_shift']) {
  if (!stressModes.includes(mode)) {
    console.error(`STRESS BATCH FAIL: missing stress_mode ${mode}`);
    process.exit(1);
  }
}

if (dataset.minimum_batch_size !== 50) {
  console.error('DATASET FAIL: minimum_batch_size=50 required');
  process.exit(1);
}

const example = protocol.example_evidence_record;
if (
  !example.environment_id ||
  !example.reference_bank_id ||
  !example.retrieval_signature ||
  typeof example.traceability_score !== 'number'
) {
  console.error('EXAMPLE EVIDENCE RECORD FAIL: required fields missing');
  process.exit(1);
}

process.exit(0);
