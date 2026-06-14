import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIRECTOR_GRAMMAR_REGISTRY_PATH } from '../services/directorGrammarExtractor.js';
import { PROMOTION_GATE_REPORT_PATH } from '../services/gonegiPipelinePromotionGate.js';
import {
  ANALYSIS_FOUNDATION_MD_PATH,
  ANALYSIS_FOUNDATION_PASS_VERDICT,
  ANALYSIS_FOUNDATION_REPORT_PATH,
  writeMovieAnalysisEngineFoundationReport,
} from '../services/movieAnalysisPlanValidator.js';
import {
  ANALYSIS_PLAN_REGISTRY_PATH,
  ANALYSIS_PLAN_SCHEMA_PATH,
  writeMovieAnalysisPlans,
} from '../services/movieAnalysisPlanBuilder.js';
import { FINAL_SET_PATH } from '../services/sourceVideoFinalSetBuilder.js';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const required of [
  FINAL_SET_PATH,
  DIRECTOR_GRAMMAR_REGISTRY_PATH,
  PROMOTION_GATE_REPORT_PATH,
  ANALYSIS_PLAN_SCHEMA_PATH,
  ANALYSIS_PLAN_REGISTRY_PATH,
]) {
  if (!fs.existsSync(path.join(projectRoot, required))) {
    console.error(`Missing required upstream asset: ${required}`);
    process.exit(1);
  }
}

const { plans, written } = writeMovieAnalysisPlans(projectRoot);
const report = writeMovieAnalysisEngineFoundationReport(projectRoot);

console.log(report.final_verdict);
console.log(
  `plans=${report.plans} source_links=${report.source_links} director_grammar=${report.director_grammar} promotion_gate=${report.promotion_gate}`
);
console.log(
  `frame_extraction=${report.frame_extraction} ocr=${report.ocr} gpu_execution=${report.gpu_execution} external_call_allowed=${report.external_call_allowed} design_only=${report.design_only}`
);
for (const plan of plans) {
  const validation = report.plan_validations.find(
    (v) => v.analysis_plan_id === plan.analysis_plan_id
  );
  console.log(
    `  ${plan.analysis_plan_id} (${plan.source_video_id}): ${validation?.status ?? 'FAIL'} grammar=${plan.director_grammar_ref}`
  );
}
console.log(`written_plans=${written.join(', ')}`);
console.log(`report=${ANALYSIS_FOUNDATION_REPORT_PATH}`);
console.log(`markdown=${ANALYSIS_FOUNDATION_MD_PATH}`);

const errors = report.issues.filter((i) => i.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== ANALYSIS_FOUNDATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  report.plans !== 4 ||
  report.source_links !== 'PASS' ||
  report.director_grammar !== 'PASS' ||
  report.promotion_gate !== 'ALLOW_WITH_WARNING'
) {
  console.error(
    `Expected plans=4 source_links=PASS director_grammar=PASS promotion_gate=ALLOW_WITH_WARNING, got plans=${report.plans} source_links=${report.source_links} director_grammar=${report.director_grammar} promotion_gate=${report.promotion_gate}`
  );
  process.exit(1);
}

process.exit(0);
