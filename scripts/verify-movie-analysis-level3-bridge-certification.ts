import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXPECTED_ADAPTER_COUNT, EXPECTED_SOURCE_COUNT } from '../services/movieAnalysisDnaPackaging.js';
import {
  LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
  LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
  LEVEL2_COMPLETE_FINAL_STATUS,
} from '../services/movieAnalysisLevel2CompletenessAudit.js';
import {
  LEVEL2_COMPLETE_STATUS,
  LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
  LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
} from '../services/movieAnalysisLevel2MasterCertificationV3.js';
import {
  LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
  LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisLevel2RobustnessAudit.js';
import {
  LEVEL2_ASSET_COUNT,
  LEVEL3_BRIDGE_CERTIFICATION_DIR,
  LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR,
  LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH,
  LEVEL3_BRIDGE_CERTIFICATION_MD_PATH,
  LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT,
  LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH,
  LEVEL3_ENTRY_APPROVED_STATUS,
  LEVEL3_ENTRY_GATE_COUNT,
  LEVEL3_READY_STATUS,
  writeMovieAnalysisLevel3BridgeCertification,
} from '../services/movieAnalysisLevel3BridgeCertification.js';
import {
  LEVEL2_COMPLETE_FINAL_MAX_STATUS,
  REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT,
  REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
} from '../services/movieAnalysisRealWorldGeneralizationAudit.js';

const EXPECTED_CWD = 'C:\\Users\\danie\\OneDrive\\바탕 화면\\Gonegi-Studio-Cursor';

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

if (process.cwd() !== EXPECTED_CWD && path.resolve(process.cwd()) !== path.resolve(EXPECTED_CWD)) {
  console.error(`PRECHECK FAIL: process.cwd() must be ${EXPECTED_CWD}`);
  console.error(`Got: ${process.cwd()}`);
  process.exit(1);
}

const prechecks = [
  {
    path: LEVEL2_MASTER_CERTIFICATION_V3_REPORT_PATH,
    passVerdict: LEVEL2_MASTER_CERTIFICATION_V3_PASS_VERDICT,
    status: LEVEL2_COMPLETE_STATUS,
  },
  {
    path: LEVEL2_COMPLETENESS_AUDIT_REPORT_PATH,
    passVerdict: LEVEL2_COMPLETENESS_AUDIT_PASS_VERDICT,
    status: LEVEL2_COMPLETE_FINAL_STATUS,
  },
  {
    path: LEVEL2_ROBUSTNESS_AUDIT_REPORT_PATH,
    passVerdict: LEVEL2_ROBUSTNESS_AUDIT_PASS_VERDICT,
    status: LEVEL2_COMPLETE_FINAL_PLUS_STATUS,
  },
  {
    path: REAL_WORLD_GENERALIZATION_AUDIT_REPORT_PATH,
    passVerdict: REAL_WORLD_GENERALIZATION_AUDIT_PASS_VERDICT,
    status: LEVEL2_COMPLETE_FINAL_MAX_STATUS,
  },
] as const;

for (const precheck of prechecks) {
  const reportPath = path.join(projectRoot, precheck.path);
  if (!fs.existsSync(reportPath)) {
    console.error(`PRECHECK FAIL: Missing required upstream asset: ${precheck.path}`);
    process.exit(1);
  }

  const upstream = JSON.parse(fs.readFileSync(reportPath, 'utf8')) as {
    final_verdict: string;
    certification_status?: string | null;
    final_certification_status?: string | null;
  };

  if (upstream.final_verdict !== precheck.passVerdict) {
    console.error(`PRECHECK FAIL: ${precheck.path} must be ${precheck.passVerdict}`);
    process.exit(1);
  }

  const status = upstream.final_certification_status ?? upstream.certification_status;
  if (status !== precheck.status) {
    console.error(`PRECHECK FAIL: ${precheck.path} status must be ${precheck.status}`);
    process.exit(1);
  }
}

const report = writeMovieAnalysisLevel3BridgeCertification(projectRoot);

console.log(report.final_verdict);
console.log(
  `status=${report.certification_status ?? 'NONE'} final_output=${report.final_output_status ?? 'NONE'} source_count=${report.source_count} adapter_count=${report.adapter_count} level2_assets_complete=${report.level2_assets_complete} production_ready=${report.production_ready} production_asset_ready=${report.production_asset_ready} dataset_export_ready=${report.dataset_export_ready} image_pipeline_ready=${report.image_pipeline_ready} video_pipeline_ready=${report.video_pipeline_ready} cross_module_ready=${report.cross_module_ready} generation_ready=${report.generation_ready} traceability_preserved=${report.traceability_preserved} dna_traceability_preserved=${report.dna_traceability_preserved} adapter_traceability_preserved=${report.adapter_traceability_preserved} pipeline_traceability_preserved=${report.pipeline_traceability_preserved} cross_level_traceability_preserved=${report.cross_level_traceability_preserved} level2_asset_missing=${report.level2_asset_missing} export_failure=${report.export_failure} production_not_ready=${report.production_not_ready} image_pipeline_break=${report.image_pipeline_break} video_pipeline_break=${report.video_pipeline_break} traceability_loss=${report.traceability_loss} bridge_failure=${report.bridge_failure} level3_entry_ready=${report.level3_entry_ready} level3_bridge_certification_ready=${report.level3_bridge_certification_ready}`
);
for (const asset of report.level2_asset_audits) {
  console.log(`  asset ${asset.asset_id}: ready=${asset.asset_ready}`);
}
for (const gate of report.level3_entry_gates) {
  console.log(`  ${gate.gate_id}: passed=${gate.gate_passed} ${gate.from_stage}→${gate.to_stage}`);
}
console.log(`report=${LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH}`);
console.log(`markdown=${LEVEL3_BRIDGE_CERTIFICATION_MD_PATH}`);
console.log(`manifest=${LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH}`);

const errors = report.issues.filter((issue) => issue.severity === 'error');
if (errors.length > 0) {
  for (const err of errors) {
    console.error(`[${err.code}] ${err.message}`);
  }
  process.exit(1);
}

if (report.final_verdict !== LEVEL3_BRIDGE_CERTIFICATION_PASS_VERDICT) {
  process.exit(1);
}

if (
  !fs.existsSync(path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_REPORT_PATH)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR)) ||
  !fs.existsSync(path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_MANIFEST_PATH)) ||
  !fs.existsSync(
    path.join(projectRoot, LEVEL3_BRIDGE_CERTIFICATION_EXPORT_DIR, 'level3-bridge-certification.json')
  ) ||
  report.source_count !== EXPECTED_SOURCE_COUNT ||
  report.adapter_count !== EXPECTED_ADAPTER_COUNT ||
  report.level2_asset_count !== LEVEL2_ASSET_COUNT ||
  report.level3_entry_gate_count !== LEVEL3_ENTRY_GATE_COUNT ||
  report.level2_assets_complete !== true ||
  report.production_ready !== true ||
  report.image_pipeline_ready !== 'PASS' ||
  report.video_pipeline_ready !== 'PASS' ||
  report.traceability_preserved !== true ||
  report.level3_entry_ready !== true ||
  report.level3_bridge_certification_ready !== 'PASS' ||
  report.certification_status !== LEVEL3_READY_STATUS ||
  report.final_output_status !== LEVEL3_ENTRY_APPROVED_STATUS ||
  report.level2_asset_missing !== false ||
  report.export_failure !== false ||
  report.production_not_ready !== false ||
  report.image_pipeline_break !== false ||
  report.video_pipeline_break !== false ||
  report.traceability_loss !== false ||
  report.bridge_failure !== false ||
  report.level2_asset_audits.length !== LEVEL2_ASSET_COUNT ||
  report.level3_entry_gates.length !== LEVEL3_ENTRY_GATE_COUNT ||
  report.level2_asset_audits.every((asset) => asset.asset_ready === 'PASS') === false ||
  report.level3_entry_gates.every((gate) => gate.gate_passed === 'PASS') === false
) {
  console.error(
    'Expected PASS with level2_assets_complete, production_ready, traceability_preserved, LEVEL3_READY, and LEVEL3_ENTRY_APPROVED'
  );
  process.exit(1);
}

process.exit(0);
