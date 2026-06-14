import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEMPORAL_FLOW_PASS_VERDICT,
  TEMPORAL_FLOW_REPORT_PATH,
} from '../services/movieAnalysisTemporalFlowValidator.js';
import {
  TEMPORAL_FLOW_REGISTRY_PATH,
} from '../services/movieAnalysisTemporalFlowDesign.js';
import {
  SEQUENCE_ASSEMBLY_MD_PATH,
  SEQUENCE_ASSEMBLY_PASS_VERDICT,
  SEQUENCE_ASSEMBLY_REPORT_PATH,
  writeMovieAnalysisSequenceAssemblyReport,
} from '../services/movieAnalysisSequenceAssemblyValidator.js';
import {
  SEQUENCE_ASSEMBLY_REGISTRY_PATH,
  SEQUENCE_ASSEMBLY_SCHEMA_PATH,
  writeMovieAnalysisSequenceAssemblyPlans,
} from '../services/movieAnalysisSequenceAssemblyDesign.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';
const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

for (const required of [
  TEMPORAL_FLOW_REGISTRY_PATH,
  TEMPORAL_FLOW_REPORT_PATH,
  SEQUENCE_ASSEMBLY_SCHEMA_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const temporalFlowReport = JSON.parse(
  fs.readFileSync(path.join(projectRoot, TEMPORAL_FLOW_REPORT_PATH), 'utf8')
) as { final_verdict?: string };

if (temporalFlowReport.final_verdict !== TEMPORAL_FLOW_PASS_VERDICT) {
  console.error(
    `PRECHECK FAIL: ${TEMPORAL_FLOW_REPORT_PATH} must have ${TEMPORAL_FLOW_PASS_VERDICT}`
  );
  process.exit(1);
}

const { plans, written } = writeMovieAnalysisSequenceAssemblyPlans(projectRoot);
const report = writeMovieAnalysisSequenceAssemblyReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `sequence_assembly_plans=${report.sequence_assembly_plans} temporal_flow_links=${report.temporal_flow_links} source_links=${report.source_links} sequence_categories=${report.sequence_categories} candidate_counts_valid=${report.candidate_counts_valid} estimated_only=${report.estimated_only}`
);
console.log(
  `sequence_assembly_only=${report.sequence_assembly_only} sequence_generation=${report.sequence_generation} video_generation=${report.video_generation} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} planning_only=${report.planning_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.sequence_assembly_id === plan.sequence_assembly_id
  );
  console.log(
    `  ${plan.sequence_assembly_id} ← ${plan.temporal_flow_id}: ${validation?.status ?? 'FAIL'} strategy=${plan.assembly_strategy} sequences=${plan.sequence_candidates.length}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`registry=${SEQUENCE_ASSEMBLY_REGISTRY_PATH}`);
console.log(`report=${SEQUENCE_ASSEMBLY_REPORT_PATH}`);
console.log(`markdown=${SEQUENCE_ASSEMBLY_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== SEQUENCE_ASSEMBLY_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.sequence_assembly_plans !== 4 ||
  report.temporal_flow_links !== 'PASS' ||
  report.source_links !== 'PASS' ||
  report.sequence_categories !== 'PASS' ||
  report.candidate_counts_valid !== 'PASS' ||
  report.estimated_only !== 'PASS'
) {
  console.error(
    `Expected sequence_assembly_plans=4 temporal_flow_links=PASS source_links=PASS sequence_categories=PASS candidate_counts_valid=PASS estimated_only=PASS`
  );
  process.exit(1);
}

process.exit(0);
